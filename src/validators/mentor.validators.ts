/**
 * Mentor Validators
 * 導師相關驗證器 - 使用 Zod 進行資料驗證
 */

import { z } from 'zod';
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
    .describe("導師的唯一識別ID")
    .meta({
      title: "導師ID",
      examples: [1, 123, 456]
    }),
  
  eventId: z.string({
    message: '活動 ID 為必填項目'
  }).min(1, '活動 ID 不能為空')
    .describe("馬拉松活動的唯一識別ID")
    .meta({
      title: "活動ID",
      examples: ["marathon_2024_spring", "hackathon_web3_2024", "coding_bootcamp_js"]
    })
}).describe("指定導師參與特定馬拉松活動的請求資料").meta({
  title: "導師馬拉松指派",
  examples: [{
    mentorId: 123,
    eventId: "marathon_2024_spring"
  }]
});

/**
 * 更新導師馬拉松關聯驗證模式
 */
export const updateMentorMarathonSchema = z.object({
  marathonId: z.string().min(1, '馬拉松 ID 不能為空').optional()
    .describe("要更新關聯的馬拉松活動ID")
    .meta({
      title: "馬拉松ID",
      examples: ["marathon_2024_spring", "web_dev_marathon_2024", "ai_learning_marathon"]
    })
}).describe("更新導師與馬拉松活動關聯的請求資料").meta({
  title: "更新導師馬拉松關聯",
  examples: [{
    marathonId: "marathon_2024_spring"
  }]
});

/**
 * 指定參與者給導師驗證模式
 */
export const assignParticipantToMentorSchema = z.object({
  participantId: z.number({
    message: '參與者 ID 必須是數字'
  }).int('參與者 ID 必須是整數').min(1, '參與者 ID 必須是正整數')
    .describe("要指派給導師的參與者唯一識別ID")
    .meta({
      title: "參與者ID",
      examples: [1001, 2045, 3078]
    })
}).describe("將特定參與者指派給導師的請求資料").meta({
  title: "參與者導師指派",
  examples: [{
    participantId: 1001
  }]
});

/**
 * 路徑參數驗證模式
 */
export const assignmentIdParamsSchema = z.object({
  assignmentId: z.string({
    message: '指派 ID 為必填項目'
  }).regex(/^\d+$/, '指派 ID 必須是數字').transform(Number)
    .describe("導師指派記錄的唯一識別ID")
    .meta({
      title: "指派記錄ID",
      examples: ["123", "456", "789"]
    })
}).describe("包含導師指派記錄ID的路徑參數").meta({
  title: "指派ID路徑參數",
  examples: [{
    assignmentId: "123"
  }]
});

export const participantIdParamsSchema = z.object({
  participantId: z.string({
    message: '參與者 ID 為必填項目'
  }).regex(/^\d+$/, '參與者 ID 必須是數字').transform(Number)
    .describe("學習參與者的唯一識別ID")
    .meta({
      title: "參與者ID",
      examples: ["1001", "2045", "3078"]
    })
}).describe("包含參與者ID的路徑參數").meta({
  title: "參與者ID路徑參數",
  examples: [{
    participantId: "1001"
  }]
});

export const eventIdParamsSchema = z.object({
  eventId: z.string({
    message: '活動 ID 為必填項目'
  }).min(1, '活動 ID 不能為空')
    .describe("學習活動或馬拉松的唯一識別ID")
    .meta({
      title: "活動ID",
      examples: ["marathon_2024_spring", "bootcamp_react_2024", "workshop_nodejs_basics"]
    })
}).describe("包含活動ID的路徑參數").meta({
  title: "活動ID路徑參數",
  examples: [{
    eventId: "marathon_2024_spring"
  }]
});

/**
 * 分頁查詢驗證模式
 */
export const paginationQuerySchema = z.object({
  page: z.string().regex(/^\d+$/, '頁碼必須是正整數').transform(Number).optional().default(1)
    .describe("當前頁碼，從1開始")
    .meta({
      title: "頁碼",
      examples: ["1", "2", "5"]
    }),
  limit: z.string().regex(/^\d+$/, '每頁數量必須是正整數').transform(Number).optional().default(10)
    .describe("每頁顯示的記錄數量")
    .meta({
      title: "每頁數量",
      examples: ["10", "20", "50"]
    })
}).describe("分頁查詢的參數設定").meta({
  title: "分頁查詢參數",
  examples: [{
    page: "1",
    limit: "10"
  }, {
    page: "2",
    limit: "20"
  }]
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
  id: z.number().describe("指派記錄 ID"),
  mentorId: z.number().describe("導師 ID"),
  marathonId: z.number().describe("馬拉松 ID"),
  eventId: z.string().describe("活動外部 ID"),
  assignedAt: z.string().describe("指派時間")
});

// Mentor participant response schema
export const mentorParticipantResponseSchema = z.object({
  mentorId: z.number().describe("導師 ID"),
  participantId: z.number().describe("參與者 ID"),
  assignedAt: z.string().describe("指派時間")
});

// Mentor marathon response schema
export const mentorMarathonResponseSchema = z.object({
  id: z.number().describe("馬拉松 ID"),
  eventId: z.string().describe("活動外部 ID"),
  title: z.string().describe("馬拉松標題"),
  startDate: z.string().describe("開始日期"),
  endDate: z.string().describe("結束日期"),
  participantCount: z.number().describe("參與者數量")
});

// Participant detail response schema
export const participantDetailResponseSchema = z.object({
  id: z.number().describe("參與者 ID"),
  name: z.string().describe("參與者姓名"),
  _id: z.string().describe("參與者外部 ID"),
  roleList: z.array(z.string()).describe("角色列表"),
  photoURL: z.string().nullable().describe("頭像 URL"),
  educationStage: z.string().nullable().describe("教育階段"),
  tagList: z.array(z.string()).describe("標籤列表"),
  selfIntroduction: z.string().nullable().describe("自我介紹"),
  location: z.string().describe("地理位置"),
  wantToDoList: z.array(z.string()).describe("想做的事情列表"),
  share: z.string().describe("分享內容"),
  updatedDate: z.string().describe("更新日期"),
  projectId: z.string().describe("專案外部 ID"),
  projectTitle: z.string().describe("專案標題")
});

// Mentor marathon participants response schema
export const mentorMarathonParticipantsResponseSchema = z.object({
  id: z.number().describe("馬拉松 ID"),
  eventId: z.string().describe("活動外部 ID"),
  title: z.string().describe("馬拉松標題"),
  startDate: z.string().describe("開始日期"),
  endDate: z.string().describe("結束日期"),
  participants: z.array(participantDetailResponseSchema).describe("參與者列表")
});

// Review response schema (nested in mentor participant reviews)
export const mentorReviewResponseSchema = z.object({
  id: z.number().describe("覆盤 ID"),
  week: z.number().describe("週次"),
  title: z.string().describe("覆盤標題"),
  mood: z.number().describe("心情評分"),
  stressLevel: z.number().describe("壓力等級"),
  moodDescription: z.string().optional().describe("心情描述"),
  learningReview: z.string().optional().describe("學習反思"),
  learningFeedback: z.string().optional().describe("學習回饋"),
  adjustmentPlan: z.string().optional().describe("調整計畫"),
  createdAt: z.string().describe("創建日期"),
  updatedAt: z.string().optional().describe("更新日期")
});

// Marathon info schema (nested in participant reviews response)
export const marathonInfoSchema = z.object({
  id: z.number().describe("馬拉松 ID"),
  eventId: z.string().describe("活動外部 ID"),
  title: z.string().describe("馬拉松標題"),
  startDate: z.string().describe("開始日期"),
  endDate: z.string().describe("結束日期")
});

// Mentor participant reviews response schema
export const mentorParticipantReviewsResponseSchema = z.object({
  marathon: marathonInfoSchema.describe("馬拉松資訊"),
  reviews: z.array(mentorReviewResponseSchema).describe("覆盤列表")
});

// API Response schemas based on mentor service return types
export const assignMentorToMarathonApiResponseSchema = apiSuccessResponseSchema(mentorMarathonAssignmentResponseSchema);
export const updateMentorMarathonApiResponseSchema = apiSuccessResponseSchema(mentorMarathonAssignmentResponseSchema);
export const deleteMentorFromMarathonApiResponseSchema = apiSuccessResponseSchema(z.undefined());
export const getMentorMarathonsApiResponseSchema = apiSuccessResponseSchema(z.array(mentorMarathonResponseSchema));
export const assignParticipantToMentorApiResponseSchema = apiSuccessResponseSchema(mentorParticipantResponseSchema);
export const updateMentorParticipantApiResponseSchema = apiSuccessResponseSchema(z.undefined());
export const removeMentorParticipantApiResponseSchema = apiSuccessResponseSchema(z.undefined());
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