import { Page, request } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'http://localhost:13000'

export interface UserCredentials {
  account: string
  password: string
}

export const ADMIN_CREDENTIALS: UserCredentials = {
  account: process.env.ADMIN_ACCOUNT || 'admin@nocobase.com',
  password: process.env.ADMIN_PASSWORD || 'admin123',
}

export const MEMBER_CREDENTIALS: UserCredentials = {
  account: process.env.MEMBER_ACCOUNT || 'member@test.com',
  password: process.env.MEMBER_PASSWORD || 'member123',
}

/**
 * Get auth token via API (no browser needed)
 */
export async function getToken(credentials: UserCredentials): Promise<string> {
  const ctx = await request.newContext({ baseURL: BASE_URL })
  const res = await ctx.post('/api/auth:signIn', {
    data: { account: credentials.account, password: credentials.password },
  })
  if (!res.ok()) {
    throw new Error(`Login failed: ${res.status()} ${await res.text()}`)
  }
  const body = await res.json()
  // NocoBase returns { data: { token: "..." } }
  const token = body?.data?.token
  if (!token) {
    throw new Error(`No token in response: ${JSON.stringify(body)}`)
  }
  await ctx.dispose()
  return token
}

/**
 * Inject token into localStorage and navigate to NocoBase
 * This bypasses the login form entirely.
 */
export async function loginAs(page: Page, credentials: UserCredentials): Promise<void> {
  const token = await getToken(credentials)
  // Navigate to the app so localStorage is available
  await page.goto('/')
  await page.evaluate((t) => {
    localStorage.setItem('NOCOBASE_TOKEN', t)
  }, token)
  // Reload to apply the token
  await page.reload()
  await page.waitForLoadState('networkidle')
}

export async function loginAsAdmin(page: Page): Promise<void> {
  return loginAs(page, ADMIN_CREDENTIALS)
}

export async function loginAsMember(page: Page): Promise<void> {
  return loginAs(page, MEMBER_CREDENTIALS)
}

export async function logout(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.removeItem('NOCOBASE_TOKEN')
  })
}
