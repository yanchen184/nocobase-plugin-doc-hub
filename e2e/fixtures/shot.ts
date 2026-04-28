import { Page } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

/** 截圖輸出根目錄（每章一個子資料夾） */
export const SHOT_ROOT = path.join(__dirname, '../artifacts/manual-shots')

export function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

/**
 * 等待 Antd spinner 消失、networkidle、再加一段緩衝。
 * NocoBase AMD 載入比 networkidle 慢，必須等 spinner 才能截到有內容的畫面。
 */
export async function waitReady(page: Page, extraMs = 1200): Promise<void> {
  await page.waitForLoadState('networkidle').catch(() => {})
  await page
    .waitForFunction(
      () => {
        const spinners = document.querySelectorAll(
          '.ant-spin-spinning, [class*="loading"], [class*="spin"]',
        )
        const blocking = Array.from(spinners).filter((el) => {
          const style = window.getComputedStyle(el as HTMLElement)
          return (
            style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            (el as HTMLElement).offsetParent !== null
          )
        })
        return blocking.length === 0
      },
      { timeout: 20000 },
    )
    .catch(() => {})
  await page.waitForTimeout(extraMs)
}

/** 截圖（viewport） */
export async function shot(page: Page, chapter: string, name: string): Promise<string> {
  const dir = path.join(SHOT_ROOT, chapter)
  ensureDir(dir)
  const file = path.join(dir, `${name}.png`)
  await page.screenshot({ path: file, fullPage: false })
  console.log(`  📸 ${chapter}/${name}.png`)
  return file
}

/** 截圖（full page） */
export async function shotFull(page: Page, chapter: string, name: string): Promise<string> {
  const dir = path.join(SHOT_ROOT, chapter)
  ensureDir(dir)
  const file = path.join(dir, `${name}.png`)
  await page.screenshot({ path: file, fullPage: true })
  console.log(`  📸 ${chapter}/${name}.png (full)`)
  return file
}

/** 讀 seed-meta.json（Batch 2 產出）供截圖 spec 使用 */
export interface SeedMeta {
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

export function loadSeedMeta(): SeedMeta {
  const p = path.join(__dirname, '../artifacts/seed-meta.json')
  if (!fs.existsSync(p)) {
    throw new Error(`seed-meta.json 不存在，請先跑 00-batch2-seed.spec.ts`)
  }
  return JSON.parse(fs.readFileSync(p, 'utf-8'))
}
