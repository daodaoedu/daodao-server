import { z } from 'zod';
import { apiSuccessResponseSchema } from './api-response.validators';

/** Space kinds surfaced on the space list; challenge/event_course are aggregated from cohort_enrollments. */
export const SPACE_KINDS = ['personal', 'challenge', 'event_course'] as const;

/** Block types supported by the space home page (FR-5.3). */
export const SPACE_BLOCK_TYPES = ['text', 'resources', 'calendar'] as const;

/** Per-block publish lifecycle states (FR-7.1). */
export const SPACE_BLOCK_PUBLISH_STATUSES = ['draft', 'scheduled', 'published'] as const;

const uuidSchema = z.uuid();

export const spaceIdParamSchema = z.object({
  id: uuidSchema.openapi({ description: '空間 UUID（external_id）', example: '550e8400-e29b-41d4-a716-446655440000' }),
}).openapi('SpaceIdParam');

export const spaceBlockParamSchema = z.object({
  id: uuidSchema.openapi({ description: '空間 UUID（external_id）', example: '550e8400-e29b-41d4-a716-446655440000' }),
  blockId: z.coerce.number().int().positive().openapi({ description: '區塊 ID', example: 12 }),
}).openapi('SpaceBlockParam');

export const spacePublicTokenParamSchema = z.object({
  token: uuidSchema.openapi({ description: '空間公開連結 token', example: '550e8400-e29b-41d4-a716-446655440000' }),
}).openapi('SpacePublicTokenParam');

/** Create the space home page from a template choice (FR-3.4). */
export const createHomePageSchema = z.object({
  template: z.enum(['example', 'blank']).openapi({ description: '起始方式：example（帶範例區塊）或 blank（空白頁）', example: 'example' }),
}).openapi('CreateSpaceHomePage');

/** Append a new block of the given type to the page (FR-5.3/5.4). */
export const createBlockSchema = z.object({
  blockType: z.enum(SPACE_BLOCK_TYPES).openapi({ description: '區塊型別：text（自由文字）、resources（資源連結）、calendar（日曆）', example: 'text' }),
}).openapi('CreateSpaceBlock');

const blockLinkInputSchema = z.object({
  name: z.string().max(200).default('').openapi({ description: '連結名稱', example: 'Google 文件' }),
  url: z.string().max(2048).min(1).openapi({ description: '連結網址', example: 'https://docs.google.com/document/d/abc' }),
  isNameCustomized: z.boolean().default(false).openapi({ description: '發起人是否自訂過名稱（FR-8.6）', example: false }),
  practiceIds: z.array(uuidSchema).max(50).default([]).openapi({ description: '對應實踐的 UUID 多選（FR-8.8）', example: [] }),
}).openapi('SpaceBlockLinkInput');

const blockEventInputSchema = z.object({
  title: z.string().max(200).default('').openapi({ description: '活動標題', example: '第一次線上聚會' }),
  startDate: z.iso.date().openapi({ description: '開始日期（必填）', example: '2026-09-01' }),
  endDate: z.iso.date().nullable().optional().openapi({ description: '結束日期（選填）', example: '2026-09-02' }),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, '時間格式須為 HH:MM').nullable().optional().openapi({ description: '開始時間 HH:MM（選填）', example: '19:30' }),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, '時間格式須為 HH:MM').nullable().optional().openapi({ description: '結束時間 HH:MM（選填）', example: '21:00' }),
  location: z.string().max(200).nullable().optional().openapi({ description: '地點（選填）', example: '線上' }),
  url: z.string().max(2048).nullable().optional().openapi({ description: '連結（選填）', example: 'https://meet.google.com/abc-defg-hij' }),
}).openapi('SpaceBlockEventInput');

/**
 * Blur-save payload for a block: scalar fields plus full child-row
 * replacement for resources/calendar blocks (FR-6.10).
 */
export const updateBlockSchema = z.object({
  title: z.string().max(200).optional().openapi({ description: '區塊標題' }),
  body: z.string().nullable().optional().openapi({ description: '自由文字內文（僅 text 型別）' }),
  isPinned: z.literal(false).optional().openapi({ description: '解除公告釘選；單向操作，只接受 false（FR-6.7）', example: false }),
  links: z.array(blockLinkInputSchema).max(100).optional().openapi({ description: '資源連結列（全量覆寫，僅 resources 型別）' }),
  events: z.array(blockEventInputSchema).max(100).optional().openapi({ description: '日曆活動列（全量覆寫，僅 calendar 型別）' }),
}).refine(data => Object.keys(data).length > 0, { message: '至少提供一個要更新的欄位' }).openapi('UpdateSpaceBlock');

/** One-step move within the ordered block list (FR-6.6). */
export const moveBlockSchema = z.object({
  direction: z.enum(['up', 'down']).openapi({ description: '移動方向，一次一個位置', example: 'up' }),
}).openapi('MoveSpaceBlock');

/** Publish now (no body) or schedule at a future time (FR-7.4–7.6). */
export const publishBlockSchema = z.object({
  scheduledAt: z.iso.datetime({ offset: true }).optional().openapi({ description: '預定發佈時間；省略表示立即發佈，過去時間視同立即發佈（FR-7.6）', example: '2026-09-01T08:00:00.000Z' }),
}).openapi('PublishSpaceBlock');

const spaceListItemSchema = z.object({
  kind: z.enum(SPACE_KINDS).openapi({ description: '空間類型', example: 'event_course' }),
  id: z.string().nullable().openapi({ description: '活動課程卡為 cohortId 字串（導向 /cohorts/{id}）；虛擬空間（personal/challenge）為 null', example: '12' }),
  name: z.string().openapi({ description: '空間名稱', example: '自我覺察練習' }),
  host: z.string().openapi({ description: '卡片 host 顯示名（FR-2.2/2.3）', example: '我的島' }),
  memberCount: z.number().int().openapi({ description: '成員數；共同挑戰卡為代表挑戰（進行中且最近開始的一檔）的參與人數', example: 12 }),
  memberAvatars: z.array(z.object({
    nickname: z.string().nullable().openapi({ description: '成員暱稱' }),
    avatar: z.string().nullable().openapi({ description: '頭像 URL' }),
  })).openapi({ description: '疊加頭像（最多 3 位）' }),
  hasActivePractice: z.boolean().openapi({ description: '是否有進行中的實踐（FR-2.4）', example: true }),
  practiceCount: z.number().int().openapi({ description: '我在此空間的實踐數（personal 為全部實踐、challenge 為我的挑戰實踐、event_course 為我在該期的實踐）', example: 3 }),
  isHost: z.boolean().openapi({ description: '目前使用者是否為發起人', example: false }),
  lastActivityAt: z.string().nullable().openapi({ description: '最近活動時間（排序依據）' }),
}).openapi('SpaceListItem');

export const spaceListResponseSchema = apiSuccessResponseSchema(z.object({
  total: z.number().int().openapi({ description: '空間總數（含虛擬空間）', example: 3 }),
  items: z.array(spaceListItemSchema),
}));

export const spaceDetailResponseSchema = apiSuccessResponseSchema(z.object({
  id: z.string(),
  name: z.string(),
  subtitle: z.string().nullable(),
  memberCount: z.number().int(),
  memberAvatars: z.array(z.object({ nickname: z.string().nullable(), avatar: z.string().nullable() })),
  practiceCount: z.number().int(),
  viewerRole: z.enum(['host', 'member']),
  homePage: z.object({ status: z.enum(['draft', 'published']) }).nullable(),
  publicToken: z.string().nullable().openapi({ description: '公開連結 token；僅發起人可見' }),
  publicBlockCount: z.number().int().nullable().openapi({ description: '對外公開（已發佈）區塊數；僅發起人可見（FR-1.4）' }),
}).openapi('SpaceDetail'));

export const spaceMembersResponseSchema = apiSuccessResponseSchema(z.array(z.object({
  userId: z.number().int(),
  nickname: z.string().nullable(),
  avatar: z.string().nullable(),
  isHost: z.boolean().openapi({ description: '發起人標示（成員彈窗 user-star，FR-1.3）' }),
}).openapi('SpaceMember')));

export const spacePracticesResponseSchema = apiSuccessResponseSchema(z.array(z.object({
  id: z.string().openapi({ description: '實踐 UUID' }),
  title: z.string(),
  status: z.string().openapi({ description: '實踐狀態：draft/not_started/active/completed/archived' }),
  progressPercentage: z.number().nullable(),
  themeColor: z.string().nullable(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  durationDays: z.number().int().nullable(),
  ownerNickname: z.string().nullable(),
}).openapi('SpacePracticeCard')));

const blockSchema = z.object({
  id: z.number().int(),
  blockType: z.enum(SPACE_BLOCK_TYPES),
  title: z.string(),
  body: z.string().nullable(),
  position: z.number().int(),
  isPinned: z.boolean(),
  publishStatus: z.enum(SPACE_BLOCK_PUBLISH_STATUSES).openapi({ description: '有效發佈狀態（排程時間已到視同 published，FR-7.6）' }),
  scheduledAt: z.string().nullable(),
  links: z.array(z.object({
    id: z.number().int(),
    name: z.string(),
    url: z.string(),
    isNameCustomized: z.boolean(),
    practices: z.array(z.object({ id: z.string(), title: z.string() })).openapi({ description: '對應實踐（FR-8.9 浮層顯示名稱）' }),
  })),
  events: z.array(z.object({
    id: z.number().int(),
    title: z.string(),
    startDate: z.string(),
    endDate: z.string().nullable(),
    startTime: z.string().nullable(),
    endTime: z.string().nullable(),
    location: z.string().nullable(),
    url: z.string().nullable(),
  })),
}).openapi('SpaceBlock');

export const publicSpaceResponseSchema = apiSuccessResponseSchema(z.object({
  id: z.string(),
  name: z.string(),
  subtitle: z.string().nullable(),
  memberCount: z.number().int(),
  memberAvatars: z.array(z.object({ nickname: z.string().nullable(), avatar: z.string().nullable() })),
  practiceCount: z.number().int(),
  homePage: z.object({
    status: z.enum(['draft', 'published']),
    blocks: z.array(z.lazy(() => blockSchema)),
  }).nullable(),
}).openapi('PublicSpace'));

export const homePageResponseSchema = apiSuccessResponseSchema(z.object({
  status: z.enum(['draft', 'published']),
  blocks: z.array(blockSchema).openapi({ description: '依檢視者過濾後的區塊；成員看不到草稿與未到時排程（FR-7.2）' }),
}).nullable().openapi('SpaceHomePage'));

export const blockResponseSchema = apiSuccessResponseSchema(blockSchema);

export type CreateHomePageInput = z.infer<typeof createHomePageSchema>;
export type CreateBlockInput = z.infer<typeof createBlockSchema>;
export type UpdateBlockInput = z.infer<typeof updateBlockSchema>;
export type MoveBlockInput = z.infer<typeof moveBlockSchema>;
export type PublishBlockInput = z.infer<typeof publishBlockSchema>;
export type SpaceIdParam = z.infer<typeof spaceIdParamSchema>;
export type SpaceBlockParam = z.infer<typeof spaceBlockParamSchema>;
export type SpacePublicTokenParam = z.infer<typeof spacePublicTokenParamSchema>;
export type BlockLinkInput = z.infer<typeof blockLinkInputSchema>;
export type BlockEventInput = z.infer<typeof blockEventInputSchema>;
