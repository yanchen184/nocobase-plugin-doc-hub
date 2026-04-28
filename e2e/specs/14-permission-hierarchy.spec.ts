/**
 * 驗證權限階層實作 — Viewer ⊂ Subscriber ⊂ Editor
 *
 * 驗證重點：
 * 1. 建立專案的 admin 自動成為 editor + subscriber（且本人改也收通知）
 * 2. Viewer 能看到專案，但不能編輯（403）、不收通知
 * 3. Subscriber 能看到、能收通知，但不能編輯（403）
 * 4. Editor 能看到、能收通知、能編輯
 * 5. 局外人完全看不到、編輯回 403
 * 6. 即便是本人改的，也會收到通知（self-notify）
 */

import { test, expect } from '@playwright/test'
import { ApiHelper } from '../fixtures/api'
import {
  ADMIN_CREDENTIALS,
  MANUAL_VIEWER,
  MANUAL_SUBSCRIBER,
  MANUAL_EDITOR,
  MANUAL_OUTSIDER,
} from '../fixtures/auth'

const PREFIX = '[PERM-HIER]'

let admin: ApiHelper
let viewer: ApiHelper
let subscriber: ApiHelper
let editor: ApiHelper
let outsider: ApiHelper

let groupId: number
let projectId: number
let docId: number

let adminUserId: number
let viewerUserId: number
let subscriberUserId: number
let editorUserId: number
let outsiderUserId: number

test.beforeAll(async () => {
  admin = await ApiHelper.create(ADMIN_CREDENTIALS)
  viewer = await ApiHelper.create(MANUAL_VIEWER)
  subscriber = await ApiHelper.create(MANUAL_SUBSCRIBER)
  editor = await ApiHelper.create(MANUAL_EDITOR)
  outsider = await ApiHelper.create(MANUAL_OUTSIDER)

  // 取各個角色的 userId
  adminUserId = (await admin.whoami())?.id
  viewerUserId = (await viewer.whoami())?.id
  subscriberUserId = (await subscriber.whoami())?.id
  editorUserId = (await editor.whoami())?.id
  outsiderUserId = (await outsider.whoami())?.id

  console.log(`[${PREFIX}] users:`, {
    admin: adminUserId,
    viewer: viewerUserId,
    subscriber: subscriberUserId,
    editor: editorUserId,
    outsider: outsiderUserId,
  })

  // Admin 建 group + project
  const grp = await admin.createGroup({ name: `${PREFIX} 階層驗證群組-${Date.now()}` })
  groupId = grp.id

  const proj = await admin.createProject({
    name: `${PREFIX} 階層驗證專案-${Date.now()}`,
    groupId,
  })
  projectId = proj.id
  console.log(`[${PREFIX}] created project ${projectId}`)

  // Admin 設定權限：viewer / subscriber / editor 各加一個
  await admin.setProjectPermissions(projectId, {
    viewerIds: [viewerUserId],
    subscriberIds: [subscriberUserId],
    editorIds: [editorUserId],
  })

  // Admin 建一份文件
  const doc = await admin.createDocument({
    title: `${PREFIX} 驗證文件`,
    content: '初始內容',
    projectId,
  })
  docId = doc.id
  console.log(`[${PREFIX}] created doc ${docId}`)
})

test.afterAll(async () => {
  if (admin && projectId) {
    await admin.cleanupByTitlePrefix(PREFIX).catch(() => {})
    await admin.deleteProject(projectId).catch(() => {})
  }
  if (admin && groupId) {
    await admin.deleteGroup(groupId).catch(() => {})
  }
  await admin?.dispose()
  await viewer?.dispose()
  await subscriber?.dispose()
  await editor?.dispose()
  await outsider?.dispose()
})

test('1. Admin 建立的專案，自己自動成為 editor + subscriber', async () => {
  // 透過 docProjects:get 抓 appends（admin 用）
  const res = await admin.raw.get(`/api/docProjects:get?filterByTk=${projectId}&appends=editors,subscribers,viewers`)
  expect(res.ok()).toBeTruthy()
  const body = await res.json()
  const proj = body.data

  const editorIds = (proj.editors || []).map((u: any) => u.id)
  const subscriberIds = (proj.subscribers || []).map((u: any) => u.id)

  console.log(`[${PREFIX}] project editors:`, editorIds, 'subscribers:', subscriberIds)
  expect(editorIds).toContain(adminUserId)
  expect(subscriberIds).toContain(adminUserId)
})

test('2. Viewer 看得到專案，但編輯文件回 403', async () => {
  const projects = await viewer.listProjects()
  const visible = projects.find((p: any) => p.id === projectId)
  expect(visible).toBeTruthy()

  const res = await viewer.raw.post(`/api/docDocuments:update?filterByTk=${docId}`, {
    data: { content: 'viewer 試圖修改', skipConflictCheck: true },
  })
  expect(res.status()).toBe(403)
})

test('3. Subscriber 看得到專案，但編輯文件回 403', async () => {
  const projects = await subscriber.listProjects()
  const visible = projects.find((p: any) => p.id === projectId)
  expect(visible).toBeTruthy()

  const res = await subscriber.raw.post(`/api/docDocuments:update?filterByTk=${docId}`, {
    data: { content: 'subscriber 試圖修改', skipConflictCheck: true },
  })
  expect(res.status()).toBe(403)
})

test('4. Editor 看得到專案，且編輯文件成功', async () => {
  const projects = await editor.listProjects()
  const visible = projects.find((p: any) => p.id === projectId)
  expect(visible).toBeTruthy()

  const res = await editor.raw.post(`/api/docDocuments:update?filterByTk=${docId}`, {
    data: { content: '由 editor 修改 ' + Date.now(), skipConflictCheck: true },
  })
  expect(res.ok()).toBeTruthy()
})

test('5. Outsider 完全看不到專案', async () => {
  const projects = await outsider.listProjects()
  const visible = projects.find((p: any) => p.id === projectId)
  expect(visible).toBeFalsy()

  const res = await outsider.raw.post(`/api/docDocuments:update?filterByTk=${docId}`, {
    data: { content: 'outsider 試圖修改', skipConflictCheck: true },
  })
  expect(res.status()).toBe(403)
})

test('6. Editor 改文件後，subscriber + editor + admin（含本人）都收到通知', async () => {
  // editor 再做一次更新，以便確認通知
  const stamp = Date.now()
  await editor.updateDocument(docId, { content: `editor 更新內容 ${stamp}` })

  // 等 hook 觸發
  await new Promise((r) => setTimeout(r, 1500))

  const adminNotifs = await admin.listNotifications({ pageSize: 20 })
  const subNotifs = await subscriber.listNotifications({ pageSize: 20 })
  const edNotifs = await editor.listNotifications({ pageSize: 20 })
  const viewerNotifs = await viewer.listNotifications({ pageSize: 20 })

  console.log(`[${PREFIX}] notifications count:`, {
    admin: adminNotifs.length,
    subscriber: subNotifs.length,
    editor: edNotifs.length,
    viewer: viewerNotifs.length,
  })

  const matchOurDoc = (n: any) =>
    n?.docId === docId ||
    n?.title?.includes(`${PREFIX}`) ||
    n?.content?.includes(`${PREFIX}`) ||
    JSON.stringify(n).includes(String(docId))

  const adminGot = adminNotifs.some(matchOurDoc)
  const subGot = subNotifs.some(matchOurDoc)
  const edGot = edNotifs.some(matchOurDoc)
  const viewerGot = viewerNotifs.some(matchOurDoc)

  console.log(`[${PREFIX}] match results:`, { adminGot, subGot, edGot, viewerGot })

  // Admin 是專案 editor + subscriber → 應收到
  expect(adminGot).toBeTruthy()
  // Subscriber 應收到
  expect(subGot).toBeTruthy()
  // Editor（本人）應收到（self-notify）
  expect(edGot).toBeTruthy()
  // Viewer 不應收到（只有讀取權，沒訂閱）
  expect(viewerGot).toBeFalsy()
})
