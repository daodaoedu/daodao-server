const express = require('express');
const router = express.Router();
// 假設 models/index.js 已經匯出 User、Circle、Project 與 Contact
const { User, Circle, Project, Contact } = require('../models');

router.get('/', async (req, res) => {
  try {
    // 取得總數（依模型名稱）
    const userCount = await User.count();
    const circleCount = await Circle.count();
    const projectCount = await Project.count();

    // 取得最近 50 筆使用者資料
    const recentUsers = await User.findAll({
      // 根據控制器中的使用習慣，使用 external_id 與 nickname
      attributes: ['external_id', 'nickname', 'created_at', 'updated_at'],
      include: [{
        model: Contact,
        attributes: ['email']
      }],
      order: [['created_at', 'DESC']],
      limit: 50,
    });

    // 取得最近 50 筆 Circle（活動）資料
    const recentCircles = await Circle.findAll({
      order: [['created_date', 'DESC']], // 若模型使用 created_date
      limit: 50,
      include: [{
        model: User,
        attributes: ['external_id', 'nickname'],
        include: [{
          model: Contact,
          attributes: ['email']
        }]
      }]
    });

    // 取得最近 50 筆 Project（學習計畫）資料
    const recentProjects = await Project.findAll({
      where: {version: 2},
      order: [['updated_at', 'DESC']],
      limit: 50,
      include: [{
        model: User,
        attributes: ['external_id', 'nickname'],
        include: [{
          model: Contact,
          attributes: ['email']
        }]
      }]
    });

    // 組裝 HTML 回應內容
    let htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${process.env.NODE_ENV} Environment</title>
        <style>
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f4f4f4;
          }
        </style>
      </head>
      <body>
        <h1>Current Environment: ${process.env.NODE_ENV}</h1>
        <p>PORT: ${process.env.PORT}</p>
        <p>FRONTEND_URL: ${process.env.FRONTEND_URL}</p>
        <p>DATABASE URL: ${process.env.DATABASE_URL || 'N/A'}</p>
  
        <h2>Total Counts:</h2>
        <p>Users: ${userCount}</p>
        <p>Circles: ${circleCount}</p>
        <p>Projects: ${projectCount}</p>
  
        <h2>Recent Users (50):</h2>
        <table>
          <tr>
            <th>#</th>
            <th>User Email</th>
            <th>User Name</th>
            <th>Detail URL</th>
            <th>Created At</th>
            <th>Updated At</th>
          </tr>
    `;

    recentUsers.forEach((user, index) => {
      const email = user.Contact ? user.Contact.email : 'N/A';
      const detailUrl = `${process.env.FRONTEND_URL}/partner/detail?id=${user.external_id}`;
      htmlContent += `
          <tr>
            <td>${index + 1}</td>
            <td>${email}</td>
            <td>${user.nickname}</td>
            <td><a href="${detailUrl}" target="_blank">${detailUrl}</a></td>
            <td>${new Date(user.created_at).toLocaleString()}</td>
            <td>${new Date(user.updated_at).toLocaleString()}</td>
          </tr>
      `;
    });

    htmlContent += `
        </table>
  
        <h2>Recent Circles (50):</h2>
        <table>
          <tr>
            <th>#</th>
            <th>Title</th>
            <th>User Email</th>
            <th>User Name</th>
            <th>Detail URL</th>
            <th>Created At</th>
          </tr>
    `;

    recentCircles.forEach((circle, index) => {
      const user = circle.User;
      const email = user && user.Contact ? user.Contact.email : 'N/A';
      const userName = user ? user.nickname : 'N/A';
      // 假設 Circle 模型中有 title 欄位，且外部 id 為 external_id（若無則可使用 circle.id）
      const detailUrl = `${process.env.FRONTEND_URL}/group/detail?id=${circle.external_id || circle.id}`;
      htmlContent += `
          <tr>
            <td>${index + 1}</td>
            <td>${circle.title || 'N/A'}</td>
            <td>${email}</td>
            <td>${userName}</td>
            <td><a href="${detailUrl}" target="_blank">${detailUrl}</a></td>
            <td>${new Date(circle.created_date).toLocaleString()}</td>
          </tr>
      `;
    });

    htmlContent += `
        </table>
  
        <h2>Recent Projects (50):</h2>
        <table>
          <tr>
            <th>#</th>
            <th>Project ID</th>
            <th>Title</th>
            <th>User Email</th>
            <th>User Name</th>
            <th>Detail URL</th>
            <th>Created At</th>
            <th>Updated At</th>
          </tr>
    `;

    recentProjects.forEach((project, index) => {
      const user = project.User;
      const email = user && user.Contact ? user.Contact.email : 'N/A';
      const userName = user ? user.nickname : 'N/A';
      const detailUrl = `${process.env.FRONTEND_URL}/admin/projects/detail?id=${project.external_id || project.id}`;
      htmlContent += `
          <tr>
            <td>${index + 1}</td>
            <td>${project.external_id || project.id}</td>
            <td>${project.title || 'N/A'}</td>
            <td>${email}</td>
            <td>${userName}</td>
            <td><a href="${detailUrl}" target="_blank">${detailUrl}</a></td>
            <td>${new Date(project.created_at).toLocaleString()}</td>
            <td>${new Date(project.updated_at).toLocaleString()}</td>
          </tr>
      `;
    });

    htmlContent += `
        </table>
      </body>
      </html>
    `;

    res.send(htmlContent);
  } catch (error) {
    console.error('Error fetching recent data:', error);
    res.status(500).send('An error occurred while fetching recent data.');
  }
});

module.exports = router;
