<script setup lang="ts">
  import { useLive2D } from '../../composables/useLive2D'

  const { wrapperRef, canvasRef, onPointerBegan, onPointerMoved, onPointerEnded, onPointerCancel } =
    useLive2D()
</script>

<template>
  <div ref="wrapperRef" class="live2d-wrapper">
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
