import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'

import App from './App.vue'
import router from './router'
import { useUserStore } from './store/user'
import { setupDirectives } from './directives/permission'
import './style.css'
import './styles/layout-override.css'
import './styles/design-system.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(Antd)

// 注册自定义指令
setupDirectives(app)

// 初始化用户状态（恢复心跳检测）
const userStore = useUserStore()
userStore.initHeartbeat()

app.mount('#app')
