# Email 服務提供商分析

## 現況

目前 DaoDaoEdu 使用 **Gmail SMTP** 發送郵件，透過 Nodemailer 整合。

### Gmail SMTP 現況評估

| 項目 | 說明 |
|------|------|
| 每日限制 | 500 封（一般帳號）/ 2,000 封（Google Workspace） |
| 優點 | 免費、設定簡單、可靠度高 |
| 缺點 | 發送量限制、無法追蹤開信率、需應用程式密碼 |
| 適用場景 | 小型專案、開發測試環境 |

---

## 未來可選方案

### 1. Transactional Email 服務

專為應用程式發送交易型郵件設計的服務。

#### SendGrid (Twilio)

| 項目 | 說明 |
|------|------|
| 免費額度 | 100 封/天 |
| 付費方案 | $19.95/月起（50,000 封） |
| 優點 | 高送達率、完整 API、開信/點擊追蹤、模板編輯器 |
| 缺點 | 進階功能需付費 |
| 整合難度 | 低（有官方 Node.js SDK） |
| 推薦度 | ⭐⭐⭐⭐⭐ |

```typescript
// SendGrid 整合範例
import sgMail from '@sendgrid/mail';
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

await sgMail.send({
  to: 'user@example.com',
  from: 'noreply@daodao.so',
  subject: '歡迎加入',
  html: '<p>內容</p>',
});
```

#### Mailgun

| 項目 | 說明 |
|------|------|
| 免費額度 | 5,000 封/月（3 個月試用） |
| 付費方案 | $35/月起（50,000 封） |
| 優點 | 強大 API、郵件驗證、路由功能 |
| 缺點 | 免費額度少、需綁信用卡 |
| 整合難度 | 低（REST API 或 SMTP） |
| 推薦度 | ⭐⭐⭐⭐ |

```typescript
// Mailgun 整合範例
import formData from 'form-data';
import Mailgun from 'mailgun.js';

const mg = new Mailgun(formData).client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY,
});

await mg.messages.create('daodao.so', {
  from: '島島阿學 <noreply@daodao.so>',
  to: ['user@example.com'],
  subject: '歡迎加入',
  html: '<p>內容</p>',
});
```

#### Amazon SES (Simple Email Service)

| 項目 | 說明 |
|------|------|
| 免費額度 | 62,000 封/月（從 EC2 發送） |
| 付費方案 | $0.10/1,000 封 |
| 優點 | 極低成本、高可擴展性、AWS 生態整合 |
| 缺點 | 設定較複雜、需驗證網域、初期有發送限制 |
| 整合難度 | 中（需 AWS SDK） |
| 推薦度 | ⭐⭐⭐⭐⭐ |

```typescript
// Amazon SES 整合範例
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const ses = new SESClient({ region: 'ap-northeast-1' });

await ses.send(new SendEmailCommand({
  Source: 'noreply@daodao.so',
  Destination: { ToAddresses: ['user@example.com'] },
  Message: {
    Subject: { Data: '歡迎加入' },
    Body: { Html: { Data: '<p>內容</p>' } },
  },
}));
```

#### Postmark

| 項目 | 說明 |
|------|------|
| 免費額度 | 100 封/月 |
| 付費方案 | $15/月起（10,000 封） |
| 優點 | 極高送達率、優秀文檔、模板系統 |
| 缺點 | 價格較高、免費額度少 |
| 整合難度 | 低 |
| 推薦度 | ⭐⭐⭐⭐ |

#### Resend

| 項目 | 說明 |
|------|------|
| 免費額度 | 3,000 封/月 |
| 付費方案 | $20/月起（50,000 封） |
| 優點 | 現代 API、React Email 支援、開發者友好 |
| 缺點 | 較新服務、功能仍在發展中 |
| 整合難度 | 極低 |
| 推薦度 | ⭐⭐⭐⭐ |

```typescript
// Resend 整合範例
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: '島島阿學 <noreply@daodao.so>',
  to: ['user@example.com'],
  subject: '歡迎加入',
  html: '<p>內容</p>',
});
```

---

### 2. 自架郵件伺服器

#### Postal

| 項目 | 說明 |
|------|------|
| 費用 | 免費（開源） |
| 優點 | 完全控制、無發送限制、自訂性高 |
| 缺點 | 需自行維護、IP 信譽管理、技術門檻高 |
| 適用場景 | 大量發送、有 DevOps 團隊 |

#### Mailu

| 項目 | 說明 |
|------|------|
| 費用 | 免費（開源） |
| 優點 | Docker 部署、完整郵件套件 |
| 缺點 | 維護成本高、需處理垃圾郵件過濾 |

---

### 3. 行銷/大量郵件服務

適用於電子報、行銷活動等場景。

#### Mailchimp

| 項目 | 說明 |
|------|------|
| 免費額度 | 500 聯絡人/月 |
| 優點 | 強大模板編輯器、自動化流程、分析報表 |
| 缺點 | 價格較高、主要針對行銷用途 |
| 適用場景 | 電子報、行銷活動 |

#### Brevo (原 Sendinblue)

| 項目 | 說明 |
|------|------|
| 免費額度 | 300 封/天 |
| 付費方案 | $25/月起（20,000 封） |
| 優點 | 交易+行銷合一、SMS 支援、自動化 |
| 缺點 | 免費版有 Brevo logo |
| 推薦度 | ⭐⭐⭐⭐ |

---

## 比較總覽

| 服務 | 免費額度 | 每千封成本 | 送達率 | API 品質 | 適合階段 |
|------|---------|-----------|--------|---------|---------|
| Gmail SMTP | 500/天 | 免費 | 高 | N/A | 開發/小型 |
| SendGrid | 100/天 | $0.40 | 極高 | 優秀 | 中型/成長期 |
| Mailgun | 5,000/月 | $0.70 | 高 | 優秀 | 中型 |
| Amazon SES | 62,000/月* | $0.10 | 高 | 良好 | 大型/成本敏感 |
| Postmark | 100/月 | $1.50 | 極高 | 優秀 | 重視送達率 |
| Resend | 3,000/月 | $0.40 | 高 | 優秀 | 新專案/現代化 |
| Brevo | 300/天 | $1.25 | 高 | 良好 | 行銷+交易 |

*從 EC2 發送

---

## 建議升級路徑

### 階段 1：目前（< 500 封/天）
**維持 Gmail SMTP**
- 成本：免費
- 適合開發和小量發送

### 階段 2：成長期（500-10,000 封/天）
**推薦：SendGrid 或 Resend**
- 理由：易於整合、免費額度足夠測試
- 預估成本：$20-50/月

```typescript
// 程式碼改動最小化 - 抽象郵件服務
interface EmailProvider {
  send(options: EmailOptions): Promise<EmailResult>;
}

class SendGridProvider implements EmailProvider { ... }
class GmailProvider implements EmailProvider { ... }

// 根據環境變數切換
const emailProvider = process.env.EMAIL_PROVIDER === 'sendgrid'
  ? new SendGridProvider()
  : new GmailProvider();
```

### 階段 3：規模化（> 10,000 封/天）
**推薦：Amazon SES**
- 理由：極低成本、高可擴展性
- 預估成本：$1/10,000 封

---

## 遷移考量

### 網域驗證

大多數服務需要驗證發送網域：

1. 新增 SPF 記錄
```
v=spf1 include:sendgrid.net ~all
```

2. 新增 DKIM 記錄
```
selector._domainkey.daodao.so -> CNAME -> sendgrid.net
```

3. 新增 DMARC 記錄
```
v=DMARC1; p=quarantine; rua=mailto:dmarc@daodao.so
```

### 程式碼重構建議

建議採用策略模式，方便未來切換服務：

```typescript
// src/services/email/providers/index.ts
export interface IEmailProvider {
  name: string;
  send(options: EmailSendOptions): Promise<EmailSendResult>;
  checkHealth(): Promise<HealthCheckResult>;
}

// src/services/email/providers/gmail.provider.ts
export class GmailProvider implements IEmailProvider { ... }

// src/services/email/providers/sendgrid.provider.ts
export class SendGridProvider implements IEmailProvider { ... }

// src/services/email/providers/ses.provider.ts
export class SESProvider implements IEmailProvider { ... }

// src/services/email/email.service.ts
export class EmailService {
  private provider: IEmailProvider;

  constructor() {
    this.provider = this.createProvider(process.env.EMAIL_PROVIDER);
  }

  private createProvider(type: string): IEmailProvider {
    switch (type) {
      case 'sendgrid': return new SendGridProvider();
      case 'ses': return new SESProvider();
      default: return new GmailProvider();
    }
  }
}
```

---

## 功能比較

| 功能 | Gmail | SendGrid | SES | Resend |
|------|-------|----------|-----|--------|
| 開信追蹤 | ❌ | ✅ | ✅ | ✅ |
| 點擊追蹤 | ❌ | ✅ | ✅ | ✅ |
| 退信處理 | ❌ | ✅ | ✅ | ✅ |
| Webhook | ❌ | ✅ | ✅ | ✅ |
| 模板管理 | ❌ | ✅ | ✅ | ✅ |
| A/B 測試 | ❌ | ✅ | ❌ | ❌ |
| 排程發送 | ❌ | ✅ | ❌ | ✅ |
| 批量發送 | 有限 | ✅ | ✅ | ✅ |

---

## 結論與建議

### 短期（1-6 個月）
維持現有 Gmail SMTP，同時：
1. 實作抽象層（Provider 介面）
2. 設定網域 SPF/DKIM/DMARC
3. 監控每日發送量

### 中期（6-12 個月）
當發送量接近 Gmail 限制時：
1. 優先考慮 **SendGrid** 或 **Resend**
2. 整合開信追蹤功能
3. 實作退信處理機制

### 長期（> 12 個月）
當發送量超過 50,000 封/月：
1. 遷移至 **Amazon SES**
2. 實作發送佇列（Queue）
3. 建立郵件送達率監控系統
