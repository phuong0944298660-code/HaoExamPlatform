<template>
  <div class="error-page">
    <a-result status="error" :title="errorTitle" :sub-title="errorSubTitle">
      <template #extra>
        <a-space>
          <a-button type="primary" @click="retry">重新加载</a-button>
          <a-button @click="goHome">返回首页</a-button>
          <a-button @click="goBack">返回上一页</a-button>
        </a-space>
      </template>

      <div class="error-details">
        <a-divider>诊断信息</a-divider>
        <div class="diagnostic-info">
          <p><strong>当前路径：</strong>{{ currentPath }}</p>
          <p><strong>可能原因：</strong></p>
          <ul>
            <li v-for="(reason, index) in possibleReasons" :key="index">{{ reason }}</li>
          </ul>
          <p v-if="suggestion"><strong>建议：</strong>{{ suggestion }}</p>
        </div>
        <pre v-if="errorDetails">{{ errorDetails }}</pre>
      </div>
    </a-result>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const errorDetails = ref('')
const currentPath = ref('')

const errorTitle = computed(() => {
  // 根据路径判断错误类型
  if (currentPath.value === '/403') return '403 无权限访问'
  return '页面加载失败'
})

const errorSubTitle = computed(() => {
  if (currentPath.value === '/403') {
    return '抱歉，您没有权限访问该页面'
  }
  return '无法加载该页面，请检查网络连接或联系管理员'
})

const possibleReasons = computed(() => {
  const reasons = []

  // 判断可能的原因
  if (currentPath.value.match(/^\/(accounts|questions|exams|papers|scores|resources|system)/)) {
    reasons.push('该页面可能需要通过后台菜单管理配置才能访问')
    reasons.push('后端菜单配置的组件名称可能与前端不匹配')
  }

  if (currentPath.value.includes('/admin/') || currentPath.value.startsWith('/accounts')) {
    reasons.push('管理员动态路由尚未加载或加载失败')
  }

  reasons.push('页面组件文件不存在或加载失败')
  reasons.push('Token 过期，需要重新登录')

  return reasons
})

const suggestion = computed(() => {
  if (currentPath.value.match(/^\/(accounts|questions|exams|papers|scores|resources|system)/)) {
    return '请检查后台【系统管理】→【菜单管理】中的配置，确保组件名称正确。'
  }
  return ''
})

function retry() {
  // 重新加载当前页面
  location.reload()
}

function goHome() {
  router.push('/')
}

function goBack() {
  router.back()
}

onMounted(() => {
  currentPath.value = route.path

  // 从路由查询参数获取错误信息（开发环境）
  if (import.meta.env.DEV) {
    errorDetails.value = (route.query.error as string) || ''
  }

  // 记录错误日志
  console.error('[LoadError] 页面加载失败:', {
    path: route.path,
    fullPath: route.fullPath,
    query: route.query,
    matched: route.matched.map(m => ({ path: m.path, name: m.name })),
  })
})
</script>

<style scoped>
.error-page {
  padding: 48px 24px;
  background: #fff;
  min-height: calc(100vh - 200px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-details {
  max-width: 600px;
  margin: 24px auto 0;
}

.error-details pre {
  background: #f5f5f5;
  padding: 16px;
  border-radius: 4px;
  text-align: left;
  overflow-x: auto;
  font-size: 12px;
  color: #666;
}

.diagnostic-info {
  background: #fffbe6;
  border: 1px solid #ffe58f;
  padding: 16px;
  border-radius: 4px;
  margin-bottom: 16px;
  text-align: left;
}

.diagnostic-info p {
  margin: 8px 0;
}

.diagnostic-info ul {
  margin: 8px 0;
  padding-left: 20px;
}

.diagnostic-info li {
  margin: 4px 0;
  color: #595959;
}
</style>