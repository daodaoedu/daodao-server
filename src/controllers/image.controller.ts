/**
 * 圖片控制器
 * 處理圖片上傳、獲取和刪除操作
 */

import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

import { uploadToR2, getFromR2, deleteFromR2, deleteMultipleFromR2 } from '../services/r2.service';
import { asyncWrapper } from '../utils/error-handler';
import { 
  ALLOWED_MIME_TYPES, 
  MAX_FILE_SIZE,
  ImageUploadResponse,
  MultipleImageUploadResponse,
  ImageDeleteResponse,
  ImageGetErrorResponse,
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

/**
 * 上傳單一圖片
 * POST /api/v1/images
 * 
 * @param req - MulterRequest 包含上傳的檔案
 * @param res - Express Response 物件
 * @returns Promise<void>
 */
export const uploadSingleImage = asyncWrapper(async (req: MulterRequest, res: Response): Promise<void> => {
  try {
    const file: Express.Multer.File | undefined = req.file;
    
    // 檢查是否有檔案上傳
    if (!file) {
      const response: ImageUploadResponse = {
        success: false,
        error: '未上傳檔案'
      };
      res.status(400).json(response);
      return;
    }

    // 使用增強的檔案驗證
    const validation = fileSchema.safeParse(file);
    if (!validation.success) {
      const errorMessages = validation.error.errors.map(err => err.message);
      const response: ImageUploadResponse = {
        success: false,
        error: errorMessages.join(', ')
      };
      res.status(400).json(response);
      return;
    }

    // 生成唯一檔案名稱
    const uniqueFileName: string = uuidv4();
    
    // 上傳檔案到 R2 儲存服務
    try {
      await uploadToR2(file, uniqueFileName);
    } catch (uploadError) {
      console.error('R2 upload failed:', uploadError);
      const response: ImageUploadResponse = {
        success: false,
        error: '檔案上傳失敗，請稍後再試'
      };
      res.status(500).json(response);
      return;
    }

    // 構建成功回應
    const publicUrl = process.env.R2_PUBLIC_URL;
    if (!publicUrl) {
      console.error('R2_PUBLIC_URL environment variable is not set');
      const response: ImageUploadResponse = {
        success: false,
        error: '服務配置錯誤'
      };
      res.status(500).json(response);
      return;
    }

    const response: ImageUploadResponse = {
      success: true,
      data: {
        url: `${publicUrl}/${uniqueFileName}`,
        filename: uniqueFileName,
        size: file.size,
        mimetype: file.mimetype
      },
      message: '檔案上傳成功'
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Unexpected error in uploadSingleImage:', error);
    const response: ImageUploadResponse = {
      success: false,
      error: '伺服器內部錯誤'
    };
    res.status(500).json(response);
  }
});

/**
 * 上傳多個圖片
 * POST /api/v1/images/multiple
 * 
 * @param req - MulterRequest 包含上傳的檔案陣列
 * @param res - Express Response 物件
 * @returns Promise<void>
 */
export const uploadMultipleImages = asyncWrapper(async (req: MulterRequest, res: Response): Promise<void> => {
  try {
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
      const response: MultipleImageUploadResponse = {
        success: false,
        error: '未上傳檔案'
      };
      res.status(400).json(response);
      return;
    }

    // 使用增強的檔案驗證
    const validation = filesSchema.safeParse(fileArray);
    if (!validation.success) {
      const errorMessages = validation.error.errors.map(err => err.message);
      const response: MultipleImageUploadResponse = {
        success: false,
        error: errorMessages.join(', ')
      };
      res.status(400).json(response);
      return;
    }

    // 檢查環境配置
    const publicUrl = process.env.R2_PUBLIC_URL;
    if (!publicUrl) {
      console.error('R2_PUBLIC_URL environment variable is not set');
      const response: MultipleImageUploadResponse = {
        success: false,
        error: '服務配置錯誤'
      };
      res.status(500).json(response);
      return;
    }

    // 準備上傳檔案資訊
    const filesToUpload: Array<{ file: Express.Multer.File; uniqueFileName: string }> = fileArray.map(file => ({
      file,
      uniqueFileName: uuidv4()
    }));

    // 追蹤已上傳的檔案和結果
    const uploadedFiles: string[] = [];
    const uploadResults: Array<{ url: string; filename: string; size: number; mimetype: string }> = [];
    let hasError = false;
    let errorMessage = '';

    try {
      // 逐個上傳檔案
      for (const { file, uniqueFileName } of filesToUpload) {
        try {
          await uploadToR2(file, uniqueFileName);
          uploadedFiles.push(uniqueFileName);
          uploadResults.push({
            url: `${publicUrl}/${uniqueFileName}`,
            filename: uniqueFileName,
            size: file.size,
            mimetype: file.mimetype
          });
        } catch (uploadError) {
          console.error(`Error uploading file: ${file.originalname}`, uploadError);
          errorMessage = `檔案 "${file.originalname}" 上傳失敗`;
          hasError = true;
          break;
        }
      }

      // 如果有錯誤，清理已上傳的檔案
      if (hasError) {
        if (uploadedFiles.length > 0) {
          try {
            await deleteMultipleFromR2(uploadedFiles);
            console.log(`Cleaned up ${uploadedFiles.length} uploaded files due to error`);
          } catch (cleanupError) {
            console.error('Error cleaning up uploaded files:', cleanupError);
          }
        }
        const response: MultipleImageUploadResponse = {
          success: false,
          error: errorMessage || '上傳失敗，已清理所有已上傳的檔案'
        };
        res.status(500).json(response);
        return;
      }

      // 所有檔案上傳成功
      const response: MultipleImageUploadResponse = {
        success: true,
        data: {
          urls: uploadResults,
          totalFiles: uploadResults.length,
          totalSize: uploadResults.reduce((sum, result) => sum + result.size, 0)
        },
        message: `成功上傳 ${uploadResults.length} 個圖片`
      };
      
      res.status(200).json(response);
    } catch (uploadProcessError) {
      console.error('Error in upload process:', uploadProcessError);
      
      // 清理已上傳的檔案
      if (uploadedFiles.length > 0) {
        try {
          await deleteMultipleFromR2(uploadedFiles);
          console.log(`Cleaned up ${uploadedFiles.length} uploaded files due to process error`);
        } catch (cleanupError) {
          console.error('Error cleaning up uploaded files:', cleanupError);
        }
      }
      
      const response: MultipleImageUploadResponse = {
        success: false,
        error: '上傳過程中發生錯誤，已清理所有已上傳的檔案'
      };
      res.status(500).json(response);
    }
  } catch (error) {
    console.error('Unexpected error in uploadMultipleImages:', error);
    const response: MultipleImageUploadResponse = {
      success: false,
      error: '伺服器內部錯誤'
    };
    res.status(500).json(response);
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
export const getImage = asyncWrapper(async (req: MulterRequest, res: Response): Promise<void> => {
  try {
    const filename: string | undefined = req.params.filename;
    
    // 驗證檔案名稱參數
    if (!filename || typeof filename !== 'string' || filename.trim().length === 0) {
      const response: ImageGetErrorResponse = {
        success: false,
        error: '缺少檔案名稱'
      };
      res.status(400).json(response);
      return;
    }

    // 驗證檔案名稱格式 (基本安全檢查)
    const sanitizedFilename = filename.trim();
    if (!/^[a-zA-Z0-9._-]+$/.test(sanitizedFilename)) {
      const response: ImageGetErrorResponse = {
        success: false,
        error: '檔案名稱格式無效'
      };
      res.status(400).json(response);
      return;
    }

    // 檢查檔案名稱長度
    if (sanitizedFilename.length > 255) {
      const response: ImageGetErrorResponse = {
        success: false,
        error: '檔案名稱過長'
      };
      res.status(400).json(response);
      return;
    }

    try {
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
          const response: ImageGetErrorResponse = {
            success: false,
            error: '檔案讀取失敗'
          };
          res.status(500).json(response);
        }
      });
      
    } catch (getError) {
      console.error(`Error getting file ${sanitizedFilename} from R2:`, getError);
      
      // 檢查是否為檔案不存在錯誤
      const errorMessage = getError instanceof Error ? getError.message : '未知錯誤';
      let statusCode = 500;
      let userMessage = '檔案獲取失敗';
      
      if (errorMessage.includes('NoSuchKey') || errorMessage.includes('Not Found') || errorMessage.includes('404')) {
        statusCode = 404;
        userMessage = '檔案不存在';
      }
      
      const response: ImageGetErrorResponse = {
        success: false,
        error: userMessage
      };
      res.status(statusCode).json(response);
    }
  } catch (error) {
    console.error('Unexpected error in getImage:', error);
    const response: ImageGetErrorResponse = {
      success: false,
      error: '伺服器內部錯誤'
    };
    res.status(500).json(response);
  }
});

/**
 * 刪除圖片
 * DELETE /api/v1/images/:filename
 * 
 * @param req - MulterRequest 包含檔案名稱參數
 * @param res - Express Response 物件
 * @returns Promise<void>
 */
export const deleteImage = asyncWrapper(async (req: MulterRequest, res: Response): Promise<void> => {
  try {
    const filename: string | undefined = req.params.filename;
    
    // 驗證檔案名稱參數
    if (!filename || typeof filename !== 'string' || filename.trim().length === 0) {
      const response: ImageDeleteResponse = {
        success: false,
        error: '缺少檔案名稱'
      };
      res.status(400).json(response);
      return;
    }

    // 驗證檔案名稱格式 (基本安全檢查)
    const sanitizedFilename = filename.trim();
    if (!/^[a-zA-Z0-9._-]+$/.test(sanitizedFilename)) {
      const response: ImageDeleteResponse = {
        success: false,
        error: '檔案名稱格式無效'
      };
      res.status(400).json(response);
      return;
    }

    // 檢查檔案名稱長度
    if (sanitizedFilename.length > 255) {
      const response: ImageDeleteResponse = {
        success: false,
        error: '檔案名稱過長'
      };
      res.status(400).json(response);
      return;
    }

    try {
      // 從 R2 刪除檔案
      await deleteFromR2(sanitizedFilename);
      
      // 構建成功回應
      const response: ImageDeleteResponse = {
        success: true,
        data: {
          filename: sanitizedFilename,
          deletedAt: new Date().toISOString()
        },
        message: '檔案刪除成功'
      };
      
      res.status(200).json(response);
    } catch (deleteError) {
      console.error(`Error deleting file ${sanitizedFilename} from R2:`, deleteError);
      
      // 檢查是否為檔案不存在錯誤
      const errorMessage = deleteError instanceof Error ? deleteError.message : '未知錯誤';
      let statusCode = 500;
      let userMessage = '檔案刪除失敗';
      
      if (errorMessage.includes('NoSuchKey') || errorMessage.includes('Not Found') || errorMessage.includes('404')) {
        statusCode = 404;
        userMessage = '檔案不存在';
      }
      
      const response: ImageDeleteResponse = {
        success: false,
        error: userMessage
      };
      res.status(statusCode).json(response);
    }
  } catch (error) {
    console.error('Unexpected error in deleteImage:', error);
    const response: ImageDeleteResponse = {
      success: false,
      error: '伺服器內部錯誤'
    };
    res.status(500).json(response);
  }
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