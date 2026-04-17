<script setup lang="ts">
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import AppHeader from '../../components/AppHeader.vue'
  import VideoPlayer from '../../components/VideoPlayer/VideoPlayer.vue'
  import { useUserProfile } from '../../composables/useUserProfile'

  const router = useRouter()
  const { username, userAvatar } = useUserProfile()

  const videoFile = ref<File | null>(null)
  const videoSrc = ref('')
  const videoType = ref('mp4')
  const isLoading = ref(false)
  const errorMessage = ref('')

  const allFormats = ['mp4', 'mkv', 'flv', 'mov', 'wmv', 'avi', 'webm', 'ogg']

  const handleFileSelect = (event: Event) => {
    const target = event.target as HTMLInputElement
    if (!target.files || target.files.length === 0) return

    const file = target.files[0]
    videoFile.value = file
    errorMessage.value = ''

    const fileName = file.name.toLowerCase()
    let format = 'mp4'

    if (fileName.endsWith('.flv')) {
      format = 'flv'
    } else if (fileName.endsWith('.webm')) {
      format = 'webm'
    } else if (fileName.endsWith('.ogg')) {
      format = 'ogg'
    } else if (
      fileName.endsWith('.mkv') ||
      fileName.endsWith('.mov') ||
      fileName.endsWith('.wmv') ||
      fileName.endsWith('.avi')
    ) {
      errorMessage.value = `提示：${file.name.split('.').pop()} 格式可能无法在浏览器中原生播放，建议使用 MP4 或 WebM 格式。`
      format = 'mp4'
    }

    videoType.value = format
    isLoading.value = true

    const url = URL.createObjectURL(file)
    videoSrc.value = url
    isLoading.value = false
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/')
  }

  const handleDanmakuSend = (danmaku: any) => {
    console.log('弹幕已发送:', danmaku)
  }
</script>

<template>
  <div class="player-page">
    <AppHeader
      current-page="player"
      :username="username"
      :user-avatar="userAvatar"
      @logout="handleLogout"
    />

    <div class="player-content">
      <div class="player-main">
        <div class="upload-section">
          <div class="upload-box" @click="$refs.fileInput?.click()">
            <input
              ref="fileInput"
              type="file"
              :accept="allFormats.map(f => '.' + f).join(',')"
              class="hidden-input"
              @change="handleFileSelect"
            />
            <div v-if="!videoFile" class="upload-placeholder">
              <svg class="upload-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
              <p class="upload-text">点击或拖拽视频文件到此处</p>
              <p class="upload-hint">支持 MP4, MKV, FLV, MOV, WMV, AVI, WebM, OGG 等格式</p>
            </div>
            <div v-else class="upload-success">
              <svg class="success-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
              <p class="file-name">{{ videoFile.name }}</p>
              <p class="file-size">{{ (videoFile.size / (1024 * 1024)).toFixed(2) }} MB</p>
            </div>
          </div>
          <button v-if="videoFile" class="change-file-btn" @click="$refs.fileInput?.click()">
            更换视频
          </button>
        </div>

        <div v-if="errorMessage" class="error-message">
          <svg class="error-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
          </svg>
          {{ errorMessage }}
        </div>

        <div v-if="videoSrc" class="video-section">
          <VideoPlayer
            :video-src="videoSrc"
            :video-type="videoType"
            @send-danmaku="handleDanmakuSend"
          />
        </div>

        <div v-if="videoSrc" class="video-info-section">
          <div class="video-info-header">
            <h2 class="video-title">{{ videoFile?.name || '本地视频' }}</h2>
            <div class="video-actions">
              <button class="action-btn">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path
                    d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                  />
                </svg>
                点赞
              </button>
              <button class="action-btn">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path
                    d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92c0-1.61-1.31-2.92-2.92-2.92z"
                  />
                </svg>
                分享
              </button>
            </div>
          </div>
          <div class="video-stats">
            <span class="stat-item">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
                />
              </svg>
              本地播放
            </span>
            <span class="stat-item">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"
                />
              </svg>
              刚刚
            </span>
          </div>
        </div>
      </div>

      <div class="player-sidebar">
        <div class="sidebar-section">
          <h3 class="sidebar-title">播放列表</h3>
          <div class="playlist-empty">
            <p>暂无播放列表</p>
            <p class="hint">上传视频后会自动添加到历史记录</p>
          </div>
        </div>

        <div class="sidebar-section">
          <h3 class="sidebar-title">热门弹幕</h3>
          <div class="hot-danmaku-list">
            <div class="hot-danmaku-item">
              <span class="danmaku-text">2333</span>
              <span class="danmaku-count">128</span>
            </div>
            <div class="hot-danmaku-item">
              <span class="danmaku-text">awsl</span>
              <span class="danmaku-count">96</span>
            </div>
            <div class="hot-danmaku-item">
              <span class="danmaku-text">太强了</span>
              <span class="danmaku-count">64</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  @reference "tailwindcss";

  .player-page {
    @apply w-full min-h-screen bg-black text-white;
  }

  .player-content {
    @apply max-w-7xl mx-auto px-4 md:px-8 py-6 flex flex-col lg:flex-row gap-6;
  }

  .player-main {
    @apply flex-1 flex flex-col gap-4;
  }

  .upload-section {
    @apply flex flex-col gap-3;
  }

  .upload-box {
    @apply relative w-full aspect-video bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border-2 border-dashed border-gray-600 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:from-gray-800 hover:to-gray-700 transition-all;
  }

  .hidden-input {
    @apply hidden;
  }

  .upload-placeholder,
  .upload-success {
    @apply flex flex-col items-center gap-3 text-center;
  }

  .upload-icon,
  .success-icon {
    @apply w-16 h-16 text-blue-400;
  }

  .success-icon {
    @apply text-green-400;
  }

  .upload-text {
    @apply text-xl font-medium text-gray-300;
  }

  .upload-hint {
    @apply text-sm text-gray-500;
  }

  .file-name {
    @apply text-lg font-medium text-gray-200;
  }

  .file-size {
    @apply text-sm text-gray-400;
  }

  .change-file-btn {
    @apply px-6 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white hover:bg-gray-700 hover:border-gray-500 transition-all w-fit;
  }

  .error-message {
    @apply flex items-center gap-3 px-4 py-3 bg-orange-900/30 border border-orange-500/30 rounded-lg text-orange-300;
  }

  .error-icon {
    @apply w-6 h-6 flex-shrink-0;
  }

  .video-section {
    @apply w-full;
  }

  .video-info-section {
    @apply w-full bg-gray-900/50 rounded-xl p-5;
  }

  .video-info-header {
    @apply flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4;
  }

  .video-title {
    @apply text-xl font-bold;
  }

  .video-actions {
    @apply flex items-center gap-3;
  }

  .action-btn {
    @apply flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg text-white hover:bg-gray-700 transition-all;
  }

  .action-btn svg {
    @apply w-5 h-5;
  }

  .video-stats {
    @apply flex items-center gap-6 text-gray-400;
  }

  .stat-item {
    @apply flex items-center gap-2;
  }

  .stat-item svg {
    @apply w-4 h-4;
  }

  .player-sidebar {
    @apply w-full lg:w-80 flex flex-col gap-4;
  }

  .sidebar-section {
    @apply bg-gray-900/50 rounded-xl p-4;
  }

  .sidebar-title {
    @apply text-lg font-semibold mb-4;
  }

  .playlist-empty {
    @apply text-center text-gray-500 py-8;
  }

  .hint {
    @apply text-sm mt-2;
  }

  .hot-danmaku-list {
    @apply flex flex-col gap-2;
  }

  .hot-danmaku-item {
    @apply flex items-center justify-between px-3 py-2 bg-gray-800/50 rounded-lg;
  }

  .danmaku-text {
    @apply text-gray-300;
  }

  .danmaku-count {
    @apply text-sm text-gray-500;
  }
</style>
