# Email Template Management — 設計討論文件

## 背景

目前系統的 email 模板以 TypeScript code 形式存在於 `src/services/email/`，例如：

- `welcome-template.ts` → `generateWelcomeEmail()`
- `verification-template.ts` → `generateVerificationEmail()`
- `password-reset-template.ts` → `generatePasswordResetEmail()`
- ...共約 20+ 個模板

這些函式透過 `base-template.ts` 的 `generateStandardEmail()` 套入品牌 wrapper，產出帶有 inline CSS、響應式設計的完整 HTML email。

DB 層（`email_templates` 表）已在 migration 049 建立，欄位為：
`id`, `name`, `subject`, `body` (TEXT), `variables` (TEXT[]), `created_at`, `updated_at`

Admin-UI（`/admin/email-management` → 模板管理 tab）已接好 CRUD API：
`GET/POST /api/v1/admin/email-templates`、`PUT/DELETE /api/v1/admin/email-templates/:id`

---

## 核心問題

**管理員透過 admin-ui 新增模板時，body 要怎麼寫？**

現有模板的完整 HTML 有幾百行（含 inline CSS），不可能要求管理員從頭手寫。

---

## 三種設計方向

### 方向 A：內容填空 + 自動套版（推薦）

管理員只需填寫「主旨 + 正文 HTML 片段」，server 在發送時自動套入 `generateStandardEmail()` wrapper。

**前端 UI：**
- 主旨欄位
- 正文 textarea（只寫 content 區塊，例如 `<p>Hi {{name}}</p><a href="{{link}}">按鈕</a>`）
- 即時預覽按鈕 → 呼叫 `POST /api/v1/admin/email-templates/:id/preview`，server 套 wrapper 後回傳完整 HTML 在 iframe 顯示

**DB 儲存：**
- `body` 存完整 HTML（含 wrapper），由 server 在 save 時組裝

**優點：** 設計一致、易用、不需要 HTML 知識
**缺點：** 需新增 preview API；自訂程度受 wrapper 限制

---

### 方向 B：全 HTML 編輯（工程師導向）

`body` 直接存完整 HTML，admin 可貼上任何 HTML。

**前端 UI：**
- 主旨欄位
- 大型 monospace textarea（存完整 HTML）
- 預覽按鈕 → iframe 直接 render `body` 內容

**優點：** 最彈性，完全自訂
**缺點：** 新建模板需自帶完整 inline CSS；非工程師難以使用

---

### 方向 C：Markdown 轉換

管理員寫 Markdown，save 時 server 轉為 HTML 再套 wrapper。

**前端 UI：**
- 主旨欄位
- Markdown editor（左右分割或 tab 切換預覽）
- 支援 `{{variable}}` 語法

**優點：** 最低門檻、最易讀
**缺點：** Markdown 無法表達複雜排版（多欄、特殊按鈕樣式等）

---

## 建議決策點

| 考量 | A（套版） | B（全 HTML） | C（Markdown） |
|------|-----------|-------------|---------------|
| 非工程師能用 | ✅ | ❌ | ✅ |
| 設計與現有一致 | ✅ | ⚠️ | ✅ |
| 排版彈性 | 中 | 最高 | 低 |
| 開發成本 | 中（需 preview API） | 低 | 中（需 MD parser） |
| 現有模板遷移 | 需抽出 content 區塊 | 直接存完整 HTML | 重寫 |

---

## 現有模板清單（需 seed 進 DB）

| 模板名稱 | slug | 變數 |
|---------|------|------|
| 歡迎信（預設） | welcome-default | name, practiceUrl, unsubscribeUrl |
| 歡迎信（社群媒體） | welcome-social | name, practiceUrl, unsubscribeUrl |
| 歡迎信（社群推薦） | welcome-community | name, practiceUrl, unsubscribeUrl |
| 信箱驗證 | verification | name, verifyLink |
| 密碼重設 | password-reset | name, resetLink |
| 馬拉松報名確認 | marathon | name, marathonTitle, marathonDate, marathonDescription |
| 許願採納通知 | wish-linked | recipientName, itemTitle, url, unsubscribeUrl |
| 共鳴通知 | reaction-notification | recipientName, practiceTitle, reactionCount |
| 4小時通知摘要 | notification-digest | recipientName |
| 每週通知摘要 | notification-weekly | recipientName |
| PE01 實踐建立確認 | pe01-practice-created | name, practiceTitle, practiceUrl |
| PE02 第一次打卡鼓勵 | pe02-first-checkin | name, practiceTitle |
| PE03 每週回顧（有筆記） | pe03-weekly-with-notes | practiceTitle, checkinCount, notes |
| PE04 每週回顧（無筆記） | pe04-weekly-no-notes | practiceTitle, checkinCount |
| PE05 每週回顧（未打卡） | pe05-weekly-no-checkin | practiceTitle |
| PE06 實踐沉睡喚醒 | pe06-dormant | practiceTitle, practiceUrl |
| PE07 最終總結（有打卡） | pe07-final-with-checkins | practiceTitle, totalCheckins |
| PE08 最終總結（無打卡） | pe08-final-no-checkins | practiceTitle |
| 入門任務 A–E | onboarding-task-a/b/c/d/e | name |

---

## 待決定事項

- [ ] 選擇 A / B / C 其中一個方向
- [ ] 若選 A：確認 preview API 規格；決定 `body` 是存 content 片段或完整 HTML
- [ ] 若選 A 或 C：需新增 `POST /api/v1/admin/email-templates/preview` endpoint
- [ ] 決定是否需要在 `email_templates` 表加 `slug` 欄位（方便 code 中透過 slug 查找模板）
- [ ] 執行 `prisma/seed-email-templates.ts` 或 `050_seed_email_templates.sql` 把現有模板寫入 DB
