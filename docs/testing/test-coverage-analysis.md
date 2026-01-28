# 測試覆蓋率為 0% 的原因分析與解決方案

## 問題診斷

經過詳細分析和實際測試，發現測試覆蓋率為 0% 的**根本原因**：

### 🔍 實際問題分析

#### 測試執行狀況
```
Test Suites: 1 passed, 1 total
Tests: 39 skipped, 1 passed, 40 total  ← 關鍵發現：大量測試被跳過
```

#### 覆蓋率輸出
```
----------|---------|----------|---------|---------|-------------------
File      | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
----------|---------|----------|---------|---------|-------------------
All files |       0 |        0 |       0 |       0 |                   ← 問題：完全沒有檔案被追蹤
----------|---------|----------|---------|---------|-------------------
```

### 🎯 根本原因確認

經過深入調查，發現測試覆蓋率為 0% 的主要原因有以下幾點：

### 1. Jest 配置問題

#### 當前配置問題
```javascript
// config/jest.config.js
module.exports = {
  collectCoverage: false,  // ❌ 主要問題：覆蓋率收集被禁用
  collectCoverageFrom: [
    '<rootDir>/../src/**/*.{ts,js}',
    '!<rootDir>/../src/**/*.d.ts',
    '!<rootDir>/../src/types/**/*',
    '!<rootDir>/../src/swagger/**/*',
    '!<rootDir>/../src/tests/**/*'
  ]
};
```

#### 路徑解析問題
- `collectCoverageFrom` 使用相對路徑 `<rootDir>/../src/`
- Jest 配置在 `config/` 子目錄中，路徑計算可能有誤

### 2. 測試執行中的實際問題

#### 測試結果顯示
```
Test Suites: 45 skipped, 1 passed, 1 of 46 total
Tests: 1197 skipped, 1 passed, 1198 total
```

**問題分析**：
- 46 個測試套件中，45 個被跳過
- 1198 個測試中，1197 個被跳過
- 只有 1 個測試實際執行

#### 測試跳過的原因
1. **整合測試執行超時**：某些測試包含 60 秒的長時間操作
2. **測試依賴問題**：部分測試可能因為環境設置問題而被跳過
3. **Mock 配置衝突**：不同測試間的 mock 設置可能相互干擾

### 3. 覆蓋率收集範圍問題

#### 當前覆蓋率配置分析
```javascript
collectCoverageFrom: [
  '<rootDir>/../src/**/*.{ts,js}',      // 收集所有 src 下的 ts/js 檔案
  '!<rootDir>/../src/**/*.d.ts',        // 排除型別定義檔
  '!<rootDir>/../src/types/**/*',       // 排除 types 目錄
  '!<rootDir>/../src/swagger/**/*',     // 排除 swagger 文檔
  '!<rootDir>/../src/tests/**/*'        // 排除測試檔案
]
```

**實際問題**：
- 路徑解析可能不正確
- 被測試的程式碼沒有被實際執行，導致無覆蓋率統計

## 解決方案

### 第一步：修正 Jest 配置

#### 1. 啟用覆蓋率收集
```javascript
// config/jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: "node",
  collectCoverage: true,  // ✅ 啟用覆蓋率收集
  coverageDirectory: "coverage",
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  
  // 修正覆蓋率收集路徑
  collectCoverageFrom: [
    "src/**/*.{ts,js}",                   // ✅ 簡化路徑
    "!src/**/*.d.ts",
    "!src/types/**/*",
    "!src/swagger/**/*", 
    "!src/tests/**/*",
    "!src/server.ts",                     // 排除服務器啟動檔
    "!src/**/index.ts"                    // 排除索引檔
  ],
  
  // 設置覆蓋率門檻
  coverageThreshold: {
    global: {
      branches: 50,    // 先設較低門檻，逐步提高
      functions: 60,
      lines: 55,
      statements: 55
    }
  }
};
```

#### 2. 修正路徑映射
```javascript
moduleNameMapper: {
  "^@/(.*)$": "<rootDir>/../src/$1",      // 保持一致性
  "^@types/(.*)$": "<rootDir>/../src/types/$1",
  "^@services/(.*)$": "<rootDir>/../src/services/$1",
  "^@middleware/(.*)$": "<rootDir>/../src/middleware/$1",
  "^@utils/(.*)$": "<rootDir>/../src/utils/$1",
  "^@models/(.*)$": "<rootDir>/../src/models/$1",
  "^@controllers/(.*)$": "<rootDir>/../src/controllers/$1"
}
```

### 第二步：解決測試執行問題

#### 1. 分離長時間運行的測試
```javascript
// 在 package.json 中新增腳本
{
  "scripts": {
    "test:unit": "jest --testPathPattern=unit --coverage",
    "test:integration": "jest --testPathPattern=integration --runInBand --timeout=60000",
    "test:coverage": "jest --testPathPattern=unit --coverage --watchAll=false"
  }
}
```

#### 2. 修正超時測試
```typescript
// src/tests/integration/database-reliability.test.ts
describe('Database reliability', () => {
  it('should handle transaction timeout', async () => {
    await expect(
      prisma.$transaction(async (tx) => {
        // ❌ 移除 60 秒延遲
        // await new Promise(resolve => setTimeout(resolve, 60000));
        
        // ✅ 使用較短的延遲進行測試
        await new Promise(resolve => setTimeout(resolve, 100));
        
        return await tx.roles.create({
          data: { name: 'test-role' }
        });
      }, {
        timeout: 5000  // 5 秒超時
      })
    ).rejects.toThrow();
  }, 10000);  // 10 秒測試超時
});
```

#### 3. 改進測試隔離
```typescript
// 在每個測試檔案中
beforeEach(() => {
  jest.clearAllMocks();
  jest.resetModules();
  // 重置所有 mock 狀態
});

afterEach(() => {
  jest.restoreAllMocks();
});
```

### 第三步：驗證覆蓋率收集

#### 1. 執行單元測試覆蓋率
```bash
npm run test:unit
```

#### 2. 檢查覆蓋率報告
```bash
# 查看文字報告
cat coverage/lcov-report/index.html

# 在瀏覽器中檢視 HTML 報告
open coverage/lcov-report/index.html
```

#### 3. 分析具體覆蓋率
```bash
# 查看詳細的行覆蓋率
npx jest --coverage --coverageReporters=text-lcov | head -50
```

## 預期結果

### 修正後的預期覆蓋率
執行修正後，預期看到類似輸出：

```
----------|---------|----------|---------|---------|-------------------
File      | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
----------|---------|----------|---------|---------|-------------------
All files |   65.42 |    52.31 |   71.23 |   64.18 |                   
controllers/   |   72.15 |    58.44 |   78.95 |   71.32 |                   
 auth.controller.ts | 68.75 | 55.55 | 75.00 | 67.89 | 45,67,89,123
services/ |   61.23 |    48.76 |   66.32 |   60.11 |                   
 jwt.service.ts | 82.35 | 70.00 | 85.71 | 81.25 | 12,34
----------|---------|----------|---------|---------|-------------------
```

### 逐步提升目標
1. **第一階段**：達到 50% 整體覆蓋率
2. **第二階段**：達到 70% 整體覆蓋率  
3. **第三階段**：達到 80% 整體覆蓋率

## 常見問題與解決方案

### Q1: 為什麼某些檔案覆蓋率仍然是 0%？
**A**: 檢查是否：
- 檔案被正確 import
- 測試中實際調用了該檔案的函數
- Mock 配置沒有完全覆蓋實際程式碼

### Q2: 覆蓋率報告顯示空白
**A**: 檢查：
- Jest 配置路徑是否正確
- 是否有權限寫入 coverage 目錄
- TypeScript 編譯是否成功

### Q3: 某些分支覆蓋率很低
**A**: 需要：
- 增加錯誤情境測試
- 測試邊界條件
- 添加異常處理測試

## 實施檢查清單

- [ ] 修正 Jest 配置中的 `collectCoverage: true`
- [ ] 更新覆蓋率收集路徑
- [ ] 分離長時間運行的測試
- [ ] 修正超時測試
- [ ] 執行單元測試覆蓋率檢查
- [ ] 查看 HTML 覆蓋率報告
- [ ] 分析未覆蓋的程式碼行
- [ ] 逐步提升測試覆蓋率

---

**建議執行順序**：
1. 先修正 Jest 配置
2. 執行單元測試檢查覆蓋率
3. 根據報告逐步改進測試
4. 定期監控覆蓋率變化