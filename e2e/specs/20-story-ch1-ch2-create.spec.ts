/**
 * Story 章節 1+2：從零建立專案 → 4 種建立文件方式
 *
 * Ch1：建立「示範專案」+ 看到自動產生的 6 個資料夾
 * Ch2：示範 4 種建立文件的方式（自由撰寫、從檔案匯入、Git 同步、使用範本最後再展示）
 *
 * 注意：使用範本的部分留到 Ch4，因為要先在 Ch3 建立範本
 */

import { test, expect } from '@playwright/test'
import { loginAsAdmin } from '../fixtures/auth'
import { ApiHelper, CleanupStack } from '../fixtures/api'
import { waitReady, shot, shotFull, ensureDir } from '../fixtures/shot'
import * as path from 'path'
import * as fs from 'fs'

const SHOT_DIR = path.join(__dirname, '../artifacts/manual-shots/story')
ensureDir(SHOT_DIR)
const STATE_FILE = path.join(__dirname, '../artifacts/story-state.json')

const BASE_URL = process.env.BASE_URL || 'http://localhost:13000'
const PREFIX = '[STORY]'
const PROJECT_NAME = `${PREFIX} 示範專案`
// 用 hasText 字串（包含「示範專案」即可），避免 [STORY] 的 [] 在 RegExp 被當 character class
const PROJECT_HAS_TEXT = '示範專案'

test.setTimeout(300000)

let api: ApiHelper
let cleanup: CleanupStack

test.beforeAll(async () => {
  api = await ApiHelper.create()
  cleanup = new CleanupStack()
})

test.afterAll(async () => {
  // story 流程資料保留下來給後續 ch3-ch8 使用，最後在 ch8 結束時統一清理
  if (api) await api.dispose()
})

/** 完整導航：登入 → 進首頁 → 展開「專案」group → 進 STORY 示範專案 → 點主內容區的資料夾 tab */
async function navigateToCategory(page, categoryName = '01_提案與規劃') {
  await loginAsAdmin(page)
  await page.goto('/admin/doc-hub', { timeout: 60000 })
  await waitReady(page, 2500)

  // 1. 展開「專案」group
  const groupSpan = page.locator('span').filter({ hasText: /^🗂\s*專案$|^專案$/ }).first()
  if (await groupSpan.isVisible({ timeout: 3000 }).catch(() => false)) {
    await groupSpan.click({ force: true })
    await waitReady(page, 1000)
  }
  // 2. 點 STORY 專案（顯示專案詳情頁 + folder tabs）
  const projSpan = page.locator('span').filter({ hasText: PROJECT_HAS_TEXT }).first()
  await projSpan.click({ force: true })
  await waitReady(page, 2000)
  // 3. 點 folder tab（主內容區，直接 setActiveCatId）
  // tab 結構：div 內含 📁 icon + cat.name + 數字 badge，目標是抓到含 categoryName 的可點 tab div
  const tabDiv = page.locator('div').filter({ hasText: new RegExp(`^📁\\s*${categoryName}\\s*\\d+$`) }).first()
  await tabDiv.click({ force: true, timeout: 8000 })
  await waitReady(page, 1500)
}

// ── Ch1：從零建立專案 ────────────────────────────────────────────

test('ch1-01: 開啟 DocHub 主頁（空狀態 / 既有專案列表）', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await loginAsAdmin(page)

  await page.goto('/admin/doc-hub', { timeout: 60000 })
  await page.waitForSelector('.ant-table, h1, h2, h3', { timeout: 25000 }).catch(() => {})
  await waitReady(page, 2500)
  await shot(page, 'story', 'ch1_01_首頁全部文件')
})

test('ch1-02: 建立新專案 — 點側邊欄「新增專案」按鈕', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await loginAsAdmin(page)
  await page.goto('/admin/doc-hub', { timeout: 60000 })
  await waitReady(page, 2000)

  // 點「新增專案」按鈕（可能在側邊欄頂部或右上角）
  const newBtn = page.locator('button').filter({ hasText: /新增專案|建立專案|新建專案/ }).first()
  if (await newBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await newBtn.click({ force: true })
    await page.waitForSelector('.ant-modal-content', { timeout: 8000 }).catch(() => {})
    await waitReady(page, 1200)
    await shot(page, 'story', 'ch1_02_新增專案Modal')
  } else {
    // fallback：直接拍頁面，標示找不到按鈕
    console.warn('  ⚠️ 找不到 新增專案 按鈕，截目前頁面')
    await shot(page, 'story', 'ch1_02_新增專案Modal_未找到按鈕')
  }
})

test('ch1-03: 透過 API 建立示範專案（記錄 ID 給後續章節）', async ({ page }) => {
  // 取得「專案」群組 id（server 強制 groupId 必填）
  const groups = await api.listGroups()
  const projectGroup = groups.find((g: any) => g.name === '專案') || groups[0]
  if (!projectGroup) throw new Error('找不到「專案」群組，請先確認 docGroups 有預設資料')

  // 重建邏輯：先刪掉所有同名專案（避免重複），再建一個新的
  const existingProjects = await api.listProjects()
  const dupes = existingProjects.filter((p: any) => p.name === PROJECT_NAME)
  for (const p of dupes) {
    await api.deleteProject(p.id).catch(() => {})
    console.log(`  🗑️  清除舊專案 #${p.id}`)
  }

  // 用 API 建（穩定），UI 截圖在 ch1_02 已展示流程
  const project = await api.createProject({
    name: PROJECT_NAME,
    description: '完整功能展示用的示範專案',
    groupId: projectGroup.id,
  })

  // 寫入 state，給後面 ch 使用
  fs.writeFileSync(
    STATE_FILE,
    JSON.stringify({ projectId: project.id, projectName: PROJECT_NAME }, null, 2),
  )
  console.log(`  📝 已建立專案 #${project.id}：${PROJECT_NAME}`)

  // 登入並截側邊欄看到新專案出現的畫面
  await page.setViewportSize({ width: 1440, height: 900 })
  await loginAsAdmin(page)
  await page.goto('/admin/doc-hub', { timeout: 60000 })
  await waitReady(page, 2500)

  // 先展開「專案」group
  const groupSpan = page.locator('span').filter({ hasText: /^🗂\s*專案$|^專案$/ }).first()
  if (await groupSpan.isVisible({ timeout: 3000 }).catch(() => false)) {
    await groupSpan.click({ force: true })
    await waitReady(page, 1200)
  }
  const projSpan = page.locator('span').filter({ hasText: PROJECT_HAS_TEXT }).first()
  if (await projSpan.isVisible({ timeout: 3000 }).catch(() => false)) {
    await projSpan.scrollIntoViewIfNeeded().catch(() => {})
  }
  await waitReady(page, 800)
  await shot(page, 'story', 'ch1_03_側邊欄顯示新專案')
})

test('ch1-04: 點進新專案 — 看到自動產生的 6 個資料夾', async ({ page }) => {
  const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'))
  await page.setViewportSize({ width: 1440, height: 900 })
  await loginAsAdmin(page)
  await page.goto('/admin/doc-hub', { timeout: 60000 })
  await waitReady(page, 2500)

  // 先展開「專案」group（側邊欄需要點群組標題才會列出底下的專案）
  const groupSpan = page.locator('span').filter({ hasText: /^🗂\s*專案$|^專案$/ }).first()
  if (await groupSpan.isVisible({ timeout: 3000 }).catch(() => false)) {
    await groupSpan.click({ force: true })
    await waitReady(page, 1200)
  }
  const projSpan = page.locator('span').filter({ hasText: PROJECT_HAS_TEXT }).first()
  await projSpan.click({ force: true })
  await waitReady(page, 2000)
  await shot(page, 'story', 'ch1_04_專案頁_六個預設資料夾')

  // 全頁完整截圖
  await shotFull(page, 'story', 'ch1_04b_專案頁_全頁')

  // 額外：展開 sidebar 內 [STORY] 示範專案 的資料夾樹，驗證排序 01 → 99
  // 在 DOM 找：包含「📁」+「[STORY]」的 row，內的 ❯ 箭頭
  const clicked = await page.evaluate(() => {
    const spans = Array.from(document.querySelectorAll('span'))
    // 找包含 "📁" 和 "[STORY]" 文字的專案標題 span
    const titleSpan = spans.find(s => /📁/.test(s.textContent || '') && /\[STORY\]/.test(s.textContent || ''))
    if (!titleSpan) return false
    // 它的父 row（含 ❯ 箭頭）
    const row = titleSpan.parentElement
    if (!row) return false
    const arrow = Array.from(row.querySelectorAll('span')).find(s => (s.textContent || '').trim() === '❯')
    if (!arrow) return false
    ;(arrow as HTMLElement).click()
    return true
  })
  if (clicked) await waitReady(page, 1200)
  await shot(page, 'story', 'ch1_04c_sidebar_資料夾展開')

  // 額外：點 sidebar 中「共用知識庫 / 01_技術領域」專案，驗證它也套用了 SDLC 預設資料夾
  await page.goto('/admin/doc-hub', { timeout: 60000 })
  await waitReady(page, 1500)
  // 展開「共用知識庫」群組（如尚未展開）
  await page.evaluate(() => {
    const spans = Array.from(document.querySelectorAll('span'))
    const groupSpan = spans.find(s => /共用知識庫/.test(s.textContent || '') && !/📁/.test(s.textContent || ''))
    const row = groupSpan?.parentElement
    const arrow = row && Array.from(row.querySelectorAll('span')).find(s => (s.textContent || '').trim() === '❯')
    if (arrow) (arrow as HTMLElement).click()
  })
  await waitReady(page, 800)
  // 點「01_技術領域」專案標題（不是 ❯ 箭頭）
  await page.evaluate(() => {
    const spans = Array.from(document.querySelectorAll('span'))
    const titleSpan = spans.find(s => /📁/.test(s.textContent || '') && /01_技術領域/.test(s.textContent || ''))
    if (titleSpan) (titleSpan as HTMLElement).click()
  })
  await waitReady(page, 2500)
  await shot(page, 'story', 'ch1_04d_共用知識庫_預設資料夾')
})

// ── Ch2：4 種建立文件方式 ────────────────────────────────────────

test('ch2-01: 點「新增文件」打開 Modal（顯示 4 種方式）', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await navigateToCategory(page, '01_提案與規劃')

  const newDocBtn = page.locator('button').filter({ hasText: /^新增文件$/ }).first()
  await newDocBtn.click({ force: true })
  await page.waitForSelector('.ant-modal-content', { timeout: 8000 }).catch(() => {})
  await waitReady(page, 1500)
  await shot(page, 'story', 'ch2_01_新增方式選擇Modal')
})

test('ch2-02a: 第一種方式 — 自由撰寫（空白編輯頁）', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await navigateToCategory(page, '01_提案與規劃')

  await page.locator('button').filter({ hasText: /^新增文件$/ }).first().click({ force: true })
  await page.waitForSelector('.ant-modal-content', { timeout: 8000 }).catch(() => {})
  await waitReady(page, 1000)

  // 點「自由撰寫」card
  const freeCard = page.locator('.ant-modal-content').locator('text=自由撰寫').first()
  await freeCard.click({ force: true })
  await page.waitForSelector('textarea', { timeout: 15000 }).catch(() => {})
  await waitReady(page, 2000)

  // 填示範內容
  const titleInput = page.locator('input.ant-input').first()
  if (await titleInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await titleInput.click({ force: true })
    await titleInput.fill(`${PREFIX} 自由撰寫示範`)
  }
  const textarea = page.locator('textarea').first()
  if (await textarea.isVisible({ timeout: 3000 }).catch(() => false)) {
    await textarea.click({ force: true })
    await textarea.fill('# 用「自由撰寫」方式建立的文件\n\n直接寫 Markdown，最自由的方式。\n\n- 支援所有 Markdown 語法\n- 即時預覽\n- Cmd+S 自動儲存')
    await waitReady(page, 1200)
  }
  await shot(page, 'story', 'ch2_02a_自由撰寫_編輯頁')
})

test('ch2-02b: 第二種方式 — 從檔案匯入（Word/Excel/PDF）', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await navigateToCategory(page, '01_提案與規劃')

  await page.locator('button').filter({ hasText: /^新增文件$/ }).first().click({ force: true })
  await page.waitForSelector('.ant-modal-content', { timeout: 8000 }).catch(() => {})
  await waitReady(page, 1500)
  // 在 modal 開啟狀態截圖（顯示 4 種方式 — 含「從檔案匯入」card）
  await shot(page, 'story', 'ch2_02b_四種方式Modal')

  // 點「從檔案匯入」
  const importCard = page.locator('.ant-modal-content').locator('text=從檔案匯入').first()
  if (await importCard.isVisible({ timeout: 2000 }).catch(() => false)) {
    await importCard.click({ force: true })
    await waitReady(page, 1500)
    await shot(page, 'story', 'ch2_02b2_從檔案匯入_上傳介面')
  }
})

test('ch2-02c: 第三種方式 — Git 同步（從 GitLab 拉檔）', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await navigateToCategory(page, '01_提案與規劃')

  await page.locator('button').filter({ hasText: /^新增文件$/ }).first().click({ force: true })
  await page.waitForSelector('.ant-modal-content', { timeout: 8000 }).catch(() => {})
  await waitReady(page, 1500)

  // 點「Git 同步」
  const gitCard = page.locator('.ant-modal-content').locator('text=Git 同步').first()
  if (await gitCard.isVisible({ timeout: 2000 }).catch(() => false)) {
    await gitCard.click({ force: true })
    await waitReady(page, 1800)
    await shot(page, 'story', 'ch2_02c_Git同步_填倉庫資訊')
  } else {
    console.warn('  ⚠️ 找不到 Git 同步選項')
    await shot(page, 'story', 'ch2_02c_Git同步_未找到')
  }
})
