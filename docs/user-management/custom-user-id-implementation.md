# 自定義用戶ID實施方案

## 概述

本文檔描述如何在 DaoDao 平台中添加自定義用戶ID功能，允許用戶設定自己的唯一標識符。

## 需求分析

### 功能需求
- 用戶可以設定自定義ID（例如：@john_doe, @alice123）
- 自定義ID必須在系統中唯一
- 支持英文字母、數字、下劃線和連字符
- 長度限制：3-50個字符
- 可選字段，用戶可以選擇不設置

### 業務規則
1. **唯一性**：每個自定義ID在系統中只能被一個用戶使用
2. **格式限制**：只允許字母、數字、下劃線(_)和連字符(-)
3. **長度限制**：最少3個字符，最多50個字符
4. **大小寫不敏感**：存儲時統一轉為小寫
5. **禁用詞彙**：預留系統關鍵詞（admin, api, system等）

## 技術實施方案

### 1. 數據庫架構修改

#### Prisma Schema 修改
在 `prisma/schema.prisma` 的 `users` 模型中添加：

```prisma
model users {
  id                  Int     @id @default(autoincrement())
  external_id         String? @unique @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  custom_user_id      String? @unique @db.VarChar(50)  // 新增字段
  mongo_id            String  @unique
  // ... 其他現有字段
  
  @@index([custom_user_id], map: "idx_users_custom_user_id")
}
```

#### 數據庫遷移
```sql
-- 添加自定義用戶ID字段
ALTER TABLE users ADD COLUMN custom_user_id VARCHAR(50) UNIQUE;

-- 添加索引提升查詢性能
CREATE INDEX idx_users_custom_user_id ON users(custom_user_id);

-- 添加檢查約束確保格式正確
ALTER TABLE users ADD CONSTRAINT chk_custom_user_id_format 
CHECK (custom_user_id IS NULL OR custom_user_id ~ '^[a-zA-Z0-9_-]{3,50}$');
```

### 2. TypeScript 類型定義更新

#### 更新 `src/types/user.types.ts`
```typescript
// 在現有介面中添加 custom_user_id 字段

export interface CreateUserRequest {
  customUserId?: string;  // 新增
  gender?: string;
  birthDate?: Date | string;
  // ... 其他現有字段
}

export interface UpdateUserRequest {
  customUserId?: string;  // 新增
  name?: string;
  email?: string;
  // ... 其他現有字段
}

export interface FormattedUserResponse {
  id: number;
  _id: string;
  customUserId?: string;  // 新增
  name?: string;
  // ... 其他現有字段
}
```

### 3. 驗證器更新

#### 更新 `src/validators/user.validators.ts`
```typescript
import { z } from 'zod';

// 自定義用戶ID驗證規則
const customUserIdSchema = z
  .string()
  .min(3, '自定義ID至少需要3個字符')
  .max(50, '自定義ID不能超過50個字符')
  .regex(/^[a-zA-Z0-9_-]+$/, '自定義ID只能包含字母、數字、下劃線和連字符')
  .transform(val => val.toLowerCase()) // 統一轉為小寫
  .refine(val => !['admin', 'api', 'system', 'root', 'user'].includes(val), {
    message: '此ID為系統保留，請選擇其他ID'
  })
  .optional();

// 更新現有schema
export const createUserSchema = z.object({
  customUserId: customUserIdSchema,
  gender: z.enum(['male', 'female', 'other']).optional(),
  // ... 其他現有字段
});

export const updateUserSchema = z.object({
  customUserId: customUserIdSchema,
  name: z.string().optional(),
  // ... 其他現有字段
});
```

### 4. API 接口更新

#### 更新 `src/controllers/user.controller.ts`
```typescript
// 添加檢查自定義ID可用性的接口
export const checkCustomUserIdAvailability = async (req: Request, res: Response) => {
  try {
    const { customUserId } = req.params;
    
    // 驗證格式
    const validation = customUserIdSchema.safeParse(customUserId);
    if (!validation.success) {
      return res.status(400).json({
        error: true,
        message: '自定義ID格式不正確',
        details: validation.error.issues[0].message
      });
    }

    // 檢查是否已存在
    const existingUser = await prisma.users.findUnique({
      where: { custom_user_id: validation.data }
    });

    return res.json({
      available: !existingUser,
      message: existingUser ? '此ID已被使用' : '此ID可以使用'
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: '檢查ID可用性時發生錯誤'
    });
  }
};

// 通過自定義ID獲取用戶
export const getUserByCustomId = async (req: Request, res: Response) => {
  try {
    const { customUserId } = req.params;
    
    const user = await userService.getUserByCustomId(customUserId);
    if (!user) {
      return res.status(404).json({
        error: true,
        message: '找不到此用戶'
      });
    }

    return res.json({
      data: user,
      message: '成功獲取用戶信息'
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: '獲取用戶信息時發生錯誤'
    });
  }
};
```

#### 更新路由 `src/routes/user.routes.ts`
```typescript
// 新增路由
router.get('/check-custom-id/:customUserId', checkCustomUserIdAvailability);
router.get('/by-custom-id/:customUserId', getUserByCustomId);
```

### 5. 服務層更新

#### 更新 `src/services/user.service.ts`
```typescript
export const userService = {
  // 通過自定義ID獲取用戶
  async getUserByCustomId(customUserId: string): Promise<FormattedUserResponse | null> {
    const user = await prisma.users.findUnique({
      where: { custom_user_id: customUserId.toLowerCase() },
      include: {
        // ... 包含相關數據
      }
    });

    return user ? formatUserResponse(user) : null;
  },

  // 更新現有方法以支持自定義ID
  async createUser(userData: CreateUserRequest, tempUserId: string): Promise<{ user: FormattedUserResponse; token: string }> {
    // 如果提供了自定義ID，檢查唯一性
    if (userData.customUserId) {
      const existingUser = await prisma.users.findUnique({
        where: { custom_user_id: userData.customUserId.toLowerCase() }
      });
      
      if (existingUser) {
        throw new Error('此自定義ID已被使用');
      }
    }

    // 創建用戶邏輯...
  },

  // 其他方法...
};
```

### 6. Swagger 文檔更新

#### 更新 `src/swagger/schemas/user.schemas.ts`
```typescript
export const userSchemas = {
  CreateUserRequest: {
    type: 'object',
    properties: {
      customUserId: {
        type: 'string',
        description: '自定義用戶ID',
        pattern: '^[a-zA-Z0-9_-]{3,50}$',
        example: 'john_doe_123'
      },
      // ... 其他字段
    }
  },
  
  CheckCustomUserIdResponse: {
    type: 'object',
    properties: {
      available: {
        type: 'boolean',
        description: 'ID是否可用'
      },
      message: {
        type: 'string',
        description: '檢查結果說明'
      }
    }
  }
};
```

## 實施步驟

### 階段1：數據庫準備
1. **備份數據庫**
2. **執行遷移**：添加 `custom_user_id` 字段
3. **驗證遷移**：確保字段正確添加

### 階段2：後端開發
1. **更新Prisma模型**
2. **更新TypeScript類型定義**
3. **實施驗證器**
4. **開發API接口**
5. **更新服務層**
6. **編寫單元測試**

### 階段3：測試驗證
1. **API測試**：測試所有新增接口
2. **驗證測試**：測試各種邊界條件
3. **性能測試**：確保查詢性能
4. **安全測試**：防止SQL注入等攻擊

### 階段4：部署上線
1. **預生產環境測試**
2. **生產環境部署**
3. **監控系統**：觀察性能指標
4. **用戶反饋收集**

## 安全考慮

### 防護措施
1. **輸入驗證**：嚴格的格式檢查
2. **SQL注入防護**：使用參數化查詢
3. **速率限制**：防止暴力破解
4. **敏感詞過濾**：禁止使用不當內容

### 監控指標
- 自定義ID設置成功率
- 重複ID嘗試頻率
- API響應時間
- 錯誤率統計

## 測試用例

### 單元測試
```typescript
describe('Custom User ID Validation', () => {
  test('should accept valid custom user id', () => {
    const validIds = ['john_doe', 'alice123', 'user-name'];
    validIds.forEach(id => {
      expect(customUserIdSchema.parse(id)).toBe(id.toLowerCase());
    });
  });

  test('should reject invalid custom user id', () => {
    const invalidIds = ['ab', 'toolongusernametoolongusernametoolongusername', 'user@name', 'admin'];
    invalidIds.forEach(id => {
      expect(() => customUserIdSchema.parse(id)).toThrow();
    });
  });
});
```

### 集成測試
```typescript
describe('Custom User ID API', () => {
  test('should check availability correctly', async () => {
    const response = await request(app)
      .get('/api/users/check-custom-id/new_user')
      .expect(200);
    
    expect(response.body.available).toBe(true);
  });

  test('should find user by custom id', async () => {
    await createTestUser({ customUserId: 'test_user' });
    
    const response = await request(app)
      .get('/api/users/by-custom-id/test_user')
      .expect(200);
    
    expect(response.body.data.customUserId).toBe('test_user');
  });
});
```

## 部署清單

### 部署前檢查
- [ ] 數據庫備份完成
- [ ] 遷移腳本測試通過
- [ ] 所有測試用例通過
- [ ] 性能測試達標
- [ ] 安全掃描通過

### 部署步驟
1. [ ] 停止應用服務
2. [ ] 執行數據庫遷移
3. [ ] 部署新代碼
4. [ ] 啟動應用服務
5. [ ] 驗證功能正常
6. [ ] 監控系統指標

### 回滾方案
如果部署出現問題：
1. 立即回滾到上一版本代碼
2. 執行數據庫回滾腳本
3. 通知相關團隊
4. 分析問題原因

## 維護說明

### 日常維護
- 監控自定義ID使用情況
- 定期清理測試數據
- 更新禁用詞列表
- 性能優化

### 故障排除
常見問題及解決方案：
1. **ID衝突**：提示用戶選擇其他ID
2. **格式錯誤**：提供清晰的錯誤信息
3. **查詢緩慢**：檢查索引是否正確

---

**文檔版本**: 1.0  
**最後更新**: 2025-07-26  
**負責人**: 開發團隊