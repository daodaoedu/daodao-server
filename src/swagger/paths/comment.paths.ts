/**
 * @swagger
 * /api/v1/comments:
 *   post:
 *     summary: 建立評論
 *     description: 為指定的目標實體建立新評論，支援回覆功能
 *     tags: [Comments]
 *     security:
 *       - BearerAuth: []
 *       - SessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CommentCreateRequest'
 *           examples:
 *             createRootComment:
 *               summary: 建立根評論
 *               value:
 *                 targetType: "post"
 *                 targetId: "123"
 *                 content: "這是一個很有用的資源，謝謝分享！"
 *                 visibility: "public"
 *             createReply:
 *               summary: 建立回覆評論（資源使用 UUID）
 *               value:
 *                 targetType: "resource"
 *                 targetId: "uuid-abc-123-def-456"
 *                 content: "我同意你的觀點，這確實很有幫助。"
 *                 visibility: "private"
 *                 parentId: 789
 *             createCircleComment:
 *               summary: 建立圈子評論（使用 UUID）
 *               value:
 *                 targetType: "circle"
 *                 targetId: "uuid-circle-789-ghi-012"
 *                 content: "這個圈子的討論很有意思！"
 *                 visibility: "public"
 *     responses:
 *       201:
 *         description: 評論建立成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CommentCreateResponse'
 *             example:
 *               success: true
 *               message: "評論建立成功"
 *               data:
 *                 id: 789
 *                 userId: 1
 *                 targetId: "123"
 *                 targetType: "post"
 *                 content: "這是一個很有用的資源，謝謝分享！"
 *                 visibility: "public"
 *                 createdAt: "2024-01-15T10:30:00Z"
 *                 updatedAt: "2024-01-15T10:30:00Z"
 *                 parent_id: null
 *                 user:
 *                   id: 1
 *                   name: "張三"
 *                   _id: "507f1f77bcf86cd799439011"
 *                   roleList: ["user"]
 *                   photoURL: "https://example.com/avatar.jpg"
 *                 replies: []
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: 目標實體或父評論不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *             example:
 *               success: false
 *               message: "目標實體不存在"
 *               error: "TARGET_NOT_FOUND"
 *       409:
 *         description: 業務邏輯衝突（如父評論不屬於同一目標）
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *             example:
 *               success: false
 *               message: "父評論必須屬於同一目標實體"
 *               error: "INVALID_PARENT_COMMENT"
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   
 *   get:
 *     summary: 獲取評論列表
 *     description: 根據目標類型和 ID 獲取評論列表，包含嵌套回覆結構
 *     tags: [Comments]
 *     parameters:
 *       - in: query
 *         name: targetType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [post, resource, note, outcome, review, circle, idea, portfolio]
 *         description: 目標實體類型
 *         example: "post"
 *       - in: query
 *         name: targetId
 *         required: true
 *         schema:
 *           type: string
 *         description: 目標實體 ID
 *         example: "123"
 *     responses:
 *       200:
 *         description: 成功獲取評論列表
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CommentListResponse'
 *             example:
 *               success: true
 *               data:
 *                 - id: 789
 *                   userId: 1
 *                   targetId: "123"
 *                   targetType: "post"
 *                   content: "這是一個根評論"
 *                   visibility: "public"
 *                   createdAt: "2024-01-15T10:30:00Z"
 *                   updatedAt: "2024-01-15T10:30:00Z"
 *                   parent_id: null
 *                   user:
 *                     id: 1
 *                     name: "張三"
 *                     _id: "507f1f77bcf86cd799439011"
 *                     roleList: ["user"]
 *                     photoURL: "https://example.com/avatar.jpg"
 *                   replies:
 *                     - id: 790
 *                       userId: 2
 *                       targetId: "123"
 *                       targetType: "post"
 *                       content: "這是一個回覆"
 *                       visibility: "public"
 *                       createdAt: "2024-01-15T11:00:00Z"
 *                       updatedAt: "2024-01-15T11:00:00Z"
 *                       parent_id: 789
 *                       user:
 *                         id: 2
 *                         name: "李四"
 *                         _id: "507f1f77bcf86cd799439012"
 *                         roleList: ["user"]
 *                         photoURL: null
 *                       replies: []
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       404:
 *         description: 目標實體不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *             example:
 *               success: false
 *               message: "目標實體不存在"
 *               error: "TARGET_NOT_FOUND"
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /api/v1/comments/{commentId}:
 *   get:
 *     summary: 獲取評論詳情
 *     description: 根據評論 ID 獲取單個評論的詳細資訊，包含回覆
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: 評論 ID
 *         example: 789
 *     responses:
 *       200:
 *         description: 成功獲取評論詳情
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CommentDetailResponse'
 *             example:
 *               success: true
 *               data:
 *                 id: 789
 *                 userId: 1
 *                 targetId: "uuid-string-123"
 *                 targetType: "resource"
 *                 content: "這是評論內容"
 *                 visibility: "public"
 *                 createdAt: "2024-01-15T10:30:00Z"
 *                 updatedAt: "2024-01-15T10:30:00Z"
 *                 parent_id: null
 *                 user:
 *                   id: 1
 *                   name: "張三"
 *                   _id: "507f1f77bcf86cd799439011"
 *                   roleList: ["user"]
 *                   photoURL: "https://example.com/avatar.jpg"
 *                 replies: []
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       403:
 *         description: 無權限查看此評論
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *             example:
 *               success: false
 *               message: "無權限查看此評論"
 *               error: "PERMISSION_DENIED"
 *       404:
 *         description: 評論不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *             example:
 *               success: false
 *               message: "評論不存在"
 *               error: "COMMENT_NOT_FOUND"
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   
 *   put:
 *     summary: 更新評論
 *     description: 更新指定評論的內容或可見性設定，僅評論作者可操作
 *     tags: [Comments]
 *     security:
 *       - BearerAuth: []
 *       - SessionAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: 評論 ID
 *         example: 789
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CommentUpdateRequest'
 *           examples:
 *             updateContent:
 *               summary: 更新評論內容
 *               value:
 *                 content: "更新後的評論內容"
 *             updateVisibility:
 *               summary: 更新可見性
 *               value:
 *                 visibility: "private"
 *             updateBoth:
 *               summary: 同時更新內容和可見性
 *               value:
 *                 content: "更新後的評論內容"
 *                 visibility: "public"
 *     responses:
 *       200:
 *         description: 評論更新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CommentUpdateResponse'
 *             example:
 *               success: true
 *               message: "評論更新成功"
 *               data:
 *                 id: 789
 *                 userId: 1
 *                 targetId: "456"
 *                 targetType: "idea"
 *                 content: "更新後的評論內容"
 *                 visibility: "public"
 *                 createdAt: "2024-01-15T10:30:00Z"
 *                 updatedAt: "2024-01-15T12:00:00Z"
 *                 parent_id: null
 *                 user:
 *                   id: 1
 *                   name: "張三"
 *                   _id: "507f1f77bcf86cd799439011"
 *                   roleList: ["user"]
 *                   photoURL: "https://example.com/avatar.jpg"
 *                 replies: []
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: 無權限編輯此評論
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *             example:
 *               success: false
 *               message: "只有評論作者可以編輯評論"
 *               error: "PERMISSION_DENIED"
 *       404:
 *         description: 評論不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *             example:
 *               success: false
 *               message: "評論不存在"
 *               error: "COMMENT_NOT_FOUND"
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   
 *   delete:
 *     summary: 刪除評論
 *     description: 刪除指定的評論，僅評論作者可操作。刪除父評論時會同時刪除所有子評論
 *     tags: [Comments]
 *     security:
 *       - BearerAuth: []
 *       - SessionAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: 評論 ID
 *         example: 789
 *     responses:
 *       200:
 *         description: 評論刪除成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CommentDeleteResponse'
 *             example:
 *               success: true
 *               message: "評論刪除成功"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: 無權限刪除此評論
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *             example:
 *               success: false
 *               message: "只有評論作者可以刪除評論"
 *               error: "PERMISSION_DENIED"
 *       404:
 *         description: 評論不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *             example:
 *               success: false
 *               message: "評論不存在"
 *               error: "COMMENT_NOT_FOUND"
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */