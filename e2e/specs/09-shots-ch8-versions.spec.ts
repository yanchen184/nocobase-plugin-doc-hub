import { test } from '@playwright/test'
import { loginAsAdmin } from '../fixtures/auth'
import { waitReady, shot, loadSeedMeta } from '../fixtures/shot'

/**
 * Chapter 8：版本歷史與差異
 *  - 01_version_page：版本歷史頁（左側版本列表 + 右側 diff）
 *  - 02_version_diff：選擇某版本看 diff（+/- 顯示）
 *  - 03_version_summary：點版本摘要欄位進入編輯模式
 *  - 04_version_entry：從「…」選單點「版本歷史」進入版本頁
 */

test.setTimeout(240000)

test('ch8: 版本歷史', async ({ page }) => {
  const meta = loadSeedMeta()
  await page.setViewportSize({ width: 1440, height: 900 })
  await loginAsAdmin(page)
  page.on('dialog', (d) => d.dismiss().catch(() => {}))

  const docId = meta.featured.docWithVersions
  if (!docId) {
    console.log('  ⚠️ seed-meta.featured.docWithVersions 不存在，跳過 ch8')
    return
  }

  // 01 + 02. 版本歷史頁（直接 URL）
  await page.goto(`/admin/doc-hub/versions/${docId}`, { timeout: 60000 })
  await page
    .locator('button, .ant-table-row, [class*="version"]')
    .first()
    .waitFor({ timeout: 20000 })
    .catch(() => {})
  await waitReady(page, 2500)
  await shot(page, 'ch8', '01_version_page')

  // 02. 點擊第二個版本看 diff — version Tag 是 "v2"
  const v2Tag = page
    .locator('.ant-tag')
    .filter({ hasText: /^v2$/ })
    .first()
  if (await v2Tag.isVisible({ timeout: 3000 }).catch(() => false)) {
    await v2Tag.click({ force: true }).catch(() => {})
    await page.waitForTimeout(1200)
    await shot(page, 'ch8', '02_version_diff')
  } else {
    await shot(page, 'ch8', '02_version_diff')
  }

  // 03. 列表頁 → 文件 row 的「⋯」選單 → 展示「版本歷史/移動/鎖定/刪除」
  await page.goto('/admin/doc-hub', { timeout: 60000 })
  await waitReady(page, 1500)
  const projSpan = page.locator('span', { hasText: '📁 DocHub 核心產品' }).first()
  if (await projSpan.isVisible({ timeout: 3000 }).catch(() => false)) {
    await projSpan.click()
    await waitReady(page, 1200)
  }
  // 找「⋯」按鈕（table row 裡面）
  const ellipsisBtn = page.locator('button.ant-btn-sm').filter({ hasText: '⋯' }).first()
  if (await ellipsisBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await ellipsisBtn.click()
    await page
      .locator('.ant-dropdown-menu:visible')
      .first()
      .waitFor({ timeout: 3000 })
      .catch(() => {})
    await page.waitForTimeout(500)
    await shot(page, 'ch8', '03_version_entry_menu')
    await page.keyboard.press('Escape').catch(() => {})
    await page.waitForTimeout(400)
  }

  // 04. 回到版本歷史頁 — 點摘要欄位進入編輯
  await page.goto(`/admin/doc-hub/versions/${docId}`, { timeout: 60000 })
  await waitReady(page, 2500)

  // 尋找帶有「edit」圖示的小按鈕
  const editSummBtn = page
    .locator('button, [role="button"]')
    .filter({ has: page.locator('span[aria-label="edit"]') })
    .first()
  if (await editSummBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await editSummBtn.click({ force: true }).catch(() => {})
    await page.waitForTimeout(600)
    await shot(page, 'ch8', '04_version_summary_edit')
  } else {
    await shot(page, 'ch8', '04_version_summary_edit')
  }
})
