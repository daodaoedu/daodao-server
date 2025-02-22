const { Comment, User, Contact, BasicInfo, Position, Post, MentorParticipants, Review, Outcome, Note } = require('../models');
const sequelize = require('../config/db');

/**
 * 格式化留言回應資料
 * 這裡假設 comment 中的 User 欄位已經手動附加上 user 資料
 */
const formatCommentResponse = (comment) => {
  return {
    id: comment.id,
    content: comment.content,
    visibility: comment.visibility,
    createdAt: comment.created_at,
    updatedAt: comment.updated_at,
    user: comment.User
      ? {
        id: comment.User.id,
        name: comment.User.nickname,
        _id: comment.User.external_id,
        // 這邊假設 Positions 與 Contact 已在 User 裡面取得
        roleList: comment.User.Positions ? comment.User.Positions.map(p => p.name) : [],
        photoURL: comment.User.Contact ? comment.User.Contact.photo_url : null,
      }
      : null,
  };
};

/**
 * 輔助函式
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
 * 根據 comment 的 user_id 手動查詢 User 資料
 */
const attachUserToComment = async (comment) => {
  const user = await User.findOne({
    where: { id: comment.user_id },
    attributes: ['id', 'nickname', 'external_id'],
    include: [
      { model: Contact },
      { model: BasicInfo },
      {
        model: Position,
        through: { attributes: [] }
      }
    ]
  });
  comment.User = user;
  return comment;
};

/**
 * 權限檢查函式
 *
 * 規則：
 * - 留言為 public：所有人皆可瀏覽。
 * - 留言作者本人：永遠可檢視。
 * - 導師：若留言作者為參與者，則必須在 MentorParticipants 表中確認輔導關係。
 * - 參與者：若留言所屬文章的擁有者為自己，則可瀏覽該文章下所有留言。
 *
 * @param {Object} comment 留言資料（plain object）
 * @param {Object} currentUser 當前使用者（包含 id 與 role）
 * @param {Object} post 該留言所屬文章資料（plain object）
 * @param {Set} mentorRelations 若 currentUser 為導師，預先查詢的輔導關係 Set
 */
const canViewComment = async (comment, currentUser, post, mentorRelations = null) => {
  if (comment.visibility === 'public') return true;
  if (comment.user_id === currentUser.id) return true;
  if (currentUser.role === 'mentor') {
    if (mentorRelations) {
      if (mentorRelations.has(comment.user_id)) return true;
    } else {
      const relation = await MentorParticipants.findOne({
        where: { mentor_id: currentUser.id, participant_id: comment.user_id }
      });
      if (relation) return true;
    }
  }
  if (currentUser.role === 'participant' && post && post.user_id === currentUser.id) {
    return true;
  }
  return false;
};

/**
 * 建立留言
 * API 路徑：POST /api/comments
 */
exports.createComment = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { type, entityId, content, visibility } = req.body;
    if (!type || !entityId || !content) {
      throw new Error('缺少 type、entityId 或 content');
    }
    const finalVisibility = ['public', 'private'].includes(visibility) ? visibility : 'private';
    const post = await getPostFromEntity(type, entityId);

    // 建立留言
    const commentInstance = await Comment.create({
      post_id: post.id,
      user_id: req.user.id,
      content,
      visibility: finalVisibility
    }, { transaction });

    // 取得留言後，再手動查詢 User 資料並附加
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
 * 取得指定文章下的所有留言
 * API 路徑：GET /api/comments
 */
exports.getComments = async (req, res) => {
  try {
    const { type, entityId } = req.query;
    if (!type || !entityId) {
      return res.status(400).json({ error: true, message: '缺少 type 或 entityId 查詢參數' });
    }
    const post = await getPostFromEntity(type, entityId);
    const commentsInstances = await Comment.findAll({
      where: { post_id: post.id },
      order: [['created_at', 'ASC']]
    });

    // 對每筆留言進行手動查詢 user 並附加資料
    const comments = await Promise.all(
      commentsInstances.map(async (instance) => {
        let comment = instance.get({ plain: true });
        comment = await attachUserToComment(comment);
        return comment;
      })
    );

    let mentorRelations = null;
    if (req.user.role === 'mentor') {
      const relations = await MentorParticipants.findAll({
        where: { mentor_id: req.user.id }
      });
      mentorRelations = new Set(relations.map(rel => rel.participant_id));
    }

    // 篩選可檢視的留言
    const filteredComments = [];
    for (const comment of comments) {
      if (await canViewComment(comment, req.user, post, mentorRelations)) {
        filteredComments.push(formatCommentResponse(comment));
      }
    }
    return res.json(filteredComments);
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
 * API 路徑：GET /api/comments/:commentId
 */
exports.getCommentDetail = async (req, res) => {
  try {
    const { commentId } = req.params;
    let commentInstance = await Comment.findOne({ where: { id: commentId } });
    if (!commentInstance) return res.status(404).json({ error: true, message: '留言不存在' });
    let comment = commentInstance.get({ plain: true });
    comment = await attachUserToComment(comment);

    const post = await Post.findOne({ where: { id: comment.post_id } });
    let mentorRelations = null;
    if (req.user.role === 'mentor') {
      const relations = await MentorParticipants.findAll({
        where: { mentor_id: req.user.id }
      });
      mentorRelations = new Set(relations.map(rel => rel.participant_id));
    }
    if (!(await canViewComment(comment, req.user, post, mentorRelations))) {
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
 * API 路徑：PUT /api/comments/:commentId
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
    // 檢查留言是否屬於當前使用者
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
    // 重新查詢更新後的留言（不使用 include），並手動附加 user 資料
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
 * API 路徑：DELETE /api/comments/:commentId
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