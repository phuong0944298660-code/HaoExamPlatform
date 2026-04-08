<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <div class="logo-icon" aria-hidden="true">🎓</div>
        <h1>接力教育智慧云平台</h1>
        <p>广西北部湾人工智能教育大赛</p>
      </div>
      <a-form 
        :model="form" 
        @finish="handleLogin" 
        layout="vertical"
        class="login-form"
        aria-label="登录表单"
      >
        <a-form-item 
          label="账号" 
          name="account" 
          :rules="[{ required: true, message: '请输入账号' }]"
        >
          <a-input 
            v-model:value="form.account" 
            placeholder="身份证号 / 用户名" 
            size="large"
            aria-label="账号"
            aria-required="true"
          >
            <template #prefix>
              <UserOutlined aria-hidden="true" />
            </template>
          </a-input>
        </a-form-item>
        <a-form-item 
          label="密码" 
          name="password" 
          :rules="[{ required: true, message: '请输入密码' }]"
        >
          <a-input-password 
            v-model:value="form.password" 
            placeholder="请输入密码" 
            size="large"
            aria-label="密码"
            aria-required="true"
          >
            <template #prefix>
              <LockOutlined aria-hidden="true" />
            </template>
          </a-input-password>
        </a-form-item>
        <div class="form-options">
          <a-checkbox v-model:checked="rememberMe">记住账号</a-checkbox>
          <a-button type="link" size="small" class="forgot-link">忘记密码？</a-button>
        </div>
        <a-form-item>
          <a-button 
            type="primary" 
            html-type="submit" 
            :loading="loading" 
            size="large" 
            block
            class="submit-btn"
            aria-label="登录"
          >
            登 录
          </a-button>
        </a-form-item>
      </a-form>
    </div>
    
    <!-- 页脚信息 -->
    <div class="page-footer">
      <p>© 2025 接力教育智慧云平台 · 技术支持</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { 
  UserOutlined, 
  LockOutlined
} from '@ant-design/icons-vue'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()
const loading = ref(false)
const rememberMe = ref(false)
const form = reactive({ account: '', password: '' })

// 页面加载时检查是否记住的账号
onMounted(() => {
  const savedAccount = localStorage.getItem('remembered_account')
  if (savedAccount) {
    form.account = savedAccount
    rememberMe.value = true
  }
})

async function handleLogin() {
  loading.value = true
  try {
    // 记住账号功能
    if (rememberMe.value) {
      localStorage.setItem('remembered_account', form.account)
    } else {
      localStorage.removeItem('remembered_account')
    }
    
    await userStore.login(form.account, form.password)
    message.success('登录成功')
  } catch (error: any) {
    console.error('登录失败:', error)
    if (error?.response?.data?.detail) {
      message.error(error.response.data.detail)
    } else if (error?.message?.includes('Network Error')) {
      message.error('网络连接失败，请检查网络设置')
    } else {
      message.error('登录失败，请检查账号和密码')
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: var(--space-4);
  position: relative;
}

.login-card {
  width: 100%;
  max-width: 420px;
  padding: var(--space-8);
  background: var(--bg-primary);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  animation: slideUp var(--duration-normal) var(--ease-out);
}

.login-header {
  text-align: center;
  margin-bottom: var(--space-6);
}

.logo-icon {
  font-size: 48px;
  margin-bottom: var(--space-2);
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

.login-header h1 {
  font-size: var(--font-size-2xl);
  margin-bottom: var(--space-1);
  color: var(--text-primary);
  font-weight: var(--font-weight-semibold);
}

.login-header p {
  color: var(--text-tertiary);
  font-size: var(--font-size-sm);
}

.login-form {
  margin-top: var(--space-4);
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
}

.forgot-link {
  padding: 0;
  font-size: var(--font-size-sm);
}

.submit-btn {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  height: 44px;
  border-radius: var(--radius-md);
  transition: all var(--duration-fast) var(--ease-default);
}

.submit-btn:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.page-footer {
  position: absolute;
  bottom: var(--space-4);
  left: 0;
  right: 0;
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
  font-size: var(--font-size-xs);
}

/* 动画定义 */
@keyframes slideUp {
  from { 
    opacity: 0;
    transform: translateY(20px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}

/* ==================== 响应式适配 ==================== */
@media (max-width: 576px) {
  .login-page {
    padding: var(--space-3);
    background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
  }
  
  .login-card {
    padding: var(--space-5);
    border-radius: var(--radius-lg);
    max-width: 100%;
  }
  
  .logo-icon {
    font-size: 40px;
  }
  
  .login-header h1 {
    font-size: var(--font-size-xl);
  }
  
  .login-header p {
    font-size: var(--font-size-xs);
  }
  
  .form-options {
    flex-direction: column;
    gap: var(--space-2);
    align-items: flex-start;
  }
  
  .page-footer {
    position: static;
    margin-top: var(--space-4);
    padding: 0 var(--space-2);
  }
}

/* 平板适配 */
@media (min-width: 577px) and (max-width: 768px) {
  .login-card {
    max-width: 400px;
    padding: var(--space-6);
  }
}
</style>
