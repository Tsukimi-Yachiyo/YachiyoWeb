<script setup lang="ts">
  import { computed } from 'vue'
  import { useRouter, useRoute } from 'vue-router'

  type ManagerTab = 'post' | 'user'

  const router = useRouter()
  const route = useRoute()

  const activeTab = computed<ManagerTab>(() =>
    route.path.includes('/manager/user') ? 'user' : 'post'
  )

  const switchTab = (tab: ManagerTab) => {
    if (tab === 'post') {
      void router.push('/manager/post')
      return
    }

    void router.push('/manager/user')
  }
</script>

<template>
  <div class="manager-container">
    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 侧边栏导航 -->
      <div class="sidebar">
        <div class="sidebar-header">
          <h2>管理中心</h2>
        </div>
        <div class="sidebar-menu">
          <button
            class="menu-item"
            :class="{ active: activeTab === 'post' }"
            @click="switchTab('post')"
          >
            作品管理
          </button>
          <button
            class="menu-item"
            :class="{ active: activeTab === 'user' }"
            @click="switchTab('user')"
          >
            神明（用户管理）
          </button>
        </div>
      </div>

      <!-- 内容展示区域 -->
      <div class="content-area">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .manager-container {
    display: flex;
    width: 100%;
    height: calc(100vh - 80px);
    min-height: calc(100vh - 80px);
    background: linear-gradient(135deg, #1a237e 0%, #0d1642 100%);
    overflow: hidden;
  }

  .main-content {
    display: flex;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .sidebar {
    width: 200px;
    flex-shrink: 0;
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border-right: 1px solid rgba(255, 255, 255, 0.1);
    padding: 20px 0;
    overflow-y: auto;
  }

  .sidebar-header {
    padding: 0 20px 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .sidebar-header h2 {
    color: #fff;
    font-size: 18px;
    font-weight: bold;
    margin: 0;
  }

  .sidebar-menu {
    margin-top: 20px;
  }

  .menu-item {
    width: 100%;
    padding: 12px 20px;
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.7);
    font-size: 14px;
    text-align: left;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .menu-item:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }

  .menu-item.active {
    background: rgba(255, 255, 255, 0.15);
    color: #64b5f6;
    border-left: 3px solid #64b5f6;
  }

  .content-area {
    flex: 1;
    min-width: 0;
    padding: 30px;
    overflow-y: auto;
  }

  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.3s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
</style>
