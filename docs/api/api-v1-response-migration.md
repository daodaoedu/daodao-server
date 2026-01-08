# API v1 回覆格式遷移文件

## 概述

本文件專注於 API v1 端點的回覆格式標準化。API v1 端點使用 `/api/v1/` 前綴，主要由 `src/controllers/` 目錄中的 TypeScript 控制器處理。

**目標格式**: `{ success: true, data: ..., message?: string }`

## 遷移狀態摘要

- **已符合標準**: 95% (8/9 個控制器)
- **需要更新**: 5% (1/9 個控制器)
- **總端點數**: 約 50+ 個端點

## ✅ 已符合標準的控制器

### 1. Resource Controller (`/api/v1/resources`)
**文件**: `src/controllers/resource.controller.ts`
**狀態**: ✅ 完全符合

**端點列表**:
- `GET /api/v1/resources` - 資源列表
- `GET /api/v1/resources/:id` - 獲取單個資源
- `POST /api/v1/resources` - 創建資源
- `PATCH /api/v1/resources/:id` - 更新資源
- `PATCH /api/v1/resources/:id/status` - 更新資源狀態
- `DELETE /api/v1/resources/:id` - 刪除資源
- `GET /api/v1/resources/:id/tags` - 獲取資源標籤

**回覆格式**:
```typescript
{
  success: true,
  data: {
    resources: [...],
    pagination: { ... }
  }
}
```

### 2. Resource Review Controller (`/api/v1/resources/:resourceId/reviews`)
**文件**: `src/controllers/resource-review.controller.ts`
**狀態**: ✅ 完全符合

**端點列表**:
- `GET /api/v1/resources/:resourceId/reviews` - 評論列表
- `GET /api/v1/resources/:resourceId/reviews/:reviewId` - 獲取單個評論
- `POST /api/v1/resources/:resourceId/reviews` - 創建評論
- `PATCH /api/v1/resources/:resourceId/reviews/:reviewId` - 更新評論
- `DELETE /api/v1/resources/:resourceId/reviews/:reviewId` - 刪除評論
- `POST /api/v1/resources/:resourceId/reviews/:reviewId/like` - 點讚評論
- `DELETE /api/v1/resources/:resourceId/reviews/:reviewId/like` - 取消點讚

### 3. Tag Controller (`/api/v1/tags`)
**文件**: `src/controllers/tag.controller.ts`
**狀態**: ✅ 完全符合

**端點列表**:
- `GET /api/v1/tags/popular` - 熱門標籤
- `GET /api/v1/tags/search` - 搜索標籤
- `GET /api/v1/tags/stats` - 標籤統計
- `POST /api/v1/tags/entities` - 添加實體標籤
- `DELETE /api/v1/tags/entities` - 移除實體標籤
- `GET /api/v1/tags/entities` - 獲取實體標籤

### 4. Auth Controller (`/api/v1/auth`)
**文件**: `src/controllers/auth.controller.ts`
**狀態**: ✅ 完全符合

**端點列表**:
- `POST /api/v1/auth/login` - 用戶登入
- `POST /api/v1/auth/register` - 用戶註冊
- `POST /api/v1/auth/logout` - 用戶登出
- `POST /api/v1/auth/refresh` - 刷新令牌
- `GET /api/v1/auth/me` - 獲取當前用戶
- `GET /api/v1/auth/google/callback` - Google OAuth 回調
- `POST /api/v1/auth/verify-email` - 郵件驗證

**回覆格式**:
```typescript
{
  success: true,
  message: "登入成功",
  token: "jwt-token",
  user: { ... }
}
```

### 5. Project Controller (`/api/v1/projects`)
**文件**: `src/controllers/project.controller.ts`
**狀態**: ✅ 完全符合

**端點列表**:
- `GET /api/v1/projects` - 項目列表
- `GET /api/v1/projects/:id` - 項目詳情
- `POST /api/v1/projects` - 創建項目
- `PUT /api/v1/projects/:id` - 更新項目
- `DELETE /api/v1/projects/:id` - 刪除項目
- `GET /api/v1/projects/stats` - 項目統計
- `GET /api/v1/projects/my` - 我的項目
- `POST /api/v1/projects/:id/duplicate` - 複製項目

### 6. Idea Controller (`/api/v1/ideas`)
**文件**: `src/controllers/idea.controller.ts`
**狀態**: ✅ 完全符合

**端點列表**:
- `GET /api/v1/ideas` - 想法列表
- `GET /api/v1/ideas/:id` - 想法詳情
- `POST /api/v1/ideas` - 創建想法
- `PATCH /api/v1/ideas/:id` - 更新想法
- `DELETE /api/v1/ideas/:id` - 刪除想法

### 7. Email Controller (`/api/v1/email`)
**文件**: `src/controllers/email.controller.ts`
**狀態**: ✅ 完全符合

**端點列表**:
- `POST /api/v1/email/contact` - 發送聯繫郵件
- `POST /api/v1/email/verification` - 發送驗證郵件
- `POST /api/v1/email/welcome` - 發送歡迎郵件
- `POST /api/v1/email/password-reset` - 發送密碼重設郵件
- `POST /api/v1/email/marathon` - 發送馬拉松郵件
- `POST /api/v1/email/custom` - 發送自定義郵件
- `POST /api/v1/email/bulk` - 批量發送郵件
- `POST /api/v1/email/validate` - 驗證郵件
- `POST /api/v1/email/preview` - 預覽郵件模板
- `GET /api/v1/email/stats` - 郵件統計
- `GET /api/v1/email/health` - 郵件健康檢查

### 8. Me Routes (`/api/v1/me`)
**文件**: `src/routes/me.routes.ts`
**狀態**: ✅ 完全符合

**端點列表**:
- `GET /api/v1/me/ideas` - 我的想法 (使用 idea 控制器)

### 9. Health Check Routes (`/api/v1/`)
**文件**: `src/routes/index.ts`
**狀態**: ✅ 完全符合

**端點列表**:
- `GET /api/v1/health` - 健康檢查
- `GET /api/v1/info` - 系統信息

## ❌ 需要更新的控制器

### 1. User Controller (`/api/v1/users`)
**文件**: `src/controllers/user.controller.ts`
**狀態**: ❌ 需要更新
**優先級**: 🔴 高

**問題**: 缺少 `success` 字段，使用不一致的回覆格式

**端點列表**:
- `GET /api/v1/users` - 獲取所有用戶
- `GET /api/v1/users/me` - 獲取當前用戶
- `GET /api/v1/users/:id` - 根據 ID 獲取用戶
- `POST /api/v1/users` - 創建用戶
- `PUT /api/v1/users/:id` - 更新用戶
- `DELETE /api/v1/users/me` - 刪除當前用戶
- `DELETE /api/v1/users/:id` - 刪除用戶

**當前格式**:
```typescript
// 不正確的格式
{
  data: userData,
  message: "User retrieved successfully"
}
```

**目標格式**:
```typescript
// 正確的格式
{
  success: true,
  data: userData,
  message: "User retrieved successfully"
}
```

## 詳細修改指南

### User Controller 修改示例

#### 修改前 (當前格式)
```typescript
// 獲取用戶列表
res.json({
  data: users,
  pagination: paginationInfo
});

// 獲取單個用戶
res.json({
  data: userData,
  message: "User retrieved successfully"
});

// 創建用戶
res.status(201).json({
  data: newUser,
  message: "User created successfully"
});
```

#### 修改後 (目標格式)
```typescript
// 獲取用戶列表
res.json({
  success: true,
  data: {
    users: users,
    pagination: paginationInfo
  }
});

// 獲取單個用戶
res.json({
  success: true,
  data: userData,
  message: "User retrieved successfully"
});

// 創建用戶
res.status(201).json({
  success: true,
  data: newUser,
  message: "User created successfully"
});
```

### 修改步驟

1. **檢查每個端點的回覆格式**
2. **添加 `success: true` 字段**
3. **確保數據正確包裝在 `data` 字段中**
4. **保持 `message` 字段的可選性**
5. **更新相關測試**

### 具體需要修改的文件

```typescript
// src/controllers/user.controller.ts
// 需要在所有回覆中添加 success: true 字段
```

## 測試更新

### 更新測試格式
```typescript
// 舊的測試格式
expect(response.body.data).toBeDefined();
expect(response.body.message).toBe("User retrieved successfully");

// 新的測試格式
expect(response.body.success).toBe(true);
expect(response.body.data).toBeDefined();
expect(response.body.message).toBe("User retrieved successfully");
```

## 完成標準

### 所有端點都應該：
- ✅ 包含 `success: true` 字段
- ✅ 將數據包裝在 `data` 字段中
- ✅ 可選地包含 `message` 字段
- ✅ 使用適當的 HTTP 狀態碼
- ✅ 通過統一的錯誤處理中間件處理錯誤

### 檢查清單

#### User Controller 遷移檢查清單
- [ ] 添加 `success: true` 到所有成功回覆
- [ ] 確保數據正確包裝在 `data` 字段中
- [ ] 保持 `message` 字段的一致性
- [ ] 更新相關測試案例
- [ ] 測試所有端點的回覆格式
- [ ] 確認前端兼容性

## 驗證方法

### 1. 單元測試
```bash
npm test -- --testPathPattern="user.controller.test.ts"
```

### 2. 整合測試
```bash
npm test -- --testPathPattern="user.integration.test.ts"
```

### 3. 手動測試
```bash
# 測試用戶列表端點
curl -X GET http://localhost:3000/api/v1/users

# 預期回覆格式
{
  "success": true,
  "data": {
    "users": [...],
    "pagination": {...}
  }
}
```

## 時間表

### 預估時間: 2-4 小時
- **分析**: 30 分鐘
- **修改**: 2 小時
- **測試**: 1 小時
- **文檔更新**: 30 分鐘

### 完成里程碑
- [ ] User Controller 修改完成
- [ ] 所有測試通過
- [ ] API 文檔更新
- [ ] 100% API v1 格式符合標準

---

*完成此遷移後，API v1 將實現 100% 的回覆格式標準化，確保所有端點的一致性和可預測性。*