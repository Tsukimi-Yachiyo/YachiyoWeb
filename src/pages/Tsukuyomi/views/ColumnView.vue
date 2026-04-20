<script setup lang="ts">
  import { computed, nextTick, onMounted, ref, onUnmounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { useIconManager } from '../../../composables/useIconManager'
  import { columnAPI, userAPI } from '../../../services/api'
  import type { ColumnResponse } from '../../../types/api'

  const MAX_COLUMNS = 12
  const PAGE_SIZE = 100
  const MIN_RATIO = 0.08 // 最小尺寸比例
  const SPLIT_RANGE = [0.35, 0.65] // 切分比例范围
  const GAP_SIZE = 12 // 卡片之间的间隔大小

  interface Rect {
    x: number
    y: number
    width: number
    height: number
  }

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
    rect: Rect // 位置和尺寸
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
  const containerRef = ref<HTMLElement | null>(null)
  const showSearchBar = ref(false)
  const containerSize = ref({ width: 0, height: 0 })

  const getTypeWeight = (type: string): number => {
    switch (type) {
      case 'ACTIVITY':
        return 3
      case 'NOVEL':
        return 2
      default:
        return 1
    }
  }

  const assignSizeClass = (type: string, index: number): ColumnItem['sizeClass'] => {
    if (type === 'ACTIVITY') return 'tile-xl'
    if (type === 'NOVEL') return index % 3 === 0 ? 'tile-lg' : 'tile-md'
    return index % 5 === 0 ? 'tile-md' : 'tile-sm'
  }

  const getTypeLabel = (type: string): string => {
    switch (type) {
      case 'ACTIVITY':
        return '活动'
      case 'NOVEL':
        return '小说'
      default:
        return '普通'
    }
  }

  const getTypeGradient = (type: string): string => {
    switch (type) {
      case 'ACTIVITY':
        return 'linear-gradient(135deg, #ff6b35 0%, #f7c59f 50%, #ff6b35 100%)'
      case 'NOVEL':
        return 'linear-gradient(135deg, #a855f7 0%, #7c3aed 50%, #5b21b6 100%)'
      default:
        return 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #6366f1 100%)'
    }
  }

  // 智能分割算法 - 获取当前最大的矩形
  const getLargestRect = (rects: Rect[]): Rect => {
    return rects.reduce((max, rect) =>
      rect.width * rect.height > max.width * max.height ? rect : max
    )
  }

  // 智能分割算法 - 切分单个矩形（考虑间隔）
  const splitRect = (
    rect: Rect,
    containerWidth: number,
    containerHeight: number
  ): [Rect, Rect] | null => {
    const isVertical = Math.random() > 0.5
    const [min, max] = SPLIT_RANGE
    const ratio = min + Math.random() * (max - min)

    let rect1: Rect, rect2: Rect
    if (isVertical) {
      // 垂直切分，留出中间间隔
      const availableWidth = rect.width - GAP_SIZE
      const w1 = availableWidth * ratio
      const w2 = availableWidth - w1
      rect1 = { ...rect, width: w1 }
      rect2 = { ...rect, x: rect.x + w1 + GAP_SIZE, width: w2 }
    } else {
      // 水平切分，留出中间间隔
      const availableHeight = rect.height - GAP_SIZE
      const h1 = availableHeight * ratio
      const h2 = availableHeight - h1
      rect1 = { ...rect, height: h1 }
      rect2 = { ...rect, y: rect.y + h1 + GAP_SIZE, height: h2 }
    }

    // 校验：排除正方形 + 最小尺寸限制
    const isValid = (r: Rect) =>
      Math.abs(r.width - r.height) > Math.min(r.width, r.height) * 0.1 && // 不是近似正方形
      r.width > containerWidth * MIN_RATIO &&
      r.height > containerHeight * MIN_RATIO

    if (isValid(rect1) && isValid(rect2)) {
      return [rect1, rect2]
    }
    return null
  }

  // 智能分割算法 - 生成n个矩形（考虑边界间隔）
  const generateLayout = (count: number, width: number, height: number): Rect[] => {
    // 初始矩形减去边界间隔
    const initialRect: Rect = {
      x: GAP_SIZE,
      y: GAP_SIZE,
      width: width - GAP_SIZE * 2,
      height: height - GAP_SIZE * 2,
    }

    const rects: Rect[] = [initialRect]
    let attempts = 0
    const maxAttempts = count * 50

    while (rects.length < count && attempts < maxAttempts) {
      const largest = getLargestRect(rects)
      const splitResult = splitRect(largest, width, height)

      if (splitResult) {
        const index = rects.indexOf(largest)
        rects.splice(index, 1, splitResult[0], splitResult[1])
      }
      attempts++
    }

    return rects
  }

  const loadWriterInfo = async (column: ColumnItem): Promise<void> => {
    try {
      const res = await userAPI.getPosterDetail(column.writer)
      if (res.success && res.data) {
        column.writerName = res.data.userName || '未知用户'
        column.writerAvatar = res.data.userAvatar || null
      }
    } catch {
      column.writerName = '未知用户'
    }
  }

  // 初始化容器尺寸和 ResizeObserver
  const initContainer = () => {
    if (containerRef.value) {
      containerSize.value = {
        width: containerRef.value.clientWidth,
        height: containerRef.value.clientHeight,
      }
    }
  }

  const resizeObserver = ref<ResizeObserver | null>(null)
  const tempColumns = ref<ColumnResponse[]>([])

  // 生成布局并设置专栏
  const generateLayoutAndSetColumns = async (columns: ColumnResponse[]) => {
    // 等待容器渲染完成
    await nextTick()
    await nextTick() // 再等一个 tick，确保 DOM 完全更新
    initContainer()

    console.log('[ColumnView] 容器尺寸:', containerSize.value)

    // 如果容器尺寸为 0，使用默认值
    const width = containerSize.value.width || 1200
    const height = containerSize.value.height || 600

    // 生成智能布局
    const rects = generateLayout(columns.length, width, height)
    console.log('[ColumnView] 生成的布局矩形:', rects)

    // 随机打乱专栏顺序并分配矩形
    const shuffledColumns = [...columns].sort(() => Math.random() - 0.5)
    columnItems.value = shuffledColumns.map((col, i) => ({
      ...col,
      visible: true,
      writerName: undefined,
      writerAvatar: undefined,
      rect: rects[i] || { x: 0, y: 0, width: 100, height: 100 },
    }))
    console.log('[ColumnView] 处理后的专栏数据:', columnItems.value)

    // 加载作者信息
    for (const column of columnItems.value) {
      await loadWriterInfo(column)
    }
    console.log('[ColumnView] 加载作者信息完成')
  }

  const fetchColumns = async () => {
    loadingInitial.value = true
    globalError.value = ''
    try {
      console.log(
        '[ColumnView] 开始获取专栏，搜索关键词:',
        activeKeyword.value || '（空，获取全部）'
      )
      const response = await columnAPI.searchColumn(activeKeyword.value, 1, PAGE_SIZE)
      console.log('[ColumnView] API响应:', response)

      if (!response.success || !response.data) {
        console.error('[ColumnView] API响应失败或无数据:', response)
        globalError.value = response.message || '获取专栏失败'
        return
      }

      let columns = response.data as ColumnResponse[]
      console.log('[ColumnView] 原始专栏数据:', columns)

      // 限制数量
      if (columns.length > MAX_COLUMNS) {
        const sorted = [...columns].sort((a, b) => getTypeWeight(b.type) - getTypeWeight(a.type))
        columns = sorted.slice(0, MAX_COLUMNS)
      }

      // 先设置 loading 为 false，让容器显示出来
      loadingInitial.value = false
      tempColumns.value = columns

      // 然后生成布局
      await generateLayoutAndSetColumns(columns)
    } catch (err: unknown) {
      console.error('[ColumnView] 获取专栏异常:', err)
      globalError.value = err instanceof Error ? err.message : '网络错误'
      loadingInitial.value = false
    }
  }

  const searchColumns = async () => {
    activeKeyword.value = searchKeyword.value.trim()
    await fetchColumns()
  }

  const handleCardClick = (column: ColumnItem) => {
    if (column.essayUrl) {
      router.push({ name: 'FileViewer', query: { essayUrl: column.essayUrl, title: column.name } })
    }
  }

  onMounted(() => {
    // 先设置 ResizeObserver，确保容器渲染后能立即监听
    const setupResizeObserver = () => {
      if (containerRef.value) {
        resizeObserver.value = new ResizeObserver(entries => {
          for (const entry of entries) {
            containerSize.value = {
              width: entry.contentRect.width,
              height: entry.contentRect.height,
            }
          }

          console.log('[ColumnView] 容器尺寸变化:', containerSize.value)

          // 重新生成布局
          if (
            columnItems.value.length > 0 &&
            containerSize.value.width > 0 &&
            containerSize.value.height > 0
          ) {
            const rects = generateLayout(
              columnItems.value.length,
              containerSize.value.width,
              containerSize.value.height
            )
            columnItems.value.forEach((col, i) => {
              col.rect = rects[i] || col.rect
            })
          }
        })
        resizeObserver.value.observe(containerRef.value)
      }
    }

    // 等待 DOM 渲染完成
    setTimeout(() => {
      setupResizeObserver()
      fetchColumns()
    }, 100)
  })

  onUnmounted(() => {
    resizeObserver.value?.disconnect()
  })
</script>

<template>
  <div class="view-container">
    <div class="search-container">
      <!-- Search bar -->
      <div class="search-toggle-container">
        <button class="search-toggle-button" @click="showSearchBar = !showSearchBar">
          <img
            v-if="searchIconUrl"
            :src="searchIconUrl"
            alt="搜索"
            style="width: 18px; height: 18px; filter: brightness(0) invert(1)"
          />
          <span>搜索专栏</span>
        </button>
      </div>

      <transition name="search-bar">
        <div v-if="showSearchBar" class="search-container">
          <input
            v-model="searchKeyword"
            type="text"
            placeholder="搜索专栏名称..."
            class="search-input"
            @keyup.enter="searchColumns"
          />
          <button class="search-button" @click="searchColumns">搜索</button>
        </div>
      </transition>
    </div>

    <!-- Loading -->
    <div v-if="loadingInitial" class="loading-state">
      <div class="spinner"></div>
      <p>加载专栏中...</p>
    </div>

    <!-- 智能布局容器 -->
    <div v-else class="page-wrapper">
      <div v-if="columnItems.length === 0 && !globalError" class="empty-state">
        <p>暂无专栏</p>
      </div>

      <div ref="containerRef" class="masonry-container">
        <article
          v-for="column in columnItems"
          :key="column.id"
          class="column-tile"
          :class="{ visible: column.visible, 'is-activity': column.type === 'ACTIVITY' }"
          :style="{
            left: column.rect.x + 'px',
            top: column.rect.y + 'px',
            width: column.rect.width + 'px',
            height: column.rect.height + 'px',
          }"
          @click="handleCardClick(column)"
        >
          <!-- Activity glow border -->
          <div v-if="column.type === 'ACTIVITY'" class="activity-glow"></div>

          <!-- Type color bar -->
          <div class="type-bar" :style="{ background: getTypeGradient(column.type) }"></div>

          <div class="tile-inner">
            <!-- Header -->
            <div class="tile-header">
              <span class="type-badge" :style="{ background: getTypeGradient(column.type) }">
                {{ getTypeLabel(column.type) }}
              </span>
              <span v-if="column.type === 'ACTIVITY'" class="activity-tag"> 🔥 重点活动 </span>
            </div>

            <!-- Title -->
            <h3 class="tile-title">{{ column.name }}</h3>

            <!-- Description -->
            <p class="tile-desc">{{ column.description }}</p>

            <!-- Activity highlight banner -->
            <div v-if="column.type === 'ACTIVITY'" class="activity-banner">
              <span>🎉 活动进行中，点击参与</span>
            </div>

            <!-- Footer -->
            <div class="tile-footer">
              <div class="writer-info">
                <div class="writer-avatar">
                  <img
                    v-if="column.writerAvatar"
                    :src="column.writerAvatar"
                    :alt="column.writerName"
                  />
                  <span v-else>{{
                    column.writerName ? column.writerName.charAt(0).toUpperCase() : '?'
                  }}</span>
                </div>
                <span class="writer-name">{{ column.writerName || '加载中...' }}</span>
              </div>
              <span class="create-time">{{
                new Date(column.createTime).toLocaleDateString('zh-CN')
              }}</span>
            </div>
          </div>
        </article>
      </div>

      <div v-if="globalError" class="error-state">
        <p>{{ globalError }}</p>
        <button class="retry-button" @click="fetchColumns">重试</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
  @reference "tailwindcss";

  .view-container {
    @apply w-full h-full;
    padding-bottom: 40px;
  }

  /* Search */
  .search-toggle-container {
    display: flex;
    justify-content: center;
    padding: 16px;
  }

  .search-toggle-button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 28px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 30px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.35);
    transition: all 0.3s ease;
  }

  .search-toggle-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.45);
  }

  .search-container {
    display: flex;
    align-items: center;
    gap: 12px;
    max-width: 640px;
    margin: 0 auto 16px;
    padding: 0 20px;
  }

  .search-bar-enter-active,
  .search-bar-leave-active {
    transition: all 0.3s ease;
  }
  .search-bar-enter-from,
  .search-bar-leave-to {
    opacity: 0;
    transform: translateY(-8px);
  }

  .search-input {
    flex: 1;
    padding: 11px 16px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.1);
    color: white;
    font-size: 15px;
    outline: none;
    transition: all 0.3s ease;
  }

  .search-input:focus {
    border-color: #667eea;
    background: rgba(255, 255, 255, 0.15);
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.25);
  }

  .search-input::placeholder {
    color: rgba(255, 255, 255, 0.45);
  }

  .search-button {
    padding: 11px 24px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    font-size: 15px;
    font-weight: 600;
    transition: all 0.3s ease;
  }

  .search-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.35);
  }

  /* Loading */
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    padding: 60px;
    color: rgba(255, 255, 255, 0.7);
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(255, 255, 255, 0.15);
    border-top-color: #667eea;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* Page wrapper */
  .page-wrapper {
    width: 100%;
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 20px;
  }

  .empty-state {
    text-align: center;
    padding: 80px;
    color: rgba(255, 255, 255, 0.5);
    font-size: 16px;
  }

  /* 智能布局容器 */
  .masonry-container {
    position: relative;
    width: 100%;
    height: calc(100vh - 200px);
    min-height: 500px;
    margin-top: -30px; /* 向上移动 30px */
  }

  /* Base tile */
  .column-tile {
    position: absolute;
    border-radius: 18px;
    overflow: hidden;
    cursor: pointer;
    background: rgba(255, 255, 255, 0.07);
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(12px);
    opacity: 0;
    transform: translateY(16px) scale(0.97);
    transition:
      opacity 0.4s ease,
      transform 0.4s ease,
      box-shadow 0.3s ease,
      border-color 0.3s ease,
      left 0.3s ease,
      top 0.3s ease,
      width 0.3s ease,
      height 0.3s ease;
  }

  .column-tile.visible {
    opacity: 1;
    transform: translateY(0) scale(1);
  }

  .column-tile:hover {
    transform: translateY(-6px) scale(1.015);
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35);
    border-color: rgba(255, 255, 255, 0.25);
  }

  /* Activity special styling */
  .column-tile.is-activity {
    border-color: rgba(255, 107, 53, 0.5);
    background: rgba(255, 107, 53, 0.08);
  }

  .column-tile.is-activity:hover {
    border-color: rgba(255, 107, 53, 0.8);
    box-shadow: 0 16px 40px rgba(255, 107, 53, 0.25);
  }

  .activity-glow {
    position: absolute;
    inset: -1px;
    border-radius: 18px;
    background: transparent;
    border: 2px solid transparent;
    background-clip: padding-box;
    animation: glow-pulse 2s ease-in-out infinite;
    pointer-events: none;
    z-index: 0;
  }

  @keyframes glow-pulse {
    0%,
    100% {
      box-shadow:
        0 0 8px rgba(255, 107, 53, 0.4),
        inset 0 0 8px rgba(255, 107, 53, 0.1);
    }
    50% {
      box-shadow:
        0 0 20px rgba(255, 107, 53, 0.7),
        inset 0 0 12px rgba(255, 107, 53, 0.2);
    }
  }

  /* Color bar at top */
  .type-bar {
    height: 4px;
    width: 100%;
    position: relative;
    z-index: 1;
  }

  /* Inner content */
  .tile-inner {
    padding: 16px 18px 14px;
    display: flex;
    flex-direction: column;
    height: calc(100% - 4px);
    position: relative;
    z-index: 1;
  }

  .tile-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
    flex-wrap: wrap;
  }

  .type-badge {
    padding: 3px 10px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 700;
    color: white;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  .activity-tag {
    font-size: 12px;
    font-weight: 700;
    color: #ff6b35;
    background: rgba(255, 107, 53, 0.15);
    padding: 3px 10px;
    border-radius: 20px;
    border: 1px solid rgba(255, 107, 53, 0.4);
    animation: pulse-text 1.8s ease-in-out infinite;
  }

  @keyframes pulse-text {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.65;
    }
  }

  .tile-title {
    font-size: 16px;
    font-weight: 700;
    color: white;
    line-height: 1.35;
    margin-bottom: 8px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .tile-xl .tile-title {
    font-size: 20px;
  }
  .tile-lg .tile-title {
    font-size: 18px;
  }

  .tile-desc {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.65);
    line-height: 1.6;
    flex: 1;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin-bottom: 8px;
  }

  .tile-xl .tile-desc {
    -webkit-line-clamp: 5;
    font-size: 14px;
  }
  .tile-lg .tile-desc {
    -webkit-line-clamp: 4;
  }

  /* Activity banner */
  .activity-banner {
    background: linear-gradient(
      135deg,
      rgba(255, 107, 53, 0.25) 0%,
      rgba(247, 197, 159, 0.15) 100%
    );
    border: 1px solid rgba(255, 107, 53, 0.35);
    border-radius: 8px;
    padding: 8px 12px;
    margin-bottom: 10px;
    font-size: 13px;
    font-weight: 600;
    color: #ffb899;
    text-align: center;
  }

  /* Footer */
  .tile-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 10px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    margin-top: auto;
  }

  .writer-info {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .writer-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 700;
    font-size: 12px;
    flex-shrink: 0;
    overflow: hidden;
  }

  .writer-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .writer-name {
    color: rgba(255, 255, 255, 0.8);
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100px;
  }

  .create-time {
    color: rgba(255, 255, 255, 0.4);
    font-size: 11px;
    flex-shrink: 0;
  }

  /* Error */
  .error-state {
    text-align: center;
    padding: 24px;
    background: rgba(255, 87, 34, 0.15);
    border: 1px solid rgba(255, 87, 34, 0.35);
    border-radius: 12px;
    margin-top: 20px;
    color: rgba(255, 255, 255, 0.85);
  }

  .retry-button {
    margin-top: 12px;
    padding: 8px 20px;
    background: linear-gradient(135deg, #ff6b6b 0%, #d63031 100%);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.3s ease;
  }

  .retry-button:hover {
    transform: translateY(-1px);
  }

  /* Responsive */
  @media (max-width: 1024px) {
    .columns-grid {
      grid-template-columns: repeat(3, 1fr);
    }
    .tile-xl {
      grid-column-end: span 2;
    }
  }

  @media (max-width: 768px) {
    .columns-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 14px;
    }
    .tile-xl {
      grid-column-end: span 2;
    }
    .search-container {
      flex-direction: column;
    }
    .search-button {
      width: 100%;
    }
  }

  @media (max-width: 480px) {
    .columns-grid {
      grid-template-columns: 1fr;
    }
    .tile-xl,
    .tile-lg,
    .tile-md,
    .tile-sm {
      grid-column-end: span 1;
    }
  }
</style>
