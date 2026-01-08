# Dashboard API 服務改寫規劃文件

## 現況分析

### 當前 Dashboard 服務 (`routes/dashboard.js`)
現有的 dashboard 服務提供以下功能：
- 統計資料：用戶數、圈子數、專案數
- 最近資料：最近 50 筆用戶、圈子、專案資料
- 環境資訊：NODE_ENV、PORT、FRONTEND_URL

### 資料模型架構
系統包含以下主要模型：

#### 核心模型 (JavaScript)
- `User` - 用戶資料
- `Contact` - 聯繫資訊
- `BasicInfo` - 基本資訊
- `Role` - 角色
- `Permission` - 權限
- `Position` - 職位
- `Location` - 地理位置
- `City` - 城市
- `Country` - 國家
- `Project` - 專案
- `Post` - 文章
- `Milestone` - 里程碑
- `Task` - 任務
- `Review` - 評價
- `Note` - 筆記
- `Outcome` - 結果
- `Circle` - 圈子
- `Comment` - 評論
- `Marathon` - 馬拉松
- `FeePlan` - 費用計劃
- `Eligibility` - 資格

#### TypeScript 模型 (正在遷移中)
- `Resource` - 資源
- `ResourceReview` - 資源評價
- `Category` - 分類
- `Tag` - 標籤
- `EntityTag` - 實體標籤關聯
- `Idea` - 想法

## 新 API 服務設計

### 1. 全資料檢視 API 設計

#### 端點設計
```
GET /api/v1/admin/dashboard/overview
GET /api/v1/admin/dashboard/stats
GET /api/v1/admin/dashboard/recent-data
GET /api/v1/admin/dashboard/all-data
```

#### 功能特色
- **統計總覽**：所有模型的資料統計
- **最近活動**：各模型最近活動記錄
- **完整資料檢視**：支援分頁的所有資料查看
- **篩選與搜尋**：多條件篩選和搜尋功能
- **數據匯出**：支援 CSV、JSON 格式匯出

### 2. API 端點詳細規劃

#### 2.1 統計總覽端點
```typescript
GET /api/v1/admin/dashboard/overview
```

**回應格式**：
```json
{
  "success": true,
  "data": {
    "environment": "development",
    "port": 3000,
    "frontendUrl": "http://localhost:3000",
    "systemStats": {
      "users": {
        "total": 1250,
        "active": 980,
        "newToday": 15
      },
      "projects": {
        "total": 450,
        "active": 320,
        "completed": 130
      },
      "resources": {
        "total": 2300,
        "published": 1800,
        "pending": 500
      },
      "circles": {
        "total": 85,
        "active": 60
      },
      "reviews": {
        "total": 1200,
        "approved": 950
      }
    }
  }
}
```

#### 2.2 詳細統計端點
```typescript
GET /api/v1/admin/dashboard/stats
```

**查詢參數**：
- `period` - 時間範圍 (day, week, month, year)
- `model` - 特定模型統計
- `group_by` - 分組統計 (date, status, type)

#### 2.3 最近活動端點
```typescript
GET /api/v1/admin/dashboard/recent-data
```

**查詢參數**：
- `limit` - 限制數量 (預設 50)
- `model` - 特定模型 (user, project, resource, etc.)
- `days` - 最近天數 (預設 7)

#### 2.4 全資料檢視端點
```typescript
GET /api/v1/admin/dashboard/all-data
```

**查詢參數**：
- `model` - 模型名稱 (必填)
- `page` - 頁碼 (預設 1)
- `limit` - 每頁數量 (預設 20, 最大 100)
- `sort` - 排序欄位
- `order` - 排序方向 (asc, desc)
- `search` - 搜尋關鍵字
- `filter` - 篩選條件 (JSON 格式)

### 3. 服務架構設計

#### 3.1 Controller 層
```typescript
// src/controllers/admin/dashboard.controller.ts
export const getDashboardOverview = async (req: Request, res: Response) => {
  // 統計總覽邏輯
};

export const getDashboardStats = async (req: Request, res: Response) => {
  // 詳細統計邏輯
};

export const getRecentData = async (req: Request, res: Response) => {
  // 最近活動邏輯
};

export const getAllData = async (req: Request, res: Response) => {
  // 全資料檢視邏輯
};
```

#### 3.2 Service 層
```typescript
// src/services/admin/dashboard.service.ts
export const DashboardService = {
  // 統計服務
  getSystemStats: async () => { /* 統計邏輯 */ },
  
  // 最近活動服務
  getRecentActivities: async (options) => { /* 最近活動邏輯 */ },
  
  // 全資料檢視服務
  getAllModelData: async (modelName, options) => { /* 全資料檢視邏輯 */ },
  
  // 匯出服務
  exportData: async (modelName, format, options) => { /* 匯出邏輯 */ }
};
```

#### 3.3 Route 層
```typescript
// src/routes/admin/dashboard.routes.ts
import { Router } from 'express';
import { 
  getDashboardOverview,
  getDashboardStats,
  getRecentData,
  getAllData 
} from '../../controllers/admin/dashboard.controller';

const router = Router();

router.get('/overview', getDashboardOverview);
router.get('/stats', getDashboardStats);
router.get('/recent-data', getRecentData);
router.get('/all-data', getAllData);

export default router;
```

### 4. 資料匯出功能

#### 4.1 支援格式
- **JSON** - 完整資料結構
- **CSV** - 表格格式
- **Excel** - 工作表格式

#### 4.2 匯出端點
```typescript
GET /api/v1/admin/dashboard/export
```

**查詢參數**：
- `model` - 模型名稱
- `format` - 匯出格式 (json, csv, excel)
- `filter` - 篩選條件
- `fields` - 指定欄位

### 5. 權限與安全

#### 5.1 權限控制
- 僅管理員可存取 `/admin/dashboard` 端點
- 使用中介軟體驗證管理員權限
- 記錄所有資料存取日誌

#### 5.2 安全措施
- 敏感欄位遮罩 (密碼、token 等)
- 分頁限制防止大量資料查詢
- 請求頻率限制

### 6. 效能最佳化

#### 6.1 快取策略
- 統計資料快取 (Redis, 5 分鐘)
- 最近活動快取 (Redis, 1 分鐘)
- 查詢結果快取 (記憶體快取)

#### 6.2 查詢最佳化
- 使用資料庫索引
- 延遲載入關聯資料
- 分頁查詢避免全表掃描

### 7. 監控與日誌

#### 7.1 監控指標
- API 回應時間
- 資料查詢頻率
- 錯誤率統計

#### 7.2 日誌記錄
- 管理員操作日誌
- 系統存取日誌
- 錯誤日誌

### 8. 實作步驟

1. **階段一：基礎架構**
   - 建立 TypeScript 控制器和服務（使用 Prisma）
   - 設計 API 路由結構
   - 實作基本統計功能（使用 Prisma 聚合查詢）
   - 建立靜態 HTML 頁面結構

2. **階段二：全資料檢視**
   - 實作分頁查詢（使用 Prisma 分頁）
   - 加入篩選和搜尋功能（使用 Prisma where 條件）
   - 建立權限驗證機制
   - 實作前端數據表格和篩選功能（JavaScript）

3. **階段三：資料匯出**
   - 實作多格式匯出功能（使用 Prisma 查詢）
   - 建立匯出任務佇列
   - 加入匯出記錄追蹤
   - 實作前端匯出功能介面（JavaScript 文件下載）

4. **階段四：效能最佳化**
   - 實作快取機制（Redis + Prisma）
   - 查詢效能調優（Prisma 查詢優化）
   - 加入監控和日誌
   - 前端效能優化（JavaScript 快取和優化）

5. **階段五：網頁介面完善**
   - 實作統計儀表板（HTML + Chart.js）
   - 建立圖表視覺化
   - 響應式設計（CSS Media Queries）
   - 用戶體驗優化（JavaScript 交互）

6. **階段六：測試與部署**
   - 單元測試（包含 Prisma 測試）
   - 整合測試（前後端整合）
   - 效能測試
   - 文件完善

### 9. 技術選擇

#### 9.1 開發框架
- **後端**：Express.js + TypeScript
- **ORM**：Prisma（完全取代 Sequelize）
- **驗證**：JWT + Passport.js
- **文件**：Swagger/OpenAPI
- **前端**：HTML5 + CSS3 + JavaScript (ES6+)
- **樣式**：Bootstrap 5 或純 CSS
- **圖表**：Chart.js

#### 9.2 資料庫
- **主資料庫**：PostgreSQL
- **快取**：Redis
- **文件儲存**：MongoDB (現有)

#### 9.3 部署與維運
- **容器化**：Docker
- **監控**：Prometheus + Grafana
- **日誌**：ELK Stack
- **CI/CD**：GitHub Actions

### 10. 風險與挑戰

#### 10.1 技術風險
- 從 Sequelize 遷移到 Prisma 的相容性問題
- 大量資料查詢的效能影響
- 快取一致性問題
- 原生前端的維護複雜度

#### 10.2 解決方案
- 建立 Prisma 模型映射，確保與現有資料庫結構相容
- 實作查詢限制和分頁，使用 Prisma 的優化查詢
- 建立快取失效機制
- 使用模組化的 JavaScript 結構，確保程式碼可維護性

### 11. 成功指標

- API 回應時間 < 2 秒
- 支援同時 100+ 管理員存取
- 99.9% 系統可用性
- 完整的 API 文件覆蓋率
- 網頁介面載入時間 < 2 秒（無需編譯）
- 支援 RWD 響應式設計
- 程式碼可讀性和可維護性良好

### 12. 網頁介面詳細規劃

#### 12.1 專案結構
```
public/admin/
├── index.html           # 主頁面（儀表板）
├── users.html           # 用戶管理頁面
├── projects.html        # 專案管理頁面
├── resources.html       # 資源管理頁面
├── activities.html      # 活動管理頁面
├── reports.html         # 報告生成頁面
├── settings.html        # 系統設定頁面
├── login.html           # 登入頁面
├── assets/
│   ├── css/
│   │   ├── main.css     # 主要樣式
│   │   ├── components.css # 組件樣式
│   │   └── responsive.css # 響應式樣式
│   ├── js/
│   │   ├── main.js      # 主要邏輯
│   │   ├── api.js       # API 請求模組
│   │   ├── charts.js    # 圖表功能
│   │   ├── tables.js    # 表格功能
│   │   ├── auth.js      # 認證模組
│   │   └── utils.js     # 工具函數
│   ├── images/          # 圖片資源
│   └── vendors/         # 第三方庫
│       ├── bootstrap/   # Bootstrap（可選）
│       └── chart.js/    # Chart.js
```

#### 12.2 關鍵功能實作

##### 數據查詢與狀態管理
```javascript
// api.js - API 請求模組
class DashboardAPI {
  constructor() {
    this.baseURL = '/api/v1/admin';
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5分鐘快取
  }
  
  async fetchDashboardStats() {
    const cacheKey = 'dashboard-stats';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    
    const response = await fetch(`${this.baseURL}/dashboard/overview`);
    const data = await response.json();
    
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    
    return data;
  }
}

const api = new DashboardAPI();
```

##### 表格組件
```javascript
// tables.js - 表格功能模組
class DataTable {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.options = {
      pagination: true,
      sorting: true,
      filtering: true,
      pageSize: 20,
      ...options
    };
    this.currentPage = 1;
    this.sortColumn = null;
    this.sortDirection = 'asc';
    this.filters = {};
  }
  
  render(data) {
    this.data = data;
    this.filteredData = this.applyFilters(data);
    this.sortedData = this.applySorting(this.filteredData);
    this.paginatedData = this.applyPagination(this.sortedData);
    
    this.renderTable();
    this.renderPagination();
    this.renderFilters();
  }
  
  renderTable() {
    const table = document.createElement('table');
    table.className = 'table table-striped';
    
    // 表頭
    const thead = this.createTableHead();
    table.appendChild(thead);
    
    // 表身
    const tbody = this.createTableBody();
    table.appendChild(tbody);
    
    this.container.innerHTML = '';
    this.container.appendChild(table);
  }
  
  createTableHead() {
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    Object.keys(this.paginatedData[0] || {}).forEach(key => {
      const th = document.createElement('th');
      th.textContent = key;
      th.style.cursor = 'pointer';
      th.addEventListener('click', () => this.handleSort(key));
      headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    return thead;
  }
  
  createTableBody() {
    const tbody = document.createElement('tbody');
    
    this.paginatedData.forEach(row => {
      const tr = document.createElement('tr');
      Object.values(row).forEach(value => {
        const td = document.createElement('td');
        td.textContent = value;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    
    return tbody;
  }
  
  handleSort(column) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.render(this.data);
  }
}
```

##### 圖表組件
```javascript
// charts.js - 圖表功能模組
class DashboardCharts {
  constructor() {
    this.charts = {};
  }
  
  renderLineChart(canvasId, data) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    if (this.charts[canvasId]) {
      this.charts[canvasId].destroy();
    }
    
    this.charts[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [{
          label: '用戶增長',
          data: data.values,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }
  
  renderPieChart(canvasId, data) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    if (this.charts[canvasId]) {
      this.charts[canvasId].destroy();
    }
    
    this.charts[canvasId] = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: data.labels,
        datasets: [{
          data: data.values,
          backgroundColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
            '#4BC0C0',
            '#9966FF'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }
}

const charts = new DashboardCharts();
```

#### 12.3 效能優化策略
- **模組化載入**: 按需載入 JavaScript 模組
- **虛擬滾動**: 大量數據列表優化
- **圖片優化**: 使用 WebP 格式和懶加載
- **快取策略**: 使用 localStorage 和記憶體快取
- **程式碼壓縮**: 使用 UglifyJS 或 Terser

```javascript
// 按需載入模組
async function loadModule(modulePath) {
  const module = await import(modulePath);
  return module.default || module;
}

// 虛擬滾動實作
class VirtualScroll {
  constructor(container, itemHeight, renderItem) {
    this.container = container;
    this.itemHeight = itemHeight;
    this.renderItem = renderItem;
    this.visibleItems = Math.ceil(container.clientHeight / itemHeight) + 2;
    this.scrollTop = 0;
    
    this.setupScrollListener();
  }
  
  render(data) {
    this.data = data;
    this.startIndex = Math.floor(this.scrollTop / this.itemHeight);
    this.endIndex = Math.min(this.startIndex + this.visibleItems, data.length);
    
    this.container.innerHTML = '';
    this.container.style.height = `${data.length * this.itemHeight}px`;
    
    for (let i = this.startIndex; i < this.endIndex; i++) {
      const item = this.renderItem(data[i], i);
      item.style.position = 'absolute';
      item.style.top = `${i * this.itemHeight}px`;
      this.container.appendChild(item);
    }
  }
}
```

#### 12.4 部署配置
```yaml
# docker-compose.yml
version: '3.8'
services:
  web:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./public:/usr/share/nginx/html
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - backend
  
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    depends_on:
      - postgres
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/db
      
  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=daodao
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
```

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    server {
        listen 80;
        root /usr/share/nginx/html;
        index index.html;
        
        # 靜態文件
        location / {
            try_files $uri $uri/ =404;
        }
        
        # API 代理
        location /api/ {
            proxy_pass http://backend:3001;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
        
        # 快取靜態資源
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

---

## 總結

此規劃將現有的簡單 dashboard 服務升級為功能完整的管理面板系統，提供：
- 完整的系統資料檢視功能（純 Prisma 實作）
- 強大的篩選和搜尋能力
- 多格式資料匯出
- 高效能和安全性保障
- 簡潔的原生網頁介面
- 響應式設計和優秀的用戶體驗
- 輕量級部署，無需複雜的構建流程

透過 TypeScript 後端和原生前端技術的結合，為管理員提供全面的資料管理能力和直觀的操作介面。原生前端技術確保了系統的簡潔性、快速載入和易於維護，同時保持了現代化的功能和用戶體驗。