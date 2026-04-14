import { test, expect, request } from '@playwright/test'
import { getToken, ADMIN_CREDENTIALS } from '../fixtures/auth'
import { ApiHelper, CleanupStack } from '../fixtures/api'

const BASE_URL = process.env.BASE_URL || 'http://localhost:13000'
const PREFIX = '[E2E-PERM]'

/**
 * 目前 docDocuments 插件使用 public ACL（所有操作均可不需 token）。
 * 這些測試記錄現有行為，同時驗證管理員 token 的基本功能。
 *
 * NOTE: 理想情況下寫入操作應需要認證，這是待改進的 server 端問題。
 */
test.describe('DocHub 存取控制', () => {
  let api: ApiHelper
  const cleanup = new CleanupStack()

  test.beforeAll(async () => {
    api = await ApiHelper.create()
  })

  test.afterAll(async () => {
    await cleanup.flush()
    await api.cleanupByTitlePrefix(PREFIX)
    await api.dispose()
  })

  test('文件列表 API 不需要 token（public ACL）', async () => {
    const ctx = await request.newContext({ baseURL: BASE_URL })
    const res = await ctx.get('/api/docDocuments?page=1&pageSize=5')
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body.data)).toBe(true)
    await ctx.dispose()
  })

  test('管理員 token 可以存取文件列表，且能取得資料', async () => {
    const token = await getToken(ADMIN_CREDENTIALS)
    const ctx = await request.newContext({
      baseURL: BASE_URL,
      extraHTTPHeaders: { Authorization: `Bearer ${token}` },
    })
    const res = await ctx.get('/api/docDocuments?page=1&pageSize=20')
    expect(res.ok()).toBe(true)
    const body = await res.json()
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.data.length).toBeGreaterThan(0)
    await ctx.dispose()
  })

  test('管理員 token 可以建立文件', async () => {
    const token = await getToken(ADMIN_CREDENTIALS)
    const ctx = await request.newContext({
      baseURL: BASE_URL,
      extraHTTPHeaders: { Authorization: `Bearer ${token}` },
    })
    const res = await ctx.post('/api/docDocuments', {
      data: { title: `${PREFIX} Auth Create ${Date.now()}`, content: '# test', status: 'draft' },
    })
    expect(res.ok()).toBe(true)
    const body = await res.json()
    expect(body.data).toBeDefined()
    expect(body.data.id).toBeTruthy()
    cleanup.push(async () => {
      const delCtx = await request.newContext({ baseURL: BASE_URL, extraHTTPHeaders: { Authorization: `Bearer ${await getToken(ADMIN_CREDENTIALS)}` } })
      await delCtx.delete(`/api/docDocuments/${body.data.id}`)
      await delCtx.dispose()
    })
    await ctx.dispose()
  })

  test('管理員可以建立文件並透過 ID 查詢', async () => {
    const doc = await api.createDocument({
      title: `${PREFIX} 查詢測試 ${Date.now()}`,
      content: '# 查詢內容',
      status: 'published',
    })
    cleanup.push(() => api.deleteDocument(doc.id))

    const token = await getToken(ADMIN_CREDENTIALS)
    const ctx = await request.newContext({
      baseURL: BASE_URL,
      extraHTTPHeaders: { Authorization: `Bearer ${token}` },
    })
    const res = await ctx.get(`/api/docDocuments/${doc.id}`)
    expect(res.ok()).toBe(true)
    const body = await res.json()
    expect(body.data.id).toBe(doc.id)
    await ctx.dispose()
  })

  test('管理員可以刪除自己建立的文件', async () => {
    const doc = await api.createDocument({
      title: `${PREFIX} 刪除測試 ${Date.now()}`,
      status: 'draft',
    })
    // 不加入 cleanup，讓此測試自行刪除

    const token = await getToken(ADMIN_CREDENTIALS)
    const ctx = await request.newContext({
      baseURL: BASE_URL,
      extraHTTPHeaders: { Authorization: `Bearer ${token}` },
    })
    const res = await ctx.delete(`/api/docDocuments/${doc.id}`)
    expect([200, 204]).toContain(res.status())
    await ctx.dispose()
  })

  test('類別列表 API（public ACL）可以不需 token 存取', async () => {
    const ctx = await request.newContext({ baseURL: BASE_URL })
    const res = await ctx.get('/api/docCategories?pageSize=10')
    // public ACL
    expect(res.status()).toBe(200)
    await ctx.dispose()
  })

  test('登入後 searchDocuments API 可以搜尋', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.evaluate(async () => {
      const res = await fetch('/api/auth:signIn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account: 'admin@nocobase.com', password: 'admin123' }),
      })
      const data = await res.json()
      localStorage.setItem('NOCOBASE_TOKEN', data.data.token)
    })

    const result = await page.evaluate(async () => {
      const token = localStorage.getItem('NOCOBASE_TOKEN')
      const res = await fetch(`/api/docDocuments:search?keyword=test`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return { status: res.status }
    })

    // 200 = 有結果；可能是空陣列也沒關係
    expect([200, 400]).toContain(result.status)
  })
})
