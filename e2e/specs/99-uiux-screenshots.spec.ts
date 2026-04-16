import { test } from '@playwright/test';
import { loginAsAdmin } from '../fixtures/auth';

test('capture all pages for UX review', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await loginAsAdmin(page);

  // 1. 列表頁 - 等資料載入
  await page.goto('http://localhost:13000/admin/doc-hub');
  await page.waitForSelector('tr.ant-table-row', { timeout: 10000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/tmp/ux_01_list.png' });

  // 1b. tabs 放大截圖
  const tabsEl = page.locator('div').filter({ hasText: /^全部/ }).first();
  await tabsEl.screenshot({ path: '/tmp/ux_01b_tabs.png' }).catch(()=>{});

  // 2. hover row
  const rows = page.locator('tr.ant-table-row');
  if (await rows.count() > 0) {
    await rows.first().hover();
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/tmp/ux_02_list_hover.png' });
  }

  // 3. 新增文件表單
  await page.goto('http://localhost:13000/admin/doc-hub/edit/new?projectId=4&categoryId=31');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/ux_03_new_doc.png' });

  // 4. 文件閱讀頁
  await page.goto('http://localhost:13000/admin/doc-hub/view/229');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/ux_05_view_doc.png' });

  // 5. 版本歷史
  await page.goto('http://localhost:13000/admin/doc-hub/versions/229');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/ux_06_versions.png' });
});
