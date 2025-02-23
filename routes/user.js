// routes/user.js
const express = require("express");
const router = express.Router();
const userController = require("../controllers/user");
const { isAuthenticated, requireCompleteProfile } = require("../middlewares/isAuthenticated");

// 路由定义
router.get("/", userController.getAllUsers);
router.get("/me", isAuthenticated,userController.getMe);
router.get("/:id", userController.getOneUser);
router.post("/",isAuthenticated, userController.createUser);
router.delete("/me",isAuthenticated, userController.deleteMe);
router.put("/:id",isAuthenticated,requireCompleteProfile, userController.updateUser);
router.delete('/:id',isAuthenticated, userController.deleteUser);

module.exports = router;
