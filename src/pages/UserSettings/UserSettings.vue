<script setup lang="ts">
  import { useUserSettings } from '../../composables/useUserSettings'
  import { ref } from 'vue'
  import backgroundImage from '@/assets/images/AI_1775009231144.png'
  import uploadIcon from '@/assets/images/上传头像.png'
  import selectImageIcon from '@/assets/images/选择图片.png'

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
  import { open } from 'node:fs'

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
                <img v-else :src="uploadIcon" alt="上传头像" style="width: 24px; height: 24px" />
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
              <label class="form-label">QQ</label>
              <input v-model="userQQ" type="text" placeholder="QQ号" class="form-input" />
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
      <div v-if="successMessage" class="success-message">
        {{ successMessage }}
      </div>

      <div v-if="isLoading" class="loading-container">
        <div class="loading-spinner"></div>
        <span>加载中...</span>
      </div>

      <el-tabs v-else :tab-position="tabPosition" type="card" class="demo-tabs">
        <el-tab-pane label="我的信息">
          <el-form
            label-width="180px"
            class="form-with-background"
            :style="{
              marginTop: '30px',
              padding: '20px',
              borderRadius: '12px',
              position: 'relative',
            }"
          >
            <div class="Settings-section">
              <div class="Avatar-section">
                <div class="File-input-wrapper Avatar-action-left">
                  <input
                    id="Avatar-input"
                    type="file"
                    accept="image/jpeg,image/png,image/gif"
                    class="file-input"
                    @change="handleFileSelect"
                  />
                  <label for="Avatar-input" class="File-input-label">
                    <img :src="selectImageIcon" alt="选择图片" style="width: 100px" />
                  </label>
                </div>
                <div class="Avatar-preview-container">
                  <div class="Avatar-preview">
                    <img v-if="avatarPreview" :src="avatarPreview" alt="头像预览" />
                    <span v-else>{{ userName.charAt(0).toUpperCase() }}</span>
                  </div>
                </div>
                <button
                  class="Upload-btn Avatar-action-right"
                  :disabled="isUploading || !selectedFile"
                  @click="uploadAvatar"
                >
                  <span v-if="isUploading" class="Btn-spinner"></span>
                  <img v-else :src="uploadIcon" alt="上传头像" style="width: 100px" />
                </button>
              </div>
              <p v-if="avatarError" class="error-text">{{ avatarError }}</p>
            </div>
            <el-form-item label="昵称">
              <el-input
                v-model="userName"
                maxlength="10"
                placeholder="昵称最多允许10个字符QAQ"
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
                class="transparent-input"
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
            <el-form-item label-width="0" style="display: flex; margin-top: 40px; margin-left: 38%">
              <p v-if="detailError" class="error-text">{{ detailError }}</p>
            </el-form-item>
            <el-form-item
              label-width="30"
              style="display: flex; margin-top: 20px; margin-left: 38%"
            >
              <el-button
                type="primary"
                style="width: 150px"
                :disabled="isSavingDetail"
                @click="saveUserDetail"
                ><span v-if="isSavingDetail" class="Btn-spinner"></span>
                <span v-else>保存</span></el-button
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
        <el-tab-pane label="黑名单管理">
          <div class="about-container">
            <h3 class="about-title">关于我们</h3>
            <div class="about-content">
              <p>欢迎使用我们的服务，我们致力于为您提供优质的用户体验。</p>
              <p>我们的团队不断努力改进产品，为您带来更好的服务。</p>
            </div>

            <h3 class="disclaimer-title">免责声明</h3>
            <div class="disclaimer-content">
              <div class="language-section">
                <h4>当サイトについて</h4>
                <p>
                  当サイトは、アニメーション作品『超かぐや姫！』（以下「本作品」といいます）の二次創作ファンサイトであり、本作品の公式サイト、製作者、著作権者とは一切関係ございません。
                </p>
                <p>
                  当サイトは非営利目的で運営されており、収益を目的とした広告、アフィリエイト、有料コンテンツなどは一切行っておりません。
                </p>
                <p>
                  当サイトで使用している画像・イラスト・名称などの著作権は、それぞれの権利者に帰属します。権利者の皆様には深く敬意を表します。
                </p>
                <p>
                  本作品の権利者からご連絡をいただいた場合、当サイトの内容について速やかに対応（修正・削除など）いたします。
                </p>
                <p>© 超かぐや姫！製作委員会</p>
              </div>

              <div class="language-section">
                <h4>关于本网站</h4>
                <p>
                  本网站为动画作品《超时空辉夜姬》（以下简称“本作品”）的二次创作粉丝网站，与本作品的官方网站、制作方、版权方无任何关联。
                </p>
                <p>本网站为非营利性质，不包含任何形式的广告、返利链接、付费内容或商业推广。</p>
                <p>
                  本网站所使用的图片、插图、名称等版权均归其各自权利人所有。我们对所有权利人表示诚挚的敬意。
                </p>
                <p>如本作品的版权方提出要求，我们将立即对网站内容进行修正或删除。</p>
                <p>© 超时空辉夜姬 制作委员会</p>
              </div>
            </div>
          </div>
        </el-tab-pane>
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
  .settings-container-pcOnly {
    display: none;
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

  .success-text {
    color: #81c784;
    font-size: 14px;
    margin: 0;
    text-align: center;
  }
  .security-container {
    display: flex;
    justify-content: center;
    padding: 40px 20px;
    margin-left: -10%;
  }

  .change-password-card {
    background: rgba(81, 7, 7, 0.021);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    width: 100%;
    max-width: 600px;
    overflow: hidden;
    transition:
      transform 0.3s ease,
      box-shadow 0.3s ease;
  }

  .change-password-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 50px rgba(0, 0, 0, 0.3);
  }

  .card-header {
    background: linear-gradient(135deg, rgba(33, 150, 243, 0.5), rgba(25, 118, 210, 0.4));
    padding: 30px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .card-header .section-title {
    color: #ffffff;
    font-size: 28px;
    font-weight: 600;
    margin: 0 0 10px 0;
    text-align: center;
  }

  .card-header .section-description {
    color: rgba(255, 255, 255, 0.7);
    font-size: 16px;
    margin: 0;
    text-align: center;
  }

  .card-body {
    padding: 40px;
  }

  .form-item {
    margin-bottom: 30px !important;
  }

  .code-input-wrapper {
    display: flex;
    align-items: center;
    gap: 15px;
  }

  .form-actions {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
    margin-top: 40px;
  }

  .form-actions .error-text,
  .form-actions .success-text {
    text-align: center;
    width: 100%;
  }

  :deep(.el-input__wrapper) {
    background: rgba(255, 255, 255, 0.4) !important;
    border: 2px solid rgba(33, 150, 243, 0.5) !important;
    border-radius: 12px !important;
    transition: all 0.3s ease !important;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1) !important;
  }

  :deep(.el-input__wrapper:hover) {
    border-color: rgba(33, 150, 243, 0.8) !important;
    background: rgba(255, 255, 255, 0.5) !important;
    box-shadow: 0 0 20px rgba(33, 150, 243, 0.3) !important;
  }

  :deep(.el-input__wrapper.is-focus) {
    border-color: rgba(33, 150, 243, 1) !important;
    background: rgba(255, 255, 255, 0.6) !important;
    box-shadow: 0 0 30px rgba(33, 150, 243, 0.4) !important;
  }

  :deep(.el-input__input) {
    color: #1a237e !important;
    font-weight: 500 !important;
  }

  :deep(.el-input__placeholder) {
    color: rgba(26, 35, 126, 0.5) !important;
  }

  :deep(.el-button--primary) {
    background: linear-gradient(135deg, #2196f3, #1976d2) !important;
    border: none !important;
    border-radius: 12px !important;
    padding: 12px 24px !important;
    font-size: 16px !important;
    font-weight: 500 !important;
    transition: all 0.3s ease !important;
  }

  :deep(.el-button--primary:hover:not(:disabled)) {
    transform: translateY(-2px) !important;
    box-shadow: 0 6px 20px rgba(33, 150, 243, 0.4) !important;
  }

  :deep(.el-button--primary:disabled) {
    opacity: 0.6 !important;
  }

  :deep(.el-button) {
    border-radius: 12px !important;
    padding: 10px 20px !important;
  }

  :deep(.el-form-item__label) {
    -webkit-text-stroke-width: 0.1px;
    -webkit-text-stroke-color: rgba(85, 159, 188) !important;
    color: #36788a5a !important;
    font-size: 16px !important;
    font-weight: 500 !important;
  }

  .captcha-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(5px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    animation: fadeIn 0.3s ease;
  }

  .captcha-modal-content {
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    padding: 40px;
    width: 90%;
    max-width: 450px;
    animation: slideUp 0.3s ease;
  }

  .captcha-modal-content h3 {
    margin-top: 0;
    color: #ffffff;
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 15px;
    text-align: center;
  }

  .captcha-modal-content p {
    text-align: center;
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 30px;
    font-size: 16px;
  }

  .captcha-modal-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .captcha-container {
    display: flex;
    gap: 15px;
    align-items: center;
    flex-wrap: wrap;
    justify-content: center;
  }

  .captcha-image {
    width: 120px;
    height: 48px;
    cursor: pointer;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    flex-shrink: 0;
    transition: all 0.3s ease;
  }

  .captcha-image:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 15px rgba(33, 150, 243, 0.3);
  }

  .captcha-modal-actions {
    display: flex;
    gap: 15px;
    margin-top: 10px;
  }

  .captcha-modal-actions button {
    flex: 1;
    font-size: 16px !important;
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
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
  @media screen and (min-width: 768px) {
    .form-with-background::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: url('@/assets/images/1775021811673.jpeg');
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      opacity: 0.8;
      border-radius: 12px;
      z-index: 0;
    }

    .form-with-background > * {
      position: relative;
      z-index: 1;
    }

    .transparent-input :deep(.el-textarea__inner) {
      background-color: rgba(255, 255, 255, 0) !important;
      border-color: rgba(255, 255, 255, 0.3) !important;
    }

    .transparent-input :deep(.el-textarea__inner:focus) {
      background-color: rgba(255, 255, 255, 0) !important;
      border-color: rgba(33, 150, 243, 0.5) !important;
    }

    .settings-container-mobileOnly {
      display: none;
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
      font-size: 24px !important;
      color: #1a237e !important;
      font-weight: 600 !important;
      text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.8);
    }
    :deep(.el-input__wrapper) {
      background: rgba(255, 255, 255, 0.5) !important;
      border: 2px solid rgba(33, 150, 243, 0.6) !important;
      border-radius: 12px !important;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1) !important;
    }
    :deep(.el-input__wrapper:hover) {
      background: rgba(255, 255, 255, 0.6) !important;
      border-color: rgba(33, 150, 243, 0.8) !important;
      box-shadow: 0 4px 15px rgba(33, 150, 243, 0.2) !important;
    }
    :deep(.el-input__wrapper.is-focus) {
      background: rgba(255, 255, 255, 0.7) !important;
      border-color: rgba(33, 150, 243, 1) !important;
      box-shadow: 0 4px 20px rgba(33, 150, 243, 0.3) !important;
    }
    :deep(.ela_input__inner),
    :deep(.el-textarea__inner) {
      font-size: 20px;
      padding: 16px 20px;
      color: #1a237e !important;
      font-weight: 500 !important;
    }
    :deep(.el-input__inner)::placeholder,
    :deep(.el-textarea__inner)::placeholder {
      font-size: 20px;
      color: rgba(26, 35, 126, 0.5) !important;
    }
    :deep(.el-select .el-input__wrapper) {
      background: rgba(255, 255, 255, 0.5) !important;
      border: 2px solid rgba(33, 150, 243, 0.6) !important;
    }
    :deep(.el-date-editor .el-input__wrapper) {
      background: rgba(255, 255, 255, 0.5) !important;
      border: 2px solid rgba(33, 150, 243, 0.6) !important;
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
    .el-form-item:not(:first-child) {
      margin-top: 20px !important;
    }
    .Avatar-divider {
      margin-top: 20px;
      height: 1px;
      background-color: rgba(20, 68, 86, 0.2);
    }
    .Avatar-section {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 40px;
      margin-top: 20px;
      margin-bottom: 20px;
      margin-left: 0;
    }
    .Avatar-preview-container {
      flex-shrink: 0;
    }
    .Avatar-preview {
      width: 180px;
      height: 180px;
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
    .Avatar-action-left,
    .Avatar-action-right {
      flex-shrink: 0;
    }
    .Avatar-action-left {
      margin-right: 30px;
    }
    .el-form {
      margin-top: 20px !important;
    }
    .el-form-item {
      margin-bottom: 16px !important;
      margin-left: 90px;
    }
    .el-form-item:not(:first-child) {
      margin-top: 16px !important;
    }

    .File-input-wrapper {
      position: relative;
    }

    .File-input {
      position: absolute;
      opacity: 0.2;
      width: 100%;
      height: 100%;
      cursor: pointer;
    }

    .File-input-label {
      display: block;
      padding: 8px 16px;
      background: transparent;
      border: none;
      border-radius: 12px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .File-input-label:hover {
      transform: scale(1.05);
    }
    .Upload-btn {
      padding: 16px 60px;
      color: white;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      min-height: 80px;
      min-width: 100px;
    }

    .Upload-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(33, 150, 243, 0.4);
    }

    .Upload-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* 关于我们和免责声明样式 */
    .about-container {
      padding: 30px;
      color: rgba(255, 255, 255, 0.8);
    }

    .about-title {
      font-size: 28px;
      font-weight: 600;
      margin-bottom: 20px;
      color: #2196f3;
    }

    .about-content {
      background: linear-gradient(135deg, rgba(25, 111, 210, 0.919), rgba(33, 150, 243, 0.1));
      /* border: 1px solid rgba(255, 255, 255, 0.1); */
      border-radius: 12px;
      padding: 20px;
      line-height: 1.6;
      margin-bottom: 40px;
      line-height: 1.6;
    }

    .disclaimer-title {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 20px;
      color: #f30404;
    }

    .disclaimer-content {
      background: linear-gradient(135deg, rgba(25, 118, 210, 0.919), rgba(33, 150, 243, 0.4));
      /* border: 1px solid rgba(21, 75, 119, 0.233); */
      border-radius: 12px;
      padding: 30px;
      line-height: 1.6;
      box-shadow: 0 4px 20px rgba(33, 150, 243, 0.1);
    }

    .language-section {
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .language-section:last-child {
      margin-bottom: 0;
      padding-bottom: 0;
      border-bottom: none;
    }

    .language-section h4 {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 15px;
      color: #4fc3f7;
    }

    .language-section p {
      margin-bottom: 12px;
      text-align: justify;
      font-weight: 500;
    }

    .language-section p:last-child {
      margin-top: 20px;
      font-weight: 700;
      color: #f5f5f5;
    }
  }
</style>
