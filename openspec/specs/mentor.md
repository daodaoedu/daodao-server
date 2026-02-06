# Mentor Module Specification

## 1. Overview

### 1.1 Purpose
導師模組提供馬拉松活動管理和導師-學員配對功能，讓有經驗的學習者能夠指導新學習者，促進學習社群的成長。

### 1.2 Scope
- 馬拉松活動管理
- 導師-學員配對
- 導師評價與反饋
- 活動進度追蹤
- 資格審核機制

---

## 2. Data Models

### 2.1 Marathon Entity

```prisma
model marathon {
  id                    String    @id @default(uuid())
  organizer_id          String

  // Basic info
  title                 String
  description           String?
  cover_image_url       String?

  // Schedule
  start_date            DateTime
  end_date              DateTime
  registration_deadline DateTime

  // Settings
  max_participants      Int       @default(50)
  max_mentors           Int       @default(10)
  mentees_per_mentor    Int       @default(5)

  // Requirements
  mentor_requirements   String?
  mentee_requirements   String?

  // Fee
  fee_plan_id           String?

  // Status
  status                marathon_status_t @default(draft)
  visibility            visibility_t      @default(public)

  // Stats
  participants_count    Int       @default(0)
  mentors_count         Int       @default(0)

  // Timestamps
  created_at            DateTime  @default(now())
  updated_at            DateTime  @updatedAt
  deleted_at            DateTime?

  // Relations
  organizer             users                 @relation(fields: [organizer_id], references: [id])
  fee_plan              fee_plans?            @relation(fields: [fee_plan_id], references: [id])
  participants          mentor_participants[]
  eligibilities         eligibility[]
  project_marathons     project_marathon[]
}
```

### 2.2 Mentor Participant Entity

```prisma
model mentor_participants {
  id              String    @id @default(uuid())
  marathon_id     String
  user_id         String

  // Role
  role            participant_role_t

  // Mentor assignment (for mentees)
  mentor_id       String?

  // Status
  status          participant_status_t @default(pending)
  eligibility_id  String?

  // Progress
  progress_percent Float    @default(0)
  completed_tasks  Int      @default(0)
  total_tasks      Int      @default(0)

  // Timestamps
  joined_at       DateTime  @default(now())
  completed_at    DateTime?

  // Relations
  marathon        marathon  @relation(fields: [marathon_id], references: [id])
  user            users     @relation("Participant", fields: [user_id], references: [id])
  mentor          users?    @relation("Mentor", fields: [mentor_id], references: [id])
  eligibility     eligibility? @relation(fields: [eligibility_id], references: [id])
  feedbacks       mentor_feedback[]

  @@unique([marathon_id, user_id])
}
```

### 2.3 Mentor Feedback Entity

```prisma
model mentor_feedback {
  id              String    @id @default(uuid())
  participant_id  String
  author_id       String

  // Feedback type
  type            feedback_type_t

  // Content
  content         String
  rating          Int?      // 1-5

  // Timestamps
  created_at      DateTime  @default(now())
  updated_at      DateTime  @updatedAt

  // Relations
  participant     mentor_participants @relation(fields: [participant_id], references: [id])
  author          users               @relation(fields: [author_id], references: [id])
}
```

### 2.4 Eligibility Entity

```prisma
model eligibility {
  id              String    @id @default(uuid())
  marathon_id     String
  user_id         String

  // Application
  application     String?
  resume_url      String?

  // Review
  status          eligibility_status_t @default(pending)
  reviewed_by     String?
  review_notes    String?
  reviewed_at     DateTime?

  // Timestamps
  created_at      DateTime  @default(now())
  updated_at      DateTime  @updatedAt

  // Relations
  marathon        marathon            @relation(fields: [marathon_id], references: [id])
  user            users               @relation(fields: [user_id], references: [id])
  reviewer        users?              @relation("Reviewer", fields: [reviewed_by], references: [id])
  participants    mentor_participants[]

  @@unique([marathon_id, user_id])
}
```

### 2.5 Fee Plan Entity

```prisma
model fee_plans {
  id              String    @id @default(uuid())

  // Basic info
  name            String
  description     String?

  // Pricing
  amount          Decimal   @db.Decimal(10, 2)
  currency        String    @default("TWD")

  // Type
  type            fee_type_t

  // Early bird
  early_bird_amount   Decimal?  @db.Decimal(10, 2)
  early_bird_deadline DateTime?

  // Status
  is_active       Boolean   @default(true)

  // Timestamps
  created_at      DateTime  @default(now())
  updated_at      DateTime  @updatedAt

  // Relations
  marathons       marathon[]
}
```

### 2.6 Project Marathon Entity

```prisma
model project_marathon {
  id              String    @id @default(uuid())
  project_id      String
  marathon_id     String

  // Status
  status          project_marathon_status_t @default(active)

  // Progress
  progress_percent Float    @default(0)

  // Timestamps
  enrolled_at     DateTime  @default(now())
  completed_at    DateTime?

  // Relations
  project         project   @relation(fields: [project_id], references: [id])
  marathon        marathon  @relation(fields: [marathon_id], references: [id])

  @@unique([project_id, marathon_id])
}
```

### 2.7 Enums

```prisma
enum marathon_status_t {
  draft           // 草稿
  registration    // 報名中
  in_progress     // 進行中
  completed       // 已完成
  cancelled       // 已取消
}

enum participant_role_t {
  mentor          // 導師
  mentee          // 學員
  organizer       // 組織者
}

enum participant_status_t {
  pending         // 待審核
  approved        // 已批准
  rejected        // 已拒絕
  active          // 進行中
  completed       // 已完成
  dropped         // 已退出
}

enum feedback_type_t {
  mentor_to_mentee    // 導師給學員
  mentee_to_mentor    // 學員給導師
  progress_update     // 進度更新
  final_review        // 結業評價
}

enum eligibility_status_t {
  pending         // 待審核
  approved        // 通過
  rejected        // 拒絕
  waitlisted      // 候補
}

enum fee_type_t {
  free            // 免費
  one_time        // 一次性
  deposit         // 押金制
  subscription    // 訂閱制
}

enum project_marathon_status_t {
  active          // 進行中
  completed       // 已完成
  dropped         // 已退出
}
```

---

## 3. API Endpoints

### 3.1 Marathon Management

```yaml
# Create Marathon
POST /api/v1/mentor/marathons
Authorization: Bearer <token>
Content-Type: application/json

Request:
  title: string (required, 2-200 chars)
  description?: string (max 5000 chars)
  coverImageUrl?: string
  startDate: string (required, ISO date)
  endDate: string (required, ISO date)
  registrationDeadline: string (required, ISO date)
  maxParticipants?: number (default: 50)
  maxMentors?: number (default: 10)
  menteesPerMentor?: number (default: 5)
  mentorRequirements?: string
  menteeRequirements?: string
  feePlanId?: string
  visibility?: visibility_t

Response 201:
  success: true
  data:
    id: string
    title: string
    description: string | null
    coverImageUrl: string | null
    startDate: string
    endDate: string
    registrationDeadline: string
    maxParticipants: number
    maxMentors: number
    menteesPerMentor: number
    status: "draft"
    organizer:
      id: string
      name: string
    createdAt: string

---

# List Marathons
GET /api/v1/mentor/marathons
Authorization: Bearer <token> (optional)

Query Parameters:
  page?: number
  limit?: number
  status?: marathon_status_t
  search?: string
  sortBy?: "startDate" | "createdAt" | "participantsCount"
  sortOrder?: "asc" | "desc"

Response 200:
  success: true
  data:
    - id: string
      title: string
      description: string | null
      coverImageUrl: string | null
      startDate: string
      endDate: string
      registrationDeadline: string
      status: string
      participantsCount: number
      mentorsCount: number
      maxParticipants: number
      organizer:
        id: string
        name: string
        avatarUrl: string | null
      userStatus: (if authenticated)
        isOrganizer: boolean
        isParticipant: boolean
        role: string | null
  pagination: ...

---

# Get Marathon
GET /api/v1/mentor/marathons/:id
Authorization: Bearer <token> (optional)

Response 200:
  success: true
  data:
    id: string
    title: string
    description: string | null
    coverImageUrl: string | null
    startDate: string
    endDate: string
    registrationDeadline: string
    maxParticipants: number
    maxMentors: number
    menteesPerMentor: number
    mentorRequirements: string | null
    menteeRequirements: string | null
    status: string
    visibility: string
    participantsCount: number
    mentorsCount: number
    organizer:
      id: string
      name: string
      avatarUrl: string | null
      bio: string | null
    feePlan: object | null
    userStatus: (if authenticated)
      isOrganizer: boolean
      isParticipant: boolean
      role: string | null
      status: string | null
      mentor: object | null
    stats:
      totalMentees: number
      totalMentors: number
      averageProgress: number
      completionRate: number
    createdAt: string
    updatedAt: string

---

# Update Marathon
PATCH /api/v1/mentor/marathons/:id
Authorization: Bearer <token>
Required: Organizer

Request:
  title?: string
  description?: string
  coverImageUrl?: string
  startDate?: string
  endDate?: string
  registrationDeadline?: string
  maxParticipants?: number
  maxMentors?: number
  menteesPerMentor?: number
  mentorRequirements?: string
  menteeRequirements?: string
  visibility?: visibility_t
  status?: marathon_status_t

Response 200:
  success: true
  data:
    # Updated marathon

---

# Delete Marathon
DELETE /api/v1/mentor/marathons/:id
Authorization: Bearer <token>
Required: Organizer

Response 200:
  success: true
  data:
    message: "Marathon deleted successfully"

---

# Update Marathon Status
PATCH /api/v1/mentor/marathons/:id/status
Authorization: Bearer <token>
Required: Organizer

Request:
  status: marathon_status_t

Response 200:
  success: true
  data:
    id: string
    status: string
```

### 3.2 Participation

```yaml
# Apply to Marathon
POST /api/v1/mentor/marathons/:id/apply
Authorization: Bearer <token>
Content-Type: application/json

Request:
  role: "mentor" | "mentee" (required)
  application?: string (motivation, max 2000 chars)
  resumeUrl?: string

Response 200:
  success: true
  data:
    participantId: string
    eligibilityId: string
    status: "pending"
    message: "Application submitted successfully"

Response 400:
  success: false
  error:
    code: "REGISTRATION_CLOSED"
    message: "Registration deadline has passed"

---

# Get My Participation
GET /api/v1/mentor/marathons/:id/my-participation
Authorization: Bearer <token>

Response 200:
  success: true
  data:
    participant:
      id: string
      role: string
      status: string
      progressPercent: number
      completedTasks: number
      totalTasks: number
      joinedAt: string
    eligibility:
      id: string
      status: string
      application: string | null
    mentor: (if mentee)
      id: string
      name: string
      avatarUrl: string | null
      email: string
    mentees: (if mentor)
      - id: string
        name: string
        avatarUrl: string | null
        progressPercent: number

Response 404:
  success: false
  error:
    code: "NOT_PARTICIPANT"
    message: "You are not a participant of this marathon"

---

# Withdraw from Marathon
DELETE /api/v1/mentor/marathons/:id/participation
Authorization: Bearer <token>

Response 200:
  success: true
  data:
    message: "Successfully withdrawn from marathon"

---

# List Participants
GET /api/v1/mentor/marathons/:id/participants
Authorization: Bearer <token>

Query Parameters:
  role?: participant_role_t
  status?: participant_status_t
  page?: number
  limit?: number

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
      progressPercent: number
      mentor: object | null
      joinedAt: string
  pagination: ...
```

### 3.3 Eligibility Management

```yaml
# List Eligibilities (Organizer)
GET /api/v1/mentor/marathons/:id/eligibilities
Authorization: Bearer <token>
Required: Organizer

Query Parameters:
  status?: eligibility_status_t
  role?: participant_role_t
  page?: number
  limit?: number

Response 200:
  success: true
  data:
    - id: string
      user:
        id: string
        name: string
        email: string
        avatarUrl: string | null
      application: string | null
      resumeUrl: string | null
      status: string
      reviewedAt: string | null
      reviewNotes: string | null
      createdAt: string
  pagination: ...

---

# Review Eligibility (Organizer)
PATCH /api/v1/mentor/marathons/:marathonId/eligibilities/:eligibilityId
Authorization: Bearer <token>
Required: Organizer

Request:
  status: "approved" | "rejected" | "waitlisted"
  reviewNotes?: string

Response 200:
  success: true
  data:
    id: string
    status: string
    reviewedAt: string
    reviewNotes: string | null

---

# Bulk Review Eligibilities
POST /api/v1/mentor/marathons/:id/eligibilities/bulk-review
Authorization: Bearer <token>
Required: Organizer

Request:
  eligibilityIds: string[]
  status: "approved" | "rejected" | "waitlisted"
  reviewNotes?: string

Response 200:
  success: true
  data:
    processed: number
    failed: number
    results:
      - eligibilityId: string
        status: string
        error: string | null
```

### 3.4 Mentor Assignment

```yaml
# Auto-Assign Mentors (Organizer)
POST /api/v1/mentor/marathons/:id/assign-mentors
Authorization: Bearer <token>
Required: Organizer

Request:
  strategy?: "random" | "balanced" | "preference" (default: "balanced")

Response 200:
  success: true
  data:
    assignments:
      - mentorId: string
        mentorName: string
        menteeCount: number
        mentees:
          - id: string
            name: string
    unassigned:
      - id: string
        name: string
        reason: string

---

# Manual Assign Mentor
POST /api/v1/mentor/marathons/:marathonId/participants/:participantId/assign-mentor
Authorization: Bearer <token>
Required: Organizer

Request:
  mentorId: string

Response 200:
  success: true
  data:
    participant:
      id: string
      user: object
    mentor:
      id: string
      name: string

---

# Reassign Mentor
PATCH /api/v1/mentor/marathons/:marathonId/participants/:participantId/mentor
Authorization: Bearer <token>
Required: Organizer

Request:
  newMentorId: string
  reason?: string

Response 200:
  success: true
  data:
    participant: object
    oldMentor: object
    newMentor: object
```

### 3.5 Feedback System

```yaml
# Create Feedback
POST /api/v1/mentor/marathons/:marathonId/participants/:participantId/feedback
Authorization: Bearer <token>

Request:
  type: feedback_type_t
  content: string (required, 10-5000 chars)
  rating?: number (1-5)

Response 201:
  success: true
  data:
    id: string
    type: string
    content: string
    rating: number | null
    author:
      id: string
      name: string
    createdAt: string

---

# List Feedback
GET /api/v1/mentor/marathons/:marathonId/participants/:participantId/feedback
Authorization: Bearer <token>

Query Parameters:
  type?: feedback_type_t
  page?: number
  limit?: number

Response 200:
  success: true
  data:
    - id: string
      type: string
      content: string
      rating: number | null
      author:
        id: string
        name: string
        avatarUrl: string | null
      createdAt: string
  pagination: ...

---

# Update Feedback
PATCH /api/v1/mentor/marathons/:marathonId/feedback/:feedbackId
Authorization: Bearer <token>

Request:
  content?: string
  rating?: number

Response 200:
  success: true
  data:
    # Updated feedback

---

# Delete Feedback
DELETE /api/v1/mentor/marathons/:marathonId/feedback/:feedbackId
Authorization: Bearer <token>

Response 200:
  success: true
  data:
    message: "Feedback deleted successfully"
```

### 3.6 Progress Tracking

```yaml
# Update Participant Progress
PATCH /api/v1/mentor/marathons/:marathonId/participants/:participantId/progress
Authorization: Bearer <token>
Required: Participant, Mentor, or Organizer

Request:
  progressPercent?: number (0-100)
  completedTasks?: number
  totalTasks?: number
  notes?: string

Response 200:
  success: true
  data:
    id: string
    progressPercent: number
    completedTasks: number
    totalTasks: number
    updatedAt: string

---

# Get Marathon Statistics
GET /api/v1/mentor/marathons/:id/statistics
Authorization: Bearer <token>
Required: Organizer

Response 200:
  success: true
  data:
    overview:
      totalParticipants: number
      totalMentors: number
      totalMentees: number
      averageProgress: number
      completionRate: number
    byStatus:
      pending: number
      approved: number
      active: number
      completed: number
      dropped: number
    progressDistribution:
      "0-25": number
      "26-50": number
      "51-75": number
      "76-100": number
    mentorStats:
      - mentorId: string
        mentorName: string
        menteeCount: number
        averageMenteeProgress: number
        feedbackCount: number
    timeline:
      - date: string
        newParticipants: number
        completions: number
```

---

## 4. Business Rules

### 4.1 Marathon Lifecycle

```
Marathon Status Flow:

  draft ──────────▶ registration
                        │
                        ▼
                   in_progress
                        │
                        ▼
                    completed

  (any status) ──────▶ cancelled
```

### 4.2 Participant Status Flow

```
Participant Status Flow:

  pending ─────▶ approved ─────▶ active ─────▶ completed
     │              │              │
     │              │              └──▶ dropped
     │              │
     └──▶ rejected  └──▶ dropped
```

### 4.3 Mentor Assignment Rules

| Rule | Description |
|------|-------------|
| Max mentees | 每位導師最多指派 menteesPerMentor 位學員 |
| Balance | 自動分配時盡量平均分配 |
| Reassign | 導師離開時需重新分配學員 |
| Preference | 可選擇基於偏好分配 |

### 4.4 Eligibility Rules

| Rule | Description |
|------|-------------|
| Mentor criteria | 導師須符合 mentorRequirements |
| Mentee criteria | 學員須符合 menteeRequirements |
| Review time | 48 小時內審核 |
| Waitlist | 人數超限時進入候補 |

### 4.5 Feedback Rules

| Rule | Description |
|------|-------------|
| Timing | 結業評價需在活動結束後 7 天內提交 |
| Rating required | 結業評價必須包含評分 |
| Edit window | 提交後 24 小時內可編輯 |

---

## 5. Validation Schemas

### 5.1 Marathon Schema

```typescript
const createMarathonSchema = z.object({
  title: z
    .string()
    .min(2, 'Title must be at least 2 characters')
    .max(200, 'Title must be at most 200 characters'),
  description: z
    .string()
    .max(5000, 'Description must be at most 5000 characters')
    .optional(),
  coverImageUrl: z.string().url().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  registrationDeadline: z.string().datetime(),
  maxParticipants: z.number().int().min(2).max(500).default(50),
  maxMentors: z.number().int().min(1).max(50).default(10),
  menteesPerMentor: z.number().int().min(1).max(20).default(5),
  mentorRequirements: z.string().max(2000).optional(),
  menteeRequirements: z.string().max(2000).optional(),
  feePlanId: z.string().uuid().optional(),
  visibility: z.enum(['public', 'followers', 'private']).default('public'),
}).refine(
  (data) => new Date(data.endDate) > new Date(data.startDate),
  'End date must be after start date'
).refine(
  (data) => new Date(data.registrationDeadline) <= new Date(data.startDate),
  'Registration deadline must be before or on start date'
);
```

### 5.2 Application Schema

```typescript
const applyMarathonSchema = z.object({
  role: z.enum(['mentor', 'mentee']),
  application: z
    .string()
    .max(2000, 'Application must be at most 2000 characters')
    .optional(),
  resumeUrl: z.string().url().optional(),
});
```

### 5.3 Feedback Schema

```typescript
const createFeedbackSchema = z.object({
  type: z.nativeEnum(feedback_type_t),
  content: z
    .string()
    .min(10, 'Feedback must be at least 10 characters')
    .max(5000, 'Feedback must be at most 5000 characters'),
  rating: z.number().int().min(1).max(5).optional(),
});
```

---

## 6. Implementation Files

### 6.1 Controllers
- `src/controllers/mentor.controller.ts`

### 6.2 Services
- `src/services/mentor.service.ts`

### 6.3 Routes
- `src/routes/mentor.routes.ts`

### 6.4 Validators
- `src/validators/mentor.validators.ts`

### 6.5 Types
- `src/types/mentor.types.ts`

---

## 7. Error Handling

### 7.1 Error Codes

```typescript
const MENTOR_ERRORS = {
  MARATHON_NOT_FOUND: {
    code: 'MARATHON_NOT_FOUND',
    message: 'Marathon not found',
    status: 404,
  },
  REGISTRATION_CLOSED: {
    code: 'REGISTRATION_CLOSED',
    message: 'Registration deadline has passed',
    status: 400,
  },
  MARATHON_FULL: {
    code: 'MARATHON_FULL',
    message: 'Marathon has reached maximum participants',
    status: 400,
  },
  MENTORS_FULL: {
    code: 'MENTORS_FULL',
    message: 'Marathon has reached maximum mentors',
    status: 400,
  },
  ALREADY_PARTICIPANT: {
    code: 'ALREADY_PARTICIPANT',
    message: 'Already a participant of this marathon',
    status: 409,
  },
  NOT_PARTICIPANT: {
    code: 'NOT_PARTICIPANT',
    message: 'Not a participant of this marathon',
    status: 404,
  },
  NOT_ORGANIZER: {
    code: 'NOT_ORGANIZER',
    message: 'Only organizers can perform this action',
    status: 403,
  },
  ELIGIBILITY_NOT_FOUND: {
    code: 'ELIGIBILITY_NOT_FOUND',
    message: 'Eligibility record not found',
    status: 404,
  },
  MENTOR_NOT_AVAILABLE: {
    code: 'MENTOR_NOT_AVAILABLE',
    message: 'Selected mentor is not available',
    status: 400,
  },
  CANNOT_WITHDRAW: {
    code: 'CANNOT_WITHDRAW',
    message: 'Cannot withdraw from an active marathon',
    status: 400,
  },
} as const;
```

---

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0.0 | 2026-02-05 | System | Initial specification |
