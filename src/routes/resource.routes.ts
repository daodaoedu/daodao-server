/**
 * 資源相關路由
 */

import express from 'express';
import resourceService from '../services/resourceService';
import { authenticateJWT } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validator';
import { 
  createResourceSchema, 
  updateResourceSchema 
} from '../validators/resource.validator';

const router = express.Router();

/**
 * @route GET /api/resources
 * @desc 獲取資源列表
 * @access Public
 */
router.get('/', async (req, res, next) => {
  try {
    // 解析過濾參數
    const filters = {
      type: req.query.type as string,
      cost: req.query.cost as string,
      level: req.query.level as string,
      majorCategoryId: req.query.majorCategoryId 
        ? parseInt(req.query.majorCategoryId as string, 10) 
        : undefined,
      subCategoryId: req.query.subCategoryId 
        ? parseInt(req.query.subCategoryId as string, 10) 
        : undefined,
      status: req.query.status as string,
      createdBy: req.query.createdBy 
        ? parseInt(req.query.createdBy as string, 10) 
        : undefined,
      query: req.query.q as string,
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

    // 獲取資源列表
    const result = await resourceService.getResources(filters, pagination);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/resources/:id
 * @desc 獲取資源詳情
 * @access Public
 */
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const resource = await resourceService.getResourceById(id);
    
    // 增加資源查看次數
    await resourceService.incrementViewCount(id);
    
    res.json(resource);
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/resources
 * @desc 創建資源
 * @access Private
 */
router.post('/', 
  authenticateJWT, 
  validateRequest(createResourceSchema), 
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const resource = await resourceService.createResource(req.body, userId);
      res.status(201).json(resource);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route PUT /api/resources/:id
 * @desc 更新資源
 * @access Private
 */
router.put('/:id', 
  authenticateJWT, 
  validateRequest(updateResourceSchema), 
  async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      const userId = req.user.id;
      const resource = await resourceService.updateResource(id, req.body, userId);
      res.json(resource);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route PATCH /api/resources/:id/status
 * @desc 更新資源狀態
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
      
      const resource = await resourceService.updateResourceStatus(id, status, userId);
      res.json(resource);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route DELETE /api/resources/:id
 * @desc 刪除資源 (軟刪除)
 * @access Private
 */
router.delete('/:id', 
  authenticateJWT, 
  async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      const userId = req.user.id;
      const result = await resourceService.deleteResource(id, userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
