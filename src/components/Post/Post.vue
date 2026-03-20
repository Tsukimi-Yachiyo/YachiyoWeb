<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  user_name: {
    type: String,
    required: true
  },
  user_id: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  post_id: {
    type: String,
    required: true
  }
});

// 从缓存中获取头像
const userAvatar = ref(null);
// 从缓存中获取封面
const coverImage = ref(null);

// 模拟从缓存获取数据
const fetchUserAvatar = () => {
  // 实际项目中，这里应该从缓存或本地存储中获取头像
  // 这里使用模拟数据
  userAvatar.value = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=user%20avatar%20portrait&image_size=square`;
};

const fetchCoverImage = () => {
  // 实际项目中，这里应该从缓存或本地存储中获取封面
  // 这里使用模拟数据
  coverImage.value = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=post%20cover%20image&image_size=landscape_16_9`;
};

// 组件挂载时获取数据
fetchUserAvatar();
fetchCoverImage();
</script>

<template src="./templates/Post.html"></template>

<style scoped src="./styles/Post.css"></style>