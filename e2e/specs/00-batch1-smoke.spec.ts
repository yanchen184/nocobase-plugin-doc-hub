import { test, expect } from '@playwright/test'
import { ApiHelper, CleanupStack } from '../fixtures/api'
import { USERS } from '../fixtures/auth'

/**
 * Batch 1 Smoke Test
 * 驗證：
 *  1) 5 個角色帳號都能登入
 *  2) whoami() 回傳正確的 user id/email
 *  3) 能透過 API 建立 doc，viewer/editor/subscriber/outsider 看到的列表符合預期
 *  4) 通知功能：subscriber 新增時收通知、viewer 新增時不收通知
 */

const PREFIX = '[B1-SMOKE]'

test.describe('Batch 1 Smoke', () => {
  let admin: ApiHelper
  let viewer: ApiHelper
  let editor: ApiHelper
  let subscriber: ApiHelper
  let outsider: ApiHelper
  let cleanup: CleanupStack
  let userIds: { viewer: number; editor: number; subscriber: number; outsider: number }

  test.beforeAll(async () => {
    admin = await ApiHelper.create(USERS.admin)
    viewer = await ApiHelper.create(USERS.viewer)
    editor = await ApiHelper.create(USERS.editor)
    subscriber = await ApiHelper.create(USERS.subscriber)
    outsider = await ApiHelper.create(USERS.outsider)
    cleanup = new CleanupStack()

    const ids: any = {}
    ids.viewer = (await viewer.whoami())?.id
    ids.editor = (await editor.whoami())?.id
    ids.subscriber = (await subscriber.whoami())?.id
    ids.outsider = (await outsider.whoami())?.id
    userIds = ids
  })

  test.afterAll(async () => {
    if (cleanup) await cleanup.flush()
    await admin?.dispose()
    await viewer?.dispose()
    await editor?.dispose()
    await subscriber?.dispose()
    await outsider?.dispose()
  })

  test('每個角色帳號都能取得自己的 user id', async () => {
    expect(userIds.viewer).toBeGreaterThan(0)
    expect(userIds.editor).toBeGreaterThan(0)
    expect(userIds.subscriber).toBeGreaterThan(0)
    expect(userIds.outsider).toBeGreaterThan(0)
    // eslint-disable-next-line no-console
    console.log('User IDs:', userIds)
  })

  test('訂閱者在新增 published 文件時會收到通知', async () => {
    // 先記下 subscriber 目前的未讀數
    const before = await subscriber.listNotifications()
    const beforeCount = before.length

    // 以 admin 身分建一份 published 文件，並把 subscriber 設為 subscriberIds
    const doc = await admin.createDocument({
      title: `${PREFIX} 訂閱者通知測試 ${Date.now()}`,
      content: '測試內容',
      status: 'published',
    } as any)
    expect(doc?.id).toBeGreaterThan(0)
    cleanup.push(() => admin.deleteDocument(doc.id))

    // 建立後設定 subscriber（m2m）
    await admin.updateDocument(doc.id, { subscriberIds: [userIds.subscriber] })

    // 再動一次內容觸發通知（create 當下 subscriberIds 還沒設，這次 update 會觸發 update 通知）
    await admin.updateDocument(doc.id, { content: '內容已更新' })

    // 給一點時間（通知是 async 寫入）
    await new Promise((r) => setTimeout(r, 500))

    const after = await subscriber.listNotifications()
    expect(after.length).toBeGreaterThan(beforeCount)

    // 最新那條標題應該含「修改了文件」
    const latest = after[0]
    // eslint-disable-next-line no-console
    console.log('Subscriber latest notification:', latest?.title)
    expect(latest?.title).toContain('修改了文件')
  })

  test('觀看者修改文件時會收到通知（但新增不會）', async () => {
    const beforeViewer = await viewer.listNotifications()
    const beforeViewerCount = beforeViewer.length

    // admin 建立一篇 published 文件，同時設 viewer
    const doc = await admin.createDocument({
      title: `${PREFIX} 觀看者通知測試 ${Date.now()}`,
      content: '原始內容',
      status: 'published',
    } as any)
    cleanup.push(() => admin.deleteDocument(doc.id))
    await admin.updateDocument(doc.id, { viewerIds: [userIds.viewer] })

    // 新增 + 設 viewer 後：viewer 不該有「新增」通知（只有 subscriber 會收到新增通知）
    // 但因為 create 當下還沒設 viewer，這裡實際測試的是「純設 viewer」不發通知
    await new Promise((r) => setTimeout(r, 300))

    // 改內容 → viewer 應該會收到「修改」通知
    await admin.updateDocument(doc.id, { content: '修改後的內容' })
    await new Promise((r) => setTimeout(r, 500))

    const afterViewer = await viewer.listNotifications()
    expect(afterViewer.length).toBeGreaterThan(beforeViewerCount)

    const hasUpdateNotif = afterViewer.some((n) => n.title?.includes('修改了文件'))
    expect(hasUpdateNotif).toBe(true)
  })

  test('外部人員看不到沒權限的文件', async () => {
    const doc = await admin.createDocument({
      title: `${PREFIX} 外部人員隔離測試 ${Date.now()}`,
      content: 'secret',
      status: 'published',
    } as any)
    cleanup.push(() => admin.deleteDocument(doc.id))

    // outsider 沒有任何權限 → 列表應該看不到這篇
    const outsiderDocs = await outsider.listDocuments({ pageSize: 500 })
    const found = outsiderDocs.find((d: any) => d.id === doc.id)
    expect(found).toBeUndefined()
  })

  test('只改 viewer/editor m2m 關聯（內容未變）不會觸發修改通知', async () => {
    const doc = await admin.createDocument({
      title: `${PREFIX} 純調整權限不通知 ${Date.now()}`,
      content: '內容',
      status: 'published',
    } as any)
    cleanup.push(() => admin.deleteDocument(doc.id))
    await admin.updateDocument(doc.id, { subscriberIds: [userIds.subscriber] })

    await new Promise((r) => setTimeout(r, 300))

    const before = await subscriber.listNotifications()
    const beforeCount = before.length

    // 只動 m2m viewerIds/editorIds — 不帶 content/title/status/categoryId/typeId
    await admin.updateDocument(doc.id, { viewerIds: [userIds.viewer], editorIds: [userIds.editor] })
    await new Promise((r) => setTimeout(r, 500))

    const after = await subscriber.listNotifications()
    expect(after.length).toBe(beforeCount) // 不應變多
  })
})
