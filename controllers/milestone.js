const { Milestone, Task, Project } = require('../models');
const sequelize = require('../config/db');

// 創建里程碑
exports.createMilestone = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const project = await Project.findOne({ where: { external_id: req.params.projectId } });

    if (!project) {
      await transaction.rollback();
      return res.status(404).json({ error: true, message: "專案不存在" });
    }

    if (project.user_id !== req.user.id) {
      await transaction.rollback();
      return res.status(403).json({ error: true, message: "無權操作此專案" });
    }

    const milestone = await Milestone.create({
      ...req.body,
      project_id: project.id
    }, { transaction });

    await transaction.commit();
    res.status(201).json(milestone);

  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ 
      error: true, 
      message: "創建里程碑失敗",
      details: error.message 
    });
  }
};

// 獲取里程碑列表
exports.getMilestones = async (req, res) => {
  try {
    const project = await Project.findOne({ where: { external_id: req.params.projectId } });
    const milestones = await Milestone.findAll({
      where: { project_id: project.id },
      include: [Task]
    });

    res.status(200).json(milestones);
  } catch (error) {
    res.status(500).json({ 
      error: true, 
      message: "獲取里程碑失敗",
      details: error.message 
    });
  }
};

// 更新里程碑
exports.updateMilestone = async (req, res) => {
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
      return res.status(403).json({ error: true, message: "無權操作此里程碑" });
    }

    await milestone.update(req.body, { transaction });
    await transaction.commit();
    res.status(200).json(milestone);

  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ 
      error: true, 
      message: "更新里程碑失敗",
      details: error.message 
    });
  }
};

// 刪除里程碑
exports.deleteMilestone = async (req, res) => {
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
      return res.status(403).json({ error: true, message: "無權操作此里程碑" });
    }

    await milestone.destroy({ transaction });
    await transaction.commit();
    res.status(200).json({ message: "里程碑已刪除" });

  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ 
      error: true, 
      message: "刪除里程碑失敗",
      details: error.message 
    });
  }
};