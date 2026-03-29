<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { useIconManager } from '../../composables/useIconManager'
  import { adminAPI } from '../../services/api'

  // 初始化图标管理器
  const { checkIconCache } = useIconManager()

  // 计算属性，用于获取图标数据URL
  const homeIconUrl = computed(() => {
    const iconData = checkIconCache('home.svg')
    return iconData ? `data:image/svg+xml;utf8,${encodeURIComponent(iconData)}` : ''
  })

  const settingsIconUrl = computed(() => {
    const iconData = checkIconCache('settings.svg')
    return iconData ? `data:image/svg+xml;utf8,${encodeURIComponent(iconData)}` : ''
  })

  const logoutIconUrl = computed(() => {
    const iconData = checkIconCache('logout.svg')
    return iconData ? `data:image/svg+xml;utf8,${encodeURIComponent(iconData)}` : ''
  })

  const router = useRouter()
  const route = useRoute()

  // 状态管理
  const isLoggedIn = ref(false)
  const username = ref('')
  const password = ref('')
  const isLoading = ref(false)
  const successMessage = ref('')
  const errorMessage = ref('')
  const files = ref<File[]>([])
  const pendingPosts = ref<any[]>([])
  const isLoadingPosts = ref(false)
  const showPostDetail = ref(false)
  const selectedPost = ref<any>(null)

  // 导航项
  const navItems = [
    { id: 'dashboard', label: '仪表盘', icon: '📊', path: '/admin/dashboard' },
    { id: 'posts', label: '帖子管理', icon: '📝', path: '/admin/posts' },
    { id: 'upload', label: '资源上传', icon: '📁', path: '/admin/upload' },
  ]

  // 当前选中的导航项
  const currentNavItem = computed(() => {
    const path = route.path
    const navItem = navItems.find(item => path.includes(item.id))
    return navItem ? navItem.id : 'dashboard'
  })

  // 导航栏激活状态
  const isNavActive = ref(false)

  // 检查登录状态
  const checkLoginStatus = () => {
    const token = localStorage.getItem('adminToken')
    isLoggedIn.value = !!token
  }

  // 登录
  const handleLogin = async () => {
    if (!username.value || !password.value) {
      errorMessage.value = '请输入用户名和密码'
      return
    }

    isLoading.value = true
    successMessage.value = ''
    errorMessage.value = ''

    try {
      const response = await adminAPI.login(username.value, password.value)
      if (response.code === '200') {
        localStorage.setItem('adminToken', response.data)
        isLoggedIn.value = true
        successMessage.value = '登录成功'
        router.push('/admin/dashboard')
      } else {
        errorMessage.value = response.message || '登录失败'
      }
    } catch (error) {
      errorMessage.value = error.message || '网络错误'
    } finally {
      isLoading.value = false
    }
  }

  // 登出
  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    isLoggedIn.value = false
    router.push('/admin')
  }

  // 处理文件变化
  const handleFileChange = (event: Event) => {
    const input = event.target as HTMLInputElement | null
    files.value = input?.files ? Array.from(input.files) : []
  }

  // 上传文件
  const handleUpload = async () => {
    if (files.value.length === 0) {
      errorMessage.value = '请选择文件'
      return
    }

    isLoading.value = true
    successMessage.value = ''
    errorMessage.value = ''

    try {
      const response = await adminAPI.uploadFiles(files.value)
      if (response.code === '200') {
        successMessage.value = '文件上传成功'
        files.value = []
        // 清空文件输入
        const fileInput = document.getElementById('fileInput') as HTMLInputElement | null
        if (fileInput) {
          fileInput.value = ''
        }
      } else {
        errorMessage.value = response.message || '上传失败'
      }
    } catch (error) {
      errorMessage.value = error.message || '网络错误'
    } finally {
      isLoading.value = false
    }
  }

  // 获取待审核帖子
  const getPendingPosts = async () => {
    isLoadingPosts.value = true
    errorMessage.value = ''

    try {
      const response = await adminAPI.getPendingPosts()
      if (response.code === '200') {
        pendingPosts.value = response.data
      } else {
        errorMessage.value = response.message || '获取帖子失败'
      }
    } catch (error) {
      errorMessage.value = error.message || '网络错误'
    } finally {
      isLoadingPosts.value = false
    }
  }

  // 审核帖子
  const reviewPost = async (postingId: number, action: string) => {
    isLoading.value = true
    successMessage.value = ''
    errorMessage.value = ''

    try {
      const response = await adminAPI.reviewPost(postingId, action)
      if (response.code === '200') {
        successMessage.value = '审核成功'
        // 重新获取待审核帖子
        await getPendingPosts()
      } else {
        errorMessage.value = response.message || '审核失败'
      }
    } catch (error) {
      errorMessage.value = error.message || '网络错误'
    } finally {
      isLoading.value = false
    }
  }

  // 显示帖子详情
  const goToPostDetail = (postingId: number) => {
    const post = pendingPosts.value.find(p => p.id === postingId)
    if (post) {
      selectedPost.value = post
      showPostDetail.value = true
    }
  }

  // 关闭帖子详情
  const closePostDetail = () => {
    showPostDetail.value = false
    selectedPost.value = null
  }

  // 切换导航项
  const selectNavItem = (path: string) => {
    router.push(path)
  }

  // 激活导航栏
  const activateNav = () => {
    isNavActive.value = true
  }

  // 失活导航栏
  const deactivateNav = () => {
    isNavActive.value = false
  }

  // 组件挂载时检查登录状态
  onMounted(() => {
    checkLoginStatus()
    if (isLoggedIn.value && route.path.includes('/posts')) {
      getPendingPosts()
    }
  })
</script>

<template src="./templates/Admin.html"></template>

<style scoped src="./styles/Admin.css"></style>
