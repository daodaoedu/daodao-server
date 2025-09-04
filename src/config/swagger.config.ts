/**
 * Swagger 配置文件
 */

interface SwaggerOptions {
  definition: any;
  apis: string[];
}

const swaggerOptions: SwaggerOptions = {
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
        description: '本機開發'
      },
      {
        url: 'https://server.daoedu.tw/',
        description: '開發環境'
      },
      {
        url: 'https://dao-server.daoedu.tw/',
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
            type: 'string',
            format: 'uuid'
          },
          description: '資源的唯一識別碼 (UUID)',
          example: '123e4567-e89b-12d3-a456-426614174000'
        },
        reviewIdParam: {
          in: 'path',
          name: 'id',
          required: true,
          schema: {
            type: 'string',
            pattern: '^[1-9]\\d*$'
          },
          description: '評論的唯一識別碼（字串格式的數字）',
          example: '1'
        },
        resourceIdParam: {
          in: 'path',
          name: 'resourceId',
          required: true,
          schema: {
            type: 'string',
            format: 'uuid'
          },
          description: '資源的唯一識別碼 (UUID)',
          example: '123e4567-e89b-12d3-a456-426614174000'
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
        resourceLimitParam: {
          in: 'query',
          name: 'limit',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 20,
            default: 5
          },
          description: '每頁返回的資源數'
        },
        reviewLimitParam: {
          in: 'query',
          name: 'limit',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 10,
            default: 2
          },
          description: '每頁返回的評論數'
        },
        sortParam: {
          in: 'query',
          name: 'sort',
          required: false,
          schema: {
            type: 'string',
            enum: ['id', 'name', 'created_at', 'updated_at']
          },
          description: '排序欄位'
        },
        orderParam: {
          in: 'query',
          name: 'order',
          required: false,
          schema: {
            type: 'string',
            enum: ['asc', 'desc'],
            default: 'desc'
          },
          description: '排序方向'
        },
        // 分頁參數（標準）
        pageParam: {
          in: 'query',
          name: 'page',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1
          },
          description: '頁數'
        },
        pageSizeParam: {
          in: 'query',
          name: 'pageSize',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 10
          },
          description: '每頁項目數'
        }
      },
      responses: {
        // 通用響應定義
        BadRequestError: {
          description: '請求參數錯誤',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ApiErrorResponse'
              }
            }
          }
        },
        UnauthorizedError: {
          description: '未授權，需要登入',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ApiErrorResponse'
              }
            }
          }
        },
        ForbiddenError: {
          description: '禁止訪問，權限不足',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ApiErrorResponse'
              }
            }
          }
        },
        NotFoundError: {
          description: '資源不存在',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ApiErrorResponse'
              }
            }
          }
        },
        ConflictError: {
          description: '資源衝突',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ApiErrorResponse'
              }
            }
          }
        },
        InternalServerError: {
          description: '服務器內部錯誤',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ApiErrorResponse'
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: '用戶認證相關操作',
        'x-order': 1
      },
      {
        name: 'Me',
        description: '個人資料相關操作',
        'x-order': 2
      },
      {
        name: 'Users',
        description: '用戶管理相關操作',
        'x-order': 3
      },
      {
        name: 'Ideas',
        description: '想法分享相關操作',
        'x-order': 4
      },
      {
        name: 'Practice',
        description: '實踐管理相關操作',
        'x-order': 5
      },
      {
        name: 'Practice Check-ins',
        description: '實踐簽到相關操作',
        'x-order': 6
      },
      {
        name: 'Practice Interactions',
        description: '實踐互動相關操作（點讚、收藏、分享等）',
        'x-order': 7
      },
      {
        name: 'Projects',
        description: '專案管理相關操作',
        'x-order': 8
      },
      {
        name: 'Milestones',
        description: '里程碑管理相關操作',
        'x-order': 9
      },
      {
        name: 'Notes',
        description: '便利貼相關操作',
        'x-order': 10
      },
      {
        name: 'Outcomes',
        description: '成果相關操作',
        'x-order': 11
      },
      {
        name: 'Reviews',
        description: '覆盤相關操作',
        'x-order': 12
      },
      {
        name: 'Mentor',
        description: '導師系統相關操作',
        'x-order': 13
      },
      {
        name: 'Resources',
        description: '資源管理相關操作',
        'x-order': 14
      },
      {
        name: 'Resource Reviews',
        description: '資源評價和心得相關操作',
        'x-order': 15
      },
      {
        name: 'Tags',
        description: '標籤管理相關操作',
        'x-order': 16
      },

      {
        name: 'Comments',
        description: '評論系統相關操作',
        'x-order': 17
      },

      {
        name: 'Email',
        description: '郵件服務相關操作',
        'x-order': 18
      },

      {
        name: 'Images',
        description: '圖片管理相關操作',
        'x-order': 19
      },
      {
        name: 'System',
        description: '系統狀態和資訊相關操作',
        'x-order': 20
      },
      {
        name: 'Database Info',
        description: '資料庫資訊查詢相關操作',
        'x-order': 21
      },
      {
        name: 'System Monitor',
        description: '系統監控相關操作',
        'x-order': 22
      }
    ]
  },
  apis: [
    './src/swagger/schemas/*.ts',
    './src/swagger/paths/*.ts'
  ]
};

export const swaggerSpec = swaggerOptions.definition;
export default swaggerOptions;