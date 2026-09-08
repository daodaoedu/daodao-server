/**
 * Chat Room Validators
 * 群組聊天 Zod schema — 全部加 .openapi() 註解供 Swagger 自動生成
 */

import { z } from 'zod';
import { CHAT_MESSAGE_KINDS, CHAT_MESSAGE_MAX_LENGTH, CHAT_PAGE_MAX } from '../constants/chat';

// ─── Params ──────────────────────────────────────────────

export const chatRoomIdParamsSchema = z.object({
  roomId: z.coerce.number().int().positive().openapi({ description: '聊天室 ID', example: 1 }),
});

export const chatMessageIdParamsSchema = chatRoomIdParamsSchema.extend({
  messageId: z.coerce.number().int().positive().openapi({ description: '訊息 ID', example: 100 }),
});

// ─── Query ───────────────────────────────────────────────

export const chatMessagesQuerySchema = z.object({
  before: z.coerce.number().int().positive().optional().openapi({ description: '取此 ID 之前的訊息（歷史分頁）', example: 100 }),
  after: z.coerce.number().int().positive().optional().openapi({ description: '取此 ID 之後的新訊息（增量輪詢）', example: 50 }),
  since: z.string().datetime().optional().openapi({ description: 'ISO 時間戳，搭配 after 使用，回傳 changed/deletedIds', example: '2026-09-01T00:00:00.000Z' }),
  limit: z.coerce.number().int().min(1).max(CHAT_PAGE_MAX).optional().openapi({ description: '每頁筆數（預設 50，上限 100）', example: 50 }),
}).refine(
  data => !(data.before && data.after),
  { message: 'before 與 after 不可同時使用' }
).openapi({ description: '訊息查詢參數' });

export const chatSearchQuerySchema = z.object({
  q: z.string().trim().min(1).max(100).openapi({ description: '搜尋關鍵字（1-100 字）', example: '下次' }),
}).openapi({ description: '訊息搜尋查詢' });

// ─── Body ────────────────────────────────────────────────

export const createChatMessageSchema = z.object({
  body: z.string().trim().min(1).max(CHAT_MESSAGE_MAX_LENGTH).openapi({ description: '訊息內容', example: '大家好！' }),
  replyToMessageId: z.number().int().positive().optional().openapi({ description: '引用回覆的訊息 ID', example: 42 }),
}).openapi({ description: '發送聊天訊息' });

export const updateChatMessageSchema = z.object({
  body: z.string().trim().min(1).max(CHAT_MESSAGE_MAX_LENGTH).openapi({ description: '編輯後的訊息內容', example: '修正：大家好！' }),
}).openapi({ description: '編輯聊天訊息' });

export const markChatRoomReadSchema = z.object({
  lastReadMessageId: z.number().int().positive().openapi({ description: '已讀到的最新訊息 ID', example: 200 }),
}).openapi({ description: '標記已讀' });

// ─── Response schemas ────────────────────────────────────

export const chatAuthorSchema = z.object({
  userId: z.number().int().openapi({ description: '作者 ID' }),
  nickname: z.string().nullable().openapi({ description: '暱稱' }),
  avatar: z.string().nullable().openapi({ description: '頭像 URL' }),
  isHost: z.boolean().openapi({ description: '是否為帶領人' }),
}).openapi({ description: '訊息作者' });

export const chatReplyToSchema = z.object({
  id: z.number().int().openapi({ description: '被引用訊息 ID' }),
  authorName: z.string().nullable().openapi({ description: '被引用訊息的作者暱稱' }),
  bodyPreview: z.string().nullable().openapi({ description: '被引用訊息的內容預覽（已刪除為 null）' }),
  isDeleted: z.boolean().openapi({ description: '被引用訊息是否已刪除' }),
}).openapi({ description: '引用回覆資訊' });

export const chatMessageSchema = z.object({
  id: z.number().int().openapi({ description: '訊息 ID' }),
  roomId: z.number().int().openapi({ description: '聊天室 ID' }),
  kind: z.enum([CHAT_MESSAGE_KINDS.TEXT, CHAT_MESSAGE_KINDS.SYSTEM]).openapi({ description: '訊息類型' }),
  body: z.string().openapi({ description: '訊息內容' }),
  metadata: z.record(z.string(), z.unknown()).nullable().openapi({ description: '系統訊息元資料' }),
  author: chatAuthorSchema.nullable().openapi({ description: '作者（系統訊息為 null）' }),
  replyTo: chatReplyToSchema.nullable().openapi({ description: '引用回覆（無引用為 null）' }),
  likeCount: z.number().int().nonnegative().openapi({ description: '按讚數' }),
  likedByMe: z.boolean().openapi({ description: '我是否已按讚' }),
  isPinned: z.boolean().openapi({ description: '是否已置頂' }),
  pinnedAt: z.string().nullable().openapi({ description: '置頂時間（ISO）' }),
  editedAt: z.string().nullable().openapi({ description: '編輯時間（ISO）' }),
  createdAt: z.string().openapi({ description: '建立時間（ISO）' }),
  updatedAt: z.string().openapi({ description: '更新時間（ISO）' }),
}).openapi({ description: '聊天訊息' });

export const chatLastMessageSchema = z.object({
  id: z.number().int().openapi({ description: '訊息 ID' }),
  kind: z.string().openapi({ description: '訊息類型' }),
  bodyPreview: z.string().openapi({ description: '內容預覽' }),
  authorName: z.string().nullable().openapi({ description: '作者暱稱' }),
  isMine: z.boolean().openapi({ description: '是否為自己的訊息' }),
  createdAt: z.string().openapi({ description: '建立時間（ISO）' }),
}).openapi({ description: '最後一則訊息摘要' });

export const chatRoomSummarySchema = z.object({
  id: z.number().int().openapi({ description: '聊天室 ID' }),
  cohortId: z.number().int().openapi({ description: '關聯的 cohort ID' }),
  name: z.string().openapi({ description: '聊天室名稱（cohort display_name）' }),
  iconLabel: z.string().openapi({ description: '圖示文字（名稱首字）' }),
  colorSeed: z.number().int().openapi({ description: '色彩種子（roomId）' }),
  organizationName: z.string().openapi({ description: '組織名稱' }),
  memberCount: z.number().int().nonnegative().openapi({ description: '成員數' }),
  unreadCount: z.number().int().nonnegative().openapi({ description: '未讀數' }),
  lastMessage: chatLastMessageSchema.nullable().openapi({ description: '最後一則訊息' }),
  lastActivityAt: z.string().openapi({ description: '最近活動時間（ISO）' }),
}).openapi({ description: '聊天室摘要' });

export const chatRoomListResponseSchema = z.object({
  totalUnread: z.number().int().nonnegative().openapi({ description: '全部聊天室的總未讀數' }),
  items: z.array(chatRoomSummarySchema).openapi({ description: '聊天室列表' }),
}).openapi({ description: '我的聊天室列表' });

export const chatMemberPreviewSchema = z.object({
  nickname: z.string().nullable().openapi({ description: '暱稱' }),
  avatar: z.string().nullable().openapi({ description: '頭像 URL' }),
}).openapi({ description: '成員預覽' });

export const chatRoomDetailSchema = chatRoomSummarySchema.extend({
  viewerRole: z.enum(['host', 'member']).openapi({ description: '當前使用者角色' }),
  pinnedCount: z.number().int().nonnegative().openapi({ description: '置頂訊息數' }),
  memberPreview: z.array(chatMemberPreviewSchema).openapi({ description: '前 3 位成員預覽' }),
}).openapi({ description: '聊天室詳情' });

export const chatMemberSchema = z.object({
  userId: z.number().int().openapi({ description: '使用者 ID' }),
  nickname: z.string().nullable().openapi({ description: '暱稱' }),
  avatar: z.string().nullable().openapi({ description: '頭像 URL' }),
  isHost: z.boolean().openapi({ description: '是否為帶領人' }),
  isOnline: z.boolean().openapi({ description: '是否在線' }),
  bio: z.string().nullable().openapi({ description: '自我介紹' }),
}).openapi({ description: '聊天室成員' });

export const chatMessageDeltaSchema = z.object({
  messages: z.array(chatMessageSchema).openapi({ description: '新訊息' }),
  changed: z.array(chatMessageSchema).openapi({ description: '已變更的既有訊息' }),
  deletedIds: z.array(z.number().int()).openapi({ description: '已刪除的訊息 ID' }),
  pinnedCount: z.number().int().nonnegative().openapi({ description: '置頂訊息數' }),
  memberCount: z.number().int().nonnegative().openapi({ description: '成員數' }),
  serverTime: z.string().openapi({ description: '伺服器時間（ISO）' }),
}).openapi({ description: '增量輪詢回應' });

export const chatSearchResultItemSchema = z.object({
  id: z.number().int().openapi({ description: '訊息 ID' }),
  createdAt: z.string().openapi({ description: '建立時間（ISO）' }),
}).openapi({ description: '搜尋結果項目' });

export const chatSearchResponseSchema = z.object({
  total: z.number().int().nonnegative().openapi({ description: '結果總數' }),
  items: z.array(chatSearchResultItemSchema).openapi({ description: '搜尋結果' }),
}).openapi({ description: '訊息搜尋結果' });

export const chatLikeResponseSchema = z.object({
  likeCount: z.number().int().nonnegative().openapi({ description: '按讚數' }),
  likedByMe: z.boolean().openapi({ description: '我是否已按讚' }),
}).openapi({ description: '按讚回應' });

export const chatMarkReadResponseSchema = z.object({
  lastReadMessageId: z.number().int().openapi({ description: '已讀到的訊息 ID' }),
  unreadCount: z.number().int().nonnegative().openapi({ description: '剩餘未讀數' }),
}).openapi({ description: '標記已讀回應' });

// ─── Type exports ────────────────────────────────────────

export type ChatRoomIdParams = z.infer<typeof chatRoomIdParamsSchema>;
export type ChatMessageIdParams = z.infer<typeof chatMessageIdParamsSchema>;
export type ChatMessagesQuery = z.infer<typeof chatMessagesQuerySchema>;
export type ChatSearchQuery = z.infer<typeof chatSearchQuerySchema>;
export type CreateChatMessageInput = z.infer<typeof createChatMessageSchema>;
export type UpdateChatMessageInput = z.infer<typeof updateChatMessageSchema>;
export type MarkChatRoomReadInput = z.infer<typeof markChatRoomReadSchema>;
