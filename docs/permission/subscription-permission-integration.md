# 訂閱制權限整合架構設計

## 現有訂閱制分析

### 資料庫結構
基於 Prisma schema 分析，目前系統已有：

```sql
-- 訂閱方案表
subscription_plan {
  id: 主鍵
  name: 方案名稱
  description: 方案描述
  features: JSON 功能清單
  price: 價格
}

-- 使用者訂閱表
user_subscription {
  user_id: 使用者 ID
  plan_id: 訂閱方案 ID
  status: active | inactive | canceled
  start_date: 開始日期
  end_date: 結束日期
}

-- 費用計畫表 (專案相關)
fee_plans {
  fee_plan_type: 費用類型
}
```

## 訂閱制權限整合架構

### 1. 混合權限模型
```
用戶權限 = 角色權限 ∩ 訂閱權限 ∩ 資源擁有權
```

### 2. 訂閱方案定義
```typescript
interface SubscriptionPlan {
  id: number;
  name: string;
  tier: 'free' | 'basic' | 'premium' | 'enterprise';
  features: SubscriptionFeatures;
  limits: SubscriptionLimits;
  permissions: string[]; // 額外的權限
}

interface SubscriptionFeatures {
  // 功能開關
  advancedAnalytics: boolean;
  prioritySupport: boolean;
  customBranding: boolean;
  apiAccess: boolean;
  exportData: boolean;
  collaborators: boolean;
  privateProjects: boolean;
  mentorAccess: boolean;
}

interface SubscriptionLimits {
  // 數量限制
  maxProjects: number;
  maxResources: number;
  maxIdeas: number;
  maxNotes: number;
  maxCollaborators: number;
  maxStorageSize: number; // MB
  maxApiCalls: number; // per day
}
```

### 3. 訂閱等級權限矩陣

| 功能分類 | Free | Basic | Premium | Enterprise |
|----------|------|-------|---------|------------|
| **專案管理** |
| 建立專案 | 3個 | 10個 | 無限制 | 無限制 |
| 私人專案 | ❌ | ✅ | ✅ | ✅ |
| 專案協作 | ❌ | 3人 | 10人 | 無限制 |
| **資源功能** |
| 建立資源 | 5個/月 | 20個/月 | 100個/月 | 無限制 |
| 進階篩選 | ❌ | ✅ | ✅ | ✅ |
| 匯出資料 | ❌ | ❌ | ✅ | ✅ |
| **想法管理** |
| 建立想法 | 10個 | 50個 | 無限制 | 無限制 |
| 想法分析 | ❌ | ❌ | ✅ | ✅ |
| **導師功能** |
| 尋找導師 | ✅ | ✅ | ✅ | ✅ |
| 成為導師 | ❌ | ✅ | ✅ | ✅ |
| 優先配對 | ❌ | ❌ | ✅ | ✅ |
| **系統功能** |
| API 存取 | ❌ | ❌ | ✅ | ✅ |
| 客製品牌 | ❌ | ❌ | ❌ | ✅ |
| 優先支援 | ❌ | ❌ | ✅ | ✅ |

## 權限檢查流程

### 1. 多層權限驗證
```typescript
interface PermissionCheckResult {
  hasPermission: boolean;
  reason: 'role' | 'subscription' | 'ownership' | 'limit' | 'denied';
  details?: {
    subscriptionRequired?: string;
    limitExceeded?: {
      current: number;
      limit: number;
      feature: string;
    };
  };
}

async function checkPermission(
  userId: number,
  resource: string,
  action: string,
  resourceId?: number
): Promise<PermissionCheckResult> {
  // 1. 角色權限檢查
  const rolePermission = await checkRolePermission(userId, resource, action);
  if (!rolePermission) {
    return { hasPermission: false, reason: 'role' };
  }

  // 2. 訂閱權限檢查
  const subscriptionCheck = await checkSubscriptionPermission(userId, resource, action);
  if (!subscriptionCheck.hasPermission) {
    return subscriptionCheck;
  }

  // 3. 使用量限制檢查
  const limitCheck = await checkUsageLimits(userId, resource, action);
  if (!limitCheck.hasPermission) {
    return limitCheck;
  }

  // 4. 資源擁有權檢查（如果需要）
  if (resourceId && requiresOwnership(resource, action)) {
    const ownershipCheck = await checkResourceOwnership(userId, resource, resourceId);
    if (!ownershipCheck) {
      return { hasPermission: false, reason: 'ownership' };
    }
  }

  return { hasPermission: true, reason: 'role' };
}
```

### 2. 訂閱狀態驗證
```typescript
async function getUserSubscriptionStatus(userId: number): Promise<SubscriptionStatus> {
  const subscription = await prisma.user_subscription.findFirst({
    where: {
      user_id: userId,
      status: 'active',
      start_date: { lte: new Date() },
      end_date: { gte: new Date() }
    },
    include: {
      subscription_plan: true
    }
  });

  if (!subscription) {
    return { tier: 'free', plan: null, features: getFreeFeatures() };
  }

  return {
    tier: subscription.subscription_plan?.name || 'free',
    plan: subscription.subscription_plan,
    features: subscription.subscription_plan?.features as SubscriptionFeatures,
    limits: getSubscriptionLimits(subscription.subscription_plan?.name)
  };
}
```

### 3. 使用量追蹤
```typescript
interface UsageTracker {
  checkLimit(userId: number, feature: string): Promise<boolean>;
  incrementUsage(userId: number, feature: string): Promise<void>;
  getCurrentUsage(userId: number, feature: string): Promise<number>;
  resetMonthlyUsage(userId: number): Promise<void>;
}

// 實作使用量追蹤
class RedisUsageTracker implements UsageTracker {
  async checkLimit(userId: number, feature: string): Promise<boolean> {
    const userSubscription = await getUserSubscriptionStatus(userId);
    const limit = userSubscription.limits[feature];

    if (limit === -1) return true; // 無限制

    const current = await this.getCurrentUsage(userId, feature);
    return current < limit;
  }

  async incrementUsage(userId: number, feature: string): Promise<void> {
    const key = `usage:${userId}:${feature}:${getCurrentMonth()}`;
    await redis.incr(key);
    await redis.expire(key, getSecondsUntilEndOfMonth());
  }
}
```

## 訂閱制權限中介軟體

### 1. 訂閱檢查中介軟體
```typescript
export const requireSubscription = (
  requiredTier: SubscriptionTier,
  feature?: string
): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user as UserJwtPayload;
      if (!user) {
        throw new UnauthorizedError('請先登入');
      }

      const subscription = await getUserSubscriptionStatus(user.id);

      // 檢查訂閱等級
      if (!hasRequiredTier(subscription.tier, requiredTier)) {
        throw new SubscriptionRequiredError(`需要 ${requiredTier} 訂閱方案`);
      }

      // 檢查特定功能
      if (feature && !subscription.features[feature]) {
        throw new FeatureNotAvailableError(`功能 ${feature} 在您的方案中不可用`);
      }

      req.subscription = subscription;
      next();
    } catch (error) {
      next(error);
    }
  };
};
```

### 2. 使用量限制中介軟體
```typescript
export const checkUsageLimit = (
  feature: string,
  increment = true
): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user as UserJwtPayload;
      if (!user) {
        throw new UnauthorizedError('請先登入');
      }

      const canUse = await usageTracker.checkLimit(user.id, feature);
      if (!canUse) {
        const current = await usageTracker.getCurrentUsage(user.id, feature);
        const subscription = await getUserSubscriptionStatus(user.id);
        const limit = subscription.limits[feature];

        throw new UsageLimitExceededError(
          `已達到 ${feature} 使用限制`,
          { current, limit, feature }
        );
      }

      if (increment) {
        // 在成功回應後增加使用量
        res.on('finish', () => {
          if (res.statusCode < 400) {
            usageTracker.incrementUsage(user.id, feature).catch(console.error);
          }
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
```

## 訂閱制權限常數定義

### 1. 訂閱等級常數
```typescript
export const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  BASIC: 'basic',
  PREMIUM: 'premium',
  ENTERPRISE: 'enterprise'
} as const;

export const TIER_HIERARCHY = {
  [SUBSCRIPTION_TIERS.FREE]: 0,
  [SUBSCRIPTION_TIERS.BASIC]: 1,
  [SUBSCRIPTION_TIERS.PREMIUM]: 2,
  [SUBSCRIPTION_TIERS.ENTERPRISE]: 3
} as const;
```

### 2. 功能權限定義
```typescript
export const SUBSCRIPTION_FEATURES = {
  // 專案功能
  PRIVATE_PROJECTS: 'privateProjects',
  PROJECT_COLLABORATION: 'projectCollaboration',
  ADVANCED_PROJECT_ANALYTICS: 'advancedProjectAnalytics',

  // 資源功能
  UNLIMITED_RESOURCES: 'unlimitedResources',
  RESOURCE_EXPORT: 'resourceExport',
  ADVANCED_SEARCH: 'advancedSearch',

  // 想法功能
  UNLIMITED_IDEAS: 'unlimitedIdeas',
  IDEA_ANALYTICS: 'ideaAnalytics',
  IDEA_COLLABORATION: 'ideaCollaboration',

  // 導師功能
  BECOME_MENTOR: 'becomeMentor',
  PRIORITY_MATCHING: 'priorityMatching',
  MENTOR_ANALYTICS: 'mentorAnalytics',

  // 系統功能
  API_ACCESS: 'apiAccess',
  CUSTOM_BRANDING: 'customBranding',
  PRIORITY_SUPPORT: 'prioritySupport',
  EXPORT_DATA: 'exportData'
} as const;
```

### 3. 使用量限制常數
```typescript
export const USAGE_LIMITS = {
  [SUBSCRIPTION_TIERS.FREE]: {
    maxProjects: 3,
    maxResources: 5, // per month
    maxIdeas: 10,
    maxNotes: 20,
    maxCollaborators: 0,
    maxStorageSize: 100, // MB
    maxApiCalls: 0
  },
  [SUBSCRIPTION_TIERS.BASIC]: {
    maxProjects: 10,
    maxResources: 20, // per month
    maxIdeas: 50,
    maxNotes: 100,
    maxCollaborators: 3,
    maxStorageSize: 1000, // MB
    maxApiCalls: 100
  },
  [SUBSCRIPTION_TIERS.PREMIUM]: {
    maxProjects: -1, // unlimited
    maxResources: 100, // per month
    maxIdeas: -1,
    maxNotes: -1,
    maxCollaborators: 10,
    maxStorageSize: 10000, // MB
    maxApiCalls: 1000
  },
  [SUBSCRIPTION_TIERS.ENTERPRISE]: {
    maxProjects: -1,
    maxResources: -1,
    maxIdeas: -1,
    maxNotes: -1,
    maxCollaborators: -1,
    maxStorageSize: -1,
    maxApiCalls: -1
  }
} as const;
```

## 整合到現有權限系統

### 1. 擴展權限檢查
```typescript
// 在 permission.middleware.ts 中新增
export const requireSubscriptionPermission = (
  permissions: SubscriptionPermissionOptions | SubscriptionPermissionOptions[],
  options: SubscriptionMiddlewareOptions = {}
): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // 先檢查基本權限
      await requirePermission(permissions.basePermissions, options)(req, res, () => {});

      // 再檢查訂閱權限
      await requireSubscription(permissions.requiredTier, permissions.feature)(req, res, () => {});

      // 檢查使用量限制
      if (permissions.usageFeature) {
        await checkUsageLimit(permissions.usageFeature)(req, res, () => {});
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
```

### 2. 錯誤處理
```typescript
export class SubscriptionRequiredError extends Error {
  constructor(message: string, public requiredTier: string) {
    super(message);
    this.name = 'SubscriptionRequiredError';
  }
}

export class UsageLimitExceededError extends Error {
  constructor(
    message: string,
    public details: { current: number; limit: number; feature: string }
  ) {
    super(message);
    this.name = 'UsageLimitExceededError';
  }
}

export class FeatureNotAvailableError extends Error {
  constructor(message: string, public feature: string) {
    super(message);
    this.name = 'FeatureNotAvailableError';
  }
}
```

這個整合架構提供了：
1. **彈性的訂閱制權限控制**
2. **精確的使用量追蹤**
3. **清晰的錯誤訊息**
4. **向後相容性**
5. **易於擴展的功能框架**