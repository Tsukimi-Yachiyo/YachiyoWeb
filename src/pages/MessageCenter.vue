<template>
  <div class="message-container">
    <h2>📬 消息中心</h2>
    
    <div class="tabs-header">
      <div 
        class="tab-item" 
        :class="{ active: activeTab === 'PRIVATE' }" 
        @click="handleTabClick('PRIVATE')"
      >
        私信
      </div>
      <div 
        class="tab-item" 
        :class="{ active: activeTab === 'NOTICE' }" 
        @click="handleTabClick('NOTICE')"
      >
        系统通知
      </div>
      <div 
        class="tab-item" 
        :class="{ active: activeTab === 'COMMENT' }" 
        @click="handleTabClick('COMMENT')"
      >
        留言回复
      </div>
    </div>

    <div class="tabs-content">
      <div v-if="mailList.length === 0" class="empty-tip">暂无消息</div>

      <div class="mail-item" v-for="mail in mailList" :key="mail.id">
        <div class="mail-header">
          <span class="mail-title">
            <span v-if="activeTab === 'NOTICE'">🔔 </span>
            {{ mail.title || '无标题' }}
          </span>
        </div>
        <div class="mail-content">{{ mail.content }}</div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

interface MailMessage {
  id: number;
  title?: string;
  content: string;
}

const activeTab = ref<string>('PRIVATE');
const mailList = ref<MailMessage[]>([]);

// 模拟去后端拿数据的过程
const fetchMails = (type: string) => {
  if (type === 'PRIVATE') {
    mailList.value = [
      { id: 1, title: '项目进度', content: '网站邮箱功能做完了吗？' },
      { id: 2, title: '打个招呼', content: '你好呀，这是我的第一行代码！' }
    ];
  } else if (type === 'NOTICE') {
    mailList.value = [
      { id: 3, title: '系统更新', content: 'YachiyoWeb 新版本发布啦！' }
    ];
  } else {
    mailList.value = []; 
  }
};

const handleTabClick = (tabName: string) => {
  activeTab.value = tabName; // 切换高亮的标签
  fetchMails(tabName);       // 去拿对应标签的数据
};

// 页面刚打开时，自动加载默认的私信数据
onMounted(() => {
  fetchMails(activeTab.value);
});
</script>

<style scoped>
.message-container {
  max-width: 800px;
  margin: 20px auto;
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

/* --- 手写 Tab 导航栏的美化样式 --- */
.tabs-header {
  display: flex;
  border-bottom: 2px solid #e4e7ed;
  margin-bottom: 20px;
}

.tab-item {
  padding: 10px 20px;
  cursor: pointer;
  font-size: 16px;
  color: #909399;
  transition: all 0.3s;
  margin-bottom: -2px; /* 往下挪一点点，用来盖住底部的灰线 */
  border-bottom: 2px solid transparent;
}

.tab-item:hover {
  color: #409eff; /* 鼠标放上去变蓝 */
}

.tab-item.active {
  color: #409eff;
  border-bottom: 2px solid #409eff; /* 选中的时候底部有一条蓝线 */
  font-weight: bold;
}

/* --- 消息列表的样式 --- */
.mail-item {
  padding: 15px;
  border-bottom: 1px solid #ebeef5;
}
.mail-title {
  font-weight: bold;
  font-size: 16px;
  color: #303133;
}
.mail-content {
  font-size: 14px;
  color: #606266;
  margin-top: 8px;
}
.empty-tip {
  text-align: center;
  color: #909399;
  padding: 30px 0;
}
</style>