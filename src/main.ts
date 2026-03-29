import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import Message from './components/Message.vue'

createApp(App).use(router).component('Message', Message).mount('#app')
