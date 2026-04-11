import { ref } from 'vue'

const MUSIC_FILES = [
  '/resource/music/星降る海 - 日本群星&Aqu3ra&早見沙織.mp3',
  '/resource/music/ワールドイズマイン - 日本群星&ryo&夏吉ゆうこ&早見沙織.mp3',
  '/resource/music/Ex - 日本群星&ryo&夏吉ゆうこ&早見沙織.mp3',
  '/resource/music/Remember - 日本群星&yuigot&早見沙織.mp3',
  '/resource/music/Reply - 日本群星&livetune&夏吉ゆうこ.mp3',
]

const audio = new Audio()
audio.loop = false
audio.volume = 0.3
audio.src = ''

const isPlaying = ref(false)
const currentTrackIndex = ref(0)

const playNext = () => {
  currentTrackIndex.value = (currentTrackIndex.value + 1) % MUSIC_FILES.length
  audio.src = MUSIC_FILES[currentTrackIndex.value]
  audio.play().catch(err => {
    console.warn('音乐播放失败:', err)
  })
}

audio.addEventListener('ended', playNext)

export function useBackgroundMusic() {
  const toggle = () => {
    if (isPlaying.value) {
      audio.pause()
      isPlaying.value = false
    } else {
      if (!audio.src || audio.src === window.location.href) {
        audio.src = MUSIC_FILES[currentTrackIndex.value]
      }
      audio
        .play()
        .then(() => {
          isPlaying.value = true
        })
        .catch(err => {
          console.warn('音乐播放失败:', err)
        })
    }
  }

  const start = () => {
    if (!audio.src || audio.src === window.location.href) {
      audio.src = MUSIC_FILES[currentTrackIndex.value]
    }
    audio
      .play()
      .then(() => {
        isPlaying.value = true
      })
      .catch(err => {
        console.warn('音乐自动播放失败:', err)
      })
  }

  return {
    isPlaying,
    toggle,
    start,
  }
}
