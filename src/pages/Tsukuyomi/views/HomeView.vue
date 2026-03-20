<script setup>
import { useRouter } from 'vue-router';
import { useIconManager } from '../../../composables/useIconManager.js';
import { computed } from 'vue';

const router = useRouter();

// 初始化图标管理器
const { checkIconCache } = useIconManager();

// 计算属性，用于获取编辑图标数据URL
const editIconUrl = computed(() => {
  const iconData = checkIconCache('edit.svg');
  return iconData ? `data:image/svg+xml;utf8,${encodeURIComponent(iconData)}` : '';
});

const goToPostEditor = () => {
  router.push('/tsukuyomi/post-editor');
};
</script>

<template>
  <div class="view-container">
    <h2>主页</h2>
    <p>这里是月读主页内容</p>
    <button class="edit-button" @click="goToPostEditor" title="编辑帖子">
      <img v-if="editIconUrl" :src="editIconUrl" alt="编辑帖子" style="width: 24px; height: 24px;" />
      <span v-else>编辑</span>
    </button>
  </div>
</template>

<style scoped>
.view-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.8);
  position: relative;
}

h2 {
  font-size: 24px;
  margin-bottom: 20px;
  background: linear-gradient(135deg, #fff 0%, #64B5F6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

p {
  font-size: 16px;
  margin: 0;
  margin-bottom: 30px;
}

.edit-button {
  position: absolute;
  top: 60px;
  right: 30px;
  background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
  color: white;
  border: none;
  border-radius: 50%;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(33, 150, 243, 0.3);
}

.edit-button:hover {
  background: linear-gradient(135deg, #1976D2 0%, #0D47A1 100%);
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 6px 20px rgba(33, 150, 243, 0.4);
}

.edit-button:active {
  transform: translateY(0) scale(0.95);
  box-shadow: 0 2px 10px rgba(33, 150, 243, 0.3);
}
</style>