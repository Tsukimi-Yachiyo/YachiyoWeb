<script setup>
import { watch } from 'vue';
import { useUserProfilePopover } from '../../composables/useUserProfilePopover.js';

const props = defineProps({
  username: {
    type: String,
    default: '用户'
  },
  userAvatar: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['go-settings', 'logout', 'update:isVisible']);

const {
  isVisible,
  popoverRef,
  showPopover,
  hidePopover,
  keepVisible,
  goToSettings,
  goToManager
} = useUserProfilePopover(props, emit);

// 监听isVisible变化并通知父组件
watch(isVisible, (newValue) => {
  emit('update:isVisible', newValue);
});
</script>

<template src="./templates/UserProfilePopover.html"></template>

<style scoped src="./styles/UserProfilePopover.css"></style>
