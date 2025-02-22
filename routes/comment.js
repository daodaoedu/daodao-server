const express = require('express');
const router = express.Router();
const commentsController = require('../controllers/comment');
const { isAuthenticated } = require("../middlewares/isAuthenticated");

/**
 * 以 /comments 為基底路由：
 * 
 * 1. 建立留言：POST /comments
 *    - 請求 body 需包含 type、entityId、content（以及 visibility 選填）
 * 2. 取得留言列表：GET /comments
 *    - 查詢參數需包含 type 與 entityId，表示欲查詢該文章下的留言
 * 3. 單筆留言操作：GET、PUT、DELETE /comments/:commentId
 */

// 建立留言
router.post('/', isAuthenticated, commentsController.createComment);

// 取得留言列表
router.get('/', commentsController.getComments);

// 取得單一留言詳細資訊
router.get('/:commentId', commentsController.getCommentDetail);

// 更新留言
router.put('/:commentId', isAuthenticated, commentsController.updateComment);

// 刪除留言
router.delete('/:commentId', isAuthenticated, commentsController.deleteComment);

module.exports = router;
