/**
 * Admin Validators
 * 管理員 API 驗證器 - 使用 Zod 進行資料驗證
 */

import { z } from 'zod';
import { apiSuccessResponseSchema } from './api-response.validators';
import { registry } from '../config/openapi-registry';

// ===== 基礎 Schemas =====

/**
 * 角色名稱驗證
 */
const roleNameSchema = z.string()
  .min(1, '角色名稱不能為空')
  .max(255, '角色名稱不能超過 255 字元')
  .describe('角色名稱')
  .openapi({ description: '角色名稱', example: 'Admin' });

/**
 * 權限名稱驗證（格式：resource:action）
 */
const permissionNameSchema = z.string()
  .min(1, '權限名稱不能為空')
  .max(255, '權限名稱不能超過 255 字元')
  .regex(/^[a-zA-Z0-9_]+:[a-zA-Z0-9_]+$/, '權限名稱格式必須為 resource:action')
  .describe('權限名稱')
  .openapi({ description: '權限名稱（格式：resource:action）', example: 'user:read' });

/**
 * 描述欄位驗證
 */
const descriptionSchema = z.string()
  .max(1000, '描述不能超過 1000 字元')
  .optional()
  .describe('描述')
  .openapi({ description: '描述', example: '管理員角色' });

// ===== 角色相關 Schemas =====

/**
 * 創建角色請求
 */
export const createRoleSchema = z.object({
  name: roleNameSchema,
  description: descriptionSchema
}).describe('創建角色請求');

/**
 * 更新角色請求
 */
export const updateRoleSchema = z.object({
  name: roleNameSchema.optional(),
  description: descriptionSchema
}).describe('更新角色請求');

/**
 * 角色實體 Schema
 */
export const roleEntitySchema = z.object({
  id: z.number().openapi({ description: '角色 ID', example: 1 }),
  name: z.string().openapi({ description: '角色名稱', example: 'Admin' }),
  description: z.string().nullable().openapi({ description: '角色描述', example: '管理員角色' }),
  created_at: z.string().optional().openapi({ description: '創建時間', example: '2024-01-15T10:30:00.000Z' }),
  updated_at: z.string().optional().openapi({ description: '更新時間', example: '2024-01-15T10:30:00.000Z' })
}).openapi('RoleEntity', {
  description: '角色實體'
});

// 註冊 RoleEntity
registry.register('RoleEntity', roleEntitySchema);

/**
 * 權限實體 Schema
 */
export const permissionEntitySchema = z.object({
  id: z.number().openapi({ description: '權限 ID', example: 1 }),
  name: z.string().openapi({ description: '權限名稱', example: 'user:read' }),
  description: z.string().nullable().openapi({ description: '權限描述', example: '讀取用戶資料' }),
  created_at: z.string().optional().openapi({ description: '創建時間', example: '2024-01-15T10:30:00.000Z' }),
  updated_at: z.string().optional().openapi({ description: '更新時間', example: '2024-01-15T10:30:00.000Z' })
}).openapi('PermissionEntity', {
  description: '權限實體'
});

// 註冊 PermissionEntity
registry.register('PermissionEntity', permissionEntitySchema);

/**
 * 角色（含權限）Schema
 */
export const roleWithPermissionsSchema = z.object({
  id: z.number().openapi({ description: '角色 ID', example: 1 }),
  name: z.string().openapi({ description: '角色名稱', example: 'Admin' }),
  description: z.string().nullable().openapi({ description: '角色描述', example: '管理員角色' }),
  permissions: z.array(permissionEntitySchema).openapi({ description: '權限列表' }),
  created_at: z.string().optional().openapi({ description: '創建時間', example: '2024-01-15T10:30:00.000Z' }),
  updated_at: z.string().optional().openapi({ description: '更新時間', example: '2024-01-15T10:30:00.000Z' })
}).openapi('RoleWithPermissions', {
  description: '角色（含權限）'
});

// 註冊 RoleWithPermissions
registry.register('RoleWithPermissions', roleWithPermissionsSchema);

// ===== 權限相關 Schemas =====

/**
 * 創建權限請求
 */
export const createPermissionSchema = z.object({
  name: permissionNameSchema,
  description: descriptionSchema
}).describe('創建權限請求');

/**
 * 更新權限請求
 */
export const updatePermissionSchema = z.object({
  name: permissionNameSchema.optional(),
  description: descriptionSchema
}).describe('更新權限請求');

// ===== 角色權限關聯 Schemas =====

/**
 * 新增角色權限請求
 */
export const addRolePermissionSchema = z.object({
  permissionId: z.number().int().positive('權限 ID 必須為正整數')
    .openapi({ description: '權限 ID', example: 1 })
}).describe('新增角色權限請求');

// ===== 用戶角色 Schemas =====

/**
 * 更新用戶角色請求
 */
export const updateUserRoleSchema = z.object({
  roleId: z.number().int().positive('角色 ID 必須為正整數')
    .openapi({ description: '角色 ID', example: 2 })
}).describe('更新用戶角色請求');

/**
 * 用戶角色資訊 Schema
 */
export const userRoleInfoSchema = z.object({
  userId: z.number().openapi({ description: '用戶 ID', example: 123 }),
  role: roleEntitySchema.nullable().openapi({ description: '用戶角色' })
}).openapi('UserRoleInfo', {
  description: '用戶角色資訊'
});

// 註冊 UserRoleInfo
registry.register('UserRoleInfo', userRoleInfoSchema);

// ===== 路徑參數 Schemas =====

/**
 * 角色 ID 參數
 */
export const roleIdParamSchema = z.object({
  id: z.string()
    .regex(/^\d+$/, '角色 ID 必須為數字')
    .openapi({
      description: '角色 ID',
      example: '1',
      param: {
        name: 'id',
        in: 'path'
      }
    })
}).describe('角色 ID 參數');

// 註冊 RoleIdParam
registry.register('RoleIdParam', roleIdParamSchema);

/**
 * 權限 ID 參數
 */
export const permissionIdParamSchema = z.object({
  id: z.string()
    .regex(/^\d+$/, '權限 ID 必須為數字')
    .openapi({
      description: '權限 ID',
      example: '1',
      param: {
        name: 'id',
        in: 'path'
      }
    })
}).describe('權限 ID 參數');

// 註冊 PermissionIdParam
registry.register('PermissionIdParam', permissionIdParamSchema);

/**
 * 角色 ID 參數（用於角色權限關聯）
 */
export const roleIdForPermissionParamSchema = z.object({
  roleId: z.string()
    .regex(/^\d+$/, '角色 ID 必須為數字')
    .openapi({
      description: '角色 ID',
      example: '1',
      param: {
        name: 'roleId',
        in: 'path'
      }
    })
}).describe('角色 ID 參數');

// 註冊 RoleIdForPermissionParam
registry.register('RoleIdForPermissionParam', roleIdForPermissionParamSchema);

/**
 * 角色權限 ID 參數
 */
export const rolePermissionParamSchema = z.object({
  roleId: z.string()
    .regex(/^\d+$/, '角色 ID 必須為數字')
    .openapi({
      description: '角色 ID',
      example: '1',
      param: {
        name: 'roleId',
        in: 'path'
      }
    }),
  permissionId: z.string()
    .regex(/^\d+$/, '權限 ID 必須為數字')
    .openapi({
      description: '權限 ID',
      example: '1',
      param: {
        name: 'permissionId',
        in: 'path'
      }
    })
}).describe('角色權限 ID 參數');

// 註冊 RolePermissionParam
registry.register('RolePermissionParam', rolePermissionParamSchema);

/**
 * 用戶 ID 參數
 */
export const userIdParamSchema = z.object({
  userId: z.string()
    .regex(/^\d+$/, '用戶 ID 必須為數字')
    .openapi({
      description: '用戶 ID',
      example: '123',
      param: {
        name: 'userId',
        in: 'path'
      }
    })
}).describe('用戶 ID 參數');

// 註冊 UserIdParam
registry.register('UserIdParam', userIdParamSchema);

// ===== API Response Schemas =====

// 角色列表回應
export const getRolesApiResponseSchema = apiSuccessResponseSchema(z.array(roleEntitySchema));

// 單一角色回應
export const getRoleApiResponseSchema = apiSuccessResponseSchema(roleEntitySchema);

// 角色（含權限）回應
export const getRoleWithPermissionsApiResponseSchema = apiSuccessResponseSchema(roleWithPermissionsSchema);

// 創建/更新角色回應
export const mutateRoleApiResponseSchema = apiSuccessResponseSchema(roleEntitySchema);

// 刪除角色回應
export const deleteRoleApiResponseSchema = apiSuccessResponseSchema(z.object({
  deleted: z.boolean().openapi({ description: '是否刪除成功', example: true })
}));

// 權限列表回應
export const getPermissionsApiResponseSchema = apiSuccessResponseSchema(z.array(permissionEntitySchema));

// 單一權限回應
export const getPermissionApiResponseSchema = apiSuccessResponseSchema(permissionEntitySchema);

// 創建/更新權限回應
export const mutatePermissionApiResponseSchema = apiSuccessResponseSchema(permissionEntitySchema);

// 刪除權限回應
export const deletePermissionApiResponseSchema = apiSuccessResponseSchema(z.object({
  deleted: z.boolean().openapi({ description: '是否刪除成功', example: true })
}));

// 角色權限操作回應
export const rolePermissionApiResponseSchema = apiSuccessResponseSchema(z.object({
  success: z.boolean().openapi({ description: '操作是否成功', example: true })
}));

// 用戶角色回應
export const getUserRoleApiResponseSchema = apiSuccessResponseSchema(userRoleInfoSchema);

// 更新用戶角色回應
export const updateUserRoleApiResponseSchema = apiSuccessResponseSchema(z.object({
  success: z.boolean().openapi({ description: '操作是否成功', example: true })
}));

// ===== 類型導出 =====

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type CreatePermissionInput = z.infer<typeof createPermissionSchema>;
export type UpdatePermissionInput = z.infer<typeof updatePermissionSchema>;
export type AddRolePermissionInput = z.infer<typeof addRolePermissionSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;

export type RoleEntity = z.infer<typeof roleEntitySchema>;
export type PermissionEntity = z.infer<typeof permissionEntitySchema>;
export type RoleWithPermissions = z.infer<typeof roleWithPermissionsSchema>;
export type UserRoleInfo = z.infer<typeof userRoleInfoSchema>;
