import { ref } from 'vue'

export function useSidebar() {
  const isSidebarOpen = ref(false)
  const sidebarRef = ref(null)
  const touchStartX = ref(0)
  const touchEndX = ref(0)

  const toggleSidebar = () => {
    isSidebarOpen.value = !isSidebarOpen.value
  }

  const closeSidebar = () => {
    isSidebarOpen.value = false
  }

  const onTouchStart = (e: TouchEvent) => {
    touchStartX.value = e.touches[0].clientX
  }

  const onTouchEnd = (e: TouchEvent) => {
    touchEndX.value = e.changedTouches[0].clientX
    const diff = touchEndX.value - touchStartX.value

    if (touchStartX.value < 50 && diff > 50) {
      isSidebarOpen.value = true
    } else if (diff < -50 && isSidebarOpen.value) {
      isSidebarOpen.value = false
    }
  }

  return {
    isSidebarOpen,
    sidebarRef,
    toggleSidebar,
    closeSidebar,
    onTouchStart,
    onTouchEnd,
  }
}
