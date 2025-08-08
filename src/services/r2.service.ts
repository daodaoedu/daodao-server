/**
 * Cloudflare R2 儲存服務
 * 處理檔案上傳、下載和刪除操作
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

/**
 * S3 客戶端配置
 */
const s3Client = new S3Client({
  region: process.env.R2_REGION || 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

/**
 * 上傳檔案到 R2
 * @param file - Multer 檔案物件
 * @param filename - 檔案名稱
 * @returns 上傳成功的檔案名稱
 */
export const uploadToR2 = async (file: Express.Multer.File, filename: string): Promise<string> => {
  try {
    const params = {
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: filename,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read' as const,
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
  try {
    const params = {
      Bucket: process.env.R2_BUCKET_NAME!,
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
  try {
    const params = {
      Bucket: process.env.R2_BUCKET_NAME!,
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