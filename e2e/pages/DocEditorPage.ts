import { Page, Locator } from '@playwright/test'

/**
 * Page Object for the DocHub document editor/viewer page.
 */
export class DocEditorPage {
  readonly page: Page

  readonly titleInput: Locator
  readonly contentEditor: Locator
  readonly categorySelect: Locator
  readonly typeSelect: Locator
  readonly statusSelect: Locator
  readonly saveButton: Locator
  readonly backButton: Locator
  readonly versionHistory: Locator
  readonly gitSyncButton: Locator

  constructor(page: Page) {
    this.page = page
    this.titleInput = page.locator('input[placeholder*="標題"], input[name="title"]').first()
    this.contentEditor = page.locator('.cm-editor, .ql-editor, textarea[name="content"]').first()
    this.categorySelect = page.locator('[data-testid="category-select"], .ant-select').first()
    this.typeSelect = page.locator('[data-testid="type-select"]').first()
    this.statusSelect = page.locator('[data-testid="status-select"]').first()
    this.saveButton = page.locator('button:has-text("儲存"), button:has-text("Save")').first()
    this.backButton = page.locator('button:has-text("返回"), button:has-text("Back")').first()
    this.versionHistory = page.locator('text=版本歷史, text=Version History').first()
    this.gitSyncButton = page.locator('button:has-text("Git 同步"), button:has-text("Sync Git")').first()
  }

  async fillTitle(title: string): Promise<void> {
    await this.titleInput.fill(title)
  }

  async fillContent(content: string): Promise<void> {
    await this.contentEditor.click()
    await this.contentEditor.fill(content)
  }

  async save(): Promise<void> {
    await this.saveButton.click()
    await this.page.waitForLoadState('networkidle')
  }

  async goBack(): Promise<void> {
    await this.backButton.click()
    await this.page.waitForLoadState('networkidle')
  }
}
