# /me 路由完整規劃文件

本文件提供 DaoDao 學習平台中所有 `/me` 相關 API 端點的完整規劃，包含詳細的請求/回應範例、參數說明和實作細節。

## 架構概覽

DaoDao 平台採用混合架構，同時存在 JavaScript 傳統路由和 TypeScript 現代路由：

### 路由文件分佈
- **TypeScript 現代路由**: `src/routes/me.routes.ts` - 專門的 `/me` 路由集合
- **JavaScript 傳統路由**: 分散在各功能模組中的 `/me` 子路由
- **控制器層**: `src/controllers/` (TypeScript) 和 `controllers/` (JavaScript)

## 完整 API 端點規範

### 1. 身份驗證相關

#### GET /api/v1/auth/me
**功能**: 獲取當前認證用戶的身份資訊

**文件位置**: `src/routes/auth.routes.ts:72` | `src/controllers/auth.controller.ts:142`

**認證要求**: Bearer Token 或 Session Cookie

**請求範例**:
```bash
GET /api/v1/auth/me
Authorization: Bearer <jwt_token>
```

**回應範例**:
```json
{
  "success": true,
  "data": {
    "id": 123,
    "_id": "uuid-external-id",
    "name": "張三",
    "email": "user@example.com",
    "photoURL": "https://example.com/photo.jpg",
    "role": "user",
    "isTemporary": false,
    "permissions": ["read", "write"],
    "roles": [{"name": "user"}]
  }
}
```

**錯誤回應**:
```json
{
  "success": false,
  "error": {
    "message": "無效的認證令牌",
    "code": "UNAUTHORIZED"
  }
}
```

### 2. 用戶管理相關

#### GET /api/v1/users/me
**功能**: 獲取當前用戶的完整個人資料

**文件位置**: `src/routes/user.routes.ts:42` | `src/controllers/user.controller.ts:35`

**認證要求**: 必須登入

**請求範例**:
```bash
GET /api/v1/users/me
Authorization: Bearer <jwt_token>
```

**回應範例**:
```json
{
  "success": true,
  "data": {
    "id": 123,
    "_id": "uuid-external-id",
    "name": "張三",
    "gender": "male",
    "email": "user@example.com",
    "photoURL": "https://example.com/photo.jpg",
    "birthDay": "1990-01-01",
    "isOpenLocation": true,
    "isOpenProfile": true,
    "role": 1,
    "location": "台北市",
    "tagList": ["程式設計", "學習"],
    "wantToDoList": ["建立網站", "學習新技能"],
    "educationStage": "university",
    "selfIntroduction": "我是一名軟體工程師...",
    "share": "分享我的學習經驗",
    "contactList": {
      "email": "user@example.com",
      "photoUrl": "https://example.com/photo.jpg",
      "isSubscribeEmail": true,
      "instagram": "@username",
      "discord": "username#1234",
      "line": "line_id",
      "facebook": "facebook_username"
    },
    "basicInfo": {
      "selfIntroduction": "我是一名軟體工程師...",
      "shareList": "分享我的學習經驗",
      "wantToDoList": ["建立網站", "學習新技能"]
    },
    "roleList": ["開發者", "學習者"],
    "createdDate": "2023-01-01 10:00:00",
    "updatedDate": "2023-12-01 15:30:00"
  }
}
```

#### DELETE /api/v1/users/me
**功能**: 刪除當前用戶帳號

**文件位置**: `src/routes/user.routes.ts:90` | `src/controllers/user.controller.ts:135`

**認證要求**: 必須登入

**請求範例**:
```bash
DELETE /api/v1/users/me
Authorization: Bearer <jwt_token>
```

**回應範例**:
```json
{
  "success": true,
  "message": "User deleted successfully",
  "data": {}
}
```

### 3. 想法/創意管理

#### GET /api/v1/me/ideas
**功能**: 獲取我的想法列表，支援篩選和分頁

**文件位置**: `src/routes/me.routes.ts:20` | `src/controllers/idea.controller.ts:188`

**認證要求**: 必須登入

**查詢參數**:
```typescript
interface IdeaQueryParams {
  page?: number;        // 頁碼，預設 1
  limit?: number;       // 每頁數量，預設 20，最大 100
  query?: string;       // 搜尋關鍵字
  tags?: string;        // 標籤，逗號分隔
  status?: 'active' | 'draft' | 'archived' | 'all'; // 狀態篩選
  sort?: 'createdAt' | 'updatedAt' | 'likeCount';    // 排序欄位
  order?: 'asc' | 'desc'; // 排序方向，預設 desc
}
```

**請求範例**:
```bash
GET /api/v1/me/ideas?page=1&limit=10&tags=程式設計,學習&status=active&sort=createdAt&order=desc
Authorization: Bearer <jwt_token>
```

**回應範例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-idea-id",
      "content": "我想要學習 React 和 TypeScript...",
      "tags": ["React", "TypeScript", "前端開發"],
      "status": "active",
      "resources": [
        {
          "name": "React 官方文件",
          "url": "https://reactjs.org/docs",
          "description": "React 官方學習資源"
        }
      ],
      "createdAt": "2023-12-01T10:00:00Z",
      "updatedAt": "2023-12-01T15:30:00Z",
      "likeCount": 5,
      "isLiked": false
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3,
    "hasMore": true
  }
}
```

**驗證規則**:
- `content`: 1-5000 字元
- `tags`: 最多 10 個，每個標籤最多 50 字元
- `resources`: 最多 5 個資源

### 4. 專案管理相關

#### GET /projects/me
**功能**: 獲取我的學習計畫/專案列表

**文件位置**: `routes/project.js:16` | `controllers/project.js:477`

**認證要求**: 必須登入

**請求範例**:
```bash
GET /projects/me
Authorization: Bearer <jwt_token>
```

**回應範例**:
```json
[
  {
    "id": "uuid-project-id",
    "userId": 123,
    "imgUrl": "https://example.com/project-image.jpg",
    "title": "學習 React 開發",
    "description": "從零開始學習 React...",
    "motivation": "driven_by_curiosity",
    "motivationDescription": "對前端技術充滿好奇心",
    "goal": "建立一個完整的 React 應用程式",
    "content": "透過實作專案來學習 React",
    "strategy": "book_reading",
    "strategyDescription": "閱讀官方文件和技術書籍",
    "resourceName": ["React 官方文件", "現代 React 書籍"],
    "outcome": "building_websites",
    "outcomeDescription": "建立個人作品集網站",
    "isPublic": true,
    "status": "Ongoing",
    "startDate": "2023-12-01",
    "endDate": "2024-03-01",
    "interval": 12,
    "createdAt": "2023-12-01T10:00:00Z",
    "updatedAt": "2023-12-05T15:30:00Z",
    "version": 2,
    "eventId": "marathon-2024-q1",
    "user": {
      "id": 123,
      "name": "張三",
      "_id": "uuid-user-id",
      "roleList": ["開發者"],
      "photoURL": "https://example.com/user-photo.jpg"
    },
    "milestones": [
      {
        "id": 1,
        "position": 1,
        "name": "學習基礎概念",
        "description": "了解 React 基本概念",
        "startDate": "2023-12-01",
        "endDate": "2023-12-15",
        "isCompleted": true,
        "tasks": [
          {
            "id": 1,
            "name": "閱讀官方文件",
            "position": 1,
            "description": "完成 React 官方文件前三章",
            "daysOfWeek": [1, 3, 5],
            "isCompleted": true
          }
        ]
      }
    ]
  }
]
```

#### GET /projects/outcomes/me
**功能**: 獲取我的學習成果列表

**文件位置**: `routes/project.js:18` | `controllers/outcome.js:118`

**認證要求**: 必須登入

**請求範例**:
```bash
GET /projects/outcomes/me
Authorization: Bearer <jwt_token>
```

**回應範例**:
```json
[
  {
    "id": 1,
    "week": 1,
    "title": "第一週學習成果",
    "content": "本週完成了 React 基礎概念的學習...",
    "date": "2023-12-08",
    "imgUrls": [
      "https://example.com/outcome-image1.jpg",
      "https://example.com/outcome-image2.jpg"
    ],
    "videoUrls": [
      "https://example.com/demo-video.mp4"
    ],
    "visibility": "public"
  }
]
```

#### GET /projects/notes/me
**功能**: 獲取我的學習筆記列表

**文件位置**: `routes/project.js:19` | `controllers/note.js:174`

**認證要求**: 必須登入

**請求範例**:
```bash
GET /projects/notes/me
Authorization: Bearer <jwt_token>
```

**回應範例**:
```json
[
  {
    "id": 1,
    "week": 1,
    "title": "React 學習筆記",
    "content": "今天學習了 React 的組件概念...",
    "date": "2023-12-01",
    "imgUrls": [
      "https://example.com/note-screenshot.jpg"
    ],
    "videoUrls": [],
    "visibility": "private",
    "user": {
      "id": 123,
      "name": "張三",
      "_id": "uuid-user-id",
      "roleList": ["開發者"],
      "photoURL": "https://example.com/user-photo.jpg"
    }
  }
]
```

### 5. 導師管理相關

#### GET /mentors/me/marathons
**功能**: 獲取導師參與的馬拉松活動列表

**文件位置**: `routes/mentor.js:15` | `controllers/mentor.js:101`

**認證要求**: 必須登入且具有導師權限

**請求範例**:
```bash
GET /mentors/me/marathons
Authorization: Bearer <jwt_token>
```

**回應範例**:
```json
[
  {
    "id": 1,
    "eventId": "marathon-2024-q1",
    "title": "2024 第一季學習馬拉松",
    "startDate": "2024-01-01",
    "endDate": "2024-03-31",
    "participantCount": 15
  }
]
```

#### GET /mentors/me/marathons/:eventId/participants
**功能**: 獲取導師在指定馬拉松下的學員列表

**文件位置**: `routes/mentor.js:27` | `controllers/mentor.js:215`

**認證要求**: 必須登入且具有導師權限

**路徑參數**:
- `eventId`: 馬拉松活動 ID

**請求範例**:
```bash
GET /mentors/me/marathons/marathon-2024-q1/participants
Authorization: Bearer <jwt_token>
```

**回應範例**:
```json
{
  "id": 1,
  "eventId": "marathon-2024-q1",
  "title": "2024 第一季學習馬拉松",
  "startDate": "2024-01-01",
  "endDate": "2024-03-31",
  "participants": [
    {
      "id": 456,
      "name": "李四",
      "_id": "uuid-participant-id",
      "roleList": ["學習者"],
      "photoURL": "https://example.com/participant-photo.jpg",
      "location": "台中市",
      "tagList": ["前端開發", "學習"],
      "wantToDoList": ["建立作品集"],
      "educationStage": "university",
      "share": "希望能學會現代前端技術",
      "updatedDate": "2023-12-01T10:00:00Z",
      "projectId": "uuid-project-id",
      "projectTitle": "學習 Vue.js 開發"
    }
  ]
}
```

### 6. 實踐功能相關（規劃中）

#### GET /api/v1/me/practices
**功能**: 獲取我的實踐記錄

**狀態**: 規劃中

**預期查詢參數**:
```typescript
interface PracticeQueryParams {
  page?: number;
  limit?: number;
  status?: 'active' | 'completed' | 'paused';
  category?: string;
  dateFrom?: string;
  dateTo?: string;
}
```

**預期回應格式**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-practice-id",
      "title": "每日程式練習",
      "description": "每天至少寫 1 小時程式",
      "category": "programming",
      "status": "active",
      "streak": 15,
      "totalDays": 30,
      "createdAt": "2023-11-01T10:00:00Z",
      "lastPracticeDate": "2023-12-01T18:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

#### GET /api/v1/me/practice-stats
**功能**: 獲取我的實踐統計資料

**狀態**: 規劃中

**預期回應格式**:
```json
{
  "success": true,
  "data": {
    "totalPractices": 5,
    "activePractices": 3,
    "completedPractices": 2,
    "totalPracticeDays": 150,
    "currentStreak": 15,
    "longestStreak": 45,
    "averageDailyTime": 90,
    "monthlyStats": [
      {
        "month": "2023-12",
        "practiceCount": 25,
        "totalMinutes": 2250
      }
    ],
    "categoryBreakdown": [
      {
        "category": "programming",
        "count": 3,
        "totalMinutes": 1800
      }
    ]
  }
}
```

## 技術規範

### 身份驗證要求
所有 `/me` 相關端點都需要身份驗證：

#### 支援的認證方式
1. **JWT Bearer Token**: 
   ```bash
   Authorization: Bearer <jwt_token>
   ```
2. **Session Cookie**: 支援 session-based 認證
3. **雙重認證**: 部分端點支援 JWT 或 Session 任一方式

#### 中介軟體
- `authenticate`: 標準 JWT 認證，要求有效的 Bearer Token
- `authenticateAny`: 支援 JWT 或 Session 任一認證方式
- `optionalAuth`: 可選認證，未認證用戶也能存取但功能受限

#### 認證流程
1. 用戶發送請求時在 Authorization header 中包含 Bearer Token
2. 中介軟體驗證 token 有效性和過期時間
3. 解析 token 並將用戶資訊填入 `req.user`
4. 控制器檢查 `req.user` 並執行相應邏輯

### 請求/回應格式

#### 統一回應格式
所有端點遵循統一的回應格式：

**成功回應**:
```json
{
  "success": true,
  "data": {}, // 實際資料
  "message": "操作描述" // 可選
}
```

**分頁回應**:
```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasMore": true
  }
}
```

**錯誤回應**:
```json
{
  "success": false,
  "error": {
    "message": "錯誤描述",
    "code": "ERROR_CODE",
    "details": "詳細錯誤資訊"
  }
}
```

### 錯誤處理

#### HTTP 狀態碼規範
- `200 OK`: 請求成功
- `201 Created`: 資源創建成功
- `400 Bad Request`: 請求參數錯誤
- `401 Unauthorized`: 未認證或認證失效
- `403 Forbidden`: 權限不足
- `404 Not Found`: 資源不存在
- `409 Conflict`: 資源衝突
- `422 Unprocessable Entity`: 驗證失敗
- `500 Internal Server Error`: 伺服器內部錯誤

#### 錯誤碼規範
- `AUTHENTICATION_REQUIRED`: 需要身份驗證
- `INVALID_TOKEN`: 無效的認證令牌
- `INSUFFICIENT_PERMISSIONS`: 權限不足
- `RESOURCE_NOT_FOUND`: 資源不存在
- `VALIDATION_ERROR`: 輸入驗證失敗
- `RATE_LIMIT_EXCEEDED`: 請求頻率超限

### 資料驗證

#### Zod 驗證器使用
所有端點使用 Zod 進行輸入驗證：

```typescript
// 查詢參數驗證
export const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional()
});

// 請求體驗證
export const createSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().min(1).max(5000),
  tags: z.array(z.string()).max(10).optional()
});
```

#### 驗證中介軟體
```typescript
import { validate } from '@/validators/validation.middleware';

router.get('/endpoint', 
  authenticate,
  validate(querySchema, 'query'),
  controller.handler
);
```

### 分頁規範

#### 標準分頁參數
- `page`: 頁碼，從 1 開始，預設值 1
- `limit`: 每頁數量，範圍 1-100，預設值 20
- `sort`: 排序欄位，如 'createdAt', 'updatedAt'
- `order`: 排序方向，'asc' 或 'desc'，預設 'desc'

#### 分頁回應格式
```typescript
interface PaginationResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}
```

### 效能考量

#### 快取策略
- **用戶資料**: 快取 5 分鐘，支援強制刷新
- **列表資料**: 快取 1 分鐘，支援實時更新
- **統計資料**: 快取 15 分鐘

#### 限流控制
- **全域限制**: 每分鐘 1000 次請求
- **用戶限制**: 每分鐘 100 次請求
- **敏感操作**: 每分鐘 10 次請求

## 開發指南

### 新增 `/me` 端點完整流程

#### 1. 規劃階段
- 確定端點功能和業務邏輯
- 設計請求/回應格式
- 確定認證和權限要求
- 選擇適合的路由文件位置

#### 2. 實作階段

**Step 1: 定義驗證器**
```typescript
// src/validators/resource.validators.ts
export const getMyResourcesSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  category: z.string().optional(),
  status: z.enum(['active', 'archived']).optional()
});
```

**Step 2: 實作服務層**
```typescript
// src/services/resource.service.ts
export const getMyResources = async (
  userId: number, 
  params: ResourceQueryParams
) => {
  const { page, limit, category, status } = params;
  
  const where = { userId };
  if (category) where.category = category;
  if (status) where.status = status;
  
  const { rows, count } = await Resource.findAndCountAll({
    where,
    limit,
    offset: (page - 1) * limit,
    order: [['createdAt', 'DESC']]
  });
  
  return {
    resources: rows.map(formatResourceResponse),
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit),
      hasMore: count > page * limit
    }
  };
};
```

**Step 3: 實作控制器**
```typescript
// src/controllers/resource.controller.ts
export const getMyResources = asyncWrapper(async (req: Request, res: Response) => {
  const currentUser = req.user;
  if (!currentUser || !currentUser.id) {
    return res.status(401).json({
      success: false,
      error: {
        message: '需要登入才能查看我的資源',
        code: 'AUTHENTICATION_REQUIRED'
      }
    });
  }
  
  const params = getMyResourcesSchema.parse(req.query);
  const result = await resourceService.getMyResources(currentUser.id, params);
  
  res.json({
    success: true,
    data: result.resources,
    pagination: result.pagination
  });
});
```

**Step 4: 定義路由**
```typescript
// src/routes/me.routes.ts
router.get('/resources',
  authenticate,
  validate(getMyResourcesSchema, 'query'),
  resourceController.getMyResources as RequestHandler
);
```

**Step 5: 更新 Swagger 文件**
```typescript
// src/swagger/paths/me.paths.ts
/**
 * @swagger
 * /api/v1/me/resources:
 *   get:
 *     summary: 獲取我的資源列表
 *     tags: [Me]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *     responses:
 *       200:
 *         description: 成功獲取資源列表
 */
```

#### 3. 測試階段

**單元測試範例**:
```typescript
// src/tests/unit/controllers/resource.controller.test.ts
describe('getMyResources', () => {
  it('should return user resources with pagination', async () => {
    const mockUser = { id: 1, _id: 'uuid' };
    const mockReq = {
      user: mockUser,
      query: { page: '1', limit: '10' }
    };
    
    const result = await resourceController.getMyResources(mockReq, mockRes);
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(10);
    expect(result.pagination).toBeDefined();
  });
});
```

**整合測試範例**:
```typescript
// src/tests/integration/me-api.test.ts
describe('GET /api/v1/me/resources', () => {
  it('should return 401 without authentication', async () => {
    const response = await request(app)
      .get('/api/v1/me/resources')
      .expect(401);
      
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });
});
```

### 程式碼品質標準

#### TypeScript 規範
- 使用嚴格的類型定義，避免 `any` 類型
- 定義清楚的介面和類型別名
- 使用泛型提高程式碼復用性

#### 錯誤處理模式
```typescript
// 統一使用 asyncWrapper 包裝控制器
export const handler = asyncWrapper(async (req: Request, res: Response) => {
  // 業務邏輯
});

// 自定義錯誤類型
class ValidationError extends Error {
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

#### 資安考量
- 輸入驗證：使用 Zod 嚴格驗證所有輸入
- 輸出過濾：避免洩露敏感資訊
- SQL 注入防護：使用 ORM 參數化查詢
- XSS 防護：HTML 轉義和 Content Security Policy

## 遷移規劃

### 現狀分析
```
✅ 已完成 (TypeScript 現代架構)
├── /api/v1/auth/me - 身份驗證
├── /api/v1/users/me - 用戶管理
└── /api/v1/me/ideas - 想法管理

🔄 遷移中 (JavaScript → TypeScript)
├── /projects/me → /api/v1/me/projects
├── /projects/outcomes/me → /api/v1/me/outcomes
├── /projects/notes/me → /api/v1/me/notes
├── /mentors/me/marathons → /api/v1/me/mentorships
└── /mentors/me/marathons/:id/participants → /api/v1/me/mentorships/:id/participants

📋 規劃中 (新功能)
├── /api/v1/me/practices - 實踐記錄
├── /api/v1/me/practice-stats - 實踐統計
├── /api/v1/me/resources - 個人資源草稿
├── /api/v1/me/notifications - 個人通知
├── /api/v1/me/preferences - 個人偏好設定
└── /api/v1/me/analytics - 個人學習分析
```

### 遷移時程表
- **Phase 1** (1-2 週): 專案相關端點遷移
- **Phase 2** (2-3 週): 導師相關端點遷移
- **Phase 3** (3-4 週): 新功能開發和測試
- **Phase 4** (4-5 週): 整合測試和效能優化

### 向後相容策略
- 保留舊端點 6 個月，標記為 deprecated
- 提供遷移指南和範例程式碼
- 逐步引導前端團隊遷移到新端點

## 監控和維護

### 效能監控指標
- **回應時間**: 95% 請求應在 200ms 內回應
- **錯誤率**: 錯誤率應低於 1%
- **吞吐量**: 支援每秒 1000 次併發請求

### 日誌記錄規範
```typescript
// 結構化日誌
logger.info('User action', {
  userId: req.user.id,
  action: 'getMyResources',
  params: req.query,
  responseTime: Date.now() - startTime
});
```

### 健康檢查
每個 `/me` 端點都應該支援健康檢查和狀態監控。

## 相關文件
- [API Response Migration](./api-v1-response-migration.md) - API 回應格式遷移指南
- [Ideas API v1](./ideas-api-v1.md) - 想法功能 API 詳細文件
- [Practice API v1](./practice-api-v1.md) - 實踐功能 API 規劃
- [Auth Service Documentation](./auth-service-documentation.md) - 身份驗證服務文件
- [Database Schema](./database-schema.md) - 資料庫結構說明
- [Error Handling Guide](./error-handling-guide.md) - 錯誤處理指南