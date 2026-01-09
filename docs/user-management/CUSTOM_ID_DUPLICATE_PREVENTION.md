# 自訂 ID 重複防護策略

## 現有防護機制

### 資料庫層級
- ✅ UNIQUE 約束：`custom_id String? @unique @db.VarChar(50)`
- ✅ 交易處理：使用 `prisma.$transaction` 確保原子性

### 應用層級
- ✅ 重複性檢查：設置前查詢是否已存在
- ✅ 格式驗證：防止無效 ID
- ✅ 錯誤處理：明確的衝突錯誤訊息

## 潛在風險與改進

### 1. 競態條件風險

**問題場景：**
```
時間軸：
用戶A: checkCustomIdAvailability("testid") -> 可用
用戶B: checkCustomIdAvailability("testid") -> 可用  
用戶A: setCustomId("testid") -> 成功
用戶B: setCustomId("testid") -> 資料庫 UNIQUE 約束錯誤
```

**影響：**
- 用戶B 會收到資料庫層級的約束違反錯誤
- 錯誤訊息可能不夠友善

### 2. 建議改進方案

#### A. 資料庫索引優化
```sql
-- 建立高效能的唯一索引
CREATE UNIQUE INDEX CONCURRENTLY idx_users_custom_id_unique 
ON users(custom_id) WHERE custom_id IS NOT NULL;

-- 建立部分索引加速查詢
CREATE INDEX CONCURRENTLY idx_users_custom_id_verified 
ON users(custom_id_verified) WHERE custom_id_verified = true;
```

#### B. 應用層改進

**方案 1: 增強錯誤處理**
```typescript
const setCustomId = async (userId: number, customId: string) => {
  try {
    return await prisma.$transaction(async (tx) => {
      // ... 現有邏輯
    });
  } catch (error) {
    // 處理 Prisma 的 P2002 唯一約束違反錯誤
    if (error.code === 'P2002' && error.meta?.target?.includes('custom_id')) {
      throw new ConflictError('此自訂 ID 已被其他用戶使用，請選擇其他 ID');
    }
    throw error;
  }
};
```

**方案 2: 樂觀鎖定**
```typescript
const setCustomIdWithRetry = async (userId: number, customId: string, maxRetries = 3) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await setCustomId(userId, customId);
    } catch (error) {
      if (error instanceof ConflictError && attempt < maxRetries - 1) {
        // 短暫延遲後重試
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
        continue;
      }
      throw error;
    }
  }
};
```

**方案 3: 更嚴格的檢查**
```typescript
const setCustomId = async (userId: number, customId: string) => {
  return await prisma.$transaction(async (tx) => {
    // 使用 FOR UPDATE 鎖定相關記錄
    const existingUser = await tx.users.findUnique({
      where: { custom_id: customId },
      // 注意：Prisma 目前不直接支援 FOR UPDATE
      // 可考慮使用原生 SQL 查詢
    });

    if (existingUser) {
      throw new ConflictError('此自訂 ID 已被使用');
    }

    // ... 設置邏輯
  }, {
    isolationLevel: 'Serializable' // 最高隔離級別
  });
};
```

#### C. 前端配合策略

**即時驗證：**
- 用戶輸入時即時檢查可用性
- 防抖動處理（debounce）減少 API 呼叫
- 提供建議的替代 ID

**使用者體驗：**
```javascript
// 前端示例
const checkAvailabilityWithDebounce = debounce(async (customId) => {
  const response = await fetch(`/api/v1/users/custom-id/check/${customId}`);
  const result = await response.json();
  
  if (!result.data.available) {
    showSuggestions(generateSuggestions(customId));
  }
}, 500);
```

### 3. 監控與警報

**競態條件偵測：**
```typescript
// 記錄重複衝突事件
const logConflictEvent = (customId: string, userId: number) => {
  logger.warn('Custom ID conflict detected', {
    customId,
    userId,
    timestamp: new Date().toISOString(),
    event: 'custom_id_conflict'
  });
};
```

**效能監控：**
- 監控 custom_id 查詢的回應時間
- 追蹤衝突錯誤的發生頻率
- 設置警報閾值

### 4. 建議實作優先級

#### 立即實作（高優先級）
1. **增強錯誤處理** - 捕獲並友善化 Prisma 約束錯誤
2. **資料庫索引** - 建立專門的唯一索引

#### 中期實作（中優先級）
3. **監控機制** - 記錄衝突事件和效能指標
4. **前端防抖** - 改善使用者體驗

#### 長期考慮（低優先級）
5. **樂觀鎖定** - 在高併發場景下實作
6. **更嚴格的隔離** - 評估效能影響後決定

## 結論

現有的實作已經具備基本的重複防護機制，主要透過：
- 資料庫 UNIQUE 約束（最後防線）
- 交易內的重複檢查（主要防護）

對於大多數使用場景，這已足夠安全。如需處理高併發場景，建議優先實作增強錯誤處理和資料庫索引優化。