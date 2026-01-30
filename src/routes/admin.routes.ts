/**
 * 管理員路由
 * 處理角色與權限管理的路由定義
 */

import { Router, RequestHandler } from 'express';
import { registry } from '../config/openapi-registry';
import adminController from '@/controllers/admin.controller';
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

export default router;
