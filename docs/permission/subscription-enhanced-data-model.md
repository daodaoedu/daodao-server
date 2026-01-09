# 整合訂閱制的權限資料模型

## 現有結構分析

### 現有訂閱制表格
基於 Prisma schema，系統已有基礎訂閱結構：

```sql
-- 現有訂閱方案表
subscription_plan {
  id: Int
  name: String
  description: String?
  features: Json?
  price: Decimal?
  created_at: DateTime?
}

-- 現有使用者訂閱表
user_subscription {
  id: Int
  user_id: Int?
  plan_id: Int?
  status: subscription_status (active|inactive|canceled)
  start_date: Date
  end_date: Date
  created_at: DateTime?
}
```

## 增強的訂閱制權限資料模型

### 1. 新增訂閱功能表 (SubscriptionFeature)
記錄每個訂閱方案包含的功能

```prisma
model subscription_features {
  id                   Int                @id @default(autoincrement())
  plan_id             Int
  feature_code        String             @db.VarChar(100)
  feature_name        String             @db.VarChar(200)
  feature_description String?
  is_enabled          Boolean            @default(true)
  limit_value         Int?               // -1 表示無限制，null 表示不適用
  limit_period        String?            @db.VarChar(20) // 'daily', 'monthly', 'yearly', null
  created_at          DateTime?          @default(now()) @db.Timestamp(6)
  updated_at          DateTime?          @default(now()) @db.Timestamp(6)

  subscription_plan   subscription_plan  @relation(fields: [plan_id], references: [id], onDelete: Cascade)

  @@unique([plan_id, feature_code])
  @@index([feature_code])
}
```

### 2. 新增使用量追蹤表 (UsageTracking)
追蹤使用者的功能使用量

```prisma
model usage_tracking {
  id               Int       @id @default(autoincrement())
  user_id          Int
  feature_code     String    @db.VarChar(100)
  usage_count      Int       @default(0)
  period_start     DateTime  @db.Date
  period_end       DateTime  @db.Date
  last_reset_at    DateTime? @db.Timestamp(6)
  created_at       DateTime? @default(now()) @db.Timestamp(6)
  updated_at       DateTime? @default(now()) @db.Timestamp(6)

  users            users     @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@unique([user_id, feature_code, period_start])
  @@index([user_id, feature_code])
  @@index([period_start, period_end])
}
```

### 3. 新增訂閱權限映射表 (SubscriptionPermissionMapping)
將訂閱方案與系統權限關聯

```prisma
model subscription_permission_mapping {
  id            Int               @id @default(autoincrement())
  plan_id       Int
  permission_id String            @db.VarChar(100) // 對應 PERMISSIONS 常數
  is_granted    Boolean           @default(true)
  created_at    DateTime?         @default(now()) @db.Timestamp(6)

  subscription_plan subscription_plan @relation(fields: [plan_id], references: [id], onDelete: Cascade)

  @@unique([plan_id, permission_id])
  @@index([permission_id])
}
```

### 4. 新增訂閱使用記錄表 (SubscriptionUsageLog)
詳細記錄訂閱相關的使用事件

```prisma
model subscription_usage_log {
  id           Int       @id @default(autoincrement())
  user_id      Int
  feature_code String    @db.VarChar(100)
  action_type  String    @db.VarChar(50) // 'usage', 'limit_check', 'exceeded'
  resource_id  Int?      // 相關資源ID
  resource_type String?  @db.VarChar(50) // 'project', 'resource', 'idea' etc.
  metadata     Json?     // 額外的事件資料
  created_at   DateTime? @default(now()) @db.Timestamp(6)

  users        users     @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@index([user_id, created_at])
  @@index([feature_code, created_at])
}
```

### 5. 更新現有 subscription_plan 表
增加訂閱方案的層級和類型資訊

```prisma
-- 現有表格的增強（Migration）
model subscription_plan {
  id                              Int                              @id @default(autoincrement())
  name                           String                           @db.VarChar(100)
  description                    String?
  features                       Json?                            // 保留向後相容
  price                          Decimal?                         @db.Decimal(10, 2)

  -- 新增欄位
  tier                           subscription_tier                @default(free)
  is_active                      Boolean                          @default(true)
  max_users                      Int?                             // 企業方案的使用者限制
  billing_period                 billing_period_type             @default(monthly)
  trial_days                     Int?                             @default(0)
  sort_order                     Int                              @default(0)

  created_at                     DateTime?                        @default(now()) @db.Timestamp(6)
  updated_at                     DateTime?                        @default(now()) @db.Timestamp(6)

  -- 關聯
  user_subscription              user_subscription[]
  subscription_features          subscription_features[]
  subscription_permission_mapping subscription_permission_mapping[]

  @@index([tier, is_active])
  @@index([sort_order])
}

-- 新增 enum
enum subscription_tier {
  free
  basic
  premium
  enterprise
}

enum billing_period_type {
  daily
  monthly
  yearly
}
```

### 6. 更新使用者表關聯
在 users 表中新增訂閱相關關聯

```prisma
model users {
  -- 現有欄位...

  -- 新增關聯
  usage_tracking              usage_tracking[]
  subscription_usage_log      subscription_usage_log[]

  -- 現有關聯保持不變
  user_subscription           user_subscription[]
}
```

## 預定義功能代碼

### 1. 專案相關功能
```typescript
export const PROJECT_FEATURES = {
  CREATE_PROJECT: 'project:create',
  PRIVATE_PROJECT: 'project:private',
  PROJECT_COLLABORATION: 'project:collaboration',
  PROJECT_ANALYTICS: 'project:analytics',
  PROJECT_EXPORT: 'project:export'
} as const;
```

### 2. 資源相關功能
```typescript
export const RESOURCE_FEATURES = {
  CREATE_RESOURCE: 'resource:create',
  ADVANCED_SEARCH: 'resource:advanced_search',
  BULK_OPERATIONS: 'resource:bulk_operations',
  RESOURCE_EXPORT: 'resource:export',
  RESOURCE_ANALYTICS: 'resource:analytics'
} as const;
```

### 3. 想法相關功能
```typescript
export const IDEA_FEATURES = {
  CREATE_IDEA: 'idea:create',
  IDEA_ANALYTICS: 'idea:analytics',
  IDEA_COLLABORATION: 'idea:collaboration',
  IDEA_EXPORT: 'idea:export'
} as const;
```

### 4. 系統功能
```typescript
export const SYSTEM_FEATURES = {
  API_ACCESS: 'system:api_access',
  PRIORITY_SUPPORT: 'system:priority_support',
  CUSTOM_BRANDING: 'system:custom_branding',
  ADVANCED_ANALYTICS: 'system:advanced_analytics',
  DATA_EXPORT: 'system:data_export',
  STORAGE_QUOTA: 'system:storage_quota'
} as const;
```

## 預設訂閱方案配置

### 1. Free 方案
```sql
-- 方案基本資訊
INSERT INTO subscription_plan (name, tier, description, price, billing_period, is_active, sort_order)
VALUES ('免費方案', 'free', '基本功能使用', 0.00, 'monthly', true, 1);

-- 功能配置
INSERT INTO subscription_features (plan_id, feature_code, feature_name, limit_value, limit_period)
VALUES
  (1, 'project:create', '建立專案', 3, null),
  (1, 'resource:create', '建立資源', 5, 'monthly'),
  (1, 'idea:create', '建立想法', 10, null),
  (1, 'system:storage_quota', '儲存空間', 100, null); -- 100MB
```

### 2. Basic 方案
```sql
INSERT INTO subscription_plan (name, tier, description, price, billing_period, is_active, sort_order)
VALUES ('基礎方案', 'basic', '進階功能使用', 9.99, 'monthly', true, 2);

INSERT INTO subscription_features (plan_id, feature_code, feature_name, limit_value, limit_period)
VALUES
  (2, 'project:create', '建立專案', 10, null),
  (2, 'project:collaboration', '專案協作', 3, null), -- 3 collaborators
  (2, 'resource:create', '建立資源', 20, 'monthly'),
  (2, 'idea:create', '建立想法', 50, null),
  (2, 'system:storage_quota', '儲存空間', 1000, null); -- 1GB
```

### 3. Premium 方案
```sql
INSERT INTO subscription_plan (name, tier, description, price, billing_period, is_active, sort_order)
VALUES ('進階方案', 'premium', '專業功能使用', 19.99, 'monthly', true, 3);

INSERT INTO subscription_features (plan_id, feature_code, feature_name, limit_value, limit_period)
VALUES
  (3, 'project:create', '建立專案', -1, null), -- unlimited
  (3, 'project:collaboration', '專案協作', 10, null),
  (3, 'project:analytics', '專案分析', -1, null),
  (3, 'resource:create', '建立資源', 100, 'monthly'),
  (3, 'resource:advanced_search', '進階搜尋', -1, null),
  (3, 'idea:create', '建立想法', -1, null),
  (3, 'idea:analytics', '想法分析', -1, null),
  (3, 'system:api_access', 'API 存取', 1000, 'daily'),
  (3, 'system:storage_quota', '儲存空間', 10000, null); -- 10GB
```

### 4. Enterprise 方案
```sql
INSERT INTO subscription_plan (name, tier, description, price, billing_period, is_active, sort_order)
VALUES ('企業方案', 'enterprise', '完整功能使用', 49.99, 'monthly', true, 4);

INSERT INTO subscription_features (plan_id, feature_code, feature_name, limit_value, limit_period)
VALUES
  (4, 'project:create', '建立專案', -1, null),
  (4, 'project:collaboration', '專案協作', -1, null),
  (4, 'project:analytics', '專案分析', -1, null),
  (4, 'resource:create', '建立資源', -1, null),
  (4, 'resource:advanced_search', '進階搜尋', -1, null),
  (4, 'resource:export', '資源匯出', -1, null),
  (4, 'idea:create', '建立想法', -1, null),
  (4, 'idea:analytics', '想法分析', -1, null),
  (4, 'system:api_access', 'API 存取', -1, null),
  (4, 'system:custom_branding', '客製品牌', -1, null),
  (4, 'system:priority_support', '優先支援', -1, null),
  (4, 'system:storage_quota', '儲存空間', -1, null);
```

## 資料驗證規則

### 1. subscription_features 驗證
- `feature_code`: 必填，符合預定義功能代碼格式
- `limit_value`: -1 (無限制), null (不適用), 或正整數
- `limit_period`: 必須是 'daily', 'monthly', 'yearly' 之一或 null

### 2. usage_tracking 驗證
- `usage_count`: 非負整數
- `period_start <= period_end`: 時間範圍驗證
- 使用量不可超過對應訂閱方案的限制

### 3. subscription_plan 驗證
- `tier`: 必須符合預定義訂閱等級
- `price`: 非負數值
- `trial_days`: 非負整數

## 索引最佳化

### 1. 效能索引
- `subscription_features`: (plan_id, feature_code), (feature_code)
- `usage_tracking`: (user_id, feature_code), (period_start, period_end)
- `subscription_usage_log`: (user_id, created_at), (feature_code, created_at)

### 2. 複合索引
- `usage_tracking`: (user_id, feature_code, period_start) - 唯一性約束
- `subscription_features`: (plan_id, feature_code) - 唯一性約束

## 快取策略

### 1. 訂閱快取鍵
- 使用者訂閱狀態: `subscription:user:{userId}`
- 方案功能: `subscription:plan:{planId}:features`
- 使用量統計: `usage:user:{userId}:{featureCode}:{period}`

### 2. 快取更新策略
- 訂閱狀態變更時清除使用者相關快取
- 方案功能更新時清除方案快取
- 每日/每月自動重置使用量快取