# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Commands
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run Jest tests with custom config
- `npm run test:paths` - Run tests with NODE_PATH=src for path resolution

### TypeScript Commands
- `npm run typecheck` - Run TypeScript type checking without emitting files
- `npm run lint` - Run ESLint to check code quality and TypeScript issues
- `npm run lint:fix` - Run ESLint and automatically fix issues
- `tsc --noEmit` - Type checking without emitting files (direct command)
- `ts-node src/index.ts` - Run TypeScript files directly

## Architecture Overview

This is a Node.js backend server for the DaoDao learning platform with a **hybrid JavaScript/TypeScript architecture**:

### Technology Stack
- **Runtime**: Node.js with Express.js
- **Databases**: PostgreSQL (Sequelize ORM), MongoDB (Mongoose), Redis (ioredis)
- **Authentication**: JWT, Passport.js with Google OAuth
- **File Storage**: Cloudflare R2, Multer for uploads
- **Testing**: Jest with TypeScript support
- **Documentation**: Swagger/OpenAPI

### Project Structure
The codebase uses a **dual architecture approach**:

#### Legacy JavaScript Structure (root level)
```
controllers/     # Business logic controllers
models/         # Sequelize models and schemas  
routes/         # Express route definitions
services/       # Database services (mongo, postgres, redis)
middlewares/    # Authentication and validation middleware
utils/          # Utility functions
```

#### Modern TypeScript Structure (src/ directory)
```
src/
├── controllers/    # TypeScript controllers
├── models/        # TypeScript/Sequelize models
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
- Path aliases: `@/*` maps to `src/*`, `@types/*` to `src/types/*`, `@services/*` to `src/services/*`

### Database Architecture
- **PostgreSQL**: Primary database for structured data (users, projects, marathons)
- **MongoDB**: Document storage for flexible data structures
- **Redis**: Caching and session management

### API Documentation
- Swagger UI available at `/api-docs` and `/api/docs`
- TypeScript-first API development with comprehensive Swagger annotations
- Standardized response format with success/error states

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

### Important File Patterns
- TypeScript models export both Sequelize models and type definitions
- Routes use comprehensive Swagger documentation
- Validators use Zod with TypeScript inference
- Services follow dependency injection patterns

## TypeScript Best Practices
- `ts` 不能使用 `any`