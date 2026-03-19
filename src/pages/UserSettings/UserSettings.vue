<script setup>
import { useUserSettings } from '../../composables/useUserSettings.js';

const {
  userName,
  userAvatar,
  avatarPreview,
  selectedFile,
  userIntroduction,
  userCity,
  userGender,
  userPhone,
  userBirthday,
  isLoading,
  isUploading,
  isSavingDetail,
  detailError,
  avatarError,
  successMessage,
  handleFileSelect,
  uploadAvatar,
  saveUserDetail,
  goBack
} = useUserSettings();
</script>

<template src="./templates/UserSettings.html"></template>

<style scoped src="./styles/UserSettings.css"></style>
