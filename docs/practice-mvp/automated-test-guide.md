# 主題實踐功能 - 自動化測試指南

> 版本：1.0.0
> 最後更新：2025-01-27

---

## 目錄

1. [測試結構概覽](#測試結構概覽)
2. [執行測試](#執行測試)
3. [測試檔案說明](#測試檔案說明)
4. [測試涵蓋範圍](#測試涵蓋範圍)
5. [Mock 策略](#mock-策略)
6. [擴展測試](#擴展測試)

---

## 測試結構概覽

```
tests/
├── setup.ts                                    # 全域測試設定
├── utils/
│   ├── api-helpers.ts                         # API 測試輔助函數
│   ├── prisma-mock.ts                         # Prisma Mock 工具
│   └── test-factories.ts                      # 測試資料工廠
├── unit/
│   └── services/
│       ├── practice.service.test.ts           # 實踐服務單元測試
│       └── practice-checkin.service.test.ts   # 打卡服務單元測試
├── integration/
│   └── practice/
│       ├── practice.integration.test.ts       # 實踐管理 API 整合測試
│       ├── practice-checkin.integration.test.ts # 打卡功能整合測試
│       ├── practice-helpers.integration.test.ts # 輔助功能整合測試
│       └── practice-business-logic.test.ts    # 業務邏輯驗證測試
└── e2e/
    └── practice/
        └── practice-flow.e2e.test.ts          # 端對端流程測試
```

---

## 執行測試

### 執行所有測試

```bash
pnpm test
```

### 執行特定測試檔案

```bash
# 單元測試
pnpm test tests/unit/services/practice.service.test.ts

# 整合測試
pnpm test tests/integration/practice/

# E2E 測試
pnpm test tests/e2e/practice/
```

### 執行特定測試案例

```bash
# 使用 -t 參數匹配測試名稱
pnpm test -t "建立實踐"
pnpm test -t "進度計算"
```

### 產生覆蓋率報告

```bash
pnpm test --coverage
```

### 監視模式

```bash
pnpm test --watch
```

---

## 測試檔案說明

### 1. 單元測試 (Unit Tests)

**`practice.service.test.ts`**

測試實踐服務的業務邏輯：

- `findAll` - 列表查詢和篩選
- `findById` - 詳情查詢
- `create` - 建立實踐
- `update` - 更新實踐
- `deleteFunction` - 軟刪除
- `getUserStats` - 統計資訊

**`practice-checkin.service.test.ts`**

測試打卡服務的業務邏輯：

- `createCheckIn` - 建立打卡記錄
- `getCheckIns` - 查詢打卡記錄
- `calculateStreak` - 連續打卡計算
- `updatePracticeProgress` - 進度更新
- `validateDailyCheckIn` - 每日打卡驗證
- `getMonthlyCheckInCalendar` - 月度日曆

### 2. 整合測試 (Integration Tests)

**`practice.integration.test.ts`**

對應手動測試計畫 A-1 ~ A-7：

| 測試案例 | 說明 |
|---------|------|
| A-1-a ~ A-1-f | 建立實踐（各種情境） |
| A-2-a ~ A-2-e | 取得實踐列表（篩選和排序） |
| A-3-a ~ A-3-d | 取得我的實踐列表 |
| A-4-a ~ A-4-d | 取得實踐詳情 |
| A-5-a ~ A-5-i | 更新實踐（含鎖定機制） |
| A-6-a ~ A-6-d | 刪除實踐 |
| A-7 | 取得統計資訊 |

**`practice-checkin.integration.test.ts`**

對應手動測試計畫 B-1 ~ B-5：

| 測試案例 | 說明 |
|---------|------|
| B-1-a ~ B-1-l | 建立打卡記錄（含心情選項） |
| B-2 | 提早打卡日期位移 |
| B-3-a ~ B-3-d | 取得打卡記錄列表 |
| B-4 | 取得打卡統計 |
| B-5-a ~ B-5-c | 取得月度日曆 |

**`practice-helpers.integration.test.ts`**

對應手動測試計畫 C-1 ~ E-2：

| 測試案例 | 說明 |
|---------|------|
| C-1-a ~ C-1-c | 點讚/取消點讚 |
| C-2-a ~ C-2-b | 收藏/取消收藏 |
| C-3 | 記錄分享事件 |
| C-4 | 記錄瀏覽事件 |
| C-5 | 取得互動統計 |
| C-6 | 取得用戶互動狀態 |
| D-1-a ~ D-1-c | 取得模板列表 |
| D-2-a ~ D-2-b | 取得單一模板 |
| D-3 | 取得隨機鼓勵句 |
| D-4-a ~ D-4-d | 取得引導句列表 |
| E-1-a ~ E-1-e | 封存實踐 |
| E-2-a ~ E-2-b | 取消封存 |

**`practice-business-logic.test.ts`**

對應手動測試計畫 BL-1 ~ BL-4：

| 測試案例 | 說明 |
|---------|------|
| BL-1 | 進度計算驗證（20% → 50% → 100%+） |
| BL-2 | 狀態轉換驗證 |
| BL-3 | 打卡鎖定機制驗證 |
| BL-4 | 日期位移驗證 |

### 3. E2E 測試 (End-to-End Tests)

**`practice-flow.e2e.test.ts`**

模擬完整用戶流程：

| 測試情境 | 說明 |
|---------|------|
| 完整實踐生命週期 | 建立 → 打卡 → 達成目標 |
| 驗證錯誤 (ERR-1) | 缺少欄位、超長文字、無效值 |
| 權限錯誤 (ERR-2) | 未登入、存取他人資源 |
| 資源不存在 (ERR-3) | 404 錯誤處理 |
| 業務邏輯錯誤 (ERR-4) | 重複打卡、鎖定欄位、無效狀態 |
| Email 觸發驗證 | PE01、PE02 郵件觸發 |
| 邊界條件測試 | 最大值、最小值驗證 |

---

## 測試涵蓋範圍

### API 端點覆蓋

| 端點 | 方法 | 測試狀態 |
|------|------|---------|
| `/api/v1/practices` | GET | ✅ |
| `/api/v1/practices` | POST | ✅ |
| `/api/v1/practices/me` | GET | ✅ |
| `/api/v1/practices/stats` | GET | ✅ |
| `/api/v1/practices/:id` | GET | ✅ |
| `/api/v1/practices/:id` | PUT | ✅ |
| `/api/v1/practices/:id` | DELETE | ✅ |
| `/api/v1/practices/:id/checkins` | POST | ✅ |
| `/api/v1/practices/:id/checkins` | GET | ✅ |
| `/api/v1/practices/:id/checkins/stats` | GET | ✅ |
| `/api/v1/practices/:id/checkins/calendar/:year/:month` | GET | ✅ |
| `/api/v1/practices/:id/like` | POST | ✅ |
| `/api/v1/practices/:id/favorite` | POST | ✅ |
| `/api/v1/practices/:id/share` | POST | ✅ |
| `/api/v1/practices/:id/view` | POST | ✅ |
| `/api/v1/practices/:id/stats` | GET | ✅ |
| `/api/v1/practices/:id/user-status` | GET | ✅ |
| `/api/v1/practices/:id/archive` | POST | ✅ |
| `/api/v1/practices/:id/unarchive` | POST | ✅ |
| `/api/v1/practices/templates` | GET | ✅ |
| `/api/v1/practices/templates/:id` | GET | ✅ |
| `/api/v1/checkin-encouragements/random` | GET | ✅ |
| `/api/v1/tag-prompts` | GET | ✅ |

### 業務邏輯覆蓋

| 邏輯 | 測試狀態 |
|------|---------|
| 進度計算公式 | ✅ |
| 狀態轉換流程 | ✅ |
| 打卡鎖定機制 | ✅ |
| 日期位移邏輯 | ✅ |
| Email 觸發時機 | ✅ |
| 權限驗證 | ✅ |
| 輸入驗證 | ✅ |

---

## Mock 策略

### 資料庫 Mock

使用 `jest-mock-extended` 建立 Prisma Client 深度 Mock：

```typescript
import { prismaMock, setupTransactionMock } from '@tests/utils/prisma-mock';

beforeEach(() => {
  setupTransactionMock();
});

// 模擬查詢結果
prismaMock.practices.findUnique.mockResolvedValue(mockPractice);
```

### API 測試客戶端

使用 `supertest` 和自訂輔助函數：

```typescript
import { apiClient, createAuthToken, expectSuccess, expectError } from '@tests/utils/api-helpers';

const userToken = createAuthToken({ id: 1, email: 'test@test.com' });

// 帶認證的請求
const response = await apiClient({ token: userToken })
  .post('/api/v1/practices', practiceData);

// 斷言
expectSuccess(response, 201);
```

### Email 隊列 Mock

```typescript
const mockEmailQueue = {
  add: jest.fn().mockResolvedValue({ id: 'job-id' })
};

jest.mock('@/queues/practice-email.queue', () => ({
  practiceEmailQueue: mockEmailQueue
}));

// 驗證郵件觸發
expect(mockEmailQueue.add).toHaveBeenCalledWith('PE01', expect.any(Object));
```

---

## 擴展測試

### 新增測試案例

1. 在對應的測試檔案中新增 `describe` 或 `it` 區塊
2. 使用現有的 Mock 工具和輔助函數
3. 遵循 AAA 模式（Arrange, Act, Assert）

```typescript
it('應該執行某個行為', async () => {
  // Arrange: 準備測試資料和 Mock
  const mockData = { ... };
  prismaMock.practices.findUnique.mockResolvedValue(mockData);

  // Act: 執行測試動作
  const response = await apiClient({ token: userToken })
    .get('/api/v1/practices/1');

  // Assert: 驗證結果
  expectSuccess(response);
  expect(response.body.data.title).toBe('預期標題');
});
```

### 新增測試輔助函數

在 `tests/utils/` 中擴展：

```typescript
// tests/utils/api-helpers.ts
export const expectPracticeResponse = (data: any) => {
  expect(data).toHaveProperty('id');
  expect(data).toHaveProperty('title');
  expect(data).toHaveProperty('status');
  expect(data).toHaveProperty('progressPercentage');
};
```

### 新增測試資料工廠

在 `tests/utils/test-factories.ts` 中擴展：

```typescript
export const createTestCheckIn = (overrides: Partial<any> = {}) => ({
  id: getNextId(),
  practice_id: 1,
  user_id: 1,
  checkin_date: new Date(),
  mood: 'happy',
  note: '',
  ...overrides
});
```

---

## 常見問題

### Q: 測試執行很慢？

使用 `--runInBand` 序列執行，或使用 `--maxWorkers=4` 限制並行數量。

### Q: Mock 資料不正確？

確認 `beforeEach` 中正確重置 Mock：

```typescript
beforeEach(() => {
  jest.clearAllMocks();
  setupTransactionMock();
});
```

### Q: 如何調試測試？

使用 `DEBUG_TESTS=true` 環境變數啟用 console 輸出：

```bash
DEBUG_TESTS=true pnpm test tests/integration/practice/
```

---

## 相關文件

- [手動測試計畫](./manual-test-plan.md)
- [後端實作計畫](./backend-implementation-plan.md)
- [Jest 配置](../../jest.config.js)
