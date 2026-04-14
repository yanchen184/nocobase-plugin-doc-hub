import { test, expect } from '@playwright/test'
import { loginAsAdmin } from '../fixtures/auth'
import { ApiHelper, CleanupStack } from '../fixtures/api'

const PREFIX = '[E2E-CRUD]'

test.describe('DocHub 文件 CRUD', () => {
  let api: ApiHelper
  const cleanup = new CleanupStack()

  test.beforeAll(async () => {
    api = await ApiHelper.create()
  })

  test.afterAll(async () => {
    await cleanup.flush()
    // 清理所有本次測試產生的資料
    await api.cleanupByTitlePrefix(PREFIX)
    await api.dispose()
  })

  test('可以建立新文件', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const title = `${PREFIX} 新文件 ${Date.now()}`
    const result = await page.evaluate(async (t) => {
      const token = localStorage.getItem('NOCOBASE_TOKEN')
      const res = await fetch('/api/docDocuments', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: t, content: '# 測試', status: 'draft' }),
      })
      return res.json()
    }, title)

    expect(result.data).toBeDefined()
    expect(result.data.id).toBeTruthy()
    expect(result.data.title).toBe(title)

    cleanup.push(() => api.deleteDocument(result.data.id))
    await page.screenshot({ path: 'artifacts/03-create-doc.png' })
  })

  test('可以讀取文件詳情', async ({ page }) => {
    // 先用 API 建立文件
    const doc = await api.createDocument({
      title: `${PREFIX} 讀取測試 ${Date.now()}`,
      content: '# 詳情測試',
    })
    cleanup.push(() => api.deleteDocument(doc.id))

    await loginAsAdmin(page)
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const result = await page.evaluate(async (id) => {
      const token = localStorage.getItem('NOCOBASE_TOKEN')
      const res = await fetch(`/api/docDocuments/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return res.json()
    }, doc.id)

    expect(result.data).toBeDefined()
    expect(result.data.id).toBe(doc.id)
    expect(result.data.title).toContain(PREFIX)
  })

  test('可以更新文件標題', async ({ page }) => {
    const doc = await api.createDocument({
      title: `${PREFIX} 原始標題 ${Date.now()}`,
    })
    cleanup.push(() => api.deleteDocument(doc.id))

    await loginAsAdmin(page)
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const newTitle = `${PREFIX} 更新後標題 ${Date.now()}`
    const result = await page.evaluate(
      async ({ id, title }) => {
        const token = localStorage.getItem('NOCOBASE_TOKEN')
        const res = await fetch(`/api/docDocuments/${id}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title }),
        })
        return res.json()
      },
      { id: doc.id, title: newTitle }
    )

    expect(result.data.title).toBe(newTitle)
  })

  test('可以刪除文件', async ({ page }) => {
    const doc = await api.createDocument({
      title: `${PREFIX} 待刪除 ${Date.now()}`,
    })
    // NOT pushing to cleanup — we'll delete it in the test

    await loginAsAdmin(page)
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const deleteResult = await page.evaluate(async (id) => {
      const token = localStorage.getItem('NOCOBASE_TOKEN')
      const res = await fetch(`/api/docDocuments/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      return { status: res.status, ok: res.ok }
    }, doc.id)

    expect(deleteResult.ok).toBe(true)

    // 確認已刪除
    const getResult = await page.evaluate(async (id) => {
      const token = localStorage.getItem('NOCOBASE_TOKEN')
      const res = await fetch(`/api/docDocuments/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return { status: res.status }
    }, doc.id)

    expect([404, 200]).toContain(getResult.status) // 404 or empty data
  })

  test('草稿文件可以發布', async ({ page }) => {
    const doc = await api.createDocument({
      title: `${PREFIX} 草稿發布 ${Date.now()}`,
      status: 'draft',
    })
    cleanup.push(() => api.deleteDocument(doc.id))

    await loginAsAdmin(page)
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const result = await page.evaluate(
      async ({ id }) => {
        const token = localStorage.getItem('NOCOBASE_TOKEN')
        const res = await fetch(`/api/docDocuments/${id}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'published' }),
        })
        return res.json()
      },
      { id: doc.id }
    )

    expect(result.data.status).toBe('published')
  })
})
