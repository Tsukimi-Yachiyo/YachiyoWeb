<script setup lang="ts">
  import { ref } from 'vue'
  import { adminAPI } from '../../services/api'

  const files = ref<File[]>([])
  const isLoading = ref(false)
  const successMessage = ref('')
  const errorMessage = ref('')

  const handleFileChange = (event: Event) => {
    const input = event.target as HTMLInputElement | null
    files.value = input?.files ? Array.from(input.files) : []
  }

  const handleUpload = async () => {
    if (files.value.length === 0) {
      errorMessage.value = '请选择文件'
      return
    }

    isLoading.value = true
    successMessage.value = ''
    errorMessage.value = ''

    try {
      const response = await adminAPI.uploadFiles(files.value)
      if (response.success) {
        successMessage.value = '文件上传成功'
        files.value = []
        // 清空文件输入
        const fileInput = document.getElementById('fileInput') as HTMLInputElement | null
        if (fileInput) {
          fileInput.value = ''
        }
      } else {
        errorMessage.value = response.message || '上传失败'
      }
    } catch (error) {
      errorMessage.value = error.message || '网络错误'
    } finally {
      isLoading.value = false
    }
  }
</script>

<template src="./templates/Admin.html"></template>

<style scoped src="./styles/Admin.css"></style>
