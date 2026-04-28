import { test } from '@playwright/test'
import { loginAsAdmin } from '../fixtures/auth'
import { waitReady, shot, shotFull } from '../fixtures/shot'
import * as path from 'path'

/**
 * MANUAL.md 第 12 章：附件管理（PDF / Word / Excel）
 *  - 01_edit_toolbar_attach_btn：編輯頁工具列「📎 附件」按鈕
 *  - 02_edit_after_pdf_insert：編輯框內貼了 !pdf[...] 語法
 *  - 03_view_pdf_embed：閱讀頁內嵌 PDF iframe 檢視器
 *  - 04_view_file_link_cards：閱讀頁的附件卡片（Word / PDF 連結）
 */

test.setTimeout(240000)

const DEMO_DOC_ID = 640

test('ch12attachments: 附件（PDF/Word）', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await loginAsAdmin(page)
  page.on('dialog', (d) => d.dismiss().catch(() => {}))

  // ── 01. 編輯頁工具列（聚焦在 toolbar） ───────────────────────────
  await page.goto(`/admin/doc-hub/edit/${DEMO_DOC_ID}`, { timeout: 60000 })
  await page.waitForSelector('#dochub-editor', { timeout: 30000 })
  await waitReady(page, 2000)

  // 捲到最上方，讓 toolbar 入鏡
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(500)

  // hover 到 📎 按鈕，讓 tooltip 冒出
  const attachBtn = page.locator('button[title*="附件"], .ant-tooltip-open').first()
  const fallbackBtn = page.locator('button >> text=📎').first()
  const btn = (await attachBtn.count()) ? attachBtn : fallbackBtn
  if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await btn.hover().catch(() => {})
    await page.waitForTimeout(800)
  }
  await shot(page, 'ch12', '01_edit_toolbar_attach_btn')

  // ── 02. 編輯框內的 Markdown 語法展示 ───────────────────────────────
  // 直接在畫面上看到 `!pdf[...]` 與 `[📎 ...](...)`
  await page.waitForTimeout(500)
  await shot(page, 'ch12', '02_edit_with_attachment_md')

  // ── 03. 閱讀頁：PDF 內嵌 + 附件卡片 ─────────────────────────────────
  await page.goto(`/admin/doc-hub/view/${DEMO_DOC_ID}`, { timeout: 60000 })
  // 等 iframe 出現
  await page.waitForSelector('iframe', { timeout: 30000 }).catch(() => {})
  await waitReady(page, 3000)

  // 只截 viewport（iframe 部分）
  await shot(page, 'ch12', '03_view_pdf_embed')

  // 捲到附件卡片區
  await page.evaluate(() => {
    const links = document.querySelectorAll('a[href*="doc-files"]')
    if (links.length) (links[0] as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' })
  })
  await page.waitForTimeout(1000)
  await shot(page, 'ch12', '04_view_file_link_cards')

  // 全頁也來一張（讓 HTML 手冊有完整示範）
  await shotFull(page, 'ch12', '05_view_full')
})
