<script setup lang="ts">
  import { defineAsyncComponent, computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { useIconManager } from '../../composables/useIconManager'
  import { postAPI, userAPI } from '../../services/api'
  import { processImageData } from '../../composables/useImageData'

  const AsyncPost = defineAsyncComponent(() => import('../../components/Post/Post.vue'))

  const router = useRouter()
  const route = useRoute()
  const { checkIconCache } = useIconManager()

  const backIconUrl = computed(() => {
    const iconData = checkIconCache('arrow-left.svg')
    return iconData ? `data:image/svg+xml;utf8,${encodeURIComponent(iconData)}` : ''
  })

  const userId = computed<number>(() => Number(route.params.user_id))

  const userDetail = ref<{ userName: string; userAvatar: string | null } | null>(null)
  const userPublicDetail = ref<{
    userIntroduction?: string
    userCity?: string
    userGender?: string
  } | null>(null)
  const isFollowing = ref(false)
  const followCount = ref(0)
  const followerCount = ref(0)
  const loading = ref(true)
  const followingActionLoading = ref(false)

  const feedItems = ref<any[]>([])
  const feedLoading = ref(false)
  const loadedIdSet = new Set<number>()
  let sentinelObserver: IntersectionObserver | null = null
  let cardObserver: IntersectionObserver | null = null
  const cardElementMap = new Map<number, HTMLElement>()
  const postsGridRef = ref<HTMLElement | null>(null)
  const sentinelRef = ref<HTMLElement | null>(null)

  const setCardRef = (postId: number, el: Element | null) => {
    const previous = cardElementMap.get(postId)
    if (previous && cardObserver) {
      cardObserver.unobserve(previous)
      cardElementMap.delete(postId)
    }
    if (!el) return
    const element = el as HTMLElement
    element.dataset.postId = String(postId)
    cardElementMap.set(postId, element)
    if (cardObserver) {
      cardObserver.observe(element)
    }
    void nextTick().then(() => {
      relayoutMasonry()
    })
  }

  const relayoutMasonry = () => {
    if (!postsGridRef.value) return
    const grid = postsGridRef.value
    const style = window.getComputedStyle(grid)
    const rowHeight = Number.parseFloat(style.getPropertyValue('grid-auto-rows'))
    const rowGap = Number.parseFloat(style.getPropertyValue('row-gap'))
    if (!rowHeight) return
    cardElementMap.forEach(element => {
      const cardHeight = element.getBoundingClientRect().height
      const span = Math.max(1, Math.ceil((cardHeight + rowGap) / (rowHeight + rowGap)))
      element.style.setProperty('--row-span', String(span))
    })
  }

  const loadPostDetail = async (item: any) => {
    if (item.detail || item.detailLoading) return
    item.detailLoading = true
    item.detailError = ''
    try {
      const encapsulateResponse = await postAPI.getPostingEncapsulate(item.id)
      if (!encapsulateResponse.success || !encapsulateResponse.data) {
        item.detailError = encapsulateResponse.message || '获取帖子详情失败'
        return
      }
      const postEncapsulate = encapsulateResponse.data
      let userName = '未知用户'
      let userAvatar: string | null = null
      if (postEncapsulate.posterId) {
        const posterResponse = await userAPI.getPosterDetail(postEncapsulate.posterId)
        if (posterResponse.success && posterResponse.data) {
          userName = posterResponse.data.userName || userName
          userAvatar = posterResponse.data.userAvatar || null
        }
      }
      item.detail = {
        id: item.id,
        title: postEncapsulate.title,
        posterId: postEncapsulate.posterId,
        coverImage: postEncapsulate.coverImage,
        userName,
        userAvatar,
      }
    } catch (err: unknown) {
      item.detailError = err instanceof Error ? err.message : '获取帖子详情失败'
    } finally {
      item.detailLoading = false
      void nextTick().then(() => {
        relayoutMasonry()
      })
    }
  }

  const setupCardObserver = () => {
    if (cardObserver) cardObserver.disconnect()
    cardObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return
          const id = Number((entry.target as HTMLElement).dataset.postId)
          if (!id) return
          const item = feedItems.value.find(feedItem => feedItem.id === id)
          if (!item) return
          item.visible = true
          void loadPostDetail(item)
          cardObserver?.unobserve(entry.target)
        })
      },
      { root: null, rootMargin: '220px 0px', threshold: 0.1 }
    )
    cardElementMap.forEach(element => {
      cardObserver?.observe(element)
    })
  }

  const setupSentinelObserver = () => {
    if (sentinelObserver) sentinelObserver.disconnect()
    if (!sentinelRef.value) return
    sentinelObserver = new IntersectionObserver(
      entries => {
        const first = entries[0]
        if (first.isIntersecting) {
          // 对于用户帖子，目前不需要分页加载，所有帖子一次性获取
        }
      },
      { root: null, rootMargin: '600px 0px', threshold: 0 }
    )
    sentinelObserver.observe(sentinelRef.value)
  }

  const goBack = () => {
    router.back()
  }

  const goToPostDetail = (postId: number) => {
    router.push(`/tsukuyomi/post/${postId}`)
  }

  const handleCardClick = (item: any) => {
    if (item.detail) {
      goToPostDetail(item.id)
    }
  }

  const retryLoadDetail = async (item: any) => {
    item.detailError = ''
    await loadPostDetail(item)
  }

  const toggleFollow = async () => {
    if (followingActionLoading.value) return
    followingActionLoading.value = true
    try {
      const response = await userAPI.followUser(userId.value)
      if (response.success) {
        isFollowing.value = !isFollowing.value
        if (isFollowing.value) {
          followerCount.value++
        } else {
          followerCount.value = Math.max(0, followerCount.value - 1)
        }
      }
    } catch (err) {
      console.error('关注操作失败', err)
    } finally {
      followingActionLoading.value = false
    }
  }

  const loadUserData = async () => {
    try {
      loading.value = true
      const [userDetailRes, publicDetailRes, followStatusRes, followsRes, followersRes] =
        await Promise.all([
          userAPI.getUserDetailById(userId.value),
          userAPI.getUserPublicDetail(userId.value),
          userAPI.getFollowStatus(userId.value),
          userAPI.getUserFollows(),
          userAPI.getUserFollowers(),
        ])
      if (userDetailRes.success && userDetailRes.data) {
        userDetail.value = userDetailRes.data
      }
      if (publicDetailRes.success && publicDetailRes.data) {
        userPublicDetail.value = publicDetailRes.data
      }
      if (followStatusRes.success) {
        isFollowing.value = followStatusRes.data || false
      }
      if (followsRes.success && followsRes.data) {
        followCount.value = followsRes.data.length
      }
      if (followersRes.success && followersRes.data) {
        followerCount.value = followersRes.data.length
      }
      await loadUserPosts()
    } catch (err) {
      console.error('加载用户数据失败', err)
    } finally {
      loading.value = false
    }
  }

  const loadUserPosts = async () => {
    try {
      feedLoading.value = true
      const response = await postAPI.getUserPosting(userId.value)
      if (response.success && response.data) {
        const postIds = response.data
        loadedIdSet.clear()
        feedItems.value = []
        for (const id of postIds) {
          if (!loadedIdSet.has(id)) {
            loadedIdSet.add(id)
            feedItems.value.push({
              id,
              detail: null,
              detailLoading: false,
              detailError: '',
              visible: false,
            })
          }
        }
        await nextTick()
        relayoutMasonry()
      }
    } catch (err) {
      console.error('加载用户帖子失败', err)
    } finally {
      feedLoading.value = false
    }
  }

  onMounted(async () => {
    setupCardObserver()
    setupSentinelObserver()
    await loadUserData()
    window.addEventListener('resize', relayoutMasonry)
  })

  onBeforeUnmount(() => {
    sentinelObserver?.disconnect()
    cardObserver?.disconnect()
    window.removeEventListener('resize', relayoutMasonry)
  })
</script>

<template>
  <div class="user-profile-container">
    <div class="profile-header">
      <button class="back-button" @click="goBack">
        <img v-if="backIconUrl" :src="backIconUrl" alt="返回" class="back-icon" />
        <span v-else>返回</span>
      </button>
      <div class="header-content">
        <div class="stats-container">
          <div class="stat-item">
            <span class="stat-label">关注</span>
            <span class="stat-value">{{ followCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">粉丝</span>
            <span class="stat-value">{{ followerCount }}</span>
          </div>
        </div>
        <div class="user-info-container">
          <div class="user-name-container">
            <h1 class="user-name">{{ userDetail?.userName || '用户' }}</h1>
            <button
              class="follow-button"
              :class="{ following: isFollowing }"
              :disabled="followingActionLoading"
              @click="toggleFollow"
            >
              {{ followingActionLoading ? '处理中...' : isFollowing ? '已关注' : '关注' }}
            </button>
          </div>
          <div class="user-avatar-container">
            <img
              v-if="userDetail?.userAvatar"
              :src="processImageData(userDetail.userAvatar)"
              alt="头像"
              class="user-avatar"
            />
            <div v-else class="user-avatar-placeholder">
              {{ userDetail?.userName?.charAt(0)?.toUpperCase() || 'U' }}
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>
    <div v-else class="profile-content">
      <div class="left-panel">
        <div class="user-message-section">
          <h3 class="section-title">用户消息</h3>
          <div class="message-list">
            <div
              v-for="msg in [
                { id: 1, content: '欢迎来到我的主页！', time: '刚刚' },
                { id: 2, content: '感谢关注', time: '1小时前' },
                { id: 3, content: '今天天气真好', time: '昨天' },
              ]"
              :key="msg.id"
              class="message-item"
            >
              <div class="message-content">{{ msg.content }}</div>
              <div class="message-time">{{ msg.time }}</div>
            </div>
            <div v-if="userPublicDetail?.userIntroduction" class="introduction-card">
              <h4 class="introduction-title">个人简介</h4>
              <p class="introduction-content">{{ userPublicDetail.userIntroduction }}</p>
            </div>
            <div v-if="userPublicDetail?.userCity" class="info-card">
              <span class="info-label">城市：</span>
              <span class="info-value">{{ userPublicDetail.userCity }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="right-panel">
        <div class="posts-section">
          <h3 class="section-title">用户帖子</h3>
          <div v-if="feedLoading && feedItems.length === 0" class="posts-loading">
            <div class="loading-spinner small"></div>
            <span>加载帖子中...</span>
          </div>
          <div v-else-if="feedItems.length === 0" class="empty-posts">
            <p>暂无帖子</p>
          </div>
          <div v-else ref="postsGridRef" class="posts-grid">
            <article
              v-for="item in feedItems"
              :key="item.id"
              :ref="el => setCardRef(item.id, el)"
              class="post-card"
              :class="{ visible: item.visible, clickable: !!item.detail }"
              @click="handleCardClick(item)"
            >
              <template v-if="item.detail">
                <AsyncPost
                  :user-name="item.detail.userName"
                  :user-id="String(item.detail.posterId)"
                  :title="item.detail.title"
                  :post-id="String(item.detail.id)"
                  :user-avatar="item.detail.userAvatar"
                  :cover-image="item.detail.coverImage"
                />
              </template>
              <template v-else>
                <div class="post-skeleton">
                  <p v-if="item.detailError" class="item-error">{{ item.detailError }}</p>
                  <button
                    v-if="item.detailError"
                    class="item-retry-button"
                    @click.stop="retryLoadDetail(item)"
                  >
                    重试加载
                  </button>
                  <p v-else>帖子加载中...</p>
                </div>
              </template>
            </article>
          </div>
          <div ref="sentinelRef" class="load-sentinel"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .user-profile-container {
    width: 100%;
    min-height: 100vh;
    padding: 20px;
    display: flex;
    flex-direction: column;
  }
  .profile-header {
    margin-bottom: 30px;
    padding-bottom: 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  .back-button {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    padding: 10px 16px;
    color: white;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-bottom: 20px;
    width: fit-content;
  }
  .back-button:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateY(-1px);
  }
  .back-icon {
    width: 20px;
    height: 20px;
    filter: brightness(0) invert(1);
  }
  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 20px;
  }
  .stats-container {
    display: flex;
    gap: 40px;
    padding: 10px 0;
  }
  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }
  .stat-label {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.6);
  }
  .stat-value {
    font-size: 24px;
    font-weight: 600;
    color: white;
  }
  .user-info-container {
    display: flex;
    align-items: center;
    gap: 20px;
  }
  .user-name-container {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 12px;
  }
  .user-name {
    font-size: 28px;
    font-weight: 600;
    color: white;
    margin: 0;
  }
  .follow-button {
    padding: 10px 28px;
    background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
    color: white;
    border: none;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  .follow-button:hover:not(:disabled) {
    background: linear-gradient(135deg, #1976d2 0%, #0d47a1 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
  }
  .follow-button.following {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.3);
  }
  .follow-button.following:hover:not(:disabled) {
    background: rgba(255, 87, 34, 0.2);
    border-color: #ff5722;
    color: #ff5722;
  }
  .follow-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
  .user-avatar-container {
    flex-shrink: 0;
  }
  .user-avatar {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid rgba(255, 255, 255, 0.2);
  }
  .user-avatar-placeholder {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 36px;
    font-weight: 600;
    border: 3px solid rgba(255, 255, 255, 0.2);
  }
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px;
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
  .loading-spinner.small {
    width: 24px;
    height: 24px;
    border-width: 2px;
  }
  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
  .profile-content {
    display: grid;
    grid-template-columns: 300px 1fr;
    gap: 30px;
    flex: 1;
  }
  .left-panel {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .right-panel {
    flex: 1;
  }
  .section-title {
    font-size: 18px;
    font-weight: 600;
    color: white;
    margin: 0 0 16px 0;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  .user-message-section {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 20px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  .message-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .message-item {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    padding: 12px 16px;
  }
  .message-content {
    color: rgba(255, 255, 255, 0.9);
    font-size: 14px;
    margin-bottom: 6px;
  }
  .message-time {
    color: rgba(255, 255, 255, 0.5);
    font-size: 12px;
  }
  .introduction-card,
  .info-card {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    padding: 16px;
    margin-top: 12px;
  }
  .introduction-title {
    font-size: 14px;
    font-weight: 600;
    color: white;
    margin: 0 0 8px 0;
  }
  .introduction-content {
    color: rgba(255, 255, 255, 0.8);
    font-size: 14px;
    line-height: 1.6;
    margin: 0;
  }
  .info-label {
    color: rgba(255, 255, 255, 0.6);
    font-size: 14px;
  }
  .info-value {
    color: rgba(255, 255, 255, 0.9);
    font-size: 14px;
    font-weight: 500;
  }
  .posts-section {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 20px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  .posts-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
    color: rgba(255, 255, 255, 0.7);
    gap: 8px;
  }
  .empty-posts {
    text-align: center;
    padding: 60px;
    color: rgba(255, 255, 255, 0.6);
  }
  .posts-grid {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    grid-auto-rows: 10px;
    gap: 20px;
    align-items: start;
  }
  .post-card {
    width: 100%;
    grid-row-end: span var(--row-span, 1);
    opacity: 0;
    transform: translateY(24px);
    transition:
      opacity 0.35s ease,
      transform 0.35s ease;
  }
  .post-card :deep(.post-container) {
    width: 100%;
    height: auto;
  }
  .post-card :deep(.post-content) {
    min-width: 100%;
    max-width: none;
  }
  .post-card :deep(.post-cover) {
    height: auto;
    min-height: 120px;
  }
  .post-card :deep(.post-cover img) {
    width: 100%;
    height: auto;
    max-height: none;
  }
  .post-card :deep(.cover-placeholder) {
    width: 100%;
    aspect-ratio: 16 / 9;
  }
  .post-card.visible {
    opacity: 1;
    transform: translateY(0);
  }
  .post-card.clickable {
    cursor: pointer;
  }
  .post-skeleton {
    min-height: 300px;
    border-radius: 16px;
    padding: 16px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.18);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 10px;
    color: rgba(255, 255, 255, 0.75);
  }
  .item-error {
    color: #ffc1b8;
    text-align: center;
  }
  .item-retry-button {
    padding: 6px 14px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    color: #fff;
    background: linear-gradient(135deg, #ef6c00 0%, #e65100 100%);
  }
  .load-sentinel {
    width: 100%;
    height: 2px;
    margin-top: 8px;
  }
  @media (max-width: 1024px) {
    .profile-content {
      grid-template-columns: 1fr;
    }
    .left-panel {
      order: 2;
    }
    .right-panel {
      order: 1;
    }
  }
  @media (max-width: 768px) {
    .user-profile-container {
      padding: 12px;
    }
    .user-name {
      font-size: 22px;
    }
    .user-avatar {
      width: 80px;
      height: 80px;
    }
    .user-avatar-placeholder {
      width: 80px;
      height: 80px;
      font-size: 28px;
    }
    .stats-container {
      gap: 24px;
    }
    .stat-value {
      font-size: 20px;
    }
    .posts-grid {
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 16px;
    }
  }
  @media (max-width: 480px) {
    .header-content {
      flex-direction: column;
      align-items: center;
    }
    .user-info-container {
      flex-direction: column-reverse;
      align-items: center;
    }
    .user-name-container {
      align-items: center;
    }
    .posts-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
