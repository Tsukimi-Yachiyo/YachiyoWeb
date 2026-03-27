<script setup lang="ts">
  import { useRouter } from 'vue-router'
  import { useIconManager } from '../../../composables/useIconManager'
  import { computed, onMounted, ref } from 'vue'
  import { postAPI, userAPI } from '../../../services/api'
  import Post from '../../../components/Post/Post.vue'

  const router = useRouter()

  // 初始化图标管理器
  const { checkIconCache } = useIconManager()

  // 计算属性，用于获取编辑图标数据URL
  const editIconUrl = computed(() => {
    const iconData = checkIconCache('edit.svg')
    return iconData ? `data:image/svg+xml;utf8,${encodeURIComponent(iconData)}` : ''
  })

  const searchIconUrl = computed(() => {
    const iconData = checkIconCache('discovery.svg')
    return iconData ? `data:image/svg+xml;utf8,${encodeURIComponent(iconData)}` : ''
  })

  // 帖子数据
  const posts = ref<number[]>([])
  const loading = ref(false)
  const error = ref('')

  // 帖子详情数据
  interface PostDetailItem {
    id: number
    title: string
    posterId: number
    coverImage: string
    userName: string
    userAvatar: string | null
  }

  const postDetails = ref<PostDetailItem[]>([])
  const detailsLoading = ref(false)

  // 搜索关键词
  const searchKeyword = ref('')

  // 获取热门帖子
  const getHotPosts = async () => {
    loading.value = true
    error.value = ''
    try {
      const response = await postAPI.searchPosting('', 1, 12)
      if (response.success) {
        posts.value = response.data || []
        // 立即获取所有帖子的详情
        await fetchAllPostDetails()
      } else {
        error.value = response.message || '获取热门帖子失败'
      }
    } catch (err) {
      error.value = err.message || '网络错误'
    } finally {
      loading.value = false
    }
  }

  // 获取所有帖子的详情
  const fetchAllPostDetails = async () => {
    detailsLoading.value = true
    postDetails.value = []

    try {
      for (const postId of posts.value) {
        // 获取帖子简述
        const encapsulateResponse = await postAPI.getPostingEncapsulate(postId)
        if (encapsulateResponse.success && encapsulateResponse.data) {
          const postEncapsulate = encapsulateResponse.data

          // 获取发帖人详情
          let posterDetail = null
          if (postEncapsulate.posterId) {
            const posterResponse = await userAPI.getPosterDetail(postEncapsulate.posterId)
            if (posterResponse.success) {
              posterDetail = posterResponse.data
            }
          }

          // 添加到帖子详情列表
          postDetails.value.push({
            id: postId,
            title: postEncapsulate.title,
            posterId: postEncapsulate.posterId,
            coverImage: postEncapsulate.coverImage,
            userName: posterDetail?.userName || '未知用户',
            userAvatar: posterDetail?.userAvatar || null,
          })
        }
      }
    } catch (err) {
      console.error('获取帖子详情失败:', err)
    } finally {
      detailsLoading.value = false
    }
  }

  // 搜索帖子
  const searchPosts = async () => {
    loading.value = true
    error.value = ''
    try {
      const response = await postAPI.searchPosting(searchKeyword.value, 1, 12)
      if (response.success) {
        posts.value = response.data || []
        // 立即获取所有帖子的详情
        await fetchAllPostDetails()
      } else {
        error.value = response.message || '搜索帖子失败'
      }
    } catch (err) {
      error.value = err.message || '网络错误'
    } finally {
      loading.value = false
    }
  }

  // 进入帖子编辑页
  const goToPostEditor = () => {
    router.push('/tsukuyomi/post-editor')
  }

  // 进入帖子详情页
  const goToPostDetail = (postId: number) => {
    router.push(`/tsukuyomi/post/${postId}`)
  }

  // 计算属性：将帖子分为两行，单数索引在第一行，双数索引在第二行
  const firstRowPosts = computed(() => {
    return postDetails.value.filter((_, index) => index % 2 === 1) // 单数索引（从0开始）
  })

  const secondRowPosts = computed(() => {
    return postDetails.value.filter((_, index) => index % 2 === 0) // 双数索引（从0开始）
  })

  // 页面加载时获取热门帖子
  onMounted(() => {
    getHotPosts()
  })
</script>

<template>
  <div class="view-container">
    <!-- 搜索栏 -->
    <div class="search-container">
      <input
        v-model="searchKeyword"
        type="text"
        placeholder="搜索帖子..."
        class="search-input"
        @keyup.enter="searchPosts"
      />
      <button class="search-button" title="搜索" @click="searchPosts">
        <img
          v-if="searchIconUrl"
          :src="searchIconUrl"
          alt="搜索"
          style="width: 20px; height: 20px; filter: brightness(0) invert(1)"
        />
        <span v-else>搜索</span>
      </button>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading || detailsLoading" class="loading">
      <p>加载中...</p>
    </div>

    <!-- 错误信息 -->
    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
      <button class="retry-button" @click="getHotPosts">重试</button>
    </div>

    <!-- 帖子列表 -->
    <div v-else class="posts-wrapper">
      <div v-if="postDetails.length === 0" class="empty-posts">
        <p>暂无帖子</p>
      </div>
      <!-- 第一行：单数索引的帖子 -->
      <div class="row-container">
        <div
          v-for="post in firstRowPosts"
          :key="post.id"
          class="post-wrapper"
          @click="goToPostDetail(post.id)"
        >
          <Post
            :user-name="post.userName"
            :user-id="String(post.posterId)"
            :title="post.title"
            :post-id="String(post.id)"
            :user-avatar="post.userAvatar"
            :cover-image="post.coverImage"
          />
        </div>
      </div>
      <!-- 第二行：双数索引的帖子 -->
      <div class="row-container">
        <div
          v-for="post in secondRowPosts"
          :key="post.id"
          class="post-wrapper"
          @click="goToPostDetail(post.id)"
        >
          <Post
            :user-name="post.userName"
            :user-id="String(post.posterId)"
            :title="post.title"
            :post-id="String(post.id)"
            :user-avatar="post.userAvatar"
            :cover-image="post.coverImage"
          />
        </div>
      </div>
    </div>

    <button class="edit-button" title="编辑帖子" @click="goToPostEditor">
      <img v-if="editIconUrl" :src="editIconUrl" alt="编辑帖子" style="width: 24px; height: 24px" />
      <span v-else>编辑</span>
    </button>
  </div>
</template>

<style scoped>
  @reference "tailwindcss";

  .view-container {
    @apply w-full h-full;
  }

  /* 搜索栏容器 */
  .search-container {
    @apply flex items-center gap-3 w-full max-w-3xl mx-auto p-5 z-10;
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  /* 搜索输入框 */
  .search-input {
    flex: 1;
    padding: 12px 16px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.1);
    color: white;
    font-size: 16px;
    outline: none;
    transition: all 0.3s ease;
  }

  .search-input:focus {
    border-color: #2196f3;
    background: rgba(255, 255, 255, 0.15);
    box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
  }

  .search-input::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  /* 搜索按钮 */
  .search-button {
    padding: 12px 24px;
    background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 16px;
  }

  .search-button:hover {
    background: linear-gradient(135deg, #1976d2 0%, #0d47a1 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
  }

  /* 加载状态 */
  .loading {
    padding: 40px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.1);
    margin: 40px 0;
    text-align: center;
  }

  /* 错误信息 */
  .error {
    padding: 20px;
    border-radius: 8px;
    background: rgba(255, 87, 34, 0.2);
    border: 1px solid rgba(255, 87, 34, 0.4);
    margin: 20px 0;
    text-align: center;
  }

  .retry-button {
    margin-top: 10px;
    padding: 8px 16px;
    background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .retry-button:hover {
    background: linear-gradient(135deg, #f57c00 0%, #e65100 100%);
    transform: translateY(-1px);
  }

  /* 空帖子状态 */
  .empty-posts {
    padding: 60px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.1);
    text-align: center;
    margin: 40px 0;
    width: 100%;
    max-width: 800px;
  }

  /* 帖子网格 */
  .posts-grid {
    width: 100%;
    max-width: 1400px;
    margin: 20px 0;
  }

  /* 帖子包装器 */
  .post-wrapper {
    cursor: pointer;
    transition: transform 0.3s ease;
    animation: slideInRight 0.6s ease forwards;
    opacity: 0;
    transform: translateX(100%);
    width: fit-content;
    overflow: visible;
    position: relative;
  }

  .post-wrapper:hover {
    transform: translateY(-4px);
  }

  /* 帖子滑入动画 */
  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(100%);
    }

    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  /* 帖子过渡动画 */
  .post-enter-active {
    animation: slideInRight 0.6s ease forwards;
  }

  .post-leave-active {
    animation: slideOutLeft 0.6s ease forwards;
  }

  @keyframes slideOutLeft {
    from {
      opacity: 1;
      transform: translateX(0);
    }

    to {
      opacity: 0;
      transform: translateX(-100%);
    }
  }

  /* 帖子容器 */
  .posts-wrapper {
    @apply flex flex-col items-center;
    width: 100%;
    max-width: 1400px;
    display: flex;
    flex-direction: column;
    gap: 32px;
    margin: 20px 0;
  }

  /* 行容器 */
  .row-container {
    display: flex;
    gap: 32px;
    flex-wrap: nowrap;
    overflow-x: visible;
    overflow-y: visible;
    padding-bottom: 10px;
  }

  /* 行容器滚动条 */
  .row-container::-webkit-scrollbar {
    height: 6px;
  }

  .row-container::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 3px;
  }

  .row-container::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }

  .row-container::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  /* 编辑按钮 */
  .edit-button {
    position: fixed;
    top: 150px;
    right: 30px;
    background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
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
    z-index: 100;
  }

  .edit-button:hover {
    background: linear-gradient(135deg, #1976d2 0%, #0d47a1 100%);
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 6px 20px rgba(33, 150, 243, 0.4);
  }

  .edit-button:active {
    transform: translateY(0) scale(0.95);
    box-shadow: 0 2px 10px rgba(33, 150, 243, 0.3);
  }

  /* 响应式设计 */
  @media (max-width: 768px) {
    .search-container {
      flex-direction: column;
      align-items: stretch;
    }

    .search-button {
      width: 100%;
    }

    .posts-grid {
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }
  }

  @media (max-width: 480px) {
    .view-container {
      padding: 10px;
    }

    .posts-grid {
      grid-template-columns: 1fr;
      gap: 16px;
    }

    .edit-button {
      bottom: 20px;
      right: 20px;
      width: 50px;
      height: 50px;
    }
  }
</style>
