<template>
  <div class="question-form">
    <a-form
      ref="formRef"
      :model="formState"
      :rules="formRules"
      layout="vertical"
      @finish="handleSubmit"
    >
      <!-- 题型选择 -->
      <a-form-item label="题目类型" name="question_type">
        <a-radio-group 
          v-model:value="formState.question_type" 
          button-style="solid"
          @change="handleTypeChange"
        >
          <a-radio-button value="single_choice">
            <CheckCircleOutlined /> 单选题
          </a-radio-button>
          <a-radio-button value="multi_choice">
            <CheckSquareOutlined /> 多选题
          </a-radio-button>
          <a-radio-button value="judgment">
            <QuestionCircleOutlined /> 判断题
          </a-radio-button>
          <a-radio-button value="subjective">
            <EditOutlined /> 主观题
          </a-radio-button>
        </a-radio-group>
      </a-form-item>

      <!-- 题目内容 -->
      <a-form-item label="题目内容" name="content">
        <div class="rich-editor">
          <a-textarea
            v-model:value="formState.content"
            placeholder="请输入题目内容，支持 LaTeX 公式，如 $x^2$, $\sqrt{2}$, $\frac{1}{2}$"
            :rows="4"
            class="content-editor"
          />
        </div>
        <!-- LaTeX 公式语法提示 -->
        <div class="latex-hint">
          <span class="hint-title">LaTeX 公式语法示例：</span>
          <a-space size="small" wrap>
            <a-tag size="small" @click="insertLatex('x^2')">$x^2$ 平方</a-tag>
            <a-tag size="small" @click="insertLatex('x_1')">$x_1$ 下标</a-tag>
            <a-tag size="small" @click="insertLatex('\\sqrt{x}')">$\sqrt{x}$ 开方</a-tag>
            <a-tag size="small" @click="insertLatex('\\frac{1}{2}')">$\frac{1}{2}$ 分式</a-tag>
            <a-tag size="small" @click="insertLatex('\\sum_{i=1}^{n}')">$\sum_{i=1}^{n}$ 求和</a-tag>
            <a-tag size="small" @click="insertLatex('\\int_{0}^{1}')">$\int_{0}^{1}$ 积分</a-tag>
            <a-tag size="small" @click="insertLatex('\\pi')">$\pi$ 圆周率</a-tag>
            <a-tag size="small" @click="insertLatex('\\alpha \\beta \\gamma')">$\alpha \beta \gamma$ 希腊字母</a-tag>
          </a-space>
        </div>
      </a-form-item>

      <!-- 题目图片 -->
      <a-form-item label="题目图片" extra="支持上传多张图片，每张不超过 5MB">
        <a-upload
          v-model:file-list="contentImageList"
          list-type="picture-card"
          :before-upload="beforeUpload"
          :custom-request="customUpload"
          @preview="handlePreview"
          @remove="handleImageRemove"
        >
          <div v-if="contentImageList.length < 5">
            <PlusOutlined />
            <div style="margin-top: 8px">上传</div>
          </div>
        </a-upload>
      </a-form-item>

      <!-- 实时预览开关 -->
      <a-form-item>
        <a-switch 
          v-model:checked="showLivePreview" 
          checked-children="开启实时预览"
          un-checked-children="关闭实时预览"
        />
      </a-form-item>

      <!-- 实时预览 -->
      <div v-if="showLivePreview" class="live-preview-section">
        <div class="preview-title">题目预览</div>
        <div class="preview-content">
          <QuestionPreview :question="previewQuestion" :show-answer="false" />
        </div>
      </div>

      <a-divider />

      <!-- 选项编辑区域 - 单选题/多选题 -->
      <template v-if="['single_choice', 'multi_choice'].includes(formState.question_type)">
        <a-form-item 
          label="选项设置" 
          :required="true"
          :validate-status="optionsError ? 'error' : ''"
          :help="optionsError"
        >
          <div class="options-list">
            <div 
              v-for="(option, index) in formState.options" 
              :key="index"
              class="option-item"
            >
              <div class="option-label">{{ option.label }}.</div>
              <a-input
                v-model:value="option.content"
                :placeholder="`选项 ${option.label} 内容`"
                class="option-input"
              />
              <a-button 
                type="text" 
                danger 
                size="small"
                :disabled="formState.options.length <= 2"
                @click="removeOption(index)"
              >
                <DeleteOutlined />
              </a-button>
            </div>
          </div>
          <a-button v-if="formState.options.length < 8" type="dashed" block @click="addOption">
            <PlusOutlined /> 添加选项
          </a-button>
        </a-form-item>

        <!-- 正确答案选择 -->
        <a-form-item label="正确答案" name="correct_answer" required>
          <!-- 单选题 -->
          <a-radio-group 
            v-if="formState.question_type === 'single_choice'"
            v-model:value="formState.correct_answer"
          >
            <a-radio 
              v-for="option in formState.options" 
              :key="option.label" 
              :value="option.label"
            >
              {{ option.label }}. {{ option.content || '(空)' }}
            </a-radio>
          </a-radio-group>
          
          <!-- 多选题 -->
          <a-checkbox-group 
            v-else
            v-model:value="multiCorrectAnswers"
            @change="handleMultiAnswerChange"
          >
            <a-checkbox 
              v-for="option in formState.options" 
              :key="option.label" 
              :value="option.label"
            >
              {{ option.label }}. {{ option.content || '(空)' }}
            </a-checkbox>
          </a-checkbox-group>
        </a-form-item>
      </template>

      <!-- 判断题选项 -->
      <template v-if="formState.question_type === 'judgment'">
        <a-form-item label="正确答案" name="correct_answer" required>
          <a-radio-group v-model:value="formState.correct_answer">
            <a-radio value="A">正确</a-radio>
            <a-radio value="B">错误</a-radio>
          </a-radio-group>
        </a-form-item>
      </template>

      <!-- 多选题评分规则配置 -->
      <template v-if="formState.question_type === 'multi_choice'">
        <a-divider />
        <div class="scoring-rules-section">
          <div class="section-title">
            <CalculatorOutlined /> 评分规则配置
          </div>
          <a-row :gutter="16">
            <a-col :span="8">
              <a-form-item label="全对得分" name="scoring_rules.full_score">
                <a-input-number
                  v-model:value="formState.scoring_rules.full_score"
                  :min="0.5"
                  :max="100"
                  :step="0.5"
                  style="width: 100%"
                  addon-after="分"
                />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="少选得分" name="scoring_rules.partial_score">
                <a-input-number
                  v-model:value="formState.scoring_rules.partial_score"
                  :min="0"
                  :max="100"
                  :step="0.5"
                  style="width: 100%"
                  addon-after="分"
                />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="错选得分" name="scoring_rules.wrong_score">
                <a-input-number
                  v-model:value="formState.scoring_rules.wrong_score"
                  :min="0"
                  :max="100"
                  :step="0.5"
                  style="width: 100%"
                  addon-after="分"
                />
              </a-form-item>
            </a-col>
          </a-row>
          <a-form-item label="计分模式" name="scoring_rules.partial_mode">
            <a-radio-group v-model:value="formState.scoring_rules.partial_mode">
              <a-radio value="per_option">
                <span class="radio-label">按选项计分</span>
                <span class="radio-desc">每选对1个选项得对应分数，选错不得分</span>
              </a-radio>
              <a-radio value="fixed">
                <span class="radio-label">固定计分</span>
                <span class="radio-desc">少选时按固定分数计分，不按选项数量计算</span>
              </a-radio>
            </a-radio-group>
          </a-form-item>
          
          <!-- 规则说明 -->
          <a-alert
            :message="scoringRuleDescription"
            type="info"
            show-icon
            class="rule-alert"
          />
        </div>
      </template>

      <!-- 默认分值 -->
      <a-form-item label="默认分值" name="default_score" v-if="formState.question_type !== 'multi_choice'">
        <a-input-number
          v-model:value="formState.default_score"
          :min="0.5"
          :max="100"
          :step="0.5"
          style="width: 200px"
          addon-after="分"
        />
      </a-form-item>

      <a-divider />

      <!-- 答案解析 -->
      <div class="analysis-section">
        <div class="section-title">
          <FileTextOutlined /> 答案解析
        </div>
        <a-form-item label="解析内容" name="answer_analysis">
          <a-textarea
            v-model:value="formState.answer_analysis"
            placeholder="请输入答案解析（选填）"
            :rows="4"
          />
        </a-form-item>
        
        <!-- 解析图片 -->
        <a-form-item label="解析图片" extra="支持上传多张图片">
          <a-upload
            v-model:file-list="analysisImageList"
            list-type="picture-card"
            :before-upload="beforeUpload"
            :custom-request="customUpload"
            @preview="handlePreview"
          >
            <div v-if="analysisImageList.length < 5">
              <PlusOutlined />
              <div style="margin-top: 8px">上传</div>
            </div>
          </a-upload>
        </a-form-item>
      </div>

      <a-divider />

      <!-- 标签和难度 -->
      <a-row :gutter="16">
        <a-col :span="12">
          <a-form-item label="难度等级" name="difficulty">
            <a-radio-group v-model:value="formState.difficulty">
              <a-radio-button value="easy">
                <span class="difficulty-dot easy"></span> 简单
              </a-radio-button>
              <a-radio-button value="medium">
                <span class="difficulty-dot medium"></span> 中等
              </a-radio-button>
              <a-radio-button value="hard">
                <span class="difficulty-dot hard"></span> 困难
              </a-radio-button>
            </a-radio-group>
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="知识点标签" name="tags">
            <a-select
              v-model:value="formState.tags"
              mode="tags"
              placeholder="输入标签后按回车确认"
              :token-separators="[',']"
              style="width: 100%"
            >
              <a-select-option v-for="tag in commonTags" :key="tag" :value="tag">
                {{ tag }}
              </a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
      </a-row>

      <!-- 提交按钮 -->
      <a-form-item class="form-actions">
        <a-space>
          <a-button type="primary" html-type="submit" :loading="submitting">
            <SaveOutlined /> {{ isEditing ? '保存修改' : '添加题目' }}
          </a-button>
          <a-button @click="handleCancel">
            <CloseOutlined /> 取消
          </a-button>
          <a-button v-if="!isEditing" @click="handleSubmitAndAdd">
            <PlusOutlined /> 保存并继续添加
          </a-button>
        </a-space>
      </a-form-item>
    </a-form>

    <!-- 图片预览 -->
    <a-image
      :style="{ display: 'none' }"
      :preview="{
        visible: previewVisible,
        onVisibleChange: (visible: boolean) => previewVisible = visible,
        src: previewImage,
      }"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import type { FormInstance, UploadFile } from 'ant-design-vue'
import {
  PlusOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CheckSquareOutlined,
  QuestionCircleOutlined,
  EditOutlined,
  CalculatorOutlined,
  FileTextOutlined,
  SaveOutlined,
  CloseOutlined,
} from '@ant-design/icons-vue'
import type { Question, QuestionOption } from '@/types/api'
import QuestionPreview from './QuestionPreview.vue'

// ── Props & Emits ──
interface Props {
  initialData?: Partial<Question>
  questionBankId: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  submit: [values: any]
  cancel: []
}>()

// ── 状态定义 ──
const formRef = ref<FormInstance>()
const submitting = ref(false)
const showLivePreview = ref(false)
const previewVisible = ref(false)
const previewImage = ref('')

// 题目图片列表
const contentImageList = ref<UploadFile[]>([])
// 解析图片列表
const analysisImageList = ref<UploadFile[]>([])

// 多选题正确答案（数组形式）
const multiCorrectAnswers = ref<string[]>([])

// 常用标签
const commonTags = ['代数', '几何', '函数', '方程', '统计', '概率', '数列', '三角函数', '导数', '积分']

// 表单状态
const formState = reactive({
  question_type: 'single_choice' as string,
  content: '',
  images: [] as string[],
  options: [
    { label: 'A', content: '' },
    { label: 'B', content: '' },
    { label: 'C', content: '' },
    { label: 'D', content: '' },
  ] as QuestionOption[],
  correct_answer: '' as string,
  scoring_rules: {
    full_score: 4,
    partial_score: 2,
    wrong_score: 0,
    partial_mode: 'per_option' as 'per_option' | 'fixed',
  },
  default_score: 3,
  answer_analysis: '',
  analysis_images: [] as string[],
  tags: [] as string[],
  difficulty: 'medium' as string,
})

// 是否是编辑模式
const isEditing = computed(() => !!props.initialData?.id)

// 选项验证错误
const optionsError = computed(() => {
  const emptyOptions = formState.options.filter(o => !o.content.trim())
  if (emptyOptions.length > 0) {
    return `选项 ${emptyOptions.map(o => o.label).join(', ')} 内容不能为空`
  }
  return ''
})

// 评分规则描述
const scoringRuleDescription = computed(() => {
  const { full_score, partial_score, partial_mode } = formState.scoring_rules
  if (partial_mode === 'per_option') {
    return `计分规则：全对得 ${full_score} 分；少选时每选对1个选项得 ${(partial_score / Math.max(1, multiCorrectAnswers.value.length || 2)).toFixed(2)} 分；错选/多选得 0 分`
  } else {
    return `计分规则：全对得 ${full_score} 分；少选（但未错选）得 ${partial_score} 分；错选/多选得 0 分`
  }
})

// 预览题目数据
const previewQuestion = computed<Partial<Question>>(() => ({
  id: 0,
  content: formState.content,
  images: formState.images,
  question_type: formState.question_type,
  options: formState.options.filter(o => o.content.trim()),
  correct_answer: formState.correct_answer,
  difficulty: formState.difficulty,
  default_score: formState.question_type === 'multi_choice' 
    ? formState.scoring_rules.full_score 
    : formState.default_score,
  tags: formState.tags,
}))

// ── 表单验证规则 ──
const formRules = {
  question_type: [{ required: true, message: '请选择题型', trigger: 'change' }],
  content: [
    { required: true, message: '请输入题目内容', trigger: 'blur' },
    { min: 2, message: '题目内容至少2个字符', trigger: 'blur' },
  ],
  correct_answer: [{ required: true, message: '请选择正确答案', trigger: 'change' }],
  difficulty: [{ required: true, message: '请选择难度', trigger: 'change' }],
}

// ── 方法定义 ──

// 题型切换处理
function handleTypeChange() {
  const type = formState.question_type
  
  // 重置正确答案
  formState.correct_answer = ''
  multiCorrectAnswers.value = []
  
  // 根据题型初始化选项
  if (type === 'single_choice') {
    if (formState.options.length < 4) {
      // 确保有4个选项
      while (formState.options.length < 4) {
        addOption()
      }
    }
    formState.default_score = 3
  } else if (type === 'multi_choice') {
    if (formState.options.length < 4) {
      while (formState.options.length < 4) {
        addOption()
      }
    }
    formState.scoring_rules.full_score = 4
  } else if (type === 'judgment') {
    // 判断题固定两个选项
    formState.options = [
      { label: 'A', content: '正确' },
      { label: 'B', content: '错误' },
    ]
    formState.default_score = 2
  } else if (type === 'subjective') {
    // 主观题清空选项
    formState.options = []
    formState.default_score = 10
  }
}

// 添加选项
function addOption() {
  const labels = 'ABCDEFGH'
  const nextIndex = formState.options.length
  if (nextIndex < labels.length) {
    formState.options.push({
      label: labels[nextIndex],
      content: '',
    })
  }
}

// 删除选项
function removeOption(index: number) {
  if (formState.options.length <= 2) {
    message.warning('至少需要保留2个选项')
    return
  }
  
  const removedLabel = formState.options[index].label
  formState.options.splice(index, 1)
  
  // 重新标记选项
  const labels = 'ABCDEFGH'
  formState.options.forEach((opt, i) => {
    opt.label = labels[i]
  })
  
  // 更新正确答案（如果包含被删除的选项）
  if (formState.question_type === 'single_choice') {
    if (formState.correct_answer === removedLabel) {
      formState.correct_answer = ''
    }
  } else if (formState.question_type === 'multi_choice') {
    multiCorrectAnswers.value = multiCorrectAnswers.value.filter(l => l !== removedLabel)
    formState.correct_answer = multiCorrectAnswers.value.join('')
  }
}

// 多选题答案变化处理
function handleMultiAnswerChange(checkedValues: string[]) {
  // 按字母顺序排序
  checkedValues.sort()
  multiCorrectAnswers.value = checkedValues
  formState.correct_answer = checkedValues.join('')
}

// 图片上传前验证
function beforeUpload(file: File) {
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    message.error('只能上传图片文件!')
    return false
  }
  const isLt5M = file.size / 1024 / 1024 < 5
  if (!isLt5M) {
    message.error('图片大小不能超过 5MB!')
    return false
  }
  return true
}

// 自定义上传（模拟）
function customUpload(options: any) {
  // 模拟上传，生成本地预览URL
  const { file, onSuccess } = options
  const reader = new FileReader()
  reader.onload = (e) => {
    const url = e.target?.result as string
    onSuccess?.(url)
    message.success('图片上传成功')
  }
  reader.readAsDataURL(file)
}

// 图片预览
function handlePreview(file: UploadFile) {
  previewImage.value = file.url || file.thumbUrl || ''
  previewVisible.value = true
}

// 删除图片
function handleImageRemove(file: UploadFile) {
  // 从表单数据中移除对应图片URL
  const index = contentImageList.value.indexOf(file)
  if (index > -1) {
    formState.images.splice(index, 1)
  }
}

// 表单提交
async function handleSubmit() {
  try {
    await formRef.value?.validate()
    
    // 验证选项
    if (['single_choice', 'multi_choice'].includes(formState.question_type)) {
      const emptyOptions = formState.options.filter(o => !o.content.trim())
      if (emptyOptions.length > 0) {
        message.error(`选项 ${emptyOptions.map(o => o.label).join(', ')} 内容不能为空`)
        return
      }
      
      // 验证正确答案
      if (!formState.correct_answer) {
        message.error('请选择正确答案')
        return
      }
      
      // 多选题至少选择2个答案
      if (formState.question_type === 'multi_choice' && formState.correct_answer.length < 2) {
        message.error('多选题至少需要选择2个正确答案')
        return
      }
    }
    
    submitting.value = true
    
    // 组装提交数据
    const submitData = {
      ...formState,
      question_bank_id: props.questionBankId,
      images: formState.images,
      analysis_images: formState.analysis_images,
      // 多选题使用评分规则中的满分作为默认分值
      default_score: formState.question_type === 'multi_choice' 
        ? formState.scoring_rules.full_score 
        : formState.default_score,
    }
    
    // 过滤掉空选项
    if (submitData.options) {
      submitData.options = submitData.options.filter(o => o.content.trim())
    }
    
    emit('submit', submitData)
  } catch (error) {
    console.error('表单验证失败:', error)
  } finally {
    submitting.value = false
  }
}

// 提交并继续添加
async function handleSubmitAndAdd() {
  await handleSubmit()
  // 重置表单（保留题型）
  const currentType = formState.question_type
  formState.content = ''
  formState.images = []
  formState.correct_answer = ''
  formState.answer_analysis = ''
  formState.analysis_images = []
  multiCorrectAnswers.value = []
  
  // 重新初始化选项
  handleTypeChange()
  
  message.success('题目已添加，请继续录入下一题')
}

// 取消
function handleCancel() {
  emit('cancel')
}

// 插入 LaTeX 代码到题目内容
function insertLatex(latex: string) {
  const textarea = document.querySelector('.content-editor textarea') as HTMLTextAreaElement
  if (!textarea) {
    // 如果找不到 textarea，直接追加到内容末尾
    formState.content += ` $${latex}$ `
    return
  }

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const value = formState.content

  // 在当前光标位置插入 LaTeX 代码
  const newValue = value.substring(0, start) + ` $${latex}$ ` + value.substring(end)
  formState.content = newValue

  // 设置光标位置到插入内容之后
  setTimeout(() => {
    textarea.focus()
    const newCursorPos = start + latex.length + 4 // 2个$ + 2个空格
    textarea.setSelectionRange(newCursorPos, newCursorPos)
  }, 0)
}

// ── 初始化 ──
function initForm() {
  if (props.initialData) {
    // 编辑模式，填充数据
    formState.question_type = props.initialData.question_type || 'single_choice'
    formState.content = props.initialData.content || ''
    formState.images = props.initialData.images || []
    formState.options = props.initialData.options?.length 
      ? [...props.initialData.options] 
      : [
          { label: 'A', content: '' },
          { label: 'B', content: '' },
          { label: 'C', content: '' },
          { label: 'D', content: '' },
        ]
    formState.correct_answer = props.initialData.correct_answer || ''
    
    // 多选题初始化
    if (formState.question_type === 'multi_choice' && formState.correct_answer) {
      multiCorrectAnswers.value = formState.correct_answer.split('')
    }
    
    formState.scoring_rules = props.initialData.scoring_rules || {
      full_score: 4,
      partial_score: 2,
      wrong_score: 0,
      partial_mode: 'per_option',
    }
    formState.default_score = props.initialData.default_score || 3
    formState.answer_analysis = props.initialData.answer_analysis || ''
    formState.tags = props.initialData.tags || []
    formState.difficulty = props.initialData.difficulty || 'medium'
    
    // 初始化图片列表
    contentImageList.value = formState.images.map((url, i) => ({
      uid: `-${i}`,
      name: `image-${i}.png`,
      status: 'done',
      url,
    }))
  }
}

onMounted(() => {
  initForm()
})

// 监听initialData变化
watch(() => props.initialData, () => {
  initForm()
}, { deep: true })
</script>

<style scoped lang="less">
.question-form {
  max-height: 70vh;
  overflow-y: auto;
  padding-right: 8px;
  
  // 自定义滚动条
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #d9d9d9;
    border-radius: 3px;
  }
}

// 富文本编辑器
.rich-editor {
  .content-editor {
    font-family: monospace;
  }
}

// LaTeX 公式语法提示
.latex-hint {
  margin-top: 8px;
  padding: 8px 12px;
  background: #f6ffed;
  border-radius: 4px;
  border: 1px dashed #b7eb8f;

  .hint-title {
    font-size: 12px;
    color: #52c41a;
    margin-right: 8px;
    font-weight: 500;
  }

  .ant-tag {
    cursor: pointer;
    font-size: 12px;
    transition: all 0.3s;

    &:hover {
      background: #52c41a;
      color: white;
    }
  }
}

// 实时预览
.live-preview-section {
  margin-bottom: 16px;
  padding: 16px;
  background: #f6ffed;
  border: 1px dashed #b7eb8f;
  border-radius: 8px;
  
  .preview-title {
    font-weight: 500;
    color: #52c41a;
    margin-bottom: 12px;
  }
  
  .preview-content {
    background: white;
    padding: 16px;
    border-radius: 4px;
  }
}

// 选项列表
.options-list {
  margin-bottom: 12px;
  
  .option-item {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    
    .option-label {
      font-weight: 500;
      color: #262626;
      min-width: 24px;
    }
    
    .option-input {
      flex: 1;
    }
  }
}

// 评分规则区域
.scoring-rules-section {
  background: #f6ffed;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  
  .section-title {
    font-weight: 500;
    color: #52c41a;
    margin-bottom: 16px;
    font-size: 14px;
  }
  
  .radio-label {
    font-weight: 500;
    margin-right: 8px;
  }
  
  .radio-desc {
    color: #8c8c8c;
    font-size: 12px;
  }
  
  .rule-alert {
    margin-top: 12px;
  }
}

// 解析区域
.analysis-section {
  .section-title {
    font-weight: 500;
    color: #1890ff;
    margin-bottom: 16px;
    font-size: 14px;
  }
}

// 难度圆点
.difficulty-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 4px;
  
  &.easy {
    background: #52c41a;
  }
  
  &.medium {
    background: #faad14;
  }
  
  &.hard {
    background: #f5222d;
  }
}

// 表单操作
.form-actions {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

// 覆盖Ant Design样式
:deep(.ant-radio-button-wrapper) {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
</style>
