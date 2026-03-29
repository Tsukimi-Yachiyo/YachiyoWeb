<script setup lang="ts">
  import { useLogin } from '../composables/useLogin'
  import { ref, onMounted, onUnmounted } from 'vue'
  const {
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
  } = useLogin()

  // Splash screen logic
  const showSplash = ref(true)
  const countdown = ref(1)
  let countdownTimer: ReturnType<typeof setInterval> | null = null

  const hideSplashScreen = () => {
    if (showSplash.value) {
      showSplash.value = false
      // 确保 countdownTimer 存在再清除
      if (countdownTimer) {
        clearInterval(countdownTimer)
        countdownTimer = null
      }
      // 等待开屏动画的淡出效果(0.5s)结束后，再显示表单并开始加载视频
      setTimeout(() => {
        showForm.value = true
        // 图片消失后开始加载视频
        startVideoLoading()
      }, 500) // 这个时间应与 .fade-leave-active 的 transition 时间匹配
    }
  }

  onMounted(() => {
    countdownTimer = setInterval(() => {
      if (countdown.value > 0) {
        countdown.value -= 0.5
        console.log('倒计时:', countdown.value)
      } else {
        hideSplashScreen()
      }
    }, 500)
  })

  // 在组件卸载时清除定时器，防止内存泄漏
  onUnmounted(() => {
    if (countdownTimer) {
      clearInterval(countdownTimer)
    }
  })
</script>

<template>
  <!-- 开屏动画 -->
  <transition name="fade">
    <div v-if="showSplash" class="splash-screen">
      <div class="loading-text">正在登录月读</div>
    </div>
  </transition>

  <div class="login-container">
    <!-- 初始动画 -->
    <video ref="introVideo" class="intro-video" muted @ended="onIntroEnd">
      您的浏览器不支持视频播放。
    </video>

    <!-- 循环背景动画 -->
    <video ref="cycleVideo" class="cycle-video" muted loop style="display: none">
      您的浏览器不支持视频播放。
    </video>

    <!-- 登录/注册表单 -->
    <div class="login-form" :class="{ 'fade-in': showForm }">
      <div class="form-header">
        <h2>{{ isRegisterMode ? '注册' : '登录' }}</h2>
      </div>

      <form @submit.prevent="handleFormSubmit">
        <div class="form-group">
          <label for="username">用户名</label>
          <input
            id="username"
            v-model="form.username"
            type="text"
            placeholder="请输入用户名"
            required
          />
        </div>

        <div class="form-group">
          <label for="password">密码</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            required
            autocomplete="current-password"
          />
        </div>

        <!-- 注册模式下显示邮箱、验证码和图形验证码 -->
        <div v-if="isRegisterMode">
          <div class="form-group">
            <label for="email">邮箱</label>
            <input id="email" v-model="email" type="email" placeholder="请输入邮箱" required />
          </div>

          <div class="form-group">
            <label for="code">验证码</label>
            <div class="code-container">
              <input id="code" v-model="code" type="text" placeholder="请输入邮箱验证码" required />
              <button
                type="button"
                class="code-btn"
                :disabled="isSendingCode || codeCountdown > 0"
                @click="handleSendVerificationCode"
              >
                <span v-if="isSendingCode">发送中...</span>
                <span v-else-if="codeCountdown > 0"
                  >{{ Math.floor(codeCountdown / 60) }}分{{ codeCountdown % 60 }}秒后重发</span
                >
                <span v-else>获取验证码</span>
              </button>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button type="submit" class="login-btn" :disabled="isLoading">
            {{
              isLoading
                ? isRegisterMode
                  ? '注册中...'
                  : '登录中...'
                : isRegisterMode
                  ? '注册'
                  : '登录'
            }}
          </button>
        </div>

        <div v-if="error" class="error-message">{{ error }}</div>

        <div class="form-footer">
          <p>
            {{ isRegisterMode ? '已有账号？' : '还没有账号？' }}
            <a href="#" @click.prevent="toggleMode">{{ isRegisterMode ? '登录' : '注册' }}</a>
          </p>
        </div>
      </form>
    </div>

    <!-- 登录成功背景过渡 -->
    <div class="success-overlay" :class="{ show: loginSuccess }"></div>

    <!-- 图形验证码弹窗 -->
    <div v-if="showCaptchaModal" class="captcha-modal">
      <div class="captcha-modal-content">
        <h3>验证身份</h3>
        <p>请输入图形验证码以获取邮箱验证码</p>
        <div class="captcha-modal-form">
          <div class="captcha-container">
            <input v-model="captchaInput" type="text" placeholder="请输入图形验证码" required />
            <img :src="captchaUrl" alt="验证码" class="captcha-image" @click="refreshCaptcha" />
          </div>
          <div v-if="error" class="error-message">{{ error }}</div>
          <div class="captcha-modal-actions">
            <button type="button" class="cancel-btn" @click="handleCloseCaptchaModal">取消</button>
            <button
              type="button"
              class="confirm-btn"
              :disabled="isSendingCode"
              @click="handleConfirmCaptcha"
            >
              {{ isSendingCode ? '发送中...' : '确认' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
  .splash-screen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 2000;
    background-color: #2c3e50;
    background-image: url('@/assets/images/loginani.png');
    background-size: contain;
    background-position: center;
    background-repeat: no-repeat;
  }
  /* Vue 过渡动画 */
  .fade-leave-active {
    transition: opacity 0.5s ease;
  }

  .fade-leave-to {
    opacity: 0;
  }
  .login-container {
    position: relative;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding-top: 10vh;
  }

  .loading-text {
    position: absolute;
    top: 87%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: white;
    font-size: 20px;
    font-weight: 500;
    animation: pulse 1.5s ease-in-out infinite;
    text-shadow: 0 0 10px rgba(0, 0, 0, 0.7);
  }

  @keyframes pulse {
    0% {
      opacity: 0.6;
    }
    50% {
      opacity: 1;
    }
    100% {
      opacity: 0.6;
    }
  }

  .intro-video,
  .cycle-video {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: 0;
  }

  .login-form {
    position: relative;
    z-index: 1;
    background: rgba(255, 255, 255, 0.7);
    padding: 40px;
    border-radius: 10px;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
    width: 90%;
    max-width: 400px;
    opacity: 0; /* 初始状态为透明 */
    transition: opacity 0.8s ease-in-out; /* 定义淡入的过渡效果 */
    pointer-events: none; /* 初始状态下不可交互 */
  }

  .login-form.fade-in {
    opacity: 1; /* 淡入后变为不透明 */
    pointer-events: auto; /* 淡入后恢复交互 */
  }

  .form-header {
    text-align: center;
    margin-bottom: 30px;
  }

  .form-header h2 {
    margin-top: 0;
    color: #333;
    font-size: 24px;
    margin-bottom: 10px;
  }

  .form-subtitle {
    text-align: center;
    color: #666;
    margin-bottom: 20px;
    margin-top: 0;
  }

  .form-footer {
    text-align: center;
    margin-top: 20px;
  }

  .form-footer p {
    color: #666;
    font-size: 14px;
    margin: 0;
  }

  .form-footer a {
    color: #64b5f6;
    text-decoration: none;
    font-weight: 500;
    transition: color 0.3s ease;
  }

  .form-footer a:hover {
    color: #42a5f5;
    text-decoration: underline;
  }

  /* 验证码容器样式 */
  .captcha-container {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
  }

  .captcha-container input {
    height: 40px;
    box-sizing: border-box;
    flex: 1;
    min-width: 120px;
  }

  .captcha-image {
    width: 100px;
    height: 40px;
    cursor: pointer;
    border-radius: 5px;
    border: 1px solid #ddd;
    flex-shrink: 0;
  }

  @media (max-width: 768px) {
    .captcha-container {
      flex-direction: column;
      align-items: stretch;
    }

    .captcha-container input {
      width: 100%;
      margin-bottom: 10px;
    }

    .captcha-image {
      width: 100px;
      align-self: center;
    }
  }

  /* 验证码按钮容器样式 */
  .code-container {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .code-btn {
    padding: 10px 15px;
    border: none;
    border-radius: 5px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s ease;
    background-color: #64b5f6;
    color: white;
    white-space: nowrap;
  }

  .code-btn:hover:not(:disabled) {
    background-color: #42a5f5;
  }

  .code-btn:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }

  .form-group {
    margin-bottom: 20px;
  }

  .form-group label {
    display: block;
    margin-bottom: 5px;
    color: #333;
    font-weight: 500;
  }

  .form-group input {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 5px;
    font-size: 16px;
  }

  .login-btn {
    padding: 10px 20px;
    border: none;
    border-radius: 5px;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.3s ease;
    background-color: #64b5f6;
    color: white;
    width: 100%;
  }

  .login-btn:hover {
    background-color: #42a5f5;
  }

  .login-btn:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }

  .error-message {
    margin-top: 20px;
    padding: 10px;
    background-color: #ffebee;
    color: #c62828;
    border-radius: 5px;
    text-align: center;
  }

  .success-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: black;
    opacity: 0;
    transition: opacity 1s ease-in-out;
    z-index: 2;
    pointer-events: none;
  }

  .success-overlay.show {
    opacity: 1;
    pointer-events: auto;
  }

  @media (max-width: 768px) {
    .login-form {
      padding: 30px;
    }
  }

  /* 图形验证码弹窗样式 */
  .captcha-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .captcha-modal-content {
    background: white;
    padding: 30px;
    border-radius: 10px;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
    width: 90%;
    max-width: 400px;
  }

  .captcha-modal-content h3 {
    margin-top: 0;
    color: #333;
    font-size: 18px;
    margin-bottom: 10px;
    text-align: center;
  }

  .captcha-modal-content p {
    text-align: center;
    color: #666;
    margin-bottom: 20px;
  }

  .captcha-modal-form {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .captcha-modal-form .captcha-container {
    margin-bottom: 10px;
  }

  .captcha-modal-form .error-message {
    margin-top: 0;
  }

  .captcha-modal-actions {
    display: flex;
    gap: 10px;
    margin-top: 10px;
  }

  .captcha-modal-actions button {
    flex: 1;
    padding: 10px;
    border: none;
    border-radius: 5px;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .cancel-btn {
    background-color: #f5f5f5;
    color: #333;
    border: 1px solid #ddd;
  }

  .cancel-btn:hover {
    background-color: #e0e0e0;
  }

  .confirm-btn {
    background-color: #64b5f6;
    color: white;
  }

  .confirm-btn:hover:not(:disabled) {
    background-color: #42a5f5;
  }

  .confirm-btn:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
</style>
