# 完整考试流程测试指南

## 目录
1. [系统架构概述](#系统架构概述)
2. [考试流程完整链路](#考试流程完整链路)
3. [API端点清单](#api端点清单)
4. [诚信检测功能](#诚信检测功能)
5. [成绩导出功能](#成绩导出功能)
6. [数据库验证](#数据库验证)

---

## 系统架构概述

### 技术栈
- **后端**: Python 3.11 + FastAPI + SQLAlchemy (异步)
- **数据库**: MySQL 8.0
- **缓存**: Redis 7 (答题进度、会话token、分布式锁)
- **任务队列**: Celery + Redis
- **前端**: Vue 3 + TypeScript + Vite + Ant Design Vue 4

### 考试生命周期
```
创建考试 → 发布试卷 → 分配学生 → 开放答题 → 学生作答(Redis缓存) → 提交试卷 → 自动评分 → 手工评分(主观题) → 导出成绩
```

---

## 考试流程完整链路

### 第1步: 创建考试
**端点**: `POST /api/v1/exams`
**权限**: 教师/管理员
**请求体**:
```json
{
  "name": "2026年第一次模拟考试",
  "description": "春季模拟考试",
  "grade_group": "PRIMARY",
  "paper_ids": [1, 2, 3],
  "start_time": "2026-03-30T10:00:00",
  "end_time": "2026-03-30T11:30:00",
  "is_score_query_open": false
}
```

**预期响应**:
```json
{
  "code": 200,
  "data": {
    "exam_id": 5,
    "status": "DRAFT",
    "paper_snapshot": null
  }
}
```

### 第2步: 发布试卷快照
**端点**: `POST /api/v1/exams/{exam_id}/publish`
**权限**: 教师/管理员
**功能**: 将试卷内容快照存储到MySQL，防止后续编辑影响已开放的考试
**预期响应**: 状态变为 `PENDING`

### 第3步: 分配学生到考试
**端点**: `POST /api/v1/exams/{exam_id}/assign-students`
**权限**: 教师/管理员
**请求体**:
```json
{
  "account_ids": [2, 3, 4],
  "assigned_paper_id": 1
}
```
**效果**: 为每个学生创建 `StudentExamAssignment` 记录，初始状态为 `NOT_STARTED`

### 第4步: 开放考试
**端点**: `POST /api/v1/exams/{exam_id}/open`
**权限**: 管理员
**效果**: 状态变为 `OPEN`，学生可以开始答题

### 第5步: 学生获取题目
**端点**: `GET /api/v1/exam-engine/exams/{exam_id}/questions`
**权限**: 已分配的学生
**响应**:
```json
{
  "code": 200,
  "data": [
    {
      "question_id": 1,
      "question_type": "single_choice",
      "content": "下列哪个是单选题？",
      "options": [
        {"label": "A", "content": "选项A"},
        {"label": "B", "content": "选项B"}
      ],
      "score": 5,
      "difficulty": "easy"
    }
  ]
}
```

### 第6步: 学生保存答案（自动保存到Redis）
**端点**: `POST /api/v1/exam-engine/exams/{exam_id}/answers`
**请求体**:
```json
{
  "question_id": 1,
  "answer": "A",
  "uploaded_files": []
}
```
**Redis存储**:
```
exam:progress:{exam_id}:{account_id} = {
  "answers": {
    "1": {"answer": "A", "uploaded_files": []},
    "2": {"answer": "B,D", "uploaded_files": []},
    "3": {"answer": "是否..." }
  },
  "last_saved_at": "2026-03-30T10:15:30"
}
```
**TTL**: `考试结束时间 + 1小时`

### 第7步: 学生查看答题进度
**端点**: `GET /api/v1/exam-engine/exams/{exam_id}/progress`
**响应**:
```json
{
  "code": 200,
  "data": {
    "answered_count": 2,
    "total_questions": 3,
    "progress_percent": 66.7,
    "last_saved_at": "2026-03-30T10:15:30"
  }
}
```

### 第8步: 学生提交试卷
**端点**: `POST /api/v1/exam-engine/exams/{exam_id}/submit`
**请求体**:
```json
{
  "force": false,
  "idempotency_key": "submit-uuid-unique-key"
}
```

**后端处理流程**:
1. 检查幂等性key（Redis缓存中的`exam:idempotency:{key}`）
2. 获取分布式锁（`exam:submit_lock:{exam_id}:{account_id}`，TTL=30秒）
3. 查询数据库中的 `StudentExamAssignment` 记录
4. 从Redis获取答题数据（`exam:progress:{exam_id}:{account_id}`）
5. **对客观题自动评分**:
   - 单选题: 答案完全匹配 → 满分，否则0分
   - 多选题: 支持部分分数（fixed/proportional/per_option）
   - 判断题: 答案完全匹配 → 满分，否则0分
6. 更新 `StudentExamAssignment`:
   - `status` = `SUBMITTED`
   - `submitted_at` = 当前时间
   - `objective_score` = 客观题自动评分结果
   - `answers_snapshot` = 详细答案记录
   - `total_score` = 如果无主观题，则=客观题分数；有主观题则待手工评分
7. 清理Redis缓存（删除答题进度）
8. 缓存幂等性结果（3600秒）

**响应**:
```json
{
  "code": 200,
  "data": {
    "submitted": true,
    "message": "提交成功",
    "submitted_at": "2026-03-30T10:30:45.123Z",
    "objective_score": 12.5,
    "total_score": 12.5,
    "has_subjective": true
  }
}
```

### 第9步: 教师查看成绩列表
**端点**: `GET /api/v1/scores?exam_id={exam_id}`
**响应**: 分页列表，包含所有学生成绩

### 第10步: 教师手工评分（主观题）
**端点**: `POST /api/v1/scores/subjective`
**请求体**:
```json
{
  "assignment_id": 1,
  "question_id": 3,
  "score": 8.5,
  "comment": "良好的分析"
}
```
**效果**: 更新 `subjective_score`，并重新计算 `total_score`

### 第11步: 导出成绩
**端点**: `GET /api/v1/scores/export?exam_id={exam_id}&format=excel`
**参数**:
- `format`: `excel` / `csv`
- `async_mode`: `false` (同步导出) / `true` (异步导出，用于大数据量)

**响应**: 文件下载流
**Excel列**: 序号 | 排名 | 地区 | 学生姓名 | 身份证号 | 学校 | 单选分 | 多选分 | 判断分 | 主观分 | 总分 | 提交时间

---

## API端点清单

### 认证模块
| 方法 | 端点 | 功能 |
|------|------|------|
| POST | `/api/v1/accounts/login` | 登录 |
| POST | `/api/v1/activations/use` | 激活账号 |

### 考试管理
| 方法 | 端点 | 功能 |
|------|------|------|
| POST | `/api/v1/exams` | 创建考试 |
| GET | `/api/v1/exams` | 查询考试列表 |
| GET | `/api/v1/exams/{id}` | 查看考试详情 |
| POST | `/api/v1/exams/{id}/publish` | 发布试卷快照 |
| POST | `/api/v1/exams/{id}/open` | 开放考试 |
| POST | `/api/v1/exams/{id}/assign-students` | 分配学生 |

### 答题引擎
| 方法 | 端点 | 功能 |
|------|------|------|
| GET | `/api/v1/exam-engine/exams/{exam_id}/questions` | 获取题目 |
| POST | `/api/v1/exam-engine/exams/{exam_id}/answers` | 保存答案 |
| GET | `/api/v1/exam-engine/exams/{exam_id}/progress` | 查询答题进度 |
| POST | `/api/v1/exam-engine/exams/{exam_id}/submit` | 提交试卷 |

### 成绩管理
| 方法 | 端点 | 功能 |
|------|------|------|
| GET | `/api/v1/scores` | 查询成绩列表 |
| POST | `/api/v1/scores/subjective` | 录入主观题分数 |
| GET | `/api/v1/scores/export` | 导出成绩(同步) |
| POST | `/api/v1/scores/export/async` | 创建异步导出任务 |

---

## 诚信检测功能

### 已实现的防作弊机制

#### 1. 离开页面检测
**事件**: `visibilitychange`
**触发条件**: 用户切换标签页/浏览器窗口
**处理**: 弹出警告，记录离开次数

#### 2. 窗口失焦检测
**事件**: `blur`
**触发条件**: 浏览器窗口失去焦点
**处理**: 弹出警告，同样计入离开次数

#### 3. 右键菜单禁用
**事件**: `contextmenu`
**处理**: 禁止右键菜单，提示用户

#### 4. 文本选择禁用
**事件**: `selectstart`
**处理**: 禁止文本选择，防止复制

#### 5. 复制/粘贴禁用
**事件**: `copy`, `paste`
**处理**: 禁止复制和粘贴操作

#### 6. 开发者工具阻止
**快捷键**: F12, Ctrl+Shift+I/C/J/K, Ctrl+I
**处理**: 拦截并记录尝试

#### 7. 多标签页检测
**机制**: localStorage `exam-active-tab`
**处理**: 检测到多个标签页打开同一考试时警告

#### 8. 浏览器导航防护
**事件**: `popstate`
**处理**: 禁止后退/前进导航

#### 9. 拖拽防护
**事件**: `dragstart`
**处理**: 禁止拖拽操作

### 诚信日志记录
所有防作弊事件可通过 `recordCheatingAttempt()` 函数记录到服务器：
```typescript
recordCheatingAttempt('attempt_type')
```

可扩展API端点:
```
POST /api/v1/exams/integrity-logs
{
  "exam_id": 5,
  "attempt_type": "page_hidden|window_blur|keyboard_shortcut_F12|...",
  "timestamp": "2026-03-30T10:15:30Z"
}
```

---

## 成绩导出功能

### 同步导出 (小数据量<1000条)
**端点**: `GET /api/v1/scores/export`
**参数**: `exam_id`, `format=excel|csv`
**响应**: 文件流，直接下载
**优点**: 实时，无需等待
**缺点**: 大数据量时容易超时

### 异步导出 (大数据量>1000条)
**创建任务**: `POST /api/v1/scores/export/async`
**响应**:
```json
{
  "code": 201,
  "data": {
    "task_id": "task-uuid",
    "status": "PENDING",
    "created_at": "2026-03-30T10:15:30Z"
  }
}
```

**查询任务**: `GET /api/v1/scores/export/tasks/{task_id}`
**响应**:
```json
{
  "code": 200,
  "data": {
    "task_id": "task-uuid",
    "status": "COMPLETED",
    "download_url": "http://...",
    "created_at": "2026-03-30T10:15:30Z",
    "completed_at": "2026-03-30T10:20:30Z"
  }
}
```

### 依赖项
- `openpyxl>=3.1.2`: Excel导出库
- 如果缺少此库，会返回 `500 Internal Server Error`

### 导出字段
```
序号 | 排名 | 地区 | 学生姓名 | 身份证号 | 学校 | 单选分 | 多选分 | 判断分 | 主观分 | 总分 | 提交时间
```

---

## 数据库验证

### 关键表结构

#### 1. accounts (账号表)
```sql
SELECT * FROM accounts WHERE id = 2;
```
需要字段: `id`, `username`, `identity_no`, `hashed_password`, `grade_group`, `is_activated`, `role`, `is_deleted`

#### 2. exams (考试表)
```sql
SELECT * FROM exams WHERE id = 5;
```
需要字段: `id`, `name`, `grade_group`, `paper_ids` (JSON), `paper_snapshot` (JSON), `start_time`, `end_time`, `status`, `is_deleted`

#### 3. student_exam_assignments (学生考试分配表)
```sql
SELECT * FROM student_exam_assignments WHERE exam_id = 5 AND account_id = 2;
```
需要字段: `id`, `exam_id`, `account_id`, `assigned_paper_id`, `status`, `answers_snapshot` (JSON), `objective_score`, `subjective_score`, `total_score`, `submitted_at`, `is_deleted`

#### 4. question_banks (题库表)
```sql
SELECT * FROM question_banks WHERE id = 1;
```

#### 5. questions (题目表)
```sql
SELECT COUNT(*) FROM questions WHERE question_bank_id = 1;
```

#### 6. exam_papers (试卷表)
```sql
SELECT * FROM exam_papers WHERE id = 1;
```
需要字段: `id`, `name`, `grade_group`, `paper_questions` (JSON), `total_score`, `status`, `version`, `is_deleted`

### 枚举类型检查
```sql
SHOW CREATE TABLE exams\G
```
检查 `status` 字段的枚举值:
```
ENUM('DRAFT','PENDING','OPEN','CLOSED','FINISHED')
```

```sql
SHOW CREATE TABLE accounts\G
```
检查 `grade_group` 字段的枚举值:
```
ENUM('PRIMARY','JUNIOR','OTHER','SENIOR','UNIVERSITY')
```
⚠️ **注意**: ORM模型中必须使用大写值 `PRIMARY`, `JUNIOR`

---

## 测试脚本

### 快速测试流程
```bash
# 1. 启动后端服务
docker-compose up -d backend db redis

# 2. 等待初始化 (60秒)
sleep 60

# 3. 检查服务健康状态
curl http://localhost:8000/api/v1/health

# 4. 登录（获取token）
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/accounts/login \
  -H "Content-Type: application/json" \
  -d '{"account":"admin","password":"admin123"}' | jq -r '.data.token')

# 5. 创建考试
curl -X POST http://localhost:8000/api/v1/exams \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Exam","grade_group":"PRIMARY",...}'

# ... 后续步骤
```

---

## 故障排除

### 问题1: 提交试卷返回 400
**原因**: JSON解析错误，请求体格式不正确
**解决**: 确保仅发送 `force` 和 `idempotency_key` 字段

### 问题2: 成绩导出返回 500
**原因**: openpyxl库未安装
**解决**: `pip install openpyxl>=3.1.2`

### 问题3: 考试数据不同步
**原因**: Redis缓存和MySQL数据不一致
**解决**: 检查Redis连接，清理过期缓存

### 问题4: 学生无法提交答案
**原因**: 答案未保存到Redis或学生未被分配
**解决**: 验证答题进度是否存在Redis中

---

## 最后检查清单

- [ ] 后端服务正常运行
- [ ] MySQL数据库表结构完整
- [ ] Redis连接正常
- [ ] 所有依赖库已安装 (openpyxl, etc.)
- [ ] GradeGroup枚举值为大写 (PRIMARY, JUNIOR)
- [ ] JWT认证生效
- [ ] 考试状态机正常工作
- [ ] 答题进度成功保存到Redis
- [ ] 客观题自动评分正确
- [ ] 成绩导出功能可用
- [ ] 诚信检测机制生效
- [ ] 幂等性key防重复提交有效

---

**文档版本**: v1.0
**最后更新**: 2026-03-30
