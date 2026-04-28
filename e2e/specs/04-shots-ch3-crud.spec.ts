import { test } from '@playwright/test'
import { loginAsAdmin } from '../fixtures/auth'
import { waitReady, shot, loadSeedMeta } from '../fixtures/shot'

/**
 * Chapter 3：文件 CRUD
 *  - 01_view_page：閱讀頁
 *  - 02_edit_page：編輯頁（空白內容）
 *  - 03_new_doc_modal：「新增文件」Modal
 *  - 04_delete_confirm：hover row → 刪除確認
 *  - 05_edit_dirty：編輯頁（輸入內容後的 dirty 狀態）— 放最後避免 beforeunload 擋導覽
 */

test.setTimeout(240000)

test('ch3: CRUD', async ({ page }) => {
  const meta = loadSeedMeta()
  await page.setViewportSize({ width: 1440, height: 900 })
  await loginAsAdmin(page)

  // 防 beforeunload 擋截圖流程
  page.on('dialog', (d) => d.dismiss().catch(() => {}))

  // 01. 閱讀頁（已發布文件）
  await page.goto(`/admin/doc-hub/view/${meta.featured.publishedDoc}`, { timeout: 60000 })
  await page.waitForSelector('h1, h2, button.ant-btn', { timeout: 25000 }).catch(() => {})
  await waitReady(page, 2000)
  await shot(page, 'ch3', '01_view_page')

  // 02. 編輯頁（空白內容）
  await page.goto(`/admin/doc-hub/edit/${meta.featured.publishedDoc}`, { timeout: 60000 })
  await page.waitForSelector('textarea, .ProseMirror, [contenteditable]', { timeout: 25000 }).catch(() => {})
  await waitReady(page, 2000)
  await shot(page, 'ch3', '02_edit_page')

  // 切到某個專案 → 資料夾（才會解鎖「新增文件」按鈕）
  // 註：專案層只顯示概覽，必須選到資料夾才能新增文件（Tooltip 提示）
  await page.goto('/admin/doc-hub', { timeout: 60000 })
  await waitReady(page, 1800)
  const projSpan = page.locator('span', { hasText: '📁 DocHub 核心產品' }).first()
  if (await projSpan.isVisible({ timeout: 3000 }).catch(() => false)) {
    await projSpan.click()
    await waitReady(page, 1200)
  }
  // 點「DocHub 核心產品」下的第一個 📂 SRS（用 bbox 選正確的那一個）
  const srsSpans = page.locator('span').filter({ hasText: /^📂 SRS$/ })
  const projBox = await projSpan.boundingBox().catch(() => null)
  if (projBox && (await srsSpans.count()) > 0) {
    const boxes = await srsSpans.evaluateAll((els) =>
      els.map((el) => ({ y: el.getBoundingClientRect().top })),
    )
    const targetIdx = boxes.findIndex((b) => b.y > projBox.y && b.y < projBox.y + 300)
    if (targetIdx >= 0) {
      await srsSpans.nth(targetIdx).click()
      await waitReady(page, 1200)
    }
  }

  // 03. 新增文件 Modal（進入資料夾後按「新增文件」）
  const newBtn = page.locator('button').filter({ hasText: /新增文件/ }).first()
  if (await newBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    // 確認按鈕已啟用
    const isDisabled = await newBtn.evaluate((el: HTMLButtonElement) => el.disabled)
    if (isDisabled) {
      console.log('  ⚠️ 新增文件按鈕仍為 disabled，跳過 03')
    } else {
      await newBtn.click({ timeout: 5000 })
      await page.waitForSelector('.ant-modal-content', { timeout: 5000 }).catch(() => {})
      await page.waitForTimeout(800)
      await shot(page, 'ch3', '03_new_doc_modal')
      await page.keyboard.press('Escape').catch(() => {})
      await page.waitForTimeout(500)
    }
  }

  // 04. 刪除確認（進入專案後 row 上有 ⋯ 選單）
  const rows = page.locator('.ant-table-row')
  if ((await rows.count()) > 0) {
    const firstRow = rows.nth(0)
    await firstRow.hover()
    await page.waitForTimeout(400)
    const moreBtn = firstRow.locator('button').filter({ hasText: /⋯|\.\.\./ }).first()
    if (await moreBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await moreBtn.click({ force: true }).catch(() => {})
      await page.waitForTimeout(600)
      const delItem = page
        .locator('.ant-dropdown-menu-item, [role="menuitem"]')
        .filter({ hasText: '刪除' })
        .first()
      if (await delItem.isVisible({ timeout: 1500 }).catch(() => false)) {
        await delItem.click().catch(() => {})
        await page.waitForTimeout(700)
        await shot(page, 'ch3', '04_delete_confirm')
        // 按取消不真刪（Antd CJK 會變「取 消」）
        const cancelBtn = page
          .locator('.ant-modal button, .ant-popover button')
          .filter({ hasText: /取.?消|Cancel/ })
          .last()
        await cancelBtn.click().catch(() => {
          page.keyboard.press('Escape').catch(() => {})
        })
        await page.waitForTimeout(400)
      }
    }
  }

  // 05. 輸入內容產生 dirty 狀態（放最後，之後不需要再導覽離開）
  await page.goto(`/admin/doc-hub/edit/${meta.featured.publishedDoc}`, { timeout: 60000 })
  await page.waitForSelector('textarea, [contenteditable]', { timeout: 25000 }).catch(() => {})
  await waitReady(page, 2000)
  const editor = page.locator('textarea, [contenteditable]').first()
  if (await editor.isVisible({ timeout: 2000 }).catch(() => false)) {
    await editor.click()
    await page.keyboard.press('End')
    await page.keyboard.type('\n\n<!-- 示範編輯中 -->')
    await page.waitForTimeout(500)
    await shot(page, 'ch3', '05_edit_dirty')
  }
})
