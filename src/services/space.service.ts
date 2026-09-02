import type { space_blocks, space_home_pages, spaces } from '../../generated/prisma';
import { Prisma } from '../../generated/prisma';
import { prisma } from './database/prisma.service';
import { PROGRAM_KINDS } from '../constants/program-kind';
import { deriveRunStatus } from './cohort-run-state';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnprocessableEntityError,
} from '../middleware/error.middleware';
import type {
  BlockEventInput,
  CreateBlockInput,
  CreateHomePageInput,
  UpdateBlockInput,
} from '../validators/space.validators';

/** Practice statuses shown on space sub-page filter tabs (FR-4.2); archived is excluded. */
const SUBPAGE_PRACTICE_STATUSES = ['draft', 'not_started', 'active', 'completed'] as const;

const MEMBER_AVATAR_LIMIT = 3;

const memberAvatarSelect = {
  users: { select: { nickname: true, contacts: { select: { photo_url: true } } } },
} as const;

type MemberWithAvatar = { users: { nickname: string | null; contacts: { photo_url: string | null } | null } };

type BlockWithChildren = Prisma.space_blocksGetPayload<{
  include: {
    space_block_links: { include: { space_block_link_practices: { include: { practices: { select: { external_id: true; title: true } } } } } };
    space_block_events: true;
  };
}>;

const blockChildrenInclude = {
  space_block_links: {
    orderBy: { position: 'asc' },
    include: {
      space_block_link_practices: {
        include: { practices: { select: { external_id: true, title: true } } },
      },
    },
  },
  space_block_events: { orderBy: [{ start_date: 'asc' }, { id: 'asc' }] },
} as const satisfies Prisma.space_blocksInclude;

/** Default blocks seeded by the example template (FR-5.2); 公告 starts pinned (FR-6.7). */
const EXAMPLE_BLOCKS: Array<Pick<space_blocks, 'block_type' | 'title'> & { body?: string; is_pinned?: boolean }> = [
  { block_type: 'text', title: '公告', body: '這裡是置頂公告，重要訊息可以放在這裡讓大家第一眼看到。', is_pinned: true },
  { block_type: 'text', title: '歡迎詞', body: '歡迎加入這個空間！這段文字可以直接改寫成你想對大家說的話。' },
  { block_type: 'text', title: '這裡怎麼進行', body: '說明這個空間的進行方式，例如每週的節奏、要準備什麼、怎麼參與討論。' },
  { block_type: 'calendar', title: '日曆' },
  { block_type: 'resources', title: '資源' },
];

/** Format a Date column that holds a date-only value as YYYY-MM-DD. */
function toDateString(value: Date | null): string | null {
  return value ? value.toISOString().slice(0, 10) : null;
}

/** Format a Time(6) column value as HH:MM. */
function toTimeString(value: Date | null): string | null {
  return value ? value.toISOString().slice(11, 16) : null;
}

/** Parse an HH:MM string into the Date shape Prisma expects for Time(6) columns. */
function fromTimeString(value: string | null | undefined): Date | null {
  return value ? new Date(`1970-01-01T${value}:00.000Z`) : null;
}

function toAvatars(members: MemberWithAvatar[]): Array<{ nickname: string | null; avatar: string | null }> {
  return members.slice(0, MEMBER_AVATAR_LIMIT).map(member => ({
    nickname: member.users.nickname ?? null,
    avatar: member.users.contacts?.photo_url ?? null,
  }));
}

/**
 * Effective publish status: a scheduled block whose time has arrived is
 * treated as published everywhere (FR-7.6).
 */
export function effectivePublishStatus(
  block: Pick<space_blocks, 'publish_status' | 'scheduled_at'>,
  now = new Date(),
): 'draft' | 'scheduled' | 'published' {
  if (block.publish_status === 'scheduled' && block.scheduled_at && block.scheduled_at <= now) return 'published';
  return block.publish_status as 'draft' | 'scheduled' | 'published';
}

/** Order blocks for display: pinned first, then by position (FR-6.7). */
export function sortBlocksForDisplay<T extends Pick<space_blocks, 'position' | 'is_pinned'>>(blocks: T[]): T[] {
  return [...blocks].sort((a, b) => (Number(b.is_pinned) - Number(a.is_pinned)) || (a.position - b.position));
}

function serializeBlock(block: BlockWithChildren, now = new Date()) {
  return {
    id: block.id,
    blockType: block.block_type as 'text' | 'resources' | 'calendar',
    title: block.title,
    body: block.body,
    position: block.position,
    isPinned: block.is_pinned,
    publishStatus: effectivePublishStatus(block, now),
    scheduledAt: block.scheduled_at?.toISOString() ?? null,
    links: block.space_block_links.map(link => ({
      id: link.id,
      name: link.name,
      url: link.url,
      isNameCustomized: link.is_name_customized,
      practices: link.space_block_link_practices.flatMap(mapping =>
        mapping.practices.external_id ? [{ id: mapping.practices.external_id, title: mapping.practices.title }] : []),
    })),
    events: block.space_block_events.map(event => ({
      id: event.id,
      title: event.title,
      startDate: toDateString(event.start_date) as string,
      endDate: toDateString(event.end_date),
      startTime: toTimeString(event.start_time),
      endTime: toTimeString(event.end_time),
      location: event.location,
      url: event.url,
    })),
  };
}

/** Load an active space by external id or throw 404. */
async function requireSpace(externalId: string): Promise<spaces> {
  const space = await prisma.spaces.findFirst({ where: { external_id: externalId, deleted_at: null } });
  if (!space) throw new NotFoundError('空間不存在');
  return space;
}

/** Resolve the viewer's membership role, or null when not a member. */
async function findViewerRole(spaceId: number, userId: number): Promise<'host' | 'member' | null> {
  const membership = await prisma.space_members.findUnique({
    where: { space_id_user_id: { space_id: spaceId, user_id: userId } },
    select: { role: true },
  });
  return membership ? (membership.role as 'host' | 'member') : null;
}

/** Load a space the viewer belongs to, returning the viewer role alongside. */
async function requireMemberSpace(externalId: string, userId: number): Promise<{ space: spaces; viewerRole: 'host' | 'member' }> {
  const space = await requireSpace(externalId);
  const viewerRole = await findViewerRole(space.id, userId);
  if (!viewerRole) throw new ForbiddenError('僅空間成員可以存取');
  return { space, viewerRole };
}

/** Load a space the viewer hosts; block edit APIs are host-only (FR-6.1). */
async function requireHostSpace(externalId: string, userId: number): Promise<spaces> {
  const { space, viewerRole } = await requireMemberSpace(externalId, userId);
  if (viewerRole !== 'host') throw new ForbiddenError('僅發起人可以執行此操作');
  return space;
}

type EnrollmentWithCohort = {
  joined_at: Date | null;
  role: string;
  cohort: {
    id: number;
    display_name: string;
    start_date: Date;
    end_date: Date;
    program: { kind: string; organization: { name: string } };
    _count: { cohort_enrollments: number };
    cohort_enrollments: Array<{ user: MemberWithAvatar['users'] | null }>;
    practices: Array<{ status: string | null; updated_at: Date | null; created_at: Date | null }>;
  };
};

const latestDate = (dates: Array<Date | null | undefined>): Date | null =>
  dates.reduce<Date | null>((latest, value) => (value && (!latest || value > latest) ? value : latest), null);

/** 由我在該期的實踐推導活動時間：最近一次實踐更新，無實踐則退回加入時間 */
const enrollmentActivityAt = (enrollment: EnrollmentWithCohort): Date | null =>
  latestDate(enrollment.cohort.practices.flatMap(practice => [practice.updated_at, practice.created_at])) ?? enrollment.joined_at;

/**
 * The aggregated "你的空間" list (FR-1.2): personal practices → platform
 * challenge → joined event-course cohorts ordered by recent activity.
 * 共同挑戰卡與活動課程卡皆由 cohort_enrollments（status=joined）聚合；
 * 活動課程卡的 id 為 cohortId 字串，前端導向 /cohorts/[cohortId]。
 */
async function listMySpaces(userId: number) {
  const [personalCounts, enrollments] = await Promise.all([
    prisma.practices.groupBy({
      by: ['status'],
      where: { user_id: userId, deleted_at: null, status: { in: [...SUBPAGE_PRACTICE_STATUSES] } },
      _count: { _all: true },
    }),
    prisma.cohort_enrollments.findMany({
      where: { user_id: userId, status: 'joined', cohort: { program: { deleted_at: null } } },
      select: {
        joined_at: true,
        role: true,
        cohort: {
          select: {
            id: true,
            display_name: true,
            start_date: true,
            end_date: true,
            program: { select: { kind: true, organization: { select: { name: true } } } },
            _count: { select: { cohort_enrollments: { where: { status: 'joined' } } } },
            cohort_enrollments: {
              where: { status: 'joined', user_id: { not: null } },
              orderBy: { joined_at: 'asc' },
              take: MEMBER_AVATAR_LIMIT,
              select: { user: memberAvatarSelect.users },
            },
            practices: {
              where: { user_id: userId, deleted_at: null, status: { in: [...SUBPAGE_PRACTICE_STATUSES] } },
              select: { status: true, updated_at: true, created_at: true },
            },
          },
        },
      },
    }) as unknown as Promise<EnrollmentWithCohort[]>,
  ]);

  const personalTotal = personalCounts.reduce((sum, row) => sum + row._count._all, 0);
  const personalActive = personalCounts.some(row => row.status === 'active' && row._count._all > 0);

  const avatarsOf = (enrollment: EnrollmentWithCohort) =>
    toAvatars(enrollment.cohort.cohort_enrollments.flatMap(member => (member.user ? [{ users: member.user }] : [])));
  const hasActive = (enrollment: EnrollmentWithCohort) => enrollment.cohort.practices.some(practice => practice.status === 'active');

  const challengeEnrollments = enrollments.filter(enrollment => enrollment.cohort.program.kind === PROGRAM_KINDS.CHALLENGE);
  const eventEnrollments = enrollments.filter(enrollment => enrollment.cohort.program.kind === PROGRAM_KINDS.LIGHTHOUSE);

  // 共同挑戰卡：以進行中的挑戰為主；沒有進行中的就取最近一檔（依開始日）
  const now = new Date();
  const ongoingChallenges = challengeEnrollments.filter(
    enrollment => deriveRunStatus(enrollment.cohort.start_date, enrollment.cohort.end_date, now) === 'ongoing'
  );
  const featuredChallenges = ongoingChallenges.length > 0
    ? ongoingChallenges
    : [...challengeEnrollments].sort((a, b) => b.cohort.start_date.getTime() - a.cohort.start_date.getTime()).slice(0, 1);

  const eventSpaces = eventEnrollments
    .map(enrollment => ({ enrollment, activityAt: enrollmentActivityAt(enrollment) }))
    .sort((a, b) => (b.activityAt?.getTime() ?? 0) - (a.activityAt?.getTime() ?? 0))
    .map(({ enrollment, activityAt }) => ({
      kind: 'event_course' as const,
      id: String(enrollment.cohort.id),
      name: enrollment.cohort.display_name,
      host: enrollment.cohort.program.organization.name,
      memberCount: enrollment.cohort._count.cohort_enrollments,
      memberAvatars: avatarsOf(enrollment),
      hasActivePractice: hasActive(enrollment),
      practiceCount: enrollment.cohort.practices.length,
      isHost: enrollment.role === 'owner' || enrollment.role === 'assistant',
      lastActivityAt: activityAt?.toISOString() ?? null,
    }));

  const items = [
    {
      kind: 'personal' as const,
      id: null,
      name: '個人實踐',
      host: '我的島',
      memberCount: 1,
      memberAvatars: [],
      hasActivePractice: personalActive,
      practiceCount: personalTotal,
      isHost: true,
      lastActivityAt: null,
    },
    {
      kind: 'challenge' as const,
      id: null,
      name: '共同挑戰',
      host: '島島阿學',
      memberCount: featuredChallenges.reduce((sum, enrollment) => sum + enrollment.cohort._count.cohort_enrollments, 0),
      memberAvatars: featuredChallenges[0] ? avatarsOf(featuredChallenges[0]) : [],
      hasActivePractice: challengeEnrollments.some(hasActive),
      practiceCount: challengeEnrollments.reduce((sum, enrollment) => sum + enrollment.cohort.practices.length, 0),
      isHost: false,
      lastActivityAt: latestDate(challengeEnrollments.map(enrollmentActivityAt))?.toISOString() ?? null,
    },
    ...eventSpaces,
  ];

  return { total: items.length, items };
}

/** Space header payload for the event-course sub-page (FR-4.1). */
async function getSpaceDetail(userId: number, externalId: string) {
  const { space, viewerRole } = await requireMemberSpace(externalId, userId);
  const [members, practiceCount, publishedBlockCount, homePage] = await Promise.all([
    prisma.space_members.findMany({
      where: { space_id: space.id },
      orderBy: { joined_at: 'asc' },
      include: { users: memberAvatarSelect.users },
    }),
    prisma.space_practices.count({ where: { space_id: space.id, practices: { deleted_at: null } } }),
    prisma.space_blocks.count({
      where: {
        // 首頁仍是草稿時公開連結不會露出任何區塊，計數須同步為 0
        space_home_pages: { space_id: space.id, status: 'published' },
        OR: [
          { publish_status: 'published' },
          { publish_status: 'scheduled', scheduled_at: { lte: new Date() } },
        ],
      },
    }),
    prisma.space_home_pages.findUnique({ where: { space_id: space.id }, select: { status: true } }),
  ]);

  return {
    id: space.external_id,
    name: space.name,
    subtitle: space.subtitle,
    memberCount: members.length,
    memberAvatars: toAvatars(members as unknown as MemberWithAvatar[]),
    practiceCount,
    viewerRole,
    homePage: homePage ? { status: homePage.status as 'draft' | 'published' } : null,
    publicToken: viewerRole === 'host' ? space.public_token : null,
    publicBlockCount: viewerRole === 'host' ? publishedBlockCount : null,
  };
}

/** Full roster for the members modal (FR-1.3). */
async function listMembers(userId: number, externalId: string) {
  const { space } = await requireMemberSpace(externalId, userId);
  const members = await prisma.space_members.findMany({
    where: { space_id: space.id },
    // 'host' sorts before 'member' ascending, keeping the initiator on top.
    orderBy: [{ role: 'asc' }, { joined_at: 'asc' }],
    include: { users: memberAvatarSelect.users },
  });
  return members.map(member => ({
    userId: member.user_id,
    nickname: member.users.nickname ?? null,
    avatar: member.users.contacts?.photo_url ?? null,
    isHost: member.role === 'host',
  }));
}

/** Practice cards inside a space; the status filter runs client-side (FR-4.3). */
async function listSpacePractices(userId: number, externalId: string) {
  const { space } = await requireMemberSpace(externalId, userId);
  const rows = await prisma.space_practices.findMany({
    where: {
      space_id: space.id,
      practices: { deleted_at: null, status: { in: [...SUBPAGE_PRACTICE_STATUSES] } },
    },
    orderBy: { created_at: 'desc' },
    include: {
      practices: {
        select: {
          external_id: true,
          title: true,
          status: true,
          progress_percentage: true,
          theme_color: true,
          start_date: true,
          end_date: true,
          duration_days: true,
          users: { select: { nickname: true } },
        },
      },
    },
  });
  return rows.flatMap(row => row.practices.external_id === null ? [] : [{
    id: row.practices.external_id,
    title: row.practices.title,
    status: row.practices.status ?? 'draft',
    progressPercentage: row.practices.progress_percentage === null ? null : Number(row.practices.progress_percentage),
    themeColor: row.practices.theme_color,
    startDate: toDateString(row.practices.start_date),
    endDate: toDateString(row.practices.end_date),
    durationDays: row.practices.duration_days,
    ownerNickname: row.practices.users.nickname ?? null,
  }]);
}

/**
 * Create the home page from a template (FR-3.4/3.7); the page always starts
 * as a draft only the host can see.
 */
async function createHomePage(userId: number, externalId: string, input: CreateHomePageInput) {
  const space = await requireHostSpace(externalId, userId);
  const existing = await prisma.space_home_pages.findUnique({ where: { space_id: space.id } });
  if (existing) throw new BadRequestError('空間首頁已存在');

  await prisma.space_home_pages.create({
    data: {
      space_id: space.id,
      status: 'draft',
      created_by: userId,
      space_blocks: input.template === 'example'
        ? {
            create: EXAMPLE_BLOCKS.map((block, index) => ({
              block_type: block.block_type,
              title: block.title,
              body: block.body ?? null,
              position: index,
              is_pinned: block.is_pinned ?? false,
              publish_status: 'published',
              published_at: new Date(),
            })),
          }
        : undefined,
    },
  });
  return getHomePage(userId, externalId);
}

/**
 * Home page with viewer-filtered blocks: the host sees everything with
 * status badges; members never see drafts or pending schedules (FR-7.2).
 * Returns null when the page does not exist or is hidden from the viewer.
 */
async function getHomePage(userId: number, externalId: string) {
  const { space, viewerRole } = await requireMemberSpace(externalId, userId);
  return loadHomePageForViewer(space.id, viewerRole);
}

async function loadHomePageForViewer(spaceId: number, viewerRole: 'host' | 'member') {
  const page = await prisma.space_home_pages.findUnique({
    where: { space_id: spaceId },
    include: { space_blocks: { orderBy: { position: 'asc' }, include: blockChildrenInclude } },
  });
  if (!page) return null;
  if (page.status === 'draft' && viewerRole !== 'host') return null;

  const now = new Date();
  const visibleBlocks = sortBlocksForDisplay(page.space_blocks)
    .filter(block => viewerRole === 'host' || effectivePublishStatus(block, now) === 'published');
  return {
    status: page.status as 'draft' | 'published',
    blocks: visibleBlocks.map(block => serializeBlock(block, now)),
  };
}

/** Publish the page (FR-4.2); v0.1 has no way back to draft (FR-4.5). */
async function publishHomePage(userId: number, externalId: string) {
  const space = await requireHostSpace(externalId, userId);
  const page = await prisma.space_home_pages.findUnique({ where: { space_id: space.id } });
  if (!page) throw new NotFoundError('空間首頁不存在');
  if (page.status === 'published') throw new BadRequestError('頁面已發佈');
  await prisma.space_home_pages.update({
    where: { id: page.id },
    data: { status: 'published', published_at: new Date(), updated_at: new Date() },
  });
  return loadHomePageForViewer(space.id, 'host');
}

/** Load a block via the host's space or throw. */
async function requireHostBlock(userId: number, externalId: string, blockId: number): Promise<{ space: spaces; page: space_home_pages; block: BlockWithChildren }> {
  const space = await requireHostSpace(externalId, userId);
  const page = await prisma.space_home_pages.findUnique({ where: { space_id: space.id } });
  if (!page) throw new NotFoundError('空間首頁不存在');
  const block = await prisma.space_blocks.findFirst({
    where: { id: blockId, page_id: page.id },
    include: blockChildrenInclude,
  });
  if (!block) throw new NotFoundError('區塊不存在');
  return { space, page, block };
}

/** Append a draft block of the given type (FR-5.4/5.5). */
async function createBlock(userId: number, externalId: string, input: CreateBlockInput) {
  const space = await requireHostSpace(externalId, userId);
  const page = await prisma.space_home_pages.findUnique({ where: { space_id: space.id } });
  if (!page) throw new NotFoundError('空間首頁不存在');

  const maxPosition = await prisma.space_blocks.aggregate({
    where: { page_id: page.id },
    _max: { position: true },
  });
  const created = await prisma.space_blocks.create({
    data: {
      page_id: page.id,
      block_type: input.blockType,
      title: input.blockType === 'text' ? '新的區塊標題' : '',
      position: (maxPosition._max.position ?? -1) + 1,
      publish_status: 'draft',
      // A new calendar block starts with one blank row; resources start empty (FR-5.7).
      space_block_events: input.blockType === 'calendar'
        ? { create: [{ title: '', start_date: new Date(new Date().toISOString().slice(0, 10)) }] }
        : undefined,
    },
    include: blockChildrenInclude,
  });
  return serializeBlock(created);
}

/** Blur-save a block's content; child rows are replaced wholesale (FR-6.10). */
async function updateBlock(userId: number, externalId: string, blockId: number, input: UpdateBlockInput) {
  const { space, block } = await requireHostBlock(userId, externalId, blockId);
  if (input.body !== undefined && block.block_type !== 'text') throw new BadRequestError('僅自由文字區塊可編輯內文');
  if (input.links !== undefined && block.block_type !== 'resources') throw new BadRequestError('僅資源連結區塊可編輯連結');
  if (input.events !== undefined && block.block_type !== 'calendar') throw new BadRequestError('僅日曆區塊可編輯活動');
  if (input.isPinned === false && !block.is_pinned) throw new BadRequestError('區塊未釘選');

  const practiceExternalIds = [...new Set((input.links ?? []).flatMap(link => link.practiceIds))];
  const practiceRows = practiceExternalIds.length > 0
    ? await prisma.practices.findMany({
        // 只允許標記本空間內的實踐，避免任意 UUID 讓成員/公開頁洩漏他處實踐標題
        where: {
          external_id: { in: practiceExternalIds },
          deleted_at: null,
          space_practices: { some: { space_id: space.id } },
        },
        select: { id: true, external_id: true },
      })
    : [];
  const practiceIdByExternal = new Map(practiceRows.map(row => [row.external_id as string, row.id]));

  await prisma.$transaction(async tx => {
    await tx.space_blocks.update({
      where: { id: block.id },
      data: {
        title: input.title ?? undefined,
        body: input.body !== undefined ? input.body : undefined,
        is_pinned: input.isPinned === false ? false : undefined,
        updated_at: new Date(),
      },
    });
    if (input.links !== undefined) {
      await tx.space_block_links.deleteMany({ where: { block_id: block.id } });
      for (const [index, link] of input.links.entries()) {
        await tx.space_block_links.create({
          data: {
            block_id: block.id,
            name: link.name,
            url: link.url,
            is_name_customized: link.isNameCustomized,
            position: index,
            space_block_link_practices: {
              create: link.practiceIds.flatMap(id => {
                const practiceId = practiceIdByExternal.get(id);
                return practiceId === undefined ? [] : [{ practice_id: practiceId }];
              }),
            },
          },
        });
      }
    }
    if (input.events !== undefined) {
      await tx.space_block_events.deleteMany({ where: { block_id: block.id } });
      if (input.events.length > 0) {
        await tx.space_block_events.createMany({
          data: input.events.map((event: BlockEventInput) => ({
            block_id: block.id,
            title: event.title,
            start_date: new Date(event.startDate),
            end_date: event.endDate ? new Date(event.endDate) : null,
            start_time: fromTimeString(event.startTime),
            end_time: fromTimeString(event.endTime),
            location: event.location ?? null,
            url: event.url ?? null,
          })),
        });
      }
    }
  });

  const updated = await prisma.space_blocks.findUniqueOrThrow({ where: { id: block.id }, include: blockChildrenInclude });
  return serializeBlock(updated);
}

/**
 * Swap positions with the neighboring block (FR-6.6); pinned blocks neither
 * move nor get displaced (FR-6.7).
 */
async function moveBlock(userId: number, externalId: string, blockId: number, direction: 'up' | 'down') {
  const { page, block } = await requireHostBlock(userId, externalId, blockId);
  if (block.is_pinned) throw new BadRequestError('釘選中的公告無法移動');

  const neighbor = await prisma.space_blocks.findFirst({
    where: {
      page_id: page.id,
      is_pinned: false,
      position: direction === 'up' ? { lt: block.position } : { gt: block.position },
    },
    orderBy: { position: direction === 'up' ? 'desc' : 'asc' },
  });
  if (!neighbor) throw new BadRequestError(direction === 'up' ? '已在最上方' : '已在最下方');

  await prisma.$transaction([
    prisma.space_blocks.update({ where: { id: block.id }, data: { position: neighbor.position, updated_at: new Date() } }),
    prisma.space_blocks.update({ where: { id: neighbor.id }, data: { position: block.position, updated_at: new Date() } }),
  ]);
  const moved = await prisma.space_blocks.findUniqueOrThrow({ where: { id: block.id }, include: blockChildrenInclude });
  return serializeBlock(moved);
}

/**
 * Publish now or schedule (FR-7.4–7.6). Publishing clears any schedule; a
 * past scheduled time publishes immediately.
 */
async function publishBlock(userId: number, externalId: string, blockId: number, scheduledAt?: string) {
  const { block } = await requireHostBlock(userId, externalId, blockId);
  const now = new Date();
  const scheduleDate = scheduledAt ? new Date(scheduledAt) : null;
  const publishesNow = !scheduleDate || scheduleDate <= now;

  const updated = await prisma.space_blocks.update({
    where: { id: block.id },
    data: publishesNow
      ? { publish_status: 'published', scheduled_at: null, published_at: now, updated_at: now }
      : { publish_status: 'scheduled', scheduled_at: scheduleDate, published_at: null, updated_at: now },
    include: blockChildrenInclude,
  });
  return serializeBlock(updated);
}

/** Save as draft; published blocks cannot go back in v0.1 (FR-7.8). */
async function draftBlock(userId: number, externalId: string, blockId: number) {
  const { block } = await requireHostBlock(userId, externalId, blockId);
  if (effectivePublishStatus(block) === 'published') {
    throw new UnprocessableEntityError('已發佈的區塊無法退回草稿');
  }
  const updated = await prisma.space_blocks.update({
    where: { id: block.id },
    data: { publish_status: 'draft', scheduled_at: null, updated_at: new Date() },
    include: blockChildrenInclude,
  });
  return serializeBlock(updated);
}

/** Delete a block and its children after the confirm dialog (FR-6.8/6.9). */
async function deleteBlock(userId: number, externalId: string, blockId: number) {
  const { block } = await requireHostBlock(userId, externalId, blockId);
  await prisma.space_blocks.delete({ where: { id: block.id } });
}

/**
 * Public guest view resolved from the share token (FR-1.4): the member-level
 * payload without any host-only fields, no authentication required.
 */
async function getPublicSpace(token: string) {
  const space = await prisma.spaces.findFirst({
    where: { public_token: token, deleted_at: null, status: 'active' },
  });
  if (!space) throw new NotFoundError('空間不存在');

  const [members, practiceCount, homePage] = await Promise.all([
    prisma.space_members.findMany({
      where: { space_id: space.id },
      orderBy: { joined_at: 'asc' },
      include: { users: memberAvatarSelect.users },
    }),
    prisma.space_practices.count({ where: { space_id: space.id, practices: { deleted_at: null } } }),
    loadHomePageForViewer(space.id, 'member'),
  ]);

  return {
    id: space.external_id,
    name: space.name,
    subtitle: space.subtitle,
    memberCount: members.length,
    memberAvatars: toAvatars(members as unknown as MemberWithAvatar[]),
    practiceCount,
    homePage,
  };
}

export const spaceService = {
  listMySpaces,
  getSpaceDetail,
  listMembers,
  listSpacePractices,
  createHomePage,
  getHomePage,
  publishHomePage,
  createBlock,
  updateBlock,
  moveBlock,
  publishBlock,
  draftBlock,
  deleteBlock,
  getPublicSpace,
};
