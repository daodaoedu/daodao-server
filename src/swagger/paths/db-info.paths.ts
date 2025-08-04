/**
 * @swagger
 * /api/v1/db-info:
 *   get:
 *     summary: 取得資料庫結構資訊
 *     description: 返回 MongoDB 和 PostgreSQL 的資料庫結構資訊
 *     tags: [Database Info]
 *     responses:
 *       200:
 *         description: 成功取得資料庫資訊
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mongo:
 *                   type: object
 *                   additionalProperties:
 *                     type: object
 *                     properties:
 *                       fields:
 *                         type: array
 *                         items:
 *                           type: string
 *                         description: 集合欄位列表
 *                   description: MongoDB 集合資訊
 *                 postgres:
 *                   type: object
 *                   additionalProperties:
 *                     type: object
 *                     properties:
 *                       columns:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             column_name:
 *                               type: string
 *                               description: 欄位名稱
 *                             data_type:
 *                               type: string
 *                               description: 資料類型
 *                   description: PostgreSQL 表格資訊
 *             example:
 *               mongo:
 *                 users:
 *                   fields: ["_id", "email", "createdAt", "updatedAt"]
 *                 resources:
 *                   fields: ["_id", "title", "type", "tags", "createdAt"]
 *               postgres:
 *                 users:
 *                   columns:
 *                     - column_name: "user_id"
 *                       data_type: "uuid"
 *                     - column_name: "email"
 *                       data_type: "character varying"
 *                 projects:
 *                   columns:
 *                     - column_name: "project_id"
 *                       data_type: "uuid"
 *                     - column_name: "name"
 *                       data_type: "character varying"
 *       500:
 *         description: 伺服器錯誤
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */