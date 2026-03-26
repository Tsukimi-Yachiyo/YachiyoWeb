# web

基于 Vue 3 + Vite 的前端项目。

## 环境要求

- Node.js: `^20.19.0 || >=22.12.0`
- npm: 建议使用最新版

## 安装依赖

```sh
npm install
```

## 常用命令

### 开发模式

```sh
npm run dev
```

执行顺序如下：

1. `npm run format`（先自动格式化）
2. `npm run lint:fix`（再自动修复可修复的 ESLint 问题）
3. `vite`（启动开发服务器）

### 构建生产包

```sh
npm run build
```

执行顺序如下：

1. `npm run lint`（先做 ESLint 检查）
2. `npm run format:check`（再做 Prettier 格式校验）
3. `vite build`（通过后再构建）

### 本地预览构建结果

```sh
npm run preview
```

### 单独运行检查/修复

```sh
npm run lint
npm run lint:fix
npm run format
npm run format:check
```

## 推荐开发工具

- IDE: [VS Code](https://code.visualstudio.com/)
- Vue 扩展: [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar)

## 参考文档

- [Vite 官方文档](https://vite.dev/config/)
