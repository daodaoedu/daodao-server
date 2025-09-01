/**
 * @swagger
 * components:
 *   schemas:
 *     ImageUploadResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/ApiSuccessResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 filename:
 *                   type: string
 *                   description: 上傳後的檔案名稱
 *                   example: image-123456789.jpg
 *                 originalName:
 *                   type: string
 *                   description: 原始檔案名稱
 *                   example: my-photo.jpg
 *                 size:
 *                   type: integer
 *                   description: 檔案大小（位元組）
 *                   example: 524288
 *                 mimeType:
 *                   type: string
 *                   description: MIME 類型
 *                   example: image/jpeg
 *                 url:
 *                   type: string
 *                   format: uri
 *                   description: 圖片存取URL
 *                   example: https://example.com/api/v1/images/image-123456789.jpg
 *                 uploadedAt:
 *                   type: string
 *                   format: date-time
 *                   description: 上傳時間
 *                   example: 2024-04-01T12:00:00Z
 *                 uploadedBy:
 *                   type: string
 *                   description: 上傳者用戶ID
 *                   example: user-abc123
 *
 *     MultipleImageUploadResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/ApiSuccessResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *             uploaded:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   filename:
 *                     type: string
 *                     description: 上傳後的檔案名稱
 *                     example: image-123456789.jpg
 *                   originalName:
 *                     type: string
 *                     description: 原始檔案名稱
 *                     example: photo1.jpg
 *                   size:
 *                     type: integer
 *                     description: 檔案大小（位元組）
 *                     example: 524288
 *                   mimeType:
 *                     type: string
 *                     description: MIME 類型
 *                     example: image/jpeg
 *                   url:
 *                     type: string
 *                     format: uri
 *                     description: 圖片存取URL
 *                     example: https://example.com/api/v1/images/image-123456789.jpg
 *               description: 成功上傳的圖片列表
 *             failed:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   originalName:
 *                     type: string
 *                     example: invalid-file.txt
 *                   error:
 *                     type: string
 *                     example: 不支援的檔案格式
 *               description: 上傳失敗的檔案列表
 *             totalUploaded:
 *               type: integer
 *               description: 成功上傳的檔案數量
 *               example: 3
 *             totalFailed:
 *               type: integer
 *               description: 上傳失敗的檔案數量
 *               example: 1
 *             uploadedAt:
 *               type: string
 *               format: date-time
 *               description: 上傳時間
 *               example: 2024-04-01T12:00:00Z
 *             uploadedBy:
 *               type: string
 *               description: 上傳者用戶ID
 *               example: user-abc123
 *
 *     ImageDeleteResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/ApiSuccessResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *             filename:
 *               type: string
 *               description: 已刪除的檔案名稱
 *               example: image-123456789.jpg
 *             deletedAt:
 *               type: string
 *               format: date-time
 *               description: 刪除時間
 *               example: 2024-04-01T12:30:00Z
 *             deletedBy:
 *               type: string
 *               description: 刪除者用戶ID
 *               example: user-abc123
 *
 *     ImageErrorResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/ApiErrorResponse'
 *         - type: object
 *           properties:
 *             error:
 *               type: object
 *               properties:
 *             code:
 *               type: string
 *               enum: [INVALID_FILE_TYPE, FILE_TOO_LARGE, FILE_NOT_FOUND, UPLOAD_FAILED, DELETE_FAILED, PERMISSION_DENIED]
 *               example: INVALID_FILE_TYPE
 *             details:
 *               type: string
 *               example: 支援的圖片格式：JPG, JPEG, PNG, GIF, WebP
 *             allowedTypes:
 *               type: array
 *               items:
 *                 type: string
 *               example: ["image/jpeg", "image/png", "image/gif", "image/webp"]
 *               description: 支援的檔案類型
 *             maxFileSize:
 *               type: integer
 *               example: 5242880
 *               description: 最大檔案大小（位元組）
 *             maxFiles:
 *               type: integer
 *               example: 5
 *               description: 批量上傳最大檔案數量
 */