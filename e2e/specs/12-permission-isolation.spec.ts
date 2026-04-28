/**
 * DocHub 多帳號權限隔離測試
 *
 * 驗證：
 *  1. admin 建立專案，設定只有 memberA 是 viewer
 *  2. memberA 可以看到該文件
 *  3. memberB（未被加入）看不到該文件
 *
 * 需要系統中存在兩個測試帳號：
 *  - member@test.com  / member123   (MEMBER_CREDENTIALS)
 *  - memberb@test.com / memberb123  (MEMBER_B_CREDENTIALS)
 *
 * 若帳號不存在，beforeAll 會用 admin token 建立並在 afterAll 清除。
 */

import { test, expect } from '@playwright/test'
import { ADMIN_CREDENTIALS, MEMBER_CREDENTIALS, MEMBER_B_CREDENTIALS } from '../fixtures/auth'
import { ApiHelper, CleanupStack } from '../fixtures/api'

const PREFIX = '[E2E-PERM-ISO]'

test.describe('DocHub 專案層級權限隔離', () => {
  let adminApi: ApiHelper
  let memberAApi: ApiHelper
  let memberBApi: ApiHelper
  const cleanup = new CleanupStack()

  let memberAId: number
  let memberBId: number
  let projectId: number
  let docId: number

  test.beforeAll(async () => {
    adminApi = await ApiHelper.create(ADMIN_CREDENTIALS)

    // 確保測試帳號存在（不存在就建立）
    // 測試帳號是固定 fixture，不在 cleanup 中刪除（持久存在）
    let memberA = await adminApi.getUserByEmail(MEMBER_CREDENTIALS.account)
    if (!memberA) {
      memberA = await adminApi.createUser({
        email: MEMBER_CREDENTIALS.account,
        nickname: 'Member A',
        password: MEMBER_CREDENTIALS.password,
      })
    }
    if (!memberA) throw new Error(`無法取得或建立測試帳號 ${MEMBER_CREDENTIALS.account}`)
    memberAId = memberA.id

    let memberB = await adminApi.getUserByEmail(MEMBER_B_CREDENTIALS.account)
    if (!memberB) {
      memberB = await adminApi.createUser({
        email: MEMBER_B_CREDENTIALS.account,
        nickname: 'Member B',
        password: MEMBER_B_CREDENTIALS.password,
      })
    }
    if (!memberB) throw new Error(`無法取得或建立測試帳號 ${MEMBER_B_CREDENTIALS.account}`)
    memberBId = memberB.id

    // 建立一個有權限限制的專案（server 強制 groupId 必填）
    const groups = await adminApi.listGroups()
    const grp = groups.find((g: any) => g.name === '專案') || groups[0]
    const proj = await adminApi.createProject({ name: `${PREFIX} 私有專案`, groupId: grp.id })
    projectId = proj.id
    cleanup.push(() => adminApi.deleteProject(projectId))

    // 設定專案權限：只有 memberA 是 viewer（memberB 不在清單內）
    // 必須在建立文件前設定，確保文件所屬專案有正確的 viewer 清單
    await adminApi.setProjectPermissions(projectId, {
      viewerIds: [memberAId],
      editorIds: [],
      subscriberIds: [],
    })

    // 建立文件，明確指定 projectId，讓權限過濾生效
    const doc = await adminApi.createDocument({
      title: `${PREFIX} 限制存取文件`,
      content: '# 只有 memberA 可以看到這份文件',
      status: 'published',
      projectId,
    })
    docId = doc.id
    cleanup.push(() => adminApi.deleteDocument(docId))

    // 建立 memberA / memberB 的 API helper
    memberAApi = await ApiHelper.create(MEMBER_CREDENTIALS)
    memberBApi = await ApiHelper.create(MEMBER_B_CREDENTIALS)
  })

  test.afterAll(async () => {
    await cleanup.flush()
    if (memberAApi) await memberAApi.dispose()
    if (memberBApi) await memberBApi.dispose()
    if (adminApi) {
      await adminApi.cleanupByTitlePrefix(PREFIX)
      await adminApi.dispose()
    }
  })

  test('memberA（有 viewer 權限）可以看到受限文件', async () => {
    const docs = await memberAApi.listDocuments()
    const found = docs.find((d: any) => d.id === docId || d.title?.includes(PREFIX))
    expect(found).toBeDefined()
  })

  test('memberB（無任何權限）看不到受限文件', async () => {
    const docs = await memberBApi.listDocuments()
    const found = docs.find((d: any) => d.id === docId || d.title?.includes(PREFIX))
    expect(found).toBeUndefined()
  })

  test('admin 可以看到所有文件（不受權限隔離影響）', async () => {
    const docs = await adminApi.listDocuments()
    const found = docs.find((d: any) => d.id === docId)
    expect(found).toBeDefined()
  })

  test('memberB 直接用 ID 存取文件應被拒絕（403 或空 data）', async () => {
    // 嘗試直接 GET /api/docDocuments/{id}
    const res = await (memberBApi as any).ctx.get(`/api/docDocuments/${docId}`)
    const body = await res.json()
    // 應該是 403 或 data 為 null
    const isBlocked = !res.ok() || body?.data === null || body?.data === undefined
    expect(isBlocked).toBe(true)
  })
})
