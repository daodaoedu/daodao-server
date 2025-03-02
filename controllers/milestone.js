const { Milestone, Task, Project } = require('../models');
const sequelize = require('../config/db');

const formatMilestoneResponse = (milestone) => {
  const milestoneJson = milestone.toJSON();

  return {
    id: milestoneJson.id,
    position: milestoneJson.position,
    name: milestoneJson.name,
    description: milestoneJson.description || "",
    startDate: milestoneJson.start_date,
    endDate: milestoneJson.end_date,
    isCompleted: milestoneJson.is_completed,
    tasks: (milestoneJson.Tasks || []).map(t => ({
      id: t.id,
      name: t.name,
      position: t.position,
      description: t.description || "",
      daysOfWeek: t.days_of_week,
      isCompleted: t.is_completed
    }))
  };
};
// 創建里程碑
exports.createMilestone = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const project = await Project.findOne({ where: { external_id: req.params.projectId } });

    if (!project) {
      await transaction.rollback();
      return res.status(404).json({ error: true, message: "專案不存在" });
    }

    if (project.user_id.toString() !== req.user.id.toString()) {
      await transaction.rollback();
      return res.status(403).json({ error: true, message: "無權操作此專案" });
    }

    // 新增日期格式和關係驗證
    if (!req.body.startDate || !req.body.endDate) {
      await transaction.rollback();
      return res.status(400).json({ error: true, message: "必須提供開始和結束日期" });
    }

    const startDate = new Date(req.body.startDate);
    const endDate = new Date(req.body.endDate);
    
    if (startDate >= endDate) {
      await transaction.rollback();
      return res.status(400).json({ error: true, message: "結束日期必須晚於開始日期" });
    }

    // 新增週數驗證 (根據 schema 的註解要求)
    if (req.body.position && req.body.position  <= 0) {
      await transaction.rollback();
      return res.status(400).json({ error: true, message: "position 必須為正整數" });
    }

    const milestone = await Milestone.create({
        project_id: project.id,
        position: req.body?.position,
        name: req.body?.name,
        description: req.body?.description,
        start_date: req.body?.startDate,
        end_date: req.body?.endDate,
        is_completed: req.body?.isCompleted || false
    }, { transaction });

    await transaction.commit();
    res.status(201).json(formatMilestoneResponse(milestone));

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

    res.status(200).json(milestones.map(m => formatMilestoneResponse(m)));
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

    console.log('project.user_id',project.user_id)
    console.log('req.user.id',req.user.id)

    // 將兩者都轉換為字串進行比較
    if (project.user_id.toString() !== req.user.id.toString()) {
      await transaction.rollback();
      return res.status(403).json({ error: true, message: "無權操作此里程碑" });
    }

    // 新增日期驗證
    if (req.body.startDate || req.body.endDate) {
      const startDate = new Date(req.body.startDate || milestone.start_date);
      const endDate = new Date(req.body.endDate || milestone.end_date);
      
      if (startDate >= endDate) {
        await transaction.rollback();
        return res.status(400).json({ error: true, message: "結束日期必須晚於開始日期" });
      }
    }

    // 新增週數驗證
    if (req.body.position !== undefined && req.body.position <= 0) {
      await transaction.rollback();
      return res.status(400).json({ error: true, message: "position必須為正整數" });
    }

    await milestone.update({
        position: req.body?.position,
        name: req.body?.name,
        description: req.body?.description,
        start_date: req.body?.startDate,
        end_date: req.body?.endDate,
        is_completed: req.body?.isCompleted
    }
    , { transaction });
    await transaction.commit();
    res.status(200).json(formatMilestoneResponse(milestone));

  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
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
