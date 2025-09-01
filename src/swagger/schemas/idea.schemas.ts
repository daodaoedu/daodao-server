/**
 * @swagger
 * components:
 *   schemas:
 *     IdeaEntity:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: 想法 ID
 *           example: '550e8400-e29b-41d4-a716-446655440000'
 *         content:
 *           type: string
 *           description: 想法內容
 *           example: '今天學習了 React Hooks 的進階用法...'
 *         user:
 *           $ref: '#/components/schemas/UserBasicInfo'
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: 標籤
 *           example: ['React', '前端開發', '學習心得']
 *         likeCount:
 *           type: integer
 *           description: 點讚數
 *           example: 15
 *         commentCount:
 *           type: integer
 *           description: 評論數
 *           example: 3
 *         viewCount:
 *           type: integer
 *           description: 瀏覽數
 *           example: 120
 *         shareCount:
 *           type: integer
 *           description: 分享數
 *           example: 2
 *         hasResources:
 *           type: boolean
 *           description: 是否有關聯資源
 *           example: true
 *         resourceCount:
 *           type: integer
 *           description: 關聯資源數
 *           example: 2
 *         isLiked:
 *           type: boolean
 *           description: 當前使用者是否已點讚
 *           example: false
 *         isFavorited:
 *           type: boolean
 *           description: 當前使用者是否已收藏
 *           example: false
 *         status:
 *           type: string
 *           enum: [active, draft, archived]
 *           description: 想法狀態
 *           example: active
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 創建時間
 *           example: '2024-06-21T10:00:00Z'
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: 更新時間
 *           example: '2024-06-21T10:00:00Z'
 *       required:
 *         - id
 *         - content
 *         - user
 *         - tags
 *         - likeCount
 *         - commentCount
 *         - viewCount
 *         - shareCount
 *         - hasResources
 *         - resourceCount
 *         - status
 *         - createdAt
 *         - updatedAt
 *     IdeaResource:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           minLength: 1
 *           maxLength: 255
 *           description: 資源名稱
 *           example: 'TypeScript 官方文檔 - Generics'
 *         url:
 *           type: string
 *           format: uri
 *           description: 資源 URL
 *           example: 'https://www.typescriptlang.org/docs/handbook/2/generics.html'
 *         description:
 *           type: string
 *           description: 資源描述
 *           example: 'TypeScript 泛型的官方說明文檔'
 *       required:
 *         - name
 *         - url
 *
 *     CreateIdeaRequest:
 *       type: object
 *       properties:
 *         content:
 *           type: string
 *           minLength: 1
 *           maxLength: 5000
 *           description: 想法內容
 *           example: '今天學習了 TypeScript 的泛型，發現它能讓程式碼更有彈性和重用性。'
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *             minLength: 1
 *             maxLength: 50
 *           maxItems: 10
 *           description: 標籤
 *           example: ['TypeScript', '前端開發', '學習筆記']
 *         resources:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IdeaResource'
 *           maxItems: 5
 *           description: 關聯資源
 *       required:
 *         - content
 *
 *     UpdateIdeaRequest:
 *       type: object
 *       properties:
 *         content:
 *           type: string
 *           minLength: 1
 *           maxLength: 5000
 *           description: 想法內容
 *           example: '今天學習了 TypeScript 的泛型，發現它能讓程式碼更有彈性和重用性。補充：泛型在 React 組件中也很實用！'
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *             minLength: 1
 *             maxLength: 50
 *           maxItems: 10
 *           description: 標籤
 *           example: ['TypeScript', '前端開發', '學習筆記', 'React']
 *         status:
 *           type: string
 *           enum: [active, draft, archived]
 *           description: 想法狀態
 *           example: active
 *
 *     CreateIdeaResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/ApiSuccessResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 idea:
 *                   $ref: '#/components/schemas/IdeaEntity'
 *                 resources:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                         description: 資源 ID
 *                       name:
 *                         type: string
 *                         description: 資源名稱
 *                       url:
 *                         type: string
 *                         format: uri
 *                         description: 資源 URL
 *                       description:
 *                         type: string
 *                         description: 資源描述
 *                       status:
 *                         type: string
 *                         enum: [draft, active, archived]
 *                         description: 資源狀態
 *                       createdFromType:
 *                         type: string
 *                         enum: [idea]
 *                         description: 創建來源類型
 *                       createdFromId:
 *                         type: string
 *                         format: uuid
 *                         description: 創建來源 ID
 *                   description: 創建的關聯資源
 *               required:
 *                 - idea
 */