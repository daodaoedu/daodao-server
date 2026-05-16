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

2. **Profile endpoint 不回傳 `customId` 在 SEO canonical URL 情境下**  
   - `GET /api/v1/users/profile/:identifier` 已回傳 `customId` ✅  
   - 但當以 UUID 訪問時沒有 server-side redirect → 瀏覽器 URL 停留在 UUID

---

## 2. 解決方案

### 2.1 在實踐/打卡嵌入 user 物件中加入 `customId`

**受影響端點：**

| 端點 | 目前 user 欄位 | 新增欄位 |
|------|---------------|----------|
| `GET /api/v1/practices` | `id, name, photoUrl` | `customId` |
| `GET /api/v1/practices/:id` | `id, name, photoUrl` | `customId` |
| `GET /api/v1/practices/:id/check-ins` | `id, name, photo_url` | `custom_id` |
| `GET /api/v1/check-ins` | `id, name, photo_url` | `custom_id` |

> Note: 打卡 API 回傳 snake_case（`custom_id`），實踐 API 回傳 camelCase（`customId`），維持現有風格一致性。

**Schema 變更（Zod / OpenAPI）：**

```typescript
// practices response - 嵌入 user 物件
const practiceUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  photoUrl: z.string().nullable(),
  customId: z.string().nullable(),  // 新增
});

// check-ins response - 嵌入 user 物件
const checkInUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  photo_url: z.string().nullable(),
  custom_id: z.string().nullable(),  // 新增
});
```

**Service 層 query 變更：**

```typescript
// practice.service.ts - 查詢 include 中加入 custom_id
const practiceWithUser = await prisma.practices.findMany({
  include: {
    users: {
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

### 2.2 新增 Profile Canonical Redirect

當以 UUID 存取 `GET /api/v1/users/profile/:identifier` 且該使用者有 `customId` 時，回傳 `canonical` 欄位讓前端自行重導：

```typescript
// 在 getUserProfile response 加入 canonical
res.json({
  success: true,
  data: {
    // ... existing fields
    canonical: user.custom_id ?? user.external_id,  // 新增
  },
  timestamp: new Date().toISOString()
});
```

> Server 不做 HTTP redirect（302/301），由前端在 page load 時根據 `canonical !== identifier` 決定是否 `router.replace`。

---

## 3. 影響範圍

### 3.1 需修改的檔案

| 檔案 | 變更說明 |
|------|----------|
| `src/services/practice.service.ts` | Prisma query 加入 `custom_id`，formatter 加入 `customId` |
| `src/services/check-in.service.ts` | Prisma query 加入 `custom_id`，formatter 加入 `custom_id` |
| `src/validators/practice.validators.ts` | Zod schema 加入 `customId: z.string().nullable()` |
| `src/validators/check-in.validators.ts` | Zod schema 加入 `custom_id: z.string().nullable()` |
| `src/controllers/user.controller.ts` | `getUserProfile` response 加入 `canonical` 欄位 |
| `openspec/specs/users.md` | 更新 profile endpoint response schema |

### 3.2 不變動的部分

- `GET /api/v1/users/profile/:identifier` 邏輯維持不變（已正確回傳 `customId`）
- `GET /api/v1/users/:id` 及 `GET /api/v1/users/custom-id/:customId` 維持不變
- Database schema 無變動

---

## 4. 測試計畫

### 4.1 Unit Tests

- [ ] `practice.service.ts`：回傳 practice 時，user 物件包含 `customId`（有設定時非 null）
- [ ] `practice.service.ts`：user 未設定 customId 時，`customId` 為 null
- [ ] `check-in.service.ts`：回傳 check-in 時，user 物件包含 `custom_id`
- [ ] `user.controller.ts`：`getUserProfile` 回傳 `canonical` 等於 customId（有設定時）
- [ ] `user.controller.ts`：`getUserProfile` 無 customId 時，`canonical` 等於 external_id

### 4.2 Integration Tests

- [ ] `GET /api/v1/practices` → 每個 practice 的 `user.customId` 符合該使用者的設定
- [ ] `GET /api/v1/practices/:id/check-ins` → 每個 check-in 的 `user.custom_id` 正確
- [ ] `GET /api/v1/users/profile/<uuid>` → response 包含 `canonical: "<customId>"`
- [ ] `GET /api/v1/users/profile/<customId>` → response 包含 `canonical: "<customId>"`

---

## 5. Acceptance Criteria

- [ ] 所有回傳 embedded user 的 API 皆包含 `customId`/`custom_id`
- [ ] `getUserProfile` response 包含 `canonical` 欄位
- [ ] 現有 E2E 測試不受影響
- [ ] OpenAPI schema 文件同步更新
