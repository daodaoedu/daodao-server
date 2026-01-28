# 島島阿學郵件系統使用分析報告

> 📧 **DaoDao 郵件系統完整分析與使用指南**
> 最後更新：2025-10-28

## 📋 目錄

- [系統架構概覽](#系統架構概覽)
- [環境配置](#環境配置)
- [郵件類型與模板](#郵件類型與模板)
- [使用場景分析](#使用場景分析)
- [API 端點說明](#api-端點說明)
- [代碼架構](#代碼架構)
- [統計與監控](#統計與監控)
- [最佳實踐建議](#最佳實踐建議)

---

## 系統架構概覽

### 🏗️ 雙架構並存

DaoDao 郵件系統目前採用 **TypeScript 新版** 與 **JavaScript 舊版** 雙架構並存的方式：

```
郵件系統
├── TypeScript 新版（推薦使用）
│   ├── 核心服務層
│   ├── 模板管理
│   ├── API 控制器
│   └── 型別定義
└── JavaScript 舊版（待遷移）
    ├── 傳統控制器
    └── 內嵌 HTML 模板
```

### 📦 核心組件

| 組件類型 | 檔案路徑 | 功能說明 |
|---------|---------|---------|
| **主郵件服務** | `src/services/email/email.service.ts` | 核心郵件發送邏輯 |
| **增強服務** | `src/services/email/enhanced-email.service.ts` | 提供額外功能（重試、批量） |
| **Auth 服務** | `src/services/auth/email.service.ts` | 認證模組專用包裝層 |
| **模板服務** | `src/services/email/template.service.ts` | 統一管理郵件模板 |
| **控制器** | `src/controllers/email.controller.ts` | API 請求處理 |
| **路由** | `src/routes/email.routes.ts` | RESTful 路由定義 |
| **類型定義** | `src/types/email.types.ts` | TypeScript 型別 |
| **驗證器** | `src/validators/email.validators.ts` | Zod 請求驗證 |

---

## 環境配置

### 🔧 必要環境變數

```bash
# SMTP 配置（Gmail）
EMAIL_ADDRESS=redacted@example.com       # 發件人郵箱
EMAIL_PASSWORD=your-app-password         # Gmail 應用專用密碼

# 應用 URL
FRONTEND_URL=https://www.daoedu.tw       # 前端網址
BACKEND_URL=https://dao-server.daoedu.tw # 後端 API 網址
```

### 📝 配置說明

**EMAIL_ADDRESS 與 EMAIL_PASSWORD**
- 使用 Gmail SMTP 服務
- 必須啟用「兩步驟驗證」並生成「應用程式密碼」
- 不能使用一般登入密碼

**FRONTEND_URL 與 BACKEND_URL**
- 用於生成郵件中的連結
- 驗證郵件、密碼重設等功能依賴這些 URL
- 不同環境（dev/prod）需配置對應的 URL

### 🌍 多環境配置

參考 `docs/ENVIRONMENT_VARIABLES_COMPLETE.md` 了解完整的環境變數配置。

各環境郵件配置差異：

| 環境 | EMAIL_USER | EMAIL_FROM | 說明 |
|------|-----------|-----------|------|
| **PROD** | `noreply@daoedu.tw` | `DaoDao <noreply@daoedu.tw>` | 生產環境正式郵箱 |
| **DEV** | `dev@daoedu.tw` | `DaoDao Dev <dev@daoedu.tw>` | 開發環境測試郵箱 |
| **LOCAL** | `test@localhost` | `DaoDao Local <test@localhost>` | 本地開發（可用 MailHog） |

---

## 使用 Google 郵件服務的優缺點分析

### ✅ 優點

#### 1. **零成本與快速部署**
- **免費服務**：Gmail 帳號免費，無需額外費用
- **即時可用**：設置簡單，只需配置 SMTP 即可開始使用
- **無需額外帳號**：不需要註冊專業郵件服務商

#### 2. **高可靠性與穩定性**
- **Google 基礎設施**：依靠 Google 全球級的基礎設施
- **高可用性**：服務穩定性達到 99.9% 以上
- **自動備份**：郵件發送記錄自動保存在 Gmail 寄件備份中

#### 3. **良好的送達率**
- **信譽優勢**：Gmail 域名具有良好的郵件信譽
- **較少被攔截**：相較於自架 SMTP，較不容易被視為垃圾郵件
- **SPF/DKIM 支援**：Google 自動處理郵件驗證機制

#### 4. **開發友善**
- **簡單配置**：只需 SMTP 設定即可使用
- **本地開發方便**：適合開發環境快速測試
- **無需複雜整合**：標準 SMTP 協議，相容性好

#### 5. **適合中小型應用**
- **足夠的額度**：個人帳號每日 500 封，Google Workspace 2000 封
- **滿足初期需求**：對於用戶量不大的應用已足夠
- **彈性擴充**：可升級到 Google Workspace 獲得更高額度

---

### ❌ 缺點

#### 1. **嚴格的發送限制**
- **個人帳號**：每日最多 500 封郵件
- **Google Workspace（試用/未解鎖）**：每日 500 封郵件
- **Google Workspace（已解鎖）**：每日最多 2,000 封郵件
- **Google Workspace SMTP Relay**：每日最多 10,000 封郵件
- **超額風險**：超過限制可能導致帳號被暫時停用
- **不適合大量發送**：無法滿足大規模商業應用需求

**Google Workspace 解鎖條件**（需同時滿足）：
1. 累計付費達到 $100 USD（或等值貨幣）
2. 從達到 $100 門檻後至少經過 60 天

**實際案例**（Starter 方案 $6/用戶/月）：
```
單用戶情況：
→ 需 17 個月達到 $100
→ 再等待 60 天解鎖
→ 總共約 19 個月才能使用 2,000 封/日額度

5 個用戶情況：
→ 需 4 個月達到 $100（每月 $30）
→ 再等待 60 天解鎖
→ 總共約 6 個月才能使用 2,000 封/日額度
```

**影響**：
```
假設日活躍用戶 1000 人，每人平均觸發 2 封郵件
→ 每日需發送 2000 封
→ 個人帳號完全無法滿足（500 封/日）
→ Google Workspace 未解鎖帳號無法滿足（500 封/日）
→ Google Workspace 已解鎖帳號剛好達到上限，無任何緩衝（2000 封/日）
→ 建議使用 SMTP Relay（10,000 封/日）或專業郵件服務
```

#### 2. **複雜的認證設定**
- **兩步驟驗證**：必須啟用才能生成應用專用密碼
- **應用專用密碼**：需要額外生成和管理
- **密碼管理**：應用專用密碼無法直觀記憶，需要妥善保管
- **多環境配置**：不同環境需要不同的 Gmail 帳號

**配置複雜度**：
```bash
# 需要完成的步驟
1. 啟用兩步驟驗證
2. 進入 Google 帳號設定
3. 生成應用專用密碼（16 位元）
4. 配置環境變數
5. 測試連線
```

#### 3. **缺乏進階功能**

**無追蹤能力**：
- ❌ 無法追蹤開信率
- ❌ 無法追蹤點擊率
- ❌ 無法獲取退信原因
- ❌ 無法分析郵件效果

**無模板管理**：
- ❌ 無視覺化模板編輯器
- ❌ 無模板版本控制
- ❌ 無 A/B 測試功能
- ❌ 需自行維護 HTML 模板

**無進階功能**：
- ❌ 無郵件排程功能
- ❌ 無自動化工作流程
- ❌ 無收件人分組管理
- ❌ 無郵件活動管理

#### 4. **垃圾郵件風險**

**容易被標記**：
- **批量發送**：大量發送相同內容容易被標記為垃圾郵件
- **寄件人信譽**：個人 Gmail 帳號信譽較低
- **缺乏自定義域名**：使用 `@gmail.com` 域名，專業度不足

**進入垃圾郵件夾的可能性高於**：
- 使用自有域名的專業郵件服務
- 具有良好寄件人信譽的商業服務

#### 5. **帳號停用風險**

**觸發停用的場景**：
- 短時間內大量發送
- 發送內容被多次標記為垃圾郵件
- 收到大量退信
- 異常登入行為（例如從不同 IP 快速切換）

**後果**：
- 帳號被暫時停用（24 小時至數天）
- 需要人工驗證身份
- 影響所有依賴該 Gmail 帳號的服務

#### 6. **無專業技術支援**

**問題處理困難**：
- 免費服務無技術支援
- 只能依賴社群論壇
- 無 SLA 保證
- 問題解決時間不可控

**對比專業服務**：
| 項目 | Gmail SMTP | 專業郵件服務 |
|------|-----------|-------------|
| 技術支援 | ❌ 無 | ✅ 7x24 支援 |
| SLA 保證 | ❌ 無 | ✅ 99.9% 保證 |
| 問題處理 | 自行解決 | 專人協助 |
| 故障通知 | 無 | 即時通知 |

#### 7. **無法自定義寄件人域名**

**品牌形象問題**：
- 寄件人顯示為 `noreply@gmail.com`
- 缺乏品牌識別度
- 不夠專業

**對比自有域名**：
```
Gmail:       noreply@gmail.com
自有域名:    noreply@daoedu.tw  ✅ 更專業，更可信
```

**信任度影響**：
- 用戶可能懷疑郵件真實性
- 降低品牌識別度
- 影響郵件開信率

#### 8. **效能與擴展性限制**

**連線限制**：
- 同時連線數限制
- 發送速率限制
- 無法自定義重試策略

**無法水平擴展**：
- 單一 Gmail 帳號限制
- 無法透過增加帳號來提升發送量（違反 Google 政策）
- 無法使用負載均衡

---

### 📊 適用場景評估

#### ✅ 適合使用 Gmail SMTP 的場景

1. **開發與測試環境**
   - 快速驗證郵件功能
   - 本地開發測試
   - 原型開發階段

2. **小型應用（用戶 < 100）**
   - 每日郵件量 < 100 封
   - 主要是交易型郵件（驗證、密碼重設）
   - 預算有限的個人專案

3. **初創階段**
   - MVP 階段驗證產品
   - 快速上線，後續再遷移
   - 減少初期成本

---

#### ❌ 不適合使用 Gmail SMTP 的場景

1. **生產環境（用戶 > 1000）**
   - 每日郵件量 > 500 封
   - 需要高可靠性保證
   - 需要追蹤和分析功能

2. **行銷郵件**
   - 電子報發送
   - 促銷活動通知
   - 大量群發郵件

3. **企業級應用**
   - 需要 SLA 保證
   - 需要技術支援
   - 需要自定義域名
   - 需要進階功能（追蹤、分析、自動化）

---

### 🔄 遷移建議

#### 何時應該從 Gmail SMTP 遷移？

**遷移觸發點**：

1. **發送量接近限制**
   - 每日發送量持續超過 300 封（個人帳號）
   - 每日發送量持續超過 1500 封（Workspace）

2. **需要進階功能**
   - 需要追蹤開信率、點擊率
   - 需要郵件模板管理
   - 需要自動化工作流程

3. **品牌需求**
   - 需要使用自有域名
   - 需要提升品牌專業形象

4. **可靠性要求**
   - 需要 SLA 保證
   - 需要技術支援
   - 無法承受服務中斷

#### 推薦的專業郵件服務

**國際服務**：
1. **SendGrid**（推薦）
   - 免費額度：每日 100 封
   - 付費方案：$19.95/月（40,000 封）
   - 完整的 API 和追蹤功能
   - 優秀的送達率

2. **AWS SES**
   - 成本最低：$0.10 / 1000 封
   - 需要 AWS 帳號
   - 需要自行驗證域名
   - 適合技術團隊

3. **Mailgun**
   - 免費額度：前 3 個月 5000 封/月
   - 強大的 API
   - 良好的開發體驗

**台灣本地服務**：
1. **中華電信 HiMail**
   - 本地化支援
   - 穩定的送達率
   - 中文技術支援

2. **台灣大哥大企業郵件**
   - 適合台灣用戶
   - 良好的送達率

#### 遷移成本估算

**SendGrid 方案對比**：

| 方案 | 價格/月 | 郵件數量 | 適用場景 |
|------|--------|---------|---------|
| Free | $0 | 100/日 | 開發測試 |
| Essentials | $19.95 | 40,000 | 小型應用 |
| Pro | $89.95 | 100,000 | 中型應用 |
| Premier | 客製化 | 無限制 | 企業級 |

**DaoDao 預估需求**：
- 假設日活躍用戶：2,000 人
- 每用戶平均郵件：1.5 封/日
- 每日總量：3,000 封
- 每月總量：90,000 封
- **建議方案**：SendGrid Pro ($89.95/月)

#### 遷移實施步驟

**階段一：準備階段（1 週）**
1. 評估現有郵件發送量和類型
2. 選擇適合的郵件服務商
3. 註冊帳號並驗證域名
4. 建立測試環境

**階段二：開發階段（2-3 週）**
1. 整合新的郵件服務 API
2. 更新郵件模板
3. 實作郵件追蹤功能
4. 撰寫單元測試和整合測試

**階段三：測試階段（1 週）**
1. 在測試環境驗證所有郵件類型
2. 測試送達率和追蹤功能
3. 性能測試（大量發送）
4. 錯誤處理測試

**階段四：上線階段（1 週）**
1. 灰度發佈（先切換 10% 流量）
2. 監控送達率和錯誤率
3. 逐步增加流量比例
4. 完全切換到新服務

**階段五：優化階段（持續）**
1. 優化郵件內容和模板
2. 分析開信率和點擊率
3. 調整發送策略
4. 持續監控和改進

---

### 💡 當前 DaoDao 系統建議

#### 短期建議（1-3 個月）

**保持使用 Gmail SMTP，但需要**：

1. **監控發送量**
   - 實作郵件發送量統計（✅ 已實作）
   - 設定警報閾值（建議：300 封/日）
   - 定期檢視郵件統計報告

2. **優化發送策略**
   - 減少非必要郵件
   - 合併通知（例如每日摘要而非即時通知）
   - 讓用戶選擇郵件偏好

3. **準備遷移計畫**
   - 評估專業郵件服務
   - 預算規劃
   - 技術調研

#### 中期建議（3-6 個月）

**開始遷移到專業郵件服務**：

1. **選擇服務商**：推薦 SendGrid
   - 成熟的 API
   - 豐富的功能
   - 合理的價格
   - 良好的文檔

2. **實施遷移**
   - 按照上述遷移步驟執行
   - 建立雙寫機制（同時發送到 Gmail 和新服務以驗證）
   - 逐步切換流量

3. **增強功能**
   - 實作郵件追蹤
   - 優化郵件模板
   - 建立郵件偏好管理

---

## 郵件類型與模板

### 📧 支援的郵件類型

系統支援以下 **6 種** 預定義郵件類型：

#### 1. 歡迎郵件 (welcome)

**用途**：新用戶註冊或首次 OAuth 登入時發送

**模板檔案**：`src/services/email/welcome-template.ts`

**資料需求**：
```typescript
{
  name: string;  // 用戶姓名
}
```

**發送時機**：
- OAuth 登入成功後（`src/controllers/auth.controller.ts:303`）

**範例**：
```typescript
await emailService.sendWelcomeEmail(
  'user@example.com',
  '張三'
);
```

---

#### 2. 驗證郵件 (verification)

**用途**：用戶註冊完成後發送郵箱驗證連結

**模板檔案**：`src/services/email/verification-template.ts`

**資料需求**：
```typescript
{
  verifyLink: string;  // 驗證連結
  name?: string;       // 用戶姓名（可選）
}
```

**發送時機**：
- 臨時用戶轉為正式用戶時（`src/services/user.service.ts:847`）
- 當 `isSendEmail === true` 且用戶有有效 email 時

**範例**：
```typescript
await emailService.sendVerificationEmail(
  'user@example.com',
  'https://www.daoedu.tw/verify?token=xxx'
);
```

---

#### 3. 密碼重設 (password-reset)

**用途**：用戶忘記密碼時發送重設連結

**模板檔案**：`src/services/email/password-reset-template.ts`

**資料需求**：
```typescript
{
  resetLink: string;  // 重設連結
  name?: string;      // 用戶姓名（可選）
}
```

**API 端點**：`POST /api/v1/email/password-reset`

**範例**：
```typescript
await emailService.sendPasswordResetEmail(
  'user@example.com',
  'https://www.daoedu.tw/reset?token=xxx'
);
```

---

#### 4. 聯絡郵件 (contact)

**用途**：平台用戶之間互相聯繫

**模板檔案**：`src/services/email/contact-template.ts`

**資料需求**：
```typescript
{
  name: string;                    // 發件人姓名
  message: string;                 // 訊息內容
  userInfo?: string | string[];    // 聯絡資訊
  activityTitle?: string;          // 活動標題（如果是揪團活動）
}
```

**舊版 JS 實作**：`controllers/sendEmail.js` （包含完整的 HTML 模板）

**API 端點**：`POST /api/v1/email/contact`

**範例**：
```typescript
await emailService.sendContactEmail(
  'recipient@example.com',
  '李四',
  '我對你的課程很感興趣，可以進一步了解嗎？',
  ['Line: @user123', 'Email: user@example.com'],
  '區塊鏈入門課程'
);
```

---

#### 5. 馬拉松郵件 (marathon)

**用途**：學習馬拉松活動通知

**模板檔案**：`src/services/email/marathon-template.ts`

**資料需求**：
```typescript
{
  name: string;                  // 用戶姓名
  marathonTitle: string;         // 馬拉松標題
  marathonDate?: string;         // 活動日期
  marathonDescription?: string;  // 活動描述
}
```

**API 端點**：`POST /api/v1/email/marathon`

**權限要求**：管理員

**範例**：
```typescript
await emailService.sendMarathonEmail(
  'user@example.com',
  '王五',
  '2024 學習馬拉松',
  '2024-01-15',
  '一起挑戰 30 天學習計畫'
);
```

---

#### 6. 自定義郵件 (custom)

**用途**：靈活的自定義 HTML 郵件

**資料需求**：
```typescript
{
  to: string | string[];  // 收件人
  subject: string;        // 主旨
  htmlContent: string;    // HTML 內容
}
```

**API 端點**：`POST /api/v1/email/custom`

**權限要求**：管理員

**範例**：
```typescript
await emailService.sendCustomEmail(
  'user@example.com',
  '系統維護通知',
  '<h1>系統維護</h1><p>本系統將於...</p>'
);
```

---

## 使用場景分析

### 🎯 實際使用場景

#### 場景 1：用戶註冊流程

**流程**：臨時用戶 → 完善資料 → 正式用戶 → 發送驗證郵件

**代碼位置**：`src/services/user.service.ts:844-850`

```typescript
// 用戶創建完成後
if (isSendEmail && createdUser.contacts?.email) {
  // 發送驗證郵件
  await emailService.sendVerificationEmail(
    createdUser.contacts.email,
    `${process.env.BACKEND_URL}/email/verify?token=${newToken}`
  );

  // 刪除臨時用戶記錄
  await tx.temp_users.delete({ where: { id: tempUser.id } });
}
```

**關鍵參數**：`isSendEmail`（由前端控制是否發送郵件）

**參考文件**：`docs/isSendEmail-parameter-analysis.md`

---

#### 場景 2：OAuth 登入成功

**流程**：Google OAuth → 創建/更新用戶 → 發送歡迎郵件

**代碼位置**：`src/controllers/auth.controller.ts:300-304`

```typescript
// 發送歡迎郵件
const contact = user.contacts;
if (contact?.email) {
  await emailService.sendWelcomeEmail(
    contact.email,
    user.nickname || 'User'
  );
}
```

---

#### 場景 3：用戶之間聯絡

**流程**：用戶 A 查看用戶 B 的資源/活動 → 點擊聯絡 → 發送聯絡郵件給用戶 B

**舊版實作**：`controllers/sendEmail.js`

**新版 API**：`POST /api/v1/email/contact`

**郵件內容包含**：
- 發件人資訊（姓名、角色、頭像）
- 訊息內容
- 聯絡方式（Line、Email、Discord 等）
- 活動標題（如果是揪團活動）
- 查看發件人檔案的連結

---

#### 場景 4：密碼重設

**流程**：用戶忘記密碼 → 請求重設 → 發送重設連結郵件

**API**：`POST /api/v1/email/password-reset`

**支援**：可選身份驗證（未登入用戶也可使用）

---

#### 場景 5：馬拉松活動通知

**流程**：管理員創建馬拉松活動 → 批量發送通知郵件

**API**：`POST /api/v1/email/marathon`

**權限**：僅管理員可用

---

### 📊 使用頻率估計

| 郵件類型 | 使用頻率 | 觸發方式 |
|---------|---------|---------|
| **驗證郵件** | 高 | 用戶註冊時自動發送 |
| **歡迎郵件** | 高 | OAuth 登入時自動發送 |
| **聯絡郵件** | 中 | 用戶主動觸發 |
| **密碼重設** | 低-中 | 用戶忘記密碼時觸發 |
| **馬拉松郵件** | 低 | 管理員手動觸發 |
| **自定義郵件** | 低 | 管理員手動觸發 |

---

## API 端點說明

### 🔌 RESTful API 端點（v1）

所有端點前綴：`/api/v1/email`

#### 1️⃣ 發送聯絡郵件

```
POST /api/v1/email/contact
```

**權限**：需要身份驗證

**請求體**：
```json
{
  "from": "sender@example.com",
  "to": "recipient@example.com",
  "subject": "聯絡請求",
  "text": "訊息內容",
  "name": "發件人姓名",
  "information": ["Line: @user", "Email: user@example.com"],
  "activityTitle": "活動標題（可選）"
}
```

**驗證器**：`contactEmailSchema`

---

#### 2️⃣ 發送驗證郵件

```
POST /api/v1/email/verification
```

**權限**：需要身份驗證

**請求體**：
```json
{
  "email": "user@example.com",
  "verifyLink": "https://www.daoedu.tw/verify?token=xxx",
  "name": "用戶姓名（可選）"
}
```

**驗證器**：`verificationEmailSchema`

---

#### 3️⃣ 發送歡迎郵件

```
POST /api/v1/email/welcome
```

**權限**：需要管理員權限

**請求體**：
```json
{
  "email": "user@example.com",
  "name": "用戶姓名"
}
```

**驗證器**：`welcomeEmailSchema`

---

#### 4️⃣ 發送密碼重設郵件

```
POST /api/v1/email/password-reset
```

**權限**：支援可選身份驗證（未登入也可用）

**請求體**：
```json
{
  "email": "user@example.com",
  "resetLink": "https://www.daoedu.tw/reset?token=xxx",
  "name": "用戶姓名（可選）"
}
```

**驗證器**：`passwordResetEmailSchema`

---

#### 5️⃣ 發送馬拉松郵件

```
POST /api/v1/email/marathon
```

**權限**：需要管理員權限

**請求體**：
```json
{
  "email": "user@example.com",
  "name": "用戶姓名",
  "marathonTitle": "馬拉松標題",
  "marathonDate": "2024-01-15（可選）",
  "marathonDescription": "活動描述（可選）"
}
```

**驗證器**：`marathonEmailSchema`

---

#### 6️⃣ 發送自定義郵件

```
POST /api/v1/email/custom
```

**權限**：需要管理員權限

**請求體**：
```json
{
  "to": "user@example.com",
  "subject": "郵件主旨",
  "htmlContent": "<h1>自定義 HTML</h1>",
  "template": "模板類型（可選）",
  "data": { "模板資料（可選）": "..." }
}
```

**驗證器**：`customEmailSchema`

---

#### 7️⃣ 批量發送郵件

```
POST /api/v1/email/bulk
```

**權限**：需要管理員權限

**請求體**：
```json
{
  "template": "welcome",
  "subject": "郵件主旨",
  "recipients": [
    { "email": "user1@example.com", "data": { "name": "User 1" } },
    { "email": "user2@example.com", "data": { "name": "User 2" } }
  ]
}
```

**限制**：單次最多 100 個收件人

**驗證器**：`bulkEmailSchema`

**回應**：
```json
{
  "success": true,
  "data": {
    "total": 2,
    "success": 2,
    "failed": 0,
    "results": [...]
  }
}
```

---

#### 8️⃣ 驗證郵件地址

```
POST /api/v1/email/validate
```

**權限**：支援可選身份驗證

**請求體**：
```json
{
  "email": "user@example.com"
}
```

**回應**：
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

#### 9️⃣ 預覽郵件模板

```
POST /api/v1/email/preview
```

**權限**：需要身份驗證

**請求體**：
```json
{
  "template": "welcome",
  "data": {
    "name": "測試用戶"
  }
}
```

**回應**：
```json
{
  "success": true,
  "data": {
    "subject": "歡迎加入島島阿學",
    "html": "<html>...</html>"
  }
}
```

---

#### 🔟 獲取郵件統計

```
GET /api/v1/email/stats
```

**權限**：需要管理員權限

**查詢參數**：
- `startDate`：起始日期（可選）
- `endDate`：結束日期（可選）

**回應**：
```json
{
  "success": true,
  "data": {
    "totalSent": 1250,
    "totalFailed": 15,
    "lastSentAt": "2024-01-15T10:30:00.000Z",
    "lastFailedAt": "2024-01-14T08:20:00.000Z",
    "isHealthy": true
  }
}
```

---

#### 1️⃣1️⃣ 檢查郵件服務健康狀態

```
GET /api/v1/email/health
```

**權限**：需要管理員權限

**回應（健康）**：
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "lastCheck": "2024-01-15T10:30:00.000Z",
    "transporterConnected": true
  }
}
```

**回應（不健康）**：
```json
{
  "success": false,
  "data": {
    "status": "unhealthy",
    "lastCheck": "2024-01-15T10:30:00.000Z",
    "transporterConnected": false,
    "error": "SMTP connection failed"
  }
}
```

**HTTP 狀態碼**：
- `200`：健康
- `503`：不健康

---

## 代碼架構

### 📂 TypeScript 新版架構

#### 服務層（Services）

**1. EmailService (`src/services/email/email.service.ts`)**

核心郵件服務類，提供：
- 基本郵件發送功能
- 模板化郵件發送
- 郵件地址驗證
- 批量發送（帶延遲避免限制）
- 重試機制
- 健康檢查
- 統計功能

```typescript
class EmailService {
  private transporter: nodemailer.Transporter;
  private templateService: EmailTemplateService;
  private stats: EmailServiceStats;

  // 核心發送方法
  async sendEmail(options: EmailSendOptions): Promise<EmailSendResult>

  // 專用發送方法
  async sendWelcomeEmail(to: string, name: string): Promise<EmailSendResult>
  async sendVerificationEmail(to: string, verifyLink: string, name?: string): Promise<EmailSendResult>
  async sendContactEmail(to: string, name: string, message: string, ...): Promise<EmailSendResult>
  async sendMarathonEmail(to: string, name: string, marathonTitle: string, ...): Promise<EmailSendResult>
  async sendPasswordResetEmail(to: string, resetLink: string, name?: string): Promise<EmailSendResult>
  async sendCustomEmail(to: string, subject: string, htmlContent: string): Promise<EmailSendResult>

  // 批量發送
  async sendBulkEmail(recipients: Array, templateType: string): Promise<BulkResult>

  // 工具方法
  validateEmailAddress(email: string): boolean
  async checkHealth(): Promise<HealthCheckResult>
  getStats(): EmailServiceStats
}
```

**2. EmailTemplateService (`src/services/email/template.service.ts`)**

模板管理服務，提供：
- 統一的模板生成介面
- 支援所有預定義模板
- 自定義模板支援

```typescript
class EmailTemplateService {
  generateWelcomeEmail(data: WelcomeEmailData): EmailTemplate
  generateVerificationEmail(data: VerificationEmailData): EmailTemplate
  generateContactEmail(data: ContactEmailData): EmailTemplate
  generateMarathonEmail(data: MarathonEmailData): EmailTemplate
  generatePasswordResetEmail(data: PasswordResetEmailData): EmailTemplate
  generateCustomEmail(subject: string, content: string, data?: unknown): EmailTemplate
}
```

**3. Auth Email Service (`src/services/auth/email.service.ts`)**

認證模組專用的郵件服務包裝層，提供：
- 向後兼容的 API
- 錯誤處理
- 與 `enhanced-email.service` 整合

---

#### 控制器層（Controllers）

**EmailController (`src/controllers/email.controller.ts`)**

處理所有郵件相關的 HTTP 請求：

```typescript
export const emailController = {
  sendContactEmail,        // 聯絡郵件
  sendVerificationEmail,   // 驗證郵件
  sendWelcomeEmail,        // 歡迎郵件
  sendPasswordResetEmail,  // 密碼重設
  sendMarathonEmail,       // 馬拉松郵件
  sendCustomEmail,         // 自定義郵件
  sendBulkEmail,           // 批量發送
  validateEmail,           // 驗證地址
  previewEmailTemplate,    // 預覽模板
  getEmailStats,           // 獲取統計
  checkEmailHealth         // 健康檢查
};
```

---

#### 路由層（Routes）

**Email Routes (`src/routes/email.routes.ts`)**

定義 RESTful API 路由：

```typescript
const router = Router();

// 用戶級別端點
router.post('/contact', authenticate, validate(contactEmailSchema), ...)
router.post('/verification', authenticate, validate(verificationEmailSchema), ...)
router.post('/password-reset', optionalAuth, validate(passwordResetEmailSchema), ...)
router.post('/validate', optionalAuth, validate(validateEmailSchema), ...)
router.post('/preview', authenticate, validate(previewEmailSchema), ...)

// 管理員級別端點
router.post('/welcome', authenticate, requireAdmin, validate(welcomeEmailSchema), ...)
router.post('/marathon', authenticate, requireAdmin, validate(marathonEmailSchema), ...)
router.post('/custom', authenticate, requireAdmin, validate(customEmailSchema), ...)
router.post('/bulk', authenticate, requireAdmin, validate(bulkEmailSchema), ...)
router.get('/stats', authenticate, requireAdmin, ...)
router.get('/health', authenticate, requireAdmin, ...)
```

---

#### 類型定義（Types）

**Email Types (`src/types/email.types.ts`)**

完整的 TypeScript 型別定義，包含：
- 郵件選項介面
- 郵件結果介面
- 郵件統計介面
- 郵件隊列介面
- 郵件訂閱介面
- 郵件活動介面

---

#### 驗證器（Validators）

**Email Validators (`src/validators/email.validators.ts`)**

使用 Zod 進行請求驗證：

```typescript
export const contactEmailSchema = z.object({
  from: z.string().email(),
  to: z.string().email(),
  subject: z.string(),
  text: z.string(),
  name: z.string(),
  information: z.array(z.string()).optional(),
  activityTitle: z.string().optional()
});

export const verificationEmailSchema = z.object({
  email: z.string().email(),
  verifyLink: z.string().url(),
  name: z.string().optional()
});

// ... 其他驗證 schema
```

---

### 🗂️ JavaScript 舊版架構

#### 控制器（Controllers）

舊版 JavaScript 控制器仍在使用中，主要用於：
- 聯絡郵件（`controllers/sendEmail.js`）
- 歡迎郵件（`controllers/sendWelcomeEmail.js`）
- 驗證郵件（`controllers/sendVerifiedEmail.js`）
- 馬拉松郵件（`controllers/sendMarathonEmail.js`）
- 郵件驗證（`controllers/verifyEmail.js`）

**特點**：
- 直接使用 `nodemailer`
- HTML 模板內嵌在代碼中
- 功能較為基礎
- 待遷移到 TypeScript 新版

---

### 🔄 遷移狀態

| 功能 | 舊版 JS | 新版 TS | 狀態 |
|------|---------|---------|------|
| 聯絡郵件 | ✅ 使用中 | ✅ 已實作 | 🔄 雙版本並存 |
| 歡迎郵件 | ✅ 使用中 | ✅ 已實作 | 🔄 雙版本並存 |
| 驗證郵件 | ✅ 使用中 | ✅ 已實作 | 🔄 雙版本並存 |
| 馬拉松郵件 | ✅ 使用中 | ✅ 已實作 | 🔄 雙版本並存 |
| 密碼重設 | ❌ 未實作 | ✅ 已實作 | ✅ 僅新版 |
| 自定義郵件 | ❌ 未實作 | ✅ 已實作 | ✅ 僅新版 |
| 批量發送 | ❌ 未實作 | ✅ 已實作 | ✅ 僅新版 |
| 模板預覽 | ❌ 未實作 | ✅ 已實作 | ✅ 僅新版 |
| 統計功能 | ❌ 未實作 | ✅ 已實作 | ✅ 僅新版 |
| 健康檢查 | ❌ 未實作 | ✅ 已實作 | ✅ 僅新版 |

---

## 統計與監控

### 📊 郵件統計

**EmailService** 提供內建的統計功能：

```typescript
interface EmailServiceStats {
  totalSent: number;        // 成功發送總數
  totalFailed: number;      // 失敗總數
  lastSentAt?: Date;        // 最後發送時間
  lastFailedAt?: Date;      // 最後失敗時間
  isHealthy: boolean;       // 服務健康狀態
}
```

**獲取統計**：
```typescript
const stats = emailService.getStats();
```

**API 獲取統計**：
```bash
GET /api/v1/email/stats
Authorization: Bearer <admin-token>
```

---

### 🏥 健康檢查

**健康檢查功能**：
- 驗證 SMTP 連接
- 檢查傳輸器狀態
- 返回詳細錯誤訊息

**程式化健康檢查**：
```typescript
const health = await emailService.checkHealth();
console.log(health.status);  // 'healthy' | 'unhealthy'
```

**API 健康檢查**：
```bash
GET /api/v1/email/health
Authorization: Bearer <admin-token>
```

---

### 🔍 監控建議

#### 1. 錯誤監控

監控以下錯誤：
- SMTP 連接失敗
- 郵件發送失敗
- 配置錯誤（缺少環境變數）

#### 2. 性能監控

監控指標：
- 郵件發送成功率
- 平均發送時間
- 批量發送性能

#### 3. 日誌記錄

所有郵件服務操作都有日誌記錄：
```typescript
logger.info('郵件發送成功 - 收件人: xxx, 主旨: xxx');
logger.error('郵件發送失敗 - 收件人: xxx, 錯誤: xxx');
```

---

## 最佳實踐建議

### ✅ 使用建議

#### 1. 優先使用 TypeScript 新版 API

**推薦**：
```typescript
import { emailService } from '@/services/auth/email.service';

await emailService.sendWelcomeEmail(email, name);
```

**不推薦**（舊版）：
```javascript
const sendWelcomeEmail = require('../controllers/sendWelcomeEmail');
```

---

#### 2. 使用 API 端點而非直接調用服務

**推薦**（前端）：
```typescript
const response = await fetch('/api/v1/email/contact', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    from: 'sender@example.com',
    to: 'recipient@example.com',
    subject: '聯絡請求',
    text: '訊息內容',
    name: '發件人'
  })
});
```

---

#### 3. 妥善處理錯誤

```typescript
try {
  const result = await emailService.sendVerificationEmail(email, link);

  if (!result.success) {
    // 處理發送失敗
    console.error('郵件發送失敗:', result.error);
    // 可能需要重試或通知用戶
  }
} catch (error) {
  // 處理異常
  console.error('郵件服務異常:', error);
}
```

---

#### 4. 使用重試機制

對於重要郵件，使用內建的重試機制：

```typescript
// EmailService 已內建重試機制
await emailService.sendEmailWithRetry(options);
```

配置重試參數（在 `email.config.ts`）：
```typescript
retry: {
  maxAttempts: 3,     // 最多重試 3 次
  backoffMs: 1000     // 每次重試間隔 1 秒
}
```

---

#### 5. 批量發送時注意限制

```typescript
// 批量發送會自動添加延遲
const result = await emailService.sendBulkEmail(
  recipients,
  'welcome'
);

console.log(`成功: ${result.success}, 失敗: ${result.failed}`);
```

**限制**：
- API 端點限制：單次最多 100 個收件人
- 自動延遲：每封郵件間隔 100ms（避免被 SMTP 服務限制）

---

#### 6. 驗證郵件地址

發送前驗證郵件地址：

```typescript
if (!emailService.validateEmailAddress(email)) {
  throw new Error('無效的郵件地址');
}

await emailService.sendEmail(...);
```

---

#### 7. 使用模板預覽功能

在正式發送前預覽模板：

```typescript
const preview = await fetch('/api/v1/email/preview', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    template: 'welcome',
    data: { name: '測試用戶' }
  })
});

const { subject, html } = await preview.json();
// 在瀏覽器中預覽 HTML
```

---

#### 8. 監控郵件服務健康狀態

定期檢查健康狀態：

```typescript
// 在應用啟動時檢查
const health = await emailService.checkHealth();
if (health.status !== 'healthy') {
  console.error('郵件服務不可用:', health.error);
}
```

---

### ⚠️ 注意事項

#### 1. 環境變數配置

**必須正確配置**：
- `EMAIL_ADDRESS`
- `EMAIL_PASSWORD`
- `FRONTEND_URL`
- `BACKEND_URL`

缺少任何一項會導致郵件服務初始化失敗。

---

#### 2. Gmail 應用專用密碼

**不能使用一般登入密碼**！

必須：
1. 啟用「兩步驟驗證」
2. 生成「應用程式密碼」
3. 使用應用程式密碼作為 `EMAIL_PASSWORD`

參考：https://support.google.com/accounts/answer/185833

---

#### 3. Rate Limiting

Gmail SMTP 有發送限制：
- **個人帳號**：每日 500 封（固定）
- **Google Workspace（試用/未解鎖）**：每日 500 封
- **Google Workspace（已解鎖）**：每日 2,000 封
- **Google Workspace SMTP Relay**：每日 10,000 封

**Google Workspace 2,000 封解鎖條件**（需同時滿足）：
1. 累計付費達到 $100 USD
2. 從達到 $100 後至少經過 60 天

⚠️ **重要提醒**：即使購買 Google Workspace 付費方案，剛開始仍然只有 500 封/日的限制，需要等待解鎖條件滿足（可能需要數個月）。

**建議**：
- 如需立即使用較高額度，考慮配置 **SMTP Relay**（10,000 封/日）
- 生產環境使用專業郵件服務（SendGrid、AWS SES）無需等待解鎖
- 實作郵件隊列系統
- 監控發送量

---

#### 4. 測試環境

**本地開發建議使用 MailHog**：

```bash
# docker-compose.local.yml
mailhog:
  image: mailhog/mailhog
  ports:
    - "1025:1025"  # SMTP
    - "8025:8025"  # Web UI
```

**本地環境配置**：
```bash
EMAIL_HOST=localhost
EMAIL_PORT=1025
EMAIL_USER=test@localhost
EMAIL_PASSWORD=
```

訪問 `http://localhost:8025` 查看測試郵件。

---

#### 5. 性能優化

**批量發送優化**：
- 使用郵件隊列（Redis + Bull）
- 異步處理
- 分批發送

**範例架構**：
```
用戶請求 → API 端點 → 加入隊列 → 背景 Worker → 發送郵件
```

---

#### 6. 安全考慮

**防止郵件洪水攻擊**：
- 實作 Rate Limiting
- 驗證請求來源
- 限制單用戶發送頻率

**敏感資訊保護**：
- 不在郵件中包含密碼
- 使用 token 而非直接連結
- Token 應有過期時間

---

### 📚 相關文件

- **環境變數完整配置**：`docs/ENVIRONMENT_VARIABLES_COMPLETE.md`
- **isSendEmail 參數分析**：`docs/isSendEmail-parameter-analysis.md`
- **郵件功能測試模板**：`docs/qa/email-functionality-test-template.md`
- **TypeScript 遷移計畫**：`docs/typescript-migration-plan.md`

---

### 🔮 未來規劃

#### 短期（1-3 個月）

1. **完成 TypeScript 遷移**
   - 將所有舊版 JS 控制器遷移到新版 TS
   - 統一使用新版 API

2. **增強模板系統**
   - 支援模板變數替換
   - 支援條件渲染
   - 支援國際化（i18n）

3. **實作郵件隊列**
   - 使用 Redis + Bull
   - 異步處理
   - 重試機制

---

#### 中期（3-6 個月）

1. **更換郵件服務商**
   - 從 Gmail SMTP 遷移到專業服務（SendGrid/AWS SES）
   - 支援更高發送量
   - 更好的追蹤和分析

2. **郵件追蹤功能**
   - 開信率統計
   - 點擊率統計
   - 退信處理

3. **郵件訂閱管理**
   - 訂閱/取消訂閱
   - 郵件偏好設定
   - 分組管理

---

#### 長期（6-12 個月）

1. **郵件活動管理**
   - 建立郵件活動
   - 排程發送
   - A/B 測試

2. **進階分析**
   - 郵件效果分析
   - 用戶行為追蹤
   - 自動化工作流程

3. **多通道整合**
   - 整合 SMS
   - 整合推播通知
   - 統一訊息中心

---

## 📞 聯絡與支援

如有任何問題或建議，請聯繫：
- **技術負責人**：開發團隊
- **文件問題**：提交 Issue 或 PR

---

**最後更新**：2025-10-28
**文件版本**：v1.0.0
**維護者**：DaoDao 開發團隊
