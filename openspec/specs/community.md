# Community Module Specification

## 1. Overview

### 1.1 Purpose
社群模組提供用戶之間的互動功能，包含想法分享、評論系統和學習圈子，促進學習者之間的交流和支持。

### 1.2 Scope
- 想法（Ideas）分享與管理
- 評論系統（支援巢狀評論）
- 按讚與收藏
- 學習圈子（Groups）

---

## 2. Data Models

### 2.1 Idea Entity

```prisma
model ideas {
  id              String    @id @default(uuid())
  user_id         String

  // Content
  content         String
  images          String[]

  // Status
  visibility      visibility_t @default(public)

  // Engagement
  likes_count     Int       @default(0)
  comments_count  Int       @default(0)
  shares_count    Int       @default(0)
  views_count     Int       @default(0)

  // Relations
  project_id      String?
  practice_id     String?

  // Timestamps
  created_at      DateTime  @default(now())
  updated_at      DateTime  @updatedAt
  deleted_at      DateTime?

  // Relations
  user            users       @relation(fields: [user_id], references: [id])
  project         project?    @relation(fields: [project_id], references: [id])
  practice        practices?  @relation(fields: [practice_id], references: [id])
  comments        comments[]
  likes           likes[]
  entity_tags     entity_tags[]
}
```

### 2.2 Comment Entity

```prisma
model comments {
  id              String    @id @default(uuid())
  user_id         String

  // Content
  content         String
  images          String[]

  // Parent (for nested comments)
  parent_id       String?

  // Polymorphic relation
  entity_type     entity_type_t
  entity_id       String

  // Engagement
  likes_count     Int       @default(0)
  replies_count   Int       @default(0)

  // Status
  is_visible      Boolean   @default(true)
  is_pinned       Boolean   @default(false)

  // Timestamps
  created_at      DateTime  @default(now())
  updated_at      DateTime  @updatedAt
  deleted_at      DateTime?

  // Relations
  user            users       @relation(fields: [user_id], references: [id])
  parent          comments?   @relation("CommentReplies", fields: [parent_id], references: [id])
  replies         comments[]  @relation("CommentReplies")
  likes           likes[]
}
```

### 2.3 Like Entity

```prisma
model likes {
  id              String    @id @default(uuid())
  user_id         String

  // Polymorphic relation
  entity_type     entity_type_t
  entity_id       String

  // Timestamps
  created_at      DateTime  @default(now())

  // Relations
  user            users     @relation(fields: [user_id], references: [id])

  @@unique([user_id, entity_type, entity_id])
}
```

### 2.4 Group Entity

```prisma
model groups {
  id              String    @id @default(uuid())
  owner_id        String

  // Basic info
  name            String
  description     String?
  cover_image_url String?

  // Category
  category        group_category_t

  // Settings
  is_public       Boolean   @default(true)
  max_members     Int       @default(100)
  join_approval   Boolean   @default(false)

  // Stats
  members_count   Int       @default(1)
  posts_count     Int       @default(0)

  // Status
  is_active       Boolean   @default(true)

  // Timestamps
  created_at      DateTime  @default(now())
  updated_at      DateTime  @updatedAt
  deleted_at      DateTime?

  // Relations
  owner           users               @relation(fields: [owner_id], references: [id])
  members         user_join_group[]
}
```

### 2.5 User Join Group Entity

```prisma
model user_join_group {
  id              String    @id @default(uuid())
  user_id         String
  group_id        String

  // Role
  role            group_role_t @default(member)

  // Status
  status          join_status_t @default(approved)

  // Timestamps
  joined_at       DateTime  @default(now())
  left_at         DateTime?

  // Relations
  user            users     @relation(fields: [user_id], references: [id])
  group           groups    @relation(fields: [group_id], references: [id])

  @@unique([user_id, group_id])
}
```

### 2.6 Enums

```prisma
enum entity_type_t {
  idea
  post
  resource
  resource_review
  practice
  comment
}

enum group_category_t {
  language            // 語言學習
  programming         // 程式設計
  design              // 設計
  business            // 商業
  arts                // 藝術
  science             // 科學
  mathematics         // 數學
  health              // 健康
  lifestyle           // 生活
  other               // 其他
}

enum group_role_t {
  owner               // 創建者
  admin               // 管理員
  moderator           // 版主
  member              // 成員
}

enum join_status_t {
  pending             // 待審核
  approved            // 已加入
  rejected            // 已拒絕
  left                // 已離開
  banned              // 已封禁
}

enum visibility_t {
  public
  followers
  private
}
```

---

## 3. API Endpoints

### 3.1 Ideas

```yaml
# Create Idea
POST /api/v1/ideas
Authorization: Bearer <token>
Content-Type: application/json

Request:
  content: string (required, 1-5000 chars)
  images?: string[] (max 9 URLs)
  visibility?: visibility_t (default: "public")
  projectId?: string (link to project)
  practiceId?: string (link to practice)
  tags?: string[] (max 10)

Response 201:
  success: true
  data:
    id: string
    content: string
    images: string[]
    visibility: string
    likesCount: 0
    commentsCount: 0
    sharesCount: 0
    project: object | null
    practice: object | null
    user:
      id: string
      name: string
      avatarUrl: string | null
    tags: string[]
    createdAt: string

---

# List Ideas
GET /api/v1/ideas
Authorization: Bearer <token> (optional)

Query Parameters:
  page?: number
  limit?: number
  userId?: string
  projectId?: string
  practiceId?: string
  tags?: string (comma-separated)
  sortBy?: "createdAt" | "likesCount" | "commentsCount"
  sortOrder?: "asc" | "desc"

Response 200:
  success: true
  data:
    - id: string
      content: string (truncated to 500 chars)
      images: string[]
      likesCount: number
      commentsCount: number
      isLiked: boolean (if authenticated)
      user:
        id: string
        name: string
        avatarUrl: string | null
      tags: string[]
      createdAt: string
  pagination: ...

---

# Get Idea
GET /api/v1/ideas/:id
Authorization: Bearer <token> (optional)

Response 200:
  success: true
  data:
    # Full idea object with comments preview

---

# Update Idea
PATCH /api/v1/ideas/:id
Authorization: Bearer <token>

Request:
  content?: string
  images?: string[]
  visibility?: visibility_t
  tags?: string[]

Response 200:
  success: true
  data:
    # Updated idea

---

# Delete Idea
DELETE /api/v1/ideas/:id
Authorization: Bearer <token>

Response 200:
  success: true
  data:
    message: "Idea deleted successfully"

---

# Get my ideas
GET /api/v1/me/ideas
Authorization: Bearer <token>

Query Parameters:
  page?: number
  limit?: number

Response 200:
  success: true
  data:
    # Array of user's ideas
```

### 3.2 Idea Interactions

```yaml
# Like idea
POST /api/v1/ideas/:id/like
Authorization: Bearer <token>

Response 200:
  success: true
  data:
    liked: true
    likesCount: number

---

# Unlike idea
DELETE /api/v1/ideas/:id/like
Authorization: Bearer <token>

Response 200:
  success: true
  data:
    liked: false
    likesCount: number

---

# Share idea
POST /api/v1/ideas/:id/share
Authorization: Bearer <token>

Request:
  platform?: string

Response 200:
  success: true
  data:
    sharesCount: number
    shareUrl: string
```

### 3.3 Comments

```yaml
# Create Comment
POST /api/v1/comments
Authorization: Bearer <token>
Content-Type: application/json

Request:
  content: string (required, 1-2000 chars)
  images?: string[] (max 3 URLs)
  entityType: entity_type_t (required)
  entityId: string (required)
  parentId?: string (for reply)

Response 201:
  success: true
  data:
    id: string
    content: string
    images: string[]
    likesCount: 0
    repliesCount: 0
    parent: object | null
    user:
      id: string
      name: string
      avatarUrl: string | null
    createdAt: string

---

# List Comments for Entity
GET /api/v1/comments
Authorization: Bearer <token> (optional)

Query Parameters:
  entityType: entity_type_t (required)
  entityId: string (required)
  parentId?: string (null for root comments only)
  page?: number
  limit?: number
  sortBy?: "createdAt" | "likesCount" (default: "createdAt")
  sortOrder?: "asc" | "desc" (default: "desc")

Response 200:
  success: true
  data:
    - id: string
      content: string
      images: string[]
      likesCount: number
      repliesCount: number
      isLiked: boolean (if authenticated)
      isPinned: boolean
      user:
        id: string
        name: string
        avatarUrl: string | null
      replies: (nested, max 3)
        - id: string
          content: string
          user: object
          createdAt: string
      createdAt: string
  pagination: ...

---

# Get Comment with Replies
GET /api/v1/comments/:id
Authorization: Bearer <token> (optional)

Query Parameters:
  includeReplies?: boolean (default: true)
  repliesLimit?: number (default: 10)

Response 200:
  success: true
  data:
    id: string
    content: string
    images: string[]
    likesCount: number
    repliesCount: number
    isLiked: boolean
    isPinned: boolean
    user: object
    replies:
      - # Reply objects
    createdAt: string
    updatedAt: string

---

# Update Comment
PATCH /api/v1/comments/:id
Authorization: Bearer <token>

Request:
  content?: string
  images?: string[]

Response 200:
  success: true
  data:
    # Updated comment

---

# Delete Comment
DELETE /api/v1/comments/:id
Authorization: Bearer <token>

Response 200:
  success: true
  data:
    message: "Comment deleted successfully"

---

# Like Comment
POST /api/v1/comments/:id/like
Authorization: Bearer <token>

Response 200:
  success: true
  data:
    liked: true
    likesCount: number

---

# Unlike Comment
DELETE /api/v1/comments/:id/like
Authorization: Bearer <token>

Response 200:
  success: true
  data:
    liked: false
    likesCount: number

---

# Pin Comment (entity owner only)
POST /api/v1/comments/:id/pin
Authorization: Bearer <token>

Response 200:
  success: true
  data:
    pinned: true

---

# Unpin Comment
DELETE /api/v1/comments/:id/pin
Authorization: Bearer <token>

Response 200:
  success: true
  data:
    pinned: false

---

# Toggle Comment Visibility (entity owner or admin)
PATCH /api/v1/comments/:id/visibility
Authorization: Bearer <token>

Request:
  isVisible: boolean

Response 200:
  success: true
  data:
    isVisible: boolean
```

### 3.4 Groups

```yaml
# Create Group
POST /api/v1/groups
Authorization: Bearer <token>
Content-Type: application/json

Request:
  name: string (required, 2-100 chars)
  description?: string (max 1000 chars)
  coverImageUrl?: string
  category: group_category_t (required)
  isPublic?: boolean (default: true)
  maxMembers?: number (default: 100, max: 500)
  joinApproval?: boolean (default: false)

Response 201:
  success: true
  data:
    id: string
    name: string
    description: string | null
    coverImageUrl: string | null
    category: string
    isPublic: boolean
    maxMembers: number
    joinApproval: boolean
    membersCount: 1
    owner:
      id: string
      name: string
      avatarUrl: string | null
    createdAt: string

---

# List Groups
GET /api/v1/groups
Authorization: Bearer <token> (optional)

Query Parameters:
  page?: number
  limit?: number
  search?: string
  category?: group_category_t
  isPublic?: boolean
  sortBy?: "createdAt" | "membersCount"
  sortOrder?: "asc" | "desc"

Response 200:
  success: true
  data:
    - id: string
      name: string
      description: string | null
      coverImageUrl: string | null
      category: string
      isPublic: boolean
      membersCount: number
      owner: object
    isMember: boolean (if authenticated)
  pagination: ...

---

# Get Group
GET /api/v1/groups/:id
Authorization: Bearer <token> (optional)

Response 200:
  success: true
  data:
    id: string
    name: string
    description: string | null
    coverImageUrl: string | null
    category: string
    isPublic: boolean
    maxMembers: number
    joinApproval: boolean
    membersCount: number
    postsCount: number
    owner: object
    userMembership: (if authenticated)
      role: string
      status: string
      joinedAt: string
    recentMembers:
      - id: string
        name: string
        avatarUrl: string | null
    createdAt: string

---

# Update Group
PATCH /api/v1/groups/:id
Authorization: Bearer <token>
Required Role: owner or admin

Request:
  name?: string
  description?: string
  coverImageUrl?: string
  isPublic?: boolean
  maxMembers?: number
  joinApproval?: boolean

Response 200:
  success: true
  data:
    # Updated group

---

# Delete Group
DELETE /api/v1/groups/:id
Authorization: Bearer <token>
Required Role: owner

Response 200:
  success: true
  data:
    message: "Group deleted successfully"

---

# Join Group
POST /api/v1/groups/:id/join
Authorization: Bearer <token>

Response 200: (if joinApproval = false)
  success: true
  data:
    status: "approved"
    message: "Successfully joined the group"

Response 200: (if joinApproval = true)
  success: true
  data:
    status: "pending"
    message: "Join request submitted"

Response 400:
  success: false
  error:
    code: "GROUP_FULL"
    message: "Group has reached maximum members"

---

# Leave Group
DELETE /api/v1/groups/:id/leave
Authorization: Bearer <token>

Response 200:
  success: true
  data:
    message: "Successfully left the group"

---

# List Group Members
GET /api/v1/groups/:id/members
Authorization: Bearer <token>

Query Parameters:
  page?: number
  limit?: number
  role?: group_role_t
  status?: join_status_t

Response 200:
  success: true
  data:
    - id: string
      user:
        id: string
        name: string
        avatarUrl: string | null
      role: string
      status: string
      joinedAt: string
  pagination: ...

---

# Manage Member (owner/admin only)
PATCH /api/v1/groups/:groupId/members/:userId
Authorization: Bearer <token>

Request:
  role?: group_role_t
  status?: "approved" | "rejected" | "banned"

Response 200:
  success: true
  data:
    # Updated membership

---

# Remove Member
DELETE /api/v1/groups/:groupId/members/:userId
Authorization: Bearer <token>
Required Role: owner, admin, or self

Response 200:
  success: true
  data:
    message: "Member removed successfully"
```

---

## 4. Business Rules

### 4.1 Comment Rules

| Rule | Description |
|------|-------------|
| Nesting depth | 最多 2 層（根評論 + 回覆） |
| Edit window | 發佈後 24 小時內可編輯 |
| Delete | 刪除後保留佔位（內容顯示「已刪除」） |
| Pin limit | 每個實體最多 3 個置頂評論 |

### 4.2 Group Rules

| Rule | Description |
|------|-------------|
| Ownership transfer | Owner 可轉移 owner 角色 |
| Admin limit | 最多 5 個 admin |
| Leave as owner | Owner 離開前必須轉移 ownership |
| Ban | 被 ban 的用戶 30 天內不能重新加入 |

### 4.3 Like/Unlike

```typescript
// 按讚是 toggle 操作
// 同一用戶對同一實體只能按讚一次
// 取消按讚會減少計數

interface LikeOperation {
  // 檢查是否已按讚
  isLiked(userId: string, entityType: string, entityId: string): Promise<boolean>;

  // Toggle 按讚狀態
  toggleLike(
    userId: string,
    entityType: string,
    entityId: string
  ): Promise<{ liked: boolean; count: number }>;
}
```

### 4.4 Visibility Rules

| Visibility | Visible To |
|------------|------------|
| public | 所有人 |
| followers | 粉絲和自己 |
| private | 僅自己 |

---

## 5. Validation Schemas

### 5.1 Idea Schema

```typescript
const createIdeaSchema = z.object({
  content: z
    .string()
    .min(1, 'Content is required')
    .max(5000, 'Content must be at most 5000 characters'),
  images: z
    .array(z.string().url())
    .max(9, 'Maximum 9 images')
    .optional(),
  visibility: z.enum(['public', 'followers', 'private']).default('public'),
  projectId: z.string().uuid().optional(),
  practiceId: z.string().uuid().optional(),
  tags: z.array(z.string()).max(10).optional(),
});
```

### 5.2 Comment Schema

```typescript
const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'Content is required')
    .max(2000, 'Content must be at most 2000 characters'),
  images: z
    .array(z.string().url())
    .max(3, 'Maximum 3 images')
    .optional(),
  entityType: z.nativeEnum(entity_type_t),
  entityId: z.string().uuid(),
  parentId: z.string().uuid().optional(),
});
```

### 5.3 Group Schema

```typescript
const createGroupSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
  description: z
    .string()
    .max(1000, 'Description must be at most 1000 characters')
    .optional(),
  coverImageUrl: z.string().url().optional(),
  category: z.nativeEnum(group_category_t),
  isPublic: z.boolean().default(true),
  maxMembers: z
    .number()
    .int()
    .min(2)
    .max(500)
    .default(100),
  joinApproval: z.boolean().default(false),
});
```

---

## 6. Implementation Files

### 6.1 Controllers
- `src/controllers/idea.controller.ts`
- `src/controllers/comment.controller.ts`

### 6.2 Services
- `src/services/idea.service.ts`
- `src/services/comment.service.ts`

### 6.3 Routes
- `src/routes/idea.routes.ts`
- `src/routes/comment.routes.ts`

### 6.4 Validators
- `src/validators/idea.validators.ts`
- `src/validators/comment.validators.ts`

### 6.5 Types
- `src/types/idea.types.ts`
- `src/types/comment.types.ts`

---

## 7. Error Handling

### 7.1 Error Codes

```typescript
const COMMUNITY_ERRORS = {
  IDEA_NOT_FOUND: {
    code: 'IDEA_NOT_FOUND',
    message: 'Idea not found',
    status: 404,
  },
  COMMENT_NOT_FOUND: {
    code: 'COMMENT_NOT_FOUND',
    message: 'Comment not found',
    status: 404,
  },
  COMMENT_EDIT_FORBIDDEN: {
    code: 'COMMENT_EDIT_FORBIDDEN',
    message: 'Comments can only be edited within 24 hours',
    status: 403,
  },
  GROUP_NOT_FOUND: {
    code: 'GROUP_NOT_FOUND',
    message: 'Group not found',
    status: 404,
  },
  GROUP_FULL: {
    code: 'GROUP_FULL',
    message: 'Group has reached maximum members',
    status: 400,
  },
  ALREADY_MEMBER: {
    code: 'ALREADY_MEMBER',
    message: 'Already a member of this group',
    status: 409,
  },
  NOT_MEMBER: {
    code: 'NOT_MEMBER',
    message: 'Not a member of this group',
    status: 403,
  },
  INSUFFICIENT_PERMISSION: {
    code: 'INSUFFICIENT_PERMISSION',
    message: 'Insufficient permission for this action',
    status: 403,
  },
  USER_BANNED: {
    code: 'USER_BANNED',
    message: 'You are banned from this group',
    status: 403,
  },
} as const;
```

---

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0.0 | 2026-02-05 | System | Initial specification |
