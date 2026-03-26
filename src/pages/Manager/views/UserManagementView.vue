<script setup>
  // User management feature will be implemented here
</script>

<template>
  <div class="user-management-container">
    <div class="page-header">
      <h1>神明（用户管理）</h1>
      <p>用户管理功能即将上线</p>
    </div>

    <div class="placeholder-container">
      <div class="placeholder-icon">👥</div>
      <h3>功能开发中</h3>
      <p>用户管理功能正在开发中，敬请期待</p>
    </div>
  </div>
</template>

<style scoped>
  .user-management-container {
    width: 100%;
    max-width: 1000px;
    margin: 0 auto;
  }

  .page-header {
    margin-bottom: 30px;
    text-align: left;
  }

  .page-header h1 {
    color: #fff;
    font-size: 24px;
    font-weight: bold;
    margin: 0 0 10px 0;
  }

  .page-header p {
    color: rgba(255, 255, 255, 0.7);
    font-size: 16px;
    margin: 0;
  }

  .placeholder-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 400px;
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    color: rgba(255, 255, 255, 0.5);
    text-align: center;
  }

  .placeholder-icon {
    font-size: 64px;
    margin-bottom: 20px;
  }

  .placeholder-container h3 {
    font-size: 20px;
    margin: 0 0 10px 0;
    color: rgba(255, 255, 255, 0.7);
  }

  .placeholder-container p {
    font-size: 16px;
    margin: 0;
  }
</style>
