# CLAUDE.md

@AGENTS.md

（工作流程規範在 AGENTS.md；以下為本 repo 架構參考。）

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Package Management
- `pnpm install` - Install all dependencies
- `pnpm add <package>` - Add production dependency
- `pnpm add -D <package>` - Add development dependency

### Core Commands
- `pnpm run dev` - Start development server with hot reload
- `pnpm start` - Start production server
- `pnpm run build` - Compile TypeScript to dist/

### Type Checking & Linting
- `pnpm run typecheck` - TypeScript type checking
- `pnpm run lint` - ESLint code quality check
- `pnpm run lint:fix` - Auto-fix ESLint issues

### Database & Type Generation
- `pnpm run prisma:generate` - Generate Prisma client types at generated/prisma
- `pnpm run prisma:migrate dev` - Run database migrations (development)
- `pnpm run prisma:studio` - Open Prisma Studio GUI
- `pnpm run types:generate` - Generate both Prisma and OpenAPI types

### Testing
- `pnpm test` - Run all Jest tests
- `pnpm test -- auth.controller.test.ts` - Run single test file
- `pnpm test -- --testNamePattern="Auth"` - Run tests matching pattern
- `pnpm test -- integration/` - Run integration tests only
- `pnpm test -- unit/` - Run unit tests only
- `pnpm test -- --coverage` - Generate coverage report

## Architecture Overview

Node.js backend for DaoDao learning platform with **hybrid JavaScript/TypeScript architecture**.

### Technology Stack
- **Runtime**: Node.js + Express.js
- **Databases**: PostgreSQL (Prisma ORM), Redis (ioredis)
- **Authentication**: JWT, Passport.js with Google OAuth
- **File Storage**: Cloudflare R2
- **Validation**: Zod schemas
- **Documentation**: Swagger/OpenAPI at `/api-docs`

### Dual Architecture Structure

**Legacy JavaScript (root level)** - Being migrated:
- `controllers/`, `models/`, `routes/`, `services/`, `middlewares/`, `utils/`

**Modern TypeScript (src/ directory)** - Active development:
- `src/controllers/` - Request handlers
- `src/services/` - Business logic
- `src/routes/` - API routes with Swagger annotations
- `src/types/` - TypeScript type definitions
- `src/validators/` - Zod validation schemas
- `src/middleware/` - Auth, rate limiting, error handling
- `src/swagger/schemas/` - API documentation schemas

### Key Integration Points
- `index.js` - Main entry point, loads both JS and TS routes
- `src/app.ts` - TypeScript route setup and Swagger integration
- `src/utils/modelBridge.ts` - Bridges JavaScript and TypeScript models
- `src/types/express.d.ts` - Express Request augmentation for auth
- `generated/prisma/` - Auto-generated Prisma client types

### Path Aliases
- `@/*` → `src/*`
- `@types/*` → `src/types/*`
- `@services/*` → `src/services/*`

## Critical Development Notes

### Prisma Integration
- **ALWAYS run `pnpm run prisma:generate` after schema changes** - Required for TypeScript compilation
- Prisma client types at `generated/prisma` (NOT `node_modules/@prisma/client`)
- Import types: `import { users, resources } from '../../generated/prisma'`

### Authentication & Request Types
- Express Request augmented with `user?: UserJwtPayload` in `src/types/express.d.ts`
- **Never create custom `AuthRequest` interfaces** - use standard Express `Request` type
- Auth middleware populates `req.user` automatically

### Code Patterns
- **Strictly avoid `any` types** - use `unknown` instead
- Use **factory functions and object literals** instead of classes
- Prefer **const objects with `as const`** over enums
- Use **Zod schemas** for validation and type inference
- Follow **functional programming principles**
- Write **JSDoc** for all functions, methods, and types

### API Response Format
All endpoints use standardized format defined in `src/types/api-response.types.ts`:
- Success: `{ success: true, data: T, timestamp: string, meta?: ResponseMeta }`
- Error: `{ success: false, data: null, error: { code, message, details? }, timestamp }`
- Paginated: includes `pagination` object with `currentPage`, `totalPages`, `hasNext`, etc.

### Rate Limiting
- Global: 1000 requests/minute
- Strict (emails/images): 60 requests/minute

## CI/CD & Docker

### Type Change Handling
When modifying TypeScript types (`src/types/*.ts`, `*.d.ts`, `tsconfig*.json`):
1. Dockerfile layers types separately to trigger correct rebuilds
2. CI/CD auto-detects type changes and disables cache when needed

### Emergency Rebuild
For cache-related build issues: Use "Emergency Rebuild" workflow in GitHub Actions

### Build Monitoring
- Cache efficiency and image size tracked automatically
- Discord notifications for build status
- Warning if image exceeds 1GB

## Environment Configuration
Key variables (see `.env.dev_temp` for full list):
- Database: `POSTGRES_*`, `MONGODB_URI`, `REDIS_*`
- Auth: `JWT_SECRET`, `SESSION_SECRET`, `GOOGLE_CLIENT_*`
- Services: `CLOUDFLARE_R2_*`, `EMAIL_*`, `FRONTEND_URL`
