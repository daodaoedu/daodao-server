/**
 * Chat Room Service
 * 聊天室 CRUD：ensureRoom、listMyRooms、getRoom、listMembers、markRead、appendSystemMessage
 */

import { Prisma } from '../../generated/prisma';
import { prisma } from './database/prisma.service';
import { NotFoundError, BadRequestError } from '../middleware/error.middleware';
import { CHAT_MESSAGE_KINDS, CHAT_SYSTEM_EVENTS, type ChatSystemEvent } from '../constants/chat';
import { chatAclService, type RoomAccess } from './chat-acl.service';
import { chatPresenceService } from './chat-presence.service';

type TransactionClient = Prisma.TransactionClient;

/**
 * 確保 cohort 有對應的聊天室（僅 lighthouse）
 * ON CONFLICT DO NOTHING；在 transaction 內或獨立呼叫皆可
 * @returns room id，若非 lighthouse 回 null
 */
export const ensureRoom = async (
  tx: TransactionClient | typeof prisma,
  cohortId: number,
  programKind?: string
): Promise<number | null> => {
  // 若已知 kind 且非 lighthouse，直接跳過
  if (programKind && programKind !== 'lighthouse') return null;

  // 若未傳 kind，查一次 program
  if (!programKind) {
    const cohort = await tx.cohorts.findUnique({
      where: { id: cohortId },
      select: { program: { select: { kind: true } } },
    });
    if (!cohort || cohort.program.kind !== 'lighthouse') return null;
  }

  // INSERT ... ON CONFLICT DO NOTHING + SELECT
  await tx.$executeRaw`
    INSERT INTO chat_rooms (cohort_id) VALUES (${cohortId})
    ON CONFLICT (cohort_id) DO NOTHING
  `;
  const room = await tx.chat_rooms.findUnique({
    where: { cohort_id: cohortId },
    select: { id: true },
  });
  return room?.id ?? null;
};

/**
 * 寫入系統訊息（成員加入/退出）+ 更新 last_message_at
 * Best-effort：外部應 try/catch
 */
export const appendSystemMessage = async (
  cohortId: number,
  event: ChatSystemEvent,
  user: { id: number; nickname: string | null }
): Promise<void> => {
  const room = await prisma.chat_rooms.findUnique({
    where: { cohort_id: cohortId },
    select: { id: true },
  });
  if (!room) return; // 非 lighthouse 或尚未建立，靜默跳過

  const bodyMap: Record<ChatSystemEvent, string> = {
    [CHAT_SYSTEM_EVENTS.MEMBER_JOINED]: `${user.nickname ?? '島民'} 加入了聊天室`,
  };

  const now = new Date();
  await prisma.chat_messages.create({
    data: {
      room_id: room.id,
      sender_user_id: null,
      kind: CHAT_MESSAGE_KINDS.SYSTEM,
      body: bodyMap[event],
      metadata: { event, userId: user.id, nickname: user.nickname } as Prisma.InputJsonValue,
      created_at: now,
      updated_at: now,
    },
  });
  await prisma.chat_rooms.update({
    where: { id: room.id },
    data: { last_message_at: now },
  });
};

/**
 * 我的聊天室列表
 * enrollment ∪ org member 的 lighthouse cohort
 * 含 unreadCount、totalUnread、lastMessage、iconLabel、colorSeed
 */
export const listMyRooms = async (userId: number) => {
  // 先找出 userId 可存取的 lighthouse cohort id 集合
  const [enrolledCohorts, orgMemberCohorts] = await Promise.all([
    prisma.cohort_enrollments.findMany({
      where: { user_id: userId, status: 'joined', cohort: { program: { kind: 'lighthouse', deleted_at: null, organization: { status: 'active' } } } },
      select: { cohort_id: true },
    }),
    // 組織成員可存取的 cohort
    prisma.cohorts.findMany({
      where: {
        program: {
          kind: 'lighthouse',
          deleted_at: null,
          organization: {
            status: 'active',
            organization_members: { some: { user_id: userId } },
          },
        },
      },
      select: { id: true },
    }),
  ]);

  const cohortIds = [...new Set([
    ...enrolledCohorts.map(e => e.cohort_id),
    ...orgMemberCohorts.map(c => c.id),
  ])];

  if (cohortIds.length === 0) return { totalUnread: 0, items: [] };

  // 確保所有 cohort 都有 room（lazy 補建）
  for (const cohortId of cohortIds) {
    await ensureRoom(prisma, cohortId, 'lighthouse');
  }

  // 取得 rooms + cohort 資訊
  const rooms = await prisma.chat_rooms.findMany({
    where: { cohort_id: { in: cohortIds } },
    select: {
      id: true,
      cohort_id: true,
      last_message_at: true,
      created_at: true,
      cohort: {
        select: {
          display_name: true,
          status: true,
          program: { select: { organization: { select: { name: true } } } },
        },
      },
    },
    orderBy: { last_message_at: { sort: 'desc', nulls: 'last' } },
  });

  if (rooms.length === 0) return { totalUnread: 0, items: [] };

  const roomIds = rooms.map(r => r.id);

  // 取得最後一則訊息（per room）
  // 用一次查詢取每室最新未刪除訊息
  const lastMessages = await prisma.$queryRaw<Array<{
    room_id: number;
    id: number;
    kind: string;
    body: string;
    sender_user_id: number | null;
    sender_nickname: string | null;
    created_at: Date;
  }>>`
    SELECT DISTINCT ON (m.room_id)
      m.room_id, m.id, m.kind, m.body, m.sender_user_id,
      u.nickname AS sender_nickname, m.created_at
    FROM chat_messages m
    LEFT JOIN users u ON u.id = m.sender_user_id
    WHERE m.room_id IN (${Prisma.join(roomIds)})
      AND m.deleted_at IS NULL
    ORDER BY m.room_id, m.id DESC
  `;
  const lastMsgMap = new Map(lastMessages.map(m => [m.room_id, m]));

  // 計算未讀數（per room）
  const unreadCounts = await prisma.$queryRaw<Array<{ room_id: number; cnt: bigint }>>`
    SELECT m.room_id, COUNT(*)::bigint AS cnt
    FROM chat_messages m
    LEFT JOIN chat_room_reads r ON r.room_id = m.room_id AND r.user_id = ${userId}
    WHERE m.room_id IN (${Prisma.join(roomIds)})
      AND m.deleted_at IS NULL
      AND m.id > COALESCE(r.last_read_message_id, 0)
      AND (m.sender_user_id IS NULL OR m.sender_user_id <> ${userId})
    GROUP BY m.room_id
  `;
  const unreadMap = new Map(unreadCounts.map(r => [r.room_id, Number(r.cnt)]));

  // 計算成員數（per cohort）
  const memberCounts = await prisma.$queryRaw<Array<{ cohort_id: number; cnt: bigint }>>`
    SELECT e.cohort_id, COUNT(DISTINCT
      CASE WHEN e.user_id IS NOT NULL THEN e.user_id END
    )::bigint AS cnt
    FROM cohort_enrollments e
    WHERE e.cohort_id IN (${Prisma.join(cohortIds)})
      AND e.status = 'joined'
    GROUP BY e.cohort_id
  `;
  // 加上 org members
  const orgMemberCounts = await prisma.$queryRaw<Array<{ cohort_id: number; cnt: bigint }>>`
    SELECT c.id AS cohort_id, COUNT(DISTINCT om.user_id)::bigint AS cnt
    FROM cohorts c
    JOIN programs p ON p.id = c.program_id
    JOIN organization_members om ON om.organization_id = p.organization_id
    WHERE c.id IN (${Prisma.join(cohortIds)})
    GROUP BY c.id
  `;
  const enrollmentCountMap = new Map(memberCounts.map(r => [r.cohort_id, Number(r.cnt)]));
  const orgMemberCountMap = new Map(orgMemberCounts.map(r => [r.cohort_id, Number(r.cnt)]));

  let totalUnread = 0;
  const items = rooms.map(room => {
    const unread = unreadMap.get(room.id) ?? 0;
    totalUnread += unread;

    const lastMsg = lastMsgMap.get(room.id);

    // 成員數：去重後的 enrolled + org members（enrollment 和 org member 可能重疊）
    const enrolledCount = enrollmentCountMap.get(room.cohort_id) ?? 0;
    const orgCount = orgMemberCountMap.get(room.cohort_id) ?? 0;
    // 簡化：取兩者之和的近似值（精確去重代價大，列表場景可接受）
    const memberCount = enrolledCount + orgCount;

    const name = room.cohort.display_name;
    return {
      id: room.id,
      cohortId: room.cohort_id,
      name,
      iconLabel: name.charAt(0),
      colorSeed: room.id,
      organizationName: room.cohort.program.organization.name,
      memberCount,
      unreadCount: unread,
      lastMessage: lastMsg
        ? {
            id: lastMsg.id,
            kind: lastMsg.kind,
            bodyPreview: lastMsg.body.length > 50 ? lastMsg.body.slice(0, 50) + '...' : lastMsg.body,
            authorName: lastMsg.sender_nickname,
            isMine: lastMsg.sender_user_id === userId,
            createdAt: lastMsg.created_at.toISOString(),
          }
        : null,
      lastActivityAt: (room.last_message_at ?? room.created_at).toISOString(),
    };
  });

  return { totalUnread, items };
};

/**
 * 取得單一聊天室詳情
 */
export const getRoom = async (access: RoomAccess, userId: number) => {
  const room = await prisma.chat_rooms.findUnique({
    where: { id: access.roomId },
    select: {
      id: true,
      cohort_id: true,
      last_message_at: true,
      cohort: {
        select: {
          display_name: true,
          status: true,
          program: { select: { organization: { select: { name: true } } } },
        },
      },
    },
  });
  if (!room) throw new NotFoundError('找不到聊天室');

  // 成員數
  const [enrolledCount, orgMemberCount] = await Promise.all([
    prisma.cohort_enrollments.count({
      where: { cohort_id: access.cohortId, status: 'joined', user_id: { not: null } },
    }),
    prisma.organization_members.count({
      where: { organization_id: (await prisma.cohorts.findUnique({ where: { id: access.cohortId }, select: { program: { select: { organization_id: true } } } }))!.program.organization_id },
    }),
  ]);
  const memberCount = enrolledCount + orgMemberCount;

  // 置頂數
  const pinnedCount = await prisma.chat_messages.count({
    where: { room_id: access.roomId, pinned_at: { not: null }, deleted_at: null },
  });

  // 未讀數
  const readRecord = await prisma.chat_room_reads.findUnique({
    where: { room_id_user_id: { room_id: access.roomId, user_id: userId } },
    select: { last_read_message_id: true },
  });
  const lastReadId = readRecord?.last_read_message_id ?? 0;
  const unreadCount = await prisma.chat_messages.count({
    where: {
      room_id: access.roomId,
      deleted_at: null,
      id: { gt: lastReadId },
      OR: [{ sender_user_id: null }, { sender_user_id: { not: userId } }],
    },
  });

  // 成員預覽（前 3 位）
  const memberPreviewRows = await prisma.cohort_enrollments.findMany({
    where: { cohort_id: access.cohortId, status: 'joined', user_id: { not: null } },
    select: { user: { select: { nickname: true, contacts: { select: { photo_url: true } } } } },
    take: 3,
    orderBy: { joined_at: 'asc' },
  });
  const memberPreview = memberPreviewRows.map(r => ({
    nickname: r.user?.nickname ?? null,
    avatar: r.user?.contacts?.photo_url ?? null,
  }));

  const name = room.cohort.display_name;
  return {
    id: room.id,
    cohortId: room.cohort_id,
    name,
    iconLabel: name.charAt(0),
    colorSeed: room.id,
    organizationName: room.cohort.program.organization.name,
    memberCount,
    unreadCount,
    lastMessage: null as null, // detail 端點不重複帶 lastMessage
    lastActivityAt: (room.last_message_at ?? new Date()).toISOString(),
    viewerRole: access.isHost ? ('host' as const) : ('member' as const),
    pinnedCount,
    memberPreview,
  };
};

/**
 * 列出聊天室成員（含在線狀態）
 */
export const listMembers = async (access: RoomAccess) => {
  const hostIds = await chatAclService.listHostUserIds(access.cohortId);

  // enrolled members
  const enrolled = await prisma.cohort_enrollments.findMany({
    where: { cohort_id: access.cohortId, status: 'joined', user_id: { not: null } },
    select: {
      user_id: true,
      user: {
        select: {
          nickname: true,
          basic_info: { select: { self_introduction: true } },
          contacts: { select: { photo_url: true } },
        },
      },
    },
  });

  // org members
  const orgId = (await prisma.cohorts.findUnique({
    where: { id: access.cohortId },
    select: { program: { select: { organization_id: true } } },
  }))!.program.organization_id;

  const orgMembers = await prisma.organization_members.findMany({
    where: { organization_id: orgId },
    select: {
      user_id: true,
      user: {
        select: {
          nickname: true,
          basic_info: { select: { self_introduction: true } },
          contacts: { select: { photo_url: true } },
        },
      },
    },
  });

  // 合併去重
  const memberMap = new Map<number, { userId: number; nickname: string | null; avatar: string | null; bio: string | null }>();
  for (const row of enrolled) {
    if (row.user_id !== null) {
      memberMap.set(row.user_id, {
        userId: row.user_id,
        nickname: row.user?.nickname ?? null,
        avatar: row.user?.contacts?.photo_url ?? null,
        bio: row.user?.basic_info?.self_introduction ?? null,
      });
    }
  }
  for (const row of orgMembers) {
    if (!memberMap.has(row.user_id)) {
      memberMap.set(row.user_id, {
        userId: row.user_id,
        nickname: row.user?.nickname ?? null,
        avatar: row.user?.contacts?.photo_url ?? null,
        bio: row.user?.basic_info?.self_introduction ?? null,
      });
    }
  }

  const allMembers = Array.from(memberMap.values());
  const allUserIds = allMembers.map(m => m.userId);

  // 在線狀態
  const onlineSet = await chatPresenceService.getOnlineSet(access.roomId, allUserIds);

  return allMembers.map(m => ({
    userId: m.userId,
    nickname: m.nickname,
    avatar: m.avatar,
    isHost: hostIds.has(m.userId),
    isOnline: onlineSet.has(m.userId),
    bio: m.bio,
  }));
};

/**
 * 標記已讀（只前進，已讀游標不會倒退）
 */
export const markRead = async (roomId: number, userId: number, lastReadMessageId: number) => {
  // 驗證 message 存在且屬於此 room
  const msg = await prisma.chat_messages.findFirst({
    where: { id: lastReadMessageId, room_id: roomId },
    select: { id: true },
  });
  if (!msg) throw new BadRequestError('指定的訊息不存在於此聊天室');

  // UPSERT with GREATEST to only advance
  await prisma.$executeRaw`
    INSERT INTO chat_room_reads (room_id, user_id, last_read_message_id, last_read_at)
    VALUES (${roomId}, ${userId}, ${lastReadMessageId}, NOW())
    ON CONFLICT (room_id, user_id)
    DO UPDATE SET
      last_read_message_id = GREATEST(chat_room_reads.last_read_message_id, ${lastReadMessageId}),
      last_read_at = NOW()
  `;

  return { lastReadMessageId, unreadCount: 0 };
};

export const chatRoomService = { ensureRoom, appendSystemMessage, listMyRooms, getRoom, listMembers, markRead };
