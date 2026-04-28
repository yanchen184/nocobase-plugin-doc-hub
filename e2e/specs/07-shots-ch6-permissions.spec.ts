import { test } from '@playwright/test'
import { loginAsAdmin } from '../fixtures/auth'
import { waitReady, shot, loadSeedMeta } from '../fixtures/shot'

/**
 * Chapter 6：權限設定
 *  - 01_project_perm_modal：專案層級權限 Modal（🔐 專案權限設定）
 *  - 02_category_perm_modal：資料夾層級權限 Modal（🔐 資料夾權限設定）
 *  - 03_category_perm_custom：資料夾選擇「自訂此資料夾權限」模式
 *  - 04_sidebar_lock_icon：鎖定圖示在文件列表中（審核用）
 */

test.setTimeout(240000)

test('ch6: 權限設定', async ({ page }) => {
  const meta = loadSeedMeta()
  await page.setViewportSize({ width: 1440, height: 900 })
  await loginAsAdmin(page)
  page.on('dialog', (d) => d.dismiss().catch(() => {}))

  // 切到某個專案
  await page.goto('/admin/doc-hub', { timeout: 60000 })
  await waitReady(page, 1500)
  const projSpan = page.locator('span', { hasText: '📁 DocHub 核心產品' }).first()
  if (await projSpan.isVisible({ timeout: 3000 }).catch(() => false)) {
    await projSpan.click()
    await waitReady(page, 1200)
  }

  // 01. 專案權限 Modal（右上角「權限」按鈕）
  const projPermBtn = page
    .locator('button')
    .filter({ hasText: /^權限$/ })
    .first()
  if (await projPermBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await projPermBtn.click()
    await page.waitForSelector('.ant-modal-content', { timeout: 5000 }).catch(() => {})
    await page.waitForTimeout(800)
    await shot(page, 'ch6', '01_project_perm_modal')
    await page.keyboard.press('Escape').catch(() => {})
    await page.waitForTimeout(500)
  }

  // 02. 資料夾權限 Modal — 先切到 SRS 資料夾
  const srsSpans = page.locator('span').filter({ hasText: /^📂 SRS$/ })
  const projBox = await projSpan.boundingBox().catch(() => null)
  if (projBox && (await srsSpans.count()) > 0) {
    const boxes = await srsSpans.evaluateAll((els) =>
      els.map((el) => ({ y: el.getBoundingClientRect().top })),
    )
    const targetIdx = boxes.findIndex((b) => b.y > projBox.y && b.y < projBox.y + 300)
    if (targetIdx >= 0) {
      await srsSpans.nth(targetIdx).click()
      // 等到 breadcrumb 出現 SRS（表示 activeCatId 已設）
      await page
        .locator('text=/SRS/')
        .first()
        .waitFor({ timeout: 5000 })
        .catch(() => {})
      await waitReady(page, 1500)

      // 等到「新增文件」按鈕變為 enabled（表示 activeCatId 已設）
      await page
        .locator('button.ant-btn-primary')
        .filter({ hasText: /新增文件/ })
        .first()
        .waitFor({ state: 'visible', timeout: 5000 })
        .catch(() => {})
      await page.waitForTimeout(500)

      // 點「權限」按鈕（此時應開啟資料夾權限 Modal）
      const catPermBtn = page
        .locator('button')
        .filter({ hasText: /^權限$/ })
        .first()
      if (await catPermBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await catPermBtn.click()
        // 等待 modal 真的出現
        await page
          .locator('.ant-modal-content:visible')
          .first()
          .waitFor({ timeout: 6000 })
          .catch(() => {})
        // 確認 modal 標題含「資料夾權限」
        await page
          .locator('.ant-modal-title, .ant-modal-header strong')
          .filter({ hasText: /資料夾權限|SRS/ })
          .first()
          .waitFor({ timeout: 3000 })
          .catch(() => {})
        await page.waitForTimeout(800)
        await shot(page, 'ch6', '02_category_perm_modal')

        // 03. 切換到「自訂此資料夾權限」模式
        const customRadio = page
          .locator('.ant-modal .ant-radio-wrapper, .ant-modal label')
          .filter({ hasText: /自訂此資料夾|自訂/ })
          .first()
        if (await customRadio.isVisible({ timeout: 2000 }).catch(() => false)) {
          await customRadio.click({ force: true })
          await page.waitForTimeout(800)
          await shot(page, 'ch6', '03_category_perm_custom')
        }
        await page.keyboard.press('Escape').catch(() => {})
        await page.waitForTimeout(500)
      }
    }
  }

  // 04. 鎖定文件的閱讀頁（畫面顯示鎖定狀態）
  if (meta.featured.lockedDoc) {
    await page.goto(`/admin/doc-hub/view/${meta.featured.lockedDoc}`, { timeout: 60000 })
    await page.waitForSelector('h1, h2, button', { timeout: 25000 }).catch(() => {})
    await waitReady(page, 2000)
    await shot(page, 'ch6', '04_locked_doc')
  }
})
