// routes/comments.js
const express = require('express');
const router = express.Router();
const commentsController = require('../controllers/commentController');
const { isAuthenticated } = require("../middlewares/isAuthenticated");

/**
 * 以 /comments 為基底路由：
 * 
 * POST /comments          - 建立留言（支援傳入 parentId 作為回覆）
 * GET /comments           - 取得指定文章下的所有留言（回傳樹狀結構）
 * GET /comments/:commentId - 取得單一留言詳細資訊
 * PUT /comments/:commentId - 更新留言
 * DELETE /comments/:commentId - 刪除留言
 */
router.post('/', isAuthenticated, commentsController.createComment);
router.get('/', commentsController.getComments);
router.get('/:commentId', commentsController.getCommentDetail);
router.put('/:commentId', isAuthenticated, commentsController.updateComment);
router.delete('/:commentId', isAuthenticated, commentsController.deleteComment);

module.exports = router;
