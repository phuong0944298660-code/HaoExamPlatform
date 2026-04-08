<template>
  <a-layout class="student-layout">
    <a-layout-header class="header">
      <div class="header-content">
        <div class="logo">🎓 接力教育智慧云平台</div>
        <div class="header-right">
          <span class="user-info">{{ userStore.user?.name || userStore.user?.username || '学生' }}</span>
          <a-button type="text" @click="userStore.logout()" style="color: #fff">退出</a-button>
        </div>
      </div>
    </a-layout-header>
    <a-layout-content class="content">
      <router-view />
    </a-layout-content>
  </a-layout>
</template>

<script setup lang="ts">
import { useUserStore } from '@/store/user'
const userStore = useUserStore()
</script>

<style scoped>
.student-layout { 
  min-height: 100vh; 
  width: 100vw;
  display: flex;
  flex-direction: column;
}
.header { 
  background: #1890ff; 
  padding: 0 24px;
  flex-shrink: 0;
}
.header-content { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  height: 64px;
  max-width: 100%;
}
.logo { 
  color: #fff; 
  font-size: 18px; 
  font-weight: bold; 
}
.header-right { 
  display: flex; 
  align-items: center; 
  gap: 12px; 
}
.user-info { 
  color: #fff; 
}
.content { 
  flex: 1;
  padding: 24px; 
  background: #f0f2f5;
  min-height: calc(100vh - 64px);
  width: 100%;
  box-sizing: border-box;
  overflow: auto;
}
</style>

<style>
/* 全局覆盖Ant Design Vue默认样式 */
.student-layout .ant-layout {
  width: 100% !important;
}
.student-layout .ant-layout-content {
  width: 100% !important;
  max-width: none !important;
}
</style>
