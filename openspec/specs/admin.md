# Admin Module Specification

## 1. Overview

### 1.1 Purpose
管理員模組提供系統管理功能，包含角色權限管理、用戶管理、內容審核及系統監控等後台功能。

### 1.2 Scope
- 角色管理（CRUD）
- 權限管理（CRUD）
- 用戶角色分配
- 內容審核
- 系統監控與統計

---

## 2. Data Models

### 2.1 Role Entity

```prisma
model roles {
  id              Int       @id @default(autoincrement())
  name            String    @unique
  code            String    @unique
  description     String?

  // Status
  is_system       Boolean   @default(false) // System roles cannot be deleted
  is_active       Boolean   @default(true)

  // Timestamps
  created_at      DateTime  @default(now())
  updated_at      DateTime  @updatedAt

  // Relations
  users           users[]
  permissions     role_permissions[]
}
```

### 2.2 Permission Entity

```prisma
model permissions {
  id              Int       @id @default(autoincrement())
  name            String    @unique
  code            String    @unique
  description     String?

  // Grouping
  group           String?   // e.g., "users", "resources", "admin"

  // Status
  is_active       Boolean   @default(true)

  // Timestamps
  created_at      DateTime  @default(now())
  updated_at      DateTime  @updatedAt

  // Relations
  roles           role_permissions[]
  users           user_permissions[]
}
```

### 2.3 Role Permission Entity

```prisma
model role_permissions {
  id              Int       @id @default(autoincrement())
  role_id         Int
  permission_id   Int

  // Timestamps
  created_at      DateTime  @default(now())

  // Relations
  role            roles       @relation(fields: [role_id], references: [id])
  permission      permissions @relation(fields: [permission_id], references: [id])

  @@unique([role_id, permission_id])
}
```

### 2.4 User Permission Entity

```prisma
model user_permissions {
  id              Int       @id @default(autoincrement())
  user_id         String
  permission_id   Int

  // Override type
  type            permission_override_t @default(grant)

  // Timestamps
  created_at      DateTime  @default(now())
  expires_at      DateTime?

  // Relations
  user            users       @relation(fields: [user_id], references: [id])
  permission      permissions @relation(fields: [permission_id], references: [id])

  @@unique([user_id, permission_id])
}
```

### 2.5 Enums

```prisma
enum permission_override_t {
  grant           // 額外授予權限
  revoke          // 撤銷權限
}
```

### 2.6 Predefined Roles

```typescript
const SYSTEM_ROLES = {
  SUPER_ADMIN: {
    id: 1,
    code: 'super_admin',
    name: 'Super Admin',
    description: 'Full system access',
    isSystem: true,
  },
  ADMIN: {
    id: 2,
    code: 'admin',
    name: 'Admin',
    description: 'Administrative access',
    isSystem: true,
  },
  MODERATOR: {
    id: 3,
    code: 'moderator',
    name: 'Moderator',
    description: 'Content moderation access',
    isSystem: true,
  },
  USER: {
    id: 4,
    code: 'user',
    name: 'User',
    description: 'Standard user access',
    isSystem: true,
  },
} as const;
```

### 2.7 Predefined Permissions

```typescript
const PERMISSIONS = {
  // User management
  'users.read': 'View users',
  'users.create': 'Create users',
  'users.update': 'Update users',
  'users.delete': 'Delete users',
  'users.role.assign': 'Assign roles to users',

  // Resource management
  'resources.read': 'View all resources',
  'resources.moderate': 'Moderate resources',
  'resources.feature': 'Feature resources',
  'resources.delete': 'Delete any resource',

  // Practice management
  'practices.read': 'View all practices',
  'practices.moderate': 'Moderate practices',
  'practices.feature': 'Feature practices',

  // Content moderation
  'content.moderate': 'Moderate user content',
  'content.delete': 'Delete any content',
  'content.flag.review': 'Review flagged content',

  // Comments
  'comments.moderate': 'Moderate comments',
  'comments.delete': 'Delete any comment',
  'comments.pin': 'Pin any comment',

  // Tags
  'tags.create': 'Create tags',
  'tags.update': 'Update tags',
  'tags.delete': 'Delete tags',
  'tags.merge': 'Merge tags',

  // Admin
  'admin.dashboard': 'Access admin dashboard',
  'admin.roles.manage': 'Manage roles',
  'admin.permissions.manage': 'Manage permissions',
  'admin.settings': 'Access system settings',
  'admin.logs': 'View system logs',

  // Marathon
  'marathon.moderate': 'Moderate marathons',
  'marathon.approve': 'Approve marathon applications',
} as const;
```

---

## 3. API Endpoints

### 3.1 Role Management

```yaml
# List Roles
GET /api/v1/admin/roles
Authorization: Bearer <token>
Required Permission: admin.roles.manage

Query Parameters:
  page?: number
  limit?: number
  search?: string
  isActive?: boolean

Response 200:
  success: true
  data:
    - id: number
      name: string
      code: string
      description: string | null
      isSystem: boolean
      isActive: boolean
      usersCount: number
      permissionsCount: number
      createdAt: string
  pagination: ...

---

# Get Role
GET /api/v1/admin/roles/:id
Authorization: Bearer <token>
Required Permission: admin.roles.manage

Response 200:
  success: true
  data:
    id: number
    name: string
    code: string
    description: string | null
    isSystem: boolean
    isActive: boolean
    permissions:
      - id: number
        name: string
        code: string
        group: string | null
    createdAt: string
    updatedAt: string

---

# Create Role
POST /api/v1/admin/roles
Authorization: Bearer <token>
Required Permission: admin.roles.manage

Request:
  name: string (required, unique)
  code: string (required, unique, lowercase)
  description?: string
  permissionIds?: number[]

Response 201:
  success: true
  data:
    id: number
    name: string
    code: string
    description: string | null
    permissions: Permission[]
    createdAt: string

---

# Update Role
PATCH /api/v1/admin/roles/:id
Authorization: Bearer <token>
Required Permission: admin.roles.manage

Request:
  name?: string
  description?: string
  isActive?: boolean
  permissionIds?: number[] (replaces all permissions)

Response 200:
  success: true
  data:
    # Updated role

Response 403:
  success: false
  error:
    code: "CANNOT_MODIFY_SYSTEM_ROLE"
    message: "System roles cannot be modified"

---

# Delete Role
DELETE /api/v1/admin/roles/:id
Authorization: Bearer <token>
Required Permission: admin.roles.manage

Response 200:
  success: true
  data:
    message: "Role deleted successfully"

Response 400:
  success: false
  error:
    code: "ROLE_IN_USE"
    message: "Cannot delete role with assigned users"

---

# Add Permissions to Role
POST /api/v1/admin/roles/:roleId/permissions
Authorization: Bearer <token>
Required Permission: admin.roles.manage

Request:
  permissionIds: number[]

Response 200:
  success: true
  data:
    added: number[]
    existing: number[]

---

# Remove Permissions from Role
DELETE /api/v1/admin/roles/:roleId/permissions
Authorization: Bearer <token>
Required Permission: admin.roles.manage

Request:
  permissionIds: number[]

Response 200:
  success: true
  data:
    removed: number[]
```

### 3.2 Permission Management

```yaml
# List Permissions
GET /api/v1/admin/permissions
Authorization: Bearer <token>
Required Permission: admin.permissions.manage

Query Parameters:
  group?: string
  search?: string
  page?: number
  limit?: number

Response 200:
  success: true
  data:
    - id: number
      name: string
      code: string
      description: string | null
      group: string | null
      isActive: boolean
      rolesCount: number
  pagination: ...

---

# Get Permission
GET /api/v1/admin/permissions/:id
Authorization: Bearer <token>
Required Permission: admin.permissions.manage

Response 200:
  success: true
  data:
    id: number
    name: string
    code: string
    description: string | null
    group: string | null
    isActive: boolean
    roles:
      - id: number
        name: string
        code: string

---

# Create Permission
POST /api/v1/admin/permissions
Authorization: Bearer <token>
Required Permission: admin.permissions.manage

Request:
  name: string (required)
  code: string (required, unique)
  description?: string
  group?: string

Response 201:
  success: true
  data:
    id: number
    name: string
    code: string
    description: string | null
    group: string | null

---

# Update Permission
PATCH /api/v1/admin/permissions/:id
Authorization: Bearer <token>
Required Permission: admin.permissions.manage

Request:
  name?: string
  description?: string
  group?: string
  isActive?: boolean

Response 200:
  success: true
  data:
    # Updated permission

---

# Delete Permission
DELETE /api/v1/admin/permissions/:id
Authorization: Bearer <token>
Required Permission: admin.permissions.manage

Response 200:
  success: true
  data:
    message: "Permission deleted successfully"
```

### 3.3 User Role Management

```yaml
# Assign Role to User
POST /api/v1/admin/users/:userId/role
Authorization: Bearer <token>
Required Permission: users.role.assign

Request:
  roleId: number

Response 200:
  success: true
  data:
    userId: string
    role:
      id: number
      name: string
      code: string

---

# Get User Permissions
GET /api/v1/admin/users/:userId/permissions
Authorization: Bearer <token>
Required Permission: users.read

Response 200:
  success: true
  data:
    role:
      id: number
      name: string
      permissions: Permission[]
    directPermissions:
      - permission: Permission
        type: "grant" | "revoke"
        expiresAt: string | null
    effectivePermissions: string[] # All permission codes

---

# Grant User Permission
POST /api/v1/admin/users/:userId/permissions
Authorization: Bearer <token>
Required Permission: admin.permissions.manage

Request:
  permissionId: number
  type?: "grant" | "revoke" (default: "grant")
  expiresAt?: string (ISO date)

Response 200:
  success: true
  data:
    userId: string
    permission: Permission
    type: string
    expiresAt: string | null

---

# Revoke User Permission
DELETE /api/v1/admin/users/:userId/permissions/:permissionId
Authorization: Bearer <token>
Required Permission: admin.permissions.manage

Response 200:
  success: true
  data:
    message: "Permission removed successfully"
```

### 3.4 User Management (Admin)

```yaml
# List Users (Admin)
GET /api/v1/admin/users
Authorization: Bearer <token>
Required Permission: users.read

Query Parameters:
  page?: number
  limit?: number
  search?: string (email, name)
  roleId?: number
  isActive?: boolean
  emailVerified?: boolean
  sortBy?: "createdAt" | "lastLoginAt" | "name"
  sortOrder?: "asc" | "desc"

Response 200:
  success: true
  data:
    - id: string
      email: string
      name: string
      avatarUrl: string | null
      role:
        id: number
        name: string
      isActive: boolean
      emailVerified: boolean
      lastLoginAt: string | null
      createdAt: string
  pagination: ...

---

# Get User Detail (Admin)
GET /api/v1/admin/users/:id
Authorization: Bearer <token>
Required Permission: users.read

Response 200:
  success: true
  data:
    id: string
    email: string
    name: string
    avatarUrl: string | null
    bio: string | null
    role: object
    isActive: boolean
    emailVerified: boolean
    lastLoginAt: string | null
    stats:
      projectsCount: number
      practicesCount: number
      resourcesCount: number
      ideasCount: number
      commentsCount: number
    loginHistory:
      - ipAddress: string
        userAgent: string
        loginAt: string
    createdAt: string
    updatedAt: string

---

# Update User (Admin)
PATCH /api/v1/admin/users/:id
Authorization: Bearer <token>
Required Permission: users.update

Request:
  name?: string
  isActive?: boolean
  emailVerified?: boolean

Response 200:
  success: true
  data:
    # Updated user

---

# Delete User (Admin)
DELETE /api/v1/admin/users/:id
Authorization: Bearer <token>
Required Permission: users.delete

Query Parameters:
  hard?: boolean (default: false)

Response 200:
  success: true
  data:
    message: "User deleted successfully"
```

### 3.5 Content Moderation

```yaml
# List Flagged Content
GET /api/v1/admin/moderation/flagged
Authorization: Bearer <token>
Required Permission: content.flag.review

Query Parameters:
  entityType?: entity_type_t
  status?: "pending" | "reviewed" | "dismissed"
  page?: number
  limit?: number

Response 200:
  success: true
  data:
    - id: string
      entityType: string
      entityId: string
      entity:
        # Entity preview
      reportCount: number
      reports:
        - reason: string
          reportedBy: object
          reportedAt: string
      status: string
      createdAt: string
  pagination: ...

---

# Review Flagged Content
PATCH /api/v1/admin/moderation/flagged/:id
Authorization: Bearer <token>
Required Permission: content.flag.review

Request:
  action: "approve" | "remove" | "dismiss"
  notes?: string

Response 200:
  success: true
  data:
    id: string
    status: string
    action: string
    reviewedAt: string
    reviewedBy: object

---

# Bulk Moderate Content
POST /api/v1/admin/moderation/bulk
Authorization: Bearer <token>
Required Permission: content.moderate

Request:
  ids: string[]
  action: "approve" | "remove" | "dismiss"
  notes?: string

Response 200:
  success: true
  data:
    processed: number
    failed: number
    results:
      - id: string
        action: string
        error: string | null
```

### 3.6 System Dashboard & Statistics

```yaml
# Get Dashboard Overview
GET /api/v1/admin/dashboard
Authorization: Bearer <token>
Required Permission: admin.dashboard

Response 200:
  success: true
  data:
    users:
      total: number
      newToday: number
      newThisWeek: number
      newThisMonth: number
      activeToday: number
    content:
      totalProjects: number
      totalPractices: number
      totalResources: number
      totalIdeas: number
      totalComments: number
    engagement:
      totalLikes: number
      totalCheckins: number
      averageSessionDuration: number
    moderation:
      pendingFlags: number
      reviewedToday: number

---

# Get System Statistics
GET /api/v1/admin/statistics
Authorization: Bearer <token>
Required Permission: admin.dashboard

Query Parameters:
  startDate?: string
  endDate?: string
  groupBy?: "day" | "week" | "month"

Response 200:
  success: true
  data:
    userGrowth:
      - date: string
        newUsers: number
        totalUsers: number
    contentGrowth:
      - date: string
        projects: number
        practices: number
        resources: number
        ideas: number
    engagement:
      - date: string
        checkins: number
        comments: number
        likes: number
    topUsers:
      - id: string
        name: string
        projectsCount: number
        practicesCount: number
    topResources:
      - id: string
        title: string
        viewsCount: number
        likesCount: number

---

# Get System Health
GET /api/v1/admin/health
Authorization: Bearer <token>
Required Permission: admin.dashboard

Response 200:
  success: true
  data:
    status: "healthy" | "degraded" | "unhealthy"
    services:
      database:
        status: string
        latency: number
      redis:
        status: string
        latency: number
      r2:
        status: string
    queues:
      practiceEmail:
        waiting: number
        active: number
        failed: number
      practiceStatus:
        waiting: number
        active: number
        failed: number
    uptime: number
    memory:
      used: number
      total: number
      percentage: number
```

---

## 4. Business Rules

### 4.1 Permission Hierarchy

```
Super Admin
    └── All permissions (cannot be restricted)

Admin
    └── Most permissions except:
        - admin.permissions.manage (limited)
        - Cannot modify Super Admin

Moderator
    └── Content moderation permissions:
        - content.moderate
        - content.flag.review
        - comments.moderate
        - resources.moderate
        - practices.moderate

User
    └── Basic permissions:
        - Own content CRUD
        - Public content read
```

### 4.2 Role Assignment Rules

| Rule | Description |
|------|-------------|
| Self-demotion | 禁止降低自己的角色權限 |
| Super Admin | 只有 Super Admin 可以指派 Super Admin |
| System roles | 系統角色不可刪除 |
| Single role | 每個用戶只能有一個角色 |

### 4.3 Permission Override Rules

| Rule | Description |
|------|-------------|
| Priority | User permission > Role permission |
| Revoke | Revoke 覆蓋 grant |
| Expiration | 過期權限自動失效 |
| Cleanup | 定期清理過期權限記錄 |

### 4.4 Content Moderation Rules

| Rule | Description |
|------|-------------|
| Auto-flag | 多次被舉報自動標記審核 |
| Remove threshold | 超過 5 次舉報可直接移除 |
| Appeal | 移除後 7 天內可申訴 |
| Ban escalation | 多次違規升級為帳號停權 |

---

## 5. Validation Schemas

### 5.1 Role Schema

```typescript
const createRoleSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be at most 50 characters'),
  code: z
    .string()
    .min(2, 'Code must be at least 2 characters')
    .max(30, 'Code must be at most 30 characters')
    .regex(/^[a-z][a-z0-9_]*$/, 'Code must be lowercase with underscores'),
  description: z
    .string()
    .max(500, 'Description must be at most 500 characters')
    .optional(),
  permissionIds: z.array(z.number().int().positive()).optional(),
});
```

### 5.2 Permission Schema

```typescript
const createPermissionSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
  code: z
    .string()
    .min(2, 'Code must be at least 2 characters')
    .max(50, 'Code must be at most 50 characters')
    .regex(
      /^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)*$/,
      'Code must be dot-separated lowercase'
    ),
  description: z
    .string()
    .max(500, 'Description must be at most 500 characters')
    .optional(),
  group: z.string().max(50).optional(),
});
```

---

## 6. Implementation Files

### 6.1 Controllers
- `src/controllers/admin.controller.ts`

### 6.2 Services
- `src/services/admin/admin.service.ts`
- `src/services/admin/role.service.ts`
- `src/services/admin/permission.service.ts`

### 6.3 Routes
- `src/routes/admin.routes.ts`

### 6.4 Middleware
- `src/middleware/permission.middleware.ts`

### 6.5 Types
- `src/types/admin.types.ts`

### 6.6 Constants
- `src/constants/roles.ts`
- `src/constants/permissions.ts`

---

## 7. Error Handling

### 7.1 Error Codes

```typescript
const ADMIN_ERRORS = {
  ROLE_NOT_FOUND: {
    code: 'ROLE_NOT_FOUND',
    message: 'Role not found',
    status: 404,
  },
  ROLE_ALREADY_EXISTS: {
    code: 'ROLE_ALREADY_EXISTS',
    message: 'A role with this code already exists',
    status: 409,
  },
  ROLE_IN_USE: {
    code: 'ROLE_IN_USE',
    message: 'Cannot delete role with assigned users',
    status: 400,
  },
  CANNOT_MODIFY_SYSTEM_ROLE: {
    code: 'CANNOT_MODIFY_SYSTEM_ROLE',
    message: 'System roles cannot be modified',
    status: 403,
  },
  PERMISSION_NOT_FOUND: {
    code: 'PERMISSION_NOT_FOUND',
    message: 'Permission not found',
    status: 404,
  },
  PERMISSION_DENIED: {
    code: 'PERMISSION_DENIED',
    message: 'You do not have permission to perform this action',
    status: 403,
  },
  CANNOT_MODIFY_OWN_ROLE: {
    code: 'CANNOT_MODIFY_OWN_ROLE',
    message: 'Cannot modify your own role',
    status: 403,
  },
  CANNOT_DEMOTE_SUPER_ADMIN: {
    code: 'CANNOT_DEMOTE_SUPER_ADMIN',
    message: 'Cannot demote a super admin',
    status: 403,
  },
} as const;
```

---

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0.0 | 2026-02-05 | System | Initial specification |
