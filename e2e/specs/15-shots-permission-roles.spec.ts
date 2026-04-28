/**
 * 權限階層手操截圖：Viewer / Subscriber / Editor / Admin 四種角色的視角
 *
 * 截圖清單（共 12 張）：
 * 01_perm_modal_full：管理員打開「🔐 專案權限設定」Modal —— 三層權限欄 + Hint Table
 * 02_perm_hint_zoom：權限階層 Hint Table 特寫
 * 03_role_admin_sidebar：Admin 看到所有專案
 * 04_role_admin_edit_btn：Admin 編輯按鈕可用
 * 05_role_editor_sidebar：Editor 看到專案
 * 06_role_editor_edit_btn：Editor 編輯按鈕可用
 * 07_role_subscriber_sidebar：Subscriber 看到專案
 * 08_role_subscriber_no_edit：Subscriber 無編輯按鈕（只能讀）
 * 09_role_viewer_sidebar：Viewer 看到專案
 * 10_role_viewer_no_edit：Viewer 無編輯按鈕（只能讀）
 * 11_role_outsider_no_project：Outsider 看不到專案
 * 12_notification_inbox：通知收件匣（Subscriber 看到通知）
 */

import { test } from '@playwright/test'
import {
  loginAs,
  ADMIN_CREDENTIALS,
  MANUAL_VIEWER,
  MANUAL_SUBSCRIBER,
  MANUAL_EDITOR,
  MANUAL_OUTSIDER,
} from '../fixtures/auth'
import { ApiHelper } from '../fixtures/api'
import { shot, shotFull, waitReady } from '../fixtures/shot'

const PREFIX = '[PERM-DEMO]'
const CHAPTER = 'permission-roles'

let admin: ApiHelper
let viewer: ApiHelper
let subscriber: ApiHelper
let editor: ApiHelper

let groupId: number
let projectId: number
let docId: number

let viewerUserId: number
let subscriberUserId: number
let editorUserId: number

test.beforeAll(async () => {
  admin = await ApiHelper.create(ADMIN_CREDENTIALS)
  viewer = await ApiHelper.create(MANUAL_VIEWER)
  subscriber = await ApiHelper.create(MANUAL_SUBSCRIBER)
  editor = await ApiHelper.create(MANUAL_EDITOR)
  await ApiHelper.create(MANUAL_OUTSIDER).then((a) => a.dispose()) // 確認帳號可登入

  viewerUserId = (await viewer.whoami())?.id
  subscriberUserId = (await subscriber.whoami())?.id
  editorUserId = (await editor.whoami())?.id

  // Admin 建立 group + project + 一份示範文件
  const grp = await admin.createGroup({ name: `${PREFIX} 權限示範群組` })
  groupId = grp.id

  const proj = await admin.createProject({
    name: `${PREFIX} 權限示範專案`,
    description: '展示 Viewer / Subscriber / Editor 三層權限',
    groupId,
  })
  projectId = proj.id

  await admin.setProjectPermissions(projectId, {
    viewerIds: [viewerUserId],
    subscriberIds: [subscriberUserId],
    editorIds: [editorUserId],
  })

  const doc = await admin.createDocument({
    title: `${PREFIX} 權限示範文件`,
    content: '# 權限示範\n\n這是給 Viewer / Subscriber / Editor 三種角色看的範例文件。',
    projectId,
  })
  docId = doc.id

  // 觸發一次更新，產生通知
  await admin.updateDocument(docId, {
    content: '# 權限示範\n\n這是給 Viewer / Subscriber / Editor 三種角色看的範例文件。\n\n（已更新一次）',
  })
})

test.afterAll(async () => {
  if (admin) {
    await admin.cleanupByTitlePrefix(PREFIX).catch(() => {})
    if (projectId) await admin.deleteProject(projectId).catch(() => {})
    if (groupId) await admin.deleteGroup(groupId).catch(() => {})
  }
  await admin?.dispose()
  await viewer?.dispose()
  await subscriber?.dispose()
  await editor?.dispose()
})

// ── 01 + 02：Admin 打開權限 Modal，截 Hint Table ─────────────────────────────
test('01-02: Admin 權限設定 Modal 與 Hint Table', async ({ page }) => {
  test.setTimeout(120000)
  await page.setViewportSize({ width: 1440, height: 900 })
  await loginAs(page, ADMIN_CREDENTIALS)
  await page.goto('/admin/doc-hub', { timeout: 60000 })
  await waitReady(page, 1500)

  // 1. 先展開示範群組（sidebar 會顯示 [PERM-DEMO] 權限示範群組）
  const groupNode = page.getByText(`${PREFIX} 權限示範群組`).first()
  if (await groupNode.isVisible().catch(() => false)) {
    await groupNode.click()
    await page.waitForTimeout(800)
  }

  // 2. 點開示範專案
  const projNode = page.getByText(`${PREFIX} 權限示範專案`).first()
  if (await projNode.isVisible().catch(() => false)) {
    await projNode.click()
    await waitReady(page, 1200)
  }

  // 3. 點「🔐 專案權限設定」按鈕
  const permBtn = page
    .locator('button')
    .filter({ hasText: /權限|🔐/ })
    .first()
  if (await permBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await permBtn.click()
    await page.waitForSelector('.ant-modal-content', { timeout: 8000 }).catch(() => {})
    await page.waitForTimeout(1200)

    // 01：完整 Modal
    await shot(page, CHAPTER, '01_perm_modal_full')

    // 02：Hint Table 特寫（取 .ant-alert 區域）
    const alert = page.locator('.ant-modal .ant-alert').first()
    if (await alert.isVisible({ timeout: 2000 }).catch(() => false)) {
      const box = await alert.boundingBox()
      if (box) {
        await page.screenshot({
          path: `artifacts/manual-shots/${CHAPTER}/02_perm_hint_zoom.png`,
          clip: {
            x: Math.max(0, box.x - 8),
            y: Math.max(0, box.y - 8),
            width: Math.min(1440, box.width + 16),
            height: Math.min(900, box.height + 16),
          },
        })
        console.log(`  📸 ${CHAPTER}/02_perm_hint_zoom.png`)
      }
    }

    await page.keyboard.press('Escape').catch(() => {})
    await page.waitForTimeout(500)
  }
})

// ── 03-04：Admin 視角 ────────────────────────────────────────────────────────
test('03-04: Admin 視角', async ({ page }) => {
  test.setTimeout(120000)
  await page.setViewportSize({ width: 1440, height: 900 })
  await loginAs(page, ADMIN_CREDENTIALS)
  await page.goto('/admin/doc-hub', { timeout: 60000 })
  await waitReady(page, 1500)

  await shot(page, CHAPTER, '03_role_admin_sidebar')

  // 進入示範文件
  await page.goto(`/admin/doc-hub/view/${docId}`, { timeout: 60000 })
  await page.waitForSelector('h1, h2, button', { timeout: 20000 }).catch(() => {})
  await waitReady(page, 1500)
  await shot(page, CHAPTER, '04_role_admin_edit_btn')
})

// ── 05-06：Editor 視角 ───────────────────────────────────────────────────────
test('05-06: Editor 視角', async ({ page }) => {
  test.setTimeout(120000)
  await page.setViewportSize({ width: 1440, height: 900 })
  await loginAs(page, MANUAL_EDITOR)
  await page.goto('/admin/doc-hub', { timeout: 60000 })
  await waitReady(page, 1500)
  await shot(page, CHAPTER, '05_role_editor_sidebar')

  await page.goto(`/admin/doc-hub/view/${docId}`, { timeout: 60000 })
  await page.waitForSelector('h1, h2, button', { timeout: 20000 }).catch(() => {})
  await waitReady(page, 1500)
  await shot(page, CHAPTER, '06_role_editor_edit_btn')
})

// ── 07-08：Subscriber 視角 ───────────────────────────────────────────────────
test('07-08: Subscriber 視角', async ({ page }) => {
  test.setTimeout(120000)
  await page.setViewportSize({ width: 1440, height: 900 })
  await loginAs(page, MANUAL_SUBSCRIBER)
  await page.goto('/admin/doc-hub', { timeout: 60000 })
  await waitReady(page, 1500)
  await shot(page, CHAPTER, '07_role_subscriber_sidebar')

  await page.goto(`/admin/doc-hub/view/${docId}`, { timeout: 60000 })
  await page.waitForSelector('h1, h2, button', { timeout: 20000 }).catch(() => {})
  await waitReady(page, 1500)
  await shot(page, CHAPTER, '08_role_subscriber_no_edit')
})

// ── 09-10：Viewer 視角 ───────────────────────────────────────────────────────
test('09-10: Viewer 視角', async ({ page }) => {
  test.setTimeout(120000)
  await page.setViewportSize({ width: 1440, height: 900 })
  await loginAs(page, MANUAL_VIEWER)
  await page.goto('/admin/doc-hub', { timeout: 60000 })
  await waitReady(page, 1500)
  await shot(page, CHAPTER, '09_role_viewer_sidebar')

  await page.goto(`/admin/doc-hub/view/${docId}`, { timeout: 60000 })
  await page.waitForSelector('h1, h2, button', { timeout: 20000 }).catch(() => {})
  await waitReady(page, 1500)
  await shot(page, CHAPTER, '10_role_viewer_no_edit')
})

// ── 11：Outsider 視角（看不到專案） ─────────────────────────────────────────
test('11: Outsider 視角', async ({ page }) => {
  test.setTimeout(120000)
  await page.setViewportSize({ width: 1440, height: 900 })
  await loginAs(page, MANUAL_OUTSIDER)
  await page.goto('/admin/doc-hub', { timeout: 60000 })
  await waitReady(page, 1500)
  await shot(page, CHAPTER, '11_role_outsider_no_project')
})

// ── 12: 四種角色的通知收件匣對照組 ───────────────────────────────────────────
// 12a Editor / 12b Subscriber / 12c Admin（含本人改的也收到）/ 12d Viewer（沒收到）
//
// 在開始截圖前，admin 先改一次文件 → 觸發通知
async function openBellAndShot(page: any, name: string) {
  const bell = page
    .locator('button[aria-label*="notification"], .ant-badge .anticon-bell, [class*="notification"] button')
    .first()
  if (await bell.isVisible({ timeout: 3000 }).catch(() => false)) {
    await bell.click().catch(() => {})
    await page.waitForTimeout(1200)
  }
  await shot(page, CHAPTER, name)
  // 關掉鈴鐺面板，避免影響下一個 test（雖然 page 是新的）
  await page.keyboard.press('Escape').catch(() => {})
}

test('12a: Editor 通知收件匣', async ({ page }) => {
  test.setTimeout(120000)
  // 觸發一次新更新
  await admin.updateDocument(docId, {
    content:
      '# 權限示範\n\n這是給 Viewer / Subscriber / Editor 三種角色看的範例文件。\n\n（再次更新，請收信）',
  })
  await new Promise((r) => setTimeout(r, 1500))

  await page.setViewportSize({ width: 1440, height: 900 })
  await loginAs(page, MANUAL_EDITOR)
  await page.goto('/admin/doc-hub', { timeout: 60000 })
  await waitReady(page, 1500)
  await openBellAndShot(page, '12a_editor_inbox')
})

test('12b: Subscriber 通知收件匣', async ({ page }) => {
  test.setTimeout(120000)
  await page.setViewportSize({ width: 1440, height: 900 })
  await loginAs(page, MANUAL_SUBSCRIBER)
  await page.goto('/admin/doc-hub', { timeout: 60000 })
  await waitReady(page, 1500)
  await openBellAndShot(page, '12b_subscriber_inbox')
})

test('12c: Admin 通知收件匣（自己改的也收到）', async ({ page }) => {
  test.setTimeout(120000)
  await page.setViewportSize({ width: 1440, height: 900 })
  await loginAs(page, ADMIN_CREDENTIALS)
  await page.goto('/admin/doc-hub', { timeout: 60000 })
  await waitReady(page, 1500)
  await openBellAndShot(page, '12c_admin_inbox')
})

test('12d: Viewer 通知收件匣（對照組：沒收到）', async ({ page }) => {
  test.setTimeout(120000)
  await page.setViewportSize({ width: 1440, height: 900 })
  await loginAs(page, MANUAL_VIEWER)
  await page.goto('/admin/doc-hub', { timeout: 60000 })
  await waitReady(page, 1500)
  await openBellAndShot(page, '12d_viewer_inbox_empty')
})
