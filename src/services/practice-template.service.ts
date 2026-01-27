/**
 * 實踐模板服務
 *
 * 提供預設實踐模板的查詢功能
 * 使用 practice_templates 表及其關聯表
 *
 * @see docs/practice-mvp/backend-implementation-plan.md 2.3 節
 */

import { prisma } from './database/prisma.service';
import { loggerService } from './logging/logger.service';
import {
  createSuccessResponse,
  createPaginatedResponse
} from '../utils/response-helper';
import { calculatePagination } from '../utils/pagination-helper';
import type {
  ApiSuccessResponse,
  PaginatedApiResponse
} from '../types/api-response.types';

const prismaClient = prisma;

/**
 * 模板實體
 */
export interface PracticeTemplateEntity {
  id: string;
  title: string;
  practiceAction?: string;
  categories: string[];
  frequencyMinDays: number | null;
  frequencyMaxDays: number | null;
  durationDays: number | null;
  sessionDurationMinutes: number | null;
  practiceTimePeriods: string[];
  suggestedTags: string[];
  createdAt: string;
}

/**
 * 模板查詢參數
 */
export interface TemplateQueryParams {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
}

/**
 * 預設模板（當資料庫無資料時使用）
 */
const DEFAULT_TEMPLATES: Omit<PracticeTemplateEntity, 'createdAt'>[] = [
  {
    id: 'tpl-reading-daily',
    title: '每日閱讀 30 分鐘',
    practiceAction: '閱讀',
    categories: ['reading'],
    frequencyMinDays: 1,
    frequencyMaxDays: 2,
    durationDays: 30,
    sessionDurationMinutes: 30,
    practiceTimePeriods: ['morning', 'evening'],
    suggestedTags: ['閱讀', '習慣養成', '自我成長']
  },
  {
    id: 'tpl-reading-weekly',
    title: '每週讀完一本書',
    practiceAction: '讀完一本書',
    categories: ['reading'],
    frequencyMinDays: 1,
    frequencyMaxDays: 7,
    durationDays: 28,
    sessionDurationMinutes: 60,
    practiceTimePeriods: ['anytime'],
    suggestedTags: ['閱讀', '深度學習']
  },
  {
    id: 'tpl-learning-course',
    title: '線上課程學習',
    practiceAction: '學習線上課程',
    categories: ['learning'],
    frequencyMinDays: 1,
    frequencyMaxDays: 3,
    durationDays: 60,
    sessionDurationMinutes: 45,
    practiceTimePeriods: ['afternoon', 'evening'],
    suggestedTags: ['學習', '線上課程', '技能提升']
  },
  {
    id: 'tpl-exercise-daily',
    title: '每日運動',
    practiceAction: '運動',
    categories: ['fitness'],
    frequencyMinDays: 1,
    frequencyMaxDays: 2,
    durationDays: 30,
    sessionDurationMinutes: 30,
    practiceTimePeriods: ['morning'],
    suggestedTags: ['運動', '健康', '習慣養成']
  },
  {
    id: 'tpl-meditation',
    title: '每日冥想',
    practiceAction: '冥想',
    categories: ['meditation'],
    frequencyMinDays: 1,
    frequencyMaxDays: 2,
    durationDays: 21,
    sessionDurationMinutes: 15,
    practiceTimePeriods: ['morning', 'evening'],
    suggestedTags: ['冥想', '正念', '身心健康']
  },
  {
    id: 'tpl-writing',
    title: '每日寫作',
    practiceAction: '寫作 500 字',
    categories: ['writing'],
    frequencyMinDays: 1,
    frequencyMaxDays: 2,
    durationDays: 30,
    sessionDurationMinutes: 30,
    practiceTimePeriods: ['morning'],
    suggestedTags: ['寫作', '創作', '表達']
  },
  {
    id: 'tpl-coding',
    title: '程式學習',
    practiceAction: '寫程式',
    categories: ['coding'],
    frequencyMinDays: 1,
    frequencyMaxDays: 3,
    durationDays: 90,
    sessionDurationMinutes: 60,
    practiceTimePeriods: ['anytime'],
    suggestedTags: ['程式', '技術', '學習']
  },
  {
    id: 'tpl-language',
    title: '語言學習',
    practiceAction: '練習外語',
    categories: ['language'],
    frequencyMinDays: 1,
    frequencyMaxDays: 2,
    durationDays: 60,
    sessionDurationMinutes: 20,
    practiceTimePeriods: ['morning', 'evening'],
    suggestedTags: ['語言', '學習', '國際化']
  }
];

/**
 * 取得模板列表
 */
export async function getTemplates(
  params: TemplateQueryParams = {}
): Promise<PaginatedApiResponse<PracticeTemplateEntity>> {
  const {
    page = 1,
    limit = 20,
    category,
    search
  } = params;

  try {
    // 嘗試從資料庫取得
    const skip = (page - 1) * limit;
    const take = Math.min(limit, 100);

    // 基本查詢條件
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }

    // 如果有分類過濾，透過關聯表查詢
    if (category) {
      where.practice_template_categories = {
        some: {
          content_categories: {
            name: category
          }
        }
      };
    }

    const [templates, total] = await Promise.all([
      prismaClient.practice_templates.findMany({
        where,
        skip,
        take,
        orderBy: { created_at: 'desc' },
        include: {
          practice_template_categories: {
            include: {
              content_categories: {
                select: { name: true }
              }
            }
          },
          practice_template_tags: {
            include: {
              tags: {
                select: { name: true }
              }
            }
          }
        }
      }),
      prismaClient.practice_templates.count({ where })
    ]);

    if (templates.length > 0) {
      const entities: PracticeTemplateEntity[] = templates.map(t => ({
        id: t.external_id || String(t.id),
        title: t.title,
        practiceAction: t.practice_action || undefined,
        categories: t.practice_template_categories.map(c => c.content_categories.name),
        frequencyMinDays: t.frequency_min_days,
        frequencyMaxDays: t.frequency_max_days,
        durationDays: t.duration_days,
        sessionDurationMinutes: t.session_duration_minutes,
        practiceTimePeriods: t.practice_time_periods || [],
        suggestedTags: t.practice_template_tags.map(pt => pt.tags.name),
        createdAt: t.created_at?.toISOString() || new Date().toISOString()
      }));

      const paginationInfo = calculatePagination(page, take, total);
      return createPaginatedResponse(entities, paginationInfo);
    }
  } catch (error) {
    loggerService.warn('Failed to get templates from database', { params, error });
  }

  // 使用預設模板
  let filteredTemplates = [...DEFAULT_TEMPLATES];

  if (category) {
    filteredTemplates = filteredTemplates.filter(t => t.categories.includes(category));
  }

  if (search) {
    const searchLower = search.toLowerCase();
    filteredTemplates = filteredTemplates.filter(t =>
      t.title.toLowerCase().includes(searchLower) ||
      (t.practiceAction?.toLowerCase().includes(searchLower) ?? false)
    );
  }

  const total = filteredTemplates.length;
  const skipDefault = (page - 1) * limit;
  const paginatedTemplates = filteredTemplates.slice(skipDefault, skipDefault + limit);

  const entities: PracticeTemplateEntity[] = paginatedTemplates.map(t => ({
    ...t,
    createdAt: new Date().toISOString()
  }));

  const paginationInfo = calculatePagination(page, limit, total);
  return createPaginatedResponse(entities, paginationInfo);
}

/**
 * 根據 ID 取得模板
 */
export async function getTemplateById(
  id: string
): Promise<ApiSuccessResponse<PracticeTemplateEntity | null>> {
  try {
    const template = await prismaClient.practice_templates.findFirst({
      where: {
        OR: [
          { external_id: id },
          { id: parseInt(id, 10) || -1 }
        ]
      },
      include: {
        practice_template_categories: {
          include: {
            content_categories: {
              select: { name: true }
            }
          }
        },
        practice_template_tags: {
          include: {
            tags: {
              select: { name: true }
            }
          }
        }
      }
    });

    if (template) {
      return createSuccessResponse({
        id: template.external_id || String(template.id),
        title: template.title,
        practiceAction: template.practice_action || undefined,
        categories: template.practice_template_categories.map(c => c.content_categories.name),
        frequencyMinDays: template.frequency_min_days,
        frequencyMaxDays: template.frequency_max_days,
        durationDays: template.duration_days,
        sessionDurationMinutes: template.session_duration_minutes,
        practiceTimePeriods: template.practice_time_periods || [],
        suggestedTags: template.practice_template_tags.map(pt => pt.tags.name),
        createdAt: template.created_at?.toISOString() || new Date().toISOString()
      });
    }
  } catch (error) {
    loggerService.warn('Failed to get template by id from database', { id, error });
  }

  // 嘗試從預設模板中找
  const defaultTemplate = DEFAULT_TEMPLATES.find(t => t.id === id);

  if (defaultTemplate) {
    return createSuccessResponse({
      ...defaultTemplate,
      createdAt: new Date().toISOString()
    });
  }

  return createSuccessResponse(null);
}

/**
 * 取得模板分類列表
 */
export async function getTemplateCategories(): Promise<ApiSuccessResponse<string[]>> {
  try {
    // 從 content_categories 表取得有被 practice_templates 使用的分類
    const categories = await prismaClient.content_categories.findMany({
      where: {
        practice_template_categories: {
          some: {}
        }
      },
      select: { name: true }
    });

    if (categories.length > 0) {
      return createSuccessResponse(categories.map(c => c.name));
    }
  } catch (error) {
    loggerService.warn('Failed to get template categories from database', { error });
  }

  // 從預設模板提取分類
  const allCategories = DEFAULT_TEMPLATES.flatMap(t => t.categories);
  const uniqueCategories = [...new Set(allCategories)];
  return createSuccessResponse(uniqueCategories);
}
