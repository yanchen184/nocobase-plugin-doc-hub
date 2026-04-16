import { test } from '@playwright/test';
import { loginAsAdmin } from '../fixtures/auth';

test('open dochub and keep browser open', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await loginAsAdmin(page);
  await page.goto('http://localhost:13000/admin/doc-hub');
  await page.waitForSelector('tr.ant-table-row', { timeout: 10000 }).catch(()=>{});
  await page.waitForTimeout(2000);
  
  // 保持開啟 60 分鐘
  await page.waitForTimeout(3600000);
});
