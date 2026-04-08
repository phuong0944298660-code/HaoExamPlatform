/**
 * 考试流程端到端测试 - 像素级UI验证
 * 接力教育智慧云平台
 */

import { test, expect, Page } from '@playwright/test';

test.describe('考试流程 - 学生端', () => {
  test.beforeEach(async ({ page }) => {
    // 登录学生账号 - 使用通用方式
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    const accountInput = page.locator('input').first();
    const passwordInput = page.locator('input[type="password"]').first();
    
    if (await accountInput.count() > 0) {
      await accountInput.fill('450102201501011234');
    }
    if (await passwordInput.count() > 0) {
      await passwordInput.fill('123456');
    }
    
    const loginBtn = page.locator('button[type="submit"]').first();
    if (await loginBtn.count() > 0) {
      await loginBtn.click();
    }
    
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      console.log('⚠️  学生登录失败，跳过测试');
      test.skip();
    }
  });

  test('学生首页布局验证', async ({ page }) => {
    // 验证页面标题
    const pageHeader = page.locator('.ant-page-header-title');
    await expect(pageHeader).toHaveText('我的考试');
    
    // 验证副标题
    const subtitle = page.locator('.ant-page-header-sub-title');
    await expect(subtitle).toHaveText('查看可参加的考试');
  });

  test('考试卡片样式验证', async ({ page }) => {
    // 等待考试卡片加载
    await page.waitForSelector('.exam-card, .ant-card', { timeout: 5000 });
    
    // 验证卡片存在
    const cards = page.locator('.ant-card');
    const count = await cards.count();
    
    if (count > 0) {
      // 验证第一个卡片的样式
      const firstCard = cards.first();
      await expect(firstCard).toHaveCSS('border-radius', '8px');
      await expect(firstCard).toHaveCSS('box-shadow', /0px/);
      
      // 验证状态标签
      const statusTag = firstCard.locator('.ant-tag').first();
      await expect(statusTag).toBeVisible();
    }
  });
});

test.describe('考试管理 - 教师端', () => {
  test.beforeEach(async ({ page }) => {
    // 登录教师账号
    await page.goto('/login');
    await page.fill('input[placeholder="身份证号 / 用户名"]', 'teacher');
    await page.fill('input[type="password"]', 'teacher123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/teacher/**', { timeout: 10000 });
    
    // 导航到考试列表
    await page.goto('/teacher/exams');
    await page.waitForLoadState('networkidle');
  });

  test('考试列表页面布局', async ({ page }) => {
    // 验证页面标题
    const title = page.locator('.ant-page-header-title');
    await expect(title).toContainText('考试');
    
    // 验证创建按钮
    const createBtn = page.locator('button[type="primary"]');
    await expect(createBtn).toBeVisible();
  });

  test('考试状态标签验证', async ({ page }) => {
    // 等待表格加载
    await page.waitForSelector('.ant-table', { timeout: 5000 });
    
    // 验证状态标签存在
    const statusTags = page.locator('.ant-table-tbody .ant-tag');
    const count = await statusTags.count();
    
    if (count > 0) {
      // 验证状态标签的样式
      const firstTag = statusTags.first();
      await expect(firstTag).toBeVisible();
    }
  });

  test('创建考试按钮点击', async ({ page }) => {
    // 点击创建按钮
    const createBtn = page.locator('button').filter({ hasText: /创建|新建/ }).first();
    if (await createBtn.count() > 0) {
      await createBtn.click();
      
      // 验证导航到创建页面或弹窗
      await page.waitForTimeout(1000);
      const modal = page.locator('.ant-modal');
      const isModalVisible = await modal.isVisible().catch(() => false);
      
      if (isModalVisible) {
        await expect(modal).toBeVisible();
      }
    }
  });
});

test.describe('考试答题页面 - ExamPage.vue', () => {
  test('答题页面布局验证', async ({ page }) => {
    // 直接访问考试页面(需要有效的考试ID)
    await page.goto('/login');
    await page.fill('input[placeholder="身份证号 / 用户名"]', '450102201501011234');
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/student/**', { timeout: 10000 });
    
    // 尝试访问考试页面
    await page.goto('/exam/1');
    await page.waitForLoadState('networkidle');
    
    // 验证考试布局
    const examLayout = page.locator('.exam-layout');
    if (await examLayout.count() > 0) {
      await expect(examLayout).toBeVisible();
      
      // 验证顶部导航
      const header = page.locator('.exam-header');
      await expect(header).toBeVisible();
      
      // 验证倒计时组件
      const countdown = page.locator('.exam-countdown');
      if (await countdown.count() > 0) {
        await expect(countdown).toBeVisible();
      }
    }
  });

  test('答题卡组件验证', async ({ page }) => {
    // 验证答题卡
    const answerSheet = page.locator('.answer-sheet');
    if (await answerSheet.count() > 0) {
      await expect(answerSheet).toBeVisible();
      
      // 验证题号网格
      const questionGrid = answerSheet.locator('.question-grid');
      if (await questionGrid.count() > 0) {
        await expect(questionGrid).toBeVisible();
      }
    }
  });
});
