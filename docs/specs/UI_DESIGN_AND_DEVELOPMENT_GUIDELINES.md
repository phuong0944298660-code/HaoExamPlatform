# UI 设计与开发规范

接力教育智慧云平台（Jieli Education Smart Cloud Platform）前端 UI 设计与开发规范。

---

## 1. 设计原则

- **一致性**：同类组件、同类页面使用统一的布局、间距、颜色和交互模式。
- **可读性**：信息层级清晰，重点突出，避免视觉噪音。
- **可用性**：表单对齐、操作反馈、错误提示必须符合用户直觉。
- **可维护性**：禁止在多个页面复制相同的样式覆盖，公共规则应提取到全局样式文件。

---

## 2. 表单规范

### 2.1 搜索表单

- **类名**：所有管理后台的搜索/筛选表单必须统一使用 `.search-form` 类。
- **高度统一**：`.search-form` 内所有控件（`a-select`、`a-input`（含 `allow-clear`）、`a-picker`、`a-input-number`）的高度统一为 **32px**。该规则已在 `frontend/src/styles/layout-override.css` 中全局定义，**禁止在单个 Vue 文件中重复书写 `height: 32px` 覆盖**。
- **表单项边距**：搜索表单项统一设置 `margin-bottom: 0`，避免筛选区域产生额外空白。
- **按钮区域**：操作按钮区域使用 `.form-actions` 类，并设置 `justify-content: flex-end` 右对齐。
- **标签间距**：标签与输入框之间保持 **4px** 间距（`padding-right: 4px`）。
- **栅格间距**：搜索区域使用 `a-row :gutter="[16, 16]"`。

### 2.2 输入框

- 当使用 `<a-input allow-clear>` 时，Ant Design Vue 4 会生成 `.ant-input-affix-wrapper` 包裹层。项目已全局覆盖其高度，**无需在单文件中额外处理**。
- 弹窗表单中，`a-select` 与 `a-input` 混用时，保持相同的 `size`（默认即可，不要混用 `size="large"` 和默认尺寸）。

### 2.3 禁止事项

- 禁止在多个页面复制粘贴相同的 `:deep(.ant-select), :deep(.ant-input) { height: 32px; }` 样式。
- 禁止在单文件组件中使用 `!important` 覆盖 Ant Design Vue 组件样式，除非是 `layout-override.css` 中经评审的全局规则。

---

## 3. 按钮规范

### 3.1 按钮类型

| 场景 | 类型 |
|------|------|
| 主操作（查询、保存、提交） | `type="primary"` |
| 次要操作（重置、取消） | `type="default"` |
| 危险操作（删除、禁用） | `danger` |
| 表格操作列 | `type="link" size="small"` |

### 3.2 图标按钮

- 按钮图标统一使用 `@ant-design/icons-vue` 组件，通过 `<template #icon>` 插槽传入。
- 操作按钮建议横向排列，使用 `<a-space>` 包裹。

---

## 4. 表格规范

### 4.1 操作列

- **必须固定右侧**：`fixed: 'right'`。
- **宽度建议**：120px - 180px，根据操作数量调整。
- **按钮排列**：使用 `<a-space size="small">` 横向紧凑排列，分隔线使用 `<a-divider type="vertical" />`。

### 4.2 列宽

- 关键列（如激活码、ID）设置固定宽度，避免内容变化导致表格抖动。
- 描述类列可适当放宽，保证表格整体可横向滚动（外层已全局设置 `.ant-table-wrapper { overflow-x: auto; }`）。

---

## 5. 间距规范

- **页面内边距**：统一 `padding: 24px`（已在 `layout-override.css` 全局设置）。
- **卡片间距**：卡片之间统一 `margin-bottom: 24px`。
- **搜索栅格 gutter**：`[16, 16]`。
- **优先使用 CSS 变量**：`frontend/src/styles/design-system.css` 中定义了完整的间距系统。

常用变量：

| 变量 | 值 |
|------|-----|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-6` | 24px |

---

## 6. 颜色规范

优先使用 `frontend/src/styles/design-system.css` 中的 CSS 变量，避免硬编码颜色值。

### 6.1 品牌与功能色

| 语义 | 变量 | 色值 |
|------|------|------|
| 品牌主色 | `--primary-500` | `#1890ff` |
| 成功 | `--success-500` | `#52c41a` |
| 警告 | `--warning-500` | `#faad14` |
| 错误 | `--error-500` | `#f5222d` |
| 信息 | `--info-500` | `#1890ff` |

### 6.2 中性色

| 语义 | 变量 | 色值 |
|------|------|------|
| 主要文本 | `--text-primary` | `#262626` |
| 次要文本 | `--text-secondary` | `#595959` |
| 辅助文本 | `--text-tertiary` | `#8c8c8c` |
| 禁用文本 | `--text-disabled` | `#bfbfbf` |
| 默认边框 | `--border-default` | `#d9d9d9` |
| 浅色边框 | `--border-light` | `#f0f0f0` |

---

## 7. 图标规范

- **菜单图标**：通过后端 `sys_menu.icon` 字段配置，前端通过 `iconMap` 映射到 `@ant-design/icons-vue` 组件。
- **新增图标**：新增菜单图标时，必须同步更新前端 `iconMap`，并确保图标名与 Ant Design Vue 官方图标名一致。
- **一级菜单推荐图标**：参见 `CLAUDE.md` 中「UI/UX 规范 → 侧边栏菜单图标规范」章节。

---

## 8. 全局样式文件关系

| 文件 | 用途 | 修改建议 |
|------|------|----------|
| `frontend/src/style.css` | 基础 DOM 样式、Vite 默认样式、light/dark 变量 | 一般不做业务覆盖 |
| `frontend/src/styles/layout-override.css` | Ant Design Vue 布局覆盖、搜索表单统一高度、表格/卡片全宽 | **所有跨页面的 UI 修正优先放在这里** |
| `frontend/src/styles/design-system.css` | 设计令牌：颜色、间距、字体、阴影、动画 | 供各页面引用 CSS 变量 |

**核心原则**：当发现多个页面需要相同的样式覆盖时，优先提取到 `layout-override.css`，而不是在多个 Vue 文件中复制 `scoped` 样式。

---

## 9. 组件展示参考

项目所有常用组件的规范展示和使用示例，请直接打开浏览器查看：

```
docs/specs/ui-component-showcase.html
```

该文件通过 CDN 引入了 Ant Design Vue 4，无需构建即可浏览。

---

## 10. 变更流程

若新需求与现有规范不一致，必须按以下流程处理：

1. **先提醒负责人/用户**：说明需求与现有规范的冲突点。
2. **统一修改规范文档**：更新本文档的相关章节，记录新的规则。
3. **同步更新所有涉及该组件的地方**：确保项目中所有使用该组件的位置保持一致，避免局部特殊化。
4. **更新组件展示**：如影响展示组件，同步更新 `ui-component-showcase.html`。

---

**最后更新**：2026-04-10
