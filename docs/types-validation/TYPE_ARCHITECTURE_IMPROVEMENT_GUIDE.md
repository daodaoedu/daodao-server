# DaoDao Server - TypeScript 類型架構改進指南

## 概述

本文檔分析 `src/services/` 目錄中的類型使用模式，識別問題並提供改進建議。目標是建立更好的類型架構，提高代碼可維護性和類型安全性。

## 🚨 當前主要問題

### 1. 巨大單一介面問題

#### 1.1 FormattedUserResponse - 主要問題來源

**位置**: `src/types/user.types.ts` (第 86-124 行)

**問題分析**:
```typescript
export interface FormattedUserResponse {
  // 🔥 問題：38 個欄位混合多種關注點
  id: number;
  _id: string;                    // 基礎資料
  name?: string;
  gender?: string;
  email?: string;
  photoURL?: string;              // ❌ 命名不一致
  
  // 設定選項
  isOpenLocation?: boolean;
  isOpenProfile?: boolean;
  
  // 個人資料
  selfIntroduction?: string;
  tagList?: string[];
  
  // 聯絡資訊
  contactList?: {
    email?: string;
    photoUrl?: string;            // ❌ 與上面 photoURL 不一致
    // ...
  };
  
  // 🔥 重複資料
  basicInfo?: {
    selfIntroduction?: string;    // ❌ 重複上面的欄位
    shareList?: string | string[];
    wantToDoList?: string[];
  };
}
```

**具體問題**:
- **資料重複**: `basicInfo` 重複 `selfIntroduction`、`wantToDoList`
- **命名不一致**: `photoURL` vs `photoUrl`
- **混合關注點**: 聯絡資訊、偏好、基本資料、角色、自訂 ID 全在一個介面
- **類型不一致**: `share` 可以是 `string` 或 `string[]`

#### 1.2 ResourceResponse - 另一個重災區

**位置**: `src/types/resource.types.ts`

```typescript
export interface ResourceResponse {
  id: string;
  name: string;
  url: string;
  description: string;
  // 🔥 問題：統計資料混入核心資料
  avgRating: number | null;
  viewCount: number;
  favoriteCount: number;
  shareCount: number;
  reviewCount: number;
  likeCount: number;
  // 🔥 問題：嵌入複雜物件
  user: UserBasicInfo;
  tags: string[];
  // 分類資料
  majorCategory: string | null;
  subCategory: string | null;
}
```

### 2. 手動欄位映射問題

#### 2.1 User Service - 大量手動映射

**位置**: `src/services/user.service.ts` (第 239-292 行)

```typescript
const formatUserResponse = async (user: PrismaUserWithRelations): Promise<FormattedUserResponse> => {
  // 🔥 問題：60+ 行的手動欄位映射
  return {
    id: user.id,
    _id: user.external_id || '',
    name: user.nickname || undefined,           // 手動映射
    photoURL: user.contacts?.photo_url || undefined,
    
    // 🔥 重複映射
    contactList: {
      email: user.contacts?.email || undefined,
      photoUrl: user.contacts?.photo_url || undefined,  // 不一致命名
    },
    
    // 🔥 更多重複
    basicInfo: {
      selfIntroduction: user.basic_info?.self_introduction || undefined,
    },
  };
};
```

### 3. 命名不一致模式

**跨服務的命名不一致**:
```typescript
// 在不同介面中
photoURL: string;           // camelCase
self_introduction: string;  // snake_case
photoUrl: string;          // 與上面不同
created_at: Date;          // snake_case
createdAt: string;         // camelCase
```

## ✅ 良好實踐範例

### 1. Comment Service - 良好結構

**位置**: `src/services/comment.service.ts`

**良好實踐**:
```typescript
// ✅ 使用專注的介面
interface CommentResponse {
  id: number;
  content: string;
  userId: number;
  entityType: string;
  entityId: number;
  // 專注於評論核心資料
}

// ✅ 清楚的關注點分離
// ✅ 適當的錯誤處理
// ✅ 直接使用 Prisma 類型
```

### 2. Practice Service - 合理方法

**位置**: `src/services/practice.service.ts`

```typescript
// ✅ 專注的介面結構
const practiceEntities: PracticeEntity[] = practices.map(practice => ({
  id: practice.id,
  title: practice.title,
  contentType: practice.content_type as ContentType,
  // ✅ 統計資料適當分離
  stats: {
    likeCount: 0,
    viewCount: 0,
    favoriteCount: 0,
    shareCount: 0,
    commentCount: comments[practice.id] || 0
  }
}));
```

## 🎯 推薦改進方案

### 方案 1：組合式類型設計（主要推薦）

#### 1.1 User 類型重構

```typescript
// 🎯 核心用戶類型 - 直接使用 Prisma
export type CoreUser = users;

// 🎯 基礎 API 回應類型
export interface UserCore {
  id: number;
  _id: string;        // external_id 的別名
  name: string;       // nickname 的別名
}

// 🎯 用戶個人資料
export interface UserProfile {
  email?: string;
  photoURL?: string;  // 統一使用 photoURL
  gender?: string;
  birthDate?: Date;   // 統一使用 Date 類型
  location?: string;
  selfIntroduction?: string;
}

// 🎯 用戶設定
export interface UserSettings {
  isOpenLocation: boolean;
  isOpenProfile: boolean;
  isSubscribeEmail: boolean;
}

// 🎯 聯絡資訊
export interface UserContacts {
  instagram?: string;
  discord?: string;
  line?: string;
  facebook?: string;
}

// 🎯 用戶偏好
export interface UserPreferences {
  tagList: string[];
  wantToDoList: string[];
  roleList: string[];
  educationStage?: string;
}

// 🎯 按需組合
export type UserSummary = UserCore & Pick<UserProfile, 'photoURL'>;
export type UserPublic = UserCore & UserProfile & Pick<UserSettings, 'isOpenProfile'>;
export type UserPrivate = UserCore & UserProfile & UserSettings & UserContacts;
export type UserDetail = UserPrivate & UserPreferences;
```

#### 1.2 Resource 類型重構

```typescript
// 🎯 核心資源類型
export interface ResourceCore {
  id: string;
  name: string;
  url: string;
  description: string;
  imageUrl?: string;
  videoUrl?: string;
}

// 🎯 資源元數據
export interface ResourceMeta {
  type: string;
  level: string;
  cost: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// 🎯 資源統計（分離）
export interface ResourceStats {
  viewCount: number;
  favoriteCount: number;
  shareCount: number;
  reviewCount: number;
  likeCount: number;
  avgRating?: number;
}

// 🎯 資源分類
export interface ResourceCategory {
  majorCategory?: string;
  subCategory?: string;
  tags: string[];
}

// 🎯 資源作者資訊
export interface ResourceAuthor {
  authorId: number;
  authorName: string;
  authorPhotoURL?: string;
}

// 🎯 按需組合
export type ResourceSummary = ResourceCore & Pick<ResourceMeta, 'type' | 'level' | 'status'>;
export type ResourceCard = ResourceSummary & ResourceCategory & ResourceAuthor;
export type ResourceDetail = ResourceCore & ResourceMeta & ResourceCategory & ResourceAuthor;
export type ResourceWithStats = ResourceDetail & ResourceStats;
```

### 方案 2：轉換函數模式

```typescript
// 🎯 明確的轉換邏輯
export const transformUserForApi = (user: CoreUser): UserCore => ({
  id: user.id,
  _id: user.external_id,
  name: user.nickname || '未設定',
});

export const transformUserProfile = (user: CoreUser): UserProfile => ({
  email: user.contacts?.email,
  photoURL: user.contacts?.photo_url,
  gender: user.gender,
  birthDate: user.birth_date,
  location: user.location,
  selfIntroduction: user.basic_info?.self_introduction,
});

// 🎯 組合轉換
export const transformUserDetail = (user: CoreUser): UserDetail => ({
  ...transformUserForApi(user),
  ...transformUserProfile(user),
  ...transformUserSettings(user),
  ...transformUserPreferences(user),
});
```

### 方案 3：服務層實作模式

```typescript
// 🎯 在 user.service.ts 中
export class UserTransformService {
  // 取代巨大的 formatUserResponse 函數
  static toSummary(user: CoreUser): UserSummary {
    return {
      id: user.id,
      _id: user.external_id,
      name: user.nickname || '未設定',
      photoURL: user.contacts?.photo_url,
    };
  }

  static toPublic(user: CoreUser): UserPublic {
    return {
      ...this.toSummary(user),
      email: user.contacts?.email,
      gender: user.gender,
      birthDate: user.birth_date,
      location: user.location,
      selfIntroduction: user.basic_info?.self_introduction,
      isOpenProfile: user.is_open_profile,
    };
  }

  static toPrivate(user: CoreUser): UserPrivate {
    return {
      ...this.toPublic(user),
      isOpenLocation: user.is_open_location,
      isSubscribeEmail: user.contacts?.is_subscribe_email,
      instagram: user.contacts?.instagram,
      discord: user.contacts?.discord,
      line: user.contacts?.line,
      facebook: user.contacts?.facebook,
    };
  }
}
```

## 📋 實施計劃

### 階段 1：緊急優先級（高影響）

#### 1.1 User Service 重構
**目標檔案**: `src/services/user.service.ts`, `src/types/user.types.ts`

**步驟**:
1. 建立新的組合式類型定義
2. 建立轉換函數取代 `formatUserResponse`
3. 更新所有使用 `FormattedUserResponse` 的地方
4. 漸進式移除舊類型

**預期效益**:
- 減少 60+ 行手動映射代碼
- 消除資料重複問題
- 統一命名約定

#### 1.2 Resource Service 重構
**目標檔案**: `src/services/resource.service.ts`, `src/types/resource.types.ts`

**步驟**:
1. 分離統計資料到獨立介面
2. 建立作者資訊的獨立類型
3. 按使用場景組合類型
4. 更新 transform.service.ts 中相關邏輯

### 階段 2：中等優先級

#### 2.1 Me Service 優化
**目標檔案**: `src/services/me.service.ts`, `src/types/me.types.ts`

**步驟**:
1. 使用組合式用戶類型
2. 簡化複雜聚合邏輯
3. 分離統計計算

#### 2.2 Project Service 改進
**目標檔案**: `src/services/project.service.ts`, `src/types/project.types.ts`

**步驟**:
1. 移除嵌入的用戶物件
2. 使用用戶引用 ID
3. 建立專案特定的組合類型

### 階段 3：長期改進

#### 3.1 命名標準化
1. 統一使用 camelCase 於 API 回應
2. 統一日期格式處理
3. 建立欄位命名指南

#### 3.2 類型文檔化
1. 為所有新類型添加 JSDoc
2. 建立類型使用範例
3. 建立最佳實踐指南

## 🔧 具體服務改進建議

### 1. user.service.ts
```typescript
// ❌ 移除這個
const formatUserResponse = async (user: PrismaUserWithRelations): Promise<FormattedUserResponse>

// ✅ 替換為這些
const getUserSummary = (user: CoreUser): UserSummary
const getUserPublic = (user: CoreUser): UserPublic  
const getUserPrivate = (user: CoreUser): UserPrivate
```

### 2. resource.service.ts
```typescript
// ❌ 避免這樣
return resources.map(resource => ({
  ...resource,
  user: await getUserBasicInfo(resource.userId), // 嵌入物件
  viewCount: stats.views,                         // 混合關注點
}));

// ✅ 改為這樣
return {
  resources: resources.map(transformResourceSummary),
  authors: await getUserSummaries(authorIds),
  stats: await getResourceStats(resourceIds),
};
```

### 3. comment.service.ts（保持良好模式）
```typescript
// ✅ 繼續使用這種模式
interface CommentResponse {
  id: number;
  content: string;
  authorId: number;  // 引用而非嵌入
  createdAt: string;
}
```

## 📊 預期效益

### 類型安全改進
- 消除巨大單一介面（38 個欄位 → 5-8 個專注介面）
- 減少手動映射錯誤
- 提高編譯時類型檢查覆蓋率

### 代碼可維護性
- 60+ 行映射函數 → 5-10 行小函數
- 清晰的關注點分離
- 易於測試的小函數

### 開發體驗
- 更好的 IDE 自動完成
- 清晰的 API 回應結構
- 減少運行時錯誤

### 性能優化
- 按需加載資料（不用傳輸不必要的欄位）
- 減少資料重複
- 更好的緩存策略可能性

## 🚀 開始實施

### 第一步：選擇一個服務開始
推薦從 **Comment Service** 開始，因為它已經有良好的結構，可以作為模範。

### 第二步：重構 User Service
這是影響最大的改進，會帶來最顯著的效益。

### 第三步：逐步推廣模式
將成功的模式應用到其他服務。

## 結論

當前的類型架構主要問題是巨大的單一介面和手動映射邏輯。通過實施組合式類型設計，我們可以：

1. **提高類型安全性** - 更精確的類型定義
2. **改善可維護性** - 小而專注的介面
3. **增強開發體驗** - 更好的 IDE 支援
4. **提升性能** - 按需加載資料

建議立即開始實施，優先處理 User Service 和 Resource Service，這將帶來最大的改進效益。