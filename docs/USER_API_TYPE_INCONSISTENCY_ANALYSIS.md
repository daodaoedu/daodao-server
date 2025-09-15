# User API 類型不一致性分析

## 問題概述

經過分析發現，目前系統中與用戶相關的 API 端點返回的用戶類型定義不一致，特別是：

1. **getApiV1UsersMe** (實際為 `/api/v1/me/profile`)
2. **postApiV1Users** (在當前 OpenAPI 中不存在)  
3. **putApiV1UsersId** (實際為 `/api/v1/me/profile` PUT)

## 當前 OpenAPI 定義分析

### 實際存在的用戶相關端點

```typescript
// 當前 OpenAPI 中的端點
"/api/v1/me/profile": {
  get: UserProfileResponse    // 取得個人資料
  put: UserProfileResponse    // 更新個人資料
}

"/api/v1/me/resources": {
  get: // 個人資源列表
}

"/api/v1/me/reviews": {
  get: // 個人評價列表
}
```

### 缺失的用戶端點

在當前 OpenAPI 定義中**缺少**以下重要的用戶管理端點：

1. `GET /api/v1/users/me` - 獲取當前用戶完整資訊
2. `POST /api/v1/users` - 創建新用戶
3. `GET /api/v1/users/:id` - 獲取指定用戶資訊
4. `PUT /api/v1/users/:id` - 更新用戶資訊
5. `DELETE /api/v1/users/me` - 刪除當前用戶
6. `DELETE /api/v1/users/:id` - 刪除指定用戶

## 類型定義差異

### 當前 OpenAPI 中的 UserProfile 類型

```typescript
UserProfile: {
  id?: number;              // 用戶 ID
  mongoId?: string;         // MongoDB ID
  nickname?: string | null; // 暱稱
  gender?: "male" | "female" | "other" | null;
  language?: string | null;
  educationStage?: "university" | "high" | "other" | null;
  tagList?: string[];
  isOpenLocation?: boolean | null;
  isOpenProfile?: boolean | null;
  birthDate?: string | null;  // 注意：這裡是 birthDate
  createdAt?: string;
  updatedAt?: string;
  // ❌ 缺少 contactList 類型定義
}
```

### 實際系統中的 FormattedUserResponse 類型

```typescript
formattedUserResponseSchema: {
  id: z.number().int();
  _id: z.string();           // UUID 格式
  name: z.string().nullable(); // ❌ OpenAPI 中叫 nickname
  email: z.string().email().nullable(); // ❌ OpenAPI 中沒有
  photoURL: z.string().url().nullable();
  gender: z.enum(['male', 'female', 'other']).nullable();
  birthDay: z.string().nullable(); // ❌ OpenAPI 中叫 birthDate
  educationStage: z.enum(['university', 'high', 'other']).nullable();
  isOpenLocation: z.boolean();
  isOpenProfile: z.boolean();
  isSubscribeEmail: z.boolean(); // ❌ OpenAPI 中沒有
  location: z.string().nullable();
  selfIntroduction: z.string().nullable();
  share: z.union([z.string(), z.array(z.string())]).nullable();
  wantToDoList: z.array(z.string()).nullable();
  tagList: z.array(z.string()).nullable();
  interestList: z.array(z.string()).nullable();
  preferences: z.record(...).nullable();
  role: z.number().int().nullable();
  roleList: z.array(z.string()).nullable();
  basicInfo: z.object({...}).nullable();
  
  // ✅ 這是 OpenAPI 中缺少的重要類型
  contactList: z.object({
    email: z.string().nullable(),
    photoURL: z.string().nullable(),
    isSubscribeEmail: z.boolean().nullable(),
    instagram: z.string().nullable(),
    discord: z.string().nullable(),
    line: z.string().nullable(),
    facebook: z.string().nullable()
  }).nullable();
  
  customId: z.string().nullable();
  customIdVerified: z.boolean().nullable();
  customIdCreatedAt: z.string().datetime().nullable();
  createdDate: z.string().datetime(); // ❌ OpenAPI 中叫 createdAt
  updatedDate: z.string().datetime(); // ❌ OpenAPI 中叫 updatedAt
}
```

## 主要問題分析

### 1. **端點對應關係混亂**

| 功能 | 實際路由定義 | OpenAPI 定義 | 前端期望 |
|------|-------------|-------------|----------|
| 獲取當前用戶 | `GET /api/users/me` | `GET /api/v1/me/profile` | `getApiV1UsersMe` |
| 創建用戶 | `POST /api/users` | ❌ 不存在 | `postApiV1Users` |
| 更新用戶 | `PUT /api/users/:id` | `PUT /api/v1/me/profile` | `putApiV1UsersId` |

### 2. **字段命名不一致**

| 實際系統 | OpenAPI | 說明 |
|---------|---------|------|
| `name` | `nickname` | 用戶姓名 vs 暱稱 |
| `_id` | `mongoId` | UUID vs MongoDB ID |
| `birthDay` | `birthDate` | 出生日期字段名 |
| `createdDate` | `createdAt` | 創建時間字段名 |
| `updatedDate` | `updatedAt` | 更新時間字段名 |

### 3. **缺少重要字段類型**

OpenAPI 中的 `UserProfile` 缺少以下重要字段：

- `email` - 電子郵件
- `photoURL` - 個人照片
- `isSubscribeEmail` - 是否訂閱郵件
- `location` - 地區
- `selfIntroduction` - 自我介紹
- `share` - 分享內容
- `wantToDoList` - 想做清單
- `interestList` - 興趣清單
- `preferences` - 個人偏好
- `roleList` - 角色清單
- `basicInfo` - 基本資訊
- **`contactList`** - 聯絡方式（這是最關鍵的缺失）
- `customId` - 自訂 ID
- `customIdVerified` - 自訂 ID 驗證狀態
- `customIdCreatedAt` - 自訂 ID 創建時間

### 4. **API 路由結構不統一**

```typescript
// 當前混合結構
"/api/v1/me/profile"     // 個人資料相關
"/api/users/me"          // 用戶管理相關（非 v1 prefix）
"/api/users/:id"         // 用戶管理相關（非 v1 prefix）
```

## 修復建議

### 階段一：OpenAPI 定義修復

1. **添加缺少的用戶管理端點**
   ```yaml
   /api/v1/users/me:
     get: # 獲取當前用戶完整資訊
   /api/v1/users:
     post: # 創建新用戶
   /api/v1/users/{id}:
     get: # 獲取指定用戶
     put: # 更新用戶
     delete: # 刪除用戶
   ```

2. **擴展 UserProfile 類型定義**
   - 添加所有缺少的字段，特別是 `contactList`
   - 統一字段命名規範
   - 確保與實際系統類型一致

### 階段二：路由結構統一

1. **將用戶相關路由統一到 `/api/v1` 下**
2. **保持向後兼容性同時逐步遷移**

### 階段三：類型系統統一

1. **確保 Zod schema、OpenAPI 定義和前端類型一致**
2. **建立自動化驗證機制**

## 影響範圍

### 前端影響
- TypeScript 類型不完整，缺少 `contactList` 等重要字段
- API 調用路徑與實際後端不符
- 數據驗證可能失敗

### 後端影響
- OpenAPI 文檔與實際實現不符
- 響應驗證失敗
- API 文檔誤導開發者

### 開發影響
- 前後端聯調困難
- 類型安全性降低
- 維護成本增加

## 立即行動項目

1. **緊急修復**：在 OpenAPI 中添加 `contactList` 類型定義
2. **路由對應**：確認實際路由與前端期望的對應關係
3. **類型統一**：統一字段命名和數據格式
4. **文檔更新**：更新 API 文檔反映真實情況