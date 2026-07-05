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
import adminEmailTriggerController from '@/controllers/admin-email-trigger.controller';
import adminReportsController from '@/controllers/admin-reports.controller';
import adminTrustController from '@/controllers/admin-trust.controller';
import adminAutomodController from '@/controllers/admin-automod.controller';
import adminLearningController from '@/controllers/admin-learning.controller';
import adminGamificationController from '@/controllers/admin-gamification.controller';
import adminCommunityController from '@/controllers/admin-community.controller';
import adminEventsController from '@/controllers/admin-events.controller';
import adminTrackingController from '@/controllers/admin-tracking.controller';
import adminContentController from '@/controllers/admin-content.controller';
import { adminSurveyController } from '@/controllers/admin-survey.controller';
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
 * GET /admin/users/:userId/practices
 * 取得使用者實踐列表
 * 需要：Admin 或 SuperAdmin
 */
router.get('/users/:userId/practices',
  authenticateAny,
  requireAdmin,
  adminUserController.getUserPracticesList as RequestHandler
);

/**
 * GET /admin/users/:userId/activity-timeline
 * 取得使用者活動時間軸
 * 需要：Admin 或 SuperAdmin
 */
router.get('/users/:userId/activity-timeline',
  authenticateAny,
  requireAdmin,
  adminUserController.getActivityTimeline as RequestHandler
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
 * GET /admin/persona/users
 * 列出已回答 persona 題目的使用者（搜尋、排序、分頁）
 */
router.get('/persona/users',
  authenticateAny,
  requireAdmin,
  adminPersonaController.listPersonaUsers as RequestHandler
);

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

// ===== 觸發式郵件路由 =====

router.get('/email-triggers', authenticateAny, requireAdmin, adminEmailTriggerController.listRules as RequestHandler);
router.post('/email-triggers', authenticateAny, requireAdmin, adminEmailTriggerController.createRule as RequestHandler);
router.put('/email-triggers/:id', authenticateAny, requireAdmin, adminEmailTriggerController.updateRule as RequestHandler);
router.delete('/email-triggers/:id', authenticateAny, requireAdmin, adminEmailTriggerController.deleteRule as RequestHandler);
router.get('/email-triggers/:id/log', authenticateAny, requireAdmin, adminEmailTriggerController.getExecutionLog as RequestHandler);
router.get('/email-triggers/:id/stats', authenticateAny, requireAdmin, adminEmailTriggerController.getRuleStats as RequestHandler);
router.get('/email-templates', authenticateAny, requireAdmin, adminEmailTriggerController.listTemplates as RequestHandler);
router.get('/email-templates/:id', authenticateAny, requireAdmin, adminEmailTriggerController.getTemplate as RequestHandler);
router.post('/email-templates', authenticateAny, requireAdmin, adminEmailTriggerController.createTemplate as RequestHandler);
router.put('/email-templates/:id', authenticateAny, requireAdmin, adminEmailTriggerController.updateTemplate as RequestHandler);
router.delete('/email-templates/:id', authenticateAny, requireAdmin, adminEmailTriggerController.deleteTemplate as RequestHandler);

// ===== 報表路由 =====

router.get('/reports/scheduled', authenticateAny, requireAdmin, adminReportsController.listScheduledReports as RequestHandler);
router.post('/reports/scheduled', authenticateAny, requireAdmin, adminReportsController.createScheduledReport as RequestHandler);
router.put('/reports/scheduled/:id', authenticateAny, requireAdmin, adminReportsController.updateScheduledReport as RequestHandler);
router.delete('/reports/scheduled/:id', authenticateAny, requireAdmin, adminReportsController.deleteScheduledReport as RequestHandler);
router.get('/reports/scheduled/:id/history', authenticateAny, requireAdmin, adminReportsController.getReportHistory as RequestHandler);
router.get('/reports/custom/fields', authenticateAny, requireAdmin, adminReportsController.getAvailableFields as RequestHandler);
router.post('/reports/custom/query', authenticateAny, requireAdmin, adminReportsController.queryCustomReport as RequestHandler);
router.get('/reports/custom/saved', authenticateAny, requireAdmin, adminReportsController.listSavedReports as RequestHandler);
router.post('/reports/custom/saved', authenticateAny, requireAdmin, adminReportsController.saveReport as RequestHandler);
router.delete('/reports/custom/saved/:id', authenticateAny, requireAdmin, adminReportsController.deleteSavedReport as RequestHandler);
router.get('/alerts/rules', authenticateAny, requireAdmin, adminReportsController.listAlertRules as RequestHandler);
router.post('/alerts/rules', authenticateAny, requireAdmin, adminReportsController.createAlertRule as RequestHandler);
router.put('/alerts/rules/:id', authenticateAny, requireAdmin, adminReportsController.updateAlertRule as RequestHandler);
router.delete('/alerts/rules/:id', authenticateAny, requireAdmin, adminReportsController.deleteAlertRule as RequestHandler);
router.get('/alerts/history', authenticateAny, requireAdmin, adminReportsController.getAlertHistory as RequestHandler);

// ===== 信任等級路由 =====

router.get('/trust-levels/config', authenticateAny, requireAdmin, adminTrustController.getTrustConfig as RequestHandler);
router.put('/trust-levels/config', authenticateAny, requireSuperAdmin, adminTrustController.updateTrustConfig as RequestHandler);
router.get('/trust-levels/distribution', authenticateAny, requireAdmin, adminTrustController.getTrustDistribution as RequestHandler);
router.get('/trust-levels/history', authenticateAny, requireAdmin, adminTrustController.getTrustHistory as RequestHandler);
router.patch('/users/:userId/trust-level', authenticateAny, requireSuperAdmin, adminTrustController.overrideUserTrustLevel as RequestHandler);
router.get('/user-groups', authenticateAny, requireAdmin, adminTrustController.listUserGroups as RequestHandler);
router.post('/user-groups', authenticateAny, requireAdmin, adminTrustController.createUserGroup as RequestHandler);
router.put('/user-groups/:id', authenticateAny, requireAdmin, adminTrustController.updateUserGroup as RequestHandler);
router.delete('/user-groups/:id', authenticateAny, requireAdmin, adminTrustController.deleteUserGroup as RequestHandler);
router.get('/user-groups/:id/permissions', authenticateAny, requireAdmin, adminTrustController.getGroupPermissions as RequestHandler);

// ===== AutoMod 路由 =====

router.get('/automod/rules', authenticateAny, requireAdmin, adminAutomodController.listRules as RequestHandler);
router.post('/automod/rules', authenticateAny, requireAdmin, adminAutomodController.createRule as RequestHandler);
router.put('/automod/rules/:id', authenticateAny, requireAdmin, adminAutomodController.updateRule as RequestHandler);
router.delete('/automod/rules/:id', authenticateAny, requireAdmin, adminAutomodController.deleteRule as RequestHandler);
router.get('/automod/word-lists', authenticateAny, requireAdmin, adminAutomodController.listWordLists as RequestHandler);
router.put('/automod/word-lists/:id/toggle', authenticateAny, requireAdmin, adminAutomodController.toggleWordList as RequestHandler);
router.get('/automod/log', authenticateAny, requireAdmin, adminAutomodController.getActionLog as RequestHandler);
router.get('/automod/spam-detection', authenticateAny, requireAdmin, adminAutomodController.getSpamDetectionStatus as RequestHandler);
router.put('/automod/spam-detection', authenticateAny, requireAdmin, adminAutomodController.toggleSpamDetection as RequestHandler);
router.get('/automod/username-blocklist', authenticateAny, requireAdmin, adminAutomodController.listUsernameBlocklist as RequestHandler);
router.post('/automod/username-blocklist', authenticateAny, requireAdmin, adminAutomodController.addBlockedUsername as RequestHandler);
router.delete('/automod/username-blocklist/:username', authenticateAny, requireAdmin, adminAutomodController.removeBlockedUsername as RequestHandler);
router.get('/automod/flag-queue', authenticateAny, requireAdmin, adminAutomodController.getFlagQueue as RequestHandler);
router.post('/automod/flag-queue/:id/action', authenticateAny, requireAdmin, adminAutomodController.processFlagAction as RequestHandler);
router.get('/automod/community-mod-config', authenticateAny, requireAdmin, adminAutomodController.getCommunityModConfig as RequestHandler);
router.put('/automod/community-mod-config', authenticateAny, requireAdmin, adminAutomodController.updateCommunityModConfig as RequestHandler);

// ===== 學習管理路由 =====

router.get('/learning/courses', authenticateAny, requireAdmin, adminLearningController.listCourses as RequestHandler);
router.get('/learning/courses/:id/drop-off', authenticateAny, requireAdmin, adminLearningController.getCourseDropOff as RequestHandler);
router.get('/learning/courses/:id/stalled-users', authenticateAny, requireAdmin, adminLearningController.getStalledUsers as RequestHandler);
router.get('/learning/courses/cohort-comparison', authenticateAny, requireAdmin, adminLearningController.getCohortComparison as RequestHandler);
router.get('/learning/drip-schedules', authenticateAny, requireAdmin, adminLearningController.listDripSchedules as RequestHandler);
router.post('/learning/drip-schedules', authenticateAny, requireAdmin, adminLearningController.createDripSchedule as RequestHandler);
router.delete('/learning/drip-schedules/:id', authenticateAny, requireAdmin, adminLearningController.deleteDripSchedule as RequestHandler);
router.post('/learning/drip-schedules/:id/manual-unlock', authenticateAny, requireAdmin, adminLearningController.manualUnlock as RequestHandler);
router.get('/learning/quizzes', authenticateAny, requireAdmin, adminLearningController.listQuizzes as RequestHandler);
router.post('/learning/quizzes', authenticateAny, requireAdmin, adminLearningController.createQuiz as RequestHandler);
router.delete('/learning/quizzes/:id', authenticateAny, requireAdmin, adminLearningController.deleteQuiz as RequestHandler);
router.get('/learning/quizzes/:id/questions', authenticateAny, requireAdmin, adminLearningController.listQuestions as RequestHandler);
router.post('/learning/quizzes/:id/questions', authenticateAny, requireAdmin, adminLearningController.createQuestion as RequestHandler);
router.delete('/learning/quizzes/questions/:id', authenticateAny, requireAdmin, adminLearningController.deleteQuestion as RequestHandler);
router.get('/learning/quizzes/:id/stats', authenticateAny, requireAdmin, adminLearningController.getQuizStats as RequestHandler);
router.get('/learning/certificates/templates', authenticateAny, requireAdmin, adminLearningController.listTemplates as RequestHandler);
router.post('/learning/certificates/templates', authenticateAny, requireAdmin, adminLearningController.createTemplate as RequestHandler);
router.delete('/learning/certificates/templates/:id', authenticateAny, requireAdmin, adminLearningController.deleteTemplate as RequestHandler);
router.post('/learning/certificates/issue', authenticateAny, requireAdmin, adminLearningController.issueCertificate as RequestHandler);
router.post('/learning/certificates/bulk-issue', authenticateAny, requireAdmin, adminLearningController.bulkIssueCertificate as RequestHandler);
router.get('/learning/certificates', authenticateAny, requireAdmin, adminLearningController.listIssuedCertificates as RequestHandler);
router.get('/learning/certificates/:id/verify', adminLearningController.verifyCertificate as RequestHandler);
router.get('/learning/paths', authenticateAny, requireAdmin, adminLearningController.listPaths as RequestHandler);
router.post('/learning/paths', authenticateAny, requireAdmin, adminLearningController.createPath as RequestHandler);
router.put('/learning/paths/:id', authenticateAny, requireAdmin, adminLearningController.updatePath as RequestHandler);
router.delete('/learning/paths/:id', authenticateAny, requireAdmin, adminLearningController.deletePath as RequestHandler);
router.get('/learning/paths/:id/analytics', authenticateAny, requireAdmin, adminLearningController.getPathAnalytics as RequestHandler);

// ===== 遊戲化路由 =====

router.get('/gamification/badges', authenticateAny, requireAdmin, adminGamificationController.listBadges as RequestHandler);
router.post('/gamification/badges', authenticateAny, requireAdmin, adminGamificationController.createBadge as RequestHandler);
router.post('/gamification/badges/:id/award', authenticateAny, requireAdmin, adminGamificationController.awardBadge as RequestHandler);
router.delete('/gamification/badges/:id/revoke/:userId', authenticateAny, requireAdmin, adminGamificationController.revokeBadge as RequestHandler);
router.get('/gamification/challenges', authenticateAny, requireAdmin, adminGamificationController.listChallenges as RequestHandler);
router.post('/gamification/challenges', authenticateAny, requireAdmin, adminGamificationController.createChallenge as RequestHandler);
router.get('/gamification/challenges/:id/participants', authenticateAny, requireAdmin, adminGamificationController.getParticipants as RequestHandler);
router.get('/gamification/streaks/distribution', authenticateAny, requireAdmin, adminGamificationController.getStreakDistribution as RequestHandler);
router.get('/gamification/leaderboard/config', authenticateAny, requireAdmin, adminGamificationController.getLeaderboardConfig as RequestHandler);
router.put('/gamification/leaderboard/config', authenticateAny, requireAdmin, adminGamificationController.updateLeaderboardConfig as RequestHandler);
router.get('/gamification/leaderboard', authenticateAny, requireAdmin, adminGamificationController.getLeaderboard as RequestHandler);
router.post('/gamification/leaderboard/reset', authenticateAny, requireSuperAdmin, adminGamificationController.resetLeaderboard as RequestHandler);

// ===== 社群路由（Onboarding + 會員名錄 + AI 助手）=====

router.get('/onboarding/flows', authenticateAny, requireAdmin, adminCommunityController.listFlows as RequestHandler);
router.post('/onboarding/flows', authenticateAny, requireAdmin, adminCommunityController.createFlow as RequestHandler);
router.put('/onboarding/flows/:id', authenticateAny, requireAdmin, adminCommunityController.updateFlow as RequestHandler);
router.delete('/onboarding/flows/:id', authenticateAny, requireAdmin, adminCommunityController.deleteFlow as RequestHandler);
router.get('/onboarding/flows/:id/analytics', authenticateAny, requireAdmin, adminCommunityController.getFlowAnalytics as RequestHandler);
router.get('/member-directory/fields', authenticateAny, requireAdmin, adminCommunityController.listProfileFields as RequestHandler);
router.post('/member-directory/fields', authenticateAny, requireAdmin, adminCommunityController.createField as RequestHandler);
router.put('/member-directory/fields/:id', authenticateAny, requireAdmin, adminCommunityController.updateField as RequestHandler);
router.delete('/member-directory/fields/:id', authenticateAny, requireAdmin, adminCommunityController.deleteField as RequestHandler);
router.patch('/member-directory/fields/reorder', authenticateAny, requireAdmin, adminCommunityController.reorderFields as RequestHandler);
router.get('/member-directory/stats', authenticateAny, requireAdmin, adminCommunityController.getDirectoryStats as RequestHandler);
router.get('/community/social-stats', authenticateAny, requireAdmin, adminCommunityController.getSocialStats as RequestHandler);
router.get('/community/interaction-stats', authenticateAny, requireAdmin, adminCommunityController.getInteractionStats as RequestHandler);
router.get('/community/interaction-details', authenticateAny, requireAdmin, adminCommunityController.getInteractionDetails as RequestHandler);
router.get('/member-directory/analytics', authenticateAny, requireAdmin, adminCommunityController.getDirectoryAnalytics as RequestHandler);
router.get('/ai-assistant/knowledge', authenticateAny, requireAdmin, adminCommunityController.listKnowledge as RequestHandler);
router.post('/ai-assistant/knowledge', authenticateAny, requireAdmin, adminCommunityController.uploadKnowledge as RequestHandler);
router.delete('/ai-assistant/knowledge/:id', authenticateAny, requireAdmin, adminCommunityController.deleteKnowledge as RequestHandler);
router.get('/ai-assistant/conversations', authenticateAny, requireAdmin, adminCommunityController.getConversations as RequestHandler);
router.get('/ai-assistant/conversations/:id', authenticateAny, requireAdmin, adminCommunityController.getConversation as RequestHandler);
router.post('/ai-assistant/conversations/:id/takeover', authenticateAny, requireAdmin, adminCommunityController.takeoverConversation as RequestHandler);
router.get('/ai-assistant/stats', authenticateAny, requireAdmin, adminCommunityController.getAssistantStats as RequestHandler);
router.get('/ai-assistant/config', authenticateAny, requireAdmin, adminCommunityController.getAssistantConfig as RequestHandler);
router.put('/ai-assistant/config', authenticateAny, requireAdmin, adminCommunityController.updateAssistantConfig as RequestHandler);

// ===== 活動管理路由 =====

router.get('/events', authenticateAny, requireAdmin, adminEventsController.listEvents as RequestHandler);
router.post('/events', authenticateAny, requireAdmin, adminEventsController.createEvent as RequestHandler);
router.put('/events/:id', authenticateAny, requireAdmin, adminEventsController.updateEvent as RequestHandler);
router.delete('/events/:id', authenticateAny, requireAdmin, adminEventsController.deleteEvent as RequestHandler);
router.get('/events/:id/rsvps', authenticateAny, requireAdmin, adminEventsController.getRsvps as RequestHandler);
router.post('/events/:id/checkin', authenticateAny, requireAdmin, adminEventsController.checkinUser as RequestHandler);
router.get('/events/:id/analytics', authenticateAny, requireAdmin, adminEventsController.getEventAnalytics as RequestHandler);
router.get('/events/templates', authenticateAny, requireAdmin, adminEventsController.listTemplates as RequestHandler);
router.post('/events/templates', authenticateAny, requireAdmin, adminEventsController.createTemplate as RequestHandler);
router.post('/events/templates/:id/generate', authenticateAny, requireAdmin, adminEventsController.generateFromTemplate as RequestHandler);
router.get('/events/:id/recordings', authenticateAny, requireAdmin, adminEventsController.listRecordings as RequestHandler);
router.post('/events/:id/recordings', authenticateAny, requireAdmin, adminEventsController.uploadRecording as RequestHandler);
router.delete('/events/recordings/:id', authenticateAny, requireAdmin, adminEventsController.deleteRecording as RequestHandler);
router.post('/events/:id/remind', authenticateAny, requireAdmin, adminEventsController.sendReminder as RequestHandler);


// ===== 問卷管理路由 =====

router.get('/surveys', authenticateAny, requireAdmin, adminSurveyController.listSurveys as RequestHandler);
router.post('/surveys', authenticateAny, requireAdmin, adminSurveyController.createSurvey as RequestHandler);
router.get('/surveys/:id', authenticateAny, requireAdmin, adminSurveyController.getSurvey as RequestHandler);
router.patch('/surveys/:id/status', authenticateAny, requireAdmin, adminSurveyController.updateStatus as RequestHandler);
router.put('/surveys/:id', authenticateAny, requireAdmin, adminSurveyController.updateSurvey as RequestHandler);
router.delete('/surveys/:id', authenticateAny, requireAdmin, adminSurveyController.deleteSurvey as RequestHandler);
router.get('/surveys/:id/responses', authenticateAny, requireAdmin, adminSurveyController.listResponses as RequestHandler);
router.get('/surveys/:id/responses/:responseId', authenticateAny, requireAdmin, adminSurveyController.getResponse as RequestHandler);
router.delete('/surveys/:id/responses/:responseId', authenticateAny, requireAdmin, adminSurveyController.deleteResponse as RequestHandler);
router.get('/surveys/:id/analytics', authenticateAny, requireAdmin, adminSurveyController.getAnalytics as RequestHandler);

// ─── Content Performance ──────────────────────────────────────────────────────
router.get('/content/performance', authenticateAny, requireAdmin, adminContentController.getPerformance as RequestHandler);
router.get('/content/checkins', authenticateAny, requireAdmin, adminContentController.getCheckins as RequestHandler);
router.patch('/content/:id/featured', authenticateAny, requireAdmin, adminContentController.updateFeatured as RequestHandler);

// ─── Tracking & Analytics ─────────────────────────────────────────────────────
router.get('/onboarding/stats', authenticateAny, requireAdmin, adminTrackingController.getOnboardingStats as RequestHandler);
router.get('/users/:userId/onboarding', authenticateAny, requireAdmin, adminTrackingController.getUserOnboardingDetail as RequestHandler);
router.get('/quiz/stats', authenticateAny, requireAdmin, adminTrackingController.getQuizStats as RequestHandler);
router.get('/persona/stats', authenticateAny, requireAdmin, adminTrackingController.getPersonaStats as RequestHandler);
router.get('/email/onboarding-stats', authenticateAny, requireAdmin, adminTrackingController.getEmailOnboardingStats as RequestHandler);
router.get('/engagement/stats', authenticateAny, requireAdmin, adminTrackingController.getEngagementStats as RequestHandler);
router.get('/metrics/drilldown', authenticateAny, requireAdmin, adminTrackingController.getMetricDrillDown as RequestHandler);

export default router;
