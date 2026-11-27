import { z } from 'zod';
import '../config/openapi-registry';

export const featureFlagKeySchema = z.string().regex(/^[A-Za-z][A-Za-z0-9_-]{0,63}$/).openapi({ description: '功能識別碼，英文字母開頭，最多64個英數字、底線或連字號', example: 'homeTimeline' });
export const featureFlagStageSchema = z.enum(['off', 'alpha', 'beta', 'ga']).openapi({ description: 'off關閉；alpha依目前組織；beta全域試用；ga正式開放' });
const organizationIdSchema = z.number().int().positive().max(2147483647);
export const publicFeatureFlagsQuerySchema = z.object({
  organizationId: z.string().regex(/^[1-9]\d*$/).transform(Number).pipe(organizationIdSchema).optional().openapi({ description: '目前切換到的組織ID；省略時不適用Alpha', example: '9' })
}).strict();
export const featureFlagParamsSchema = z.object({ key: featureFlagKeySchema }).strict();
const metadataShape = {
  name: z.string().trim().min(1).max(100).openapi({ description: '功能顯示名稱', example: '首頁學習足跡' }),
  description: z.string().trim().max(500).openapi({ description: '用途與接入說明', example: '控制首頁時間軸' })
};
export const createFeatureFlagSchema = z.object({ key: featureFlagKeySchema, ...metadataShape }).strict();
export const updateFeatureFlagSchema = z.object({
  ...metadataShape,
  stage: featureFlagStageSchema,
  organizationIds: z.array(organizationIdSchema).max(1000).refine(ids => new Set(ids).size === ids.length, '組織不可重複').openapi({ description: 'Alpha組織名單；其他階段保留但不影響全域判定', example: [9] })
}).strict().refine(input => input.stage !== 'alpha' || input.organizationIds.length > 0, { message: 'Alpha至少需要一個組織', path: ['organizationIds'] });
export const publicFeatureFlagsSchema = z.record(z.string(), z.boolean());
export const adminFeatureFlagSchema = z.object({
  key: featureFlagKeySchema, ...metadataShape, stage: featureFlagStageSchema,
  organizationIds: z.array(organizationIdSchema),
  updatedAt: z.iso.datetime().openapi({ description: '最後更新時間' })
});
export type CreateFeatureFlagInput = z.infer<typeof createFeatureFlagSchema>;
export type UpdateFeatureFlagInput = z.infer<typeof updateFeatureFlagSchema>;
export type AdminFeatureFlag = z.infer<typeof adminFeatureFlagSchema>;
