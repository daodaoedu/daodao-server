# 首頁重構計劃

## 分析結果

### 現有 Features 架構
專案已有完整的功能模組化架構：
- `features/ideas/` - 想法功能
- `features/practice/` - 主題實踐功能 
- `features/projects/` - 學習計劃功能
- `features/resources/` - 學習資源功能

### 現有首頁實作狀況
- **Entry Point**: `pages/index.jsx` 使用 `NewHomePage` 組件
- **主組件**: `features/home/NewHomePage.tsx` 根據登入狀態顯示不同內容
  - 未登入：顯示 `LandingPage`
  - 已登入：顯示 `PersonalDashboard`
- **個人化儀表板**: `PersonalDashboard.tsx` 包含探索標籤和卡片展示

### 架構調整決定
**移除 features/home**：
- features/home 不符合專案架構原則 (首頁不是獨立的業務功能)
- 首頁組件應該直接放在 pages 層進行組裝
- 各 feature 負責提供自己的推薦組件和情境組件

### 登入後首頁三層架構分析 
根據截圖，登入後首頁有清晰的三層結構：

#### 第一層：頂部主導航 (Header Navigation)
- **探索** - 內容發現和瀏覽 
- **交流** - 社群互動功能
- **資源** - 學習資源管理

#### 第二層：內容分類標籤 (Content Tabs)
- **推薦** - 個性化推薦內容 (目前缺少)
- **主題實踐** - 實踐活動展示
- **學習計劃** - 學習計劃展示  
- **想法** - 用戶想法分享

#### 第三層：具體內容展示 (Content Display)
- 卡片式內容展示 (想法卡片、實踐卡片等)
- 互動功能 (點讚、留言、分享、收藏)
- 創建新內容的快速入口 (+ 開始 按鈕)

## 重構規劃

### 1. 推薦系統設計 (不創建新 Feature)

採用更簡潔的架構：推薦邏輯由 services 層提供，各 feature 自己實作推薦組件

```
services/
├── recommendation/
│   ├── core/
│   │   ├── api.ts                      # 推薦 API 介面
│   │   ├── schema.ts                   # Zod 推薦資料結構
│   │   └── index.ts                    # 模組導出
│   ├── hooks.ts                        # SWR hooks
│   └── index.ts                        # 服務導出

features/
├── ideas/
│   ├── components/
│   │   ├── IdeasRecommendationSection.tsx      # 探索-推薦-想法
│   │   ├── IdeasExploreSection.tsx             # 探索-想法
│   │   └── ...existing components
├── practice/
│   ├── components/
│   │   ├── PracticeRecommendationSection.tsx   # 探索-推薦-實踐
│   │   ├── PracticeExploreSection.tsx          # 探索-實踐
│   │   └── ...existing components
├── projects/
│   ├── components/
│   │   ├── ProjectsRecommendationSection.tsx   # 探索-推薦-計劃
│   │   ├── ProjectsExploreSection.tsx          # 探索-計劃
│   │   └── ...existing components

pages/
└── home/                                       # 首頁資料夾
    └── index.tsx                              # 包含所有首頁組件
```

**首頁文件結構** (`pages/home/index.tsx`)：
```tsx
// 未登入首頁組件
function LandingPage() {
  // 產品介紹、特色說明、註冊引導
}

// 登入後儀表板組件  
function PersonalDashboard() {
  // 只實作探索內容
  // 交流顯示「開發中」，資源跳轉到 /resource
}

// 主頁面組件 (預設導出)
export default function HomePage() {
  const { isLogin } = useAuth();
  
  return isLogin 
    ? <PersonalDashboard />
    : <LandingPage />
}
```

**核心概念**:
- **統一 API**：`services/recommendation` 提供跨模組推薦資料
- **分散實作**：各 feature 實作自己的推薦展示組件
- **資料復用**：推薦 API 返回混合內容，各組件過濾顯示自己類型的內容
- **無依賴**：各 feature 保持獨立，僅依賴 services 層

### 2. 重構方案設計

#### 2.2 內容路由架構 (Content Routing)

基於需求調整：只有「探索」需要實作內容

```tsx
// 探索內容的標籤和組件對應
const EXPLORE_CONTENT = {
  '推薦': 'MixedRecommendationSection',        // 混合推薦
  '主題實踐': 'PracticeExploreSection',        // 探索實踐
  '學習計劃': 'ProjectsExploreSection',        // 探索計劃
  '想法': 'IdeasExploreSection'                // 探索想法
};

// 探索的標籤配置
const EXPLORE_TABS = ['推薦', '主題實踐', '學習計劃', '想法'];
```

**推薦內容實作**：
- `MixedRecommendationSection` 只在探索情境下使用
- 整合各 feature 的推薦組件：`IdeasRecommendationSection`、`PracticeRecommendationSection`、`ProjectsRecommendationSection`
- 推薦 API 只需要支援探索情境

#### 2.3 三個主導航的處理方式

**探索 (Explore)**：完整實作內容
- 四個標籤：推薦、主題實踐、學習計劃、想法
- 各 feature 提供推薦組件和探索組件

**交流 (Social)**：顯示「功能開發中」
- 不需要實作任何組件

**資源 (Resource)**：直接跳轉
- 點擊後跳轉到 `/resource` 頁面

#### 2.4 PersonalDashboard 實作重點

```tsx
// pages/home/index.tsx - PersonalDashboard 組件
function PersonalDashboard() {
  const router = useRouter();
  const [currentMainTab, setCurrentMainTab] = useState('探索');
  const [currentContentTab, setCurrentContentTab] = useState('推薦');

  // 處理主導航切換
  useEffect(() => {
    if (currentMainTab === '資源') {
      router.push('/resource');
    }
  }, [currentMainTab, router]);

  // 根據主導航決定顯示內容
  if (currentMainTab === '交流') {
    return <ComingSoonMessage feature="交流功能" />;
  }

  // 探索內容的標籤配置
  const tabs = ['推薦', '主題實踐', '學習計劃', '想法'];

  return (
    <div className="min-h-screen bg-basic-100 relative">
      <ContentTabs 
        tabs={tabs}
        activeTab={currentContentTab}
        onTabChange={setCurrentContentTab}
      />
      
      <ContentDisplay 
        contentType={currentContentTab}
        mainContext="explore"
      />
      
      {/* 浮動創建按鈕 */}
      <FloatingCreateButton />
    </div>
  );
}

### 3. 重構後的首頁架構

```
pages/
├── index.jsx                                   # 現有入口，需更新引入 home/index
└── home/                                       
    └── index.tsx                              # 包含所有首頁組件
        ├── HomePage (default export)          # 根據登入狀態路由
        ├── LandingPage                        # 未登入首頁
        ├── PersonalDashboard                  # 登入後儀表板
        ├── ContentTabs                        # 標籤導航組件
        ├── ContentDisplay                     # 內容顯示組件
        ├── MixedRecommendationSection         # 混合推薦組件
        └── ComingSoonMessage                  # 功能開發中提示
        
PersonalDashboard 內部邏輯：
├── [第一層] Header Navigation (由 Layout 提供)
│   ├── 探索 (Explore) → 顯示內容
│   ├── 交流 (Social) → 顯示「功能開發中」
│   └── 資源 (Resource) → 跳轉到 /resource
│
└── [探索內容實作]
    ├── ContentTabs: [推薦, 主題實踐, 學習計劃, 想法]
    └── ContentDisplay:
        ├── 推薦 → MixedRecommendationSection
        ├── 主題實踐 → PracticeExploreSection  
        ├── 學習計劃 → ProjectsExploreSection
        └── 想法 → IdeasExploreSection

features/                                       # 只需要探索相關組件
├── ideas/components/
│   ├── IdeasRecommendationSection.tsx          # 探索-推薦-想法
│   └── IdeasExploreSection.tsx                 # 探索-想法
├── practice/components/
│   ├── PracticeRecommendationSection.tsx       # 探索-推薦-實踐
│   └── PracticeExploreSection.tsx              # 探索-實踐
└── projects/components/
    ├── ProjectsRecommendationSection.tsx       # 探索-推薦-計劃
    └── ProjectsExploreSection.tsx              # 探索-計劃
```

### 4. 首頁檔案結構設計

```
pages/
├── home/                                       # 首頁資料夾
│   └── index.tsx                              # 包含所有首頁相關組件
```

**pages/home/index.tsx 完整結構**：
```tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/Auth';
import { Plus } from 'lucide-react';

// 從各 features 引入組件
import { IdeasRecommendationSection, IdeasExploreSection } from '@/features/ideas/components';
import { PracticeRecommendationSection, PracticeExploreSection } from '@/features/practice/components';
import { ProjectsRecommendationSection, ProjectsExploreSection } from '@/features/projects/components';

// 內部組件：標籤導航
function ContentTabs({ tabs, activeTab, onTabChange }) {
  // 標籤導航實作
}

// 內部組件：內容顯示
function ContentDisplay({ contentType }) {
  // 根據 contentType 顯示對應內容
}

// 內部組件：混合推薦
function MixedRecommendationSection() {
  return (
    <div className="space-y-8">
      <IdeasRecommendationSection />
      <PracticeRecommendationSection />
      <ProjectsRecommendationSection />
    </div>
  );
}

// 內部組件：浮動創建按鈕
function FloatingCreateButton() {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);

  const createOptions = [
    { label: '想法', path: '/ideas/create', icon: '💡' },
    { label: '主題實踐', path: '/practice/create', icon: '🎯' },
    { label: '學習計劃', path: '/projects/create', icon: '📋' },
  ];

  const handleCreate = (path: string) => {
    router.push(path);
    setShowMenu(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* 創建選項選單 */}
      {showMenu && (
        <div className="absolute bottom-16 right-0 bg-white rounded-lg shadow-lg border p-2 min-w-[160px]">
          {createOptions.map((option) => (
            <button
              key={option.label}
              onClick={() => handleCreate(option.path)}
              className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 rounded-md"
            >
              <span className="text-lg">{option.icon}</span>
              <span className="text-sm font-medium">{option.label}</span>
            </button>
          ))}
        </div>
      )}
      
      {/* 主創建按鈕 */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="bg-primary-600 hover:bg-primary-700 text-white rounded-full p-4 shadow-lg transition-colors"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
}

// 內部組件：功能開發中
function ComingSoonMessage({ feature }) {
  return (
    <div className="text-center py-16">
      <h2 className="text-2xl font-bold mb-4">{feature} 功能開發中</h2>
      <p className="text-gray-500">敬請期待！</p>
    </div>
  );
}

// 未登入首頁
function LandingPage() {
  // 產品介紹、特色功能、註冊引導
}

// 登入後儀表板
function PersonalDashboard() {
  const router = useRouter();
  const [currentMainTab, setCurrentMainTab] = useState('探索');
  const [currentContentTab, setCurrentContentTab] = useState('推薦');

  // 處理資源跳轉
  useEffect(() => {
    if (currentMainTab === '資源') {
      router.push('/resource');
    }
  }, [currentMainTab, router]);

  // 處理交流功能
  if (currentMainTab === '交流') {
    return <ComingSoonMessage feature="交流" />;
  }

  // 探索內容
  return (
    <div className="min-h-screen bg-basic-100 relative">
      <ContentTabs 
        tabs={['推薦', '主題實踐', '學習計劃', '想法']}
        activeTab={currentContentTab}
        onTabChange={setCurrentContentTab}
      />
      <ContentDisplay contentType={currentContentTab} />
      
      {/* 浮動創建按鈕 */}
      <FloatingCreateButton />
    </div>
  );
}

// 主頁面組件（預設導出）
export default function HomePage() {
  const { isLogin } = useAuth();
  
  return isLogin 
    ? <PersonalDashboard />
    : <LandingPage />
}
```


### 5. 實作步驟

#### Phase 1: 建立 Services 層推薦系統 (遵循專案架構)
1. **創建 services/recommendation 模組**
   - 實作 `services/recommendation/core/` 基礎架構
   - 使用 Zod 定義 recommendation schema
   - 實作 API 介面定義和 SWR hooks
   - 遵循現有 services/resources 的架構模式

2. **推薦算法和資料整合**
   - 跨模組內容整合 (ideas + practice + projects + resources)
   - 實作三種情境的推薦邏輯 (explore/social/resource)
   - 設計推薦評分和快取機制

#### Phase 2: 建立三層架構基礎  
1. **重構 PersonalDashboard 為三層架構**
   - 創建 `ContentTabs` 組件 (使用 shadcn/ui)
   - 創建 `ContentDisplay` 組件處理動態路由
   - 使用 Tailwind CSS 設計響應式佈局
   - 避免使用 Material-UI 或 emotion

2. **建立導航狀態管理**
   - 實作 `useContentNavigation` hook 處理三層狀態
   - URL 同步邏輯，支援瀏覽器前進後退
   - 使用 TypeScript 嚴格模式定義所有型別

#### Phase 3: 各 Feature 實作推薦組件
1. **各 Feature 添加推薦組件**
   - 在 ideas/practice/projects 各自創建 RecommendationSection 組件
   - 使用 services/recommendation 提供的 hooks
   - 各組件過濾和展示自己類型的推薦內容

2. **Home Feature 整合組件**
   - 創建 `MixedRecommendationSection` 整合各 feature 推薦組件
   - 使用 shadcn/ui + Tailwind CSS 建立統一佈局
   - 使用 Lucide React 圖示系統

#### Phase 4: 各 Feature 實作探索組件
1. **Ideas Feature 實作**
   - `IdeasRecommendationSection`: 過濾推薦 API 中的 idea 類型內容
   - `IdeasExploreSection`: 使用現有 services/ideas API

2. **Practice Feature 實作**
   - `PracticeRecommendationSection`: 過濾推薦 API 中的 practice 類型內容
   - `PracticeExploreSection`: 遵循現有 practice hooks 模式

3. **Projects Feature 實作**
   - `ProjectsRecommendationSection`: 過濾推薦 API 中的 project 類型內容
   - `ProjectsExploreSection`: 基於現有 projects API

#### Phase 5: 整合與優化 (遵循專案規範)
1. **代碼品質確保**
   - 執行 ESLint 檢查，修復所有 linting 問題
   - TypeScript 類型檢查，避免使用 any
   - 確保所有組件使用 shadcn/ui 和 Tailwind CSS

2. **效能與 SSG/SSR 整合**
   - 支援 Next.js SSG，考慮 Cloudflare Pages 限制 (不使用 ISR)
   - SWR fallback 數據整合，提升首次載入體驗
   - 實作適當的 SEO 優化和 JSON-LD 結構化數據

3. **測試與部署準備**
   - 各 feature 獨立測試，確保無循環依賴
   - 整合測試三層導航和資料流
   - 準備 Cloudflare Pages 部署配置

### 6. 技術重點

- **遵循專案架構**：services 層處理 API，features 提供組件，pages 負責組裝
- **UI 技術棧**：使用 shadcn/ui + Tailwind CSS，避免 Material-UI
- **狀態管理**：使用 SWR 處理資料獲取，React State 管理 UI 狀態
- **推薦系統**：只在探索模式下使用，由 services/recommendation 提供 API


### 7. 預期效益

- **架構清晰**：三層結構邏輯分明，易於維護
- **功能模組化**：各 feature 獨立開發，符合專案架構
- **用戶體驗提升**：探索模式有推薦內容，資源直接跳轉，交流待開發
- **開發效率高**：職責分離，代碼複用，測試便利