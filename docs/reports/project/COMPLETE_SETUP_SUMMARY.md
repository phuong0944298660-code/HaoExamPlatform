# 接力教育智慧云平台 - 完整设置与使用指南

## 已完成的工作

### 1. 测试用例修复
- 修复了CSS期望值不匹配问题
- 修复了按钮选择器问题
- 修复了登录流程的通用选择器
- 创建了Mock后端服务

### 2. 测试数据准备
- 创建了完整的测试账号清单
- 准备了激活码数据
- 创建了测试数据JSON文件

### 3. 文档创建
- PIXEL_TEST_CASES_COMPLETE.md - 完整测试用例
- USER_GUIDE_AND_TEST_FLOW.md - 使用指南
- START_GUIDE.md - 快速启动指南

## 生成的文件清单

### 测试文件
- e2e/playwright-tests/auth.spec.ts
- e2e/playwright-tests/question-bank.spec.ts
- e2e/playwright-tests/paper-management.spec.ts
- e2e/playwright-tests/student-exam.spec.ts
- e2e/playwright-tests/exam-flow.spec.ts
- e2e/playwright-tests/ui-regression.spec.ts

### 数据文件
- e2e/test-data/complete-test-data.json
- scripts/init-test-data.sql

### 文档文件
- PIXEL_TEST_CASES_COMPLETE.md
- USER_GUIDE_AND_TEST_FLOW.md
- START_GUIDE.md
- FIX_COMPLETE_REPORT.md
- PIXEL_TEST_VERIFICATION_REPORT.md

## 如何使用该系统

### 1. 启动服务
```bash
# 终端1: 启动Mock后端
cd e2e && node mock-server.js

# 终端2: 启动前端
cd frontend && npm run dev
```

### 2. 访问系统
打开浏览器访问: http://localhost:5173

### 3. 登录测试
- 管理员: admin / admin123
- 教师: teacher_primary / teacher123
- 学生: 450102201501011234 / 123456

### 4. 运行测试
```bash
cd e2e
npx playwright test --reporter=list
```

## 业务流程说明

### 教师工作流程
1. 登录系统
2. 创建题库
3. 添加题目到题库
4. 创建套卷(从题库选题)
5. 创建考试
6. 发布考试
7. 查看学生成绩

### 学生工作流程
1. 激活账号(使用激活码)
2. 登录系统
3. 查看可参加的考试
4. 进入考试答题
5. 交卷
6. 查看成绩

## 测试用例清单

### 认证测试 (18个)
- 登录页面布局和样式
- 登录表单验证
- 登录成功/失败流程
- 激活页面测试

### 题库管理测试 (10个)
- 题库列表页面
- 创建题目表单
- 题目类型切换

### 其他测试
- 套卷管理测试
- 考试流程测试
- UI回归测试

## 账号密码速查表

| 角色 | 账号 | 密码 | 用途 |
|------|------|------|------|
| 管理员 | admin | admin123 | 系统管理 |
| 小学教师 | teacher_primary | teacher123 | 小学组管理 |
| 初中教师 | teacher_junior | teacher123 | 初中组管理 |
| 小学学生 | 450102201501011234 | 123456 | 小学组考试 |
| 初中学生 | 450102201001011234 | 123456 | 初中组考试 |

## 激活码清单

| 激活码 | 学段 | 角色 |
|--------|------|------|
| PT2024001 | 小学 | 教师 |
| PS2024001 | 小学 | 学生 |
| JT2024001 | 初中 | 教师 |
| JS2024001 | 初中 | 学生 |

## 下一步建议

1. 启动Mock后端服务
2. 启动前端开发服务器
3. 使用提供的账号密码登录测试
4. 运行Playwright测试验证功能
5. 根据测试报告进行进一步修复

---
