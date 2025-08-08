/**
 * 圖片檔案驗證器
 * 提供類型安全的 Zod 驗證 schemas 和相關驗證邏輯
 */

import { z } from 'zod';
import { 
  ALLOWED_MIME_TYPES, 
  MAX_FILE_SIZE, 
  MAX_FILES_COUNT,
  AllowedMimeType,
  FileValidationError,
  ValidationErrorCode,
  FileValidationResult,
  BatchValidationError
} from '../types/image.types';

// ============================================================================
// Core Validation Schemas
// ============================================================================

/**
 * 單一檔案驗證 Schema
 * 驗證檔案的 MIME 類型和大小
 */
export const fileSchema = z.object({
  mimetype: z.string().refine(
    (type): type is AllowedMimeType => 
      ALLOWED_MIME_TYPES.includes(type as AllowedMimeType),
    {
      message: '不支援的檔案類型。僅支援 JPEG、PNG 和 WebP 格式。',
    }
  ),
  size: z.number().refine(
    (size) => size > 0 && size <= MAX_FILE_SIZE,
    {
      message: `檔案大小必須在 1 byte 到 ${Math.round(MAX_FILE_SIZE / 1024)}KB 之間`,
    }
  ),
  originalname: z.string().min(1, '檔案名稱不能為空'),
  buffer: z.instanceof(Buffer),
}).strict();

/**
 * 多檔案驗證 Schema
 * 驗證檔案陣列，包含數量限制
 */
export const filesSchema = z.array(fileSchema)
  .min(1, '至少需要上傳一個檔案')
  .max(MAX_FILES_COUNT, `最多只能上傳 ${MAX_FILES_COUNT} 個檔案`)
  .refine(
    (files) => {
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      return totalSize <= MAX_FILE_SIZE * MAX_FILES_COUNT;
    },
    {
      message: `所有檔案的總大小不能超過 ${Math.round((MAX_FILE_SIZE * MAX_FILES_COUNT) / 1024)}KB`,
    }
  );

/**
 * 檔案名稱參數驗證 Schema
 * 用於驗證 URL 參數中的檔案名稱
 */
export const filenameParamSchema = z.string()
  .min(1, '檔案名稱不能為空')
  .max(255, '檔案名稱過長')
  .regex(
    /^[a-zA-Z0-9._-]+$/,
    '檔案名稱只能包含字母、數字、點號、底線和連字號'
  );

/**
 * 檔案上傳請求體驗證 Schema
 * 用於驗證包含檔案的請求
 */
export const uploadRequestSchema = z.object({
  file: fileSchema.optional(),
  files: z.array(fileSchema).optional(),
}).refine(
  (data) => data.file !== undefined || (data.files !== undefined && data.files.length > 0),
  {
    message: '必須提供至少一個檔案',
    path: ['file', 'files'],
  }
);

// ============================================================================
// Enhanced Validation Schemas with Detailed Error Messages
// ============================================================================

/**
 * 增強的單一檔案驗證 Schema
 * 提供更詳細的錯誤訊息和驗證碼
 */
export const enhancedFileSchema = z.object({
  mimetype: z.string().refine(
    (type): type is AllowedMimeType => 
      ALLOWED_MIME_TYPES.includes(type as AllowedMimeType),
    {
      message: '不支援的檔案類型。僅支援 JPEG (.jpg, .jpeg)、PNG (.png) 和 WebP (.webp) 格式。',
    }
  ),
  size: z.number().refine(
    (size) => size > 0,
    {
      message: '檔案不能為空',
    }
  ).refine(
    (size) => size <= MAX_FILE_SIZE,
    {
      message: `檔案大小超過 ${Math.round(MAX_FILE_SIZE / 1024)}KB 限制`,
    }
  ),
  originalname: z.string()
    .min(1, '檔案名稱不能為空')
    .max(255, '檔案名稱過長')
    .refine(
      (name) => !/[<>:"/\\|?*]/.test(name),
      '檔案名稱包含無效字元'
    ),
  buffer: z.instanceof(Buffer),
}).strict();

/**
 * 增強的多檔案驗證 Schema
 * 提供批量驗證和詳細錯誤報告
 */
export const enhancedFilesSchema = z.array(enhancedFileSchema)
  .min(1, '至少需要上傳一個檔案')
  .max(MAX_FILES_COUNT, `最多只能上傳 ${MAX_FILES_COUNT} 個檔案`)
  .refine(
    (files) => {
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      return totalSize <= MAX_FILE_SIZE * MAX_FILES_COUNT;
    },
    {
      message: `所有檔案的總大小超過 ${Math.round((MAX_FILE_SIZE * MAX_FILES_COUNT) / 1024)}KB 限制`,
    }
  );

// ============================================================================
// Type Definitions for Validation Results
// ============================================================================

/**
 * Zod 驗證結果類型
 */
export type FileValidationSuccess = z.SafeParseSuccess<z.infer<typeof fileSchema>>;
export type FileValidationFailure = z.SafeParseError<z.infer<typeof fileSchema>>;
export type FilesValidationSuccess = z.SafeParseSuccess<z.infer<typeof filesSchema>>;
export type FilesValidationFailure = z.SafeParseError<z.infer<typeof filesSchema>>;

/**
 * 增強驗證結果類型
 */
export type EnhancedFileValidationSuccess = z.SafeParseSuccess<z.infer<typeof enhancedFileSchema>>;
export type EnhancedFileValidationFailure = z.SafeParseError<z.infer<typeof enhancedFileSchema>>;
export type EnhancedFilesValidationSuccess = z.SafeParseSuccess<z.infer<typeof enhancedFilesSchema>>;
export type EnhancedFilesValidationFailure = z.SafeParseError<z.infer<typeof enhancedFilesSchema>>;

// ============================================================================
// Validation Result Processing
// ============================================================================

/**
 * 將 Zod 錯誤轉換為標準化的驗證錯誤格式
 */
export function transformZodErrors(zodErrors: z.ZodError): FileValidationError[] {
  return zodErrors.errors.map((error, index) => {
    // 根據錯誤訊息內容推斷錯誤代碼
    let code: ValidationErrorCode = 'VALIDATION_ERROR' as ValidationErrorCode;
    
    if (error.message.includes('不支援的檔案類型')) {
      code = 'INVALID_MIME_TYPE';
    } else if (error.message.includes('檔案大小') || error.message.includes('總大小')) {
      code = 'FILE_TOO_LARGE';
    } else if (error.message.includes('未提供檔案') || error.message.includes('檔案不能為空')) {
      code = 'NO_FILE_PROVIDED';
    } else if (error.message.includes('最多只能上傳')) {
      code = 'TOO_MANY_FILES';
    } else if (error.message.includes('檔案名稱')) {
      code = 'INVALID_FILE_NAME';
    }
    
    return {
      field: error.path.join('.') || `field_${index}`,
      message: error.message,
      code,
      value: (error as any).received,
    };
  });
}

/**
 * 將批量 Zod 錯誤轉換為批量驗證錯誤格式
 */
export function transformBatchZodErrors(
  zodErrors: z.ZodError,
  files: Express.Multer.File[]
): BatchValidationError[] {
  const batchErrors: BatchValidationError[] = [];
  
  zodErrors.errors.forEach((error) => {
    const pathParts = error.path;
    if (pathParts.length > 0 && typeof pathParts[0] === 'number') {
      const fileIndex = pathParts[0];
      const file = files[fileIndex];
      
      if (file) {
        let existingError = batchErrors.find(e => e.fileIndex === fileIndex);
        if (!existingError) {
          existingError = {
            fileIndex,
            filename: file.originalname,
            errors: [],
          };
          batchErrors.push(existingError);
        }
        
        // 根據錯誤訊息內容推斷錯誤代碼
        let code: ValidationErrorCode = 'VALIDATION_ERROR' as ValidationErrorCode;
        
        if (error.message.includes('不支援的檔案類型')) {
          code = 'INVALID_MIME_TYPE';
        } else if (error.message.includes('檔案大小') || error.message.includes('總大小')) {
          code = 'FILE_TOO_LARGE';
        } else if (error.message.includes('未提供檔案') || error.message.includes('檔案不能為空')) {
          code = 'NO_FILE_PROVIDED';
        } else if (error.message.includes('最多只能上傳')) {
          code = 'TOO_MANY_FILES';
        } else if (error.message.includes('檔案名稱')) {
          code = 'INVALID_FILE_NAME';
        }
        
        existingError.errors.push({
          field: pathParts.slice(1).join('.') || 'file',
          message: error.message,
          code,
          value: (error as any).received,
        });
      }
    }
  });
  
  return batchErrors;
}

// ============================================================================
// Schema Export for External Use
// ============================================================================

/**
 * 導出所有驗證 schemas
 */
export const imageValidationSchemas = {
  file: fileSchema,
  files: filesSchema,
  filenameParam: filenameParamSchema,
  uploadRequest: uploadRequestSchema,
  enhancedFile: enhancedFileSchema,
  enhancedFiles: enhancedFilesSchema,
} as const;

/**
 * 驗證 schema 類型
 */
export type ImageValidationSchemas = typeof imageValidationSchemas;