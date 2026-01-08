# 服務、類型與驗證器實作任務清單

基於 `SERVICES_TYPES_VALIDATORS_AUDIT.md` 的全面性審查，本文件提供結構化的實作計畫，完成所有服務缺少的類型與驗證器。

## 🎯 實作優先級矩陣

### 第一階段：高優先級 - 核心業務邏輯（立即執行）
**時程：第1-2週**

#### 任務 1.1：完成 Milestone 服務
- **檔案**：`src/validators/milestone.validators.ts`
- **狀態**：❌ 缺失
- **相依性**：✅ 服務存在，✅ 類型存在
- **工作量**：低（1-2小時）
- **業務影響**：高

#### 任務 1.2：完成 Tag 服務
- **檔案**：
  - `src/types/tag.types.ts`
  - `src/validators/tag.validators.ts`
- **狀態**：❌ 兩者皆缺失
- **相依性**：✅ 服務存在
- **工作量**：中（4-6小時）
- **業務影響**：高

#### 任務 1.3：完成 Transform 服務
- **檔案**：`src/validators/transform.validators.ts`
- **狀態**：❌ 缺失
- **相依性**：✅ 服務存在，✅ 類型存在
- **工作量**：低（1-2小時）
- **業務影響**：中

### 第二階段：中優先級 - Practice 子系統（第3-4週）
**時程：第3-4週**

#### 任務 2.1：Practice Checkin 服務
- **檔案**：
  - `src/types/practice-checkin.types.ts`
  - `src/validators/practice-checkin.validators.ts`
- **狀態**：❌ 兩者皆缺失
- **相依性**：✅ 服務存在
- **工作量**：中（3-4小時）
- **業務影響**：中

#### 任務 2.2：Practice Event 服務
- **檔案**：
  - `src/types/practice-event.types.ts`
  - `src/validators/practice-event.validators.ts`
- **狀態**：❌ 兩者皆缺失
- **相依性**：✅ 服務存在
- **工作量**：中（3-4小時）
- **業務影響**：中

#### 任務 2.3：Practice Interaction 服務
- **檔案**：
  - `src/types/practice-interaction.types.ts`
  - `src/validators/practice-interaction.validators.ts`
- **狀態**：❌ 兩者皆缺失
- **相依性**：✅ 服務存在
- **工作量**：中（3-4小時）
- **業務影響**：中

### 第三階段：低優先級 - 基礎設施服務（第5-6週）
**時程：第5-6週**

#### 任務 3.1：ID Converter 服務
- **檔案**：
  - `src/types/id-converter.types.ts`
  - `src/validators/id-converter.validators.ts`
- **狀態**：❌ 兩者皆缺失
- **相依性**：✅ 服務存在
- **工作量**：低（2-3小時）
- **業務影響**：低
- **備註**：考慮工具服務是否需要驗證器

#### 任務 3.2：JWT 服務
- **檔案**：
  - `src/types/jwt.types.ts`
  - `src/validators/jwt.validators.ts`
- **狀態**：❌ 兩者皆缺失
- **相依性**：✅ 服務存在
- **工作量**：低（2-3小時）
- **業務影響**：低
- **備註**：可能與 auth.types.ts 重疊

#### 任務 3.3：R2 儲存服務
- **檔案**：
  - `src/types/r2.types.ts`
  - `src/validators/r2.validators.ts`
- **狀態**：❌ 兩者皆缺失
- **相依性**：✅ 服務存在
- **工作量**：中（3-4小時）
- **業務影響**：低
- **備註**：檔案上傳驗證對安全性重要

### 第四階段：程式碼品質與維護（第7週）

#### 任務 4.1：命名一致性審查
- **動作**：標準化驗證器檔案命名
- **當前問題**：
  - `resource.validator.ts` → 應為 `resource.validators.ts`
  - `resource-review.validator.ts` → 應為 `resource-review.validators.ts`
  - `request-params.validator.ts` → 應為 `request-params.validators.ts`
- **工作量**：低（1小時）
- **需重新命名檔案**：3個檔案

#### 任務 4.2：使用情況分析
- **動作**：驗證所有類型/驗證器是否實際被匯入與使用
- **分析檔案**：所有現有驗證器（34個檔案）
- **工作量**：中（4-6小時）
- **交付項目**：使用情況報告，識別未使用的檔案

#### 任務 4.3：整合測試
- **動作**：確保所有新驗證器與路由正確搭配運作
- **範圍**：所有新建立的驗證器
- **工作量**：中（6-8小時）
- **相依性**：完成第1-3階段

## 📋 詳細任務分解

### 任務範本

#### 缺失類型檔案：
```typescript
// 新類型檔案的範本結構
export interface [ServiceName]CreateRequest {
  // 基於服務分析的欄位
}

export interface [ServiceName]UpdateRequest {
  // 基於服務分析的欄位
}

export interface [ServiceName]Response {
  // 基於服務的回傳類型
}

export interface [ServiceName]ListQuery {
  // 列表操作的查詢參數
}
```

#### 缺失驗證器檔案：
```typescript
// 新驗證器檔案的範本結構
import { z } from 'zod';

export const create[ServiceName]Schema = z.object({
  // 驗證規則
});

export const update[ServiceName]Schema = z.object({
  // 驗證規則
});

export const [serviceName]QuerySchema = z.object({
  // 查詢驗證
});

// 類型推斷
export type Create[ServiceName]Request = z.infer<typeof create[ServiceName]Schema>;
export type Update[ServiceName]Request = z.infer<typeof update[ServiceName]Schema>;
```

## 🔍 品質保證檢核清單

### 實作前
- [ ] 分析現有服務功能以了解輸入/輸出
- [ ] 檢查當前路由實作的驗證需求
- [ ] 檢視相關 Prisma 模型的欄位要求
- [ ] 識別現有驗證器的常見模式

### 實作中
- [ ] 遵循現有程式碼慣例與模式
- [ ] 使用與其他驗證器一致的命名
- [ ] 包含完整的 JSDoc 文件
- [ ] 為驗證失敗加入適當的錯誤訊息
- [ ] 使用實際服務呼叫進行測試

### 實作後
- [ ] 執行 `pnpm run typecheck` 驗證 TypeScript 編譯
- [ ] 執行 `pnpm run lint` 檢查程式碼品質
- [ ] 更新路由檔案以使用新驗證器
- [ ] 為新驗證邏輯加入整合測試
- [ ] 如需要則更新 API 文件

## 📊 進度追蹤

### 整體進度
- **總缺失項目**：16個檔案
- **高優先級**：3個檔案（milestone, tag x2, transform）
- **中優先級**：6個檔案（practice 子系統）
- **低優先級**：6個檔案（基礎設施）
- **維護作業**：4項任務

### 成功指標
1. **程式碼涵蓋率**：所有服務都有對應的類型與驗證器
2. **類型安全性**：TypeScript 編譯零錯誤
3. **API 一致性**：所有路由使用適當驗證
4. **命名慣例**：一致的 `.validators.ts` 後綴
5. **文件**：所有新檔案具備適當的 JSDoc

## 🚀 開始實作

### 前置條件
```bash
# 確保開發環境已準備就緒
pnpm install
pnpm run prisma:generate
pnpm run typecheck
```

### 建議工作流程
1. **從第一階段任務 1.1 開始**（milestone validators）
2. **每個服務先建立類型，再建立驗證器**
3. **每次實作後立即測試**
4. **更新路由**以使用新驗證器
5. **執行品質檢查**後再進行下一個任務

### 檔案組織
```
src/
├── types/
│   ├── milestone.types.ts        ✅（存在）
│   ├── tag.types.ts             ❌（需建立）
│   └── practice-*.types.ts      ❌（需建立）
├── validators/
│   ├── milestone.validators.ts   ❌（需建立）
│   ├── tag.validators.ts        ❌（需建立）
│   └── practice-*.validators.ts ❌（需建立）
└── services/
    └── [所有服務皆存在]          ✅
```

## 📝 備註

### 架構決策
- **Zod 而非 Joi**：與現有程式碼庫保持一致，繼續使用 Zod
- **類型推斷**：使用 `z.infer<typeof schema>` 進行類型產生
- **驗證中介軟體**：遵循 auth/user validators 的既有模式
- **錯誤處理**：使用標準化的 API 回應格式

### 潛在整合機會
- **Practice 服務**：考慮子服務是否可共享類型
- **資料庫服務**：可能不需要獨立驗證器
- **Auth 子服務**：已適當共享 auth 類型

### 風險緩解
- **向後相容性**：確保現有 API 端點持續運作
- **效能影響**：驗證新驗證器不會顯著減慢請求速度
- **測試涵蓋率**：優先處理高用戶流量的服務

---

*文件由服務審查產生 - 最後更新：2025-09-04*
*優先級矩陣基於業務影響與技術相依性*