/**
 * Multer 檔案上傳中間件
 * 處理檔案上傳的配置和限制
 */

import multer from 'multer';
import { Request, RequestHandler } from 'express';
import { BadRequestError } from './error.middleware';
import { validateUploadContent } from '../utils/upload-content.utils';

/**
 * 檔案上傳配置
 * 使用記憶體儲存，檔案會暫存在記憶體中
 */
const storage = multer.memoryStorage();

/**
 * 檔案過濾器
 * 只允許特定類型的圖片檔案
 */
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback): void => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestError('不支援的檔案類型。僅支援 JPEG、PNG 和 WebP 格式。'));
  }
};

/**
 * Multer 上傳配置
 */
const multipart = multer({
  storage: storage,
  limits: {
    fileSize: 500 * 1024, // 500KB 限制
    files: 10 // 最多 10 個檔案
  },
  fileFilter: fileFilter
});

// memoryStorage only exposes complete buffers after Multer finishes parsing.
// Validate the entire request before any controller can perform a storage write.
const withContentValidation = (handler: RequestHandler): RequestHandler => (req, res, next): void => {
  handler(req, res, (error?: unknown) => {
    if (error) return next(error);
    const files = req.file ? [req.file] : Array.isArray(req.files)
      ? req.files : Object.values(req.files ?? {}).flat();
    void validateUploadContent(files).then(() => next(), next);
  });
};

const upload = {
  single: (...args: Parameters<typeof multipart.single>): RequestHandler => withContentValidation(multipart.single(...args)),
  array: (...args: Parameters<typeof multipart.array>): RequestHandler => withContentValidation(multipart.array(...args)),
  fields: (...args: Parameters<typeof multipart.fields>): RequestHandler => withContentValidation(multipart.fields(...args)),
  any: (): RequestHandler => withContentValidation(multipart.any()),
  none: (): RequestHandler => multipart.none(),
};

export default upload;