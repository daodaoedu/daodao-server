const { Circle, User, Location, Country, City, Contact, BasicInfo, Position} = require('../models');
const sequelize = require('../config/db');
const { Op } = require('sequelize');

function splitAndTrim(input, separator = ',') {
  if (typeof input !== 'string') {
    return [];
  }
  return input
    .split(separator)
    .map(item => item.trim())
    .filter(item => item !== '');
}
// 輔助函式：格式化 user 資料
const formatUserData = (user) => {
  if (!user) return null;
  const userJson = typeof user.toJSON === 'function' ? user.toJSON() : user;
  return {
    externalId: userJson.external_id,
    name: userJson.nickname,
    // 利用 alias 轉換，從關聯的 Contact 拿 photo_url 並轉成 photoURL
    photoURL: userJson.Contact ? userJson.Contact.photo_url : null,
    email: userJson.Contact ? userJson.Contact.email : null,
    roleList: userJson.Positions?.map(p => p.name) || [],
    educationStage: userJson.education_stage,
    location: userJson.Location?.City?.name || '',
  };
};

// 輔助函式：格式化 Circle 資料，將內部 User 資料另外整理
const formatCircleResponse = (circle) => {
  const plainCircle = typeof circle.get === 'function' ? circle.get({ plain: true }) : circle;
  return {
    id: plainCircle.id,
    _id: plainCircle.external_id,
    title: plainCircle.title,
    photoURL: plainCircle.photo_url,
    photoAlt: plainCircle.photo_alt,
    category: plainCircle.category,
    activityCategory: plainCircle.group_type,
    area: plainCircle?.area || [],
    time: plainCircle.is_grouping,
    participator: plainCircle?.participator || "",
    partnerStyle: plainCircle.partner_style,
    partnerEducationStep: plainCircle.partner_education_step,
    motivation: plainCircle.motivation,
    content: plainCircle.contents,
    description: plainCircle.description,
    outcome: plainCircle?.outcome || "",
    notice: plainCircle.notice,
    tagList: splitAndTrim(plainCircle.tag_list),
    isGrouping: plainCircle.is_grouping,
    createdDate: plainCircle.created_date,
    updatedDate: plainCircle.updated_date,
    deadline: plainCircle.group_deadline,
    isNeedDeadline: plainCircle?.isneedDeadline || false,
    user: formatUserData(plainCircle.User)
  };
};
// 取得活動清單（含分頁與搜尋）
exports.getCircle = async (req, res) => {
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
    if (userId) filter.created_by = userId;
    if (id) filter.external_id = id;
    if (activityCategory) filter.group_type = activityCategory;
    if (area) filter.area = area;
    if (partnerEducationStep) filter.partner_education_step = partnerEducationStep;
    // 注意 isGrouping 可能為布林值，需判斷是否為 undefined
    if (typeof isGrouping !== 'undefined') filter.is_grouping = isGrouping;
    if (category) filter.category = category;

    // 當有搜尋條件時，利用 OR 條件模糊搜尋各個欄位
    if (search) {
      filter[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { category: { [Op.iLike]: `%${search}%` } },
        { area: { [Op.iLike]: `%${search}%` } },
        { partner_style: { [Op.iLike]: `%${search}%` } },
        { partner_education_step: { [Op.iLike]: `%${search}%` } },
        { motivation: { [Op.iLike]: `%${search}%` } },
        { content: { [Op.iLike]: `%${search}%` } },
        { outcome: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { tag_list: { [Op.iLike]: `%${search}%` } },
        { group_type: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // 使用 findAndCountAll 同時取得資料與總筆數
    const { count, rows } = await Circle.findAndCountAll({
      where: filter,
      order: [
        ['is_grouping', 'DESC'],
        ['updated_date', 'DESC']
      ],
      offset: (pageInt - 1) * pageSizeInt,
      limit: pageSizeInt,
      include: [          
        {
            model: User,
            attributes: ['id', 'nickname', 'external_id'],
            include: [
              { model: Contact },
              { model: BasicInfo},
              {
                model: Location,
                include: [
                  { model: City, attributes: ['name'] },
                  { model: Country, attributes: ['name'] }
                ]
              },
              { 
                model: Position,
                through: { attributes: [] }
              }
            ]
        }
      ]
    });

    const totalPages = Math.ceil(count / pageSizeInt);
    res.json({
      data: rows.map(circle => formatCircleResponse(circle)),
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
exports.createCircle = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { title } = req.body;
    // 檢查是否已存在相同 title 的活動
    const existingCircle = await Circle.findOne({ where: { title } });
    if (existingCircle) {
      await transaction.rollback();
      return res.status(400).json({ message: "Circle already exists" });
    }
    // 建立新的活動記錄
    const newCircle = await Circle.create(req.body, { transaction });
    await transaction.commit();
    res.status(201).json({ data: newCircle });
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// 更新活動
exports.updateCircle = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const id = req.params.id;
    const userId = req.user.id;
    const circle = await Circle.findOne({
      where: { external_id: id },
      transaction
    });
    if (!circle) {
      await transaction.rollback();
      return res.status(404).json({ error: "Circle not found" });
    }
    if (circle.created_by !== userId) {
      await transaction.rollback();
      return res.status(403).json({ error: "You are not authorized to update this circle" });
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
        circle[field] = req.body[field];
        updated = true;
      }
    });

    if (updated) {
      circle.updated_date = new Date();
      await circle.save({ transaction });
      await transaction.commit();

      const updatedCircle = await Circle.findOne({
      where: { external_id: id },
      include: [          
        {
            model: User,
            attributes: ['id', 'nickname', 'external_id'],
            include: [
              { model: Contact },
              { model: BasicInfo},
              {
                model: Location,
                include: [
                  { model: City, attributes: ['name'] },
                  { model: Country, attributes: ['name'] }
                ]
              },
              { 
                model: Position,
                through: { attributes: [] }
              }
            ]
        }
      ]
      });
      res.json({ data: formatCircleResponse(updatedCircle), message: "Circle updated successfully." });
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
exports.deleteCircle = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const id = req.params.id;
    const userId = req.user.id;
    const circle = await Circle.findByPk(id, { transaction });
    if (!circle) {
      await transaction.rollback();
      return res.status(404).json({ error: "Circle not found" });
    }
    if (circle.userId !== userId) {
      await transaction.rollback();
      return res.status(403).json({ error: "You are not authorized to delete this circle" });
    }
    await circle.destroy({ transaction });
    await transaction.commit();
    res.status(200).json({ message: "Circle deleted successfully." });
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// 變更活動狀態（例如更新部分欄位）
exports.changeCircleStatus = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const id = req.params.id;
    const userId = req.user.id;
    const circle = await Circle.findByPk(id, { transaction });
    if (!circle) {
      await transaction.rollback();
      return res.status(404).json({ error: "Circle not found" });
    }
    if (circle.userId !== userId) {
      await transaction.rollback();
      return res.status(403).json({ error: "You are not authorized to change the status of this circle" });
    }
    // 更新傳入的狀態欄位（例如 isGrouping、TBD 等）
    await circle.update(req.body, { transaction });
    await transaction.commit();
    res.status(200).json({ message: "Circle status changed successfully." });
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
