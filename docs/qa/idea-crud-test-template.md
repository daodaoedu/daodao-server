# 想法 CRUD 操作測試範本

## 概述

此測試範本用於驗證想法 (Idea) 的完整 CRUD 操作，包括創建、讀取、更新、刪除等功能。想法使用直接路由結構：`/api/v1/ideas`。

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

### 1. CREATE - 創建想法

#### 測試指令
```bash
curl -X POST http://localhost:4000/api/v1/ideas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "content": "我想要開發一個學習進度追蹤應用程式，幫助學習者更好地管理自己的學習計劃。這個應用可以追蹤每日學習時間、完成的課程章節，並提供個人化的學習建議。",
    "tags": ["前端開發", "React", "學習工具", "CRUD測試"],
    "resources": [
      {
        "name": "React 官方文檔",
        "url": "https://reactjs.org/docs",
        "description": "React 的官方文檔，包含完整的 API 參考和教學"
      },
      {
        "name": "學習追蹤應用設計指南",
        "url": "https://uxdesign.cc/learning-tracker-app",
        "description": "關於學習追蹤應用的用戶體驗設計指南"
      }
    ]
  }'
```

#### 預期回應
```json
{
  "success": true,
  "data": {
    "id": "6da30aba-6952-44de-a481-b6c60fd4039e",
    "content": "我想要開發一個學習進度追蹤應用程式，幫助學習者更好地管理自己的學習計劃。這個應用可以追蹤每日學習時間、完成的課程章節，並提供個人化的學習建議。",
    "tags": ["前端開發", "React", "學習工具", "CRUD測試"],
    "resources": [
      {
        "name": "React 官方文檔",
        "url": "https://reactjs.org/docs",
        "description": "React 的官方文檔，包含完整的 API 參考和教學"
      }
    ],
    "status": "active",
    "user": {
      "id": "2",
      "name": "小許",
      "photoUrl": "https://lh3.googleusercontent.com/a/ACg8ocJ3YjTVznTRc8401zw3ta7c3QaZYb5lDy3497cbCmZYM79s3LoZ=s96-c"
    },
    "hasResources": true,
    "resourceCount": 1,
    "likeCount": 0,
    "commentCount": 0,
    "viewCount": 0,
    "shareCount": 0,
    "isLiked": false,
    "isFavorited": false,
    "createdAt": "2025-09-20T16:37:17.464Z",
    "updatedAt": "2025-09-20T16:37:17.464Z"
  },
  "timestamp": "2025-09-20T16:37:17.470Z",
  "meta": {
    "cacheHit": false,
    "requestId": "req_1758386237464_abc123def",
    "processingTime": 134
  }
}
```

#### 驗證要點
- ✅ `success: true`
- ✅ 回傳的 `id` 為 UUID 格式
- ✅ 內容正確儲存，不超過 5000 字限制
- ✅ 標籤陣列正確回傳，最多 10 個
- ✅ 資源陣列正確回傳，最多 5 個（如果有提供）
- ✅ 初始狀態為 `active`
- ✅ 包含用戶資訊（id, name, photoUrl）
- ✅ 包含 `hasResources` 和 `resourceCount` 字段
- ✅ 初始計數器都為 0（likeCount, commentCount, viewCount, shareCount）
- ✅ `createdAt` 和 `updatedAt` 有值
- ✅ 包含 `isLiked` 和 `isFavorited` 狀態字段

### 2. READ - 讀取想法

#### 2.1 獲取單一想法
```bash
# 使用創建步驟回傳的想法 ID
IDEA_ID="從創建步驟獲得的 ID"
curl -X GET "http://localhost:4000/api/v1/ideas/$IDEA_ID"
```

#### 2.2 獲取想法列表
```bash
# 獲取想法列表
curl -X GET "http://localhost:4000/api/v1/ideas"

# 使用分頁和過濾參數
curl -X GET "http://localhost:4000/api/v1/ideas?limit=10&query=學習&tags=前端開發,React&status=active"
```

#### 預期回應 (單一想法)
- 回傳與創建時相同的想法資料
- `success: true`
- 資料結構完整
- 如果已登入，包含 `isLiked` 和 `isFavorited` 狀態

#### 預期回應 (想法列表)
```json
{
  "success": true,
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "_id": "507f1f77bcf86cd799439011",
      "content": "我想要開發一個學習進度追蹤應用程式...",
      "tags": ["前端開發", "React", "學習工具", "CRUD測試"],
      "status": "draft",
      "userId": 2,
      "likeCount": 0,
      "viewCount": 0,
      "shareCount": 0,
      "createdAt": "2025-09-21T14:00:00.000Z",
      "updatedAt": "2025-09-21T14:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalItems": 1,
    "itemsPerPage": 20,
    "hasNext": false,
    "hasPrev": false
  },
  "timestamp": "2025-09-21T14:00:00.000Z"
}
```

#### 驗證要點
- ✅ 可以成功檢索到剛創建的想法
- ✅ 資料與創建時一致
- ✅ 列表回應包含分頁資訊
- ✅ 過濾參數正常運作（query、tags、status）
- ✅ 排序參數正常運作（sort、order）

### 3. UPDATE - 更新想法 (PATCH)

#### 測試指令
```bash
curl -X PATCH http://localhost:4000/api/v1/ideas/$IDEA_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "content": "更新後的想法內容：我想要開發一個全功能的學習進度追蹤應用程式，包含社群功能和 AI 推薦系統。",
    "tags": ["前端開發", "React", "學習工具", "AI", "社群功能", "CRUD測試更新"],
    "status": "active",
    "resources": [
      {
        "name": "React 官方文檔",
        "url": "https://reactjs.org/docs",
        "description": "React 的官方文檔，包含完整的 API 參考和教學"
      },
      {
        "name": "AI 推薦系統設計",
        "url": "https://developers.google.com/machine-learning/recommendation",
        "description": "Google 的推薦系統設計指南"
      },
      {
        "name": "社群功能開發指南",
        "url": "https://docs.github.com/en/communities",
        "description": "如何在應用中建立有效的社群功能"
      }
    ]
  }'
```

#### 預期回應
- 更新成功的回應
- 內容、標籤、狀態、資源都已更新
- `updatedAt` 時間已更新

#### 驗證步驟
```bash
# 驗證更新結果
curl -X GET "http://localhost:4000/api/v1/ideas/$IDEA_ID"
```

#### 驗證要點
- ✅ 內容已更新為新的內容
- ✅ 標籤陣列已更新
- ✅ 狀態變更為 "active"
- ✅ 資源陣列已更新，包含 3 個資源
- ✅ `updatedAt` 時間已更新
- ✅ `createdAt` 時間保持不變

### 4. DELETE - 軟刪除想法

#### 測試指令
```bash
curl -X DELETE http://localhost:4000/api/v1/ideas/$IDEA_ID \
  -H "Authorization: Bearer $TOKEN"
```

#### 預期回應
```json
{
  "success": true,
  "data": {
    "message": "想法刪除成功",
    "deletedId": "123e4567-e89b-12d3-a456-426614174000"
  },
  "timestamp": "2025-09-21T14:05:00.000Z"
}
```

#### 驗證要點
- ✅ `success: true`
- ✅ 回傳刪除成功訊息
- ✅ 回傳被刪除的想法 ID

### 5. 驗證軟刪除效果

#### 5.1 API 查詢驗證
```bash
# 嘗試查詢已刪除的想法
curl -X GET "http://localhost:4000/api/v1/ideas/$IDEA_ID"
```

**預期結果：**
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "NOT_FOUND",
    "message": "想法不存在"
  },
  "timestamp": "2025-09-21T14:05:00.000Z"
}
```

#### 5.2 想法列表驗證
```bash
# 檢查想法是否從列表中移除
curl -X GET "http://localhost:4000/api/v1/ideas"
```

**預期結果：**
- 已刪除的想法不會出現在列表中
- 列表計數正確

#### 5.3 資料庫狀態驗證
```bash
# 檢查資料庫中的實際狀態（需要資料庫訪問權限）
docker exec <container_id> psql -U daodao -d daodao -c \
  "SELECT id, content, status, created_at, deleted_at FROM ideas WHERE id = '$IDEA_ID';"
```

**預期結果：**
```
 id                                   |       content        | status | created_at                 | deleted_at
--------------------------------------+----------------------+--------+----------------------------+----------------------------
 123e4567-e89b-12d3-a456-426614174000| 更新後的想法內容...    | active | 2025-09-21 14:00:00+00    | 2025-09-21 14:05:00+00
```

#### 驗證要點
- ✅ 想法記錄仍存在於資料庫中
- ✅ `deleted_at` 欄位有值（軟刪除時間）
- ✅ `status` 仍為原狀態（軟刪除不改變狀態）
- ✅ API 無法查詢到已軟刪除的想法
- ✅ 想法列表中不包含已刪除的想法

## 進階測試案例

### 6. 權限和驗證測試

#### 6.1 未登入用戶測試
```bash
# 嘗試創建想法（無 token）
curl -X POST http://localhost:4000/api/v1/ideas \
  -H "Content-Type: application/json" \
  -d '{
    "content": "未授權測試想法",
    "tags": ["測試"]
  }'
```

**預期結果：** 401 Unauthorized

#### 6.2 內容長度驗證測試
```bash
# 測試過長內容（超過 5000 字）
curl -X POST http://localhost:4000/api/v1/ideas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "content": "' + 'A'.repeat(5001) + '",
    "tags": ["長度測試"]
  }'
```

**預期結果：** 400 Bad Request - 內容長度驗證錯誤

#### 6.3 標籤數量驗證測試
```bash
# 測試過多標籤（超過 10 個）
curl -X POST http://localhost:4000/api/v1/ideas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "content": "標籤過多測試",
    "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8", "tag9", "tag10", "tag11"]
  }'
```

**預期結果：** 400 Bad Request - 標籤數量驗證錯誤

#### 6.4 資源數量驗證測試
```bash
# 測試過多資源（超過 5 個）
curl -X POST http://localhost:4000/api/v1/ideas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "content": "資源過多測試",
    "tags": ["測試"],
    "resources": [
      {"name": "Resource 1", "url": "https://example1.com"},
      {"name": "Resource 2", "url": "https://example2.com"},
      {"name": "Resource 3", "url": "https://example3.com"},
      {"name": "Resource 4", "url": "https://example4.com"},
      {"name": "Resource 5", "url": "https://example5.com"},
      {"name": "Resource 6", "url": "https://example6.com"}
    ]
  }'
```

**預期結果：** 400 Bad Request - 資源數量驗證錯誤

#### 6.5 無效 URL 驗證測試
```bash
# 測試無效的資源 URL
curl -X POST http://localhost:4000/api/v1/ideas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "content": "無效 URL 測試",
    "tags": ["測試"],
    "resources": [
      {"name": "Invalid Resource", "url": "not-a-valid-url"}
    ]
  }'
```

**預期結果：** 400 Bad Request - URL 格式驗證錯誤

#### 6.6 非 HTTPS URL 驗證測試
```bash
# 測試非 HTTPS 的 URL
curl -X POST http://localhost:4000/api/v1/ideas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "content": "非 HTTPS URL 測試",
    "tags": ["測試"],
    "resources": [
      {"name": "HTTP Resource", "url": "http://example.com"}
    ]
  }'
```

**預期結果：** 400 Bad Request - HTTPS 要求驗證錯誤

### 7. 分頁和過濾測試

#### 7.1 創建多個想法用於測試
```bash
# 創建第二個想法
curl -X POST http://localhost:4000/api/v1/ideas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "content": "第二個測試想法：開發一個開源的程式碼分享平台",
    "tags": ["開源", "程式碼分享", "社群"],
    "status": "active"
  }'

# 創建第三個想法
curl -X POST http://localhost:4000/api/v1/ideas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "content": "第三個測試想法：AI 輔助的學習路徑規劃系統",
    "tags": ["AI", "學習路徑", "教育科技"],
    "status": "draft"
  }'
```

#### 7.2 分頁測試
```bash
# 測試分頁限制
curl -X GET "http://localhost:4000/api/v1/ideas?limit=2"

# 測試頁碼
curl -X GET "http://localhost:4000/api/v1/ideas?page=1&limit=1"
curl -X GET "http://localhost:4000/api/v1/ideas?page=2&limit=1"
```

#### 7.3 過濾測試
```bash
# 關鍵詞搜尋
curl -X GET "http://localhost:4000/api/v1/ideas?query=學習"

# 標籤過濾
curl -X GET "http://localhost:4000/api/v1/ideas?tags=AI,學習路徑"

# 狀態過濾
curl -X GET "http://localhost:4000/api/v1/ideas?status=active"
curl -X GET "http://localhost:4000/api/v1/ideas?status=draft"

# 用戶 ID 過濾
curl -X GET "http://localhost:4000/api/v1/ideas?userId=2"

# 排序測試
curl -X GET "http://localhost:4000/api/v1/ideas?sort=createdAt&order=asc"
curl -X GET "http://localhost:4000/api/v1/ideas?sort=updatedAt&order=desc"
curl -X GET "http://localhost:4000/api/v1/ideas?sort=likeCount&order=desc"
```

#### 7.4 組合過濾測試
```bash
# 複合條件測試
curl -X GET "http://localhost:4000/api/v1/ideas?query=學習&status=active&sort=createdAt&order=desc&limit=5"
```

### 8. 邊界條件測試

#### 8.1 空內容測試
```bash
curl -X POST http://localhost:4000/api/v1/ideas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "content": "",
    "tags": ["測試"]
  }'
```

**預期結果：** 400 Bad Request - 內容不能為空

#### 8.2 極限長度測試
```bash
curl -X POST http://localhost:4000/api/v1/ideas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "content": "' + 'A'.repeat(5000) + '",
    "tags": ["長度測試"]
  }'
```

**預期結果：** 201 Created - 正好 5000 字符應該成功

#### 8.3 特殊字符測試
```bash
curl -X POST http://localhost:4000/api/v1/ideas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "content": "測試特殊字符：🚀 Hello World! @#$%^&*()_+ 中文測試 العربية 日本語",
    "tags": ["特殊字符", "Unicode", "測試"]
  }'
```

**預期結果：** 201 Created - 應該正確處理 Unicode 字符

## 測試執行腳本

### 完整自動化測試
```bash
#!/bin/bash

# 設定變數
BASE_URL="http://localhost:4000/api/v1"
TOKEN="your-jwt-token-here"

echo "🚀 開始想法 CRUD 測試..."

# 1. 創建想法
echo "📝 1. 創建想法..."
IDEA_RESPONSE=$(curl -s -X POST $BASE_URL/ideas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "content": "自動化測試想法：開發一個全方位的學習平台",
    "tags": ["自動化", "測試", "學習平台"],
    "resources": [{
      "name": "測試資源",
      "url": "https://example.com",
      "description": "測試用資源"
    }]
  }')

IDEA_ID=$(echo $IDEA_RESPONSE | jq -r '.data.idea.id')
echo "✅ 想法已創建，ID: $IDEA_ID"

# 2. 讀取想法
echo "📖 2. 讀取想法..."
curl -s -X GET "$BASE_URL/ideas/$IDEA_ID" | jq '.success'

# 3. 讀取想法列表
echo "📋 3. 讀取想法列表..."
curl -s -X GET "$BASE_URL/ideas" | jq '.success'

# 4. 更新想法
echo "✏️  4. 更新想法..."
curl -s -X PATCH $BASE_URL/ideas/$IDEA_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "content": "自動化測試想法 - 已更新版本",
    "status": "active",
    "tags": ["自動化", "測試", "學習平台", "更新"]
  }' | jq '.success'

# 5. 刪除想法
echo "🗑️  5. 刪除想法..."
curl -s -X DELETE $BASE_URL/ideas/$IDEA_ID \
  -H "Authorization: Bearer $TOKEN" | jq '.success'

# 6. 驗證刪除
echo "🔍 6. 驗證軟刪除..."
DELETED_RESPONSE=$(curl -s -X GET "$BASE_URL/ideas/$IDEA_ID")
if echo $DELETED_RESPONSE | jq -e '.success == false' > /dev/null; then
  echo "✅ 軟刪除驗證成功：API 無法查詢已刪除想法"
else
  echo "❌ 軟刪除驗證失敗"
fi

echo "🎉 測試完成！"
```

## 常見問題排除

### 1. 想法創建時立即被軟刪除
**症狀：** 創建的想法立即有 `deleted_at` 值
**原因：** Prisma schema 中 `deleted_at` 欄位設置了 `@default(now())`
**解決：** 移除默認值設置並重新同步資料庫

### 2. 認證問題
**症狀：** 返回 401 Unauthorized
**原因：** Token 過期或無效
**解決：** 重新獲取有效的 JWT token

### 3. 內容長度問題
**症狀：** 有效內容被拒絕
**原因：** 前端計算字符數可能與後端不一致
**解決：** 檢查 UTF-8 字符編碼處理

### 4. 標籤處理異常
**症狀：** 標籤保存失敗
**原因：** 標籤處理邏輯問題
**解決：** 檢查標籤服務的實現

### 5. 資源 URL 驗證問題
**症狀：** 有效 HTTPS URL 被拒絕
**原因：** URL 驗證邏輯過於嚴格
**解決：** 檢查 Zod 驗證器中的 URL 規則

## 預期行為總結

| 操作 | HTTP 方法 | 端點 | 預期狀態碼 | 主要驗證點 |
|------|----------|------|------------|-----------|
| 創建想法 | POST | `/ideas` | 201 | `deleted_at` 為空，狀態為 draft |
| 讀取想法 | GET | `/ideas/:id` | 200 | 資料完整性 |
| 讀取想法列表 | GET | `/ideas` | 200 | 分頁資訊 |
| 更新想法 | PATCH | `/ideas/:id` | 200 | 更新生效 |
| 刪除想法 | DELETE | `/ideas/:id` | 200 | 軟刪除機制 |
| 查詢已刪除 | GET | `/ideas/:id` | 404 | 回傳"不存在" |

## 測試成功標準

- ✅ 所有 CRUD 操作都能正常執行
- ✅ 創建的想法 `deleted_at` 為 NULL
- ✅ 內容驗證機制正確（長度限制、必填檢查）
- ✅ 標籤系統運作正常（數量限制、格式檢查）
- ✅ 資源系統運作正常（數量限制、URL 驗證）
- ✅ 權限控制適當（創建者權限檢查）
- ✅ 軟刪除後 API 無法查詢到想法
- ✅ 軟刪除後資料庫記錄仍存在，`deleted_at` 有值
- ✅ 分頁和過濾功能正常
- ✅ 排序功能運作正常
- ✅ 所有回應格式符合 API 規範
- ✅ 錯誤處理和驗證機制完善

## 測試報告範本

### 測試執行結果 (日期: YYYY-MM-DD)

#### 已驗證功能
- ✅ **創建想法** - 基本功能正常
- ✅ **讀取想法** - 單一和列表查詢正常
- ✅ **更新想法** - 部分更新功能正常
- ✅ **刪除想法** - 軟刪除機制正常
- ✅ **權限控制** - 認證和授權檢查正常
- ✅ **資料驗證** - 所有輸入驗證正常
- ✅ **分頁過濾** - 查詢參數正常工作

#### 發現的問題
1. **問題描述** - 問題詳情和重現步驟
2. **問題影響** - 對功能的影響程度
3. **建議解決** - 修復建議

#### 性能指標
- 平均回應時間: XX ms
- 創建操作: XX ms
- 查詢操作: XX ms
- 更新操作: XX ms
- 刪除操作: XX ms