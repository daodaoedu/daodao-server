# Spec: 我的小島網址使用者 ID 顯示

Issue: daodaoedu/daodao-server#234  
Scope: M  
Date: 2026-05-17

> **Note:** This issue covers the same feature as #232 (same Notion page: 3589cc81).
> The spec below is the authoritative server-side design for both issues.

---

## 1. 問題描述

使用者已設定自訂 ID（`custom_id`），但「別人的小島」頁面網址沒有帶入自訂 ID，只有「自己的小島」才帶入。

### 1.1 重現路徑

1. 使用者 A 設定 `custom_id = "alice"`
2. 使用者 B 在 Feed 頁看到 A 的打卡/實踐卡片
3. 點擊 A 的頭像或名稱，跳轉到 `/users/<uuid>` 而非 `/users/alice`

### 1.2 根本原因（server 端）

1. **實踐/打卡 API 回傳的嵌入 user 物件缺少 `customId`**
   - `GET /api/v1/practices` 及相關端點回傳的 `user` 子物件只有 `{ id, name, photoUrl }`
   - 前端無 `customId` 可用來決定連結要用 customId 還是 UUID

2. **Profile endpoint 不回傳 `canonical` 欄位**
   - `GET /api/v1/users/profile/:identifier` 已回傳 `customId` ✅
   - 但無 canonical 欄位，前端無法判斷是否需要做 SEO redirect

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

**Schema 變更（Zod）：**

```typescript
const practiceUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  photoUrl: z.string().nullable(),
  customId: z.string().nullable(),  // 新增
});
```

**Service 層 query 變更：**

```typescript
// practice service - Prisma include
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

### 2.2 Profile Endpoint 加入 `canonical` 欄位

```typescript
// controllers/user.controller.ts - getUserProfile
res.json({
  success: true,
  data: {
    // ... existing fields
    canonical: user.custom_id ?? user.external_id,  // 新增
  },
  timestamp: new Date().toISOString()
});
```

前端（`daodao-f2e`）讀取 `canonical`，若 `canonical !== identifier`，呼叫 `permanentRedirect()` 發 308 Permanent Redirect。

---

## 3. 影響範圍

### 3.1 需修改的檔案

| 檔案 | 變更說明 |
|------|----------|
| `src/services/practice.service.ts` | query 加入 `custom_id`，formatter 加入 `customId` |
| `src/controllers/user.controller.ts` | `getUserProfile` response 加入 `canonical` |
| `src/validators/user.validators.ts` | getUserProfile response schema 加入 `canonical: z.string()` |
| `openspec/specs/users.md` | 更新 profile endpoint response schema |

### 3.2 不變動的部分

- `GET /api/v1/users/profile/:identifier` 查詢邏輯維持不變
- `GET /api/v1/users/:id` 及 `GET /api/v1/users/custom-id/:customId` 維持不變
- Database schema 無變動

---

## 4. 測試計畫

- [ ] practice service：回傳 practice 時，user 物件包含 `customId`（有設定時非 null）
- [ ] practice service：user 未設定 customId 時，`customId` 為 null
- [ ] user controller：`getUserProfile` 回傳 `canonical` 等於 customId（有設定時）
- [ ] user controller：`getUserProfile` 無 customId 時，`canonical` 等於 external_id
- [ ] `GET /api/v1/practices` → 每個 practice 的 `user.customId` 符合使用者設定
- [ ] `GET /api/v1/users/profile/<uuid>` → response 包含 `canonical: "<customId>"`

---

## 5. Acceptance Criteria

- [ ] 所有回傳 embedded user 的 API 皆包含 `customId`（camelCase）
- [ ] `getUserProfile` response 包含 `canonical` 欄位
- [ ] `src/validators/user.validators.ts` 包含 `canonical: z.string()` 欄位
- [ ] 現有測試不受影響
