/**
 * DocHub 全功能截圖導覽 v4
 *
 * 執行：npx playwright test 99-screenshot-tour.spec.ts
 * 截圖輸出：e2e/artifacts/screenshots/
 *
 * 功能覆蓋：
 *  01 列表頁（豐富資料）
 *  02 列表搜尋
 *  03 新增文件 Modal
 *  04 編輯頁（含 dirty 狀態）
 *  05 閱讀頁（含進度條、TOC）
 *  06 版本歷史
 *  07 版本 Diff
 *  08 文件鎖定 Modal
 *  09 鎖定後列表
 *  10 移動文件 Modal（必填提示）
 *  11 稽核日誌
 *  12 範本管理頁
 *  13 範本建構器 Modal
 *  14 從範本新增文件
 *  15 填寫範本頁
 *  16 專案權限 Modal
 *  17 Git 同步欄（含 repo 資訊）
 *  18 側邊欄（專案/資料夾/最近查看）
 *  19 Onboarding 畫面
 *  20 全頁總覽
 */

import { test } from '@playwright/test'
import { loginAsAdmin } from '../fixtures/auth'
import { ApiHelper, CleanupStack } from '../fixtures/api'
import * as path from 'path'
import * as fs from 'fs'

const BASE_URL = process.env.BASE_URL || 'http://localhost:13000'
const SHOT_DIR = path.join(__dirname, '../artifacts/screenshots')

if (!fs.existsSync(SHOT_DIR)) fs.mkdirSync(SHOT_DIR, { recursive: true })

// ── 假資料 ID ────────────────────────────────────────────────────────────────
let api: ApiHelper
let cleanup: CleanupStack

// Projects
let proj1Id: number  // wez-spring-boot-starters 技術文件
let proj2Id: number  // 產品手冊
let proj3Id: number  // 內部 SOP

// Categories
let cat11Id: number  // API 文件
let cat12Id: number  // 架構設計
let cat21Id: number  // 使用者手冊
let cat31Id: number  // 人資 SOP

// Documents（各種狀態）
let docPublishedId: number  // 已發布、有 Git、豐富內容
let docDraftId: number      // 草稿
let docLockedId: number     // 已鎖定
let docTemplateId: number   // 由範本填寫產生
let demoTemplateId: number  // 截圖用範本定義 ID

// ── 截圖工具 ─────────────────────────────────────────────────────────────────

async function shot(page: any, name: string) {
  await page.screenshot({ path: path.join(SHOT_DIR, `${name}.png`), fullPage: false })
  console.log(`  📸 ${name}.png`)
}

async function shotFull(page: any, name: string) {
  await page.screenshot({ path: path.join(SHOT_DIR, `${name}.png`), fullPage: true })
  console.log(`  📸 ${name}.png (full)`)
}

async function waitReady(page: any, extraMs = 1500) {
  await page.waitForLoadState('networkidle')
  await page.waitForFunction(() => {
    const spinners = document.querySelectorAll('.ant-spin-spinning, [class*="loading"]')
    const blocking = Array.from(spinners).filter((el: any) => {
      const s = window.getComputedStyle(el)
      return s.display !== 'none' && s.visibility !== 'hidden' && el.offsetParent !== null
    })
    return blocking.length === 0
  }, { timeout: 20000 }).catch(() => {})
  await page.waitForTimeout(extraMs)
}

// ── 豐富 Demo 內容 ───────────────────────────────────────────────────────────

const CONTENT_API_DOC = `# Spring Boot Starter 快速上手指南

歡迎使用 **wez-spring-boot-starters**！本文件說明如何在專案中引入與配置各項 Starter。

---

## 快速開始

### Maven 依賴

在您的 \`pom.xml\` 加入：

\`\`\`xml
<dependency>
  <groupId>com.wezoomtek</groupId>
  <artifactId>wez-security-starter</artifactId>
  <version>1.2.0</version>
</dependency>
\`\`\`

### 最小配置

\`\`\`yaml
wez:
  security:
    jwt-secret: your-secret-key
    token-expiry: 86400
  datasource:
    primary: jdbc:sqlserver://db.internal:1433;databaseName=main_db
\`\`\`

---

## 模組清單

| Starter | 功能 | 版本 |
|---------|------|------|
| wez-security-starter | JWT Auth + RBAC | 1.2.0 |
| wez-datasource-starter | 多資料源 + 連線池 | 1.1.3 |
| wez-audit-starter | 稽核日誌自動記錄 | 1.0.8 |
| wez-notification-starter | Email / LINE / Slack 通知 | 1.0.5 |
| wez-cache-starter | Redis 快取封裝 | 1.1.0 |

---

## 進階配置

### JWT Token 設定

\`\`\`java
@Configuration
public class SecurityConfig extends WezSecurityConfigurerAdapter {

    @Override
    protected void configure(WezHttpSecurity http) {
        http
          .antMatchers("/api/public/**").permitAll()
          .antMatchers("/api/admin/**").hasRole("ADMIN")
          .anyRequest().authenticated();
    }
}
\`\`\`

> 💡 **提示**：所有 Starter 均支援 Spring Boot 3.x / Java 21，並通過 MSSQL 2019 相容性測試。

---

## 常見問題

**Q：Token 過期後如何自動刷新？**
A：啟用 \`wez.security.refresh-token=true\`，系統會在過期前 5 分鐘自動換發。

**Q：多資料源如何切換？**
A：使用 \`@WezDataSource("secondary")\` 注解即可切換到副資料源。

---

_最後更新：2026-04-16　維護者：DevOps Team_`

const CONTENT_ARCH = `# 系統架構設計文件

## 整體架構

\`\`\`
┌─────────────────────────────────────────────────┐
│                  API Gateway                      │
│              (Spring Cloud Gateway)               │
└──────────────────┬──────────────────────────────┘
                   │
      ┌────────────┼────────────┐
      │            │            │
  ┌───▼───┐   ┌───▼───┐   ┌───▼───┐
  │Clinical│   │Patient│   │ HIS   │
  │  API  │   │  API  │   │Adapter│
  └───────┘   └───────┘   └───────┘
      │            │            │
  ┌───▼────────────▼────────────▼───┐
  │          MSSQL 2019             │
  │    (主資料庫 + 稽核日誌 DB)     │
  └─────────────────────────────────┘
\`\`\`

## 技術選型

| 層次 | 技術 | 版本 |
|------|------|------|
| 後端框架 | Spring Boot | 4.0.3 |
| 資料庫 | MSSQL Server | 2019 |
| 快取 | Redis | 7.x |
| 訊息佇列 | RabbitMQ | 3.12 |
| 容器化 | Docker + K8s | latest |

## 部署架構

三節點叢集，滾動升級，零停機部署。`

const CONTENT_MANUAL = `# DocHub 使用者操作手冊

## 1. 文件管理

### 1.1 建立文件

點擊右上角「**新增文件**」按鈕，選擇建立方式：

- **空白文件**：從零開始撰寫 Markdown
- **從範本建立**：使用預設欄位格式，快速填寫
- **從 Git 拉取**：匯入 GitHub / GitLab 上的 .md 檔案

### 1.2 編輯文件

編輯頁提供**分割視窗**模式：左側 Markdown 原始碼，右側即時預覽。

快捷鍵：
- \`Cmd/Ctrl + S\` — 手動儲存
- \`Cmd/Ctrl + K\` — 聚焦搜尋框

### 1.3 版本歷史

每次儲存會自動建立版本快照，可以：
- 瀏覽歷史版本列表
- 比較任意兩個版本的差異（Diff）
- 一鍵回滾到指定版本

---

## 2. 權限管理

DocHub 採用**三層權限模型**：

| 角色 | 可做的事 |
|------|---------|
| Viewer | 閱讀文件 |
| Editor | 閱讀 + 編輯 + 新增 |
| Admin | 全部功能 + 刪除 + 鎖定 + 權限管理 |`

const CONTENT_SOP = `# 新進員工入職 SOP

## 流程概覽

\`\`\`
報到確認 → IT 設備申請 → 系統帳號開通 → 部門說明 → 正式上工
（Day 1）   （Day 1-2）    （Day 2-3）      （Day 3）    （Day 5）
\`\`\`

## Day 1 — 報到

- [ ] 攜帶身分證 + 學歷/離職證明
- [ ] HR 引導填寫勞動契約
- [ ] 領取門禁卡、停車證
- [ ] 參加公司簡介說明會（09:30 @ 3F 會議室）

## Day 2 — IT 設備

- [ ] 填寫設備申請單（IT 部門 Google Form）
- [ ] 筆電初始化（IT 工程師協助）
- [ ] 設定 VPN、企業 Email
- [ ] 加入 Slack 工作區

## Day 3 — 帳號開通

所有系統帳號由 IT 統一申請，預計 **1-2 個工作天**完成。

| 系統 | 申請方式 |
|------|---------|
| GitLab | IT ticket |
| Jenkins | IT ticket |
| Jira | 部門主管同意 → IT |
| DocHub | 管理員手動設定 |`

// ── beforeAll：建立豐富的 Demo 資料 ──────────────────────────────────────────

test.beforeAll(async () => {
  api = await ApiHelper.create()
  cleanup = new CleanupStack()

  // ─ 建立專案（server 強制 groupId 必填）─────────────────────────────────
  const groups = await api.listGroups()
  const projectGroup = groups.find((g: any) => g.name === '專案') || groups[0]
  const groupId = projectGroup?.id

  const p1 = await api.createProject({
    name: 'wez-spring-boot-starters',
    description: '企業級 Spring Boot Starter 元件庫，涵蓋安全性、多資料源、稽核日誌、通知等模組。',
    githubRepo: '10.1.2.191/wezoomtek/wez-spring-boot-starters',
    groupId,
  }).catch(() => null)
  if (p1?.id) { proj1Id = p1.id; cleanup.push(() => api.deleteProject(proj1Id)) }

  const p2 = await api.createProject({
    name: '產品操作手冊',
    description: '各產品線的使用者手冊與快速上手指南。',
    groupId,
  }).catch(() => null)
  if (p2?.id) { proj2Id = p2.id; cleanup.push(() => api.deleteProject(proj2Id)) }

  const p3 = await api.createProject({
    name: '內部 SOP',
    description: '人資、IT、財務部門的標準作業流程文件。',
    groupId,
  }).catch(() => null)
  if (p3?.id) { proj3Id = p3.id; cleanup.push(() => api.deleteProject(proj3Id)) }

  // ─ 建立資料夾 ────────────────────────────────────────────────────────────
  if (proj1Id) {
    const c11 = await api.createCategory({ name: 'API 文件', projectId: proj1Id }).catch(() => null)
    if (c11?.id) { cat11Id = c11.id; cleanup.push(() => api.deleteCategory(cat11Id)) }

    const c12 = await api.createCategory({ name: '架構設計', projectId: proj1Id }).catch(() => null)
    if (c12?.id) { cat12Id = c12.id; cleanup.push(() => api.deleteCategory(cat12Id)) }

    await api.createCategory({ name: '部署指南', projectId: proj1Id }).then(c => {
      if (c?.id) cleanup.push(() => api.deleteCategory(c.id))
    }).catch(() => null)

    await api.createCategory({ name: '發布日誌', projectId: proj1Id }).then(c => {
      if (c?.id) cleanup.push(() => api.deleteCategory(c.id))
    }).catch(() => null)
  }

  if (proj2Id) {
    const c21 = await api.createCategory({ name: '使用者手冊', projectId: proj2Id }).catch(() => null)
    if (c21?.id) { cat21Id = c21.id; cleanup.push(() => api.deleteCategory(cat21Id)) }
    await api.createCategory({ name: '管理員手冊', projectId: proj2Id }).then(c => {
      if (c?.id) cleanup.push(() => api.deleteCategory(c.id))
    }).catch(() => null)
  }

  if (proj3Id) {
    const c31 = await api.createCategory({ name: '人資 SOP', projectId: proj3Id }).catch(() => null)
    if (c31?.id) { cat31Id = c31.id; cleanup.push(() => api.deleteCategory(cat31Id)) }
    await api.createCategory({ name: 'IT SOP', projectId: proj3Id }).then(c => {
      if (c?.id) cleanup.push(() => api.deleteCategory(c.id))
    }).catch(() => null)
  }

  // ─ 建立文件 ──────────────────────────────────────────────────────────────

  // 1. 已發布、有 Git repo、豐富 Markdown 內容
  const d1 = await api.createDocument({
    title: 'Spring Boot Starter 快速上手指南',
    content: CONTENT_API_DOC,
    projectId: proj1Id || undefined,
    categoryId: cat11Id || undefined,
    status: 'published',
    githubRepo: '10.1.2.191/wezoomtek/wez-spring-boot-starters',
    githubFilePath: 'docs/quick-start.md',
    githubBranch: 'main',
  } as any).catch(() => null)
  if (d1?.id) {
    docPublishedId = d1.id
    cleanup.push(() => api.deleteDocument(docPublishedId))
    // 更新一次內容，產生 v2 版本（讓版本歷史 Diff 截圖有意義）
    await (api as any).ctx.post(`/api/docDocuments:update?filterByTk=${docPublishedId}`, {
      data: {
        content: CONTENT_API_DOC + '\n\n## v2 更新（2026-04-16）\n\n- 新增 wez-notification-starter 章節\n- 修正 wez-security-starter Token 刷新競態條件\n- 補充 wez-datasource-starter 多資料源切換說明\n',
      }
    }).catch(() => null)
  }

  // 2. 架構文件（已發布）
  await api.createDocument({
    title: '系統架構設計文件 v2.1',
    content: CONTENT_ARCH,
    projectId: proj1Id || undefined,
    categoryId: cat12Id || undefined,
    status: 'published',
    githubRepo: '10.1.2.191/wezoomtek/wez-spring-boot-starters',
    githubFilePath: 'docs/architecture.md',
    githubBranch: 'main',
  } as any).then(d => {
    if (d?.id) cleanup.push(() => api.deleteDocument(d.id))
  }).catch(() => null)

  // 3. 草稿文件
  const d2 = await api.createDocument({
    title: 'wez-notification-starter 整合指南（草稿）',
    content: '# wez-notification-starter\n\n> 此文件正在撰寫中，尚未完成。\n\n## TODO\n- [ ] LINE Notify 設定\n- [ ] Email 範本配置\n- [ ] Slack Webhook',
    projectId: proj1Id || undefined,
    categoryId: cat11Id || undefined,
    status: 'draft',
  } as any).catch(() => null)
  if (d2?.id) { docDraftId = d2.id; cleanup.push(() => api.deleteDocument(docDraftId)) }

  // 4. 鎖定文件
  const d3 = await api.createDocument({
    title: 'Release Note v1.2.0（已鎖定）',
    content: '# Release Note v1.2.0\n\n**發布日期**：2026-03-15\n\n## 新功能\n- wez-security-starter：支援 OAuth2 PKCE\n- wez-audit-starter：新增 async 模式\n\n## Bug Fixes\n- 修正 JWT 刷新競態條件\n- 修正多資料源 transaction rollback 問題',
    projectId: proj1Id || undefined,
    categoryId: cat12Id || undefined,
    status: 'published',
  } as any).catch(() => null)
  if (d3?.id) {
    docLockedId = d3.id
    cleanup.push(async () => {
      await api.unlockDocument(docLockedId).catch(() => {})
      await api.deleteDocument(docLockedId)
    })
    await api.lockDocument(docLockedId).catch(() => {})
  }

  // 5. 使用者手冊
  await api.createDocument({
    title: 'DocHub 使用者手冊',
    content: CONTENT_MANUAL,
    projectId: proj2Id || undefined,
    categoryId: cat21Id || undefined,
    status: 'published',
  } as any).then(d => {
    if (d?.id) cleanup.push(() => api.deleteDocument(d.id))
  }).catch(() => null)

  // 6. SOP
  await api.createDocument({
    title: '新進員工入職 SOP',
    content: CONTENT_SOP,
    projectId: proj3Id || undefined,
    categoryId: cat31Id || undefined,
    status: 'published',
  } as any).then(d => {
    if (d?.id) cleanup.push(() => api.deleteDocument(d.id))
  }).catch(() => null)

  // 7. 更多 API 文件
  await api.createDocument({
    title: 'wez-security-starter 配置參考',
    content: '# wez-security-starter\n\n完整配置參數說明。\n\n## JWT 設定\n\n| 參數 | 預設 | 說明 |\n|------|------|------|\n| jwt-secret | — | 必填，建議 256 位元 |\n| token-expiry | 86400 | 秒 |\n| refresh-token | false | 是否啟用刷新 |\n\n## RBAC 權限\n\n支援細粒度角色管理，與 Spring Security 無縫整合。',
    projectId: proj1Id || undefined,
    categoryId: cat11Id || undefined,
    status: 'published',
  } as any).then(d => {
    if (d?.id) cleanup.push(() => api.deleteDocument(d.id))
  }).catch(() => null)

  await api.createDocument({
    title: 'wez-datasource-starter 多資料源指南',
    content: '# wez-datasource-starter\n\n支援同時連接多個 MSSQL / PostgreSQL / MySQL 資料庫。\n\n## 配置範例\n\n```yaml\nwez:\n  datasource:\n    primary: jdbc:sqlserver://db1:1433\n    secondary: jdbc:sqlserver://db2:1433\n```\n\n使用 `@WezDataSource("secondary")` 切換資料源。',
    projectId: proj1Id || undefined,
    categoryId: cat11Id || undefined,
    status: 'published',
  } as any).then(d => {
    if (d?.id) cleanup.push(() => api.deleteDocument(d.id))
  }).catch(() => null)

  // 8. IT SOP
  await api.createDocument({
    title: 'VPN 連線設定指南',
    content: '# VPN 連線設定指南\n\n## Windows\n\n1. 下載 OpenVPN Client\n2. 匯入 `.ovpn` 設定檔（請向 IT 申請）\n3. 輸入帳號密碼連線\n\n## macOS\n\n使用 Tunnelblick 或 OpenVPN Connect。',
    projectId: proj3Id || undefined,
    categoryId: cat31Id || undefined,
    status: 'published',
  } as any).then(d => {
    if (d?.id) cleanup.push(() => api.deleteDocument(d.id))
  }).catch(() => null)

  // 建立截圖用的範本定義（透過 ApiHelper token 呼叫 API）
  try {
    const tplFields = [
      { id: 'f1', name: 'applicant', type: 'text', label: '申請人姓名', required: true, placeholder: '請填寫申請人全名' },
      { id: 'f2', name: 'applyDate', type: 'date', label: '申請日期', required: true },
      { id: 'f3', name: 'applyType', type: 'select', label: '申請類型', required: true,
        options: [
          { label: '請假單', value: '請假單' },
          { label: '報銷申請', value: '報銷申請' },
          { label: '採購申請', value: '採購申請' },
          { label: '其他', value: '其他' },
        ]
      },
      { id: 'f4', name: 'reason', type: 'text', label: '申請原因說明', required: false, placeholder: '請詳述申請原因（選填）' },
    ]
    const { getToken, ADMIN_CREDENTIALS } = await import('../fixtures/auth')
    const token = await getToken(ADMIN_CREDENTIALS)
    const tplRes = await fetch(`${BASE_URL}/api/docTemplates:create`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '[TOUR] 通用申請表單範本', description: '截圖展示用範本', fields: tplFields, projectId: proj1Id || undefined }),
    })
    const tplBody = await tplRes.json().catch(() => ({}))
    const tplId = tplBody?.data?.id
    if (tplId) {
      demoTemplateId = tplId
      cleanup.push(async () => {
        const t2 = await getToken(ADMIN_CREDENTIALS)
        await fetch(`${BASE_URL}/api/docTemplates:destroy?filterByTk=${tplId}`, {
          method: 'POST', headers: { 'Authorization': `Bearer ${t2}` },
        }).catch(() => {})
      })
      console.log(`  demoTemplateId=${demoTemplateId}`)
    }
  } catch (e) {
    console.log('  ⚠️ 建立範本定義失敗:', e)
  }

  console.log('✅ Demo 資料建立完成')
  console.log(`  proj1=${proj1Id}, proj2=${proj2Id}, proj3=${proj3Id}`)
  console.log(`  docPublishedId=${docPublishedId}, docLockedId=${docLockedId}`)
})

test.afterAll(async () => {
  if (cleanup) await cleanup.flush()
  if (api) await api.dispose()
})

test.setTimeout(600000) // 10 分鐘

// ── 主截圖測試 ────────────────────────────────────────────────────────────────

test('DocHub 全功能截圖導覽 v4', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await loginAsAdmin(page)

  // ── 01. 列表頁（豐富資料，選 proj1） ─────────────────────────────────────
  console.log('\n── 01 列表頁 ──')
  const listUrl = proj1Id
    ? `${BASE_URL}/admin/doc-hub?projectId=${proj1Id}${cat11Id ? '&categoryId='+cat11Id : ''}`
    : `${BASE_URL}/admin/doc-hub`
  await page.goto(listUrl, { timeout: 60000 })
  await page.waitForSelector('tr.ant-table-row, .ant-empty', { timeout: 20000 }).catch(() => {})
  await waitReady(page, 2000)
  await shot(page, '01_列表頁')
  await shotFull(page, '01b_列表頁_全頁')

  // ── 02. 列表搜尋 ──────────────────────────────────────────────────────────
  console.log('\n── 02 搜尋 ──')
  const searchInput = page.locator('.dochub-search-input, input[placeholder*="搜尋"], input[class*="search"]').first()
  if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await searchInput.fill('starter')
    await page.waitForTimeout(2000) // 等搜尋結果出現
    await waitReady(page, 500)
    await shot(page, '02_列表搜尋')
    await shot(page, '02_列表搜尋結果')
    await searchInput.clear()
    await page.waitForTimeout(800)
  } else {
    // 嘗試用 Cmd+K 聚焦
    await page.keyboard.press('Meta+k')
    await page.waitForTimeout(500)
    const si2 = page.locator('input').filter({ hasText: /搜尋/ }).first()
    if (await si2.isVisible({ timeout: 2000 }).catch(() => false)) {
      await si2.fill('starter')
      await page.waitForTimeout(2000)
      await shot(page, '02_列表搜尋')
      await shot(page, '02_列表搜尋結果')
    }
  }

  // ── 03. 新增文件 Modal（三種建立方式）────────────────────────────────────
  console.log('\n── 03 新增文件 Modal ──')
  // 需在 cat 層才顯示「+新增文件」按鈕
  await page.goto(`${BASE_URL}/admin/doc-hub?projectId=${proj1Id}&categoryId=${cat11Id}`, { timeout: 60000 })
  await page.waitForSelector('tr.ant-table-row, .ant-empty', { timeout: 15000 }).catch(() => {})
  await waitReady(page, 1500)
  const addDocBtn = page.locator('button').filter({ hasText: /新增文件/ }).first()
  if (await addDocBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await addDocBtn.click()
    await page.waitForSelector('.ant-modal-content', { timeout: 8000 }).catch(() => {})
    await page.waitForTimeout(800)
    // 02a：三種建立方式選擇畫面
    await shot(page, '02a_新增Modal_三種方式')

    // 02b：點「自由撰寫」進入空白編輯頁
    const freeWriteOpt = page.locator('.ant-modal-content').locator('text=自由撰寫').first()
    if (await freeWriteOpt.isVisible({ timeout: 2000 }).catch(() => false)) {
      await freeWriteOpt.click()
      await page.waitForSelector('textarea', { timeout: 20000 }).catch(() => {})
      await waitReady(page, 2000)
      await shot(page, '02b_新增文件_自由撰寫_空白編輯頁')
      await page.goto(`${BASE_URL}/admin/doc-hub?projectId=${proj1Id}&categoryId=${cat11Id}`, { timeout: 60000 })
      await waitReady(page, 1500)
    }

    // 重新開 Modal 截「使用範本」
    const addDocBtn2 = page.locator('button').filter({ hasText: /新增文件/ }).first()
    if (await addDocBtn2.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addDocBtn2.click()
      await page.waitForSelector('.ant-modal-content', { timeout: 8000 }).catch(() => {})
      await page.waitForTimeout(600)
      // 02c：點「使用範本」進入選範本 Modal
      const tplOpt = page.locator('.ant-modal-content').locator('text=使用範本').first()
      if (await tplOpt.isVisible({ timeout: 2000 }).catch(() => false)) {
        await tplOpt.click()
        await page.waitForTimeout(800)
        await shot(page, '02c_新增文件_使用範本_選範本')
        await page.keyboard.press('Escape')
        await page.waitForTimeout(400)
      } else {
        await page.keyboard.press('Escape')
        await page.waitForTimeout(400)
      }
    }

    // 重新開 Modal 截「Git 同步」
    const addDocBtn3 = page.locator('button').filter({ hasText: /新增文件/ }).first()
    if (await addDocBtn3.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addDocBtn3.click()
      await page.waitForSelector('.ant-modal-content', { timeout: 8000 }).catch(() => {})
      await page.waitForTimeout(600)
      // 02d：點「Git 同步」進入 Git 設定的編輯頁
      const gitOpt = page.locator('.ant-modal-content').locator('text=Git 同步').first()
      if (await gitOpt.isVisible({ timeout: 2000 }).catch(() => false)) {
        await gitOpt.click()
        await page.waitForSelector('textarea', { timeout: 20000 }).catch(() => {})
        await waitReady(page, 2000)
        await shot(page, '02d_新增文件_Git同步_填倉庫資訊')
        await page.goto(`${BASE_URL}/admin/doc-hub?projectId=${proj1Id}&categoryId=${cat11Id}`, { timeout: 60000 })
        await waitReady(page, 1500)
      } else {
        await page.keyboard.press('Escape')
        await page.waitForTimeout(400)
      }
    }

    // 也補一張 03_新增文件Modal（與 02a 相同，保持向後相容）
    const addDocBtn4 = page.locator('button').filter({ hasText: /新增文件/ }).first()
    if (await addDocBtn4.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addDocBtn4.click()
      await page.waitForSelector('.ant-modal-content', { timeout: 8000 }).catch(() => {})
      await page.waitForTimeout(600)
      await shot(page, '03_新增文件Modal')
      await page.keyboard.press('Escape')
      await page.waitForTimeout(400)
    }
  }

  // ── 04. 編輯頁 ───────────────────────────────────────────────────────────
  console.log('\n── 04 編輯頁 ──')
  if (docPublishedId) {
    await page.goto(`${BASE_URL}/admin/doc-hub/edit/${docPublishedId}`, { timeout: 60000 })
    await page.waitForSelector('textarea', { timeout: 25000 }).catch(() => {})
    await waitReady(page, 2500)
    await shot(page, '04_編輯頁')

    // 輸入文字觸發 dirty 狀態
    const textarea = page.locator('textarea').first()
    if (await textarea.isVisible({ timeout: 3000 }).catch(() => false)) {
      await textarea.click()
      await page.keyboard.press('End')
      await page.keyboard.type('\n\n> 自動儲存運作中…')
      await page.waitForTimeout(600)
      await shot(page, '04b_編輯頁_dirty狀態')
      // 還原（Ctrl+Z 幾次）
      for (let i = 0; i < 4; i++) {
        await page.keyboard.press('Control+z')
        await page.waitForTimeout(100)
      }
    }
  }

  // ── 05. 閱讀頁 ───────────────────────────────────────────────────────────
  console.log('\n── 05 閱讀頁 ──')
  const viewDocId = docPublishedId || 2
  await page.goto(`${BASE_URL}/admin/doc-hub/view/${viewDocId}`, { timeout: 60000 })
  await page.waitForSelector('h1, h2, h3, button.ant-btn', { timeout: 25000 }).catch(() => {})
  await waitReady(page, 2500)
  await shot(page, '05_閱讀頁')

  // 捲動內部容器讓進度條出現（NocoBase 使用 overflow 容器而非 window）
  await page.evaluate(() => {
    var scrollable = Array.from(document.querySelectorAll('*')).find(function(el) {
      var s = window.getComputedStyle(el)
      return (s.overflowY === 'auto' || s.overflowY === 'scroll') && el.scrollHeight > el.clientHeight + 50
    })
    if (scrollable) { scrollable.scrollTop = 300 } else { window.scrollTo({ top: 400 }) }
  })
  await page.waitForTimeout(1200)
  await shot(page, '05b_閱讀頁_進度條')

  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }))
  await page.waitForTimeout(800)
  await shot(page, '05c_閱讀頁_底部')

  // ── 06. 版本歷史 ──────────────────────────────────────────────────────────
  console.log('\n── 06 版本歷史 ──')
  // 先在閱讀頁點「版本歷史」按鈕
  await page.goto(`${BASE_URL}/admin/doc-hub/view/${viewDocId}`, { timeout: 60000 })
  await page.waitForSelector('button', { timeout: 15000 }).catch(() => {})
  await waitReady(page, 1500)
  const histBtn = page.locator('button').filter({ hasText: /版本歷史/ }).first()
  if (await histBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await histBtn.click()
    await page.waitForSelector('.ant-table-row, [class*="version"]', { timeout: 15000 }).catch(() => {})
    await waitReady(page, 1500)
    await shot(page, '06_版本歷史')

    // 點 Diff
    const diffBtn = page.locator('button').filter({ hasText: /比較|Diff/i }).first()
    if (await diffBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await diffBtn.click()
      await page.waitForTimeout(1000)
      await shot(page, '06b_版本Diff')
      await page.keyboard.press('Escape')
      await page.waitForTimeout(400)
    }
  } else {
    await page.goto(`${BASE_URL}/admin/doc-hub/versions/${viewDocId}`, { timeout: 60000 })
    await page.waitForSelector('.ant-table-row, button', { timeout: 15000 }).catch(() => {})
    await waitReady(page, 1500)
    await page.locator('.ant-notification-close-icon').first().click({ timeout: 2000 }).catch(() => {})
    await shot(page, '06_版本歷史')
  }

  // ── 07. 文件鎖定 Modal（從列表操作欄） ───────────────────────────────────
  console.log('\n── 07 鎖定 Modal ──')
  if (proj1Id && cat11Id) {
    await page.goto(`${BASE_URL}/admin/doc-hub?projectId=${proj1Id}&categoryId=${cat11Id}`, { timeout: 60000 })
    await page.waitForSelector('tr.ant-table-row', { timeout: 15000 }).catch(() => {})
    await waitReady(page, 1500)

    // 找到草稿文件那行，點 ⋯ Dropdown
    const rows = page.locator('tr.ant-table-row')
    const rowCount = await rows.count()
    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i)
      const text = await row.textContent().catch(() => '')
      if (text && text.includes('快速上手')) {
        await row.hover()
        await page.waitForTimeout(300)
        const moreBtn = row.locator('button').filter({ hasText: '⋯' }).first()
        if (await moreBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await moreBtn.click()
          await page.waitForTimeout(600)
          await shot(page, '07_操作欄Dropdown')
          // 點鎖定
          const lockItem = page.locator('.ant-dropdown-menu-item').filter({ hasText: /鎖定文件/ }).first()
          if (await lockItem.isVisible({ timeout: 2000 }).catch(() => false)) {
            await lockItem.click()
            await page.waitForTimeout(800)
            await shot(page, '07b_鎖定確認Modal')
            await page.keyboard.press('Escape')
            await page.waitForTimeout(400)
          } else {
            await page.keyboard.press('Escape')
          }
        }
        break
      }
    }
  }

  // ── 08. 鎖定文件閱讀頁 ────────────────────────────────────────────────────
  console.log('\n── 08 鎖定文件 ──')
  if (docLockedId) {
    await page.goto(`${BASE_URL}/admin/doc-hub/view/${docLockedId}`, { timeout: 60000 })
    await page.waitForSelector('h1, h2, button', { timeout: 20000 }).catch(() => {})
    await waitReady(page, 2000)
    await shot(page, '08_鎖定文件閱讀頁')
  }

  // ── 09. 含鎖定標示的列表 ─────────────────────────────────────────────────
  console.log('\n── 09 列表含鎖定 ──')
  await page.goto(proj1Id ? `${BASE_URL}/admin/doc-hub?projectId=${proj1Id}` : `${BASE_URL}/admin/doc-hub`, { timeout: 60000 })
  await page.waitForSelector('tr.ant-table-row, .ant-empty', { timeout: 15000 }).catch(() => {})
  await waitReady(page, 2000)
  await shot(page, '09_列表含鎖定標示')

  // ── 10. 移動文件 Modal（必填提示） ───────────────────────────────────────
  console.log('\n── 10 移動文件 Modal ──')
  if (proj1Id && cat11Id) {
    await page.goto(`${BASE_URL}/admin/doc-hub?projectId=${proj1Id}&categoryId=${cat11Id}`, { timeout: 60000 })
    await page.waitForSelector('tr.ant-table-row', { timeout: 15000 }).catch(() => {})
    await waitReady(page, 1500)

    const rows2 = page.locator('tr.ant-table-row')
    const rc2 = await rows2.count()
    for (let i = 0; i < rc2; i++) {
      const row = rows2.nth(i)
      await row.hover()
      await page.waitForTimeout(200)
      const moreBtn = row.locator('button').filter({ hasText: '⋯' }).first()
      if (await moreBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
        await moreBtn.click()
        await page.waitForTimeout(500)
        const moveItem = page.locator('.ant-dropdown-menu-item').filter({ hasText: /移動/ }).first()
        if (await moveItem.isVisible({ timeout: 1500 }).catch(() => false)) {
          await moveItem.click()
          await page.waitForTimeout(800)
          await shot(page, '10_移動文件Modal')
          // 點確認但沒選資料夾，觸發必填提示
          const confirmBtn = page.locator('button').filter({ hasText: /確認移動/ }).first()
          if (await confirmBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
            await confirmBtn.click()
            await page.waitForTimeout(600)
            await shot(page, '10b_移動必填提示')
          }
          await page.keyboard.press('Escape')
          await page.waitForTimeout(400)
          break
        } else {
          await page.keyboard.press('Escape')
        }
        break
      }
    }
  }

  // ── 11. 稽核日誌 ──────────────────────────────────────────────────────────
  console.log('\n── 11 稽核日誌 ──')
  await page.goto(proj1Id ? `${BASE_URL}/admin/doc-hub?projectId=${proj1Id}` : `${BASE_URL}/admin/doc-hub`, { timeout: 60000 })
  await waitReady(page, 1500)
  // 側邊欄底部的稽核日誌連結（div[title="稽核日誌"] 或含文字的 div）
  const auditLink = page.locator('[title="稽核日誌"], div').filter({ hasText: /^稽核日誌$/ }).last()
  if (await auditLink.isVisible({ timeout: 3000 }).catch(() => false)) {
    await auditLink.click()
    await page.waitForSelector('.ant-modal-content, .ant-table-row', { timeout: 8000 }).catch(() => {})
    await waitReady(page, 1500)
    await shot(page, '11_稽核日誌')
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)
  } else {
    console.log('  ⚠️ 找不到稽核日誌連結，截目前畫面')
    await shot(page, '11_稽核日誌')
  }

  // ── 12. 範本管理頁 ────────────────────────────────────────────────────────
  console.log('\n── 12 範本管理頁 ──')
  await page.goto(`${BASE_URL}/admin/doc-hub/templates`, { timeout: 60000 })
  await page.waitForSelector('button, .ant-empty, .ant-table, table', { timeout: 15000 }).catch(() => {})
  await waitReady(page, 2000)
  await shot(page, '12_範本管理頁')

  // ── 13. 範本建構器 Modal ──────────────────────────────────────────────────
  console.log('\n── 13 範本建構器 ──')
  const newTplBtn = page.locator('button').filter({ hasText: /建立範本|新增範本/ }).first()
  if (await newTplBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await newTplBtn.click()
    await page.waitForTimeout(1000)
    await shot(page, '13_範本建構器Modal')
    // 切換到 JSON 視圖
    const jsonTab = page.locator('button, [role="tab"]').filter({ hasText: /JSON|原始碼/ }).first()
    if (await jsonTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await jsonTab.click()
      await page.waitForTimeout(600)
      await shot(page, '13b_範本建構器JSON視圖')
    }
    await page.keyboard.press('Escape')
    await page.waitForTimeout(400)
  }

  // ── 14. 填寫範本頁 ────────────────────────────────────────────────────────
  console.log('\n── 14 填寫範本頁 ──')
  // 用 beforeAll 建立的 demoTemplateId 帶入 URL
  if (demoTemplateId) {
    const qs = `templateId=${demoTemplateId}&projectId=${proj1Id || ''}&categoryId=${cat11Id || ''}`
    await page.goto(`${BASE_URL}/admin/doc-hub/template-fill/new?${qs}`, { timeout: 60000 })
    await page.waitForSelector('input, .ant-form-item, h2', { timeout: 20000 }).catch(() => {})
    await waitReady(page, 2000)
    // 填入示範資料讓截圖更豐富
    const nameInput = page.locator('input').first()
    if (await nameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await nameInput.fill('陳大明')
    }
    await page.waitForTimeout(500)
  } else {
    await page.goto(`${BASE_URL}/admin/doc-hub/template-fill/new?projectId=${proj1Id || ''}`, { timeout: 60000 })
    await waitReady(page, 2000)
  }
  await shot(page, '14_填寫範本頁')

  // ── 15. 專案權限 Modal ────────────────────────────────────────────────────
  console.log('\n── 15 專案權限 Modal ──')
  // 進入專案頁面（不選資料夾，這樣 InfoBar 顯示專案層按鈕）
  await page.goto(proj1Id ? `${BASE_URL}/admin/doc-hub?projectId=${proj1Id}` : `${BASE_URL}/admin/doc-hub`, { timeout: 60000 })
  await page.waitForSelector('tr.ant-table-row, .ant-empty', { timeout: 15000 }).catch(() => {})
  await waitReady(page, 2000)
  // InfoBar 的「權限」按鈕（文字是「權限」，有 LockOutlined icon）
  const permBtn = page.locator('button').filter({ hasText: /^權限$/ }).first()
  if (await permBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await permBtn.click()
    const modalVisible = await page.locator('.ant-modal-content').waitFor({ state: 'visible', timeout: 8000 }).then(() => true).catch(() => false)
    console.log(`  專案權限 Modal 出現: ${modalVisible}`)
    if (modalVisible) {
      await waitReady(page, 800)
      await shot(page, '15_專案權限Modal')
    } else {
      console.log('  ⚠️ Modal 未出現，截目前畫面')
      await shot(page, '15_專案權限Modal')
    }
    await page.keyboard.press('Escape')
    await page.waitForTimeout(400)
  } else {
    console.log('  ⚠️ 找不到「權限」按鈕，截目前畫面')
    await shot(page, '15_專案權限Modal')
  }

  // ── 15b. 資料夾權限 Modal ─────────────────────────────────────────────────
  console.log('\n── 15b 資料夾權限 Modal ──')
  // 策略：用 ?projectId=xxx&categoryId=yyy URL 讓頁面初始化時就有 activeCatId
  // 這樣就不需要點 sidebar，避免 React state 更新時機問題
  const catPermUrl = (proj1Id && cat11Id)
    ? `${BASE_URL}/admin/doc-hub?projectId=${proj1Id}&categoryId=${cat11Id}`
    : proj1Id
      ? `${BASE_URL}/admin/doc-hub?projectId=${proj1Id}`
      : `${BASE_URL}/admin/doc-hub`
  console.log(`  URL: ${catPermUrl}`)
  await page.goto(catPermUrl, { timeout: 60000 })
  // 等資料載入完成：activeCatId 存在時「新增文件」按鈕是可點擊的（不是 disabled）
  await page.waitForFunction(() => {
    const btns = Array.from(document.querySelectorAll('button'))
    const newDocBtn = btns.find(b => b.textContent?.includes('新增文件'))
    return newDocBtn && !newDocBtn.disabled
  }, { timeout: 15000 }).catch(() => {})
  await waitReady(page, 1500)

  // 列出所有 button 文字，幫助 debug
  const allBtnTexts = await page.locator('button').evaluateAll((btns: HTMLButtonElement[]) =>
    btns.map(b => b.textContent?.trim()).filter(Boolean)
  )
  console.log(`  按鈕清單: ${allBtnTexts.slice(0, 10).join(' | ')}`)

  // 找「權限」按鈕（資料夾層）
  const catPermBtn = page.locator('button').filter({ hasText: /^權限$/ }).first()
  if (await catPermBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await catPermBtn.click()
    const modalVisible = await page.locator('.ant-modal-content').waitFor({ state: 'visible', timeout: 8000 }).then(() => true).catch(() => false)
    const modalTitle = await page.locator('.ant-modal-title, .ant-modal-content').first().textContent().catch(() => '')
    console.log(`  Modal 出現: ${modalVisible}, 標題: "${modalTitle?.substring(0, 50)}"`)
    if (modalVisible) {
      await waitReady(page, 800)
      await shot(page, '15b_資料夾權限Modal_繼承模式')
      // 切換到自訂模式（第二個 radio）
      const radios = page.locator('.ant-modal-content input[type="radio"]')
      const radioCount = await radios.count()
      console.log(`  radio 數量: ${radioCount}`)
      if (radioCount >= 2) {
        await radios.nth(1).click()
        await page.waitForTimeout(800)
        await shot(page, '15c_資料夾權限Modal_自訂模式')
      }
      await page.keyboard.press('Escape')
      await page.waitForTimeout(400)
    } else {
      console.log('  ⚠️ Modal 未出現')
      await shot(page, '15b_資料夾權限Modal_繼承模式')
    }
  } else {
    console.log('  ⚠️ 找不到「權限」按鈕，按鈕清單：', allBtnTexts)
    await shot(page, '15b_資料夾權限Modal_繼承模式')
  }

  // ── 16. Git 同步欄展示 ────────────────────────────────────────────────────
  console.log('\n── 16 Git 同步 ──')
  if (proj1Id && cat12Id) {
    await page.goto(`${BASE_URL}/admin/doc-hub?projectId=${proj1Id}&categoryId=${cat12Id}`, { timeout: 60000 })
    await page.waitForSelector('tr.ant-table-row, .ant-empty', { timeout: 15000 }).catch(() => {})
    await waitReady(page, 2000)
    await shot(page, '16_列表Git同步欄')
  }

  // ── 17. 側邊欄（展開所有資料夾） ─────────────────────────────────────────
  console.log('\n── 17 側邊欄 ──')
  await page.goto(proj1Id ? `${BASE_URL}/admin/doc-hub?projectId=${proj1Id}` : `${BASE_URL}/admin/doc-hub`, { timeout: 60000 })
  await waitReady(page, 2000)
  // 先瀏覽幾個頁面讓最近查看有內容
  if (docPublishedId) {
    await page.goto(`${BASE_URL}/admin/doc-hub/view/${docPublishedId}`, { timeout: 60000 })
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)
  }
  await page.goto(proj2Id ? `${BASE_URL}/admin/doc-hub?projectId=${proj2Id}` : `${BASE_URL}/admin/doc-hub`, { timeout: 60000 })
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(500)
  await page.goto(proj1Id ? `${BASE_URL}/admin/doc-hub?projectId=${proj1Id}` : `${BASE_URL}/admin/doc-hub`, { timeout: 60000 })
  await page.waitForSelector('tr.ant-table-row, .ant-empty', { timeout: 15000 }).catch(() => {})
  await waitReady(page, 2000)
  // 截側邊欄
  const sidebar = page.locator('[style*="width:260px"], [style*="width: 260px"]').first()
  const sidebarAlt = page.locator('div').filter({ hasText: /最近查看/ }).first()
  const el = await sidebar.isVisible({ timeout: 1000 }).catch(() => false)
    ? sidebar : sidebarAlt
  if (await el.isVisible({ timeout: 1000 }).catch(() => false)) {
    await el.screenshot({ path: path.join(SHOT_DIR, '17_側邊欄.png') })
    console.log('  📸 17_側邊欄.png')
  } else {
    await shot(page, '17_側邊欄_整頁')
  }

  // ── 18. 編輯頁 Git 資訊列 ────────────────────────────────────────────────
  console.log('\n── 18 編輯頁 Git 資訊 ──')
  if (docPublishedId) {
    await page.goto(`${BASE_URL}/admin/doc-hub/edit/${docPublishedId}`, { timeout: 60000 })
    await page.waitForSelector('textarea', { timeout: 25000 }).catch(() => {})
    await waitReady(page, 2500)
    await shot(page, '18_編輯頁Git資訊列')
  }

  // ── 19. 全頁總覽（多個專案的列表）─────────────────────────────────────────
  console.log('\n── 19 全頁總覽 ──')
  await page.goto(`${BASE_URL}/admin/doc-hub`, { timeout: 60000 })
  await page.waitForSelector('tr.ant-table-row, .ant-empty', { timeout: 15000 }).catch(() => {})
  await waitReady(page, 2500)
  await shot(page, '19_首頁_全部文件')
  await shotFull(page, '19b_首頁_全頁')

  // ── 完成 ──────────────────────────────────────────────────────────────────
  const files = fs.readdirSync(SHOT_DIR).filter(f => f.endsWith('.png'))
  console.log(`\n✅ 截圖完成，共 ${files.length} 張`)
  console.log(`📁 ${SHOT_DIR}`)
  files.forEach(f => console.log(`  ${f}`))
})
