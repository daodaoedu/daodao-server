# Practices Module Specification

## 1. Overview

### 1.1 Purpose
實踐模組是 DaoDao 平台的核心功能之一，讓用戶能夠建立每日學習習慣，透過打卡系統追蹤進度，並透過社群互動獲得鼓勵和支持。

### 1.2 Scope
- 實踐計畫 CRUD
- 打卡系統（Check-in）
- 進度追蹤與統計
- 連續打卡（Streak）計算
- 實踐模板
- 鼓勵句與引導句系統
- 社群互動（讚、收藏、分享）
- 自動狀態更新

---

## 2. Data Models

### 2.1 Practice Entity

```prisma
model practices {
  id                    String    @id @default(uuid())
  user_id               String

  // Basic info
  title                 String
  description           String?
  cover_image_url       String?

  // Schedule
  frequency_type        frequency_type_t @default(daily)
  time_slots            time_slot_t[]    @default([morning])
  target_days           Int              @default(21)
  reminder_time         String?          // HH:mm format

  // Status
  status                practice_status_t @default(active)
  visibility            visibility_t      @default(public)

  // Progress
  current_streak        Int       @default(0)
  longest_streak        Int       @default(0)
  total_checkins        Int       @default(0)
  progress_percent      Float     @default(0)

  // Dates
  start_date            DateTime
  target_end_date       DateTime?
  actual_end_date       DateTime?
  last_checkin_at       DateTime?

  // Engagement
  likes_count           Int       @default(0)
  saves_count           Int       @default(0)
  shares_count          Int       @default(0)
  views_count           Int       @default(0)

  // Tags & Resources
  template_id           String?

  // Timestamps
  created_at            DateTime  @default(now())
  updated_at            DateTime  @updatedAt
  deleted_at            DateTime?

  // Relations
  user                  users                  @relation(fields: [user_id], references: [id])
  template              practice_templates?    @relation(fields: [template_id], references: [id])
  checkins              practice_checkins[]
  entity_tags           entity_tags[]
  likes                 likes[]
  saves                 saves[]
}
```

### 2.2 Practice Check-in Entity

```prisma
model practice_checkins {
  id              String    @id @default(uuid())
  practice_id     String
  user_id         String

  // Check-in details
  checked_in_at   DateTime  @default(now())
  time_slot       time_slot_t
  day_number      Int       // 第幾天

  // Content
  mood            mood_t?
  note            String?   @db.VarChar(300)
  images          String[]  // max 3

  // OG Image (for sharing)
  og_image_url    String?

  // Timestamps
  created_at      DateTime  @default(now())
  updated_at      DateTime  @updatedAt

  // Relations
  practice        practices @relation(fields: [practice_id], references: [id])
  user            users     @relation(fields: [user_id], references: [id])

  @@unique([practice_id, checked_in_at, time_slot])
}
```

### 2.3 Practice Template Entity

```prisma
model practice_templates {
  id              String    @id @default(uuid())

  // Basic info
  title           String
  description     String?
  cover_image_url String?

  // Default settings
  frequency_type  frequency_type_t @default(daily)
  time_slots      time_slot_t[]    @default([morning])
  target_days     Int              @default(21)

  // Category
  category_id     Int?

  // Stats
  usage_count     Int       @default(0)
  is_featured     Boolean   @default(false)
  is_active       Boolean   @default(true)

  // Timestamps
  created_at      DateTime  @default(now())
  updated_at      DateTime  @updatedAt

  // Relations
  category        practice_template_categories? @relation(fields: [category_id], references: [id])
  practices       practices[]
}
```

### 2.4 Encouragement Entity

```prisma
model checkin_encouragements {
  id              String    @id @default(uuid())

  // Content
  content         String
  type            encouragement_type_t

  // Target conditions
  min_streak      Int?      // 最小連續天數
  max_streak      Int?      // 最大連續天數
  day_number      Int?      // 特定天數
  time_slot       time_slot_t?

  // Status
  is_active       Boolean   @default(true)

  // Timestamps
  created_at      DateTime  @default(now())
  updated_at      DateTime  @updatedAt
}
```

### 2.5 Tag Prompt Template Entity

```prisma
model tag_prompt_templates {
  id              String    @id @default(uuid())

  // Content
  prompt          String
  tag_id          String

  // Status
  is_active       Boolean   @default(true)

  // Timestamps
  created_at      DateTime  @default(now())
  updated_at      DateTime  @updatedAt

  // Relations
  tag             tags      @relation(fields: [tag_id], references: [id])
}
```

### 2.6 Enums

```prisma
enum frequency_type_t {
  daily           // 每日
  weekdays        // 週一至週五
  weekends        // 週末
  custom          // 自訂
}

enum time_slot_t {
  morning         // 早上 (6:00-12:00)
  afternoon       // 下午 (12:00-18:00)
  evening         // 晚上 (18:00-22:00)
  night           // 深夜 (22:00-6:00)
}

enum practice_status_t {
  active          // 進行中
  paused          // 暫停
  completed       // 已完成
  expired         // 已過期
  archived        // 已歸檔
}

enum mood_t {
  great           // 😄 很棒
  good            // 🙂 不錯
  okay            // 😐 普通
  tired           // 😪 疲憊
  struggling      // 😰 掙扎
}

enum encouragement_type_t {
  streak_start    // 連續開始
  streak_milestone // 連續里程碑 (7, 14, 21...)
  streak_recovery // 中斷後恢復
  general         // 一般鼓勵
  completion      // 完成祝賀
}

enum visibility_t {
  public
  followers
  private
}
```

---

## 3. API Endpoints

### 3.1 Practice CRUD

```yaml
# Create Practice
POST /api/v1/practices
Authorization: Bearer <token>
Content-Type: application/json

Request:
  title: string (required, 2-100 chars)
  description?: string (max 500 chars)
  coverImageUrl?: string (valid URL)
  frequencyType?: frequency_type_t (default: "daily")
  timeSlots?: time_slot_t[] (default: ["morning"])
  targetDays?: number (default: 21, min: 1, max: 365)
  reminderTime?: string (HH:mm format)
  startDate?: string (ISO date, default: today)
  visibility?: visibility_t (default: "public")
  templateId?: string
  tags?: string[] (max 5)

Response 201:
  success: true
  data:
    id: string
    title: string
    description: string | null
    coverImageUrl: string | null
    frequencyType: string
    timeSlots: string[]
    targetDays: number
    reminderTime: string | null
    status: "active"
    visibility: string
    currentStreak: 0
    longestStreak: 0
    totalCheckins: 0
    progressPercent: 0
    startDate: string
    targetEndDate: string
    tags: string[]
    createdAt: string

---

# Get Practice
GET /api/v1/practices/:id
Authorization: Bearer <token> (optional for public)

Response 200:
  success: true
  data:
    id: string
    title: string
    description: string | null
    coverImageUrl: string | null
    frequencyType: string
    timeSlots: string[]
    targetDays: number
    reminderTime: string | null
    status: string
    visibility: string
    currentStreak: number
    longestStreak: number
    totalCheckins: number
    progressPercent: number
    startDate: string
    targetEndDate: string | null
    actualEndDate: string | null
    lastCheckinAt: string | null
    likesCount: number
    savesCount: number
    sharesCount: number
    viewsCount: number
    user:
      id: string
      name: string
      avatarUrl: string | null
    tags: string[]
    template: object | null
    userStatus: (if authenticated)
      isLiked: boolean
      isSaved: boolean
      isOwner: boolean
      todayCheckedIn: boolean
    createdAt: string
    updatedAt: string

---

# Update Practice
PUT /api/v1/practices/:id
Authorization: Bearer <token>
Content-Type: application/json

Request:
  title?: string
  description?: string
  coverImageUrl?: string
  frequencyType?: frequency_type_t
  timeSlots?: time_slot_t[]
  targetDays?: number
  reminderTime?: string
  visibility?: visibility_t
  status?: practice_status_t
  tags?: string[]

Response 200:
  success: true
  data:
    # Updated practice

---

# Delete Practice
DELETE /api/v1/practices/:id
Authorization: Bearer <token>

Response 200:
  success: true
  data:
    message: "Practice deleted successfully"
```

### 3.2 List Practices

```yaml
# List all practices (public)
GET /api/v1/practices
Authorization: Bearer <token> (optional)

Query Parameters:
  page?: number (default: 1)
  limit?: number (default: 20, max: 100)
  search?: string
  status?: practice_status_t
  frequencyType?: frequency_type_t
  tags?: string (comma-separated)
  userId?: string
  sortBy?: "createdAt" | "updatedAt" | "likesCount" | "currentStreak"
  sortOrder?: "asc" | "desc" (default: "desc")

Response 200:
  success: true
  data:
    - id: string
      title: string
      description: string | null
      coverImageUrl: string | null
      status: string
      currentStreak: number
      totalCheckins: number
      progressPercent: number
      targetDays: number
      likesCount: number
      user:
        id: string
        name: string
        avatarUrl: string | null
      tags: string[]
      createdAt: string
  pagination: ...

---

# Get my practices
GET /api/v1/me/practices
Authorization: Bearer <token>

Query Parameters:
  status?: practice_status_t
  page?: number
  limit?: number

Response 200:
  success: true
  data:
    # Array of user's practices
```

### 3.3 Check-in System

```yaml
# Create check-in
POST /api/v1/practices/:id/checkins
Authorization: Bearer <token>
Content-Type: application/json

Request:
  timeSlot: time_slot_t (required)
  mood?: mood_t
  note?: string (max 300 chars)
  images?: string[] (max 3 URLs)

Response 201:
  success: true
  data:
    id: string
    timeSlot: string
    dayNumber: number
    mood: string | null
    note: string | null
    images: string[]
    ogImageUrl: string | null
    checkedInAt: string
    encouragement: string | null # 鼓勵句
    practiceUpdate:
      currentStreak: number
      longestStreak: number
      totalCheckins: number
      progressPercent: number

Response 409:
  success: false
  error:
    code: "ALREADY_CHECKED_IN"
    message: "Already checked in for this time slot today"

---

# List check-ins
GET /api/v1/practices/:id/checkins
Authorization: Bearer <token>

Query Parameters:
  page?: number
  limit?: number
  startDate?: string (ISO date)
  endDate?: string (ISO date)

Response 200:
  success: true
  data:
    - id: string
      timeSlot: string
      dayNumber: number
      mood: string | null
      note: string | null
      images: string[]
      checkedInAt: string
  pagination: ...

---

# Get check-in calendar view
GET /api/v1/practices/:id/checkins/calendar/:year/:month
Authorization: Bearer <token>

Path Parameters:
  year: number (e.g., 2026)
  month: number (1-12)

Response 200:
  success: true
  data:
    year: number
    month: number
    days:
      - date: "2026-02-01"
        checkins:
          - id: string
            timeSlot: string
            mood: string | null
        isComplete: boolean # 當天所有時段都已打卡
      - date: "2026-02-02"
        checkins: []
        isComplete: false
    summary:
      totalDays: number
      completeDays: number
      partialDays: number
      missedDays: number

---

# Get check-in stats
GET /api/v1/practices/:id/checkins/stats
Authorization: Bearer <token>

Response 200:
  success: true
  data:
    overview:
      totalCheckins: number
      currentStreak: number
      longestStreak: number
      progressPercent: number
      daysRemaining: number
      estimatedCompletionDate: string | null
    byTimeSlot:
      morning: number
      afternoon: number
      evening: number
      night: number
    byMood:
      great: number
      good: number
      okay: number
      tired: number
      struggling: number
    weeklyPattern:
      sunday: number
      monday: number
      tuesday: number
      wednesday: number
      thursday: number
      friday: number
      saturday: number
    recentActivity:
      last7Days: number
      last30Days: number

---

# Delete check-in (admin only or within 1 hour)
DELETE /api/v1/practices/:practiceId/checkins/:checkinId
Authorization: Bearer <token>

Response 200:
  success: true
  data:
    message: "Check-in deleted successfully"

Response 403:
  success: false
  error:
    code: "CHECKIN_DELETE_FORBIDDEN"
    message: "Check-ins can only be deleted within 1 hour"
```

### 3.4 Practice Statistics

```yaml
GET /api/v1/practices/:id/stats
Authorization: Bearer <token>

Response 200:
  success: true
  data:
    overview:
      status: string
      progressPercent: number
      daysElapsed: number
      daysRemaining: number
      currentStreak: number
      longestStreak: number
      totalCheckins: number
      expectedCheckins: number
      completionRate: number
    streaks:
      current: number
      longest: number
      history:
        - startDate: string
          endDate: string
          length: number
    engagement:
      likesCount: number
      savesCount: number
      sharesCount: number
      viewsCount: number
    milestones:
      - day: 7
        achieved: boolean
        achievedAt: string | null
      - day: 14
        achieved: boolean
        achievedAt: string | null
      - day: 21
        achieved: boolean
        achievedAt: string | null

---

# Get my practice stats (aggregated)
GET /api/v1/me/practice-stats
Authorization: Bearer <token>

Response 200:
  success: true
  data:
    totalPractices: number
    activePractices: number
    completedPractices: number
    totalCheckins: number
    currentLongestStreak: number
    overallLongestStreak: number
    averageCompletionRate: number
    thisWeekCheckins: number
    thisMonthCheckins: number
```

### 3.5 Practice Interactions

```yaml
# Like practice
POST /api/v1/practices/:id/like
Authorization: Bearer <token>

Response 200:
  success: true
  data:
    liked: true
    likesCount: number

---

# Unlike practice
DELETE /api/v1/practices/:id/like
Authorization: Bearer <token>

Response 200:
  success: true
  data:
    liked: false
    likesCount: number

---

# Save/Favorite practice
POST /api/v1/practices/:id/favorite
Authorization: Bearer <token>

Response 200:
  success: true
  data:
    saved: true
    savesCount: number

---

# Unsave practice
DELETE /api/v1/practices/:id/favorite
Authorization: Bearer <token>

Response 200:
  success: true
  data:
    saved: false
    savesCount: number

---

# Share practice (record share)
POST /api/v1/practices/:id/share
Authorization: Bearer <token>
Content-Type: application/json

Request:
  platform?: "twitter" | "facebook" | "line" | "copy_link"

Response 200:
  success: true
  data:
    sharesCount: number
    shareUrl: string

---

# Record view
POST /api/v1/practices/:id/view
Authorization: Bearer <token> (optional)

Response 200:
  success: true
  data:
    viewsCount: number

---

# Get user status for practice
GET /api/v1/practices/:id/user-status
Authorization: Bearer <token>

Response 200:
  success: true
  data:
    isLiked: boolean
    isSaved: boolean
    isOwner: boolean
    todayCheckins:
      - timeSlot: string
        checkedInAt: string
    canCheckin:
      morning: boolean
      afternoon: boolean
      evening: boolean
      night: boolean
```

### 3.6 Practice Templates

```yaml
# List templates
GET /api/v1/practices/templates
Authorization: Bearer <token> (optional)

Query Parameters:
  categoryId?: number
  search?: string
  isFeatured?: boolean
  page?: number
  limit?: number

Response 200:
  success: true
  data:
    - id: string
      title: string
      description: string | null
      coverImageUrl: string | null
      frequencyType: string
      timeSlots: string[]
      targetDays: number
      usageCount: number
      isFeatured: boolean
      category: object | null
  pagination: ...

---

# Get template detail
GET /api/v1/practices/templates/:id
Authorization: Bearer <token> (optional)

Response 200:
  success: true
  data:
    # Full template object

---

# Create practice from template
POST /api/v1/practices/templates/:id/use
Authorization: Bearer <token>
Content-Type: application/json

Request:
  title?: string (override template title)
  startDate?: string (ISO date)
  customizations?:
    frequencyType?: frequency_type_t
    timeSlots?: time_slot_t[]
    targetDays?: number

Response 201:
  success: true
  data:
    # New practice created from template
```

### 3.7 Encouragements & Prompts

```yaml
# Get random encouragement
GET /api/v1/practices/helpers/encouragement
Authorization: Bearer <token>

Query Parameters:
  streak?: number
  dayNumber?: number
  timeSlot?: time_slot_t

Response 200:
  success: true
  data:
    content: string
    type: string

---

# Get tag prompts
GET /api/v1/practices/helpers/tag-prompts
Authorization: Bearer <token>

Query Parameters:
  tags: string (comma-separated tag IDs)

Response 200:
  success: true
  data:
    - tagId: string
      tagName: string
      prompt: string
```

---

## 4. Business Rules

### 4.1 Streak Calculation

```typescript
/**
 * 連續打卡計算邏輯
 */
interface StreakCalculation {
  // 基於 frequencyType 決定「連續」的定義
  calculateStreak(
    practice: Practice,
    checkins: Checkin[]
  ): {
    currentStreak: number;
    longestStreak: number;
    lastCheckinDate: Date | null;
  };
}

/**
 * Daily frequency: 每天至少打卡一次
 * Weekdays: 週一到週五每天至少打卡一次
 * Weekends: 週六日每天至少打卡一次
 * Custom: 基於自訂規則
 */

function calculateDailyStreak(checkins: Checkin[]): number {
  if (checkins.length === 0) return 0;

  // 按日期分組
  const checkinDates = new Set(
    checkins.map(c => c.checkedInAt.toISOString().split('T')[0])
  );

  const sortedDates = Array.from(checkinDates).sort().reverse();
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000)
    .toISOString()
    .split('T')[0];

  // 檢查今天或昨天是否有打卡
  if (!sortedDates.includes(today) && !sortedDates.includes(yesterday)) {
    return 0;
  }

  let streak = 0;
  let currentDate = sortedDates.includes(today) ? today : yesterday;

  for (const date of sortedDates) {
    if (date === currentDate) {
      streak++;
      // 移到前一天
      currentDate = new Date(new Date(currentDate).getTime() - 86400000)
        .toISOString()
        .split('T')[0];
    } else if (date < currentDate) {
      break;
    }
  }

  return streak;
}
```

### 4.2 Progress Calculation

```typescript
/**
 * 進度計算
 * progress = (totalCheckins / expectedCheckins) * 100
 */
function calculateProgress(practice: Practice): number {
  const { startDate, targetDays, totalCheckins, timeSlots } = practice;

  // 計算預期打卡數
  const daysElapsed = Math.min(
    Math.floor((Date.now() - startDate.getTime()) / 86400000) + 1,
    targetDays
  );

  const expectedCheckins = daysElapsed * timeSlots.length;

  if (expectedCheckins === 0) return 0;

  return Math.min(
    Math.round((totalCheckins / expectedCheckins) * 100),
    100
  );
}
```

### 4.3 Status Auto-Update

```typescript
/**
 * 狀態自動更新邏輯
 * 由 BullMQ 定時任務執行
 */
const statusTransitions = {
  // active -> completed: 達到目標天數
  checkCompletion: (practice: Practice) => {
    const daysElapsed = calculateDaysElapsed(practice);
    if (daysElapsed >= practice.targetDays) {
      return 'completed';
    }
    return null;
  },

  // active -> expired: 超過目標日期且未完成
  checkExpiration: (practice: Practice) => {
    if (practice.targetEndDate && new Date() > practice.targetEndDate) {
      if (practice.progressPercent < 100) {
        return 'expired';
      }
    }
    return null;
  },
};
```

### 4.4 Check-in Rules

| Rule | Description |
|------|-------------|
| Time slot | 每個時段每天只能打卡一次 |
| Time window | 打卡時間需在對應時段內 |
| Delete window | 打卡後 1 小時內可刪除 |
| Backdate | 不允許補打卡（未來可能開放） |

### 4.5 Encouragement Selection

```typescript
/**
 * 鼓勵句選擇邏輯
 */
function selectEncouragement(
  streak: number,
  dayNumber: number,
  timeSlot: time_slot_t
): string {
  // 優先順序：
  // 1. 特定天數鼓勵 (day 1, 7, 14, 21...)
  // 2. 連續里程碑鼓勵
  // 3. 時段特定鼓勵
  // 4. 一般隨機鼓勵

  const milestones = [1, 7, 14, 21, 30, 60, 90, 100];

  if (milestones.includes(dayNumber)) {
    return getEncouragementByDay(dayNumber);
  }

  if (milestones.includes(streak)) {
    return getEncouragementByStreak(streak);
  }

  return getRandomEncouragement(timeSlot);
}
```

---

## 5. Validation Schemas

### 5.1 Practice Schema

```typescript
const createPracticeSchema = z.object({
  title: z
    .string()
    .min(2, 'Title must be at least 2 characters')
    .max(100, 'Title must be at most 100 characters'),
  description: z
    .string()
    .max(500, 'Description must be at most 500 characters')
    .optional(),
  coverImageUrl: z.string().url('Invalid URL').optional(),
  frequencyType: z
    .enum(['daily', 'weekdays', 'weekends', 'custom'])
    .default('daily'),
  timeSlots: z
    .array(z.enum(['morning', 'afternoon', 'evening', 'night']))
    .min(1, 'At least one time slot required')
    .default(['morning']),
  targetDays: z
    .number()
    .int()
    .min(1, 'Minimum 1 day')
    .max(365, 'Maximum 365 days')
    .default(21),
  reminderTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)')
    .optional(),
  startDate: z.string().datetime().optional(),
  visibility: z.enum(['public', 'followers', 'private']).default('public'),
  templateId: z.string().uuid().optional(),
  tags: z.array(z.string()).max(5, 'Maximum 5 tags').optional(),
});
```

### 5.2 Check-in Schema

```typescript
const createCheckinSchema = z.object({
  timeSlot: z.enum(['morning', 'afternoon', 'evening', 'night']),
  mood: z.enum(['great', 'good', 'okay', 'tired', 'struggling']).optional(),
  note: z
    .string()
    .max(300, 'Note must be at most 300 characters')
    .optional(),
  images: z
    .array(z.string().url('Invalid URL'))
    .max(3, 'Maximum 3 images')
    .optional(),
});
```

---

## 6. Background Jobs

### 6.1 Status Update Job

```typescript
// 每小時執行一次
const practiceStatusWorker = new Worker('practice-status', async (job) => {
  const { type } = job.data;

  switch (type) {
    case 'check-completion':
      await checkAndUpdateCompletedPractices();
      break;
    case 'check-expiration':
      await checkAndUpdateExpiredPractices();
      break;
    case 'update-streaks':
      await updateAllStreaks();
      break;
  }
});
```

### 6.2 Reminder Email Job

```typescript
// 根據用戶設定的提醒時間發送
const practiceEmailWorker = new Worker('practice-email', async (job) => {
  const { practiceId, userId, type } = job.data;

  switch (type) {
    case 'daily-reminder':
      await sendDailyReminder(practiceId, userId);
      break;
    case 'streak-warning':
      await sendStreakWarning(practiceId, userId);
      break;
    case 'milestone-celebration':
      await sendMilestoneCelebration(practiceId, userId);
      break;
  }
});
```

---

## 7. Implementation Files

### 7.1 Controllers
- `src/controllers/practice.controller.ts`

### 7.2 Services
- `src/services/practice.service.ts`
- `src/services/practice-checkin.service.ts`
- `src/services/practice-interaction.service.ts`
- `src/services/practice-template.service.ts`
- `src/services/encouragement.service.ts`
- `src/services/tag-prompt.service.ts`

### 7.3 Routes
- `src/routes/practice.routes.ts`

### 7.4 Validators
- `src/validators/practice.validators.ts`

### 7.5 Types
- `src/types/practice.types.ts`

### 7.6 Queues
- `src/queues/practice-status.queue.ts`
- `src/queues/practice-status.worker.ts`
- `src/queues/practice-email.queue.ts`
- `src/queues/practice-email.worker.ts`

### 7.7 Utils
- `src/utils/practice-progress.ts`
- `src/utils/practice-status.ts`

---

## 8. Error Handling

### 8.1 Error Codes

```typescript
const PRACTICE_ERRORS = {
  PRACTICE_NOT_FOUND: {
    code: 'PRACTICE_NOT_FOUND',
    message: 'Practice not found',
    status: 404,
  },
  ALREADY_CHECKED_IN: {
    code: 'ALREADY_CHECKED_IN',
    message: 'Already checked in for this time slot today',
    status: 409,
  },
  INVALID_TIME_SLOT: {
    code: 'INVALID_TIME_SLOT',
    message: 'Check-in time does not match the time slot',
    status: 400,
  },
  PRACTICE_NOT_ACTIVE: {
    code: 'PRACTICE_NOT_ACTIVE',
    message: 'Cannot check in to an inactive practice',
    status: 400,
  },
  CHECKIN_DELETE_FORBIDDEN: {
    code: 'CHECKIN_DELETE_FORBIDDEN',
    message: 'Check-ins can only be deleted within 1 hour',
    status: 403,
  },
  TEMPLATE_NOT_FOUND: {
    code: 'TEMPLATE_NOT_FOUND',
    message: 'Practice template not found',
    status: 404,
  },
} as const;
```

---

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0.0 | 2026-02-05 | System | Initial specification |
