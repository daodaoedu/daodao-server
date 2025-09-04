/**
 * Mentor Validators
 * 導師相關驗證器 - 使用 Zod 進行資料驗證
 */

import { z } from 'zod';

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