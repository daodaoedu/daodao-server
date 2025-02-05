const { Task, Milestone, Project } = require('../models');
const sequelize = require('../config/db');

// 創建任務
exports.createTask = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const project = await Project.findOne({ where: { external_id: req.params.projectId } });

    const milestone = await Milestone.findOne({
      where: { 
        id: req.params.milestoneId,
        project_id: project.id 
      },
      transaction
    });

    if (!milestone) {
      await transaction.rollback();
      return res.status(404).json({ error: true, message: "里程碑不存在" });
    }
    
    if (project.user_id !== req.user.id) {
      await transaction.rollback();
      return res.status(403).json({ error: true, message: "無權操作此任務" });
    }

    const task = await Task.create({
      ...req.body,
      milestone_id: req.params.milestoneId
    }, { transaction });

    await transaction.commit();
    res.status(201).json(task);

  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ 
      error: true, 
      message: "創建任務失敗",
      details: error.message 
    });
  }
};

exports.getTasks = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
      const task = await Task.create({
        ...req.body,
        milestone_id: req.params.milestoneId
      }, { transaction });
      res.status(200).json(task);
    } catch (error) {
      res.status(500).json({ 
        error: true, 
        message: "獲取任務失敗",
        details: error.message 
      });
    }
  };

// 更新任務
exports.updateTask = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    // 取得專案，確認用戶權限
    const project = await Project.findOne({ 
      where: { external_id: req.params.projectId } 
    });

    if (!project) {
      await transaction.rollback();
      return res.status(404).json({ error: true, message: "專案不存在" });
    }

    const task = await Task.findOne({
      where: { 
        id: req.params.taskId,
        milestone_id: req.params.milestoneId 
      },
      transaction
    });

    if (!task) {
      await transaction.rollback();
      return res.status(404).json({ error: true, message: "任務不存在" });
    }
    
    // 確保用戶有權限修改這個專案內的任務
    if (project.user_id !== req.user.id) {
      await transaction.rollback();
      return res.status(403).json({ error: true, message: "無權操作此任務" });
    }

    // 更新任務
    await task.update(req.body, { transaction });

    await transaction.commit();
    res.status(200).json({ success: true, task });

  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ 
      error: true, 
      message: "更新任務失敗",
      details: error.message 
    });
  }
};

// 刪除任務
exports.deleteTask = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const project = await Project.findOne({ where: { external_id: req.params.projectId } });

    const task = await Task.findOne({
      where: { 
        id: req.params.taskId,
        milestone_id: req.params.milestoneId 
      },
      transaction
    });

    if (!task) {
      await transaction.rollback();
      return res.status(404).json({ error: true, message: "任務不存在" });
    }
    
    if (project.user_id !== req.user.id) {
      await transaction.rollback();
      return res.status(403).json({ error: true, message: "無權操作此任務" });
    }

    await task.destroy({ transaction });
    await transaction.commit();
    res.status(200).json({ message: "任務已刪除" });

  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ 
      error: true, 
      message: "刪除任務失敗",
      details: error.message 
    });
  }
};
