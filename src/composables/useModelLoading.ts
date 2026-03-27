import { ref, onMounted, onUnmounted } from 'vue'

// 全局模型加载状态
const globalModelLoaded = ref(false)

export function useModelLoading() {
  const isLoading = ref(!globalModelLoaded.value)
  const loadProgress = ref(globalModelLoaded.value ? 100 : 0)
  const loadStatus = ref(globalModelLoaded.value ? '资源加载完成' : '正在与八千代建立连结...')
  const totalTextureSize = ref(0)

  const printLog = message => {
    console.log('[ModelLoading]', message)
  }

  const loadAndCheckTextures = async () => {
    const textureUrls = [
      '/resource/八千代辉夜姬/八千代辉夜姬.8192/texture_00.png',
      '/resource/八千代辉夜姬/八千代辉夜姬.8192/texture_01.png',
    ]

    let loadedSize = 0
    const totalTextures = textureUrls.length

    for (let i = 0; i < totalTextures; i++) {
      const url = textureUrls[i]
      try {
        // 更新进度为当前纹理的加载进度
        const progress = Math.round((i / totalTextures) * 100)
        loadProgress.value = progress
        loadStatus.value = `正在与八千代建立连结... ${progress}%`

        const response = await fetch(url)
        const blob = await response.blob()
        const size = blob.size
        loadedSize += size
        totalTextureSize.value = loadedSize

        // 计算进度
        const updatedProgress = Math.round(((i + 1) / totalTextures) * 100)
        loadProgress.value = updatedProgress
        loadStatus.value = `正在与八千代建立连结... ${updatedProgress}%`

        printLog(`Loaded texture ${url} (${(size / (1024 * 1024)).toFixed(2)} MB)`)
      } catch (error) {
        console.error(`Failed to load texture ${url}:`, error)
        // 即使加载失败，也要更新进度，确保进度条能够继续前进
        const progress = Math.round(((i + 1) / totalTextures) * 100)
        loadProgress.value = progress
        loadStatus.value = `正在与八千代建立连结... ${progress}%`
      }
    }

    // 检查总大小是否大于60MB
    const isSizeValid = loadedSize > 60 * 1024 * 1024
    printLog(
      `Total texture size: ${(loadedSize / (1024 * 1024)).toFixed(2)} MB, valid: ${isSizeValid}`
    )

    return isSizeValid
  }

  onMounted(async () => {
    // 如果模型已经加载完成，直接返回
    if (globalModelLoaded.value) {
      isLoading.value = false
      loadProgress.value = 100
      loadStatus.value = '资源加载完成'
      return
    }

    try {
      // 加载并检查纹理图片
      loadStatus.value = '正在加载纹理资源...'
      await loadAndCheckTextures()

      // 资源加载完成后等待2秒
      loadStatus.value = '资源加载完成，正在准备...'
      loadProgress.value = 100
      await new Promise(resolve => setTimeout(resolve, 2000))
    } catch (error) {
      console.error('Failed to load model resources:', error)
    } finally {
      // 加载完成，隐藏加载提示
      isLoading.value = false
      globalModelLoaded.value = true
    }
  })

  return {
    isLoading,
    loadProgress,
    loadStatus,
  }
}
