<script setup lang="ts">
  import { ref, onMounted, computed } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { useUserProfile } from '@/composables/useUserProfile'
  import { useIconManager } from '@/composables/useIconManager'
  import { processImageData } from '@/composables/useImageData'
  import { postAPI, userAPI, commentAPI } from '@/services/api'
  import { marked } from 'marked'

  // 初始化图标管理器
  const { checkIconCache } = useIconManager()

  // 计算属性，用于获取图标数据URL
  const backIconUrl = computed(() => {
    const iconData = checkIconCache('arrow-left.svg')
    return iconData ? `data:image/svg+xml;utf8,${encodeURIComponent(iconData)}` : ''
  })

  const likeIconUrl = computed(() => {
    const iconData = checkIconCache('heart.svg')
    return iconData ? `data:image/svg+xml;utf8,${encodeURIComponent(iconData)}` : ''
  })

  const collectionIconUrl = computed(() => {
    const iconData = checkIconCache('bookmark.svg')
    return iconData ? `data:image/svg+xml;utf8,${encodeURIComponent(iconData)}` : ''
  })

  const router = useRouter()
  const route = useRoute()
  const { username, userAvatar, loadUserDetail } = useUserProfile()

  // 加载用户详情
  loadUserDetail()

  // 帖子数据
  const postData = ref(null)
  const postInfo = ref(null) // 帖子简介信息
  const posterDetail = ref(null) // 发帖人详情
  const loading = ref(true)
  const error = ref(null)

  // 点赞和收藏状态
  const isLiked = ref(false)
  const isCollected = ref(false)
  const likeCount = ref(0)
  const collectionCount = ref(0)
  const actionLoading = ref(false)

  // 评论相关
  const comments = ref([])
  const commentContent = ref('')
  const commentLoading = ref(false)
  const commentError = ref('')
  const submittingComment = ref(false)

  // 获取帖子ID
  const postId = computed<number>(() => Number(route.params.post_id))

  // 计算属性，用于渲染 markdown 内容并处理多媒体
  const renderedContent = computed(() => {
    if (!postData.value || !postData.value.content) return ''

    let content = postData.value.content
    console.log('原始内容:', content)
    console.log('文件名列表:', postData.value.filenames)
    console.log('文件数量:', postData.value.files?.length)

    // 处理多媒体标记，如 {photo:"合成 1~1.gif"}
    content = content.replace(/\{photo:"([^"]+)"\}/g, (match, filename) => {
      console.log('匹配到多媒体标记:', match)
      console.log('提取的文件名:', filename)

      // 查找对应的文件索引
      const fileIndex = postData.value.filenames?.indexOf(filename)
      console.log('文件索引:', fileIndex)
      console.log('文件名列表:', postData.value.filenames)

      if (fileIndex !== undefined && fileIndex !== -1 && postData.value.files[fileIndex]) {
        console.log('文件数据类型:', typeof postData.value.files[fileIndex])
        console.log('文件数据长度:', postData.value.files[fileIndex].length)
        console.log('文件数据前10个元素:', postData.value.files[fileIndex].slice(0, 10))

        try {
          // 尝试不同的方式处理图片数据
          let imageUrl = ''
          const fileData = postData.value.files[fileIndex]

          if (typeof fileData === 'string') {
            // 如果是 Base64 字符串
            console.log('文件数据是字符串')
            if (fileData.startsWith('data:')) {
              imageUrl = fileData
            } else {
              imageUrl = `data:image/gif;base64,${fileData}`
            }
          } else if (Array.isArray(fileData)) {
            // 如果是数组
            console.log('文件数据是数组')
            // 尝试转换为 Base64
            const uint8Array = new Uint8Array(fileData)
            const binary = String.fromCharCode(...uint8Array)
            const base64 = btoa(binary)
            imageUrl = `data:image/gif;base64,${base64}`
          }

          console.log('生成的图片URL:', imageUrl)
          return `<img src="${imageUrl}" alt="${filename}" class="post-media-image" />`
        } catch (error) {
          console.error('处理图片数据失败:', error)
          return match
        }
      }
      return match
    })

    console.log('处理后的内容:', content)
    return marked(content)
  })

  // 加载帖子详情
  const loadPostDetail = async () => {
    try {
      loading.value = true
      error.value = null

      // 获取帖子详情
      const result = await postAPI.getPosting(postId.value)
      if (result.success) {
        postData.value = result.data
      } else {
        error.value = result.message || '获取帖子失败'
        return
      }

      // 获取帖子简介信息
      const encapsulateResponse = await postAPI.getPostingEncapsulate(postId.value)
      if (encapsulateResponse.success && encapsulateResponse.data) {
        postInfo.value = encapsulateResponse.data

        // 获取发帖人详情
        if (postInfo.value.posterId) {
          const posterResponse = await userAPI.getPosterDetail(postInfo.value.posterId)
          if (posterResponse.success) {
            posterDetail.value = posterResponse.data
          }
        }
      }

      // 获取帖子的点赞数和收藏数
      await loadPostStats()

      // 加载评论列表
      await loadComments()
    } catch (err) {
      console.error('加载帖子详情失败:', err)
      error.value = err.message || '网络错误'
    } finally {
      loading.value = false
    }
  }

  // 加载帖子的点赞数、收藏数和状态
  const loadPostStats = async () => {
    try {
      // 获取点赞数
      const likeResponse = await postAPI.getLikeCount(postId.value)
      if (likeResponse.success) {
        likeCount.value = likeResponse.data || 0
      }

      // 获取收藏数
      const collectionResponse = await postAPI.getCollectionCount(postId.value)
      if (collectionResponse.success) {
        collectionCount.value = collectionResponse.data || 0
      }

      // 获取点赞状态
      const likeStatusResponse = await postAPI.isLiked(postId.value)
      if (likeStatusResponse.success) {
        isLiked.value = likeStatusResponse.data || false
      }

      // 获取收藏状态
      const collectStatusResponse = await postAPI.isCollected(postId.value)
      if (collectStatusResponse.success) {
        isCollected.value = collectStatusResponse.data || false
      }
    } catch (err) {
      console.error('加载帖子统计数据失败:', err)
    }
  }

  // 处理返回
  const handleBack = () => {
    router.back()
  }

  // 处理点赞
  const handleLike = async () => {
    if (actionLoading.value) return

    actionLoading.value = true
    try {
      if (isLiked.value) {
        // 取消点赞
        const response = await postAPI.cancelLikePosting(postId.value)
        if (response.success) {
          isLiked.value = false
          likeCount.value = Math.max(0, likeCount.value - 1)
        }
      } else {
        // 点赞
        const response = await postAPI.likePosting(postId.value)
        if (response.success) {
          isLiked.value = true
          likeCount.value += 1
        }
      }
    } catch (err) {
      console.error('处理点赞失败:', err)
    } finally {
      actionLoading.value = false
    }
  }

  // 处理收藏
  const handleCollection = async () => {
    if (actionLoading.value) return

    actionLoading.value = true
    try {
      if (isCollected.value) {
        // 取消收藏
        const response = await postAPI.cancelCollectionPosting(postId.value)
        if (response.success) {
          isCollected.value = false
          collectionCount.value = Math.max(0, collectionCount.value - 1)
        }
      } else {
        // 收藏
        const response = await postAPI.collectionPosting(postId.value)
        if (response.success) {
          isCollected.value = true
          collectionCount.value += 1
        }
      }
    } catch (err) {
      console.error('处理收藏失败:', err)
    } finally {
      actionLoading.value = false
    }
  }

  // 加载评论列表
  const loadComments = async () => {
    try {
      commentLoading.value = true
      commentError.value = ''
      const response = await commentAPI.getCommentList(postId.value)
      if (response.success) {
        // 获取评论者的头像和昵称
        const commentsWithUserInfo = await Promise.all(
          response.data.map(async comment => {
            let userInfo = { userName: '未知用户', userAvatar: null }
            if (comment.userId) {
              try {
                const userResponse = await userAPI.getPosterDetail(comment.userId)
                if (userResponse.success && userResponse.data) {
                  userInfo = {
                    userName: userResponse.data.userName || '未知用户',
                    userAvatar: userResponse.data.userAvatar || null,
                  }
                }
              } catch (err) {
                console.error('获取评论者信息失败:', err)
              }
            }
            return {
              ...comment,
              ...userInfo,
            }
          })
        )
        comments.value = commentsWithUserInfo
      } else {
        commentError.value = response.message || '获取评论失败'
      }
    } catch (err) {
      console.error('加载评论失败:', err)
      commentError.value = err.message || '网络错误'
    } finally {
      commentLoading.value = false
    }
  }

  // 提交评论
  const submitComment = async () => {
    if (!commentContent.value.trim() || submittingComment.value) return
    try {
      submittingComment.value = true
      const commentRequest = {
        postingId: postId.value,
        content: commentContent.value.trim(),
      }
      const response = await commentAPI.addComment(commentRequest)
      if (response.success) {
        // 清空评论内容
        commentContent.value = ''
        // 重新加载评论列表
        await loadComments()
      } else {
        commentError.value = response.message || '提交评论失败'
      }
    } catch (err) {
      console.error('提交评论失败:', err)
      commentError.value = err.message || '网络错误'
    } finally {
      submittingComment.value = false
    }
  }

  // 删除评论
  const deleteComment = async commentId => {
    if (confirm('确定要删除这条评论吗？')) {
      try {
        const response = await commentAPI.deleteComment(commentId)
        if (response.success) {
          // 重新加载评论列表
          await loadComments()
        } else {
          commentError.value = response.message || '删除评论失败'
        }
      } catch (err) {
        console.error('删除评论失败:', err)
        commentError.value = err.message || '网络错误'
      }
    }
  }

  // 组件挂载时加载帖子详情和评论
  onMounted(() => {
    loadPostDetail()
  })

  // 将byte[]转换为图片URL
  const getImageUrl = byteArray => {
    if (!byteArray) return ''
    const blob = new Blob([new Uint8Array(byteArray)], { type: 'image/jpeg' })
    return URL.createObjectURL(blob)
  }
</script>

<template>
  <div class="post-detail-container">
    <!-- 主内容区 -->
    <div class="main-content">
      <div class="content-area">
        <!-- 顶部操作栏 -->
        <div class="top-bar">
          <button class="back-button" @click="handleBack">
            <img :src="backIconUrl" alt="返回" class="back-icon" />
          </button>
          <h1 class="page-title">{{ postInfo?.title || '帖子详情' }}</h1>
          <!-- 用户名和头像 -->
          <div v-if="posterDetail" class="user-info">
            <span class="user-name">{{ posterDetail?.userName || '未知用户' }}</span>
            <img
              v-if="posterDetail?.userAvatar"
              :src="processImageData(posterDetail.userAvatar)"
              alt="用户头像"
              class="user-avatar"
            />
            <span v-else class="user-avatar-placeholder">{{
              posterDetail?.userName?.charAt(0).toUpperCase() || 'U'
            }}</span>
          </div>
        </div>

        <!-- 加载状态 -->
        <div v-if="loading" class="loading-container">
          <div class="loading-spinner"></div>
          <p class="loading-text">加载中...</p>
        </div>

        <!-- 错误状态 -->
        <div v-else-if="error" class="error-container">
          <p class="error-message">{{ error }}</p>
          <button class="retry-button" @click="loadPostDetail">重试</button>
        </div>

        <!-- 帖子内容和评论 -->
        <div v-else-if="postData">
          <!-- 帖子内容 -->
          <div class="post-content">
            <!-- 帖子文本内容 -->
            <div class="post-text" v-html="renderedContent"></div>

            <!-- 点赞和收藏按钮 -->
            <div class="post-actions">
              <button
                class="action-button like-button"
                :class="{ active: isLiked }"
                :disabled="actionLoading"
                @click="handleLike"
              >
                <img
                  v-if="likeIconUrl"
                  :src="likeIconUrl"
                  alt="点赞"
                  class="action-icon"
                  style="width: 16px; height: 16px; filter: brightness(0) invert(1)"
                />
                <span v-else class="action-icon">❤️</span>
                <span class="action-count">{{ likeCount }}</span>
              </button>
              <button
                class="action-button collection-button"
                :class="{ active: isCollected }"
                :disabled="actionLoading"
                @click="handleCollection"
              >
                <img
                  v-if="collectionIconUrl"
                  :src="collectionIconUrl"
                  alt="收藏"
                  class="action-icon"
                  style="width: 16px; height: 16px; filter: brightness(0) invert(1)"
                />
                <span v-else class="action-icon">⭐</span>
                <span class="action-count">{{ collectionCount }}</span>
              </button>
            </div>
          </div>

          <!-- 评论区域 -->
          <div class="comments-section">
            <h3 class="comments-title">评论</h3>

            <!-- 评论输入框 -->
            <div class="comment-input-container">
              <img
                v-if="userAvatar"
                :src="userAvatar"
                alt="用户头像"
                class="comment-input-avatar"
              />
              <span v-else class="comment-input-avatar-placeholder">{{
                username?.charAt(0).toUpperCase() || 'U'
              }}</span>
              <div class="comment-input-wrapper">
                <textarea
                  v-model="commentContent"
                  placeholder="写下你的评论..."
                  class="comment-input"
                  rows="3"
                ></textarea>
                <button
                  class="comment-submit-button"
                  :disabled="!commentContent.trim() || submittingComment"
                  @click="submitComment"
                >
                  {{ submittingComment ? '提交中...' : '发布' }}
                </button>
              </div>
            </div>

            <!-- 评论错误信息 -->
            <div v-if="commentError" class="comment-error">
              {{ commentError }}
            </div>

            <!-- 评论加载状态 -->
            <div v-if="commentLoading" class="comment-loading">
              <div class="loading-spinner small"></div>
              <span>加载评论中...</span>
            </div>

            <!-- 评论列表 -->
            <div v-else class="comments-list">
              <div v-if="comments.length === 0" class="no-comments">
                暂无评论，快来发表第一条评论吧！
              </div>
              <div v-for="comment in comments" :key="comment.id" class="comment-item">
                <img
                  v-if="comment.userAvatar"
                  :src="processImageData(comment.userAvatar)"
                  alt="用户头像"
                  class="comment-avatar"
                />
                <span v-else class="comment-avatar-placeholder">{{
                  comment.userName?.charAt(0).toUpperCase() || 'U'
                }}</span>
                <div class="comment-content">
                  <div class="comment-header">
                    <span class="comment-username">{{ comment.userName }}</span>
                    <button
                      v-if="username === comment.userName"
                      class="comment-delete-button"
                      @click="deleteComment(comment.id)"
                    >
                      删除
                    </button>
                  </div>
                  <div class="comment-text">{{ comment.content }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else class="empty-container">
          <p class="empty-message">帖子不存在</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .post-detail-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  /* 主内容区 */
  .main-content {
    flex: 1;
    overflow: hidden;
    position: relative;
    display: flex;
    flex-direction: column;
    transition: all 0.3s ease;
  }

  /* 内容展示区域 */
  .content-area {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    margin-top: 20px;
  }

  /* 顶部操作栏 */
  .top-bar {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .back-button {
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 8px;
    margin-right: 16px;
    border-radius: 50%;
    transition: all 0.3s ease;
  }

  .back-button:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .back-icon {
    width: 24px;
    height: 24px;
    filter: brightness(0) invert(1);
  }

  .page-title {
    font-size: 24px;
    font-weight: 600;
    color: #fff;
    margin: 0;
    flex: 1;
  }

  /* 用户信息 */
  .user-info {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: 16px;
  }

  .user-name {
    font-size: 14px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.9);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 120px;
  }

  .user-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .user-avatar-placeholder {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 14px;
    font-weight: 600;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  /* 加载状态 */
  .loading-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.7);
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-top: 3px solid #2196f3;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .loading-text {
    font-size: 16px;
    margin: 0;
  }

  /* 错误状态 */
  .error-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.7);
  }

  .error-message {
    font-size: 16px;
    margin-bottom: 16px;
    text-align: center;
  }

  .retry-button {
    background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
    border: none;
    border-radius: 8px;
    padding: 10px 20px;
    color: #fff;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .retry-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(33, 150, 243, 0.4);
  }

  /* 帖子内容 */
  .post-content {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 20px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    position: relative;
  }

  .post-text {
    font-size: 16px;
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.9);
    margin-bottom: 20px;
    white-space: pre-wrap;
    word-break: break-word;
  }

  /* Markdown 样式 */
  .post-text h1,
  .post-text h2,
  .post-text h3,
  .post-text h4,
  .post-text h5,
  .post-text h6 {
    color: #fff;
    margin: 20px 0 10px 0;
    font-weight: 600;
  }

  .post-text h1 {
    font-size: 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    padding-bottom: 8px;
  }

  .post-text h2 {
    font-size: 20px;
  }

  .post-text h3 {
    font-size: 18px;
  }

  .post-text p {
    margin: 10px 0;
  }

  .post-text a {
    color: #2196f3;
    text-decoration: none;
    transition: color 0.3s ease;
  }

  .post-text a:hover {
    color: #64b5f6;
    text-decoration: underline;
  }

  .post-text ul,
  .post-text ol {
    margin: 10px 0;
    padding-left: 24px;
  }

  .post-text li {
    margin: 5px 0;
  }

  .post-text blockquote {
    border-left: 4px solid #2196f3;
    padding-left: 16px;
    margin: 16px 0;
    color: rgba(255, 255, 255, 0.7);
    font-style: italic;
  }

  .post-text code {
    background: rgba(255, 255, 255, 0.1);
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Courier New', Courier, monospace;
    font-size: 14px;
  }

  .post-text pre {
    background: rgba(255, 255, 255, 0.05);
    padding: 16px;
    border-radius: 8px;
    overflow-x: auto;
    margin: 16px 0;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .post-text pre code {
    background: transparent;
    padding: 0;
    font-size: 14px;
  }

  .post-text img,
  .post-media-image {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    margin: 16px 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  .post-media-image {
    display: block;
  }

  /* 评论区域 */
  .comments-section {
    margin-top: 40px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 20px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  }

  .comments-title {
    font-size: 18px;
    font-weight: 600;
    color: #fff;
    margin: 0 0 20px 0;
    padding-bottom: 10px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  /* 评论输入框 */
  .comment-input-container {
    display: flex;
    gap: 12px;
    margin-bottom: 24px;
  }

  .comment-input-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
    border: 1px solid rgba(255, 255, 255, 0.2);
    flex-shrink: 0;
  }

  .comment-input-avatar-placeholder {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 16px;
    font-weight: 600;
    border: 1px solid rgba(255, 255, 255, 0.2);
    flex-shrink: 0;
  }

  .comment-input-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .comment-input {
    width: 100%;
    padding: 12px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
    font-size: 14px;
    resize: vertical;
    min-height: 80px;
    max-height: 200px;
  }

  .comment-input::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  .comment-input:focus {
    outline: none;
    border-color: #2196f3;
    background: rgba(255, 255, 255, 0.15);
    box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
  }

  .comment-submit-button {
    align-self: flex-end;
    padding: 8px 16px;
    background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
    color: #fff;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .comment-submit-button:hover:not(:disabled) {
    background: linear-gradient(135deg, #1976d2 0%, #0d47a1 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
  }

  .comment-submit-button:disabled {
    background: rgba(255, 255, 255, 0.2);
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  /* 评论错误信息 */
  .comment-error {
    color: #ff5722;
    font-size: 14px;
    margin-bottom: 16px;
    padding: 8px 12px;
    background: rgba(255, 87, 34, 0.2);
    border-radius: 6px;
    border: 1px solid rgba(255, 87, 34, 0.4);
  }

  /* 评论加载状态 */
  .comment-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    color: rgba(255, 255, 255, 0.7);
    gap: 8px;
  }

  .loading-spinner.small {
    width: 24px;
    height: 24px;
    border-width: 2px;
  }

  /* 评论列表 */
  .comments-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .no-comments {
    text-align: center;
    color: rgba(255, 255, 255, 0.6);
    padding: 40px 20px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    border: 1px dashed rgba(255, 255, 255, 0.2);
  }

  .comment-item {
    display: flex;
    gap: 12px;
    padding: 16px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.3s ease;
  }

  .comment-item:hover {
    background: rgba(255, 255, 255, 0.08);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  .comment-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    object-fit: cover;
    border: 1px solid rgba(255, 255, 255, 0.2);
    flex-shrink: 0;
  }

  .comment-avatar-placeholder {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 14px;
    font-weight: 600;
    border: 1px solid rgba(255, 255, 255, 0.2);
    flex-shrink: 0;
  }

  .comment-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .comment-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .comment-username {
    font-size: 14px;
    font-weight: 600;
    color: #fff;
  }

  .comment-delete-button {
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.6);
    font-size: 12px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    transition: all 0.3s ease;
  }

  .comment-delete-button:hover {
    background: rgba(255, 87, 34, 0.2);
    color: #ff5722;
  }

  .comment-text {
    font-size: 14px;
    line-height: 1.5;
    color: rgba(255, 255, 255, 0.8);
    white-space: pre-wrap;
    word-break: break-word;
  }

  /* 帖子图片 */
  .post-images {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 12px;
    margin-top: 16px;
  }

  .image-item {
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    transition: all 0.3s ease;
  }

  .image-item:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  }

  .post-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  /* 帖子操作按钮 */
  .post-actions {
    position: absolute;
    bottom: 20px;
    right: 20px;
    display: flex;
    gap: 12px;
    margin-top: 20px;
  }

  .action-button {
    display: flex;
    align-items: center;
    gap: 6px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 20px;
    padding: 8px 16px;
    color: rgba(255, 255, 255, 0.9);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
  }

  .action-button:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .action-button.active {
    background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
    border-color: #2196f3;
    color: #fff;
  }

  .action-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .action-icon {
    font-size: 16px;
  }

  .action-count {
    font-size: 14px;
    font-weight: 500;
  }

  /* 空状态 */
  .empty-container {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.7);
  }

  .empty-message {
    font-size: 18px;
    margin: 0;
  }

  /* 滚动条样式 */
  .content-area::-webkit-scrollbar {
    width: 6px;
  }

  .content-area::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 3px;
  }

  .content-area::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }

  .content-area::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  /* 响应式设计 */
  @media (max-width: 768px) {
    .content-area {
      padding: 16px;
    }

    .page-title {
      font-size: 20px;
    }

    .post-content {
      padding: 16px;
    }

    .post-text {
      font-size: 15px;
    }

    .post-images {
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 10px;
    }
  }

  @media (max-width: 480px) {
    .content-area {
      padding: 12px;
    }

    .page-title {
      font-size: 18px;
    }

    .post-content {
      padding: 12px;
    }

    .post-text {
      font-size: 14px;
    }

    .post-images {
      grid-template-columns: 1fr;
      gap: 8px;
    }
  }
</style>
