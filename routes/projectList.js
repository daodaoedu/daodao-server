const express = require('express');
const router = express.Router();
const { Project: SequelizeProject, User: SequelizeUser } = require('../models');

/**
 * 輔助函式：將專案資料格式化為前端期望的物件格式
 * @param {Object} project - 專案資料實例
 * @param {number} index - 序號（從 0 開始）
 */
const formatProjectResponse = (project, index) => {
  const ownerNickname = project.User ? project.User.nickname : 'N/A';
  const startDate = project.start_date ? new Date(project.start_date).toLocaleDateString() : null;
  const endDate = project.end_date ? new Date(project.end_date).toLocaleDateString() : null;
  return {
    index: index + 1,
    title: project.title,
    description: project.description || '',
    status: project.status,
    startDate,
    endDate,
    owner: ownerNickname
  };
};

// 新增一個顯示 version = 2 的 project 資料列表的路由
router.get('/', async (req, res) => {
  try {
    const projects = await SequelizeProject.findAll({
      where: { version: 2 }, // 僅查詢 version 為 2 的專案
      include: [
        {
          model: SequelizeUser,
          attributes: ['nickname', 'external_id']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    const formattedProjects = projects.map((project, index) =>
      formatProjectResponse(project, index)
    );

    return res.status(200).json({
      data: formattedProjects,
      message: "Projects fetched successfully"
    });
  } catch (error) {
    console.error("Error fetching project list:", error);
    return res.status(500).json({
      error: true,
      message: "An error occurred while fetching project list.",
      details: error.message
    });
  }
});

module.exports = router;
