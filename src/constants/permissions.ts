/**
 * 權限常量定義
 * 定義系統中所有可用的權限
 */

export const PERMISSIONS = {
  // 資源管理權限
  RESOURCE: {
    CREATE: 'resource:create',
    READ: 'resource:read',
    UPDATE: 'resource:update',
    DELETE: 'resource:delete',
    APPROVE: 'resource:approve',
    REJECT: 'resource:reject'
  },
  
  // 心得評價權限
  REVIEW: {
    CREATE: 'review:create',
    READ: 'review:read',
    UPDATE: 'review:update',
    DELETE: 'review:delete',
    MODERATE: 'review:moderate'
  },
  
  // 用戶管理權限
  USER: {
    CREATE: 'user:create',
    READ: 'user:read',
    UPDATE: 'user:update',
    DELETE: 'user:delete',
    MANAGE: 'user:manage'
  },
  
  // 想法管理權限
  IDEA: {
    CREATE: 'idea:create',
    READ: 'idea:read',
    UPDATE: 'idea:update',
    DELETE: 'idea:delete'
  },
  
  // 標籤管理權限
  TAG: {
    CREATE: 'tag:create',
    READ: 'tag:read',
    UPDATE: 'tag:update',
    DELETE: 'tag:delete'
  },
  
  // 專案管理權限
  PROJECT: {
    CREATE: 'project:create',
    READ: 'project:read',
    UPDATE: 'project:update',
    DELETE: 'project:delete',
    PUBLISH: 'project:publish',
    MANAGE: 'project:manage'
  },
  
  // 里程碑管理權限
  MILESTONE: {
    CREATE: 'milestone:create',
    READ: 'milestone:read',
    UPDATE: 'milestone:update',
    DELETE: 'milestone:delete'
  },
  
  // 任務管理權限
  TASK: {
    CREATE: 'task:create',
    READ: 'task:read',
    UPDATE: 'task:update',
    DELETE: 'task:delete',
    COMPLETE: 'task:complete'
  },
  
  // 筆記管理權限
  NOTE: {
    CREATE: 'note:create',
    READ: 'note:read',
    UPDATE: 'note:update',
    DELETE: 'note:delete',
    PUBLISH: 'note:publish'
  },
  
  // 成果管理權限
  OUTCOME: {
    CREATE: 'outcome:create',
    READ: 'outcome:read',
    UPDATE: 'outcome:update',
    DELETE: 'outcome:delete',
    PUBLISH: 'outcome:publish'
  },
  
  // 系統管理權限
  ADMIN: {
    DASHBOARD: 'admin:dashboard',
    SETTINGS: 'admin:settings',
    LOGS: 'admin:logs',
    BACKUP: 'admin:backup',
    MODERATE: 'admin:moderate',
    ANALYTICS: 'admin:analytics'
  },

  // 內容審核權限
  MODERATION: {
    APPROVE: 'moderation:approve',
    REJECT: 'moderation:reject',
    SUSPEND: 'moderation:suspend',
    FLAG: 'moderation:flag',
    REVIEW: 'moderation:review'
  },

  // 系統操作權限
  SYSTEM: {
    BACKUP: 'system:backup',
    RESTORE: 'system:restore',
    MAINTENANCE: 'system:maintenance',
    CONFIG: 'system:config'
  }
} as const;

// 扁平化權限列表，便於檢查
export const ALL_PERMISSIONS = Object.values(PERMISSIONS)
  .flatMap(category => Object.values(category));

// 權限類型
export type PermissionValue = typeof ALL_PERMISSIONS[number];