# Customer ID (Custom ID) 規則文檔

## 📋 概述

Customer ID (又稱 Custom ID) 是島島阿學平台提供給用戶的自訂唯一識別符功能,允許用戶設置一個友好且易記的 ID 來替代系統生成的 UUID。

---

## 🎯 給前端開發者的快速指南

### 顯示給用戶的規則說明

```markdown
### 自訂 ID 規則

您的自訂 ID 需要符合以下規則:

✅ **允許的內容**
- 英文字母 (a-z, A-Z)
- 數字 (0-9)
- 底線 (_)
- 連字符 (-)

✅ **長度要求**
- 最少 3 個字符
- 最多 50 個字符

✅ **開頭和結尾**
- 必須以英文字母或數字開頭
- 必須以英文字母或數字結尾
- 不能以底線或連字符開頭/結尾

📌 **範例**
- ✓ `john_doe`
- ✓ `user123`
- ✓ `my-profile`
- ✓ `alice_2024`
- ✗ `_username` (不能以底線開頭)
- ✗ `user-` (不能以連字符結尾)
- ✗ `ab` (太短,至少需要 3 個字符)
```

### 前端驗證建議

```javascript
// 即時驗證正則表達式
const CUSTOM_ID_REGEX = /^[a-zA-Z0-9](?:[a-zA-Z0-9_-]*[a-zA-Z0-9])?$/;

// 驗證函數
function validateCustomId(customId) {
  // 檢查長度
  if (!customId || customId.length < 3 || customId.length > 50) {
    return {
      valid: false,
      message: '自訂 ID 需要 3-50 個字符'
    };
  }

  // 檢查格式
  if (!CUSTOM_ID_REGEX.test(customId)) {
    return {
      valid: false,
      message: '自訂 ID 只能包含英文字母、數字、底線和連字符，且不能以底線或連字符開頭/結尾'
    };
  }

  return { valid: true, message: '' };
}

// 使用範例
const result = validateCustomId('john_doe_2024');
if (!result.valid) {
  showError(result.message);
}
```

### UI/UX 建議

1. **即時驗證**: 使用防抖 (debounce 300ms) 在用戶輸入時即時檢查格式
2. **可用性檢查**: 格式正確後,調用 API 檢查是否已被使用
3. **視覺反饋**:
   - ✓ 綠色勾勾 - 格式正確且可用
   - ⚠️ 黃色警告 - 格式正確但已被使用
   - ✗ 紅色錯誤 - 格式不正確
4. **友好提示**: 在輸入框下方顯示規則說明
5. **範例建議**: 提供幾個範例讓用戶參考

---

## 📊 規則速查表

| 規則項目 | 說明 | 範例 |
|---------|------|------|
| 🔤 **允許字符** | 英文字母、數字、底線、連字符 | `a-z`, `A-Z`, `0-9`, `_`, `-` |
| 📏 **長度限制** | 3-50 個字符 | ✓ `abc`, ✗ `ab` |
| 🎯 **開頭規則** | 必須是英文字母或數字 | ✓ `a_bc`, ✗ `_abc` |
| 🎯 **結尾規則** | 必須是英文字母或數字 | ✓ `abc_d`, ✗ `abc_` |
| ⚠️ **大小寫** | 區分大小寫 | `User123` ≠ `user123` |
| 🔒 **唯一性** | 全平台唯一 | 不能與他人重複 |

### 常見錯誤示範

| 輸入 | 結果 | 原因 |
|------|------|------|
| `ab` | ✗ | 太短 (少於 3 個字符) |
| `_username` | ✗ | 以底線開頭 |
| `username_` | ✗ | 以底線結尾 |
| `-cooluser` | ✗ | 以連字符開頭 |
| `cool-user-` | ✗ | 以連字符結尾 |
| `user@123` | ✗ | 包含非法字符 `@` |
| `用戶名` | ✗ | 包含中文字符 |
| `user name` | ✗ | 包含空格 |
| `user#tag` | ✗ | 包含非法字符 `#` |

### 正確示範

| 輸入 | 結果 | 說明 |
|------|------|------|
| `john_doe` | ✓ | 使用底線連接 |
| `user123` | ✓ | 字母+數字組合 |
| `my-profile` | ✓ | 使用連字符 |
| `Alice2024` | ✓ | 大小寫混合 |
| `cool_user_2024` | ✓ | 複雜組合 |
| `a1b` | ✓ | 最短有效長度 |
| `this-is-a-very-long-custom-id-but-still-valid-123` | ✓ | 50 字符內都有效 |

---

## 💡 給設計師的 UI 文案建議

### 輸入框標籤
```
自訂 ID (選填)
設定一個好記的個人網址,例如: daodao.tw/@your_id
```

### 輸入框佔位符 (Placeholder)
```
例如: john_doe 或 user_2024
```

### 輸入框下方提示文字
```
3-50 個字符,可使用英文字母、數字、底線和連字符
不能以 _ 或 - 開頭/結尾
```

### 錯誤訊息文案

| 錯誤類型 | 建議文案 |
|---------|---------|
| 太短 | ⚠️ 自訂 ID 至少需要 3 個字符 |
| 太長 | ⚠️ 自訂 ID 不能超過 50 個字符 |
| 格式錯誤 | ⚠️ 只能使用英文字母、數字、底線和連字符，且不能以 _ 或 - 開頭/結尾 |
| 已被使用 | ⚠️ 這個 ID 已經被使用了,請換一個試試 |
| 保留字 | ⚠️ 這是系統保留字,請使用其他 ID |

### 成功訊息
```
✓ 太棒了!這個 ID 可以使用
```

### 輸入中提示 (即時驗證)
```
檢查中...
```

---

## 🎨 UI 組件範例 (React)

### 基礎版本

```jsx
import { useState, useEffect } from 'react';

function CustomIdInput() {
  const [customId, setCustomId] = useState('');
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);

  // 即時驗證
  useEffect(() => {
    if (!customId) {
      setError('');
      setIsAvailable(false);
      return;
    }

    // 格式驗證
    const CUSTOM_ID_REGEX = /^[a-zA-Z0-9](?:[a-zA-Z0-9_-]*[a-zA-Z0-9])?$/;

    if (customId.length < 3) {
      setError('自訂 ID 至少需要 3 個字符');
      setIsAvailable(false);
      return;
    }

    if (customId.length > 50) {
      setError('自訂 ID 不能超過 50 個字符');
      setIsAvailable(false);
      return;
    }

    if (!CUSTOM_ID_REGEX.test(customId)) {
      setError('只能使用英文字母、數字、底線和連字符，且不能以 _ 或 - 開頭/結尾');
      setIsAvailable(false);
      return;
    }

    // 格式正確,檢查可用性
    setError('');
    const timer = setTimeout(async () => {
      setIsChecking(true);
      try {
        const response = await fetch(`/api/users/custom-id/check/${customId}`);
        const data = await response.json();
        setIsAvailable(data.data.available);
        if (!data.data.available) {
          setError('這個 ID 已經被使用了,請換一個試試');
        }
      } catch (err) {
        setError('檢查失敗,請稍後再試');
      } finally {
        setIsChecking(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [customId]);

  return (
    <div className="custom-id-input">
      <label htmlFor="customId">
        自訂 ID (選填)
        <span className="hint">設定一個好記的個人網址</span>
      </label>

      <div className="input-wrapper">
        <input
          id="customId"
          type="text"
          value={customId}
          onChange={(e) => setCustomId(e.target.value)}
          placeholder="例如: john_doe 或 user_2024"
          className={error ? 'error' : isAvailable ? 'success' : ''}
        />
        {isChecking && <span className="spinner">⏳</span>}
        {isAvailable && !isChecking && <span className="success-icon">✓</span>}
      </div>

      <p className="help-text">
        3-50 個字符,可使用英文字母、數字、底線和連字符
      </p>

      {error && <p className="error-message">⚠️ {error}</p>}
      {isAvailable && !error && (
        <p className="success-message">✓ 太棒了!這個 ID 可以使用</p>
      )}
    </div>
  );
}
```

### 進階版本 (含範例建議)

```jsx
function CustomIdInputAdvanced() {
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestions = [
    'john_doe',
    'alice_2024',
    'cool_user',
    'my_profile',
  ];

  return (
    <div>
      {/* ... 基礎輸入框 ... */}

      <button onClick={() => setShowSuggestions(!showSuggestions)}>
        💡 看看範例
      </button>

      {showSuggestions && (
        <div className="suggestions">
          <p>點擊任一範例填入:</p>
          {suggestions.map(suggestion => (
            <button
              key={suggestion}
              onClick={() => setCustomId(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 🔧 技術實作細節

## 資料庫結構

### 相關欄位 (users 表)

```sql
custom_id                 String?    @unique @db.VarChar(50)
custom_id_verified        Boolean?   @default(false)
custom_id_created_at      DateTime?  @db.Timestamptz(6)
```

- **custom_id**: 用戶自訂的唯一 ID,最大長度 50 字符
- **custom_id_verified**: 驗證狀態,默認為 false
- **custom_id_created_at**: 創建時間戳

## 格式規則

### 基本要求

1. **長度限制**: 3-50 個字符
2. **允許的字符**:
   - 英文字母 (a-z, A-Z)
   - 數字 (0-9)
   - 底線 (_)
   - 連字符 (-)

3. **開頭/結尾限制**:
   - 不能以底線 (_) 開頭或結尾
   - 不能以連字符 (-) 開頭或結尾
   - 必須以英文字母或數字開頭和結尾

### 正則表達式

```javascript
/^[a-zA-Z0-9](?:[a-zA-Z0-9_-]*[a-zA-Z0-9])?$/
```

#### 正則表達式解釋

- `^[a-zA-Z0-9]`: 開頭必須是字母或數字
- `(?:...)`: 非捕獲組
- `[a-zA-Z0-9_-]*`: 中間可以包含字母、數字、底線、連字符(任意次數)
- `[a-zA-Z0-9]`: 結尾必須是字母或數字
- `?`: 使中間部分可選(支援 3 字符的情況)

### 有效範例

```
✓ abc
✓ user123
✓ my_profile
✓ cool-user
✓ john_doe_2024
✓ a1b2c3
✓ developer-123
```

### 無效範例

```
✗ ab                    (太短,少於 3 個字符)
✗ _username             (以底線開頭)
✗ username_             (以底線結尾)
✗ -cooluser             (以連字符開頭)
✗ cooluser-             (以連字符結尾)
✗ user@123              (包含非法字符 @)
✗ 用戶名                 (包含非英文字符)
✗ user name             (包含空格)
✗ user#123              (包含非法字符 #)
```

## API 端點

### 1. 檢查 Custom ID 可用性

**端點**: `GET /api/users/custom-id/check/:customId`

**功能**: 檢查指定的 custom ID 是否可用

**回應格式**:
```json
{
  "success": true,
  "data": {
    "available": true
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**邏輯**:
1. 驗證格式是否符合規則
2. 檢查資料庫中是否已被使用
3. 格式不正確或已被使用時返回 `available: false`

### 2. 設置 Custom ID

**端點**: `POST /api/users/me/custom-id`

**請求體**:
```json
{
  "customId": "my_profile_123"
}
```

**回應格式**:
```json
{
  "success": true,
  "data": {
    "customId": "my_profile_123"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**業務規則**:
1. 必須先檢查用戶是否已經有 custom ID
2. 如果已有 custom ID,必須先移除才能設置新的
3. 檢查格式合法性
4. 檢查是否已被其他用戶使用
5. 使用 transaction 確保原子性操作
6. 設置成功後自動標記為已驗證 (`custom_id_verified: true`)
7. 記錄創建時間 (`custom_id_created_at`)

**錯誤處理**:
- 格式不正確: `ConflictError` - "自訂 ID 格式不正確:需3-50個字符,只能包含英文字母、數字、底線和連字符,且不能以底線或連字符開頭/結尾"
- ID 已被使用: `ConflictError` - "此自訂 ID 已被使用"
- 用戶已有 custom ID: `ConflictError` - "用戶已設置自訂 ID,請先移除現有 ID"
- 用戶不存在: `NotFoundError` - "用戶不存在"

### 3. 移除 Custom ID

**端點**: `DELETE /api/users/me/custom-id`

**回應格式**:
```json
{
  "success": true,
  "data": {
    "message": "自訂 ID 已成功移除"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**業務規則**:
1. 檢查用戶是否存在
2. 檢查用戶是否已設置 custom ID
3. 移除 custom ID 並清空相關欄位

**錯誤處理**:
- 用戶不存在: `NotFoundError` - "用戶不存在"
- 未設置 custom ID: `ConflictError` - "用戶尚未設置自訂 ID"

### 4. 透過 Custom ID 查詢用戶

**端點**: `GET /api/users/custom-id/:customId`

**功能**: 使用 custom ID 查詢用戶的公開資料

**回應格式**:
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "customId": "john_doe_2024",
    ...
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**錯誤處理**:
- 用戶不存在: `NotFoundError` - "User not found"

## 創建用戶時設置 Custom ID

用戶在註冊時可以同時設置 custom ID:

**請求體範例**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "customId": "john_doe_2024",
  ...
}
```

**業務規則**:
1. Custom ID 為可選欄位
2. 如果提供,必須驗證格式
3. 檢查是否已被使用
4. 創建時設置的 custom ID 自動標記為已驗證

## 實作位置

### 驗證器
- **檔案**: `src/validators/user-custom-id.validators.ts`
- **Schema**: `customIdSchema`, `customIdParamsSchema`, `setCustomIdRequestSchema`
- **工具函數**: `validateCustomIdFormat()`

### 服務層
- **檔案**: `src/services/user.service.ts`
- **函數**:
  - `checkCustomIdAvailability()` (行 1129)
  - `setCustomId()` (行 1150)
  - `getUserByCustomId()` (行 1212)
  - `removeCustomId()` (行 1119)

### 控制器
- **檔案**: `src/controllers/user.controller.ts`
- **處理器**:
  - `checkCustomIdAvailability` (行 198)
  - `setCustomId` (行 213)
  - `removeCustomId` (行 233)
  - `getUserByCustomId` (行 252)

### 路由
- **檔案**: `src/routes/user.routes.ts`
- **端點映射**: 將 HTTP 請求映射到對應的控制器函數

## 資料庫約束

### 唯一性約束
```prisma
custom_id String? @unique @db.VarChar(50)
```

資料庫層面確保 custom_id 的唯一性,防止重複。

### Prisma 錯誤碼
- **P2002**: 唯一約束違反
  - 當嘗試設置已存在的 custom ID 時會觸發
  - 服務層會捕獲此錯誤並轉換為友好的錯誤訊息

## 安全性考量

1. **唯一性檢查**: 在設置前必須檢查是否已被使用
2. **格式驗證**: 嚴格的格式規則防止注入攻擊
3. **事務處理**: 使用 Prisma transaction 確保原子性
4. **錯誤處理**: 統一的錯誤處理機制
5. **權限控制**: 只能設置或移除自己的 custom ID

## 使用流程

### 設置 Custom ID 流程

```
1. 用戶輸入期望的 custom ID
   ↓
2. 前端調用 /api/users/custom-id/check/:customId 檢查可用性
   ↓
3. 如果可用,前端調用 POST /api/users/me/custom-id
   ↓
4. 後端驗證格式和唯一性
   ↓
5. 使用 transaction 更新用戶資料
   ↓
6. 返回成功響應
```

### 修改 Custom ID 流程

```
1. 用戶請求移除現有 custom ID
   ↓
2. 調用 DELETE /api/users/me/custom-id
   ↓
3. 後端清空 custom_id 相關欄位
   ↓
4. 用戶可以設置新的 custom ID
   ↓
5. 重複「設置 Custom ID 流程」
```

## 最佳實踐

### 前端開發建議

1. **即時驗證**: 使用防抖 (debounce) 調用檢查 API
2. **友好提示**: 提供清晰的格式要求說明
3. **錯誤處理**: 針對不同錯誤類型顯示對應提示
4. **確認機制**: 移除或修改時要求用戶確認

### 後端開發建議

1. **一致性驗證**: 控制器、服務層、驗證器三層都要驗證
2. **事務處理**: 所有修改操作都使用 transaction
3. **錯誤記錄**: 記錄所有錯誤以便追蹤
4. **性能優化**: 使用資料庫索引加速查詢

## 測試案例

### 單元測試建議

```typescript
// 格式驗證測試
describe('Custom ID Format Validation', () => {
  test('應接受有效的 custom ID', () => {
    expect(validateCustomIdFormat('abc')).toBe(true);
    expect(validateCustomIdFormat('user123')).toBe(true);
    expect(validateCustomIdFormat('my_profile')).toBe(true);
  });

  test('應拒絕無效的 custom ID', () => {
    expect(validateCustomIdFormat('ab')).toBe(false);
    expect(validateCustomIdFormat('_user')).toBe(false);
    expect(validateCustomIdFormat('user_')).toBe(false);
  });
});

// API 整合測試
describe('Custom ID API', () => {
  test('應能成功設置 custom ID', async () => {
    // 測試邏輯
  });

  test('應拒絕重複的 custom ID', async () => {
    // 測試邏輯
  });

  test('應能查詢用戶通過 custom ID', async () => {
    // 測試邏輯
  });
});
```

## 未來改進方向

1. **保留字列表**: 添加系統保留字列表,防止使用如 "admin", "system" 等敏感 ID
2. **歷史記錄**: 記錄 custom ID 變更歷史
3. **冷卻期**: 設置修改 custom ID 的冷卻期限制
4. **長度優化**: 根據實際使用情況調整最大長度限制
5. **驗證流程**: 實作更嚴格的驗證流程(如需管理員審核)

## 參考資料

- **Prisma Schema**: `/prisma/schema.prisma:759-761`
- **用戶規格文檔**: `/docs/user_new_spec.md`
- **驗證器實作**: `/src/validators/user-custom-id.validators.ts`
- **服務層實作**: `/src/services/user.service.ts:1126-1207`
- **控制器實作**: `/src/controllers/user.controller.ts:194-265`
