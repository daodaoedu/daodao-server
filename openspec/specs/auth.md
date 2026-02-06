# Authentication Module Specification

## 1. Overview

### 1.1 Purpose
認證模組負責處理用戶身份驗證、授權管理、Session 管理及 OAuth 整合，是整個系統的安全基礎。

### 1.2 Scope
- 本地帳號註冊與登入
- JWT Token 管理
- Google OAuth 2.0 整合
- Apple Sign In 整合
- 密碼重置流程
- Email 驗證
- Role-Based Access Control (RBAC)

---

## 2. Authentication Flows

### 2.1 Local Authentication

#### 2.1.1 Registration Flow

```
┌─────────┐    POST /auth/register    ┌─────────┐
│ Client  │ ──────────────────────────▶│ Server  │
└────┬────┘                           └────┬────┘
     │                                     │
     │  Request: {                         │
     │    email, password, name            │
     │  }                                  │
     │                                     ▼
     │                              ┌─────────────┐
     │                              │ Validate    │
     │                              │ Input (Zod) │
     │                              └──────┬──────┘
     │                                     │
     │                                     ▼
     │                              ┌─────────────┐
     │                              │ Check Email │
     │                              │ Exists      │
     │                              └──────┬──────┘
     │                                     │
     │                                     ▼
     │                              ┌─────────────┐
     │                              │ Hash        │
     │                              │ Password    │
     │                              └──────┬──────┘
     │                                     │
     │                                     ▼
     │                              ┌─────────────┐
     │                              │ Create User │
     │                              │ (Prisma)    │
     │                              └──────┬──────┘
     │                                     │
     │                                     ▼
     │                              ┌─────────────┐
     │                              │ Send        │
     │                              │ Verification│
     │                              │ Email       │
     │                              └──────┬──────┘
     │                                     │
     │      Response: {                    │
     │        success: true,               │
     │        data: { user, tokens }       │
     │      }                              │
     │◀────────────────────────────────────┘
```

#### 2.1.2 Login Flow

```
┌─────────┐     POST /auth/login      ┌─────────┐
│ Client  │ ──────────────────────────▶│ Server  │
└────┬────┘                           └────┬────┘
     │                                     │
     │  Request: {                         │
     │    email, password                  │
     │  }                                  │
     │                                     ▼
     │                              ┌─────────────┐
     │                              │ Find User   │
     │                              │ by Email    │
     │                              └──────┬──────┘
     │                                     │
     │                                     ▼
     │                              ┌─────────────┐
     │                              │ Verify      │
     │                              │ Password    │
     │                              └──────┬──────┘
     │                                     │
     │                                     ▼
     │                              ┌─────────────┐
     │                              │ Generate    │
     │                              │ JWT Tokens  │
     │                              └──────┬──────┘
     │                                     │
     │                                     ▼
     │                              ┌─────────────┐
     │                              │ Update      │
     │                              │ Login History│
     │                              └──────┬──────┘
     │                                     │
     │      Response: {                    │
     │        accessToken,                 │
     │        refreshToken,                │
     │        user                         │
     │      }                              │
     │◀────────────────────────────────────┘
```

### 2.2 OAuth Authentication

#### 2.2.1 Google OAuth Flow

```
┌─────────┐                 ┌─────────┐                 ┌─────────┐
│ Client  │                 │ Server  │                 │ Google  │
└────┬────┘                 └────┬────┘                 └────┬────┘
     │                           │                           │
     │  GET /auth/google         │                           │
     │ ─────────────────────────▶│                           │
     │                           │                           │
     │      Redirect to Google   │                           │
     │ ◀─────────────────────────│                           │
     │                           │                           │
     │  User authorizes          │                           │
     │ ─────────────────────────────────────────────────────▶│
     │                           │                           │
     │      Redirect with code   │                           │
     │ ◀─────────────────────────────────────────────────────│
     │                           │                           │
     │  GET /auth/google/callback│                           │
     │ ─────────────────────────▶│                           │
     │                           │  Exchange code for token  │
     │                           │ ─────────────────────────▶│
     │                           │                           │
     │                           │      User profile         │
     │                           │ ◀─────────────────────────│
     │                           │                           │
     │                           │  Find/Create User         │
     │                           │  Generate JWT             │
     │                           │                           │
     │  Redirect with tokens     │                           │
     │ ◀─────────────────────────│                           │
```

### 2.3 Token Refresh Flow

```
┌─────────┐  POST /auth/refresh   ┌─────────┐
│ Client  │ ─────────────────────▶│ Server  │
└────┬────┘                       └────┬────┘
     │                                 │
     │  Request: {                     │
     │    refreshToken                 │
     │  }                              │
     │                                 ▼
     │                          ┌─────────────┐
     │                          │ Verify      │
     │                          │ Refresh     │
     │                          │ Token       │
     │                          └──────┬──────┘
     │                                 │
     │                                 ▼
     │                          ┌─────────────┐
     │                          │ Generate    │
     │                          │ New Tokens  │
     │                          └──────┬──────┘
     │                                 │
     │      Response: {                │
     │        accessToken,             │
     │        refreshToken             │
     │      }                          │
     │◀────────────────────────────────┘
```

---

## 3. API Endpoints

### 3.1 Registration

```yaml
POST /api/v1/auth/register
Content-Type: application/json

Request:
  email: string (required, valid email)
  password: string (required, min 8 chars)
  name: string (required, 2-50 chars)

Response 201:
  success: true
  data:
    user:
      id: string (UUID)
      email: string
      name: string
      createdAt: string (ISO 8601)
    tokens:
      accessToken: string
      refreshToken: string
      expiresIn: number

Response 409:
  success: false
  error:
    code: "USER_ALREADY_EXISTS"
    message: "User with this email already exists"
```

### 3.2 Login

```yaml
POST /api/v1/auth/login
Content-Type: application/json

Request:
  email: string (required)
  password: string (required)

Response 200:
  success: true
  data:
    user:
      id: string
      email: string
      name: string
      role: string
    tokens:
      accessToken: string
      refreshToken: string
      expiresIn: number

Response 401:
  success: false
  error:
    code: "AUTH_INVALID_CREDENTIALS"
    message: "Invalid email or password"
```

### 3.3 Logout

```yaml
POST /api/v1/auth/logout
Authorization: Bearer <accessToken>

Response 200:
  success: true
  data:
    message: "Logged out successfully"
```

### 3.4 Refresh Token

```yaml
POST /api/v1/auth/refresh
Content-Type: application/json

Request:
  refreshToken: string (required)

Response 200:
  success: true
  data:
    accessToken: string
    refreshToken: string
    expiresIn: number

Response 401:
  success: false
  error:
    code: "AUTH_TOKEN_INVALID"
    message: "Invalid or expired refresh token"
```

### 3.5 Password Reset Request

```yaml
POST /api/v1/auth/password/reset-request
Content-Type: application/json

Request:
  email: string (required)

Response 200:
  success: true
  data:
    message: "Password reset email sent"
```

### 3.6 Password Reset

```yaml
POST /api/v1/auth/password/reset
Content-Type: application/json

Request:
  token: string (required)
  password: string (required, min 8 chars)

Response 200:
  success: true
  data:
    message: "Password reset successfully"

Response 400:
  success: false
  error:
    code: "INVALID_TOKEN"
    message: "Invalid or expired reset token"
```

### 3.7 Email Verification

```yaml
POST /api/v1/auth/verify-email
Content-Type: application/json

Request:
  token: string (required)

Response 200:
  success: true
  data:
    message: "Email verified successfully"
```

### 3.8 Google OAuth

```yaml
GET /api/v1/auth/google
Query Parameters:
  redirect_uri: string (optional, default: frontend URL)

Response: Redirect to Google OAuth consent screen

---

GET /api/v1/auth/google/callback
Query Parameters:
  code: string (from Google)
  state: string (CSRF token)

Response: Redirect to frontend with tokens in URL
```

### 3.9 Get Current User

```yaml
GET /api/v1/auth/me
Authorization: Bearer <accessToken>

Response 200:
  success: true
  data:
    id: string
    email: string
    name: string
    role: string
    emailVerified: boolean
    createdAt: string
    lastLoginAt: string
```

---

## 4. Data Models

### 4.1 User Entity (Prisma)

```prisma
model users {
  id                    String    @id @default(uuid())
  email                 String    @unique
  password_hash         String?
  name                  String
  role_id               Int       @default(2)
  email_verified        Boolean   @default(false)
  email_verified_at     DateTime?
  google_id             String?   @unique
  apple_id              String?   @unique
  avatar_url            String?
  last_login_at         DateTime?
  created_at            DateTime  @default(now())
  updated_at            DateTime  @updatedAt
  deleted_at            DateTime?

  // Relations
  role                  roles     @relation(fields: [role_id], references: [id])
  login_history         user_login_history[]
  refresh_tokens        refresh_tokens[]
}
```

### 4.2 Refresh Token Entity

```prisma
model refresh_tokens {
  id          String    @id @default(uuid())
  user_id     String
  token       String    @unique
  expires_at  DateTime
  created_at  DateTime  @default(now())
  revoked_at  DateTime?

  user        users     @relation(fields: [user_id], references: [id])
}
```

### 4.3 Login History Entity

```prisma
model user_login_history {
  id          String    @id @default(uuid())
  user_id     String
  ip_address  String?
  user_agent  String?
  device_info Json?
  login_at    DateTime  @default(now())

  user        users     @relation(fields: [user_id], references: [id])
}
```

---

## 5. Validation Schemas

### 5.1 Registration Schema

```typescript
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/[0-9]/, 'Password must contain number'),
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be at most 50 characters'),
});
```

### 5.2 Login Schema

```typescript
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});
```

### 5.3 Password Reset Schema

```typescript
const passwordResetSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/[0-9]/, 'Password must contain number'),
});
```

---

## 6. JWT Configuration

### 6.1 Token Structure

```typescript
interface UserJwtPayload {
  userId: string;
  email: string;
  role: string;
  type: 'access' | 'refresh';
  iat: number;
  exp: number;
}
```

### 6.2 Token Expiration

| Token Type | Expiration |
|------------|------------|
| Access Token | 24 hours |
| Refresh Token | 7 days |
| Password Reset Token | 1 hour |
| Email Verification Token | 24 hours |

### 6.3 Token Storage

- **Access Token**: Client memory / HTTP-only cookie
- **Refresh Token**: HTTP-only secure cookie + Redis
- **Reset/Verification Tokens**: Redis with TTL

---

## 7. Security Considerations

### 7.1 Password Security
- bcrypt hashing with salt rounds = 12
- Minimum 8 characters
- Must contain uppercase, lowercase, and number
- Password history check (optional)

### 7.2 Rate Limiting

| Endpoint | Limit |
|----------|-------|
| `/auth/login` | 5 attempts / 15 minutes |
| `/auth/register` | 3 attempts / hour |
| `/auth/password/reset-request` | 3 attempts / hour |

### 7.3 Session Management
- Single session per device (optional)
- Session invalidation on password change
- Refresh token rotation

### 7.4 OAuth Security
- CSRF token validation via state parameter
- Redirect URI validation (whitelist)
- Token exchange on server-side only

---

## 8. Error Handling

### 8.1 Error Codes

```typescript
const AUTH_ERRORS = {
  AUTH_INVALID_CREDENTIALS: {
    code: 'AUTH_INVALID_CREDENTIALS',
    message: 'Invalid email or password',
    status: 401,
  },
  AUTH_TOKEN_EXPIRED: {
    code: 'AUTH_TOKEN_EXPIRED',
    message: 'Token has expired',
    status: 401,
  },
  AUTH_TOKEN_INVALID: {
    code: 'AUTH_TOKEN_INVALID',
    message: 'Invalid token',
    status: 401,
  },
  AUTH_UNAUTHORIZED: {
    code: 'AUTH_UNAUTHORIZED',
    message: 'Authentication required',
    status: 401,
  },
  AUTH_EMAIL_NOT_VERIFIED: {
    code: 'AUTH_EMAIL_NOT_VERIFIED',
    message: 'Email not verified',
    status: 403,
  },
  USER_ALREADY_EXISTS: {
    code: 'USER_ALREADY_EXISTS',
    message: 'User with this email already exists',
    status: 409,
  },
} as const;
```

---

## 9. Implementation Files

### 9.1 Controllers
- `src/controllers/auth.controller.ts`

### 9.2 Services
- `src/services/auth/auth.service.ts`
- `src/services/auth/jwt.service.ts`
- `src/services/auth/oauth.service.ts`

### 9.3 Routes
- `src/routes/auth.routes.ts`

### 9.4 Middleware
- `src/middleware/auth.ts`

### 9.5 Validators
- `src/validators/auth.validators.ts`

### 9.6 Types
- `src/types/auth.types.ts`

---

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0.0 | 2026-02-05 | System | Initial specification |
