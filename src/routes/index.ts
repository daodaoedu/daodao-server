/**
 * 路由索引模塊
 * 統一整合和導出所有路由
 */

import { Router } from 'express';
import resourceRoutes from './resource-routes';
import resourceReviewRoutes from './resource-review-routes';
import tagRoutes from './tag-routes';
import authRoutes from './auth.routes';
import projectRoutes from './project.routes';

const router = Router();

/**
 * API 版本前綴
 * 所有路由都會有 /api/v1 前綴
 */

// 認證路由
// POST   /api/v1/auth/login
// POST   /api/v1/auth/register
// POST   /api/v1/auth/logout
// POST   /api/v1/auth/refresh
// GET    /api/v1/auth/me
// POST   /api/v1/auth/forgot-password
// POST   /api/v1/auth/reset-password
// POST   /api/v1/auth/verify-email
// GET    /api/v1/auth/google
// GET    /api/v1/auth/google/callback
// GET    /api/v1/auth/google/failure
router.use('/auth', authRoutes);

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
// GET    /api/v1/resources/:resourceId/reviews/:reviewId
// POST   /api/v1/resources/:resourceId/reviews
// PATCH  /api/v1/resources/:resourceId/reviews/:reviewId
// PATCH  /api/v1/resources/:resourceId/reviews/:reviewId/status
// DELETE /api/v1/resources/:resourceId/reviews/:reviewId
// POST   /api/v1/resources/:resourceId/reviews/:reviewId/like
// DELETE /api/v1/resources/:resourceId/reviews/:reviewId/like
router.use('/resources/:resourceId/reviews', resourceReviewRoutes);

// 標籤路由
// GET    /api/v1/tags/popular
// GET    /api/v1/tags/search
// GET    /api/v1/tags/stats
// POST   /api/v1/tags/entities
// DELETE /api/v1/tags/entities
// GET    /api/v1/tags/entities
router.use('/tags', tagRoutes);

// 專案路由
// GET    /api/v1/projects
// GET    /api/v1/projects/my
// GET    /api/v1/projects/stats
// GET    /api/v1/projects/:id
// POST   /api/v1/projects
// PUT    /api/v1/projects/:id
// DELETE /api/v1/projects/:id
// POST   /api/v1/projects/:id/duplicate
router.use('/projects', projectRoutes);

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
        auth: '/api/v1/auth',
        resources: '/api/v1/resources',
        resourceReviews: '/api/v1/resources/:resourceId/reviews',
        tags: '/api/v1/tags',
        projects: '/api/v1/projects',
        health: '/api/v1/health'
      },
      features: [
        '用戶認證系統',
        'JWT 令牌管理',
        'Google OAuth 整合',
        '資源 CRUD 操作',
        '心得評價管理',
        '標籤系統',
        '專案管理系統',
        '巢狀路由支援',
        '分頁查詢',
        '複雜過濾條件',
        'TypeScript 類型安全'
      ]
    }
  });
});

export default router;