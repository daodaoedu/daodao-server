const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 500 * 1024 // 500KB限制
  }
});

module.exports = upload;
