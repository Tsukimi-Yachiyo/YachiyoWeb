<script setup lang="ts">
  import { useBackgroundMusic } from '../composables/useBackgroundMusic'

  const props = withDefaults(
    defineProps<{
      buttonClass?: string
      iconClass?: string
      iconSize?: string
      title?: string
    }>(),
    {
      buttonClass: 'music-toggle',
      iconClass: 'music-icon',
      iconSize: '18px',
      title: 'Music toggle',
    }
  )

  const { isPlaying, toggle, start } = useBackgroundMusic()

  const startMusic = () => {
    start()
  }

  defineExpose({
    startMusic,
  })
</script>

<template>
  <button
    type="button"
    :class="[props.buttonClass, { playing: isPlaying }]"
    :title="props.title"
    @click="toggle"
  >
    <span v-if="isPlaying" :class="props.iconClass" :style="{ fontSize: props.iconSize }"
      >&#128266;</span
    >
    <span v-else :class="props.iconClass" :style="{ fontSize: props.iconSize }">&#128263;</span>
  </button>
</template>
