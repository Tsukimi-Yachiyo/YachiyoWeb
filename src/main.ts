import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import Message from './components/Message.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'aplayer/dist/APlayer.min.css'
import { systemAPI } from './services/api'
const app = createApp(App)
app.use(router)
app.use(ElementPlus)
app.component('Message', Message)

router.isReady().then(async () => {
  try {
    await systemAPI.testBackendStatus()
  } catch (error: unknown) {
    console.error('后端状态检测失败，跳转维护页:', error)
    if (router.currentRoute.value.path !== '/maintenance') {
      await router.replace('/maintenance')
    }
  } finally {
    app.mount('#app')
    const loadingEl = document.getElementById('app-loading')
    if (loadingEl) {
      loadingEl.classList.add('hidden')
      setTimeout(() => loadingEl.remove(), 300)
    }
  }
})
