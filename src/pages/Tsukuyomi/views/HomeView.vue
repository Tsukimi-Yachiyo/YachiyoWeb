<script setup lang="ts">
  import {
    defineAsyncComponent,
    computed,
    nextTick,
    onBeforeUnmount,
    onMounted,
    ref,
    watch,
  } from 'vue'
  import { useRouter } from 'vue-router'
  import { useIconManager } from '../../../composables/useIconManager'
  import { postAPI, userAPI } from '../../../services/api'

  const AsyncPost = defineAsyncComponent(() => import('../../../components/Post/Post.vue'))
  const PAGE_SIZE = 20

  interface PostDetailItem {
    id: number
    title: string
    posterId: number
    coverImage: string
    userName: string
    userAvatar: string | null
  }

  interface FeedItem {
    id: number
    detail: PostDetailItem | null
    detailLoading: boolean
    detailError: string
    visible: boolean
  }

  const router = useRouter()
  const { checkIconCache } = useIconManager()

  const editIconUrl = computed(() => {
    const iconData = checkIconCache('edit.svg')
    return iconData ? `data:image/svg+xml;utf8,${encodeURIComponent(iconData)}` : ''
  })

  const searchIconUrl = computed(() => {
    const iconData = checkIconCache('discovery.svg')
    return iconData ? `data:image/svg+xml;utf8,${encodeURIComponent(iconData)}` : ''
  })

  const searchKeyword = ref('')
  const activeKeyword = ref('')
  const feedItems = ref<FeedItem[]>([])
  const loadingInitial = ref(false)
  const loadingMore = ref(false)
  const hasMore = ref(true)
  const globalError = ref('')
  const pageNum = ref(1)
  const sentinelRef = ref<HTMLElement | null>(null)
  const postsGridRef = ref<HTMLElement | null>(null)
  const loadedIdSet = new Set<number>()

  let sentinelObserver: IntersectionObserver | null = null
  let cardObserver: IntersectionObserver | null = null
  const cardElementMap = new Map<number, HTMLElement>()

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

  const goToPostEditor = () => {
    router.push('/tsukuyomi/post-editor')
  }

  const goToPostDetail = (postId: number) => {
    router.push(`/tsukuyomi/post/${postId}`)
  }

  const loadPostDetail = async (item: FeedItem) => {
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

  const fetchNextPage = async () => {
    if (loadingMore.value || !hasMore.value) return
    loadingMore.value = true
    globalError.value = ''

    try {
      const response = await postAPI.searchPosting(activeKeyword.value, pageNum.value, PAGE_SIZE)
      if (!response.success) {
        globalError.value = response.message || '加载帖子失败'
        return
      }

      const ids = response.data || []
      if (ids.length < PAGE_SIZE) {
        hasMore.value = false
      }

      const newIds = ids.filter(id => !loadedIdSet.has(id))
      if (newIds.length === 0 && ids.length > 0) {
        hasMore.value = false
      }

      for (const id of newIds) {
        loadedIdSet.add(id)
        feedItems.value.push({
          id,
          detail: null,
          detailLoading: false,
          detailError: '',
          visible: false,
        })
      }

      if (ids.length > 0) {
        pageNum.value += 1
      }
      await nextTick()
      relayoutMasonry()
    } catch (err: unknown) {
      globalError.value = err instanceof Error ? err.message : '网络错误'
    } finally {
      loadingMore.value = false
    }
  }

  const resetFeed = () => {
    feedItems.value = []
    loadedIdSet.clear()
    pageNum.value = 1
    hasMore.value = true
    globalError.value = ''
    cardElementMap.clear()
  }

  const searchPosts = async () => {
    activeKeyword.value = searchKeyword.value.trim()
    resetFeed()
    loadingInitial.value = true
    await fetchNextPage()
    loadingInitial.value = false
  }

  const handleCardClick = (item: FeedItem) => {
    if (item.detail) {
      goToPostDetail(item.id)
    }
  }

  const retryLoadDetail = async (item: FeedItem) => {
    item.detailError = ''
    await loadPostDetail(item)
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
          void fetchNextPage()
        }
      },
      { root: null, rootMargin: '600px 0px', threshold: 0 }
    )

    sentinelObserver.observe(sentinelRef.value)
  }

  watch(sentinelRef, () => {
    setupSentinelObserver()
  })

  watch(
    () => feedItems.value.length,
    () => {
      void nextTick().then(() => {
        relayoutMasonry()
      })
    }
  )

  onMounted(async () => {
    setupCardObserver()
    await searchPosts()
    window.addEventListener('resize', relayoutMasonry)
  })

  onBeforeUnmount(() => {
    sentinelObserver?.disconnect()
    cardObserver?.disconnect()
    window.removeEventListener('resize', relayoutMasonry)
  })
</script>

<template>
  <div class="view-container">
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

    <div v-if="loadingInitial" class="loading">
      <p>加载中...</p>
    </div>

    <div v-else class="posts-wrapper">
      <div v-if="feedItems.length === 0 && !loadingMore" class="empty-posts">
        <p>暂无帖子</p>
      </div>

      <div ref="postsGridRef" class="posts-grid">
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
              <p v-if="item.detailError" class="item-error">
                {{ item.detailError }}
              </p>
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

      <div v-if="loadingMore" class="loading-more">
        <p>正在加载更多帖子...</p>
      </div>

      <div v-if="globalError" class="error">
        <p>{{ globalError }}</p>
        <button class="retry-button" @click="fetchNextPage">重试</button>
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

  .search-container {
    @apply flex items-center gap-3 w-full max-w-3xl mx-auto p-5 z-10;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

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

  .loading,
  .loading-more {
    padding: 30px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.1);
    margin: 24px auto;
    text-align: center;
    max-width: 520px;
  }

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

  .empty-posts {
    padding: 60px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.1);
    text-align: center;
    margin: 40px 0;
    width: 100%;
    max-width: 800px;
  }

  .posts-wrapper {
    @apply flex flex-col items-center;
    width: 100%;
    max-width: 1400px;
    margin: 20px auto 40px;
  }

  .posts-grid {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    grid-auto-rows: 10px;
    gap: 24px;
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

  @media (max-width: 768px) {
    .search-container {
      flex-direction: column;
      align-items: stretch;
    }

    .search-button {
      width: 100%;
    }

    .posts-grid {
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 16px;
    }
  }

  @media (max-width: 480px) {
    .posts-grid {
      grid-template-columns: 1fr;
    }

    .edit-button {
      bottom: 20px;
      top: auto;
      right: 20px;
      width: 50px;
      height: 50px;
    }
  }
</style>
