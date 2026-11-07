# 實踐 CRUD 操作測試範本

## 概述

此測試範本用於驗證實踐 (Practice) 的完整 CRUD 操作，包括創建、讀取、更新、軟刪除，以及相關的簽到 (Check-in) 和互動功能。

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

### 1. CREATE - 創建實踐

#### 測試指令
```bash
curl -X POST http://localhost:4000/api/v1/practices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "測試實踐 - React Hooks 學習",
    "contentType": "course",
    "totalAmount": 20,
    "startDate": "2025-09-21",
    "dailyGoal": {
      "type": "time",
      "timeMinutes": 60
    },
    "practiceAction": "每天學習 1 小時的 React Hooks 課程並做實作練習",
    "tags": ["React", "Hooks", "學習"],
    "resources": [
      {
        "name": "React 官方文檔",
        "url": "https://react.dev/"
      },
      {
        "name": "React Hooks 教學影片",
        "url": "https://example.com/react-hooks-video"
      }
    ]
  }'
```

#### 預期回應
```json
{
  "success": true,
  "data": {
    "id": "practice-uuid-here",
    "title": "測試實踐 - React Hooks 學習",
    "contentType": "course",
    "customContentType": null,
    "totalAmount": 20,
    "currentAmount": 0,
    "startDate": "2025-09-21",
    "endDate": null,
    "dailyGoal": {
      "type": "time",
      "timeMinutes": 60
    },
    "practiceAction": "每天學習 1 小時的 React Hooks 課程並做實作練習",
    "status": "active",
    "tags": ["React", "Hooks", "學習"],
    "resources": [
      {
        "id": "resource-uuid-1",
        "name": "React 官方文檔",
        "url": "https://react.dev/"
      },
      {
        "id": "resource-uuid-2",
        "name": "React Hooks 教學影片",
        "url": "https://example.com/react-hooks-video"
      }
    ],
    "user": {
      "id": 2,
      "name": "",
      "_id": "",
      "roleList": [],
      "photoURL": null
    },
    "createdAt": "2025-09-21T10:00:00.000Z",
    "updatedAt": "2025-09-21T10:00:00.000Z",
    "likeCount": 0,
    "favoriteCount": 0,
    "shareCount": 0,
    "viewCount": 0,
    "checkInCount": 0,
    "completionRate": 0
  },
  "timestamp": "2025-09-21T10:00:00.000Z",
  "meta": {
    "requestId": "req_xxx",
    "processingTime": 25
  }
}
```

#### 驗證要點
- ✅ `success: true`
- ✅ 回傳的 `id` 為 UUID 格式
- ✅ 實踐狀態為 `active`
- ✅ `createdAt` 和 `updatedAt` 有值
- ✅ **重要**：沒有 `deleted_at` 欄位（表示未被軟刪除）
- ✅ 資源陣列包含兩個項目，每個都有 UUID `id`
- ✅ `currentAmount` 初始值為 0
- ✅ `completionRate` 初始值為 0

### 2. READ - 讀取實踐

#### 2.1 取得單一實踐詳情
```bash
# 使用創建步驟回傳的實踐 ID
PRACTICE_ID="從創建步驟獲得的 UUID"
curl -X GET "http://localhost:4000/api/v1/practices/$PRACTICE_ID" \
  -H "Authorization: Bearer $TOKEN"
```

#### 2.2 取得實踐列表
```bash
curl -X GET "http://localhost:4000/api/v1/practices?page=1&limit=10&status=active" \
  -H "Authorization: Bearer $TOKEN"
```

#### 2.3 取得我的實踐列表
```bash
curl -X GET "http://localhost:4000/api/v1/practices/me?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

#### 預期回應
- 回傳與創建時相同的實踐資料
- `success: true`
- 資料結構完整
- 列表查詢回傳分頁格式

#### 驗證要點
- ✅ 可以成功檢索到剛創建的實踐
- ✅ 資料與創建時一致
- ✅ 列表查詢包含新創建的實踐

### 3. UPDATE - 更新實踐 (PUT)

#### 測試指令
```bash
curl -X PUT http://localhost:4000/api/v1/practices/$PRACTICE_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "測試實踐 - React Hooks 深入學習",
    "totalAmount": 25,
    "dailyGoal": {
      "type": "completion",
      "amount": 2,
      "unit": "章"
    },
    "practiceAction": "每天完成 2 章節並做實作練習",
    "tags": ["React", "Hooks", "深入學習", "實戰"],
    "status": "active"
  }'
```

#### 預期回應
- 更新成功的回應
- 可再次查詢確認更新

#### 驗證步驟
```bash
# 驗證更新結果
curl -X GET "http://localhost:4000/api/v1/practices/$PRACTICE_ID" \
  -H "Authorization: Bearer $TOKEN"
```

#### 驗證要點
- ✅ 標題更新為 "測試實踐 - React Hooks 深入學習"
- ✅ 總量更新為 25
- ✅ 每日目標類型變更為 "completion"
- ✅ 實踐行動已更新
- ✅ 標籤增加到 4 個
- ✅ `updatedAt` 時間戳已更新

### 4. CHECKIN FUNCTIONALITY - 簽到功能測試

#### 4.1 創建簽到記錄
```bash
curl -X POST http://localhost:4000/api/v1/practices/$PRACTICE_ID/checkins \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "progress": 2,
    "note": "今天完成了兩個章節，學習了 useState 和 useEffect",
    "mood": "happy",
    "reflectionText": "對 Hooks 的概念有了更清楚的理解，實作練習很有幫助",
    "isPublic": true,
    "tags": ["React", "Hooks", "進步"]
  }'
```

#### 4.2 取得簽到記錄列表
```bash
curl -X GET "http://localhost:4000/api/v1/practices/$PRACTICE_ID/checkins?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

#### 4.3 取得簽到統計
```bash
curl -X GET "http://localhost:4000/api/v1/practices/$PRACTICE_ID/checkins/stats" \
  -H "Authorization: Bearer $TOKEN"
```

#### 4.4 取得月度簽到日曆
```bash
# 取得 2025 年 9 月的簽到日曆
curl -X GET "http://localhost:4000/api/v1/practices/$PRACTICE_ID/checkins/calendar/2025/9" \
  -H "Authorization: Bearer $TOKEN"
```

#### 驗證要點
- ✅ 簽到記錄創建成功
- ✅ 實踐的 `currentAmount` 增加 2
- ✅ `completionRate` 更新為 8%（2/25）
- ✅ 簽到統計顯示正確數據
- ✅ 月度日曆顯示今日有簽到記錄

### 5. INTERACTION FUNCTIONALITY - 互動功能測試

#### 5.1 點讚功能
```bash
# 點讚
curl -X POST http://localhost:4000/api/v1/practices/$PRACTICE_ID/like \
  -H "Authorization: Bearer $TOKEN"

# 再次點讚（取消點讚）
curl -X POST http://localhost:4000/api/v1/practices/$PRACTICE_ID/like \
  -H "Authorization: Bearer $TOKEN"
```

#### 5.2 收藏功能
```bash
# 收藏
curl -X POST http://localhost:4000/api/v1/practices/$PRACTICE_ID/favorite \
  -H "Authorization: Bearer $TOKEN"
```

#### 5.3 分享記錄
```bash
curl -X POST http://localhost:4000/api/v1/practices/$PRACTICE_ID/share \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "entityType": "practice",
    "entityId": "'$PRACTICE_ID'",
    "shareChannel": "facebook"
  }'
```

#### 5.4 瀏覽記錄
```bash
curl -X POST http://localhost:4000/api/v1/practices/$PRACTICE_ID/view \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "entityType": "practice",
    "entityId": "'$PRACTICE_ID'",
    "duration": 120
  }'
```

#### 5.5 取得互動統計
```bash
curl -X GET "http://localhost:4000/api/v1/practices/$PRACTICE_ID/stats" \
  -H "Authorization: Bearer $TOKEN"
```

#### 5.6 取得使用者互動狀態
```bash
curl -X GET "http://localhost:4000/api/v1/practices/$PRACTICE_ID/user-status" \
  -H "Authorization: Bearer $TOKEN"
```

#### 驗證要點
- ✅ 點讚狀態正確切換
- ✅ 收藏狀態正確設定
- ✅ 分享和瀏覽事件記錄成功
- ✅ 互動統計數據正確
- ✅ 使用者狀態正確顯示

### 6. STATS FUNCTIONALITY - 統計功能測試

#### 6.1 取得使用者實踐統計
```bash
curl -X GET "http://localhost:4000/api/v1/practices/stats" \
  -H "Authorization: Bearer $TOKEN"
```

#### 驗證要點
- ✅ 總實踐數量正確
- ✅ 各狀態實踐數量正確
- ✅ 總簽到次數正確
- ✅ 統計時間範圍正確

### 7. DELETE - 軟刪除實踐

#### 測試指令
```bash
curl -X DELETE http://localhost:4000/api/v1/practices/$PRACTICE_ID \
  -H "Authorization: Bearer $TOKEN"
```

#### 預期回應
```json
{
  "success": true,
  "data": {
    "message": "實踐已成功刪除"
  },
  "timestamp": "2025-09-21T10:00:00.000Z",
  "meta": {
    "requestId": "req_xxx",
    "processingTime": 15
  }
}
```

#### 驗證要點
- ✅ `success: true`
- ✅ 回傳刪除成功訊息

### 8. 驗證軟刪除效果

#### 8.1 API 查詢驗證
```bash
# 嘗試查詢已刪除的實踐
curl -X GET "http://localhost:4000/api/v1/practices/$PRACTICE_ID" \
  -H "Authorization: Bearer $TOKEN"
```

**預期結果：**
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "APP_ERROR",
    "message": "實踐不存在"
  },
  "timestamp": "2025-09-21T10:00:00.000Z",
  "meta": {
    "requestId": "req_xxx",
    "processingTime": 5
  }
}
```

#### 8.2 資料庫狀態驗證
```bash
# 檢查資料庫中的實際狀態
docker exec 87d8f2f3d0ef psql -U daodao -d daodao -c \
  "SELECT id, external_id, title, status, created_at, deleted_at FROM practices WHERE external_id = '$PRACTICE_ID';"
```

**預期結果：**
```
 id  |             external_id              |         title              | status |         created_at         |         deleted_at
-----+--------------------------------------+----------------------------+--------+----------------------------+----------------------------
 xxx | practice-uuid-here                   | 測試實踐 - React Hooks 深入學習 | active | 2025-09-21 10:00:00+00    | 2025-09-21 10:05:00+00
```

#### 驗證要點
- ✅ 實踐記錄仍存在於資料庫中
- ✅ `deleted_at` 欄位有值（軟刪除時間）
- ✅ `status` 仍為 `active`（軟刪除不改變狀態）
- ✅ API 無法查詢到已軟刪除的實踐
- ✅ 相關的簽到記錄和互動記錄仍然存在

## 測試執行腳本

### 完整自動化測試
```bash
#!/bin/bash

# 設定變數
BASE_URL="http://localhost:4000/api/v1"
TOKEN="your-jwt-token-here"

echo "🚀 開始實踐 CRUD 測試..."

# 1. 創建實踐
echo "📝 1. 創建實踐..."
RESPONSE=$(curl -s -X POST $BASE_URL/practices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "自動化測試實踐 - TypeScript 學習",
    "contentType": "book",
    "totalAmount": 15,
    "startDate": "2025-09-21",
    "dailyGoal": {
      "type": "time",
      "timeMinutes": 45
    },
    "practiceAction": "每天閱讀並實作 TypeScript 練習",
    "tags": ["TypeScript", "學習"],
    "resources": [
      {
        "name": "TypeScript 官方文檔",
        "url": "https://www.typescriptlang.org/"
      }
    ]
  }')

PRACTICE_ID=$(echo $RESPONSE | jq -r '.data.id')
echo "✅ 實踐已創建，ID: $PRACTICE_ID"

# 2. 讀取實踐
echo "📖 2. 讀取實踐..."
curl -s -X GET "$BASE_URL/practices/$PRACTICE_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.success'

# 3. 更新實踐
echo "✏️  3. 更新實踐..."
curl -s -X PUT $BASE_URL/practices/$PRACTICE_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "自動化測試實踐 - TypeScript 深入學習",
    "totalAmount": 20,
    "status": "active"
  }' | jq '.success'

# 4. 創建簽到記錄
echo "✅ 4. 創建簽到記錄..."
curl -s -X POST $BASE_URL/practices/$PRACTICE_ID/checkins \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "progress": 3,
    "note": "今天學習了 TypeScript 的泛型",
    "mood": "happy",
    "isPublic": true,
    "tags": ["TypeScript", "泛型", "進步"]
  }' | jq '.success'

# 5. 測試互動功能
echo "👍 5. 測試點讚功能..."
curl -s -X POST $BASE_URL/practices/$PRACTICE_ID/like \
  -H "Authorization: Bearer $TOKEN" | jq '.success'

echo "⭐ 6. 測試收藏功能..."
curl -s -X POST $BASE_URL/practices/$PRACTICE_ID/favorite \
  -H "Authorization: Bearer $TOKEN" | jq '.success'

# 7. 取得統計資料
echo "📊 7. 取得統計資料..."
curl -s -X GET $BASE_URL/practices/stats \
  -H "Authorization: Bearer $TOKEN" | jq '.success'

# 8. 刪除實踐
echo "🗑️  8. 刪除實踐..."
curl -s -X DELETE $BASE_URL/practices/$PRACTICE_ID \
  -H "Authorization: Bearer $TOKEN" | jq '.success'

# 9. 驗證刪除
echo "🔍 9. 驗證軟刪除..."
DELETED_RESPONSE=$(curl -s -X GET "$BASE_URL/practices/$PRACTICE_ID" \
  -H "Authorization: Bearer $TOKEN")
if echo $DELETED_RESPONSE | jq -e '.success == false' > /dev/null; then
  echo "✅ 軟刪除驗證成功：API 無法查詢已刪除實踐"
else
  echo "❌ 軟刪除驗證失敗"
fi

echo "🎉 測試完成！"
```

## 常見問題排除

### 1. 創建時立即被軟刪除
**症狀：** 創建的實踐立即有 `deleted_at` 值
**原因：** Prisma schema 中 `deleted_at` 欄位設置了 `@default(now())`
**解決：** 移除默認值設置並重新同步資料庫

### 2. 簽到記錄創建失敗
**症狀：** 簽到時回傳驗證錯誤
**原因：** progress 值或其他必填欄位格式不正確
**解決：** 確保 progress 為正數，mood 為有效枚舉值

### 3. 互動功能無回應
**症狀：** 點讚、收藏等操作無效果
**原因：** 可能缺少互動表或服務配置問題
**解決：** 檢查資料庫表結構和服務配置

### 4. 統計資料不準確
**症狀：** 統計數字與實際不符
**原因：** 快取或聚合計算問題
**解決：** 清除快取並檢查聚合查詢邏輯

## 預期行為總結

| 操作 | HTTP 方法 | 端點 | 預期狀態碼 | 主要驗證點 |
|------|----------|------|------------|-----------|
| 創建實踐 | POST | `/practices` | 201 | `deleted_at` 為空，資源正確創建 |
| 讀取實踐 | GET | `/practices/:id` | 200 | 資料完整性 |
| 讀取列表 | GET | `/practices` | 200 | 分頁和篩選功能 |
| 更新實踐 | PUT | `/practices/:id` | 200 | 更新生效 |
| 創建簽到 | POST | `/practices/:id/checkins` | 201 | 進度更新，統計正確 |
| 點讚 | POST | `/practices/:id/like` | 200 | 狀態切換 |
| 收藏 | POST | `/practices/:id/favorite` | 200 | 狀態設定 |
| 取得統計 | GET | `/practices/stats` | 200 | 數據準確 |
| 刪除實踐 | DELETE | `/practices/:id` | 200 | 軟刪除機制 |
| 查詢已刪除 | GET | `/practices/:id` | 200 | 回傳"不存在" |

## 測試成功標準

- ✅ 所有 CRUD 操作都能正常執行
- ✅ 創建的實踐 `deleted_at` 為 NULL
- ✅ 簽到功能正常運作，進度正確更新
- ✅ 互動功能（點讚、收藏、分享、瀏覽）正常
- ✅ 統計功能回傳準確數據
- ✅ 軟刪除後 API 無法查詢到實踐
- ✅ 軟刪除後資料庫記錄仍存在，`deleted_at` 有值
- ✅ 所有回應格式符合 API 規範
- ✅ 相關的簽到記錄和互動記錄在軟刪除後仍然存在

## 額外測試場景

### 邊界值測試
- 測試標題長度限制（最大 100 字）
- 測試標籤數量限制（最多 3 個）
- 測試資源數量限制（最多 5 個）
- 測試 progress 值範圍（0.01 - totalAmount）

### 錯誤處理測試
- 無效的 UUID 格式
- 未授權訪問
- 不存在的實踐 ID
- 重複簽到（同一天）
- 無效的日期格式

### 併發測試
- 同時點讚和取消點讚
- 多使用者同時簽到同一實踐
- 同時更新和刪除實踐