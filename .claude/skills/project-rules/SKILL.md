---
name: project-rules
description: daodao-server 專案開發規範，涵蓋架構模式、Prisma 用法、API 格式、錯誤處理
---

# daodao-server 專案規範

## 技術棧

Express.js + TypeScript（ES2020）、Prisma（PostgreSQL）、Redis、BullMQ、Zod、Swagger/OpenAPI。

## 架構（雙結構，遷移中）

- Legacy JS（根目錄 `controllers/`、`models/`）— 不再新增
- Modern TS（`src/`）— 所有新開發在這裡

## Path Aliases

```
@/*          → src/*
@types/*     → src/types/*
@services/*  → src/services/*
@middleware/* → src/middleware/*
@utils/*     → src/utils/*
@models/*    → src/models/*
@controllers/* → src/controllers/*
@generated/* → generated/*
```

一律用 path alias，禁止 relative import。

## Controller 模式

exported const + asyncHandler，**不用 class**：

```typescript
export const getUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.findById(req.params.id);
  res.json(createSuccessResponse(user));
});
```

- 用標準 Express `Request`（`req.user` 由 auth middleware 填充）
- **禁止**自建 `AuthRequest` interface

## Service 模式

Factory pattern，export functions 或 const object：

```typescript
export const getUserById = async (id: string) => { ... };
// 或
export const userService = { getUserById, updateUser };
```

## Prisma

- Schema：`/prisma/schema.prisma`
- Generated types：`generated/prisma/`（**不是** `node_modules/@prisma/client`）
- Schema 變更後**必須** `pnpm run prisma:generate`
- Import：`import { prisma } from '@/services/database/prisma.service'`

## Validation（Zod）

所有 validator 用 Zod + `.openapi()` 註解：

```typescript
export const loginValidator = z.object({
  email: z.string().email(),
  password: z.string().min(8),
}).openapi({ description: "Login request" });
```

型別推導：`type LoginRequest = z.infer<typeof loginValidator>`

## API Response 格式

統一格式（`src/types/api-response.types.ts`）：

- Success：`{ success: true, data: T, timestamp }`
- Error：`{ success: false, data: null, error: { code, message, details? }, timestamp }`
- Paginated：額外 `pagination: { currentPage, totalPages, totalItems, hasNext, hasPrev }`

Helper：`createSuccessResponse(data)`、`createPaginatedResponse(data, pagination)`

## 錯誤處理

Custom error classes（都 extend `AppError`）：

`BadRequestError`、`UnauthorizedError`、`ForbiddenError`、`NotFoundError`、`ConflictError`

在 controller 裡直接 throw，`asyncHandler` + `globalErrorHandler` 會自動處理。

## Auth Middleware

- `authenticateJWT` / `authenticate` — 必須登入
- `optionalAuth` — 可選登入
- `authorizeRoles(['admin'])` — 角色控制
- `requireCompleteProfile` / `requireEmailVerified` / `requireActiveUser` — 狀態檢查

## 程式碼規範

- **禁止 `any`**，用 `unknown`
- **禁止 class**（service/controller 用 factory pattern）
- **禁止 enum**，用 `as const` object
- 用 Zod 做驗證和型別推導
- 所有 public function 寫 JSDoc
