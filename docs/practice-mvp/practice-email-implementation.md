# 主題實踐郵件功能實作指南

> **重要**：本文件說明如何在 daodao-server 中實作主題實踐的 8 種郵件模板。
>
> **前置閱讀**：請先閱讀以下文件了解現有 Email 服務架構：
> - [Email 服務技術文件](../email/email-service.md)
> - [Email 模板使用指南](../email/templates-guide.md)
> - [系統信模板實作指南](../email/implementation-guide.md)

---

## 1. 檔案結構規劃

整合至現有架構，新增 BullMQ 隊列目錄：

```
src/
├── queues/                             # BullMQ 隊列（新建目錄）
│   ├── index.ts                        # 統一導出
│   ├── connection.ts                   # Redis 連線設定
│   ├── practice-email.queue.ts         # Queue 定義與排程註冊
│   └── practice-email.worker.ts        # Worker 處理器
│
├── services/email/
│   ├── email.service.ts                # 核心服務（已存在）
│   ├── email-log.service.ts            # 郵件記錄服務（已存在，直接使用）
│   ├── template.service.ts             # 模板管理（已存在，新增方法）
│   ├── base-template.ts                # 基礎組件（已存在，複用）
│   ├── practice-email.service.ts       # 主題實踐郵件服務（新建）
│   └── practice-template.ts            # 主題實踐模板（新建，包含 PE01-PE08）
│
└── types/email/
    ├── index.ts                        # 統一導出（更新）
    ├── base.types.ts                   # 基礎型別（已存在）
    ├── template-data.types.ts          # 模板資料介面（更新）
    └── practice.types.ts               # 主題實踐郵件型別（新建）
```

**不需新建的部分（複用現有）：**
- `base-template.ts` - 使用現有的 `EMAIL_COLORS`, `EMAIL_ASSETS`, `generateStandardEmail` 等
- `email-log.service.ts` - 使用現有的 `createEmailLog`, `hasEmailBeenSent` 等
- `email.service.ts` - 使用現有的 `sendEmail`, `sendEmailWithRetry` 等

**BullMQ 架構說明：**
- `connection.ts` - Redis 連線設定，BullMQ 必須設定 `maxRetriesPerRequest: null`
- `practice-email.queue.ts` - 定義 Queue 和排程任務，使用 `upsertJobScheduler` 確保多容器安全
- `practice-email.worker.ts` - Worker 處理任務邏輯，包含事件監聽和錯誤處理

---

## 2. 型別定義

### 2.1 建立 `src/types/email/practice.types.ts`

```typescript
// src/types/email/practice.types.ts

import type { EmailTemplateContent } from './base.types';

/**
 * 主題實踐郵件代碼
 * 與 email_logs.email_code 欄位對應
 */
export const PRACTICE_EMAIL_CODES = {
  PE01: 'PE01',  // 建立成功
  PE02: 'PE02',  // 第一次打卡
  PE03: 'PE03',  // 週回顧（有打卡文字）
  PE04: 'PE04',  // 週回顧（無打卡文字）
  PE05: 'PE05',  // 週回顧（從未打卡）
  PE06: 'PE06',  // 週回顧（當週無打卡但累積有）
  PE07: 'PE07',  // 完成總結（有打卡）
  PE08: 'PE08',  // 完成總結（無打卡）
} as const;

export type PracticeEmailCode = typeof PRACTICE_EMAIL_CODES[keyof typeof PRACTICE_EMAIL_CODES];

/**
 * 主題實踐郵件基礎資料
 * 所有 Practice Email 共用
 */
export interface PracticeEmailBaseData {
  userName: string;
  practiceName: string;
  practiceUrl: string;
  unsubscribeUrl?: string;  // 可選，會使用預設值
}

/**
 * PE01 建立成功郵件資料
 */
export interface PE01Data extends PracticeEmailBaseData {
  startDate: string;       // 格式：YYYY/MM/DD
  durationDays: number;    // 7/14/21/30
  frequency: string;       // e.g., "每週 4-7 次"
  action: string;          // e.g., "閱讀英文文章"
}

/**
 * PE02 第一次打卡郵件資料
 */
export interface PE02Data extends PracticeEmailBaseData {
  // 使用基礎資料即可
}

/**
 * PE03-PE06 週回顧郵件資料
 */
export interface WeeklySummaryData extends PracticeEmailBaseData {
  weeklyCount: number;
  totalCount: number;
  weeklyNoteSnippet?: string;  // PE03 專用：當週最長打卡記錄
  exploreUrl: string;
}

/**
 * PE07-PE08 完成總結郵件資料
 */
export interface FinalSummaryData extends PracticeEmailBaseData {
  durationDays: number;
  totalCount?: number;
  bestNoteSnippet?: string;  // PE07 專用：整期最長打卡記錄
  bestNoteDate?: string;
  createUrl: string;
  exploreUrl: string;
}

/**
 * 主題實踐郵件發送結果
 * 擴展自 EmailSendResult
 */
export interface PracticeEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  emailCode: PracticeEmailCode;
  practiceId: number;
  userId: number;
}

/**
 * 打卡統計資料
 * 用於判斷週回顧和完成總結郵件類型
 */
export interface CheckInStats {
  weeklyCount: number;
  totalCount: number;
  weeklyBestNote: string | null;
  overallBestNote: string | null;
  bestNoteDate: Date | null;
  lastCheckInDate: Date | null;
}
```

### 2.2 更新 `src/types/email/index.ts`

```typescript
// 在 index.ts 中導出 practice 型別
export * from './practice.types';
```

---

## 3. 服務實作

### 3.1 主題實踐郵件服務

```typescript
// src/services/email/practice-email.service.ts

import { prisma } from '../../lib/prisma';
import { emailService } from './email.service';
import { emailConfig } from '../../config/email.config';
import { createEmailLog, hasEmailBeenSent } from './email-log.service';
import { EMAIL_TYPES } from '../../types/email';
import type {
  PracticeEmailCode,
  PE01Data,
  PE02Data,
  WeeklySummaryData,
  FinalSummaryData,
  PracticeEmailResult,
  CheckInStats
} from '../../types/email/practice.types';
import { PRACTICE_EMAIL_CODES } from '../../types/email/practice.types';

// 模板引入（統一在 practice-template.ts 中）
import {
  generatePE01Email,
  generatePE02Email,
  generatePE03Email,
  generatePE04Email,
  generatePE05Email,
  generatePE06Email,
  generatePE07Email,
  generatePE08Email,
} from './practice-template';

// ============================================================
// 即時發送郵件
// ============================================================

/**
 * PE01: 發送建立成功郵件
 */
export const sendPracticeCreatedEmail = async (
  practiceId: number
): Promise<PracticeEmailResult> => {
  const practice = await getPracticeWithUser(practiceId);
  if (!practice) {
    return {
      success: false,
      error: 'Practice not found',
      emailCode: PRACTICE_EMAIL_CODES.PE01,
      practiceId,
      userId: 0
    };
  }

  // 檢查是否已發送過（使用現有的 email-log.service）
  const alreadySent = await hasEmailBeenSent({
    userId: practice.user_id,
    emailType: EMAIL_TYPES.PRACTICE_CREATED,
    entityType: 'practice',
    entityId: practiceId,
    emailCode: PRACTICE_EMAIL_CODES.PE01,
  });

  if (alreadySent) {
    return {
      success: true,
      emailCode: PRACTICE_EMAIL_CODES.PE01,
      practiceId,
      userId: practice.user_id
    };
  }

  const data: PE01Data = {
    userName: practice.users.name || '島友',
    practiceName: practice.title,
    practiceUrl: `${emailConfig.urls.frontend}/practice/${practice.external_id}`,
    startDate: formatDate(practice.start_date),
    durationDays: practice.duration_days || 7,
    frequency: formatFrequency(practice.frequency_min_days, practice.frequency_max_days),
    action: practice.practice_action || '學習'
  };

  const { subject, html } = generatePE01Email(data);

  // 使用帶重試的發送方法
  const result = await emailService.sendEmailWithRetry({
    to: practice.users.email,
    subject,
    html
  });

  // 記錄郵件發送（使用現有的 email-log.service）
  if (result.success) {
    await createEmailLog({
      userId: practice.user_id,
      emailType: EMAIL_TYPES.PRACTICE_CREATED,
      entityType: 'practice',
      entityId: practiceId,
      emailCode: PRACTICE_EMAIL_CODES.PE01,
      subject,
    });
  }

  return {
    ...result,
    emailCode: PRACTICE_EMAIL_CODES.PE01,
    practiceId,
    userId: practice.user_id
  };
};

/**
 * PE02: 發送第一次打卡郵件
 */
export const sendFirstCheckInEmail = async (
  practiceId: number
): Promise<PracticeEmailResult> => {
  const practice = await getPracticeWithUser(practiceId);
  if (!practice) {
    return {
      success: false,
      error: 'Practice not found',
      emailCode: PRACTICE_EMAIL_CODES.PE02,
      practiceId,
      userId: 0
    };
  }

  // 檢查是否已發送過 PE02（使用現有的 email-log.service）
  const alreadySent = await hasEmailBeenSent({
    userId: practice.user_id,
    emailType: EMAIL_TYPES.PRACTICE_FIRST_CHECKIN,
    entityType: 'practice',
    entityId: practiceId,
    emailCode: PRACTICE_EMAIL_CODES.PE02,
  });

  if (alreadySent) {
    return {
      success: true,
      emailCode: PRACTICE_EMAIL_CODES.PE02,
      practiceId,
      userId: practice.user_id
    };
  }

  const data: PE02Data = {
    userName: practice.users.name || '島友',
    practiceName: practice.title,
    practiceUrl: `${emailConfig.urls.frontend}/practice/${practice.external_id}`,
  };

  const { subject, html } = generatePE02Email(data);

  const result = await emailService.sendEmailWithRetry({
    to: practice.users.email,
    subject,
    html
  });

  if (result.success) {
    await createEmailLog({
      userId: practice.user_id,
      emailType: EMAIL_TYPES.PRACTICE_FIRST_CHECKIN,
      entityType: 'practice',
      entityId: practiceId,
      emailCode: PRACTICE_EMAIL_CODES.PE02,
      subject,
    });
  }

  return {
    ...result,
    emailCode: PRACTICE_EMAIL_CODES.PE02,
    practiceId,
    userId: practice.user_id
  };
};

// ============================================================
// 排程發送郵件
// ============================================================

/**
 * 發送週回顧郵件（PE03-PE06）
 */
export const sendWeeklySummaryEmail = async (
  practiceId: number
): Promise<PracticeEmailResult> => {
  const practice = await getPracticeWithUser(practiceId);
  if (!practice) {
    return { success: false, error: 'Practice not found', emailType: 'PE03', practiceId, userId: 0 };
  }

  // 檢查新手緩衝
  if (shouldSkipNewUserBuffer(practice.created_at, practice.start_date)) {
    return { success: true, emailType: 'PE03', practiceId, userId: practice.user_id };
  }

  // 檢查沉默邏輯
  const stats = await getCheckInStats(practiceId);
  if (shouldSilence(stats.lastCheckInDate)) {
    return { success: true, emailType: 'PE03', practiceId, userId: practice.user_id };
  }

  // 判斷郵件類型
  const emailType = determineWeeklySummaryType(stats);

  // 檢查是否今日已發送
  const alreadySent = await hasEmailBeenSent(practiceId, emailType);
  if (alreadySent) {
    return { success: true, emailType, practiceId, userId: practice.user_id };
  }

  const baseData: WeeklySummaryData = {
    userName: practice.users.name || '島友',
    practiceName: practice.title,
    practiceUrl: `${config.urls.frontend}/practice/${practice.external_id}`,
    unsubscribeUrl: `${config.urls.frontend}/unsubscribe`,
    weeklyCount: stats.weeklyCount,
    totalCount: stats.totalCount,
    weeklyNoteSnippet: stats.weeklyBestNote || undefined,
    exploreUrl: `${config.urls.frontend}/practice/explore`
  };

  let emailContent;
  switch (emailType) {
    case 'PE03':
      emailContent = generatePE03Email(baseData);
      break;
    case 'PE04':
      emailContent = generatePE04Email(baseData);
      break;
    case 'PE05':
      emailContent = generatePE05Email(baseData);
      break;
    case 'PE06':
      emailContent = generatePE06Email(baseData);
      break;
    default:
      emailContent = generatePE04Email(baseData);
  }

  const result = await emailService.sendEmail({
    to: practice.users.email,
    subject: emailContent.subject,
    html: emailContent.html
  });

  await logEmail(practiceId, practice.user_id, emailType, result);

  return {
    ...result,
    emailType,
    practiceId,
    userId: practice.user_id
  };
};

/**
 * 發送完成總結郵件（PE07-PE08）
 */
export const sendFinalSummaryEmail = async (
  practiceId: number
): Promise<PracticeEmailResult> => {
  const practice = await getPracticeWithUser(practiceId);
  if (!practice) {
    return { success: false, error: 'Practice not found', emailType: 'PE07', practiceId, userId: 0 };
  }

  const stats = await getCheckInStats(practiceId);
  const emailType: PracticeEmailType = stats.totalCount > 0 ? 'PE07' : 'PE08';

  // 檢查是否已發送
  const alreadySent = await hasEmailBeenSent(practiceId, emailType);
  if (alreadySent) {
    return { success: true, emailType, practiceId, userId: practice.user_id };
  }

  const data: FinalSummaryData = {
    userName: practice.users.name || '島友',
    practiceName: practice.title,
    practiceUrl: `${config.urls.frontend}/practice/${practice.external_id}`,
    unsubscribeUrl: `${config.urls.frontend}/unsubscribe`,
    durationDays: practice.duration_days || 7,
    totalCount: stats.totalCount,
    bestNoteSnippet: stats.overallBestNote || undefined,
    bestNoteDate: stats.bestNoteDate ? formatDate(stats.bestNoteDate) : undefined,
    createUrl: `${config.urls.frontend}/practice/create`,
    exploreUrl: `${config.urls.frontend}/practice/explore`
  };

  const { subject, html } = emailType === 'PE07'
    ? generatePE07Email(data)
    : generatePE08Email(data);

  const result = await emailService.sendEmail({
    to: practice.users.email,
    subject,
    html
  });

  await logEmail(practiceId, practice.user_id, emailType, result);

  return {
    ...result,
    emailType,
    practiceId,
    userId: practice.user_id
  };
};

// ============================================================
// 輔助函數
// ============================================================

const getPracticeWithUser = async (practiceId: number) => {
  return prisma.practices.findUnique({
    where: { id: practiceId },
    include: { users: true }
  });
};

const getCheckInStats = async (practiceId: number): Promise<CheckInStats> => {
  const sixDaysAgo = new Date();
  sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);

  const [weeklyCheckIns, allCheckIns] = await Promise.all([
    prisma.practice_checkins.findMany({
      where: {
        practice_id: practiceId,
        checkin_date: { gte: sixDaysAgo }
      },
      orderBy: { checkin_date: 'desc' }
    }),
    prisma.practice_checkins.findMany({
      where: { practice_id: practiceId },
      orderBy: { checkin_date: 'desc' }
    })
  ]);

  // 找出最長的 note（優先選擇字數最多，同字數取最新）
  const findBestNote = (checkIns: typeof allCheckIns) => {
    if (checkIns.length === 0) return null;
    return checkIns
      .filter(c => c.note && c.note.trim().length > 0)
      .sort((a, b) => (b.note?.length || 0) - (a.note?.length || 0))[0];
  };

  const weeklyBest = findBestNote(weeklyCheckIns);
  const overallBest = findBestNote(allCheckIns);

  return {
    weeklyCount: weeklyCheckIns.length,
    totalCount: allCheckIns.length,
    weeklyBestNote: weeklyBest?.note || null,
    overallBestNote: overallBest?.note || null,
    bestNoteDate: overallBest?.checkin_date || null,
    lastCheckInDate: allCheckIns[0]?.checkin_date || null
  };
};

const determineWeeklySummaryType = (stats: CheckInStats): PracticeEmailCode => {
  if (stats.totalCount === 0) return PRACTICE_EMAIL_CODES.PE05;
  if (stats.weeklyCount === 0) return PRACTICE_EMAIL_CODES.PE06;
  if (stats.weeklyBestNote) return PRACTICE_EMAIL_CODES.PE03;
  return PRACTICE_EMAIL_CODES.PE04;
};

/**
 * 新手緩衝保護：若建立日與開始日同一週（7天內），
 * 且開始日離當週回顧少於 48 小時，則跳過當週回顧發送
 */
const shouldSkipNewUserBuffer = (
  createdAt: Date,
  startDate: Date | null
): boolean => {
  if (!startDate) return false;

  const daysBetween = Math.floor(
    (startDate.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );
  const now = new Date();
  const hoursSinceStart = Math.floor(
    (now.getTime() - startDate.getTime()) / (1000 * 60 * 60)
  );

  return daysBetween <= 7 && hoursSinceStart < 48;
};

/**
 * 沉默邏輯：連續 3 週以上未動作的使用者，自第 3 週起自動停發 Weekly Summary
 */
const shouldSilence = (lastActivityDate: Date | null): boolean => {
  if (!lastActivityDate) return true;

  const weeksSinceActivity = Math.floor(
    (Date.now() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24 * 7)
  );
  return weeksSinceActivity >= 3;
};

/**
 * 格式化日期為 YYYY/MM/DD
 */
const formatDate = (date: Date | null): string => {
  if (!date) return '';
  return date.toISOString().split('T')[0].replace(/-/g, '/');
};

/**
 * 格式化頻率描述
 */
const formatFrequency = (minDays: number | null, maxDays: number | null): string => {
  if (!minDays || !maxDays) return '每週數次';
  if (minDays === maxDays) return `每週 ${minDays} 次`;
  return `每週 ${minDays}-${maxDays} 次`;
};

export const practiceEmailService = {
  sendPracticeCreatedEmail,
  sendFirstCheckInEmail,
  sendWeeklySummaryEmail,
  sendFinalSummaryEmail
};
```

---

## 4. 排程任務實作（BullMQ）

> **採用方案**：使用 BullMQ 作為任務隊列，自動解決多容器重複執行問題。
> 詳見：[practice-email-spec.md - 5. 排程設計](./practice-email-spec.md#5-排程設計)

### 4.1 安裝依賴

```bash
pnpm add bullmq
pnpm add -D @bull-board/api @bull-board/express  # 選配：監控 Dashboard
```

### 4.2 Redis 連線設定

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
```

### 4.3 Queue 定義

```typescript
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
    attempts: 3,                                    // 失敗重試 3 次
    backoff: { type: 'exponential', delay: 1000 }, // 指數退避：1s, 2s, 4s
    timeout: 60000,                                 // 60 秒超時
    removeOnComplete: { age: 7 * 24 * 3600, count: 1000 },  // 完成記錄保留 7 天
    removeOnFail: { age: 30 * 24 * 3600 },         // 失敗記錄保留 30 天
  },
});

/**
 * 註冊排程任務
 * 應用啟動時呼叫一次，BullMQ 會自動去重（upsert）
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

### 4.4 Worker 定義

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

### 4.5 統一導出

```typescript
// src/queues/index.ts
export { practiceEmailQueue, registerPracticeEmailSchedulers, addPracticeEmailJob } from './practice-email.queue';
export type { PracticeEmailJobData } from './practice-email.queue';
export { createPracticeEmailWorker } from './practice-email.worker';
export { getRedisConnection, closeRedisConnection } from './connection';
```

### 4.6 監控 Dashboard（選配）

```typescript
// src/routes/admin.routes.ts
import { Router } from 'express';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { practiceEmailQueue } from '../queues';

const router = Router();

// Bull Board 設定
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [new BullMQAdapter(practiceEmailQueue)],
  serverAdapter,
});

// 需要管理員權限
router.use('/queues', adminAuthMiddleware, serverAdapter.getRouter());

export default router;
```

### 4.7 批次郵件發送邏輯

```typescript
// src/services/email/practice-email.service.ts（部分）

/**
 * 發送待處理的週回顧郵件
 * 由 BullMQ Worker 呼叫
 */
export const sendPendingWeeklySummaries = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 找出需要發送週回顧的實踐
  const practices = await prisma.practices.findMany({
    where: {
      deleted_at: null,
      status: { in: ['active', 'not_started'] },
      start_date: { lte: today }
    },
    include: { users: true }
  });

  // 篩選出今天是第 7 天倍數的實踐
  const pendingPractices = practices.filter(p => {
    if (!p.start_date) return false;
    const daysSinceStart = Math.floor(
      (today.getTime() - new Date(p.start_date).getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSinceStart > 0 && daysSinceStart % 7 === 6;
  });

  logger.info(`[Practice Email] Found ${pendingPractices.length} practices for weekly summary`);

  const results = { sent: 0, skipped: 0, failed: 0 };

  for (const practice of pendingPractices) {
    try {
      const result = await sendWeeklySummaryEmail(practice.id);
      if (result.success) {
        results.sent++;
      } else {
        results.skipped++;
      }
      // 間隔 100ms 避免發送過快
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      results.failed++;
      logger.error(`[Practice Email] Failed to send weekly summary for practice ${practice.id}`, error);
    }
  }

  return results;
};

/**
 * 發送待處理的完成總結郵件
 * 由 BullMQ Worker 呼叫
 */
export const sendPendingFinalSummaries = async () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  // 找出昨天結束的實踐
  const completedPractices = await prisma.practices.findMany({
    where: {
      deleted_at: null,
      status: 'completed',
      end_date: { gte: yesterday, lte: today }
    },
    include: { users: true }
  });

  logger.info(`[Practice Email] Found ${completedPractices.length} completed practices`);

  const results = { sent: 0, skipped: 0, failed: 0 };

  for (const practice of completedPractices) {
    try {
      const result = await sendFinalSummaryEmail(practice.id);
      if (result.success) {
        results.sent++;
      } else {
        results.skipped++;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      results.failed++;
      logger.error(`[Practice Email] Failed to send final summary for practice ${practice.id}`, error);
    }
  }

  return results;
};
```

---

## 5. 整合至現有系統

### 5.1 應用啟動初始化

修改 `src/index.ts` 或 `src/app.ts`：

```typescript
import { Worker } from 'bullmq';
import {
  practiceEmailQueue,
  registerPracticeEmailSchedulers,
  createPracticeEmailWorker,
  getRedisConnection,
  closeRedisConnection,
} from './queues';
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

### 5.2 在建立實踐時觸發 PE01

修改 `src/services/practice.service.ts`：

```typescript
import { addPracticeEmailJob } from '../../queues';

// 在 create 方法最後加入
const create = async (data: CreatePracticeRequest, userId: number) => {
  // ... 現有建立邏輯 ...

  // 發送建立成功郵件（透過 BullMQ 隊列，自動去重和重試）
  await addPracticeEmailJob('practice-created', newPractice.id);

  return newPractice;
};
```

### 5.3 在第一次打卡時觸發 PE02

修改 `src/services/practice-checkin.service.ts`：

```typescript
import { addPracticeEmailJob } from '../../queues';

const createCheckIn = async (practiceId: number, data: CheckInData, userId: number) => {
  // ... 現有打卡邏輯 ...

  // 檢查是否為第一次打卡
  const checkInCount = await prisma.practice_checkins.count({
    where: { practice_id: practiceId, user_id: userId }
  });

  if (checkInCount === 1) {
    // 發送第一次打卡郵件（透過 BullMQ 隊列，自動去重和重試）
    await addPracticeEmailJob('first-checkin', practiceId);
  }

  return newCheckIn;
};
```

---

## 6. 資料庫整合

> **重要**：`email_logs` 資料表已存在，不需新建。
> 詳見：`docs/email/implementation-guide.md` 第 0 章
> SQL 定義：`daodao-storage/init-scripts-refactored/700_create_table_email_logs.sql`

### 6.1 現有 email_logs 表結構

```sql
-- 已存在，不需建立
CREATE TABLE "email_logs" (
    "id" SERIAL PRIMARY KEY,
    "user_id" INT NOT NULL,                    -- 收件者 ID
    "email_type" VARCHAR(50) NOT NULL,         -- 郵件類型（使用 EMAIL_TYPES 常數）
    "entity_type" VARCHAR(50),                 -- 實體類型：practice, project...
    "entity_id" INT,                           -- 實體 ID（practiceId）
    "email_code" VARCHAR(20),                  -- 細分代碼：PE01, PE02...
    "subject" VARCHAR(255),                    -- 郵件主旨
    "status" VARCHAR(20) DEFAULT 'sent',       -- 發送狀態
    "sent_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);
```

### 6.2 主題實踐郵件記錄方式

```typescript
// 使用現有的 email-log.service.ts
import { createEmailLog, hasEmailBeenSent } from './email-log.service';
import { EMAIL_TYPES } from '../../types/email';
import { PRACTICE_EMAIL_CODES } from '../../types/email/practice.types';

// 記錄 PE01 建立成功郵件
await createEmailLog({
  userId: practice.user_id,
  emailType: EMAIL_TYPES.PRACTICE_CREATED,  // 'practice_created'
  entityType: 'practice',
  entityId: practiceId,
  emailCode: PRACTICE_EMAIL_CODES.PE01,     // 'PE01'
  subject: '開啟你的小而美學習生活提案',
});

// 檢查是否已發送過 PE02
const alreadySent = await hasEmailBeenSent({
  userId: practice.user_id,
  emailType: EMAIL_TYPES.PRACTICE_FIRST_CHECKIN,
  entityType: 'practice',
  entityId: practiceId,
  emailCode: PRACTICE_EMAIL_CODES.PE02,
});
```

### 6.3 EMAIL_TYPES 對應表

| Practice Email | EMAIL_TYPES 常數 | email_code |
|----------------|------------------|------------|
| PE01 建立成功 | `PRACTICE_CREATED` | 'PE01' |
| PE02 第一次打卡 | `PRACTICE_FIRST_CHECKIN` | 'PE02' |
| PE03-06 週回顧 | `PRACTICE_WEEKLY_SUMMARY` | 'PE03'/'PE04'/'PE05'/'PE06' |
| PE07-08 完成總結 | `PRACTICE_FINAL_SUMMARY` | 'PE07'/'PE08' |

---

## 7. 測試腳本

```typescript
// scripts/test-practice-email.ts

import { practiceEmailService } from '../src/services/email/practice/practice-email.service';

const testPracticeId = 1; // 替換為實際的 practice ID

async function testEmails() {
  console.log('Testing PE01...');
  const pe01Result = await practiceEmailService.sendPracticeCreatedEmail(testPracticeId);
  console.log('PE01 Result:', pe01Result);

  console.log('Testing PE02...');
  const pe02Result = await practiceEmailService.sendFirstCheckInEmail(testPracticeId);
  console.log('PE02 Result:', pe02Result);

  console.log('Testing Weekly Summary...');
  const weeklyResult = await practiceEmailService.sendWeeklySummaryEmail(testPracticeId);
  console.log('Weekly Result:', weeklyResult);

  console.log('Testing Final Summary...');
  const finalResult = await practiceEmailService.sendFinalSummaryEmail(testPracticeId);
  console.log('Final Result:', finalResult);
}

testEmails().catch(console.error);
```

---

## 8. 實作檢查清單

### 8.1 新建檔案

**BullMQ 相關（新增）：**
- [ ] 建立 `src/queues/connection.ts` - Redis 連線設定
- [ ] 建立 `src/queues/practice-email.queue.ts` - Queue 定義與排程註冊
- [ ] 建立 `src/queues/practice-email.worker.ts` - Worker 處理器
- [ ] 建立 `src/queues/index.ts` - 統一導出

**Email 服務相關：**
- [ ] 建立 `src/types/email/practice.types.ts` - 主題實踐郵件型別
- [ ] 更新 `src/types/email/index.ts` - 導出 practice 型別
- [ ] 建立 `src/services/email/practice-email.service.ts` - 郵件發送服務
- [ ] 建立 `src/services/email/practice-template.ts` - PE01-PE08 模板

### 8.2 安裝依賴

```bash
pnpm add bullmq
pnpm add -D @bull-board/api @bull-board/express  # 選配：監控 Dashboard
```

### 8.3 更新現有檔案

- [ ] 更新 `src/services/email/template.service.ts` - 新增 Practice 模板方法
- [ ] 確認 `src/types/email/base.types.ts` 有 `EMAIL_TYPES` 常數（已有）
- [ ] 確認 `email_logs` 資料表已存在（應已部署）

### 8.4 服務整合

- [ ] 在 `src/index.ts` 初始化 BullMQ（registerPracticeEmailSchedulers + createPracticeEmailWorker）
- [ ] 在 `src/services/practice/practice.service.ts` 整合 PE01（使用 addPracticeEmailJob）
- [ ] 在 `src/services/practice/practice-checkin.service.ts` 整合 PE02（使用 addPracticeEmailJob）
- [ ] 設定 Graceful Shutdown（關閉 Worker）

### 8.5 環境變數

```bash
# .env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password
```

### 8.6 測試

- [ ] 單元測試各郵件模板生成
- [ ] 單元測試郵件類型判斷邏輯
- [ ] 測試 BullMQ 排程任務註冊
- [ ] 測試 Worker 處理任務
- [ ] 實際發送測試郵件（各種類型）
- [ ] 測試新手緩衝和沉默邏輯
- [ ] 測試多容器環境下任務不重複執行

---

## 9. 相關文件

### Email 服務核心文件（務必先閱讀）

- [Email 服務技術文件](../email/email-service.md) - 核心服務架構
- [Email 模板使用指南](../email/templates-guide.md) - 模板開發指南
- [系統信模板規格](../email/system-email-template-spec.md) - 設計系統規格
- [系統信模板實作指南](../email/implementation-guide.md) - 整合 email_logs 說明

### 主題實踐文件

- [主題實踐郵件功能規格](./practice-email-spec.md)
- [主題實踐郵件模板](./practice-email-templates.md)
- [後端功能修正規劃](./backend-implementation-plan.md)
