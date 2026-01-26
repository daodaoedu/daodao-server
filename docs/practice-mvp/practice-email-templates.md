# 主題實踐郵件模板文件

本文件包含 8 種主題實踐郵件的完整模板規格與文案。

> **重要**：模板需使用現有的設計系統，詳見：
> - [系統信模板規格](../email/system-email-template-spec.md)
> - [Email 模板使用指南](../email/templates-guide.md)

---

## 1. 模板共用元素

### 1.1 複用現有設計系統

**必須從 `base-template.ts` 引入（不要重新定義）：**

```typescript
import {
  EMAIL_COLORS,
  EMAIL_ASSETS,
  SOCIAL_LINKS,
  generateStandardEmail,
  generateCtaButton,
  generateDivider,
  generateAuthorSection,
} from './base-template';
```

### 1.2 設計系統色彩（使用 EMAIL_COLORS）

| 用途 | 色碼 | EMAIL_COLORS 常數 |
|------|------|-------------------|
| 外層背景 | `#F5FFFD` | `bgOuter` |
| 內容區背景 | `#FFFFFF` | `bgContent` |
| 主標題文字 | `#0D3036` | `textHeading` |
| 主要文字 | `#295E5C` | `textPrimary` |
| 次要文字 | `#9FB5B8` | `textSecondary` |
| 品牌青色 CTA | `#16B9B3` | `brandCyan` |
| 品牌橘色 CTA | `#FFA10B` | `brandOrange` |
| CTA 按鈕文字 | `#0D3036` | `ctaText` |
| 引言區塊背景 | `#F5FFFD` | `bgQuote` |
| 分隔線 | `#E0E0E0` | `divider` |
| Footer 背景 | `#F4F6F6` | `bgFooter` |

### 1.3 共用署名區塊（使用 generateAuthorSection）

```typescript
// 直接使用現有組件，不要自己實作
import { generateAuthorSection } from './base-template';

// 產生的 HTML：
// - 島島阿學團隊
// - 你的學習生活提案所
// - Where personal growth meets collective wisdom!
const authorHtml = generateAuthorSection();
```

---

## 2. PE01 - 建立成功

### 2.1 郵件資訊

| 項目 | 內容 |
|------|------|
| Subject | 開啟你的小而美學習生活提案 |
| 觸發時機 | 實踐建立成功後即時發送 |
| 必要變數 | `userName`, `practiceName`, `startDate`, `durationDays`, `frequency`, `action` |

### 2.2 文案

```
Hello {{User_Name}},

很高興看到你開啟了新的主題實踐：{{實踐名稱}}。

從 {{開始日期}} 開始的 {{天數}} 天中，你計劃每週有 {{頻率}} 來進行 {{行動}}。

我們認為決定開始已經是付出行動，你的「意圖」同樣值得被視覺化，
所以你會發現你現在已有 20% 的進度 ✨。

同時也期待你的第一次打卡分享，每當你為這個主題付出一點點行動，
無論多微小，記得回到島島阿學進行「打卡」，藉由每一次留下的紀錄，
看見自己的成長和進步，相信這在實踐結束後會是很棒的收獲。

我們也會在每週日寄出當週星期一至星期六的打卡記錄摘要，
幫助你回顧一週的收獲與成長！
```

### 2.3 模板程式碼

```typescript
// src/services/email/practice-template.ts

import { emailConfig } from '../../config/email.config';
import {
  EMAIL_COLORS,
  generateStandardEmail,
  generateCtaButton,
  generateDivider,
  generateAuthorSection,
} from './base-template';
import { escapeHtml, sanitizeUrl } from '../../utils/sanitize';
import type { PE01Data } from '../../types/email/practice.types';

/**
 * PE01: 建立成功郵件
 */
export const generatePE01Email = (data: PE01Data) => {
  const subject = '開啟你的小而美學習生活提案';
  const preheader = `恭喜開啟「${data.practiceName}」主題實踐，你已擁有 20% 的進度！`;

  // 安全處理用戶輸入
  const safeName = escapeHtml(data.userName);
  const safePracticeName = escapeHtml(data.practiceName);
  const safeAction = escapeHtml(data.action);
  const safePracticeUrl = sanitizeUrl(data.practiceUrl);

  const content = `
    <!-- Greeting -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td class="text-block" style="padding-bottom: 20px;">
          <h2 style="margin: 0; font-size: 24px; font-weight: 700; color: ${EMAIL_COLORS.textHeading}; line-height: 150%;">
            Hello ${safeName},
          </h2>
        </td>
      </tr>
    </table>

    <!-- Intro -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td class="text-block" style="padding-bottom: 20px;">
          <p style="margin: 0; font-size: 16px; color: ${EMAIL_COLORS.textPrimary}; line-height: 180%;">
            很高興看到你開啟了新的主題實踐：<strong style="color: ${EMAIL_COLORS.brandCyan};">${safePracticeName}</strong>。
          </p>
        </td>
      </tr>
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td class="text-block" style="padding-bottom: 24px;">
          <p style="margin: 0; font-size: 16px; color: ${EMAIL_COLORS.textPrimary}; line-height: 180%;">
            從 <strong>${data.startDate}</strong> 開始的 <strong>${data.durationDays}</strong> 天中，
            你計劃每週有 <strong>${data.frequency}</strong> 來進行 <strong>${safeAction}</strong>。
          </p>
        </td>
      </tr>
    </table>

    <!-- Quote Block -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td style="padding-bottom: 24px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="border-left: 4px solid ${EMAIL_COLORS.brandOrange}; padding: 14px 18px; background-color: ${EMAIL_COLORS.bgQuote};">
                <p style="margin: 0; font-size: 15px; color: ${EMAIL_COLORS.textPrimary}; line-height: 1.6;">
                  我們認為決定開始已經是付出行動，你的「意圖」同樣值得被視覺化，
                  所以你會發現你現在已有 <strong style="color: ${EMAIL_COLORS.brandOrange};">20% 的進度</strong> ✨
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Body Text -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td class="text-block" style="padding-bottom: 20px;">
          <p style="margin: 0; font-size: 16px; color: ${EMAIL_COLORS.textPrimary}; line-height: 180%;">
            同時也期待你的<strong>第一次打卡分享</strong>，每當你為這個主題付出一點點行動，
            無論多微小，<strong>記得回到島島阿學進行「打卡」</strong>，藉由每一次留下的紀錄，
            看見自己的成長和進步，相信這在實踐結束後會是很棒的收獲。
          </p>
        </td>
      </tr>
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td class="text-block" style="padding-bottom: 24px;">
          <p style="margin: 0; font-size: 16px; color: ${EMAIL_COLORS.textPrimary}; line-height: 180%;">
            我們也會在每週日寄出當週星期一至星期六的打卡記錄摘要，幫助你回顧一週的收獲與成長！
          </p>
        </td>
      </tr>
    </table>

    <!-- CTA Button (使用現有組件) -->
    ${generateCtaButton({
      text: '前往我的實踐',
      url: safePracticeUrl,
      color: 'orange',
    })}

    ${generateDivider()}
    ${generateAuthorSection()}
  `;

  // 使用 generateStandardEmail 統一處理 head, wrapper, banner, footer
  return generateStandardEmail({
    title: '島島阿學 - 主題實踐',
    subject,
    preheader,
    content,
    unsubscribeUrl: data.unsubscribeUrl || `${emailConfig.urls.frontend}/unsubscribe`,
  });
};
```

---

## 3. PE02 - 第一次打卡

### 3.1 郵件資訊

| 項目 | 內容 |
|------|------|
| Subject | 你在 {{實踐名稱}} 的第一步 ✨ |
| 觸發時機 | 第一次打卡後即時發送 |
| 必要變數 | `userName`, `practiceName` |

### 3.2 文案

```
Hi {{User_Name}},

剛剛收到你在 {{實踐名稱}} 的第一則打卡紀錄，真的很替你開心！

所謂「好的開始是成功的一半」，在第一則打卡後你的進度來到 50%，
是不是離達成目標更躍進一大步了呢？

每則紀錄的意義，或許比你想像的還要大。當你寫下你的想法和感受時，
你也同時在幫助其他人！

✨ 提供靈感：你的觀點，可能剛好解開了某個人卡關已久的難題。
🤝 創造共鳴：當你分享困惑或挑戰時，會讓正在經歷同樣狀況的人感到我不孤單。
🎇 激盪火花：一個微小的想法，經常能引發其他人更深層的思考與對話。

不要擔心不夠完美，最真實的紀錄，往往最有力量。

謝謝你，我們很期待你的持續分享。
```

### 3.3 模板程式碼

```typescript
// src/services/email/practice/templates/pe02-first-checkin.template.ts

import { PE02Data } from '../practice-email.types';
import { getPracticeEmailBaseTemplate } from './practice-base.template';

export const generatePE02Email = (data: PE02Data) => {
  const subject = `你在 ${data.practiceName} 的第一步 ✨`;

  const content = `
    <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: 700; color: #333333;">
      Hi ${data.userName},
    </h2>

    <p style="margin: 0 0 16px; font-size: 16px; color: #666666; line-height: 1.6;">
      剛剛收到你在 <strong style="color: #16B9B3;">${data.practiceName}</strong> 的第一則打卡紀錄，真的很替你開心！
    </p>

    <div style="background-color: #E8F8F7; padding: 20px; border-radius: 12px; margin: 24px 0;">
      <p style="margin: 0; font-size: 16px; color: #333333; line-height: 1.6;">
        所謂「好的開始是成功的一半」，在第一則打卡後你的進度來到 <strong style="color: #F5A623; font-size: 20px;">50%</strong>，
        是不是離達成目標更躍進一大步了呢？
      </p>
    </div>

    <p style="margin: 0 0 16px; font-size: 16px; color: #666666; line-height: 1.6;">
      每則紀錄的意義，或許比你想像的還要大。當你寫下你的想法和感受時，你也同時在幫助其他人！
    </p>

    <table role="presentation" width="100%" style="margin: 24px 0;">
      <tr>
        <td style="padding: 12px 0;">
          <p style="margin: 0; font-size: 15px; color: #666666;">
            <strong>✨ 提供靈感：</strong>你的觀點，可能剛好解開了某個人卡關已久的難題。
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 0;">
          <p style="margin: 0; font-size: 15px; color: #666666;">
            <strong>🤝 創造共鳴：</strong>當你分享困惑或挑戰時，會讓正在經歷同樣狀況的人感到我不孤單。
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 0;">
          <p style="margin: 0; font-size: 15px; color: #666666;">
            <strong>🎇 激盪火花：</strong>一個微小的想法，經常能引發其他人更深層的思考與對話。
          </p>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 16px; font-size: 16px; color: #333333; font-weight: 600; line-height: 1.6;">
      不要擔心不夠完美，最真實的紀錄，往往最有力量。
    </p>

    <p style="margin: 0 0 24px; font-size: 16px; color: #666666; line-height: 1.6;">
      謝謝你，我們很期待你的持續分享。
    </p>
  `;

  const html = getPracticeEmailBaseTemplate(content);

  return { subject, html };
};
```

---

## 4. PE03 - 週回顧（有打卡文字）

### 4.1 郵件資訊

| 項目 | 內容 |
|------|------|
| Subject | {{實踐名稱}} 每週回顧：看見生活中的成長微光 ✨ |
| 觸發時機 | 第 7 天，當週有打卡且有文字記錄 |
| 必要變數 | `userName`, `practiceName`, `weeklyCount`, `totalCount`, `weeklyNoteSnippet` |

### 4.2 文案

```
Hi {{User_Name}},

這個星期的你好嗎？

📊 你的足跡：這一週，你進行了 {{Weekly_Count}} 次打卡。
至目前為止，累積了 {{Total_Count}} 則打卡紀錄！

💡 本週的打卡 Highlight：
"{{Weekly_User_Note_Snippet}}..."

看著這段文字，現在的你，有沒有產生新的想法呢？

每一個微小的步伐，都在累積前往理想生活的里程，請繼續保持這份前進的動能！
```

### 4.3 模板程式碼

```typescript
// src/services/email/practice/templates/pe03-weekly-with-note.template.ts

import { WeeklySummaryData } from '../practice-email.types';
import { getPracticeEmailBaseTemplate } from './practice-base.template';

export const generatePE03Email = (data: WeeklySummaryData) => {
  const subject = `${data.practiceName} 每週回顧：看見生活中的成長微光 ✨`;

  const content = `
    <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: 700; color: #333333;">
      Hi ${data.userName},
    </h2>

    <p style="margin: 0 0 24px; font-size: 16px; color: #666666; line-height: 1.6;">
      這個星期的你好嗎？
    </p>

    <!-- 統計區塊 -->
    <div style="background-color: #F5F5F5; padding: 20px; border-radius: 12px; margin: 24px 0;">
      <p style="margin: 0 0 8px; font-size: 14px; color: #999999;">
        📊 你的足跡
      </p>
      <p style="margin: 0; font-size: 16px; color: #333333; line-height: 1.6;">
        這一週，你進行了 <strong style="color: #16B9B3; font-size: 24px;">${data.weeklyCount}</strong> 次打卡。<br>
        至目前為止，累積了 <strong style="color: #F5A623; font-size: 24px;">${data.totalCount}</strong> 則打卡紀錄！
      </p>
    </div>

    <!-- Highlight 區塊 -->
    <div style="background-color: #FFF8F0; border-left: 4px solid #F5A623; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
      <p style="margin: 0 0 8px; font-size: 14px; color: #F5A623; font-weight: 600;">
        💡 本週的打卡 Highlight
      </p>
      <p style="margin: 0; font-size: 15px; color: #666666; font-style: italic; line-height: 1.6;">
        "${data.weeklyNoteSnippet}..."
      </p>
    </div>

    <p style="margin: 0 0 16px; font-size: 16px; color: #666666; line-height: 1.6;">
      看著這段文字，現在的你，有沒有產生新的想法呢？
    </p>

    <p style="margin: 0 0 24px; font-size: 16px; color: #333333; font-weight: 500; line-height: 1.6;">
      每一個微小的步伐，都在累積前往理想生活的里程，請繼續保持這份前進的動能！
    </p>

    <!-- CTA -->
    <table role="presentation" width="100%" style="margin: 24px 0;">
      <tr>
        <td align="center">
          <a href="${data.practiceUrl}" style="display: inline-block; padding: 14px 28px; background-color: #16B9B3; color: #FFFFFF; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 24px;">
            查看我的實踐 &gt;
          </a>
        </td>
      </tr>
    </table>
  `;

  const html = getPracticeEmailBaseTemplate(content);

  return { subject, html };
};
```

---

## 5. PE04 - 週回顧（無打卡文字）

### 5.1 郵件資訊

| 項目 | 內容 |
|------|------|
| Subject | {{實踐名稱}} 每週回顧：看見生活中的成長微光 ✨ |
| 觸發時機 | 第 7 天，當週有打卡但無文字記錄 |

### 5.2 文案

與 PE03 相同，但移除 Highlight 區塊。

---

## 6. PE05 - 週回顧（從未打卡）

### 6.1 郵件資訊

| 項目 | 內容 |
|------|------|
| Subject | 看不見的成長，也在悄悄發生 |
| 觸發時機 | 第 7 天，從建立至今從未打卡 |

### 6.2 文案

```
Hi {{User_Name}},

這週在 {{實踐名稱}} 的頁面上，雖然沒有新增的打卡紀錄，
但我們相信，這段看似沒有進行的時間，其實是學習過程中的「醞釀期」。

若你發現原本規劃的執行日期和時段不符合你目前的生活步調，
歡迎回到島島阿學進行修改。

想轉換一下心情嗎？回來看看別人在做什麼！
```

---

## 7. PE06 - 週回顧（當週無打卡）

### 7.1 郵件資訊

| 項目 | 內容 |
|------|------|
| Subject | 關於 {{實踐名稱}} 的下一步 🛤️ |
| 觸發時機 | 第 7 天，當週無打卡但累積有打卡 |

### 7.2 文案

```
Hi {{User_Name}},

發現你這週還沒有在 {{實踐名稱}} 留下打卡記錄。

寫這封信，主要是想關心目前的節奏是否還適合你？
我們知道「生活」往往比「計畫」更多變。

如果真的提不起勁行動，先回來看看其他夥伴在做什麼，
或許就能找回一點點感覺。

我們依然在這裡，隨時歡迎你回來。
```

---

## 8. PE07 - 完成總結（有打卡）

### 8.1 郵件資訊

| 項目 | 內容 |
|------|------|
| Subject | 這是你的 {{實踐名稱}} 成長足跡 |
| 觸發時機 | 實踐結束後 24 小時內，有打卡記錄 |

### 8.2 文案

```
Hi {{User_Name}},

時間過得好快，為期 {{天數}} 天的 {{實踐名稱}} 實踐旅程，告一段落了。

現在的你和開始那天相比，心裡是否多了一些篤定，
或是裝進了一些新的風景呢？

雖然說很多時候我們無法量化成長。
但我們幫你總結了這段時間裡，你留下的珍貴足跡。

💡 還記得那一刻的想法嗎？

在 {{Best_Note_Date}} 那天，你寫下了這段話：
"{{User_Best_Note_Snippet}}..."

這一個篇章結束了，但學習生活持續進行。

延續動能：如果意猶未盡，你可以調整目標，開啟新一輪的實踐。
探索新領域：帶著這次的經驗，去嘗試另一個領域！

謝謝你，讓我們參與了這段旅程。
```

---

## 9. PE08 - 完成總結（無打卡）

### 9.1 郵件資訊

| 項目 | 內容 |
|------|------|
| Subject | 關於 {{實踐名稱}} |
| 觸發時機 | 實踐結束後 24 小時內，無打卡記錄 |

### 9.2 文案

```
Hi {{User_Name}},

為期 {{天數}} 天的 {{實踐名稱}} 週期，在今天告一段落了。

我們將每一個主題實踐視為一個「小而美的生活提案」，
是為了讓你的生活多一種風味，而不是多一份負擔。

沒有「執行」不代表浪費，有時候，光是「把這件事放在心上」，
就已經是一種微小的改變。

接下來，你可以怎麼做呢？

重新給自己一個輕盈的開始：如果你覺得時機對了，歡迎隨時重新開啟。
這次，試著只給自己一個「微小到不可能失敗」的目標？

看看別人在做什麼：需要一些靈感嗎？回來看看其他夥伴在做什麼，
或許能找到一些想法。

用舒服的節奏，探索學習生活。
```

---

## 10. 基礎模板

> **重要**：不需自行實作基礎模板，直接使用 `generateStandardEmail` 即可。
>
> 詳見：[Email 模板使用指南](../email/templates-guide.md)

```typescript
// 使用現有的 generateStandardEmail，不要自己實作 HTML wrapper
import { generateStandardEmail } from './base-template';

// generateStandardEmail 會自動處理：
// - HTML head (含 Outlook 相容性)
// - Email wrapper (外層背景、響應式)
// - Banner (品牌 Logo)
// - Footer (社群連結、取消訂閱)

// 使用方式：
const { subject, html } = generateStandardEmail({
  title: '島島阿學 - 主題實踐',      // HTML title
  subject: '郵件主旨',               // 郵件標題
  preheader: '預覽文字（顯示在郵件列表）',  // 預覽摘要
  content: '<p>郵件內容 HTML</p>',   // 主要內容
  unsubscribeUrl: 'https://...',    // 取消訂閱連結（可選）
});
```

### 10.1 可用組件一覽

| 組件 | 用途 | 參數 |
|------|------|------|
| `generateStandardEmail` | 完整郵件 HTML | `{title, subject, preheader, content, unsubscribeUrl?}` |
| `generateCtaButton` | CTA 按鈕 | `{text, url, color: 'cyan'｜'orange'}` |
| `generateDivider` | 分隔線 | 無 |
| `generateAuthorSection` | 作者署名 | 無 |
| `generateBanner` | Banner 區塊 | 無（已整合在 generateStandardEmail） |
| `generateFooter` | Footer 區塊 | `unsubscribeUrl?`（已整合在 generateStandardEmail） |

### 10.2 實作建議

```typescript
// src/services/email/practice-template.ts

import {
  EMAIL_COLORS,
  generateStandardEmail,
  generateCtaButton,
  generateDivider,
  generateAuthorSection,
} from './base-template';
import { escapeHtml, sanitizeUrl } from '../../utils/sanitize';
import type { PE01Data, PE02Data, WeeklySummaryData, FinalSummaryData } from '../../types/email/practice.types';

// 導出所有 Practice Email 模板函數
export { generatePE01Email } from './practice-template';
export { generatePE02Email } from './practice-template';
// ... PE03-PE08
```

---

## 11. 相關資源

### 11.1 打卡標籤與引導句

| 標籤（中文） | 標籤（英文） | 引導句 |
|-------------|-------------|--------|
| 實作 | Practice | 我練習了... |
| 新概念 | New concept | 我學到的一個新概念是... |
| 有趣 | Interesting | 發生了一件有趣的事，就是... |
| 困難 | Stuck | 遇到了一點困難，像是... |
| 下一步 | Next step | 接下來我想嘗試... |
| 改進 | Improve | 下次可以做得更好的是... |
| 疑問 | Doubt | 我有個疑問是... |

### 11.2 打卡完成鼓勵句（隨機輪播）

1. 今天的你也很有行動力哦！
2. 累積，是時間送給堅持者的禮物！
3. 你的堅持正在閃閃發光！
4. 每天進步一點點，回頭看會很不一樣！
5. 保持這個節奏，你做得很好！
6. 收到你的進度了！為堅持的自己鼓掌吧！
7. 不必完美，持續就是最大的勝利！
8. 這一小步，是通往目標的一大步！
9. 記得謝謝這樣努力的自己！
10. 感到困難嗎？那是大腦正在升級的訊號喔！
11. 紀錄完成！離目標又更近了一步！
12. 行動是治癒焦慮最好的解藥，你今天做到了！
13. 記得你出發的原因嗎？今天的你離它更近了！
14. 學習的路上，每一步都算數！
15. 今天的你，比想像中更強大一點點！
16. 今天的耕耘，是為了遇見更好的自己！
17. 收下這份成就感，明天繼續加油！
18. 你的每一分努力，島島阿學都幫你記下了！
19. 今天的投入，會讓你看見不一樣的風景！
20. 這一刻的投入，讓你的今天變得不平凡！
21. 辛苦了！別忘了給自己一杯咖啡的時間！
22. 專注當下的你，真的很有魅力！
23. 慢慢來，比較快！我們陪你一起走！
24. 享受這段旅程，學習本身就是獎勵！
25. 即使是一點點進展，也值得好好慶祝！
26. 休息一下，沉澱心情，明天再出發！
27. 願意開始的你，已經贏過昨天的自己！
28. 狀態很不錯喔！繼續保持這份熱情！
29. 相信過程，結果自然會發生！
30. 即使只是一小步，也是進步的證明！

---

## 12. 相關文件

### Email 服務核心文件（務必先閱讀）

- [Email 服務技術文件](../email/email-service.md) - 核心服務架構
- [Email 模板使用指南](../email/templates-guide.md) - 模板開發指南
- [系統信模板規格](../email/system-email-template-spec.md) - 設計系統規格
- [系統信模板實作指南](../email/implementation-guide.md) - 整合 email_logs 說明

### 主題實踐文件

- [主題實踐郵件功能規格](./practice-email-spec.md)
- [主題實踐郵件功能實作指南](./practice-email-implementation.md)
- [主題實踐 Email - FRD](./主題實踐%20Email%20-%20FRD.md)
- [後端功能修正規劃](./backend-implementation-plan.md)
