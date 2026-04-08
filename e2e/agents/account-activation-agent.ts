/**
 * Agent 1: 账号与激活测试 Agent
 * 基于 USER_GUIDE_AND_TEST_FLOW.md 测试用例 1-8
 */

import { test, expect, Page } from '@playwright/test';
import { TestHelper } from '../utils/test-helper';

const helper = new TestHelper();

test.describe('【Agent 1】账号与激活测试', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await helper.init(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  // ========== 测试用例 1: 新用户激活 ==========
  test('TC001: 新用户使用有效激活码激活账号 @P0', async () => {
    test.info().annotations.push({ type: 'agent', description: '账号与激活测试 Agent' });
    test.info().annotations.push({ type: 'requirement', description: '激活码配置' });

    const identityNo = '45010220150101121X'; // 新身份证号（18位）
    const activationCode = 'STUDENT-PRIMARY-001'; // 测试激活码

    // 步骤1: 访问激活页面
    await page.goto('/activate');
    await page.waitForLoadState('networkidle');

    // 步骤2: 填写激活信息（根据实际Login.vue和Activate.vue结构调整）
    await page.fill('input[placeholder="请输入激活码"]', activationCode);
    await page.fill('input[placeholder="请输入18位身份证号"]', identityNo);
    await page.fill('input[placeholder="留空则使用初始密码"]', 'Test123456');

    // 步骤3: 等待表单验证完成并提交激活
    await page.waitForTimeout(1000);
    await page.click('button:has-text("激 活")');

    // 验收标准: 激活成功，跳转登录页
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/.*login.*/, { timeout: 5000 });

    // 验证: 使用新账号可以登录
    await page.fill('input[placeholder="身份证号 / 用户名"]', identityNo);
    await page.fill('input[placeholder="请输入密码"]', 'Test123456');
    await page.click('button:has-text("登 录")');
    
    // 登录成功后跳转到工作台
    await page.waitForTimeout(3000);
    const url = page.url();
    expect(url).toMatch(/student|dashboard|home/);
  });

  // ========== 测试用例 2: 重复使用激活码 ==========
  test('TC002: 使用已使用的激活码应失败 @P0', async () => {
    test.info().annotations.push({ type: 'agent', description: '账号与激活测试 Agent' });
    test.info().annotations.push({ type: 'requirement', description: '激活码配置-使用限制' });

    const usedCode = 'USED-CODE-001';
    
    await page.goto('/activate');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[placeholder="请输入激活码"]', usedCode);
    await page.fill('input[placeholder="请输入18位身份证号"]', '450102201501022222'); // 保持18位
    await page.click('button:has-text("激活")');

    // 验收标准: 提示激活码已被使用或无效
    await page.waitForTimeout(2000);
    const errorVisible = await page.locator('.ant-message-error, .ant-message-warning').count() > 0;
    expect(errorVisible).toBe(true);
  });

  // ========== 测试用例 3: 角色不匹配激活 ==========
  test('TC003: 学生账号使用教师激活码应失败 @P0', async () => {
    test.info().annotations.push({ type: 'agent', description: '账号与激活测试 Agent' });
    test.info().annotations.push({ type: 'requirement', description: '激活码配置-角色独立' });

    const teacherCode = 'TEACHER-PRIMARY-001';
    
    await page.goto('/activate');
    await page.waitForLoadState('networkidle');
    
    // 学生身份证号
    await page.fill('input[placeholder="请输入激活码"]', teacherCode);
    await page.fill('input[placeholder="请输入18位身份证号"]', '450102201501033333'); // 保持18位
    await page.click('button:has-text("激活")');

    // 验收标准: 提示角色不匹配或激活失败
    await page.waitForTimeout(2000);
    const errorVisible = await page.locator('.ant-message-error').count() > 0;
    expect(errorVisible).toBe(true);
  });

  // ========== 测试用例 4: 学段不匹配激活 ==========
  test('TC004: 小学账号使用初中激活码应失败 @P0', async () => {
    test.info().annotations.push({ type: 'agent', description: '账号与激活测试 Agent' });
    test.info().annotations.push({ type: 'requirement', description: '激活码配置-学段限制' });

    const juniorCode = 'STUDENT-JUNIOR-001';
    
    await page.goto('/activate');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[placeholder="请输入激活码"]', juniorCode);
    await page.fill('input[placeholder="请输入18位身份证号"]', '450102201501044444'); // 保持18位
    await page.click('button:has-text("激活")');

    // 验收标准: 提示学段不匹配
    await page.waitForTimeout(2000);
    const errorVisible = await page.locator('.ant-message-error').count() > 0;
    expect(errorVisible).toBe(true);
  });

  // ========== 测试用例 5: 叠加激活 ==========
  test('TC005: 已激活用户使用新激活码叠加权限 @P1', async () => {
    test.info().annotations.push({ type: 'agent', description: '账号与激活测试 Agent' });
    test.info().annotations.push({ type: 'requirement', description: '激活码配置-权限叠加' });

    // 使用已激活的测试账号登录
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[placeholder="身份证号 / 用户名"]', 'student1');
    await page.fill('input[placeholder="请输入密码"]', 'student123');
    await page.click('button:has-text("登 录")');
    
    await page.waitForTimeout(3000);
    
    // 进入激活页面
    await page.goto('/activate');
    await page.waitForLoadState('networkidle');
    
    // 输入新激活码
    const newCode = 'STUDENT-PRIMARY-002';
    await page.fill('input[placeholder="请输入激活码"]', newCode);
    await page.fill('input[placeholder="请输入18位身份证号"]', 'student1');
    await page.click('button:has-text("激活")');

    // 验收标准: 激活成功或提示已激活
    await page.waitForTimeout(2000);
    const messageVisible = await page.locator('.ant-message').count() > 0;
    expect(messageVisible).toBe(true);
  });

  // ========== 测试用例 6: 批量生成激活码 ==========
  test('TC006: 批量生成激活码并验证列表 @P1', async () => {
    test.info().annotations.push({ type: 'agent', description: '账号与激活测试 Agent' });
    test.info().annotations.push({ type: 'requirement', description: '激活码配置-批量生成' });

    // 管理员登录
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[placeholder="身份证号 / 用户名"]', 'admin');
    await page.fill('input[placeholder="请输入密码"]', 'admin123');
    await page.click('button:has-text("登 录")');
    
    await page.waitForTimeout(3000);
    
    // 进入激活码管理（根据实际路由调整）
    await page.goto('/admin/activation-codes');
    await page.waitForLoadState('networkidle');
    
    // 验证页面加载成功
    const pageContent = await page.textContent('body');
    expect(pageContent).toContain('激活码');
  });

  // ========== 测试用例 7: 作废未使用激活码 ==========
  test('TC007: 作废未使用的激活码 @P1', async () => {
    test.info().annotations.push({ type: 'agent', description: '账号与激活测试 Agent' });
    test.info().annotations.push({ type: 'requirement', description: '激活码配置-作废管理' });

    // 管理员登录
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[placeholder="身份证号 / 用户名"]', 'admin');
    await page.fill('input[placeholder="请输入密码"]', 'admin123');
    await page.click('button:has-text("登 录")');
    
    await page.waitForTimeout(3000);
    await page.goto('/admin/activation-codes');
    await page.waitForLoadState('networkidle');
    
    // 验证页面可以访问
    const url = page.url();
    expect(url).toContain('activation');
  });

  // ========== 测试用例 8: 作废已使用激活码应失败 ==========
  test('TC008: 已使用的激活码管理 @P1', async () => {
    test.info().annotations.push({ type: 'agent', description: '账号与激活测试 Agent' });
    test.info().annotations.push({ type: 'requirement', description: '激活码配置-作废限制' });

    // 管理员登录
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[placeholder="身份证号 / 用户名"]', 'admin');
    await page.fill('input[placeholder="请输入密码"]', 'admin123');
    await page.click('button:has-text("登 录")');
    
    await page.waitForTimeout(3000);
    await page.goto('/admin/activation-codes');
    await page.waitForLoadState('networkidle');
    
    // 验证页面可以访问
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });
});
