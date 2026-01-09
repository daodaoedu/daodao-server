# 前端 API 使用澄清

## 重要澄清

根據用戶確認：**前端應該只會打 `users/me`**

這意味著問題範圍可以大幅簡化，焦點應該集中在確保 `GET /api/v1/users/me` 端點的類型定義完整和正確。

## 簡化後的問題分析

### 主要問題
前端調用 `GET /api/v1/users/me` 時，生成的 TypeScript 類型中缺少 `contactList` 字段定義。

### 問題根源定位

#### 1. 路由響應映射問題
```typescript
// scripts/generate-swagger.ts:565
'GET:/api/v1/users/me': 'api-response.validators_authUserUpdateResponseExample', // ❌ 使用錯誤的 schema
```

**應該使用：**
```typescript
'GET:/api/v1/users/me': 'user.validators_userSuccessResponseSchema', // ✅ 包含完整 contactList
```

#### 2. Schema 定義不匹配
當前映射的 `authUserUpdateResponseExample` 不包含 `contactList`，而實際 `userSuccessResponseSchema` 包含完整的用戶資料結構。

### 受影響範圍（簡化）

由於前端只使用 `users/me`，以下端點的類型不一致問題優先級較低：

- ❌ ~~`GET /api/v1/me/profile`~~ (前端不使用)
- ❌ ~~`POST /api/v1/users`~~ (如果前端不調用)
- ❌ ~~`PUT /api/v1/users/:id`~~ (如果前端不調用)

### 立即修復方案

#### 步驟 1：修正路由響應映射
```typescript
// 在 scripts/generate-swagger.ts 中修改
const routeResponseMapping: Record<string, string> = {
  // 修正這一行
  'GET:/api/v1/users/me': 'user.validators_userSuccessResponseSchema', // ✅ 使用包含 contactList 的完整 schema
  
  // 其他映射保持不變...
};
```

#### 步驟 2：確保 userSuccessResponseSchema 包含 contactList
檢查 `src/validators/user.validators.ts` 中的 `formattedUserResponseSchema` 是否包含完整的 `contactList` 定義。

#### 步驟 3：重新生成 OpenAPI 和前端類型
```bash
pnpm run types:generate
```

### 驗證方案

1. **檢查生成的 OpenAPI 定義**
   ```bash
   # 檢查 generated/openapi-types.ts 中是否包含 contactList
   grep -A 20 "users.*me" generated/openapi-types.ts
   ```

2. **測試實際 API 響應**
   ```bash
   curl -H "Authorization: Bearer $JWT_TOKEN" http://localhost:4000/api/v1/users/me
   ```

3. **驗證前端類型**
   確保前端生成的類型包含 `contactList` 字段。

### 為什麼之前的分析過於複雜

1. **過度分析了不相關的端點**：如 `/api/v1/me/profile`
2. **假設了不存在的使用場景**：如 `POST /api/v1/users` 的前端調用
3. **複雜化了解決方案**：提出了大範圍的架構重構

### 實際需要的修復

**只需要一行代碼的修改**：
```diff
// scripts/generate-swagger.ts
- 'GET:/api/v1/users/me': 'api-response.validators_authUserUpdateResponseExample',
+ 'GET:/api/v1/users/me': 'user.validators_userSuccessResponseSchema',
```

然後重新生成類型定義即可。

## 後續建議

1. **優先修復 `/users/me` 端點**的類型定義
2. **驗證修復效果**：確保前端能正確獲得 `contactList` 類型
3. **如有需要**，再考慮其他端點的類型統一問題

這種針對性的修復方式更加高效，避免了不必要的架構調整。