# DaoDao 平台 GA + Clarity 追蹤系統 SQL 表格改善計畫

## 📋 現有表格分析與問題識別

### 現有追蹤表格狀況

#### 1. view 表（360_create_table_view.sql）
```sql
CREATE TABLE "view" (
    "id" SERIAL PRIMARY KEY,
    "user_id" INT NOT NULL,
    "target_type" VARCHAR(20) NOT NULL 
        CHECK ("target_type" IN ('project','post', 'resource','note','outcome','review', 'circle', 'idea','portfolio')),
    "target_id" INT NOT NULL,
    "duration" INT,  -- 停留時間（秒）
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("user_id") REFERENCES "users"("id"),
    UNIQUE ("user_id", "target_type", "target_id")
);
```

**問題：**
- ❌ UNIQUE 限制過嚴：不允許同一用戶多次瀏覽同一內容
- ❌ 缺乏設備資訊、瀏覽器資訊
- ❌ 缺乏頁面路徑、來源頁面資訊
- ❌ 缺乏滾動深度、退出意圖等 UX 指標

#### 2. click 表（380_create_table_click.sql）
```sql
CREATE TABLE "click" (
    "id" SERIAL PRIMARY KEY,
    "user_id" INT NOT NULL,
    "target_type" VARCHAR(20) NOT NULL 
        CHECK ("target_type" IN ('project','post', 'resource','note','outcome','review', 'circle', 'idea','portfolio')),
    "target_id" INT NOT NULL,
    "click_position" VARCHAR(50),  -- 如點擊區域、元素名稱等
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("user_id") REFERENCES "users"("id"),
    UNIQUE ("user_id", "target_type", "target_id")
);
```

**問題：**
- ❌ UNIQUE 限制：不允許同一用戶多次點擊同一內容
- ❌ 缺乏座標資訊 (x, y)
- ❌ 缺乏元素選擇器、元素文字
- ❌ 缺乏點擊類型分類（正常點擊 vs rage click）
- ✅ 已有 click_position 欄位，但定義不夠詳細

#### 3. reaction 表（340_create_table_reaction.sql）
```sql
CREATE TABLE "reaction" (
    "id" SERIAL PRIMARY KEY,
    "user_id" INT NOT NULL,
    "target_type" VARCHAR(20) NOT NULL 
        CHECK ("target_type" IN ('project','post', 'resource','note','outcome','review', 'circle', 'idea','portfolio')),
    "target_id" INT NOT NULL,
    "reaction_type" reaction_type NOT NULL,
    "weight" INT DEFAULT 1,  -- 為不同反應賦予不同權重
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE ("user_id", "target_type", "target_id", "reaction_type"),
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
);
```

**優點與改善建議：**
- ✅ 已有權重系統設計
- ✅ UNIQUE 限制合理（每種反應類型只能有一個）
- ❌ reaction_type ENUM 過於簡單，僅支持 'like'
- 🔄 建議擴展：'love', 'laugh', 'wow', 'sad', 'angry', 'care'

## 🆕 新增表格規劃

### 1. 會話管理表（核心）
```sql
-- 新增：統一會話管理表
CREATE TABLE "user_session" (
    "id" SERIAL PRIMARY KEY,
    "session_id" VARCHAR(255) UNIQUE NOT NULL,
    "user_id" INT,
    "ip_address" INET,
    "user_agent" TEXT,
    "device_type" VARCHAR(20) CHECK ("device_type" IN ('mobile', 'tablet', 'desktop')),
    "browser" VARCHAR(50),
    "os" VARCHAR(50),
    "screen_resolution" VARCHAR(20),
    "viewport_size" VARCHAR(20),
    "referrer" VARCHAR(500),
    "landing_page" VARCHAR(500),
    "current_page" VARCHAR(500),
    "start_time" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "last_activity" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "end_time" TIMESTAMPTZ,
    "duration" INT, -- 總時長（秒）
    "page_views" INT DEFAULT 0,
    "interactions" INT DEFAULT 0,
    "is_active" BOOLEAN DEFAULT TRUE,
    "is_bounce" BOOLEAN DEFAULT FALSE,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
);

CREATE INDEX idx_user_session_user_id ON "user_session"("user_id");
CREATE INDEX idx_user_session_active ON "user_session"("is_active", "last_activity");
CREATE INDEX idx_user_session_time ON "user_session"("start_time", "end_time");
```

### 2. 熱力圖資料表
```sql
CREATE TABLE "heatmap_data" (
    "id" SERIAL PRIMARY KEY,
    "session_id" VARCHAR(255) NOT NULL,
    "user_id" INT,
    "page_url" VARCHAR(500) NOT NULL,
    "page_title" VARCHAR(200),
    "heatmap_type" VARCHAR(20) NOT NULL 
        CHECK ("heatmap_type" IN ('click', 'scroll', 'movement', 'attention')),
    "coordinates_x" INT NOT NULL,
    "coordinates_y" INT NOT NULL,
    "viewport_width" INT NOT NULL,
    "viewport_height" INT NOT NULL,
    "scroll_depth" FLOAT, -- 滾動深度百分比
    "element_selector" VARCHAR(500),
    "element_tag" VARCHAR(50),
    "element_text" TEXT,
    "element_class" VARCHAR(200),
    "element_id" VARCHAR(100),
    "click_count" INT DEFAULT 1, -- 為 rage click 預備
    "dwell_time" INT, -- 停留時間（毫秒）
    "device_type" VARCHAR(20),
    "timestamp" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("user_id") REFERENCES "users"("id"),
    FOREIGN KEY ("session_id") REFERENCES "user_session"("session_id")
);

CREATE INDEX idx_heatmap_page_type ON "heatmap_data"("page_url", "heatmap_type");
CREATE INDEX idx_heatmap_session ON "heatmap_data"("session_id");
CREATE INDEX idx_heatmap_coordinates ON "heatmap_data"("coordinates_x", "coordinates_y");
```

### 3. 使用者挫折事件表
```sql
CREATE TABLE "frustration_event" (
    "id" SERIAL PRIMARY KEY,
    "session_id" VARCHAR(255) NOT NULL,
    "user_id" INT,
    "event_type" VARCHAR(30) NOT NULL 
        CHECK ("event_type" IN ('rage_click', 'excessive_scroll', 'quick_back', 'dead_click', 'error_click', 'slow_response', 'form_abandonment', 'search_refinement')),
    "page_url" VARCHAR(500) NOT NULL,
    "page_title" VARCHAR(200),
    "element_selector" VARCHAR(500),
    "element_position_x" INT,
    "element_position_y" INT,
    "element_text" TEXT,
    "element_type" VARCHAR(50), -- button, link, input, etc.
    "intensity" INT CHECK ("intensity" BETWEEN 1 AND 10),
    "sequence_number" INT, -- 在會話中的順序
    "time_on_page" INT, -- 當時頁面停留時間
    "scroll_depth" FLOAT, -- 當時滾動深度
    "previous_action" VARCHAR(100),
    "next_action" VARCHAR(100),
    "context_data" JSONB, -- 額外上下文資訊
    "is_resolved" BOOLEAN DEFAULT FALSE, -- 挫折是否得到解決
    "resolution_time" INT, -- 解決時間（秒）
    "timestamp" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("user_id") REFERENCES "users"("id"),
    FOREIGN KEY ("session_id") REFERENCES "user_session"("session_id")
);

CREATE INDEX idx_frustration_type ON "frustration_event"("event_type");
CREATE INDEX idx_frustration_page ON "frustration_event"("page_url");
CREATE INDEX idx_frustration_session ON "frustration_event"("session_id");
```

### 4. 詳細頁面瀏覽表
```sql
-- 新增：詳細頁面瀏覽記錄（補充現有 view 表）
CREATE TABLE "page_view_detailed" (
    "id" SERIAL PRIMARY KEY,
    "session_id" VARCHAR(255) NOT NULL,
    "user_id" INT,
    "page_url" VARCHAR(500) NOT NULL,
    "page_title" VARCHAR(200),
    "page_path" VARCHAR(200),
    "referrer" VARCHAR(500),
    "referrer_domain" VARCHAR(100),
    "utm_source" VARCHAR(100),
    "utm_medium" VARCHAR(100),
    "utm_campaign" VARCHAR(100),
    "entry_time" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "exit_time" TIMESTAMPTZ,
    "duration" INT, -- 停留時間（秒）
    "max_scroll_depth" FLOAT, -- 最大滾動深度
    "scroll_events" INT DEFAULT 0,
    "click_events" INT DEFAULT 0,
    "form_interactions" INT DEFAULT 0,
    "is_bounce" BOOLEAN DEFAULT FALSE,
    "is_exit_page" BOOLEAN DEFAULT FALSE,
    "engagement_score" FLOAT, -- 參與度評分
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("user_id") REFERENCES "users"("id"),
    FOREIGN KEY ("session_id") REFERENCES "user_session"("session_id")
);

CREATE INDEX idx_page_view_detailed_session ON "page_view_detailed"("session_id");
CREATE INDEX idx_page_view_detailed_url ON "page_view_detailed"("page_url");
CREATE INDEX idx_page_view_detailed_time ON "page_view_detailed"("entry_time", "exit_time");
```

### 5. 詳細點擊事件表
```sql
-- 新增：詳細點擊事件表（補充現有 click 表）
CREATE TABLE "click_event_detailed" (
    "id" SERIAL PRIMARY KEY,
    "session_id" VARCHAR(255) NOT NULL,
    "user_id" INT,
    "page_url" VARCHAR(500) NOT NULL,
    "target_type" VARCHAR(20), -- 可選，與現有 click 表整合
    "target_id" INT, -- 可選，與現有 click 表整合
    "click_type" VARCHAR(20) DEFAULT 'normal' 
        CHECK ("click_type" IN ('normal', 'rage', 'dead', 'double', 'right')),
    "coordinates_x" INT NOT NULL,
    "coordinates_y" INT NOT NULL,
    "element_selector" VARCHAR(500),
    "element_tag" VARCHAR(50),
    "element_text" TEXT,
    "element_class" VARCHAR(200),
    "element_id" VARCHAR(100),
    "button_type" VARCHAR(20), -- left, right, middle
    "is_successful" BOOLEAN DEFAULT TRUE, -- 點擊是否成功
    "time_to_click" INT, -- 從頁面載入到點擊的時間
    "sequence_in_session" INT, -- 在會話中的順序
    "viewport_width" INT,
    "viewport_height" INT,
    "timestamp" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("user_id") REFERENCES "users"("id"),
    FOREIGN KEY ("session_id") REFERENCES "user_session"("session_id")
);

CREATE INDEX idx_click_event_detailed_session ON "click_event_detailed"("session_id");
CREATE INDEX idx_click_event_detailed_coords ON "click_event_detailed"("coordinates_x", "coordinates_y");
CREATE INDEX idx_click_event_detailed_element ON "click_event_detailed"("element_selector");
```

### 6. 會話重播資料表
```sql
CREATE TABLE "session_recording" (
    "id" SERIAL PRIMARY KEY,
    "session_id" VARCHAR(255) UNIQUE NOT NULL,
    "user_id" INT,
    "recording_status" VARCHAR(20) DEFAULT 'active' 
        CHECK ("recording_status" IN ('active', 'paused', 'completed', 'error')),
    "start_time" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "end_time" TIMESTAMPTZ,
    "duration" INT, -- 總時長（秒）
    "page_count" INT DEFAULT 0,
    "event_count" INT DEFAULT 0,
    "error_count" INT DEFAULT 0,
    "frustration_events" INT DEFAULT 0,
    "user_agent" TEXT,
    "screen_resolution" VARCHAR(20),
    "viewport_size" VARCHAR(20),
    "initial_url" VARCHAR(500),
    "referrer" VARCHAR(500),
    "is_mobile" BOOLEAN DEFAULT FALSE,
    "privacy_level" VARCHAR(20) DEFAULT 'masked' 
        CHECK ("privacy_level" IN ('full', 'masked', 'anonymous')),
    "recording_data" JSONB, -- 壓縮後的重播資料
    "data_size" INT, -- 資料大小（bytes）
    "compression_ratio" FLOAT, -- 壓縮率
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("user_id") REFERENCES "users"("id"),
    FOREIGN KEY ("session_id") REFERENCES "user_session"("session_id")
);

CREATE INDEX idx_session_recording_user ON "session_recording"("user_id");
CREATE INDEX idx_session_recording_time ON "session_recording"("start_time");
CREATE INDEX idx_session_recording_status ON "session_recording"("recording_status");
```

## 🔧 現有表格擴展建議

### 1. view 表擴展
```sql
-- 建議新增欄位（使用 ALTER TABLE）
ALTER TABLE "view" 
ADD COLUMN "session_id" VARCHAR(255),
ADD COLUMN "page_url" VARCHAR(500),
ADD COLUMN "referrer" VARCHAR(500),
ADD COLUMN "device_type" VARCHAR(20),
ADD COLUMN "browser" VARCHAR(50),
ADD COLUMN "viewport_size" VARCHAR(20),
ADD COLUMN "scroll_depth" FLOAT DEFAULT 0,
ADD COLUMN "engagement_time" INT DEFAULT 0, -- 實際互動時間
ADD COLUMN "exit_intent" BOOLEAN DEFAULT FALSE;

-- 新增索引
CREATE INDEX idx_view_session ON "view"("session_id");
CREATE INDEX idx_view_page_url ON "view"("page_url");
CREATE INDEX idx_view_device ON "view"("device_type");

-- 移除原有 UNIQUE 限制（如果需要）
ALTER TABLE "view" DROP CONSTRAINT IF EXISTS "view_user_id_target_type_target_id_key";
```

### 2. click 表擴展
```sql
-- 建議新增欄位
ALTER TABLE "click" 
ADD COLUMN "session_id" VARCHAR(255),
ADD COLUMN "page_url" VARCHAR(500),
ADD COLUMN "coordinates_x" INT,
ADD COLUMN "coordinates_y" INT,
ADD COLUMN "element_selector" VARCHAR(500),
ADD COLUMN "element_text" TEXT,
ADD COLUMN "click_type" VARCHAR(20) DEFAULT 'normal',
ADD COLUMN "is_successful" BOOLEAN DEFAULT TRUE,
ADD COLUMN "sequence_number" INT;

-- 新增索引
CREATE INDEX idx_click_session ON "click"("session_id");
CREATE INDEX idx_click_coordinates ON "click"("coordinates_x", "coordinates_y");
CREATE INDEX idx_click_type ON "click"("click_type");

-- 移除原有 UNIQUE 限制
ALTER TABLE "click" DROP CONSTRAINT IF EXISTS "click_user_id_target_type_target_id_key";
```

### 3. 為所有追蹤表格新增 session_id
```sql
-- 為現有表格新增 session_id 外鍵關係
ALTER TABLE "view" 
ADD CONSTRAINT fk_view_session 
FOREIGN KEY ("session_id") REFERENCES "user_session"("session_id");

ALTER TABLE "click" 
ADD CONSTRAINT fk_click_session 
FOREIGN KEY ("session_id") REFERENCES "user_session"("session_id");

ALTER TABLE "reaction" 
ADD COLUMN "session_id" VARCHAR(255),
ADD CONSTRAINT fk_reaction_session 
FOREIGN KEY ("session_id") REFERENCES "user_session"("session_id");

ALTER TABLE "favorite" 
ADD COLUMN "session_id" VARCHAR(255),
ADD CONSTRAINT fk_favorite_session 
FOREIGN KEY ("session_id") REFERENCES "user_session"("session_id");

ALTER TABLE "share" 
ADD COLUMN "session_id" VARCHAR(255),
ADD CONSTRAINT fk_share_session 
FOREIGN KEY ("session_id") REFERENCES "user_session"("session_id");
```

## 📈 實作優先級與策略

### Phase 1: 立即實作（基礎建設）
1. **user_session 表**：會話管理基礎
2. **heatmap_data 表**：熱力圖數據收集
3. **frustration_event 表**：挫折事件識別
4. **現有表格擴展**：session_id 欄位

### Phase 2: 次要實作（增強分析）
1. **page_view_detailed 表**：詳細頁面分析
2. **click_event_detailed 表**：詳細點擊分析
3. **現有表格完整擴展**：所有 Clarity 相關欄位

### Phase 3: 進階實作（完整功能）
1. **session_recording 表**：會話重播功能
2. **數據清理與遷移**
3. **效能優化**

## 🔄 數據遷移與相容性策略

### 漸進式升級策略
1. **階段 1**：新增新表格，不影響現有功能
2. **階段 2**：擴展現有表格，增加可選欄位
3. **階段 3**：漸進式遷移數據
4. **階段 4**：優化和整理舊數據

### 相容性考慮
- 保持現有 API 接口不變
- 新功能使用新的 API 路徑 (`/api/v1/analytics/`)
- 現有表格繼續支援舊系統運作
- 逐步以 session_id 為中心重構追蹤系統

## 📊 預期效益

### 數據收集能力提升
- **會話追蹤**：完整的用戶會話生命週期
- **熱力圖分析**：視覺化用戶行為模式
- **挫折識別**：自動偵測用戶體驗問題
- **詳細分析**：豐富的上下文資訊

### 分析深度增強
- **行為模式**：理解用戶真實使用習慣
- **體驗優化**：基於數據的 UX 改善
- **轉換分析**：深入的漏斗分析能力
- **個人化**：更精準的內容推薦

### 技術架構優化
- **統一會話**：以 session 為中心的數據模型
- **擴展性**：支援未來更多追蹤需求
- **效能**：優化的索引和查詢結構
- **隱私**：內建的隱私保護機制

---

**此計畫為 DaoDao 平台 GA + Clarity 整合追蹤系統的完整 SQL 表格改善方案，確保在不影響現有系統的前提下，逐步建構完整的用戶行為分析能力。** 📊🔧