const express = require("express");
const router = express.Router();
const { isAuthenticated, requireCompleteProfile } = require("../middlewares/isAuthenticated");
const { createCircle, updateCircle, getCircle, deleteCircle, changeCircleStatus } = require("../controller/circle");

router.get("", getCircle);
router.get("/:id", getCircle);
router.get("/user/:userId", getCircle);
router.post("", isAuthenticated, requireCompleteProfile, createCircle);
router.put("/:id", isAuthenticated, requireCompleteProfile, updateCircle);
router.delete("/:id", isAuthenticated, requireCompleteProfile, deleteCircle);
router.put("/:id/status", isAuthenticated, requireCompleteProfile, changeCircleStatus);

module.exports = router;
