<script setup lang="ts">
  import { ref, onMounted, computed, onUnmounted } from 'vue'
  import type { HTMLCanvasElement } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { useIconManager } from '../../composables/useIconManager'

  const { checkIconCache } = useIconManager()

  const exitIconUrl = computed(() => {
    const iconData = checkIconCache('arrow-left.svg')
    return iconData ? `data:image/svg+xml;utf8,${encodeURIComponent(iconData)}` : ''
  })

  const router = useRouter()
  const route = useRoute()

  // PDF相关状态
  const title = ref('PDF查看器')
  const loading = ref(true)
  const error = ref('')
  const totalPages = ref(0)
  const pdfDoc = ref<any>(null)
  const canvasRefs = ref<{ [key: number]: HTMLCanvasElement }>({})
  const currentZoom = ref(1.0)
  const currentRotation = ref(0)

  // 进度跟踪
  const progress = ref(0)

  // 初始化状态
  const essayUrlRef = ref('')
  let pdfLoadingTask: any = null

  // 设置画布引用
  const setPageCanvas = (el: HTMLCanvasElement | null, pageNum: number) => {
    if (el) {
      canvasRefs.value[pageNum] = el
    }
  }

  // 退出处理
  const handleExit = () => {
    router.back()
  }

  // 缩放功能
  const zoomIn = () => {
    currentZoom.value = Math.min(currentZoom.value + 0.2, 3.0)
    renderAllPages()
  }

  const zoomOut = () => {
    currentZoom.value = Math.max(currentZoom.value - 0.2, 0.5)
    renderAllPages()
  }

  // 旋转功能
  const rotateLeft = () => {
    currentRotation.value -= 90
    if (currentRotation.value < 0) currentRotation.value += 360
    renderAllPages()
  }

  const rotateRight = () => {
    currentRotation.value += 90
    if (currentRotation.value >= 360) currentRotation.value -= 360
    renderAllPages()
  }

  // 创建PDF.js实例
  const initPDFJS = async () => {
    try {
      // 动态导入PDF.js库
      const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf')

      // 设置Worker路径
      const workerUrl = new URL('pdfjs-dist/legacy/build/pdf.worker.js', import.meta.url).href
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

      return pdfjsLib
    } catch (err) {
      console.error('PDF.js初始化失败:', err)
      throw new Error('PDF.js库未正确加载，请检查依赖')
    }
  }

  // 自定义Range请求函数
  const fetchWithRange = async (url: string, start: number, end: number) => {
    try {
      const response = await fetch(url, {
        headers: {
          Range: `bytes=${start}-${end}`,
          'Accept-Ranges': 'bytes',
        },
        method: 'GET',
      })

      if (!response.ok && response.status !== 206 && response.status !== 200) {
        throw new Error(`HTTP错误: ${response.status}`)
      }

      return await response.arrayBuffer()
    } catch (err) {
      console.error(`Range请求失败 (${start}-${end}):`, err)
      throw err
    }
  }

  // 逐步加载PDF文档
  const loadPdfDocument = async (url: string) => {
    try {
      const pdfjsLib = await initPDFJS()

      // 自定义文件加载器以支持Range请求
      class CustomFileLoader {
        url: string
        length: number | null = null
        chunkSize = 1024 * 1024 // 1MB chunks

        constructor(url: string) {
          this.url = url
        }

        async getTotalLength(): Promise<number> {
          if (this.length !== null) {
            return this.length
          }

          // 发送HEAD请求获取文件总长度
          const response = await fetch(this.url, { method: 'HEAD' })
          const contentLength = response.headers.get('Content-Length')

          if (contentLength) {
            this.length = parseInt(contentLength, 10)
            return this.length
          } else {
            // 如果服务器不支持Content-Length，则下载整个文件以确定大小
            console.warn('服务器不支持Content-Length，将加载完整文件')
            const fullResponse = await fetch(this.url)
            const arrayBuffer = await fullResponse.arrayBuffer()
            this.length = arrayBuffer.byteLength
            return this.length
          }
        }

        async getBytes(begin: number, end: number): Promise<Uint8Array> {
          const arrayBuffer = await fetchWithRange(this.url, begin, end - 1)
          return new Uint8Array(arrayBuffer)
        }
      }

      const fileLoader = new CustomFileLoader(url)
      const totalLength = await fileLoader.getTotalLength()

      // 设置进度回调
      const onProgressCallback = (loaded: number) => {
        progress.value = (loaded / totalLength) * 100
      }

      // 使用自定义加载器创建PDF文档
      const loadingTask = pdfjsLib.getDocument({
        url,
        httpHeaders: { Range: 'bytes=0-' },
        withCredentials: false,
        rangeChunkSize: fileLoader.chunkSize,
        onProgress: onProgressCallback,
      })

      pdfLoadingTask = loadingTask

      const pdf = await loadingTask.promise
      return pdf
    } catch (err) {
      console.error('PDF文档加载失败:', err)
      throw err
    }
  }

  // 渲染PDF页面
  const renderPage = async (pageNum: number) => {
    if (!pdfDoc.value || !canvasRefs.value[pageNum]) {
      return
    }

    try {
      const page = await pdfDoc.value.getPage(pageNum)
      const canvas = canvasRefs.value[pageNum]
      const context = canvas.getContext('2d')

      if (!context) {
        console.error(`Canvas上下文获取失败: 第${pageNum}页`)
        return
      }

      // 计算缩放和旋转
      const viewport = page.getViewport({
        scale: currentZoom.value,
        rotation: currentRotation.value,
      })

      // 设置canvas尺寸
      canvas.height = viewport.height
      canvas.width = viewport.width

      // 应用旋转变换
      context.save()
      context.translate(canvas.width / 2, canvas.height / 2)
      context.rotate((currentRotation.value * Math.PI) / 180)
      context.translate(-canvas.width / 2, -canvas.height / 2)

      const renderContext = {
        canvasContext: context,
        viewport: page.getViewport({ scale: currentZoom.value, rotation: 0 }), // 旋转已应用到context
      }

      await page.render(renderContext).promise
      context.restore()
    } catch (err) {
      console.error(`渲染第${pageNum}页失败:`, err)
    }
  }

  // 渲染所有页面
  const renderAllPages = async () => {
    for (let i = 1; i <= totalPages.value; i++) {
      await renderPage(i)
    }
  }

  // 加载PDF主函数
  const loadPdf = async () => {
    loading.value = true
    error.value = ''
    progress.value = 0

    try {
      const essayUrl = (route.query.pdfUrl as string) || (route.query.essayUrl as string)
      const pageTitle = route.query.title as string

      if (pageTitle) {
        title.value = pageTitle
      }

      if (!essayUrl) {
        throw new Error('未指定PDF文件URL')
      }

      essayUrlRef.value = essayUrl

      // 加载PDF文档
      pdfDoc.value = await loadPdfDocument(essayUrl)
      totalPages.value = pdfDoc.value.numPages

      // 渲染所有页面
      await renderAllPages()
    } catch (err: any) {
      console.error('PDF加载失败:', err)
      error.value = err instanceof Error ? err.message : 'PDF加载失败'
    } finally {
      loading.value = false
    }
  }

  // 在组件挂载时加载PDF
  onMounted(async () => {
    await loadPdf()
  })

  // 组件卸载时清理资源
  onUnmounted(() => {
    if (pdfLoadingTask) {
      pdfLoadingTask.destroy()
    }

    // 清理画布资源
    Object.values(canvasRefs.value).forEach(canvas => {
      if (canvas && canvas.getContext) {
        const context = canvas.getContext('2d')
        if (context) {
          context.clearRect(0, 0, canvas.width, canvas.height)
        }
      }
    })
  })
</script>

<template>
  <div class="pdf-viewer-container">
    <div class="header">
      <button class="exit-button" @click="handleExit">
        <img
          v-if="exitIconUrl"
          :src="exitIconUrl"
          alt="返回"
          style="width: 20px; height: 20px; filter: brightness(0) invert(1)"
        />
        <span>返回</span>
      </button>
      <h1 class="page-title">{{ title }}</h1>
      <div class="pdf-controls">
        <button class="control-btn" @click="zoomIn">+</button>
        <button class="control-btn" @click="zoomOut">-</button>
        <span class="zoom-level">{{ Math.round(currentZoom * 100) }}%</span>
        <button class="control-btn" @click="rotateLeft">↺</button>
        <button class="control-btn" @click="rotateRight">↻</button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>加载PDF中...</p>
      <p v-if="progress > 0" class="progress-text">{{ Math.round(progress) }}%</p>
    </div>

    <div v-else-if="error" class="error-banner">
      <p>{{ error }}</p>
      <button class="retry-button" @click="loadPdf">重试</button>
    </div>

    <div v-else class="pdf-content">
      <div v-for="pageNum in totalPages" :key="pageNum" class="pdf-page">
        <canvas :id="`pdf-page-${pageNum}`" :ref="el => setPageCanvas(el, pageNum)"></canvas>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .pdf-viewer-container {
    @apply w-full h-full flex flex-col;
    background: rgba(15, 23, 42, 0.95);
  }

  .header {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 20px 30px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(15, 23, 42, 0.98);
    z-index: 10;
  }

  .exit-button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    transition: all 0.3s ease;
  }

  .exit-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.35);
  }

  .page-title {
    font-size: 20px;
    font-weight: 700;
    color: white;
    margin: 0;
    flex: 1;
  }

  .pdf-controls {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .control-btn {
    width: 36px;
    height: 36px;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.1);
    color: white;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .control-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.05);
  }

  .zoom-level {
    color: white;
    font-size: 14px;
    min-width: 50px;
    text-align: center;
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    gap: 20px;
    color: rgba(255, 255, 255, 0.7);
  }

  .spinner {
    width: 50px;
    height: 50px;
    border: 4px solid rgba(255, 255, 255, 0.15);
    border-top-color: #667eea;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .progress-text {
    font-size: 18px;
    font-weight: bold;
  }

  .error-banner {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    padding: 20px;
    background: rgba(255, 87, 34, 0.15);
    border: 1px solid rgba(255, 87, 34, 0.35);
    border-radius: 12px;
    margin: 20px;
    color: rgba(255, 255, 255, 0.85);
  }

  .retry-button {
    margin-top: 12px;
    padding: 8px 20px;
    background: linear-gradient(135deg, #ff6b6b 0%, #d63031 100%);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.3s ease;
  }

  .retry-button:hover {
    transform: translateY(-1px);
  }

  .pdf-content {
    flex: 1;
    overflow-y: auto;
    padding: 40px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }

  .pdf-page {
    background: white;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    margin: 0 auto;
  }
</style>
