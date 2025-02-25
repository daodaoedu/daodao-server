// controllers/commentController.js
const commentService = require('../services/commentService');
const { verifyRequest } = require('../utils/auth');
const { z } = require('zod');

// 建立留言的驗證規則
const createCommentSchema = z.object({
  targetType: z.string().min(1, { message: 'targetType 為必填' }),
  targetId: z.coerce.number({ invalid_type_error: 'targetId 必須為數字' }),
  content: z.string().min(1, { message: 'content 為必填' }),
  visibility: z.enum(['public', 'private']).optional().default('private'),
  parentId: z.coerce.number().optional()
});

// 更新留言的驗證規則
const updateCommentSchema = z.object({
  content: z.string().optional(),
  visibility: z.enum(['public', 'private']).optional()
});

// 查詢留言的 query 參數驗證規則
const getCommentsQuerySchema = z.object({
  targetType: z.string().min(1, { message: 'targetType 為必填' }),
  targetId: z.coerce.number({ invalid_type_error: 'targetId 必須為數字' })
});

/**
 * 建立留言
 * API 路徑：POST /comments
 * 前端傳入參數 (camelCase)：targetType, targetId, content, visibility, parentId (選填)
 */
exports.createComment = async (req, res) => {
  try {
    // 使用 Zod 驗證 req.body
    const parsedData = createCommentSchema.parse(req.body);
    const { targetType, targetId, content, visibility, parentId } = parsedData;
    const userId = req.user.id;
    const comment = await commentService.createComment({ targetType, targetId, content, visibility, parentId, userId });
    return res.status(201).json(comment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: true,
        message: '參數驗證失敗',
        details: error.errors
      });
    }
    return res.status(400).json({
      error: true,
      message: '建立留言失敗',
      details: error.message
    });
  }
};

/**
 * 取得留言列表
 * API 路徑：GET /comments?targetType=xxx&targetId=xxx
 */
exports.getComments = async (req, res) => {
  try {
    // 使用 Zod 驗證 req.query
    const parsedQuery = getCommentsQuerySchema.parse(req.query);
    const { targetType, targetId } = parsedQuery;
    let currentUser = null;
    const { user, error } = verifyRequest(req);
    if (!error && user) currentUser = user;
    const comments = await commentService.getComments({ targetType, targetId, currentUser });
    return res.json(comments);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: true,
        message: '查詢參數驗證失敗',
        details: error.errors
      });
    }
    return res.status(500).json({
      error: true,
      message: '取得留言失敗',
      details: error.message
    });
  }
};

/**
 * 取得留言詳細資訊
 * API 路徑：GET /comments/:commentId
 */
exports.getCommentDetail = async (req, res) => {
  try {
    let currentUser = null;
    const { user, error } = verifyRequest(req);
    if (!error && user) currentUser = user;
    const { commentId } = req.params;
    
    // 新增除錯訊息
    console.log(`Attempting to get comment ${commentId} for user ${currentUser?.id || 'anonymous'}`);
    
    const comment = await commentService.getCommentDetail(commentId, currentUser);
    
    // 新增權限檢查日誌
    console.log(`Access ${comment.visibility} comment ${commentId} by ${currentUser?.id || 'anonymous'}`);
    
    return res.json(comment);
  } catch (error) {
    // 修改錯誤處理區分權限錯誤
    const statusCode = error.message.includes('無權') ? 403 : 500;
    return res.status(statusCode).json({
      error: true,
      message: '取得留言詳細資訊失敗',
      details: error.message
    });
  }
};

/**
 * 更新留言
 * API 路徑：PUT /comments/:commentId
 */
exports.updateComment = async (req, res) => {
  try {
    // 驗證更新資料
    const parsedData = updateCommentSchema.parse(req.body);
    const { commentId } = req.params;
    const userId = req.user.id;
    const comment = await commentService.updateComment({ commentId, userId, ...parsedData });
    return res.json(comment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: true,
        message: '更新參數驗證失敗',
        details: error.errors
      });
    }
    return res.status(400).json({
      error: true,
      message: '更新留言失敗',
      details: error.message
    });
  }
};

/**
 * 刪除留言
 * API 路徑：DELETE /comments/:commentId
 */
exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;
    const result = await commentService.deleteComment({ commentId, userId });
    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: '刪除留言失敗',
      details: error.message
    });
  }
};