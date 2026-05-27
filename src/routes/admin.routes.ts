/**
 * 管理員路由
 * 處理角色與權限管理的路由定義
 */

import { Router, RequestHandler } from 'express';
import { registry } from '../config/openapi-registry';
import adminController from '@/controllers/admin.controller';
import adminUserController from '@/controllers/admin-user.controller';
import adminStatisticsController from '@/controllers/admin-statistics.controller';
import emailHistoryController from '@/controllers/email-history.controller';
import adminPersonaController from '@/controllers/admin-persona.controller';
import adminTagsController from '@/controllers/admin-tags.controller';
import adminSystemController from '@/controllers/admin-system.controller';
import adminNotificationController from '@/controllers/admin-notification.controller';
import adminFeedbackController from '@/controllers/admin-feedback.controller';
import adminAuditController from '@/controllers/admin-audit.controller';
import { validate } from '@/middleware/validation.middleware';
import { authenticateAny } from '@/middleware/auth';
import { requireAdmin, requireSuperAdmin } from '@/middleware/permission.middleware';
import {
  createRoleSchema,
  updateRoleSchema,
  createPermissionSchema,
  updatePermissionSchema,
  addRolePermissionSchema,
  updateUserRoleSchema,
  roleIdParamSchema,
  permissionIdParamSchema,
  roleIdForPermissionParamSchema,
  rolePermissionParamSchema,
  userIdParamSchema,
  getRolesApiResponseSchema,
  getRoleWithPermissionsApiResponseSchema,
  mutateRoleApiResponseSchema,
  deleteRoleApiResponseSchema,
  getPermissionsApiResponseSchema,
  getPermissionApiResponseSchema,
  mutatePermissionApiResponseSchema,
  deletePermissionApiResponseSchema,
  rolePermissionApiResponseSchema,
  getUserRoleApiResponseSchema,
  updateUserRoleApiResponseSchema
} from '@/validators/admin.validators';
import {
  adminUserListQuerySchema,
  adminUserIdParamSchema,
  adminLoginHistoryQuerySchema,
  updateUserStatusSchema,
  adminUserListResponseSchema,
  adminUserDetailResponseSchema,
  adminLoginHistoryResponseSchema,
  adminActivityStatsResponseSchema,
  updateUserStatusResponseSchema
} from '@/validators/admin-user.validator';
import {
  practiceStatsQuerySchema,
  activeUsersTrendQuerySchema,
  practiceStatsResponseSchema,
  activeUsersTrendResponseSchema
} from '@/validators/admin-statistics.validator';
import {
  emailHistoryQuerySchema,
  emailHistoryResponseSchema
} from '@/validators/email-history.validator';

const router = Router();

// ============================================================================
// OpenAPI 路由定義（使用 registry.registerPath）
// ============================================================================

// ===== 角色管理 =====

/**
 * GET /api/v1/admin/roles - 獲取所有角色
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/roles',
  tags: ['Admin - Roles'],
  summary: '獲取所有角色',
  description: '獲取系統中所有角色的列表。需要管理員權限。',
  responses: {
    200: {
      description: '成功獲取角色列表',
      content: {
        'application/json': {
          schema: getRolesApiResponseSchema
        }
      }
    },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    403: { $ref: '#/components/responses/ForbiddenError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * GET /api/v1/admin/roles/:id - 獲取單一角色（含權限）
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/roles/{id}',
  tags: ['Admin - Roles'],
  summary: '獲取單一角色',
  description: '獲取指定角色的詳細資訊，包含該角色所擁有的所有權限。需要管理員權限。',
  request: {
    params: roleIdParamSchema
  },
  responses: {
    200: {
      description: '成功獲取角色詳情',
      content: {
        'application/json': {
          schema: getRoleWithPermissionsApiResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    403: { $ref: '#/components/responses/ForbiddenError' },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * POST /api/v1/admin/roles - 創建角色
 */
registry.registerPath({
  method: 'post',
  path: '/api/v1/admin/roles',
  tags: ['Admin - Roles'],
  summary: '創建角色',
  description: '創建新的角色。需要超級管理員權限。',
  request: {
    body: {
      content: {
        'application/json': {
          schema: createRoleSchema
        }
      }
    }
  },
  responses: {
    201: {
      description: '角色創建成功',
      content: {
        'application/json': {
          schema: mutateRoleApiResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    403: { $ref: '#/components/responses/ForbiddenError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * PUT /api/v1/admin/roles/:id - 更新角色
 */
registry.registerPath({
  method: 'put',
  path: '/api/v1/admin/roles/{id}',
  tags: ['Admin - Roles'],
  summary: '更新角色',
  description: '更新指定角色的資訊。需要超級管理員權限。',
  request: {
    params: roleIdParamSchema,
    body: {
      content: {
        'application/json': {
          schema: updateRoleSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: '角色更新成功',
      content: {
        'application/json': {
          schema: mutateRoleApiResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    403: { $ref: '#/components/responses/ForbiddenError' },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * DELETE /api/v1/admin/roles/:id - 刪除角色
 */
registry.registerPath({
  method: 'delete',
  path: '/api/v1/admin/roles/{id}',
  tags: ['Admin - Roles'],
  summary: '刪除角色',
  description: '刪除指定的角色。如果有用戶正在使用此角色，將無法刪除。需要超級管理員權限。',
  request: {
    params: roleIdParamSchema
  },
  responses: {
    200: {
      description: '角色刪除成功',
      content: {
        'application/json': {
          schema: deleteRoleApiResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    403: { $ref: '#/components/responses/ForbiddenError' },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

// ===== 權限管理 =====

/**
 * GET /api/v1/admin/permissions - 獲取所有權限
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/permissions',
  tags: ['Admin - Permissions'],
  summary: '獲取所有權限',
  description: '獲取系統中所有權限的列表。需要管理員權限。',
  responses: {
    200: {
      description: '成功獲取權限列表',
      content: {
        'application/json': {
          schema: getPermissionsApiResponseSchema
        }
      }
    },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    403: { $ref: '#/components/responses/ForbiddenError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * GET /api/v1/admin/permissions/:id - 獲取單一權限
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/permissions/{id}',
  tags: ['Admin - Permissions'],
  summary: '獲取單一權限',
  description: '獲取指定權限的詳細資訊。需要管理員權限。',
  request: {
    params: permissionIdParamSchema
  },
  responses: {
    200: {
      description: '成功獲取權限詳情',
      content: {
        'application/json': {
          schema: getPermissionApiResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    403: { $ref: '#/components/responses/ForbiddenError' },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * POST /api/v1/admin/permissions - 創建權限
 */
registry.registerPath({
  method: 'post',
  path: '/api/v1/admin/permissions',
  tags: ['Admin - Permissions'],
  summary: '創建權限',
  description: '創建新的權限。權限名稱格式必須為 resource:action。需要超級管理員權限。',
  request: {
    body: {
      content: {
        'application/json': {
          schema: createPermissionSchema
        }
      }
    }
  },
  responses: {
    201: {
      description: '權限創建成功',
      content: {
        'application/json': {
          schema: mutatePermissionApiResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    403: { $ref: '#/components/responses/ForbiddenError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * PUT /api/v1/admin/permissions/:id - 更新權限
 */
registry.registerPath({
  method: 'put',
  path: '/api/v1/admin/permissions/{id}',
  tags: ['Admin - Permissions'],
  summary: '更新權限',
  description: '更新指定權限的資訊。需要超級管理員權限。',
  request: {
    params: permissionIdParamSchema,
    body: {
      content: {
        'application/json': {
          schema: updatePermissionSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: '權限更新成功',
      content: {
        'application/json': {
          schema: mutatePermissionApiResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    403: { $ref: '#/components/responses/ForbiddenError' },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * DELETE /api/v1/admin/permissions/:id - 刪除權限
 */
registry.registerPath({
  method: 'delete',
  path: '/api/v1/admin/permissions/{id}',
  tags: ['Admin - Permissions'],
  summary: '刪除權限',
  description: '刪除指定的權限。如果有角色或用戶正在使用此權限，將無法刪除。需要超級管理員權限。',
  request: {
    params: permissionIdParamSchema
  },
  responses: {
    200: {
      description: '權限刪除成功',
      content: {
        'application/json': {
          schema: deletePermissionApiResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    403: { $ref: '#/components/responses/ForbiddenError' },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

// ===== 角色權限關聯 =====

/**
 * POST /api/v1/admin/roles/:roleId/permissions - 為角色新增權限
 */
registry.registerPath({
  method: 'post',
  path: '/api/v1/admin/roles/{roleId}/permissions',
  tags: ['Admin - Roles'],
  summary: '為角色新增權限',
  description: '為指定角色新增一個權限。需要超級管理員權限。',
  request: {
    params: roleIdForPermissionParamSchema,
    body: {
      content: {
        'application/json': {
          schema: addRolePermissionSchema
        }
      }
    }
  },
  responses: {
    201: {
      description: '權限新增成功',
      content: {
        'application/json': {
          schema: rolePermissionApiResponseSchema
        }
      }
    },
    200: {
      description: '權限已存在於該角色',
      content: {
        'application/json': {
          schema: rolePermissionApiResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    403: { $ref: '#/components/responses/ForbiddenError' },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * DELETE /api/v1/admin/roles/:roleId/permissions/:permissionId - 移除角色權限
 */
registry.registerPath({
  method: 'delete',
  path: '/api/v1/admin/roles/{roleId}/permissions/{permissionId}',
  tags: ['Admin - Roles'],
  summary: '移除角色權限',
  description: '從指定角色移除一個權限。需要超級管理員權限。',
  request: {
    params: rolePermissionParamSchema
  },
  responses: {
    200: {
      description: '權限移除成功',
      content: {
        'application/json': {
          schema: rolePermissionApiResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    403: { $ref: '#/components/responses/ForbiddenError' },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

// ===== 用戶角色指派 =====

/**
 * GET /api/v1/admin/users/:userId/role - 獲取用戶角色
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/users/{userId}/role',
  tags: ['Admin - Users'],
  summary: '獲取用戶角色',
  description: '獲取指定用戶的角色資訊。需要管理員權限。',
  request: {
    params: userIdParamSchema
  },
  responses: {
    200: {
      description: '成功獲取用戶角色',
      content: {
        'application/json': {
          schema: getUserRoleApiResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    403: { $ref: '#/components/responses/ForbiddenError' },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * PUT /api/v1/admin/users/:userId/role - 更新用戶角色
 */
registry.registerPath({
  method: 'put',
  path: '/api/v1/admin/users/{userId}/role',
  tags: ['Admin - Users'],
  summary: '更新用戶角色',
  description: '更新指定用戶的角色。需要超級管理員權限。',
  request: {
    params: userIdParamSchema,
    body: {
      content: {
        'application/json': {
          schema: updateUserRoleSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: '用戶角色更新成功',
      content: {
        'application/json': {
          schema: updateUserRoleApiResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    403: { $ref: '#/components/responses/ForbiddenError' },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

// ===== Admin 使用者管理 =====

/**
 * GET /api/v1/admin/users - 取得使用者列表
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/users',
  tags: ['Admin - User Management'],
  summary: '取得使用者列表',
  description: '取得使用者列表，支援搜尋、篩選、分頁。包含 email_verified、is_active、roles、permissions 等管理欄位。需要管理員權限。',
  request: {
    query: adminUserListQuerySchema
  },
  responses: {
    200: {
      description: '成功取得使用者列表',
      content: {
        'application/json': {
          schema: adminUserListResponseSchema
        }
      }
    },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    403: { $ref: '#/components/responses/ForbiddenError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * GET /api/v1/admin/users/:userId - 取得使用者詳情
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/users/{userId}',
  tags: ['Admin - User Management'],
  summary: '取得使用者詳情',
  description: '取得使用者完整詳情，包含 roles、permissions、loginHistory、activityStats 等管理欄位。需要管理員權限。',
  request: {
    params: adminUserIdParamSchema
  },
  responses: {
    200: {
      description: '成功取得使用者詳情',
      content: {
        'application/json': {
          schema: adminUserDetailResponseSchema
        }
      }
    },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    403: { $ref: '#/components/responses/ForbiddenError' },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * GET /api/v1/admin/users/:userId/login-history - 取得使用者登入歷史
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/users/{userId}/login-history',
  tags: ['Admin - User Management'],
  summary: '取得使用者登入歷史',
  description: '取得指定使用者的登入歷史記錄，支援日期範圍篩選。需要管理員權限。',
  request: {
    params: adminUserIdParamSchema,
    query: adminLoginHistoryQuerySchema
  },
  responses: {
    200: {
      description: '成功取得登入歷史',
      content: {
        'application/json': {
          schema: adminLoginHistoryResponseSchema
        }
      }
    },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    403: { $ref: '#/components/responses/ForbiddenError' },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * GET /api/v1/admin/users/:userId/activity-stats - 取得使用者活躍統計
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/users/{userId}/activity-stats',
  tags: ['Admin - User Management'],
  summary: '取得使用者活躍統計',
  description: '取得指定使用者的活躍統計數據。需要管理員權限。',
  request: {
    params: adminUserIdParamSchema
  },
  responses: {
    200: {
      description: '成功取得活躍統計',
      content: {
        'application/json': {
          schema: adminActivityStatsResponseSchema
        }
      }
    },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    403: { $ref: '#/components/responses/ForbiddenError' },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * PUT /api/v1/admin/users/:userId/status - 更新使用者狀態
 */
registry.registerPath({
  method: 'put',
  path: '/api/v1/admin/users/{userId}/status',
  tags: ['Admin - User Management'],
  summary: '更新使用者狀態',
  description: '啟用或停用使用者帳號。需要超級管理員權限。',
  request: {
    params: adminUserIdParamSchema,
    body: {
      content: {
        'application/json': {
          schema: updateUserStatusSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: '使用者狀態更新成功',
      content: {
        'application/json': {
          schema: updateUserStatusResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    403: { $ref: '#/components/responses/ForbiddenError' },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

// ===== Admin 統計 =====

/**
 * GET /api/v1/admin/practices/stats - 取得實踐統計
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/practices/stats',
  tags: ['Admin - Statistics'],
  summary: '取得實踐統計',
  description: '取得全站實踐統計數據，包含總數、各狀態數量、分類統計等。需要管理員權限。',
  request: {
    query: practiceStatsQuerySchema
  },
  responses: {
    200: {
      description: '成功取得實踐統計',
      content: {
        'application/json': {
          schema: practiceStatsResponseSchema
        }
      }
    },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    403: { $ref: '#/components/responses/ForbiddenError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * GET /api/v1/admin/user-stats/active-users/trend - 取得活躍用戶趨勢
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/user-stats/active-users/trend',
  tags: ['Admin - Statistics'],
  summary: '取得活躍用戶趨勢',
  description: '取得 DAU/WAU/MAU 時間序列資料，用於繪製趨勢圖表。預設 30 天，最多 90 天。需要管理員權限。',
  request: {
    query: activeUsersTrendQuerySchema
  },
  responses: {
    200: {
      description: '成功取得活躍用戶趨勢',
      content: {
        'application/json': {
          schema: activeUsersTrendResponseSchema
        }
      }
    },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    403: { $ref: '#/components/responses/ForbiddenError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

// ===== 郵件歷史 =====

/**
 * GET /api/v1/admin/email/history - 取得郵件發送歷史
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/email/history',
  tags: ['Admin - Email'],
  summary: '取得郵件發送歷史',
  description: '取得郵件發送歷史記錄，支援多條件篩選、分頁、排序。包含統計摘要。需要管理員權限。',
  request: {
    query: emailHistoryQuerySchema
  },
  responses: {
    200: {
      description: '成功取得郵件歷史',
      content: {
        'application/json': {
          schema: emailHistoryResponseSchema
        }
      }
    },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    403: { $ref: '#/components/responses/ForbiddenError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

// ============================================================================
// Express 路由定義
// ============================================================================

// ===== 角色管理路由 =====

/**
 * GET /admin/roles
 * 獲取所有角色
 * 需要：Admin 或 SuperAdmin
 */
router.get('/roles',
  authenticateAny,
  requireAdmin,
  adminController.getAllRoles as RequestHandler
);

/**
 * GET /admin/roles/:id
 * 獲取單一角色（含權限）
 * 需要：Admin 或 SuperAdmin
 */
router.get('/roles/:id',
  authenticateAny,
  requireAdmin,
  adminController.getRoleById as RequestHandler
);

/**
 * POST /admin/roles
 * 創建角色
 * 需要：SuperAdmin
 */
router.post('/roles',
  authenticateAny,
  requireSuperAdmin,
  validate(createRoleSchema, 'body'),
  adminController.createRole as RequestHandler
);

/**
 * PUT /admin/roles/:id
 * 更新角色
 * 需要：SuperAdmin
 */
router.put('/roles/:id',
  authenticateAny,
  requireSuperAdmin,
  validate(updateRoleSchema, 'body'),
  adminController.updateRole as RequestHandler
);

/**
 * DELETE /admin/roles/:id
 * 刪除角色
 * 需要：SuperAdmin
 */
router.delete('/roles/:id',
  authenticateAny,
  requireSuperAdmin,
  adminController.deleteRole as RequestHandler
);

// ===== 角色權限關聯路由 =====

/**
 * POST /admin/roles/:roleId/permissions
 * 為角色新增權限
 * 需要：SuperAdmin
 */
router.post('/roles/:roleId/permissions',
  authenticateAny,
  requireSuperAdmin,
  validate(addRolePermissionSchema, 'body'),
  adminController.addRolePermission as RequestHandler
);

/**
 * DELETE /admin/roles/:roleId/permissions/:permissionId
 * 移除角色權限
 * 需要：SuperAdmin
 */
router.delete('/roles/:roleId/permissions/:permissionId',
  authenticateAny,
  requireSuperAdmin,
  adminController.removeRolePermission as RequestHandler
);

// ===== 權限管理路由 =====

/**
 * GET /admin/permissions
 * 獲取所有權限
 * 需要：Admin 或 SuperAdmin
 */
router.get('/permissions',
  authenticateAny,
  requireAdmin,
  adminController.getAllPermissions as RequestHandler
);

/**
 * GET /admin/permissions/:id
 * 獲取單一權限
 * 需要：Admin 或 SuperAdmin
 */
router.get('/permissions/:id',
  authenticateAny,
  requireAdmin,
  adminController.getPermissionById as RequestHandler
);

/**
 * POST /admin/permissions
 * 創建權限
 * 需要：SuperAdmin
 */
router.post('/permissions',
  authenticateAny,
  requireSuperAdmin,
  validate(createPermissionSchema, 'body'),
  adminController.createPermission as RequestHandler
);

/**
 * PUT /admin/permissions/:id
 * 更新權限
 * 需要：SuperAdmin
 */
router.put('/permissions/:id',
  authenticateAny,
  requireSuperAdmin,
  validate(updatePermissionSchema, 'body'),
  adminController.updatePermission as RequestHandler
);

/**
 * DELETE /admin/permissions/:id
 * 刪除權限
 * 需要：SuperAdmin
 */
router.delete('/permissions/:id',
  authenticateAny,
  requireSuperAdmin,
  adminController.deletePermission as RequestHandler
);

// ===== 用戶角色路由 =====

/**
 * GET /admin/users/:userId/role
 * 獲取用戶角色
 * 需要：Admin 或 SuperAdmin
 */
router.get('/users/:userId/role',
  authenticateAny,
  requireAdmin,
  adminController.getUserRole as RequestHandler
);

/**
 * PUT /admin/users/:userId/role
 * 更新用戶角色
 * 需要：SuperAdmin
 */
router.put('/users/:userId/role',
  authenticateAny,
  requireSuperAdmin,
  validate(updateUserRoleSchema, 'body'),
  adminController.updateUserRole as RequestHandler
);

// ===== Admin 使用者管理路由 =====

/**
 * GET /admin/users
 * 取得使用者列表
 * 需要：Admin 或 SuperAdmin
 */
router.get('/users',
  authenticateAny,
  requireAdmin,
  adminUserController.listUsers as RequestHandler
);

/**
 * GET /admin/users/:userId
 * 取得使用者詳情
 * 需要：Admin 或 SuperAdmin
 */
router.get('/users/:userId',
  authenticateAny,
  requireAdmin,
  adminUserController.getUserDetail as RequestHandler
);

/**
 * GET /admin/users/:userId/login-history
 * 取得使用者登入歷史
 * 需要：Admin 或 SuperAdmin
 */
router.get('/users/:userId/login-history',
  authenticateAny,
  requireAdmin,
  adminUserController.getLoginHistory as RequestHandler
);

/**
 * GET /admin/users/:userId/activity-stats
 * 取得使用者活躍統計
 * 需要：Admin 或 SuperAdmin
 */
router.get('/users/:userId/activity-stats',
  authenticateAny,
  requireAdmin,
  adminUserController.getActivityStats as RequestHandler
);

/**
 * PUT /admin/users/:userId/status
 * 更新使用者狀態（啟用/停用）
 * 需要：SuperAdmin
 */
router.put('/users/:userId/status',
  authenticateAny,
  requireSuperAdmin,
  adminUserController.updateStatus as RequestHandler
);

// ===== Admin 統計路由 =====

/**
 * GET /admin/practices/stats
 * 取得實踐統計
 * 需要：Admin 或 SuperAdmin
 */
router.get('/practices/stats',
  authenticateAny,
  requireAdmin,
  adminStatisticsController.getPracticeStats as RequestHandler
);

/**
 * GET /admin/user-stats/active-users/trend
 * 取得活躍用戶趨勢
 * 需要：Admin 或 SuperAdmin
 */
router.get('/user-stats/active-users/trend',
  authenticateAny,
  requireAdmin,
  adminStatisticsController.getActiveUsersTrend as RequestHandler
);

// ===== 郵件歷史路由 =====

/**
 * GET /admin/email/history
 * 取得郵件發送歷史
 * 需要：Admin 或 SuperAdmin
 */
router.get('/email/history',
  authenticateAny,
  requireAdmin,
  emailHistoryController.getEmailHistory as RequestHandler
);

// ===== Persona 題目管理路由 =====

/**
 * GET /admin/persona/questions
 * 列出所有 persona 題目（含各語系翻譯）
 */
router.get('/persona/questions',
  authenticateAny,
  requireAdmin,
  adminPersonaController.listQuestions as RequestHandler
);

/**
 * GET /admin/persona/questions/:id
 * 取得單一題目（含各語系翻譯）
 */
router.get('/persona/questions/:id',
  authenticateAny,
  requireAdmin,
  adminPersonaController.getQuestion as RequestHandler
);

/**
 * POST /admin/persona/questions
 * 新增題目（可同時帶入 translations 陣列）
 */
router.post('/persona/questions',
  authenticateAny,
  requireAdmin,
  adminPersonaController.createQuestion as RequestHandler
);

/**
 * PUT /admin/persona/questions/:id
 * 更新題目 metadata（questionType / isNewUserPriority）
 */
router.put('/persona/questions/:id',
  authenticateAny,
  requireAdmin,
  adminPersonaController.updateQuestion as RequestHandler
);

/**
 * DELETE /admin/persona/questions/:id
 * 刪除題目（cascade 刪除翻譯與答案）
 */
router.delete('/persona/questions/:id',
  authenticateAny,
  requireAdmin,
  adminPersonaController.deleteQuestion as RequestHandler
);

/**
 * PUT /admin/persona/questions/:id/translations/:locale
 * 新增或更新指定語系翻譯
 */
router.put('/persona/questions/:id/translations/:locale',
  authenticateAny,
  requireAdmin,
  adminPersonaController.upsertTranslation as RequestHandler
);

/**
 * DELETE /admin/persona/questions/:id/translations/:locale
 * 刪除指定語系翻譯
 */
router.delete('/persona/questions/:id/translations/:locale',
  authenticateAny,
  requireAdmin,
  adminPersonaController.deleteTranslation as RequestHandler
);

// ===== 用戶標籤路由 =====

/**
 * GET /admin/tags
 * 列出所有標籤
 * 需要：Admin 或 SuperAdmin
 */
router.get('/tags',
  authenticateAny,
  requireAdmin,
  adminTagsController.listTags as RequestHandler
);

/**
 * POST /admin/tags
 * 建立標籤
 * 需要：Admin 或 SuperAdmin
 */
router.post('/tags',
  authenticateAny,
  requireAdmin,
  adminTagsController.createTag as RequestHandler
);

/**
 * PUT /admin/tags/:id
 * 更新標籤
 * 需要：Admin 或 SuperAdmin
 */
router.put('/tags/:id',
  authenticateAny,
  requireAdmin,
  adminTagsController.updateTag as RequestHandler
);

/**
 * DELETE /admin/tags/:id
 * 刪除標籤
 * 需要：Admin 或 SuperAdmin
 */
router.delete('/tags/:id',
  authenticateAny,
  requireAdmin,
  adminTagsController.deleteTag as RequestHandler
);

/**
 * GET /admin/tag-rules
 * 列出所有標籤規則
 * 需要：Admin 或 SuperAdmin
 */
router.get('/tag-rules',
  authenticateAny,
  requireAdmin,
  adminTagsController.listTagRules as RequestHandler
);

/**
 * POST /admin/tag-rules
 * 建立標籤規則
 * 需要：Admin 或 SuperAdmin
 */
router.post('/tag-rules',
  authenticateAny,
  requireAdmin,
  adminTagsController.createTagRule as RequestHandler
);

/**
 * DELETE /admin/tag-rules/:id
 * 刪除標籤規則
 * 需要：Admin 或 SuperAdmin
 */
router.delete('/tag-rules/:id',
  authenticateAny,
  requireAdmin,
  adminTagsController.deleteTagRule as RequestHandler
);

/**
 * POST /admin/users/bulk-tag
 * 批量指派或移除用戶標籤
 * 需要：Admin 或 SuperAdmin
 */
router.post('/users/bulk-tag',
  authenticateAny,
  requireAdmin,
  adminTagsController.bulkAssignTag as RequestHandler
);

// ===== 系統監控與 Dashboard 路由 =====

router.get('/system/monitor', authenticateAny, requireAdmin, adminSystemController.getSystemMonitor as RequestHandler);
router.get('/system/db-info', authenticateAny, requireAdmin, adminSystemController.getDbInfo as RequestHandler);
router.get('/system/redis-info', authenticateAny, requireAdmin, adminSystemController.getRedisInfo as RequestHandler);
router.get('/dashboard/overview', authenticateAny, requireAdmin, adminSystemController.getDashboardOverview as RequestHandler);
router.get('/dashboard/active-users', authenticateAny, requireAdmin, adminSystemController.getDashboardActiveUsers as RequestHandler);
router.get('/email/stats', authenticateAny, requireAdmin, adminSystemController.getEmailStats as RequestHandler);
router.get('/email/health', authenticateAny, requireAdmin, adminSystemController.getEmailHealth as RequestHandler);
router.post('/email/send', authenticateAny, requireAdmin, adminSystemController.sendEmail as RequestHandler);
router.post('/email/send-bulk', authenticateAny, requireAdmin, adminSystemController.sendBulkEmail as RequestHandler);

// ===== 站內通知路由 =====

router.get('/notifications', authenticateAny, requireAdmin, adminNotificationController.list as RequestHandler);
router.post('/notifications', authenticateAny, requireAdmin, adminNotificationController.create as RequestHandler);
router.post('/notifications/:id/send', authenticateAny, requireAdmin, adminNotificationController.send as RequestHandler);
router.get('/notifications/:id/stats', authenticateAny, requireAdmin, adminNotificationController.stats as RequestHandler);

// ===== 意見回饋路由 =====

router.get('/feedback', authenticateAny, requireAdmin, adminFeedbackController.listFeedback as RequestHandler);
router.patch('/feedback/:id', authenticateAny, requireAdmin, adminFeedbackController.updateFeedbackStatus as RequestHandler);
router.post('/feedback/:id/reply', authenticateAny, requireAdmin, adminFeedbackController.replyToFeedback as RequestHandler);

// ===== FAQ 路由 =====

router.get('/faq/categories', authenticateAny, requireAdmin, adminFeedbackController.listFaqCategories as RequestHandler);
router.post('/faq/categories', authenticateAny, requireAdmin, adminFeedbackController.createFaqCategory as RequestHandler);
router.get('/faq/items', authenticateAny, requireAdmin, adminFeedbackController.listFaqItems as RequestHandler);
router.post('/faq/items', authenticateAny, requireAdmin, adminFeedbackController.createFaqItem as RequestHandler);
router.put('/faq/items/:id', authenticateAny, requireAdmin, adminFeedbackController.updateFaqItem as RequestHandler);
router.delete('/faq/items/:id', authenticateAny, requireAdmin, adminFeedbackController.deleteFaqItem as RequestHandler);
router.patch('/faq/items/reorder', authenticateAny, requireAdmin, adminFeedbackController.reorderFaqItems as RequestHandler);
router.patch('/faq/items/bulk-publish', authenticateAny, requireAdmin, adminFeedbackController.bulkPublishFaqItems as RequestHandler);

// ===== 審計日誌路由 =====

router.get('/audit-logs', authenticateAny, requireAdmin, adminAuditController.listAuditLogs as RequestHandler);
router.post('/audit-logs/compliance-hold', authenticateAny, requireSuperAdmin, adminAuditController.setComplianceHold as RequestHandler);
router.get('/data-retention-policy', authenticateAny, requireAdmin, adminAuditController.getDataRetentionPolicy as RequestHandler);
router.put('/data-retention-policy', authenticateAny, requireSuperAdmin, adminAuditController.updateDataRetentionPolicy as RequestHandler);

export default router;
