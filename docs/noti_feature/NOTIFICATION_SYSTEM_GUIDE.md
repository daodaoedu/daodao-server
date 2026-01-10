# DaoDao 通知系統設計指南

## 📋 文件概述

本文件提供 DaoDao 學習平台通知系統的完整導讀,包括專案背景、通知需求分析、技術架構建議及實作規劃。

**目標讀者**: 不熟悉專案的開發者、產品經理、技術決策者

**最後更新**: 2025-12-16

---

## 🎯 專案背景

### DaoDao 平台簡介

DaoDao 是一個**學習管理與社群互動平台**,提供以下核心功能:

- **📚 學習管理**: 專案計畫、里程碑追蹤、任務管理
- **👥 社群互動**: 想法分享、評論系統、資源評價
- **🎯 習慣養成**: 學習實踐打卡、目標設定、進度追蹤
- **🏃 活動組織**: 學習馬拉松、導師系統、團體學習

### 技術架構概覽

```
技術棧:
- 運行環境: Node.js + Express.js
- 程式語言: TypeScript
- 資料庫: PostgreSQL (Prisma ORM) + MongoDB + Redis
- 身份驗證: JWT + Google OAuth
- 已有服務: 郵件系統 (Nodemailer)
```

---

## 🔔 為什麼需要通知系統?

### 業務需求分析

根據專案現有的功能模組,使用者在以下場景需要接收通知:

#### 1. 社群互動通知 (Social Interactions)

| 觸發事件 | 通知對象 | 優先級 | 範例 |
|---------|---------|-------|------|
| 收到評論 | 內容創建者 | 🟡 中 | "小明評論了你的學習資源" |
| 評論被回覆 | 原評論者 | 🟡 中 | "小華回覆了你的評論" |
| 內容被按讚 | 內容創建者 | 🟢 低 | "你的想法獲得 5 個讚" |
| 內容被收藏 | 內容創建者 | 🟢 低 | "你的資源被 3 人收藏" |
| 被標記/提及 | 被提及用戶 | 🟡 中 | "@你 在一則評論中" |

#### 2. 學習進度通知 (Learning Progress)

| 觸發事件 | 通知對象 | 優先級 | 範例 |
|---------|---------|-------|------|
| 里程碑即將到期 | 專案成員 | 🔴 高 | "專案里程碑將於 3 天後到期" |
| 打卡提醒 | 實踐參與者 | 🟡 中 | "今天還沒打卡喔!" |
| 目標達成 | 用戶本人 | 🟡 中 | "恭喜!你已連續打卡 30 天" |
| 學習建議 | 用戶本人 | 🟢 低 | "發現適合你的新資源" |

#### 3. 活動與協作通知 (Events & Collaboration)

| 觸發事件 | 通知對象 | 優先級 | 範例 |
|---------|---------|-------|------|
| 馬拉松活動開始 | 報名參與者 | 🔴 高 | "學習馬拉松已開始!" |
| 導師指派 | 學員 | 🔴 高 | "你的導師是李老師" |
| 專案邀請 | 被邀請用戶 | 🟡 中 | "小明邀請你加入專案" |
| 活動提醒 | 活動參與者 | 🟡 中 | "揪團活動將於明天舉行" |

#### 4. 系統與安全通知 (System & Security)

| 觸發事件 | 通知對象 | 優先級 | 範例 |
|---------|---------|-------|------|
| 帳號異常登入 | 帳號擁有者 | 🔴 高 | "檢測到新裝置登入" |
| 密碼重置請求 | 帳號擁有者 | 🔴 高 | "密碼重置連結" |
| 郵箱驗證 | 新註冊用戶 | 🔴 高 | "請驗證你的郵箱" |
| 系統維護公告 | 全體用戶 | 🟡 中 | "系統將於週日維護" |

---

## 📚 專業名詞解釋

### 通知系統核心概念

#### 1. 通知類型 (Notification Types)

| 類型 | 英文 | 說明 | 技術實現 |
|-----|------|------|---------|
| **站內通知** | In-App Notification | 在網站/APP 內顯示的通知,類似 Facebook 的小鈴鐺 | WebSocket / Server-Sent Events (SSE) |
| **郵件通知** | Email Notification | 發送到用戶信箱的通知 | 已有 Nodemailer,可直接使用 |
| **推送通知** | Push Notification | 傳送到用戶裝置的通知(即使未開啟網站也能收到) | Web Push API / Firebase Cloud Messaging |
| **簡訊通知** | SMS Notification | 發送到用戶手機的簡訊(成本較高) | 第三方服務(Twilio, AWS SNS) |

#### 2. 通知機制 (Notification Mechanisms)

| 機制 | 說明 | 優點 | 缺點 |
|-----|------|------|------|
| **實時推送** (Real-time Push) | 事件發生時立即發送通知 | 即時性高,用戶體驗好 | 需要維護 WebSocket 連接,成本較高 |
| **定時批次** (Scheduled Batch) | 定期(如每小時)彙總發送通知 | 減少打擾,降低伺服器負載 | 延遲較高 |
| **用戶觸發** (User-triggered) | 用戶主動查詢(輪詢) | 實現簡單 | 浪費資源,延遲較高 |

#### 3. 通知狀態 (Notification Status)

```typescript
// 通知狀態流轉
created → pending → sent → delivered → read → archived
(創建)   (待發送)  (已發送) (已送達)    (已讀)  (已歸檔)
```

### 資料庫相關術語

| 術語 | 解釋 | 在專案中的應用 |
|-----|------|---------------|
| **Prisma** | TypeScript ORM 工具 | 操作 PostgreSQL 資料庫,自動生成型別定義 |
| **Schema** | 資料庫結構定義 | 位於 `prisma/schema.prisma`,定義所有資料表 |
| **Migration** | 資料庫版本控制 | 管理資料庫結構變更歷史 |
| **Relation** | 資料表關聯 | 如 `users` 和 `notifications` 的一對多關係 |

### 專案現有模組說明

#### 核心業務模組

| 模組名稱 | 資料表 | 功能說明 | 需要通知的場景 |
|---------|-------|---------|---------------|
| **用戶管理** | `users` | 用戶註冊、登入、個人資料 | 帳號安全、密碼重置 |
| **學習資源** | `resources` | 學習資料分享(文章、影片、連結) | 收到評論、按讚、收藏 |
| **學習計畫** | `projects` | 個人或團隊學習專案 | 里程碑到期、成員邀請 |
| **學習實踐** | `practices` | 習慣養成、打卡記錄 | 每日提醒、連續打卡成就 |
| **想法分享** | `ideas` | 創意想法交流 | 收到回覆、互動 |
| **評論系統** | `comments` | 巢狀評論、回覆 | 收到回覆、被提及 |
| **馬拉松活動** | `marathons` | 學習活動組織 | 活動開始、導師指派 |
| **標籤系統** | `tags` | 內容分類標籤 | (較少需要通知) |

#### 支援服務模組

| 服務 | 位置 | 說明 |
|-----|------|------|
| **郵件服務** | `src/services/email/` | 已實現的郵件發送功能,可用於郵件通知 |
| **Redis** | `src/services/database/redis.service.ts` | 快取服務,可用於通知隊列 |
| **日誌系統** | `src/services/logging/` | Winston 日誌,可記錄通知發送狀態 |

---

## 🏗️ 通知系統架構設計

### 系統架構圖

```
┌─────────────────────────────────────────────────────────────┐
│                        觸發事件層                              │
│  (評論、按讚、里程碑到期、活動開始等業務事件)                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    通知事件處理器                              │
│         (NotificationEventHandler)                          │
│  - 判斷是否需要發送通知                                          │
│  - 檢查用戶通知偏好設定                                          │
│  - 創建通知記錄                                                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    通知隊列管理                                │
│              (Notification Queue - Redis)                   │
│  - 高優先級隊列 (即時通知)                                       │
│  - 中優先級隊列 (定時批次)                                       │
│  - 低優先級隊列 (每日彙總)                                       │
└────────────┬───────────────────┬────────────────────────────┘
             │                   │
             ▼                   ▼
┌─────────────────────┐ ┌────────────────────────────────────┐
│   站內通知發送器      │ │      郵件通知發送器                  │
│   (WebSocket/SSE)   │ │   (已有 Nodemailer)                │
└─────────────────────┘ └────────────────────────────────────┘
             │                   │
             ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│                    通知狀態追蹤                                │
│    (已發送、已送達、已讀、已歸檔)                                 │
└─────────────────────────────────────────────────────────────┘
```

### 資料庫結構設計

#### 核心資料表

##### 1. notifications (通知主表)

```prisma
model notifications {
  id              Int       @id @default(autoincrement())
  external_id     String    @unique @default(uuid()) @db.Uuid // 對外 UUID
  user_id         Int                                         // 接收通知的用戶
  type            String    @db.VarChar(50)                  // 通知類型
  title           String    @db.VarChar(255)                 // 通知標題
  content         String                                      // 通知內容
  data            Json?                                       // 額外數據(JSON)
  priority        String    @default("medium")               // high/medium/low
  status          String    @default("pending")              // pending/sent/delivered/read/archived
  is_read         Boolean   @default(false)                  // 是否已讀
  read_at         DateTime? @db.Timestamptz(6)               // 讀取時間
  created_at      DateTime  @default(now()) @db.Timestamptz(6)
  updated_at      DateTime  @updatedAt @db.Timestamptz(6)

  // 關聯
  user            users     @relation(fields: [user_id], references: [id], onDelete: Cascade)
  channels        notification_channels[] // 通知渠道記錄

  @@index([user_id, is_read])
  @@index([user_id, created_at])
  @@index([type])
  @@index([status])
}
```

##### 2. notification_channels (通知渠道記錄)

```prisma
model notification_channels {
  id              Int       @id @default(autoincrement())
  notification_id Int                                         // 通知 ID
  channel_type    String    @db.VarChar(20)                  // email/in_app/push/sms
  status          String    @default("pending")              // pending/sent/failed
  sent_at         DateTime? @db.Timestamptz(6)               // 發送時間
  delivered_at    DateTime? @db.Timestamptz(6)               // 送達時間
  error_message   String?                                     // 錯誤訊息(如果失敗)
  retry_count     Int       @default(0)                      // 重試次數
  created_at      DateTime  @default(now()) @db.Timestamptz(6)
  updated_at      DateTime  @updatedAt @db.Timestamptz(6)

  // 關聯
  notification    notifications @relation(fields: [notification_id], references: [id], onDelete: Cascade)

  @@index([notification_id])
  @@index([channel_type, status])
}
```

##### 3. notification_preferences (通知偏好設定)

```prisma
model notification_preferences {
  id                    Int       @id @default(autoincrement())
  user_id               Int       @unique                      // 用戶 ID

  // 站內通知偏好
  in_app_enabled        Boolean   @default(true)
  in_app_comment        Boolean   @default(true)              // 評論通知
  in_app_like           Boolean   @default(true)              // 按讚通知
  in_app_milestone      Boolean   @default(true)              // 里程碑通知
  in_app_practice       Boolean   @default(true)              // 打卡提醒
  in_app_event          Boolean   @default(true)              // 活動通知

  // 郵件通知偏好
  email_enabled         Boolean   @default(true)
  email_comment         Boolean   @default(true)
  email_like            Boolean   @default(false)             // 按讚通知預設關閉
  email_milestone       Boolean   @default(true)
  email_practice        Boolean   @default(true)
  email_event           Boolean   @default(true)
  email_digest          Boolean   @default(true)              // 每日彙總
  email_digest_time     String?   @default("09:00")           // 彙總發送時間

  // 推送通知偏好 (未來功能)
  push_enabled          Boolean   @default(false)

  // 靜音設定
  mute_until            DateTime? @db.Timestamptz(6)          // 靜音截止時間

  created_at            DateTime  @default(now()) @db.Timestamptz(6)
  updated_at            DateTime  @updatedAt @db.Timestamptz(6)

  // 關聯
  user                  users     @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@index([user_id])
}
```

##### 4. notification_templates (通知模板)

```prisma
model notification_templates {
  id              Int       @id @default(autoincrement())
  type            String    @unique @db.VarChar(50)          // 通知類型識別碼
  name            String    @db.VarChar(100)                 // 模板名稱
  channel_type    String    @db.VarChar(20)                  // email/in_app/push
  subject         String?   @db.VarChar(255)                 // 主旨(郵件用)
  title_template  String    @db.VarChar(255)                 // 標題模板
  body_template   String                                      // 內容模板(支援變數)
  variables       Json?                                       // 可用變數說明
  is_active       Boolean   @default(true)                   // 是否啟用
  created_at      DateTime  @default(now()) @db.Timestamptz(6)
  updated_at      DateTime  @updatedAt @db.Timestamptz(6)

  @@index([type])
  @@index([channel_type])
}
```

#### 通知類型定義 (TypeScript)

```typescript
// src/types/notification.types.ts

/**
 * 通知類型枚舉
 */
export const NotificationTypes = {
  // 社群互動
  COMMENT_RECEIVED: 'comment_received',           // 收到評論
  COMMENT_REPLY: 'comment_reply',                 // 評論被回覆
  CONTENT_LIKED: 'content_liked',                 // 內容被按讚
  CONTENT_BOOKMARKED: 'content_bookmarked',       // 內容被收藏
  USER_MENTIONED: 'user_mentioned',               // 被提及

  // 學習進度
  MILESTONE_DUE_SOON: 'milestone_due_soon',       // 里程碑即將到期
  MILESTONE_OVERDUE: 'milestone_overdue',         // 里程碑已逾期
  PRACTICE_REMINDER: 'practice_reminder',         // 打卡提醒
  PRACTICE_STREAK: 'practice_streak',             // 連續打卡成就
  GOAL_ACHIEVED: 'goal_achieved',                 // 目標達成

  // 活動與協作
  MARATHON_START: 'marathon_start',               // 馬拉松開始
  MARATHON_END: 'marathon_end',                   // 馬拉松結束
  MENTOR_ASSIGNED: 'mentor_assigned',             // 導師指派
  PROJECT_INVITATION: 'project_invitation',       // 專案邀請
  EVENT_REMINDER: 'event_reminder',               // 活動提醒

  // 系統與安全
  SECURITY_ALERT: 'security_alert',               // 安全警告
  PASSWORD_RESET: 'password_reset',               // 密碼重置
  EMAIL_VERIFICATION: 'email_verification',       // 郵箱驗證
  SYSTEM_ANNOUNCEMENT: 'system_announcement',     // 系統公告
} as const;

export type NotificationType = typeof NotificationTypes[keyof typeof NotificationTypes];

/**
 * 通知優先級
 */
export const NotificationPriority = {
  HIGH: 'high',       // 高優先級 - 立即發送
  MEDIUM: 'medium',   // 中優先級 - 批次發送
  LOW: 'low',         // 低優先級 - 每日彙總
} as const;

export type NotificationPriorityType = typeof NotificationPriority[keyof typeof NotificationPriority];

/**
 * 通知渠道
 */
export const NotificationChannel = {
  IN_APP: 'in_app',   // 站內通知
  EMAIL: 'email',     // 郵件通知
  PUSH: 'push',       // 推送通知
  SMS: 'sms',         // 簡訊通知
} as const;

export type NotificationChannelType = typeof NotificationChannel[keyof typeof NotificationChannel];

/**
 * 通知狀態
 */
export const NotificationStatus = {
  PENDING: 'pending',       // 待發送
  SENT: 'sent',             // 已發送
  DELIVERED: 'delivered',   // 已送達
  READ: 'read',             // 已讀
  ARCHIVED: 'archived',     // 已歸檔
  FAILED: 'failed',         // 發送失敗
} as const;

export type NotificationStatusType = typeof NotificationStatus[keyof typeof NotificationStatus];

/**
 * 通知數據介面
 */
export interface NotificationData {
  id: number;
  external_id: string;
  user_id: number;
  type: NotificationType;
  title: string;
  content: string;
  data?: Record<string, unknown>;
  priority: NotificationPriorityType;
  status: NotificationStatusType;
  is_read: boolean;
  read_at?: Date;
  created_at: Date;
  updated_at: Date;
}

/**
 * 創建通知的請求數據
 */
export interface CreateNotificationRequest {
  user_id: number;
  type: NotificationType;
  title: string;
  content: string;
  data?: Record<string, unknown>;
  priority?: NotificationPriorityType;
  channels?: NotificationChannelType[];
}

/**
 * 通知偏好設定介面
 */
export interface NotificationPreferences {
  user_id: number;
  in_app_enabled: boolean;
  in_app_comment: boolean;
  in_app_like: boolean;
  in_app_milestone: boolean;
  in_app_practice: boolean;
  in_app_event: boolean;
  email_enabled: boolean;
  email_comment: boolean;
  email_like: boolean;
  email_milestone: boolean;
  email_practice: boolean;
  email_event: boolean;
  email_digest: boolean;
  email_digest_time?: string;
  push_enabled: boolean;
  mute_until?: Date;
}
```

---

## 🚀 實作規劃

### 階段一: 基礎架構 (Week 1-2)

#### 1.1 資料庫設計與遷移
- [ ] 創建 Prisma schema 定義
- [ ] 生成並執行資料庫遷移
- [ ] 創建預設的通知模板
- [ ] 為現有用戶創建預設的通知偏好設定

#### 1.2 核心服務實現
- [ ] 實現 `NotificationService` 基礎服務
  - 創建通知
  - 查詢通知
  - 更新通知狀態
  - 標記已讀/未讀
- [ ] 實現 `NotificationPreferenceService`
  - 查詢用戶偏好
  - 更新用戶偏好
- [ ] 實現 `NotificationTemplateService`
  - 模板渲染引擎
  - 變數替換

#### 1.3 API 端點實現
```typescript
// src/routes/notification.routes.ts

// 獲取用戶通知列表
GET /api/v1/notifications
  Query: ?page=1&limit=10&is_read=false&type=comment_received

// 獲取未讀通知數量
GET /api/v1/notifications/unread-count

// 標記通知為已讀
PATCH /api/v1/notifications/:id/read

// 批量標記已讀
PATCH /api/v1/notifications/mark-all-read

// 刪除通知(歸檔)
DELETE /api/v1/notifications/:id

// 獲取通知偏好設定
GET /api/v1/notifications/preferences

// 更新通知偏好設定
PUT /api/v1/notifications/preferences
```

### 階段二: 通知發送機制 (Week 3-4)

#### 2.1 事件觸發系統
- [ ] 創建 `NotificationEventHandler` 事件處理器
- [ ] 在現有業務邏輯中整合通知觸發點
  - 評論服務: 收到評論、評論被回覆
  - 資源服務: 內容被按讚、收藏
  - 專案服務: 里程碑到期提醒
  - 實踐服務: 打卡提醒

#### 2.2 通知隊列實現 (使用 Bull + Redis)
- [ ] 安裝並配置 Bull 隊列
- [ ] 創建不同優先級的隊列
- [ ] 實現隊列處理器 (Queue Processor)
- [ ] 添加失敗重試機制

```typescript
// src/services/notification/notification-queue.service.ts

import Queue from 'bull';
import { redisService } from '@services/database/redis.service';

// 高優先級隊列 - 即時發送
export const highPriorityQueue = new Queue('notifications-high', {
  redis: redisService.getClient(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
  },
});

// 中優先級隊列 - 批次發送 (每 5 分鐘)
export const mediumPriorityQueue = new Queue('notifications-medium', {
  redis: redisService.getClient(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  },
});

// 低優先級隊列 - 每日彙總
export const lowPriorityQueue = new Queue('notifications-low', {
  redis: redisService.getClient(),
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'fixed', delay: 60000 },
  },
});
```

#### 2.3 郵件通知整合
- [ ] 擴展現有的郵件服務
- [ ] 創建通知郵件模板
- [ ] 實現郵件發送隊列處理器
- [ ] 添加郵件發送狀態追蹤

### 階段三: 即時通知 (Week 5-6)

#### 3.1 WebSocket 實現
- [ ] 選擇 WebSocket 方案 (推薦 Socket.IO)
- [ ] 實現 WebSocket 伺服器
- [ ] 用戶連接管理 (用戶 ID 與 Socket 映射)
- [ ] 實現即時推送邏輯

```typescript
// src/services/notification/websocket.service.ts

import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

export class NotificationWebSocketService {
  private io: SocketIOServer;
  private userSocketMap: Map<number, string[]> = new Map();

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL,
        credentials: true,
      },
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      // 用戶認證
      const userId = this.authenticateSocket(socket);
      if (!userId) {
        socket.disconnect();
        return;
      }

      // 記錄用戶連接
      this.addUserSocket(userId, socket.id);

      // 處理斷線
      socket.on('disconnect', () => {
        this.removeUserSocket(userId, socket.id);
      });
    });
  }

  // 發送通知給特定用戶
  public sendToUser(userId: number, notification: NotificationData) {
    const socketIds = this.userSocketMap.get(userId) || [];
    socketIds.forEach(socketId => {
      this.io.to(socketId).emit('notification', notification);
    });
  }

  // 發送通知給多個用戶
  public sendToUsers(userIds: number[], notification: NotificationData) {
    userIds.forEach(userId => this.sendToUser(userId, notification));
  }
}
```

#### 3.2 前端整合準備
- [ ] 提供 WebSocket 連接說明文件
- [ ] 定義前端事件監聽格式
- [ ] 提供測試用的 HTML 頁面

### 階段四: 進階功能 (Week 7-8)

#### 4.1 通知聚合與摘要
- [ ] 實現相似通知聚合 (如 "小明和其他 5 人按讚了你的文章")
- [ ] 實現每日通知彙總
- [ ] 定時任務調度 (使用 node-cron)

#### 4.2 通知管理功能
- [ ] 通知過期自動歸檔 (30 天後)
- [ ] 通知統計面板 (管理員用)
- [ ] 通知發送狀態監控
- [ ] 失敗通知重試機制

#### 4.3 性能優化
- [ ] 通知查詢分頁優化
- [ ] Redis 快取熱門通知
- [ ] 批次處理通知創建
- [ ] 資料庫索引優化

---

## 🔧 技術選型建議

### 推薦技術棧

| 功能 | 推薦方案 | 理由 |
|-----|---------|------|
| **即時通知** | Socket.IO | 成熟穩定、易於整合、支援房間功能 |
| **消息隊列** | Bull + Redis | 已有 Redis、效能好、支援延遲任務 |
| **郵件發送** | 現有 Nodemailer | 已整合、無需額外開發 |
| **模板引擎** | Handlebars | 簡單易用、變數替換方便 |
| **定時任務** | node-cron | 輕量、易於配置 |
| **推送通知** | Web Push API (未來) | 標準化、免費、無需第三方服務 |

### 依賴套件清單

```json
{
  "dependencies": {
    "socket.io": "^4.6.0",           // WebSocket 實時通知
    "bull": "^4.11.0",               // 消息隊列
    "handlebars": "^4.7.8",          // 模板引擎
    "node-cron": "^3.0.3",           // 定時任務
    "@types/socket.io": "^3.0.2",    // Socket.IO 型別定義
    "@types/bull": "^4.10.0",        // Bull 型別定義
    "@types/node-cron": "^3.0.7"     // node-cron 型別定義
  }
}
```

---

## 📊 成功指標 (KPIs)

### 系統性能指標

| 指標 | 目標值 | 測量方式 |
|-----|-------|---------|
| **通知發送延遲** | 高優先級 < 5 秒 | 從事件觸發到用戶收到的時間 |
| **郵件發送成功率** | > 95% | 成功發送數 / 總發送數 |
| **WebSocket 連接穩定性** | > 99% | 正常連接時間 / 總時間 |
| **通知讀取率** | > 60% | 已讀通知數 / 總通知數 |
| **隊列處理速度** | > 1000 通知/分鐘 | 隊列處理吞吐量 |

### 用戶體驗指標

| 指標 | 目標值 | 測量方式 |
|-----|-------|---------|
| **通知開啟率** | > 30% | 用戶點擊通知的比例 |
| **偏好設定使用率** | > 20% | 調整過通知偏好的用戶比例 |
| **通知投訴率** | < 5% | 用戶關閉通知的比例 |
| **即時通知到達率** | > 90% | WebSocket 成功推送的比例 |

---

## ⚠️ 注意事項與最佳實踐

### 避免通知疲勞 (Notification Fatigue)

1. **頻率控制**
   - 同類型通知在 1 小時內最多發送 1 次
   - 低優先級通知彙總為每日摘要
   - 提供靜音時段功能

2. **智慧聚合**
   ```
   ❌ 不好的做法:
   - "小明按讚了你的文章"
   - "小華按讚了你的文章"
   - "小李按讚了你的文章"

   ✅ 好的做法:
   - "小明、小華和其他 3 人按讚了你的文章"
   ```

3. **用戶控制**
   - 提供細粒度的通知偏好設定
   - 允許用戶設定靜音時段
   - 一鍵關閉特定類型通知

### 安全性考量

1. **權限檢查**
   - 用戶只能查看自己的通知
   - API 端點需要身份驗證
   - WebSocket 連接需要驗證 JWT

2. **敏感資訊保護**
   - 通知內容不包含密碼、Token 等敏感資訊
   - 郵件通知使用安全連結 (帶時效性)

3. **防止濫用**
   - 通知發送頻率限制
   - 監控異常通知發送模式
   - 惡意用戶封鎖機制

### 性能優化

1. **資料庫優化**
   - 合理的索引設計 (user_id, created_at, is_read)
   - 定期清理過期通知 (自動歸檔)
   - 使用分頁查詢,避免一次性載入大量資料

2. **快取策略**
   - Redis 快取未讀通知數量
   - 快取用戶通知偏好設定
   - 快取通知模板

3. **批次處理**
   - 批次創建通知記錄
   - 批次發送郵件通知
   - 批次更新通知狀態

---

## 📖 參考資料

### 技術文件

- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [Bull Queue Documentation](https://github.com/OptimalBits/bull)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Handlebars Documentation](https://handlebarsjs.com/)

### 設計參考

- [GitHub Notifications](https://github.com/notifications) - 站內通知設計
- [Discord Notification System](https://discord.com/) - 即時通知與偏好設定
- [Slack Notifications](https://slack.com/) - 通知聚合與摘要

### 最佳實踐

- [Notification Design Best Practices](https://www.nngroup.com/articles/push-notification/)
- [Real-time Notification Patterns](https://www.enterpriseintegrationpatterns.com/)

---

## 🎯 下一步行動

### 立即行動

1. **需求確認會議**
   - 與產品團隊確認通知類型優先級
   - 與前端團隊對齊 API 格式
   - 與設計團隊確認 UI/UX 需求

2. **技術評估**
   - 評估 WebSocket 方案 (Socket.IO vs WS)
   - 評估消息隊列方案 (Bull vs BullMQ)
   - 確認 Redis 容量是否足夠

3. **原型開發**
   - 開發簡單的通知 API
   - 實現基礎的 WebSocket 連接
   - 測試郵件通知發送

### 問題與討論

如果你有以下疑問,請與團隊討論:

- 通知保留期限應該設定為多久?(建議 30 天)
- 是否需要支援推送通知?(Web Push API)
- 是否需要支援簡訊通知?(成本較高)
- 通知歷史是否需要導出功能?
- 是否需要通知統計分析面板?

---

**文件維護者**: DaoDao 開發團隊
**最後更新**: 2025-12-16
**版本**: 1.0.0
