import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import MultiChoice from '@/components/exam/MultiChoice.vue'
import { h, nextTick } from 'vue'

describe('MultiChoice', () => {
  const mockOptions = [
    { label: 'A', content: '选项A内容' },
    { label: 'B', content: '选项B内容' },
    { label: 'C', content: '选项C内容' },
    { label: 'D', content: '选项D内容' },
  ]

  const createWrapper = (props = {}) => {
    return mount(MultiChoice, {
      props: {
        options: mockOptions,
        modelValue: '',
        ...props,
      },
      global: {
        stubs: {
          ACheckboxGroup: {
            props: ['value'],
            emits: ['change'],
            setup(props: any, { emit, slots }: any) {
              return () => h('div', { 
                class: 'options-group',
                'data-value': JSON.stringify(props.value),
              }, slots.default?.())
            },
          },
          ACheckbox: {
            props: ['value'],
            setup(props: any, { slots }: any) {
              return () => h('div', { 
                class: 'option-item',
                'data-value': props.value,
              }, slots.default?.())
            },
          },
          AButton: {
            props: ['type', 'size'],
            emits: ['click'],
            setup(props: any, { emit, slots }: any) {
              return () => h('button', { 
                class: 'ant-btn',
                type: props.type,
                onClick: () => emit('click'),
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
      expect(wrapper.find('.multi-choice').exists()).toBe(true)
      expect(wrapper.find('.options-group').exists()).toBe(true)
    })

    it('应该渲染所有选项', () => {
      const wrapper = createWrapper()
      const options = wrapper.findAll('.option-item')
      expect(options.length).toBe(4)
    })

    it('应该显示选项标签和内容', () => {
      const wrapper = createWrapper()
      const optionLabels = wrapper.findAll('.option-label')
      expect(optionLabels[0].text()).toBe('A')
      expect(optionLabels[1].text()).toBe('B')
      
      const optionContents = wrapper.findAll('.option-content')
      expect(optionContents[0].text()).toBe('选项A内容')
    })
  })

  describe('Props传递测试', () => {
    it('应该正确传递 options prop', () => {
      const customOptions = [
        { label: 'A', content: '自定义选项A' },
        { label: 'B', content: '自定义选项B' },
      ]
      const wrapper = createWrapper({ options: customOptions })
      expect(wrapper.findAll('.option-item').length).toBe(2)
    })

    it('应该将 modelValue 字符串转换为数组', () => {
      const wrapper = createWrapper({ modelValue: 'A,B' })
      const group = wrapper.find('.options-group')
      const value = JSON.parse(group.attributes('data-value') || '[]')
      expect(value).toContain('A')
      expect(value).toContain('B')
    })

    it('应该处理空字符串 modelValue', () => {
      const wrapper = createWrapper({ modelValue: '' })
      const group = wrapper.find('.options-group')
      const value = JSON.parse(group.attributes('data-value') || '[]')
      expect(value).toEqual([])
    })
  })

  describe('事件触发测试', () => {
    it('应该触发 update:modelValue 事件', async () => {
      const onUpdate = vi.fn()
      const wrapper = mount(MultiChoice, {
        props: {
          options: mockOptions,
          modelValue: '',
          'onUpdate:modelValue': onUpdate,
        },
        global: {
          stubs: {
            ACheckboxGroup: {
              props: ['value'],
              emits: ['change'],
              setup(props: any, { emit, slots }: any) {
                return () => h('div', { 
                  class: 'options-group',
                  onClick: () => emit('change', ['A', 'C'])
                }, slots.default?.())
              },
            },
            ACheckbox: {
              props: ['value'],
              setup(props: any, { slots }: any) {
                return () => h('label', { class: 'option-item' }, slots.default?.())
              },
            },
            AButton: true,
          },
        },
      })

      await wrapper.find('.options-group').trigger('click')
      expect(onUpdate).toHaveBeenCalledWith('A,C')
    })

    it('应该按字母顺序排序选中值', async () => {
      const onUpdate = vi.fn()
      const wrapper = mount(MultiChoice, {
        props: {
          options: mockOptions,
          modelValue: '',
          'onUpdate:modelValue': onUpdate,
        },
        global: {
          stubs: {
            ACheckboxGroup: {
              props: ['value'],
              emits: ['change'],
              setup(props: any, { emit, slots }: any) {
                return () => h('div', { 
                  class: 'options-group',
                  onClick: () => emit('change', ['D', 'A', 'C'])  // 无序输入
                }, slots.default?.())
              },
            },
            ACheckbox: {
              props: ['value'],
              setup(props: any, { slots }: any) {
                return () => h('label', { class: 'option-item' }, slots.default?.())
              },
            },
            AButton: true,
          },
        },
      })

      await wrapper.find('.options-group').trigger('click')
      expect(onUpdate).toHaveBeenCalledWith('A,C,D')  // 应该排序
    })

    it('清除按钮应该清空选择', async () => {
      const onUpdate = vi.fn()
      const wrapper = mount(MultiChoice, {
        props: {
          options: mockOptions,
          modelValue: 'A,B',
          'onUpdate:modelValue': onUpdate,
        },
        global: {
          stubs: {
            ACheckboxGroup: true,
            ACheckbox: true,
            AButton: {
              props: ['type', 'size'],
              emits: ['click'],
              setup(props: any, { emit, slots }: any) {
                return () => h('button', { 
                  class: 'ant-btn',
                  onClick: () => emit('click'),
                }, slots.default?.())
              },
            },
          },
        },
      })

      // 先等待组件渲染完成
      await nextTick()
      
      // 找到清除按钮并点击
      const clearButton = wrapper.find('.ant-btn')
      expect(clearButton.exists()).toBe(true)
      expect(clearButton.text()).toContain('清除选择')
      
      await clearButton.trigger('click')
      expect(onUpdate).toHaveBeenCalledWith('')
    })
  })

  describe('已选提示测试', () => {
    it('当有选择时应该显示已选提示', async () => {
      const wrapper = createWrapper({ modelValue: 'A,B' })
      await nextTick()
      
      const hint = wrapper.find('.selected-hint')
      expect(hint.exists()).toBe(true)
      expect(hint.text()).toContain('已选择')
    })

    it('当没有选择时不应该显示已选提示', async () => {
      const wrapper = createWrapper({ modelValue: '' })
      await nextTick()
      
      const hint = wrapper.find('.selected-hint')
      expect(hint.exists()).toBe(false)
    })

    it('应该正确显示已选选项的标签', async () => {
      const wrapper = createWrapper({ modelValue: 'A' })
      await nextTick()
      
      const hint = wrapper.find('.selected-hint')
      expect(hint.text()).toContain('A. 选项A内容')
    })

    it('应该截断长内容', async () => {
      const longContentOptions = [
        { label: 'A', content: '这是一个非常长的选项内容，超过20个字符' },
      ]
      const wrapper = createWrapper({ 
        options: longContentOptions,
        modelValue: 'A' 
      })
      await nextTick()
      
      const hint = wrapper.find('.selected-hint')
      expect(hint.text()).toContain('...')
    })
  })

  describe('用户交互测试', () => {
    it('应该支持多选切换', async () => {
      const onUpdate = vi.fn()
      const wrapper = mount(MultiChoice, {
        props: {
          options: mockOptions,
          modelValue: 'A',
          'onUpdate:modelValue': onUpdate,
        },
        global: {
          stubs: {
            ACheckboxGroup: {
              props: ['value'],
              emits: ['change'],
              setup(props: any, { emit, slots }: any) {
                return () => h('div', { 
                  class: 'options-group',
                  onClick: () => emit('change', ['A', 'B', 'C'])
                }, slots.default?.())
              },
            },
            ACheckbox: {
              props: ['value'],
              setup(props: any, { slots }: any) {
                return () => h('label', { class: 'option-item' }, slots.default?.())
              },
            },
            AButton: true,
          },
        },
      })

      await wrapper.find('.options-group').trigger('click')
      expect(onUpdate).toHaveBeenCalledWith('A,B,C')
    })
  })
})
