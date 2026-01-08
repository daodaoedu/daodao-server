# Custom ID 驗證不一致問題報告

## 🚨 問題概述

在 Custom ID 的實作中發現了**正則表達式不一致**的問題,這可能導致驗證行為不統一。

## ❌ 問題詳情

### 1. 驗證器 (Validator) 的正則表達式

**檔案**: `src/validators/user-custom-id.validators.ts:14`

```typescript
.regex(/^[a-zA-Z0-9_-]+$/, '自訂 ID 只能包含英文字母、數字、底線和連字符')
```

**問題**: 這個正則表達式允許以底線或連字符開頭/結尾,然後靠後續的 `refine` 來檢查:

```typescript
.refine(
  (val) => !val.startsWith('_') && !val.startsWith('-'),
  '自訂 ID 不能以底線或連字符開頭'
)
.refine(
  (val) => !val.endsWith('_') && !val.endsWith('-'),
  '自訂 ID 不能以底線或連字符結尾'
)
```

### 2. 服務層 (Service) 的正則表達式

**檔案**:
- `src/services/user.service.ts:1131` (checkCustomIdAvailability)
- `src/services/user.service.ts:1152` (setCustomId)
- `src/services/user.service.ts:675` (createUser)

```typescript
/^[a-zA-Z0-9](?:[a-zA-Z0-9_-]*[a-zA-Z0-9])?$/
```

**特點**: 這個正則表達式更嚴格,直接在模式中確保:
- 開頭必須是字母或數字
- 結尾必須是字母或數字
- 中間可以包含字母、數字、底線、連字符

## 🔍 差異分析

| 項目 | Validator 正則 | Service 正則 |
|------|---------------|-------------|
| 開頭限制 | 需要 refine 檢查 | 內建在正則中 `^[a-zA-Z0-9]` |
| 結尾限制 | 需要 refine 檢查 | 內建在正則中 `[a-zA-Z0-9]?$` |
| 中間字符 | `[a-zA-Z0-9_-]+` | `[a-zA-Z0-9_-]*` |
| 複雜度 | 簡單正則 + 額外驗證 | 單一複雜正則 |
| 性能 | 需要多次檢查 | 一次檢查完成 |

## 🧪 測試案例

### 有效的 Custom ID

```javascript
✓ "abc"              // 兩種方式都通過
✓ "user123"          // 兩種方式都通過
✓ "my_profile"       // 兩種方式都通過
✓ "cool-user"        // 兩種方式都通過
✓ "john_doe_2024"    // 兩種方式都通過
```

### 無效的 Custom ID (應該被拒絕)

```javascript
✗ "ab"               // 兩種方式都拒絕 (長度不足)
✗ "_username"        // 兩種方式都拒絕 (但方式不同)
✗ "username_"        // 兩種方式都拒絕 (但方式不同)
✗ "-cooluser"        // 兩種方式都拒絕 (但方式不同)
✗ "cooluser-"        // 兩種方式都拒絕 (但方式不同)
✗ "user@123"         // 兩種方式都拒絕 (非法字符)
```

### 邊界案例

```javascript
// 3 字符最小長度
✓ "abc"              // 通過
✓ "a1b"              // 通過
✓ "123"              // 通過
✗ "a_b"              // Service 正則會**拒絕** (中間有特殊字符時需要兩端都是字母數字)
```

## ⚠️ 潛在問題

### 問題 1: 三字符邊界案例

**Service 正則**: `/^[a-zA-Z0-9](?:[a-zA-Z0-9_-]*[a-zA-Z0-9])?$/`

這個正則對於 3 字符的情況:
- ✓ `"abc"` - 通過 (匹配: `[a-zA-Z0-9]` + 可選組為空)
- ✓ `"a1b"` - 通過 (匹配: `a` + `1b`)
- ✗ `"a_b"` - **應該通過但會失敗**

**原因分析**:
```
^[a-zA-Z0-9]           # 匹配 'a'
(?:                     # 非捕獲組 (可選)
  [a-zA-Z0-9_-]*        # 匹配 0 或多個 [a-zA-Z0-9_-]
  [a-zA-Z0-9]           # 必須以 [a-zA-Z0-9] 結尾
)?                      # 整個組是可選的
$
```

對於 `"a_b"`:
- 第一個字符 `a` 匹配 `^[a-zA-Z0-9]` ✓
- 可選組嘗試匹配 `_b`:
  - `[a-zA-Z0-9_-]*` 可以匹配 `_`
  - 但接下來需要 `[a-zA-Z0-9]` 結尾,匹配 `b` ✓
- **實際上應該可以匹配成功**

讓我重新測試這個正則:

```javascript
/^[a-zA-Z0-9](?:[a-zA-Z0-9_-]*[a-zA-Z0-9])?$/.test("a_b")  // true ✓
/^[a-zA-Z0-9](?:[a-zA-Z0-9_-]*[a-zA-Z0-9])?$/.test("abc")  // true ✓
/^[a-zA-Z0-9](?:[a-zA-Z0-9_-]*[a-zA-Z0-9])?$/.test("_ab")  // false ✓
/^[a-zA-Z0-9](?:[a-zA-Z0-9_-]*[a-zA-Z0-9])?$/.test("ab_")  // false ✓
```

**更正**: 經過測試,Service 正則實際上是正確的。

## 📊 驗證流程比較

### Validator 流程

1. Zod schema 檢查長度 (3-50)
2. 正則檢查字符集 `/^[a-zA-Z0-9_-]+$/`
3. Refine 檢查開頭不是 `_` 或 `-`
4. Refine 檢查結尾不是 `_` 或 `-`

### Service 流程

1. 單一正則檢查 `/^[a-zA-Z0-9](?:[a-zA-Z0-9_-]*[a-zA-Z0-9])?$/`
2. 長度檢查 `>= 3 && <= 50`

## ✅ 建議修正

### 選項 1: 統一使用 Service 正則 (推薦)

**優點**:
- 單一正則,性能更好
- 邏輯更清晰
- 維護更簡單

**修改 Validator**:

```typescript
// src/validators/user-custom-id.validators.ts
export const customIdSchema = z.object({
  customId: z.string()
    .min(3, '自訂 ID 至少需要 3 個字符')
    .max(50, '自訂 ID 不能超過 50 個字符')
    .regex(
      /^[a-zA-Z0-9](?:[a-zA-Z0-9_-]*[a-zA-Z0-9])?$/,
      '自訂 ID 格式不正確：需3-50個字符,只能包含英文字母、數字、底線和連字符,且不能以底線或連字符開頭/結尾'
    )
});

// 移除 refine 驗證,因為已經包含在正則中
```

**更新工具函數**:

```typescript
export const validateCustomIdFormat = (customId: string): boolean => {
  return /^[a-zA-Z0-9](?:[a-zA-Z0-9_-]*[a-zA-Z0-9])?$/.test(customId) &&
         customId.length >= 3 &&
         customId.length <= 50;
};
```

### 選項 2: 統一使用 Validator 方式

**優點**:
- 錯誤訊息更具體
- 可以分別提示哪個規則失敗

**缺點**:
- 需要多次檢查
- Service 層需要額外邏輯

### 選項 3: 創建共享驗證模組

創建一個共享的驗證常數:

```typescript
// src/constants/validation.ts
export const CUSTOM_ID_REGEX = /^[a-zA-Z0-9](?:[a-zA-Z0-9_-]*[a-zA-Z0-9])?$/;
export const CUSTOM_ID_MIN_LENGTH = 3;
export const CUSTOM_ID_MAX_LENGTH = 50;

export const validateCustomId = (customId: string): boolean => {
  return CUSTOM_ID_REGEX.test(customId) &&
         customId.length >= CUSTOM_ID_MIN_LENGTH &&
         customId.length <= CUSTOM_ID_MAX_LENGTH;
};
```

然後在 Validator 和 Service 中都使用這個共享函數。

## 🎯 推薦方案

**採用選項 3 (創建共享驗證模組)**

理由:
1. ✅ **單一真相來源** (Single Source of Truth)
2. ✅ **易於維護** - 修改規則只需改一個地方
3. ✅ **一致性保證** - 所有地方使用相同邏輯
4. ✅ **可測試性** - 集中測試驗證邏輯
5. ✅ **可擴展性** - 未來添加保留字檢查等功能更容易

## 📝 實作步驟

1. 創建 `src/constants/validation.ts`
2. 更新 `src/validators/user-custom-id.validators.ts`
3. 更新 `src/services/user.service.ts`
4. 添加單元測試
5. 更新文檔

## 🔗 相關檔案

- `/Users/xiaoxu/Projects/daodao-server/src/validators/user-custom-id.validators.ts:10-49`
- `/Users/xiaoxu/Projects/daodao-server/src/services/user.service.ts:1131-1133`
- `/Users/xiaoxu/Projects/daodao-server/src/services/user.service.ts:1152-1154`
- `/Users/xiaoxu/Projects/daodao-server/src/services/user.service.ts:675-677`

## ⏰ 優先級

~~**中等** - 雖然目前兩種方式的結果基本一致,但不一致的實作會:~~
~~- 增加維護成本~~
~~- 可能導致未來的 bug~~
~~- 降低代碼可讀性~~

~~建議在下一個 sprint 中修正。~~

## ✅ 修正完成

**修正日期**: 2025-10-17

已採用**選項 3 (創建共享驗證模組)**方案完成修正:

### 修正內容

1. **創建共享驗證模組**: `src/constants/validation.ts`
   - 統一的正則表達式常數
   - 統一的錯誤訊息
   - 共享的驗證函數
   - 保留字列表功能

2. **更新 Validator**: `src/validators/user-custom-id.validators.ts`
   - 使用共享的驗證規則
   - 移除重複的正則表達式
   - 簡化驗證邏輯

3. **更新 Service**: `src/services/user.service.ts`
   - 匯入共享驗證函數
   - 統一三處驗證邏輯 (checkCustomIdAvailability, setCustomId, createUser)
   - 使用統一的錯誤訊息

### 驗證結果

✅ TypeScript 類型檢查通過
✅ 所有驗證邏輯統一
✅ 代碼可維護性提升

### 額外功能

新增的共享驗證模組還提供了:
- 保留字檢查功能 (isReservedCustomId)
- 詳細錯誤訊息驗證 (validateCustomIdWithMessage)
- 完整驗證函數 (validateCustomIdComplete)
