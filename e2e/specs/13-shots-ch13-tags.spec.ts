import { test } from '@playwright/test'
import { loginAsAdmin } from '../fixtures/auth'
import { waitReady, shot, shotFull } from '../fixtures/shot'

/**
 * MANUAL.md 第 13 章：標籤管理（Tags）
 *  - 01_edit_tags_meta：編輯頁 Meta bar 的「標籤」輸入框（已填入 3 個標籤）
 *  - 02_view_tags_row：閱讀頁 Meta 下方的彩色標籤列
 *  - 03_list_tag_chips：列表頁標題下方顯示標籤 chips
 *  - 04_list_filter_banner：?tags=urgent 篩選橫幅
 *  - 05_sidebar_tags_section：側邊欄 🏷 標籤 Top 10 面板
 *  - 06_tag_manager_list：/admin/doc-hub/tags 管理頁列表
 *  - 07_tag_manager_merge_modal：合併標籤 Modal
 */

test.setTimeout(240000)

const DEMO_DOC_ID = 640

test('ch13tags: 標籤系統截圖', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await loginAsAdmin(page)
  page.on('dialog', (d) => d.dismiss().catch(() => {}))

  // ── 01. 編輯頁 Meta bar 標籤欄位 ──────────────────────────────────────
  await page.goto(`/admin/doc-hub/edit/${DEMO_DOC_ID}`, { timeout: 60000 })
  await page.waitForSelector('#dochub-editor, textarea', { timeout: 30000 })
  await waitReady(page, 2500)
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(400)
  await shot(page, 'ch13', '01_edit_tags_meta')

  // ── 02. 閱讀頁標籤列 ────────────────────────────────────────────────
  await page.goto(`/admin/doc-hub/view/${DEMO_DOC_ID}`, { timeout: 60000 })
  await page.waitForSelector('h1, h2, h3, button.ant-btn', { timeout: 30000 }).catch(() => {})
  await waitReady(page, 2500)
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(400)
  await shot(page, 'ch13', '02_view_tags_row')

  // ── 03. 列表頁：看到多筆帶標籤的文件 ──────────────────────────────────
  await page.goto('/admin/doc-hub', { timeout: 60000 })
  await page.waitForSelector('table, .ant-table', { timeout: 30000 }).catch(() => {})
  await waitReady(page, 2500)
  await shot(page, 'ch13', '03_list_tag_chips')

  // ── 04. 列表頁：?tags=urgent 篩選橫幅 ────────────────────────────────
  await page.goto('/admin/doc-hub?tags=urgent', { timeout: 60000 })
  await page.waitForSelector('table, .ant-table', { timeout: 30000 }).catch(() => {})
  await waitReady(page, 2500)
  await shot(page, 'ch13', '04_list_filter_banner')

  // ── 05. 側邊欄 🏷 標籤面板 ───────────────────────────────────────────
  await page.goto('/admin/doc-hub', { timeout: 60000 })
  await waitReady(page, 2000)
  // 展開可能被收合的 sidebar tag 區塊
  const tagHeader = page.locator('text=/🏷.*標籤/').first()
  if (await tagHeader.isVisible({ timeout: 2000 }).catch(() => false)) {
    await tagHeader.scrollIntoViewIfNeeded().catch(() => {})
    await page.waitForTimeout(600)
  }
  await shot(page, 'ch13', '05_sidebar_tags_section')

  // ── 06. 標籤管理頁 ──────────────────────────────────────────────────
  await page.goto('/admin/doc-hub/tags', { timeout: 60000 })
  await page.waitForSelector('table, .ant-table', { timeout: 30000 }).catch(() => {})
  await waitReady(page, 2500)
  await shot(page, 'ch13', '06_tag_manager_list')

  // ── 07. 合併 Modal ──────────────────────────────────────────────────
  // 找 architecture 那一列的「合併」按鈕（usageCount=2，適合當 source）
  const mergeRow = page.locator('tr').filter({ hasText: 'architecture' }).first()
  if (await mergeRow.isVisible({ timeout: 3000 }).catch(() => false)) {
    const mergeBtn = mergeRow.locator('button').filter({ hasText: /合併|Merge/ }).first()
    if (await mergeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await mergeBtn.click()
      await page.waitForTimeout(1000)
      await shot(page, 'ch13', '07_tag_manager_merge_modal')
      await page.keyboard.press('Escape')
      await page.waitForTimeout(400)
    }
  }

  // ── 08. 全頁（完整示範） ─────────────────────────────────────────────
  await page.goto('/admin/doc-hub/tags', { timeout: 60000 })
  await waitReady(page, 2000)
  await shotFull(page, 'ch13', '08_tag_manager_full')
})
