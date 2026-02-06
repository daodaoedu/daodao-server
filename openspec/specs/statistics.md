# User Statistics Module Specification

## 1. Overview

### 1.1 Purpose
用戶統計模組提供管理員後台的數據分析功能，包括用戶註冊趨勢、活躍度分析、裝置分析、留存率追蹤等，協助管理者了解平台使用狀況並做出數據驅動的決策。

### 1.2 Scope
- 總覽儀表板（Overview Dashboard）
- 註冊統計（多維度分組）
- 活躍度統計
- DAU/WAU/MAU 分析
- 裝置與瀏覽器分析
- 用戶留存率（Cohort Analysis）
- 熱門用戶檔案排行
- 用戶活躍度分類（Segmentation）
- 數據匯出（CSV/Excel）

---

## 2. Architecture

### 2.1 Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                   User Statistics Module                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────┐    ┌────────────────────┐               │
│  │  User Stats Routes │───▶│ User Stats         │               │
│  │  (9 endpoints)     │    │ Controller         │               │
│  └────────────────────┘    └─────────┬──────────┘               │
│                                      │                           │
│                                      ▼                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                 User Stats Service                        │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐ │   │
│  │  │  Overview   │ │ Registration│ │  Activity Analysis  │ │   │
│  │  │  Stats      │ │  Stats      │ │  & Segmentation     │ │   │
│  │  └─────────────┘ └─────────────┘ └─────────────────────┘ │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐ │   │
│  │  │  Device     │ │  Retention  │ │  Export Utils       │ │   │
│  │  │  Analytics  │ │  Analysis   │ │  (CSV/Excel)        │ │   │
│  │  └─────────────┘ └─────────────┘ └─────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                     PostgreSQL                            │   │
│  │  ┌────────────┐ ┌──────────────────┐ ┌────────────────┐  │   │
│  │  │   users    │ │ user_login_      │ │ user_activity_ │  │   │
│  │  │            │ │ history          │ │ stats          │  │   │
│  │  └────────────┘ └──────────────────┘ └────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. API Endpoints

### 3.1 Get Overview Dashboard

```yaml
GET /api/v1/admin/user-stats/overview
Authorization: Bearer <accessToken>
# Requires Admin role

Response 200:
  success: true
  data:
    totalUsers: number          # 總使用者數
    newUsersThisMonth: number   # 本月新增使用者數
    newUsersLastMonth: number   # 上月新增使用者數
    growthRate: number          # 增長率（百分比）
    activeUsers: number         # 活躍使用者數（最近30天）
    activeRate: number          # 活躍率（百分比）
  metadata:
    generated_at: string (ISO 8601)
```

### 3.2 Get Registration Statistics

```yaml
GET /api/v1/admin/user-stats/registrations
Authorization: Bearer <accessToken>
# Requires Admin role

Query Parameters:
  groupBy: string (required)
    # enum: day, week, month, year, location, role, education_stage
  startDate: string (optional, YYYY-MM-DD)
  endDate: string (optional, YYYY-MM-DD)
  locationId: string (optional)
  roleId: string (optional)
  educationStage: string (optional)
  limit: number (optional, default: 100, max: 1000)
  offset: number (optional, default: 0)

Response 200 (groupBy: day/week/month/year):
  success: true
  data:
    - date: string
      count: number
      label: string
  metadata:
    groupBy: string
    startDate: string
    endDate: string
    generated_at: string

Response 200 (groupBy: location):
  success: true
  data:
    - country: string
      city: string
      isTaiwan: boolean
      userCount: number
  metadata: {...}

Response 200 (groupBy: role):
  success: true
  data:
    - roleId: number
      roleName: string
      userCount: number
  metadata: {...}

Response 200 (groupBy: education_stage):
  success: true
  data:
    - educationStage: string
      userCount: number
  metadata: {...}
```

### 3.3 Get Activity Statistics

```yaml
GET /api/v1/admin/user-stats/activity
Authorization: Bearer <accessToken>
# Requires Admin role

Query Parameters:
  activeWithinDays: number (optional, default: 30, max: 365)
  groupBy: string (optional, enum: role, location, education_stage)
  limit: number (optional, default: 100, max: 1000)
  offset: number (optional, default: 0)

Response 200:
  success: true
  data:
    activeUsers: number        # 活躍使用者數
    inactiveUsers: number      # 非活躍使用者數
    totalUsers: number         # 總使用者數
    activeRate: number         # 活躍率（百分比）
    breakdown: array (optional) # 細分統計（若有 groupBy）
  metadata:
    activeWithinDays: number
    generated_at: string
```

### 3.4 Get DAU/WAU/MAU Statistics

```yaml
GET /api/v1/admin/user-stats/active-users
Authorization: Bearer <accessToken>
# Requires Admin role

Response 200:
  success: true
  data:
    dau: number               # 日活躍用戶數
    wau: number               # 週活躍用戶數
    mau: number               # 月活躍用戶數
    dauRate: number           # DAU 佔總用戶比例（百分比）
    wauRate: number           # WAU 佔總用戶比例（百分比）
    mauRate: number           # MAU 佔總用戶比例（百分比）
    totalUsers: number        # 總用戶數
    trend:
      dauTrend: number        # DAU 較昨日變化（百分比）
      wauTrend: number        # WAU 較上週變化（百分比）
      mauTrend: number        # MAU 較上月變化（百分比）
  metadata:
    generated_at: string
```

### 3.5 Get Device Analytics

```yaml
GET /api/v1/admin/user-stats/device-analytics
Authorization: Bearer <accessToken>
# Requires Admin role

Query Parameters:
  startDate: string (optional, YYYY-MM-DD)
  endDate: string (optional, YYYY-MM-DD)
  days: number (optional, default: 30, max: 365)
    # 若未提供日期範圍，預設使用最近 N 天

Response 200:
  success: true
  data:
    devices:
      - deviceType: string | null
        count: number
        percentage: number
    browsers:
      - browser: string | null
        count: number
        percentage: number
    operatingSystems:
      - os: string | null
        count: number
        percentage: number
    totalLogins: number
    dateRange:
      startDate: string
      endDate: string
  metadata:
    generated_at: string
```

### 3.6 Get Retention Statistics

```yaml
GET /api/v1/admin/user-stats/retention
Authorization: Bearer <accessToken>
# Requires Admin role

Query Parameters:
  cohorts: number (optional, default: 7, max: 30)
    # 分析的群組數量（最近 N 個群組）
  trackDays: number (optional, default: 30, max: 90)
    # 追蹤天數
  granularity: string (optional, default: day, enum: day, week)
    # 群組粒度

Response 200:
  success: true
  data:
    cohorts:
      - cohortDate: string
        cohortSize: number
        retentionByDay:
          - day: number
            retainedUsers: number
            retentionRate: number
    averageRetention:
      day1: number
      day7: number
      day14: number
      day30: number
  metadata:
    generated_at: string
```

### 3.7 Get Popular Profiles

```yaml
GET /api/v1/admin/user-stats/popular-profiles
Authorization: Bearer <accessToken>
# Requires Admin role

Query Parameters:
  limit: number (optional, default: 10, max: 100)
  offset: number (optional, default: 0)
  minViews: number (optional, default: 1)
    # 最低查看次數

Response 200:
  success: true
  data:
    profiles:
      - userId: number
        externalId: string
        nickname: string | null
        photoUrl: string | null
        profileViews: number
        lastActiveAt: string | null
    totalCount: number
  metadata:
    generated_at: string
```

### 3.8 Get User Activity Segmentation

```yaml
GET /api/v1/admin/user-stats/segmentation
Authorization: Bearer <accessToken>
# Requires Admin role

Response 200:
  success: true
  data:
    segments:
      - label: string
          # enum: highly_active, active, moderate, inactive, dormant
        displayName: string
        description: string
        userCount: number
        percentage: number
        criteria: string
    totalUsers: number
    lastUpdated: string
  metadata:
    generated_at: string
```

### 3.9 Export Statistics

```yaml
GET /api/v1/admin/user-stats/export
Authorization: Bearer <accessToken>
# Requires Admin role

Query Parameters:
  format: string (required, enum: csv, excel)
  type: string (required, enum: registrations, activity, full)
  startDate: string (optional, YYYY-MM-DD)
  endDate: string (optional, YYYY-MM-DD)
  groupBy: string (optional)
    # type=registrations 時必選
    # enum: day, week, month, year, location, role, education_stage

Response 200:
  Content-Type: text/csv | application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
  Content-Disposition: attachment; filename="user-{type}-{timestamp}.{csv|xlsx}"

  # 檔案內容根據 type 不同而異
```

---

## 4. Data Models

### 4.1 User Login History (Prisma)

```prisma
model user_login_history {
  id          Int       @id @default(autoincrement())
  user_id     Int
  ip_address  String?
  user_agent  String?
  device_type String?   // mobile, desktop, tablet
  browser     String?
  os          String?   // operating system
  login_at    DateTime  @default(now())

  user        users     @relation(fields: [user_id], references: [id])

  @@index([user_id, login_at])
}
```

### 4.2 User Activity Stats (Prisma)

```prisma
model user_activity_stats {
  id                Int       @id @default(autoincrement())
  user_id           Int       @unique
  last_login_at     DateTime?
  login_count       Int       @default(0)
  profile_views     Int       @default(0)
  last_active_at    DateTime?
  created_at        DateTime  @default(now())
  updated_at        DateTime  @updatedAt

  user              users     @relation(fields: [user_id], references: [id])
}
```

---

## 5. Validation Schemas

### 5.1 Registration Stats Query Schema

```typescript
const registrationStatsQuerySchema = z.object({
  groupBy: z.enum([
    'day', 'week', 'month', 'year',
    'location', 'role', 'education_stage'
  ]),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  locationId: z.string().optional(),
  roleId: z.string().optional(),
  educationStage: z.string().optional(),
  limit: z.coerce.number().min(1).max(1000).optional().default(100),
  offset: z.coerce.number().min(0).optional().default(0),
});
```

### 5.2 Export Stats Query Schema

```typescript
const exportStatsQuerySchema = z.object({
  format: z.enum(['csv', 'excel']),
  type: z.enum(['registrations', 'activity', 'full']),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  groupBy: z.enum([
    'day', 'week', 'month', 'year',
    'location', 'role', 'education_stage'
  ]).optional(),
}).refine(
  (data) => data.type !== 'registrations' || data.groupBy !== undefined,
  { message: 'groupBy is required when type is registrations' }
);
```

### 5.3 Retention Query Schema

```typescript
const retentionQuerySchema = z.object({
  cohorts: z.coerce.number().min(1).max(30).optional().default(7),
  trackDays: z.coerce.number().min(1).max(90).optional().default(30),
  granularity: z.enum(['day', 'week']).optional().default('day'),
});
```

---

## 6. User Segmentation Criteria

### 6.1 Segment Definitions

| Segment | Label | Criteria | Description |
|---------|-------|----------|-------------|
| 高度活躍 | `highly_active` | 7 天內登入 3+ 次 | 核心用戶，經常使用平台 |
| 活躍 | `active` | 7 天內登入 1-2 次 | 穩定用戶，定期使用平台 |
| 中度活躍 | `moderate` | 14 天內登入過 | 偶爾使用的用戶 |
| 不活躍 | `inactive` | 30 天內登入過 | 需要喚醒的用戶 |
| 休眠 | `dormant` | 超過 30 天未登入 | 流失風險用戶 |

---

## 7. Business Rules

### 7.1 Access Control
- 所有端點僅限 Admin 角色存取
- 需要 JWT 認證

### 7.2 Data Refresh
- 統計數據實時計算
- 匯出檔案為暫存檔案，下載完成後自動清除

### 7.3 Performance Considerations
- 分頁限制：最大 1000 筆/頁
- 留存分析：最多追蹤 90 天
- 群組分析：最多 30 個群組

---

## 8. Error Handling

### 8.1 Error Codes

```typescript
const STATS_ERRORS = {
  STATS_INVALID_DATE_RANGE: {
    code: 'STATS_INVALID_DATE_RANGE',
    message: '無效的日期範圍',
    status: 400,
  },
  STATS_EXPORT_FAILED: {
    code: 'STATS_EXPORT_FAILED',
    message: '檔案匯出失敗',
    status: 500,
  },
  STATS_INVALID_GROUP_BY: {
    code: 'STATS_INVALID_GROUP_BY',
    message: '無效的分組方式',
    status: 400,
  },
} as const;
```

---

## 9. Implementation Files

### 9.1 Controllers
- `src/controllers/user-stats-controller.ts`

### 9.2 Services
- `src/services/user-stats-service.ts`

### 9.3 Routes
- `src/routes/user-stats-routes.ts`

### 9.4 Validators
- `src/validators/user-stats.validator.ts`

### 9.5 Types
- `src/types/user-stats.types.ts`

### 9.6 Utilities
- `src/utils/export-utils.ts` - CSV/Excel 匯出工具

---

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0.0 | 2026-02-06 | System | Initial specification |
