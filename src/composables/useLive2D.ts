import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { CubismFramework, Option, LogLevel } from '@framework/live2dcubismframework'
import { LAppSubdelegate } from '@demo/lappsubdelegate'
import { LAppPal } from '@demo/lapppal'

export function useLive2D() {
  const wrapperRef = ref(null)
  const canvasRef = ref(null)
  let animationId = null
  let subdelegate = null
  let isInitialized = false

  const printLog = message => {
    console.log('[Live2D]', message)
  }

  const initCubismFramework = () => {
    const option = new Option()
    option.logFunction = printLog
    option.loggingLevel = LogLevel.LogLevel_Verbose

    CubismFramework.startUp(option)
    CubismFramework.initialize()

    printLog('Cubism Framework initialized')
  }

  const getCanvasPosition = e => {
    const canvas = canvasRef.value
    if (!canvas) {
      return { x: 0, y: 0 }
    }
    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  const onDocumentPointerMove = e => {
    if (!isInitialized || !subdelegate || !canvasRef.value) return
    const pos = getCanvasPosition(e)
    subdelegate.onPointBegan(pos.x, pos.y)
    subdelegate.onPointMoved(pos.x, pos.y)
  }

  const onPointerBegan = e => {
    if (!isInitialized || !subdelegate) return
    const pos = getCanvasPosition(e)
    subdelegate.onPointBegan(pos.x, pos.y)
  }

  const onPointerMoved = e => {}

  const onPointerEnded = e => {
    if (!isInitialized || !subdelegate) return
    const pos = getCanvasPosition(e)
    subdelegate.onPointEnded(pos.x, pos.y)
  }

  const onPointerCancel = e => {
    if (!isInitialized || !subdelegate) return
    const pos = getCanvasPosition(e)
    subdelegate.onTouchCancel(pos.x, pos.y)
  }

  const startRenderLoop = () => {
    const render = () => {
      if (!isInitialized || !subdelegate) {
        return
      }

      LAppPal.updateTime()
      subdelegate.update()

      animationId = requestAnimationFrame(render)
    }
    render()
  }

  onMounted(async () => {
    await nextTick()

    if (!canvasRef.value || !wrapperRef.value) {
      console.error('Canvas or wrapper not found')
      return
    }

    try {
      const canvas = canvasRef.value
      const wrapper = wrapperRef.value

      canvas.width = wrapper.clientWidth
      canvas.height = wrapper.clientHeight

      // 初始化 Live2D
      initCubismFramework()
      LAppPal.updateTime()

      subdelegate = new LAppSubdelegate()
      if (subdelegate.initialize(canvas)) {
        isInitialized = true
        printLog('Live2D initialized successfully')
        document.addEventListener('mousemove', onDocumentPointerMove)
        startRenderLoop()
      }
    } catch (error) {
      console.error('Failed to initialize Live2D:', error)
    }
  })

  onUnmounted(() => {
    document.removeEventListener('mousemove', onDocumentPointerMove)
    if (animationId) {
      cancelAnimationFrame(animationId)
      animationId = null
    }
    isInitialized = false
    if (subdelegate) {
      subdelegate.release()
      subdelegate = null
    }
    if (CubismFramework) {
      CubismFramework.dispose()
    }
  })

  return {
    wrapperRef,
    canvasRef,
    onPointerBegan,
    onPointerMoved,
    onPointerEnded,
    onPointerCancel,
  }
}
