<script setup>
import { ref } from 'vue';
import AppHeader from '../../components/AppHeader/AppHeader.vue';
import { useUserProfile } from '../../composables/useUserProfile.js';

const userProfileIsVisible = ref(false);

// 导航项
const navItems = [
  { id: 'home', label: '主页', icon: '🏠' },
  { id: 'hot', label: '热门', icon: '🔥' },
  { id: 'follow', label: '关注', icon: '👥' },
  { id: 'message', label: '消息', icon: '💬' },
  { id: 'me', label: '我', icon: '👤' }
];

// 当前选中的导航项
const currentNavItem = ref('home');

// 切换导航项
const selectNavItem = (itemId) => {
  currentNavItem.value = itemId;
};

// 获取用户信息
const { username, userAvatar, loadUserDetail } = useUserProfile();

// 加载用户详情
loadUserDetail();
</script>

<template src="./templates/Tsukuyomi.html"></template>

<style scoped src="./styles/Tsukuyomi.css"></style>