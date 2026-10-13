/**
 * 共同挑戰所屬組織（島島阿學官方組織）
 *
 * 共同挑戰只供島島阿學建立（daodao#179）：主題與模板一律掛在 organization.is_official = true 的那一筆
 * （storage migration 093 建立，partial unique index 保證最多一筆），不接受 client 指定組織，
 * 也不退回「第一個啟用組織」之類的任意預設值。
 * 官方組織不存在、超過一筆或（建立時）非 active 都 fail closed（409），避免挑戰落到錯的組織。
 */

import { ConflictError } from '../middleware/error.middleware';
import { prisma } from './database/prisma.service';

type OrganizationCandidate = { id: number; status: string };

/** 從 is_official 候選中決定共同挑戰所屬組織（純邏輯，便於測試） */
export const pickChallengeOrganization = (
  candidates: OrganizationCandidate[],
  { requireActive }: { requireActive: boolean }
): OrganizationCandidate => {
  if (candidates.length === 0) throw new ConflictError('尚未設定島島阿學官方組織，無法管理共同挑戰');
  if (candidates.length > 1) throw new ConflictError('島島阿學官方組織設定重複，請聯絡工程師');
  const [organization] = candidates;
  if (requireActive && organization.status !== 'active') throw new ConflictError('島島阿學組織目前已停權，無法建立挑戰');
  return organization;
};

// take: 2 足以分辨「恰好一筆」與「重複」
const loadCandidates = (): Promise<OrganizationCandidate[]> =>
  prisma.organization.findMany({ where: { is_official: true }, select: { id: true, status: true }, take: 2 });

/** 讀取／管理既有挑戰用：不要求 active（官方組織停權時仍可列表與封存） */
const getOrganizationId = async (): Promise<number> =>
  pickChallengeOrganization(await loadCandidates(), { requireActive: false }).id;

/** 建立主題／模板／期用：官方組織必須 active */
const getActiveOrganizationId = async (): Promise<number> =>
  pickChallengeOrganization(await loadCandidates(), { requireActive: true }).id;

export const challengeOrganizationService = { getOrganizationId, getActiveOrganizationId };
