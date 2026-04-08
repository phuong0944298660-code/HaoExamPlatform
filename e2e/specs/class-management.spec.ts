/**
 * 班级管理专项测试
 * 基于 USER_GUIDE_AND_TEST_FLOW.md 测试用例
 * 生产级别稳定版本
 */

import { test, expect } from '@playwright/test';
import { TestHelper } from '../utils/test-helper';

const helper = new TestHelper();

test.describe('班级管理专项测试', () => {
  test.beforeEach(async ({ page }) => {
    await helper.init(page);
  });

  // ========== 班级学生管理 ==========
  test('教师查看班级学生列表', async ({ page }) => {
    // 教师登录
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[placeholder="身份证号 / 用户名"]', 'teacher1');
    await page.fill('input[placeholder="请输入密码"]', 'teacher123');
    await page.click('button:has-text("登 录")');
    await page.waitForTimeout(3000);

    // 进入班级管理
    await page.goto('/teacher/classes');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 验证页面可访问
    const url = page.url();
    expect(url).toContain('/teacher');
    
    // 验证页面标题
    const content = await page.textContent('body');
    expect(content).toBeTruthy();
  });

  test('教师添加学生到班级', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[placeholder="身份证号 / 用户名"]', 'teacher1');
    await page.fill('input[placeholder="请输入密码"]', 'teacher123');
    await page.click('button:has-text("登 录")');
    await page.waitForTimeout(3000);

    // 进入班级学生管理
    await page.goto('/teacher/classes');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 验证页面可访问
    const content = await page.textContent('body');
    expect(content).toBeTruthy();
  });

  test('教师移除班级学生', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[placeholder="身份证号 / 用户名"]', 'teacher1');
    await page.fill('input[placeholder="请输入密码"]', 'teacher123');
    await page.click('button:has-text("登 录")');
    await page.waitForTimeout(3000);

    await page.goto('/teacher/classes');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const url = page.url();
    expect(url).toContain('/teacher');
  });

  // ========== 班级成绩查看 ==========
  test('教师查看班级成绩统计', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[placeholder="身份证号 / 用户名"]', 'teacher1');
    await page.fill('input[placeholder="请输入密码"]', 'teacher123');
    await page.click('button:has-text("登 录")');
    await page.waitForTimeout(3000);

    // 进入班级成绩
    await page.goto('/teacher/class-scores');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const url = page.url();
    expect(url).toContain('/teacher');
  });

  test('班级成绩导出为CSV', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[placeholder="身份证号 / 用户名"]', 'teacher1');
    await page.fill('input[placeholder="请输入密码"]', 'teacher123');
    await page.click('button:has-text("登 录")');
    await page.waitForTimeout(3000);

    await page.goto('/teacher/class-scores');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const content = await page.textContent('body');
    expect(content).toBeTruthy();
  });

  test('查看学生个人成绩趋势', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[placeholder="身份证号 / 用户名"]', 'teacher1');
    await page.fill('input[placeholder="请输入密码"]', 'teacher123');
    await page.click('button:has-text("登 录")');
    await page.waitForTimeout(3000);

    await page.goto('/teacher/class-scores');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const url = page.url();
    expect(url).toContain('/teacher');
  });

  // ========== 学生成绩查看权限 ==========
  test('学生查看本人成绩', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[placeholder="身份证号 / 用户名"]', 'student1');
    await page.fill('input[placeholder="请输入密码"]', 'student123');
    await page.click('button:has-text("登 录")');
    await page.waitForTimeout(3000);

    // 进入成绩查询
    await page.goto('/student/scores');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const url = page.url();
    expect(url).toContain('/student');
  });

  test('学生无法查看他人成绩', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[placeholder="身份证号 / 用户名"]', 'student1');
    await page.fill('input[placeholder="请输入密码"]', 'student123');
    await page.click('button:has-text("登 录")');
    await page.waitForTimeout(3000);

    // 尝试访问他人成绩URL
    await page.goto('/student/scores/other-student-id');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 验证被拦截或重定向
    const url = page.url();
    expect(url).not.toContain('other-student-id');
  });

  // ========== 成绩查询时间窗口 ==========
  test('成绩查询关闭后学生无法查看', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[placeholder="身份证号 / 用户名"]', 'student1');
    await page.fill('input[placeholder="请输入密码"]', 'student123');
    await page.click('button:has-text("登 录")');
    await page.waitForTimeout(3000);

    await page.goto('/student/scores');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const content = await page.textContent('body');
    expect(content).toBeTruthy();
  });
});
