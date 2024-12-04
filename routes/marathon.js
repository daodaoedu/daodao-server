const express = require("express");
const marathonController = require("../controller/marathon");
const {isAuthenticated,requireCompleteProfile} = require("../middlewares/isAuthenticated");

const router = express.Router();

router.post("/", marathonController.createMarathon);
router.get("/", marathonController.handleMarathonRequest);
router.get("/:id", marathonController.getMarathonById);
router.put("/:id",isAuthenticated,requireCompleteProfile, marathonController.updateMarathon);
router.delete("/:id",isAuthenticated,requireCompleteProfile, marathonController.deleteMarathon);

module.exports = router;
