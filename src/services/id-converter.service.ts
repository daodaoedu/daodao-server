/**
 * ID 轉換服務
 * 統一處理 external_id (UUID) 和內部 id (整數) 之間的轉換
 */

import { prisma } from '@/services/database/prisma.service';
import { NotFoundError } from '@/middleware/error.middleware';

/**
 * 支援的實體類型（對應 comment 系統的 target type）
 */
export type EntityType =
  | 'resource'
  | 'idea'
  | 'resource_review'
  | 'practice'
  | 'milestone'
  | 'note'
  | 'outcome'
  | 'review'
  | 'group'
  | 'user'
  | 'circle'   // groups 的別名，用於 comment 系統
  | 'post'     // 用於 comment 系統
  | 'checkin'; // practice_checkins，用於 reaction/comment 系統

/**
 * 實體資訊介面
 */
interface EntityInfo {
  id: number;           // 內部整數 ID
  external_id: string;  // 外部 UUID
  tableName: string;    // 資料表名稱
}

/**
 * 實體類型對應的資料表名稱
 */
const ENTITY_TABLE_MAP: Record<EntityType, string> = {
  resource: 'resources',
  idea: 'ideas',
  resource_review: 'resource_review',
  practice: 'practice',
  milestone: 'milestone',
  note: 'note',
  outcome: 'outcome',
  review: 'review',
  group: 'groups',
  circle: 'groups',  // circle 對應到 groups 表
  user: 'users',
  post: 'post',
  checkin: 'practice_checkins'
};

/**
 * 將 external_id (UUID) 轉換為內部 id (整數)
 * 整合了原本 comment.service.ts 中 getTargetEntity 的邏輯
 * @param entityType - 實體類型
 * @param externalId - 外部 UUID 或整數字串（根據實體類型判斷）
 * @returns 內部整數 ID
 * @throws NotFoundError 如果實體不存在
 */
export async function externalToInternalId(
  entityType: EntityType, 
  externalId: string
): Promise<number> {
  let result: { id: number } | null = null;

  try {
    switch (entityType) {
      case 'resource': {
        result = await prisma.resources.findUnique({
          where: { external_id: externalId },
          select: { id: true }
        });
        break;
      }

      case 'idea': {
        result = await prisma.ideas.findUnique({
          where: { external_id: externalId },
          select: { id: true }
        });
        break;
      }

      case 'group': {
        result = await prisma.groups.findUnique({
          where: { external_id: externalId },
          select: { id: true }
        });
        break;
      }

      case 'user': {
        result = await prisma.users.findUnique({
          where: { external_id: externalId },
          select: { id: true }
        });
        break;
      }

      case 'circle': {
        // circle 是 groups 的別名，用於 comment 系統
        result = await prisma.groups.findUnique({
          where: { external_id: externalId },
          select: { id: true }
        });
        break;
      }

      case 'practice': {
        // practices.id 已經是 int
        result = await prisma.practices.findUnique({
          where: { external_id: externalId },
          select: { id: true }
        });
        break;
      }

      // 以下實體類型使用整數 ID，不是 UUID
      case 'post': {
        const numId = parseInt(externalId);
        if (isNaN(numId)) {
          throw new Error(`${entityType} 需要整數 ID，但收到: ${externalId}`);
        }
        
        result = await prisma.post.findUnique({
          where: { id: numId },
          select: { id: true }
        });
        break;
      }

      case 'note': {
        const numId = parseInt(externalId);
        if (isNaN(numId)) {
          throw new Error(`${entityType} 需要整數 ID，但收到: ${externalId}`);
        }
        
        result = await prisma.note.findUnique({
          where: { id: numId },
          select: { id: true }
        });
        break;
      }

      case 'outcome': {
        const numId = parseInt(externalId);
        if (isNaN(numId)) {
          throw new Error(`${entityType} 需要整數 ID，但收到: ${externalId}`);
        }
        
        result = await prisma.outcome.findUnique({
          where: { id: numId },
          select: { id: true }
        });
        break;
      }

      case 'review': {
        const numId = parseInt(externalId);
        if (isNaN(numId)) {
          throw new Error(`${entityType} 需要整數 ID，但收到: ${externalId}`);
        }
        
        result = await prisma.review.findUnique({
          where: { id: numId },
          select: { id: true }
        });
        break;
      }

      case 'milestone': {
        const numId = parseInt(externalId);
        if (isNaN(numId)) {
          throw new Error(`${entityType} 需要整數 ID，但收到: ${externalId}`);
        }
        
        result = await prisma.milestone.findUnique({
          where: { id: numId },
          select: { id: true }
        });
        break;
      }

      case 'resource_review': {
        const numId = parseInt(externalId);
        if (isNaN(numId)) {
          throw new Error(`${entityType} 需要整數 ID，但收到: ${externalId}`);
        }

        result = await prisma.resource_review.findUnique({
          where: { id: numId },
          select: { id: true }
        });
        break;
      }

      case 'checkin': {
        const numId = parseInt(externalId);
        if (isNaN(numId)) {
          throw new Error(`${entityType} 需要整數 ID，但收到: ${externalId}`);
        }

        result = await prisma.practice_checkins.findUnique({
          where: { id: numId },
          select: { id: true }
        });
        break;
      }

      default:
        throw new Error(`不支援的實體類型: ${entityType}`);
    }

    if (!result) {
      throw new NotFoundError(`${entityType} 不存在: ${externalId}`);
    }

    return result.id;

  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new Error(`轉換 ${entityType} ID 時發生錯誤: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * 將內部 id (整數) 轉換為 external_id (UUID)
 * @param entityType - 實體類型
 * @param internalId - 內部整數 ID
 * @returns 外部 UUID
 * @throws NotFoundError 如果實體不存在
 */
export async function internalToExternalId(
  entityType: EntityType, 
  internalId: number
): Promise<string> {
  let result: { external_id: string | null } | null = null;

  try {
    switch (entityType) {
      case 'resource': {
        result = await prisma.resources.findUnique({
          where: { id: internalId },
          select: { external_id: true }
        });
        break;
      }

      case 'idea': {
        result = await prisma.ideas.findUnique({
          where: { id: internalId },
          select: { external_id: true }
        });
        break;
      }

      case 'group':
      case 'circle': {
        result = await prisma.groups.findUnique({
          where: { id: internalId },
          select: { external_id: true }
        });
        break;
      }

      case 'user': {
        result = await prisma.users.findUnique({
          where: { id: internalId },
          select: { external_id: true }
        });
        break;
      }

      case 'practice': {
        // practices.id 已經是 int
        result = await prisma.practices.findUnique({
          where: { id: internalId },
          select: { external_id: true }
        });
        break;
      }

      // For integer ID entities, return the ID as string
      case 'post':
      case 'note':
      case 'outcome':
      case 'review':
      case 'milestone':
      case 'resource_review':
      case 'checkin': {
        return internalId.toString();
      }

      default:
        throw new Error(`不支援的實體類型: ${entityType}`);
    }

    if (!result || !result.external_id) {
      throw new NotFoundError(`${entityType} 不存在: ${internalId}`);
    }

    return result.external_id;

  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new Error(`轉換 ${entityType} ID 時發生錯誤: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * 獲取實體的完整 ID 資訊
 * @param entityType - 實體類型
 * @param externalId - 外部 UUID
 * @returns 實體資訊
 * @throws NotFoundError 如果實體不存在
 */
export async function getEntityInfo(
  entityType: EntityType, 
  externalId: string
): Promise<EntityInfo> {
  const tableName = ENTITY_TABLE_MAP[entityType];
  
  if (!tableName) {
    throw new Error(`不支援的實體類型: ${entityType}`);
  }

  // Convert to internal ID first, then return info
  const internalId = await externalToInternalId(entityType, externalId);
  
  return {
    id: internalId,
    external_id: externalId,
    tableName
  };
}

/**
 * 批量轉換 external_id 為內部 id
 * @param entityType - 實體類型
 * @param externalIds - 外部 UUID 陣列
 * @returns 內部 ID 陣列
 */
export async function batchExternalToInternalIds(
  entityType: EntityType,
  externalIds: string[]
): Promise<number[]> {
  // Use individual conversions for better type safety
  const results: number[] = [];
  
  for (const externalId of externalIds) {
    const internalId = await externalToInternalId(entityType, externalId);
    results.push(internalId);
  }
  
  return results;
}

/**
 * 驗證 external_id 格式是否為有效的 UUID
 * @param externalId - 要驗證的 external_id
 * @returns 是否為有效的 UUID
 */
export function isValidUUID(externalId: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(externalId);
}

/**
 * 智慧 ID 轉換：自動判斷輸入是 UUID 還是整數 ID
 * @param entityType - 實體類型
 * @param id - ID（可能是 UUID 或整數）
 * @returns { internalId, externalId }
 */
export async function smartIdConvert(
  entityType: EntityType,
  id: string | number
): Promise<{ internalId: number; externalId: string }> {
  // 如果是數字或數字字串，視為內部 ID
  const numId = typeof id === 'number' ? id : parseInt(id as string);
  
  if (!isNaN(numId) && numId > 0) {
    // 輸入是內部 ID，需要轉換為 external_id
    const externalId = await internalToExternalId(entityType, numId);
    return { internalId: numId, externalId };
  }
  
  // 輸入是 external_id (UUID)
  const externalId = id as string;
  if (!isValidUUID(externalId)) {
    throw new Error(`無效的 ID 格式: ${id}`);
  }
  
  const internalId = await externalToInternalId(entityType, externalId);
  return { internalId, externalId };
}

/**
 * 專為 comment 系統設計的目標實體取得函數
 * 取代原本 comment.service.ts 中的 getTargetEntity 方法
 * @param targetType - 目標實體類型
 * @param targetId - 目標實體 ID（可能是 UUID 或整數字串）
 * @returns { id: number, user_id?: number } - 包含內部 ID 和擁有者 ID
 */
export async function getTargetEntity(
  targetType: EntityType,
  targetId: string
): Promise<{ id: number; user_id: number }> {
  try {
    let entity: { id: number; user_id: number } | null = null;

    switch (targetType) {
      case 'post': {
        const post = await prisma.post.findUnique({
          where: { id: parseInt(targetId) },
          select: { id: true, user_id: true }
        });
        if (post) {
          entity = { id: post.id, user_id: post.user_id || 0 };
        }
        break;
      }

      case 'circle': {
        const circle = await prisma.groups.findUnique({
          where: { external_id: targetId },
          select: { id: true, created_by: true }
        });
        if (circle) {
          entity = { id: circle.id, user_id: circle.created_by || 0 };
        }
        break;
      }

      case 'idea': {
        const idea = await prisma.ideas.findUnique({
          where: { external_id: targetId },
          select: { id: true, user_id: true }
        });
        if (idea) {
          entity = { id: idea.id, user_id: idea.user_id || 0 };
        }
        break;
      }

      case 'note': {
        const note = await prisma.note.findUnique({
          where: { id: parseInt(targetId) },
          include: {
            post: {
              select: { user_id: true }
            }
          }
        });
        if (note && note.post) {
          entity = { id: note.id, user_id: note.post.user_id };
        }
        break;
      }

      case 'outcome': {
        const outcome = await prisma.outcome.findUnique({
          where: { id: parseInt(targetId) },
          include: {
            post: {
              select: { user_id: true }
            }
          }
        });
        if (outcome && outcome.post) {
          entity = { id: outcome.id, user_id: outcome.post.user_id };
        }
        break;
      }

      case 'review': {
        const review = await prisma.review.findUnique({
          where: { id: parseInt(targetId) },
          include: {
            post: {
              select: { user_id: true }
            }
          }
        });
        if (review && review.post) {
          entity = { id: review.id, user_id: review.post.user_id };
        }
        break;
      }

      case 'resource': {
        const resource = await prisma.resources.findUnique({
          where: { external_id: targetId },
          select: { id: true, created_by: true }
        });
        if (resource) {
          entity = { id: resource.id, user_id: resource.created_by };
        }
        break;
      }

      case 'practice': {
        const practice = await prisma.practices.findUnique({
          where: { external_id: targetId },
          select: { id: true, user_id: true }
        });
        if (practice) {
          entity = { id: practice.id, user_id: practice.user_id };
        }
        break;
      }

      case 'checkin': {
        const checkin = await prisma.practice_checkins.findUnique({
          where: { id: parseInt(targetId) },
          select: { id: true, user_id: true }
        });
        if (checkin) {
          entity = { id: checkin.id, user_id: checkin.user_id };
        }
        break;
      }

      default:
        throw new Error(`不支援的目標實體類型: ${targetType}`);
    }

    if (!entity) {
      throw new NotFoundError(`${targetType} 不存在: ${targetId}`);
    }

    return entity;

  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new Error(`取得目標實體時發生錯誤: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// 預設匯出
export default {
  externalToInternalId,
  internalToExternalId,
  getEntityInfo,
  getTargetEntity,
  batchExternalToInternalIds,
  isValidUUID,
  smartIdConvert
};
