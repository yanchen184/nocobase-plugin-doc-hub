/**
 * 17-shots-gitlab-ui.spec.ts
 *
 * 用 Playwright 登入 GitLab Web UI，截下「DocHub 修改後 GitLab 端真的有收到 commit」的視覺證據。
 *
 * 截圖目標（artifacts/manual-shots/gitlab-ui/）：
 *   01_gitlab_login        — 登入頁
 *   02_repo_home           — 倉庫首頁（看到最新的 commit by NocoBase）
 *   03_commits_list        — Commits 列表頁（NocoBase 那筆 + IDE push 那筆都在）
 *   04_commit_diff         — 點 NocoBase 那筆 commit 進去看 diff
 *   05_file_history        — 測試檔案的 History 頁
 *   06_webhooks            — Webhooks 設定頁（看到 ngrok URL + 啟用中）
 *
 * 環境變數：
 *   DOCHUB_GITLAB_HOST    e.g. 10.1.2.191
 *   GITLAB_USER           e.g. root
 *   GITLAB_PASSWORD       對應密碼
 *   DOCHUB_GITLAB_PROJECT_ID   730
 */

import { test, expect } from '@playwright/test'
import * as path from 'path'
import * as fs from 'fs'

const GITLAB_HOST = process.env.DOCHUB_GITLAB_HOST || '10.1.2.191'
const GITLAB_BASE = `https://${GITLAB_HOST}`
const GITLAB_USER = process.env.GITLAB_USER || 'root'
const GITLAB_PASSWORD = process.env.GITLAB_PASSWORD || ''
const PROJECT_ID = process.env.DOCHUB_GITLAB_PROJECT_ID || '730'
const PROJECT_PATH = process.env.DOCHUB_GITLAB_PROJECT_PATH || 'wezoomtek/wez-spring-boot-starters'
const TEST_FILE_PATH = process.env.DOCHUB_GITLAB_TEST_FILE || ''

const SHOT_DIR = path.join(__dirname, '../artifacts/manual-shots/gitlab-ui')
if (!fs.existsSync(SHOT_DIR)) fs.mkdirSync(SHOT_DIR, { recursive: true })

async function shot(page: any, name: string) {
  const file = path.join(SHOT_DIR, `${name}.png`)
  await page.screenshot({ path: file, fullPage: false })
  console.log(`  📸 ${name}.png`)
}

async function shotFull(page: any, name: string) {
  const file = path.join(SHOT_DIR, `${name}.png`)
  await page.screenshot({ path: file, fullPage: true })
  console.log(`  📸 ${name}.png (full)`)
}

test.use({ ignoreHTTPSErrors: true })
test.setTimeout(180_000)

test('GitLab UI 截圖：登入 + commits + diff + webhook', async ({ page }) => {
  test.skip(
    !GITLAB_PASSWORD || !process.env.GITLAB_USER,
    'Skip: 需設 GITLAB_USER + GITLAB_PASSWORD 才能截 GitLab UI（LDAP 帳號）',
  )

  await page.setViewportSize({ width: 1440, height: 900 })

  // === 01 登入頁 ===
  console.log('\n[1/6] 登入 GitLab UI…')
  await page.goto(`${GITLAB_BASE}/users/sign_in`, { waitUntil: 'domcontentloaded', timeout: 60_000 })
  await page.waitForLoadState('networkidle').catch(() => {})
  await shot(page, '01_gitlab_login')

  // 填表 + 送出（LDAP / Standard 兩種 tab 都試）
  // 優先用可見的 textbox（Username / Password labels）
  const userInput = page.getByLabel(/Username|帳號/i).first()
  const passInput = page.getByLabel(/Password|密碼/i).first()
  await userInput.waitFor({ state: 'visible', timeout: 15_000 })
  await userInput.fill(GITLAB_USER)
  await passInput.fill(GITLAB_PASSWORD)
  // 截一張填好但還沒送的（避免之後密碼上去）
  // 用 mask 蓋掉密碼框
  // 找登入按鈕
  const submit = page.getByRole('button', { name: /Sign in|登入/i }).first()
  await submit.click()
  await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {})
  await page.waitForFunction(() => !location.pathname.includes('/users/sign_in'), { timeout: 30_000 }).catch(() => {})

  // 確認登入成功（任何不是 sign_in 的 url）
  const afterUrl = page.url()
  console.log(`  → 登入後 URL: ${afterUrl}`)
  if (afterUrl.includes('/users/sign_in')) {
    await shotFull(page, '01b_login_failed_state')
    throw new Error(`GitLab 登入失敗，仍在 sign_in 頁。可能帳密錯誤或要 2FA：${afterUrl}`)
  }

  // === 02 倉庫首頁 ===
  console.log('[2/6] 開倉庫首頁…')
  await page.goto(`${GITLAB_BASE}/${PROJECT_PATH}`, { waitUntil: 'domcontentloaded', timeout: 60_000 })
  await page.waitForLoadState('networkidle').catch(() => {})
  await page.waitForTimeout(1500)
  await shot(page, '02_repo_home')
  await shotFull(page, '02b_repo_home_full')

  // === 03 Commits 列表 ===
  console.log('[3/6] Commits 列表…')
  await page.goto(`${GITLAB_BASE}/${PROJECT_PATH}/-/commits/main`, { waitUntil: 'domcontentloaded', timeout: 60_000 }).catch(async () => {
    await page.goto(`${GITLAB_BASE}/${PROJECT_PATH}/-/commits/master`, { waitUntil: 'domcontentloaded', timeout: 60_000 })
  })
  await page.waitForLoadState('networkidle').catch(() => {})
  await page.waitForTimeout(1500)
  await shot(page, '03_commits_list')
  await shotFull(page, '03b_commits_list_full')

  // === 04 NocoBase 那筆 commit diff ===
  console.log('[4/6] 找 NocoBase 那筆 commit…')
  // 找含 "by NocoBase" 的連結
  const nocoCommitLink = page.locator('a').filter({ hasText: /by NocoBase|NocoBase/i }).first()
  if (await nocoCommitLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await nocoCommitLink.click()
    await page.waitForLoadState('networkidle').catch(() => {})
    await page.waitForTimeout(1500)
    await shot(page, '04_commit_diff')
    await shotFull(page, '04b_commit_diff_full')
  } else {
    console.log('  ⚠️ 找不到 NocoBase commit link，截目前頁面當 fallback')
    await shot(page, '04_commit_diff_fallback')
  }

  // === 05 File history ===
  if (TEST_FILE_PATH) {
    console.log(`[5/6] File history: ${TEST_FILE_PATH}…`)
    await page.goto(`${GITLAB_BASE}/${PROJECT_PATH}/-/commits/main/${TEST_FILE_PATH}`, {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    }).catch(async () => {
      await page.goto(`${GITLAB_BASE}/${PROJECT_PATH}/-/commits/master/${TEST_FILE_PATH}`, {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      })
    })
    await page.waitForLoadState('networkidle').catch(() => {})
    await page.waitForTimeout(1500)
    await shot(page, '05_file_history')
    await shotFull(page, '05b_file_history_full')
  } else {
    console.log('[5/6] 無 DOCHUB_GITLAB_TEST_FILE，跳過 file history')
  }

  // === 06 Webhooks 設定 ===
  console.log('[6/6] Webhooks 設定頁…')
  await page.goto(`${GITLAB_BASE}/${PROJECT_PATH}/-/hooks`, { waitUntil: 'domcontentloaded', timeout: 60_000 })
  await page.waitForLoadState('networkidle').catch(() => {})
  await page.waitForTimeout(1500)
  await shot(page, '06_webhooks')
  await shotFull(page, '06b_webhooks_full')

  console.log('\n✅ GitLab UI 截圖完成')
  console.log(`📁 ${SHOT_DIR}`)
  console.log(fs.readdirSync(SHOT_DIR).map(f => `   - ${f}`).join('\n'))
})
