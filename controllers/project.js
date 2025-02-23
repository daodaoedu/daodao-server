const { Project, User, Milestone, Task, Contact, BasicInfo, Position, ProjectMarathon, Marathon } = require('../models');
const sequelize = require('../config/db');
const { Op } = require('sequelize');
// 格式化響應數據
const formatProjectResponse = (project) => {
  const projectJson = project.toJSON();

  // 获取关联的马拉松信息
  const marathonInfo = projectJson.ProjectMarathons?.[0]?.Marathon;

  return {
    id: projectJson.external_id,
    userId: projectJson.user_id,
    imgUrl: projectJson.img_url,
    title: projectJson.title,
    description: projectJson.description,
    motivation: projectJson.motivation,
    motivationDescription: projectJson.motivation_description,
    goal: projectJson.goal,
    content: projectJson.content,
    strategy: projectJson.strategy,
    strategyDescription: projectJson.strategy_description,
    resourceName: projectJson.resource,
    outcome: projectJson.outcome,
    outcomeDescription: projectJson.outcome_description,
    isPublic: projectJson.is_public,
    status: projectJson.status,
    startDate: marathonInfo?.start_date || projectJson.start_date, // 優先使用馬拉松日期
    endDate: marathonInfo?.end_date || projectJson.end_date,
    interval: projectJson.interval,
    createdAt: projectJson.created_at,
    updatedAt: projectJson.updated_at,
    version: projectJson.version,
    eventId: marathonInfo?.event_id || null, // 新增關聯馬拉松ID
    user: projectJson.User ? {
      id: projectJson.User.id,
      name: projectJson.User.nickname,
      _id: projectJson.User.external_id,
      roleList: projectJson.User.Positions?.map(p => p.name) || [],
      photoURL: projectJson.User.Contact?.photo_url,
    } : null,
    milestones: projectJson.Milestones?.map(m => ({
      id: m.id,
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

// 創建學習計畫
exports.createProject = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      imgUrl,
      title,
      description,
      motivation,          // ['driven_by_curiosity', 'interest_and_passion', ...]
      motivationDescription,
      goal,
      content,
      strategy,           // ['book_reading', 'watching_videos', ...]
      strategyDescription,
      resourceName,       // ['資源1', '資源2']
      outcome,            // ['building_websites', 'making_videos', ...]
      outcomeDescription,
      isPublic = false,
      status = 'Not Started',
      startDate,
      endDate,
      interval,          // 週期間隔（週）
      milestones = []    // 里程碑數據
    } = req.body;

    console.log("req.user", req.user)
    console.log("req.user.role", req.user.role)

    const user = await User.findOne({
      where: { external_id: req.user._id },  // 使用external_id查詢
      transaction
    });

    if (!user) {
      await transaction.rollback();
      return res.status(404).json({
        error: true,
        message: "用戶不存在"
      });
    }    // // 新增角色和數量驗證
    // if (user.roleId === 2) {
    //   await transaction.rollback();
    //   return res.status(403).json({
    //     error: true,
    //     message: "此角色無權新增學習計畫"
    //   });
    // }

    // if (user.roleId === 3) {
    //   const projectCount = await Project.count({
    //     where: { user_id: req.user.id },
    //     transaction
    //   });

    //   if (projectCount >= 3) {
    //     await transaction.rollback();
    //     return res.status(400).json({
    //       error: true,
    //       message: "已達最大學習計畫數量限制（3個）"
    //     });
    //   }
    // }

    // 驗證必填字段
    if (!title) {
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

    console.log("createProject.req.user", req.user);

    // 創建學習計畫
    const project = await Project.create({
      user_id: req.user.id,
      img_url: imgUrl,
      title: title,
      description,
      motivation,
      motivation_description: motivationDescription,
      goal,
      content,
      strategy,
      strategy_description: strategyDescription,
      resource: resourceName,
      outcome,
      outcome_description: outcomeDescription,
      is_public: isPublic,
      status,
      start_date: startDate,
      end_date: endDate,
      interval,
      created_by: req.user.id,
      updated_by: req.user.id,
      version: 2
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
      [Op.and]: [
        { version: 2 },  // 新增 version 過濾
        {
          [Op.or]: [] // 使用 OR 組合多個條件組
        }
      ]
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

    whereConditions[Op.and][1] = permissionConditions;

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
          { title: { [Op.iLike]: `%${search}%` } },
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
        title: project.title,
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
          name: project.User.nickname
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
    const { page = 1, pageSize = 20 } = req.query;

    // // 根據 isPublic 參數建立 where 條件
    const where = {
      version: 2,
      is_public: true
    };
    // if (typeof isPublic !== 'undefined') {
    //   // 將字串 "true" 或 "false" 轉換成布林值
    //   where.is_public = isPublic === 'true';
    // }

    const projects = await Project.findAndCountAll({
      where, // 使用 where 條件
      distinct: true,
      include: [
        {
          model: User,
          attributes: ['id', 'nickname', 'external_id'],
          include: [
            { model: Contact },
            { model: BasicInfo },
            {
              model: Position,
              through: { attributes: [] }
            }
          ]
        },
        {
          model: ProjectMarathon,
          include: [{
            model: Marathon,
          }]
        },
        {
          model: Milestone,
          include: [Task]
        }
      ],
      limit: parseInt(pageSize),
      offset: (parseInt(page) - 1) * parseInt(pageSize),
      order: [['created_at', 'DESC']]
    });

    res.status(200).json({
      total: projects.count,
      page: parseInt(page),
      totalPages: Math.ceil(projects.count / pageSize),
      data: projects.rows.map(project => ({
        ...formatProjectResponse(project)
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


// 獲取我的學習計畫
exports.getMyProjects = async (req, res) => {
  console.log("user_id: ", req.user)
  try {
    const projects = await Project.findAll({
      where: { user_id: req.user.id, version: 2 },
      include: [
        {
          model: User,
          attributes: ['id', 'nickname', 'external_id'],
          include: [
            { model: Contact },
            { model: BasicInfo },
            {
              model: Position,
              through: { attributes: [] }
            }
          ]
        },
        {
          model: ProjectMarathon,
          include: [{
            model: Marathon,
          }]
        },
        {
          model: Milestone,
          include: [Task]
        }
      ]
    });
    console.log('projects', projects);
    res.status(200).json(projects.map(project => formatProjectResponse(project)));
  } catch (error) {
    console.error('獲取我的學習計畫錯誤：', error);
    res.status(500).json({ error: true, message: '獲取我的學習計畫失敗' });
  }
};

exports.getProject = async (req, res) => {
  try {
    const project = await Project.findOne({
      where: { 
        external_id: req.params.projectId,
        version: 2 , // 新增 version 條件
      },
      include: [
        {
          model: User,
          attributes: ['id', 'nickname', 'external_id'],
          include: [
            { model: Contact },
            { model: BasicInfo },
            {
              model: Position,
              through: { attributes: [] }
            }
          ]
        },
        {
          model: ProjectMarathon,
          include: [{
            model: Marathon,
          }]
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
      where: { 
        external_id: req.params.projectId,
        version: 2  // 新增 version 條件
      },
      include: [
        {
          model: User,
          attributes: ['id', 'nickname', 'external_id'],
          include: [
            { model: Contact },
            { model: BasicInfo },
            {
              model: Position,
              through: { attributes: [] }
            }
          ]
        },
        {
          model: ProjectMarathon,
          include: [{
            model: Marathon,
          }]
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
    if (project.user_id.toString() !== req.user.id.toString()) {
      await transaction.rollback();
      return res.status(403).json({
        error: true,
        message: "無權更新此學習計畫"
      });
    }

    const {
      imgUrl,
      title,
      description,
      motivation,
      motivationDescription,
      goal,
      content,
      strategy,
      strategyDescription,
      resourceName,
      outcome,
      outcomeDescription,
      isPublic,
      status,
      startDate,
      endDate,
      interval,
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
      img_url: imgUrl,
      title: title,
      description,
      motivation,
      motivation_description: motivationDescription,
      goal,
      content,
      strategy,
      strategy_description: strategyDescription,
      resource: resourceName,
      outcome,
      outcome_description: outcomeDescription,
      is_public: isPublic,
      status,
      start_date: startDate,
      end_date: endDate,
      interval,
      updated_by: req.user.id,
    }, { transaction });

    // 獲取更新後的完整信息
    const updatedProject = await Project.findOne({
      where: { id: project.id },
      include: [
        {
          model: User,
        },
        {
          model: Milestone,
          include: [Task]
        }
      ],
      transaction
    });

    console.log(updatedProject);

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
      where: { external_id: req.params.projectId },
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
    if (project.user_id.toString() !== req.user.id.toString()) {
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

