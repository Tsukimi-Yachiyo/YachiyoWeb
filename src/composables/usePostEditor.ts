import { computed, onMounted, ref } from 'vue'
import { marked } from 'marked'
import { useRouter } from 'vue-router'
import { useIconManager } from './useIconManager'
import { useUserProfile } from './useUserProfile'
import { postAPI } from '../services/api'

interface PostEditorCacheData {
  title?: string
  content?: string
  postType?: string
}

export const usePostEditor = () => {
  const { checkIconCache } = useIconManager()
  const router = useRouter()
  const { username, userAvatar } = useUserProfile()

  const exitIconUrl = computed(() => {
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

  const previewIconUrl = computed(() => {
    const iconData = checkIconCache('eye.svg')
    return iconData ? `data:image/svg+xml;utf8,${encodeURIComponent(iconData)}` : ''
  })

  const editIconUrl = computed(() => {
    const iconData = checkIconCache('edit.svg')
    return iconData ? `data:image/svg+xml;utf8,${encodeURIComponent(iconData)}` : ''
  })

  const isPreviewMode = ref(false)
  const title = ref('')
  const content = ref('')
  const postType = ref('')
  const coverImage = ref<File | null>(null)
  const coverImagePreview = ref<string | null>(null)
  const files = ref<File[]>([])
  const coverImageInput = ref<HTMLInputElement | null>(null)

  const renderedContent = computed(() => {
    if (!content.value) return ''
    return marked(content.value)
  })

  const togglePreviewMode = () => {
    isPreviewMode.value = !isPreviewMode.value
  }

  const handleExit = () => {
    if (confirm('确定要直接退出吗？所有未保存的内容将被删除。')) {
      title.value = ''
      content.value = ''
      postType.value = ''
      coverImage.value = null
      coverImagePreview.value = null
      files.value = []
      localStorage.removeItem('postEditorCache')
      router.back()
    }
  }

  const handleSaveLocally = () => {
    const cacheData: PostEditorCacheData = {
      title: title.value,
      content: content.value,
      postType: postType.value,
    }
    localStorage.setItem('postEditorCache', JSON.stringify(cacheData))
    alert('内容已缓存到本地')
  }

  const handleSaveAndExit = async () => {
    try {
      const formData = new FormData()
      formData.append('title', title.value)
      formData.append('content', content.value)
      formData.append('type', postType.value)
      if (coverImage.value) {
        formData.append('coverImage', coverImage.value)
      }
      files.value.forEach(file => {
        formData.append('files', file)
      })

      const result = await postAPI.uploadPost(formData)
      if (result.success) {
        localStorage.removeItem('postEditorCache')
        router.push('/tsukuyomi')
      } else {
        alert(result.message || '上传失败')
      }
    } catch (error: unknown) {
      console.error('上传失败:', error)
      alert(error instanceof Error ? error.message : '上传失败')
    }
  }

  const triggerCoverImageUpload = () => {
    coverImageInput.value?.click()
  }

  const handleCoverImageChange = (event: Event) => {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]
    if (!file) return

    coverImage.value = file
    const reader = new FileReader()
    reader.onload = e => {
      coverImagePreview.value = (e.target?.result as string) || null
    }
    reader.readAsDataURL(file)
  }

  const autoResizeTextarea = (event: Event) => {
    const textarea = event.target as HTMLTextAreaElement
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 800)}px`
  }

  const loadFromLocalCache = () => {
    const cachedData = localStorage.getItem('postEditorCache')
    if (!cachedData) return

    try {
      const data = JSON.parse(cachedData) as PostEditorCacheData
      title.value = data.title || ''
      content.value = data.content || ''
      postType.value = data.postType || ''
    } catch (error: unknown) {
      console.error('加载本地缓存失败:', error)
    }
  }

  const addFile = (file: File) => {
    files.value.push(file)
    return `{photo:"${file.name}"}`
  }

  const handleDragOver = (event: DragEvent) => {
    event.preventDefault()
  }

  const handleDrop = (event: DragEvent) => {
    event.preventDefault()
    const file = event.dataTransfer?.files?.[0]
    if (!file) return

    const textToInsert = addFile(file)
    const textarea = event.target as HTMLTextAreaElement
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    content.value = content.value.substring(0, start) + textToInsert + content.value.substring(end)
    textarea.selectionStart = textarea.selectionEnd = start + textToInsert.length
  }

  onMounted(() => {
    loadFromLocalCache()
  })

  return {
    username,
    userAvatar,
    exitIconUrl,
    saveIconUrl,
    uploadIconUrl,
    previewIconUrl,
    editIconUrl,
    isPreviewMode,
    renderedContent,
    title,
    content,
    postType,
    coverImage,
    coverImagePreview,
    files,
    coverImageInput,
    togglePreviewMode,
    handleExit,
    handleSaveLocally,
    handleSaveAndExit,
    triggerCoverImageUpload,
    handleCoverImageChange,
    autoResizeTextarea,
    handleDragOver,
    handleDrop,
  }
}
