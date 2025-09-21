# 訂閱制權限規則手冊

## 概述

本文件定義道道平台訂閱制權限的具體規則和限制，確保不同訂閱等級的使用者獲得對應的功能存取權限。

## 訂閱方案功能矩陣

### 一、專案管理功能

| 功能 | Free | Basic | Premium | Enterprise |
|------|------|-------|---------|------------|
| **建立專案** | 3個 | 10個 | 無限制 | 無限制 |
| **私人專案** | ❌ | ✅ | ✅ | ✅ |
| **專案協作** | ❌ | 3人 | 10人 | 無限制 |
| **專案分析** | ❌ | ❌ | ✅ | ✅ |
| **專案範本** | ❌ | ✅ | ✅ | ✅ |
| **專案匯出** | ❌ | ❌ | ✅ | ✅ |
| **專案備份** | ❌ | ❌ | ✅ | ✅ |

**權限代碼映射:**
```typescript
- project:create -> 建立專案限制
- project:private -> 私人專案功能
- project:collaboration -> 協作人數限制
- project:analytics -> 專案分析功能
- project:template -> 專案範本功能
- project:export -> 專案匯出功能
- project:backup -> 專案備份功能
```

### 二、資源管理功能

| 功能 | Free | Basic | Premium | Enterprise |
|------|------|-------|---------|------------|
| **建立資源** | 5個/月 | 20個/月 | 100個/月 | 無限制 |
| **進階搜尋** | ❌ | ✅ | ✅ | ✅ |
| **批量操作** | ❌ | ❌ | ✅ | ✅ |
| **資源分析** | ❌ | ❌ | ✅ | ✅ |
| **資源匯出** | ❌ | ❌ | ✅ | ✅ |
| **資源標籤** | 5個 | 20個 | 無限制 | 無限制 |
| **資源分類** | 基本 | 進階 | 專業 | 完整 |

**權限代碼映射:**
```typescript
- resource:create -> 建立資源限制（月度）
- resource:search_advanced -> 進階搜尋功能
- resource:bulk_operations -> 批量操作功能
- resource:analytics -> 資源分析功能
- resource:export -> 資源匯出功能
- resource:tags -> 標籤數量限制
- resource:categories -> 分類功能層級
```

### 三、想法管理功能

| 功能 | Free | Basic | Premium | Enterprise |
|------|------|-------|---------|------------|
| **建立想法** | 10個 | 50個 | 無限制 | 無限制 |
| **想法協作** | ❌ | ✅ | ✅ | ✅ |
| **想法分析** | ❌ | ❌ | ✅ | ✅ |
| **想法匯出** | ❌ | ❌ | ✅ | ✅ |
| **想法範本** | ❌ | ✅ | ✅ | ✅ |
| **AI 輔助** | ❌ | ❌ | ✅ | ✅ |

**權限代碼映射:**
```typescript
- idea:create -> 建立想法限制
- idea:collaboration -> 想法協作功能
- idea:analytics -> 想法分析功能
- idea:export -> 想法匯出功能
- idea:template -> 想法範本功能
- idea:ai_assistance -> AI 輔助功能
```

### 四、導師功能

| 功能 | Free | Basic | Premium | Enterprise |
|------|------|-------|---------|------------|
| **尋找導師** | ✅ | ✅ | ✅ | ✅ |
| **成為導師** | ❌ | ✅ | ✅ | ✅ |
| **優先配對** | ❌ | ❌ | ✅ | ✅ |
| **導師分析** | ❌ | ❌ | ✅ | ✅ |
| **多重角色** | ❌ | ❌ | ❌ | ✅ |

**權限代碼映射:**
```typescript
- mentor:find -> 尋找導師功能
- mentor:become -> 成為導師功能
- mentor:priority_matching -> 優先配對功能
- mentor:analytics -> 導師分析功能
- mentor:multiple_roles -> 多重角色功能
```

### 五、系統功能

| 功能 | Free | Basic | Premium | Enterprise |
|------|------|-------|---------|------------|
| **API 存取** | ❌ | ❌ | 100次/日 | 無限制 |
| **客製品牌** | ❌ | ❌ | ❌ | ✅ |
| **優先支援** | ❌ | ❌ | ✅ | ✅ |
| **資料匯出** | ❌ | ❌ | ✅ | ✅ |
| **進階分析** | ❌ | ❌ | ✅ | ✅ |
| **儲存空間** | 100MB | 1GB | 10GB | 無限制 |

**權限代碼映射:**
```typescript
- system:api_access -> API 存取限制（日度）
- system:custom_branding -> 客製品牌功能
- system:priority_support -> 優先支援功能
- system:data_export -> 資料匯出功能
- system:advanced_analytics -> 進階分析功能
- system:storage -> 儲存空間限制
```

## 權限檢查規則

### 1. 基本權限檢查流程

```typescript
async function checkSubscriptionPermission(
  userId: number,
  featureCode: string,
  increment: boolean = false
): Promise<PermissionCheckResult> {

  // 1. 取得使用者訂閱狀態
  const subscription = await getUserActiveSubscription(userId);
  if (!subscription) {
    return { allowed: false, reason: 'no_subscription' };
  }

  // 2. 檢查功能是否在方案中啟用
  const feature = await getSubscriptionFeature(subscription.planId, featureCode);
  if (!feature || !feature.isEnabled) {
    return {
      allowed: false,
      reason: 'feature_not_available',
      upgradeRequired: getMinimumPlanForFeature(featureCode)
    };
  }

  // 3. 檢查使用量限制
  if (feature.limitValue !== -1) { // -1 表示無限制
    const currentUsage = await getCurrentUsage(userId, featureCode, feature.limitPeriod);

    if (currentUsage >= feature.limitValue) {
      return {
        allowed: false,
        reason: 'usage_limit_exceeded',
        currentUsage,
        limit: feature.limitValue,
        resetDate: getNextResetDate(feature.limitPeriod)
      };
    }

    // 4. 如果需要增加使用量
    if (increment) {
      await incrementUsage(userId, featureCode, feature.limitPeriod);
    }
  }

  return { allowed: true, reason: 'subscription_valid' };
}
```

### 2. 時間週期重置規則

#### 每日重置 (Daily Reset)
- **重置時間**: 每日 00:00 UTC
- **適用功能**: API 呼叫、資料匯出次數
- **實作**: Redis TTL 24小時

#### 每月重置 (Monthly Reset)
- **重置時間**: 每月1日 00:00 UTC
- **適用功能**: 資源建立、想法建立
- **實作**: 基於 `YYYY-MM` 的計數器

#### 永久限制 (Permanent Limit)
- **重置時間**: 不重置
- **適用功能**: 專案總數、標籤總數
- **實作**: 累計計數器

### 3. 訂閱狀態檢查規則

#### 有效訂閱判定
```typescript
function isSubscriptionValid(subscription: UserSubscription): boolean {
  const now = new Date();
  return (
    subscription.status === 'active' &&
    subscription.startDate <= now &&
    subscription.endDate >= now
  );
}
```

#### 試用期處理
```typescript
function isInTrialPeriod(subscription: UserSubscription): boolean {
  if (!subscription.plan.trialDays) return false;

  const trialEndDate = new Date(subscription.startDate);
  trialEndDate.setDate(trialEndDate.getDate() + subscription.plan.trialDays);

  return new Date() <= trialEndDate;
}
```

#### 訂閱過期處理
```typescript
function handleExpiredSubscription(userId: number): void {
  // 1. 將使用者權限降級至 Free 方案
  // 2. 清除相關快取
  // 3. 記錄訂閱過期事件
  // 4. 發送通知郵件
}
```

## 錯誤訊息與升級建議

### 1. 功能不可用錯誤
```json
{
  "success": false,
  "error": {
    "code": "FEATURE_NOT_AVAILABLE",
    "message": "此功能在您目前的方案中不可用",
    "details": {
      "featureCode": "project:analytics",
      "currentPlan": "basic",
      "requiredPlan": "premium",
      "upgradeUrl": "/subscription/upgrade?plan=premium"
    }
  }
}
```

### 2. 使用量限制錯誤
```json
{
  "success": false,
  "error": {
    "code": "USAGE_LIMIT_EXCEEDED",
    "message": "已達到專案建立限制",
    "details": {
      "featureCode": "project:create",
      "currentUsage": 3,
      "limit": 3,
      "resetDate": "2024-10-01T00:00:00Z",
      "upgradeOptions": [
        {
          "plan": "basic",
          "newLimit": 10,
          "price": 9.99
        }
      ]
    }
  }
}
```

### 3. 訂閱過期錯誤
```json
{
  "success": false,
  "error": {
    "code": "SUBSCRIPTION_EXPIRED",
    "message": "您的訂閱已過期",
    "details": {
      "expiredDate": "2024-09-15T23:59:59Z",
      "gracePeriodEnd": "2024-09-22T23:59:59Z",
      "renewUrl": "/subscription/renew"
    }
  }
}
```

## 特殊情況處理

### 1. 方案降級處理
當使用者從高等級方案降級時：

```typescript
async function handlePlanDowngrade(
  userId: number,
  fromPlan: string,
  toPlan: string
): Promise<void> {
  // 1. 檢查現有使用量是否超過新方案限制
  const conflicts = await checkDowngradeConflicts(userId, fromPlan, toPlan);

  if (conflicts.length > 0) {
    // 2. 提供降級前的數據處理選項
    throw new DowngradeConflictError('需要先處理超出限制的資料', conflicts);
  }

  // 3. 更新訂閱狀態
  await updateUserSubscription(userId, toPlan);

  // 4. 清除相關快取
  await clearUserPermissionCache(userId);

  // 5. 記錄降級事件
  await logSubscriptionChange(userId, 'downgrade', fromPlan, toPlan);
}
```

### 2. 企業方案多使用者管理
```typescript
async function checkEnterpriseUserLimit(
  organizationId: number,
  newUserCount: number
): Promise<boolean> {
  const subscription = await getOrganizationSubscription(organizationId);

  if (subscription.plan.tier !== 'enterprise') {
    return false;
  }

  // 檢查使用者數量限制（如果有的話）
  if (subscription.plan.maxUsers && subscription.plan.maxUsers !== -1) {
    const currentUsers = await getOrganizationUserCount(organizationId);
    return (currentUsers + newUserCount) <= subscription.plan.maxUsers;
  }

  return true; // 無限制
}
```

### 3. 試用期轉換
```typescript
async function handleTrialConversion(userId: number): Promise<void> {
  const subscription = await getUserActiveSubscription(userId);

  if (!subscription || !isInTrialPeriod(subscription)) {
    return;
  }

  const trialEndDate = calculateTrialEndDate(subscription);
  const now = new Date();

  if (now >= trialEndDate) {
    // 試用期結束，自動降級至 Free 方案
    await convertToFreePlan(userId);
    await sendTrialEndNotification(userId);
  }
}
```

## 快取策略

### 1. 使用量快取
```typescript
// Redis 鍵格式
const CACHE_KEYS = {
  dailyUsage: `usage:daily:${userId}:${featureCode}:${YYYY-MM-DD}`,
  monthlyUsage: `usage:monthly:${userId}:${featureCode}:${YYYY-MM}`,
  permanentUsage: `usage:permanent:${userId}:${featureCode}`,
  subscriptionStatus: `subscription:${userId}`,
  planFeatures: `plan:features:${planId}`
};
```

### 2. 快取失效策略
- **訂閱變更**: 清除使用者所有相關快取
- **方案更新**: 清除該方案的功能快取
- **使用量重置**: 自動處理時間相關的快取過期

## 監控與告警

### 1. 使用量監控
- 追蹤各功能的使用率
- 監控接近限制的使用者
- 分析升級轉換率

### 2. 效能監控
- 權限檢查回應時間
- 快取命中率
- 資料庫查詢效能

### 3. 業務監控
- 方案分佈統計
- 功能使用分析
- 收入分析報告

---

**最後更新**: 2024-09-21
**版本**: 1.0.0
**負責團隊**: 道道開發團隊