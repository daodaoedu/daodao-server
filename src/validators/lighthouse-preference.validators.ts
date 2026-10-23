import { z } from 'zod';

export const updateLighthousePreferenceSchema = z.object({
  organizationId: z.number().int().positive().openapi({ description: '目前使用的燈塔組織 ID，必須是本人所屬且啟用中的組織', example: 2 })
}).strict();

export const lighthousePreferenceResponseSchema = z.object({
  organizationId: z.number().int().positive().nullable().openapi({ description: '帳號上次使用且目前仍有權管理的組織；尚未選擇或資格失效時為 null', example: 2 })
});

export type LighthousePreferenceResponse = z.infer<typeof lighthousePreferenceResponseSchema>;
export type UpdateLighthousePreferenceInput = z.infer<typeof updateLighthousePreferenceSchema>;
