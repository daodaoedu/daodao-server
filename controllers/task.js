const { Task, Milestone, Project } = require('../models');
const sequelize = require('../config/db');



const formatTask = (task) => {
  return {
    isCompleted: task?.is_completed,
    isDeleted: task?.is_deleted,
    createdAt: task?.created_at,
    updatedAt: task?.updated_at,
    id: task?.id,
    name: task?.name,
    description: task?.description,
    milestoneId: task?.milestone_id,
    daysOfWeek: task?.days_of_week
  };
};
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

    res.status(201).json(formatTask(task));

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
  try {
    // 先確認專案是否存在，確保用戶有權限
    const project = await Project.findOne({ 
      where: { external_id: req.params.projectId }
    });

    if (!project) {
      return res.status(404).json({ error: true, message: "專案不存在" });
    }

    // 取得某個里程碑下的所有任務
    const tasks = await Task.findAll({
      where: {
        milestone_id: req.params.milestoneId
      },
      order: [['created_at', 'DESC']] // 依建立時間排序
    });

    const formattedTasks = tasks.map(formatTask);
    res.status(200).json({ success: true, tasks: formattedTasks });

  } catch (error) {
    res.status(500).json({ 
      error: true, 
      message: "獲取任務失敗",
      details: error.message 
    });
  }
};


exports.getTask = async (req, res) => {
  try {
    // 取得專案，確認用戶權限
    const project = await Project.findOne({ 
      where: { external_id: req.params.projectId } 
    });

    console.log("project",project)

    if (!project) {
      return res.status(404).json({ error: true, message: "專案不存在" });
    }

    // 查詢指定的任務
    const task = await Task.findOne({
      where: {
        id: req.params.taskId,
        milestone_id: req.params.milestoneId
      }
    });

    console.log("task",task)

    if (!task) {
      return res.status(404).json({ error: true, message: "任務不存在" });
    }

    // 確保用戶有權限查看這個專案內的任務
    if (project.user_id !== req.user.id) {
      return res.status(403).json({ error: true, message: "無權存取此任務" });
    }

    res.status(200).json({ success: true, task: formatTask(task) });

  } catch (error) {
    res.status(500).json({ 
      error: true, 
      message: "取得任務失敗",
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
    res.status(200).json({ success: true, task: formatTask(task) });

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
