/**
 * Story 章節 8：訂閱者體驗 — 訂閱、收通知、看清單
 *
 * 流程（單一 test 多階段）：
 *   1. Admin 確保 doc 已加 subscriber，然後更新 doc 觸發通知
 *   2. Subscriber 登入首頁 → 看見鈴鐺紅色 badge
 *   3. 點鈴鐺 → 通知清單彈出
 *   4. 點通知 → 跳到 view 頁，badge 變灰
 */

import { test } from '@playwright/test'
import { loginAs, USERS } from '../fixtures/auth'
import { ApiHelper } from '../fixtures/api'
import { waitReady, shot, ensureDir } from '../fixtures/shot'
import * as path from 'path'
import * as fs from 'fs'

const SHOT_DIR = path.join(__dirname, '../artifacts/manual-shots/story')
ensureDir(SHOT_DIR)
const STATE_FILE = path.join(__dirname, '../artifacts/story-state.json')

test.setTimeout(180000)

test('ch8: 訂閱者體驗（單一 test 多階段截圖）', async ({ page }) => {
  const api = await ApiHelper.create()
  const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'))
  const docId = state.diffDocId

  if (!docId) {
    console.warn('  ⚠️ 無示範文件 ID，請先跑 Ch5')
    await api.dispose()
    return
  }

  // ── Setup：admin 觸發更新（讓 subscriber 收新通知）─────────
  const subUser = await api.getUserByEmail(USERS.subscriber.account).catch(() => null)
  if (!subUser?.id) {
    console.warn('  ⚠️ subscriber 帳號不存在')
    await api.dispose()
    return
  }
  // 確保 subscriber 仍綁在這篇 doc 上
  await api.setDocumentSubscribers(docId, [subUser.id]).catch(() => {})

  // 更新 doc，server 會自動發站內信給 subscribers
  const ts = new Date().toISOString().slice(0, 19).replace('T', ' ')
  await api.raw
    .post(`/api/docDocuments:update?filterByTk=${docId}`, {
      data: {
        content: `# 首頁載入優化\n\n<!-- 訂閱者通知示範 ${ts} -->\n\n## 目標\n首頁從 3 秒降到 1.0 秒以內。\n`,
        userSummary: `示範：訂閱者通知測試（${ts}）`,
      },
    })
    .catch((e: any) => console.warn('  ⚠️ update doc:', e?.message))
  console.log('  📝 已觸發 doc 更新（subscriber 應收到站內信）')

  // 等 server 寫 in-app message
  await page.waitForTimeout(2000)
  await api.dispose()

  // ── 階段 1：Subscriber 登入首頁 → 鈴鐺紅 badge ──────────────
  await page.setViewportSize({ width: 1440, height: 900 })
  await loginAs(page, USERS.subscriber)
  await page.goto('/admin/doc-hub', { timeout: 60000 })
  await waitReady(page, 2500)
  await shot(page, 'story', 'ch8_01_subscriber首頁_鈴鐺紅badge')

  // ── 階段 2：點鈴鐺 → 通知清單彈出 ──────────────────────────
  const bellCandidates = [
    'button[aria-label*="notification" i]',
    'button[aria-label*="通知"]',
    '.anticon-bell',
    '.ant-badge:has(svg)',
  ]
  let bell: any = null
  for (const sel of bellCandidates) {
    const loc = page.locator(sel).first()
    if (await loc.isVisible({ timeout: 1500 }).catch(() => false)) {
      bell = loc
      break
    }
  }

  if (bell) {
    await bell.scrollIntoViewIfNeeded().catch(() => {})
    await bell.click({ force: true, timeout: 5000 }).catch(() => {})
    await page.waitForTimeout(1200)
    await shot(page, 'story', 'ch8_02_通知清單彈出')

    // 試著點第一則通知
    const firstItem = page
      .locator('.ant-popover-inner-content, .ant-dropdown-menu, [class*="notification"]')
      .locator('text=/文件更新|更新|示範/')
      .first()
    if (await firstItem.isVisible({ timeout: 1500 }).catch(() => false)) {
      await firstItem.click({ force: true, timeout: 3000 }).catch(() => {})
      await page.waitForTimeout(1500)
      await shot(page, 'story', 'ch8_03_點通知跳到文件')
    } else {
      // 找不到就退回截目前畫面
      await page.keyboard.press('Escape').catch(() => {})
      await page.waitForTimeout(500)
      await shot(page, 'story', 'ch8_03_點通知跳到文件')
    }
  } else {
    console.warn('  ⚠️ 找不到鈴鐺按鈕，跳過階段 2/3')
  }

  // ── 階段 4：subscriber 直接進 view 頁，呈現「我訂閱了」狀態 ──
  await page.goto(`/admin/doc-hub/view/${docId}`, { timeout: 60000 })
  await page.waitForSelector('h1, h2, h3', { timeout: 15000 }).catch(() => {})
  await waitReady(page, 1500)
  await shot(page, 'story', 'ch8_04_subscriber_閱讀頁_完整體驗')
})
