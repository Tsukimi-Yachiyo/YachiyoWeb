<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { processImageData } from '../composables/useImageData'
  import defaultAvatar from '../assets/images/default_icon.gif'

  const props = withDefaults(
    defineProps<{
      userId: string | number
      avatarUrl?: string | Array<any> | null
      username?: string
      size?: number
      clickable?: boolean
    }>(),
    {
      avatarUrl: null,
      username: '',
      size: 48,
      clickable: true,
    }
  )

  const emit = defineEmits<{
    click: [event: MouseEvent]
  }>()

  const router = useRouter()
  const avatarError = ref(false)

  const processedAvatarUrl = computed(() => {
    if (avatarError.value || !props.avatarUrl) {
      return null
    }
    return processImageData(props.avatarUrl)
  })

  const avatarStyle = computed(() => ({
    width: `${props.size}px`,
    height: `${props.size}px`,
  }))

  const placeholderText = computed(() => {
    if (props.username && props.username.length > 0) {
      return props.username.charAt(0).toUpperCase()
    }
    return 'U'
  })

  const handleClick = (event: MouseEvent) => {
    emit('click', event)
    if (props.clickable && props.userId) {
      router.push(`/user-profile/${props.userId}`)
    }
  }

  const handleAvatarError = () => {
    avatarError.value = true
  }
</script>

<template>
  <div
    class="user-avatar"
    :style="avatarStyle"
    :class="{ clickable: clickable && userId }"
    @click="handleClick"
  >
    <img
      v-if="processedAvatarUrl"
      :src="processedAvatarUrl"
      :alt="username || '用户头像'"
      class="avatar-image"
      loading="lazy"
      @error="handleAvatarError"
    />
    <img
      v-else-if="avatarError || !avatarUrl"
      :src="defaultAvatar"
      :alt="username || '用户头像'"
      class="avatar-image default-avatar"
    />
    <span v-else class="avatar-placeholder">{{ placeholderText }}</span>
  </div>
</template>

<style scoped>
  .user-avatar {
    border-radius: 50%;
    background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }

  .user-avatar.clickable {
    cursor: pointer;
  }

  .user-avatar.clickable:hover {
    transform: scale(1.05);
    box-shadow: 0 0 12px rgba(33, 150, 243, 0.4);
  }

  .avatar-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .avatar-placeholder {
    color: white;
    font-weight: 600;
    font-size: 18px;
  }

  .default-avatar {
    object-fit: cover;
  }
</style>
