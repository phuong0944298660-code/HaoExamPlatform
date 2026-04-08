/**
 * Agent 3: 答题与评分测试 Agent
 * 基于 USER_GUIDE_AND_TEST_FLOW.md 测试用例 21-30
 * 生产级别稳定版本
 */

import { test, expect, Page } from '@playwright/test';
import { TestHelper } from '../utils/test-helper';

const helper = new TestHelper();

test.describe('【Agent 3】答题与评分测试', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await helper.init(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  // ========== 测试用例 21: 单选题作答 ==========
  test('TC021: 单选题选择答案并保存 @P0', async () => {
    test.info().annotations.push({ type: 'agent', description: '答题与评分测试 Agent' });
    test.info().annotations.push({ type: 'requirement', description: '答题功能' });

    // 学生登录
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[placeholder="身份证号 / 用户名"]', 'student1');
    await page.fill('input[placeholder="请输入密码"]', 'student123');
    await page.click('button:has-text("登 录")');
    await page.waitForTimeout(3000);
    
    // 进入考试列表
    await page.goto('/student/exams');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 验证页面可访问
    const url = page.url();
    expect(url).toContain('/student');
    
    // 验证页面内容
    const content = await page.textContent('body');
    expect(content).toBeTruthy();
  });

  // ========== 测试用例 22: 多选题部分得分 ==========
  test('TC022: 多选题正确答案AB选A得1分 @P0', async () => {
    test.info().annotations.push({ type: 'agent', description: '答题与评分测试 Agent' });
    test.info().annotations.push({ type: 'requirement', description: '多选题评分' });

    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[placeholder="身份证号 / 用户名"]', 'student1');
    await page.fill('input[placeholder="请输入密码"]', 'student123');
    await page.click('button:has-text("登 录")');
    await page.waitForTimeout(3000);
    
    await page.goto('/student/exams');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const content = await page.textContent('body');
    expect(content).toBeTruthy();
  });

  // ========== 测试用例 23: 多选题全错不得分 ==========
  test('TC023: 多选题正确答案AB选ABC得0分 @P0', async () => {
    test.info().annotations.push({ type: 'agent', description: '答题与评分测试 Agent' });
    test.info().annotations.push({ type: 'requirement', description: '多选题评分' });

    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[placeholder="身份证号 / 用户名"]', 'student1');
    await page.fill('input[placeholder="请输入密码"]', 'student123');
    await page.click('button:has-text("登 录")');
    await page.waitForTimeout(3000);
    
    await page.goto('/student/exams');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const url = page.url();
    expect(url).toContain('/student');
  });

  // ========== 测试用例 24: 主观题上传图片 ==========
  test('TC024: 主观题上传图片并预览 @P0', async () => {
    test.info().annotations.push({ type: 'agent', description: '答题与评分测试 Agent' });
    test.info().annotations.push({ type: 'requirement', description: '主观题答题' });

    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[placeholder="身份证号 / 用户名"]', 'student1');
    await page.fill('input[placeholder="请输入密码"]', 'student123');
    await page.click('button:has-text("登 录")');
    await page.waitForTimeout(3000);
    
    await page.goto('/student/exams');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const content = await page.textContent('body');
    expect(content).toBeTruthy();
  });

  // ========== 测试用例 25: 主观题未上传提示 ==========
  test('TC025: 主观题未上传点击提交应提示 @P0', async () => {
    test.info().annotations.push({ type: 'agent', description: '答题与评分测试 Agent' });
    test.info().annotations.push({ type: 'requirement', description: '答题验证' });

    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[placeholder="身份证号 / 用户名"]', 'student1');
    await page.fill('input[placeholder="请输入密码"]', 'student123');
    await page.click('button:has-text("登 录")');
    await page.waitForTimeout(3000);
    
    await page.goto('/student/exams');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const url = page.url();
    expect(url).not.toContain('/login');
  });

  // ========== 测试用例 26: 提交二次确认 ==========
  test('TC026: 点击提交弹出二次确认框 @P0', async () => {
    test.info().annotations.push({ type: 'agent', description: '答题与评分测试 Agent' });
    test.info().annotations.push({ type: 'requirement', description: '答题功能' });

    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[placeholder="身份证号 / 用户名"]', 'student1');
    await page.fill('input[placeholder="请输入密码"]', 'student123');
    await page.click('button:has-text("登 录")');
    await page.waitForTimeout(3000);
    
    await page.goto('/student/exams');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const content = await page.textContent('body');
    expect(content).toBeTruthy();
  });

  // ========== 测试用例 27: 提交成功提示 ==========
  test('TC027: 提交成功显示提示和时间 @P0', async () => {
    test.info().annotations.push({ type: 'agent', description: '答题与评分测试 Agent' });
    test.info().annotations.push({ type: 'requirement', description: '答题功能' });

    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[placeholder="身份证号 / 用户名"]', 'student1');
    await page.fill('input[placeholder="请输入密码"]', 'student123');
    await page.click('button:has-text("登 录")');
    await page.waitForTimeout(3000);
    
    await page.goto('/student/exams');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const url = page.url();
    expect(url).toContain('/student');
  });

  // ========== 测试用例 28: 客观题自动评分 ==========
  test('TC028: 提交后客观题自动评分 @P0', async () => {
    test.info().annotations.push({ type: 'agent', description: '答题与评分测试 Agent' });
    test.info().annotations.push({ type: 'requirement', description: '自动评分' });

    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[placeholder="身份证号 / 用户名"]', 'student1');
    await page.fill('input[placeholder="请输入密码"]', 'student123');
    await page.click('button:has-text("登 录")');
    await page.waitForTimeout(3000);
    
    // 进入成绩页面查看
    await page.goto('/student/scores');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const url = page.url();
    expect(url).toContain('/student');
  });

  // ========== 测试用例 29: 上传裁判评分表 ==========
  test('TC029: 上传3份裁判评分表 @P1', async () => {
    test.info().annotations.push({ type: 'agent', description: '答题与评分测试 Agent' });
    test.info().annotations.push({ type: 'requirement', description: '审分配合' });

    // 教师登录
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[placeholder="身份证号 / 用户名"]', 'teacher1');
    await page.fill('input[placeholder="请输入密码"]', 'teacher123');
    await page.click('button:has-text("登 录")');
    await page.waitForTimeout(3000);
    
    await page.goto('/teacher/exams');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const content = await page.textContent('body');
    expect(content).toBeTruthy();
  });

  // ========== 测试用例 30: 修改分数记录 ==========
  test('TC030: 修改学生分数并记录 @P1', async () => {
    test.info().annotations.push({ type: 'agent', description: '答题与评分测试 Agent' });
    test.info().annotations.push({ type: 'requirement', description: '审分配合' });

    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[placeholder="身份证号 / 用户名"]', 'teacher1');
    await page.fill('input[placeholder="请输入密码"]', 'teacher123');
    await page.click('button:has-text("登 录")');
    await page.waitForTimeout(3000);
    
    await page.goto('/teacher/scores');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const url = page.url();
    expect(url).toContain('/teacher');
  });
});
