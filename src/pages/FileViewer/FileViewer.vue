<script setup lang="ts">
  import { ref, onMounted, computed } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { useIconManager } from '../../composables/useIconManager'
  import { marked } from 'marked'

  const { checkIconCache } = useIconManager()

  const exitIconUrl = computed(() => {
    const iconData = checkIconCache('arrow-left.svg')
    return iconData ? `data:image/svg+xml;utf8,${encodeURIComponent(iconData)}` : ''
  })

  const router = useRouter()
  const route = useRoute()

  const title = ref('文件查看器')
  const content = ref('')
  const loading = ref(true)
  const error = ref('')
  const isHtmlFile = ref(false)
  const essayUrlRef = ref('')

  const handleExit = () => {
    router.back()
  }

  // 判断是否是 HTML 文件
  const checkIsHtmlFile = (url: string, text?: string): boolean => {
    // 检查 URL 扩展名
    if (url.toLowerCase().endsWith('.html') || url.toLowerCase().endsWith('.htm')) {
      return true
    }
    // 检查内容是否以 HTML 标签开头
    if (text) {
      const trimmedText = text.trim().toLowerCase()
      if (trimmedText.startsWith('<!doctype html') || trimmedText.startsWith('<html')) {
        return true
      }
    }
    return false
  }

  const fetchEssayContent = async (url: string) => {
    try {
      essayUrlRef.value = url

      // 先检查 URL 是否是 HTML 文件
      if (checkIsHtmlFile(url)) {
        isHtmlFile.value = true
        loading.value = false
        return
      }

      // 获取内容后再检查
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const text = await response.text()

      // 检查内容是否是 HTML
      if (checkIsHtmlFile(url, text)) {
        isHtmlFile.value = true
        loading.value = false
        return
      }

      content.value = text
    } catch (err: unknown) {
      console.error('获取文件内容失败:', err)
      error.value = err instanceof Error ? err.message : '获取文件内容失败'
      content.value = '# 文件加载失败\n\n抱歉，无法加载指定的文件内容。'
    } finally {
      loading.value = false
    }
  }

  const renderedContent = computed(() => {
    if (!content.value) return ''
    return marked(content.value)
  })

  onMounted(() => {
    const essayUrl = route.query.essayUrl as string
    const pageTitle = route.query.title as string

    if (pageTitle) {
      title.value = pageTitle
    }

    if (essayUrl) {
      fetchEssayContent(essayUrl)
    } else {
      loading.value = false
      error.value = '未指定文件URL'
      content.value = '# 错误\n\n未提供文件URL参数。'
    }
  })
</script>

<template>
  <!-- HTML 文件直接全屏展示，不使用容器 -->
  <div v-if="isHtmlFile" class="html-viewer">
    <div class="html-header">
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
    </div>
    <iframe :src="essayUrlRef" class="html-iframe" frameborder="0"></iframe>
  </div>

  <!-- 非 HTML 文件使用原来的展示方式 -->
  <div v-else class="file-viewer-container">
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
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>加载文件中...</p>
    </div>

    <div v-else class="content-wrapper">
      <div v-if="error" class="error-banner">
        <p>{{ error }}</p>
      </div>
      <div class="markdown-content" v-html="renderedContent"></div>
    </div>
  </div>
</template>

<style scoped>
  @reference "tailwindcss";

  /* HTML 查看器样式 - 全屏展示 */
  .html-viewer {
    @apply w-full h-full flex flex-col;
    background: #000;
  }

  .html-header {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 15px 30px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(15, 23, 42, 0.98);
    z-index: 10;
  }

  .html-iframe {
    flex: 1;
    width: 100%;
    border: none;
  }

  .file-viewer-container {
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

  .content-wrapper {
    flex: 1;
    overflow-y: auto;
    padding: 40px;
  }

  .error-banner {
    background: rgba(255, 87, 34, 0.15);
    border: 1px solid rgba(255, 87, 34, 0.35);
    border-radius: 12px;
    padding: 16px 24px;
    margin-bottom: 24px;
    color: rgba(255, 255, 255, 0.85);
  }

  .markdown-content {
    max-width: 900px;
    margin: 0 auto;
    color: white;
    line-height: 1.8;
  }

  .markdown-content :deep(h1) {
    font-size: 2.5rem;
    font-weight: 800;
    margin-bottom: 1.5rem;
    margin-top: 2rem;
    color: #ffffff;
  }

  .markdown-content :deep(h2) {
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 1.25rem;
    margin-top: 1.75rem;
    color: #e2e8f0;
  }

  .markdown-content :deep(h3) {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 1rem;
    margin-top: 1.5rem;
    color: #cbd5e1;
  }

  .markdown-content :deep(p) {
    margin-bottom: 1.25rem;
    font-size: 1.1rem;
    color: rgba(255, 255, 255, 0.85);
  }

  .markdown-content :deep(a) {
    color: #818cf8;
    text-decoration: underline;
  }

  .markdown-content :deep(a:hover) {
    color: #a5b4fc;
  }

  .markdown-content :deep(ul),
  .markdown-content :deep(ol) {
    margin-bottom: 1.25rem;
    padding-left: 1.5rem;
  }

  .markdown-content :deep(li) {
    margin-bottom: 0.5rem;
    font-size: 1.1rem;
    color: rgba(255, 255, 255, 0.85);
  }

  .markdown-content :deep(code) {
    background: rgba(102, 126, 234, 0.2);
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
    font-family: 'Fira Code', monospace;
    font-size: 0.95rem;
    color: #e2e8f0;
  }

  .markdown-content :deep(pre) {
    background: rgba(15, 23, 42, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    overflow-x: auto;
  }

  .markdown-content :deep(pre code) {
    background: transparent;
    padding: 0;
    font-size: 1rem;
  }

  .markdown-content :deep(blockquote) {
    border-left: 4px solid #667eea;
    padding-left: 1.5rem;
    margin: 1.5rem 0;
    color: rgba(255, 255, 255, 0.7);
    font-style: italic;
  }

  .markdown-content :deep(img) {
    max-width: 100%;
    height: auto;
    border-radius: 12px;
    margin: 1.5rem 0;
  }

  .markdown-content :deep(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 1.5rem 0;
  }

  .markdown-content :deep(th),
  .markdown-content :deep(td) {
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 0.75rem 1rem;
    text-align: left;
  }

  .markdown-content :deep(th) {
    background: rgba(102, 126, 234, 0.2);
    font-weight: 600;
  }
</style>
