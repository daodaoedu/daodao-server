# Projects Module Specification

## 1. Overview

### 1.1 Purpose
學習專案模組是 DaoDao 平台的核心功能，讓用戶能夠創建、管理和追蹤他們的學習計畫，包含里程碑設定、每日任務、進展記錄和學習成果。

### 1.2 Scope
- 專案 CRUD 操作
- 里程碑管理
- 任務（每日計畫）管理
- 進展發文
- 學習筆記
- 成果記錄
- 專案統計與進度追蹤

---

## 2. Data Models

### 2.1 Project Entity

```prisma
model project {
  id                String    @id @default(uuid())
  user_id           String

  // Basic info
  title             String
  description       String?
  cover_image_url   String?

  // Category & Tags
  category_id       Int?

  // Status
  status            project_status_t @default(active)
  visibility        visibility_t     @default(public)

  // Progress
  progress_percent  Float            @default(0)

  // Dates
  start_date        DateTime?
  target_end_date   DateTime?
  actual_end_date   DateTime?

  // Motivation & Goals
  motivation        motivation_t?
  learning_goal     String?

  // Timestamps
  created_at        DateTime  @default(now())
  updated_at        DateTime  @updatedAt
  deleted_at        DateTime?

  // Relations
  user              users               @relation(fields: [user_id], references: [id])
  category          categories?         @relation(fields: [category_id], references: [id])
  milestones        milestone[]
  tasks             task[]
  posts             post[]
  notes             note[]
  outcomes          outcome[]
  entity_tags       entity_tags[]
  entity_resources  entity_resources[]
}
```

### 2.2 Milestone Entity

```prisma
model milestone {
  id            String    @id @default(uuid())
  project_id    String

  title         String
  description   String?
  order_index   Int       @default(0)

  // Status
  status        milestone_status_t @default(pending)

  // Dates
  start_date    DateTime?
  target_date   DateTime?
  completed_at  DateTime?

  // Timestamps
  created_at    DateTime  @default(now())
  updated_at    DateTime  @updatedAt

  // Relations
  project       project   @relation(fields: [project_id], references: [id])
  tasks         task[]
}
```

### 2.3 Task Entity

```prisma
model task {
  id            String    @id @default(uuid())
  project_id    String
  milestone_id  String?

  title         String
  description   String?

  // Status
  status        task_status_t @default(pending)
  priority      priority_t    @default(medium)

  // Schedule
  scheduled_date DateTime?
  completed_at   DateTime?

  // Duration (minutes)
  estimated_duration Int?
  actual_duration    Int?

  // Timestamps
  created_at    DateTime  @default(now())
  updated_at    DateTime  @updatedAt

  // Relations
  project       project    @relation(fields: [project_id], references: [id])
  milestone     milestone? @relation(fields: [milestone_id], references: [id])
}
```

### 2.4 Post Entity (Progress Updates)

```prisma
model post {
  id            String    @id @default(uuid())
  project_id    String
  user_id       String

  content       String
  images        String[]

  // Engagement
  likes_count   Int       @default(0)
  comments_count Int      @default(0)

  // Visibility
  visibility    visibility_t @default(public)

  // Timestamps
  created_at    DateTime  @default(now())
  updated_at    DateTime  @updatedAt
  deleted_at    DateTime?

  // Relations
  project       project   @relation(fields: [project_id], references: [id])
  user          users     @relation(fields: [user_id], references: [id])
  comments      comments[]
  likes         likes[]
}
```

### 2.5 Note Entity

```prisma
model note {
  id            String    @id @default(uuid())
  project_id    String
  user_id       String

  title         String
  content       String

  // Type
  note_type     note_type_t @default(general)

  // References
  resource_id   String?

  // Timestamps
  created_at    DateTime  @default(now())
  updated_at    DateTime  @updatedAt
  deleted_at    DateTime?

  // Relations
  project       project    @relation(fields: [project_id], references: [id])
  user          users      @relation(fields: [user_id], references: [id])
  resource      resources? @relation(fields: [resource_id], references: [id])
}
```

### 2.6 Outcome Entity

```prisma
model outcome {
  id            String    @id @default(uuid())
  project_id    String
  user_id       String

  title         String
  description   String?

  // Type
  outcome_type  outcome_t

  // Links/Files
  url           String?
  file_url      String?
  images        String[]

  // Timestamps
  created_at    DateTime  @default(now())
  updated_at    DateTime  @updatedAt

  // Relations
  project       project   @relation(fields: [project_id], references: [id])
  user          users     @relation(fields: [user_id], references: [id])
}
```

### 2.7 Enums

```prisma
enum project_status_t {
  draft
  active
  paused
  completed
  archived
}

enum milestone_status_t {
  pending
  in_progress
  completed
  skipped
}

enum task_status_t {
  pending
  in_progress
  completed
  skipped
}

enum priority_t {
  low
  medium
  high
  urgent
}

enum visibility_t {
  public
  followers
  private
}

enum note_type_t {
  general
  reflection
  summary
  question
  resource_note
}

enum outcome_t {
  article
  code
  design
  presentation
  video
  certificate
  project
  other
}

enum motivation_t {
  career_advancement
  personal_interest
  skill_improvement
  academic_requirement
  problem_solving
  creativity
  certification
  networking
  life_change
  hobby
  challenge
  income_increase
  time_flexibility
  health_wellness
  social_impact
  other
}
```

---

## 3. API Endpoints

### 3.1 Project CRUD

```yaml
# Create Project
POST /api/v1/projects
Authorization: Bearer <token>
Content-Type: application/json

Request:
  title: string (required, 2-100 chars)
  description?: string (max 2000 chars)
  coverImageUrl?: string (valid URL)
  categoryId?: number
  visibility?: "public" | "followers" | "private"
  startDate?: string (ISO date)
  targetEndDate?: string (ISO date)
  motivation?: motivation_t
  learningGoal?: string (max 500 chars)
  tags?: string[] (max 10 tags)

Response 201:
  success: true
  data:
    id: string
    title: string
    description: string | null
    coverImageUrl: string | null
    status: "draft"
    visibility: string
    progressPercent: 0
    startDate: string | null
    targetEndDate: string | null
    motivation: string | null
    learningGoal: string | null
    category: object | null
    tags: string[]
    createdAt: string

---

# Get Project
GET /api/v1/projects/:id
Authorization: Bearer <token> (optional for public)

Response 200:
  success: true
  data:
    id: string
    title: string
    description: string | null
    coverImageUrl: string | null
    status: string
    visibility: string
    progressPercent: number
    startDate: string | null
    targetEndDate: string | null
    actualEndDate: string | null
    motivation: string | null
    learningGoal: string | null
    category: object | null
    tags: string[]
    user:
      id: string
      name: string
      avatarUrl: string | null
    stats:
      milestonesCount: number
      completedMilestones: number
      tasksCount: number
      completedTasks: number
      postsCount: number
      notesCount: number
      outcomesCount: number
    createdAt: string
    updatedAt: string

Response 404:
  success: false
  error:
    code: "PROJECT_NOT_FOUND"

---

# Update Project
PATCH /api/v1/projects/:id
Authorization: Bearer <token>
Content-Type: application/json

Request:
  title?: string
  description?: string
  coverImageUrl?: string
  categoryId?: number
  visibility?: visibility_t
  status?: project_status_t
  startDate?: string
  targetEndDate?: string
  motivation?: motivation_t
  learningGoal?: string
  tags?: string[]

Response 200:
  success: true
  data:
    # Updated project object

---

# Delete Project
DELETE /api/v1/projects/:id
Authorization: Bearer <token>

Response 200:
  success: true
  data:
    message: "Project deleted successfully"
```

### 3.2 List Projects

```yaml
# List all projects (public)
GET /api/v1/projects
Authorization: Bearer <token> (optional)

Query Parameters:
  page?: number (default: 1)
  limit?: number (default: 20, max: 100)
  search?: string
  categoryId?: number
  status?: project_status_t
  motivation?: motivation_t
  tags?: string (comma-separated)
  userId?: string
  sortBy?: "createdAt" | "updatedAt" | "progress" (default: "createdAt")
  sortOrder?: "asc" | "desc" (default: "desc")

Response 200:
  success: true
  data:
    - id: string
      title: string
      description: string | null
      coverImageUrl: string | null
      status: string
      progressPercent: number
      user:
        id: string
        name: string
        avatarUrl: string | null
      category: object | null
      tags: string[]
      createdAt: string
  pagination:
    currentPage: number
    totalPages: number
    totalItems: number
    hasNext: boolean
    hasPrev: boolean

---

# Get my projects
GET /api/v1/projects/my
Authorization: Bearer <token>

Query Parameters:
  status?: project_status_t
  page?: number
  limit?: number

Response 200:
  success: true
  data:
    # Array of user's projects
```

### 3.3 Project Statistics

```yaml
GET /api/v1/projects/:id/stats
Authorization: Bearer <token>

Response 200:
  success: true
  data:
    overview:
      progressPercent: number
      daysElapsed: number
      daysRemaining: number | null
      estimatedCompletionDate: string | null
    milestones:
      total: number
      completed: number
      inProgress: number
      pending: number
    tasks:
      total: number
      completed: number
      inProgress: number
      pending: number
      skipped: number
    engagement:
      postsCount: number
      notesCount: number
      outcomesCount: number
      totalLikes: number
      totalComments: number
    activity:
      lastActivityAt: string | null
      activeDays: number
      averageTasksPerDay: number
```

### 3.4 Duplicate Project

```yaml
POST /api/v1/projects/:id/duplicate
Authorization: Bearer <token>
Content-Type: application/json

Request:
  title?: string (default: "Copy of {original title}")
  includeMilestones?: boolean (default: true)
  includeTasks?: boolean (default: true)

Response 201:
  success: true
  data:
    # New project object
```

### 3.5 Milestone Management

```yaml
# Create milestone
POST /api/v1/projects/:projectId/milestones
Authorization: Bearer <token>
Content-Type: application/json

Request:
  title: string (required)
  description?: string
  targetDate?: string (ISO date)
  orderIndex?: number

Response 201:
  success: true
  data:
    id: string
    title: string
    description: string | null
    status: "pending"
    orderIndex: number
    targetDate: string | null
    createdAt: string

---

# List milestones
GET /api/v1/projects/:projectId/milestones
Authorization: Bearer <token>

Response 200:
  success: true
  data:
    - id: string
      title: string
      description: string | null
      status: string
      orderIndex: number
      targetDate: string | null
      completedAt: string | null
      tasksCount: number
      completedTasksCount: number

---

# Update milestone
PATCH /api/v1/projects/:projectId/milestones/:milestoneId
Authorization: Bearer <token>
Content-Type: application/json

Request:
  title?: string
  description?: string
  status?: milestone_status_t
  targetDate?: string
  orderIndex?: number

Response 200:
  success: true
  data:
    # Updated milestone

---

# Delete milestone
DELETE /api/v1/projects/:projectId/milestones/:milestoneId
Authorization: Bearer <token>

Response 200:
  success: true
  data:
    message: "Milestone deleted successfully"

---

# Reorder milestones
PATCH /api/v1/projects/:projectId/milestones/reorder
Authorization: Bearer <token>
Content-Type: application/json

Request:
  order:
    - id: string
      orderIndex: number

Response 200:
  success: true
  data:
    message: "Milestones reordered successfully"
```

### 3.6 Task Management

```yaml
# Create task
POST /api/v1/projects/:projectId/tasks
Authorization: Bearer <token>
Content-Type: application/json

Request:
  title: string (required)
  description?: string
  milestoneId?: string
  priority?: priority_t
  scheduledDate?: string (ISO date)
  estimatedDuration?: number (minutes)

Response 201:
  success: true
  data:
    id: string
    title: string
    description: string | null
    status: "pending"
    priority: string
    scheduledDate: string | null
    estimatedDuration: number | null
    milestone: object | null

---

# List tasks
GET /api/v1/projects/:projectId/tasks
Authorization: Bearer <token>

Query Parameters:
  milestoneId?: string
  status?: task_status_t
  priority?: priority_t
  scheduledDate?: string (ISO date)
  page?: number
  limit?: number

Response 200:
  success: true
  data:
    - id: string
      title: string
      status: string
      priority: string
      scheduledDate: string | null
      milestone: object | null
  pagination: ...

---

# Update task
PATCH /api/v1/projects/:projectId/tasks/:taskId
Authorization: Bearer <token>

Request:
  title?: string
  description?: string
  status?: task_status_t
  priority?: priority_t
  milestoneId?: string | null
  scheduledDate?: string
  estimatedDuration?: number
  actualDuration?: number

Response 200:
  success: true
  data:
    # Updated task

---

# Complete task
POST /api/v1/projects/:projectId/tasks/:taskId/complete
Authorization: Bearer <token>

Request:
  actualDuration?: number (minutes)

Response 200:
  success: true
  data:
    # Updated task with status: "completed"

---

# Delete task
DELETE /api/v1/projects/:projectId/tasks/:taskId
Authorization: Bearer <token>

Response 200:
  success: true
  data:
    message: "Task deleted successfully"
```

### 3.7 Progress Posts

```yaml
# Create post
POST /api/v1/projects/:projectId/posts
Authorization: Bearer <token>
Content-Type: application/json

Request:
  content: string (required, 1-5000 chars)
  images?: string[] (max 9 URLs)
  visibility?: visibility_t

Response 201:
  success: true
  data:
    id: string
    content: string
    images: string[]
    visibility: string
    likesCount: 0
    commentsCount: 0
    user:
      id: string
      name: string
      avatarUrl: string | null
    createdAt: string

---

# List posts
GET /api/v1/projects/:projectId/posts
Authorization: Bearer <token> (optional for public)

Query Parameters:
  page?: number
  limit?: number

Response 200:
  success: true
  data:
    - id: string
      content: string
      images: string[]
      likesCount: number
      commentsCount: number
      isLiked: boolean (if authenticated)
      user: object
      createdAt: string
  pagination: ...

---

# Update post
PATCH /api/v1/projects/:projectId/posts/:postId
Authorization: Bearer <token>

Request:
  content?: string
  images?: string[]
  visibility?: visibility_t

Response 200:
  success: true
  data:
    # Updated post

---

# Delete post
DELETE /api/v1/projects/:projectId/posts/:postId
Authorization: Bearer <token>

Response 200:
  success: true
  data:
    message: "Post deleted successfully"
```

### 3.8 Notes Management

```yaml
# Create note
POST /api/v1/projects/:projectId/notes
Authorization: Bearer <token>
Content-Type: application/json

Request:
  title: string (required, 2-200 chars)
  content: string (required, 1-50000 chars)
  noteType?: note_type_t
  resourceId?: string

Response 201:
  success: true
  data:
    id: string
    title: string
    content: string
    noteType: string
    resource: object | null
    createdAt: string

---

# List notes
GET /api/v1/projects/:projectId/notes
Authorization: Bearer <token>

Query Parameters:
  noteType?: note_type_t
  search?: string
  page?: number
  limit?: number

Response 200:
  success: true
  data:
    - id: string
      title: string
      content: string (truncated to 200 chars)
      noteType: string
      createdAt: string
  pagination: ...

---

# Get note detail
GET /api/v1/projects/:projectId/notes/:noteId
Authorization: Bearer <token>

Response 200:
  success: true
  data:
    id: string
    title: string
    content: string (full)
    noteType: string
    resource: object | null
    createdAt: string
    updatedAt: string

---

# Update note
PATCH /api/v1/projects/:projectId/notes/:noteId
Authorization: Bearer <token>

Request:
  title?: string
  content?: string
  noteType?: note_type_t

Response 200:
  success: true
  data:
    # Updated note

---

# Delete note
DELETE /api/v1/projects/:projectId/notes/:noteId
Authorization: Bearer <token>

Response 200:
  success: true
  data:
    message: "Note deleted successfully"
```

### 3.9 Outcomes Management

```yaml
# Create outcome
POST /api/v1/projects/:projectId/outcomes
Authorization: Bearer <token>
Content-Type: application/json

Request:
  title: string (required)
  description?: string
  outcomeType: outcome_t (required)
  url?: string (valid URL)
  fileUrl?: string (valid URL)
  images?: string[] (max 9)

Response 201:
  success: true
  data:
    id: string
    title: string
    description: string | null
    outcomeType: string
    url: string | null
    fileUrl: string | null
    images: string[]
    createdAt: string

---

# List outcomes
GET /api/v1/projects/:projectId/outcomes
Authorization: Bearer <token>

Query Parameters:
  outcomeType?: outcome_t
  page?: number
  limit?: number

Response 200:
  success: true
  data:
    - id: string
      title: string
      outcomeType: string
      url: string | null
      createdAt: string
  pagination: ...

---

# Update outcome
PATCH /api/v1/projects/:projectId/outcomes/:outcomeId
Authorization: Bearer <token>

Request:
  title?: string
  description?: string
  outcomeType?: outcome_t
  url?: string
  fileUrl?: string
  images?: string[]

Response 200:
  success: true
  data:
    # Updated outcome

---

# Delete outcome
DELETE /api/v1/projects/:projectId/outcomes/:outcomeId
Authorization: Bearer <token>

Response 200:
  success: true
  data:
    message: "Outcome deleted successfully"
```

---

## 4. Business Rules

### 4.1 Progress Calculation

```typescript
/**
 * 專案進度計算邏輯
 * 基於里程碑和任務完成度加權計算
 */
function calculateProjectProgress(project: Project): number {
  const milestones = project.milestones;

  if (milestones.length === 0) {
    // 無里程碑時，基於任務計算
    const tasks = project.tasks;
    if (tasks.length === 0) return 0;

    const completed = tasks.filter(t => t.status === 'completed').length;
    return Math.round((completed / tasks.length) * 100);
  }

  // 有里程碑時，每個里程碑佔相同權重
  let totalProgress = 0;

  for (const milestone of milestones) {
    const tasks = milestone.tasks;

    if (tasks.length === 0) {
      // 里程碑無任務，視狀態決定
      if (milestone.status === 'completed') {
        totalProgress += 100;
      } else if (milestone.status === 'in_progress') {
        totalProgress += 50;
      }
    } else {
      const completed = tasks.filter(t => t.status === 'completed').length;
      totalProgress += (completed / tasks.length) * 100;
    }
  }

  return Math.round(totalProgress / milestones.length);
}
```

### 4.2 Status Transitions

```
Project Status Flow:
  draft ─────────▶ active
    │                │
    │                ├──▶ paused ──▶ active
    │                │
    │                └──▶ completed
    │                      │
    └──────────────────────┴──▶ archived

Milestone Status Flow:
  pending ─▶ in_progress ─▶ completed
                │              │
                └──▶ skipped ◀─┘

Task Status Flow:
  pending ─▶ in_progress ─▶ completed
                │              │
                └──▶ skipped ◀─┘
```

### 4.3 Visibility Rules

| Visibility | Owner | Followers | Public |
|------------|-------|-----------|--------|
| public | ✓ Full | ✓ Full | ✓ Full |
| followers | ✓ Full | ✓ Full | ✗ Hidden |
| private | ✓ Full | ✗ Hidden | ✗ Hidden |

### 4.4 Auto-Complete Rules

1. 當所有任務完成時，里程碑自動標記為完成
2. 當所有里程碑完成時，建議將專案標記為完成
3. 專案進度自動更新當任務狀態變更

---

## 5. Validation Schemas

### 5.1 Project Schema

```typescript
const createProjectSchema = z.object({
  title: z
    .string()
    .min(2, 'Title must be at least 2 characters')
    .max(100, 'Title must be at most 100 characters'),
  description: z
    .string()
    .max(2000, 'Description must be at most 2000 characters')
    .optional(),
  coverImageUrl: z.string().url('Invalid URL').optional(),
  categoryId: z.number().int().positive().optional(),
  visibility: z.enum(['public', 'followers', 'private']).default('public'),
  startDate: z.string().datetime().optional(),
  targetEndDate: z.string().datetime().optional(),
  motivation: z.nativeEnum(motivation_t).optional(),
  learningGoal: z
    .string()
    .max(500, 'Learning goal must be at most 500 characters')
    .optional(),
  tags: z.array(z.string()).max(10, 'Maximum 10 tags allowed').optional(),
});
```

### 5.2 Task Schema

```typescript
const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be at most 200 characters'),
  description: z
    .string()
    .max(1000, 'Description must be at most 1000 characters')
    .optional(),
  milestoneId: z.string().uuid().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  scheduledDate: z.string().datetime().optional(),
  estimatedDuration: z
    .number()
    .int()
    .positive()
    .max(480, 'Maximum 8 hours')
    .optional(),
});
```

---

## 6. Implementation Files

### 6.1 Controllers
- `src/controllers/project.controller.ts`
- `src/controllers/milestone.controller.ts`
- `src/controllers/note.controller.ts`
- `src/controllers/outcome.controller.ts`

### 6.2 Services
- `src/services/project.service.ts`
- `src/services/milestone.service.ts`
- `src/services/note.service.ts`
- `src/services/outcome.service.ts`

### 6.3 Routes
- `src/routes/project.routes.ts`

### 6.4 Validators
- `src/validators/project.validators.ts`

### 6.5 Types
- `src/types/project.types.ts`
- `src/types/milestone.types.ts`
- `src/types/note.types.ts`
- `src/types/outcome.types.ts`

---

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0.0 | 2026-02-05 | System | Initial specification |
