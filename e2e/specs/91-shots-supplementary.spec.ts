import { test } from '@playwright/test'
import { loginAsAdmin } from '../fixtures/auth'
import { waitReady, shot, loadSeedMeta } from '../fixtures/shot'

/**
 * 補拍 spec：重抓 11 張因舊 selector 失效而沒重拍的截圖
 *  - ch1/03,04
 *  - ch3/03
 *  - ch5/03
 *  - ch6/01-03
 *  - ch7/01-03
 *  - ch7search/03
 */

test.setTimeout(360000)

const PROJECT_NAME = 'DocHub 核心產品'
const FOLDER_NAME = 'SRS'

// 側邊欄結構：🗂 群組 → 點開 → 📁 專案 → 點開 → 📂 資料夾
async function clickProjectInSidebar(page: any, projectName: string) {
  // 1. 展開「🗂 專案」群組
  const groupSpan = page.locator('span', { hasText: '🗂 專案' }).first()
  if (await groupSpan.isVisible({ timeout: 3000 }).catch(() => false)) {
    await groupSpan.click()
    await page.waitForTimeout(700)
  }
  // 2. 點專案
  const projSpan = page.locator('span', { hasText: `📁 ${projectName}` }).first()
  if (await projSpan.isVisible({ timeout: 3000 }).catch(() => false)) {
    await projSpan.click()
    return true
  }
  return false
}

async function clickFolderInSidebar(page: any, folderName: string) {
  const span = page.locator('span', { hasText: `📂 ${folderName}` }).first()
  if (await span.isVisible({ timeout: 4000 }).catch(() => false)) {
    await span.click()
    return true
  }
  return false
}

// 在主內容區的 folder tabs（如 01_提案與規劃, 02_需求...）點第一個非「全部」的 tab
async function clickFirstFolderTab(page: any) {
  // 找 tab — 通常是 button or div，文字是「NN_XXXX」格式
  const ok = await page.evaluate(() => {
    const candidates = Array.from(document.querySelectorAll('button, div, span'))
    const tab = candidates.find((el: any) => {
      const t = el.textContent?.trim() || ''
      // 匹配「01_xxx」「02_xxx」格式且為 leaf-ish
      return /^\d{2}_[一-龥]+\s*\d*$/.test(t) && el.children.length <= 2
    }) as HTMLElement | undefined
    if (tab) {
      tab.click()
      return tab.textContent?.trim() || 'unknown'
    }
    return null
  })
  return ok
}

test('補拍: ch1/03 + ch1/04 — 專案 / 資料夾 列表', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await loginAsAdmin(page)
  await page.goto('/admin/doc-hub', { timeout: 60000 })
  await waitReady(page, 2000)

  // 03. 切到 DocHub 核心產品 專案
  const okProj = await clickProjectInSidebar(page, PROJECT_NAME)
  console.log('clickProject:', okProj)
  await waitReady(page, 1500)
  await shot(page, 'ch1', '03_list_project_view')

  // 04. 點第一個資料夾 tab（01_提案與規劃 等）
  const tabName = await clickFirstFolderTab(page)
  console.log('clickFirstFolderTab:', tabName)
  await waitReady(page, 1500)
  await shot(page, 'ch1', '04_list_folder_view')
})

test('補拍: ch3/03 — 新增文件 Modal', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await loginAsAdmin(page)
  await page.goto('/admin/doc-hub', { timeout: 60000 })
  await waitReady(page, 2000)

  await clickProjectInSidebar(page, PROJECT_NAME)
  await waitReady(page, 1200)
  await clickFirstFolderTab(page)
  await waitReady(page, 1500)

  // 點「新增文件」按鈕
  const newBtn = page
    .locator('button')
    .filter({ hasText: /新增文件/ })
    .first()
  await newBtn.waitFor({ state: 'visible', timeout: 6000 }).catch(() => {})
  await newBtn.click({ force: true }).catch(() => {})
  await page.waitForSelector('.ant-modal-content:visible', { timeout: 6000 }).catch(() => {})
  await page.waitForTimeout(800)
  await shot(page, 'ch3', '03_new_doc_modal')
})

test('補拍: ch5/03 — 範本填寫頁', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await loginAsAdmin(page)
  await page.goto('/admin/doc-hub', { timeout: 60000 })
  await waitReady(page, 2000)

  await clickProjectInSidebar(page, PROJECT_NAME)
  await waitReady(page, 1200)
  await clickFirstFolderTab(page)
  await waitReady(page, 1500)

  // 點「新增文件」按鈕 → 開啟 NewDocModal
  const newBtn = page
    .locator('button')
    .filter({ hasText: /新增文件/ })
    .first()
  await newBtn.click({ force: true }).catch(() => {})
  await page.waitForSelector('.ant-modal-content:visible', { timeout: 6000 }).catch(() => {})
  await page.waitForTimeout(800)

  // 點「使用範本」卡片
  const tplCard = page.locator('.ant-modal-content').locator('text=使用範本').first()
  if (await tplCard.isVisible({ timeout: 3000 }).catch(() => false)) {
    await tplCard.click({ force: true })
    await page.waitForTimeout(1500)

    // 範本選擇器彈出後 — 點「會議紀錄」（SRS 那張會觸發 'in' operator bug）
    await page.locator('.ant-modal-title').filter({ hasText: '選擇範本' }).first().waitFor({ timeout: 5000 }).catch(() => {})
    const tplPick = page.locator('.ant-modal-body').locator(':has-text("會議紀錄")').filter({ hasText: '週會' }).last()
    if (await tplPick.isVisible({ timeout: 3000 }).catch(() => false)) {
      await tplPick.click({ force: true })
      console.log('clicked 會議紀錄 card')
      await page.waitForTimeout(3000)
    }
  }
  await waitReady(page, 2000)
  await shot(page, 'ch5', '03_template_fill')
})

test('補拍: ch6/01 — 專案權限 Modal', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await loginAsAdmin(page)
  await page.goto('/admin/doc-hub', { timeout: 60000 })
  await waitReady(page, 2000)

  await clickProjectInSidebar(page, PROJECT_NAME)
  await waitReady(page, 1500)

  const permBtn = page
    .locator('button')
    .filter({ hasText: /^權限$/ })
    .first()
  await permBtn.waitFor({ state: 'visible', timeout: 6000 }).catch(() => {})
  await permBtn.click({ force: true }).catch(() => {})
  await page.waitForSelector('.ant-modal-content:visible', { timeout: 6000 }).catch(() => {})
  await page.waitForTimeout(1000)
  await shot(page, 'ch6', '01_project_perm_modal')
})

test('補拍: ch6/02 + 03 — 資料夾權限 Modal', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await loginAsAdmin(page)
  await page.goto('/admin/doc-hub', { timeout: 60000 })
  await waitReady(page, 2000)

  await clickProjectInSidebar(page, PROJECT_NAME)
  await waitReady(page, 1200)
  await clickFirstFolderTab(page)
  await waitReady(page, 1500)

  // 等「新增文件」按鈕 enabled = activeCatId 設好
  await page
    .locator('button.ant-btn-primary')
    .filter({ hasText: /新增文件/ })
    .first()
    .waitFor({ state: 'visible', timeout: 6000 })
    .catch(() => {})
  await page.waitForTimeout(500)

  const permBtn = page
    .locator('button')
    .filter({ hasText: /^權限$/ })
    .first()
  await permBtn.click({ force: true }).catch(() => {})
  await page.waitForSelector('.ant-modal-content:visible', { timeout: 6000 }).catch(() => {})
  await page.waitForTimeout(1000)
  await shot(page, 'ch6', '02_category_perm_modal')

  // 03. 自訂模式
  const customLabel = page
    .locator('.ant-modal .ant-radio-wrapper, .ant-modal label')
    .filter({ hasText: /自訂/ })
    .first()
  if (await customLabel.isVisible({ timeout: 2000 }).catch(() => false)) {
    await customLabel.click({ force: true })
    await page.waitForTimeout(800)
  }
  await shot(page, 'ch6', '03_category_perm_custom')
})

test('補拍: ch7/01 + 02 — 稽核日誌（新版）', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await loginAsAdmin(page)
  page.on('dialog', (d) => d.dismiss().catch(() => {}))

  await page.goto('/admin/doc-hub', { timeout: 60000 })
  await waitReady(page, 2000)

  // 嘗試多種方式找稽核日誌入口
  const auditEntry = page.locator('a, button, span, div').filter({ hasText: /^稽核日誌$/ }).first()
  let opened = false
  if (await auditEntry.isVisible({ timeout: 3000 }).catch(() => false)) {
    await auditEntry.click()
    await waitReady(page, 1500)
    opened = true
  } else {
    // 直接走 URL
    await page.goto('/admin/doc-hub/audit-log', { timeout: 60000 }).catch(() => {})
    await waitReady(page, 2000)
    opened = true
  }

  if (opened) {
    await page
      .locator('.ant-table-tbody tr, .ant-empty')
      .first()
      .waitFor({ timeout: 6000 })
      .catch(() => {})
    await page.waitForTimeout(800)
    await shot(page, 'ch7', '01_audit_log_modal')

    // 02 — 點某一筆 row 展開「詳情」（顯示 row detail 不同畫面）
    const firstRow = page.locator('.ant-table-tbody tr').first()
    if (await firstRow.isVisible({ timeout: 2000 }).catch(() => false)) {
      // 嘗試找 row 內的「詳情」按鈕，或點 row 本身
      const detailBtn = firstRow.locator('button, a').filter({ hasText: /詳情|查看|展開/ }).first()
      if (await detailBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
        await detailBtn.click({ force: true })
        await page.waitForTimeout(1200)
      } else {
        await firstRow.click({ force: true })
        await page.waitForTimeout(1200)
      }
    }
    // 若沒展開，改點動作篩選 select 顯示下拉
    const actionFilter = page.locator('.ant-select').filter({ hasText: /動作|狀態|全部/ }).first()
    if (await actionFilter.isVisible({ timeout: 1500 }).catch(() => false)) {
      await actionFilter.click({ force: true }).catch(() => {})
      await page.waitForTimeout(800)
    }
    await shot(page, 'ch7', '02_audit_log_rows')
    await page.keyboard.press('Escape').catch(() => {})
  }
})

test('補拍: ch7/03 — 訂閱者面板', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await loginAsAdmin(page)
  await page.goto('/admin/doc-hub', { timeout: 60000 })
  await waitReady(page, 2000)

  await clickProjectInSidebar(page, PROJECT_NAME)
  await waitReady(page, 1500)

  const permBtn = page
    .locator('button')
    .filter({ hasText: /^權限$/ })
    .first()
  await permBtn.click({ force: true }).catch(() => {})
  await page.waitForSelector('.ant-modal-content:visible', { timeout: 6000 }).catch(() => {})
  await page.waitForTimeout(1000)

  // 滾動到訂閱通知區塊
  await page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll('.ant-modal *'))
    const target = nodes.find((el: any) => el.textContent?.includes('訂閱'))
    if (target) (target as HTMLElement).scrollIntoView({ block: 'center' })
  })
  await page.waitForTimeout(500)
  await shot(page, 'ch7', '03_subscriber_panel')
})

test('補拍: ch7search/03 — 搜尋帶篩選', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await loginAsAdmin(page)
  await page.goto('/admin/doc-hub', { timeout: 60000 })
  await waitReady(page, 2000)

  // 找頂部搜尋框
  const searchInput = page
    .locator('input[placeholder*="搜尋"], input[placeholder*="搜索"]')
    .first()
  if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await searchInput.click()
    await searchInput.fill('SRS')
    await page.waitForTimeout(1500)

    // 嘗試開啟進階篩選 / 切換 tab
    const filterBtn = page
      .locator('button, .ant-tabs-tab')
      .filter({ hasText: /篩選|標籤|tag|filter/i })
      .first()
    if (await filterBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await filterBtn.click({ force: true }).catch(() => {})
      await page.waitForTimeout(800)
    }
    await shot(page, 'ch7search', '03_search_with_filter')
  }
})
