import { test } from '@playwright/test';
import { loginAsAdmin } from '../fixtures/auth';

test('check empty state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await loginAsAdmin(page);
  await page.goto('http://localhost:13000/admin/doc-hub');
  await page.waitForTimeout(4000);
  await page.screenshot({ path: '/tmp/check_empty.png' });
  
  // 抓 console errors
  const errors: string[] = [];
  page.on('console', msg => { if(msg.type()==='error') errors.push(msg.text()); });
  
  // 抓 network errors
  const failedReqs: string[] = [];
  page.on('requestfailed', req => failedReqs.push(req.url()));
  
  await page.waitForTimeout(2000);
  console.log('Console errors:', JSON.stringify(errors));
  console.log('Failed requests:', JSON.stringify(failedReqs));
  
  // 看頁面文字
  const bodyText = await page.locator('body').innerText();
  console.log('Body text (first 500):', bodyText.slice(0, 500));
});
