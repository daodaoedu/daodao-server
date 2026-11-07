# 資源 CRUD 操作測試範本

## 概述

此測試範本用於驗證資源 (Resource) 的完整 CRUD 操作，包括創建、讀取、更新和軟刪除功能。

## 前置準備

### 認證 Token
獲取有效的 JWT token：
```bash
# 僅使用測試帳號；先在目前 shell 設定 TOKEN，不要把值寫進文件或版控。
TOKEN="${TOKEN:?請先以環境變數 TOKEN 提供測試帳號的有效 token}"
```

### 環境檢查
- ✅ 服務器運行在 `http://localhost:4000`
- ✅ 資料庫連接正常
- ✅ 認證服務可用

## 測試流程

### 1. CREATE - 創建資源

#### 測試指令
```bash
curl -X POST http://localhost:4000/api/v1/resources \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "測試資源 - CRUD 驗證",
    "url": "https://crud-test.example.com",
    "description": "用於完整 CRUD 流程測試的資源",
    "type": "learning_tools",
    "cost": "free",
    "level": "beginner"
  }'
```

#### 預期回應
```json
{
  "success": true,
  "data": {
    "id": "resource-uuid-here",
    "name": "測試資源 - CRUD 驗證",
    "url": "https://crud-test.example.com",
    "imageUrl": null,
    "description": "用於完整 CRUD 流程測試的資源",
    "videoUrl": null,
    "type": "learning_tools",
    "cost": "free",
    "level": "beginner",
    "status": "active",
    "avgRating": null,
    "user": {
      "id": 2,
      "name": "",
      "_id": "",
      "roleList": [],
      "photoURL": null,
      "educationStage": null,
      "tagList": [],
      "selfIntroduction": null
    },
    "majorCategory": null,
    "subCategory": null,
    "tags": [],
    "createdAt": "2025-09-20T14:00:00.000Z",
    "updatedAt": "2025-09-20T14:00:00.000Z",
    "viewCount": 0,
    "favoriteCount": 0,
    "shareCount": 0,
    "reviewCount": 0,
    "likeCount": 0
  },
  "timestamp": "2025-09-20T14:00:00.000Z",
  "meta": {
    "requestId": "req_xxx",
    "processingTime": 20
  }
}
```

#### 驗證要點
- ✅ `success: true`
- ✅ 回傳的 `id` 為 UUID 格式
- ✅ 資源狀態為 `active`
- ✅ `createdAt` 和 `updatedAt` 有值
- ✅ **重要**：沒有 `deleted_at` 欄位（表示未被軟刪除）

### 2. READ - 讀取資源

#### 測試指令
```bash
# 使用創建步驟回傳的資源 ID
RESOURCE_ID="從創建步驟獲得的 UUID"
curl -X GET "http://localhost:4000/api/v1/resources/$RESOURCE_ID"
```

#### 預期回應
- 回傳與創建時相同的資源資料
- `success: true`
- 資料結構完整

#### 驗證要點
- ✅ 可以成功檢索到剛創建的資源
- ✅ 資料與創建時一致

### 3. UPDATE - 更新資源 (PATCH)

#### 測試指令
```bash
curl -X PATCH http://localhost:4000/api/v1/resources/$RESOURCE_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "測試資源 - 已更新",
    "description": "已更新的測試資源描述",
    "type": "books_articles",
    "cost": "paid",
    "level": "intermediate"
  }'
```

#### 預期回應
- 更新成功的回應
- 可再次查詢確認更新

#### 驗證步驟
```bash
# 驗證更新結果
curl -X GET "http://localhost:4000/api/v1/resources/$RESOURCE_ID"
```

#### 驗證要點
- ✅ 名稱更新為 "測試資源 - 已更新"
- ✅ 描述已更新
- ✅ 類型變更為 "books_articles"
- ✅ 費用變更為 "paid"
- ✅ 難度變更為 "intermediate"

### 4. DELETE - 軟刪除資源

#### 測試指令
```bash
curl -X DELETE http://localhost:4000/api/v1/resources/$RESOURCE_ID \
  -H "Authorization: Bearer $TOKEN"
```

#### 預期回應
```json
{
  "success": true,
  "data": {
    "message": "資源已成功刪除"
  },
  "timestamp": "2025-09-20T14:00:00.000Z",
  "meta": {
    "requestId": "req_xxx",
    "processingTime": 10
  }
}
```

#### 驗證要點
- ✅ `success: true`
- ✅ 回傳刪除成功訊息

### 5. 驗證軟刪除效果

#### 5.1 API 查詢驗證
```bash
# 嘗試查詢已刪除的資源
curl -X GET "http://localhost:4000/api/v1/resources/$RESOURCE_ID"
```

**預期結果：**
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "APP_ERROR",
    "message": "資源不存在"
  },
  "timestamp": "2025-09-20T14:00:00.000Z",
  "meta": {
    "requestId": "req_xxx",
    "processingTime": 5
  }
}
```

#### 5.2 資料庫狀態驗證
```bash
# 檢查資料庫中的實際狀態
docker exec 87d8f2f3d0ef psql -U daodao -d daodao -c \
  "SELECT id, external_id, name, status, created_at, deleted_at FROM resources WHERE external_id = '$RESOURCE_ID';"
```

**預期結果：**
```
 id  |             external_id              |       name        | status |         created_at         |         deleted_at
-----+--------------------------------------+-------------------+--------+----------------------------+----------------------------
 xxx | resource-uuid-here                   | 測試資源 - 已更新 | active | 2025-09-20 14:00:00+00    | 2025-09-20 14:05:00+00
```

#### 驗證要點
- ✅ 資源記錄仍存在於資料庫中
- ✅ `deleted_at` 欄位有值（軟刪除時間）
- ✅ `status` 仍為 `active`（軟刪除不改變狀態）
- ✅ API 無法查詢到已軟刪除的資源

## 測試執行腳本

### 完整自動化測試
```bash
#!/bin/bash

# 設定變數
BASE_URL="http://localhost:4000/api/v1"
TOKEN="your-jwt-token-here"

echo "🚀 開始資源 CRUD 測試..."

# 1. 創建資源
echo "📝 1. 創建資源..."
RESPONSE=$(curl -s -X POST $BASE_URL/resources \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "自動化測試資源",
    "url": "https://auto-test.example.com",
    "description": "自動化測試用資源",
    "type": "learning_tools",
    "cost": "free",
    "level": "beginner"
  }')

RESOURCE_ID=$(echo $RESPONSE | jq -r '.data.id')
echo "✅ 資源已創建，ID: $RESOURCE_ID"

# 2. 讀取資源
echo "📖 2. 讀取資源..."
curl -s -X GET "$BASE_URL/resources/$RESOURCE_ID" | jq '.success'

# 3. 更新資源
echo "✏️  3. 更新資源..."
curl -s -X PATCH $BASE_URL/resources/$RESOURCE_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "自動化測試資源 - 已更新",
    "type": "books_articles"
  }' | jq '.success'

# 4. 刪除資源
echo "🗑️  4. 刪除資源..."
curl -s -X DELETE $BASE_URL/resources/$RESOURCE_ID \
  -H "Authorization: Bearer $TOKEN" | jq '.success'

# 5. 驗證刪除
echo "🔍 5. 驗證軟刪除..."
DELETED_RESPONSE=$(curl -s -X GET "$BASE_URL/resources/$RESOURCE_ID")
if echo $DELETED_RESPONSE | jq -e '.success == false' > /dev/null; then
  echo "✅ 軟刪除驗證成功：API 無法查詢已刪除資源"
else
  echo "❌ 軟刪除驗證失敗"
fi

echo "🎉 測試完成！"
```

## 常見問題排除

### 1. 創建時立即被軟刪除
**症狀：** 創建的資源立即有 `deleted_at` 值
**原因：** Prisma schema 中 `deleted_at` 欄位設置了 `@default(now())`
**解決：** 移除默認值設置並重新同步資料庫

### 2. DELETE 操作回傳驗證錯誤
**症狀：** `Invalid input: expected string, received undefined`
**原因：** 服務回傳格式與驗證器不符
**解決：** 確保服務回傳 `{message: string}` 而非 `{success: boolean}`

### 3. 更新操作失效
**症狀：** PATCH 請求成功但資料未更新
**原因：** 可能有快取或資料庫同步問題
**解決：** 檢查資料庫連接和事務處理

## 預期行為總結

| 操作 | HTTP 方法 | 端點 | 預期狀態碼 | 主要驗證點 |
|------|----------|------|------------|-----------|
| 創建 | POST | `/resources` | 200 | `deleted_at` 為空 |
| 讀取 | GET | `/resources/:id` | 200 | 資料完整性 |
| 更新 | PATCH | `/resources/:id` | 200 | 更新生效 |
| 刪除 | DELETE | `/resources/:id` | 200 | 軟刪除機制 |
| 查詢已刪除 | GET | `/resources/:id` | 200 | 回傳"不存在" |

## 測試成功標準

- ✅ 所有 CRUD 操作都能正常執行
- ✅ 創建的資源 `deleted_at` 為 NULL
- ✅ 軟刪除後 API 無法查詢到資源
- ✅ 軟刪除後資料庫記錄仍存在，`deleted_at` 有值
- ✅ 所有回應格式符合 API 規範