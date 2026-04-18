import { ElMessage } from 'element-plus'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { columnAPI } from '../services/api'
import type { ColumnType } from '../types/api'
import { useIconManager } from './useIconManager'

type DocumentType = 'pdf' | 'word'

interface ColumnDocument {
  id: number
  title: string
  type: DocumentType
  size: string
  updatedAt: string
  description: string
  previewUrl?: string
  downloadUrl?: string
}

interface ColumnInteractionStats {
  like: number
  coin: number
}

interface CampaignCover {
  title: string
  subtitle: string
  coverUrl: string
  landingUrl: string
  status: 'UPCOMING' | 'ONLINE' | 'OFFLINE'
}

interface CampaignSourceItem {
  type: ColumnType
  name: string
  description: string
  essayUrl: string
  essayURL?: string
  coverImage?: string
  coverUrl?: string
}

const documents: ColumnDocument[] = [
  {
    id: 1,
    title: '月读世界观设定手册',
    type: 'pdf',
    size: '2.8 MB',
    updatedAt: '2026-04-10',
    description: '项目背景、角色关系与章节导读，适合快速建立上下文。',
  },
  {
    id: 2,
    title: '内容投稿规范与排版模板',
    type: 'word',
    size: '468 KB',
    updatedAt: '2026-04-08',
    description: '包含标题层级、封面图建议与审核注意事项。',
  },
  {
    id: 3,
    title: '角色语气词与关键词词典',
    type: 'word',
    size: '612 KB',
    updatedAt: '2026-04-07',
    description: '统一人物表达风格，避免文案口吻偏差。',
  },
  {
    id: 4,
    title: '专栏运营月报（示例）',
    type: 'pdf',
    size: '1.2 MB',
    updatedAt: '2026-04-05',
    description: '阅读量、互动率、用户留存与选题复盘模板。',
  },
]

const defaultCampaignCover: CampaignCover = {
  title: '八千杯活动页预告',
  subtitle: '当前后端文档未提供活动封面接口，先使用预置占位。',
  coverUrl: '',
  landingUrl: '',
  status: 'UPCOMING',
}

export const useColumnView = () => {
  const router = useRouter()
  const { checkIconCache } = useIconManager()
  const documentList = ref<ColumnDocument[]>(documents)
  const campaignCover = ref<CampaignCover>(defaultCampaignCover)
  const isColumnLoading = ref(false)
  const columnLoadError = ref('')
  const interactionStatsMap = ref<Record<number, ColumnInteractionStats>>({})
  const interactionLoadingMap = ref<Record<string, boolean>>({})

  const editIconUrl = computed(() => {
    const iconData = checkIconCache('edit.svg')
    return iconData ? `data:image/svg+xml;utf8,${encodeURIComponent(iconData)}` : ''
  })

  const getTypeLabel = (type: DocumentType) => {
    return type === 'pdf' ? 'PDF' : 'WORD'
  }

  const getFileTypeClass = (type: DocumentType) => {
    if (type === 'pdf') {
      return 'text-[#ffe9ea] bg-[rgba(238,82,83,0.24)] border-[rgba(255,153,153,0.45)]'
    }
    return 'text-[#e1efff] bg-[rgba(58,121,255,0.25)] border-[rgba(146,191,255,0.5)]'
  }

  const mapColumnTypeToDocType = (type: ColumnType): DocumentType => {
    return type === 'ACTIVITY' ? 'word' : 'pdf'
  }

  const resolveSafeLink = (url: string) => {
    const trimmed = url.trim()
    if (!trimmed) return ''

    try {
      const parsed = new URL(trimmed, window.location.origin)
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return ''
      }
      return parsed.href
    } catch {
      return ''
    }
  }

  const openExternalLink = (url: string, target: '_blank' | '_self' = '_blank') => {
    const safeUrl = resolveSafeLink(url)
    if (!safeUrl) {
      ElMessage.warning('链接无效或不受支持')
      return
    }

    if (target === '_self') {
      window.location.assign(safeUrl)
      return
    }
    window.open(safeUrl, '_blank', 'noopener,noreferrer')
  }

  const resolveCampaignStatus = (hasEssayUrl: boolean): CampaignCover['status'] => {
    return hasEssayUrl ? 'ONLINE' : 'UPCOMING'
  }

  const resolveCampaignCoverUrl = (item: CampaignSourceItem) => {
    return item.coverImage || item.coverUrl || ''
  }

  const pickCampaignCover = (items: CampaignSourceItem[]): CampaignCover => {
    const validItem = items.find(item => item.essayUrl && item.essayUrl.trim())
    if (!validItem) {
      return defaultCampaignCover
    }

    const landingUrl = validItem.essayUrl || ''
    return {
      title: validItem.name || defaultCampaignCover.title,
      subtitle: validItem.description || defaultCampaignCover.subtitle,
      coverUrl: resolveCampaignCoverUrl(validItem),
      landingUrl,
      status: resolveCampaignStatus(Boolean(landingUrl)),
    }
  }

  const getInteractionStats = (columnId: number): ColumnInteractionStats => {
    return interactionStatsMap.value[columnId] || { like: 0, coin: 0 }
  }

  const getInteractionLoading = (columnId: number, type: 'LIKE' | 'COIN') => {
    return Boolean(interactionLoadingMap.value[`${columnId}-${type}`])
  }

  const refreshColumnInteraction = async (columnId: number) => {
    try {
      const response = await columnAPI.getInteraction(columnId)
      if (response.data) {
        interactionStatsMap.value[columnId] = {
          like: Number(response.data.like || 0),
          coin: Number(response.data.coin || 0),
        }
      }
    } catch {
      // 保持当前展示值，避免因为单个接口失败影响列表交互
    }
  }

  const hydrateAllInteractions = async (columnIds: number[]) => {
    await Promise.allSettled(columnIds.map(columnId => refreshColumnInteraction(columnId)))
  }

  const submitColumnInteraction = async (columnId: number, type: 'LIKE' | 'COIN') => {
    const loadingKey = `${columnId}-${type}`
    if (interactionLoadingMap.value[loadingKey]) {
      return
    }

    const currentStats = getInteractionStats(columnId)
    interactionStatsMap.value[columnId] = {
      like: currentStats.like + (type === 'LIKE' ? 1 : 0),
      coin: currentStats.coin + (type === 'COIN' ? 1 : 0),
    }
    interactionLoadingMap.value[loadingKey] = true
    try {
      await columnAPI.interactionColumn({
        columnId,
        type,
      })
      await refreshColumnInteraction(columnId)
      ElMessage.success(type === 'LIKE' ? '点赞成功' : '投币成功')
    } catch {
      interactionStatsMap.value[columnId] = currentStats
      ElMessage.error(type === 'LIKE' ? '点赞失败，请稍后重试' : '投币失败，请稍后重试')
    } finally {
      interactionLoadingMap.value[loadingKey] = false
    }
  }

  const goToColumnEditor = () => {
    router.push('/tsukuyomi/column-editor')
  }

  const getCampaignStatusLabel = (status: CampaignCover['status']) => {
    if (status === 'ONLINE') return '活动进行中'
    if (status === 'OFFLINE') return '活动已结束'
    return '活动预热中'
  }

  const openActivityLanding = () => {
    if (!campaignCover.value.landingUrl) {
      ElMessage.warning('活动页 essayUrl 尚未配置')
      return
    }
    openExternalLink(campaignCover.value.landingUrl, '_self')
  }

  const previewDocument = (doc: ColumnDocument) => {
    if (!doc.previewUrl) {
      ElMessage.info('预览地址待后端下发，当前先展示卡片样式')
      return
    }
    openExternalLink(doc.previewUrl)
  }

  const downloadDocument = (doc: ColumnDocument) => {
    if (!doc.downloadUrl) {
      ElMessage.info('下载地址待后端下发，当前为占位状态')
      return
    }
    openExternalLink(doc.downloadUrl)
  }

  const hydrateColumnData = async () => {
    isColumnLoading.value = true
    columnLoadError.value = ''
    try {
      const docResponse = await columnAPI.searchColumn({
        keyword: '',
        pageNum: 1,
        pageSize: 20,
      })

      console.log('[ColumnView] API raw response:', JSON.stringify(docResponse, null, 2))
      console.log('[ColumnView] docResponse keys:', Object.keys(docResponse))

      const rawData = docResponse.data
      const isValidArray = Array.isArray(rawData) && rawData.length > 0

      if (isValidArray) {
        console.log('[ColumnView] 使用数组分支，条目数:', rawData.length)
        campaignCover.value = pickCampaignCover(rawData)
        console.log('[ColumnView] campaignCover after pick:', campaignCover.value)

        documentList.value = rawData.map(item => ({
          id: item.id,
          title: item.name,
          type: mapColumnTypeToDocType(item.type),
          size: '未知大小',
          updatedAt: String(item.createTime || '-'),
          description: item.description || '暂无描述',
          previewUrl: item.essayUrl || undefined,
          downloadUrl: item.essayUrl || undefined,
        }))

        await hydrateAllInteractions(documentList.value.map(item => item.id))
      } else if (typeof rawData === 'string' && rawData.trim()) {
        console.log('[ColumnView] 使用字符串兜底分支，data:', rawData)
        campaignCover.value = {
          ...defaultCampaignCover,
          landingUrl: rawData,
          status: 'ONLINE',
        }
        documentList.value = documents
      } else {
        console.warn('[ColumnView] data 既非有效数组也非非空字符串，使用本地占位数据')
        documentList.value = documents
      }
    } catch (err) {
      const error = err as { code?: string | number; message?: string; data?: unknown }
      console.error('[ColumnView] hydrateColumnData error:', error)
      console.error(
        '[ColumnView] error code:',
        error?.code,
        'message:',
        error?.message,
        'data:',
        error?.data
      )
      columnLoadError.value = '专栏数据加载失败，已保留本地占位内容'
      ElMessage.warning(columnLoadError.value)
      documentList.value = documents
    } finally {
      isColumnLoading.value = false
    }
  }

  onMounted(() => {
    void hydrateColumnData()
  })

  return {
    documents: documentList,
    campaignCover,
    isColumnLoading,
    columnLoadError,
    editIconUrl,
    getTypeLabel,
    getFileTypeClass,
    getInteractionStats,
    getInteractionLoading,
    getCampaignStatusLabel,
    goToColumnEditor,
    openActivityLanding,
    submitColumnInteraction,
    previewDocument,
    downloadDocument,
  }
}
