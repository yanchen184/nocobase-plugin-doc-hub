/**
 * DocHub Git 雙向同步截圖導覽
 *
 * 實際觸發 Git Push（DocHub → GitLab）和 Git Pull（GitLab → DocHub）
 * 並截圖記錄整個流程
 *
 * 執行前提：
 *   - DOCHUB_GITLAB_TOKEN 設定在 .env
 *   - DOCHUB_GITLAB_HOST=10.1.2.191
 *   - GitLab repo: wezoomtek/wez-spring-boot-starters
 */

import { test } from '@playwright/test'
import { loginAsAdmin } from '../fixtures/auth'
import { ApiHelper, CleanupStack } from '../fixtures/api'
import * as path from 'path'
import * as fs from 'fs'
import * as https from 'https'

const BASE_URL = process.env.BASE_URL || 'http://localhost:13000'
const GITLAB_HOST = '10.1.2.191'
const GITLAB_TOKEN = 'glpat-HhSwNdTrse8n1OQ_SUEG5286MQp1OjJ4CA.01.0y13qnhhz'
const GITLAB_PROJECT_ID = 730
const GITLAB_BRANCH = 'master'
const TEST_FILE_PATH = 'docs/dochub-sync-demo.md'

const SHOT_DIR = path.join(__dirname, '../artifacts/screenshots')
if (!fs.existsSync(SHOT_DIR)) fs.mkdirSync(SHOT_DIR, { recursive: true })

let api: ApiHelper
let cleanup: CleanupStack
let gitDocId: number

// ── Helpers ──────────────────────────────────────────────────────────────────

async function shot(page: any, name: string) {
  await page.screenshot({ path: path.join(SHOT_DIR, `git_${name}.png`), fullPage: false })
  console.log(`  📸 git_${name}.png`)
}

async function waitReady(page: any, extraMs = 1500) {
  await page.waitForLoadState('networkidle')
  await page.waitForFunction(() => {
    const spinners = document.querySelectorAll('.ant-spin-spinning, [class*="loading"]')
    const blocking = Array.from(spinners).filter((el: any) => {
      const s = window.getComputedStyle(el)
      return s.display !== 'none' && s.visibility !== 'hidden' && el.offsetParent !== null
    })
    return blocking.length === 0
  }, { timeout: 20000 }).catch(() => {})
  await page.waitForTimeout(extraMs)
}

/** 呼叫 GitLab API（忽略自簽憑證） */
async function gitlabApi(method: string, apiPath: string, body?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : undefined
    const options = {
      hostname: GITLAB_HOST,
      port: 443,
      path: `/api/v4${apiPath}`,
      method,
      rejectUnauthorized: false,
      headers: {
        'PRIVATE-TOKEN': GITLAB_TOKEN,
        'Content-Type': 'application/json',
        ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {}),
      },
    }
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        try { resolve(JSON.parse(data)) } catch { resolve({}) }
      })
    })
    req.on('error', reject)
    if (postData) req.write(postData)
    req.end()
  })
}

/** 建立或更新 GitLab 上的測試 .md 檔案 */
async function ensureGitLabFile(content: string): Promise<void> {
  // 先查檔案是否存在
  const existing = await gitlabApi(
    'GET',
    `/projects/${GITLAB_PROJECT_ID}/repository/files/${encodeURIComponent(TEST_FILE_PATH)}?ref=${GITLAB_BRANCH}`
  )
  if (existing.file_name) {
    // 更新
    await gitlabApi('PUT', `/projects/${GITLAB_PROJECT_ID}/repository/files/${encodeURIComponent(TEST_FILE_PATH)}`, {
      branch: GITLAB_BRANCH,
      content,
      commit_message: `docs: update ${TEST_FILE_PATH} via GitLab API (test setup)`,
    })
  } else {
    // 新建
    await gitlabApi('POST', `/projects/${GITLAB_PROJECT_ID}/repository/files/${encodeURIComponent(TEST_FILE_PATH)}`, {
      branch: GITLAB_BRANCH,
      content,
      commit_message: `docs: create ${TEST_FILE_PATH} via GitLab API (test setup)`,
    })
  }
}

/** 刪除 GitLab 上的測試檔案 */
async function deleteGitLabFile(): Promise<void> {
  await gitlabApi('DELETE', `/projects/${GITLAB_PROJECT_ID}/repository/files/${encodeURIComponent(TEST_FILE_PATH)}`, {
    branch: GITLAB_BRANCH,
    commit_message: `chore: remove test file ${TEST_FILE_PATH}`,
  })
}

// ── 測試文件內容 ──────────────────────────────────────────────────────────────

const INITIAL_CONTENT = `# Spring Boot Starter 整合指南（DocHub Demo）

> 此文件由 DocHub Git 同步功能從 GitLab 拉取展示。

## 模組清單

| Starter | 功能 | 版本 |
|---------|------|------|
| wez-security-starter | JWT Auth + RBAC | 1.2.0 |
| wez-datasource-starter | 多資料源 + 連線池 | 1.1.3 |
| wez-audit-starter | 稽核日誌自動記錄 | 1.0.8 |

## 快速開始

\`\`\`xml
<dependency>
  <groupId>com.wezoomtek</groupId>
  <artifactId>wez-security-starter</artifactId>
</dependency>
\`\`\`

---
_版本 v1.0 — 從 GitLab 同步_`

const UPDATED_CONTENT = `# Spring Boot Starter 整合指南（DocHub Demo）

> 此文件由 DocHub Git 同步功能從 GitLab 拉取展示。

## 模組清單

| Starter | 功能 | 版本 |
|---------|------|------|
| wez-security-starter | JWT Auth + RBAC | 1.2.0 |
| wez-datasource-starter | 多資料源 + 連線池 | 1.1.3 |
| wez-audit-starter | 稽核日誌自動記錄 | 1.0.8 |
| wez-notification-starter | Email / LINE 通知 | 1.0.5 |

## 快速開始

\`\`\`xml
<dependency>
  <groupId>com.wezoomtek</groupId>
  <artifactId>wez-security-starter</artifactId>
</dependency>
\`\`\`

## 更新紀錄

- v1.1：新增 wez-notification-starter（${new Date().toLocaleDateString('zh-TW')} 由 GitLab Push 觸發同步）

---
_版本 v1.1 — GitLab Push → DocHub Webhook 自動同步_`

// ── Setup ─────────────────────────────────────────────────────────────────────

test.beforeAll(async () => {
  api = await ApiHelper.create()
  cleanup = new CleanupStack()

  // 1. 在 GitLab 建立測試 .md 檔案
  console.log('📝 在 GitLab 建立測試檔案...')
  await ensureGitLabFile(INITIAL_CONTENT)
  console.log(`  ✓ ${TEST_FILE_PATH} 已建立`)

  // 2. 在 DocHub 建立對應的文件（已綁定 GitLab repo）
  const doc = await api.createDocument({
    title: 'Spring Boot Starter 整合指南（Git 同步 Demo）',
    content: '# 初始內容\n\n尚未從 Git 拉取。',
    status: 'published',
    githubRepo: `10.1.2.191/wezoomtek/wez-spring-boot-starters`,
    githubFilePath: TEST_FILE_PATH,
    githubBranch: GITLAB_BRANCH,
  } as any).catch(e => { console.log('createDocument error:', e); return null })

  if (doc?.id) {
    gitDocId = doc.id
    cleanup.push(() => api.deleteDocument(gitDocId))
    console.log(`  ✓ DocHub 文件建立：id=${gitDocId}`)
  }
})

test.afterAll(async () => {
  if (cleanup) await cleanup.flush()
  if (api) await api.dispose()
  // 清除 GitLab 測試檔案
  await deleteGitLabFile().catch(() => {})
  console.log(`  ✓ GitLab 測試檔案已刪除`)
})

test.setTimeout(300000) // 5 分鐘

// ── 主測試 ────────────────────────────────────────────────────────────────────

test('DocHub Git 雙向同步截圖', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await loginAsAdmin(page)

  if (!gitDocId) {
    console.log('⚠️ gitDocId 未建立，跳過測試')
    return
  }

  // ── Step 1：查看文件（初始狀態，Git 尚未拉取）──────────────────────────────
  console.log('\n── Step 1：初始狀態 ──')
  await page.goto(`${BASE_URL}/admin/doc-hub/edit/${gitDocId}`, { timeout: 60000 })
  await page.waitForSelector('textarea', { timeout: 25000 }).catch(() => {})
  await waitReady(page, 2000)
  await shot(page, '01_編輯頁_拉取前')

  // ── Step 2：從 Git 拉取（Git → DocHub）────────────────────────────────────
  console.log('\n── Step 2：從 Git 拉取 ──')
  const pullBtn = page.locator('button').filter({ hasText: /拉取最新|從 Git/ }).first()
  if (await pullBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await shot(page, '02_Git資訊列_拉取前')
    await pullBtn.click()
    // 等待拉取完成（成功 message 或 textarea 內容變化）
    await page.waitForTimeout(3000)
    await waitReady(page, 1000)
    await shot(page, '03_拉取成功_訊息')
    await page.waitForTimeout(1000)
    await shot(page, '04_編輯頁_拉取後內容')
  } else {
    console.log('  ⚠️ 找不到拉取按鈕，截圖 Git 資訊列')
    await shot(page, '02_Git資訊列')
  }

  // ── Step 3：閱讀頁確認拉取後的內容 ───────────────────────────────────────
  console.log('\n── Step 3：閱讀頁確認內容 ──')
  await page.goto(`${BASE_URL}/admin/doc-hub/view/${gitDocId}`, { timeout: 60000 })
  await page.waitForSelector('h1, h2, table', { timeout: 20000 }).catch(() => {})
  await waitReady(page, 2000)
  await shot(page, '05_閱讀頁_GitLab內容')

  // ── Step 4：在 DocHub 編輯文件，準備推送 ───────────────────────────────────
  console.log('\n── Step 4：編輯後推送 ──')
  await page.goto(`${BASE_URL}/admin/doc-hub/edit/${gitDocId}`, { timeout: 60000 })
  await page.waitForSelector('textarea', { timeout: 25000 }).catch(() => {})
  await waitReady(page, 2000)

  // 在文件末尾加一行
  const textarea = page.locator('textarea').first()
  if (await textarea.isVisible({ timeout: 3000 }).catch(() => false)) {
    await textarea.click()
    await page.keyboard.press('Control+End')
    await page.keyboard.type('\n\n> DocHub 編輯於 ' + new Date().toLocaleString('zh-TW'))
    await page.waitForTimeout(600)
    await shot(page, '06_編輯頁_編輯後準備推送')
  }

  // ── Step 5：列表頁點「同步 Git」────────────────────────────────────────────
  console.log('\n── Step 5：同步 Git（DocHub → GitLab）──')
  await page.goto(`${BASE_URL}/admin/doc-hub`, { timeout: 60000 })
  await page.waitForSelector('tr.ant-table-row', { timeout: 15000 }).catch(() => {})
  await waitReady(page, 1500)

  // 找到 Git sync 文件那行
  const rows = page.locator('tr.ant-table-row')
  const rowCount = await rows.count()
  let syncTriggered = false

  for (let i = 0; i < rowCount; i++) {
    const row = rows.nth(i)
    const text = await row.textContent().catch(() => '')
    if (text && text.includes('整合指南')) {
      await row.hover()
      await page.waitForTimeout(300)
      const moreBtn = row.locator('button').filter({ hasText: '⋯' }).first()
      if (await moreBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await moreBtn.click()
        await page.waitForTimeout(600)
        await shot(page, '07_操作欄_同步Git選項')

        const syncItem = page.locator('.ant-dropdown-menu-item').filter({ hasText: /同步 Git/ }).first()
        if (await syncItem.isVisible({ timeout: 2000 }).catch(() => false)) {
          await syncItem.click()
          await page.waitForTimeout(800)
          await shot(page, '08_同步確認Modal')

          const confirmBtn = page.locator('button').filter({ hasText: /確認|同步/ }).last()
          if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await confirmBtn.click()
            await page.waitForTimeout(3000)
            await waitReady(page, 1000)
            await shot(page, '09_同步成功_列表更新')
            syncTriggered = true
          } else {
            await page.keyboard.press('Escape')
          }
        } else {
          await page.keyboard.press('Escape')
        }
        break
      }
      break
    }
  }

  if (!syncTriggered) {
    console.log('  ⚠️ 未能觸發同步，截圖列表頁')
    await shot(page, '07_列表頁_Git同步欄')
  }

  // ── Step 6：在 GitLab 更新檔案，觸發 Webhook → DocHub 自動拉取 ─────────────
  console.log('\n── Step 6：GitLab 更新 → Webhook → DocHub 自動同步 ──')

  // 在 GitLab 更新測試檔案（模擬 git push）
  const updateResult = await gitlabApi('PUT',
    `/projects/${GITLAB_PROJECT_ID}/repository/files/${encodeURIComponent(TEST_FILE_PATH)}`, {
    branch: GITLAB_BRANCH,
    content: UPDATED_CONTENT,
    commit_message: `docs: update ${TEST_FILE_PATH} - add notification-starter (webhook demo)`,
  })
  console.log(`  GitLab commit: ${updateResult.file_path || JSON.stringify(updateResult)}`)

  // 等 Webhook 觸發（約 3-5 秒）
  await page.waitForTimeout(5000)

  // 查看 DocHub 文件是否已更新
  await page.goto(`${BASE_URL}/admin/doc-hub/view/${gitDocId}`, { timeout: 60000 })
  await page.waitForSelector('h1, h2, table', { timeout: 20000 }).catch(() => {})
  await waitReady(page, 2000)
  await shot(page, '10_Webhook自動同步後閱讀頁')

  // 查看列表頁 Git 同步欄狀態
  await page.goto(`${BASE_URL}/admin/doc-hub`, { timeout: 60000 })
  await page.waitForSelector('tr.ant-table-row', { timeout: 15000 }).catch(() => {})
  await waitReady(page, 2000)
  await shot(page, '11_列表頁_Synced狀態')

  // ── Step 7：版本歷史（確認每次 Git 同步都建立了版本）────────────────────────
  console.log('\n── Step 7：版本歷史（含 Git 同步快照）──')
  await page.goto(`${BASE_URL}/admin/doc-hub/versions/${gitDocId}`, { timeout: 60000 })
  await page.waitForSelector('.ant-table-row, button', { timeout: 15000 }).catch(() => {})
  await page.locator('.ant-notification-close-icon, .ant-message-notice-close').first()
    .click({ timeout: 2000 }).catch(() => {})
  await waitReady(page, 1500)
  await shot(page, '12_版本歷史_含Git同步記錄')

  // ── 完成 ──────────────────────────────────────────────────────────────────
  const gitShots = fs.readdirSync(SHOT_DIR).filter(f => f.startsWith('git_') && f.endsWith('.png'))
  console.log(`\n✅ Git 同步截圖完成，共 ${gitShots.length} 張`)
  gitShots.forEach(f => console.log(`  ${f}`))
})
