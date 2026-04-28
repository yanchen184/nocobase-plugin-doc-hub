/**
 * Story 章節 3：從零建一個範本（Template Builder 完整展現）
 *
 * 流程：
 *   進「範本管理」頁 → 點「建立範本」 → 開啟 TemplateBuilderModal
 *   → 填名稱、新增 4 個不同類型欄位（text/textarea/select/date）
 *   → 切換到 JSON 模式（展示視覺/JSON 雙向）→ 切回視覺模式
 *   → 儲存 → 列表看到剛建好的範本
 *
 * 範本名稱 [STORY] 上版單，後續 Ch4 用它建文件
 */

import { test, expect } from '@playwright/test'
import { loginAsAdmin } from '../fixtures/auth'
import { ApiHelper } from '../fixtures/api'
import { waitReady, shot, ensureDir } from '../fixtures/shot'
import * as path from 'path'
import * as fs from 'fs'

const SHOT_DIR = path.join(__dirname, '../artifacts/manual-shots/story')
ensureDir(SHOT_DIR)
const STATE_FILE = path.join(__dirname, '../artifacts/story-state.json')

const PREFIX = '[STORY]'
const TEMPLATE_NAME = `${PREFIX} 上版單`

test.setTimeout(300000)

let api: ApiHelper

test.beforeAll(async () => {
  api = await ApiHelper.create()
})
test.afterAll(async () => {
  if (api) await api.dispose()
})

// ── Ch3：建立範本 ────────────────────────────────────────────

test('ch3-01: 進入範本管理頁（空 / 既有範本列表）', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await loginAsAdmin(page)
  await page.goto('/admin/doc-hub/templates', { timeout: 60000 })
  await waitReady(page, 2500)
  await shot(page, 'story', 'ch3_01_範本管理頁')
})

test('ch3-02: 點「建立範本」打開 Builder Modal', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await loginAsAdmin(page)
  await page.goto('/admin/doc-hub/templates', { timeout: 60000 })
  await waitReady(page, 2500)

  const createBtn = page.locator('button').filter({ hasText: /^建立範本$/ }).first()
  await createBtn.click({ force: true, timeout: 8000 })
  await page.waitForSelector('.ant-modal-content', { timeout: 8000 })
  await waitReady(page, 1500)
  await shot(page, 'story', 'ch3_02_範本Builder_空白')
})

test('ch3-03: 填基本資訊 + 新增 4 個欄位（視覺模式）', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await loginAsAdmin(page)
  await page.goto('/admin/doc-hub/templates', { timeout: 60000 })
  await waitReady(page, 2500)

  // 開 builder
  await page.locator('button').filter({ hasText: /^建立範本$/ }).first().click({ force: true })
  await page.waitForSelector('.ant-modal-content', { timeout: 8000 })
  await waitReady(page, 1500)

  // 填範本名稱（modal 內第一個 Input — 範本名稱）
  const modalContent = page.locator('.ant-modal-content')
  const inputs = modalContent.locator('input.ant-input')
  await inputs.nth(0).fill(TEMPLATE_NAME)
  await page.waitForTimeout(300)

  // 第 2 個 Input 是 description（在 grid 之外的 row）— 找含 placeholder 的
  const descInput = modalContent.locator('input.ant-input').filter({ hasNot: page.locator('text=範本名稱') }).nth(1)
  if (await descInput.isVisible({ timeout: 1000 }).catch(() => false)) {
    await descInput.fill('上版前的標準上版單，記錄版本號、變更內容、影響範圍、上版時間')
  }

  // 連按 4 次「新增欄位」
  const addFieldBtn = modalContent.locator('button').filter({ hasText: /^新增欄位$/ }).first()
  for (let i = 0; i < 4; i++) {
    await addFieldBtn.click({ force: true })
    await page.waitForTimeout(400)
  }

  // 4 個 row 的「標籤」輸入框（小尺寸 input，placeholder='例：版本號'）
  const labelInputs = modalContent.locator('input[placeholder*="版本號"]')
  const count = await labelInputs.count()
  if (count >= 1) await labelInputs.nth(0).fill('版本號')
  if (count >= 2) await labelInputs.nth(1).fill('變更內容')
  if (count >= 3) await labelInputs.nth(2).fill('影響範圍')
  if (count >= 4) await labelInputs.nth(3).fill('上版時間')
  await page.waitForTimeout(500)

  // 變更欄位類型：依序點開 select、選對應 option
  // 第 0 個 select 是「預設資料夾」，1~4 才是欄位類型
  // 注意：絕對不要按 ESC，會把整個 modal 關掉
  async function changeType(idx: number, optLabel: RegExp) {
    const sel = modalContent.locator('.ant-select-selector').nth(idx)
    await sel.click({ force: true })
    await page.waitForTimeout(500)
    const opt = page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option').filter({ hasText: optLabel }).first()
    if (await opt.isVisible({ timeout: 3000 }).catch(() => false)) {
      await opt.click({ force: true })
    } else {
      // dropdown 沒開或關了 — 點空白處關閉，繼續下一個
      await page.locator('.ant-modal-header').click({ force: true }).catch(() => {})
    }
    await page.waitForTimeout(400)
  }

  await changeType(2, /多行/)
  await changeType(3, /^單選$/)
  await changeType(4, /^日期$/)

  // 「影響範圍」（單選）options textarea
  const optsTextarea = modalContent.locator('textarea[placeholder*="開發"]').first()
  if (await optsTextarea.isVisible({ timeout: 1500 }).catch(() => false)) {
    await optsTextarea.fill('開發=dev\n測試=staging\n正式=prod')
    await page.waitForTimeout(400)
  }

  await waitReady(page, 1000)
  await shot(page, 'story', 'ch3_03_範本Builder_視覺模式_已填四欄位')
})

test('ch3-04: 切換到 JSON 模式（展示原始定義）', async ({ page }) => {
  // 重複前面流程到「填好 4 個欄位」
  await page.setViewportSize({ width: 1440, height: 900 })
  await loginAsAdmin(page)
  await page.goto('/admin/doc-hub/templates', { timeout: 60000 })
  await waitReady(page, 2500)

  await page.locator('button').filter({ hasText: /^建立範本$/ }).first().click({ force: true })
  await page.waitForSelector('.ant-modal-content', { timeout: 8000 })
  await waitReady(page, 1500)

  const modal = page.locator('.ant-modal-content')
  await modal.locator('input.ant-input').nth(0).fill(TEMPLATE_NAME)
  const addBtn = modal.locator('button').filter({ hasText: /^新增欄位$/ }).first()
  for (let i = 0; i < 3; i++) { await addBtn.click({ force: true }); await page.waitForTimeout(300) }
  const labels = modal.locator('input[placeholder*="版本號"]')
  await labels.nth(0).fill('版本號')
  await labels.nth(1).fill('變更內容')
  await labels.nth(2).fill('上版時間')
  await page.waitForTimeout(500)

  // 點「切換 JSON 模式」
  const toJsonBtn = modal.locator('button').filter({ hasText: /^切換 JSON 模式$/ }).first()
  await toJsonBtn.click({ force: true })
  await page.waitForTimeout(800)
  await shot(page, 'story', 'ch3_04_範本Builder_JSON模式')
})

test('ch3-05: 儲存範本 → 列表頁看到新範本', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })

  // 先 API 建範本（穩定，避免 UI flake）
  // 直接用 ApiHelper.client，沒有 helper 就用 client.request
  const fields = [
    { id: 'f1', type: 'text', label: '版本號', name: 'version', required: true, defaultValue: '', options: [] },
    { id: 'f2', type: 'textarea', label: '變更內容', name: 'changes', required: true, defaultValue: '', options: [] },
    {
      id: 'f3', type: 'select', label: '影響範圍', name: 'scope', required: false, defaultValue: '',
      options: [
        { label: '開發', value: 'dev' },
        { label: '測試', value: 'staging' },
        { label: '正式', value: 'prod' },
      ],
    },
    { id: 'f4', type: 'date', label: '上版時間', name: 'deploy_at', required: false, defaultValue: '', options: [] },
  ]
  // 透過 API 建立
  const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'))
  const tpl: any = await api.createTemplate({
    name: TEMPLATE_NAME,
    description: '上版前的標準上版單，記錄版本號、變更內容、影響範圍、上版時間',
    fields,
    listDisplayFields: ['version', 'scope'],
    defaultCategoryId: null,
    projectId: state.projectId,
  }).catch((e: any) => { console.warn('createTemplate error:', e?.message); return null })

  if (tpl?.id) {
    state.templateId = tpl.id
    state.templateName = TEMPLATE_NAME
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2))
    console.log(`  📝 已建立範本 #${tpl.id}：${TEMPLATE_NAME}`)
  } else {
    console.warn('  ⚠️ 範本建立失敗（可能已存在），繼續截圖')
  }

  await loginAsAdmin(page)
  await page.goto('/admin/doc-hub/templates', { timeout: 60000 })
  await waitReady(page, 2500)
  await shot(page, 'story', 'ch3_05_範本管理頁_看見新範本')
})
