/**
 * @swagger
 * components:
 *   schemas:
 *     EntityType:
 *       type: string
 *       enum: [resource, resourceReview]
 *       description: 實體類型
 *       example: resource
 *     
 *     Tag:
 *       allOf:
 *         - $ref: '#/components/schemas/Timestamps'
 *         - type: object
 *           required:
 *             - id
 *             - name
 *           properties:
 *             id:
 *               type: integer
 *               description: 標籤唯一識別碼
 *               example: 1
 *             name:
 *               type: string
 *               maxLength: 100
 *               description: 標籤名稱
 *               example: "JavaScript"
 *     
 *     CreateEntityTagDto:
 *       type: object
 *       required:
 *         - entityId
 *         - entityType
 *         - tagName
 *       properties:
 *         entityId:
 *           type: integer
 *           minimum: 1
 *           description: 實體 ID
 *           example: 1
 *         entityType:
 *           $ref: '#/components/schemas/EntityType'
 *         tagName:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *           description: 標籤名稱
 *           example: "實用"
 *     
 *     RemoveEntityTagDto:
 *       type: object
 *       required:
 *         - entityId
 *         - entityType
 *         - tagName
 *       properties:
 *         entityId:
 *           type: integer
 *           minimum: 1
 *           description: 實體 ID
 *           example: 1
 *         entityType:
 *           $ref: '#/components/schemas/EntityType'
 *         tagName:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *           description: 標籤名稱
 *           example: "實用"
 *     
 *     PopularTag:
 *       allOf:
 *         - $ref: '#/components/schemas/Tag'
 *         - type: object
 *           required:
 *             - count
 *           properties:
 *             count:
 *               type: integer
 *               description: 標籤使用次數
 *               example: 25
 *     
 *     TagStats:
 *       type: object
 *       required:
 *         - entityType
 *         - count
 *         - uniqueTags
 *       properties:
 *         entityType:
 *           $ref: '#/components/schemas/EntityType'
 *         count:
 *           type: integer
 *           description: 總標籤使用次數
 *           example: 150
 *         uniqueTags:
 *           type: integer
 *           description: 獨特標籤數量
 *           example: 45
 *     
 *     PopularTagsResponse:
 *       type: object
 *       required:
 *         - success
 *         - data
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/PopularTag'
 *     
 *     TagSearchResponse:
 *       type: object
 *       required:
 *         - success
 *         - data
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Tag'
 *     
 *     TagStatsResponse:
 *       type: object
 *       required:
 *         - success
 *         - data
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/TagStats'
 *     
 *     EntityTagsResponse:
 *       type: object
 *       required:
 *         - success
 *         - data
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Tag'
 *     
 *     TagResponse:
 *       type: object
 *       required:
 *         - success
 *         - data
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           $ref: '#/components/schemas/Tag'
 */