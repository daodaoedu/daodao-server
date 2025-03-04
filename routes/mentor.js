// routes/mentor.js
const express = require("express");
const router = express.Router();
const mentorController = require("../controllers/mentor");
const { isAuthenticated, requireCompleteProfile } = require("../middlewares/isAuthenticated");

// 1. Mentor 與 Marathon 相關操作
// 指定 mentor 參與 marathon
router.post("/marathons", isAuthenticated, mentorController.assignMentorToMarathon);
// 調整 mentor 與 marathon 的關聯（例如更換 marathon）
router.put("/marathons/:assignmentId", isAuthenticated, mentorController.updateMentorMarathon);
// 刪除 mentor 與 marathon 的關聯
router.delete("/marathons/:assignmentId", isAuthenticated, mentorController.deleteMentorFromMarathon);
// 取得 mentor 參與的 marathon（包含 participant 人數、start_date 與 end_date）
router.get("/marathons", isAuthenticated, mentorController.getMentorMarathons);

// 2. Mentor 與 Participant 相關操作
// 指定 mentor 輔導某個 participant
router.post("/participant", isAuthenticated, mentorController.assignParticipantToMentor);
// 更新 mentor 與 participant 的關聯（如有需要，否則可省略或返回未實作）
router.put("/participant/:participantId", isAuthenticated, mentorController.updateMentorParticipant);
// 刪除 mentor 與 participant 的關聯
router.delete("/participant/:participantId", isAuthenticated, mentorController.removeMentorParticipant);

// 3. 根據 marathon eventId 查詢資料
// 取得 mentor 在指定 marathon (依 eventId) 下所輔導的 participant 列表
router.get("/marathons/:eventId/participants", isAuthenticated, mentorController.getMentorParticipantsByMarathon);
// 取得 mentor 底下所有 participant 在指定 marathon 的 project 中的 review 資料
router.get("/marathons/:eventId/reviews", isAuthenticated, mentorController.getReviewsForMentorParticipants);

module.exports = router;