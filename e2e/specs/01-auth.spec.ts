import { test, expect } from '@playwright/test'
import { loginAsAdmin, loginAsMember, logout, ADMIN_CREDENTIALS, getToken } from '../fixtures/auth'

const BASE_URL = process.env.BASE_URL || 'http://localhost:13000'

test.describe('DocHub 認證', () => {
  test('管理員可以登入並看到 DocHub', async ({ page }) => {
    await loginAsAdmin(page)

    // 確認已登入 — localStorage 有 token
    const token = await page.evaluate(() => localStorage.getItem('NOCOBASE_TOKEN'))
    expect(token).toBeTruthy()

    // 確認頁面載入成功（不是 403 或空白頁）
    await expect(page).not.toHaveURL(/login/)
    await page.screenshot({ path: 'artifacts/01-admin-login.png' })
  })

  test('未登入時 docDocuments 仍可讀取（public ACL）', async ({ request }) => {
    // docDocuments:list 使用 public ACL，未授權也可以讀取（回傳空陣列）
    // 寫入操作（POST/PUT/DELETE）才需要認證
    const res = await request.get(`${BASE_URL}/api/docDocuments?page=1&pageSize=5`)
    // public ACL 下回傳 200
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.data).toBeDefined()
    expect(Array.isArray(body.data)).toBe(true)
  })

  test('有 token 的請求可以存取文件列表', async ({ request }) => {
    const token = await getToken(ADMIN_CREDENTIALS)
    const res = await request.get(`${BASE_URL}/api/docDocuments?page=1&pageSize=20`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.data).toBeDefined()
    expect(Array.isArray(body.data)).toBe(true)
    // 有 token 時可以看到實際資料
    expect(body.data.length).toBeGreaterThan(0)
  })

  test('正確憑證可以拿到 token', async () => {
    const token = await getToken(ADMIN_CREDENTIALS)
    expect(token).toBeTruthy()
    expect(typeof token).toBe('string')
    expect(token.length).toBeGreaterThan(20)
  })

  test('登出後 token 從 localStorage 移除', async ({ page }) => {
    await loginAsAdmin(page)
    await logout(page)
    const token = await page.evaluate(() => localStorage.getItem('NOCOBASE_TOKEN'))
    expect(token).toBeNull()
  })
})
