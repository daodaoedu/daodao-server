const express = require("express");
const router = express.Router();
const { isAuthenticated, requireCompleteProfile } = require("../middlewares/isAuthenticated");
const { getIdea, createIdea, updateIdea, deleteIdea } = require("../controllers/idea");

// 查詢 idea 清單或單筆（若有 :id 則回傳單筆資料）
router.get("", getIdea);
router.get("/:id", getIdea);

// 新增 idea（需要驗證與完整個人資料）
router.post("", isAuthenticated, requireCompleteProfile, createIdea);

// 更新 idea（需要驗證與完整個人資料）
router.put("/:id", isAuthenticated, requireCompleteProfile, updateIdea);

// 刪除 idea（需要驗證與完整個人資料）
router.delete("/:id", isAuthenticated, requireCompleteProfile, deleteIdea);

module.exports = router;