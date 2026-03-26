<script setup>
  import { ref, onMounted, computed } from 'vue'
  import { useRouter } from 'vue-router'
  import AppHeader from '../../components/AppHeader/AppHeader.vue'
  import { useUserProfile } from '../../composables/useUserProfile.js'
  import { useIconManager } from '../../composables/useIconManager.js'
  import { postAPI } from '../../services/api.js'

  // 初始化图标管理器
  const { checkIconCache } = useIconManager()

  // 计算属性，用于获取图标数据URL
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

  const router = useRouter()
  const { username, userAvatar, loadUserDetail } = useUserProfile()

  // 加载用户详情
  loadUserDetail()

  // 表单数据
  const title = ref('')
  const content = ref('')
  const postType = ref('')
  const coverImage = ref(null)
  const coverImagePreview = ref(null)
  const files = ref([])
  const coverImageInput = ref(null)

  // 处理退出
  const handleExit = () => {
    // 直接退出，删除所有内容
    if (confirm('确定要直接退出吗？所有未保存的内容将被删除。')) {
      // 清空表单数据
      title.value = ''
      content.value = ''
      postType.value = ''
      coverImage.value = null
      coverImagePreview.value = null
      files.value = []
      // 清除本地缓存
      localStorage.removeItem('postEditorCache')
      router.back()
    }
  }

  // 处理保存到本地
  const handleSaveLocally = () => {
    const cacheData = {
      title: title.value,
      content: content.value,
      postType: postType.value,
      // 注意：文件无法直接存储在localStorage中，这里只存储文本数据
    }
    localStorage.setItem('postEditorCache', JSON.stringify(cacheData))
    alert('内容已缓存到本地')
  }

  // 处理上传
  const handleSaveAndExit = async () => {
    try {
      const formData = new FormData()
      formData.append('title', title.value)
      formData.append('content', content.value)
      formData.append('type', postType.value)
      if (coverImage.value) {
        formData.append('coverImage', coverImage.value)
      }
      files.value.forEach((file, index) => {
        formData.append('files', file)
      })

      const result = await postAPI.uploadPost(formData)
      if (result.success) {
        // 上传成功后清除本地缓存
        localStorage.removeItem('postEditorCache')
        router.push('/tsukuyomi')
      } else {
        alert(result.message || '上传失败')
      }
    } catch (error) {
      console.error('上传失败:', error)
      alert(error.message || '上传失败')
    }
  }

  // 触发封面图片上传
  const triggerCoverImageUpload = () => {
    coverImageInput.value.click()
  }

  // 处理封面图片选择
  const handleCoverImageChange = event => {
    const file = event.target.files[0]
    if (file) {
      coverImage.value = file
      // 创建图片预览
      const reader = new FileReader()
      reader.onload = e => {
        coverImagePreview.value = e.target.result
      }
      reader.readAsDataURL(file)
    }
  }

  // 自动调整文本区域高度
  const autoResizeTextarea = event => {
    const textarea = event.target
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 800)}px` // 设置最大高度
  }

  // 从本地缓存加载数据
  const loadFromLocalCache = () => {
    const cachedData = localStorage.getItem('postEditorCache')
    if (cachedData) {
      try {
        const data = JSON.parse(cachedData)
        title.value = data.title || ''
        content.value = data.content || ''
        postType.value = data.postType || ''
      } catch (error) {
        console.error('加载本地缓存失败:', error)
      }
    }
  }

  // 组件挂载时加载本地缓存
  onMounted(() => {
    loadFromLocalCache()
  })

  // 处理内容中的文件添加
  const addFile = file => {
    files.value.push(file)
    return `{photo:"${file.name}"}`
  }

  // 处理拖拽事件
  const handleDragOver = event => {
    event.preventDefault()
  }

  const handleDrop = event => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (file) {
      const textToInsert = addFile(file)
      const textarea = event.target
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      content.value =
        content.value.substring(0, start) + textToInsert + content.value.substring(end)
      textarea.selectionStart = textarea.selectionEnd = start + textToInsert.length
    }
  }
</script>

<template src="./templates/PostEditor.html"></template>

<style scoped src="./styles/PostEditor.css"></style>
