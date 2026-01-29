# 主題實踐功能 - 手動測試計畫

> 版本：1.0.0
> 最後更新：2025-01-27
> 適用環境：開發環境 / Staging 環境

---

## 目錄

1. [測試前準備](#測試前準備)
2. [測試環境設定](#測試環境設定)
3. [API 測試案例](#api-測試案例)
   - [A. 實踐管理](#a-實踐管理)
   - [B. 打卡功能](#b-打卡功能)
   - [C. 社群互動](#c-社群互動)
   - [D. 模板與輔助功能](#d-模板與輔助功能)
   - [E. 狀態管理](#e-狀態管理)
4. [業務邏輯驗證](#業務邏輯驗證)
5. [Email 自動化測試](#email-自動化測試)
6. [錯誤處理測試](#錯誤處理測試)
7. [測試結果記錄表](#測試結果記錄表)

---

## 測試前準備

### 必要工具

- [ ] Postman / Insomnia / curl
- [ ] 有效的 JWT Token（測試用戶）
- [ ] 資料庫存取權限（驗證資料）
- [ ] Redis 存取權限（檢查郵件隊列）

### 測試帳號

| 角色 | 用途 |
|------|------|
| 測試用戶 A | 主要測試帳號，建立和管理實踐 |
| 測試用戶 B | 次要帳號，測試權限和社群互動 |

### 取得 JWT Token

```bash
# 登入取得 Token
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password"}'
```

---

## 測試環境設定

### 環境變數確認

```bash
# 確認服務運行
curl http://localhost:3000/health

# 確認資料庫連線
curl http://localhost:3000/api/v1/practices/stats
```

### 清理測試資料（可選）

```sql
-- 清除測試用戶的實踐資料（謹慎使用）
DELETE FROM practice_checkins WHERE user_id = {test_user_id};
DELETE FROM practices WHERE user_id = {test_user_id};
```

---

## API 測試案例

### A. 實踐管理

#### A-1. 建立實踐

| 項目 | 內容 |
|------|------|
| **端點** | `POST /api/v1/practices` |
| **驗證** | 必需 |
| **前置條件** | 已登入 |

**測試步驟：**

1. 準備請求資料：
```json
{
  "title": "每日閱讀 30 分鐘",
  "practiceAction": "閱讀技術書籍或文章",
  "startDate": "2025-02-01",
  "durationDays": 14,
  "frequencyMinDays": 4,
  "frequencyMaxDays": 7,
  "sessionDurationMinutes": 30,
  "practiceTimePeriods": ["morning", "evening"],
  "tags": ["閱讀", "學習"],
  "resources": [
    { "name": "好書推薦清單", "url": "https://example.com/books" }
  ]
}
```

2. 發送請求
3. 驗證回應

**預期結果：**
- [ ] HTTP 201 Created
- [ ] 回傳 `success: true`
- [ ] `progressPercentage` = 20
- [ ] `status` = "not_started"
- [ ] `endDate` 自動計算正確（startDate + durationDays - 1）
- [ ] 資料庫有新記錄

**測試變體：**

| 變體 | 說明 | 預期結果 |
|------|------|---------|
| A-1-a | 開始日期為今天 | 成功建立 |
| A-1-b | 開始日期為 14 天後 | 成功建立 |
| A-1-c | 開始日期超過 14 天後 | 400 錯誤 |
| A-1-d | 缺少必填欄位 title | 400 錯誤 |
| A-1-e | durationDays = 0 | 400 錯誤 |
| A-1-f | 使用模板建立（含 templateId） | 成功，關聯模板 |

---

#### A-2. 取得實踐列表（公開）

| 項目 | 內容 |
|------|------|
| **端點** | `GET /api/v1/practices` |
| **驗證** | 可選 |

**測試步驟：**

1. 不帶 Token 請求
2. 帶 Token 請求
3. 使用篩選參數

**測試參數組合：**

| 測試 | 參數 | 預期 |
|------|------|------|
| A-2-a | 無參數 | 返回分頁列表 |
| A-2-b | `?status=active` | 僅返回進行中實踐 |
| A-2-c | `?search=閱讀` | 標題包含「閱讀」 |
| A-2-d | `?page=1&limit=10` | 分頁正確 |
| A-2-e | `?sortBy=createdAt&sortOrder=desc` | 按建立時間降序 |

**預期結果：**
- [ ] HTTP 200 OK
- [ ] 包含 `pagination` 物件
- [ ] `hasNext` / `hasPrev` 正確

---

#### A-3. 取得我的實踐列表

| 項目 | 內容 |
|------|------|
| **端點** | `GET /api/v1/practices/me` |
| **驗證** | 必需 |

**測試步驟：**

1. 帶 Token 請求
2. 不帶 Token 請求

**測試參數組合：**

| 測試 | 參數 | 預期 |
|------|------|------|
| A-3-a | 無參數 | 返回當前用戶所有實踐 |
| A-3-b | `?status=not_started` | 僅返回未開始的 |
| A-3-c | `?status=active` | 僅返回進行中的 |
| A-3-d | 無 Token | 401 Unauthorized |

---

#### A-4. 取得實踐詳情

| 項目 | 內容 |
|------|------|
| **端點** | `GET /api/v1/practices/{id}` |
| **驗證** | 可選 |

**測試案例：**

| 測試 | 條件 | 預期 |
|------|------|------|
| A-4-a | 有效 ID | 返回完整詳情 |
| A-4-b | 不存在的 ID | 404 Not Found |
| A-4-c | 無效格式 ID | 400 Bad Request |
| A-4-d | 已刪除的實踐 | 404 Not Found |

---

#### A-5. 更新實踐

| 項目 | 內容 |
|------|------|
| **端點** | `PUT /api/v1/practices/{id}` |
| **驗證** | 必需 |

**測試案例（未打卡狀態）：**

| 測試 | 更新內容 | 預期 |
|------|---------|------|
| A-5-a | 修改 title | 成功 |
| A-5-b | 修改 startDate | 成功 |
| A-5-c | 修改 frequencyMinDays | 成功 |
| A-5-d | 修改 durationDays | 成功 |

**測試案例（已打卡狀態）：**

| 測試 | 更新內容 | 預期 |
|------|---------|------|
| A-5-e | 修改 title | 成功 |
| A-5-f | 修改 startDate | **400 錯誤（鎖定）** |
| A-5-g | 修改 frequencyMinDays | **400 錯誤（鎖定）** |
| A-5-h | 修改 durationDays | **400 錯誤（鎖定）** |
| A-5-i | 其他用戶修改 | **403 Forbidden** |

---

#### A-6. 刪除實踐

| 項目 | 內容 |
|------|------|
| **端點** | `DELETE /api/v1/practices/{id}` |
| **驗證** | 必需 |

**測試案例：**

| 測試 | 條件 | 預期 |
|------|------|------|
| A-6-a | 刪除自己的實踐 | 成功（軟刪除） |
| A-6-b | 刪除他人的實踐 | 403 Forbidden |
| A-6-c | 重複刪除 | 404 Not Found |
| A-6-d | 驗證軟刪除 | `deleted_at` 有值 |

---

#### A-7. 取得統計資訊

| 項目 | 內容 |
|------|------|
| **端點** | `GET /api/v1/practices/stats` |
| **驗證** | 可選 |

**預期結果：**
- [ ] HTTP 200 OK
- [ ] 包含 `totalPractices`
- [ ] 包含 `activePractices`
- [ ] 包含 `completedPractices`

---

### B. 打卡功能

#### B-1. 建立打卡記錄

| 項目 | 內容 |
|------|------|
| **端點** | `POST /api/v1/practices/{id}/checkins` |
| **驗證** | 必需 |

**測試步驟：**

1. 準備請求資料：
```json
{
  "mood": "happy",
  "note": "今天閱讀了 30 分鐘，學到很多新知識！",
  "imageUrls": []
}
```

2. 發送請求
3. 驗證回應和資料庫

**測試案例：**

| 測試 | 條件 | 預期 |
|------|------|------|
| B-1-a | 首次打卡 | 成功，進度 50%，狀態 active |
| B-1-b | 第二次打卡（隔天） | 成功，進度增加 |
| B-1-c | 同一天重複打卡 | **400 錯誤** |
| B-1-d | 他人實踐打卡 | **403 Forbidden** |
| B-1-e | 已完成實踐打卡 | **400 錯誤** |
| B-1-f | 已封存實踐打卡 | **400 錯誤** |

**心情選項測試：**

| 測試 | mood 值 | 預期 |
|------|---------|------|
| B-1-g | "awesome" | 成功 |
| B-1-h | "happy" | 成功 |
| B-1-i | "neutral" | 成功 |
| B-1-j | "tired" | 成功 |
| B-1-k | "frustrated" | 成功 |
| B-1-l | "invalid" | **400 錯誤** |

**回應驗證：**
- [ ] 返回 `checkIn` 物件
- [ ] 返回更新後的 `practice`（含進度）
- [ ] 返回 `encouragement` 鼓勵句

---

#### B-2. 提早打卡（日期位移）

| 項目 | 內容 |
|------|------|
| **端點** | `POST /api/v1/practices/{id}/checkins` |
| **情境** | 在 startDate 之前打卡 |

**測試步驟：**

1. 建立實踐，startDate 設為 3 天後
2. 立即打卡
3. 驗證日期位移

**預期結果：**
- [ ] 打卡成功
- [ ] `startDate` 自動調整為今天
- [ ] `endDate` 同步調整（保持總天數不變）
- [ ] 進度更新為 50%

---

#### B-3. 取得打卡記錄列表

| 項目 | 內容 |
|------|------|
| **端點** | `GET /api/v1/practices/{id}/checkins` |
| **驗證** | 可選 |

**測試參數組合：**

| 測試 | 參數 | 預期 |
|------|------|------|
| B-3-a | 無參數 | 返回所有打卡記錄 |
| B-3-b | `?startDate=2025-02-01&endDate=2025-02-07` | 日期範圍篩選 |
| B-3-c | `?mood=happy` | 心情篩選 |
| B-3-d | `?page=1&limit=5` | 分頁 |

---

#### B-4. 取得打卡統計

| 項目 | 內容 |
|------|------|
| **端點** | `GET /api/v1/practices/{id}/checkins/stats` |
| **驗證** | 必需 |

**預期結果：**
- [ ] `totalCheckIns` - 總打卡次數
- [ ] `currentStreak` - 當前連續打卡天數
- [ ] `longestStreak` - 最長連續打卡天數
- [ ] `averageProgress` - 平均進度

---

#### B-5. 取得月度日曆

| 項目 | 內容 |
|------|------|
| **端點** | `GET /api/v1/practices/{id}/checkins/calendar/{year}/{month}` |
| **驗證** | 必需 |

**測試案例：**

| 測試 | 參數 | 預期 |
|------|------|------|
| B-5-a | `/calendar/2025/2` | 返回 2025 年 2 月日曆 |
| B-5-b | `/calendar/2025/13` | **400 錯誤** |
| B-5-c | `/calendar/2025/0` | **400 錯誤** |

**回應格式驗證：**
```json
{
  "year": 2025,
  "month": 2,
  "days": [
    { "date": "2025-02-01", "hasCheckIn": true, "mood": "happy" },
    { "date": "2025-02-02", "hasCheckIn": false, "mood": null },
    ...
  ]
}
```

---

### C. 社群互動

#### C-1. 點讚/取消點讚

| 項目 | 內容 |
|------|------|
| **端點** | `POST /api/v1/practices/{id}/like` |
| **驗證** | 必需 |

**測試案例：**

| 測試 | 條件 | 預期 |
|------|------|------|
| C-1-a | 首次點讚 | 成功，`isLiked: true` |
| C-1-b | 再次呼叫（取消） | 成功，`isLiked: false` |
| C-1-c | 無 Token | 401 Unauthorized |

---

#### C-2. 收藏/取消收藏

| 項目 | 內容 |
|------|------|
| **端點** | `POST /api/v1/practices/{id}/favorite` |
| **驗證** | 必需 |

**測試案例：**

| 測試 | 條件 | 預期 |
|------|------|------|
| C-2-a | 首次收藏 | 成功，`isFavorited: true` |
| C-2-b | 再次呼叫（取消） | 成功，`isFavorited: false` |

---

#### C-3. 記錄分享事件

| 項目 | 內容 |
|------|------|
| **端點** | `POST /api/v1/practices/{id}/share` |
| **驗證** | 必需 |

**預期結果：**
- [ ] HTTP 200 OK
- [ ] 分享計數增加

---

#### C-4. 記錄瀏覽事件

| 項目 | 內容 |
|------|------|
| **端點** | `POST /api/v1/practices/{id}/view` |
| **驗證** | 必需 |

**預期結果：**
- [ ] HTTP 200 OK
- [ ] 瀏覽計數增加

---

#### C-5. 取得互動統計

| 項目 | 內容 |
|------|------|
| **端點** | `GET /api/v1/practices/{id}/stats` |
| **驗證** | 可選 |

**預期結果：**
```json
{
  "likes": 10,
  "favorites": 5,
  "shares": 2,
  "views": 100
}
```

---

#### C-6. 取得用戶互動狀態

| 項目 | 內容 |
|------|------|
| **端點** | `GET /api/v1/practices/{id}/user-status` |
| **驗證** | 必需 |

**預期結果：**
```json
{
  "isLiked": true,
  "isFavorited": false
}
```

---

### D. 模板與輔助功能

#### D-1. 取得模板列表

| 項目 | 內容 |
|------|------|
| **端點** | `GET /api/v1/practices/templates` |
| **驗證** | 不需要 |

**測試參數：**

| 測試 | 參數 | 預期 |
|------|------|------|
| D-1-a | 無參數 | 返回所有模板 |
| D-1-b | `?category=學習` | 分類篩選 |
| D-1-c | `?search=閱讀` | 搜尋 |

---

#### D-2. 取得單一模板

| 項目 | 內容 |
|------|------|
| **端點** | `GET /api/v1/practices/templates/{id}` |
| **驗證** | 不需要 |

**測試案例：**

| 測試 | 條件 | 預期 |
|------|------|------|
| D-2-a | 有效 ID | 返回模板詳情 |
| D-2-b | 不存在的 ID | 404 Not Found |

---

#### D-3. 取得隨機鼓勵句

| 項目 | 內容 |
|------|------|
| **端點** | `GET /api/v1/checkin-encouragements/random` |
| **驗證** | 不需要 |

**測試步驟：**

1. 呼叫 API 多次
2. 確認返回不同的鼓勵句

**預期結果：**
- [ ] HTTP 200 OK
- [ ] 返回 `{ id, message }`
- [ ] 多次呼叫有隨機性

---

#### D-4. 取得引導句列表

| 項目 | 內容 |
|------|------|
| **端點** | `GET /api/v1/tag-prompts` |
| **驗證** | 不需要 |

**測試參數：**

| 測試 | 參數 | 預期 |
|------|------|------|
| D-4-a | `?usageType=practice_checkin` | 打卡引導句 |
| D-4-b | `?locale=zh-TW` | 繁體中文 |
| D-4-c | `?locale=en-US` | 英文 |
| D-4-d | `?tagName=實作` | 特定標籤 |

**預期結果範例：**
```json
[
  { "tagName": "實作", "prompt": "我練習了..." },
  { "tagName": "新概念", "prompt": "我學到的一個新概念是..." },
  ...
]
```

---

### E. 狀態管理

#### E-1. 封存實踐

| 項目 | 內容 |
|------|------|
| **端點** | `POST /api/v1/practices/{id}/archive` |
| **驗證** | 必需 |

**測試案例：**

| 測試 | 原狀態 | 預期 |
|------|--------|------|
| E-1-a | not_started | 成功，狀態變為 archived |
| E-1-b | active | 成功，狀態變為 archived |
| E-1-c | completed | 成功，狀態變為 archived |
| E-1-d | 已是 archived | 400 錯誤 |
| E-1-e | 他人實踐 | 403 Forbidden |

---

#### E-2. 取消封存

| 項目 | 內容 |
|------|------|
| **端點** | `POST /api/v1/practices/{id}/unarchive` |
| **驗證** | 必需 |

**測試案例：**

| 測試 | 條件 | 預期 |
|------|------|------|
| E-2-a | archived 狀態 | 成功，恢復原狀態 |
| E-2-b | 非 archived 狀態 | 400 錯誤 |

---

## 業務邏輯驗證

### BL-1. 進度計算驗證

**測試情境：14 天實踐，每週 4-7 天**

| 打卡次數 | 預期進度 | 狀態 |
|---------|---------|------|
| 0（建立後） | 20% | not_started |
| 1（首次打卡） | 50% | active |
| 2 | 57.14% | active |
| 3 | 64.28% | active |
| 4 | 71.42% | active |
| 5 | 78.56% | active |
| 6 | 85.70% | active |
| 7 | 92.84% | active |
| 8（達成目標） | **100%** | active |
| 9（超額） | 107.14% | active |

**驗證步驟：**
1. 建立實踐，驗證進度 20%
2. 執行首次打卡，驗證進度 50%
3. 連續打卡到第 8 次，驗證進度 100%
4. 繼續打卡，驗證可超過 100%

---

### BL-2. 狀態轉換驗證

| 測試 | 操作 | 預期轉換 |
|------|------|---------|
| BL-2-a | 建立實踐 | → not_started |
| BL-2-b | 首次打卡 | not_started → active |
| BL-2-c | 到達結束日期 | active → completed |
| BL-2-d | 手動封存 | 任意 → archived |
| BL-2-e | 取消封存 | archived → 原狀態 |

---

### BL-3. 打卡鎖定機制驗證

**測試步驟：**

1. 建立實踐
2. 驗證可修改所有欄位
3. 執行一次打卡
4. 嘗試修改 `startDate` → 預期失敗
5. 嘗試修改 `frequencyMinDays` → 預期失敗
6. 嘗試修改 `title` → 預期成功

---

### BL-4. 日期位移驗證

**測試步驟：**

1. 建立實踐，startDate = 今天 + 5 天
2. 記錄 startDate 和 endDate
3. 立即打卡
4. 驗證 startDate 變為今天
5. 驗證 endDate 同步前移 5 天

---

## Email 自動化測試

### Email-1. PE01 實踐建立確認

| 項目 | 內容 |
|------|------|
| **觸發** | 建立實踐後 |
| **驗證方式** | 檢查 Redis 隊列 / email_logs 表 |

**測試步驟：**

1. 建立新實踐
2. 檢查 Redis 隊列是否有任務
3. 等待 worker 處理
4. 檢查 email_logs 表

```bash
# 檢查隊列（Redis）
redis-cli LRANGE practice-email:wait 0 -1
```

```sql
-- 檢查 email_logs
SELECT * FROM email_logs
WHERE email_type = 'PE01'
AND entity_id = {practice_id}
ORDER BY created_at DESC;
```

---

### Email-2. PE02 首次打卡確認

| 項目 | 內容 |
|------|------|
| **觸發** | 首次打卡後 |
| **驗證方式** | 檢查 email_logs 表 |

**測試步驟：**

1. 對新實踐執行首次打卡
2. 檢查 email_logs 表是否有 PE02 記錄

---

### Email-3. 郵件去重驗證

**測試步驟：**

1. 建立實踐（觸發 PE01）
2. 嘗試重新觸發 PE01（例如透過直接呼叫 service）
3. 驗證只有 1 筆 PE01 記錄

---

## 錯誤處理測試

### ERR-1. 驗證錯誤

| 測試 | 請求 | 預期錯誤 |
|------|------|---------|
| ERR-1-a | 缺少 title | 400, validation error |
| ERR-1-b | title 超過 100 字 | 400, validation error |
| ERR-1-c | 無效的 mood 值 | 400, validation error |
| ERR-1-d | durationDays = -1 | 400, validation error |

---

### ERR-2. 權限錯誤

| 測試 | 操作 | 預期錯誤 |
|------|------|---------|
| ERR-2-a | 無 Token 存取需驗證 API | 401 Unauthorized |
| ERR-2-b | 存取他人實踐（私有操作） | 403 Forbidden |
| ERR-2-c | Token 過期 | 401 Unauthorized |

---

### ERR-3. 資源不存在

| 測試 | 操作 | 預期錯誤 |
|------|------|---------|
| ERR-3-a | 取得不存在的實踐 | 404 Not Found |
| ERR-3-b | 更新已刪除的實踐 | 404 Not Found |
| ERR-3-c | 打卡不存在的實踐 | 404 Not Found |

---

### ERR-4. 業務邏輯錯誤

| 測試 | 操作 | 預期錯誤 |
|------|------|---------|
| ERR-4-a | 同一天重複打卡 | 400, already checked in |
| ERR-4-b | 修改已鎖定欄位 | 400, field locked |
| ERR-4-c | 對 completed 狀態打卡 | 400, invalid status |
| ERR-4-d | 重複封存 | 400, already archived |

---

## 測試結果記錄表

### 測試摘要

| 日期 | 測試者 | 環境 | 通過 | 失敗 | 待修 |
|------|--------|------|------|------|------|
| | | | | | |

### 詳細記錄

| 測試編號 | 測試項目 | 結果 | 備註 |
|---------|---------|------|------|
| A-1-a | 建立實踐（今天開始） | ☐ Pass / ☐ Fail | |
| A-1-b | 建立實踐（14天後） | ☐ Pass / ☐ Fail | |
| A-1-c | 建立實踐（超過14天） | ☐ Pass / ☐ Fail | |
| ... | ... | | |

### 發現的問題

| 問題編號 | 測試案例 | 問題描述 | 嚴重程度 | 狀態 |
|---------|---------|---------|---------|------|
| | | | | |

---

## 附錄

### A. 常用 curl 指令

```bash
# 設定 Token 環境變數
export TOKEN="your-jwt-token-here"

# 建立實踐
curl -X POST http://localhost:3000/api/v1/practices \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "測試實踐",
    "practiceAction": "測試動作",
    "startDate": "2025-02-01",
    "durationDays": 14,
    "frequencyMinDays": 4,
    "frequencyMaxDays": 7
  }'

# 打卡
curl -X POST http://localhost:3000/api/v1/practices/{id}/checkins \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mood": "happy", "note": "測試打卡"}'

# 取得我的實踐
curl http://localhost:3000/api/v1/practices/me \
  -H "Authorization: Bearer $TOKEN"

# 取得鼓勵句
curl http://localhost:3000/api/v1/checkin-encouragements/random
```

### B. 資料庫查詢指令

```sql
-- 查看實踐資料
SELECT id, external_id, title, status, progress_percentage,
       start_date, end_date, first_checkin_at
FROM practices
WHERE user_id = {user_id}
ORDER BY created_at DESC;

-- 查看打卡記錄
SELECT pc.*, p.title
FROM practice_checkins pc
JOIN practices p ON pc.practice_id = p.id
WHERE pc.user_id = {user_id}
ORDER BY pc.checkin_date DESC;

-- 查看郵件記錄
SELECT * FROM email_logs
WHERE entity_type = 'practice'
ORDER BY created_at DESC
LIMIT 20;
```

### C. Redis 隊列指令

```bash
# 查看待處理任務
redis-cli LRANGE practice-email:wait 0 -1

# 查看處理中任務
redis-cli LRANGE practice-email:active 0 -1

# 查看失敗任務
redis-cli LRANGE practice-email:failed 0 -1
```
