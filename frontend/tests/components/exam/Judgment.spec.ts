import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Judgment from '@/components/exam/Judgment.vue'
import { h } from 'vue'

describe('Judgment', () => {
  const createWrapper = (props = {}) => {
    return mount(Judgment, {
      props: {
        modelValue: '',
        ...props,
      },
      global: {
        stubs: {
          CheckCircleOutlined: {
            name: 'CheckCircleOutlined',
            setup() {
              return () => h('span', { class: 'check-icon' }, '✓')
            },
          },
          CloseCircleOutlined: {
            name: 'CloseCircleOutlined',
            setup() {
              return () => h('span', { class: 'close-icon' }, '✗')
            },
          },
          ARadioGroup: {
            props: ['value'],
            emits: ['update:value'],
            setup(props: any, { emit, slots }: any) {
              return () => h('div', { 
                class: 'options-group',
                'data-value': props.value,
                onClick: (e: Event) => {
                  const target = e.target as HTMLElement
                  const value = target.closest('.option-item')?.getAttribute('data-value')
                  if (value) emit('update:value', value)
                }
              }, slots.default?.())
            },
          },
          ARadio: {
            props: ['value'],
            setup(props: any, { slots }: any) {
              return () => h('div', { 
                class: `option-item option-${props.value === 'T' ? 'true' : 'false'}`,
                'data-value': props.value,
              }, slots.default?.())
            },
          },
        },
      },
    })
  }

  describe('渲染测试', () => {
    it('应该正确渲染组件', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.judgment').exists()).toBe(true)
      expect(wrapper.find('.options-group').exists()).toBe(true)
    })

    it('应该渲染两个选项（正确和错误）', () => {
      const wrapper = createWrapper()
      const options = wrapper.findAll('.option-item')
      expect(options.length).toBe(2)
    })

    it('应该正确显示选项文本', () => {
      const wrapper = createWrapper()
      const optionTexts = wrapper.findAll('.option-text')
      expect(optionTexts[0].text()).toBe('正确')
      expect(optionTexts[1].text()).toBe('错误')
    })

    it('应该显示图标', () => {
      const wrapper = createWrapper()
      const optionTrue = wrapper.find('.option-true')
      const optionFalse = wrapper.find('.option-false')
      
      expect(optionTrue.find('.option-icon').exists()).toBe(true)
      expect(optionFalse.find('.option-icon').exists()).toBe(true)
    })

    it('正确选项应该有 option-true 类', () => {
      const wrapper = createWrapper()
      const optionTrue = wrapper.find('.option-true')
      expect(optionTrue.exists()).toBe(true)
    })

    it('错误选项应该有 option-false 类', () => {
      const wrapper = createWrapper()
      const optionFalse = wrapper.find('.option-false')
      expect(optionFalse.exists()).toBe(true)
    })
  })

  describe('Props传递测试', () => {
    it('应该正确传递 modelValue prop 为 T', () => {
      const wrapper = createWrapper({ modelValue: 'T' })
      expect(wrapper.find('.options-group').attributes('data-value')).toBe('T')
    })

    it('应该正确传递 modelValue prop 为 F', () => {
      const wrapper = createWrapper({ modelValue: 'F' })
      expect(wrapper.find('.options-group').attributes('data-value')).toBe('F')
    })

    it('应该处理空字符串 modelValue', () => {
      const wrapper = createWrapper({ modelValue: '' })
      expect(wrapper.find('.options-group').attributes('data-value')).toBe('')
    })
  })

  describe('事件触发测试', () => {
    it('选择正确选项应该触发 update:modelValue 事件', async () => {
      const onUpdate = vi.fn()
      const wrapper = mount(Judgment, {
        props: {
          modelValue: '',
          'onUpdate:modelValue': onUpdate,
        },
        global: {
          stubs: {
            CheckCircleOutlined: true,
            CloseCircleOutlined: true,
            ARadioGroup: {
              props: ['value'],
              emits: ['update:value'],
              setup(props: any, { emit, slots }: any) {
                return () => h('div', { 
                  class: 'options-group',
                  onClick: () => emit('update:value', 'T')
                }, slots.default?.())
              },
            },
            ARadio: {
              props: ['value'],
              setup(props: any, { slots }: any) {
                return () => h('label', { class: 'option-item' }, slots.default?.())
              },
            },
          },
        },
      })

      await wrapper.find('.options-group').trigger('click')
      expect(onUpdate).toHaveBeenCalledWith('T')
    })

    it('选择错误选项应该触发 update:modelValue 事件', async () => {
      const onUpdate = vi.fn()
      const wrapper = mount(Judgment, {
        props: {
          modelValue: '',
          'onUpdate:modelValue': onUpdate,
        },
        global: {
          stubs: {
            CheckCircleOutlined: true,
            CloseCircleOutlined: true,
            ARadioGroup: {
              props: ['value'],
              emits: ['update:value'],
              setup(props: any, { emit, slots }: any) {
                return () => h('div', { 
                  class: 'options-group',
                  onClick: () => emit('update:value', 'F')
                }, slots.default?.())
              },
            },
            ARadio: {
              props: ['value'],
              setup(props: any, { slots }: any) {
                return () => h('label', { class: 'option-item' }, slots.default?.())
              },
            },
          },
        },
      })

      await wrapper.find('.options-group').trigger('click')
      expect(onUpdate).toHaveBeenCalledWith('F')
    })

    it('切换选项应该更新值', async () => {
      const wrapper = mount(Judgment, {
        props: {
          modelValue: 'T',
          'onUpdate:modelValue': (value: string) => {
            wrapper.setProps({ modelValue: value })
          },
        },
        global: {
          stubs: {
            CheckCircleOutlined: true,
            CloseCircleOutlined: true,
            ARadioGroup: {
              props: ['value'],
              emits: ['update:value'],
              setup(props: any, { emit, slots }: any) {
                return () => h('div', { 
                  class: 'options-group',
                  onClick: () => emit('update:value', 'F')
                }, slots.default?.())
              },
            },
            ARadio: {
              props: ['value'],
              setup(props: any, { slots }: any) {
                return () => h('label', { class: 'option-item' }, slots.default?.())
              },
            },
          },
        },
      })

      await wrapper.find('.options-group').trigger('click')
      expect(wrapper.emitted('update:modelValue')![0]).toEqual(['F'])
    })
  })

  describe('用户交互测试', () => {
    it('应该支持点击正确选项', async () => {
      const wrapper = createWrapper({ modelValue: '' })
      const optionTrue = wrapper.find('.option-true')
      expect(optionTrue.exists()).toBe(true)
      await optionTrue.trigger('click')
    })

    it('应该支持点击错误选项', async () => {
      const wrapper = createWrapper({ modelValue: '' })
      const optionFalse = wrapper.find('.option-false')
      expect(optionFalse.exists()).toBe(true)
      await optionFalse.trigger('click')
    })

    it('应该支持动态更新选中值', async () => {
      const wrapper = createWrapper({ modelValue: '' })
      
      await wrapper.setProps({ modelValue: 'T' })
      expect(wrapper.find('.options-group').attributes('data-value')).toBe('T')
      
      await wrapper.setProps({ modelValue: 'F' })
      expect(wrapper.find('.options-group').attributes('data-value')).toBe('F')
    })
  })
})
