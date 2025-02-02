const { Review, Project } = require('../models');
const sequelize = require('../config/db');

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
    
    res.status(201).json({
      id: review.id,
      week: review.week,
      title: review.title,
      mood: review.mood,
      stress_level: review.stress_level
    });
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
      attributes: ['id', 'week', 'title', 'mood', 'stress_level', 'created_at'],
      order: [['week', 'DESC']]
    });
    
    res.json(reviews.map(r => ({
      ...r.dataValues,
      created_at: r.created_at.toISOString().split('T')[0]
    })));
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
        attributes: [
          'id', 
          'week', 
          'title', 
          'mood',
          'mood_description',
          'stress_level',
          'learning_review',
          'learning_feedback',
          'adjustment_plan',
          'created_at',
          'updated_at'
        ]
      });
  
      if (!review) {
        return res.status(404).json({
          error: true,
          message: '覆盤記錄不存在'
        });
      }
  
      const responseData = {
        ...review.dataValues,
      };
  
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

    const allowedFields = ['title', 'mood_description', 'stress_level', 'learning_feedback', 'adjustment_plan'];
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
    
    res.json({
      id: review.id,
      ...updates,
    });
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