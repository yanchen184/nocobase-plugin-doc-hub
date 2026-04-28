import { test } from '@playwright/test'
import { loginAsAdmin } from '../fixtures/auth'
import { waitReady } from '../fixtures/shot'

test.setTimeout(120000)

test('debug: 列出 STORY 專案頁所有按鈕', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await loginAsAdmin(page)
  await page.goto('/admin/doc-hub', { timeout: 60000 })
  await waitReady(page, 2500)

  // 展開「專案」
  const groupSpan = page.locator('span').filter({ hasText: /^🗂\s*專案$|^專案$/ }).first()
  if (await groupSpan.isVisible({ timeout: 3000 }).catch(() => false)) {
    await groupSpan.click({ force: true })
    await waitReady(page, 1200)
  }
  // 點 STORY 專案
  const projSpan = page.locator('span').filter({ hasText: '示範專案' }).first()
  await projSpan.click({ force: true })
  await waitReady(page, 2000)

  console.log('\n=== 全部 tab 階段 ===')
  let btns = await page.locator('button').evaluateAll(els =>
    els.map(b => b.textContent?.trim()).filter(t => t && t.length > 0 && t.length < 30)
  )
  console.log(JSON.stringify(btns, null, 2))

  // 嘗試從 sidebar 點具體資料夾（不是 tab）
  // 先列出 sidebar 中所有資料夾相關的 span
  console.log('\n=== sidebar 上的資料夾 span ===')
  const folderSpans = await page.locator('span').evaluateAll(els =>
    els.map(e => e.textContent?.trim()).filter(t =>
      t && (t.includes('📂') || t.includes('提案與規劃') || t.includes('需求') || t.includes('結案'))
    ).slice(0, 20)
  )
  console.log(JSON.stringify(folderSpans, null, 2))

  // sidebar 上 [STORY] 示範專案 應該有 chevron 可展開
  const projRow = page.locator('span').filter({ hasText: '示範專案' }).first()
  // 取它的 parent (li 或包含它的 row) 以便找展開 icon
  const expandIcon = projRow.locator('xpath=..').locator('xpath=..').locator('.anticon').first()
  if (await expandIcon.isVisible({ timeout: 2000 }).catch(() => false)) {
    await expandIcon.click({ force: true }).catch(() => {})
    await waitReady(page, 1200)
  }

  console.log('\n=== sidebar 展開後資料夾 ===')
  const folderSpans2 = await page.locator('span').evaluateAll(els =>
    els.map(e => e.textContent?.trim()).filter(t =>
      t && (t.includes('📂') || t.includes('提案與規劃') || t.includes('需求'))
    ).slice(0, 20)
  )
  console.log(JSON.stringify(folderSpans2, null, 2))

  // 點 02_需求
  const cat = page.locator('span').filter({ hasText: /^📂\s*02_需求$|^02_需求$/ }).first()
  if (await cat.isVisible({ timeout: 2000 }).catch(() => false)) {
    await cat.click({ force: true })
    await waitReady(page, 1500)
    console.log('\n=== 點 02_需求 後 ===')
    btns = await page.locator('button').evaluateAll(els =>
      els.map(b => b.textContent?.trim()).filter(t => t && t.length > 0 && t.length < 30)
    )
    console.log(JSON.stringify(btns, null, 2))
  }

  // 列出 .ant-btn 跟 PlusOutlined 圖示按鈕
  console.log('\n=== aria-label / title ===')
  const labels = await page.locator('button, [role="button"]').evaluateAll(els =>
    els.map(b => ({
      text: b.textContent?.trim()?.slice(0, 30),
      aria: b.getAttribute('aria-label'),
      title: b.getAttribute('title'),
      cls: b.className?.slice(0, 60),
    })).filter(o => o.aria || o.title)
  )
  console.log(JSON.stringify(labels, null, 2))
})
