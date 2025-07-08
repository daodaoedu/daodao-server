# Dashboard API 重新設計規劃

## 概述

將現有的 dashboard 服務改造成可以查看所有資料的綜合性 API 服務，提供統一的資料存取介面。

## 現有架構分析

### 現有 Dashboard 服務 (`routes/dashboard.js`)
- **功能**: 提供基本的統計資料和最近資料
- **架構**: JavaScript + Express.js
- **資料模型**: User, Circle, Project, Contact
- **限制**: 
  - 固定的資料結構
  - 限制50筆資料
  - 缺乏篩選和分頁功能
  - 沒有 TypeScript 支援

### 現有資料模型結構

#### 核心模型
```javascript
// JavaScript 模型 (models/)
User, Role, Permission, Position, Location, City, Country, Contact, BasicInfo
Project, Post, Milestone, Task, Review, Note, Outcome
Marathon, FeePlan, Circle, Comment, MentorParticipants, MentorMarathon

// TypeScript 模型 (src/models/)
Resource, ResourceReview, Category, Tag, EntityTag
Idea, User, Project (TypeScript 版本)
```

#### 模型關聯
- User → Role, Permission, Position, Location, Contact, BasicInfo
- Project → User, Milestone, Post, Marathon
- Resource → Category, Tag, User, ResourceReview
- Circle → User, Comment
- Marathon → User, Project, Eligibility

## 新 API 服務架構設計

### 1. 技術棧選擇
- **語言**: TypeScript
- **框架**: Express.js
- **ORM**: Prisma（完全取代 Sequelize）
- **驗證**: Zod schemas
- **文件**: Swagger/OpenAPI
- **前端**: HTML + CSS + JavaScript（原生）
- **樣式**: CSS3 + Bootstrap（可選）
- **圖表**: Chart.js
- **AJAX**: Fetch API

### 2. API 端點設計

#### 基礎路由結構
```
/api/v1/admin/
├── overview          # 系統概覽
├── analytics         # 分析統計
├── entities          # 實體資料管理
├── users             # 用戶管理
├── projects          # 專案管理
├── resources         # 資源管理
├── activities        # 活動管理
└── reports           # 報告生成
```

#### 詳細端點規劃

##### 1. 系統概覽 (`/api/v1/admin/overview`)
```
GET /api/v1/admin/overview
- 系統統計摘要
- 最近活動
- 關鍵指標

GET /api/v1/admin/overview/stats
- 詳細統計資料
- 可選時間範圍
- 分類統計
```

##### 2. 分析統計 (`/api/v1/admin/analytics`)
```
GET /api/v1/admin/analytics/users
- 用戶增長趨勢
- 活躍用戶統計
- 地理分佈

GET /api/v1/admin/analytics/projects
- 專案完成率
- 專案類型分佈
- 時間線分析

GET /api/v1/admin/analytics/resources
- 資源使用率
- 評價統計
- 標籤分析
```

##### 3. 實體資料管理 (`/api/v1/admin/entities`)
```
GET /api/v1/admin/entities/:type
- 支援所有資料類型
- 統一的查詢介面
- 進階篩選功能

GET /api/v1/admin/entities/:type/:id
- 單筆資料詳情
- 關聯資料載入
- 完整資料視圖

POST /api/v1/admin/entities/:type
- 新增資料
- 資料驗證
- 關聯處理

PUT /api/v1/admin/entities/:type/:id
- 更新資料
- 部分更新支援
- 版本控制

DELETE /api/v1/admin/entities/:type/:id
- 刪除資料
- 級聯刪除處理
- 軟刪除支援
```

##### 4. 批次操作 (`/api/v1/admin/batch`)
```
POST /api/v1/admin/batch/export
- 資料匯出
- 多格式支援 (JSON, CSV, Excel)
- 自定義欄位選擇

POST /api/v1/admin/batch/import
- 資料匯入
- 格式驗證
- 錯誤處理

POST /api/v1/admin/batch/operations
- 批次更新
- 批次刪除
- 狀態變更
```

### 3. 查詢功能設計

#### 統一查詢參數
```typescript
interface QueryParams {
  // 分頁
  page?: number;
  limit?: number;
  
  // 排序
  sort?: string;
  order?: 'asc' | 'desc';
  
  // 篩選
  filter?: {
    [key: string]: any;
  };
  
  // 搜尋
  search?: string;
  searchFields?: string[];
  
  // 日期範圍
  dateRange?: {
    start?: string;
    end?: string;
    field?: string;
  };
  
  // 關聯載入
  include?: string[];
  
  // 欄位選擇
  fields?: string[];
}
```

#### 進階篩選功能
```typescript
interface FilterOptions {
  // 基本比較
  eq?: any;           // 等於
  ne?: any;           // 不等於
  gt?: any;           // 大於
  gte?: any;          // 大於等於
  lt?: any;           // 小於
  lte?: any;          // 小於等於
  
  // 陣列操作
  in?: any[];         // 包含於
  nin?: any[];        // 不包含於
  
  // 字串操作
  like?: string;      // 模糊匹配
  ilike?: string;     // 不區分大小寫匹配
  startsWith?: string; // 開頭匹配
  endsWith?: string;  // 結尾匹配
  
  // 空值檢查
  isNull?: boolean;
  isNotNull?: boolean;
  
  // 邏輯操作
  and?: FilterOptions[];
  or?: FilterOptions[];
  not?: FilterOptions;
}
```

### 4. 資料類型支援

#### 支援的實體類型
```typescript
enum EntityType {
  // 用戶相關
  USER = 'user',
  CONTACT = 'contact',
  BASIC_INFO = 'basicInfo',
  USER_PROFILE = 'userProfile',
  
  // 專案相關
  PROJECT = 'project',
  POST = 'post',
  MILESTONE = 'milestone',
  TASK = 'task',
  REVIEW = 'review',
  NOTE = 'note',
  OUTCOME = 'outcome',
  
  // 資源相關
  RESOURCE = 'resource',
  RESOURCE_REVIEW = 'resourceReview',
  CATEGORY = 'category',
  TAG = 'tag',
  IDEA = 'idea',
  
  // 活動相關
  MARATHON = 'marathon',
  CIRCLE = 'circle',
  COMMENT = 'comment',
  
  // 系統相關
  ROLE = 'role',
  PERMISSION = 'permission',
  POSITION = 'position',
  LOCATION = 'location'
}
```

### 5. 回應格式標準化

#### 統一回應結構
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
  timestamp: string;
}
```

#### 統計資料格式
```typescript
interface StatsResponse {
  overview: {
    totalUsers: number;
    totalProjects: number;
    totalResources: number;
    totalReviews: number;
    activeUsers: number;
    completedProjects: number;
  };
  growth: {
    period: string;
    userGrowth: number;
    projectGrowth: number;
    resourceGrowth: number;
  };
  distribution: {
    usersByRole: Record<string, number>;
    projectsByStatus: Record<string, number>;
    resourcesByCategory: Record<string, number>;
  };
}
```

## 實作計畫

### Phase 1: 基礎架構 (1-2 週)
1. **建立 TypeScript 服務結構**
   - 建立 `src/services/admin/` 目錄
   - 實作基礎 Prisma 查詢服務
   - 設定 Zod 驗證 schemas

2. **建立統一查詢介面**
   - 實作 `PrismaQueryBuilder` 類別
   - 建立篩選器邏輯（使用 Prisma 語法）
   - 設定分頁機制

3. **建立路由結構**
   - 設定 `/api/v1/admin/` 路由
   - 實作中介軟體 (認證、授權)
   - 錯誤處理機制

4. **網頁介面基礎架構**
   - 建立靜態 HTML 頁面結構
   - 設定 CSS 樣式和 Bootstrap
   - 建立基礎頁面佈局和導航

### Phase 2: 核心功能 (2-3 週)
1. **實作系統概覽 API**
   - 使用 Prisma 聚合查詢進行統計資料計算
   - 即時指標更新
   - Redis 快取機制

2. **實作實體管理 API**
   - 通用 CRUD 操作（使用 Prisma Client）
   - 關聯資料處理（使用 Prisma include/select）
   - 批次操作（使用 Prisma transactions）

3. **實作分析統計 API**
   - 時間序列分析（使用 Prisma 日期查詢）
   - 趨勢計算
   - 資料視覺化支援

4. **網頁介面核心功能**
   - 實作統計儀表板頁面（HTML + JavaScript）
   - 建立動態表格（JavaScript 渲染）
   - 實作篩選和搜尋功能（JavaScript 事件處理）
   - 整合 Chart.js 圖表

### Phase 3: 進階功能 (2-3 週)
1. **實作進階查詢**
   - 複雜篩選條件（使用 Prisma 複雜 where 條件）
   - 全文搜尋（使用 Prisma 全文檢索）
   - 聚合查詢（使用 Prisma aggregations）

2. **實作資料匯出入**
   - 多格式匯出（JSON, CSV, Excel）
   - 批次匯入（使用 Prisma createMany）
   - 資料驗證（使用 Zod schemas）

3. **效能優化**
   - 查詢優化（使用 Prisma 查詢優化）
   - 快取策略（Redis 整合）
   - 分頁改善（使用 cursor-based pagination）

4. **網頁介面進階功能**
   - 實作資料匯出功能（JavaScript 檔案下載）
   - 建立複雜篩選器（JavaScript 動態表單）
   - 實作即時資料更新（定時 AJAX 請求）
   - 響應式設計優化（CSS Media Queries）

### Phase 4: 文件與測試 (1-2 週)
1. **API 文件**
   - Swagger 規格
   - 使用範例
   - 錯誤代碼說明

2. **測試覆蓋**
   - 單元測試（包含 Prisma 查詢測試）
   - 整合測試
   - 效能測試

3. **網頁介面完善**
   - 用戶體驗優化（JavaScript 交互效果）
   - 錯誤處理和載入狀態（JavaScript 狀態管理）
   - 靜態文件部署設定

## 安全性考量

### 認證與授權
- JWT 令牌驗證
- 角色權限控制
- API 速率限制
- 資料存取日誌

### 資料保護
- 敏感資料遮罩
- 查詢結果限制
- 資料匿名化選項
- 稽核軌跡記錄

## 效能優化策略

### 資料庫優化
- 索引優化
- 查詢計畫分析
- 連線池設定
- 讀寫分離

### 快取策略
- Redis 快取
- 查詢結果快取
- 統計資料快取
- CDN 整合

### 監控指標
- API 回應時間
- 資料庫效能
- 記憶體使用
- 錯誤率監控

## 遷移策略

### 相容性維護
- 保持現有 dashboard API
- 逐步遷移功能
- 版本控制策略
- 向後相容性

### 資料遷移
- 漸進式遷移
- 資料一致性檢查
- 回滾機制
- 遷移監控

## 網頁介面設計

### 1. 技術架構
- **前端技術**: HTML5 + CSS3 + JavaScript (ES6+)
- **樣式框架**: Bootstrap 5（可選）或純 CSS
- **圖表庫**: Chart.js
- **AJAX 請求**: Fetch API
- **模板引擎**: 原生 JavaScript Template Literals
- **狀態管理**: 原生 JavaScript 物件
- **路由**: 多頁面應用（MPA）或 JavaScript 路由

### 2. 頁面結構
```
public/admin/
├── index.html         # 主頁面（儀表板）
├── users.html         # 用戶管理頁面
├── projects.html      # 專案管理頁面
├── resources.html     # 資源管理頁面
├── activities.html    # 活動管理頁面
├── reports.html       # 報告生成頁面
├── settings.html      # 系統設定頁面
├── assets/
│   ├── css/
│   │   ├── main.css   # 主要樣式
│   │   └── dashboard.css
│   ├── js/
│   │   ├── main.js    # 主要邏輯
│   │   ├── api.js     # API 請求
│   │   ├── charts.js  # 圖表功能
│   │   └── utils.js   # 工具函數
│   └── images/        # 圖片資源
```

### 3. 主要功能實作

#### 3.1 統計儀表板
```javascript
// 載入儀表板資料
async function loadDashboard() {
  try {
    const response = await fetch('/api/v1/admin/dashboard/overview');
    const data = await response.json();
    
    // 更新統計卡片
    document.getElementById('total-users').textContent = data.stats.users;
    document.getElementById('total-projects').textContent = data.stats.projects;
    
    // 繪製圖表
    renderCharts(data.chartData);
  } catch (error) {
    showError('載入儀表板失敗');
  }
}
```

#### 3.2 數據表格
```javascript
// 動態表格渲染
function renderTable(data, containerId) {
  const container = document.getElementById(containerId);
  const table = document.createElement('table');
  table.className = 'table table-striped';
  
  // 建立表頭
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  Object.keys(data[0]).forEach(key => {
    const th = document.createElement('th');
    th.textContent = key;
    th.addEventListener('click', () => sortTable(key));
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);
  
  // 建立表身
  const tbody = document.createElement('tbody');
  data.forEach(row => {
    const tr = document.createElement('tr');
    Object.values(row).forEach(value => {
      const td = document.createElement('td');
      td.textContent = value;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  
  container.appendChild(table);
}
```

#### 3.3 進階篩選器
```javascript
// 篩選功能
function setupFilters() {
  const filterForm = document.getElementById('filter-form');
  
  filterForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(filterForm);
    const filters = Object.fromEntries(formData);
    
    const queryParams = new URLSearchParams(filters).toString();
    const response = await fetch(`/api/v1/admin/dashboard/all-data?${queryParams}`);
    const data = await response.json();
    
    renderTable(data.data, 'data-table');
  });
}
```

#### 3.4 圖表視覺化
```javascript
// Chart.js 圖表渲染
function renderCharts(chartData) {
  // 線圖
  const lineCtx = document.getElementById('line-chart').getContext('2d');
  new Chart(lineCtx, {
    type: 'line',
    data: {
      labels: chartData.labels,
      datasets: [{
        label: '用戶增長',
        data: chartData.values,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
  
  // 圓餅圖
  const pieCtx = document.getElementById('pie-chart').getContext('2d');
  new Chart(pieCtx, {
    type: 'pie',
    data: {
      labels: chartData.categories,
      datasets: [{
        data: chartData.values,
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0'
        ]
      }]
    },
    options: {
      responsive: true
    }
  });
}
```

### 4. 響應式設計
```css
/* 響應式 CSS */
@media (max-width: 768px) {
  .dashboard-cards {
    grid-template-columns: 1fr;
  }
  
  .table-responsive {
    overflow-x: auto;
  }
  
  .sidebar {
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }
  
  .sidebar.active {
    transform: translateX(0);
  }
}
```

### 5. 用戶體驗
```javascript
// 載入狀態管理
function showLoading() {
  document.getElementById('loading-overlay').style.display = 'block';
}

function hideLoading() {
  document.getElementById('loading-overlay').style.display = 'none';
}

// 錯誤處理
function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'alert alert-danger';
  errorDiv.textContent = message;
  document.body.insertBefore(errorDiv, document.body.firstChild);
  
  setTimeout(() => {
    errorDiv.remove();
  }, 3000);
}

// 成功通知
function showSuccess(message) {
  const successDiv = document.createElement('div');
  successDiv.className = 'alert alert-success';
  successDiv.textContent = message;
  document.body.insertBefore(successDiv, document.body.firstChild);
  
  setTimeout(() => {
    successDiv.remove();
  }, 3000);
}
```

### 6. 安全性
```javascript
// JWT 認證
function getAuthToken() {
  return localStorage.getItem('authToken');
}

function setAuthHeaders() {
  const token = getAuthToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

// API 請求攔截器
async function apiRequest(url, options = {}) {
  const defaultOptions = {
    headers: setAuthHeaders(),
    ...options
  };
  
  const response = await fetch(url, defaultOptions);
  
  if (response.status === 401) {
    // 重新導向到登入頁面
    window.location.href = '/login.html';
    return;
  }
  
  return response;
}
```

## 部署架構

### 1. 開發環境
```
靜態 HTML 文件  →  Backend API (Express + Prisma)  →  PostgreSQL
     ↓                        ↓                              ↓
  Live Server           nodemon + ts-node            Docker Container
```

### 2. 生產環境
```
靜態文件  →  Nginx  →  Node.js API  →  PostgreSQL
     ↓           ↓           ↓              ↓
  HTML/CSS/JS  Static Serve  PM2 Cluster   RDS/Cloud SQL
```

### 3. Nginx 配置
```nginx
server {
    listen 80;
    server_name dashboard.example.com;
    
    # 靜態文件服務
    location / {
        root /var/www/dashboard;
        index index.html;
        try_files $uri $uri/ =404;
    }
    
    # API 代理
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    # 靜態資源快取
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 4. 簡化部署
```bash
# 部署腳本
#!/bin/bash

# 複製靜態文件
cp -r public/admin/* /var/www/dashboard/

# 重啟 API 服務
pm2 restart dashboard-api

# 重載 Nginx
nginx -s reload

echo "部署完成！"
```

## 總結

新的 Dashboard API 設計提供了：
- 統一的資料存取介面（純 Prisma 實作）
- 強大的查詢和篩選功能
- TypeScript 類型安全
- 良好的擴展性和維護性
- 完整的文件和測試覆蓋
- 簡潔的原生網頁管理介面
- 輕量級部署，無需複雜構建工具

此設計將現有的基礎 dashboard 服務轉變為功能完整的管理後台系統，支援所有資料類型的 CRUD 操作，並提供豐富的分析和統計功能。使用原生前端技術確保了系統的簡潔性和易維護性，同時提供直觀易用的網頁介面。