/**
 * @swagger
 * components:
 *   schemas:
 *     SystemInfo:
 *       type: object
 *       properties:
 *         hostname:
 *           type: string
 *         platform:
 *           type: string
 *         arch:
 *           type: string
 *         uptime:
 *           type: number
 *         loadAverage:
 *           type: array
 *           items:
 *             type: number
 *         totalMemory:
 *           type: number
 *         freeMemory:
 *           type: number
 *         release:
 *           type: string
 *         type:
 *           type: string
 *         userInfo:
 *           type: object
 *         cpus:
 *           type: array
 *           items:
 *             type: object
 *         networkInterfaces:
 *           type: object
 *         processMemory:
 *           type: object
 *         processId:
 *           type: number
 *         processTitle:
 *           type: string
 *         processArgs:
 *           type: array
 *           items:
 *             type: string
 * 
 *     MongoInfo:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *         database:
 *           type: string
 *         collections:
 *           type: array
 *           items:
 *             type: object
 *         error:
 *           type: string
 *         details:
 *           type: string
 * 
 *     PostgresInfo:
 *       type: object
 *       properties:
 *         version:
 *           type: string
 *         current_connections:
 *           type: number
 *         max_connections:
 *           type: number
 *         database_size:
 *           type: string
 *         start_time:
 *           type: string
 *           format: date-time
 *         config:
 *           type: object
 *           additionalProperties:
 *             type: string
 *         tables:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               table_name:
 *                 type: string
 *               size:
 *                 type: string
 *               row_count:
 *                 type: number
 *         error:
 *           type: string
 *         details:
 *           type: string
 * 
 *     DiskInfo:
 *       type: object
 *       properties:
 *         filesystem:
 *           type: string
 *         type:
 *           type: string
 *         size:
 *           type: number
 *         used:
 *           type: number
 *         available:
 *           type: number
 *         use:
 *           type: number
 *         mount:
 *           type: string
 * 
 *     MonitorResponse:
 *       type: object
 *       properties:
 *         system:
 *           $ref: '#/components/schemas/SystemInfo'
 *         mongo:
 *           $ref: '#/components/schemas/MongoInfo'
 *         postgres:
 *           $ref: '#/components/schemas/PostgresInfo'
 *         disk:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/DiskInfo'
 */