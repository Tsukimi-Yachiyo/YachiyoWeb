<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { useIconManager } from '../composables/useIconManager'
  import { adminAPI } from '../services/api'

  // 初始化图标管理器
  const { checkIconCache } = useIconManager()

  // 计算属性，用于获取图标数据URL
  const homeIconUrl = computed(() => {
    const iconData = checkIconCache('home.svg')
    return iconData ? `data:image/svg+xml;utf8,${encodeURIComponent(iconData)}` : ''
  })

  const settingsIconUrl = computed(() => {
    const iconData = checkIconCache('settings.svg')
    return iconData ? `data:image/svg+xml;utf8,${encodeURIComponent(iconData)}` : ''
  })

  const logoutIconUrl = computed(() => {
    const iconData = checkIconCache('logout.svg')
    return iconData ? `data:image/svg+xml;utf8,${encodeURIComponent(iconData)}` : ''
  })

  const router = useRouter()
  const route = useRoute()

  // 状态管理
  const isLoggedIn = ref(false)
  const username = ref('')
  const password = ref('')
  const isLoading = ref(false)
  const successMessage = ref('')
  const errorMessage = ref('')
  const files = ref<File[]>([])
  const pendingPosts = ref<any[]>([])
  const isLoadingPosts = ref(false)
  const showPostDetail = ref(false)
  const selectedPost = ref<any>(null)

  // 导航项
  const navItems = [
    { id: 'dashboard', label: '仪表盘', icon: '📊', path: '/admin/dashboard' },
    { id: 'posts', label: '帖子管理', icon: '📝', path: '/admin/posts' },
    { id: 'upload', label: '资源上传', icon: '📁', path: '/admin/upload' },
  ]

  // 当前选中的导航项
  const currentNavItem = computed(() => {
    const path = route.path
    const navItem = navItems.find(item => path.includes(item.id))
    return navItem ? navItem.id : 'dashboard'
  })

  // 导航栏激活状态
  const isNavActive = ref(false)

  // 检查登录状态
  const checkLoginStatus = () => {
    const token = localStorage.getItem('adminToken')
    isLoggedIn.value = !!token
  }

  // 登录
  const handleLogin = async () => {
    if (!username.value || !password.value) {
      errorMessage.value = '请输入用户名和密码'
      return
    }

    isLoading.value = true
    successMessage.value = ''
    errorMessage.value = ''

    try {
      const response = await adminAPI.login(username.value, password.value)
      if (response.code === '200') {
        localStorage.setItem('adminToken', response.data)
        isLoggedIn.value = true
        successMessage.value = '登录成功'
        router.push('/admin/dashboard')
      } else {
        errorMessage.value = response.message || '登录失败'
      }
    } catch (error) {
      errorMessage.value = error.message || '网络错误'
    } finally {
      isLoading.value = false
    }
  }

  // 登出
  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    isLoggedIn.value = false
    router.push('/admin')
  }

  // 处理文件变化
  const handleFileChange = (event: Event) => {
    const input = event.target as HTMLInputElement | null
    files.value = input?.files ? Array.from(input.files) : []
  }

  // 上传文件
  const handleUpload = async () => {
    if (files.value.length === 0) {
      errorMessage.value = '请选择文件'
      return
    }

    isLoading.value = true
    successMessage.value = ''
    errorMessage.value = ''

    try {
      const response = await adminAPI.uploadFiles(files.value)
      if (response.code === '200') {
        successMessage.value = '文件上传成功'
        files.value = []
        // 清空文件输入
        const fileInput = document.getElementById('fileInput') as HTMLInputElement | null
        if (fileInput) {
          fileInput.value = ''
        }
      } else {
        errorMessage.value = response.message || '上传失败'
      }
    } catch (error) {
      errorMessage.value = error.message || '网络错误'
    } finally {
      isLoading.value = false
    }
  }

  // 获取待审核帖子
  const getPendingPosts = async () => {
    isLoadingPosts.value = true
    errorMessage.value = ''

    try {
      const response = await adminAPI.getPendingPosts()
      if (response.code === '200') {
        pendingPosts.value = response.data
      } else {
        errorMessage.value = response.message || '获取帖子失败'
      }
    } catch (error) {
      errorMessage.value = error.message || '网络错误'
    } finally {
      isLoadingPosts.value = false
    }
  }

  // 审核帖子
  const reviewPost = async (postingId: number, action: string) => {
    isLoading.value = true
    successMessage.value = ''
    errorMessage.value = ''

    try {
      const response = await adminAPI.reviewPost(postingId, action)
      if (response.code === '200') {
        successMessage.value = '审核成功'
        // 重新获取待审核帖子
        await getPendingPosts()
      } else {
        errorMessage.value = response.message || '审核失败'
      }
    } catch (error) {
      errorMessage.value = error.message || '网络错误'
    } finally {
      isLoading.value = false
    }
  }

  // 显示帖子详情
  const goToPostDetail = (postingId: number) => {
    const post = pendingPosts.value.find(p => p.id === postingId)
    if (post) {
      selectedPost.value = post
      showPostDetail.value = true
    }
  }

  // 关闭帖子详情
  const closePostDetail = () => {
    showPostDetail.value = false
    selectedPost.value = null
  }

  // 切换导航项
  const selectNavItem = (path: string) => {
    router.push(path)
  }

  // 激活导航栏
  const activateNav = () => {
    isNavActive.value = true
  }

  // 失活导航栏
  const deactivateNav = () => {
    isNavActive.value = false
  }

  // 组件挂载时检查登录状态
  onMounted(() => {
    checkLoginStatus()
    if (isLoggedIn.value && route.path.includes('/posts')) {
      getPendingPosts()
    }
  })
</script>

<template>
  <div class="admin-container">
    <!-- 登录页面 -->
    <div v-if="!isLoggedIn" class="login-container">
      <div class="login-panel">
        <div class="login-header">
          <h1>管理员登录</h1>
          <p>请输入管理员账号和密码</p>
        </div>

        <div class="login-form">
          <div class="form-group">
            <label for="username">用户名</label>
            <input
              id="username"
              v-model="username"
              type="text"
              class="form-input"
              placeholder="请输入用户名"
            />
          </div>

          <div class="form-group">
            <label for="password">密码</label>
            <input
              id="password"
              v-model="password"
              type="password"
              class="form-input"
              placeholder="请输入密码"
            />
          </div>

          <button class="login-btn" :disabled="isLoading" @click="handleLogin">
            <span v-if="isLoading" class="loading-spinner"></span>
            <span v-else>登录</span>
          </button>
        </div>
        <!-- 消息提示 -->
        <Message
          v-if="successMessage"
          type="success"
          :message="successMessage"
          :auto-close="3000"
          @close="successMessage = ''"
        />
        <Message
          v-if="errorMessage"
          type="error"
          :message="errorMessage"
          :auto-close="3000"
          @close="errorMessage = ''"
        />
      </div>
    </div>

    <!-- 管理页面 -->
    <div v-else class="admin-dashboard">
      <!-- 顶部导航栏 -->
      <div class="admin-header">
        <div class="header-left">
          <h1>管理中心</h1>
        </div>
        <div class="header-right">
          <button class="logout-btn" @click="handleLogout">
            <img
              v-if="logoutIconUrl"
              :src="logoutIconUrl"
              alt="登出"
              style="width: 18px; height: 18px"
            />
            <span>登出</span>
          </button>
        </div>
      </div>

      <!-- 主内容区 -->
      <div class="main-content" @mouseenter="deactivateNav">
        <!-- 仪表盘 -->
        <div v-if="currentNavItem === 'dashboard'" class="dashboard-content">
          <div class="dashboard-cards">
            <div class="dashboard-card">
              <div class="card-icon">📝</div>
              <div class="card-content">
                <h3>待审核帖子</h3>
                <p>{{ pendingPosts.length }}</p>
                <button class="card-btn" @click="selectNavItem('/admin/posts')">查看</button>
              </div>
            </div>
            <div class="dashboard-card">
              <div class="card-icon">📁</div>
              <div class="card-content">
                <h3>资源管理</h3>
                <p>上传 RAG 资源</p>
                <button class="card-btn" @click="selectNavItem('/admin/upload')">管理</button>
              </div>
            </div>
            <div class="dashboard-card">
              <div class="card-icon">⚙️</div>
              <div class="card-content">
                <h3>系统设置</h3>
                <p>API 密钥管理</p>
                <button class="card-btn">配置</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 帖子管理 -->
        <div v-else-if="currentNavItem === 'posts'" class="posts-content">
          <div class="posts-header">
            <h2>帖子审核</h2>
            <button class="refresh-btn" :disabled="isLoadingPosts" @click="getPendingPosts">
              <span v-if="isLoadingPosts" class="loading-spinner"></span>
              <span v-else>刷新</span>
            </button>
          </div>

          <div class="posts-list">
            <div v-if="isLoadingPosts" class="loading-state">
              <span class="loading-spinner"></span>
              <p>加载中...</p>
            </div>
            <div v-else-if="pendingPosts.length === 0" class="empty-state">
              <p>暂无待审核帖子</p>
            </div>
            <div v-for="post in pendingPosts" v-else :key="post.id" class="post-item">
              <div class="post-info" @click="goToPostDetail(post.id)">
                <h3 class="post-title">{{ post.title }}</h3>
                <p class="post-content">
                  {{
                    post.content
                      ? post.content.length > 200
                        ? post.content.substring(0, 200) + '...'
                        : post.content
                      : '（无内容）'
                  }}
                </p>
                <div class="post-meta">
                  <span>用户 ID: {{ post.userId }}</span>
                  <span>{{ post.createTime }}</span>
                </div>
              </div>
              <div class="post-actions">
                <button
                  class="action-btn approve-btn"
                  :disabled="isLoading"
                  @click="reviewPost(post.id, 'APPROVE')"
                >
                  通过
                </button>
                <button
                  class="action-btn reject-btn"
                  :disabled="isLoading"
                  @click="reviewPost(post.id, 'REJECT')"
                >
                  拒绝
                </button>
                <button
                  class="action-btn delete-btn"
                  :disabled="isLoading"
                  @click="reviewPost(post.id, 'DELETE')"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 资源上传 -->
        <div v-else-if="currentNavItem === 'upload'" class="upload-content">
          <div class="upload-section">
            <div class="upload-area">
              <input
                id="fileInput"
                type="file"
                multiple
                class="file-input"
                @change="handleFileChange"
              />
              <label for="fileInput" class="file-label">
                <div class="upload-icon">📁</div>
                <div class="upload-text">
                  <p>点击或拖拽文件到此处</p>
                  <p class="upload-hint">支持上传多个文件，用于 RAG 知识库</p>
                </div>
                <div v-if="files.length > 0" class="file-list">
                  <div v-for="(file, index) in files" :key="index" class="file-item">
                    <span class="file-name">{{ file.name }}</span>
                    <span class="file-size">{{ (file.size / 1024).toFixed(2) }} KB</span>
                  </div>
                </div>
              </label>
            </div>

            <button
              class="upload-btn"
              :disabled="isLoading || files.length === 0"
              @click="handleUpload"
            >
              <span v-if="isLoading" class="loading-spinner"></span>
              <span v-else>上传文件</span>
            </button>
          </div>
        </div>

        <!-- 消息提示 -->
        <Message
          v-if="successMessage"
          type="success"
          :message="successMessage"
          :auto-close="3000"
          @close="successMessage = ''"
        />
        <Message
          v-if="errorMessage"
          type="error"
          :message="errorMessage"
          :auto-close="3000"
          @close="errorMessage = ''"
        />
      </div>

      <!-- 底部导航按钮组 -->
      <div class="bottom-nav-container" @mouseenter="activateNav">
        <nav class="nav-buttons" :class="{ active: isNavActive }">
          <div
            v-for="item in navItems"
            :key="item.id"
            :class="['nav-button', { active: currentNavItem === item.id }]"
            @click="selectNavItem(item.path)"
          >
            <span class="nav-icon">{{ item.icon }}</span>
            <span class="nav-tooltip">{{ item.label }}</span>
          </div>
        </nav>
      </div>

      <!-- 帖子详情模态框 -->
      <div v-if="showPostDetail && selectedPost" class="post-detail-modal">
        <div class="modal-overlay" @click="closePostDetail"></div>
        <div class="modal-content">
          <div class="modal-header">
            <h2>{{ selectedPost.title }}</h2>
            <button class="close-btn" @click="closePostDetail">×</button>
          </div>
          <div class="modal-body">
            <div class="post-content-full">
              <p v-if="selectedPost.content">{{ selectedPost.content }}</p>
              <p v-else class="empty-content">（无内容）</p>
            </div>
            <div class="post-meta-detail">
              <p><strong>帖子ID:</strong> {{ selectedPost.id }}</p>
              <p><strong>用户ID:</strong> {{ selectedPost.userId }}</p>
              <p><strong>创建时间:</strong> {{ selectedPost.createTime }}</p>
            </div>
          </div>
          <div class="modal-footer">
            <button
              class="action-btn approve-btn"
              :disabled="isLoading"
              @click="reviewPost(selectedPost.id, 'APPROVE')"
            >
              通过审核
            </button>
            <button
              class="action-btn reject-btn"
              :disabled="isLoading"
              @click="reviewPost(selectedPost.id, 'REJECT')"
            >
              拒绝审核
            </button>
            <button
              class="action-btn delete-btn"
              :disabled="isLoading"
              @click="reviewPost(selectedPost.id, 'DELETE')"
            >
              删除帖子
            </button>
            <button class="action-btn cancel-btn" @click="closePostDetail">关闭</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .admin-container {
    display: flex;
    flex-direction: column;
    width: 100vw;
    height: 100vh;
    background: linear-gradient(135deg, #1a237e 0%, #0d1642 100%);
    overflow: hidden;
    position: relative;
  }

  /* 登录容器 */
  .login-container {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  .login-panel {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 40px;
    max-width: 400px;
    width: 100%;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    animation: fadeIn 0.5s ease;
  }

  .login-header {
    text-align: center;
    margin-bottom: 30px;
  }

  .login-header h1 {
    color: #fff;
    font-size: 28px;
    font-weight: bold;
    margin: 0 0 10px 0;
    background: linear-gradient(135deg, #fff 0%, #64b5f6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .login-header p {
    color: rgba(255, 255, 255, 0.7);
    font-size: 16px;
    margin: 0;
  }

  /* 登录表单 */
  .login-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .form-group label {
    color: rgba(255, 255, 255, 0.8);
    font-size: 14px;
    font-weight: 500;
  }

  .form-input {
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: #fff;
    font-size: 16px;
    transition: all 0.3s ease;
  }

  .form-input:focus {
    outline: none;
    border-color: rgba(33, 150, 243, 0.5);
    box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
  }

  .form-input::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }

  .login-btn {
    padding: 15px 30px;
    background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
    color: white;
    border: none;
    border-radius: 25px;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 20px rgba(33, 150, 243, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-top: 20px;
  }

  .login-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(33, 150, 243, 0.5);
  }

  .login-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  /* 管理仪表盘 */
  .admin-dashboard {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
  }

  /* 顶部导航栏 */
  .admin-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    background: rgba(255, 255, 255, 0.03);
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  .header-left h1 {
    color: #fff;
    font-size: 20px;
    font-weight: bold;
    margin: 0;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 15px;
  }

  .logout-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    background: rgba(244, 67, 54, 0.7);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .logout-btn:hover {
    background: rgba(244, 67, 54, 0.9);
    transform: translateY(-1px);
  }

  /* 主内容区 */
  .main-content {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    position: relative;
    transition: all 0.3s ease;
  }

  /* 仪表盘内容 */
  .dashboard-content {
    width: 100%;
    max-width: 1000px;
  }

  .dashboard-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
  }

  .dashboard-card {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 30px;
    transition: all 0.3s ease;
    cursor: pointer;
  }

  .dashboard-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
    border-color: rgba(33, 150, 243, 0.3);
  }

  .card-icon {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.8;
  }

  .card-content h3 {
    color: #fff;
    font-size: 18px;
    font-weight: bold;
    margin: 0 0 8px 0;
  }

  .card-content p {
    color: rgba(255, 255, 255, 0.7);
    font-size: 14px;
    margin: 0 0 20px 0;
  }

  .card-btn {
    padding: 10px 20px;
    background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
    color: white;
    border: none;
    border-radius: 20px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .card-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(33, 150, 243, 0.4);
  }

  /* 帖子管理 */
  .posts-content {
    width: 100%;
    max-width: 800px;
  }

  .posts-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .posts-header h2 {
    color: #fff;
    font-size: 20px;
    font-weight: bold;
    margin: 0;
  }

  .refresh-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    background: rgba(33, 150, 243, 0.7);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .refresh-btn:hover:not(:disabled) {
    background: rgba(33, 150, 243, 0.9);
    transform: translateY(-1px);
  }

  .refresh-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .posts-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
    max-height: 600px;
    overflow-y: auto;
    padding-right: 10px;
  }

  .post-item {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 20px;
    transition: all 0.3s ease;
  }

  .post-item:hover {
    border-color: rgba(33, 150, 243, 0.3);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  }

  .post-info {
    cursor: pointer;
    margin-bottom: 15px;
  }

  .post-title {
    color: #fff;
    font-size: 16px;
    font-weight: bold;
    margin: 0 0 8px 0;
    line-height: 1.4;
  }

  .post-content {
    color: rgba(255, 255, 255, 0.7);
    font-size: 14px;
    margin: 0 0 12px 0;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .post-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: rgba(255, 255, 255, 0.5);
    font-size: 12px;
  }

  .post-actions {
    display: flex;
    gap: 10px;
    margin-top: 15px;
    padding-top: 15px;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
  }

  .action-btn {
    flex: 1;
    padding: 8px 12px;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s ease;
    text-align: center;
  }

  .approve-btn {
    background: rgba(76, 175, 80, 0.7);
    color: white;
  }

  .approve-btn:hover:not(:disabled) {
    background: rgba(76, 175, 80, 0.9);
  }

  .reject-btn {
    background: rgba(255, 152, 0, 0.7);
    color: white;
  }

  .reject-btn:hover:not(:disabled) {
    background: rgba(255, 152, 0, 0.9);
  }

  .delete-btn {
    background: rgba(244, 67, 54, 0.7);
    color: white;
  }

  .delete-btn:hover:not(:disabled) {
    background: rgba(244, 67, 54, 0.9);
  }

  .action-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* 资源上传 */
  .upload-content {
    width: 100%;
    max-width: 600px;
  }

  .upload-section {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .upload-area {
    position: relative;
    margin-bottom: 20px;
  }

  .file-input {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
    z-index: 10;
  }

  .file-label {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    border: 2px dashed rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.03);
    cursor: pointer;
    transition: all 0.3s ease;
    min-height: 200px;
  }

  .file-label:hover {
    border-color: rgba(33, 150, 243, 0.5);
    background: rgba(33, 150, 243, 0.1);
    transform: translateY(-2px);
  }

  .upload-icon {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.7;
  }

  .upload-text {
    text-align: center;
    color: rgba(255, 255, 255, 0.7);
  }

  .upload-text p {
    margin: 5px 0;
    font-size: 16px;
  }

  .upload-hint {
    font-size: 14px !important;
    opacity: 0.6;
  }

  /* 文件列表 */
  .file-list {
    width: 100%;
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .file-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 15px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    margin-bottom: 8px;
    font-size: 14px;
  }

  .file-name {
    color: #fff;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .file-size {
    color: rgba(255, 255, 255, 0.6);
    margin-left: 15px;
    font-size: 12px;
  }

  /* 上传按钮 */
  .upload-btn {
    padding: 15px 30px;
    background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
    color: white;
    border: none;
    border-radius: 25px;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 20px rgba(33, 150, 243, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }

  .upload-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(33, 150, 243, 0.5);
  }

  .upload-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  /* 加载状态 */
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    color: rgba(255, 255, 255, 0.7);
  }

  .loading-state p {
    margin-top: 15px;
    font-size: 16px;
  }

  .empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    color: rgba(255, 255, 255, 0.5);
    font-size: 16px;
  }

  /* 加载动画 */
  .loading-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* 消息提示 */
  .message {
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 14px;
    text-align: center;
    margin-top: 20px;
    animation: fadeIn 0.3s ease;
  }

  .success-message {
    background: rgba(76, 175, 80, 0.2);
    color: #4caf50;
    border: 1px solid rgba(76, 175, 80, 0.3);
  }

  .error-message {
    background: rgba(244, 67, 54, 0.2);
    color: #f44336;
    border: 1px solid rgba(244, 67, 54, 0.3);
  }

  /* 底部导航容器 */
  .bottom-nav-container {
    position: fixed;
    bottom: 30px;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    z-index: 200;
    cursor: pointer;
  }

  /* 导航按钮组 */
  .nav-buttons {
    display: flex;
    gap: 16px;
    align-items: center;
    justify-content: center;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    padding: 10px;
    position: relative;
    height: 80px;
  }

  /* 未激活状态下的横向直线排列 */
  .nav-buttons .nav-button {
    align-self: center;
    margin-top: 0;
  }

  /* 导航按钮 - 未激活状态 */
  .nav-button {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    cursor: pointer;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    opacity: 0.7;
  }

  /* 导航按钮 - 激活状态 */
  .nav-buttons.active .nav-button {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    opacity: 1;
    box-shadow: 0 8px 25px rgba(33, 150, 243, 0.3);
  }

  /* 激活状态下的三角结构 */
  .nav-buttons.active .nav-button:nth-child(1),
  .nav-buttons.active .nav-button:nth-child(3) {
    transform: translateY(-10px);
  }

  .nav-buttons.active .nav-button:nth-child(2) {
    transform: translateY(-30px);
    margin-top: 0;
  }

  /* 导航按钮 - 激活状态悬停 */
  .nav-buttons.active .nav-button:hover {
    background: rgba(255, 255, 255, 0.15);
    box-shadow: 0 10px 30px rgba(33, 150, 243, 0.4);
  }

  /* 悬停时的三角结构调整 */
  .nav-buttons.active .nav-button:nth-child(1):hover,
  .nav-buttons.active .nav-button:nth-child(3):hover {
    transform: translateY(-15px);
  }

  .nav-buttons.active .nav-button:nth-child(2):hover {
    transform: translateY(-35px);
  }

  /* 导航按钮 - 选中状态 */
  .nav-button.active {
    background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
    box-shadow: 0 4px 15px rgba(33, 150, 243, 0.4);
  }

  /* 选中状态下的三角结构调整 */
  .nav-buttons.active .nav-button:nth-child(1).active {
    transform: translateY(-15px);
  }

  .nav-buttons.active .nav-button:nth-child(2).active {
    transform: translateY(-35px);
  }

  .nav-buttons.active .nav-button:nth-child(3).active {
    transform: translateY(-15px);
  }

  /* 导航图标 */
  .nav-icon {
    font-size: 16px;
    color: rgba(255, 255, 255, 0.7);
    transition: all 0.3s ease;
    opacity: 0;
    transform: translateY(10px);
  }

  .nav-buttons.active .nav-icon {
    opacity: 1;
    transform: translateY(0);
    font-size: 20px;
    color: #fff;
  }

  .nav-button.active .nav-icon {
    color: #fff;
  }

  /* 悬停提示 */
  .nav-tooltip {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8);
    color: #fff;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
    margin-bottom: 8px;
    z-index: 1000;
  }

  /* 悬停提示箭头 */
  .nav-tooltip::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border-width: 4px;
    border-style: solid;
    border-color: rgba(0, 0, 0, 0.8) transparent transparent transparent;
  }

  /* 鼠标悬停时显示提示 */
  .nav-button:hover .nav-tooltip {
    opacity: 1;
    visibility: visible;
    transform: translateX(-50%) translateY(-4px);
  }

  /* 动画 */
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* 响应式设计 */
  @media (max-width: 768px) {
    /* 登录面板 */
    .login-panel {
      padding: 30px 20px;
      margin: 20px;
    }

    .login-header h1 {
      font-size: 24px;
    }

    /* 仪表盘卡片 */
    .dashboard-cards {
      grid-template-columns: 1fr;
    }

    /* 主内容区 */
    .main-content {
      padding: 15px;
    }

    /* 帖子管理 */
    .posts-content {
      max-width: 100%;
    }

    .post-actions {
      flex-direction: column;
    }

    /* 资源上传 */
    .upload-content {
      max-width: 100%;
    }

    .file-label {
      padding: 30px 15px;
      min-height: 180px;
    }

    .upload-icon {
      font-size: 36px;
    }

    .upload-text p {
      font-size: 14px;
    }

    /* 导航按钮组 - 移动端调整 */
    .nav-buttons {
      gap: 12px;
      height: 70px;
    }

    /* 导航按钮 - 移动端调整 */
    .nav-buttons.active .nav-button {
      width: 50px;
      height: 50px;
    }

    /* 激活状态下的三角结构 - 移动端调整 */
    .nav-buttons.active .nav-button:nth-child(1),
    .nav-buttons.active .nav-button:nth-child(3) {
      transform: translateY(-8px);
    }

    .nav-buttons.active .nav-button:nth-child(2) {
      transform: translateY(-25px);
    }

    /* 悬停时的三角结构调整 - 移动端调整 */
    .nav-buttons.active .nav-button:nth-child(1):hover,
    .nav-buttons.active .nav-button:nth-child(3):hover {
      transform: translateY(-12px);
    }

    .nav-buttons.active .nav-button:nth-child(2):hover {
      transform: translateY(-29px);
    }

    /* 选中状态下的三角结构调整 - 移动端调整 */
    .nav-buttons.active .nav-button:nth-child(1).active {
      transform: translateY(-12px);
    }

    .nav-buttons.active .nav-button:nth-child(2).active {
      transform: translateY(-29px);
    }

    .nav-buttons.active .nav-button:nth-child(3).active {
      transform: translateY(-12px);
    }

    .nav-buttons.active .nav-icon {
      font-size: 18px;
    }
  }

  @media (max-width: 480px) {
    .login-header h1 {
      font-size: 20px;
    }

    .login-panel {
      padding: 25px 15px;
    }

    /* 导航按钮组 - 小屏调整 */
    .nav-buttons {
      gap: 10px;
      height: 60px;
    }

    /* 导航按钮 - 小屏调整 */
    .nav-buttons.active .nav-button {
      width: 45px;
      height: 45px;
    }

    /* 激活状态下的三角结构 - 小屏调整 */
    .nav-buttons.active .nav-button:nth-child(1),
    .nav-buttons.active .nav-button:nth-child(3) {
      transform: translateY(-6px);
    }

    .nav-buttons.active .nav-button:nth-child(2) {
      transform: translateY(-20px);
    }

    /* 悬停时的三角结构调整 - 小屏调整 */
    .nav-buttons.active .nav-button:nth-child(1):hover,
    .nav-buttons.active .nav-button:nth-child(3):hover {
      transform: translateY(-10px);
    }

    .nav-buttons.active .nav-button:nth-child(2):hover {
      transform: translateY(-24px);
    }

    /* 选中状态下的三角结构调整 - 小屏调整 */
    .nav-buttons.active .nav-button:nth-child(1).active {
      transform: translateY(-10px);
    }

    .nav-buttons.active .nav-button:nth-child(2).active {
      transform: translateY(-24px);
    }

    .nav-buttons.active .nav-button:nth-child(3).active {
      transform: translateY(-10px);
    }

    .nav-buttons.active .nav-icon {
      font-size: 16px;
    }
  }

  @media (min-width: 769px) and (max-width: 1024px) {
    /* 仪表盘卡片 */
    .dashboard-cards {
      grid-template-columns: repeat(2, 1fr);
    }

    /* 导航按钮 - 平板调整 */
    .nav-buttons.active .nav-button {
      width: 55px;
      height: 55px;
    }

    /* 激活状态下的三角结构 - 平板调整 */
    .nav-buttons.active .nav-button:nth-child(1),
    .nav-buttons.active .nav-button:nth-child(3) {
      transform: translateY(-9px);
    }

    .nav-buttons.active .nav-button:nth-child(2) {
      transform: translateY(-28px);
    }

    /* 悬停时的三角结构调整 - 平板调整 */
    .nav-buttons.active .nav-button:nth-child(1):hover,
    .nav-buttons.active .nav-button:nth-child(3):hover {
      transform: translateY(-14px);
    }

    .nav-buttons.active .nav-button:nth-child(2):hover {
      transform: translateY(-33px);
    }

    /* 选中状态下的三角结构调整 - 平板调整 */
    .nav-buttons.active .nav-button:nth-child(1).active {
      transform: translateY(-14px);
    }

    .nav-buttons.active .nav-button:nth-child(2).active {
      transform: translateY(-33px);
    }

    .nav-buttons.active .nav-button:nth-child(3).active {
      transform: translateY(-14px);
    }

    .nav-buttons.active .nav-icon {
      font-size: 19px;
    }
  }

  /* 滚动条样式 */
  ::-webkit-scrollbar {
    width: 6px;
  }

  ::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 3px;
  }

  ::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  /* 帖子详情模态框 */
  .post-detail-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .modal-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(5px);
  }

  .modal-content {
    position: relative;
    background: rgba(26, 35, 126, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    width: 90%;
    max-width: 800px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    animation: modalFadeIn 0.3s ease;
    overflow: hidden;
  }

  @keyframes modalFadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .modal-header {
    padding: 20px 30px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(0, 0, 0, 0.2);
  }

  .modal-header h2 {
    color: #fff;
    font-size: 20px;
    font-weight: bold;
    margin: 0;
    flex: 1;
  }

  .close-btn {
    background: rgba(244, 67, 54, 0.3);
    color: #fff;
    border: none;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    font-size: 20px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
  }

  .close-btn:hover {
    background: rgba(244, 67, 54, 0.7);
    transform: rotate(90deg);
  }

  .modal-body {
    flex: 1;
    padding: 30px;
    overflow-y: auto;
  }

  .post-content-full {
    color: rgba(255, 255, 255, 0.9);
    font-size: 16px;
    line-height: 1.6;
    margin-bottom: 30px;
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  .empty-content {
    color: rgba(255, 255, 255, 0.5);
    font-style: italic;
    text-align: center;
    padding: 20px;
  }

  .post-meta-detail {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 20px;
  }

  .post-meta-detail p {
    color: rgba(255, 255, 255, 0.7);
    margin: 10px 0;
    font-size: 14px;
    display: flex;
  }

  .post-meta-detail strong {
    color: #fff;
    min-width: 100px;
    font-weight: 500;
  }

  .modal-footer {
    padding: 20px 30px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    gap: 15px;
    background: rgba(0, 0, 0, 0.2);
  }

  .modal-footer .action-btn {
    flex: 1;
    padding: 12px;
    font-size: 14px;
    border-radius: 8px;
  }

  .cancel-btn {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .cancel-btn:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  @media (max-width: 768px) {
    .modal-content {
      width: 95%;
      max-height: 85vh;
    }

    .modal-header {
      padding: 15px 20px;
    }

    .modal-header h2 {
      font-size: 18px;
    }

    .modal-body {
      padding: 20px;
    }

    .modal-footer {
      padding: 15px 20px;
      flex-wrap: wrap;
    }

    .modal-footer .action-btn {
      flex: 1 1 calc(50% - 10px);
      min-width: calc(50% - 10px);
    }

    .post-content-full {
      font-size: 14px;
    }
  }
</style>
