/**
 * 通知截圖 — 補充第十七章截圖
 * 前提：member@test.com 已有未讀通知（由 13-notification.spec.ts 產生）
 */
import { test } from '@playwright/test'
import { loginAs, loginAsAdmin, MEMBER_CREDENTIALS, ADMIN_CREDENTIALS } from '../fixtures/auth'
import { ApiHelper, CleanupStack } from '../fixtures/api'
import * as path from 'path'
import * as fs from 'fs'

const BASE_URL = process.env.BASE_URL || 'http://localhost:13000'
const SHOT_DIR = path.join(__dirname, '../artifacts/screenshots')
if (!fs.existsSync(SHOT_DIR)) fs.mkdirSync(SHOT_DIR, { recursive: true })

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

test('通知截圖', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })

  // ── 確保 member 有通知 ──────────────────────────────────────────────────────
  // 先用 admin 建文件 + 讓 member 訂閱 + 更新觸發通知
  const adminApi = await ApiHelper.create(ADMIN_CREDENTIALS)
  const cleanup = new CleanupStack()
  let notifDocId: number

  try {
    const memberUser = await adminApi.getUserByEmail(MEMBER_CREDENTIALS.account)
    if (memberUser) {
      const doc = await adminApi.createDocument({
        title: '[SHOT-NOTIF] 通知截圖測試文件',
        content: '# 測試文件\n\n這是為了截通知截圖建立的測試文件。',
        status: 'published',
      })
      notifDocId = doc.id
      cleanup.push(() => adminApi.deleteDocument(notifDocId))

      // 訂閱 member
      await adminApi.setDocumentSubscribers(notifDocId, [memberUser.id])

      // 更新觸發通知
      await (adminApi as any).ctx.post(`/api/docDocuments:update?filterByTk=${notifDocId}`, {
        data: { content: '# 更新後內容\n\n通知截圖觸發更新。', changeSummary: '截圖用更新' },
      })
      await page.waitForTimeout(1000) // 等通知寫入
    }
  } catch (e) {
    console.log('前置資料建立失敗（非致命）:', e.message)
  }

  // ── 以 member 身份登入，截通知截圖 ─────────────────────────────────────────
  await loginAs(page, MEMBER_CREDENTIALS)
  await page.goto(`${BASE_URL}/admin/doc-hub`, { timeout: 60000 })
  await waitReady(page, 2000)

  // 17-1: 右上角通知 Bell（有未讀角標）
  // NocoBase 通知 bell 通常在 header 右上角
  const bellSelectors = [
    '[class*="notice"], [class*="notification"], [class*="bell"]',
    '.ant-badge sup',
    'button[class*="notice"]',
    '[data-testid*="notice"], [data-testid*="notification"]',
  ]

  // 先截全頁 header 區域
  await shot(page, '17_通知Bell_有角標')

  // 找 bell 按鈕並點開
  let bellClicked = false
  for (const sel of [
    '.ant-badge',
    '[class*="NoticeSoundOutlined"], [class*="BellOutlined"]',
    'button[class*="nb-notice"]',
  ]) {
    const el = page.locator(sel).first()
    if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
      await el.click()
      await page.waitForTimeout(800)
      bellClicked = true
      await shot(page, '17b_通知面板_開啟')
      break
    }
  }

  if (!bellClicked) {
    // 嘗試找 header 右側所有 button
    const btns = page.locator('header button, .nb-header button, [class*="header"] button')
    const count = await btns.count()
    console.log(`找到 ${count} 個 header button`)
    for (let i = 0; i < count; i++) {
      const btn = btns.nth(i)
      const html = await btn.innerHTML().catch(() => '')
      if (html.includes('Bell') || html.includes('bell') || html.includes('notice') || html.includes('Notice')) {
        await btn.click()
        await page.waitForTimeout(800)
        await shot(page, '17b_通知面板_開啟')
        bellClicked = true
        break
      }
    }
  }

  if (!bellClicked) {
    // 找不到 bell，截整個 header 看 DOM 結構
    console.log('找不到 bell，截整個畫面')
    await shot(page, '17_通知_找不到Bell_全頁參考')
  }

  // 嘗試找通知列表中的 DocHub 通知項目
  const notifItem = page.locator('[class*="notice-item"], [class*="notification-item"], .ant-list-item')
    .filter({ hasText: /文件更新|DocHub|doc-hub/ }).first()
  if (await notifItem.isVisible({ timeout: 3000 }).catch(() => false)) {
    await notifItem.screenshot({ path: path.join(SHOT_DIR, '17c_通知項目_DocHub.png') })
    console.log('  📸 17c_通知項目_DocHub.png')
  }

  // ── 切換回 admin 截「訂閱者設定」的截圖 ────────────────────────────────────
  await loginAsAdmin(page)

  // 直接用 notifDocId 進閱讀頁（確保跳到正確頁面）
  // 訂閱者設定在「專案權限 Modal」
  // 按鈕在選中專案後主內容區右上角的「🔐 權限」按鈕（admin only）
  await page.goto(`${BASE_URL}/admin/doc-hub`, { timeout: 60000 })
  await waitReady(page, 2000)

  // 點 sidebar 第一個專案（讓主區域顯示 InfoBar 包含「🔐 權限」按鈕）
  const sidebarProjTitle = page.locator('text=📁').first()
  if (await sidebarProjTitle.isVisible({ timeout: 3000 }).catch(() => false)) {
    await sidebarProjTitle.click()
    await page.waitForTimeout(800)
  }

  // 找「🔐 權限」按鈕（在主內容區右上角）
  const permBtn = page.locator('button').filter({ hasText: /🔐/ }).first()
  if (await permBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await permBtn.click()
    await page.waitForSelector('.ant-modal-content', { timeout: 8000 }).catch(() => {})
    await page.waitForTimeout(1500) // 等用戶清單載入
    // 滾到底讓訂閱者欄位進入視野
    const modalBody = page.locator('.ant-modal-body')
    await modalBody.evaluate((el: any) => el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })).catch(() => {})
    await page.waitForTimeout(600)
    await shot(page, '17d_專案權限Modal_訂閱者設定')
    await page.keyboard.press('Escape')
  } else {
    // fallback
    await shot(page, '17d_通知管理_列表頁Admin視角')
  }

  // 清理
  await cleanup.flush()
  await adminApi.dispose()

  const shots = fs.readdirSync(SHOT_DIR).filter(f => f.startsWith('17'))
  console.log(`\n✅ 通知截圖完成：${shots.length} 張`)
  shots.forEach(f => console.log(`   ${f}`))
})
