<script setup lang="ts">
  import { ref, watch, onMounted } from 'vue'
  import UserAvatar from '../UserAvatar.vue'
  import { processImageData } from '@/composables/useImageData'
  import defaultCover from '@/assets/images/default_cover.gif'

  const props = defineProps({
    userName: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    postId: {
      type: String,
      required: true,
    },
    userAvatar: {
      type: [String, Array],
      default: null,
    },
    coverImage: {
      type: [String, Array],
      default: null,
    },
  })

  // 从缓存中获取封面
  const coverImageSrc = ref(null)

  const handleCoverError = () => {
    coverImageSrc.value = null
  }

  const fetchCoverImage = () => {
    if (props.coverImage) {
      // 使用从父组件传递的封面数据
      coverImageSrc.value = processImageData(props.coverImage)
    } else {
      // 实际项目中，这里应该从缓存或本地存储中获取封面
      // 这里使用模拟数据
      coverImageSrc.value = defaultCover
    }
  }

  watch(
    () => props.coverImage,
    () => {
      fetchCoverImage()
    }
  )

  onMounted(() => {
    fetchCoverImage()
  })
</script>

<template src="./templates/Post.html"></template>

<style scoped src="./styles/Post.css"></style>
