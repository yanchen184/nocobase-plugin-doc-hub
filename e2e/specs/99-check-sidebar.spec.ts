import { test } from '@playwright/test';
import { loginAsAdmin } from '../fixtures/auth';

test('check sidebar bottom', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await loginAsAdmin(page);
  await page.goto('http://localhost:13000/admin/doc-hub');
  await page.waitForSelector('tr.ant-table-row', { timeout: 10000 }).catch(()=>{});
  await page.waitForTimeout(1500);
  
  // 截 sidebar 區域
  const sidebar = page.locator('div').filter({ hasText: /📋 全部文件/ }).first();
  const box = await sidebar.boundingBox();
  if (box) {
    await page.screenshot({ 
      path: '/tmp/sidebar_full.png',
      clip: { x: 0, y: 0, width: 260, height: 900 }
    });
  }
});
