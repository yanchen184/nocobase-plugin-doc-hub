import { test } from '@playwright/test';
import { loginAsAdmin } from '../fixtures/auth';

test('check version history page', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('http://localhost:13000/admin/doc-hub');
  await page.waitForTimeout(3000);

  const rows = page.locator('tr.ant-table-row');
  const count = await rows.count();
  console.log('rows:', count);

  if (count > 0) {
    // hover first row to reveal action buttons
    await rows.first().hover();
    await page.waitForTimeout(600);
    await page.screenshot({ path: '/tmp/dochub_hover.png' });

    // click history button (HistoryOutlined icon button)
    const histBtn = rows.first().locator('button').filter({ hasText: '' }).nth(1);
    const allBtns = await rows.first().locator('button').all();
    console.log('buttons in first row:', allBtns.length);
    
    // navigate directly to versions page for first doc
    const docId = await rows.first().getAttribute('data-row-key') || 
      await page.evaluate(() => {
        const tr = document.querySelector('tr.ant-table-row');
        return tr?.getAttribute('data-row-key');
      });
    console.log('docId:', docId);
    
    if (docId) {
      await page.goto(`http://localhost:13000/admin/doc-hub/versions/${docId}`);
      await page.waitForTimeout(3000);
      await page.screenshot({ path: '/tmp/dochub_history.png', fullPage: true });
    }
  }
});
