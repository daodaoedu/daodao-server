# 主題實踐郵件功能規格文件

> **重要**：本功能需整合現有的 Email 服務架構。
>
> **前置閱讀**：
> - [Email 服務技術文件](../email/email-service.md) - 核心服務架構
> - [系統信模板規格](../email/system-email-template-spec.md) - 設計系統規格

## 1. 概覽

### 1.1 目的

透過自動化 Email 系統提供使用者「提醒」、「鼓勵」，並將「打卡」轉化為「可見的成長」過程。

### 1.2 郵件類型總覽

| 代碼 | 名稱 | 觸發時機 | 說明 |
|------|------|----------|------|
| PE01 | 建立成功 | 即時 | 建立實踐後的即時回饋 |
| PE02 | 第一次打卡 | 即時 | 使用者完成第一次打卡 |
| PE03 | 每週回顧（有打卡文字） | 第7天 | 當週有打卡且有文字記錄 |
| PE04 | 每週回顧（無打卡文字） | 第7天 | 當週有打卡但無文字記錄 |
| PE05 | 每週回顧（從未打卡） | 第7天 | 從建立至今從未打卡 |
| PE06 | 每週回顧（當週無打卡） | 第7天 | 當週無打卡，但累積有打卡 |
| PE07 | 完成總結（有打卡） | 結束後24小時內 | 實踐結束且有打卡記錄 |
| PE08 | 完成總結（無打卡） | 結束後24小時內 | 實踐結束但無打卡記錄 |

---

## 2. 觸發邏輯

### 2.1 郵件觸發矩陣

| 週期 | PE01 | PE02 | W1 | W2 | W3 | W4 | 總結 |
|------|------|------|-----|-----|-----|-----|------|
| 7天 | V | V | # | X | X | X | # |
| 14天 | V | V | # | # | X | X | # |
| 21天 | V | V | # | # | # | X | # |
| 30天 | V | V | # | # | # | # | # |

- **V**: 一定會寄出
- **#**: 可能會寄出（取決於打卡狀態）
- **X**: 絕對不會寄出

### 2.2 週回顧判斷邏輯

```
第 7 天發送前 6 天回顧：

IF 從未打卡:
    發送 PE05
ELSE IF 當週打卡數 == 0 AND 累積打卡數 > 0:
    發送 PE06
ELSE IF 當週有打卡文字:
    發送 PE03
ELSE:
    發送 PE04
```

### 2.3 完成總結判斷邏輯

```
結束日後 24 小時內：

IF 累積打卡數 == 0:
    發送 PE08
ELSE:
    發送 PE07
```

### 2.4 新手緩衝保護

**規則**: 若建立日與開始日同一週（7天內），且開始日離當週回顧少於 48 小時，則跳過當週回顧發送。

```typescript
const shouldSkipFirstWeekReview = (
  createdAt: Date,
  startDate: Date,
  reviewDate: Date
): boolean => {
  const daysBetweenCreateAndStart = differenceInDays(startDate, createdAt);
  const hoursBetweenStartAndReview = differenceInHours(reviewDate, startDate);

  return daysBetweenCreateAndStart <= 7 && hoursBetweenStartAndReview < 48;
};
```

### 2.5 沉默邏輯

**規則**: 連續 3 週以上未動作的使用者，自第 3 週起自動停發 Weekly Summary。

```typescript
const shouldSilence = (
  lastActivityDate: Date | null,
  currentWeek: number
): boolean => {
  if (!lastActivityDate) return currentWeek >= 3;

  const weeksSinceActivity = differenceInWeeks(new Date(), lastActivityDate);
  return weeksSinceActivity >= 3;
};
```

---

## 3. 郵件變數定義

### 3.1 基礎變數

| 變數名稱 | 型別 | 說明 | 來源 |
|---------|------|------|------|
| `{{User_Name}}` | string | 使用者顯示名稱 | `users.name` |
| `{{實踐名稱}}` | string | 主題實踐標題 | `practices.title` |
| `{{開始日期}}` | string | 實踐開始日（格式：YYYY/MM/DD） | `practices.start_date` |
| `{{天數}}` | number | 實踐週期天數（7/14/21/30） | `practices.duration_days` |
| `{{頻率}}` | string | 每週預計次數描述 | `practices.frequency_description` |
| `{{行動}}` | string | 使用者設定的行動描述 | `practices.practice_action` |

### 3.2 統計變數

| 變數名稱 | 型別 | 說明 | 計算方式 |
|---------|------|------|----------|
| `{{Weekly_Count}}` | number | 當週打卡次數 | 過去 6 天的打卡數 |
| `{{Total_Count}}` | number | 累積打卡次數 | 所有打卡記錄數 |
| `{{Weekly_User_Note_Snippet}}` | string | 當週最長打卡記錄（截取） | 當週字數最多的 note，同字數取最新 |
| `{{User_Best_Note_Snippet}}` | string | 整期最長打卡記錄（截取） | 全期字數最多的 note |
| `{{Best_Note_Date}}` | string | 最佳打卡記錄日期 | 對應 Best_Note 的日期 |
| `{{Progress}}` | number | 當前進度百分比 | 根據進度計算公式 |

### 3.3 連結變數

| 變數名稱 | 說明 | 格式 |
|---------|------|------|
| `{{Practice_URL}}` | 實踐詳情頁連結 | `${FRONTEND_URL}/practice/${external_id}` |
| `{{Explore_URL}}` | 探索頁面連結 | `${FRONTEND_URL}/practice/explore` |
| `{{Create_URL}}` | 新建實踐連結 | `${FRONTEND_URL}/practice/create` |
| `{{Unsubscribe_URL}}` | 取消訂閱連結 | `${FRONTEND_URL}/unsubscribe` |

---

## 4. 資料查詢規格

### 4.1 取得待發送郵件的實踐列表

```sql
-- PE01/PE02: 即時觸發，不需排程查詢

-- Weekly Summary (PE03-PE06): 每天執行一次
SELECT p.*, u.email, u.name as user_name,
  (SELECT COUNT(*) FROM practice_checkins pc
   WHERE pc.practice_id = p.id
   AND pc.checkin_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)) as weekly_count,
  (SELECT COUNT(*) FROM practice_checkins pc
   WHERE pc.practice_id = p.id) as total_count
FROM practices p
JOIN users u ON p.user_id = u.id
WHERE p.deleted_at IS NULL
  AND p.status IN ('active', 'in_progress')
  AND DATEDIFF(CURDATE(), p.start_date) % 7 = 6  -- 每第7天
  AND p.start_date <= CURDATE();

-- Final Summary (PE07-PE08): 每天執行一次
SELECT p.*, u.email, u.name as user_name
FROM practices p
JOIN users u ON p.user_id = u.id
WHERE p.deleted_at IS NULL
  AND p.status = 'completed'
  AND p.end_date BETWEEN DATE_SUB(CURDATE(), INTERVAL 1 DAY) AND CURDATE()
  AND NOT EXISTS (
    SELECT 1 FROM email_logs el
    WHERE el.practice_id = p.id
    AND el.email_type IN ('PE07', 'PE08')
  );
```

### 4.2 取得打卡統計

```typescript
interface CheckInStats {
  weeklyCount: number;
  totalCount: number;
  weeklyBestNote: string | null;
  overallBestNote: string | null;
  bestNoteDate: Date | null;
  lastCheckInDate: Date | null;
}

const getCheckInStats = async (
  practiceId: number,
  startDate: Date,
  endDate: Date
): Promise<CheckInStats> => {
  // 實作查詢邏輯
};
```

---

## 5. 排程設計

> **採用方案**：使用 BullMQ 作為任務隊列，自動解決多容器重複執行問題。

### 5.1 為什麼選擇 BullMQ

| 特性 | BullMQ | node-cron + 分布式鎖 | 外部排程 |
|------|--------|---------------------|---------|
| 多容器安全 | ✅ 原生支援 | ⚠️ 需額外實作 | ✅ |
| 自動重試 | ✅ 內建 | ❌ 需自己寫 | ⚠️ 依賴外部服務 |
| 任務監控 | ✅ Bull Board | ❌ | ⚠️ 依賴外部服務 |
| 執行歷史 | ✅ 內建 | ❌ | ⚠️ 依賴外部服務 |
| 延遲任務 | ✅ 內建 | ❌ | ❌ |
| 依賴 | Redis | Redis | 外部服務 |

**BullMQ 解決多容器問題的原理**：

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Container 1 │     │  Container 2 │     │  Container 3 │
│   (Worker)   │     │   (Worker)   │     │   (Worker)   │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                           v
                    ┌─────────────┐
                    │    Redis    │  <-- 單一任務來源
                    │   (Queue)   │      原子性領取任務
                    └─────────────┘
```

- **排程器**：BullMQ 的 `upsertJobScheduler` 確保相同 ID 的排程只存在一份
- **任務領取**：Redis 原子操作確保一個任務只能被一個 Worker 領取
- **任務鎖定**：執行期間任務被鎖定，失敗可自動重試

### 5.2 排程任務清單

| 任務名稱 | 執行頻率 | 執行時間 | 說明 |
|---------|---------|---------|------|
| `send-weekly-summaries` | 每日 | 09:00 UTC+8 | 發送當日應發的週回顧 (PE03-PE06) |
| `send-final-summaries` | 每日 | 10:00 UTC+8 | 發送實踐完成總結 (PE07-PE08) |
| `update-practice-status` | 每日 | 00:00 UTC+8 | 更新已到期的實踐狀態為 completed |

### 5.3 BullMQ 架構設計

```
src/
├── queues/
│   ├── index.ts                      # Queue 統一導出
│   ├── connection.ts                 # Redis 連線設定
│   ├── practice-email.queue.ts       # Practice Email Queue 定義
│   └── practice-email.worker.ts      # Practice Email Worker 處理器
├── services/email/
│   ├── practice-email.service.ts     # 郵件發送邏輯（被 Worker 呼叫）
│   └── ...
```

### 5.4 Queue 設定

```typescript
// src/queues/connection.ts
import IORedis from 'ioredis';

// 共享 Redis 連線（避免重複建立連線）
let sharedConnection: IORedis | null = null;

export const getRedisConnection = (): IORedis => {
  if (!sharedConnection) {
    sharedConnection = new IORedis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: null, // BullMQ 必要設定
    });

    sharedConnection.on('error', (err) => {
      console.error('[Redis] Connection error:', err.message);
    });

    sharedConnection.on('connect', () => {
      console.log('[Redis] Connected successfully');
    });
  }
  return sharedConnection;
};

// 關閉連線（用於 Graceful Shutdown）
export const closeRedisConnection = async (): Promise<void> => {
  if (sharedConnection) {
    await sharedConnection.quit();
    sharedConnection = null;
  }
};

// src/queues/practice-email.queue.ts
import { Queue } from 'bullmq';
import { getRedisConnection } from './connection';

/**
 * 任務資料型別
 */
export interface PracticeEmailJobData {
  type: 'weekly-summary' | 'final-summary' | 'update-status' | 'practice-created' | 'first-checkin';
  practiceId?: number;
}

export const practiceEmailQueue = new Queue<PracticeEmailJobData>('practice-email', {
  connection: getRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    timeout: 60000, // 60 秒超時，避免任務卡住
    removeOnComplete: {
      age: 7 * 24 * 3600, // 保留 7 天
      count: 1000,        // 最多保留 1000 筆
    },
    removeOnFail: {
      age: 30 * 24 * 3600, // 失敗記錄保留 30 天
    },
  },
});

/**
 * 註冊排程任務（應用啟動時呼叫一次）
 * BullMQ 的 upsertJobScheduler 會自動去重，多容器呼叫安全
 */
export const registerPracticeEmailSchedulers = async () => {
  // 週回顧郵件 - 每日 09:00 UTC+8 (01:00 UTC)
  await practiceEmailQueue.upsertJobScheduler(
    'weekly-summary-scheduler',
    { pattern: '0 1 * * *', tz: 'UTC' },
    {
      name: 'send-weekly-summaries',
      data: { type: 'weekly-summary' },
    }
  );

  // 完成總結郵件 - 每日 10:00 UTC+8 (02:00 UTC)
  await practiceEmailQueue.upsertJobScheduler(
    'final-summary-scheduler',
    { pattern: '0 2 * * *', tz: 'UTC' },
    {
      name: 'send-final-summaries',
      data: { type: 'final-summary' },
    }
  );

  // 更新實踐狀態 - 每日 00:00 UTC+8 (16:00 UTC 前一天)
  await practiceEmailQueue.upsertJobScheduler(
    'update-status-scheduler',
    { pattern: '0 16 * * *', tz: 'UTC' },
    {
      name: 'update-practice-status',
      data: { type: 'update-status' },
    }
  );

  console.log('[BullMQ] Practice email schedulers registered');
};

/**
 * 加入即時郵件任務（PE01/PE02）
 * 使用 jobId 實現去重，避免重複發送
 */
export const addPracticeEmailJob = async (
  type: PracticeEmailJobData['type'],
  practiceId: number
): Promise<void> => {
  await practiceEmailQueue.add(
    `send-${type}`,
    { type, practiceId },
    {
      jobId: `${type}-${practiceId}`, // 相同 ID 不會重複加入
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    }
  );
};
```

### 5.5 Worker 設定

```typescript
// src/queues/practice-email.worker.ts
import { Worker, Job } from 'bullmq';
import { getRedisConnection } from './connection';
import { practiceEmailQueue, PracticeEmailJobData } from './practice-email.queue';
import {
  sendPendingWeeklySummaries,
  sendPendingFinalSummaries,
  sendPracticeCreatedEmail,
  sendFirstCheckInEmail,
} from '../services/email/practice-email.service';
import { updateCompletedPractices } from '../services/practice/practice-status.service';
import { logger } from '../utils/logger';

// 失敗告警閾值
const FAILURE_ALERT_THRESHOLD = 10;

export const createPracticeEmailWorker = (): Worker<PracticeEmailJobData> => {
  const worker = new Worker<PracticeEmailJobData>(
    'practice-email',
    async (job: Job<PracticeEmailJobData>) => {
      const { type, practiceId } = job.data;

      logger.info(`[BullMQ] Processing job: ${job.name}`, {
        jobId: job.id,
        type,
        practiceId,
        attempt: job.attemptsMade + 1,
      });

      switch (type) {
        case 'weekly-summary':
          return await sendPendingWeeklySummaries();

        case 'final-summary':
          return await sendPendingFinalSummaries();

        case 'update-status':
          return await updateCompletedPractices();

        case 'practice-created':
          if (!practiceId) throw new Error('practiceId is required for practice-created');
          return await sendPracticeCreatedEmail(practiceId);

        case 'first-checkin':
          if (!practiceId) throw new Error('practiceId is required for first-checkin');
          return await sendFirstCheckInEmail(practiceId);

        default:
          throw new Error(`Unknown job type: ${type}`);
      }
    },
    {
      connection: getRedisConnection(),
      concurrency: 1, // 排程任務一次處理一個，避免資源競爭
    }
  );

  // 任務完成
  worker.on('completed', (job, result) => {
    logger.info(`[BullMQ] Job completed: ${job.name}`, {
      jobId: job.id,
      result: typeof result === 'object' ? JSON.stringify(result) : result,
    });
  });

  // 任務失敗
  worker.on('failed', async (job, error) => {
    logger.error(`[BullMQ] Job failed: ${job?.name}`, {
      jobId: job?.id,
      error: error.message,
      stack: error.stack,
      attemptsMade: job?.attemptsMade,
    });

    // 檢查失敗次數，超過閾值發送告警
    try {
      const failedCount = await practiceEmailQueue.getFailedCount();
      if (failedCount >= FAILURE_ALERT_THRESHOLD) {
        logger.error(`[BullMQ] ALERT: Failed job count (${failedCount}) exceeded threshold`);
        // TODO: 發送告警通知（Slack/Discord/Email）
        // await sendAlertNotification(`Practice Email 失敗數已達 ${failedCount} 封`);
      }
    } catch (alertError) {
      logger.error('[BullMQ] Failed to check alert threshold', { error: alertError });
    }
  });

  // Worker 錯誤
  worker.on('error', (error) => {
    logger.error('[BullMQ] Worker error', { error: error.message });
  });

  console.log('[BullMQ] Practice email worker started');
  return worker;
};
```

### 5.6 即時郵件發送（PE01/PE02）

即時發送的郵件透過 `addPracticeEmailJob` 加入隊列，享受重試機制和去重保護：

```typescript
// src/services/practice/practice.service.ts
import { addPracticeEmailJob } from '../../queues';

const create = async (data: CreatePracticeRequest, userId: number) => {
  // ... 建立邏輯 ...

  // 建立成功後，將郵件任務加入隊列
  // 使用 jobId 去重，即使重複呼叫也只會發送一次
  await addPracticeEmailJob('practice-created', newPractice.id);

  return newPractice;
};

// src/services/practice/practice-checkin.service.ts
import { addPracticeEmailJob } from '../../queues';

const createCheckIn = async (practiceId: number, data: CheckInData, userId: number) => {
  // ... 打卡邏輯 ...

  if (isFirstCheckIn) {
    await addPracticeEmailJob('first-checkin', practiceId);
  }

  return newCheckIn;
};
```

### 5.7 應用啟動整合

```typescript
// src/index.ts 或 src/app.ts
import { Worker } from 'bullmq';
import {
  practiceEmailQueue,
  registerPracticeEmailSchedulers,
} from './queues/practice-email.queue';
import { createPracticeEmailWorker } from './queues/practice-email.worker';
import { closeRedisConnection, getRedisConnection } from './queues/connection';
import { logger } from './utils/logger';

let worker: Worker | null = null;

const startServer = async () => {
  // ... 其他初始化 ...

  // 初始化 BullMQ
  try {
    // 先測試 Redis 連線
    const redis = getRedisConnection();
    await redis.ping();
    logger.info('[BullMQ] Redis connection verified');

    // 註冊排程任務（BullMQ 自動去重，多容器呼叫安全）
    await registerPracticeEmailSchedulers();

    // 啟動 Worker（每個容器都啟動，BullMQ 自動分配任務）
    worker = createPracticeEmailWorker();

    logger.info('[Server] BullMQ queue and worker initialized');
  } catch (error) {
    logger.error('[BullMQ] Failed to initialize:', error);
    // 可選：降級處理或直接退出
    throw error;
  }
};

// Graceful Shutdown
const shutdown = async (signal: string) => {
  logger.info(`[Server] Received ${signal}, shutting down gracefully...`);

  // 1. 關閉 Worker（等待當前任務完成）
  if (worker) {
    logger.info('[BullMQ] Closing worker...');
    await worker.close();
    logger.info('[BullMQ] Worker closed');
  }

  // 2. 關閉 Queue
  logger.info('[BullMQ] Closing queue...');
  await practiceEmailQueue.close();
  logger.info('[BullMQ] Queue closed');

  // 3. 關閉 Redis 連線
  await closeRedisConnection();
  logger.info('[Redis] Connection closed');

  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

startServer();
```

### 5.8 監控 Dashboard（選配）

```typescript
// src/routes/admin.routes.ts
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { practiceEmailQueue } from '../queues/practice-email.queue';

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [new BullMQAdapter(practiceEmailQueue)],
  serverAdapter,
});

// 在 Express app 中掛載
app.use('/admin/queues', adminAuthMiddleware, serverAdapter.getRouter());
```

### 5.9 任務冪等性設計

即使使用 BullMQ，任務本身仍應設計為**冪等**（idempotent）：

```typescript
// 每次執行前檢查是否已處理過
const sendPendingWeeklySummaries = async () => {
  const practices = await getPracticesNeedingWeeklySummary();

  for (const practice of practices) {
    // 檢查今日是否已發送（冪等性保護）
    const alreadySent = await hasEmailBeenSent({
      userId: practice.user_id,
      emailType: EMAIL_TYPES.PRACTICE_WEEKLY_SUMMARY,
      entityType: 'practice',
      entityId: practice.id,
    });

    if (alreadySent) {
      continue; // 跳過已發送的
    }

    await sendWeeklySummaryEmail(practice.id);
  }
};
```

### 5.10 環境變數設定

```bash
# .env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password

# 可選：Bull Board 存取密碼
BULL_BOARD_PASSWORD=admin_password
```

---

## 6. 郵件記錄追蹤

> **重要**：使用現有的 `email_logs` 資料表和 `email-log.service.ts`。
> 詳見：[系統信模板實作指南](../email/implementation-guide.md) 第 0 章

### 6.1 現有 email_logs 資料表

```sql
-- 已存在於 daodao-storage/init-scripts-refactored/700_create_table_email_logs.sql
CREATE TABLE "email_logs" (
    "id" SERIAL PRIMARY KEY,
    "user_id" INT NOT NULL,
    "email_type" VARCHAR(50) NOT NULL,      -- 使用 EMAIL_TYPES 常數
    "entity_type" VARCHAR(50),              -- 'practice'
    "entity_id" INT,                        -- practiceId
    "email_code" VARCHAR(20),               -- 'PE01', 'PE02', etc.
    "subject" VARCHAR(255),
    "status" VARCHAR(20) DEFAULT 'sent',
    "sent_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

-- 索引
CREATE INDEX "idx_email_logs_user_id" ON "email_logs" ("user_id");
CREATE INDEX "idx_email_logs_type" ON "email_logs" ("email_type");
CREATE INDEX "idx_email_logs_entity" ON "email_logs" ("entity_type", "entity_id");
CREATE INDEX "idx_email_logs_sent_at" ON "email_logs" ("sent_at");
```

### 6.2 防重複發送（使用現有服務）

```typescript
// 使用現有的 email-log.service.ts
import { hasEmailBeenSent } from './email-log.service';
import { EMAIL_TYPES } from '../../types/email';
import { PRACTICE_EMAIL_CODES } from '../../types/email/practice.types';

// 檢查是否已發送過 PE01
const alreadySent = await hasEmailBeenSent({
  userId: practice.user_id,
  emailType: EMAIL_TYPES.PRACTICE_CREATED,
  entityType: 'practice',
  entityId: practiceId,
  emailCode: PRACTICE_EMAIL_CODES.PE01,
});

// 檢查今日是否已發送過週回顧
const todaySent = await hasEmailBeenSent({
  userId: practice.user_id,
  emailType: EMAIL_TYPES.PRACTICE_WEEKLY_SUMMARY,
  entityType: 'practice',
  entityId: practiceId,
  // 不指定 emailCode 以檢查任何 PE03-06
});
```

### 6.3 EMAIL_TYPES 對應

| Practice Email | EMAIL_TYPES 常數值 | email_code |
|----------------|-------------------|------------|
| PE01 | `'practice_created'` | 'PE01' |
| PE02 | `'practice_first_checkin'` | 'PE02' |
| PE03-06 | `'practice_weekly_summary'` | 'PE03'/'PE04'/'PE05'/'PE06' |
| PE07-08 | `'practice_final_summary'` | 'PE07'/'PE08' |

---

## 7. 錯誤處理

### 7.1 重試機制

- 發送失敗時自動重試 3 次
- 重試間隔：1秒、2秒、4秒（指數退避）
- 3 次失敗後記錄錯誤，不再重試

### 7.2 錯誤通知

- 單日失敗超過 10 封：發送告警至管理員
- 記錄所有失敗的郵件詳情供排查

---

## 8. 測試檢查清單

### 8.1 觸發邏輯測試

- [ ] PE01: 建立實踐後立即收到郵件
- [ ] PE02: 第一次打卡後立即收到郵件
- [ ] PE03: 第 7 天有打卡且有文字時收到正確郵件
- [ ] PE04: 第 7 天有打卡但無文字時收到正確郵件
- [ ] PE05: 從未打卡時收到正確郵件
- [ ] PE06: 當週無打卡但累積有時收到正確郵件
- [ ] PE07: 實踐結束且有打卡時收到總結
- [ ] PE08: 實踐結束但無打卡時收到總結

### 8.2 新手緩衝測試

- [ ] 建立日與開始日同週，開始日離回顧 < 48 小時：跳過首週回顧
- [ ] 建立日與開始日同週，開始日離回顧 >= 48 小時：正常發送

### 8.3 沉默邏輯測試

- [ ] 連續 2 週無動作：正常發送
- [ ] 連續 3 週無動作：停止發送週回顧

### 8.4 變數正確性測試

- [ ] 使用者名稱正確顯示
- [ ] 打卡次數統計正確
- [ ] 最長打卡記錄擷取正確
- [ ] 日期格式正確

---

## 9. 相關文件

### Email 服務核心文件（務必先閱讀）

- [Email 服務技術文件](../email/email-service.md) - 核心服務架構
- [Email 模板使用指南](../email/templates-guide.md) - 模板開發指南
- [系統信模板規格](../email/system-email-template-spec.md) - 設計系統規格
- [系統信模板實作指南](../email/implementation-guide.md) - 整合 email_logs 說明

### 主題實踐文件

- [主題實踐 Email - FRD](./主題實踐%20Email%20-%20FRD.md)
- [主題實踐 Email 文案](./主題實踐%20Email%20.md)
- [主題實踐建立與打卡 FRD](./主題實踐_%20建立與打卡%20-%20FRD.md)
- [打卡標籤與引導句](./主題實踐%20-%20打卡%20tag%20&%20引導句.csv)
- [打卡完成鼓勵句](./打卡完成鼓勵句%20-%20工作表1.csv)
- [主題實踐郵件實作指南](./practice-email-implementation.md)
- [主題實踐郵件模板](./practice-email-templates.md)
