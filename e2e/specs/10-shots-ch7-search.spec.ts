import { test } from '@playwright/test'
import { loginAsAdmin } from '../fixtures/auth'
import { waitReady, shot, loadSeedMeta } from '../fixtures/shot'

/**
 * MANUAL.md 第 7 章：全文搜尋
 *  - 01_search_empty_input：搜尋框 (⌘K) 聚焦、尚未輸入
 *  - 02_search_results：輸入關鍵字後的搜尋結果（標題/片段黃底高亮）
 *  - 03_search_with_filter：搜尋 + 專案/資料夾篩選組合
 *  - 04_search_no_results：查無結果狀態
 */

test.setTimeout(240000)

test('ch7search: 全文搜尋', async ({ page }) => {
  loadSeedMeta()
  await page.setViewportSize({ width: 1440, height: 900 })
  await loginAsAdmin(page)
  page.on('dialog', (d) => d.dismiss().catch(() => {}))

  await page.goto('/admin/doc-hub', { timeout: 60000 })
  await waitReady(page, 2000)

  const searchInput = page.locator('.dochub-search-input').first()

  // 01. 空搜尋框（聚焦）
  if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    await searchInput.click()
    await page.waitForTimeout(400)
    await shot(page, 'ch7search', '01_search_empty_input')
  }

  // 02. 輸入關鍵字 → 展示命中結果
  await searchInput.fill('')
  await page.waitForTimeout(300)
  await searchInput.fill('MANUAL')
  // debounce 400ms + API + 高亮渲染
  await page.waitForTimeout(1500)
  await waitReady(page, 500)
  await shot(page, 'ch7search', '02_search_results')

  // 03. 搜尋結果 + 專案篩選（點左側某個專案 → 限縮範圍）
  const projSpan = page.locator('span', { hasText: /^📁\s\[MANUAL\]/ }).first()
  if (await projSpan.isVisible({ timeout: 3000 }).catch(() => false)) {
    await projSpan.click()
    await page.waitForTimeout(1000)
    await waitReady(page, 500)
    await shot(page, 'ch7search', '03_search_with_filter')
  }

  // 04. 查無結果
  await searchInput.fill('')
  await page.waitForTimeout(300)
  await searchInput.fill('XyZ不存在ZZZ999')
  await page.waitForTimeout(1500)
  await waitReady(page, 500)
  await shot(page, 'ch7search', '04_search_no_results')

  // 清空搜尋框以免影響後續
  await searchInput.fill('')
  await page.waitForTimeout(300)
})
