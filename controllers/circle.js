const { Activity, User } = require('../models');
const sequelize = require('../config/db');
const { Op } = require('sequelize');

// 取得活動清單（含分頁與搜尋）
exports.getActivity = async (req, res) => {
  try {
    // 從 query 或 params 取得相關條件
    const {
      page = 1,
      pageSize = 30,
      activityCategory,
      area,
      partnerEducationStep,
      isGrouping,
      category,
      search
    } = req.query;
    const pageInt = parseInt(page, 10);
    const pageSizeInt = parseInt(pageSize, 10);
    const id = req.params.id;
    const userId = req.params.userId;

    // 組合 where 條件
    const filter = {};
    if (userId) filter.userId = userId;
    if (id) filter.id = id;
    if (activityCategory) filter.activityCategory = activityCategory;
    if (area) filter.area = area;
    if (partnerEducationStep) filter.partnerEducationStep = partnerEducationStep;
    // 注意 isGrouping 可能為布林值，需判斷是否為 undefined
    if (typeof isGrouping !== 'undefined') filter.isGrouping = isGrouping;
    if (category) filter.category = category;

    // 當有搜尋條件時，利用 OR 條件模糊搜尋各個欄位
    if (search) {
      filter[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { category: { [Op.iLike]: `%${search}%` } },
        { area: { [Op.iLike]: `%${search}%` } },
        { partnerStyle: { [Op.iLike]: `%${search}%` } },
        { partnerEducationStep: { [Op.iLike]: `%${search}%` } },
        { motivation: { [Op.iLike]: `%${search}%` } },
        { content: { [Op.iLike]: `%${search}%` } },
        { outcome: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { tagList: { [Op.iLike]: `%${search}%` } },
        { activityCategory: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // 使用 findAndCountAll 同時取得資料與總筆數
    const { count, rows } = await Activity.findAndCountAll({
      where: filter,
      order: [
        ['isGrouping', 'DESC'],
        ['updatedDate', 'DESC']
      ],
      offset: (pageInt - 1) * pageSizeInt,
      limit: pageSizeInt,
      include: [{
        model: User,
        as: 'user',
        attributes: ['photoURL', 'name', 'email', 'educationStage', 'location', 'roleList']
      }]
    });

    const totalPages = Math.ceil(count / pageSizeInt);
    res.json({
      data: rows,
      page: pageInt,
      pageSize: pageSizeInt,
      totalCount: count,
      totalPages
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// 新增活動
exports.createActivity = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { title } = req.body;
    // 檢查是否已存在相同 title 的活動
    const existingActivity = await Activity.findOne({ where: { title } });
    if (existingActivity) {
      await transaction.rollback();
      return res.status(400).json({ message: "Activity already exists" });
    }
    // 建立新的活動記錄
    const newActivity = await Activity.create(req.body, { transaction });
    await transaction.commit();
    res.status(201).json({ data: newActivity });
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// 更新活動
exports.updateActivity = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const id = req.params.id;
    const userId = req.user.id; // 注意：此處根據你驗證 middleware 提供的 user 資訊
    const activity = await Activity.findByPk(id, { transaction });
    if (!activity) {
      await transaction.rollback();
      return res.status(404).json({ error: "Activity not found" });
    }
    if (activity.userId !== userId) {
      await transaction.rollback();
      return res.status(403).json({ error: "You are not authorized to update this activity" });
    }

    // 指定可更新的欄位
    const fieldsToUpdate = [
      'title', 'photoURL', 'photoAlt', 'category', 'activityCategory',
      'area', 'time', 'participator', 'partnerStyle', 'partnerEducationStep',
      'motivation', 'content', 'description', 'outcome', 'tagList',
      'notice', 'isGrouping', 'deadline', 'isNeedDeadline', 'views'
    ];
    let updated = false;
    fieldsToUpdate.forEach(field => {
      if (req.body[field] !== undefined) {
        activity[field] = req.body[field];
        updated = true;
      }
    });

    if (updated) {
      activity.updatedDate = new Date();
      await activity.save({ transaction });
      await transaction.commit();
      res.json({ data: activity, message: "Activity updated successfully." });
    } else {
      await transaction.rollback();
      res.json({ message: "No fields were updated" });
    }
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// 刪除活動
exports.deleteActivity = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const id = req.params.id;
    const userId = req.user.id;
    const activity = await Activity.findByPk(id, { transaction });
    if (!activity) {
      await transaction.rollback();
      return res.status(404).json({ error: "Activity not found" });
    }
    if (activity.userId !== userId) {
      await transaction.rollback();
      return res.status(403).json({ error: "You are not authorized to delete this activity" });
    }
    await activity.destroy({ transaction });
    await transaction.commit();
    res.status(200).json({ message: "Activity deleted successfully." });
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// 變更活動狀態（例如更新部分欄位）
exports.changeActivityStatus = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const id = req.params.id;
    const userId = req.user.id;
    const activity = await Activity.findByPk(id, { transaction });
    if (!activity) {
      await transaction.rollback();
      return res.status(404).json({ error: "Activity not found" });
    }
    if (activity.userId !== userId) {
      await transaction.rollback();
      return res.status(403).json({ error: "You are not authorized to change the status of this activity" });
    }
    // 更新傳入的狀態欄位（例如 isGrouping、TBD 等）
    await activity.update(req.body, { transaction });
    await transaction.commit();
    res.status(200).json({ message: "Activity status changed successfully." });
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
