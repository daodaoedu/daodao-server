import { z } from 'zod';

export const createEmailTriggerRuleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  trigger_type: z.string().min(1).max(50),
  trigger_config: z.record(z.string(), z.any()).default({}),
  template: z.string().min(1).max(50),
  subject: z.string().min(1).max(255),
  enabled: z.boolean().default(true),
});

export const updateEmailTriggerRuleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  trigger_type: z.string().min(1).max(50).optional(),
  trigger_config: z.record(z.string(), z.any()).optional(),
  template: z.string().min(1).max(50).optional(),
  subject: z.string().min(1).max(255).optional(),
  enabled: z.boolean().optional(),
});

export const toggleEmailTriggerRuleSchema = z.object({
  enabled: z.boolean(),
});

export const emailTriggerRuleIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const emailTriggerRuleQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  enabled: z.enum(['true', 'false']).optional().transform(v => v === undefined ? undefined : v === 'true'),
});

export const emailTriggerLogQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  rule_id: z.coerce.number().int().positive().optional(),
  status: z.string().optional(),
});
