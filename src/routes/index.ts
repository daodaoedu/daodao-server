/**
 * 路由索引模塊
 * 統一整合和導出所有路由
 */

import { Router } from 'express';
import resourceRoutes from './resourceRoutes';
import resourceReviewRoutes from './resourceReviewRoutes';
import nestedResourceReviewRoutes from './nestedResourceReviewRoutes';
import tagRoutes from './tagRoutes';

const router = Router();

/**
 * API 版本前綴
 * 所有路由都會有 /api/v1 前綴
 */

// 資源路由
// GET    /api/v1/resources
// GET    /api/v1/resources/:id
// POST   /api/v1/resources
// PATCH  /api/v1/resources/:id
// PATCH  /api/v1/resources/:id/status
// DELETE /api/v1/resources/:id
// GET    /api/v1/resources/:id/tags
router.use('/resources', resourceRoutes);

// 巢狀資源心得評價路由
// GET    /api/v1/resources/:resourceId/reviews
// GET    /api/v1/resources/:resourceId/reviews/:id
// POST   /api/v1/resources/:resourceId/reviews
// PATCH  /api/v1/resources/:resourceId/reviews/:id
// PATCH  /api/v1/resources/:resourceId/reviews/:id/status
// DELETE /api/v1/resources/:resourceId/reviews/:id
// POST   /api/v1/resources/:resourceId/reviews/:id/like
// DELETE /api/v1/resources/:resourceId/reviews/:id/like
router.use('/resources/:resourceId/reviews', nestedResourceReviewRoutes);

// 獨立心得評價路由（用於跨資源查詢）
// GET    /api/v1/reviews
// GET    /api/v1/reviews/:id
// POST   /api/v1/reviews
// PATCH  /api/v1/reviews/:id
// PATCH  /api/v1/reviews/:id/status
// DELETE /api/v1/reviews/:id
// POST   /api/v1/reviews/:id/like
// DELETE /api/v1/reviews/:id/like
// GET    /api/v1/reviews/:id/tags
router.use('/reviews', resourceReviewRoutes);

// 標籤路由
// GET    /api/v1/tags/popular
// GET    /api/v1/tags/search
// GET    /api/v1/tags/stats
// POST   /api/v1/tags/entities
// DELETE /api/v1/tags/entities
// GET    /api/v1/tags/entities
router.use('/tags', tagRoutes);

/**
 * API 健康檢查端點
 * GET /api/v1/health
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'DaoDao API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

/**
 * API 資訊端點
 * GET /api/v1/info
 */
router.get('/info', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'DaoDao Resource Management API',
      version: '1.0.0',
      description: '學習資源管理與心得分享 API 系統',
      endpoints: {
        resources: '/api/v1/resources',
        reviews: '/api/v1/reviews',
        nestedReviews: '/api/v1/resources/:resourceId/reviews',
        tags: '/api/v1/tags',
        health: '/api/v1/health'
      },
      features: [
        '資源 CRUD 操作',
        '心得評價管理',
        '標籤系統',
        '巢狀路由支援',
        '分頁查詢',
        '複雜過濾條件',
        'TypeScript 類型安全'
      ]
    }
  });
});

export default router;