import { Request } from 'express';

/**
 * 圖片相關類型定義
 */

// ============================================================================
// Multer File Type Interfaces
// ============================================================================

/**
 * 擴展的 Multer 檔案介面，包含額外的類型安全屬性
 */
export interface TypedMulterFile extends Express.Multer.File {
  mimetype: AllowedMimeType;
  size: number;
  originalname: string;
  buffer: Buffer;
}

/**
 * 允許的 MIME 類型
 */
export type AllowedMimeType = 'image/jpeg' | 'image/png' | 'image/webp';

/**
 * 檔案驗證結果
 */
export interface FileValidationResult {
  isValid: boolean;
  errors: FileValidationError[];
}

// ============================================================================
// Request Interface Extensions
// ============================================================================

/**
 * 擴展 Express Request 以包含 multer 檔案屬性
 */
export interface MulterRequest extends Request {
  file?: Express.Multer.File;
  files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
}

/**
 * 單一檔案上傳請求 - 確保有檔案的請求
 */
export interface SingleFileRequest extends MulterRequest {
  file: Express.Multer.File;
}

/**
 * 多檔案上傳請求 - 確保有檔案陣列的請求
 */
export interface MultipleFilesRequest extends MulterRequest {
  files: Express.Multer.File[];
}

/**
 * 檔案參數請求 (用於獲取和刪除) - 包含檔案名稱參數
 */
export interface FileParamsRequest extends MulterRequest {
  params: MulterRequest['params'] & {
    filename: string;
  };
}

// ============================================================================
// Response Type Interfaces
// ============================================================================

/**
 * 基礎 API 回應介面
 */
export interface BaseApiResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * 檔案上傳回應
 */
export interface ImageUploadResponse extends BaseApiResponse {
  data?: {
    url: string;
    filename?: string;
    size?: number;
    mimetype?: string;
  };
}

/**
 * 多檔案上傳回應
 */
export interface MultipleImageUploadResponse extends BaseApiResponse {
  data?: {
    urls: Array<{
      url: string;
      filename?: string;
      size?: number;
      mimetype?: string;
    }>;
    totalFiles?: number;
    totalSize?: number;
  };
}

/**
 * 檔案刪除回應
 */
export interface ImageDeleteResponse extends BaseApiResponse {
  data?: {
    filename: string;
    deletedAt: string;
  };
}

/**
 * 檔案獲取錯誤回應
 */
export interface ImageGetErrorResponse extends BaseApiResponse {
  success: false;
  error: string;
}

// ============================================================================
// Validation Error Type Definitions
// ============================================================================

/**
 * 檔案驗證錯誤
 */
export interface FileValidationError {
  field: string;
  message: string;
  code: ValidationErrorCode;
  value?: unknown;
}

/**
 * 驗證錯誤代碼
 */
export type ValidationErrorCode = 
  | 'INVALID_MIME_TYPE'
  | 'FILE_TOO_LARGE'
  | 'NO_FILE_PROVIDED'
  | 'TOO_MANY_FILES'
  | 'INVALID_FILE_NAME'
  | 'UPLOAD_FAILED'
  | 'DELETE_FAILED'
  | 'FILE_NOT_FOUND';

/**
 * 批量驗證錯誤
 */
export interface BatchValidationError {
  fileIndex: number;
  filename: string;
  errors: FileValidationError[];
}

/**
 * 驗證錯誤回應
 */
export interface ValidationErrorResponse extends BaseApiResponse {
  success: false;
  error: string;
  details?: {
    validationErrors: FileValidationError[];
    batchErrors?: BatchValidationError[];
  };
}

// ============================================================================
// Upload Configuration and Constants
// ============================================================================

/**
 * 允許的檔案類型
 */
export const ALLOWED_MIME_TYPES: readonly AllowedMimeType[] = ['image/jpeg', 'image/png', 'image/webp'] as const;

/**
 * 檔案大小限制 (500KB)
 */
export const MAX_FILE_SIZE = 500 * 1024;

/**
 * 最大檔案數量限制
 */
export const MAX_FILES_COUNT = 5;

/**
 * 支援的檔案副檔名
 */
export const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'] as const;

/**
 * 檔案上傳配置
 */
export interface UploadConfig {
  maxFileSize: number;
  maxFiles: number;
  allowedMimeTypes: readonly AllowedMimeType[];
  allowedExtensions: readonly string[];
}

/**
 * 預設上傳配置
 */
export const DEFAULT_UPLOAD_CONFIG: UploadConfig = {
  maxFileSize: MAX_FILE_SIZE,
  maxFiles: MAX_FILES_COUNT,
  allowedMimeTypes: ALLOWED_MIME_TYPES,
  allowedExtensions: ALLOWED_EXTENSIONS,
};

// ============================================================================
// Utility Types
// ============================================================================

/**
 * 檔案上傳狀態
 */
export type UploadStatus = 'pending' | 'uploading' | 'success' | 'failed' | 'cancelled';

/**
 * 檔案處理結果
 */
export interface FileProcessingResult {
  filename: string;
  originalName: string;
  status: UploadStatus;
  url?: string;
  error?: string;
  size?: number;
  mimetype?: string;
}

/**
 * 批量上傳結果
 */
export interface BatchUploadResult {
  totalFiles: number;
  successCount: number;
  failureCount: number;
  results: FileProcessingResult[];
  errors: FileValidationError[];
}

// ============================================================================
// Type Guards and Utility Functions
// ============================================================================

/**
 * 檢查是否為允許的 MIME 類型
 */
export function isAllowedMimeType(mimetype: string): mimetype is AllowedMimeType {
  return ALLOWED_MIME_TYPES.includes(mimetype as AllowedMimeType);
}

/**
 * 檢查請求是否包含單一檔案
 */
export function hasSingleFile(req: MulterRequest): req is SingleFileRequest {
  return req.file !== undefined;
}

/**
 * 檢查請求是否包含多個檔案
 */
export function hasMultipleFiles(req: MulterRequest): req is MultipleFilesRequest {
  return Array.isArray(req.files) && req.files.length > 0;
}

/**
 * 檢查請求是否包含檔案名稱參數
 */
export function hasFilenameParam(req: MulterRequest): req is FileParamsRequest {
  return typeof req.params?.filename === 'string' && req.params.filename.length > 0;
}

/**
 * 將 multer files 轉換為檔案陣列
 */
export function normalizeMulterFiles(files: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] } | undefined): Express.Multer.File[] {
  if (!files) return [];
  
  if (Array.isArray(files)) {
    return files;
  }
  
  // 如果是物件，合併所有檔案陣列
  return Object.values(files).flat();
}