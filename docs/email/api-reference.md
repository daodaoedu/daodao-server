# Email API 參考文件

## 概述

Email API 提供郵件發送、驗證、預覽和管理功能。所有端點均位於 `/api/v1/email` 路徑下。

## 認證要求

| 端點 | 方法 | 認證 | 權限 |
|------|------|------|------|
| `/email/contact` | POST | 必須 | 任何用戶 |
| `/email/verification` | POST | 必須 | 任何用戶 |
| `/email/welcome` | POST | 必須 | 管理員 |
| `/email/password-reset` | POST | 選用 | 任何用戶 |
| `/email/marathon` | POST | 必須 | 管理員 |
| `/email/custom` | POST | 必須 | 管理員 |
| `/email/bulk` | POST | 必須 | 管理員 |
| `/email/validate` | POST | 選用 | 任何用戶 |
| `/email/preview` | POST | 必須 | 任何用戶 |
| `/email/stats` | GET | 必須 | 管理員 |
| `/email/health` | GET | 必須 | 管理員 |

## 端點詳細說明

### POST /email/contact

發送聯絡郵件。

**請求 Body:**

```json
{
  "from": "sender@example.com",
  "to": "recipient@example.com",
  "subject": "聯絡主旨",
  "text": "訊息內容",
  "name": "寄件人名稱",
  "information": "聯絡方式",
  "activityTitle": "活動標題"
}
```

| 欄位 | 型別 | 必填 | 說明 |
|------|------|------|------|
| from | string | 是 | 寄件人 email |
| to | string | 是 | 收件人 email |
| subject | string | 是 | 郵件主旨（1-200 字） |
| text | string | 是 | 訊息內容（1-5000 字） |
| name | string | 是 | 寄件人名稱（1-100 字） |
| information | string \| string[] | 否 | 聯絡方式 |
| activityTitle | string | 否 | 活動標題（最多 200 字） |

**回應:**

```json
{
  "success": true,
  "data": {
    "messageId": "<test.user@example.com>"
  }
}
```

---

### POST /email/verification

發送郵件驗證信。

**請求 Body:**

```json
{
  "email": "user@example.com",
  "verifyLink": "https://api.daodao.so/email/verify?token=abc123",
  "name": "用戶名稱"
}
```

| 欄位 | 型別 | 必填 | 說明 |
|------|------|------|------|
| email | string | 是 | 收件人 email |
| verifyLink | string | 是 | 驗證連結 |
| name | string | 否 | 用戶名稱 |

**回應:**

```json
{
  "success": true,
  "data": {
    "messageId": "<test.user@example.com>"
  }
}
```

---

### POST /email/welcome

發送歡迎郵件（需管理員權限）。

**請求 Body:**

```json
{
  "email": "user@example.com",
  "name": "用戶名稱",
  "hasCompletedQuiz": false,
  "practiceUrl": "https://daodao.so/practice",
  "quizUrl": "https://daodao.so/quiz",
  "illustrationUrl": "https://daodao.so/images/emails/mascot.png",
  "unsubscribeUrl": "https://daodao.so/unsubscribe",
  "userId": 123
}
```

| 欄位 | 型別 | 必填 | 說明 |
|------|------|------|------|
| email | string | 是 | 收件人 email |
| name | string | 是 | 用戶名稱（1-100 字） |
| hasCompletedQuiz | boolean | 是 | 是否已完成測驗 |
| practiceUrl | string | 否 | 主題實踐連結 |
| quizUrl | string | 否 | 學習類型測驗連結 |
| illustrationUrl | string | 否 | 插圖 URL |
| unsubscribeUrl | string | 否 | 取消訂閱連結 |
| userId | number | 否 | 用戶 ID（用於記錄） |

**回應:**

```json
{
  "success": true,
  "data": {
    "messageId": "<test.user@example.com>"
  }
}
```

---

### POST /email/password-reset

發送密碼重設郵件。

**請求 Body:**

```json
{
  "email": "user@example.com",
  "resetLink": "https://daodao.so/reset-password?token=abc123",
  "name": "用戶名稱"
}
```

| 欄位 | 型別 | 必填 | 說明 |
|------|------|------|------|
| email | string | 是 | 收件人 email |
| resetLink | string | 是 | 密碼重設連結 |
| name | string | 否 | 用戶名稱 |

**回應:**

```json
{
  "success": true,
  "data": {
    "messageId": "<test.user@example.com>"
  }
}
```

---

### POST /email/marathon

發送馬拉松活動郵件（需管理員權限）。

**請求 Body:**

```json
{
  "email": "user@example.com",
  "name": "用戶名稱",
  "marathonTitle": "學習馬拉松 2024",
  "marathonDate": "2024-06-01",
  "marathonDescription": "活動說明內容"
}
```

| 欄位 | 型別 | 必填 | 說明 |
|------|------|------|------|
| email | string | 是 | 收件人 email |
| name | string | 是 | 用戶名稱 |
| marathonTitle | string | 是 | 馬拉松標題 |
| marathonDate | string | 否 | 活動日期 |
| marathonDescription | string | 否 | 活動說明 |

**回應:**

```json
{
  "success": true,
  "data": {
    "messageId": "<test.user@example.com>"
  }
}
```

---

### POST /email/custom

發送自定義郵件（需管理員權限）。

**請求 Body:**

```json
{
  "to": "user@example.com",
  "subject": "自定義主旨",
  "htmlContent": "<h1>自定義 HTML 內容</h1>",
  "template": "welcome",
  "data": {
    "name": "用戶名稱",
    "hasCompletedQuiz": false
  }
}
```

| 欄位 | 型別 | 必填 | 說明 |
|------|------|------|------|
| to | string \| string[] | 是 | 收件人（單個或多個） |
| subject | string | 是 | 郵件主旨 |
| htmlContent | string | 否 | 直接 HTML 內容 |
| template | string | 否 | 模板名稱 |
| data | object | 否 | 模板資料 |

**可用模板:**
- `welcome` - 歡迎信
- `verification` - 驗證郵件
- `password-reset` - 密碼重設
- `contact` - 聯絡郵件
- `marathon` - 馬拉松活動

**回應:**

```json
{
  "success": true,
  "data": {
    "messageId": "<test.user@example.com>"
  }
}
```

---

### POST /email/bulk

批量發送郵件（需管理員權限，最多 100 個收件人）。

**請求 Body:**

```json
{
  "template": "welcome",
  "subject": "歡迎加入島島阿學！",
  "recipients": [
    {
      "email": "user1@example.com",
      "data": {
        "name": "用戶1",
        "hasCompletedQuiz": false
      }
    },
    {
      "email": "user2@example.com",
      "data": {
        "name": "用戶2",
        "hasCompletedQuiz": true
      }
    }
  ],
  "from": "noreply@daodao.so",
  "scheduledAt": "2024-06-01T10:00:00Z"
}
```

| 欄位 | 型別 | 必填 | 說明 |
|------|------|------|------|
| template | string | 是 | 模板名稱 |
| subject | string | 是 | 郵件主旨（1-200 字） |
| recipients | array | 是 | 收件人列表（1-100 個） |
| recipients[].email | string | 是 | 收件人 email |
| recipients[].data | object | 是 | 模板資料 |
| from | string | 否 | 寄件人 email |
| scheduledAt | string | 否 | 排程時間（ISO 8601 格式） |

**回應:**

```json
{
  "success": true,
  "data": {
    "success": 98,
    "failed": 2,
    "results": [
      {
        "success": true,
        "messageId": "<message-id-1>"
      },
      {
        "success": false,
        "error": "Invalid email address"
      }
    ]
  }
}
```

---

### POST /email/validate

驗證郵件地址格式。

**請求 Body:**

```json
{
  "email": "user@example.com"
}
```

| 欄位 | 型別 | 必填 | 說明 |
|------|------|------|------|
| email | string | 是 | 要驗證的 email |

**回應:**

```json
{
  "success": true,
  "data": {
    "email": "user@example.com",
    "isValid": true
  }
}
```

---

### POST /email/preview

預覽郵件模板。

**請求 Body:**

```json
{
  "template": "welcome",
  "data": {
    "name": "測試用戶",
    "hasCompletedQuiz": false,
    "practiceUrl": "https://daodao.so/practice",
    "quizUrl": "https://daodao.so/quiz"
  }
}
```

| 欄位 | 型別 | 必填 | 說明 |
|------|------|------|------|
| template | string | 是 | 模板名稱 |
| data | object | 是 | 模板資料 |

**回應:**

```json
{
  "success": true,
  "data": {
    "subject": "歡迎加入島島阿學！開始你的學習旅程",
    "html": "<!DOCTYPE html>..."
  }
}
```

---

### GET /email/stats

取得郵件統計資料（需管理員權限）。

**Query 參數:**

| 參數 | 型別 | 必填 | 說明 |
|------|------|------|------|
| startDate | string | 否 | 開始日期（ISO 8601） |
| endDate | string | 否 | 結束日期（ISO 8601） |

**回應:**

```json
{
  "success": true,
  "data": {
    "totalSent": 1250,
    "totalFailed": 15,
    "isHealthy": true,
    "lastSentAt": "2024-06-01T10:30:00Z",
    "lastFailedAt": "2024-05-28T14:22:00Z"
  }
}
```

---

### GET /email/health

檢查郵件服務健康狀態（需管理員權限）。

**回應:**

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "lastCheck": "2024-06-01T10:35:00Z",
    "transporterConnected": true
  }
}
```

**異常回應:**

```json
{
  "success": true,
  "data": {
    "status": "unhealthy",
    "lastCheck": "2024-06-01T10:35:00Z",
    "transporterConnected": false,
    "error": "SMTP connection failed: authentication error"
  }
}
```

---

## 錯誤回應

所有端點在發生錯誤時會回傳以下格式：

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email address format"
  }
}
```

### 常見錯誤碼

| 錯誤碼 | HTTP 狀態碼 | 說明 |
|--------|------------|------|
| VALIDATION_ERROR | 400 | 請求參數驗證失敗 |
| UNAUTHORIZED | 401 | 未提供認證 |
| FORBIDDEN | 403 | 權限不足 |
| NOT_FOUND | 404 | 資源不存在 |
| EMAIL_SEND_FAILED | 500 | 郵件發送失敗 |
| SMTP_ERROR | 500 | SMTP 連線錯誤 |

---

## 請求範例

### cURL

```bash
# 發送驗證郵件
curl -X POST https://api.daodao.so/api/v1/email/verification \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "email": "user@example.com",
    "verifyLink": "https://api.daodao.so/email/verify?token=abc123",
    "name": "用戶名稱"
  }'

# 批量發送
curl -X POST https://api.daodao.so/api/v1/email/bulk \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{
    "template": "welcome",
    "subject": "歡迎加入！",
    "recipients": [
      {"email": "user1@example.com", "data": {"name": "用戶1", "hasCompletedQuiz": false}},
      {"email": "user2@example.com", "data": {"name": "用戶2", "hasCompletedQuiz": true}}
    ]
  }'

# 健康檢查
curl -X GET https://api.daodao.so/api/v1/email/health \
  -H "Authorization: Bearer <admin-token>"
```

### JavaScript/TypeScript

```typescript
// 發送歡迎郵件
const response = await fetch('/api/v1/email/welcome', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    email: 'user@example.com',
    name: '用戶名稱',
    hasCompletedQuiz: false,
    practiceUrl: 'https://daodao.so/practice',
    quizUrl: 'https://daodao.so/quiz',
  }),
});

const result = await response.json();
console.log(result.data.messageId);
```
