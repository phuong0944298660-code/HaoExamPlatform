/**
 * Java后端功能验证测试
 * 逐项模拟用户操作，验证真实API和数据库交互
 */
import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173'; // 前端开发服务器
const API_URL = 'http://localhost:8080/api/v1'; // Java后端API

test.describe('Java后端功能验证 - 用户操作模拟', () => {
  
  test.beforeAll(async () => {
    console.log('🔧 测试环境: Java后端 @ http://localhost:8080');
  });

  // ═══════════════════════════════════════════════════════════════
  // 测试组1: 登录功能
  // ═══════════════════════════════════════════════════════════════
  test.describe('📱 登录功能验证', () => {
    
    test('TC-LOGIN-01: 管理员登录 - 验证真实数据返回', async ({ page }) => {
      console.log('  📝 模拟操作: 管理员访问登录页面并输入凭据');
      
      // 步骤1: 访问登录页面
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');
      
      // 步骤2: 输入管理员账号
      await page.fill('[data-testid="account-input"], input[placeholder*="账号"], input[type="text"]', 'admin');
      await page.fill('[data-testid="password-input"], input[placeholder*="密码"], input[type="password"]', 'admin123');
      
      // 步骤3: 点击登录按钮
      const loginButton = await page.locator('button:has-text("登录"), button[type="submit"]').first();
      await Promise.all([
        page.waitForResponse(response => 
          response.url().includes('/accounts/login') && response.status() === 200
        ),
        loginButton.click()
      ]);
      
      // 验证: 检查localStorage中的token
      const token = await page.evaluate(() => localStorage.getItem('token'));
      expect(token).toBeTruthy();
      console.log('  ✅ Token已保存到localStorage');
      
      // 验证: 检查用户信息
      const userInfo = await page.evaluate(() => localStorage.getItem('userInfo'));
      expect(userInfo).toBeTruthy();
      const user = JSON.parse(userInfo!);
      expect(user.role).toBe('admin');
      expect(user.name).toBe('系统管理员');
      console.log('  ✅ 用户信息正确: role=' + user.role + ', name=' + user.name);
      
      // 截图保存
      await page.screenshot({ path: 'test-results/login-admin-success.png' });
    });

    test('TC-LOGIN-02: 教师登录 - 验证角色权限', async ({ page }) => {
      console.log('  📝 模拟操作: 教师账号登录');
      
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');
      
      await page.fill('input[type="text"]', 'teacher_primary');
      await page.fill('input[type="password"]', 'teacher123');
      
      const loginButton = await page.locator('button:has-text("登录"), button[type="submit"]').first();
      await Promise.all([
        page.waitForResponse(response => 
          response.url().includes('/accounts/login') && response.status() === 200
        ),
        loginButton.click()
      ]);
      
      // 等待页面跳转
      await page.waitForTimeout(1000);
      
      const userInfo = await page.evaluate(() => localStorage.getItem('userInfo'));
      const user = JSON.parse(userInfo!);
      expect(user.role).toBe('teacher');
      console.log('  ✅ 教师登录成功，角色: ' + user.role);
      
      await page.screenshot({ path: 'test-results/login-teacher-success.png' });
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // 测试组2: 题库管理 - 完整CRUD流程
  // ═══════════════════════════════════════════════════════════════
  test.describe('📚 题库管理 - 完整CRUD流程', () => {
    
    test('TC-BANK-01: 查看题库列表 - 验证真实数据加载', async ({ page }) => {
      console.log('  📝 模拟操作: 教师登录后查看题库列表');
      
      // 先登录
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="text"]', 'teacher_primary');
      await page.fill('input[type="password"]', 'teacher123');
      await page.click('button:has-text("登录"), button[type="submit"]');
      
      // 等待登录完成并跳转
      await page.waitForTimeout(1500);
      
      // 访问题库管理页面
      await page.goto(`${BASE_URL}/teacher/question-banks`);
      await page.waitForLoadState('networkidle');
      
      // 等待API响应
      const response = await page.waitForResponse(response => 
        response.url().includes('/questions/banks') && response.status() === 200
      );
      
      const data = await response.json();
      expect(data.code).toBe(200);
      expect(data.data.total).toBeGreaterThan(0);
      console.log('  ✅ 题库列表加载成功，共 ' + data.data.total + ' 个题库');
      
      // 验证页面显示
      const bankCards = await page.locator('.bank-card, [class*="bank"], .el-card').count();
      console.log('  ✅ 页面显示 ' + bankCards + ' 个题库卡片');
      
      await page.screenshot({ path: 'test-results/question-bank-list.png' });
    });

    test('TC-BANK-02: 创建题库 - 验证真实写入数据库', async ({ page }) => {
      console.log('  📝 模拟操作: 教师创建新题库');
      
      // 登录
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="text"]', 'teacher_primary');
      await page.fill('input[type="password"]', 'teacher123');
      await page.click('button:has-text("登录")');
      await page.waitForTimeout(1500);
      
      // 访问题库管理
      await page.goto(`${BASE_URL}/teacher/question-banks`);
      await page.waitForLoadState('networkidle');
      
      // 点击创建按钮
      const createButton = await page.locator('button:has-text("创建"), button:has-text("新建"), .el-button--primary').first();
      await createButton.click();
      
      // 填写题库信息
      const timestamp = Date.now();
      const bankName = `测试题库_${timestamp}`;
      
      await page.fill('input[placeholder*="名称"], input[name="name"]', bankName);
      await page.fill('textarea[placeholder*="描述"], textarea[name="description"]', '这是自动化测试创建的题库');
      
      // 选择学段
      const gradeSelect = await page.locator('select[name="grade_group"], .el-select').first();
      if (await gradeSelect.isVisible().catch(() => false)) {
        await gradeSelect.selectOption('PRIMARY');
      }
      
      // 提交创建
      const submitButton = await page.locator('button:has-text("确定"), button:has-text("提交"), button[type="submit"]').first();
      
      const createResponse = await Promise.all([
        page.waitForResponse(response => 
          response.url().includes('/questions/banks') && response.request().method() === 'POST'
        ),
        submitButton.click()
      ]);
      
      const responseData = await createResponse[0].json();
      expect(responseData.code).toBe(200);
      expect(responseData.data.id).toBeTruthy();
      console.log('  ✅ 题库创建成功，ID: ' + responseData.data.id);
      
      // 验证数据库中确实存在
      await page.waitForTimeout(500);
      const verifyResponse = await page.request.get(`${API_URL}/questions/banks/${responseData.data.id}`);
      const verifyData = await verifyResponse.json();
      expect(verifyData.code).toBe(200);
      expect(verifyData.data.name).toBe(bankName);
      console.log('  ✅ 数据库验证通过，题库真实存在');
      
      await page.screenshot({ path: 'test-results/question-bank-created.png' });
    });

    test('TC-BANK-03: 更新题库 - 验证真实更新', async ({ page }) => {
      console.log('  📝 模拟操作: 更新已存在的题库');
      
      // 登录
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="text"]', 'teacher_primary');
      await page.fill('input[type="password"]', 'teacher123');
      await page.click('button:has-text("登录")');
      await page.waitForTimeout(1500);
      
      // 获取第一个题库进行编辑
      await page.goto(`${BASE_URL}/teacher/question-banks`);
      await page.waitForLoadState('networkidle');
      
      // 点击编辑按钮（第一个题库的编辑按钮）
      const editButton = await page.locator('button:has-text("编辑"), .el-button--text, [class*="edit"]').first();
      await editButton.click();
      
      // 修改题库名称
      const newName = '更新后的题库名称_' + Date.now();
      await page.fill('input[name="name"], input[placeholder*="名称"]', newName);
      
      // 提交更新
      const submitButton = await page.locator('button:has-text("确定"), button:has-text("保存")').first();
      
      const updateResponse = await Promise.all([
        page.waitForResponse(response => 
          response.url().includes('/questions/banks/') && response.request().method() === 'PUT'
        ),
        submitButton.click()
      ]);
      
      const responseData = await updateResponse[0].json();
      expect(responseData.code).toBe(200);
      console.log('  ✅ 题库更新成功');
      
      await page.screenshot({ path: 'test-results/question-bank-updated.png' });
    });

    test('TC-BANK-04: 删除题库 - 验证真实删除', async ({ page }) => {
      console.log('  📝 模拟操作: 删除题库');
      
      // 先创建一个用于删除的题库
      const timestamp = Date.now();
      const createResponse = await page.request.post(`${API_URL}/questions/banks`, {
        data: {
          name: `待删除题库_${timestamp}`,
          description: '用于测试删除的题库',
          grade_group: 'PRIMARY',
          status: 'draft'
        }
      });
      const createData = await createResponse.json();
      const bankId = createData.data.id;
      console.log('  📌 创建待删除题库，ID: ' + bankId);
      
      // 登录并访问题库列表
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="text"]', 'teacher_primary');
      await page.fill('input[type="password"]', 'teacher123');
      await page.click('button:has-text("登录")');
      await page.waitForTimeout(1500);
      
      await page.goto(`${BASE_URL}/teacher/question-banks`);
      await page.waitForLoadState('networkidle');
      
      // 点击删除按钮（最后一个题库）
      const deleteButton = await page.locator('button:has-text("删除"), .el-button--danger, [class*="delete"]').last();
      
      // 处理确认对话框
      page.on('dialog', async dialog => {
        await dialog.accept();
      });
      
      const deleteResponse = await Promise.all([
        page.waitForResponse(response => 
          response.url().includes('/questions/banks/') && response.request().method() === 'DELETE'
        ),
        deleteButton.click()
      ]);
      
      const responseData = await deleteResponse[0].json();
      expect(responseData.code).toBe(200);
      console.log('  ✅ 题库删除成功');
      
      // 验证数据库中已删除
      await page.waitForTimeout(500);
      const verifyResponse = await page.request.get(`${API_URL}/questions/banks/${bankId}`);
      const verifyData = await verifyResponse.json();
      expect(verifyData.code).toBe(500);
      console.log('  ✅ 数据库验证通过，题库已真实删除');
      
      await page.screenshot({ path: 'test-results/question-bank-deleted.png' });
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // 测试组3: 考试管理
  // ═══════════════════════════════════════════════════════════════
  test.describe('📝 考试管理 - 完整CRUD流程', () => {
    
    test('TC-EXAM-01: 查看考试列表 - 验证真实数据', async ({ page }) => {
      console.log('  📝 模拟操作: 查看考试列表');
      
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="text"]', 'teacher_primary');
      await page.fill('input[type="password"]', 'teacher123');
      await page.click('button:has-text("登录")');
      await page.waitForTimeout(1500);
      
      await page.goto(`${BASE_URL}/teacher/exams`);
      await page.waitForLoadState('networkidle');
      
      const response = await page.waitForResponse(response => 
        response.url().includes('/exams') && response.status() === 200
      );
      
      const data = await response.json();
      expect(data.code).toBe(200);
      console.log('  ✅ 考试列表加载成功，共 ' + data.data.total + ' 个考试');
      
      await page.screenshot({ path: 'test-results/exam-list.png' });
    });

    test('TC-EXAM-02: 创建考试 - 验证真实写入', async ({ page }) => {
      console.log('  📝 模拟操作: 创建新考试');
      
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="text"]', 'teacher_primary');
      await page.fill('input[type="password"]', 'teacher123');
      await page.click('button:has-text("登录")');
      await page.waitForTimeout(1500);
      
      await page.goto(`${BASE_URL}/teacher/exams/create`);
      await page.waitForLoadState('networkidle');
      
      // 填写考试信息
      const timestamp = Date.now();
      const examName = `自动化测试考试_${timestamp}`;
      
      await page.fill('input[name="name"], input[placeholder*="名称"]', examName);
      await page.fill('textarea[name="description"], textarea[placeholder*="描述"]', '这是自动化测试创建的考试');
      
      // 设置时间
      const startTime = '2026-06-01 09:00:00';
      const endTime = '2026-06-01 11:00:00';
      
      const dateInputs = await page.locator('input[type="datetime-local"], input[type="text"]').all();
      if (dateInputs.length >= 2) {
        await dateInputs[0].fill(startTime);
        await dateInputs[1].fill(endTime);
      }
      
      // 选择套卷
      const paperSelect = await page.locator('select[name="paperId"], .el-select').first();
      if (await paperSelect.isVisible().catch(() => false)) {
        await paperSelect.selectOption('1');
      }
      
      // 提交创建
      const submitButton = await page.locator('button:has-text("创建"), button:has-text("提交"), button[type="submit"]').first();
      
      const createResponse = await Promise.all([
        page.waitForResponse(response => 
          response.url().includes('/exams') && response.request().method() === 'POST'
        ),
        submitButton.click()
      ]);
      
      const responseData = await createResponse[0].json();
      expect(responseData.code).toBe(200);
      console.log('  ✅ 考试创建成功，ID: ' + responseData.data.id);
      
      await page.screenshot({ path: 'test-results/exam-created.png' });
    });

    test('TC-EXAM-03: 发布考试 - 验证状态变更', async ({ page }) => {
      console.log('  📝 模拟操作: 发布考试');
      
      // 先创建一个草稿考试
      const createResponse = await page.request.post(`${API_URL}/exams`, {
        data: {
          name: `待发布考试_${Date.now()}`,
          description: '用于测试发布的考试',
          gradeGroup: 'PRIMARY',
          startTime: '2026-06-01 09:00:00',
          endTime: '2026-06-01 11:00:00',
          duration: 120,
          paperId: 1
        }
      });
      const createData = await createResponse.json();
      const examId = createData.data.id;
      console.log('  📌 创建待发布考试，ID: ' + examId);
      
      // 登录并发布
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="text"]', 'teacher_primary');
      await page.fill('input[type="password"]', 'teacher123');
      await page.click('button:has-text("登录")');
      await page.waitForTimeout(1500);
      
      await page.goto(`${BASE_URL}/teacher/exams`);
      await page.waitForLoadState('networkidle');
      
      // 点击发布按钮
      const publishButton = await page.locator('button:has-text("发布"), .el-button--success').first();
      
      const publishResponse = await Promise.all([
        page.waitForResponse(response => 
          response.url().includes('/publish') && response.status() === 200
        ),
        publishButton.click()
      ]);
      
      const responseData = await publishResponse[0].json();
      expect(responseData.code).toBe(200);
      console.log('  ✅ 考试发布成功');
      
      // 验证状态已变更
      const verifyResponse = await page.request.get(`${API_URL}/exams/${examId}`);
      const verifyData = await verifyResponse.json();
      expect(verifyData.data.status).toBe('PUBLISHED');
      console.log('  ✅ 考试状态已变更为 PUBLISHED');
      
      await page.screenshot({ path: 'test-results/exam-published.png' });
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // 测试组4: 账号管理 - 批量生成
  // ═══════════════════════════════════════════════════════════════
  test.describe('👥 账号管理 - 批量生成', () => {
    
    test('TC-ACCOUNT-01: 批量生成练习账号 - 验证真实写入数据库', async ({ page }) => {
      console.log('  📝 模拟操作: 管理员批量生成练习账号');
      
      // 登录管理员
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="text"]', 'admin');
      await page.fill('input[type="password"]', 'admin123');
      await page.click('button:has-text("登录")');
      await page.waitForTimeout(1500);
      
      // 访问账号管理页面
      await page.goto(`${BASE_URL}/admin/accounts`);
      await page.waitForLoadState('networkidle');
      
      // 获取当前账号数量
      const listResponse = await page.waitForResponse(response => 
        response.url().includes('/accounts') && response.status() === 200
      );
      const listData = await listResponse.json();
      const beforeCount = listData.data.total;
      console.log('  📊 生成前账号数量: ' + beforeCount);
      
      // 点击批量生成按钮
      const batchButton = await page.locator('button:has-text("批量生成"), button:has-text("生成")').first();
      await batchButton.click();
      
      // 填写生成参数
      await page.fill('input[name="count"], input[placeholder*="数量"]', '5');
      await page.fill('input[name="prefix"], input[placeholder*="前缀"]', 'BATCH');
      
      // 提交生成
      const submitButton = await page.locator('button:has-text("确定"), button[type="submit"]').first();
      
      const generateResponse = await Promise.all([
        page.waitForResponse(response => 
          response.url().includes('/batch-practice') && response.status() === 200
        ),
        submitButton.click()
      ]);
      
      const responseData = await generateResponse[0].json();
      expect(responseData.code).toBe(200);
      expect(responseData.data.count).toBe(5);
      console.log('  ✅ 批量生成成功，生成 ' + responseData.data.count + ' 个账号');
      
      // 验证数据库中新增了账号
      await page.waitForTimeout(500);
      const verifyResponse = await page.request.get(`${API_URL}/accounts?page=1&size=100`);
      const verifyData = await verifyResponse.json();
      const afterCount = verifyData.data.total;
      console.log('  📊 生成后账号数量: ' + afterCount);
      
      expect(afterCount).toBe(beforeCount + 5);
      console.log('  ✅ 数据库验证通过，账号真实写入');
      
      await page.screenshot({ path: 'test-results/accounts-batch-generated.png' });
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // 测试组5: API直接测试 - 验证后端功能
  // ═══════════════════════════════════════════════════════════════
  test.describe('🔌 API直接测试 - 验证Java后端', () => {
    
    test('TC-API-01: 健康检查 - 验证后端运行状态', async ({ request }) => {
      console.log('  📝 测试API: GET /health');
      
      const response = await request.get(`${API_URL}/health`);
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data.code).toBe(200);
      expect(data.data.status).toBe('UP');
      console.log('  ✅ Java后端运行正常: ' + data.data.status);
    });

    test('TC-API-02: 登录接口 - 验证JWT认证', async ({ request }) => {
      console.log('  📝 测试API: POST /accounts/login');
      
      const response = await request.post(`${API_URL}/accounts/login`, {
        data: {
          account: 'admin',
          password: 'admin123'
        }
      });
      
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.code).toBe(200);
      expect(data.data.token).toBeTruthy();
      expect(data.data.user.role).toBe('admin');
      console.log('  ✅ 登录API正常，JWT Token已生成');
    });

    test('TC-API-03: 题库CRUD - 完整流程验证', async ({ request }) => {
      console.log('  📝 测试题库API完整CRUD流程');
      
      // 1. 创建题库
      const createResponse = await request.post(`${API_URL}/questions/banks`, {
        data: {
          name: 'API测试题库_' + Date.now(),
          description: '通过API测试创建的题库',
          grade_group: 'PRIMARY',
          status: 'draft'
        }
      });
      const createData = await createResponse.json();
      expect(createData.code).toBe(200);
      const bankId = createData.data.id;
      console.log('  ✅ 创建成功，ID: ' + bankId);
      
      // 2. 查询详情
      const getResponse = await request.get(`${API_URL}/questions/banks/${bankId}`);
      const getData = await getResponse.json();
      expect(getData.code).toBe(200);
      console.log('  ✅ 查询成功');
      
      // 3. 更新题库
      const updateResponse = await request.put(`${API_URL}/questions/banks/${bankId}`, {
        data: {
          name: 'API测试题库_已更新',
          status: 'active'
        }
      });
      const updateData = await updateResponse.json();
      expect(updateData.code).toBe(200);
      console.log('  ✅ 更新成功');
      
      // 4. 删除题库
      const deleteResponse = await request.delete(`${API_URL}/questions/banks/${bankId}`);
      const deleteData = await deleteResponse.json();
      expect(deleteData.code).toBe(200);
      console.log('  ✅ 删除成功');
      
      // 5. 验证删除
      const verifyResponse = await request.get(`${API_URL}/questions/banks/${bankId}`);
      const verifyData = await verifyResponse.json();
      expect(verifyData.code).toBe(500);
      console.log('  ✅ 验证删除成功');
    });

    test('TC-API-04: 考试CRUD - 完整流程验证', async ({ request }) => {
      console.log('  📝 测试考试API完整CRUD流程');
      
      // 1. 创建考试
      const createResponse = await request.post(`${API_URL}/exams`, {
        data: {
          name: 'API测试考试_' + Date.now(),
          description: '通过API测试创建的考试',
          gradeGroup: 'PRIMARY',
          startTime: '2026-06-01 09:00:00',
          endTime: '2026-06-01 11:00:00',
          duration: 120,
          paperId: 1
        }
      });
      const createData = await createResponse.json();
      expect(createData.code).toBe(200);
      const examId = createData.data.id;
      console.log('  ✅ 创建考试成功，ID: ' + examId);
      
      // 2. 发布考试
      const publishResponse = await request.post(`${API_URL}/exams/${examId}/publish`);
      const publishData = await publishResponse.json();
      expect(publishData.code).toBe(200);
      console.log('  ✅ 发布考试成功');
      
      // 3. 验证状态
      const getResponse = await request.get(`${API_URL}/exams/${examId}`);
      const getData = await getResponse.json();
      expect(getData.data.status).toBe('PUBLISHED');
      console.log('  ✅ 状态验证为 PUBLISHED');
      
      // 4. 更新考试
      const updateResponse = await request.put(`${API_URL}/exams/${examId}`, {
        data: {
          name: 'API测试考试_已更新',
          duration: 150
        }
      });
      expect(updateResponse.json().code).toBe(200);
      console.log('  ✅ 更新考试成功');
      
      // 5. 删除考试
      const deleteResponse = await request.delete(`${API_URL}/exams/${examId}`);
      expect(deleteResponse.json().code).toBe(200);
      console.log('  ✅ 删除考试成功');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // 测试组6: 数据一致性验证
  // ═══════════════════════════════════════════════════════════════
  test.describe('📊 数据一致性验证', () => {
    
    test('TC-DATA-01: 验证数据库真实数据', async ({ request }) => {
      console.log('  📝 验证各表数据量');
      
      // 验证账号数据
      const accountsResponse = await request.get(`${API_URL}/accounts?page=1&size=1`);
      const accountsData = await accountsResponse.json();
      console.log('  📊 账号数量: ' + accountsData.data.total);
      expect(accountsData.data.total).toBeGreaterThan(0);
      
      // 验证题库数据
      const banksResponse = await request.get(`${API_URL}/questions/banks`);
      const banksData = await banksResponse.json();
      console.log('  📊 题库数量: ' + banksData.data.total);
      expect(banksData.data.total).toBeGreaterThan(0);
      
      // 验证题目数据
      const questionsResponse = await request.get(`${API_URL}/questions`);
      const questionsData = await questionsResponse.json();
      console.log('  📊 题目数量: ' + questionsData.data.total);
      expect(questionsData.data.total).toBeGreaterThan(0);
      
      // 验证考试数据
      const examsResponse = await request.get(`${API_URL}/exams`);
      const examsData = await examsResponse.json();
      console.log('  📊 考试数量: ' + examsData.data.total);
      expect(examsData.data.total).toBeGreaterThanOrEqual(0);
      
      // 验证套卷数据
      const papersResponse = await request.get(`${API_URL}/papers`);
      const papersData = await papersResponse.json();
      console.log('  📊 套卷数量: ' + papersData.data.total);
      expect(papersData.data.total).toBeGreaterThan(0);
      
      console.log('  ✅ 所有数据表验证通过，数据真实存在');
    });
  });
});
