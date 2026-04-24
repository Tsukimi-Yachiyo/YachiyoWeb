# YachiyoServiceCloud API 文档

## 目录

- [安全认证](#安全认证)
- [统一响应格式](#统一响应格式)
- [认证服务 (AuthService)](#认证服务-authservice)
- [用户服务 (UserService)](#用户服务-userservice)
- [金币服务 (CoinService)](#金币服务-coinservice)
- [帖子服务 (PostingService)](#帖子服务-postingservice)
- [专栏服务 (ColumnService)](#专栏服务-columnservice)
- [文件服务 (FileService)](#文件服务-fileservice)
- [管理员服务 (AdminService)](#管理员服务-adminservice)
- [分数服务 (ScoreService)](#分数服务-scoreservice)
- [工具服务 (ToolService)](#工具服务-toolservice)
- [聊天服务 (ChatService)](#聊天服务-chatservice)

---

## 安全认证

### 网关安全机制

系统使用 JWT（JSON Web Token）进行身份认证，通过网关服务统一处理。

#### 请求头格式

```
Authorization: Bearer {token}
```

#### 白名单路径

以下路径无需认证：
- `/api/v1/auth/login` - 用户名密码登录
- `/api/v1/auth/register` - 用户注册
- `/api/v1/auth/send-code` - 发送验证码
- `/api/v1/auth/login-by-email` - 邮箱验证码登录
- `/api/v1/auth/change-password` - 修改密码
- `/api/v1/auth/refresh-token` - 刷新令牌
- `/file/**` - 文件访问
- `/api/yachiyo/168/mini/admin/login` - 管理员登录
- `/actuator/health/**` - 健康检查

#### 认证流程

1. 从请求头提取 Token
2. 验证 Token 有效性
3. 验证 Token 是否过期
4. 验证唯一码
5. 解析用户信息并通过自定义 Header 传递给下游服务：
   - `X-User-Id`: 用户 ID
   - `X-User-Name`: 用户名
   - `X-User-Role`: 角色（ROLE_USER 或 ROLE_ADMIN）
   - `X-Auth-Token`: 原始 Token

---

## 统一响应格式

所有 API 响应统一使用以下 JSON 格式：

```json
{
  "code": "200",
  "message": "success",
  "data": {},
  "detail": null
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| code | String | 状态码，200 表示成功 |
| message | String | 响应消息 |
| data | T | 响应数据，类型根据接口而定 |
| detail | String | 详细信息，通常为 null |

---

## 认证服务 (AuthService)

基础路径: `/api/v1/auth`

### 1. 用户名密码登录

**接口**: `POST /login`

**请求参数**:
```json
{
  "username": "string",
  "password": "string"
}
```

**响应**:
```json
{
  "code": "200",
  "message": "success",
  "data": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "detail": null
}
```

**用例**:
```bash
curl -X POST http://localhost:8881/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"123456"}'
```

---

### 2. 用户注册

**接口**: `POST /register`

**请求参数**:
```json
{
  "username": "string",
  "password": "string",
  "email": "string",
  "code": "string"
}
```

**响应**:
```json
{
  "code": "200",
  "message": "success",
  "data": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "detail": null
}
```

**用例**:
```bash
curl -X POST http://localhost:8881/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username":"newuser",
    "password":"123456",
    "email":"user@example.com",
    "code":"123456"
  }'
```

---

### 3. 发送验证码

**接口**: `POST /send-code`

**请求参数**:
- `email`: String (Query 参数)

**响应**:
```json
{
  "code": "200",
  "message": "success",
  "data": true,
  "detail": null
}
```

**用例**:
```bash
curl -X POST "http://localhost:8881/api/v1/auth/send-code?email=user@example.com"
```

---

### 4. 修改密码

**接口**: `POST /change-password`

**请求参数**:
```json
{
  "username": "string",
  "password": "string",
  "email": "string",
  "code": "string"
}
```

**响应**:
```json
{
  "code": "200",
  "message": "success",
  "data": true,
  "detail": null
}
```

**用例**:
```bash
curl -X POST http://localhost:8881/api/v1/auth/change-password \
  -H "Content-Type: application/json" \
  -d '{
    "username":"testuser",
    "password":"newpassword",
    "email":"user@example.com",
    "code":"123456"
  }'
```

---

### 5. 邮箱验证码登录

**接口**: `POST /login-by-email`

**请求参数**:
```json
{
  "email": "string",
  "code": "string"
}
```

**响应**:
```json
{
  "code": "200",
  "message": "success",
  "data": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "detail": null
}
```

**用例**:
```bash
curl -X POST http://localhost:8881/api/v1/auth/login-by-email \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","code":"123456"}'
```

---

### 6. 退出登录

**接口**: `POST /logout`

**需要认证**: 是

**响应**:
```json
{
  "code": "200",
  "message": "success",
  "data": true,
  "detail": null
}
```

**用例**:
```bash
curl -X POST http://localhost:8881/api/v1/auth/logout \
  -H "Authorization: Bearer {token}"
```

---

### 7. 刷新令牌

**接口**: `POST /refresh-token`

**请求参数**:
- `refreshToken`: String (Query 参数)
- `userId`: Long (Query 参数)

**响应**:
```json
{
  "code": "200",
  "message": "success",
  "data": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "detail": null
}
```

**用例**:
```bash
curl -X POST "http://localhost:8881/api/v1/auth/refresh-token?refreshToken=xxx&userId=1"
```

---

## 用户服务 (UserService)

### 公开接口

基础路径: `/api/v2/user`

#### 1. 更新用户头像

**接口**: `POST /avatar/update`

**需要认证**: 是

**请求参数**:
- `avatar`: FilePart (multipart/form-data)

**响应**:
```json
{
  "code": "200",
  "message": "success",
  "data": true,
  "detail": null
}
```

**用例**:
```bash
curl -X POST http://localhost:8881/api/v2/user/avatar/update \
  -H "Authorization: Bearer {token}" \
  -F "avatar=@/path/to/avatar.jpg"
```

---

#### 2. 获取用户头像

**接口**: `POST /avatar/get`

**需要认证**: 是

**响应**:
```json
{
  "code": "200",
  "message": "success",
  "data": "http://example.com/avatar.jpg",
  "detail": null
}
```

**用例**:
```bash
curl -X POST http://localhost:8881/api/v2/user/avatar/get \
  -H "Authorization: Bearer {token}"
```

---

#### 3. 获取当前用户详情

**接口**: `POST /detail/get`

**需要认证**: 是

**响应**:
```json
{
  "code": "200",
  "message": "success",
  "data": {
    "userName": "string",
    "userIntroduction": "string",
    "userCity": "string",
    "userGender": "string",
    "userPhone": "string",
    "userBirthday": "2024-01-01T00:00:00.000Z"
  },
  "detail": null
}
```

**用例**:
```bash
curl -X POST http://localhost:8881/api/v2/user/detail/get \
  -H "Authorization: Bearer {token}"
```

---

#### 4. 更新用户详情

**接口**: `POST /detail/update`

**需要认证**: 是

**请求参数**:
```json
{
  "userName": "string",
  "userIntroduction": "string",
  "userCity": "string",
  "userGender": "string",
  "userPhone": "string",
  "userBirthday": "2024-01-01T00:00:00.000Z"
}
```

**响应**:
```json
{
  "code": "200",
  "message": "success",
  "data": true,
  "detail": null
}
```

**用例**:
```bash
curl -X POST http://localhost:8881/api/v2/user/detail/update \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "userName":"newname",
    "userIntroduction":"Hello!",
    "userCity":"Beijing",
    "userGender":"male",
    "userPhone":"13800138000",
    "userBirthday":"2000-01-01T00:00:00.000Z"
  }'
```

---

#### 5. 获取指定用户详情

**接口**: `POST /detail/get/user`

**需要认证**: 是

**请求参数**:
- `userId`: Long (Query 参数)

**响应**:
```json
{
  "code": "200",
  "message": "success",
  "data": {
    "userName": "string",
    "userIntroduction": "string",
    "userAvatar": "string"
  },
  "detail": null
}
```

**用例**:
```bash
curl -X POST "http://localhost:8881/api/v2/user/detail/get/user?userId=1" \
  -H "Authorization: Bearer {token}"
```

---

#### 6. 获取发帖人详情

**接口**: `POST /detail/poster/get`

**需要认证**: 是

**请求参数**:
- `userId`: Long (Query 参数)

**响应**:
```json
{
  "code": "200",
  "message": "success",
  "data": {
    "userName": "string",
    "userAvatar": "string"
  },
  "detail": null
}
```

**用例**:
```bash
curl -X POST "http://localhost:8881/api/v2/user/detail/poster/get?userId=1" \
  -H "Authorization: Bearer {token}"
```

---

#### 7. 获取用户公开详情

**接口**: `POST /detail/user/detail/get`

**需要认证**: 是

**请求参数**:
- `userId`: Long (Query 参数)

**响应**:
```json
{
  "code": "200",
  "message": "success",
  "data": {
    "userIntroduction": "string",
    "userCity": "string",
    "userGender": "string"
  },
  "detail": null
}
```

**用例**:
```bash
curl -X POST "http://localhost:8881/api/v2/user/detail/user/detail/get?userId=1" \
  -H "Authorization: Bearer {token}"
```

---

#### 8. 获取用户关注列表

**接口**: `POST /detail/user/follow/get`

**需要认证**: 是

**响应**:
```json
{
  "code": "200",
  "message": "success",
  "data": [1, 2, 3],
  "detail": null
}
```

**用例**:
```bash
curl -X POST http://localhost:8881/api/v2/user/detail/user/follow/get \
  -H "Authorization: Bearer {token}"
```

---

#### 9. 获取用户粉丝列表

**接口**: `POST /detail/user/follow/getFollower`

**需要认证**: 是

**响应**:
```json
{
  "code": "200",
  "message": "success",
  "data": [1, 2, 3],
  "detail": null
}
```

**用例**:
```bash
curl -X POST http://localhost:8881/api/v2/user/detail/user/follower/get \
  -H "Authorization: Bearer {token}"
```

---

#### 10. 关注用户

**接口**: `POST /detail/user/follow/follow`

**需要认证**: 是

**请求参数**:
- `followeeId`: Long (Query 参数)

**响应**:
```json
{
  "code": "200",
  "message": "success",
  "data": true,
  "detail": null
}
```

**用例**:
```bash
curl -X POST "http://localhost:8881/api/v2/user/detail/user/follow/follow?followeeId=2" \
  -H "Authorization: Bearer {token}"
```

---

#### 11. 获取关注状态

**接口**: `POST /detail/user/follow/status/get`

**需要认证**: 是

**请求参数**:
- `followeeId`: Long (Query 参数)

**响应**:
```json
{
  "code": "200",
  "message": "success",
  "data": true,
  "detail": null
}
```

**用例**:
```bash
curl -X POST "http://localhost:8881/api/v2/user/detail/user/follow/status/get?followeeId=2" \
  -H "Authorization: Bearer {token}"
```

---

#### 12. 搜索用户

**接口**: `POST /detail/user/search`

**需要认证**: 是

**请求参数**:
- `userName`: String (Query 参数)
- `pageNum`: int (Query 参数)
- `pageSize`: int (Query 参数)

**响应**:
```json
{
  "code": "200",
  "message": "success",
  "data": [
    {
      "userName": "string",
      "userAvatar": "string",
      "followerCount": 100,
      "isFollowing": true,
      "isFollowed": false
    }
  ],
  "detail": null
}
```

**用例**:
```bash
curl -X POST "http://localhost:8881/api/v2/user/detail/user/search?userName=test&pageNum=1&pageSize=10" \
  -H "Authorization: Bearer {token}"
```

---

### 内部接口

#### 用户详情内部接口

基础路径: `/internal/user/detail`

##### 1. 初始化用户详情

**接口**: `POST /init/{id}`

**需要认证**: 否（内部使用）

**路径参数**:
- `id`: Long - 用户ID

**响应**:
```json
{
  "code": "200",
  "message": "success",
  "data": true,
  "detail": null
}
```

---

##### 2. 用户登录

**接口**: `POST /login/{id}`

**需要认证**: 否（内部使用）

**路径参数**:
- `id`: Long - 用户ID

**响应**:
```json
{
  "code": "200",
  "message": "success",
  "data": true,
  "detail": null
}
```

---

#### 用户关注内部接口

基础路径: `/internal/user/follow`

##### 1. 检查是否为好友

**接口**: `GET /isFriend`

**需要认证**: 否（内部使用）

**请求参数**:
- `currentUserId`: Long (Query 参数)
- `followeeId`: Long (Query 参数)

**响应**:
```json
{
  "code": "200",
  "message": "success",
  "data": true,
  "detail": null
}
```

---

##### 2. 获取好友列表

**接口**: `POST /friends`

**需要认证**: 否（内部使用）

**请求参数**:
- `currentUserId`: Long (Query 参数)

**响应**:
```json
{
  "code": "200",
  "message": "success",
  "data": [1, 2, 3],
  "detail": null
}
```

---

## 金币服务 (CoinService)

### 签到接口

基础路径: `/api/v2/sign`

#### 1. 签到

**接口**: `POST /check-in`

**需要认证**: 是

**响应**:
```json
{
  "code": "200",
  "message": "success",
  "data": true,
  "detail": null
}
```

**用例**:
```bash
curl -X POST http://localhost:8881/api/v2/sign/check-in \
  -H "Authorization: Bearer {token}"
```

---

#### 2. 获取签到状态

**接口**: `POST /status`

**需要认证**: 是

**响应**:
```json
{
  "code": "200",
  "message": "success",
  "data": true,
  "detail": null
}
```

**用例**:
```bash
curl -X POST http://localhost:8881/api/v2/sign/status \
  -H "Authorization: Bearer {token}"
```

---

### 金币交易接口

基础路径: `/api/v2/coin`

#### 1. 金币交易

**接口**: `POST /change`

**需要认证**: 是

**请求参数**:
```json
{
  "fromUserId": 1,
  "toUserId": 2,
  "type": "TIP",
  "amount": 10.0
}
```

**交易类型 (TradeType)**:
- `TIP` - 打赏
- `CHECKIN` - 签到
- `MAIL` - 邮箱
- `CHARGE` - 充值
- `BUY` - 购买

**响应**:
```json
{
  "code": "200",
  "message": "success",
  "data": true,
  "detail": null
}
```

**用例**:
```bash
curl -X POST http://localhost:8881/api/v2/coin/change \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "fromUserId":1,
    "toUserId":2,
    "type":"TIP",
    "amount":10.0
  }'
```

---

#### 2. 获取金币余额

**接口**: `POST /get`

**需要认证**: 是

**响应**:
```json
{
  "code": "200",
  "message": "success",
  "data": 100,
  "detail": null
}
```

**用例**:
```bash
curl -X POST http://localhost:8881/api/v2/coin/get \
  -H "Authorization: Bearer {token}"
```

---

## 帖子服务 (PostingService)

### 评论接口

基础路径: `/api/v2/posting`

#### 1. 添加评论

**接口**: `POST /add-comment`

**需要认证**: 是

**请求参数**:
```json
{
  "postingId": 1,
  "content": "这是一条评论"
}
```

**响应**:
```json
{
  "code": "200",
  "message": "success",
  "data": true,
  "detail": null
}
```

**用例**:
```bash
curl -X POST http://localhost:8881/api/v2/posting/add-comment \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"postingId":1,"content":"这是一条评论"}'
```

---

#### 2. 获取评论列表

**接口**: `POST /get-comment-list`

**需要认证**: 是

**请求参数**:
```json
1
```

**响应**:
```json
{
  "code": "200",
  "message": "success",
  "data": [
    {
      "id": 1,
      "content": "评论内容",
      "userId": 1,
      "userName": "用户名",
      "createTime": "2024-01-01T00:00:00.000Z"
    }
  ],
  "detail": null
}
```

**用例**:
```bash
curl -X POST http://localhost:8881/api/v2/posting/get-comment-list \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d "1"
```

---

#### 3. 删除评论

**接口**: `POST /delete-comment`

**需要认证**: 是

**请求参数**:
```json
1
```

**响应**:
```json
{
  "code": "200",
  "message": "success",
  "data": true,
  "detail": null
}
```

**用例**:
```bash
curl -X POST http://localhost:8881/api/v2/posting/delete-comment \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d "1"
```

---

### 帖子公开接口

基础路径: `/api/v2/posting`

#### 1. 获取帖子详情

**接口**: `POST /get`

**需要认证**: 是

**请求参数**:
- `postingId`: Long (Query 参数)

**响应**:
```json
{
  "code": "200",
  "message": "success",
  "data": {
    "id": 1,
    "title": "帖子标题",
    "content": "帖子内容",
    "userId": 1,
    "userName": "用户名",
    "createTime": "2024-01-01T00:00:00.000Z",
    "status": "APPROVED"
  },
  "detail": null
}
```

**用例**:
```bash
curl -X POST "http://localhost:8881/api/v2/posting/get?postingId=1" \
  -H "Authorization: Bearer {token}"
```

---

#### 2. 获取帖子统计信息

**接口**: `POST /stats`

**需要认证**: 是

**请求参数**:
- `postingId`: Long (Query 参数)

**响应**:
```json
{
  "code": "200",
  "message": "success",
  "data": {
    "likeCount": 100,
    "collectionCount": 50,
    "commentCount": 30,
    "viewCount": 1000
  },
  "detail": null
}
```

**用例**:
```bash
curl -X POST "http://localhost:8881/api/v2/posting/stats?postingId=1" \
  -H "Authorization: Bearer {token}"
```

---

#### 3. 搜索帖子

**接口**: `POST /search`

**需要认证**: 是

**请求参数**:
- `keyword`: String (Query 参数)
- `pageNum`: Integer (Query 参数)
- `pageSize`: Integer (Query 参数)

**响应**:
```json
{
  "code": "200",
  "message": "success",
  "data": [1, 2, 3],
  "detail": null
}
```

**用例**:
```bash
curl -X POST "http://localhost:8881/api/v2/posting/search?keyword=测试&pageNum=1&pageSize=10" \
  -H "Authorization: Bearer {token}"
```

---

#### 4. 获取点赞的帖子

**接口**: `POST /like`

**需要认证**: 是

**响应**:
```json
{
  "code": "200",
  "message": "success",
  "data": [1, 2, 3],
  "detail": null
}
```

**用例**:
```bash
curl -X POST http://localhost:8881/api/v2/posting/like \
  -H "Authorization: Bearer {token}"
```

---

#### 5. 获取收藏的帖子

**接口**: `POST /collection`

**需要认证**: 是

**响应**:
```json
{
  "code": "200",
  "message": "success",
  "data": [1, 2, 3],
  "detail": null
}
```

**用例**:
```bash
curl -X POST http://localhost:8881/api/v2/posting/collection \
  -H "Authorization: Bearer {token}"
```

---

#### 6. 获取帖子简述

**接口**: `POST /encapsulate`

**需要认证**: 是

**请求参数**:
- `postingId`: Long (Query 参数)

**响应**:
```json
{
  "code": "200",
  "message": "success",
  "data": {
    "id": 1,
    "title": "帖子标题",
    "briefContent": "帖子简要内容...",
    "coverImage": "http://example.com/cover.jpg"
  },
  "detail": null
}
```

**用例**:
```bash
curl -X POST "http://localhost:8881/api/v2/posting/encapsulate?postingId=1" \
  -H "Authorization: Bearer {token}"
```

---

#### 7. 帖子互动（点赞/收藏/投币）

**接口**: `POST /interaction`

**需要认证**: 是

**请求参数**:
```json
{
  "postingId": 1,
  "type": "LIKE",
  "action": "TOGGLE"
}
```

**互动类型 (InteractionType)**:
- `LIKE` - 点赞
- `COLLECTION` - 收藏
- `COIN` - 投币

**互动操作 (InteractionAction)**:
- `ADD` - 添加
- `REMOVE` - 移除
- `TOGGLE` - 切换

**响应**:
```json
{
  "code": "200",
  "message": "success",
  "data": true,
  "detail": null
}
```

**用例**:
```bash
curl -X POST http://localhost:8881/api/v2/posting/interaction \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"postingId":1,"type":"LIKE","action":"TOGGLE"}'
```

---

### 个人帖子接口

基础路径: `/api/v2/posting`

#### 1. 上传帖子

**接口**: `POST /upload`

**需要认证**: 是

**请求参数** (multipart/form-data):
- `title`: String
- `content`: String
- `type`: String
- `coverImage`: MultipartFile (可选)
- `files`: List<MultipartFile> (可选)

**响应**:
```json
{
  "code": "200",
  "message": "success",
  "data": true,
  "detail": null
}
```

**用例**:
```bash
curl -X POST http://localhost:8881/api/v2/posting/upload \
  -H "Authorization: Bearer {token}" \
  -F "title=测试帖子" \
  -F "content=这是帖子内容" \
  -F "type=article" \
  -F "coverImage=@/path/to/cover.jpg"
```

---

#### 2. 删除帖子

**接口**: `POST /delete`

**需要认证**: 是

**请求参数**:
- `postingId`: Long (Query 参数)

**响应**:
```json
{
  "code": "200",
  "message": "success",
  "data": true,
  "detail": null
}
```

**用例**:
```bash
curl -X POST "http://localhost:8881/api/v2/posting/delete?postingId=1" \
  -H "Authorization: Bearer {token}"
```

---

#### 3. 获取自己的帖子

**接口**: `POST /getMyPosting`

**需要认证**: 是

**响应**:
```json
{
  "code": "200",
  "message": "success",
  "data": [
    {
      "id": 1,
      "title": "帖子标题",
      "status": "APPROVED",
      "createTime": "2024-01-01T00:00:00.000Z"
    }
  ],
  "detail": null
}
```

**用例**:
```bash
curl -X POST http://localhost:8881/api/v2/posting/getMyPosting \
  -H "Authorization: Bearer {token}"
```

---

## 专栏服务 (ColumnService)

基础路径: `/api/v2/column`

### 1. 搜索专栏

**接口**: `GET /search`

**需要认证**: 是

**请求参数**:
```json
{
  "keyword": "搜索关键词",
  "pageNum": 1,
  "pageSize": 10
}
```

**响应**:
```json
{
  "code": "200",
  "message": "success",
  "data": [
    {
      "id": 1,
      "name": "专栏名称",
      "description": "专栏描述",
      "type": "ARTICLE",
      "writer": 1,
      "essayUrl": "http://example.com/essay",
      "createTime": "2024-01-01T00:00:00.000Z"
    }
  ],
  "detail": null
}
```

**用例**:
```bash
curl -X GET http://localhost:8881/api/v2/column/search \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "keyword":"测试",
    "pageNum":1,
    "pageSize":10
  }'
```

---

### 2. 专栏互动（点赞/投币）

**接口**: `POST /interaction`

**需要认证**: 是

**请求参数**:
```json
{
  "columnId": 1,
  "type": "LIKE"
}
```

**互动类型 (InteractionType)**:
- `LIKE` - 点赞
- `COIN` - 投币

**响应**:
```json
{
  "code": "200",
  "message": "success",
  "data": true,
  "detail": null
}
```

**用例**:
```bash
curl -X POST http://localhost:8881/api/v2/column/interaction \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"columnId":1,"type":"LIKE"}'
```

---

### 3. 获取互动信息

**接口**: `GET /getInteraction`

**需要认证**: 是

**请求参数**:
- `columnId`: Long (Query 参数)

**响应**:
```json
{
  "code": "200",
  "message": "success",
  "data": {
    "coin": 100,
    "like": 50
  },
  "detail": null
}
```

**用例**:
```bash
curl -X GET "http://localhost:8881/api/v2/column/getInteraction?columnId=1" \
  -H "Authorization: Bearer {token}"
```

---

## 文件服务 (FileService)

### 公开接口

基础路径: `/file`

#### 1. 下载文件（普通）

**接口**: `GET /download/upload`

**需要认证**: 否

**请求参数**:
- `fileName`: String (Query 参数)
- `expire`: long (Query 参数)
- `sign`: String (Query 参数)

**响应**: 文件流

**说明**: 此接口通过签名验证获取 MinIO 中的文件

---

#### 2. 大文件下载

**接口**: `GET /download/save`

**需要认证**: 否

**请求参数**:
- `fileName`: String (Query 参数)
- `expire`: long (Query 参数)
- `sign`: String (Query 参数)

**响应**: 文件流

**说明**: 使用流式传输，适合大文件下载

---

### 内部接口

基础路径: `/internal/file`

#### 1. 生成文件访问 URL

**接口**: `GET /getUrl`

**需要认证**: 否（内部使用）

**请求参数**:
- `url`: String (Query 参数)
- `time`: long (Query 参数)
- `prefix`: String (Query 参数, 可选, 默认值: upload)

**响应**: String

---

#### 2. 上传文件

**接口**: `PUT /upload`

**需要认证**: 否（内部使用）

**请求参数** (multipart/form-data):
- `fileName`: String
- `file`: MultipartFile (可选)

**响应**: boolean

---

#### 3. 保存文件

**接口**: `PUT /save`

**需要认证**: 否（内部使用）

**请求参数** (multipart/form-data):
- `fileName`: String
- `file`: MultipartFile (可选)

**响应**: boolean

---

#### 4. 删除文件

**接口**: `DELETE /delete`

**需要认证**: 否（内部使用）

**请求参数**:
- `fileName`: String (Query 参数)

**响应**: boolean

---

#### 5. 读取文件

**接口**: `GET /read`

**需要认证**: 否（内部使用）

**请求参数**:
- `fileName`: String (Query 参数)

**响应**: byte[]

---

#### 6. 检查文件是否存在

**接口**: `GET /checkExist`

**需要认证**: 否（内部使用）

**请求参数**:
- `fileName`: String (Query 参数)

**响应**: boolean

---

#### 7. 获取目录下文件名列表

**接口**: `GET /getNames`

**需要认证**: 否（内部使用）

**请求参数**:
- `dirName`: String (Query 参数)

**响应**: List<String>

---

## 管理员服务 (AdminService)

基础路径: `/api/yachiyo/168/mini/admin`

### 1. 管理员登录

**接口**: `POST /login`

**请求参数**:
- `username`: String (Query 参数)
- `password`: String (Query 参数)

**响应**:
```json
{
  "code": "200",
  "message": "success",
  "data": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "detail": null
}
```

**用例**:
```bash
curl -X POST "http://localhost:8881/api/yachiyo/168/mini/admin/login?username=admin&password=admin123"
```

---

### 2. 执行命令

**接口**: `POST /run-command`

**需要认证**: 是

**请求参数**:
- `command`: String (Query 参数)

**响应**:
```json
{
  "code": "200",
  "message": "success",
  "data": "命令执行结果",
  "detail": null
}
```

**用例**:
```bash
curl -X POST "http://localhost:8881/api/yachiyo/168/mini/admin/run-command?command=ls"
```

---

### 3. 审核帖子

**接口**: `POST /review`

**需要认证**: 是

**请求参数**:
```json
{
  "postingId": 1,
  "action": "APPROVE",
  "reason": "拒绝原因（可选）"
}
```

**审核操作 (ReviewAction)**:
- `APPROVE` - 批准
- `REJECT` - 拒绝

**响应**:
```json
{
  "code": "200",
  "message": "success",
  "data": true,
  "detail": null
}
```

**用例**:
```bash
curl -X POST http://localhost:8881/api/yachiyo/168/mini/admin/review \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "postingId":1,
    "action":"APPROVE"
  }'
```

---

### 4. 查询帖子

**接口**: `POST /query-postings`

**需要认证**: 是

**请求参数**:
```json
{
  "status": "PENDING",
  "keyword": "搜索关键词",
  "pageNum": 1,
  "pageSize": 10
}
```

**响应**:
```json
{
  "code": "200",
  "message": "success",
  "data": [
    {
      "id": 1,
      "title": "帖子标题",
      "status": "PENDING",
      "createTime": "2024-01-01T00:00:00.000Z"
    }
  ],
  "detail": null
}
```

**用例**:
```bash
curl -X POST http://localhost:8881/api/yachiyo/168/mini/admin/query-postings \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "status":"PENDING",
    "pageNum":1,
    "pageSize":10
  }'
```

---

### 5. 添加专栏

**接口**: `PUT /add-column`

**需要认证**: 是

**请求参数** (multipart/form-data):
- `name`: String
- `description`: String
- `type`: String
- `writerId`: Long
- `file`: MultipartFile

**响应**:
```json
{
  "code": "200",
  "message": "success",
  "data": true,
  "detail": null
}
```

**用例**:
```bash
curl -X PUT http://localhost:8881/api/yachiyo/168/mini/admin/add-column \
  -H "Authorization: Bearer {token}" \
  -F "name=专栏名称" \
  -F "description=专栏描述" \
  -F "type=ARTICLE" \
  -F "writerId=1" \
  -F "file=@/path/to/file.pdf"
```

---

### 6. 删除专栏

**接口**: `DELETE /delete-column`

**需要认证**: 是

**请求参数**:
- `id`: Long (Query 参数)

**响应**:
```json
{
  "code": "200",
  "message": "success",
  "data": true,
  "detail": null
}
```

**用例**:
```bash
curl -X DELETE "http://localhost:8881/api/yachiyo/168/mini/admin/delete-column?id=1" \
  -H "Authorization: Bearer {token}"
```

---

## 分数服务 (ScoreService)

### 公开接口

基础路径: `/api/v3`

#### 1. 获取分数

**接口**: `POST /get`

**响应**:
```json
{
  "score": 100
}
```

**用例**:
```bash
curl -X POST http://localhost:8881/api/v3/get
```

#### 2. 增加分数

**接口**: `POST /add`

**响应**:
```json
{
  "success": true
}
```

**用例**:
```bash
curl -X POST http://localhost:8881/api/v3/add
```

### 内部接口

基础路径: `/internal`

#### 1. 改变分数

**接口**: `POST /change`

**响应**:
```json
{
  "success": true
}
```

#### 2. 创建表

**接口**: `POST /create`

**响应**:
```json
{
  "success": true
}
```

---

## 工具服务 (ToolService)

基础路径: `/api/v3/test`

### 1. 测试接口

**接口**: `GET /hello`

**响应**:
```
Hello World!
```

**用例**:
```bash
curl -X GET http://localhost:8881/api/v3/test/hello
```

---

## 错误码说明

| HTTP 状态码 | 说明 |
|-------------|------|
| 200 | 请求成功 |
| 401 | 未认证/Token 无效/Token 过期 |
| 403 | 禁止访问 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

网关返回的错误格式：
```json
{
  "error": 401,
  "message": "未认证"
}
```

---

## 聊天服务 (ChatService)

基础路径: `/api/v2/chat`

### 1. 获取好友列表

**接口**: `GET /friends`

**需要认证**: 是（通过网关透传的用户信息）

**响应**:
```json
{
  "code": 200,
  "msg": "成功",
  "data": [10001, 10002, 10003]
}
```

**用例**:
```bash
curl -X GET http://localhost:8892/api/v2/chat/friends \
  -H "X-User-Id: 1" \
  -H "X-User-Name: test" \
  -H "X-User-Role: ROLE_USER" \
  -H "X-Auth-Token: token"
```

---

### 2. 创建聊天连接

**接口**: `POST /connection/create`

**需要认证**: 是

**请求参数**:
```json
{
  "to_user_id": 10002
}
```

**响应**:
```json
{
  "code": 200,
  "msg": "成功",
  "data": {
    "connection_id": 1,
    "first_user_id": 1,
    "second_user_id": 10002,
    "message_list": []
  }
}
```

**用例**:
```bash
curl -X POST http://localhost:8892/api/v2/chat/connection/create \
  -H "X-User-Id: 1" \
  -H "X-User-Name: test" \
  -H "X-User-Role: ROLE_USER" \
  -H "X-Auth-Token: token" \
  -H "Content-Type: application/json" \
  -d '{"to_user_id":10002}'
```

**错误码**:
- 1002: 非好友不能创建连接

---

### 3. 获取聊天连接详情

**接口**: `GET /connection/{connection_id}`

**需要认证**: 是

**路径参数**:
- `connection_id`: Long - 连接ID

**响应**:
```json
{
  "code": 200,
  "msg": "成功",
  "data": {
    "connection_id": 1,
    "first_user_id": 1,
    "second_user_id": 10002,
    "message_list": [
      {
        "id": 1,
        "connection_id": 1,
        "user_id": 1,
        "user_name": "test",
        "message": "你好",
        "create_time": "2026-04-24 13:00:00"
      }
    ]
  }
}
```

**用例**:
```bash
curl -X GET "http://localhost:8892/api/v2/chat/connection/1" \
  -H "X-User-Id: 1" \
  -H "X-User-Name: test" \
  -H "X-User-Role: ROLE_USER" \
  -H "X-Auth-Token: token"
```

**错误码**:
- 1001: 聊天连接不存在

---

### 4. 获取聊天连接列表

**接口**: `GET /connection/list`

**需要认证**: 是

**响应**:
```json
{
  "code": 200,
  "msg": "成功",
  "data": [
    {
      "connection_id": 1,
      "first_user_id": 1,
      "second_user_id": 10002,
      "message_list": []
    }
  ]
}
```

**用例**:
```bash
curl -X GET http://localhost:8892/api/v2/chat/connection/list \
  -H "X-User-Id: 1" \
  -H "X-User-Name: test" \
  -H "X-User-Role: ROLE_USER" \
  -H "X-Auth-Token: token"
```

---

### 5. 发送消息

**接口**: `POST /message/send`

**需要认证**: 是

**请求参数**:
```json
{
  "connection_id": 1,
  "message": "这是一条消息"
}
```

**响应**:
```json
{
  "code": 200,
  "msg": "成功",
  "data": {
    "id": 1,
    "connection_id": 1,
    "user_id": 1,
    "user_name": "test",
    "message": "这是一条消息",
    "create_time": "2026-04-24 13:00:00"
  }
}
```

**用例**:
```bash
curl -X POST http://localhost:8892/api/v2/chat/message/send \
  -H "X-User-Id: 1" \
  -H "X-User-Name: test" \
  -H "X-User-Role: ROLE_USER" \
  -H "X-Auth-Token: token" \
  -H "Content-Type: application/json" \
  -d '{"connection_id":1,"message":"这是一条消息"}'
```

**错误码**:
- 1001: 聊天连接不存在
- 1002: 非好友不能发送消息
- 1003: 消息无效（空或超过1000字符）

---

### 6. 接收新消息

**接口**: `GET /message/receive`

**需要认证**: 是

**请求参数**:
- `connection_id`: Long (Query 参数)
- `last_timestamp`: String (Query 参数, 格式: "2026-04-24 13:00:00")

**响应**:
```json
{
  "code": 200,
  "msg": "成功",
  "data": [
    {
      "id": 2,
      "connection_id": 1,
      "user_id": 10002,
      "user_name": "user2",
      "message": "收到",
      "create_time": "2026-04-24 13:01:00"
    }
  ]
}
```

**用例**:
```bash
curl -X GET "http://localhost:8892/api/v2/chat/message/receive?connection_id=1&last_timestamp=2026-04-24 13:00:00" \
  -H "X-User-Id: 1" \
  -H "X-User-Name: test" \
  -H "X-User-Role: ROLE_USER" \
  -H "X-Auth-Token: token"
```

---

### 7. 获取历史消息

**接口**: `GET /message/history`

**需要认证**: 是

**请求参数**:
- `connection_id`: Long (Query 参数)
- `page`: int (Query 参数, 默认1)

**响应**:
```json
{
  "code": 200,
  "msg": "成功",
  "data": [
    {
      "id": 1,
      "connection_id": 1,
      "user_id": 1,
      "user_name": "test",
      "message": "第一条消息",
      "create_time": "2026-04-24 12:00:00"
    }
  ]
}
```

**用例**:
```bash
curl -X GET "http://localhost:8892/api/v2/chat/message/history?connection_id=1&page=1" \
  -H "X-User-Id: 1" \
  -H "X-User-Name: test" \
  -H "X-User-Role: ROLE_USER" \
  -H "X-Auth-Token: token"
```

---

### WebSocket 实时聊天

**连接地址**: `ws://{host}:{port}/ws/chat/{connection_id}?user_id={user_id}&user_name={user_name}`

**连接参数**:
- `connection_id`: Long - 连接ID (路径参数)
- `user_id`: Long - 当前用户ID (查询参数)
- `user_name`: String - 当前用户名 (查询参数, 可选)

---

#### 1. 发送消息

**发送格式**:
```json
{
  "type": "message",
  "message": "消息内容"
}
```

**响应格式**:
```json
{
  "type": "message",
  "id": 1,
  "connection_id": 1,
  "user_id": 1,
  "user_name": "test",
  "message": "消息内容",
  "create_time": "2026-04-24 13:00:00"
}
```

---

#### 2. 心跳检测

**发送格式**:
```json
{
  "type": "heartbeat",
  "user_id": 1
}
```

**响应格式**:
```json
{
  "type": "heartbeat_ack",
  "msg": "连接正常"
}
```

**说明**: 建议前端每30秒发送一次心跳，后端会自动更新连接状态

---

### 健康检查

**接口**: `GET /health`

**需要认证**: 否

**响应**:
```json
{
  "code": 200,
  "msg": "ChatService is running",
  "data": null
}
```

---

### ChatService 错误码说明

| 错误码 | 说明 | 提示信息 |
|--------|------|----------|
| 200 | 成功 | 成功 |
| 400 | 参数错误 | 参数格式错误或缺失，请检查后重试 |
| 401 | 未登录 | 未登录，缺少认证信息，请重新登录 |
| 403 | 无权限 | 无权限访问该资源 |
| 500 | 服务异常 | 服务内部异常，请稍后再试 |
| 1001 | 连接不存在 | 聊天连接不存在，请重新创建 |
| 1002 | 非好友 | 非好友不能发送消息，请先添加好友 |
| 1003 | 消息无效 | 消息不能为空或超过1000字符，请检查消息内容 |
| 1004 | 微服务调用失败 | 用户服务调用失败，请稍后再试 |

---

## 注意事项

1. 所有需要认证的接口都需要在请求头中携带有效的 JWT Token
2. Token 格式为 `Bearer {token}`
3. 敏感词会被过滤，请确保内容合规
4. 文件访问需要通过签名验证
5. 部分接口使用 multipart/form-data 格式，请根据接口说明正确选择请求格式