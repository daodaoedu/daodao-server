# OAuth CSRF 防護機制

## 概述

本系統實現了完整的 OAuth CSRF 防護機制，通過 `state` 參數中的 `nonce` 和 `source` 來防止 CSRF 攻擊。

## 安全流程

### 1. 前端發起 OAuth 請求

前端在發起 Google OAuth 登入時，需要：

1. 生成隨機 `nonce`（推薦使用 crypto API 生成強隨機數）
2. 將 `nonce` 存儲在前端（例如：sessionStorage 或內存）
3. 構建包含 `nonce`、`source` 和 `redirectUrl` 的 state 參數
4. 將 state 編碼為 Base64 並發起 OAuth 請求

```typescript
// 前端示例代碼
interface OAuthState {
  redirectUrl: string;
  source: 'website' | 'app';
  timestamp: number;
  nonce: string;
}

// 1. 生成 nonce
const generateNonce = (): string => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// 2. 創建 state
const nonce = generateNonce();
const state: OAuthState = {
  redirectUrl: '/dashboard',
  source: 'app',
  timestamp: Date.now(),
  nonce: nonce
};

// 3. 存儲 nonce 到 sessionStorage
sessionStorage.setItem('oauth_nonce', nonce);
sessionStorage.setItem('oauth_source', 'app');

// 4. 編碼 state
const encodedState = btoa(JSON.stringify(state));

// 5. 發起 OAuth 請求
window.location.href = `${BACKEND_URL}/api/v1/auth/google?state=${encodedState}`;
```

### 2. 後端處理 OAuth 流程

後端在 OAuth callback 時會：

1. 接收 Google 返回的 `state` 參數
2. 驗證 `state` 的有效性（格式、時效性、必要欄位）
3. **原封不動**地保留前端的 `nonce` 和 `source`
4. 將原始 `state` 返回給前端 callback 頁面

```typescript
// 後端處理邏輯（已實現在 auth.controller.ts）
export const googleCallback = asyncHandler(async (req: Request, res: Response) => {
  // ... 用戶認證邏輯 ...

  // 解析並驗證前端傳來的 state
  const stateParam = req.query.state as string | undefined;

  if (stateParam) {
    const validationResult = validateOAuthState(stateParam);

    if (validationResult.valid && validationResult.state) {
      // ✅ 關鍵：原封不動地保留前端的 state（包含原始 nonce 和 source）
      finalEncodedState = stateParam;

      console.log('OAuth callback - preserving original state:', {
        nonce: originalState.nonce,
        source: originalState.source,
        redirectUrl: originalState.redirectUrl
      });
    }
  }

  // 重定向到前端 callback 頁面，帶上原始 state
  const url = `${frontendUrl}/auth/callback?state=${finalEncodedState}`;
  res.redirect(url);
});
```

### 3. 前端驗證 callback

前端的 `/auth/callback` 頁面需要：

1. 從 URL 解析 `state` 參數
2. 解碼 state 獲取 `nonce` 和 `source`
3. 驗證 `nonce` 是否與存儲的匹配
4. 驗證 `source` 是否與存儲的匹配
5. 驗證通過後，清除存儲的 nonce 並跳轉

```typescript
// 前端 callback 頁面示例
const OAuthCallback: React.FC = () => {
  useEffect(() => {
    const handleCallback = async () => {
      try {
        // 1. 獲取 URL 中的 state 參數
        const params = new URLSearchParams(window.location.search);
        const encodedState = params.get('state');

        if (!encodedState) {
          throw new Error('缺少 state 參數');
        }

        // 2. 解碼 state
        const stateJson = atob(encodedState);
        const state: OAuthState = JSON.parse(stateJson);

        // 3. 從 sessionStorage 獲取原始 nonce 和 source
        const originalNonce = sessionStorage.getItem('oauth_nonce');
        const originalSource = sessionStorage.getItem('oauth_source');

        // 4. 驗證 nonce
        if (!originalNonce || state.nonce !== originalNonce) {
          console.error('Nonce 驗證失敗', {
            expected: originalNonce,
            received: state.nonce
          });
          throw new Error('CSRF 驗證失敗：nonce 不匹配');
        }

        // 5. 驗證 source
        if (!originalSource || state.source !== originalSource) {
          console.error('Source 驗證失敗', {
            expected: originalSource,
            received: state.source
          });
          throw new Error('CSRF 驗證失敗：source 不匹配');
        }

        // 6. 驗證時效性（可選，建議在前端也檢查）
        const age = Date.now() - state.timestamp;
        const MAX_AGE = 5 * 60 * 1000; // 5 分鐘
        if (age > MAX_AGE) {
          throw new Error('State 已過期');
        }

        // ✅ 驗證通過
        console.log('OAuth 驗證成功', {
          nonce: state.nonce,
          source: state.source,
          redirectUrl: state.redirectUrl
        });

        // 7. 清除存儲的 nonce
        sessionStorage.removeItem('oauth_nonce');
        sessionStorage.removeItem('oauth_source');

        // 8. 跳轉到目標頁面
        window.location.href = state.redirectUrl;

      } catch (error) {
        console.error('OAuth callback 處理失敗:', error);
        // 跳轉到錯誤頁面
        window.location.href = '/auth/error';
      }
    };

    handleCallback();
  }, []);

  return <div>處理登入中...</div>;
};
```

## 安全機制說明

### 1. CSRF 防護

- **Nonce 驗證**：前端生成隨機 nonce，存儲在 sessionStorage 中
- **往返驗證**：後端原封不動地返回 nonce，前端驗證是否匹配
- **防止攻擊**：即使攻擊者能觸發 OAuth 流程，也無法獲取前端的 nonce

### 2. Source 驗證

- **來源追蹤**：區分請求來自 website 還是 app
- **防止混淆**：確保登入後跳轉到正確的前端環境
- **靈活配置**：支援多種前端來源

### 3. 時效性驗證

- **時間戳檢查**：state 包含創建時間戳
- **過期保護**：預設 5 分鐘有效期
- **防重放攻擊**：確保 state 不能被重複使用

### 4. State 結構驗證

後端會驗證 state 的完整性：
- 必要欄位：`redirectUrl`, `source`, `timestamp`, `nonce`
- 類型檢查：確保各欄位符合預期類型
- Base64 解碼：防止惡意構造的 state

## 完整流程圖

```
前端                           後端                          Google
  │                             │                             │
  │ 1. 生成 nonce               │                             │
  │ 2. 存儲到 sessionStorage    │                             │
  │ 3. 構建 state (含 nonce)    │                             │
  │────────────────────────────>│                             │
  │    GET /auth/google?state=xxx                             │
  │                             │                             │
  │                             │ 4. 轉發到 Google             │
  │                             │────────────────────────────>│
  │                             │    (state 傳遞給 Google)     │
  │                             │                             │
  │                             │<────────────────────────────│
  │                             │  5. Google callback          │
  │                             │     (code + state)           │
  │                             │                             │
  │                             │ 6. 驗證 state 有效性          │
  │                             │ 7. ✅ 保留原始 nonce/source   │
  │                             │                             │
  │<────────────────────────────│                             │
  │  8. 重定向到前端 callback      │                             │
  │     (原始 state)             │                             │
  │                             │                             │
  │ 9. 從 URL 解析 state         │                             │
  │ 10. 驗證 nonce 是否匹配       │                             │
  │ 11. 驗證 source 是否匹配      │                             │
  │ 12. ✅ 驗證通過，完成登入      │                             │
  │                             │                             │
```

## 攻擊場景防護

### 場景 1: XSS 攻擊嘗試登入其他帳號

**攻擊方式**：
攻擊者通過 XSS 在受害者瀏覽器中執行：
```javascript
window.location.href = 'https://api.example.com/auth/google?state=攻擊者構造的state';
```

**防護機制**：
1. 攻擊者無法獲取受害者存儲在 sessionStorage 中的 nonce
2. 即使攻擊者觸發了 OAuth 流程，callback 返回時前端會驗證 nonce
3. Nonce 不匹配，驗證失敗，攻擊無效

### 場景 2: 重放攻擊

**攻擊方式**：
攻擊者截獲一個有效的 state，嘗試重複使用。

**防護機制**：
1. State 包含時間戳，超過 5 分鐘自動失效
2. 前端在驗證成功後立即清除 sessionStorage 中的 nonce
3. 同一個 nonce 只能使用一次

### 場景 3: 跨站請求偽造

**攻擊方式**：
攻擊者在惡意網站上放置：
```html
<img src="https://api.example.com/auth/google?state=xxx" />
```

**防護機制**：
1. OAuth 流程需要用戶交互（Google 授權頁面）
2. 即使觸發了請求，沒有正確的 nonce 也會被前端拒絕
3. Source 驗證確保請求來自正確的前端

## 最佳實踐

### 前端

1. **強隨機 nonce**：使用 `crypto.getRandomValues()` 生成
2. **安全存儲**：使用 sessionStorage（不跨標籤頁）而非 localStorage
3. **及時清理**：驗證後立即清除 nonce
4. **錯誤處理**：驗證失敗時清晰提示用戶
5. **超時處理**：設置合理的超時時間

### 後端

1. **不修改 nonce**：原封不動地返回前端的 state
2. **嚴格驗證**：檢查所有必要欄位和類型
3. **時效控制**：設置合理的過期時間（5 分鐘）
4. **日誌記錄**：記錄驗證失敗的情況
5. **降級處理**：驗證失敗時提供預設 state

## 相關文件

- `src/controllers/auth.controller.ts` - OAuth callback 處理邏輯
- `src/services/auth/oauth.service.ts` - OAuth 認證服務
- `src/utils/oauth-state.ts` - State 工具函數
- `src/validators/auth.validators.ts` - 請求驗證

## 測試建議

### 單元測試

```typescript
describe('OAuth State Validation', () => {
  it('should validate nonce matches', () => {
    const originalNonce = generateNonce();
    const state = { nonce: originalNonce, ... };
    expect(validateNonce(state.nonce, originalNonce)).toBe(true);
  });

  it('should reject mismatched nonce', () => {
    const state = { nonce: 'abc', ... };
    expect(validateNonce(state.nonce, 'xyz')).toBe(false);
  });

  it('should reject expired state', () => {
    const state = { timestamp: Date.now() - 10 * 60 * 1000, ... };
    expect(validateTimestamp(state.timestamp)).toBe(false);
  });
});
```

### 整合測試

1. 完整 OAuth 流程測試
2. 驗證 nonce 是否正確傳遞
3. 驗證錯誤處理邏輯
4. 測試過期 state 處理

## 注意事項

1. **不要將 nonce 放入 Cookie**：Cookie 可能被 CSRF 攻擊讀取
2. **不要在 URL 中暴露敏感信息**：state 應只包含必要資訊
3. **不要延長過期時間**：5 分鐘足夠完成 OAuth 流程
4. **不要跳過驗證**：即使是已知用戶也要驗證 nonce
5. **保持後端不可預測**：後端不應該自己生成或修改 nonce

## 更新歷史

- 2026-01-13: 實現完整的 OAuth CSRF 防護機制
  - 後端保留前端的原始 nonce 和 source
  - 添加完整的 state 驗證邏輯
  - 支援降級處理（驗證失敗時使用預設 state）
