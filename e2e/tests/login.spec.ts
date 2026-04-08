import { test, expect } from '@playwright/test';

/**
 * 登录功能 E2E 测试
 */
test.describe('登录功能', () => {
  
  test.beforeEach(async ({ page }) => {
    // 每个测试前访问登录页面
    await page.goto('/login');
  });

  test('页面标题正确显示', async ({ page }) => {
    await expect(page).toHaveTitle(/接力教育|登录/);
  });

  test('管理员可以成功登录', async ({ page }) => {
    // 填写登录表单
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    
    // 点击登录按钮
    await page.click('button[type="submit"]');
    
    // 验证跳转到仪表盘
    await expect(page).toHaveURL('/dashboard');
    
    // 验证页面内容
    await expect(page.locator('h1')).toContainText(/仪表盘|Dashboard/);
  });

  test('教师可以成功登录', async ({ page }) => {
    await page.fill('input[name="username"]', 'teacher1');
    await page.fill('input[name="password"]', 'teacher123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/dashboard');
  });

  test('学生可以成功登录', async ({ page }) => {
    await page.fill('input[name="username"]', 'student1');
    await page.fill('input[name="password"]', 'student123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/dashboard');
  });

  test('错误的密码显示错误信息', async ({ page }) => {
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // 验证错误信息
    await expect(page.locator('.ant-message-error, .error-message')).toBeVisible();
  });

  test('空表单提交显示验证错误', async ({ page }) => {
    // 直接点击登录按钮
    await page.click('button[type="submit"]');
    
    // 验证表单验证错误
    await expect(page.locator('.ant-form-item-explain-error, .error-message')).toBeVisible();
  });
});
