# 接力教育智慧云平台 - 用户指南与测试流程

## 📋 目录
1. [系统架构](#系统架构)
2. [用户角色和权限](#用户角色和权限)
3. [完整测试流程](#完整测试流程)
4. [API端点速查](#api端点速查)
5. [故障排除](#故障排除)

---

## 🏗️ 系统架构

### 技术栈 (Java/Spring Boot版本)
```
┌─────────────────────────────────────────────────┐
│           前端 (Vue 3 + TypeScript)               │
│  http://localhost:5173 (开发) / :80 (生产)      │
└────────────────────┬────────────────────────────┘
                     │ REST API / WebSocket
┌────────────────────┴────────────────────────────┐
│         Nginx反向代理                            │
│         http://localhost:80                      │
└────────────────────┬────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────┐
│    后端 (Java Spring Boot)                      │
│    http://localhost:8080                         │
│  - 认证 (JWT)                                    │
│  - 题库管理                                      │
│  - 试卷组装                                      │
│  - 考试引擎 (答题 + 自动评分)                    │
│  - 异步任务 (@Async, @Scheduled)                │
│  - 成绩导出 (Excel/CSV/PDF)                     │
└────────────────────┬────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
    ┌────────┐  ┌────────┐  ┌────────┐
    │ MySQL  │  │ Redis  │  │ 文件   │
    │ 8.0    │  │ 7      │  │存储    │
    │ 3307   │  │ 6379   │  │uploads │
    └────────┘  └────────┘  └────────┘
```

### 容器配置
```
docker-compose up -d
├── backend (Java Spring Boot, port 8080)
├── db (MySQL 8.0, port 3307)
├── redis (Redis 7, port 6379)
├── nginx (反向代理, port 80)
└── frontend (Node.js开发服务器, port 5173)
```

---

## 👥 用户角色和权限

### 1. 学生 (STUDENT)
**权限**:
- ✅ 登录自己的账户
- ✅ 查看分配给自己的考试
- ✅ 在线答题 (所有题型)
- ✅ 查询自己的成绩 (如果开放)
- ✅ 上传主观题附件

**主要操作**:
```
1. 登录 → 输入身份证号 + 密码
2. 查看"我的考试" → 选择考试进入
3. 获取题目 → 逐题答题 (答案自动保存到Redis)
4. 提交试卷 → 客观题自动评分，主观题等待教师评分
5. 查询成绩 → 查看排名、各题型分数
```

### 2. 教师 (TEACHER)
**权限**:
- ✅ 登录自己的账户
- ✅ 创建/管理题库
- ✅ 组装试卷
- ✅ 创建和发布考试
- ✅ 分配学生到考试
- ✅ 实时监考面板
- ✅ 手工评分主观题
- ✅ 查看和导出成绩
- ✅ 管理资源

**主要操作**:
```
1. 创建题库 → 导入或添加题目
2. 组装试卷 → 选择题目、设置分值、拖拽排序
3. 创建考试 → 选择试卷、设置时间、发布
4. 分配学生 → 批量导入或单个添加
5. 开放考试 → 学生可开始答题
6. 实时监考 → 查看答题进度、诚信日志
7. 评分 → 手工评分主观题
8. 导出成绩 → Excel/CSV格式
```

### 3. 管理员 (ADMIN)
**权限**:
- ✅ 所有教师权限
- ✅ 管理用户账户
- ✅ 生成激活码
- ✅ 系统配置
- ✅ 审计日志

---

## 🧪 完整测试流程

### 前提条件
```bash
# 启动所有服务
docker-compose up -d

# 等待初始化 (60秒)
sleep 60

# 验证服务健康
curl http://localhost:8080/api/v1/health
# 响应: {"status": "UP"}
```

---

### 场景1️⃣: 完整的考试答题流程

#### 步骤1: 管理员登录并创建考试

```bash
# 1.1 登录
curl -X POST http://localhost:8080/api/v1/accounts/login \
  -H "Content-Type: application/json" \
  -d '{
    "account": "admin",
    "password": "admin123"
  }'

# 响应:
{
  "code": 200,
  "data": {
    "token": "eyJhbGc...",
    "user": {
      "id": 1,
      "username": "admin",
      "role": "ADMIN"
    }
  }
}

# 保存token供后续使用
TOKEN="eyJhbGc..."
```

#### 步骤2: 创建考试

```bash
# 2.1 先创建题库和题目 (省略，假设已有)
# question_bank_id = 1, 包含3道题

# 2.2 创建试卷
curl -X POST http://localhost:8080/api/v1/papers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "2026年春季模拟考试",
    "grade_group": "PRIMARY",
    "questions": [
      {
        "question_id": 1,
        "order": 1,
        "score": 5
      },
      {
        "question_id": 2,
        "order": 2,
        "score": 5
      },
      {
        "question_id": 3,
        "order": 3,
        "score": 10
      }
    ],
    "total_score": 20
  }'

# 响应: paper_id = 1

# 2.3 创建考试
curl -X POST http://localhost:8080/api/v1/exams \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "2026年春季模拟考试",
    "description": "全校模拟考试",
    "grade_group": "PRIMARY",
    "paper_ids": [1],
    "start_time": "2026-03-30T10:00:00Z",
    "end_time": "2026-03-30T11:30:00Z",
    "is_score_query_open": true
  }'

# 响应: exam_id = 5, status = DRAFT
```

#### 步骤3: 发布试卷快照

```bash
# 3.1 发布试卷
curl -X POST http://localhost:8080/api/v1/exams/5/publish \
  -H "Authorization: Bearer $TOKEN"

# 响应: status变为PENDING
```

#### 步骤4: 分配学生

```bash
# 4.1 创建学生账户 (假设已有学生ID=2)
# 或者直接分配存在的学生账户

curl -X POST http://localhost:8080/api/v1/exams/5/assign-students \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "student_ids": [2],
    "assigned_paper_id": 1
  }'

# 响应: 分配成功，创建StudentExamAssignment记录
```

#### 步骤5: 开放考试

```bash
# 5.1 开放考试
curl -X POST http://localhost:8080/api/v1/exams/5/open \
  -H "Authorization: Bearer $TOKEN"

# 响应: status变为OPEN，学生现在可以答题
```

#### 步骤6: 学生登录并答题

```bash
# 6.1 学生登录
curl -X POST http://localhost:8080/api/v1/accounts/login \
  -H "Content-Type: application/json" \
  -d '{
    "account": "000000000000000002",  # 学生身份证号
    "password": "123456"
  }'

# 响应:
{
  "code": 200,
  "data": {
    "token": "eyJ...",
    "user": {
      "id": 2,
      "username": "000000000000000002",
      "role": "STUDENT"
    }
  }
}

STUDENT_TOKEN="eyJ..."
```

#### 步骤7: 学生获取题目

```bash
# 7.1 获取考试题目
curl http://localhost:8080/api/v1/exam-engine/exams/5/questions \
  -H "Authorization: Bearer $STUDENT_TOKEN"

# 响应:
{
  "code": 200,
  "data": [
    {
      "question_id": 1,
      "type": "single_choice",
      "content": "下列哪个是单选题？",
      "options": [
        {"label": "A", "content": "选项A"},
        {"label": "B", "content": "选项B"}
      ],
      "score": 5
    },
    // ... 更多题目
  ]
}
```

#### 步骤8: 学生保存答案

```bash
# 8.1 保存第1道题的答案
curl -X POST http://localhost:8080/api/v1/exam-engine/exams/5/answers \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "question_id": 1,
    "answer": "A",
    "uploaded_files": []
  }'

# 响应: {"code": 200, "message": "答案已保存"}
# 注意: 答案实际保存到Redis，不直接存入MySQL

# 8.2 保存第2道题的答案 (多选)
curl -X POST http://localhost:8080/api/v1/exam-engine/exams/5/answers \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "question_id": 2,
    "answer": "B,D",
    "uploaded_files": []
  }'

# 8.3 查询答题进度
curl http://localhost:8080/api/v1/exam-engine/exams/5/progress \
  -H "Authorization: Bearer $STUDENT_TOKEN"

# 响应:
{
  "code": 200,
  "data": {
    "answered_count": 2,
    "total_questions": 3,
    "progress_percent": 66.7,
    "last_saved_at": "2026-03-30T10:15:30Z"
  }
}
```

#### 步骤9: 学生提交试卷

```bash
# 9.1 提交试卷 (重要: ⚠️ 正确的请求格式)
curl -X POST http://localhost:8080/api/v1/exam-engine/exams/5/submit \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "force": false,
    "idempotency_key": "submit-unique-key-12345"
  }'

# 响应:
{
  "code": 200,
  "data": {
    "submitted": true,
    "message": "提交成功",
    "submitted_at": "2026-03-30T10:30:45.123Z",
    "objective_score": 10.0,
    "total_score": 10.0,
    "has_subjective": true
  }
}
```

#### 步骤10: 教师手工评分主观题

```bash
# 10.1 教师登录 (使用之前保存的TOKEN)

# 10.2 查询成绩列表
curl http://localhost:8080/api/v1/scores?exam_id=5 \
  -H "Authorization: Bearer $TOKEN"

# 响应:
{
  "code": 200,
  "data": [
    {
      "assignment_id": 1,
      "student_name": "张三",
      "objective_score": 10.0,
      "subjective_score": null,  # 待评分
      "total_score": null,
      "submitted_at": "2026-03-30T10:30:45.123Z"
    }
  ]
}

# 10.3 评分主观题
curl -X POST http://localhost:8080/api/v1/scores/subjective \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "assignment_id": 1,
    "question_id": 3,
    "score": 8.5,
    "comment": "思路清晰，分析深入"
  }'

# 响应: {"code": 200, "message": "评分成功"}
# 总分自动更新为: 10.0 + 8.5 = 18.5
```

#### 步骤11: 导出成绩

```bash
# 11.1 导出为Excel
curl http://localhost:8080/api/v1/scores/export?exam_id=5&format=excel \
  -H "Authorization: Bearer $TOKEN" \
  -o exam_scores.xlsx

# 11.2 导出为CSV
curl http://localhost:8080/api/v1/scores/export?exam_id=5&format=csv \
  -H "Authorization: Bearer $TOKEN" \
  -o exam_scores.csv

# 11.3 异步导出 (大数据量)
curl -X POST http://localhost:8080/api/v1/scores/export/async?exam_id=5 \
  -H "Authorization: Bearer $TOKEN"

# 响应:
{
  "code": 202,
  "data": {
    "task_id": "task-uuid-12345",
    "status": "PENDING"
  }
}

# 轮询查询导出结果
curl http://localhost:8080/api/v1/scores/export/tasks/task-uuid-12345 \
  -H "Authorization: Bearer $TOKEN"
```

---

### 场景2️⃣: 诚信检测测试

#### 在浏览器中测试

```javascript
// 打开浏览器控制台 (F12)，进入考试页面

// 1. 切屏检测
// 操作: 按Alt+Tab切换到其他应用 → 看到警告弹窗

// 2. 右键菜单禁用
// 操作: 右键点击 → 无菜单出现

// 3. 复制禁用
// 操作: Ctrl+C → 看到"禁止复制内容"提示

// 4. 粘贴禁用
// 操作: Ctrl+V → 看到"禁止粘贴内容"提示

// 5. 快捷键拦截
// 操作: 按F12 → 开发者工具不打开
// 操作: Ctrl+Shift+I → 开发者工具不打开

// 6. 控制台日志
// 查看: console中出现 [诚信检测] 日志
```

---

## 📡 API端点速查

### 认证
| 方法 | 端点 | 功能 |
|------|------|------|
| POST | `/api/v1/accounts/login` | 登录 |
| POST | `/api/v1/accounts/logout` | 登出 |
| GET | `/api/v1/accounts/profile` | 获取个人信息 |

### 考试流程
| 方法 | 端点 | 功能 |
|------|------|------|
| POST | `/api/v1/exams` | 创建考试 |
| GET | `/api/v1/exams/{id}` | 查询考试 |
| POST | `/api/v1/exams/{id}/publish` | 发布试卷 |
| POST | `/api/v1/exams/{id}/open` | 开放考试 |
| GET | `/api/v1/exam-engine/exams/{id}/questions` | 获取题目 |
| POST | `/api/v1/exam-engine/exams/{id}/answers` | 保存答案 |
| POST | `/api/v1/exam-engine/exams/{id}/submit` | 提交试卷 |

### 成绩管理
| 方法 | 端点 | 功能 |
|------|------|------|
| GET | `/api/v1/scores` | 查询成绩 |
| POST | `/api/v1/scores/subjective` | 评分主观题 |
| GET | `/api/v1/scores/export` | 导出成绩 |

---

## 🐛 故障排除

### 问题1: 无法登录 "账户不存在"
**原因**: 账户未创建或已删除
**解决**:
```bash
# 检查数据库
mysql -h localhost -P 3307 -u root -p jieli_edu
SELECT * FROM accounts WHERE username = 'admin';

# 如果不存在，创建账户
INSERT INTO accounts (username, hashed_password, role, is_activated)
VALUES ('admin', '$2b$12$...', 'ADMIN', 1);
```

### 问题2: 提交试卷返回400错误
**原因**: 请求格式错误
**错误格式**: `{"examId": 5, "answers": {...}}`
**正确格式**: `{"force": false, "idempotency_key": "key"}`

### 问题3: 后端无法启动
**原因**: MySQL或Redis未就绪
**解决**:
```bash
docker-compose ps  # 检查服务状态
docker-compose logs db  # 查看MySQL日志
docker-compose logs redis  # 查看Redis日志
```

### 问题4: 前端无法连接后端
**原因**: API基础URL配置错误
**解决**:
```bash
# 检查环境变量
echo $VITE_API_BASE_URL

# 应该是: http://localhost:8080/api/v1
```

---

## 📚 相关文档
- `CLAUDE.md` - 开发指南
- `TESTING_GUIDE.md` - 完整测试指南
- `QUICK_REFERENCE.md` - 快速参考

---

**版本**: Java/Spring Boot v1.0
**最后更新**: 2026-03-30
**迁移状态**: ✅ 从Python完全迁移到Java
