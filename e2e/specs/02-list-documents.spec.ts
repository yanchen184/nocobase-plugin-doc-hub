import { test, expect } from '@playwright/test'
import { loginAsAdmin } from '../fixtures/auth'
import { ApiHelper, CleanupStack } from '../fixtures/api'

const PREFIX = '[E2E-LIST]'

test.describe('DocHub 文件列表', () => {
  let api: ApiHelper
  const cleanup = new CleanupStack()

  test.beforeAll(async () => {
    api = await ApiHelper.create()
    // 確保至少有一篇文件
    const doc = await api.createDocument({
      title: `${PREFIX} 測試文件 ${Date.now()}`,
      content: '# 測試內容\n\n這是 E2E 測試用的文件。',
      status: 'published',
    })
    cleanup.push(() => api.deleteDocument(doc.id))
  })

  test.afterAll(async () => {
    await cleanup.flush()
    await api.dispose()
  })

  test('管理員可以看到文件列表（不是空白）', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // 直接呼叫 API 確認有資料
    const response = await page.evaluate(async () => {
      const token = localStorage.getItem('NOCOBASE_TOKEN')
      const res = await fetch('/api/docDocuments?page=1&pageSize=20', {
        headers: { Authorization: `Bearer ${token}` },
      })
      return res.json()
    })

    expect(response.data).toBeDefined()
    expect(Array.isArray(response.data)).toBe(true)
    expect(response.data.length).toBeGreaterThan(0)

    await page.screenshot({ path: 'artifacts/02-list-documents.png' })
  })

  test('API 回傳有效的資料結構', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const response = await page.evaluate(async () => {
      const token = localStorage.getItem('NOCOBASE_TOKEN')
      const res = await fetch('/api/docDocuments?page=1&pageSize=20', {
        headers: { Authorization: `Bearer ${token}` },
      })
      return res.json()
    })

    // 必須有 data 陣列
    expect(Array.isArray(response.data)).toBe(true)
    expect(response.data.length).toBeGreaterThan(0)

    // 每筆文件應有基本欄位
    const first = response.data[0]
    expect(first).toHaveProperty('id')
    expect(first).toHaveProperty('title')
    expect(first).toHaveProperty('status')
    expect(first).toHaveProperty('createdAt')
  })

  test('可以用關鍵字搜尋文件', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const searchTerm = 'E2E'
    const response = await page.evaluate(async (term) => {
      const token = localStorage.getItem('NOCOBASE_TOKEN')
      const res = await fetch(`/api/docDocuments?page=1&pageSize=20&filter=${encodeURIComponent(JSON.stringify({ title: { $includes: term } }))}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return res.json()
    }, searchTerm)

    // 應該可以搜到我們建立的測試文件
    expect(Array.isArray(response.data)).toBe(true)
    const found = response.data.some((d: any) => d.title?.includes(searchTerm))
    expect(found).toBe(true)
  })

  test('API 呼叫回傳 200 且有 data 陣列', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const result = await page.evaluate(async () => {
      const token = localStorage.getItem('NOCOBASE_TOKEN')
      const res = await fetch('/api/docDocuments?page=1&pageSize=5', {
        headers: { Authorization: `Bearer ${token}` },
      })
      return { status: res.status, body: await res.json() }
    })

    expect(result.status).toBe(200)
    expect(Array.isArray(result.body.data)).toBe(true)
  })
})
