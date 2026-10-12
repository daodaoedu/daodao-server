/**
 * 共同挑戰所屬組織（島島阿學官方組織）
 *
 * 共同挑戰只供島島阿學建立（daodao#179）：主題與模板一律掛在 env CHALLENGE_ORGANIZATION_ID 指定的組織，
 * 不接受 client 指定組織，也不退回「第一個啟用組織」之類的任意預設值。
 * 未設定、格式錯誤、組織不存在或（建立時）非 active 都 fail closed，避免挑戰落到錯的組織。
 */

import { ConflictError } from '../middleware/error.middleware';
import { prisma } from './database/prisma.service';

const ENV_KEY = 'CHALLENGE_ORGANIZATION_ID';

/** 解析 env 值；只接受正整數字串，其他一律視為未設定（純邏輯，便於測試） */
export const parseChallengeOrganizationId = (raw: string | undefined): number | null => {
  const value = raw?.trim();
  if (!value || !/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

/** 依 env 與查到的組織決定共同挑戰所屬組織（純邏輯，便於測試） */
export const pickChallengeOrganization = (
  configuredId: number | null,
  organization: { id: number; status: string } | null,
  { requireActive }: { requireActive: boolean }
): number => {
  if (configuredId === null) throw new ConflictError('尚未設定島島阿學組織（CHALLENGE_ORGANIZATION_ID），無法管理共同挑戰');
  if (!organization) throw new ConflictError('找不到設定的島島阿學組織，無法管理共同挑戰');
  if (requireActive && organization.status !== 'active') throw new ConflictError('島島阿學組織目前已停權，無法建立挑戰');
  return organization.id;
};

const resolve = async (requireActive: boolean): Promise<number> => {
  const configuredId = parseChallengeOrganizationId(process.env[ENV_KEY]);
  const organization = configuredId === null
    ? null
    : await prisma.organization.findUnique({ where: { id: configuredId }, select: { id: true, status: true } });
  return pickChallengeOrganization(configuredId, organization, { requireActive });
};

/** 讀取／管理既有挑戰用：不要求 active（官方組織停權時仍可列表與封存） */
const getOrganizationId = (): Promise<number> => resolve(false);

/** 建立主題／模板用：官方組織必須 active */
const getActiveOrganizationId = (): Promise<number> => resolve(true);

export const challengeOrganizationService = { getOrganizationId, getActiveOrganizationId };
