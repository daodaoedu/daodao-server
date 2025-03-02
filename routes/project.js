const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project');
const milestoneController = require('../controllers/milestone');
const taskController = require('../controllers/task');
const noteController = require('../controllers/note');
const outcomeController = require('../controllers/outcome');
const reviewController = require('../controllers/review');
const { isAuthenticated, requireCompleteProfile } = require("../middlewares/isAuthenticated");

// 獲取學習計畫列表
router.get('/public', projectController.getPublicProjects);
router.get('/admin', projectController.getProjects);

// 獲取我的學習計畫
router.get('/me', isAuthenticated, projectController.getMyProjects);

router.get('/outcomes/me', isAuthenticated, outcomeController.getMyOutcomes);
router.get('/notes/me', isAuthenticated, noteController.getMyNotes);

// 獲取單個學習計畫詳情
router.get('/:projectId', projectController.getProject);

// 創建學習計畫
router.post('/', isAuthenticated, projectController.createProject);

// 更新學習計畫
router.put('/:projectId', isAuthenticated, projectController.updateProject);

// 刪除學習計畫
router.delete('/:projectId', isAuthenticated, projectController.deleteProject);


// 里程碑相關路由
router.post('/:projectId/milestones', isAuthenticated, milestoneController.createMilestone);
router.get('/:projectId/milestones', milestoneController.getMilestones);
router.put('/:projectId/milestones/:milestoneId', isAuthenticated, milestoneController.updateMilestone);
router.delete('/:projectId/milestones/:milestoneId', isAuthenticated, milestoneController.deleteMilestone);

// 任務相關路由
router.post('/:projectId/milestones/:milestoneId/tasks', isAuthenticated, taskController.createTask);
router.get('/:projectId/milestones/:milestoneId/tasks', taskController.getTasks);
router.get('/:projectId/milestones/:milestoneId/tasks/:taskId', taskController.getTask);
router.put('/:projectId/milestones/:milestoneId/tasks/:taskId', isAuthenticated, taskController.updateTask);
router.delete('/:projectId/milestones/:milestoneId/tasks/:taskId', isAuthenticated, taskController.deleteTask);

router.post('/:projectId/notes', isAuthenticated, noteController.createNote);

router.get('/:projectId/notes/', noteController.getNotes);

router.get('/:projectId/notes/:noteId', noteController.getNoteDetail);

router.put('/:projectId/notes/:noteId', isAuthenticated, noteController.updateNote);

router.delete('/:projectId/notes/:noteId', isAuthenticated, noteController.deleteNote);

router.post('/:projectId/outcomes', isAuthenticated, outcomeController.createOutcome);

router.get('/:projectId/outcomes', outcomeController.getOutcomes);

router.get('/:projectId/outcomes/:outcomeId', outcomeController.getOutcomeDetail);

router.put('/:projectId/outcomes/:outcomeId', isAuthenticated, outcomeController.updateOutcome);

router.delete('/:projectId/outcomes/:outcomeId', isAuthenticated, outcomeController.deleteOutcome);

router.post('/:projectId/reviews', isAuthenticated, reviewController.createReview);

router.get('/:projectId/reviews', reviewController.getReviews);

router.get('/:projectId/reviews/:reviewId', reviewController.getReviewDetail);

router.put('/:projectId/reviews/:reviewId', isAuthenticated, reviewController.updateReview);

router.delete('/:projectId/reviews/:reviewId', isAuthenticated, reviewController.deleteReview);

module.exports = router;
