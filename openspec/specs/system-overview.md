# System Overview Specification

## 1. Introduction

### 1.1 Purpose
DaoDao Server 是一個全功能學習平台後端服務，旨在幫助用戶管理學習專案、追蹤學習進度、分享學習資源，並透過社群互動促進學習成效。

### 1.2 Scope
本規格文件涵蓋 DaoDao Server 的整體系統架構、技術選型、核心功能模組及 API 設計規範。

### 1.3 Target Audience
- 後端開發人員
- 前端開發人員（API 消費者）
- 系統架構師
- 品質保證工程師

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                            │
│         (Web App, Mobile App, Third-party Integrations)         │
└─────────────────────────────┬───────────────────────────────────┘
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API Gateway                              │
│           (Rate Limiting, CORS, Security Headers)               │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Express.js Application                      │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Middleware  │  │   Routes     │  │     Controllers      │  │
│  │  (Auth, Val) │─▶│  (23 modules)│─▶│   (22 controllers)   │  │
│  └──────────────┘  └──────────────┘  └──────────┬───────────┘  │
│                                                  │              │
│                                                  ▼              │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                    Service Layer                          │ │
│  │                   (40+ services)                          │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────┬───────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│  PostgreSQL   │    │   MongoDB     │    │    Redis      │
│  (Prisma ORM) │    │  (Mongoose)   │    │  (ioredis)    │
│  Primary DB   │    │  Document DB  │    │ Cache/Session │
└───────────────┘    └───────────────┘    └───────────────┘
                              │
                              ▼
                    ┌───────────────┐
                    │  Cloudflare   │
                    │      R2       │
                    │ File Storage  │
                    └───────────────┘
```

### 2.2 Technology Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| Runtime | Node.js | >= 16.14.0 | JavaScript runtime |
| Framework | Express.js | ^4.21.2 | Web framework |
| Language | TypeScript | ^5.8.3 | Type-safe development |
| Primary DB | PostgreSQL | 14+ | Relational data storage |
| ORM | Prisma | ^6.16.2 | Database access layer |
| Document DB | MongoDB | 6.0+ | Document storage |
| ODM | Mongoose | ^7.2.3 | MongoDB object modeling |
| Cache | Redis | 7.0+ | Caching and sessions |
| Queue | BullMQ | ^5.67.1 | Background job processing |
| Validation | Zod | ^4.1.5 | Runtime validation |
| Auth | JWT + Passport | - | Authentication |
| File Storage | Cloudflare R2 | - | S3-compatible storage |

### 2.3 Directory Structure

```
daodao-server/
├── src/                      # TypeScript 源碼（主要開發目錄）
│   ├── controllers/          # HTTP 請求處理器
│   ├── services/             # 業務邏輯層
│   ├── routes/               # API 路由定義
│   ├── middleware/           # 中間件
│   ├── types/                # TypeScript 類型定義
│   ├── validators/           # Zod 驗證 schema
│   ├── queues/               # BullMQ 任務佇列
│   ├── config/               # 配置管理
│   ├── constants/            # 常數定義
│   ├── utils/                # 工具函數
│   └── swagger/              # OpenAPI schema
├── generated/                # 自動生成的類型
│   ├── prisma/               # Prisma Client 類型
│   └── openapi-types.ts      # OpenAPI 類型
├── prisma/                   # Prisma 配置
│   └── schema.prisma         # 資料庫 schema
├── tests/                    # 測試套件
│   ├── unit/                 # 單元測試
│   ├── integration/          # 整合測試
│   └── e2e/                  # 端對端測試
└── docs/                     # 專案文件
```

---

## 3. Core Modules

### 3.1 Module Overview

| Module | Description | Priority |
|--------|-------------|----------|
| Authentication | JWT/OAuth 認證授權系統 | Critical |
| Users | 用戶管理與個人資料 | Critical |
| Projects | 學習專案管理 | High |
| Resources | 學習資源管理與分享 | High |
| Practices | 每日實踐與打卡系統 | High |
| Community | 想法分享、評論、群組 | Medium |
| Tags | 標籤管理系統 | Medium |
| Mentor | 導師系統與馬拉松活動 | Medium |
| Admin | 管理員後台功能 | Medium |
| Email | 郵件發送與模板系統 | Medium |
| Statistics | 用戶統計與數據分析 | Medium |
| Quiz | 學習風格測驗 | Low |
| Location | 城市與國家資料 | Low |

### 3.2 Module Dependencies

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                    Authentication Module                     │
│                    (所有模組的基礎依賴)                       │
│                                                              │
└──────────────┬──────────────────────────────────┬────────────┘
               │                                  │
               ▼                                  ▼
┌──────────────────────┐              ┌──────────────────────┐
│    Users Module      │              │    Admin Module      │
│  (用戶基礎資料管理)   │              │   (系統管理功能)     │
└──────────┬───────────┘              └──────────────────────┘
           │
           ├─────────────────────────────────────┐
           │                                     │
           ▼                                     ▼
┌──────────────────────┐              ┌──────────────────────┐
│   Projects Module    │              │  Resources Module    │
│   (學習專案管理)      │              │   (學習資源管理)     │
└──────────┬───────────┘              └──────────┬───────────┘
           │                                     │
           ▼                                     │
┌──────────────────────┐                         │
│  Practices Module    │◀────────────────────────┘
│   (每日實踐打卡)      │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐              ┌──────────────────────┐
│  Community Module    │◀─────────────│    Tags Module       │
│  (社群互動功能)       │              │   (標籤管理系統)     │
└──────────────────────┘              └──────────────────────┘
           │
           ▼
┌──────────────────────┐
│   Mentor Module      │
│  (導師與馬拉松系統)   │
└──────────────────────┘
```

---

## 4. API Design Standards

### 4.1 Base URL
```
/api/v1/
```

### 4.2 Response Format

#### Success Response
```typescript
interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  timestamp: string;
  meta?: {
    searchQuery?: string;
    processingTime?: number;
    requestId?: string;
  };
}
```

#### Error Response
```typescript
interface ApiErrorResponse {
  success: false;
  data: null;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  timestamp: string;
}
```

#### Paginated Response (Offset-based)
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
}
```

#### Cursor-based Pagination Response
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
    nextCursor?: string;
    prevCursor?: string;
  };
  timestamp: string;
}
```

### 4.3 HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | 成功請求 |
| 201 | 資源創建成功 |
| 204 | 刪除成功（無回應內容） |
| 400 | 請求參數錯誤 |
| 401 | 未認證 |
| 403 | 權限不足 |
| 404 | 資源不存在 |
| 409 | 資源衝突 |
| 422 | 驗證失敗 |
| 429 | 請求過於頻繁 |
| 500 | 伺服器內部錯誤 |

### 4.4 Error Codes

```typescript
const ERROR_CODES = {
  // Authentication
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',

  // Validation
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INVALID_INPUT: 'INVALID_INPUT',

  // Resource
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',

  // Permission
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  FORBIDDEN: 'FORBIDDEN',

  // Server
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;
```

---

## 5. Security

### 5.1 Authentication
- JWT Token 認證（Access Token + Refresh Token）
- Google OAuth 2.0
- Apple Sign In
- Session 管理（Redis 儲存）

### 5.2 Authorization
- Role-Based Access Control (RBAC)
- 資源級別權限檢查
- API 端點權限中間件

### 5.3 Rate Limiting

| Tier | Limit | Applies To |
|------|-------|------------|
| Global | 1000 req/min | 所有端點 |
| Strict | 60 req/min | 郵件、圖片上傳 |

### 5.4 Security Headers
- Helmet.js 安全頭配置
- CORS 跨域配置
- XSS 防護
- CSRF 保護

---

## 6. Data Layer

### 6.1 PostgreSQL (Primary)
- **用途**: 關聯式資料儲存
- **ORM**: Prisma
- **模型數量**: 50+ 個
- **關鍵實體**: users, projects, resources, practices

### 6.2 MongoDB (Document)
- **用途**: 非結構化文件儲存
- **ODM**: Mongoose
- **用例**: 日誌、分析數據

### 6.3 Redis (Cache)
- **用途**: 快取、Session、任務佇列
- **客戶端**: ioredis
- **佇列**: BullMQ

---

## 7. External Integrations

### 7.1 Cloudflare R2
- **用途**: 檔案儲存
- **協議**: S3-compatible API
- **支援**: 單檔/批量上傳、刪除

### 7.2 Email Service
- **用途**: 郵件通知
- **方式**: SMTP (Nodemailer)
- **佇列**: BullMQ 異步發送

### 7.3 OAuth Providers
- Google OAuth 2.0
- Apple Sign In

---

## 8. Development Standards

### 8.1 Code Conventions

| Rule | Description |
|------|-------------|
| No `any` | 使用 `unknown` 替代 |
| Factory Functions | 避免使用 class |
| `as const` | 替代 enum |
| Zod | 驗證和類型推導 |
| JSDoc | 所有公開函數必須註釋 |
| Functional | 遵循函數式編程原則 |

### 8.2 Commit Messages
遵循 [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: 新功能
fix: 錯誤修復
docs: 文件更新
refactor: 程式碼重構
test: 測試相關
chore: 維護工作
```

### 8.3 Critical Notes

1. **Prisma 類型生成**: Schema 變更後必須執行 `pnpm run prisma:generate`
2. **Request 類型**: 使用標準 Express `Request`，不要自訂 `AuthRequest`
3. **Prisma 導入**: 從 `../../generated/prisma` 導入，不是 `@prisma/client`
4. **API 回應格式**: 必須遵循標準化格式

---

## 9. Testing Strategy

### 9.1 Test Levels

| Level | Location | Purpose |
|-------|----------|---------|
| Unit | `tests/unit/` | 服務層、工具函數測試 |
| Integration | `tests/integration/` | API 端點、資料庫整合測試 |
| E2E | `tests/e2e/` | 完整用戶流程測試 |

### 9.2 Test Commands

```bash
pnpm test                 # 執行所有測試
pnpm test -- unit/        # 單元測試
pnpm test -- integration/ # 整合測試
pnpm test:coverage        # 覆蓋率報告
```

---

## 10. Deployment

### 10.1 Environment
- **Container**: Docker (Node.js 20 Alpine)
- **Process Manager**: PM2
- **CI/CD**: GitHub Actions

### 10.2 Environment Variables

```bash
# Database
DATABASE_URL=postgresql://...
MONGODB_URI=mongodb://...
REDIS_HOST=...
REDIS_PORT=6379

# Auth
JWT_SECRET=...
JWT_EXPIRATION=24h
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Services
CLOUDFLARE_R2_BUCKET_NAME=...
CLOUDFLARE_R2_ACCESS_KEY_ID=...
FRONTEND_URL=https://...
```

---

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.1.0 | 2026-02-06 | System | Added Email, Statistics, Quiz, Location modules |
| 1.0.0 | 2026-02-05 | System | Initial specification |
