# DaoDao Server

## Overview

DaoDao Server 是一個基於 Node.js 和 Express 的全功能學習平台後端服務，提供完整的學習管理、社群互動、資源分享等功能。專案採用混合 JavaScript/TypeScript 架構，正逐步從 JavaScript 遷移至 TypeScript。

## Tech Stack

### Core
- **Runtime**: Node.js >= 16.14.0
- **Framework**: Express.js ^4.21.2
- **Language**: TypeScript ^5.8.3 (目標 ES2020)
- **Package Manager**: pnpm >= 8.0.0

### Database Layer
- **Primary ORM**: Prisma ^6.16.2 (PostgreSQL)
- **Document DB**: MongoDB (Mongoose ^7.2.3)
- **Cache**: Redis (ioredis ^5.4.1)
- **Task Queue**: BullMQ ^5.67.1

### Authentication
- **JWT**: jsonwebtoken ^9.0.2
- **OAuth**: Passport.js + Google OAuth 2.0
- **Apple Sign In**: apple-signin-auth ^2.0.0

### API & Validation
- **Documentation**: Swagger UI + OpenAPI 3.0
- **Validation**: Zod ^4.1.5
- **Type Generation**: openapi-typescript, @asteasolutions/zod-to-openapi

### Infrastructure
- **File Storage**: Cloudflare R2 (S3-compatible)
- **Email**: Nodemailer
- **Logging**: Winston + Daily Rotate
- **Security**: Helmet, CORS, Rate Limiting
- **Process Manager**: PM2
- **Container**: Docker (Node.js 20 Alpine)

## Architecture

```
daodao-server/
├── src/                    # TypeScript source (active development)
│   ├── controllers/        # HTTP request handlers (22 controllers)
│   ├── services/           # Business logic layer (40+ services)
│   ├── routes/             # API route definitions (23 modules)
│   ├── middleware/         # Auth, validation, rate limiting (11 middlewares)
│   ├── types/              # TypeScript type definitions (26 files)
│   ├── validators/         # Zod validation schemas (22 validators)
│   ├── queues/             # BullMQ task queues
│   ├── config/             # Configuration management
│   ├── constants/          # Application constants
│   ├── utils/              # Utility functions
│   └── swagger/            # OpenAPI schema definitions
├── generated/              # Auto-generated types
│   ├── prisma/             # Prisma Client types
│   └── openapi-types.ts    # OpenAPI types
├── prisma/                 # Prisma ORM configuration
│   └── schema.prisma       # Database schema (50+ models)
├── tests/                  # Test suite
│   ├── unit/               # Unit tests
│   ├── integration/        # Integration tests
│   └── e2e/                # End-to-end tests
├── docs/                   # Project documentation
└── scripts/                # Utility scripts
```

### Path Aliases
- `@/*` → `src/*`
- `@types/*` → `src/types/*`
- `@services/*` → `src/services/*`
- `@generated/*` → `generated/*`

## Core Features

### 1. Authentication & Authorization
- JWT token authentication with refresh mechanism
- Google OAuth 2.0 integration
- Apple Sign In support
- Role-Based Access Control (RBAC)
- Session management with Redis

### 2. Learning Project Management
- Project CRUD with milestones and tasks
- Learning notes and outcomes tracking
- Progress visualization
- Review and reflection system

### 3. Learning Resources
- Resource management with multi-condition filtering
- Resource reviews and ratings
- Tag-based categorization
- Draft/Published/Archived status workflow

### 4. Practice System
- Daily check-in tracking (morning, afternoon, evening, night)
- Streak and habit formation statistics
- Practice events and interactions
- Template system for quick setup
- Auto-completion for expired practices (hourly cron)

### 5. Community & Social
- Idea sharing platform
- Nested comment system
- Learning groups/circles
- Learning marathons with mentor assignment

### 6. Additional Systems
- Quiz and assessment system
- Mentor-mentee matching
- File upload (Cloudflare R2)
- Email notifications (async queue)
- Admin dashboard and analytics

## API Design

### Base URL
All endpoints use `/api/v1/` prefix.

### Response Format
```typescript
// Success
{ success: true, data: T, timestamp: string, meta?: ResponseMeta }

// Error
{ success: false, data: null, error: { code, message, details? }, timestamp }

// Paginated (cursor-based)
{ success: true, data: T[], pagination: { cursors, hasNext, hasPrev }, timestamp }
```

### Core Endpoints
| Endpoint | Description |
|----------|-------------|
| `/api/v1/auth` | Authentication (JWT, OAuth) |
| `/api/v1/users` | User management |
| `/api/v1/me` | Personal profile |
| `/api/v1/projects` | Learning projects |
| `/api/v1/resources` | Learning resources |
| `/api/v1/practices` | Practice system |
| `/api/v1/ideas` | Idea sharing |
| `/api/v1/comments` | Comment system |
| `/api/v1/tags` | Tag management |
| `/api/v1/mentor` | Mentor system |
| `/api/v1/quiz` | Quiz system |
| `/api/v1/admin` | Admin functions |
| `/api/v1/admin/user-stats` | User statistics & analytics |
| `/api/v1/email` | Email service |
| `/api/v1/cities` | City & country data |
| `/api/v1/images` | Image upload & management |
| `/api/v1/monitor` | System monitoring |

### API Documentation
- Interactive: `/api-docs`
- OpenAPI spec: `/openapi.json`

## Development Commands

```bash
# Development
pnpm run dev              # Start dev server with hot reload
pnpm run build            # Compile TypeScript

# Type Checking & Linting
pnpm run typecheck        # TypeScript type check
pnpm run lint             # ESLint check
pnpm run lint:fix         # Auto-fix lint issues

# Database & Types
pnpm run prisma:generate  # Generate Prisma client
pnpm run prisma:studio    # Open Prisma Studio GUI
pnpm run types:generate   # Generate all types

# Testing
pnpm test                 # Run all tests
pnpm test:unit            # Unit tests only
pnpm test:integration     # Integration tests only
pnpm test:coverage        # Generate coverage report

# API Documentation
pnpm run openapi:generate # Generate OpenAPI spec
```

## Conventions

### Code Style
- **No `any` types** - Use `unknown` instead
- **Factory functions** over classes
- **`as const` objects** over enums
- **Zod schemas** for validation and type inference
- **Functional programming** principles
- **JSDoc** for all public functions

### Commit Messages
Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `refactor:` Code refactoring
- `test:` Tests
- `chore:` Maintenance

### Critical Notes
1. Always run `pnpm run prisma:generate` after schema changes
2. Never create custom `AuthRequest` interfaces - use standard Express `Request`
3. Import Prisma types from `../../generated/prisma` (NOT `@prisma/client`)
4. All API responses must follow the standardized format in `src/types/api-response.types.ts`

## Environment Variables

Key configuration (see `.env.dev_temp` for full list):
- `DATABASE_URL` - PostgreSQL connection string
- `MONGODB_URI` - MongoDB connection string
- `REDIS_HOST`, `REDIS_PORT` - Redis configuration
- `JWT_SECRET`, `JWT_EXPIRATION` - JWT configuration
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` - OAuth
- `CLOUDFLARE_R2_*` - File storage
- `FRONTEND_URL` - CORS allowed origin

## Rate Limiting
- Global: 1000 requests/minute
- Strict (emails/images): 60 requests/minute
