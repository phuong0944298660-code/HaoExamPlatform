# 接力教育智慧云平台 - 像素级测试用例文档

> 版本: 2.0  
> 创建时间: 2026-03-24  
> 覆盖范围: 全业务场景像素级验证  

---

## 📋 文档说明

本文档基于《Functional Requirements Markdown File》和《CLAUDE_CN.md》需求，以**角色视角**按**业务场景路径**设计测试用例，每个测试用例包含：
- 精确的像素级验证点
- 详细的测试数据
- 操作步骤和预期结果
- 截图对比基准

---

## 🎭 测试角色定义

| 角色 | 账号类型 | 权限范围 | 测试账号 |
|------|---------|---------|----------|
| 管理员 | system | 全平台管理 | admin / admin123 |
| 小学教师 | teacher + primary | 小学题库、班级、考试 | teacher_primary / teacher123 |
| 初中教师 | teacher + junior | 初中题库、班级、考试 | teacher_junior / teacher123 |
| 小学学生 | student + primary | 小学考试、练习 | 450102201501011234 / 123456 |
| 初中学生 | student + junior | 初中考试、练习 | 450102201001011234 / 123456 |
| 未激活学生 | inactive | 仅可激活 | practice_user_001 / 123456 |

---

## 🧪 测试数据集合

### 测试账号数据
```json
{
  "admin": {
    "account": "admin",
    "password": "admin123",
    "role": "admin"
  },
  "primary_teacher": {
    "account": "teacher_primary",
    "password": "teacher123",
    "role": "teacher",
    "grade_group": "primary"
  },
  "junior_teacher": {
    "account": "teacher_junior", 
    "password": "teacher123",
    "role": "teacher",
    "grade_group": "junior"
  },
  "primary_student": {
    "identity_no": "450102201501011234",
    "password": "123456",
    "grade_group": "primary",
    "name": "张小北",
    "school": "南宁市第一小学"
  },
  "junior_student": {
    "identity_no": "450102201001011234",
    "password": "123456", 
    "grade_group": "junior",
    "name": "李小明",
    "school": "南宁市第一中学"
  }
}
```

### 激活码测试数据
```json
{
  "primary_teacher_code": "ACTIVATE_PT_001",
  "primary_student_code": "ACTIVATE_PS_001", 
  "junior_teacher_code": "ACTIVATE_JT_001",
  "junior_student_code": "ACTIVATE_JS_001"
}
```

---

## 📱 场景一：账号生命周期 - 从生成到激活

### 场景路径
```
管理员生成账号/激活码 → 分发给学生/老师 → 用户激活 → 登录系统
```

### TC-001: 管理员批量生成练习账号
**前置条件**: 管理员已登录
**测试目标**: 验证批量生成练习账号流程的像素级UI

#### 操作步骤与验证点

| 步骤 | 操作 | 验证点（像素级） | 预期结果 |
|------|------|-----------------|----------|
| 1 | 点击左侧菜单【账号管理】 | 菜单项文字: "账号管理"，字体 14px，颜色 #1890ff | 菜单高亮，背景色 #e6f7ff |
| 2 | 点击【批量生成练习账号】按钮 | 按钮尺寸: 120px × 32px，圆角 4px，主色 #1890ff | 弹出Modal弹窗 |
| 3 | 验证弹窗标题 | 标题: "批量生成练习账号"，字体 16px，加粗，居中 | 标题显示正确 |
| 4 | 输入生成数量: 300 | Input高度 32px，边框颜色 #d9d9d9，聚焦时 #1890ff | 输入框显示 300 |
| 5 | 选择学段: 小学组 | Radio样式: 16px圆形，选中时内部圆点 #1890ff | 小学组被选中 |
| 6 | 输入初始密码: 123456 | 密码输入框类型为 password，显示圆点 | 密码已输入 |
| 7 | 点击【预览】按钮 | 按钮为默认样式，边框 #d9d9d9 | 显示账号预览列表 |
| 8 | 验证预览表格 | 表格行高 54px，表头背景 #fafafa，字体 14px | 显示10条预览数据 |
| 9 | 点击【确认生成】按钮 | 按钮加载状态: 显示 spinning icon | 生成成功，Toast提示 |
| 10 | 验证成功提示 | Toast: 位置顶部居中，背景 #f6ffed，文字 #52c41a | 显示"成功生成300个账号" |

**截图基准**: `admin-batch-generate-practice-modal.png`
**关键像素验证**:
```typescript
// 验证Modal宽度
expect(modal).toHaveCSS('width', '600px');
// 验证步骤条高度  
expect(steps).toHaveCSS('height', '40px');
// 验证表格单元格padding
expect(tableCell).toHaveCSS('padding', '16px');
```

---

### TC-002: 管理员批量生成考试账号（从Excel导入）
**前置条件**: 管理员已登录
**测试目标**: 验证从学生名单导入生成考试账号

#### 操作步骤与验证点

| 步骤 | 操作 | 验证点（像素级） | 预期结果 |
|------|------|-----------------|----------|
| 1 | 点击【批量生成考试账号】 | 按钮位置: 右侧距批量生成练习账号 12px | 打开导入弹窗 |
| 2 | 验证导入弹窗布局 | 上传区域: 虚线边框，拖拽区域 200px × 120px | 显示拖拽上传区 |
| 3 | 上传测试文件 students.xlsx | 上传图标大小 48px，颜色 #999999 | 显示文件信息 |
| 4 | 验证文件信息显示 | 文件名 14px，文件大小 12px #999999 | 显示 50条数据待导入 |
| 5 | 点击【开始导入】 | 进度条: 高度 8px，圆角 4px，颜色 #1890ff | 显示导入进度 |
| 6 | 验证导入结果 | 成功图标: 64px，绿色 #52c41a | 显示导入成功统计 |

**测试数据文件**: 
```csv
identity_no,name,school,grade_group
450102201501011001,张学生1,南宁市第一小学,primary
450102201501011002,张学生2,南宁市第一小学,primary
...
```

---

### TC-003: 学生激活账号流程
**前置条件**: 学生拥有未激活的练习账号和激活码
**测试目标**: 验证激活流程的UI像素级准确性

#### 操作步骤与验证点

| 步骤 | 操作 | 验证点（像素级） | 预期结果 |
|------|------|-----------------|----------|
| 1 | 访问 /activate | 页面背景: 渐变 linear-gradient(135deg, #667eea 0%, #764ba2 100%) | 显示激活页面 |
| 2 | 验证激活卡片 | 卡片宽度 480px，圆角 8px，阴影 0 8px 24px rgba(0,0,0,0.1) | 卡片居中显示 |
| 3 | 输入激活码 | Input高度 40px，圆角 4px，placeholder颜色 #bfbfbf | 激活码已输入 |
| 4 | 验证账号类型选择 | Radio间距 8px，选中圆圈 6px 内部填充 | 默认选中"身份证号" |
| 5 | 切换到"用户名" | 切换动画 300ms ease，下方输入框淡入 | 显示用户名输入框 |
| 6 | 输入用户名 practice_001 | Input前缀图标 14px，间距 8px | 用户名已输入 |
| 7 | 输入新密码 | 密码强度指示器: 4段，每段 40px × 4px | 显示密码强度 |
| 8 | 点击【激活账号】 | 按钮宽度 100%，高度 40px，圆角 4px | 按钮 loading 状态 |
| 9 | 验证激活成功 | 成功图标 72px，动画缩放效果 | 跳转至登录页 |

**截图基准**: `activate-page-complete.png`
**关键像素验证**:
```typescript
// 激活卡片精确尺寸
expect(activateCard).toHaveCSS('width', '480px');
expect(activateCard).toHaveCSS('padding', '40px');
// 渐变背景验证
const bg = await activatePage.evaluate(el => getComputedStyle(el).background);
expect(bg).toContain('102, 126, 234');
expect(bg).toContain('118, 75, 162');
```

---

## 📱 场景二：用户认证 - 多端登录与互踢

### 场景路径
```
用户A在设备1登录 → 用户A在设备2登录 → 设备1收到踢出通知
```

### TC-004: 登录页面像素级验证
**前置条件**: 访问 /login
**测试目标**: 验证登录页面所有UI元素的精确位置和样式

#### 像素级验证清单

| 元素 | 属性 | 期望值 | 容差 |
|------|------|--------|------|
| 登录页容器 | min-height | 100vh | 0px |
| 登录页容器 | background | linear-gradient(135deg, #667eea, #764ba2) | 颜色值 |
| 登录卡片 | width | 420px | 0px |
| 登录卡片 | padding | 40px | 0px |
| 登录卡片 | border-radius | 8px | 0px |
| 登录卡片 | box-shadow | 0 8px 24px rgba(0,0,0,0.15) | 模糊度±2px |
| 主标题 h1 | font-size | 24px | 0px |
| 主标题 h1 | color | #333333 | 0px |
| 副标题 p | font-size | 14px | 0px |
| 副标题 p | color | #999999 | 0px |
| 输入框 | height | 40px | 0px |
| 输入框 | border-radius | 4px | 0px |
| 输入框 | padding | 8px 12px | 0px |
| 登录按钮 | height | 40px | 0px |
| 登录按钮 | border-radius | 4px | 0px |
| 登录按钮 | background | #1890ff | 0px |

**截图基准**: `login-page-pixel-perfect.png`

---

### TC-005: 多端登录互踢机制
**前置条件**: 学生账号已在设备1登录
**测试目标**: 验证多端登录时的互踢通知UI

#### 操作步骤与验证点

| 步骤 | 操作 | 验证点 | 预期结果 |
|------|------|--------|----------|
| 1 | 设备1登录成功 | WebSocket连接状态: connected | 显示学生首页 |
| 2 | 设备2使用同账号登录 | Modal弹窗: 宽度 400px，圆角 8px | 设备1显示被踢提示 |
| 3 | 设备1验证踢出Modal | 图标: 64px 警告图标 #faad14 | 显示"账号在其他设备登录" |
| 4 | 验证Modal按钮 | 【重新登录】按钮: 主色 #1890ff，100px宽 | 两个按钮水平排列，间距 12px |
| 5 | 点击【重新登录】 | 跳转动画: 300ms fade | 返回登录页，账号已清空 |

**关键像素验证**:
```typescript
// 踢出提示Modal
const kickModal = page.locator('.kickout-modal');
await expect(kickModal).toHaveCSS('width', '400px');
await expect(kickModal).toHaveCSS('border-radius', '8px');
// 警告图标
const warningIcon = kickModal.locator('.anticon-warning');
await expect(warningIcon).toHaveCSS('color', 'rgb(250, 173, 20)');
await expect(warningIcon).toHaveCSS('font-size', '64px');
```

---

## 📱 场景三：题库管理 - 题目CRUD完整流程

### 场景路径
```
教师登录 → 进入题库 → 创建题目 → 编辑题目 → 预览题目 → 删除题目
```

### TC-006: 题库列表页面像素验证
**前置条件**: 小学教师已登录
**测试目标**: 验证题库列表页的完整UI布局

#### 像素级验证清单

| 区域 | 元素 | 属性 | 期望值 |
|------|------|------|--------|
| 页面头部 | 标题区域 | height | 64px |
| 页面头部 | 标题文字 | font-size | 20px |
| 页面头部 | 创建按钮 | margin-left | auto |
| 筛选区 | 搜索框 | width | 280px |
| 筛选区 | 学段选择器 | width | 120px |
| 筛选区 | 学段选择器 | margin-right | 12px |
| 表格区 | 表格行 | height | 54px |
| 表格区 | 表头 | background | #fafafa |
| 表格区 | 表头文字 | font-weight | 500 |
| 表格区 | 操作按钮组 | gap | 8px |
| 分页区 | 分页器 | margin-top | 16px |
| 分页区 | 分页器 | justify-content | flex-end |

**截图基准**: `teacher-question-banks-list.png`

---

### TC-007: 创建题目表单像素验证
**前置条件**: 教师在题库详情页
**测试目标**: 验证4种题型的创建表单UI

#### 单选题创建表单验证

| 步骤 | 操作 | 验证点（像素级） | 预期结果 |
|------|------|-----------------|----------|
| 1 | 点击【添加题目】 | 弹窗从底部滑入，动画 300ms | 显示题目类型选择 |
| 2 | 选择【单选题】 | 选项卡片: 120px × 80px，hover效果 | 进入单选题编辑 |
| 3 | 验证表单布局 | 标签宽度 100px，右对齐 | 表单显示正确 |
| 4 | 输入题目内容 | 富文本编辑器: 高度 150px，边框 #d9d9d9 | 内容已输入 |
| 5 | 添加选项A | 选项输入框: 高度 32px，前缀标签 A/B/C/D | 显示选项输入框 |
| 6 | 设置正确答案 | Radio选中: 圆圈 16px，内部点 8px #1890ff | A选项被选中 |
| 7 | 设置分值 | InputNumber: 宽度 100px，步进器 22px | 显示 2.0 |
| 8 | 点击【保存】 | 按钮 loading 状态: 图标 14px，间距 8px | 保存成功，Toast提示 |

#### 多选题创建表单额外验证

| 验证点 | 期望值 |
|--------|--------|
| 多选Checkbox尺寸 | 16px × 16px |
| 评分规则区域 | 背景 #f6ffed，边框 #b7eb8f |
| 漏选计分模式选择器 | width: 200px |
| 部分分值输入框 | width: 80px |

#### 主观题创建表单额外验证

| 验证点 | 期望值 |
|--------|--------|
| 文件上传区域 | 虚线边框，高度 120px |
| 上传图标大小 | 48px |
| 支持格式提示 | font-size: 12px，color: #999999 |

**截图基准**: 
- `question-form-single-choice.png`
- `question-form-multi-choice.png` 
- `question-form-judgment.png`
- `question-form-subjective.png`

---

## 📱 场景四：套卷管理 - 可视化组卷

### 场景路径
```
教师登录 → 创建套卷 → 从题库选题 → 拖拽排序 → 设置分值 → 预览套卷 → 发布
```

### TC-008: 套卷编辑页面像素验证
**前置条件**: 教师已创建套卷，进入编辑页
**测试目标**: 验证套卷编辑页的复杂布局

#### 页面整体布局验证

| 区域 | 宽度 | 位置 | 背景色 |
|------|------|------|--------|
| 左侧信息区 | 300px | fixed left | #ffffff |
| 右侧编辑区 | calc(100% - 316px) | margin-left 316px | #f0f2f5 |
| 顶部工具栏 | 100% | sticky top | #ffffff |

#### 左侧信息区像素验证

| 元素 | 属性 | 期望值 |
|------|------|--------|
| 套卷名称 | font-size | 18px |
| 套卷名称 | font-weight | 500 |
| 总分显示 | font-size | 32px |
| 总分显示 | color | #1890ff |
| 题型分布饼图 | width/height | 200px |
| 饼图标签 | font-size | 12px |
| 【从题库添加】按钮 | width | 100% |
| 【从题库添加】按钮 | height | 40px |

#### 题目卡片像素验证

| 元素 | 属性 | 期望值 |
|------|------|--------|
| 卡片容器 | padding | 12px 16px |
| 卡片容器 | border-radius | 8px |
| 拖拽手柄 | width | 24px |
| 拖拽手柄 | color | #999999 |
| 题号 | width | 40px |
| 题型标签 | padding | 2px 8px |
| 题型标签 | border-radius | 4px |
| 题目预览 | line-clamp | 2 |
| 分值输入框 | width | 80px |
| 操作按钮组 | gap | 8px |

#### 拖拽排序交互验证

| 步骤 | 操作 | 验证点 |
|------|------|--------|
| 1 | 按住拖拽手柄 | cursor变为 grabbing，卡片半透明 opacity: 0.8 |
| 2 | 拖拽移动 | 显示占位符: 高度 2px，背景 #1890ff，动画 200ms |
| 3 | 释放拖拽 | 卡片新位置动画: 300ms ease，其他卡片自动调整 |

**截图基准**: `paper-edit-layout.png`

---

### TC-009: 套卷预览弹窗像素验证
**前置条件**: 套卷已添加题目
**测试目标**: 验证学生视角的套卷预览

#### 像素级验证清单

| 元素 | 属性 | 期望值 |
|------|------|--------|
| 预览弹窗 | width | 800px |
| 预览弹窗 | max-height | 80vh |
| 题目区域 | padding | 24px |
| 题号 | font-size | 16px |
| 题号 | font-weight | 600 |
| 题型标签 | font-size | 12px |
| 题目内容 | font-size | 14px |
| 题目内容 | line-height | 1.8 |
| 选项区域 | margin-top | 16px |
| 选项间距 | margin-bottom | 12px |

**截图基准**: `paper-preview-modal.png`

---

## 📱 场景五：考试管理 - 创建到监控

### 场景路径
```
教师创建考试 → 选择套卷 → 设置时间 → 导入考生 → 发布考试 → 实时监控
```

### TC-010: 考试创建表单像素验证
**前置条件**: 教师登录，进入考试列表
**测试目标**: 验证考试创建表单的复杂交互

#### 表单分步验证

**步骤一：基本信息**

| 元素 | 属性 | 期望值 |
|------|------|--------|
| 步骤条 | height | 40px |
| 步骤图标 | width/height | 32px |
| 步骤连接线 | height | 2px |
| 考试名称输入框 | width | 100% |
| 考试描述文本域 | min-height | 80px |
| 学段选择器 | width | 200px |

**步骤二：选择套卷**

| 元素 | 属性 | 期望值 |
|------|------|--------|
| 套卷卡片 | width | calc(50% - 8px) |
| 套卷卡片 | padding | 16px |
| 套卷卡片边框(未选中) | border | 1px solid #d9d9d9 |
| 套卷卡片边框(选中) | border | 2px solid #1890ff |
| 套卷名称 | font-size | 16px |
| 套卷统计 | font-size | 12px，color #999999 |
| 【使用A/B卷】开关 | margin-left | auto |

**步骤三：设置时间**

| 元素 | 属性 | 期望值 |
|------|------|--------|
| 日期时间选择器 | width | 280px |
| 时长输入框 | width | 120px |
| 时长单位 | margin-left | 8px |
| 时间冲突提示 | background | #fff2f0 |
| 时间冲突提示 | border | 1px solid #ffccc7 |
| 时间冲突提示图标 | color | #ff4d4f |

**步骤四：导入考生**

| 元素 | 属性 | 期望值 |
|------|------|--------|
| 导入方式Tab | height | 40px |
| Excel上传区域 | height | 200px |
| 模板下载链接 | color | #1890ff |
| 已导入统计 | font-size | 14px |
| 考生列表表格 | max-height | 300px |

**截图基准**: `exam-create-stepper.png`

---

### TC-011: 考试实时监控页面像素验证
**前置条件**: 考试进行中
**测试目标**: 验证考试监控看板的实时数据展示

#### 看板卡片像素验证（4列布局）

| 卡片 | 宽度 | 期望值 |
|------|------|--------|
| 总考生 | 25% - 12px | calc(25% - 12px) |
| 已登录 | 25% - 12px | calc(25% - 12px) |
| 答题中 | 25% - 12px | calc(25% - 12px) |
| 已提交 | 25% - 12px | calc(25% - 12px) |

#### 单个看板卡片像素验证

| 元素 | 属性 | 期望值 |
|------|------|--------|
| 卡片容器 | border-top | 4px solid {color} |
| 图标 | font-size | 24px |
| 数值 | font-size | 36px |
| 数值 | font-weight | 600 |
| 单位 | font-size | 14px |
| 趋势标签 | padding | 2px 8px |
| 更新时间 | font-size | 12px，color #999999 |

#### 考生列表像素验证

| 元素 | 属性 | 期望值 |
|------|------|--------|
| 搜索框 | width | 240px |
| 状态筛选 | width | 120px |
| 表格行 | height | 60px |
| 头像 | width/height | 40px |
| 头像 | border-radius | 50% |
| 学生姓名 | font-weight | 500 |
| 状态标签 | padding | 4px 12px |
| 操作按钮 | size | small |

#### 倒计时组件像素验证

| 元素 | 属性 | 期望值 |
|------|------|--------|
| 倒计时容器 | background | #f6ffed (剩余>10分钟) |
| 倒计时容器 | background | #fff2f0 (剩余<10分钟) |
| 倒计时数字 | font-size | 24px |
| 倒计时数字 | font-family | monospace |
| 紧急延时按钮 | margin-left | auto |

**截图基准**: `exam-dashboard-realtime.png`

---

## 📱 场景六：学生考试 - 从进入考场到交卷

### 场景路径
```
学生登录 → 进入考试 → 加载试题 → 答题（自动保存）→ 提交试卷 → 查看结果
```

### TC-012: 考试答题页面像素验证
**前置条件**: 学生已进入考试
**测试目标**: 验证答题页面的复杂分屏布局

#### 页面整体布局验证

| 区域 | 宽度 | 位置 | 背景色 |
|------|------|------|--------|
| 顶部Header | 100% | fixed top | #ffffff |
| 左侧答题卡 | 250px | fixed left | #ffffff |
| 右侧答题区 | calc(100% - 266px) | margin-left 266px | #f0f2f5 |
| 题目容器 | max-width | 800px | #ffffff |

#### 顶部Header像素验证

| 元素 | 属性 | 期望值 |
|------|------|--------|
| Header高度 | height | 64px |
| Header阴影 | box-shadow | 0 2px 8px rgba(0,0,0,0.1) |
| 考试标题 | font-size | 18px |
| 倒计时组件 | font-size | 20px (剩余>10分钟) |
| 倒计时组件(紧急) | font-size | 24px，color #ff4d4f |
| 进度显示 | font-size | 14px，color #999999 |

#### 左侧答题卡像素验证

| 元素 | 属性 | 期望值 |
|------|------|--------|
| 答题卡容器 | padding | 16px |
| 答题卡标题 | font-size | 16px |
| 答题卡标题 | margin-bottom | 16px |
| 题号网格 | display | grid |
| 题号网格 | grid-template-columns | repeat(5, 1fr) |
| 题号网格 | gap | 8px |
| 题号按钮 | width/height | 36px |
| 题号按钮(未答) | background | #ffffff |
| 题号按钮(已答) | background | #1890ff |
| 题号按钮(已答) | color | #ffffff |
| 题号按钮(标记) | border | 2px solid #faad14 |
| 图例区域 | margin-top | 24px |
| 图例圆点 | width/height | 12px |

#### 答题区题目像素验证

| 元素 | 属性 | 期望值 |
|------|------|--------|
| 题目容器 | padding | 24px |
| 题目容器 | border-radius | 8px |
| 题号+题型行 | margin-bottom | 16px |
| 题型标签 | background | #e6f7ff |
| 题型标签 | color | #1890ff |
| 题型标签 | padding | 4px 12px |
| 分值显示 | margin-left | auto |
| 题目内容 | font-size | 16px |
| 题目内容 | line-height | 1.8 |
| 题目图片 | max-width | 100% |
| 题目图片 | border-radius | 4px |
| 选项区域 | margin-top | 24px |

#### 单选题选项像素验证

| 元素 | 属性 | 期望值 |
|------|------|--------|
| 选项行 | padding | 12px 16px |
| 选项行 | border | 1px solid #d9d9d9 |
| 选项行 | border-radius | 8px |
| 选项行(选中) | border | 2px solid #1890ff |
| 选项行(选中) | background | #e6f7ff |
| Radio圆圈 | width/height | 16px |
| Radio圆圈(选中) | border | 5px solid #1890ff |
| 选项标签 | font-weight | 600 |
| 选项内容 | margin-left | 8px |

#### 多选题选项像素验证

| 元素 | 属性 | 期望值 |
|------|------|--------|
| Checkbox | width/height | 16px |
| Checkbox(选中) | background | #1890ff |
| 已选数量提示 | font-size | 12px |
| 已选数量提示 | color | #1890ff |
| 清除选择按钮 | margin-left | auto |

#### 主观题上传区域像素验证

| 元素 | 属性 | 期望值 |
|------|------|--------|
| 上传区域 | height | 150px |
| 上传区域 | border | 2px dashed #d9d9d9 |
| 上传区域 | border-radius | 8px |
| 上传图标 | font-size | 48px |
| 上传图标 | color | #999999 |
| 已上传文件列表 | margin-top | 16px |
| 文件卡片 | padding | 8px 12px |
| 文件卡片 | background | #f6ffed |
| 删除按钮 | margin-left | auto |

**截图基准**: 
- `exam-page-single-choice.png`
- `exam-page-multi-choice.png`
- `exam-page-subjective.png`

---

### TC-013: 交卷确认弹窗像素验证
**前置条件**: 学生点击交卷按钮
**测试目标**: 验证交卷确认弹窗的统计信息展示

#### 像素级验证清单

| 元素 | 属性 | 期望值 |
|------|------|--------|
| 弹窗宽度 | width | 480px |
| 标题 | font-size | 18px |
| 标题 | text-align | center |
| 统计区域 | background | #f6ffed |
| 统计区域 | padding | 16px |
| 统计区域 | border-radius | 8px |
| 进度条 | height | 8px |
| 进度条(已完成) | background | #52c41a |
| 进度条(未完成) | background | #d9d9d9 |
| 统计数字 | font-size | 24px |
| 统计数字 | font-weight | 600 |
| 主观题警告 | background | #fff2f0 |
| 主观题警告 | border | 1px solid #ffccc7 |
| 主观题警告图标 | color | #ff4d4f |
| 按钮组 | margin-top | 24px |
| 【继续答题】按钮 | width | 120px |
| 【确认交卷】按钮 | width | 120px |
| 按钮间距 | gap | 16px |

**截图基准**: `exam-submit-confirm-modal.png`

---

## 📱 场景七：成绩管理 - 自动评分到导出

### 场景路径
```
考试结束 → 客观题自动评分 → 教师主观题评分 → 总分计算 → 成绩查询/导出
```

### TC-014: 成绩列表页面像素验证
**前置条件**: 教师登录，考试已结束
**测试目标**: 验证成绩列表的数据展示

#### 像素级验证清单

| 元素 | 属性 | 期望值 |
|------|------|--------|
| 页面头部 | height | 64px |
| 导出按钮组 | gap | 8px |
| 统计卡片区域 | margin-bottom | 24px |
| 统计卡片 | width | calc(25% - 12px) |
| 表格排名列 | width | 60px |
| 表格姓名列 | width | 100px |
| 表格分数列 | width | 80px |
| 分数(优秀) | color | #52c41a |
| 分数(良好) | color | #1890ff |
| 分数(及格) | color | #faad14 |
| 分数(不及格) | color | #ff4d4f |
| 操作列 | width | 120px |

**截图基准**: `teacher-scores-list.png`

---

### TC-015: 主观题评分页面像素验证
**前置条件**: 教师进入主观题评分
**测试目标**: 验证三分屏评分布局

#### 三分屏布局验证

| 区域 | 宽度 | 背景色 |
|------|------|--------|
| 左侧学生列表 | 220px | #ffffff |
| 中间题目/答案 | calc(100% - 540px) | #f0f2f5 |
| 右侧评分区 | 300px | #ffffff |

#### 评分区像素验证

| 元素 | 属性 | 期望值 |
|------|------|--------|
| 学生信息卡片 | padding | 16px |
| 学生信息卡片 | background | #e6f7ff |
| 客观题得分 | font-size | 18px |
| 评分输入框 | height | 48px |
| 评分输入框 | font-size | 24px |
| 评分输入框 | text-align | center |
| 满分提示 | font-size | 12px |
| 评分标准 | margin-top | 16px |
| 评分标准项 | padding | 8px 0 |
| 评分标准勾选 | color | #52c41a |
| 评语文本域 | min-height | 80px |
| 【保存&下一题】按钮 | width | 100% |
| 【保存&下一题】按钮 | height | 40px |

**截图基准**: `teacher-grading-page.png`

---

## 📱 场景八：资源中心 - 教学资源管理

### TC-016: 资源中心页面像素验证
**前置条件**: 教师已登录，已激活资源权限
**测试目标**: 验证四级层级结构展示

#### 层级导航像素验证

| 元素 | 属性 | 期望值 |
|------|------|--------|
| 层级面包屑 | height | 40px |
| 层级面包屑 | padding | 0 16px |
| 当前层级 | font-weight | 600 |
| 返回上级按钮 | margin-right | 8px |
| 文件夹网格 | display | grid |
| 文件夹网格 | grid-template-columns | repeat(auto-fill, minmax(200px, 1fr)) |
| 文件夹网格 | gap | 16px |
| 文件夹卡片 | padding | 16px |
| 文件夹图标 | font-size | 48px |
| 文件夹图标 | color | #faad14 |
| 文件夹名称 | font-size | 14px |
| 文件夹名称 | text-align | center |
| 文件卡片 | padding | 16px |
| 文件类型图标 | font-size | 48px |
| 文件类型图标(PPT) | color | #ff4d4f |
| 文件类型图标(Word) | color | #1890ff |
| 文件类型图标(Video) | color | #52c41a |
| 【下载】按钮(禁用) | opacity | 0.5 |
| 【在线预览】按钮 | margin-left | 8px |

**截图基准**: `teacher-resources-page.png`

---

## 📱 场景九：响应式适配测试

### TC-017: 登录页响应式像素验证
**测试目标**: 验证登录页在不同屏幕尺寸下的适配

#### 断点测试矩阵

| 设备 | 视口尺寸 | 登录卡片宽度 | 其他验证 |
|------|---------|-------------|---------|
| 桌面大屏 | 1920×1080 | 420px | 居中显示，两侧渐变背景可见 |
| 桌面标准 | 1440×900 | 420px | 居中显示 |
| 桌面小屏 | 1280×720 | 420px | 居中显示 |
| 平板横屏 | 1024×768 | 420px | 居中显示 |
| 平板竖屏 | 768×1024 | 400px | 居中显示，边距减小 |
| 手机横屏 | 667×375 | 90% | 全宽显示，padding减小 |
| 手机标准 | 375×667 | 90% | 全宽显示，标题字号减小 |
| 手机小屏 | 320×568 | 100% | 全宽显示，最小padding |

#### 关键像素验证代码

```typescript
// 桌面端验证
await page.setViewportSize({ width: 1920, height: 1080 });
const loginCard = page.locator('.login-card');
await expect(loginCard).toHaveCSS('width', '420px');

// 移动端验证  
await page.setViewportSize({ width: 375, height: 667 });
const box = await loginCard.boundingBox();
expect(box?.width).toBeLessThanOrEqual(375 * 0.95);
```

---

## 📱 场景十：班级管理 - 教师端新增功能

### TC-018: 班级管理页面像素验证
**前置条件**: 教师已登录
**测试目标**: 验证班级管理完整UI

#### 班级列表像素验证

| 元素 | 属性 | 期望值 |
|------|------|--------|
| 统计卡片区域 | margin-bottom | 24px |
| 统计卡片(4个) | width | calc(25% - 12px) |
| 班级卡片 | padding | 20px |
| 班级卡片 | border-radius | 8px |
| 班级名称 | font-size | 18px |
| 班级名称 | font-weight | 500 |
| 学生人数 | font-size | 32px |
| 学生人数 | color | #1890ff |
| 平均分 | font-size | 24px |
| 趋势指示器 | margin-left | auto |

#### 学生详情弹窗像素验证

| 元素 | 属性 | 期望值 |
|------|------|--------|
| 弹窗宽度 | width | 700px |
| 学生头像 | width/height | 80px |
| 基本信息区 | padding | 20px |
| 成绩趋势图 | height | 200px |
| 考试记录表格 | max-height | 300px |
| 排名变化(上升) | color | #52c41a |
| 排名变化(下降) | color | #ff4d4f |

**截图基准**: `teacher-classes-page.png`

---

## 🔧 测试执行配置

### Playwright 配置参数

```typescript
// playwright.config.ts
export default defineConfig({
  // 截图对比配置
  expect: {
    toHaveScreenshot: {
      maxDiffPixels: 50,  // 最大差异像素数
      threshold: 0.2,     // 差异阈值
    },
  },
  
  // 视口配置
  use: {
    viewport: { width: 1280, height: 720 },
    screenshot: 'on',
    trace: 'on-first-retry',
  },
  
  // 多设备测试
  projects: [
    { name: 'Desktop Chrome', use: { ...devices['Desktop Chrome'] } },
    { name: 'Desktop Firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'Desktop Safari', use: { ...devices['Desktop Safari'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } },
  ],
});
```

### 截图存储结构

```
test-reports/
└── screenshots/
    ├── baseline/              # 基准截图
    │   ├── login-page.png
    │   ├── activate-page.png
    │   ├── admin-dashboard.png
    │   ├── teacher-dashboard.png
    │   ├── exam-page.png
    │   └── ...
    ├── actual/                # 实际截图
    │   └── ...
    └── diff/                  # 差异对比
        └── ...
```

---

## 📊 测试覆盖统计

| 场景 | 用例数 | 页面数 | 组件数 | 截图基准 |
|------|--------|--------|--------|----------|
| 账号生命周期 | 3 | 3 | 8 | 5 |
| 用户认证 | 2 | 2 | 6 | 3 |
| 题库管理 | 2 | 4 | 12 | 6 |
| 套卷管理 | 2 | 3 | 10 | 4 |
| 考试管理 | 2 | 4 | 15 | 5 |
| 学生考试 | 2 | 2 | 18 | 6 |
| 成绩管理 | 2 | 3 | 8 | 4 |
| 资源中心 | 1 | 2 | 6 | 2 |
| 响应式适配 | 1 | 8 | 4 | 8 |
| 班级管理 | 1 | 2 | 10 | 3 |
| **合计** | **18** | **33** | **97** | **46** |

---

## 📝 附录：快速测试数据准备

### SQL 测试数据插入

```sql
-- 插入测试管理员
INSERT INTO accounts (account_type, username, hashed_password, role, is_activated, created_at) 
VALUES ('system', 'admin', '$2b$12$...', 'admin', true, NOW());

-- 插入测试学生
INSERT INTO accounts (account_type, identity_no, hashed_password, grade_group, name, school, is_activated, created_at)
VALUES 
('exam', '450102201501011234', '$2b$12$...', 'primary', '张小北', '南宁市第一小学', true, NOW()),
('exam', '450102201001011234', '$2b$12$...', 'junior', '李小明', '南宁市第一中学', true, NOW());

-- 插入测试激活码
INSERT INTO activation_codes (code, grade_group, user_role, is_used, created_at)
VALUES 
('ACTIVATE_PT_001', 'primary', 'teacher', false, NOW()),
('ACTIVATE_PS_001', 'primary', 'student', false, NOW()),
('ACTIVATE_JT_001', 'junior', 'teacher', false, NOW()),
('ACTIVATE_JS_001', 'junior', 'student', false, NOW());
```

---

*文档版本: 2.0*  
*最后更新: 2026-03-24*  
*编写依据: Functional Requirements Markdown File + CLAUDE_CN.md*
