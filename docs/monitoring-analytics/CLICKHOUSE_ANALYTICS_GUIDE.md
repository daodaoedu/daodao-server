# ClickHouse 分析統計系統使用指南

## 概述

這份文件詳細說明如何在 DaoDao 專案中使用 ClickHouse 來進行分析統計功能，包含 click、reaction、view 等事件資料收集與分析。

ClickHouse 是一個用於線上分析處理 (OLAP) 的列式資料庫管理系統，特別適合處理大量事件資料的即時分析與統計。

## 架構設計

### 資料流架構

```
用戶行為事件 → API 端點 → 事件服務 → ClickHouse → 分析報表
     ↓
PostgreSQL (業務邏輯) + ClickHouse (分析統計)
```

### 雙資料庫策略

- **PostgreSQL**: 存儲核心業務資料（users, practices, comments 等）
- **ClickHouse**: 存儲分析事件資料（clicks, views, reactions, shares）

## ClickHouse 連接配置

### 環境變數設定

在 `.env.dev` 和 `.env.prod` 中新增：

```bash
# ClickHouse 連接配置
CLICKHOUSE_URL=http://clickhouse-dev:8123
CLICKHOUSE_HOST=clickhouse-dev
CLICKHOUSE_PORT=8123
CLICKHOUSE_DATABASE=daodao_analytics
CLICKHOUSE_USERNAME=default
CLICKHOUSE_PASSWORD=
CLICKHOUSE_ENABLE_COMPRESSION=true
CLICKHOUSE_MAX_CONNECTIONS=10
```

### Docker Compose 配置

ClickHouse 服務已設定在外部資料庫專案中：

```yaml
# 外部 docker-compose.yaml 中的 ClickHouse 服務
clickhouse-dev:
  image: clickhouse/clickhouse-server:latest
  container_name: clickhouse-dev
  networks:
    - dev-daodao-network
  ports:
    - "8123:8123"
    - "9000:9000"
  volumes:
    - clickhouse_dev_data:/var/lib/clickhouse
  environment:
    CLICKHOUSE_DB: daodao_analytics
    CLICKHOUSE_DEFAULT_ACCESS_MANAGEMENT: 1
```

## 事件資料模型

### 統一事件架構

所有分析事件都遵循統一的資料模型：

```sql
-- 統一事件表
CREATE TABLE events (
    event_id String,
    event_type Enum8('view' = 1, 'click' = 2, 'reaction' = 3, 'share' = 4, 'favorite' = 5),
    entity_type Enum8('practice' = 1, 'comment' = 2, 'resource' = 3, 'user' = 4),
    entity_id String,
    user_id UInt32,
    session_id String,
    timestamp DateTime DEFAULT now(),
    
    -- 事件特定欄位
    click_type String,
    click_target String,
    click_position String,
    
    reaction_type String,
    
    view_duration UInt32,
    view_referrer String,
    
    share_platform String,
    share_url String,
    
    -- 通用 metadata
    metadata String, -- JSON 格式
    
    -- 技術欄位
    ip_address String,
    user_agent String,
    created_date Date DEFAULT today()
) ENGINE = MergeTree()
PARTITION BY created_date
ORDER BY (entity_type, entity_id, event_type, timestamp)
SETTINGS index_granularity = 8192;
```

### 專用事件表（優化查詢效能）

#### 瀏覽事件表
```sql
CREATE TABLE view_events (
    event_id String,
    entity_type Enum8('practice' = 1, 'comment' = 2, 'resource' = 3),
    entity_id String,
    user_id UInt32,
    session_id String,
    duration UInt32, -- 瀏覽時長（秒）
    referrer String,
    entry_point String,
    exit_point String,
    scroll_depth Float32, -- 滾動深度 0-1
    timestamp DateTime DEFAULT now(),
    created_date Date DEFAULT today()
) ENGINE = MergeTree()
PARTITION BY created_date
ORDER BY (entity_type, entity_id, timestamp)
SETTINGS index_granularity = 8192;
```

#### 點擊事件表
```sql
CREATE TABLE click_events (
    event_id String,
    entity_type Enum8('practice' = 1, 'comment' = 2, 'resource' = 3),
    entity_id String,
    user_id UInt32,
    session_id String,
    click_type String, -- 'like', 'share', 'comment', 'bookmark'
    click_target String, -- 點擊的具體元素
    click_position String, -- 'header', 'content', 'footer'
    click_coordinates Tuple(UInt16, UInt16), -- x, y 座標
    timestamp DateTime DEFAULT now(),
    created_date Date DEFAULT today()
) ENGINE = MergeTree()
PARTITION BY created_date
ORDER BY (entity_type, entity_id, click_type, timestamp)
SETTINGS index_granularity = 8192;
```

#### 反應事件表
```sql
CREATE TABLE reaction_events (
    event_id String,
    entity_type Enum8('practice' = 1, 'comment' = 2, 'resource' = 3),
    entity_id String,
    user_id UInt32,
    session_id String,
    reaction_type String, -- 'like', 'heart', 'thumbs_up'
    action String, -- 'add', 'remove'
    timestamp DateTime DEFAULT now(),
    created_date Date DEFAULT today()
) ENGINE = MergeTree()
PARTITION BY created_date
ORDER BY (entity_type, entity_id, reaction_type, timestamp)
SETTINGS index_granularity = 8192;
```

#### 分享事件表
```sql
CREATE TABLE share_events (
    event_id String,
    entity_type Enum8('practice' = 1, 'comment' = 2, 'resource' = 3),
    entity_id String,
    user_id UInt32,
    session_id String,
    platform String, -- 'facebook', 'twitter', 'line', 'email'
    share_url String,
    share_title String,
    share_content String,
    timestamp DateTime DEFAULT now(),
    created_date Date DEFAULT today()
) ENGINE = MergeTree()
PARTITION BY created_date
ORDER BY (entity_type, entity_id, platform, timestamp)
SETTINGS index_granularity = 8192;
```

#### 收藏事件表
```sql
CREATE TABLE favorite_events (
    event_id String,
    entity_type Enum8('practice' = 1, 'comment' = 2, 'resource' = 3),
    entity_id String,
    user_id UInt32,
    session_id String,
    action String, -- 'add', 'remove'
    timestamp DateTime DEFAULT now(),
    created_date Date DEFAULT today()
) ENGINE = MergeTree()
PARTITION BY created_date
ORDER BY (entity_type, entity_id, timestamp)
SETTINGS index_granularity = 8192;
```

## ClickHouse 服務實作

### 基礎 ClickHouse 服務

```typescript
// src/services/database/clickhouse.service.ts
import { createClient, ClickHouseClient } from '@clickhouse/client';
import { loggerService } from '../logging/logger.service';

export class ClickHouseService {
  private client: ClickHouseClient;
  private isConnected = false;

  constructor() {
    this.client = createClient({
      host: process.env.CLICKHOUSE_URL || 'http://clickhouse-dev:8123',
      database: process.env.CLICKHOUSE_DATABASE || 'daodao_analytics',
      username: process.env.CLICKHOUSE_USERNAME || 'default',
      password: process.env.CLICKHOUSE_PASSWORD || '',
      compression: {
        response: process.env.CLICKHOUSE_ENABLE_COMPRESSION === 'true',
        request: process.env.CLICKHOUSE_ENABLE_COMPRESSION === 'true'
      },
      max_open_connections: parseInt(process.env.CLICKHOUSE_MAX_CONNECTIONS || '10'),
      clickhouse_settings: {
        max_execution_time: 60,
        enable_http_compression: 1
      }
    });
  }

  async connect(): Promise<void> {
    try {
      await this.client.ping();
      this.isConnected = true;
      loggerService.info('ClickHouse connected successfully');
    } catch (error) {
      this.isConnected = false;
      loggerService.error('Failed to connect to ClickHouse', { error });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.close();
      this.isConnected = false;
      loggerService.info('ClickHouse disconnected');
    }
  }

  getClient(): ClickHouseClient {
    if (!this.isConnected) {
      throw new Error('ClickHouse is not connected');
    }
    return this.client;
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.ping();
      return true;
    } catch {
      return false;
    }
  }

  // 建立資料庫表格
  async initializeTables(): Promise<void> {
    const tables = [
      this.getViewEventsTableSQL(),
      this.getClickEventsTableSQL(),
      this.getReactionEventsTableSQL(),
      this.getShareEventsTableSQL(),
      this.getFavoriteEventsTableSQL()
    ];

    for (const tableSQL of tables) {
      try {
        await this.client.command({ query: tableSQL });
        loggerService.info('ClickHouse table created successfully');
      } catch (error) {
        loggerService.error('Failed to create ClickHouse table', { error, sql: tableSQL });
        throw error;
      }
    }
  }

  private getViewEventsTableSQL(): string {
    return `
      CREATE TABLE IF NOT EXISTS view_events (
        event_id String,
        entity_type Enum8('practice' = 1, 'comment' = 2, 'resource' = 3),
        entity_id String,
        user_id UInt32,
        session_id String,
        duration UInt32,
        referrer String,
        entry_point String,
        exit_point String,
        scroll_depth Float32,
        timestamp DateTime DEFAULT now(),
        created_date Date DEFAULT today()
      ) ENGINE = MergeTree()
      PARTITION BY created_date
      ORDER BY (entity_type, entity_id, timestamp)
      SETTINGS index_granularity = 8192;
    `;
  }

  private getClickEventsTableSQL(): string {
    return `
      CREATE TABLE IF NOT EXISTS click_events (
        event_id String,
        entity_type Enum8('practice' = 1, 'comment' = 2, 'resource' = 3),
        entity_id String,
        user_id UInt32,
        session_id String,
        click_type String,
        click_target String,
        click_position String,
        click_coordinates Tuple(UInt16, UInt16),
        timestamp DateTime DEFAULT now(),
        created_date Date DEFAULT today()
      ) ENGINE = MergeTree()
      PARTITION BY created_date
      ORDER BY (entity_type, entity_id, click_type, timestamp)
      SETTINGS index_granularity = 8192;
    `;
  }

  private getReactionEventsTableSQL(): string {
    return `
      CREATE TABLE IF NOT EXISTS reaction_events (
        event_id String,
        entity_type Enum8('practice' = 1, 'comment' = 2, 'resource' = 3),
        entity_id String,
        user_id UInt32,
        session_id String,
        reaction_type String,
        action String,
        timestamp DateTime DEFAULT now(),
        created_date Date DEFAULT today()
      ) ENGINE = MergeTree()
      PARTITION BY created_date
      ORDER BY (entity_type, entity_id, reaction_type, timestamp)
      SETTINGS index_granularity = 8192;
    `;
  }

  private getShareEventsTableSQL(): string {
    return `
      CREATE TABLE IF NOT EXISTS share_events (
        event_id String,
        entity_type Enum8('practice' = 1, 'comment' = 2, 'resource' = 3),
        entity_id String,
        user_id UInt32,
        session_id String,
        platform String,
        share_url String,
        share_title String,
        share_content String,
        timestamp DateTime DEFAULT now(),
        created_date Date DEFAULT today()
      ) ENGINE = MergeTree()
      PARTITION BY created_date
      ORDER BY (entity_type, entity_id, platform, timestamp)
      SETTINGS index_granularity = 8192;
    `;
  }

  private getFavoriteEventsTableSQL(): string {
    return `
      CREATE TABLE IF NOT EXISTS favorite_events (
        event_id String,
        entity_type Enum8('practice' = 1, 'comment' = 2, 'resource' = 3),
        entity_id String,
        user_id UInt32,
        session_id String,
        action String,
        timestamp DateTime DEFAULT now(),
        created_date Date DEFAULT today()
      ) ENGINE = MergeTree()
      PARTITION BY created_date
      ORDER BY (entity_type, entity_id, timestamp)
      SETTINGS index_granularity = 8192;
    `;
  }
}

export const clickHouseService = new ClickHouseService();
export default clickHouseService;
```

### 分析事件服務

```typescript
// src/services/analytics-event.service.ts
import { v4 as uuidv4 } from 'uuid';
import { clickHouseService } from './database/clickhouse.service';
import { loggerService } from './logging/logger.service';

export interface AnalyticsEvent {
  eventId?: string;
  entityType: 'practice' | 'comment' | 'resource';
  entityId: string;
  userId: number;
  sessionId: string;
  timestamp?: Date;
}

export interface ViewEvent extends AnalyticsEvent {
  duration?: number;
  referrer?: string;
  entryPoint?: string;
  exitPoint?: string;
  scrollDepth?: number;
}

export interface ClickEvent extends AnalyticsEvent {
  clickType: string;
  clickTarget: string;
  clickPosition?: string;
  clickCoordinates?: [number, number];
}

export interface ReactionEvent extends AnalyticsEvent {
  reactionType: string;
  action: 'add' | 'remove';
}

export interface ShareEvent extends AnalyticsEvent {
  platform: string;
  shareUrl?: string;
  shareTitle?: string;
  shareContent?: string;
}

export interface FavoriteEvent extends AnalyticsEvent {
  action: 'add' | 'remove';
}

export class AnalyticsEventService {
  
  // 記錄瀏覽事件
  async recordViewEvent(event: ViewEvent): Promise<void> {
    const eventId = event.eventId || uuidv4();
    
    try {
      const client = clickHouseService.getClient();
      
      await client.insert({
        table: 'view_events',
        values: [{
          event_id: eventId,
          entity_type: event.entityType,
          entity_id: event.entityId,
          user_id: event.userId,
          session_id: event.sessionId,
          duration: event.duration || 0,
          referrer: event.referrer || '',
          entry_point: event.entryPoint || '',
          exit_point: event.exitPoint || '',
          scroll_depth: event.scrollDepth || 0,
          timestamp: event.timestamp || new Date()
        }],
        format: 'JSONEachRow'
      });

      loggerService.info('View event recorded to ClickHouse', {
        eventId,
        entityType: event.entityType,
        entityId: event.entityId,
        userId: event.userId
      });

    } catch (error) {
      loggerService.error('Failed to record view event to ClickHouse', { event, error });
      throw error;
    }
  }

  // 記錄點擊事件
  async recordClickEvent(event: ClickEvent): Promise<void> {
    const eventId = event.eventId || uuidv4();
    
    try {
      const client = clickHouseService.getClient();
      
      await client.insert({
        table: 'click_events',
        values: [{
          event_id: eventId,
          entity_type: event.entityType,
          entity_id: event.entityId,
          user_id: event.userId,
          session_id: event.sessionId,
          click_type: event.clickType,
          click_target: event.clickTarget,
          click_position: event.clickPosition || '',
          click_coordinates: event.clickCoordinates || [0, 0],
          timestamp: event.timestamp || new Date()
        }],
        format: 'JSONEachRow'
      });

      loggerService.info('Click event recorded to ClickHouse', {
        eventId,
        entityType: event.entityType,
        entityId: event.entityId,
        clickType: event.clickType
      });

    } catch (error) {
      loggerService.error('Failed to record click event to ClickHouse', { event, error });
      throw error;
    }
  }

  // 記錄反應事件
  async recordReactionEvent(event: ReactionEvent): Promise<void> {
    const eventId = event.eventId || uuidv4();
    
    try {
      const client = clickHouseService.getClient();
      
      await client.insert({
        table: 'reaction_events',
        values: [{
          event_id: eventId,
          entity_type: event.entityType,
          entity_id: event.entityId,
          user_id: event.userId,
          session_id: event.sessionId,
          reaction_type: event.reactionType,
          action: event.action,
          timestamp: event.timestamp || new Date()
        }],
        format: 'JSONEachRow'
      });

      loggerService.info('Reaction event recorded to ClickHouse', {
        eventId,
        entityType: event.entityType,
        entityId: event.entityId,
        reactionType: event.reactionType,
        action: event.action
      });

    } catch (error) {
      loggerService.error('Failed to record reaction event to ClickHouse', { event, error });
      throw error;
    }
  }

  // 記錄分享事件
  async recordShareEvent(event: ShareEvent): Promise<void> {
    const eventId = event.eventId || uuidv4();
    
    try {
      const client = clickHouseService.getClient();
      
      await client.insert({
        table: 'share_events',
        values: [{
          event_id: eventId,
          entity_type: event.entityType,
          entity_id: event.entityId,
          user_id: event.userId,
          session_id: event.sessionId,
          platform: event.platform,
          share_url: event.shareUrl || '',
          share_title: event.shareTitle || '',
          share_content: event.shareContent || '',
          timestamp: event.timestamp || new Date()
        }],
        format: 'JSONEachRow'
      });

      loggerService.info('Share event recorded to ClickHouse', {
        eventId,
        entityType: event.entityType,
        entityId: event.entityId,
        platform: event.platform
      });

    } catch (error) {
      loggerService.error('Failed to record share event to ClickHouse', { event, error });
      throw error;
    }
  }

  // 記錄收藏事件
  async recordFavoriteEvent(event: FavoriteEvent): Promise<void> {
    const eventId = event.eventId || uuidv4();
    
    try {
      const client = clickHouseService.getClient();
      
      await client.insert({
        table: 'favorite_events',
        values: [{
          event_id: eventId,
          entity_type: event.entityType,
          entity_id: event.entityId,
          user_id: event.userId,
          session_id: event.sessionId,
          action: event.action,
          timestamp: event.timestamp || new Date()
        }],
        format: 'JSONEachRow'
      });

      loggerService.info('Favorite event recorded to ClickHouse', {
        eventId,
        entityType: event.entityType,
        entityId: event.entityId,
        action: event.action
      });

    } catch (error) {
      loggerService.error('Failed to record favorite event to ClickHouse', { event, error });
      throw error;
    }
  }

  // 批量記錄事件
  async recordBatchEvents(events: Array<ViewEvent | ClickEvent | ReactionEvent | ShareEvent | FavoriteEvent>): Promise<void> {
    const batchSize = 1000;
    
    for (let i = 0; i < events.length; i += batchSize) {
      const batch = events.slice(i, i + batchSize);
      
      try {
        await Promise.all(batch.map(event => {
          if ('duration' in event) return this.recordViewEvent(event);
          if ('clickType' in event) return this.recordClickEvent(event);
          if ('reactionType' in event) return this.recordReactionEvent(event);
          if ('platform' in event) return this.recordShareEvent(event);
          if ('action' in event && !('reactionType' in event)) return this.recordFavoriteEvent(event);
          throw new Error('Unknown event type');
        }));
        
        loggerService.info('Batch events recorded to ClickHouse', {
          batchSize: batch.length,
          totalProcessed: i + batch.length
        });
        
      } catch (error) {
        loggerService.error('Failed to record batch events to ClickHouse', { 
          batchStart: i, 
          batchSize: batch.length, 
          error 
        });
        throw error;
      }
    }
  }
}

export const analyticsEventService = new AnalyticsEventService();
export default analyticsEventService;
```

## 整合現有服務

### 修改現有 Practice Interaction Service

```typescript
// src/services/practice-interaction.service.ts - 新增 ClickHouse 整合
import { analyticsEventService } from './analytics-event.service';

export class PracticeInteractionService {
  // ... 現有程式碼 ...

  async toggleLike(practiceId: string, userId: number): Promise<ApiResponse<{ isLiked: boolean; likeCount: number }>> {
    try {
      // ... 現有的 PostgreSQL 邏輯 ...

      // 新增 ClickHouse 事件記錄
      await analyticsEventService.recordReactionEvent({
        entityType: 'practice',
        entityId: practiceId,
        userId,
        sessionId: this.generateSessionId(),
        reactionType: 'like',
        action: isLiked ? 'add' : 'remove'
      });

      // ... 回傳結果 ...
    } catch (error) {
      // ... 錯誤處理 ...
    }
  }

  async recordView(practiceId: string, userId: number, viewData?: {
    duration?: number;
    referrer?: string;
    metadata?: Record<string, unknown>;
  }): Promise<ApiResponse<{ viewCount: number }>> {
    try {
      // 保留 PostgreSQL 的 view 記錄邏輯
      // ... 現有程式碼 ...

      // 新增 ClickHouse 事件記錄
      await analyticsEventService.recordViewEvent({
        entityType: 'practice',
        entityId: practiceId,
        userId,
        sessionId: this.generateSessionId(),
        duration: viewData?.duration,
        referrer: viewData?.referrer,
        scrollDepth: viewData?.metadata?.scrollDepth as number
      });

      // ... 回傳結果 ...
    } catch (error) {
      // ... 錯誤處理 ...
    }
  }

  private generateSessionId(): string {
    // 實作 session ID 生成邏輯
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

## 分析查詢與報表

### 分析查詢服務

```typescript
// src/services/analytics-query.service.ts
import { clickHouseService } from './database/clickhouse.service';
import { loggerService } from './logging/logger.service';

export interface AnalyticsQueryParams {
  entityType?: string;
  entityId?: string;
  userId?: number;
  startDate?: string;
  endDate?: string;
  granularity?: 'hour' | 'day' | 'week' | 'month';
}

export interface PopularityStats {
  entityId: string;
  viewCount: number;
  likeCount: number;
  shareCount: number;
  favoriteCount: number;
  engagementScore: number;
}

export interface TrendingStats {
  period: string;
  viewCount: number;
  clickCount: number;
  reactionCount: number;
  shareCount: number;
}

export class AnalyticsQueryService {

  // 取得實體統計資料
  async getEntityStats(entityId: string, entityType = 'practice'): Promise<{
    views: number;
    uniqueViews: number;
    clicks: number;
    reactions: number;
    shares: number;
    favorites: number;
    avgViewDuration: number;
    totalViewDuration: number;
  }> {
    try {
      const client = clickHouseService.getClient();

      const query = `
        SELECT 
          COUNT(DISTINCT ve.event_id) as views,
          COUNT(DISTINCT ve.user_id) as unique_views,
          AVG(ve.duration) as avg_view_duration,
          SUM(ve.duration) as total_view_duration,
          COUNT(DISTINCT ce.event_id) as clicks,
          COUNT(DISTINCT re.event_id) as reactions,
          COUNT(DISTINCT se.event_id) as shares,
          COUNT(DISTINCT fe.event_id) as favorites
        FROM (
          SELECT event_id, user_id, duration FROM view_events 
          WHERE entity_id = {entityId:String} AND entity_type = {entityType:String}
        ) ve
        FULL OUTER JOIN (
          SELECT event_id FROM click_events 
          WHERE entity_id = {entityId:String} AND entity_type = {entityType:String}
        ) ce ON 1=1
        FULL OUTER JOIN (
          SELECT event_id FROM reaction_events 
          WHERE entity_id = {entityId:String} AND entity_type = {entityType:String}
        ) re ON 1=1
        FULL OUTER JOIN (
          SELECT event_id FROM share_events 
          WHERE entity_id = {entityId:String} AND entity_type = {entityType:String}
        ) se ON 1=1
        FULL OUTER JOIN (
          SELECT event_id FROM favorite_events 
          WHERE entity_id = {entityId:String} AND entity_type = {entityType:String}
        ) fe ON 1=1
      `;

      const result = await client.query({
        query,
        query_params: { entityId, entityType }
      });

      const stats = await result.json();
      
      return {
        views: stats.data[0]?.views || 0,
        uniqueViews: stats.data[0]?.unique_views || 0,
        clicks: stats.data[0]?.clicks || 0,
        reactions: stats.data[0]?.reactions || 0,
        shares: stats.data[0]?.shares || 0,
        favorites: stats.data[0]?.favorites || 0,
        avgViewDuration: stats.data[0]?.avg_view_duration || 0,
        totalViewDuration: stats.data[0]?.total_view_duration || 0
      };

    } catch (error) {
      loggerService.error('Failed to get entity stats from ClickHouse', { entityId, entityType, error });
      throw error;
    }
  }

  // 取得趨勢資料
  async getTrendingData(params: AnalyticsQueryParams): Promise<TrendingStats[]> {
    try {
      const client = clickHouseService.getClient();
      const { startDate, endDate, granularity = 'day' } = params;

      const dateFormat = this.getDateFormat(granularity);
      
      const query = `
        SELECT 
          formatDateTime(timestamp, '${dateFormat}') as period,
          COUNT(DISTINCT ve.event_id) as view_count,
          COUNT(DISTINCT ce.event_id) as click_count,
          COUNT(DISTINCT re.event_id) as reaction_count,
          COUNT(DISTINCT se.event_id) as share_count
        FROM (
          SELECT event_id, timestamp FROM view_events 
          WHERE timestamp >= {startDate:String} AND timestamp <= {endDate:String}
          ${params.entityType ? "AND entity_type = {entityType:String}" : ""}
        ) ve
        FULL OUTER JOIN (
          SELECT event_id, timestamp FROM click_events 
          WHERE timestamp >= {startDate:String} AND timestamp <= {endDate:String}
          ${params.entityType ? "AND entity_type = {entityType:String}" : ""}
        ) ce ON formatDateTime(ve.timestamp, '${dateFormat}') = formatDateTime(ce.timestamp, '${dateFormat}')
        FULL OUTER JOIN (
          SELECT event_id, timestamp FROM reaction_events 
          WHERE timestamp >= {startDate:String} AND timestamp <= {endDate:String}
          ${params.entityType ? "AND entity_type = {entityType:String}" : ""}
        ) re ON formatDateTime(ve.timestamp, '${dateFormat}') = formatDateTime(re.timestamp, '${dateFormat}')
        FULL OUTER JOIN (
          SELECT event_id, timestamp FROM share_events 
          WHERE timestamp >= {startDate:String} AND timestamp <= {endDate:String}
          ${params.entityType ? "AND entity_type = {entityType:String}" : ""}
        ) se ON formatDateTime(ve.timestamp, '${dateFormat}') = formatDateTime(se.timestamp, '${dateFormat}')
        GROUP BY period
        ORDER BY period
      `;

      const result = await client.query({
        query,
        query_params: {
          startDate: startDate || '2024-01-01',
          endDate: endDate || new Date().toISOString(),
          ...(params.entityType && { entityType: params.entityType })
        }
      });

      const data = await result.json();
      
      return data.data.map((row: any) => ({
        period: row.period,
        viewCount: row.view_count || 0,
        clickCount: row.click_count || 0,
        reactionCount: row.reaction_count || 0,
        shareCount: row.share_count || 0
      }));

    } catch (error) {
      loggerService.error('Failed to get trending data from ClickHouse', { params, error });
      throw error;
    }
  }

  // 取得熱門內容排行
  async getPopularContent(entityType = 'practice', limit = 10): Promise<PopularityStats[]> {
    try {
      const client = clickHouseService.getClient();

      const query = `
        SELECT 
          entity_id,
          COUNT(DISTINCT ve.event_id) as view_count,
          COUNT(DISTINCT re.event_id) as like_count,
          COUNT(DISTINCT se.event_id) as share_count,
          COUNT(DISTINCT fe.event_id) as favorite_count,
          (view_count * 1 + like_count * 3 + share_count * 5 + favorite_count * 2) as engagement_score
        FROM (
          SELECT entity_id, event_id FROM view_events WHERE entity_type = {entityType:String}
        ) ve
        FULL OUTER JOIN (
          SELECT entity_id, event_id FROM reaction_events 
          WHERE entity_type = {entityType:String} AND reaction_type = 'like'
        ) re ON ve.entity_id = re.entity_id
        FULL OUTER JOIN (
          SELECT entity_id, event_id FROM share_events WHERE entity_type = {entityType:String}
        ) se ON ve.entity_id = se.entity_id
        FULL OUTER JOIN (
          SELECT entity_id, event_id FROM favorite_events WHERE entity_type = {entityType:String}
        ) fe ON ve.entity_id = fe.entity_id
        GROUP BY entity_id
        ORDER BY engagement_score DESC
        LIMIT {limit:UInt32}
      `;

      const result = await client.query({
        query,
        query_params: { entityType, limit }
      });

      const data = await result.json();
      
      return data.data.map((row: any) => ({
        entityId: row.entity_id,
        viewCount: row.view_count || 0,
        likeCount: row.like_count || 0,
        shareCount: row.share_count || 0,
        favoriteCount: row.favorite_count || 0,
        engagementScore: row.engagement_score || 0
      }));

    } catch (error) {
      loggerService.error('Failed to get popular content from ClickHouse', { entityType, limit, error });
      throw error;
    }
  }

  private getDateFormat(granularity: string): string {
    switch (granularity) {
      case 'hour':
        return '%Y-%m-%d %H:00:00';
      case 'day':
        return '%Y-%m-%d';
      case 'week':
        return '%Y-W%V';
      case 'month':
        return '%Y-%m';
      default:
        return '%Y-%m-%d';
    }
  }
}

export const analyticsQueryService = new AnalyticsQueryService();
export default analyticsQueryService;
```

## API 端點實作

### 分析 API 控制器

```typescript
// src/controllers/analytics.controller.ts
import { Request, Response } from 'express';
import { analyticsQueryService } from '../services/analytics-query.service';
import { analyticsEventService } from '../services/analytics-event.service';
import { loggerService } from '../services/logging/logger.service';

export const analyticsController = {
  
  // 取得實體統計
  async getEntityStats(req: Request, res: Response): Promise<void> {
    try {
      const { entityId } = req.params;
      const { entityType = 'practice' } = req.query;

      const stats = await analyticsQueryService.getEntityStats(
        entityId, 
        entityType as string
      );

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      loggerService.error('Failed to get entity stats', { error });
      res.status(500).json({
        success: false,
        error: { message: '取得統計資料失敗' }
      });
    }
  },

  // 取得趨勢資料
  async getTrendingData(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate, entityType, granularity } = req.query;

      const trending = await analyticsQueryService.getTrendingData({
        startDate: startDate as string,
        endDate: endDate as string,
        entityType: entityType as string,
        granularity: granularity as any
      });

      res.json({
        success: true,
        data: trending
      });

    } catch (error) {
      loggerService.error('Failed to get trending data', { error });
      res.status(500).json({
        success: false,
        error: { message: '取得趨勢資料失敗' }
      });
    }
  },

  // 取得熱門內容
  async getPopularContent(req: Request, res: Response): Promise<void> {
    try {
      const { entityType = 'practice', limit = 10 } = req.query;

      const popular = await analyticsQueryService.getPopularContent(
        entityType as string,
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data: popular
      });

    } catch (error) {
      loggerService.error('Failed to get popular content', { error });
      res.status(500).json({
        success: false,
        error: { message: '取得熱門內容失敗' }
      });
    }
  },

  // 記錄事件（批量）
  async recordEvents(req: Request, res: Response): Promise<void> {
    try {
      const { events } = req.body;

      if (!Array.isArray(events) || events.length === 0) {
        res.status(400).json({
          success: false,
          error: { message: '無效的事件資料' }
        });
        return;
      }

      await analyticsEventService.recordBatchEvents(events);

      res.json({
        success: true,
        data: { recorded: events.length }
      });

    } catch (error) {
      loggerService.error('Failed to record events', { error });
      res.status(500).json({
        success: false,
        error: { message: '記錄事件失敗' }
      });
    }
  }
};
```

### 分析路由

```typescript
// src/routes/analytics.routes.ts
import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// 統計資料端點
router.get('/stats/:entityId', authMiddleware, analyticsController.getEntityStats);
router.get('/trending', authMiddleware, analyticsController.getTrendingData);
router.get('/popular', authMiddleware, analyticsController.getPopularContent);

// 事件記錄端點
router.post('/events', authMiddleware, analyticsController.recordEvents);

export { router as analyticsRoutes };
```

## 部署與維運

### 資料庫初始化腳本

```bash
#!/bin/bash
# scripts/init-clickhouse.sh

echo "Initializing ClickHouse for DaoDao Analytics..."

# 等待 ClickHouse 啟動
until curl -f http://clickhouse-dev:8123/ping; do
  echo "Waiting for ClickHouse to start..."
  sleep 2
done

# 建立資料庫
curl -X POST 'http://clickhouse-dev:8123/' \
  -d 'CREATE DATABASE IF NOT EXISTS daodao_analytics'

echo "ClickHouse database created successfully"

# 透過應用程式初始化表格
curl -X POST 'http://localhost:3000/api/internal/init-clickhouse-tables'

echo "ClickHouse tables initialized successfully"
```

### 健康檢查端點

```typescript
// src/routes/health.routes.ts - 新增 ClickHouse 健康檢查
router.get('/health/clickhouse', async (req: Request, res: Response) => {
  try {
    const isHealthy = await clickHouseService.healthCheck();
    
    res.json({
      success: true,
      data: {
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: { message: 'ClickHouse health check failed' }
    });
  }
});
```

### 效能監控

```typescript
// src/middleware/clickhouse-monitoring.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { loggerService } from '../services/logging/logger.service';

export const clickHouseMonitoringMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // 覆寫 res.json 來監控回應時間
  const originalJson = res.json;
  res.json = function(body: any) {
    const duration = Date.now() - startTime;
    
    // 記錄 ClickHouse 查詢效能
    if (req.path.startsWith('/api/analytics')) {
      loggerService.info('ClickHouse query performance', {
        path: req.path,
        method: req.method,
        duration,
        success: body.success
      });
    }
    
    return originalJson.call(this, body);
  };
  
  next();
};
```

## 最佳實踐

### 1. 批量寫入策略

```typescript
// 使用佇列系統批量寫入事件
export class EventQueue {
  private queue: Array<any> = [];
  private batchSize = 1000;
  private flushInterval = 5000; // 5 秒

  constructor() {
    setInterval(() => this.flush(), this.flushInterval);
  }

  async add(event: any): Promise<void> {
    this.queue.push(event);
    
    if (this.queue.length >= this.batchSize) {
      await this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (this.queue.length === 0) return;
    
    const batch = this.queue.splice(0, this.batchSize);
    await analyticsEventService.recordBatchEvents(batch);
  }
}
```

### 2. 資料分區管理

```sql
-- 自動清理舊資料（保留 1 年）
ALTER TABLE view_events 
MODIFY TTL created_date + INTERVAL 365 DAY;

-- 優化分區
ALTER TABLE view_events 
MODIFY PARTITION BY toYYYYMM(created_date);
```

### 3. 查詢優化

```sql
-- 建立 materialized view 加速常用查詢
CREATE MATERIALIZED VIEW daily_entity_stats
ENGINE = SummingMergeTree()
ORDER BY (entity_type, entity_id, date)
AS SELECT
  entity_type,
  entity_id,
  toDate(timestamp) as date,
  COUNT() as view_count,
  COUNT(DISTINCT user_id) as unique_users
FROM view_events
GROUP BY entity_type, entity_id, date;
```

### 4. 錯誤處理與重試

```typescript
// 實作指數退避重試邏輯
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
}
```

## 總結

透過這個 ClickHouse 分析統計系統，DaoDao 專案可以：

1. **高效收集事件資料**: 支援大量並發的事件寫入
2. **即時分析統計**: 快速查詢和聚合分析
3. **靈活的報表功能**: 支援多維度的資料分析
4. **良好的擴展性**: 可以輕鬆新增新的事件類型
5. **與現有系統整合**: 不影響現有的 PostgreSQL 業務邏輯

記住要定期監控系統效能，調整分區策略，並根據實際使用情況優化查詢。