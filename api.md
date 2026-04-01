# YachiyoService 后端 API 文档

## 目录

- [快速开始](#快速开始)
- [概述](#概述)
- [安全认证](#安全认证)
- [统一响应格式](#统一响应格式)
- [API 接口详情](#api-接口详情)
  - [认证模块 (Auth)](#1-认证模块-auth)
  - [AI 聊天模块 (AI Chat)](#2-ai-聊天模块-ai-chat)
  - [AI 工具模块 (AI Tools)](#3-ai-工具模块-ai-tools)
  - [历史模块 (History)](#4-历史模块-history)
  - [帖子模块 (Posting)](#5-帖子模块-posting)
  - [帖子搜索模块 (Posting Search)](#6-帖子搜索模块-posting-search)
  - [评论模块 (Comment)](#7-评论模块-comment)
  - [用户详情模块 (User Detail)](#8-用户详情模块-user-detail)
  - [文件模块 (File)](#9-文件模块-file)
  - [邮件模块 (Mail)](#10-邮件模块-mail)
  - [金币模块 (Coin)](#11-金币模块-coin)
  - [商品模块 (Goods)](#12-商品模块-goods)
  - [管理员模块 (Admin)](#13-管理员模块-admin)
  - [测试模块 (Test)](#14-测试模块-test)

***

## 快速开始

### 1. 用户注册与登录

```bash
# 1. 发送验证码
POST http://211.101.237.141:8080/api/v1/auth/send-code
Content-Type: application/json

"your_email@example.com"

# 2. 注册账号
POST http://211.101.237.141:8080/api/v1/auth/register
Content-Type: application/json

{
  "username": "newuser",
  "password": "your_password",
  "email": "your_email@example.com",
  "code": "123456"
}

# 3. 登录获取 Token
POST http://211.101.237.141:8080/api/v1/auth/login
Content-Type: application/json

{
  "username": "newuser",
  "password": "your_password"
}

# 响应示例：
{
  "code": "200",
  "message": "登录成功",
  "data": "eyJhbGciOiJIUzI1NiJ9..."
}
```

### 2. 使用 AI 聊天功能

```bash
# 1. 创建会话
POST http://211.101.237.141:8080/api/v2/ai/create
Authorization: Bearer YOUR_JWT_TOKEN

# 响应：返回会话 ID
{
  "code": "200",
  "message": "success",
  "data": "1234567890"
}

# 2. 发送消息
POST http://211.101.237.141:8080/api/v2/ai/chat
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "message": "你好，八千代！",
  "conversationId": "1234567890"
}
```

### 3. 发布帖子

```bash
POST http://211.101.237.141:8080/api/v2/posting/upload
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: multipart/form-data

title: 我的第一篇帖子
content: 这是帖子的内容...
type: text
coverImage: [文件]
files: [文件 1, 文件 2]
```

### 4. 文件访问

```bash
# 文件 URL 格式（需要签名，所有参数都是查询参数）
# fileName 需要 URL 编码（UTF-8）
# expire 是 Unix 时间戳（秒）
# sign 由服务端使用 MD5 生成

GET http://211.101.237.141:8080/file/generate?fileName=1%2Favatar.jpg&expire=1711500000&sign=abc123...

# 注意：签名需要后端生成，前端直接使用后端返回的完整 URL
```

***

## 概述

本文档描述了 YachiyoService 后端服务的所有 RESTful API 接口。

**服务地址**: `http://211.101.237.141:8080`

**API 版本**: v1, v2, v3

**主要功能模块**:

- 用户认证与授权（JWT）
- AI 聊天（支持流式响应）
- 语音合成（TTS）
- Live2D 模型控制
- 帖子管理（发布、点赞、收藏）
- 评论系统
- 用户详情管理
- 文件上传与访问
- RAG 资源管理（管理员）

***

## 安全认证

### 认证机制

项目使用 **JWT (JSON Web Token)** 进行身份验证。

#### 请求头要求

需要在 HTTP 请求头中携带 JWT 令牌：

```
Authorization: Bearer <your_jwt_token>
```

**JWT Token 说明**：

- **有效期**: 3600000 毫秒（1 小时）
- **签名算法**: HS256
- **包含信息**:
  - `userID`: 用户 ID
  - `name`: 用户名
  - `sub`: 唯一标识（subject）

#### 免认证接口

以下接口无需认证即可访问：

- `/api/v1/auth/login` - 用户登录
- `/api/v1/auth/register` - 用户注册
- `/api/v1/auth/send-code` - 发送验证码
- `/api/v1/auth/refresh-token` - 刷新令牌
- `/api/v1/auth/login-by-email` - 邮箱登录
- `/api/v3/**` - 所有 v3 版本接口（测试接口）
- `/file/**` - 文件访问接口
- `/api/yachiyo/168/mini/admin/login` - 管理员登录

#### 认证级别

- **USER 角色**: 需要访问 `/api/v2/**` 下的所有接口
- **AUTHENTICATED**: 其他所有需要认证的接口（已登录用户即可访问）
- **PERMIT\_ALL**: 无需认证即可访问的接口（登录、注册、发送验证码、刷新令牌、邮箱登录、文件访问、测试接口、管理员登录）

#### 认证流程

1. 用户调用 `/api/v1/auth/login` 接口登录
2. 服务器验证成功后返回 JWT Token
3. 客户端在后续请求的 Header 中携带该 Token
4. 服务器通过 JwtFilter 验证 Token 有效性
5. 验证通过后设置用户上下文信息
6. 服务器在每次请求时自动更新 JWT Token，并在响应头中返回新的 Token（Token 自动刷新机制）
7. 客户端可定期使用 `/api/v1/auth/refresh-token` 接口主动刷新 Token
8. 用户也可通过 `/api/v1/auth/login-by-email` 使用邮箱和验证码登录

**Token 自动刷新说明**：

- 每次请求通过 JwtFilter 时，服务器会检查 Token 有效性
- 如果 Token 有效，服务器会生成新的 Token 并设置在响应头中（Header 名称由 JwtUtils 配置）
- 客户端应检查响应头并更新本地存储的 Token
- 自动刷新可延长会话有效期，无需用户重新登录

***

## 统一响应格式

所有接口返回统一使用 `Result<T>` 格式：

```json
{
  "code": "200",
  "message": "success",
  "data": {},
  "detail": null
}
```

**字段说明**：

| 字段      | 类型     | 说明                     | 示例        |
| ------- | ------ | ---------------------- | --------- |
| code    | String | 状态码（200 表示成功，500 表示错误） | "200"     |
| message | String | 响应消息                   | "success" |
| data    | T      | 响应数据（泛型，根据接口不同而不同）     | 任意类型      |
| detail  | String | 详细信息（可选，通常用于调试）        | null      |

**成功响应示例**：

```json
{
  "code": "200",
  "message": "登录成功",
  "data": "eyJhbGciOiJIUzI1NiJ9...",
  "detail": null
}
```

**错误响应示例**：

```json
{
  "code": "500",
  "message": "用户名或密码错误",
  "data": null,
  "detail": "认证失败：无效的凭证"
}
```

***

## API 接口详情

### 1. 认证模块 (Auth)

**基础路径**: `/api/v1/auth`

#### 1.1 用户登录

**接口**: `POST /api/v1/auth/login`

**认证**: ❌ 不需要

**请求体** (`LoginRequest`):

```JSON
{
  "username": "string",
  "password": "string"
}
```

**请求参数说明**：

| 字段       | 类型     | 必填 | 说明      |
| -------- | ------ | -- | ------- |
| username | String | 是  | 用户名或手机号 |
| password | String | 是  | 密码      |

**响应体** (`Result<String>`):

```json
{
  "code": "200",
  "message": "登录成功",
  "data": "jwt_token_string",
  "detail": null
}
```

***

#### 1.2 用户注册

**接口**: `POST /api/v1/auth/register`

**认证**: ❌ 不需要

**请求体** (`RegisterRequest`):

```json
{
  "username": "string",
  "password": "string",
  "email": "string",
  "code": "string"
}
```

**请求参数说明**：

| 字段       | 类型     | 必填 | 说明  |
| -------- | ------ | -- | --- |
| username | String | 是  | 用户名 |
| password | String | 是  | 密码  |
| email    | String | 是  | 邮箱  |
| code     | String | 是  | 验证码 |

**响应体** (`Result<String>`):

```json
{
  "code": "200",
  "message": "注册成功",
  "data": "注册成功消息",
  "detail": null
}
```

***

#### 1.3 发送验证码

**接口**: `POST /api/v1/auth/send-code`

**认证**: ❌ 不需要

**请求体**: `String` (邮箱地址)

```
"example@qq.com"
```

**请求参数说明**：

| 参数    | 类型     | 必填 | 说明   |
| ----- | ------ | -- | ---- |
| email | String | 是  | 邮箱地址 |

**响应体** (`Result<Boolean>`):

```json
{
  "code": "200",
  "message": "验证码发送成功",
  "data": true,
  "detail": null
}
```

***

#### 1.4 更改密码

**接口**: `POST /api/v1/auth/change-password`

**认证**: ❌ 不需要（需要验证码）

**请求体** (`RegisterRequest`):

```json
{
  "username": "string",
  "password": "string",
  "email": "string",
  "code": "string"
}
```

**请求参数说明**：

| 字段       | 类型     | 必填 | 说明  |
| -------- | ------ | -- | --- |
| username | String | 是  | 用户名 |
| password | String | 是  | 新密码 |
| email    | String | 是  | 邮箱  |
| code     | String | 是  | 验证码 |

**响应体** (`Result<Boolean>`):

```json
{
  "code": "200",
  "message": "密码更改成功",
  "data": true,
  "detail": null
}
```

***

#### 1.5 退出登录

**接口**: `POST /api/v1/auth/logout`

**认证**: ✅ 需要（需要有效JWT令牌）

**请求体**: 无

**响应体** (`Result<Boolean>`):

```json
{
  "code": "200",
  "message": "退出登录成功",
  "data": true,
  "detail": null
}
```

***

#### 1.6 邮箱登录

**接口**: `POST /api/v1/auth/login-by-email`

**认证**: ❌ 不需要

**请求体** (`MailLoginRequest`):

```json
{
  "email": "string",
  "code": "string",
}
```

**请求参数说明**：

| 字段    | 类型     | 必填 | 说明   |
| ----- | ------ | -- | ---- |
| email | String | 是  | 邮箱地址 |
| code  | String | 是  | 验证码  |

**响应体** (`Result<String>`):

```json
{
  "code": "200",
  "message": "登录成功",
  "data": "jwt_token_string",
  "detail": null
}
```

***

#### 1.7 刷新令牌

**接口**: `POST /api/v1/auth/refresh-token`

**认证**: ❌ 不需要（但需要提供refreshToken和userId）

**请求参数**:

| 参数           | 类型     | 必填 | 说明   |
| ------------ | ------ | -- | ---- |
| refreshToken | String | 是  | 刷新令牌 |
| userId       | Long   | 是  | 用户ID |

**响应体** (`Result<String>`):

```json
{
  "code": "200",
  "message": "令牌刷新成功",
  "data": "新的_jwt_token_string",
  "detail": null
}
```

***

### 2. AI 聊天模块 (AI Chat)

**基础路径**: `/api/v2/ai`

**认证**: ✅ 需要 USER 角色

#### 2.1 AI 聊天

**接口**: `POST /api/v2/ai/chat`

**认证**: ✅ 需要

**请求体** (`ChatRequest`):

```json
{
  "message": "string",
  "conversationId": "string"
}
```

**请求参数说明**：

| 字段             | 类型     | 必填 | 说明    |
| -------------- | ------ | -- | ----- |
| message        | String | 是  | 消息内容  |
| conversationId | String | 是  | 会话 ID |

**响应体** (`Result<String>`):

```json
{
  "code": "200",
  "message": "success",
  "data": "AI 回复的消息内容",
  "detail": null
}
```

***

#### 2.2 流式聊天

**接口**: `POST /api/v2/ai/stream`

**认证**: ✅ 需要

**Content-Type**: `application/json`

**响应类型**: `text/event-stream` (SSE)

**请求体** (`ChatRequest`):

```json
{
  "message": "string",
  "conversationId": "string"
}
```

**响应**: 服务器发送事件 (SSE) 流式返回 AI 回复

***

#### 2.3 创建会话

**接口**: `POST /api/v2/ai/create`

**认证**: ✅ 需要

**请求体**: 无

**响应体** (`Result<String>`):

```json
{
  "code": "200",
  "message": "success",
  "data": "新生成的会话 ID",
  "detail": null
}
```

***

#### 2.4 修改会话标题

**接口**: `POST /api/v2/ai/title`

**认证**: ✅ 需要

**请求体** (`ChangeConversationTitleRequest`):

```json
{
  "conversationId": 123,
  "title": "新的会话标题"
}
```

**请求参数说明**：

| 字段             | 类型     | 必填 | 说明    |
| -------------- | ------ | -- | ----- |
| conversationId | Long   | 否  | 会话 ID |
| title          | String | 是  | 新的标题  |

**响应体** (`Result<Boolean>`):

```json
{
  "code": "200",
  "message": "success",
  "data": true,
  "detail": null
}
```

***

#### 2.5 语音合成

**接口**: `POST /api/v2/ai/speak`

**认证**: ✅ 需要

**请求体** (`SpeakRequest`):

```json
{
  "text": "要合成语音的文本内容"
}
```

**请求参数说明**：

| 字段   | 类型     | 必填 | 说明       |
| ---- | ------ | -- | -------- |
| text | String | 是  | 待合成语音的文本 |

**响应体** (`Result<byte[]>`):

返回语音数据的字节数组

***

### 3. AI 工具模块 (AI Tools)

**基础路径**: `/api/v2/tools`

**认证**: ✅ 需要 USER 角色

#### 3.1 获取 Live2D 模型 JSON

**接口**: `POST /api/v2/tools/live2d`

**认证**: ✅ 需要

**请求体**: `String` (提示词)

```json
"生成一个开心的表情"
```

**请求参数说明**：

| 参数     | 类型     | 必填 | 说明          |
| ------ | ------ | -- | ----------- |
| prompt | String | 是  | 描述表情或动作的提示词 |

**响应体** (`Result<String>`):

```json
{
  "code": "200",
  "message": "success",
  "data": "{\"Version\":\"3\",\"Expressions\":[...]}",
  "detail": null
}
```

返回符合 Live2D 规范的 JSON 字符串

***

### 4. 历史模块 (History)

**基础路径**: `/api/v2/history`

**认证**: ✅ 需要 USER 角色

#### 4.1 获取对话记忆

**接口**: `GET /api/v2/history/{id}`

**认证**: ✅ 需要

**路径参数**:

| 参数 | 类型     | 必填 | 说明    |
| -- | ------ | -- | ----- |
| id | String | 是  | 会话 ID |

**响应体** (`Result<List<PromptResponse>>`):

```json
{
  "code": "200",
  "message": "success",
  "data": [
    {
      "user": "用户消息",
      "assistant": "AI 回复"
    }
  ],
  "detail": null
}
```

***

#### 4.2 获取会话列表

**接口**: `GET /api/v2/history/list`

**认证**: ✅ 需要

**响应体** (`Result<List<ConversationResponse>>`):

```json
{
  "code": "200",
  "message": "success",
  "data": [
    {
      "id": 1,
      "title": "会话标题 1"
    },
    {
      "id": 2,
      "title": "会话标题 2"
    }
  ],
  "detail": null
}
```

***

#### 4.3 删除对话记忆

**接口**: `GET /api/v2/history/clear/{id}`

**认证**: ✅ 需要

**路径参数**:

| 参数 | 类型   | 必填 | 说明    |
| -- | ---- | -- | ----- |
| id | Long | 是  | 会话 ID |

**响应体** (`Result<Boolean>`):

```json
{
  "code": "200",
  "message": "success",
  "data": true,
  "detail": null
}
```

***

#### 4.4 清空所有对话记忆

**接口**: `GET /api/v2/history/clear/all`

**认证**: ✅ 需要

**响应体** (`Result<Boolean>`):

```json
{
  "code": "200",
  "message": "success",
  "data": true,
  "detail": null
}
```

***

### 5. 帖子模块 (Posting)

**基础路径**: `/api/v2/posting`

**认证**: ✅ 需要 USER 角色

#### 5.1 上传帖子

**接口**: `POST /api/v2/posting/upload`

**认证**: ✅ 需要

**Content-Type**: `multipart/form-data`

**请求参数**:

| 参数         | 类型                  | 必填 | 说明   |
| ---------- | ------------------- | -- | ---- |
| title      | String              | 是  | 帖子标题 |
| content    | String              | 是  | 帖子内容 |
| type       | String              | 是  | 帖子类型 |
| coverImage | MultipartFile       | 否  | 封面图片 |
| files      | List<MultipartFile> | 否  | 附件列表 |

**响应体** (`Result<Boolean>`):

```json
{
  "code": "200",
  "message": "发布成功",
  "data": true,
  "detail": null
}
```

***

#### 5.2 获取帖子

**接口**: `POST /api/v2/posting/get`

**认证**: ✅ 需要

**请求参数**:

| 参数        | 类型   | 必填 | 说明    |
| --------- | ---- | -- | ----- |
| postingId | Long | 是  | 帖子 ID |

**响应体** (`Result<GetPostingResponse>`):

```json
{
  "code": "200",
  "message": "success",
  "data": {
    "content": "帖子内容",
    "filenames": ["文件 1 名称", "文件 2 名称"],
    "files": ["文件 1 URL", "文件 2 URL"]
  },
  "detail": null
}
```

***

#### 5.3 处理帖子互动（点赞/收藏）

**接口**: `POST /api/v2/posting/interaction`

**认证**: ✅ 需要

**Content-Type**: `application/json`

**请求体** (`InteractionRequest`):

```json
{
  "postingId": 123,
  "type": "LIKE",
  "action": "TOGGLE"
}
```

**请求参数说明**：

| 字段        | 类型     | 必填 | 说明                                 |
| --------- | ------ | -- | ---------------------------------- |
| postingId | Long   | 是  | 帖子 ID                              |
| type      | String | 是  | 互动类型：LIKE（点赞）、COLLECTION（收藏）       |
| action    | String | 是  | 操作类型：ADD（添加）、REMOVE（移除）、TOGGLE（切换） |

**响应体** (`Result<Boolean>`):

```json
{
  "code": "200",
  "message": "操作成功",
  "data": true,
  "detail": null
}
```

**说明**：此接口合并了原有的 `likePosting`（点赞）、`collectionPosting`（收藏）、`cancelLikePosting`（取消点赞）、`cancelCollectionPosting`（取消收藏）接口，提供统一的互动操作管理。

***

#### 5.4 获取帖子统计信息

**接口**: `POST /api/v2/posting/stats`

**认证**: ✅ 需要

**请求参数**:

| 参数        | 类型   | 必填 | 说明    |
| --------- | ---- | -- | ----- |
| postingId | Long | 是  | 帖子 ID |

**响应体** (`Result<PostStatsResponse>`):

```json
{
  "code": "200",
  "message": "success",
  "data": {
    "likeCount": 25,
    "collectionCount": 10,
    "readingCount": 150,
    "coinCount": 5,
    "liked": true,
    "collected": false
  },
  "detail": null
}
```

**说明**：此接口合并了原有的 `getCollectionCount`（获取收藏数）、`getLikeCount`（获取点赞数）、`isLiked`（是否点赞）、`isCollected`（是否收藏）、`getReadingCount`（获取阅读数）、`getCoinCount`（获取金币数）接口，提供完整的帖子统计信息。

***

#### 5.5 获取帖子阅读数（已弃用）

**接口**: `POST /api/v2/posting/getReadingCount`

**认证**: ✅ 需要

**请求参数**:

| 参数        | 类型   | 必填 | 说明    |
| --------- | ---- | -- | ----- |
| postingId | Long | 是  | 帖子 ID |

**响应体** (`Result<Long>`):

```json
{
  "code": "200",
  "message": "success",
  "data": 150,
  "detail": null
}
```

**说明**：此接口已弃用，建议使用 `/stats` 接口获取完整的帖子统计信息（包含阅读数、金币数、点赞数、收藏数）。

***

#### 5.6 获取帖子金币数（已弃用）

**接口**: `POST /api/v2/posting/getCoinCount`

**认证**: ✅ 需要

**请求参数**:

| 参数        | 类型   | 必填 | 说明    |
| --------- | ---- | -- | ----- |
| postingId | Long | 是  | 帖子 ID |

**响应体** (`Result<Long>`):

```json
{
  "code": "200",
  "message": "success",
  "data": 5,
  "detail": null
}
```

**说明**：此接口已弃用，建议使用 `/stats` 接口获取完整的帖子统计信息。

***

#### 5.11 删除帖子

**接口**: `POST /api/v2/posting/delete`

**认证**: ✅ 需要

**请求参数**:

| 参数        | 类型   | 必填 | 说明    |
| --------- | ---- | -- | ----- |
| postingId | Long | 是  | 帖子 ID |

**响应体** (`Result<Boolean>`):

```json
{
  "code": "200",
  "message": "删除成功",
  "data": true,
  "detail": null
}
```

***

#### 5.12 获取自己的帖子

**接口**: `POST /api/v2/posting/getMyPosting`

**认证**: ✅ 需要

**响应体** (`Result<List<SelfPostResponse>>`):

```json
{
  "code": "200",
  "message": "success",
  "data": [
    {
      "postingId": 123,
      "approved": true
    },
    {
      "postingId": 456,
      "approved": false
    }
  ],
  "detail": null
}
```

返回用户发布的帖子列表，包含帖子ID和审核状态

***

### 6. 帖子搜索模块 (Posting Search)

**基础路径**: `/api/v2/searching`

**认证**: ✅ 需要 USER 角色

#### 6.1 搜索帖子

**接口**: `POST /api/v2/searching/search`

**认证**: ✅ 需要

**请求参数**:

| 参数       | 类型      | 必填 | 说明    |
| -------- | ------- | -- | ----- |
| keyword  | String  | 是  | 搜索关键词 |
| pageNum  | Integer | 是  | 页码    |
| pageSize | Integer | 是  | 每页大小  |

**响应体** (`Result<List<Long>>`):

```json
{
  "code": "200",
  "message": "success",
  "data": [1, 2, 3],
  "detail": null
}
```

返回匹配的帖子 ID 列表

***

#### 6.2 获取点赞的帖子

**接口**: `POST /api/v2/searching/like`

**认证**: ✅ 需要

**响应体** (`Result<List<Long>>`):

```json
{
  "code": "200",
  "message": "success",
  "data": [1, 2, 3],
  "detail": null
}
```

返回用户点赞的帖子 ID 列表

***

#### 6.3 获取收藏的帖子

**接口**: `POST /api/v2/searching/collection`

**认证**: ✅ 需要

**响应体** (`Result<List<Long>>`):

```json
{
  "code": "200",
  "message": "success",
  "data": [4, 5, 6],
  "detail": null
}
```

返回用户收藏的帖子 ID 列表

***

#### 6.4 获取帖子简述

**接口**: `POST /api/v2/searching/encapsulate`

**认证**: ✅ 需要

**请求参数**:

| 参数        | 类型   | 必填 | 说明    |
| --------- | ---- | -- | ----- |
| postingId | Long | 是  | 帖子 ID |

**响应体** (`Result<PostEncapsulateResponse>`):

```json
{
  "code": "200",
  "message": "success",
  "data": {
    "title": "帖子标题",
    "posterId": 123,
    "coverImage": "封面图片 URL"
  },
  "detail": null
}
```

***

### 7. 评论模块 (Comment)

**基础路径**: `/api/v1/auth`

**认证**: ✅ 需要（继承默认安全配置）

#### 7.1 添加评论

**接口**: `POST /api/v1/auth/add-comment`

**认证**: ✅ 需要

**请求体** (`CommentRequest`):

```json
{
  "postingId": 123,
  "content": "评论内容"
}
```

**请求参数说明**：

| 字段        | 类型     | 必填 | 说明    |
| --------- | ------ | -- | ----- |
| postingId | Long   | 是  | 帖子 ID |
| content   | String | 是  | 评论内容  |

**响应体** (`Result<Boolean>`):

```json
{
  "code": "200",
  "message": "评论成功",
  "data": true,
  "detail": null
}
```

***

#### 7.2 获取评论列表

**接口**: `POST /api/v1/auth/get-comment-list`

**认证**: ✅ 需要

**Content-Type**: `application/json`

**请求体**: `Long` (帖子 ID)

```
123
```

**请求参数说明**：

| 参数        | 类型   | 必填 | 说明    |
| --------- | ---- | -- | ----- |
| postingId | Long | 是  | 帖子 ID |

**响应体** (`Result<List<CommentResponse>>`):

```json
{
  "code": "200",
  "message": "success",
  "data": [
    {
      "id": 1,
      "userId": 100,
      "postingId": 123,
      "content": "评论内容 1"
    },
    {
      "id": 2,
      "userId": 101,
      "postingId": 123,
      "content": "评论内容 2"
    }
  ],
  "detail": null
}
```

***

#### 7.3 删除评论

**接口**: `POST /api/v1/auth/delete-comment`

**认证**: ✅ 需要

**Content-Type**: `application/json`

**请求体**: `Long` (评论 ID)

```
1
```

**请求参数说明**：

| 参数        | 类型   | 必填 | 说明    |
| --------- | ---- | -- | ----- |
| commentId | Long | 是  | 评论 ID |

**响应体** (`Result<Boolean>`):

```json
{
  "code": "200",
  "message": "删除成功",
  "data": true,
  "detail": null
}
```

***

### 8. 用户详情模块 (User Detail)

**基础路径**: `/api/v1/user/detail`

**认证**: ✅ 需要（继承默认安全配置）

#### 8.1 更新用户头像

**接口**: `POST /api/v1/user/detail/avatar/update`

**认证**: ✅ 需要

**Content-Type**: `multipart/form-data`

**请求参数**:

| 参数     | 类型            | 必填 | 说明   |
| ------ | ------------- | -- | ---- |
| avatar | MultipartFile | 是  | 头像文件 |

**响应体** (`Result<Boolean>`):

```json
{
  "code": "200",
  "message": "更新成功",
  "data": true,
  "detail": null
}
```

***

#### 8.2 获取用户头像

**接口**: `POST /api/v1/user/detail/avatar/get`

**认证**: ✅ 需要

**Content-Type**: `application/json`

**响应体** (`Result<String>`):

```json
{
  "code": "200",
  "message": "success",
  "data": "头像 URL",
  "detail": null
}
```

***

#### 8.3 获取用户详情

**接口**: `POST /api/v1/user/detail/detail/get`

**认证**: ✅ 需要

**Content-Type**: `application/json`

**响应体** (`Result<UserDetailResponse>`):

```json
{
  "code": "200",
  "message": "success",
  "data": {
    "userName": "用户名",
    "userIntroduction": "个人简介",
    "userCity": "城市",
    "userGender": "性别",
    "userPhone": "年龄",
    "userBirthday": "2000-01-01"
  },
  "detail": null
}
```

**字段说明**：

| 字段               | 类型     | 说明           |
| ---------------- | ------ | ------------ |
| userName         | String | 用户名          |
| userIntroduction | String | 个人简介         |
| userCity         | String | 城市           |
| userGender       | String | 性别           |
| userPhone        | String | 年龄（字段名可能为笔误） |
| userBirthday     | Date   | 生日           |

***

#### 8.4 更新用户详情

**接口**: `POST /api/v1/user/detail/detail/update`

**认证**: ✅ 需要

**Content-Type**: `application/json`

**请求体** (`UserDetailResponse`):

```json
{
  "userName": "新用户名",
  "userIntroduction": "新简介",
  "userCity": "新城市",
  "userGender": "新性别",
  "userPhone": "新年纪",
  "userBirthday": "2000-01-01"
}
```

**响应体** (`Result<Boolean>`):

```json
{
  "code": "200",
  "message": "更新成功",
  "data": true,
  "detail": null
}
```

***

#### 8.5 获取某用户详情

**接口**: `POST /api/v1/user/detail/detail/get/user`

**认证**: ✅ 需要

**Content-Type**: `application/x-www-form-urlencoded` 或 `multipart/form-data`

**请求参数**:

| 参数     | 类型   | 必填 | 说明    |
| ------ | ---- | -- | ----- |
| userId | Long | 是  | 用户 ID |

**响应体** (`Result<PosterDetailResponse>`):

```json
{
  "code": "200",
  "message": "success",
  "data": {
    "userName": "用户名",
    "userAvatar": "用户头像 URL"
  },
  "detail": null
}
```

***

### 9. 文件模块 (File)

**基础路径**: `/file`

**认证**: ❌ 不需要（通过签名验证）

**说明**:

- 文件访问接口使用签名验证机制，确保文件访问的安全性
- 签名由服务端生成，包含过期时间
- 文件名需要进行 URL 编码（UTF-8）
- 文件存储路径：`{项目根目录}/Common/src/main/resources/static/upload/`

#### 9.1 获取文件

**接口**: `GET /file/generate`

**认证**: ❌ 不需要（使用签名验证）

**请求参数**（查询参数）:

| 参数       | 类型     | 必填 | 说明                   |
| -------- | ------ | -- | -------------------- |
| fileName | String | 是  | 文件名（需要 URL 编码，UTF-8） |
| expire   | Long   | 是  | 过期时间戳（秒，Unix 时间戳）    |
| sign     | String | 是  | 签名（MD5 加密）           |

**签名生成规则**:

```java
String sign = md5Hex(fileName + expire + KEY);
```

其中 `KEY = "yachiyo_file_url" + 系统启动时间戳`

**响应**:

- **成功 (200)**: 返回文件内容（根据文件类型自动设置对应的 Content-Type）
  - 图片：`image/jpeg`, `image/png`, `image/gif` 等
  - 音频：`audio/mpeg`, `audio/mp3`, `audio/wav` 等
  - 视频：`video/mp4`, `video/webm` 等
  - 文本：`text/plain`, `text/html` 等
  - 其他：`application/octet-stream`
- **失败 (403)**: 签名验证失败或已过期
- **失败 (404)**: 文件不存在

**使用示例**:

```bash
# 1. 假设文件路径为：1/avatar.jpg
# 2. 过期时间：1711500000（Unix 时间戳，秒）
# 3. 生成签名（需要后端生成）

# 请求示例（fileName 需要 URL 编码）
GET http://211.101.237.141:8080/file/generate?fileName=1%2Favatar.jpg&expire=1711500000&sign=abc123def456...

# 使用 cURL 示例
curl -X GET "http://211.101.237.141:8080/file/generate?fileName=1%2Favatar.jpg&expire=1711500000&sign=abc123"
```

**注意事项**:

1. `fileName` 参数需要进行 URL 编码（使用 UTF-8 编码）
2. `expire` 是 Unix 时间戳（秒），不是毫秒
3. 签名验证失败会返回 403 状态码
4. 文件不存在会返回 404 状态码
5. 签名过期后（当前时间 > expire），签名失效

***

### 10. 邮件模块 (Mail)

**基础路径**: `/api/v2/mail`

**认证**: ✅ 需要 USER 角色

#### 10.1 发送邮件

**接口**: `POST /api/v2/mail/send`

**认证**: ✅ 需要

**Content-Type**: `application/json`

**请求体** (`MailRequest`):

```json
{
  "recipientId": 123,
  "title": "邮件标题",
  "content": "邮件内容"
}
```

**请求参数说明**：

| 字段          | 类型     | 必填 | 说明       |
| ----------- | ------ | -- | -------- |
| recipientId | Long   | 是  | 收件人用户 ID |
| title       | String | 是  | 邮件标题     |
| content     | String | 是  | 邮件内容     |

**响应体** (`Result<Boolean>`):

```json
{
  "code": "200",
  "message": "发送成功",
  "data": true,
  "detail": null
}
```

***

#### 10.2 读取邮件

**接口**: `POST /api/v2/mail/read`

**认证**: ✅ 需要

**Content-Type**: `application/json`

**请求体**: `Long` (邮件 ID)

```
123
```

**请求参数说明**：

| 参数     | 类型   | 必填 | 说明    |
| ------ | ---- | -- | ----- |
| mailId | Long | 是  | 邮件 ID |

**响应体** (`Result<MailResponse>`):

```json
{
  "code": "200",
  "message": "success",
  "data": {
    "id": 123,
    "senderId": 100,
    "recipientId": 101,
    "title": "邮件标题",
    "content": "邮件内容",
    "read": true,
    "sendTime": "2026-03-28T10:30:00"
  },
  "detail": null
}
```

***

#### 10.3 获取邮件列表

**接口**: `POST /api/v2/mail/list`

**认证**: ✅ 需要

**Content-Type**: `application/json`

**请求体**: 无（或可接受 MailRequest 但实现中忽略）

**响应体** (`Result<List<MailEncapsulateResponse>>`):

```json
{
  "code": "200",
  "message": "success",
  "data": [
    {
      "id": 1,
      "title": "邮件标题 1",
      "senderName": "发件人名称",
      "read": false
    },
    {
      "id": 2,
      "title": "邮件标题 2",
      "senderName": "发件人名称 2",
      "read": true
    }
  ],
  "detail": null
}
```

***

### 11. 金币模块 (Coin)

**基础路径**: `/api/v2/coin`

**认证**: ✅ 需要 USER 角色

#### 11.1 金币交易

**接口**: `POST /api/v2/coin/change`

**认证**: ✅ 需要

**Content-Type**: `application/json`

**请求体** (`CoinChangeRequest`):

```json
{
  "fromUserId": 123,
  "toUserId": 456,
  "type": "TIP",
  "amount": 100
}
```

**请求参数说明**：

| 字段         | 类型        | 必填 | 说明                                                   |
| ---------- | --------- | -- | ---------------------------------------------------- |
| fromUserId | Long      | 否  | 发送方用户ID                                              |
| toUserId   | Long      | 否  | 接收方用户ID                                              |
| type       | TradeType | 是  | 交易类型：TIP（打赏）、CHECKIN（签到）、MAIL（邮箱）、CHARGE（充值）、BUY（购买） |
| amount     | Double    | 是  | 交易金额                                                 |

**响应体** (`Result<Boolean>`):

```json
{
  "code": "200",
  "message": "交易成功",
  "data": true,
  "detail": null
}
```

***

#### 11.2 获取金币数量

**接口**: `POST /api/v2/coin/get`

**认证**: ✅ 需要

**Content-Type**: `application/json`

**请求体**: 无

**响应体** (`Result<Integer>`):

```json
{
  "code": "200",
  "message": "success",
  "data": 1500,
  "detail": null
}
```

***

#### 11.3 签到

**接口**: `POST /api/v2/coin/sign`

**认证**: ✅ 需要

**Content-Type**: `application/json`

**请求体**: 无

**响应体** (`Result<Boolean>`):

```json
{
  "code": "200",
  "message": "签到成功",
  "data": true,
  "detail": null
}
```

***

#### 11.4 开启钱包

**接口**: `POST /api/v2/coin/open-wallet`

**认证**: ✅ 需要 USER 角色

**请求体**: 无

**响应体** (`Result<Boolean>`):

```json
{
  "code": "200",
  "message": "钱包开启成功",
  "data": true,
  "detail": null
}
```

***

### 12. 商品模块 (Goods)

**基础路径**: `/api/v1/auth`

**认证**: ✅ 需要（继承默认安全配置）

#### 12.1 购买商品

**接口**: `POST /api/v1/auth/buy`

**认证**: ✅ 需要

**Content-Type**: `application/x-www-form-urlencoded` 或 `multipart/form-data`

**请求参数**:

| 参数     | 类型      | 必填 | 说明    |
| ------ | ------- | -- | ----- |
| goodId | Integer | 是  | 商品 ID |

**响应体** (`Result<Boolean>`):

```json
{
  "code": "200",
  "message": "购买成功",
  "data": true,
  "detail": null
}
```

***

#### 12.2 获取购买列表

**接口**: `GET /api/v1/auth/get/my/list`

**认证**: ✅ 需要

**响应体** (`Result<List<BuyResponse>>`):

```json
{
  "code": "200",
  "message": "success",
  "data": [
    {
      "goodId": 1,
      "goodName": "商品名称",
      "buyTime": "2026-03-28T10:30:00"
    }
  ],
  "detail": null
}
```

***

#### 12.3 获取所有商品

**接口**: `GET /api/v1/auth/get/all`

**认证**: ✅ 需要

**响应体** (`Result<List<Good>>`):

```json
{
  "code": "200",
  "message": "success",
  "data": [
    {
      "id": 1,
      "name": "商品名称",
      "description": "商品描述",
      "price": 100,
      "stock": 50
    }
  ],
  "detail": null
}
```

***

### 13. 管理员模块 (Admin)

**基础路径**: `/api/yachiyo/168/mini/admin`

**认证**: ✅ 需要（需要管理员权限）

**说明**: 该模块用于管理 RAG（检索增强生成）资源，仅管理员可访问。

#### 13.1 上传资源

**接口**: `POST /api/yachiyo/168/mini/admin/upload`

**认证**: ✅ 需要

**Content-Type**: `multipart/form-data`

**请求参数**:

| 参数    | 类型                  | 必填 | 说明             |
| ----- | ------------------- | -- | -------------- |
| files | List<MultipartFile> | 是  | 资源文件列表（支持多个文件） |

**说明**:

- 上传的文件将用于 RAG（检索增强生成）系统的知识库
- 支持的文件类型：文本文件、PDF、Word 文档等
- 文件大小受服务器配置限制（默认 10MB）

**响应体** (`Result<Boolean>`):

```json
{
  "code": "200",
  "message": "上传成功",
  "data": true,
  "detail": null
}
```

#### 13.2 运行命令

**接口**: `POST /api/yachiyo/168/mini/admin/run-command`

**认证**: ✅ 需要管理员权限

**Content-Type**: `application/x-www-form-urlencoded` 或 `multipart/form-data`

**请求参数**:

| 参数      | 类型     | 必填 | 说明     |
| ------- | ------ | -- | ------ |
| command | String | 是  | 要执行的命令 |

**响应体** (`Result<String>`):

```json
{
  "code": "200",
  "message": "success",
  "data": "命令执行结果",
  "detail": null
}
```

***

#### 13.3 获取剩余 Token

**接口**: `POST /api/yachiyo/168/mini/admin/get-remaining-token`

**认证**: ✅ 需要管理员权限

**请求体**: 无

**响应体** (`Result<Long>`):

```json
{
  "code": "200",
  "message": "success",
  "data": 1000,
  "detail": null
}
```

返回剩余的 AI 模型 token 数量。

***

#### 13.4 更改 API 密钥

**接口**: `POST /api/yachiyo/168/mini/admin/change-api-key`

**认证**: ✅ 需要管理员权限

**Content-Type**: `application/x-www-form-urlencoded` 或 `multipart/form-data`

**请求参数**:

| 参数     | 类型     | 必填 | 说明                 |
| ------ | ------ | -- | ------------------ |
| apiKey | String | 是  | 新的 API 密钥          |
| model  | String | 是  | 模型名称（如 "qwen-max"） |

**响应体** (`Result<Void>`):

```json
{
  "code": "200",
  "message": "API 密钥已更新",
  "data": null,
  "detail": null
}
```

***

#### 13.5 管理员登录

**接口**: `POST /api/yachiyo/168/mini/admin/login`

**认证**: ❌ 不需要（登录接口本身）

**Content-Type**: `application/x-www-form-urlencoded` 或 `multipart/form-data`

**请求参数**:

| 参数       | 类型     | 必填 | 说明     |
| -------- | ------ | -- | ------ |
| username | String | 是  | 管理员用户名 |
| password | String | 是  | 管理员密码  |

**响应体** (`Result<String>`):

```json
{
  "code": "200",
  "message": "登录成功",
  "data": "管理员 JWT Token",
  "detail": null
}
```

***

#### 13.6 审核帖子（合并接口）

**接口**: `POST /api/yachiyo/168/mini/admin/review`

**认证**: ✅ 需要管理员权限

**Content-Type**: `application/json`

**请求体** (`ReviewRequest`):

```json
{
  "postingId": 123,
  "action": "APPROVE",
  "reason": "可选，拒绝原因"
}
```

**请求参数说明**：

| 字段        | 类型     | 必填 | 说明                                           |
| --------- | ------ | -- | -------------------------------------------- |
| postingId | Long   | 是  | 帖子 ID                                        |
| action    | String | 是  | 审核操作：`APPROVE`（通过）、`REJECT`（拒绝）、`DELETE`（删除） |
| reason    | String | 否  | 拒绝原因（当 action 为 `REJECT` 时可选）                |

**响应体** (`Result<Boolean>`):

```json
{
  "code": "200",
  "message": "审核成功",
  "data": true,
  "detail": null
}
```

**说明**：此接口合并了原有的 `approve-posting`、`reject-posting` 和 `delete-posting` 接口。这些旧接口已在 commit 93c141e 中从代码中移除。

***

#### 13.7 查询帖子（合并接口）

**接口**: `POST /api/yachiyo/168/mini/admin/query-postings`

**认证**: ✅ 需要管理员权限

**Content-Type**: `application/json`

**请求体** (`PostingQueryRequest`):

```json
{
  "status": "PENDING",
  "keyword": "搜索关键词",
  "pageNum": 1,
  "pageSize": 20
}
```

**请求参数说明**：

| 字段       | 类型      | 必填 | 说明                                                  |
| -------- | ------- | -- | --------------------------------------------------- |
| status   | String  | 否  | 帖子状态：`PENDING`（待审核）、`APPROVED`（已通过）、`REJECTED`（已拒绝） |
| keyword  | String  | 否  | 搜索关键词（标题或内容匹配）                                      |
| pageNum  | Integer | 否  | 页码，默认 1                                             |
| pageSize | Integer | 否  | 每页大小，默认 20                                          |

**响应体** (`Result<List<Posting>>`):

```json
{
  "code": "200",
  "message": "success",
  "data": [
    {
      "id": 1,
      "userId": 100,
      "title": "帖子标题",
      "content": "帖子内容",
      "type": "text",
      "status": "PENDING",
      "createTime": "2026-03-26T10:30:00"
    }
  ],
  "detail": null
}
```

**说明**：此接口合并了原有的 `get-all-posting`、`get-unapproved-posting` 和 `get-rejected-posting` 接口，支持状态筛选和关键词搜索。这些旧接口已在 commit 93c141e 中从代码中移除。

***

#### 13.8 删除帖子（已弃用）

**接口**: `POST /api/yachiyo/168/mini/admin/delete-posting`

**认证**: ✅ 需要管理员权限

**Content-Type**: `application/x-www-form-urlencoded` 或 `multipart/form-data`

**请求参数**:

| 参数        | 类型   | 必填 | 说明    |
| --------- | ---- | -- | ----- |
| postingId | Long | 是  | 帖子 ID |

**响应体** (`Result<Boolean>`):

```json
{
  "code": "200",
  "message": "删除成功",
  "data": true,
  "detail": null
}
```

**说明**：此接口已弃用，建议使用 `/review` 接口，action 设置为 `DELETE`。该接口已在 commit 93c141e 中从代码中移除。

***

### 14. 测试模块 (Test)

**基础路径**: `/api/v3/test`

**认证**: ❌ 不需要（v3 接口全部开放）

#### 14.1 测试接口

**接口**: `GET /api/v3/test/hello`

**认证**: ❌ 不需要

**响应**:

```
Hello World!
```

***

## 数据模型

### 枚举类

#### GoodType

| 枚举值        | 说明 |
| ---------- | -- |
| GIFT       | 礼物 |
| DECORATION | 装饰 |
| SKIN       | 皮肤 |

#### InteractionAction

| 枚举值    | 说明                    |
| ------ | --------------------- |
| ADD    | 添加互动（点赞/收藏）           |
| REMOVE | 移除互动（取消点赞/取消收藏）       |
| TOGGLE | 切换互动状态（如果已存在则取消，否则添加） |

#### InteractionType

| 枚举值        | 说明 |
| ---------- | -- |
| LIKE       | 点赞 |
| COLLECTION | 收藏 |

#### PostingStatus

| 枚举值      | 说明         |
| -------- | ---------- |
| PENDING  | 待审核        |
| APPROVED | 已审核通过      |
| REJECTED | 已拒绝        |
| ALL      | 所有状态（用于查询） |

#### ReviewAction

| 枚举值     | 说明   |
| ------- | ---- |
| APPROVE | 审核通过 |
| REJECT  | 审核拒绝 |
| DELETE  | 删除帖子 |

#### TradeType

| 枚举值     | 说明 |
| ------- | -- |
| TIP     | 打赏 |
| CHECKIN | 签到 |
| MAIL    | 邮箱 |
| CHARGE  | 充值 |
| BUY     | 购买 |

### DTO 类

#### LoginRequest

```json5
{
  "username": "String",  // 用户名或手机号
  "password": "String"   // 密码
}
```

#### RegisterRequest

```json5
{
  "username": "String",  // 用户名
  "password": "String",  // 密码
  "email": "String",     // 邮箱
  "code": "String"       // 验证码
}
```

#### MailLoginRequest

```json5
{
  "email": "String",    // 邮箱地址
  "code": "String",     // 验证码
  "password": "String"  // 密码
}
```

#### ChatRequest

```json5
{
  "message": "String",        // 消息内容
  "conversationId": "String"  // 会话 ID
}
```

#### UploadPostingRequest

```json
{
  "title": "String",
  "content": "String",
  "type": "String",
  "coverImage": "MultipartFile",
  "files": "List<MultipartFile>"
}
```

#### CommentRequest

```json5
{
  "postingId": "Long",
  "content": "String"
}
```

#### UserDetailResponse

```json5
{
  "userName": "String",        // 用户名
  "userIntroduction": "String",// 个人简介
  "userCity": "String",        // 城市
  "userGender": "String",      // 性别
  "userPhone": "String",       // 年龄（注：字段名可能为笔误，实际表示年龄）
  "userBirthday": "Date"       // 生日
}
```

#### ConversationResponse

```json5
{
  "id": "Long",
  "title": "String"
}
```

#### PostEncapsulateResponse

```json5
{
  "title": "String",
  "posterId": "Long",
  "coverImage": "String"
}
```

#### GetPostingResponse

```json5
{
  "content": "String",
  "filenames": "List<String>",
  "files": "List<String>"
}
```

#### CommentResponse

```json5
{
  "id": "Long",
  "userId": "Long",
  "postingId": "Long",
  "content": "String"
}
```

#### PosterDetailResponse

```json5
{
  "userName": "String",
  "userAvatar": "String"
}
```

#### PromptResponse

```json5
{
  "user": "String",
  "assistant": "String"
}
```

#### InteractionRequest

```json5
{
  "postingId": "Long",
  "type": "String",  // 互动类型：LIKE（点赞）、COLLECTION（收藏）
  "action": "String" // 操作类型：ADD（添加）、REMOVE（移除）、TOGGLE（切换）
}
```

#### PostStatsResponse

```json5
{
  "likeCount": "Long",
  "collectionCount": "Long",
  "readingCount": "Long",
  "coinCount": "Long",
  "liked": "Boolean",
  "collected": "Boolean"
}
```

#### ReviewRequest

```json5
{
  "postingId": "Long",
  "action": "String", // 审核操作：APPROVE（通过）、REJECT（拒绝）、DELETE（删除）
  "reason": "String"  // 拒绝原因（可选）
}
```

#### PostingQueryRequest

```json5
{
  "status": "String",   // 帖子状态：PENDING（待审核）、APPROVED（已通过）、REJECTED（已拒绝）
  "keyword": "String",  // 搜索关键词
  "pageNum": "Integer", // 页码
  "pageSize": "Integer" // 每页大小
}
```

#### MailRequest

```json5
{
  "recipientId": "Long",
  "title": "String",
  "content": "String"
}
```

#### MailResponse

```json5
{
  "id": "Long",
  "senderId": "Long",
  "recipientId": "Long",
  "title": "String",
  "content": "String",
  "read": "Boolean",
  "sendTime": "Date"
}
```

#### MailEncapsulateResponse

```json5
{
  "id": "Long",
  "title": "String",
  "senderName": "String",
  "read": "Boolean"
}
```

#### CoinChangeRequest

```json5
{
  "fromUserId": "Long",  // 发送方用户ID
  "toUserId": "Long",    // 接收方用户ID
  "type": "TradeType",   // 交易类型：TIP（打赏）、CHECKIN（签到）、MAIL（邮箱）、CHARGE（充值）、BUY（购买）
  "amount": "Double"      // 交易金额
}
```

#### BuyResponse

```json5
{
  "goodId": "Long",
  "buyTime": "Time"
}
```

#### Good

```json5
{
  "id": "Integer",     // 商品ID
  "name": "String",    // 商品名称
  "price": "Double",   // 商品价格
  "goodType": "GoodType", // 商品类型：GIFT（礼物）、DECORATION（装饰）、SKIN（皮肤）
  "description": "String" // 商品描述
}
```

### 实体类

#### User

```json5
{
  "id": "Long",         // 用户 ID
  "name": "String",     // 用户名
  "password": "String", // 密码（加密）
  "role": "String",     // 角色
  "email": "String"     // 邮箱
}
```

#### UserDetail

```json5
{
  "userId": "Long",
  "userIntroduction": "String",
  "userName": "String",
  "userCity": "String",
  "userGender": "String",
  "userBirthday": "Date"
}
```

#### Posting

```json5
{
  "id": "Long",
  "userId": "Long",
  "title": "String",
  "content": "String",
  "type": "String"
}
```

#### PostDetail

```json5
{
  "id": "Long",
  "love": "Long",        // 点赞数
  "collection": "Long",  // 收藏数
  "reading": "Long"      // 阅读数
}
```

#### Comment

```json5
{
  "id": "Long",
  "userId": "Long",
  "postingId": "Long",
  "content": "String"
}
```

#### Conversation

```json5
{
  "id": "Long",
  "userId": "Long",
  "title": "String",
  "createTime": "Date",
  "updateTime": "Date"
}
```

#### Message

```json5
{
  "id": "String",           // 会话 ID
  "content": "String",      // 消息内容
  "type": "MessageType",    // 消息类型（USER/ASSISTANT）
  "time": "Date"            // 时间戳
}
```

#### LinkLike

```json5
{
  "userId": "Long",
  "postingId": "Long"
}
```

#### LinkCollection

```json
{
  "userId": "Long",
  "postingId": "Long"
}
```

***

## 错误码说明

| 错误码 | 说明       |
| --- | -------- |
| 200 | 成功       |
| 400 | 请求参数错误   |
| 401 | 未认证/认证失败 |
| 403 | 权限不足     |
| 404 | 资源不存在    |
| 500 | 服务器内部错误  |

***

## 技术栈

### 核心框架

- **Spring Boot**: 3.x
- **Spring Security**: 安全认证框架
- **Spring AI**: AI 模型集成框架

### 数据库与存储

- **PostgreSQL**: 主数据库（开发环境）
- **MySQL**: 备选数据库（生产环境）
- **Redis**: 缓存与会话存储
- **MyBatis-Plus**: ORM 框架

### AI 与模型

- **OpenAI SDK**: 兼容 OpenAI 格式的 AI 模型（通义千问）
- **Spring AI Chat Memory**: 对话记忆管理
- **PGVector**: 向量数据库（用于 RAG）

### 安全与认证

- **JWT (io.jsonwebtoken)**: JSON Web Token 认证
- **Hutool**: Java 工具库（包含路径匹配等）

### 开发工具

- **Lombok**: 简化 Java 代码
- **Swagger/OpenAPI**: API 文档注解
- **Jakarta Validation**: 参数校验

### 其他

- **Live2D**: 虚拟主播模型控制
- **TTS**: 文本转语音
- **SSE (Server-Sent Events)**: 流式响应支持

***

## 版本历史

- **v1**: 基础认证、用户管理、评论功能
- **v2**: AI 聊天、帖子管理、搜索功能
- **v3**: 测试接口

***

**文档生成时间**: 2026-03-29
**文档版本**: v1.5 (接口和数据模型更新版)

**更新日志**:

### v1.5 (2026-03-29)

- 更新金币交易接口：修改请求参数结构，使用TradeType枚举
- 更新帖子搜索接口：添加pageNum和pageSize参数
- 更新获取自己的帖子接口：响应体从List<Long>改为List<SelfPostResponse>
- 新增枚举类定义：GoodType、InteractionAction、InteractionType、PostingStatus、ReviewAction、TradeType
- 更新数据模型：修正CoinChangeRequest、BuyResponse、Good的字段定义
- 确保所有接口信息与代码实现完全一致

### v1.4 (2026-03-29)

- 根据 commit 93c141e 更新管理员接口
  - 删除已弃用的 `delete-posting` 接口（代码中已移除）
  - 删除其他已弃用的管理员接口：`approve-posting`, `reject-posting`, `get-all-posting`, `get-unapproved-posting`, `get-rejected-posting`（代码中已移除）
  - 保留合并接口 `review` 和 `query-postings`
- 新增认证模块接口：更改密码、退出登录、邮箱登录、刷新令牌
- 新增金币模块接口：开启钱包
- 更新安全认证部分，添加令牌自动刷新机制说明
- 更新免认证接口列表，添加刷新令牌、邮箱登录、管理员登录接口

### v1.3 (2026-03-28)

- 补充了缺失的22个接口文档
  - 管理员模块：运行命令、获取剩余token、更改API密钥、登录、审核帖子、查询帖子、删除帖子（已弃用）
  - 邮件模块：发送邮件、读取邮件、获取邮件列表
  - 金币模块：金币交易、获取金币数量、签到
  - 商品模块：购买商品、获取购买列表、获取所有商品
  - 帖子模块：获取帖子阅读数（已弃用）、获取帖子金币数（已弃用）
- 新增邮件模块、金币模块、商品模块章节
- 更新管理员模块，添加合并接口（review、query-postings）
- 更新数据模型，添加新的DTO类
- 更新目录结构，重新编号章节

### v1.2 (2026-03-26)

- 更新了文件模块的详细文档
  - 修正接口路径为查询参数方式（非路径参数）
  - 添加了签名生成规则说明
  - 添加了 fileName URL 编码说明
  - 修正 expire 为 Unix 时间戳（秒）
  - 添加了文件存储路径说明
  - 补充了更多注意事项
- 更新了快速开始中的文件访问示例

### v1.1 (2026-03-26)

- 添加了快速开始部分，包含常用接口的调用示例
- 完善了安全认证流程和 JWT Token 说明
- 补充了所有接口的 Content-Type 说明
- 添加了文件访问接口的详细说明
- 更新了技术栈部分，分类更清晰
- 添加了 Message 实体类说明
- 修正了 UserDetailResponse 字段说明
- 添加了响应示例（成功和错误）

