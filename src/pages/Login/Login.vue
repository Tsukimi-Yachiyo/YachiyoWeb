<script setup>
  import { useLogin } from '../../composables/useLogin'

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
  } = useLogin()
</script>

<template src="./templates/Login.html"></template>

<style scoped src="./styles/Login.css"></style>
