# Users Module Specification

## 1. Overview

### 1.1 Purpose
用戶模組負責管理用戶基本資料、個人設定、偏好配置及用戶統計數據，是平台的核心實體模組。

### 1.2 Scope
- 用戶 CRUD 操作
- 個人資料管理
- 偏好設定
- 用戶統計
- 自訂 ID 管理
- 帳號刪除

---

## 2. Data Models

### 2.1 User Entity (Primary)

```prisma
model users {
  id                    String    @id @default(uuid())
  custom_id             String?   @unique
  email                 String    @unique
  password_hash         String?
  name                  String
  role_id               Int       @default(2)

  // Profile
  avatar_url            String?
  bio                   String?
  gender                gender_t?
  birthday              DateTime?
  education_stage       education_stage_t?

  // OAuth
  google_id             String?   @unique
  apple_id              String?   @unique

  // Status
  email_verified        Boolean   @default(false)
  email_verified_at     DateTime?
  is_active             Boolean   @default(true)
  last_login_at         DateTime?

  // Timestamps
  created_at            DateTime  @default(now())
  updated_at            DateTime  @updatedAt
  deleted_at            DateTime?

  // Relations
  role                  roles               @relation(fields: [role_id], references: [id])
  profile               user_profiles?
  preferences           user_preferences[]
  professional_fields   user_professional_fields[]
  interests             user_interests[]
  activity_stats        user_activity_stats?
  projects              user_project[]
  practices             practices[]
  resources             resources[]
  ideas                 ideas[]
  comments              comments[]
}
```

### 2.2 User Profile Entity

```prisma
model user_profiles {
  id              String    @id @default(uuid())
  user_id         String    @unique

  // Extended profile
  phone           String?
  website         String?
  location_id     Int?
  timezone        String?
  language        String    @default("zh-TW")

  // Social links
  linkedin_url    String?
  twitter_url     String?
  github_url      String?

  // Timestamps
  created_at      DateTime  @default(now())
  updated_at      DateTime  @updatedAt

  user            users     @relation(fields: [user_id], references: [id])
  location        location? @relation(fields: [location_id], references: [id])
}
```

### 2.3 User Preferences Entity

```prisma
model user_preferences {
  id                  String    @id @default(uuid())
  user_id             String
  preference_type_id  Int
  preference_option_id Int

  created_at          DateTime  @default(now())
  updated_at          DateTime  @updatedAt

  user                users               @relation(fields: [user_id], references: [id])
  preference_type     preference_types    @relation(fields: [preference_type_id], references: [id])
  preference_option   preference_options  @relation(fields: [preference_option_id], references: [id])

  @@unique([user_id, preference_type_id])
}
```

### 2.4 User Activity Stats Entity

```prisma
model user_activity_stats {
  id                    String    @id @default(uuid())
  user_id               String    @unique

  // Counts
  total_projects        Int       @default(0)
  total_practices       Int       @default(0)
  total_checkins        Int       @default(0)
  total_resources       Int       @default(0)
  total_ideas           Int       @default(0)
  total_comments        Int       @default(0)

  // Streaks
  current_streak        Int       @default(0)
  longest_streak        Int       @default(0)

  // Learning hours
  total_learning_hours  Float     @default(0)

  // Timestamps
  last_active_at        DateTime?
  created_at            DateTime  @default(now())
  updated_at            DateTime  @updatedAt

  user                  users     @relation(fields: [user_id], references: [id])
}
```

### 2.5 Enums

```prisma
enum gender_t {
  male
  female
  other
}

enum education_stage_t {
  elementary
  junior_high
  senior_high
  undergraduate
  master
  doctorate
  other
}
```

---

## 3. API Endpoints

### 3.1 Get Current User

```yaml
GET /api/v1/me
Authorization: Bearer <token>

Response 200:
  success: true
  data:
    id: string
    customId: string | null
    email: string
    name: string
    avatarUrl: string | null
    bio: string | null
    gender: string | null
    birthday: string | null
    educationStage: string | null
    emailVerified: boolean
    role:
      id: number
      name: string
    profile:
      phone: string | null
      website: string | null
      location: object | null
      timezone: string | null
      language: string
    stats:
      totalProjects: number
      totalPractices: number
      totalCheckins: number
      currentStreak: number
      longestStreak: number
    createdAt: string
    updatedAt: string
```

### 3.2 Update Current User

```yaml
PATCH /api/v1/me
Authorization: Bearer <token>
Content-Type: application/json

Request:
  name?: string (2-50 chars)
  bio?: string (max 500 chars)
  gender?: "male" | "female" | "other"
  birthday?: string (ISO date)
  educationStage?: education_stage_t
  avatarUrl?: string (valid URL)

Response 200:
  success: true
  data:
    # Updated user object
```

### 3.3 Delete Current User

```yaml
DELETE /api/v1/me
Authorization: Bearer <token>
Content-Type: application/json

Request:
  password: string (required for verification)
  reason?: string

Response 200:
  success: true
  data:
    message: "Account deleted successfully"

Response 401:
  success: false
  error:
    code: "AUTH_INVALID_CREDENTIALS"
    message: "Invalid password"
```

### 3.4 Get User by ID

```yaml
GET /api/v1/users/:id
Authorization: Bearer <token>

Path Parameters:
  id: string (UUID or custom ID)

Response 200:
  success: true
  data:
    id: string
    customId: string | null
    name: string
    avatarUrl: string | null
    bio: string | null
    # Public profile only (no email, phone, etc.)

Response 404:
  success: false
  error:
    code: "USER_NOT_FOUND"
    message: "User not found"
```

### 3.5 List Users (Admin)

```yaml
GET /api/v1/users
Authorization: Bearer <token>
Required Role: admin

Query Parameters:
  page?: number (default: 1)
  limit?: number (default: 20, max: 100)
  search?: string
  role?: string
  isActive?: boolean
  sortBy?: "createdAt" | "name" | "lastLoginAt" (default: "createdAt")
  sortOrder?: "asc" | "desc" (default: "desc")

Response 200:
  success: true
  data:
    - id: string
      email: string
      name: string
      role: object
      isActive: boolean
      lastLoginAt: string | null
      createdAt: string
  pagination:
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
    hasNext: boolean
    hasPrev: boolean
```

### 3.6 Custom ID Management

```yaml
# Check availability
GET /api/v1/users/custom-id/check
Authorization: Bearer <token>

Query Parameters:
  id: string (3-30 chars, alphanumeric and underscore)

Response 200:
  success: true
  data:
    available: boolean
    suggestions?: string[] (if not available)

---

# Set custom ID
PATCH /api/v1/me/custom-id
Authorization: Bearer <token>
Content-Type: application/json

Request:
  customId: string (3-30 chars)

Response 200:
  success: true
  data:
    customId: string

Response 409:
  success: false
  error:
    code: "CUSTOM_ID_TAKEN"
    message: "This custom ID is already taken"
```

### 3.7 User Preferences

```yaml
# Get preferences
GET /api/v1/me/preferences
Authorization: Bearer <token>

Response 200:
  success: true
  data:
    - typeId: number
      typeName: string
      typeCode: string
      selectedOption:
        id: number
        name: string
        value: string

---

# Update preferences
PUT /api/v1/me/preferences
Authorization: Bearer <token>
Content-Type: application/json

Request:
  preferences:
    - typeId: number
      optionId: number

Response 200:
  success: true
  data:
    message: "Preferences updated successfully"
```

### 3.8 User Profile

```yaml
# Get extended profile
GET /api/v1/me/profile
Authorization: Bearer <token>

Response 200:
  success: true
  data:
    phone: string | null
    website: string | null
    timezone: string | null
    language: string
    linkedinUrl: string | null
    twitterUrl: string | null
    githubUrl: string | null
    location:
      country: string
      city: string

---

# Update extended profile
PATCH /api/v1/me/profile
Authorization: Bearer <token>
Content-Type: application/json

Request:
  phone?: string
  website?: string (valid URL)
  timezone?: string
  language?: string
  linkedinUrl?: string (valid URL)
  twitterUrl?: string (valid URL)
  githubUrl?: string (valid URL)
  locationId?: number

Response 200:
  success: true
  data:
    # Updated profile object
```

---

## 4. Business Rules

### 4.1 Custom ID Rules

| Rule | Description |
|------|-------------|
| Length | 3-30 characters |
| Characters | Alphanumeric and underscore only |
| Case | Case-insensitive (stored lowercase) |
| Reserved | Cannot use reserved words (admin, api, etc.) |
| Change limit | Can change once per 30 days |

### 4.2 Account Deletion Rules

1. **Soft delete**: Data retained for 30 days
2. **Verification**: Password required for deletion
3. **Cascade**: Related data marked as deleted
4. **Recovery**: Account can be recovered within 30 days
5. **Hard delete**: Permanent deletion after 30 days

### 4.3 Privacy Rules

| Data | Public | Followers | Owner |
|------|--------|-----------|-------|
| Name | ✓ | ✓ | ✓ |
| Avatar | ✓ | ✓ | ✓ |
| Bio | ✓ | ✓ | ✓ |
| Email | ✗ | ✗ | ✓ |
| Phone | ✗ | ✗ | ✓ |
| Birthday | ✗ | ✓ | ✓ |
| Stats | ✓ | ✓ | ✓ |

---

## 5. Validation Schemas

### 5.1 Update User Schema

```typescript
const updateUserSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be at most 50 characters')
    .optional(),
  bio: z
    .string()
    .max(500, 'Bio must be at most 500 characters')
    .optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  birthday: z
    .string()
    .refine(
      (val) => !val || !isNaN(Date.parse(val)),
      'Invalid date format'
    )
    .optional(),
  educationStage: z
    .enum([
      'elementary',
      'junior_high',
      'senior_high',
      'undergraduate',
      'master',
      'doctorate',
      'other',
    ])
    .optional(),
  avatarUrl: z.string().url('Invalid URL').optional(),
});
```

### 5.2 Custom ID Schema

```typescript
const customIdSchema = z.object({
  customId: z
    .string()
    .min(3, 'Custom ID must be at least 3 characters')
    .max(30, 'Custom ID must be at most 30 characters')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Custom ID can only contain letters, numbers, and underscores'
    )
    .refine(
      (val) => !RESERVED_WORDS.includes(val.toLowerCase()),
      'This ID is reserved'
    ),
});

const RESERVED_WORDS = [
  'admin',
  'api',
  'auth',
  'login',
  'logout',
  'register',
  'settings',
  'profile',
  'user',
  'users',
  'help',
  'support',
  'about',
  'contact',
];
```

### 5.3 Profile Schema

```typescript
const updateProfileSchema = z.object({
  phone: z
    .string()
    .regex(/^\+?[0-9]{8,15}$/, 'Invalid phone number')
    .optional(),
  website: z.string().url('Invalid URL').optional(),
  timezone: z.string().optional(),
  language: z.enum(['zh-TW', 'zh-CN', 'en']).optional(),
  linkedinUrl: z
    .string()
    .url()
    .refine(
      (val) => !val || val.includes('linkedin.com'),
      'Must be a LinkedIn URL'
    )
    .optional(),
  twitterUrl: z
    .string()
    .url()
    .refine(
      (val) => !val || val.includes('twitter.com') || val.includes('x.com'),
      'Must be a Twitter URL'
    )
    .optional(),
  githubUrl: z
    .string()
    .url()
    .refine(
      (val) => !val || val.includes('github.com'),
      'Must be a GitHub URL'
    )
    .optional(),
  locationId: z.number().int().positive().optional(),
});
```

---

## 6. Service Layer

### 6.1 User Service Interface

```typescript
interface UserService {
  // Core CRUD
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByCustomId(customId: string): Promise<User | null>;
  create(data: CreateUserInput): Promise<User>;
  update(id: string, data: UpdateUserInput): Promise<User>;
  softDelete(id: string): Promise<void>;
  hardDelete(id: string): Promise<void>;
  restore(id: string): Promise<User>;

  // Custom ID
  checkCustomIdAvailability(customId: string): Promise<{
    available: boolean;
    suggestions?: string[];
  }>;
  setCustomId(userId: string, customId: string): Promise<User>;

  // Profile
  getProfile(userId: string): Promise<UserProfile>;
  updateProfile(userId: string, data: UpdateProfileInput): Promise<UserProfile>;

  // Preferences
  getPreferences(userId: string): Promise<UserPreference[]>;
  updatePreferences(userId: string, preferences: PreferenceInput[]): Promise<void>;

  // Stats
  getStats(userId: string): Promise<UserActivityStats>;
  incrementStat(userId: string, stat: StatType, amount?: number): Promise<void>;
}
```

### 6.2 Statistics Update Events

```typescript
// 當用戶執行特定操作時，自動更新統計
const STAT_TRIGGERS = {
  PROJECT_CREATED: 'totalProjects',
  PRACTICE_CREATED: 'totalPractices',
  CHECKIN_COMPLETED: 'totalCheckins',
  RESOURCE_CREATED: 'totalResources',
  IDEA_CREATED: 'totalIdeas',
  COMMENT_CREATED: 'totalComments',
} as const;
```

---

## 7. Implementation Files

### 7.1 Controllers
- `src/controllers/user.controller.ts`
- `src/controllers/me.controller.ts`

### 7.2 Services
- `src/services/user.service.ts`

### 7.3 Routes
- `src/routes/user.routes.ts`
- `src/routes/me.routes.ts`

### 7.4 Validators
- `src/validators/user.validators.ts`
- `src/validators/user-custom-id.validators.ts`

### 7.5 Types
- `src/types/user.types.ts`
- `src/types/me.types.ts`

---

## 8. Error Handling

### 8.1 Error Codes

```typescript
const USER_ERRORS = {
  USER_NOT_FOUND: {
    code: 'USER_NOT_FOUND',
    message: 'User not found',
    status: 404,
  },
  USER_ALREADY_EXISTS: {
    code: 'USER_ALREADY_EXISTS',
    message: 'User with this email already exists',
    status: 409,
  },
  CUSTOM_ID_TAKEN: {
    code: 'CUSTOM_ID_TAKEN',
    message: 'This custom ID is already taken',
    status: 409,
  },
  CUSTOM_ID_CHANGE_LIMIT: {
    code: 'CUSTOM_ID_CHANGE_LIMIT',
    message: 'Custom ID can only be changed once per 30 days',
    status: 400,
  },
  INVALID_PASSWORD: {
    code: 'INVALID_PASSWORD',
    message: 'Invalid password',
    status: 401,
  },
  ACCOUNT_DELETED: {
    code: 'ACCOUNT_DELETED',
    message: 'This account has been deleted',
    status: 410,
  },
} as const;
```

---

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0.0 | 2026-02-05 | System | Initial specification |
