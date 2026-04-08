<template>
  <a-layout class="admin-layout">
    <!-- 侧边栏 -->
    <a-layout-sider
      v-model:collapsed="collapsed"
      :trigger="null"
      collapsible
      width="240"
      class="sidebar"
    >
      <!-- Logo区域 -->
      <div class="logo">
        <div class="logo-icon">🏫</div>
        <div v-if="!collapsed" class="logo-text">
          <div class="logo-title">接力教育</div>
          <div class="logo-subtitle">智慧云平台</div>
        </div>
      </div>

      <!-- 菜单 -->
      <a-menu
        theme="dark"
        mode="inline"
        :selectedKeys="selectedKeys"
        :openKeys="openKeys"
        @click="onMenuClick"
        @openChange="onOpenChange"
      >
        <template v-for="item in menuList" :key="item.id">
          <!-- 目录类型 (一级菜单有子菜单) -->
          <a-sub-menu v-if="item.menu_type === 'M' && item.children && item.children.length" :key="item.id">
            <template #icon><component :is="getMenuIcon(item.menu_name)" /></template>
            <template #title>{{ item.menu_name }}</template>
            <!-- 二级菜单不显示图标 -->
            <a-menu-item v-for="child in item.children" :key="child.path.startsWith('/') ? child.path : (item.path.endsWith('/') ? item.path + child.path : item.path + '/' + child.path)">
              <span>{{ child.menu_name }}</span>
            </a-menu-item>
          </a-sub-menu>

          <!-- 菜单类型 (一级菜单无子菜单) -->
          <a-menu-item v-else-if="item.menu_type === 'C'" :key="item.path.startsWith('/') ? item.path : '/' + item.path">
            <template #icon><component :is="getMenuIcon(item.menu_name)" /></template>
            <span>{{ item.menu_name }}</span>
          </a-menu-item>
        </template>
      </a-menu>

      <!-- 底部折叠按钮 -->

      <div class="sidebar-footer">
        <div class="collapse-trigger" @click="collapsed = !collapsed">
          <MenuFoldOutlined v-if="!collapsed" />
          <MenuUnfoldOutlined v-else />
        </div>
      </div>
    </a-layout-sider>

    <!-- 主内容区 -->
    <a-layout class="main-layout" :class="{ 'sider-collapsed': collapsed }">
      <!-- 顶部导航栏 -->
      <a-layout-header class="header">
        <div class="header-left">
          <a-breadcrumb separator=">">
            <a-breadcrumb-item v-for="(item, index) in (breadcrumbs as any[])" :key="index">
              <router-link v-if="item.path && index < breadcrumbs.length - 1" :to="item.path">
                {{ item.title }}
              </router-link>
              <span v-else class="breadcrumb-current">{{ item.title }}</span>
            </a-breadcrumb-item>
          </a-breadcrumb>
        </div>

        <div class="header-right">
          <!-- 通知 -->
          <a-badge :count="notificationCount" :offset="[-2, 2]" class="header-action">
            <BellOutlined class="header-icon" @click="showNotifications" />
          </a-badge>

          <!-- 全屏 -->
          <a-tooltip title="全屏">
            <FullscreenOutlined class="header-icon" @click="toggleFullscreen" />
          </a-tooltip>

          <!-- 刷新 -->
          <a-tooltip title="刷新页面">
            <ReloadOutlined class="header-icon" @click="refreshPage" />
          </a-tooltip>

          <a-divider type="vertical" class="header-divider" />

          <!-- 用户信息 -->
          <a-dropdown placement="bottomRight">
            <div class="user-dropdown">
              <a-avatar :size="32" class="user-avatar">
                {{ getUserInitials }}
              </a-avatar>
              <div v-if="!isMobile" class="user-info">
                <div class="user-name">{{ userStore.user?.name || '管理员' }}</div>
                <div class="user-role">{{ userStore.user?.role || '系统管理员' }}</div>
              </div>
              <DownOutlined class="user-arrow" />
            </div>
            <template #overlay>
              <a-menu class="user-menu">
                <div class="user-menu-header">
                  <div class="user-menu-name">{{ userStore.user?.name || '管理员' }}</div>
                  <div class="user-menu-role">{{ userStore.user?.email || 'admin@jieli.edu' }}</div>
                </div>
                <a-menu-divider />
                <!-- TODO: 个人中心功能待开发 -->
                <!-- <a-menu-item key="profile" @click="goToProfile">
                  <UserOutlined />
                  <span>个人中心</span>
                </a-menu-item> -->
                <!-- TODO: 账号设置功能待开发 -->
                <!-- <a-menu-item key="settings" @click="goToSettings">
                  <SettingOutlined />
                  <span>账号设置</span>
                </a-menu-item> -->
                <!-- <a-menu-divider /> -->
                <a-menu-item key="logout" @click="handleLogout">
                  <LogoutOutlined />
                  <span>退出登录</span>
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
      </a-layout-header>

      <!-- 标签页导航 -->
      <div v-if="showTabs" class="tabs-nav">
        <div class="tabs-scroll">
          <a-tag
            v-for="tab in tabs"
            :key="tab.path"
            :class="['tab-tag', { active: tab.path === route.path }]"
            @click="router.push(tab.path)"
          >
            {{ tab.title }}
            <CloseOutlined
              v-if="tab.path !== '/'"
              class="tab-close"
              @click.stop="closeTab(tab.path)"
            />
          </a-tag>
        </div>
      </div>

      <!-- 页面内容 -->
      <a-layout-content class="content">
        <div class="page-container">
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" :key="route.fullPath" />
            </transition>
          </router-view>
        </div>
      </a-layout-content>

      <!-- 页脚 -->
      <a-layout-footer class="footer">
        <div class="footer-content">
          <span>© 2024 接力教育智慧云平台 · 版权所有</span>
          <span class="footer-version">v2.0.0</span>
        </div>
      </a-layout-footer>
    </a-layout>
  </a-layout>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { Modal, message } from 'ant-design-vue'
import {
  DashboardOutlined,
  TeamOutlined,
  KeyOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  CalendarOutlined,
  BarChartOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  FullscreenOutlined,
  ReloadOutlined,
  DownOutlined,
  UserOutlined,
  LogoutOutlined,
  CloseOutlined,
  MessageOutlined,
  SafetyOutlined,
  ToolOutlined,
  BarcodeOutlined,
  SnippetsOutlined,
  FormOutlined,
  AreaChartOutlined,
  InboxOutlined,
  CopyOutlined,
  ReconciliationOutlined,
  ContactsOutlined,
  CloudServerOutlined,
  ApiOutlined,
  ClusterOutlined,
  MenuOutlined,
  BookOutlined,
  ReadOutlined,
  EditOutlined,
  TrophyOutlined,
  FlagOutlined,
  SolutionOutlined,
  AuditOutlined,
  ContainerOutlined,
  FolderOutlined,
  ProfileOutlined,
  ExperimentOutlined,
} from '@ant-design/icons-vue'

const collapsed = ref(false)
const openKeys = ref<string[]>([])
const showTabs = ref(true)
const notificationCount = ref(3)
const isMobile = ref(false)

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// ── 动态菜单逻辑 ──
const menuList = ref<any[]>([])

const iconMap: Record<string, any> = {
  // 基础图标
  dashboard: DashboardOutlined,
  team: TeamOutlined,
  key: KeyOutlined,
  database: DatabaseOutlined,
  file: FileTextOutlined,
  calendar: CalendarOutlined,
  chart: BarChartOutlined,
  setting: SettingOutlined,
  message: MessageOutlined,
  safety: SafetyOutlined,
  tool: ToolOutlined,
  user: UserOutlined,
  barcode: BarcodeOutlined,
  snippets: SnippetsOutlined,
  form: FormOutlined,
  'area-chart': AreaChartOutlined,
  'bar-chart': BarChartOutlined,
  inbox: InboxOutlined,
  copy: CopyOutlined,
  reconciliation: ReconciliationOutlined,
  contacts: ContactsOutlined,
  'cloud-server': CloudServerOutlined,
  api: ApiOutlined,
  cluster: ClusterOutlined,
  menu: MenuOutlined,
  // 新增图标 - 一级菜单专用
  book: BookOutlined,
  read: ReadOutlined,
  edit: EditOutlined,
  trophy: TrophyOutlined,
  flag: FlagOutlined,
  solution: SolutionOutlined,
  audit: AuditOutlined,
  container: ContainerOutlined,
  folder: FolderOutlined,
  profile: ProfileOutlined,
  experiment: ExperimentOutlined,
}

// 根据菜单名称自动匹配图标
function getMenuIcon(menuName: string): any {
  const iconMapping: Record<string, any> = {
    // 管理控制台
    '管理控制台': DashboardOutlined,
    '控制台': DashboardOutlined,
    // 账号管理
    '账号管理': TeamOutlined,
    '账号': TeamOutlined,
    '用户管理': UserOutlined,
    // 激活授权
    '激活授权': SafetyOutlined,
    '激活': KeyOutlined,
    '授权': SafetyOutlined,
    // 题库系统
    '题库系统': BookOutlined,
    '题库': BookOutlined,
    '题目': FileTextOutlined,
    // 考试系统
    '考试系统': CalendarOutlined,
    '考试': CalendarOutlined,
    '试卷': SnippetsOutlined,
    // 赛事反馈
    '赛事反馈': FlagOutlined,
    '赛事': TrophyOutlined,
    '反馈': MessageOutlined,
    // 系统管理
    '系统管理': SettingOutlined,
    '系统': SettingOutlined,
    '设置': ToolOutlined,
    // 班级管理
    '班级管理': ClusterOutlined,
    '班级': ClusterOutlined,
    '学校': ContactsOutlined,
    // 成绩管理
    '成绩管理': BarChartOutlined,
    '成绩': BarChartOutlined,
    '统计': AreaChartOutlined,
    // 资源中心
    '资源': FolderOutlined,
    '文件': FolderOutlined,
    // 其他常用
    '题库套卷': DatabaseOutlined,
    '监控': AuditOutlined,
    '日志': ContainerOutlined,
  }
  return iconMapping[menuName] || SettingOutlined
}

function getIcon(iconName: string) {
  return iconMap[iconName] || SettingOutlined
}

// 当前选中的菜单项
const selectedKeys = computed(() => {
  const path = route.path
  // 支持二级匹配，例如 /accounts/list 匹配 /accounts/list
  // 或者 /questions/banks/123 匹配 /questions/banks
  if (path === '/') return ['/']
  
  // 查找最长匹配的菜单项
  const allKeys: string[] = []
  menuList.value.forEach(item => {
    if (item.path) allKeys.push(item.path)
    if (item.children) {
      item.children.forEach((child: any) => {
        if (child.path) allKeys.push(child.path)
      })
    }
  })
  
  const bestMatch = allKeys
    .filter(k => path.startsWith(k))
    .sort((a, b) => b.length - a.length)[0]
    
  return bestMatch ? [bestMatch] : [path]
})

/** 获取菜单列表 */
async function fetchNavMenus() {
  try {
    const res = await fetch('/api/v1/system/menus/nav', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    const data = await res.json()
    if (data.code === 200) {
      menuList.value = data.data
    }
  } catch (err) {
    console.error('Fetch Menus Error:', err)
  }
}

// 面包屑数据
const breadcrumbs = computed(() => {
  const matched = route.matched
    .filter(item => item.meta?.title)
    .map(item => ({
      title: item.meta?.title as string,
      path: (item.path !== route.path && item.path !== '/') ? item.path : undefined,
    }))
  return matched.length > 0 ? matched : [{ title: '控制台' }]
})

// 用户头像缩写
const getUserInitials = computed(() => {
  const name = userStore.user?.name || '管理员'
  return name.slice(0, 1).toUpperCase()
})

// 标签页管理
const tabs = ref([
  { title: '控制台', path: '/' },
])

// 监听路由变化，更新标签页和展开菜单
watch(
  () => route.path,
  (newPath) => {
    // 1. 自动添加标签页
    const title = (route.meta?.title as string) || '未命名'
    const existingTab = tabs.value.find(tab => tab.path === newPath)
    if (!existingTab && !newPath.includes('create') && !newPath.includes('edit')) {
      tabs.value.push({ title, path: newPath })
    }

    // 2. 自动展开对应目录
    if (menuList.value.length > 0) {
      menuList.value.forEach(item => {
        if (item.menu_type === 'M' && item.children) {
          const hasChildMatch = item.children.some((child: any) => {
            const childKey = child.path.startsWith('/') ? child.path : (item.path.endsWith('/') ? item.path + child.path : item.path + '/' + child.path)
            return newPath.startsWith(childKey)
          })
          if (hasChildMatch && !openKeys.value.includes(item.id.toString())) {
            openKeys.value = [...openKeys.value, item.id.toString()]
          }
        }
      })
    }
  },
  { immediate: true }
)

// 关闭标签页
function closeTab(path: string) {
  const index = tabs.value.findIndex(tab => tab.path === path)
  if (index > -1) {
    tabs.value.splice(index, 1)
    if (route.path === path) {
      router.push(tabs.value[Math.max(0, index - 1)]?.path || '/')
    }
  }
}

// 菜单点击
function onMenuClick({ key }: { key: string }) {
  console.log('[AdminLayout] Menu clicked:', key, 'Current route:', route.path)
  if (key === route.path) {
    console.log('[AdminLayout] Already on this page, skipping push')
    return
  }
  router.push(key).catch(err => {
    console.error('[AdminLayout] Navigation failed:', err)
  })
}

// 展开菜单变化
function onOpenChange(keys: string[]) {
  openKeys.value = keys
}

// 显示通知
function showNotifications() {
  message.info('通知功能开发中...')
}

// 全屏切换
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}

// 刷新页面 - 使用 location.reload() 确保完整刷新
function refreshPage() {
  // 添加加载状态提示
  message.loading({ content: '正在刷新页面...', key: 'refresh', duration: 0 })
  
  // 使用 setTimeout 让用户看到提示后再刷新
  setTimeout(() => {
    window.location.reload()
  }, 300)
}

// 跳转个人中心
function goToProfile() {
  router.push('/admin/profile')
}

// 跳转设置
function goToSettings() {
  router.push('/admin/settings/general')
}

// 退出登录
function handleLogout() {
  Modal.confirm({
    title: '确认退出',
    content: '您确定要退出登录吗？',
    okText: '确认',
    cancelText: '取消',
    onOk: () => {
      userStore.logout()
    },
  })
}

// 响应式处理
function handleResize() {
  isMobile.value = window.innerWidth < 768
  if (window.innerWidth < 992) {
    collapsed.value = true
  }
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
  handleResize()
  fetchNavMenus()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.admin-layout {
  min-height: 100vh;
  width: 100vw;
  display: flex;
}

/* 侧边栏样式 - 固定定位 */
.sidebar {
  background: linear-gradient(180deg, #001529 0%, #002140 100%);
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
  z-index: 100;
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  overflow: auto;
}

/* 隐藏侧边栏滚动条但保持滚动功能 */
.sidebar::-webkit-scrollbar {
  display: none;
}

.sidebar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.sidebar :deep(.ant-layout-sider-children) {
  display: flex;
  flex-direction: column;
}

/* Logo区域 */
.logo {
  height: 64px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo-icon {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #1890ff 0%, #36cfc9 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.logo-text {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.logo-title {
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
}

.logo-subtitle {
  color: rgba(255, 255, 255, 0.6);
  font-size: 11px;
  line-height: 1.2;
  white-space: nowrap;
}

/* 菜单样式 */
.sidebar :deep(.ant-menu) {
  flex: 1;
  background: transparent;
  border-right: none;
}

.sidebar :deep(.ant-menu-item) {
  color: #ffffff !important;
  transition: all 0.3s;
}

.sidebar :deep(.ant-menu-item:hover),
.sidebar :deep(.ant-menu-submenu-title:hover) {
  color: #fff !important;
}

.sidebar :deep(.ant-menu-item-selected) {
  background-color: #1890ff !important;
  color: #fff !important;
}

/* 文字颜色增强 */
.sidebar :deep(.ant-menu-title-content) {
  color: inherit !important;
}

.sidebar :deep(.ant-menu-submenu-title) {
  color: #ffffff !important;
}

.sidebar :deep(.ant-menu-submenu-open) > .ant-menu-submenu-title {
  color: #fff !important;
}

.sidebar :deep(.ant-menu-sub) {
  background: rgba(0, 0, 0, 0.2) !important;
}

.menu-divider {
  background: rgba(255, 255, 255, 0.1);
  margin: 8px 16px;
}

/* 折叠按钮 */
.sidebar-footer {
  padding: 12px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.collapse-trigger {
  color: rgba(255, 255, 255, 0.6);
  font-size: 16px;
  text-align: center;
  cursor: pointer;
  transition: color 0.3s;
  padding: 8px 0;
}

.collapse-trigger:hover {
  color: #fff;
}

/* 主布局 - 避让固定侧边栏 */
.main-layout {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
  margin-left: 240px;
  transition: margin-left 0.2s;
}

/* 侧边栏折叠时的主布局偏移 */
.main-layout.sider-collapsed {
  margin-left: 80px;
}

/* 顶部导航栏 */
.header {
  background: #fff;
  padding: 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  height: 56px;
  position: sticky;
  top: 0;
  z-index: 50;
}

.header-left {
  display: flex;
  align-items: center;
}

.breadcrumb-current {
  color: #262626;
  font-weight: 500;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-action {
  cursor: pointer;
}

.header-icon {
  font-size: 18px;
  color: #595959;
  cursor: pointer;
  transition: color 0.3s;
}

.header-icon:hover {
  color: #1890ff;
}

.header-divider {
  height: 20px;
  margin: 0;
}

/* 用户下拉菜单 */
.user-dropdown {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  transition: background 0.3s;
}

.user-dropdown:hover {
  background: #f0f0f0;
}

.user-avatar {
  background: linear-gradient(135deg, #1890ff 0%, #36cfc9 100%);
  color: #fff;
  font-weight: 500;
}

.user-info {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.user-name {
  font-size: 14px;
  color: #262626;
  font-weight: 500;
}

.user-role {
  font-size: 11px;
  color: #8c8c8c;
}

.user-arrow {
  font-size: 12px;
  color: #8c8c8c;
}

/* 用户菜单 */
.user-menu {
  min-width: 180px;
}

.user-menu-header {
  padding: 12px 16px;
  background: #f5f7fa;
}

.user-menu-name {
  font-size: 14px;
  font-weight: 500;
  color: #262626;
}

.user-menu-role {
  font-size: 12px;
  color: #8c8c8c;
  margin-top: 4px;
}

/* 标签页导航 */
.tabs-nav {
  background: #fff;
  padding: 8px 24px 0;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
}

.tabs-scroll {
  display: flex;
  gap: 4px;
  overflow-x: auto;
  scrollbar-width: none;
}

.tabs-scroll::-webkit-scrollbar {
  display: none;
}

.tab-tag {
  cursor: pointer;
  user-select: none;
  background: #fafafa;
  border-color: #d9d9d9;
  color: #595959;
  padding: 4px 12px;
  border-radius: 4px 4px 0 0;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: -1px;
  position: relative;
  z-index: 1;
}

.tab-tag.active {
  background: #f5f7fa;
  border-color: #f0f0f0;
  border-bottom-color: #f5f7fa;
  color: #1890ff;
}

.tab-close {
  font-size: 10px;
  opacity: 0.5;
  transition: opacity 0.3s;
}

.tab-close:hover {
  opacity: 1;
}

/* 内容区域 */
.content {
  flex: 1;
  padding: 0;
  overflow: auto;
  min-height: calc(100vh - 56px - 48px);
}

.page-container {
  padding: 24px;
  max-width: 1920px;
  margin: 0 auto;
}

/* 页脚 */
.footer {
  background: #fff;
  padding: 16px 24px;
  text-align: center;
  border-top: 1px solid #f0f0f0;
}

.footer-content {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  color: #8c8c8c;
  font-size: 13px;
}

.footer-version {
  background: #f0f0f0;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .header-right {
    gap: 12px;
  }

  .user-info {
    display: none;
  }

  .page-container {
    padding: 16px;
  }
}
</style>

<style>
/* 全局样式覆盖 */
.admin-layout .ant-layout {
  width: 100% !important;
}

.admin-layout .ant-layout-content {
  width: 100% !important;
  max-width: none !important;
}
</style>
