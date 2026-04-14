import { Page, Locator, expect } from '@playwright/test'

/**
 * Page Object for the DocHub list page.
 * URL: /#/doc-hub  (or however it's registered in NocoBase routing)
 */
export class DocHubPage {
  readonly page: Page

  // Navigation
  readonly menuItem: Locator

  // List page elements
  readonly documentTable: Locator
  readonly documentRows: Locator
  readonly searchInput: Locator
  readonly noDataMessage: Locator
  readonly loadingSpinner: Locator

  // Toolbar
  readonly createButton: Locator
  readonly syncButton: Locator

  // Column resize handles
  readonly titleColumnHandle: Locator

  constructor(page: Page) {
    this.page = page
    this.menuItem = page.locator('text=DocHub').first()
    this.documentTable = page.locator('.ant-table')
    this.documentRows = page.locator('.ant-table-tbody .ant-table-row')
    this.searchInput = page.locator('input[placeholder*="搜尋"], input[placeholder*="search"]').first()
    this.noDataMessage = page.locator('text=沒有文件, .ant-empty').first()
    this.loadingSpinner = page.locator('.ant-spin-spinning')
    this.createButton = page.locator('button:has-text("新增"), button:has-text("建立")').first()
    this.syncButton = page.locator('button:has-text("同步"), button:has-text("Sync")').first()
    this.titleColumnHandle = page.locator('.ant-table-thead th').filter({ hasText: '標題' }).locator('.col-resize-handle, div[style*="col-resize"]')
  }

  async goto(): Promise<void> {
    await this.page.goto('/')
    await this.page.waitForLoadState('networkidle')
  }

  async navigateToDocHub(): Promise<void> {
    // Try clicking on DocHub menu item
    await this.menuItem.click()
    await this.page.waitForLoadState('networkidle')
    await this.waitForTableLoad()
  }

  async waitForTableLoad(): Promise<void> {
    // Wait for loading spinner to disappear
    await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {})
    await this.page.waitForLoadState('networkidle')
  }

  async getDocumentCount(): Promise<number> {
    await this.waitForTableLoad()
    return this.documentRows.count()
  }

  async getDocumentTitles(): Promise<string[]> {
    await this.waitForTableLoad()
    const rows = this.documentRows
    const count = await rows.count()
    const titles: string[] = []
    for (let i = 0; i < count; i++) {
      const titleCell = rows.nth(i).locator('td').first()
      titles.push((await titleCell.textContent()) || '')
    }
    return titles
  }

  async searchDocuments(query: string): Promise<void> {
    await this.searchInput.fill(query)
    await this.page.waitForLoadState('networkidle')
    await this.waitForTableLoad()
  }

  async clearSearch(): Promise<void> {
    await this.searchInput.clear()
    await this.page.waitForLoadState('networkidle')
    await this.waitForTableLoad()
  }

  /**
   * Click on a document row to open it
   */
  async openDocument(titlePattern: string | RegExp): Promise<void> {
    const row = this.documentRows.filter({ hasText: titlePattern }).first()
    await row.locator('td').first().locator('a, span').first().click()
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Drag column header to resize
   * @param columnKey - column identifier
   * @param deltaX - pixels to drag (positive = wider, negative = narrower)
   */
  async resizeColumn(columnKey: string, deltaX: number): Promise<void> {
    const header = this.page
      .locator('.ant-table-thead th')
      .filter({ hasText: columnKey })
      .first()

    const handle = header.locator('div').last()
    const box = await handle.boundingBox()
    if (!box) throw new Error(`Column handle not found for: ${columnKey}`)

    const startX = box.x + box.width / 2
    const startY = box.y + box.height / 2

    await this.page.mouse.move(startX, startY)
    await this.page.mouse.down()
    await this.page.mouse.move(startX + deltaX, startY, { steps: 10 })
    await this.page.mouse.up()
  }
}
