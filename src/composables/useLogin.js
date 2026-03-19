import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import { useAuth } from './useAuth.js';

export function useLogin() {
  const router = useRouter();
  const { login } = useAuth();

  const introVideo = ref(null);
  const cycleVideo = ref(null);
  const showForm = ref(false);
  const isLoading = ref(false);
  const error = ref('');
  const loginSuccess = ref(false);
  const isVideoLoaded = ref(false);
  const isRegisterMode = ref(false);
  const captchaUrl = ref('');
  const captchaInput = ref('');
  const email = ref('');
  const code = ref('');
  const codeCountdown = ref(0);
  const isSendingCode = ref(false);
  const showCaptchaModal = ref(false);

  const form = ref({
    username: '',
    password: ''
  });

  const loadVideoWithMediaSource = async (videoElement, videoUrl) => {
    try {
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      videoElement.src = url;
      return new Promise((resolve) => {
        videoElement.addEventListener('loadeddata', resolve);
      });
    } catch (error) {
      console.error('加载视频失败:', error);
      return Promise.reject(error);
    }
  };

  onMounted(async () => {
    const handleVideoLoaded = () => {
      isVideoLoaded.value = true;
      showForm.value = true;
      // 视频加载完成后开始播放
      if (introVideo.value) {
        introVideo.value.play();
      }
      if (cycleVideo.value) {
        cycleVideo.value.play();
      }
    };

    try {
      // 加载初始视频
      if (introVideo.value) {
        await loadVideoWithMediaSource(introVideo.value, '/resource/login_show.mp4');
      }
      // 加载循环视频
      if (cycleVideo.value) {
        await loadVideoWithMediaSource(cycleVideo.value, '/resource/login_show_cycle.mp4');
      }
      // 视频加载完成后显示表单
      handleVideoLoaded();
    } catch (error) {
      console.error('视频加载失败:', error);
      // 即使视频加载失败，也显示表单，确保用户可以登录
      handleVideoLoaded();
    }

    setTimeout(() => {
      if (introVideo.value) {
        introVideo.value.style.display = 'none';
      }
      if (cycleVideo.value) {
        cycleVideo.value.style.display = 'block';
      }
    }, 3000);
  });

  const onIntroEnd = () => {
    if (introVideo.value) {
      introVideo.value.style.display = 'none';
    }
    if (cycleVideo.value) {
      cycleVideo.value.style.display = 'block';
    }
  };

  const toggleMode = () => {
    isRegisterMode.value = !isRegisterMode.value;
    error.value = ''; // 切换模式时清空错误信息
  };

  // 前端生成验证码
  const generateCaptcha = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 100;
    canvas.height = 40;
    
    // 生成随机验证码
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let captchaText = '';
    for (let i = 0; i < 4; i++) {
      captchaText += chars[Math.floor(Math.random() * chars.length)];
    }
    
    // 保存验证码文本用于验证
    window.captchaText = captchaText;
    
    // 绘制验证码
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 添加干扰线
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.strokeStyle = `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`;
      ctx.stroke();
    }
    
    // 添加干扰点
    for (let i = 0; i < 50; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 1, 0, 2 * Math.PI);
      ctx.fillStyle = `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`;
      ctx.fill();
    }
    
    // 绘制验证码文本
    ctx.font = '20px Arial';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(captchaText, canvas.width / 2, canvas.height / 2);
    
    // 将canvas转换为base64 URL
    return canvas.toDataURL('image/png');
  };

  const refreshCaptcha = () => {
    // 前端生成验证码
    captchaUrl.value = generateCaptcha();
    captchaInput.value = '';
  };

  const startCodeCountdown = () => {
    codeCountdown.value = 600; // 10分钟，600秒
    const timer = setInterval(() => {
      if (codeCountdown.value > 0) {
        codeCountdown.value--;
      } else {
        clearInterval(timer);
      }
    }, 1000);
  };

  const handleSendVerificationCode = () => {
    if (!email.value) {
      error.value = '请输入邮箱';
      return;
    }

    // 显示图形验证码弹窗
    showCaptchaModal.value = true;
    refreshCaptcha();
  };

  const handleConfirmCaptcha = async () => {
    if (!captchaInput.value) {
      error.value = '请输入图形验证码';
      return;
    }

    // 前端验证验证码
    if (captchaInput.value.toUpperCase() !== window.captchaText.toUpperCase()) {
      error.value = '图形验证码错误';
      refreshCaptcha();
      return;
    }

    isSendingCode.value = true;
    error.value = '';

    try {
      // 发送验证码
      const codeResponse = await axios.post('/api/v1/auth/send-code', email.value, {
        headers: {
          'Content-Type': 'text/plain'
        }
      });

      if (codeResponse.data && codeResponse.data.code === '200' && codeResponse.data.data) {
        error.value = '验证码已发送，请查收';
        startCodeCountdown();
        showCaptchaModal.value = false;
        captchaInput.value = '';
      } else {
        error.value = '发送验证码失败，请重试';
      }
    } catch (err) {
      console.error('发送验证码失败:', err);
      error.value = '网络错误，请检查网络连接';
    } finally {
      isSendingCode.value = false;
    }
  };

  const handleCloseCaptchaModal = () => {
    showCaptchaModal.value = false;
    captchaInput.value = '';
    error.value = '';
  };

  const handleRegister = async () => {
    error.value = '';
    isLoading.value = true;
    
    // 验证邮箱和验证码
    if (!email.value) {
      error.value = '请输入邮箱';
      isLoading.value = false;
      return;
    }
    
    if (!code.value) {
      error.value = '请输入验证码';
      isLoading.value = false;
      return;
    }
    
    try {
      const response = await axios.post('/api/v1/auth/register', {
        username: form.value.username,
        password: form.value.password,
        email: email.value,
        code: code.value
      });
      
      if (response.data && response.data.code === '200') {
        login(response.data.data, form.value.username);
        loginSuccess.value = true;
        setTimeout(() => {
          router.push('/home');
        }, 1000);
      } else {
        error.value = response.data?.message || '注册失败，请重试';
      }
    } catch (err) {
      console.error('[Register] 注册失败:', err);
      error.value = '网络错误，请检查网络连接';
    } finally {
      isLoading.value = false;
    }
  };

  const handleSubmit = async () => {
    error.value = '';
    isLoading.value = true;
    
    try {
      const response = await axios.post('/api/v1/auth/login', {
        username: form.value.username,
        password: form.value.password
      });
      
      if (response.data && response.data.code === '200') {
        login(response.data.data, form.value.username);
        loginSuccess.value = true;
        setTimeout(() => {
          router.push('/home');
        }, 1000);
      } else {
        const errorCode = response.data.code;
        if (errorCode === '400.1') {
          error.value = '用户不存在，请先注册';
        } else if (errorCode === '400.2') {
          error.value = '密码错误，请重新输入';
        } else {
          error.value = response.data?.message || '操作失败，请重试';
        }
      }
    } catch (err) {
      console.error('[Login] 登录失败:', err);
      
      if (err.response && err.response.data) {
        const errorCode = err.response.data.code;
        const errorMessage = err.response.data.message;
      } else {
        error.value = '网络错误，请检查网络连接';
      }
    } finally {
      isLoading.value = false;
    }
  };

  const handleFormSubmit = async () => {
    if (isRegisterMode.value) {
      await handleRegister();
    } else {
      await handleSubmit();
    }
  };

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
    handleCloseCaptchaModal
  };
}
