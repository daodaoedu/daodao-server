/**
 * @swagger
 * components:
 *   schemas:
 *     CommentCreateRequest:
 *       type: object
 *       required:
 *         - targetType
 *         - targetId
 *         - content
 *       properties:
 *         targetType:
 *           type: string
 *           enum: [post, resource, note, outcome, review, circle, idea, portfolio]
 *           description: 評論目標類型
 *           example: "post"
 *         targetId:
 *           type: string
 *           description: 目標實體 ID
 *           example: "123"
 *         content:
 *           type: string
 *           minLength: 1
 *           maxLength: 5000
 *           description: 評論內容
 *           example: "這是一個很有用的資源，謝謝分享！"
 *         visibility:
 *           type: string
 *           enum: [public, private]
 *           default: private
 *           description: 評論可見性
 *           example: "public"
 *         parentId:
 *           type: integer
 *           minimum: 1
 *           nullable: true
 *           description: 父評論 ID（用於回覆）
 *           example: 456
 *     
 *     CommentUpdateRequest:
 *       type: object
 *       properties:
 *         content:
 *           type: string
 *           minLength: 1
 *           maxLength: 5000
 *           description: 更新的評論內容
 *           example: "更新後的評論內容"
 *         visibility:
 *           type: string
 *           enum: [public, private]
 *           description: 更新的可見性設定
 *           example: "private"
 *     
 *     CommentUser:
 *       type: object
 *       required:
 *         - id
 *         - name
 *         - _id
 *         - roleList
 *       properties:
 *         id:
 *           type: integer
 *           description: 使用者 ID
 *           example: 1
 *         name:
 *           type: string
 *           description: 使用者名稱
 *           example: "張三"
 *         _id:
 *           type: string
 *           description: 使用者 UUID
 *           example: "507f1f77bcf86cd799439011"
 *         roleList:
 *           type: array
 *           description: 使用者角色列表
 *           items:
 *             type: string
 *           example: ["user", "participant"]
 *         photoURL:
 *           type: string
 *           nullable: true
 *           description: 使用者頭像 URL
 *           example: "https://example.com/avatar.jpg"
 *     
 *     CommentResponse:
 *       type: object
 *       required:
 *         - id
 *         - userId
 *         - targetId
 *         - targetType
 *         - content
 *         - visibility
 *         - createdAt
 *         - updatedAt
 *         - parentId
 *         - user
 *         - replies
 *       properties:
 *         id:
 *           type: integer
 *           description: 評論 ID
 *           example: 789
 *         userId:
 *           type: integer
 *           description: 評論作者 ID
 *           example: 1
 *         targetId:
 *           type: string
 *           description: 目標實體的外部 ID（UUID 或數字字串）
 *           example: "uuid-string-123"
 *         targetType:
 *           type: string
 *           enum: [post, resource, note, outcome, review, circle, idea, portfolio]
 *           description: 目標實體類型
 *           example: "resource"
 *         content:
 *           type: string
 *           description: 評論內容
 *           example: "這是一個很有用的資源，謝謝分享！"
 *         visibility:
 *           type: string
 *           enum: [public, private]
 *           description: 評論可見性
 *           example: "public"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 建立時間
 *           example: "2024-01-15T10:30:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: 更新時間
 *           example: "2024-01-15T10:30:00Z"
 *         parentId:
 *           type: integer
 *           nullable: true
 *           description: 父評論 ID
 *           example: null
 *         user:
 *           $ref: '#/components/schemas/CommentUser'
 *         replies:
 *           type: array
 *           description: 子評論列表
 *           items:
 *             $ref: '#/components/schemas/CommentResponse'
 *           example: []
 *     
 *     CommentListResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/ApiSuccessResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: array
 *               description: 評論列表
 *               items:
 *                 $ref: '#/components/schemas/CommentResponse'
 *     
 *     CommentDetailResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/ApiSuccessResponse'
 *         - type: object
 *           properties:
 *             data:
 *               $ref: '#/components/schemas/CommentResponse'
 *     
 *     CommentCreateResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/ApiSuccessResponse'
 *         - type: object
 *           properties:
 *             message:
 *               example: "評論建立成功"
 *             data:
 *               $ref: '#/components/schemas/CommentResponse'
 *     
 *     CommentUpdateResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/ApiSuccessResponse'
 *         - type: object
 *           properties:
 *             message:
 *               example: "評論更新成功"
 *             data:
 *               $ref: '#/components/schemas/CommentResponse'
 *     
 *     CommentDeleteResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/ApiSuccessResponse'
 *         - type: object
 *           properties:
 *             message:
 *               example: "評論刪除成功"
 */