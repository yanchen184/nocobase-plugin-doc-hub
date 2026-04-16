/**
 * DocHub 全功能截圖導覽
 *
 * 執行：npx playwright test 99-screenshot-tour.spec.ts
 * 截圖輸出：e2e/artifacts/screenshots/
 *
 * 涵蓋功能：
 *  01 列表頁（預設）
 *  02 列表頁搜尋
 *  03 新增文件 Modal
 *  04 範本選擇 Modal
 *  05 編輯頁（含 Toolbar）
 *  06 閱讀頁（含進度條）
 *  07 版本歷史
 *  08 版本 Diff
 *  09 文件鎖定 Modal
 *  10 鎖定後列表（disabled 狀態）
 *  11 移動文件 Modal
 *  12 稽核日誌 Modal
 *  13 範本管理頁
 *  14 範本建構器 Modal
 *  15 填寫範本頁
 *  16 專案權限設定 Modal（🔐）
 *  17 圖片上傳區塊
 *  18 列印預覽（before print）
 */

import { test, expect } from '@playwright/test'
import { loginAsAdmin } from '../fixtures/auth'
import { ApiHelper, CleanupStack } from '../fixtures/api'
import * as path from 'path'
import * as fs from 'fs'

const BASE_URL = process.env.BASE_URL || 'http://localhost:13000'
const SHOT_DIR = path.join(__dirname, '../artifacts/screenshots')
const PREFIX = '[TOUR]'

// 確保截圖目錄存在
if (!fs.existsSync(SHOT_DIR)) fs.mkdirSync(SHOT_DIR, { recursive: true })

let api: ApiHelper
let cleanup: CleanupStack
let docId: number
let lockedDocId: number
let projectId: number
let catId: number

async function shot(page: any, name: string) {
  const filePath = path.join(SHOT_DIR, `${name}.png`)
  await page.screenshot({ path: filePath, fullPage: false })
  console.log(`  📸 ${name}.png`)
}

async function shotFull(page: any, name: string) {
  const filePath = path.join(SHOT_DIR, `${name}.png`)
  await page.screenshot({ path: filePath, fullPage: true })
  console.log(`  📸 ${name}.png (full page)`)
}

/** 等待頁面不再有 spinner（NocoBase loading 圓點） */
async function waitReady(page: any, extraMs = 1500) {
  await page.waitForLoadState('networkidle')
  // 等到頁面沒有 loading spinner（最多 20 秒）
  await page.waitForFunction(() => {
    const spinners = document.querySelectorAll('.ant-spin-spinning, [class*="loading"], [class*="spin"]')
    // 如果有 spinner 且不是在 button 內（那種 OK），就還在 loading
    const blocking = Array.from(spinners).filter((el: any) => {
      const style = window.getComputedStyle(el)
      return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null
    })
    return blocking.length === 0
  }, { timeout: 20000 }).catch(() => {})
  await page.waitForTimeout(extraMs)
}

test.beforeAll(async () => {
  api = await ApiHelper.create()
  cleanup = new CleanupStack()

  // 用已知存在的 project/cat（API 確認：projectId=1, catId=1）
  projectId = 1
  catId = 1

  // 建立一個截圖用的 demo 文件
  const demoContent = `# DocHub 操作手冊示範文件

這是一份示範文件，用於展示 DocHub 的所有功能。

## 主要功能

- **Markdown 編輯器** — 支援即時預覽、分割視窗
- **版本控制** — 每次儲存自動建立版本，支援 Diff 比較
- **文件鎖定** — 防止多人同時編輯衝突
- **權限管理** — 專案層級 Viewer / Editor / Subscriber

## 程式碼範例

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`
}
\`\`\`

## 表格範例

| 功能 | 說明 | 狀態 |
|------|------|------|
| 版本歷史 | 自動記錄每次修改 | ✅ |
| 全文搜尋 | PostgreSQL tsvector | ✅ |
| Git 同步 | GitHub / GitLab | ✅ |

> 這是一個引用區塊，用來突顯重要資訊。

---

### 小結

DocHub 讓您的團隊文件管理更有效率！`

  const created = await api.createDocument({
    title: `${PREFIX} 示範文件`,
    content: demoContent,
    projectId: projectId || undefined,
    categoryId: catId || undefined,
    status: 'published',
  } as any)
  if (created?.id) {
    docId = created.id
    cleanup.push(() => api.deleteDocument(docId))
  }

  // 建立一個「鎖定中」的文件
  const locked = await api.createDocument({
    title: `${PREFIX} 鎖定示範`,
    content: '# 此文件已鎖定\n\n管理員已鎖定此文件，暫時禁止編輯。',
    projectId: projectId || undefined,
    categoryId: catId || undefined,
    status: 'published',
  } as any)
  if (locked?.id) {
    lockedDocId = locked.id
    cleanup.push(async () => {
      await api.unlockDocument(lockedDocId).catch(() => {})
      await api.deleteDocument(lockedDocId)
    })
    await api.lockDocument(lockedDocId)
  }
})

test.afterAll(async () => {
  if (cleanup) await cleanup.flush()
  if (api) await api.dispose()
})

test.setTimeout(300000) // 5 分鐘，截圖 tour 需要長時間

test('DocHub 全功能截圖導覽', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await loginAsAdmin(page)

  // ── 01. 列表頁（預設） ────────────────────────────────────────────────────
  await page.goto(`${BASE_URL}/admin/doc-hub`, { timeout: 60000 })
  await waitReady(page, 2000)
  await shot(page, '01_列表頁')

  // ── 02. 列表頁搜尋 ────────────────────────────────────────────────────────
  const searchInput = page.locator('.dochub-search-input')
  if (await searchInput.isVisible()) {
    await searchInput.fill('示範')
    await page.waitForTimeout(1000)
    await shot(page, '02_列表搜尋結果')
    await searchInput.clear()
    await page.waitForTimeout(500)
  }

  // ── 03. 新增文件 Modal ────────────────────────────────────────────────────
  const addBtn = page.locator('button').filter({ hasText: /新增|建立文件/ }).first()
  if (await addBtn.isVisible()) {
    await addBtn.click()
    await page.waitForTimeout(1000)
    await shot(page, '03_新增文件Modal')
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)
  }

  // ── 04. 編輯頁（新文件） ──────────────────────────────────────────────────
  if (docId) {
    await page.goto(`${BASE_URL}/admin/doc-hub/edit/${docId}`, { timeout: 60000 })
    // 等 textarea 出現（AMD 載入慢）
    await page.waitForSelector('textarea', { timeout: 25000 }).catch(() => {})
    await waitReady(page, 2000)
    await shot(page, '04_編輯頁')

    // 模擬輸入（觸發 dirty 狀態）
    const textarea = page.locator('textarea').first()
    if (await textarea.isVisible()) {
      await textarea.click()
      await page.keyboard.press('End')
      await page.keyboard.type('\n\n> 自動儲存測試行')
      await page.waitForTimeout(500)
      await shot(page, '04b_編輯頁_dirty狀態')
    }
  }

  // ── 05. 閱讀頁（含進度條）— 用確認有內容的舊文件 id=2 ──────────────────
  // 不用 docId（剛建的測試文件可能沒 viewers 設定），用 id=2 這篇確認有內容
  await page.goto(`${BASE_URL}/admin/doc-hub/view/2`, { timeout: 60000 })
  // 等 h1/h2 或 button 出現（內容渲染完成的訊號）
  await page.waitForSelector('h1, h2, h3, button.ant-btn', { timeout: 25000 }).catch(() => {})
  await waitReady(page, 2000)
  await shot(page, '05_閱讀頁')

  // 模擬滾動觸發進度條
  await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'smooth' }))
  await page.waitForTimeout(800)
  await shot(page, '05b_閱讀頁_進度條')

  // 滾到底部
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }))
  await page.waitForTimeout(800)
  await shot(page, '05c_閱讀頁_底部')

  // ── 06. 版本歷史 — 用 docId=59（確認有版本記錄） ────────────────────────
  await page.goto(`${BASE_URL}/admin/doc-hub/versions/59`, { timeout: 60000 })
  await page.waitForSelector('.ant-table-row, button, [class*="version"]', { timeout: 20000 }).catch(() => {})
  await waitReady(page, 2000)
  // 關閉可能出現的錯誤通知（文件本身已刪除但版本記錄還在）
  await page.locator('.ant-notification-close-icon, .ant-message-notice-close').first().click({ timeout: 2000 }).catch(() => {})
  await page.waitForTimeout(500)
  await shot(page, '06_版本歷史')

  // 若有版本，嘗試點 Diff
  const diffBtn = page.locator('button').filter({ hasText: /比較|diff/i }).first()
  if (await diffBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await diffBtn.click()
    await page.waitForTimeout(1000)
    await shot(page, '06b_版本Diff')
    await page.keyboard.press('Escape')
  }

  // ── 07. 文件鎖定 Modal ────────────────────────────────────────────────────
  await page.goto(`${BASE_URL}/admin/doc-hub`, { timeout: 60000 })
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1500)

  // 找到未鎖定文件的鎖定按鈕
  if (docId) {
    await page.goto(`${BASE_URL}/admin/doc-hub/view/${docId}`, { timeout: 60000 })
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    const lockBtn = page.locator('button').filter({ hasText: /鎖定/ }).first()
    if (await lockBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await lockBtn.click()
      await page.waitForTimeout(800)
      await shot(page, '07_鎖定確認Modal')
      await page.keyboard.press('Escape')
      await page.waitForTimeout(400)
    }
  }

  // ── 08. 鎖定中文件的閱讀頁（顯示 locked badge） ─────────────────────────
  if (lockedDocId) {
    await page.goto(`${BASE_URL}/admin/doc-hub/view/${lockedDocId}`, { timeout: 60000 })
    await page.waitForSelector('h1, h2, h3, button.ant-btn', { timeout: 25000 }).catch(() => {})
    await waitReady(page, 2000)
    await shot(page, '08_鎖定文件閱讀頁')
  }

  // ── 09. 列表（含鎖定標示） ───────────────────────────────────────────────
  await page.goto(`${BASE_URL}/admin/doc-hub`, { timeout: 60000 })
  await page.waitForSelector('tr.ant-table-row, .ant-empty', { timeout: 15000 }).catch(() => {})
  await waitReady(page, 2000)
  await shot(page, '09_列表含鎖定標示')

  // ── 10. 移動文件 Modal ────────────────────────────────────────────────────
  if (docId) {
    // hover row 找移動按鈕
    const rows = page.locator('tr.ant-table-row')
    const rowCount = await rows.count()
    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i)
      const titleCell = row.locator('td').nth(1)
      const titleText = await titleCell.textContent().catch(() => '')
      if (titleText && titleText.includes('示範文件')) {
        await row.hover()
        await page.waitForTimeout(400)
        const moveBtn = row.locator('button[title*="移動"], button').filter({ hasText: /移動/ }).first()
        if (await moveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await moveBtn.click()
          await page.waitForTimeout(800)
          await shot(page, '10_移動文件Modal')
          await page.keyboard.press('Escape')
        }
        break
      }
    }
  }

  // ── 11. 稽核日誌 Modal ────────────────────────────────────────────────────
  const auditBtn = page.locator('button').filter({ hasText: /稽核日誌|Audit/ }).first()
  if (await auditBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await auditBtn.click()
    await page.waitForTimeout(1200)
    await shot(page, '11_稽核日誌')
    await page.keyboard.press('Escape')
    await page.waitForTimeout(400)
  } else {
    // 也可能在 sidebar 底部
    const sidebarAudit = page.locator('[class*="sidebar"] button, .ant-menu-item').filter({ hasText: /稽核/ }).first()
    if (await sidebarAudit.isVisible({ timeout: 2000 }).catch(() => false)) {
      await sidebarAudit.click()
      await page.waitForTimeout(1200)
      await shot(page, '11_稽核日誌')
      await page.keyboard.press('Escape')
    }
  }

  // ── 12. 範本管理頁 ────────────────────────────────────────────────────────
  await page.goto(`${BASE_URL}/admin/doc-hub/templates`, { timeout: 60000 })
  await page.waitForSelector('button, .ant-empty, .ant-table', { timeout: 15000 }).catch(() => {})
  await waitReady(page, 1500)
  await shot(page, '12_範本管理頁')

  // ── 13. 範本建構器 Modal ──────────────────────────────────────────────────
  const newTplBtn = page.locator('button').filter({ hasText: /新增範本|建立範本/ }).first()
  if (await newTplBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await newTplBtn.click()
    await page.waitForTimeout(1000)
    await shot(page, '13_範本建構器Modal')
    await page.keyboard.press('Escape')
    await page.waitForTimeout(400)
  }

  // ── 14. 選擇範本 Modal（從新增文件流程） ─────────────────────────────────
  await page.goto(`${BASE_URL}/admin/doc-hub`, { timeout: 60000 })
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1500)

  const addBtn2 = page.locator('button').filter({ hasText: /新增|建立文件/ }).first()
  if (await addBtn2.isVisible({ timeout: 3000 }).catch(() => false)) {
    await addBtn2.click()
    await page.waitForTimeout(800)
    // 在 NewDocModal 找「從範本建立」
    const fromTplOpt = page.locator('text=從範本建立').or(page.locator('button').filter({ hasText: /範本/ })).first()
    if (await fromTplOpt.isVisible({ timeout: 2000 }).catch(() => false)) {
      await fromTplOpt.click()
      await page.waitForTimeout(1000)
      await shot(page, '14_選擇範本Modal')
    }
    await page.keyboard.press('Escape')
    await page.waitForTimeout(400)
  }

  // ── 15. 專案權限設定 Modal（🔐） ─────────────────────────────────────────
  const permBtn = page.locator('button').filter({ hasText: '🔐' }).first()
  if (await permBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await permBtn.click()
    await page.waitForTimeout(1000)
    await shot(page, '15_專案權限Modal')
    await page.keyboard.press('Escape')
    await page.waitForTimeout(400)
  } else {
    // 找 sidebar 中的 🔐 按鈕
    const sidePermBtn = page.locator('button[title*="權限"]').first()
    if (await sidePermBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await sidePermBtn.click()
      await page.waitForTimeout(1000)
      await shot(page, '15_專案權限Modal')
      await page.keyboard.press('Escape')
    }
  }

  // ── 16. 側邊欄（展開狀態） ───────────────────────────────────────────────
  await page.goto(`${BASE_URL}/admin/doc-hub`, { timeout: 60000 })
  await page.waitForSelector('tr.ant-table-row, .ant-empty', { timeout: 15000 }).catch(() => {})
  await waitReady(page, 2000)
  // 截圖整個左側 sidebar
  const sidebar = page.locator('[class*="sidebar"], aside, .dochub-sidebar').first()
  if (await sidebar.isVisible({ timeout: 2000 }).catch(() => false)) {
    await sidebar.screenshot({ path: path.join(SHOT_DIR, '16_側邊欄.png') })
    console.log('  📸 16_側邊欄.png')
  }

  // ── 17. 最近查看（如有資料） ─────────────────────────────────────────────
  // 先瀏覽幾頁讓 recent 有資料
  if (docId) {
    await page.goto(`${BASE_URL}/admin/doc-hub/view/${docId}`, { timeout: 60000 })
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
  }
  await page.goto(`${BASE_URL}/admin/doc-hub`, { timeout: 60000 })
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000)
  // 截最下方 sidebar（含最近查看）
  await page.evaluate(() => {
    const el = document.querySelector('[class*="sidebar"] > div:last-child, aside > div:last-child')
    if (el) el.scrollIntoView()
  })
  await page.waitForTimeout(500)
  await shot(page, '17_最近查看_Sidebar底部')

  // ── 18. 全頁截圖（final overview） ───────────────────────────────────────
  await page.goto(`${BASE_URL}/admin/doc-hub`, { timeout: 60000 })
  await page.waitForSelector('tr.ant-table-row, .ant-empty', { timeout: 15000 }).catch(() => {})
  await waitReady(page, 2000)
  await shotFull(page, '18_列表頁_全頁')

  // ── 完成 ──────────────────────────────────────────────────────────────────
  console.log(`\n✅ 截圖完成，共 ${fs.readdirSync(SHOT_DIR).filter(f => f.endsWith('.png')).length} 張`)
  console.log(`📁 輸出目錄：${SHOT_DIR}`)
})
