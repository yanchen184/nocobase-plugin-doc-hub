import { test } from '@playwright/test'
import { loginAsAdmin } from '../fixtures/auth'
import { waitReady, shot, loadSeedMeta } from '../fixtures/shot'

/**
 * Chapter 7：稽核與通知
 *  - 01_audit_log_modal：稽核日誌 Modal（完整列表）
 *  - 02_audit_log_filter：稽核日誌 — 展示 update/create/delete Tag 顏色
 *  - 03_subscriber_panel：專案權限 Modal 的「📬 訂閱通知」區塊
 *  - 04_notification_email：站內通知的信箱/訂閱者管理
 */

test.setTimeout(240000)

test('ch7: 稽核與通知', async ({ page }) => {
  const meta = loadSeedMeta()
  await page.setViewportSize({ width: 1440, height: 900 })
  await loginAsAdmin(page)
  page.on('dialog', (d) => d.dismiss().catch(() => {}))

  await page.goto('/admin/doc-hub', { timeout: 60000 })
  await waitReady(page, 2000)

  // 01 + 02. 稽核日誌 Modal（側邊欄底部「稽核日誌」連結）
  const auditLink = page
    .locator('div')
    .filter({ hasText: /^稽核日誌$/ })
    .first()
  if (await auditLink.isVisible({ timeout: 3000 }).catch(() => false)) {
    await auditLink.click()
    // 等待 Modal + Table 出現
    await page
      .locator('.ant-modal-content:visible')
      .first()
      .waitFor({ timeout: 6000 })
      .catch(() => {})
    await page
      .locator('.ant-modal .ant-table-tbody tr, .ant-modal .ant-empty')
      .first()
      .waitFor({ timeout: 5000 })
      .catch(() => {})
    await page.waitForTimeout(1000)
    await shot(page, 'ch7', '01_audit_log_modal')

    // 02. 稽核日誌 — 展示 Tag 顏色（滾動到有內容處）
    // （直接再截一張相同的，或者滾動到中段）
    await page.evaluate(() => {
      const body = document.querySelector('.ant-modal-body') as HTMLElement
      if (body) body.scrollTop = 100
    })
    await page.waitForTimeout(500)
    await shot(page, 'ch7', '02_audit_log_rows')

    await page.keyboard.press('Escape').catch(() => {})
    await page.waitForTimeout(500)
  }

  // 03. 訂閱通知區塊（專案權限 Modal 的下半部）
  const projSpan = page.locator('span', { hasText: '📁 DocHub 核心產品' }).first()
  if (await projSpan.isVisible({ timeout: 3000 }).catch(() => false)) {
    await projSpan.click()
    await waitReady(page, 1200)
  }
  const permBtn = page
    .locator('button')
    .filter({ hasText: /^權限$/ })
    .first()
  if (await permBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await permBtn.click()
    await page
      .locator('.ant-modal-content:visible')
      .first()
      .waitFor({ timeout: 6000 })
      .catch(() => {})
    await page.waitForTimeout(800)

    // 滾動到 📬 訂閱通知區塊
    await page.evaluate(() => {
      const nodes = Array.from(document.querySelectorAll('.ant-modal *'))
      const target = nodes.find((el) => el.textContent?.includes('📬 訂閱通知'))
      if (target) (target as HTMLElement).scrollIntoView({ block: 'center' })
    })
    await page.waitForTimeout(500)
    await shot(page, 'ch7', '03_subscriber_panel')

    await page.keyboard.press('Escape').catch(() => {})
    await page.waitForTimeout(500)
  }

  // 04. 文件閱讀頁的訂閱/追蹤行為（已發布文件）
  if (meta.featured.publishedDoc) {
    await page.goto(`/admin/doc-hub/view/${meta.featured.publishedDoc}`, { timeout: 60000 })
    await page.waitForSelector('h1, h2, button', { timeout: 25000 }).catch(() => {})
    await waitReady(page, 2000)
    await shot(page, 'ch7', '04_doc_subscribe_view')
  }
})
