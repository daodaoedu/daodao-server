# 專案里程碑任務便利貼覆盤學習成果 CRUD 操作測試範本

## 概述

此測試範本用於驗證專案生態系統中里程碑、任務、便利貼、覆盤、學習成果的完整 CRUD 操作。系統採用嵌套層次結構：
- 專案 (Projects) → 里程碑 (Milestones) → 任務 (Tasks)
- 專案 (Projects) → 便利貼 (Notes)
- 專案 (Projects) → 覆盤 (Reviews)
- 專案 (Projects) → 學習成果 (Outcomes)

### API 層次結構
```
# 專案相關
/api/v1/projects/
/api/v1/projects/my
/api/v1/projects/public
/api/v1/projects/stats
/api/v1/projects/:id
/api/v1/projects/:id/duplicate

# 里程碑相關
/api/v1/projects/:projectId/milestones
/api/v1/projects/:projectId/milestones/:milestoneId

# 任務相關
/api/v1/projects/:projectId/milestones/:milestoneId/tasks
/api/v1/projects/:projectId/milestones/:milestoneId/tasks/:taskId

# 便利貼相關
/api/v1/projects/:projectId/notes
/api/v1/projects/:projectId/notes/:noteId
/api/v1/projects/notes/me
/api/v1/projects/notes/public

# 覆盤相關
/api/v1/projects/:projectId/reviews
/api/v1/projects/:projectId/reviews/:reviewId

# 學習成果相關
/api/v1/projects/:projectId/outcomes
/api/v1/projects/:projectId/outcomes/:outcomeId
/api/v1/projects/outcomes/me
```

## 前置準備

### 認證 Token
獲取有效的 JWT token：
```bash
# 僅使用測試帳號；先在目前 shell 設定 TOKEN，不要把值寫進文件或版控。
TOKEN="${TOKEN:?請先以環境變數 TOKEN 提供測試帳號的有效 token}"
```

### 測試專案準備
首先需要創建一個測試專案作為基礎：
```bash
# 1. 創建測試專案
PROJECT_RESPONSE=$(curl -s -X POST http://localhost:4000/api/v1/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "完整 CRUD 測試專案",
    "description": "用於測試里程碑、任務、便利貼、覆盤功能的專案",
    "motivation": {"type": "personal_growth"},
    "motivationDescription": "提升個人技能",
    "goal": "完成所有功能測試",
    "strategy": {"type": "structured_learning"},
    "strategyDescription": "系統性測試所有 CRUD 操作",
    "outcome": {"type": "skill_improvement"},
    "outcomeDescription": "確保所有功能正常運作",
    "isPublic": true,
    "status": "ongoing",
    "start_date": "2025-01-01",
    "end_date": "2025-12-31"
  }')

# 2. 提取專案 ID
PROJECT_ID=$(echo $PROJECT_RESPONSE | jq -r '.data.id')
echo "測試專案 ID: $PROJECT_ID"
```

### 環境檢查
- ✅ 服務器運行在 `http://localhost:4000`
- ✅ 資料庫連接正常
- ✅ 認證服務可用
- ✅ 測試專案已創建

## 第一部分：里程碑 (Milestones) CRUD 測試

### 1. CREATE - 創建里程碑

#### 測試指令
```bash
curl -X POST http://localhost:4000/api/v1/projects/$PROJECT_ID/milestones \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "position": 1,
    "name": "第一個里程碑",
    "description": "測試里程碑創建功能的第一個里程碑",
    "startDate": "2025-01-01",
    "endDate": "2025-03-31",
    "isCompleted": false
  }'
```

#### 預期回應
```json
{
  "success": true,
  "data": {
    "id": 123,
    "position": 1,
    "name": "第一個里程碑",
    "description": "測試里程碑創建功能的第一個里程碑",
    "startDate": "2025-01-01",
    "endDate": "2025-03-31",
    "isCompleted": false,
    "tasks": []
  },
  "timestamp": "2025-09-21T10:00:00.000Z"
}
```

#### 驗證要點
- ✅ `success: true`
- ✅ 回傳的 `id` 為數字格式
- ✅ 位置 `position` 正確
- ✅ 日期格式正確
- ✅ `isCompleted` 預設為 false
- ✅ `tasks` 陣列為空

### 2. READ - 讀取里程碑

#### 2.1 獲取專案的所有里程碑
```bash
curl -X GET "http://localhost:4000/api/v1/projects/$PROJECT_ID/milestones"
```

#### 預期回應
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "position": 1,
      "name": "第一個里程碑",
      "description": "測試里程碑創建功能的第一個里程碑",
      "startDate": "2025-01-01",
      "endDate": "2025-03-31",
      "isCompleted": false,
      "tasks": []
    }
  ],
  "timestamp": "2025-09-21T10:00:00.000Z"
}
```

### 3. UPDATE - 更新里程碑

#### 測試指令
```bash
MILESTONE_ID="從創建步驟獲得的 ID"
curl -X PUT http://localhost:4000/api/v1/projects/$PROJECT_ID/milestones/$MILESTONE_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "已更新的里程碑",
    "description": "更新後的里程碑描述",
    "isCompleted": true
  }'
```

### 4. DELETE - 刪除里程碑

#### 測試指令
```bash
curl -X DELETE http://localhost:4000/api/v1/projects/$PROJECT_ID/milestones/$MILESTONE_ID \
  -H "Authorization: Bearer $TOKEN"
```

## 第二部分：任務 (Tasks) CRUD 測試

### 前置條件
需要先創建里程碑才能創建任務。

### 1. CREATE - 創建任務

#### 測試指令
```bash
# 先創建里程碑
MILESTONE_RESPONSE=$(curl -s -X POST http://localhost:4000/api/v1/projects/$PROJECT_ID/milestones \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "position": 1,
    "name": "測試里程碑",
    "description": "用於任務測試的里程碑",
    "startDate": "2025-01-01",
    "endDate": "2025-03-31",
    "isCompleted": false
  }')

MILESTONE_ID=$(echo $MILESTONE_RESPONSE | jq -r '.data.id')

# 創建任務
curl -X POST http://localhost:4000/api/v1/projects/$PROJECT_ID/milestones/$MILESTONE_ID/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "第一個任務",
    "description": "測試任務創建功能",
    "priority": "high",
    "status": "pending",
    "dueDate": "2025-02-15"
  }'
```

#### 預期回應
```json
{
  "success": true,
  "data": {
    "id": 456,
    "title": "第一個任務",
    "description": "測試任務創建功能",
    "priority": "high",
    "status": "pending",
    "dueDate": "2025-02-15",
    "createdAt": "2025-09-21T10:00:00.000Z",
    "updatedAt": "2025-09-21T10:00:00.000Z"
  },
  "timestamp": "2025-09-21T10:00:00.000Z"
}
```

### 2. READ - 讀取任務

#### 2.1 獲取里程碑的任務列表
```bash
curl -X GET "http://localhost:4000/api/v1/projects/$PROJECT_ID/milestones/$MILESTONE_ID/tasks"
```

#### 2.2 獲取任務詳情
```bash
TASK_ID="從創建步驟獲得的 ID"
curl -X GET "http://localhost:4000/api/v1/projects/$PROJECT_ID/milestones/$MILESTONE_ID/tasks/$TASK_ID"
```

### 3. UPDATE - 更新任務

#### 測試指令
```bash
curl -X PUT http://localhost:4000/api/v1/projects/$PROJECT_ID/milestones/$MILESTONE_ID/tasks/$TASK_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "已更新的任務",
    "status": "in_progress",
    "priority": "medium"
  }'
```

### 4. DELETE - 刪除任務

#### 測試指令
```bash
curl -X DELETE http://localhost:4000/api/v1/projects/$PROJECT_ID/milestones/$MILESTONE_ID/tasks/$TASK_ID \
  -H "Authorization: Bearer $TOKEN"
```

## 第三部分：便利貼 (Notes) CRUD 測試

### 1. CREATE - 創建便利貼

#### 測試指令
```bash
curl -X POST http://localhost:4000/api/v1/projects/$PROJECT_ID/notes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "week": 1,
    "title": "第一週學習筆記",
    "date": "2025-01-07",
    "content": "這是第一週的學習心得和記錄。包含了重要的學習要點和反思。",
    "imgUrls": ["https://example.com/image1.jpg"],
    "videoUrls": ["https://example.com/video1.mp4"],
    "visibility": "public"
  }'
```

#### 預期回應
```json
{
  "success": true,
  "data": {
    "id": 456,
    "week": 1,
    "title": "第一週學習筆記",
    "content": "這是第一週的學習心得和記錄。包含了重要的學習要點和反思。",
    "date": "2025-01-07",
    "imgUrls": ["https://example.com/image1.jpg"],
    "videoUrls": ["https://example.com/video1.mp4"],
    "visibility": "public",
    "user": {
      "id": 2,
      "name": "",
      "_id": "58b915af-c361-4900-a6af-53b082a7f62c"
    }
  },
  "timestamp": "2025-09-21T10:00:00.000Z"
}
```

#### 驗證要點
- ✅ `success: true`
- ✅ 週數 `week` 正確
- ✅ 日期格式正確
- ✅ 媒體 URL 陣列正確
- ✅ 可見性設定正確
- ✅ 用戶資訊完整

### 2. READ - 讀取便利貼

#### 2.1 獲取專案的便利貼列表
```bash
curl -X GET "http://localhost:4000/api/v1/projects/$PROJECT_ID/notes"
```

#### 2.2 獲取便利貼詳情
```bash
NOTE_ID="從創建步驟獲得的 ID"
curl -X GET "http://localhost:4000/api/v1/projects/$PROJECT_ID/notes/$NOTE_ID"
```

#### 2.3 獲取個人便利貼列表
```bash
curl -X GET "http://localhost:4000/api/v1/projects/notes/me" \
  -H "Authorization: Bearer $TOKEN"
```

#### 2.4 獲取公開便利貼列表
```bash
curl -X GET "http://localhost:4000/api/v1/projects/notes/public"
```

### 3. UPDATE - 更新便利貼

#### 測試指令
```bash
curl -X PUT http://localhost:4000/api/v1/projects/$PROJECT_ID/notes/$NOTE_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "已更新的學習筆記",
    "content": "更新後的學習內容，包含新的見解和補充。",
    "visibility": "private"
  }'
```

### 4. DELETE - 刪除便利貼

#### 測試指令
```bash
curl -X DELETE http://localhost:4000/api/v1/projects/$PROJECT_ID/notes/$NOTE_ID \
  -H "Authorization: Bearer $TOKEN"
```

## 第四部分：學習成果 (Outcomes) CRUD 測試

### 1. CREATE - 創建學習成果

#### 測試指令
```bash
curl -X POST http://localhost:4000/api/v1/projects/$PROJECT_ID/outcomes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "week": 1,
    "title": "第一週學習成果",
    "content": "本週完成了基礎概念的學習，掌握了核心技能",
    "date": "2025-01-07",
    "learningScore": 8,
    "satisfactionScore": 9,
    "tags": ["JavaScript", "API設計", "測試"],
    "visibility": "public"
  }'
```

#### 預期回應
```json
{
  "success": true,
  "data": {
    "id": 999,
    "week": 1,
    "title": "第一週學習成果",
    "content": "本週完成了基礎概念的學習，掌握了核心技能",
    "date": "2025-01-07",
    "learningScore": 8,
    "satisfactionScore": 9,
    "tags": ["JavaScript", "API設計", "測試"],
    "visibility": "public",
    "createdAt": "2025-09-21T10:00:00.000Z",
    "user": {
      "id": 2,
      "name": "",
      "_id": "58b915af-c361-4900-a6af-53b082a7f62c"
    }
  },
  "timestamp": "2025-09-21T10:00:00.000Z"
}
```

### 2. READ - 讀取學習成果

#### 2.1 獲取專案的學習成果列表
```bash
curl -X GET "http://localhost:4000/api/v1/projects/$PROJECT_ID/outcomes"
```

#### 2.2 獲取學習成果詳情
```bash
OUTCOME_ID="從創建步驟獲得的 ID"
curl -X GET "http://localhost:4000/api/v1/projects/$PROJECT_ID/outcomes/$OUTCOME_ID"
```

#### 2.3 獲取個人學習成果列表
```bash
curl -X GET "http://localhost:4000/api/v1/projects/outcomes/me" \
  -H "Authorization: Bearer $TOKEN"
```

### 3. UPDATE - 更新學習成果

#### 測試指令
```bash
curl -X PUT http://localhost:4000/api/v1/projects/$PROJECT_ID/outcomes/$OUTCOME_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "已更新的學習成果",
    "content": "更新後的學習成果內容，包含新的見解和進步",
    "learningScore": 9,
    "satisfactionScore": 10,
    "visibility": "private"
  }'
```

### 4. DELETE - 刪除學習成果

#### 測試指令
```bash
curl -X DELETE http://localhost:4000/api/v1/projects/$PROJECT_ID/outcomes/$OUTCOME_ID \
  -H "Authorization: Bearer $TOKEN"
```

## 第五部分：覆盤 (Reviews) CRUD 測試

### 1. CREATE - 創建覆盤

#### 測試指令
```bash
curl -X POST http://localhost:4000/api/v1/projects/$PROJECT_ID/reviews \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "week": 1,
    "title": "第一週學習覆盤",
    "mood": "good",
    "stressLevel": 3,
    "moodDescription": "整體狀態良好，學習進度符合預期",
    "learningReview": 8,
    "learningFeedback": "本週掌握了核心概念，但還需要更多練習",
    "adjustmentPlan": "下週增加實作練習時間",
    "visibility": "private"
  }'
```

#### 預期回應
```json
{
  "success": true,
  "data": {
    "id": 789,
    "week": 1,
    "title": "第一週學習覆盤",
    "mood": "good",
    "stressLevel": 3,
    "moodDescription": "整體狀態良好，學習進度符合預期",
    "learningReview": "8",
    "learningFeedback": "本週掌握了核心概念，但還需要更多練習",
    "adjustmentPlan": "下週增加實作練習時間",
    "createdAt": "2025-09-21T10:00:00.000Z"
  },
  "timestamp": "2025-09-21T10:00:00.000Z"
}
```

#### 驗證要點
- ✅ `success: true`
- ✅ 心情狀態 `mood` 為有效值
- ✅ 壓力等級 `stressLevel` 在 1-10 範圍內
- ✅ 學習回顧分數 `learningReview` 在 1-10 範圍內
- ✅ 日期時間格式正確

### 2. READ - 讀取覆盤

#### 2.1 獲取專案的覆盤列表
```bash
curl -X GET "http://localhost:4000/api/v1/projects/$PROJECT_ID/reviews" \
  -H "Authorization: Bearer $TOKEN"
```

#### 2.2 獲取覆盤詳情
```bash
REVIEW_ID="從創建步驟獲得的 ID"
curl -X GET "http://localhost:4000/api/v1/projects/$PROJECT_ID/reviews/$REVIEW_ID" \
  -H "Authorization: Bearer $TOKEN"
```

### 3. UPDATE - 更新覆盤

#### 測試指令
```bash
curl -X PUT http://localhost:4000/api/v1/projects/$PROJECT_ID/reviews/$REVIEW_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "已更新的學習覆盤",
    "mood": "excellent",
    "stressLevel": 2,
    "learningReview": 9,
    "adjustmentPlan": "保持當前學習節奏，增加深度學習"
  }'
```

### 4. DELETE - 刪除覆盤

#### 測試指令
```bash
curl -X DELETE http://localhost:4000/api/v1/projects/$PROJECT_ID/reviews/$REVIEW_ID \
  -H "Authorization: Bearer $TOKEN"
```

## 第六部分：進階測試案例

### 1. 權限和驗證測試

#### 1.1 未登入用戶測試
```bash
# 嘗試創建里程碑（無 token）
curl -X POST http://localhost:4000/api/v1/projects/$PROJECT_ID/milestones \
  -H "Content-Type: application/json" \
  -d '{
    "name": "未授權測試",
    "startDate": "2025-01-01",
    "endDate": "2025-03-31"
  }'
```
**預期結果：** 401 Unauthorized

#### 1.2 無效專案 ID 測試
```bash
# 測試不存在的專案
curl -X POST http://localhost:4000/api/v1/projects/non-existent-uuid/milestones \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "測試里程碑",
    "startDate": "2025-01-01",
    "endDate": "2025-03-31"
  }'
```
**預期結果：** 404 Not Found

#### 1.3 無效資料驗證測試
```bash
# 測試無效的心情狀態
curl -X POST http://localhost:4000/api/v1/reviews/projects/$PROJECT_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "week": 1,
    "mood": "invalid_mood",
    "stressLevel": 15,
    "learningReview": 11
  }'
```
**預期結果：** 400 Bad Request

### 2. 資料完整性測試

#### 2.1 創建包含任務的里程碑
```bash
curl -X POST http://localhost:4000/api/v1/projects/$PROJECT_ID/milestones \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "position": 2,
    "name": "包含任務的里程碑",
    "description": "測試里程碑與任務的關聯",
    "startDate": "2025-04-01",
    "endDate": "2025-06-30",
    "isCompleted": false
  }'
```

#### 2.2 測試專案生命周期
```bash
# 創建多個不同週數的便利貼和覆盤
for week in {1..4}; do
  # 創建便利貼
  curl -s -X POST http://localhost:4000/api/v1/projects/$PROJECT_ID/notes \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{
      \"week\": $week,
      \"title\": \"第${week}週學習筆記\",
      \"date\": \"2025-01-$(printf %02d $((week * 7)))\",
      \"content\": \"第${week}週的學習內容記錄\",
      \"visibility\": \"public\"
    }"

  # 創建覆盤
  curl -s -X POST http://localhost:4000/api/v1/projects/$PROJECT_ID/reviews \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{
      \"week\": $week,
      \"title\": \"第${week}週覆盤\",
      \"mood\": \"good\",
      \"stressLevel\": $((week + 2)),
      \"learningReview\": $((week + 5)),
      \"visibility\": \"private\"
    }"
done
```

### 3. 分頁和過濾測試

#### 3.1 便利貼分頁測試
```bash
# 測試分頁
curl -X GET "http://localhost:4000/api/v1/projects/$PROJECT_ID/notes?page=1&pageSize=2"

# 測試週數過濾
curl -X GET "http://localhost:4000/api/v1/projects/$PROJECT_ID/notes?week=1"

# 測試可見性過濾
curl -X GET "http://localhost:4000/api/v1/projects/$PROJECT_ID/notes?visibility=public"
```

#### 3.2 覆盤過濾測試
```bash
# 測試心情過濾
curl -X GET "http://localhost:4000/api/v1/projects/$PROJECT_ID/reviews?mood=good" \
  -H "Authorization: Bearer $TOKEN"

# 測試壓力等級過濾
curl -X GET "http://localhost:4000/api/v1/projects/$PROJECT_ID/reviews?stressLevel=3" \
  -H "Authorization: Bearer $TOKEN"
```

## 測試執行腳本

### 完整自動化測試
```bash
#!/bin/bash

# 設定變數
BASE_URL="http://localhost:4000/api/v1"
TOKEN="your-jwt-token-here"

echo "🚀 開始專案生態系統 CRUD 測試..."

# 1. 創建測試專案
echo "📦 1. 創建測試專案..."
PROJECT_RESPONSE=$(curl -s -X POST $BASE_URL/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "自動化測試專案",
    "description": "完整 CRUD 功能測試",
    "isPublic": true,
    "status": "ongoing"
  }')

PROJECT_ID=$(echo $PROJECT_RESPONSE | jq -r '.data.id')
echo "✅ 測試專案已創建，ID: $PROJECT_ID"

# 2. 測試里程碑 CRUD
echo "🎯 2. 測試里程碑功能..."

# 2.1 創建里程碑
MILESTONE_RESPONSE=$(curl -s -X POST $BASE_URL/projects/$PROJECT_ID/milestones \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "position": 1,
    "name": "自動化測試里程碑",
    "description": "測試里程碑功能",
    "startDate": "2025-01-01",
    "endDate": "2025-03-31"
  }')

MILESTONE_ID=$(echo $MILESTONE_RESPONSE | jq -r '.data.id')
echo "✅ 里程碑已創建，ID: $MILESTONE_ID"

# 2.2 讀取里程碑
curl -s -X GET "$BASE_URL/projects/$PROJECT_ID/milestones" | jq '.success'

# 2.3 更新里程碑
curl -s -X PUT $BASE_URL/projects/$PROJECT_ID/milestones/$MILESTONE_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "已更新的里程碑",
    "isCompleted": true
  }' | jq '.success'

# 3. 測試便利貼 CRUD
echo "📝 3. 測試便利貼功能..."

# 3.1 創建便利貼
NOTE_RESPONSE=$(curl -s -X POST $BASE_URL/projects/$PROJECT_ID/notes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "week": 1,
    "title": "自動化測試便利貼",
    "date": "2025-01-07",
    "content": "測試便利貼內容",
    "visibility": "public"
  }')

NOTE_ID=$(echo $NOTE_RESPONSE | jq -r '.data.id')
echo "✅ 便利貼已創建，ID: $NOTE_ID"

# 3.2 讀取便利貼
curl -s -X GET "$BASE_URL/projects/$PROJECT_ID/notes" | jq '.success'

# 3.3 更新便利貼
curl -s -X PUT $BASE_URL/projects/$PROJECT_ID/notes/$NOTE_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "已更新的便利貼",
    "visibility": "private"
  }' | jq '.success'

# 4. 測試覆盤 CRUD
echo "🔄 4. 測試覆盤功能..."

# 4.1 創建覆盤
REVIEW_RESPONSE=$(curl -s -X POST $BASE_URL/projects/$PROJECT_ID/reviews \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "week": 1,
    "title": "自動化測試覆盤",
    "mood": "good",
    "stressLevel": 3,
    "learningReview": 8,
    "visibility": "private"
  }')

REVIEW_ID=$(echo $REVIEW_RESPONSE | jq -r '.data.id')
echo "✅ 覆盤已創建，ID: $REVIEW_ID"

# 4.2 讀取覆盤
curl -s -X GET "$BASE_URL/projects/$PROJECT_ID/reviews" \
  -H "Authorization: Bearer $TOKEN" | jq '.success'

# 4.3 更新覆盤
curl -s -X PUT $BASE_URL/projects/$PROJECT_ID/reviews/$REVIEW_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "已更新的覆盤",
    "mood": "excellent"
  }' | jq '.success'

# 5. 測試刪除功能
echo "🗑️ 5. 測試刪除功能..."

# 刪除覆盤
curl -s -X DELETE $BASE_URL/projects/$PROJECT_ID/reviews/$REVIEW_ID \
  -H "Authorization: Bearer $TOKEN" | jq '.success'

# 刪除便利貼
curl -s -X DELETE $BASE_URL/projects/$PROJECT_ID/notes/$NOTE_ID \
  -H "Authorization: Bearer $TOKEN" | jq '.success'

# 刪除里程碑
curl -s -X DELETE $BASE_URL/projects/$PROJECT_ID/milestones/$MILESTONE_ID \
  -H "Authorization: Bearer $TOKEN" | jq '.success'

# 6. 清理測試專案
echo "🧹 6. 清理測試專案..."
curl -s -X DELETE $BASE_URL/projects/$PROJECT_ID \
  -H "Authorization: Bearer $TOKEN" | jq '.success'

echo "🎉 測試完成！"
```

## 常見問題排除

### 1. 嵌套路由參數問題
**症狀：** `projectId` 參數無法正確傳遞
**原因：** 路由配置中缺少 `mergeParams: true`
**解決：** 確保里程碑路由使用 `Router({ mergeParams: true })`

### 2. 日期格式驗證錯誤
**症狀：** 有效日期被拒絕
**原因：** 日期格式驗證規則不一致
**解決：** 統一使用 ISO 8601 格式 (YYYY-MM-DD)

### 3. 權限檢查失效
**症狀：** 非擁有者可以修改他人內容
**原因：** 權限中間件或服務層權限檢查問題
**解決：** 確保所有更新和刪除操作都有適當的擁有者驗證

### 4. 分頁參數處理
**症狀：** 分頁參數無法正常工作
**原因：** 查詢參數驗證或處理邏輯問題
**解決：** 檢查驗證器中的分頁參數定義

### 5. 媒體文件處理
**症狀：** 圖片和影片 URL 無法正常儲存
**原因：** URL 驗證或陣列處理問題
**解決：** 確保 URL 陣列正確序列化和反序列化

## 預期行為總結

| 功能 | HTTP 方法 | 端點 | 預期狀態碼 | 主要驗證點 |
|------|----------|------|------------|-----------|
| 創建里程碑 | POST | `/projects/:projectId/milestones` | 201 | 嵌套參數處理 |
| 讀取里程碑 | GET | `/projects/:projectId/milestones` | 200 | 資料完整性 |
| 更新里程碑 | PUT | `/projects/:projectId/milestones/:milestoneId` | 200 | 權限檢查 |
| 刪除里程碑 | DELETE | `/projects/:projectId/milestones/:milestoneId` | 200 | 軟刪除機制 |
| 創建便利貼 | POST | `/notes/projects/:projectId` | 201 | 媒體文件處理 |
| 讀取便利貼 | GET | `/notes/projects/:projectId` | 200 | 分頁和過濾 |
| 更新便利貼 | PUT | `/notes/projects/:projectId/:noteId` | 200 | 可見性控制 |
| 刪除便利貼 | DELETE | `/notes/projects/:projectId/:noteId` | 200 | 擁有者權限 |
| 創建覆盤 | POST | `/reviews/projects/:projectId` | 201 | 心情和等級驗證 |
| 讀取覆盤 | GET | `/reviews/projects/:projectId` | 200 | 私密性保護 |
| 更新覆盤 | PUT | `/reviews/projects/:projectId/:reviewId` | 200 | 資料類型驗證 |
| 刪除覆盤 | DELETE | `/reviews/projects/:projectId/:reviewId` | 200 | 擁有者權限 |

## 測試成功標準

- ✅ 所有 CRUD 操作都能正常執行
- ✅ 嵌套路由結構正常工作
- ✅ 參數傳遞和驗證機制正確
- ✅ 權限控制適當（擁有者、管理員）
- ✅ 資料類型驗證機制完善
- ✅ 分頁和過濾功能正常
- ✅ 媒體文件和 URL 處理正常
- ✅ 可見性和私密性控制正確
- ✅ 所有回應格式符合 API 規範
- ✅ 錯誤處理和驗證機制完善
- ✅ 專案生態系統各組件間協調運作