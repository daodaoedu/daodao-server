const { Review, Project, Post } = require('../models');
const sequelize = require('../config/db');

const formatReviewResponse = (review,post) => ({
  id: review.id,
  week: post.week,
  title: post.title,
  mood: review.mood,
  stressLevel: review.stress_level,
  ...(review.mood_description && { moodDescription: review.mood_description }),
  ...(review.learning_review && { learningReview: review.learning_review }),
  ...(review.learning_feedback && { learningFeedback: review.learning_feedback }),
  ...(review.adjustment_plan && { adjustmentPlan: review.adjustment_plan }),
  createdAt: safeDateFormatter(review.created_at),
  ...(review.updated_at && { updatedAt: safeDateFormatter(review.updated_at) })
});

const safeDateFormatter = (date) => date ? date.toISOString().split('T')[0] : null;

exports.createReview = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const project = await Project.findOne({ where: { external_id: req.params.projectId } });

    const { week, title, mood, moodDescription, stressLevel, learningReview, learningFeedback, adjustmentPlan, visibility } = req.body;

    // 強制驗證必要字段
    if (!mood || stressLevel === undefined || learningReview === undefined) {
      await transaction.rollback();
      return res.status(400).json({
        error: true,
        message: 'mood/stressLevel/learningReview 為必填字段'
      });
    }

    // 修改為自動產生當前日期
    const parsedDate = new Date(); // 直接使用系統時間

    // 先建立 Post（type 設為 review)
    const post = await Post.create({
      project_id: project.id,
      user_id: req.user.id,
      week,
      title,
      type: 'review',
      date: parsedDate,
      visibility: visibility || 'private'
    }, { transaction });

    const review = await Review.create({
      post_id: post.id,
      week: parseInt(week),
      title: title || `第 ${week} 週覆盤`,
      mood,
      stress_level: Math.min(Math.max(1, stressLevel), 10),
      learning_review: Math.min(Math.max(1, learningReview), 10),
      mood_description: moodDescription,
      learning_feedback: learningFeedback,
      adjustment_plan: adjustmentPlan
    }, { transaction });

    await transaction.commit();

    res.status(201).json(formatReviewResponse(review.get({ plain: true }), post.get({ plain: true })));

  } catch (error) {
    await transaction.rollback();
    res.status(400).json({
      error: true,
      message: '建立覆盤失敗',
      details: error.message
    });
  }
};

exports.getReviews = async (req, res) => {
  try {
    const project = await Project.findOne({ where: { external_id: req.params.projectId } });
    if (!project) {
      return res.status(404).json({ error: true, message: '專案不存在' });
    }
    // include Post，並根據專案與類型篩選
    const reviews = await Review.findAll({
      include: [{
        model: Post,
        where: { project_id: project.id, type: 'review' }
      }],
      order: [
        [Post, 'week', 'DESC']
      ]
    });

    res.json(reviews.map(review =>
      formatReviewResponse(review.get({ plain: true }), review.Post.get({ plain: true }))
    ));  
  } catch (error) {
    res.status(500).json({
      error: true,
      message: '取得覆盤失敗'
    });
  }
};

exports.getReviewDetail = async (req, res) => {
  try {
    const project = await Project.findOne({ where: { external_id: req.params.projectId } });
    if (!project) {
      return res.status(404).json({ error: true, message: '專案不存在' });
    }
    // 查詢時 include Post
    const review = await Review.findOne({
      where: {
        id: req.params.reviewId
      },
      include: [{
        model: Post,
        where: { project_id: project.id, type: 'review' }
      }]
    });

    if (!review) {
      return res.status(404).json({
        error: true,
        message: '覆盤記錄不存在'
      });
    }

    res.json(formatReviewResponse(review.get({ plain: true }), review.Post.get({ plain: true })));
  } catch (error) {
    res.status(500).json({
      error: true,
      message: '取得覆盤詳細資訊失敗'
    });
  }
};

exports.updateReview = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const project = await Project.findOne({ where: { external_id: req.params.projectId } });
    if (!project) {
      return res.status(404).json({ error: true, message: '專案不存在' });
    }
    // 查詢時 include Post
    const review = await Review.findOne({
      where: {
        id: req.params.reviewId
      },
      include: [{
        model: Post,
        where: { project_id: project.id, type: 'review' }
      }],
      transaction
    });

    if (!review) {
      await transaction.rollback();
      return res.status(404).json({
        error: true,
        message: '覆盤記錄不存在'
      });
    }

    const { title, mood, moodDescription, stressLevel, learningReview, learningFeedback, adjustmentPlan } = req.body;
    if (title !== undefined) {
      await review.Post.update({ title }, { transaction });
    }

    const updates = {};
    if (mood !== undefined) updates.mood = mood;
    if (moodDescription !== undefined) updates.mood_description = moodDescription;
    if (stressLevel !== undefined) updates.stress_level = Math.min(Math.max(1, stressLevel), 10);
    if (learningReview !== undefined) updates.learning_review = Math.min(Math.max(1, learningReview), 10);
    if (learningFeedback !== undefined) updates.learning_feedback = learningFeedback;
    if (adjustmentPlan !== undefined) updates.adjustment_plan = adjustmentPlan;

    if (Object.keys(updates).length > 0) {
      await review.update(updates, { transaction });
    }

    await transaction.commit();
    res.json(formatReviewResponse(review.get({ plain: true }), review.Post.get({ plain: true })));
  } catch (error) {
    await transaction.rollback();
    res.status(400).json({
      error: true,
      message: '更新失敗',
      details: error.errors?.map(e => e.message)
    });
  }
};

exports.deleteReview = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const project = await Project.findOne({ where: { external_id: req.params.projectId } });
    if (!project) {
      return res.status(404).json({ error: true, message: '專案不存在' });
    }

    // 查詢時 include Post
    const review = await Review.findOne({
      where: {
        id: req.params.reviewId
      },
      include: [{
        model: Post,
        where: { project_id: project.id, type: 'review' }
      }],
      transaction
    });
    
    if (!review) {
      await transaction.rollback();
      return res.status(404).json({
        error: true,
        message: '覆盤記錄不存在'
      });
    }

    await review.destroy({ transaction });
    await transaction.commit();

    res.json({ success: true });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({
      error: true,
      message: '刪除失敗'
    });
  }
};