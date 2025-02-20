// 在這個檔案的最上方引入 Sequelize 的 Project 模型（注意與 Mongoose 的 User 模型區分）
const express = require('express');
const router = express.Router();
const { Project: SequelizeProject, User: SequelizeUser } = require('../models');

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

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Project List (Version 2)</title>
        <style>
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f4f4f4; }
        </style>
      </head>
      <body>
        <h1>Project List (Version 2)</h1>
        <table>
          <tr>
            <th>#</th>
            <th>Title</th>
            <th>Description</th>
            <th>Status</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Owner</th>
          </tr>
          ${projects.map((project, index) => {
            const userNickname = project.User ? project.User.nickname : 'N/A';
            const startDate = project.start_date ? new Date(project.start_date).toLocaleDateString() : '';
            const endDate = project.end_date ? new Date(project.end_date).toLocaleDateString() : '';
            return `
              <tr>
                <td>${index + 1}</td>
                <td>${project.title}</td>
                <td>${project.description || ''}</td>
                <td>${project.status}</td>
                <td>${startDate}</td>
                <td>${endDate}</td>
                <td>${userNickname}</td>
              </tr>
            `;
          }).join('')}
        </table>
      </body>
      </html>
    `;

    res.send(htmlContent);
  } catch (error) {
    console.error('Error fetching project list:', error);
    res.status(500).send('An error occurred while fetching project list.');
  }
});
module.exports = router;
