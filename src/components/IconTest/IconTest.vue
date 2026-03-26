<script setup>
  import { useIconManager } from '../../composables/useIconManager'
  import { ref, computed } from 'vue'

  const { isLoading, isLoaded, replaceEmojis } = useIconManager()
  const testText = ref(':smile: Hello world! :heart: How are you? :thumbsup:')
  const processedText = computed(() => replaceEmojis(testText.value))
</script>

<template>
  <div class="icon-test">
    <h2>图标预加载测试</h2>
    <div class="loading-status">
      <p v-if="isLoading">正在预加载图标...</p>
      <p v-else-if="isLoaded">图标预加载完成！</p>
      <p v-else>图标预加载未开始</p>
    </div>

    <h3>表情替换测试</h3>
    <div class="test-input">
      <label for="test-text">输入测试文本：</label>
      <input
        id="test-text"
        v-model="testText"
        type="text"
        style="width: 100%; padding: 8px; margin: 10px 0"
      />
    </div>

    <div class="test-result">
      <h4>处理结果：</h4>
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div v-html="processedText"></div>
    </div>

    <div class="test-emojis">
      <h4>可用表情：</h4>
      <div class="emoji-list">
        <span
          v-for="(icon, emoji) in {
            ':smile:': 'heart.svg',
            ':heart:': 'heart.svg',
            ':thumbsup:': 'check-circle.svg',
            ':thumbsdown:': 'close-circle.svg',
            ':ok:': 'check.svg',
            ':no:': 'close.svg',
            ':info:': 'info.svg',
            ':warning:': 'alert-triangle.svg',
            ':error:': 'alert-circle.svg',
            ':success:': 'check-circle.svg',
          }"
          :key="emoji"
          class="emoji-item"
        >
          {{ emoji }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .icon-test {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    font-family: Arial, sans-serif;
  }

  .loading-status {
    padding: 10px;
    margin: 10px 0;
    border-radius: 4px;
  }

  .loading-status p {
    margin: 0;
  }

  .test-result {
    margin: 20px 0;
    padding: 15px;
    border: 1px solid #ddd;
    border-radius: 4px;
  }

  .emoji-list {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin: 10px 0;
  }

  .emoji-item {
    padding: 5px 10px;
    background: #f0f0f0;
    border-radius: 4px;
    cursor: pointer;
  }

  .emoji-item:hover {
    background: #e0e0e0;
  }

  .emoji-icon {
    margin: 0 2px;
  }
</style>
