import { test, expect } from '@playwright/test'
import { ApiHelper, CleanupStack } from '../fixtures/api'
import { USERS } from '../fixtures/auth'
import * as fs from 'fs'
import * as path from 'path'

/**
 * Batch 2：手冊用測試資料（seed-only，無斷言截圖）
 * 跑一次生出完整 fixture，供後續截圖 spec 使用：
 *   - 3 個 Group：專案 / 制度規定（空）/ 共用知識庫（名稱含「共用」→ server 不自動建子資料夾）
 *   - 9 個 Project：
 *       - 專案 → DocHub 核心產品 + 客戶支援中心（SDLC 七階段樹）
 *       - 制度規定 → 空（讓使用者自行新增）
 *       - 共用知識庫 → 01_技術領域 ... 07_SSDLC與合規（7 個頂層分類，無子資料夾）
 *   - 15+ 份文件（含 draft / published / locked / 含版本歷史 / Git-bound）
 *   - 3 份範本（SRS / 會議紀錄 / 上版單）
 *   - 權限矩陣：viewer/editor/subscriber 分別指派到不同文件
 */

const CLEANUP_TITLES = [
  '使用者登入與授權 SRS',
  'DocHub 架構設計 SDS',
  '[草稿] 全文搜尋功能規劃',
  'API 規格文件（含版本歷史）',
  'README（已綁定 Git）',
  '系統規範文件（已鎖定）',
  '2026-04-24 週會紀錄',
]
const CLEANUP_GROUPS = ['研發群組', '營運群組', '文件中心', '共用知識庫']
const CLEANUP_TEMPLATES = ['SRS 需求規格', '會議紀錄', '上版單']
const SEED_META = path.join(__dirname, '../artifacts/seed-meta.json')

type SeedMeta = {
  groupIds: number[]
  projectIds: number[]
  categoryIds: number[]
  documentIds: number[]
  templateIds: number[]
  featured: {
    projectWithGit: number
    lockedDoc: number
    docWithVersions: number
    draftDoc: number
    publishedDoc: number
    templateDoc: number
    gitBoundDoc: number
  }
  userIds: {
    viewer: number
    editor: number
    subscriber: number
    outsider: number
    admin: number
  }
}

/** 依資料夾名稱（支援多個候選）找出第一個匹配的 category */
function findCat(cats: any[], names: string[]): any | undefined {
  for (const n of names) {
    const c = cats.find(x => (x.name || '').trim() === n)
    if (c) return c
  }
  return undefined
}

test.describe('Batch 2: Seed Manual Fixture', () => {
  let admin: ApiHelper

  test.beforeAll(async () => {
    admin = await ApiHelper.create(USERS.admin)
  })

  test.afterAll(async () => {
    await admin?.dispose()
  })

  test.setTimeout(180000)

  test('產出手冊用完整 fixture', async () => {
    const viewer = await ApiHelper.create(USERS.viewer)
    const editor = await ApiHelper.create(USERS.editor)
    const subscriber = await ApiHelper.create(USERS.subscriber)
    const outsider = await ApiHelper.create(USERS.outsider)

    const userIds = {
      admin: (await admin.whoami())?.id,
      viewer: (await viewer.whoami())?.id,
      editor: (await editor.whoami())?.id,
      subscriber: (await subscriber.whoami())?.id,
      outsider: (await outsider.whoami())?.id,
    }
    await viewer.dispose()
    await editor.dispose()
    await subscriber.dispose()
    await outsider.dispose()

    expect(userIds.viewer).toBeGreaterThan(0)
    console.log('User IDs:', userIds)

    // 清掉「所有」現有 DocHub 資料（整個 reset，留乾淨狀態）
    try {
      await admin.cleanupByTitlePrefix('[MANUAL]').catch(() => {})
      await admin.cleanupByTitlePrefix('[SRS]').catch(() => {})
      for (const title of CLEANUP_TITLES) {
        await admin.cleanupByTitlePrefix(title).catch(() => {})
      }
      // 全部 templates 砍光
      const oldTpls = await admin.listTemplates()
      for (const t of oldTpls) {
        await admin.deleteTemplate(t.id).catch(() => {})
      }
      // 全部 projects 砍光（會連動刪 categories / documents）
      const oldProjects = await admin.listProjects()
      for (const p of oldProjects) {
        await admin.deleteProject(p.id).catch(() => {})
      }
      // 全部 groups 砍光
      const oldGroups = await admin.listGroups()
      for (const g of oldGroups) {
        await admin.deleteGroup(g.id).catch(() => {})
      }
      console.log(`Cleanup: 已刪除 ${oldTpls.length} 範本 / ${oldProjects.length} 專案 / ${oldGroups.length} 群組`)
    } catch (e: any) {
      console.warn('Pre-cleanup 部分失敗（可忽略）:', e.message)
    }

    // ── 1. 建立 3 個 Group（第 3 個名稱含「共用」→ server 會套 KB tree）────
    const groups: any[] = []
    groups.push(await admin.createGroup({ name: `專案`, description: '研發、營運等所有專案', sort: 0 } as any))
    groups.push(await admin.createGroup({ name: `制度規定`, description: '公司制度、政策、規範', sort: 1 } as any))
    groups.push(await admin.createGroup({ name: `共用知識庫`, description: '跨專案共用的技術、工程、合規知識', sort: 99 } as any))
    console.log('Groups:', groups.map(g => `${g.id}:${g.name}`))

    // ── 2. 建立專案 ─────────────────────────────────────────────────
    // 研發、營運群組下各一個 SDLC 專案；共用知識庫下建 7 個頂層分類專案
    const projects: any[] = []
    projects.push(await admin.createProject({
      name: `DocHub 核心產品`,
      description: 'NocoBase plugin 主體',
      groupId: groups[0].id,
      githubRepo: 'https://github.com/example/dochub',
    } as any))
    projects.push(await admin.createProject({
      name: `客戶支援中心`,
      description: '客服 SOP 與知識庫',
      groupId: groups[0].id,
    } as any))
    const KB_TOP_PROJECTS = [
      { name: '01_技術領域', description: '語言、框架、工具、DB、基礎建設' },
      { name: '02_工程實踐', description: 'Coding Style、Code Review、測試' },
      { name: '03_維運與可靠性', description: 'SRE、監控、告警、災備' },
      { name: '04_資訊安全', description: '身分驗證、加密、OWASP' },
      { name: '05_專案與流程', description: 'Scrum、OKR、RACI、決策紀錄' },
      { name: '06_範本庫', description: 'SRS、SDD、會議紀錄、上版單' },
      { name: '07_SSDLC與合規', description: 'Secure SDLC、ISO 27001、個資法' },
    ]
    for (const kb of KB_TOP_PROJECTS) {
      projects.push(await admin.createProject({
        name: kb.name,
        description: kb.description,
        groupId: groups[2].id,
      } as any))
    }
    console.log('Projects:', projects.map(p => `${p.id}:${p.name}`))

    // 取出每個專案的資料夾（flat list，含巢狀子資料夾）
    const catsByProject: Record<number, any[]> = {}
    for (const p of projects) {
      catsByProject[p.id] = await admin.listCategoriesByProject(p.id)
    }
    console.log('Categories per project:',
      Object.entries(catsByProject).map(([pid, cs]) => `${pid}=${cs.length}個`))

    // ── 3. 建立 3 份範本 ────────────────────────────────────────────
    const templates: any[] = []
    try {
      templates.push(await admin.createTemplate({
        name: `SRS 需求規格`,
        description: '需求規格標準模板',
        fields: [
          { type: 'text', name: 'feature_name', label: '功能名稱', required: true },
          { type: 'textarea', name: 'description', label: '功能描述', required: true },
          { type: 'select', name: 'priority', label: '優先級', options: ['高', '中', '低'] },
          { type: 'textarea', name: 'acceptance', label: '驗收條件' },
        ],
      }))
      templates.push(await admin.createTemplate({
        name: `會議紀錄`,
        description: '週會 / 專案會議標準格式',
        fields: [
          { type: 'text', name: 'meeting_title', label: '會議名稱', required: true },
          { type: 'date', name: 'meeting_date', label: '日期' },
          { type: 'textarea', name: 'attendees', label: '出席人員' },
          { type: 'textarea', name: 'decisions', label: '會議決議' },
          { type: 'textarea', name: 'action_items', label: '待辦事項' },
        ],
      }))
      templates.push(await admin.createTemplate({
        name: `上版單`,
        description: '產品上線檢查表',
        fields: [
          { type: 'text', name: 'version', label: '版本號', required: true },
          { type: 'date', name: 'release_date', label: '上線日期' },
          { type: 'textarea', name: 'changes', label: '變更內容' },
          { type: 'select', name: 'risk_level', label: '風險等級', options: ['低', '中', '高'] },
        ],
      }))
    } catch (e: any) {
      console.warn('Template creation failed (非致命):', e.message)
    }
    console.log('Templates:', templates.map(t => `${t.id}:${t.name}`))

    // ── 4. 建立文件 ─────────────────────────────────────────────────
    const documents: any[] = []
    const p1 = projects[0]
    const p2 = projects[1]
    // 共用群組下 7 個頂層分類 project（projects[2..8]）
    const pKB = projects.slice(2)
    const p1Cats = catsByProject[p1.id] || []
    const p2Cats = catsByProject[p2.id] || []

    // P1（SDLC tree）：分散到 02_需求 / 03_設計 / 04_測試 / 07_結案 / 99_記錄子資料夾
    const srsDoc = await admin.createDocument({
      title: `使用者登入與授權 SRS`,
      content: `# 使用者登入與授權 SRS\n\n## 功能描述\n\n支援多種登入方式：Email + 密碼、Google OAuth、SSO。\n\n## 驗收條件\n\n- 登入成功導向首頁\n- 失敗顯示錯誤訊息\n- Token 有效期限 7 天\n`,
      projectId: p1.id,
      categoryId: findCat(p1Cats, ['02_需求'])?.id,
      status: 'published',
    } as any)
    documents.push(srsDoc)

    const sdsDoc = await admin.createDocument({
      title: `DocHub 架構設計 SDS`,
      content: `# DocHub 架構設計\n\n## 系統概述\n\nDocHub 採用 NocoBase plugin 架構，前後端共用資料模型。\n\n## 模組劃分\n\n| 模組 | 職責 |\n|------|------|\n| docGroups | 群組管理 |\n| docProjects | 專案管理 |\n| docCategories | 資料夾管理 |\n| docDocuments | 文件主體 |\n| docTemplates | 表單範本 |\n\n## 技術棧\n\n- 後端：Koa + Sequelize\n- 前端：React + Antd（AMD bundle）\n- DB：PostgreSQL\n`,
      projectId: p1.id,
      categoryId: findCat(p1Cats, ['03_設計'])?.id,
      status: 'published',
    } as any)
    documents.push(sdsDoc)

    const draftDoc = await admin.createDocument({
      title: `[草稿] 全文搜尋功能規劃`,
      content: `# 全文搜尋功能規劃\n\n（本文件仍在草擬中）\n\n## 待確認事項\n\n- [ ] 使用 PostgreSQL full-text search 還是 ElasticSearch？\n- [ ] 是否支援中文分詞？\n- [ ] 索引更新頻率？\n`,
      projectId: p1.id,
      categoryId: findCat(p1Cats, ['01_提案與規劃'])?.id,
      status: 'draft',
    } as any)
    documents.push(draftDoc)

    const versionedDoc = await admin.createDocument({
      title: `API 規格文件（含版本歷史）`,
      content: `# API 規格文件 v1\n\n初版內容。`,
      projectId: p1.id,
      categoryId: findCat(p1Cats, ['03_設計'])?.id,
      status: 'published',
    } as any)
    await admin.updateDocument(versionedDoc.id, {
      content: `# API 規格文件 v2\n\n## 更新\n\n- 新增 /api/search 端點\n- 調整 /api/docs 回傳格式\n`,
    })
    await admin.updateDocument(versionedDoc.id, {
      content: `# API 規格文件 v3（最新）\n\n## 更新\n\n- 新增 /api/search 端點（支援關鍵字高亮）\n- 調整 /api/docs 回傳格式\n- 新增 /api/templates:render 動態表單渲染\n\n## 端點列表\n\n| Method | Path | 說明 |\n|--------|------|------|\n| GET | /api/docs | 列表 |\n| POST | /api/docs | 建立 |\n| PUT | /api/docs/:id | 更新 |\n| DELETE | /api/docs/:id | 刪除 |\n`,
    })
    documents.push(versionedDoc)

    const gitDoc = await admin.createDocument({
      title: `README（已綁定 Git）`,
      content: `# DocHub README\n\n這份文件會同步到 GitLab 的 wez-spring-boot-starters repo。\n\n## 快速開始\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n`,
      projectId: p1.id,
      categoryId: findCat(p1Cats, ['07_結案'])?.id,
      status: 'published',
    } as any)
    await admin.updateDocument(gitDoc.id, {
      content: gitDoc.content,
      githubRepo: 'wezoomtek/wez-spring-boot-starters',
      githubFilePath: 'docs/README.md',
      githubBranch: 'main',
      gitSyncStatus: 'synced',
    } as any)
    documents.push(gitDoc)

    const lockedDoc = await admin.createDocument({
      title: `系統規範文件（已鎖定）`,
      content: `# 系統規範文件\n\n此文件由管理員鎖定，禁止編輯。\n\n## 規範項目\n\n- 所有 API 須使用 HTTPS\n- Password 須符合最低強度要求\n- PII 不得寫入 log\n`,
      projectId: p1.id,
      categoryId: findCat(p1Cats, ['06_驗收'])?.id,
      status: 'published',
    } as any)
    await admin.lockDocument(lockedDoc.id).catch(() => {})
    documents.push(lockedDoc)

    // P2（SDLC tree）：客服文件分散到不同階段
    const p2Folders = ['02_需求', '03_設計', '04_測試', '05_部署與上線', '07_結案']
    for (let i = 0; i < 5; i++) {
      const cat = findCat(p2Cats, [p2Folders[i]]) || p2Cats[0]
      const d = await admin.createDocument({
        title: `客服 SOP ${i + 1}：${['退貨流程', '帳戶凍結處理', 'VIP 客戶服務', '常見問題集', '轉接處理'][i]}`,
        content: `# ${['退貨流程', '帳戶凍結處理', 'VIP 客戶服務', '常見問題集', '轉接處理'][i]}\n\n## 適用情境\n\n客服人員接到相關問題時的標準處理流程。\n\n## 處理步驟\n\n1. 確認客戶身份\n2. 查詢相關紀錄\n3. 依 SOP 處理\n4. 紀錄於系統\n`,
        projectId: p2.id,
        categoryId: cat?.id,
        status: 'published',
      } as any)
      documents.push(d)
    }

    // 共用知識庫：7 個頂層分類 project 各放 1 篇範例文件（無子資料夾）
    const kbTitles = [
      'Kubernetes 上手指引',           // 01_技術領域
      'Code Review 檢查清單',          // 02_工程實踐
      'On-call 手冊',                 // 03_維運與可靠性
      'OWASP Top 10 對照',             // 04_資訊安全
      'Scrum 流程與 DoD 範例',         // 05_專案與流程
      'SRS / SDD 範本索引',            // 06_範本庫
      'ISO 27001 控制項對照',          // 07_SSDLC與合規
    ]
    for (let i = 0; i < pKB.length && i < kbTitles.length; i++) {
      const d = await admin.createDocument({
        title: kbTitles[i],
        content: `# ${kbTitles[i]}\n\n## 概述\n\n這是共用知識庫中的技術文件，供各專案成員參考。\n\n## 主要內容\n\n- 重點 A\n- 重點 B\n- 重點 C\n`,
        projectId: pKB[i].id,
        status: 'published',
      } as any)
      documents.push(d)
    }

    // ── 5. 由範本建立一份表單文件 ───────────────────────────────────
    let templateFormDoc: any = null
    if (templates.length > 0 && templates[1]?.id) {
      try {
        const res = await admin.raw.post('/api/docDocuments', {
          data: {
            title: `2026-04-24 週會紀錄`,
            contentType: 'template',
            templateId: templates[1].id,
            formData: {
              meeting_title: 'DocHub 開發週會',
              meeting_date: '2026-04-24',
              attendees: 'Admin, 產品經理, 前端工程師, 後端工程師',
              decisions: '1. 範本系統上線\n2. 權限矩陣確認\n3. 下週開始截圖手冊',
              action_items: '- [ ] 完成 Batch 3 截圖 spec\n- [ ] 補齊使用手冊內容',
            },
            projectId: p1.id,
            // 週會放 99_記錄/會議紀錄 下，先試頂層 99_記錄；找不到 fallback 02_需求
            categoryId: findCat(p1Cats, ['會議紀錄', '99_記錄'])?.id || findCat(p1Cats, ['02_需求'])?.id,
            status: 'published',
          },
        })
        if (res.ok()) {
          templateFormDoc = (await res.json()).data
          documents.push(templateFormDoc)
        }
      } catch (e: any) {
        console.warn('Template form doc 建立失敗:', e.message)
      }
    }

    // ── 6. 權限矩陣 ─────────────────────────────────────────────────
    await admin.updateDocument(srsDoc.id, { viewerIds: [userIds.viewer] })
    await admin.updateDocument(sdsDoc.id, { viewerIds: [userIds.viewer] })
    await admin.updateDocument(versionedDoc.id, { editorIds: [userIds.editor] })
    await admin.updateDocument(gitDoc.id, { subscriberIds: [userIds.subscriber] })
    await admin.updateDocument(gitDoc.id, {
      content: gitDoc.content + '\n\n<!-- 最後更新：2026-04-24 -->',
    })

    // ── 7. 寫出 seed meta ───────────────────────────────────────────
    const meta: SeedMeta = {
      groupIds: groups.map(g => g.id),
      projectIds: projects.map(p => p.id),
      categoryIds: Object.values(catsByProject).flat().map(c => c.id),
      documentIds: documents.map(d => d.id),
      templateIds: templates.map(t => t.id),
      featured: {
        projectWithGit: p1.id,
        lockedDoc: lockedDoc.id,
        docWithVersions: versionedDoc.id,
        draftDoc: draftDoc.id,
        publishedDoc: srsDoc.id,
        templateDoc: templateFormDoc?.id || 0,
        gitBoundDoc: gitDoc.id,
      },
      userIds,
    }
    if (!fs.existsSync(path.dirname(SEED_META))) {
      fs.mkdirSync(path.dirname(SEED_META), { recursive: true })
    }
    fs.writeFileSync(SEED_META, JSON.stringify(meta, null, 2), 'utf-8')

    const totalCats = Object.values(catsByProject).flat().length
    console.log(`\n✅ Seed 完成：${groups.length} groups / ${projects.length} projects / ${totalCats} categories / ${documents.length} docs / ${templates.length} templates`)
    console.log(`📄 seed-meta.json 位置：${SEED_META}`)
    console.log('Featured:', JSON.stringify(meta.featured, null, 2))

    expect(groups.length).toBe(3)
    expect(projects.length).toBe(9) // 研發 1 + 營運 1 + 共用知識庫 7
    expect(documents.length).toBeGreaterThanOrEqual(14)
  })
})
