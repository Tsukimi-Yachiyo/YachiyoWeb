<script setup lang="ts">
  /* eslint-disable no-undef */
  import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
  import flvjs from 'flv.js'

  interface Danmaku {
    id: number
    text: string
    color: string
    type: 'scroll' | 'top' | 'bottom'
    time: number
    top: number
  }

  const props = defineProps({
    videoSrc: {
      type: String,
      default: '',
    },
    videoType: {
      type: String,
      default: 'mp4',
    },
  })

  const emit = defineEmits(['send-danmaku'])

  const videoRef = ref<HTMLVideoElement | null>(null)
  const danmakuContainerRef = ref<HTMLDivElement | null>(null)
  const isPlaying = ref(false)
  const currentTime = ref(0)
  const duration = ref(0)
  const volume = ref(1)
  const isMuted = ref(false)
  const isFullscreen = ref(false)
  const showControls = ref(true)
  const danmakuInput = ref('')
  const danmakuList = ref<Danmaku[]>([])
  const activeDanmakus = ref<Danmaku[]>([])
  const showDanmaku = ref(true)
  let flvPlayer: flvjs.Player | null = null
  let controlsTimeout: ReturnType<typeof setTimeout> | null = null
  const animationFrameId: number | null = null

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const progressPercent = computed(() => {
    if (duration.value === 0) return 0
    return (currentTime.value / duration.value) * 100
  })

  const togglePlay = () => {
    if (!videoRef.value) return
    if (isPlaying.value) {
      videoRef.value.pause()
    } else {
      videoRef.value.play()
    }
    isPlaying.value = !isPlaying.value
  }

  const handleTimeUpdate = () => {
    if (!videoRef.value) return
    currentTime.value = videoRef.value.currentTime
    updateDanmakus()
  }

  const handleLoadedMetadata = () => {
    if (!videoRef.value) return
    duration.value = videoRef.value.duration
  }

  const handleProgressClick = (e: MouseEvent) => {
    if (!videoRef.value) return
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    videoRef.value.currentTime = percent * duration.value
  }

  const handleVolumeChange = (e: Event) => {
    const target = e.target as HTMLInputElement
    volume.value = parseFloat(target.value)
    if (videoRef.value) {
      videoRef.value.volume = volume.value
    }
    isMuted.value = volume.value === 0
  }

  const toggleMute = () => {
    if (!videoRef.value) return
    isMuted.value = !isMuted.value
    videoRef.value.muted = isMuted.value
  }

  const toggleFullscreen = () => {
    const container = danmakuContainerRef.value?.parentElement
    if (!container) return

    if (!document.fullscreenElement) {
      container.requestFullscreen()
      isFullscreen.value = true
    } else {
      document.exitFullscreen()
      isFullscreen.value = false
    }
  }

  const handleMouseMove = () => {
    showControls.value = true
    if (controlsTimeout) {
      clearTimeout(controlsTimeout)
    }
    controlsTimeout = setTimeout(() => {
      if (isPlaying.value) {
        showControls.value = false
      }
    }, 3000)
  }

  const sendDanmaku = () => {
    if (!danmakuInput.value.trim()) return

    const newDanmaku: Danmaku = {
      id: Date.now(),
      text: danmakuInput.value,
      color: '#ffffff',
      type: 'scroll',
      time: currentTime.value,
      top: Math.random() * 70,
    }

    danmakuList.value.push(newDanmaku)
    activeDanmakus.value.push(newDanmaku)
    emit('send-danmaku', newDanmaku)
    danmakuInput.value = ''

    setTimeout(() => {
      const index = activeDanmakus.value.findIndex(d => d.id === newDanmaku.id)
      if (index > -1) {
        activeDanmakus.value.splice(index, 1)
      }
    }, 8000)
  }

  const updateDanmakus = () => {
    const current = currentTime.value
    danmakuList.value.forEach(danmaku => {
      if (
        Math.abs(danmaku.time - current) < 0.5 &&
        !activeDanmakus.value.find(d => d.id === danmaku.id)
      ) {
        activeDanmakus.value.push(danmaku)
        setTimeout(() => {
          const index = activeDanmakus.value.findIndex(d => d.id === danmaku.id)
          if (index > -1) {
            activeDanmakus.value.splice(index, 1)
          }
        }, 8000)
      }
    })
  }

  const initFlvPlayer = () => {
    if (!videoRef.value || props.videoType !== 'flv' || !flvjs.isSupported()) return

    if (flvPlayer) {
      flvPlayer.destroy()
    }

    flvPlayer = flvjs.createPlayer({
      type: 'flv',
      url: props.videoSrc,
    })

    flvPlayer.attachMediaElement(videoRef.value)
    flvPlayer.load()
  }

  watch(
    () => props.videoSrc,
    () => {
      if (props.videoType === 'flv') {
        initFlvPlayer()
      }
    }
  )

  onMounted(() => {
    if (props.videoType === 'flv') {
      initFlvPlayer()
    }

    document.addEventListener('fullscreenchange', () => {
      isFullscreen.value = !!document.fullscreenElement
    })
  })

  onUnmounted(() => {
    if (flvPlayer) {
      flvPlayer.destroy()
    }
    if (controlsTimeout) {
      clearTimeout(controlsTimeout)
    }
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
    }
  })
</script>

<template>
  <div
    class="video-player-container"
    @mousemove="handleMouseMove"
    @mouseleave="showControls = true"
  >
    <div ref="danmakuContainerRef" class="video-wrapper">
      <video
        ref="videoRef"
        :src="videoSrc"
        class="video-element"
        @timeupdate="handleTimeUpdate"
        @loadedmetadata="handleLoadedMetadata"
        @play="isPlaying = true"
        @pause="isPlaying = false"
        @click="togglePlay"
      ></video>

      <div v-if="showDanmaku" class="danmaku-layer">
        <div
          v-for="danmaku in activeDanmakus"
          :key="danmaku.id"
          class="danmaku-item"
          :class="danmaku.type"
          :style="{ color: danmaku.color, top: danmaku.top + '%' }"
        >
          {{ danmaku.text }}
        </div>
      </div>

      <div class="controls-overlay" :class="{ 'controls-hidden': !showControls && isPlaying }">
        <div class="progress-bar-container" @click="handleProgressClick">
          <div class="progress-bar">
            <div class="progress-buffered"></div>
            <div class="progress-played" :style="{ width: progressPercent + '%' }">
              <div class="progress-thumb"></div>
            </div>
          </div>
        </div>

        <div class="controls-bar">
          <div class="controls-left">
            <button class="control-btn" @click="togglePlay">
              <svg v-if="!isPlaying" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            </button>

            <div class="volume-control">
              <button class="control-btn" @click="toggleMute">
                <svg v-if="!isMuted && volume > 0.5" viewBox="0 0 24 24" fill="currentColor">
                  <path
                    d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"
                  />
                </svg>
                <svg v-else-if="!isMuted && volume > 0" viewBox="0 0 24 24" fill="currentColor">
                  <path
                    d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"
                  />
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="currentColor">
                  <path
                    d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"
                  />
                </svg>
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                :value="volume"
                class="volume-slider"
                @input="handleVolumeChange"
              />
            </div>

            <span class="time-display">
              {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
            </span>
          </div>

          <div class="controls-right">
            <button class="control-btn" @click="showDanmaku = !showDanmaku">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path
                  v-if="showDanmaku"
                  d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"
                />
                <path
                  v-else
                  d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"
                />
              </svg>
            </button>

            <button class="control-btn" @click="toggleFullscreen">
              <svg v-if="!isFullscreen" viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"
                />
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="danmaku-input-container">
      <input
        v-model="danmakuInput"
        type="text"
        placeholder="发送弹幕..."
        class="danmaku-input"
        @keyup.enter="sendDanmaku"
      />
      <button class="send-danmaku-btn" @click="sendDanmaku">发送</button>
    </div>
  </div>
</template>

<style scoped>
  @reference "tailwindcss";

  .video-player-container {
    @apply w-full bg-black rounded-xl overflow-hidden;
  }

  .video-wrapper {
    @apply relative w-full aspect-video bg-black;
  }

  .video-element {
    @apply w-full h-full object-contain;
  }

  .danmaku-layer {
    @apply absolute inset-0 pointer-events-none overflow-hidden;
  }

  .danmaku-item {
    @apply absolute whitespace-nowrap text-lg font-bold drop-shadow-lg;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
    animation: danmaku-scroll 8s linear forwards;
  }

  .danmaku-item.scroll {
    left: 100%;
    animation: danmaku-scroll 8s linear forwards;
  }

  .danmaku-item.top,
  .danmaku-item.bottom {
    left: 50%;
    transform: translateX(-50%);
    animation: danmaku-fade 5s linear forwards;
  }

  .danmaku-item.top {
    top: 10%;
  }

  .danmaku-item.bottom {
    top: 80%;
  }

  @keyframes danmaku-scroll {
    from {
      transform: translateX(0);
    }
    to {
      transform: translateX(-150%);
    }
  }

  @keyframes danmaku-fade {
    0% {
      opacity: 0;
    }
    10% {
      opacity: 1;
    }
    90% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }

  .controls-overlay {
    @apply absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300;
  }

  .controls-overlay.controls-hidden {
    opacity: 0;
  }

  .progress-bar-container {
    @apply w-full px-4 py-2 cursor-pointer;
  }

  .progress-bar {
    @apply relative w-full h-1 bg-white/30 rounded-full;
  }

  .progress-buffered {
    @apply absolute h-full bg-white/40 rounded-full;
  }

  .progress-played {
    @apply absolute h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full;
  }

  .progress-thumb {
    @apply absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg;
  }

  .controls-bar {
    @apply flex items-center justify-between px-4 pb-4;
  }

  .controls-left,
  .controls-right {
    @apply flex items-center gap-3;
  }

  .control-btn {
    @apply w-10 h-10 flex items-center justify-center text-white hover:text-blue-400 transition-colors;
  }

  .control-btn svg {
    @apply w-6 h-6;
  }

  .volume-control {
    @apply flex items-center gap-2;
  }

  .volume-slider {
    @apply w-20 h-1 bg-white/30 rounded-full appearance-none cursor-pointer;
  }

  .volume-slider::-webkit-slider-thumb {
    @apply w-3 h-3 bg-white rounded-full appearance-none;
  }

  .time-display {
    @apply text-white text-sm font-medium;
  }

  .danmaku-input-container {
    @apply flex items-center gap-3 p-4 bg-gray-900/50;
  }

  .danmaku-input {
    @apply flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 outline-none focus:border-blue-400 focus:bg-white/15 transition-all;
  }

  .send-danmaku-btn {
    @apply px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all;
  }
</style>
