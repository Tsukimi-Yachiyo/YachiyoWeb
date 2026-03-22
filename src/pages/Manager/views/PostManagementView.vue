<script setup>
import { ref, onMounted } from 'vue';
import { postAPI } from '../../../services/api';

const posts = ref([]);
const loading = ref(false);
const error = ref('');
const successMessage = ref('');

const fetchMyPosts = async () => {
  loading.value = true;
  error.value = '';
  successMessage.value = '';
  try {
    const response = await postAPI.getMyPosting();
    if (response.success) {
      // 假设返回的数据是帖子列表，这里需要根据实际API返回结构调整
      posts.value = response.data;
    } else {
      error.value = response.message || '获取帖子失败';
    }
  } catch (err) {
    error.value = err.message || '获取帖子失败';
  } finally {
    loading.value = false;
  }
};

const deletePost = async (postingId) => {
  if (!confirm('确定要删除这个帖子吗？')) {
    return;
  }
  
  loading.value = true;
  error.value = '';
  successMessage.value = '';
  try {
    const response = await postAPI.deletePosting(postingId);
    if (response.success) {
      successMessage.value = '帖子删除成功';
      // 重新获取帖子列表
      await fetchMyPosts();
    } else {
      error.value = response.message || '删除帖子失败';
    }
  } catch (err) {
    error.value = err.message || '删除帖子失败';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchMyPosts();
});
</script>

<template>
  <div class="post-management-container">
    <div class="page-header">
      <h1>作品管理</h1>
      <p>管理您发布的所有作品</p>
    </div>
    
    <!-- 消息提示 -->
    <div v-if="successMessage" class="message success-message">
      {{ successMessage }}
    </div>
    <div v-if="error" class="message error-message">
      {{ error }}
    </div>
    
    <!-- 帖子列表 -->
    <div class="posts-container">
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>
      
      <div v-else-if="posts.length === 0" class="empty-state">
        <div class="empty-icon">📝</div>
        <h3>暂无作品</h3>
        <p>您还没有发布任何作品</p>
      </div>
      
      <div v-else class="posts-list">
        <div v-for="post in posts" :key="post.id" class="post-item">
          <div class="post-info">
            <h3 class="post-title">{{ post.title || '无标题' }}</h3>
            <p class="post-meta">
              <span v-if="post.createdAt">{{ new Date(post.createdAt).toLocaleString() }}</span>
            </p>
          </div>
          <div class="post-actions">
            <button class="action-btn delete-btn" @click="deletePost(post.id)">
              删除
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.post-management-container {
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 30px;
  text-align: left;
}

.page-header h1 {
  color: #fff;
  font-size: 24px;
  font-weight: bold;
  margin: 0 0 10px 0;
}

.page-header p {
  color: rgba(255, 255, 255, 0.7);
  font-size: 16px;
  margin: 0;
}

.message {
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 14px;
}

.success-message {
  background: rgba(76, 175, 80, 0.2);
  color: #4CAF50;
  border: 1px solid rgba(76, 175, 80, 0.3);
}

.error-message {
  background: rgba(244, 67, 54, 0.2);
  color: #F44336;
  border: 1px solid rgba(244, 67, 54, 0.3);
}

.posts-container {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 20px;
  min-height: 400px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: rgba(255, 255, 255, 0.7);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid #64B5F6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-state h3 {
  font-size: 18px;
  margin: 0 0 8px 0;
  color: rgba(255, 255, 255, 0.7);
}

.empty-state p {
  font-size: 14px;
  margin: 0;
}

.posts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.post-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.post-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.post-info {
  flex: 1;
}

.post-title {
  color: #fff;
  font-size: 16px;
  font-weight: 500;
  margin: 0 0 8px 0;
}

.post-meta {
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
  margin: 0;
}

.post-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.delete-btn {
  background: rgba(244, 67, 54, 0.2);
  color: #F44336;
  border: 1px solid rgba(244, 67, 54, 0.3);
}

.delete-btn:hover {
  background: rgba(244, 67, 54, 0.3);
}
</style>