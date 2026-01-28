/**
 * 角色常量定義
 * 定義系統中所有可用的角色
 */

export const ROLES = {
  // 超級管理員 - 擁有所有權限
  SUPER_ADMIN: 'super_admin',
  
  // 管理員 - 擁有大部分管理權限
  ADMIN: 'admin',
  
  // 審核員 - 負責內容審核
  MODERATOR: 'moderator',
  
  // 編輯者 - 可以創建和編輯內容
  EDITOR: 'editor',
  
  // 一般用戶 - 基本權限
  USER: 'user',
  
  // 訪客 - 只能閱讀
  GUEST: 'guest'
} as const;

// 角色層級定義（數字越大權限越高）
export const ROLE_HIERARCHY = {
  [ROLES.GUEST]: 0,
  [ROLES.USER]: 1,
  [ROLES.EDITOR]: 2,
  [ROLES.MODERATOR]: 3,
  [ROLES.ADMIN]: 4,
  [ROLES.SUPER_ADMIN]: 5
} as const;

// 所有角色列表
export const ALL_ROLES = Object.values(ROLES);

// 角色類型
export type RoleValue = typeof ALL_ROLES[number];

/**
 * 檢查角色層級
 * @param userRole 用戶角色
 * @param requiredRole 需要的角色
 * @returns 是否滿足角色要求
 */
export function hasRoleLevel(userRole: RoleValue, requiredRole: RoleValue): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * 獲取角色的中文名稱
 */
export const ROLE_NAMES = {
  [ROLES.SUPER_ADMIN]: '超級管理員',
  [ROLES.ADMIN]: '管理員',
  [ROLES.MODERATOR]: '審核員',
  [ROLES.EDITOR]: '編輯者',
  [ROLES.USER]: '一般用戶',
  [ROLES.GUEST]: '訪客'
} as const;