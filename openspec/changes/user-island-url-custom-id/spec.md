# Spec: 我的小島網址使用者 ID 顯示

Issue: daodaoedu/daodao-server#232  
Scope: M  
Date: 2026-05-16

---

## 1. 問題描述

使用者已設定自訂 ID（`custom_id`），但「別人的小島」頁面網址沒有帶入自訂 ID，只有「自己的小島」才帶入。

### 1.1 重現路徑

1. 使用者 A 設定 `custom_id = "alice"`
2. 使用者 B 在 Feed 頁看到 A 的打卡/實踐卡片
3. 點擊 A 的頭像或名稱，跳轉到 `/users/<uuid>` 而非 `/users/alice`

### 1.2 根本原因分析（server 端）

1. **實踐/打卡 API 回傳的嵌入 user 物件缺少 `customId`**  
   - `GET /api/v1/practices` 及 `GET /api/v1/practices/:id` 回傳的 `user` 子物件只有 `{ id, name, photoUrl }`，沒有 `customId`
   - 前端無法靠這份資料決定用 customId 還是 UUID 建立連結

2. **Profile endpoint 不回傳 canonical URL 供 SEO 重導**  
   - `GET /api/v1/users/profile/:identifier` 已回傳 `customId` ✅  
   - 但當以 UUID 訪問時沒有 redirect 機制 → 瀏覽器 URL 停留在 UUID，影響 SEO

---

## 2. 解決方案

### 2.1 在實踐/打卡嵌入 user 物件中加入 `customId`

**受影響端點：**

| 端點 | 目前 user 欄位 | 新增欄位 |
|------|---------------|----------|
| `GET /api/v1/practices` | `id, name, photoUrl` | `customId` |
| `GET /api/v1/practices/:id` | `id, name, photoUrl` | `customId` |
| `GET /api/v1/practices/:id/check-ins` | `id, name, photoUrl` | `customId` |
| `GET /api/v1/check-ins` | `id, name, photoUrl` | `customId` |

> Note: 統一使用 camelCase `customId`（而非 snake_case `custom_id`），降低前端類型定義複雜度，確保同一功能的命名一致性。

**Schema 變更（Zod / OpenAPI）：**

```typescript
// practices response - 嵌入 user 物件
const practiceUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  photoUrl: z.string().nullable(),
  customId: z.string().nullable(),  // 新增
});

// check-ins response - 嵌入 user 物件（統一 camelCase）
const checkInUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  photoUrl: z.string().nullable(),
  customId: z.string().nullable(),  // 新增，統一使用 camelCase
});
```

**Service 層 query 變更：**

> Note: 目前 practice/check-in 邏輯位於 legacy JavaScript 層；若已遷移至 TypeScript，對應路徑為 `src/services/practice.service.ts` / `src/services/check-in.service.ts`。

```typescript
// practice service - 查詢 include（關聯名稱使用單數 user，反映一對一關係）
const practiceWithUser = await prisma.practices.findMany({
  include: {
    user: {
      select: {
        external_id: true,
        nickname: true,
        contacts: { select: { photo_url: true } },
        custom_id: true,  // 新增
      },
    },
  },
});

// formatter 輸出
{
  id: user.external_id,
  name: user.nickname,
  photoUrl: user.contacts?.photo_url ?? null,
  customId: user.custom_id ?? null,  // 新增
}
```

### 2.2 Profile Endpoint 加入 `canonical` 並啟用 SEO 永久重導

為正確支援 SEO（link equity 合併、搜尋引擎索引標準 URL），採**前端 Next.js SSR 永久重導**策略：

**Step 1 — Server API** 在 `getUserProfile` response 加入 `canonical` 欄位：

```typescript
// controllers/user.js（或 src/controllers/user.controller.ts）
res.json({
  success: true,
  data: {
    // ... existing fields
    canonical: user.custom_id ?? user.external_id,  // 新增
  },
  timestamp: new Date().toISOString()
});
```

**Step 2 — 前端 Next.js page**（`daodao-f2e`）讀取 `canonical`，若 `canonical !== identifier`，呼叫 `permanentRedirect()` 發出 **308 Permanent Redirect**（與 SEO 301 等效）：

```typescript
// apps/product/src/app/[locale]/(with-layout)/users/[identifier]/page.tsx
import { permanentRedirect } from 'next/navigation';

export default async function UserIslandPage({ params: { identifier } }) {
  const profile = await fetchUserProfile(identifier);
  if (profile?.data?.canonical && profile.data.canonical !== identifier) {
    permanentRedirect(`/users/${profile.data.canonical}`);
  }
  // ... render page
}
```

> **設計理由**：`/api/v1/users/profile/:identifier` 是 JSON API 端點，非 HTML 頁面；搜尋引擎索引的目標是前端頁面 URL（`/users/<identifier>`），而非 API URL。`permanentRedirect()` 在 Next.js Server Component 中回傳 HTTP 308 Permanent，搜尋引擎與瀏覽器均完整支援，SEO 效果等同 301。此設計避免在 JSON API 層引入 HTTP 重導的不必要複雜度。

---

## 3. 影響範圍

### 3.1 需修改的檔案

| 檔案 | 變更說明 |
|------|----------|
| `src/services/practice.service.ts`（或 legacy `controllers/project.js`） | query 加入 `custom_id`，formatter 加入 `customId` |
| `src/services/check-in.service.ts`（或 legacy check-in controller） | query 加入 `custom_id`，formatter 加入 `customId` |
| `src/validators/practice.validators.ts` | Zod schema 加入 `customId: z.string().nullable()` |
| `src/validators/check-in.validators.ts` | Zod schema 加入 `customId: z.string().nullable()` |
| `src/controllers/user.controller.ts`（或 legacy `controllers/user.js`） | `getUserProfile` response 加入 `canonical` 欄位 |
| `src/validators/user.validators.ts` | getUserProfile response Zod schema 加入 `canonical: z.string()` |
| `openspec/specs/users.md` | 更新 profile endpoint response schema |

### 3.2 不變動的部分

- `GET /api/v1/users/profile/:identifier` 邏輯維持不變（已正確回傳 `customId`）
- `GET /api/v1/users/:id` 及 `GET /api/v1/users/custom-id/:customId` 維持不變
- Database schema 無變動

---

## 4. 測試計畫

### 4.1 Unit Tests

- [ ] practice service：回傳 practice 時，user 物件包含 `customId`（有設定時非 null）
- [ ] practice service：user 未設定 customId 時，`customId` 為 null
- [ ] check-in service：回傳 check-in 時，user 物件包含 `customId`
- [ ] user controller：`getUserProfile` 回傳 `canonical` 等於 customId（有設定時）
- [ ] user controller：`getUserProfile` 無 customId 時，`canonical` 等於 external_id

### 4.2 Integration Tests

- [ ] `GET /api/v1/practices` → 每個 practice 的 `user.customId` 符合該使用者的設定
- [ ] `GET /api/v1/practices/:id/check-ins` → 每個 check-in 的 `user.customId` 正確
- [ ] `GET /api/v1/users/profile/<uuid>` → response 包含 `canonical: "<customId>"`
- [ ] `GET /api/v1/users/profile/<customId>` → response 包含 `canonical: "<customId>"`

---

## 5. Acceptance Criteria

- [ ] 所有回傳 embedded user 的 API 皆包含 `customId`（camelCase，統一命名）
- [ ] `getUserProfile` response 包含 `canonical` 欄位
- [ ] `src/validators/user.validators.ts` 更新以包含 `canonical: z.string()` 欄位
- [ ] 現有 E2E 測試不受影響
- [ ] OpenAPI schema 文件同步更新
