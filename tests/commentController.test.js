// tests/commentController.test.js
const commentController = require('../controllers/commentController');
const commentService = require('../services/commentService');
const { verifyRequest } = require('../utils/auth');
const { z } = require('zod');

// 模擬 service 與 auth 模組
jest.mock('../services/commentService');
jest.mock('../utils/auth');

describe('Comment Controller with Updated Model, Zod Validation and Extended Business Logic', () => {
  let req, res;
  beforeEach(() => {
    req = {
      body: {},
      query: {},
      params: {},
      user: { id: 1 }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    // 模擬驗證成功，返回使用者資訊
    verifyRequest.mockReturnValue({ user: { id: 1, role: '1' } });
  });

  describe('createComment', () => {
    it('should return 400 if required fields are missing (targetType missing)', async () => {
      // targetType 為必填，但未提供
      req.body = { targetId: 1, content: 'Test content', visibility: 'public' };
      await commentController.createComment(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: '參數驗證失敗'
        })
      );
    });

    it('should return 400 if targetId is not a number', async () => {
      req.body = { targetType: 'post', targetId: 'abc', content: 'Test content', visibility: 'public' };
      await commentController.createComment(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: '參數驗證失敗'
        })
      );
    });

    it('should return 400 when parent comment does not belong to same target', async () => {
      req.body = { targetType: 'post', targetId: 1, content: 'Test content', visibility: 'public', parentId: 50 };
      // 模擬 service 返回錯誤訊息
      commentService.createComment.mockRejectedValue(new Error('父留言不屬於相同評論對象'));
      await commentController.createComment(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: '建立留言失敗',
        details: '父留言不屬於相同評論對象'
      }));
    });

    it('should call service and return 201 when validation passes', async () => {
      req.body = { targetType: 'post', targetId: 1, content: 'Test content', visibility: 'public' };
      const fakeComment = { id: 100, content: 'Test content', target_type: 'post', target_id: 1 };
      commentService.createComment.mockResolvedValue(fakeComment);
      
      await commentController.createComment(req, res);
      
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(fakeComment);
    });
    
    it('should return 400 when there is a DB error during creation', async () => {
      req.body = { targetType: 'post', targetId: 1, content: 'Test content', visibility: 'public' };
      commentService.createComment.mockRejectedValue(new Error('DB Error'));
      await commentController.createComment(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: '建立留言失敗',
        details: 'DB Error'
      }));
    });
  });

  describe('getComments', () => {
    it('should return 400 if query parameters are invalid', async () => {
      // 缺少 targetType
      req.query = { targetId: 1 };
      await commentController.getComments(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: '查詢參數驗證失敗'
        })
      );
    });

    it('should return comments list when query validation passes', async () => {
      req.query = { targetType: 'post', targetId: 1 };
      const fakeComments = [{ id: 101, content: 'Comment 1' }, { id: 102, content: 'Comment 2' }];
      commentService.getComments.mockResolvedValue(fakeComments);
      
      await commentController.getComments(req, res);
      
      expect(res.json).toHaveBeenCalledWith(fakeComments);
    });
  });

  describe('getCommentDetail', () => {
    it('should return comment detail', async () => {
      req.params = { commentId: 100 };
      const fakeComment = { id: 100, content: 'Detail comment', target_type: 'post', target_id: 1 };
      commentService.getCommentDetail.mockResolvedValue(fakeComment);
      
      await commentController.getCommentDetail(req, res);
      
      expect(res.json).toHaveBeenCalledWith(fakeComment);
    });
  });

  describe('updateComment', () => {
    it('should return 400 if update parameters are invalid', async () => {
      req.params = { commentId: 100 };
      // visibility 值錯誤
      req.body = { content: 'Updated content', visibility: 'invalid' };
      
      await commentController.updateComment(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: '更新參數驗證失敗'
      }));
    });

    it('should return updated comment when parameters are valid', async () => {
      req.params = { commentId: 100 };
      req.body = { content: 'Updated content', visibility: 'private' };
      const updatedComment = { id: 100, content: 'Updated content', visibility: 'private' };
      commentService.updateComment.mockResolvedValue(updatedComment);
      
      await commentController.updateComment(req, res);
      
      expect(res.json).toHaveBeenCalledWith(updatedComment);
    });
  });

  describe('deleteComment', () => {
    it('should return deletion confirmation', async () => {
      req.params = { commentId: 100 };
      const deleteResult = { message: '留言已刪除' };
      commentService.deleteComment.mockResolvedValue(deleteResult);
      
      await commentController.deleteComment(req, res);
      
      expect(res.json).toHaveBeenCalledWith(deleteResult);
    });
  });
});