import { test } from '@playwright/test'
import { loginAsAdmin } from '../fixtures/auth'
import { waitReady, shot, shotFull, loadSeedMeta } from '../fixtures/shot'

/**
 * Chapter 1：總覽（以 admin 視角）
 *  - 01_list_default：預設全部文件列表
 *  - 02_list_full：全頁列表（含所有列）
 *  - 03_list_project_view：切到某個專案的列表
 *  - 04_list_folder_view：切到某個資料夾的列表
 */

test.setTimeout(180000)

test('ch1: 總覽', async ({ page }) => {
  const meta = loadSeedMeta()
  await page.setViewportSize({ width: 1440, height: 900 })
  await loginAsAdmin(page)

  // 01. 首頁 / 預設列表
  await page.goto('/admin/doc-hub', { timeout: 60000 })
  await page.waitForSelector('.ant-table, h1, h2', { timeout: 25000 }).catch(() => {})
  await waitReady(page, 2000)
  await shot(page, 'ch1', '01_list_default')

  // 02. 全頁截圖
  await shotFull(page, 'ch1', '02_list_full')

  // 03. 切到某個專案（側邊欄樹狀列：SPAN 含 📁 emoji + 專案名）
  const projectSpan = page.locator('span', { hasText: '📁 DocHub 核心產品' }).first()
  if (await projectSpan.isVisible({ timeout: 3000 }).catch(() => false)) {
    await projectSpan.click()
    await waitReady(page, 1500)
    await shot(page, 'ch1', '03_list_project_view')

    // 04. 展開後點「SRS」資料夾。側邊欄有多個 SRS（各專案都有），
    // 用 📂 emoji + 「SRS」的 span，再取最靠近 DocHub 核心產品（第一個出現在它之後的）
    const allSrsSpans = page.locator('span').filter({ hasText: /^📂 SRS$/ })
    // 找在「DocHub 核心產品」下方最靠近的 SRS
    const targetSrs = allSrsSpans.nth(0)
    // 拿到 DocHub 核心產品的 y，再找 y > project.y 的第一個 SRS
    const projBox = await projectSpan.boundingBox()
    if (projBox) {
      const boxes = await allSrsSpans.evaluateAll((els) =>
        els.map((el) => ({
          y: el.getBoundingClientRect().top,
          idx: Array.from(document.querySelectorAll('span')).indexOf(el),
        })),
      )
      const firstBelow = boxes.find((b) => b.y > projBox.y && b.y < projBox.y + 300)
      if (firstBelow) {
        const clickIdx = boxes.indexOf(firstBelow)
        await allSrsSpans.nth(clickIdx).click()
        await waitReady(page, 1200)
        await shot(page, 'ch1', '04_list_folder_view')
      }
    }
  }
})
