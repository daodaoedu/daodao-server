# Email 模板使用指南

## 概述

DaoDaoEdu 使用基於 TypeScript 的郵件模板系統，所有模板均為響應式設計，支援桌面和行動裝置。

## 模板架構

### 目錄結構

```
src/services/email/
├── template.service.ts         # 模板管理服務
├── base-template.ts            # 基礎組件和工具
├── welcome-template.ts         # 歡迎信模板
├── verification-template.ts    # 驗證郵件模板
├── password-reset-template.ts  # 密碼重設模板
├── contact-template.ts         # 聯絡郵件模板
└── marathon-template.ts        # 馬拉松活動模板
```

### 模板服務

**位置**: `src/services/email/template.service.ts`

```typescript
import { EmailTemplateService } from '@/services/email/template.service';

const templateService = new EmailTemplateService();

// 生成模板
const { subject, html } = templateService.generateWelcomeEmail({
  name: '用戶名稱',
  hasCompletedQuiz: false,
});
```

## 設計系統

### 色彩系統

基於 Figma 設計規範：

```typescript
export const EMAIL_COLORS = {
  bgOuter: '#F5FFFD',       // 外層背景
  bgContent: '#FFFFFF',     // 內容區背景
  bgFooter: '#F4F6F6',      // Footer 背景
  bgQuote: '#F5FFFD',       // 引言區塊背景
  textHeading: '#0D3036',   // 主標題
  textPrimary: '#295E5C',   // 主要文字
  textSecondary: '#9FB5B8', // 次要文字
  brandCyan: '#16B9B3',     // 品牌主色/CTA
  brandOrange: '#FFA10B',   // 橘色 CTA
  ctaText: '#0D3036',       // CTA 按鈕文字
  divider: '#E0E0E0',       // 分隔線
};
```

### 資產 CDN

```typescript
export const EMAIL_ASSETS = {
  logo: 'https://daodao.so/images/emails/logo.png',
  banner: 'https://daodao.so/images/emails/banner.png',
  mascot: 'https://daodao.so/images/emails/joyride.png',
  arrow: 'https://daodao.so/images/emails/vector.svg',
  threads: 'https://daodao.so/images/emails/threads.svg',
  facebook: 'https://daodao.so/images/emails/facebook.svg',
  instagram: 'https://daodao.so/images/emails/instagram.svg',
  linkedin: 'https://daodao.so/images/emails/linkedin.svg',
};

export const SOCIAL_LINKS = {
  threads: 'https://www.threads.net/@daodao.edu',
  facebook: 'https://www.facebook.com/daodaoedu/',
  instagram: 'https://www.instagram.com/daodao.edu/',
  linkedin: 'https://www.linkedin.com/company/daodaoedu/',
};
```

### 響應式規格

| 裝置 | 寬度 | 內容區寬度 |
|------|------|-----------|
| Desktop | 600px | 420px |
| Mobile | < 600px | 296px |

### 字體堆疊

```css
font-family: 'Noto Sans TC', 'Microsoft JhengHei', 'PingFang TC', Arial, sans-serif;
```

## 基礎組件

### 位置

`src/services/email/base-template.ts`

### 可用組件

#### generateEmailHead

生成 HTML head 區塊，包含 Outlook 相容性處理。

```typescript
const head = generateEmailHead('郵件標題');
```

#### generateEmailWrapper

生成郵件外層包裝。

```typescript
const wrapper = generateEmailWrapper({
  content: '<p>內容</p>',
  preheader: '預覽文字',
});
```

#### generateBanner

生成頂部 Banner 區塊。

```typescript
const banner = generateBanner();
```

#### generateFooter

生成底部 Footer 區塊，包含社群連結。

```typescript
const footer = generateFooter('https://daodao.so/unsubscribe');
```

#### generateAuthorSection

生成作者署名區塊。

```typescript
const author = generateAuthorSection();
```

#### generateCtaButton

生成 CTA 按鈕，支援 Outlook VML。

```typescript
const button = generateCtaButton({
  text: '開始探索',
  url: 'https://daodao.so',
  color: 'cyan', // 'cyan' | 'orange'
});
```

#### generateDivider

生成分隔線。

```typescript
const divider = generateDivider();
```

#### generateStandardEmail

生成標準郵件 HTML，統一處理 head、wrapper、banner、footer。

```typescript
const { subject, html } = generateStandardEmail({
  subject: '郵件主旨',
  preheader: '預覽文字',
  content: '<p>內容</p>',
  unsubscribeUrl: 'https://daodao.so/unsubscribe',
});
```

## 模板詳細說明

### 1. 歡迎信模板

**位置**: `src/services/email/welcome-template.ts`

根據 `hasCompletedQuiz` 標誌生成不同版本：

| 版本 | 條件 | 特色 |
|------|------|------|
| 已做測驗 | `hasCompletedQuiz: true` | 簡短引導，1 個 CTA |
| 未做測驗 | `hasCompletedQuiz: false` | 詳細功能介紹，2 個 CTA |

**資料介面:**

```typescript
interface WelcomeEmailData {
  name: string;                    // 使用者名稱
  hasCompletedQuiz: boolean;       // 是否完成測驗
  practiceUrl?: string;            // 主題實踐連結
  quizUrl?: string;                // 學習類型測驗連結
  illustrationUrl?: string;        // 海星插圖 URL
  unsubscribeUrl?: string;         // 取消訂閱連結
}
```

**使用範例:**

```typescript
import { generateWelcomeEmail } from '@/services/email/welcome-template';

// 未做測驗版本
const { subject, html } = generateWelcomeEmail({
  name: '小明',
  hasCompletedQuiz: false,
  practiceUrl: 'https://daodao.so/practice',
  quizUrl: 'https://daodao.so/quiz',
});

// 已做測驗版本
const { subject, html } = generateWelcomeEmail({
  name: '小明',
  hasCompletedQuiz: true,
  practiceUrl: 'https://daodao.so/practice',
});
```

---

### 2. 驗證郵件模板

**位置**: `src/services/email/verification-template.ts`

用於用戶註冊後的電子郵件驗證。

**資料介面:**

```typescript
interface VerificationEmailData {
  name?: string;
  verifyLink: string;
}
```

**使用範例:**

```typescript
import { generateVerificationEmail } from '@/services/email/verification-template';

const { subject, html } = generateVerificationEmail({
  name: '小明',
  verifyLink: 'https://api.daodao.so/email/verify?token=abc123',
});
```

---

### 3. 密碼重設模板

**位置**: `src/services/email/password-reset-template.ts`

包含密碼重設連結和 24 小時過期提醒。

**資料介面:**

```typescript
interface PasswordResetEmailData {
  name?: string;
  resetLink: string;
}
```

**使用範例:**

```typescript
import { generatePasswordResetEmail } from '@/services/email/password-reset-template';

const { subject, html } = generatePasswordResetEmail({
  name: '小明',
  resetLink: 'https://daodao.so/reset-password?token=abc123',
});
```

---

### 4. 聯絡郵件模板

**位置**: `src/services/email/contact-template.ts`

用於用戶間的聯絡通知，包含發件人資料卡、訊息內容、聯絡方式。

**資料介面:**

```typescript
interface ContactEmailData {
  name: string;                   // 發件人名稱
  message: string;                // 聯絡訊息
  userInfo?: string | string[];   // 聯絡方式
  activityTitle?: string;         // 活動標題
  url?: string;                   // 檔案詳情 URL
  userId?: string;                // 發件人 ID
  roleList?: string[];            // 角色列表
  photoUrl?: string;              // 頭像 URL
}
```

**使用範例:**

```typescript
import { generateContactEmail } from '@/services/email/contact-template';

const { subject, html } = generateContactEmail({
  name: '小明',
  message: '想了解更多關於這個活動的資訊',
  userInfo: ['email@example.com', 'LINE: example'],
  activityTitle: '學習工作坊',
});
```

---

### 5. 馬拉松郵件模板

**位置**: `src/services/email/marathon-template.ts`

用於馬拉松活動報名確認。

**資料介面:**

```typescript
interface MarathonEmailData {
  name: string;
  marathonTitle: string;
  marathonDate?: string;
  marathonDescription?: string;
}
```

**使用範例:**

```typescript
import { generateMarathonEmail } from '@/services/email/marathon-template';

const { subject, html } = generateMarathonEmail({
  name: '小明',
  marathonTitle: '學習馬拉松 2024',
  marathonDate: '2024-06-01',
  marathonDescription: '為期一個月的學習挑戰',
});
```

## 建立新模板

### 步驟 1: 建立模板檔案

```typescript
// src/services/email/new-template.ts
import {
  EMAIL_COLORS,
  EMAIL_ASSETS,
  generateStandardEmail,
  generateCtaButton,
} from './base-template';
import { escapeHtml, sanitizeUrl } from '@/utils/sanitize';

export interface NewEmailData {
  name: string;
  customField: string;
}

export function generateNewEmail(data: NewEmailData) {
  const { name, customField } = data;

  const content = `
    <h2 style="color: ${EMAIL_COLORS.textHeading};">
      你好，${escapeHtml(name)}！
    </h2>
    <p style="color: ${EMAIL_COLORS.textPrimary};">
      ${escapeHtml(customField)}
    </p>
    ${generateCtaButton({
      text: '了解更多',
      url: 'https://daodao.so',
      color: 'cyan',
    })}
  `;

  return generateStandardEmail({
    subject: '新模板郵件',
    preheader: '這是預覽文字',
    content,
  });
}
```

### 步驟 2: 加入模板服務

```typescript
// src/services/email/template.service.ts
import { generateNewEmail, NewEmailData } from './new-template';

export class EmailTemplateService {
  // ... 其他方法

  generateNewEmail(data: NewEmailData) {
    return generateNewEmail(data);
  }
}
```

### 步驟 3: 加入 Email Service

```typescript
// src/services/email/email.service.ts
async sendNewEmail(to: string, data: NewEmailData) {
  const template = this.templateService.generateNewEmail(data);
  return this.sendEmail({
    to,
    subject: template.subject,
    html: template.html,
  });
}
```

## 安全注意事項

### XSS 防護

所有用戶輸入必須通過淨化：

```typescript
import { escapeHtml, sanitizeUrl } from '@/utils/sanitize';

// 文字內容
const safeName = escapeHtml(userInput);

// URL
const safeUrl = sanitizeUrl(userUrl);
```

### 範例

```typescript
// ❌ 不安全
const html = `<p>你好，${name}！</p>`;

// ✅ 安全
const html = `<p>你好，${escapeHtml(name)}！</p>`;

// ❌ 不安全
const html = `<a href="${url}">連結</a>`;

// ✅ 安全
const html = `<a href="${sanitizeUrl(url)}">連結</a>`;
```

## 郵件客戶端相容性

### 支援的客戶端

- Gmail（Web、iOS、Android）
- Apple Mail（macOS、iOS）
- Outlook（2007+、Web）
- Yahoo Mail
- 其他現代郵件客戶端

### Outlook 特殊處理

模板使用 VML 確保 Outlook 相容性：

```html
<!--[if mso]>
<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml"
  style="height:44px;v-text-anchor:middle;width:160px;"
  arcsize="50%" stroke="f" fillcolor="#16B9B3">
  <w:anchorlock/>
  <center>
<![endif]-->
<a href="URL" style="...">按鈕文字</a>
<!--[if mso]>
  </center>
</v:roundrect>
<![endif]-->
```

## 測試模板

### 預覽 API

```typescript
// 使用 API 預覽模板
const response = await fetch('/api/v1/email/preview', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    template: 'welcome',
    data: {
      name: '測試用戶',
      hasCompletedQuiz: false,
    },
  }),
});

const { html } = await response.json();
```

### 本地測試

```typescript
import { EmailTemplateService } from '@/services/email/template.service';

const templateService = new EmailTemplateService();
const { subject, html } = templateService.generateWelcomeEmail({
  name: '測試用戶',
  hasCompletedQuiz: false,
});

// 將 html 寫入檔案或在瀏覽器中開啟
fs.writeFileSync('preview.html', html);
```

## 相關文件

- [系統郵件模板規格](./system-email-template-spec.md)
- [歡迎信 HTML 範例](./system-welcome-template-example.html)
- [Email 服務文件](./email-service.md)
- [API 參考文件](./api-reference.md)
