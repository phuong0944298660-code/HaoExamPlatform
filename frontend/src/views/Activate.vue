<template>
  <div class="activate-page">
    <div class="activate-container">
      <div class="activate-card">
        <div class="card-header">
          <div class="logo-area">
            <span class="logo-icon">🚀</span>
            <span class="logo-text">接力教育</span>
          </div>
          <h2>账号内容激活</h2>
          <p class="subtitle">输入激活码即可解锁云平台资源与权限</p>
        </div>

        <a-form ref="formRef" :model="form" @finish="handleActivate" layout="vertical">
          <!-- 激活码 -->
          <a-form-item 
            label="激活码" 
            name="activation_code"
            :rules="[{ required: true, message: '请输入激活码', trigger: 'blur' }]"
          >
            <a-input 
              v-model:value="form.activation_code" 
              placeholder="格式: XXXX-XXXX-XXXX-XXXX" 
              size="large"
              class="custom-input"
            >
              <template #prefix>
                <key-outlined />
              </template>
            </a-input>
          </a-form-item>

          <div class="form-row">
            <!-- 账号标识选择 -->
            <a-form-item label="身份类型" required>
              <a-radio-group v-model:value="identType" button-style="solid" class="ident-type-group">
                <a-radio-button value="identity" id="radio-exam">考试账号/身份证</a-radio-button>
                <a-radio-button value="username" id="radio-practice">练习账号/用户名</a-radio-button>
              </a-radio-group>
            </a-form-item>
          </div>

          <!-- 账号输入 -->
          <a-form-item 
            :label="identType === 'identity' ? '身份证号' : '登录用户名'" 
            name="account"
            :rules="[
              { required: true, message: identType === 'identity' ? '请输入身份证号' : '请输入用户名', trigger: 'blur' },
              identType === 'identity' ? { pattern: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/, message: '请输入有效的身份证号', trigger: 'blur' } : {}
            ]"
          >
            <a-input 
              v-model:value="form.account" 
              :placeholder="identType === 'identity' ? '请输入18位身份证号' : '请输入用户名'" 
              size="large"
              class="custom-input"
            >
              <template #prefix>
                <idcard-outlined v-if="identType === 'identity'" />
                <user-outlined v-else />
              </template>
            </a-input>
          </a-form-item>

          <a-form-item class="actions">
            <a-button type="primary" html-type="submit" :loading="loading" size="large" block class="btn-activate" id="btn-activate-submit">
              立即激活内容
            </a-button>
            <div class="footer-links">
              <span>已有账号？</span>
              <a @click="goToLogin">去登录</a>
            </div>
          </a-form-item>
        </a-form>
      </div>
      <div class="activate-info">
        <h3>激活指南</h3>
        <div class="info-item">
          <h4>1. 获取激活码</h4>
          <p>由所在的学校或教育机构分发，激活码将决定您的学段权限和资源访问范围。</p>
        </div>
        <div class="info-item">
          <h4>2. 账号确认</h4>
          <p>请确保您已获得系统下发的初始账号。激活过程仅用于关联权限，不涉及密码设置。</p>
        </div>
        <div class="info-item">
          <h4>3. 权限说明</h4>
          <p>激活成功后，系统将自动根据激活码类型为您分配对应的学段题库及教学资源。</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import type { FormInstance } from 'ant-design-vue'
import { activateAccount } from '@/api/auth'
import { useRouter } from 'vue-router'
import { 
  KeyOutlined, 
  UserOutlined, 
  IdcardOutlined 
} from '@ant-design/icons-vue'

const router = useRouter()
const formRef = ref<FormInstance>()
const loading = ref(false)
const identType = ref<'identity' | 'username'>('identity')

const form = reactive({
  activation_code: '',
  account: '',
})

function goToLogin() {
  router.push('/login')
}

async function handleActivate() {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    loading.value = true
    
    const data: any = {
      activation_code: form.activation_code
    }

    if (identType.value === 'identity') {
      data.identity_no = form.account
    } else {
      data.username = form.account
    }
    
    await activateAccount(data)
    message.success('内容激活成功！即将跳转至登录页')
    setTimeout(() => {
      router.push({
        path: '/login',
        query: { account: form.account }
      })
    }, 1500)
  } catch (error: any) {
    if (error?.response?.data?.message) {
      message.error(error.response.data.message)
    } else if (error?.response?.data?.detail) {
      message.error(error.response.data.detail)
    } else {
      message.error('激活请求失败，请检查激活码或账号是否正确')
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.activate-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at top right, #f8faff, #e8efff 100%);
  padding: 20px;
}

.activate-container {
  display: flex;
  width: 1000px;
  max-width: 100%;
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 12px 48px rgba(0, 50, 150, 0.08);
}

.activate-card {
  flex: 1;
  padding: 40px 60px;
}

.activate-info {
  width: 350px;
  background: #2f54eb; /* Primary blue */
  background: linear-gradient(135deg, #2f54eb 0%, #1d39c4 100%);
  padding: 50px 40px;
  color: white;
  display: flex;
  flex-direction: column;
}

.card-header {
  margin-bottom: 32px;
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.logo-icon { font-size: 24px; }
.logo-text { font-size: 22px; font-weight: 700; color: #1a1a1a; letter-spacing: 0.5px; }

h2 { font-size: 28px; font-weight: 700; color: #1a1a1a; margin-bottom: 8px; }
.subtitle { color: #8c8c8c; font-size: 15px; }

.custom-input {
  border-radius: 10px;
}

.ident-type-group {
  width: 100%;
  display: flex;
}

.ident-type-group :deep(.ant-radio-button-wrapper) {
  flex: 1;
  text-align: center;
  height: 40px;
  line-height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-activate {
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 10px;
  background: #2f54eb;
  border: none;
  box-shadow: 0 4px 12px rgba(47, 84, 235, 0.25);
  margin-top: 10px;
}

.btn-activate:hover {
  background: #597ef7;
  transform: translateY(-1px);
}

.footer-links {
  text-align: center;
  margin-top: 20px;
  color: #8c8c8c;
}

.footer-links a {
  color: #2f54eb;
  font-weight: 600;
  margin-left: 8px;
}

.activate-info h3 {
  color: white;
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 30px;
}

.info-item {
  margin-bottom: 24px;
}

.info-item h4 {
  color: rgba(255, 255, 255, 0.9);
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
}

.info-item p {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  line-height: 1.6;
}

@media (max-width: 900px) {
  .activate-container { flex-direction: column; width: 480px; }
  .activate-info { width: 100%; padding: 30px; }
}
</style>
