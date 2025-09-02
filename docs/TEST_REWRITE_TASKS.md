# 測試重寫任務清單

## 目標
根據 EXPRESS_TESTING_PRINCIPLES.md 重構現有測試，實現清晰的測試分層和避免重複測試。

## 現狀分析

### 當前測試結構
- **單元測試**: 62 個檔案 (controllers, services, validators, middleware)
- **整合測試**: 25 個檔案 (API endpoints)
- **問題**: 測試重複、缺乏清晰分層、部分測試過於複雜

## 重寫任務

### Phase 1: 測試基礎設施

#### 1.1 測試配置重構
- [x] 簡化 Jest 配置，移除不必要選項
- [x] 建立統一的測試環境設定
- [x] 更新 package.json 測試腳本

#### 1.2 測試工具統一
- [x] 重寫 `tests/utils/prisma-mock.ts`
- [x] 建立測試資料工廠 `tests/utils/test-factories.ts`
- [x] 建立 API 測試輔助 `tests/utils/api-helpers.ts`
- [x] 建立資料庫清理工具 `tests/utils/db-cleanup.ts`

### Phase 2: 單元測試重寫 (專注業務邏輯)

#### 2.1 Services 測試 (高優先度)
**核心業務邏輯服務**
- [x] `services/auth.service.test.ts` (34/34 tests ✅)
- [x] `services/user.service.test.ts` (23/23 tests ✅)
- [x] `services/resource.service.test.ts` (26/26 tests ✅)
- [ ] `services/project.service.test.ts`
- [ ] `services/idea.service.test.ts`

**練習相關服務**
- [x] `services/practice.service.test.ts` (22/22 tests ✅)
- [x] `services/practice-checkin.service.test.ts` (31/31 tests ✅)
- [x] `services/practice-event.service.test.ts` (26/26 tests ✅)
- [ ] `services/practice-interaction.service.test.ts`

**其他業務服務**
- [ ] `services/comment.service.test.ts`
- [ ] `services/resource-review.service.test.ts`
- [ ] `services/transform.service.test.ts`

#### 2.2 Validators 測試 (資料驗證邏輯)
- [ ] `validators/auth.validators.test.ts`
- [ ] `validators/user.validators.test.ts`
- [ ] `validators/project.validators.test.ts`
- [ ] `validators/practice.validators.test.ts`
- [ ] `validators/resource.validators.test.ts`

#### 2.3 Utils 測試 (工具函數)
- [ ] `utils/pagination-helper.test.ts`
- [ ] `utils/response-helper.test.ts`
- [ ] `utils/user-type-detection.test.ts`

### Phase 3: 整合測試重寫 (專注 HTTP 層)

#### 3.1 認證與授權 API
- [ ] `integration/auth-flow.test.ts` (登入、註冊、OAuth)
- [ ] `integration/auth-security.test.ts` (JWT、權限驗證)

#### 3.2 核心資源 API
- [ ] `integration/user-api.test.ts`
- [ ] `integration/project-api.test.ts`
- [ ] `integration/resource-api.test.ts`
- [ ] `integration/idea-api.test.ts`

#### 3.3 練習功能 API  
- [ ] `integration/practice-api.test.ts`
- [ ] `integration/milestone-api.test.ts`
- [ ] `integration/outcome-api.test.ts`

#### 3.4 互動功能 API
- [ ] `integration/comment-api.test.ts`
- [ ] `integration/review-api.test.ts`
- [ ] `integration/note-api.test.ts`

#### 3.5 輔助功能 API
- [ ] `integration/mentor-api.test.ts`
- [ ] `integration/health-api.test.ts`

### Phase 4: 移除重複測試

#### 4.1 Controller 測試移除
**移除原因**: Controller 邏輯已在整合測試中驗證
- [ ] 移除所有 `tests/unit/controllers/*.test.ts` (18 個檔案)

#### 4.2 Middleware 測試簡化
**保留**: 複雜邏輯中介軟體
- [ ] `middleware/auth.middleware.test.ts` (簡化)
- [ ] `middleware/permission.middleware.test.ts` (簡化)
- [ ] `middleware/response-enhancer.test.ts` (新增)

**移除**: 簡單中介軟體 (在整合測試中已覆蓋)
- [ ] 移除 `middleware/error.middleware.test.ts`
- [ ] 移除 `middleware/validator.test.ts`

#### 4.3 整合測試合併
**移除重複的整合測試**
- [ ] 移除 `integration/api-endpoints.test.ts` (功能重複)
- [ ] 移除 `integration/backward-compatibility.test.ts` (非核心)
- [ ] 移除 `integration/response-format-compatibility.test.ts` (重複)

### Phase 5: 端對端測試

#### 5.1 關鍵用戶流程
- [ ] `e2e/user-registration-flow.test.ts`
- [ ] `e2e/project-creation-flow.test.ts`  
- [ ] `e2e/practice-session-flow.test.ts`

### Phase 6: 測試腳本優化

#### 6.1 CI/CD 整合
- [ ] 更新 GitHub Actions 測試流程
- [ ] 建立測試覆蓋率報告
- [ ] 設定測試失敗通知

#### 6.2 開發體驗
- [ ] 設定測試監視模式
- [ ] 建立測試執行別名指令
- [ ] 文件化測試執行流程

## 重寫原則

### 單元測試原則
- 只測試純函數和業務邏輯
- Mock 所有外部依賴 (資料庫、API)
- 每個測試專注單一功能點
- 使用工廠函數建立測試資料

### 整合測試原則  
- 測試完整的 HTTP 請求流程
- 使用真實的測試資料庫
- 驗證狀態碼、回應格式、資料正確性
- 不重複驗證業務邏輯細節

### 測試資料管理
- 每個測試使用獨立的測試資料
- 測試後自動清理資料
- 使用 beforeEach/afterEach 確保隔離

## 執行計畫

### Week 1: Phase 1-2 ✅ **已完成**
- ✅ 測試基礎設施建立
- ✅ 核心 Services 單元測試 (4/5 完成)
  - ✅ User Service (23 tests)
  - ✅ Project Service (19 tests)  
  - ✅ Idea Service (19 tests)
  - ✅ Resource Service (26 tests)
  - ⏳ Practice Services (待開始)

### Week 2: Phase 3
- API 整合測試重寫

### Week 3: Phase 4-5  
- 移除重複測試
- 端對端測試建立

### Week 4: Phase 6
- 優化和文件化

## 標準測試寫法範例

### Service 單元測試標準模式

基於已完成的 `user.service.test.ts`, `project.service.test.ts`, `idea.service.test.ts` 建立的標準寫法：

```typescript
/**
 * [Service Name] Unit Tests
 * Tests [service] business logic in isolation
 * 
 * Focus: Business logic validation, data transformation, [domain] operations
 * Mocks: All external dependencies (database, external services, etc.)
 */

import { prismaMock, setupTransactionMock } from '@tests/utils/prisma-mock';

// Mock external dependencies
const mockExternalService = {
  methodName: jest.fn()
};

jest.mock('@/services/database/prisma.service', () => ({
  prisma: prismaMock
}));

jest.mock('@/services/external.service', () => mockExternalService);

import { serviceMethod1, serviceMethod2 } from '@/services/target.service';

describe('[Service Name] Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupTransactionMock();
    
    // Setup common mock returns
    mockExternalService.methodName.mockResolvedValue(undefined);
  });

  // Test data factories matching Prisma schema
  const createTestEntity = (overrides = {}) => ({
    id: 1,
    external_id: 'test-uuid',
    // ... all required Prisma fields
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides
  });

  describe('serviceMethod1', () => {
    it('should handle successful operation with complete data', async () => {
      // Arrange: Setup test data and mocks
      const testEntity = createTestEntity({
        specific_field: 'test_value'
      });
      prismaMock.entity.findUnique.mockResolvedValue(testEntity);

      // Act: Execute the service method
      const result = await serviceMethod1('test-id', { param: 'value' });

      // Assert: Verify behavior and database calls
      expect(prismaMock.entity.findUnique).toHaveBeenCalledWith({
        where: { external_id: 'test-id' },
        include: expect.objectContaining({
          related_entity: true
        })
      });
      
      expect(result.success).toBe(true);
      expect(result.data.specific_field).toBe('test_value');
    });

    it('should throw NotFoundError when entity not found', async () => {
      prismaMock.entity.findUnique.mockResolvedValue(null);

      await expect(serviceMethod1('non-existent', {}))
        .rejects.toThrow('實體不存在');
    });

    it('should validate permissions', async () => {
      const testEntity = createTestEntity({ user_id: 2 });
      prismaMock.entity.findUnique.mockResolvedValue(testEntity);

      await expect(serviceMethod1('test-id', {}, 1)) // Different user
        .rejects.toThrow('無權限存取');
    });
  });

  describe('Business logic validation', () => {
    describe('data formatting', () => {
      it('should handle null values with sensible defaults', async () => {
        const entityWithNulls = createTestEntity({
          optional_field: null,
          status: null
        });
        
        prismaMock.entity.findUnique.mockResolvedValue(entityWithNulls);
        const result = await serviceMethod1('test-id');
        
        expect(result.data.optional_field).toBe('');
        expect(result.data.status).toBe('active'); // Default value
      });
    });
  });
});
```

### 關鍵測試原則

1. **業務邏輯專注**：只測試 service 方法的業務邏輯，不測試 HTTP 層
2. **完整依賴 Mock**：Mock 所有外部依賴（資料庫、其他服務、第三方 API）
3. **真實資料結構**：測試資料工廠必須符合 Prisma schema 完整型別
4. **交易處理測試**：使用 `setupTransactionMock()` 測試資料庫交易
5. **錯誤情境覆蓋**：測試 NotFound、Permission、Validation 等錯誤
6. **邊界值處理**：測試 null/undefined 值的處理邏輯
7. **權限驗證**：測試用戶權限和資料存取控制
8. **資料轉換**：驗證 API 回應格式的正確轉換

### 已完成測試統計

- ✅ **user.service.test.ts**: 23/23 tests (100% pass)
  - 涵蓋：CRUD 操作、權限驗證、資料轉換、標籤管理、完整度計算
- ✅ **project.service.test.ts**: 19/19 tests (100% pass)  
  - 涵蓋：專案管理、權限控制、里程碑處理、統計資訊、角色限制
- ✅ **idea.service.test.ts**: 19/19 tests (100% pass)
  - 涵蓋：想法管理、標籤篩選、資源關聯、軟刪除、分頁查詢
- ✅ **resource.service.test.ts**: 26/26 tests (100% pass)
  - 涵蓋：資源管理、標籤篩選、分頁查詢、權限驗證、統計計算、分類驗證
- ✅ **practice.service.test.ts**: 22/22 tests (100% pass)
  - 涵蓋：實踐管理、CRUD 操作、權限驗證、統計計算、標籤/資源關聯、資料格式化
- ✅ **practice-checkin.service.test.ts**: 31/31 tests (100% pass)
  - 涵蓋：簽到管理、進度追蹤、連續簽到計算、日期驗證、統計資訊、月度日曆、錯誤處理
- ✅ **practice-event.service.test.ts**: 26/26 tests (100% pass)
  - 涵蓋：事件記錄（瀏覽、點擊、分享、收藏）、批量處理、統計查詢、使用者歷史、錯誤處理

**總計**：166/166 核心服務測試通過 ✅

## 預期結果

### 測試分布目標
- **單元測試**: 30 個檔案 (70% 覆蓋率)
- **整合測試**: 15 個檔案 (25% 覆蓋率)  
- **端對端測試**: 3 個檔案 (5% 覆蓋率)

### 效能提升
- 測試執行時間減少 40%
- 測試維護成本降低 50%
- 測試覆蓋率提升至 75%+

## 檔案清理清單

### 移除檔案 (18 個)
```
tests/unit/controllers/auth.controller.test.ts
tests/unit/controllers/comment.controller.test.ts
tests/unit/controllers/email.controller.test.ts
tests/unit/controllers/idea-controller.test.ts
tests/unit/controllers/image.controller.test.ts
tests/unit/controllers/mentor.controller.test.ts
tests/unit/controllers/milestone.controller.test.ts
tests/unit/controllers/note.controller.test.ts
tests/unit/controllers/outcome.controller.test.ts
tests/unit/controllers/practice.controller.test.ts
tests/unit/controllers/project.controller.test.ts
tests/unit/controllers/resource-controller.test.ts
tests/unit/controllers/resource-review-controller.test.ts
tests/unit/controllers/review.controller.test.ts
tests/unit/controllers/user.controller.test.ts
tests/integration/backward-compatibility.test.ts
tests/integration/response-format-compatibility.test.ts
tests/integration/api-endpoints.test.ts
```

### 重寫檔案 (25 個)
- 所有 Services 測試
- 核心 Validators 測試  
- 主要 API 整合測試