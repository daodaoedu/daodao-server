// routes/dashboard.js
const express = require('express');
const router = express.Router();
const { User, Circle, Project, Contact } = require('../models');

router.get('/dashboard', async (req, res) => {
  try {
    // 取得各模型的總數
    const userCount = await User.count();
    const circleCount = await Circle.count();
    const projectCount = await Project.count();

    // 取得最近 50 筆使用者資料
    const recentUsers = await User.findAll({
      attributes: ['external_id', 'nickname', 'created_at', 'updated_at'],
      include: [{
        model: Contact,
        attributes: ['email']
      }],
      order: [['created_at', 'DESC']],
      limit: 50,
    });

    // 取得最近 50 筆 Circle 資料
    const recentCircles = await Circle.findAll({
      order: [['created_date', 'DESC']],
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

    // 取得最近 50 筆 Project 資料（version:2）
    const recentProjects = await Project.findAll({
      where: { version: 2 },
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

    res.json({
      environment: process.env.NODE_ENV,
      port: process.env.PORT,
      frontendUrl: process.env.FRONTEND_URL || '',
      userCount,
      circleCount,
      projectCount,
      recentUsers,
      recentCircles,
      recentProjects
    });
  } catch (error) {
    console.error('Error fetching recent data:', error);
    res.status(500).json({ error: 'An error occurred while fetching recent data.' });
  }
});

module.exports = router;
