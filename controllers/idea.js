const { Idea, IdeaResource } = require('../models'); // IdeaResource 為 models/learning_resource 的實例
const sequelize = require('../config/db');
const { Op } = require('sequelize');

// 格式化 idea 資源
const formatIdeaResource = (resource) => {
  const plainResource = typeof resource.get === 'function' ? resource.get({ plain: true }) : resource;
  return {
    id: plainResource.id,
    ideaId: plainResource.idea_id,
    name: plainResource.name,
    url: plainResource.url,
    createdAt: plainResource.created_at,
    updatedAt: plainResource.updated_at
  };
};

// 格式化 idea，並包含關聯的 idea 資源
const formatIdeaResponse = (idea) => {
  const plainIdea = typeof idea.get === 'function' ? idea.get({ plain: true }) : idea;
  return {
    id: plainIdea.external_id + '_' + plainIdea.id, // 新增 external_id 回傳給前端
    title: plainIdea.title,
    content: plainIdea.content,
    imageUrls: plainIdea.image_urls,
    videoUrls: plainIdea.video_urls,
    visibility: plainIdea.visibility,
    createdAt: plainIdea.created_at,
    updatedAt: plainIdea.updated_at,
    ideaResources: plainIdea.IdeaResources
      ? plainIdea.IdeaResources.map(resource => formatIdeaResource(resource))
      : []
  };
};

// 將前端傳入的 camelCase 資料轉換成指定欄位（snake_case）
const transformIdeaRequest = (data,userId) => {
  console.log(data);
  console.log(data.ideaResources);

  return {
    title: data.title,
    content: data.content,
    visibility: data.visibility,
    image_urls: data.imageUrls,
    video_urls: data.videoUrls,
    user_id: userId,
    IdeaResources: data.ideaResources // Ensure this is correctly transformed
      ? data.ideaResources.map(resource => ({
          name: resource.name,
          url: resource.url
        }))
      : undefined
  };
};

// 取得 idea 清單或單筆資料（若有 :id 則根據 external_id 查詢）
exports.getIdea = async (req, res) => {
  try {
    const { page = 1, pageSize = 30, search } = req.query;
    // 這裡的 id 其實是 external_id
    const externalId = req.params.id;
    const pageInt = parseInt(page, 10);
    const pageSizeInt = parseInt(pageSize, 10);

    if (externalId) {
      const idea = await Idea.findOne({
        where: { external_id: externalId },
        include: [{ model: IdeaResource ,as: 'IdeaResources'}]
      });
      if (!idea) return res.status(404).json({ message: 'Idea not found' });
      return res.json({ data: formatIdeaResponse(idea) });
    } else {
      let filter = {};
      if (search) {
        filter = {
          [Op.or]: [
            { title: { [Op.iLike]: `%${search}%` } },
            { content: { [Op.iLike]: `%${search}%` } },
            { '$IdeaResources.name$': { [Op.iLike]: `%${search}%` } }
          ]
        };
      }
      const { count, rows } = await Idea.findAndCountAll({
        where: filter,
        order: [['created_at', 'DESC']],
        offset: (pageInt - 1) * pageSizeInt,
        limit: pageSizeInt,
        include: [{ model: IdeaResource, as: 'IdeaResources' }],
        subQuery: false  // 建議加上此選項以避免子查詢 alias 問題
      });
      const totalPages = Math.ceil(count / pageSizeInt);
      return res.json({
        data: rows.map(idea => formatIdeaResponse(idea)),
        page: pageInt,
        pageSize: pageSizeInt,
        totalCount: count,
        totalPages
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

// 新增 idea（若 req.body 包含 ideaResources 則一併建立關聯資源）
// external_id 由資料庫自動產生
exports.createIdea = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const userId = req.user.id; // 假設 `req.user` 是登入用戶資訊
    const payload = transformIdeaRequest(req.body, userId);
    // 先將前端 camelCase 轉換成資料庫對應欄位
    const { title, IdeaResources } = payload;

    // Log the transformed payload
    console.log('Transformed Payload:', JSON.stringify(payload, null, 2));
    console.log('Idea Resources:', IdeaResources); // Log the idea_resources for debugging

    // const existingIdea = await Idea.findOne({ where: { title } });
    // if (existingIdea) {
    //   await transaction.rollback();
    //   return res.status(400).json({ message: "Idea already exists" });
    // }

    const newIdea = await Idea.create(payload, {
      transaction,
      include: IdeaResources ? [{ model: IdeaResource, as: 'IdeaResources' }] : [] // Ensure the association is correctly referenced
    });

    await transaction.commit();
    return res.status(201).json({ data: formatIdeaResponse(newIdea), message: "Idea created successfully" });
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    console.error('Error creating idea:', error); // Log the error for debugging
    return res.status(500).json({ error: error.message });
  }
};

// 更新 idea：依 external_id 更新
exports.updateIdea = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const externalId = req.params.id; // 此 id 為 external_id
    // 將前端傳入資料轉型
    const userId = req.user.id; // 當前用戶 ID
    const payload = transformIdeaRequest(req.body, userId);
    const [updatedRows] = await Idea.update(payload, {
      where: { external_id: externalId, user_id: userId },
      returning: true,
      transaction
    });
    if (updatedRows === 0) {
      await transaction.rollback();
      return res.status(404).json({ error: "Idea not found" });
    }
    await transaction.commit();
    // 重新查詢取得完整關聯資料
    const idea = await Idea.findOne({
      where: { external_id: externalId, user_id: userId },
      include: [{ model: IdeaResource , as: 'IdeaResources'}]
    });
    return res.json({ data: formatIdeaResponse(idea), message: "Idea updated successfully." });
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

// 刪除 idea：依 external_id 刪除
exports.deleteIdea = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const externalId = req.params.id;
    const userId = req.user.id; // 當前用戶 ID

    const idea = await Idea.findOne({
      where: { external_id: externalId, user_id: userId },
      transaction
    });
    if (!idea) {
      await transaction.rollback();
      return res.status(404).json({ error: "Idea not found" });
    }
    await idea.destroy({ transaction });
    await transaction.commit();
    return res.status(200).json({ message: "Idea deleted successfully." });
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};
