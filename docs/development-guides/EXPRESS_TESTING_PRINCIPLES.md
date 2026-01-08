# Express 專案測試原則

## 測試分層策略

### 測試金字塔
- **單元測試 (70%)**: 測試 Services 和 Utils 邏輯
- **整合測試 (25%)**: 測試 API 端點和資料庫互動  
- **端對端測試 (5%)**: 測試關鍵用戶流程

### 分層責任
- **單元測試**: 業務邏輯、資料處理、工具函數
- **整合測試**: HTTP 請求、認證授權、資料庫操作
- **端對端測試**: 完整功能流程

## 基本設定

```typescript
// jest.config.js
module.exports = {
  testEnvironment: "node",
  preset: "ts-jest",
  testMatch: ["**/*.test.(ts|js)"]
}
```

## 單元測試 - Services

```typescript
import { prismaMock } from '../utils/prisma-mock'
import { userService } from '../services/user.service'

describe('UserService', () => {
  it('should create user', async () => {
    const userData = { email: 'test@example.com', name: 'Test' }
    prismaMock.users.create.mockResolvedValue({ id: 1, ...userData })
    
    const result = await userService.createUser(userData)
    
    expect(result.email).toBe(userData.email)
  })
})
```

## 整合測試 - API 端點

```typescript
import request from 'supertest'
import { app } from '../src/app'

describe('POST /api/users', () => {
  it('should create user', async () => {
    const userData = { email: 'test@example.com', name: 'Test' }
    
    const response = await request(app)
      .post('/api/users')
      .send(userData)
      .expect(201)
    
    expect(response.body.data.email).toBe(userData.email)
  })
})
```

## 測試原則

### 1. 避免重複測試
- 單元測試：專注業務邏輯
- 整合測試：專注 HTTP 層面
- 不在整合測試中重複測試已驗證的邏輯

### 2. 簡化 Mock
```typescript
// 只 mock 外部依賴
jest.mock('../services/email.service')
jest.mock('../services/r2.service')

// 不要 mock 被測試系統本身
```

### 3. 測試資料工廠
```typescript
export const createTestUser = (data = {}) => ({
  email: 'test@example.com',
  name: 'Test User',
  ...data
})
```

## 執行指令

```bash
npm test                    # 所有測試
npm test -- --watch         # 監視模式
npm test user.service       # 特定檔案
```

## 覆蓋率目標

- 單元測試：> 80%
- 整合測試：> 60%
- 總體覆蓋率：> 75%