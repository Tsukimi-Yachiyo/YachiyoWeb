<script setup>
  import { ref } from 'vue'
  import { adminAPI } from '../../services/api'

  const files = ref([])
  const isLoading = ref(false)
  const successMessage = ref('')
  const errorMessage = ref('')

  const handleFileChange = event => {
    files.value = Array.from(event.target.files)
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
        document.getElementById('fileInput').value = ''
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
