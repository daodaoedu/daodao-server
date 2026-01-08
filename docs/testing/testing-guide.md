# 測試指南

## 概述

本文檔提供了 DaoDao Server 專案的測試策略、最佳實踐和使用指南。

## 測試架構

### 測試類型

1. **單元測試 (Unit Tests)**
   - 位置：`src/tests/unit/`
   - 測試單個函數或組件
   - 使用 Jest 測試框架
   - 覆蓋率目標：> 80%

2. **整合測試 (Integration Tests)**
   - 位置：`src/tests/integration/`
   - 測試多個組件之間的交互
   - 包含 API 端點測試
   - 覆蓋率目標：> 70%

3. **端到端測試 (E2E Tests)**
   - 測試完整的用戶流程
   - 從用戶角度驗證系統功能

### 測試工具

- **Jest**: 主要測試框架
- **Supertest**: HTTP 測試工具
- **TypeScript**: 類型安全的測試代碼
- **Prisma**: 數據庫測試工具

## 測試命令

```bash
# 運行所有測試
npm test

# 運行單元測試
npm test -- --testPathPattern="unit"

# 運行整合測試
npm test -- --testPathPattern="integration"

# 運行特定測試文件
npm test -- --testPathPattern="auth.middleware.test.ts"

# 運行測試並生成覆蓋率報告
npm test -- --coverage

# 運行類型檢查
npm run typecheck

# 運行代碼質量檢查
npm run lint
```

## 測試最佳實踐

### 1. 測試結構

使用 AAA 模式（Arrange, Act, Assert）：

```typescript
it('should authenticate valid JWT token', () => {
  // Arrange
  const userPayload = { id: 1, username: 'testuser' };
  const token = generateTestToken(userPayload);
  const req = createMockRequest({ headers: { authorization: `Bearer ${token}` } });
  
  // Act
  authenticateJWT(req, res, next);
  
  // Assert
  expect(next).toHaveBeenCalled();
  expect(req.user).toBeDefined();
});
```

### 2. Mock 策略

- 使用 Jest 的 mock 功能
- 模擬外部依賴（數據庫、API 調用）
- 隔離測試環境

```typescript
// Mock 數據庫
jest.mock('../../services/database', () => ({
  prisma: {
    users: {
      findFirst: jest.fn(),
      create: jest.fn(),
    }
  }
}));

// Mock 外部服務
jest.mock('../../services/auth/email.service');
```

### 3. 測試數據管理

使用測試工具函數生成一致的測試數據：

```typescript
import { createTestUserPayload, generateTestToken } from '../../utils/test-helpers';

const userPayload = createTestUserPayload();
const token = generateTestToken(userPayload);
```

### 4. 錯誤測試

測試各種錯誤情況：

```typescript
it('should handle invalid token', () => {
  const req = createMockRequest({ headers: { authorization: 'Bearer invalid' } });
  
  authenticateJWT(req, res, next);
  
  expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
});
```

## 認證系統測試

### 測試覆蓋範圍

#### 1. JWT 服務測試
- **位置**: `src/tests/unit/services/jwt-service.test.ts`
- **覆蓋範圍**:
  - Token 生成和驗證
  - Token 刷新邏輯
  - 過期 Token 處理
  - 錯誤處理

#### 2. 認證中間件測試
- **位置**: `src/tests/unit/middleware/auth.middleware.test.ts`
- **覆蓋範圍**:
  - JWT 認證
  - 權限驗證
  - 臨時用戶處理
  - 角色授權

#### 3. 安全性測試
- **位置**: `src/tests/integration/auth-security.test.ts`
- **覆蓋範圍**:
  - 暴力破解防護
  - SQL 注入防護
  - XSS 防護
  - CSRF 防護
  - JWT 操作攻擊防護

### 測試案例範例

#### 基本認證測試

```typescript
describe('authenticateJWT', () => {
  it('should authenticate valid JWT token', () => {
    const userPayload = createTestUserPayload();
    const token = generateTestToken(userPayload);
    const req = createMockRequest({ headers: createAuthHeader(token) });
    
    authenticateJWT(req, res, next);
    
    expect(next).toHaveBeenCalled();
    expect(req.user?.id).toBe(userPayload.id);
  });
});
```

#### 安全性測試

```typescript
describe('Security Tests', () => {
  it('should prevent brute force attacks', async () => {
    const attempts = Array(10).fill(0).map(() =>
      request(app)
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'wrong' })
    );
    
    const responses = await Promise.all(attempts);
    responses.forEach(response => {
      expect(response.status).toBe(401);
    });
  });
});
```

## 錯誤處理測試

### 測試範圍

#### 1. 錯誤中間件測試
- **位置**: `src/tests/unit/middleware/error.middleware.test.ts`
- **覆蓋範圍**:
  - 一般錯誤處理
  - 應用程式錯誤處理
  - 驗證錯誤處理
  - 資料庫錯誤處理

#### 2. 增強錯誤測試
- 數據庫連接錯誤
- 認證錯誤
- 驗證錯誤
- 網絡錯誤
- 文件系統錯誤
- 記憶體錯誤

### 測試案例範例

```typescript
describe('Error Handling', () => {
  it('should handle database connection errors', () => {
    const error = new Error('Connection failed');
    error.name = 'PrismaClientUnknownRequestError';
    
    globalErrorHandler(error, req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: '伺服器內部錯誤',
    });
  });
});
```

## 測試工具函數

### 位置
`src/tests/utils/test-helpers.ts`

### 主要功能

1. **Mock 物件創建**
   - `createMockRequest()` - 創建模擬請求
   - `createMockResponse()` - 創建模擬回應
   - `createMockNext()` - 創建模擬 next 函數

2. **測試數據生成**
   - `createTestUserPayload()` - 創建測試用戶數據
   - `generateTestToken()` - 生成測試 JWT Token
   - `TestDataGenerator` - 隨機測試數據生成

3. **環境設定**
   - `setupTestEnvironment()` - 設定測試環境變數

4. **斷言工具**
   - `expectErrorType()` - 驗證錯誤類型
   - `expectStatusCode()` - 驗證 HTTP 狀態碼

## 持續整合 (CI)

### 測試流程

1. **代碼提交觸發**
   - 自動運行所有測試
   - 生成測試報告
   - 檢查覆蓋率

2. **測試失敗處理**
   - 阻止合併
   - 提供詳細錯誤信息
   - 通知開發者

3. **測試覆蓋率**
   - 最低覆蓋率要求
   - 覆蓋率報告生成
   - 趨勢追踪

## 性能測試

### 測試範圍

1. **認證性能**
   - JWT 驗證速度
   - 並發認證處理
   - 記憶體使用情況

2. **數據庫性能**
   - 查詢響應時間
   - 連接池管理
   - 事務處理

### 測試案例範例

```typescript
describe('Performance Tests', () => {
  it('should handle concurrent authentications', async () => {
    const requests = Array(100).fill(0).map(() =>
      authenticateRequest(validToken)
    );
    
    const startTime = Date.now();
    await Promise.all(requests);
    const endTime = Date.now();
    
    expect(endTime - startTime).toBeLessThan(1000);
  });
});
```

## 測試環境設定

### 環境變數

```bash
NODE_ENV=test
JWT_SECRET=test-jwt-secret
DATABASE_URL=postgresql://test:test@localhost:5432/test_db
```

### 測試資料庫

- 使用獨立的測試數據庫
- 每次測試前清理數據
- 使用事務回滾

## 常見問題和解決方案

### 1. 測試超時

**問題**: 測試運行時間過長
**解決方案**: 
- 增加超時時間
- 優化測試邏輯
- 使用 Mock 減少實際調用

### 2. 異步測試問題

**問題**: 異步操作測試不穩定
**解決方案**:
- 使用 async/await
- 正確處理 Promise
- 使用 Jest 的異步工具

### 3. Mock 問題

**問題**: Mock 沒有正確工作
**解決方案**:
- 檢查 Mock 路徑
- 確認 Mock 時機
- 使用 Jest 的 Mock 工具

## 測試報告

### 生成報告

```bash
# 生成 HTML 覆蓋率報告
npm test -- --coverage --coverageReporters=html

# 生成 JSON 報告
npm test -- --coverage --coverageReporters=json
```

### 報告內容

- 測試通過率
- 代碼覆蓋率
- 錯誤詳情
- 性能指標

## 最佳實踐總結

1. **編寫有意義的測試** - 測試應該驗證業務邏輯
2. **保持測試獨立** - 每個測試都應該能夠獨立運行
3. **使用描述性名稱** - 測試名稱應該清楚說明測試內容
4. **定期重構測試** - 保持測試代碼的質量
5. **追求適當覆蓋率** - 重要功能應該有完整測試覆蓋
6. **快速反饋** - 測試應該運行快速，提供即時反饋

## 結論

良好的測試策略是確保代碼質量和系統穩定性的關鍵。通過遵循本指南中的最佳實踐，可以建立一個強大、可維護的測試套件，為 DaoDao Server 的持續發展提供堅實的基礎。