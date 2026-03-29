<script setup>
  import { ref, reactive, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { adminAPI } from '../../services/api.js'

  // 路由
  const router = useRouter()

  // 状态管理
  const activeTab = ref('upload')
  const isLoading = ref(false)
  const successMessage = ref('')
  const errorMessage = ref('')
  const isLoggedIn = ref(false)
  const showLoginForm = ref(false)

  // 标签页定义
  const tabs = [
    { id: 'upload', name: '文件上传' },
    { id: 'command', name: '命令执行' },
    { id: 'token', name: 'Token 管理' },
    { id: 'api', name: 'API 密钥' },
    { id: 'review', name: '帖子审核' },
    { id: 'query', name: '帖子查询' },
  ]

  // 文件上传相关
  const files = ref([])
  const uploadProgress = ref(0)

  // 命令执行相关
  const command = ref('')
  const commandResult = ref('')

  // Token 管理相关
  const remainingToken = ref(null)

  // API 密钥管理相关
  const apiKeyForm = reactive({
    apiKey: '',
    model: 'qwen-max',
  })

  // 管理员登录相关
  const loginForm = reactive({
    username: '',
    password: '',
  })

  // 页面加载时检查登录状态
  onMounted(() => {
    // 强制显示登录表单，因为管理员需要单独登录
    showLoginForm.value = true
    isLoggedIn.value = false
  })

  // 帖子审核相关
  const reviewForm = reactive({
    postingId: '',
    action: 'APPROVE',
    reason: '',
  })

  // 帖子查询相关
  const queryForm = reactive({
    status: '',
    keyword: '',
    pageNum: 1,
    pageSize: 20,
  })
  const postings = ref([])

  // 处理文件选择
  const handleFileChange = event => {
    files.value = Array.from(event.target.files)
  }

  // 处理文件上传
  const handleUpload = async () => {
    if (files.value.length === 0) {
      errorMessage.value = '请选择文件'
      return
    }

    isLoading.value = true
    successMessage.value = ''
    errorMessage.value = ''
    uploadProgress.value = 0

    try {
      const response = await adminAPI.uploadFiles(files.value)
      if (response.success) {
        successMessage.value = '文件上传成功'
        files.value = []
        // 清空文件输入
        document.getElementById('fileInput').value = ''
      } else {
        errorMessage.value = response.message || '上传失败'
      }
    } catch (error) {
      errorMessage.value = error.message || '网络错误'
    } finally {
      isLoading.value = false
      uploadProgress.value = 0
    }
  }

  // 执行命令
  const handleRunCommand = async () => {
    if (!command.value.trim()) {
      errorMessage.value = '请输入命令'
      return
    }

    isLoading.value = true
    successMessage.value = ''
    errorMessage.value = ''
    commandResult.value = ''

    try {
      const response = await adminAPI.runCommand(command.value)
      if (response.success) {
        commandResult.value = response.data || '命令执行成功'
        successMessage.value = '命令执行成功'
      } else {
        errorMessage.value = response.message || '命令执行失败'
      }
    } catch (error) {
      errorMessage.value = error.message || '网络错误'
    } finally {
      isLoading.value = false
    }
  }

  // 获取剩余 token
  const handleGetRemainingToken = async () => {
    isLoading.value = true
    successMessage.value = ''
    errorMessage.value = ''

    try {
      const response = await adminAPI.getRemainingToken()
      if (response.success) {
        remainingToken.value = response.data
        successMessage.value = '获取剩余 token 成功'
      } else {
        errorMessage.value = response.message || '获取失败'
      }
    } catch (error) {
      errorMessage.value = error.message || '网络错误'
    } finally {
      isLoading.value = false
    }
  }

  // 更改 API 密钥
  const handleChangeApiKey = async () => {
    if (!apiKeyForm.apiKey.trim()) {
      errorMessage.value = '请输入 API 密钥'
      return
    }

    isLoading.value = true
    successMessage.value = ''
    errorMessage.value = ''

    try {
      const response = await adminAPI.changeApiKey(apiKeyForm.apiKey, apiKeyForm.model)
      if (response.success) {
        successMessage.value = 'API 密钥更新成功'
        apiKeyForm.apiKey = ''
      } else {
        errorMessage.value = response.message || '更新失败'
      }
    } catch (error) {
      errorMessage.value = error.message || '网络错误'
    } finally {
      isLoading.value = false
    }
  }

  // 管理员登录
  const handleAdminLogin = async () => {
    if (!loginForm.username.trim() || !loginForm.password.trim()) {
      errorMessage.value = '请输入用户名和密码'
      return
    }

    isLoading.value = true
    successMessage.value = ''
    errorMessage.value = ''

    try {
      const response = await adminAPI.adminLogin(loginForm.username, loginForm.password)
      if (response.success) {
        successMessage.value = '登录成功'
        // 保存 token
        localStorage.setItem('token', response.data)
        isLoggedIn.value = true
        showLoginForm.value = false
        loginForm.username = ''
        loginForm.password = ''
      } else {
        errorMessage.value = response.message || '登录失败'
        // 登录失败，跳转到主页
        setTimeout(() => {
          router.push('/chat/home')
        }, 1000)
      }
    } catch (error) {
      errorMessage.value = error.message || '网络错误'
      // 登录失败，跳转到主页
      setTimeout(() => {
        router.push('/chat/home')
      }, 1000)
    } finally {
      isLoading.value = false
    }
  }

  // 审核帖子
  const handleReviewPosting = async () => {
    if (!reviewForm.postingId) {
      errorMessage.value = '请输入帖子 ID'
      return
    }

    isLoading.value = true
    successMessage.value = ''
    errorMessage.value = ''

    try {
      const response = await adminAPI.reviewPosting(
        parseInt(reviewForm.postingId),
        reviewForm.action,
        reviewForm.reason
      )
      if (response.success) {
        successMessage.value = '审核成功'
        reviewForm.postingId = ''
        reviewForm.reason = ''
      } else {
        errorMessage.value = response.message || '审核失败'
      }
    } catch (error) {
      errorMessage.value = error.message || '网络错误'
    } finally {
      isLoading.value = false
    }
  }

  // 查询帖子
  const handleQueryPostings = async () => {
    isLoading.value = true
    successMessage.value = ''
    errorMessage.value = ''

    try {
      const response = await adminAPI.queryPostings(
        queryForm.status,
        queryForm.keyword,
        queryForm.pageNum,
        queryForm.pageSize
      )
      if (response.success) {
        postings.value = response.data || []
        successMessage.value = '查询成功'
      } else {
        errorMessage.value = response.message || '查询失败'
      }
    } catch (error) {
      errorMessage.value = error.message || '网络错误'
    } finally {
      isLoading.value = false
    }
  }

  // 切换标签
  const switchTab = tab => {
    activeTab.value = tab
    // 清空消息
    successMessage.value = ''
    errorMessage.value = ''
  }
</script>

<template src="./templates/Admin.html"></template>

<style scoped src="./styles/Admin.css"></style>
