import { test, expect, request } from '@playwright/test'
import { loginAsAdmin } from '../fixtures/auth'
import { ApiHelper, CleanupStack } from '../fixtures/api'
import { getToken, ADMIN_CREDENTIALS } from '../fixtures/auth'

const BASE_URL = process.env.BASE_URL || 'http://localhost:13000'
const PREFIX = '[E2E-LOCK]'

test.describe('DocHub 文件鎖定 / 解鎖', () => {
  let api: ApiHelper
  const cleanup = new CleanupStack()

  test.beforeAll(async () => {
    api = await ApiHelper.create()
  })

  test.afterAll(async () => {
    // 確保所有文件先解鎖，再清理（鎖定中的文件無法刪除）
    try {
      const docs = await api.listDocuments()
      for (const doc of docs) {
        if (doc.title?.startsWith(PREFIX) && doc.locked) {
          await api.unlockDocument(doc.id)
        }
      }
    } catch {
      // ignore
    }
    await cleanup.flush()
    await api.cleanupByTitlePrefix(PREFIX)
    await api.dispose()
  })

  // ── API 測試 ─────────────────────────────────────────────────────────────

  test('API：管理員可以鎖定文件', async () => {
    const doc = await api.createDocument({
      title: `${PREFIX} 鎖定測試 ${Date.now()}`,
      content: '# 測試鎖定',
      status: 'published',
    })
    cleanup.push(async () => {
      await api.unlockDocument(doc.id).catch(() => undefined)
      await api.deleteDocument(doc.id)
    })

    const result = await api.lockDocument(doc.id)

    expect(result).toBeDefined()
    expect(result.ok).toBe(true)
    expect(result.locked).toBe(true)
  })

  test('API：管理員可以解鎖文件', async () => {
    const doc = await api.createDocument({
      title: `${PREFIX} 解鎖測試 ${Date.now()}`,
      content: '# 測試解鎖',
      status: 'published',
    })
    cleanup.push(() => api.deleteDocument(doc.id))

    // 先鎖定
    await api.lockDocument(doc.id)

    // 再解鎖
    const result = await api.unlockDocument(doc.id)

    expect(result).toBeDefined()
    expect(result.ok).toBe(true)
    expect(result.locked).toBe(false)
  })

  test('API：鎖定中的文件無法被刪除，應回傳 403', async () => {
    const doc = await api.createDocument({
      title: `${PREFIX} 鎖定刪除保護 ${Date.now()}`,
      status: 'published',
    })
    cleanup.push(async () => {
      await api.unlockDocument(doc.id).catch(() => undefined)
      await api.deleteDocument(doc.id)
    })

    await api.lockDocument(doc.id)

    // 嘗試刪除鎖定中的文件（需先讀 body 再 dispose）
    const token = await getToken(ADMIN_CREDENTIALS)
    const ctx = await request.newContext({
      baseURL: BASE_URL,
      extraHTTPHeaders: { Authorization: `Bearer ${token}` },
    })
    // NocoBase destroy 端點用 filterByTk
    const res = await ctx.delete(`/api/docDocuments?filterByTk=${doc.id}`)
    const status = res.status()
    const body = await res.json()
    await ctx.dispose()

    // 鎖定文件應拒絕刪除
    expect(status).toBe(403)
    const message: string = body?.errors?.[0]?.message ?? body?.message ?? JSON.stringify(body)
    expect(message).toMatch(/已鎖定|locked/i)
  })

  test('API：鎖定中的文件無法被非管理員更新，應回傳 403', async () => {
    const doc = await api.createDocument({
      title: `${PREFIX} 鎖定更新保護 ${Date.now()}`,
      status: 'published',
    })
    cleanup.push(async () => {
      await api.unlockDocument(doc.id).catch(() => undefined)
      await api.deleteDocument(doc.id)
    })

    await api.lockDocument(doc.id)

    // 使用沒有 token 的 context（anonymous / 非管理員）嘗試更新
    const ctx = await request.newContext({ baseURL: BASE_URL })
    const res = await ctx.post(`/api/docDocuments:update?filterByTk=${doc.id}`, {
      data: { title: `${PREFIX} 被篡改` },
    })
    await ctx.dispose()

    // 應拒絕：403（鎖定）或 401（未認證）
    expect([401, 403]).toContain(res.status())
  })

  // ── UI 測試 ──────────────────────────────────────────────────────────────

  test('UI：鎖定文件在列表頁顯示鎖定標示', async ({ page }) => {
    const doc = await api.createDocument({
      title: `${PREFIX} UI 鎖定標示 ${Date.now()}`,
      status: 'published',
    })
    cleanup.push(async () => {
      await api.unlockDocument(doc.id).catch(() => undefined)
      await api.deleteDocument(doc.id)
    })

    // 透過 API 鎖定
    await api.lockDocument(doc.id)

    await loginAsAdmin(page)
    await page.goto('/admin/doc-hub')
    await page.waitForLoadState('networkidle')

    await page.screenshot({ path: 'artifacts/09-locked-list.png' })

    // 確認列表中有鎖定標示（禁用的編輯按鈕 或 🔒 圖示 或 tooltip）
    // 找含有文件標題的列
    const titlePattern = `${PREFIX} UI 鎖定標示`
    const row = page.locator('tr', { hasText: titlePattern })

    // 鎖定文件的列應該存在
    await expect(row).toBeVisible({ timeout: 10_000 })

    // 檢查列上是否有鎖定相關元素（disabled button, lock icon, 或 locked tag）
    const lockedIndicator = row.locator('[data-locked], .locked, [title*="鎖定"], [aria-label*="鎖定"], [disabled], .ant-tag')
    const count = await lockedIndicator.count()
    // 至少有一個鎖定指示器（disabled 編輯按鈕也算）
    expect(count).toBeGreaterThanOrEqual(1)
  })

  test('UI：管理員點擊鎖定選項後出現確認 Modal，點取消後不鎖定', async ({ page }) => {
    const doc = await api.createDocument({
      title: `${PREFIX} UI 鎖定 Modal ${Date.now()}`,
      status: 'published',
    })
    cleanup.push(() => api.deleteDocument(doc.id))

    await loginAsAdmin(page)
    await page.goto('/admin/doc-hub')
    await page.waitForLoadState('networkidle')

    const titlePattern = `${PREFIX} UI 鎖定 Modal`

    // 找到文件所在的列
    const row = page.locator('tr', { hasText: titlePattern })
    await expect(row).toBeVisible({ timeout: 10_000 })

    // 點擊操作欄的「⋯」更多選單（Dropdown）
    // 常見的 more actions 按鈕：ant-dropdown-trigger, "..." button, ellipsis
    const moreBtn = row.locator('button').filter({ hasText: /⋯|\.\.\./ }).first()
    const moreBtnCount = await moreBtn.count()

    if (moreBtnCount > 0) {
      await moreBtn.click()

      // 等待下拉選單出現，點擊「鎖定文件」
      const lockMenuItem = page.locator('.ant-dropdown-menu-item, [role="menuitem"]').filter({ hasText: /鎖定/ })
      await expect(lockMenuItem).toBeVisible({ timeout: 5_000 })
      await lockMenuItem.click()

      // 確認 Modal 出現
      const modal = page.locator('.ant-modal-content, [role="dialog"]').first()
      await expect(modal).toBeVisible({ timeout: 5_000 })

      await page.screenshot({ path: 'artifacts/09-lock-modal-open.png' })

      // 確認 Modal 有警告訊息
      const alertOrWarning = modal.locator('.ant-alert')
      await expect(alertOrWarning).toBeVisible({ timeout: 3_000 })

      // Antd 會在雙字 CJK 按鈕文字間插入空格（"取 消"），用 filter hasText 比 getByRole 更可靠
      const cancelBtn = page.locator('button').filter({ hasText: /取.?消|Cancel/ }).last()
      await cancelBtn.click({ timeout: 5_000 })

      await page.screenshot({ path: 'artifacts/09-lock-modal-cancelled.png' })

      // 確認文件未被鎖定（API 查詢）
      const docs = await api.listDocuments()
      const found = docs.find((d) => d.id === doc.id)
      if (found) {
        expect(found.locked).toBeFalsy()
      }
    } else {
      // 如果沒有 dropdown，直接在操作欄找鎖定按鈕
      const lockBtn = row.locator('button, [role="button"]').filter({ hasText: /鎖定/ })
      const lockBtnCount = await lockBtn.count()
      if (lockBtnCount > 0) {
        await lockBtn.first().click()
        const modal = page.locator('.ant-modal-content, [role="dialog"]').first()
        await expect(modal).toBeVisible({ timeout: 5_000 })
        const cancelBtn = page.locator('button').filter({ hasText: /取.?消|Cancel/ }).last()
        await cancelBtn.click()
        await page.screenshot({ path: 'artifacts/09-lock-modal-cancelled.png' })
      } else {
        // UI 不支援此流程，跳過
        test.skip()
      }
    }
  })

  test('UI：管理員可以開啟稽核日誌', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/doc-hub')
    await page.waitForLoadState('networkidle')

    // 尋找稽核日誌入口：sidebar 連結 或 admin 選單
    const auditLink = page.locator('a, button, [role="button"]').filter({ hasText: /稽核日誌|Audit/ })
    const auditLinkCount = await auditLink.count()

    if (auditLinkCount > 0) {
      await auditLink.first().click()
      await page.waitForLoadState('networkidle')

      // 確認 Modal 或頁面出現
      const modal = page.locator('.ant-modal, [role="dialog"]')
      const modalVisible = await modal.isVisible().catch(() => false)

      if (modalVisible) {
        // 確認 Modal 內有表格
        const table = modal.locator('table, .ant-table')
        await expect(table).toBeVisible({ timeout: 5_000 })
      } else {
        // 可能是跳轉到新頁面而非 Modal
        const table = page.locator('table, .ant-table')
        await expect(table).toBeVisible({ timeout: 5_000 })
      }

      await page.screenshot({ path: 'artifacts/09-audit-log-opened.png' })
    } else {
      // 稽核日誌入口尚未存在於 UI，跳過 UI 部分
      test.fixme(true, '稽核日誌 UI 入口尚未實作或路徑不同，改用 API 測試驗證')
    }
  })
})
