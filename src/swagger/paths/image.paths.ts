/**
 * @swagger
 * /api/v1/images/{filename}:
 *   get:
 *     tags: [Images]
 *     summary: 獲取圖片
 *     description: 根據檔案名稱獲取圖片檔案
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: 圖片檔案名稱
 *         example: image-123456789.jpg
 *     responses:
 *       200:
 *         description: 成功獲取圖片
 *         content:
 *           image/jpeg:
 *             schema:
 *               type: string
 *               format: binary
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 *           image/gif:
 *             schema:
 *               type: string
 *               format: binary
 *           image/webp:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: 圖片不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ImageErrorResponse'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 *   delete:
 *     tags: [Images]
 *     summary: 刪除圖片
 *     description: 刪除指定的圖片檔案（需要身份驗證和權限）
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: 要刪除的圖片檔案名稱
 *         example: image-123456789.jpg
 *     responses:
 *       200:
 *         description: 圖片刪除成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ImageDeleteResponse'
 *       400:
 *         description: 請求參數錯誤
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ImageErrorResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: 權限不足（只能刪除自己上傳的圖片）
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ImageErrorResponse'
 *       404:
 *         description: 圖片不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ImageErrorResponse'
 *       429:
 *         description: 請求過於頻繁
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 * /api/v1/images:
 *   post:
 *     tags: [Images]
 *     summary: 上傳單一圖片
 *     description: |
 *       上傳一張圖片到伺服器
 *       
 *       **支援的格式：** JPG, JPEG, PNG, GIF, WebP
 *       
 *       **檔案大小限制：** 5MB
 *       
 *       **速率限制：** 每分鐘最多60次請求
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: 要上傳的圖片檔案
 *           encoding:
 *             file:
 *               contentType: image/jpeg, image/png, image/gif, image/webp
 *     responses:
 *       201:
 *         description: 圖片上傳成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ImageUploadResponse'
 *       400:
 *         description: 請求錯誤（檔案格式不支援、檔案過大等）
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ImageErrorResponse'
 *             examples:
 *               invalidFileType:
 *                 summary: 檔案格式不支援
 *                 value:
 *                   success: false
 *                   message: 檔案格式不支援
 *                   error:
 *                     code: INVALID_FILE_TYPE
 *                     details: 支援的圖片格式：JPG, JPEG, PNG, GIF, WebP
 *                     allowedTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"]
 *               fileTooLarge:
 *                 summary: 檔案過大
 *                 value:
 *                   success: false
 *                   message: 檔案大小超過限制
 *                   error:
 *                     code: FILE_TOO_LARGE
 *                     details: 檔案大小不能超過 5MB
 *                     maxFileSize: 5242880
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       429:
 *         description: 請求過於頻繁
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: 請求過於頻繁，請稍後再試
 *                 retryAfter:
 *                   type: integer
 *                   description: 建議重試等待時間（秒）
 *                   example: 60
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 * /api/v1/images/multiple:
 *   post:
 *     tags: [Images]
 *     summary: 批量上傳圖片
 *     description: |
 *       一次上傳多張圖片到伺服器
 *       
 *       **支援的格式：** JPG, JPEG, PNG, GIF, WebP
 *       
 *       **檔案數量限制：** 最多5張圖片
 *       
 *       **單檔大小限制：** 5MB
 *       
 *       **速率限制：** 每分鐘最多60次請求
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - files
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 minItems: 1
 *                 maxItems: 5
 *                 description: 要上傳的圖片檔案列表（最多5個）
 *           encoding:
 *             files:
 *               contentType: image/jpeg, image/png, image/gif, image/webp
 *     responses:
 *       201:
 *         description: 批量上傳完成（可能部分成功、部分失敗）
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MultipleImageUploadResponse'
 *             examples:
 *               allSuccess:
 *                 summary: 全部上傳成功
 *                 value:
 *                   success: true
 *                   message: 圖片批量上傳成功
 *                   data:
 *                     uploaded:
 *                       - filename: image-123456789.jpg
 *                         originalName: photo1.jpg
 *                         size: 524288
 *                         mimeType: image/jpeg
 *                         url: https://example.com/api/v1/images/image-123456789.jpg
 *                       - filename: image-987654321.png
 *                         originalName: screenshot.png
 *                         size: 1048576
 *                         mimeType: image/png
 *                         url: https://example.com/api/v1/images/image-987654321.png
 *                     failed: []
 *                     totalUploaded: 2
 *                     totalFailed: 0
 *                     uploadedAt: 2024-04-01T12:00:00Z
 *                     uploadedBy: user-abc123
 *               partialSuccess:
 *                 summary: 部分上傳成功
 *                 value:
 *                   success: true
 *                   message: 圖片批量上傳完成，部分檔案失敗
 *                   data:
 *                     uploaded:
 *                       - filename: image-123456789.jpg
 *                         originalName: photo1.jpg
 *                         size: 524288
 *                         mimeType: image/jpeg
 *                         url: https://example.com/api/v1/images/image-123456789.jpg
 *                     failed:
 *                       - originalName: invalid-file.txt
 *                         error: 不支援的檔案格式
 *                     totalUploaded: 1
 *                     totalFailed: 1
 *                     uploadedAt: 2024-04-01T12:00:00Z
 *                     uploadedBy: user-abc123
 *       400:
 *         description: 請求錯誤
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ImageErrorResponse'
 *             examples:
 *               noFiles:
 *                 summary: 沒有提供檔案
 *                 value:
 *                   success: false
 *                   message: 請選擇要上傳的檔案
 *                   error:
 *                     code: NO_FILES_PROVIDED
 *                     details: 至少需要上傳一個檔案
 *               tooManyFiles:
 *                 summary: 檔案數量超過限制
 *                 value:
 *                   success: false
 *                   message: 上傳檔案數量超過限制
 *                   error:
 *                     code: TOO_MANY_FILES
 *                     details: 最多可上傳5個檔案
 *                     maxFiles: 5
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       429:
 *         description: 請求過於頻繁
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: 請求過於頻繁，請稍後再試
 *                 retryAfter:
 *                   type: integer
 *                   description: 建議重試等待時間（秒）
 *                   example: 60
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */