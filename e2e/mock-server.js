/**
 * 轻量级后端模拟服务
 * 用于在没有真实后端的情况下运行E2E测试
 * 
 * 启动: node mock-server.js
 * 端口: 8000
 */

const http = require('http');
const url = require('url');

// 测试账号数据
const TEST_ACCOUNTS = {
  'admin': { password: 'admin123', role: 'admin', name: '管理员' },
  'teacher': { password: 'teacher123', role: 'teacher', name: '教师' },
  'teacher_primary': { password: 'teacher123', role: 'teacher', name: '小学教师', grade_group: 'primary' },
  'teacher_junior': { password: 'teacher123', role: 'teacher', name: '初中教师', grade_group: 'junior' },
  '450102201501011234': { password: '123456', role: 'student', name: '张小北', grade_group: 'primary' },
  '450102201001011234': { password: '123456', role: 'student', name: '李小明', grade_group: 'junior' },
};

// 模拟题库数据
const QUESTION_BANKS = [
  { id: 1, name: '小学组模拟题库', grade_group: 'primary', total_questions: 50, status: 'published' },
  { id: 2, name: '初中组模拟题库', grade_group: 'junior', total_questions: 50, status: 'published' },
];

// 模拟套卷数据
const PAPERS = [
  { id: 1, name: '小学组模拟卷A', grade_group: 'primary', total_questions: 30, total_score: 100, status: 'published' },
];

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

const server = http.createServer((req, res) => {
  // 处理CORS预检请求
  if (req.method === 'OPTIONS') {
    res.writeHead(200, corsHeaders);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;

  console.log(`${new Date().toISOString()} - ${req.method} ${path}`);

  // 健康检查
  if (path === '/api/v1/health') {
    res.writeHead(200, corsHeaders);
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
    return;
  }

  // 登录接口
  if (path === '/api/v1/accounts/login' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const account = data.account || data.username;
        const password = data.password;

        const user = TEST_ACCOUNTS[account];
        if (user && user.password === password) {
          const token = 'mock-jwt-token-' + Date.now();
          res.writeHead(200, corsHeaders);
          res.end(JSON.stringify({
            code: 200,
            message: '登录成功',
            data: {
              token,
              user: {
                id: 1,
                account,
                name: user.name,
                role: user.role,
                grade_group: user.grade_group,
              }
            }
          }));
        } else {
          res.writeHead(401, corsHeaders);
          res.end(JSON.stringify({
            code: 401,
            message: '账号或密码错误',
          }));
        }
      } catch (e) {
        res.writeHead(400, corsHeaders);
        res.end(JSON.stringify({ code: 400, message: '请求格式错误' }));
      }
    });
    return;
  }

  // 获取当前用户信息
  if (path === '/api/v1/accounts/me' && req.method === 'GET') {
    res.writeHead(200, corsHeaders);
    res.end(JSON.stringify({
      code: 200,
      data: {
        id: 1,
        name: '测试用户',
        role: 'teacher',
      }
    }));
    return;
  }

  // 题库列表
  if (path === '/api/v1/question-banks' && req.method === 'GET') {
    res.writeHead(200, corsHeaders);
    res.end(JSON.stringify({
      code: 200,
      data: QUESTION_BANKS,
      meta: { total: QUESTION_BANKS.length }
    }));
    return;
  }

  // 套卷列表
  if (path === '/api/v1/papers' && req.method === 'GET') {
    res.writeHead(200, corsHeaders);
    res.end(JSON.stringify({
      code: 200,
      data: PAPERS,
      meta: { total: PAPERS.length }
    }));
    return;
  }

  // 仪表盘统计数据
  if (path === '/api/v1/dashboard/stats' && req.method === 'GET') {
    res.writeHead(200, corsHeaders);
    res.end(JSON.stringify({
      code: 200,
      data: {
        accounts: {
          primary: { practice: 320, exam: 480 },
          junior: { practice: 280, exam: 520 },
          total: 800
        },
        activation_codes: {
          teacher: 156,
          student: 892,
          remaining: 1248
        },
        online: {
          current: 128,
          peak: 356,
          change: '+12%'
        },
        todos: [
          { id: 1, title: '小学组激活码即将用完，请及时补充', type: 'urgent', time: '10分钟前' }
        ]
      }
    }));
    return;
  }

  // 考试引擎 - 获取试题
  if (path.startsWith('/api/v1/exam-engine/exams/') && path.endsWith('/questions') && req.method === 'GET') {
    const examId = path.split('/')[5];
    res.writeHead(200, corsHeaders);
    res.end(JSON.stringify({
      code: 200,
      data: {
        exam_id: parseInt(examId),
        exam_name: '2024春季小学组模拟考试',
        duration: 120,
        questions: [
          {
            id: 1,
            question_type: 'single_choice',
            content: '以下哪个选项是正确的？',
            options: [
              { id: 'A', content: '选项A' },
              { id: 'B', content: '选项B' },
              { id: 'C', content: '选项C' },
              { id: 'D', content: '选项D' },
            ],
            score: 2,
            order: 1,
          },
          {
            id: 2,
            question_type: 'multi_choice',
            content: '以下哪些选项是正确的？（多选）',
            options: [
              { id: 'A', content: '选项A' },
              { id: 'B', content: '选项B' },
              { id: 'C', content: '选项C' },
              { id: 'D', content: '选项D' },
            ],
            score: 3,
            order: 2,
          },
          {
            id: 3,
            question_type: 'true_false',
            content: '地球是平的。',
            options: [
              { id: 'A', content: '正确' },
              { id: 'B', content: '错误' },
            ],
            score: 1,
            order: 3,
          },
        ],
        total_questions: 3,
        total_score: 6,
      }
    }));
    return;
  }

  // 考试引擎 - 保存答案
  if (path.startsWith('/api/v1/exam-engine/exams/') && path.endsWith('/answers') && req.method === 'POST') {
    res.writeHead(200, corsHeaders);
    res.end(JSON.stringify({
      code: 200,
      message: '答案保存成功',
      data: { saved: true }
    }));
    return;
  }

  // 考试引擎 - 获取进度
  if (path.startsWith('/api/v1/exam-engine/exams/') && path.endsWith('/progress') && req.method === 'GET') {
    res.writeHead(200, corsHeaders);
    res.end(JSON.stringify({
      code: 200,
      data: {
        answered_questions: [],
        current_question: 1,
        remaining_time: 7200,
      }
    }));
    return;
  }

  // 考试引擎 - 提交试卷
  if (path.startsWith('/api/v1/exam-engine/exams/') && path.endsWith('/submit') && req.method === 'POST') {
    res.writeHead(200, corsHeaders);
    res.end(JSON.stringify({
      code: 200,
      message: '试卷提交成功',
      data: {
        submission_id: 'sub_' + Date.now(),
        status: 'submitted',
        message: '提交成功，请等待成绩发布',
      }
    }));
    return;
  }

  // 考试列表（学生端首页）
  if (path === '/api/v1/exams' && req.method === 'GET') {
    res.writeHead(200, corsHeaders);
    res.end(JSON.stringify({
      code: 200,
      data: {
        items: [
          { 
            id: 1, 
            name: '2024春季小学组模拟考试', 
            grade_group: 'primary', 
            status: 'open',
            start_time: '2026-03-25T09:00:00',
            end_time: '2026-03-25T11:00:00',
            duration: 120,
            description: '小学组模拟考试，包含语文、数学、英语三科'
          },
          { 
            id: 2, 
            name: '2024春季初中组模拟考试', 
            grade_group: 'junior', 
            status: 'pending',
            start_time: '2026-03-26T09:00:00',
            end_time: '2026-03-26T11:30:00',
            duration: 150,
            description: '初中组模拟考试，包含语文、数学、英语、物理四科'
          },
        ],
        total: 2
      },
      meta: { total: 2 }
    }));
    return;
  }

  // 最近考试列表 (支持两种路径)
  if ((path === '/api/v1/exams/recent' || path === '/api/v1/dashboard/recent-exams') && req.method === 'GET') {
    res.writeHead(200, corsHeaders);
    res.end(JSON.stringify({
      code: 200,
      data: [
        { id: 1, name: '2024春季小学组模拟考试', grade_group: 'primary', status: 'ongoing', participants: 320 },
        { id: 2, name: '2024春季初中组模拟考试', grade_group: 'junior', status: 'upcoming', participants: 280 },
      ]
    }));
    return;
  }

  // 默认404
  res.writeHead(404, corsHeaders);
  res.end(JSON.stringify({ code: 404, message: '接口不存在' }));
});

const PORT = 8001;
server.listen(PORT, () => {
  console.log(`✅ Mock server running at http://localhost:${PORT}`);
  console.log('📋 Available endpoints:');
  console.log('   - GET  /api/v1/health');
  console.log('   - POST /api/v1/accounts/login');
  console.log('   - GET  /api/v1/accounts/me');
  console.log('   - GET  /api/v1/question-banks');
  console.log('   - GET  /api/v1/papers');
  console.log('');
  console.log('🧪 Test accounts:');
  console.log('   admin / admin123');
  console.log('   teacher_primary / teacher123');
  console.log('   450102201501011234 / 123456');
  console.log('');
  console.log('Press Ctrl+C to stop');
});
