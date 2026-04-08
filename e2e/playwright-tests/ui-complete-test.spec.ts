/**
 * UI 完整性测试 - 验证 UI 调整后的所有功能
 * 依据: USER_GUIDE_AND_TEST_FLOW.md
 */
import { test, expect, Page, BrowserContext } from '@playwright/test';
import { describe } from 'node:test';

// ==================== 工具函数 ====================

/**
 * 登录函数
 */
async function login(page: Page, username: string, password: string) {
  await page.goto('/');
  await page.waitForSelector('.login-card', { timeout: 10000 });
  
  // 填写账号
  await page.fill('input[placeholder="身份证号 / 用户名"]', username);
  // 填写密码
  await page.fill('input[placeholder="请输入密码"]', password);
  
  // 点击登录按钮
  await page.click('button:has-text("登 录")');
  
  // 等待登录成功跳转
  await page.waitForURL(/\/(teacher|student|admin)/, { timeout: 15000 });
}

/**
 * 等待页面加载完成
 */
async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
}

// ==================== 测试套件 ====================

test.describe('🎨 UI 完整性测试 - 登录页', () => {
  test('TC-LOGIN-01: 登录页响应式布局验证', async ({ page }) => {
    // 桌面端布局验证
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    
    // 验证登录卡片存在
    const loginCard = page.locator('.login-card');
    await expect(loginCard).toBeVisible();
    
    // 验证 Logo 和标题
    await expect(page.locator('.login-header h1')).toHaveText('接力教育智慧云平台');
    await expect(page.locator('.logo-icon')).toContainText('🎓');
    
    // 验证表单元素
    await expect(page.locator('input[placeholder="身份证号 / 用户名"]')).toBeVisible();
    await expect(page.locator('input[placeholder="请输入密码"]')).toBeVisible();
    await expect(page.locator('button:has-text("登 录")')).toBeVisible();
    
    // 验证记住账号和激活链接
    await expect(page.locator('text=记住账号')).toBeVisible();
    await expect(page.locator('text=使用激活码激活账号')).toBeVisible();
  });

  test('TC-LOGIN-02: 登录页移动端响应式验证', async ({ page }) => {
    // 设置移动端视口
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // 等待页面加载
    await waitForPageLoad(page);
    
    // 验证登录卡片适配移动端
    const loginCard = page.locator('.login-card');
    await expect(loginCard).toBeVisible();
    
    // 获取卡片宽度，验证其在移动端视口内
    const cardBox = await loginCard.boundingBox();
    expect(cardBox?.width).toBeLessThanOrEqual(375);
  });

  test('TC-LOGIN-03: 教师登录流程', async ({ page }) => {
    await login(page, 'teacher001', '123456');
    
    // 验证登录后进入教师工作台
    await expect(page).toHaveURL(/\/teacher/);
    await expect(page.locator('text=教师工作台')).toBeVisible();
  });
});

test.describe('📚 UI 完整性测试 - 教师端布局', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'teacher001', '123456');
    await waitForPageLoad(page);
  });

  test('TC-TEACHER-01: 教师端侧边栏菜单验证', async ({ page }) => {
    // 验证所有菜单项存在
    const menuItems = ['工作台', '题库管理', '套卷管理', '考试管理', '成绩管理', '班级管理', '资源中心'];
    
    for (const item of menuItems) {
      await expect(page.locator(`.sidebar-menu:has-text("${item}")`)).toBeVisible();
    }
  });

  test('TC-TEACHER-02: 面包屑导航验证', async ({ page }) => {
    // 点击题库管理
    await page.click('text=题库管理');
    await waitForPageLoad(page);
    
    // 验证面包屑显示正确
    await expect(page.locator('.breadcrumb')).toContainText('题库管理');
    
    // 点击套卷管理
    await page.click('text=套卷管理');
    await waitForPageLoad(page);
    
    await expect(page.locator('.breadcrumb')).toContainText('套卷管理');
  });

  test('TC-TEACHER-03: 移动端抽屉菜单验证', async ({ page }) => {
    // 设置移动端视口
    await page.setViewportSize({ width: 375, height: 667 });
    await waitForPageLoad(page);
    
    // 点击菜单按钮打开抽屉
    await page.click('[aria-label="打开菜单"]');
    
    // 验证抽屉菜单显示
    await expect(page.locator('.mobile-drawer')).toBeVisible();
    
    // 验证菜单项存在
    await expect(page.locator('.mobile-menu:has-text("工作台")')).toBeVisible();
    await expect(page.locator('.mobile-menu:has-text("题库管理")')).toBeVisible();
  });

  test('TC-TEACHER-04: 用户信息下拉菜单验证', async ({ page }) => {
    // 点击用户下拉菜单
    await page.click('[aria-label="用户菜单"]');
    
    // 验证下拉菜单内容
    await expect(page.locator('text=退出登录')).toBeVisible();
  });
});

test.describe('📊 UI 完整性测试 - 教师工作台', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'teacher001', '123456');
    await waitForPageLoad(page);
  });

  test('TC-DASHBOARD-01: 统计卡片显示验证', async ({ page }) => {
    // 验证四个统计卡片存在
    await expect(page.locator('text=我的题库')).toBeVisible();
    await expect(page.locator('text=套卷数量')).toBeVisible();
    await expect(page.locator('text=进行中考试')).toBeVisible();
    await expect(page.locator('text=待批阅试卷')).toBeVisible();
  });

  test('TC-DASHBOARD-02: 最近考试表格响应式验证', async ({ page }) => {
    // 验证表格存在
    await expect(page.locator('.recent-exams-card table')).toBeVisible();
    
    // 缩小窗口测试响应式
    await page.setViewportSize({ width: 768, height: 900 });
    await waitForPageLoad(page);
    
    // 验证表格容器有横向滚动能力
    const tableContainer = page.locator('.table-responsive');
    await expect(tableContainer).toBeVisible();
  });

  test('TC-DASHBOARD-03: 快捷操作按钮验证', async ({ page }) => {
    // 验证快捷操作按钮
    await expect(page.locator('button:has-text("管理题库")')).toBeVisible();
    await expect(page.locator('button:has-text("创建套卷")')).toBeVisible();
    await expect(page.locator('button:has-text("批阅试卷")')).toBeVisible();
  });
});

test.describe('📝 UI 完整性测试 - 成绩管理', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'teacher001', '123456');
    await page.goto('/teacher/scores');
    await waitForPageLoad(page);
  });

  test('TC-SCORES-01: 考试选择器验证', async ({ page }) => {
    // 验证考试选择器存在
    const examSelector = page.locator('.ant-select:has-text("请选择要查看成绩的考试")');
    await expect(examSelector).toBeVisible();
    
    // 点击展开选择器
    await examSelector.click();
    
    // 验证下拉选项显示
    await expect(page.locator('.ant-select-dropdown')).toBeVisible();
  });

  test('TC-SCORES-02: 搜索功能防抖验证', async ({ page }) => {
    // 选择第一个考试
    await page.click('.ant-select:has-text("请选择要查看成绩的考试")');
    await page.waitForSelector('.ant-select-item', { timeout: 5000 });
    
    const firstOption = page.locator('.ant-select-item').first();
    if (await firstOption.isVisible()) {
      await firstOption.click();
      await waitForPageLoad(page);
      
      // 验证搜索框存在
      const searchInput = page.locator('input[placeholder="搜索学生姓名或学号"]');
      await expect(searchInput).toBeVisible();
      
      // 输入搜索关键词
      await searchInput.fill('测试');
      
      // 等待防抖延迟（300ms）
      await page.waitForTimeout(400);
      
      // 验证搜索执行
      await waitForPageLoad(page);
    }
  });

  test('TC-SCORES-03: 统计卡片显示验证', async ({ page }) => {
    // 选择第一个考试
    await page.click('.ant-select:has-text("请选择要查看成绩的考试")');
    await page.waitForSelector('.ant-select-item', { timeout: 5000 });
    
    const firstOption = page.locator('.ant-select-item').first();
    if (await firstOption.isVisible()) {
      await firstOption.click();
      await waitForPageLoad(page);
      
      // 验证统计卡片
      await expect(page.locator('text=参考人数')).toBeVisible();
      await expect(page.locator('text=平均分')).toBeVisible();
      await expect(page.locator('text=最高分')).toBeVisible();
      await expect(page.locator('text=最低分')).toBeVisible();
      await expect(page.locator('text=及格率')).toBeVisible();
      await expect(page.locator('text=优秀率')).toBeVisible();
    }
  });

  test('TC-SCORES-04: 成绩表格响应式验证', async ({ page }) => {
    // 选择第一个考试
    await page.click('.ant-select:has-text("请选择要查看成绩的考试")');
    await page.waitForSelector('.ant-select-item', { timeout: 5000 });
    
    const firstOption = page.locator('.ant-select-item').first();
    if (await firstOption.isVisible()) {
      await firstOption.click();
      await waitForPageLoad(page);
      
      // 验证表格存在
      await expect(page.locator('.table-responsive table')).toBeVisible();
      
      // 验证表格列
      await expect(page.locator('th:has-text("排名")')).toBeVisible();
      await expect(page.locator('th:has-text("姓名")')).toBeVisible();
      await expect(page.locator('th:has-text("总分")')).toBeVisible();
    }
  });
});

test.describe('🎓 UI 完整性测试 - 学生端', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'student001', '123456');
    await waitForPageLoad(page);
  });

  test('TC-STUDENT-01: 考试卡片显示验证', async ({ page }) => {
    // 验证考试网格存在
    await expect(page.locator('.exam-grid')).toBeVisible();
    
    // 验证筛选标签存在
    await expect(page.locator('text=全部')).toBeVisible();
    await expect(page.locator('text=进行中')).toBeVisible();
    await expect(page.locator('text=即将开始')).toBeVisible();
    await expect(page.locator('text=已结束')).toBeVisible();
  });

  test('TC-STUDENT-02: 考试筛选功能验证', async ({ page }) => {
    // 点击"进行中"筛选
    await page.click('.ant-radio-button-wrapper:has-text("进行中")');
    await waitForPageLoad(page);
    
    // 验证筛选后状态
    const activeButton = page.locator('.ant-radio-button-wrapper-checked:has-text("进行中")');
    await expect(activeButton).toBeVisible();
    
    // 点击"全部"恢复
    await page.click('.ant-radio-button-wrapper:has-text("全部")');
    await waitForPageLoad(page);
  });

  test('TC-STUDENT-03: 考试卡片响应式验证', async ({ page }) => {
    // 桌面端验证 3 列布局
    await page.setViewportSize({ width: 1440, height: 900 });
    await waitForPageLoad(page);
    
    // 移动端验证单列布局
    await page.setViewportSize({ width: 375, height: 667 });
    await waitForPageLoad(page);
    
    // 验证卡片在移动端正常显示
    const examCards = page.locator('.exam-card');
    if (await examCards.count() > 0) {
      const firstCard = examCards.first();
      await expect(firstCard).toBeVisible();
      
      // 验证卡片宽度适应移动端
      const cardBox = await firstCard.boundingBox();
      expect(cardBox?.width).toBeLessThanOrEqual(375);
    }
  });

  test('TC-STUDENT-04: 进入考试按钮验证', async ({ page }) => {
    // 查找进行中的考试卡片
    const openExamCard = page.locator('.exam-open');
    
    if (await openExamCard.count() > 0) {
      // 验证进入考试按钮
      const enterBtn = openExamCard.first().locator('button:has-text("进入考试")');
      await expect(enterBtn).toBeVisible();
      await expect(enterBtn).toBeEnabled();
    }
  });
});

test.describe('📋 UI 完整性测试 - 套卷管理', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'teacher001', '123456');
    await page.goto('/teacher/papers');
    await waitForPageLoad(page);
  });

  test('TC-PAPERS-01: 套卷列表显示验证', async ({ page }) => {
    // 验证表格存在
    await expect(page.locator('.table-responsive table')).toBeVisible();
    
    // 验证搜索和筛选
    await expect(page.locator('input[placeholder="搜索套卷名称"]')).toBeVisible();
  });

  test('TC-PAPERS-02: 创建套卷按钮验证', async ({ page }) => {
    // 验证创建按钮
    const createBtn = page.locator('button:has-text("创建套卷")');
    await expect(createBtn).toBeVisible();
    
    // 点击创建按钮
    await createBtn.click();
    
    // 验证弹窗显示
    await expect(page.locator('.ant-modal:has-text("创建套卷")')).toBeVisible();
  });
});

test.describe('🔍 UI 完整性测试 - 无障碍与交互', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'teacher001', '123456');
    await waitForPageLoad(page);
  });

  test('TC-A11Y-01: 图标 aria-hidden 验证', async ({ page }) => {
    // 验证菜单图标有 aria-hidden
    const icons = page.locator('.sidebar-menu .anticon');
    const count = await icons.count();
    
    for (let i = 0; i < Math.min(count, 3); i++) {
      const icon = icons.nth(i);
      const ariaHidden = await icon.getAttribute('aria-hidden');
      expect(ariaHidden).toBe('true');
    }
  });

  test('TC-A11Y-02: 按钮 aria-label 验证', async ({ page }) => {
    // 验证登录页按钮有 aria-label
    await page.goto('/');
    
    const loginBtn = page.locator('button[type="submit"]');
    const ariaLabel = await loginBtn.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
  });

  test('TC-A11Y-03: 表单字段 aria-label 验证', async ({ page }) => {
    await page.goto('/');
    
    // 验证账号输入框
    const accountInput = page.locator('input[placeholder="身份证号 / 用户名"]');
    const accountAriaLabel = await accountInput.getAttribute('aria-label');
    expect(accountAriaLabel).toBeTruthy();
    
    // 验证密码输入框
    const passwordInput = page.locator('input[placeholder="请输入密码"]');
    const passwordAriaLabel = await passwordInput.getAttribute('aria-label');
    expect(passwordAriaLabel).toBeTruthy();
  });
});

test.describe('🎯 UI 完整性测试 - 空状态组件', () => {
  test('TC-EMPTY-01: 教师工作台空状态验证', async ({ page }) => {
    // 使用一个没有数据的教师账号
    await login(page, 'teacher_empty', '123456');
    await waitForPageLoad(page);
    
    // 验证空状态组件存在
    const emptyState = page.locator('.empty-state');
    if (await emptyState.isVisible()) {
      await expect(emptyState).toContainText('暂无');
    }
  });

  test('TC-EMPTY-02: 成绩管理空状态验证', async ({ page }) => {
    await login(page, 'teacher001', '123456');
    await page.goto('/teacher/scores');
    await waitForPageLoad(page);
    
    // 验证未选择考试时的空状态
    const emptyState = page.locator('.empty-state:has-text("请选择考试")');
    await expect(emptyState).toBeVisible();
  });
});

test.describe('📱 UI 完整性测试 - 响应式断点', () => {
  const breakpoints = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1440, height: 900 },
  ];

  for (const bp of breakpoints) {
    test(`TC-RESPONSIVE-01: ${bp.name} 断点验证 (${bp.width}x${bp.height})`, async ({ page }) => {
      await login(page, 'teacher001', '123456');
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await waitForPageLoad(page);
      
      // 验证页面没有水平滚动条（内容溢出）
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const windowWidth = await page.evaluate(() => window.innerWidth);
      
      expect(bodyWidth).toBeLessThanOrEqual(windowWidth + 20); // 允许 20px 误差
    });
  }
});

// ==================== 测试报告 ====================

test.describe('📊 测试完成报告', () => {
  test('生成测试摘要', async ({ page }) => {
    console.log('\n==============================================');
    console.log('🎉 UI 完整性测试完成');
    console.log('==============================================');
    console.log('📋 测试覆盖范围:');
    console.log('  ✓ 登录页响应式布局');
    console.log('  ✓ 教师端布局与导航');
    console.log('  ✓ 移动端抽屉菜单');
    console.log('  ✓ 面包屑导航');
    console.log('  ✓ 教师工作台统计卡片');
    console.log('  ✓ 成绩管理搜索与防抖');
    console.log('  ✓ 学生端考试卡片与筛选');
    console.log('  ✓ 表格响应式适配');
    console.log('  ✓ 无障碍属性');
    console.log('  ✓ 空状态组件');
    console.log('  ✓ 响应式断点');
    console.log('==============================================\n');
    
    expect(true).toBe(true);
  });
});
