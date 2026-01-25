# 系統信模板實作指南

> **最後更新**: 2026-01-25（新增 email_logs 發送紀錄整合說明）

本文件說明如何在 daodao-server 中更新歡迎信模板，以符合新的 Figma 設計規格。

---

## 0. 郵件發送紀錄整合 (`email_logs`)

### 0.1 資料表說明

系統使用 `email_logs` 表記錄所有郵件發送紀錄，支援以下功能：

- **追蹤郵件發送狀態**：記錄每封郵件的發送時間與狀態
- **避免重複發送**：發送前檢查是否已發送過相同郵件
- **沉默邏輯**：根據用戶互動情況決定是否停發（如連續未開信則停發）

> 📁 **資料表定義**：`daodao-storage/init-scripts-refactored/700_create_table_email_logs.sql`

### 0.2 資料表結構

```sql
CREATE TABLE "email_logs" (
    "id" SERIAL PRIMARY KEY,
    "user_id" INT NOT NULL,                    -- 收件者 ID

    -- 郵件分類
    "email_type" VARCHAR(50) NOT NULL          -- 郵件類型
        CHECK ("email_type" IN (
            'auth_register',                   -- 註冊確認
            'auth_password_reset',             -- 密碼重設
            'auth_email_verify',               -- 信箱驗證
            'practice_created',                -- PE01: 建立成功
            'practice_first_checkin',          -- PE02: 第一次打卡
            'practice_weekly_summary',         -- PE03-06: 當週回顧
            'practice_final_summary',          -- PE07-08: 實踐完成總結
            'notification'                     -- 一般通知
        )),

    -- 關聯實體（可選）
    "entity_type" VARCHAR(50),                 -- 實體類型：practice, project...
    "entity_id" INT,                           -- 實體 ID

    -- 郵件資訊
    "email_code" VARCHAR(20),                  -- 細分代碼：PE01, PE02...
    "subject" VARCHAR(255),                    -- 郵件主旨
    "status" VARCHAR(20) DEFAULT 'sent'        -- 發送狀態
        CHECK ("status" IN ('pending', 'sent', 'failed')),

    -- 時間
    "sent_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);
```

### 0.3 型別定義

在 `src/services/email/types.ts` 新增：

```typescript
/**
 * 郵件類型
 */
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
} as const;

export type EmailType = typeof EMAIL_TYPES[keyof typeof EMAIL_TYPES];

/**
 * 郵件發送狀態
 */
export const EMAIL_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  FAILED: 'failed',
} as const;

export type EmailStatus = typeof EMAIL_STATUS[keyof typeof EMAIL_STATUS];

/**
 * 郵件記錄資料
 */
export interface EmailLogData {
  userId: number;
  emailType: EmailType;
  entityType?: string;
  entityId?: number;
  emailCode?: string;
  subject: string;
  status?: EmailStatus;
}
```

### 0.4 EmailLogService 實作

在 `src/services/email/email-log.service.ts` 新增：

```typescript
import { prisma } from '../../lib/prisma';
import type { EmailLogData, EmailType } from './types';
import { EMAIL_STATUS } from './types';

/**
 * 記錄郵件發送
 */
export const createEmailLog = async (data: EmailLogData) => {
  return prisma.email_logs.create({
    data: {
      user_id: data.userId,
      email_type: data.emailType,
      entity_type: data.entityType,
      entity_id: data.entityId,
      email_code: data.emailCode,
      subject: data.subject,
      status: data.status || EMAIL_STATUS.SENT,
      sent_at: new Date(),
    },
  });
};

/**
 * 檢查是否已發送過特定郵件（避免重複發送）
 */
export const hasEmailBeenSent = async (params: {
  userId: number;
  emailType: EmailType;
  entityType?: string;
  entityId?: number;
  emailCode?: string;
}): Promise<boolean> => {
  const { userId, emailType, entityType, entityId, emailCode } = params;

  const existing = await prisma.email_logs.findFirst({
    where: {
      user_id: userId,
      email_type: emailType,
      ...(entityType && { entity_type: entityType }),
      ...(entityId && { entity_id: entityId }),
      ...(emailCode && { email_code: emailCode }),
      status: EMAIL_STATUS.SENT,
    },
  });

  return !!existing;
};

/**
 * 取得用戶的郵件發送歷史
 */
export const getUserEmailHistory = async (
  userId: number,
  options?: {
    emailType?: EmailType;
    limit?: number;
  }
) => {
  return prisma.email_logs.findMany({
    where: {
      user_id: userId,
      ...(options?.emailType && { email_type: options.emailType }),
    },
    orderBy: { sent_at: 'desc' },
    take: options?.limit || 50,
  });
};

/**
 * 計算特定時間內的發送次數（用於沉默邏輯）
 */
export const getEmailCountInPeriod = async (params: {
  userId: number;
  emailType: EmailType;
  sinceDate: Date;
}): Promise<number> => {
  const { userId, emailType, sinceDate } = params;

  return prisma.email_logs.count({
    where: {
      user_id: userId,
      email_type: emailType,
      sent_at: { gte: sinceDate },
      status: EMAIL_STATUS.SENT,
    },
  });
};
```

### 0.5 整合到 EmailService

更新 `src/services/email/email.service.ts`：

```typescript
import { createEmailLog, hasEmailBeenSent } from './email-log.service';
import { EMAIL_TYPES } from './types';

// 在 sendWelcomeEmail 方法中整合
async sendWelcomeEmail(
  to: string,
  data: WelcomeEmailData & { userId: number }
): Promise<EmailSendResult> {
  const { userId, ...templateData } = data;

  // 1. 檢查是否已發送過歡迎信
  const alreadySent = await hasEmailBeenSent({
    userId,
    emailType: EMAIL_TYPES.AUTH_REGISTER,
  });

  if (alreadySent) {
    return { success: false, message: '歡迎信已發送過' };
  }

  // 2. 產生郵件內容
  const { subject, html } = generateWelcomeEmail(templateData);

  // 3. 發送郵件
  const result = await this.sendEmail({ to, subject, html });

  // 4. 記錄發送紀錄
  if (result.success) {
    await createEmailLog({
      userId,
      emailType: EMAIL_TYPES.AUTH_REGISTER,
      subject,
    });
  }

  return result;
}
```

### 0.6 使用範例

```typescript
// 發送歡迎信（會自動記錄）
await emailService.sendWelcomeEmail('user@example.com', {
  userId: 123,
  name: '小明',
  hasCompletedQuiz: true,
});

// 檢查是否已發送過
const sent = await hasEmailBeenSent({
  userId: 123,
  emailType: EMAIL_TYPES.AUTH_REGISTER,
});

// 取得用戶郵件歷史
const history = await getUserEmailHistory(123, {
  emailType: EMAIL_TYPES.PRACTICE_WEEKLY_SUMMARY,
  limit: 10,
});
```

---

## 1. 檔案結構

> ⚠️ **重要**：新設計將**取代**現有的 `welcome-template.ts`，而非新增檔案。

實作完成後需調整的檔案：

```
src/services/email/
├── email.service.ts              # 更新 sendWelcomeEmail 方法
├── types.ts                      # 更新 WelcomeEmailData 型別
├── base-template.ts              # 重構：抽出共用組件
└── welcome-template.ts           # 取代：實作兩版本歡迎信
```

---

## 2. 實作步驟

### Step 1: 更新型別定義 (`types.ts`)

在 `src/services/email/types.ts` 更新 `WelcomeEmailData`：

```typescript
/**
 * 歡迎信資料
 * 根據 hasCompletedQuiz 決定使用哪個版本：
 * - true: 已做測驗版本（簡短，1 個 CTA）
 * - false: 未做測驗版本（詳細，2 個 CTA）
 */
export interface WelcomeEmailData {
  /** 使用者名稱 */
  name: string;

  /** 是否已完成學習類型測驗 */
  hasCompletedQuiz: boolean;

  /** 主題實踐連結（兩版本共用） */
  practiceUrl?: string;

  /** 學習類型測驗連結（僅未做測驗版本使用） */
  quizUrl?: string;

  /** 海星插圖 URL */
  illustrationUrl?: string;

  /** 取消訂閱連結 */
  unsubscribeUrl?: string;
}
```

### Step 2: 更新模板檔案 (`welcome-template.ts`)

更新 `src/services/email/welcome-template.ts`，實作兩版本歡迎信：

```typescript
import { getEmailConfig } from '../../config/email.config';
import {
  EMAIL_COLORS,
  EMAIL_ASSETS,
  generateEmailWrapper,
  generateBanner,
  generateFooter,
  generateAuthorSection,
  generateCtaButton,
  generateDivider,
} from './base-template';
import type { EmailTemplate, WelcomeEmailData } from './types';

/**
 * 產生歡迎信模板
 * 根據 hasCompletedQuiz 決定使用哪個版本
 */
export const generateWelcomeEmail = (data: WelcomeEmailData): EmailTemplate => {
  const { name, hasCompletedQuiz, practiceUrl, quizUrl, illustrationUrl, unsubscribeUrl } = data;
  const config = getEmailConfig();

  const subject = '【島島阿學】歡迎來到島島阿學！';

  // 預設值
  const defaultPracticeUrl = `${config.urls.frontend}/practice`;
  const defaultQuizUrl = `${config.urls.frontend}/quiz`;
  const defaultIllustrationUrl = EMAIL_ASSETS.mascot;
  const defaultUnsubscribeUrl = `${config.urls.frontend}/unsubscribe`;

  // 根據測驗狀態選擇內容
  const content = hasCompletedQuiz
    ? generateQuizCompletedContent({
        name,
        practiceUrl: practiceUrl || defaultPracticeUrl,
        illustrationUrl: illustrationUrl || defaultIllustrationUrl,
      })
    : generateQuizPendingContent({
        name,
        quizUrl: quizUrl || defaultQuizUrl,
        practiceUrl: practiceUrl || defaultPracticeUrl,
        illustrationUrl: illustrationUrl || defaultIllustrationUrl,
      });

  const html = generateEmailWrapper({
    content: `
      ${generateBanner()}
      <tr>
        <td class="main-content" style="padding: 32px 40px;">
          ${content}
          ${generateDivider()}
          ${generateAuthorSection()}
        </td>
      </tr>
      ${generateFooter(unsubscribeUrl || defaultUnsubscribeUrl)}
    `,
  });

  return { subject, html };
};

/**
 * 已做測驗版本內容
 */
const generateQuizCompletedContent = (data: {
  name: string;
  practiceUrl: string;
  illustrationUrl: string;
}): string => {
  const { name, practiceUrl, illustrationUrl } = data;

  return `
    <!-- h2: Greeting -->
    <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: ${EMAIL_COLORS.textHeading}; line-height: 150%;">
      Hello ${name}，<br>歡迎來到島島阿學！
    </h2>

    <!-- p: Intro -->
    <p style="margin: 0 0 16px; font-size: 16px; color: ${EMAIL_COLORS.textPrimary}; line-height: 180%;">
      在這個資訊爆炸的時代，我們相信「學習」不該只是為了考取證書或完成課程，而是讓生活更豐富。
    </p>

    <p style="margin: 0 0 24px; font-size: 16px; color: ${EMAIL_COLORS.textPrimary}; line-height: 180%;">
      為了讓你更輕鬆地展開這段旅程，以下是我們想邀請你做的暖身活動：
    </p>

    <!-- h3: Subtitle -->
    <h3 style="margin: 0 0 12px; font-size: 18px; font-weight: 600; color: ${EMAIL_COLORS.brandCyan}; line-height: 150%;">
      把「想做」變成「生活」
    </h3>

    <!-- Quote -->
    <table role="presentation" width="100%" style="margin-bottom: 24px;">
      <tr>
        <td style="border-left: 4px solid ${EMAIL_COLORS.brandCyan}; padding: 14px 18px; background-color: ${EMAIL_COLORS.bgQuote};">
          <p style="margin: 0; font-size: 15px; color: ${EMAIL_COLORS.textPrimary}; line-height: 1.6;">
            不需要大目標。<br>
            試著用我們的「主題實踐」模板，開啟一段 7 到 30 天的小旅程。無論是讀一本書還是練習一個新習慣，重點不在於完成，而在於開始。
          </p>
        </td>
      </tr>
    </table>

    <!-- CTA Button (Orange) -->
    ${generateCtaButton({
      text: '挑選一個學習生活提案',
      url: practiceUrl,
      color: 'orange',
    })}

    <!-- Illustration -->
    <table role="presentation" width="100%" style="margin-bottom: 32px;">
      <tr>
        <td align="center">
          <img src="${illustrationUrl}" alt="島島阿學吉祥物" width="160" height="160" style="display: block;">
        </td>
      </tr>
    </table>

    <!-- Closing -->
    <p style="margin: 0 0 16px; font-size: 16px; font-weight: 500; color: ${EMAIL_COLORS.textPrimary}; font-style: italic; line-height: 160%;">
      在這裡，按照你喜歡的樣子，<br>慢慢走，比較快。
    </p>

    <p style="margin: 0 0 24px; font-size: 16px; font-weight: 400; color: ${EMAIL_COLORS.textPrimary}; line-height: 1.6;">
      準備好開始美好的學習生活了嗎？
    </p>
  `;
};

/**
 * 未做測驗版本內容
 */
const generateQuizPendingContent = (data: {
  name: string;
  quizUrl: string;
  practiceUrl: string;
  illustrationUrl: string;
}): string => {
  const { name, quizUrl, practiceUrl, illustrationUrl } = data;

  return `
    <!-- h2: Greeting -->
    <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: ${EMAIL_COLORS.textHeading}; line-height: 150%;">
      Hello ${name}，<br>歡迎來到島島阿學！
    </h2>

    <!-- p: Intro -->
    <p style="margin: 0 0 16px; font-size: 16px; color: ${EMAIL_COLORS.textPrimary}; line-height: 180%;">
      想學新東西但不確定有沒有興趣？一個人學習覺得孤單？
    </p>

    <p style="margin: 0 0 24px; font-size: 16px; color: ${EMAIL_COLORS.textPrimary}; line-height: 180%;">
      我們以科技與社群打造島島阿學，在這裡，每個人都是知識的創造者與學習推動者！
    </p>

    <!-- h3: Subtitle -->
    <h3 style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: ${EMAIL_COLORS.brandCyan}; line-height: 150%;">
      以下功能幫助你開始...
    </h3>

    <!-- Feature Card 1: Quiz -->
    <table role="presentation" width="100%" style="margin-bottom: 16px; border: 1px solid #E0E0E0; border-radius: 8px;">
      <tr>
        <td style="padding: 16px;">
          <p style="margin: 0 0 8px; font-size: 16px; font-weight: 600; color: ${EMAIL_COLORS.textPrimary};">
            了解自己的學習類型
          </p>
          <p style="margin: 0 0 12px; font-size: 14px; color: ${EMAIL_COLORS.textSecondary}; line-height: 1.5;">
            來做學習類型測驗，找到更適合的學習策略
          </p>
          ${generateCtaButton({
            text: '開始測驗',
            url: quizUrl,
            color: 'cyan',
          })}
        </td>
      </tr>
    </table>

    <!-- Feature Card 2: Practice -->
    <table role="presentation" width="100%" style="margin-bottom: 24px; border: 1px solid #E0E0E0; border-radius: 8px;">
      <tr>
        <td style="padding: 16px;">
          <p style="margin: 0 0 8px; font-size: 16px; font-weight: 600; color: ${EMAIL_COLORS.textPrimary};">
            主題實踐
          </p>
          <p style="margin: 0 0 12px; font-size: 14px; color: ${EMAIL_COLORS.textSecondary}; line-height: 1.5;">
            登入「我的小島」，用 7-30 天輕鬆探索新領域，也歡迎從我們的模板獲得靈感哦！
          </p>
          ${generateCtaButton({
            text: '挑選一個學習生活提案',
            url: practiceUrl,
            color: 'orange',
          })}
        </td>
      </tr>
    </table>

    <!-- Reminder -->
    <p style="margin: 0 0 24px; font-size: 14px; color: ${EMAIL_COLORS.textSecondary}; line-height: 1.6;">
      還有，別忘了完成帳號設定和偏好設定，獲得更好的體驗...
    </p>

    <!-- Illustration -->
    <table role="presentation" width="100%" style="margin-bottom: 32px;">
      <tr>
        <td align="center">
          <img src="${illustrationUrl}" alt="島島阿學吉祥物" width="160" height="160" style="display: block;">
        </td>
      </tr>
    </table>

    <!-- Closing -->
    <p style="margin: 0 0 24px; font-size: 16px; font-weight: 400; color: ${EMAIL_COLORS.textPrimary}; line-height: 1.6;">
      準備好開始美好的學習生活了嗎？
    </p>
  `;
};
```

### Step 3: 更新 EmailService 方法 (`email.service.ts`)

更新 `EmailService` 中的 `sendWelcomeEmail` 方法：

```typescript
import { generateWelcomeEmail } from './welcome-template';
import type { WelcomeEmailData } from './types';

// 更新現有方法
async sendWelcomeEmail(
  to: string,
  data: WelcomeEmailData
): Promise<EmailSendResult> {
  const { subject, html } = generateWelcomeEmail(data);

  return this.sendEmail({
    to,
    subject,
    html,
  });
}
```

**使用範例：**

```typescript
// 已做測驗的用戶
await emailService.sendWelcomeEmail('user@example.com', {
  name: '小明',
  hasCompletedQuiz: true,
  practiceUrl: 'https://daoedu.tw/practice',
});

// 未做測驗的用戶
await emailService.sendWelcomeEmail('user@example.com', {
  name: '小明',
  hasCompletedQuiz: false,
  quizUrl: 'https://daoedu.tw/quiz',
  practiceUrl: 'https://daoedu.tw/practice',
});
```

### Step 4: 更新 Zod 驗證 Schema (`email.validators.ts`)

在 `src/validators/email.validators.ts` 更新：

```typescript
export const welcomeEmailSchema = z.object({
  to: z.string().email('請提供有效的電子郵件地址'),
  name: z.string().min(1, '請提供使用者名稱'),
  hasCompletedQuiz: z.boolean(),
  practiceUrl: z.string().url().optional(),
  quizUrl: z.string().url().optional(),
  illustrationUrl: z.string().url().optional(),
  unsubscribeUrl: z.string().url().optional(),
}).refine(
  // 如果未做測驗，quizUrl 應該要有值
  (data) => data.hasCompletedQuiz || data.quizUrl,
  {
    message: '未做測驗版本需要提供 quizUrl',
    path: ['quizUrl'],
  }
);

export type WelcomeEmailInput = z.infer<typeof welcomeEmailSchema>;
```

### Step 5: 重構 base-template.ts

新增共用組件到 `src/services/email/base-template.ts`：

```typescript
/**
 * 郵件色彩常數（基於 Figma 設計系統）
 */
export const EMAIL_COLORS = {
  bgOuter: '#F5FFFD',       // Very Light Blue
  bgContent: '#FFFFFF',     // White
  bgFooter: '#F4F6F6',      // Very Light Gray
  bgQuote: '#F5FFFD',       // Very Light Blue - 引言區塊背景
  textHeading: '#0D3036',   // BG Dark - 主標題 (h2)
  textPrimary: '#295E5C',   // Text Dark
  textSecondary: '#9FB5B8', // Light Gray
  brandCyan: '#16B9B3',     // Logo Cyan
  brandOrange: '#FFA10B',   // Logo Orange
  ctaText: '#0D3036',       // BG Dark - CTA 按鈕文字
  divider: '#E0E0E0',       // Divider color
} as const;

/**
 * 郵件資源連結
 */
export const EMAIL_ASSETS = {
  logo: 'https://daodao.so/images/emails/logo.png',
  banner: 'https://daodao.so/images/emails/banner.png',
  mascot: 'https://daodao.so/images/emails/joyride.png',
  arrow: 'https://daodao.so/images/emails/vector.svg',
  threads: 'https://daodao.so/images/emails/threads.svg',
  facebook: 'https://daodao.so/images/emails/facebook.svg',
  instagram: 'https://daodao.so/images/emails/instagram.svg',
  linkedin: 'https://daodao.so/images/emails/linkedin.svg',
} as const;

/**
 * CTA 按鈕生成器
 */
export const generateCtaButton = (options: {
  text: string;
  url: string;
  color: 'orange' | 'cyan';
}): string => {
  const { text, url, color } = options;
  const bgColor = color === 'orange' ? EMAIL_COLORS.brandOrange : EMAIL_COLORS.brandCyan;

  return `
    <table role="presentation" width="100%" style="margin-bottom: 16px;">
      <tr>
        <td align="center">
          <a href="${url}" style="display: inline-block; padding: 14px 28px; background-color: ${bgColor}; color: ${EMAIL_COLORS.ctaText}; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 24px;">
            ${text}
            <img src="${EMAIL_ASSETS.arrow}" alt=">" width="8" height="8" style="display: inline-block; vertical-align: middle; margin-left: 5px;">
          </a>
        </td>
      </tr>
    </table>
  `;
};

/**
 * 分隔線
 */
export const generateDivider = (): string => `
  <table role="presentation" width="100%">
    <tr>
      <td style="padding-bottom: 24px;">
        <hr style="border: none; border-top: 1px solid ${EMAIL_COLORS.divider}; margin: 0;">
      </td>
    </tr>
  </table>
`;

/**
 * 作者區塊
 */
export const generateAuthorSection = (): string => `
  <table role="presentation" width="100%">
    <tr>
      <td align="center">
        <p style="margin: 0 0 4px; font-size: 16px; font-weight: 600; color: ${EMAIL_COLORS.textPrimary};">島島阿學團隊</p>
        <p style="margin: 0 0 8px; font-size: 14px; font-weight: 400; color: ${EMAIL_COLORS.textPrimary};">你的學習生活提案所</p>
        <p style="margin: 0; font-size: 13px; font-weight: 400; color: ${EMAIL_COLORS.textSecondary}; font-style: italic;">Where personal growth meets collective wisdom!</p>
      </td>
    </tr>
  </table>
`;

// ... 其他共用組件（Banner、Footer、Wrapper）
```

---

## 3. 測試方式

### 3.1 預覽端點 - 已做測驗版本

```bash
curl -X POST http://localhost:4000/api/v1/email/preview \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "templateType": "welcome",
    "data": {
      "name": "測試用戶",
      "hasCompletedQuiz": true
    }
  }'
```

### 3.2 預覽端點 - 未做測驗版本

```bash
curl -X POST http://localhost:4000/api/v1/email/preview \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "templateType": "welcome",
    "data": {
      "name": "測試用戶",
      "hasCompletedQuiz": false,
      "quizUrl": "https://daoedu.tw/quiz"
    }
  }'
```

### 3.3 發送測試郵件

```bash
# 已做測驗版本
curl -X POST http://localhost:4000/api/v1/email/welcome \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "to": "test@example.com",
    "name": "測試用戶",
    "hasCompletedQuiz": true
  }'

# 未做測驗版本
curl -X POST http://localhost:4000/api/v1/email/welcome \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "to": "test@example.com",
    "name": "測試用戶",
    "hasCompletedQuiz": false
  }'
```

---

## 4. 圖片資源上傳

### 4.1 海星插圖

1. 從 Google Drive 下載插圖
2. 上傳至 Cloudflare R2 或 GitHub CDN
3. 更新 `system-welcome-template.ts` 中的 `defaultIllustrationUrl`

### 4.2 社群圖示

確認以下圖示在 CDN 上可用：

- `threads.png`
- `facebook.png`
- `instagram.png`
- `linkedin.png`

---

## 5. 跨客戶端測試清單

### 5.1 已做測驗版本

- [ ] Gmail (Web)
- [ ] Gmail (Android/iOS App)
- [ ] Outlook (Windows Desktop)
- [ ] Outlook (Web)
- [ ] Apple Mail (macOS)
- [ ] Apple Mail (iOS)
- [ ] Yahoo Mail
- [ ] 企業郵件 (Exchange)

### 5.2 未做測驗版本

- [ ] Gmail (Web)
- [ ] Gmail (Android/iOS App)
- [ ] Outlook (Windows Desktop)
- [ ] Outlook (Web)
- [ ] Apple Mail (macOS)
- [ ] Apple Mail (iOS)
- [ ] Yahoo Mail
- [ ] 企業郵件 (Exchange)

### 5.3 功能測試

- [ ] 兩版本切換邏輯正確
- [ ] 青色按鈕連結正確 (quizUrl)
- [ ] 橘色按鈕連結正確 (practiceUrl)
- [ ] 響應式佈局正常（Mobile / Desktop）

---

## 6. 相關文件

- [系統信模板規格文件](./system-email-template-spec.md)
- [歡迎信文案](./Welcome%20Letter%20-%20202601.md)
- [HTML 模板範例 - 已做測驗版本](./system-welcome-template-example.html)
- [差異分析報告](./email-service-gap-analysis.md)
- [Figma 設計稿](https://www.figma.com/design/7cA0RqLu27puqzqkueEyPc/Email?node-id=3-715)
