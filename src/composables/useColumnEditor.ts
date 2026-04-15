import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useIconManager } from './useIconManager'

type ColumnCategory = 'knowledge' | 'daily' | 'gallery' | 'article' | 'other'

interface ColumnCategoryOption {
  label: string
  value: ColumnCategory
}

interface ImageAssetItem {
  id: number
  file: File
  previewUrl: string
}

interface AttachmentAssetItem {
  id: number
  file: File
}

interface ColumnDraftItem {
  id: number
  title: string
  category: ColumnCategory
  categoryLabel: string
  content: string
  imageCount: number
  attachmentCount: number
  summary: string
  updatedAt: string
}

const CURRENT_FORM_CACHE_KEY = 'columnEditorFormCache'
const DRAFT_LIST_CACHE_KEY = 'columnEditorDraftList'

export const useColumnEditor = () => {
  const router = useRouter()
  const { checkIconCache } = useIconManager()

  const categoryOptions: ColumnCategoryOption[] = [
    { label: '知识干货', value: 'knowledge' },
    { label: '生活日常', value: 'daily' },
    { label: '美图分享', value: 'gallery' },
    { label: '文章分享', value: 'article' },
    { label: '其他', value: 'other' },
  ]

  const backIconUrl = computed(() => {
    const iconData = checkIconCache('arrow-left.svg')
    return iconData ? `data:image/svg+xml;utf8,${encodeURIComponent(iconData)}` : ''
  })

  const saveIconUrl = computed(() => {
    const iconData = checkIconCache('check-circle.svg')
    return iconData ? `data:image/svg+xml;utf8,${encodeURIComponent(iconData)}` : ''
  })

  const uploadIconUrl = computed(() => {
    const iconData = checkIconCache('upload.svg')
    return iconData ? `data:image/svg+xml;utf8,${encodeURIComponent(iconData)}` : ''
  })

  const columnTitle = ref('')
  const category = ref<ColumnCategory>('knowledge')
  const summary = ref('')
  const content = ref('')
  const imageAssets = ref<ImageAssetItem[]>([])
  const attachmentAssets = ref<AttachmentAssetItem[]>([])
  const isSaving = ref(false)
  const isPublishing = ref(false)
  const formError = ref('')
  const formSuccess = ref('')
  const imageInputRef = ref<HTMLInputElement | null>(null)
  const attachmentInputRef = ref<HTMLInputElement | null>(null)
  const drafts = ref<ColumnDraftItem[]>([])

  const summaryLength = computed(() => summary.value.length)
  const contentLength = computed(() => content.value.length)
  const selectedCategoryLabel = computed(() => {
    return categoryOptions.find(item => item.value === category.value)?.label || '其他'
  })

  const imageCountText = computed(() => {
    return imageAssets.value.length > 0
      ? `已选择 ${imageAssets.value.length} 张图片`
      : '尚未选择图片'
  })

  const attachmentCountText = computed(() => {
    return attachmentAssets.value.length > 0
      ? `已选择 ${attachmentAssets.value.length} 个文件`
      : '尚未选择 Word/PDF 文件'
  })

  const formatNow = () => {
    return new Date().toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const goBack = () => {
    router.back()
  }

  const openImagePicker = () => {
    imageInputRef.value?.click()
  }

  const openAttachmentPicker = () => {
    attachmentInputRef.value?.click()
  }

  const handleImageChange = (event: Event) => {
    const target = event.target as HTMLInputElement
    const selectedFiles = Array.from(target.files || [])
    if (selectedFiles.length === 0) return

    const imageFiles = selectedFiles.filter(file => file.type.startsWith('image/'))
    if (imageFiles.length !== selectedFiles.length) {
      formError.value = '仅支持选择图片文件'
      return
    }

    const mapped = imageFiles.map(file => ({
      id: Date.now() + Math.floor(Math.random() * 10000),
      file,
      previewUrl: URL.createObjectURL(file),
    }))
    imageAssets.value = [...imageAssets.value, ...mapped]

    if (imageFiles.length > 0) {
      const markdownBlocks = imageFiles.map(file => `![${file.name}](待上传后替换链接)`).join('\n')
      content.value = content.value ? `${content.value}\n${markdownBlocks}` : markdownBlocks
    }

    formError.value = ''
    target.value = ''
  }

  const handleAttachmentChange = (event: Event) => {
    const target = event.target as HTMLInputElement
    const selectedFiles = Array.from(target.files || [])
    if (selectedFiles.length === 0) return

    const allowedFiles = selectedFiles.filter(file => {
      const lowerName = file.name.toLowerCase()
      return lowerName.endsWith('.pdf') || lowerName.endsWith('.doc') || lowerName.endsWith('.docx')
    })

    if (allowedFiles.length !== selectedFiles.length) {
      formError.value = '附件仅支持 .pdf / .doc / .docx'
      return
    }

    const mapped = allowedFiles.map(file => ({
      id: Date.now() + Math.floor(Math.random() * 10000),
      file,
    }))
    attachmentAssets.value = [...attachmentAssets.value, ...mapped]

    if (allowedFiles.length > 0) {
      const attachmentBlocks = allowedFiles
        .map(file => `- 附件：${file.name}（待上传后替换链接）`)
        .join('\n')
      content.value = content.value ? `${content.value}\n${attachmentBlocks}` : attachmentBlocks
    }

    formError.value = ''
    target.value = ''
  }

  const removeImageById = (id: number) => {
    const target = imageAssets.value.find(item => item.id === id)
    if (target) {
      URL.revokeObjectURL(target.previewUrl)
    }
    imageAssets.value = imageAssets.value.filter(item => item.id !== id)
  }

  const removeAttachmentById = (id: number) => {
    attachmentAssets.value = attachmentAssets.value.filter(item => item.id !== id)
  }

  const validateBeforeSubmit = () => {
    if (!columnTitle.value.trim()) {
      formError.value = '请填写专栏标题'
      return false
    }
    if (!content.value.trim()) {
      formError.value = '请填写专栏正文内容'
      return false
    }
    if (summary.value.trim().length < 10) {
      formError.value = '简介至少需要 10 个字，便于读者快速了解内容'
      return false
    }
    formError.value = ''
    return true
  }

  const persistCurrentForm = () => {
    localStorage.setItem(
      CURRENT_FORM_CACHE_KEY,
      JSON.stringify({
        columnTitle: columnTitle.value,
        category: category.value,
        summary: summary.value,
        content: content.value,
      })
    )
  }

  const persistDrafts = () => {
    localStorage.setItem(DRAFT_LIST_CACHE_KEY, JSON.stringify(drafts.value))
  }

  const loadCaches = () => {
    const formCache = localStorage.getItem(CURRENT_FORM_CACHE_KEY)
    if (formCache) {
      try {
        const parsed = JSON.parse(formCache) as {
          columnTitle?: string
          category?: ColumnCategory
          summary?: string
          content?: string
        }
        columnTitle.value = parsed.columnTitle || ''
        category.value = parsed.category || 'knowledge'
        summary.value = parsed.summary || ''
        content.value = parsed.content || ''
      } catch {
        localStorage.removeItem(CURRENT_FORM_CACHE_KEY)
      }
    }

    const draftsCache = localStorage.getItem(DRAFT_LIST_CACHE_KEY)
    if (draftsCache) {
      try {
        const parsed = JSON.parse(draftsCache) as ColumnDraftItem[]
        drafts.value = Array.isArray(parsed) ? parsed : []
      } catch {
        localStorage.removeItem(DRAFT_LIST_CACHE_KEY)
      }
    }
  }

  const saveDraft = async () => {
    formSuccess.value = ''
    formError.value = ''
    isSaving.value = true
    try {
      persistCurrentForm()
      const item: ColumnDraftItem = {
        id: Date.now(),
        title: columnTitle.value.trim() || '未命名草稿',
        category: category.value,
        categoryLabel: selectedCategoryLabel.value,
        content: content.value,
        imageCount: imageAssets.value.length,
        attachmentCount: attachmentAssets.value.length,
        summary: summary.value.trim(),
        updatedAt: formatNow(),
      }
      drafts.value = [item, ...drafts.value].slice(0, 10)
      persistDrafts()
      formSuccess.value = '草稿已保存'
    } finally {
      isSaving.value = false
    }
  }

  const publishColumnDoc = async () => {
    formSuccess.value = ''
    if (!validateBeforeSubmit()) return
    isPublishing.value = true
    try {
      persistCurrentForm()
      // 预留接口调用，当前先以成功反馈为主
      formSuccess.value = '专栏内容发布流程已提交（当前为演示态）'
    } finally {
      isPublishing.value = false
    }
  }

  onMounted(() => {
    loadCaches()
  })

  const clearObjectUrls = () => {
    imageAssets.value.forEach(item => {
      URL.revokeObjectURL(item.previewUrl)
    })
  }

  return {
    categoryOptions,
    backIconUrl,
    saveIconUrl,
    uploadIconUrl,
    columnTitle,
    category,
    summary,
    content,
    imageAssets,
    attachmentAssets,
    imageCountText,
    attachmentCountText,
    selectedCategoryLabel,
    summaryLength,
    contentLength,
    isSaving,
    isPublishing,
    formError,
    formSuccess,
    imageInputRef,
    attachmentInputRef,
    drafts,
    goBack,
    openImagePicker,
    openAttachmentPicker,
    handleImageChange,
    handleAttachmentChange,
    removeImageById,
    removeAttachmentById,
    saveDraft,
    publishColumnDoc,
    clearObjectUrls,
  }
}
