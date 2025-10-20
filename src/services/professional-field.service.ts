/**
 * 專業領域服務
 * 處理用戶專業領域的資料庫操作
 */

import { prisma } from './database/prisma.service';
import { ProfessionalField } from '../types/user.types';

/**
 * 設置用戶的專業領域 (會先刪除現有的，再新增)
 * @param userId - 用戶 ID
 * @param fieldValues - 專業領域值陣列 (例如: ['education', 'business_administration_and_law'])
 * @param tx - Prisma transaction client (可選)
 */
export const setUserProfessionalFields = async (
  userId: number,
  fieldValues: ProfessionalField[],
  tx?: Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>
): Promise<void> => {
  const client = tx || prisma;

  // 先刪除現有的專業領域關聯
  await client.user_professional_fields.deleteMany({
    where: { user_id: userId }
  });

  // 如果沒有提供專業領域，直接返回
  if (!fieldValues || fieldValues.length === 0) {
    return;
  }

  // 查找對應的專業領域 ID
  const professionalFields = await client.professional_fields.findMany({
    where: {
      value: { in: fieldValues },
      is_active: true
    },
    select: { id: true }
  });

  // 批量新增用戶專業領域關聯
  if (professionalFields.length > 0) {
    await client.user_professional_fields.createMany({
      data: professionalFields.map(field => ({
        user_id: userId,
        professional_field_id: field.id
      }))
    });
  }
};

/**
 * 獲取用戶的專業領域 (返回值陣列)
 * @param userId - 用戶 ID
 * @returns 專業領域值陣列 (例如: ['education', 'business_administration_and_law'])
 */
export const getUserProfessionalFields = async (
  userId: number
): Promise<ProfessionalField[] | null> => {
  const userFields = await prisma.user_professional_fields.findMany({
    where: { user_id: userId },
    include: {
      professional_fields: {
        select: {
          value: true
        }
      }
    }
  });

  if (userFields.length === 0) return null;

  // 返回專業領域值陣列
  return userFields.map(uf => uf.professional_fields.value as ProfessionalField);
};

/**
 * 獲取所有可用的專業領域
 * @returns 所有啟用的專業領域列表
 */
export const getAllProfessionalFields = async () => {
  return await prisma.professional_fields.findMany({
    where: { is_active: true },
    orderBy: { display_order: 'asc' },
    select: {
      id: true,
      name: true,
      value: true,
      description: true
    }
  });
};

/**
 * 獲取用戶的專業領域 (包含完整資訊)
 * @param userId - 用戶 ID
 * @returns 專業領域完整資訊陣列
 */
export const getUserProfessionalFieldsDetailed = async (userId: number) => {
  const userFields = await prisma.user_professional_fields.findMany({
    where: { user_id: userId },
    include: {
      professional_fields: {
        select: {
          id: true,
          name: true,
          value: true,
          description: true
        }
      }
    },
    orderBy: {
      professional_fields: {
        display_order: 'asc'
      }
    }
  });

  return userFields.map(uf => uf.professional_fields);
};

export const professionalFieldService = {
  setUserProfessionalFields,
  getUserProfessionalFields,
  getUserProfessionalFieldsDetailed,
  getAllProfessionalFields
};

export default professionalFieldService;
