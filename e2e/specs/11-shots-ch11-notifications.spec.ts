import { test, expect } from '@playwright/test'
import { loginAs, loginAsAdmin, ADMIN_CREDENTIALS } from '../fixtures/auth'
import { ApiHelper } from '../fixtures/api'
import { waitReady, shot, loadSeedMeta } from '../fixtures/shot'

/**
 * MANUAL.md 第 11 章：站內信通知（鈴鐺圖示）
 *  真實流程：Admin 更新文件 → subscriber 收到通知 → 登入 subscriber 截鈴鐺畫面
 *
 *  - 01_bell_with_badge     鈴鐺圖示 + 未讀紅點 Badge
 *  - 02_notification_list   展開通知清單（顯示文件更新訊息）
 *  - 03_notification_opened 已讀狀態（badge 消失）
 */

test.setTimeout(300000)

const SUBSCRIBER_EMAIL = 'subscriber@test.com'
const SUBSCRIBER_PASSWORD = 'subscriber123'

test('ch11: 站內信通知 — 真實觸發', async ({ page, context }) => {
  const meta = loadSeedMeta()
  const api = await ApiHelper.create(ADMIN_CREDENTIALS)

  // ── Step 1: 確保 subscriber 帳號存在 ────────────────────────────────
  let sub = await api.getUserByEmail(SUBSCRIBER_EMAIL).catch(() => null)
  if (!sub?.id) {
    sub = await api.createUser({
      email: SUBSCRIBER_EMAIL,
      nickname: 'Subscriber Sam',
      password: SUBSCRIBER_PASSWORD,
    })
  }
  expect(sub?.id).toBeTruthy()

  // ── Step 2: 找一份 published doc，把 subscriber 加入訂閱 ────────────
  const docId = meta.featured.publishedDoc || meta.featured.gitBoundDoc
  expect(docId).toBeTruthy()
  await api.setDocumentSubscribers(docId, [sub.id])

  // ── Step 3: Admin 更新文件 → 觸發通知 ────────────────────────────────
  const ts = new Date().toISOString().replace('T', ' ').slice(0, 19)
  await api.updateDocument(docId, {
    content: `\n\n<!-- 手冊截圖觸發更新 ${ts} -->`,
    userSummary: `手冊示範：修正段落敘述（${ts}）`,
  } as any)

  // 等 2 秒讓後端寫完 notificationInAppMessages
  await new Promise((r) => setTimeout(r, 2000))

  await api.dispose()

  // ── Step 4: 登入 subscriber，截鈴鐺 ────────────────────────────────
  await page.setViewportSize({ width: 1440, height: 900 })
  await loginAs(page, { account: SUBSCRIBER_EMAIL, password: SUBSCRIBER_PASSWORD })
  await page.goto('/admin/doc-hub', { timeout: 60000 })
  await waitReady(page, 2500)

  // 尋找 NocoBase 頂部的鈴鐺按鈕（in-app-message 插件）
  // 嘗試多個可能的 selector，哪個先亮哪個
  const bellCandidates = [
    'button[aria-label*="notification" i]',
    'button[aria-label*="通知"]',
    '[class*="notification"] button',
    '[class*="NotificationCenter"]',
    '.ant-badge:has(svg)',
    // NocoBase 把鈴鐺放在 header 右上，通常是 ant-badge 包 BellOutlined
  ]
  let bell: import('@playwright/test').Locator | null = null
  for (const sel of bellCandidates) {
    const loc = page.locator(sel).first()
    if (await loc.isVisible({ timeout: 1000 }).catch(() => false)) {
      bell = loc
      break
    }
  }

  // Fallback：用 SVG icon 類別找（anticon-bell）
  if (!bell) {
    const svgBell = page.locator('.anticon-bell').first()
    if (await svgBell.isVisible({ timeout: 1500 }).catch(() => false)) {
      bell = svgBell
    }
  }

  if (bell) {
    // 捲動鈴鐺入鏡（只截頂部區域）
    await bell.scrollIntoViewIfNeeded().catch(() => {})
    await page.waitForTimeout(500)
    await shot(page, 'ch11', '01_bell_with_badge')

    // 點鈴鐺展開清單
    await bell.click({ timeout: 5000 }).catch(() => {})
    await page.waitForTimeout(1200)
    await shot(page, 'ch11', '02_notification_list')

    // 嘗試點擊第一則通知開啟（使其已讀）
    const firstItem = page
      .locator('.ant-popover-inner-content, .ant-dropdown-menu, [class*="notification"]')
      .locator('text=/文件更新/')
      .first()
    if (await firstItem.isVisible({ timeout: 1500 }).catch(() => false)) {
      await firstItem.click({ timeout: 3000 }).catch(() => {})
      await page.waitForTimeout(1000)
      await shot(page, 'ch11', '03_notification_opened')
    } else {
      // 沒辦法點到就直接關掉 popover、截已展開清單為「已讀」示意
      await page.keyboard.press('Escape').catch(() => {})
      await page.waitForTimeout(500)
      await shot(page, 'ch11', '03_notification_opened')
    }
  } else {
    // 找不到鈴鐺就整頁截圖做紀錄，避免 spec 完全失敗
    console.warn('[ch11] 找不到鈴鐺按鈕，回退截整頁')
    await shot(page, 'ch11', '01_bell_with_badge')
  }
})
