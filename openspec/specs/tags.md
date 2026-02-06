# Tags Module Specification

## 1. Overview

### 1.1 Purpose
標籤模組提供跨實體的標籤管理功能，讓用戶能夠為專案、資源、實踐、想法等內容添加標籤，並支援標籤搜尋和統計分析。

### 1.2 Scope
- 標籤 CRUD
- 實體標籤關聯
- 標籤搜尋與自動完成
- 熱門標籤
- 標籤統計

---

## 2. Data Models

### 2.1 Tag Entity

```prisma
model tags {
  id              String    @id @default(uuid())

  // Basic info
  name            String    @unique
  slug            String    @unique
  description     String?

  // Stats
  usage_count     Int       @default(0)

  // Status
  is_active       Boolean   @default(true)
  is_featured     Boolean   @default(false)

  // Category (optional)
  category        tag_category_t?

  // Timestamps
  created_at      DateTime  @default(now())
  updated_at      DateTime  @updatedAt

  // Relations
  entity_tags     entity_tags[]
  tag_prompts     tag_prompt_templates[]
}
```

### 2.2 Entity Tag Entity

```prisma
model entity_tags {
  id              String    @id @default(uuid())

  // Tag reference
  tag_id          String

  // Polymorphic relation
  entity_type     entity_type_t
  entity_id       String

  // Who added it
  added_by        String?

  // Timestamps
  created_at      DateTime  @default(now())

  // Relations
  tag             tags      @relation(fields: [tag_id], references: [id])

  @@unique([tag_id, entity_type, entity_id])
  @@index([entity_type, entity_id])
  @@index([tag_id])
}
```

### 2.3 Enums

```prisma
enum entity_type_t {
  project
  resource
  practice
  idea
  post
  note
}

enum tag_category_t {
  skill           // 技能類
  topic           // 主題類
  tool            // 工具類
  language        // 語言類
  level           // 程度類
  domain          // 領域類
  other           // 其他
}
```

---

## 3. API Endpoints

### 3.1 Tag Management

```yaml
# Search/Autocomplete Tags
GET /api/v1/tags/search
Authorization: Bearer <token> (optional)

Query Parameters:
  q: string (required, min 1 char)
  limit?: number (default: 10, max: 50)
  category?: tag_category_t

Response 200:
  success: true
  data:
    - id: string
      name: string
      slug: string
      usageCount: number
      category: string | null

---

# Get Popular Tags
GET /api/v1/tags/popular
Authorization: Bearer <token> (optional)

Query Parameters:
  limit?: number (default: 20, max: 100)
  category?: tag_category_t
  entityType?: entity_type_t
  timeRange?: "day" | "week" | "month" | "all" (default: "all")

Response 200:
  success: true
  data:
    - id: string
      name: string
      slug: string
      usageCount: number
      category: string | null
      trend: "up" | "down" | "stable"

---

# Get Tag by ID or Slug
GET /api/v1/tags/:idOrSlug
Authorization: Bearer <token> (optional)

Response 200:
  success: true
  data:
    id: string
    name: string
    slug: string
    description: string | null
    usageCount: number
    category: string | null
    isFeatured: boolean
    relatedTags:
      - id: string
        name: string
        slug: string
    createdAt: string

---

# Get Tag Statistics
GET /api/v1/tags/stats
Authorization: Bearer <token> (optional)

Query Parameters:
  tagId?: string
  tagSlug?: string

Response 200:
  success: true
  data:
    totalTags: number
    totalUsage: number
    byEntityType:
      project: number
      resource: number
      practice: number
      idea: number
    byCategory:
      skill: number
      topic: number
      tool: number
      # ...
    topTags:
      - name: string
        count: number
    growthRate: (if specific tag)
      daily: number
      weekly: number
      monthly: number
```

### 3.2 Entity Tag Operations

```yaml
# Add Tags to Entity
POST /api/v1/tags/entities
Authorization: Bearer <token>
Content-Type: application/json

Request:
  entityType: entity_type_t (required)
  entityId: string (required)
  tags: string[] (tag names, max 10)

Response 200:
  success: true
  data:
    added:
      - id: string
        name: string
        slug: string
    existing:
      - id: string
        name: string
        slug: string
    invalid: string[] # Tags that couldn't be processed

---

# Get Entity Tags
GET /api/v1/tags/entities
Authorization: Bearer <token> (optional)

Query Parameters:
  entityType: entity_type_t (required)
  entityId: string (required)

Response 200:
  success: true
  data:
    - id: string
      name: string
      slug: string
      category: string | null
      addedAt: string
      addedBy:
        id: string
        name: string

---

# Remove Tag from Entity
DELETE /api/v1/tags/entities
Authorization: Bearer <token>
Content-Type: application/json

Request:
  entityType: entity_type_t (required)
  entityId: string (required)
  tagId: string (required)

Response 200:
  success: true
  data:
    message: "Tag removed successfully"

---

# Replace All Entity Tags
PUT /api/v1/tags/entities
Authorization: Bearer <token>
Content-Type: application/json

Request:
  entityType: entity_type_t (required)
  entityId: string (required)
  tags: string[] (tag names)

Response 200:
  success: true
  data:
    tags:
      - id: string
        name: string
        slug: string
```

### 3.3 Content Discovery by Tag

```yaml
# Get Entities by Tag
GET /api/v1/tags/:idOrSlug/entities
Authorization: Bearer <token> (optional)

Query Parameters:
  entityType?: entity_type_t (filter by type)
  page?: number
  limit?: number
  sortBy?: "createdAt" | "popularity"
  sortOrder?: "asc" | "desc"

Response 200:
  success: true
  data:
    tag:
      id: string
      name: string
      slug: string
      usageCount: number
    entities:
      - entityType: string
        entityId: string
        entity:
          # Polymorphic entity data
          id: string
          title: string
          # ...
        addedAt: string
  pagination: ...

---

# Get Related Tags
GET /api/v1/tags/:idOrSlug/related
Authorization: Bearer <token> (optional)

Query Parameters:
  limit?: number (default: 10)

Response 200:
  success: true
  data:
    - id: string
      name: string
      slug: string
      coOccurrence: number # 共同出現次數
      relationship: "similar" | "broader" | "narrower"
```

### 3.4 Admin Tag Management

```yaml
# Create Tag (Admin)
POST /api/v1/admin/tags
Authorization: Bearer <token>
Required Role: admin

Request:
  name: string (required)
  description?: string
  category?: tag_category_t
  isFeatured?: boolean

Response 201:
  success: true
  data:
    id: string
    name: string
    slug: string
    description: string | null
    category: string | null
    isFeatured: boolean
    createdAt: string

---

# Update Tag (Admin)
PATCH /api/v1/admin/tags/:id
Authorization: Bearer <token>
Required Role: admin

Request:
  name?: string
  description?: string
  category?: tag_category_t
  isFeatured?: boolean
  isActive?: boolean

Response 200:
  success: true
  data:
    # Updated tag

---

# Merge Tags (Admin)
POST /api/v1/admin/tags/merge
Authorization: Bearer <token>
Required Role: admin

Request:
  sourceTagId: string (required, will be merged into target)
  targetTagId: string (required)

Response 200:
  success: true
  data:
    mergedTag:
      id: string
      name: string
      usageCount: number
    entitiesMigrated: number

---

# Delete Tag (Admin)
DELETE /api/v1/admin/tags/:id
Authorization: Bearer <token>
Required Role: admin

Query Parameters:
  force?: boolean (default: false, removes all entity associations)

Response 200:
  success: true
  data:
    message: "Tag deleted successfully"
    entitiesAffected: number
```

---

## 4. Business Rules

### 4.1 Tag Naming Rules

| Rule | Description |
|------|-------------|
| Length | 1-50 characters |
| Characters | Letters, numbers, spaces, hyphens, underscores |
| Case | Case-insensitive (stored lowercase) |
| Duplicates | Auto-merged with existing tag |
| Reserved | System tags cannot be created by users |

### 4.2 Tag Limits per Entity

| Entity Type | Max Tags |
|-------------|----------|
| Project | 10 |
| Resource | 10 |
| Practice | 5 |
| Idea | 10 |
| Post | 5 |
| Note | 5 |

### 4.3 Slug Generation

```typescript
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')     // 空格和下底線轉換為連字號
    .replace(/[^\w\-]+/g, '')    // 移除非字母數字和連字號
    .replace(/\-\-+/g, '-')      // 多個連字號合併
    .replace(/^-+/, '')          // 移除開頭連字號
    .replace(/-+$/, '');         // 移除結尾連字號
}
```

### 4.4 Auto-Tag Creation

```typescript
// 當用戶添加不存在的標籤時自動創建
async function getOrCreateTags(tagNames: string[]): Promise<Tag[]> {
  const tags: Tag[] = [];

  for (const name of tagNames) {
    const normalizedName = name.toLowerCase().trim();
    const slug = generateSlug(normalizedName);

    let tag = await findTagBySlug(slug);

    if (!tag) {
      tag = await createTag({
        name: normalizedName,
        slug,
        category: null, // 用戶創建的標籤無分類
      });
    }

    tags.push(tag);
  }

  return tags;
}
```

### 4.5 Usage Count Update

```typescript
// 標籤使用計數自動更新
// 添加標籤時 +1，移除時 -1

async function updateTagUsageCount(tagId: string, delta: number): Promise<void> {
  await prisma.tags.update({
    where: { id: tagId },
    data: {
      usage_count: {
        increment: delta,
      },
    },
  });
}
```

### 4.6 Related Tags Calculation

```typescript
// 相關標籤基於共同出現計算
// 如果兩個標籤常常出現在同一實體上，則視為相關

interface RelatedTagResult {
  tagId: string;
  tagName: string;
  coOccurrence: number;
}

async function findRelatedTags(
  tagId: string,
  limit: number = 10
): Promise<RelatedTagResult[]> {
  // 找出所有使用此標籤的實體
  const entities = await prisma.entity_tags.findMany({
    where: { tag_id: tagId },
    select: { entity_type: true, entity_id: true },
  });

  // 找出這些實體上的其他標籤
  const otherTags = await prisma.entity_tags.groupBy({
    by: ['tag_id'],
    where: {
      AND: [
        { tag_id: { not: tagId } },
        {
          OR: entities.map(e => ({
            entity_type: e.entity_type,
            entity_id: e.entity_id,
          })),
        },
      ],
    },
    _count: { tag_id: true },
    orderBy: { _count: { tag_id: 'desc' } },
    take: limit,
  });

  return otherTags;
}
```

---

## 5. Validation Schemas

### 5.1 Tag Schema

```typescript
const tagNameSchema = z
  .string()
  .min(1, 'Tag name is required')
  .max(50, 'Tag name must be at most 50 characters')
  .regex(
    /^[\w\s\-]+$/,
    'Tag can only contain letters, numbers, spaces, hyphens, and underscores'
  );

const createTagSchema = z.object({
  name: tagNameSchema,
  description: z
    .string()
    .max(500, 'Description must be at most 500 characters')
    .optional(),
  category: z.nativeEnum(tag_category_t).optional(),
  isFeatured: z.boolean().optional(),
});
```

### 5.2 Entity Tags Schema

```typescript
const addEntityTagsSchema = z.object({
  entityType: z.nativeEnum(entity_type_t),
  entityId: z.string().uuid(),
  tags: z
    .array(tagNameSchema)
    .min(1, 'At least one tag is required')
    .max(10, 'Maximum 10 tags allowed'),
});

const removeEntityTagSchema = z.object({
  entityType: z.nativeEnum(entity_type_t),
  entityId: z.string().uuid(),
  tagId: z.string().uuid(),
});
```

---

## 6. Implementation Files

### 6.1 Controllers
- `src/controllers/tag.controller.ts`

### 6.2 Services
- `src/services/tag.service.ts`

### 6.3 Routes
- `src/routes/tag.routes.ts`

### 6.4 Validators
- `src/validators/tag.validators.ts`

### 6.5 Types
- `src/types/tag.types.ts`

---

## 7. Error Handling

### 7.1 Error Codes

```typescript
const TAG_ERRORS = {
  TAG_NOT_FOUND: {
    code: 'TAG_NOT_FOUND',
    message: 'Tag not found',
    status: 404,
  },
  TAG_ALREADY_EXISTS: {
    code: 'TAG_ALREADY_EXISTS',
    message: 'A tag with this name already exists',
    status: 409,
  },
  TAG_LIMIT_EXCEEDED: {
    code: 'TAG_LIMIT_EXCEEDED',
    message: 'Maximum number of tags exceeded for this entity',
    status: 400,
  },
  TAG_ALREADY_ADDED: {
    code: 'TAG_ALREADY_ADDED',
    message: 'This tag is already added to the entity',
    status: 409,
  },
  INVALID_TAG_NAME: {
    code: 'INVALID_TAG_NAME',
    message: 'Invalid tag name',
    status: 400,
  },
  CANNOT_MERGE_SAME_TAG: {
    code: 'CANNOT_MERGE_SAME_TAG',
    message: 'Cannot merge a tag into itself',
    status: 400,
  },
  RESERVED_TAG: {
    code: 'RESERVED_TAG',
    message: 'This tag name is reserved',
    status: 403,
  },
} as const;
```

---

## 8. Database Indexes

```sql
-- Performance indexes for tag queries
CREATE INDEX idx_entity_tags_entity ON entity_tags(entity_type, entity_id);
CREATE INDEX idx_entity_tags_tag ON entity_tags(tag_id);
CREATE INDEX idx_tags_slug ON tags(slug);
CREATE INDEX idx_tags_usage ON tags(usage_count DESC);
CREATE INDEX idx_tags_category ON tags(category) WHERE category IS NOT NULL;
```

---

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0.0 | 2026-02-05 | System | Initial specification |
