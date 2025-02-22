const { Outcome, Post, Project } = require('../models');
const sequelize = require('../config/db');

// 統一格式化 Outcome 回傳資料，來源整合 Outcome 與關聯 Post
const formatOutcomeResponse = (outcome, post) => {
  return {
    id: outcome.id,
    week: post.week,
    title: post.title,
    content: outcome.content,
    date: safeDateFormatter(post.date),
    imageUrls: outcome?.image_urls,  // 改用 imageUrls
    videoUrls: outcome?.video_urls,  // 新增 videoUrls
    visibility: post.visibility
  };
};

// 安全日期格式化處理
const safeDateFormatter = (dateValue) => {
  try {
    const dateObj = dateValue instanceof Date ? dateValue : new Date(dateValue);
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
    // 確認專案存在
    const project = await Project.findOne({ where: { external_id: req.params.projectId } });
    if (!project) {
      throw new Error('專案不存在');
    }

    // 從 req.body 取得成果共用欄位與 Outcome 專屬欄位
    const { date, week, title, content, imageUrls, videoUrls, visibility } = req.body;

    // 日期轉換與驗證
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      throw new Error('無效的日期格式，請使用 YYYY-MM-DD 格式');
    }

    // 先建立 Post（type 設為 outcome）
    const post = await Post.create({
      project_id: project.id,
      user_id: req.user.id,
      week,
      title,
      type: 'outcome',
      date: parsedDate,
      visibility: visibility || 'private'
    }, { transaction });

    // 建立 Outcome，關聯 post_id，並存入 image_urls 與 video_urls
    const outcome = await Outcome.create({
      post_id: post.id,
      content: content,
      image_urls: imageUrls || [],
      video_urls: videoUrls || []
    }, { transaction });

    await transaction.commit();

    return res.status(201).json(
      formatOutcomeResponse(outcome.get({ plain: true }), post.get({ plain: true }))
    );
  } catch (error) {
    if (transaction.finished !== 'commit') {
      await transaction.rollback();
    }
    return res.status(400).json({ 
      error: true,
      message: error.message || '建立成果失敗',
      details: error.errors?.map(e => e.message)
    });
  }
};

exports.getOutcomes = async (req, res) => {
  try {
    // 確認專案存在
    const project = await Project.findOne({ where: { external_id: req.params.projectId } });
    if (!project) {
      return res.status(404).json({ error: true, message: '專案不存在' });
    }

    // 依據 Post.study_plan_id 與 type 'outcome' 查詢成果，並 include 關聯的 Post
    const outcomes = await Outcome.findAll({
      include: [{
        model: Post,
        where: { project_id: project.id, type: 'outcome' }
      }],
      order: [
        [Post, 'week', 'ASC'],
        [Post, 'date', 'ASC']
      ]
    });

    const formatted = outcomes.map(outcome => 
      formatOutcomeResponse(outcome.get({ plain: true }), outcome.Post.get({ plain: true }))
    );
    return res.json(formatted);
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: '取得專案成果失敗',
      details: error.message
    });
  }
};

exports.getMyOutcomes = async (req, res) => {
  try {
    // 透過 Outcome include Post，再 include Project，過濾專案擁有者為 req.user.id
    const outcomes = await Outcome.findAll({
      include: [{
        model: Post,
        where: { type: 'outcome' },
        include: [{
          model: Project,
          where: { user_id: req.user.id }
        }]
      }]
    });

    const formatted = outcomes.map(outcome =>
      formatOutcomeResponse(outcome.get({ plain: true }), outcome.Post.get({ plain: true }))
    );
    return res.status(200).json(formatted);
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "獲取用戶成果失敗",
      details: error.message
    });
  }
};

exports.getOutcomeDetail = async (req, res) => {
  try {
    // 確認專案存在
    const project = await Project.findOne({ where: { external_id: req.params.projectId } });
    if (!project) {
      return res.status(404).json({
        error: true,
        message: '專案不存在'
      });
    }

    // 根據 Outcome id 查詢，並 include Post 條件限制該成果屬於此專案且 type 為 outcome
    const outcome = await Outcome.findOne({
      where: { id: req.params.outcomeId },
      include: [{
        model: Post,
        where: { project_id: project.id, type: 'outcome' }
      }]
    });

    if (!outcome) {
      return res.status(404).json({
        error: true,
        message: '成果不存在'
      });
    }

    return res.json(
      formatOutcomeResponse(outcome.get({ plain: true }), outcome.Post.get({ plain: true }))
    );
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: '取得成果失敗',
      systemError: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.updateOutcome = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    // 確認專案存在
    const project = await Project.findOne({ where: { external_id: req.params.projectId } });
    if (!project) {
      throw new Error('專案不存在');
    }

    // 根據 Outcome id 查詢，並 include 關聯 Post（確保成果屬於該專案且 type 為 outcome）
    const outcome = await Outcome.findOne({
      where: { id: req.params.outcomeId },
      include: [{
        model: Post,
        where: { project_id: project.id, type: 'outcome' }
      }],
      transaction
    });

    if (!outcome) {
      await transaction.rollback();
      return res.status(404).json({
        error: true,
        message: '成果不存在'
      });
    }

    // 解構 req.body 取得共用欄位與 Outcome 專屬欄位
    const { week, title, content, date, imageUrls, videoUrls, visibility } = req.body;
    const updatesPost = {};
    if (week !== undefined) updatesPost.week = week;
    if (title !== undefined) updatesPost.title = title;
    if (date !== undefined) {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        throw new Error('無效的日期格式，請使用 YYYY-MM-DD 格式');
      }
      updatesPost.date = parsedDate;
    }
    if (visibility !== undefined) updatesPost.visibility = visibility;

    if (Object.keys(updatesPost).length > 0 && outcome.Post) {
      await outcome.Post.update(updatesPost, { transaction });
    }

    const updatesOutcome = {};
    if (content !== undefined) updatesPost.content = content;
    if (imageUrls !== undefined) {
      updatesOutcome.image_urls = imageUrls;
    }
    if (videoUrls !== undefined) {
      updatesOutcome.video_urls = videoUrls;
    }
    if (Object.keys(updatesOutcome).length > 0) {
      await outcome.update(updatesOutcome, { transaction });
    }

    await transaction.commit();
    return res.json(
      formatOutcomeResponse(outcome.get({ plain: true }), outcome.Post.get({ plain: true }))
    );
  } catch (error) {
    await transaction.rollback();
    return res.status(400).json({
      error: true,
      message: '更新失敗',
      details: error.errors?.map(e => e.message) || error.message
    });
  }
};

exports.deleteOutcome = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    // 確認專案存在
    const project = await Project.findOne({ where: { external_id: req.params.projectId } });
    if (!project) {
      throw new Error('專案不存在');
    }

    // 根據 Outcome id 查詢，並 include Post 限制該成果屬於此專案且 type 為 outcome
    const outcome = await Outcome.findOne({
      where: { id: req.params.outcomeId },
      include: [{
        model: Post,
        where: { project_id: project.id, type: 'outcome' }
      }],
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

    return res.json({ message: '成果已刪除' });
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({
      error: true,
      message: '刪除失敗',
      details: error.message
    });
  }
};
