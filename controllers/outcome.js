const { Outcome, Project } = require('../models');
const sequelize = require('../config/db');

// 更新統一格式化方法，加入description並使用safeDateFormatter
const formatOutcomeResponse = (outcome) => {
  return {
    id: outcome.id,
    week: outcome.week,
    title: outcome.title,
    description: outcome.description, // 新增description欄位
    date: safeDateFormatter(outcome.date), // 改用安全格式化方法
    imgUrl: outcome.img_url,
  };
}

// 安全日期格式化處理
const safeDateFormatter = (dateValue) => {
  try {
    const dateObj = dateValue instanceof Date
      ? dateValue
      : new Date(dateValue)
    if (isNaN(dateObj.getTime())) {
      return '無效日期';
    }
    return dateObj.toISOString().split('T')[0];
  } catch (e) {
    return '日期格式錯誤';
  }
};
exports.createOutcome = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const project = await Project.findOne({ where: { external_id: req.params.projectId } });

    const { date, ...rest } = req.body;
    
    // 強制日期轉換與驗證
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      throw new Error('無效的日期格式，請使用 YYYY-MM-DD 格式');
    }

    const outcome = await Outcome.create({
      ...rest,
      project_id: project.id,
      date: parsedDate,  // 確保存入的是 Date 物件
    }, { transaction });

    await transaction.commit();

    res.status(201).json(formatOutcomeResponse(outcome)); // 改用統一格式化方法

  } catch (error) {
    if (transaction.finished !== 'commit') {
      await transaction.rollback();
    }
    
    res.status(400).json({ 
      error: true,
      message: error.message || '建立成果失敗',
      details: error.errors?.map(e => e.message)
    });
  }
};


exports.getOutcomes = async (req, res) => {
  try {
    const project = await Project.findOne({ where: { external_id: req.params.projectId } });

    const outcomes = await Outcome.findAll({
      where: { project_id: project.id },
      attributes: ['id', 'week', 'title', 'description', 'date', 'img_url'],
      order: [
        ['week', 'ASC'],
        ['date', 'ASC']
      ]
    });

    res.json(outcomes.map(formatOutcomeResponse)); // 直接使用格式化方法
    
  } catch (error) {
    res.status(500).json({
      error: true,
      message: '取得專案成果失敗',
      details: error.message
    });
  }
};

exports.getMyOutcomes = async (req, res) => {
  try {
    const outcomes = await Outcome.findAll({
      include: [
        {
          model: Project,
          where: { user_id: req.user.id }
        }
      ]
    });
    
    res.status(200).json(outcomes);
  } catch (error) {
    res.status(500).json({
      error: true,
      message: "獲取用戶成果失敗",
      details: error.message
    });
  }
};

exports.getOutcomeDetail = async (req, res) => {
  try {

    const project = await Project.findOne({ where: { external_id: req.params.projectId } });
    
    if (!project) {
      return res.status(404).json({
        error: true,
        message: '專案不存在'
      });
    }

    // // 權限檢查強化版
    // const hasAccess = project.is_public || 
    //                  (req.user && (project.user_id === req.user.id || req.user.isAdmin));
    
    // if (!hasAccess) {
    //   return res.status(403).json({
    //     error: true,
    //     message: '無權限查看此專案成果',
    //     required: '專案擁有者或管理員權限'
    //   });
    // }

    // 修正為查詢單一成果
    const outcome = await Outcome.findOne({
      where: {
        id: req.params.outcomeId,
        project_id: project.id
      },
      attributes: ['id', 'week', 'title', 'description', 'date', 'img_url']
    });

    if (!outcome) {
      return res.status(404).json({
        error: true,
        message: '成果不存在'
      });
    }

    res.json(formatOutcomeResponse(outcome)); // 改用統一格式化方法
    
  } catch (error) {
    res.status(500).json({
      error: true,
      message: '取得成果失敗',
      systemError: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.updateOutcome = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const project = await Project.findOne({ where: { external_id: req.params.projectId } });

    const outcome = await Outcome.findOne({
      where: {
        id: req.params.outcomeId,
        project_id: project.id
      },
      transaction
    });

    if (!outcome) {
      await transaction.rollback();
      return res.status(404).json({
        error: true,
        message: '成果不存在'
      });
    }

    const updates = {};
    ['week', 'title', 'description', 'date', 'img_url'].forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    await outcome.update(updates, { transaction });
    await transaction.commit();
    const responseData = formatOutcomeResponse(outcome); // 改用統一格式化方法
  
    res.json(responseData);
  } catch (error) {
    await transaction.rollback();
    res.status(400).json({
      error: true,
      message: '更新失敗',
      details: error.errors?.map(e => e.message)
    });
  }
};

exports.deleteOutcome = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const project = await Project.findOne({ where: { external_id: req.params.projectId } });

    const outcome = await Outcome.findOne({
      where: {
        id: req.params.outcomeId,
        project_id: project.id
      },
      transaction
    });

    if (!outcome) {
      await transaction.rollback();
      return res.status(404).json({
        error: true,
        message: '成果不存在'
      });
    }

    await outcome.destroy({ transaction });
    await transaction.commit();
    
    res.json({ message: '成果已刪除' });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({
      error: true,
      message: '刪除失敗'
    });
  }
};