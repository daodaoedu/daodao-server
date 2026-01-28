// controllers/comment.js
const { Comment, User, Contact, BasicInfo, Position, Post, MentorParticipants, Review, Outcome, Note } = require('../models');
const sequelize = require('../config/db');
const jwt = require('jsonwebtoken');
const { verifyRequest } = require('../utils/auth');

/**
 * 格式化留言回應資料
 * 若留言有回覆，也會包含 replies 陣列
 */
const formatCommentResponse = (comment) => {
  return {
    id: comment.id,
    content: comment.content,
    visibility: comment.visibility,
    createdAt: comment.created_at,
    updatedAt: comment.updated_at,
    parent_id: comment.parent_id,
    user: comment.User
      ? {
          id: comment.User.id,
          name: comment.User.nickname,
          _id: comment.User.external_id,
          roleList: comment.User.Positions ? comment.User.Positions.map(p => p.name) : [],
          photoURL: comment.User.Contact ? comment.User.Contact.photo_url : null,
        }
      : null,
    // 之後會加入子留言
    replies: []
  };
};

/**
 * 根據 entity type 與 entityId 取得對應的 post 資料
 */
const getPostFromEntity = async (type, entityId) => {
  let entity;
  if (type === 'review') {
    entity = await Review.findOne({ where: { id: entityId } });
  } else if (type === 'outcome') {
    entity = await Outcome.findOne({ where: { id: entityId } });
  } else if (type === 'note') {
    entity = await Note.findOne({ where: { id: entityId } });
  } else {
    throw new Error('無效的 type，必須為 review、outcome 或 note');
  }
  if (!entity) throw new Error(`${type} 不存在`);

  const post = await Post.findOne({ where: { id: entity.post_id } });
  if (!post) throw new Error('找不到對應的 post');
  if (post.type !== type) {
    throw new Error(`該文章並非 ${type} 類型`);
  }
  return post;
};

/**
 * 根據留言的 user_id 查詢 User 資料並附加
 */
const attachUserToComment = async (comment) => {
  const user = await User.findOne({
    where: { id: comment.user_id },
    attributes: ['id', 'nickname', 'external_id'],
    include: [
      { model: Contact },
      { model: BasicInfo },
      { model: Position, through: { attributes: [] } }
    ]
  });
  comment.User = user;
  return comment;
};

/**
 * 權限檢查函式
 */
const canViewComment = async (comment, currentUser, post, mentorRelations = null) => {
  if (comment.visibility === 'public') return true;
  if (!currentUser.id) return false;
  if (comment.user_id === currentUser.id) return true;
  if (currentUser.role === '4') {
    if (mentorRelations) {
      if (mentorRelations.has(comment.user_id)) return true;
    } else {
      const relation = await MentorParticipants.findOne({
        where: { mentor_id: currentUser.id, participant_id: comment.user_id }
      });
      if (relation) return true;
    }
  }
  if (currentUser.role === '3' && post && post.user_id === currentUser.id) {
    return true;
  }
  return false;
};

/**
 * 組成樹狀留言結構
 */
const buildCommentTree = (comments) => {
  const map = {};
  const roots = [];
  comments.forEach(comment => {
    comment.replies = [];
    map[comment.id] = comment;
  });
  comments.forEach(comment => {
    if (comment.parent_id) {
      if (map[comment.parent_id]) {
        map[comment.parent_id].replies.push(comment);
      }
    } else {
      roots.push(comment);
    }
  });
  return roots;
};

/**
 * 建立留言
 * API 路徑：POST /comments
 */
exports.createComment = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { type, entityId, content, visibility, parentId } = req.body;
    if (!type || !entityId || !content) {
      throw new Error('缺少 type、entityId 或 content');
    }
    const finalVisibility = ['public', 'private'].includes(visibility) ? visibility : 'private';
    const post = await getPostFromEntity(type, entityId);

    // 若有 parentId，則驗證父留言存在且屬於同一文章
    if (parentId) {
      const parentComment = await Comment.findOne({ where: { id: parentId } });
      if (!parentComment) throw new Error('父留言不存在');
      if (parentComment.post_id !== post.id) throw new Error('父留言不屬於相同文章');
    }

    const commentInstance = await Comment.create({
      post_id: post.id,
      user_id: req.user.id,
      content,
      visibility: finalVisibility,
      parent_id: parentId || null
    }, { transaction });

    let comment = commentInstance.get({ plain: true });
    comment = await attachUserToComment(comment);

    await transaction.commit();
    return res.status(201).json(formatCommentResponse(comment));
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    return res.status(400).json({
      error: true,
      message: '建立留言失敗',
      details: error.message
    });
  }
};

/**
 * 取得指定文章下所有留言，並組成樹狀結構
 * API 路徑：GET /comments?type=xxx&entityId=xxx
 */
exports.getComments = async (req, res) => {
  try {
    // 驗證使用者，非登入者也能查詢，但權限可能不同
    let currentUser = null;
    const { user, error } = verifyRequest(req);
    if (!error && user) {
      currentUser = user;
    }
    const { type, entityId } = req.query;
    if (!type || !entityId) {
      return res.status(400).json({ error: true, message: '缺少 type 或 entityId 查詢參數' });
    }
    const post = await getPostFromEntity(type, entityId);
    const commentsInstances = await Comment.findAll({
      where: { post_id: post.id },
      order: [['created_at', 'ASC']]
    });
    let comments = await Promise.all(
      commentsInstances.map(async (instance) => {
        let comment = instance.get({ plain: true });
        comment = await attachUserToComment(comment);
        return formatCommentResponse(comment);
      })
    );

    // 權限檢查：過濾掉使用者無權查看的留言
    let mentorRelations = null;
    if (currentUser?.role === '4') {
      const relations = await MentorParticipants.findAll({
        where: { mentor_id: currentUser.id }
      });
      mentorRelations = new Set(relations.map(rel => rel.participant_id));
    }
    comments = comments.filter(comment =>
      canViewComment(comment, currentUser || { id: null, role: null }, post, mentorRelations)
    );
    
    // 組成樹狀結構
    const commentTree = buildCommentTree(comments);
    return res.json(commentTree);
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: '取得留言失敗',
      details: error.message
    });
  }
};

/**
 * 取得單一留言詳細資訊
 * API 路徑：GET /comments/:commentId
 */
exports.getCommentDetail = async (req, res) => {
  try {
    let currentUser = null;
    const { user, error } = verifyRequest(req);
    if (!error && user) {
      currentUser = user;
    }
    const { commentId } = req.params;
    const commentInstance = await Comment.findOne({ where: { id: commentId } });
    if (!commentInstance) return res.status(404).json({ error: true, message: '留言不存在' });
    let comment = commentInstance.get({ plain: true });
    comment = await attachUserToComment(comment);
    const post = await Post.findOne({ where: { id: comment.post_id } });

    let mentorRelations = null;
    if (currentUser?.role === '4') {
      const relations = await MentorParticipants.findAll({
        where: { mentor_id: currentUser.id }
      });
      mentorRelations = new Set(relations.map(rel => rel.participant_id));
    }
    const canView = await canViewComment(comment, currentUser || { id: null, role: null }, post, mentorRelations);
    if (!canView) {
      return res.status(403).json({ error: true, message: '無權查看此留言' });
    }
    return res.json(formatCommentResponse(comment));
  } catch (error) {
    return res.status(500).json({
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
  const transaction = await sequelize.transaction();
  try {
    const { commentId } = req.params;
    let commentInstance = await Comment.findOne({ where: { id: commentId } });
    if (!commentInstance) {
      await transaction.rollback();
      return res.status(404).json({ error: true, message: '留言不存在' });
    }
    let comment = commentInstance.get({ plain: true });
    // 只允許留言作者更新
    if (comment.user_id !== req.user.id) {
      await transaction.rollback();
      return res.status(403).json({ error: true, message: '無權更新此留言' });
    }
    const { content, visibility } = req.body;
    const updates = {};
    if (content !== undefined) updates.content = content;
    if (visibility !== undefined) {
      updates.visibility = ['public', 'private'].includes(visibility) ? visibility : 'private';
    }
    await commentInstance.update(updates, { transaction });
    commentInstance = await Comment.findOne({ where: { id: commentId } });
    comment = commentInstance.get({ plain: true });
    comment = await attachUserToComment(comment);
    await transaction.commit();
    return res.json(formatCommentResponse(comment));
  } catch (error) {
    await transaction.rollback();
    return res.status(400).json({
      error: true,
      message: '更新留言失敗',
      details: error.errors?.map(e => e.message) || error.message
    });
  }
};

/**
 * 刪除留言
 * API 路徑：DELETE /comments/:commentId
 */
exports.deleteComment = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { commentId } = req.params;
    const commentInstance = await Comment.findOne({ where: { id: commentId } });
    if (!commentInstance) {
      await transaction.rollback();
      return res.status(404).json({ error: true, message: '留言不存在' });
    }
    const comment = commentInstance.get({ plain: true });
    if (comment.user_id !== req.user.id) {
      await transaction.rollback();
      return res.status(403).json({ error: true, message: '無權刪除此留言' });
    }
    await commentInstance.destroy({ transaction });
    await transaction.commit();
    return res.json({ message: '留言已刪除' });
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({
      error: true,
      message: '刪除留言失敗',
      details: error.message
    });
  }
};