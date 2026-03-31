<script setup lang="ts">
  import { ref, watch, onMounted } from 'vue'
  import { processImageData } from '@/composables/useImageData'
  import defaultIcon from '@/assets/images/default_icon.gif'
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

  // 从缓存中获取头像
  const userAvatarSrc = ref(null)
  // 从缓存中获取封面
  const coverImageSrc = ref(null)

  // 从缓存获取数据或使用传递的数据
  const fetchUserAvatar = () => {
    if (props.userAvatar) {
      // 使用从父组件传递的头像数据
      userAvatarSrc.value = processImageData(props.userAvatar)
    } else {
      // 实际项目中，这里应该从缓存或本地存储中获取头像
      // 这里使用模拟数据
      userAvatarSrc.value = defaultIcon
    }
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

  // 监听属性变化
  watch(
    () => props.userAvatar,
    () => {
      fetchUserAvatar()
    }
  )

  watch(
    () => props.coverImage,
    () => {
      fetchCoverImage()
    }
  )

  // 组件挂载时获取数据
  onMounted(() => {
    fetchUserAvatar()
    fetchCoverImage()
  })
</script>

<template src="./templates/Post.html"></template>

<style scoped src="./styles/Post.css"></style>
