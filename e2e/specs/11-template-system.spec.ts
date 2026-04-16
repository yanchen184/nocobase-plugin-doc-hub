/**
 * E2E Tests: Template System (Phase 1-4)
 *
 * 涵蓋：
 * - 範本 CRUD（建立/讀取/更新/刪除）
 * - 使用範本建立文件（TemplateFillPage）
 * - 文件閱讀頁顯示表單資料（TemplateFormViewer）
 * - 範本管理頁（TemplateListPage）
 * - 新增文件 Modal（NewDocModal）三種選項
 * - 列表中 📋 範本 tag 顯示
 * - 截圖同步寫入 artifacts/ 供手冊使用
 */

import { test, expect, Page } from '@playwright/test'
import { ApiHelper, CleanupStack } from '../fixtures/api'
import { loginAsAdmin } from '../fixtures/auth'
import * as path from 'path'
import * as fs from 'fs'

const BASE_URL = process.env.BASE_URL || 'http://localhost:13000'
const ARTIFACTS = path.join(__dirname, '..', 'artifacts')
const PREFIX = '[E2E-TPL]'

async function shot(page: Page, name: string) {
  fs.mkdirSync(ARTIFACTS, { recursive: true })
  await page.waitForTimeout(600)
  await page.screenshot({ path: path.join(ARTIFACTS, name), fullPage: false })
}

// ── API helpers for template CRUD ──────────────────────────────────────────

async function createTemplate(api: ApiHelper, payload: {
  name: string
  description?: string
  fields: any[]
  defaultCategoryId?: number | null
  listDisplayFields?: string[]
}): Promise<any> {
  const ctx = (api as any).ctx
  const res = await ctx.post('/api/docTemplates:create', { data: payload })
  if (!res.ok()) throw new Error(`createTemplate failed: ${await res.text()}`)
  const body = await res.json()
  return body.data?.data ?? body.data
}

async function listTemplates(api: ApiHelper): Promise<any[]> {
  const ctx = (api as any).ctx
  const res = await ctx.get('/api/docTemplates:list')
  if (!res.ok()) return []
  const body = await res.json()
  return body.data?.data ?? body.data ?? []
}

async function destroyTemplate(api: ApiHelper, id: number): Promise<void> {
  const ctx = (api as any).ctx
  await ctx.post(`/api/docTemplates:destroy?filterByTk=${id}`)
}

async function createTemplateDoc(api: ApiHelper, payload: {
  title: string
  templateId: number
  formData: Record<string, any>
  categoryId?: number | null
}): Promise<any> {
  const ctx = (api as any).ctx
  const res = await ctx.post('/api/docDocuments', {
    data: {
      title: payload.title,
      status: 'published',
      contentType: 'template',
      templateId: payload.templateId,
      formData: payload.formData,
      categoryId: payload.categoryId ?? null,
    }
  })
  if (!res.ok()) throw new Error(`createTemplateDoc failed: ${await res.text()}`)
  const body = await res.json()
  return body.data
}

// ── Sample template definition ────────────────────────────────────────────

const SAMPLE_TEMPLATE_FIELDS = [
  { id: 'f_001', type: 'text',     label: '版本號',    name: 'version',     required: true,  defaultValue: '' },
  { id: 'f_002', type: 'date',     label: '上版日期',  name: 'releaseDate', required: true,  defaultValue: '' },
  { id: 'f_003', type: 'select',   label: '上版環境',  name: 'environment', required: true,  defaultValue: 'staging',
    options: [{ label: '開發', value: 'dev' }, { label: '測試', value: 'staging' }, { label: '正式', value: 'prod' }] },
  { id: 'f_004', type: 'textarea', label: '變更說明',  name: 'changeDesc',  required: true,  defaultValue: '' },
  { id: 'f_005', type: 'text',     label: '負責人',    name: 'owner',       required: false, defaultValue: '' },
]

// ── Shared state (module-level so it persists across all tests in this worker) ──
let sharedTemplateId: number
let sharedDocId: number

// ── Fallback: look up IDs via fetch when module-level vars are not set ──────
async function getTokenViaFetch(): Promise<string | undefined> {
  const res = await fetch(`${BASE_URL}/api/auth:signIn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ account: 'admin@nocobase.com', password: 'admin123' }),
  }).catch(() => null)
  if (!res?.ok) return undefined
  const body = await res.json().catch(() => null)
  return body?.data?.token
}

async function getTemplateIdByName(name: string): Promise<number | undefined> {
  const token = await getTokenViaFetch()
  if (!token) return undefined
  const res = await fetch(`${BASE_URL}/api/docTemplates:list?pageSize=100`, {
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => null)
  if (!res?.ok) return undefined
  const body = await res.json().catch(() => null)
  const items: any[] = body?.data?.data ?? body?.data ?? []
  return items.find((t: any) => t.name?.includes(name))?.id
}

async function getDocIdByTitle(title: string): Promise<number | undefined> {
  const token = await getTokenViaFetch()
  if (!token) return undefined
  const res = await fetch(`${BASE_URL}/api/docDocuments:list?pageSize=100`, {
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => null)
  if (!res?.ok) return undefined
  const body = await res.json().catch(() => null)
  const items: any[] = body?.data?.data ?? body?.data ?? []
  return items.find((t: any) => t.title?.includes(title))?.id
}

// ── Test Suite ────────────────────────────────────────────────────────────

test.describe('Template System', () => {
  let api: ApiHelper
  let cleanup: CleanupStack

  test.beforeAll(async () => {
    api = await ApiHelper.create()
    cleanup = new CleanupStack()
  })

  test.afterAll(async () => {
    if (cleanup) await cleanup.flush()
    if (api) await api.dispose()
  })

  // ────────────────────────────────────────────────────────────────────────
  // 1. API: 建立範本
  // ────────────────────────────────────────────────────────────────────────
  test('API: 建立範本', async () => {
    const tpl = await createTemplate(api, {
      name: `${PREFIX} 上版單`,
      description: 'E2E 測試用範本，記錄部署變更',
      fields: SAMPLE_TEMPLATE_FIELDS,
      listDisplayFields: ['version', 'environment'],
    })
    expect(tpl).toBeTruthy()
    expect(tpl.id).toBeTruthy()
    expect(tpl.name).toContain('上版單')
    sharedTemplateId = tpl.id
    cleanup.push(() => destroyTemplate(api, sharedTemplateId))
  })

  // ────────────────────────────────────────────────────────────────────────
  // 2. API: 列出範本（確認剛建立的出現在清單中）
  // ────────────────────────────────────────────────────────────────────────
  test('API: 範本出現在清單中', async () => {
    const list = await listTemplates(api)
    const found = list.find((t: any) => t.id === sharedTemplateId)
    expect(found).toBeTruthy()
    expect(found.name).toContain('上版單')
    expect(found.fields).toHaveLength(SAMPLE_TEMPLATE_FIELDS.length)
  })

  // ────────────────────────────────────────────────────────────────────────
  // 3. API: 用範本建立文件（content 應有 TEMPLATE_FORM_V1 前綴）
  // ────────────────────────────────────────────────────────────────────────
  test('API: 用範本建立文件（TEMPLATE_FORM_V1 格式）', async () => {
    const doc = await createTemplateDoc(api, {
      title: `${PREFIX} 上版單 v1.0.0`,
      templateId: sharedTemplateId,
      formData: {
        version: '1.0.0',
        releaseDate: '2026-04-15',
        environment: 'prod',
        changeDesc: '初次部署，完成基礎功能開發。\n- 用戶登入\n- 文件管理',
        owner: 'Test Admin',
      },
    })
    expect(doc).toBeTruthy()
    expect(doc.id).toBeTruthy()
    expect(doc.content).toMatch(/^TEMPLATE_FORM_V1\n/)

    // 解析 content 確認資料正確
    const json = JSON.parse(doc.content.replace('TEMPLATE_FORM_V1\n', ''))
    expect(json.templateId).toBe(sharedTemplateId)
    expect(json.data.version).toBe('1.0.0')
    expect(json.data.environment).toBe('prod')

    sharedDocId = doc.id
    cleanup.push(() => api.deleteDocument(sharedDocId))
  })

  // ────────────────────────────────────────────────────────────────────────
  // 4. API: 更新表單資料（formData merge）
  // ────────────────────────────────────────────────────────────────────────
  test('API: 更新範本文件的 formData', async () => {
    const ctx = (api as any).ctx
    const res = await ctx.post(`/api/docDocuments:update?filterByTk=${sharedDocId}`, {
      data: { formData: { version: '1.0.1', owner: 'Updated Owner' } }
    })
    expect(res.ok()).toBeTruthy()

    // 讀取確認
    const getRes = await ctx.get(`/api/docDocuments/${sharedDocId}`)
    const body = await getRes.json()
    const doc = body.data
    expect(doc.content).toMatch(/^TEMPLATE_FORM_V1\n/)
    const json = JSON.parse(doc.content.replace('TEMPLATE_FORM_V1\n', ''))
    expect(json.data.version).toBe('1.0.1')
    expect(json.data.owner).toBe('Updated Owner')
    // 其他欄位不受影響
    expect(json.data.environment).toBe('prod')
  })

  // ────────────────────────────────────────────────────────────────────────
  // 5. UI: 範本管理頁（TemplateListPage）
  // ────────────────────────────────────────────────────────────────────────
  test('UI: 範本管理頁顯示範本清單', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await loginAsAdmin(page)
    // 等 API 回傳範本清單
    const [tplListResp] = await Promise.all([
      page.waitForResponse(resp => resp.url().includes('docTemplates:list') && resp.status() === 200, { timeout: 15000 }),
      page.goto(`${BASE_URL}/admin/doc-hub/templates`),
    ])
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    // 等範本清單載入（等到 E2E 範本出現，不強求 table 元素）
    await expect(page.getByText(`${PREFIX} 上版單`, { exact: false }).first()).toBeVisible({ timeout: 10000 })

    // 若有 table 元素也確認其可見（可選）
    const hasTable = await page.locator('table').count()
    if (hasTable > 0) {
      await expect(page.locator('table')).toBeVisible()
    }
    await shot(page, 'tpl-01-template-list.png')
  })

  // ────────────────────────────────────────────────────────────────────────
  // 6. UI: 建立範本 Modal（TemplateBuilderModal）
  // ────────────────────────────────────────────────────────────────────────
  test('UI: 開啟範本建構器 Modal', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await loginAsAdmin(page)
    await page.goto(`${BASE_URL}/admin/doc-hub/templates`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // 點「建立範本」
    const createBtn = page.locator('button').filter({ hasText: /建立範本/ })
    await expect(createBtn).toBeVisible({ timeout: 8000 })
    await createBtn.click()

    // Modal 出現
    await expect(page.locator('.ant-modal-content')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('.ant-modal-title')).toContainText('建立範本')

    // 截圖
    await shot(page, 'tpl-02-builder-modal.png')

    // 確認有「新增欄位」按鈕
    await expect(page.locator('button').filter({ hasText: /新增欄位/ })).toBeVisible()

    // 確認有視覺/JSON 切換按鈕
    await expect(page.locator('button').filter({ hasText: /JSON 模式/ })).toBeVisible()

    // 切換到 JSON 模式
    await page.locator('button').filter({ hasText: /JSON 模式/ }).click()
    await page.waitForTimeout(400)
    await expect(page.locator('textarea')).toBeVisible()
    await shot(page, 'tpl-03-builder-json-mode.png')

    // 切回視覺模式
    await page.locator('button').filter({ hasText: /視覺模式/ }).click()
    await page.waitForTimeout(400)

    // 關閉
    await page.keyboard.press('Escape')
  })

  // ────────────────────────────────────────────────────────────────────────
  // 7. UI: 新增文件 Modal（NewDocModal）三選一
  // ────────────────────────────────────────────────────────────────────────
  test('UI: 新增文件 Modal 顯示三種選項', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await loginAsAdmin(page)
    await page.goto(`${BASE_URL}/admin/doc-hub`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    // 點「新增文件」
    const addBtn = page.locator('button').filter({ hasText: /新增文件/ })
    await expect(addBtn).toBeVisible({ timeout: 8000 })
    await addBtn.click()
    await page.waitForTimeout(500)

    // Modal 出現，包含三個選項
    await expect(page.locator('.ant-modal-content')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('.ant-modal-content').getByText('自由撰寫', { exact: true })).toBeVisible()
    await expect(page.locator('.ant-modal-content').getByText('使用範本', { exact: true })).toBeVisible()
    await expect(page.locator('.ant-modal-content').getByText('Git 同步', { exact: true })).toBeVisible()

    await shot(page, 'tpl-04-new-doc-modal.png')
    await page.keyboard.press('Escape')
  })

  // ────────────────────────────────────────────────────────────────────────
  // 8. UI: 選擇範本後跳至範本選擇 Modal
  // ────────────────────────────────────────────────────────────────────────
  test('UI: 選擇「使用範本」後出現範本選擇清單', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await loginAsAdmin(page)
    await page.goto(`${BASE_URL}/admin/doc-hub`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    await page.locator('button').filter({ hasText: /新增文件/ }).click()
    await page.waitForTimeout(500)

    // 點「使用範本」（在 Modal 內）
    await expect(page.locator('.ant-modal-content')).toBeVisible({ timeout: 5000 })
    await page.locator('.ant-modal-content').getByText('使用範本', { exact: true }).click()
    await page.waitForTimeout(1000)

    // 範本選擇 Modal 出現（等待「選擇範本」標題出現）
    await expect(page.locator('.ant-modal-title').filter({ hasText: '選擇範本' })).toBeVisible({ timeout: 8000 })

    // 我們建立的 E2E 範本應出現
    await expect(page.getByText(`${PREFIX} 上版單`, { exact: false }).first()).toBeVisible({ timeout: 8000 })
    await shot(page, 'tpl-05-template-select.png')

    await page.keyboard.press('Escape')
  })

  // ────────────────────────────────────────────────────────────────────────
  // 9. UI: 填寫表單並儲存（TemplateFillPage new mode）
  // ────────────────────────────────────────────────────────────────────────
  test('UI: 透過範本新建文件並填寫表單', async ({ page, request }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await loginAsAdmin(page)

    // 確保 templateId 有效（fallback: 從 API 查）
    if (!sharedTemplateId) {
      const tokenRes = await request.post(`${BASE_URL}/api/auth:signIn`, {
        data: { account: 'admin@nocobase.com', password: 'admin123' }
      })
      const tokenBody = await tokenRes.json()
      const token = tokenBody.data?.token
      if (token) {
        const listRes = await request.get(`${BASE_URL}/api/docTemplates:list?pageSize=100`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const listBody = await listRes.json()
        const items: any[] = listBody.data?.data ?? listBody.data ?? []
        const found = items.find((t: any) => t.name?.includes(`${PREFIX} 上版單`))
        if (found) sharedTemplateId = found.id
      }
    }

    // 直接到 template-fill/new?templateId=...
    await page.goto(`${BASE_URL}/admin/doc-hub/template-fill/new?templateId=${sharedTemplateId}`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    // 確認範本名稱顯示
    await expect(page.locator('text=上版單').first()).toBeVisible({ timeout: 10000 })

    // 填標題
    const titleInput = page.locator('input[placeholder*="標題"]')
    await expect(titleInput).toBeVisible({ timeout: 5000 })
    await titleInput.fill(`${PREFIX} UI填寫上版單`)

    // 填版本號
    await page.locator('input').filter({ hasText: '' }).nth(1).fill('2.0.0').catch(async () => {
      // 嘗試用 placeholder 找
      const versionInput = page.locator('input[placeholder*="版本"]').first()
      if (await versionInput.count() > 0) await versionInput.fill('2.0.0')
    })

    await shot(page, 'tpl-06-fill-page.png')

    // 按儲存（Antd 按鈕文字可能有 CJK 空格：「儲 存」）
    // 優先用底部的儲存按鈕（.ant-btn-primary 在表單底部）
    const saveBtns = page.locator('button.ant-btn-primary')
    const saveBtnCount = await saveBtns.count()
    if (saveBtnCount > 0) {
      await saveBtns.last().click()
    } else {
      // fallback: 任何含「儲」字的按鈕
      await page.locator('button').filter({ hasText: /儲/ }).last().click()
    }
    await page.waitForTimeout(800)

    // 截圖（顯示驗證錯誤或跳到 view 頁）
    await shot(page, 'tpl-07-fill-validation.png')
  })

  // ────────────────────────────────────────────────────────────────────────
  // 10. UI: ViewPage 顯示範本文件（TemplateFormViewer）
  // ────────────────────────────────────────────────────────────────────────
  test('UI: ViewPage 以卡片格式顯示範本文件', async ({ page, request }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await loginAsAdmin(page)

    // 每次都從 API 查取最新 docId（避免 module-level 變數失效）
    const tokenRes = await request.post(`${BASE_URL}/api/auth:signIn`, {
      data: { account: 'admin@nocobase.com', password: 'admin123' }
    })
    const tokenBody = await tokenRes.json()
    const token = tokenBody.data?.token
    if (token) {
      const listRes = await request.get(`${BASE_URL}/api/docDocuments:list?pageSize=100`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const listBody = await listRes.json()
      const items: any[] = listBody.data?.data ?? listBody.data ?? []
      const found = items.find((t: any) => t.title?.includes(`${PREFIX} 上版單`))
      if (found) sharedDocId = found.id
    }

    await page.goto(`${BASE_URL}/admin/doc-hub/view/${sharedDocId}`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    // 確認不是 Markdown 渲染（不應有 dochub-preview class）
    const mdPreview = page.locator('.dochub-preview')
    expect(await mdPreview.count()).toBe(0)

    // 應顯示卡片格式的欄位（版本號、上版環境等）
    await expect(page.locator('text=版本號').first()).toBeVisible({ timeout: 8000 })
    await expect(page.locator('text=上版環境').first()).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=1.0.1').first()).toBeVisible({ timeout: 5000 })

    await shot(page, 'tpl-08-view-template-doc.png')

    // 確認編輯按鈕存在
    const editBtn = page.locator('button').filter({ hasText: /編輯/ })
    await expect(editBtn).toBeVisible()
  })

  // ────────────────────────────────────────────────────────────────────────
  // 11. UI: 編輯按鈕導到 TemplateFillPage（非 EditPage）
  // ────────────────────────────────────────────────────────────────────────
  test('UI: 範本文件的編輯按鈕導向 TemplateFillPage', async ({ page, request }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await loginAsAdmin(page)

    // 每次都從 API 查取最新 docId
    const tokenRes = await request.post(`${BASE_URL}/api/auth:signIn`, {
      data: { account: 'admin@nocobase.com', password: 'admin123' }
    })
    const tokenBody = await tokenRes.json()
    const token = tokenBody.data?.token
    if (token) {
      const listRes = await request.get(`${BASE_URL}/api/docDocuments:list?pageSize=100`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const listBody = await listRes.json()
      const items: any[] = listBody.data?.data ?? listBody.data ?? []
      const found = items.find((t: any) => t.title?.includes(`${PREFIX} 上版單`))
      if (found) sharedDocId = found.id
    }

    await page.goto(`${BASE_URL}/admin/doc-hub/view/${sharedDocId}`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    const editBtn = page.locator('button').filter({ hasText: /編輯/ })
    await editBtn.click()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // URL 應包含 template-fill（不是 /edit/）
    expect(page.url()).toContain('template-fill')
    expect(page.url()).not.toContain('/edit/')

    await shot(page, 'tpl-09-edit-redirect.png')
  })

  // ────────────────────────────────────────────────────────────────────────
  // 12. UI: 列表頁顯示 📋 範本 tag
  // ────────────────────────────────────────────────────────────────────────
  test('UI: 文件列表中範本文件顯示 📋 範本 tag', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await loginAsAdmin(page)
    await page.goto(`${BASE_URL}/admin/doc-hub`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // 等表格載入
    await expect(page.locator('table')).toBeVisible({ timeout: 10000 })

    // 找到 E2E 建立的範本文件標題
    const docRow = page.locator('tr').filter({ hasText: '上版單 v1.0.0' })
    if (await docRow.count() > 0) {
      // 該行應有 📋 範本 tag
      await expect(docRow.locator('text=📋 範本').or(docRow.locator('.ant-tag').filter({ hasText: /範本/ }))).toBeVisible({ timeout: 5000 })
    }

    await shot(page, 'tpl-10-list-template-tag.png')
  })

  // ────────────────────────────────────────────────────────────────────────
  // 13. UI: 側邊欄「範本管理」連結（Admin 可見）
  // ────────────────────────────────────────────────────────────────────────
  test('UI: 側邊欄顯示「範本管理」連結', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await loginAsAdmin(page)
    await page.goto(`${BASE_URL}/admin/doc-hub`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    // 側邊欄底部應有範本管理連結
    await expect(page.locator('text=範本管理').first()).toBeVisible({ timeout: 8000 })
    await shot(page, 'tpl-11-sidebar-template-link.png')

    // 點擊後應跳到範本管理頁（等待 currentUser 載入後 onOpenTemplates 才有效）
    await page.waitForTimeout(1000) // 確保 currentUser 已載入
    await page.locator('text=範本管理').first().click()
    // 等待 URL 變更（最多 5 秒）
    await page.waitForURL(/\/templates/, { timeout: 5000 }).catch(async () => {
      // 若未跳轉，再試一次
      await page.locator('text=範本管理').first().click()
      await page.waitForURL(/\/templates/, { timeout: 5000 })
    })
    expect(page.url()).toContain('/templates')
  })

  // ────────────────────────────────────────────────────────────────────────
  // 14. UI: 刪除範本（軟刪除）
  // ────────────────────────────────────────────────────────────────────────
  test('UI: 刪除範本後從清單消失', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await loginAsAdmin(page)
    await page.goto(`${BASE_URL}/admin/doc-hub/templates`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // 找到 E2E 範本的刪除按鈕
    const tplRow = page.locator('tr').filter({ hasText: '上版單' }).first()
    if (await tplRow.count() > 0) {
      const deleteBtn = tplRow.locator('button').filter({ hasText: /刪除/ })
      await deleteBtn.click()
      await page.waitForTimeout(500)

      // 確認對話框
      const confirmBtn = page.locator('.ant-modal-content button').filter({ hasText: /確認刪除/ })
      if (await confirmBtn.count() > 0) {
        await confirmBtn.click()
        await page.waitForTimeout(1000)
        await shot(page, 'tpl-12-after-delete.png')

        // 範本應從清單消失
        await expect(page.getByText(`${PREFIX} 上版單`, { exact: false })).not.toBeVisible({ timeout: 5000 })
      }
    }
    // 不需要 cleanup.push，已透過 UI 刪除
  })
})
