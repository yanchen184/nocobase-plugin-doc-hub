import { test, expect, request } from '@playwright/test'
import { getToken, ADMIN_CREDENTIALS } from '../fixtures/auth'
import { ApiHelper, CleanupStack } from '../fixtures/api'

const BASE_URL = process.env.BASE_URL || 'http://localhost:13000'
const PREFIX = '[E2E-GIT]'

// ── 測試用 Repo 設定 ────────────────────────────────────────────────────────
// GitHub: yanchen184/nocobase-plugin-doc-hub（public repo）
const GITHUB_REPO = 'https://github.com/yanchen184/nocobase-plugin-doc-hub'
const GITHUB_FILE = 'MANUAL.md'
const GITHUB_BRANCH = 'main'
const GITHUB_KNOWN_SHA = '7624fb240968171d67b048d08d989dc9f27498a3'

// GitLab: 內部 10.1.2.191（wez-spring-boot-starters）
const GITLAB_REPO = 'https://10.1.2.191/wezoomtek/wez-spring-boot-starters.git'
const GITLAB_FILE = 'README.md'
const GITLAB_BRANCH = 'master'

test.describe('DocHub Git 同步（端點存在）', () => {
  let api: ApiHelper
  const cleanup = new CleanupStack()

  test.beforeAll(async () => {
    api = await ApiHelper.create()
  })

  test.afterAll(async () => {
    await cleanup.flush()
    await api.cleanupByTitlePrefix(PREFIX)
    await api.dispose()
  })

  test('沒有 githubRepo 的文件執行 pullFromGit 應回傳 400 + 業務錯誤訊息', async () => {
    const doc = await api.createDocument({
      title: `${PREFIX} 無 Repo 測試 ${Date.now()}`,
    })
    cleanup.push(() => api.deleteDocument(doc.id))

    const token = await getToken(ADMIN_CREDENTIALS)
    const ctx = await request.newContext({
      baseURL: BASE_URL,
      extraHTTPHeaders: { Authorization: `Bearer ${token}` },
    })
    const res = await ctx.post('/api/docDocuments:pullFromGit', {
      data: { filterByTk: doc.id },
    })
    const body = await res.json()

    expect(res.status()).toBe(400)
    expect(body.errors[0].message).toContain('未綁定')
    await ctx.dispose()
  })

  test('pullFromGit / webhookReceive / fetchFromGit 端點都存在（不是 404）', async () => {
    const ctx = await request.newContext({ baseURL: BASE_URL })
    const endpoints = [
      { url: '/api/docDocuments:pullFromGit', data: {} },
      { url: '/api/docDocuments:webhookReceive', data: { test: true } },
      { url: '/api/docDocuments:fetchFromGit', data: { filterByTk: 99999 } },
    ]
    for (const ep of endpoints) {
      const res = await ctx.post(ep.url, { data: ep.data })
      expect(res.status(), `${ep.url} 不應回傳 404`).not.toBe(404)
    }
    await ctx.dispose()
  })

  test('有 githubRepo 的文件 GET 時正確存回欄位', async () => {
    const token = await getToken(ADMIN_CREDENTIALS)
    const ctx = await request.newContext({
      baseURL: BASE_URL,
      extraHTTPHeaders: { Authorization: `Bearer ${token}` },
    })
    const res = await ctx.post('/api/docDocuments', {
      data: {
        title: `${PREFIX} Git Repo 欄位測試 ${Date.now()}`,
        status: 'draft',
        githubRepo: GITHUB_REPO,
        githubBranch: GITHUB_BRANCH,
        githubFilePath: GITHUB_FILE,
      },
    })
    expect(res.ok()).toBe(true)
    const body = await res.json()
    const docId = body.data?.id
    cleanup.push(async () => {
      const del = await request.newContext({ baseURL: BASE_URL, extraHTTPHeaders: { Authorization: `Bearer ${await getToken(ADMIN_CREDENTIALS)}` } })
      await del.delete(`/api/docDocuments/${docId}`)
      await del.dispose()
    })

    const getRes = await ctx.get(`/api/docDocuments/${docId}`)
    const getBody = await getRes.json()
    expect(getBody.data.githubRepo).toBe(GITHUB_REPO)
    expect(getBody.data.githubFilePath).toBe(GITHUB_FILE)
    expect(getBody.data.githubBranch).toBe(GITHUB_BRANCH)
    await ctx.dispose()
  })
})

// ── GitHub 真實整合測試 ────────────────────────────────────────────────────
test.describe('DocHub Git 同步（GitHub 真實整合）', () => {
  let api: ApiHelper
  const cleanup = new CleanupStack()

  test.beforeAll(async () => {
    api = await ApiHelper.create()
  })

  test.afterAll(async () => {
    await cleanup.flush()
    await api.cleanupByTitlePrefix(PREFIX)
    await api.dispose()
  })

  test('pullFromGit 成功從 GitHub 拉取內容，並更新 content / gitSha / gitSyncStatus', async () => {
    const token = await getToken(ADMIN_CREDENTIALS)
    const ctx = await request.newContext({
      baseURL: BASE_URL,
      extraHTTPHeaders: { Authorization: `Bearer ${token}` },
    })

    // 建立時直接帶 githubRepo（create handler 支援寫入這些欄位）
    const createRes = await ctx.post('/api/docDocuments', {
      data: {
        title: `${PREFIX} GitHub Pull 整合測試 ${Date.now()}`,
        content: '# 尚未同步',
        status: 'draft',
        githubRepo: GITHUB_REPO,
        githubFilePath: GITHUB_FILE,
        githubBranch: GITHUB_BRANCH,
      },
    })
    const doc = (await createRes.json()).data
    cleanup.push(() => api.deleteDocument(doc.id))

    // filterByTk 用 query string（NocoBase action params 從 query 取）
    const pullRes = await ctx.post(`/api/docDocuments:pullFromGit?filterByTk=${doc.id}`)

    expect(pullRes.status()).toBe(200)

    const pullBody = await pullRes.json()
    const updated = pullBody.data

    // 1. content 不再是初始值
    expect(updated.content).not.toBe('# 尚未同步')
    expect(updated.content.length).toBeGreaterThan(10)

    // 2. gitSha 應被更新為 GitHub 上的真實 SHA
    expect(updated.gitSha).toBeTruthy()
    expect(updated.gitSha).toBe(GITHUB_KNOWN_SHA)

    // 3. gitSyncStatus 應是 'synced'
    expect(updated.gitSyncStatus).toBe('synced')

    // 4. gitSyncedAt 應有值
    expect(updated.gitSyncedAt).toBeTruthy()

    await ctx.dispose()
  })

  test('pullFromGit 拉到錯誤路徑應回傳 404 + 錯誤訊息', async () => {
    const token = await getToken(ADMIN_CREDENTIALS)
    const ctx = await request.newContext({
      baseURL: BASE_URL,
      extraHTTPHeaders: { Authorization: `Bearer ${token}` },
    })

    const createRes = await ctx.post('/api/docDocuments', {
      data: {
        title: `${PREFIX} 錯誤路徑測試 ${Date.now()}`,
        status: 'draft',
        githubRepo: GITHUB_REPO,
        githubFilePath: 'this-file-does-not-exist-xyz.md',
        githubBranch: GITHUB_BRANCH,
      },
    })
    const doc = (await createRes.json()).data
    cleanup.push(() => api.deleteDocument(doc.id))

    const pullRes = await ctx.post(`/api/docDocuments:pullFromGit?filterByTk=${doc.id}`)

    expect(pullRes.status()).toBe(404)
    const body = await pullRes.json()
    expect(body.errors).toBeDefined()

    await ctx.dispose()
  })

  test('連續兩次 pullFromGit，第二次 gitSha 與第一次相同（內容未變）', async () => {
    const token = await getToken(ADMIN_CREDENTIALS)
    const ctx = await request.newContext({
      baseURL: BASE_URL,
      extraHTTPHeaders: { Authorization: `Bearer ${token}` },
    })

    const createRes = await ctx.post('/api/docDocuments', {
      data: {
        title: `${PREFIX} SHA 穩定性測試 ${Date.now()}`,
        status: 'draft',
        githubRepo: GITHUB_REPO,
        githubFilePath: GITHUB_FILE,
        githubBranch: GITHUB_BRANCH,
      },
    })
    const doc = (await createRes.json()).data
    cleanup.push(() => api.deleteDocument(doc.id))

    const pull1 = await ctx.post(`/api/docDocuments:pullFromGit?filterByTk=${doc.id}`)
    const body1 = await pull1.json()
    const sha1 = body1.data?.gitSha

    const pull2 = await ctx.post(`/api/docDocuments:pullFromGit?filterByTk=${doc.id}`)
    const body2 = await pull2.json()
    const sha2 = body2.data?.gitSha

    // 同一個檔案，SHA 應相同
    expect(sha1).toBeTruthy()
    expect(sha1).toBe(sha2)

    await ctx.dispose()
  })
})

// ── GitLab 真實整合測試 ───────────────────────────────────────────────────
test.describe('DocHub Git 同步（GitLab 真實整合）', () => {
  let api: ApiHelper
  const cleanup = new CleanupStack()

  test.beforeAll(async () => {
    api = await ApiHelper.create()
  })

  test.afterAll(async () => {
    await cleanup.flush()
    await api.cleanupByTitlePrefix(PREFIX)
    await api.dispose()
  })

  test('pullFromGit 成功從 GitLab 拉取內容', async () => {
    const token = await getToken(ADMIN_CREDENTIALS)
    const ctx = await request.newContext({
      baseURL: BASE_URL,
      extraHTTPHeaders: { Authorization: `Bearer ${token}` },
    })

    const createRes = await ctx.post('/api/docDocuments', {
      data: {
        title: `${PREFIX} GitLab Pull 整合測試 ${Date.now()}`,
        content: '# 尚未同步',
        status: 'draft',
        githubRepo: GITLAB_REPO,
        githubFilePath: GITLAB_FILE,
        githubBranch: GITLAB_BRANCH,
      },
    })
    const doc = (await createRes.json()).data
    cleanup.push(() => api.deleteDocument(doc.id))

    const pullRes = await ctx.post(`/api/docDocuments:pullFromGit?filterByTk=${doc.id}`)

    expect(pullRes.status()).toBe(200)
    const body = await pullRes.json()
    const updated = body.data

    expect(updated.content).not.toBe('# 尚未同步')
    expect(updated.content.length).toBeGreaterThan(10)
    expect(updated.gitSha).toBeTruthy()
    expect(updated.gitSyncStatus).toBe('synced')

    await ctx.dispose()
  })

  test('GitLab 錯誤路徑應回傳 404', async () => {
    const token = await getToken(ADMIN_CREDENTIALS)
    const ctx = await request.newContext({
      baseURL: BASE_URL,
      extraHTTPHeaders: { Authorization: `Bearer ${token}` },
    })

    const createRes = await ctx.post('/api/docDocuments', {
      data: {
        title: `${PREFIX} GitLab 錯誤路徑 ${Date.now()}`,
        status: 'draft',
        githubRepo: GITLAB_REPO,
        githubFilePath: 'nonexistent-file-xyz.md',
        githubBranch: GITLAB_BRANCH,
      },
    })
    const doc = (await createRes.json()).data
    cleanup.push(() => api.deleteDocument(doc.id))

    const pullRes = await ctx.post(`/api/docDocuments:pullFromGit?filterByTk=${doc.id}`)

    expect(pullRes.status()).toBe(404)
    await ctx.dispose()
  })
})
