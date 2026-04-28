/**
 * Story 章節 7：三種角色驗證 — 訪客/編輯者/訂閱者只能做該做的事
 *
 * 目標：用同一份範本文件（從 Ch4 帶過來），分別以三種身份登入查看，
 *      用截圖證明每個角色看到的工具列、按鈕、操作選項都符合權限設計。
 *
 * 流程（單一 test 多階段，三個 page context 順序登入）：
 *   1. Admin 設定該 doc 的 editors=[manual_editor], subscribers=[manual_subscriber]
 *   2. Viewer 登入 → view 頁（只能看，沒有編輯按鈕）
 *   3. Editor 登入 → view 頁（有編輯按鈕） → 編輯頁（能改內容）
 *   4. Subscriber 登入 → view 頁（有訂閱標誌、能看到通知）→ 通知中心
 *   5. Outsider 登入 → view 頁（沒權限：404 或空畫面）
 */

import { test, request } from '@playwright/test'
import { loginAs, USERS, getToken } from '../fixtures/auth'
import { ApiHelper } from '../fixtures/api'
import { waitReady, shot, ensureDir } from '../fixtures/shot'
import * as path from 'path'
import * as fs from 'fs'

const BASE_URL = process.env.BASE_URL || 'http://localhost:13000'
const SHOT_DIR = path.join(__dirname, '../artifacts/manual-shots/story')
ensureDir(SHOT_DIR)
const STATE_FILE = path.join(__dirname, '../artifacts/story-state.json')

test.setTimeout(180000)

test('ch7: 三角色權限驗證（單一 test 多階段截圖）', async ({ browser }) => {
  const api = await ApiHelper.create()
  const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'))
  const docId = state.diffDocId || state.templateDocId
  if (!docId) {
    console.warn('  ⚠️ 無示範文件 ID，請先跑 Ch4/Ch5')
    await api.dispose()
    return
  }

  // ── Setup：admin 配置「專案層」viewer/editor/subscriber 權限 ──
  const viewerUser = await api.getUserByEmail(USERS.viewer.account).catch(() => null)
  const editorUser = await api.getUserByEmail(USERS.editor.account).catch(() => null)
  const subUser = await api.getUserByEmail(USERS.subscriber.account).catch(() => null)

  if (viewerUser?.id || editorUser?.id || subUser?.id) {
    await api
      .setProjectPermissions(state.projectId, {
        viewerIds: viewerUser?.id ? [viewerUser.id] : [],
        editorIds: editorUser?.id ? [editorUser.id] : [],
        subscriberIds: subUser?.id ? [subUser.id] : [],
      })
      .catch((e: any) => console.warn('  ⚠️ setProjectPermissions:', e?.message))
  }

  // 補：把 subscriber 也掛到 doc 上（這樣會收到該 doc 的通知）
  if (subUser?.id) {
    await api
      .setDocumentSubscribers(docId, [subUser.id])
      .catch((e: any) => console.warn('  ⚠️ setDocumentSubscribers:', e?.message))
  }
  console.log(
    `  ✓ 已配置專案 #${state.projectId} 權限：viewer=${viewerUser?.id}, editor=${editorUser?.id}, subscriber=${subUser?.id}`
  )

  // ── 階段 1：Viewer（manual_viewer）登入看 view 頁 ───────────
  const viewerCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const viewerPage = await viewerCtx.newPage()
  await loginAs(viewerPage, USERS.viewer)
  await viewerPage.goto(`/admin/doc-hub/view/${docId}`, { timeout: 60000 })
  await viewerPage.waitForSelector('h1, h2, h3, button', { timeout: 15000 }).catch(() => {})
  await waitReady(viewerPage, 1500)
  await shot(viewerPage, 'story', 'ch7_01_viewer_閱讀頁_只能看')
  await viewerCtx.close()

  // ── 階段 2：Editor 登入看 view 頁（有編輯按鈕）──────────────
  const editorCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const editorPage = await editorCtx.newPage()
  await loginAs(editorPage, USERS.editor)
  await editorPage.goto(`/admin/doc-hub/view/${docId}`, { timeout: 60000 })
  await editorPage.waitForSelector('h1, h2, h3, button', { timeout: 15000 }).catch(() => {})
  await waitReady(editorPage, 1500)
  await shot(editorPage, 'story', 'ch7_02_editor_閱讀頁_有編輯按鈕')

  // 進編輯頁
  await editorPage.goto(`/admin/doc-hub/edit/${docId}`, { timeout: 60000 })
  await editorPage.waitForSelector('input, textarea', { timeout: 15000 }).catch(() => {})
  await waitReady(editorPage, 1500)
  await shot(editorPage, 'story', 'ch7_03_editor_編輯頁_能改內容')
  await editorCtx.close()

  // ── 階段 3：Subscriber 登入看 view 頁 + 通知中心 ────────────
  const subCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const subPage = await subCtx.newPage()
  await loginAs(subPage, USERS.subscriber)
  await subPage.goto(`/admin/doc-hub/view/${docId}`, { timeout: 60000 })
  await subPage.waitForSelector('h1, h2, h3, button', { timeout: 15000 }).catch(() => {})
  await waitReady(subPage, 1500)
  await shot(subPage, 'story', 'ch7_04_subscriber_閱讀頁_訂閱標誌')
  await subCtx.close()

  // ── 階段 4：Outsider 登入嘗試看（應無權限）────────────────
  const outCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const outPage = await outCtx.newPage()
  await loginAs(outPage, USERS.outsider)
  await outPage.goto(`/admin/doc-hub/view/${docId}`, { timeout: 60000 })
  await outPage.waitForSelector('body', { timeout: 15000 }).catch(() => {})
  await waitReady(outPage, 2000)
  await shot(outPage, 'story', 'ch7_05_outsider_無權限_看不到')
  await outCtx.close()

  await api.dispose()
})
