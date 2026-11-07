/**
 * 圖片控制器
 * 處理圖片上傳、獲取和刪除操作
 */

import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

import {
  uploadToR2Api,
  deleteFromR2Api,
  deleteMultipleFromR2Api,
  getFromR2
} from '../services/r2.service';
import { asyncHandler, BadRequestError, ForbiddenError, UnauthorizedError } from '../middleware/error.middleware';
import { prisma } from '../services/database/prisma.service';
import { createSuccessResponse, createErrorResponse } from '../utils/response-helper';
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  MulterRequest,
  AllowedMimeType
} from '../types/image.types';

/**
 * 檔案驗證 Schema
 */
const fileSchema = z.object({
  mimetype: z.string().refine((type): type is AllowedMimeType =>
    ALLOWED_MIME_TYPES.includes(type as AllowedMimeType), {
    message: '不支援的檔案類型。僅支援 JPEG、PNG 和 WebP 格式。',
  }),
  size: z.number().refine((size) => size <= MAX_FILE_SIZE, {
    message: '檔案大小超過 500KB 限制',
  }),
});

/**
 * 多檔案驗證 Schema
 */
const filesSchema = z.array(fileSchema);

/** Resolve ownership from the authenticated account, never multipart fields or optional JWT profile claims. */
const resolveImageOwner = async (req: MulterRequest): Promise<string> => {
  const userId = req.user?.id;
  if (typeof userId !== 'number' || !Number.isSafeInteger(userId) || userId <= 0) {
    throw new UnauthorizedError('無效的使用者身分');
  }
  const user = await prisma.users.findUnique({ where: { id: userId }, select: { external_id: true } });
  const owner = z.string().uuid().safeParse(user?.external_id);
  if (!owner.success) throw new ForbiddenError('無法確認圖片擁有者');
  return owner.data;
};

/**
 * 上傳單一圖片
 * POST /api/v1/images
 * 
 * @param req - MulterRequest 包含上傳的檔案
 * @param res - Express Response 物件
 * @returns Promise<void>
 */
export const uploadSingleImage = asyncHandler(async (req: MulterRequest, res: Response): Promise<void> => {
  const file: Express.Multer.File | undefined = req.file;

  // 檢查是否有檔案上傳
  if (!file) {
    throw new BadRequestError('未上傳檔案');
  }

  // 使用增強的檔案驗證
  const validation = fileSchema.safeParse(file);
  if (!validation.success) {
    const errorMessages = validation.error.issues.map((err: z.ZodIssue) => err.message);
    throw new BadRequestError(errorMessages.join(', '));
  }

  // 生成唯一檔案名稱
  const uniqueFileName: string = uuidv4();

  // 使用 API 版本上傳檔案到 R2
  const ownerId = await resolveImageOwner(req);
  const result = await uploadToR2Api(file, uniqueFileName, ownerId);
  
  res.status(201).json(result);
});

/**
 * 上傳多個圖片
 * POST /api/v1/images/multiple
 * 
 * @param req - MulterRequest 包含上傳的檔案陣列
 * @param res - Express Response 物件
 * @returns Promise<void>
 */
export const uploadMultipleImages = asyncHandler(async (req: MulterRequest, res: Response): Promise<void> => {
  const files = req.files;

  // 處理 multer 的 files 屬性，確保它是一個陣列
  let fileArray: Express.Multer.File[] = [];
  if (Array.isArray(files)) {
    fileArray = files;
  } else if (files && typeof files === 'object') {
    // 如果 files 是物件，取得所有檔案陣列並合併
    fileArray = Object.values(files).flat();
  }

  // 檢查是否有檔案上傳
  if (!files || fileArray.length === 0) {
    throw new BadRequestError('未上傳檔案');
  }

  // 使用增強的檔案驗證
  const validation = filesSchema.safeParse(fileArray);
  if (!validation.success) {
    const errorMessages = validation.error.issues.map((err: z.ZodIssue) => err.message);
    throw new BadRequestError(errorMessages.join(', '));
  }

  const ownerId = await resolveImageOwner(req);

  // 準備上傳檔案資訊
  const filesToUpload: Array<{ file: Express.Multer.File; uniqueFileName: string }> = fileArray.map(file => ({
    file,
    uniqueFileName: uuidv4()
  }));

  // 追蹤已上傳的檔案和結果
  const uploadedFiles: string[] = [];
  const uploadResults: Array<{ url: string; filename: string; size: number; mimetype: string }> = [];

  try {
    // 逐個上傳檔案，使用 API 版本
    for (const { file, uniqueFileName } of filesToUpload) {
      try {
        const uploadResult = await uploadToR2Api(file, uniqueFileName, ownerId);
        uploadedFiles.push(uniqueFileName);
        uploadResults.push({
          url: uploadResult.data.url,
          filename: uploadResult.data.filename,
          size: uploadResult.data.size,
          mimetype: uploadResult.data.mimetype
        });
      } catch (uploadError) {
        console.error(`Error uploading file: ${file.originalname}`, uploadError);
        
        const errorMessage = uploadError instanceof Error ? uploadError.message : `檔案 "${file.originalname}" 上傳失敗`;
        throw new Error(errorMessage);
      }
    }

    // 所有檔案上傳成功的結果
    const result = createSuccessResponse({
      urls: uploadResults,
      totalFiles: uploadResults.length,
      totalSize: uploadResults.reduce((sum, result) => sum + result.size, 0)
    }, {
      message: `成功上傳 ${uploadResults.length} 個圖片`,
      aggregateData: {
        uploadSummary: {
          successCount: uploadResults.length,
          totalSize: uploadResults.reduce((sum, result) => sum + result.size, 0),
          uploadedAt: new Date().toISOString()
        }
      }
    });

    res.status(201).json(result);
  } catch (error) {
    // 清理已上傳的檔案
    if (uploadedFiles.length > 0) {
      try {
        await deleteMultipleFromR2Api(uploadedFiles);
        console.log(`Cleaned up ${uploadedFiles.length} uploaded files due to process error`);
      } catch (cleanupError) {
        console.error('Error cleaning up uploaded files:', cleanupError);
      }
    }
    throw error;
  }
});

/**
 * 獲取圖片
 * GET /api/v1/images/:filename
 * 
 * @param req - MulterRequest 包含檔案名稱參數
 * @param res - Express Response 物件
 * @returns Promise<void>
 */
export const getImage = asyncHandler(async (req: MulterRequest, res: Response): Promise<void> => {
  const filename: string | undefined = req.params.filename;

  // 驗證檔案名稱參數
  if (!filename || typeof filename !== 'string' || filename.trim().length === 0) {
    throw new BadRequestError('缺少檔案名稱');
  }

  // 驗證檔案名稱格式 (基本安全檢查)
  const sanitizedFilename = filename.trim();
  if (!/^[a-zA-Z0-9._-]+$/.test(sanitizedFilename)) {
    throw new BadRequestError('檔案名稱格式無效');
  }

  // 檢查檔案名稱長度
  if (sanitizedFilename.length > 255) {
    throw new BadRequestError('檔案名稱過長');
  }

  // 從 R2 獲取檔案流
  const fileStream = await getFromR2(sanitizedFilename);

  // 設置適當的響應頭
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year cache

  // 將檔案流傳送給客戶端
  fileStream.pipe(res);

  // 處理流錯誤
  fileStream.on('error', (streamError) => {
    console.error(`Error streaming file ${sanitizedFilename}:`, streamError);
    if (!res.headersSent) {
      const errorResponse = createErrorResponse(
        'FILE_READ_ERROR',
        '檔案讀取失敗'
      );
      res.status(500).json(errorResponse);
    }
  });
});

/**
 * 刪除圖片
 * DELETE /api/v1/images/:filename
 * 
 * @param req - MulterRequest 包含檔案名稱參數
 * @param res - Express Response 物件
 * @returns Promise<void>
 */
export const deleteImage = asyncHandler(async (req: MulterRequest, res: Response): Promise<void> => {
  const filename: string | undefined = req.params.filename;

  // 驗證檔案名稱參數
  if (!filename || typeof filename !== 'string' || filename.trim().length === 0) {
    throw new BadRequestError('缺少檔案名稱');
  }

  // 驗證檔案名稱格式 (基本安全檢查)
  const sanitizedFilename = filename.trim();
  if (!/^[a-zA-Z0-9._-]+$/.test(sanitizedFilename)) {
    throw new BadRequestError('檔案名稱格式無效');
  }

  // 檢查檔案名稱長度
  if (sanitizedFilename.length > 255) {
    throw new BadRequestError('檔案名稱過長');
  }

  // 使用 API 版本刪除檔案
  const ownerId = await resolveImageOwner(req);
  const result = await deleteFromR2Api(sanitizedFilename, ownerId);
  res.json(result);
});

/**
 * 導出控制器
 */
export const imageController = {
  uploadSingleImage,
  uploadMultipleImages,
  getImage,
  deleteImage,
};
