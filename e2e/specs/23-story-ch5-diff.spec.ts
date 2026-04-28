/**
 * Story 章節 5：Diff 能耐 — 編輯前後對比
 *
 * 流程（單一 test 多階段）：
 *   1. API 建立一篇示範文件（v1）
 *   2. API 更新內容（v2）— 同時新增、刪除、修改幾行
 *   3. API 再更新（v3）— 加章節、改數字
 *   4. 進 view 頁截圖（顯示「版本歷史」按鈕）
 *   5. 進 versions 頁，左側列表顯示三版本
 *   6. 點 v2 → 右側顯示 v2 vs v1 的 diff（綠+紅）
 *   7. 點 v3 → 右側顯示 v3 vs v2 的 diff
 *   8. 點 v1 → 右側顯示初始版本（全綠）
 */

import { test } from '@playwright/test'
import { loginAsAdmin } from '../fixtures/auth'
import { ApiHelper } from '../fixtures/api'
import { waitReady, shot, ensureDir } from '../fixtures/shot'
import * as path from 'path'
import * as fs from 'fs'

const SHOT_DIR = path.join(__dirname, '../artifacts/manual-shots/story')
ensureDir(SHOT_DIR)
const STATE_FILE = path.join(__dirname, '../artifacts/story-state.json')

const PREFIX = '[STORY]'
const DOC_TITLE = `${PREFIX} Diff示範_首頁載入優化`

test.setTimeout(180000)

const V1_CONTENT = `# 首頁載入優化

## 目標
首頁從 3 秒降到 1.5 秒以內。

## 現況
- 圖片未壓縮
- JS bundle 太大（1.2MB）
- 沒有 lazy load

## 計畫
1. 壓縮圖片
2. Code splitting
3. 加入 lazy load
`

const V2_CONTENT = `# 首頁載入優化

## 目標
首頁從 3 秒降到 1.2 秒以內。

## 現況
- 圖片未壓縮
- JS bundle 太大（1.2MB）
- 沒有 lazy load
- 第三方追蹤腳本阻塞渲染

## 計畫
1. 壓縮圖片（WebP）
2. Code splitting
3. 加入 lazy load
4. 延遲載入第三方腳本
`

const V3_CONTENT = `# 首頁載入優化

## 目標
首頁從 3 秒降到 1.0 秒以內。

## 現況
- 圖片未壓縮
- JS bundle 太大（1.2MB）
- 沒有 lazy load
- 第三方追蹤腳本阻塞渲染

## 計畫
1. 壓縮圖片（WebP）
2. Code splitting
3. 加入 lazy load
4. 延遲載入第三方腳本
5. 啟用 HTTP/2 Server Push

## 預期成果
- LCP < 1.0s
- CLS < 0.1
- TBT < 200ms
`

test('ch5: Diff 能耐 — 三版本對比（單一 test 多階段截圖）', async ({ page }) => {
  const api = await ApiHelper.create()
  const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'))
  const projectId = state.projectId

  await page.setViewportSize({ width: 1440, height: 900 })
  await loginAsAdmin(page)

  // 取需求資料夾
  const cats: any[] = await api.listCategoriesByProject(projectId).catch(() => [])
  const cat = (cats || []).find((c: any) => c.name && c.name.includes('需求'))
  const categoryId = cat?.id

  // ── 階段 1：API 建文件（v1）────────────────────────────────
  const createRes = await api.raw
    .post('/api/docDocuments:create', {
      data: {
        title: DOC_TITLE,
        content: V1_CONTENT,
        contentType: 'markdown',
        projectId: Number(projectId),
        categoryId: categoryId ? Number(categoryId) : null,
        status: 'published',
      },
    })
    .catch((e: any) => {
      console.warn('  ⚠️ 建立 v1 失敗:', e?.message)
      return null
    })

  if (!createRes || !createRes.ok()) {
    console.warn('  ⚠️ 無法建立示範文件，中止 Ch5')
    await api.dispose()
    return
  }
  const created = (await createRes.json())?.data
  const docId = created?.id
  console.log(`  📝 v1 已建立 #${docId}：${DOC_TITLE}`)
  state.diffDocId = docId
  state.diffDocTitle = DOC_TITLE
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2))

  // ── 階段 2：API 更新（v2）────────────────────────────────
  await page.waitForTimeout(2000) // 確保 v1 已完成 afterCreate hook
  const updateRes2 = await api.raw
    .post(`/api/docDocuments:update?filterByTk=${docId}`, {
      data: { content: V2_CONTENT },
    })
    .catch((e: any) => {
      console.warn('  ⚠️ 更新 v2 失敗:', e?.message)
      return null
    })
  if (updateRes2 && updateRes2.ok()) console.log('  📝 v2 已更新（新增 1 行 + 修改 2 行）')

  // ── 階段 3：API 更新（v3）────────────────────────────────
  await page.waitForTimeout(2000)
  const updateRes3 = await api.raw
    .post(`/api/docDocuments:update?filterByTk=${docId}`, {
      data: { content: V3_CONTENT },
    })
    .catch((e: any) => {
      console.warn('  ⚠️ 更新 v3 失敗:', e?.message)
      return null
    })
  if (updateRes3 && updateRes3.ok()) console.log('  📝 v3 已更新（加章節 + 修改數字）')

  // ── 階段 4：進 view 頁，看見版本歷史按鈕 ──────────────────
  await page.goto(`/admin/doc-hub/view/${docId}`, { timeout: 60000 })
  await page.waitForSelector('h1, h2, h3', { timeout: 15000 }).catch(() => {})
  await waitReady(page, 1500)
  await shot(page, 'story', 'ch5_01_view頁_版本歷史按鈕')

  // ── 階段 5：進 versions 頁，左側列出三版本 ─────────────────
  await page.goto(`/admin/doc-hub/versions/${docId}`, { timeout: 60000 })
  await page.waitForSelector('text=版本歷史', { timeout: 15000 }).catch(() => {})
  await page.waitForSelector('.ant-tag', { timeout: 10000 }).catch(() => {})
  await waitReady(page, 1500)
  await shot(page, 'story', 'ch5_02_版本列表_三個版本')

  // ── 階段 6：點 v2 → 顯示 v2 vs v1 diff（綠+紅）────────────
  // 預設選最新（v3），先點 v2
  const v2Tag = page.locator('.ant-tag').filter({ hasText: /^v2$/ }).first()
  if (await v2Tag.isVisible({ timeout: 3000 }).catch(() => false)) {
    await v2Tag.click({ force: true })
    await page.waitForTimeout(800)
    await shot(page, 'story', 'ch5_03_v2對比v1_diff展現')
  }

  // ── 階段 7：點 v3 → 顯示 v3 vs v2 diff ─────────────────────
  const v3Tag = page.locator('.ant-tag').filter({ hasText: /^v3$/ }).first()
  if (await v3Tag.isVisible({ timeout: 3000 }).catch(() => false)) {
    await v3Tag.click({ force: true })
    await page.waitForTimeout(800)
    await shot(page, 'story', 'ch5_04_v3對比v2_diff加章節')
  }

  // ── 階段 8：點 v1 → 顯示初始版本（全綠）────────────────────
  const v1Tag = page.locator('.ant-tag').filter({ hasText: /^v1$/ }).first()
  if (await v1Tag.isVisible({ timeout: 3000 }).catch(() => false)) {
    await v1Tag.click({ force: true })
    await page.waitForTimeout(800)
    await shot(page, 'story', 'ch5_05_v1初始版本_全部新增')
  }

  await api.dispose()
})
