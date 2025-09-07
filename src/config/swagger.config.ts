/**
 * Swagger 配置文件
 */

const swaggerOptions = {
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
  }
};

export const swaggerSpec = swaggerOptions.definition;
export default swaggerOptions;