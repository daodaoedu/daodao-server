# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Package Management
- `pnpm install` - Install all dependencies
- `pnpm add <package>` - Add production dependency
- `pnpm add -D <package>` - Add development dependency
- `pnpm remove <package>` - Remove dependency
- `pnpm list` - View dependency tree
- `pnpm outdated` - Check outdated dependencies

### Core Commands
- `pnpm start` - Start production server
- `pnpm run dev` - Start development server with nodemon
- `pnpm test` - Run Jest tests with custom config
- `pnpm run test:paths` - Run tests with NODE_PATH=src for path resolution

### TypeScript Commands
- `pnpm run typecheck` - Run TypeScript type checking without emitting files
- `pnpm run lint` - Run ESLint to check code quality and TypeScript issues
- `pnpm run lint:fix` - Run ESLint and automatically fix issues
- `pnpm run build` - Compile TypeScript and generate dist/ directory
- `pnpm run prisma:generate` - Generate Prisma client types at generated/prisma
- `pnpm run types:generate` - Generate both Prisma and OpenAPI types
- `tsc --noEmit` - Type checking without emitting files (direct command)
- `ts-node src/index.ts` - Run TypeScript files directly

## Architecture Overview

This is a Node.js backend server for the DaoDao learning platform with a **hybrid JavaScript/TypeScript architecture**:

### Technology Stack
- **Runtime**: Node.js with Express.js
- **Databases**: PostgreSQL (Prisma ORM), MongoDB (Mongoose), Redis (ioredis)
- **Authentication**: JWT, Passport.js with Google OAuth
- **File Storage**: Cloudflare R2, Multer for uploads
- **Testing**: Jest with TypeScript support
- **Documentation**: Swagger/OpenAPI
- **Type Generation**: Prisma client, OpenAPI types

### Project Structure
The codebase uses a **dual architecture approach**:

#### Legacy JavaScript Structure (root level)
```
controllers/     # Business logic controllers
models/         # Legacy Sequelize models (being migrated to Prisma)  
routes/         # Express route definitions
services/       # Database services (mongo, postgres, redis)
middlewares/    # Authentication and validation middleware
utils/          # Utility functions
```

#### Modern TypeScript Structure (src/ directory)
```
src/
├── controllers/    # TypeScript controllers
├── models/        # TypeScript models with Prisma integration
├── routes/        # TypeScript route definitions
├── services/      # Business logic services
├── types/         # TypeScript type definitions
├── validators/    # Zod validation schemas
├── middleware/    # TypeScript middleware
├── utils/         # TypeScript utilities
└── swagger/       # API documentation schemas
```

### Key Integration Points
- `index.js` - Main entry point that loads both JS and TS routes
- `src/app.ts` - TypeScript route setup and Swagger integration
- `src/utils/modelBridge.ts` - Bridges JavaScript and TypeScript models
- `src/types/express.d.ts` - Express Request interface augmentation for auth
- `generated/prisma/` - Auto-generated Prisma client types
- Path aliases: `@/*` maps to `src/*`, `@types/*` to `src/types/*`, `@services/*` to `src/services/*`

### Database Architecture
- **PostgreSQL**: Primary database for structured data (users, projects, marathons)
- **MongoDB**: Document storage for flexible data structures
- **Redis**: Caching and session management

### API Documentation
- Swagger UI available at `/api-docs` and `/api/docs`
- TypeScript-first API development with comprehensive Swagger annotations
- Standardized response format with success/error states

### API Response Format

All API endpoints follow a standardized response format defined in `src/types/api-response.types.ts`:

#### Success Response Format
```typescript
interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  timestamp: string;
  meta?: ResponseMeta;  // Optional metadata
}
```

#### Error Response Format
```typescript
interface ApiErrorResponse {
  success: false;
  data: null;
  error: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
  timestamp: string;
  meta?: ResponseMeta;
}
```

#### Paginated Response Format
```typescript
// Page-based pagination
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
  meta?: ResponseMeta;
}

// Cursor-based pagination
interface CursorPaginatedApiResponse<T> {
  success: true;
  data: T[];
  pagination: {
    cursors: { 
      start: string | null; 
      end: string | null; 
    };
    hasMore: boolean;
    count: number;
  };
  timestamp: string;
  meta?: ResponseMeta;
}
```

#### Response Metadata (Optional)
```typescript
interface ResponseMeta {
  // Search related
  searchQuery?: string;
  searchTime?: number;
  filters?: Record<string, unknown>;
  
  // Statistics info
  categoryCounts?: Record<string, number>;
  aggregateData?: Record<string, unknown>;
  
  // System info
  requestId?: string;
  cacheHit?: boolean;
  processingTime?: number;
  
  // Extension fields
  [key: string]: unknown;
}
```

#### Response Examples

**Simple Success Response:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "_id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Error Response:**
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "用戶不存在",
    "details": {
      "userId": "123"
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Paginated Response:**
```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "User 1" },
    { "id": 2, "name": "User 2" }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "itemsPerPage": 10,
    "hasNext": true,
    "hasPrev": false
  },
  "timestamp": "2024-01-15T10:30:00.000Z",
  "meta": {
    "searchTime": 45,
    "cacheHit": false
  }
}
```

#### TypeScript Usage
```typescript
import { ApiResponse, PaginatedResponse, ApiSuccessResponse } from '@types/api-response.types';

// For single item responses
type UserResponse = ApiResponse<UserData>;

// For paginated responses
type UsersListResponse = PaginatedResponse<UserData>;

// For success-only responses
type CreateUserResponse = ApiSuccessResponse<{ id: number; _id: string }>;
```

### Development Guidelines

#### TypeScript Migration Strategy
The project is actively migrating from JavaScript to TypeScript:
1. **Phase 1**: Core services (auth, database connections)
2. **Phase 2**: Business logic (resources, reviews, tags)
3. **Phase 3**: Legacy features (email, images, monitoring)

#### Code Patterns
- Use **factory functions and object literals** instead of classes
- Prefer **const objects with `as const`** over enums
- Use **Zod schemas** for validation and type inference
- Follow **functional programming principles** where possible
- Express Request interface is augmented in `src/types/express.d.ts` - use standard `Request` type, not custom `AuthRequest`

#### Testing
- Jest configuration in `config/jest.config.js`
- TypeScript test support via ts-jest
- Test files use `.test.ts` or `.test.js` extensions
- Mock external dependencies appropriately

#### Error Handling
- Standardized error response format
- Use factory functions for error creation
- Async wrapper functions for route handlers

### Environment Configuration
Key environment variables:
- Database: `POSTGRES_*`, `MONGODB_URI`, `REDIS_*`
- Authentication: `JWT_SECRET`, `SESSION_SECRET`, `GOOGLE_CLIENT_*`
- Services: `CLOUDFLARE_R2_*`, `EMAIL_*`, `FRONTEND_URL`

### Rate Limiting
- Global limiter: 1000 requests/minute
- Strict limiter: 60 requests/minute (applied to emails/images)

## CI/CD 和 Docker 構建策略

### Docker 構建最佳實踐
- **分層策略**: Dockerfile 針對類型變更進行了優化，確保類型檔案變更時觸發正確的重建
- **智慧快取**: CI/CD 自動檢測類型變更，只在必要時禁用快取
- **構建驗證**: 每次構建後自動驗證 Docker 映像和健康檢查

### 類型變更處理
當修改 TypeScript 類型檔案（`src/types/*.ts`、`*.d.ts`、`tsconfig*.json`）時：
1. **Dockerfile 分層**: 類型檔案被單獨複製，確保變更觸發正確重建
2. **自動檢測**: CI/CD 自動檢測類型變更並禁用快取
3. **快取策略**: 非類型變更時使用多層快取提升構建速度

### 緊急修復流程
如果遇到快取相關的構建問題：
1. **手動觸發**: 使用 "Emergency Rebuild" workflow
2. **完全重建**: 清除所有快取，強制重新構建
3. **分支選擇**: 支援 main 和 dev 分支
4. **驗證機制**: 包含完整的構建驗證和通知

### 構建監控
- **快取效率**: 自動記錄快取使用情況
- **映像大小**: 監控映像大小，超過 1GB 時發出警告
- **構建時間**: 追蹤構建性能
- **Discord 通知**: 構建狀態實時通知團隊

### Important File Patterns
- TypeScript models use Prisma-generated types and client from `generated/prisma`
- Routes use comprehensive Swagger documentation
- Validators use Zod with TypeScript inference
- Services follow dependency injection patterns
- Authentication middleware populates `req.user` with `UserJwtPayload` type
- PM2 serves compiled TypeScript from `dist/src/server.js`

## Critical Development Notes

### Prisma Integration
- **ALWAYS run `npm run prisma:generate` after schema changes** - Required for TypeScript compilation
- Prisma client types are located at `generated/prisma` (NOT `node_modules/@prisma/client`)
- Docker builds include automatic Prisma generation step
- Import Prisma types with: `import { users, resources } from '../../generated/prisma'`

### Authentication & Request Types
- Express Request interface is augmented with `user?: UserJwtPayload` property
- **Never create custom `AuthRequest` interfaces** - use standard Express `Request` type
- Authentication middleware automatically populates `req.user` with proper typing
- User authentication state accessible via `req.user` in all controllers and middleware

### TypeScript Compilation
- Production build process: `npm run build` → `dist/` directory → PM2 serves `dist/src/server.js`
- Always run type checking before deployment: `npm run typecheck`
- TypeScript errors will prevent Docker builds from completing

### Code Patterns (from Cursor rules)
- **Strictly avoid `any` types** - use `unknown` instead
- Use factory functions and object literals instead of classes
- Prefer `const objects with as const` over enums  
- Follow functional programming principles
- Use Zod schemas for validation and type inference
- Write JSDoc for all functions, methods, and types

### Development Workflow
- Use `npm run dev` for development with auto-reload
- Test TypeScript changes with `npm run typecheck` before committing
- Run `npm run lint` to check code quality
- Use path aliases: `@/*` for `src/*`, `@types/*` for `src/types/*`