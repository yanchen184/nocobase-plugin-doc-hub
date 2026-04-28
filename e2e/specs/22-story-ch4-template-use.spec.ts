/**
 * Story 章節 4：使用剛建好的範本建立文件
 *
 * 優化策略：單一 test 多階段截圖（共用同一個 browser context）
 *   - 一次登入 → 一次 navigateToCategory
 *   - 連續 6 個截圖階段，無重複登入/載入 AMD bundle
 *   - 平均每張圖 < 5s（vs 原本每張圖約 15s）
 *
 * 流程：
 *   進入 02_需求 資料夾 → 點「新增文件」 → 4 種方式 Modal（截圖 1）
 *   → 點「使用範本」card → 範本選擇 Modal（截圖 2）
 *   → 點 [STORY] 上版單 → TemplateFillPage 空白表單（截圖 3）
 *   → 填四個欄位 → 已填表單（截圖 4）
 *   → API 直接建文件 + 跳 view 頁（截圖 5）
 *   → 回資料夾列表（截圖 6）
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
const PROJECT_HAS_TEXT = '示範專案'
const TEMPLATE_NAME = `${PREFIX} 上版單`
const DOC_TITLE = `${PREFIX} v1.2.3 上版單`

test.setTimeout(180000)

test('ch4: 使用範本建立文件（6 階段截圖，單一 test）', async ({ page }) => {
  const api = await ApiHelper.create()
  const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'))
  const templateId = state.templateId
  const projectId = state.projectId

  await page.setViewportSize({ width: 1440, height: 900 })

  // ── Setup：登入 + 取資料夾 ────────────────────────────────────
  await loginAsAdmin(page)
  const cats: any[] = await api.listCategoriesByProject(projectId).catch(() => [])
  const cat = (cats || []).find((c: any) => c.name && c.name.includes('需求'))
  const categoryId = cat?.id

  // ── 階段 1：進資料夾，開「新增文件」Modal ────────────────────
  await page.goto('/admin/doc-hub', { timeout: 60000 })
  await waitReady(page, 1500)

  const groupSpan = page.locator('span').filter({ hasText: /^🗂\s*專案$|^專案$/ }).first()
  if (await groupSpan.isVisible({ timeout: 2000 }).catch(() => false)) {
    await groupSpan.click({ force: true })
    await page.waitForTimeout(400)
  }
  const projSpan = page.locator('span').filter({ hasText: PROJECT_HAS_TEXT }).first()
  await projSpan.click({ force: true })
  await waitReady(page, 1200)
  const tabDiv = page.locator('div').filter({ hasText: /^📁\s*02_需求\s*\d+$/ }).first()
  await tabDiv.click({ force: true, timeout: 8000 })
  await waitReady(page, 1000)

  // 點「新增文件」
  await page.locator('button').filter({ hasText: /^新增文件$/ }).first().click({ force: true })
  await page.waitForSelector('.ant-modal-content', { timeout: 8000 })
  await page.waitForTimeout(800)
  await shot(page, 'story', 'ch4_01_四種方式Modal_準備選範本')

  // ── 階段 2：點「使用範本」card → 範本選擇 Modal ────────────
  const tplCard = page.locator('.ant-modal-content').locator('text=使用範本').first()
  await tplCard.click({ force: true })
  await page.waitForSelector('.ant-modal-title:has-text("選擇範本")', { timeout: 8000 })
  await page.waitForTimeout(1200)
  await shot(page, 'story', 'ch4_02_範本選擇Modal')

  // ── 階段 3：直接 goto TemplateFillPage（避免依賴點擊） ────
  await page.goto(
    `/admin/doc-hub/template-fill/new?templateId=${templateId}&projectId=${projectId}${categoryId ? '&categoryId=' + categoryId : ''}`,
    { timeout: 60000 },
  )
  await page.waitForSelector('text=文件標題', { timeout: 15000 })
  await page.waitForSelector('text=版本號', { timeout: 8000 })
  await waitReady(page, 1000)
  await shot(page, 'story', 'ch4_03_範本填寫頁_空白表單')

  // ── 階段 4：填內容 ────────────────────────────────────────
  const titleInput = page.locator('input.ant-input[placeholder*="文件標題"]').first()
  await titleInput.fill(DOC_TITLE)
  await page.waitForTimeout(200)

  const allInputs = page.locator('input.ant-input')
  const inputCount = await allInputs.count()
  if (inputCount >= 2) {
    await allInputs.nth(1).fill('v1.2.3')
    await page.waitForTimeout(200)
  }

  const textarea = page.locator('textarea').first()
  if (await textarea.isVisible({ timeout: 1500 }).catch(() => false)) {
    await textarea.fill(
      '1. 修正登入 token 過期錯誤\n2. 新增使用者頭像上傳功能\n3. 優化首頁載入速度（從 3s 降至 1.2s）\n4. 修正 IE11 相容性問題',
    )
    await page.waitForTimeout(200)
  }

  const placeholderSel = page.locator('.ant-select').filter({ hasText: '請選擇' }).first()
  if (await placeholderSel.isVisible({ timeout: 1500 }).catch(() => false)) {
    await placeholderSel.click({ force: true })
    await page.waitForTimeout(400)
    const opt = page
      .locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option')
      .filter({ hasText: /^正式$/ })
      .first()
    if (await opt.isVisible({ timeout: 2000 }).catch(() => false)) {
      await opt.click({ force: true })
      await page.waitForTimeout(300)
    }
  }

  const dateInput = page.locator('input[type="date"]').first()
  if (await dateInput.isVisible({ timeout: 1500 }).catch(() => false)) {
    await dateInput.fill('2026-04-28')
    await page.waitForTimeout(200)
  }

  await page.waitForTimeout(500)
  await shot(page, 'story', 'ch4_04_範本填寫頁_已填內容')

  // ── 階段 5：API 直接建文件 + view 頁 ───────────────────────
  const formData = {
    version: 'v1.2.3',
    changes:
      '1. 修正登入 token 過期錯誤\n2. 新增使用者頭像上傳功能\n3. 優化首頁載入速度（從 3s 降至 1.2s）\n4. 修正 IE11 相容性問題',
    scope: 'prod',
    deploy_at: '2026-04-28',
  }
  const createRes = await api.raw
    .post('/api/docDocuments:create', {
      data: {
        title: DOC_TITLE,
        contentType: 'template',
        templateId: Number(templateId),
        formData,
        projectId: Number(projectId),
        categoryId: categoryId ? Number(categoryId) : null,
        status: 'published',
      },
    })
    .catch((e: any) => {
      console.warn('  ⚠️ 範本文件建立失敗:', e?.message)
      return null
    })
  let created: any = null
  if (createRes && createRes.ok()) {
    const body = await createRes.json()
    created = body?.data || null
  }

  if (created?.id) {
    state.templateDocId = created.id
    state.templateDocTitle = DOC_TITLE
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2))
    console.log(`  📝 已建立範本文件 #${created.id}：${DOC_TITLE}`)

    await page.goto(`/admin/doc-hub/view/${created.id}`, { timeout: 60000 })
    await page.waitForSelector('h1, h2, h3', { timeout: 15000 }).catch(() => {})
    await waitReady(page, 1500)
    await shot(page, 'story', 'ch4_05_範本文件_view頁_TemplateFormViewer')
  }

  // ── 階段 6：回資料夾列表 ──────────────────────────────────
  await page.goto('/admin/doc-hub', { timeout: 60000 })
  await waitReady(page, 1200)
  const groupSpan2 = page.locator('span').filter({ hasText: /^🗂\s*專案$|^專案$/ }).first()
  if (await groupSpan2.isVisible({ timeout: 2000 }).catch(() => false)) {
    await groupSpan2.click({ force: true })
    await page.waitForTimeout(400)
  }
  await page.locator('span').filter({ hasText: PROJECT_HAS_TEXT }).first().click({ force: true })
  await waitReady(page, 1200)
  const tabDiv2 = page.locator('div').filter({ hasText: /^📁\s*02_需求\s*\d+$/ }).first()
  await tabDiv2.click({ force: true, timeout: 8000 })
  await waitReady(page, 1000)
  await shot(page, 'story', 'ch4_06_資料夾列表_看見範本文件')

  await api.dispose()
})
