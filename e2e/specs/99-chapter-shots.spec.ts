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

test.setTimeout(180000)

test('補章節截圖', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })

  const api = await ApiHelper.create(ADMIN_CREDENTIALS)
  const cleanup = new CleanupStack()

  // ── 3-3: Git 資訊列放大截圖 ──────────────────────────────────────────────
  // 找一個有 githubRepo 的文件進編輯頁
  const docsRes = await (api as any).ctx.get('/api/docDocuments:list?pageSize=50&filter=%7B%7D&appends=type')
  const docsBody = await docsRes.json()
  const docs = docsBody.data?.data || docsBody.data || []
  const gitDoc = docs.find((d: any) => d.githubRepo)

  await loginAsAdmin(page)

  if (gitDoc) {
    await page.goto(`${BASE_URL}/admin/doc-hub/edit/${gitDoc.id}`, { timeout: 60000 })
    await page.waitForSelector('textarea', { timeout: 25000 }).catch(() => {})
    await waitReady(page, 2000)
    // 截 Git 資訊列區域（整個 header 含 Git bar）
    const gitBar = page.locator('text=GIT').first()
    if (await gitBar.isVisible({ timeout: 3000 }).catch(() => false)) {
      // 截包含 Git bar 的上半部
      await page.screenshot({
        path: path.join(SHOT_DIR, '03b_編輯頁_Git資訊列_放大.png'),
        clip: { x: 0, y: 0, width: 1440, height: 120 },
      })
      console.log('  📸 03b_編輯頁_Git資訊列_放大.png')
    } else {
      console.log('  ⚠️ 找不到 Git bar，改截全頁 top')
      await page.screenshot({
        path: path.join(SHOT_DIR, '03b_編輯頁_Git資訊列_放大.png'),
        clip: { x: 0, y: 30, width: 1440, height: 110 },
      })
      console.log('  📸 03b_編輯頁_Git資訊列_放大.png (fallback)')
    }
  } else {
    console.log('  ⚠️ 沒有含 githubRepo 的文件，跳過 git bar 截圖')
  }

  // ── 第二章: 新增文件三種方式 ──────────────────────────────────────────────
  await page.goto(`${BASE_URL}/admin/doc-hub`, { timeout: 60000 })
  await waitReady(page, 1500)

  // 2-1: 開啟新增 Modal（已有 03_新增文件Modal.png，這裡截三種選項的 Modal）
  const newBtn = page.locator('button').filter({ hasText: /新增|新建|\+/ }).first()
  if (await newBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await newBtn.click()
    await page.waitForSelector('.ant-modal-content', { timeout: 8000 }).catch(() => {})
    await page.waitForTimeout(800)
    await shot(page, '02a_新增Modal_三種方式')

    // 2-2: 點「Git 同步」選項
    const gitOption = page.locator('.ant-modal-content').locator('text=Git 同步').first()
    if (await gitOption.isVisible({ timeout: 2000 }).catch(() => false)) {
      await gitOption.click()
      await page.waitForTimeout(1000)
      await shot(page, '02b_新增文件_Git同步Modal')
      await page.keyboard.press('Escape')
      await page.waitForTimeout(400)
    } else {
      await page.keyboard.press('Escape')
    }
  }

  // 2-3: 點「使用範本」→ 截範本選擇頁
  const newBtn2 = page.locator('button').filter({ hasText: /新增|新建|\+/ }).first()
  if (await newBtn2.isVisible({ timeout: 3000 }).catch(() => false)) {
    await newBtn2.click()
    await page.waitForSelector('.ant-modal-content', { timeout: 8000 }).catch(() => {})
    await page.waitForTimeout(800)
    const tplOption = page.locator('.ant-modal-content').locator('text=使用範本').first()
    if (await tplOption.isVisible({ timeout: 2000 }).catch(() => false)) {
      await tplOption.click()
      await page.waitForTimeout(1200)
      await shot(page, '02c_新增文件_使用範本_選範本頁')
      await page.keyboard.press('Escape')
      await page.waitForTimeout(400)
    } else {
      await page.keyboard.press('Escape')
    }
  }

  await cleanup.flush()
  await api.dispose()
  console.log('\n✅ 補章節截圖完成')
})
