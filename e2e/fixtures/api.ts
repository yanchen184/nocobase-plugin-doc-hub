import { APIRequestContext, request } from '@playwright/test'
import { getToken, UserCredentials, ADMIN_CREDENTIALS } from './auth'

const BASE_URL = process.env.BASE_URL || 'http://localhost:13000'

export class ApiHelper {
  private ctx: APIRequestContext
  private token: string

  constructor(ctx: APIRequestContext, token: string) {
    this.ctx = ctx
    this.token = token
  }

  static async create(credentials: UserCredentials = ADMIN_CREDENTIALS): Promise<ApiHelper> {
    const token = await getToken(credentials)
    const ctx = await request.newContext({
      baseURL: BASE_URL,
      extraHTTPHeaders: { Authorization: `Bearer ${token}` },
    })
    return new ApiHelper(ctx, token)
  }

  async dispose(): Promise<void> {
    await this.ctx.dispose()
  }

  // ── Projects ──────────────────────────────────────────────────────────────

  async createProject(data: { name: string; description?: string; githubRepo?: string }): Promise<any> {
    const res = await this.ctx.post('/api/docProjects', { data })
    if (!res.ok()) throw new Error(`createProject failed: ${await res.text()}`)
    const body = await res.json()
    return body.data
  }

  async deleteProject(id: number): Promise<void> {
    await this.ctx.delete(`/api/docProjects/${id}`)
  }

  async listProjects(): Promise<any[]> {
    const res = await this.ctx.get('/api/docProjects?pageSize=100')
    const body = await res.json()
    return body.data?.data || body.data || []
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

  // ── Documents ─────────────────────────────────────────────────────────────

  async createDocument(data: {
    title: string
    content?: string
    categoryId?: number
    typeId?: number
    status?: string
  }): Promise<any> {
    const res = await this.ctx.post('/api/docDocuments', {
      data: { status: 'published', ...data },
    })
    if (!res.ok()) throw new Error(`createDocument failed: ${await res.text()}`)
    const body = await res.json()
    return body.data
  }

  async deleteDocument(id: number): Promise<void> {
    await this.ctx.delete(`/api/docDocuments/${id}`)
  }

  async listDocuments(params: Record<string, string | number> = {}): Promise<any[]> {
    const qs = new URLSearchParams({ pageSize: '200', ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])) })
    const res = await this.ctx.get(`/api/docDocuments?${qs}`)
    const body = await res.json()
    return body.data || []
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
