# 通知系統快速參考

> 快速查閱通知系統的關鍵資訊和常用代碼片段

**最後更新**: 2025-12-16

---

## 📌 核心概念速查

### 通知類型 (Notification Types)

| 分類 | 通知類型 | 優先級 | 預設渠道 |
|-----|---------|-------|---------|
| **社群** | 收到評論 | 🟡 中 | 站內 + 郵件 |
| **社群** | 評論回覆 | 🟡 中 | 站內 + 郵件 |
| **社群** | 內容按讚 | 🟢 低 | 僅站內 |
| **社群** | 內容收藏 | 🟢 低 | 僅站內 |
| **學習** | 里程碑到期 | 🔴 高 | 站內 + 郵件 |
| **學習** | 打卡提醒 | 🟡 中 | 站內 + 郵件 |
| **學習** | 目標達成 | 🟡 中 | 站內 + 郵件 |
| **活動** | 馬拉松開始 | 🔴 高 | 站內 + 郵件 |
| **活動** | 導師指派 | 🔴 高 | 站內 + 郵件 |
| **系統** | 安全警告 | 🔴 高 | 站內 + 郵件 |
| **系統** | 密碼重置 | 🔴 高 | 郵件 |

### 通知狀態流轉

```
created → pending → sent → delivered → read → archived
  ↓          ↓        ↓        ↓          ↓        ↓
建立       待發送    已發送   已送達      已讀     已歸檔
                              ↓
                           failed (發送失敗)
```

---

## 🗄️ 資料庫表格速查

### notifications (通知主表)

```sql
-- 關鍵欄位
id              INT         -- 內部 ID
external_id     UUID        -- 對外 UUID
user_id         INT         -- 接收者
type            VARCHAR(50) -- 通知類型
title           VARCHAR(255)
content         TEXT
priority        VARCHAR(10) -- high/medium/low
status          VARCHAR(20) -- pending/sent/delivered/read/archived
is_read         BOOLEAN
created_at      TIMESTAMP

-- 常用查詢索引
INDEX (user_id, is_read)
INDEX (user_id, created_at)
INDEX (type)
INDEX (status)
```

### notification_preferences (偏好設定)

```sql
-- 關鍵欄位
user_id              INT     -- 用戶 ID (唯一)
in_app_enabled       BOOLEAN -- 站內通知總開關
email_enabled        BOOLEAN -- 郵件通知總開關
email_digest         BOOLEAN -- 每日彙總
email_digest_time    VARCHAR -- 彙總時間 (如 "09:00")
mute_until           TIMESTAMP -- 靜音截止時間
```

---

## 💻 常用代碼片段

### 1. 創建通知

```typescript
import { notificationService } from '@services/notification/notification.service';
import { NotificationTypes, NotificationPriority } from '@types/notification.types';

// 發送評論通知
await notificationService.createNotification({
  user_id: targetUserId,
  type: NotificationTypes.COMMENT_RECEIVED,
  title: '收到新評論',
  content: `${commenterName} 評論了你的資源`,
  data: {
    comment_id: comment.id,
    resource_id: resource.id,
    commenter_name: commenterName,
  },
  priority: NotificationPriority.MEDIUM,
  channels: ['in_app', 'email'],
});
```

### 2. 查詢用戶通知

```typescript
// 獲取未讀通知
const notifications = await notificationService.getNotificationsByUserId(userId, {
  is_read: false,
  page: 1,
  limit: 10,
});

// 獲取未讀數量
const unreadCount = await notificationService.getUnreadCount(userId);
```

### 3. 標記已讀

```typescript
// 標記單個通知為已讀
await notificationService.markAsRead(notificationId, userId);

// 標記全部為已讀
await notificationService.markAllAsRead(userId);
```

### 4. 檢查通知偏好

```typescript
import { notificationPreferenceService } from '@services/notification/notification-preference.service';

// 獲取用戶偏好
const preferences = await notificationPreferenceService.getPreferences(userId);

// 檢查是否應該發送郵件通知
const shouldSendEmail = await notificationPreferenceService.checkIfEnabled(
  userId,
  'email',
  NotificationTypes.COMMENT_RECEIVED
);
```

### 5. 渲染通知模板

```typescript
import { notificationTemplateService } from '@services/notification/notification-template.service';

// 渲染模板
const rendered = await notificationTemplateService.renderTemplate(
  NotificationTypes.COMMENT_RECEIVED,
  'in_app',
  {
    commenter_name: '小明',
    resource_title: '我的學習心得',
    comment_preview: '寫得很棒!',
  }
);
// 返回: { title: '收到新評論', body: '小明評論了你的資源「我的學習心得」...' }
```

### 6. WebSocket 即時推送

```typescript
import { websocketService } from '@services/notification/websocket.service';

// 推送給單個用戶
websocketService.sendToUser(userId, {
  type: 'notification',
  data: notificationData,
});

// 推送給多個用戶
websocketService.sendToUsers([userId1, userId2], {
  type: 'notification',
  data: notificationData,
});
```

### 7. 添加到消息隊列

```typescript
import { highPriorityQueue, mediumPriorityQueue } from '@services/notification/notification-queue.service';

// 高優先級 - 立即發送
await highPriorityQueue.add('send-notification', {
  notification_id: notification.id,
  user_id: userId,
  channels: ['in_app', 'email'],
});

// 中優先級 - 批次發送
await mediumPriorityQueue.add('send-notification', {
  notification_id: notification.id,
  user_id: userId,
  channels: ['email'],
}, {
  delay: 5 * 60 * 1000, // 延遲 5 分鐘
});
```

---

## 🔌 API 端點速查

### 通知 API

```typescript
// 獲取通知列表
GET /api/v1/notifications
Query: ?page=1&limit=10&is_read=false&type=comment_received
Response: PaginatedResponse<NotificationData[]>

// 獲取未讀數量
GET /api/v1/notifications/unread-count
Response: { success: true, data: { count: 5 } }

// 獲取單個通知
GET /api/v1/notifications/:id
Response: ApiResponse<NotificationData>

// 標記已讀
PATCH /api/v1/notifications/:id/read
Response: ApiResponse<NotificationData>

// 全部標記已讀
PATCH /api/v1/notifications/mark-all-read
Response: ApiResponse<{ updated_count: number }>

// 刪除通知
DELETE /api/v1/notifications/:id
Response: ApiResponse<{ message: string }>

// 獲取通知偏好
GET /api/v1/notifications/preferences
Response: ApiResponse<NotificationPreferences>

// 更新通知偏好
PUT /api/v1/notifications/preferences
Body: NotificationPreferences (partial)
Response: ApiResponse<NotificationPreferences>
```

### WebSocket 事件

```typescript
// 客戶端連接
const socket = io('ws://localhost:3000', {
  auth: { token: userJwtToken }
});

// 監聽通知
socket.on('notification', (data) => {
  console.log('收到新通知:', data);
});

// 監聽連接狀態
socket.on('connect', () => console.log('已連接'));
socket.on('disconnect', () => console.log('已斷線'));
```

---

## 🎯 業務邏輯整合示例

### 評論服務整合

```typescript
// src/services/comment.service.ts

import { notificationEventHandler } from '@services/notification/notification-event-handler.service';

export const createComment = async (data: CreateCommentRequest) => {
  // 1. 創建評論
  const comment = await prisma.comments.create({ data });

  // 2. 觸發通知事件
  await notificationEventHandler.onCommentReceived({
    target_user_id: resource.user_id,  // 資源創建者
    commenter_id: data.user_id,
    commenter_name: user.username,
    resource_id: data.target_id,
    resource_title: resource.title,
    comment_content: data.content,
  });

  return comment;
};
```

### 里程碑到期檢查 (定時任務)

```typescript
// src/services/notification/notification-scheduler.service.ts

import cron from 'node-cron';
import { notificationEventHandler } from './notification-event-handler.service';

// 每天凌晨 1:00 檢查即將到期的里程碑
cron.schedule('0 1 * * *', async () => {
  const threeDaysLater = new Date();
  threeDaysLater.setDate(threeDaysLater.getDate() + 3);

  const dueMilestones = await prisma.milestones.findMany({
    where: {
      deadline: {
        gte: new Date(),
        lte: threeDaysLater,
      },
      status: 'active',
    },
    include: {
      project: {
        include: { user: true },
      },
    },
  });

  for (const milestone of dueMilestones) {
    await notificationEventHandler.onMilestoneDueSoon({
      user_id: milestone.project.user_id,
      milestone_title: milestone.title,
      project_title: milestone.project.title,
      deadline: milestone.deadline,
      days_remaining: Math.ceil(
        (milestone.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      ),
    });
  }
});
```

---

## 🔧 配置文件示例

### 環境變數 (.env)

```bash
# 通知系統配置
NOTIFICATION_WEBSOCKET_PORT=3001
NOTIFICATION_QUEUE_REDIS_URL=redis://localhost:6379
NOTIFICATION_DAILY_DIGEST_TIME=09:00
NOTIFICATION_RETENTION_DAYS=30
NOTIFICATION_MAX_RETRY=3

# 郵件通知配置 (使用現有的郵件服務)
EMAIL_NOTIFICATION_ENABLED=true
EMAIL_NOTIFICATION_FROM=noreply@daodao.com
```

### Bull 隊列配置

```typescript
// src/config/queue.config.ts

export const queueConfig = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
};
```

---

## 🧪 測試範例

### 單元測試

```typescript
// src/tests/unit/services/notification.service.test.ts

import { notificationService } from '@services/notification/notification.service';
import { prismaMock } from '@tests/utils/prisma-mock';

describe('NotificationService', () => {
  describe('createNotification', () => {
    it('應該成功創建通知', async () => {
      const mockNotification = {
        id: 1,
        user_id: 123,
        type: 'comment_received',
        title: '收到新評論',
        content: '小明評論了你的資源',
        priority: 'medium',
        status: 'pending',
        is_read: false,
      };

      prismaMock.notifications.create.mockResolvedValue(mockNotification);

      const result = await notificationService.createNotification({
        user_id: 123,
        type: 'comment_received',
        title: '收到新評論',
        content: '小明評論了你的資源',
        priority: 'medium',
      });

      expect(result).toEqual(mockNotification);
      expect(prismaMock.notifications.create).toHaveBeenCalled();
    });
  });
});
```

### 整合測試

```typescript
// src/tests/integration/notification-api.test.ts

import request from 'supertest';
import app from '@/app';

describe('Notification API', () => {
  let authToken: string;

  beforeAll(async () => {
    // 獲取測試用戶的 JWT
    authToken = await getTestUserToken();
  });

  describe('GET /api/v1/notifications', () => {
    it('應該返回用戶的通知列表', async () => {
      const response = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.pagination).toBeDefined();
    });
  });
});
```

---

## 📊 監控與指標

### 關鍵指標

```typescript
// 通知發送成功率
const successRate = (sentCount / totalCount) * 100;
// 目標: > 95%

// 平均發送延遲
const avgDelay = totalDelay / sentCount;
// 目標: 高優先級 < 5 秒

// WebSocket 連接數
const activeConnections = websocketService.getConnectionCount();
// 監控: 異常增長或突然下降

// 隊列積壓
const queueBacklog = await highPriorityQueue.getWaitingCount();
// 警告閾值: > 1000
```

### 日誌記錄

```typescript
import { logger } from '@services/logging/logger.service';

// 通知創建日誌
logger.info('Notification created', {
  notification_id: notification.id,
  user_id: notification.user_id,
  type: notification.type,
  priority: notification.priority,
});

// 通知發送成功
logger.info('Notification sent successfully', {
  notification_id: notification.id,
  channel: 'email',
  send_duration: endTime - startTime,
});

// 通知發送失敗
logger.error('Notification send failed', {
  notification_id: notification.id,
  channel: 'email',
  error: error.message,
  retry_count: retryCount,
});
```

---

## 🚨 常見問題排查

### 問題 1: 通知沒有發送

**可能原因**:
1. 用戶關閉了該類型通知
2. 隊列處理器未運行
3. Redis 連接失敗

**排查步驟**:
```typescript
// 1. 檢查用戶偏好設定
const prefs = await notificationPreferenceService.getPreferences(userId);
console.log('Email enabled:', prefs.email_enabled);
console.log('Comment notification:', prefs.email_comment);

// 2. 檢查隊列狀態
const waiting = await highPriorityQueue.getWaitingCount();
const active = await highPriorityQueue.getActiveCount();
const failed = await highPriorityQueue.getFailedCount();
console.log({ waiting, active, failed });

// 3. 檢查 Redis 連接
const isConnected = await redisService.ping();
console.log('Redis connected:', isConnected);
```

### 問題 2: WebSocket 無法連接

**可能原因**:
1. JWT Token 過期或無效
2. CORS 配置錯誤
3. WebSocket 端口未開放

**排查步驟**:
```typescript
// 前端檢查
socket.on('connect_error', (error) => {
  console.error('Connection error:', error.message);
});

// 後端檢查
// 確認 CORS 設置
io.on('connection', (socket) => {
  console.log('New connection:', socket.id);
  console.log('User:', socket.data.user);
});
```

### 問題 3: 通知重複發送

**可能原因**:
1. 隊列重試機制導致
2. 事件觸發了多次
3. 去重邏輯缺失

**解決方案**:
```typescript
// 在創建通知前檢查是否已存在相似通知
const existingNotification = await prisma.notifications.findFirst({
  where: {
    user_id: userId,
    type: notificationType,
    created_at: {
      gte: new Date(Date.now() - 5 * 60 * 1000), // 5 分鐘內
    },
  },
});

if (existingNotification) {
  logger.warn('Duplicate notification prevented', { userId, notificationType });
  return existingNotification;
}
```

---

## 🔗 相關資源

- [完整設計文檔](./NOTIFICATION_SYSTEM_GUIDE.md)
- [實作任務清單](./IMPLEMENTATION_TASKS.md)
- [WebSocket 整合指南](./WEBSOCKET_INTEGRATION.md) (待創建)
- [Prisma 文檔](https://www.prisma.io/docs)
- [Socket.IO 文檔](https://socket.io/docs/v4/)
- [Bull 隊列文檔](https://github.com/OptimalBits/bull)

---

**提示**: 本文件會隨著開發進度持續更新。如有疑問,請查閱完整設計文檔或聯繫開發團隊。
