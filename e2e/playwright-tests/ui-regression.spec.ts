/**
 * UI回归测试 - 像素级验证所有关键页面
 * 接力教育智慧云平台
 */

import { test, expect, Page } from '@playwright/test';

// 截图对比配置
const SCREENSHOT_OPTIONS = {
  fullPage: true,
  animations: 'disabled' as const
};

test.describe('UI回归测试 - 登录和认证', () => {
  test('登录页面视觉回归', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // 截图对比
    await expect(page).toHaveScreenshot('login-page.png', SCREENSHOT_OPTIONS);
    
    // 像素级验证关键元素
    const loginCard = page.locator('.login-card');
    const box = await loginCard.boundingBox();
    
    // 验证卡片尺寸精确值
    expect(box?.width).toBe(420);
  });

  test('激活页面视觉回归', async ({ page }) => {
    await page.goto('/activate');
    await page.waitForLoadState('networkidle');
    
    // 截图对比
    await expect(page).toHaveScreenshot('activate-page.png', SCREENSHOT_OPTIONS);
    
    // 验证激活卡片宽度(应与登录页不同)
    const activateCard = page.locator('.activate-card');
    const box = await activateCard.boundingBox();
    expect(box?.width).toBe(480);
  });
});

test.describe('UI回归测试 - 管理员页面', () => {
  test.beforeEach(async ({ page }) => {
    // 登录
    await page.goto('/login');
    await page.fill('input[placeholder="身份证号 / 用户名"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin/**', { timeout: 10000 });
  });

  test('管理员控制台视觉回归', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');
    
    // 截图
    await expect(page).toHaveScreenshot('admin-dashboard.png', SCREENSHOT_OPTIONS);
  });

  test('账号管理页面视觉回归', async ({ page }) => {
    await page.goto('/admin/account-manager');
    await page.waitForLoadState('networkidle');
    
    // 等待表格加载
    await page.waitForSelector('.ant-table', { timeout: 5000 });
    
    await expect(page).toHaveScreenshot('admin-account-manager.png', SCREENSHOT_OPTIONS);
  });
});

test.describe('UI回归测试 - 教师页面', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[placeholder="身份证号 / 用户名"]', 'teacher');
    await page.fill('input[type="password"]', 'teacher123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/teacher/**', { timeout: 10000 });
  });

  test('教师工作台视觉回归', async ({ page }) => {
    await page.goto('/teacher/dashboard');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('teacher-dashboard.png', SCREENSHOT_OPTIONS);
  });

  test('题库管理页面视觉回归', async ({ page }) => {
    await page.goto('/teacher/question-banks');
    await page.waitForLoadState('networkidle');
    
    await page.waitForSelector('.ant-table', { timeout: 5000 });
    await expect(page).toHaveScreenshot('teacher-question-banks.png', SCREENSHOT_OPTIONS);
  });

  test('考试列表页面视觉回归', async ({ page }) => {
    await page.goto('/teacher/exams');
    await page.waitForLoadState('networkidle');
    
    await page.waitForSelector('.ant-table', { timeout: 5000 });
    await expect(page).toHaveScreenshot('teacher-exams.png', SCREENSHOT_OPTIONS);
  });
});

test.describe('UI回归测试 - 学生页面', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[placeholder="身份证号 / 用户名"]', '450102201501011234');
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/student/**', { timeout: 10000 });
  });

  test('学生首页视觉回归', async ({ page }) => {
    await page.goto('/student/home');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('student-home.png', SCREENSHOT_OPTIONS);
  });
});

test.describe('响应式布局测试', () => {
  test('登录页面移动端适配', async ({ page }) => {
    // 设置移动端视口
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // 验证卡片在移动端的宽度
    const loginCard = page.locator('.login-card');
    const box = await loginCard.boundingBox();
    
    // 移动端卡片应该适应屏幕宽度
    expect(box?.width).toBeLessThanOrEqual(375);
  });

  test('登录页面平板适配', async ({ page }) => {
    // 设置平板视口
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    const loginCard = page.locator('.login-card');
    await expect(loginCard).toBeVisible();
  });
});

test.describe('颜色和主题一致性测试', () => {
  test('主色调验证', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // 验证主按钮颜色
    const primaryBtn = page.locator('button.ant-btn-primary').first();
    await expect(primaryBtn).toBeVisible();
    await expect(primaryBtn).toHaveCSS('background-color', 'rgb(24, 144, 255)');
  });

  test('渐变背景验证', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    const loginPage = page.locator('.login-page');
    const bg = await loginPage.evaluate(el => getComputedStyle(el).background);
    
    // 验证包含渐变色
    expect(bg).toContain('102, 126, 234'); // #667eea in RGB
    expect(bg).toContain('118, 75, 162');  // #764ba2 in RGB
  });
});
