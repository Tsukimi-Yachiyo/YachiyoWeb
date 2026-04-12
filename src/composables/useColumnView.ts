import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useIconManager } from './useIconManager'

type DocumentType = 'pdf' | 'word'

interface ColumnDocument {
  id: number
  title: string
  type: DocumentType
  size: string
  updatedAt: string
  description: string
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

export const useColumnView = () => {
  const router = useRouter()
  const { checkIconCache } = useIconManager()

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

  const goToColumnEditor = () => {
    router.push('/tsukuyomi/column-editor')
  }

  return {
    documents,
    editIconUrl,
    getTypeLabel,
    getFileTypeClass,
    goToColumnEditor,
  }
}
