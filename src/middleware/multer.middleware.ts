/**
 * Multer 檔案上傳中間件
 * 處理檔案上傳的配置和限制
 */

import multer from 'multer';
import { Request } from 'express';

/**
 * 檔案上傳配置
 * 使用記憶體儲存，檔案會暫存在記憶體中
 */
const storage = multer.memoryStorage();

/**
 * 檔案過濾器
 * 只允許特定類型的圖片檔案
 */
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('不支援的檔案類型。僅支援 JPEG、PNG 和 WebP 格式。'));
  }
};

/**
 * Multer 上傳配置
 */
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 500 * 1024, // 500KB 限制
    files: 10 // 最多 10 個檔案
  },
  fileFilter: fileFilter
});

export default upload;