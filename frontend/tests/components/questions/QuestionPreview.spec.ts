import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import QuestionPreview from '@/components/questions/QuestionPreview.vue'
import { h } from 'vue'
import type { Question } from '@/types/api'

describe('QuestionPreview', () => {
  const mockQuestion: Partial<Question> = {
    id: 1,
    content: '这是一个测试题目',
    images: [],
    question_type: 'single_choice',
    options: [
      { label: 'A', content: '选项A' },
      { label: 'B', content: '选项B' },
      { label: 'C', content: '选项C' },
      { label: 'D', content: '选项D' },
    ],
    correct_answer: 'A',
    default_score: 5,
    difficulty: 'medium',
    answer_analysis: '这是答案解析',
    tags: ['数学', '代数'],
  }

  const createWrapper = (props = {}) => {
    return mount(QuestionPreview, {
      props: {
        question: mockQuestion,
        showAnswer: false,
        examMode: false,
        ...props,
      },
      global: {
        stubs: {
          CheckCircleFilled: {
            setup() {
              return () => h('span', { class: 'check-circle-icon' }, '✓')
            },
          },
          CheckOutlined: {
            setup() {
              return () => h('span', { class: 'check-icon' }, '✓')
            },
          },
          EditOutlined: {
            setup() {
              return () => h('span', { class: 'edit-icon' }, '✎')
            },
          },
          FileTextOutlined: {
            setup() {
              return () => h('span', { class: 'file-text-icon' }, '📄')
            },
          },
          InfoCircleOutlined: {
            setup() {
              return () => h('span', { class: 'info-icon' }, 'ℹ')
            },
          },
          TagOutlined: {
            setup() {
              return () => h('span', { class: 'tag-icon' }, '🏷')
            },
          },
          ADivider: true,
          AImage: {
            props: ['src', 'preview'],
            setup(props: any) {
              return () => h('img', { 
                class: 'question-image',
                src: props.src,
              })
            },
          },
          ATag: {
            props: ['color', 'size'],
            setup(props: any, { slots }: any) {
              return () => h('span', { 
                class: `ant-tag ant-tag-${props.color}`,
              }, slots.default?.())
            },
          },
          ASpace: {
            props: ['size', 'wrap'],
            setup(props: any, { slots }: any) {
              return () => h('div', { class: 'ant-space' }, slots.default?.())
            },
          },
        },
      },
    })
  }

  describe('渲染测试', () => {
    it('应该正确渲染组件', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.question-preview').exists()).toBe(true)
    })

    it('应该渲染题目头部', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.question-header').exists()).toBe(true)
    })

    it('应该渲染题目内容', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.question-content').exists()).toBe(true)
      expect(wrapper.find('.content-text').exists()).toBe(true)
    })

    it('考试模式应该有 exam-mode 类', () => {
      const wrapper = createWrapper({ examMode: true })
      expect(wrapper.find('.question-preview').classes()).toContain('exam-mode')
    })

    it('空题目应该正确处理', () => {
      const wrapper = createWrapper({ question: null })
      expect(wrapper.find('.question-preview').exists()).toBe(true)
    })
  })

  describe('题型标签测试', () => {
    it('应该显示单选题标签', () => {
      const wrapper = createWrapper({ question: { ...mockQuestion, question_type: 'single_choice' } })
      const typeTag = wrapper.find('.question-type-tag')
      expect(typeTag.text()).toBe('单选题')
    })

    it('应该显示多选题标签', () => {
      const wrapper = createWrapper({ question: { ...mockQuestion, question_type: 'multi_choice' } })
      const typeTag = wrapper.find('.question-type-tag')
      expect(typeTag.text()).toBe('多选题')
    })

    it('应该显示判断题标签', () => {
      const wrapper = createWrapper({ question: { ...mockQuestion, question_type: 'judgment' } })
      const typeTag = wrapper.find('.question-type-tag')
      expect(typeTag.text()).toBe('判断题')
    })

    it('应该显示主观题标签', () => {
      const wrapper = createWrapper({ question: { ...mockQuestion, question_type: 'subjective' } })
      const typeTag = wrapper.find('.question-type-tag')
      expect(typeTag.text()).toBe('主观题')
    })

    it('未知题型应该显示原值', () => {
      const wrapper = createWrapper({ question: { ...mockQuestion, question_type: 'unknown_type' } })
      const typeTag = wrapper.find('.question-type-tag')
      expect(typeTag.text()).toBe('unknown_type')
    })

    it('题型应该有对应的颜色', () => {
      const singleWrapper = createWrapper({ question: { ...mockQuestion, question_type: 'single_choice' } })
      expect(singleWrapper.vm.getTypeColor('single_choice')).toBe('#1890ff')

      const multiWrapper = createWrapper({ question: { ...mockQuestion, question_type: 'multi_choice' } })
      expect(multiWrapper.vm.getTypeColor('multi_choice')).toBe('#52c41a')

      const judgmentWrapper = createWrapper({ question: { ...mockQuestion, question_type: 'judgment' } })
      expect(judgmentWrapper.vm.getTypeColor('judgment')).toBe('#faad14')

      const subjectiveWrapper = createWrapper({ question: { ...mockQuestion, question_type: 'subjective' } })
      expect(subjectiveWrapper.vm.getTypeColor('subjective')).toBe('#722ed1')
    })
  })

  describe('分数显示测试', () => {
    it('应该显示题目分数', () => {
      const wrapper = createWrapper({ question: { ...mockQuestion, default_score: 10 } })
      const scoreEl = wrapper.find('.question-score')
      expect(scoreEl.exists()).toBe(true)
      expect(scoreEl.text()).toBe('10分')
    })

    it('没有分数时不应该显示分数元素', () => {
      const wrapper = createWrapper({ question: { ...mockQuestion, default_score: undefined } })
      const scoreEl = wrapper.find('.question-score')
      expect(scoreEl.exists()).toBe(false)
    })
  })

  describe('难度显示测试', () => {
    it('应该显示难度', () => {
      const wrapper = createWrapper({ question: { ...mockQuestion, difficulty: 'easy' } })
      const difficultyEl = wrapper.find('.question-difficulty')
      expect(difficultyEl.exists()).toBe(true)
    })

    it('应该显示简单难度', () => {
      const wrapper = createWrapper()
      expect(wrapper.vm.getDifficultyText('easy')).toBe('简单')
    })

    it('应该显示中等难度', () => {
      const wrapper = createWrapper()
      expect(wrapper.vm.getDifficultyText('medium')).toBe('中等')
    })

    it('应该显示困难难度', () => {
      const wrapper = createWrapper()
      expect(wrapper.vm.getDifficultyText('hard')).toBe('困难')
    })

    it('难度应该有对应的颜色类', () => {
      const wrapper = createWrapper({ question: { ...mockQuestion, difficulty: 'easy' } })
      const dot = wrapper.find('.difficulty-dot')
      expect(dot.classes()).toContain('easy')
    })
  })

  describe('单选题选项测试', () => {
    it('应该渲染单选题选项', () => {
      const wrapper = createWrapper({ question: mockQuestion })
      const options = wrapper.findAll('.options-list.single-choice .option-item')
      expect(options.length).toBe(4)
    })

    it('选项应该显示标签和内容', () => {
      const wrapper = createWrapper({ question: mockQuestion })
      const firstOption = wrapper.find('.options-list.single-choice .option-item')
      expect(firstOption.find('.option-label').text()).toBe('A.')
      expect(firstOption.find('.option-content').text()).toBe('选项A')
    })

    it('显示答案时应该标记正确答案', () => {
      const wrapper = createWrapper({ 
        question: mockQuestion, 
        showAnswer: true,
      })
      const correctOption = wrapper.findAll('.options-list.single-choice .option-item')[0]
      expect(correctOption.classes()).toContain('is-correct')
    })
  })

  describe('多选题选项测试', () => {
    const multiChoiceQuestion: Partial<Question> = {
      ...mockQuestion,
      question_type: 'multi_choice',
      correct_answer: 'AC',
      scoring_rules: {
        full_score: 5,
        partial_mode: 'per_option',
        partial_score: 2,
        wrong_score: 0,
      },
    }

    it('应该渲染多选题选项', () => {
      const wrapper = createWrapper({ question: multiChoiceQuestion })
      const options = wrapper.findAll('.options-list.multi-choice .option-item')
      expect(options.length).toBe(4)
    })

    it('显示答案时应该标记所有正确答案', () => {
      const wrapper = createWrapper({ 
        question: multiChoiceQuestion, 
        showAnswer: true,
      })
      const options = wrapper.findAll('.options-list.multi-choice .option-item')
      expect(options[0].classes()).toContain('is-correct') // A
      expect(options[1].classes()).not.toContain('is-correct') // B
      expect(options[2].classes()).toContain('is-correct') // C
    })

    it('显示答案时应该显示计分规则', () => {
      const wrapper = createWrapper({ 
        question: multiChoiceQuestion, 
        showAnswer: true,
      })
      const scoringHint = wrapper.find('.scoring-hint')
      expect(scoringHint.exists()).toBe(true)
      expect(scoringHint.text()).toContain('计分规则')
    })
  })

  describe('判断题选项测试', () => {
    const judgmentQuestion: Partial<Question> = {
      ...mockQuestion,
      question_type: 'judgment',
      correct_answer: 'A', // A表示正确
    }

    it('应该渲染判断题选项', () => {
      const wrapper = createWrapper({ question: judgmentQuestion })
      const options = wrapper.findAll('.options-list.judgment .option-item')
      expect(options.length).toBe(2)
    })

    it('应该显示正确和错误选项', () => {
      const wrapper = createWrapper({ question: judgmentQuestion })
      const options = wrapper.findAll('.options-list.judgment .option-content')
      expect(options[0].text()).toBe('正确')
      expect(options[1].text()).toBe('错误')
    })
  })

  describe('主观题测试', () => {
    const subjectiveQuestion: Partial<Question> = {
      ...mockQuestion,
      question_type: 'subjective',
    }

    it('应该渲染主观题答题区域', () => {
      const wrapper = createWrapper({ question: subjectiveQuestion })
      expect(wrapper.find('.subjective-area').exists()).toBe(true)
    })

    it('应该显示答题行', () => {
      const wrapper = createWrapper({ question: subjectiveQuestion })
      const lines = wrapper.findAll('.answer-line')
      expect(lines.length).toBe(5)
    })
  })

  describe('答案显示测试', () => {
    it('showAnswer为false时不显示答案', () => {
      const wrapper = createWrapper({ showAnswer: false })
      expect(wrapper.find('.answer-section').exists()).toBe(false)
    })

    it('showAnswer为true时显示答案', () => {
      const wrapper = createWrapper({ showAnswer: true })
      expect(wrapper.find('.answer-section').exists()).toBe(true)
    })

    it('应该显示正确答案', () => {
      const wrapper = createWrapper({ 
        question: mockQuestion,
        showAnswer: true,
      })
      const answerRow = wrapper.find('.answer-row')
      expect(answerRow.text()).toContain('正确答案')
      expect(answerRow.text()).toContain('A')
    })

    it('应该格式化多选题答案', () => {
      const wrapper = createWrapper()
      expect(wrapper.vm.formatAnswer('AC', 'multi_choice')).toBe('A、C')
    })

    it('应该格式化判断题答案', () => {
      const wrapper = createWrapper()
      expect(wrapper.vm.formatAnswer('A', 'judgment')).toBe('正确')
      expect(wrapper.vm.formatAnswer('B', 'judgment')).toBe('错误')
    })

    it('应该显示答案解析', () => {
      const wrapper = createWrapper({ 
        question: mockQuestion,
        showAnswer: true,
      })
      const analysis = wrapper.find('.analysis-content')
      expect(analysis.exists()).toBe(true)
      expect(analysis.text()).toContain('答案解析')
      expect(analysis.text()).toContain('这是答案解析')
    })
  })

  describe('图片显示测试', () => {
    const questionWithImages: Partial<Question> = {
      ...mockQuestion,
      images: ['image1.jpg', 'image2.jpg'],
    }

    it('应该显示题目图片', () => {
      const wrapper = createWrapper({ question: questionWithImages })
      const images = wrapper.findAll('.content-images .question-image')
      expect(images.length).toBe(2)
    })

    it('应该显示解析图片', () => {
      const questionWithAnalysisImages: Partial<Question> = {
        ...mockQuestion,
        analysis_images: ['analysis1.jpg', 'analysis2.jpg'],
      }
      const wrapper = createWrapper({ 
        question: questionWithAnalysisImages,
        showAnswer: true,
      })
      const images = wrapper.findAll('.analysis-images .analysis-image')
      expect(images.length).toBe(2)
    })
  })

  describe('标签显示测试', () => {
    it('应该显示题目标签', () => {
      const wrapper = createWrapper({ question: mockQuestion })
      const tagsSection = wrapper.find('.question-tags')
      expect(tagsSection.exists()).toBe(true)
    })

    it('应该渲染所有标签', () => {
      const wrapper = createWrapper({ question: mockQuestion })
      const tags = wrapper.findAll('.ant-tag')
      expect(tags.length).toBe(2)
    })

    it('没有标签时不应该显示标签区域', () => {
      const questionNoTags = { ...mockQuestion, tags: [] }
      const wrapper = createWrapper({ question: questionNoTags })
      const tagsSection = wrapper.find('.question-tags')
      expect(tagsSection.exists()).toBe(false)
    })
  })

  describe('内容格式化测试', () => {
    it('应该正确处理纯文本内容', () => {
      const wrapper = createWrapper()
      const formatted = wrapper.vm.formatContent('第一行\n第二行')
      expect(formatted).toBe('第一行<br>第二行')
    })

    it('应该保留HTML内容', () => {
      const wrapper = createWrapper()
      const htmlContent = '<p>段落</p><div>块</div>'
      const formatted = wrapper.vm.formatContent(htmlContent)
      expect(formatted).toBe(htmlContent)
    })

    it('应该处理空内容', () => {
      const wrapper = createWrapper()
      expect(wrapper.vm.formatContent('')).toBe('')
      expect(wrapper.vm.formatContent(undefined)).toBe('')
    })
  })

  describe('正确答案判断测试', () => {
    const multiQuestion: Partial<Question> = {
      ...mockQuestion,
      question_type: 'multi_choice',
      correct_answer: 'ACD',
    }

    it('应该正确判断多选题的正确答案', () => {
      const wrapper = createWrapper({ question: multiQuestion, showAnswer: true })
      expect(wrapper.vm.isCorrectAnswer('A')).toBe(true)
      expect(wrapper.vm.isCorrectAnswer('B')).toBe(false)
      expect(wrapper.vm.isCorrectAnswer('C')).toBe(true)
      expect(wrapper.vm.isCorrectAnswer('D')).toBe(true)
    })
  })
})
