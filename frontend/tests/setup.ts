import { config } from '@vue/test-utils'
import { vi } from 'vitest'

// 模拟 Ant Design Vue 的 message 组件
vi.mock('ant-design-vue', async () => {
  const actual = await vi.importActual('ant-design-vue')
  return {
    ...actual,
    message: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
    },
  }
})

// 模拟 router
vi.mock('@/router', () => ({
  default: {
    push: vi.fn(),
    replace: vi.fn(),
    currentRoute: { value: {} },
  },
}))

// 清理 DOM 和模拟
afterEach(() => {
  vi.clearAllMocks()
})

// 全局配置
config.global.stubs = {
  // 可选：全局 stub 某些组件
}
