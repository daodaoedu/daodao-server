/**
 * 圖片檔案驗證器 - OpenAPI 版本
 * 使用 @asteasolutions/zod-to-openapi
 *
 * 🔄 遷移完成：
 * 1. 將 .meta() 和 .describe() 改為 .openapi()
 * 2. 使用 registry.register() 註冊 schemas
 * 3. 添加完整的 OpenAPI metadata
 */

import { z } from 'zod';
import { registry } from '../config/openapi-registry';
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
// Core Validation Schemas (使用 .openapi())
// ============================================================================

/**
 * 單一檔案驗證 Schema
 * 驗證檔案的 MIME 類型和大小
 */
export const fileSchema = z.object({
  mimetype: z.string()
    .refine(
      (type): type is AllowedMimeType =>
        ALLOWED_MIME_TYPES.includes(type as AllowedMimeType),
      {
        message: '不支援的檔案類型。僅支援 JPEG、PNG 和 WebP 格式。',
      }
    )
    .openapi({
      description: '上傳檔案的 MIME 類型',
      example: 'image/jpeg',
      examples: ['image/jpeg', 'image/png', 'image/webp']
    }),
  size: z.number()
    .refine(
      (size) => size > 0 && size <= MAX_FILE_SIZE,
      {
        message: `檔案大小必須在 1 byte 到 ${Math.round(MAX_FILE_SIZE / 1024)}KB 之間`,
      }
    )
    .openapi({
      description: '檔案的位元組大小',
      example: 512000,
      examples: [102400, 512000, 1048576],
      minimum: 1,
      maximum: MAX_FILE_SIZE
    }),
  originalname: z.string()
    .min(1, '檔案名稱不能為空')
    .openapi({
      description: '原始檔案名稱',
      example: 'profile.jpg',
      examples: ['profile.jpg', 'avatar.png', 'banner-image.webp']
    }),
  buffer: z.instanceof(Buffer)
    .openapi({
      description: '檔案的二進制數據緩衝',
      type: 'string',
      format: 'binary'
    }),
}).strict().openapi('ImageFile', {
  description: '單一圖片檔案的驗證規則'
});

// 註冊 ImageFile schema
registry.register('ImageFile', fileSchema);

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
  .openapi('ImageFiles', {
    description: '多個圖片檔案的驗證和數量限制',
    minItems: 1,
    maxItems: MAX_FILES_COUNT
  });

// 註冊 ImageFiles schema
registry.register('ImageFiles', filesSchema);

/**
 * 檔案名稱參數驗證 Schema
 * 用於驗證 URL 參數中的檔案名稱
 */
export const filenameParamSchema = z.object({
  filename: z.string()
    .min(1, '檔案名稱不能為空')
    .max(255, '檔案名稱過長')
    .regex(
      /^[a-zA-Z0-9._-]+$/,
      '檔案名稱只能包含字母、數字、點號、底線和連字號'
    )
    .openapi({
      description: '圖片檔案名稱',
      example: 'image_123.jpg',
      examples: ['image_123.jpg', 'user-avatar.png', 'banner.webp'],
      param: {
        name: 'filename',
        in: 'path'
      }
    })
}).openapi('FilenameParam', {
  description: '檔案名稱路徑參數'
});

// 註冊 FilenameParam schema
registry.register('FilenameParam', filenameParamSchema);

// ============================================================================
// Response Schemas
// ============================================================================

/**
 * 單一圖片上傳成功回應數據
 */
export const imageUploadDataSchema = z.object({
  url: z.string()
    .url()
    .openapi({
      description: '圖片的完整 URL',
      example: 'https://r2.example.com/images/550e8400-e29b-41d4-a716-446655440000.jpg',
      format: 'uri'
    }),
  filename: z.string()
    .openapi({
      description: '儲存的檔案名稱（UUID）',
      example: '550e8400-e29b-41d4-a716-446655440000',
      format: 'uuid'
    }),
  size: z.number()
    .int()
    .positive()
    .openapi({
      description: '檔案大小（位元組）',
      example: 512000
    }),
  mimetype: z.string()
    .openapi({
      description: '檔案 MIME 類型',
      example: 'image/jpeg',
      examples: ['image/jpeg', 'image/png', 'image/webp']
    })
}).openapi('ImageUploadData', {
  description: '單一圖片上傳成功的資料'
});

// 註冊 ImageUploadData schema
registry.register('ImageUploadData', imageUploadDataSchema);

/**
 * 單一圖片上傳成功回應
 */
export const uploadImageResponseSchema = z.object({
  success: z.literal(true)
    .openapi({
      description: '請求成功標誌',
      example: true
    }),
  data: imageUploadDataSchema,
  timestamp: z.string()
    .datetime()
    .openapi({
      description: '回應時間戳',
      example: '2024-01-15T10:30:00.000Z',
      format: 'date-time'
    })
}).openapi('UploadImageResponse', {
  description: '單一圖片上傳成功回應'
});

// 註冊 UploadImageResponse schema
registry.register('UploadImageResponse', uploadImageResponseSchema);

/**
 * 多個圖片上傳結果項目
 */
export const multipleImageUploadItemSchema = z.object({
  url: z.string()
    .url()
    .openapi({
      description: '圖片的完整 URL',
      example: 'https://r2.example.com/images/550e8400-e29b-41d4-a716-446655440000.jpg',
      format: 'uri'
    }),
  filename: z.string()
    .openapi({
      description: '儲存的檔案名稱（UUID）',
      example: '550e8400-e29b-41d4-a716-446655440000',
      format: 'uuid'
    }),
  size: z.number()
    .int()
    .positive()
    .openapi({
      description: '檔案大小（位元組）',
      example: 512000
    }),
  mimetype: z.string()
    .openapi({
      description: '檔案 MIME 類型',
      example: 'image/jpeg'
    })
}).openapi('MultipleImageUploadItem', {
  description: '多個圖片上傳結果中的單一項目'
});

// 註冊 MultipleImageUploadItem schema
registry.register('MultipleImageUploadItem', multipleImageUploadItemSchema);

/**
 * 多個圖片上傳成功回應數據
 */
export const multipleImageUploadDataSchema = z.object({
  urls: z.array(multipleImageUploadItemSchema)
    .openapi({
      description: '已上傳圖片的資訊陣列'
    }),
  totalFiles: z.number()
    .int()
    .positive()
    .openapi({
      description: '成功上傳的檔案總數',
      example: 3
    }),
  totalSize: z.number()
    .int()
    .positive()
    .openapi({
      description: '所有檔案的總大小（位元組）',
      example: 1536000
    })
}).openapi('MultipleImageUploadData', {
  description: '多個圖片上傳成功的資料'
});

// 註冊 MultipleImageUploadData schema
registry.register('MultipleImageUploadData', multipleImageUploadDataSchema);

/**
 * 多個圖片上傳成功回應
 */
export const uploadMultipleImagesResponseSchema = z.object({
  success: z.literal(true)
    .openapi({
      description: '請求成功標誌',
      example: true
    }),
  data: multipleImageUploadDataSchema,
  timestamp: z.string()
    .datetime()
    .openapi({
      description: '回應時間戳',
      example: '2024-01-15T10:30:00.000Z',
      format: 'date-time'
    }),
  meta: z.object({
    message: z.string()
      .openapi({
        description: '成功訊息',
        example: '成功上傳 3 個圖片'
      }),
    aggregateData: z.object({
      uploadSummary: z.object({
        successCount: z.number()
          .openapi({
            description: '成功上傳的檔案數',
            example: 3
          }),
        totalSize: z.number()
          .openapi({
            description: '總檔案大小',
            example: 1536000
          }),
        uploadedAt: z.string()
          .datetime()
          .openapi({
            description: '上傳時間',
            example: '2024-01-15T10:30:00.000Z',
            format: 'date-time'
          })
      })
    })
  }).optional()
}).openapi('UploadMultipleImagesResponse', {
  description: '多個圖片上傳成功回應'
});

// 註冊 UploadMultipleImagesResponse schema
registry.register('UploadMultipleImagesResponse', uploadMultipleImagesResponseSchema);

/**
 * 刪除圖片成功回應數據
 */
export const deleteImageDataSchema = z.object({
  message: z.string()
    .openapi({
      description: '刪除成功訊息',
      example: '圖片已成功刪除'
    }),
  filename: z.string()
    .openapi({
      description: '已刪除的檔案名稱',
      example: '550e8400-e29b-41d4-a716-446655440000',
      format: 'uuid'
    })
}).openapi('DeleteImageData', {
  description: '刪除圖片成功的資料'
});

// 註冊 DeleteImageData schema
registry.register('DeleteImageData', deleteImageDataSchema);

/**
 * 刪除圖片成功回應
 */
export const deleteImageResponseSchema = z.object({
  success: z.literal(true)
    .openapi({
      description: '請求成功標誌',
      example: true
    }),
  data: deleteImageDataSchema,
  timestamp: z.string()
    .datetime()
    .openapi({
      description: '回應時間戳',
      example: '2024-01-15T10:30:00.000Z',
      format: 'date-time'
    })
}).openapi('DeleteImageResponse', {
  description: '刪除圖片成功回應'
});

// 註冊 DeleteImageResponse schema
registry.register('DeleteImageResponse', deleteImageResponseSchema);

// ============================================================================
// Enhanced Validation Schemas with Detailed Error Messages
// ============================================================================

/**
 * 增強的單一檔案驗證 Schema
 * 提供更詳細的錯誤訊息和驗證碼
 */
export const enhancedFileSchema = z.object({
  mimetype: z.string()
    .refine(
      (type): type is AllowedMimeType =>
        ALLOWED_MIME_TYPES.includes(type as AllowedMimeType),
      {
        message: '不支援的檔案類型。僅支援 JPEG (.jpg, .jpeg)、PNG (.png) 和 WebP (.webp) 格式。',
      }
    )
    .openapi({
      description: '上傳檔案的 MIME 類型（增強驗證）',
      example: 'image/jpeg',
      examples: ['image/jpeg', 'image/png', 'image/webp']
    }),
  size: z.number()
    .refine(
      (size) => size > 0,
      {
        message: '檔案不能為空',
      }
    )
    .refine(
      (size) => size <= MAX_FILE_SIZE,
      {
        message: `檔案大小超過 ${Math.round(MAX_FILE_SIZE / 1024)}KB 限制`,
      }
    )
    .openapi({
      description: '檔案大小（位元組）增強驗證',
      example: 512000,
      examples: [102400, 512000, 1048576],
      minimum: 1,
      maximum: MAX_FILE_SIZE
    }),
  originalname: z.string()
    .min(1, '檔案名稱不能為空')
    .max(255, '檔案名稱過長')
    .refine(
      (name) => !/[<>:"/\\|?*]/.test(name),
      '檔案名稱包含無效字元'
    )
    .openapi({
      description: '原始檔案名稱（增強安全驗證）',
      example: 'safe-filename.jpg',
      examples: ['safe-filename.jpg', 'user_avatar.png', 'valid-image.webp']
    }),
  buffer: z.instanceof(Buffer)
    .openapi({
      description: '檔案的二進制數據緩衝（增強驗證）',
      type: 'string',
      format: 'binary'
    }),
}).strict().openapi('EnhancedImageFile', {
  description: '增強安全性的單一圖片檔案驗證'
});

// 註冊 EnhancedImageFile schema
registry.register('EnhancedImageFile', enhancedFileSchema);

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
  .openapi('EnhancedImageFiles', {
    description: '增強安全性的多個圖片檔案批量驗證',
    minItems: 1,
    maxItems: MAX_FILES_COUNT
  });

// 註冊 EnhancedImageFiles schema
registry.register('EnhancedImageFiles', enhancedFilesSchema);

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
  enhancedFile: enhancedFileSchema,
  enhancedFiles: enhancedFilesSchema,
} as const;

/**
 * 驗證 schema 類型
 */
export type ImageValidationSchemas = typeof imageValidationSchemas;

// ============================================================================
// 📋 總結：遷移檢查清單
// ============================================================================

/**
 * ✅ 完成的改進：
 *
 * 1. ✅ 使用 .openapi() 替代 .meta() 和 .describe()
 *    - 提供更好的 TypeScript 類型推斷
 *    - 直接對應到 OpenAPI spec
 *
 * 2. ✅ 使用 registry.register() 註冊可重用組件
 *    - 避免重複定義
 *    - 自動生成 $ref 引用
 *
 * 3. ✅ 提供完整的 OpenAPI metadata
 *    - example / examples
 *    - format (uri, uuid, date-time, binary)
 *    - minimum / maximum
 *    - description
 *
 * 4. ✅ 創建完整的響應 schemas
 *    - 單一圖片上傳響應
 *    - 多個圖片上傳響應
 *    - 刪除圖片響應
 *
 * 5. ✅ 保持向後兼容性
 *    - 保留所有現有的驗證函數
 *    - 保留現有的類型定義
 */
