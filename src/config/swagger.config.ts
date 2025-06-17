/**
 * Swagger 配置文件
 */

import swaggerJsdoc from 'swagger-jsdoc';

const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'DaoDao 資源管理 API',
      version: '1.0.0',
      description: '提供資源管理、心得評價和標籤功能的 RESTful API',
      contact: {
        name: 'DaoDao 開發團隊',
        email: 'support@daodao.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: '開發環境'
      },
      {
        url: 'https://api.daodao.com',
        description: '生產環境'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: '使用 JWT Token 進行身份驗證'
        }
      },
      parameters: {
        // 通用參數定義
        idParam: {
          in: 'path',
          name: 'id',
          required: true,
          schema: {
            type: 'integer',
            minimum: 1
          },
          description: '資源或項目的唯一識別碼'
        },
        resourceIdParam: {
          in: 'path',
          name: 'resourceId',
          required: true,
          schema: {
            type: 'integer',
            minimum: 1
          },
          description: '資源的唯一識別碼'
        },
        // 分頁參數
        cursorParam: {
          in: 'query',
          name: 'cursor',
          required: false,
          schema: {
            type: 'string'
          },
          description: '游標，用於游標分頁'
        },
        limitParam: {
          in: 'query',
          name: 'limit',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 20
          },
          description: '每頁返回的記錄數'
        },
        sortFieldParam: {
          in: 'query',
          name: 'sortField',
          required: false,
          schema: {
            type: 'string',
            enum: ['id', 'name', 'created_at', 'updated_at']
          },
          description: '排序欄位'
        },
        sortDirectionParam: {
          in: 'query',
          name: 'sortDirection',
          required: false,
          schema: {
            type: 'string',
            enum: ['asc', 'desc'],
            default: 'desc'
          },
          description: '排序方向'
        }
      },
      responses: {
        // 通用響應定義
        BadRequest: {
          description: '請求參數錯誤',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        Unauthorized: {
          description: '未授權，需要登入',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        Forbidden: {
          description: '禁止訪問，權限不足',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        NotFound: {
          description: '資源不存在',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        InternalServerError: {
          description: '服務器內部錯誤',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'System',
        description: '系統狀態和資訊相關操作',
        'x-order': 1
      },
      {
        name: 'Resources',
        description: '資源管理和評價相關操作',
        'x-order': 2
      },
      {
        name: 'Tags',
        description: '標籤管理相關操作',
        'x-order': 3
      }
    ]
  },
  apis: [
    './src/routes/*.ts',
    './src/swagger/schemas/*.ts',
    './src/swagger/paths/*.ts'
  ]
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);
export default swaggerOptions;