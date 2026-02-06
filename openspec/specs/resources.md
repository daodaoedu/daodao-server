# Resources Module Specification

## 1. Overview

### 1.1 Purpose
學習資源模組提供一個平台讓用戶分享、發現和管理學習資源，包含課程、書籍、文章、影片等多種類型，並支援多維度搜尋和評價系統。

### 1.2 Scope
- 資源 CRUD 操作
- 多條件過濾與搜尋
- Faceted Search（多面搜尋）
- 資源評價與評論
- 標籤管理
- 狀態工作流程

---

## 2. Data Models

### 2.1 Resource Entity

```prisma
model resources {
  id                    String    @id @default(uuid())
  user_id               String

  // Basic info
  title                 String
  description           String?
  url                   String?
  cover_image_url       String?

  // Classification
  type                  resource_type_t
  major_category_id     Int?
  sub_category_id       Int?

  // Attributes
  cost_type             cost_type_t        @default(free)
  price                 Decimal?           @db.Decimal(10, 2)
  currency              String?            @default("TWD")
  difficulty_level      difficulty_level_t @default(beginner)
  language              String             @default("zh-TW")

  // Duration (minutes)
  estimated_duration    Int?

  // Status
  status                resource_status_t  @default(draft)
  is_featured           Boolean            @default(false)

  // Engagement stats
  views_count           Int                @default(0)
  likes_count           Int                @default(0)
  saves_count           Int                @default(0)
  reviews_count         Int                @default(0)
  average_rating        Float?

  // Timestamps
  created_at            DateTime  @default(now())
  updated_at            DateTime  @updatedAt
  published_at          DateTime?
  deleted_at            DateTime?

  // Relations
  user                  users               @relation(fields: [user_id], references: [id])
  major_category        categories?         @relation("major", fields: [major_category_id], references: [id])
  sub_category          categories?         @relation("sub", fields: [sub_category_id], references: [id])
  reviews               resource_review[]
  entity_tags           entity_tags[]
  entity_resources      entity_resources[]
  notes                 note[]
}
```

### 2.2 Resource Review Entity

```prisma
model resource_review {
  id              String    @id @default(uuid())
  resource_id     String
  user_id         String

  // Content
  content         String

  // Multi-dimensional rating (1-5)
  rating          rating?

  // Engagement
  likes_count     Int       @default(0)
  comments_count  Int       @default(0)

  // Status
  is_helpful      Boolean   @default(false)
  is_featured     Boolean   @default(false)

  // Timestamps
  created_at      DateTime  @default(now())
  updated_at      DateTime  @updatedAt
  deleted_at      DateTime?

  // Relations
  resource        resources @relation(fields: [resource_id], references: [id])
  user            users     @relation(fields: [user_id], references: [id])
  comments        comments[]
  likes           likes[]
}
```

### 2.3 Rating Entity

```prisma
model rating {
  id                String    @id @default(uuid())
  review_id         String    @unique

  // Multi-dimensional ratings (1-5)
  overall           Int       // 整體評分
  impact            Int?      // 影響力
  mindset           Int?      // 心態轉變
  problems          Int?      // 問題解決
  perspectives      Int?      // 視角拓展
  goals             Int?      // 目標達成

  // Relations
  review            resource_review @relation(fields: [review_id], references: [id])
}
```

### 2.4 Categories Entity

```prisma
model categories {
  id              Int       @id @default(autoincrement())
  name            String
  code            String    @unique
  description     String?
  parent_id       Int?
  order_index     Int       @default(0)
  is_active       Boolean   @default(true)

  // Relations
  parent          categories?  @relation("CategoryHierarchy", fields: [parent_id], references: [id])
  children        categories[] @relation("CategoryHierarchy")
  resources_major resources[]  @relation("major")
  resources_sub   resources[]  @relation("sub")
}
```

### 2.5 Enums

```prisma
enum resource_type_t {
  course          // 課程
  book            // 書籍
  article         // 文章
  video           // 影片
  podcast         // 播客
  tool            // 工具
  community       // 社群
  event           // 活動
  other           // 其他
}

enum cost_type_t {
  free            // 免費
  paid            // 付費
  freemium        // 免費增值
  subscription    // 訂閱制
}

enum difficulty_level_t {
  beginner        // 初學
  intermediate    // 中級
  advanced        // 進階
  expert          // 專家
  all_levels      // 所有程度
}

enum resource_status_t {
  draft           // 草稿
  published       // 已發布
  archived        // 已歸檔
  flagged         // 已標記（待審核）
}
```

---

## 3. API Endpoints

### 3.1 Resource CRUD

```yaml
# Create Resource
POST /api/v1/resources
Authorization: Bearer <token>
Content-Type: application/json

Request:
  title: string (required, 2-200 chars)
  description?: string (max 5000 chars)
  url?: string (valid URL)
  coverImageUrl?: string (valid URL)
  type: resource_type_t (required)
  majorCategoryId?: number
  subCategoryId?: number
  costType?: cost_type_t (default: "free")
  price?: number (required if costType is "paid" or "subscription")
  currency?: string (default: "TWD")
  difficultyLevel?: difficulty_level_t (default: "beginner")
  language?: string (default: "zh-TW")
  estimatedDuration?: number (minutes)
  status?: "draft" | "published" (default: "draft")
  tags?: string[] (max 10)

Response 201:
  success: true
  data:
    id: string
    title: string
    description: string | null
    url: string | null
    coverImageUrl: string | null
    type: string
    majorCategory: object | null
    subCategory: object | null
    costType: string
    price: number | null
    difficultyLevel: string
    language: string
    estimatedDuration: number | null
    status: string
    tags: string[]
    createdAt: string

---

# Get Resource
GET /api/v1/resources/:id
Authorization: Bearer <token> (optional)

Response 200:
  success: true
  data:
    id: string
    title: string
    description: string | null
    url: string | null
    coverImageUrl: string | null
    type: string
    majorCategory:
      id: number
      name: string
      code: string
    subCategory:
      id: number
      name: string
      code: string
    costType: string
    price: number | null
    currency: string | null
    difficultyLevel: string
    language: string
    estimatedDuration: number | null
    status: string
    isFeatured: boolean
    viewsCount: number
    likesCount: number
    savesCount: number
    reviewsCount: number
    averageRating: number | null
    user:
      id: string
      name: string
      avatarUrl: string | null
    tags: string[]
    userStatus: (if authenticated)
      isLiked: boolean
      isSaved: boolean
      hasReviewed: boolean
    createdAt: string
    updatedAt: string
    publishedAt: string | null

---

# Update Resource
PATCH /api/v1/resources/:id
Authorization: Bearer <token>
Content-Type: application/json

Request:
  title?: string
  description?: string
  url?: string
  coverImageUrl?: string
  type?: resource_type_t
  majorCategoryId?: number
  subCategoryId?: number
  costType?: cost_type_t
  price?: number
  difficultyLevel?: difficulty_level_t
  language?: string
  estimatedDuration?: number
  tags?: string[]

Response 200:
  success: true
  data:
    # Updated resource

---

# Update Resource Status
PATCH /api/v1/resources/:id/status
Authorization: Bearer <token>
Content-Type: application/json

Request:
  status: "draft" | "published" | "archived"

Response 200:
  success: true
  data:
    id: string
    status: string
    publishedAt: string | null

---

# Delete Resource
DELETE /api/v1/resources/:id
Authorization: Bearer <token>

Response 200:
  success: true
  data:
    message: "Resource deleted successfully"
```

### 3.2 List Resources with Faceted Search

```yaml
GET /api/v1/resources
Authorization: Bearer <token> (optional)

Query Parameters:
  # Pagination
  page?: number (default: 1)
  limit?: number (default: 20, max: 100)
  cursor?: string (for cursor-based pagination)

  # Search
  search?: string (full-text search in title, description)

  # Filters
  type?: resource_type_t | resource_type_t[] (comma-separated)
  majorCategoryId?: number | number[]
  subCategoryId?: number | number[]
  costType?: cost_type_t | cost_type_t[]
  difficultyLevel?: difficulty_level_t | difficulty_level_t[]
  language?: string | string[]
  minRating?: number (1-5)
  tags?: string (comma-separated)
  userId?: string
  isFeatured?: boolean

  # Duration filters
  minDuration?: number (minutes)
  maxDuration?: number (minutes)

  # Price filters
  minPrice?: number
  maxPrice?: number

  # Sorting
  sortBy?: "createdAt" | "updatedAt" | "viewsCount" | "likesCount" | "averageRating" | "reviewsCount"
  sortOrder?: "asc" | "desc" (default: "desc")

  # Facets
  includeFacets?: boolean (default: false)

Response 200:
  success: true
  data:
    - id: string
      title: string
      description: string | null (truncated)
      coverImageUrl: string | null
      type: string
      majorCategory: object | null
      costType: string
      price: number | null
      difficultyLevel: string
      viewsCount: number
      likesCount: number
      averageRating: number | null
      reviewsCount: number
      user:
        id: string
        name: string
        avatarUrl: string | null
      tags: string[]
      createdAt: string
  pagination:
    currentPage: number
    totalPages: number
    totalItems: number
    hasNext: boolean
    hasPrev: boolean
  facets: (if includeFacets=true)
    type:
      - value: "course"
        count: 42
      - value: "book"
        count: 28
    majorCategory:
      - value: "programming"
        label: "程式設計"
        count: 35
    costType:
      - value: "free"
        count: 50
      - value: "paid"
        count: 20
    difficultyLevel:
      - value: "beginner"
        count: 30
    language:
      - value: "zh-TW"
        count: 45
```

### 3.3 My Resources

```yaml
GET /api/v1/me/resources
Authorization: Bearer <token>

Query Parameters:
  status?: resource_status_t
  type?: resource_type_t
  page?: number
  limit?: number

Response 200:
  success: true
  data:
    # Array of user's resources
  pagination: ...
```

### 3.4 Resource Tags

```yaml
# Get resource tags
GET /api/v1/resources/:id/tags
Authorization: Bearer <token> (optional)

Response 200:
  success: true
  data:
    - id: string
      name: string
      slug: string

---

# Update resource tags
PUT /api/v1/resources/:id/tags
Authorization: Bearer <token>
Content-Type: application/json

Request:
  tags: string[] (tag names, max 10)

Response 200:
  success: true
  data:
    - id: string
      name: string
      slug: string
```

### 3.5 Resource Reviews

```yaml
# Create review
POST /api/v1/resources/:resourceId/reviews
Authorization: Bearer <token>
Content-Type: application/json

Request:
  content: string (required, 10-5000 chars)
  rating:
    overall: number (required, 1-5)
    impact?: number (1-5)
    mindset?: number (1-5)
    problems?: number (1-5)
    perspectives?: number (1-5)
    goals?: number (1-5)

Response 201:
  success: true
  data:
    id: string
    content: string
    rating:
      overall: number
      impact: number | null
      mindset: number | null
      problems: number | null
      perspectives: number | null
      goals: number | null
    user:
      id: string
      name: string
      avatarUrl: string | null
    likesCount: 0
    commentsCount: 0
    createdAt: string

Response 409:
  success: false
  error:
    code: "REVIEW_ALREADY_EXISTS"
    message: "You have already reviewed this resource"

---

# List reviews
GET /api/v1/resources/:resourceId/reviews
Authorization: Bearer <token> (optional)

Query Parameters:
  page?: number
  limit?: number
  sortBy?: "createdAt" | "likesCount" | "rating" (default: "createdAt")
  sortOrder?: "asc" | "desc"

Response 200:
  success: true
  data:
    - id: string
      content: string
      rating:
        overall: number
        # ... other dimensions
      user:
        id: string
        name: string
        avatarUrl: string | null
      likesCount: number
      commentsCount: number
      isLiked: boolean (if authenticated)
      isFeatured: boolean
      createdAt: string
  pagination: ...
  summary:
    averageRating: number
    totalReviews: number
    ratingDistribution:
      5: number
      4: number
      3: number
      2: number
      1: number
    dimensionAverages:
      impact: number
      mindset: number
      problems: number
      perspectives: number
      goals: number

---

# Get single review
GET /api/v1/resources/:resourceId/reviews/:reviewId
Authorization: Bearer <token> (optional)

Response 200:
  success: true
  data:
    # Full review object

---

# Update review
PATCH /api/v1/resources/:resourceId/reviews/:reviewId
Authorization: Bearer <token>
Content-Type: application/json

Request:
  content?: string
  rating?:
    overall?: number
    impact?: number
    mindset?: number
    problems?: number
    perspectives?: number
    goals?: number

Response 200:
  success: true
  data:
    # Updated review

---

# Delete review
DELETE /api/v1/resources/:resourceId/reviews/:reviewId
Authorization: Bearer <token>

Response 200:
  success: true
  data:
    message: "Review deleted successfully"

---

# Like review
POST /api/v1/resources/:resourceId/reviews/:reviewId/like
Authorization: Bearer <token>

Response 200:
  success: true
  data:
    liked: true
    likesCount: number

---

# Unlike review
DELETE /api/v1/resources/:resourceId/reviews/:reviewId/like
Authorization: Bearer <token>

Response 200:
  success: true
  data:
    liked: false
    likesCount: number
```

### 3.6 Resource Interactions

```yaml
# Like resource
POST /api/v1/resources/:id/like
Authorization: Bearer <token>

Response 200:
  success: true
  data:
    liked: true
    likesCount: number

---

# Unlike resource
DELETE /api/v1/resources/:id/like
Authorization: Bearer <token>

Response 200:
  success: true
  data:
    liked: false
    likesCount: number

---

# Save resource
POST /api/v1/resources/:id/save
Authorization: Bearer <token>

Response 200:
  success: true
  data:
    saved: true
    savesCount: number

---

# Unsave resource
DELETE /api/v1/resources/:id/save
Authorization: Bearer <token>

Response 200:
  success: true
  data:
    saved: false
    savesCount: number

---

# Record view
POST /api/v1/resources/:id/view
Authorization: Bearer <token> (optional)

Response 200:
  success: true
  data:
    viewsCount: number
```

---

## 4. Business Rules

### 4.1 Status Workflow

```
Resource Status Flow:

  draft ─────────────────▶ published
    │                         │
    │   (edit anytime)        │
    │ ◀─────────────────────  │
    │                         │
    │                         ▼
    └──────────────────▶ archived
                              │
                              │ (can restore)
                              ▼
                          published
```

### 4.2 Rating Calculation

```typescript
/**
 * 計算資源平均評分
 * 使用加權平均，recent reviews 權重較高
 */
function calculateAverageRating(reviews: Review[]): number {
  if (reviews.length === 0) return 0;

  // 按時間排序，最新的在前
  const sortedReviews = reviews.sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  let weightedSum = 0;
  let totalWeight = 0;

  sortedReviews.forEach((review, index) => {
    // 最新的評論權重較高
    const weight = 1 / (index + 1);
    weightedSum += review.rating.overall * weight;
    totalWeight += weight;
  });

  return Math.round((weightedSum / totalWeight) * 10) / 10;
}
```

### 4.3 Featured Resource Rules

- 管理員可手動設定精選
- 自動精選條件：
  - 評分 >= 4.5
  - 評論數 >= 10
  - 瀏覽數 >= 100
  - 無被標記問題

### 4.4 Content Guidelines

1. 資源必須是合法可訪問的內容
2. 禁止重複提交相同資源
3. 資源連結必須指向原始來源
4. 價格資訊必須準確

---

## 5. Validation Schemas

### 5.1 Resource Schema

```typescript
const createResourceSchema = z.object({
  title: z
    .string()
    .min(2, 'Title must be at least 2 characters')
    .max(200, 'Title must be at most 200 characters'),
  description: z
    .string()
    .max(5000, 'Description must be at most 5000 characters')
    .optional(),
  url: z.string().url('Invalid URL').optional(),
  coverImageUrl: z.string().url('Invalid URL').optional(),
  type: z.nativeEnum(resource_type_t),
  majorCategoryId: z.number().int().positive().optional(),
  subCategoryId: z.number().int().positive().optional(),
  costType: z.nativeEnum(cost_type_t).default('free'),
  price: z
    .number()
    .positive('Price must be positive')
    .optional()
    .refine(
      (val, ctx) => {
        const costType = ctx.parent.costType;
        if (costType === 'paid' || costType === 'subscription') {
          return val !== undefined && val > 0;
        }
        return true;
      },
      'Price is required for paid resources'
    ),
  currency: z.string().length(3).default('TWD'),
  difficultyLevel: z.nativeEnum(difficulty_level_t).default('beginner'),
  language: z.string().default('zh-TW'),
  estimatedDuration: z
    .number()
    .int()
    .positive()
    .max(10080, 'Maximum 1 week')
    .optional(),
  status: z.enum(['draft', 'published']).default('draft'),
  tags: z
    .array(z.string().min(1).max(30))
    .max(10, 'Maximum 10 tags')
    .optional(),
});
```

### 5.2 Review Schema

```typescript
const createReviewSchema = z.object({
  content: z
    .string()
    .min(10, 'Review must be at least 10 characters')
    .max(5000, 'Review must be at most 5000 characters'),
  rating: z.object({
    overall: z
      .number()
      .int()
      .min(1, 'Rating must be at least 1')
      .max(5, 'Rating must be at most 5'),
    impact: z.number().int().min(1).max(5).optional(),
    mindset: z.number().int().min(1).max(5).optional(),
    problems: z.number().int().min(1).max(5).optional(),
    perspectives: z.number().int().min(1).max(5).optional(),
    goals: z.number().int().min(1).max(5).optional(),
  }),
});
```

### 5.3 Filter Schema

```typescript
const resourceFilterSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  cursor: z.string().optional(),
  search: z.string().max(100).optional(),
  type: z
    .union([
      z.nativeEnum(resource_type_t),
      z.array(z.nativeEnum(resource_type_t)),
    ])
    .optional(),
  majorCategoryId: z
    .union([
      z.coerce.number().int().positive(),
      z.array(z.coerce.number().int().positive()),
    ])
    .optional(),
  costType: z
    .union([
      z.nativeEnum(cost_type_t),
      z.array(z.nativeEnum(cost_type_t)),
    ])
    .optional(),
  difficultyLevel: z
    .union([
      z.nativeEnum(difficulty_level_t),
      z.array(z.nativeEnum(difficulty_level_t)),
    ])
    .optional(),
  minRating: z.coerce.number().min(1).max(5).optional(),
  tags: z.string().optional(), // comma-separated
  sortBy: z
    .enum([
      'createdAt',
      'updatedAt',
      'viewsCount',
      'likesCount',
      'averageRating',
      'reviewsCount',
    ])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  includeFacets: z.coerce.boolean().default(false),
});
```

---

## 6. Faceted Search Implementation

### 6.1 Facet Aggregation Query

```sql
-- Example facet aggregation for resources
WITH filtered AS (
  SELECT * FROM resources
  WHERE status = 'published'
    AND deleted_at IS NULL
    -- Apply other filters
)
SELECT
  'type' as facet_name,
  type as facet_value,
  COUNT(*) as count
FROM filtered
GROUP BY type

UNION ALL

SELECT
  'costType' as facet_name,
  cost_type as facet_value,
  COUNT(*) as count
FROM filtered
GROUP BY cost_type

UNION ALL

SELECT
  'difficultyLevel' as facet_name,
  difficulty_level as facet_value,
  COUNT(*) as count
FROM filtered
GROUP BY difficulty_level;
```

### 6.2 Facet Response Structure

```typescript
interface Facet {
  name: string;
  values: FacetValue[];
}

interface FacetValue {
  value: string;
  label?: string; // Human-readable label
  count: number;
}

interface FacetsResponse {
  type: FacetValue[];
  majorCategory: FacetValue[];
  subCategory: FacetValue[];
  costType: FacetValue[];
  difficultyLevel: FacetValue[];
  language: FacetValue[];
  tags: FacetValue[];
}
```

---

## 7. Implementation Files

### 7.1 Controllers
- `src/controllers/resource.controller.ts`
- `src/controllers/resource-review.controller.ts`

### 7.2 Services
- `src/services/resource.service.ts`
- `src/services/resource-review.service.ts`

### 7.3 Routes
- `src/routes/resource.routes.ts`
- `src/routes/resource-review.routes.ts`

### 7.4 Validators
- `src/validators/resource.validator.ts`
- `src/validators/resource-review.validator.ts`

### 7.5 Types
- `src/types/resource.types.ts`
- `src/types/resource-review.types.ts`

---

## 8. Error Handling

### 8.1 Error Codes

```typescript
const RESOURCE_ERRORS = {
  RESOURCE_NOT_FOUND: {
    code: 'RESOURCE_NOT_FOUND',
    message: 'Resource not found',
    status: 404,
  },
  RESOURCE_ALREADY_EXISTS: {
    code: 'RESOURCE_ALREADY_EXISTS',
    message: 'A resource with this URL already exists',
    status: 409,
  },
  REVIEW_ALREADY_EXISTS: {
    code: 'REVIEW_ALREADY_EXISTS',
    message: 'You have already reviewed this resource',
    status: 409,
  },
  REVIEW_NOT_FOUND: {
    code: 'REVIEW_NOT_FOUND',
    message: 'Review not found',
    status: 404,
  },
  INVALID_CATEGORY: {
    code: 'INVALID_CATEGORY',
    message: 'Invalid category selection',
    status: 400,
  },
  CANNOT_REVIEW_OWN_RESOURCE: {
    code: 'CANNOT_REVIEW_OWN_RESOURCE',
    message: 'You cannot review your own resource',
    status: 403,
  },
} as const;
```

---

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0.0 | 2026-02-05 | System | Initial specification |
