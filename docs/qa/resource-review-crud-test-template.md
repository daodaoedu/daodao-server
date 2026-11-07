# 資源心得評價 CRUD 操作測試範本

## 概述

此測試範本用於驗證資源心得評價 (Resource Review) 的完整 CRUD 操作，包括創建、讀取、更新、刪除、點讚等功能。資源心得評價使用嵌套路由結構：`/api/v1/resources/:resourceId/reviews`。

## 前置準備

### 認證 Token
獲取有效的 JWT token：
```bash
# 僅使用測試帳號；先在目前 shell 設定 TOKEN，不要把值寫進文件或版控。
TOKEN="${TOKEN:?請先以環境變數 TOKEN 提供測試帳號的有效 token}"
```

### 測試資源準備
首先需要創建一個測試資源用於評價：
```bash
# 1. 創建測試資源
RESOURCE_RESPONSE=$(curl -s -X POST http://localhost:4000/api/v1/resources \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "測試資源 - 用於評價測試",
    "url": "https://review-test.example.com",
    "description": "專門用於測試資源評價功能的資源",
    "type": "learning_tools",
    "cost": "free",
    "level": "beginner"
  }')

# 2. 提取資源 ID
RESOURCE_ID=$(echo $RESOURCE_RESPONSE | jq -r '.data.id')
echo "測試資源 ID: $RESOURCE_ID"
```

### 環境檢查
- ✅ 服務器運行在 `http://localhost:4000`
- ✅ 資料庫連接正常
- ✅ 認證服務可用
- ✅ 測試資源已創建

## 測試流程

### 1. CREATE - 創建資源評價

#### 測試指令
```bash
curl -X POST http://localhost:4000/api/v1/resources/$RESOURCE_ID/reviews \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "content": "這是一個用於完整 CRUD 流程測試的資源評價內容。資源很實用，推薦給初學者使用，內容結構清晰，例子豐富。特別適合初學者入門。",
    "overallImpact": 4.5,
    "changeMindset": 4.0,
    "solveProblems": 4.5,
    "gainPerspectives": 5.0,
    "achieveGoals": 4.0,
    "timeUsage": "1_2_hours_daily",
    "contentFeatures": {
      "wellStructured": true,
      "practiceFocused": true,
      "realWorldExamples": true,
      "thoughtProvoking": false,
      "progressiveLearning": true
    },
    "resourceUsage": {
      "withOnlineCourses": false,
      "withBooks": true,
      "withOtherTools": false
    },
    "status": "published",
    "tags": ["學習工具", "初學者友好", "CRUD測試"]
  }'
```

#### 預期回應
```json
{
  "success": true,
  "data": {
    "id": "123",
    "resourceId": "68b160ad-7053-4676-b5e0-8bce274b5548",
    "content": "這是一個用於完整 CRUD 流程測試的資源評價內容。資源很實用，推薦給初學者使用，內容結構清晰，例子豐富。特別適合初學者入門。",
    "overallImpact": 4.5,
    "changeMindset": 4.0,
    "solveProblems": 4.5,
    "gainPerspectives": 5.0,
    "achieveGoals": 4.0,
    "timeUsage": "1_2_hours_daily",
    "contentFeatures": {
      "wellStructured": true,
      "practiceFocused": true,
      "realWorldExamples": true,
      "thoughtProvoking": false,
      "progressiveLearning": true,
      "problemBased": false,
      "interactive": false,
      "visuallyRich": false,
      "wellRoundedConcepts": false
    },
    "resourceUsage": {
      "withOnlineCourses": false,
      "withBooks": true,
      "withOtherTools": false,
      "standalone": false
    },
    "status": "published",
    "user": {
      "id": 2,
      "name": "",
      "_id": "58b915af-c361-4900-a6af-53b082a7f62c",
      "roleList": [],
      "photoURL": null,
      "educationStage": null,
      "tagList": [],
      "selfIntroduction": null
    },
    "tags": ["學習工具", "初學者友好", "CRUD測試"],
    "likeCount": 0,
    "isLiked": false,
    "createdAt": "2025-09-20T14:00:00.000Z",
    "updatedAt": "2025-09-20T14:00:00.000Z"
  },
  "timestamp": "2025-09-20T14:00:00.000Z",
  "meta": {
    "requestId": "req_xxx",
    "processingTime": 25
  }
}
```

#### 驗證要點
- ✅ `success: true`
- ✅ 回傳的 `id` 為字符串格式 (resource_reviews 表的 id)
- ✅ 五項評分字段都存在且為有效值（支援 0.5 間距）：
  - `overallImpact`: 4.5
  - `changeMindset`: 4.0
  - `solveProblems`: 4.5
  - `gainPerspectives`: 5.0
  - `achieveGoals`: 4.0
- ✅ 狀態為 `published`
- ✅ `timeUsage` 為有效值 ("1_2_hours_daily")
- ✅ `contentFeatures` 物件包含所有布林值字段
- ✅ `resourceUsage` 物件包含所有布林值字段
- ✅ 標籤數組正確回傳
- ✅ `createdAt` 和 `updatedAt` 有值
- ✅ **重要**：沒有 `deleted_at` 欄位（表示未被軟刪除）

### 2. READ - 讀取資源評價

#### 2.1 獲取單一評價
```bash
# 使用創建步驟回傳的評價 ID
REVIEW_ID="從創建步驟獲得的 ID"
curl -X GET "http://localhost:4000/api/v1/resources/$RESOURCE_ID/reviews/$REVIEW_ID"
```

#### 2.2 獲取資源的所有評價列表
```bash
# 獲取指定資源的評價列表
curl -X GET "http://localhost:4000/api/v1/resources/$RESOURCE_ID/reviews"

# 使用分頁和過濾參數
curl -X GET "http://localhost:4000/api/v1/resources/$RESOURCE_ID/reviews?limit=10&minScore=4.0&tags=學習工具"
```

#### 預期回應 (單一評價)
- 回傳與創建時相同的評價資料
- `success: true`
- 資料結構完整

#### 預期回應 (評價列表)
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "title": "測試評價 - CRUD 驗證",
      "content": "...",
      "score": 4.5,
      "status": "published",
      "user": { "..." },
      "tags": ["學習工具", "初學者友好", "CRUD測試"],
      "likeCount": 0,
      "isLiked": false,
      "createdAt": "2025-09-20T14:00:00.000Z",
      "updatedAt": "2025-09-20T14:00:00.000Z"
    }
  ],
  "pagination": {
    "cursors": {
      "start": "cursor_start",
      "end": "cursor_end"
    },
    "hasMore": false,
    "count": 1
  },
  "timestamp": "2025-09-20T14:00:00.000Z"
}
```

#### 驗證要點
- ✅ 可以成功檢索到剛創建的評價
- ✅ 資料與創建時一致
- ✅ 列表回應包含分頁資訊
- ✅ 過濾參數正常運作

### 3. UPDATE - 更新資源評價 (PATCH)

#### 測試指令
```bash
curl -X PATCH http://localhost:4000/api/v1/resources/$RESOURCE_ID/reviews/$REVIEW_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "測試評價 - 已更新版本",
    "content": "更新後的評價內容，修改了對這個資源的看法和使用體驗。",
    "score": 5.0,
    "timeUsage": "few_intensive_days_week",
    "tags": ["學習工具", "進階用戶", "CRUD測試", "已更新"]
  }'
```

#### 預期回應
- 更新成功的回應
- 可再次查詢確認更新

#### 驗證步驟
```bash
# 驗證更新結果
curl -X GET "http://localhost:4000/api/v1/resources/$RESOURCE_ID/reviews/$REVIEW_ID"
```

#### 驗證要點
- ✅ 標題更新為 "測試評價 - 已更新版本"
- ✅ 內容已更新
- ✅ 評分變更為 5.0
- ✅ `timeUsage` 變更為 "few_intensive_days_week"
- ✅ 標籤數組已更新
- ✅ `updatedAt` 時間已更新

### 4. LIKE/UNLIKE - 點讚功能測試

#### 4.1 點讚評價
```bash
curl -X POST http://localhost:4000/api/v1/resources/$RESOURCE_ID/reviews/$REVIEW_ID/like \
  -H "Authorization: Bearer $TOKEN"
```

#### 4.2 取消點讚
```bash
curl -X DELETE http://localhost:4000/api/v1/resources/$RESOURCE_ID/reviews/$REVIEW_ID/like \
  -H "Authorization: Bearer $TOKEN"
```

#### 預期回應 (點讚)
```json
{
  "success": true,
  "data": {
    "message": "評價點讚成功",
    "likeCount": 1,
    "isLiked": true
  },
  "timestamp": "2025-09-20T14:00:00.000Z"
}
```

#### 驗證要點
- ✅ 點讚後 `likeCount` 增加
- ✅ `isLiked` 狀態正確
- ✅ 取消點讚後計數和狀態正確復原

### 5. STATUS UPDATE - 狀態更新 (需管理員權限)

#### 測試指令
```bash
# 注意：此功能需要管理員權限
curl -X PATCH http://localhost:4000/api/v1/resources/$RESOURCE_ID/reviews/$REVIEW_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "status": "archived"
  }'
```

#### 預期回應
```json
{
  "success": true,
  "data": {
    "id": 123,
    "status": "archived",
    "updatedAt": "2025-09-20T14:05:00.000Z"
  },
  "timestamp": "2025-09-20T14:05:00.000Z"
}
```

#### 驗證要點
- ✅ 狀態成功更新為 "archived"
- ✅ 非管理員用戶應該返回權限錯誤

### 6. DELETE - 軟刪除資源評價

#### 測試指令
```bash
curl -X DELETE http://localhost:4000/api/v1/resources/$RESOURCE_ID/reviews/$REVIEW_ID \
  -H "Authorization: Bearer $TOKEN"
```

#### 預期回應
```json
{
  "success": true,
  "data": {
    "message": "評價已成功刪除"
  },
  "timestamp": "2025-09-20T14:05:00.000Z",
  "meta": {
    "requestId": "req_xxx",
    "processingTime": 15
  }
}
```

#### 驗證要點
- ✅ `success: true`
- ✅ 回傳刪除成功訊息

### 7. 驗證軟刪除效果

#### 7.1 API 查詢驗證
```bash
# 嘗試查詢已刪除的評價
curl -X GET "http://localhost:4000/api/v1/resources/$RESOURCE_ID/reviews/$REVIEW_ID"
```

**預期結果：**
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "NOT_FOUND",
    "message": "評價不存在"
  },
  "timestamp": "2025-09-20T14:05:00.000Z"
}
```

#### 7.2 評價列表驗證
```bash
# 檢查評價是否從列表中移除
curl -X GET "http://localhost:4000/api/v1/resources/$RESOURCE_ID/reviews"
```

**預期結果：**
- 已刪除的評價不會出現在列表中
- 列表計數正確

#### 7.3 資料庫狀態驗證
```bash
# 檢查資料庫中的實際狀態
docker exec <container_id> psql -U daodao -d daodao -c \
  "SELECT id, title, status, created_at, deleted_at FROM resource_reviews WHERE id = $REVIEW_ID;"
```

**預期結果：**
```
 id  |       title        | status    |         created_at         |         deleted_at
-----+--------------------+-----------+----------------------------+----------------------------
 123 | 測試評價 - 已更新版本 | published | 2025-09-20 14:00:00+00    | 2025-09-20 14:05:00+00
```

#### 驗證要點
- ✅ 評價記錄仍存在於資料庫中
- ✅ `deleted_at` 欄位有值（軟刪除時間）
- ✅ `status` 仍為原狀態（軟刪除不改變狀態）
- ✅ API 無法查詢到已軟刪除的評價
- ✅ 評價列表中不包含已刪除的評價

## 進階測試案例

### 8. 權限和驗證測試

#### 8.1 未登入用戶測試
```bash
# 嘗試創建評價（無 token）
curl -X POST http://localhost:4000/api/v1/resources/$RESOURCE_ID/reviews \
  -H "Content-Type: application/json" \
  -d '{
    "title": "未授權測試",
    "content": "測試內容",
    "score": 3.0
  }'
```

**預期結果：** 401 Unauthorized

#### 8.2 無效評分測試
```bash
# 測試無效評分（不是 0.5 的倍數）
curl -X POST http://localhost:4000/api/v1/resources/$RESOURCE_ID/reviews \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "無效評分測試",
    "content": "測試內容",
    "score": 3.3
  }'
```

**預期結果：** 400 Bad Request - 評分驗證錯誤

#### 8.3 不存在的資源測試
```bash
# 測試對不存在資源創建評價
curl -X POST http://localhost:4000/api/v1/resources/non-existent-uuid/reviews \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "測試評價",
    "content": "測試內容",
    "score": 4.0
  }'
```

**預期結果：** 404 Not Found - 資源不存在

### 9. 分頁和過濾測試

#### 9.1 創建多個評價用於測試
```bash
# 創建第二個評價
curl -X POST http://localhost:4000/api/v1/resources/$RESOURCE_ID/reviews \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "第二個評價",
    "content": "另一個評價內容",
    "score": 3.5,
    "tags": ["測試", "分頁"]
  }'

# 創建第三個評價
curl -X POST http://localhost:4000/api/v1/resources/$RESOURCE_ID/reviews \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "第三個評價",
    "content": "第三個評價內容",
    "score": 2.0,
    "tags": ["測試", "低分"]
  }'
```

#### 9.2 分頁測試
```bash
# 測試分頁限制
curl -X GET "http://localhost:4000/api/v1/resources/$RESOURCE_ID/reviews?limit=2"

# 測試游標分頁
CURSOR=$(curl -s -X GET "http://localhost:4000/api/v1/resources/$RESOURCE_ID/reviews?limit=1" | jq -r '.pagination.cursors.end')
curl -X GET "http://localhost:4000/api/v1/resources/$RESOURCE_ID/reviews?cursor=$CURSOR&limit=1"
```

#### 9.3 過濾測試
```bash
# 評分過濾
curl -X GET "http://localhost:4000/api/v1/resources/$RESOURCE_ID/reviews?minScore=3.0&maxScore=4.0"

# 標籤過濾
curl -X GET "http://localhost:4000/api/v1/resources/$RESOURCE_ID/reviews?tags=測試,分頁"

# 排序測試
curl -X GET "http://localhost:4000/api/v1/resources/$RESOURCE_ID/reviews?sort=score&order=desc"
```

## 測試執行腳本

### 完整自動化測試
```bash
#!/bin/bash

# 設定變數
BASE_URL="http://localhost:4000/api/v1"
TOKEN="your-jwt-token-here"

echo "🚀 開始資源評價 CRUD 測試..."

# 1. 創建測試資源
echo "📦 1. 創建測試資源..."
RESOURCE_RESPONSE=$(curl -s -X POST $BASE_URL/resources \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "自動化測試資源 - 評價測試",
    "url": "https://auto-review-test.example.com",
    "description": "自動化評價測試用資源",
    "type": "learning_tools",
    "cost": "free",
    "level": "beginner"
  }')

RESOURCE_ID=$(echo $RESOURCE_RESPONSE | jq -r '.data.id')
echo "✅ 測試資源已創建，ID: $RESOURCE_ID"

# 2. 創建評價
echo "📝 2. 創建評價..."
REVIEW_RESPONSE=$(curl -s -X POST $BASE_URL/resources/$RESOURCE_ID/reviews \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "自動化測試評價",
    "content": "自動化測試用評價內容",
    "score": 4.5,
    "timeUsage": "1_2_hours_daily",
    "status": "published",
    "tags": ["自動化", "測試"]
  }')

REVIEW_ID=$(echo $REVIEW_RESPONSE | jq -r '.data.id')
echo "✅ 評價已創建，ID: $REVIEW_ID"

# 3. 讀取評價
echo "📖 3. 讀取評價..."
curl -s -X GET "$BASE_URL/resources/$RESOURCE_ID/reviews/$REVIEW_ID" | jq '.success'

# 4. 讀取評價列表
echo "📋 4. 讀取評價列表..."
curl -s -X GET "$BASE_URL/resources/$RESOURCE_ID/reviews" | jq '.success'

# 5. 更新評價
echo "✏️  5. 更新評價..."
curl -s -X PATCH $BASE_URL/resources/$RESOURCE_ID/reviews/$REVIEW_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "自動化測試評價 - 已更新",
    "score": 5.0,
    "tags": ["自動化", "測試", "更新"]
  }' | jq '.success'

# 6. 點讚評價
echo "👍 6. 點讚評價..."
curl -s -X POST $BASE_URL/resources/$RESOURCE_ID/reviews/$REVIEW_ID/like \
  -H "Authorization: Bearer $TOKEN" | jq '.success'

# 7. 取消點讚
echo "👎 7. 取消點讚..."
curl -s -X DELETE $BASE_URL/resources/$RESOURCE_ID/reviews/$REVIEW_ID/like \
  -H "Authorization: Bearer $TOKEN" | jq '.success'

# 8. 刪除評價
echo "🗑️  8. 刪除評價..."
curl -s -X DELETE $BASE_URL/resources/$RESOURCE_ID/reviews/$REVIEW_ID \
  -H "Authorization: Bearer $TOKEN" | jq '.success'

# 9. 驗證刪除
echo "🔍 9. 驗證軟刪除..."
DELETED_RESPONSE=$(curl -s -X GET "$BASE_URL/resources/$RESOURCE_ID/reviews/$REVIEW_ID")
if echo $DELETED_RESPONSE | jq -e '.success == false' > /dev/null; then
  echo "✅ 軟刪除驗證成功：API 無法查詢已刪除評價"
else
  echo "❌ 軟刪除驗證失敗"
fi

# 10. 清理測試資源
echo "🧹 10. 清理測試資源..."
curl -s -X DELETE $BASE_URL/resources/$RESOURCE_ID \
  -H "Authorization: Bearer $TOKEN" | jq '.success'

echo "🎉 測試完成！"
```

## 常見問題排除

### 1. 評價創建時立即被軟刪除
**症狀：** 創建的評價立即有 `deleted_at` 值
**原因：** Prisma schema 中 `deleted_at` 欄位設置了 `@default(now())`
**解決：** 移除默認值設置並重新同步資料庫

### 2. 嵌套路由參數問題
**症狀：** `resourceId` 參數無法正確傳遞
**原因：** 路由配置中缺少 `mergeParams: true`
**解決：** 確保資源評價路由使用 `Router({ mergeParams: true })`

### 3. 評分驗證錯誤
**症狀：** 有效評分被拒絕
**原因：** 評分驗證邏輯問題或精度問題
**解決：** 檢查 Zod 驗證器中的評分規則

### 4. 點讚功能異常
**症狀：** 點讚計數不正確
**原因：** 可能是競態條件或事務處理問題
**解決：** 檢查服務層的事務處理邏輯

### 5. 權限檢查失效
**症狀：** 非擁有者可以修改他人評價
**原因：** 權限中間件或服務層權限檢查問題
**解決：** 確保服務層有適當的擁有者驗證

## 預期行為總結

| 操作 | HTTP 方法 | 端點 | 預期狀態碼 | 主要驗證點 |
|------|----------|------|------------|-----------|
| 創建評價 | POST | `/resources/:resourceId/reviews` | 201 | `deleted_at` 為空 |
| 讀取評價 | GET | `/resources/:resourceId/reviews/:reviewId` | 200 | 資料完整性 |
| 讀取評價列表 | GET | `/resources/:resourceId/reviews` | 200 | 分頁資訊 |
| 更新評價 | PATCH | `/resources/:resourceId/reviews/:reviewId` | 200 | 更新生效 |
| 更新狀態 | PATCH | `/resources/:resourceId/reviews/:reviewId/status` | 200 | 權限檢查 |
| 點讚評價 | POST | `/resources/:resourceId/reviews/:reviewId/like` | 200 | 計數正確 |
| 取消點讚 | DELETE | `/resources/:resourceId/reviews/:reviewId/like` | 200 | 計數正確 |
| 刪除評價 | DELETE | `/resources/:resourceId/reviews/:reviewId` | 200 | 軟刪除機制 |
| 查詢已刪除 | GET | `/resources/:resourceId/reviews/:reviewId` | 404 | 回傳"不存在" |

## 測試執行結果 (2025-09-20)

### 已驗證功能
- ✅ **GET 資源評價列表** - `/resources/:resourceId/reviews`
  - 空列表回應格式正確
  - 分頁資訊完整 (cursors, hasMore, count等)
  - 過濾參數正常工作 (limit, minScore等)
  - 處理時間: ~10ms

- ✅ **錯誤處理機制**
  - 無效 UUID 格式正確回傳錯誤: "無效的資源ID格式"
  - 錯誤回應格式符合 API 規範

- ✅ **認證機制**
  - JWT token 認證正常工作
  - 缺少 token 時正確回傳: "缺少認證令牌"

- ✅ **資料驗證**
  - 確認需要五個評分字段: overallImpact, changeMindset, solveProblems, gainPerspectives, achieveGoals
  - 支援複雜的 contentFeatures 和 resourceUsage 物件結構

### 需要進一步測試
- ⚠️ **CREATE 操作** - 遇到內部伺服器錯誤，需要檢查服務層實現
- ⚠️ **UPDATE, DELETE, LIKE 操作** - 需要先有有效的評價資料才能測試
- ⚠️ **權限控制** - 需要測試擁有者權限和管理員權限

### 發現的問題
1. 創建評價時遇到內部伺服器錯誤 (500)，可能原因：
   - 資料庫連接問題
   - 服務層邏輯錯誤
   - 標籤處理問題
   - contentFeatures/resourceUsage 預設值問題

## 測試成功標準

- ✅ 所有 CRUD 操作都能正常執行
- ✅ 創建的評價 `deleted_at` 為 NULL
- ✅ 嵌套路由結構正常工作
- ✅ 評分驗證機制正確（0.5 間距）
- ✅ 點讚/取消點讚功能正常
- ✅ 權限控制適當（擁有者、管理員）
- ✅ 軟刪除後 API 無法查詢到評價
- ✅ 軟刪除後資料庫記錄仍存在，`deleted_at` 有值
- ✅ 分頁和過濾功能正常
- ✅ 標籤系統運作正常
- ✅ 所有回應格式符合 API 規範
- ✅ 錯誤處理和驗證機制完善