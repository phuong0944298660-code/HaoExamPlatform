<template>
  <div class="blank-layout">
    <router-view />
  </div>
</template>

<script setup lang="ts">
// 空白布局，用于 iframe、外链等不需要侧边栏和顶部导航的页面
</script>

<style scoped>
.blank-layout {
  width: 100%;
  min-height: 100vh;
  background: #f5f7fa;
}
</style>
