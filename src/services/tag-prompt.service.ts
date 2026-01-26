/**
 * 標籤引導句服務
 *
 * 提供打卡時根據標籤顯示的引導句功能
 * 使用 tag_prompt_templates 表，關聯 tags 表
 *
 * @see docs/practice-mvp/backend-implementation-plan.md 2.5 節
 */

import { prisma } from './database/prisma.service';
import { loggerService } from './logging/logger.service';
import { createSuccessResponse } from '../utils/response-helper';
import type { ApiSuccessResponse } from '../types/api-response.types';

const prismaClient = prisma;

/**
 * 引導句使用場景
 * @see docs/practice-mvp/backend-implementation-plan.md
 */
export type TagPromptUsageType = 'practice_checkin' | 'reflection' | 'summary';

/**
 * 引導句語言
 */
export type TagPromptLocale = 'zh-TW' | 'en-US';

/**
 * 引導句實體（API 回傳格式）
 */
export interface TagPromptEntity {
  id: number;
  tagName: string;
  prompt: string;
  usageType: string;
}

/**
 * 預設引導句（當資料庫無資料時使用）
 * @see docs/practice-mvp/backend-implementation-plan.md
 */
const DEFAULT_TAG_PROMPTS: Record<string, Record<string, string>> = {
  '實作': {
    practice_checkin: '我練習了...',
    reflection: '實作過程中我發現...',
    summary: '本週我實作了...'
  },
  '新概念': {
    practice_checkin: '我學到的一個新概念是...',
    reflection: '這個新概念讓我想到...',
    summary: '本週學到的新概念包括...'
  },
  '有趣': {
    practice_checkin: '發生了一件有趣的事，就是...',
    reflection: '有趣的發現是...',
    summary: '本週有趣的事...'
  },
  '困難': {
    practice_checkin: '遇到了一點困難，像是...',
    reflection: '面對困難我選擇...',
    summary: '本週的挑戰是...'
  },
  '下一步': {
    practice_checkin: '接下來我想嘗試...',
    reflection: '下一步我計劃...',
    summary: '下週我想...'
  },
  '改進': {
    practice_checkin: '下次可以做得更好的是...',
    reflection: '可以改進的地方...',
    summary: '本週可以改進的地方...'
  },
  '疑問': {
    practice_checkin: '我有個疑問是...',
    reflection: '我還在思考的問題是...',
    summary: '本週遇到的疑問...'
  },
  default: {
    practice_checkin: '今天的學習或實踐...',
    reflection: '我的反思是...',
    summary: '本週總結...'
  }
};

/**
 * 取得引導句列表
 * 使用 tag_prompt_templates 表，並透過 tags 關聯取得標籤名稱
 */
export async function getTagPrompts(
  usageType: TagPromptUsageType = 'practice_checkin',
  locale: TagPromptLocale = 'zh-TW'
): Promise<ApiSuccessResponse<TagPromptEntity[]>> {
  try {
    const prompts = await prismaClient.tag_prompt_templates.findMany({
      where: {
        usage_type: usageType,
        locale
      },
      include: {
        tags: {
          select: {
            name: true
          }
        }
      },
      orderBy: { id: 'asc' }
    });

    if (prompts.length > 0) {
      return createSuccessResponse(
        prompts.map(p => ({
          id: p.id,
          tagName: p.tags.name,
          prompt: p.prompt_text,
          usageType: p.usage_type
        }))
      );
    }
  } catch (error) {
    loggerService.warn('Failed to get tag prompts from database', { usageType, locale, error });
  }

  // 返回預設引導句
  const defaultPrompts: TagPromptEntity[] = Object.entries(DEFAULT_TAG_PROMPTS)
    .filter(([tagName]) => tagName !== 'default')
    .map(([tagName, prompts], index) => ({
      id: -(index + 1),
      tagName,
      prompt: prompts[usageType] || prompts.practice_checkin,
      usageType
    }));

  return createSuccessResponse(defaultPrompts);
}

/**
 * 根據標籤名稱取得引導句
 */
export async function getTagPromptByTagName(
  tagName: string,
  usageType: TagPromptUsageType = 'practice_checkin',
  locale: TagPromptLocale = 'zh-TW'
): Promise<ApiSuccessResponse<TagPromptEntity | null>> {
  try {
    // 先查詢 tag id
    const tag = await prismaClient.tags.findFirst({
      where: { name: tagName }
    });

    if (tag) {
      const prompt = await prismaClient.tag_prompt_templates.findFirst({
        where: {
          tag_id: tag.id,
          usage_type: usageType,
          locale
        },
        include: {
          tags: {
            select: {
              name: true
            }
          }
        }
      });

      if (prompt) {
        return createSuccessResponse({
          id: prompt.id,
          tagName: prompt.tags.name,
          prompt: prompt.prompt_text,
          usageType: prompt.usage_type
        });
      }
    }
  } catch (error) {
    loggerService.warn('Failed to get tag prompt by name', { tagName, usageType, locale, error });
  }

  // 嘗試使用預設引導句
  const defaultPrompts = DEFAULT_TAG_PROMPTS[tagName] || DEFAULT_TAG_PROMPTS['default'];
  const promptText = defaultPrompts[usageType] || defaultPrompts.practice_checkin;

  return createSuccessResponse({
    id: -1,
    tagName,
    prompt: promptText,
    usageType
  });
}

/**
 * 根據多個標籤名稱取得引導句
 */
export async function getTagPromptsByTags(
  tagNames: string[],
  usageType: TagPromptUsageType = 'practice_checkin',
  locale: TagPromptLocale = 'zh-TW'
): Promise<ApiSuccessResponse<TagPromptEntity[]>> {
  if (tagNames.length === 0) {
    return createSuccessResponse([]);
  }

  try {
    // 先查詢所有標籤的 id
    const tags = await prismaClient.tags.findMany({
      where: { name: { in: tagNames } }
    });

    if (tags.length > 0) {
      const tagIds = tags.map(t => t.id);

      const prompts = await prismaClient.tag_prompt_templates.findMany({
        where: {
          tag_id: { in: tagIds },
          usage_type: usageType,
          locale
        },
        include: {
          tags: {
            select: {
              name: true
            }
          }
        }
      });

      if (prompts.length > 0) {
        return createSuccessResponse(
          prompts.map(p => ({
            id: p.id,
            tagName: p.tags.name,
            prompt: p.prompt_text,
            usageType: p.usage_type
          }))
        );
      }
    }
  } catch (error) {
    loggerService.warn('Failed to get tag prompts by tags', { tagNames, usageType, locale, error });
  }

  // 返回預設引導句（只返回有對應預設值的標籤）
  const result: TagPromptEntity[] = tagNames
    .map((tagName, index) => {
      const defaultPrompts = DEFAULT_TAG_PROMPTS[tagName];
      if (defaultPrompts) {
        return {
          id: -(index + 1),
          tagName,
          prompt: defaultPrompts[usageType] || defaultPrompts.practice_checkin,
          usageType
        } as TagPromptEntity;
      }
      return null;
    })
    .filter((p): p is TagPromptEntity => p !== null);

  return createSuccessResponse(result);
}
