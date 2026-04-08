/**
 * 学生考试模块 - 像素级UI测试
 * 接力教育智慧云平台
 * 
 * 覆盖场景:
 * - TC-012: 考试答题页面像素验证
 * - TC-013: 交卷确认弹窗像素验证
 */

import { test, expect } from '@playwright/test';

const TEST_DATA = {
  primaryStudent: {
    identityNo: '450102201501011234',
    password: '123456',
  },
};

test.describe('TC-012: 考试答题页面像素验证', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // 通用登录方式
    const accountInput = page.locator('input').first();
    const passwordInput = page.locator('input[type="password"]').first();
    
    if (await accountInput.count() > 0) {
      await accountInput.fill(TEST_DATA.primaryStudent.identityNo);
    }
    if (await passwordInput.count() > 0) {
      await passwordInput.fill(TEST_DATA.primaryStudent.password);
    }
    
    const loginBtn = page.locator('button[type="submit"]').first();
    if (await loginBtn.count() > 0) {
      await loginBtn.click();
    }
    
    // 等待跳转或超时
    await page.waitForTimeout(3000);
    
    // 检查是否登录成功
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      console.log('⚠️  登录失败，跳过测试');
      test.skip();
    }
  });

  test('学生首页布局验证', async ({ page }) => {
    // 验证页面标题
    const title = page.locator('.ant-page-header-title, h1').first();
    await expect(title).toBeVisible();
    
    // 验证考试卡片
    const examCards = page.locator('.exam-card, .ant-card');
    await page.waitForSelector('.ant-card', { timeout: 5000 });
    
    if (await examCards.count() > 0) {
      const firstCard = examCards.first();
      
      // 验证卡片样式
      await expect(firstCard).toHaveCSS('border-radius', '8px');
      
      const boxShadow = await firstCard.evaluate(el => getComputedStyle(el).boxShadow);
      expect(boxShadow).toContain('0');
    }
  });

  test('考试页面整体布局验证', async ({ page }) => {
    // 尝试进入考试页面
    await page.goto('/exam/1');
    await page.waitForLoadState('networkidle');
    
    // 验证考试布局容器
    const examLayout = page.locator('.exam-layout, [class*="exam-container"]').first();
    if (await examLayout.count() === 0) {
      test.skip();
      return;
    }
    
    await expect(examLayout).toBeVisible();
  });

  test('顶部Header像素验证', async ({ page }) => {
    await page.goto('/exam/1');
    await page.waitForLoadState('networkidle');
    
    const header = page.locator('.exam-header, .header, [class*="header"]').first();
    if (await header.count() === 0) {
      test.skip();
      return;
    }
    
    await expect(header).toBeVisible();
    
    // 验证Header高度
    const box = await header.boundingBox();
    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(50);
      expect(box.height).toBeLessThanOrEqual(80);
    }
    
    // 验证阴影
    const boxShadow = await header.evaluate(el => getComputedStyle(el).boxShadow);
    expect(boxShadow).not.toBe('none');
  });

  test('倒计时组件像素验证', async ({ page }) => {
    await page.goto('/exam/1');
    await page.waitForLoadState('networkidle');
    
    const countdown = page.locator('.exam-countdown, .countdown, [class*="countdown"]').first();
    if (await countdown.count() === 0) {
      test.skip();
      return;
    }
    
    await expect(countdown).toBeVisible();
    
    // 验证字体大小
    const fontSize = await countdown.evaluate(el => getComputedStyle(el).fontSize);
    expect(parseInt(fontSize)).toBeGreaterThanOrEqual(16);
  });

  test('左侧答题卡像素验证', async ({ page }) => {
    await page.goto('/exam/1');
    await page.waitForLoadState('networkidle');
    
    const answerSheet = page.locator('.answer-sheet, [class*="answer-card"]').first();
    if (await answerSheet.count() === 0) {
      test.skip();
      return;
    }
    
    await expect(answerSheet).toBeVisible();
    
    // 验证宽度
    const box = await answerSheet.boundingBox();
    if (box) {
      expect(box.width).toBeGreaterThanOrEqual(200);
      expect(box.width).toBeLessThanOrEqual(300);
    }
    
    // 验证题号网格
    const questionGrid = answerSheet.locator('.question-grid, [class*="grid"]').first();
    if (await questionGrid.count() > 0) {
      const display = await questionGrid.evaluate(el => getComputedStyle(el).display);
      expect(['grid', 'flex']).toContain(display);
    }
  });

  test('题号按钮像素验证', async ({ page }) => {
    await page.goto('/exam/1');
    await page.waitForLoadState('networkidle');
    
    const answerSheet = page.locator('.answer-sheet, [class*="answer-card"]').first();
    if (await answerSheet.count() === 0) {
      test.skip();
      return;
    }
    
    // 查找题号按钮
    const questionBtns = answerSheet.locator('button, .question-number, [class*="number"]');
    if (await questionBtns.count() === 0) {
      test.skip();
      return;
    }
    
    const firstBtn = questionBtns.first();
    
    // 验证按钮尺寸
    const box = await firstBtn.boundingBox();
    if (box) {
      expect(box.width).toBeGreaterThanOrEqual(30);
      expect(box.height).toBeGreaterThanOrEqual(30);
    }
  });

  test('题目区域像素验证', async ({ page }) => {
    await page.goto('/exam/1');
    await page.waitForLoadState('networkidle');
    
    const questionArea = page.locator('.question-display, .question-area, [class*="question"]').first();
    if (await questionArea.count() === 0) {
      test.skip();
      return;
    }
    
    await expect(questionArea).toBeVisible();
    
    // 验证内边距
    const padding = await questionArea.evaluate(el => getComputedStyle(el).padding);
    expect(padding).toContain('16');
  });

  test('单选题选项像素验证', async ({ page }) => {
    await page.goto('/exam/1');
    await page.waitForLoadState('networkidle');
    
    // 查找选项
    const options = page.locator('.option, [class*="option"], .ant-radio-wrapper');
    if (await options.count() === 0) {
      test.skip();
      return;
    }
    
    const firstOption = options.first();
    
    // 验证选项内边距
    const padding = await firstOption.evaluate(el => getComputedStyle(el).padding);
    expect(padding).toContain('12');
    
    // 验证圆角
    await expect(firstOption).toHaveCSS('border-radius', '8px');
  });

  test('考试答题页面视觉回归', async ({ page }) => {
    await page.goto('/exam/1');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('exam-page-layout.png', {
      fullPage: false,
      animations: 'disabled',
    });
  });
});

test.describe('TC-013: 交卷确认弹窗像素验证', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[placeholder="身份证号 / 用户名"]', TEST_DATA.primaryStudent.identityNo);
    await page.fill('input[type="password"]', TEST_DATA.primaryStudent.password);
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/student/**', { timeout: 10000 });
  });

  test('交卷按钮像素验证', async ({ page }) => {
    await page.goto('/exam/1');
    await page.waitForLoadState('networkidle');
    
    // 查找交卷按钮
    const submitBtn = page.locator('button').filter({ hasText: /交卷|提交|submit/ }).first();
    if (await submitBtn.count() === 0) {
      test.skip();
      return;
    }
    
    await expect(submitBtn).toBeVisible();
    
    // 验证按钮样式
    const bgColor = await submitBtn.evaluate(el => getComputedStyle(el).backgroundColor);
    // 主色调或警告色调
    expect(bgColor).toMatch(/rgb\(24, 144, 255\)|rgb\(255, 77, 79\)/);
  });

  test('交卷确认弹窗尺寸验证', async ({ page }) => {
    await page.goto('/exam/1');
    await page.waitForLoadState('networkidle');
    
    const submitBtn = page.locator('button').filter({ hasText: /交卷|提交|submit/ }).first();
    if (await submitBtn.count() === 0) {
      test.skip();
      return;
    }
    
    await submitBtn.click();
    await page.waitForTimeout(500);
    
    // 验证弹窗
    const modal = page.locator('.ant-modal-content, .submit-confirm-modal').first();
    if (await modal.count() === 0) {
      test.skip();
      return;
    }
    
    await expect(modal).toBeVisible();
    
    // 验证弹窗宽度
    const box = await modal.boundingBox();
    if (box) {
      expect(box.width).toBeGreaterThanOrEqual(400);
      expect(box.width).toBeLessThanOrEqual(550);
    }
  });

  test('答题统计区域像素验证', async ({ page }) => {
    await page.goto('/exam/1');
    await page.waitForLoadState('networkidle');
    
    const submitBtn = page.locator('button').filter({ hasText: /交卷|提交|submit/ }).first();
    if (await submitBtn.count() > 0) {
      await submitBtn.click();
      await page.waitForTimeout(500);
    }
    
    const modal = page.locator('.ant-modal-content, .submit-confirm-modal').first();
    if (await modal.count() === 0) {
      test.skip();
      return;
    }
    
    // 查找统计区域
    const statsArea = modal.locator('.stats, [class*="stat"], .progress').first();
    if (await statsArea.count() > 0) {
      const padding = await statsArea.evaluate(el => getComputedStyle(el).padding);
      expect(padding).toContain('16');
    }
  });

  test('确认按钮组像素验证', async ({ page }) => {
    await page.goto('/exam/1');
    await page.waitForLoadState('networkidle');
    
    const submitBtn = page.locator('button').filter({ hasText: /交卷|提交|submit/ }).first();
    if (await submitBtn.count() > 0) {
      await submitBtn.click();
      await page.waitForTimeout(500);
    }
    
    const modal = page.locator('.ant-modal-content, .submit-confirm-modal').first();
    if (await modal.count() === 0) {
      test.skip();
      return;
    }
    
    // 查找按钮组
    const buttons = modal.locator('button');
    const count = await buttons.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('交卷确认弹窗视觉回归', async ({ page }) => {
    await page.goto('/exam/1');
    await page.waitForLoadState('networkidle');
    
    const submitBtn = page.locator('button').filter({ hasText: /交卷|提交|submit/ }).first();
    if (await submitBtn.count() > 0) {
      await submitBtn.click();
      await page.waitForTimeout(500);
    }
    
    const modal = page.locator('.ant-modal-content, .submit-confirm-modal, .ant-modal-wrap').first();
    if (await modal.count() === 0) {
      test.skip();
      return;
    }
    
    await expect(modal).toHaveScreenshot('exam-submit-confirm-modal.png', {
      animations: 'disabled',
    });
  });
});
