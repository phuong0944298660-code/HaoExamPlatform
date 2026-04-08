# 前端测试文档

## 测试环境配置

本项目使用以下测试工具：

- **Vitest**: 测试框架
- **@vue/test-utils**: Vue 组件测试工具
- **@vitest/coverage-v8**: 代码覆盖率工具
- **jsdom**: DOM 模拟环境

## 文件结构

```
tests/
├── setup.ts                          # 测试全局配置
├── utils.ts                          # 测试工具函数
├── utils/
│   ├── format.spec.ts               # 格式化工具函数测试
│   └── request.spec.ts              # HTTP 请求工具测试
├── api/
│   └── auth.spec.ts                 # 认证 API 测试
├── components/
│   ├── exam/
│   │   ├── SingleChoice.spec.ts     # 单选题组件测试
│   │   ├── MultiChoice.spec.ts      # 多选题组件测试
│   │   ├── Judgment.spec.ts         # 判断题组件测试
│   │   └── AnswerSheet.spec.ts      # 答题卡组件测试
│   ├── accounts/
│   │   └── BatchGeneratePracticeModal.spec.ts  # 批量生成练习账号弹窗测试
│   └── questions/
│       └── QuestionPreview.spec.ts  # 题目预览组件测试
└── store/
    └── user.spec.ts                 # 用户状态管理测试
```

## 运行测试

```bash
# 安装依赖
npm install

# 运行所有测试（监听模式）
npm run test

# 运行所有测试（一次性）
npm run test:run

# 生成覆盖率报告
npm run test:coverage

# 启动 Vitest UI
npm run test:ui
```

## 编写测试

### 组件测试示例

```typescript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MyComponent from '@/components/MyComponent.vue'
import { h } from 'vue'

describe('MyComponent', () => {
  it('应该正确渲染', () => {
    const wrapper = mount(MyComponent)
    expect(wrapper.find('.my-component').exists()).toBe(true)
  })
})
```

### Store 测试示例

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMyStore } from '@/store/myStore'

describe('My Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('应该有正确的初始状态', () => {
    const store = useMyStore()
    expect(store.someValue).toBe('initial')
  })
})
```

### 工具函数测试示例

```typescript
import { describe, it, expect } from 'vitest'
import { myUtil } from '@/utils/myUtil'

describe('My Util', () => {
  it('应该正确执行', () => {
    expect(myUtil('input')).toBe('output')
  })
})
```

## 测试工具函数

`tests/utils.ts` 提供了以下工具函数：

- `createTestingPinia()`: 创建测试用的 Pinia 实例
- `mountWithPinia(component, options)`: 挂载组件并自动配置 Pinia
- `shallowMountWithPinia(component, options)`: 浅挂载组件
- `wait(ms)`: 等待指定毫秒
- `mockLocalStorage(storage)`: 模拟 localStorage
- `mockClipboard()`: 模拟 clipboard API
- `createMockFile(name, size, type)`: 创建 Mock 文件

## 最佳实践

1. **每个测试应该独立**: 使用 `beforeEach` 重置状态
2. **描述清晰**: 使用 `describe` 和 `it` 描述测试场景
3. **覆盖边界情况**: 测试正常情况和异常情况
4. **使用工具函数**: 使用 `tests/utils.ts` 中的工具函数简化测试
5. **模拟外部依赖**: 使用 `vi.mock()` 模拟 API 调用和外部依赖

## 覆盖率报告

运行 `npm run test:coverage` 后，覆盖率报告将生成在：

- 控制台：文本格式报告
- `coverage/`: HTML 格式报告
- `coverage/lcov.info`: LCOV 格式（可用于 CI/CD）
