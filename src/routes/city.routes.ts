/**
 * 城市路由
 * 處理城市相關的路由定義
 */

import { Router } from 'express';
import { registry } from '../config/openapi-registry';
import {
  getCities,
  getCountries,
  validateCity
} from '../controllers/city.controller';
import { validate } from '../middleware/validation.middleware';
import {
  getCitiesQuerySchema,
  getCitiesApiResponseSchema,
  getCountriesApiResponseSchema,
  cityDataSchema,
  countryDataSchema
} from '../validators/city.validators';
import { z } from 'zod';

const router = Router();

// ============================================================================
// OpenAPI 路由定義（使用 registry.registerPath）
// ============================================================================

/**
 * GET /api/v1/cities - 取得城市列表
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/cities',
  tags: ['Cities'],
  summary: '取得城市列表',
  description: `取得可用的城市列表。支援按國家篩選、關鍵字搜尋、指定語系。

**查詢參數：**
- \`country\`: 國家代碼篩選 (ISO 3166-1 alpha-2，如 TW, JP, US)
- \`search\`: 搜尋關鍵字（支援城市代碼、中文名、英文名）
- \`locale\`: 語系 (zh-TW, en, default)，決定城市名稱顯示語言
- \`limit\`: 回傳數量限制 (預設 50，最大 200)

**使用範例：**
- 取得台灣所有城市: \`?country=TW\`
- 搜尋東京: \`?search=tokyo\` 或 \`?search=東京\`
- 英文顯示: \`?locale=en\``,
  request: {
    query: getCitiesQuerySchema
  },
  responses: {
    200: {
      description: '成功取得城市列表',
      content: {
        'application/json': {
          schema: getCitiesApiResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  }
});

/**
 * GET /api/v1/cities/countries - 取得國家列表
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/cities/countries',
  tags: ['Cities'],
  summary: '取得國家列表',
  description: '取得所有可用的國家列表，用於國家選擇下拉選單。',
  responses: {
    200: {
      description: '成功取得國家列表',
      content: {
        'application/json': {
          schema: getCountriesApiResponseSchema
        }
      }
    },
    500: { $ref: '#/components/responses/InternalServerError' }
  }
});

// ============================================================================
// 路由處理器註冊
// ============================================================================

/**
 * GET /cities
 * 取得城市列表（支援篩選、搜尋、語系）
 */
router.get('/',
  validate(getCitiesQuerySchema, 'query'),
  getCities
);

/**
 * GET /cities/countries
 * 取得國家列表
 */
router.get('/countries',
  getCountries
);

/**
 * GET /cities/validate/:code
 * 驗證城市代碼
 */
router.get('/validate/:code',
  validateCity
);

export default router;
