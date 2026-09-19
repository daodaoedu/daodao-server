import { z } from 'zod';
import { AI_CREDENTIAL_PROVIDERS, AI_CREDENTIAL_STATUSES } from '../constants/ai-provider';

export const aiCredentialProviderSchema = z.enum(AI_CREDENTIAL_PROVIDERS).openapi({ description: 'AI provider：openai | anthropic | gemini | groq | openrouter' });
export const aiCredentialStatusSchema = z.enum(AI_CREDENTIAL_STATUSES).openapi({ description: 'unset（未設定）| set（已設定未測）| verified（測試成功）| invalid（測試失敗）| disabled（停用）' });

/** PUT：存 key。key 只進不出，回應永遠不含明文 */
export const setOrganizationAiCredentialSchema = z.object({
  provider: aiCredentialProviderSchema.optional().default('openai'),
  apiKey: z.string().trim().min(8, 'API key 長度不足').max(512, 'API key 過長').openapi({ example: 'sk-...' })
});

export const organizationAiCredentialResponseSchema = z.object({
  organizationId: z.number().int(),
  provider: aiCredentialProviderSchema,
  status: aiCredentialStatusSchema,
  keyLast4: z.string().nullable().openapi({ description: 'key 末四碼，供辨識；未設定為 null' }),
  lastTestedAt: z.date().nullable(),
  lastTestError: z.string().nullable().openapi({ description: '最近一次測試連線的錯誤摘要；成功或未測為 null' }),
  updatedAt: z.date().nullable(),
  updatedBy: z.number().int().nullable()
});

export const organizationAiCredentialTestResultSchema = organizationAiCredentialResponseSchema.extend({
  ok: z.boolean().openapi({ description: '這次測試連線是否成功' }),
  message: z.string().openapi({ description: '給畫面顯示的結果文案' })
});

export type SetOrganizationAiCredentialInput = z.infer<typeof setOrganizationAiCredentialSchema>;
export type OrganizationAiCredentialResponse = z.infer<typeof organizationAiCredentialResponseSchema>;
export type OrganizationAiCredentialTestResult = z.infer<typeof organizationAiCredentialTestResultSchema>;
