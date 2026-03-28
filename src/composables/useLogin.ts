import { ref, onMounted, watch } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { useAuth } from './useAuth'
import apiClient from '../services/api'

export function useLogin() {
  const router = useRouter()
  const { login } = useAuth()

  const introVideo = ref(null)
  const cycleVideo = ref(null)
  const showForm = ref(false)
  const isLoading = ref(false)
  const error = ref('')
  const loginSuccess = ref(false)
  const isVideoLoaded = ref(false)
  const isRegisterMode = ref(false)
  const captchaUrl = ref('')
  const captchaInput = ref('')
  const email = ref('')
  const code = ref('')
  const codeCountdown = ref(0)
  const isSendingCode = ref(false)
  const showCaptchaModal = ref(false)

  // 控制视频延迟加载
  const shouldLoadVideo = ref(false)
  const startVideoLoading = () => {
    shouldLoadVideo.value = true
  }

  const form = ref({
    username: '',
    password: '',
  })

  const loadVideoWithMediaSource = async (videoElement, videoUrl) => {
    try {
      const response = await fetch(videoUrl)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      videoElement.src = url
      return new Promise(resolve => {
        videoElement.addEventListener('loadeddata', resolve)
      })
    } catch (error) {
      console.error('加载视频失败:', error)
      return Promise.reject(error)
    }
  }

  onMounted(async () => {
    const handleVideoLoaded = () => {
      isVideoLoaded.value = true
      showForm.value = true
      // 视频加载完成后开始播放
      if (introVideo.value) {
        introVideo.value.play()
      }
      if (cycleVideo.value) {
        cycleVideo.value.play()
      }
    }

    // 等待图片消失后再加载视频
    const checkAndLoadVideo = async () => {
      if (!shouldLoadVideo.value) return

      try {
        // 加载初始视频
        if (introVideo.value) {
          await loadVideoWithMediaSource(
            introVideo.value,
            `${import.meta.env.BASE_URL}resource/login_show.mp4`
          )
        }
        // 加载循环视频
        if (cycleVideo.value) {
          await loadVideoWithMediaSource(
            cycleVideo.value,
            `${import.meta.env.BASE_URL}resource/login_show_cycle.mp4`
          )
        }
        // 视频加载完成后显示表单
        handleVideoLoaded()
      } catch (error) {
        console.error('视频加载失败:', error)
        // 即使视频加载失败，也显示表单，确保用户可以登录
        handleVideoLoaded()
      }

      setTimeout(() => {
        if (introVideo.value) {
          introVideo.value.style.display = 'none'
        }
        if (cycleVideo.value) {
          cycleVideo.value.style.display = 'block'
        }
      }, 3000)
    }

    // 监听 shouldLoadVideo 变化
    const unwatch = watch(shouldLoadVideo, newValue => {
      if (newValue) {
        checkAndLoadVideo()
        unwatch()
      }
    })
  })

  const onIntroEnd = () => {
    if (introVideo.value) {
      introVideo.value.style.display = 'none'
    }
    if (cycleVideo.value) {
      cycleVideo.value.style.display = 'block'
    }
  }

  const toggleMode = () => {
    isRegisterMode.value = !isRegisterMode.value
    error.value = '' // 切换模式时清空错误信息
  }

  // 前端生成验证码
  const generateCaptcha = () => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    canvas.width = 100
    canvas.height = 40

    // 生成随机验证码
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let captchaText = ''
    for (let i = 0; i < 4; i++) {
      captchaText += chars[Math.floor(Math.random() * chars.length)]
    }

    // 保存验证码文本用于验证
    window.captchaText = captchaText

    // 绘制验证码
    ctx.fillStyle = '#f5f5f5'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 添加干扰线
    for (let i = 0; i < 5; i++) {
      ctx.beginPath()
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height)
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height)
      ctx.strokeStyle = `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`
      ctx.stroke()
    }

    // 添加干扰点
    for (let i = 0; i < 50; i++) {
      ctx.beginPath()
      ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 1, 0, 2 * Math.PI)
      ctx.fillStyle = `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`
      ctx.fill()
    }

    // 绘制验证码文本
    ctx.font = '20px Arial'
    ctx.fillStyle = '#333'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(captchaText, canvas.width / 2, canvas.height / 2)

    // 将canvas转换为base64 URL
    return canvas.toDataURL('image/png')
  }

  const refreshCaptcha = () => {
    // 前端生成验证码
    captchaUrl.value = generateCaptcha()
    captchaInput.value = ''
  }

  const startCodeCountdown = () => {
    codeCountdown.value = 600 // 10分钟，600秒
    const timer = setInterval(() => {
      if (codeCountdown.value > 0) {
        codeCountdown.value--
      } else {
        clearInterval(timer)
      }
    }, 1000)
  }

  const handleSendVerificationCode = () => {
    if (!email.value) {
      error.value = '请输入邮箱'
      return
    }

    // 清理邮箱地址：去除首尾空格，转换为小写
    let cleanedEmail = email.value.trim().toLowerCase()

    // 移除非ASCII字符，避免服务器邮件库错误
    cleanedEmail = cleanedEmail.replace(/[^\u0020-\u007E]/g, '')

    if (cleanedEmail !== email.value.trim().toLowerCase()) {
      console.warn('邮箱地址包含非ASCII字符，已自动移除')
    }

    email.value = cleanedEmail

    // 验证邮箱格式 - 使用标准正则表达式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.value)) {
      error.value = '请输入有效的邮箱地址（如：username@example.com）'
      return
    }

    // 额外检查：确保邮箱地址合理长度
    if (email.value.length > 254) {
      error.value = '邮箱地址过长，请检查后重试'
      return
    }

    // 显示图形验证码弹窗
    showCaptchaModal.value = true
    refreshCaptcha()
  }

  const handleConfirmCaptcha = async () => {
    if (!captchaInput.value) {
      error.value = '请输入图形验证码'
      return
    }

    // 前端验证验证码
    if (captchaInput.value.toUpperCase() !== window.captchaText.toUpperCase()) {
      error.value = '图形验证码错误'
      refreshCaptcha()
      return
    }

    isSendingCode.value = true
    error.value = ''

    try {
      // 发送前再次清理邮箱地址
      email.value = email.value.trim().toLowerCase()
      email.value = email.value.replace(/[^\u0020-\u007E]/g, '')

      // 发送验证码 - 后端期望纯文本字符串，而不是JSON对象
      const codeResponse = await apiClient.post('/api/v1/auth/send-code', email.value, {
        headers: {
          'Content-Type': 'text/plain',
        },
      })

      if (codeResponse.data && codeResponse.data.success) {
        error.value = '验证码已发送，请查收'
        startCodeCountdown()
        showCaptchaModal.value = false
        captchaInput.value = ''
      } else {
        // 使用服务器返回的错误消息
        error.value = codeResponse.data?.message || '发送验证码失败，请重试'
      }
    } catch (err) {
      console.error('发送验证码失败:', err)
      console.error('错误对象详情:', JSON.stringify(err, null, 2))

      // 尝试从不同位置提取错误信息
      let errCode = ''
      let errMessage = ''

      // 检查错误对象的多种可能结构
      if (err && typeof err === 'object') {
        // 方式1: 直接属性（api拦截器返回的对象）
        errCode = err.code || err.Code || ''
        errMessage = err.message || err.Message || ''

        // 方式2: 如果是Axios错误，检查response.data
        if (!errCode && err.response && err.response.data) {
          errCode = err.response.data.code || err.response.data.Code || ''
          errMessage = err.response.data.message || err.response.data.Message || ''
        }

        // 方式3: 检查data属性
        if (!errCode && err.data) {
          errCode = err.data.code || err.data.Code || ''
          errMessage = err.data.message || err.data.Message || ''
        }
      }

      console.log('提取的错误信息 - code:', errCode, 'message:', errMessage)

      // 对于400错误"验证码已发送，请稍后再试"，也视为成功处理
      if (errCode === '400' && errMessage.includes('验证码已发送，请稍后再试')) {
        error.value = '验证码可能已发送，请检查邮箱。发送过于频繁，请稍后再试'
        // 即使频繁发送，也启动倒计时防止用户重复点击
        startCodeCountdown()
        showCaptchaModal.value = false
        captchaInput.value = ''
      } else if (
        errCode === '500' &&
        errMessage.includes('Local address contains illegal character')
      ) {
        error.value = '邮箱地址格式不正确，请检查后重试'
      } else {
        error.value = errMessage || '网络错误，请检查网络连接'
      }
    } finally {
      isSendingCode.value = false
    }
  }

  const handleCloseCaptchaModal = () => {
    showCaptchaModal.value = false
    captchaInput.value = ''
    error.value = ''
  }

  const handleRegister = async () => {
    error.value = ''
    isLoading.value = true

    // 验证邮箱和验证码
    if (!email.value) {
      error.value = '请输入邮箱'
      isLoading.value = false
      return
    }

    if (!code.value) {
      error.value = '请输入验证码'
      isLoading.value = false
      return
    }

    try {
      const response = await apiClient.post('/api/v1/auth/register', {
        username: form.value.username,
        password: form.value.password,
        email: email.value,
        code: code.value,
      })

      if (response.data && response.data.code === '200') {
        login(response.data.data, form.value.username)
        loginSuccess.value = true
        setTimeout(() => {
          router.push('/chat/home')
        }, 1000)
      } else {
        error.value = response.data?.message || '注册失败，请重试'
      }
    } catch (err) {
      console.error('[Register] 注册失败:', err)
      if (err.response && err.response.data) {
        const errorCode = err.response.data.code
        const errorMessage = err.response.data.message
        error.value = errorMessage || '注册失败，请重试'
      } else if (err.code) {
        error.value = err.message || '注册失败，请重试'
      } else {
        error.value = '网络错误，请检查网络连接'
      }
    } finally {
      isLoading.value = false
    }
  }

  const handleSubmit = async () => {
    error.value = ''
    isLoading.value = true

    try {
      const response = await apiClient.post('/api/v1/auth/login', {
        username: form.value.username,
        password: form.value.password,
      })

      if (response.data && response.data.code === '200') {
        login(response.data.data, form.value.username)
        loginSuccess.value = true
        setTimeout(() => {
          router.push('/chat/home')
        }, 1000)
      } else {
        const errorCode = response.data?.code
        if (errorCode === '400.1') {
          error.value = '用户不存在，请先注册'
        } else if (errorCode === '400.2') {
          error.value = '密码错误，请重新输入'
        } else {
          error.value = response.data?.message || '操作失败，请重试'
        }
      }
    } catch (err) {
      console.error('[Login] 登录失败:', err)

      if (err.response && err.response.data) {
        const errorCode = err.response.data.code
        const errorMessage = err.response.data.message
        // 根据错误码设置错误信息
        if (errorCode === '400.1') {
          error.value = '用户不存在，请先注册'
        } else if (errorCode === '400.2') {
          error.value = '密码错误，请重新输入'
        } else {
          error.value = errorMessage || '操作失败，请重试'
        }
      } else if (err.code) {
        // 处理 apiClient 拦截器返回的自定义错误对象
        if (err.code === '400.1') {
          error.value = '用户不存在，请先注册'
        } else if (err.code === '400.2') {
          error.value = '密码错误，请重新输入'
        } else {
          error.value = err.message || '操作失败，请重试'
        }
      } else {
        error.value = '网络错误，请检查网络连接'
      }
    } finally {
      isLoading.value = false
    }
  }

  const handleFormSubmit = async () => {
    if (isRegisterMode.value) {
      await handleRegister()
    } else {
      await handleSubmit()
    }
  }

  return {
    introVideo,
    cycleVideo,
    showForm,
    isLoading,
    error,
    loginSuccess,
    isVideoLoaded,
    isRegisterMode,
    captchaUrl,
    captchaInput,
    email,
    code,
    codeCountdown,
    isSendingCode,
    showCaptchaModal,
    form,
    onIntroEnd,
    handleSubmit,
    handleRegister,
    handleFormSubmit,
    toggleMode,
    refreshCaptcha,
    handleSendVerificationCode,
    handleConfirmCaptcha,
    handleCloseCaptchaModal,
    startVideoLoading,
  }
}
