/**
 * Mentor Validators
 * 導師相關驗證器 - 使用 Zod 進行資料驗證
 * 使用 @asteasolutions/zod-to-openapi 進行 OpenAPI 整合
 */

import { z } from 'zod';
import { registry } from '../config/openapi-registry';
import {
  apiSuccessResponseSchema
} from './api-response.validators';

/**
 * 指定導師參與馬拉松驗證模式
 */
export const assignMentorToMarathonSchema = z.object({
  mentorId: z.number({
    message: '導師 ID 必須是數字'
  }).int('導師 ID 必須是整數').min(1, '導師 ID 必須是正整數')
    .openapi({
      description: '導師的唯一識別 ID',
      example: 123,
      examples: [1, 123, 456]
    }),

  eventId: z.string({
    message: '活動 ID 為必填項目'
  }).min(1, '活動 ID 不能為空')
    .openapi({
      description: '馬拉松活動的唯一識別 ID',
      example: 'marathon_2024_spring',
      examples: ['marathon_2024_spring', 'hackathon_web3_2024', 'coding_bootcamp_js']
    })
}).openapi('AssignMentorToMarathonRequest', {
  description: '指定導師參與特定馬拉松活動的請求資料'
});

// 註冊 AssignMentorToMarathonRequest
registry.register('AssignMentorToMarathonRequest', assignMentorToMarathonSchema);

/**
 * 更新導師馬拉松關聯驗證模式
 */
export const updateMentorMarathonSchema = z.object({
  marathonId: z.string().min(1, '馬拉松 ID 不能為空').optional()
    .openapi({
      description: '要更新關聯的馬拉松活動 ID',
      example: 'marathon_2024_spring',
      examples: ['marathon_2024_spring', 'web_dev_marathon_2024', 'ai_learning_marathon']
    })
}).openapi('UpdateMentorMarathonRequest', {
  description: '更新導師與馬拉松活動關聯的請求資料'
});

// 註冊 UpdateMentorMarathonRequest
registry.register('UpdateMentorMarathonRequest', updateMentorMarathonSchema);

/**
 * 指定參與者給導師驗證模式
 */
export const assignParticipantToMentorSchema = z.object({
  participantId: z.number({
    message: '參與者 ID 必須是數字'
  }).int('參與者 ID 必須是整數').min(1, '參與者 ID 必須是正整數')
    .openapi({
      description: '要指派給導師的參與者唯一識別 ID',
      example: 1001,
      examples: [1001, 2045, 3078]
    })
}).openapi('AssignParticipantToMentorRequest', {
  description: '將特定參與者指派給導師的請求資料'
});

// 註冊 AssignParticipantToMentorRequest
registry.register('AssignParticipantToMentorRequest', assignParticipantToMentorSchema);

/**
 * 路徑參數驗證模式
 */
export const assignmentIdParamsSchema = z.object({
  assignmentId: z.string({
    message: '指派 ID 為必填項目'
  }).regex(/^\d+$/, '指派 ID 必須是數字').transform(Number)
    .openapi({
      description: '導師指派記錄的唯一識別 ID',
      example: '123',
      examples: ['123', '456', '789']
    })
}).openapi({
  description: '包含導師指派記錄 ID 的路徑參數'
});

export const participantIdParamsSchema = z.object({
  participantId: z.string({
    message: '參與者 ID 為必填項目'
  }).regex(/^\d+$/, '參與者 ID 必須是數字').transform(Number)
    .openapi({
      description: '學習參與者的唯一識別 ID',
      example: '1001',
      examples: ['1001', '2045', '3078']
    })
}).openapi({
  description: '包含參與者 ID 的路徑參數'
});

export const eventIdParamsSchema = z.object({
  eventId: z.string({
    message: '活動 ID 為必填項目'
  }).min(1, '活動 ID 不能為空')
    .openapi({
      description: '學習活動或馬拉松的唯一識別 ID',
      example: 'marathon_2024_spring',
      examples: ['marathon_2024_spring', 'bootcamp_react_2024', 'workshop_nodejs_basics']
    })
}).openapi({
  description: '包含活動 ID 的路徑參數'
});

/**
 * 分頁查詢驗證模式
 */
export const paginationQuerySchema = z.object({
  page: z.string().regex(/^\d+$/, '頁碼必須是正整數').transform(Number).optional()
    .openapi({
      description: '當前頁碼，從 1 開始',
      example: '1',
      examples: ['1', '2', '5']
    }),
  limit: z.string().regex(/^\d+$/, '每頁數量必須是正整數').transform(Number).optional()
    .openapi({
      description: '每頁顯示的記錄數量',
      example: '10',
      examples: ['10', '20', '50']
    })
}).openapi({
  description: '分頁查詢的參數設定'
});

// 導出驗證類型
export type AssignMentorToMarathonData = z.infer<typeof assignMentorToMarathonSchema>;
export type UpdateMentorMarathonData = z.infer<typeof updateMentorMarathonSchema>;
export type AssignParticipantToMentorData = z.infer<typeof assignParticipantToMentorSchema>;
export type AssignmentIdParamsData = z.infer<typeof assignmentIdParamsSchema>;
export type ParticipantIdParamsData = z.infer<typeof participantIdParamsSchema>;
export type EventIdParamsData = z.infer<typeof eventIdParamsSchema>;
export type PaginationQueryData = z.infer<typeof paginationQuerySchema>;

// ===== RESPONSE VALIDATION SCHEMAS =====
// Based on mentor.service.ts return types and mentor.types.ts interfaces

// Mentor marathon assignment response schema
export const mentorMarathonAssignmentResponseSchema = z.object({
  id: z.number().openapi({ description: '指派記錄 ID', example: 1 }),
  mentorId: z.number().openapi({ description: '導師 ID', example: 123 }),
  marathonId: z.number().openapi({ description: '馬拉松 ID', example: 456 }),
  eventId: z.string().openapi({ description: '活動外部 ID', example: 'marathon_2024_spring' }),
  assignedAt: z.string().openapi({ description: '指派時間', example: '2024-01-15T10:30:00.000Z', format: 'date-time' })
}).openapi('MentorMarathonAssignment', {
  description: '導師馬拉松指派記錄'
});

// 註冊 MentorMarathonAssignment
registry.register('MentorMarathonAssignment', mentorMarathonAssignmentResponseSchema);

// Mentor participant response schema
export const mentorParticipantResponseSchema = z.object({
  mentorId: z.number().openapi({ description: '導師 ID', example: 123 }),
  participantId: z.number().openapi({ description: '參與者 ID', example: 1001 }),
  assignedAt: z.string().openapi({ description: '指派時間', example: '2024-01-15T10:30:00.000Z', format: 'date-time' })
}).openapi('MentorParticipant', {
  description: '導師參與者關聯記錄'
});

// 註冊 MentorParticipant
registry.register('MentorParticipant', mentorParticipantResponseSchema);

// Mentor marathon response schema
export const mentorMarathonResponseSchema = z.object({
  id: z.number().openapi({ description: '馬拉松 ID', example: 456 }),
  eventId: z.string().openapi({ description: '活動外部 ID', example: 'marathon_2024_spring' }),
  title: z.string().openapi({ description: '馬拉松標題', example: '2024 春季學習馬拉松' }),
  startDate: z.string().openapi({ description: '開始日期', example: '2024-01-15T00:00:00.000Z', format: 'date-time' }),
  endDate: z.string().openapi({ description: '結束日期', example: '2024-03-15T00:00:00.000Z', format: 'date-time' }),
  participantCount: z.number().openapi({ description: '參與者數量', example: 25 })
}).openapi('MentorMarathon', {
  description: '導師馬拉松資訊'
});

// 註冊 MentorMarathon
registry.register('MentorMarathon', mentorMarathonResponseSchema);

// Participant detail response schema
export const participantDetailResponseSchema = z.object({
  id: z.number().openapi({ description: '參與者 ID', example: 1001 }),
  name: z.string().openapi({ description: '參與者姓名', example: '王小明' }),
  _id: z.string().openapi({ description: '參與者外部 ID（UUID）', example: '123e4567-e89b-12d3-a456-426614174000', format: 'uuid' }),
  roleList: z.array(z.string()).optional().openapi({ description: '角色列表', example: ['normal_student', 'educator'] }),
  photoURL: z.string().nullable().openapi({ description: '頭像 URL', example: 'https://example.com/avatar/wang.jpg', format: 'uri' }),
  educationStage: z.string().nullable().optional().openapi({ description: '教育階段', example: 'university' }),
  tagList: z.array(z.string()).optional().openapi({ description: '標籤列表', example: ['JavaScript', 'React'] }),
  selfIntroduction: z.string().nullable().optional().openapi({ description: '自我介紹', example: '我是一名前端工程師' }),
  location: z.string().openapi({ description: '地理位置', example: 'taipei' }),
  wantToDoList: z.array(z.string()).openapi({ description: '想做的事情列表', example: ['學習 React', '開發 APP'] }),
  share: z.string().openapi({ description: '分享內容', example: '我的學習筆記' }),
  updatedDate: z.string().openapi({ description: '更新日期', example: '2024-01-20T14:25:00.000Z', format: 'date-time' }),
  projectId: z.string().openapi({ description: '專案外部 ID', example: 'project_123' }),
  projectTitle: z.string().openapi({ description: '專案標題', example: '我的學習專案' })
}).openapi('ParticipantDetail', {
  description: '參與者詳細資訊'
});

// 註冊 ParticipantDetail
registry.register('ParticipantDetail', participantDetailResponseSchema);

// Mentor marathon participants response schema
export const mentorMarathonParticipantsResponseSchema = z.object({
  id: z.number().openapi({ description: '馬拉松 ID', example: 456 }),
  eventId: z.string().openapi({ description: '活動外部 ID', example: 'marathon_2024_spring' }),
  title: z.string().openapi({ description: '馬拉松標題', example: '2024 春季學習馬拉松' }),
  startDate: z.string().openapi({ description: '開始日期', example: '2024-01-15T00:00:00.000Z', format: 'date-time' }),
  endDate: z.string().openapi({ description: '結束日期', example: '2024-03-15T00:00:00.000Z', format: 'date-time' }),
  participants: z.array(participantDetailResponseSchema).openapi({ description: '參與者列表' })
}).openapi('MentorMarathonParticipants', {
  description: '導師馬拉松參與者資訊'
});

// 註冊 MentorMarathonParticipants
registry.register('MentorMarathonParticipants', mentorMarathonParticipantsResponseSchema);

// Review response schema (nested in mentor participant reviews)
export const mentorReviewResponseSchema = z.object({
  id: z.number().openapi({ description: '覆盤 ID', example: 789 }),
  week: z.number().openapi({ description: '週次', example: 1 }),
  title: z.string().openapi({ description: '覆盤標題', example: '第一週學習回顧' }),
  mood: z.number().openapi({ description: '心情評分（1-10）', example: 8 }),
  stressLevel: z.number().openapi({ description: '壓力等級（1-10）', example: 5 }),
  moodDescription: z.string().optional().openapi({ description: '心情描述', example: '這週學習很順利' }),
  learningReview: z.string().optional().openapi({ description: '學習反思', example: '掌握了 React 基礎' }),
  learningFeedback: z.string().optional().openapi({ description: '學習回饋', example: '需要加強實作練習' }),
  adjustmentPlan: z.string().optional().openapi({ description: '調整計畫', example: '下週增加練習時間' }),
  createdAt: z.string().openapi({ description: '創建日期', example: '2024-01-22T10:00:00.000Z', format: 'date-time' }),
  updatedAt: z.string().optional().openapi({ description: '更新日期', example: '2024-01-23T15:30:00.000Z', format: 'date-time' })
}).openapi('MentorReview', {
  description: '導師覆盤記錄'
});

// 註冊 MentorReview
registry.register('MentorReview', mentorReviewResponseSchema);

// Marathon info schema (nested in participant reviews response)
export const marathonInfoSchema = z.object({
  id: z.number().openapi({ description: '馬拉松 ID', example: 456 }),
  eventId: z.string().openapi({ description: '活動外部 ID', example: 'marathon_2024_spring' }),
  title: z.string().openapi({ description: '馬拉松標題', example: '2024 春季學習馬拉松' }),
  startDate: z.string().openapi({ description: '開始日期', example: '2024-01-15T00:00:00.000Z', format: 'date-time' }),
  endDate: z.string().openapi({ description: '結束日期', example: '2024-03-15T00:00:00.000Z', format: 'date-time' })
}).openapi('MarathonInfo', {
  description: '馬拉松基本資訊'
});

// 註冊 MarathonInfo
registry.register('MarathonInfo', marathonInfoSchema);

// Mentor participant reviews response schema
export const mentorParticipantReviewsResponseSchema = z.object({
  marathon: marathonInfoSchema.openapi({ description: '馬拉松資訊' }),
  reviews: z.array(mentorReviewResponseSchema).openapi({ description: '覆盤列表' })
}).openapi('MentorParticipantReviews', {
  description: '導師參與者覆盤資訊'
});

// 註冊 MentorParticipantReviews
registry.register('MentorParticipantReviews', mentorParticipantReviewsResponseSchema);

// API Response schemas based on mentor service return types
export const assignMentorToMarathonApiResponseSchema = apiSuccessResponseSchema(mentorMarathonAssignmentResponseSchema);
export const updateMentorMarathonApiResponseSchema = apiSuccessResponseSchema(mentorMarathonAssignmentResponseSchema);
export const deleteMentorFromMarathonApiResponseSchema = apiSuccessResponseSchema(z.null());
export const getMentorMarathonsApiResponseSchema = apiSuccessResponseSchema(z.array(mentorMarathonResponseSchema));
export const assignParticipantToMentorApiResponseSchema = apiSuccessResponseSchema(mentorParticipantResponseSchema);
export const updateMentorParticipantApiResponseSchema = apiSuccessResponseSchema(z.null());
export const removeMentorParticipantApiResponseSchema = apiSuccessResponseSchema(z.null());
export const getMentorParticipantsByMarathonApiResponseSchema = apiSuccessResponseSchema(mentorMarathonParticipantsResponseSchema);
export const getReviewsForMentorParticipantsApiResponseSchema = apiSuccessResponseSchema(mentorParticipantReviewsResponseSchema);

// Response type exports
export type MentorMarathonAssignmentResponse = z.infer<typeof mentorMarathonAssignmentResponseSchema>;
export type MentorParticipantResponse = z.infer<typeof mentorParticipantResponseSchema>;
export type MentorMarathonResponse = z.infer<typeof mentorMarathonResponseSchema>;
export type ParticipantDetailResponse = z.infer<typeof participantDetailResponseSchema>;
export type MentorMarathonParticipantsResponse = z.infer<typeof mentorMarathonParticipantsResponseSchema>;
export type ReviewResponse = z.infer<typeof mentorReviewResponseSchema>;
export type MarathonInfo = z.infer<typeof marathonInfoSchema>;
export type MentorParticipantReviewsResponse = z.infer<typeof mentorParticipantReviewsResponseSchema>;