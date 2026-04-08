import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import SingleChoice from '@/components/exam/SingleChoice.vue'
import { h } from 'vue'

// 模拟 Ant Design Vue 的 Radio 组件
const mockRadioGroup = {
  name: 'ARadioGroup',
  props: ['value'],
  emits: ['update:value'],
  template: '<div class="mock-radio-group"><slot /></div>',
}

const mockRadio = {
  name: 'ARadio',
  props: ['value'],
  template: '<div class="mock-radio" @click="$emit(\'update:value\', value)"><slot /></div>',
}

describe('SingleChoice', () => {
  const mockOptions = [
    { label: 'A', content: '选项A内容' },
    { label: 'B', content: '选项B内容' },
    { label: 'C', content: '选项C内容' },
    { label: 'D', content: '选项D内容' },
  ]

  const createWrapper = (props = {}) => {
    return mount(SingleChoice, {
      props: {
        options: mockOptions,
        modelValue: '',
        ...props,
      },
      global: {
        stubs: {
          ARadioGroup: {
            props: ['value'],
            emits: ['update:value'],
            setup(props: any, { emit, slots }: any) {
              return () => h('div', { 
                class: 'options-group',
                'data-value': props.value 
              }, slots.default?.())
            },
          },
          ARadio: {
            props: ['value'],
            setup(props: any, { slots }: any) {
              return () => h('div', { 
                class: 'option-item',
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
      expect(wrapper.find('.single-choice').exists()).toBe(true)
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
      expect(optionContents[1].text()).toBe('选项B内容')
    })

    it('应该正确处理HTML内容', () => {
      const optionsWithHtml = [
        { label: 'A', content: '<p>段落内容</p>' },
      ]
      const wrapper = createWrapper({ options: optionsWithHtml })
      const content = wrapper.find('.option-content')
      expect(content.html()).toContain('<p>段落内容</p>')
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

    it('应该正确传递 modelValue prop', () => {
      const wrapper = createWrapper({ modelValue: 'B' })
      expect(wrapper.find('.options-group').attributes('data-value')).toBe('B')
    })

    it('应该处理空选项数组', () => {
      const wrapper = createWrapper({ options: [] })
      expect(wrapper.findAll('.option-item').length).toBe(0)
    })
  })

  describe('事件触发测试', () => {
    it('应该触发 update:modelValue 事件', async () => {
      const wrapper = mount(SingleChoice, {
        props: {
          options: mockOptions,
          modelValue: '',
          'onUpdate:modelValue': (value: string) => {
            wrapper.setProps({ modelValue: value })
          },
        },
        global: {
          stubs: {
            ARadioGroup: {
              props: ['value'],
              emits: ['update:value'],
              setup(props: any, { emit, slots }: any) {
                return () => h('div', { 
                  class: 'options-group',
                  onClick: () => emit('update:value', 'C')
                }, slots.default?.())
              },
            },
            ARadio: {
              props: ['value'],
              setup(props: any, { slots }: any) {
                return () => h('label', { 
                  class: 'option-item',
                }, slots.default?.())
              },
            },
          },
        },
      })

      await wrapper.find('.options-group').trigger('click')
      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')![0]).toEqual(['C'])
    })

    it('应该正确传递选中的值', async () => {
      const onUpdate = vi.fn()
      const wrapper = mount(SingleChoice, {
        props: {
          options: mockOptions,
          modelValue: '',
          'onUpdate:modelValue': onUpdate,
        },
        global: {
          stubs: {
            ARadioGroup: {
              props: ['value'],
              emits: ['update:value'],
              setup(props: any, { emit, slots }: any) {
                return () => h('div', { 
                  class: 'options-group',
                  onClick: () => emit('update:value', 'A')
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
      expect(onUpdate).toHaveBeenCalledWith('A')
    })
  })

  describe('用户交互测试', () => {
    it('选项应该可以交互', () => {
      const wrapper = createWrapper()
      const options = wrapper.findAll('.option-item')
      expect(options.length).toBeGreaterThan(0)
    })

    it('应该支持动态更新选项', async () => {
      const wrapper = createWrapper()
      
      await wrapper.setProps({
        options: [
          { label: 'X', content: '新选项X' },
          { label: 'Y', content: '新选项Y' },
        ],
      })

      const optionLabels = wrapper.findAll('.option-label')
      expect(optionLabels[0].text()).toBe('X')
      expect(optionLabels[1].text()).toBe('Y')
    })

    it('应该支持动态更新选中值', async () => {
      const wrapper = createWrapper({ modelValue: '' })
      
      await wrapper.setProps({ modelValue: 'D' })
      
      expect(wrapper.find('.options-group').attributes('data-value')).toBe('D')
    })
  })
})
