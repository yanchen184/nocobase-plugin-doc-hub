import { test, expect } from '@playwright/test'
import { loginAsAdmin } from '../fixtures/auth'
import { ApiHelper, CleanupStack } from '../fixtures/api'

const PREFIX = '[E2E-CAT]'

test.describe('DocHub 分類管理', () => {
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

  test('可以建立新分類', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const name = `${PREFIX} 新分類 ${Date.now()}`
    const result = await page.evaluate(async (n) => {
      const token = localStorage.getItem('NOCOBASE_TOKEN')
      const res = await fetch('/api/docCategories', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: n, description: 'E2E 測試分類' }),
      })
      return res.json()
    }, name)

    expect(result.data).toBeDefined()
    expect(result.data.id).toBeTruthy()
    expect(result.data.name).toBe(name)

    cleanup.push(() => api.deleteCategory(result.data.id))
    await page.screenshot({ path: 'artifacts/04-create-category.png' })
  })

  test('可以列出所有分類', async ({ page }) => {
    const cat = await api.createCategory({ name: `${PREFIX} 列表測試 ${Date.now()}` })
    cleanup.push(() => api.deleteCategory(cat.id))

    await loginAsAdmin(page)
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const result = await page.evaluate(async () => {
      const token = localStorage.getItem('NOCOBASE_TOKEN')
      const res = await fetch('/api/docCategories?pageSize=200', {
        headers: { Authorization: `Bearer ${token}` },
      })
      return res.json()
    })

    expect(Array.isArray(result.data)).toBe(true)
    const found = result.data.some((c: any) => c.name?.startsWith(PREFIX))
    expect(found).toBe(true)
  })

  test('文件可以關聯到分類', async ({ page }) => {
    const cat = await api.createCategory({ name: `${PREFIX} 分類關聯 ${Date.now()}` })
    cleanup.push(() => api.deleteCategory(cat.id))

    const doc = await api.createDocument({
      title: `${PREFIX} 分類文件 ${Date.now()}`,
      categoryId: cat.id,
    })
    cleanup.push(() => api.deleteDocument(doc.id))

    await loginAsAdmin(page)
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // 用 categoryId 過濾
    const result = await page.evaluate(async (catId) => {
      const token = localStorage.getItem('NOCOBASE_TOKEN')
      const filter = JSON.stringify({ categoryId: catId })
      const res = await fetch(`/api/docDocuments?filter=${encodeURIComponent(filter)}&pageSize=20`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return res.json()
    }, cat.id)

    expect(Array.isArray(result.data)).toBe(true)
    // 至少要有我們建立的文件
    const found = result.data.some((d: any) => d.id === doc.id)
    expect(found).toBe(true)
  })
})
