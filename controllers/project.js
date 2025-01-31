const { Project, User, Milestone, Task } = require('../models');
const sequelize = require('../config/db');
const { Op } = require('sequelize');

// 創建學習計畫
exports.createProject = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      imgUrl,
      topic,
      description,
      motivation,          // ['driven_by_curiosity', 'interest_and_passion', ...]
      motivationDescription,
      goal,
      content,
      strategy,           // ['book_reading', 'watching_videos', ...]
      strategyDescription,
      resourceName,       // ['資源1', '資源2']
      resourceUrl,        // ['url1', 'url2']
      outcome,            // ['building_websites', 'making_videos', ...]
      outcomeDescription,
      isPublic = false,
      status = 'Not Started',
      startDate,
      endDate,
      interval,          // 週期間隔（週）
      milestones = []    // 里程碑數據
    } = req.body;

    // 驗證必填字段
    if (!topic || !startDate || !endDate || !interval) {
      return res.status(400).json({
        error: true,
        message: "缺少必要欄位"
      });
    }

    // 驗證日期
    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({
        error: true,
        message: "結束日期必須晚於開始日期"
      });
    }

    // 創建學習計畫
    const project = await Project.create({
      user_id: req.user.id,
      img_url: imgUrl,
      topic,
      description,
      motivation,
      motivation_description: motivationDescription,
      goal,
      content,
      strategy,
      strategy_description: strategyDescription,
      resource_name: resourceName,
      resource_url: resourceUrl,
      outcome,
      outcome_description: outcomeDescription,
      is_public: isPublic,
      status,
      start_date: startDate,
      end_date: endDate,
      interval,
      created_by: req.user.id,
      updated_by: req.user.id,
      version: 1
    }, { transaction });

    // 創建里程碑
    if (milestones.length > 0) {
      const milestonesData = milestones.map(milestone => ({
        project_id: project.id,
        week: milestone.week,
        name: milestone.name,
        description: milestone.description,
        start_date: milestone.startDate,
        end_date: milestone.endDate,
        is_completed: false
      }));

      await Milestone.bulkCreate(milestonesData, { transaction });
    }

    // 獲取完整的學習計畫信息
    const createdProject = await Project.findOne({
      where: { id: project.id },
      include: [
        {
          model: User,
          attributes: ['id', 'nickname', 'external_id']
        },
        {
          model: Milestone,
          include: [Task]
        }
      ],
      transaction
    });

    await transaction.commit();
    res.status(201).json(formatProjectResponse(createdProject));

  } catch (error) {
    await transaction.rollback();
    console.error('創建學習計畫錯誤：', error);
    res.status(500).json({
      error: true,
      message: "創建學習計畫失敗",
      details: error.message
    });
  }
};

// 獲取學習計畫列表
exports.getFilteredProjects = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20,
      status,
      isPublic,
      search
    } = req.query;

    // 修正後的條件構建邏輯
    const whereConditions = {
      [Op.and]: [] // 使用 AND 組合多個條件組
    };

    // 權限條件組
    const permissionConditions = {
      [Op.or]: [
        { is_public: true }  // 總是包含公開計畫
      ]
    };

    // 添加登入用戶的私有計畫條件
    if (req.user?.id) {
      permissionConditions[Op.or].push({
        user_id: req.user.id,
        is_public: false
      });
    }

    whereConditions[Op.and].push(permissionConditions);

    // 添加狀態過濾
    if (status) {
      whereConditions[Op.and].push({ status });
    }

    // 添加公開性過濾
    if (isPublic !== undefined) {
      whereConditions[Op.and].push({ 
        is_public: isPublic === 'true' 
      });
    }

    // 添加搜索條件
    if (search) {
      whereConditions[Op.and].push({
        [Op.or]: [
          { topic: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } }
        ]
      });
    }

    const projects = await Project.findAndCountAll({
      where: whereConditions,
      distinct: true,  // 添加 distinct 確保正確計數
      include: [
        {
          model: User,
          attributes: ['id', 'nickname', 'external_id'],
          required: false
        },
        {
          model: Milestone,
          include: [Task],
          required: false
        }
      ],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [['created_at', 'DESC']]
    });

    res.status(200).json({
      total: projects.count,
      page: parseInt(page),
      totalPages: Math.ceil(projects.count / limit),
      data: projects.rows.map(project => ({
        id: project.id,
        externalId: project.external_id,
        topic: project.topic,
        description: project.description,
        isPublic: project.is_public,
        status: project.status,
        startDate: project.start_date,
        endDate: project.end_date,
        // 僅顯示部分基本信息
        ...(req.user?.id === project.user_id && {
          // 如果是擁有者，顯示完整信息
          motivation: project.motivation,
          strategy: project.strategy,
          milestones: project.Milestones
        }),
        owner: project.User ? {
          id: project.User.external_id,
          nickname: project.User.nickname
        } : null
      }))
    });

  } catch (error) {
    console.error('獲取學習計畫列表錯誤：', error);
    res.status(500).json({
      error: true,
      message: "獲取學習計畫列表失敗",
      details: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
};
// 獲取學習計畫列表
exports.getProjects = async (req, res) => {
    try {
      const { 
        page = 1, 
        limit = 20
      } = req.query;
  
      const projects = await Project.findAndCountAll({
        where: {},  // 移除所有過濾條件
        distinct: true,  
        include: [
          {
            model: User,
            attributes: ['id', 'nickname', 'external_id'],
            required: false
          },
          {
            model: Milestone,
            include: [Task],
            required: false
          }
        ],
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit),
        order: [['created_at', 'DESC']]
      });
  
      res.status(200).json({
        total: projects.count,
        page: parseInt(page),
        totalPages: Math.ceil(projects.count / limit),
        data: projects.rows.map(project => ({
            ...formatProjectResponse(project) }))
      });
  
    } catch (error) {
      console.error('獲取學習計畫列表錯誤：', error);
      res.status(500).json({
        error: true,
        message: "獲取學習計畫列表失敗",
        details: process.env.NODE_ENV === 'development' ? error.message : null
      });
    }
  };
  

// 格式化響應數據
const formatProjectResponse = (project) => {
  const projectJson = project.toJSON();
  return {
    id: projectJson.id,
    userId: projectJson.user_id,
    imgUrl: projectJson.img_url,
    topic: projectJson.topic,
    description: projectJson.description,
    motivation: projectJson.motivation,
    motivationDescription: projectJson.motivation_description,
    goal: projectJson.goal,
    content: projectJson.content,
    strategy: projectJson.strategy,
    strategyDescription: projectJson.strategy_description,
    resourceName: projectJson.resource_name,
    resourceUrl: projectJson.resource_url,
    outcome: projectJson.outcome,
    outcomeDescription: projectJson.outcome_description,
    isPublic: projectJson.is_public,
    status: projectJson.status,
    startDate: projectJson.start_date,
    endDate: projectJson.end_date,
    interval: projectJson.interval,
    createdAt: projectJson.created_at,
    updatedAt: projectJson.updated_at,
    version: projectJson.version,
    user: projectJson.User ? {
      id: projectJson.User.id,
      nickname: projectJson.User.nickname,
      externalId: projectJson.User.external_id
    } : null,
    milestones: projectJson.Milestones?.map(m => ({
      id: m.id,
      projectId: m.project_id,
      week: m.week,
      name: m.name,
      description: m.description,
      startDate: m.start_date,
      endDate: m.end_date,
      isCompleted: m.is_completed,
      tasks: m.Tasks?.map(t => ({
        id: t.id,
        name: t.name,
        description: t.description,
        daysOfWeek: t.days_of_week,
        isCompleted: t.is_completed
      }))
    }))
  };
};

// 獲取單個學習計畫
exports.getProject = async (req, res) => {
    try {
      const project = await Project.findOne({
        where: { external_id: req.params.externalId },
        include: [
          {
            model: User,
            attributes: ['id', 'nickname', 'external_id']
          },
          {
            model: Milestone,
            include: [Task]
          }
        ]
      });
  
      if (!project) {
        return res.status(404).json({
          error: true,
          message: "學習計畫不存在"
        });
      }
  
    //   // 檢查訪問權限
    //   if (!project.is_public && project.user_id !== req.user.id) {
    //     return res.status(403).json({
    //       error: true,
    //       message: "無權訪問此學習計畫"
    //     });
    //   }
  
      res.status(200).json(formatProjectResponse(project));
  
    } catch (error) {
      console.error('獲取學習計畫詳情錯誤：', error);
      res.status(500).json({
        error: true,
        message: "獲取學習計畫詳情失敗",
        details: error.message
      });
    }
  };
  
  // 更新學習計畫
  exports.updateProject = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
      const project = await Project.findOne({
        where: { id: req.params.id },
        include: [
          {
            model: User,
            attributes: ['id', 'nickname', 'external_id']
          },
          {
            model: Milestone,
            include: [Task]
          }
        ],
        transaction
      });
  
      if (!project) {
        await transaction.rollback();
        return res.status(404).json({
          error: true,
          message: "學習計畫不存在"
        });
      }
  
      // 檢查權限
      if (project.user_id !== req.user.id) {
        await transaction.rollback();
        return res.status(403).json({
          error: true,
          message: "無權更新此學習計畫"
        });
      }
  
      const {
        imgUrl,
        topic,
        description,
        motivation,
        motivationDescription,
        goal,
        content,
        strategy,
        strategyDescription,
        resourceName,
        resourceUrl,
        outcome,
        outcomeDescription,
        isPublic,
        status,
        startDate,
        endDate,
        interval,
        milestones
      } = req.body;
  
      // 驗證日期
      if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
        await transaction.rollback();
        return res.status(400).json({
          error: true,
          message: "結束日期必須晚於開始日期"
        });
      }
  
      // 更新學習計畫
      await project.update({
        imgUrl,
        topic,
        description,
        motivation,
        motivationDescription,
        goal,
        content,
        strategy,
        strategyDescription,
        resourceName,
        resourceUrl,
        outcome,
        outcomeDescription,
        isPublic,
        status,
        startDate,
        endDate,
        interval,
        updatedBy: req.user.id,
        version: project.version + 1
      }, { transaction });
  
      // 如果提供了里程碑數據，更新里程碑
      if (milestones) {
        // 刪除現有里程碑（會級聯刪除相關的任務）
        await Milestone.destroy({
          where: { project_id: project.id },
          transaction
        });
  
        // 創建新的里程碑
        if (milestones.length > 0) {
          const milestonesData = milestones.map(milestone => ({
            projectId: project.id,
            week: milestone.week,
            name: milestone.name,
            description: milestone.description,
            startDate: milestone.startDate,
            endDate: milestone.endDate,
            isCompleted: milestone.isCompleted || false
          }));
  
          await Milestone.bulkCreate(milestonesData, { transaction });
        }
      }
  
      // 獲取更新後的完整信息
      const updatedProject = await Project.findOne({
        where: { id: project.id },
        include: [
          {
            model: User,
            attributes: ['id', 'nickname', 'external_id']
          },
          {
            model: Milestone,
            include: [Task]
          }
        ],
        transaction
      });
  
      await transaction.commit();
      res.status(200).json(formatProjectResponse(updatedProject));
  
    } catch (error) {
      await transaction.rollback();
      console.error('更新學習計畫錯誤：', error);
      res.status(500).json({
        error: true,
        message: "更新學習計畫失敗",
        details: error.message
      });
    }
  };
  
  // 刪除學習計畫
  exports.deleteProject = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
      const project = await Project.findOne({
        where: { id: req.params.id },
        transaction
      });
  
      if (!project) {
        await transaction.rollback();
        return res.status(404).json({
          error: true,
          message: "學習計畫不存在"
        });
      }
  
      // 檢查權限
      if (project.user_id !== req.user.id) {
        await transaction.rollback();
        return res.status(403).json({
          error: true,
          message: "無權刪除此學習計畫"
        });
      }
  
      // 刪除學習計畫（會級聯刪除相關的里程碑、任務等）
      await project.destroy({ transaction });
  
      await transaction.commit();
      res.status(200).json({
        message: "學習計畫已成功刪除"
      });
  
    } catch (error) {
      await transaction.rollback();
      console.error('刪除學習計畫錯誤：', error);
      res.status(500).json({
        error: true,
        message: "刪除學習計畫失敗",
        details: error.message
      });
    }
  };
  
