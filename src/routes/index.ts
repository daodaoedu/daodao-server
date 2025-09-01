/**
 * 路由索引模塊
 * 統一整合和導出所有路由
 */

import { Router } from 'express';
import resourceRoutes from './resource.routes';
import resourceReviewRoutes from './resource-review.routes';
import tagRoutes from './tag.routes';
import authRoutes from './auth.routes';
import projectRoutes from './project.routes';
import userRoutes from './user.routes';
import ideaRoutes from './idea.routes';
import meRoutes from './me.routes';
import commentRoutes from './comment.routes';
import imageRoutes from './image.routes';
import noteRoutes from './note.routes';
import outcomeRoutes from './outcome.routes';
import reviewRoutes from './review.routes';
import mentorRoutes from './mentor.routes';
import milestoneRoutes from './milestone.routes';
import practiceRoutes from './practice.routes';

const router = Router({ mergeParams: true });

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
// 巢狀資源心得評價路由 (注意：resourceReviewRoutes 使用 mergeParams: true)
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

// 用戶路由
// GET    /api/v1/users
// GET    /api/v1/users/me
// GET    /api/v1/users/:id
// POST   /api/v1/users
// PUT    /api/v1/users/:id
// DELETE /api/v1/users/me
// DELETE /api/v1/users/:id
router.use('/users', userRoutes);

// 想法路由
// GET    /api/v1/ideas
// GET    /api/v1/ideas/:id
// POST   /api/v1/ideas
// PATCH  /api/v1/ideas/:id
// DELETE /api/v1/ideas/:id
router.use('/ideas', ideaRoutes);

// 個人 API 路由
// GET    /api/v1/me/auth
// GET    /api/v1/me/users
// GET    /api/v1/me/ideas
// GET    /api/v1/me/practices
// GET    /api/v1/me/practice-stats
// GET    /api/v1/me/resources
// GET    /api/v1/me/preferences
// PUT    /api/v1/me/preferences
router.use('/me', meRoutes);

// 留言路由
// POST   /api/v1/comments
// GET    /api/v1/comments
// GET    /api/v1/comments/:commentId
// PUT    /api/v1/comments/:commentId
// DELETE /api/v1/comments/:commentId
router.use('/comments', commentRoutes);

// 圖片路由
// GET    /api/v1/images/:filename
// POST   /api/v1/images
// POST   /api/v1/images/multiple
// DELETE /api/v1/images/:filename
router.use('/images', imageRoutes);

// 便利貼路由
// GET    /api/v1/notes/public
// GET    /api/v1/notes/my
// POST   /api/v1/notes/projects/:projectId
// GET    /api/v1/notes/projects/:projectId
// GET    /api/v1/notes/projects/:projectId/:noteId
// PUT    /api/v1/notes/projects/:projectId/:noteId
// DELETE /api/v1/notes/projects/:projectId/:noteId
router.use('/notes', noteRoutes);

// 成果路由
// GET    /api/v1/outcomes/public
// GET    /api/v1/outcomes/my
// POST   /api/v1/outcomes/projects/:projectId
// GET    /api/v1/outcomes/projects/:projectId
// GET    /api/v1/outcomes/projects/:projectId/:outcomeId
// PUT    /api/v1/outcomes/projects/:projectId/:outcomeId
// DELETE /api/v1/outcomes/projects/:projectId/:outcomeId
router.use('/outcomes', outcomeRoutes);

// 覆盤路由
// GET    /api/v1/reviews/stats
// POST   /api/v1/reviews/projects/:projectId
// GET    /api/v1/reviews/projects/:projectId
// GET    /api/v1/reviews/projects/:projectId/:reviewId
// PUT    /api/v1/reviews/projects/:projectId/:reviewId
// DELETE /api/v1/reviews/projects/:projectId/:reviewId
router.use('/reviews', reviewRoutes);

// 導師路由
// POST   /api/v1/mentor/marathon
// PUT    /api/v1/mentor/marathon/:assignmentId
// DELETE /api/v1/mentor/marathon/:assignmentId
// GET    /api/v1/mentor/marathons
// POST   /api/v1/mentor/participant
// PUT    /api/v1/mentor/participant/:participantId
// DELETE /api/v1/mentor/participant/:participantId
// GET    /api/v1/mentor/marathon/:eventId/participants
// GET    /api/v1/mentor/marathon/:eventId/reviews
router.use('/mentor', mentorRoutes);

// 里程碑路由（作為專案的子路由）
// GET    /api/v1/projects/:projectId/milestones
// POST   /api/v1/projects/:projectId/milestones
// PUT    /api/v1/projects/:projectId/milestones/:milestoneId
// DELETE /api/v1/projects/:projectId/milestones/:milestoneId
router.use('/projects/:projectId/milestones', milestoneRoutes);

// 實踐路由
// GET    /api/v1/practices
// GET    /api/v1/practices/my
// GET    /api/v1/practices/stats
// GET    /api/v1/practices/:id
// POST   /api/v1/practices
// PUT    /api/v1/practices/:id
// DELETE /api/v1/practices/:id
// POST   /api/v1/practices/:id/checkins
// GET    /api/v1/practices/:id/checkins
// GET    /api/v1/practices/:id/checkins/stats
// GET    /api/v1/practices/:id/checkins/calendar/:year/:month
// POST   /api/v1/practices/:id/like
// POST   /api/v1/practices/:id/favorite
// POST   /api/v1/practices/:id/share
// POST   /api/v1/practices/:id/view
// GET    /api/v1/practices/:id/stats
// GET    /api/v1/practices/:id/user-status
router.use('/practices', practiceRoutes);

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
        users: '/api/v1/users',
        ideas: '/api/v1/ideas',
        me: '/api/v1/me',
        comments: '/api/v1/comments',
        images: '/api/v1/images',
        notes: '/api/v1/notes',
        outcomes: '/api/v1/outcomes',
        reviews: '/api/v1/reviews',
        mentor: '/api/v1/mentor',
        milestones: '/api/v1/projects/:projectId/milestones',
        practices: '/api/v1/practices',
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
        '用戶管理系統',
        '想法管理系統',
        '留言系統',
        '個人 API 端點',
        '實踐管理系統',
        '簽到記錄系統',
        '互動功能系統',
        '巢狀路由支援',
        '分頁查詢',
        '複雜過濾條件',
        'TypeScript 類型安全',
        'Prisma ORM 整合'
      ]
    }
  });
});

export default router;