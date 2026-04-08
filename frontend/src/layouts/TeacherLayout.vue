<template>
  <a-layout class="teacher-layout">
    <!-- 桌面端侧边栏 -->
    <a-layout-sider 
      v-model:collapsed="collapsed" 
      :trigger="null" 
      collapsible 
      width="220"
      class="desktop-sider"
      :class="{ 'sider-collapsed': collapsed }"
    >
      <div class="logo">
        <span class="logo-icon" aria-hidden="true">🎓</span>
        <span class="logo-text">{{ collapsed ? '接力' : '接力教育智慧云平台' }}</span>
      </div>
      <a-menu 
        theme="dark" 
        mode="inline" 
        :selectedKeys="selectedKeys" 
        @click="onMenuClick"
        class="sidebar-menu"
      >
        <a-menu-item key="/teacher">
          <template #icon><HomeOutlined aria-hidden="true" /></template>
          <span>工作台</span>
        </a-menu-item>
        <a-menu-item key="/teacher/question-banks">
          <template #icon><DatabaseOutlined aria-hidden="true" /></template>
          <span>题库管理</span>
        </a-menu-item>
        <a-menu-item key="/teacher/papers">
          <template #icon><FileTextOutlined aria-hidden="true" /></template>
          <span>套卷管理</span>
        </a-menu-item>
        <a-menu-item key="/teacher/exams">
          <template #icon><FormOutlined aria-hidden="true" /></template>
          <span>考试管理</span>
        </a-menu-item>
        <a-menu-item key="/teacher/scores">
          <template #icon><BarChartOutlined aria-hidden="true" /></template>
          <span>成绩管理</span>
        </a-menu-item>
        <a-menu-item key="/teacher/classes">
          <template #icon><TeamOutlined aria-hidden="true" /></template>
          <span>班级管理</span>
        </a-menu-item>
        <a-menu-item key="/teacher/resources">
          <template #icon><FolderOutlined aria-hidden="true" /></template>
          <span>资源中心</span>
        </a-menu-item>
      </a-menu>
    </a-layout-sider>

    <!-- 移动端抽屉菜单 -->
    <a-drawer
      v-model:open="mobileMenuVisible"
      placement="left"
      :closable="false"
      :bodyStyle="{ padding: 0 }"
      class="mobile-drawer"
      width="260"
    >
      <div class="mobile-drawer-header">
        <div class="logo">
          <span class="logo-icon" aria-hidden="true">🎓</span>
          <span class="logo-text">接力教育智慧云平台</span>
        </div>
        <a-button type="text" @click="mobileMenuVisible = false" aria-label="关闭菜单">
          <CloseOutlined />
        </a-button>
      </div>
      <a-menu 
        theme="light" 
        mode="inline" 
        :selectedKeys="selectedKeys" 
        @click="onMobileMenuClick"
        class="mobile-menu"
      >
        <a-menu-item key="/teacher">
          <template #icon><HomeOutlined aria-hidden="true" /></template>
          <span>工作台</span>
        </a-menu-item>
        <a-menu-item key="/teacher/question-banks">
          <template #icon><DatabaseOutlined aria-hidden="true" /></template>
          <span>题库管理</span>
        </a-menu-item>
        <a-menu-item key="/teacher/papers">
          <template #icon><FileTextOutlined aria-hidden="true" /></template>
          <span>套卷管理</span>
        </a-menu-item>
        <a-menu-item key="/teacher/exams">
          <template #icon><FormOutlined aria-hidden="true" /></template>
          <span>考试管理</span>
        </a-menu-item>
        <a-menu-item key="/teacher/scores">
          <template #icon><BarChartOutlined aria-hidden="true" /></template>
          <span>成绩管理</span>
        </a-menu-item>
        <a-menu-item key="/teacher/classes">
          <template #icon><TeamOutlined aria-hidden="true" /></template>
          <span>班级管理</span>
        </a-menu-item>
        <a-menu-item key="/teacher/resources">
          <template #icon><FolderOutlined aria-hidden="true" /></template>
          <span>资源中心</span>
        </a-menu-item>
        <a-menu-divider />
        <a-menu-item @click="handleLogout">
          <template #icon><LogoutOutlined aria-hidden="true" /></template>
          <span>退出登录</span>
        </a-menu-item>
      </a-menu>
    </a-drawer>

    <a-layout class="main-layout">
      <!-- 桌面端头部 -->
      <a-layout-header class="header desktop-header">
        <div class="header-left">
          <a-button 
            type="text" 
            class="collapse-btn"
            @click="collapsed = !collapsed"
            :aria-label="collapsed ? '展开菜单' : '收起菜单'"
          >
            <MenuFoldOutlined v-if="!collapsed" />
            <MenuUnfoldOutlined v-else />
          </a-button>
          <a-breadcrumb class="breadcrumb">
            <a-breadcrumb-item 
              v-for="(item, index) in breadcrumbs" 
              :key="index"
              :class="{ 'breadcrumb-last': index === breadcrumbs.length - 1 }"
            >
              <router-link v-if="item.path && index < breadcrumbs.length - 1" :to="item.path">
                {{ item.title }}
              </router-link>
              <span v-else>{{ item.title }}</span>
            </a-breadcrumb-item>
          </a-breadcrumb>
        </div>
        <div class="header-right">
          <a-dropdown>
            <span class="user-dropdown" role="button" tabindex="0" aria-label="用户菜单">
              <UserOutlined class="user-icon" aria-hidden="true" />
              <span class="user-name">{{ userStore.user?.name || '教师' }}</span>
              <DownOutlined class="dropdown-icon" aria-hidden="true" />
            </span>
            <template #overlay>
              <a-menu>
                <a-menu-item disabled>
                  <UserOutlined /> {{ userStore.user?.role === 'teacher' ? '教师' : '管理员' }}
                </a-menu-item>
                <a-menu-divider />
                <a-menu-item @click="handleLogout" danger>
                  <LogoutOutlined /> 退出登录
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
      </a-layout-header>

      <!-- 移动端头部 -->
      <a-layout-header class="header mobile-header">
        <div class="header-left">
          <a-button 
            type="text" 
            class="menu-btn"
            @click="mobileMenuVisible = true"
            aria-label="打开菜单"
          >
            <MenuOutlined />
          </a-button>
          <span class="page-title">{{ pageTitle }}</span>
        </div>
        <div class="header-right">
          <a-dropdown>
            <span class="user-dropdown" role="button" tabindex="0" aria-label="用户菜单">
              <UserOutlined class="user-icon" aria-hidden="true" />
            </span>
            <template #overlay>
              <a-menu>
                <a-menu-item disabled>
                  {{ userStore.user?.name || '教师' }}
                </a-menu-item>
                <a-menu-divider />
                <a-menu-item @click="handleLogout" danger>
                  <LogoutOutlined /> 退出登录
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
      </a-layout-header>

      <a-layout-content class="content">
        <div class="content-wrapper">
          <router-view />
        </div>
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import { useUserStore } from '@/store/user'
import {
  HomeOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  FormOutlined,
  BarChartOutlined,
  TeamOutlined,
  FolderOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MenuOutlined,
  UserOutlined,
  DownOutlined,
  LogoutOutlined,
  CloseOutlined,
} from '@ant-design/icons-vue'

const collapsed = ref(false)
const mobileMenuVisible = ref(false)
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 菜单路径映射
const menuPaths = [
  '/teacher/question-banks', 
  '/teacher/papers', 
  '/teacher/exams', 
  '/teacher/scores', 
  '/teacher/classes', 
  '/teacher/resources', 
  '/teacher'
]

// 面包屑映射
const breadcrumbMap: Record<string, { title: string; parent?: string }> = {
  '/teacher': { title: '工作台' },
  '/teacher/question-banks': { title: '题库管理' },
  '/teacher/papers': { title: '套卷管理' },
  '/teacher/exams': { title: '考试管理' },
  '/teacher/scores': { title: '成绩管理' },
  '/teacher/classes': { title: '班级管理' },
  '/teacher/resources': { title: '资源中心' },
}

// 当前选中菜单
const selectedKeys = computed(() => {
  const path = route.path
  const matched = menuPaths.find(p => path.startsWith(p) && p !== '/teacher') || '/teacher'
  return [matched]
})

// 面包屑计算
const breadcrumbs = computed(() => {
  const path = route.path
  const items: { title: string; path?: string }[] = []
  
  // 首页
  items.push({ title: '首页', path: '/teacher' })
  
  // 找到匹配的菜单项
  const matchedPath = menuPaths.find(p => path.startsWith(p) && p !== '/teacher')
  if (matchedPath && matchedPath !== '/teacher') {
    const menuItem = breadcrumbMap[matchedPath]
    if (menuItem) {
      items.push({ title: menuItem.title, path: matchedPath })
    }
  }
  
  return items
})

// 页面标题（移动端）
const pageTitle = computed(() => {
  const current = breadcrumbs.value[breadcrumbs.value.length - 1]
  return current?.title || '接力教育'
})

// 桌面端菜单点击
function onMenuClick({ key }: { key: string }) {
  router.push(key)
}

// 移动端菜单点击
function onMobileMenuClick({ key }: { key: string }) {
  mobileMenuVisible.value = false
  router.push(key)
}

// 退出登录
function handleLogout() {
  Modal.confirm({
    title: '确认退出',
    content: '确定要退出登录吗？',
    okText: '退出',
    cancelText: '取消',
    onOk: () => {
      userStore.logout()
      message.success('已退出登录')
    },
  })
}

// 监听路由变化，移动端自动关闭菜单
watch(() => route.path, () => {
  mobileMenuVisible.value = false
})
</script>

<style scoped>
.teacher-layout { 
  min-height: 100vh;
  width: 100vw;
  display: flex;
}

/* ==================== 桌面端侧边栏 ==================== */
.desktop-sider {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 100;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
}

.desktop-sider.sider-collapsed {
  box-shadow: none;
}

.logo { 
  color: #fff; 
  padding: var(--space-4);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  height: 64px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.logo-text {
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-menu {
  border-right: none;
  padding-top: var(--space-2);
}

/* ==================== 移动端抽屉 ==================== */
.mobile-drawer {
  display: none;
}

.mobile-drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  background: var(--primary-500);
  height: 64px;
}

.mobile-drawer-header .logo {
  color: #fff;
  padding: 0;
  border: none;
  height: auto;
}

.mobile-menu {
  padding-top: var(--space-2);
}

/* ==================== 主布局 ==================== */
.main-layout {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  margin-left: 220px;
  transition: margin-left 0.2s var(--ease-default);
}

.desktop-sider.sider-collapsed + .main-layout {
  margin-left: 80px;
}

/* ==================== 头部 ==================== */
.header { 
  background: var(--bg-primary); 
  padding: 0 var(--space-6);
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  box-shadow: var(--shadow-sm);
  flex-shrink: 0;
  height: 64px;
  position: sticky;
  top: 0;
  z-index: 50;
}

.header-left { 
  display: flex; 
  align-items: center;
  gap: var(--space-4);
  flex: 1;
  min-width: 0;
}

.collapse-btn {
  font-size: 18px;
  color: var(--text-secondary);
  transition: all var(--duration-fast) var(--ease-default);
}

.collapse-btn:hover {
  color: var(--primary-500);
  background: var(--primary-50);
}

.breadcrumb {
  font-size: var(--font-size-sm);
}

.breadcrumb a {
  color: var(--text-secondary);
  transition: color var(--duration-fast) var(--ease-default);
}

.breadcrumb a:hover {
  color: var(--primary-500);
}

.breadcrumb-last {
  color: var(--text-primary);
  font-weight: var(--font-weight-medium);
}

.header-right { 
  display: flex; 
  align-items: center;
  gap: var(--space-4);
}

.user-dropdown { 
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-default);
  color: var(--text-secondary);
}

.user-dropdown:hover {
  background: var(--gray-100);
  color: var(--text-primary);
}

.user-icon {
  font-size: 16px;
}

.user-name {
  font-size: var(--font-size-sm);
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-icon {
  font-size: 12px;
}

/* ==================== 内容区 ==================== */
.content { 
  flex: 1;
  background: var(--bg-layout);
  min-height: calc(100vh - 64px);
  overflow: auto;
}

.content-wrapper {
  padding: var(--space-6);
  max-width: 1400px;
  margin: 0 auto;
}

/* ==================== 移动端头部 ==================== */
.mobile-header {
  display: none;
  padding: 0 var(--space-4);
}

.menu-btn {
  font-size: 20px;
  color: var(--text-secondary);
}

.page-title {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  margin-left: var(--space-2);
}

.mobile-header .user-dropdown {
  padding: var(--space-2);
}

/* ==================== 响应式适配 ==================== */
@media (max-width: 768px) {
  .desktop-sider,
  .desktop-header {
    display: none !important;
  }
  
  .mobile-drawer {
    display: block;
  }
  
  .mobile-header {
    display: flex !important;
  }
  
  .main-layout {
    margin-left: 0 !important;
  }
  
  .content-wrapper {
    padding: var(--space-3);
  }
}

@media (min-width: 769px) and (max-width: 992px) {
  .content-wrapper {
    padding: var(--space-4);
  }
  
  .header {
    padding: 0 var(--space-4);
  }
  
  .user-name {
    max-width: 60px;
  }
}

@media (min-width: 993px) {
  .mobile-header {
    display: none !important;
  }
}

/* ==================== 打印样式 ==================== */
@media print {
  .desktop-sider,
  .header,
  .mobile-header {
    display: none !important;
  }
  
  .main-layout {
    margin-left: 0 !important;
  }
  
  .content {
    background: white;
    overflow: visible;
  }
}
</style>
