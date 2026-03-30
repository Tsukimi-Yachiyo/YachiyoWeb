<script setup lang="ts">
  import { useUserSettings } from '../../composables/useUserSettings'
  import { ref } from 'vue'

  import {
    ElTabs,
    ElTabPane,
    ElForm,
    ElFormItem,
    ElInput,
    ElSelect,
    ElOption,
    ElDatePicker,
    ElButton,
    ElRow,
    ElCol,
  } from 'element-plus'
  import type { TabsInstance } from 'element-plus'

  const tabPosition = ref<TabsInstance['tabPosition']>('left')
  const {
    userName,
    userQQ,
    userAvatar,
    avatarPreview,
    selectedFile,
    userIntroduction,
    userCity,
    userGender,
    userPhone,
    userBirthday,
    isLoading,
    isUploading,
    isSavingDetail,
    detailError,
    avatarError,
    successMessage,
    handleFileSelect,
    uploadAvatar,
    saveUserDetail,
    goBack,
  } = useUserSettings()
</script>

<template>
  <!-- 移动端界面 -->
  <div class="settings-container-mobileOnly">
    <div class="settings-card">
      <div class="settings-header">
        <button class="back-btn" @click="goBack">
          <span>←</span>
          <span>返回</span>
        </button>
        <h1 class="settings-title">个人设置</h1>
        <div class="placeholder"></div>
      </div>

      <div v-if="successMessage" class="success-message">
        {{ successMessage }}
      </div>

      <div v-if="isLoading" class="loading-container">
        <div class="loading-spinner"></div>
        <span>加载中...</span>
      </div>

      <div v-else class="settings-content">
        <!-- 头像设置 -->
        <div class="settings-section">
          <h2 class="section-title">头像设置</h2>
          <div class="avatar-section">
            <div class="avatar-preview-container">
              <div class="avatar-preview">
                <img v-if="avatarPreview" :src="avatarPreview" alt="头像预览" />
                <span v-else>{{ userName.charAt(0).toUpperCase() }}</span>
              </div>
            </div>
            <div class="avatar-actions">
              <div class="file-input-wrapper">
                <input
                  id="avatar-input"
                  type="file"
                  accept="image/jpeg,image/png,image/gif"
                  class="file-input"
                  @change="handleFileSelect"
                />
                <label for="avatar-input" class="file-input-label"> 选择图片 </label>
              </div>
              <button
                class="upload-btn"
                :disabled="isUploading || !selectedFile"
                @click="uploadAvatar"
              >
                <span v-if="isUploading" class="btn-spinner"></span>
                <span v-else>上传头像</span>
              </button>
            </div>
          </div>
          <p v-if="avatarError" class="error-text">{{ avatarError }}</p>
          <p class="help-text">支持 JPG、PNG、GIF 格式，最大 5MB</p>
        </div>

        <div class="section-divider"></div>

        <!-- 用户详情 -->
        <div class="settings-section">
          <h2 class="section-title">基本信息</h2>

          <div class="form-group">
            <label class="form-label">昵称</label>
            <input
              v-model="userName"
              type="text"
              placeholder="输入昵称"
              class="form-input"
              maxlength="20"
            />
          </div>

          <div class="form-group">
            <label class="form-label">个人简介</label>
            <textarea
              v-model="userIntroduction"
              placeholder="介绍一下自己..."
              class="form-textarea"
              rows="4"
            ></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">性别</label>
              <select v-model="userGender" class="form-select">
                <option value="男">男</option>
                <option value="女">女</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">生日</label>
              <input v-model="userBirthday" type="date" class="form-input" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">城市</label>
              <input v-model="userCity" type="text" placeholder="所在城市" class="form-input" />
            </div>

            <div class="form-group">
              <label class="form-label">电话</label>
              <input v-model="userPhone" type="tel" placeholder="联系电话" class="form-input" />
            </div>
          </div>

          <div class="save-section">
            <p v-if="detailError" class="error-text">{{ detailError }}</p>
            <button class="save-btn" :disabled="isSavingDetail" @click="saveUserDetail">
              <span v-if="isSavingDetail" class="btn-spinner"></span>
              <span v-else>保存信息</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  <!-- PC端界面 -->
  <div class="settings-container-pcOnly">
    <div class="Setting-Card">
      <el-tabs :tab-position="tabPosition" type="card" class="demo-tabs">
        <el-tab-pane label="我的信息">
          <el-form label-width="180px" style="margin-top: 30px">
            <div class="Settings-section">
              <div class="Avatar-section">
                <div class="Avatar-preview-container">
                  <div class="Avatar-preview">
                    <img v-if="avatarPreview" :src="avatarPreview" alt="头像预览" />
                    <span v-else>{{ userName.charAt(0).toUpperCase() }}</span>
                  </div>
                </div>
                <div class="Avatar-actions">
                  <div class="File-input-wrapper">
                    <input
                      id="Avatar-input"
                      type="file"
                      accept="image/jpeg,image/png,image/gif"
                      class="file-input"
                      @change="handleFileSelect"
                    />
                    <label for="Avatar-input" class="File-input-label"> 选择图片 </label>
                  </div>
                  <button
                    class="Upload-btn"
                    :disabled="isUploading || !selectedFile"
                    @click="uploadAvatar"
                  >
                    <span v-if="isUploading" class="Btn-spinner"></span>
                    <span v-else>上传头像</span>
                  </button>
                </div>
              </div>
            </div>
            <el-form-item label="昵称">
              <el-input
                v-model="userName"
                maxlength="8"
                show-word-limit
                placeholder="昵称最多允许八个字哦QAQ"
                style="width: auto"
              />
            </el-form-item>
            <el-form-item label="个人签名" style="margin-top: 40px">
              <el-input
                v-model="userIntroduction"
                size="large"
                :rows="4"
                maxlength="40"
                show-word-limit
                type="textarea"
                placeholder="  简单介绍下自己吧♡( •ॢ◡-ॢ)✧"
                style="width: 70%; height: auto"
              />
            </el-form-item>
            <el-form-item label="性别" style="margin-top: 40px">
              <el-select v-model="userGender" placeholder="请选择您的性别" style="width: 150px">
                <el-option label="男" value="男" />
                <el-option label="女" value="女" />
                <el-option label="保密" value="保密" />
              </el-select>
            </el-form-item>
            <el-form-item label="生日" style="margin-top: 40px">
              <el-date-picker
                v-model="userBirthday"
                type="date"
                placeholder="选择您的生日"
                style="width: 200px"
              />
            </el-form-item>
            <el-row :gutter="10" style="margin-top: 40px">
              <el-col :span="8">
                <el-form-item label="城市">
                  <el-input v-model="userCity" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="QQ">
                  <el-input v-model="userQQ" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label-width="0" style="display: flex; margin-top: 50px; margin-left: 38%">
              <el-button type="primary" style="width: 150px" @click="saveUserDetail"
                >保存</el-button
              >
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <!-- <el-tab-pane label="我的头像">
          <div class="Settings-section">
            <h2 class="Section-title">头像设置</h2>
            <div class="Avatar-divider"></div>
            <div class="Avatar-section">
              <div class="Avatar-preview-container">
                <div class="Avatar-preview">
                  <img v-if="avatarPreview" :src="avatarPreview" alt="头像预览" />
                  <span v-else>{{ userName.charAt(0).toUpperCase() }}</span>
                </div>
              </div>
              <div class="Avatar-actions">
                <div class="File-input-wrapper">
                  <input
                    id="Avatar-input"
                    type="file"
                    accept="image/jpeg,image/png,image/gif"
                    class="file-input"
                    @change="handleFileSelect"
                  />
                  <label for="Avatar-input" class="File-input-label"> 选择图片 </label>
                </div>
                <button
                  class="Upload-btn"
                  :disabled="isUploading || !selectedFile"
                  @click="uploadAvatar"
                >
                  <span v-if="isUploading" class="Btn-spinner"></span>
                  <span v-else>上传头像</span>
                </button>
              </div>
            </div>
          </div>
        </el-tab-pane> -->
        <el-tab-pane label="账号安全"></el-tab-pane>
        <el-tab-pane label="黑名单管理"></el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<style scoped>
  .settings-container-mobileOnly {
    min-height: 100vh;
    background: linear-gradient(135deg, #1a237e 0%, #0d1642 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }
  .settings-container-mobileOnly {
    display: block;
  }
  .settings-container-pcOnly {
    display: none;
  }
  @media screen and (min-width: 768px) {
    .settings-container-mobileOnly {
      display: none;
    }
    .settings-container-pcOnly {
      display: block;
    }
  }
  .settings-card {
    width: 100%;
    /* max-width: 600px; */
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    padding: 30px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }

  .settings-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 30px;
  }

  .back-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 10px;
    color: #fff;
    font-size: 20px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .back-btn:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateX(-3px);
  }

  .settings-title {
    color: #fff;
    font-size: 24px;
    font-weight: 500;
    margin: 0;
  }

  .placeholder {
    width: 80px;
  }

  .success-message {
    background: rgba(76, 175, 80, 0.2);
    border: 1px solid rgba(76, 175, 80, 0.3);
    color: #81c784;
    padding: 12px 16px;
    border-radius: 10px;
    margin-bottom: 20px;
    text-align: center;
    animation: fadeIn 0.3s ease;
  }

  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    color: rgba(255, 255, 255, 0.7);
    gap: 15px;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(255, 255, 255, 0.1);
    border-top-color: #2196f3;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .settings-content {
    display: flex;
    flex-direction: column;
    gap: 30px;
  }

  .settings-section {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .section-title {
    color: #fff;
    font-size: 18px;
    font-weight: 500;
    margin: 0 0 10px 0;
  }

  .section-divider {
    height: 1px;
    background: rgba(255, 255, 255, 0.1);
  }

  /* 头像设置 */
  .avatar-section {
    display: flex;
    align-items: center;
    gap: 25px;
    flex-wrap: wrap;
  }

  .avatar-preview-container {
    flex-shrink: 0;
  }

  .avatar-preview {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
    font-size: 40px;
    overflow: hidden;
    border: 3px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  }

  .avatar-preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .avatar-actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
    flex: 1;
    min-width: 150px;
  }

  .file-input-wrapper {
    position: relative;
  }

  .file-input {
    position: absolute;
    opacity: 0;
    width: 100%;
    height: 100%;
    cursor: pointer;
  }

  .file-input-label {
    display: block;
    padding: 12px 24px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 10px;
    color: #fff;
    font-size: 14px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .file-input-label:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(33, 150, 243, 0.5);
  }

  .upload-btn {
    padding: 12px 24px;
    background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 44px;
  }

  .upload-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(33, 150, 243, 0.4);
  }

  .upload-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* 表单样式 */
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
  }

  .form-row {
    display: flex;
    gap: 15px;
    flex-wrap: wrap;
  }

  .form-label {
    color: rgba(255, 255, 255, 0.7);
    font-size: 14px;
  }

  .form-input,
  .form-textarea,
  .form-select {
    padding: 14px 20px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    color: #fff;
    font-size: 14px;
    outline: none;
    transition: all 0.3s ease;
  }

  .form-input::placeholder,
  .form-textarea::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }

  .form-input:focus,
  .form-textarea:focus,
  .form-select:focus {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(33, 150, 243, 0.5);
    box-shadow: 0 0 20px rgba(33, 150, 243, 0.2);
  }

  .form-textarea {
    resize: vertical;
    min-height: 100px;
  }

  .form-select {
    cursor: pointer;
  }

  .form-select option {
    background: #1a1a2e;
    color: #fff;
  }

  .save-section {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 10px;
  }

  .save-btn {
    padding: 14px 30px;
    background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 48px;
    width: 100%;
  }

  .save-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(33, 150, 243, 0.4);
  }

  .save-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .error-text {
    color: #f44336;
    font-size: 13px;
    margin: 0;
  }

  .help-text {
    color: rgba(255, 255, 255, 0.4);
    font-size: 12px;
    margin: 0;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* 响应式设计 */
  @media (max-width: 480px) {
    .settings-card {
      padding: 20px;
    }

    .settings-title {
      font-size: 20px;
    }

    .avatar-section {
      flex-direction: column;
      align-items: flex-start;
    }

    .avatar-actions {
      width: 100%;
    }

    .form-row {
      flex-direction: column;
    }
  }
  .demo-tabs > .el-tabs__content {
    padding: 32px;
    color: #6b778c;
    font-size: 32px;
    font-weight: 600;
  }
  .demo-tabs {
    height: 100%;
  }
  .el-tabs--right .el-tabs__content,
  .el-tabs--left .el-tabs__content {
    height: 100%;
  }
  .settings-container-pcOnly {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }
  .Setting-Card {
    align-items: center;
    justify-content: center;
    width: 80%;
    margin-top: 10%;
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    padding: 30px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }
  :deep(.el-tabs__item) {
    width: 150px;
    height: 60px;
    font-size: 20px;
    text-align: center;
    transition: background-color 1s ease-in-out;
  }
  :deep(.el-tabs__item:hover) {
    background-color: aliceblue;
  }
  :deep(.el-form-item__label) {
    font-size: 20px !important;

    /* color: rgba(255, 255, 255, 0.85); */
  }
  :deep(.ela_input__inner),
  :deep(.el-textarea__inner) {
    font-size: 20px; /* 修改这里的值来调整输入文字的大小 */
  }

  /* 修改 Element Plus 输入框 (ela_input, el-textarea) 的 placeholder 字体大小 */
  :deep(.ela_input__inner)::placeholder,
  :deep(.el-textarea__inner)::placeholder {
    font-size: 20px; /* 修改这里的值来调整 placeholder 文字的大小 */
  }
  .Settings-section {
    height: 80%;
  }
  .Section-title {
    color: #1976d2;
    font-size: 22px;
    font-weight: 500;
    margin-top: 20px;
    margin-left: 40%;
  }
  .Avatar-divider {
    margin-top: 20px;
    height: 1px;
    background-color: rgba(20, 68, 86, 0.2);
  }
  .Avatar-preview-container {
    margin-top: 40px;
  }
  .Avatar-preview {
    margin-left: 38%;
    width: 150px;
    height: 150px;
    border-radius: 50%;
    background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
    font-size: 40px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  }
  .Avatar-actions {
    margin-top: 20px;
    display: flex;
    gap: 20px;
    /* justify-content: center; */
    margin-left: 33%;
    margin-bottom: 20px;
  }

  .File-input-wrapper {
    position: relative;
  }

  .File-input {
    position: absolute;
    opacity: 0;
    width: 100%;
    height: 100%;
    cursor: pointer;
  }

  .File-input-label {
    display: block;
    padding: 12px 24px;
    background: rgba(255, 255, 255, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 10px;
    color: #2196f3;
    font-size: 20px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .File-input-label:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(33, 150, 243, 0.5);
  }
  .Upload-btn {
    padding: 12px 24px;
    /* background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%); */
    background: rgba(145, 68, 152, 0.397);
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 20px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 44px;
  }

  .Upload-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(33, 150, 243, 0.4);
  }

  .Upload-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>
