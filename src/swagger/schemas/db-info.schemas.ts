/**
 * @swagger
 * components:
 *   schemas:
 *     DatabaseColumn:
 *       type: object
 *       properties:
 *         columnName:
 *           type: string
 *           description: 欄位名稱
 *         dataType:
 *           type: string
 *           description: 資料類型
 *       required:
 *         - columnName
 *         - dataType
 * 
 *     PostgresTableInfo:
 *       type: object
 *       properties:
 *         columns:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/DatabaseColumn'
 *           description: 表格欄位資訊
 *       required:
 *         - columns
 * 
 *     MongoCollectionInfo:
 *       type: object
 *       properties:
 *         fields:
 *           type: array
 *           items:
 *             type: string
 *           description: 集合欄位列表
 *       required:
 *         - fields
 * 
 *     DatabaseInfoResponse:
 *       type: object
 *       properties:
 *         mongo:
 *           oneOf:
 *             - type: object
 *               additionalProperties:
 *                 $ref: '#/components/schemas/MongoCollectionInfo'
 *             - type: object
 *               properties:
 *                 error:
 *                   type: string
 *           description: MongoDB 資料庫資訊或錯誤訊息
 *         postgres:
 *           oneOf:
 *             - type: object
 *               additionalProperties:
 *                 $ref: '#/components/schemas/PostgresTableInfo'
 *             - type: object
 *               properties:
 *                 error:
 *                   type: string
 *           description: PostgreSQL 資料庫資訊或錯誤訊息
 *       required:
 *         - mongo
 *         - postgres
 */