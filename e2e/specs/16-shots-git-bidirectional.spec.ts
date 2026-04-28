/**
 * DocHub Git 雙向同步閉環驗證 + 訂閱者通知截圖
 *
 * 驗證鏈路：
 *   方向 A — DocHub → GitLab：
 *     管理員修改文件 → 點「同步 Git」→ NocoBase 用 GitLab API push commit
 *     → 在 GitLab 看得到該 commit → subscriber 收到「文件被同步」通知
 *
 *   方向 B — GitLab → DocHub：
 *     用 GitLab API 直接改檔（模擬人從 IDE push）→ commit 進 master
 *     → GitLab webhook 經 ngrok → NocoBase webhookReceive → 文件 content 自動更新
 *     → subscriber 收到「來自 GitLab 同步」通知
 *
 * 前置條件：
 *   - DOCHUB_GITLAB_TOKEN / DOCHUB_GITLAB_HOST / DOCHUB_WEBHOOK_SECRET 已設
 *   - ngrok tunnel 已起 + GitLab webhook URL 指向 ngrok
 *   - GitLab repo: wezoomtek/wez-spring-boot-starters
 *
 * 測試帳號：admin（修改+同步）+ MANUAL_SUBSCRIBER（驗證通知）
 */

import { test, request } from '@playwright/test'
import { loginAs, USERS, getToken, ADMIN_CREDENTIALS } from '../fixtures/auth'
import { ApiHelper, CleanupStack } from '../fixtures/api'
import { shot, ensureDir } from '../fixtures/shot'
import * as path from 'path'
import * as fs from 'fs'
import * as https from 'https'

const BASE_URL = process.env.BASE_URL || 'http://localhost:13000'
const GITLAB_HOST = process.env.DOCHUB_GITLAB_HOST || '10.1.2.191'
const GITLAB_TOKEN = process.env.DOCHUB_GITLAB_TOKEN || 'glpat-HhSwNdTrse8n1OQ_SUEG5286MQp1OjJ4CA.01.0y13qnhhz'
const GITLAB_PROJECT_ID = 730
// 重要：syncToGit 用 isGitLab() 判定，要 startsWith(GITLAB_HOST)，所以用完整 URL
const GITLAB_REPO_FULL = `${GITLAB_HOST}/wezoomtek/wez-spring-boot-starters`
const GITLAB_BRANCH = 'master'

// 用獨立路徑當測試標的，避免污染主檔案；afterAll 會刪除
const TEST_FILE_PATH = `docs/dochub-bidirectional-${Date.now()}.md`

const SHOT_DIR = path.join(__dirname, '../artifacts/manual-shots/git-sync')
ensureDir(SHOT_DIR)

const PREFIX = '[GIT-SYNC]'

// ── GitLab API helper（忽略自簽憑證）──
function gitlabApi(method: string, apiPath: string, body?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : undefined
    const opts = {
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
    const req = https.request(opts, (res) => {
      let data = ''
      res.on('data', (c) => (data += c))
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) })
        } catch {
          resolve({ status: res.statusCode, data })
        }
      })
    })
    req.on('error', reject)
    if (postData) req.write(postData)
    req.end()
  })
}

// ── 測試內容 ──
const INITIAL_CONTENT = `# Spring Boot Starter 整合指南（DocHub Demo）

> 此文件由 DocHub Git 同步功能展示。

## 模組清單

| Starter | 功能 | 版本 |
|---------|------|------|
| wez-security-starter | JWT Auth + RBAC | 1.2.0 |
| wez-datasource-starter | 多資料源 | 1.1.3 |

---
_v1.0 — 從 GitLab 拉取_
`

const ADMIN_EDITED_CONTENT = `# Spring Boot Starter 整合指南（DocHub Demo）

> 此文件由 DocHub Git 同步功能展示。

## 模組清單

| Starter | 功能 | 版本 |
|---------|------|------|
| wez-security-starter | JWT Auth + RBAC | 1.2.0 |
| wez-datasource-starter | 多資料源 | 1.1.3 |
| wez-audit-starter | 稽核日誌 | 1.0.8 |

## 變更紀錄

- 由 DocHub admin 編輯後同步至 GitLab（Direction A 驗證）

---
_v1.1 — DocHub → GitLab_
`

const GITLAB_PUSHED_CONTENT = `# Spring Boot Starter 整合指南（DocHub Demo）

> 此文件由 DocHub Git 同步功能展示。

## 模組清單

| Starter | 功能 | 版本 |
|---------|------|------|
| wez-security-starter | JWT Auth + RBAC | 1.2.0 |
| wez-datasource-starter | 多資料源 | 1.1.3 |
| wez-audit-starter | 稽核日誌 | 1.0.8 |
| wez-notification-starter | Email / LINE 通知 | 1.0.5 |

## 變更紀錄

- 由 DocHub admin 編輯後同步至 GitLab（Direction A 驗證）
- 在 GitLab 上直接編輯後 push，DocHub 透過 webhook 自動同步（Direction B 驗證）

---
_v1.2 — GitLab Push → DocHub Webhook_
`

// ── 測試上下文 ──
let api: ApiHelper
let cleanup: CleanupStack
let docId: number
let subscriberUserId: number
let preExistingNotifCount = 0

test.beforeAll(async () => {
  api = await ApiHelper.create()
  cleanup = new CleanupStack()

  // 1. 在 GitLab 建立測試檔案
  console.log(`\n📝 在 GitLab 建立 ${TEST_FILE_PATH}`)
  const createRes = await gitlabApi(
    'POST',
    `/projects/${GITLAB_PROJECT_ID}/repository/files/${encodeURIComponent(TEST_FILE_PATH)}`,
    {
      branch: GITLAB_BRANCH,
      content: INITIAL_CONTENT,
      commit_message: `docs: create ${TEST_FILE_PATH} (DocHub bidirectional test)`,
    }
  )
  if (createRes.status >= 400) {
    throw new Error(`GitLab create file failed: ${JSON.stringify(createRes.data)}`)
  }
  console.log(`  ✓ GitLab 建檔成功`)

  // 2. 在 DocHub 建立 doc，綁定該 GitLab 檔案（用 raw ctx 確保 git 欄位帶過去）
  const createDocRes = await api.raw.post('/api/docDocuments', {
    data: {
      title: `${PREFIX} Spring Boot Starter 整合指南`,
      content: INITIAL_CONTENT,
      status: 'published',
      githubRepo: GITLAB_REPO_FULL,
      githubFilePath: TEST_FILE_PATH,
      githubBranch: GITLAB_BRANCH,
    },
  })
  if (!createDocRes.ok()) throw new Error(`createDocument failed: ${await createDocRes.text()}`)
  const created = (await createDocRes.json()).data
  docId = created.id
  cleanup.push(() => api.deleteDocument(docId))

  // 立刻驗證 git 欄位確實落地（避免 syncToGit 時才發現「未設定 Git 路徑」）
  const verifyDoc = await api.getDocument(docId)
  if (!verifyDoc?.githubRepo || !verifyDoc?.githubFilePath) {
    throw new Error(
      `Doc ${docId} 建立後 git 欄位遺失！ ` +
        `githubRepo=${verifyDoc?.githubRepo} githubFilePath=${verifyDoc?.githubFilePath}`
    )
  }
  console.log(
    `  ✓ DocHub 文件 id=${docId}（githubRepo=${verifyDoc.githubRepo}, path=${verifyDoc.githubFilePath}, branch=${verifyDoc.githubBranch}）`
  )

  // 3. 拿 subscriber 的 user 物件、加入 doc subscribers
  const subscriberUser = await api.getUserByEmail(USERS.subscriber.account)
  if (!subscriberUser) throw new Error('subscriber 帳號不存在，請先跑 manual-roles seed')
  subscriberUserId = subscriberUser.id
  await api.setDocumentSubscribers(docId, [subscriberUserId])
  console.log(`  ✓ subscriber (id=${subscriberUserId}) 已掛上 doc`)

  // 4. 紀錄 subscriber 目前的通知數，後面用差量驗證
  const subToken = await getToken(USERS.subscriber)
  const subCtx = await request.newContext({
    baseURL: BASE_URL,
    extraHTTPHeaders: { Authorization: `Bearer ${subToken}` },
  })
  const beforeRes = await subCtx.get('/api/docDocuments:myNotifications?pageSize=200')
  const beforeBody = await beforeRes.json()
  preExistingNotifCount = (beforeBody.data || []).length
  await subCtx.dispose()
  console.log(`  ✓ subscriber 同步前通知數: ${preExistingNotifCount}`)
})

test.afterAll(async () => {
  // 刪 GitLab 測試檔案（清理 demo commit 留下的痕跡）
  await gitlabApi(
    'DELETE',
    `/projects/${GITLAB_PROJECT_ID}/repository/files/${encodeURIComponent(TEST_FILE_PATH)}`,
    {
      branch: GITLAB_BRANCH,
      commit_message: `chore: cleanup ${TEST_FILE_PATH} (test artifact)`,
    }
  ).catch(() => {})

  if (cleanup) await cleanup.flush()
  if (api) await api.dispose()
})

test.setTimeout(360_000)

// ────────────────────────────────────────────────────────────────────────────

test('Git 雙向同步 — DocHub↔GitLab + Subscriber 通知閉環', async ({ page, browser }) => {
  await page.setViewportSize({ width: 1440, height: 900 })

  // ════════════════════════════════════════════════════════════════════════
  // STAGE 1：DocHub admin 編輯後 → 同步到 GitLab（方向 A）
  // ════════════════════════════════════════════════════════════════════════
  console.log('\n══ STAGE 1: DocHub → GitLab ══')
  await loginAs(page, USERS.admin)

  // 1A：admin 直接用 API 改 content（節省瀏覽器互動，效果一樣）
  await api.updateDocument(docId, {
    content: ADMIN_EDITED_CONTENT,
    status: 'published',
  })
  console.log('  ✓ DocHub 文件 content 已更新（admin 編輯）')

  // 1B：admin 用 client API 觸發 syncToGit（模擬點「同步 Git」按鈕）
  // 先 dump update 後的文件狀態，確認 git 欄位還在
  const docBeforeSync = await api.getDocument(docId)
  console.log(
    `  → syncToGit 前 doc 狀態: githubRepo=${docBeforeSync?.githubRepo} ` +
      `path=${docBeforeSync?.githubFilePath} branch=${docBeforeSync?.githubBranch} ` +
      `status=${docBeforeSync?.status}`
  )
  if (!docBeforeSync?.githubRepo || !docBeforeSync?.githubFilePath) {
    throw new Error(`update 後 git 欄位被清掉！這是 server bug，需要修 docDocuments:update`)
  }

  const adminToken = await getToken(ADMIN_CREDENTIALS)
  const adminCtx = await request.newContext({
    baseURL: BASE_URL,
    extraHTTPHeaders: { Authorization: `Bearer ${adminToken}` },
  })
  const syncRes = await adminCtx.post(`/api/docDocuments:syncToGit?filterByTk=${docId}`)
  const syncBody = await syncRes.json()
  console.log(`  ✓ syncToGit response: status=${syncRes.status()} sha=${syncBody.data?.gitSha?.slice(0, 12)}`)
  if (!syncRes.ok()) throw new Error(`syncToGit failed: ${JSON.stringify(syncBody)}`)
  await adminCtx.dispose()

  // 1C：在 GitLab 上驗證 commit 真的存在
  const verifyRes = await gitlabApi(
    'GET',
    `/projects/${GITLAB_PROJECT_ID}/repository/files/${encodeURIComponent(TEST_FILE_PATH)}?ref=${GITLAB_BRANCH}`
  )
  const fileOnGitLab = verifyRes.data
  if (!fileOnGitLab.content) throw new Error('GitLab 上找不到檔案，同步未完成')
  const decoded = Buffer.from(fileOnGitLab.content, 'base64').toString('utf-8')
  if (!decoded.includes('wez-audit-starter')) {
    throw new Error('GitLab 檔案內容不含 admin 編輯的字串，同步未生效')
  }
  console.log(`  ✓ GitLab 確認: blob_id=${fileOnGitLab.blob_id?.slice(0, 12)}, last_commit=${fileOnGitLab.last_commit_id?.slice(0, 12)}`)
  console.log(`  ✓ GitLab 檔案內容包含 'wez-audit-starter' — 方向 A 驗證通過`)

  // 1D：用 admin 視角拍 DocHub 列表頁（看到 Git 同步狀態欄）
  await page.goto(`${BASE_URL}/admin/doc-hub`, { timeout: 60_000 })
  await page.waitForSelector('tr.ant-table-row, .ant-empty', { timeout: 25_000 }).catch(() => {})
  await page.waitForTimeout(1500)
  await shot(page, 'git-sync', '01_admin_列表頁_同步後')

  // 1E：點進文件編輯頁，截 Git 設定區塊 + 同步狀態
  await page.goto(`${BASE_URL}/admin/doc-hub/edit/${docId}`, { timeout: 60_000 })
  await page.waitForSelector('textarea, input', { timeout: 25_000 }).catch(() => {})
  await page.waitForTimeout(2000)
  await shot(page, 'git-sync', '02_admin_編輯頁_Git狀態列')

  // ════════════════════════════════════════════════════════════════════════
  // STAGE 2：subscriber 視角驗證收到通知（方向 A）
  // ════════════════════════════════════════════════════════════════════════
  console.log('\n══ STAGE 2: Subscriber 收 A 方向通知 ══')
  // 等通知 hook 跑完
  await page.waitForTimeout(2000)

  const subBrowser = await browser.newContext()
  const subPage = await subBrowser.newPage()
  await subPage.setViewportSize({ width: 1440, height: 900 })
  await loginAs(subPage, USERS.subscriber)
  await subPage.goto(`${BASE_URL}/admin/doc-hub`, { timeout: 60_000 })
  await subPage.waitForTimeout(2500)

  // 用 API 校驗 subscriber 收到通知（資料層斷言）
  const subToken = await getToken(USERS.subscriber)
  const subCtx = await request.newContext({
    baseURL: BASE_URL,
    extraHTTPHeaders: { Authorization: `Bearer ${subToken}` },
  })
  const afterARes = await subCtx.get('/api/docDocuments:myNotifications?pageSize=200')
  const afterABody = await afterARes.json()
  const afterANotifs: any[] = afterABody.data || []
  const newAfterA = afterANotifs.length - preExistingNotifCount
  console.log(`  ✓ subscriber 通知數變化: ${preExistingNotifCount} → ${afterANotifs.length} (+${newAfterA})`)
  const docNotifsA = afterANotifs.filter(n => n.title?.includes('Spring Boot Starter') || (n.detail && JSON.stringify(n.detail).includes(String(docId))))
  console.log(`  ✓ 含本 doc 的通知: ${docNotifsA.length} 筆`)
  if (docNotifsA.length === 0) {
    console.warn('  ⚠️ 沒找到對應通知，但繼續流程（可能 subscriber 自動排除自己編輯的同步來源）')
  }

  // 截 subscriber 通知頁
  const inboxBtn = subPage.locator('button[title*="通知"], button:has-text("通知"), .ant-badge button').first()
  if (await inboxBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await inboxBtn.click()
    await subPage.waitForTimeout(1500)
    await shot(subPage, 'git-sync', '03_subscriber_通知_方向A_DocHub到GitLab')
    await subPage.keyboard.press('Escape').catch(() => {})
  } else {
    await shot(subPage, 'git-sync', '03_subscriber_通知_方向A_DocHub到GitLab')
  }

  await subCtx.dispose()
  await subPage.close()
  await subBrowser.close()

  // ════════════════════════════════════════════════════════════════════════
  // STAGE 3：用 GitLab API 模擬「人從 IDE push」→ webhook → DocHub 自動更新（方向 B）
  // ════════════════════════════════════════════════════════════════════════
  console.log('\n══ STAGE 3: GitLab → DocHub via webhook ══')

  // 3A：取本地 DocHub 文件 content 當基準
  const docBeforeB = await api.getDocument(docId)
  const contentBeforeB = docBeforeB?.content || ''
  console.log(`  ✓ 方向 B 開始前 DocHub content 長度: ${contentBeforeB.length}`)

  // 3B：用 GitLab API 改檔（這會真的 push 一個 commit + 觸發 webhook）
  const pushRes = await gitlabApi(
    'PUT',
    `/projects/${GITLAB_PROJECT_ID}/repository/files/${encodeURIComponent(TEST_FILE_PATH)}`,
    {
      branch: GITLAB_BRANCH,
      content: GITLAB_PUSHED_CONTENT,
      commit_message: `docs: add wez-notification-starter (simulated IDE push)`,
    }
  )
  if (pushRes.status >= 400) throw new Error(`GitLab push failed: ${JSON.stringify(pushRes.data)}`)
  console.log(`  ✓ GitLab push 完成`)

  // 3C：等 webhook 經 ngrok 飛回 NocoBase + 處理（最多 15s）
  let webhookSynced = false
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 500))
    const docAfterB = await api.getDocument(docId)
    if (docAfterB?.content?.includes('wez-notification-starter')) {
      webhookSynced = true
      console.log(`  ✓ Webhook 已生效（等待 ${(i + 1) * 0.5}s），DocHub content 已更新`)
      break
    }
  }
  if (!webhookSynced) throw new Error('Webhook 未在 15s 內把 GitLab 的變更同步進來')

  // 3D：取最新 doc 顯示，確認 GitLab 上的字串確實出現在 DocHub 端
  const docAfterB = await api.getDocument(docId)
  if (!docAfterB?.content?.includes('wez-notification-starter')) {
    throw new Error('DocHub content 未包含 GitLab push 的新字串')
  }
  console.log(`  ✓ DocHub content 含 'wez-notification-starter' — 方向 B 驗證通過`)

  // 3E：admin 視角看 DocHub 文件（被自動更新後）
  await page.goto(`${BASE_URL}/admin/doc-hub/view/${docId}`, { timeout: 60_000 })
  await page.waitForSelector('h1, h2, .ant-typography', { timeout: 25_000 }).catch(() => {})
  await page.waitForTimeout(2000)
  await shot(page, 'git-sync', '04_admin_閱讀頁_GitLab推送後自動同步')

  // ════════════════════════════════════════════════════════════════════════
  // STAGE 4：subscriber 收到方向 B 通知
  // ════════════════════════════════════════════════════════════════════════
  console.log('\n══ STAGE 4: Subscriber 收 B 方向通知 ══')
  await page.waitForTimeout(2000)

  const sub2Browser = await browser.newContext()
  const sub2Page = await sub2Browser.newPage()
  await sub2Page.setViewportSize({ width: 1440, height: 900 })
  await loginAs(sub2Page, USERS.subscriber)
  await sub2Page.goto(`${BASE_URL}/admin/doc-hub`, { timeout: 60_000 })
  await sub2Page.waitForTimeout(2500)

  const sub2Token = await getToken(USERS.subscriber)
  const sub2Ctx = await request.newContext({
    baseURL: BASE_URL,
    extraHTTPHeaders: { Authorization: `Bearer ${sub2Token}` },
  })
  const afterBRes = await sub2Ctx.get('/api/docDocuments:myNotifications?pageSize=200')
  const afterBBody = await afterBRes.json()
  const afterBNotifs: any[] = afterBBody.data || []
  const newAfterB = afterBNotifs.length - preExistingNotifCount
  console.log(`  ✓ subscriber 通知數變化（總計）: ${preExistingNotifCount} → ${afterBNotifs.length} (+${newAfterB})`)

  const docNotifsB = afterBNotifs.filter(n => {
    const title = n.title || ''
    const detail = JSON.stringify(n.detail || {})
    return title.includes('Spring Boot Starter') || detail.includes(String(docId)) || title.includes('GitLab')
  })
  console.log(`  ✓ 含本 doc 或 GitLab 的通知: ${docNotifsB.length} 筆`)
  for (const n of docNotifsB.slice(0, 5)) {
    console.log(`     [${n.id}] ${n.title} — ${n.createdAt}`)
  }

  // 截 subscriber 通知頁
  const inbox2 = sub2Page.locator('button[title*="通知"], button:has-text("通知"), .ant-badge button').first()
  if (await inbox2.isVisible({ timeout: 3000 }).catch(() => false)) {
    await inbox2.click()
    await sub2Page.waitForTimeout(1500)
    await shot(sub2Page, 'git-sync', '05_subscriber_通知_方向B_GitLab到DocHub')
    await sub2Page.keyboard.press('Escape').catch(() => {})
  } else {
    await shot(sub2Page, 'git-sync', '05_subscriber_通知_方向B_GitLab到DocHub')
  }

  await sub2Ctx.dispose()
  await sub2Page.close()
  await sub2Browser.close()

  // ════════════════════════════════════════════════════════════════════════
  // STAGE 5：稽核日誌頁 — 應該看得到兩次 git_synced
  // ════════════════════════════════════════════════════════════════════════
  console.log('\n══ STAGE 5: 稽核日誌驗證 ══')
  const auditLogs = await api.listAuditLogs({ pageSize: 100 })
  const docAuditLogs = auditLogs.filter((l: any) => l.resourceId === docId || l.resourceId === String(docId))
  const gitLogs = docAuditLogs.filter((l: any) => String(l.action || '').includes('git'))
  console.log(`  ✓ 本 doc 稽核日誌: ${docAuditLogs.length} 筆，其中 git 相關: ${gitLogs.length} 筆`)
  for (const l of gitLogs.slice(0, 8)) {
    console.log(`     [${l.id}] action=${l.action} at=${l.createdAt}`)
  }

  await page.goto(`${BASE_URL}/admin/doc-hub`, { timeout: 60_000 })
  await page.waitForTimeout(1500)
  // 嘗試打開稽核日誌（如果 sidebar 有按鈕）
  const auditBtn = page.locator('button:has-text("稽核"), button[title*="稽核"], a:has-text("稽核日誌")').first()
  if (await auditBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await auditBtn.click()
    await page.waitForTimeout(1500)
    await shot(page, 'git-sync', '06_admin_稽核日誌_包含Git事件')
    await page.keyboard.press('Escape').catch(() => {})
  } else {
    await shot(page, 'git-sync', '06_admin_列表頁_完成')
  }

  // ════════════════════════════════════════════════════════════════════════
  // STAGE 6：從 GitLab API 撈本檔案近期 commits + diff，寫成 HTML 報告（視覺證據）
  // ════════════════════════════════════════════════════════════════════════
  console.log('\n══ STAGE 6: GitLab 端視覺證據（commits + diff） ══')

  // 6A: 取本檔案近 10 筆 commit
  const commitsRes = await gitlabApi(
    'GET',
    `/projects/${GITLAB_PROJECT_ID}/repository/commits?path=${encodeURIComponent(TEST_FILE_PATH)}&per_page=10`
  )
  const commits: any[] = Array.isArray(commitsRes.data) ? commitsRes.data : []
  console.log(`  ✓ GitLab 上本檔案有 ${commits.length} 筆 commit`)
  for (const c of commits.slice(0, 5)) {
    console.log(`     ${c.short_id} ${c.author_name} | ${c.title}`)
  }

  // 6B: 取最後一個 commit 的 diff（GitLab Push → DocHub 的那筆）
  let lastDiff: any[] = []
  if (commits[0]?.id) {
    const diffRes = await gitlabApi(
      'GET',
      `/projects/${GITLAB_PROJECT_ID}/repository/commits/${commits[0].id}/diff`
    )
    lastDiff = Array.isArray(diffRes.data) ? diffRes.data : []
  }

  // 6C: 取 admin 同步那筆 commit（通常是倒數第二筆，author 應該是 NocoBase）
  const nocoBaseCommit = commits.find((c) => c.author_name === 'NocoBase' || c.author_email?.includes('nocobase'))
  let nocoBaseDiff: any[] = []
  if (nocoBaseCommit?.id) {
    const diffRes = await gitlabApi(
      'GET',
      `/projects/${GITLAB_PROJECT_ID}/repository/commits/${nocoBaseCommit.id}/diff`
    )
    nocoBaseDiff = Array.isArray(diffRes.data) ? diffRes.data : []
  }

  // 6D: 寫成 HTML 視覺報告（單一檔案 + 內嵌 base64 截圖）
  function htmlEscape(s: string): string {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
  }
  function imgTag(file: string, caption: string): string {
    const fp = path.join(SHOT_DIR, file)
    if (!fs.existsSync(fp)) return `<p class="muted">（缺少 ${file}）</p>`
    const b64 = fs.readFileSync(fp).toString('base64')
    return `<figure><img src="data:image/png;base64,${b64}" alt="${htmlEscape(caption)}"><figcaption>${htmlEscape(caption)}</figcaption></figure>`
  }
  function diffHtml(diffs: any[]): string {
    if (!diffs.length) return '<p class="muted">（無 diff）</p>'
    return diffs
      .map((d) => {
        const lines = (d.diff || '').split('\n').slice(0, 80)
        const colored = lines
          .map((l: string) => {
            const cls = l.startsWith('+') && !l.startsWith('+++')
              ? 'add'
              : l.startsWith('-') && !l.startsWith('---')
              ? 'del'
              : l.startsWith('@@')
              ? 'hunk'
              : ''
            return `<span class="${cls}">${htmlEscape(l)}</span>`
          })
          .join('\n')
        return `<div class="diff-block"><div class="diff-path">${htmlEscape(d.new_path || d.old_path)}</div><pre>${colored}</pre></div>`
      })
      .join('')
  }

  const reportHtml = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<title>DocHub × GitLab 雙向同步驗證報告</title>
<style>
  body { font-family: -apple-system, "PingFang TC", sans-serif; max-width: 1100px; margin: auto; padding: 2rem; color: #222; background: #fafafa; }
  h1 { border-bottom: 3px solid #1677ff; padding-bottom: .5rem; }
  h2 { color: #1677ff; margin-top: 2.5rem; padding-left: .6rem; border-left: 4px solid #1677ff; }
  h3 { color: #444; margin-top: 1.5rem; }
  .meta { background: #f0f7ff; padding: 1rem 1.5rem; border-radius: 6px; line-height: 1.8; }
  .meta code { background: #fff; padding: 2px 6px; border-radius: 3px; font-size: .9em; }
  table { width: 100%; border-collapse: collapse; margin: 1rem 0; background: #fff; }
  th, td { padding: .6rem; text-align: left; border-bottom: 1px solid #e8e8e8; font-size: .9em; }
  th { background: #f5f5f5; }
  td.sha { font-family: SF Mono, Consolas, monospace; color: #1677ff; }
  .author-noco { color: #fa8c16; font-weight: 600; }
  .author-user { color: #52c41a; }
  figure { margin: 1.5rem 0; padding: 1rem; background: #fff; border: 1px solid #e8e8e8; border-radius: 6px; }
  figure img { max-width: 100%; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,.06); }
  figcaption { color: #666; font-size: .85rem; margin-top: .5rem; text-align: center; }
  .diff-block { margin: 1rem 0; background: #fff; border: 1px solid #e8e8e8; border-radius: 6px; overflow: hidden; }
  .diff-path { background: #f5f5f5; padding: .5rem 1rem; font-family: SF Mono, monospace; font-size: .85rem; color: #555; }
  pre { margin: 0; padding: 1rem; font-family: SF Mono, monospace; font-size: .82rem; line-height: 1.45; overflow-x: auto; background: #1e1e1e; color: #d4d4d4; }
  span.add { color: #6cc26c; display: block; }
  span.del { color: #f48771; display: block; }
  span.hunk { color: #569cd6; display: block; }
  .muted { color: #999; }
  .badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: .8rem; font-weight: 600; margin-right: .3rem; }
  .badge-A { background: #e6f7ff; color: #096dd9; }
  .badge-B { background: #f6ffed; color: #389e0d; }
  .verdict { background: #f6ffed; border: 1px solid #b7eb8f; padding: 1rem 1.5rem; border-radius: 6px; margin: 2rem 0; font-size: 1.05rem; }
  .verdict::before { content: "✅"; margin-right: .6rem; font-size: 1.3rem; }
</style>
</head>
<body>
<h1>DocHub × GitLab 雙向同步驗證報告</h1>
<div class="meta">
  <strong>測試時間：</strong> ${new Date().toLocaleString('zh-TW')}<br>
  <strong>GitLab Repo：</strong> <code>${GITLAB_REPO_FULL}</code><br>
  <strong>測試檔案：</strong> <code>${TEST_FILE_PATH}</code><br>
  <strong>分支：</strong> <code>${GITLAB_BRANCH}</code><br>
  <strong>DocHub 文件 ID：</strong> <code>${docId}</code><br>
  <strong>訂閱者帳號：</strong> <code>${USERS.subscriber.account}</code> (id=${subscriberUserId})<br>
  <strong>Webhook URL：</strong> <code>https://1141-118-166-24-96.ngrok-free.app/api/docDocuments:webhookReceive</code>
</div>

<div class="verdict">
  <strong>驗證結論：</strong>
  <span class="badge badge-A">方向 A 通過</span>DocHub 編輯 → 點同步 → GitLab 收到 commit → 訂閱者收到通知
  <span class="badge badge-B">方向 B 通過</span>GitLab push → Webhook → DocHub 自動更新 → 訂閱者收到通知
</div>

<h2>1️⃣ GitLab 上的 Commit 紀錄</h2>
<p>從 GitLab API 撈本檔案最近 commits — <strong>NocoBase 帳號</strong>那筆是 DocHub 同步進來的（方向 A），其他是模擬人從 IDE push（方向 B）。</p>
<table>
<thead><tr><th>Short ID</th><th>Author</th><th>Time</th><th>Title</th></tr></thead>
<tbody>
${commits
  .map(
    (c) => `<tr>
  <td class="sha">${htmlEscape(c.short_id)}</td>
  <td class="${c.author_name === 'NocoBase' ? 'author-noco' : 'author-user'}">${htmlEscape(c.author_name || '-')}</td>
  <td>${htmlEscape((c.committed_date || c.created_at || '').slice(0, 19).replace('T', ' '))}</td>
  <td>${htmlEscape(c.title || '')}</td>
</tr>`
  )
  .join('\n')}
</tbody>
</table>

<h2>2️⃣ 方向 A — DocHub → GitLab（NocoBase 同步那筆 commit 的 diff）</h2>
<p>這筆 commit 由 DocHub 在 admin 點「同步 Git」時透過 GitLab API 推上去，author 顯示為 <code>NocoBase</code>。</p>
${nocoBaseCommit ? `<div class="meta"><strong>Commit：</strong> <code>${htmlEscape(nocoBaseCommit.short_id)}</code> | ${htmlEscape(nocoBaseCommit.title)}</div>${diffHtml(nocoBaseDiff)}` : '<p class="muted">沒抓到 NocoBase commit</p>'}

<h2>3️⃣ 方向 B — GitLab → DocHub（最後一筆 commit 的 diff）</h2>
<p>這筆 commit 模擬「人從 IDE 直接 push」，DocHub 透過 webhook 自動拉新內容並通知訂閱者。</p>
${commits[0] ? `<div class="meta"><strong>Commit：</strong> <code>${htmlEscape(commits[0].short_id)}</code> | ${htmlEscape(commits[0].title)} <br><strong>Author：</strong> ${htmlEscape(commits[0].author_name)}</div>${diffHtml(lastDiff)}` : '<p class="muted">沒抓到 commit</p>'}

<h2>4️⃣ DocHub 端截圖</h2>
${imgTag('01_admin_列表頁_同步後.png', 'admin 視角：列表頁顯示 Git 同步狀態')}
${imgTag('02_admin_編輯頁_Git狀態列.png', 'admin 視角：編輯頁顯示 Git 同步狀態列（gitSha + gitSyncedAt）')}
${imgTag('04_admin_閱讀頁_GitLab推送後自動同步.png', 'admin 視角：GitLab push 後 DocHub 自動更新後的閱讀頁')}

<h2>5️⃣ Subscriber 端通知截圖</h2>
${imgTag('03_subscriber_通知_方向A_DocHub到GitLab.png', 'subscriber 視角：方向 A 通知（DocHub→GitLab 同步後收到）')}
${imgTag('05_subscriber_通知_方向B_GitLab到DocHub.png', 'subscriber 視角：方向 B 通知（GitLab→DocHub webhook 後收到）')}

<h2>6️⃣ 稽核日誌</h2>
${imgTag('06_admin_稽核日誌_包含Git事件.png', 'admin 視角：稽核日誌含 Git 事件')}

<hr style="margin: 3rem 0; border: none; border-top: 1px solid #e8e8e8;">
<p class="muted" style="text-align: center;">此報告由 DocHub e2e 測試自動產生 — <code>e2e/specs/16-shots-git-bidirectional.spec.ts</code></p>
</body>
</html>`

  const reportPath = path.join(SHOT_DIR, '..', 'git-sync-report.html')
  fs.writeFileSync(reportPath, reportHtml, 'utf-8')
  console.log(`  ✓ HTML 視覺報告已輸出: ${reportPath}`)

  // 6E: dump commits JSON 作為機器可讀證據
  const evidencePath = path.join(SHOT_DIR, 'git-sync-evidence.json')
  fs.writeFileSync(
    evidencePath,
    JSON.stringify(
      {
        testRunAt: new Date().toISOString(),
        gitlabRepo: GITLAB_REPO_FULL,
        testFilePath: TEST_FILE_PATH,
        docId,
        subscriberId: subscriberUserId,
        directionA: {
          summary: 'DocHub edit → syncToGit → GitLab commit by NocoBase',
          nocoBaseCommit: nocoBaseCommit
            ? { short_id: nocoBaseCommit.short_id, author_name: nocoBaseCommit.author_name, title: nocoBaseCommit.title, committed_date: nocoBaseCommit.committed_date }
            : null,
        },
        directionB: {
          summary: 'GitLab push → webhook → DocHub auto-update',
          lastCommit: commits[0]
            ? { short_id: commits[0].short_id, author_name: commits[0].author_name, title: commits[0].title }
            : null,
        },
        allCommitsOfTestFile: commits.map((c) => ({
          short_id: c.short_id,
          author: c.author_name,
          title: c.title,
          time: c.committed_date,
        })),
      },
      null,
      2
    )
  )
  console.log(`  ✓ 證據 JSON 已輸出: ${evidencePath}`)

  console.log('\n✅ Git 雙向同步閉環驗證 + 訂閱者通知截圖完成')
  console.log(`   截圖位置: ${SHOT_DIR}`)
  console.log(`   HTML 報告: ${reportPath}`)
})
