<script setup>
import { ref, computed, watch, onMounted } from 'vue';

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
  },
  user_avatar: {
    type: [String, Array],
    default: null
  },
  cover_image: {
    type: [String, Array],
    default: null
  }
});

// 从缓存中获取头像
const userAvatar = ref(null);
// 从缓存中获取封面
const coverImage = ref(null);

// 处理图片数据，转换为 Base64 URL
const processImageData = (imageData) => {
  if (!imageData) {
    return null;
  }
  
  try {
    let base64String = '';
    
    if (typeof imageData === 'string') {
      // 如果已经是Base64字符串
      base64String = imageData;
    } else if (Array.isArray(imageData)) {
      // 如果是数字数组
      const uint8Array = new Uint8Array(imageData);
      base64String = btoa(String.fromCharCode(...uint8Array));
    }
    return `http://47.98.229.211:8080/file/generate${base64String}`;
  } catch (error) {
    console.error('处理图片数据失败:', error);
    return null;
  }
};

// 从缓存获取数据或使用传递的数据
const fetchUserAvatar = () => {
  if (props.user_avatar) {
    // 使用从父组件传递的头像数据
    userAvatar.value = processImageData(props.user_avatar);
  } else {
    // 实际项目中，这里应该从缓存或本地存储中获取头像
    // 这里使用模拟数据
    userAvatar.value = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=user%20avatar%20portrait&image_size=square`;
  }
};

const fetchCoverImage = () => {
  if (props.cover_image) {
    // 使用从父组件传递的封面数据
    coverImage.value = processImageData(props.cover_image);
  } else {
    // 实际项目中，这里应该从缓存或本地存储中获取封面
    // 这里使用模拟数据
    coverImage.value = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=post%20cover%20image&image_size=landscape_16_9`;
  }
};

// 监听属性变化
watch(() => props.user_avatar, () => {
  fetchUserAvatar();
});

watch(() => props.cover_image, () => {
  fetchCoverImage();
});

// 组件挂载时获取数据
onMounted(() => {
  fetchUserAvatar();
  fetchCoverImage();
});
</script>

<template src="./templates/Post.html"></template>

<style scoped src="./styles/Post.css"></style>