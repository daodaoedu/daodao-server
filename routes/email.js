const express = require('express');
const router = express.Router();
const sendEmail = require('../controller/sendEmail');
const sendVerifiedEmail = require("../controller/sendVerifiedEmail");
const {isAuthenticated,requireCompleteProfile} = require('../middlewares/isAuthenticated');
const verifyEmail = require('../controller/verifyEmail');

router.post('',isAuthenticated,requireCompleteProfile, sendEmail);
router.post('/project',isAuthenticated, sendVerifiedEmail);
router.get('/verify', verifyEmail);


module.exports = router;
