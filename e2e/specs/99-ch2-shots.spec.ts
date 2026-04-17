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

test('第二章截圖補齊', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })

  const api = await ApiHelper.create(ADMIN_CREDENTIALS)
  const cleanup = new CleanupStack()

  await loginAsAdmin(page)
  await page.goto(`${BASE_URL}/admin/doc-hub`, { timeout: 60000 })
  await waitReady(page, 1500)

  // 先點選一個資料夾，讓「+ 新增文件」按鈕出現
  const catItem = page.locator('text=Starters').first()
  if (await catItem.isVisible({ timeout: 3000 }).catch(() => false)) {
    await catItem.click()
    await waitReady(page, 1000)
  }

  // ── 2-1: 新增 Modal（三種選項）──────────────────────────────────────
  const newBtn = page.locator('button').filter({ hasText: /新增文件/ }).first()
  if (await newBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await newBtn.click()
    await page.waitForSelector('.ant-modal-content', { timeout: 8000 }).catch(() => {})
    await page.waitForTimeout(800)
    await shot(page, '02a_新增Modal_三種方式')

    // ── 2-3: Git 同步 → 編輯頁（填倉庫資訊）
    // 點「Git 同步」
    const gitOption = page.locator('.ant-modal-content').locator('text=Git 同步').first()
    if (await gitOption.isVisible({ timeout: 2000 }).catch(() => false)) {
      await gitOption.click()
      await page.waitForSelector('textarea, input[placeholder*="標題"]', { timeout: 20000 }).catch(() => {})
      await waitReady(page, 2000)
      // 填入倉庫資訊讓畫面豐富一點
      const repoInput = page.locator('input[placeholder*="10.1.2"], input[placeholder*="github"], input[placeholder*="repo"], input[placeholder*="倉庫"]').first()
      if (await repoInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await repoInput.fill('10.1.2.191/wezoomtek/wez-spring-boot-starters')
      }
      const pathInput = page.locator('input[placeholder*="path"], input[placeholder*="路徑"], input[placeholder*="file"]').first()
      if (await pathInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await pathInput.fill('docs/README.md')
      }
      await page.waitForTimeout(400)
      await shot(page, '02d_新增文件_Git同步_填倉庫資訊')
      // 不儲存，返回
      const backBtn = page.locator('button').filter({ hasText: /返回|取消|←/ }).first()
      if (await backBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await backBtn.click()
      } else {
        await page.goto(`${BASE_URL}/admin/doc-hub`, { timeout: 60000 })
      }
      await waitReady(page, 1000)
    } else {
      await page.keyboard.press('Escape')
    }
  }

  // ── 再次開 Modal，點「自由撰寫」截圖 ──────────────────────────────
  await page.goto(`${BASE_URL}/admin/doc-hub`, { timeout: 60000 })
  await waitReady(page, 1500)

  const catItem2 = page.locator('text=Starters').first()
  if (await catItem2.isVisible({ timeout: 3000 }).catch(() => false)) {
    await catItem2.click()
    await waitReady(page, 1000)
  }

  const newBtn2 = page.locator('button').filter({ hasText: /新增文件/ }).first()
  if (await newBtn2.isVisible({ timeout: 3000 }).catch(() => false)) {
    await newBtn2.click()
    await page.waitForSelector('.ant-modal-content', { timeout: 8000 }).catch(() => {})
    await page.waitForTimeout(800)

    // ── 2-2: 點「自由撰寫」進空白編輯頁
    const freeOption = page.locator('.ant-modal-content').locator('text=自由撰寫').first()
    if (await freeOption.isVisible({ timeout: 2000 }).catch(() => false)) {
      await freeOption.click()
      await page.waitForSelector('textarea', { timeout: 20000 }).catch(() => {})
      await waitReady(page, 2000)
      await shot(page, '02b_新增文件_自由撰寫_空白編輯頁')
      await page.goto(`${BASE_URL}/admin/doc-hub`, { timeout: 60000 })
      await waitReady(page, 1000)
    } else {
      await page.keyboard.press('Escape')
    }
  }

  // ── 2-3: 點「使用範本」截選範本畫面 ──────────────────────────────
  const catItem3 = page.locator('text=Starters').first()
  if (await catItem3.isVisible({ timeout: 3000 }).catch(() => false)) {
    await catItem3.click()
    await waitReady(page, 1000)
  }

  const newBtn3 = page.locator('button').filter({ hasText: /新增文件/ }).first()
  if (await newBtn3.isVisible({ timeout: 3000 }).catch(() => false)) {
    await newBtn3.click()
    await page.waitForSelector('.ant-modal-content', { timeout: 8000 }).catch(() => {})
    await page.waitForTimeout(800)

    const tplOption = page.locator('.ant-modal-content').locator('text=使用範本').first()
    if (await tplOption.isVisible({ timeout: 2000 }).catch(() => false)) {
      await tplOption.click()
      await page.waitForTimeout(1200)
      await shot(page, '02c_新增文件_使用範本_選範本')
      await page.keyboard.press('Escape')
      await page.waitForTimeout(400)
    } else {
      await page.keyboard.press('Escape')
    }
  }

  await cleanup.flush()
  await api.dispose()
  console.log('\n✅ 第二章截圖完成')
})
