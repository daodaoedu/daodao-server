const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project');
const {isAuthenticated,requireCompleteProfile} = require("../middlewares/isAuthenticated");

// 獲取學習計畫列表
router.get('/', projectController.getProjects);

// 獲取單個學習計畫詳情
router.get('/:externalId', projectController.getProject);

// 創建學習計畫
router.post('/',isAuthenticated, projectController.createProject);

// 更新學習計畫
router.put('/:externalId',isAuthenticated, projectController.updateProject);

// 刪除學習計畫
router.delete('/:externalId',isAuthenticated,projectController.deleteProject);

module.exports = router;