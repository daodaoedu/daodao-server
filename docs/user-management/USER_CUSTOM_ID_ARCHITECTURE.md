# 用戶自訂 ID 服務架構規劃

## 概述

本文件規劃了用戶自訂 ID 功能的完整架構，包括資料庫設計、服務層擴展、API 端點設計、驗證邏輯和前端整合等各個方面。

## 資料庫設計

### Schema 變更

```sql
-- 新增自訂 ID 相關欄位到 users 表
ALTER TABLE "users" ADD COLUMN "custom_id" VARCHAR(50) UNIQUE;
ALTER TABLE "users" ADD COLUMN "custom_id_verified" BOOLEAN DEFAULT FALSE;
ALTER TABLE "users" ADD COLUMN "custom_id_created_at" TIMESTAMPTZ;
```

### Prisma Schema 更新

```prisma
model users {
  // ... 既有欄位 ...
  custom_id              String?    @unique @db.VarChar(50)
  custom_id_verified     Boolean?   @default(false)
  custom_id_created_at   DateTime?  @db.Timestamptz(6)
  // ... 其他欄位 ...
}
```

### 設計考量

- **custom_id**: 50 字符限制，支持英文字母、數字、底線、連字符
- **custom_id_verified**: 驗證狀態，防止惡意搶占
- **custom_id_created_at**: 創建時間，用於追蹤和分析
- **UNIQUE 約束**: 確保自訂 ID 唯一性

## 服務層架構

### src/services/user-custom-id.service.ts

```typescript
/**
 * 用戶自訂 ID 服務
 * 處理自訂 ID 的創建、驗證、查詢等功能
 */

export interface CustomIdServiceInterface {
  // 檢查自訂 ID 可用性
  checkCustomIdAvailability(customId: string): Promise<ApiSuccessResponse<{ available: boolean }>>;
  
  // 設置用戶自訂 ID
  setCustomId(userId: number, customId: string): Promise<ApiSuccessResponse<{ customId: string }>>;
  
  // 驗證自訂 ID
  verifyCustomId(userId: number, verificationCode: string): Promise<ApiSuccessResponse<{ verified: boolean }>>;
  
  // 透過自訂 ID 查找用戶
  getUserByCustomId(customId: string): Promise<ApiSuccessResponse<FormattedUserResponse> | null>;
  
  // 移除自訂 ID
  removeCustomId(userId: number): Promise<ApiSuccessResponse<{ message: string }>>;
  
  // 更新自訂 ID
  updateCustomId(userId: number, newCustomId: string): Promise<ApiSuccessResponse<{ customId: string }>>;
}

export class CustomIdService implements CustomIdServiceInterface {
  // 實作細節...
}
```

### 現有 UserService 擴展

```typescript
// src/services/user.service.ts 新增方法

export class UserService {
  // ... 既有方法 ...
  
  /**
   * 獲取用戶（支持自訂 ID）
   */
  async getUserById(identifier: string): Promise<ApiSuccessResponse<FormattedUserResponse> | null> {
    // 優先嘗試 custom_id，再嘗試 external_id
  }
}
```

## 控制器層設計

### src/controllers/user-custom-id.controller.ts

```typescript
/**
 * 用戶自訂 ID 控制器
 */

export const customIdController = {
  // GET /api/users/custom-id/check/:customId
  checkAvailability: asyncHandler(async (req: Request, res: Response) => {
    // 檢查自訂 ID 可用性
  }),

  // POST /api/users/me/custom-id
  setCustomId: asyncHandler(async (req: Request, res: Response) => {
    // 設置當前用戶的自訂 ID
  }),

  // PUT /api/users/me/custom-id
  updateCustomId: asyncHandler(async (req: Request, res: Response) => {
    // 更新當前用戶的自訂 ID
  }),

  // DELETE /api/users/me/custom-id
  removeCustomId: asyncHandler(async (req: Request, res: Response) => {
    // 移除當前用戶的自訂 ID
  }),

  // POST /api/users/me/custom-id/verify
  verifyCustomId: asyncHandler(async (req: Request, res: Response) => {
    // 驗證自訂 ID
  }),

  // GET /api/users/custom-id/:customId
  getUserByCustomId: asyncHandler(async (req: Request, res: Response) => {
    // 透過自訂 ID 獲取用戶資訊
  })
};
```

## 驗證層設計

### src/validators/user-custom-id.validators.ts

```typescript
/**
 * 用戶自訂 ID 驗證器
 */

// 自訂 ID 格式驗證
export const customIdSchema = z.object({
  customId: z.string()
    .min(3, '自訂 ID 至少需要 3 個字符')
    .max(50, '自訂 ID 不能超過 50 個字符')
    .regex(/^[a-zA-Z0-9_-]+$/, '自訂 ID 只能包含英文字母、數字、底線和連字符')
    .refine((val) => !val.startsWith('_') && !val.startsWith('-'), '自訂 ID 不能以底線或連字符開頭')
    .refine((val) => !val.endsWith('_') && !val.endsWith('-'), '自訂 ID 不能以底線或連字符結尾')
    .refine((val) => !reservedIds.includes(val.toLowerCase()), '此 ID 為系統保留字，無法使用')
});

// 驗證碼驗證
export const verificationSchema = z.object({
  verificationCode: z.string().length(6, '驗證碼必須為 6 位數字')
});

// 保留字列表
const reservedIds = [
  'admin', 'administrator', 'root', 'system', 'api', 'www',
  'mail', 'ftp', 'http', 'https', 'ssl', 'support', 'help',
  'info', 'contact', 'about', 'terms', 'privacy', 'legal',
  'blog', 'news', 'media', 'static', 'assets', 'cdn',
  'app', 'mobile', 'web', 'service', 'services', 'auth',
  'login', 'register', 'signup', 'signin', 'logout',
  'profile', 'settings', 'dashboard', 'home', 'index',
  'search', 'browse', 'explore', 'discover', 'trending'
];
```

## 路由設計

### src/routes/user-custom-id.routes.ts

```typescript
/**
 * 用戶自訂 ID 路由
 */

const router = Router();

// 檢查自訂 ID 可用性（公開端點）
router.get('/check/:customId', 
  validate(customIdParamsSchema, 'params'),
  customIdController.checkAvailability
);

// 透過自訂 ID 獲取用戶（公開端點）
router.get('/:customId', 
  validate(customIdParamsSchema, 'params'),
  customIdController.getUserByCustomId
);

// 設置當前用戶自訂 ID
router.post('/me/custom-id', 
  authenticate,
  validate(customIdSchema, 'body'),
  customIdController.setCustomId
);

// 更新當前用戶自訂 ID
router.put('/me/custom-id', 
  authenticate,
  validate(customIdSchema, 'body'),
  customIdController.updateCustomId
);

// 移除當前用戶自訂 ID
router.delete('/me/custom-id', 
  authenticate,
  customIdController.removeCustomId
);

// 驗證自訂 ID
router.post('/me/custom-id/verify', 
  authenticate,
  validate(verificationSchema, 'body'),
  customIdController.verifyCustomId
);

export default router;
```

## 類型定義擴展

### src/types/user-custom-id.types.ts

```typescript
/**
 * 用戶自訂 ID 相關類型定義
 */

// 自訂 ID 檢查回應
export interface CustomIdAvailabilityResponse {
  available: boolean;
  suggestions?: string[];
}

// 自訂 ID 設置請求
export interface SetCustomIdRequest {
  customId: string;
}

// 自訂 ID 驗證請求
export interface VerifyCustomIdRequest {
  verificationCode: string;
}

// 自訂 ID 服務回應
export interface CustomIdServiceResponse {
  customId: string;
  verified: boolean;
  createdAt: string;
}

// 擴展現有 FormattedUserResponse
export interface FormattedUserResponseWithCustomId extends FormattedUserResponse {
  customId?: string;
  customIdVerified?: boolean;
  customIdCreatedAt?: string;
}
```

### src/types/user.types.ts 更新

```typescript
// 在既有的 FormattedUserResponse 介面中新增
export interface FormattedUserResponse {
  // ... 既有欄位 ...
  customId?: string;
  customIdVerified?: boolean;
  customIdCreatedAt?: string;
}

// 更新請求介面
export interface UpdateUserRequest {
  // ... 既有欄位 ...
  customId?: string;
}
```

## 中介軟體設計

### src/middleware/custom-id.middleware.ts

```typescript
/**
 * 自訂 ID 中介軟體
 */

// 自訂 ID 冷卻期檢查
export const checkCustomIdCooldown = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) return next();

  const lastChange = await prisma.users.findUnique({
    where: { id: user.id },
    select: { custom_id_created_at: true }
  });

  if (lastChange?.custom_id_created_at) {
    const cooldownPeriod = 30 * 24 * 60 * 60 * 1000; // 30 天
    const timeSinceLastChange = Date.now() - new Date(lastChange.custom_id_created_at).getTime();
    
    if (timeSinceLastChange < cooldownPeriod) {
      const remainingDays = Math.ceil((cooldownPeriod - timeSinceLastChange) / (24 * 60 * 60 * 1000));
      throw new ConflictError(`自訂 ID 更改需要等待 ${remainingDays} 天冷卻期`);
    }
  }

  next();
});

// 自訂 ID 格式驗證
export const validateCustomIdFormat = (customId: string): boolean => {
  const regex = /^[a-zA-Z0-9_-]{3,50}$/;
  return regex.test(customId) && 
         !customId.startsWith('_') && 
         !customId.startsWith('-') &&
         !customId.endsWith('_') && 
         !customId.endsWith('-');
};
```

## API 端點規格

### 端點列表

| 方法 | 端點 | 描述 | 驗證需求 | 權限需求 |
|------|------|------|----------|----------|
| GET | `/api/users/custom-id/check/:customId` | 檢查自訂 ID 可用性 | 無 | 無 |
| GET | `/api/users/custom-id/:customId` | 透過自訂 ID 獲取用戶 | 無 | 無 |
| POST | `/api/users/me/custom-id` | 設置自訂 ID | JWT | 本人 |
| PUT | `/api/users/me/custom-id` | 更新自訂 ID | JWT | 本人 |
| DELETE | `/api/users/me/custom-id` | 移除自訂 ID | JWT | 本人 |
| POST | `/api/users/me/custom-id/verify` | 驗證自訂 ID | JWT | 本人 |

### API 回應格式

```typescript
// 成功回應
{
  "success": true,
  "data": {
    "available": true,
    "suggestions": ["johndoe123", "john_doe", "johndoe2024"]
  },
  "message": "查詢成功"
}

// 錯誤回應
{
  "success": false,
  "error": {
    "code": "CUSTOM_ID_TAKEN",
    "message": "此自訂 ID 已被使用",
    "details": "請選擇其他 ID 或查看建議的替代方案"
  }
}
```

## 業務邏輯規則

### 自訂 ID 規則

1. **格式限制**:
   - 長度: 3-50 字符
   - 字符集: a-z, A-Z, 0-9, _, -
   - 不能以底線或連字符開頭/結尾
   - 不能包含連續的底線或連字符

2. **業務規則**:
   - 每個用戶只能設置一個自訂 ID
   - 設置後有 30 天冷卻期才能再次修改
   - 新設置的 ID 需要通過電子郵件驗證
   - 系統保留字不能使用

3. **驗證流程**:
   - 用戶設置自訂 ID
   - 系統發送驗證郵件
   - 用戶點擊郵件中的驗證連結
   - 系統標記 custom_id_verified = true

### 錯誤處理

```typescript
export const CustomIdErrors = {
  INVALID_FORMAT: {
    code: 'INVALID_CUSTOM_ID_FORMAT',
    message: '自訂 ID 格式不正確'
  },
  ALREADY_TAKEN: {
    code: 'CUSTOM_ID_TAKEN',
    message: '此自訂 ID 已被使用'
  },
  RESERVED_WORD: {
    code: 'CUSTOM_ID_RESERVED',
    message: '此 ID 為系統保留字'
  },
  COOLDOWN_ACTIVE: {
    code: 'CUSTOM_ID_COOLDOWN',
    message: '自訂 ID 更改冷卻期間'
  },
  NOT_VERIFIED: {
    code: 'CUSTOM_ID_NOT_VERIFIED',
    message: '自訂 ID 尚未驗證'
  }
} as const;
```

## 整合到現有路由

### src/routes/index.ts 更新

```typescript
// 新增自訂 ID 路由
import customIdRoutes from './user-custom-id.routes';

// 在現有路由註冊中新增
app.use('/api/users/custom-id', customIdRoutes);
```

### src/routes/user.routes.ts 更新

```typescript
// 修改既有的 GET /users/:id 路由以支持自訂 ID
router.get('/:id', 
  validate(getUserParamsSchema, 'params'),
  userController.getOneUserByIdOrCustomId as RequestHandler
);
```

## 測試策略

### 單元測試

```typescript
// tests/unit/services/user-custom-id.service.test.ts
describe('CustomIdService', () => {
  describe('checkCustomIdAvailability', () => {
    it('should return available for unused custom ID');
    it('should return unavailable for taken custom ID');
    it('should return unavailable for reserved words');
  });

  describe('setCustomId', () => {
    it('should set custom ID successfully');
    it('should reject invalid format');
    it('should reject during cooldown period');
  });
});
```

### 整合測試

```typescript
// tests/integration/user-custom-id-api.test.ts
describe('Custom ID API', () => {
  describe('GET /api/users/custom-id/check/:customId', () => {
    it('should check availability correctly');
  });

  describe('POST /api/users/me/custom-id', () => {
    it('should set custom ID for authenticated user');
    it('should reject unauthenticated requests');
  });
});
```

## 效能考量

### 資料庫索引

```sql
-- 為 custom_id 建立索引以加速查詢
CREATE INDEX CONCURRENTLY idx_users_custom_id ON users(custom_id) WHERE custom_id IS NOT NULL;

-- 為驗證狀態建立部分索引
CREATE INDEX CONCURRENTLY idx_users_custom_id_verified ON users(custom_id_verified) WHERE custom_id_verified = true;
```

### 快取策略

```typescript
// Redis 快取自訂 ID 檢查結果
const CACHE_KEY_CUSTOM_ID_CHECK = (customId: string) => `custom_id_check:${customId}`;
const CACHE_TTL = 300; // 5 分鐘

// 快取用戶資料
const CACHE_KEY_USER_BY_CUSTOM_ID = (customId: string) => `user_by_custom_id:${customId}`;
```

## 安全考量

### 速率限制

```typescript
// 自訂 ID 檢查限制
const customIdCheckLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分鐘
  max: 50, // 最多 50 次檢查
  message: '自訂 ID 檢查次數過多，請稍後再試'
});

// 自訂 ID 設置限制
const customIdSetLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 小時
  max: 3, // 最多 3 次設置嘗試
  message: '自訂 ID 設置嘗試次數過多'
});
```

### 輸入驗證

- 嚴格的格式驗證
- XSS 防護
- SQL 注入防護（透過 Prisma）
- 保留字過濾

## 部署清單

### 資料庫遷移

1. 執行 SQL 遷移腳本
2. 執行 `npm run prisma:generate`
3. 重新構建應用程式

### 應用程式部署

1. 部署新的服務檔案
2. 更新路由配置
3. 重新啟動應用服務
4. 執行整合測試

### 監控設置

- 自訂 ID 使用量監控
- API 端點效能監控
- 錯誤率監控
- 資料庫查詢效能監控

## 未來擴展

### 可能的功能擴展

1. **自訂 ID 歷史記錄**: 保留用戶使用過的自訂 ID 歷史
2. **批次管理**: 管理員批次管理用戶自訂 ID
3. **分析功能**: 自訂 ID 使用統計和分析
4. **API 整合**: 提供第三方整合的 API
5. **多語言支援**: 支援不同語言的自訂 ID 格式

### 架構優化

1. **微服務分離**: 將自訂 ID 功能獨立為微服務
2. **事件驅動**: 使用事件總線處理自訂 ID 變更
3. **CQRS 模式**: 分離讀寫操作以提升效能
4. **GraphQL 支援**: 提供 GraphQL API 端點

---

## 總結

本架構設計遵循現有專案的 TypeScript-first 原則，採用 Prisma ORM、Zod 驗證、工廠函數模式等技術栈。設計考量了安全性、效能、可擴展性和使用者體驗，提供了完整的自訂 ID 功能實作方案。

實作時建議採用漸進式開發方式，優先實作核心功能，再逐步添加進階特性和優化。