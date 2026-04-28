import { APIRequestContext, request } from '@playwright/test'
import { getToken, UserCredentials, ADMIN_CREDENTIALS } from './auth'

const BASE_URL = process.env.BASE_URL || 'http://localhost:13000'

export class ApiHelper {
  private ctx: APIRequestContext
  private token: string
  public accountLabel: string // 供除錯辨識用

  constructor(ctx: APIRequestContext, token: string, accountLabel = 'unknown') {
    this.ctx = ctx
    this.token = token
    this.accountLabel = accountLabel
  }

  static async create(credentials: UserCredentials = ADMIN_CREDENTIALS): Promise<ApiHelper> {
    const token = await getToken(credentials)
    const ctx = await request.newContext({
      baseURL: BASE_URL,
      extraHTTPHeaders: { Authorization: `Bearer ${token}` },
      timeout: 60000,
    })
    return new ApiHelper(ctx, token, credentials.account)
  }

  /** 直接存取底層 APIRequestContext（供特殊 payload 用） */
  get raw(): APIRequestContext {
    return this.ctx
  }

  /** 取得目前登入使用者的資訊（id / email / nickname） */
  async whoami(): Promise<any> {
    const res = await this.ctx.get('/api/auth:check')
    if (!res.ok()) return null
    const body = await res.json()
    return body.data || null
  }

  async dispose(): Promise<void> {
    await this.ctx.dispose()
  }

  // ── Groups ────────────────────────────────────────────────────────────────

  /** 建立 Group（docGroups:create 吃扁平 body，不是 {data} 包裹） */
  async createGroup(data: { name: string; description?: string; order?: number }): Promise<any> {
    const res = await this.ctx.post('/api/docGroups:create', { data })
    if (!res.ok()) throw new Error(`createGroup failed: ${await res.text()}`)
    const body = await res.json()
    return body.data
  }

  async deleteGroup(id: number): Promise<void> {
    await this.ctx.post(`/api/docGroups:destroy?filterByTk=${id}`).catch(() => {})
  }

  async listGroups(): Promise<any[]> {
    const res = await this.ctx.get('/api/docGroups?pageSize=200')
    const body = await res.json()
    return body.data || []
  }

  // ── Projects ──────────────────────────────────────────────────────────────

  async createProject(data: { name: string; description?: string; githubRepo?: string; groupId?: number }): Promise<any> {
    const res = await this.ctx.post('/api/docProjects', { data })
    if (!res.ok()) throw new Error(`createProject failed: ${await res.text()}`)
    const body = await res.json()
    return body.data
  }

  async deleteProject(id: number): Promise<void> {
    await this.ctx.delete(`/api/docProjects/${id}`)
  }

  async listProjects(): Promise<any[]> {
    const res = await this.ctx.get('/api/docProjects:list?pageSize=100')
    if (!res.ok()) return []
    const body = await res.json()
    return Array.isArray(body.data) ? body.data : (body.data?.data || [])
  }

  // ── Document Categories ────────────────────────────────────────────────────

  async createCategory(data: { name: string; description?: string; projectId?: number }): Promise<any> {
    const res = await this.ctx.post('/api/docCategories', { data })
    if (!res.ok()) throw new Error(`createCategory failed: ${await res.text()}`)
    const body = await res.json()
    return body.data
  }

  async deleteCategory(id: number): Promise<void> {
    await this.ctx.delete(`/api/docCategories/${id}`)
  }

  async listCategories(): Promise<any[]> {
    const res = await this.ctx.get('/api/docCategories?pageSize=200')
    const body = await res.json()
    return body.data || []
  }

  /** 依 projectId 查詢資料夾（後端 DocCategories 預設 pagination 容易漏，用 filter） */
  async listCategoriesByProject(projectId: number): Promise<any[]> {
    const filter = encodeURIComponent(JSON.stringify({ projectId }))
    const res = await this.ctx.get(`/api/docCategories?pageSize=100&filter=${filter}`)
    const body = await res.json()
    return body.data || []
  }

  // ── Documents ─────────────────────────────────────────────────────────────

  async createDocument(data: {
    title: string
    content?: string
    categoryId?: number
    projectId?: number
    typeId?: number
    status?: string
  }): Promise<any> {
    // 後端強制 projectId+categoryId 必填；測試若未提供，自動補預設專案 + 第一個資料夾
    let { projectId, categoryId } = data
    if (!projectId || !categoryId) {
      const defaults = await this.getDefaultProjectAndCategory()
      projectId = projectId || defaults.projectId
      categoryId = categoryId || defaults.categoryId
    }
    const res = await this.ctx.post('/api/docDocuments', {
      data: { status: 'published', ...data, projectId, categoryId },
    })
    if (!res.ok()) throw new Error(`createDocument failed: ${await res.text()}`)
    const body = await res.json()
    return body.data
  }

  /** 給 createDocument 用的 fallback：抓第一個 project + 它底下的第一個 category */
  private _defaultPC: { projectId: number; categoryId: number } | null = null
  private async getDefaultProjectAndCategory(): Promise<{ projectId: number; categoryId: number }> {
    if (this._defaultPC) return this._defaultPC
    const projRes = await this.ctx.get('/api/docProjects:list?pageSize=1')
    const projBody = await projRes.json()
    const projects = projBody.data?.data || projBody.data || []
    if (!projects.length) throw new Error('createDocument: 找不到任何 project，請先 seed')
    const projectId = projects[0].id
    const catRes = await this.ctx.get(`/api/docCategories:list?filter[projectId]=${projectId}&pageSize=1`)
    const catBody = await catRes.json()
    const cats = catBody.data?.data || catBody.data || []
    if (!cats.length) throw new Error(`createDocument: project ${projectId} 沒有 category`)
    this._defaultPC = { projectId, categoryId: cats[0].id }
    return this._defaultPC
  }

  async deleteDocument(id: number): Promise<void> {
    await this.ctx.delete(`/api/docDocuments/${id}`)
  }

  async getDocument(id: number): Promise<any> {
    const res = await this.ctx.get(`/api/docDocuments:get?filterByTk=${id}&appends=viewers,editors,subscribers`)
    if (!res.ok()) return null
    const body = await res.json()
    return body.data || null
  }

  /** 更新文件（支援 content、viewerIds、editorIds、subscriberIds 等） */
  async updateDocument(id: number, data: {
    title?: string
    content?: string
    status?: string
    viewerIds?: number[]
    editorIds?: number[]
    subscriberIds?: number[]
    skipConflictCheck?: boolean
  }): Promise<any> {
    const res = await this.ctx.post(`/api/docDocuments:update?filterByTk=${id}`, {
      data: { skipConflictCheck: true, ...data },
    })
    if (!res.ok()) throw new Error(`updateDocument failed: ${res.status()} ${await res.text()}`)
    const body = await res.json()
    return body.data
  }

  async listDocuments(params: Record<string, string | number> = {}): Promise<any[]> {
    const qs = new URLSearchParams({ pageSize: '200', ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])) })
    const res = await this.ctx.get(`/api/docDocuments?${qs}`)
    const body = await res.json()
    return body.data || []
  }

  // ── Users ─────────────────────────────────────────────────────────────────

  async createUser(data: { email: string; nickname?: string; password?: string }): Promise<any> {
    const res = await this.ctx.post('/api/users', {
      data: {
        username: data.email,
        email: data.email,
        nickname: data.nickname || data.email.split('@')[0],
        password: data.password || 'Test1234!',
      },
    })
    if (!res.ok()) throw new Error(`createUser failed: ${res.status()} ${await res.text()}`)
    const body = await res.json()
    return body.data
  }

  async deleteUser(id: number): Promise<void> {
    await this.ctx.delete(`/api/users/${id}`)
  }

  async getUserByEmail(email: string): Promise<any> {
    const encoded = encodeURIComponent(JSON.stringify({ email }))
    const res = await this.ctx.get(`/api/users?filter=${encoded}&pageSize=1`)
    if (!res.ok()) return null
    const body = await res.json()
    // NocoBase users list returns { data: [...], meta: {...} }
    const rows = Array.isArray(body.data) ? body.data : (body.data?.data || [])
    return rows[0] || null
  }

  // ── Project Permissions ───────────────────────────────────────────────────

  async setProjectPermissions(projectId: number, data: {
    viewerIds?: number[]
    editorIds?: number[]
    subscriberIds?: number[]
  }): Promise<void> {
    const res = await this.ctx.post(`/api/docProjects:setPermissions?filterByTk=${projectId}`, { data })
    if (!res.ok()) throw new Error(`setProjectPermissions failed: ${await res.text()}`)
  }

  // ── Document Permissions ──────────────────────────────────────────────────

  async setDocumentSubscribers(docId: number, subscriberIds: number[]): Promise<void> {
    const res = await this.ctx.post(`/api/docDocuments:update?filterByTk=${docId}`, {
      data: { subscriberIds },
    })
    if (!res.ok()) throw new Error(`setDocumentSubscribers failed: ${await res.text()}`)
  }

  // ── Notifications ─────────────────────────────────────────────────────────

  async listNotifications(params: Record<string, string | number> = {}): Promise<any[]> {
    const qs = new URLSearchParams({
      pageSize: '50',
      ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
    })
    // Use DocHub's own notification endpoint (docNotifications:list)
    // which filters by current user and doc-hub channel
    const res = await this.ctx.get(`/api/docDocuments:myNotifications?${qs}`)
    if (!res.ok()) return []
    const body = await res.json()
    return Array.isArray(body.data) ? body.data : (body.data?.data || [])
  }

  // ── Lock / Unlock ─────────────────────────────────────────────────────────

  async lockDocument(id: number): Promise<any> {
    const res = await this.ctx.post(`/api/docDocuments:lock?filterByTk=${id}`)
    const body = await res.json()
    // NocoBase wraps response in { data: { ok, locked } }
    return body.data ?? body
  }

  async unlockDocument(id: number): Promise<any> {
    const res = await this.ctx.post(`/api/docDocuments:unlock?filterByTk=${id}`)
    const body = await res.json()
    return body.data ?? body
  }

  // ── Templates ─────────────────────────────────────────────────────────────

  async createTemplate(data: {
    name: string
    description?: string
    fields: Array<Record<string, any>>
    listDisplayFields?: string[]
    defaultCategoryId?: number | null
    projectId?: number | null
  }): Promise<any> {
    const res = await this.ctx.post('/api/docTemplates:create', { data })
    if (!res.ok()) throw new Error(`createTemplate failed: ${await res.text()}`)
    const body = await res.json()
    return body.data
  }

  async deleteTemplate(id: number): Promise<void> {
    await this.ctx.post(`/api/docTemplates:destroy?filterByTk=${id}`).catch(() => {})
  }

  async listTemplates(): Promise<any[]> {
    const res = await this.ctx.get('/api/docTemplates:list?pageSize=200')
    const body = await res.json()
    return body.data || []
  }

  // ── Versions ──────────────────────────────────────────────────────────────

  async listVersions(docId: number): Promise<any[]> {
    const res = await this.ctx.get(`/api/docDocuments:versions?filterByTk=${docId}`)
    if (!res.ok()) return []
    const body = await res.json()
    return body.data || []
  }

  // ── Audit Logs ────────────────────────────────────────────────────────────

  async listAuditLogs(params: Record<string, string | number> = {}): Promise<any[]> {
    const qs = new URLSearchParams({
      pageSize: '50',
      ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
    })
    const res = await this.ctx.get(`/api/docAuditLogs?${qs}`)
    if (!res.ok()) return []
    const body = await res.json()
    return body.data?.data || body.data || []
  }

  // ── Cleanup ────────────────────────────────────────────────────────────────

  /**
   * Delete all documents whose title starts with the given prefix.
   * Used for E2E test data cleanup.
   */
  async cleanupByTitlePrefix(prefix: string): Promise<void> {
    const docs = await this.listDocuments()
    for (const doc of docs) {
      if (doc.title?.startsWith(prefix)) {
        await this.deleteDocument(doc.id)
      }
    }
    const cats = await this.listCategories()
    for (const cat of cats) {
      if (cat.name?.startsWith(prefix)) {
        await this.deleteCategory(cat.id)
      }
    }
  }
}

/** Cleanup stack — register items to delete after the test suite */
export class CleanupStack {
  private tasks: Array<() => Promise<void>> = []

  push(fn: () => Promise<void>): void {
    this.tasks.push(fn)
  }

  async flush(): Promise<void> {
    // Run in reverse order (LIFO)
    for (let i = this.tasks.length - 1; i >= 0; i--) {
      try {
        await this.tasks[i]()
      } catch {
        // ignore cleanup errors
      }
    }
    this.tasks = []
  }
}
