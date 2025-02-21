const { Comment, Post, MentorParticipants } = require('../models');
const sequelize = require('../config/db');

// 格式化留言資料
const formatCommentResponse = (comment) => {
  return {
    id: comment.id,
    postId: comment.post_id,
    userId: comment.user_id,
    content: comment.content,
    visibility: comment.visibility,
    mentorId: comment.mentor_id,
    createdAt: comment.created_at,
    updatedAt: comment.updated_at
  };
};

// 安全日期格式化（選用）
const safeDateFormatter = (dateValue) => {
  try {
    const dateObj = dateValue instanceof Date ? dateValue : new Date(dateValue);
    if (isNaN(dateObj.getTime())) return '無效日期';
    return dateObj.toISOString().split('T')[0];
  } catch (e) {
    return '日期格式錯誤';
  }
};

/**
 * 檢查當前用戶是否有權查看該留言
 * @param {Object} comment 留言資料（plain object）
 * @param {Object} currentUser 當前使用者，必須包含 id 與 role
 */
const canViewComment = async (comment, currentUser) => {
  // 若留言為 public，所有人都可以看
  if (comment.visibility === 'public') return true;

  // private：只有留言建立者可以看
  if (comment.visibility === 'private') {
    return comment.user_id === currentUser.id;
  }

  // mentor_participant：只限導師與其輔導的參與者
  if (comment.visibility === 'mentor_participant') {
    // 若使用者為導師，僅允許 mentor_id 與自己相符
    if (currentUser.role === 'mentor') {
      return comment.mentor_id === currentUser.id;
    }
    // 若使用者為參與者（學生），必須在導師—參與者關係中有記錄
    if (currentUser.role === 'participant') {
      const relation = await MentorParticipants.findOne({
        where: {
          mentor_id: comment.mentor_id,
          participant_id: currentUser.id
        }
      });
      return !!relation;
    }
    // 其他角色無法存取
    return false;
  }
  return false;
};

/**
 * 建立留言
 * 需提供： postId、content 與 visibility
 * 若 visibility 為 mentor_participant：
 *   - 若使用者為導師，mentor_id 自動設定為當前用戶 id
 *   - 若使用者為參與者，需傳入 mentor_id，並檢查其是否有關係
 */
exports.createComment = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { postId, content, visibility, mentor_id } = req.body;
    if (!postId || !content) {
      throw new Error('缺少 postId 或 content');
    }

    // 檢查留言所屬文章是否存在
    const post = await Post.findOne({ where: { id: postId } });
    if (!post) {
      throw new Error('文章不存在');
    }

    let finalMentorId = null;
    if (visibility === 'mentor_participant') {
      // 若當前用戶為導師，自動設為本人
      if (req.user.role === 'mentor') {
        finalMentorId = req.user.id;
      } else if (req.user.role === 'participant') {
        // 參與者必須提供 mentor_id，並檢查關係是否存在
        if (!mentor_id) throw new Error('參與者留言時必須提供導師 ID');
        const relation = await MentorParticipants.findOne({
          where: { mentor_id, participant_id: req.user.id }
        });
        if (!relation) throw new Error('您與該導師之間沒有輔導關係');
        finalMentorId = mentor_id;
      } else {
        throw new Error('只有導師或參與者可以建立導師-參與者留言');
      }
    }

    // 建立留言
    const comment = await Comment.create({
      post_id: postId,
      user_id: req.user.id,
      content,
      visibility: visibility || 'private', // 預設為 private
      mentor_id: finalMentorId
    }, { transaction });

    await transaction.commit();
    return res.status(201).json(formatCommentResponse(comment.get({ plain: true })));
  } catch (error) {
    if (transaction.finished !== 'commit') await transaction.rollback();
    return res.status(400).json({
      error: true,
      message: '建立留言失敗',
      details: error.message
    });
  }
};

/**
 * 取得指定文章所有留言
 * 會根據當前用戶權限過濾留言
 */
exports.getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    // 檢查文章是否存在
    const post = await Post.findOne({ where: { id: postId } });
    if (!post) return res.status(404).json({ error: true, message: '文章不存在' });

    const comments = await Comment.findAll({
      where: { post_id: postId },
      order: [['created_at', 'ASC']]
    });

    const filtered = [];
    // 逐筆檢查留言是否允許當前用戶查看
    for (const commentInstance of comments) {
      const comment = commentInstance.get({ plain: true });
      if (await canViewComment(comment, req.user)) {
        filtered.push(formatCommentResponse(comment));
      }
    }
    return res.json(filtered);
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
 */
exports.getCommentDetail = async (req, res) => {
  try {
    const { commentId } = req.params;
    const commentInstance = await Comment.findOne({ where: { id: commentId } });
    if (!commentInstance) return res.status(404).json({ error: true, message: '留言不存在' });

    const comment = commentInstance.get({ plain: true });
    if (!(await canViewComment(comment, req.user))) {
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
 * 只允許留言建立者更新
 */
exports.updateComment = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { commentId } = req.params;
    const commentInstance = await Comment.findOne({ where: { id: commentId } });
    if (!commentInstance) {
      await transaction.rollback();
      return res.status(404).json({ error: true, message: '留言不存在' });
    }
    const comment = commentInstance.get({ plain: true });
    // 權限檢查：只有留言建立者可以更新
    if (comment.user_id !== req.user.id) {
      await transaction.rollback();
      return res.status(403).json({ error: true, message: '無權更新此留言' });
    }

    const { content, visibility, mentor_id } = req.body;
    const updates = {};
    if (content !== undefined) updates.content = content;
    if (visibility !== undefined) updates.visibility = visibility;
    if (visibility === 'mentor_participant') {
      // 如果更新為 mentor_participant，依使用者角色決定 mentor_id
      if (req.user.role === 'mentor') {
        updates.mentor_id = req.user.id;
      } else if (req.user.role === 'participant') {
        if (!mentor_id) throw new Error('參與者更新留言時必須提供導師 ID');
        // 此處可再檢查導師與參與者間的關係
        const relation = await MentorParticipants.findOne({
          where: { mentor_id, participant_id: req.user.id }
        });
        if (!relation) throw new Error('您與該導師之間沒有輔導關係');
        updates.mentor_id = mentor_id;
      }
    } else if (visibility !== 'mentor_participant') {
      // 若非此類型，清除 mentor_id
      updates.mentor_id = null;
    }

    await commentInstance.update(updates, { transaction });
    await transaction.commit();
    return res.json(formatCommentResponse(commentInstance.get({ plain: true })));
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
 * 只允許留言建立者刪除
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
