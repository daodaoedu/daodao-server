// services/commentService.js
const { 
    Comment, User, Contact, BasicInfo, Position, 
    Post, Resource, Circle, Idea, Portfolio, Note, Outcome, Review,
    MentorParticipants
  } = require('../models');
  const sequelize = require('../config/db');
  
  /**
   * 根據 targetType 與 targetId 取得對應的評論對象
   */
  const getTargetEntity = async (targetType, targetId) => {
    let entity;
    switch (targetType) {
      case 'post':
        entity = await Post.findOne({ where: { id: targetId } });
        break;
    //   case 'resource':
    //     entity = await Resource.findOne({ where: { id: targetId } });
    //     break;
      case 'circle':
        entity = await Circle.findOne({ where: { id: targetId } });
        break;
    //   case 'idea':
    //     entity = await Idea.findOne({ where: { id: targetId } });
    //     break;
    //   case 'portfolio':
    //     entity = await Portfolio.findOne({ where: { id: targetId } });
    //     break;
      case 'note':
        entity = await Note.findOne({ where: { id: targetId } });
        break;
      case 'outcome':
        entity = await Outcome.findOne({ where: { id: targetId } });
        break;
      case 'review':
        entity = await Review.findOne({ where: { id: targetId } });
        break;
      default:
        throw new Error('無效的 target_type');
    }
    if (!entity) throw new Error(`${targetType} 不存在`);
    return entity;
  };
  
  /**
   * 附加使用者資料到留言
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
   * 權限檢查
   */
  const canViewComment = async (comment, currentUser, entity, mentorRelations = null) => {
    // 若留言為 public，任何人皆可看到
    if (comment.visibility === 'public') return true;
    
    // 若沒有 currentUser 或 currentUser.id 不存在，則無法觀看非公開留言
    if (!currentUser || !currentUser.id) return false;
    
    // 強制轉換 id 為數字
    const commentUserId = Number(comment.user_id);
    const currentUserId = Number(currentUser.id);
    const entityUserId = entity ? Number(entity.user_id) : null;
    
    console.log(`權限檢查: 留言擁有者: ${commentUserId}, 當前使用者: ${currentUserId}, 目標物件擁有者: ${entityUserId}`);
    
    // 若留言屬於當前使用者，則可觀看
    if (commentUserId === currentUserId) return true;
    
    // 如果當前使用者為 mentor，檢查其關係
    if (currentUser.role === '4') {
      let relations;
      if (mentorRelations) {
        relations = Array.isArray(mentorRelations) ? mentorRelations : [...mentorRelations];
      } else {
        relations = await MentorParticipants.findAll({
          where: { mentor_id: currentUserId }
        });
      }
      // 確保 relations 為陣列，再進行 map
      const relationsArray = Array.isArray(relations) ? relations : [];
      const participantIds = new Set(relationsArray.map(rel => Number(rel.participant_id)));
      if (participantIds.has(commentUserId)) return true;
    }
    
    // 如果當前使用者為目標物件的擁有者，也允許觀看
    if (entityUserId !== null && entityUserId === currentUserId) return true;
    
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
   * 格式化留言回應資料
   */
  const formatCommentResponse = (comment) => {
    return {
      id: comment.id,
      content: comment.content,
      visibility: comment.visibility,
      createdAt: comment.created_at,
      updatedAt: comment.updated_at,
      parent_id: comment.parent_id,
      user: comment.User ? {
        id: comment.User.id,
        name: comment.User.nickname,
        _id: comment.User.external_id,
        roleList: comment.User.Positions ? comment.User.Positions.map(p => p.name) : [],
        photoURL: comment.User.Contact ? comment.User.Contact.photo_url : null,
      } : null,
      replies: []
    };
  };
  
  /**
   * 建立留言
   * 參數包含：targetType, targetId, content, visibility, parentId, userId
   */
  const createComment = async ({ targetType, targetId, content, visibility, parentId, userId }) => {
    const transaction = await sequelize.transaction();
    try {
      if (!targetType || !targetId || !content) {
        throw new Error('缺少 targetType、targetId 或 content');
      }
      const finalVisibility = ['public', 'private'].includes(visibility) ? visibility : 'private';
      
      // 取得目標對象，若不存在則拋錯
      const entity = await getTargetEntity(targetType, targetId);
      
      // 若有 parentId，驗證父留言必須屬於相同對象
      if (parentId) {
        const parentComment = await Comment.findOne({ where: { id: parentId } });
        if (!parentComment) throw new Error('父留言不存在');
        if (parentComment.target_type !== targetType || Number(parentComment.target_id) !== Number(targetId)) {
           throw new Error('父留言不屬於相同評論對象');
        }
      }
      
      // 建立留言（採用 target_type 與 target_id）
      const commentInstance = await Comment.create({
        target_type: targetType,
        target_id: targetId,
        user_id: userId,
        content,
        visibility: finalVisibility,
        parent_id: parentId || null
      }, { transaction });
      
      let comment = commentInstance.get({ plain: true });
      comment = await attachUserToComment(comment);
      
      await transaction.commit();
      return formatCommentResponse(comment);
    } catch (error) {
      if (transaction && !transaction.finished) {
        await transaction.rollback();
      }
      throw error;
    }
  };
  
  /**
   * 取得指定對象下所有留言，並組成樹狀結構
   */
  const getComments = async ({ targetType, targetId, currentUser }) => {
    const entity = await getTargetEntity(targetType, targetId);
    const commentInstances = await Comment.findAll({
      where: { target_type: targetType, target_id: targetId },
      order: [['created_at', 'ASC']]
    });
    let comments = await Promise.all(
      commentInstances.map(async (instance) => {
        let comment = instance.get({ plain: true });
        comment = await attachUserToComment(comment);
        return formatCommentResponse(comment);
      })
    );
    
    let mentorRelations = null;
    if (currentUser?.role === '4') {
      const relations = await MentorParticipants.findAll({
        where: { mentor_id: currentUser.id }
      });
      mentorRelations = new Set(Array.isArray(relations) ? relations.map(rel => rel.participant_id) : []);
    }
    
    // 因 canViewComment 為 async，先取得每筆留言是否可見的結果
    const canViewArray = await Promise.all(
      comments.map(comment =>
        canViewComment(comment, currentUser || { id: null, role: null }, entity, mentorRelations)
      )
    );
    
    // 根據 canViewArray 的結果過濾留言
    comments = comments.filter((_, index) => canViewArray[index]);
  
    return buildCommentTree(comments);
  };
  
  
  /**
   * 取得單一留言詳細資訊
   */
  const getCommentDetail = async (commentId, currentUser) => {
    const commentInstance = await Comment.findOne({ 
      where: { id: commentId },
      rejectOnEmpty: true // 避免後續 entity 查詢錯誤
    });
    
    // 強制轉換型別
    let comment = commentInstance.get({ plain: true });
    comment.user_id = Number(comment.user_id); // 確保數值型別
    
    const entity = await getTargetEntity(comment.target_type, comment.target_id);
    
    // 新增 entity 擁有者日誌
    console.log(`關聯目標物件檢查: 
      targetType: ${comment.target_type}
      targetId: ${comment.target_id}
      物件擁有者: ${entity.user_id} (${typeof entity.user_id})`);

    // 傳遞轉換後的數值型別
    const canView = await canViewComment(
      comment, 
      {
        id: currentUser ? Number(currentUser.id) : null,
        role: currentUser?.role || null
      },
      entity
    );
    
    if (!canView) throw new Error('無權查看此留言');
    return formatCommentResponse(comment);
  };
  
  /**
   * 更新留言
   */
  const updateComment = async ({ commentId, content, visibility, userId }) => {
    const transaction = await sequelize.transaction();
    try {
      let commentInstance = await Comment.findOne({ 
        where: { id: commentId },
        transaction
      });

      if (!commentInstance) {
        throw new Error('留言不存在');
      }

      console.log(`Comparing user IDs: DB=${commentInstance.user_id} (${typeof commentInstance.user_id}) vs Input=${userId} (${typeof userId})`);

      if (Number(commentInstance.user_id) !== Number(userId)) {
        throw new Error('無權更新此留言');
      }

      const updates = {};
      if (content !== undefined) updates.content = content;
      if (visibility !== undefined) {
        updates.visibility = ['public', 'private'].includes(visibility) ? visibility : 'private';
      }

      await commentInstance.update(updates, { transaction });
      await transaction.commit();
      
      return formatCommentResponse(commentInstance.get({ plain: true }));
    } catch (error) {
      if (transaction && !transaction.finished) {
        await transaction.rollback();
      }
      throw error;
    }
  };
  
  /**
   * 刪除留言
   */
  const deleteComment = async ({ commentId, userId }) => {
    const transaction = await sequelize.transaction();
    try {
      const commentInstance = await Comment.findOne({
        where: { id: commentId },
        transaction
      });

      if (!commentInstance) {
        throw new Error('留言不存在');
      }

      if (Number(commentInstance.user_id) !== Number(userId)) {
        throw new Error('無權刪除此留言');
      }

      await commentInstance.destroy({ transaction });
      await transaction.commit();
      
      return { message: '留言已刪除' };
    } catch (error) {
      if (transaction && !transaction.finished) {
        await transaction.rollback();
      }
      throw error;
    }
  };
  
  module.exports = {
    createComment,
    getComments,
    getCommentDetail,
    updateComment,
    deleteComment,
    attachUserToComment
  };  