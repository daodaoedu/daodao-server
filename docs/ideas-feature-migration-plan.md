# Ideas Feature Migration Plan

## 概述

本文件詳細說明將 `/pages/ideas` 功能進行三方向遷移的完整計畫，基於 Ideas API v1 設計規範：
1. **公開瀏覽功能** → 整合到首頁想法卡片
2. **個人管理功能** → 升級 `/pages/manage/ideas` 
3. **移除原有頁面** → 淘汰 `/pages/ideas` 獨立頁面

此遷移旨在將想法功能有機整合到平台生態系統中，提供更流暢的用戶體驗，並支援完整的 Ideas API v1 功能，包括：
- 想法的 CRUD 操作
- 互動功能（點讚、評論、分享、收藏）
- 資源關聯管理
- 事件追蹤與統計
- 評論系統整合

## 現狀分析

### 當前 `/pages/ideas` 結構

**檔案結構：**
- `pages/ideas/index.tsx` - 主要想法列表頁面
- `pages/ideas/[ideaId].tsx` - 想法詳情頁面

**功能特性：**
- 使用 `IdeasFeature` 完整功能組件
- 包含想法列表展示
- 支援想法創建（模態框形式）
- 想法搜尋與篩選功能
- 完整的想法詳情頁面，包含：
  - 想法內容展示
  - 使用者資訊
  - 標籤系統
  - 資源連結
  - 統計資訊（讚、評論、觀看、分享數）
  - 評論區塊
- 錯誤邊界處理
- SEO 優化

**使用的組件：**
- `IdeasFeature` - 主要功能組件
- `IdeaList` - 想法列表
- `IdeaCreateContainer` - 想法創建容器
- `CommentSection` - 評論功能
- 完整的 hooks 生態系統

### 當前首頁想法卡片結構

**檔案結構：**
- `pages/home/index.tsx` - 個人化首頁（將包含所有首頁組件）
- 想法卡片組件將整合到首頁檔案中
- 內容標籤將直接實作在首頁組件中

**現有功能：**
- 基本想法卡片展示（使用 mock 資料）
- 基礎互動功能（點讚、評論、分享）
- Tab 切換界面（推薦、主題實踐、學習計劃、想法）
- 創建新內容下拉選單
- 響應式設計

**待整合功能：**
- 真實 API 資料串接
- 完整的想法列表載入
- 搜尋與篩選功能
- 無限滾動或分頁
- 詳細的錯誤處理

### 當前 `/pages/manage/ideas` 結構

**檔案結構：**
- `pages/manage/ideas/index.tsx` - 簡單佔位頁面

**功能特性：**
- 基本佔位符實作
- 使用 `getManageLayout` 布局
- 整合到管理後台側邊欄
- SEO 基本配置

## 三方向遷移計畫

### 遷移目標架構

```
原有 /pages/ideas 功能分解：

┌─────────────────────┐
│   /pages/ideas      │
│  (完整功能頁面)       │
└─────────────────────┘
           │
           ├─ 公開瀏覽功能 ────┐
           │                │
           ├─ 個人管理功能 ────┼─ 功能拆分
           │                │
           └─ 創建與編輯功能 ──┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │   首頁       │ │  管理後台    │ │  詳情頁面    │
    │ 想法卡片     │ │ /manage/   │ │ 保持 SEO    │
    │ (公開瀏覽)    │ │ ideas      │ │ 優化        │
    └─────────────┘ └─────────────┘ └─────────────┘
```

### 階段一：首頁想法功能整合

#### 1.1 升級首頁想法卡片
- **目標**：將完整的公開想法瀏覽功能整合到首頁
- **範圍**：`pages/home/index.tsx` 中的 `PersonalDashboard` 組件的想法分頁
- **API 基礎**：使用 `/api/v1/ideas` 端點

**技術實作：**
```typescript
// API 整合
- 使用 /api/v1/ideas 端點獲取想法列表
- 支援查詢參數：page, limit, query, tags, sort, order
- 整合想法詳情 API：/api/v1/ideas/:id
- 實作統計數據顯示：likeCount, commentCount, viewCount, shareCount

// 互動功能
- 點讚系統：POST/DELETE /api/v1/ideas/:id/reactions
- 評論跳轉：連結到詳情頁面評論區
- 事件追蹤：瀏覽、點擊事件記錄
- 分享與收藏功能：/api/v1/events/shares 和 /api/v1/events/favorites

// 功能增強
- 添加搜尋功能（content 全文搜尋）
- 實作標籤篩選
- 支援排序（時間、熱門度、更新時間）
- 支援無限滾動或分頁載入
- 優化響應式設計
```

#### 1.2 保持卡片設計一致性
- 維持現有的想法卡片組件設計
- 適配真實資料結構
- 確保與其他卡片（實踐、計劃）視覺統一

#### 1.3 增強互動功能
- **點讚系統**：使用 `/api/v1/ideas/:id/reactions` API
- **評論系統**：顯示評論數量，點擊跳轉到詳情頁面
- **分享功能**：整合 `/api/v1/events/shares` 事件記錄
- **收藏功能**：使用 `/api/v1/events/favorites` API
- **瀏覽追蹤**：自動記錄瀏覽事件到 `/api/v1/events/views`

#### ~~1.4 新增浮動創建按鈕~~（已取消）
- **說明**：根據首頁重構計劃，浮動創建按鈕將在首頁重構中統一處理，此功能不在本遷移計劃範圍內

### 階段二：管理後台功能升級

#### 2.1 個人想法管理頁面
- **目標**：提供完整的個人想法管理功能
- **範圍**：`/pages/manage/ideas`
- **API 基礎**：使用 `/api/v1/me/ideas` 端點

**核心功能：**
```typescript
// 個人想法列表
- 使用 /api/v1/me/ideas 獲取個人想法
- 支援狀態篩選：active, draft, archived, all
- 顯示詳細統計：likeCount, commentCount, viewCount, shareCount
- 批量操作（刪除、狀態變更）
- 資源關聯顯示：hasResources, resourceCount

// 想法編輯
- 使用 PATCH /api/v1/ideas/:id 更新想法
- 狀態管理（active, draft, archived）
- 內容編輯（content, tags 管理）
- 資源管理（查看關聯資源）
- 版本控制（updatedAt 追蹤）
```

#### 2.2 創建與編輯流程
- **API 基礎**：使用 `POST /api/v1/ideas` 創建，`PATCH /api/v1/ideas/:id` 更新

```typescript
// 統一創建入口
- 首頁 "+" 按鈕 → 創建想法
- 管理頁面 → 創建/編輯想法
- 使用 POST /api/v1/ideas 創建新想法
- 支援創建時附帶資源：resources 陣列

// 編輯功能增強
- 實時預覽功能
- 自動儲存草稿（status: 'draft'）
- 資源管理：查看 /api/v1/ideas/:id/resources
- 標籤自動建議（基於現有標籤）
- 表單驗證：使用 Zod schemas
```

#### 2.3 統計與分析
```typescript
// 個人統計
- 想法成效分析：基於 likeCount, commentCount, viewCount, shareCount
- 互動趨勢圖表：時間序列數據分析
- 熱門標籤統計：tags 陣列統計
- 觀眾洞察：瀏覽事件數據分析
- 資源關聯統計：hasResources, resourceCount 數據
```

### 階段三：詳情頁面優化

#### 3.1 保留 SEO 友好的詳情頁面
- **路徑**：`/ideas/[ideaId]` 保持不變
- **功能**：專注於內容展示和 SEO 優化
- **API 整合**：使用 `/api/v1/ideas/:id` 獲取詳情

**功能增強：**
```typescript
// 詳情頁面功能
- 完整想法內容展示
- 使用者資訊顯示
- 標籤系統展示
- 互動功能：點讚、分享、收藏
- 評論系統整合：/api/v1/comments?targetType=idea&targetId=:id
- 資源展示：/api/v1/ideas/:id/resources
- 事件追蹤：自動記錄瀏覽事件
```

#### 3.2 管理後台詳情頁面
- **路徑**：`/manage/ideas/[ideaId]`
- **功能**：管理導向的詳情檢視
- **API 基礎**：使用相同的 `/api/v1/ideas/:id` 但包含管理功能

### 階段四：路由結構最終設計

```
首頁想法瀏覽：
/ (首頁)                   -> 想法卡片整合在探索分頁中

個人管理：  
/manage/ideas             -> 個人想法管理列表
/manage/ideas/create      -> 創建新想法
/manage/ideas/[id]/edit   -> 編輯想法

公開詳情：
/ideas/[ideaId]          -> 想法詳情頁面（保留 SEO）

移除的路由：
/ideas                   -> 功能已整合到首頁，將重定向到首頁想法分頁
```

## 實作步驟與時程規劃

### Phase 1：首頁想法卡片升級 (Week 1-2)

#### Step 1.1：資料層整合
- [ ] 建立 Ideas 服務層：`services/ideas/core/api.ts`
- [ ] 實作 Zod schemas：`services/ideas/core/schema.ts`
- [ ] 創建 SWR hooks：`services/ideas/hooks.ts`
- [ ] 修改 `pages/home/index.tsx` 移除 mock 資料
- [ ] 整合 `/api/v1/ideas` API 到首頁想法分頁
- [ ] 實作載入狀態和錯誤處理
- [ ] 調整想法卡片組件以支援 API v1 資料結構

#### Step 1.2：功能增強
- [ ] 添加想法搜尋功能到首頁（query 參數）
- [ ] 實作篩選選項（tags 參數）
- [ ] 實作排序功能（sort: createdAt/updatedAt/likeCount）
- [ ] 支援無限滾動或分頁載入（page, limit 參數）
- [ ] 優化響應式設計

#### Step 1.3：互動功能完善
- [ ] 實作點讚功能：`POST/DELETE /api/v1/ideas/:id/reactions`
- [ ] 添加想法詳情頁面跳轉
- [ ] 實作分享功能：`POST /api/v1/events/shares`
- [ ] 添加收藏功能：`POST/DELETE /api/v1/events/favorites`
- [ ] 整合瀏覽事件追蹤：`POST /api/v1/events/views`

#### Step 1.4：浮動創建按鈕實作
- [ ] 創建 `FloatingCreateButton` 組件
- [ ] 實作展開/收合動畫效果
- [ ] 添加創建選項：想法、主題實踐、學習計劃
- [ ] 整合到首頁組件
- [ ] 統一兩個創建按鈕的邏輯處理
- [ ] 優化手機版響應式體驗
- [ ] 確保無障礙訪問支援

### Phase 2：管理後台功能開發 (Week 3-4)

#### Step 2.1：基礎管理頁面
- [ ] 升級 `/pages/manage/ideas/index.tsx` 為完整功能頁面
- [ ] 整合 `/api/v1/me/ideas` API
- [ ] 實作個人想法列表展示
- [ ] 添加狀態篩選（active, draft, archived, all）
- [ ] 實作批量操作功能（批量刪除、狀態變更）
- [ ] 顯示統計資訊（likeCount, commentCount, viewCount, shareCount）

#### Step 2.2：創建與編輯功能
- [ ] 創建 `/pages/manage/ideas/create.tsx` 頁面
- [ ] 創建 `/pages/manage/ideas/[id]/edit.tsx` 頁面
- [ ] 整合 `POST /api/v1/ideas` 創建 API
- [ ] 整合 `PATCH /api/v1/ideas/:id` 更新 API
- [ ] 實作資源附帶功能（resources 陣列）
- [ ] 實作自動儲存草稿功能（status: 'draft'）
- [ ] 使用 Zod schemas 進行表單驗證

#### Step 2.3：管理後台詳情頁面
- [ ] 創建 `/pages/manage/ideas/[ideaId].tsx`
- [ ] 整合 `/api/v1/ideas/:id` 詳情 API
- [ ] 整合 `/api/v1/ideas/:id/resources` 資源 API
- [ ] 實作管理導向的詳情檢視
- [ ] 添加快速編輯功能
- [ ] 實作統計資訊展示
- [ ] 整合評論管理功能

### Phase 3：統一創建流程 (Week 5)

#### Step 3.1：創建入口整合
- [ ] 整合 ContentTabs 的創建邏輯
- [ ] 實作創建想法的路由導向邏輯
- [ ] 確保創建後的重定向邏輯一致
- [ ] 優化創建流程的用戶體驗

#### Step 3.2：用戶體驗優化
- [ ] 添加頁面間的導航連結
- [ ] 實作麵包屑導航
- [ ] 優化載入轉場效果

### Phase 4：路由重構與清理 (Week 6)

#### Step 4.1：路由重定向
- [ ] 實作 `/ideas` 到首頁想法分頁的重定向
- [ ] 確保 `/ideas/[ideaId]` 詳情頁面正常運作
- [ ] 添加適當的 canonical URL 設定

#### Step 4.2：功能清理
- [ ] 移除不再使用的 `/pages/ideas/index.tsx`
- [ ] 清理相關的路由配置
- [ ] 更新導航選單和連結

### Phase 5：測試與優化 (Week 7)

#### Step 5.1：功能測試
- [ ] 首頁想法瀏覽功能測試
- [ ] 管理後台功能完整性測試
- [ ] 創建與編輯流程測試
- [ ] 權限控制驗證

#### Step 5.2：性能與SEO測試
- [ ] 頁面載入性能測試
- [ ] SEO 優化驗證
- [ ] 響應式設計測試（特別關注浮動按鈕）
- [ ] 無障礙訪問測試（包含鍵盤導航）

## 技術考量

### 資料同步策略
```typescript
// SWR 快取策略 (基於 API v1 端點)
const PUBLIC_IDEAS_KEY = '/api/v1/ideas'
const PERSONAL_IDEAS_KEY = '/api/v1/me/ideas'
const IDEA_DETAIL_KEY = (id: string) => `/api/v1/ideas/${id}`
const IDEA_RESOURCES_KEY = (id: string) => `/api/v1/ideas/${id}/resources`
const IDEA_COMMENTS_KEY = (id: string) => `/api/v1/comments?targetType=idea&targetId=${id}`

// 確保資料一致性
mutate(PUBLIC_IDEAS_KEY) // 首頁更新
mutate(PERSONAL_IDEAS_KEY) // 管理頁面更新
mutate(IDEA_DETAIL_KEY(ideaId)) // 詳情頁面更新
mutate(IDEA_RESOURCES_KEY(ideaId)) // 資源列表更新
mutate(IDEA_COMMENTS_KEY(ideaId)) // 評論列表更新
```

### 組件復用架構
```typescript
// 組件分層
┌─ features/ideas/
│  ├─ components/Ideas.tsx           (原有完整功能)
│  ├─ components/IdeaList.tsx        (列表組件)
│  └─ components/IdeaCard.tsx        (卡片組件 - 複用)
│
├─ pages/home/
│  └─ index.tsx                     (包含所有首頁組件)
│      ├─ PersonalDashboard         (登入後儀表板)
│      ├─ ContentTabs               (標籤導航組件)
│      ├─ ContentDisplay            (內容顯示組件)
│      ├─ MixedRecommendationSection (混合推薦組件)
│      └─ FloatingCreateButton      (浮動創建按鈕)
│
├─ components/atoms/
│  └─ FloatingCreateButton.tsx      (通用浮動創建按鈕組件)
│
└─ pages/manage/ideas/
   ├─ index.tsx                     (管理列表)
   ├─ create.tsx                    (創建頁面)
   └─ [id]/edit.tsx                 (編輯頁面)
```

### 浮動創建按鈕架構設計

```typescript
// FloatingCreateButton 組件結構
interface FloatingCreateButtonProps {
  createOptions: CreateOption[];
  onCreateNew: (type: string) => void;
  className?: string;
  position?: 'bottom-right' | 'bottom-left';
  size?: 'sm' | 'md' | 'lg';
}

interface CreateOption {
  id: string;
  title: string;
  description: string;
  icon?: React.ComponentType;
}

// 創建邏輯統一化
const useCreateActions = () => {
  const router = useRouter();
  
  const handleCreateNew = (type: string) => {
    switch (type) {
      case 'idea':
        // 開啟想法創建模態框或導航
        break;
      case 'practice':
        router.push('/practice/create');
        break;
      case 'plan':
        router.push('/plan/create');
        break;
    }
  };
  
  return { handleCreateNew };
};
```

### 權限與安全性
```typescript
// API 權限分層 (基於 API v1 設計)
- 公開 API：
  - GET /api/v1/ideas (無需認證)
  - GET /api/v1/ideas/:id (無需認證)
  - GET /api/v1/ideas/:id/resources (無需認證)
  - GET /api/v1/comments (無需認證)
  - POST /api/v1/events/views (無需認證)
  - POST /api/v1/events/clicks (無需認證)

- 認證 API：
  - POST /api/v1/ideas (需要認證)
  - PATCH /api/v1/ideas/:id (需要認證 + 所有權驗證)
  - DELETE /api/v1/ideas/:id (需要認證 + 所有權驗證)
  - POST/DELETE /api/v1/ideas/:id/reactions (需要認證)
  - GET /api/v1/me/ideas (需要認證)
  - POST /api/v1/comments (需要認證)
  - PUT/DELETE /api/v1/comments/:id (需要認證 + 所有權驗證)
  - POST/DELETE /api/v1/events/favorites (需要認證)
  - POST /api/v1/events/shares (需要認證)

// 頁面權限控制
- 首頁：無限制訪問
- 詳情頁面：無限制訪問（SEO 友好）
- 管理頁面：需要登入
- 創建/編輯：需要登入 + 所有權驗證
```

## 風險評估與緩解

### 主要風險
1. **用戶體驗中斷**：功能分散可能讓用戶感到困惑
2. **SEO 影響**：路由變更可能影響搜尋引擎排名
3. **開發複雜性**：多個頁面需要維護相似功能
4. **資料一致性**：多個入口可能造成資料同步問題

### 緩解策略
1. **漸進式遷移**：保持原有功能運作，逐步引導用戶
2. **SEO 保護**：使用 301 重定向和 canonical URL
3. **組件復用**：最大化共用組件，減少重複代碼
4. **統一資料層**：使用相同的 API 和快取策略

### 回滾計畫
```typescript
// 緊急回滾步驟
1. 恢復 /pages/ideas/index.tsx
2. 移除重定向配置
3. 回滾首頁想法卡片到 mock 資料
4. 通知用戶關於臨時變更
```

## 成功指標

### 功能指標
- [ ] 所有原有功能正常運作
- [ ] 新功能按預期工作
- [ ] 無明顯效能退化
- [ ] 用戶回饋為正面

### 技術指標
- [ ] 代碼覆蓋率 > 80%
- [ ] 頁面載入時間 < 2 秒
- [ ] 無 TypeScript 錯誤
- [ ] 通過所有 ESLint 檢查

### 業務指標  
- [ ] 想法互動率維持或提升
- [ ] 用戶停留時間無明顯下降
- [ ] SEO 排名保持穩定
- [ ] 用戶創建想法頻率提升

## API 服務層實作指南

### 服務層結構

基於 Ideas API v1 設計，建議按以下結構實作：

```typescript
// src/services/ideas/
├── core/
│   ├── api.ts          // API 函數定義
│   ├── schema.ts       // Zod schemas
│   └── types.ts        // TypeScript 型別
├── hooks.ts            // SWR hooks
├── utils.ts            // 工具函數
└── index.ts            // 匯出
```

### 關鍵實作要點

1. **API 整合**：
   - 使用統一的 API 端點結構 `/api/v1/ideas`
   - 支援完整的查詢參數（page, limit, query, tags, sort, order）
   - 實作認證和未認證端點的區分

2. **資料驗證**：
   - 使用 API v1 定義的 Zod schemas
   - 確保前端表單驗證與後端一致
   - 實作完整的錯誤處理

3. **互動功能**：
   - 點讚系統完整實作
   - 事件追蹤整合
   - 評論系統整合
   - 資源關聯管理

4. **狀態管理**：
   - 使用 SWR 進行資料快取
   - 實作樂觀更新
   - 確保多頁面資料同步

## 結論

此三方向遷移計畫將想法功能有機整合到平台生態系統中，基於 Ideas API v1 的完整設計：

1. **首頁整合**：提供更直觀的內容發現體驗，支援完整的 API v1 功能
2. **管理後台**：為用戶提供專業的內容管理工具，包含統計分析  
3. **SEO 保護**：維持搜尋引擎友好的內容頁面，整合評論和互動功能
4. **API 驅動**：基於標準化的 RESTful API 設計，確保功能完整性和擴展性

通過階段性實施、詳細測試和風險管控，確保遷移過程順利，提升整體用戶體驗，並為未來功能擴展奠定堅實基礎。

---

*文檔版本：1.0*  
*創建日期：2025-06-18*  
*最後更新：2025-06-18*