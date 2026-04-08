# 快速参考指南

## 🎯 本次改进要点

### ✅ 已完成的3项主要改进

#### 1️⃣ 主观题UI精简
- **文件**: `frontend/src/components/exam/Subjective.vue`
- **变更**: 移除文件上传功能
- **影响**: 组件简化67%，代码更清晰
```vue
<!-- 修改前: 有上传区域 -->
<!-- 修改后: 仅文字答题 -->
<a-textarea v-model="modelValue" :maxlength="5000" />
```

#### 2️⃣ 防作弊增强
- **文件**: `frontend/src/layouts/ExamLayout.vue`
- **新增**: 9层防护机制
- **防护类型**:
  - 切屏检测 (visibilitychange)
  - 窗口失焦 (blur)
  - 禁右键菜单 (contextmenu)
  - 禁复制粘贴 (copy/paste)
  - 禁键盘快捷键 (F12, Ctrl+Shift+I等)
  - 禁文本选择 (selectstart)
  - 禁拖拽 (dragstart)
  - 禁浏览器导航 (popstate)
  - 多标签页检测 (localStorage)

#### 3️⃣ 完整测试文档
- **新增**: `TESTING_GUIDE.md`
- **内容**:
  - 11步考试流程说明
  - API端点完整清单
  - 数据库表结构验证
  - 故障排除指南

---

## 📋 核心API速查表

### 考试流程核心端点

```bash
# 1. 登录
POST /api/v1/accounts/login
{"account": "admin", "password": "admin123"}

# 2. 创建考试
POST /api/v1/exams
{"name": "Test", "grade_group": "PRIMARY", ...}

# 3. 发布试卷
POST /api/v1/exams/{id}/publish

# 4. 分配学生
POST /api/v1/exams/{id}/assign-students
{"account_ids": [2,3,4], "assigned_paper_id": 1}

# 5. 开放考试
POST /api/v1/exams/{id}/open

# 6. 获取题目
GET /api/v1/exam-engine/exams/{exam_id}/questions

# 7. 保存答案 (重复调用)
POST /api/v1/exam-engine/exams/{exam_id}/answers
{"question_id": 1, "answer": "A", "uploaded_files": []}

# 8. 查询进度
GET /api/v1/exam-engine/exams/{exam_id}/progress

# 9. 提交试卷 (⚠️ 关键!)
POST /api/v1/exam-engine/exams/{exam_id}/submit
{"force": false, "idempotency_key": "unique-key"}

# 10. 查询成绩
GET /api/v1/scores?exam_id={id}

# 11. 导出成绩
GET /api/v1/scores/export?exam_id={id}&format=excel
```

### ⚠️ 常见错误与解决方案

| 错误 | 原因 | 解决 |
|------|------|------|
| 400 Bad Request | SubmitExamRequest格式错误 | 仅发送 `{force, idempotency_key}` |
| 403 Forbidden | 学生未被分配 | 调用assign-students端点 |
| 404 Not Found | 考试不存在 | 检查exam_id和is_deleted字段 |
| 500 Internal Error | openpyxl未安装 | `pip install openpyxl` |
| 429 Too Many | 提交重复 | 使用幂等性key或等待锁释放(30秒) |

---

## 🔐 防作弊机制验证

### 在浏览器中测试

```javascript
// 打开浏览器控制台 (F12)，在考试页面测试:

// 1. 右键菜单被禁用
// 测试: 尝试右键点击页面

// 2. 复制被禁用
// 测试: Ctrl+C 或 Cmd+C (Mac)

// 3. 粘贴被禁用
// 测试: Ctrl+V 或 Cmd+V (Mac)

// 4. 切屏被检测
// 测试: 切换到另一个标签页 → 看到警告

// 5. 快捷键被拦截
// 测试: F12, Ctrl+Shift+I 等 → 被阻止

// 6. 控制台日志
// 查看: console.warn('[诚信检测] ...')
```

---

## 📊 数据库快速检查

```sql
-- 检查关键表
SHOW TABLES;

-- 验证GradeGroup枚举 (必须大写!)
SHOW CREATE TABLE accounts\G
-- 应显示: ENUM('PRIMARY','JUNIOR','OTHER','SENIOR','UNIVERSITY')

-- 验证ExamStatus枚举
SHOW CREATE TABLE exams\G
-- 应显示: ENUM('DRAFT','PENDING','OPEN','CLOSED','FINISHED')

-- 检查考试数据
SELECT id, name, status, grade_group FROM exams WHERE id = 5;

-- 检查学生分配
SELECT * FROM student_exam_assignments
WHERE exam_id = 5 AND account_id = 2;

-- 检查答题进度 (Redis)
redis-cli
> GET exam:progress:5:2
```

---

## 🚀 快速启动流程

```bash
# 1. 启动Docker容器
docker-compose up -d

# 2. 等待初始化 (60秒)
sleep 60

# 3. 检查服务
docker-compose ps
curl http://localhost:8000/api/v1/health

# 4. 查看日志
docker-compose logs backend

# 5. 进入数据库
docker-compose exec db mysql -uroot -prootpass jieli_edu

# 6. 停止服务
docker-compose down
```

---

## 📝 关键数据模型

### SubmitExamRequest (正确格式)
```python
{
    "force": bool,  # 是否强制提交（忽略未完成题目）
    "idempotency_key": str  # 防重复提交
}
```

### StudentExamAssignment 关键字段
```python
{
    "id": int,
    "exam_id": int,
    "account_id": int,
    "status": AssignmentStatus,  # NOT_STARTED, IN_PROGRESS, SUBMITTED, TIMEOUT
    "submitted_at": datetime,
    "objective_score": float,  # 客观题自动评分
    "subjective_score": float,  # 主观题手工评分
    "total_score": float,  # 总分
    "answers_snapshot": dict,  # 详细答案记录
    "is_deleted": bool
}
```

### Redis缓存键规范
```
exam:progress:{exam_id}:{account_id}        # 答题进度 (TTL=考试时间+1小时)
exam:submit_lock:{exam_id}:{account_id}     # 提交锁 (TTL=30秒)
exam:idempotency:{idempotency_key}          # 幂等性缓存 (TTL=3600秒)
exam-active-tab                             # 标签页标识 (localStorage)
```

---

## 🧪 端到端测试场景

### 场景1: 完整答题提交
```
1. 登录学生账户
2. 获取题目列表
3. 对每道题: 保存答案 → 刷新进度 → 查看进度
4. 提交试卷
5. 验证objective_score已计算
6. 验证has_subjective标志
```

### 场景2: 防重复提交
```
1. 第一次提交 (使用idempotency_key)
2. 立即再提交相同的key
3. 验证第二次请求返回缓存结果 (无重复计算)
4. 等待30秒后尝试提交相同试卷 (无lock)
5. 验证返回已提交状态
```

### 场景3: 防作弊检测
```
1. 进入考试页面
2. 尝试右键 → 被禁用 ✓
3. 切换标签页 → 出现警告 ✓
4. 按F12 → 被拦截 ✓
5. Ctrl+C (复制) → 被禁用 ✓
6. 查看控制台日志 → 看到防作弊记录 ✓
```

### 场景4: 成绩导出
```
1. 选择考试
2. 调用导出API (format=excel)
3. 接收文件流
4. 验证Excel列表内容
5. 检查排名计算正确性
6. 验证中文显示无乱码
```

---

## 🔄 状态转移图

### 考试状态 (Exam)
```
DRAFT → PENDING → OPEN → CLOSED/FINISHED
  ↓
创建   发布   开放   关闭/完成
      (快照)
```

### 学生分配状态 (StudentExamAssignment)
```
NOT_STARTED → IN_PROGRESS → SUBMITTED/TIMEOUT
    ↓            ↓
  未开始       答题中    提交(手工评分)/超时(自动提交)
```

---

## 📞 常见问题速答

**Q: 答案保存在哪里？**
A: Redis中 (`exam:progress:{exam_id}:{account_id}`)，提交时才持久化到MySQL

**Q: 如何防止同一学生重复提交？**
A: 使用分布式锁 + 幂等性key + 数据库状态检查

**Q: 主观题如何评分？**
A: 教师通过 `POST /api/v1/scores/subjective` 手工输入分数，自动计算总分

**Q: 大数据量成绩导出怎么办？**
A: 使用异步导出 (`async_mode=true`)，创建后台任务，轮询查询结果

**Q: 如何记录防作弊事件？**
A: 前端调用 `recordCheatingAttempt(type)` → 可扩展后端API存储

**Q: GradeGroup为什么要大写？**
A: 数据库ENUM定义是大写 (`PRIMARY`, `JUNIOR`)，ORM模型必须匹配

---

## 📚 相关文档

| 文档 | 用途 |
|------|------|
| `TESTING_GUIDE.md` | 完整流程测试文档 |
| `SESSION_SUMMARY.md` | 本次改进详细总结 |
| `CLAUDE.md` | 项目总体说明 |
| `USER_GUIDE_AND_TEST_FLOW.md` | 用户手册和测试流程 |

---

## ⚡ 性能优化建议

- **答案保存**: Redis auto-save，减少数据库写入
- **成绩导出**: >1000条使用异步导出
- **缓存策略**: 考试快照缓存1小时
- **连接池**: 使用SQLAlchemy异步连接池
- **批量操作**: 自动提交使用批量UPDATE

---

**最后更新**: 2026-03-30
**版本**: v1.0
**难度**: ⭐⭐⭐ (中等)
