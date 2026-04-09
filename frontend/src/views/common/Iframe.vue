<template>
  <div class="iframe-page">
    <!-- 加载状态 -->
    <div v-if="loading" class="iframe-loading">
      <a-spin size="large" tip="加载中..." />
    </div>

    <!-- iframe 容器 -->
    <iframe
      ref="iframeRef"
      :src="iframeUrl"
      class="iframe-content"
      frameborder="0"
      allowfullscreen
      @load="handleLoad"
      @error="handleError"
    />

    <!-- 错误提示 -->
    <a-result
      v-if="error"
      status="error"
      title="页面加载失败"
      sub-title="无法加载指定的内嵌页面，请检查 URL 是否正确"
    >
      <template #extra>
        <a-button type="primary" @click="retry">重试</a-button>
        <a-button @click="goBack">返回</a-button>
      </template>
      <div class="error-info">
        <p>URL: {{ iframeUrl }}</p>
      </div>
    </a-result>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const iframeRef = ref<HTMLIFrameElement>()
const loading = ref(true)
const error = ref(false)

// 从路由元数据或 query 参数获取 iframe URL
const iframeUrl = computed(() => {
  // 优先从 meta 获取
  const metaUrl = route.meta.iframeUrl as string
  if (metaUrl) return metaUrl

  // 其次从 query 获取
  const queryUrl = route.query.url as string
  if (queryUrl) return queryUrl

  return ''
})

// 页面标题
const pageTitle = computed(() => (route.meta.title as string) || '内嵌页面')

// 设置页面标题
watch(
  pageTitle,
  (title) => {
    document.title = `${title} - 智慧云平台`
  },
  { immediate: true }
)

// 监听 URL 变化
watch(
  iframeUrl,
  () => {
    loading.value = true
    error.value = false
  },
  { immediate: true }
)

// iframe 加载完成
function handleLoad() {
  loading.value = false
  error.value = false
  console.log('[Iframe] 加载完成:', iframeUrl.value)
}

// iframe 加载错误
function handleError() {
  loading.value = false
  error.value = true
  console.error('[Iframe] 加载失败:', iframeUrl.value)
}

// 重试
function retry() {
  loading.value = true
  error.value = false
  // 重新加载 iframe
  if (iframeRef.value) {
    iframeRef.value.src = iframeUrl.value
  }
}

// 返回上一页
function goBack() {
  router.back()
}

onMounted(() => {
  if (!iframeUrl.value) {
    error.value = true
    loading.value = false
    console.error('[Iframe] 未配置 URL')
  }
})
</script>

<style scoped>
.iframe-page {
  width: 100%;
  height: 100%;
  position: relative;
  background: #fff;
}

.iframe-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  z-index: 1;
}

.iframe-content {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}

.error-info {
  background: #f5f5f5;
  padding: 16px;
  border-radius: 4px;
  margin-top: 16px;
}

.error-info p {
  margin: 0;
  word-break: break-all;
  font-family: monospace;
  color: #666;
}
</style>
