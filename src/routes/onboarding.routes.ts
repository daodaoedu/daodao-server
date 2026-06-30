import { Router } from 'express';
import { registry } from '@/config/openapi-registry';
import { authenticate } from '@/middleware/auth';
import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { getStatus, getActiveFlow, submitFlowResponse } from '@/controllers/onboarding.controller';

extendZodWithOpenApi(z);

const router = Router();

// ── OpenAPI schema ────────────────────────────────────────────────────────────

const onboardingTaskItemSchema = z.object({
  taskKey: z.enum(['A', 'B', 'C', 'D', 'E']).openapi({ example: 'A' }),
  done: z.boolean().openapi({ example: false }),
  ctaHref: z.string().optional().openapi({ example: '/practices/123e4567-e89b-12d3-a456-426614174000' }),
});

const onboardingStatusResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    taskList: z.array(onboardingTaskItemSchema),
    completedTasks: z.number().int().openapi({ example: 2 }),
    badgeGranted: z.boolean().openapi({ example: false }),
  }),
  timestamp: z.string(),
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/onboarding/status',
  tags: ['Onboarding'],
  summary: '取得 Onboarding 進度',
  description: '回傳當前用戶的 Onboarding 任務清單、完成數量與 Badge 狀態。任務順序依 user_source（S1/S2/S3）排列。',
  responses: {
    200: {
      description: 'Onboarding 狀態',
      content: { 'application/json': { schema: onboardingStatusResponseSchema } },
    },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    404: { $ref: '#/components/responses/NotFoundError' },
  },
  security: [{ bearerAuth: [] }],
});

// ── Public routes (no auth required) ─────────────────────────────────────────

router.get('/flows/active', getActiveFlow);

// ── Authenticated routes ──────────────────────────────────────────────────────

router.use(authenticate);

router.get('/status', getStatus);
router.post('/flows/:id/responses', submitFlowResponse);

export default router;
