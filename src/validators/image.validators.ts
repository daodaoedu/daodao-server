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
  BatchValidationError
} from '../types/image.types';

// 直接定義 Multer File 類型以避免導入問題
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

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
  )
    .describe("上傳檔案的 MIME 類型")
    .meta({
      title: "檔案類型",
      examples: ["image/jpeg", "image/png", "image/webp"]
    }),
  size: z.number().refine(
    (size) => size > 0 && size <= MAX_FILE_SIZE,
    {
      message: `檔案大小必須在 1 byte 到 ${Math.round(MAX_FILE_SIZE / 1024)}KB 之間`,
    }
  )
    .describe("檔案的位元組大小")
    .meta({
      title: "檔案大小",
      examples: [102400, 512000, 1048576]
    }),
  originalname: z.string().min(1, '檔案名稱不能為空')
    .describe("原始檔案名稱")
    .meta({
      title: "檔案名稱",
      examples: ["profile.jpg", "avatar.png", "banner-image.webp"]
    }),
  buffer: z.instanceof(Buffer)
    .describe("檔案的二進制數據緩衣")
    .meta({
      title: "檔案緩衣",
      examples: ["Buffer類型的二進制數據"]
    }),
}).strict().describe("單一圖片檔案的驗證規則").meta({
  title: "單一圖片檔案",
  examples: [{
    mimetype: "image/jpeg",
    size: 512000,
    originalname: "profile.jpg",
    buffer: "Buffer數據"
  }]
});

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
  )
  .describe("多個圖片檔案的驗證和數量限制")
  .meta({
    title: "多個圖片檔案",
    examples: [[
      {
        mimetype: "image/jpeg",
        size: 512000,
        originalname: "photo1.jpg",
        buffer: "Buffer數據1"
      },
      {
        mimetype: "image/png",
        size: 256000,
        originalname: "photo2.png",
        buffer: "Buffer數據2"
      }
    ]]
  });

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
  )
  .describe("網址參數中的檔案名稱，用於檔案查詢或下載")
  .meta({
    title: "檔案名稱參數",
    examples: ["image_123.jpg", "user-avatar.png", "banner.webp", "profile_pic_2024.jpeg"]
  });

/**
 * 檔案上傳請求體驗證 Schema
 * 用於驗證包含檔案的請求
 */
export const uploadRequestSchema = z.object({
  file: fileSchema.optional()
    .describe("單一檔案上傳")
    .meta({
      title: "單一檔案",
      examples: [{
        mimetype: "image/jpeg",
        size: 512000,
        originalname: "upload.jpg",
        buffer: "Buffer數據"
      }]
    }),
  files: z.array(fileSchema).optional()
    .describe("多個檔案上傳")
    .meta({
      title: "多個檔案",
      examples: [[
        {
          mimetype: "image/png",
          size: 256000,
          originalname: "file1.png",
          buffer: "Buffer數據1"
        },
        {
          mimetype: "image/webp",
          size: 384000,
          originalname: "file2.webp",
          buffer: "Buffer數據2"
        }
      ]]
    }),
}).refine(
  (data) => data.file !== undefined || (data.files !== undefined && data.files.length > 0),
  {
    message: '必須提供至少一個檔案',
    path: ['file', 'files'],
  }
).describe("檔案上傳請求的驗證，支援單一或多個檔案").meta({
  title: "檔案上傳請求",
  examples: [{
    file: {
      mimetype: "image/jpeg",
      size: 512000,
      originalname: "single-upload.jpg",
      buffer: "Buffer數據"
    }
  }, {
    files: [
      {
        mimetype: "image/png",
        size: 256000,
        originalname: "batch1.png",
        buffer: "Buffer數據1"
      },
      {
        mimetype: "image/webp",
        size: 384000,
        originalname: "batch2.webp",
        buffer: "Buffer數據2"
      }
    ]
  }]
});

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
  )
    .describe("上傳檔案的 MIME 類型（增強驗證）")
    .meta({
      title: "增強檔案類型",
      examples: ["image/jpeg", "image/png", "image/webp"]
    }),
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
  )
    .describe("檔案大小（位元組）增強驗證")
    .meta({
      title: "增強檔案大小",
      examples: [102400, 512000, 1048576]
    }),
  originalname: z.string()
    .min(1, '檔案名稱不能為空')
    .max(255, '檔案名稱過長')
    .refine(
      (name) => !/[<>:"/\\|?*]/.test(name),
      '檔案名稱包含無效字元'
    )
    .describe("原始檔案名稱（增強安全驗證）")
    .meta({
      title: "增強檔案名稱",
      examples: ["safe-filename.jpg", "user_avatar.png", "valid-image.webp"]
    }),
  buffer: z.instanceof(Buffer)
    .describe("檔案的二進制數據緩衣（增強驗證）")
    .meta({
      title: "增強檔案緩衣",
      examples: ["Buffer類型的安全二進制數據"]
    }),
}).strict().describe("增強安全性的單一圖片檔案驗證").meta({
  title: "增強單一圖片檔案",
  examples: [{
    mimetype: "image/jpeg",
    size: 512000,
    originalname: "secure-upload.jpg",
    buffer: "安全Buffer數據"
  }]
});

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
  )
  .describe("增強安全性的多個圖片檔案批量驗證")
  .meta({
    title: "增強多個圖片檔案",
    examples: [[
      {
        mimetype: "image/jpeg",
        size: 512000,
        originalname: "secure-photo1.jpg",
        buffer: "安全Buffer數據1"
      },
      {
        mimetype: "image/png",
        size: 256000,
        originalname: "secure-photo2.png",
        buffer: "安全Buffer數據2"
      }
    ]]
  });

// ============================================================================
// Type Definitions for Validation Results
// ============================================================================

/**
 * Zod 驗證結果類型
 */
export type FileValidationSuccess = z.ZodSafeParseSuccess<z.infer<typeof fileSchema>>;
export type FileValidationFailure = z.ZodSafeParseError<z.infer<typeof fileSchema>>;
export type FilesValidationSuccess = z.ZodSafeParseSuccess<z.infer<typeof filesSchema>>;
export type FilesValidationFailure = z.ZodSafeParseError<z.infer<typeof filesSchema>>;

/**
 * 增強驗證結果類型
 */
export type EnhancedFileValidationSuccess = z.ZodSafeParseSuccess<z.infer<typeof enhancedFileSchema>>;
export type EnhancedFileValidationFailure = z.ZodSafeParseError<z.infer<typeof enhancedFileSchema>>;
export type EnhancedFilesValidationSuccess = z.ZodSafeParseSuccess<z.infer<typeof enhancedFilesSchema>>;
export type EnhancedFilesValidationFailure = z.ZodSafeParseError<z.infer<typeof enhancedFilesSchema>>;

// ============================================================================
// Validation Result Processing
// ============================================================================

/**
 * 將 Zod 錯誤轉換為標準化的驗證錯誤格式
 */
export function transformZodErrors(zodErrors: z.ZodError): FileValidationError[] {
  return zodErrors.issues.map((error: z.ZodIssue, index: number) => {
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
      value: (error as { received?: unknown }).received,
    };
  });
}

/**
 * 將批量 Zod 錯誤轉換為批量驗證錯誤格式
 */
export function transformBatchZodErrors(
  zodErrors: z.ZodError,
  files: MulterFile[]
): BatchValidationError[] {
  const batchErrors: BatchValidationError[] = [];
  
  zodErrors.issues.forEach((error: z.ZodIssue) => {
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
          value: (error as { received?: unknown }).received,
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