# 接力教育智慧云平台 - 快速启动与测试指南

## 第一步: 启动后端服务

### 选项A: 使用Mock服务
```bash
cd e2e
node mock-server.js
```
服务将启动在 http://localhost:8001

### 选项B: 使用真实后端
```bash
cd app
python -m uvicorn main:app --reload
```
服务将启动在 http://localhost:8000

## 第二步: 启动前端服务
```bash
cd frontend
npm run dev
```
前端将启动在 http://localhost:5173

## 第三步: 运行测试
```bash
cd e2e

# 运行所有测试
npx playwright test --reporter=list

# 运行特定场景测试
npx playwright test playwright-tests/auth.spec.ts
npx playwright test playwright-tests/question-bank.spec.ts

# 生成并查看报告
npx playwright test --reporter=html
npx playwright show-report
```

## 测试账号清单

### 管理员
- 账号: admin
- 密码: admin123

### 教师
| 账号 | 密码 | 学段 |
|------|------|------|
| teacher_primary | teacher123 | 小学组 |
| teacher_junior | teacher123 | 初中组 |

### 学生
| 身份证号 | 密码 | 学段 |
|----------|------|------|
| 450102201501011234 | 123456 | 小学组 |
| 450102201501021234 | 123456 | 小学组 |
| 450102201001011234 | 123456 | 初中组 |
| 450102201001021234 | 123456 | 初中组 |

## 业务流程测试

### 1. 学生参加考试
1. 打开 http://localhost:5173/login
2. 使用学生账号登录
3. 在"我的考试"中选择考试
4. 完成答题并交卷

### 2. 教师管理考试
1. 使用教师账号登录
2. 创建题库和题目
3. 创建套卷
4. 发布考试
5. 查看成绩和统计

### 3. 管理员管理账号
1. 使用管理员账号登录
2. 批量生成账号
3. 生成激活码
4. 查看系统统计

## 常见问题

### Q: 测试失败怎么办?
A: 检查:
1. 后端服务是否运行
2. 前端服务是否运行
3. 测试账号是否存在
4. 浏览器是否已安装: `npx playwright install`

### Q: 如何更新基准截图?
A: 运行: `npx playwright test --update-snapshots`

### Q: 如何查看测试视频?
A: 视频保存在 `e2e/test-results/` 目录
