# 多資料庫架構設計文件

## 概述

本文件描述 DaoDao 學習平台新增第二個資料庫的架構設計，主要目的是將統計相關功能從主資料庫分離，提升系統效能與可維護性。

## 現況分析

### 現有資料庫架構
- **主資料庫**: PostgreSQL (透過 Prisma ORM)
- **文件資料庫**: MongoDB (透過 Mongoose)
- **快取資料庫**: Redis (透過 ioredis)

### 現有統計相關表格
目前統計功能混在主資料庫中，包含以下表格：
- `view` - 頁面瀏覽統計 (964行)
- `click` - 用戶點擊統計 (73行)
- `user_session` - 用戶會話統計 (853行)
- `favorite` - 收藏統計 (187行)
- `reaction` - 互動反應統計 (555行)
- `share` - 分享統計 (682行)

## 設計目標

### 主要目標
1. **效能提升**: 將統計查詢從主資料庫分離，減少主資料庫負載
2. **數據分析**: 建立專門的統計資料庫，便於複雜分析查詢
3. **擴展性**: 統計資料庫可獨立擴展，不影響主業務
4. **維護性**: 統計功能獨立開發與維護

### 技術目標
- 使用 Prisma 多資料庫支援
- 保持現有 API 介面不變
- 實現數據同步機制
- 提供統計數據聚合功能

## 架構設計

### 資料庫分離策略

#### 主資料庫 (PostgreSQL)
**用途**: 核心業務邏輯
**包含表格**:
- 用戶管理 (users, roles, permissions)
- 內容管理 (resources, ideas, practices)
- 項目管理 (project, marathon, milestone)
- 社群功能 (groups, comments)

#### 統計資料庫 (PostgreSQL)
**用途**: 統計分析與數據挖掘
**包含表格**:
- `analytics_views` - 頁面瀏覽統計
- `analytics_clicks` - 用戶點擊統計  
- `analytics_sessions` - 用戶會話統計
- `analytics_interactions` - 用戶互動統計 (點讚、收藏、分享)
- `analytics_daily_stats` - 每日統計聚合數據

### Schema 設計

#### analytics_views (頁面瀏覽統計)
```sql
- id: 主鍵
- user_id: 用戶ID (可為空，支援匿名瀏覽)
- session_id: 會話ID  
- target_type: 目標類型 (resource, idea, practice, etc.)
- target_id: 目標ID
- page_url: 頁面URL
- duration: 停留時間 (秒)
- scroll_depth: 滾動深度 (百分比)
- device_type: 設備類型
- browser: 瀏覽器
- created_at: 建立時間
```

#### analytics_clicks (點擊統計)
```sql
- id: 主鍵
- user_id: 用戶ID
- session_id: 會話ID
- view_id: 關聯的瀏覽記錄ID
- target_type: 目標類型
- target_id: 目標ID
- element_type: 元素類型 (button, link, etc.)
- element_selector: CSS選擇器
- page_x, page_y: 點擊座標
- time_to_click: 點擊延遲時間
- created_at: 建立時間
```

#### analytics_sessions (會話統計)
```sql
- id: 會話ID (UUID)
- user_id: 用戶ID
- device_type: 設備類型
- browser: 瀏覽器資訊
- ip_address: IP地址
- utm_source: 流量來源
- start_time: 開始時間
- end_time: 結束時間
- page_views: 頁面瀏覽數
- is_bounce: 是否跳出
```

#### analytics_interactions (互動統計)
```sql
- id: 主鍵
- user_id: 用戶ID
- target_type: 目標類型
- target_id: 目標ID
- action_type: 互動類型 (like, favorite, share, reaction)
- action_value: 互動值 (分享平台、反應類型等)
- weight: 權重
- created_at: 建立時間
```

#### analytics_daily_stats (每日統計聚合)
```sql
- id: 主鍵
- date: 統計日期
- target_type: 目標類型
- target_id: 目標ID
- total_views: 總瀏覽數
- unique_views: 獨立瀏覽數
- total_clicks: 總點擊數
- avg_duration: 平均停留時間
- bounce_rate: 跳出率
- interaction_rate: 互動率
```

## 技術實作方案

### 1. Prisma 多資料庫配置詳解

#### 文件結構
```
prisma/
├── schema.prisma          # 主資料庫
├── analytics.prisma       # 統計資料庫
└── migrations/            # 遷移文件分目錄管理
    ├── main/             # 主資料庫遷移
    └── analytics/        # 統計資料庫遷移
```

#### 主資料庫 Schema (prisma/schema.prisma)
```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../generated/prisma"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// 現有的所有業務表格
model users {
  id          Int       @id @default(autoincrement())
  external_id String?   @unique @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email       String    @unique
  name        String
  created_at  DateTime? @default(now()) @db.Timestamptz(6)
  // ... 其他現有欄位
}

model resources {
  id          Int       @id @default(autoincrement())
  external_id String?   @unique @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name        String
  url         String
  // ... 其他現有欄位
}
```

#### 統計資料庫 Schema (prisma/analytics.prisma)
```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../generated/prisma-analytics"
}

datasource analytics_db {
  provider = "postgresql"
  url      = env("ANALYTICS_DATABASE_URL")
}

// 統計專用表格
model analytics_views {
  id                  Int       @id @default(autoincrement())
  user_id             Int?
  session_id          String?   @db.Uuid
  target_type         String    @db.VarChar(50)
  target_id           String    @db.VarChar(36)
  page_url            String?
  page_title          String?   @db.VarChar(255)
  duration            Int?      @default(0)
  scroll_depth        Decimal?  @db.Decimal(5, 2)
  device_type         String?   @db.VarChar(50)
  browser             String?   @db.VarChar(50)
  created_at          DateTime? @default(now()) @db.Timestamptz(6)
  updated_at          DateTime? @default(now()) @db.Timestamptz(6)

  analytics_clicks analytics_clicks[]

  @@index([created_at], map: "idx_analytics_views_created_at")
  @@index([target_type, target_id], map: "idx_analytics_views_target")
  @@index([user_id, session_id], map: "idx_analytics_views_user_session")
}

model analytics_clicks {
  id               Int                @id @default(autoincrement())
  user_id          Int?
  session_id       String?            @db.Uuid
  view_id          Int?
  target_type      String             @db.VarChar(50)
  target_id        String             @db.VarChar(36)
  element_type     String?            @db.VarChar(100)
  element_selector String?
  page_x           Int?
  page_y           Int?
  created_at       DateTime?          @default(now()) @db.Timestamptz(6)

  analytics_view analytics_views? @relation(fields: [view_id], references: [id], onDelete: NoAction, onUpdate: NoAction)

  @@index([view_id], map: "idx_analytics_clicks_view")
  @@index([created_at], map: "idx_analytics_clicks_created_at")
}
```

### 2. Prisma Client 生成與管理

#### package.json 腳本配置
```json
{
  "scripts": {
    "prisma:generate": "prisma generate",
    "prisma:generate:analytics": "prisma generate --schema=prisma/analytics.prisma",
    "prisma:generate:all": "npm run prisma:generate && npm run prisma:generate:analytics",
    "prisma:migrate:main": "prisma migrate dev",
    "prisma:migrate:analytics": "prisma migrate dev --schema=prisma/analytics.prisma",
    "prisma:studio:main": "prisma studio",
    "prisma:studio:analytics": "prisma studio --schema=prisma/analytics.prisma"
  }
}
```

#### 執行命令
```bash
# 生成主資料庫 client
npm run prisma:generate

# 生成統計資料庫 client  
npm run prisma:generate:analytics

# 一次生成所有 client
npm run prisma:generate:all

# 分別執行遷移
npm run prisma:migrate:main -- --name "add_new_field"
npm run prisma:migrate:analytics -- --name "init_analytics"

# 分別開啟 Prisma Studio
npm run prisma:studio:main
npm run prisma:studio:analytics
```

### 3. 資料庫連接服務實作

#### 主資料庫服務 (src/services/main-database.ts)
```typescript
import { PrismaClient } from '../../generated/prisma';

let mainClient: PrismaClient | null = null;

/**
 * 初始化主資料庫連接
 */
export const initMainDatabase = async (): Promise<PrismaClient> => {
  if (!mainClient) {
    try {
      mainClient = new PrismaClient({
        log: process.env.NODE_ENV === 'development' 
          ? ['query', 'info', 'warn', 'error'] 
          : ['error'],
      });

      await mainClient.$connect();
      console.log('主資料庫連接成功');
      return mainClient;
    } catch (error) {
      console.error('主資料庫連接失敗:', error);
      throw error;
    }
  }
  return mainClient;
};

/**
 * 獲取主資料庫客戶端
 */
export const getMainClient = async (): Promise<PrismaClient> => {
  if (!mainClient) {
    return await initMainDatabase();
  }
  return mainClient;
};

// 簡化的導出 (建議在 service 層中使用)
export const mainDb = getMainClient();
```

#### 統計資料庫服務 (src/services/analytics-database.ts)
```typescript
import { PrismaClient as AnalyticsPrismaClient } from '../../generated/prisma-analytics';

let analyticsClient: AnalyticsPrismaClient | null = null;

/**
 * 初始化統計資料庫連接
 */
export const initAnalyticsDatabase = async (): Promise<AnalyticsPrismaClient> => {
  if (!analyticsClient) {
    try {
      analyticsClient = new AnalyticsPrismaClient({
        datasources: {
          analytics_db: {
            url: process.env.ANALYTICS_DATABASE_URL || process.env.DATABASE_URL,
          },
        },
        log: process.env.NODE_ENV === 'development' 
          ? ['query', 'info', 'warn', 'error'] 
          : ['error'],
      });

      await analyticsClient.$connect();
      console.log('統計資料庫連接成功');
      return analyticsClient;
    } catch (error) {
      console.error('統計資料庫連接失敗:', error);
      throw error;
    }
  }
  return analyticsClient;
};

/**
 * 獲取統計資料庫客戶端
 */
export const getAnalyticsClient = async (): Promise<AnalyticsPrismaClient> => {
  if (!analyticsClient) {
    return await initAnalyticsDatabase();
  }
  return analyticsClient;
};

/**
 * 關閉統計資料庫連接
 */
export const closeAnalyticsDatabase = async (): Promise<void> => {
  if (analyticsClient) {
    await analyticsClient.$disconnect();
    analyticsClient = null;
    console.log('統計資料庫連接已關閉');
  }
};

// 處理進程退出時的資源清理
process.on('beforeExit', closeAnalyticsDatabase);
process.on('SIGINT', async () => {
  await closeAnalyticsDatabase();
  process.exit(0);
});
process.on('SIGTERM', async () => {
  await closeAnalyticsDatabase();
  process.exit(0);
});

// 簡化的導出
export const analyticsDb = getAnalyticsClient();
```

### 4. 實際使用範例

#### 控制器層同時使用多個資料庫
```typescript
// src/controllers/resource.controller.ts
import { Request, Response } from 'express';
import { getMainClient } from '../services/main-database';
import { getAnalyticsClient } from '../services/analytics-database';

/**
 * 查看資源詳情 (同時記錄統計)
 */
export const viewResource = async (req: Request, res: Response) => {
  try {
    const mainDb = await getMainClient();
    const analyticsDb = await getAnalyticsClient();
    
    // 1. 從主資料庫獲取資源詳情
    const resource = await mainDb.resources.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        categories_resources_major_category_idTocategories: true,
        users: {
          select: { nickname: true, external_id: true }
        }
      }
    });

    if (!resource) {
      return res.status(404).json({ 
        success: false, 
        error: 'Resource not found' 
      });
    }

    // 2. 異步記錄瀏覽統計到統計資料庫 (不阻塞回應)
    setImmediate(async () => {
      try {
        await analyticsDb.analytics_views.create({
          data: {
            user_id: req.user?.id,
            session_id: req.sessionID,
            target_type: 'resource',
            target_id: resource.external_id || resource.id.toString(),
            page_url: req.originalUrl,
            page_title: resource.name,
            device_type: getDeviceType(req.headers['user-agent']),
            browser: getBrowser(req.headers['user-agent']),
            referrer: req.headers.referer,
            created_at: new Date(),
          }
        });
      } catch (error) {
        console.error('記錄瀏覽統計失敗:', error);
        // 統計記錄失敗不影響主要功能
      }
    });

    // 3. 返回資源資料
    res.json({ 
      success: true, 
      data: resource 
    });

  } catch (error) {
    console.error('查看資源錯誤:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
};

/**
 * 記錄點擊事件
 */
export const trackClick = async (req: Request, res: Response) => {
  try {
    const analyticsDb = await getAnalyticsClient();
    
    const clickData = await analyticsDb.analytics_clicks.create({
      data: {
        user_id: req.user?.id,
        session_id: req.sessionID,
        target_type: req.body.target_type,
        target_id: req.body.target_id,
        element_type: req.body.element_type,
        element_selector: req.body.element_selector,
        page_x: req.body.page_x,
        page_y: req.body.page_y,
        created_at: new Date(),
      }
    });

    res.json({ 
      success: true, 
      data: { id: clickData.id } 
    });

  } catch (error) {
    console.error('記錄點擊事件錯誤:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to track click' 
    });
  }
};

// 輔助函數
function getDeviceType(userAgent?: string): string {
  if (!userAgent) return 'unknown';
  if (/Mobile|Android|iPhone|iPad/.test(userAgent)) return 'mobile';
  if (/Tablet/.test(userAgent)) return 'tablet';
  return 'desktop';
}

function getBrowser(userAgent?: string): string {
  if (!userAgent) return 'unknown';
  if (userAgent.includes('Chrome')) return 'chrome';
  if (userAgent.includes('Firefox')) return 'firefox';
  if (userAgent.includes('Safari')) return 'safari';
  if (userAgent.includes('Edge')) return 'edge';
  return 'other';
}
```

#### 統計查詢服務
```typescript
// src/services/analytics.service.ts
import { getAnalyticsClient } from './analytics-database';

export class AnalyticsService {
  private analyticsDb = getAnalyticsClient();

  /**
   * 獲取資源瀏覽統計
   */
  async getResourceViewStats(resourceId: string, days: number = 7) {
    const db = await this.analyticsDb;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await db.analytics_views.groupBy({
      by: ['target_id'],
      where: {
        target_id: resourceId,
        target_type: 'resource',
        created_at: {
          gte: startDate
        }
      },
      _count: {
        id: true
      },
      _avg: {
        duration: true
      }
    });
  }

  /**
   * 獲取每日統計數據
   */
  async getDailyStats(startDate: Date, endDate: Date) {
    const db = await this.analyticsDb;
    
    return await db.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as total_views,
        COUNT(DISTINCT user_id) as unique_users,
        AVG(duration) as avg_duration
      FROM analytics_views 
      WHERE created_at BETWEEN ${startDate} AND ${endDate}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;
  }

  /**
   * 獲取熱門內容排行
   */
  async getPopularContent(type: string, period: number = 7, limit: number = 10) {
    const db = await this.analyticsDb;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    return await db.analytics_views.groupBy({
      by: ['target_id'],
      where: {
        target_type: type,
        created_at: {
          gte: startDate
        }
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: limit
    });
  }

  /**
   * 獲取用戶行為分析
   */
  async getUserBehaviorAnalysis(userId: number, days: number = 30) {
    const db = await this.analyticsDb;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [views, clicks] = await Promise.all([
      // 瀏覽行為
      db.analytics_views.findMany({
        where: {
          user_id: userId,
          created_at: { gte: startDate }
        },
        select: {
          target_type: true,
          target_id: true,
          duration: true,
          created_at: true,
        },
        orderBy: { created_at: 'desc' }
      }),
      
      // 點擊行為
      db.analytics_clicks.findMany({
        where: {
          user_id: userId,
          created_at: { gte: startDate }
        },
        select: {
          target_type: true,
          target_id: true,
          element_type: true,
          created_at: true,
        },
        orderBy: { created_at: 'desc' }
      })
    ]);

    return { views, clicks };
  }
}

// 導出服務實例
export const analyticsService = new AnalyticsService();
```

### 5. 數據遷移管理

#### 分別管理不同資料庫的遷移
```bash
# 主資料庫遷移
npx prisma migrate dev --name "add_user_preferences"

# 統計資料庫遷移  
npx prisma migrate dev --name "init_analytics_tables" --schema=prisma/analytics.prisma

# 檢查遷移狀態
npx prisma migrate status
npx prisma migrate status --schema=prisma/analytics.prisma

# 重置資料庫 (開發環境)
npx prisma migrate reset
npx prisma migrate reset --schema=prisma/analytics.prisma

# 生產環境部署遷移
npx prisma migrate deploy
npx prisma migrate deploy --schema=prisma/analytics.prisma
```

#### Docker Compose 中配置多個資料庫
```yaml
# docker-compose.yml
version: '3.8'
services:
  main-postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: daodao_main
      POSTGRES_USER: main_user
      POSTGRES_PASSWORD: main_password
    ports:
      - "5432:5432"
    volumes:
      - main_postgres_data:/var/lib/postgresql/data

  analytics-postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: daodao_analytics
      POSTGRES_USER: analytics_user
      POSTGRES_PASSWORD: analytics_password
    ports:
      - "5433:5432"
    volumes:
      - analytics_postgres_data:/var/lib/postgresql/data

volumes:
  main_postgres_data:
  analytics_postgres_data:
```

### 2. 環境變數配置

```bash
# 主資料庫
DATABASE_URL="postgresql://user:password@localhost:5432/daodao_main"

# 統計資料庫
ANALYTICS_DATABASE_URL="postgresql://user:password@localhost:5432/daodao_analytics"
```

### 3. 服務層架構

#### 主資料庫服務 (src/services/database.ts)
- 維持現有結構
- 處理核心業務邏輯

#### 統計資料庫服務 (src/services/analytics-database.ts)
```typescript
import { PrismaClient as AnalyticsPrismaClient } from '../../generated/prisma-analytics';

export class AnalyticsService {
  private client: AnalyticsPrismaClient;
  
  // 頁面瀏覽追蹤
  async trackView(data: ViewTrackingData): Promise<void>
  
  // 點擊事件追蹤
  async trackClick(data: ClickTrackingData): Promise<void>
  
  // 用戶互動追蹤
  async trackInteraction(data: InteractionTrackingData): Promise<void>
  
  // 統計數據查詢
  async getViewStats(filters: StatsFilters): Promise<ViewStats>
  async getClickStats(filters: StatsFilters): Promise<ClickStats>
  async getDailyStats(filters: DateFilters): Promise<DailyStats[]>
}
```

### 4. 數據遷移策略

#### 階段一: 雙寫模式
- 新統計資料同時寫入主資料庫和統計資料庫
- 保持現有API介面不變
- 逐步驗證統計資料庫數據正確性

#### 階段二: 數據遷移
- 將歷史統計數據從主資料庫遷移到統計資料庫
- 建立數據一致性檢驗機制

#### 階段三: 切換讀取
- 統計查詢逐步切換到統計資料庫
- 保留主資料庫統計表作為備份

#### 階段四: 清理主資料庫
- 確認統計資料庫穩定運行後
- 清理主資料庫中的統計相關表格

## API 設計

### 統計數據 API

#### 頁面瀏覽統計
```typescript
// 追蹤頁面瀏覽
POST /api/v1/analytics/views
{
  target_type: "resource",
  target_id: "uuid",
  page_url: "/resources/uuid",
  duration: 30000,
  device_type: "desktop"
}

// 查詢瀏覽統計
GET /api/v1/analytics/views?target_type=resource&target_id=uuid&date_range=7d
```

#### 點擊事件統計
```typescript
// 追蹤點擊事件
POST /api/v1/analytics/clicks
{
  target_type: "resource",
  target_id: "uuid", 
  element_type: "button",
  element_selector: ".download-btn",
  page_x: 100,
  page_y: 200
}

// 查詢點擊統計
GET /api/v1/analytics/clicks?target_type=resource&date_range=30d
```

#### 聚合統計查詢
```typescript
// 查詢每日統計
GET /api/v1/analytics/daily-stats?start_date=2024-01-01&end_date=2024-01-31

// 查詢熱門內容
GET /api/v1/analytics/popular?type=resources&period=week&limit=10

// 查詢用戶行為分析
GET /api/v1/analytics/user-behavior?user_id=123&date_range=30d
```

## 效能考量

### 索引策略
- **時間索引**: 所有統計表都建立 created_at 索引
- **查詢索引**: 根據常用查詢條件建立複合索引
- **分區策略**: 考慮按時間分區大表格

### 查詢優化
- **聚合查詢**: 使用 analytics_daily_stats 預計算結果
- **批次寫入**: 統計數據採用批次寫入提升效能
- **快取策略**: 熱門統計數據快取到 Redis

### 資料保留政策
- **原始數據**: 保留 2 年
- **聚合數據**: 永久保留
- **日誌清理**: 定期清理過期數據

## 監控與維護

### 健康檢查
- 統計資料庫連接狀態監控
- 數據同步狀態監控
- 查詢效能監控

### 數據品質
- 數據一致性檢驗
- 異常數據檢測
- 統計準確性驗證

### 備份策略
- 統計資料庫定期備份
- 聚合數據備份
- 災難恢復計劃

## 實施計劃

### 第一階段 (2 週)
- [ ] 建立統計資料庫 Schema
- [ ] 實作統計資料庫服務層
- [ ] 建立基本的追蹤 API
- [ ] 實作雙寫機制

### 第二階段 (2 週)  
- [ ] 歷史數據遷移
- [ ] 數據一致性驗證
- [ ] 統計查詢 API 實作
- [ ] 聚合統計功能

### 第三階段 (1 週)
- [ ] 效能測試與優化
- [ ] 監控系統建立
- [ ] 文件完善
- [ ] 上線部署

### 第四階段 (1 週)
- [ ] 穩定性觀察
- [ ] 主資料庫統計表清理
- [ ] 最終驗證與文件更新

## 風險評估

### 技術風險
- **數據同步風險**: 雙寫過程中可能出現數據不一致
- **效能風險**: 統計查詢可能影響主資料庫效能
- **遷移風險**: 大量歷史數據遷移可能耗時較長

### 緩解策略
- 實作數據一致性檢驗機制
- 使用讀寫分離策略
- 分批進行歷史數據遷移
- 建立回滾機制

## 結論

透過建立獨立的統計資料庫，可以有效分離統計功能與核心業務邏輯，提升系統整體效能與可維護性。建議按照階段性實施計劃逐步推進，確保系統穩定性與數據完整性。