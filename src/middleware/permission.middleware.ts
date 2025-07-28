/**
 * 權限中間件
 * 提供基於角色和權限的存取控制
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import { permissionService } from '../services/auth/permission.service';
import { PERMISSIONS, ROLES } from '../constants';
import { UnauthorizedError, ForbiddenError } from '../utils/error-handler';
import type { PermissionOptions, UserJwtPayload } from '../types/auth.types';

// Use UserJwtPayload type alias for consistency
type AuthUser = UserJwtPayload;

/**
 * 權限檢查中間件選項
 */
interface PermissionMiddlewareOptions {
  permissions?: PermissionOptions[];
  roles?: string[];
  requireAll?: boolean; // 是否需要所有權限（預設 false，表示任一即可）
  allowTemp?: boolean; // 是否允許臨時用戶
  allowSelf?: boolean; // 是否允許對自己的資源操作
  resourceParam?: string; // 資源 ID 參數名（用於所有權檢查）
  resourceType?: string; // 資源類型（用於所有權檢查）
}

/**
 * 基本權限檢查中間件
 */
export const requirePermission = (
  permissions: PermissionOptions | PermissionOptions[],
  options: Omit<PermissionMiddlewareOptions, 'permissions'> = {}
): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user as UserJwtPayload;
      
      if (!user) {
        throw new UnauthorizedError('請先登入');
      }

      // 檢查是否允許臨時用戶
      if (user.isTemp && !options.allowTemp) {
        throw new ForbiddenError('臨時用戶無權限執行此操作');
      }

      const permissionList = Array.isArray(permissions) ? permissions : [permissions];
      const { requireAll = false } = options;

      let hasPermission: boolean;
      
      if (requireAll) {
        const permissions = permissionList.map(p => `${p.resource}:${p.action}`);
        hasPermission = await permissionService.hasAllPermissions(user.id, permissions);
      } else {
        // hasAnyPermission 方法暫時不存在，用循環檢查
        hasPermission = false;
        for (const permission of permissionList) {
          const has = await permissionService.hasPermission(user.id, permission.resource, permission.action);
          if (has) {
            hasPermission = true;
            break;
          }
        }
      }

      // 檢查自有資源權限
      if (!hasPermission && options.allowSelf && options.resourceParam && options.resourceType) {
        const resourceId = parseInt(req.params[options.resourceParam]);
        if (resourceId && !isNaN(resourceId)) {
          hasPermission = await permissionService.isResourceOwner(
            user.id, 
            options.resourceType, 
            resourceId
          );
        }
      }

      if (!hasPermission) {
        throw new ForbiddenError('權限不足');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * 角色檢查中間件
 */
export const requireRole = (
  roles: string | string[],
  options: Pick<PermissionMiddlewareOptions, 'allowTemp'> = {}
): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user as UserJwtPayload;
      
      if (!user) {
        throw new UnauthorizedError('請先登入');
      }

      // 檢查是否允許臨時用戶
      if (user.isTemp && !options.allowTemp) {
        throw new ForbiddenError('臨時用戶無權限執行此操作');
      }

      const roleList = Array.isArray(roles) ? roles : [roles];
      const hasRole = await permissionService.hasAnyRole(user.id, roleList);

      if (!hasRole) {
        throw new ForbiddenError('角色權限不足');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * 管理員權限中間件
 */
export const requireAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user as UserJwtPayload;
    
    if (!user) {
      throw new UnauthorizedError('請先登入');
    }

    if (user.isTemp) {
      throw new ForbiddenError('臨時用戶無管理員權限');
    }

    const isAdmin = await permissionService.isAdmin(user.id);
    
    if (!isAdmin) {
      throw new ForbiddenError('需要管理員權限');
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * 超級管理員權限中間件
 */
export const requireSuperAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user as UserJwtPayload;
    
    if (!user) {
      throw new UnauthorizedError('請先登入');
    }

    if (user.isTemp) {
      throw new ForbiddenError('臨時用戶無超級管理員權限');
    }

    const isSuperAdmin = await permissionService.isSuperAdmin(user.id);
    
    if (!isSuperAdmin) {
      throw new ForbiddenError('需要超級管理員權限');
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * 資源所有者權限中間件
 */
export const requireOwnership = (
  resourceType: string,
  resourceParam = 'id'
): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user as UserJwtPayload;
      
      if (!user) {
        throw new UnauthorizedError('請先登入');
      }

      const resourceId = parseInt(req.params[resourceParam]);
      
      if (!resourceId || isNaN(resourceId)) {
        throw new ForbiddenError('無效的資源 ID');
      }

      // 管理員有所有權限
      if (await permissionService.isAdmin(user.id)) {
        return next();
      }

      const isOwner = await permissionService.isResourceOwner(
        user.id, 
        resourceType, 
        resourceId
      );

      if (!isOwner) {
        throw new ForbiddenError('您沒有權限存取此資源');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * 組合權限中間件
 * 允許設定複雜的權限組合邏輯
 */
export const requireAnyOf = (...middlewares: Array<(req: Request, res: Response, next: NextFunction) => void>): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    let lastError: Error | null = null;
    
    for (const middleware of middlewares) {
      try {
        await new Promise<void>((resolve, reject) => {
          middleware(req, res, (error) => {
            if (error) {
              reject(error);
            } else {
              resolve();
            }
          });
        });
        
        // 如果有任一中間件通過，就繼續
        return next();
      } catch (error) {
        lastError = error as Error;
        continue;
      }
    }
    
    // 如果所有中間件都失敗，拋出最後一個錯誤
    next(lastError || new ForbiddenError('權限不足'));
  };
};

/**
 * 常用權限中間件組合
 */
// 輔助函數：將權限字符串轉換為 PermissionOptions
const parsePermission = (permission: string): PermissionOptions => {
  if (!permission || typeof permission !== 'string') {
    throw new Error(`Invalid permission string: ${permission}`);
  }
  const [resource, action] = permission.split(':');
  if (!resource || !action) {
    throw new Error(`Invalid permission format: ${permission}. Expected format: 'resource:action'`);
  }
  return { resource, action };
};

// 延遲初始化權限中間件，確保常數已正確加載
export const canReadUser = (): RequestHandler => requirePermission(parsePermission(PERMISSIONS.USER.READ), { allowSelf: true, resourceType: 'user', resourceParam: 'id' });
export const canUpdateUser = (): RequestHandler => requirePermission(parsePermission(PERMISSIONS.USER.UPDATE), { allowSelf: true, resourceType: 'user', resourceParam: 'id' });
export const canDeleteUser = (): RequestHandler => requirePermission(parsePermission(PERMISSIONS.USER.DELETE));
export const canCreateUser = (): RequestHandler => requirePermission(parsePermission(PERMISSIONS.USER.CREATE));

export const canReadProject = (): RequestHandler => requirePermission(parsePermission(PERMISSIONS.PROJECT.READ), { allowSelf: true, resourceType: 'project', resourceParam: 'id' });
export const canUpdateProject = (): RequestHandler => requirePermission(parsePermission(PERMISSIONS.PROJECT.UPDATE), { allowSelf: true, resourceType: 'project', resourceParam: 'id' });
export const canDeleteProject = (): RequestHandler => requirePermission(parsePermission(PERMISSIONS.PROJECT.DELETE), { allowSelf: true, resourceType: 'project', resourceParam: 'id' });
export const canCreateProject = (): RequestHandler => requirePermission(parsePermission(PERMISSIONS.PROJECT.CREATE), { allowTemp: true });

export const canReadResource = (): RequestHandler => requirePermission(parsePermission(PERMISSIONS.RESOURCE.READ));
export const canUpdateResource = (): RequestHandler => requirePermission(parsePermission(PERMISSIONS.RESOURCE.UPDATE));
export const canDeleteResource = (): RequestHandler => requirePermission(parsePermission(PERMISSIONS.RESOURCE.DELETE));
export const canCreateResource = (): RequestHandler => requirePermission(parsePermission(PERMISSIONS.RESOURCE.CREATE), { allowTemp: true });

export const canAccessAdminPanel = (): RequestHandler => requirePermission(parsePermission(PERMISSIONS.ADMIN.DASHBOARD));
export const canConfigSystem = (): RequestHandler => requirePermission(parsePermission(PERMISSIONS.ADMIN.SETTINGS));
export const canModerateContent = (): RequestHandler => requirePermission(parsePermission(PERMISSIONS.ADMIN.MODERATE));
export const canViewAnalytics = (): RequestHandler => requirePermission(parsePermission(PERMISSIONS.ADMIN.ANALYTICS));

// 審核相關權限
export const canApproveContent = (): RequestHandler => requirePermission(parsePermission(PERMISSIONS.MODERATION.APPROVE));
export const canRejectContent = (): RequestHandler => requirePermission(parsePermission(PERMISSIONS.MODERATION.REJECT));
export const canSuspendUser = (): RequestHandler => requirePermission(parsePermission(PERMISSIONS.MODERATION.SUSPEND));
export const canFlagContent = (): RequestHandler => requirePermission(parsePermission(PERMISSIONS.MODERATION.FLAG));
export const canReviewContent = (): RequestHandler => requirePermission(parsePermission(PERMISSIONS.MODERATION.REVIEW));

// 心得評價權限
export const canCreateReview = (): RequestHandler => requirePermission(parsePermission(PERMISSIONS.REVIEW.CREATE), { allowTemp: true });
export const canUpdateReview = (): RequestHandler => requirePermission(parsePermission(PERMISSIONS.REVIEW.UPDATE), { allowSelf: true, resourceType: 'review', resourceParam: 'id' });
export const canDeleteReview = (): RequestHandler => requirePermission(parsePermission(PERMISSIONS.REVIEW.DELETE), { allowSelf: true, resourceType: 'review', resourceParam: 'id' });
export const canModerateReview = (): RequestHandler => requirePermission(parsePermission(PERMISSIONS.REVIEW.MODERATE));

// 想法管理權限
export const canCreateIdea = (): RequestHandler => requirePermission(parsePermission(PERMISSIONS.IDEA.CREATE), { allowTemp: true });
export const canUpdateIdea = (): RequestHandler => requirePermission(parsePermission(PERMISSIONS.IDEA.UPDATE), { allowSelf: true, resourceType: 'idea', resourceParam: 'id' });
export const canDeleteIdea = (): RequestHandler => requirePermission(parsePermission(PERMISSIONS.IDEA.DELETE), { allowSelf: true, resourceType: 'idea', resourceParam: 'id' });

// 標籤管理權限
export const canCreateTag = (): RequestHandler => requirePermission(parsePermission(PERMISSIONS.TAG.CREATE));
export const canUpdateTag = (): RequestHandler => requirePermission(parsePermission(PERMISSIONS.TAG.UPDATE));
export const canDeleteTag = (): RequestHandler => requirePermission(parsePermission(PERMISSIONS.TAG.DELETE));

// 角色中間件
export const requireUserRole: RequestHandler = requireRole(ROLES.USER, { allowTemp: true });
export const requireModeratorRole: RequestHandler = requireRole(ROLES.MODERATOR);
export const requireAdminRole: RequestHandler = requireRole([ROLES.ADMIN, ROLES.SUPER_ADMIN]);

/**
 * 權限檢查輔助函數
 */
export const checkPermission = {
  /**
   * 檢查用戶是否可以存取資源
   */
  async canAccess(
    user: AuthUser, 
    permissions: PermissionOptions[], 
    options: PermissionMiddlewareOptions = {}
  ): Promise<boolean> {
    if (!user) return false;
    
    if (user.isTemp && !options.allowTemp) return false;
    
    const { requireAll = false } = options;
    
    if (requireAll) {
      const permissionStrings = permissions.map(p => `${p.resource}:${p.action}`);
      return await permissionService.hasAllPermissions(user.id, permissionStrings);
    } else {
      // hasAnyPermission 方法暫時不存在，用循環檢查
      for (const permission of permissions) {
        const has = await permissionService.hasPermission(user.id, permission.resource, permission.action);
        if (has) {
          return true;
        }
      }
      return false;
    }
  },

  /**
   * 檢查用戶是否有角色
   */
  async hasRole(user: AuthUser, roles: string[]): Promise<boolean> {
    if (!user || user.isTemp) return false;
    return await permissionService.hasAnyRole(user.id, roles);
  },

  /**
   * 檢查用戶是否為資源所有者
   */
  async isOwner(user: AuthUser, resourceType: string, resourceId: number): Promise<boolean> {
    if (!user) return false;
    return await permissionService.isResourceOwner(user.id, resourceType, resourceId);
  }
};

export default {
  requirePermission,
  requireRole,
  requireAdmin,
  requireSuperAdmin,
  requireOwnership,
  requireAnyOf,
  checkPermission,
  // 用戶權限
  canReadUser,
  canUpdateUser,
  canDeleteUser,
  canCreateUser,
  // 專案權限
  canReadProject,
  canUpdateProject,
  canDeleteProject,
  canCreateProject,
  // 資源權限
  canReadResource,
  canUpdateResource,
  canDeleteResource,
  canCreateResource,
  // 心得評價權限
  canCreateReview,
  canUpdateReview,
  canDeleteReview,
  canModerateReview,
  // 想法權限
  canCreateIdea,
  canUpdateIdea,
  canDeleteIdea,
  // 標籤權限
  canCreateTag,
  canUpdateTag,
  canDeleteTag,
  // 管理權限
  canAccessAdminPanel,
  canConfigSystem,
  canModerateContent,
  canViewAnalytics,
  // 審核權限
  canApproveContent,
  canRejectContent,
  canSuspendUser,
  canFlagContent,
  canReviewContent,
  // 角色權限
  requireUserRole,
  requireModeratorRole,
  requireAdminRole
};