/**
 * 使用者統計路由定義
 * 所有路由僅限管理員訪問
 */

import { Router } from 'express';
import { z } from 'zod';
import { registry } from '../config/openapi-registry';
import userStatsController from '@/controllers/user-stats-controller';
import { authenticateAny } from '../middleware/auth';
import { requireAdmin } from '../middleware/permission.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  registrationStatsQuerySchema,
  activityStatsQuerySchema,
  exportStatsQuerySchema,
  deviceAnalyticsQuerySchema,
  retentionQuerySchema,
  popularProfilesQuerySchema
} from '@/validators/user-stats.validator';

const router = Router();

// ============================================================================
// OpenAPI 路由定義
// ============================================================================

// 標準回應格式 Schema
const successResponseSchema = z.object({
  success: z.literal(true),
  data: z.any(),
  metadata: z.object({
    generated_at: z.string()
  }).optional()
});

/**
 * GET /api/v1/admin/user-stats/overview - 獲取總覽儀表板
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/user-stats/overview',
  tags: ['User Statistics'],
  summary: '獲取總覽儀表板',
  description: '返回使用者統計的關鍵指標摘要，包括總使用者數、本月新增、增長率、活躍使用者等',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: '成功返回總覽統計',
      content: {
        'application/json': {
          schema: z.object({
            success: z.literal(true),
            data: z.object({
              totalUsers: z.number().describe('總使用者數'),
              newUsersThisMonth: z.number().describe('本月新增使用者數'),
              newUsersLastMonth: z.number().describe('上月新增使用者數'),
              growthRate: z.number().describe('增長率（百分比）'),
              activeUsers: z.number().describe('活躍使用者數（最近30天）'),
              activeRate: z.number().describe('活躍率（百分比）')
            }),
            metadata: z.object({
              generated_at: z.string()
            })
          }).openapi({ description: '總覽統計響應' })
        }
      }
    },
    401: { description: '未授權' },
    403: { description: '權限不足（需要管理員權限）' }
  }
});

/**
 * GET /api/v1/admin/user-stats/registrations - 獲取註冊統計
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/user-stats/registrations',
  tags: ['User Statistics'],
  summary: '獲取註冊統計',
  description: '根據不同維度（時間、地區、角色、教育階段）獲取使用者註冊統計資料',
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      groupBy: z.enum(['day', 'week', 'month', 'year', 'location', 'role', 'education_stage']).describe('統計分組方式（必選）'),
      startDate: z.string().optional().describe('開始日期（YYYY-MM-DD）'),
      endDate: z.string().optional().describe('結束日期（YYYY-MM-DD）'),
      locationId: z.string().optional().describe('地區 ID 篩選'),
      roleId: z.string().optional().describe('角色 ID 篩選'),
      educationStage: z.string().optional().describe('教育階段篩選'),
      limit: z.string().optional().describe('分頁限制（最大 1000）'),
      offset: z.string().optional().describe('分頁偏移')
    })
  },
  responses: {
    200: {
      description: '成功返回註冊統計',
      content: {
        'application/json': {
          schema: successResponseSchema.openapi({ description: '註冊統計響應' })
        }
      }
    },
    400: { description: '參數錯誤' },
    401: { description: '未授權' },
    403: { description: '權限不足' }
  }
});

/**
 * GET /api/v1/admin/user-stats/activity - 獲取活躍度統計
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/user-stats/activity',
  tags: ['User Statistics'],
  summary: '獲取活躍度統計',
  description: '分析使用者活躍度，可選擇按角色、地區或教育階段分組',
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      activeWithinDays: z.string().optional().describe('活躍度時間範圍（天數，最大 365）'),
      groupBy: z.enum(['role', 'location', 'education_stage']).optional().describe('統計分組方式'),
      limit: z.string().optional().describe('分頁限制（最大 1000）'),
      offset: z.string().optional().describe('分頁偏移')
    })
  },
  responses: {
    200: {
      description: '成功返回活躍度統計',
      content: {
        'application/json': {
          schema: z.object({
            success: z.literal(true),
            data: z.object({
              activeUsers: z.number().describe('活躍使用者數'),
              inactiveUsers: z.number().describe('非活躍使用者數'),
              totalUsers: z.number().describe('總使用者數'),
              activeRate: z.number().describe('活躍率（百分比）'),
              breakdown: z.any().optional().describe('細分統計')
            }),
            metadata: z.object({
              activeWithinDays: z.number().optional(),
              generated_at: z.string()
            })
          }).openapi({ description: '活躍度統計響應' })
        }
      }
    },
    400: { description: '參數錯誤' },
    401: { description: '未授權' },
    403: { description: '權限不足' }
  }
});

/**
 * GET /api/v1/admin/user-stats/export - 匯出統計資料
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/user-stats/export',
  tags: ['User Statistics'],
  summary: '匯出統計資料',
  description: '將統計資料匯出為 CSV 或 Excel 格式',
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      format: z.enum(['csv', 'excel']).describe('匯出格式（必選）'),
      type: z.enum(['registrations', 'activity', 'full']).describe('匯出類型（必選）'),
      startDate: z.string().optional().describe('開始日期（YYYY-MM-DD）'),
      endDate: z.string().optional().describe('結束日期（YYYY-MM-DD）'),
      groupBy: z.enum(['day', 'week', 'month', 'year', 'location', 'role', 'education_stage']).optional().describe('統計分組方式（type=registrations 時必選）')
    })
  },
  responses: {
    200: {
      description: '成功匯出檔案',
      content: {
        'text/csv': { schema: z.string() },
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { schema: z.string() }
      }
    },
    400: { description: '參數錯誤' },
    401: { description: '未授權' },
    403: { description: '權限不足' }
  }
});

/**
 * GET /api/v1/admin/user-stats/active-users - 獲取 DAU/WAU/MAU 統計
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/user-stats/active-users',
  tags: ['User Statistics'],
  summary: '獲取 DAU/WAU/MAU 統計',
  description: '返回日活躍、週活躍、月活躍用戶統計及趨勢變化',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: '成功返回活躍用戶統計',
      content: {
        'application/json': {
          schema: z.object({
            success: z.literal(true),
            data: z.object({
              dau: z.number().describe('日活躍用戶數'),
              wau: z.number().describe('週活躍用戶數'),
              mau: z.number().describe('月活躍用戶數'),
              dauRate: z.number().describe('DAU 佔總用戶比例'),
              wauRate: z.number().describe('WAU 佔總用戶比例'),
              mauRate: z.number().describe('MAU 佔總用戶比例'),
              totalUsers: z.number().describe('總用戶數'),
              trend: z.object({
                dauTrend: z.number().describe('DAU 較昨日變化百分比'),
                wauTrend: z.number().describe('WAU 較上週變化百分比'),
                mauTrend: z.number().describe('MAU 較上月變化百分比')
              }).optional()
            }),
            metadata: z.object({
              generated_at: z.string()
            })
          }).openapi({ description: 'DAU/WAU/MAU 統計響應' })
        }
      }
    },
    401: { description: '未授權' },
    403: { description: '權限不足' }
  }
});

/**
 * GET /api/v1/admin/user-stats/device-analytics - 獲取裝置分析
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/user-stats/device-analytics',
  tags: ['User Statistics'],
  summary: '獲取裝置分析',
  description: '分析用戶登入裝置、瀏覽器和作業系統的分佈統計',
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      startDate: z.string().optional().describe('開始日期（YYYY-MM-DD）'),
      endDate: z.string().optional().describe('結束日期（YYYY-MM-DD）'),
      days: z.string().optional().describe('如果沒提供日期範圍，預設最近 N 天（最大 365）')
    })
  },
  responses: {
    200: {
      description: '成功返回裝置分析',
      content: {
        'application/json': {
          schema: z.object({
            success: z.literal(true),
            data: z.object({
              devices: z.array(z.object({
                deviceType: z.string().nullable(),
                count: z.number(),
                percentage: z.number()
              })),
              browsers: z.array(z.object({
                browser: z.string().nullable(),
                count: z.number(),
                percentage: z.number()
              })),
              operatingSystems: z.array(z.object({
                os: z.string().nullable(),
                count: z.number(),
                percentage: z.number()
              })),
              totalLogins: z.number(),
              dateRange: z.object({
                startDate: z.string(),
                endDate: z.string()
              })
            }),
            metadata: z.object({
              generated_at: z.string()
            })
          }).openapi({ description: '裝置分析響應' })
        }
      }
    },
    400: { description: '參數錯誤' },
    401: { description: '未授權' },
    403: { description: '權限不足' }
  }
});

/**
 * GET /api/v1/admin/user-stats/retention - 獲取用戶留存率
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/user-stats/retention',
  tags: ['User Statistics'],
  summary: '獲取用戶留存率',
  description: '分析用戶註冊後的留存情況，支持群組分析',
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      cohorts: z.string().optional().describe('分析的群組數量（最近 N 個群組，最大 30）'),
      trackDays: z.string().optional().describe('追蹤天數（最大 90）'),
      granularity: z.enum(['day', 'week']).optional().describe('群組粒度')
    })
  },
  responses: {
    200: {
      description: '成功返回留存率統計',
      content: {
        'application/json': {
          schema: z.object({
            success: z.literal(true),
            data: z.object({
              cohorts: z.array(z.object({
                cohortDate: z.string(),
                size: z.number(),
                retention: z.record(z.string(), z.number())
              })),
              averageRetention: z.object({
                day1: z.number(),
                day7: z.number(),
                day14: z.number(),
                day30: z.number()
              })
            }),
            metadata: z.object({
              generated_at: z.string()
            })
          }).openapi({ description: '留存率統計響應' })
        }
      }
    },
    400: { description: '參數錯誤' },
    401: { description: '未授權' },
    403: { description: '權限不足' }
  }
});

/**
 * GET /api/v1/admin/user-stats/popular-profiles - 獲取熱門檔案排行
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/user-stats/popular-profiles',
  tags: ['User Statistics'],
  summary: '獲取熱門檔案排行',
  description: '返回被瀏覽次數最多的用戶檔案排行',
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      limit: z.string().optional().describe('返回數量（最大 100）'),
      offset: z.string().optional().describe('偏移量'),
      minViews: z.string().optional().describe('最低查看次數')
    })
  },
  responses: {
    200: {
      description: '成功返回熱門檔案排行',
      content: {
        'application/json': {
          schema: z.object({
            success: z.literal(true),
            data: z.object({
              profiles: z.array(z.object({
                userId: z.number(),
                externalId: z.string(),
                nickname: z.string().nullable(),
                photoUrl: z.string().nullable(),
                profileViews: z.number(),
                lastActiveAt: z.string().nullable()
              })),
              totalCount: z.number()
            }),
            metadata: z.object({
              generated_at: z.string()
            })
          }).openapi({ description: '熱門檔案排行響應' })
        }
      }
    },
    400: { description: '參數錯誤' },
    401: { description: '未授權' },
    403: { description: '權限不足' }
  }
});

/**
 * GET /api/v1/admin/user-stats/segmentation - 獲取用戶活躍度分類
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/admin/user-stats/segmentation',
  tags: ['User Statistics'],
  summary: '獲取用戶活躍度分類',
  description: '將用戶按活躍程度分為高度活躍、活躍、中度活躍、不活躍、休眠五個等級',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: '成功返回用戶活躍度分類',
      content: {
        'application/json': {
          schema: z.object({
            success: z.literal(true),
            data: z.object({
              segments: z.array(z.object({
                label: z.enum(['highly_active', 'active', 'moderate', 'inactive', 'dormant']),
                displayName: z.string(),
                description: z.string(),
                userCount: z.number(),
                percentage: z.number(),
                criteria: z.string()
              })),
              totalUsers: z.number(),
              lastUpdated: z.string()
            }),
            metadata: z.object({
              generated_at: z.string()
            })
          }).openapi({ description: '用戶活躍度分類響應' })
        }
      }
    },
    401: { description: '未授權' },
    403: { description: '權限不足' }
  }
});

// ============================================================================
// Express 路由定義
// ============================================================================

// 所有路由都需要管理員權限（使用資料庫級別權限檢查，與 admin.routes.ts 一致）
const adminOnly = [authenticateAny, requireAdmin];

/**
 * GET /api/v1/admin/user-stats/overview
 * 獲取總覽儀表板
 *
 * @returns {OverviewStats} 總覽統計資料
 */
router.get('/overview', ...adminOnly, userStatsController.getOverview);

/**
 * GET /api/v1/admin/user-stats/registrations
 * 獲取註冊統計
 *
 * @query {string} groupBy - 統計分組方式（必選）：day, week, month, year, location, role, education_stage
 * @query {string} [startDate] - 開始日期 (YYYY-MM-DD)
 * @query {string} [endDate] - 結束日期 (YYYY-MM-DD)
 * @query {number} [locationId] - 地區 ID 篩選
 * @query {number} [roleId] - 角色 ID 篩選
 * @query {string} [educationStage] - 教育階段篩選
 * @query {number} [limit=100] - 分頁限制（最大 1000）
 * @query {number} [offset=0] - 分頁偏移
 *
 * @returns {TimeSeriesStats[] | LocationStats[] | RoleStats[] | EducationStageStats[]} 註冊統計資料
 */
router.get(
  '/registrations',
  ...adminOnly,
  validate(registrationStatsQuerySchema, 'query'),
  userStatsController.getRegistrationStats
);

/**
 * GET /api/v1/admin/user-stats/activity
 * 獲取活躍度統計
 *
 * @query {number} [activeWithinDays=30] - 活躍度時間範圍（天數，最大 365）
 * @query {string} [groupBy] - 統計分組方式：role, location, education_stage
 * @query {number} [limit=100] - 分頁限制（最大 1000）
 * @query {number} [offset=0] - 分頁偏移
 *
 * @returns {ActivityStats} 活躍度統計資料
 */
router.get(
  '/activity',
  ...adminOnly,
  validate(activityStatsQuerySchema, 'query'),
  userStatsController.getActivityStats
);

/**
 * GET /api/v1/admin/user-stats/export
 * 匯出統計資料
 *
 * @query {string} format - 匯出格式（必選）：csv, excel
 * @query {string} type - 匯出類型（必選）：registrations, activity, full
 * @query {string} [startDate] - 開始日期 (YYYY-MM-DD)
 * @query {string} [endDate] - 結束日期 (YYYY-MM-DD)
 * @query {string} [groupBy] - 統計分組方式（type=registrations 時必選）
 *
 * @returns {File} CSV 或 Excel 檔案
 */
router.get(
  '/export',
  ...adminOnly,
  validate(exportStatsQuerySchema, 'query'),
  userStatsController.exportStats
);

/**
 * GET /api/v1/admin/user-stats/active-users
 * 獲取 DAU/WAU/MAU 統計
 *
 * @returns {ActiveUsersStats} DAU/WAU/MAU 統計資料及趨勢
 */
router.get('/active-users', ...adminOnly, userStatsController.getActiveUsersStats);

/**
 * GET /api/v1/admin/user-stats/device-analytics
 * 獲取裝置分析
 *
 * @query {string} [startDate] - 開始日期 (YYYY-MM-DD)
 * @query {string} [endDate] - 結束日期 (YYYY-MM-DD)
 * @query {number} [days=30] - 如果沒提供日期範圍，預設最近 N 天
 *
 * @returns {DeviceAnalytics} 裝置、瀏覽器、作業系統統計
 */
router.get(
  '/device-analytics',
  ...adminOnly,
  validate(deviceAnalyticsQuerySchema, 'query'),
  userStatsController.getDeviceAnalytics
);

/**
 * GET /api/v1/admin/user-stats/retention
 * 獲取用戶留存率
 *
 * @query {number} [cohorts=7] - 分析的群組數量（最近 N 個群組，最大 30）
 * @query {number} [trackDays=30] - 追蹤天數（最大 90）
 * @query {string} [granularity=day] - 群組粒度：day, week
 *
 * @returns {RetentionStats} 留存率統計資料
 */
router.get(
  '/retention',
  ...adminOnly,
  validate(retentionQuerySchema, 'query'),
  userStatsController.getRetentionStats
);

/**
 * GET /api/v1/admin/user-stats/popular-profiles
 * 獲取熱門檔案排行
 *
 * @query {number} [limit=10] - 返回數量（最大 100）
 * @query {number} [offset=0] - 偏移量
 * @query {number} [minViews=1] - 最低查看次數
 *
 * @returns {PopularProfilesStats} 熱門用戶檔案排行
 */
router.get(
  '/popular-profiles',
  ...adminOnly,
  validate(popularProfilesQuerySchema, 'query'),
  userStatsController.getPopularProfiles
);

/**
 * GET /api/v1/admin/user-stats/segmentation
 * 獲取用戶活躍度分類
 *
 * @returns {UserActivitySegmentation} 用戶活躍度分類統計
 */
router.get('/segmentation', ...adminOnly, userStatsController.getUserActivitySegmentation);

export default router;
