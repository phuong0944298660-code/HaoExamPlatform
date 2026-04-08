# 多 Agent 自动化测试框架

基于 USER_GUIDE_AND_TEST_FLOW.md 需求文档构建的自动化测试系统。

## 架构设计

```
e2e/
├── agents/                      # 多 Agent 测试脚本
│   ├── account-activation-agent.ts    # 账号与激活测试 (需求1-12)
│   ├── exam-flow-agent.ts             # 题库与考试测试 (需求13-22)
│   ├── scoring-agent.ts               # 答题与评分测试 (需求23-30)
│   └── score-management-agent.ts      # 成绩管理测试 (需求31-38)
├── specs/                       # 功能专项测试
│   ├── activation-codes.spec.ts       # 激活码管理专项测试
│   ├── class-management.spec.ts       # 班级管理专项测试
│   └── exam-monitoring.spec.ts        # 考试监控专项测试
├── utils/
│   └── test-helper.ts           # 共享测试工具类
├── master-test-coordinator.ts   # 主测试协调器
├── playwright-tests/            # 原有测试文件
│   ├── auth.spec.ts
│   ├── question-bank.spec.ts
│   ├── paper-management.spec.ts
│   ├── exam-flow.spec.ts
│   ├── student-exam.spec.ts
│   └── ui-regression.spec.ts
└── AGENTS_TEST_FRAMEWORK.md     # 本文档
```

## Agent 角色定义

| Agent | 负责需求 | 测试场景 | 优先级 |
|-------|---------|---------|--------|
| **AccountActivationAgent** | 需求 1-12 | 账号生成、激活码配置、权限分配、登录限制 | P0 |
| **ExamFlowAgent** | 需求 13-22 | 题库搭建、场次管理、时间管理、开始/结束控制 | P0 |
| **ScoringAgent** | 需求 23-30 | 题型操作、自动评分、主观题处理、页面异常 | P0 |
| **ScoreManagementAgent** | 需求 31-38 | 成绩导出、查询权限、敏感信息处理、审分配合 | P1 |

## 使用方式

### 1. 运行所有 Agent 测试

```bash
cd e2e
npm run test:agents
```

### 2. 运行单个 Agent

```bash
# 账号与激活测试
npm run test:agent:account

# 题库与考试测试
npm run test:agent:exam

# 答题与评分测试
npm run test:agent:scoring

# 成绩管理测试
npm run test:agent:score
```

### 3. 运行专项测试

```bash
# 激活码管理
npx playwright test specs/activation-codes.spec.ts

# 班级管理
npx playwright test specs/class-management.spec.ts

# 考试监控
npx playwright test specs/exam-monitoring.spec.ts
```

### 4. 运行原有回归测试

```bash
# 所有回归测试
npm run test

# 单文件测试
npx playwright test playwright-tests/paper-management.spec.ts
```

## 测试数据准备

每个 Agent 测试前会自动准备所需数据：

- **AccountActivationAgent**: 创建测试年级组、科目、教师账号、学生账号
- **ExamFlowAgent**: 创建题库、试题、套卷、考试场次
- **ScoringAgent**: 发布考试、模拟答题数据
- **ScoreManagementAgent**: 生成成绩数据、评分表图片

## 测试报告

测试完成后自动生成报告：

```
e2e/test-report/
├── test-report.md       # Markdown 格式报告
└── test-results.json    # JSON 格式详细数据
```

报告包含：
- 测试汇总统计
- 各场景详细结果
- 问题清单（含截图和错误信息）
- 需求覆盖检查

## 测试用例设计

### P0 级别（核心流程）

- TC001: 创建年级组账号
- TC003: 配置激活码规则
- TC005: 年级组内唯一性检查
- TC008: 题目资源挂接权限
- TC013: 题库创建与科目管理
- TC017: 开始时间控制
- TC019: 结束时间自动交卷
- TC024: 客观题自动评分
- TC027: 题目乱序一致性
- TC034: 学生查询本人成绩

### P1 级别（边界和异常）

- TC002: 异常账号前缀检查
- TC004: 学生激活码不能激活教师
- TC006: 跨年级组登录拦截
- TC007: 学生登录限制
- TC020: 学生补时申请
- TC028: 答题时异常关闭处理
- TC029: 页面自动保存
- TC036: 查询时间窗口控制

## 注意事项

1. **测试顺序**: Agent 之间有依赖关系，应按顺序执行
2. **并发限制**: 使用 `--workers=1` 确保测试顺序执行
3. **环境要求**: 需要后端服务和数据库正常运行
4. **浏览器**: 默认使用 Chromium，可在 playwright.config.ts 中配置

## 扩展指南

添加新的 Agent 测试：

1. 在 `e2e/agents/` 目录创建新的 `*-agent.ts` 文件
2. 按照 `TestHelper` 工具类模式编写测试
3. 在 `master-test-coordinator.ts` 的 `TEST_SCENARIOS` 中添加配置
4. 在 `package.json` 中添加运行命令

添加新的专项测试：

1. 在 `e2e/specs/` 目录创建新的 `*.spec.ts` 文件
2. 使用 Playwright 标准测试格式
3. 导入 `TestHelper` 复用登录和数据准备逻辑

## 与现有测试的关系

- **原有测试** (`playwright-tests/`): 功能级别的回归测试，保持原有功能稳定
- **Agent 测试** (`agents/`): 业务流程级别的端到端测试，验证完整业务场景
- **专项测试** (`specs/`): 特定功能的深度测试，如激活码、班级管理等

三套测试互为补充，共同保障系统质量。
