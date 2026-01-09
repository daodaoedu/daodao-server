/**
 * 常量統一導出
 * 集中管理所有應用常量
 */

// 權限相關常量
export { 
  PERMISSIONS, 
  ALL_PERMISSIONS, 
  type PermissionValue 
} from './permissions';

// 角色相關常量
export { 
  ROLES, 
  ROLE_HIERARCHY, 
  ALL_ROLES, 
  ROLE_NAMES,
  type RoleValue,
  hasRoleLevel 
} from './roles';

// HTTP 狀態碼常量
export { HTTP_STATUS, type HttpStatusType } from './http-status';

// 映射常量
export * from './mappings';

// 其他常量可以在這裡添加
// export { API_ENDPOINTS } from './api';
// export { ERROR_CODES } from './errors';