import { ref } from 'vue'
const BACKGROUND_MUSIC_IMAGE_URL = new URL('../assets/images/backgoundMusic.jpeg', import.meta.url)
  .href

const MUSIC_FILES = [
  {
    name: '星降る海',
    artist: 'Aqu3ra / 早見沙織',
    url: '/resource/music/星降る海 - 日本群星&Aqu3ra&早見沙織.mp3',
    cover: BACKGROUND_MUSIC_IMAGE_URL,
  },
  {
    name: 'ワールドイズマイン',
    artist: 'ryo / 夏吉ゆうこ / 早見沙織',
    url: '/resource/music/ワールドイズマイン - 日本群星&ryo&夏吉ゆうこ&早見沙織.mp3',
    cover: BACKGROUND_MUSIC_IMAGE_URL,
  },
  {
    name: 'Ex-Otogibanashi',
    artist: 'ryo / 夏吉ゆうこ / 早見沙織',
    url: '/resource/music/Ex - 日本群星&ryo&夏吉ゆうこ&早見沙織.mp3',
    cover: BACKGROUND_MUSIC_IMAGE_URL,
  },
  {
    name: 'Remember',
    artist: 'yuigot / 早見沙織',
    url: '/resource/music/Remember - 日本群星&yuigot&早見沙織.mp3',
    cover: BACKGROUND_MUSIC_IMAGE_URL,
  },
  {
    name: 'Reply',
    artist: 'livetune / 夏吉ゆうこ',
    url: '/resource/music/Reply - 日本群星&livetune&夏吉ゆうこ.mp3',
    cover: BACKGROUND_MUSIC_IMAGE_URL,
  },
]

type APlayerInstance = {
  on: (event: string, handler: () => void) => void
  play: () => Promise<void> | void
  pause: () => void
}

const isPlaying = ref(false)
const isPlayerVisible = ref(false)

let player: APlayerInstance | null = null
let panelEl: globalThis.HTMLDivElement | null = null
let playerContainerEl: globalThis.HTMLDivElement | null = null
let styleEl: globalThis.HTMLStyleElement | null = null

const ensureStyle = () => {
  if (styleEl) return

  styleEl = document.createElement('style')
  styleEl.id = 'music-player-panel-style'
  styleEl.textContent = `
    .music-player-panel {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 4000;
      width: 340px;
      max-width: calc(100vw - 24px);
      padding: 10px;
      border-radius: 12px;
      background:
        linear-gradient(rgba(10, 10, 10, 0.58), rgba(10, 10, 10, 0.58)),
        url('${BACKGROUND_MUSIC_IMAGE_URL}') center / cover no-repeat;
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.35);
      backdrop-filter: blur(6px);
      border: 1px solid rgba(255, 255, 255, 0.12);
      display: none;
    }

    .music-player-close-btn {
      position: absolute;
      top: 8px;
      right: 10px;
      width: 28px;
      height: 28px;
      border: 1px solid rgba(255, 255, 255, 0.32);
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.55);
      color: #fff;
      font-size: 16px;
      line-height: 1;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.2s ease;
      z-index: 20;
      pointer-events: auto;
    }

    .music-player-close-btn:hover {
      background: rgba(0, 0, 0, 0.72);
    }

    .music-player-container {
      margin-top: 36px;
      position: relative;
      z-index: 10;
      
    }

    .music-player-panel .aplayer {
      margin: 0;
      border-radius: 10px;
      overflow: hidden;
      background: rgba(255, 255, 255, 0.95);
      box-shadow: none;
    }

    .music-player-panel .aplayer .aplayer-info .aplayer-music {
      margin-right: 10px;
    }

    .music-player-panel .aplayer .aplayer-info .aplayer-music .aplayer-title {
      color: #111827;
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 0.2px;
    }

    .music-player-panel .aplayer .aplayer-info .aplayer-music .aplayer-author {
      color: #374151;
      font-size: 13px;
      font-weight: 500;
      opacity: 1;
    }

    .music-player-panel .aplayer .aplayer-lrc,
    .music-player-panel .aplayer .aplayer-list {
      font-size: 13px;
    }

    .music-player-panel .aplayer .aplayer-list ol li {
      color: #1f2937;
    }

    @media (max-width: 768px) {
      .music-player-panel {
        left: 10px;
        right: 10px;
        top: auto;
        bottom: 16px;
        width: auto;
        max-width: none;
        padding: 8px;
        border-radius: 14px;
      }

      .music-player-close-btn {
        width: 30px;
        height: 30px;
      }

      .music-player-panel .aplayer {
        border-radius: 12px;
      }

      .music-player-panel .aplayer .aplayer-body,
      .music-player-panel .aplayer .aplayer-info {
        min-height: 70px;
      }

      .music-player-panel .aplayer .aplayer-info .aplayer-music .aplayer-title {
        font-size: 16px;
      }

      .music-player-panel .aplayer .aplayer-info .aplayer-music .aplayer-author {
        font-size: 14px;
      }
    }
  `

  document.head.appendChild(styleEl)
}

const updatePanelVisible = () => {
  if (!panelEl) return
  panelEl.style.display = isPlayerVisible.value ? 'block' : 'none'
}

const ensurePanel = () => {
  if (panelEl) return
  ensureStyle()

  panelEl = document.createElement('div')
  panelEl.className = 'music-player-panel'

  const closeBtn = document.createElement('button')
  closeBtn.type = 'button'
  closeBtn.textContent = '×'
  closeBtn.className = 'music-player-close-btn'
  closeBtn.setAttribute('aria-label', 'Close music player')
  closeBtn.addEventListener('click', () => {
    isPlayerVisible.value = false
    updatePanelVisible()
  })

  playerContainerEl = document.createElement('div')
  playerContainerEl.className = 'music-player-container'

  panelEl.appendChild(closeBtn)
  panelEl.appendChild(playerContainerEl)
  panelEl.appendChild(closeBtn)
  document.body.appendChild(panelEl)
}

const ensurePlayer = async () => {
  ensurePanel()
  if (player || !playerContainerEl) return

  const APlayerModule = await import('aplayer')
  const APlayerCtor = APlayerModule.default

  player = new APlayerCtor({
    container: playerContainerEl,
    audio: MUSIC_FILES,
    autoplay: false,
    loop: 'all',
    order: 'list',
    volume: 0.3,
    lrcType: 0,
  }) as APlayerInstance

  player.on('play', () => {
    isPlaying.value = true
  })

  player.on('pause', () => {
    isPlaying.value = false
  })
}

const safePlay = async () => {
  await ensurePlayer()
  if (!player) return

  try {
    await player.play()
  } catch (err) {
    console.warn('音乐播放失败:', err)
  }
}

export function useBackgroundMusic() {
  const toggle = async () => {
    isPlayerVisible.value = !isPlayerVisible.value
    updatePanelVisible()

    if (isPlayerVisible.value) {
      await safePlay()
    }
  }

  const start = async () => {
    await safePlay()
  }

  return {
    isPlaying,
    isPlayerVisible,
    toggle,
    start,
  }
}
