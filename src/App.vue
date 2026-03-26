<script setup>
  import { useIconManager } from './composables/useIconManager'

  // 初始化图标管理器，自动预加载图标
  useIconManager()
</script>

<template src="./templates/App.html"></template>

<style src="./styles/App.css"></style>
