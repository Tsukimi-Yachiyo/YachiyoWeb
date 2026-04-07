import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

export function useUserProfilePopover(props, emit) {
  const router = useRouter()
  const isVisible = ref(false)
  const popoverRef = ref(null)
  let hideTimeout = null

  const showPopover = () => {
    if (hideTimeout) {
      clearTimeout(hideTimeout)
      hideTimeout = null
    }
    isVisible.value = true
  }

  const hidePopover = () => {
    hideTimeout = setTimeout(() => {
      isVisible.value = false
    }, 200)
  }

  const keepVisible = () => {
    if (hideTimeout) {
      clearTimeout(hideTimeout)
      hideTimeout = null
    }
  }

  const goToSettings = () => {
    isVisible.value = false
    router.push('/settings/profile')
  }

  const goToManager = () => {
    isVisible.value = false
    router.push('/manager')
  }

  const handleClickOutside = event => {
    if (popoverRef.value && !popoverRef.value.contains(event.target)) {
      isVisible.value = false
    }
  }

  onMounted(() => {
    document.addEventListener('click', handleClickOutside)
  })

  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
    if (hideTimeout) {
      clearTimeout(hideTimeout)
    }
  })

  return {
    isVisible,
    popoverRef,
    showPopover,
    hidePopover,
    keepVisible,
    goToSettings,
    goToManager,
  }
}
