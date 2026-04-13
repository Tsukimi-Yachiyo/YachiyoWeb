# 放映室页面实现计划

## 1. 项目调研结论

项目基于以下技术栈构建：
- **Vue 3 + TypeScript**：使用 Composition API (`<script setup>`)
- **Vue Router 5**：路由管理
- **TailwindCSS 4**：样式框架
- **Element Plus**：UI组件库
- **Vite**：构建工具

现有页面风格：深色主题、渐变按钮、波浪动画效果、响应式设计。

## 2. 需要编辑/创建的文件

### 创建文件
1. `src/pages/Player/Player.vue` - 放映室主页面组件
2. `src/components/VideoPlayer/VideoPlayer.vue` - 视频播放器组件（含弹幕）

### 修改文件
1. `src/router/index.ts` - 添加 `/player` 路由配置
2. `src/components/AppHeader.vue` - 添加切换到放映室的按钮（可选）

## 3. 实现步骤

### 步骤1：安装必要依赖
- `flv.js` - 用于FLV格式播放
- `artplayer` 或自定义播放器控件（可选）

### 步骤2：创建视频播放器组件
- 使用 HTML5 Video API 作为基础
- 支持本地文件上传和播放
- 实现播放器控制条（播放/暂停、进度条、音量、全屏等）
- 实现弹幕系统（弹幕输入、弹幕显示、弹幕样式）

### 步骤3：创建放映室主页面
- 参考B站视频页面布局
- 左侧：视频播放器区域
- 右侧/下方：视频信息、弹幕列表、推荐视频等
- 上传区域：支持选择本地视频文件
- 使用 AppHeader 组件保持一致的导航

### 步骤4：配置路由
- 在 `router/index.ts` 中添加 `/player` 路由
- 设置需要登录认证

### 步骤5：更新导航（可选）
- 在 AppHeader 中添加放映室切换按钮

## 4. 技术方案

### 视频播放支持
- **原生支持格式**：MP4, WebM, OGG（通过 HTML5 Video）
- **FLV格式**：使用 `flv.js` 解码播放
- **其他格式**（MKV, MOV, WMV, AVI）：提示用户转码或使用支持更多格式的方案（如使用 ffmpeg.wasm 进行客户端转码）

### 弹幕系统
- 弹幕数据结构：`{ id, text, color, time, type(top/bottom/scroll) }`
- 使用 CSS 动画实现弹幕滚动
- 支持弹幕开关、透明度调节、速度调节

### UI设计
- 深色主题（与项目一致）
- 视频播放器居中显示
- 底部控制栏（类似B站）
- 右侧弹幕输入区
- 使用项目现有图标和渐变色

## 5. 风险与注意事项

### 视频格式兼容性
- 风险：浏览器原生支持的视频格式有限
- 应对：优先支持 MP4，FLV 使用 flv.js，其他格式提供提示或使用客户端转码方案

### 性能考虑
- 大量弹幕可能影响性能
- 应对：实现弹幕池、限制同时显示的弹幕数量

### 文件大小
- 大文件上传可能影响体验
- 应对：使用 File API 本地读取，不上传到服务器

## 6. 文件清单

### 新建
- `src/pages/Player/Player.vue`
- `src/components/VideoPlayer/VideoPlayer.vue`

### 修改
- `src/router/index.ts`
- `src/components/AppHeader.vue`（可选）
- `package.json`（添加依赖）
