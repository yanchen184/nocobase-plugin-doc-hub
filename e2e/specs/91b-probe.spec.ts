import { test } from '@playwright/test'
import { loginAsAdmin } from '../fixtures/auth'
import { waitReady } from '../fixtures/shot'

test.setTimeout(60000)

test('probe sidebar DOM', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await loginAsAdmin(page)
  await page.goto('/admin/doc-hub', { timeout: 60000 })
  await waitReady(page, 2000)

  // 先列出所有 < 40 字的 leaf text
  const initial = await page.evaluate(() => {
    const out: string[] = []
    document.querySelectorAll('*').forEach((el: any) => {
      const t = el.textContent?.trim() || ''
      if (t && t.length < 40 && el.children.length === 0 && t.length > 1) {
        // skip duplicates
        const left = el.getBoundingClientRect()?.left || 0
        if (left < 250) out.push(`${el.tagName}@${Math.round(left)}: "${t}"`)
      }
    })
    return Array.from(new Set(out)).slice(0, 80)
  })
  console.log('LEFT-SIDE LEAFS:', JSON.stringify(initial, null, 2))

  await page.locator('span', { hasText: '🗂 專案' }).first().click({ timeout: 3000 }).catch(() => {})
  await page.waitForTimeout(800)
  await page.locator('span', { hasText: '📁 DocHub 核心產品' }).first().click({ timeout: 3000 }).catch(() => {})
  await page.waitForTimeout(800)

  const after = await page.evaluate(() => {
    const out: string[] = []
    document.querySelectorAll('*').forEach((el: any) => {
      const t = el.textContent?.trim() || ''
      const left = el.getBoundingClientRect?.()?.left || 999
      if (left < 250 && t && el.children.length === 0 && t.length < 40 && t.length > 1) {
        out.push(`${el.tagName}@${Math.round(left)}: "${t}"`)
      }
    })
    return Array.from(new Set(out)).slice(0, 80)
  })
  console.log('AFTER DOCHUB PROJECT EXPAND:', JSON.stringify(after, null, 2))

  const result = await page.evaluate(() => {
    const out: any = { dochub: [], srs: [] }
    document.querySelectorAll('*').forEach((el: any) => {
      const t = el.textContent?.trim() || ''
      if ((t === 'DocHub 核心產品' || t.endsWith('DocHub 核心產品')) && t.length < 30) {
        out.dochub.push({
          tag: el.tagName,
          text: t,
          cls: typeof el.className === 'string' ? el.className : el.className?.baseVal || '',
          childCount: el.children.length,
          parent: el.parentElement?.tagName + '.' + (typeof el.parentElement?.className === 'string' ? el.parentElement?.className.slice(0, 50) : ''),
        })
      }
      if ((t === 'SRS' || (t.startsWith('SRS') && t.length < 10)) && el.children.length === 0) {
        out.srs.push({
          tag: el.tagName,
          text: t,
          cls: typeof el.className === 'string' ? el.className : '',
          parent: el.parentElement?.tagName,
        })
      }
    })
    return out
  })

  console.log('DOCHUB:', JSON.stringify(result.dochub.slice(0, 10), null, 2))
  console.log('SRS:', JSON.stringify(result.srs.slice(0, 10), null, 2))
})
