# Code Review: src/services 目錄

## 執行摘要

針對 `src/services` 目錄下的服務層進行了全面的程式碼審查。整體而言，程式碼架構良好，採用了現代化的 TypeScript 開發模式，但仍有一些安全性和程式碼品質方面可以改進的地方。

## 架構評估

### 優點 ✅

1. **清晰的分層架構**
   - 服務層職責明確，專注於業務邏輯
   - 良好的關注點分離（Separation of Concerns）
   - 統一使用 Prisma ORM 進行資料庫操作

2. **TypeScript 採用**
   - 強型別定義提升程式碼可維護性
   - 完整的介面和型別定義
   - 良好的型別推斷使用

3. **錯誤處理機制**
   - 統一的錯誤處理模式
   - 自定義錯誤類別（NotFoundError, ForbiddenError 等）
   - 詳細的錯誤日誌記錄

4. **設計模式應用**
   - 單例模式（Singleton）用於資料庫連接
   - 工廠函數模式用於服務實例化
   - 依賴注入概念的實踐

### 需要改進的地方 ⚠️

## 安全性問題 🔒

### 1. JWT 服務安全性隱患

**位置**: `src/services/jwt.service.ts`

#### 問題 1: Console.log 洩漏敏感資訊
```typescript
// 第 68-72 行
console.log('verifyToken_token', token);  // ⚠️ 危險：記錄 JWT token
const decoded = jwt.verify(token, secret) as JwtPayload;
console.log('verifyToken', decoded);  // ⚠️ 危險：記錄解碼後的用戶資訊
```

**風險等級**: 高
**影響**: Token 和用戶資訊可能被記錄在日誌檔案中，造成安全風險

**建議修正**:
```typescript
// 移除或改用條件式日誌
if (process.env.NODE_ENV === 'development' && process.env.DEBUG_AUTH === 'true') {
  loggerService.debug('Token verification attempted');
  // 不記錄實際的 token 內容
}
```

#### 問題 2: 環境變數處理不一致
```typescript
// 第 33 行
const JWT_SECRET = process.env.JWT_SECRET || process.env.JWT_SECURITY;
```

**風險等級**: 中
**影響**: 使用多個環境變數名稱可能造成配置混亂

**建議**: 統一使用單一環境變數名稱 `JWT_SECRET`

### 2. 資源服務 SQL 注入風險

**位置**: `src/services/resource.service.ts`

#### 問題: 原生 SQL 查詢
```typescript
// 第 94-102 行
const tagResults = await prisma.$queryRaw<TagResult[]>`
  SELECT 
    t.id as tag_id,
    t.name as tag_name
  FROM entity_tags et
  INNER JOIN tags t ON et.tag_id = t.id
  WHERE et.entity_type = 'resource'
  AND et.entity_id::integer = ${resource.id}
`;
```

**風險等級**: 中
**影響**: 雖然使用了參數化查詢，但型別轉換 `::integer` 可能造成錯誤

**建議**: 
1. 優先使用 Prisma 的查詢建構器
2. 如必須使用原生 SQL，確保所有輸入都經過嚴格驗證

### 3. R2 服務權限控制

**位置**: `src/services/r2.service.ts`

#### 問題: ACL 設定為 public-read
```typescript
// 第 55 行
ACL: 'public-read' as const,
```

**風險等級**: 中
**影響**: 所有上傳的檔案都是公開可讀的

**建議**:
1. 根據檔案類型和用途設定不同的權限
2. 實作簽名 URL 機制以控制存取
3. 加入檔案類型和大小驗證

## 程式碼品質問題 📝

### 1. 重複程式碼

**問題**: Practice 服務中有大量重複的統計查詢邏輯

```typescript
// 第 712-838 行多個相似的方法
private async getReactionCounts(...) { /* 相似邏輯 */ }
private async getViewCounts(...) { /* 相似邏輯 */ }
private async getFavoriteCounts(...) { /* 相似邏輯 */ }
// ... 更多相似方法
```

**建議**: 抽象為通用方法
```typescript
private async getStatsCounts(
  type: 'reaction' | 'view' | 'favorite' | 'share' | 'comment',
  practiceIds: string[]
): Promise<Record<string, number>> {
  const modelMap = {
    reaction: this.prismaClient.reaction,
    view: this.prismaClient.view,
    // ...
  };
  // 通用邏輯
}
```

### 2. 錯誤處理不一致

**問題**: 某些服務捕獲錯誤後只記錄警告，不向上傳遞

```typescript
// practice.service.ts 第 595-597 行
} catch (error) {
  loggerService.warn('Failed to record view event', { practiceId, userId, error });
  // 錯誤被吞掉，呼叫者不知道操作失敗
}
```

**建議**: 
1. 關鍵操作的錯誤應該向上傳遞
2. 非關鍵操作可以記錄但繼續執行
3. 統一錯誤處理策略

### 3. 資料驗證不足

**問題**: 某些服務方法缺少輸入驗證

```typescript
// auth.service.ts
export const findUserByEmail = async (email: string) => {
  // 缺少 email 格式驗證
  const contact = await prisma.contacts.findFirst({
    where: { email },
    // ...
  });
```

**建議**: 使用 Zod 或其他驗證庫進行輸入驗證

## 效能問題 ⚡

### 1. N+1 查詢問題

**位置**: `resource.service.ts`

**問題**: 在循環中進行資料庫查詢
```typescript
// 潛在的 N+1 問題場景
// 雖然目前使用批量查詢，但要注意避免在其他地方出現
```

**建議**: 
1. 使用 Prisma 的 `include` 和 `select` 優化查詢
2. 實作 DataLoader 模式以批量載入關聯資料

### 2. 缺少快取機制

**問題**: 頻繁查詢的資料沒有快取

**建議**:
1. 為熱門資源實作 Redis 快取
2. 實作查詢結果快取策略
3. 使用 TTL 管理快取過期

### 3. 事務處理

**問題**: 某些複雜操作沒有使用事務

```typescript
// practice.service.ts - create 方法應該在事務中執行
async create(data: CreatePracticeRequest, userId: number) {
  // 多個資料庫操作應該包裝在事務中
  const practice = await this.prismaClient.practices.create(/*...*/);
  await this.linkTags(/*...*/);  // 如果失敗，practice 已經創建
  await this.linkResources(/*...*/);  // 如果失敗，前面的操作無法回滾
}
```

**建議**: 使用 Prisma 事務
```typescript
return await this.prismaClient.$transaction(async (tx) => {
  const practice = await tx.practices.create(/*...*/);
  await this.linkTags(practice.id, data.tags, tx);
  await this.linkResources(practice.id, data.resources, userId, tx);
  return practice;
});
```

## 可維護性問題 🔧

### 1. 魔術數字和字串

**問題**: 硬編碼的值散布在程式碼中

```typescript
// jwt.service.ts
const JWT_EXPIRATION = '7d';  // 應該從環境變數讀取

// practice.service.ts
const take = Math.min(limit, 100);  // 100 應該是常數
```

**建議**: 建立 constants 檔案集中管理

### 2. 日誌記錄不一致

**問題**: 不同服務使用不同的日誌模式

**建議**:
1. 統一日誌格式和等級
2. 實作結構化日誌
3. 加入請求追蹤 ID

### 3. 測試覆蓋率

**問題**: 缺少單元測試和整合測試

**建議**:
1. 為每個服務編寫單元測試
2. 模擬外部依賴
3. 測試錯誤場景

## 具體改進建議 📋

### 優先級高 (立即處理)

1. **移除所有 console.log 敏感資訊輸出**
   - 檔案: `jwt.service.ts`
   - 預估時間: 1 小時

2. **實作事務處理**
   - 檔案: `practice.service.ts`, `resource.service.ts`
   - 預估時間: 3 小時

3. **加強輸入驗證**
   - 所有服務的公開方法
   - 預估時間: 4 小時

### 優先級中 (本週內處理)

1. **實作快取層**
   - 使用現有的 Redis 服務
   - 預估時間: 1 天

2. **重構重複程式碼**
   - Practice 服務的統計方法
   - 預估時間: 4 小時

3. **統一錯誤處理**
   - 建立錯誤處理中介層
   - 預估時間: 4 小時

### 優先級低 (計劃內處理)

1. **加入單元測試**
   - 覆蓋率目標: 80%
   - 預估時間: 1 週

2. **效能優化**
   - 資料庫查詢優化
   - 預估時間: 3 天

3. **文件完善**
   - API 文件和使用範例
   - 預估時間: 2 天

## 安全性檢查清單 ✓

- [ ] 移除所有敏感資訊的日誌輸出
- [ ] 實作適當的存取控制
- [ ] 加強輸入驗證和消毒
- [ ] 使用參數化查詢防止 SQL 注入
- [ ] 實作速率限制
- [ ] 加密敏感資料
- [ ] 實作安全的檔案上傳
- [ ] 定期更新依賴套件

## 結論

整體而言，服務層的架構設計良好，採用了 TypeScript 和現代化的開發實踐。主要需要關注的是：

1. **安全性增強**: 特別是 JWT 處理和日誌記錄
2. **程式碼品質**: 減少重複，統一模式
3. **效能優化**: 加入快取，優化查詢
4. **測試覆蓋**: 增加單元和整合測試

建議按照優先級逐步改進，優先處理安全性相關的問題。

## 附錄: 服務依賴關係圖

```
┌─────────────────┐
│   Controllers   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Services     │
├─────────────────┤
│ - auth          │ ──────► JWT Service
│ - resource      │ ──────► Transform Service
│ - practice      │ ──────► Tag Service
│ - user          │
│ - email         │ ──────► Template Service
│ - r2            │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Database     │
├─────────────────┤
│ - Prisma        │
│ - MongoDB       │
│ - Redis         │
└─────────────────┘
```

---

**審查人**: Claude AI Assistant  
**審查日期**: 2025-08-11  
**下次審查建議**: 實施改進後 2 週內