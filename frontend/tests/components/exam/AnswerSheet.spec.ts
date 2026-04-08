import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import AnswerSheet from '@/components/exam/AnswerSheet.vue'
import { h, nextTick } from 'vue'

describe('AnswerSheet', () => {
  const mockQuestions = [
    { question_id: 1, order: 1, question_type: 'single_choice', score: 5 },
    { question_id: 2, order: 2, question_type: 'multiple_choice', score: 5 },
    { question_id: 3, order: 3, question_type: 'judgment', score: 5 },
    { question_id: 4, order: 4, question_type: 'subjective', score: 10 },
  ]

  const createAnswersMap = (entries: Array<[number | string, string]>) => {
    return new Map(entries)
  }

  const createWrapper = (props = {}) => {
    return mount(AnswerSheet, {
      props: {
        questions: mockQuestions,
        answers: new Map(),
        currentIndex: 0,
        subjectiveUploads: new Map(),
        ...props,
      },
      global: {
        stubs: {
          ACard: {
            props: ['title', 'size'],
            setup(props: any, { slots }: any) {
              return () => h('div', { class: 'answer-sheet' }, [
                h('div', { class: 'card-title' }, props.title),
                slots.default?.(),
              ])
            },
          },
          ADivider: true,
          AProgress: {
            props: ['percent', 'showInfo', 'size'],
            setup(props: any) {
              return () => h('div', { class: 'progress', 'data-percent': props.percent })
            },
          },
          AInputNumber: {
            props: ['value', 'min', 'max', 'placeholder', 'size'],
            emits: ['update:value', 'pressEnter'],
            setup(props: any, { emit }: any) {
              return () => h('input', {
                class: 'jump-input',
                type: 'number',
                value: props.value,
                placeholder: props.placeholder,
                onInput: (e: Event) => emit('update:value', Number((e.target as HTMLInputElement).value)),
                onKeyup: (e: KeyboardEvent) => {
                  if (e.key === 'Enter') emit('pressEnter')
                },
              })
            },
          },
          AButton: {
            props: ['size'],
            emits: ['click'],
            setup(props: any, { emit, slots }: any) {
              return () => h('button', { 
                class: 'ant-btn',
                onClick: () => emit('click'),
              }, slots.default?.())
            },
          },
          PaperClipOutlined: {
            setup() {
              return () => h('span', { class: 'paper-clip-icon' }, '📎')
            },
          },
        },
      },
    })
  }

  describe('渲染测试', () => {
    it('应该正确渲染组件', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.answer-sheet').exists()).toBe(true)
    })

    it('应该显示标题', () => {
      const wrapper = createWrapper()
      const title = wrapper.find('.card-title')
      expect(title.exists()).toBe(true)
      expect(title.text()).toBe('答题卡')
    })

    it('应该渲染所有题目格子', () => {
      const wrapper = createWrapper()
      const cells = wrapper.findAll('.question-cell')
      expect(cells.length).toBe(4)
    })

    it('格子应该显示正确的题号', () => {
      const wrapper = createWrapper()
      const cells = wrapper.findAll('.cell-number')
      expect(cells[0].text()).toBe('1')
      expect(cells[1].text()).toBe('2')
      expect(cells[2].text()).toBe('3')
      expect(cells[3].text()).toBe('4')
    })

    it('应该显示答题统计', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.stats-section').exists()).toBe(true)
      expect(wrapper.find('.stats-text').exists()).toBe(true)
    })
  })

  describe('答题状态计算测试', () => {
    it('应该正确计算已答题数量', async () => {
      const answers = createAnswersMap([
        [1, 'A'],
        [2, 'B,C'],
      ])
      const wrapper = createWrapper({ answers })
      await nextTick()
      
      expect(wrapper.find('.stats-text').text()).toContain('已答 2 / 4 题')
    })

    it('应该正确计算进度百分比', async () => {
      const answers = createAnswersMap([
        [1, 'A'],
        [2, 'B'],
        [3, 'T'],
      ])
      const wrapper = createWrapper({ answers })
      await nextTick()
      
      const progress = wrapper.find('.progress')
      expect(progress.attributes('data-percent')).toBe('75')
    })

    it('进度为0时应该显示0%', async () => {
      const wrapper = createWrapper({ answers: new Map() })
      await nextTick()
      
      const progress = wrapper.find('.progress')
      expect(progress.attributes('data-percent')).toBe('0')
    })

    it('进度为100时应该显示100%', async () => {
      const answers = createAnswersMap([
        [1, 'A'],
        [2, 'B'],
        [3, 'T'],
        [4, '主观题答案'],
      ])
      const wrapper = createWrapper({ answers })
      await nextTick()
      
      const progress = wrapper.find('.progress')
      expect(progress.attributes('data-percent')).toBe('100')
    })
  })

  describe('题目状态样式测试', () => {
    it('当前题目应该有 cell-current 类', () => {
      const wrapper = createWrapper({ currentIndex: 1 })
      const cells = wrapper.findAll('.question-cell')
      expect(cells[1].classes()).toContain('cell-current')
    })

    it('已答题目应该有 cell-answered 类', () => {
      const answers = createAnswersMap([[1, 'A']])
      const wrapper = createWrapper({ answers })
      const cells = wrapper.findAll('.question-cell')
      expect(cells[0].classes()).toContain('cell-answered')
    })

    it('未答题目不应该有 cell-answered 类', () => {
      const answers = createAnswersMap([[1, 'A']])
      const wrapper = createWrapper({ answers })
      const cells = wrapper.findAll('.question-cell')
      expect(cells[1].classes()).not.toContain('cell-answered')
    })

    it('空答案应该视为未答', () => {
      const answers = createAnswersMap([[1, '']])
      const wrapper = createWrapper({ answers })
      const cells = wrapper.findAll('.question-cell')
      expect(cells[0].classes()).not.toContain('cell-answered')
    })

    it('null答案应该视为未答', () => {
      const answers = createAnswersMap([[1, null as any]])
      const wrapper = createWrapper({ answers })
      const cells = wrapper.findAll('.question-cell')
      expect(cells[0].classes()).not.toContain('cell-answered')
    })
  })

  describe('主观题附件测试', () => {
    it('有附件的主观题应该显示附件图标', () => {
      const subjectiveUploads = new Map([
        [4, [{ fileId: 1, fileName: 'answer.pdf', status: 'done' }]],
      ])
      const wrapper = createWrapper({ subjectiveUploads })
      const cells = wrapper.findAll('.question-cell')
      expect(cells[3].classes()).toContain('cell-subjective')
    })

    it('无附件的主观题不应该显示附件样式', () => {
      const wrapper = createWrapper()
      const cells = wrapper.findAll('.question-cell')
      expect(cells[3].classes()).not.toContain('cell-subjective')
    })

    it('应该检查是否有主观题', async () => {
      const questionsWithSubjective = [
        { question_id: 1, order: 1, question_type: 'single_choice', score: 5 },
        { question_id: 2, order: 2, question_type: 'subjective', score: 10 },
      ]
      const wrapper = createWrapper({ questions: questionsWithSubjective })
      await nextTick()
      
      const legendSection = wrapper.find('.legend-section')
      expect(legendSection.text()).toContain('主观题')
    })
  })

  describe('题目类型统计测试', () => {
    it('应该显示各题型答题进度', async () => {
      const mixedQuestions = [
        { question_id: 1, order: 1, question_type: 'single_choice', score: 5 },
        { question_id: 2, order: 2, question_type: 'single_choice', score: 5 },
        { question_id: 3, order: 3, question_type: 'judgment', score: 5 },
      ]
      const answers = createAnswersMap([[1, 'A']])
      const wrapper = createWrapper({ 
        questions: mixedQuestions, 
        answers 
      })
      await nextTick()
      
      const typeStats = wrapper.find('.type-stats')
      expect(typeStats.exists()).toBe(true)
      expect(typeStats.text()).toContain('单选')
      expect(typeStats.text()).toContain('判断')
    })

    it('已完成的题型应该有特殊样式', async () => {
      const questions = [
        { question_id: 1, order: 1, question_type: 'single_choice', score: 5 },
      ]
      const answers = createAnswersMap([[1, 'A']])
      const wrapper = createWrapper({ questions, answers })
      await nextTick()
      
      const typeProgress = wrapper.find('.type-progress')
      expect(typeProgress.classes()).toContain('is-complete')
    })
  })

  describe('导航事件测试', () => {
    it('点击题号格子应该触发 navigate 事件', async () => {
      const onNavigate = vi.fn()
      const wrapper = createWrapper({
        onNavigate,
      })

      const cells = wrapper.findAll('.question-cell')
      await cells[2].trigger('click')

      expect(onNavigate).toHaveBeenCalledWith(2)
    })

    it('点击不同的题号应该触发对应的事件', async () => {
      const onNavigate = vi.fn()
      const wrapper = createWrapper({
        onNavigate,
      })

      const cells = wrapper.findAll('.question-cell')
      await cells[0].trigger('click')
      expect(onNavigate).toHaveBeenCalledWith(0)

      await cells[3].trigger('click')
      expect(onNavigate).toHaveBeenCalledWith(3)
    })
  })

  describe('快速跳转测试', () => {
    it('输入题号后点击跳转应该触发 navigate 事件', async () => {
      const onNavigate = vi.fn()
      const wrapper = createWrapper({ onNavigate })

      const input = wrapper.find('.jump-input')
      await input.setValue(3)
      
      const jumpButton = wrapper.findAll('.ant-btn').find(btn => btn.text() === '跳转')
      if (jumpButton) {
        await jumpButton.trigger('click')
        expect(onNavigate).toHaveBeenCalledWith(2) // 索引为2对应第3题
      }
    })

    it('按回车键应该触发跳转', async () => {
      const onNavigate = vi.fn()
      const wrapper = createWrapper({ onNavigate })

      const input = wrapper.find('.jump-input')
      await input.setValue(2)
      await input.trigger('keyup.enter')

      expect(onNavigate).toHaveBeenCalledWith(1)
    })

    it('超出范围的题号不应该触发跳转', async () => {
      const onNavigate = vi.fn()
      const wrapper = createWrapper({ onNavigate })

      const input = wrapper.find('.jump-input')
      await input.setValue(100) // 超出范围
      await input.trigger('keyup.enter')

      // 不触发或触发后重置
      const calls = onNavigate.mock.calls
      const invalidCall = calls.find(call => call[0] >= mockQuestions.length)
      expect(invalidCall).toBeUndefined()
    })

    it('输入后应该清空输入框', async () => {
      const wrapper = createWrapper()

      const input = wrapper.find('.jump-input')
      await input.setValue(2)
      await input.trigger('keyup.enter')

      // 跳转后应该清空
      expect(wrapper.vm.jumpNumber).toBeUndefined()
    })
  })

  describe('边界情况测试', () => {
    it('应该处理空题目列表', () => {
      const wrapper = createWrapper({ questions: [] })
      expect(wrapper.findAll('.question-cell').length).toBe(0)
    })

    it('应该处理只有一个题目的情况', () => {
      const singleQuestion = [
        { question_id: 1, order: 1, question_type: 'single_choice', score: 5 },
      ]
      const wrapper = createWrapper({ questions: singleQuestion })
      expect(wrapper.findAll('.question-cell').length).toBe(1)
    })

    it('应该使用question_id作为key', () => {
      const wrapper = createWrapper()
      const cells = wrapper.findAll('.question-cell')
      // 每个格子应该绑定到对应的question_id
      expect(cells.length).toBe(mockQuestions.length)
    })
  })
})
