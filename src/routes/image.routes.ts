/**
 * 圖片路由
 * 處理圖片上傳、獲取和刪除相關的路由
 */

import { Router } from 'express';
import { imageController } from '../controllers/image.controller';
import { authenticate } from '../middleware/auth';
import { uploadLimiter } from '../middleware/rate-limit.middleware';
import upload from '../middleware/multer.middleware';

const router = Router();

/**
 * GET /images/:filename
 * 獲取圖片
 * 路徑參數：filename - 圖片檔案名稱
 * 公開存取，無需身份驗證
 */
router.get('/:filename', 
  imageController.getImage
);

/**
 * POST /images
 * 上傳單一圖片
 * 請求體：multipart/form-data with 'file' field
 * 需要身份驗證和速率限制
 */
router.post('/', 
  authenticate,
  uploadLimiter,
  upload.single('file'),
  imageController.uploadSingleImage
);

/**
 * POST /images/multiple
 * 上傳多個圖片
 * 請求體：multipart/form-data with 'files' field (最多5個檔案)
 * 需要身份驗證和速率限制
 */
router.post('/multiple', 
  authenticate,
  uploadLimiter,
  upload.array('files', 5),
  imageController.uploadMultipleImages
);

/**
 * DELETE /images/:filename
 * 刪除圖片
 * 路徑參數：filename - 圖片檔案名稱
 * 需要身份驗證和速率限制
 */
router.delete('/:filename',
  authenticate,
  uploadLimiter,
  imageController.deleteImage
);

export default router;