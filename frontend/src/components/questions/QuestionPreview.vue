<template>
  <div class="question-preview" :class="{ 'exam-mode': examMode }">
    <!-- 题目头部 -->
    <div class="question-header">
      <div class="question-type-tag" :style="{ backgroundColor: getTypeColor(question?.question_type) }">
        {{ getTypeText(question?.question_type) }}
      </div>
      <div class="question-score" v-if="question?.default_score">
        {{ question.default_score }}分
      </div>
      <div class="question-difficulty" v-if="question?.difficulty">
        <span class="difficulty-dot" :class="question.difficulty"></span>
        {{ getDifficultyText(question.difficulty) }}
      </div>
    </div>

    <!-- 题目内容 -->
    <div class="question-content">
      <div class="content-text" v-html="formatContent(question?.content)"></div>
      
      <!-- 题目图片 -->
      <div v-if="question?.images?.length" class="content-images">
        <a-image
          v-for="(img, index) in question.images"
          :key="index"
          :src="img"
          :preview="{ src: img }"
          class="question-image"
        />
      </div>
    </div>

    <!-- 单选题选项 -->
    <div v-if="question?.question_type === 'single_choice' && question?.options?.length" class="options-list single-choice">
      <div 
        v-for="option in question.options" 
        :key="option.label"
        class="option-item"
        :class="{ 'is-correct': showAnswer && question.correct_answer === option.label }"
      >
        <div class="option-radio">
          <div class="radio-circle" :class="{ 'checked': showAnswer && question.correct_answer === option.label }"></div>
        </div>
        <div class="option-label">{{ option.label }}.</div>
        <div class="option-content" v-html="formatContent(option.content)"></div>
        <CheckCircleFilled v-if="showAnswer && question.correct_answer === option.label" class="correct-icon" />
      </div>
    </div>

    <!-- 多选题选项 -->
    <div v-if="question?.question_type === 'multi_choice' && question?.options?.length" class="options-list multi-choice">
      <div 
        v-for="option in question.options" 
        :key="option.label"
        class="option-item"
        :class="{ 'is-correct': showAnswer && isCorrectAnswer(option.label) }"
      >
        <div class="option-checkbox">
          <div class="checkbox-box" :class="{ 'checked': showAnswer && isCorrectAnswer(option.label) }">
            <CheckOutlined v-if="showAnswer && isCorrectAnswer(option.label)" class="check-icon" />
          </div>
        </div>
        <div class="option-label">{{ option.label }}.</div>
        <div class="option-content">{{ option.content }}</div>
      </div>
      
      <!-- 多选题评分规则提示 -->
      <div v-if="showAnswer && question.scoring_rules" class="scoring-hint">
        <InfoCircleOutlined /> 
        计分规则：全对 {{ question.scoring_rules.full_score }} 分；
        少选 {{ question.scoring_rules.partial_mode === 'per_option' ? '按比例' : '得 ' + question.scoring_rules.partial_score + ' 分' }}；
        错选 {{ question.scoring_rules.wrong_score }} 分
      </div>
    </div>

    <!-- 判断题选项 -->
    <div v-if="question?.question_type === 'judgment'" class="options-list judgment">
      <div 
        class="option-item"
        :class="{ 'is-correct': showAnswer && question.correct_answer === 'A' }"
      >
        <div class="option-radio">
          <div class="radio-circle" :class="{ 'checked': showAnswer && question.correct_answer === 'A' }"></div>
        </div>
        <div class="option-content">正确</div>
      </div>
      <div 
        class="option-item"
        :class="{ 'is-correct': showAnswer && question.correct_answer === 'B' }"
      >
        <div class="option-radio">
          <div class="radio-circle" :class="{ 'checked': showAnswer && question.correct_answer === 'B' }"></div>
        </div>
        <div class="option-content">错误</div>
      </div>
    </div>

    <!-- 主观题答题区域 -->
    <div v-if="question?.question_type === 'subjective'" class="subjective-area">
      <div class="answer-placeholder">
        <EditOutlined /> 答题区域（学生作答）
      </div>
      <div class="answer-lines">
        <div v-for="i in 5" :key="i" class="answer-line"></div>
      </div>
    </div>

    <!-- 答案和解析 -->
    <div v-if="showAnswer" class="answer-section">
      <a-divider />
      
      <!-- 正确答案 -->
      <div class="answer-row">
        <span class="answer-label">正确答案：</span>
        <span class="answer-value correct">{{ formatAnswer(question?.correct_answer, question?.question_type) }}</span>
      </div>
      
      <!-- 答案解析 -->
      <div v-if="question?.answer_analysis" class="analysis-content">
        <div class="analysis-label">
          <FileTextOutlined /> 答案解析：
        </div>
        <div class="analysis-text" v-html="formatContent(question.answer_analysis)"></div>
        
        <!-- 解析图片 -->
        <div v-if="question.analysis_images?.length" class="analysis-images">
          <a-image
            v-for="(img, index) in question.analysis_images"
            :key="index"
            :src="img"
            :preview="{ src: img }"
            class="analysis-image"
          />
        </div>
      </div>
    </div>

    <!-- 标签 -->
    <div v-if="question?.tags?.length" class="question-tags">
      <TagOutlined />
      <a-space size="small" wrap>
        <a-tag v-for="tag in question.tags" :key="tag" size="small" color="blue">
          {{ tag }}
        </a-tag>
      </a-space>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  CheckCircleFilled,
  CheckOutlined,
  EditOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  TagOutlined,
} from '@ant-design/icons-vue'
import type { Question } from '@/types/api'
import katex from 'katex'
import 'katex/dist/katex.min.css'

// ── Props ──
interface Props {
  question?: Partial<Question> | null
  showAnswer?: boolean
  examMode?: boolean // 考试模式：简化显示
}

const props = withDefaults(defineProps<Props>(), {
  showAnswer: false,
  examMode: false,
})

// ── 工具函数 ──

// 获取题型文本
function getTypeText(type?: string): string {
  if (!type) return '未知'
  const textMap: Record<string, string> = {
    single_choice: '单选题',
    multi_choice: '多选题',
    judgment: '判断题',
    subjective: '主观题',
  }
  return textMap[type] || type
}

// 获取题型颜色
function getTypeColor(type?: string): string {
  if (!type) return '#999'
  const colorMap: Record<string, string> = {
    single_choice: '#1890ff',
    multi_choice: '#52c41a',
    judgment: '#faad14',
    subjective: '#722ed1',
  }
  return colorMap[type] || '#999'
}

// 获取难度文本
function getDifficultyText(difficulty?: string): string {
  if (!difficulty) return ''
  const textMap: Record<string, string> = {
    easy: '简单',
    medium: '中等',
    hard: '困难',
  }
  return textMap[difficulty] || difficulty
}

// 渲染 LaTeX 公式
function renderLatex(content: string): string {
  // 处理块级公式 $$...$$
  let result = content.replace(/\$\$([\s\S]+?)\$\$/g, (match, formula) => {
    try {
      return katex.renderToString(formula.trim(), {
        throwOnError: false,
        displayMode: true,
      })
    } catch (e) {
      console.error('KaTeX render error:', e)
      return match
    }
  })

  // 处理行内公式 $...$
  result = result.replace(/\$([^$\n]+?)\$/g, (match, formula) => {
    try {
      return katex.renderToString(formula.trim(), {
        throwOnError: false,
        displayMode: false,
      })
    } catch (e) {
      console.error('KaTeX render error:', e)
      return match
    }
  })

  return result
}

// 格式化内容（处理HTML和公式）
function formatContent(content?: string): string {
  if (!content) return ''

  // 先渲染 LaTeX 公式
  let result = renderLatex(content)

  // 如果内容不是HTML（不包含<标签>），将换行符转换为<br>
  if (!result.includes('<') || result.includes('<br')) {
    result = result.replace(/\n/g, '<br>')
  }

  return result
}

// 格式化答案显示
function formatAnswer(answer?: string | null, type?: string): string {
  if (!answer) return '无'
  
  if (type === 'judgment') {
    return answer === 'A' ? '正确' : '错误'
  }
  
  // 多选题：将连在一起的答案分开显示
  if (type === 'multi_choice' && answer.length > 1) {
    return answer.split('').join('、')
  }
  
  return answer
}

// 判断是否是正确答案（多选题）
function isCorrectAnswer(optionLabel: string): boolean {
  if (!props.question?.correct_answer) return false
  return props.question.correct_answer.includes(optionLabel)
}
</script>

<style scoped lang="less">
.question-preview {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  
  &.exam-mode {
    padding: 12px;
    
    .question-header {
      margin-bottom: 12px;
    }
    
    .question-content {
      margin-bottom: 16px;
    }
  }
}

// 题目头部
.question-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  
  .question-type-tag {
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    color: #fff;
    font-weight: 500;
  }
  
  .question-score {
    padding: 2px 8px;
    background: #fff2f0;
    color: #f5222d;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
  }
  
  .question-difficulty {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: #8c8c8c;
    
    .difficulty-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      
      &.easy { background: #52c41a; }
      &.medium { background: #faad14; }
      &.hard { background: #f5222d; }
    }
  }
}

// 题目内容
.question-content {
  margin-bottom: 20px;
  
  .content-text {
    font-size: 15px;
    line-height: 1.8;
    color: #262626;

    // KaTeX 公式样式
    :deep(.katex) {
      font-size: 1.1em;
    }

    :deep(.katex-display) {
      margin: 1em 0;
      overflow-x: auto;
      overflow-y: hidden;
    }

    // 处理代码块
    :deep(code:not(.katex code)) {
      background: #f5f5f5;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: monospace;
      font-size: 13px;
    }

    :deep(pre) {
      background: #f5f5f5;
      padding: 12px;
      border-radius: 4px;
      overflow-x: auto;

      code {
        background: none;
        padding: 0;
      }
    }
  }
  
  .content-images {
    margin-top: 12px;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    
    .question-image {
      max-width: 100%;
      max-height: 200px;
      border-radius: 4px;
      cursor: pointer;
    }
  }
}

// 选项列表
.options-list {
  .option-item {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 12px 16px;
    margin-bottom: 8px;
    border-radius: 8px;
    border: 1px solid #f0f0f0;
    background: #fafafa;
    cursor: pointer;
    transition: all 0.3s;
    position: relative;
    
    &:hover {
      border-color: #d9d9d9;
      background: #f5f5f5;
    }
    
    &.is-correct {
      border-color: #52c41a;
      background: #f6ffed;
    }
    
    .option-radio,
    .option-checkbox {
      flex-shrink: 0;
      
      .radio-circle {
        width: 18px;
        height: 18px;
        border: 2px solid #d9d9d9;
        border-radius: 50%;
        transition: all 0.3s;
        
        &.checked {
          border-color: #52c41a;
          background: #52c41a;
          position: relative;
          
          &::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 6px;
            height: 6px;
            background: white;
            border-radius: 50%;
          }
        }
      }
      
      .checkbox-box {
        width: 18px;
        height: 18px;
        border: 2px solid #d9d9d9;
        border-radius: 3px;
        transition: all 0.3s;
        display: flex;
        align-items: center;
        justify-content: center;
        
        &.checked {
          border-color: #52c41a;
          background: #52c41a;
        }
        
        .check-icon {
          color: white;
          font-size: 12px;
        }
      }
    }
    
    .option-label {
      font-weight: 500;
      color: #262626;
      min-width: 20px;
      flex-shrink: 0;
    }
    
    .option-content {
      flex: 1;
      color: #595959;
      line-height: 1.5;

      :deep(.katex) {
        font-size: 1em;
      }

      :deep(.katex-display) {
        margin: 0.5em 0;
      }
    }
    
    .correct-icon {
      color: #52c41a;
      font-size: 18px;
      flex-shrink: 0;
    }
  }
  
  .scoring-hint {
    margin-top: 12px;
    padding: 8px 12px;
    background: #e6f7ff;
    border-radius: 4px;
    font-size: 12px;
    color: #1890ff;
    
    .anticon {
      margin-right: 4px;
    }
  }
}

// 主观题答题区域
.subjective-area {
  margin-top: 16px;
  
  .answer-placeholder {
    color: #8c8c8c;
    font-size: 13px;
    margin-bottom: 8px;
    
    .anticon {
      margin-right: 4px;
    }
  }
  
  .answer-lines {
    .answer-line {
      height: 40px;
      border-bottom: 1px dashed #d9d9d9;
      
      &:last-child {
        border-bottom-style: solid;
      }
    }
  }
}

// 答案区域
.answer-section {
  margin-top: 20px;
  
  .answer-row {
    margin-bottom: 12px;
    
    .answer-label {
      color: #8c8c8c;
      font-size: 14px;
    }
    
    .answer-value {
      font-weight: 500;
      font-size: 14px;
      
      &.correct {
        color: #52c41a;
      }
    }
  }
  
  .analysis-content {
    background: #f6ffed;
    border-radius: 8px;
    padding: 16px;
    margin-top: 12px;
    
    .analysis-label {
      font-weight: 500;
      color: #52c41a;
      margin-bottom: 8px;
      
      .anticon {
        margin-right: 4px;
      }
    }
    
    .analysis-text {
      color: #262626;
      line-height: 1.8;
      font-size: 14px;
    }
    
    .analysis-images {
      margin-top: 12px;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      
      .analysis-image {
        max-width: 100%;
        max-height: 150px;
        border-radius: 4px;
        cursor: pointer;
      }
    }
  }
}

// 标签
.question-tags {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed #f0f0f0;
  display: flex;
  align-items: center;
  gap: 8px;
  
  .anticon {
    color: #8c8c8c;
  }
}
</style>
