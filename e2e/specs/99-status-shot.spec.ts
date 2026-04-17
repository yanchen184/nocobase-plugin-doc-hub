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

test.setTimeout(120000)

test('列表狀態欄截圖（草稿 vs 已發布）', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })

  const api = await ApiHelper.create(ADMIN_CREDENTIALS)
  const cleanup = new CleanupStack()

  // 先查現有專案
  const projRes = await (api as any).ctx.get('/api/docProjects:list?pageSize=5')
  const projBody = await projRes.json()
  const projects = projBody.data?.data || projBody.data || []
  const proj = projects[0]
  if (!proj) { console.log('找不到專案'); return }

  // 建草稿文件
  const draftDoc = await api.createDocument({
    title: '[SHOT] API 設計草稿',
    content: '# API 設計草稿\n\n尚未完成',
    status: 'draft',
    projectId: proj.id,
  } as any)
  cleanup.push(() => api.deleteDocument(draftDoc.id))

  // 建已發布文件
  const pubDoc = await api.createDocument({
    title: '[SHOT] 部署說明（已發布）',
    content: '# 部署說明\n\n完整部署步驟。',
    status: 'published',
    projectId: proj.id,
  } as any)
  cleanup.push(() => api.deleteDocument(pubDoc.id))

  // 登入並導航到該專案
  await loginAsAdmin(page)
  await page.goto(`${BASE_URL}/admin/doc-hub`, { timeout: 60000 })
  await waitReady(page, 1500)

  // 點 sidebar 選該專案
  const projText = page.locator(`text=📁 ${proj.name}`).first()
  if (await projText.isVisible({ timeout: 3000 }).catch(() => false)) {
    await projText.click()
    await waitReady(page, 1500)
  }

  // 搜尋 [SHOT] 讓兩個測試文件出現在最前面
  const searchInput = page.locator('input[placeholder*="搜尋"], input[placeholder*="搜索"], input[class*="search"]').first()
  if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await searchInput.fill('[SHOT]')
    await page.waitForTimeout(600)
    await waitReady(page, 1000)
  }

  await shot(page, '01c_列表頁_草稿vs已發布')

  await cleanup.flush()
  await api.dispose()
})
