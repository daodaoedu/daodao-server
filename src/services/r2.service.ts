/**
 * Cloudflare R2 儲存服務
 * 處理檔案上傳、下載和刪除操作
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { z } from 'zod';
import { ForbiddenError, NotFoundError } from '../middleware/error.middleware';
import { ApiSuccessResponse } from '../types/api-response.types';
import { createSuccessResponse } from '../utils/response-helper';

/**
 * S3 客戶端配置
 */

const isTestEnvironment = process.env.NODE_ENV === 'test';
const hasR2Credentials = process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY;

if (!hasR2Credentials && !isTestEnvironment) {
  console.warn('⚠️ R2 credentials not configured. File upload features will be disabled.');
}

const s3Client = hasR2Credentials ? new S3Client({
  region: process.env.R2_REGION || 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,
  },
}) : null;

/**
 * 上傳檔案到 R2
 * @param file - Multer 檔案物件
 * @param filename - 檔案名稱
 * @returns 上傳成功的檔案名稱
 */
export const uploadToR2 = async (file: Express.Multer.File, filename: string, ownerId?: string): Promise<string> => {
  if (ownerId !== undefined && !z.string().uuid().safeParse(ownerId).success) {
    throw new ForbiddenError('無法確認圖片擁有者');
  }
  if (!s3Client) {
    if (isTestEnvironment) {
      // Mock successful upload in test environment
      return filename;
    }
    throw new Error('R2 client not initialized');
  }

  try {
    const bucketName = process.env.R2_BUCKET_NAME;
    if (!bucketName) {
      throw new Error('R2_BUCKET_NAME not configured');
    }

    const params = {
      Bucket: bucketName,
      Key: filename,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read' as const,
      ...(ownerId === undefined ? {} : {
        Metadata: { 'daodao-owner-id': ownerId, 'daodao-owner-version': '1' },
        // Ownership must not be replaced between a later HEAD and DELETE.
        IfNoneMatch: '*',
      }),
    };

    const command = new PutObjectCommand(params);
    await s3Client.send(command);

    return filename;
  } catch (error) {
    console.error('Upload to R2 failed:', error);
    throw new Error(`檔案上傳失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
  }
};

/**
 * 從 R2 獲取檔案
 * @param filename - 檔案名稱
 * @returns 檔案串流
 */
export const getFromR2 = async (filename: string): Promise<Readable> => {
  if (!s3Client) {
    if (isTestEnvironment) {
      // Mock file retrieval in test environment
      const mockStream = new Readable();
      mockStream.push('mock file content');
      mockStream.push(null);
      return mockStream;
    }
    throw new Error('R2 client not initialized');
  }

  try {
    const bucketName = process.env.R2_BUCKET_NAME;
    if (!bucketName) {
      throw new Error('R2_BUCKET_NAME not configured');
    }

    const params = {
      Bucket: bucketName,
      Key: filename,
    };

    const command = new GetObjectCommand(params);
    const { Body } = await s3Client.send(command);

    if (!Body) {
      throw new Error('檔案不存在');
    }

    return Body as Readable;
  } catch (error) {
    console.error('Get from R2 failed:', error);
    throw new Error(`檔案獲取失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
  }
};

/**
 * 從 R2 刪除檔案
 * @param filename - 檔案名稱
 */
export const deleteFromR2 = async (filename: string): Promise<void> => {
  if (!s3Client) {
    if (isTestEnvironment) {
      // Mock successful deletion in test environment
      return;
    }
    throw new Error('R2 client not initialized');
  }

  try {
    const bucketName = process.env.R2_BUCKET_NAME;
    if (!bucketName) {
      throw new Error('R2_BUCKET_NAME not configured');
    }

    const params = {
      Bucket: bucketName,
      Key: filename,
    };

    const command = new DeleteObjectCommand(params);
    await s3Client.send(command);
  } catch (error) {
    console.error('Delete from R2 failed:', error);
    throw new Error(`檔案刪除失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
  }
};

/**
 * 從 R2 刪除多個檔案
 * @param filenames - 檔案名稱陣列
 */
export const deleteMultipleFromR2 = async (filenames: string[]): Promise<void> => {
  try {
    const deletePromises = filenames.map(filename => deleteFromR2(filename));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Delete multiple from R2 failed:', error);
    throw new Error(`批量檔案刪除失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
  }
};

// ===== API 版本函數 =====

/**
 * 上傳檔案到 R2 (API 版本)
 * @param file - Multer 檔案物件
 * @param filename - 檔案名稱
 * @returns API 回應格式的上傳結果
 */
export const uploadToR2Api = async (file: Express.Multer.File, filename: string, ownerId: string): Promise<ApiSuccessResponse<{
  filename: string;
  url: string;
  size: number;
  mimetype: string;
}>> => {
  try {
    if (!z.string().uuid().safeParse(ownerId).success) throw new ForbiddenError('無法確認圖片擁有者');
    const uploadedFilename = await uploadToR2(file, filename, ownerId);
    
    // 建構完整的 URL
    const baseUrl = process.env.R2_PUBLIC_URL || `https://${process.env.R2_BUCKET_NAME}.${process.env.R2_ENDPOINT?.replace('https://', '')}`;
    const fileUrl = `${baseUrl}/${uploadedFilename}`;
    
    return createSuccessResponse({
      filename: uploadedFilename,
      url: fileUrl,
      size: file.size,
      mimetype: file.mimetype
    }, {
      message: '檔案上傳成功',
      aggregateData: {
        uploadInfo: {
          bucket: process.env.R2_BUCKET_NAME,
          originalName: file.originalname,
          uploadedAt: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    throw error instanceof Error ? error : new Error('檔案上傳失敗');
  }
};

/**
 * 刪除 R2 檔案 (API 版本)
 * @param filename - 檔案名稱
 * @returns API 回應格式的刪除結果
 */
export const deleteFromR2Api = async (filename: string, ownerId: string): Promise<ApiSuccessResponse<{
  filename: string;
  deletedAt: string;
}>> => {
  try {
    if (!z.string().uuid().safeParse(ownerId).success) throw new ForbiddenError('無權限刪除此圖片');
    if (!s3Client) throw new Error('R2 client not initialized');
    const bucketName = process.env.R2_BUCKET_NAME;
    if (!bucketName) throw new Error('R2_BUCKET_NAME not configured');
    let metadata: Record<string, string> | undefined;
    try {
      const object = await s3Client.send(new HeadObjectCommand({ Bucket: bucketName, Key: filename }));
      metadata = object.Metadata;
    } catch (error) {
      if (typeof error === 'object' && error !== null && '$metadata' in error
        && typeof error.$metadata === 'object' && error.$metadata !== null
        && 'httpStatusCode' in error.$metadata && error.$metadata.httpStatusCode === 404) {
        throw new NotFoundError('圖片不存在');
      }
      throw error;
    }
    // Legacy objects have no proven uploader; usage in a resource is not ownership.
    if (metadata?.['daodao-owner-version'] !== '1' || metadata['daodao-owner-id'] !== ownerId) {
      throw new ForbiddenError('無權限刪除此圖片');
    }
    await deleteFromR2(filename);
    
    return createSuccessResponse({
      filename,
      deletedAt: new Date().toISOString()
    }, {
      message: '檔案刪除成功',
      aggregateData: {
        deleteInfo: {
          bucket: process.env.R2_BUCKET_NAME,
          deletedFile: filename
        }
      }
    });
  } catch (error) {
    throw error instanceof Error ? error : new Error('檔案刪除失敗');
  }
};

/**
 * 批量刪除 R2 檔案 (API 版本)
 * @param filenames - 檔案名稱陣列
 * @returns API 回應格式的刪除結果
 */
export const deleteMultipleFromR2Api = async (filenames: string[]): Promise<ApiSuccessResponse<{
  deletedFiles: string[];
  deletedCount: number;
  deletedAt: string;
}>> => {
  try {
    await deleteMultipleFromR2(filenames);
    
    return createSuccessResponse({
      deletedFiles: filenames,
      deletedCount: filenames.length,
      deletedAt: new Date().toISOString()
    }, {
      message: `成功刪除 ${filenames.length} 個檔案`,
      aggregateData: {
        batchDeleteInfo: {
          bucket: process.env.R2_BUCKET_NAME,
          totalFiles: filenames.length,
          deletedFiles: filenames
        }
      }
    });
  } catch (error) {
    throw error instanceof Error ? error : new Error('批量檔案刪除失敗');
  }
};

/**
 * 獲取檔案資訊 (API 版本)
 * @param filename - 檔案名稱
 * @returns API 回應格式的檔案資訊
 */
export const getFileInfoApi = async (filename: string): Promise<ApiSuccessResponse<{
  filename: string;
  url: string;
  exists: boolean;
}>> => {
  try {
    // 嘗試獲取檔案來檢查是否存在
    let exists = true;
    try {
      await getFromR2(filename);
    } catch {
      exists = false;
    }
    
    // 建構完整的 URL
    const baseUrl = process.env.R2_PUBLIC_URL || `https://${process.env.R2_BUCKET_NAME}.${process.env.R2_ENDPOINT?.replace('https://', '')}`;
    const fileUrl = `${baseUrl}/${filename}`;
    
    return createSuccessResponse({
      filename,
      url: fileUrl,
      exists
    }, {
      aggregateData: {
        fileInfo: {
          bucket: process.env.R2_BUCKET_NAME,
          checkedAt: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    throw error instanceof Error ? error : new Error('獲取檔案資訊失敗');
  }
};

// 匯出所有函數 (包含 API 版本)
export default {
  // 內部工具函數
  uploadToR2,
  getFromR2,
  deleteFromR2,
  deleteMultipleFromR2,
  
  // API 版本函數
  uploadToR2Api,
  deleteFromR2Api,
  deleteMultipleFromR2Api,
  getFileInfoApi
};
