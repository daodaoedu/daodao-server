# Email Module Specification

## 1. Overview

### 1.1 Purpose
郵件模組負責處理系統中所有郵件發送相關的功能，包括驗證郵件、歡迎郵件、密碼重設、馬拉松活動通知等。支援模板系統、批量發送及異步佇列處理。

### 1.2 Scope
- 多種郵件模板（歡迎、驗證、密碼重設、馬拉松、聯絡）
- 自定義郵件發送
- 批量郵件發送（最多 100 位收件人）
- 郵件模板預覽
- 郵件地址格式驗證
- 郵件發送統計
- 服務健康狀態檢查
- BullMQ 異步任務佇列

---

## 2. Architecture

### 2.1 Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Email Module                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐    ┌──────────────────┐                   │
│  │  Email Routes    │───▶│ Email Controller │                   │
│  │  (11 endpoints)  │    │  (11 methods)    │                   │
│  └──────────────────┘    └────────┬─────────┘                   │
│                                   │                              │
│                                   ▼                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Email Service                          │   │
│  │  ┌──────────────┐  ┌────────────────┐  ┌───────────────┐ │   │
│  │  │   Template   │  │  Email Sender  │  │  Email Queue  │ │   │
│  │  │   Service    │  │   (Nodemailer) │  │   (BullMQ)    │ │   │
│  │  └──────────────┘  └────────────────┘  └───────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                   │                              │
│                                   ▼                              │
│                          ┌───────────────┐                       │
│                          │  SMTP Server  │                       │
│                          │  (External)   │                       │
│                          └───────────────┘                       │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Email Templates

| Template | Purpose | Data Fields |
|----------|---------|-------------|
| `welcome` | 新用戶歡迎郵件 | name, hasCompletedQuiz, practiceUrl, quizUrl, illustrationUrl, unsubscribeUrl |
| `verification` | 電子郵件驗證 | email, verifyLink, name |
| `passwordReset` | 密碼重設連結 | email, resetLink, name |
| `marathon` | 馬拉松活動通知 | name, marathonTitle, marathonDate, marathonDescription |
| `contact` | 聯絡表單郵件 | name, text, information, activityTitle |

---

## 3. API Endpoints

### 3.1 Send Contact Email

```yaml
POST /api/v1/email/contact
Content-Type: application/json
Authorization: Bearer <accessToken>

Request:
  from: string (required, email)
  to: string (required, email)
  subject: string (required)
  text: string (required)
  name: string (required)
  information: string (optional)
  activityTitle: string (optional)

Response 200:
  success: true
  data:
    messageId: string
  meta:
    message: "聯絡郵件發送成功"
    aggregateData:
      emailInfo:
        recipient: string
        template: "contact"
        sentAt: string (ISO 8601)
```

### 3.2 Send Verification Email

```yaml
POST /api/v1/email/verification
Content-Type: application/json
Authorization: Bearer <accessToken>

Request:
  email: string (required, valid email)
  verifyLink: string (required, URL)
  name: string (optional)

Response 200:
  success: true
  data:
    messageId: string
```

### 3.3 Send Welcome Email

```yaml
POST /api/v1/email/welcome
Content-Type: application/json
Authorization: Bearer <accessToken>

Request:
  email: string (required, valid email)
  name: string (required)
  hasCompletedQuiz: boolean (optional, default: false)
  practiceUrl: string (optional, URL)
  quizUrl: string (optional, URL)
  illustrationUrl: string (optional, URL)
  unsubscribeUrl: string (optional, URL)

Response 200:
  success: true
  data:
    messageId: string
```

### 3.4 Send Password Reset Email

```yaml
POST /api/v1/email/password-reset
Content-Type: application/json
# Optional authentication - allows unauthenticated users to reset password

Request:
  email: string (required, valid email)
  resetLink: string (required, URL)
  name: string (optional)

Response 200:
  success: true
  data:
    messageId: string
  meta:
    message: "密碼重設郵件發送成功"
```

### 3.5 Send Marathon Email

```yaml
POST /api/v1/email/marathon
Content-Type: application/json
Authorization: Bearer <accessToken>
# Requires Admin role

Request:
  email: string (required, valid email)
  name: string (required)
  marathonTitle: string (required)
  marathonDate: string (optional)
  marathonDescription: string (optional)

Response 200:
  success: true
  data:
    messageId: string
  meta:
    message: "馬拉松郵件發送成功"
```

### 3.6 Send Custom Email

```yaml
POST /api/v1/email/custom
Content-Type: application/json
Authorization: Bearer <accessToken>
# Requires Admin role

Request:
  to: string (required, email)
  subject: string (required)
  htmlContent: string (optional, HTML content)
  template: string (optional, enum: welcome, verification, contact, marathon, passwordReset)
  data: object (optional, template data)

Note: Must provide either htmlContent OR (template + data)

Response 200:
  success: true
  data:
    messageId: string
  meta:
    message: "自定義郵件發送成功"
```

### 3.7 Send Bulk Email

```yaml
POST /api/v1/email/bulk
Content-Type: application/json
Authorization: Bearer <accessToken>
# Requires Admin role

Request:
  template: string (required, enum: welcome, verification, contact, marathon, custom)
  subject: string (required)
  recipients: array (required, max 100 items)
    - email: string
      data: object (template-specific data)

Response 200:
  success: true
  data:
    total: number
    success: number
    failed: number
    results: array
      - email: string
        success: boolean
        messageId: string (if success)
        error: string (if failed)
  meta:
    message: "批量郵件發送完成：成功 X 件，失敗 Y 件"
    aggregateData:
      batchEmail:
        totalRecipients: number
        successCount: number
        failureCount: number
        processedAt: string (ISO 8601)
```

### 3.8 Validate Email Address

```yaml
POST /api/v1/email/validate
Content-Type: application/json
# Optional authentication

Request:
  email: string (required)

Response 200:
  success: true
  data:
    email: string
    isValid: boolean
  meta:
    message: "郵件地址有效" | "郵件地址無效"
```

### 3.9 Preview Email Template

```yaml
POST /api/v1/email/preview
Content-Type: application/json
Authorization: Bearer <accessToken>

Request:
  template: string (required, enum: welcome, verification, contact, marathon, passwordReset)
  data: object (required, template-specific data)

Response 200:
  success: true
  data:
    subject: string
    html: string (rendered HTML content)
  meta:
    message: "模板預覽生成成功"
```

### 3.10 Get Email Statistics

```yaml
GET /api/v1/email/stats
Authorization: Bearer <accessToken>
# Requires Admin role

Query Parameters:
  startDate: string (optional, ISO 8601)
  endDate: string (optional, ISO 8601)

Response 200:
  success: true
  data:
    totalSent: number
    totalFailed: number
    successRate: number (percentage)
    byTemplate:
      welcome: number
      verification: number
      contact: number
      marathon: number
      passwordReset: number
      custom: number
  meta:
    message: "郵件統計獲取成功"
```

### 3.11 Check Email Service Health

```yaml
GET /api/v1/email/health
Authorization: Bearer <accessToken>
# Requires Admin role

Response 200:
  success: true
  data:
    status: "healthy" | "unhealthy"
    lastCheck: string (ISO 8601)
    transporterConnected: boolean
    error: string | null
  meta:
    message: "郵件服務健康狀態正常" | "郵件服務健康狀態異常"

Response 503:
  (same structure with status: "unhealthy")
```

---

## 4. Data Models

### 4.1 Email Log Entity (Prisma)

```prisma
model email_logs {
  id          Int       @id @default(autoincrement())
  user_id     Int?
  email_type  String    // template type
  recipient   String    // email address
  subject     String
  status      String    // sent, failed, queued
  message_id  String?   // SMTP message ID
  error       String?
  sent_at     DateTime?
  created_at  DateTime  @default(now())

  user        users?    @relation(fields: [user_id], references: [id])
}
```

---

## 5. Validation Schemas

### 5.1 Contact Email Schema

```typescript
const contactEmailSchema = z.object({
  from: z.string().email('Invalid email format'),
  to: z.string().email('Invalid email format'),
  subject: z.string().min(1, 'Subject is required'),
  text: z.string().min(1, 'Text content is required'),
  name: z.string().min(1, 'Name is required'),
  information: z.string().optional(),
  activityTitle: z.string().optional(),
});
```

### 5.2 Welcome Email Schema

```typescript
const welcomeEmailSchema = z.object({
  email: z.string().email('Invalid email format'),
  name: z.string().min(1, 'Name is required'),
  hasCompletedQuiz: z.boolean().optional().default(false),
  practiceUrl: z.string().url().optional(),
  quizUrl: z.string().url().optional(),
  illustrationUrl: z.string().url().optional(),
  unsubscribeUrl: z.string().url().optional(),
});
```

### 5.3 Bulk Email Schema

```typescript
const bulkEmailSchema = z.object({
  template: z.enum(['welcome', 'verification', 'contact', 'marathon', 'custom']),
  subject: z.string().min(1, 'Subject is required'),
  recipients: z
    .array(z.object({
      email: z.string().email(),
      data: z.record(z.unknown()).optional(),
    }))
    .min(1, 'At least one recipient required')
    .max(100, 'Maximum 100 recipients per batch'),
});
```

---

## 6. Business Rules

### 6.1 Rate Limiting
- 郵件發送端點屬於 Strict 類別：60 requests/minute
- 批量發送限制：每次最多 100 位收件人

### 6.2 Authentication Requirements

| Endpoint | Auth Required | Admin Required |
|----------|---------------|----------------|
| `/contact` | Yes | No |
| `/verification` | Yes | No |
| `/welcome` | Yes | No* |
| `/password-reset` | Optional | No |
| `/marathon` | Yes | Yes |
| `/custom` | Yes | Yes |
| `/bulk` | Yes | Yes |
| `/validate` | Optional | No |
| `/preview` | Yes | No |
| `/stats` | Yes | Yes |
| `/health` | Yes | Yes |

*Note: `/welcome` 原設計需要 Admin 權限，目前已暫時移除

### 6.3 Email Queue
- 使用 BullMQ 進行異步處理
- 失敗重試機制：最多 3 次
- 郵件佇列優先級處理

---

## 7. Error Handling

### 7.1 Error Codes

```typescript
const EMAIL_ERRORS = {
  EMAIL_MISSING_FIELDS: {
    code: 'EMAIL_MISSING_FIELDS',
    message: '缺少必要的郵件資訊',
    status: 400,
  },
  EMAIL_SEND_FAILED: {
    code: 'EMAIL_SEND_FAILED',
    message: '郵件發送失敗',
    status: 500,
  },
  EMAIL_TEMPLATE_NOT_FOUND: {
    code: 'EMAIL_TEMPLATE_NOT_FOUND',
    message: '不支援的模板類型',
    status: 400,
  },
  EMAIL_INVALID_ADDRESS: {
    code: 'EMAIL_INVALID_ADDRESS',
    message: '無效的郵件地址格式',
    status: 400,
  },
  EMAIL_BULK_LIMIT_EXCEEDED: {
    code: 'EMAIL_BULK_LIMIT_EXCEEDED',
    message: '單次批量發送不能超過 100 個收件人',
    status: 400,
  },
  EMAIL_SERVICE_UNAVAILABLE: {
    code: 'EMAIL_SERVICE_UNAVAILABLE',
    message: '郵件服務暫時無法使用',
    status: 503,
  },
} as const;
```

---

## 8. Implementation Files

### 8.1 Controllers
- `src/controllers/email.controller.ts`

### 8.2 Services
- `src/services/email/email.service.ts`
- `src/services/email/template.service.ts`
- `src/services/email/email-queue.service.ts`

### 8.3 Routes
- `src/routes/email.routes.ts`

### 8.4 Validators
- `src/validators/email.validators.ts`

### 8.5 Types
- `src/types/email.types.ts`

---

## 9. Configuration

### 9.1 Environment Variables

```bash
# SMTP Configuration
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=noreply@example.com
EMAIL_PASSWORD=your-password
EMAIL_FROM="DaoDao <noreply@example.com>"

# Queue Configuration (Redis)
REDIS_HOST=localhost
REDIS_PORT=6379
```

---

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0.0 | 2026-02-06 | System | Initial specification |
