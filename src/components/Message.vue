<script setup lang="ts">
  import { ref, watch } from 'vue'

  const props = defineProps<{
    type: 'success' | 'error'
    message: string
    autoClose?: number // 自动关闭时间（毫秒），0 表示不自动关闭
  }>()

  const emit = defineEmits(['close'])

  const isVisible = ref(true)

  // 自动关闭
  watch(
    () => props.message,
    () => {
      isVisible.value = true
      if (props.autoClose && props.autoClose > 0) {
        setTimeout(() => {
          isVisible.value = false
          emit('close')
        }, props.autoClose)
      }
    },
    { immediate: true }
  )
</script>

<template>
  <transition name="message-fade">
    <div
      v-if="isVisible"
      class="message-container"
      :class="type === 'success' ? 'success-message' : 'error-message'"
    >
      <div class="message-content">
        <span class="message-text">{{ message }}</span>
      </div>
    </div>
  </transition>
</template>

<style scoped>
  .message-container {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 9999;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 14px;
    text-align: center;
    animation: fadeIn 0.3s ease;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    backdrop-filter: blur(10px);
  }

  .message-content {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .message-text {
    text-align: center;
  }

  .success-message {
    background: rgba(76, 175, 80, 0.95);
    color: #fff;
    border: 1px solid rgba(76, 175, 80, 0.3);
  }

  .error-message {
    background: rgba(244, 67, 54, 0.95);
    color: #fff;
    border: 1px solid rgba(244, 67, 54, 0.3);
  }

  .message-fade-enter-active,
  .message-fade-leave-active {
    transition:
      opacity 0.3s ease,
      transform 0.3s ease;
  }

  .message-fade-enter-from,
  .message-fade-leave-to {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px);
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }

  @media (max-width: 768px) {
    .message-container {
      min-width: 280px;
      max-width: 90%;
      padding: 10px 14px;
      font-size: 13px;
    }
  }
</style>
