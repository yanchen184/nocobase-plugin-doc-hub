import { test } from '@playwright/test'
import { loginAsAdmin } from '../fixtures/auth'
import { waitReady, shot, loadSeedMeta } from '../fixtures/shot'

/**
 * Chapter 5：表單範本系統
 *  - 01_template_list：範本列表頁（/admin/doc-hub/templates）
 *  - 02_template_builder：範本建構器 Modal（新增範本）
 *  - 03_template_fill：選擇「使用範本」後的填寫頁（TemplateFillPage）
 *  - 04_template_viewer：範本文件的閱讀模式（表單式呈現）
 */

test.setTimeout(240000)

test('ch5: 範本系統', async ({ page }) => {
  const meta = loadSeedMeta()
  await page.setViewportSize({ width: 1440, height: 900 })
  await loginAsAdmin(page)
  page.on('dialog', (d) => d.dismiss().catch(() => {}))

  // 01. 範本列表頁
  await page.goto('/admin/doc-hub/templates', { timeout: 60000 })
  await page.waitForSelector('.ant-table, button', { timeout: 25000 }).catch(() => {})
  await waitReady(page, 2500)
  await shot(page, 'ch5', '01_template_list')

  // 02. 範本建構器 Modal（點「新增範本」）
  const newTplBtn = page
    .locator('button')
    .filter({ hasText: /新增範本|新增|建立/ })
    .first()
  if (await newTplBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await newTplBtn.click()
    await page.waitForSelector('.ant-modal-content', { timeout: 5000 }).catch(() => {})
    await page.waitForTimeout(900)
    await shot(page, 'ch5', '02_template_builder')
    await page.keyboard.press('Escape').catch(() => {})
    await page.waitForTimeout(500)
  }

  // 03. 從某個資料夾開啟「新增文件」→ 選「使用範本」
  await page.goto('/admin/doc-hub', { timeout: 60000 })
  await waitReady(page, 1500)
  const projSpan = page.locator('span', { hasText: '📁 DocHub 核心產品' }).first()
  if (await projSpan.isVisible({ timeout: 3000 }).catch(() => false)) {
    await projSpan.click()
    await waitReady(page, 1000)
  }
  const srsSpans = page.locator('span').filter({ hasText: /^📂 SRS$/ })
  const projBox = await projSpan.boundingBox().catch(() => null)
  if (projBox && (await srsSpans.count()) > 0) {
    const boxes = await srsSpans.evaluateAll((els) =>
      els.map((el) => ({ y: el.getBoundingClientRect().top })),
    )
    const targetIdx = boxes.findIndex((b) => b.y > projBox.y && b.y < projBox.y + 300)
    if (targetIdx >= 0) {
      await srsSpans.nth(targetIdx).click()
      await waitReady(page, 1000)
    }
  }
  const newDocBtn = page.locator('button').filter({ hasText: /新增文件/ }).first()
  if (await newDocBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    const isDisabled = await newDocBtn.evaluate((el: HTMLButtonElement) => el.disabled)
    if (!isDisabled) {
      await newDocBtn.click()
      await page.waitForSelector('.ant-modal-content', { timeout: 5000 }).catch(() => {})
      await page.waitForTimeout(600)
      // 步驟 1：點「使用範本」卡片 → 開啟範本選擇器
      const tplCard = page
        .locator('.ant-modal button, .ant-modal div')
        .filter({ hasText: /使用範本/ })
        .first()
      if (await tplCard.isVisible({ timeout: 2000 }).catch(() => false)) {
        await tplCard.click()
        await page.waitForTimeout(800)
        // 步驟 2：在範本選擇器中點「SRS 需求規格」
        const tplPick = page
          .locator('.ant-modal div, .ant-modal button')
          .filter({ hasText: /\[MANUAL\] SRS 需求規格/ })
          .first()
        if (await tplPick.isVisible({ timeout: 2000 }).catch(() => false)) {
          await tplPick.click()
          // 等待導到 TemplateFillPage
          await page.waitForURL(/template-fill/, { timeout: 8000 }).catch(() => {})
          await waitReady(page, 2000)
          await shot(page, 'ch5', '03_template_fill')
        }
      }
    }
  }

  // 04. 範本文件的閱讀模式（若 seed 有 templateDoc）
  if (meta.featured.templateDoc) {
    await page.goto(`/admin/doc-hub/view/${meta.featured.templateDoc}`, { timeout: 60000 })
    await page.waitForSelector('h1, h2, h3, button', { timeout: 25000 }).catch(() => {})
    await waitReady(page, 2000)
    await shot(page, 'ch5', '04_template_viewer')
  }
})
