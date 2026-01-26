# 系統信郵件模板規格文件

> 基於 Figma 設計稿：<https://www.figma.com/design/7cA0RqLu27puqzqkueEyPc/Email?node-id=3-715>
>
> **最後更新**: 2026-01-25（新增 email_logs 發送紀錄整合說明）

## 1. 設計概覽

此模板為「島島阿學」平台的系統歡迎信模板，用於新用戶註冊後的歡迎郵件。

### 1.0 ⚠️ 重要：歡迎信有兩種版本

根據用戶是否已完成「學習類型測驗」，歡迎信分為兩種版本：

| 版本 | 條件 | 內容特色 | CTA 按鈕 |
|------|------|----------|----------|
| **已做測驗** | 用戶已完成測驗 | 簡短引導，推薦「主題實踐」 | 1 個（橘色） |
| **未做測驗** | 用戶尚未完成測驗 | 詳細功能介紹，包含測驗連結 | 2 個（青色+橘色） |

> 參考文件：`docs/email/Welcome Letter - 202601.md`

### 1.1 設計尺寸

| 版本 | 寬度 | 主內容區寬度 |
|------|------|-------------|
| Mobile | 320px | 296px |
| Desktop | 701px | 420px |

### 1.2 響應式斷點

- **< 600px**：使用 Mobile 版面，Banner 向中間版切
- **>= 600px**：使用 Desktop 版面，背景為淺藍色 (`#F5FFFD`)

---

## 2. 結構組成

### 2.1 已做測驗版本結構

```
┌─────────────────────────────────────┐
│            Banner (Logo)            │
├─────────────────────────────────────┤
│    ┌─────────────────────────┐      │
│    │     main-section        │      │
│    │  ┌───────────────────┐  │      │
│    │  │   h2: Hello 歡迎   │  │      │
│    │  │   p: 學習理念介紹  │  │      │
│    │  │   h3: 把想做變生活 │  │      │
│    │  │   quote: 引言區塊  │  │      │
│    │  │   CTA: 開始提案 🟠 │  │      │
│    │  │   Illustration 🌟  │  │      │
│    │  │   p: 結尾文案      │  │      │
│    │  │   ─────────────    │  │      │
│    │  │   Author Section   │  │      │
│    │  └───────────────────┘  │      │
│    └─────────────────────────┘      │
├─────────────────────────────────────┤
│              Footer                 │
│   (系統提示 + Logo + 社群連結)      │
└─────────────────────────────────────┘
```

### 2.2 未做測驗版本結構

```
┌─────────────────────────────────────┐
│            Banner (Logo)            │
├─────────────────────────────────────┤
│    ┌─────────────────────────┐      │
│    │     main-section        │      │
│    │  ┌───────────────────┐  │      │
│    │  │   h2: Hello 歡迎   │  │      │
│    │  │   p: 問題引導      │  │      │
│    │  │   h3: 功能幫助開始 │  │      │
│    │  │   ┌─────────────┐  │  │      │
│    │  │   │ 功能卡片 1  │  │  │      │
│    │  │   │ 學習類型測驗│  │  │      │
│    │  │   │ CTA 🔵     │  │  │      │
│    │  │   └─────────────┘  │  │      │
│    │  │   ┌─────────────┐  │  │      │
│    │  │   │ 功能卡片 2  │  │  │      │
│    │  │   │ 主題實踐    │  │  │      │
│    │  │   │ CTA 🟠     │  │  │      │
│    │  │   └─────────────┘  │  │      │
│    │  │   p: 帳號設定提醒  │  │      │
│    │  │   Illustration 🌟  │  │      │
│    │  │   ─────────────    │  │      │
│    │  │   Author Section   │  │      │
│    │  └───────────────────┘  │      │
│    └─────────────────────────┘      │
├─────────────────────────────────────┤
│              Footer                 │
│   (系統提示 + Logo + 社群連結)      │
└─────────────────────────────────────┘
```

> 🔵 = 青色按鈕 (`#16B9B3`)、🟠 = 橘色按鈕 (`#FFA10B`)、🌟 = 海星插圖

---

## 3. 樣式規格

### 3.1 色彩系統

> 以下色彩基於 Figma 設計系統變數定義

| 用途 | 色碼 | Figma 變數名稱 | 說明 |
|------|------|---------------|------|
| 主背景色 | `#F5FFFD` | Very Light Blue | Desktop 外層背景 |
| 內容區背景 | `#FFFFFF` | White | 白色 |
| Banner 背景 | 漸層/圖案 | - | 淺藍漸層搭配雲朵圖案 |
| 主標題文字 (h2) | `#0D3036` | BG Dark | 深色標題 |
| 主要文字 | `#295E5C` | Text Dark | 深青色 |
| 次要文字 | `#9FB5B8` | Light Gray | 淺灰色 |
| CTA 按鈕背景 | `#FFA10B` | Logo Orange | 橘色 |
| CTA 按鈕文字 | `#0D3036` | BG Dark | 深色（非白色） |
| 品牌主色 | `#16B9B3` | Logo Cyan | 青綠色（副標題、引言邊框） |
| 分隔線 | `#E0E0E0` | - | 淺灰色 |
| Footer 背景 | `#F4F6F6` | Very Light Gray | 淺灰色 |

### 3.2 文字層級

| 層級 | 用途 | 字重 | 說明 |
|------|------|------|------|
| h2 | 主標題 | Bold | 「Hello [使用者]，歡迎來到島島阿學！」 |
| p | 段落文字 | Regular | 正文說明 |
| h3 | 副標題 | Bold | 「把『想做』變成『生活』」 |
| quote | 引言區塊 | Regular | 帶左邊框的引言樣式 |

### 3.3 間距規格

| 元素 | 間距 |
|------|------|
| text-block padding-bottom | 20px |
| 主內容區 padding | 28px 24px (mobile) / 32px 40px (desktop) |
| CTA 按鈕 padding | 14px 28px |
| 引言區塊 padding | 14px 18px |
| 分隔線與內容間距 | 24px |

---

## 4. 組件詳細規格

### 4.1 Banner

> ⚠️ **重要**：Banner 使用完整圖片，而非 CSS 漸層，以確保跨郵件客戶端相容性。

- **Desktop**: 寬度 600px（或 701px），高度 140px
- **Mobile**: 寬度 320px，高度依比例縮放
- **內容**：完整 Banner 圖片，包含：
  - 「DAO DAO 島島阿學」Logo
  - 淺藍色雲朵裝飾
  - 青色虛線弧形
  - 黃色/青色半圓裝飾元素

**圖片資源**：

- Desktop: `{{banner_desktop_url}}` - 600×140px
- Mobile: `{{banner_mobile_url}}` - 320×140px（可選，或使用響應式縮放）

**實作建議**：

```html
<img src="{{banner_url}}"
     alt="DAO DAO 島島阿學"
     width="600"
     height="140"
     style="display: block; width: 100%; max-width: 600px; height: auto;">
```

### 4.2 主標題區 (h2)

```html
<h2>Hello [使用者]，<br>歡迎來到島島阿學！</h2>
```

- 字體：Noto Sans TC
- 字重：700 (Bold)
- 字級：24px
- 行高：150%
- 顏色：#0D3036 (BG Dark)

### 4.3 段落文字 (p)

內容範例：
> 在這個資訊爆炸的時代，我們相信「學習」不該只是為了考取證書或完成課程，而是讓生活更豐富。

- 字體：Noto Sans TC
- 字重：400 (Regular)
- 字級：16px
- 行高：180%
- 顏色：#295E5C (Text Dark)

### 4.4 副標題 (h3)

```html
<h3>把「想做」變成「生活」</h3>
```

- 字體：Noto Sans TC
- 字重：600 (Semi-bold)
- 字級：18px
- 行高：150%
- 顏色：#16B9B3 (Logo Cyan)

### 4.5 引言區塊 (quote)

```html
<blockquote>
  不需要大目標。
  試著用我們的「主題實踐」模板，開啟一段 7 到 30 天的小旅程。
  無論是讀一本書還是練習一個新習慣，重點不在於完成，而在於開始。
</blockquote>
```

樣式：

- 背景：#F5FFFD (Very Light Blue)
- 左邊框：4px solid #16B9B3 (Logo Cyan)
- 內距：14px 18px
- 字級：15px
- 行高：1.6
- 顏色：#295E5C (Text Dark)

### 4.6 CTA 按鈕

```html
<a href="{{cta_url}}" class="cta-button">
  挑選一個學習生活提案
  <img src="https://daodao.so/images/emails/vector.svg" alt=">" width="8" height="8">
</a>
```

樣式：

- 背景色：#FFA10B (Logo Orange)
- 文字顏色：#0D3036 (BG Dark)
- 圓角：24px（全圓角）
- 內距：14px 28px
- 字級：16px
- 字重：600 (semibold)
- 箭頭圖示：`vector.svg`（8x8px）

### 4.7 插圖區（吉祥物）

- **尺寸**：160px × 160px
- **內容**：黃色海星吉祥物騎著淺藍色紙飛機
  - 黃色海星角色（帶有可愛表情）
  - 淺藍色紙飛機
  - 黃色星星裝飾（左上角）
  - 青色弧線軌跡（右下角）
- **位置**：置中
- **素材來源**：Google Drive（見設計稿註記）

**圖片變數**：`{{illustration_url}}`

### 4.8 結尾文案

```
在這裡，按照你喜歡的樣子，
慢慢走，比較快。

準備好開始美好的學習生活了嗎？
```

### 4.9 作者區塊 (Author Section)

```
島島阿學團隊
你的學習生活提案所
Where personal growth meets collective wisdom!
```

- 位置：分隔線下方
- 包含團隊署名與 Slogan

### 4.10 Footer

內容：

1. 系統提示文字：「此訊息由系統發送，請勿回覆此電子郵件。不希望接收此類郵件，請取消訂閱。」
2. 品牌 Logo
3. 社群連結圖示：Threads、Facebook、Instagram、LinkedIn
4. 版權聲明：「島島阿學 © 2026」

---

## 5. 動態變數

### 5.1 共用變數

| 變數名稱 | 說明 | 範例 |
|---------|------|------|
| `{{name}}` | 使用者名稱 | 「小明」 |
| `{{cta_url}}` | CTA 按鈕連結 | `https://daoedu.tw/practice` |
| `{{unsubscribe_url}}` | 取消訂閱連結 | `https://daoedu.tw/unsubscribe` |
| `{{year}}` | 當前年份 | `2026` |

> **注意**：變數使用底線命名法（snake_case），如 `{{cta_url}}`、`{{unsubscribe_url}}`

### 5.2 程式邏輯變數（非模板變數）

以下變數用於程式邏輯判斷，決定使用哪個版本模板：

| 變數名稱 | 說明 | 範例 |
|---------|------|------|
| `hasCompletedQuiz` | 是否已完成測驗（決定使用哪個版本） | `true` / `false` |
| `practiceUrl` | 主題實踐連結 | `https://daoedu.tw/practice` |
| `quizUrl` | 學習類型測驗連結（僅未做測驗版本） | `https://daoedu.tw/quiz` |
| `illustrationUrl` | 吉祥物圖片 URL | `https://daodao.so/images/emails/joyride.png` |

---

## 6. 資源連結

### 6.1 圖片資源

| 資源 | URL | 狀態 |
|------|-----|------|
| Logo | `https://daodao.so/images/emails/logo.png` | ✅ |
| Banner | `https://daodao.so/images/emails/banner.png` | ✅ |
| 吉祥物 | `https://daodao.so/images/emails/joyride.png` | ✅ |
| 箭頭圖示 | `https://daodao.so/images/emails/vector.svg` | ✅ |
| Threads | `https://daodao.so/images/emails/threads.svg` | ✅ |
| Facebook | `https://daodao.so/images/emails/facebook.svg` | ✅ |
| Instagram | `https://daodao.so/images/emails/instagram.svg` | ✅ |
| LinkedIn | `https://daodao.so/images/emails/linkedin.svg` | ✅ |

### 6.2 吉祥物說明

吉祥物為「騎著紙飛機的黃色海星」，包含：

- 黃色海星角色（帶有可愛眼睛和微笑）
- 淺藍色紙飛機
- 黃色星星裝飾（左上角）
- 青色弧線軌跡（右下角）

### 6.3 設計稿插圖來源

- Google Drive 資料夾：<https://drive.google.com/drive/folders/1DVAzjsBftu-DPekAEwrr1urHNN1l_gMq>

---

## 7. 相容性注意事項

### 7.1 Email Client 相容性

- Outlook (Windows/Mac)
- Gmail (Web/Mobile)
- Apple Mail
- Yahoo Mail
- 企業郵件系統

### 7.2 HTML Email 限制

1. 使用 `<table>` 佈局而非 CSS Grid/Flexbox
2. 內聯樣式（Inline CSS）
3. 避免使用 `<style>` 區塊（部分郵件客戶端會移除）
4. 圖片需設定 `alt` 屬性
5. 連結需使用絕對路徑
6. 字體回退：`'Noto Sans TC', Arial, sans-serif`

### 7.3 Outlook 特殊處理

使用條件註解處理 Outlook 相容性：

```html
<!--[if mso]>
  <table>...</table>
<![endif]-->
```

---

## 8. 與現有架構整合

### 8.1 現有檔案結構

```
src/services/email/
├── email.service.ts          # 核心郵件服務
├── template.service.ts       # 模板管理
├── types.ts                  # 型別定義
├── base-template.ts          # 基礎 HTML 模板（需重構）
├── welcome-template.ts       # 歡迎郵件（⚠️ 將被取代）
├── verification-template.ts  # 驗證郵件
├── password-reset-template.ts
├── contact-template.ts
└── marathon-template.ts
```

### 8.2 檔案調整規劃

> ⚠️ **重要**：新系統歡迎信模板將**取代**現有的 `welcome-template.ts`，而非新增檔案。

```
src/services/email/
├── base-template.ts          # 重構：抽出共用組件
├── welcome-template.ts       # 取代：實作兩版本歡迎信
└── types.ts                  # 更新：新增 WelcomeEmailData 型別
```

### 8.3 型別定義更新

在 `types.ts` 中更新 `WelcomeEmailData`：

```typescript
export interface WelcomeEmailData {
  /** 使用者名稱 */
  name: string;

  /** 是否已完成學習類型測驗（決定使用哪個版本） */
  hasCompletedQuiz: boolean;

  /** 主題實踐連結（兩版本共用） */
  practiceUrl?: string;

  /** 學習類型測驗連結（僅未做測驗版本） */
  quizUrl?: string;

  /** 海星插圖 URL */
  illustrationUrl?: string;

  /** 取消訂閱連結 */
  unsubscribeUrl?: string;
}
```

### 8.4 服務方法更新

在 `email.service.ts` 中更新 `sendWelcomeEmail` 方法：

```typescript
async sendWelcomeEmail(
  to: string,
  data: WelcomeEmailData
): Promise<EmailSendResult> {
  // 根據 hasCompletedQuiz 決定使用哪個版本
  const { subject, html } = generateWelcomeEmail(data);

  return this.sendEmail({
    to,
    subject,
    html,
  });
}
```

### 8.5 郵件發送紀錄整合 (`email_logs`)

系統使用 `email_logs` 資料表記錄所有郵件發送紀錄，支援以下功能：

| 功能 | 說明 |
|------|------|
| **追蹤發送狀態** | 記錄每封郵件的發送時間、狀態（pending/sent/failed） |
| **避免重複發送** | 發送前檢查是否已發送過相同類型郵件 |
| **沉默邏輯** | 根據用戶互動情況決定是否停發（如連續未開信則停發） |
| **關聯實體** | 支援關聯 practice、project 等實體，追蹤特定資源的郵件 |

> 📁 **資料表定義**：`daodao-storage/init-scripts-refactored/700_create_table_email_logs.sql`
>
> 📄 **詳細實作指南**：`docs/email/implementation-guide.md` 第 0 章

#### 資料表欄位

```sql
email_logs (
  id, user_id, email_type, entity_type, entity_id,
  email_code, subject, status, sent_at, created_at
)
```

#### 郵件類型 (`email_type`)

| 類型 | 說明 |
|------|------|
| `auth_register` | 註冊確認（歡迎信） |
| `auth_password_reset` | 密碼重設 |
| `auth_email_verify` | 信箱驗證 |
| `practice_created` | 主題實踐：建立成功 (PE01) |
| `practice_first_checkin` | 主題實踐：第一次打卡 (PE02) |
| `practice_weekly_summary` | 主題實踐：當週回顧 (PE03-06) |
| `practice_final_summary` | 主題實踐：完成總結 (PE07-08) |
| `notification` | 一般通知 |

#### 整合範例

```typescript
// 發送歡迎信時自動記錄
await emailService.sendWelcomeEmail('user@example.com', {
  userId: 123,  // 用於記錄
  name: '小明',
  hasCompletedQuiz: true,
});

// 發送前檢查是否已發送過
const alreadySent = await hasEmailBeenSent({
  userId: 123,
  emailType: 'auth_register',
});
```

---

## 9. 實作檢查清單

### 9.1 模板更新

- [ ] 重構 `base-template.ts`：抽出共用組件（Banner、Footer、Author Section、CTA 按鈕）
- [ ] 取代 `welcome-template.ts`：實作兩版本歡迎信（已做測驗 / 未做測驗）
- [ ] 更新 `types.ts`：新增 `WelcomeEmailData` 型別定義
- [ ] 更新 `email.service.ts`：調整 `sendWelcomeEmail` 方法

### 9.2 郵件發送紀錄整合

- [ ] 確認 `email_logs` 資料表已建立（執行 `700_create_table_email_logs.sql`）
- [ ] 新增 `email-log.service.ts`：實作 `createEmailLog`、`hasEmailBeenSent` 等方法
- [ ] 更新 `types.ts`：新增 `EmailType`、`EmailStatus`、`EmailLogData` 型別
- [ ] 整合到 `email.service.ts`：發送郵件時自動記錄
- [ ] 實作重複發送檢查邏輯

### 9.3 資源準備

- [ ] 上傳海星插圖至 CDN
- [ ] 確認社群圖示可用（Threads、Facebook、Instagram、LinkedIn）
- [ ] 更新所有模板中的色彩常數

### 9.4 驗證與測試

- [ ] 更新 Zod 驗證 Schema
- [ ] 跨郵件客戶端測試（Gmail、Outlook、Apple Mail 等）
- [ ] 測試兩版本切換邏輯
- [ ] 測試郵件發送紀錄寫入
- [ ] 測試重複發送防護
- [ ] 更新 API 文件
