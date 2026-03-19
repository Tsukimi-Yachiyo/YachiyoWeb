<template>
  <div class="live2d-wrapper" ref="wrapperRef">
    <canvas 
      ref="canvasRef" 
      class="live2d-canvas"
      @pointerdown="onPointerBegan"
      @pointermove="onPointerMoved"
      @pointerup="onPointerEnded"
      @pointercancel="onPointerCancel"
    ></canvas>
  </div>
</template>

<script setup>
import { useLive2D } from '../../composables/useLive2D.js'

const {
  wrapperRef,
  canvasRef,
  onPointerBegan,
  onPointerMoved,
  onPointerEnded,
  onPointerCancel
} = useLive2D()
</script>

<style scoped>
.live2d-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}

.live2d-canvas {
  width: 100%;
  height: 100%;
  display: block;
  background: transparent;
  touch-action: none;
}
</style>
