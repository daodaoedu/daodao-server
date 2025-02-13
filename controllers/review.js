const { Review, Project } = require('../models');
const sequelize = require('../config/db');

const formatReviewResponse = (review) => ({
  id: review.id,
  week: review.week,
  title: review.title,
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

    const { week, title, mood, stress_level, learning_review } = req.body;
    
    // 強制驗證必要字段
    if (!mood || stress_level === undefined || learning_review === undefined) {
      await transaction.rollback();
      return res.status(400).json({
        error: true,
        message: 'mood/stress_level/learning_review 為必填字段'
      });
    }

    const review = await Review.create({
      project_id: project.id,
      week: parseInt(week),
      title: title || `第 ${week} 週覆盤`,
      mood,
      stress_level: Math.min(Math.max(1, stress_level), 10),
      learning_review: Math.min(Math.max(1, learning_review), 10),
      mood_description: req.body.mood_description,
      learning_feedback: req.body.learning_feedback,
      adjustment_plan: req.body.adjustment_plan
    }, { transaction });

    await transaction.commit();
    
    res.status(201).json(formatReviewResponse({
      ...review.get({ plain: true }),
      created_at: review.created_at
    }));
  } catch (error) {
    await transaction.rollback();
    res.status(400).json({
      error: true,
      message: '建立覆盤失敗',
      details: error.errors?.map(e => e.message)
    });
  }
};

exports.getReviews = async (req, res) => {
  try {
    const project = await Project.findOne({ where: { external_id: req.params.projectId } });

    const reviews = await Review.findAll({
      where: { project_id: project.id },
      order: [['week', 'DESC']]
    });
    
    res.json(reviews.map(formatReviewResponse));
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

      const review = await Review.findOne({
        where: {
          id: req.params.reviewId,
          project_id: project.id
        },
      });
  
      if (!review) {
        return res.status(404).json({
          error: true,
          message: '覆盤記錄不存在'
        });
      }
  
      const responseData = formatReviewResponse({
        ...review.dataValues,
      });
  
      res.json(responseData);
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

    const review = await Review.findOne({
      where: {
        id: req.params.reviewId,
        project_id: project.id
      },
      transaction
    });

    if (!review) {
      await transaction.rollback();
      return res.status(404).json({
        error: true,
        message: '覆盤記錄不存在'
      });
    }

    const allowedFields = ['title', 'mood','mood_description', 'stress_level','learning_review', 'learning_feedback', 'adjustment_plan'];
    const updates = {};
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (updates.stress_level) {
      updates.stress_level = Math.min(Math.max(1, updates.stress_level), 10);
    }

    await review.update(updates, { transaction });
    await transaction.commit();
    
    res.json(formatReviewResponse({
      ...review.get({ plain: true }),
      ...updates,
    }));
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

    const review = await Review.findOne({
      where: {
        id: req.params.reviewId,
        project_id: project.id
      },
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