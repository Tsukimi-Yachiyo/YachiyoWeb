# YachiyoChat

## 项目简介

YachiyoChat 是一个基于 Vue 3 开发的智能聊天应用，集成了 Live2D 模型展示，为用户提供沉浸式的聊天体验。

![YachiyoChat](https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=A%20modern%20chat%20application%20interface%20with%20a%20Live2D%20anime%20character%20on%20the%20right%20side%2C%20clean%20UI%2C%20dark%20theme%2C%20professional%20design&image_size=landscape_16_9)

## 功能特性

- 🎨 **Live2D 模型展示**：集成 Live2D Cubism SDK，展示交互式 2D 模型
- 💬 **智能聊天**：支持多会话管理，实时消息交互
- 🔊 **语音播放**：支持消息语音朗读功能
- 🔐 **用户认证**：安全的用户名密码登录系统
- 📱 **响应式设计**：适配不同设备屏幕
- 🌙 **现代界面**：简洁美观的用户界面

## 技术栈

- **前端框架**：Vue 3
- **路由管理**：Vue Router
- **HTTP 客户端**：Axios
- **构建工具**：Vite
- **Live2D 引擎**：Live2D Cubism SDK
- **开发语言**：JavaScript

## 快速开始

### 环境要求

- Node.js >= 20.19.0 或 >= 22.12.0
- npm

### 安装

```bash
# 克隆项目
git clone https://github.com/yourusername/YachiyoChat.git

# 进入项目目录
cd YachiyoChat/web

# 安装依赖
npm install
```

### 开发模式

```bash
npm run dev
```

### 生产构建

```bash
npm run build
```

## 项目结构

```
web/
├── public/              # 静态资源
│   ├── Core/           # Live2D Cubism Core
│   ├── Framework/      # Live2D Cubism Framework
│   └── resource/       # 模型资源和视频
├── src/                # 源代码
│   ├── assets/         # 静态资源
│   ├── components/     # 组件
│   │   ├── Live2DModel/      # Live2D 模型组件
│   │   └── UserProfilePopover/ # 用户资料弹窗
│   ├── composables/    # 组合式函数
│   ├── pages/          # 页面组件
│   │   ├── ChatHome/   # 聊天主页
│   │   ├── Login/      # 登录页面
│   │   └── UserSettings/ # 用户设置页面
│   ├── router/         # 路由配置
│   ├── services/       # API 服务
│   ├── styles/         # 样式文件
│   ├── templates/      # HTML 模板
│   ├── App.vue         # 应用根组件
│   └── main.js         # 应用入口
├── index.html          # HTML 入口
├── package.json        # 项目配置
└── vite.config.js      # Vite 配置
```

## 核心功能

### 登录系统
- 用户名密码登录
- 登录状态管理
- 路由守卫保护

### 聊天功能
- 多会话管理
- 实时消息交互
- 消息语音播放
- 打字动画效果

### Live2D 模型
- 交互式 2D 模型展示
- 模型资源管理
- 动画效果

## 网站地址

[http://yachiyo.owo.vin/](http://yachiyo.owo.vin/)

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目！

## 鸣谢

- [Vue 3](https://vuejs.org/)
- [Live2D Cubism SDK](https://www.live2d.com/en/)
- [Vite](https://vitejs.dev/)

---

**月见八千代，随时为您服务！** 🎉