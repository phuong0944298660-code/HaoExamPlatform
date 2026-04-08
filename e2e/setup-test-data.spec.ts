/**
 * 测试数据准备脚本
 * 通过 API 创建测试所需的数据
 */

import { test, expect, request } from '@playwright/test';

test.describe('测试数据准备', () => {
  const BASE_URL = 'http://localhost';
  
  test('创建测试教师账号', async () => {
    const apiContext = await request.newContext({
      baseURL: BASE_URL,
    });

    // 1. 管理员登录获取token
    const loginResponse = await apiContext.post('/api/v1/accounts/login', {
      data: {
        account: 'admin',
        password: 'admin123'
      }
    });
    
    expect(loginResponse.ok()).toBeTruthy();
    const loginData = await loginResponse.json();
    const token = loginData.access_token;
    
    // 2. 创建教师账号（使用新接口）
    const teacherResponse = await apiContext.post('/api/v1/accounts/single', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      form: {
        username: 'teacher1',
        password: 'teacher123',
        role: 'teacher',
        name: '测试教师',
        grade_group: 'elementary'
      }
    });
    
    if (teacherResponse.ok()) {
      console.log('✅ 教师账号 teacher1 创建成功');
    } else if (teacherResponse.status() === 400) {
      console.log('ℹ️ 教师账号 teacher1 已存在');
    } else {
      console.log('⚠️ 教师账号创建失败:', await teacherResponse.text());
    }
    
    await apiContext.dispose();
  });

  test('创建测试学生账号', async () => {
    const apiContext = await request.newContext({
      baseURL: BASE_URL,
    });

    const loginResponse = await apiContext.post('/api/v1/accounts/login', {
      data: {
        account: 'admin',
        password: 'admin123'
      }
    });
    
    if (!loginResponse.ok()) {
      console.log('管理员登录失败:', await loginResponse.text());
      await apiContext.dispose();
      return;
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.access_token;
    
    // 创建测试学生
    const studentResponse = await apiContext.post('/api/v1/accounts/', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      data: {
        username: 'student_test',
        password: 'student123',
        role: 'student',
        name: '测试学生',
        identity_no: '450102201501011234',
        grade_group: 'elementary',
        is_activated: true
      }
    });
    
    if (studentResponse.ok()) {
      console.log('✅ 测试学生账号创建成功');
    } else {
      console.log('ℹ️ 学生账号已存在或创建失败');
    }
    
    await apiContext.dispose();
  });

  test('创建测试题库', async () => {
    const apiContext = await request.newContext({
      baseURL: BASE_URL,
    });

    const loginResponse = await apiContext.post('/api/v1/accounts/login', {
      data: {
        username: 'teacher1',
        password: 'teacher123'
      }
    });
    
    if (!loginResponse.ok()) {
      console.log('⚠️ 教师登录失败，跳过题库创建');
      await apiContext.dispose();
      return;
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.access_token;
    
    // 创建题库
    const bankResponse = await apiContext.post('/api/v1/questions/banks', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      data: {
        name: '测试题库_自动化',
        description: '用于自动化测试的题库',
        grade_group: 'elementary'
      }
    });
    
    if (bankResponse.ok()) {
      console.log('✅ 测试题库创建成功');
    } else {
      console.log('⚠️ 题库创建失败:', await bankResponse.text());
    }
    
    await apiContext.dispose();
  });

  test('创建测试考试', async () => {
    const apiContext = await request.newContext({
      baseURL: BASE_URL,
    });

    const loginResponse = await apiContext.post('/api/v1/accounts/login', {
      data: {
        username: 'teacher1',
        password: 'teacher123'
      }
    });
    
    if (!loginResponse.ok()) {
      console.log('⚠️ 教师登录失败，跳过考试创建');
      await apiContext.dispose();
      return;
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.access_token;
    
    const now = new Date();
    const endTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24小时后
    
    // 创建考试
    const examResponse = await apiContext.post('/api/v1/exams/', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      data: {
        name: '测试考试_自动化',
        description: '用于自动化测试的考试',
        start_time: now.toISOString(),
        end_time: endTime.toISOString(),
        duration: 120,
        status: 'published'
      }
    });
    
    if (examResponse.ok()) {
      console.log('✅ 测试考试创建成功');
    } else {
      console.log('⚠️ 考试创建失败:', await examResponse.text());
    }
    
    await apiContext.dispose();
  });

  test('创建测试班级', async () => {
    const apiContext = await request.newContext({
      baseURL: BASE_URL,
    });

    const loginResponse = await apiContext.post('/api/v1/accounts/login', {
      data: {
        username: 'teacher1',
        password: 'teacher123'
      }
    });
    
    if (!loginResponse.ok()) {
      console.log('⚠️ 教师登录失败，跳过班级创建');
      await apiContext.dispose();
      return;
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.access_token;
    
    // 创建班级
    const classResponse = await apiContext.post('/api/v1/classes/', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      data: {
        name: '测试班级_自动化',
        grade: 'elementary',
        description: '用于自动化测试的班级'
      }
    });
    
    if (classResponse.ok()) {
      console.log('✅ 测试班级创建成功');
    } else {
      console.log('⚠️ 班级创建失败:', await classResponse.text());
    }
    
    await apiContext.dispose();
  });

  test('创建测试激活码', async () => {
    const apiContext = await request.newContext({
      baseURL: BASE_URL,
    });

    const loginResponse = await apiContext.post('/api/v1/accounts/login', {
      data: {
        account: 'admin',
        password: 'admin123'
      }
    });
    
    if (!loginResponse.ok()) {
      console.log('管理员登录失败:', await loginResponse.text());
      await apiContext.dispose();
      return;
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.access_token;
    
    // 首先创建激活计划
    const planResponse = await apiContext.post('/api/v1/activations/admin/plans', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      data: {
        name: '测试小学学生计划',
        target_role: 'student',
        target_grade_group: 'elementary',
        validity_days: 365,
        permissions: {
          question_banks: [1],
          resource_packages: [],
          features: {
            can_create_exam: false,
            can_use_ai_grader: false,
            can_export_data: false
          }
        }
      }
    });
    
    let planId = 1;
    if (planResponse.ok()) {
      const planData = await planResponse.json();
      planId = planData.id;
      console.log('✅ 激活计划创建成功');
    } else {
      console.log('ℹ️ 激活计划已存在或创建失败');
    }
    
    // 批量生成激活码
    const codesResponse = await apiContext.post('/api/v1/activations/admin/codes/batch', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      data: {
        plan_id: planId,
        count: 10,
        source: 'offline',
        batch_no: 'TEST_BATCH_001'
      }
    });
    
    if (codesResponse.ok()) {
      console.log('✅ 测试激活码创建成功');
    } else {
      console.log('⚠️ 激活码创建失败:', await codesResponse.text());
    }
    
    await apiContext.dispose();
  });
});
