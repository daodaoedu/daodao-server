# 使用者追蹤與資料記錄規劃文件

**文件版本**: 1.0
**建立日期**: 2025-12-18
**專案**: DaoDao Server - 使用者追蹤系統
**相關需求**: [demand.md](./demand.md)

---

## 目錄

1. [執行摘要](#執行摘要)
2. [當前使用者資料記錄狀態](#當前使用者資料記錄狀態)
3. [追蹤缺口分析](#追蹤缺口分析)
4. [建議新增追蹤項目](#建議新增追蹤項目)
5. [實施優先級與階段](#實施優先級與階段)
6. [技術實作規格](#技術實作規格)
7. [隱私與合規考量](#隱私與合規考量)
8. [成效評估指標](#成效評估指標)

---

## 執行摘要

### 當前狀態
DaoDao Server 目前已建立完整的使用者基本資料系統與初步分析功能:
- **15+ 個使用者相關資料表**涵蓋個人檔案、偏好、活動記錄
- **統計分析服務** (`user-stats-service.ts`) 提供註冊與活躍度分析
- **事件記錄基礎架構**已建立但未完整實作(僅 logging,未儲存至資料庫)
- **活躍度判定**基於 `updated_at` 時間戳(過去 30 天內更新)

### 主要發現
1. ✅ **優勢**: 完善的使用者個人資料與偏好記錄
2. ✅ **優勢**: 實習目標(practice)追蹤機制成熟
3. ⚠️ **缺口**: 使用者行為事件未持久化儲存
4. ⚠️ **缺口**: 缺乏頁面瀏覽與功能使用追蹤
5. ⚠️ **缺口**: 使用者旅程與漏斗分析資料不足
6. ⚠️ **缺口**: 裝置與平台資訊記錄不完整

### 建議方向
建議分 3 階段實施完整的使用者追蹤系統:
- **階段 1** (短期): 完善事件追蹤基礎架構
- **階段 2** (中期): 建立使用者行為分析系統
- **階段 3** (長期): 打造預測性分析與個人化推薦

---

## 當前使用者資料記錄狀態

### 1. 核心使用者資料 (Prisma Schema)

#### 1.1 使用者主表 (`users` - 行 734-798)
```typescript
// 儲存位置: prisma/schema.prisma
table users {
  // 身份識別
  id: number (PK)
  external_id: string (UUID)
  mongo_id: string?
  custom_id: string?  // 使用者自訂 ID

  // 個人資料
  nickname: string
  gender: enum (male/female/other)
  birth_date: DateTime?
  language: string?
  education_stage: enum (university/high/other)
  professional_field: string?
  personal_slogan: string?

  // 狀態與權限
  is_active: boolean
  verified: boolean
  is_open_profile: boolean

  // 時間戳
  created_at: DateTime
  updated_at: DateTime
  deleted_at: DateTime?
}
```

**關聯資料表**:
- `contacts` - 聯絡資訊(email, photo_url, 社群媒體)
- `location` - 地理位置(city, is_open_location)
- `user_profiles` - 擴展檔案(bio, skills[], interests[])
- `basic_info` - 自我介紹、分享清單、想做清單

#### 1.2 使用者偏好與興趣
```typescript
// user_preferences 表 (行 676-690)
{
  user_id: FK
  is_selected: boolean
  preference_weight: number
  last_accessed_at: DateTime
  access_count: number
}

// user_interests 表 (行 985-997)
{
  user_id: FK
  category_id: FK
  created_at: DateTime
  updated_at: DateTime
}
```

**追蹤能力**:
- ✅ 偏好選擇與權重
- ✅ 最後訪問時間
- ✅ 訪問次數
- ❌ 缺乏偏好變更歷史

#### 1.3 使用者活動記錄

**Practice(實習目標)追蹤** (`practices` + `practice_checkins`):
```typescript
// practices 表 (行 367-392)
{
  user_id: FK
  streak: number          // 當前連續天數
  max_streak: number      // 最高連續天數
  last_checkin_date: DateTime
  current_progress: number
}

// practice_checkins 表 (行 346-364)
{
  practice_id: FK
  checkin_date: DateTime
  progress_amount: number
  mood: enum (awesome/happy/neutral/tired/frustrated)
  reflection_text: string?
  streak_day: number
  cumulative_progress: number
}
```

**追蹤能力**:
- ✅ 每日簽到記錄
- ✅ 情緒追蹤
- ✅ 進度累積
- ✅ 連續性計算
- ❌ 缺乏放棄原因追蹤

**內容互動記錄**:
- `post` (專案里程碑)
- `ideas` (使用者想法)
- `comments` (評論)
- `likes` (按讚)
- `resource_review` (資源評價與評分)

**追蹤能力**:
- ✅ 基本互動資料(create/update 時間)
- ❌ 缺乏互動深度分析(閱讀時間、捲動深度)

#### 1.4 社群參與
```typescript
// user_join_group 表 (行 646-656)
{
  user_id: FK
  group_id: FK
  role: enum (Initiator/Participant)
  created_at: DateTime
  updated_at: DateTime
}
```

**追蹤能力**:
- ✅ 群組角色
- ✅ 加入時間
- ❌ 缺乏群組活躍度追蹤
- ❌ 缺乏退出群組記錄

---

### 2. 現有統計分析功能

#### 2.1 概覽統計 (`getOverviewStats()`)
**檔案**: `src/services/user-stats-service.ts` (行 27-85)

```typescript
interface OverviewStatsResponse {
  totalUsers: number              // 總使用者數
  newUsersThisMonth: number       // 本月新增使用者
  newUsersLastMonth: number       // 上月新增使用者
  growthRate: number              // 成長率 (%)
  activeUsers: number             // 活躍使用者 (30天內)
  activeRate: number              // 活躍率 (%)
}
```

**活躍度判定邏輯**:
```typescript
// 基於 updated_at 時間戳
WHERE updated_at >= NOW() - INTERVAL '30 days'
```

**限制**:
- ⚠️ `updated_at` 會被任何欄位更新觸發,不代表真實使用者活動
- ⚠️ 無法區分「輕度活躍」vs「重度活躍」
- ⚠️ 無法追蹤特定功能的使用頻率

#### 2.2 註冊統計 (`getRegistrationStats()`)
**檔案**: `src/services/user-stats-service.ts` (行 90-156)

**分群維度**:
- 時間: Day / Week / Month / Year
- 人口統計: Location / Role / Education Stage

**輸出格式**:
```typescript
{
  label: string        // 時間標籤或分類名稱
  count: number        // 使用者數量
  percentage: number   // 佔比 (%)
}[]
```

**優勢**:
- ✅ 靈活的時間分組
- ✅ 多維度人口統計分析
- ✅ 支援日期範圍篩選

**限制**:
- ❌ 無法追蹤註冊來源 (organic/referral/campaign)
- ❌ 無法追蹤註冊漏斗 (開始註冊 → 完成註冊)

#### 2.3 活躍度統計 (`getActivityStats()`)
**檔案**: `src/services/user-stats-service.ts` (行 396-458)

```typescript
interface ActivityStatsResponse {
  activeUsers: number      // 活躍使用者數
  inactiveUsers: number    // 不活躍使用者數
  activeRate: number       // 活躍率 (%)
  breakdown: {
    label: string
    activeCount: number
    inactiveCount: number
    activeRate: number
  }[]
}
```

**分群維度**:
- Role (角色)
- Location (地理位置)
- Education Stage (教育階段)

**優勢**:
- ✅ 可自訂活躍天數閾值 (預設 30 天)
- ✅ 多維度細分

**限制**:
- ❌ 無法追蹤活躍度趨勢 (DAU/WAU/MAU)
- ❌ 無法分析留存率 (Retention)
- ❌ 無法追蹤流失風險使用者

---

### 3. 事件記錄基礎架構

#### 3.1 Practice 事件服務 (`practice-event.service.ts`)
**檔案**: `src/services/practice-event.service.ts` (行 1-150)

**已定義事件類型**:
```typescript
// 1. 瀏覽事件
{
  event: 'practice_view'
  practiceId: string
  userId: string?
  duration: number        // 停留時間 (秒)
  referrer: string?       // 來源頁面
  timestamp: Date
}

// 2. 點擊事件
{
  event: 'practice_click'
  practiceId: string
  userId: string?
  elementId: string       // 被點擊的元素
  position: { x, y }      // 點擊位置
  timestamp: Date
}

// 3. 分享事件
{
  event: 'practice_share'
  practiceId: string
  userId: string
  platform: string        // facebook/twitter/line/copy
  timestamp: Date
}

// 4. 收藏事件
{
  event: 'practice_favorite'
  practiceId: string
  userId: string
  action: 'add' | 'remove'
  timestamp: Date
}
```

**⚠️ 關鍵限制**:
```typescript
// 目前僅記錄到 console.log
console.log(`[${event.event}]`, event);

// TODO: 需要實作
// 1. 儲存到 events 資料表
// 2. 批次寫入機制
// 3. 事件查詢 API
```

#### 3.2 請求記錄中介層 (`logging.middleware.ts`)
**檔案**: `src/middleware/logging.middleware.ts`

**記錄內容**:
```typescript
{
  requestId: string (UUID)
  userId: number?
  method: string (GET/POST/PUT/DELETE)
  url: string
  query: object
  ip: string
  userAgent: string
  statusCode: number
  responseTime: number (ms)
  timestamp: Date
}
```

**資料清理**:
- ✅ 自動清理密碼、token、secret
- ✅ 敏感端點 (login/register) 不記錄 request body

**限制**:
- ❌ 記錄到 console,未持久化
- ❌ 無法進行歷史查詢與分析
- ❌ 無法追蹤使用者完整操作路徑

---

### 4. 臨時使用者系統

#### 4.1 Temp Users 機制
**資料表**: `temp_users` (行 636-644)

```typescript
{
  id: number (PK)
  google_id: string
  email: string
  name: string?
  photo_url: string?
  created_at: DateTime
  updated_at: DateTime
}
```

**轉換流程**:
1. Google OAuth 登入 → 建立 `temp_users` 記錄
2. 使用者填寫完整資料 → POST `/api/v1/users`
3. 資料轉移到 `users` 表 → 刪除 `temp_users` 記錄

**追蹤限制**:
- ❌ 無法追蹤臨時使用者停留時間
- ❌ 無法分析臨時 → 正式使用者轉換率
- ❌ 無法追蹤臨時使用者流失原因

---

## 追蹤缺口分析

### 缺口 1: 使用者行為事件持久化 ❌
**現況**: 事件僅記錄到 console,無法查詢與分析
**影響**:
- 無法分析使用者操作路徑
- 無法識別高價值使用者行為模式
- 無法追蹤功能採用率

**需求**:
- 建立 `user_events` 資料表
- 實作批次寫入機制
- 提供事件查詢 API

---

### 缺口 2: 頁面瀏覽與導航追蹤 ❌
**現況**: 無頁面瀏覽記錄,無法分析使用者旅程
**影響**:
- 無法了解使用者在網站上的移動路徑
- 無法識別導航問題與用戶流失點
- 無法優化內容排列與功能位置

**需求**:
- 記錄頁面瀏覽事件(URL, referrer, duration)
- 追蹤頁面跳出率與深度
- 分析使用者旅程漏斗

---

### 缺口 3: 功能使用深度追蹤 ⚠️
**現況**: 只知道功能「是否被使用」,不知道「如何被使用」
**影響**:
- 無法判斷功能真實價值
- 無法優化功能體驗
- 無法識別 Power Users

**需求**:
- 追蹤功能使用頻率與時長
- 記錄互動深度(閱讀百分比、捲動深度)
- 分析功能組合使用模式

---

### 缺口 4: 真實活躍度定義不精確 ⚠️
**現況**: 基於 `updated_at`,任何欄位更新都算「活躍」
**影響**:
- 活躍度數據不準確
- 無法區分輕度/重度使用者
- 無法預測流失風險

**需求**:
- 定義「有意義的活動」(Meaningful Activity)
- 實作 DAU/WAU/MAU 計算
- 建立留存率(Retention)追蹤

---

### 缺口 5: 使用者旅程與漏斗分析 ❌
**現況**: 無法追蹤使用者從註冊到核心行為的轉換
**影響**:
- 無法優化新手引導流程
- 無法識別流失關鍵節點
- 無法評估功能發現率

**需求**:
- 定義關鍵使用者旅程(User Journey)
- 建立漏斗轉換率追蹤
- 實作世代分析(Cohort Analysis)

---

### 缺口 6: 裝置與平台資訊不完整 ⚠️
**現況**: 僅記錄 User Agent string,未結構化儲存
**影響**:
- 無法按裝置類型分析行為差異
- 無法優化跨平台體驗
- 無法追蹤特定瀏覽器問題

**需求**:
- 解析並儲存裝置類型(Desktop/Mobile/Tablet)
- 記錄作業系統與版本
- 記錄瀏覽器與版本
- 追蹤螢幕解析度

---

### 缺口 7: 推薦與個人化系統資料 ❌
**現況**: 無歷史互動資料支持推薦演算法
**影響**:
- 無法提供個人化內容推薦
- 無法預測使用者興趣變化
- 無法提升內容發現效率

**需求**:
- 記錄內容互動向量(瀏覽/點擊/收藏/分享)
- 建立使用者興趣模型
- 追蹤推薦效果(點擊率/轉換率)

---

### 缺口 8: A/B 測試與實驗追蹤 ❌
**現況**: 無實驗分組與效果追蹤機制
**影響**:
- 無法科學驗證功能改進效果
- 無法進行對照組實驗
- 無法量化產品決策成效

**需求**:
- 建立實驗分組機制
- 追蹤實驗組行為差異
- 計算統計顯著性

---

## 建議新增追蹤項目

### 類別 1: 使用者基本資訊擴充

#### 1.1 裝置與平台資訊
```typescript
// 新增資料表: user_devices
interface UserDevice {
  id: number;
  user_id: number;

  // 裝置識別
  device_id: string;              // 唯一裝置識別碼
  device_fingerprint: string;     // 瀏覽器指紋

  // 裝置資訊
  device_type: 'Desktop' | 'Mobile' | 'Tablet';
  os: string;                     // 作業系統
  os_version: string;
  browser: string;                // 瀏覽器
  browser_version: string;
  screen_resolution: string;      // 如 "1920x1080"

  // 網路資訊
  ip_address: string;
  country: string;
  city: string;
  timezone: string;

  // 狀態
  is_active: boolean;             // 當前是否活躍
  first_seen_at: DateTime;
  last_seen_at: DateTime;
  created_at: DateTime;
  updated_at: DateTime;
}
```

**實作方式**:
- 使用 `ua-parser-js` 解析 User Agent
- 使用 `fingerprintjs` 生成裝置指紋
- 使用 `geoip-lite` 解析 IP 地理位置

#### 1.2 註冊來源追蹤
```typescript
// 新增欄位到 users 表
interface UserRegistrationSource {
  // UTM 參數
  utm_source?: string;            // 來源 (google/facebook/email)
  utm_medium?: string;            // 媒介 (cpc/social/email)
  utm_campaign?: string;          // 活動名稱
  utm_content?: string;           // 內容標識
  utm_term?: string;              // 關鍵字

  // 推薦來源
  referrer_url?: string;          // HTTP Referrer
  referrer_user_id?: number;      // 推薦人 ID (如果有推薦機制)
  landing_page?: string;          // 首次訪問頁面

  // 其他
  registration_ip: string;
  registration_device_id: string;
}
```

#### 1.3 使用者生命週期狀態
```typescript
// 新增欄位到 users 表
interface UserLifecycleStatus {
  lifecycle_stage: 'new' | 'active' | 'at_risk' | 'churned' | 'resurrected';
  lifecycle_stage_updated_at: DateTime;

  // 重要里程碑
  first_practice_created_at?: DateTime;
  first_post_created_at?: DateTime;
  first_comment_at?: DateTime;
  first_review_at?: DateTime;

  // 活躍度指標
  last_active_at: DateTime;       // 最後有意義的活動時間
  days_since_last_active: number; // 計算欄位
  total_active_days: number;      // 累積活躍天數
}
```

---

### 類別 2: 使用者行為事件追蹤

#### 2.1 通用事件資料表
```typescript
// 新增資料表: user_events
interface UserEvent {
  id: bigint;                     // 大量資料,使用 bigint

  // 事件識別
  event_id: string;               // UUID
  event_type: string;             // 事件類型 (page_view/click/scroll...)
  event_category: string;         // 事件分類 (navigation/engagement/transaction)

  // 使用者資訊
  user_id?: number;               // 可為空 (匿名使用者)
  session_id: string;             // 會話 ID
  device_id: string;              // 裝置 ID

  // 事件詳情
  properties: JSONB;              // 靈活的事件屬性
  page_url: string;
  page_title?: string;
  referrer_url?: string;

  // 時間與位置
  event_timestamp: DateTime;
  timezone: string;

  // 索引欄位
  created_at: DateTime;

  // 索引建議
  INDEX idx_user_events_user_id (user_id)
  INDEX idx_user_events_event_type (event_type)
  INDEX idx_user_events_timestamp (event_timestamp)
  INDEX idx_user_events_session (session_id)
}
```

#### 2.2 頁面瀏覽事件
```typescript
// event_type: 'page_view'
interface PageViewEvent {
  event_type: 'page_view';
  properties: {
    page_path: string;            // /practices/123
    page_category: string;         // practice/resource/dashboard

    // 停留時間
    time_on_page: number;         // 秒數

    // 捲動行為
    max_scroll_depth: number;     // 最大捲動百分比 (0-100)
    scroll_events: number;        // 捲動次數

    // 互動
    clicks: number;               // 頁面上點擊次數
    form_interactions: number;    // 表單互動次數

    // 離開方式
    exit_type: 'navigation' | 'close' | 'timeout';
  };
}
```

#### 2.3 功能使用事件
```typescript
// event_type: 'feature_use'
interface FeatureUseEvent {
  event_type: 'feature_use';
  properties: {
    feature_name: string;         // practice_checkin/resource_review/post_create
    feature_category: string;     // core/social/content

    // 使用詳情
    action: string;               // create/update/delete/view
    success: boolean;
    error_message?: string;

    // 互動深度
    steps_completed: number;      // 完成步驟數
    total_steps: number;          // 總步驟數
    time_spent: number;           // 花費時間 (秒)

    // 上下文
    entry_point: string;          // 功能入口 (dashboard/search/recommendation)
    related_entity_id?: string;   // 相關實體 ID
  };
}
```

#### 2.4 內容互動事件
```typescript
// event_type: 'content_interaction'
interface ContentInteractionEvent {
  event_type: 'content_interaction';
  properties: {
    content_type: 'practice' | 'resource' | 'post' | 'idea';
    content_id: string;

    // 互動類型
    interaction_type: 'view' | 'like' | 'favorite' | 'share' | 'comment';

    // 互動深度
    time_spent: number;           // 停留時間 (秒)
    completion_rate?: number;     // 完成率 (0-100)

    // 互動來源
    discovery_method: 'search' | 'recommendation' | 'profile' | 'feed' | 'direct';
    position_in_list?: number;    // 在列表中的位置

    // 後續行為
    converted: boolean;           // 是否產生轉換 (如加入 practice)
    conversion_type?: string;
  };
}
```

#### 2.5 搜尋行為事件
```typescript
// event_type: 'search'
interface SearchEvent {
  event_type: 'search';
  properties: {
    search_query: string;
    search_category?: string;     // practice/resource/user

    // 搜尋結果
    results_count: number;
    results_shown: number;

    // 使用者行為
    clicked_position?: number;    // 點擊第幾個結果
    clicked_item_id?: string;
    time_to_click?: number;       // 搜尋後多久點擊 (秒)

    // 搜尋修正
    refinement: boolean;          // 是否修改搜尋
    previous_query?: string;

    // 結果品質
    zero_results: boolean;
    abandoned: boolean;           // 搜尋後直接離開
  };
}
```

---

### 類別 3: 會話 (Session) 追蹤

#### 3.1 會話資料表
```typescript
// 新增資料表: user_sessions
interface UserSession {
  id: bigint;

  // 會話識別
  session_id: string;             // UUID
  user_id?: number;               // 可為空
  device_id: string;

  // 會話時間
  session_start: DateTime;
  session_end?: DateTime;
  duration_seconds?: number;      // 計算欄位

  // 會話活動
  page_views: number;
  events_count: number;

  // 會話來源
  entry_page: string;
  exit_page?: string;
  referrer_url?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;

  // 裝置資訊
  device_type: string;
  browser: string;
  os: string;
  ip_address: string;
  country?: string;
  city?: string;

  // 會話品質
  bounce: boolean;                // 是否跳出 (僅 1 頁)
  converted: boolean;             // 是否有轉換行為
  conversion_type?: string;

  created_at: DateTime;
  updated_at: DateTime;

  INDEX idx_sessions_user (user_id)
  INDEX idx_sessions_start (session_start)
  INDEX idx_sessions_device (device_id)
}
```

**會話定義**:
- 30 分鐘無活動視為會話結束
- 午夜 (00:00) 自動切換新會話
- 來源改變 (UTM 參數) 視為新會話

---

### 類別 4: 使用者活躍度與留存

#### 4.1 每日活躍度快照
```typescript
// 新增資料表: user_activity_daily
interface UserActivityDaily {
  id: bigint;

  user_id: number;
  activity_date: Date;            // 只記錄日期,不含時間

  // 活動指標
  sessions_count: number;
  total_time_spent: number;       // 總時長 (秒)
  page_views: number;

  // 功能使用
  practices_checked_in: number;
  posts_created: number;
  comments_created: number;
  reviews_created: number;
  resources_viewed: number;

  // 互動指標
  likes_given: number;
  shares_count: number;
  favorites_added: number;

  // 資料品質
  is_active_day: boolean;         // 是否算作「活躍日」
  activity_score: number;         // 活躍度評分 (0-100)

  created_at: DateTime;

  UNIQUE (user_id, activity_date)
  INDEX idx_activity_date (activity_date)
  INDEX idx_activity_user_date (user_id, activity_date)
}
```

**活躍日判定規則**:
```typescript
// 以下任一條件視為活躍日
- practice_checkin 至少 1 次
- 停留時間 >= 5 分鐘
- 頁面瀏覽 >= 3 頁
- 創建內容 (post/comment/review)
```

#### 4.2 留存率追蹤表
```typescript
// 新增資料表: user_cohorts
interface UserCohort {
  id: number;

  cohort_date: Date;              // 註冊日期 (週/月)
  cohort_size: number;            // 該批次使用者數

  // 留存數據 (N 天後仍活躍的使用者數)
  day_1_retention: number;
  day_3_retention: number;
  day_7_retention: number;
  day_14_retention: number;
  day_30_retention: number;
  day_60_retention: number;
  day_90_retention: number;

  created_at: DateTime;
  updated_at: DateTime;

  UNIQUE (cohort_date)
}
```

---

### 類別 5: 漏斗與轉換追蹤

#### 5.1 轉換漏斗定義
```typescript
// 新增資料表: conversion_funnels
interface ConversionFunnel {
  id: number;

  funnel_name: string;            // onboarding/practice_creation/review_submission
  funnel_category: string;

  // 漏斗步驟 (JSON Array)
  steps: {
    step_order: number;
    step_name: string;
    event_type: string;           // 對應的事件類型
    required: boolean;
  }[];

  is_active: boolean;
  created_at: DateTime;
  updated_at: DateTime;
}

// 範例: Onboarding 漏斗
{
  funnel_name: 'user_onboarding',
  steps: [
    { step_order: 1, step_name: 'Google OAuth', event_type: 'auth_google_callback', required: true },
    { step_order: 2, step_name: 'Profile Form View', event_type: 'page_view:/complete-profile', required: true },
    { step_order: 3, step_name: 'Profile Submitted', event_type: 'feature_use:profile_create', required: true },
    { step_order: 4, step_name: 'First Practice Created', event_type: 'feature_use:practice_create', required: false }
  ]
}
```

#### 5.2 漏斗進度追蹤
```typescript
// 新增資料表: user_funnel_progress
interface UserFunnelProgress {
  id: bigint;

  user_id: number;
  funnel_id: number;
  session_id?: string;

  // 進度
  current_step: number;
  completed_steps: number[];      // [1, 2, 3]
  is_completed: boolean;
  is_abandoned: boolean;

  // 時間追蹤
  started_at: DateTime;
  completed_at?: DateTime;
  abandoned_at?: DateTime;
  time_to_complete?: number;      // 完成所需時間 (秒)

  // 放棄原因
  abandon_step?: number;          // 在哪一步放棄
  abandon_reason?: string;

  created_at: DateTime;
  updated_at: DateTime;

  INDEX idx_funnel_user (user_id, funnel_id)
  INDEX idx_funnel_status (funnel_id, is_completed, is_abandoned)
}
```

---

### 類別 6: 推薦系統支援資料

#### 6.1 內容互動向量
```typescript
// 新增資料表: user_content_interactions
interface UserContentInteraction {
  id: bigint;

  user_id: number;
  content_type: string;
  content_id: string;

  // 互動權重
  view_count: number;             // 瀏覽次數
  view_duration_total: number;    // 總瀏覽時長 (秒)
  click_count: number;
  like_count: number;             // 按讚次數 (可反悔)
  favorite_count: number;
  share_count: number;
  comment_count: number;

  // 互動評分 (計算欄位)
  interaction_score: number;      // 綜合評分 (0-100)

  // 時間衰減
  first_interaction_at: DateTime;
  last_interaction_at: DateTime;
  recency_score: number;          // 時間衰減評分

  created_at: DateTime;
  updated_at: DateTime;

  UNIQUE (user_id, content_type, content_id)
  INDEX idx_interactions_user (user_id, interaction_score DESC)
}
```

**評分計算公式**:
```typescript
interaction_score = (
  view_count * 1 +
  view_duration_total / 60 * 2 +
  click_count * 3 +
  like_count * 5 +
  favorite_count * 8 +
  share_count * 10 +
  comment_count * 12
) * recency_score

recency_score = 1 / (1 + days_since_last_interaction / 7)
```

#### 6.2 使用者興趣向量
```typescript
// 新增資料表: user_interest_vectors
interface UserInterestVector {
  id: number;

  user_id: number;

  // 分類興趣 (JSONB)
  category_scores: {
    [category_id: string]: number  // 0-100
  };

  // 標籤興趣 (JSONB)
  tag_scores: {
    [tag_id: string]: number       // 0-100
  };

  // 內容類型偏好
  content_type_preference: {
    practice: number;
    resource: number;
    post: number;
    idea: number;
  };

  // 更新時間
  last_calculated_at: DateTime;

  created_at: DateTime;
  updated_at: DateTime;

  UNIQUE (user_id)
}
```

---

### 類別 7: A/B 測試與實驗

#### 7.1 實驗定義
```typescript
// 新增資料表: experiments
interface Experiment {
  id: number;

  experiment_key: string;         // unique identifier
  experiment_name: string;
  description: string;

  // 實驗狀態
  status: 'draft' | 'running' | 'completed' | 'archived';

  // 實驗設定
  variants: {
    variant_key: string;          // control / variant_a / variant_b
    variant_name: string;
    allocation_percentage: number; // 流量分配 (%)
    config: JSONB;                // 變體配置
  }[];

  // 目標指標
  primary_metric: string;
  secondary_metrics: string[];

  // 時間範圍
  start_date: DateTime;
  end_date?: DateTime;

  // 流量控制
  target_audience?: string;       // 目標受眾篩選條件 (SQL/JSON)
  traffic_percentage: number;     // 參與實驗的流量 (%)

  created_by: number;
  created_at: DateTime;
  updated_at: DateTime;

  UNIQUE (experiment_key)
}
```

#### 7.2 實驗分配
```typescript
// 新增資料表: experiment_assignments
interface ExperimentAssignment {
  id: bigint;

  experiment_id: number;
  user_id?: number;
  device_id: string;              // 未登入使用者用裝置 ID

  variant_key: string;            // 分配到的變體

  // 分配資訊
  assigned_at: DateTime;
  assignment_method: 'random' | 'targeted';

  // 是否暴露 (看到實驗內容)
  exposed: boolean;
  exposed_at?: DateTime;

  created_at: DateTime;

  UNIQUE (experiment_id, user_id)
  UNIQUE (experiment_id, device_id)
  INDEX idx_exp_variant (experiment_id, variant_key)
}
```

#### 7.3 實驗指標記錄
```typescript
// 新增資料表: experiment_metrics
interface ExperimentMetric {
  id: bigint;

  experiment_id: number;
  assignment_id: bigint;

  metric_name: string;
  metric_value: number;

  recorded_at: DateTime;

  INDEX idx_exp_metrics (experiment_id, metric_name)
}
```

---

## 實施優先級與階段

### 階段 1: 基礎建設 (短期 - 1-2 個月)
**目標**: 建立完整的事件追蹤基礎架構

#### P0 - 關鍵任務

**1.1 建立事件儲存系統**
- [ ] 建立 `user_events` 資料表
- [ ] 實作事件批次寫入服務 (每 5 秒或 100 筆觸發)
- [ ] 整合現有 `practice-event.service.ts` 到新資料表
- [ ] 實作事件查詢 API (by user_id, event_type, date range)
- [ ] 設定資料保留政策 (熱資料 90 天,冷資料 1 年)

**預期成效**:
- ✅ 事件持久化儲存
- ✅ 可查詢歷史行為
- ✅ 為後續分析打基礎

**技術選型**:
- 使用 PostgreSQL JSONB 欄位儲存 properties
- 使用 Bull Queue 實作批次寫入
- 考慮使用 TimescaleDB 擴充處理時序資料

---

**1.2 會話追蹤機制**
- [ ] 建立 `user_sessions` 資料表
- [ ] 實作會話管理中介層
  - 會話 ID 生成 (基於 Cookie/JWT)
  - 會話開始/結束偵測
  - 會話活動更新 (page views, events)
- [ ] 實作會話超時邏輯 (30 分鐘無活動)
- [ ] 記錄會話來源 (referrer, UTM)

**預期成效**:
- ✅ 追蹤使用者完整訪問旅程
- ✅ 計算準確的停留時間
- ✅ 識別跳出率與轉換

**技術實作**:
```typescript
// middleware/session-tracking.middleware.ts
export function sessionTracking(req, res, next) {
  // 1. 從 Cookie 或生成新 session_id
  let sessionId = req.cookies.session_id;
  if (!sessionId) {
    sessionId = uuid();
    res.cookie('session_id', sessionId, { maxAge: 30 * 60 * 1000 });
  }

  // 2. 記錄會話活動
  req.sessionId = sessionId;

  // 3. 更新會話最後活動時間
  SessionService.updateActivity(sessionId);

  next();
}
```

---

**1.3 裝置識別與追蹤**
- [ ] 建立 `user_devices` 資料表
- [ ] 整合 `ua-parser-js` 解析 User Agent
- [ ] 實作裝置指紋生成 (使用 fingerprintjs)
- [ ] 關聯裝置與使用者 (跨裝置追蹤)

**預期成效**:
- ✅ 識別跨裝置使用者
- ✅ 分析裝置類型對行為的影響
- ✅ 偵測異常登入裝置

---

#### P1 - 重要任務

**1.4 核心事件埋點**
- [ ] 頁面瀏覽事件 (`page_view`)
  - 頁面 URL, title, referrer
  - 停留時間計算
  - 捲動深度追蹤
- [ ] 功能使用事件 (`feature_use`)
  - Practice check-in
  - Resource review
  - Post/Comment 創建
- [ ] 內容互動事件 (`content_interaction`)
  - Like, Favorite, Share
  - View duration

**實作方式**:
- 後端埋點: 在 Controller 層呼叫 EventService
- 前端埋點: 使用前端 SDK (如 analytics.js)

---

**1.5 活躍度重新定義**
- [ ] 建立 `user_activity_daily` 資料表
- [ ] 實作每日活動聚合 Job (每日 02:00 執行)
- [ ] 定義「有意義的活動」規則
- [ ] 計算 DAU/WAU/MAU 指標
- [ ] 更新使用者 `last_active_at` 欄位

**活躍日判定邏輯**:
```typescript
function isActiveDay(dailyActivity: UserActivityDaily): boolean {
  return (
    dailyActivity.practices_checked_in >= 1 ||
    dailyActivity.total_time_spent >= 300 || // 5 分鐘
    dailyActivity.page_views >= 3 ||
    dailyActivity.posts_created + dailyActivity.comments_created > 0
  );
}
```

---

### 階段 2: 分析能力 (中期 - 2-4 個月)
**目標**: 建立使用者行為分析與洞察系統

#### P0 - 關鍵任務

**2.1 使用者旅程分析**
- [ ] 建立轉換漏斗定義 (`conversion_funnels`)
- [ ] 定義關鍵漏斗:
  - Onboarding 漏斗 (註冊 → 完整資料 → 首次 Practice)
  - Practice 創建漏斗 (瀏覽 → 選擇 → 創建 → 首次 Check-in)
  - Resource 使用漏斗 (發現 → 瀏覽 → 評價)
- [ ] 實作漏斗追蹤服務
- [ ] 計算各步驟轉換率
- [ ] 識別流失關鍵節點

**預期成效**:
- ✅ 識別使用者流失點
- ✅ 優化關鍵轉換路徑
- ✅ 提升功能採用率

---

**2.2 留存率分析**
- [ ] 建立 `user_cohorts` 資料表
- [ ] 實作世代分析 (Cohort Analysis)
- [ ] 計算 D1/D3/D7/D14/D30 留存率
- [ ] 視覺化留存曲線
- [ ] 預測流失風險使用者

**世代分組方式**:
- 按註冊週/月分組
- 按首次功能使用時間分組
- 按使用者屬性分組 (location, education_stage)

---

**2.3 搜尋行為分析**
- [ ] 實作搜尋事件追蹤
- [ ] 分析熱門搜尋詞
- [ ] 計算零結果搜尋率
- [ ] 追蹤搜尋後點擊行為
- [ ] 優化搜尋結果排序

**關鍵指標**:
- 搜尋成功率 (點擊 / 總搜尋)
- 平均搜尋修正次數
- 零結果搜尋比例
- 搜尋放棄率

---

#### P1 - 重要任務

**2.4 使用者細分 (Segmentation)**
- [ ] 基於行為的自動分群
  - Power Users (高頻率高深度)
  - Casual Users (低頻率)
  - At-risk Users (活躍度下降)
  - Churned Users (已流失)
- [ ] 基於價值的分群 (RFM 模型)
  - Recency: 最近活動時間
  - Frequency: 活動頻率
  - Engagement: 互動深度
- [ ] 動態更新使用者分群

---

**2.5 內容效能分析**
- [ ] 建立內容指標儀表板
- [ ] 追蹤內容瀏覽 → 互動 → 轉換
- [ ] 識別高效能內容特徵
- [ ] 分析內容衰退趨勢

**關鍵指標**:
- View-to-Engage Rate (瀏覽 → 按讚/收藏)
- Engage-to-Convert Rate (互動 → 加入 Practice)
- 平均停留時間
- 完成率 (捲動到底部)

---

### 階段 3: 智慧化應用 (長期 - 4-6 個月)
**目標**: 打造預測性分析與個人化推薦

#### P0 - 關鍵任務

**3.1 個人化推薦系統**
- [ ] 建立使用者興趣向量 (`user_interest_vectors`)
- [ ] 建立內容互動向量 (`user_content_interactions`)
- [ ] 實作協同過濾演算法
- [ ] 實作基於內容的推薦
- [ ] 混合推薦策略
- [ ] 追蹤推薦效果 (CTR, Conversion)

**推薦場景**:
- 首頁推薦 Practices
- 相關 Resources
- 可能感興趣的使用者

---

**3.2 流失預測模型**
- [ ] 定義流失標準 (如 30 天無活動)
- [ ] 提取預測特徵:
  - 活躍度趨勢
  - 功能使用頻率變化
  - 社交互動減少
  - 會話時長下降
- [ ] 訓練流失預測模型 (Logistic Regression/XGBoost)
- [ ] 識別高風險使用者
- [ ] 觸發挽留策略 (Email, Push)

---

**3.3 A/B 測試平台**
- [ ] 建立實驗管理系統
  - `experiments` 表
  - `experiment_assignments` 表
  - `experiment_metrics` 表
- [ ] 實作流量分配服務
- [ ] 實作指標計算引擎
- [ ] 計算統計顯著性 (Chi-square, T-test)
- [ ] 實驗結果儀表板

**測試場景**:
- Onboarding 流程優化
- 功能位置與文案測試
- 推薦演算法對比

---

#### P1 - 重要任務

**3.4 使用者生命週期管理 (Lifecycle Marketing)**
- [ ] 自動化使用者生命週期分類
- [ ] 針對不同階段的自動化觸發:
  - **New Users**: Onboarding 引導
  - **Active Users**: 功能發現與深化
  - **At-risk Users**: 喚回活動與優惠
  - **Churned Users**: 贏回 Campaign
- [ ] 整合 Email/Push 通知系統

---

**3.5 預測性分析**
- [ ] 預測使用者未來活躍度
- [ ] 預測功能採用可能性
- [ ] 預測內容互動機率
- [ ] 優化通知時機 (預測最佳推送時間)

---

## 技術實作規格

### 1. 資料庫設計原則

#### 1.1 資料表分層策略
```
Layer 1: 原始事件資料 (Raw Events)
└── user_events (保留 90 天)
    - 大量即時寫入
    - 最小化索引
    - 使用 TimescaleDB 壓縮

Layer 2: 聚合資料 (Aggregated Data)
└── user_activity_daily (保留 2 年)
    - 每日聚合 Job
    - 優化查詢效能

Layer 3: 指標快照 (Metrics Snapshots)
└── user_cohorts, conversion_funnel_stats
    - 預計算指標
    - 儀表板快速讀取
```

#### 1.2 索引策略
```sql
-- user_events 表
CREATE INDEX idx_events_user_time ON user_events (user_id, event_timestamp DESC);
CREATE INDEX idx_events_type_time ON user_events (event_type, event_timestamp DESC);
CREATE INDEX idx_events_session ON user_events (session_id);

-- 使用 BRIN 索引優化大表時間查詢
CREATE INDEX idx_events_timestamp_brin ON user_events USING BRIN (event_timestamp);

-- 部分索引優化常見查詢
CREATE INDEX idx_events_logged_in_users ON user_events (user_id, event_timestamp)
WHERE user_id IS NOT NULL;
```

#### 1.3 資料分割 (Partitioning)
```sql
-- 按月分割 user_events 表
CREATE TABLE user_events (
  -- columns...
) PARTITION BY RANGE (event_timestamp);

CREATE TABLE user_events_2025_01 PARTITION OF user_events
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- 自動化分割管理
-- 使用 pg_partman 擴充自動建立未來分割
```

#### 1.4 資料保留政策
```typescript
// 資料保留策略
const RETENTION_POLICIES = {
  user_events: {
    hot: 90,        // 90 天熱資料 (快速查詢)
    warm: 365,      // 1 年溫資料 (壓縮儲存)
    cold: 1095,     // 3 年冷資料 (歸檔)
    delete: true    // 3 年後刪除
  },
  user_sessions: {
    hot: 90,
    delete: 730     // 2 年後刪除
  },
  user_activity_daily: {
    retention: 1095 // 保留 3 年
  }
};

// 自動化清理 Job (每週執行)
async function cleanupOldData() {
  await db.query(`
    DELETE FROM user_events
    WHERE event_timestamp < NOW() - INTERVAL '3 years'
  `);
}
```

---

### 2. 事件收集架構

#### 2.1 事件收集流程
```
[Client/Server]
    ↓
[Event Collector Middleware]
    ↓ (非同步)
[Event Queue (Bull/Redis)]
    ↓ (批次處理)
[Event Processor Worker]
    ↓
[PostgreSQL/TimescaleDB]
    ↓
[Daily Aggregation Job]
    ↓
[Analytics Tables]
```

#### 2.2 事件收集器實作
```typescript
// src/services/event-collector.service.ts
import { Queue, Worker } from 'bullmq';
import { Redis } from 'ioredis';

interface Event {
  event_id: string;
  event_type: string;
  event_category: string;
  user_id?: number;
  session_id: string;
  device_id: string;
  properties: Record<string, unknown>;
  page_url: string;
  referrer_url?: string;
  event_timestamp: Date;
  timezone: string;
}

class EventCollectorService {
  private eventQueue: Queue;

  constructor() {
    const redis = new Redis({
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT),
    });

    this.eventQueue = new Queue('events', { connection: redis });
    this.setupWorker();
  }

  // 收集事件 (非同步,不阻塞主流程)
  async track(event: Omit<Event, 'event_id' | 'event_timestamp'>): Promise<void> {
    const fullEvent: Event = {
      event_id: uuid(),
      event_timestamp: new Date(),
      ...event,
    };

    await this.eventQueue.add('track', fullEvent, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });
  }

  // Worker 處理事件批次寫入
  private setupWorker() {
    const worker = new Worker('events', async (job) => {
      const events = [job.data]; // 可改為批次收集

      await this.batchInsertEvents(events);
    });
  }

  private async batchInsertEvents(events: Event[]) {
    const query = `
      INSERT INTO user_events (
        event_id, event_type, event_category, user_id, session_id,
        device_id, properties, page_url, referrer_url, event_timestamp, timezone
      ) VALUES ${events.map((_, i) =>
        `($${i * 11 + 1}, $${i * 11 + 2}, $${i * 11 + 3}, $${i * 11 + 4}, $${i * 11 + 5},
         $${i * 11 + 6}, $${i * 11 + 7}, $${i * 11 + 8}, $${i * 11 + 9}, $${i * 11 + 10}, $${i * 11 + 11})`
      ).join(', ')}
    `;

    const values = events.flatMap(e => [
      e.event_id, e.event_type, e.event_category, e.user_id, e.session_id,
      e.device_id, JSON.stringify(e.properties), e.page_url, e.referrer_url,
      e.event_timestamp, e.timezone
    ]);

    await db.query(query, values);
  }
}

export const eventCollector = new EventCollectorService();
```

#### 2.3 事件追蹤中介層
```typescript
// src/middleware/event-tracking.middleware.ts
import { eventCollector } from '@services/event-collector.service';

export function eventTracking(req: Request, res: Response, next: NextFunction) {
  // 記錄頁面瀏覽事件
  if (req.method === 'GET') {
    eventCollector.track({
      event_type: 'page_view',
      event_category: 'navigation',
      user_id: req.user?.id,
      session_id: req.sessionId,
      device_id: req.deviceId,
      properties: {
        page_path: req.path,
        query_params: req.query,
      },
      page_url: req.originalUrl,
      referrer_url: req.headers.referer,
      timezone: req.headers['x-timezone'] || 'UTC',
    });
  }

  // 記錄 API 呼叫事件 (非 GET)
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    const startTime = Date.now();

    res.on('finish', () => {
      eventCollector.track({
        event_type: 'api_call',
        event_category: 'action',
        user_id: req.user?.id,
        session_id: req.sessionId,
        device_id: req.deviceId,
        properties: {
          method: req.method,
          endpoint: req.path,
          status_code: res.statusCode,
          duration_ms: Date.now() - startTime,
        },
        page_url: req.originalUrl,
        timezone: req.headers['x-timezone'] || 'UTC',
      });
    });
  }

  next();
}
```

---

### 3. 每日聚合 Job

#### 3.1 每日活動聚合
```typescript
// src/jobs/daily-activity-aggregation.job.ts
import { CronJob } from 'cron';
import { db } from '@services/database.service';

class DailyActivityAggregationJob {
  constructor() {
    // 每天凌晨 02:00 執行
    new CronJob('0 2 * * *', this.aggregateDailyActivity.bind(this), null, true);
  }

  async aggregateDailyActivity() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];

    console.log(`[Job] Aggregating daily activity for ${dateStr}`);

    await db.query(`
      INSERT INTO user_activity_daily (
        user_id, activity_date,
        sessions_count, total_time_spent, page_views,
        practices_checked_in, posts_created, comments_created, reviews_created,
        resources_viewed, likes_given, shares_count, favorites_added,
        is_active_day, activity_score
      )
      SELECT
        user_id,
        $1::date AS activity_date,
        COUNT(DISTINCT session_id) AS sessions_count,
        SUM(CASE WHEN event_type = 'page_view'
            THEN (properties->>'time_on_page')::int ELSE 0 END) AS total_time_spent,
        COUNT(CASE WHEN event_type = 'page_view' THEN 1 END) AS page_views,

        -- 功能使用統計
        COUNT(CASE WHEN event_type = 'feature_use'
              AND properties->>'feature_name' = 'practice_checkin' THEN 1 END) AS practices_checked_in,
        COUNT(CASE WHEN event_type = 'feature_use'
              AND properties->>'feature_name' = 'post_create' THEN 1 END) AS posts_created,
        COUNT(CASE WHEN event_type = 'feature_use'
              AND properties->>'feature_name' = 'comment_create' THEN 1 END) AS comments_created,
        COUNT(CASE WHEN event_type = 'feature_use'
              AND properties->>'feature_name' = 'review_create' THEN 1 END) AS reviews_created,

        -- 內容互動統計
        COUNT(CASE WHEN event_type = 'content_interaction'
              AND properties->>'content_type' = 'resource' THEN 1 END) AS resources_viewed,
        COUNT(CASE WHEN event_type = 'content_interaction'
              AND properties->>'interaction_type' = 'like' THEN 1 END) AS likes_given,
        COUNT(CASE WHEN event_type = 'content_interaction'
              AND properties->>'interaction_type' = 'share' THEN 1 END) AS shares_count,
        COUNT(CASE WHEN event_type = 'content_interaction'
              AND properties->>'interaction_type' = 'favorite' THEN 1 END) AS favorites_added,

        -- 活躍度判定
        CASE
          WHEN COUNT(CASE WHEN event_type = 'feature_use'
                     AND properties->>'feature_name' = 'practice_checkin' THEN 1 END) >= 1 THEN true
          WHEN SUM(CASE WHEN event_type = 'page_view'
                   THEN (properties->>'time_on_page')::int ELSE 0 END) >= 300 THEN true
          WHEN COUNT(CASE WHEN event_type = 'page_view' THEN 1 END) >= 3 THEN true
          WHEN COUNT(CASE WHEN event_type = 'feature_use'
                     AND properties->>'feature_name' IN ('post_create', 'comment_create') THEN 1 END) > 0 THEN true
          ELSE false
        END AS is_active_day,

        -- 活躍度評分 (0-100)
        LEAST(100, (
          COUNT(DISTINCT session_id) * 10 +
          COUNT(CASE WHEN event_type = 'page_view' THEN 1 END) * 2 +
          COUNT(CASE WHEN event_type = 'feature_use' THEN 1 END) * 15 +
          COUNT(CASE WHEN event_type = 'content_interaction' THEN 1 END) * 5
        )) AS activity_score

      FROM user_events
      WHERE DATE(event_timestamp) = $1::date
        AND user_id IS NOT NULL
      GROUP BY user_id

      ON CONFLICT (user_id, activity_date)
      DO UPDATE SET
        sessions_count = EXCLUDED.sessions_count,
        total_time_spent = EXCLUDED.total_time_spent,
        page_views = EXCLUDED.page_views,
        practices_checked_in = EXCLUDED.practices_checked_in,
        posts_created = EXCLUDED.posts_created,
        comments_created = EXCLUDED.comments_created,
        reviews_created = EXCLUDED.reviews_created,
        resources_viewed = EXCLUDED.resources_viewed,
        likes_given = EXCLUDED.likes_given,
        shares_count = EXCLUDED.shares_count,
        favorites_added = EXCLUDED.favorites_added,
        is_active_day = EXCLUDED.is_active_day,
        activity_score = EXCLUDED.activity_score
    `, [dateStr]);

    console.log(`[Job] Daily activity aggregation completed for ${dateStr}`);
  }
}

export const dailyActivityAggregationJob = new DailyActivityAggregationJob();
```

---

### 4. API 端點設計

#### 4.1 使用者活動查詢 API
```typescript
// GET /api/v1/analytics/users/:userId/activity
interface GetUserActivityQuery {
  startDate: string;      // ISO date
  endDate: string;        // ISO date
  granularity?: 'day' | 'week' | 'month';
}

interface UserActivityResponse {
  userId: number;
  period: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalActiveDays: number;
    avgSessionsPerDay: number;
    avgTimeSpentPerDay: number;
    totalPracticesCheckedIn: number;
    totalContentCreated: number;
    activityScore: number;
  };
  timeline: Array<{
    date: string;
    sessionsCount: number;
    timeSpent: number;
    isActiveDay: boolean;
    activityScore: number;
  }>;
}
```

#### 4.2 漏斗分析 API
```typescript
// GET /api/v1/analytics/funnels/:funnelName
interface FunnelAnalysisQuery {
  startDate: string;
  endDate: string;
  groupBy?: 'device_type' | 'location' | 'education_stage';
}

interface FunnelAnalysisResponse {
  funnelName: string;
  period: { startDate: string; endDate: string };
  overall: {
    totalEntered: number;
    totalCompleted: number;
    completionRate: number;
    avgTimeToComplete: number;  // 秒
  };
  steps: Array<{
    stepOrder: number;
    stepName: string;
    usersEntered: number;
    usersCompleted: number;
    conversionRate: number;
    dropoffRate: number;
    avgTimeToNextStep: number;
  }>;
  breakdown?: Array<{
    segment: string;
    completionRate: number;
    totalCompleted: number;
  }>;
}
```

#### 4.3 留存率查詢 API
```typescript
// GET /api/v1/analytics/retention
interface RetentionQuery {
  cohortType: 'daily' | 'weekly' | 'monthly';
  startDate: string;
  endDate: string;
  retentionDays?: number[];  // 預設 [1, 3, 7, 14, 30]
}

interface RetentionResponse {
  cohorts: Array<{
    cohortDate: string;
    cohortSize: number;
    retention: {
      day1: number;   // 百分比
      day3: number;
      day7: number;
      day14: number;
      day30: number;
    };
  }>;
  average: {
    day1: number;
    day3: number;
    day7: number;
    day14: number;
    day30: number;
  };
}
```

---

### 5. 前端埋點 SDK

#### 5.1 SDK 設計
```typescript
// analytics-sdk.ts
class AnalyticsSDK {
  private sessionId: string;
  private deviceId: string;
  private apiEndpoint: string;
  private queue: Event[] = [];
  private flushInterval = 5000;  // 5 秒批次發送

  constructor(config: { apiEndpoint: string }) {
    this.apiEndpoint = config.apiEndpoint;
    this.sessionId = this.getOrCreateSessionId();
    this.deviceId = this.getOrCreateDeviceId();

    this.setupAutoTracking();
    this.startFlushTimer();
  }

  // 自動追蹤頁面瀏覽
  private setupAutoTracking() {
    // 頁面載入
    window.addEventListener('load', () => {
      this.trackPageView();
    });

    // 單頁應用路由變更 (假設使用 History API)
    const originalPushState = history.pushState;
    history.pushState = (...args) => {
      originalPushState.apply(history, args);
      this.trackPageView();
    };

    // 捲動深度追蹤
    let maxScrollDepth = 0;
    window.addEventListener('scroll', () => {
      const scrollDepth = (window.scrollY + window.innerHeight) / document.body.scrollHeight * 100;
      maxScrollDepth = Math.max(maxScrollDepth, scrollDepth);
    });

    // 頁面離開時記錄停留時間與捲動深度
    const pageLoadTime = Date.now();
    window.addEventListener('beforeunload', () => {
      const timeOnPage = Math.floor((Date.now() - pageLoadTime) / 1000);
      this.track('page_view', {
        time_on_page: timeOnPage,
        max_scroll_depth: Math.round(maxScrollDepth),
      });
      this.flush(); // 立即發送
    });
  }

  // 追蹤事件
  track(eventType: string, properties: Record<string, unknown> = {}) {
    const event = {
      event_id: this.generateUUID(),
      event_type: eventType,
      event_category: this.inferCategory(eventType),
      session_id: this.sessionId,
      device_id: this.deviceId,
      properties,
      page_url: window.location.href,
      referrer_url: document.referrer,
      event_timestamp: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    this.queue.push(event);

    // 立即發送高優先級事件
    if (this.isHighPriorityEvent(eventType)) {
      this.flush();
    }
  }

  // 追蹤頁面瀏覽
  trackPageView() {
    this.track('page_view', {
      page_path: window.location.pathname,
      page_title: document.title,
    });
  }

  // 批次發送事件
  private async flush() {
    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];

    try {
      await fetch(`${this.apiEndpoint}/events/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events }),
      });
    } catch (error) {
      console.error('[Analytics] Failed to send events', error);
      // 失敗的事件放回佇列
      this.queue.unshift(...events);
    }
  }

  private startFlushTimer() {
    setInterval(() => this.flush(), this.flushInterval);
  }

  private getOrCreateSessionId(): string {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = this.generateUUID();
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }

  private getOrCreateDeviceId(): string {
    let deviceId = localStorage.getItem('analytics_device_id');
    if (!deviceId) {
      deviceId = this.generateUUID();
      localStorage.setItem('analytics_device_id', deviceId);
    }
    return deviceId;
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  private inferCategory(eventType: string): string {
    if (eventType.includes('page')) return 'navigation';
    if (eventType.includes('click')) return 'engagement';
    if (eventType.includes('feature')) return 'action';
    return 'other';
  }

  private isHighPriorityEvent(eventType: string): boolean {
    return ['feature_use', 'content_interaction'].includes(eventType);
  }
}

// 初始化 SDK
export const analytics = new AnalyticsSDK({
  apiEndpoint: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1',
});
```

#### 5.2 前端使用範例
```typescript
// 在 React 元件中使用
import { analytics } from '@lib/analytics-sdk';

function PracticeCard({ practice }) {
  const handleCheckIn = async () => {
    // 追蹤功能使用
    analytics.track('feature_use', {
      feature_name: 'practice_checkin',
      feature_category: 'core',
      action: 'create',
      practice_id: practice.id,
    });

    await checkInPractice(practice.id);
  };

  const handleLike = () => {
    analytics.track('content_interaction', {
      content_type: 'practice',
      content_id: practice.id,
      interaction_type: 'like',
    });

    likePractice(practice.id);
  };

  return (
    <div>
      <h3>{practice.title}</h3>
      <button onClick={handleCheckIn}>Check In</button>
      <button onClick={handleLike}>Like</button>
    </div>
  );
}
```

---

## 隱私與合規考量

### 1. GDPR/個資法合規

#### 1.1 使用者同意機制
```typescript
// 新增欄位到 users 表
interface UserPrivacyConsent {
  analytics_consent: boolean;        // 分析追蹤同意
  analytics_consent_date?: DateTime;
  marketing_consent: boolean;        // 行銷同意
  marketing_consent_date?: DateTime;

  // 追蹤選項
  tracking_preferences: {
    essential: boolean;              // 必要 Cookie (無法拒絕)
    analytics: boolean;              // 分析 Cookie
    marketing: boolean;              // 行銷 Cookie
    personalization: boolean;        // 個人化 Cookie
  };
}
```

**實作要點**:
- 首次訪問時顯示 Cookie 橫幅
- 明確說明各類追蹤用途
- 提供隨時撤回同意的選項
- 記錄同意/撤回時間

#### 1.2 資料最小化原則
```typescript
// 只記錄必要資料
const ALLOWED_EVENT_PROPERTIES = {
  page_view: ['page_path', 'page_title', 'time_on_page', 'max_scroll_depth'],
  feature_use: ['feature_name', 'action', 'success'],
  content_interaction: ['content_type', 'content_id', 'interaction_type'],
};

// 過濾敏感資訊
function sanitizeEventProperties(eventType: string, properties: Record<string, unknown>) {
  const allowed = ALLOWED_EVENT_PROPERTIES[eventType] || [];

  return Object.fromEntries(
    Object.entries(properties).filter(([key]) => allowed.includes(key))
  );
}
```

#### 1.3 資料匿名化
```typescript
// IP 地址匿名化
function anonymizeIP(ip: string): string {
  const parts = ip.split('.');
  return `${parts[0]}.${parts[1]}.${parts[2]}.0`;  // 移除最後一組
}

// 使用者 ID 雜湊化 (用於跨系統分析)
function hashUserId(userId: number): string {
  return crypto
    .createHash('sha256')
    .update(userId.toString() + process.env.HASH_SALT)
    .digest('hex')
    .substring(0, 16);
}
```

---

### 2. 資料存取控制

#### 2.1 角色權限
```typescript
// 分析資料存取權限
enum AnalyticsPermission {
  VIEW_OWN_DATA = 'analytics:view:own',           // 一般使用者:查看自己的資料
  VIEW_AGGREGATED = 'analytics:view:aggregated',  // 管理員:查看聚合資料
  VIEW_INDIVIDUAL = 'analytics:view:individual',  // 資料分析師:查看個人資料
  EXPORT_DATA = 'analytics:export',               // 資料匯出權限
  MANAGE_EXPERIMENTS = 'analytics:experiments',   // 管理 A/B 測試
}

// 權限檢查中介層
function requirePermission(permission: AnalyticsPermission) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!req.user.permissions.includes(permission)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    next();
  };
}

// 使用範例
app.get('/api/v1/analytics/users/:userId/activity',
  requirePermission(AnalyticsPermission.VIEW_INDIVIDUAL),
  getUserActivityController
);
```

#### 2.2 資料遮罩
```typescript
// 針對不同角色返回不同細節程度的資料
function maskUserData(user: User, requesterRole: string): Partial<User> {
  if (requesterRole === 'admin') {
    return user;  // 管理員看到完整資料
  }

  if (requesterRole === 'analyst') {
    // 資料分析師看到去識別化資料
    return {
      ...user,
      email: hashEmail(user.email),
      name: '[MASKED]',
      ip_address: anonymizeIP(user.ip_address),
    };
  }

  // 一般使用者只看到聚合統計
  throw new Error('Insufficient permissions');
}
```

---

### 3. 資料主體權利 (GDPR Rights)

#### 3.1 資料可攜權 (Right to Data Portability)
```typescript
// GET /api/v1/users/me/data-export
async function exportUserData(userId: number): Promise<UserDataExport> {
  return {
    profile: await getUserProfile(userId),
    activities: await getUserActivities(userId),
    events: await getUserEvents(userId),
    preferences: await getUserPreferences(userId),
    exportDate: new Date().toISOString(),
    format: 'JSON',
  };
}
```

#### 3.2 被遺忘權 (Right to Erasure)
```typescript
// DELETE /api/v1/users/me
async function deleteUserData(userId: number): Promise<void> {
  // 1. 軟刪除使用者資料
  await db.query('UPDATE users SET deleted_at = NOW() WHERE id = $1', [userId]);

  // 2. 匿名化事件資料 (保留聚合統計)
  await db.query(`
    UPDATE user_events
    SET user_id = NULL,
        properties = properties - 'email' - 'name' - 'phone'
    WHERE user_id = $1
  `, [userId]);

  // 3. 刪除敏感個人資料
  await db.query('DELETE FROM contacts WHERE user_id = $1', [userId]);
  await db.query('DELETE FROM user_devices WHERE user_id = $1', [userId]);

  // 4. 記錄刪除請求
  await db.query(`
    INSERT INTO data_deletion_requests (user_id, requested_at, completed_at)
    VALUES ($1, NOW(), NOW())
  `, [userId]);
}
```

#### 3.3 資料更正權 (Right to Rectification)
```typescript
// PATCH /api/v1/users/me
// 標準的使用者資料更新 API,確保:
// 1. 使用者可以隨時更新自己的資料
// 2. 更新後立即生效於所有分析
// 3. 保留更新歷史記錄
```

---

### 4. 審計日誌

#### 4.1 敏感操作記錄
```typescript
// 新增資料表: audit_logs
interface AuditLog {
  id: bigint;

  actor_user_id: number;          // 執行操作的使用者
  actor_role: string;

  action: string;                 // view_user_data/export_data/delete_user
  resource_type: string;          // user/event/session
  resource_id: string;

  details: JSONB;
  ip_address: string;
  user_agent: string;

  timestamp: DateTime;

  INDEX idx_audit_actor (actor_user_id, timestamp DESC)
  INDEX idx_audit_resource (resource_type, resource_id)
}

// 記錄審計日誌
async function logAudit(audit: Omit<AuditLog, 'id' | 'timestamp'>) {
  await db.query(`
    INSERT INTO audit_logs (
      actor_user_id, actor_role, action, resource_type, resource_id,
      details, ip_address, user_agent, timestamp
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
  `, [
    audit.actor_user_id, audit.actor_role, audit.action,
    audit.resource_type, audit.resource_id,
    JSON.stringify(audit.details), audit.ip_address, audit.user_agent
  ]);
}

// 使用範例
app.get('/api/v1/analytics/users/:userId/activity', async (req, res) => {
  // ... 權限檢查 ...

  // 記錄資料存取
  await logAudit({
    actor_user_id: req.user.id,
    actor_role: req.user.role,
    action: 'view_user_activity',
    resource_type: 'user',
    resource_id: req.params.userId,
    details: { query: req.query },
    ip_address: req.ip,
    user_agent: req.headers['user-agent'],
  });

  const activity = await getUserActivity(req.params.userId, req.query);
  res.json(activity);
});
```

---

## 成效評估指標

### 階段 1 成功指標 (基礎建設)

#### 技術指標
- [ ] 事件收集成功率 >= 99.5%
- [ ] 事件處理延遲 < 10 秒 (P95)
- [ ] 批次寫入效能 >= 10,000 events/秒
- [ ] 資料庫查詢效能 < 500ms (P95)

#### 資料品質指標
- [ ] 事件完整性 >= 99% (無遺失欄位)
- [ ] 會話識別準確率 >= 95%
- [ ] 裝置識別準確率 >= 90%

#### 覆蓋率指標
- [ ] 核心功能埋點覆蓋率 = 100%
- [ ] 核心頁面瀏覽追蹤覆蓋率 = 100%
- [ ] API 端點追蹤覆蓋率 >= 80%

---

### 階段 2 成功指標 (分析能力)

#### 洞察產出
- [ ] 識別 Top 3 使用者流失節點
- [ ] 建立 5+ 個關鍵漏斗分析
- [ ] 完成 3+ 個使用者細分群體定義
- [ ] 產出月度留存率報告

#### 業務影響
- [ ] Onboarding 完成率提升 >= 10%
- [ ] D7 留存率提升 >= 5%
- [ ] 功能採用率提升 >= 15%

#### 團隊採用
- [ ] 產品經理每週查看分析儀表板
- [ ] 每月至少 1 次基於資料的功能優化
- [ ] 資料驅動決策比例 >= 50%

---

### 階段 3 成功指標 (智慧化應用)

#### 推薦系統效能
- [ ] 推薦內容點擊率 >= 5%
- [ ] 推薦轉換率 >= 2%
- [ ] 推薦覆蓋率 >= 80% (使用者有被推薦內容)

#### 流失預測準確度
- [ ] 流失預測精確率 >= 70%
- [ ] 流失預測召回率 >= 60%
- [ ] 挽留活動轉換率 >= 10%

#### A/B 測試效率
- [ ] 每月執行 A/B 測試數量 >= 3
- [ ] 統計顯著性達成時間 < 14 天
- [ ] 測試結果採納率 >= 80%

---

## 附錄

### A. 參考資料

#### A.1 技術文件
- [PostgreSQL Partitioning](https://www.postgresql.org/docs/current/ddl-partitioning.html)
- [TimescaleDB Documentation](https://docs.timescale.com/)
- [Bull Queue Documentation](https://docs.bullmq.io/)
- [ua-parser-js](https://github.com/faisalman/ua-parser-js)
- [fingerprintjs](https://github.com/fingerprintjs/fingerprintjs)

#### A.2 分析方法論
- [AARRR Metrics (Pirate Metrics)](https://www.productplan.com/glossary/aarrr-framework/)
- [Cohort Analysis Best Practices](https://mixpanel.com/blog/cohort-analysis/)
- [Funnel Analysis Guide](https://amplitude.com/blog/funnel-analysis)
- [RFM Analysis](https://en.wikipedia.org/wiki/RFM_(market_research))

#### A.3 隱私合規
- [GDPR Official Text](https://gdpr-info.eu/)
- [台灣個人資料保護法](https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=I0050021)
- [Cookie 同意最佳實踐](https://www.cookiebot.com/en/gdpr-cookies/)

---

### B. 詞彙表

| 術語 | 定義 |
|------|------|
| **DAU/WAU/MAU** | Daily/Weekly/Monthly Active Users (日/週/月活躍使用者) |
| **Retention Rate** | 留存率,衡量使用者持續使用產品的比例 |
| **Cohort** | 世代,在同一時間註冊/首次使用的使用者群體 |
| **Funnel** | 漏斗,使用者達成目標的步驟流程與轉換率 |
| **Churn** | 流失,使用者停止使用產品 |
| **Session** | 會話,使用者在一段時間內的連續訪問 |
| **Event** | 事件,使用者的單一行為動作 |
| **Bounce Rate** | 跳出率,只瀏覽 1 頁就離開的訪問比例 |
| **CTR** | Click-Through Rate (點擊率) |
| **Conversion Rate** | 轉換率,完成目標行為的使用者比例 |

---

### C. 變更記錄

| 版本 | 日期 | 變更內容 | 作者 |
|------|------|----------|------|
| 1.0 | 2025-12-18 | 初版文件建立 | Claude |

---

## 總結

本規劃文件全面分析了 DaoDao Server 當前的使用者資料記錄現狀,識別了 8 大追蹤缺口,並提出了完整的三階段實施計畫。

**關鍵要點**:
1. ✅ **現有優勢**: 完善的使用者個人資料與 Practice 追蹤機制
2. ⚠️ **核心缺口**: 事件持久化、行為分析、使用者旅程追蹤
3. 🎯 **優先任務**: 建立事件儲存系統、會話追蹤、活躍度重新定義
4. 📊 **長期目標**: 打造預測性分析與個人化推薦能力

**下一步行動**:
1. 審查本文件,確認技術選型與實施優先級
2. 評估資源與時程安排
3. 啟動階段 1 開發工作
4. 建立資料治理與隱私合規流程

透過系統化的使用者追蹤與分析,DaoDao 將能夠深入了解使用者行為,持續優化產品體驗,最終提升使用者價值與平台成長。
