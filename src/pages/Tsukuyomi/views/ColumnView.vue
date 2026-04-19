<script setup lang="ts">
  import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
  import { useRouter } from 'vue-router'
  import { useIconManager } from '../../../composables/useIconManager'
  import { columnAPI, userAPI } from '../../../services/api'
  import type { ColumnResponse } from '../../../types/api'

  const MAX_COLUMNS = 12
  const PAGE_SIZE = 100

  interface ColumnItem {
    id: number
    name: string
    description: string
    type: 'SIMPLE' | 'NOVEL' | 'ACTIVITY'
    writer: number
    essayUrl: string
    createTime: string
    writerName?: string
    writerAvatar?: string | null
    visible: boolean
  }

  const router = useRouter()
  const { checkIconCache } = useIconManager()

  const searchIconUrl = computed(() => {
    const iconData = checkIconCache('discovery.svg')
    return iconData ? `data:image/svg+xml;utf8,${encodeURIComponent(iconData)}` : ''
  })

  const searchKeyword = ref('')
  const activeKeyword = ref('')
  const columnItems = ref<ColumnItem[]>([])
  const loadingInitial = ref(false)
  const globalError = ref('')
  const gridRef = ref<HTMLElement | null>(null)
  const cardElementMap = new Map<number, HTMLElement>()
  const showSearchBar = ref(false)

  const setCardRef = (columnId: number, el: Element | null) => {
    if (el) {
      const element = el as HTMLElement
      element.dataset.columnId = String(columnId)
      cardElementMap.set(columnId, element)
      void nextTick().then(() => {
        relayoutMasonry()
      })
    }
  }

  const getTypeWeight = (type: string): number => {
    switch (type) {
      case 'ACTIVITY':
        return 3
      case 'NOVEL':
        return 2
      case 'SIMPLE':
      default:
        return 1
    }
  }

  const getCardSizeClass = (type: string, index: number): string => {
    const weight = getTypeWeight(type)
    if (weight >= 3) {
      return 'large-card'
    } else if (weight >= 2) {
      return 'medium-card'
    }
    return 'small-card'
  }

  const getTypeLabel = (type: string): string => {
    switch (type) {
      case 'ACTIVITY':
        return '活动'
      case 'NOVEL':
        return '小说'
      case 'SIMPLE':
        return '普通'
      default:
        return ''
    }
  }

  const getTypeGradient = (type: string): string => {
    switch (type) {
      case 'ACTIVITY':
        return 'linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 50%, #d63031 100%)'
      case 'NOVEL':
        return 'linear-gradient(135deg, #a855f7 0%, #7c3aed 50%, #5b21b6 100%)'
      case 'SIMPLE':
      default:
        return 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #6366f1 100%)'
    }
  }

  const relayoutMasonry = () => {
    if (!gridRef.value) return
    const grid = gridRef.value
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

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  const loadWriterInfo = async (column: ColumnItem): Promise<void> => {
    try {
      const writerResponse = await userAPI.getPosterDetail(column.writer)
      if (writerResponse.success && writerResponse.data) {
        column.writerName = writerResponse.data.userName || '未知用户'
        column.writerAvatar = writerResponse.data.userAvatar || null
      }
    } catch (err) {
      console.warn('获取作者信息失败:', err)
    }
  }

  const fetchColumns = async () => {
    loadingInitial.value = true
    globalError.value = ''

    try {
      const response = await columnAPI.searchColumn(activeKeyword.value, 1, PAGE_SIZE)
      console.log('API 响应:', response)

      if (!response.success || !response.data) {
        globalError.value = response.message || '获取专栏失败'
        return
      }

      let columns = response.data as ColumnResponse[]
      console.log('获取到的专栏列表:', columns)

      if (columns.length > MAX_COLUMNS) {
        const weightedColumns = [...columns].sort(
          (a, b) => getTypeWeight(b.type) - getTypeWeight(a.type)
        )
        const highWeight = weightedColumns.filter(c => getTypeWeight(c.type) >= 2)
        const lowWeight = weightedColumns.filter(c => getTypeWeight(c.type) < 2)

        let selectedColumns: ColumnResponse[] = []
        const needHighWeight = Math.min(highWeight.length, Math.ceil(MAX_COLUMNS * 0.4))
        selectedColumns = [...selectedColumns, ...shuffleArray(highWeight).slice(0, needHighWeight)]

        const remaining = MAX_COLUMNS - selectedColumns.length
        selectedColumns = [...selectedColumns, ...shuffleArray(lowWeight).slice(0, remaining)]

        columns = shuffleArray(selectedColumns)
      }

      columnItems.value = columns.map(col => ({
        ...col,
        visible: true, // 默认就显示
        writerName: undefined,
        writerAvatar: undefined,
      }))

      for (const column of columnItems.value) {
        await loadWriterInfo(column)
      }

      console.log('最终的 columnItems:', columnItems.value)

      await nextTick()
      relayoutMasonry()
    } catch (err: unknown) {
      console.error('获取专栏失败:', err)
      globalError.value = err instanceof Error ? err.message : '网络错误'
    } finally {
      loadingInitial.value = false
    }
  }

  const searchColumns = async () => {
    activeKeyword.value = searchKeyword.value.trim()
    await fetchColumns()
  }

  const handleCardClick = (column: ColumnItem) => {
    if (column.essayUrl) {
      console.log('跳转到文件查看器:', column.essayUrl)
      router.push({
        name: 'FileViewer',
        query: { essayUrl: column.essayUrl, title: column.name },
      })
    } else {
      console.log('专栏没有提供文件链接')
    }
  }

  const setupCardObserver = () => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return
          const id = Number((entry.target as HTMLElement).dataset.columnId)
          if (!id) return
          const item = columnItems.value.find(col => col.id === id)
          if (item) {
            item.visible = true
          }
        })
      },
      { root: null, rootMargin: '200px 0px', threshold: 0.1 }
    )

    cardElementMap.forEach(element => {
      observer.observe(element)
    })
  }

  watch(
    () => columnItems.value.length,
    () => {
      void nextTick().then(() => {
        setupCardObserver()
        relayoutMasonry()
      })
    }
  )

  onMounted(async () => {
    await searchColumns()
    window.addEventListener('resize', relayoutMasonry)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', relayoutMasonry)
  })
</script>

<template>
  <div class="view-container">
    <div class="search-toggle-container">
      <button class="search-toggle-button" @click="showSearchBar = !showSearchBar">
        <img
          v-if="searchIconUrl"
          :src="searchIconUrl"
          alt="搜索"
          style="width: 20px; height: 20px; filter: brightness(0) invert(1)"
        />
        <span>搜索</span>
      </button>
    </div>

    <transition name="search-bar">
      <div v-if="showSearchBar" class="search-container">
        <input
          v-model="searchKeyword"
          type="text"
          placeholder="搜索专栏..."
          class="search-input"
          @keyup.enter="searchColumns"
        />
        <button class="search-button" title="搜索" @click="searchColumns">
          <img
            v-if="searchIconUrl"
            :src="searchIconUrl"
            alt="搜索"
            style="width: 20px; height: 20px; filter: brightness(0) invert(1)"
          />
          <span v-else>搜索</span>
        </button>
      </div>
    </transition>

    <div v-if="loadingInitial" class="loading">
      <p>加载中...</p>
    </div>

    <div v-else class="columns-wrapper">
      <div v-if="columnItems.length === 0" class="empty-columns">
        <p>暂无专栏</p>
      </div>

      <div ref="gridRef" class="columns-grid">
        <article
          v-for="column in columnItems"
          :key="column.id"
          :ref="el => setCardRef(column.id, el)"
          class="column-card"
          :class="[
            getCardSizeClass(column.type, columnItems.indexOf(column)),
            { visible: column.visible },
          ]"
          @click="handleCardClick(column)"
        >
          <div class="card-content">
            <div class="card-header">
              <div class="type-badge" :style="{ background: getTypeGradient(column.type) }">
                {{ getTypeLabel(column.type) }}
              </div>
              <span v-if="column.type === 'ACTIVITY'" class="activity-pulse">🔥</span>
            </div>

            <h3 class="column-title">{{ column.name }}</h3>
            <p class="column-description">{{ column.description }}</p>

            <div class="card-footer">
              <div class="writer-info">
                <div class="writer-avatar">
                  {{ column.writerName ? column.writerName.charAt(0).toUpperCase() : '?' }}
                </div>
                <span class="writer-name">{{ column.writerName || '未知用户' }}</span>
              </div>
              <span class="create-time">{{
                new Date(column.createTime).toLocaleDateString()
              }}</span>
            </div>
          </div>
        </article>
      </div>

      <div v-if="globalError" class="error">
        <p>{{ globalError }}</p>
        <button class="retry-button" @click="searchColumns">重试</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
  @reference "tailwindcss";

  .view-container {
    @apply w-full h-full;
  }

  .search-toggle-container {
    display: flex;
    justify-content: center;
    padding: 15px;
  }

  .search-toggle-button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 24px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 30px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 15px;
    font-weight: 600;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  }

  .search-toggle-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  }

  .search-container {
    @apply flex items-center gap-3 w-full max-w-3xl mx-auto p-5 z-10;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .search-bar-enter-active,
  .search-bar-leave-active {
    transition: all 0.3s ease;
  }

  .search-bar-enter-from,
  .search-bar-leave-to {
    opacity: 0;
    transform: translateY(-10px);
    max-height: 0;
    overflow: hidden;
  }

  .search-bar-enter-to,
  .search-bar-leave-from {
    opacity: 1;
    transform: translateY(0);
    max-height: 100px;
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
    border-color: #667eea;
    background: rgba(255, 255, 255, 0.15);
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
  }

  .search-input::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  .search-button {
    padding: 12px 24px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 16px;
  }

  .search-button:hover {
    background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  }

  .loading {
    padding: 30px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.1);
    margin: 24px auto;
    text-align: center;
    max-width: 520px;
    color: rgba(255, 255, 255, 0.8);
  }

  .error {
    padding: 20px;
    border-radius: 8px;
    background: rgba(255, 87, 34, 0.2);
    border: 1px solid rgba(255, 87, 34, 0.4);
    margin: 20px 0;
    text-align: center;
    color: rgba(255, 255, 255, 0.9);
  }

  .retry-button {
    margin-top: 10px;
    padding: 8px 16px;
    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .retry-button:hover {
    background: linear-gradient(135deg, #ee5a5a 0%, #d63031 100%);
    transform: translateY(-1px);
  }

  .empty-columns {
    padding: 60px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.1);
    text-align: center;
    margin: 40px 0;
    width: 100%;
    max-width: 800px;
    color: rgba(255, 255, 255, 0.7);
  }

  .columns-wrapper {
    @apply flex flex-col items-center;
    width: 100%;
    max-width: 1400px;
    margin: 20px auto 40px;
    padding: 0 20px;
  }

  .columns-grid {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    grid-auto-rows: 10px;
    gap: 24px;
    align-items: start;
  }

  .column-card {
    width: 100%;
    grid-row-end: span var(--row-span, 12);
    background: rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    border: 1px solid rgba(255, 255, 255, 0.12);
    opacity: 0;
    transform: translateY(20px) scale(0.98);
    backdrop-filter: blur(10px);
  }

  .column-card.visible {
    opacity: 1;
    transform: translateY(0) scale(1);
  }

  .column-card:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    border-color: rgba(255, 255, 255, 0.3);
  }

  .column-card.large-card {
    grid-row-end: span var(--row-span, 18);
  }

  .column-card.medium-card {
    grid-row-end: span var(--row-span, 15);
  }

  .column-card.small-card {
    grid-row-end: span var(--row-span, 12);
  }

  .card-content {
    padding: 20px;
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 200px;
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
  }

  .type-badge {
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    color: white;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .activity-pulse {
    font-size: 16px;
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.2);
      opacity: 0.7;
    }
  }

  .column-title {
    font-size: 20px;
    font-weight: 700;
    color: white;
    margin-bottom: 12px;
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .column-description {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.75);
    line-height: 1.6;
    margin-bottom: auto;
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .writer-info {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .writer-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 600;
    font-size: 14px;
  }

  .writer-name {
    color: rgba(255, 255, 255, 0.85);
    font-size: 14px;
    font-weight: 500;
  }

  .create-time {
    color: rgba(255, 255, 255, 0.5);
    font-size: 12px;
  }

  @media (max-width: 768px) {
    .search-container {
      flex-direction: column;
      align-items: stretch;
    }

    .search-button {
      width: 100%;
    }

    .columns-grid {
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 16px;
    }
  }

  @media (max-width: 480px) {
    .columns-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
