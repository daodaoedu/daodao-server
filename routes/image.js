const express = require('express');
const multer = require('../middlewares/multer');
const {isAuthenticated,requireCompleteProfile} = require("../middlewares/isAuthenticated");
const { uploadImage, getImage, deleteImage } = require('../controller/image');
const router = express.Router();
const rateLimit = require("express-rate-limit");


const imgLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: "Too many image upload attempts, please try again later."
  });
  
router.get('/:filename', getImage);
router.post('/',isAuthenticated,requireCompleteProfile,imgLimiter, multer.single('file'), uploadImage);
router.delete('/:filename',isAuthenticated,requireCompleteProfile,imgLimiter, deleteImage);


module.exports = router;