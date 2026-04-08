/**
 * 套卷管理模块 - 像素级UI测试
 * 接力教育智慧云平台
 * 
 * 测试场景: 套卷管理 - 可视化组卷
 * 测试路径: 教师登录 → 创建套卷 → 从题库选题 → 拖拽排序 → 设置分值 → 预览套卷 → 发布
 */

import { test, expect, Page } from '@playwright/test';

// ============================================
// 测试数据配置
// ============================================
const TEST_DATA = {
  teacher: {
    account: 'teacher',
    password: 'teacher123',
    role: 'teacher'
  },
  paper: {
    name: '测试套卷-' + Date.now(),
    totalScore: 100,
    duration: 60
  }
};

// ============================================
// 辅助函数
// ============================================

/**
 * 教师登录 - 使用通用选择器适配不同页面结构
 */
async function loginAsTeacher(page: Page) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  
  // 使用多种策略定位账号输入框
  // 策略1: placeholder
  let accountInput = page.locator('input[placeholder*="账号"], input[placeholder*="用户名"], input[placeholder*="身份证"]').first();
  // 策略2: 标签文本
  if (await accountInput.count() === 0) {
    accountInput = page.locator('input').filter({ has: page.locator('xpath=../label[contains(text(),"账号") or contains(text(),"用户名")]') }).first();
  }
  // 策略3: 第一个文本输入框
  if (await accountInput.count() === 0) {
    accountInput = page.locator('input[type="text"]').first();
  }
  
  // 使用多种策略定位密码输入框
  let passwordInput = page.locator('input[type="password"]').first();
  if (await passwordInput.count() === 0) {
    passwordInput = page.locator('input').filter({ has: page.locator('xpath=../label[contains(text(),"密码")]') }).first();
  }
  
  // 填写账号密码
  if (await accountInput.count() > 0) {
    await accountInput.fill(TEST_DATA.teacher.account);
  }
  if (await passwordInput.count() > 0) {
    await passwordInput.fill(TEST_DATA.teacher.password);
  }
  
  // 点击登录按钮
  const loginBtn = page.locator('button[type="submit"], button:has-text("登录"), button:has-text("登入")').first();
  if (await loginBtn.count() > 0) {
    await loginBtn.click();
  }
  
  // 等待登录成功
  try {
    await page.waitForURL(/\/(teacher|admin|student|dashboard|home)\/?/, { timeout: 10000 });
  } catch {
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      console.log('⚠️  登录后仍在登录页，跳过测试');
    }
  }
  
  await page.waitForTimeout(2000);
}

/**
 * 导航到套卷管理页面
 */
async function navigateToPaperManagement(page: Page) {
  // 点击套卷管理菜单 - 根据实际菜单结构
  await page.click('text=套卷管理');
  await page.waitForURL(/\/papers/, { timeout: 10000 });
  await page.waitForLoadState('networkidle');
}

// ============================================
// 测试套件: TC-008 套卷编辑页面像素验证
// ============================================
test.describe('TC-008: 套卷编辑页面像素验证', () => {
  
  test.beforeEach(async ({ page }) => {
    await loginAsTeacher(page);
    await navigateToPaperManagement(page);
  });

  test('验证页面整体布局 - 左侧信息区和右侧编辑区', async ({ page }) => {
    // 创建新套卷以进入编辑页面
    await page.click('button:has-text("新建套卷")');
    
    // 等待弹窗出现
    await page.waitForSelector('.ant-modal', { timeout: 10000 });
    
    // 填写基本信息
    await page.fill('.ant-modal input', TEST_DATA.paper.name);
    
    // 点击创建
    await page.click('.ant-modal button:has-text("确")');
    
    // 等待跳转到编辑页面
    await page.waitForURL(/\/papers\/\d+/, { timeout: 10000 });
    
    // 验证页面布局 - 左右分栏
    const leftPanel = page.locator('.paper-builder .ant-col').nth(0);
    const rightPanel = page.locator('.paper-builder .ant-col').nth(1);
    
    await expect(leftPanel).toBeVisible();
    await expect(rightPanel).toBeVisible();
    
    // 验证左侧面板宽度
    const leftBox = await leftPanel.boundingBox();
    const rightBox = await rightPanel.boundingBox();
    
    expect(leftBox?.width).toBeGreaterThan(400);
    expect(rightBox?.width).toBeGreaterThan(500);
    
    // 像素级验证 - 卡片样式
    const leftCard = leftPanel.locator('.ant-card');
    await expect(leftCard).toHaveCSS('border-radius', /2px|4px|6px|8px/);
  });

  test('验证左侧信息区元素像素', async ({ page }) => {
    // 创建套卷
    await page.click('button:has-text("新建套卷")');
    await page.waitForSelector('.ant-modal', { timeout: 10000 });
    await page.fill('.ant-modal input', TEST_DATA.paper.name + '-left-panel');
    await page.click('.ant-modal button:has-text("确")');
    await page.waitForURL(/\/papers\/\d+/, { timeout: 10000 });
    
    // 验证左侧"题库"卡片
    const questionBankCard = page.locator('.panel-card').nth(0);
    await expect(questionBankCard).toBeVisible();
    
    // 验证搜索框
    const searchInput = questionBankCard.locator('.ant-input-search');
    await expect(searchInput).toBeVisible();
    
    // 验证筛选条件区域
    const filterRow = questionBankCard.locator('.filter-row');
    await expect(filterRow).toBeVisible();
    
    // 验证下拉选择器
    const selects = filterRow.locator('.ant-select');
    await expect(selects).toHaveCount(2);
  });

  test('验证右侧编辑区元素像素', async ({ page }) => {
    // 创建套卷
    await page.click('button:has-text("新建套卷")');
    await page.waitForSelector('.ant-modal', { timeout: 10000 });
    await page.fill('.ant-modal input', TEST_DATA.paper.name + '-right-panel');
    await page.click('.ant-modal button:has-text("确")');
    await page.waitForURL(/\/papers\/\d+/, { timeout: 10000 });
    
    // 验证右侧编辑卡片
    const paperEditCard = page.locator('.panel-card').nth(1);
    await expect(paperEditCard).toBeVisible();
    
    // 验证标题栏布局
    const titleBar = paperEditCard.locator('.paper-title-bar');
    await expect(titleBar).toBeVisible();
    
    // 验证标签
    const tags = titleBar.locator('.ant-tag');
    await expect(tags).toHaveCount(2);
    
    // 验证标签颜色
    const countTag = tags.nth(0);
    const scoreTag = tags.nth(1);
    await expect(countTag).toHaveClass(/ant-tag-blue/);
    await expect(scoreTag).toHaveClass(/ant-tag-orange/);
    
    // 验证底部操作栏
    const footer = paperEditCard.locator('.paper-footer');
    await expect(footer).toBeVisible();
  });

  test('验证题目卡片像素样式', async ({ page }) => {
    // 创建套卷
    await page.click('button:has-text("新建套卷")');
    await page.waitForSelector('.ant-modal', { timeout: 10000 });
    await page.fill('.ant-modal input', TEST_DATA.paper.name + '-card-style');
    await page.click('.ant-modal button:has-text("确")');
    await page.waitForURL(/\/papers\/\d+/, { timeout: 10000 });
    
    // 等待题库加载
    await page.waitForSelector('.bank-item', { timeout: 10000 });
    
    // 添加第一个题目到试卷
    const firstQuestion = page.locator('.bank-item').first();
    await firstQuestion.locator('.ant-btn-link').click();
    
    // 验证题目卡片样式
    const paperItem = page.locator('.paper-item').first();
    await expect(paperItem).toBeVisible();
    
    // 验证卡片样式
    await expect(paperItem).toHaveCSS('padding', /10px 12px/);
    await expect(paperItem).toHaveCSS('border-radius', /6px/);
    
    // 验证拖拽手柄
    const dragHandle = paperItem.locator('.paper-item-handle');
    await expect(dragHandle).toBeVisible();
    await expect(dragHandle).toHaveCSS('color', /rgb\(191, 191, 191\)|#bfbfbf/);
    
    // 验证题号样式
    const questionIndex = paperItem.locator('.paper-item-index');
    await expect(questionIndex).toBeVisible();
    await expect(questionIndex).toHaveCSS('background-color', /rgb\(230, 247, 255\)|#e6f7ff/);
    await expect(questionIndex).toHaveCSS('color', /rgb\(24, 144, 255\)|#1890ff/);
    
    // 验证分值输入框
    const scoreInput = paperItem.locator('.ant-input-number');
    await expect(scoreInput).toBeVisible();
    
    const scoreInputBox = await scoreInput.boundingBox();
    expect(scoreInputBox?.width).toBeGreaterThanOrEqual(60);
    expect(scoreInputBox?.width).toBeLessThanOrEqual(80);
  });
});

// ============================================
// 测试套件: TC-009 套卷预览弹窗像素验证
// ============================================
test.describe('TC-009: 套卷预览弹窗像素验证', () => {
  
  test.beforeEach(async ({ page }) => {
    await loginAsTeacher(page);
    await navigateToPaperManagement(page);
  });

  test('验证预览弹窗像素布局', async ({ page }) => {
    // 创建套卷并添加题目
    await page.click('button:has-text("新建套卷")');
    await page.waitForSelector('.ant-modal', { timeout: 10000 });
    await page.fill('.ant-modal input', TEST_DATA.paper.name + '-preview');
    await page.click('.ant-modal button:has-text("确")');
    await page.waitForURL(/\/papers\/\d+/, { timeout: 10000 });
    
    // 等待题库加载并添加题目
    await page.waitForSelector('.bank-item', { timeout: 10000 });
    await page.locator('.bank-item').nth(0).locator('.ant-btn-link').click();
    await page.locator('.bank-item').nth(1).locator('.ant-btn-link').click();
    
    // 点击预览按钮
    await page.click('button:has-text("预览")');
    
    // 等待预览弹窗
    const previewModal = page.locator('.ant-modal');
    await expect(previewModal).toBeVisible();
    
    // 验证弹窗宽度
    const modalContent = previewModal.locator('.ant-modal-content');
    const box = await modalContent.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(700);
    expect(box?.width).toBeLessThanOrEqual(900);
  });

  test('验证预览弹窗内容样式', async ({ page }) => {
    // 创建套卷并添加题目
    await page.click('button:has-text("新建套卷")');
    await page.waitForSelector('.ant-modal', { timeout: 10000 });
    await page.fill('.ant-modal input', TEST_DATA.paper.name + '-preview-style');
    await page.click('.ant-modal button:has-text("确")');
    await page.waitForURL(/\/papers\/\d+/, { timeout: 10000 });
    
    // 添加题目
    await page.waitForSelector('.bank-item', { timeout: 10000 });
    await page.locator('.bank-item').nth(0).locator('.ant-btn-link').click();
    
    // 打开预览
    await page.click('button:has-text("预览")');
    
    // 验证题目区域样式
    const questionArea = page.locator('.ant-modal-body');
    await expect(questionArea).toHaveCSS('padding', /24px/);
  });
});

// ============================================
// 测试套件: 套卷列表页面像素验证
// ============================================
test.describe('套卷列表页面像素验证', () => {
  
  test.beforeEach(async ({ page }) => {
    await loginAsTeacher(page);
    await navigateToPaperManagement(page);
  });

  test('验证页面标题和布局', async ({ page }) => {
    // 验证页面标题
    const pageHeader = page.locator('.ant-page-header');
    await expect(pageHeader).toBeVisible();
    
    // 验证标题文字
    const title = pageHeader.locator('.ant-page-header-heading-title');
    await expect(title).toContainText('套卷管理');
    
    // 验证新建按钮
    const createBtn = page.locator('button:has-text("新建套卷")');
    await expect(createBtn).toBeVisible();
    await expect(createBtn).toHaveClass(/ant-btn-primary/);
  });

  test('验证套卷列表表格样式', async ({ page }) => {
    // 等待表格加载
    await page.waitForSelector('.ant-table', { timeout: 10000 });
    
    const table = page.locator('.ant-table');
    await expect(table).toBeVisible();
    
    // 验证表头样式
    const tableHeader = table.locator('.ant-table-thead');
    await expect(tableHeader).toHaveCSS('background-color', /rgb\(250, 250, 250\)|#fafafa/);
    
    // 验证表格行高
    const firstRow = table.locator('.ant-table-row').first();
    if (await firstRow.isVisible().catch(() => false)) {
      const rowBox = await firstRow.boundingBox();
      expect(rowBox?.height).toBeGreaterThanOrEqual(50);
    }
  });

  test('验证搜索和筛选区域样式', async ({ page }) => {
    // 验证搜索框
    const searchInput = page.locator('.ant-input-search');
    await expect(searchInput).toBeVisible();
  });
});

// ============================================
// 测试套件: 拖拽排序交互验证
// ============================================
test.describe('拖拽排序交互像素验证', () => {
  
  test.beforeEach(async ({ page }) => {
    await loginAsTeacher(page);
    await navigateToPaperManagement(page);
  });

  test('验证拖拽手柄样式', async ({ page }) => {
    // 创建套卷并添加多个题目
    await page.click('button:has-text("新建套卷")');
    await page.waitForSelector('.ant-modal', { timeout: 10000 });
    await page.fill('.ant-modal input', TEST_DATA.paper.name + '-drag');
    await page.click('.ant-modal button:has-text("确")');
    await page.waitForURL(/\/papers\/\d+/, { timeout: 10000 });
    
    // 等待题库并添加多个题目
    await page.waitForSelector('.bank-item', { timeout: 10000 });
    await page.locator('.bank-item').nth(0).locator('.ant-btn-link').click();
    await page.locator('.bank-item').nth(1).locator('.ant-btn-link').click();
    await page.locator('.bank-item').nth(2).locator('.ant-btn-link').click();
    
    // 验证拖拽手柄
    const dragHandles = page.locator('.paper-item-handle');
    await expect(dragHandles).toHaveCount(3);
    
    // 验证第一个拖拽手柄样式
    const firstHandle = dragHandles.first();
    await expect(firstHandle).toHaveCSS('cursor', /grab/);
    await expect(firstHandle).toHaveCSS('color', /rgb\(191, 191, 191\)|#bfbfbf/);
  });
});

// ============================================
// 测试套件: 创建套卷表单像素验证
// ============================================
test.describe('创建套卷表单像素验证', () => {
  
  test.beforeEach(async ({ page }) => {
    await loginAsTeacher(page);
    await navigateToPaperManagement(page);
  });

  test('验证创建弹窗样式', async ({ page }) => {
    // 点击新建按钮
    await page.click('button:has-text("新建套卷")');
    
    // 等待弹窗
    const modal = page.locator('.ant-modal');
    await expect(modal).toBeVisible();
    
    // 验证弹窗宽度
    const modalContent = modal.locator('.ant-modal-content');
    const box = await modalContent.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(500);
    expect(box?.width).toBeLessThanOrEqual(700);
    
    // 验证表单输入框
    const nameInput = modal.locator('input');
    await expect(nameInput).toHaveCSS('height', /32px/);
    
    // 验证按钮组
    const footer = modal.locator('.ant-modal-footer');
    await expect(footer).toBeVisible();
  });

  test('验证输入框聚焦样式', async ({ page }) => {
    await page.click('button:has-text("新建套卷")');
    
    const nameInput = page.locator('.ant-modal input');
    
    // 聚焦输入框
    await nameInput.focus();
    
    // 验证聚焦边框颜色
    await expect(nameInput).toHaveCSS('border-color', /rgb\(24, 144, 255\)|#1890ff/);
  });
});

// ============================================
// 测试套件: 响应式布局验证
// ============================================
test.describe('响应式布局像素验证', () => {
  
  test.beforeEach(async ({ page }) => {
    await loginAsTeacher(page);
    await navigateToPaperManagement(page);
  });

  test('验证不同视口下的布局适配', async ({ page }) => {
    // 设置不同视口大小
    await page.setViewportSize({ width: 1280, height: 800 });
    
    // 验证布局正常显示
    const pageContent = page.locator('.papers-page, .ant-page-header');
    await expect(pageContent).toBeVisible();
    
    // 设置更大视口
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(pageContent).toBeVisible();
  });
});
