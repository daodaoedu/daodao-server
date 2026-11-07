# Email 服務技術文件

## 概述

DaoDaoEdu 平台的 Email 服務基於 Nodemailer 實現，提供完整的郵件發送、模板管理、記錄追蹤功能。

## 檔案結構

```
src/
├── services/email/
│   ├── email.service.ts              # 主郵件服務類
│   ├── email-log.service.ts          # 郵件記錄服務
│   ├── template.service.ts           # 模板管理服務
│   ├── base-template.ts              # 基礎模板組件
│   ├── welcome-template.ts           # 歡迎信模板
│   ├── verification-template.ts      # 驗證郵件模板
│   ├── password-reset-template.ts    # 密碼重設模板
│   ├── contact-template.ts           # 聯絡郵件模板
│   └── marathon-template.ts          # 馬拉松活動模板
│
├── controllers/
│   └── email.controller.ts           # Email API 控制器
│
├── routes/
│   └── email.routes.ts               # Email 路由定義
│
├── config/
│   └── email.config.ts               # Email 配置管理
│
├── validators/
│   └── email.validators.ts           # Zod 驗證 Schemas
│
└── types/email/
    ├── index.ts                      # 統一導出
    ├── base.types.ts                 # 基礎型別
    ├── template-data.types.ts        # 模板資料介面
    ├── service.types.ts              # 服務介面
    ├── options.types.ts              # 選項介面
    └── advanced.types.ts             # 進階型別
```

## 核心功能

### EmailService 主服務

**位置**: `src/services/email/email.service.ts`

#### 主要特性

- **Nodemailer 整合**: 使用 Nodemailer v6.9.8 驅動 SMTP
- **重試機制**: 可配置的自動重試（預設 3 次，1 秒退避）
- **批量發送**: 支援最多 100 個收件人
- **服務健康檢查**: 驗證 SMTP 連線狀態
- **統計追蹤**: 即時記錄發送成功/失敗計數
- **發送紀錄整合**: 自動記錄到 `email_logs` 資料表

#### 核心方法

```typescript
// 基本發送
async sendEmail(options: EmailSendOptions): Promise<EmailSendResult>

// 特定郵件類型
async sendWelcomeEmail(to: string, data: WelcomeEmailData): Promise<EmailSendResult>
async sendWelcomeEmailWithLog(to: string, data: WelcomeEmailDataWithUser): Promise<EmailSendResult>
async sendVerificationEmail(to: string, verifyLink: string, name?: string): Promise<EmailSendResult>
async sendPasswordResetEmail(to: string, resetLink: string, name?: string): Promise<EmailSendResult>
async sendContactEmail(to: string, fromName: string, message: string, userInfo?: string | string[], activityTitle?: string): Promise<EmailSendResult>
async sendMarathonEmail(to: string, name: string, marathonTitle: string, marathonDate?: string, marathonDescription?: string): Promise<EmailSendResult>
async sendCustomEmail(to: string | string[], subject: string, html: string, options?: EmailSendOptions): Promise<EmailSendResult>

// 批量發送
async sendBulkEmail(recipients: { email: string; data: any }[], templateType: string, customTemplate?: { subject: string; html: string }): Promise<{ success: number; failed: number; results: EmailSendResult[] }>

// 帶重試的發送
async sendEmailWithRetry(options: EmailSendOptions): Promise<EmailSendResult>

// 健康檢查和統計
async checkHealth(): Promise<EmailServiceHealthCheck>
getStats(): EmailServiceStats
```

## 配置

### 環境變數

```bash
# Gmail SMTP 設定（必要）
EMAIL_ADDRESS=test.user@example.com
EMAIL_PASSWORD=your-app-password          # Gmail 應用程式密碼

# URL 設定（必要）
FRONTEND_URL=https://daodao.so
BACKEND_URL=https://api.daodao.so

# 郵件性能調整（選用）
EMAIL_BULK_DELAY_MS=100                   # 批量發送延遲（毫秒）
EMAIL_BATCH_SIZE=10                       # 批次大小
EMAIL_MAX_CONCURRENT=3                    # 最大並發數
```

### 配置結構

**位置**: `src/config/email.config.ts`

```typescript
interface EmailConfig {
  smtp: {
    service: 'gmail';
    auth: {
      user: string;
      pass: string;
    };
  };
  sender: {
    name: '島島阿學';
    email: string;
  };
  urls: {
    frontend: string;
    backend: string;
  };
  retry: {
    maxAttempts: 3;
    backoffMs: 1000;
  };
  bulk: {
    delayMs: 100;
    batchSize: 10;
    maxConcurrent: 3;
  };
}
```

## 郵件記錄服務

### EmailLogService

**位置**: `src/services/email/email-log.service.ts`

#### 功能

```typescript
// 記錄郵件發送
createEmailLog(data: EmailLogData): Promise<EmailLog>

// 更新發送狀態
updateEmailLogStatus(logId: number, status: EmailStatusValue): Promise<void>

// 檢查是否已發送（防止重複發送）
hasEmailBeenSent(params: {
  userId: number;
  emailType: EmailTypeValue;
  entityType?: string;
  entityId?: number;
  emailCode?: string;
}): Promise<boolean>

// 取得用戶郵件歷史
getUserEmailHistory(userId: number, options?: { emailType?: EmailTypeValue; limit?: number }): Promise<EmailLog[]>

// 計算特定時間內的發送次數
getEmailCountInPeriod(params: {
  userId: number;
  emailType: EmailTypeValue;
  sinceDate: Date;
}): Promise<number>

// 取得最近一次發送時間
getLastEmailSentAt(params: {
  userId: number;
  emailType: EmailTypeValue;
  entityType?: string;
  entityId?: number;
}): Promise<Date | null>
```

### 郵件類型

```typescript
export const EMAIL_TYPES = {
  // 認證相關
  AUTH_REGISTER: 'auth_register',
  AUTH_PASSWORD_RESET: 'auth_password_reset',
  AUTH_EMAIL_VERIFY: 'auth_email_verify',

  // 主題實踐相關
  PRACTICE_CREATED: 'practice_created',
  PRACTICE_FIRST_CHECKIN: 'practice_first_checkin',
  PRACTICE_WEEKLY_SUMMARY: 'practice_weekly_summary',
  PRACTICE_FINAL_SUMMARY: 'practice_final_summary',

  // 其他
  NOTIFICATION: 'notification',
};
```

### 郵件狀態

```typescript
export const EMAIL_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  FAILED: 'failed',
};
```

## 資料庫結構

### email_logs 資料表

```sql
model email_logs {
  id          Int       @id @default(autoincrement())
  user_id     Int
  email_type  String    @db.VarChar(50)
  entity_type String?   @db.VarChar(50)
  entity_id   Int?
  email_code  String?   @db.VarChar(20)
  subject     String?   @db.VarChar(255)
  status      String?   @default("sent")
  sent_at     DateTime? @default(now())
  created_at  DateTime? @default(now())
  users       users     @relation(...)

  @@index([user_id], map: "idx_email_logs_user_id")
  @@index([email_type], map: "idx_email_logs_type")
  @@index([entity_type, entity_id], map: "idx_email_logs_entity")
  @@index([sent_at], map: "idx_email_logs_sent_at")
}
```

## 使用範例

### 發送歡迎郵件

```typescript
import { emailService } from '@/services/email/email.service';

// 基本發送
await emailService.sendWelcomeEmail('user@example.com', {
  name: '用戶名稱',
  hasCompletedQuiz: false,
  practiceUrl: 'https://daodao.so/practice',
  quizUrl: 'https://daodao.so/quiz',
});

// 帶記錄的發送
await emailService.sendWelcomeEmailWithLog('user@example.com', {
  name: '用戶名稱',
  hasCompletedQuiz: true,
  userId: 123,
});
```

### 發送驗證郵件

```typescript
await emailService.sendVerificationEmail(
  'user@example.com',
  'https://api.daodao.so/email/verify?token=abc123',
  '用戶名稱'
);
```

### 批量發送

```typescript
const result = await emailService.sendBulkEmail(
  [
    { email: 'user1@example.com', data: { name: '用戶1', hasCompletedQuiz: false } },
    { email: 'user2@example.com', data: { name: '用戶2', hasCompletedQuiz: true } },
  ],
  'welcome'
);

console.log(`成功: ${result.success}, 失敗: ${result.failed}`);
```

### 檢查重複發送

```typescript
import { hasEmailBeenSent } from '@/services/email/email-log.service';

const alreadySent = await hasEmailBeenSent({
  userId: 123,
  emailType: 'auth_register',
});

if (!alreadySent) {
  await emailService.sendWelcomeEmail(...);
}
```

## 依賴套件

```json
{
  "dependencies": {
    "nodemailer": "^6.9.8"
  },
  "devDependencies": {
    "@types/nodemailer": "^6.4.17"
  }
}
```

## 安全性

### XSS 防護

所有用戶輸入通過以下函數進行淨化：

```typescript
import { escapeHtml, sanitizeUrl, isValidEmail } from '@/utils/sanitize';
```

### 安全特性

1. **重試機制**: 自動重試失敗的郵件
2. **速率限制**: 批量發送添加延遲防止服務商限制
3. **重複發送防護**: `hasEmailBeenSent()` 檢查
4. **發送紀錄**: 所有郵件記錄到資料庫
5. **健康檢查**: 定期驗證 SMTP 連線狀態

## 故障排除

### 郵件無法發送

1. 驗證 `EMAIL_ADDRESS` 和 `EMAIL_PASSWORD` 正確
2. 確認 Gmail 帳號已啟用「兩步驟驗證」並生成應用程式密碼
3. 檢查環境變數設定

### 批量郵件緩慢

1. 調整 `EMAIL_BULK_DELAY_MS`（減少延遲）
2. 調整 `EMAIL_MAX_CONCURRENT`（增加並發數）
3. 注意郵件服務商的速率限制

### 健康檢查

```typescript
const health = await emailService.checkHealth();
console.log(health.status); // 'healthy' | 'unhealthy'
console.log(health.transporterConnected);
```
