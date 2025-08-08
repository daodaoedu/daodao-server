/**
 * 圖片驗證工具函數
 * 提供類型安全的驗證工具、錯誤聚合和回應格式化功能
 */

import { z } from 'zod';
import {
  FileValidationError,
  FileValidationResult,
  BatchValidationError,
  ValidationErrorResponse,
  ValidationErrorCode,
  AllowedMimeType,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  MAX_FILES_COUNT,
  BatchUploadResult,
  FileProcessingResult,
  UploadStatus,
} from '../types/image.types';
import {
  fileSchema,
  filesSchema,
  enhancedFileSchema,
  enhancedFilesSchema,
  transformZodErrors,
  transformBatchZodErrors,
  FileValidationSuccess,
  FileValidationFailure,
  FilesValidationSuccess,
  FilesValidationFailure,
} from '../validators/image.validators';

// ============================================================================
// Single File Validation Helpers
// ============================================================================

/**
 * 驗證單一檔案
 * @param file - 要驗證的檔案
 * @param useEnhanced - 是否使用增強驗證 (提供更詳細的錯誤訊息)
 * @returns 驗證結果
 */
export function validateSingleFile(
  file: Express.Multer.File | undefined,
  useEnhanced: boolean = false
): FileValidationResult {
  if (!file) {
    return {
      isValid: false,
      errors: [{
        field: 'file',
        message: '未提供檔案',
        code: 'NO_FILE_PROVIDED',
      }],
    };
  }

  const schema = useEnhanced ? enhancedFileSchema : fileSchema;
  const validation = schema.safeParse(file);

  if (validation.success) {
    return {
      isValid: true,
      errors: [],
    };
  }

  return {
    isValid: false,
    errors: transformZodErrors(validation.error),
  };
}

/**
 * 快速檢查檔案是否有效
 * @param file - 要檢查的檔案
 * @returns 是否有效
 */
export function isValidFile(file: Express.Multer.File | undefined): file is Express.Multer.File {
  if (!file) return false;
  
  const validation = fileSchema.safeParse(file);
  return validation.success;
}

/**
 * 檢查檔案 MIME 類型是否被允許
 * @param mimetype - MIME 類型
 * @returns 是否為允許的類型
 */
export function isAllowedMimeType(mimetype: string): mimetype is AllowedMimeType {
  return ALLOWED_MIME_TYPES.includes(mimetype as AllowedMimeType);
}

/**
 * 檢查檔案大小是否在限制內
 * @param size - 檔案大小 (bytes)
 * @returns 是否在限制內
 */
export function isValidFileSize(size: number): boolean {
  return size > 0 && size <= MAX_FILE_SIZE;
}

// ============================================================================
// Multiple Files Validation Helpers
// ============================================================================

/**
 * 驗證多個檔案
 * @param files - 要驗證的檔案陣列
 * @param useEnhanced - 是否使用增強驗證
 * @returns 驗證結果包含批量錯誤資訊
 */
export function validateMultipleFiles(
  files: Express.Multer.File[] | undefined,
  useEnhanced: boolean = false
): FileValidationResult & { batchErrors?: BatchValidationError[] } {
  if (!files || files.length === 0) {
    return {
      isValid: false,
      errors: [{
        field: 'files',
        message: '未提供檔案',
        code: 'NO_FILE_PROVIDED',
      }],
    };
  }

  const schema = useEnhanced ? enhancedFilesSchema : filesSchema;
  const validation = schema.safeParse(files);

  if (validation.success) {
    return {
      isValid: true,
      errors: [],
    };
  }

  const standardErrors = transformZodErrors(validation.error);
  const batchErrors = transformBatchZodErrors(validation.error, files);

  return {
    isValid: false,
    errors: standardErrors,
    batchErrors,
  };
}

/**
 * 逐個驗證檔案並收集所有錯誤
 * @param files - 檔案陣列
 * @returns 每個檔案的驗證結果
 */
export function validateFilesIndividually(
  files: Express.Multer.File[]
): Array<{ fileIndex: number; filename: string; result: FileValidationResult }> {
  return files.map((file, index) => ({
    fileIndex: index,
    filename: file.originalname,
    result: validateSingleFile(file, true),
  }));
}

/**
 * 檢查檔案陣列是否全部有效
 * @param files - 檔案陣列
 * @returns 是否全部有效
 */
export function areAllFilesValid(files: Express.Multer.File[]): boolean {
  if (!files || files.length === 0) return false;
  
  const validation = filesSchema.safeParse(files);
  return validation.success;
}

/**
 * 檢查檔案數量是否在限制內
 * @param files - 檔案陣列
 * @returns 是否在限制內
 */
export function isValidFileCount(files: Express.Multer.File[]): boolean {
  return files.length > 0 && files.length <= MAX_FILES_COUNT;
}

/**
 * 檢查檔案總大小是否在限制內
 * @param files - 檔案陣列
 * @returns 是否在限制內
 */
export function isValidTotalSize(files: Express.Multer.File[]): boolean {
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  return totalSize <= MAX_FILE_SIZE * MAX_FILES_COUNT;
}

// ============================================================================
// Error Aggregation and Formatting
// ============================================================================

/**
 * 聚合多個驗證錯誤為單一錯誤訊息
 * @param errors - 驗證錯誤陣列
 * @param separator - 錯誤訊息分隔符
 * @returns 聚合的錯誤訊息
 */
export function aggregateErrorMessages(
  errors: FileValidationError[],
  separator: string = '; '
): string {
  return errors.map(error => error.message).join(separator);
}

/**
 * 聚合批量驗證錯誤
 * @param batchErrors - 批量驗證錯誤
 * @returns 格式化的錯誤訊息
 */
export function aggregateBatchErrors(batchErrors: BatchValidationError[]): string {
  return batchErrors
    .map(batch => 
      `檔案 "${batch.filename}" (索引 ${batch.fileIndex}): ${
        batch.errors.map(e => e.message).join(', ')
      }`
    )
    .join('; ');
}

/**
 * 根據錯誤代碼分組錯誤
 * @param errors - 驗證錯誤陣列
 * @returns 按錯誤代碼分組的錯誤
 */
export function groupErrorsByCode(
  errors: FileValidationError[]
): Record<ValidationErrorCode, FileValidationError[]> {
  return errors.reduce((groups, error) => {
    const code = error.code;
    if (!groups[code]) {
      groups[code] = [];
    }
    groups[code].push(error);
    return groups;
  }, {} as Record<ValidationErrorCode, FileValidationError[]>);
}

/**
 * 創建標準化的驗證錯誤回應
 * @param errors - 驗證錯誤陣列
 * @param batchErrors - 批量驗證錯誤 (可選)
 * @returns 格式化的錯誤回應
 */
export function createValidationErrorResponse(
  errors: FileValidationError[],
  batchErrors?: BatchValidationError[]
): ValidationErrorResponse {
  const mainMessage = aggregateErrorMessages(errors);
  
  return {
    success: false,
    error: mainMessage,
    details: {
      validationErrors: errors,
      ...(batchErrors && batchErrors.length > 0 && { batchErrors }),
    },
  };
}

// ============================================================================
// File Processing Result Helpers
// ============================================================================

/**
 * 創建檔案處理結果
 * @param file - 原始檔案
 * @param status - 處理狀態
 * @param url - 上傳後的 URL (可選)
 * @param error - 錯誤訊息 (可選)
 * @returns 檔案處理結果
 */
export function createFileProcessingResult(
  file: Express.Multer.File,
  status: UploadStatus,
  url?: string,
  error?: string
): FileProcessingResult {
  return {
    filename: file.originalname,
    originalName: file.originalname,
    status,
    size: file.size,
    mimetype: file.mimetype,
    ...(url && { url }),
    ...(error && { error }),
  };
}

/**
 * 創建批量上傳結果
 * @param results - 檔案處理結果陣列
 * @param errors - 驗證錯誤陣列
 * @returns 批量上傳結果
 */
export function createBatchUploadResult(
  results: FileProcessingResult[],
  errors: FileValidationError[] = []
): BatchUploadResult {
  const successCount = results.filter(r => r.status === 'success').length;
  const failureCount = results.filter(r => r.status === 'failed').length;
  
  return {
    totalFiles: results.length,
    successCount,
    failureCount,
    results,
    errors,
  };
}

// ============================================================================
// Validation Middleware Helpers
// ============================================================================

/**
 * 創建檔案驗證中間件使用的驗證函數
 * @param file - 檔案
 * @param fieldName - 欄位名稱
 * @returns Promise<void> - 驗證成功時解析，失敗時拋出錯誤
 */
export async function validateFileForMiddleware(
  file: Express.Multer.File,
  fieldName: string = 'file'
): Promise<void> {
  const result = validateSingleFile(file, true);
  
  if (!result.isValid) {
    const error = new Error(aggregateErrorMessages(result.errors));
    (error as any).field = fieldName;
    (error as any).validationErrors = result.errors;
    throw error;
  }
}

/**
 * 創建多檔案驗證中間件使用的驗證函數
 * @param files - 檔案陣列
 * @param fieldName - 欄位名稱
 * @returns Promise<void> - 驗證成功時解析，失敗時拋出錯誤
 */
export async function validateFilesForMiddleware(
  files: Express.Multer.File[],
  fieldName: string = 'files'
): Promise<void> {
  const result = validateMultipleFiles(files, true);
  
  if (!result.isValid) {
    const error = new Error(aggregateErrorMessages(result.errors));
    (error as any).field = fieldName;
    (error as any).validationErrors = result.errors;
    (error as any).batchErrors = result.batchErrors;
    throw error;
  }
}

// ============================================================================
// Utility Functions for File Information
// ============================================================================

/**
 * 獲取檔案大小的人類可讀格式
 * @param bytes - 檔案大小 (bytes)
 * @returns 格式化的檔案大小字串
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 獲取檔案副檔名
 * @param filename - 檔案名稱
 * @returns 副檔名 (包含點號)
 */
export function getFileExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.');
  return lastDotIndex !== -1 ? filename.substring(lastDotIndex) : '';
}

/**
 * 檢查檔案副檔名是否與 MIME 類型匹配
 * @param filename - 檔案名稱
 * @param mimetype - MIME 類型
 * @returns 是否匹配
 */
export function isExtensionMatchingMimeType(filename: string, mimetype: string): boolean {
  const extension = getFileExtension(filename).toLowerCase();
  
  const mimeToExtension: Record<string, string[]> = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp'],
  };
  
  const allowedExtensions = mimeToExtension[mimetype];
  return allowedExtensions ? allowedExtensions.includes(extension) : false;
}

// ============================================================================
// Export All Utilities
// ============================================================================

/**
 * 導出所有驗證工具函數
 */
export const imageValidationUtils = {
  // Single file validation
  validateSingleFile,
  isValidFile,
  isAllowedMimeType,
  isValidFileSize,
  
  // Multiple files validation
  validateMultipleFiles,
  validateFilesIndividually,
  areAllFilesValid,
  isValidFileCount,
  isValidTotalSize,
  
  // Error handling
  aggregateErrorMessages,
  aggregateBatchErrors,
  groupErrorsByCode,
  createValidationErrorResponse,
  
  // File processing
  createFileProcessingResult,
  createBatchUploadResult,
  
  // Middleware helpers
  validateFileForMiddleware,
  validateFilesForMiddleware,
  
  // Utility functions
  formatFileSize,
  getFileExtension,
  isExtensionMatchingMimeType,
} as const;

/**
 * 驗證工具類型
 */
export type ImageValidationUtils = typeof imageValidationUtils;