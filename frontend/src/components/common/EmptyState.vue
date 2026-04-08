<template>
  <div class="empty-state" :class="[`size-${size}`, { 'with-bg': showBackground }]">
    <div class="empty-illustration" :style="illustrationStyle">
      <slot name="image">
        <component 
          :is="iconComponent" 
          v-if="iconComponent" 
          class="empty-icon"
          :style="{ color: iconColor }"
          aria-hidden="true"
        />
        <div v-else-if="type === 'custom'" class="custom-image-wrapper">
          <img v-if="image" :src="image" :alt="description || '空状态'" />
          <slot name="custom-image" />
        </div>
      </slot>
    </div>
    
    <div class="empty-content">
      <h3 v-if="title" class="empty-title">{{ title }}</h3>
      <p v-if="description" class="empty-description">{{ description }}</p>
      <slot name="description" />
      
      <div v-if="actionText || $slots.action" class="empty-action">
        <slot name="action">
          <a-button 
            v-if="actionText" 
            :type="actionType" 
            @click="handleAction"
            :size="size === 'small' ? 'small' : 'middle'"
          >
            {{ actionText }}
          </a-button>
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  InboxOutlined,
  SearchOutlined,
  FileSearchOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  TeamOutlined,
  FolderOutlined,
  FormOutlined,
  BarChartOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons-vue'

type EmptyType = 'default' | 'search' | 'data' | 'database' | 'file' | 'team' | 'folder' | 'form' | 'chart' | 'error' | 'success' | 'custom'
type EmptySize = 'small' | 'medium' | 'large'

const props = defineProps<{
  /** 空状态类型，预设图标 */
  type?: EmptyType
  /** 自定义图标组件 */
  icon?: any
  /** 图标颜色 */
  iconColor?: string
  /** 标题 */
  title?: string
  /** 描述文本 */
  description?: string
  /** 操作按钮文本 */
  actionText?: string
  /** 操作按钮类型 */
  actionType?: 'primary' | 'default' | 'dashed' | 'link'
  /** 尺寸 */
  size?: EmptySize
  /** 是否显示背景 */
  showBackground?: boolean
  /** 自定义图片 URL（type=custom 时使用） */
  image?: string
}>()

const emit = defineEmits<{
  action: []
}>()

// 默认配置
const defaultConfig: Record<EmptyType, { icon: any; color: string; defaultTitle: string }> = {
  default: { icon: InboxOutlined, color: '#bfbfbf', defaultTitle: '暂无数据' },
  search: { icon: SearchOutlined, color: '#1890ff', defaultTitle: '搜索结果为空' },
  data: { icon: FileSearchOutlined, color: '#8c8c8c', defaultTitle: '暂无相关数据' },
  database: { icon: DatabaseOutlined, color: '#52c41a', defaultTitle: '暂无题库' },
  file: { icon: FileTextOutlined, color: '#faad14', defaultTitle: '暂无文件' },
  team: { icon: TeamOutlined, color: '#722ed1', defaultTitle: '暂无成员' },
  folder: { icon: FolderOutlined, color: '#13c2c2', defaultTitle: '暂无资源' },
  form: { icon: FormOutlined, color: '#eb2f96', defaultTitle: '暂无考试' },
  chart: { icon: BarChartOutlined, color: '#1890ff', defaultTitle: '暂无统计数据' },
  error: { icon: ExclamationCircleOutlined, color: '#f5222d', defaultTitle: '加载失败' },
  success: { icon: CheckCircleOutlined, color: '#52c41a', defaultTitle: '操作成功' },
  custom: { icon: null, color: '#bfbfbf', defaultTitle: '' },
}

// 计算属性
const iconComponent = computed(() => props.icon || defaultConfig[props.type || 'default'].icon)
const iconColor = computed(() => props.iconColor || defaultConfig[props.type || 'default'].color)
const title = computed(() => props.title || defaultConfig[props.type || 'default'].defaultTitle)

const illustrationStyle = computed(() => {
  const sizeMap = {
    small: { width: '48px', height: '48px' },
    medium: { width: '80px', height: '80px' },
    large: { width: '120px', height: '120px' },
  }
  return sizeMap[props.size || 'medium']
})

function handleAction() {
  emit('action')
}
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-8);
  text-align: center;
}

.empty-state.with-bg {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  border: 1px dashed var(--border-default);
}

/* ==================== 尺寸变体 ==================== */
.size-small {
  padding: var(--space-4);
}

.size-small .empty-icon {
  font-size: 48px;
}

.size-small .empty-title {
  font-size: var(--font-size-base);
  margin-top: var(--space-3);
}

.size-small .empty-description {
  font-size: var(--font-size-sm);
  margin-top: var(--space-1);
}

.size-medium {
  padding: var(--space-6);
}

.size-medium .empty-icon {
  font-size: 80px;
}

.size-medium .empty-title {
  font-size: var(--font-size-lg);
  margin-top: var(--space-4);
}

.size-medium .empty-description {
  font-size: var(--font-size-sm);
  margin-top: var(--space-2);
}

.size-large {
  padding: var(--space-10);
}

.size-large .empty-icon {
  font-size: 120px;
}

.size-large .empty-title {
  font-size: var(--font-size-xl);
  margin-top: var(--space-5);
}

.size-large .empty-description {
  font-size: var(--font-size-base);
  margin-top: var(--space-3);
}

/* ==================== 插图区域 ==================== */
.empty-illustration {
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-icon {
  opacity: 0.6;
  transition: all var(--duration-normal) var(--ease-default);
}

.empty-state:hover .empty-icon {
  opacity: 0.8;
  transform: scale(1.02);
}

.custom-image-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.custom-image-wrapper img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

/* ==================== 内容区域 ==================== */
.empty-content {
  max-width: 400px;
}

.empty-title {
  color: var(--text-primary);
  font-weight: var(--font-weight-medium);
  margin: 0;
}

.empty-description {
  color: var(--text-secondary);
  line-height: var(--line-height-normal);
  margin: 0;
}

.empty-action {
  margin-top: var(--space-4);
}

.size-small .empty-action {
  margin-top: var(--space-3);
}

.size-large .empty-action {
  margin-top: var(--space-5);
}

/* ==================== 动画 ==================== */
.empty-state {
  animation: fadeIn var(--duration-normal) var(--ease-default);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ==================== 响应式 ==================== */
@media (max-width: 576px) {
  .empty-state {
    padding: var(--space-5);
  }
  
  .size-large {
    padding: var(--space-6);
  }
  
  .size-large .empty-icon {
    font-size: 80px;
  }
  
  .size-large .empty-title {
    font-size: var(--font-size-lg);
  }
  
  .empty-content {
    max-width: 280px;
  }
}
</style>
