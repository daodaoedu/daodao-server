const express = require("express");
const router = express.Router();
const {isAuthenticated,requireCompleteProfile} = require("../middlewares/isAuthenticated");
const { createActivity,updateActivity ,getActivity,deleteActivity,changeActivityStatus} = require("../controller/activity");

router.get("", getActivity);
router.get("/:id", getActivity);
router.get("/user/:userId", getActivity);
router.post("",isAuthenticated,requireCompleteProfile, createActivity);
router.put("/:id",isAuthenticated,requireCompleteProfile, updateActivity);
router.delete("/:id",isAuthenticated,requireCompleteProfile, deleteActivity);
router.put("/:id/status",isAuthenticated,requireCompleteProfile,changeActivityStatus)

module.exports = router;