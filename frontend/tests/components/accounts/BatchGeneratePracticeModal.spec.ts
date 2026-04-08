import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import BatchGeneratePracticeModal from '@/components/accounts/BatchGeneratePracticeModal.vue'
import { h, nextTick } from 'vue'

// 模拟 dayjs
vi.mock('dayjs', () => ({
  default: () => ({
    format: () => '250101',
  }),
}))

describe('BatchGeneratePracticeModal', () => {
  const createWrapper = (props = {}) => {
    return mount(BatchGeneratePracticeModal, {
      props: {
        visible: true,
        ...props,
      },
      global: {
        stubs: {
          AModal: {
            props: ['open', 'title', 'width', 'confirmLoading'],
            emits: ['ok', 'cancel', 'update:open'],
            setup(props: any, { emit, slots }: any) {
              return () => h('div', { 
                class: 'ant-modal',
                'data-open': props.open,
              }, [
                h('div', { class: 'modal-title' }, props.title),
                slots.default?.(),
                slots.footer?.(),
              ])
            },
          },
          ASteps: {
            props: ['current'],
            setup(props: any, { slots }: any) {
              return () => h('div', { class: 'ant-steps', 'data-current': props.current }, slots.default?.())
            },
          },
          AStep: {
            props: ['title', 'description'],
            setup(props: any) {
              return () => h('div', { class: 'ant-step' }, [props.title, props.description])
            },
          },
          AAlert: {
            props: ['message', 'description', 'type', 'showIcon'],
            setup(props: any) {
              return () => h('div', { class: `ant-alert ant-alert-${props.type}` }, [
                h('div', { class: 'alert-message' }, props.message),
                h('div', { class: 'alert-description' }, props.description),
              ])
            },
          },
          AForm: {
            props: ['model', 'layout', 'rules'],
            setup(props: any, { slots }: any) {
              return () => h('form', { class: 'ant-form' }, slots.default?.())
            },
          },
          AFormItem: {
            props: ['label', 'name', 'required'],
            setup(props: any, { slots }: any) {
              return () => h('div', { class: 'ant-form-item' }, [
                h('label', { class: 'form-label' }, props.label),
                slots.default?.(),
              ])
            },
          },
          ARow: {
            props: ['gutter'],
            setup(props: any, { slots }: any) {
              return () => h('div', { class: 'ant-row' }, slots.default?.())
            },
          },
          ACol: {
            props: ['span'],
            setup(props: any, { slots }: any) {
              return () => h('div', { class: `ant-col ant-col-${props.span}` }, slots.default?.())
            },
          },
          ASelect: {
            props: ['value', 'placeholder'],
            emits: ['update:value'],
            setup(props: any, { emit, slots }: any) {
              return () => h('select', { 
                class: 'ant-select',
                value: props.value,
                onChange: (e: Event) => emit('update:value', (e.target as HTMLSelectElement).value),
              }, slots.default?.())
            },
          },
          ASelectOption: {
            props: ['value'],
            setup(props: any, { slots }: any) {
              return () => h('option', { value: props.value }, slots.default?.())
            },
          },
          AInputNumber: {
            props: ['value', 'min', 'max', 'placeholder'],
            emits: ['update:value'],
            setup(props: any, { emit }: any) {
              return () => h('input', {
                class: 'ant-input-number',
                type: 'number',
                value: props.value,
                min: props.min,
                max: props.max,
                placeholder: props.placeholder,
                onInput: (e: Event) => emit('update:value', Number((e.target as HTMLInputElement).value)),
              })
            },
          },
          AInput: {
            props: ['value', 'placeholder', 'maxLength'],
            emits: ['update:value'],
            setup(props: any, { emit }: any) {
              return () => h('input', {
                class: 'ant-input',
                type: 'text',
                value: props.value,
                placeholder: props.placeholder,
                maxlength: props.maxLength,
                onInput: (e: Event) => emit('update:value', (e.target as HTMLInputElement).value),
              })
            },
          },
          AInputPassword: {
            props: ['value', 'placeholder', 'maxLength'],
            emits: ['update:value'],
            setup(props: any, { emit }: any) {
              return () => h('input', {
                class: 'ant-input-password',
                type: 'password',
                value: props.value,
                placeholder: props.placeholder,
                maxlength: props.maxLength,
                onInput: (e: Event) => emit('update:value', (e.target as HTMLInputElement).value),
              })
            },
          },
          ADivider: true,
          ACheckbox: {
            props: ['checked'],
            emits: ['update:checked'],
            setup(props: any, { emit, slots }: any) {
              return () => h('label', { class: 'ant-checkbox' }, [
                h('input', {
                  type: 'checkbox',
                  checked: props.checked,
                  onChange: (e: Event) => emit('update:checked', (e.target as HTMLInputElement).checked),
                }),
                slots.default?.(),
              ])
            },
          },
          AButton: {
            props: ['type', 'loading', 'disabled'],
            emits: ['click'],
            setup(props: any, { emit, slots }: any) {
              return () => h('button', {
                class: `ant-btn ant-btn-${props.type || 'default'}`,
                disabled: props.disabled,
                onClick: () => emit('click'),
              }, slots.default?.())
            },
          },
          ASpace: {
            setup(props: any, { slots }: any) {
              return () => h('div', { class: 'ant-space' }, slots.default?.())
            },
          },
          ADescriptions: {
            props: ['bordered', 'column'],
            setup(props: any, { slots }: any) {
              return () => h('div', { class: 'ant-descriptions' }, slots.default?.())
            },
          },
          ADescriptionsItem: {
            props: ['label'],
            setup(props: any, { slots }: any) {
              return () => h('div', { class: 'ant-descriptions-item' }, [
                h('span', { class: 'desc-label' }, props.label),
                slots.default?.(),
              ])
            },
          },
          ATag: {
            props: ['color'],
            setup(props: any, { slots }: any) {
              return () => h('span', { class: `ant-tag ant-tag-${props.color}` }, slots.default?.())
            },
          },
          AResult: {
            props: ['status', 'title', 'subTitle'],
            setup(props: any, { slots }: any) {
              return () => h('div', { class: `ant-result ant-result-${props.status}` }, [
                h('div', { class: 'result-title' }, props.title),
                h('div', { class: 'result-subtitle' }, props.subTitle),
                slots.extra?.(),
              ])
            },
          },
          ATable: {
            props: ['columns', 'dataSource', 'pagination', 'size', 'bordered'],
            setup(props: any) {
              return () => h('table', { class: 'ant-table' }, [
                h('thead', {}, h('tr', {}, props.columns.map((col: any) => 
                  h('th', {}, col.title)
                ))),
                h('tbody', {}, props.dataSource?.map((row: any) => 
                  h('tr', {}, props.columns.map((col: any) => 
                    h('td', {}, row[col.dataIndex || col.key])
                  ))
                )),
              ])
            },
          },
          ATypographyText: {
            props: ['copyable'],
            setup(props: any, { slots }: any) {
              return () => h('span', { class: 'typography-text' }, slots.default?.())
            },
          },
          TeamOutlined: true,
          BookOutlined: true,
          DownloadOutlined: true,
          CopyOutlined: true,
        },
      },
    })
  }

  describe('渲染测试', () => {
    it('应该正确渲染弹窗', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.ant-modal').exists()).toBe(true)
      expect(wrapper.find('.modal-title').text()).toBe('批量生成赛前练习账号')
    })

    it('应该显示步骤条', () => {
      const wrapper = createWrapper()
      const steps = wrapper.find('.ant-steps')
      expect(steps.exists()).toBe(true)
      expect(steps.attributes('data-current')).toBe('0')
    })

    it('步骤条应该有三个步骤', () => {
      const wrapper = createWrapper()
      const steps = wrapper.findAll('.ant-step')
      expect(steps.length).toBe(3)
    })
  })

  describe('步骤1 - 设置参数测试', () => {
    it('默认应该显示步骤1的内容', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.ant-alert-info').exists()).toBe(true)
      expect(wrapper.find('.ant-form').exists()).toBe(true)
    })

    it('应该能选择学段', async () => {
      const wrapper = createWrapper()
      const select = wrapper.find('.ant-select')
      
      await select.setValue('primary')
      expect(wrapper.vm.formState.gradeGroup).toBe('primary')
      
      await select.setValue('junior')
      expect(wrapper.vm.formState.gradeGroup).toBe('junior')
    })

    it('应该能设置生成数量', async () => {
      const wrapper = createWrapper()
      const input = wrapper.find('.ant-input-number')
      
      await input.setValue(400)
      expect(wrapper.vm.formState.count).toBe(400)
    })

    it('应该能输入初始密码', async () => {
      const wrapper = createWrapper()
      const passwords = wrapper.findAll('.ant-input-password')
      
      await passwords[0].setValue('password123')
      expect(wrapper.vm.formState.initialPassword).toBe('password123')
    })

    it('应该能输入密码确认', async () => {
      const wrapper = createWrapper()
      const passwords = wrapper.findAll('.ant-input-password')
      
      await passwords[1].setValue('password123')
      expect(wrapper.vm.formState.confirmPassword).toBe('password123')
    })

    it('应该能输入账号前缀', async () => {
      const wrapper = createWrapper()
      const prefixInput = wrapper.find('.ant-input')
      
      await prefixInput.setValue('LX2024')
      expect(wrapper.vm.formState.prefix).toBe('LX2024')
    })

    it('应该有发送邮件选项', async () => {
      const wrapper = createWrapper()
      const checkbox = wrapper.find('.ant-checkbox input')
      
      await checkbox.setValue(true)
      expect(wrapper.vm.formState.sendToEmail).toBe(true)
    })
  })

  describe('表单验证测试', () => {
    it('当学段未选择时不能下一步', async () => {
      const wrapper = createWrapper()
      wrapper.vm.formState.gradeGroup = undefined
      wrapper.vm.formState.count = 400
      wrapper.vm.formState.initialPassword = 'password123'
      wrapper.vm.formState.confirmPassword = 'password123'
      
      expect(wrapper.vm.canNext).toBe(false)
    })

    it('当数量不在300-600范围时不能下一步', async () => {
      const wrapper = createWrapper()
      wrapper.vm.formState.gradeGroup = 'primary'
      wrapper.vm.formState.count = 200
      wrapper.vm.formState.initialPassword = 'password123'
      wrapper.vm.formState.confirmPassword = 'password123'
      
      expect(wrapper.vm.canNext).toBe(false)
    })

    it('当密码长度不足6位时不能下一步', async () => {
      const wrapper = createWrapper()
      wrapper.vm.formState.gradeGroup = 'primary'
      wrapper.vm.formState.count = 400
      wrapper.vm.formState.initialPassword = '123'
      wrapper.vm.formState.confirmPassword = '123'
      
      expect(wrapper.vm.canNext).toBe(false)
    })

    it('当两次密码不一致时不能下一步', async () => {
      const wrapper = createWrapper()
      wrapper.vm.formState.gradeGroup = 'primary'
      wrapper.vm.formState.count = 400
      wrapper.vm.formState.initialPassword = 'password123'
      wrapper.vm.formState.confirmPassword = 'password456'
      
      expect(wrapper.vm.canNext).toBe(false)
    })

    it('所有条件满足时可以下一步', async () => {
      const wrapper = createWrapper()
      wrapper.vm.formState.gradeGroup = 'primary'
      wrapper.vm.formState.count = 400
      wrapper.vm.formState.initialPassword = 'password123'
      wrapper.vm.formState.confirmPassword = 'password123'
      
      expect(wrapper.vm.canNext).toBe(true)
    })
  })

  describe('步骤切换测试', () => {
    it('点击下一步应该进入步骤2', async () => {
      const wrapper = createWrapper()
      wrapper.vm.formState.gradeGroup = 'primary'
      wrapper.vm.formState.count = 400
      wrapper.vm.formState.initialPassword = 'password123'
      wrapper.vm.formState.confirmPassword = 'password123'
      
      await wrapper.vm.handleNext()
      expect(wrapper.vm.currentStep).toBe(1)
    })

    it('点击上一步应该返回步骤1', async () => {
      const wrapper = createWrapper()
      wrapper.vm.currentStep = 1
      
      await wrapper.vm.handlePrev()
      expect(wrapper.vm.currentStep).toBe(0)
    })

    it('返回步骤1时应该重置确认状态', async () => {
      const wrapper = createWrapper()
      wrapper.vm.currentStep = 1
      wrapper.vm.confirmChecked = true
      
      await wrapper.vm.handlePrev()
      expect(wrapper.vm.confirmChecked).toBe(false)
    })
  })

  describe('账号预览测试', () => {
    it('步骤2应该显示预览信息', async () => {
      const wrapper = createWrapper()
      wrapper.vm.currentStep = 1
      wrapper.vm.formState.gradeGroup = 'primary'
      wrapper.vm.formState.count = 400
      await nextTick()
      
      const alert = wrapper.find('.ant-alert-warning')
      expect(alert.exists()).toBe(true)
    })

    it('应该显示学段文本', async () => {
      const wrapper = createWrapper()
      wrapper.vm.currentStep = 1
      wrapper.vm.formState.gradeGroup = 'primary'
      await nextTick()
      
      expect(wrapper.vm.getGradeGroupText('primary')).toBe('小学组')
      expect(wrapper.vm.getGradeGroupText('junior')).toBe('初中组')
    })

    it('应该生成预览账号', async () => {
      const wrapper = createWrapper()
      wrapper.vm.formState.gradeGroup = 'primary'
      wrapper.vm.formState.count = 400
      wrapper.vm.formState.prefix = 'LX'
      
      const previews = wrapper.vm.previewAccounts
      expect(previews.length).toBe(5) // 最多显示5个预览
      expect(previews[0].username).toContain('LX') // 包含前缀
      expect(previews[0].username).toContain('P') // 小学组标识
    })

    it('密码应该被脱敏显示', () => {
      const wrapper = createWrapper()
      const masked = wrapper.vm.maskPassword('password123')
      expect(masked).toBe('••••••••')
    })
  })

  describe('确认提交测试', () => {
    it('未确认时不能提交', async () => {
      const wrapper = createWrapper()
      wrapper.vm.currentStep = 1
      wrapper.vm.confirmChecked = false
      
      expect(wrapper.vm.canSubmit).toBe(false)
    })

    it('确认后可以提交', async () => {
      const wrapper = createWrapper()
      wrapper.vm.currentStep = 1
      wrapper.vm.formState.gradeGroup = 'primary'
      wrapper.vm.formState.count = 400
      wrapper.vm.formState.initialPassword = 'password123'
      wrapper.vm.formState.confirmPassword = 'password123'
      wrapper.vm.confirmChecked = true
      
      expect(wrapper.vm.canSubmit).toBe(true)
    })

    it('提交后应该进入步骤3', async () => {
      const wrapper = createWrapper()
      wrapper.vm.currentStep = 1
      wrapper.vm.confirmChecked = true
      wrapper.vm.formState.gradeGroup = 'primary'
      wrapper.vm.formState.count = 300
      wrapper.vm.formState.initialPassword = 'password123'
      wrapper.vm.formState.confirmPassword = 'password123'
      
      vi.useFakeTimers()
      wrapper.vm.handleSubmit()
      vi.advanceTimersByTime(1600)
      await flushPromises()
      
      expect(wrapper.vm.currentStep).toBe(2)
      vi.useRealTimers()
    })

    it('应该生成正确的账号数量', async () => {
      const wrapper = createWrapper()
      wrapper.vm.formState.gradeGroup = 'primary'
      wrapper.vm.formState.count = 350
      wrapper.vm.formState.prefix = 'TEST'
      wrapper.vm.formState.initialPassword = 'pass123'
      
      const accounts = wrapper.vm.generateAccounts()
      expect(accounts.length).toBe(350)
      expect(accounts[0]).toHaveProperty('index')
      expect(accounts[0]).toHaveProperty('username')
      expect(accounts[0]).toHaveProperty('password')
      expect(accounts[0].password).toBe('pass123')
    })
  })

  describe('步骤3 - 完成测试', () => {
    it('步骤3应该显示成功结果', async () => {
      const wrapper = createWrapper()
      wrapper.vm.currentStep = 2
      wrapper.vm.generatedAccounts = [
        { index: 1, username: 'LXP2501010001', password: 'pass123' },
        { index: 2, username: 'LXP2501010002', password: 'pass123' },
      ]
      await nextTick()
      
      const result = wrapper.find('.ant-result-success')
      expect(result.exists()).toBe(true)
    })

    it('应该显示生成的账号列表', async () => {
      const wrapper = createWrapper()
      wrapper.vm.currentStep = 2
      wrapper.vm.generatedAccounts = Array.from({ length: 15 }, (_, i) => ({
        index: i + 1,
        username: `LXP250101${String(i + 1).padStart(4, '0')}`,
        password: 'pass123',
      }))
      await nextTick()
      
      const table = wrapper.find('.ant-table')
      expect(table.exists()).toBe(true)
    })
  })

  describe('事件测试', () => {
    it('应该触发 success 事件', async () => {
      const onSuccess = vi.fn()
      const wrapper = createWrapper({ onSuccess })
      
      wrapper.vm.currentStep = 1
      wrapper.vm.confirmChecked = true
      wrapper.vm.formState.gradeGroup = 'primary'
      wrapper.vm.formState.count = 300
      wrapper.vm.formState.initialPassword = 'password123'
      wrapper.vm.formState.confirmPassword = 'password123'
      
      vi.useFakeTimers()
      await wrapper.vm.handleSubmit()
      vi.advanceTimersByTime(1600)
      await flushPromises()
      
      expect(onSuccess).toHaveBeenCalled()
      vi.useRealTimers()
    })

    it('应该触发 update:visible 事件', async () => {
      const onUpdateVisible = vi.fn()
      const wrapper = createWrapper({ 
        'onUpdate:visible': onUpdateVisible,
      })
      
      await wrapper.vm.handleCancel()
      expect(onUpdateVisible).toHaveBeenCalledWith(false)
    })
  })

  describe('关闭和重置测试', () => {
    it('关闭应该重置所有状态', async () => {
      const wrapper = createWrapper()
      
      // 设置一些状态
      wrapper.vm.currentStep = 2
      wrapper.vm.formState.gradeGroup = 'primary'
      wrapper.vm.formState.count = 500
      wrapper.vm.formState.initialPassword = 'pass123'
      wrapper.vm.generatedAccounts = [{ username: 'test', password: 'pass' }]
      
      // 使用假计时器测试延迟重置
      vi.useFakeTimers()
      wrapper.vm.handleClose()
      vi.advanceTimersByTime(350)
      
      expect(wrapper.vm.currentStep).toBe(0)
      expect(wrapper.vm.formState.gradeGroup).toBeUndefined()
      expect(wrapper.vm.formState.count).toBe(300)
      expect(wrapper.vm.formState.initialPassword).toBe('')
      expect(wrapper.vm.generatedAccounts.length).toBe(0)
      
      vi.useRealTimers()
    })

    it('弹窗打开时应该重置到步骤1', async () => {
      const wrapper = createWrapper({ visible: false })
      wrapper.vm.currentStep = 2
      
      await wrapper.setProps({ visible: true })
      expect(wrapper.vm.currentStep).toBe(0)
    })
  })
})
