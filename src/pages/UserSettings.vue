<script setup lang="ts">
  import { useUserSettings } from '../composables/useUserSettings'
  import { computed, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import Message from '../components/Message.vue'
  import uploadIcon from '@/assets/icons/upload-avatar.png'
  import selectImageIcon from '@/assets/icons/select-image.png'

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

  const route = useRoute()
  const router = useRouter()
  const tabPosition = ref<TabsInstance['tabPosition']>('left')

  const mobileSettingsTabs = [
    { key: 'profile', label: '个人主页', path: '/settings/profile' },
    { key: 'password', label: '修改密码', path: '/settings/password' },
    { key: 'about', label: '关于我们', path: '/settings/about' },
  ] as const

  const currentMobileTab = computed(() => {
    if (route.path === '/settings/password') return 'password'
    if (route.path === '/settings/about') return 'about'
    return 'profile'
  })

  const currentMobileTabLabel = computed(() => {
    const tab = mobileSettingsTabs.find(item => item.key === currentMobileTab.value)
    return tab?.label || '个人主页'
  })

  const switchMobileTab = (path: string) => {
    if (route.path !== path) {
      router.push(path)
    }
  }

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
    changePasswordEmail,
    changePasswordCode,
    changePasswordNewPassword,
    changePasswordCodeCountdown,
    isSendingChangePasswordCode,
    showChangePasswordCaptchaModal,
    changePasswordCaptchaUrl,
    changePasswordCaptchaInput,
    changePasswordError,
    changePasswordSuccess,
    isChangingPassword,
    handleSendChangePasswordCode,
    handleConfirmChangePasswordCaptcha,
    handleCloseChangePasswordCaptchaModal,
    handleChangePassword,
    refreshChangePasswordCaptcha,
  } = useUserSettings()

  const confirmChangePasswordNewPassword = ref('')

  const passwordStrengthScore = computed(() => {
    const password = changePasswordNewPassword.value || ''
    if (!password) return 0

    let score = 0
    if (password.length >= 6) score += 1
    if (password.length >= 10) score += 1
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1
    if (/\d/.test(password)) score += 1
    if (/[^A-Za-z0-9]/.test(password)) score += 1

    return Math.min(score, 4)
  })

  const passwordStrengthText = computed(() => {
    if (!changePasswordNewPassword.value) return '请输入新密码'
    if (passwordStrengthScore.value <= 1) return '强度：弱'
    if (passwordStrengthScore.value <= 3) return '强度：中'
    return '强度：强'
  })

  const passwordStrengthClass = computed(() => {
    if (!changePasswordNewPassword.value) return ''
    if (passwordStrengthScore.value <= 1) return 'weak'
    if (passwordStrengthScore.value <= 3) return 'medium'
    return 'strong'
  })

  const passwordMismatch = computed(() => {
    if (!confirmChangePasswordNewPassword.value) return false
    return confirmChangePasswordNewPassword.value !== changePasswordNewPassword.value
  })

  const handleMobileChangePassword = async () => {
    changePasswordError.value = ''

    if (!confirmChangePasswordNewPassword.value) {
      changePasswordError.value = '请再次输入新密码'
      return
    }

    if (passwordMismatch.value) {
      changePasswordError.value = '两次输入的新密码不一致'
      return
    }

    if (passwordStrengthScore.value <= 1) {
      changePasswordError.value = '密码强度过弱，请增加大小写字母、数字或符号组合'
      return
    }

    await handleChangePassword()

    if (!changePasswordError.value) {
      confirmChangePasswordNewPassword.value = ''
    }
  }
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
        <h1 class="settings-title">{{ currentMobileTabLabel }}</h1>
        <div class="placeholder"></div>
      </div>

      <Message
        v-if="successMessage"
        type="success"
        :message="successMessage"
        :auto-close="3000"
        @close="successMessage = ''"
      />

      <div v-if="isLoading" class="loading-container">
        <div class="loading-spinner"></div>
        <span>加载中...</span>
      </div>

      <div v-else class="settings-content mobile-settings-shell">
        <div class="mobile-settings-nav">
          <button
            v-for="tab in mobileSettingsTabs"
            :key="tab.key"
            type="button"
            class="mobile-tab-btn"
            :class="{ active: currentMobileTab === tab.key }"
            @click="switchMobileTab(tab.path)"
          >
            {{ tab.label }}
          </button>
        </div>

        <div class="mobile-settings-panel">
          <template v-if="currentMobileTab === 'profile'">
            <div class="mobile-page-card">
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
                      <label for="avatar-input" class="file-input-label">
                        <img
                          :src="selectImageIcon"
                          alt="选择图片"
                          class="mobile-avatar-action-icon"
                        />
                      </label>
                    </div>
                    <button
                      class="upload-btn"
                      :disabled="isUploading || !selectedFile"
                      @click="uploadAvatar"
                    >
                      <span v-if="isUploading" class="btn-spinner"></span>
                      <img
                        v-else
                        :src="uploadIcon"
                        alt="上传头像"
                        class="mobile-avatar-action-icon"
                      />
                    </button>
                  </div>
                </div>
                <p v-if="avatarError" class="error-text">{{ avatarError }}</p>
                <p class="help-text avatar-help-text">支持 JPG、PNG、GIF 格式，最大 5MB</p>
              </div>

              <div class="section-divider"></div>

              <div class="settings-section">
                <h2 class="section-title center-title">基本信息</h2>

                <div class="form-group">
                  <label class="form-label">昵称</label>
                  <input
                    v-model="userName"
                    type="text"
                    placeholder="昵称最多允许10个字符QAQ"
                    class="form-input"
                    maxlength="10"
                  />
                </div>

                <div class="form-group">
                  <label class="form-label">个人简介</label>
                  <textarea
                    v-model="userIntroduction"
                    placeholder="简单介绍下自己吧♡( •ॢ◡-ॢ)✧"
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
                      <option value="保密">保密</option>
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
                    <input
                      v-model="userCity"
                      type="text"
                      placeholder="所在城市"
                      class="form-input"
                    />
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
          </template>

          <template v-else-if="currentMobileTab === 'password'">
            <div class="mobile-page-card mobile-password-card">
              <div class="settings-section">
                <h2 class="section-title">修改密码</h2>
                <p class="help-text">通过邮箱验证码修改您的登录密码</p>

                <div class="form-group">
                  <label class="form-label">邮箱</label>
                  <input
                    v-model="changePasswordEmail"
                    type="email"
                    placeholder="请输入您的邮箱地址"
                    class="form-input"
                  />
                </div>

                <div class="form-group">
                  <label class="form-label">验证码</label>
                  <div class="mobile-code-row">
                    <input
                      v-model="changePasswordCode"
                      type="text"
                      placeholder="请输入邮箱验证码"
                      class="form-input"
                    />
                    <button
                      type="button"
                      class="code-btn"
                      :disabled="isSendingChangePasswordCode || changePasswordCodeCountdown > 0"
                      @click="handleSendChangePasswordCode"
                    >
                      <span v-if="isSendingChangePasswordCode">发送中...</span>
                      <span v-else-if="changePasswordCodeCountdown > 0">
                        {{ Math.floor(changePasswordCodeCountdown / 60) }}分
                        {{ changePasswordCodeCountdown % 60 }}秒
                      </span>
                      <span v-else>获取验证码</span>
                    </button>
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">新密码</label>
                  <input
                    v-model="changePasswordNewPassword"
                    type="password"
                    placeholder="请输入新密码（至少6位）"
                    class="form-input"
                  />
                  <p class="password-strength" :class="passwordStrengthClass">
                    {{ passwordStrengthText }}
                  </p>
                </div>

                <div class="form-group">
                  <label class="form-label">确认新密码</label>
                  <input
                    v-model="confirmChangePasswordNewPassword"
                    type="password"
                    placeholder="请再次输入新密码"
                    class="form-input"
                  />
                  <p v-if="passwordMismatch" class="error-text">两次输入的新密码不一致</p>
                </div>

                <div class="save-section">
                  <p v-if="changePasswordError" class="error-text">{{ changePasswordError }}</p>
                  <p v-if="changePasswordSuccess" class="success-text">
                    {{ changePasswordSuccess }}
                  </p>
                  <button
                    class="save-btn"
                    :disabled="isChangingPassword"
                    @click="handleMobileChangePassword"
                  >
                    <span v-if="isChangingPassword" class="btn-spinner"></span>
                    <span v-else>确认修改</span>
                  </button>
                </div>
              </div>
            </div>
          </template>

          <template v-else>
            <div class="mobile-page-card">
              <div class="settings-section">
                <h2 class="section-title">关于我们</h2>
                <div class="mobile-about-card">
                  <p>欢迎使用我们的服务，我们致力于为您提供优质的用户体验。</p>
                  <p>我们的团队不断努力改进产品，为您带来更好的服务。</p>
                </div>
              </div>

              <div class="settings-section">
                <h2 class="section-title">免责声明</h2>
                <div class="mobile-about-card disclaimer-card-mobile">
                  <div class="language-section-mobile">
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

                  <div class="language-section-mobile">
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
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
  <!-- PC端界面 -->
  <div class="settings-container-pcOnly">
    <div class="Setting-Card">
      <Message
        v-if="successMessage"
        type="success"
        :message="successMessage"
        :auto-close="3000"
        @close="successMessage = ''"
      />

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
            <button class="pc-back-btn" @click="goBack">
              <span>←</span>
              <span>返回</span>
            </button>
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
                style="width: 210px"
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
                style="width: 150px; height: auto"
                :disabled="isSavingDetail"
                @click="saveUserDetail"
                ><span v-if="isSavingDetail" class="Btn-spinner"></span>
                <span v-else>保存</span></el-button
              >
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="账号安全">
          <div class="security-container">
            <div class="change-password-card">
              <button class="pc-back-btn" @click="goBack">
                <span>←</span>
                <span>返回</span>
              </button>
              <div class="card-content">
                <div class="card-header">
                  <h3 class="section-title">修改密码</h3>
                  <p class="section-description">通过邮箱验证码修改您的登录密码</p>
                </div>
                <div class="card-body">
                  <el-form label-width="120px">
                    <el-form-item label="邮箱" class="form-item">
                      <el-input
                        v-model="changePasswordEmail"
                        placeholder="请输入您的邮箱地址"
                        style="width: 400px"
                        type="email"
                      />
                    </el-form-item>

                    <el-form-item label="验证码" class="form-item">
                      <div class="code-input-wrapper">
                        <el-input
                          v-model="changePasswordCode"
                          placeholder="请输入邮箱验证码"
                          style="width: 280px"
                        />
                        <el-button
                          type="primary"
                          :disabled="isSendingChangePasswordCode || changePasswordCodeCountdown > 0"
                          style="margin-left: 10px"
                          @click="handleSendChangePasswordCode"
                        >
                          <span v-if="isSendingChangePasswordCode">发送中...</span>
                          <span v-else-if="changePasswordCodeCountdown > 0">
                            {{ Math.floor(changePasswordCodeCountdown / 60) }}分{{
                              changePasswordCodeCountdown % 60
                            }}秒后重发
                          </span>
                          <span v-else>获取验证码</span>
                        </el-button>
                      </div>
                    </el-form-item>

                    <el-form-item label="新密码" class="form-item">
                      <el-input
                        v-model="changePasswordNewPassword"
                        type="password"
                        placeholder="请输入新密码（至少6位）"
                        style="width: 400px"
                        show-password
                      />
                    </el-form-item>

                    <div class="form-actions">
                      <p v-if="changePasswordError" class="error-text">{{ changePasswordError }}</p>
                      <Message
                        v-if="changePasswordSuccess"
                        type="success"
                        :message="changePasswordSuccess"
                        :auto-close="3000"
                        @close="changePasswordSuccess = ''"
                      />
                      <el-button
                        type="primary"
                        style="width: 150px"
                        :disabled="isChangingPassword"
                        @click="handleChangePassword"
                      >
                        <span v-if="isChangingPassword">修改中...</span>
                        <span v-else>确认修改</span>
                      </el-button>
                    </div>
                  </el-form>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>
        <el-tab-pane label="关于我们">
          <div class="about-container">
            <button class="pc-back-btn" @click="goBack">
              <span>←</span>
              <span>返回</span>
            </button>
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

  <div v-if="showChangePasswordCaptchaModal" class="captcha-modal">
    <div class="captcha-modal-content">
      <h3>验证身份</h3>
      <p>请输入图形验证码以获取邮箱验证码</p>
      <div class="captcha-modal-form">
        <div class="captcha-container">
          <el-input
            v-model="changePasswordCaptchaInput"
            placeholder="请输入图形验证码"
            style="width: 200px"
          />
          <img
            :src="changePasswordCaptchaUrl"
            alt="验证码"
            class="captcha-image"
            @click="refreshChangePasswordCaptcha"
          />
        </div>
        <div class="captcha-modal-actions">
          <el-button @click="handleCloseChangePasswordCaptchaModal">取消</el-button>
          <el-button
            type="primary"
            :disabled="isSendingChangePasswordCode"
            @click="handleConfirmChangePasswordCaptcha"
          >
            {{ isSendingChangePasswordCode ? '发送中...' : '确认' }}
          </el-button>
        </div>
        <p v-if="changePasswordError" class="error-text">{{ changePasswordError }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .settings-container-mobileOnly {
    min-height: 100vh;
    background: linear-gradient(180deg, #f7f9fc 0%, #edf2f7 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }
  .settings-container-pcOnly {
    display: none;
    background: white;
  }

  .settings-card {
    width: 100%;
    max-height: calc(100vh - 40px);
    background: rgba(255, 255, 255, 0.86);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(15, 23, 42, 0.08);
    border-radius: 20px;
    padding: 30px;
    box-shadow: 0 18px 45px rgba(15, 23, 42, 0.14);
    overflow-y: auto;
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
    background: rgba(255, 255, 255, 0.75);
    border: 1px solid rgba(148, 163, 184, 0.35);
    border-radius: 10px;
    color: #1f2937;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .back-btn:hover {
    background: rgba(255, 255, 255, 0.95);
    transform: translateX(-3px);
  }

  .settings-title {
    color: #0f172a;
    font-size: 24px;
    font-weight: 500;
    margin: 0;
  }

  .placeholder {
    width: 80px;
  }

  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    color: rgba(30, 41, 59, 0.7);
    gap: 15px;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(15, 23, 42, 0.1);
    border-top-color: #2196f3;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .settings-content {
    display: flex;
    flex-direction: column;
    gap: 30px;
  }

  .mobile-settings-shell {
    flex-direction: row;
    align-items: flex-start;
    gap: 14px;
    width: 100%;
  }

  .mobile-settings-nav {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 110px;
    flex-shrink: 0;
  }

  .mobile-tab-btn {
    padding: 10px 8px;
    border-radius: 10px;
    border: 1px solid rgba(148, 163, 184, 0.35);
    color: #334155;
    background: rgba(255, 255, 255, 0.78);
    cursor: pointer;
    font-size: 13px;
    transition: all 0.2s ease;
  }

  .mobile-tab-btn.active {
    color: #0b4f99;
    background: rgba(219, 234, 254, 0.9);
    border-color: rgba(59, 130, 246, 0.55);
    box-shadow: 0 4px 14px rgba(59, 130, 246, 0.18);
  }

  .mobile-settings-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 24px;
    width: 100%;
  }

  .mobile-page-card {
    border: 1px solid rgba(148, 163, 184, 0.2);
    border-radius: 14px;
    padding: 16px;
    background: rgba(255, 255, 255, 0.95);
    box-shadow: 0 8px 22px rgba(15, 23, 42, 0.1);
    width: 100%;
  }

  .mobile-password-card {
    width: 100%;
    display: flex;
    justify-content: center;
  }

  .mobile-password-card .settings-section {
    align-items: center;
    width: 100%;
  }

  .mobile-password-card .form-group,
  .mobile-password-card .save-section {
    width: 100%;
  }

  .mobile-password-card .section-title,
  .mobile-password-card .help-text {
    text-align: center;
  }

  .center-title {
    text-align: center;
  }

  .avatar-help-text {
    font-size: 12px;
    color: rgba(71, 85, 105, 0.9);
  }

  .settings-section {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .section-title {
    color: #0f172a;
    font-size: 18px;
    font-weight: 500;
    margin: 12px 0 0 0;
  }

  .section-divider {
    height: 1px;
    background: rgba(148, 163, 184, 0.3);
  }

  /* 头像设置 */
  .avatar-section {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 25px;
    flex-wrap: wrap;
    width: 100%;
  }

  .avatar-preview-container {
    width: 100%;
    display: flex;
    justify-content: center;
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
    flex-direction: row;
    gap: 12px;
    flex: 1 1 100%;
    min-width: 0;
    justify-content: center;
    align-items: stretch;
  }

  .avatar-actions .file-input-wrapper,
  .avatar-actions .upload-btn {
    flex: 1;
    max-width: 140px;
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
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px;
    background: transparent;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.3s ease;
    min-height: 72px;
  }

  .file-input-label:hover {
    transform: scale(1.05);
  }

  .upload-btn {
    padding: 8px;
    background: transparent;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 72px;
    min-width: 72px;
  }

  .upload-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(33, 150, 243, 0.3);
  }

  .upload-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .mobile-avatar-action-icon {
    width: 88px;
    max-width: 100%;
    height: auto;
    display: block;
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
    color: rgba(51, 65, 85, 0.85);
    font-size: 14px;
  }

  .form-input,
  .form-textarea,
  .form-select {
    padding: 14px 20px;
    background: #f8fafc;
    border: 1px solid rgba(148, 163, 184, 0.35);
    border-radius: 12px;
    color: #0f172a;
    font-size: 14px;
    outline: none;
    transition: all 0.3s ease;
  }

  .form-input::placeholder,
  .form-textarea::placeholder {
    color: rgba(100, 116, 139, 0.85);
  }

  .form-input:focus,
  .form-textarea:focus,
  .form-select:focus {
    background: #ffffff;
    border-color: rgba(33, 150, 243, 0.5);
    box-shadow: 0 0 0 4px rgba(33, 150, 243, 0.12);
  }

  .form-textarea {
    resize: vertical;
    min-height: 100px;
  }

  .form-select {
    cursor: pointer;
  }

  .form-select option {
    background: #ffffff;
    color: #0f172a;
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

  .mobile-code-row {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .code-btn {
    padding: 12px 16px;
    border-radius: 10px;
    border: none;
    color: #fff;
    background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
    font-size: 13px;
    cursor: pointer;
  }

  .code-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .mobile-about-card {
    border: 1px solid rgba(148, 163, 184, 0.28);
    border-radius: 12px;
    padding: 14px;
    background: #f8fafc;
    color: #1f2937;
    line-height: 1.7;
  }

  .mobile-about-card p {
    margin: 0 0 10px 0;
  }

  .mobile-about-card p:last-child {
    margin-bottom: 0;
  }

  .success-text {
    color: #81c784;
    font-size: 13px;
    margin: 0;
  }

  .password-strength {
    margin: 6px 0 0 0;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.72);
  }

  .password-strength.weak {
    color: #ef9a9a;
  }

  .password-strength.medium {
    color: #ffd54f;
  }

  .password-strength.strong {
    color: #81c784;
  }

  .disclaimer-card-mobile {
    gap: 16px;
  }

  .language-section-mobile {
    border-bottom: 1px solid rgba(148, 163, 184, 0.28);
    padding-bottom: 14px;
    margin-bottom: 14px;
  }

  .language-section-mobile:last-child {
    border-bottom: none;
    padding-bottom: 0;
    margin-bottom: 0;
  }

  .language-section-mobile h4 {
    margin: 0 0 8px 0;
    font-size: 16px;
    color: #0f4c81;
  }

  .language-section-mobile p {
    margin: 0 0 8px 0;
    font-size: 13px;
    line-height: 1.75;
    color: #334155;
  }

  .language-section-mobile p:last-child {
    margin-bottom: 0;
    font-weight: 600;
    color: #1e293b;
  }

  .btn-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .pc-back-btn {
    position: absolute;
    top: 20px;
    left: 20px;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 10px;
    color: #fff;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.3s ease;
    z-index: 10;
  }

  .pc-back-btn:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateX(-3px);
  }

  .error-text {
    color: #f44336;
    font-size: 13px;
    margin: 0;
  }

  .security-container {
    display: flex;
    justify-content: center;
    padding: 20px;
  }

  .change-password-card {
    position: relative;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    width: 100%;
    overflow: hidden;
    transition: box-shadow 0.3s ease;
  }

  .change-password-card > .pc-back-btn {
    position: absolute;
    top: 20px;
    left: 20px;
    z-index: 10;
  }

  .change-password-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: url('@/assets/images/change-password.jpeg');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    opacity: 0.8;
    z-index: 0;
    box-shadow:
      inset 0 0 60px rgba(0, 0, 0, 0.4),
      inset 0 0 120px rgba(0, 0, 0, 0.25);
  }

  .change-password-card > * {
    position: relative;
    z-index: 1;
  }

  .change-password-card:hover {
    box-shadow: 0 15px 50px rgba(0, 0, 0, 0.3);
  }

  .card-content {
    max-width: 700px;
    margin: 40px auto;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    background: rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(10px);
    overflow: hidden;
  }

  .card-header {
    padding: 30px 40px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .card-header .section-title {
    color: #ffffff;
    font-size: 32px;
    font-weight: 700;
    margin: 0 0 12px 0;
    text-align: center;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  }

  .card-header .section-description {
    color: rgba(255, 255, 255, 0.9);
    font-size: 18px;
    margin: 0;
    text-align: center;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.4);
  }

  .card-body {
    padding: 50px 60px;
  }

  .card-body :deep(.el-form) {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .card-body :deep(.el-form-item) {
    width: 100%;
    max-width: 600px;
    justify-content: center;
  }

  .card-body :deep(.el-form-item__label) {
    text-align: right;
    font-size: 20px !important;
    font-weight: 700 !important;
    color: #ffffff !important;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  }

  .card-body :deep(.el-form-item__content) {
    flex: 0 1 auto;
  }

  .form-item {
    margin-bottom: 35px !important;
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
    margin-top: 50px;
  }

  .form-actions .error-text,
  .form-actions .success-text {
    text-align: center;
    width: 100%;
    font-size: 16px;
  }

  .change-password-card :deep(.el-input__wrapper) {
    background: rgba(255, 255, 255, 0.7) !important;
    border: 2px solid rgba(33, 150, 243, 0.6) !important;
    border-radius: 12px !important;
    transition: all 0.3s ease !important;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1) !important;
  }

  .change-password-card :deep(.el-input__wrapper:hover) {
    border-color: rgba(33, 150, 243, 0.8) !important;
    background: rgba(255, 255, 255, 0.8) !important;
    box-shadow: 0 4px 15px rgba(33, 150, 243, 0.2) !important;
  }

  .change-password-card :deep(.el-input__wrapper.is-focus) {
    border-color: rgba(33, 150, 243, 1) !important;
    background: rgba(255, 255, 255, 0.85) !important;
    box-shadow: 0 4px 20px rgba(33, 150, 243, 0.3) !important;
  }

  .change-password-card :deep(.el-input__input) {
    color: #1a237e !important;
    font-weight: 600 !important;
    font-size: 18px !important;
  }

  .change-password-card :deep(.el-input__placeholder) {
    color: rgba(26, 35, 126, 0.5) !important;
    font-size: 16px !important;
  }

  .change-password-card :deep(.el-button--primary) {
    background: linear-gradient(135deg, #2196f3, #1976d2) !important;
    border: none !important;
    border-radius: 12px !important;
    padding: 14px 28px !important;
    font-size: 18px !important;
    font-weight: 600 !important;
    transition: all 0.3s ease !important;
  }

  .change-password-card :deep(.el-button--primary:hover:not(:disabled)) {
    transform: translateY(-2px) !important;
    box-shadow: 0 6px 20px rgba(33, 150, 243, 0.4) !important;
  }

  .change-password-card :deep(.el-button--primary:disabled) {
    opacity: 0.6 !important;
  }

  .change-password-card :deep(.el-button) {
    border-radius: 12px !important;
    padding: 12px 24px !important;
    font-size: 16px !important;
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
  @media (max-width: 768px) {
    .security-container {
      padding: 20px 15px;
    }

    .change-password-card {
      margin: 0 10px;
    }

    .card-header {
      padding: 20px;
    }

    .card-header .section-title {
      font-size: 24px;
    }

    .card-body {
      padding: 20px;
    }

    .form-item {
      margin-bottom: 20px !important;
    }

    .code-input-wrapper {
      flex-direction: column;
      align-items: stretch;
      gap: 10px;
    }

    .code-input-wrapper .el-input {
      width: 100% !important;
    }

    .code-input-wrapper .el-button {
      margin-left: 0 !important;
      width: 100%;
    }

    .form-actions {
      margin-top: 30px;
    }

    .captcha-modal-content {
      padding: 30px 20px;
      margin: 0 15px;
    }

    .captcha-container {
      flex-direction: column;
      align-items: stretch;
    }

    .captcha-container .el-input {
      width: 100% !important;
    }

    .captcha-image {
      align-self: center;
      margin-top: 10px;
    }
  }

  @media (max-width: 480px) {
    .settings-card {
      padding: 20px;
    }

    .settings-title {
      font-size: 20px;
    }

    .avatar-section {
      flex-direction: column;
      align-items: center;
    }

    .avatar-actions {
      width: 100%;
      justify-content: center;
    }

    .form-row {
      flex-direction: column;
    }

    .mobile-settings-shell {
      flex-direction: column;
      gap: 16px;
    }

    .mobile-settings-nav {
      width: 100%;
      flex-direction: row;
      overflow-x: auto;
      position: relative;
      padding-bottom: 12px;
      margin-bottom: 8px;
    }

    .mobile-settings-nav::after {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      height: 0.5px;
      background: rgba(255, 255, 255, 0.2);
    }

    .mobile-tab-btn {
      min-width: 92px;
      white-space: nowrap;
    }

    .mobile-settings-panel {
      width: 100%;
    }

    .mobile-page-card {
      padding: 14px;
    }

    .mobile-password-card {
      width: 100%;
    }

    .language-section-mobile h4 {
      font-size: 15px;
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
      background-image: url('@/assets/images/profile-page.jpeg');
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      opacity: 0.8;
      border-radius: 12px;
      z-index: 0;
      box-shadow:
        inset 0 0 60px rgba(0, 0, 0, 0.3),
        inset 0 0 100px rgba(0, 0, 0, 0.2);
    }

    .form-with-background > * {
      position: relative;
      z-index: 1;
    }

    .form-with-background {
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      transition: box-shadow 0.3s ease;
    }

    .form-with-background:hover {
      box-shadow: 0 15px 50px rgba(0, 0, 0, 0.3);
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
      background: white;
    }
    .Setting-Card {
      align-items: center;
      justify-content: center;
      width: 80%;
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
    .form-with-background :deep(.el-form-item__label) {
      font-size: 24px !important;
      color: #ffffff !important;
      font-weight: 700 !important;
      text-shadow:
        2px 2px 4px rgba(0, 0, 0, 0.6),
        0 0 10px rgba(0, 0, 0, 0.4);
    }
    .form-with-background :deep(.el-input__wrapper) {
      background: rgba(255, 255, 255, 0.7) !important;
      border: 2px solid rgba(33, 150, 243, 0.6) !important;
      border-radius: 12px !important;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1) !important;
    }
    .form-with-background :deep(.el-input__wrapper:hover) {
      background: rgba(255, 255, 255, 0.8) !important;
      border-color: rgba(33, 150, 243, 0.8) !important;
      box-shadow: 0 4px 15px rgba(33, 150, 243, 0.2) !important;
    }
    .form-with-background :deep(.el-input__wrapper.is-focus) {
      background: rgba(255, 255, 255, 0.85) !important;
      border-color: rgba(33, 150, 243, 1) !important;
      box-shadow: 0 4px 20px rgba(33, 150, 243, 0.3) !important;
    }
    .form-with-background :deep(.el-input__inner),
    .form-with-background :deep(.el-textarea__inner) {
      font-size: 20px;
      padding: 16px 20px;
      color: #1a237e !important;
      font-weight: 600 !important;
      text-shadow: none;
    }
    .form-with-background :deep(.el-input__inner)::placeholder,
    .form-with-background :deep(.el-textarea__inner)::placeholder {
      font-size: 20px;
      color: rgba(26, 35, 126, 0.6) !important;
    }
    .form-with-background :deep(.el-select .el-input__wrapper) {
      background: rgba(255, 255, 255, 0.7) !important;
      border: 2px solid rgba(33, 150, 243, 0.6) !important;
    }
    .form-with-background :deep(.el-date-editor .el-input__wrapper) {
      background: rgba(255, 255, 255, 0.7) !important;
      border: 2px solid rgba(33, 150, 243, 0.6) !important;
    }
    .form-with-background :deep(.el-input__count) {
      background: transparent !important;
      color: #ffffff !important;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
    }
    .Settings-section {
      height: 80%;
    }
    .Section-title {
      color: #1976d2;
      font-size: 28px;
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
      margin-left: -10%;
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
      font-size: 60px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }
    .Avatar-preview img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .Avatar-action-left,
    .Avatar-action-right {
      flex-shrink: 0;
    }
    .Avatar-action-left {
      margin-right: 0px;
    }
    .el-form {
      margin-top: 20px !important;
    }
    .form-with-background .el-form-item {
      margin-bottom: 16px !important;
      margin-left: 60px;
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
      min-height: 56px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .File-input-label:hover {
      transform: scale(1.05);
    }
    .Upload-btn {
      padding: 8px;
      background: transparent;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 80px;
      min-width: 80px;
    }

    .Upload-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(33, 150, 243, 0.3);
    }

    .Upload-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* 关于我们和免责声明样式 */
    .about-container {
      padding: 30px;
      color: rgba(255, 255, 255, 0.8);
      position: relative;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      transition: box-shadow 0.3s ease;
    }

    .about-container > .pc-back-btn {
      position: absolute;
      top: 20px;
      left: 20px;
      z-index: 10;
    }

    .about-container:hover {
      box-shadow: 0 15px 50px rgba(0, 0, 0, 0.3);
    }

    .about-container::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: url('@/assets/images/about-us.png');
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      opacity: 0.6;
      z-index: 0;
      box-shadow:
        inset 0 0 60px rgba(0, 0, 0, 0.4),
        inset 0 0 120px rgba(0, 0, 0, 0.25);
    }

    .about-container > * {
      position: relative;
      z-index: 1;
    }

    .about-title {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 20px;
      color: #2196f3;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
      text-align: center;
    }

    .disclaimer-title {
      text-align: center;
    }

    .about-content {
      border-radius: 12px;
      padding: 20px;
      line-height: 1.8;
      margin-bottom: 40px;
      background: rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(5px);
    }

    .about-content p {
      font-size: 16px;
      font-weight: 600;
      color: #ffffff;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
    }

    .disclaimer-title {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 20px;
      color: #ff5252;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
    }

    .disclaimer-content {
      background: rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(8px);
      border-radius: 12px;
      padding: 30px;
      line-height: 1.8;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }

    .language-section {
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    }

    .language-section:last-child {
      margin-bottom: 0;
      padding-bottom: 0;
      border-bottom: none;
    }

    .language-section h4 {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 15px;
      color: #4fc3f7;
      text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.5);
    }

    .language-section p {
      margin-bottom: 12px;
      text-align: justify;
      font-weight: 600;
      font-size: 15px;
      color: #ffffff;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
    }

    .language-section p:last-child {
      margin-top: 20px;
      font-weight: 700;
      color: #f5f5f5;
    }
  }
</style>
