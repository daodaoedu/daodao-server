/**
 * Me endpoints validation schemas
 * Using Zod for comprehensive input validation
 * Validators for /api/v1/me endpoints
 */

import { z } from 'zod';

// Practice query parameters schema
export const practiceQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(['active', 'paused', 'completed', 'archived']).optional(),
  contentType: z.enum(['book', 'video', 'articles', 'podcast', 'course', 'custom']).optional(),
  search: z.string().max(100).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'title', 'progress']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional()
});

export type PracticeQueryParams = z.infer<typeof practiceQuerySchema>;

// Practice stats query parameters schema
export const practiceStatsQuerySchema = z.object({
  timeRange: z.enum(['7d', '30d', '90d', '1y', 'all']).default('30d'),
  includeArchived: z.coerce.boolean().default(false)
});

export type PracticeStatsQueryParams = z.infer<typeof practiceStatsQuerySchema>;

// Resources query parameters schema
export const resourcesQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  category: z.string().max(50).optional(),
  type: z.enum(['link', 'file', 'note', 'draft']).optional(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  search: z.string().max(100).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'name']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  tags: z.string().optional() // comma-separated tag names
});

export type ResourcesQueryParams = z.infer<typeof resourcesQuerySchema>;

// Preferences query parameters schema
export const preferencesQuerySchema = z.object({
  category: z.string().max(50).optional(), // preference type filter
  includeSystem: z.coerce.boolean().default(false) // include system-wide preferences
});

export type PreferencesQueryParams = z.infer<typeof preferencesQuerySchema>;

// Update preferences request schema
export const updatePreferencesSchema = z.object({
  preferences: z.array(z.object({
    preferenceTypeId: z.number().int().positive(),
    optionId: z.number().int().positive(),
    isSelected: z.boolean(),
    weight: z.number().min(0).max(10).default(1.0).optional()
  })).min(1, 'At least one preference must be provided').max(50, 'Too many preferences in one request')
});

export type UpdatePreferencesRequest = z.infer<typeof updatePreferencesSchema>;