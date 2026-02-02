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
import { NotFoundError } from '../middleware/error.middleware';
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
 * 隨機模板查詢參數
 */
export interface RandomTemplateQueryParams {
  count?: number;
  category?: string;
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
          }
        }
      }),
      prismaClient.practice_templates.count({ where })
    ]);

    if (templates.length > 0) {
      // 查詢所有模板的標籤
      const templateIds = templates.map(t => t.id);
      const templateTags = await prismaClient.entity_tags.findMany({
        where: {
          entity_type: 'practice_template',
          entity_id: { in: templateIds }
        },
        include: { tags: { select: { name: true } } }
      });

      // 建立 templateId -> tagNames 的映射
      const tagsByTemplateId = new Map<number, string[]>();
      for (const et of templateTags) {
        const existing = tagsByTemplateId.get(et.entity_id) || [];
        existing.push(et.tags.name);
        tagsByTemplateId.set(et.entity_id, existing);
      }

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
        suggestedTags: tagsByTemplateId.get(t.id) || [],
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
        }
      }
    });

    if (template) {
      // 查詢模板的標籤
      const templateTags = await prismaClient.entity_tags.findMany({
        where: {
          entity_type: 'practice_template',
          entity_id: template.id
        },
        include: { tags: { select: { name: true } } }
      });

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
        suggestedTags: templateTags.map(et => et.tags.name),
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

/**
 * Fisher-Yates shuffle 演算法
 * 將陣列元素隨機打亂
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * 隨機取得實踐模板
 */
export async function getRandomTemplates(
  params: RandomTemplateQueryParams = {}
): Promise<ApiSuccessResponse<PracticeTemplateEntity[]>> {
  const count = params.count ?? 3;
  const { category } = params;

  try {
    // 基本查詢條件
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

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

    // 從資料庫取得所有符合條件的模板
    const templates = await prismaClient.practice_templates.findMany({
      where,
      include: {
        practice_template_categories: {
          include: {
            content_categories: {
              select: { name: true }
            }
          }
        }
      }
    });

    if (templates.length > 0) {
      // 查詢所有模板的標籤
      const templateIds = templates.map(t => t.id);
      const templateTags = await prismaClient.entity_tags.findMany({
        where: {
          entity_type: 'practice_template',
          entity_id: { in: templateIds }
        },
        include: { tags: { select: { name: true } } }
      });

      // 建立 templateId -> tagNames 的映射
      const tagsByTemplateId = new Map<number, string[]>();
      for (const et of templateTags) {
        const existing = tagsByTemplateId.get(et.entity_id) || [];
        existing.push(et.tags.name);
        tagsByTemplateId.set(et.entity_id, existing);
      }

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
        suggestedTags: tagsByTemplateId.get(t.id) || [],
        createdAt: t.created_at?.toISOString() || new Date().toISOString()
      }));

      // 隨機打亂並選取指定數量
      const shuffled = shuffleArray(entities);
      const selected = shuffled.slice(0, Math.min(count, shuffled.length));

      return createSuccessResponse(selected);
    }
  } catch (error) {
    loggerService.warn('Failed to get random templates from database, falling back to defaults', { params, error });
  }

  // 使用預設模板作為備援
  let filteredTemplates = [...DEFAULT_TEMPLATES];

  if (category) {
    filteredTemplates = filteredTemplates.filter(t => t.categories.includes(category));
  }

  // 隨機打亂並選取指定數量
  const shuffled = shuffleArray(filteredTemplates);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));

  const entities: PracticeTemplateEntity[] = selected.map(t => ({
    ...t,
    createdAt: new Date().toISOString()
  }));

  return createSuccessResponse(entities);
}

/**
 * 創建模板輸入參數
 */
export interface CreateTemplateInput {
  title: string;
  practiceAction?: string;
  categories?: string[];
  frequencyMinDays?: number;
  frequencyMaxDays?: number;
  durationDays?: number;
  sessionDurationMinutes?: number;
  practiceTimePeriods?: string[];
  suggestedTags?: string[];
}

/**
 * 更新模板輸入參數
 */
export interface UpdateTemplateInput {
  title?: string;
  practiceAction?: string;
  categories?: string[];
  frequencyMinDays?: number;
  frequencyMaxDays?: number;
  durationDays?: number;
  sessionDurationMinutes?: number;
  practiceTimePeriods?: string[];
  suggestedTags?: string[];
}

/**
 * 創建模板
 * 使用事務確保原子性，使用 connectOrCreate 避免競爭條件
 */
export async function createTemplate(
  input: CreateTemplateInput
): Promise<ApiSuccessResponse<PracticeTemplateEntity>> {
  const {
    title,
    practiceAction,
    categories = [],
    frequencyMinDays,
    frequencyMaxDays,
    durationDays,
    sessionDurationMinutes,
    practiceTimePeriods = [],
    suggestedTags = []
  } = input;

  // 使用事務確保原子性
  const template = await prismaClient.$transaction(async (tx) => {
    // 創建模板（讓資料庫自動生成 ID）
    const newTemplate = await tx.practice_templates.create({
      data: {
        title,
        practice_action: practiceAction,
        frequency_min_days: frequencyMinDays,
        frequency_max_days: frequencyMaxDays,
        duration_days: durationDays,
        session_duration_minutes: sessionDurationMinutes,
        practice_time_periods: practiceTimePeriods
      }
    });

    // 處理分類關聯 - 使用 upsert 避免競爭條件
    for (const categoryName of categories) {
      const category = await tx.content_categories.upsert({
        where: { name: categoryName },
        create: { name: categoryName },
        update: {}
      });
      await tx.practice_template_categories.create({
        data: {
          template_id: newTemplate.id,
          category_id: category.id
        }
      });
    }

    // 處理標籤關聯 - 使用 entity_tags 表
    for (const tagName of suggestedTags) {
      const tag = await tx.tags.upsert({
        where: { name: tagName },
        create: { name: tagName },
        update: {}
      });
      await tx.entity_tags.create({
        data: {
          entity_type: 'practice_template',
          entity_id: newTemplate.id,
          tag_id: tag.id
        }
      });
    }

    return newTemplate;
  });

  loggerService.info('Practice template created', { templateId: template.id, title });

  return createSuccessResponse({
    id: template.external_id || String(template.id),
    title: template.title,
    practiceAction: template.practice_action || undefined,
    categories,
    frequencyMinDays: template.frequency_min_days,
    frequencyMaxDays: template.frequency_max_days,
    durationDays: template.duration_days,
    sessionDurationMinutes: template.session_duration_minutes,
    practiceTimePeriods: template.practice_time_periods || [],
    suggestedTags,
    createdAt: template.created_at?.toISOString() || new Date().toISOString()
  });
}

/**
 * 更新模板
 * 使用事務確保原子性，使用 connectOrCreate 避免競爭條件
 */
export async function updateTemplate(
  id: string,
  input: UpdateTemplateInput
): Promise<ApiSuccessResponse<PracticeTemplateEntity | null>> {
  const {
    title,
    practiceAction,
    categories,
    frequencyMinDays,
    frequencyMaxDays,
    durationDays,
    sessionDurationMinutes,
    practiceTimePeriods,
    suggestedTags
  } = input;

  // 查找模板
  const existingTemplate = await prismaClient.practice_templates.findFirst({
    where: {
      OR: [
        { external_id: id },
        { id: parseInt(id, 10) || -1 }
      ]
    }
  });

  if (!existingTemplate) {
    return createSuccessResponse(null);
  }

  // 使用事務確保原子性
  await prismaClient.$transaction(async (tx) => {
    // 更新模板基本資料
    await tx.practice_templates.update({
      where: { id: existingTemplate.id },
      data: {
        ...(title !== undefined && { title }),
        ...(practiceAction !== undefined && { practice_action: practiceAction }),
        ...(frequencyMinDays !== undefined && { frequency_min_days: frequencyMinDays }),
        ...(frequencyMaxDays !== undefined && { frequency_max_days: frequencyMaxDays }),
        ...(durationDays !== undefined && { duration_days: durationDays }),
        ...(sessionDurationMinutes !== undefined && { session_duration_minutes: sessionDurationMinutes }),
        ...(practiceTimePeriods !== undefined && { practice_time_periods: practiceTimePeriods }),
        updated_at: new Date()
      }
    });

    // 更新分類關聯
    if (categories !== undefined) {
      // 刪除舊關聯
      await tx.practice_template_categories.deleteMany({
        where: { template_id: existingTemplate.id }
      });

      // 創建新關聯 - 使用 upsert 避免競爭條件
      for (const categoryName of categories) {
        const category = await tx.content_categories.upsert({
          where: { name: categoryName },
          create: { name: categoryName },
          update: {}
        });
        await tx.practice_template_categories.create({
          data: {
            template_id: existingTemplate.id,
            category_id: category.id
          }
        });
      }
    }

    // 更新標籤關聯 - 使用 entity_tags 表
    if (suggestedTags !== undefined) {
      // 刪除舊關聯
      await tx.entity_tags.deleteMany({
        where: {
          entity_type: 'practice_template',
          entity_id: existingTemplate.id
        }
      });

      // 創建新關聯 - 使用 upsert 避免競爭條件
      for (const tagName of suggestedTags) {
        const tag = await tx.tags.upsert({
          where: { name: tagName },
          create: { name: tagName },
          update: {}
        });
        await tx.entity_tags.create({
          data: {
            entity_type: 'practice_template',
            entity_id: existingTemplate.id,
            tag_id: tag.id
          }
        });
      }
    }
  });

  // 重新查詢完整資料
  const result = await getTemplateById(id);
  loggerService.info('Practice template updated', { templateId: existingTemplate.id });

  return result;
}

/**
 * 刪除模板
 * 使用事務確保原子性
 */
export async function deleteTemplate(
  id: string
): Promise<ApiSuccessResponse<{ deleted: boolean }>> {
  // 查找模板
  const existingTemplate = await prismaClient.practice_templates.findFirst({
    where: {
      OR: [
        { external_id: id },
        { id: parseInt(id, 10) || -1 }
      ]
    }
  });

  if (!existingTemplate) {
    throw new NotFoundError('實踐模板不存在');
  }

  // 使用事務確保原子性
  await prismaClient.$transaction([
    prismaClient.practice_template_categories.deleteMany({
      where: { template_id: existingTemplate.id }
    }),
    prismaClient.entity_tags.deleteMany({
      where: {
        entity_type: 'practice_template',
        entity_id: existingTemplate.id
      }
    }),
    prismaClient.practice_templates.delete({
      where: { id: existingTemplate.id }
    })
  ]);

  loggerService.info('Practice template deleted', { templateId: existingTemplate.id });

  return createSuccessResponse({ deleted: true });
}

/**
 * 模版使用統計
 */
export interface TemplateUsageStats {
  templateId: string;
  title: string;
  usageCount: number;
  uniqueUserCount: number;
  recentUsages: Array<{
    practiceId: string;
    userId: string;
    createdAt: string;
  }>;
}

/**
 * 取得模版使用統計
 */
export async function getTemplateUsageStats(
  templateId: string
): Promise<ApiSuccessResponse<TemplateUsageStats | null>> {
  try {
    // 查找模板
    const template = await prismaClient.practice_templates.findFirst({
      where: {
        OR: [
          { external_id: templateId },
          { id: parseInt(templateId, 10) || -1 }
        ]
      },
      select: {
        id: true,
        external_id: true,
        title: true,
        usage_count: true
      }
    });

    if (!template) {
      return createSuccessResponse(null);
    }

    // 查詢使用記錄
    const usages = await prismaClient.template_usages.findMany({
      where: { template_id: template.id },
      orderBy: { created_at: 'desc' },
      take: 10,
      include: {
        users: {
          select: { external_id: true }
        },
        practices: {
          select: { external_id: true }
        }
      }
    });

    // 計算不重複用戶數
    const uniqueUserIds = new Set(usages.map(u => u.user_id));

    const stats: TemplateUsageStats = {
      templateId: template.external_id || String(template.id),
      title: template.title,
      usageCount: template.usage_count,
      uniqueUserCount: uniqueUserIds.size,
      recentUsages: usages.map(u => ({
        practiceId: u.practices.external_id || String(u.practice_id),
        userId: u.users.external_id || String(u.user_id),
        createdAt: u.created_at?.toISOString() || new Date().toISOString()
      }))
    };

    loggerService.info('Template usage stats retrieved', {
      templateId: template.id,
      usageCount: stats.usageCount
    });

    return createSuccessResponse(stats);
  } catch (error) {
    loggerService.error('Failed to get template usage stats', { templateId, error });
    throw error;
  }
}

/**
 * 取得熱門模版（依使用次數排序）
 */
export async function getPopularTemplates(
  limit = 10
): Promise<ApiSuccessResponse<PracticeTemplateEntity[]>> {
  try {
    const templates = await prismaClient.practice_templates.findMany({
      orderBy: { usage_count: 'desc' },
      take: limit,
      include: {
        practice_template_categories: {
          include: {
            content_categories: {
              select: { name: true }
            }
          }
        }
      }
    });

    // 查詢所有模板的標籤
    const templateIds = templates.map(t => t.id);
    const templateTags = await prismaClient.entity_tags.findMany({
      where: {
        entity_type: 'practice_template',
        entity_id: { in: templateIds }
      },
      include: { tags: { select: { name: true } } }
    });

    // 建立 templateId -> tagNames 的映射
    const tagsByTemplateId = new Map<number, string[]>();
    for (const et of templateTags) {
      const existing = tagsByTemplateId.get(et.entity_id) || [];
      existing.push(et.tags.name);
      tagsByTemplateId.set(et.entity_id, existing);
    }

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
      suggestedTags: tagsByTemplateId.get(t.id) || [],
      createdAt: t.created_at?.toISOString() || new Date().toISOString()
    }));

    loggerService.info('Popular templates retrieved', { count: entities.length });

    return createSuccessResponse(entities);
  } catch (error) {
    loggerService.error('Failed to get popular templates', { error });
    throw error;
  }
}
