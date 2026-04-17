/**
 * DocHub 站內信通知測試
 *
 * 驗證：
 *  1. memberA 訂閱文件
 *  2. admin 更新文件
 *  3. memberA 的 notificationInAppMessages 出現一筆 unread 通知
 *  4. 通知標題包含文件名稱
 *  5. 編輯者自己更新文件時，不會收到自己的通知
 *
 * 需要系統中存在 member@test.com 帳號（若不存在 beforeAll 自動建立）。
 */

import { test, expect } from '@playwright/test'
import { ADMIN_CREDENTIALS, MEMBER_CREDENTIALS } from '../fixtures/auth'
import { ApiHelper, CleanupStack } from '../fixtures/api'

const PREFIX = '[E2E-NOTIF]'
const DOC_TITLE = `${PREFIX} 訂閱通知測試文件`

test.describe('DocHub 訂閱者站內信通知', () => {
  let adminApi: ApiHelper
  let memberApi: ApiHelper
  const cleanup = new CleanupStack()

  let memberId: number
  let docId: number

  test.beforeAll(async () => {
    adminApi = await ApiHelper.create(ADMIN_CREDENTIALS)

    // 確保 member 帳號存在
    // 測試帳號是固定 fixture，不在 cleanup 中刪除
    let member = await adminApi.getUserByEmail(MEMBER_CREDENTIALS.account)
    if (!member) {
      member = await adminApi.createUser({
        email: MEMBER_CREDENTIALS.account,
        nickname: 'Member A',
        password: MEMBER_CREDENTIALS.password,
      })
    }
    if (!member) throw new Error(`無法取得或建立測試帳號 ${MEMBER_CREDENTIALS.account}`)
    memberId = member.id

    // 建立測試文件（admin）
    const doc = await adminApi.createDocument({
      title: DOC_TITLE,
      content: '# 初版內容\n\n這是通知測試用的文件。',
      status: 'published',
    })
    docId = doc.id
    cleanup.push(() => adminApi.deleteDocument(docId))

    // 讓 memberA 訂閱這份文件
    await adminApi.setDocumentSubscribers(docId, [memberId])

    // 建立 member 的 API helper
    memberApi = await ApiHelper.create(MEMBER_CREDENTIALS)
  })

  test.afterAll(async () => {
    await cleanup.flush()
    if (memberApi) await memberApi.dispose()
    if (adminApi) {
      await adminApi.cleanupByTitlePrefix(PREFIX)
      await adminApi.dispose()
    }
  })

  test('admin 更新文件後，訂閱者 memberA 收到未讀通知', async () => {
    // 記錄更新前的通知數量
    const before = await memberApi.listNotifications()
    const beforeCount = before.filter((n: any) => n.status === 'unread').length

    // admin 更新文件內容
    await (adminApi as any).ctx.post(`/api/docDocuments:update?filterByTk=${docId}`, {
      data: {
        content: '# 更新後內容（v2）\n\n此次更新由 E2E 測試觸發，驗證訂閱者通知機制。',
        changeSummary: 'E2E 測試：驗證通知',
      },
    })

    // 等待非同步通知寫入（最多 5 秒）
    let notifications: any[] = []
    for (let i = 0; i < 10; i++) {
      await new Promise(r => setTimeout(r, 500))
      notifications = await memberApi.listNotifications()
      const newUnread = notifications.filter((n: any) => n.status === 'unread')
      if (newUnread.length > beforeCount) break
    }

    const unread = notifications.filter((n: any) => n.status === 'unread')
    expect(unread.length).toBeGreaterThan(beforeCount)
  })

  test('通知內容包含文件標題', async () => {
    const notifications = await memberApi.listNotifications()
    const docNotif = notifications.find(
      (n: any) => n.title?.includes(PREFIX) || n.content?.includes(PREFIX)
    )
    expect(docNotif).toBeDefined()
    expect(docNotif.title).toContain('文件更新')
  })

  test('admin 更新自己的文件時，不會收到通知（排除自己）', async () => {
    const adminNotifications = await adminApi.listNotifications()
    const selfNotif = adminNotifications.find(
      (n: any) => (n.title?.includes(PREFIX) || n.content?.includes(PREFIX))
    )
    // admin 不應收到自己更新的通知
    expect(selfNotif).toBeUndefined()
  })

  test('未訂閱的用戶不會收到通知', async () => {
    // 用新的 ApiHelper（模擬未訂閱帳號）— 這裡用 admin 當「非訂閱者」
    // admin 已在上一個 test 確認不在通知列表中，此測試算備用驗證
    const adminNotifications = await adminApi.listNotifications()
    const count = adminNotifications.filter(
      (n: any) => n.title?.includes(PREFIX)
    ).length
    expect(count).toBe(0)
  })
})
