<script setup lang="ts">
  import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { useIconManager } from '../../composables/useIconManager'

  const { checkIconCache } = useIconManager()

  const exitIconUrl = computed(() => {
    const iconData = checkIconCache('arrow-left.svg')
    return iconData ? `data:image/svg+xml;utf8,${encodeURIComponent(iconData)}` : ''
  })

  const uploadIconUrl = computed(() => {
    const iconData = checkIconCache('upload.svg')
    return iconData ? `data:image/svg+xml;utf8,${encodeURIComponent(iconData)}` : ''
  })

  const downloadIconUrl = computed(() => {
    const iconData = checkIconCache('download.svg')
    return iconData ? `data:image/svg+xml;utf8,${encodeURIComponent(iconData)}` : ''
  })

  const router = useRouter()
  const route = useRoute()

  // 基础状态
  const currentFile = ref<File | null>(null)
  const fileContent = ref('')
  const isLoading = ref(false)
  const loadProgress = ref(0)
  const fileType = ref('')
  const errorMessage = ref('')
  const fileInput = ref<HTMLInputElement | null>(null)
  const fileUrl = ref<string | null>(null)
  const fileName = ref('')

  // PDF 相关状态
  const pdfDoc = ref<any>(null)
  const currentPage = ref(1)
  const totalPages = ref(0)
  const pageScale = ref(1.5)
  const isPdfRendering = ref(false)

  // 支持的文件类型
  const supportedTypes = [
    { ext: '.doc', mime: 'application/msword', name: 'Word' },
    {
      ext: '.docx',
      mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      name: 'Word',
    },
    { ext: '.ppt', mime: 'application/vnd.ms-powerpoint', name: 'PowerPoint' },
    {
      ext: '.pptx',
      mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      name: 'PowerPoint',
    },
    { ext: '.pdf', mime: 'application/pdf', name: 'PDF' },
    { ext: '.html', mime: 'text/html', name: 'HTML' },
    { ext: '.htm', mime: 'text/html', name: 'HTML' },
    { ext: '.txt', mime: 'text/plain', name: 'Text' },
  ]

  // 退出
  const handleExit = () => {
    router.back()
  }

  // 触发文件上传
  const triggerFileUpload = () => {
    fileInput.value?.click()
  }

  // 获取文件类型
  const getFileType = (name: string) => {
    const ext = name.toLowerCase().substring(name.lastIndexOf('.'))
    return supportedTypes.find(t => t.ext === ext) || { ext, mime: '', name: 'Unknown' }
  }

  // 从 URL 中提取文件名
  const extractFileNameFromUrl = (url: string): string => {
    try {
      const urlObj = new URL(url, window.location.origin)
      const name = urlObj.searchParams.get('fileName')
      if (name) return decodeURIComponent(name)

      const pathname = urlObj.pathname
      const lastSlash = pathname.lastIndexOf('/')
      if (lastSlash > -1) return pathname.substring(lastSlash + 1)
    } catch {
      // 忽略错误
    }
    return 'file'
  }

  // ============================================
  // PDF 处理函数（基于 CDN PDF.js v3.11.174）
  // ============================================
  const loadPdfWithCdn = async (url: string | ArrayBuffer) => {
    console.log('开始用 CDN PDF.js 加载 PDF, 输入类型:', typeof url)
    try {
      isLoading.value = true
      isPdfRendering.value = true

      // 确保 pdfjsLib 已加载
      if (!(window as any).pdfjsLib) {
        throw new Error('PDF.js 未加载，请刷新页面重试')
      }

      const pdfjsLib = (window as any).pdfjsLib

      // 配置 worker
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'

      // 配置选项 - 完美支持 Range 请求
      const options: any = {
        disableAutoFetch: true, // 禁用自动预取全部内容
        rangeChunkSize: 65536, // 每次请求 64KB 数据块
        disableStream: false, // 启用流式传输
        enableXfa: false,
        cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
        cMapPacked: true, // 支持中文
      }

      if (typeof url === 'string') {
        options.url = url
      } else {
        options.data = url
      }

      const loadingTask = pdfjsLib.getDocument(options)

      console.log('PDF loadingTask 创建成功，等待 promise...')
      pdfDoc.value = await loadingTask.promise
      console.log('PDF 文档加载完成，总页数:', pdfDoc.value.numPages)
      totalPages.value = pdfDoc.value.numPages

      await nextTick()
      renderPdfPage(currentPage.value)

      errorMessage.value = ''
    } catch (error) {
      console.error('PDF 加载失败:', error)
      errorMessage.value = error instanceof Error ? error.message : 'PDF 加载失败'
    } finally {
      isLoading.value = false
      isPdfRendering.value = false
    }
  }

  // 渲染 PDF 页面
  const renderPdfPage = async (num: number) => {
    console.log('开始渲染 PDF 页面:', num)
    if (!pdfDoc.value) {
      console.error('pdfDoc 为空，无法渲染')
      return
    }

    try {
      isPdfRendering.value = true
      
      // 获取页面
      const page = await pdfDoc.value.getPage(num)
      console.log('获取页面成功:', num)

      const container = document.getElementById('pdf-canvas-container')
      const canvas = document.getElementById('pdf-canvas') as any
      if (!container || !canvas) {
        console.error('找不到 canvas 元素')
        return
      }

      const viewport = page.getViewport({ scale: pageScale.value })
      console.log('Viewport:', { width: viewport.width, height: viewport.height })

      canvas.height = viewport.height
      canvas.width = viewport.width

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        console.error('无法获取 canvas context')
        return
      }

      console.log('开始渲染 canvas...')
      const renderTask = page.render({
        canvasContext: ctx,
        viewport,
      })
      
      await renderTask.promise
      console.log('页面渲染完成!')
      
      // 不做预加载，避免与懒加载（Range 请求）冲突
    } catch (error) {
      console.error('页面渲染失败:', error)
    } finally {
      isPdfRendering.value = false
    }
  }

  // PDF 控制
  const pdfPrevPage = () => {
    if (currentPage.value > 1) {
      currentPage.value--
      renderPdfPage(currentPage.value)
    }
  }

  const pdfNextPage = () => {
    if (currentPage.value < totalPages.value) {
      currentPage.value++
      renderPdfPage(currentPage.value)
    }
  }

  const pdfZoomIn = () => {
    if (pageScale.value < 3) {
      pageScale.value += 0.25
      renderPdfPage(currentPage.value)
    }
  }

  const pdfZoomOut = () => {
    if (pageScale.value > 0.5) {
      pageScale.value -= 0.25
      renderPdfPage(currentPage.value)
    }
  }

  // ============================================
  // 文件加载函数
  // ============================================
  const streamLoadFileFromUrl = async (url: string, displayTitle?: string) => {
    console.log('开始加载文件, URL:', url, '标题:', displayTitle)
    isLoading.value = true
    loadProgress.value = 0
    errorMessage.value = ''
    fileContent.value = ''
    currentFile.value = null
    fileUrl.value = null

    // 重置状态
    pdfDoc.value = null
    currentPage.value = 1
    totalPages.value = 0

    try {
      // 优先从 URL 中提取真实文件名用于类型检测
      const realFileName = extractFileNameFromUrl(url)
      const displayName = displayTitle || realFileName
      fileName.value = displayName

      // 使用真实文件名（带后缀）来检测类型
      const fileTypeInfo = getFileType(realFileName)
      fileType.value = fileTypeInfo.name
      console.log('文件信息:', { displayName, realFileName, fileTypeInfo, url })

      // PDF 使用 CDN PDF.js 加载
      if (fileType.value === 'PDF') {
        console.log('检测到 PDF，使用 CDN PDF.js 加载')
        await loadPdfWithCdn(url)
        return
      }

      // 其他文件类型完整加载
      const response = await fetch(url)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const contentLength = response.headers.get('content-length')
      const totalSize = contentLength ? parseInt(contentLength, 10) : 0
      const reader = response.body?.getReader()
      if (!reader) throw new Error('无法读取文件流')

      const chunks: Uint8Array[] = []
      let receivedLength = 0

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        if (value) {
          chunks.push(value)
          receivedLength += value.length

          if (totalSize > 0) {
            loadProgress.value = Math.round((receivedLength / totalSize) * 100)
          } else {
            loadProgress.value = Math.min(95, receivedLength / 1024)
          }
        }

        await new Promise(resolve => setTimeout(resolve, 10))
      }

      const blob = new Blob(chunks)

      if (fileType.value === 'HTML') {
        fileUrl.value = URL.createObjectURL(blob)
      } else if (fileType.value === 'Text') {
        fileContent.value = await blob.text()
        currentFile.value = new File([blob], displayName, { type: 'text/plain' })
      } else {
        currentFile.value = new File([blob], displayName)
      }

      loadProgress.value = 100
    } catch (error) {
      console.error('加载文件失败:', error)
      errorMessage.value = error instanceof Error ? error.message : '加载文件时发生错误'
    } finally {
      isLoading.value = false
    }
  }

  const streamLoadFile = async (file: File) => {
    isLoading.value = true
    loadProgress.value = 0
    errorMessage.value = ''
    fileContent.value = ''
    fileUrl.value = null
    currentFile.value = file
    fileName.value = file.name
    fileType.value = getFileType(file.name).name

    // 重置状态
    pdfDoc.value = null
    currentPage.value = 1
    totalPages.value = 0

    try {
      // PDF 使用 CDN PDF.js 加载
      if (fileType.value === 'PDF') {
        console.log('检测到本地 PDF，使用 CDN PDF.js 加载')
        const arrayBuffer = await file.arrayBuffer()
        await loadPdfWithCdn(arrayBuffer)
        return
      }

      const reader = file.stream().getReader()
      const decoder = new TextDecoder('utf-8')
      const contentChunks: string[] = []
      let receivedLength = 0

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        receivedLength += value.length
        loadProgress.value = Math.round((receivedLength / file.size) * 100)
        contentChunks.push(decoder.decode(value, { stream: true }))

        await new Promise(resolve => setTimeout(resolve, 10))
      }

      if (fileType.value === 'HTML') {
        fileUrl.value = URL.createObjectURL(file)
      } else if (fileType.value === 'Text') {
        fileContent.value = contentChunks.join('')
      }
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : '加载文件时发生错误'
    } finally {
      isLoading.value = false
      loadProgress.value = 100
    }
  }

  const handleFileChange = async (event: Event) => {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]
    if (file) {
      await streamLoadFile(file)
    }
  }

  const handleDragOver = (event: any) => {
    event.preventDefault()
  }

  const handleDrop = async (event: any) => {
    event.preventDefault()
    const file = event.dataTransfer?.files[0]
    if (file) {
      await streamLoadFile(file)
    }
  }

  const downloadFile = () => {
    if (fileUrl.value) {
      const a = document.createElement('a')
      a.href = fileUrl.value
      a.download = fileName.value
      a.click()
    } else if (currentFile.value) {
      const url = URL.createObjectURL(currentFile.value)
      const a = document.createElement('a')
      a.href = url
      a.download = currentFile.value.name
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  // ============================================
  // 生命周期
  // ============================================
  onMounted(() => {
    const essayUrl = route.query.essayUrl as string
    const title = route.query.title as string
    if (essayUrl) {
      console.log('从路由加载文件:', essayUrl)
      streamLoadFileFromUrl(essayUrl, title)
    }
  })

  onBeforeUnmount(() => {
    // 清理 blob URL
    if (fileUrl.value) {
      try {
        URL.revokeObjectURL(fileUrl.value)
      } catch (error) {
        console.error('清理 blob URL 失败:', error)
      }
    }
  })
</script>

<template>
  <div class="file-viewer-container">
    <div class="header">
      <button class="back-button" @click="handleExit">
        <img :src="exitIconUrl" alt="返回" class="back-icon" />
        <span>返回</span>
      </button>
      <h1 class="title">文件查看器</h1>
      <div class="header-actions">
        <button
          v-if="currentFile || fileUrl || pdfDoc"
          class="action-button"
          @click="triggerFileUpload"
        >
          <img :src="uploadIconUrl" alt="上传" class="action-icon" />
          <span>上传新文件</span>
        </button>
        <button v-if="currentFile || fileUrl" class="action-button" @click="downloadFile">
          <img :src="downloadIconUrl" alt="下载" class="action-icon" />
          <span>下载</span>
        </button>
      </div>
    </div>

    <div class="content">
      <!-- CDN 加载提示 -->
      <div v-if="!fileType && !isLoading && !pdfDoc" class="cdn-loading-notice">
        <div class="spinner"></div>
        <p>正在加载 PDF.js 引擎...</p>
      </div>

      <!-- 上传区域 -->
      <div
        v-if="!currentFile && !fileUrl && !pdfDoc && !isLoading"
        class="upload-area"
        @dragover="handleDragOver"
        @drop="handleDrop"
      >
        <div class="upload-prompt">
          <div class="upload-icon">📁</div>
          <h2>拖拽文件到此处或点击上传</h2>
          <p>支持格式：Word、PPT、PDF、HTML、TXT</p>
          <input
            ref="fileInput"
            type="file"
            accept=".doc,.docx,.ppt,.pptx,.pdf,.html,.htm,.txt"
            class="file-input"
            @change="handleFileChange"
          />
          <button class="upload-button" @click="triggerFileUpload">选择文件</button>
        </div>
      </div>

      <!-- 加载中 -->
      <div v-if="isLoading" class="loading-container">
        <div class="loading-spinner"></div>
        <div class="loading-text">加载中... {{ loadProgress }}%</div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: loadProgress + '%' }"></div>
        </div>
      </div>

      <!-- 错误信息 -->
      <div v-else-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <!-- PDF 查看器 -->
      <div v-else-if="pdfDoc" class="pdf-viewer-container">
        <div class="file-info">
          <div class="file-name">{{ fileName }}</div>
          <div class="file-meta">
            <span>类型：{{ fileType }}</span>
            <span>页数：{{ currentPage }} / {{ totalPages }}</span>
          </div>
        </div>

        <!-- PDF 控制栏 -->
        <div class="pdf-controls">
          <button class="control-btn" :disabled="currentPage <= 1" @click="pdfPrevPage">
            ⬅ 上一页
          </button>
          <div class="page-indicator">{{ currentPage }} / {{ totalPages }}</div>
          <button class="control-btn" :disabled="currentPage >= totalPages" @click="pdfNextPage">
            下一页 ➡
          </button>
          <div class="zoom-controls">
            <button class="control-btn" :disabled="pageScale <= 0.5" @click="pdfZoomOut">➖</button>
            <span class="zoom-level">{{ Math.round(pageScale * 100) }}%</span>
            <button class="control-btn" :disabled="pageScale >= 3" @click="pdfZoomIn">➕</button>
          </div>
        </div>

        <!-- PDF 渲染容器 -->
        <div id="pdf-canvas-container" class="pdf-canvas-container">
          <canvas id="pdf-canvas"></canvas>
        </div>
      </div>



      <!-- 其他文件类型 -->
      <div v-else-if="currentFile || fileUrl" class="file-content">
        <div class="file-info">
          <div class="file-name">{{ fileName }}</div>
          <div class="file-meta">
            <span>类型：{{ fileType }}</span>
            <span v-if="currentFile">大小：{{ (currentFile.size / 1024).toFixed(2) }} KB</span>
          </div>
        </div>

        <div class="content-display">
          <div v-if="fileType === 'PDF' && fileUrl" class="pdf-viewer">
            <iframe :src="fileUrl" class="pdf-iframe"></iframe>
          </div>

          <div v-else-if="fileType === 'HTML'" class="html-viewer">
            <iframe
              v-if="fileUrl"
              :src="fileUrl"
              class="html-iframe"
              sandbox="allow-scripts allow-same-origin"
            ></iframe>
            <iframe
              v-else
              :srcdoc="fileContent"
              class="html-iframe"
              sandbox="allow-scripts allow-same-origin"
            ></iframe>
          </div>

          <div v-else-if="fileType === 'Text'" class="text-viewer">
            <pre>{{ fileContent }}</pre>
          </div>

          <div v-else class="unsupported-viewer">
            <div class="unsupported-message">
              <div class="file-type-icon">
                {{ fileType === 'Word' ? '📝' : fileType === 'PowerPoint' ? '📊' : '📄' }}
              </div>
              <p class="file-title">{{ fileName }}</p>
              <p class="unsupported-text">该文件类型暂不支持直接预览</p>
              <p class="unsupported-hint">你可以点击右上角按钮下载后查看</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .file-viewer-container {
    width: 100%;
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    overflow: hidden;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 30px;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  }

  .back-button,
  .action-button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 10px;
    color: white;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .back-button:hover,
  .action-button:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
  }

  .back-icon,
  .action-icon {
    width: 20px;
    height: 20px;
  }

  .title {
    color: white;
    font-size: 24px;
    font-weight: 600;
    margin: 0;
  }

  .header-actions {
    display: flex;
    gap: 15px;
  }

  .content {
    flex: 1;
    padding: 30px;
    overflow-y: auto;
  }

  .cdn-loading-notice {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 300px;
    color: white;
    gap: 20px;
  }

  .cdn-loading-notice .spinner {
    width: 50px;
    height: 50px;
    border: 4px solid rgba(255, 255, 255, 0.3);
    border-top: 4px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .upload-area {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 20px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    padding: 60px 40px;
    text-align: center;
  }

  .upload-prompt {
    max-width: 600px;
    margin: 0 auto;
  }

  .upload-icon {
    font-size: 80px;
    margin-bottom: 20px;
  }

  .upload-prompt h2 {
    font-size: 28px;
    color: #333;
    margin-bottom: 15px;
  }

  .upload-prompt p {
    font-size: 18px;
    color: #666;
    margin-bottom: 30px;
  }

  .file-input {
    display: none;
  }

  .upload-button {
    padding: 15px 40px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    border-radius: 10px;
    color: white;
    font-size: 18px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .upload-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
  }

  .loading-container {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 20px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    padding: 60px 40px;
    text-align: center;
  }

  .loading-spinner {
    width: 60px;
    height: 60px;
    border: 5px solid #f0f0f0;
    border-top: 5px solid #667eea;
    border-radius: 50%;
    margin: 0 auto 20px;
    animation: spin 1s linear infinite;
  }

  .loading-text {
    font-size: 20px;
    color: #333;
    margin-bottom: 20px;
  }

  .progress-bar {
    width: 100%;
    max-width: 400px;
    height: 8px;
    background: #f0f0f0;
    border-radius: 10px;
    margin: 0 auto;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    transition: width 0.3s ease;
  }

  .error-message {
    background: rgba(255, 87, 87, 0.1);
    border: 2px solid #ff5757;
    border-radius: 15px;
    padding: 30px;
    color: #ff5757;
    font-size: 18px;
    text-align: center;
  }

  .pdf-viewer-container,
  .pptx-viewer-container {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 20px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    overflow: hidden;
    height: calc(100vh - 120px);
    display: flex;
    flex-direction: column;
  }

  .file-info {
    padding: 20px 30px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  }

  .file-name {
    color: white;
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 8px;
  }

  .file-meta {
    display: flex;
    gap: 30px;
    color: rgba(255, 255, 255, 0.9);
    font-size: 14px;
  }

  .pdf-controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
    padding: 15px 20px;
    background: #f5f5f5;
    border-bottom: 1px solid #e0e0e0;
    flex-wrap: wrap;
  }

  .control-btn {
    padding: 10px 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    border-radius: 8px;
    color: white;
    font-size: 15px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .control-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
  }

  .control-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .page-indicator {
    color: #333;
    font-size: 16px;
    font-weight: 600;
    min-width: 100px;
    text-align: center;
  }

  .zoom-controls {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-left: 30px;
  }

  .zoom-level {
    color: #333;
    font-size: 14px;
    min-width: 50px;
    text-align: center;
  }

  .pdf-canvas-container,
  .pptx-canvas-container {
    flex: 1;
    overflow: auto;
    padding: 30px;
    display: flex;
    justify-content: center;
    background: #e5e5e5;
  }

  .pdf-canvas-container canvas {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    border-radius: 4px;
    max-width: 100%;
  }

  .file-content {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 20px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    overflow: hidden;
    height: calc(100vh - 120px);
    display: flex;
    flex-direction: column;
  }

  .content-display {
    flex: 1;
    overflow: auto;
  }

  .pdf-viewer,
  .html-viewer,
  .text-viewer {
    width: 100%;
    height: 100%;
  }

  .pdf-iframe,
  .html-iframe {
    width: 100%;
    height: 100%;
    border: none;
  }

  .text-viewer pre {
    padding: 30px;
    margin: 0;
    font-family: 'Consolas', 'Monaco', monospace;
    font-size: 14px;
    line-height: 1.8;
    color: #333;
    white-space: pre-wrap;
  }

  .unsupported-viewer {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 30px;
  }

  .unsupported-message {
    text-align: center;
  }

  .file-type-icon {
    font-size: 80px;
    margin-bottom: 20px;
  }

  .file-title {
    font-size: 22px;
    color: #333;
    margin-bottom: 15px;
  }

  .unsupported-text {
    font-size: 18px;
    color: #666;
    margin-bottom: 10px;
  }

  .unsupported-hint {
    font-size: 16px;
    color: #999;
  }
</style>
