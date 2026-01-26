# 主題實踐後端功能修正規劃文件

> 版本：1.2
> 日期：2025-01-25
> 狀態：規劃中

---

## 1. 概覽

### 1.1 目的

本文件根據以下資料來源，規劃後端主題實踐相關功能的修正：

- `/docs/practice-mvp/` - FRD 需求文件
- `/src/` - 現有後端程式碼
- `daodao-storage/init-scripts-refactored/` - 資料庫結構（由 daodao-storage 統一管理）

### 1.2 架構說明

**資料庫管理策略：**
- 所有資料庫結構變更由 `daodao-storage` 專案的 `init-scripts-refactored/` 統一管理
- 本專案（daodao-server）不直接修改 Prisma schema，而是在 SQL scripts 部署後執行 `pnpm run prisma:generate` 同步
- 新增資料表的 SQL 檔案命名規則：`{序號}_create_table_{表名}.sql`

### 1.3 現況分析

**已完成項目：**
- 基本的 CRUD API（建立、更新、刪除、查詢）
- 打卡記錄功能（practice_checkins）
- 標籤關聯（entity_tags）
- 資源關聯（entity_resources）
- 互動功能框架（點讚、收藏、分享 - 目前為 TODO 狀態）

**待修正項目：**
- 進度計算邏輯
- 狀態流轉機制
- 打卡限制與驗證
- Email 自動化系統
- 模板使用追蹤
- 鼓勵句與引導句功能

---

## 2. 資料庫結構調整

### 2.1 practices 表欄位對照

| 欄位名稱 | 現有 Schema | FRD 需求 | 狀態 | 修正建議 |
|---------|-------------|----------|------|---------|
| `id` | ✅ SERIAL PRIMARY KEY | - | 完成 | - |
| `external_id` | ✅ UUID | - | 完成 | - |
| `user_id` | ✅ INT NOT NULL | - | 完成 | - |
| `template_id` | ✅ INT (FK) | 模板追蹤 | 完成 | - |
| `title` | ✅ VARCHAR(100) | - | 完成 | - |
| `practice_action` | ✅ TEXT | - | 完成 | - |
| `start_date` | ✅ DATE | - | 完成 | - |
| `duration_days` | ✅ INT (7/14/21/30) | - | 完成 | - |
| `end_date` | ✅ DATE | - | 完成 | - |
| `session_duration_minutes` | ✅ INT (15/30/45/60) | - | 完成 | - |
| `frequency_min_days` | ✅ INT | - | 完成 | - |
| `frequency_max_days` | ✅ INT | - | 完成 | - |
| `practice_time_periods` | ✅ TEXT[] | - | 完成 | - |
| `other_context` | ✅ TEXT | - | 完成 | - |
| `status` | ✅ VARCHAR(20) | 5 種狀態 | 完成 | - |
| `has_resources` | ✅ BOOLEAN | - | 完成 | - |
| `progress_percentage` | ✅ DECIMAL(5,2) | 進度計算 | 完成 | 需實作計算邏輯 |
| `first_checkin_at` | ✅ TIMESTAMPTZ | 提早打卡判斷 | 完成 | 需實作使用邏輯 |
| `created_at` | ✅ TIMESTAMPTZ | - | 完成 | - |
| `updated_at` | ✅ TIMESTAMPTZ | - | 完成 | - |
| `deleted_at` | ✅ TIMESTAMPTZ | 軟刪除 | 完成 | - |

### 2.2 practice_checkins 表欄位對照

| 欄位名稱 | 現有 Schema | FRD 需求 | 狀態 | 修正建議 |
|---------|-------------|----------|------|---------|
| `id` | ✅ SERIAL PRIMARY KEY | - | 完成 | - |
| `practice_id` | ✅ INT NOT NULL | - | 完成 | - |
| `user_id` | ✅ INT NOT NULL | - | 完成 | - |
| `checkin_date` | ✅ DATE NOT NULL | - | 完成 | - |
| `mood` | ✅ VARCHAR(20) | 6 種心情 | 完成 | - |
| `note` | ✅ VARCHAR(300) | 打卡心得 | 完成 | - |
| `image_urls` | ✅ TEXT[] | 最多 3 張圖 | 完成 | - |
| `created_at` | ✅ TIMESTAMPTZ | - | 完成 | - |
| `updated_at` | ✅ TIMESTAMPTZ | - | 完成 | - |
| UNIQUE constraint | ✅ (practice_id, checkin_date) | 一日一次 | 完成 | - |

### 2.2.1 待確認事項 (Critical)

現有 service 中使用了以下欄位，但 SQL schema 中不存在：

| 欄位 | 所在檔案 | 建議處理方式 |
|------|---------|-------------|
| `progress_amount` | practice-checkin.service.ts | 移除，改用 practices.progress_percentage |
| `reflection_text` | practice-checkin.service.ts | 移除，使用 note 欄位替代 |
| `cumulative_progress` | practice-checkin.service.ts | 移除，從 practices.progress_percentage 取得 |

**處理優先級**：在實作前必須先清理這些不存在的欄位引用。

### 2.3 practice_templates 表欄位對照

| 欄位名稱 | 現有 Schema | FRD 需求 | 狀態 | 修正建議 |
|---------|-------------|----------|------|---------|
| `id` | ✅ SERIAL PRIMARY KEY | - | 完成 | - |
| `external_id` | ✅ UUID | - | 完成 | - |
| `title` | ✅ VARCHAR(100) | - | 完成 | - |
| `practice_action` | ✅ TEXT | - | 完成 | - |
| `duration_days` | ✅ INT | - | 完成 | - |
| `frequency_min_days` | ✅ INT | - | 完成 | - |
| `frequency_max_days` | ✅ INT | - | 完成 | - |
| `session_duration_minutes` | ✅ INT | - | 完成 | - |
| `practice_time_periods` | ✅ TEXT[] | - | 完成 | - |

### 2.4 email_logs 表

現有 Schema 已完整支援主題實踐郵件記錄需求。

### 2.5 建議新增/修改的 SQL

> **注意**：以下 SQL 檔案需在 `daodao-storage/init-scripts-refactored/` 中建立

#### 打卡引導句：使用現有 `tag_prompt_templates` 表

> **注意**：打卡引導句已有現成資料表 `tag_prompt_templates`（650_create_table_tag_prompt_templates.sql），不需新建。

**現有表結構：**
```sql
-- tag_prompt_templates 結構
-- - tag_id: 關聯 tags 表
-- - usage_type: 'practice_checkin' | 'reflection' | 'summary'
-- - locale: 'zh-TW' | 'en-US'
-- - prompt_text: 引導句內容
-- - is_default: 是否預設顯示
-- - UNIQUE (tag_id, usage_type, locale)
```

**資料初始化（需在 999_insert_data.sql 或獨立檔案中新增）：**
```sql
-- 1. 先確保 tags 表有對應標籤
INSERT INTO "tags" ("name") VALUES
('實作'), ('新概念'), ('有趣'), ('困難'), ('下一步'), ('改進'), ('疑問')
ON CONFLICT ("name") DO NOTHING;

-- 2. 插入引導句（中文）
INSERT INTO "tag_prompt_templates" ("tag_id", "usage_type", "locale", "prompt_text")
SELECT t.id, 'practice_checkin', 'zh-TW', prompts.prompt_zh
FROM tags t
JOIN (VALUES
    ('實作', '我練習了...'),
    ('新概念', '我學到的一個新概念是...'),
    ('有趣', '發生了一件有趣的事，就是...'),
    ('困難', '遇到了一點困難，像是...'),
    ('下一步', '接下來我想嘗試...'),
    ('改進', '下次可以做得更好的是...'),
    ('疑問', '我有個疑問是...')
) AS prompts(tag_name, prompt_zh) ON t.name = prompts.tag_name
ON CONFLICT ("tag_id", "usage_type", "locale") DO NOTHING;

-- 3. 插入引導句（英文）
INSERT INTO "tag_prompt_templates" ("tag_id", "usage_type", "locale", "prompt_text")
SELECT t.id, 'practice_checkin', 'en-US', prompts.prompt_en
FROM tags t
JOIN (VALUES
    ('實作', 'I tried...'),
    ('新概念', 'One of the new concepts I learned is...'),
    ('有趣', 'Here''s something interesting happened..'),
    ('困難', 'I encountered some difficulties, like...'),
    ('下一步', 'Next, I want to try...'),
    ('改進', 'What I can do better next time is...'),
    ('疑問', 'One thing I''m still wondering...')
) AS prompts(tag_name, prompt_en) ON t.name = prompts.tag_name
ON CONFLICT ("tag_id", "usage_type", "locale") DO NOTHING;
```

#### 檔案 4: `427_create_table_checkin_encouragements.sql`

```sql
-- =====================================================
-- DAODAO 學習平台 - 打卡鼓勵句表
-- =====================================================
-- 文件說明：儲存打卡完成後隨機顯示的鼓勵句
-- 依賴表格：無
-- =====================================================
CREATE TABLE IF NOT EXISTS "checkin_encouragements" (
    "id" SERIAL PRIMARY KEY,
    "message" VARCHAR(100) NOT NULL UNIQUE,       -- 加入 UNIQUE 避免重複
    "is_active" BOOLEAN DEFAULT TRUE,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 插入鼓勵句資料
INSERT INTO "checkin_encouragements" ("message") VALUES
('今天的你也很有行動力哦！'),
('累積，是時間送給堅持者的禮物！'),
('你的堅持正在閃閃發光！'),
('每天進步一點點，回頭看會很不一樣！'),
('保持這個節奏，你做得很好！'),
('收到你的進度了！為堅持的自己鼓掌吧！'),
('不必完美，持續就是最大的勝利！'),
('這一小步，是通往目標的一大步！'),
('記得謝謝這樣努力的自己！'),
('感到困難嗎？那是大腦正在升級的訊號喔！'),
('紀錄完成！離目標又更近了一步！'),
('行動是治癒焦慮最好的解藥，你今天做到了！'),
('記得你出發的原因嗎？今天的你離它更近了！'),
('學習的路上，每一步都算數！'),
('今天的你，比想像中更強大一點點！'),
('今天的耕耘，是為了遇見更好的自己！'),
('收下這份成就感，明天繼續加油！'),
('你的每一分努力，島島阿學都幫你記下了！'),
('今天的投入，會讓你看見不一樣的風景！'),
('這一刻的投入，讓你的今天變得不平凡！'),
('辛苦了！別忘了給自己一杯咖啡的時間！'),
('專注當下的你，真的很有魅力！'),
('慢慢來，比較快！我們陪你一起走！'),
('享受這段旅程，學習本身就是獎勵！'),
('即使是一點點進展，也值得好好慶祝！'),
('休息一下，沉澱心情，明天再出發！'),
('願意開始的你，已經贏過昨天的自己！'),
('狀態很不錯喔！繼續保持這份熱情！'),
('相信過程，結果自然會發生！'),
('即使只是一小步，也是進步的證明！')
ON CONFLICT ("message") DO NOTHING;
```

> **說明**：模板使用追蹤直接透過 `practices.template_id` 欄位實現，不需要額外的 `practice_template_usages` 表或 `use_count` 欄位。查詢模板使用次數可直接：
> ```sql
> SELECT COUNT(*) FROM practices WHERE template_id = ? AND deleted_at IS NULL;
> ```

### 2.6 部署流程

1. 將上述 SQL 檔案加入 `daodao-storage/init-scripts-refactored/`
2. 部署資料庫變更
3. 在 `daodao-server` 執行 `pnpm run prisma:generate` 同步 Prisma Client

---

## 3. 業務邏輯修正

### 3.1 進度計算邏輯

**FRD 需求：**
- 建立後：20%
- 首次打卡：+30%（達到 50%）
- 剩餘打卡：平均分配 50%
- 最低目標打卡次數達成時強制為 100%
- 可超過 100%

**計算範例（來自 FRD）：**
- 14 天，每週 4-7 天執行
- 最低目標：2 週 × 4 天 = 8 次
- 建立後：20%
- 第 1 次打卡：50%（20% + 30%）
- 第 2-8 次打卡：每次 +7.14%（50% / 7 次）
- 第 8 次打卡：強制 100%
- 第 9+ 次打卡：超過 100%（如 107.14%）

**計算公式：**
```typescript
// src/utils/practice-progress.ts

interface ProgressConfig {
  durationDays: number;        // 總天數：7/14/21/30
  frequencyMinDays: number;    // 每週最少執行天數（如 4 表示每週至少 4 天）
  frequencyMaxDays: number;    // 每週最多執行天數（如 7 表示每週最多 7 天）
}

interface ProgressResult {
  percentage: number;          // 進度百分比（可超過 100）
  minTargetCheckIns: number;   // 最低目標打卡次數
  maxTargetCheckIns: number;   // 理想目標打卡次數
  isMinTargetMet: boolean;     // 是否達成最低目標
}

/**
 * 計算最低目標打卡次數
 *
 * @example
 * // 14 天，每週 4-7 天 → 2 週 × 4 天 = 8 次
 * calculateMinTargetCheckIns({ durationDays: 14, frequencyMinDays: 4, frequencyMaxDays: 7 })
 * // returns 8
 */
export const calculateMinTargetCheckIns = (config: ProgressConfig): number => {
  const weeks = config.durationDays / 7;
  return Math.ceil(weeks * config.frequencyMinDays);
};

/**
 * 計算進度百分比
 *
 * 進度規則：
 * - 建立後：20%
 * - 首次打卡：+30%（達到 50%）
 * - 剩餘打卡：平均分配剩餘 50%
 * - 達成最低目標：強制 100%
 * - 超額打卡：可超過 100%
 */
export const calculateProgress = (
  config: ProgressConfig,
  checkInCount: number,
  isCreated: boolean = true
): ProgressResult => {
  const minTarget = calculateMinTargetCheckIns(config);
  const maxTarget = Math.ceil(config.durationDays / 7 * config.frequencyMaxDays);

  if (!isCreated) {
    return {
      percentage: 0,
      minTargetCheckIns: minTarget,
      maxTargetCheckIns: maxTarget,
      isMinTargetMet: false
    };
  }

  let percentage = 20; // 建立後 20%

  if (checkInCount > 0) {
    percentage += 30; // 首次打卡 +30%

    // 計算剩餘打卡的進度增量
    const remainingCheckIns = checkInCount - 1;
    const remainingTargetCheckIns = minTarget - 1;

    if (remainingTargetCheckIns > 0) {
      // 剩餘 50% 平均分配給剩餘目標打卡次數
      const progressPerCheckIn = 50 / remainingTargetCheckIns;
      percentage += remainingCheckIns * progressPerCheckIn;
    }
  }

  // 達成最低目標時強制為 100%（避免浮點數誤差導致 99.9%）
  const isMinTargetMet = checkInCount >= minTarget;
  if (isMinTargetMet && percentage < 100) {
    percentage = 100;
  }

  return {
    percentage: Math.round(percentage * 100) / 100, // 保留兩位小數
    minTargetCheckIns: minTarget,
    maxTargetCheckIns: maxTarget,
    isMinTargetMet
  };
};
```

### 3.2 狀態流轉機制

**FRD 狀態定義：**
- `draft` - 草稿：建立流程未完成
- `not_started` - 未開始：已建立但未開始打卡
- `active` - 進行中：已有打卡記錄
- `completed` - 完成：到達結束日
- `archived` - 封存：使用者手動封存

**狀態轉換規則：**

```typescript
// src/utils/practice-status.ts

export type PracticeStatus = 'draft' | 'not_started' | 'active' | 'completed' | 'archived';

interface StatusTransitionContext {
  currentStatus: PracticeStatus;
  hasFirstCheckIn: boolean;
  endDate: Date | null;
  now?: Date;
}

/**
 * 判斷新狀態
 *
 * 注意：日期比較使用 UTC 時間，確保跨時區一致性
 */
export const determineNewStatus = (ctx: StatusTransitionContext): PracticeStatus => {
  const now = ctx.now || new Date();

  // 已封存不自動改變
  if (ctx.currentStatus === 'archived') {
    return 'archived';
  }

  // 檢查是否已結束（使用日期比較，包含結束當天）
  if (ctx.endDate) {
    const endOfDay = new Date(ctx.endDate);
    endOfDay.setHours(23, 59, 59, 999);
    if (now > endOfDay) {
      return 'completed';
    }
  }

  // 有打卡記錄則為進行中
  if (ctx.hasFirstCheckIn) {
    return 'active';
  }

  // 草稿狀態保持不變
  if (ctx.currentStatus === 'draft') {
    return 'draft';
  }

  return 'not_started';
};

/**
 * 驗證狀態轉換是否合法
 */
export const isValidTransition = (from: PracticeStatus, to: PracticeStatus): boolean => {
  const transitions: Record<PracticeStatus, PracticeStatus[]> = {
    draft: ['not_started', 'active', 'archived'],     // 新增 'active'：草稿階段直接打卡
    not_started: ['active', 'archived'],
    active: ['completed', 'archived'],
    completed: ['archived'],
    archived: ['not_started', 'active', 'completed']  // 可取消封存回到原狀態
  };

  return transitions[from]?.includes(to) || false;
};
```

### 3.3 打卡限制與驗證

**FRD 需求：**
1. 開始日限制：僅限 14 天以內開始（以小時計算）
2. 一日僅可打卡一次
3. 打卡後鎖定：不可修改開始日和頻率
4. 提早打卡：結束日自動位移

```typescript
// src/validators/practice-business.validators.ts

import { differenceInHours, differenceInDays, addDays } from 'date-fns';

/**
 * 驗證開始日期是否在 14 天內
 */
export const validateStartDate = (startDate: Date): { valid: boolean; error?: string } => {
  const now = new Date();
  const hoursDiff = differenceInHours(startDate, now);

  if (hoursDiff < 0) {
    // 允許今天或過去的日期（提早開始）
    return { valid: true };
  }

  const maxHours = 14 * 24; // 14 天
  if (hoursDiff > maxHours) {
    return {
      valid: false,
      error: `開始日期必須在 14 天以內，目前為 ${Math.floor(hoursDiff / 24)} 天後`
    };
  }

  return { valid: true };
};

/**
 * 驗證是否可以修改核心設定
 */
export const canModifyCoreSettings = (hasCheckIns: boolean): boolean => {
  return !hasCheckIns;
};

/**
 * 計算提早打卡的日期位移
 */
export const calculateDateShift = (
  originalStartDate: Date,
  firstCheckInDate: Date,
  durationDays: number
): { newStartDate: Date; newEndDate: Date; shiftDays: number } => {
  const shiftDays = differenceInDays(originalStartDate, firstCheckInDate);

  if (shiftDays <= 0) {
    // 未提早，不需位移
    return {
      newStartDate: originalStartDate,
      newEndDate: addDays(originalStartDate, durationDays - 1),
      shiftDays: 0
    };
  }

  const newStartDate = firstCheckInDate;
  const newEndDate = addDays(newStartDate, durationDays - 1);

  return { newStartDate, newEndDate, shiftDays };
};
```

### 3.4 修改 practice.service.ts

需要修改的項目：

```typescript
// 1. 建立時設定初始進度 20%
export async function create(data: CreatePracticeRequest, userId: number): Promise<ApiSuccessResponse<PracticeEntity>> {
  // ... existing code ...

  const practice = await prismaClient.practices.create({
    data: {
      // ... existing fields ...
      progress_percentage: 20, // 建立後 20%
      status: 'not_started'    // 初始狀態
    }
  });

  // 發送建立成功郵件 (PE01)
  await sendPracticeCreatedEmail(practice.id).catch(err => {
    loggerService.error('Failed to send PE01 email', { practiceId: practice.id, error: err });
  });

  // ... rest of code ...
}

// 2. 更新時驗證打卡後鎖定
export async function update(id: number, data: UpdatePracticeRequest, userId: number): Promise<ApiSuccessResponse<PracticeEntity>> {
  // ... existing validation ...

  // 檢查是否有打卡記錄
  const hasCheckIns = await prismaClient.practice_checkins.count({
    where: { practice_id: id }
  }) > 0;

  // 打卡後鎖定核心設定
  if (hasCheckIns) {
    const lockedFields = ['startDate', 'frequencyMinDays', 'frequencyMaxDays', 'durationDays'];
    const attemptedChanges = lockedFields.filter(field => data[field] !== undefined);

    if (attemptedChanges.length > 0) {
      throw new BadRequestError(`打卡後無法修改: ${attemptedChanges.join(', ')}`);
    }
  }

  // ... rest of update logic ...
}
```

### 3.5 修改 practice-checkin.service.ts

需要修改的項目：

```typescript
// 1. 打卡後更新進度和狀態
export async function createCheckIn(
  practiceId: number,
  data: CreateCheckInRequest,
  userId: number
): Promise<ApiSuccessResponse<CheckInEntity>> {
  // ... existing validation ...

  // 統一定義今日日期（函數開頭宣告，避免作用域問題）
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 獲取當前打卡次數
  const currentCheckInCount = await prismaClient.practice_checkins.count({
    where: { practice_id: practiceId }
  });

  const isFirstCheckIn = currentCheckInCount === 0;

  // 檢查是否提早打卡（首次打卡 + 開始日在未來）
  if (isFirstCheckIn && practice.start_date) {
    const startDate = new Date(practice.start_date);
    startDate.setHours(0, 0, 0, 0);

    if (today < startDate) {
      // 提早打卡，需要位移日期
      const { newStartDate, newEndDate, shiftDays } = calculateDateShift(
        startDate,
        today,
        practice.duration_days || 7
      );

      // 更新開始日和結束日
      await prismaClient.practices.update({
        where: { id: practiceId },
        data: {
          start_date: newStartDate,
          end_date: newEndDate,
          first_checkin_at: new Date()
        }
      });

      loggerService.info('Practice dates shifted due to early check-in', {
        practiceId,
        shiftDays,
        originalStartDate: startDate,
        newStartDate
      });
    }
  }

  // 建立打卡記錄
  const checkIn = await prismaClient.practice_checkins.create({
    data: {
      practice_id: practiceId,
      user_id: userId,
      checkin_date: today,
      mood: data.mood,
      note: data.note,
      image_urls: data.imageUrls || []
    }
  });

  // 計算新進度
  const newCheckInCount = currentCheckInCount + 1;
  const progressResult = calculateProgress(
    {
      durationDays: practice.duration_days || 7,
      frequencyMinDays: practice.frequency_min_days || 1,
      frequencyMaxDays: practice.frequency_max_days || 7
    },
    newCheckInCount
  );

  // 更新實踐進度和狀態
  await prismaClient.practices.update({
    where: { id: practiceId },
    data: {
      progress_percentage: progressResult.percentage,
      status: 'active',
      first_checkin_at: isFirstCheckIn ? new Date() : undefined,
      updated_at: new Date()
    }
  });

  // 發送第一次打卡郵件 (PE02) - 非同步發送，不阻塞主流程
  if (isFirstCheckIn) {
    sendFirstCheckInEmail(practiceId).catch(err => {
      loggerService.error('Failed to send PE02 email', { practiceId, error: err });
      // 記錄失敗，由排程任務重試
    });
  }

  // 獲取隨機鼓勵句
  const encouragement = await getRandomEncouragement();

  // ... return with encouragement ...
}
```

### 3.6 併發處理

**打卡防重複策略：**

| 層級 | 機制 | 說明 |
|------|------|------|
| 資料庫 | UNIQUE constraint | `(practice_id, checkin_date)` 確保一日一次 |
| 應用層 | 查詢後建立 | 先查詢是否已存在，再建立記錄 |
| 前端 | 按鈕禁用 | 提交後禁用按鈕，防止重複點擊 |

**Race Condition 處理：**
- 依賴資料庫 UNIQUE constraint 作為最後防線
- 捕獲 unique violation 錯誤，返回友善訊息「今日已完成簽到」

---

## 4. API 端點修正

### 4.1 新增 API 端點

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/v1/practices/templates` | 取得模板列表 |
| GET | `/api/v1/practices/templates/:id` | 取得單一模板詳情 |
| GET | `/api/v1/tag-prompts?usage_type=practice_checkin` | 取得打卡引導句列表（使用現有 tag_prompt_templates） |
| GET | `/api/v1/checkin-encouragements/random` | 取得隨機鼓勵句 |
| POST | `/api/v1/practices/:id/archive` | 封存實踐 |
| POST | `/api/v1/practices/:id/unarchive` | 取消封存 |

### 4.2 修改 API 端點

| 方法 | 路徑 | 修正內容 |
|------|------|----------|
| POST | `/api/v1/practices` | 新增 templateId 參數、進度初始化、發送 PE01 |
| PUT | `/api/v1/practices/:id` | 打卡後鎖定驗證 |
| POST | `/api/v1/practices/:id/checkins` | 進度更新、狀態轉換、發送 PE02、返回鼓勵句 |

### 4.3 API Response 格式調整

```typescript
// 打卡成功回應新增鼓勵句
interface CheckInResponse {
  success: true;
  data: {
    checkIn: CheckInEntity;
    practice: {
      progressPercentage: number;
      status: string;
      isMinTargetMet: boolean;
    };
    encouragement: string;  // 新增：隨機鼓勵句
  };
  timestamp: string;
}
```

---

## 5. Email 功能實作

> **重要**：主題實踐郵件功能需整合現有的 Email 服務架構。
> 參考：`docs/email/email-service.md`、`docs/email/implementation-guide.md`

### 5.1 檔案結構

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
│   ├── email-log.service.ts            # 現有郵件記錄服務（直接使用）
│   ├── template.service.ts             # 模板管理（新增 Practice 模板）
│   ├── base-template.ts                # 基礎組件（複用，不修改）
│   ├── practice-email.service.ts       # 主題實踐郵件服務（新建）
│   └── practice-template.ts            # 主題實踐模板（新建，包含 PE01-PE08）
│
└── types/email/
    └── practice.types.ts               # 主題實踐郵件型別（新建）
```

### 5.2 現有服務整合

**複用現有組件（不需重新實作）：**

| 組件 | 來源 | 說明 |
|------|------|------|
| `EMAIL_COLORS` | `base-template.ts` | 設計系統色彩常數 |
| `EMAIL_ASSETS` | `base-template.ts` | 圖片資源 URL |
| `SOCIAL_LINKS` | `base-template.ts` | 社群連結 |
| `generateStandardEmail` | `base-template.ts` | 統一處理 head, wrapper, banner, footer |
| `generateCtaButton` | `base-template.ts` | CTA 按鈕（支援 cyan/orange 色彩） |
| `generateDivider` | `base-template.ts` | 分隔線 |
| `generateAuthorSection` | `base-template.ts` | 作者署名區塊 |
| `createEmailLog` | `email-log.service.ts` | 記錄郵件發送 |
| `hasEmailBeenSent` | `email-log.service.ts` | 檢查是否已發送 |

**設計系統色彩（使用現有定義）：**

```typescript
// 直接從 base-template.ts 引入，不要重新定義
import { EMAIL_COLORS } from './base-template';

// EMAIL_COLORS 已包含：
// - brandCyan: '#16B9B3' (品牌主色/CTA)
// - brandOrange: '#FFA10B' (橘色 CTA)
// - textHeading: '#0D3036' (主標題)
// - textPrimary: '#295E5C' (主要文字)
// - textSecondary: '#9FB5B8' (次要文字)
// - bgQuote: '#F5FFFD' (引言區塊背景)
```

### 5.3 排程任務（BullMQ）

> **採用方案**：使用 BullMQ 作為任務隊列，自動解決多容器重複執行問題。
> 詳見：[practice-email-spec.md - 5. 排程設計](./practice-email-spec.md#5-排程設計)

**BullMQ 優勢**：
- 原生支援多容器環境，透過 Redis 原子操作確保任務只執行一次
- 內建重試機制、執行歷史、任務監控
- 支援排程任務、延遲任務、優先級

**檔案結構**：

```
src/queues/
├── index.ts                      # Queue 統一導出
├── connection.ts                 # Redis 連線設定
├── practice-email.queue.ts       # Practice Email Queue 定義
└── practice-email.worker.ts      # Practice Email Worker 處理器
```

**Queue 設定**：

```typescript
// src/queues/practice-email.queue.ts
import { Queue } from 'bullmq';
import { getRedisConnection } from './connection';

export interface PracticeEmailJobData {
  type: 'weekly-summary' | 'final-summary' | 'update-status' | 'practice-created' | 'first-checkin';
  practiceId?: number;
}

export const practiceEmailQueue = new Queue<PracticeEmailJobData>('practice-email', {
  connection: getRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    timeout: 60000, // 60 秒超時
    removeOnComplete: { age: 7 * 24 * 3600, count: 1000 },
    removeOnFail: { age: 30 * 24 * 3600 },
  },
});

// 註冊排程任務
export const registerPracticeEmailSchedulers = async () => { /* ... */ };

// 加入即時郵件任務（使用 jobId 去重）
export const addPracticeEmailJob = async (
  type: PracticeEmailJobData['type'],
  practiceId: number
): Promise<void> => {
  await practiceEmailQueue.add(`send-${type}`, { type, practiceId }, {
    jobId: `${type}-${practiceId}`, // 相同 ID 不會重複加入
  });
};
```

**Worker 設定**：

```typescript
// src/queues/practice-email.worker.ts
import { Worker, Job } from 'bullmq';
import { getRedisConnection } from './connection';

export const createPracticeEmailWorker = () => {
  return new Worker<PracticeEmailJobData>(
    'practice-email',
    async (job: Job<PracticeEmailJobData>) => {
      const { type, practiceId } = job.data;
      switch (type) {
        case 'weekly-summary': return await sendPendingWeeklySummaries();
        case 'final-summary': return await sendPendingFinalSummaries();
        case 'update-status': return await updateCompletedPractices();
        case 'practice-created': return await sendPracticeCreatedEmail(practiceId!);
        case 'first-checkin': return await sendFirstCheckInEmail(practiceId!);
        default: throw new Error(`Unknown job type: ${type}`);
      }
    },
    { connection: getRedisConnection(), concurrency: 1 }
  );
};
```

**應用啟動整合**：

```typescript
// src/index.ts
import { Worker } from 'bullmq';
import {
  practiceEmailQueue, registerPracticeEmailSchedulers,
  createPracticeEmailWorker, getRedisConnection, closeRedisConnection,
} from './queues';

let worker: Worker | null = null;

const startServer = async () => {
  // 測試 Redis 連線
  await getRedisConnection().ping();

  // 註冊排程任務（BullMQ 自動去重）
  await registerPracticeEmailSchedulers();

  // 啟動 Worker
  worker = createPracticeEmailWorker();
};

// Graceful Shutdown
const shutdown = async () => {
  if (worker) await worker.close();
  await practiceEmailQueue.close();
  await closeRedisConnection();
  process.exit(0);
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
```

### 5.4 整合觸發點

| 郵件類型 | 觸發時機 | 整合位置 | 觸發方式 |
|---------|---------|---------|---------|
| PE01 | 建立成功 | `practice.service.ts` - `create()` | `addPracticeEmailJob('practice-created', id)` |
| PE02 | 第一次打卡 | `practice-checkin.service.ts` - `createCheckIn()` | `addPracticeEmailJob('first-checkin', id)` |
| PE03-PE06 | 每週第 7 天 | BullMQ 排程 | 自動觸發 |
| PE07-PE08 | 結束後 24 小時 | BullMQ 排程 | 自動觸發 |

**即時郵件透過 Queue 發送（享受重試機制）：**

```typescript
// src/services/practice/practice.service.ts
import { addPracticeEmailJob } from '../../queues';

const create = async (data: CreatePracticeRequest, userId: number) => {
  // ... 建立邏輯 ...

  // 透過 BullMQ 發送郵件，自動重試
  await addPracticeEmailJob('practice-created', newPractice.id);

  return newPractice;
};

// src/services/practice/practice-checkin.service.ts
const createCheckIn = async (practiceId: number, data: CheckInData, userId: number) => {
  // ... 打卡邏輯 ...

  if (isFirstCheckIn) {
    await addPracticeEmailJob('first-checkin', practiceId);
  }

  return newCheckIn;
};
```

**郵件記錄使用現有 email_logs 表：**

```typescript
// 使用現有的 email-log.service.ts
import { createEmailLog, hasEmailBeenSent } from './email-log.service';
import { EMAIL_TYPES } from '../../types/email';

// EMAIL_TYPES 已定義主題實踐相關類型：
// - PRACTICE_CREATED: 'practice_created' (PE01)
// - PRACTICE_FIRST_CHECKIN: 'practice_first_checkin' (PE02)
// - PRACTICE_WEEKLY_SUMMARY: 'practice_weekly_summary' (PE03-06)
// - PRACTICE_FINAL_SUMMARY: 'practice_final_summary' (PE07-08)
```

### 5.5 Email 錯誤處理

> **重要**：使用現有 `EmailService` 的重試機制，詳見 `docs/email/email-service.md`

| 情境 | 處理方式 |
|------|---------|
| 即時發送失敗 (PE01/PE02) | 使用 `sendEmailWithRetry()` 自動重試，記錄到 email_logs |
| 排程發送失敗 (PE03-PE08) | 記錄錯誤（status='failed'），下次排程時重新嘗試 |
| 連續失敗超過 3 次 | 標記為永久失敗，不再重試 |
| 單日失敗超過 10 封 | 發送告警通知管理員 |

**使用現有重試機制：**
```typescript
// src/services/email/email.service.ts 已提供 sendEmailWithRetry 方法
// 配置在 src/config/email.config.ts

import { emailService } from './email.service';

// 預設配置（可透過環境變數調整）：
// - retry.maxAttempts: 3 (最大重試次數)
// - retry.backoffMs: 1000 (退避時間，指數增長)

// 使用方式：
const result = await emailService.sendEmailWithRetry({
  to: userEmail,
  subject: template.subject,
  html: template.html
});
```

---

## 6. 實作優先順序

### Phase 1：核心功能修正（高優先）

1. **進度計算邏輯**
   - 實作 `practice-progress.ts` 工具
   - 修改 `practice.service.ts` 的 `create()` 方法
   - 修改 `practice-checkin.service.ts` 的 `createCheckIn()` 方法

2. **狀態流轉機制**
   - 實作 `practice-status.ts` 工具
   - 新增狀態更新排程任務

3. **打卡限制與驗證**
   - 實作 `practice-business.validators.ts`
   - 修改 `update()` 方法加入鎖定驗證
   - 實作提早打卡日期位移

### Phase 2：輔助功能（中優先）

4. **模板功能**
   - 實作模板 API 端點（列表、詳情）
   - 模板使用追蹤透過 `practices.template_id` 實現

5. **鼓勵句與引導句**
   - 建立 `checkin_encouragements` 資料表並匯入資料
   - 實作隨機鼓勵句 API
   - 實作引導句查詢 API（使用現有 `tag_prompt_templates` 表）
   - 初始化引導句資料到 `tag_prompt_templates`

### Phase 3：Email 功能（中優先）

6. **BullMQ 隊列設定**
   - 安裝 `bullmq` 依賴
   - 建立 `src/queues/` 目錄結構
   - 實作 Queue、Worker、排程註冊
   - 設定應用啟動初始化

7. **Email 服務**
   - 建立 `practice-email.service.ts`
   - 實作 8 種郵件模板
   - 整合 BullMQ Worker 呼叫

8. **Email 整合**
   - 整合 PE01 到建立流程（使用 `addPracticeEmailJob`）
   - 整合 PE02 到打卡流程（使用 `addPracticeEmailJob`）
   - 測試排程任務（週回顧和完成總結）
   - 選配：設定 Bull Board 監控

### Phase 4：測試與優化（必要）

8. **單元測試**
   - 進度計算測試
   - 狀態轉換測試
   - 日期位移測試

9. **整合測試**
   - API 端點測試
   - Email 發送測試
   - 排程任務測試

---

## 7. 測試清單

### 7.1 進度計算測試

- [ ] 建立後進度為 20%
- [ ] 首次打卡後進度為 50%
- [ ] 14天/每週4次：第8次打卡達 100%
- [ ] 超額打卡顯示 >100%
- [ ] 浮點數精度處理正確

### 7.2 狀態轉換測試

- [ ] draft → not_started（建立完成）
- [ ] not_started → active（首次打卡）
- [ ] active → completed（到達結束日）
- [ ] 任意狀態 → archived（手動封存）
- [ ] archived → 原狀態（取消封存）

### 7.3 打卡限制測試

- [ ] 開始日 13天23小時後：通過
- [ ] 開始日 14天1小時後：阻擋
- [ ] 未打卡時修改頻率：允許
- [ ] 已打卡後修改頻率：阻擋
- [ ] 同一天打卡兩次：阻擋第二次
- [ ] 提早打卡：日期正確位移

### 7.4 Email 發送測試

- [ ] PE01：建立後透過 Queue 發送
- [ ] PE02：首次打卡後透過 Queue 發送
- [ ] PE03-PE06：第7天正確判斷類型
- [ ] PE07-PE08：結束後24小時內收到
- [ ] 新手緩衝：符合條件跳過首週回顧
- [ ] 沉默邏輯：連續3週無動作停發

### 7.5 BullMQ 測試

- [ ] 排程任務正確註冊（upsertJobScheduler）
- [ ] Worker 正確處理各種任務類型
- [ ] 任務失敗時自動重試
- [ ] 多容器環境下任務不重複執行
- [ ] Graceful Shutdown 正確關閉 Worker

---

## 8. 相關文件

### Email 服務核心文件（務必先閱讀）

- [Email 服務技術文件](../email/email-service.md) - 核心服務架構
- [Email 模板使用指南](../email/templates-guide.md) - 模板開發指南
- [系統信模板規格](../email/system-email-template-spec.md) - 設計系統規格
- [系統信模板實作指南](../email/implementation-guide.md) - 整合 email_logs 說明

### 主題實踐文件

- [主題實踐 建立與打卡 FRD](./主題實踐_%20建立與打卡%20-%20FRD.md)
- [主題實踐 Email FRD](./主題實踐%20Email%20-%20FRD.md)
- [主題實踐郵件功能規格](./practice-email-spec.md)
- [主題實踐郵件實作指南](./practice-email-implementation.md)
- [主題實踐郵件模板](./practice-email-templates.md)

---

## 9. 更新日誌

| 日期 | 版本 | 變更內容 |
|------|------|----------|
| 2025-01-25 | 1.2 | 使用現有 tag_prompt_templates 表作為打卡引導句，移除重複建表 |
| 2025-01-25 | 1.1 | Code Review 修正：<br>- 新增架構說明（資料庫由 daodao-storage 管理）<br>- 新增待確認事項（service 中不存在的欄位）<br>- SQL 檔案拆分並加入命名規則<br>- 修正 SQL ON CONFLICT 語法<br>- 新增進度計算範例說明<br>- 修正狀態轉換遺漏（draft → active）<br>- 修正日期比較邏輯<br>- 修正變數作用域問題<br>- 新增併發處理說明<br>- 新增 Email 錯誤處理策略 |
| 2025-01-24 | 1.0 | 初始版本 |
