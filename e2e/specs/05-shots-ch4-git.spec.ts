import { test } from '@playwright/test'
import { loginAsAdmin } from '../fixtures/auth'
import { waitReady, shot, loadSeedMeta } from '../fixtures/shot'

/**
 * Chapter 4：Git 同步
 *  - 01_git_edit_bar：編輯頁綠色 Git 唯讀 bar（顯示 repo / path / branch）
 *  - 02_git_sync_modal：點「同步 Git」開啟確認 Modal
 *  - 03_git_pull_modal：閱讀頁點「拉取最新」（admin 管理員檢視）
 *  - 04_git_edit_inputs：點 Git bar 的「修改」切換到輸入模式（可編輯 repo/path/branch）
 */

test.setTimeout(240000)

test('ch4: Git 同步', async ({ page }) => {
  const meta = loadSeedMeta()
  await page.setViewportSize({ width: 1440, height: 900 })
  await loginAsAdmin(page)
  page.on('dialog', (d) => d.dismiss().catch(() => {}))

  const gitDocId = meta.featured.gitBoundDoc
  if (!gitDocId) {
    console.log('  ⚠️ seed-meta.featured.gitBoundDoc 不存在，跳過 ch4')
    return
  }

  // 01. 編輯頁 Git 綠色 bar（唯讀狀態）
  await page.goto(`/admin/doc-hub/edit/${gitDocId}`, { timeout: 60000 })
  await page.waitForSelector('textarea, [contenteditable]', { timeout: 25000 }).catch(() => {})
  await waitReady(page, 2500)
  await shot(page, 'ch4', '01_git_edit_bar')

  // 02. 「同步 Git」確認 Modal
  // 編輯頁右上角工具列有個 SyncOutlined 按鈕（Tooltip: 同步到 Git）
  const syncBtn = page
    .locator('button')
    .filter({ has: page.locator('span[aria-label="sync"]') })
    .first()
  if (await syncBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    const isDisabled = await syncBtn.evaluate((el: HTMLButtonElement) => el.disabled)
    if (!isDisabled) {
      await syncBtn.click()
      await page.waitForSelector('.ant-modal-content', { timeout: 5000 }).catch(() => {})
      await page.waitForTimeout(800)
      await shot(page, 'ch4', '02_git_sync_modal')
      // 按 Cancel / 取消 不真 push
      const cancelBtn = page
        .locator('.ant-modal-footer button')
        .filter({ hasText: /取.?消|Cancel/ })
        .first()
      await cancelBtn.click().catch(() => page.keyboard.press('Escape'))
      await page.waitForTimeout(500)
    } else {
      console.log('  ⚠️ 同步 Git 按鈕為 disabled，跳過 02')
    }
  }

  // 03. 閱讀頁「拉取最新」按鈕（admin 管理員可見）
  await page.goto(`/admin/doc-hub/view/${gitDocId}`, { timeout: 60000 })
  await page.waitForSelector('h1, h2, button.ant-btn', { timeout: 25000 }).catch(() => {})
  await waitReady(page, 2000)
  await shot(page, 'ch4', '03_git_view_page')

  // 04. 編輯模式：點 Git bar 的「修改」按鈕，切換到 3 個輸入框模式
  await page.goto(`/admin/doc-hub/edit/${gitDocId}`, { timeout: 60000 })
  await page.waitForSelector('textarea, [contenteditable]', { timeout: 25000 }).catch(() => {})
  await waitReady(page, 2000)
  const editGitBtn = page
    .locator('button')
    .filter({ hasText: /^修改$/ })
    .first()
  if (await editGitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await editGitBtn.click()
    await page.waitForTimeout(700)
    await shot(page, 'ch4', '04_git_edit_inputs')
  } else {
    console.log('  ⚠️ Git bar「修改」按鈕未出現，跳過 04')
  }
})
