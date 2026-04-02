import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import Message from './components/Message.vue'

const app = createApp(App)
app.use(router)
app.component('Message', Message)

router.isReady().then(() => {
  app.mount('#app')
  const loadingEl = document.getElementById('app-loading')
  if (loadingEl) {
    loadingEl.classList.add('hidden')
    setTimeout(() => loadingEl.remove(), 300)
  }
})
