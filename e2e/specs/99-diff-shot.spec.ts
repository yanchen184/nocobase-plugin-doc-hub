import { test } from '@playwright/test'
import { loginAsAdmin, ADMIN_CREDENTIALS } from '../fixtures/auth'
import { ApiHelper, CleanupStack } from '../fixtures/api'
import * as path from 'path'
import * as fs from 'fs'

const BASE_URL = process.env.BASE_URL || 'http://localhost:13000'
const SHOT_DIR = path.join(__dirname, '../artifacts/screenshots')

async function shot(page: any, name: string) {
  await page.screenshot({ path: path.join(SHOT_DIR, `${name}.png`), fullPage: false })
  console.log(`  📸 ${name}.png`)
}

async function waitReady(page: any, extraMs = 1200) {
  await page.waitForLoadState('networkidle')
  await page.waitForFunction(() => {
    const spinners = document.querySelectorAll('.ant-spin-spinning')
    return Array.from(spinners).every((el: any) => {
      const s = window.getComputedStyle(el)
      return s.display === 'none' || s.visibility === 'hidden' || el.offsetParent === null
    })
  }, { timeout: 15000 }).catch(() => {})
  await page.waitForTimeout(extraMs)
}

test('Diff 截圖（有紅綠高亮）', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })

  const api = await ApiHelper.create(ADMIN_CREDENTIALS)
  const cleanup = new CleanupStack()

  // 建 v1 內容
  const doc = await api.createDocument({
    title: '[SHOT-DIFF] API 設計規範',
    content: `# API 設計規範

## 基本原則

- 使用 RESTful 設計
- 統一回應格式
- 錯誤碼標準化

## 版本控制

使用 URL 版本號：\`/api/v1/resources\`
`,
    status: 'published',
  } as any)
  cleanup.push(() => api.deleteDocument(doc.id))

  // 更新為 v2（刪除部分，新增部分）
  await (api as any).ctx.post(`/api/docDocuments:update?filterByTk=${doc.id}`, {
    data: {
      content: `# API 設計規範

## 基本原則

- 使用 RESTful 設計
- 統一回應格式
- 錯誤碼標準化
- **新增**：所有 API 必須加入 rate limiting

## 版本控制

使用 Header 版本號：\`Accept-Version: v2\`（不再使用 URL 版本）

## 安全性要求

- JWT 驗證
- HTTPS only
`,
    },
  })
  await page.waitForTimeout(500)

  // 登入並前往版本歷史
  await loginAsAdmin(page)
  await page.goto(`${BASE_URL}/admin/doc-hub/versions/${doc.id}`, { timeout: 60000 })
  await page.waitForSelector('.ant-table-row, button', { timeout: 20000 }).catch(() => {})
  await waitReady(page, 2000)
  // 關閉可能的錯誤 toast
  await page.locator('.ant-notification-close-icon').first().click({ timeout: 2000 }).catch(() => {})

  await shot(page, '06b_版本歷史_Diff紅綠高亮')

  await cleanup.flush()
  await api.dispose()
  console.log('\n✅ Diff 截圖完成')
})
