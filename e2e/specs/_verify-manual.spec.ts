import { test } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

test.setTimeout(60000)

test('verify manual.html', async ({ page }) => {
  const manualPath = path.join(__dirname, '../../manual.html')
  if (!fs.existsSync(manualPath)) throw new Error('manual.html missing')
  await page.setViewportSize({ width: 1200, height: 900 })
  await page.goto(`file://${manualPath}`)
  await page.waitForLoadState('networkidle')

  // 截封面
  await page.screenshot({ path: '/tmp/manual-cover.png', fullPage: false })

  // 跳到文件管理章節
  await page.evaluate(() => {
    const h = document.querySelector('h2[id*="文件管理"]')
    if (h) h.scrollIntoView({ block: 'start' })
  })
  await page.waitForTimeout(500)
  await page.screenshot({ path: '/tmp/manual-ch4.png', fullPage: false })

  // 跳到權限管理章節
  await page.evaluate(() => {
    const h = document.querySelector('h2[id*="權限"]')
    if (h) h.scrollIntoView({ block: 'start' })
  })
  await page.waitForTimeout(500)
  await page.screenshot({ path: '/tmp/manual-ch9.png', fullPage: false })

  // 先滾動整頁觸發 lazy-loading
  await page.evaluate(async () => {
    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))
    const total = document.body.scrollHeight
    let y = 0
    while (y < total) {
      window.scrollTo(0, y)
      await delay(100)
      y += 800
    }
    window.scrollTo(0, 0)
    await delay(500)
  })
  await page.waitForTimeout(1000)

  // 統計
  const stats = await page.evaluate(() => ({
    h2Count: document.querySelectorAll('h2').length,
    h3Count: document.querySelectorAll('h3').length,
    imgCount: document.querySelectorAll('img').length,
    tableCount: document.querySelectorAll('table').length,
    figureCount: document.querySelectorAll('figure').length,
    missingImgs: Array.from(document.querySelectorAll('img'))
      .filter((img: any) => !img.complete || img.naturalWidth === 0).length,
  }))
  console.log('[MANUAL STATS]', JSON.stringify(stats))
})
