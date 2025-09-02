# 測試擴展任務清單

## 目標
基於現有的 6 個服務測試，按照 EXPRESS_TESTING_PRINCIPLES.md 標準，逐步完善測試覆蓋率，建立完整的測試體系。

## 現狀分析

### 當前測試結構
- **單元測試**: **6 個檔案** (僅 services 測試)
  - `tests/unit/services/` - 6 個服務測試檔案
- **整合測試**: **0 個檔案** (尚未建立)
- **其他測試**: **0 個檔案** (controllers, validators, middleware, e2e 都尚未建立)
- **狀況**: 測試覆蓋率較低，需要補齊剩餘的核心業務邏輯測試

## 測試擴展任務

### Phase 1: 測試基礎設施 ✅ 已完成

#### 1.1 測試配置重構
- [x] 簡化 Jest 配置，移除不必要選項
- [x] 建立統一的測試環境設定
- [x] 更新 package.json 測試腳本

#### 1.2 測試工具統一
- [x] 重寫 `tests/utils/prisma-mock.ts`
- [x] 建立測試資料工廠 `tests/utils/test-factories.ts`
- [x] 建立 API 測試輔助 `tests/utils/api-helpers.ts`
- [x] 建立資料庫清理工具 `tests/utils/db-cleanup.ts`

### Phase 2: 單元測試擴展 (專注業務邏輯)

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

### Phase 3: 整合測試建立 (新增 HTTP 層測試)

#### 3.1 認證與授權 API (可選，未來擴展)
- [ ] `integration/auth-api.test.ts` (登入、註冊、JWT 驗證)
- [ ] `integration/user-api.test.ts` (用戶 CRUD 操作)

#### 3.2 核心功能 API (可選，未來擴展)  
- [ ] `integration/project-api.test.ts` (專案管理 API)
- [ ] `integration/practice-api.test.ts` (練習功能 API)
- [ ] `integration/resource-api.test.ts` (資源管理 API)

#### 3.3 系統 API (可選，未來擴展)
- [ ] `integration/health-api.test.ts` (健康檢查)

### Phase 4: 測試優化與擴展

#### 4.1 中介軟體測試 (可選，未來新增)
- [ ] `middleware/auth.middleware.test.ts` (認證中介軟體)
- [ ] `middleware/validation.middleware.test.ts` (驗證中介軟體)
- [ ] `middleware/error-handler.middleware.test.ts` (錯誤處理)

#### 4.2 端對端測試 (可選，未來新增)
- [ ] `e2e/user-flow.test.ts` (完整用戶流程)
- [ ] `e2e/practice-flow.test.ts` (練習完整流程)

### Phase 5: 測試基礎設施優化

#### 5.1 CI/CD 整合
- [ ] 更新 GitHub Actions 測試流程
- [ ] 建立測試覆蓋率報告
- [ ] 設定測試失敗通知

#### 5.2 開發體驗
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

### ✅ **已完成 (Phase 1-2A)** 
- ✅ 測試基礎設施建立完成
- ✅ 核心 Services 單元測試 (6/6 完成)
  - ✅ Auth Service (34 tests)
  - ✅ User Service (23 tests)
  - ✅ Resource Service (26 tests)
  - ✅ Practice Service (22 tests)
  - ✅ Practice Checkin Service (31 tests)
  - ✅ Practice Event Service (26 tests)

### 🎯 **當前階段 (Phase 2B)** - 完成剩餘 Services
- [ ] Practice Interaction Service
- [ ] Project Service
- [ ] Idea Service  
- [ ] Comment Service
- [ ] 其他業務服務 (8個)

### 📋 **下一階段 (Phase 2C-2D)** - Validators & Utils
- [ ] 核心 Validators 測試 (12個)
- [ ] Utils 工具函數測試 (6個)

### 🚀 **未來擴展 (Phase 3-5)** - 可選任務
- [ ] 整合測試建立
- [ ] 中介軟體測試 
- [ ] 端對端測試
- [ ] CI/CD 優化

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

- ✅ **auth.service.test.ts**: 34/34 tests (100% pass)
  - 涵蓋：用戶認證、JWT 處理、權限驗證、OAuth 整合、安全性檢查
- ✅ **user.service.test.ts**: 23/23 tests (100% pass)
  - 涵蓋：CRUD 操作、權限驗證、資料轉換、標籤管理、完整度計算
- ✅ **resource.service.test.ts**: 26/26 tests (100% pass)
  - 涵蓋：資源管理、標籤篩選、分頁查詢、權限驗證、統計計算、分類驗證
- ✅ **practice.service.test.ts**: 22/22 tests (100% pass)
  - 涵蓋：實踐管理、CRUD 操作、權限驗證、統計計算、標籤/資源關聯、資料格式化
- ✅ **practice-checkin.service.test.ts**: 31/31 tests (100% pass)
  - 涵蓋：簽到管理、進度追蹤、連續簽到計算、日期驗證、統計資訊、月度日曆、錯誤處理
- ✅ **practice-event.service.test.ts**: 26/26 tests (100% pass)
  - 涵蓋：事件記錄（瀏覽、點擊、分享、收藏）、批量處理、統計查詢、使用者歷史、錯誤處理

**總計**：162/162 核心服務測試通過 ✅

## 預期結果

### 🎯 **實際測試分布目標** 
- **✅ 單元測試**: 目前 6 個檔案 (162 tests)，目標 ~25 個檔案
- **🚀 Validators 測試**: 目標 12 個檔案 (120+ tests) 
- **🛠 Utils 測試**: 目標 6 個檔案 (60+ tests)
- **📈 可選擴展**: 整合測試、E2E 測試（未來需求）

### 📊 **預期效益**
- ✅ 核心業務邏輯覆蓋率 95%+
- ✅ 測試可維護性大幅提升  
- ✅ 單元測試執行速度快速
- ✅ 遵循統一的測試標準和模式

## 🗂 **實際任務統計**

### ✅ **已完成**
- Services 測試: 6/~15 個 
- 測試基礎設施: 100%
- 測試工具: 100%

### 🎯 **待完成 (核心任務)**
- Services 測試: ~9 個
- Validators 測試: ~12 個  
- Utils 測試: ~6 個

### 🚀 **可選任務 (未來擴展)**
- 整合測試、中介軟體測試、E2E 測試等