const express = require('express');
const router = express.Router();
const sendEmail = require('../controllers/sendEmail');
const sendVerifiedEmail = require("../controllers/sendVerifiedEmail");
const {isAuthenticated,requireCompleteProfile} = require('../middlewares/isAuthenticated');
const verifyEmail = require('../controllers/verifyEmail');

router.post('',isAuthenticated,requireCompleteProfile, sendEmail);
router.post('/project',isAuthenticated, sendVerifiedEmail);
router.get('/verify', verifyEmail);


module.exports = router;
