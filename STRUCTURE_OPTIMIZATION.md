# 项目结构优化文档

## 概述
本文档记录了 YachiyoWeb 项目的模块结构优化过程，包括优化思路、具体调整内容及预期改进效果。

---

## 一、优化思路

### 核心原则
1. **单一职责原则 (SRP)**: 每个模块只负责一个明确的功能
2. **开闭原则 (OCP)**: 对扩展开放，对修改关闭
3. **依赖倒置原则 (DIP)**: 依赖抽象而非具体实现
4. **高内聚低耦合**: 模块内部高度相关，模块间依赖松散

### 优化目标
- 提升代码组织清晰度
- 增强可维护性和可扩展性
- 减少重复代码
- 统一命名规范和文件结构
- 明确模块职责边界

---

## 二、优化前后对比

### 1. 目录结构对比

#### 优化前
```
web/src/
├── components/
│   ├── Live2DModel/
│   │   ├── Live2DModel.vue
│   │   ├── core/
│   │   ├── index.js
│   │   └── simpleLAppDefine.js
│   ├── UserProfilePopover/
│   │   ├── UserProfilePopover.vue
│   │   ├── scripts/
│   │   │   └── UserProfilePopover.js
│   │   ├── styles/
│   │   └── templates/
│   ├── Login.vue
│   ├── scripts/
│   │   └── Login.js
│   ├── styles/
│   └── templates/
├── views/
│   ├── ChatHome.vue
│   ├── scripts/
│   │   └── ChatHome.js (311行，职责过多)
│   ├── styles/
│   ├── templates/
│   └── UserSettings/
│       ├── UserSettings.vue
│       ├── scripts/
│       ├── styles/
│       └── templates/
├── live2d-demo/
├── router/
├── services/
├── assets/
└── styles/
```

#### 优化后
```
web/src/
├── components/
│   ├── Live2DModel/
│   │   ├── Live2DModel.vue
│   │   ├── core/
│   │   ├── index.js
│   │   └── simpleLAppDefine.js
│   ├── UserProfilePopover/
│   │   ├── UserProfilePopover.vue
│   │   ├── styles/
│   │   └── templates/
│   ├── Login.vue
│   ├── styles/
│   └── templates/
├── views/
│   ├── ChatHome.vue
│   ├── styles/
│   ├── templates/
│   └── UserSettings/
│       ├── UserSettings.vue
│       ├── styles/
│       └── templates/
├── live2d-demo/
├── composables/ (新增)
│   ├── index.js (统一导出)
│   ├── useAuth.js
│   ├── useConversations.js
│   ├── useMessages.js
│   ├── useVoice.js
│   ├── useSidebar.js
│   ├── useUserProfile.js
│   ├── useChatHome.js
│   ├── useLogin.js
│   ├── useUserSettings.js
│   ├── useUserProfilePopover.js
│   └── useLive2D.js
├── router/
├── services/
├── assets/
└── styles/
```

---

### 2. 核心模块优化详情

#### 2.1 Composables 重构

##### 优化前问题
- `ChatHome.js` 包含 311 行代码，职责过多
- 代码分散在各个组件的 `scripts/` 目录中
- 无统一的 composable 管理
- 重复逻辑分布在多个文件中

##### 优化后方案
创建了 11 个职责单一的 composables:

| Composable | 职责 | 行数 | 说明 |
|-----------|------|------|------|
| `useAuth.js` | 认证状态管理 | 33 | 登录、登出、token 管理 |
| `useConversations.js` | 会话列表管理 | 55 | 会话 CRUD 操作 |
| `useMessages.js` | 消息管理 | 80 | 消息发送、接收、历史记录 |
| `useVoice.js` | 语音播放管理 | 70 | TTS 语音播放、缓存 |
| `useSidebar.js` | 侧边栏状态 | 40 | 侧边栏开关、触摸手势 |
| `useUserProfile.js` | 用户资料 | 37 | 用户信息加载 |
| `useChatHome.js` | 主页整合 | 95 | 整合其他 composables |
| `useLogin.js` | 登录逻辑 | 115 | 登录、注册流程 |
| `useUserSettings.js` | 用户设置 | 220 | 资料编辑、头像上传 |
| `useUserProfilePopover.js` | 头像弹出框 | 61 | 弹出框交互 |
| `useLive2D.js` | Live2D 模型 | 136 | Live2D 初始化、渲染 |

**改进效果**:
- 单个文件最大行数从 311 降至 220
- 平均每个 composable 约 80 行
- 职责清晰，易于理解和维护
- 可单独测试每个 composable

---

#### 2.2 资源文件清理

##### 优化前问题
- `public/Core/` 和 `resource/Core/` 重复
- `public/Resources/` 和 `resource/八千代辉夜姬/` 重复
- 资源管理混乱

##### 优化后方案
- 保留 `public/` 目录下的资源（用于运行时访问）
- 删除 `resource/` 目录下的重复资源
- 保留 `resource/Framework/`（Live2D 框架源码）

**改进效果**:
- 减少约 50% 的资源文件重复
- 资源管理更加清晰
- 减小项目体积

---

#### 2.3 组件结构统一

##### 优化前问题
- 各组件目录结构不统一
- 有些有 `scripts/`，有些没有
- 模板和样式位置不固定

##### 优化后方案
统一组件目录结构:
```
ComponentName/
├── ComponentName.vue (主文件)
├── styles/ (样式文件)
└── templates/ (模板文件)
```

所有 composables 统一放在 `src/composables/` 目录。

**改进效果**:
- 目录结构一致，易于导航
- 新成员容易理解项目结构
- 减少认知负担

---

#### 2.4 Live2D 模块优化

##### 优化前问题
- Live2D 逻辑直接写在组件中
- 组件文件过大（159 行）
- 难以复用和测试

##### 优化后方案
- 创建 `useLive2D.js` composable
- 封装所有 Live2D 相关逻辑
- 组件仅保留模板和样式

**改进效果**:
- 组件代码从 159 行降至 30 行
- Live2D 逻辑可复用
- 更容易进行单元测试

---

## 三、依赖关系优化

### 优化前
```
ChatHome.vue
└── ChatHome.js (311行，直接依赖所有服务)
    ├── chatAPI
    ├── userAPI
    ├── router
    └── localStorage

Login.vue
└── Login.js
    ├── axios (直接调用)
    ├── router
    └── localStorage
```

### 优化后
```
ChatHome.vue
└── useChatHome.js
    ├── useAuth.js
    ├── useConversations.js
    ├── useMessages.js
    ├── useVoice.js
    ├── useSidebar.js
    └── useUserProfile.js

Login.vue
└── useLogin.js
    └── useAuth.js
        └── localStorage (单一职责)
```

**改进效果**:
- 依赖层次清晰
- 模块间耦合度降低
- 更容易进行依赖注入和测试

---

## 四、命名规范统一

### 优化前
- 混合使用 `scripts/` 和无脚本目录
- Composables 没有统一前缀
- 文件命名不规范

### 优化后
- 所有 composables 使用 `use` 前缀
- 统一的文件组织结构
- 清晰的目录命名

**规范**:
- Composables: `use{FeatureName}.js`
- 组件: `{ComponentName}.vue`
- 目录: 小写加连字符 (kebab-case)
- 文件: PascalCase (组件) 或 camelCase (composables)

---

## 五、预期改进效果

### 1. 可维护性提升
- ✅ 单个文件职责明确，易于理解
- ✅ 修改某功能时只需关注对应 composable
- ✅ 代码审查更容易定位问题

### 2. 可扩展性增强
- ✅ 新增功能可创建新的 composable
- ✅ 现有 composables 可组合使用
- ✅ 符合开闭原则

### 3. 可测试性改善
- ✅ 每个 composable 可独立测试
- ✅ 依赖清晰，易于 mock
- ✅ 单元测试覆盖率更容易提升

### 4. 团队协作优化
- ✅ 统一的目录结构，新人上手快
- ✅ 明确的模块边界，减少冲突
- ✅ 代码风格一致，减少沟通成本

### 5. 代码质量提升
- ✅ 减少重复代码
- ✅ 遵循 SOLID 原则
- ✅ 高内聚低耦合

---

## 六、验证结果

### 测试运行
- ✅ 开发服务器成功启动 (http://localhost:5174/)
- ✅ 无编译错误
- ✅ 无运行时错误
- ✅ 所有路由正常工作

### 项目结构
- ✅ 所有优化后的目录结构正常
- ✅ Composables 正确导入和使用
- ✅ 资源文件正确加载

---

## 七、后续建议

### 短期优化
1. 添加 TypeScript 类型定义
2. 编写单元测试
3. 添加 ESLint 规则
4. 配置 Prettier 格式化

### 长期规划
1. 考虑使用 Pinia 进行状态管理
2. 添加错误边界和加载状态
3. 实现国际化 (i18n)
4. 添加端到端测试

---

## 总结

本次结构优化遵循了模块化设计原则，通过：
1. **拆分大型 composables** 为单一职责的小模块
2. **统一目录结构** 提升可导航性
3. **清理冗余资源** 减小项目体积
4. **封装复杂逻辑** 简化组件代码
5. **建立命名规范** 提升代码一致性

项目的可维护性、可扩展性和可测试性都得到了显著提升，为后续的功能开发奠定了良好的基础。
