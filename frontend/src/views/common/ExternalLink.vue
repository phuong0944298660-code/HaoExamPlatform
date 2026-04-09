<template>
  <div class="external-link-page">
    <a-result status="info" :title="pageTitle" sub-title="即将跳转到外部链接">
      <template #icon>
        <LinkOutlined style="font-size: 48px; color: #1890ff;" />
      </template>

      <div class="link-info">
        <p class="link-label">目标地址：</p>
        <a-typography-paragraph class="link-url" copyable>
          {{ externalUrl }}
        </a-typography-paragraph>
      </div>

      <template #extra>
        <a-space>
          <a-button type="primary" size="large" @click="openLink">
            <template #icon><ExportOutlined /></template>
            立即跳转
          </a-button>
          <a-button size="large" @click="goBack">
            <template #icon><ArrowLeftOutlined /></template>
            返回
          </a-button>
        </a-space>
      </template>

      <div class="tips">
        <a-alert
          message="安全提示"
          description="您即将访问外部网站，请注意账号安全，不要在外部网站输入您的平台密码。"
          type="warning"
          show-icon
        />
      </div>
    </a-result>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { LinkOutlined, ExportOutlined, ArrowLeftOutlined } from '@ant-design/icons-vue'

const route = useRoute()
const router = useRouter()

const autoJump = ref(false)
const countdown = ref(3)

// 外部链接 URL
const externalUrl = computed(() => {
  // 从 meta 获取
  const metaUrl = route.meta.externalLink as string
  if (metaUrl) return metaUrl

  // 从 query 获取
  const queryUrl = route.query.url as string
  if (queryUrl) return queryUrl

  return ''
})

// 页面标题
const pageTitle = computed(() => (route.meta.title as string) || '外部链接')

// 打开链接
function openLink() {
  const url = externalUrl.value
  if (url) {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}

// 返回上一页
function goBack() {
  router.back()
}

onMounted(() => {
  // 检查 URL 是否有效
  if (!externalUrl.value) {
    console.error('[ExternalLink] 未配置外部链接 URL')
  }

  // 设置页面标题
  document.title = `${pageTitle.value} - 智慧云平台`
})
</script>

<style scoped>
.external-link-page {
  padding: 48px 24px;
  background: #fff;
  min-height: calc(100vh - 200px);
}

.link-info {
  background: #f6ffed;
  border: 1px solid #b7eb8f;
  border-radius: 4px;
  padding: 16px 24px;
  margin: 24px 0;
  text-align: left;
}

.link-label {
  margin: 0 0 8px;
  color: #52c41a;
  font-weight: 500;
}

.link-url {
  margin: 0;
  font-family: monospace;
  color: #262626;
}

.tips {
  max-width: 480px;
  margin: 24px auto 0;
}
</style>
