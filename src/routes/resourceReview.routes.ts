/**
 * 資源評價相關路由
 */

import express from 'express';
import resourceReviewService from '../services/resourceReviewService';
import { authenticateJWT } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validator';
import { 
  createResourceReviewSchema, 
  updateResourceReviewSchema 
} from '../validators/resourceReview.validator';

const router = express.Router();

/**
 * @route GET /api/reviews
 * @desc 獲取評價列表
 * @access Public
 */
router.get('/', async (req, res, next) => {
  try {
    // 解析過濾參數
    const filters = {
      resourceId: req.query.resourceId 
        ? parseInt(req.query.resourceId as string, 10) 
        : undefined,
      userId: req.query.userId 
        ? parseInt(req.query.userId as string, 10) 
        : undefined,
      status: req.query.status as string,
      tags: req.query.tags 
        ? (req.query.tags as string).split(',') 
        : undefined
    };

    // 解析分頁參數
    const pagination = {
      cursor: req.query.cursor as string,
      limit: req.query.limit 
        ? parseInt(req.query.limit as string, 10) 
        : undefined,
      sortField: req.query.sortField as string,
      sortDirection: req.query.sortDirection as 'asc' | 'desc'
    };

    // 獲取評價列表
    const result = await resourceReviewService.getReviews(filters, pagination);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/reviews/:id
 * @desc 獲取評價詳情
 * @access Public
 */
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const review = await resourceReviewService.getReviewById(id);
    
    res.json(review);
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/reviews
 * @desc 創建評價
 * @access Private
 */
router.post('/', 
  authenticateJWT, 
  validateRequest(createResourceReviewSchema), 
  async (req, res, next) => {
    try {
      const { resourceId, ...reviewData } = req.body;
      const userId = req.user.id;
      
      if (!resourceId) {
        return res.status(400).json({ message: '資源 ID 不能為空' });
      }
      
      const review = await resourceReviewService.createReview(
        parseInt(resourceId, 10),
        reviewData,
        userId
      );
      
      res.status(201).json(review);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route PUT /api/reviews/:id
 * @desc 更新評價
 * @access Private
 */
router.put('/:id', 
  authenticateJWT, 
  validateRequest(updateResourceReviewSchema), 
  async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      const userId = req.user.id;
      const review = await resourceReviewService.updateReview(id, req.body, userId);
      res.json(review);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route PATCH /api/reviews/:id/status
 * @desc 更新評價狀態
 * @access Private
 */
router.patch('/:id/status', 
  authenticateJWT, 
  async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { status } = req.body;
      const userId = req.user.id;
      
      if (!status) {
        return res.status(400).json({ message: '狀態不能為空' });
      }
      
      const review = await resourceReviewService.updateReviewStatus(id, status, userId);
      res.json(review);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route DELETE /api/reviews/:id
 * @desc 刪除評價 (軟刪除)
 * @access Private
 */
router.delete('/:id', 
  authenticateJWT, 
  async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      const userId = req.user.id;
      const result = await resourceReviewService.deleteReview(id, userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/reviews/:id/like
 * @desc 點讚評價
 * @access Private
 */
router.post('/:id/like', 
  authenticateJWT, 
  async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      const userId = req.user.id;
      const result = await resourceReviewService.toggleLikeReview(id, userId, true);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route DELETE /api/reviews/:id/like
 * @desc 取消點讚評價
 * @access Private
 */
router.delete('/:id/like', 
  authenticateJWT, 
  async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      const userId = req.user.id;
      const result = await resourceReviewService.toggleLikeReview(id, userId, false);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
