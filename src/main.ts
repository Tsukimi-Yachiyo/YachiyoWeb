import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import Message from './components/Message.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

createApp(App).use(router).component('Message', Message).use(ElementPlus).mount('#app')
