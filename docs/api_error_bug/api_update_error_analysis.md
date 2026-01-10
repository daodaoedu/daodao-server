# API 更新錯誤分析報告

**報告日期**: 2025-11-28
**分析分支**: dev
**系統版本**: v2.x (TypeScript 遷移中)
**分析狀態**: 🔴 發現多個關鍵錯誤

---

## 執行摘要

經過全面分析,發現 DaoDao 後端 API 更新功能存在多個關鍵問題,主要集中在:

1. **資料類型轉換錯誤** - Date 物件與字串轉換不一致
2. **API 端點缺失** - 缺少 `PUT /api/v1/users/me` 更新端點
3. **Schema 驗證失敗** - Zod 驗證與實際資料格式不符
4. **類型定義不一致** - OpenAPI 定義與實際實作不符
5. **Ideas API 路由問題** - `PUT /api/v1/ideas/:id` 路由缺失

**影響範圍**: 用戶資料更新功能完全無法使用 (測試通過率 0%)

---

## 1. 核心問題分析

### 問題 A: 資料類型轉換缺失 🔴 Critical

**錯誤類型**: Zod Schema Validation Error
**影響端點**: `GET /api/v1/users/me`, `GET /api/v1/users/:id`
**測試狀態**: ❌ 驗證失敗

#### 錯誤訊息

```javascript
ZodError: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "object",
    "path": ["birthDay"],
    "message": "Expected string, received object"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "null",
    "path": ["name"],
    "message": "Expected string, received null"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "null",
    "path": ["email"],
    "message": "Expected string, received null"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "object",
    "path": ["createdDate", "updatedDate"],
    "message": "Expected string, received object"
  }
]
```

#### 根本原因

**位置**: `src/services/user.service.ts:323-332, 346, 386-387`

資料庫返回的 Date 物件沒有正確轉換為 ISO 字串格式:

```typescript
// ✅ 服務層已實作格式化函數
const formatBirthDay = (date: Date | null | undefined): string | null => {
  if (!date) return null;
  return moment(date).format('YYYY-MM-DD');
};

const formatToISOString = (date: Date | null | undefined): string => {
  if (!date) return new Date().toISOString();
  return moment(date).toISOString();
};

// ❌ 但驗證層期望的是字串
// src/validators/user.validators.ts:520
birthDay: z.string().nullable()
  .describe("出生日期"),
```

**資料流程問題**:
```
資料庫 (Prisma) → Date 物件
              ↓
        服務層有格式化函數但未使用
              ↓
        控制器層直接傳遞
              ↓
        驗證層期望字串 → ❌ 驗證失敗
```

#### 受影響的欄位

| 欄位名稱 | 資料庫類型 | 預期格式 | 實際收到 | 狀態 |
|---------|-----------|---------|---------|------|
| `birthDay` | `Date` | `string` (YYYY-MM-DD) | `Date object` | ❌ |
| `createdDate` | `Date` | `string` (ISO 8601) | `Date object` | ❌ |
| `updatedDate` | `Date` | `string` (ISO 8601) | `Date object` | ❌ |
| `name` | `string` | `string` | `null` | ❌ |
| `email` | `string` | `string` | `null` | ❌ |

---

### 問題 B: 缺少用戶更新端點 🔴 Critical

**測試狀態**: ❌ 0% 通過率
**影響功能**: 用戶資料更新功能完全無法使用

#### 測試結果 (來源: TEST_RESULTS.md)

```bash
# ❌ 此端點不存在
PUT /api/v1/users/me
Authorization: Bearer <token>
Body: {
  "professionalField": "information_and_communication_technologies_icts",
  "personalSlogan": "終身學習者,用科技改變教育"
}

Response:
{
  "success": false,
  "error": {
    "code": "APP_ERROR",
    "message": "權限不足"
  }
}
```

#### 端點狀態對比

| 端點 | 狀態 | 功能 | 測試結果 |
|------|------|------|---------|
| `GET /api/v1/users/me` | ✅ 存在 | 獲取當前用戶 | ✅ 100% |
| `POST /api/v1/users` | ✅ 存在 | 創建用戶 | ✅ 100% |
| `PUT /api/v1/users/me` | ❌ **不存在** | 更新當前用戶 | ❌ **0%** |
| `PUT /api/v1/users/:id` | ⚠️ 權限問題 | 更新指定用戶 | ❌ 權限拒絕 |

#### 無法更新的欄位

以下新增欄位無法通過 API 更新:
- `professionalField` - 專業領域 (12 種選項)
- `personalSlogan` - 個人標語 (最多 200 字元)
- `referralSource` - 資訊來源
- `interestList` - 興趣清單 (最多 5 個)

#### 代碼分析

**路由文件**: `src/routes/user.routes.ts`

```typescript
// ✅ 控制器存在
userController.updateMe  // 在 user.controller.ts:136-150

// ❌ 但路由未註冊
router.put('/me', ..., userController.updateMe)  // 此行缺失
```

---

### 問題 C: OpenAPI 類型定義不一致 🟠 High

**影響範圍**: 前端 TypeScript 類型、API 文檔、自動化測試

#### 缺失的關鍵類型: contactList

**OpenAPI 定義** (當前):
```typescript
UserProfile: {
  id?: number;
  nickname?: string | null;
  gender?: "male" | "female" | "other" | null;
  // ... 其他基本欄位
  // ❌ 缺少 contactList 定義
}
```

**實際系統實作** (formattedUserResponseSchema):
```typescript
contactList: z.object({
  email: z.string().nullable(),
  photoURL: z.string().nullable(),
  isSubscribeEmail: z.boolean().nullable(),
  instagram: z.string().nullable(),
  discord: z.string().nullable(),
  line: z.string().nullable(),
  facebook: z.string().nullable()
}).nullable()
```

#### 欄位命名不一致

| 實際系統 | OpenAPI | 用途 | 影響 |
|---------|---------|------|------|
| `name` | `nickname` | 用戶姓名 | 混淆 |
| `_id` | `mongoId` | UUID | 類型不符 |
| `birthDay` | `birthDate` | 出生日期 | 欄位名不一致 |
| `createdDate` | `createdAt` | 創建時間 | 欄位名不一致 |
| `updatedDate` | `updatedAt` | 更新時間 | 欄位名不一致 |

---

### 問題 D: Nullable 欄位處理不當 🟡 Medium

**位置**: `src/validators/user.validators.ts:512-514`

#### 問題描述

某些必填欄位在資料庫中允許 NULL,但 Zod Schema 定義為不可為 null:

```typescript
// ❌ Schema 定義為必填
name: z.string(),              // 不允許 null
email: z.string().email(),     // 不允許 null

// ✅ 但資料庫實際返回
{
  name: null,    // 合法的 NULL 值
  email: null    // 合法的 NULL 值
}
```

---

### 問題 E: Ideas API 路由缺失 🔴 Critical

**錯誤日誌** (來源: 原始 demand.md 文件):

```
Error: 找不到路由: /api/v1/ideas/5934461f-a213-45ed-8b39-05db0d46ed6b
Method: PUT
StatusCode: 404
Timestamp: 2025-11-28 11:27:10
```

**請求內容**:
```json
{
  "id": "5934461f-a213-45ed-8b39-05db0d46ed6b",
  "content": "這是給janice看的留言",
  "tags": [],
  "resources": [{
    "name": "janice看這裡",
    "url": "https://eikaiwa.dmm.com/"
  }],
  "imageUrls": [],
  "videoUrls": []
}
```

**問題分析**:
- 前端嘗試更新 idea
- 路由 `PUT /api/v1/ideas/:id` 不存在
- 需要檢查 `src/routes/idea.routes.ts` 是否正確註冊
- 可能控制器已實作但路由未註冊 (與用戶更新問題相同模式)

---

## 2. 測試結果總覽

### 整體測試通過率

| 測試類別 | 通過 | 失敗 | 總計 | 通過率 |
|---------|------|------|------|--------|
| CustomId 功能 | 5 | 0 | 5 | ✅ 100% |
| 偏好設定 | 2 | 0 | 2 | ✅ 100% |
| 用戶查詢 | 3 | 0 | 3 | ✅ 100% |
| **用戶更新** | 0 | 1 | 1 | 🔴 **0%** |
| **Ideas 更新** | 0 | 1 | 1 | 🔴 **0%** |
| **總計** | **10** | **2** | **12** | **83.3%** |

### 詳細測試案例

#### ✅ 通過的功能

**CustomId 生命週期** (100% 通過):
```bash
✅ POST   /api/v1/users/me/custom-id          # 設置 CustomId
✅ GET    /api/v1/users/custom-id/check/:id   # 檢查可用性
✅ GET    /api/v1/users/custom-id/:customId   # 通過 ID 查詢
✅ GET    /api/v1/users/me                    # 獲取當前用戶
✅ DELETE /api/v1/users/me/custom-id          # 移除 CustomId
```

**偏好設定** (100% 通過):
```bash
✅ GET /api/v1/users/preferences/available  # 獲取可用偏好選項
✅ GET /api/v1/users/me/preferences         # 獲取用戶偏好
```

**用戶查詢** (100% 通過):
```bash
✅ GET /api/v1/users                        # 用戶列表 (分頁)
✅ GET /api/v1/users/me                     # 當前用戶
✅ GET /api/v1/users/:id                    # 指定用戶
```

#### ❌ 失敗的功能

**用戶資料更新** (0% 通過):
```bash
❌ PUT /api/v1/users/me
   錯誤: "權限不足" (實際上是端點不存在)

❌ PUT /api/v1/users/:id
   錯誤: "權限不足" (權限檢查過於嚴格)
```

**Ideas 更新** (0% 通過):
```bash
❌ PUT /api/v1/ideas/5934461f-a213-45ed-8b39-05db0d46ed6b
   錯誤: "找不到路由" (路由未註冊)
```

---

## 3. 受影響的 API 端點清單

### 用戶相關端點

| 端點 | 方法 | 狀態 | 問題描述 | 嚴重度 |
|------|------|------|---------|--------|
| `/api/v1/users/me` | GET | ⚠️ | Date 轉換錯誤 | 🔴 Critical |
| `/api/v1/users/me` | PUT | ❌ | 路由未註冊 | 🔴 Critical |
| `/api/v1/users/:id` | GET | ⚠️ | Date 轉換錯誤 | 🔴 Critical |
| `/api/v1/users/:id` | PUT | ⚠️ | 權限檢查過嚴 | 🟠 High |
| `/api/v1/users` | POST | ⚠️ | 驗證規則待確認 | 🟡 Medium |

### Ideas 相關端點

| 端點 | 方法 | 狀態 | 問題描述 | 嚴重度 |
|------|------|------|---------|--------|
| `/api/v1/ideas/:id` | PUT | ❌ | 路由未註冊 | 🔴 Critical |

---

## 4. 關鍵文件路徑

### 控制器
```
src/controllers/user.controller.ts
  ├─ line 54-83:   getMe (GET /users/me)
  ├─ line 89-102:  getUserById (GET /users/:id)
  ├─ line 109-130: createUser (POST /users)
  └─ line 136-150: updateMe (未註冊路由)

src/controllers/idea.controller.ts (需檢查)
  └─ updateIdea 控制器狀態未知
```

### 服務層
```
src/services/user.service.ts
  ├─ line 323-332: formatBirthDay, formatToISOString
  ├─ line 346:     getUserById
  └─ line 386-387: 日期轉換邏輯

src/services/professional-field.service.ts
  └─ 專業領域服務
```

### 驗證器
```
src/validators/user.validators.ts
  ├─ line 512-514: name, email nullable 問題
  ├─ line 520:     birthDay schema 定義
  └─ formattedUserResponseSchema

src/validators/me.validators.ts
  └─ /me 端點專用驗證器
```

### 路由
```
src/routes/user.routes.ts
  └─ 缺少: router.put('/me', ...)

src/routes/idea.routes.ts (需檢查)
  └─ 缺少: router.put('/:id', ...)

src/routes/me.routes.ts
  └─ /me 端點路由
```

### 文檔
```
docs/USER_API_SCHEMA_VALIDATION_ERRORS.md
docs/USER_API_TYPE_INCONSISTENCY_ANALYSIS.md
docs/API_TYPE_MISMATCH_ROOT_CAUSE_ANALYSIS.md
scripts/TEST_RESULTS.md
```

---

## 5. 修復優先級與行動方案

### Priority 1: Critical (立即修復) 🔴

#### A1. 添加缺失的 PUT /users/me 端點
**檔案**: `src/routes/user.routes.ts`

```typescript
router.put(
  '/me',
  authMiddleware,
  validateRequest(updateMeRequestSchema),
  asyncHandler(userController.updateMe)
);
```

---

#### A2. 修復 Ideas API 路由
**檔案**: `src/routes/idea.routes.ts`

**檢查項目**:
1. 確認 PUT /:id 路由是否存在
2. 確認控制器函數是否實作
3. 確認路由是否正確註冊到 Express app

---

#### A3. 修復 Date 類型轉換
**檔案**: `src/services/user.service.ts`

**推薦方案** - 服務層轉換:
```typescript
const transformUserResponse = (user: any) => ({
  ...user,
  birthDay: user.birthDay ? moment(user.birthDay).format('YYYY-MM-DD') : null,
  createdDate: user.createdDate ? moment(user.createdDate).toISOString() : null,
  updatedDate: user.updatedDate ? moment(user.updatedDate).toISOString() : null
});
```

---

#### A4. 修復 nullable 欄位定義
**檔案**: `src/validators/user.validators.ts:512-514`

```typescript
name: z.string().nullable(),
email: z.string().email().nullable(),
```

---

### Priority 2: High (短期修復) 🟠

#### B1. 更新 OpenAPI 定義
- 添加 contactList 類型定義
- 統一欄位命名
- 添加缺失的端點定義
- 重新生成類型: `pnpm run types:generate`

#### B2. 修復 PUT /users/:id 權限檢查
- 允許用戶更新自己的資料
- 只有管理員可以更新其他用戶

---

### Priority 3: Medium (中期改進) 🟡

#### C1. 標準化 API 響應格式
- 確保所有端點使用統一格式
- 驗證 timestamp 一致性

#### C2. 增強驗證錯誤訊息
- 提供更清晰的錯誤提示

#### C3. 補充測試案例
- 完整測試所有新欄位更新
- 邊界值測試
- 並發更新測試

---

## 6. 測試驗證計劃

### 修復後必須驗證

```bash
# 1. Date 轉換驗證
GET /api/v1/users/me
→ 確認日期欄位為字串格式

# 2. 用戶更新驗證
PUT /api/v1/users/me
Body: { "personalSlogan": "測試" }
→ 確認成功更新

# 3. Ideas 更新驗證
PUT /api/v1/ideas/:id
Body: { "content": "測試內容" }
→ 確認成功更新

# 4. 綜合測試
./scripts/test-user-update-v2.sh
./scripts/test-post-users-me.sh
./scripts/test-user-api-simple.js
```

---

## 7. 風險評估

| 風險項目 | 影響範圍 | 緩解措施 |
|---------|---------|---------|
| Date 轉換修復 | 所有用戶 API | 完整回歸測試 |
| 添加路由端點 | 用戶/Ideas 更新 | 嚴格權限檢查 |
| OpenAPI 修改 | 前端類型 | 版本化 + 向後兼容 |

---

## 8. 結論

### 主要發現

1. ✅ **底層設計良好** - 資料結構、服務層邏輯正確
2. 🔴 **路由註冊不完整** - 控制器已實作但路由未註冊
3. 🔴 **類型轉換疏漏** - Date 物件未正確轉換為字串
4. 🟠 **OpenAPI 脫節** - 文檔與實作不一致

### 建議行動

1. **立即修復** Priority 1 (預計 1-2 天)
2. **短期改進** Priority 2 (預計 1 週)
3. **建立** 自動化驗證機制

---

**報告產生者**: Claude Code
**分析日期**: 2025-11-28
**下次審查**: 修復完成後
