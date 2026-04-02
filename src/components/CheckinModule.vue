<script>
  import { coinAPI } from '../services/api'

  export default {
    name: 'CheckinModule',
    emits: ['checkin-complete'],
    data() {
      return {
        checkinStatus: false,
        rewardAmount: 0,
        isLoading: false,
        errorMessage: '',
        successMessage: '',
        selectedMood: '',
        moods: [
          { value: 'happy', label: '开心', emoji: '😊' },
          { value: 'excited', label: '兴奋', emoji: '🤗' },
          { value: 'calm', label: '平静', emoji: '😌' },
          { value: 'tired', label: '疲惫', emoji: '😴' },
          { value: 'sad', label: '难过', emoji: '😢' },
          { value: 'angry', label: '生气', emoji: '😠' }
        ]
      }
    },
    mounted() {
      this.checkCheckinStatus()
    },
    methods: {
      async handleCheckin() {
        if (this.isLoading) return

        this.isLoading = true
        this.errorMessage = ''

        try {
          const response = await coinAPI.sign()

          if (response.success) {
            this.checkinStatus = true
            this.rewardAmount = 10 // 默认奖励10金币，实际应从接口返回
            this.$emit('checkin-complete')
          } else {
            this.errorMessage = response.message || '签到失败'
          }
        } catch (error) {
          this.errorMessage = error.message || '网络错误，请稍后重试'
        } finally {
          this.isLoading = false
        }
      },
      async checkCheckinStatus() {
        // 这里应该调用获取签到状态的接口
        // 暂时模拟已签到状态
        this.checkinStatus = false
      },
      selectMood(mood) {
        this.selectedMood = mood
      },
      saveMood() {
        if (!this.selectedMood) return

        // 这里应该调用保存心情的接口
        // 暂时模拟保存成功
        this.successMessage = '心情保存成功！'
        setTimeout(() => {
          this.successMessage = ''
        }, 2000)
      }
    },
  }
</script>

<template>
  <div class="checkin-module">
    <h3>每日签到</h3>
    <div v-if="checkinStatus" class="checkin-status">
      <div class="status-icon success">✓</div>
      <p class="status-text">今日已签到</p>
      <p class="reward-text">获得 {{ rewardAmount }} 金币</p>
    </div>
    <div v-else class="checkin-button-container">
      <button class="checkin-button" :disabled="isLoading" @click="handleCheckin">
        <span v-if="!isLoading">立即签到</span>
        <span v-else>签到中...</span>
      </button>
      <p class="hint-text">每日签到可获得金币奖励</p>
    </div>
    <div v-if="checkinStatus" class="mood-section">
      <h4>今日心情</h4>
      <div class="mood-selector">
        <button 
          v-for="mood in moods" 
          :key="mood.value"
          class="mood-button"
          :class="{ active: selectedMood === mood.value }"
          @click="selectMood(mood.value)"
        >
          {{ mood.emoji }} {{ mood.label }}
        </button>
      </div>
      <button class="save-mood-button" @click="saveMood" :disabled="!selectedMood">
        保存心情
      </button>
    </div>
    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>
    <div v-if="successMessage" class="success-message">
      {{ successMessage }}
    </div>
  </div>
</template>

<style scoped>
  .checkin-module {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  h3 {
    margin-top: 0;
    color: #333;
    font-size: 18px;
    margin-bottom: 16px;
  }

  .checkin-status {
    text-align: center;
    padding: 20px;
    background: #e8f5e8;
    border-radius: 6px;
    margin-bottom: 16px;
  }

  .status-icon {
    font-size: 48px;
    color: #4caf50;
    margin-bottom: 12px;
  }

  .status-text {
    font-size: 16px;
    font-weight: bold;
    color: #333;
    margin: 0 0 8px 0;
  }

  .reward-text {
    font-size: 14px;
    color: #666;
    margin: 0;
  }

  .checkin-button-container {
    text-align: center;
    margin-bottom: 16px;
  }

  .checkin-button {
    background: #4caf50;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 4px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    transition: background-color 0.3s;
  }

  .checkin-button:hover {
    background: #45a049;
  }

  .checkin-button:disabled {
    background: #cccccc;
    cursor: not-allowed;
  }

  .hint-text {
    font-size: 12px;
    color: #666;
    margin-top: 8px;
  }

  .mood-section {
    margin-top: 20px;
  }

  h4 {
    font-size: 14px;
    color: #666;
    margin-bottom: 12px;
  }

  .mood-selector {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-bottom: 16px;
  }

  .mood-button {
    background: #ffffff;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    padding: 8px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s;
  }

  .mood-button:hover {
    background: #f0f0f0;
  }

  .mood-button.active {
    background: #e3f2fd;
    border-color: #2196f3;
  }

  .save-mood-button {
    background: #2196f3;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    transition: background-color 0.3s;
  }

  .save-mood-button:hover {
    background: #1976d2;
  }

  .save-mood-button:disabled {
    background: #cccccc;
    cursor: not-allowed;
  }

  .error-message {
    color: #f44336;
    font-size: 14px;
    margin-top: 12px;
    text-align: center;
  }

  .success-message {
    color: #4caf50;
    font-size: 14px;
    margin-top: 12px;
    text-align: center;
  }
</style>
