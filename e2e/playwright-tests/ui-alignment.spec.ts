/**
 * UI 对齐自动化测试
 * 检测管理员页面中表单元素的垂直对齐问题
 */

import { test, expect, Page } from '@playwright/test';

const TEST_DATA = {
  admin: {
    account: 'admin',
    password: 'admin123'
  }
};

/**
 * 辅助函数：检查一组元素是否具有相同的垂直中心线（在允许的容差范围内）
 */
async function expectElementsAligned(
  page: Page,
  selectors: string[],
  tolerance: number = 2
) {
  const centers: number[] = [];

  for (const selector of selectors) {
    const el = page.locator(selector).first();
    await expect(el).toBeVisible();
    const box = await el.boundingBox();
    if (!box) {
      throw new Error(`无法获取元素 ${selector} 的 bounding box`);
    }
    const centerY = box.y + box.height / 2;
    centers.push(centerY);
  }

  const min = Math.min(...centers);
  const max = Math.max(...centers);

  expect(
    max - min,
    `元素垂直中心线不对齐: ${selectors.join(', ')} (差异 ${max - min}px)`
  ).toBeLessThanOrEqual(tolerance);
}

/**
 * 辅助函数：检查一组元素是否具有相同的底部基线（在允许的容差范围内）
 */
async function expectElementsSameBaseline(
  page: Page,
  selectors: string[],
  tolerance: number = 2
) {
  const bottoms: number[] = [];

  for (const selector of selectors) {
    const el = page.locator(selector).first();
    await expect(el).toBeVisible();
    const box = await el.boundingBox();
    if (!box) {
      throw new Error(`无法获取元素 ${selector} 的 bounding box`);
    }
    bottoms.push(box.y + box.height);
  }

  const min = Math.min(...bottoms);
  const max = Math.max(...bottoms);

  expect(
    max - min,
    `元素底部基线不 align: ${selectors.join(', ')} (差异 ${max - min}px)`
  ).toBeLessThanOrEqual(tolerance);
}

test.describe('管理员页面 - 表单对齐检测', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[placeholder="身份证号 / 用户名"]', TEST_DATA.admin.account);
    await page.fill('input[type="password"]', TEST_DATA.admin.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin/**', { timeout: 10000 });
  });

  test('激活码管理页面 - 搜索表单项垂直对齐', async ({ page }) => {
    await page.goto('/admin/activation-codes');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.search-form', { timeout: 5000 });

    // 检查各个输入控件的底部基线是否对齐
    await expectElementsSameBaseline(page, [
      '.search-form .ant-select',
      '.search-form .ant-input',
    ], 3);

    // 检查标签与对应控件的垂直中心线是否对齐（同一 form-item 内）
    const formItems = page.locator('.search-form .ant-form-item');
    const count = await formItems.count();
    expect(count).toBeGreaterThanOrEqual(1);

    for (let i = 0; i < count; i++) {
      const item = formItems.nth(i);
      const label = item.locator('.ant-form-item-label');
      const control = item.locator('.ant-form-item-control');

      if (await label.count() === 0 || await control.count() === 0) continue;

      const labelBox = await label.boundingBox();
      const controlBox = await control.boundingBox();
      if (!labelBox || !controlBox) continue;

      const labelCenter = labelBox.y + labelBox.height / 2;
      const controlCenter = controlBox.y + controlBox.height / 2;

      expect(
        Math.abs(labelCenter - controlCenter),
        `第 ${i + 1} 个表单项的标签与控件未垂直居中对齐`
      ).toBeLessThanOrEqual(3);
    }

    // 检查查询/重置按钮与搜索输入框是否对齐
    await expectElementsAligned(page, [
      '.search-form .ant-input',
      '.search-form .form-actions .ant-btn',
    ], 3);
  });

  test('激活码管理页面 - 截图视觉回归', async ({ page }) => {
    await page.goto('/admin/activation-codes');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.search-form', { timeout: 5000 });

    // 仅对筛选区域进行截图，以便更快捕获布局变化
    const filterCard = page.locator('.filter-card');
    await expect(filterCard).toHaveScreenshot('activation-codes-filter.png');
  });
});
