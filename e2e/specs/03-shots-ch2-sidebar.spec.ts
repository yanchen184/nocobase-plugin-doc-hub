import { test } from '@playwright/test'
import { loginAsAdmin } from '../fixtures/auth'
import { waitReady, shot, loadSeedMeta } from '../fixtures/shot'

/**
 * Chapter 2：側邊欄（導覽）
 *  - 01_sidebar_default：側邊欄預設展開
 *  - 02_sidebar_search：輸入搜尋關鍵字
 *  - 03_sidebar_collapsed：側欄收合（icon-only）
 *  - 04_sidebar_expanded：重新展開
 */

test.setTimeout(180000)

test('ch2: 側邊欄', async ({ page }) => {
  loadSeedMeta()
  await page.setViewportSize({ width: 1440, height: 900 })
  await loginAsAdmin(page)

  await page.goto('/admin/doc-hub', { timeout: 60000 })
  await waitReady(page, 2000)

  // 01. 預設展開
  await shot(page, 'ch2', '01_sidebar_default')

  // 02. 輸入搜尋
  const searchInput = page.locator('input[placeholder*="搜尋"]').first()
  if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await searchInput.fill('MANUAL')
    await page.waitForTimeout(600)
    await shot(page, 'ch2', '02_sidebar_search')
    await searchInput.clear()
    await page.waitForTimeout(400)
  }

  // 03. 收合側欄（點側欄右上 « 按鈕）
  const collapseBtn = page.locator('[title="收合側欄"]').first()
  if (await collapseBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await collapseBtn.click()
    await waitReady(page, 800)
    await shot(page, 'ch2', '03_sidebar_collapsed')

    // 04. 再展開
    const expandBtn = page.locator('[title="展開側欄"]').first()
    if (await expandBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expandBtn.click()
      await waitReady(page, 800)
      await shot(page, 'ch2', '04_sidebar_expanded')
    }
  }
})
