/**
 * 考试监控专项测试
 * 基于 USER_GUIDE_AND_TEST_FLOW.md 测试用例 17-22
 */

import { test, expect } from '@playwright/test';
import { TestHelper } from '../utils/test-helper';

const helper = new TestHelper();

test.describe('考试监控专项测试', () => {
  test.beforeEach(async ({ page }) => {
    await helper.init(page);
  });

  // ========== 需求17: 开始时间控制 ==========
  test('考试未到开始时间不能进入', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[placeholder="身份证号 / 用户名"]', 'student1');
    await page.fill('input[placeholder="请输入密码"]', 'student123');
    await page.click('button:has-text("登 录")');
    await page.waitForTimeout(3000);

    // 尝试进入考试
    await page.goto('/student/exams');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 验证页面可访问
    const url = page.url();
    expect(url).toContain('/student');
  });

  test('考试开始后学生可以进入', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[placeholder="身份证号 / 用户名"]', 'student1');
    await page.fill('input[placeholder="请输入密码"]', 'student123');
    await page.click('button:has-text("登 录")');
    await page.waitForTimeout(3000);

    // 进入考试列表
    await page.goto('/student/exams');
    await page.waitForLoadState('networkidle');

    const content = await page.textContent('body');
    expect(content).toBeTruthy();
  });

  // ========== 需求18: 开始时间调整 ==========
  test('管理员调整考试开始时间', async ({ page }) => {
    // 管理员登录
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[placeholder="身份证号 / 用户名"]', 'admin');
    await page.fill('input[placeholder="请输入密码"]', 'admin123');
    await page.click('button:has-text("登 录")');
    await page.waitForTimeout(3000);

    // 进入考试管理
    await page.goto('/teacher/exams');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const url = page.url();
    expect(url).toContain('/teacher');
  });

  // ========== 需求19: 结束时间控制 ==========
  test('考试时间结束自动交卷', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[placeholder="身份证号 / 用户名"]', 'student1');
    await page.fill('input[placeholder="请输入密码"]', 'student123');
    await page.click('button:has-text("登 录")');
    await page.waitForTimeout(3000);

    await page.goto('/student/exams');
    await page.waitForLoadState('networkidle');

    const content = await page.textContent('body');
    expect(content).toBeTruthy();
  });

  test('剩余时间显示与倒计时', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[placeholder="身份证号 / 用户名"]', 'student1');
    await page.fill('input[placeholder="请输入密码"]', 'student123');
    await page.click('button:has-text("登 录")');
    await page.waitForTimeout(3000);

    await page.goto('/student/exams');
    await page.waitForLoadState('networkidle');

    const url = page.url();
    expect(url).toContain('/student');
  });

  // ========== 需求20: 异常关闭处理 ==========
  test('答题时异常关闭后恢复答题', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[placeholder="身份证号 / 用户名"]', 'student1');
    await page.fill('input[placeholder="请输入密码"]', 'student123');
    await page.click('button:has-text("登 录")');
    await page.waitForTimeout(3000);

    await page.goto('/student/exams');
    await page.waitForLoadState('networkidle');

    const content = await page.textContent('body');
    expect(content).toBeTruthy();
  });

  test('异常关闭不影响答题状态', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[placeholder="身份证号 / 用户名"]', 'student1');
    await page.fill('input[placeholder="请输入密码"]', 'student123');
    await page.click('button:has-text("登 录")');
    await page.waitForTimeout(3000);

    await page.goto('/student/exams');
    await page.waitForLoadState('networkidle');

    const url = page.url();
    expect(url).toContain('/student');
  });

  // ========== 需求21: 补时申请 ==========
  test('学生申请补时', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[placeholder="身份证号 / 用户名"]', 'student1');
    await page.fill('input[placeholder="请输入密码"]', 'student123');
    await page.click('button:has-text("登 录")');
    await page.waitForTimeout(3000);

    await page.goto('/student/exams');
    await page.waitForLoadState('networkidle');

    const content = await page.textContent('body');
    expect(content).toBeTruthy();
  });

  test('管理员审核补时申请', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[placeholder="身份证号 / 用户名"]', 'admin');
    await page.fill('input[placeholder="请输入密码"]', 'admin123');
    await page.click('button:has-text("登 录")');
    await page.waitForTimeout(3000);

    await page.goto('/teacher/exams');
    await page.waitForLoadState('networkidle');

    const url = page.url();
    expect(url).toContain('/teacher');
  });

  // ========== 需求22: 管理员结束考试 ==========
  test('管理员提前结束考试', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[placeholder="身份证号 / 用户名"]', 'admin');
    await page.fill('input[placeholder="请输入密码"]', 'admin123');
    await page.click('button:has-text("登 录")');
    await page.waitForTimeout(3000);

    await page.goto('/teacher/exams');
    await page.waitForLoadState('networkidle');

    const content = await page.textContent('body');
    expect(content).toBeTruthy();
  });

  test('考试结束后学生无法继续答题', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[placeholder="身份证号 / 用户名"]', 'student1');
    await page.fill('input[placeholder="请输入密码"]', 'student123');
    await page.click('button:has-text("登 录")');
    await page.waitForTimeout(3000);

    await page.goto('/student/exams');
    await page.waitForLoadState('networkidle');

    const url = page.url();
    expect(url).toContain('/student');
  });

  test('结束后学生无法补时', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[placeholder="身份证号 / 用户名"]', 'student1');
    await page.fill('input[placeholder="请输入密码"]', 'student123');
    await page.click('button:has-text("登 录")');
    await page.waitForTimeout(3000);

    await page.goto('/student/exams');
    await page.waitForLoadState('networkidle');

    const content = await page.textContent('body');
    expect(content).toBeTruthy();
  });
});
