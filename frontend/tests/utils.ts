import { mount, shallowMount, type ComponentMountingOptions } from '@vue/test-utils'
import type { Component } from 'vue'
import { createPinia, setActivePinia } from 'pinia'

/**
 * 创建测试用的 Pinia 实例
 */
export function createTestingPinia() {
  return createPinia()
}

/**
 * 挂载组件并自动配置 Pinia
 */
export function mountWithPinia<T extends Component>(
  component: T,
  options: ComponentMountingOptions<T> = {}
) {
  const pinia = createTestingPinia()
  setActivePinia(pinia)

  return mount(component, {
    ...options,
    global: {
      ...options.global,
      plugins: [pinia, ...(options.global?.plugins || [])],
    },
  })
}

/**
 * 浅挂载组件（只渲染当前组件，子组件用 stub 替代）
 */
export function shallowMountWithPinia<T extends Component>(
  component: T,
  options: ComponentMountingOptions<T> = {}
) {
  const pinia = createTestingPinia()
  setActivePinia(pinia)

  return shallowMount(component, {
    ...options,
    global: {
      ...options.global,
      plugins: [pinia, ...(options.global?.plugins || [])],
    },
  })
}

/**
 * 等待指定时间（用于异步操作）
 */
export function wait(ms: number = 0) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 模拟 localStorage
 */
export function mockLocalStorage(storage: Record<string, string> = {}) {
  const mockStorage = { ...storage }
  
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: vi.fn((key: string) => mockStorage[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        mockStorage[key] = value
      }),
      removeItem: vi.fn((key: string) => {
        delete mockStorage[key]
      }),
      clear: vi.fn(() => {
        Object.keys(mockStorage).forEach(key => delete mockStorage[key])
      }),
    },
    writable: true,
  })

  return mockStorage
}

/**
 * 模拟 clipboard API
 */
export function mockClipboard() {
  Object.assign(navigator, {
    clipboard: {
      writeText: vi.fn().mockResolvedValue(undefined),
    },
  })
}

/**
 * 创建 Mock 文件
 */
export function createMockFile(name: string, size: number, type: string): File {
  const blob = new Blob([''.padStart(size, 'a')], { type })
  return new File([blob], name, { type })
}
