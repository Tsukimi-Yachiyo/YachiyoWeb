import { fileURLToPath, URL } from 'node:url'
import path from 'path'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    tailwindcss(),
],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@framework': path.resolve(__dirname, './public/Framework/src'),
      '@demo': path.resolve(__dirname, './src/live2d-demo')
    },
  },
  optimizeDeps: {
    exclude: ['@framework']
  },

  // 开发服务器配置
  server: {
    // 允许访问的主机列表（关键配置）
    allowedHosts: [
      // 1. 添加报错的 ngrok 域名
      "adamantly-unappalled-bertie.ngrok-free.dev",
      "yachiyo.fucku.top",
      // 2. 可选：允许所有 ngrok-free.dev 子域名（避免每次 ngrok 换域名都要改）
      ".ngrok-free.dev",
      'www.tsukimi-yachiyo.top', // 你需要允许的域名
      'tsukimi-yachiyo.top' , // 建议同时添加不带 www 的主域名，避免遗漏
      'yachiyo.owo.vin', // 你需要允许的域名
      "www.yachiyo.owo.vin",
      // 3. 保留默认的本地主机（可选，Vite 会自动包含）
      "localhost",
      "127.0.0.1"
    ],
    // 可选：如果需要通过 IP 访问，开启以下配置
    host: "0.0.0.0",
    // 可选：端口（根据你的项目调整）
    port: 5173,
    // 配置代理，解决CORS问题
    proxy: {
      '/api': {
        target: 'http://47.98.229.211:8080',
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api/, '/api')
      },
      '/file': {
        target: 'http://47.98.229.211:8080',
        changeOrigin: true,
        rewrite: (path) => path
      }
    }
  },
  // 打包配置（保留你原有的配置，比如 base）
  base: './'
})
