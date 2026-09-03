/**
 * Chat ACL Service
 * 聊天室存取控制：成員與 host 由 cohort 現有資料推導
 */

import { prisma } from './database/prisma.service';
import { NotFoundError, ForbiddenError, ConflictError } from '../middleware/error.middleware';
import { CHAT_ROOM_CONTENT_STATES, type ChatRoomContentState } from '../constants/chat';

/** resolveRoomAccess 回傳的存取資訊 */
export interface RoomAccess {
  roomId: number;
  cohortId: number;
  isMember: boolean;
  isHost: boolean;
  contentState: ChatRoomContentState;
}

/**
 * 查詢聊天室存取權限
 * room → cohort → program → organization；
 * kind !== lighthouse || deleted || org !active → NotFoundError；
 * enrollment(joined) 和 org member 推導 isMember / isHost；
 * contentState 只看 cohort.status==='archived' → read_only，否則 writable
 * 非成員 → ForbiddenError
 */
export const resolveRoomAccess = async (roomId: number, userId: number): Promise<RoomAccess> => {
  const room = await prisma.chat_rooms.findUnique({
    where: { id: roomId },
    select: {
      id: true,
      cohort_id: true,
      cohort: {
        select: {
          id: true,
          status: true,
          program: {
            select: {
              kind: true,
              deleted_at: true,
              organization: {
                select: {
                  id: true,
                  status: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!room) throw new NotFoundError('找不到聊天室');

  const { cohort } = room;
  const { program } = cohort;

  // kind !== lighthouse || deleted || org !active → NotFound
  if (program.kind !== 'lighthouse' || program.deleted_at !== null || program.organization.status !== 'active') {
    throw new NotFoundError('找不到聊天室');
  }

  // 查 enrollment
  const enrollment = await prisma.cohort_enrollments.findFirst({
    where: { cohort_id: cohort.id, user_id: userId, status: 'joined' },
    select: { role: true },
  });

  // 查 org member
  const orgMember = await prisma.organization_members.findFirst({
    where: { organization_id: program.organization.id, user_id: userId },
    select: { role: true },
  });

  const isMember = enrollment !== null || orgMember !== null;
  if (!isMember) throw new ForbiddenError('無權限存取此聊天室');

  const isHost =
    (enrollment !== null && (enrollment.role === 'owner' || enrollment.role === 'assistant')) ||
    orgMember !== null;

  const contentState: ChatRoomContentState =
    cohort.status === 'archived' ? CHAT_ROOM_CONTENT_STATES.READ_ONLY : CHAT_ROOM_CONTENT_STATES.WRITABLE;

  return { roomId: room.id, cohortId: cohort.id, isMember, isHost, contentState };
};

/**
 * 取得該 cohort 的所有 host user id 集合（enrollment owner/assistant ∪ org members）
 */
export const listHostUserIds = async (cohortId: number): Promise<Set<number>> => {
  const cohort = await prisma.cohorts.findUnique({
    where: { id: cohortId },
    select: { program: { select: { organization_id: true } } },
  });
  if (!cohort) return new Set();

  const [enrollmentHosts, orgMembers] = await Promise.all([
    prisma.cohort_enrollments.findMany({
      where: { cohort_id: cohortId, status: 'joined', role: { in: ['owner', 'assistant'] }, user_id: { not: null } },
      select: { user_id: true },
    }),
    prisma.organization_members.findMany({
      where: { organization_id: cohort.program.organization_id },
      select: { user_id: true },
    }),
  ]);

  const hostIds = new Set<number>();
  for (const row of enrollmentHosts) {
    if (row.user_id !== null) hostIds.add(row.user_id);
  }
  for (const row of orgMembers) {
    hostIds.add(row.user_id);
  }
  return hostIds;
};

/**
 * 斷言聊天室可寫；read_only → 409 ConflictError
 */
export const assertWritable = (access: RoomAccess): void => {
  if (access.contentState === CHAT_ROOM_CONTENT_STATES.READ_ONLY) {
    throw new ConflictError('本期已封存，聊天室目前為唯讀');
  }
};

export const chatAclService = { resolveRoomAccess, listHostUserIds, assertWritable };
