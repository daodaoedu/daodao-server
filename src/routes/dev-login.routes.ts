/**
 * dev 環境測試登入路由
 * POST /api/v1/auth/dev-login
 *
 * 只在「NODE_ENV 屬於 dev 環境」且「DEV_LOGIN_SECRET 已設定」時才會建立 router；
 * 其他情況回傳 null、路由不掛載，prod 打這個路徑得到與其他不存在路由相同的 404。
 * 條件在掛載時決定、不在請求時讀 env——避免 daodao-server#190「env 沒設就開門」的問題。
 */

import { Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { registry } from '../config/openapi-registry';
import { apiErrorResponseSchema } from '../validators/api-response.validators';
import { validate } from '../middleware/validation.middleware';
import { devLoginController, requireDevLoginSecret } from '../controllers/dev-login.controller';
import {
  DEV_LOGIN_SECRET_HEADER,
  devLoginResponseSchema,
  devLoginValidator
} from '../validators/dev-login.validators';

/** 允許掛載的 NODE_ENV 值：host .env.dev 用 dev，.env.dev_temp 模板用 development */
export const DEV_LOGIN_ALLOWED_ENVS: ReadonlyArray<string> = ['dev', 'development'];

export const DEV_LOGIN_PATH = '/dev-login';

type DevLoginEnv = Record<string, string | undefined>;

/** 是否允許掛載：兩個條件缺一不可，任何一個不成立都視為關閉 */
export const isDevLoginEnabled = (env: DevLoginEnv = process.env): boolean => {
  const nodeEnv = env.NODE_ENV;
  const secret = env.DEV_LOGIN_SECRET;
  return typeof nodeEnv === 'string' && DEV_LOGIN_ALLOWED_ENVS.includes(nodeEnv) && typeof secret === 'string' && secret.length > 0;
};

// OpenAPI 定義固定註冊，讓產物在任何環境生成都一致；x-internal 標示非公開 API
registry.registerPath({
  method: 'post',
  path: `/api/v1/auth${DEV_LOGIN_PATH}`,
  tags: ['Authentication'],
  summary: 'dev 環境測試登入（僅 dev 掛載）',
  description:
    `只在 NODE_ENV 為 ${DEV_LOGIN_ALLOWED_ENVS.join('／')} 且已設定 DEV_LOGIN_SECRET 時存在，需帶 ${DEV_LOGIN_SECRET_HEADER} header。` +
    '供部署後冒煙取得 temp／正式用戶身份，prod 無此路由。',
  'x-internal': true,
  request: {
    headers: z.object({
      [DEV_LOGIN_SECRET_HEADER]: z.string().min(1).openapi({ description: '與 server 的 DEV_LOGIN_SECRET 相同的值' })
    }),
    body: { content: { 'application/json': { schema: devLoginValidator } } }
  },
  responses: {
    200: { description: '登入成功，已設定 auth_token cookie', content: { 'application/json': { schema: devLoginResponseSchema } } },
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    404: { $ref: '#/components/responses/NotFoundError' },
    429: {
      description: '超過 dev-login 專用限流（60 次／15 分鐘）',
      content: { 'application/json': { schema: apiErrorResponseSchema } }
    },
    500: { $ref: '#/components/responses/InternalServerError' }
  }
});

export interface DevLoginRouterOptions {
  env?: DevLoginEnv;
  /** 測試可傳入 pass-through 取代預設限流 */
  limiter?: import('express').RequestHandler;
}

/**
 * 建立 dev-login router；未啟用時回傳 null
 */
export const createDevLoginRouter = (options: DevLoginRouterOptions = {}): Router | null => {
  const env = options.env ?? process.env;
  if (!isDevLoginEnabled(env)) {
    return null;
  }

  const router = Router();
  const limiter =
    options.limiter ??
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 60, // 冒煙矩陣一輪會登入多次，比 authLimiter 寬但仍有上限
      standardHeaders: true,
      legacyHeaders: false
    });

  router.post(
    DEV_LOGIN_PATH,
    limiter,
    requireDevLoginSecret(env.DEV_LOGIN_SECRET as string),
    validate(devLoginValidator, 'body'),
    devLoginController.devLogin
  );

  return router;
};
