/**
 * OpenAPI Registry 配置
 * 使用 @asteasolutions/zod-to-openapi 管理 OpenAPI schemas
 */

import { OpenAPIRegistry, OpenApiGeneratorV3, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

// 擴展 Zod 以支援 .openapi() 方法
extendZodWithOpenApi(z);

/**
 * 全域 OpenAPI Registry 實例
 * 用於註冊所有的 schemas 和 routes
 */
export const registry = new OpenAPIRegistry();

/**
 * OpenAPI 基本配置
 */
export const openApiConfig = {
  openapi: '3.0.0' as const,
  info: {
    title: 'DaoDao 資源管理 API',
    version: '1.0.0',
    description: '提供資源管理、心得評價和標籤功能的 RESTful API',
    contact: {
      name: 'DaoDao 開發團隊',
      email: 'contact@daodao.so'
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
      url: 'https://server-dev.daodao.so/',
      description: '開發環境'
    },
    {
      url: 'https://server.daodao.so/',
      description: '生產環境'
    }
  ]
};

/**
 * Security Schemes 定義
 */
registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: '使用 JWT Token 進行身份驗證'
});

/**
 * 註冊通用錯誤回應
 */
export function registerCommonResponses(): void {
  // 400 Bad Request
  registry.registerComponent('responses', 'BadRequestError', {
    description: '請求參數錯誤',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            data: { type: 'null' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'VALIDATION_ERROR' },
                message: { type: 'string', example: '輸入資料驗證失敗' },
                details: {
                  type: 'object',
                  additionalProperties: { type: 'string' }
                }
              }
            },
            timestamp: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  });

  // 401 Unauthorized
  registry.registerComponent('responses', 'UnauthorizedError', {
    description: '未授權，需要登入',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            data: { type: 'null' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'UNAUTHORIZED' },
                message: { type: 'string', example: '未授權存取' }
              }
            },
            timestamp: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  });

  // 403 Forbidden
  registry.registerComponent('responses', 'ForbiddenError', {
    description: '權限不足',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            data: { type: 'null' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'FORBIDDEN' },
                message: { type: 'string', example: '權限不足' }
              }
            },
            timestamp: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  });

  // 404 Not Found
  registry.registerComponent('responses', 'NotFoundError', {
    description: '資源不存在',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            data: { type: 'null' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'NOT_FOUND' },
                message: { type: 'string', example: '資源不存在' }
              }
            },
            timestamp: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  });

  // 500 Internal Server Error
  registry.registerComponent('responses', 'InternalServerError', {
    description: '服務器內部錯誤',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            data: { type: 'null' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'INTERNAL_SERVER_ERROR' },
                message: { type: 'string', example: '服務器內部錯誤' }
              }
            },
            timestamp: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  });
}

/**
 * 生成 OpenAPI 文檔（並同步寫入實體檔案）
 */
export function generateOpenApiDocument(): ReturnType<OpenApiGeneratorV3['generateDocument']> {
  // 註冊通用錯誤回應
  registerCommonResponses();

  // 使用 OpenApiGeneratorV3 生成文檔
  const generator = new OpenApiGeneratorV3(registry.definitions);

  const document = generator.generateDocument(openApiConfig);

  // 添加標籤定義
  document.tags = [
    { name: 'Authentication', description: '用戶認證相關操作', 'x-order': 1 },
    { name: 'Me', description: '個人資料相關操作', 'x-order': 2 },
    { name: 'Users', description: '用戶管理相關操作', 'x-order': 3 },
    { name: 'Ideas', description: '想法分享相關操作', 'x-order': 4 },
    { name: 'Practice', description: '實踐管理相關操作', 'x-order': 5 },
    { name: 'Practice Check-ins', description: '實踐簽到相關操作', 'x-order': 6 },
    { name: 'Practice Interactions', description: '實踐互動相關操作（點讚、收藏、分享等）', 'x-order': 7 },
    { name: 'Projects', description: '專案管理相關操作', 'x-order': 8 },
    { name: 'Quiz', description: '測驗管理相關操作', 'x-order': 9 },
    { name: 'Milestones', description: '里程碑管理相關操作', 'x-order': 10 },
    { name: 'Notes', description: '便利貼相關操作', 'x-order': 11 },
    { name: 'Outcomes', description: '成果相關操作', 'x-order': 12 },
    { name: 'Reviews', description: '覆盤相關操作', 'x-order': 13 },
    { name: 'Mentor', description: '導師系統相關操作', 'x-order': 14 },
    { name: 'Resources', description: '資源管理相關操作', 'x-order': 15 },
    { name: 'Resource Reviews', description: '資源評價和心得相關操作', 'x-order': 16 },
    { name: 'Tags', description: '標籤管理相關操作', 'x-order': 17 },
    { name: 'Comments', description: '評論系統相關操作', 'x-order': 18 },
    { name: 'Email', description: '郵件服務相關操作', 'x-order': 19 },
    { name: 'Images', description: '圖片管理相關操作', 'x-order': 20 },
    { name: 'System', description: '系統狀態和資訊相關操作', 'x-order': 21 },
    { name: 'Database Info', description: '資料庫資訊查詢相關操作', 'x-order': 22 },
    { name: 'System Monitor', description: '系統監控相關操作', 'x-order': 23 }
  ];

  // 同步寫入實體檔案
  try {
    const outputDir = path.join(process.cwd());
    const jsonPath = path.join(outputDir, 'openapi.json');
    const yamlPath = path.join(outputDir, 'openapi.yaml');

    // 寫入 JSON
    fs.writeFileSync(
      jsonPath,
      JSON.stringify(document, null, 2),
      'utf-8'
    );

    // 寫入 YAML
    fs.writeFileSync(
      yamlPath,
      yaml.dump(document, { indent: 2, lineWidth: -1 }),
      'utf-8'
    );

    console.log('  📄 OpenAPI 檔案已同步更新: openapi.json, openapi.yaml');
  } catch (error) {
    console.error('  ⚠️  OpenAPI 檔案寫入失敗:', error);
    // 不中斷應用啟動
  }

  return document;
}

/**
 * 輔助函數：註冊帶有標準回應的路徑
 */
export function registerPathWithStandardResponses(config: {
  method: 'get' | 'post' | 'put' | 'patch' | 'delete';
  path: string;
  tags: string[];
  summary: string;
  description?: string;
  request?: Record<string, unknown>;
  responses: Record<string, unknown>;
  security?: Array<{ [key: string]: string[] }>;
}): void {
  const { responses, ...rest } = config;

  // 添加標準錯誤回應
  const allResponses = {
    ...responses,
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  };

  registry.registerPath({
    ...rest,
    responses: allResponses
  });
}
