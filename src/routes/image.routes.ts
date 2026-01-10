/**
 * 圖片路由 - 帶 OpenAPI 定義的完整版本
 * 處理圖片上傳、獲取和刪除相關的路由
 * 使用 zod-to-openapi 官方推薦的 registry.registerPath() 方法
 */

import { Router, RequestHandler } from 'express';
import { z } from 'zod';
import { registry } from '../config/openapi-registry';
import { imageController } from '../controllers/image.controller';
import { authenticate } from '../middleware/auth';
import { uploadLimiter } from '../middleware/rate-limit.middleware';
import upload from '../middleware/multer.middleware';
import {
  filenameParamSchema,
  uploadImageResponseSchema,
  uploadMultipleImagesResponseSchema,
  deleteImageResponseSchema
} from '../validators/image.validators';

const router = Router();

// ============================================================================
// OpenAPI 路由定義（使用 registry.registerPath）
// ============================================================================

/**
 * GET /api/v1/images/:filename - 獲取圖片
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/images/{filename}',
  tags: ['Images'],
  summary: '獲取圖片',
  description: '根據檔案名稱獲取圖片。此為公開 API，無需身份驗證。',
  request: {
    params: filenameParamSchema
  },
  responses: {
    200: {
      description: '成功獲取圖片',
      content: {
        'image/jpeg': {
          schema: {
            type: 'string',
            format: 'binary'
          }
        },
        'image/png': {
          schema: {
            type: 'string',
            format: 'binary'
          }
        },
        'image/webp': {
          schema: {
            type: 'string',
            format: 'binary'
          }
        }
      },
      headers: {
        'Content-Type': {
          description: '圖片的 MIME 類型',
          schema: {
            type: 'string',
            example: 'image/jpeg'
          }
        },
        'Cache-Control': {
          description: '快取控制標頭',
          schema: {
            type: 'string',
            example: 'public, max-age=31536000'
          }
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  }
});

/**
 * POST /api/v1/images - 上傳單一圖片
 */
registry.registerPath({
  method: 'post',
  path: '/api/v1/images',
  tags: ['Images'],
  summary: '上傳單一圖片',
  description: '上傳一個圖片檔案到雲端儲存。支援 JPEG、PNG 和 WebP 格式，檔案大小限制為 500KB。',
  request: {
    body: {
      content: {
        'multipart/form-data': {
          schema: {
            type: 'object',
            required: ['file'],
            properties: {
              file: {
                type: 'string',
                format: 'binary',
                description: '要上傳的圖片檔案（JPEG、PNG 或 WebP 格式，最大 500KB）'
              }
            }
          }
        }
      }
    }
  },
  responses: {
    201: {
      description: '圖片上傳成功',
      content: {
        'application/json': {
          schema: uploadImageResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    413: {
      description: '檔案過大',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.null(),
            error: z.object({
              code: z.string(),
              message: z.string()
            })
          })
        }
      }
    },
    429: {
      description: '請求過於頻繁',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.null(),
            error: z.object({
              code: z.string(),
              message: z.string()
            })
          })
        }
      }
    },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * POST /api/v1/images/multiple - 上傳多個圖片
 */
registry.registerPath({
  method: 'post',
  path: '/api/v1/images/multiple',
  tags: ['Images'],
  summary: '上傳多個圖片',
  description: '批量上傳圖片檔案到雲端儲存。最多可同時上傳 5 個檔案，每個檔案支援 JPEG、PNG 和 WebP 格式，單檔大小限制為 500KB。',
  request: {
    body: {
      content: {
        'multipart/form-data': {
          schema: {
            type: 'object',
            required: ['files'],
            properties: {
              files: {
                type: 'array',
                items: {
                  type: 'string',
                  format: 'binary'
                },
                minItems: 1,
                maxItems: 5,
                description: '要上傳的圖片檔案陣列（最多 5 個，每個最大 500KB）'
              }
            }
          }
        }
      }
    }
  },
  responses: {
    201: {
      description: '圖片批量上傳成功',
      content: {
        'application/json': {
          schema: uploadMultipleImagesResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    413: {
      description: '檔案過大或總數過多',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.null(),
            error: z.object({
              code: z.string(),
              message: z.string()
            })
          })
        }
      }
    },
    429: {
      description: '請求過於頻繁',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.null(),
            error: z.object({
              code: z.string(),
              message: z.string()
            })
          })
        }
      }
    },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * DELETE /api/v1/images/:filename - 刪除圖片
 */
registry.registerPath({
  method: 'delete',
  path: '/api/v1/images/{filename}',
  tags: ['Images'],
  summary: '刪除圖片',
  description: '從雲端儲存中刪除指定的圖片檔案。需要身份驗證。',
  request: {
    params: filenameParamSchema
  },
  responses: {
    200: {
      description: '圖片刪除成功',
      content: {
        'application/json': {
          schema: deleteImageResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    404: { $ref: '#/components/responses/NotFoundError' },
    429: {
      description: '請求過於頻繁',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.null(),
            error: z.object({
              code: z.string(),
              message: z.string()
            })
          })
        }
      }
    },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

// ============================================================================
// Express 路由定義（實際的路由處理）
// ============================================================================

/**
 * GET /images/:filename
 * 獲取圖片
 * 路徑參數：filename - 圖片檔案名稱
 * 公開存取，無需身份驗證
 */
router.get('/:filename',
  imageController.getImage as RequestHandler
);

/**
 * POST /images
 * 上傳單一圖片
 * 請求體：multipart/form-data with 'file' field
 * 需要身份驗證和速率限制
 */
router.post('/',
  authenticate,
  uploadLimiter,
  upload.single('file'),
  imageController.uploadSingleImage as RequestHandler
);

/**
 * POST /images/multiple
 * 上傳多個圖片
 * 請求體：multipart/form-data with 'files' field (最多5個檔案)
 * 需要身份驗證和速率限制
 */
router.post('/multiple',
  authenticate,
  uploadLimiter,
  upload.array('files', 5),
  imageController.uploadMultipleImages as RequestHandler
);

/**
 * DELETE /images/:filename
 * 刪除圖片
 * 路徑參數：filename - 圖片檔案名稱
 * 需要身份驗證和速率限制
 */
router.delete('/:filename',
  authenticate,
  uploadLimiter,
  imageController.deleteImage as RequestHandler
);

export default router;
