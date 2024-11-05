const express = require('express');
const router = express.Router();
const sendEmail = require('../controller/sendEmail');
const {isAuthenticated,requireCompleteProfile} = require('../middlewares/isAuthenticated');

router.post('',isAuthenticated,requireCompleteProfile, sendEmail);

module.exports = router;
