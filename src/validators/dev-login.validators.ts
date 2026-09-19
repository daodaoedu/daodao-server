/**
 * dev 環境測試登入驗證器
 * 只在 dev 環境掛載的 POST /api/v1/auth/dev-login 使用
 */

import { z } from 'zod';
import { apiSuccessResponseSchema } from './api-response.validators';

export const DEV_LOGIN_SECRET_HEADER = 'x-dev-login-secret';

export const devLoginModeSchema = z.enum(['temp', 'user']).openapi({
  description: 'temp：模擬剛完成 Google 登入、尚未註冊的臨時用戶；user：以 email 取得既有正式用戶身份'
});

export const devLoginValidator = z.object({
  email: z
    .string()
    .trim()
    .email('請輸入有效的電子郵件格式')
    .max(254)
    .openapi({ description: '測試帳號 email', example: 'qa+230@daodao.so' }),
  mode: devLoginModeSchema,
  name: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .optional()
    .openapi({ description: 'temp 模式建立臨時用戶時的顯示名稱；省略時用 email 帳號部分', example: '冒煙 QA' })
});

export type DevLoginRequest = z.infer<typeof devLoginValidator>;

export const devLoginResponseSchema = apiSuccessResponseSchema(
  z.object({
    user: z.object({
      id: z.string().openapi({ description: 'temp 模式為 temp_users.id 字串；user 模式為 external_id' }),
      email: z.string().email(),
      name: z.string().nullable().optional(),
      nickname: z.string().nullable().optional()
    }),
    isTemporary: z.boolean(),
    token: z.string().openapi({ description: '與 auth_token cookie 相同的 JWT，供非瀏覽器客戶端使用' })
  })
).openapi('DevLoginResponse', { description: 'dev 測試登入成功回應' });
