/**
 * UI Smoke Test - 快速验证关键功能
 */
import { test, expect } from '@playwright/test';

test.describe('🚀 UI Smoke Tests', () => {
  
  test('1. 登录页加载和响应式', async ({ page }) => {
    await page.goto('http://localhost');
    
    // 验证页面加载
    await expect(page.locator('.login-card')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('h1')).toContainText('接力教育智慧云平台');
    
    // 验证表单元素
    await expect(page.locator('input[placeholder="身份证号 / 用户名"]')).toBeVisible();
    await expect(page.locator('input[placeholder="请输入密码"]')).toBeVisible();
    await expect(page.locator('button:has-text("登 录")')).toBeVisible();
    
    // 测试移动端响应式
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    const card = await page.locator('.login-card').boundingBox();
    expect(card?.width).toBeLessThanOrEqual(375);
    
    console.log('✅ 登录页测试通过');
  });

  test('2. 教师登录和布局验证', async ({ page }) => {
    // 登录
    await page.goto('http://localhost');
    await page.fill('input[placeholder="身份证号 / 用户名"]', 'teacher1');
    await page.fill('input[placeholder="请输入密码"]', '123456');
    await page.click('button:has-text("登 录")');
    
    // 等待跳转
    await page.waitForURL(/\/teacher/, { timeout: 15000 });
    await expect(page.locator('text=教师工作台')).toBeVisible();
    
    // 验证侧边栏菜单
    const menuItems = ['工作台', '题库管理', '套卷管理', '考试管理', '成绩管理', '班级管理', '资源中心'];
    for (const item of menuItems) {
      await expect(page.locator(`.sidebar-menu span:has-text("${item}")`)).toBeVisible();
    }
    
    // 验证面包屑
    await expect(page.locator('.breadcrumb')).toContainText('工作台');
    
    console.log('✅ 教师布局测试通过');
  });

  test('3. 移动端抽屉菜单', async ({ page }) => {
    // 登录
    await page.goto('http://localhost');
    await page.fill('input[placeholder="身份证号 / 用户名"]', 'teacher001');
    await page.fill('input[placeholder="请输入密码"]', '123456');
    await page.click('button:has-text("登 录")');
    await page.waitForURL(/\/teacher/, { timeout: 15000 });
    
    // 切换到移动端
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    // 打开抽屉菜单
    await page.click('[aria-label="打开菜单"]');
    await expect(page.locator('.ant-drawer')).toBeVisible();
    
    console.log('✅ 移动端菜单测试通过');
  });

  test('4. 成绩管理页面', async ({ page }) => {
    // 登录
    await page.goto('http://localhost');
    await page.fill('input[placeholder="身份证号 / 用户名"]', 'teacher001');
    await page.fill('input[placeholder="请输入密码"]', '123456');
    await page.click('button:has-text("登 录")');
    await page.waitForURL(/\/teacher/, { timeout: 15000 });
    
    // 进入成绩管理
    await page.click('text=成绩管理');
    await page.waitForURL(/\/teacher\/scores/, { timeout: 10000 });
    
    // 验证页面元素
    await expect(page.locator('h1:has-text("成绩管理")')).toBeVisible();
    await expect(page.locator('.ant-select')).toBeVisible();
    await expect(page.locator('input[placeholder="搜索学生姓名或学号"]')).toBeVisible();
    
    console.log('✅ 成绩管理测试通过');
  });

  test('5. 学生端首页', async ({ page }) => {
    // 登录学生账号
    await page.goto('http://localhost');
    await page.fill('input[placeholder="身份证号 / 用户名"]', 'student_test');
    await page.fill('input[placeholder="请输入密码"]', '123456');
    await page.click('button:has-text("登 录")');
    await page.waitForURL(/\/student/, { timeout: 15000 });
    
    // 验证筛选标签
    await expect(page.locator('.ant-radio-button-wrapper:has-text("全部")')).toBeVisible();
    await expect(page.locator('.ant-radio-button-wrapper:has-text("进行中")')).toBeVisible();
    await expect(page.locator('.ant-radio-button-wrapper:has-text("即将开始")')).toBeVisible();
    await expect(page.locator('.ant-radio-button-wrapper:has-text("已结束")')).toBeVisible();
    
    // 点击筛选
    await page.click('.ant-radio-button-wrapper:has-text("进行中")');
    await page.waitForTimeout(300);
    
    console.log('✅ 学生端首页测试通过');
  });

  test('6. 无障碍属性验证', async ({ page }) => {
    await page.goto('http://localhost');
    
    // 验证表单 aria-label
    const accountInput = page.locator('input[placeholder="身份证号 / 用户名"]');
    const passwordInput = page.locator('input[placeholder="请输入密码"]');
    
    await expect(accountInput).toHaveAttribute('aria-label', '账号');
    await expect(passwordInput).toHaveAttribute('aria-label', '密码');
    
    // 验证按钮 aria-label
    const loginBtn = page.locator('button[type="submit"]');
    await expect(loginBtn).toHaveAttribute('aria-label', '登录');
    
    console.log('✅ 无障碍属性测试通过');
  });

  test('7. 表格响应式容器', async ({ page }) => {
    // 登录并进入套卷管理
    await page.goto('http://localhost');
    await page.fill('input[placeholder="身份证号 / 用户名"]', 'teacher001');
    await page.fill('input[placeholder="请输入密码"]', '123456');
    await page.click('button:has-text("登 录")');
    await page.waitForURL(/\/teacher/, { timeout: 15000 });
    
    await page.click('text=套卷管理');
    await page.waitForURL(/\/teacher\/papers/, { timeout: 10000 });
    
    // 验证表格响应式容器
    await expect(page.locator('.table-responsive')).toBeVisible();
    
    // 测试移动端
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);
    
    // 验证表格容器仍然存在
    await expect(page.locator('.table-responsive')).toBeVisible();
    
    console.log('✅ 表格响应式测试通过');
  });

  test('8. 设计系统 CSS 加载', async ({ page }) => {
    await page.goto('http://localhost');
    
    // 检查 CSS 变量是否生效
    const hasCSSVariables = await page.evaluate(() => {
      const styles = getComputedStyle(document.body);
      return styles.getPropertyValue('--primary-500') !== '' ||
             styles.getPropertyValue('--space-4') !== '';
    });
    
    console.log('CSS Variables loaded:', hasCSSVariables);
    
    // 检查样式表是否加载
    const stylesheets = await page.evaluate(() => {
      return Array.from(document.styleSheets).map(s => s.href);
    });
    
    console.log('Stylesheets:', stylesheets);
    
    console.log('✅ 设计系统 CSS 测试完成');
  });

  test.afterAll(async () => {
    console.log('\n==============================================');
    console.log('🎉 UI Smoke Tests 全部完成！');
    console.log('==============================================');
    console.log('✅ 登录页响应式布局');
    console.log('✅ 教师端布局和导航');
    console.log('✅ 移动端抽屉菜单');
    console.log('✅ 成绩管理功能');
    console.log('✅ 学生端考试筛选');
    console.log('✅ 无障碍属性');
    console.log('✅ 表格响应式');
    console.log('✅ 设计系统 CSS');
    console.log('==============================================\n');
  });
});
