# 我的小島側邊欄功能增強計畫

## 概述

本文件規劃在「我的小島」管理頁面側邊欄新增核心功能項目，以提升用戶學習管理體驗。開發遵循專案重構規則和UI遷移規範。

## 技術規範遵循

### 架構規則
- 遵循 [project-refactoring-rules.mdc](mdc:.cursor/rules/project-refactoring-rules.mdc) 的資料夾結構
- Features 之間不互相依賴，保持模組獨立性
- 使用 services 層進行 API 串接和 schema 定義

### UI/UX 規範
- 遵循 [ui-migration-rules.mdc](mdc:.cursor/rules/ui-migration-rules.mdc) 的元件庫使用
- 使用 shadcn/ui + Radix UI 替代 Material-UI
- 使用 Tailwind CSS 進行樣式設計
- 使用 React Hook Form + Zod 處理表單
- 使用 date-fns 替代 dayjs

### SSG/SSR 架構
- 遵循 [ssr-ssg-architecture-rules.mdc](mdc:.cursor/rules/ssr-ssg-architecture-rules.mdc)
- 優先使用 SSG，不使用 ISR (Cloudflare Pages 限制)
- 使用 SWR 進行客戶端數據管理
- 透過 `SWRConfig` fallback 提供初始數據

## 現有側邊欄結構分析

### 當前項目
```typescript
// 位置：/layout/features/getManageLayout.tsx
const items: SidebarItemType[] = [
  '我的小島',           // /manage
  '我的學習計畫',       // /manage/projects
  '個人名片',           // /personal-card/my-card
  {
    label: '百寶箱',
    children: [
      '我的收藏',       // /manage/treasure/collections (已禁用)
      '我的足跡',       // /manage/treasure/footprints (已禁用)  
      '追蹤的夥伴',     // /manage/treasure/following (已禁用)
    ]
  },
  '導師工作室'          // /manage/mentor-workspace (角色限制)
];
```

### 調整後項目順序
```typescript
const items: SidebarItemType[] = [
  '我的小島',           // /manage (保持首位)
  '學習計畫',           // /manage/projects (從「我的學習計畫」改名)
  '主題實踐',           // /manage/practices (新增)
  '想法',              // /manage/ideas (新增)
  '揪團',              // /manage/groups (新增)
  '個人名片',           // /personal-card/my-card (移至中間)
  {
    label: '百寶箱',    // 保持原有結構
    children: [
      '我的收藏',       
      '我的足跡',       
      '追蹤的夥伴',     
    ]
  },
  '導師工作室'          // 依角色權限動態顯示
];
```

### 設計參考
- **佈局模式**：參考 `/components/PersonalCard/MyGroup/index.jsx`
- **卡片設計**：使用 `StyledGroupsWrapper` 樣式結構
- **響應式設計**：桌面 `672px` 最大寬度，手機端適應式padding

## 新增功能規劃

### 1. 主題實踐 (Theme Practice)
```typescript
// 路由：/manage/practices
// 參考：PersonalCard/MyGroup 設計模式
```

**功能特點：**
- 顯示用戶參與的7-30天實踐活動
- 卡片式佈局，包含進度追蹤
- 狀態管理：進行中/已完成/暫停
- 操作：編輯、刪除、查看詳情

**組件架構：**
```
/features/practices/
├── components/
│   ├── PracticeList.tsx      // 主容器組件
│   ├── PracticeCard.tsx      // 單個實踐卡片  
│   ├── PracticeForm.tsx      // 新增/編輯表單
│   └── PracticeSkeleton.tsx  // 載入狀態
├── hooks/
│   ├── usePractices.ts       // 數據獲取 hook
│   └── usePracticeForm.ts    // 表單處理 hook
└── index.ts                  // 模組導出

/services/practices/
├── core/
│   ├── api.ts               // API 定義
│   ├── schema.ts            // Zod schema
│   └── index.ts             // 導出檔案
└── index.ts                 // 服務導出
```

**Schema 定義：**
```typescript
// services/practices/core/schema.ts
import { z } from 'zod';

export const practiceSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "請輸入實踐標題"),
  description: z.string().min(1, "請輸入實踐描述"),
  duration: z.number().min(7).max(30),
  progress: z.number().min(0).max(100),
  status: z.enum(['active', 'completed', 'paused']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  tags: z.array(z.string()),
  photoURL: z.string().url().optional(),
  userId: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const createPracticeFormSchema = z.object({
  title: z.string().min(1, "請輸入實踐標題"),
  description: z.string().min(1, "請輸入實踐描述"),
  duration: z.number().min(7, "最少7天").max(30, "最多30天"),
  tags: z.array(z.string()).optional(),
  photoURL: z.string().url().optional(),
});

export type PracticeSchema = z.infer<typeof practiceSchema>;
export type CreatePracticeFormSchema = z.infer<typeof createPracticeFormSchema>;
```

### 2. 想法分享 (Ideas)
```typescript
// 路由：/manage/ideas
// 參考：現有 /components/Idea/ 組件
```

**功能特點：**
- 管理用戶發布的學習想法
- 支援文字、圖片、連結分享
- 互動數據：按讚數、留言數
- 操作：編輯、刪除、設為私人/公開

**組件架構：**
```
/features/ideas/
├── components/
│   ├── IdeaList.tsx          // 主容器組件
│   ├── IdeaCard.tsx          // 單個想法卡片
│   ├── IdeaForm.tsx          // 新增/編輯表單
│   └── IdeaSkeleton.tsx      // 載入狀態
├── hooks/
│   ├── useIdeas.ts           // 數據獲取 hook
│   └── useIdeaForm.ts        // 表單處理 hook
└── index.ts                  // 模組導出

/services/ideas/
├── core/
│   ├── api.ts               // API 定義
│   ├── schema.ts            // Zod schema
│   └── index.ts             // 導出檔案
└── index.ts                 // 服務導出
```

**Schema 定義：**
```typescript
// services/ideas/core/schema.ts
import { z } from 'zod';

export const ideaSchema = z.object({
  id: z.string(),
  content: z.string().min(1, "請輸入想法內容"),
  mediaURL: z.string().url().optional(),
  linkURL: z.string().url().optional(), 
  tags: z.array(z.string()),
  isPublic: z.boolean().default(true),
  likes: z.number().default(0),
  comments: z.number().default(0),
  userId: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const createIdeaFormSchema = z.object({
  content: z.string().min(1, "請輸入想法內容").max(500, "內容不能超過500字"),
  mediaURL: z.string().url().optional(),
  linkURL: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().default(true),
});

export type IdeaSchema = z.infer<typeof ideaSchema>;
export type CreateIdeaFormSchema = z.infer<typeof createIdeaFormSchema>;
```

### 3. 揪團活動 (Group Activities)
```typescript
// 路由：/manage/groups
// 重構現有 MyGroup 組件
```

**功能特點：**
- 管理用戶發起的揪團活動
- 狀態追蹤：揪團中/已結束/已取消
- 參與者管理和互動
- 地點、時間、人數限制設定

**重構架構：**
```
/features/groups/
├── components/
│   ├── GroupList.tsx         // 主容器組件 (重構自 MyGroup)
│   ├── GroupCard.tsx         // 單個揪團卡片 (重構現有)
│   ├── GroupForm.tsx         // 新增/編輯表單
│   └── GroupSkeleton.tsx     // 載入狀態
├── hooks/
│   ├── useGroups.ts          // 數據獲取 hook
│   └── useGroupForm.ts       // 表單處理 hook
└── index.ts                  // 模組導出

/services/groups/
├── core/
│   ├── api.ts               // API 定義 (整合現有 circles API)
│   ├── schema.ts            // Zod schema
│   └── index.ts             // 導出檔案
└── index.ts                 // 服務導出
```

**移轉計畫：**
- 保留現有 `/components/PersonalCard/MyGroup/` 組件功能
- 重構為符合新架構的 features/groups 模組
- 使用 shadcn/ui 替代 Material-UI 組件
- 使用 Tailwind CSS 替代 emotion styled

### 4. 學習計畫 (Learning Plans)
```typescript
// 路由：/manage/projects (現有功能，僅修改標題)
// 保持現有功能不變
```

**現有功能：**
- 保持現有學習計畫功能
- 僅將標題從「我的學習計畫」更改為「學習計畫」
- 不需要新開發或功能修改

## 實作計畫

### Phase 1: 路由與導航結構 (第1週)

#### 1.1 更新側邊欄配置
**檔案：`/layout/features/getManageLayout.tsx`**

```typescript
// 新增路由定義
const manageRoutes = {
  manage: '/manage',
  projects: '/manage/projects',
  practices: '/manage/practices',        // 新增
  ideas: '/manage/ideas',               // 新增  
  groups: '/manage/groups',             // 新增
  myCard: '/personal-card/my-card',
  collections: '/manage/treasure/collections',
  footprints: '/manage/treasure/footprints',
  following: '/manage/treasure/following',
  mentorWorkspace: '/manage/mentor-workspace',
};

// 更新側邊欄項目
const items: SidebarItemType[] = [
  genSidebarItem('我的小島', manageRoutes.manage),
  genSidebarItem('個人名片', manageRoutes.myCard),
  {
    label: '百寶箱',
    children: [
      genSidebarItem('我的收藏', manageRoutes.collections, true),
      genSidebarItem('我的足跡', manageRoutes.footprints, true),
      genSidebarItem('追蹤的夥伴', manageRoutes.following, true),
    ],
  },
  genSidebarItem('學習計畫', manageRoutes.projects),      // 標題修改
  genSidebarItem('主題實踐', manageRoutes.practices),     // 新增
  genSidebarItem('想法', manageRoutes.ideas),            // 新增
  genSidebarItem('揪團', manageRoutes.groups),           // 整合現有功能

];

// 角色權限項目 (在判斷後動態加入)
if (getCanVisitMentorWorkspace(role)) {
  items.push(genSidebarItem('導師工作室', manageRoutes.mentorWorkspace));
}
```

#### 1.2 創建頁面檔案
```
/pages/manage/
├── practices/
│   └── index.tsx       // 主題實踐列表頁 (SSG + SWR)
├── ideas/
│   └── index.tsx       // 想法管理頁 (SSG + SWR)
└── groups/
    └── index.tsx       // 揪團管理頁 (SSG + SWR)
```

**頁面實作範本：**
```tsx
// pages/manage/practices/index.tsx
import type { InferGetStaticPropsType, GetStaticProps } from "next";
import { SWRConfig } from "swr";
import SEOConfig from "@/shared/components/SEO";
import { PracticeList } from "@/features/practices";
import { practiceAPI, PracticeListResponseSchema } from "@/services/practices";

export const getStaticProps = (async () => {
  try {
    // 構建時獲取初始數據（無需用戶認證的公開數據）
    const data = await practiceAPI.readList();
    
    return {
      props: { 
        fallback: { "/api/practices": data }
      },
    };
  } catch {
    return { props: { fallback: undefined } };
  }
}) satisfies GetStaticProps<{
  fallback: Record<string, PracticeListResponseSchema> | undefined;
}>;

export default function PracticesPage({
  fallback,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <SWRConfig value={{ fallback }}>
      <SEOConfig title="主題實踐｜島島阿學" />
      <PracticeList />
    </SWRConfig>
  );
}
```

### Phase 2: 組件開發 (第2-3週)

#### 2.1 服務層開發 (第2週)
**任務列表：**
- [ ] 創建 `/services/practices/` 服務模組
- [ ] 定義 Zod schema 和 TypeScript 類型
- [ ] 實作 API 介面和 SWR 整合
- [ ] 創建 `/services/ideas/` 服務模組  
- [ ] 重構 `/services/groups/` (整合現有 circles API)

#### 2.2 Features 組件開發 (第2-3週)
**主題實踐 Features：**
- [ ] 創建 `/features/practices/` 目錄結構
- [ ] 開發 `PracticeList.tsx` 使用 shadcn/ui 組件
- [ ] 開發 `PracticeCard.tsx` 使用 Tailwind CSS
- [ ] 實作 `usePractices.ts` hook 整合 SWR
- [ ] 開發 `PracticeForm.tsx` 使用 React Hook Form + Zod

**想法管理 Features：**
- [ ] 創建 `/features/ideas/` 目錄結構
- [ ] 開發 `IdeaList.tsx` 和 `IdeaCard.tsx`
- [ ] 實作 `useIdeas.ts` hook
- [ ] 開發 `IdeaForm.tsx` 表單組件
- [ ] 整合隱私設定和互動功能

**揪團重構：**
- [ ] 創建 `/features/groups/` 目錄
- [ ] 重構現有 MyGroup 到新架構
- [ ] 使用 shadcn/ui 替代 Material-UI
- [ ] 保持現有 API 整合 (/circles)

### Phase 3: 功能整合與優化 (第4週)

#### 3.1 統一設計系統
**Tailwind CSS 設計規範：**
```typescript
// 統一的卡片容器樣式 (使用 Tailwind)
<div className="bg-white max-w-2xl rounded-2xl p-9 md:p-10 flex flex-col items-center justify-center md:p-5 sm:p-4">
  {/* 內容 */}
</div>

// 統一的標題樣式 (使用 shadcn/ui Typography)
import { Heading } from "@/components/atoms/typography";

<Heading 
  level={2} 
  className="text-xl text-basic-400 font-bold mb-2"
>
  標題文字
</Heading>

// 統一的卡片組件範本
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/card";

<Card className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-basic-100">
  <CardHeader>
    <CardTitle className="text-basic-400 font-bold">標題</CardTitle>
  </CardHeader>
  <CardContent className="p-9 md:p-10 lg:p-5 sm:p-4">
    {/* 內容 */}
  </CardContent>
</Card>
```

#### 3.2 響應式優化
**斷點設計：**
- **桌面版** (`≥768px`)：672px 最大寬度，40px 內邊距
- **平板版** (`≥480px`)：適應容器寬度，24px 內邊距  
- **手機版** (`<480px`)：全寬度，16px 內邊距

#### 3.3 狀態管理整合
**避免 Context Provider 膨脹，使用 SWR 進行狀態管理：**
```typescript
// ❌ 避免: 過多的 Context Providers
<ProjectProvider>
  <MilestonesProvider>
    <PracticeProvider>
      <IdeaProvider>
        <GroupProvider>
          <ManageLayout>{children}</ManageLayout>
        </GroupProvider>
      </IdeaProvider>
    </PracticeProvider>
  </MilestonesProvider>
</ProjectProvider>

// ✅ 推薦: 使用 SWR + features hooks 管理狀態
// 在各個 features 中使用自定義 hooks
function ManageLayout({ children }: React.PropsWithChildren) {
  return (
    <ProjectProvider>
      <MilestonesProvider>
        <Sidebar items={sidebarItems}>
          {children}
        </Sidebar>
      </MilestonesProvider>
    </ProjectProvider>
  );
}

// 在組件中使用 features hooks
function PracticeList() {
  const { practices, isLoading } = usePractices();
  const { ideas } = useIdeas();
  const { groups } = useGroups();
  
  // 組件邏輯...
}
```

## API 規劃

### 主題實踐 API
```typescript
// GET /api/practices/user/:userId
// POST /api/practices
// PUT /api/practices/:id  
// DELETE /api/practices/:id
```

### 想法管理 API
```typescript
// GET /api/ideas/user/:userId
// POST /api/ideas
// PUT /api/ideas/:id
// DELETE /api/ideas/:id
```

### 揪團活動 API (現有)
```typescript
// GET /api/circles/user/:userId    // 現有
// POST /api/circles               // 現有
// PUT /api/circles/:id            // 現有
// DELETE /api/circles/:id         // 現有
```

## 測試計畫

### 單元測試 (使用 Jest + React Testing Library)
- [ ] shadcn/ui 組件渲染測試
- [ ] Zod schema 驗證測試  
- [ ] SWR hooks 數據流測試
- [ ] React Hook Form 表單邏輯測試

### 整合測試
- [ ] 側邊欄導航與頁面路由測試
- [ ] SSG + SWR 數據流整合測試
- [ ] Tailwind CSS 響應式佈局測試
- [ ] API 與 features hooks 整合測試

### 使用者測試
- [ ] 導航易用性測試
- [ ] 無障礙功能測試 (shadcn/ui a11y)
- [ ] 跨瀏覽器相容性測試
- [ ] 行動裝置體驗測試

## 風險評估與解決方案

### 技術風險
1. **Material-UI 到 shadcn/ui 遷移**
   - 風險：現有 MyGroup 組件使用 Material-UI 和 emotion
   - 解決：漸進式重構，建立新 features 模組並保持現有組件運作

2. **SSG 數據安全性**
   - 風險：用戶私人數據可能在 SSG 時暴露
   - 解決：僅在 SSG 時獲取公開數據，私人數據透過 SWR 客戶端獲取

3. **Cloudflare Pages 限制**
   - 風險：無法使用 ISR，數據更新延遲
   - 解決：依賴 SWR 客戶端更新，考慮關鍵頁面使用 SSR

4. **TypeScript 類型安全**
   - 風險：複雜的 Zod schema 可能導致類型錯誤
   - 解決：完整的 TypeScript 設定和嚴格的類型檢查

### 產品風險
1. **用戶學習成本**
   - 風險：側邊欄項目增加可能造成混亂
   - 解決：提供引導教學和漸進式展示

2. **功能重疊**
   - 風險：新功能與現有功能可能有重疊
   - 解決：清楚定義各功能邊界和用途

## 成功指標

### 技術指標
- [ ] 頁面載入時間 < 2秒
- [ ] 組件測試覆蓋率 > 80%
- [ ] 無 JavaScript 錯誤

### 產品指標
- [ ] 用戶完成導航操作成功率 > 95%
- [ ] 新功能使用率 > 60%
- [ ] 用戶滿意度評分 > 4.0/5.0

## 後續發展

### 階段二功能 (未來3個月)
1. **智能推薦系統**：基於用戶行為推薦相關實踐和想法
2. **社群互動增強**：新增協作功能和群組討論
3. **數據分析儀表板**：學習進度和成效視覺化

### 階段三功能 (未來6個月)  
1. **移動端原生應用**：開發 React Native 版本
2. **AI 學習助手**：整合 AI 提供個人化學習建議
3. **跨平台同步**：與第三方學習平台整合

---

**文件版本：** v1.0  
**最後更新：** 2025-06-18  
**負責人：** 開發團隊  
**審核狀態：** 待審核