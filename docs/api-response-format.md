# API 回覆格式文件

## 概述

DaoDao 伺服器使用統一的 API 回覆格式，確保前端能夠一致地處理各種 API 響應。由於項目正在從 JavaScript 遷移到 TypeScript，目前存在兩種回覆格式。

## 成功回覆格式

### 1. TypeScript 格式（推薦）

適用於 `src/` 目錄下的新 TypeScript 控制器和服務。

#### 基本成功回覆
```json
{
  "success": true,
  "data": {
    // 實際數據內容
  }
}
```

#### 帶訊息的成功回覆
```json
{
  "success": true,
  "message": "操作成功",
  "data": {
    // 實際數據內容
  }
}
```

#### 資源列表回覆
```json
{
  "success": true,
  "data": {
    "resources": [
      // 資源列表
    ],
    "pagination": {
      "hasNext": false,
      "hasPrev": false,
      "totalCount": 0,
      "nextCursor": null,
      "prevCursor": null
    }
  }
}
```

#### 認證成功回覆
```json
{
  "success": true,
  "message": "登入成功",
  "token": "jwt-token-here",
  "user": {
    "id": 123,
    "username": "user",
    "email": "user@example.com",
    "roles": ["user"],
    "permissions": ["resource:read"]
  },
  "isTemporary": false
}
```

### 2. 傳統 JavaScript 格式

適用於根目錄控制器的舊有 JavaScript 代碼。

#### 直接數據回覆
```json
{
  "id": "uuid",
  "title": "資源標題",
  "description": "描述",
  "created_at": "2023-01-01T00:00:00Z"
}
```

#### 分頁列表回覆
```json
{
  "data": [
    // 資源列表
  ],
  "page": 1,
  "pageSize": 10,
  "totalCount": 50,
  "totalPages": 5
}
```

#### 簡單訊息回覆
```json
{
  "message": "操作成功"
}
```

## 錯誤回覆格式

所有錯誤都通過統一的錯誤處理中間件處理，返回一致的格式：

### 基本錯誤回覆
```json
{
  "error": "Error Type",
  "message": "錯誤描述"
}
```

### 帶驗證錯誤的回覆
```json
{
  "error": "Bad Request",
  "message": "請求資料格式錯誤",
  "errors": {
    "email": "郵箱格式無效",
    "password": "密碼長度不足"
  }
}
```

### 開發環境錯誤回覆
在開發環境中，錯誤回覆會包含額外的調試信息：

```json
{
  "error": "Internal Server Error",
  "message": "伺服器內部錯誤",
  "stack": "Error stack trace...",
  "name": "ErrorName"
}
```

## HTTP 狀態碼對應

### 成功狀態碼
- `200 OK` - 成功獲取資源
- `201 Created` - 成功創建資源
- `204 No Content` - 成功執行操作，無返回內容

### 錯誤狀態碼及對應的 error 字段
- `400 Bad Request` - `"Bad Request"`
- `401 Unauthorized` - `"Unauthorized"`
- `403 Forbidden` - `"Forbidden"`
- `404 Not Found` - `"Not Found"`
- `409 Conflict` - `"Conflict"`
- `500 Internal Server Error` - `"Internal Server Error"`

## 特殊回覆格式

### 認證相關

#### JWT 令牌驗證失敗
```json
{
  "error": "Unauthorized",
  "message": "無效的認證令牌"
}
```

#### 權限不足
```json
{
  "error": "Forbidden",
  "message": "缺少必要的操作權限"
}
```

### 資源相關

#### 資源不存在
```json
{
  "error": "Not Found",
  "message": "找不到請求的資源"
}
```

#### 資源衝突
```json
{
  "error": "Conflict",
  "message": "資料衝突，資源已存在"
}
```

### 檔案上傳相關

#### 檔案大小超限
```json
{
  "error": "Bad Request",
  "message": "檔案大小超過限制"
}
```

#### 不支援的檔案類型
```json
{
  "error": "Bad Request",
  "message": "不支援的檔案類型"
}
```

## 最佳實踐

### 1. 使用統一格式
新的開發應該使用 TypeScript 格式，確保回覆包含 `success` 字段和 `data` 包裝。

### 2. 適當的狀態碼
確保 HTTP 狀態碼與回覆內容匹配。

### 3. 有意義的錯誤訊息
錯誤訊息應該清晰、具體，幫助開發者和用戶理解問題。

### 4. 安全性考慮
- 不要在錯誤訊息中暴露敏感資訊
- 生產環境中隱藏詳細的錯誤堆疊

### 5. 一致的欄位命名
- 使用駝峰命名法（camelCase）
- 時間欄位使用 ISO 8601 格式
- 布林值使用 true/false

## 遷移指南

### 從 JavaScript 到 TypeScript 格式

**舊格式：**
```javascript
res.status(200).json({
  id: 1,
  name: "資源名稱"
});
```

**新格式：**
```javascript
res.status(200).json({
  success: true,
  data: {
    id: 1,
    name: "資源名稱"
  }
});
```

### 錯誤處理遷移

**舊格式：**
```javascript
res.status(400).json({
  error: "錯誤訊息"
});
```

**新格式：**
```javascript
// 使用 AppError 類和全域錯誤處理中間件
throw new BadRequestError("錯誤訊息");
```

## 範例

### 完整的用戶註冊回覆
```json
{
  "success": true,
  "message": "用戶註冊成功",
  "data": {
    "user": {
      "id": 123,
      "username": "newuser",
      "email": "newuser@example.com",
      "created_at": "2023-01-01T00:00:00Z",
      "roles": ["user"],
      "isTemporary": false
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresAt": "2023-01-02T00:00:00Z"
  }
}
```

### 資源搜尋回覆
```json
{
  "success": true,
  "data": {
    "resources": [
      {
        "id": "uuid1",
        "title": "資源標題1",
        "description": "描述1",
        "tags": ["tag1", "tag2"],
        "created_at": "2023-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "hasNext": true,
      "hasPrev": false,
      "totalCount": 25,
      "nextCursor": "cursor_string",
      "prevCursor": null
    }
  }
}
```

---

*此文件會隨著 API 的演進持續更新。如有疑問，請參考相關的 TypeScript 型別定義和測試案例。*