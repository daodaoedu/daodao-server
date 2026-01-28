# 分頁處理指南 (Pagination Guide)

本文檔說明 `src/` 目錄下服務層如何處理分頁功能，為其他開發者提供參考實作模式。

## 目錄

1. [分頁架構概覽](#分頁架構概覽)
2. [分頁類型](#分頁類型)
3. [核心工具與類型](#核心工具與類型)
4. [實作模式](#實作模式)
5. [最佳實踐](#最佳實踐)
6. [常見問題與解決方案](#常見問題與解決方案)

## 分頁架構概覽

DaoDao 平台使用統一的分頁響應格式，支援兩種分頁模式：

- **頁碼分頁 (Page-based Pagination)**: 適用於傳統分頁場景
- **游標分頁 (Cursor-based Pagination)**: 適用於即時數據流和大數據集

### 檔案結構

```
src/
├── types/
│   ├── api-response.types.ts    # 分頁響應類型定義
│   └── common.types.ts          # 通用分頁參數類型
├── utils/
│   ├── pagination-helper.ts     # 分頁計算工具
│   └── response-helper.ts       # 響應格式工具
├── validators/
│   └── request-params.validator.ts  # 分頁參數驗證
├── constants/
│   └── mappings.ts              # 分頁限制常數
└── services/
    ├── project.service.ts       # 頁碼分頁範例
    ├── resource.service.ts      # 游標分頁範例
    └── idea.service.ts          # 頁碼分頁範例
```

## 分頁類型

### 1. 頁碼分頁 (Page-based Pagination)

**適用場景**: 一般列表查詢、後台管理、需要跳頁功能

**響應格式**:
```typescript
interface PaginatedApiResponse<T> {
  success: true;
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  timestamp: string;
  meta?: ResponseMeta;
}
```

**查詢參數**:
```typescript
// 服務層內部參數（snake_case，對應數據庫欄位）
interface ProjectQueryParams {
  page?: number;       // 頁碼，從 1 開始
  limit?: number;      // 每頁項目數
  sort_by?: string;    // 排序欄位（數據庫欄位名）
  sort_order?: 'asc' | 'desc'; // 排序方向
  status?: string;     // 狀態篩選
  is_public?: boolean; // 公開性篩選
  user_id?: number;    // 使用者篩選
  search?: string;     // 搜尋關鍵字
}

// API/控制器層參數（camelCase，前端友善）
interface ProjectAPIParams {
  page?: number;       // 頁碼
  limit?: number;      // 每頁項目數
  sortBy?: string;     // 排序欄位（前端欄位名）
  sortOrder?: 'asc' | 'desc'; // 排序方向
  status?: string;     // 狀態篩選
  isPublic?: boolean;  // 公開性篩選
  userId?: number;     // 使用者篩選
  search?: string;     // 搜尋關鍵字
}
```

### 2. 游標分頁 (Cursor-based Pagination)

**適用場景**: 無限滾動、即時數據流、大數據集

**響應格式**:
```typescript
interface CursorPaginatedApiResponse<T> {
  success: true;
  data: T[];
  pagination: {
    cursors: {
      start: string | null;
      end: string | null;
    };
    hasMore: boolean;
    count: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
    nextCursor: string | null;
    prevCursor: string | null;
    totalEstimate: number | null;
    parentTotalEstimate: number | null;
  };
  timestamp: string;
  meta?: ResponseMeta;
}
```

**查詢參數**:
```typescript
interface ResourcePaginationParams {
  cursor?: string;     // Base64 編碼的游標
  limit?: number;      // 每頁項目數
  sort?: string;       // 排序欄位（如 'created_at'）
  order?: 'asc' | 'desc'; // 排序方向
}

interface ResourceFilterParams {
  type?: string;           // 資源類型
  cost?: string;          // 成本類型
  level?: string;         // 難度等級
  majorCategory?: string; // 主分類
  subCategory?: string;   // 子分類
  tags?: string[];        // 標籤陣列
  query?: string;         // 搜尋關鍵字
  createdBy?: number;     // 創建者 ID
}
```

## 命名風格轉換

DaoDao 平台採用**三層命名風格轉換**架構，確保各層使用適當的命名慣例：

### 1. API 層 → 服務層轉換

**控制器層負責命名轉換**:
```typescript
// src/controllers/project.controller.ts
const queryParams = {
  page: req.query.page ? parseInt(req.query.page as string) : 1,
  limit: req.query.limit ? parseInt(req.query.limit as string) : 20,

  // API camelCase → 服務層 snake_case
  is_public: req.query.isPublic ? req.query.isPublic === 'true' : undefined,
  user_id: req.query.userId ? parseInt(req.query.userId as string) : undefined,

  // 排序欄位名稱映射
  sort_by: req.query.sortBy ? (() => {
    const sortByMap = {
      'createdAt': 'created_at',    // 前端 → 數據庫
      'updatedAt': 'updated_at',
      'title': 'title',
      'status': 'status'
    } as const;
    return sortByMap[req.query.sortBy as keyof typeof sortByMap] || 'created_at';
  })() : 'created_at',

  sort_order: (req.query.sortOrder as 'asc' | 'desc') || 'desc'
};
```

### 2. 服務層 → 數據庫層

**服務層直接使用數據庫欄位名**:
```typescript
// src/services/project.service.ts
const whereClause = {};
if (is_public !== undefined) whereClause.is_public = is_public;  // 直接對應
if (user_id) whereClause.user_id = user_id;                     // 直接對應

const projects = await prisma.project.findMany({
  where: whereClause,
  orderBy: { [sort_by]: sort_order },  // 直接使用數據庫欄位名
  take: limit,
  skip: (page - 1) * limit
});
```

### 3. 數據庫 → API 響應轉換

**格式化函數負責輸出轉換**:
```typescript
const formatProjectResponse = (project: ProjectWithIncludes): ProjectResponse => {
  return {
    id: project.external_id || '',
    userId: project.user_id,           // snake_case → camelCase
    isPublic: project.is_public,       // snake_case → camelCase
    createdAt: project.created_at,     // snake_case → camelCase
    updatedAt: project.updated_at,     // snake_case → camelCase
    // ...
  };
};
```

### 命名風格對照表

| 層級 | 命名風格 | 範例 | 說明 |
|------|----------|------|------|
| **前端/API** | camelCase | `sortBy`, `isPublic`, `userId` | 前端友善命名 |
| **服務層** | snake_case | `sort_by`, `is_public`, `user_id` | 與數據庫一致 |
| **數據庫** | snake_case | `created_at`, `updated_at`, `is_public` | PostgreSQL 慣例 |

## 核心工具與類型

### 1. 分頁參數驗證 (`src/validators/request-params.validator.ts`)

```typescript
// 通用分頁參數驗證
export const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.string()
    .transform(val => parseInt(val, 10))
    .refine(val => !isNaN(val), { message: "limit 必須是有效的數字" })
    .refine(val => val > 0 && val <= 100, { message: "limit 必須在 1-100 之間" })
    .optional(),
  sort: z.enum([Object.values(SORT_FIELDS)[0], ...Object.values(SORT_FIELDS).slice(1)]).optional(),
  order: z.enum([Object.values(SORT_DIRECTIONS)[0], ...Object.values(SORT_DIRECTIONS).slice(1)]).optional()
});
```

### 2. 分頁計算工具 (`src/utils/pagination-helper.ts`)

```typescript
// 頁碼分頁計算
export const calculatePagination = (
  page: number,
  limit: number,
  totalItems: number
): PaginationInfo => {
  const totalPages = Math.ceil(totalItems / limit);
  return {
    currentPage: page,
    totalPages,
    totalItems,
    itemsPerPage: limit,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };
};

// 游標分頁資訊創建
export const createCursorInfo = (
  data: Record<string, unknown>[],
  hasMore: boolean,
  cursorField = 'id'
): CursorPaginationInfo => {
  const start = data.length > 0 ? data[0][cursorField] : null;
  const end = data.length > 0 ? data[data.length - 1][cursorField] : null;

  return {
    cursors: {
      start: start ? btoa(start.toString()) : null,
      end: end ? btoa(end.toString()) : null
    },
    hasMore,
    count: data.length,
    // ... 其他分頁資訊
  };
};
```

### 3. 響應格式工具 (`src/utils/response-helper.ts`)

```typescript
// 頁碼分頁響應
export const createPaginatedResponse = <T>(
  data: T[],
  pagination: PaginationInfo,
  meta?: Partial<ResponseMeta>
): PaginatedApiResponse<T> => ({
  success: true,
  data,
  pagination,
  timestamp: new Date().toISOString(),
  meta
});

// 游標分頁響應
export const createCursorPaginatedResponse = <T>(
  data: T[],
  pagination: CursorPaginationInfo,
  meta?: Partial<ResponseMeta>
): CursorPaginatedApiResponse<T> => ({
  success: true,
  data,
  pagination,
  timestamp: new Date().toISOString(),
  meta
});
```

### 4. 分頁限制常數 (`src/constants/mappings.ts`)

```typescript
// 通用分頁限制
export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_PAGE_LIMIT = 100;

// 資源特定限制
export const DEFAULT_RESOURCE_PAGE_LIMIT = 5;
export const MAX_RESOURCE_PAGE_LIMIT = 20;

// 心得特定限制
export const DEFAULT_REVIEW_PAGE_LIMIT = 2;
export const MAX_REVIEW_PAGE_LIMIT = 10;
```

## 實作模式

### 1. 頁碼分頁實作 (專案服務範例)

**檔案**: `src/services/project.service.ts`

```typescript
export const getProjects = async (
  queryParams: ProjectQueryParams,
  userId?: number
): Promise<PaginatedApiResponse<ProjectResponse>> => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      is_public,
      user_id,
      search,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = queryParams;

    // 計算 skip 偏移量
    const skip = (page - 1) * limit;

    // 構建查詢條件
    const whereClause: Record<string, unknown> = {};

    if (status) whereClause.status = status;
    if (is_public !== undefined) whereClause.is_public = is_public;
    if (user_id) whereClause.user_id = user_id;

    // 搜尋功能
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { goal: { contains: search, mode: 'insensitive' } }
      ];
    }

    // 並行查詢數據和總數
    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where: whereClause,
        include: {
          users: { /* 包含用戶資訊 */ },
          milestone: { /* 包含里程碑 */ }
        },
        orderBy: { [sort_by]: sort_order as 'asc' | 'desc' },
        take: limit,
        skip
      }),
      prisma.project.count({ where: whereClause })
    ]);

    // 格式化項目資料
    const formattedProjects = projects.map(project => formatProjectResponse(project));

    // 計算分頁資訊
    const paginationInfo = calculatePagination(page, limit, total);

    // 創建分頁響應
    return createPaginatedResponse(formattedProjects, paginationInfo, {
      searchQuery: search,
      filters: { status, is_public, user_id, sort_by, sort_order }
    });
  } catch (error) {
    throw error instanceof Error ? error : new Error('獲取專案列表失敗');
  }
};
```

**關鍵要點**:
- 使用 `skip` 和 `take` 進行 Prisma 分頁查詢
- 並行執行數據查詢和計數查詢以提升性能
- 使用 `calculatePagination` 工具計算分頁資訊
- 通過 `meta` 傳遞搜尋和篩選資訊

### 2. 游標分頁實作 (資源服務範例)

**檔案**: `src/services/resource.service.ts`

```typescript
export async function getResources(
  filters: ResourceFilterParams,
  pagination: PaginationParams
): Promise<CursorPaginatedApiResponse<ResourceResponse>> {
  const { cursor, limit = DEFAULT_RESOURCE_PAGE_LIMIT, sort = 'created_at', order = 'desc' } = pagination;
  const actualLimit = Math.min(limit, MAX_RESOURCE_PAGE_LIMIT);

  // 構建查詢條件
  const where: Prisma.resourcesWhereInput = {
    deleted_at: null
  };

  // 添加篩選條件
  if (filters.type) where.type = filters.type;
  if (filters.cost) where.cost = filters.cost;
  if (filters.level) where.level = filters.level;

  // 處理游標分頁
  if (cursor) {
    const decodedCursor = decodeCursor(cursor);
    if (sort === 'created_at' && decodedCursor) {
      where.created_at = order === 'desc'
        ? { lt: decodedCursor.timestamp }
        : { gt: decodedCursor.timestamp };
    }
  }

  // 查詢資源列表 (多取一個判斷是否有下一頁)
  const resources = await prisma.resources.findMany({
    where,
    include: {
      users: { /* 用戶資訊 */ },
      categories_resources_major_category_idTocategories: { /* 主分類 */ },
      categories_resources_sub_category_idTocategories: { /* 子分類 */ }
    },
    orderBy: { [sort]: order },
    take: actualLimit + 1
  });

  // 處理分頁
  const hasMore = resources.length > actualLimit;
  const resourcesData = hasMore ? resources.slice(0, actualLimit) : resources;

  // 批量查詢標籤
  const resourceIds = resourcesData.map(resource => resource.id);
  const allTags = await prisma.entity_tags.findMany({
    where: {
      entity_type: 'resource',
      entity_id: { in: resourceIds }
    },
    include: { tags: true }
  });

  // 格式化資源列表
  const resourceList = resourcesData.map(resource => ({
    // ... 格式化邏輯
  }));

  // 生成分頁資訊
  const paginationMetadata = generatePaginationMetadata(
    resourcesData,
    resourcesData.length,
    actualLimit,
    sort,
    hasMore
  );

  return createCursorPaginatedResponse(
    resourceList,
    paginationMetadata,
    {
      searchQuery: filters.query,
      filters: filters
    }
  );
}
```

**關鍵要點**:
- 使用游標條件 (`where.created_at = { lt: cursor }`) 進行查詢
- 多取一筆資料判斷是否有下一頁 (`take: actualLimit + 1`)
- 批量查詢關聯資料 (標籤、評價等) 以提升性能
- Base64 編碼/解碼游標值

### 3. 標籤篩選優化模式

兩種服務都採用預篩選模式處理標籤查詢：

```typescript
// 預先處理標籤篩選
let tagFilteredResourceIds: number[] | undefined;
if (filters.tags && filters.tags.length > 0) {
  const taggedResourceIds = await prisma.entity_tags.findMany({
    where: {
      entity_type: 'resource',
      tags: { name: { in: filters.tags } }
    },
    select: { entity_id: true }
  });

  tagFilteredResourceIds = taggedResourceIds.map(tag => tag.entity_id);

  // 如果沒有匹配的標籤，直接返回空結果
  if (tagFilteredResourceIds.length === 0) {
    return createCursorPaginatedResponse([], emptyPaginationInfo);
  }
}

// 將標籤篩選結果加入主查詢
if (tagFilteredResourceIds) {
  where.id = { in: tagFilteredResourceIds };
}
```

## 最佳實踐

### 1. 性能優化

**並行查詢**:
```typescript
// ✅ 正確：並行執行數據和計數查詢
const [data, total] = await Promise.all([
  prisma.model.findMany({ /* 查詢條件 */ }),
  prisma.model.count({ /* 相同查詢條件 */ })
]);

// ❌ 錯誤：序列執行
const data = await prisma.model.findMany({ /* 查詢條件 */ });
const total = await prisma.model.count({ /* 查詢條件 */ });
```

**批量查詢關聯數據**:
```typescript
// ✅ 正確：批量查詢標籤
const allTags = await prisma.entity_tags.findMany({
  where: { entity_id: { in: resourceIds } },
  include: { tags: true }
});

// ❌ 錯誤：在迴圈中查詢
for (const resource of resources) {
  const tags = await prisma.entity_tags.findMany({
    where: { entity_id: resource.id }
  });
}
```

### 2. 限制設置

**設定合理的分頁限制**:
```typescript
// 使用常數定義限制
const actualLimit = Math.min(limit, MAX_RESOURCE_PAGE_LIMIT);

// 針對不同資源類型設定不同限制
const limits = {
  resources: { default: 5, max: 20 },
  reviews: { default: 2, max: 10 },
  projects: { default: 20, max: 100 }
};
```

### 3. 錯誤處理

**優雅處理空結果**:
```typescript
// 標籤篩選無結果時的處理
if (tagFilteredIds && tagFilteredIds.length === 0) {
  return createPaginatedResponse([], {
    currentPage: page,
    totalPages: 0,
    totalItems: 0,
    itemsPerPage: limit,
    hasNext: false,
    hasPrev: false
  });
}
```

### 4. 響應格式一致性

**使用統一的響應創建函數**:
```typescript
// ✅ 使用工具函數
return createPaginatedResponse(data, paginationInfo, meta);

// ❌ 手動構建響應
return {
  success: true,
  data,
  pagination: paginationInfo,
  timestamp: new Date().toISOString()
};
```

### 5. 驗證和安全

**參數驗證**:
```typescript
// 使用 Zod 驗證分頁參數
const validatedParams = paginationSchema.parse(req.query);

// 限制最大頁數以防止資源消耗
const maxPage = Math.ceil(totalItems / limit);
if (page > maxPage) {
  throw new BadRequestError('頁碼超出範圍');
}
```

## 常見問題與解決方案

### 1. 性能問題

**問題**: 大數據集下的計數查詢性能差
**解決方案**:
```typescript
// 對於大數據集，使用估算總數
const useEstimate = totalItems > 10000;
const total = useEstimate
  ? await getEstimatedCount(whereClause)
  : await prisma.model.count({ where: whereClause });
```

### 2. 游標分頁中的排序問題

**問題**: 游標分頁時排序欄位值重複導致結果不穩定
**解決方案**:
```typescript
// 使用複合排序，加入唯一欄位
const orderBy = [
  { [sort]: order },
  { id: 'asc' } // 添加唯一欄位確保穩定排序
];
```

### 3. 標籤篩選性能

**問題**: 多標籤 AND 查詢性能問題
**解決方案**:
```typescript
// 使用 GROUP BY 和 HAVING 進行多標籤 AND 查詢
const taggedIds = await prisma.$queryRaw`
  SELECT entity_id, COUNT(*) as tag_count
  FROM entity_tags et
  INNER JOIN tags t ON et.tag_id = t.id
  WHERE et.entity_type = 'resource'
  AND t.name = ANY(${tags})
  GROUP BY entity_id
  HAVING COUNT(*) = ${tags.length}
`;
```

### 4. 游標編碼問題

**問題**: 游標包含特殊字符導致 URL 解析錯誤
**解決方案**:
```typescript
// 實際使用的游標編碼（來自 transform-utils.ts）
export function decodeCursor(cursor: string): { id: number; timestamp: Date } | null {
  try {
    // 游標格式：BASE64(JSON({ id: number, timestamp: string/number }))
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
    const parsed = JSON.parse(decoded);

    // 確保 timestamp 格式一致，轉換為 Date 對象
    if (parsed.timestamp) {
      parsed.timestamp = new Date(parsed.timestamp);
    }

    return parsed;
  } catch (error) {
    return null;
  }
}

// 編碼游標
export function encodeCursor(id: number, timestamp: Date): string {
  const cursorData = { id, timestamp: timestamp.toISOString() };
  return Buffer.from(JSON.stringify(cursorData)).toString('base64');
}
```

### 5. 事務中的分頁

**問題**: 在事務中執行分頁查詢
**解決方案**:
```typescript
return await prisma.$transaction(async (tx) => {
  const [data, total] = await Promise.all([
    tx.model.findMany({ /* 查詢條件 */ }),
    tx.model.count({ /* 查詢條件 */ })
  ]);

  return createPaginatedResponse(data, calculatePagination(page, limit, total));
});
```

## 實際使用範例

### 1. 控制器層調用範例

```typescript
// src/controllers/project.controller.ts
export const getProjectList = async (req: Request, res: Response) => {
  try {
    const queryParams = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      status: req.query.status as string,
      search: req.query.search as string,
      sort_by: req.query.sort_by as string || 'created_at',
      sort_order: req.query.sort_order as 'asc' | 'desc' || 'desc'
    };

    const result = await projectService.getProjects(queryParams, req.user?.id);
    res.json(result);
  } catch (error) {
    res.status(500).json(createErrorResponse('GET_PROJECTS_FAILED', error.message));
  }
};
```

### 2. 前端使用範例

**頁碼分頁 API 調用**:
```javascript
// GET /api/v1/projects?page=2&limit=10&search=學習&status=ongoing
const response = await fetch('/api/v1/projects?page=2&limit=10&search=學習&status=ongoing');
const data = await response.json();

console.log(data);
// {
//   "success": true,
//   "data": [...],
//   "pagination": {
//     "currentPage": 2,
//     "totalPages": 15,
//     "totalItems": 148,
//     "itemsPerPage": 10,
//     "hasNext": true,
//     "hasPrev": true
//   },
//   "timestamp": "2024-09-30T10:30:00.000Z",
//   "meta": {
//     "searchQuery": "學習",
//     "filters": {
//       "status": "ongoing"
//     }
//   }
// }
```

**游標分頁 API 調用**:
```javascript
// GET /api/v1/resources?limit=5&cursor=eyJpZCI6MTIzLCJ0aW1lc3RhbXAiOiIyMDI0LTA5LTMwVDEwOjMwOjAwLjAwMFoifQ==
const response = await fetch('/api/v1/resources?limit=5&cursor=eyJpZCI6MTIzfQ==');
const data = await response.json();

console.log(data);
// {
//   "success": true,
//   "data": [...],
//   "pagination": {
//     "cursors": {
//       "start": "eyJpZCI6MTI0fQ==",
//       "end": "eyJpZCI6MTI4fQ=="
//     },
//     "hasMore": true,
//     "count": 5,
//     "limit": 5,
//     "nextCursor": "eyJpZCI6MTI4fQ=="
//   },
//   "timestamp": "2024-09-30T10:30:00.000Z"
// }
```

### 3. 測試範例

```typescript
// tests/services/project.service.test.ts
describe('Project Service Pagination', () => {
  it('should return paginated projects with correct pagination info', async () => {
    const queryParams = {
      page: 1,
      limit: 5,
      sort_by: 'created_at',
      sort_order: 'desc' as const
    };

    const result = await projectService.getProjects(queryParams);

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(5);
    expect(result.pagination).toMatchObject({
      currentPage: 1,
      itemsPerPage: 5,
      hasNext: expect.any(Boolean),
      hasPrev: false
    });
  });

  it('should handle empty results gracefully', async () => {
    const queryParams = {
      page: 999,
      limit: 10
    };

    const result = await projectService.getProjects(queryParams);

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(0);
    expect(result.pagination.totalItems).toBe(0);
  });
});
```

## 分頁限制配置

根據不同資源類型的特性，平台設定了不同的分頁限制：

| 資源類型 | 預設每頁 | 最大每頁 | 分頁類型 | 說明 |
|---------|---------|---------|---------|------|
| 專案 (Projects) | 20 | 100 | 頁碼分頁 | 一般列表查詢 |
| 資源 (Resources) | 5 | 20 | 游標分頁 | 資源瀏覽優化 |
| 心得 (Reviews) | 2 | 10 | 游標分頁 | 詳細內容展示 |
| 想法 (Ideas) | 依控制器設定 | 100 | 頁碼分頁 | 快速瀏覽 |

**註記**:
- 專案和想法使用通用分頁限制 (`DEFAULT_PAGE_LIMIT = 20`, `MAX_PAGE_LIMIT = 100`)
- 資源和心得使用專用分頁限制，針對內容特性優化

## 參考實作

- **頁碼分頁**: `src/services/project.service.ts` - `getProjects()`
- **游標分頁**: `src/services/resource.service.ts` - `getResources()`
- **簡單分頁**: `src/services/idea.service.ts` - `getIdeas()`

## 相關文檔

- [API Response Format Standardization](./api-response-format.md)
- [Service Architecture Guide](./service-analysis.md)
- [Database Architecture Design](./multi-database-architecture-design.md)

---

*最後更新: 2024-09-30*
*作者: DaoDao 開發團隊*