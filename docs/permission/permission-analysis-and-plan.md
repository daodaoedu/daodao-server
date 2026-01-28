# DaoDao 平台權限管控分析與改進規劃

**分析日期**: 2025-09-21
**狀態**: Draft
**範圍**: src 目錄權限管控系統現狀分析與改進規劃

## 執行流程摘要

1. 分析現有權限架構和實作問題
2. 識別關鍵風險點和改進機會
3. 制定分階段改進計劃
4. 提供具體實施建議

---

## ⚡ 快速摘要

### 現狀評估
- **權限架構**: 基於 JWT + 角色權限的混合模式
- **關鍵問題**: 權限檢查不一致、臨時用戶處理混亂、資源所有權驗證缺失
- **風險等級**: 中高風險 - 存在權限繞過和越權存取可能性

### 改進重點
- 統一權限檢查邏輯
- 完善資源所有權驗證
- 強化臨時用戶權限控制
- 建立完整的權限審計機制

---

## 現有權限架構分析

### 🏗️ 架構組成

#### 1. 身份驗證層 (`src/middleware/auth.ts`)
```typescript
// JWT 驗證中間件
- authenticateJWT: 標準 JWT 驗證
- optionalAuth: 可選驗證
- authenticateSession: Session 驗證
- authenticateAny: 混合驗證方式
```

**優點**:
- 支援多種驗證方式
- 完整的 JWT 處理邏輯
- 良好的錯誤處理

**問題**:
- JWT secret 配置不一致 (`JWT_SECRET` vs `JWT_SECURITY`)
- 臨時用戶標記邏輯混亂 (`isTemp` vs `isTemporary`)
- 缺乏統一的用戶狀態檢查

#### 2. 權限控制層 (`src/middleware/permission.middleware.ts`)
```typescript
// 權限檢查中間件
- requirePermission: 基本權限檢查
- requireRole: 角色檢查
- requireAdmin/requireSuperAdmin: 管理員檢查
- requireOwnership: 資源所有權檢查
```

**優點**:
- 權限檢查邏輯相對完整
- 支援複雜的權限組合
- 提供資源所有權檢查機制

**問題**:
- 資源所有權檢查實作不完整 (`isResourceOwner` 總是回傳 false)
- 權限服務依賴問題
- 缺乏權限快取機制

#### 3. 權限服務層 (`src/services/auth/permission.service.ts`)
```typescript
// 權限管理服務
- hasPermission: 權限檢查
- hasRole: 角色檢查
- getUserPermissions/getUserRoles: 權限角色查詢
- checkResourceOwnership: 資源所有權檢查
```

**優點**:
- 資料庫查詢邏輯清晰
- 支援超級管理員邏輯
- 權限繼承機制

**問題**:
- 資源所有權檢查未實作 (`isResourceOwner` 方法為空)
- 缺乏權限快取機制
- 資料庫查詢效率問題
- 錯誤處理過於寬鬆（錯誤時回傳 false）

### 🔍 關鍵風險點

#### 1. **資源所有權檢查缺失** - 🔴 高風險
```typescript
// src/services/auth/permission.service.ts:331
async isResourceOwner(userId: number, resourceType: string, resourceId: number): Promise<boolean> {
  try {
    console.log('Checking resource ownership...');
    return false; // ⚠️ 總是回傳 false
  } catch (error) {
    return false;
  }
}
```

**風險影響**: 用戶可能存取他人資源，造成資料洩露或未授權修改。

#### 2. **臨時用戶權限控制不一致** - 🔴 高風險
```typescript
// 多處不一致的臨時用戶檢查
req.isTemporary = decoded.isTemp || false;  // auth.ts
if (user.isTemp && !options.allowTemp) { } // permission.middleware.ts
if (req.isTemporary) { }                    // 其他地方
```

**風險影響**: 臨時用戶可能獲得超出預期的權限。

#### 3. **權限檢查錯誤處理** - 🟡 中風險
```typescript
// 錯誤時預設回傳 false，可能掩蓋真實問題
} catch (error) {
  console.error('Error checking permission:', error);
  return false; // ⚠️ 靜默失敗
}
```

**風險影響**: 系統錯誤時權限檢查失效，難以偵測和診斷問題。

#### 4. **權限快取缺失** - 🟡 中風險
每次權限檢查都執行資料庫查詢，影響效能且增加資料庫負載。

---

## 使用者情境與測試需求

### 主要使用者情境

**情境 1: 正式用戶存取自己的資源**
- **Given**: 正式用戶已登入且擁有某個專案
- **When**: 用戶嘗試編輯該專案
- **Then**: 系統應允許存取並記錄操作

**情境 2: 臨時用戶嘗試存取受限功能**
- **Given**: 臨時用戶已登入
- **When**: 用戶嘗試刪除資源或存取管理功能
- **Then**: 系統應拒絕存取並提供明確錯誤訊息

**情境 3: 管理員執行管理操作**
- **Given**: 管理員已登入
- **When**: 管理員存取任何用戶資源或執行系統管理操作
- **Then**: 系統應允許存取並記錄管理操作

### 邊界情況
- JWT token 過期時的權限檢查行為
- 資料庫連線失敗時的權限回退機制
- 惡意請求嘗試權限繞過時的防護機制
- 大量並發權限檢查的效能表現

---

## 功能需求

### 核心功能需求

**FR-001**: 系統必須提供統一的權限檢查介面，支援角色權限和資源所有權雙重驗證
**FR-002**: 系統必須正確實作資源所有權檢查，防止用戶存取他人資源
**FR-003**: 系統必須區分臨時用戶和正式用戶的權限邊界，確保臨時用戶無法執行敏感操作
**FR-004**: 系統必須提供權限快取機制，減少資料庫查詢負載
**FR-005**: 系統必須記錄所有權限檢查結果，支援安全審計
**FR-006**: 系統必須提供權限檢查失敗時的明確錯誤訊息
**FR-007**: 系統必須支援權限繼承，管理員可存取所有資源
**FR-008**: 系統必須提供權限檢查的效能監控機制

### 關鍵實體

**User Entity**: 用戶實體，包含 ID、角色、臨時狀態、電子郵件驗證狀態等
**Role Entity**: 角色實體，定義角色名稱、權限集合、繼承關係
**Permission Entity**: 權限實體，定義資源類型、操作類型、權限名稱
**Resource Entity**: 資源實體，包含所有可控制存取的業務資源（專案、想法、評論等）
**ResourceOwnership**: 資源所有權關係，定義用戶與資源的所有權關係

---

## 改進計劃

### 階段一：基礎安全強化（優先級：🔴 緊急）

#### 1.1 修復資源所有權檢查
```typescript
// 目標：完整實作 isResourceOwner 方法
async isResourceOwner(userId: number, resourceType: string, resourceId: number): Promise<boolean> {
  switch (resourceType) {
    case 'project':
      return await this.checkProjectOwnership(userId, resourceId);
    case 'idea':
      return await this.checkIdeaOwnership(userId, resourceId);
    case 'resource':
      return await this.checkResourceOwnership(userId, resourceId);
    // ... 其他資源類型
  }
}
```

**實施步驟**:
1. 分析所有資源類型的所有權關係
2. 實作各資源類型的所有權檢查邏輯
3. 增加單元測試和整合測試
4. 部署前進行安全測試

#### 1.2 統一臨時用戶處理邏輯
```typescript
// 目標：統一的臨時用戶狀態檢查
interface UserAuthStatus {
  isTemporary: boolean;
  isEmailVerified: boolean;
  isActive: boolean;
  canPerformSensitiveOperations: boolean;
}
```

**實施步驟**:
1. 統一臨時用戶標記邏輯
2. 建立臨時用戶權限白名單
3. 更新所有中間件使用統一介面
4. 增加臨時用戶場景測試

#### 1.3 改善錯誤處理機制
**實施步驟**:
1. 建立權限檢查錯誤分類系統
2. 實作結構化錯誤回報機制
3. 增加權限檢查失敗的監控告警
4. 提供用戶友善的錯誤訊息

### 階段二：效能與擴展性優化（優先級：🟡 重要）

#### 2.1 實作權限快取機制
```typescript
// 目標：Redis 基礎的權限快取
interface PermissionCache {
  getUserPermissions(userId: number): Promise<string[]>;
  invalidateUserCache(userId: number): Promise<void>;
  cacheUserPermissions(userId: number, permissions: string[], ttl: number): Promise<void>;
}
```

#### 2.2 效能優化
- 批量權限查詢
- 資料庫查詢優化
- 權限檢查結果快取
- 減少重複查詢

### 階段三：審計與監控增強（優先級：🟢 一般）

#### 3.1 權限審計系統
```typescript
interface PermissionAuditLog {
  userId: number;
  action: string;
  resource: string;
  result: 'granted' | 'denied';
  reason: string;
  timestamp: Date;
  metadata: Record<string, any>;
}
```

#### 3.2 安全監控
- 可疑權限檢查模式偵測
- 權限繞過嘗試監控
- 權限升級操作追蹤

---

## 實施建議

### 技術實施策略

#### 1. 測試驅動開發 (TDD)
```typescript
// 先寫測試，確保權限邏輯正確
describe('Resource Ownership Check', () => {
  it('should allow owner to access their resource', async () => {
    // Given: User owns a project
    // When: User tries to access the project
    // Then: Access should be granted
  });

  it('should deny access to non-owner', async () => {
    // Given: User does not own a project
    // When: User tries to access the project
    // Then: Access should be denied
  });
});
```

#### 2. 漸進式部署
1. 在開發環境完整測試
2. 先部署到測試環境進行整合測試
3. 使用功能開關 (Feature Flag) 在生產環境逐步啟用
4. 監控系統性能和安全指標

#### 3. 向後相容性
- 保持現有 API 介面不變
- 透過配置開關啟用新功能
- 提供遷移腳本和回滾機制

### 資料庫遷移策略

#### 權限表結構優化
```sql
-- 建議的權限表結構改進
CREATE INDEX idx_user_permissions_lookup ON user_permissions(user_id, permission_id);
CREATE INDEX idx_role_permissions_lookup ON role_permissions(role_id, permission_id);
CREATE INDEX idx_resource_ownership ON resources(created_by, id);
```

### 監控與維護

#### 關鍵指標 (KPI)
- 權限檢查延遲 (P95 < 50ms)
- 權限檢查失敗率 (< 0.1%)
- 權限快取命中率 (> 90%)
- 安全事件檢測準確率

#### 定期維護任務
- 每月權限審計報告
- 季度安全評估
- 半年權限架構回顧

---

## 複雜度追蹤

| 改進項目 | 複雜度增加原因 | 簡化替代方案被拒絕原因 |
|---------|------------|-------------------|
| 權限快取機制 | 需要 Redis 依賴和快取失效邏輯 | 直接資料庫查詢導致效能問題，無法滿足 P95 < 50ms 需求 |
| 資源所有權檢查 | 需要為每種資源類型實作檢查邏輯 | 通用檢查機制無法覆蓋所有業務邏輯，存在安全風險 |
| 權限審計系統 | 需要額外儲存和分析機制 | 法規遵循要求必須提供完整的操作追蹤 |

---

## 進度追蹤

**階段狀態**:
- [x] 階段 0: 現狀分析完成
- [x] 階段 1: 改進計劃制定完成
- [ ] 階段 2: 基礎安全強化實施
- [ ] 階段 3: 效能優化實施
- [ ] 階段 4: 審計監控實施
- [ ] 階段 5: 驗證測試

**關鍵里程碑**:
- [ ] 資源所有權檢查修復完成
- [ ] 臨時用戶權限邏輯統一
- [ ] 權限快取機制上線
- [ ] 安全測試通過
- [ ] 效能指標達標

---

**基於 DaoDao 平台架構分析 | 版本: 1.0.0 | 建立日期: 2025-09-21**