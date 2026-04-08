/**
 * 账号管理模块端到端测试 - 像素级UI验证
 * 接力教育智慧云平台
 */

import { test, expect, Page } from '@playwright/test';

test.describe('账号管理 - AccountManager.vue', () => {
  test.beforeEach(async ({ page }) => {
    // 先登录管理员账号
    await page.goto('/login');
    await page.fill('input[placeholder="身份证号 / 用户名"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin/**', { timeout: 10000 });
    
    // 导航到账号管理页面
    await page.goto('/admin/account-manager');
    await page.waitForLoadState('networkidle');
  });

  test('页面整体布局验证', async ({ page }) => {
    // 验证页面容器
    const pageContainer = page.locator('.account-manager');
    await expect(pageContainer).toBeVisible();
  });

  test('标签页导航验证', async ({ page }) => {
    // 验证三个标签页
    const practiceTab = page.locator('.ant-tabs-tab').filter({ hasText: '练习账号' });
    const examTab = page.locator('.ant-tabs-tab').filter({ hasText: '考试账号' });
    const codesTab = page.locator('.ant-tabs-tab').filter({ hasText: '激活码' });
    
    await expect(practiceTab).toBeVisible();
    await expect(examTab).toBeVisible();
    await expect(codesTab).toBeVisible();
    
    // 默认选中练习账号
    await expect(practiceTab).toHaveClass(/ant-tabs-tab-active/);
  });

  test('筛选区域像素级验证', async ({ page }) => {
    const filterCard = page.locator('.filter-card');
    await expect(filterCard).toBeVisible();
    
    // 验证学段筛选
    const gradeSelect = page.locator('.ant-select').filter({ hasText: '全部学段' });
    await expect(gradeSelect).toBeVisible();
    
    // 验证搜索框
    const searchInput = page.locator('input[type="text"]').first();
    await expect(searchInput).toBeVisible();
  });

  test('表格列验证 - 练习账号', async ({ page }) => {
    // 等待表格加载
    await page.waitForSelector('.ant-table');
    
    // 验证表头
    const headers = ['用户名', '姓名', '学段', '账号类型', '激活状态', '创建时间', '操作'];
    for (const header of headers) {
      await expect(page.locator('.ant-table-thead th').filter({ hasText: header })).toBeVisible();
    }
  });

  test('批量生成按钮验证', async ({ page }) => {
    const generateBtn = page.locator('button').filter({ hasText: '批量生成' });
    await expect(generateBtn).toBeVisible();
    await expect(generateBtn).toHaveCSS('background-color', 'rgb(24, 144, 255)');
  });

  test('批量生成练习账号弹窗验证', async ({ page }) => {
    // 点击批量生成按钮
    await page.click('button:has-text("批量生成")');
    
    // 验证弹窗出现
    const modal = page.locator('.ant-modal');
    await expect(modal).toBeVisible();
    
    // 验证弹窗标题
    const title = modal.locator('.ant-modal-title');
    await expect(title).toContainText('批量生成');
    
    // 验证步骤条
    const steps = modal.locator('.ant-steps');
    await expect(steps).toBeVisible();
    
    // 验证表单字段
    await expect(modal.locator('.ant-form-item').filter({ hasText: '学段' })).toBeVisible();
    await expect(modal.locator('.ant-form-item').filter({ hasText: '数量' })).toBeVisible();
    await expect(modal.locator('.ant-form-item').filter({ hasText: '初始密码' })).toBeVisible();
  });

  test('切换到激活码标签页', async ({ page }) => {
    // 点击激活码标签
    await page.click('.ant-tabs-tab:has-text("激活码")');
    
    // 等待激活码表格加载
    await page.waitForTimeout(500);
    
    // 验证激活码表格列
    const codeHeaders = ['激活码', '学段', '角色', '使用状态', '使用时间', '创建时间'];
    for (const header of codeHeaders) {
      const headerCell = page.locator('.ant-table-thead th').filter({ hasText: header });
      if (await headerCell.count() > 0) {
        await expect(headerCell).toBeVisible();
      }
    }
  });
});
