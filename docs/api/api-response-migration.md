# API 回覆格式遷移文件

## 概述

本文件記錄了 DaoDao 伺服器從混合 JavaScript/TypeScript 架構遷移到統一 TypeScript 回覆格式的計劃。目標是將所有 API 端點統一為新的回覆格式：`{ success: true, data: ..., message?: string }`

## 遷移狀態摘要

- **已符合新格式**: ~35% (6/17 活躍控制器)
- **需要遷移**: ~65% (11/17 活躍控制器)
- **關鍵路徑**: 用戶管理和項目管理端點

## 新版回覆格式標準

### 成功回覆格式
```typescript
// 基本成功回覆
{
  "success": true,
  "data": {
    // 實際數據內容
  }
}

// 帶訊息的成功回覆
{
  "success": true,
  "message": "操作成功",
  "data": {
    // 實際數據內容
  }
}

// 分頁回覆
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "hasNext": boolean,
      "hasPrev": boolean,
      "totalCount": number,
      "nextCursor": string | null,
      "prevCursor": string | null
    }
  }
}
```

### 錯誤回覆格式
```typescript
{
  "error": "Error Type",
  "message": "錯誤描述",
  "errors": {  // 可選的驗證錯誤
    "field": "Field-specific error message"
  }
}
```

## 已符合新格式的控制器

### ✅ 完全符合 (src/controllers/)
這些控制器已經使用新的 TypeScript 格式：

1. **auth.controller.ts** - 認證相關
   - 所有端點使用 `{ success: true, ... }` 格式
   - 正確的錯誤處理透過中間件

2. **resource.controller.ts** - 資源管理
   - 一致的 `{ success: true, data: ... }` 格式
   - 完整的 CRUD 操作

3. **resource-review.controller.ts** - 資源評論
   - 標準化的回覆格式
   - 完整的分頁支援

4. **tag.controller.ts** - 標籤管理
   - 符合新格式標準

5. **idea.controller.ts** - 想法管理
   - 統一的回覆格式

6. **email.controller.ts** - 郵件服務
   - 使用 `{ success: true, message: ... }` 格式

## 需要遷移的控制器

### 🔴 高優先級（活躍端點）

#### 1. controllers/user.js - 用戶管理
**當前格式問題：**
```javascript
// 當前格式
res.status(200).json({
  data: formattedData,
  page,
  pageSize,
  totalCount,
  totalPages
});
```

**需要改為：**
```typescript
res.status(200).json({
  success: true,
  data: {
    users: formattedData,
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages
    }
  }
});
```

**影響端點：**
- `GET /users` - 獲取用戶列表
- `GET /users/me` - 獲取當前用戶
- `PUT /users/:id` - 更新用戶
- `DELETE /users/:id` - 刪除用戶
- `POST /users/:id/follow` - 關注用戶
- `DELETE /users/:id/unfollow` - 取消關注
- `GET /users/:id/followers` - 獲取粉絲列表

#### 2. controllers/project.js - 項目管理
**當前格式問題：**
```javascript
// 直接返回數據，缺少 success 包裝
res.status(201).json(formatProjectResponse(createdProject));
```

**需要改為：**
```typescript
res.status(201).json({
  success: true,
  data: formatProjectResponse(createdProject)
});
```

**影響端點：**
- `POST /projects` - 創建項目
- `GET /projects` - 獲取項目列表
- `GET /projects/:id` - 獲取項目詳情
- `PUT /projects/:id` - 更新項目
- `DELETE /projects/:id` - 刪除項目
- `POST /projects/:id/join` - 加入項目
- `DELETE /projects/:id/leave` - 離開項目
- `GET /projects/:id/members` - 獲取項目成員

#### 3. controllers/idea.js - 想法管理
**當前格式問題：**
```javascript
// 混合格式，缺少 success 字段
res.json({ data: formatIdeaResponse(idea) });
res.status(201).json({ 
  data: formatIdeaResponse(newIdea), 
  message: "Idea created successfully" 
});
```

**需要改為：**
```typescript
res.json({ 
  success: true, 
  data: formatIdeaResponse(idea) 
});
res.status(201).json({ 
  success: true,
  message: "Idea created successfully",
  data: formatIdeaResponse(newIdea)
});
```

**影響端點：**
- `POST /ideas` - 創建想法
- `GET /ideas` - 獲取想法列表
- `GET /ideas/:id` - 獲取想法詳情
- `PUT /ideas/:id` - 更新想法

### 🟡 中等優先級

#### 4. controllers/image.js - 文件上傳
**當前格式問題：**
```javascript
// 單個上傳
res.status(200).json({ 
  url: `${process.env.R2_PUBLIC_URL}/${uniqueFileName}` 
});

// 多個上傳
res.status(200).json({
  message: 'All images uploaded successfully',
  data: uploadResults,
});
```

**需要改為：**
```typescript
// 單個上傳
res.status(200).json({ 
  success: true,
  data: {
    url: `${process.env.R2_PUBLIC_URL}/${uniqueFileName}`
  }
});

// 多個上傳
res.status(200).json({
  success: true,
  message: 'All images uploaded successfully',
  data: uploadResults,
});
```

**影響端點：**
- `POST /images/upload` - 單個文件上傳
- `POST /images/upload/multiple` - 多個文件上傳
- `DELETE /images/:filename` - 刪除文件
- `GET /images/:filename` - 獲取文件信息

#### 5. controllers/commentController.js - 評論系統
**當前格式問題：**
```javascript
// 混合格式
res.json({ data: formatCommentResponse(comment) });
res.status(201).json({ 
  message: "Comment created successfully",
  data: formatCommentResponse(newComment)
});
```

**需要改為：**
```typescript
res.json({ 
  success: true, 
  data: formatCommentResponse(comment) 
});
res.status(201).json({ 
  success: true,
  message: "Comment created successfully",
  data: formatCommentResponse(newComment)
});
```

**影響端點：**
- `POST /comments` - 創建評論
- `GET /comments` - 獲取評論列表
- `PUT /comments/:id` - 更新評論
- `DELETE /comments/:id` - 刪除評論
- `POST /comments/:id/like` - 點讚評論

#### 6. controllers/review.js - 評論管理
**當前格式問題：**
```javascript
// 直接返回數據
res.status(200).json({
  data: formattedReviews,
  page,
  pageSize,
  totalCount,
  totalPages
});
```

**需要改為：**
```typescript
res.status(200).json({
  success: true,
  data: {
    reviews: formattedReviews,
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages
    }
  }
});
```

**影響端點：**
- `GET /reviews` - 獲取評論列表
- `POST /reviews` - 創建評論
- `GET /reviews/:id` - 獲取評論詳情
- `PUT /reviews/:id` - 更新評論
- `DELETE /reviews/:id` - 刪除評論

### 🟢 低優先級

#### 7. controllers/sendEmail.js - 郵件發送
**當前格式：**
```javascript
res.status(200).json({ 
  success: true, 
  message: 'Email sent successfully' 
});
```

**需要改為：**
```typescript
res.status(200).json({ 
  success: true, 
  message: 'Email sent successfully',
  data: {}
});
```

#### 8. controllers/verifyEmail.js - 郵件驗證
#### 9. controllers/mentor.js - 導師功能
#### 10. controllers/circle.js - 圈子管理

### 🔵 工具端點（低優先級）

#### 11. routes/dashboard.js - 管理面板
#### 12. routes/monitor.js - 系統監控
#### 13. routes/dbInfo.js - 資料庫信息

## 遷移計劃

### 階段 1: 高優先級遷移 (Week 1-2)
1. **user.js** - 用戶管理端點
2. **project.js** - 項目管理端點
3. **idea.js** - 想法管理端點

### 階段 2: 中等優先級遷移 (Week 3-4)
1. **image.js** - 文件上傳端點
2. **commentController.js** - 評論系統
3. **review.js** - 評論管理

### 階段 3: 低優先級遷移 (Week 5-6)
1. **sendEmail.js** - 郵件服務
2. **verifyEmail.js** - 郵件驗證
3. **mentor.js** - 導師功能
4. **circle.js** - 圈子管理

### 階段 4: 工具端點遷移 (Week 7)
1. **dashboard.js** - 管理面板
2. **monitor.js** - 系統監控
3. **dbInfo.js** - 資料庫信息

## 遷移最佳實踐

### 1. 創建回覆包裝函數
```typescript
// utils/response.helper.ts
export const successResponse = (data: any, message?: string) => ({
  success: true,
  ...(message && { message }),
  data
});

export const paginatedResponse = (items: any[], pagination: any, message?: string) => ({
  success: true,
  ...(message && { message }),
  data: {
    items,
    pagination
  }
});
```

### 2. 向後兼容性考慮
```typescript
// 可選：提供向後兼容的響應模式
if (req.query.legacy === 'true') {
  return res.json(legacyFormat);
}
return res.json(newFormat);
```

### 3. 測試更新
```typescript
// 更新測試以檢查新格式
expect(response.body).toEqual({
  success: true,
  data: expect.any(Object)
});
```

### 4. 錯誤處理統一
確保所有端點都使用統一的錯誤處理中間件，不要在控制器中直接返回錯誤格式。

## 風險評估

### 高風險
- **user.js** 和 **project.js** - 前端可能有直接依賴
- **image.js** - 文件上傳回覆格式變更可能影響文件管理功能

### 中風險
- **commentController.js** - 評論系統的前端整合
- **review.js** - 評論顯示邏輯

### 低風險
- 郵件相關端點 - 主要用於後端處理
- 工具端點 - 使用頻率較低

## 檢查清單

### 遷移前檢查
- [ ] 確認前端對當前 API 格式的依賴
- [ ] 準備測試計劃
- [ ] 建立回滾計劃

### 遷移中檢查
- [ ] 更新 API 端點回覆格式
- [ ] 更新相關測試
- [ ] 更新 API 文檔
- [ ] 前端適配測試

### 遷移後檢查
- [ ] 功能測試通過
- [ ] 性能測試通過
- [ ] 前端整合測試通過
- [ ] 更新監控和日誌

## 相關文件

- [API 回覆格式文件](./api-response-format.md)
- [TypeScript 遷移計劃](./typescript-migration-plan.md)
- [測試策略文件](./testing-strategy.md)

---

*此文件會隨著遷移進度持續更新。完成每個階段後，請更新相應的狀態和檢查清單。*