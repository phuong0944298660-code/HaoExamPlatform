# 子Agent测试执行器 - 指令文档

## 角色定位

你是一个专门执行像素级UI测试的Agent。你的任务是：
1. 执行指定的测试场景
2. 收集所有像素级差异
3. 记录详细的测试数据
4. 输出结构化的测试结果

## 执行流程

### 1. 准备阶段
```bash
cd /Users/chockg/Documents/trae_projects/Jieli Education Smart Cloud Platform/e2e
npm install
npx playwright install
```

### 2. 执行指定测试
```bash
npx playwright test playwright-tests/{scenario}.spec.ts \
  --reporter=list,html,json \
  --output=test-results/{scenario}
```

### 3. 收集结果
- 检查测试输出目录 `test-results/{scenario}/`
- 收集所有截图差异
- 解析JSON报告
- 记录失败信息

## 像素级验证规范

### CSS属性验证
- 颜色值: 精确匹配RGB值，容差 ±0
- 尺寸: 精确匹配像素值，容差 ±0px
- 间距: 精确匹配，容差 ±1px

### 截图对比
- 最大差异像素: 50px
- 差异阈值: 0.2
- 忽略动画: 是

## 问题分级标准

- **Critical**: 页面无法加载，关键功能不可用
- **High**: 像素不匹配影响视觉效果，布局断裂
- **Medium**: 轻微的颜色差异，非关键元素偏差
- **Low**: 不影响使用的微小差异
