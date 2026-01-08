# 用戶資料欄位調整執行計畫

## 概述

根據 `user_new_spec.md` 的需求，本文檔提供完整的執行計畫。**專案中已有完整的用戶管理 API 架構**，本次主要工作是在現有功能上**新增對新欄位的支援**。

## 現況分析

### ✅ 已存在的功能
專案中已完整實現以下功能：
- ✅ 用戶 CRUD 操作 (createUser, updateUser, getUser, deleteUser)
- ✅ Custom ID 管理 (checkCustomIdAvailability, setCustomId, removeCustomId, getUserByCustomId)
- ✅ 用戶偏好設定管理 (getUserPreferences, updateUserPreferences)
- ✅ 完整的 Controller、Service、Routes 架構
- ✅ Zod 驗證規則
- ✅ Swagger 文檔

### 🔧 需要調整的部分
需要在現有功能上新增以下欄位的支援：
1. **professional_field** (專業領域) - ESCO Knowledge & Skills
2. **personal_slogan** (個人標語) - 用一句話介紹自己
3. **referral_source** (資訊來源) - 如何得知島島阿學
4. **interestList** (興趣清單) - 更新為與 categories.majorCategory 對應的新分類

---

## 需求總覽

### 1. 新增專業領域欄位 (ESCO Knowledge & Skills)
- **欄位名稱**: `professional_field`
- **資料類型**: String (VARCHAR 100, 單選)
- **用途**: 儲存使用者的專業領域
- **值格式**: snake_case (如: `information_and_communication_technologies_icts`)

### 2. 更新興趣清單 (Interest List)
- **現有欄位**: `interestList` (已在 FormattedUserResponse 中存在，但為 null)
- **需求**: 實作與 `categories.majorCategory` 對應的新分類
- **API 格式**: 接收和返回 category **name** (string)，例如 `"education_learning"`
- **資料庫格式**: 儲存 category **ID** (number) 到 `user_interests` 表
- **轉換層**: 在 service 層進行 name ↔ ID 的轉換（與 resource 相同）
- **資料來源**: 從 `categories` 表中查詢 `parent_id IS NULL` 的頂層分類

### 3. 新增個人標語欄位
- **欄位名稱**: `personal_slogan`
- **資料類型**: String (VARCHAR 200)
- **用途**: 用一句話介紹自己
- **限制**: 最多 200 字元

### 4. 新增資訊來源欄位
- **欄位名稱**: `referral_source`
- **資料類型**: String (VARCHAR 100)
- **用途**: 記錄使用者如何得知島島阿學
- **預設選項**: Instagram, Facebook, Discord, LinkedIn, 朋友介紹, 其他

### 5. Custom ID 功能 (已存在)
- **現有欄位**: `custom_id`, `custom_id_verified`, `custom_id_created_at`
- **現有 API**:
  - `GET /api/users/custom-id/check/:customId` - 檢查可用性
  - `POST /api/users/me/custom-id` - 設置 Custom ID
  - `DELETE /api/users/me/custom-id` - 移除 Custom ID
  - `GET /api/users/custom-id/:customId` - 透過 Custom ID 查詢用戶
- **狀態**: ✅ 無需修改

---

## 資料庫結構變更

### 手動執行 SQL 腳本

**注意**: 以下 SQL 腳本需要手動執行到資料庫，執行完成後使用 `npx prisma db pull` 同步 schema。

#### 步驟 1: 新增 users 表欄位

```sql
-- 1. 新增欄位
ALTER TABLE users
ADD COLUMN professional_field VARCHAR(100),
ADD COLUMN personal_slogan VARCHAR(200),
ADD COLUMN referral_source VARCHAR(100);

-- 2. 新增索引 (提升查詢效能)
CREATE INDEX idx_users_professional_field ON users(professional_field);

-- 3. 新增檢查約束 (確保資料格式正確)
ALTER TABLE users
ADD CONSTRAINT chk_professional_field_valid
CHECK (
  professional_field IS NULL OR
  professional_field IN (
    'information_and_communication_technologies_icts',
    'business_administration_and_law',
    'arts_and_humanities',
    'natural_sciences_mathematics_and_statistics',
    'engineering_manufacturing_and_construction',
    'health_and_welfare',
    'education',
    'social_sciences_journalism_and_information',
    'language_skills_and_knowledge',
    'services',
    'agriculture_forestry_fisheries_and_veterinary',
    'others'
  )
);

-- 4. 新增標語長度約束
ALTER TABLE users
ADD CONSTRAINT chk_personal_slogan_length
CHECK (personal_slogan IS NULL OR LENGTH(personal_slogan) <= 200);

-- 5. 新增資訊來源長度約束
ALTER TABLE users
ADD CONSTRAINT chk_referral_source_length
CHECK (referral_source IS NULL OR LENGTH(referral_source) <= 100);
```

#### 步驟 2: 新增 user_interests 表

```sql
-- 新增 user_interests 表
CREATE TABLE user_interests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT user_interests_unique UNIQUE (user_id, category_id)
);

-- 新增索引提升查詢效能
CREATE INDEX idx_user_interests_user_id ON user_interests(user_id);
CREATE INDEX idx_user_interests_category_id ON user_interests(category_id);
```

### 執行完 SQL 後的 Prisma 同步步驟

```bash
# 1. 先手動執行上面的 SQL 腳本到資料庫

# 2. 使用 Prisma introspect 從資料庫同步 schema
npx prisma db pull

# 3. 檢查 prisma/schema.prisma 檔案，確認新增的欄位和表都正確

# 4. 生成 Prisma Client
pnpm run prisma:generate

# 注意: 不使用 prisma migrate，以手動 SQL 執行為準
```

---

## TypeScript 型別定義更新

### 檔案: `src/types/user.types.ts`

**需要新增以下常數和型別定義：**

```typescript
// 1. ESCO 專業領域常數定義 (使用 snake_case 格式，對應 categories 命名規則)
export const PROFESSIONAL_FIELDS = [
  'information_and_communication_technologies_icts',  // 資訊與通訊技術
  'business_administration_and_law',                  // 商業、行政與法律
  'arts_and_humanities',                              // 藝術與人文
  'natural_sciences_mathematics_and_statistics',      // 自然科學、數學與統計
  'engineering_manufacturing_and_construction',       // 工程、製造與營造
  'health_and_welfare',                               // 健康與福祉
  'education',                                        // 教育
  'social_sciences_journalism_and_information',       // 社會科學、新聞與資訊
  'language_skills_and_knowledge',                    // 語言技能與知識
  'services',                                         // 服務
  'agriculture_forestry_fisheries_and_veterinary',    // 農業、林業、漁業與獸醫
  'others',                                           // 其他
] as const;

export type ProfessionalField = typeof PROFESSIONAL_FIELDS[number];

// 2. 興趣分類相關型別定義
// 注意: API 層使用 category name (string)，資料庫層儲存 category ID (number)
// 這與 resource 的 majorCategory/subCategory 設計相同

// 3. 資訊來源選項 (建議前端下拉選單)
export const REFERRAL_SOURCES = [
  'instagram',            // Instagram
  'facebook',             // Facebook
  'discord',              // Discord
  'linkedin',             // LinkedIn
  'friend_referral',      // 朋友介紹
  'others',               // 其他
] as const;

export type ReferralSource = typeof REFERRAL_SOURCES[number];
```

**需要更新現有介面以包含新欄位：**

```typescript
// 4. 更新 CreateUserRequest 介面
export interface CreateUserRequest {
  // ... 現有欄位保持不變 ...
  gender?: string;
  birthDate?: Date | string;
  contactList?: {
    instagram?: string;
    discord?: string;
    line?: string;
    facebook?: string;
  };
  educationStage?: string;
  isOpenLocation?: boolean;
  isOpenProfile?: boolean;
  isSubscribeEmail?: boolean;
  location?: string;
  roleList?: string[];
  selfIntroduction?: string;
  share?: string | string[];
  wantToDoList?: string[];
  tagList?: string[];
  interestList?: string[];  // category names 陣列 (例如: ["education_learning", "nature_environment"])
  preferences?: Record<string, string[]>;
  isSendEmail?: boolean;

  // 新增欄位
  professionalField?: ProfessionalField;
  personalSlogan?: string;
  referralSource?: ReferralSource | string;  // 允許自定義輸入
}

// 5. 更新 UpdateUserRequest 介面
export interface UpdateUserRequest {
  // ... 現有欄位保持不變 ...
  name?: string;
  photoUrl?: string;
  gender?: string;
  birthDate?: Date | string;
  contactList?: {
    instagram?: string;
    discord?: string;
    line?: string;
    facebook?: string;
  };
  educationStage?: string;
  isOpenLocation?: boolean;
  isOpenProfile?: boolean;
  isSubscribeEmail?: boolean;
  selfIntroduction?: string;
  share?: string | string[];
  wantToDoList?: string[];
  tagList?: string[];
  roleList?: string[];
  interestList?: string[];  // category names 陣列 (例如: ["education_learning", "nature_environment"])
  preferences?: Record<string, string[]>;
  customId?: string;

  // 新增欄位
  professionalField?: ProfessionalField;
  personalSlogan?: string;
  referralSource?: ReferralSource | string;
}

// 6. 更新 FormattedUserResponse 介面
export interface FormattedUserResponse {
  // ... 現有欄位保持不變 ...
  id: string;
  name: string | null;
  gender: 'male' | 'female' | 'other' | null;
  email: string | null;
  photoURL: string | null;
  birthDay: string | null;
  isOpenLocation: boolean;
  isOpenProfile: boolean;
  isSubscribeEmail: boolean;
  role: number | null;
  location: string | null;
  tagList: string[] | null;
  wantToDoList: string[] | null;
  educationStage: 'university' | 'high' | 'other' | null;
  selfIntroduction: string | null;
  share: string | string[] | null;
  interestList: string[] | null;  // 返回 category names 陣列 (例如: ["education_learning", "nature_environment"])
  preferences: Record<string, Array<{ name: string; value: string }>> | null;
  contactList: {
    email: string | null;
    photoURL: string | null;
    isSubscribeEmail: boolean | null;
    instagram: string | null;
    discord: string | null;
    line: string | null;
    facebook: string | null;
  } | null;
  basicInfo: {
    selfIntroduction: string | null;
    shareList: string | string[] | null;
    wantToDoList: string[] | null;
  } | null;
  roleList: string[] | null;
  customId: string | null;
  customIdVerified: boolean | null;
  customIdCreatedAt: string | null;

  // 新增欄位
  professionalField: ProfessionalField | null;
  personalSlogan: string | null;
  referralSource: ReferralSource | string | null;

  createdDate: string;
  updatedDate: string;
}
```

---

## Zod 驗證規則更新

### 檔案: `src/validators/user.validators.ts`

**需要在現有驗證 schema 中新增以下規則：**

```typescript
import { z } from 'zod';
import { PROFESSIONAL_FIELDS, REFERRAL_SOURCES } from '@types/user.types';

// 1. 專業領域驗證 schema
const professionalFieldSchema = z.enum(PROFESSIONAL_FIELDS).optional();

// 2. 興趣清單驗證 schema (接受 category name 陣列)
const interestListSchema = z
  .array(z.string())
  .max(5, '最多選擇 5 個興趣')
  .optional();

// 3. 個人標語驗證 schema
const personalSloganSchema = z
  .string()
  .min(1, '標語不可為空')
  .max(200, '標語長度不可超過 200 字')
  .optional();

// 4. 資訊來源驗證 schema
const referralSourceSchema = z
  .union([
    z.enum(REFERRAL_SOURCES),
    z.string().min(1).max(100), // 允許自定義輸入
  ])
  .optional();

// 5. 更新現有的 createUserSchema (在現有 schema 中新增欄位)
export const createUserSchema = z.object({
  // ... 現有欄位驗證保持不變 ...
  gender: z.enum(['male', 'female', 'other']).optional(),
  birthDate: z.coerce.date().optional(),
  contactList: z.object({
    instagram: z.string().max(255).optional(),
    discord: z.string().max(255).optional(),
    line: z.string().max(255).optional(),
    facebook: z.string().max(255).optional(),
  }).optional(),
  educationStage: z.enum(['university', 'high', 'other']).optional(),
  isOpenLocation: z.boolean().optional(),
  isOpenProfile: z.boolean().optional(),
  isSubscribeEmail: z.boolean().optional(),
  location: z.string().optional(),
  roleList: z.array(z.string()).optional(),
  selfIntroduction: z.string().optional(),
  share: z.union([z.string(), z.array(z.string())]).optional(),
  wantToDoList: z.array(z.string()).optional(),
  tagList: z.array(z.string()).optional(),
  interestList: interestListSchema,  // 更新驗證規則
  preferences: z.record(z.array(z.string())).optional(),
  isSendEmail: z.boolean().optional(),

  // 新增欄位驗證
  professionalField: professionalFieldSchema,
  personalSlogan: personalSloganSchema,
  referralSource: referralSourceSchema,
}).openapi('CreateUserRequest', {
  example: {
    gender: 'male',
    birthDate: '1990-01-01',
    educationStage: 'university',
    interestList: ['information_and_computer_science', 'education_learning'],  // category names
    professionalField: 'information_and_communication_technologies_icts',
    personalSlogan: '終身學習者，熱愛程式設計與教育',
    referralSource: 'friend_referral',
  },
});

// 6. 更新現有的 updateUserSchema (在現有 schema 中新增欄位)
export const updateUserSchema = z.object({
  // ... 現有欄位驗證保持不變 ...
  name: z.string().max(255).optional(),
  photoUrl: z.string().url().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  birthDate: z.coerce.date().optional(),
  contactList: z.object({
    instagram: z.string().max(255).optional(),
    discord: z.string().max(255).optional(),
    line: z.string().max(255).optional(),
    facebook: z.string().max(255).optional(),
  }).optional(),
  educationStage: z.enum(['university', 'high', 'other']).optional(),
  isOpenLocation: z.boolean().optional(),
  isOpenProfile: z.boolean().optional(),
  isSubscribeEmail: z.boolean().optional(),
  selfIntroduction: z.string().optional(),
  share: z.union([z.string(), z.array(z.string())]).optional(),
  wantToDoList: z.array(z.string()).optional(),
  tagList: z.array(z.string()).optional(),
  roleList: z.array(z.string()).optional(),
  interestList: interestListSchema,  // 更新驗證規則
  preferences: z.record(z.array(z.string())).optional(),
  customId: z.string()
    .min(3, 'Custom ID 至少 3 個字元')
    .max(50, 'Custom ID 不可超過 50 個字元')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Custom ID 只能包含英數字、底線和連字符')
    .optional(),

  // 新增欄位驗證
  professionalField: professionalFieldSchema,
  personalSlogan: personalSloganSchema,
  referralSource: referralSourceSchema,
}).openapi('UpdateUserRequest', {
  example: {
    name: '王小明',
    interestList: ['information_and_computer_science', 'education_and_learning'],
    professionalField: 'education',
    personalSlogan: '用教育改變世界',
    referralSource: 'instagram',
  },
});
```

---

## Service Layer 更新

### 檔案: `src/services/user.service.ts`

**現有函數需要更新以支援新欄位：**

#### 1. 更新 `createUser` 函數

在現有的 `createUser` 函數中，需要在創建用戶時處理新欄位：

```typescript
const createUser = async (userData: CreateUserRequest, tempUserId: string): Promise<ApiSuccessResponse<{ user: FormattedUserResponse; token: string }>> => {
  return await prisma.$transaction(async (tx) => {
    const {
      gender,
      birthDate,
      contactList,
      educationStage,
      isOpenLocation,
      isOpenProfile,
      isSubscribeEmail,
      location: areaCode,
      roleList,
      selfIntroduction,
      share,
      wantToDoList,
      tagList,
      preferences,
      isSendEmail,
      // 新增欄位
      professionalField,
      personalSlogan,
      referralSource,
      interestList
    } = userData;

    // ... 現有的臨時用戶查找、地區處理等邏輯保持不變 ...

    // 創建用戶時加入新欄位
    const newUser = await tx.users.create({
      data: {
        mongo_id: tempUser.id.toString(),
        nickname: tempUser.name,
        gender: gender as 'male' | 'female' | 'other' | undefined,
        education_stage: (educationStage as 'university' | 'high' | 'other') || 'other',
        tag_list: [],
        contact_id: contact.id,
        is_open_location: isOpenLocation ?? true,
        location_id: locationId,
        role_id: 2,
        is_open_profile: isOpenProfile ?? true,
        birth_date: birthDate ? new Date(birthDate) : null,
        basic_info_id: basicInfo.id,

        // 新增欄位
        professional_field: professionalField,
        personal_slogan: personalSlogan,
        referral_source: referralSource,
      }
    });

    // ... 後續處理保持不變 ...

    // 處理 interestList (需要新增儲存邏輯，可能使用 entity_tags 或新表)
    if (interestList && interestList.length > 0) {
      // TODO: 實作 interestList 儲存邏輯
      // 選項1: 使用 entity_tags 表
      // 選項2: 新增 user_interests 表
      // 選項3: 儲存在 users 表的 JSON 欄位
    }

    // ... 返回結果 ...
  });
};
```

#### 2. 更新 `updateUser` 函數

在現有的 `updateUser` 函數中，需要更新用戶時處理新欄位：

```typescript
const updateUser = async (externalId: string, userData: UpdateUserRequest): Promise<ApiSuccessResponse<FormattedUserResponse>> => {
  return await prisma.$transaction(async (tx) => {
    const user = await tx.users.findUnique({
      where: { external_id: externalId },
      include: { contacts: true, basic_info: true }
    });

    if (!user) {
      throw new NotFoundError('用戶不存在');
    }

    const {
      name: nickname,
      photoUrl,
      gender,
      birthDate,
      contactList,
      educationStage,
      isOpenLocation,
      isOpenProfile,
      isSubscribeEmail,
      selfIntroduction,
      share,
      wantToDoList,
      tagList,
      roleList,
      preferences,
      // 新增欄位
      professionalField,
      personalSlogan,
      referralSource,
      interestList
    } = userData;

    // ... 現有的 contacts 和 basic_info 更新邏輯保持不變 ...

    // 更新用戶主表時加入新欄位
    await tx.users.update({
      where: { id: user.id },
      data: {
        nickname,
        gender: gender as 'male' | 'female' | 'other' | undefined,
        tag_list: [],
        education_stage: educationStage as 'university' | 'high' | 'other' | undefined,
        is_open_location: isOpenLocation,
        is_open_profile: isOpenProfile,
        birth_date: birthDate ? new Date(birthDate) : undefined,
        updated_at: new Date(),

        // 新增欄位
        professional_field: professionalField,
        personal_slogan: personalSlogan,
        referral_source: referralSource,
      }
    });

    // 處理 interestList 更新
    if (interestList !== undefined) {
      // TODO: 實作 interestList 更新邏輯
    }

    // ... 後續處理保持不變 ...
  });
};
```

#### 3. 更新 `formatUserResponse` 函數

在現有的 `formatUserResponse` 函數中，需要包含新欄位：

```typescript
const formatUserResponse = async (user: PrismaUserWithRelations): Promise<FormattedUserResponse> => {
  // ... 現有的格式化邏輯保持不變 ...

  return {
    id: user.external_id || '',
    name: user.nickname || null,
    gender: (user.gender as 'male' | 'female' | 'other') || null,
    email: user.contacts?.email || null,
    photoURL: user.contacts?.photo_url || null,
    birthDay: formatBirthDay(user.birth_date),
    isOpenLocation: user.is_open_location ?? false,
    isOpenProfile: user.is_open_profile ?? false,
    isSubscribeEmail: user.contacts?.is_subscribe_email ?? false,
    role: user.roles?.id || null,
    location: user.location?.city?.name || null,
    tagList: await getUserTags(user.id) || null,
    wantToDoList: user.basic_info?.want_to_do_list ?
      user.basic_info.want_to_do_list.map(item => String(item)) : null,
    educationStage: (user.education_stage as 'university' | 'high' | 'other') || null,
    selfIntroduction: user.basic_info?.self_introduction || null,
    share: user.basic_info?.share_list || null,
    interestList: await getUserInterests(user.id) || null,  // 實作 getUserInterests 函數
    preferences: preferences || null,
    contactList: { /* ... */ },
    basicInfo: { /* ... */ },
    roleList: user.user_positions?.map((up) => up.position.name) || null,
    customId: user.custom_id || null,
    customIdVerified: user.custom_id_verified || null,
    customIdCreatedAt: user.custom_id_created_at ?
      moment(user.custom_id_created_at).toISOString() : null,

    // 新增欄位
    professionalField: user.professional_field as ProfessionalField || null,
    personalSlogan: user.personal_slogan || null,
    referralSource: user.referral_source || null,

    createdDate: formatToISOString(user.created_at),
    updatedDate: formatToISOString(user.updated_at)
  };
};

// 需要新增的輔助函數
const getUserInterests = async (userId: number): Promise<InterestCategory[] | null> => {
  // TODO: 實作從資料庫讀取 interestList 的邏輯
  // 選項1: 從 entity_tags 表讀取
  // 選項2: 從 user_interests 表讀取
  // 選項3: 從 users 表的 JSON 欄位讀取
  return null;
};
```

---

## 現有 API 端點 (無需修改路由)

專案中已有完整的路由配置，**無需新增路由**，只需確保現有端點支援新欄位：

### 1. 創建用戶
- **端點**: `POST /api/users`
- **現有路由**: ✅ 已存在
- **需要更新**: Service 層和驗證規則支援新欄位

### 2. 更新用戶
- **端點**: `PUT /api/users/:id`
- **現有路由**: ✅ 已存在
- **需要更新**: Service 層和驗證規則支援新欄位

### 3. 查詢用戶
- **端點**: `GET /api/users/:id`
- **現有路由**: ✅ 已存在
- **需要更新**: Service 層返回新欄位

### 4. Custom ID 相關 (已完整實現)
- **端點**: `GET /api/users/custom-id/check/:customId` - 檢查可用性
- **端點**: `POST /api/users/me/custom-id` - 設置 Custom ID
- **端點**: `DELETE /api/users/me/custom-id` - 移除 Custom ID
- **端點**: `GET /api/users/custom-id/:customId` - 透過 Custom ID 查詢
- **狀態**: ✅ 無需修改

---

## 實作步驟清單

### Phase 1: 資料庫準備 (第 1-2 天)
- [ ] 1.1 手動執行 SQL 腳本：新增 `users` 表的 3 個欄位 (professional_field, personal_slogan, referral_source)
- [ ] 1.2 手動執行 SQL 腳本：新增 `user_interests` 表及其索引
- [ ] 1.3 驗證資料庫變更成功 (使用 SQL 查詢確認)
- [ ] 1.4 執行 `npx prisma db pull` 從資料庫同步 schema
- [ ] 1.5 檢查 `prisma/schema.prisma` 確認欄位和關聯正確
- [ ] 1.6 執行 `pnpm run prisma:generate` 生成 Prisma Client
- [ ] 1.7 測試資料庫約束 (INSERT/UPDATE 測試)

### Phase 2: TypeScript 型別定義 (第 3 天)
- [ ] 2.1 更新 `src/types/user.types.ts`
  - [ ] 新增 `PROFESSIONAL_FIELDS` 常數 (snake_case 格式)
  - [ ] 新增 `REFERRAL_SOURCES` 常數
  - [ ] 更新 `CreateUserRequest` 介面 (新增 professionalField, personalSlogan, referralSource, interestList)
  - [ ] 更新 `UpdateUserRequest` 介面 (新增 professionalField, personalSlogan, referralSource, interestList)
  - [ ] 更新 `FormattedUserResponse` 介面 (新增 professionalField, personalSlogan, referralSource, interestList)
- [ ] 2.2 執行 `pnpm run typecheck` 確保型別正確

### Phase 3: Zod 驗證規則 (第 3 天)
- [ ] 3.1 更新 `src/validators/user.validators.ts`
  - [ ] 新增 `professionalFieldSchema` 驗證規則
  - [ ] 新增 `interestListSchema` 驗證規則 (接受 category name 字串陣列)
  - [ ] 新增 `personalSloganSchema` 驗證規則
  - [ ] 新增 `referralSourceSchema` 驗證規則
  - [ ] 更新 `createUserSchema` (加入新欄位驗證)
  - [ ] 更新 `updateUserSchema` (加入新欄位驗證)
- [ ] 3.2 編寫單元測試驗證 Zod schemas

### Phase 4: Service Layer (第 4-5 天)
- [ ] 4.1 更新 `src/services/user.service.ts`
  - [ ] 新增 `getCategoryIdByName()` 輔助函數 - 轉換 category name → ID
  - [ ] 新增 `setUserInterests()` 函數 - 儲存 interestList (接收 string[]，轉換為 ID 儲存)
  - [ ] 新增 `getUserInterests()` 函數 - 讀取 interestList (從 DB 讀取 ID，轉換為 name 返回)
  - [ ] 更新 `createUser()` 函數 - 在創建時儲存新欄位 (professional_field, personal_slogan, referral_source)
  - [ ] 更新 `createUser()` 函數 - 呼叫 setUserInterests() 處理 interestList
  - [ ] 更新 `updateUser()` 函數 - 在更新時處理新欄位
  - [ ] 更新 `updateUser()` 函數 - 呼叫 setUserInterests() 處理 interestList
  - [ ] 更新 `formatUserResponse()` 函數 - 呼叫 getUserInterests() 包含 interestList
  - [ ] 更新 `formatUserResponse()` 函數 - 包含其他 3 個新欄位
- [ ] 4.2 編寫單元測試

### Phase 5: Swagger 文檔更新 (第 6 天)
- [ ] 5.1 更新 OpenAPI schema 定義
  - [ ] 更新 CreateUserRequest schema (包含新欄位範例)
  - [ ] 更新 UpdateUserRequest schema (包含新欄位範例)
  - [ ] 更新 FormattedUserResponse schema (包含新欄位)
- [ ] 5.2 驗證 Swagger UI 顯示正確 (`/api-docs`)

### Phase 6: 整合測試 (第 7-8 天)
- [ ] 6.1 編寫 E2E 測試
  - [ ] 測試創建用戶包含新欄位
  - [ ] 測試更新用戶新欄位
  - [ ] 測試查詢用戶返回新欄位
  - [ ] 測試新欄位驗證規則
  - [ ] 測試邊界條件 (最大長度、特殊字符等)
- [ ] 6.2 執行所有測試 `pnpm test`
- [ ] 6.3 執行型別檢查 `pnpm run typecheck`
- [ ] 6.4 執行 lint 檢查 `pnpm run lint`

### Phase 7: 前端整合準備 (第 9 天)
- [ ] 7.1 準備前端整合文檔
  - [ ] 整理 API 端點清單 (使用現有端點)
  - [ ] 提供請求/回應範例 (包含新欄位)
  - [ ] 說明錯誤碼和驗證規則
  - [ ] 提供前端選項資料 (PROFESSIONAL_FIELDS, INTEREST_CATEGORIES, REFERRAL_SOURCES)
- [ ] 7.2 準備測試資料和 Postman collection

### Phase 8: 部署與監控 (第 10 天)
- [ ] 8.1 在開發環境測試完整流程
- [ ] 8.2 準備資料庫遷移腳本 (生產環境)
- [ ] 8.3 更新環境變數文檔 (如需要)
- [ ] 8.4 部署到 staging 環境
- [ ] 8.5 執行 smoke tests
- [ ] 8.6 部署到 production 環境
- [ ] 8.7 監控錯誤日誌和效能指標

---

## 前端整合指南

### 1. API 端點 (使用現有端點)

**創建用戶**
```
POST /api/users
Authorization: Bearer {token}
Content-Type: application/json

{
  "gender": "male",
  "birthDate": "1990-01-01",
  "educationStage": "university",
  "professionalField": "information_and_communication_technologies_icts",
  "personalSlogan": "終身學習者，熱愛程式設計與教育",
  "referralSource": "friend_referral",
  "interestList": ["information_and_computer_science", "math_and_logic"],
  "contactList": {
    "instagram": "@username",
    "discord": "username#1234"
  }
}
```

**更新用戶**
```
PUT /api/users/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "王小明",
  "professionalField": "education",
  "personalSlogan": "用教育改變世界",
  "referralSource": "instagram",
  "interestList": ["education_and_learning", "social_innovation_and_sustainability"]
}
```

### 2. 前端 UI 元件建議

#### 專業領域選擇器
```typescript
<Select
  label="您的專業領域"
  options={[
    { value: 'information_and_communication_technologies_icts', label: '資訊與通訊技術' },
    { value: 'business_administration_and_law', label: '商業、行政與法律' },
    { value: 'arts_and_humanities', label: '藝術與人文' },
    { value: 'natural_sciences_mathematics_and_statistics', label: '自然科學、數學與統計' },
    { value: 'engineering_manufacturing_and_construction', label: '工程、製造與營造' },
    { value: 'health_and_welfare', label: '健康與福祉' },
    { value: 'education', label: '教育' },
    { value: 'social_sciences_journalism_and_information', label: '社會科學、新聞與資訊' },
    { value: 'language_skills_and_knowledge', label: '語言技能與知識' },
    { value: 'services', label: '服務' },
    { value: 'agriculture_forestry_fisheries_and_veterinary', label: '農業、林業、漁業與獸醫' },
    { value: 'others', label: '其他' },
  ]}
  onChange={(value) => setFormData({ ...formData, professionalField: value })}
/>
```

#### 個人標語輸入
```typescript
<TextInput
  label="個人標語"
  placeholder="用一句話介紹自己 (最多 200 字)"
  maxLength={200}
  value={formData.personalSlogan}
  onChange={(e) => setFormData({ ...formData, personalSlogan: e.target.value })}
  showCharacterCount
/>
```

#### 資訊來源選擇器
```typescript
<Select
  label="您如何得知島島阿學?"
  options={[
    { value: 'instagram', label: 'Instagram' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'discord', label: 'Discord' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'friend_referral', label: '朋友介紹' },
    { value: 'others', label: '其他' },
  ]}
  onChange={(value) => setFormData({ ...formData, referralSource: value })}
/>
```

#### 興趣清單多選器
```typescript
<MultiSelect
  label="興趣清單 (最多 5 個)"
  options={[
    { value: 'nature_and_environment', label: '自然與環境' },
    { value: 'math_and_logic', label: '數學與邏輯' },
    { value: 'information_and_computer_science', label: '資訊與電腦科學' },
    { value: 'languages', label: '語言' },
    { value: 'humanities_history_and_geography', label: '人文、歷史與地理' },
    { value: 'sociology_and_psychology', label: '社會學與心理學' },
    { value: 'education_and_learning', label: '教育與學習' },
    { value: 'business_management_and_finance', label: '商業管理與財務' },
    { value: 'arts_and_design', label: '藝術與設計' },
    { value: 'lifestyle_and_taste', label: '生活風格與品味' },
    { value: 'social_innovation_and_sustainability', label: '社會創新與永續發展' },
    { value: 'medicine_and_sports', label: '醫學與運動' },
    { value: 'personal_development', label: '個人發展' },
    { value: 'others', label: '其他' },
  ]}
  maxSelections={5}
  value={formData.interestList}
  onChange={(values) => setFormData({ ...formData, interestList: values })}
/>
```

### 3. 錯誤處理

```typescript
const handleUpdateUser = async (userData: UpdateUserRequest) => {
  try {
    const response = await fetch(`/api/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
    });

    const result = await response.json();

    if (!result.success) {
      // 處理驗證錯誤
      if (result.error.code === 'VALIDATION_ERROR') {
        // 顯示具體的欄位錯誤
        console.error('驗證錯誤:', result.error.details);
      }
      return;
    }

    // 成功處理
    console.log('用戶資料已更新:', result.data);
  } catch (error) {
    console.error('網路錯誤:', error);
  }
};
```

---

## 資料遷移腳本

### 舊資料遷移 (如需要)

```sql
-- 如果需要從現有資料推測專業領域
UPDATE users
SET professional_field = CASE
  WHEN '程式設計' = ANY(tag_list) THEN 'information_and_communication_technologies_icts'
  WHEN '教育' = ANY(tag_list) THEN 'education'
  WHEN '商業' = ANY(tag_list) THEN 'business_administration_and_law'
  ELSE NULL
END
WHERE professional_field IS NULL;

-- 設置預設資訊來源 (針對現有用戶)
UPDATE users
SET referral_source = 'others'
WHERE referral_source IS NULL AND created_at < NOW();
```

---

## interestList 儲存方案建議

### 方案比較

| 方案 | 優點 | 缺點 | 建議程度 |
|------|------|------|----------|
| **方案1: 新增 user_interests 表 (儲存 category ID)** | 結構清晰，直接關聯到 categories 表，易於查詢和統計，資料完整性高 | 需要新增表和關聯 | ⭐⭐⭐⭐⭐ **強烈推薦** |
| **方案2: 使用現有 entity_tags 表** | 不需要新增表，統一使用 tag 系統 | 無法直接關聯 categories，需要字串匹配 | ⭐⭐⭐ |
| **方案3: users 表 JSON 欄位** | 簡單直接，不需要 JOIN | 查詢和統計不方便，無外鍵約束 | ⭐⭐ |

### 推薦方案1: 新增 user_interests 表 (儲存 category ID)

#### 資料庫結構

```sql
-- 新增 user_interests 表
CREATE TABLE user_interests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT user_interests_unique UNIQUE (user_id, category_id)
);

-- 新增索引提升查詢效能
CREATE INDEX idx_user_interests_user_id ON user_interests(user_id);
CREATE INDEX idx_user_interests_category_id ON user_interests(category_id);
```

#### Prisma Schema

```prisma
model user_interests {
  id          Int       @id @default(autoincrement())
  user_id     Int
  category_id Int
  created_at  DateTime? @default(now()) @db.Timestamptz(6)
  updated_at  DateTime? @default(now()) @db.Timestamptz(6)

  users       users      @relation(fields: [user_id], references: [id], onDelete: Cascade, onUpdate: NoAction)
  categories  categories @relation(fields: [category_id], references: [id], onDelete: Cascade, onUpdate: NoAction)

  @@unique([user_id, category_id])
  @@index([user_id], map: "idx_user_interests_user_id")
  @@index([category_id], map: "idx_user_interests_category_id")
}

// 同時更新 users model
model users {
  // ... 現有欄位 ...
  user_interests  user_interests[]
  // ... 其他關聯 ...
}

// 同時更新 categories model
model categories {
  // ... 現有欄位 ...
  user_interests  user_interests[]
  // ... 其他關聯 ...
}
```

#### TypeScript 實作

```typescript
// 在 user.service.ts 中實作 interest 管理
// 設計與 resource 的 category 處理相同：API 層使用 name，資料庫層使用 ID

// 根據 category name 查找 category ID
const getCategoryIdByName = async (categoryName: string): Promise<number | null> => {
  if (!categoryName) return null;

  const category = await prisma.categories.findFirst({
    where: { name: categoryName }
  });

  return category ? category.id : null;
};

// 創建/更新用戶時設置 interests (接收 category names)
const setUserInterests = async (
  userId: number,
  categoryNames: string[],  // 接收 category names
  tx: PrismaTransactionClient
): Promise<void> => {
  // 先刪除現有的 interests
  await tx.user_interests.deleteMany({
    where: { user_id: userId }
  });

  // 如果有提供 category names
  if (categoryNames.length > 0) {
    // 轉換 category names 為 IDs
    const categoryIds: number[] = [];
    for (const name of categoryNames) {
      const categoryId = await getCategoryIdByName(name);
      if (categoryId) {
        categoryIds.push(categoryId);
      }
    }

    // 批量新增 interests
    if (categoryIds.length > 0) {
      await tx.user_interests.createMany({
        data: categoryIds.map(categoryId => ({
          user_id: userId,
          category_id: categoryId
        }))
      });
    }
  }
};

// 讀取用戶 interests (返回 category names 陣列)
const getUserInterests = async (userId: number): Promise<string[] | null> => {
  const interests = await prisma.user_interests.findMany({
    where: { user_id: userId },
    include: {
      categories: {
        select: {
          name: true  // 只需要 name
        }
      }
    }
  });

  if (interests.length === 0) return null;

  // 返回 category names 陣列
  return interests.map(interest => interest.categories.name);
};

// 在 createUser 函數中使用
if (interestList && interestList.length > 0) {
  await setUserInterests(newUser.id, interestList, tx);  // interestList 是 string[]
}

// 在 updateUser 函數中使用
if (interestList !== undefined) {
  await setUserInterests(user.id, interestList, tx);  // interestList 是 string[]
}
```

#### 優點說明
1. **資料完整性**: 使用外鍵約束確保 category 存在
2. **查詢效能**: 可直接 JOIN categories 表取得完整資訊
3. **統計方便**: 可輕鬆統計每個 category 的用戶數量
4. **擴展性好**: 未來可新增 weight、priority 等欄位
5. **符合正規化**: 遵循資料庫設計最佳實踐

---

## 注意事項

### 1. 資料驗證
- ✅ 所有新欄位都是可選的 (`NULL` 允許)，不會影響現有用戶
- ✅ 驗證規則在前端和後端都要實施
- ✅ 標語長度限制需要在 UI 明確顯示
- ⚠️ 專業領域和興趣清單使用 snake_case 格式，與 categories 保持一致

### 2. 性能考量
- ✅ 已在 `professional_field` 上創建索引，提升查詢效能
- ✅ interestList 使用現有 entity_tags 系統，無額外效能負擔
- ⚠️ 考慮在用戶列表查詢時是否需要 JOIN interestList

### 3. 向後兼容性
- ✅ 所有新欄位都是可選的，不影響現有 API
- ✅ 現有用戶資料不會被影響
- ✅ 前端可以漸進式採用新欄位
- ✅ 現有的 Custom ID 功能無需修改

### 4. 命名規範
- ✅ 資料庫欄位使用 snake_case (如: `professional_field`)
- ✅ TypeScript 介面使用 camelCase (如: `professionalField`)
- ✅ 常數值使用 snake_case (如: `information_and_computer_science`)
- ✅ 與 categories.majorCategory 保持一致的命名規則

---

## 測試檢查清單

### 單元測試
- [ ] 測試 PROFESSIONAL_FIELDS 常數包含所有 12 個選項
- [ ] 測試 INTEREST_CATEGORIES 常數包含所有 14 個分類
- [ ] 測試 REFERRAL_SOURCES 常數包含所有 6 個選項
- [ ] 測試 professionalFieldSchema 接受有效值
- [ ] 測試 professionalFieldSchema 拒絕無效值
- [ ] 測試 personalSloganSchema 長度驗證 (最多 200 字)
- [ ] 測試 interestListSchema 最多 5 個選項的限制
- [ ] 測試 referralSourceSchema 接受預設選項和自定義字串

### 整合測試
- [ ] 測試創建用戶時儲存新欄位
- [ ] 測試更新用戶時修改新欄位
- [ ] 測試查詢用戶時返回新欄位
- [ ] 測試 formatUserResponse 正確格式化新欄位
- [ ] 測試 interestList 的儲存和讀取
- [ ] 測試新欄位的資料庫約束

### E2E 測試
- [ ] 測試完整的用戶註冊流程 (包含新欄位)
- [ ] 測試用戶資料更新流程 (包含新欄位)
- [ ] 測試用戶查詢返回新欄位
- [ ] 測試無效資料被拒絕 (過長的標語、無效的專業領域等)

---

## 問題與解答

### Q1: interestList 為什麼 API 層使用 category name 而資料庫層使用 ID?
**A**: 這是參考 resource 的設計模式，採用**轉換層架構**:
- **API 層 (前端 ↔ 後端)**: 使用 category **name** (string)，例如 `"education_learning"`
  - 優點: 前端更易讀，API 文檔更清楚
  - 範例: `interestList: ["information_and_computer_science", "education_learning"]`
- **資料庫層**: 儲存 category **ID** (number) 到 `user_interests` 表
  - 優點: 外鍵約束、查詢效能、統計方便
- **轉換層**: Service 層負責 name ↔ ID 的轉換
  - 與 resource 的 `transformResourceToDb` 和 `transformResourceToApi` 相同設計

### Q2: 前端應該傳送什麼資料給後端?
**A**: 前端應傳送 category **name** 陣列給後端 (與 resource.majorCategory 相同):
```javascript
// 前端送出 (POST /api/users 或 PUT /api/users/:id)
{
  "interestList": ["education_learning", "information_and_computer_science"]  // category names
}

// 後端回應 (GET /api/users/:id)
{
  "interestList": ["education_learning", "information_and_computer_science"]  // category names
}
```

### Q3: 如何取得可用的 category 列表?
**A**: 前端應該呼叫 category API 取得頂層分類列表:
```javascript
// GET /api/categories?parentId=null
// 返回:
[
  { "id": 1, "name": "nature_and_environment", "description": "..." },
  { "id": 5, "name": "information_and_computer_science", "description": "..." },
  ...
]
```
前端下拉選單使用 `name` 作為 value，顯示翻譯後的中文標籤。

### Q4: 現有用戶如何處理新欄位?
**A**: 所有新欄位都是可選的，現有用戶不受影響。可以透過以下方式處理:
- 在用戶下次更新資料時填寫
- 提供「完善資料」的引導流程
- 不強制要求，允許為 null

### Q5: 是否需要為 user_interests 建立索引?
**A**: 已在資料庫結構中建立了必要的索引:
- `idx_user_interests_user_id` - 加速查詢特定用戶的 interests
- `idx_user_interests_category_id` - 加速查詢對某 category 感興趣的用戶
- `UNIQUE(user_id, category_id)` - 防止重複記錄

---

## 參考資料

### ESCO 專業領域分類
- 來源: European Skills, Competences, Qualifications and Occupations (ESCO)
- 文檔: https://ec.europa.eu/esco/portal/home
- 共 12 個主要領域 + 其他

### 興趣分類
- 與 `categories.majorCategory` 對應
- 使用 snake_case 格式命名
- 共 14 個主要分類，涵蓋自然科學、社會科學、藝術人文等領域
- 前端顯示時需要對應的中文標籤

### 專案架構文檔
- `CLAUDE.md` - 專案架構和開發指南
- `src/types/user.types.ts` - 用戶型別定義
- `src/services/user.service.ts` - 用戶業務邏輯
- `src/controllers/user.controller.ts` - 用戶控制器
- `src/routes/user.routes.ts` - 用戶路由配置

---

## 相關檔案清單

### 需要修改的檔案
1. `prisma/schema.prisma` - 新增 3 個資料庫欄位
2. `src/types/user.types.ts` - 新增常數和更新介面
3. `src/validators/user.validators.ts` - 新增驗證規則
4. `src/services/user.service.ts` - 更新 service 函數
5. OpenAPI 文檔 - 更新 schema 定義

### 不需要修改的檔案
- ✅ `src/controllers/user.controller.ts` - 已有完整實現
- ✅ `src/routes/user.routes.ts` - 路由已完整
- ✅ Custom ID 相關檔案 - 功能已完整

---

**文檔版本**: 2.0 (根據實際專案架構更新)
**最後更新**: 2024-01-15
**建立者**: Claude Code Assistant
**專案現況**: 已有完整 API 架構，需新增欄位支援
