/**
 * ResourceReview 相關驗證器
 */

import { z } from 'zod';
import { apiSuccessResponseSchema, cursorPaginatedApiResponseSchema } from './api-response.validators';

// 時間使用選項驗證
export const timeUsageSchema = z.enum([
  '1_2_hours_daily',
  'few_intensive_days_week',
  'spare_moments',
  'not_applicable_time'
])
  .describe("使用資源的時間投入方式")
  .meta({
    title: "時間使用方式",
    examples: ['1_2_hours_daily', 'few_intensive_days_week', 'spare_moments'],
    enumDescriptions: {
      "1_2_hours_daily": "每天1-2小時穩定學習",
      "few_intensive_days_week": "每週專注學習幾天",
      "spare_moments": "利用空閒時間學習",
      "not_applicable_time": "時間不適用或無關"
    }
  });

// 評分驗證 (支援 0.5 分間距)
export const scoreSchema = z.number()
  .min(1.0, { message: "評分最低為1.0" })
  .max(5.0, { message: "評分最高為5.0" })
  .refine(value => {
    const decimal = value % 1;
    return decimal === 0 || decimal === 0.5;
  }, { message: "評分必須以0.5為間距（如1.0, 1.5, 2.0等）" })
  .describe("評分數值，支援1.0到50分之間，0.5為間距")
  .meta({
    title: "資源評分",
    examples: [1.0, 1.5, 2.0, 3.5, 4.0, 5.0]
  });

// 狀態類型驗證
export const reviewStatusSchema = z.enum([
  'draft',
  'published',
  'archived',
  'reported'
])
  .describe("資源評論的發布狀態")
  .meta({
    title: "評論狀態",
    examples: ['draft', 'published', 'archived', 'reported'],
    enumDescriptions: {
      "draft": "草稿狀態，尚未發布",
      "published": "已發布，公開可見",
      "archived": "已歸檔，不再顯示",
      "reported": "被檢舉，等待審核"
    }
  });

// 內容特色物件 schema
export const contentFeaturesSchema = z.object({
  wellStructured: z.boolean().default(false)
    .describe("內容結構完整、條理清晰")
    .meta({
      title: "結構完整",
      examples: [true, false]
    }),
  practiceFocused: z.boolean().default(false)
    .describe("注重實作和動手練習")
    .meta({
      title: "實作取向",
      examples: [true, false]
    }),
  wellRoundedConcepts: z.boolean().default(false)
    .describe("概念解釋全面且深入")
    .meta({
      title: "概念全面",
      examples: [true, false]
    }),
  thoughtProvoking: z.boolean().default(false)
    .describe("內容引人思考、激發靈感")
    .meta({
      title: "引人思考",
      examples: [true, false]
    }),
  progressiveLearning: z.boolean().default(false)
    .describe("采用漸進式學習方法")
    .meta({
      title: "漸進學習",
      examples: [true, false]
    }),
  problemBased: z.boolean().default(false)
    .describe("以問題為導向的學習方式")
    .meta({
      title: "問題導向",
      examples: [true, false]
    }),
  realWorldExamples: z.boolean().default(false)
    .describe("包含豐富的現實世界範例")
    .meta({
      title: "現實範例",
      examples: [true, false]
    }),
  interactive: z.boolean().default(false)
    .describe("互動性強，參與度高")
    .meta({
      title: "互動性強",
      examples: [true, false]
    }),
  visuallyRich: z.boolean().default(false)
    .describe("視覺內容豐富，圖文並茂")
    .meta({
      title: "視覺豐富",
      examples: [true, false]
    })
}).describe("資源內容特色的評估指標").meta({
  title: "內容特色評估",
  examples: [{
    wellStructured: true,
    practiceFocused: true,
    wellRoundedConcepts: false,
    thoughtProvoking: true,
    progressiveLearning: false,
    problemBased: true,
    realWorldExamples: true,
    interactive: false,
    visuallyRich: false
  }]
});

// 資源使用物件 schema
export const resourceUsageSchema = z.object({
  withOnlineCourses: z.boolean().default(false)
    .describe("搭配線上課程一起使用")
    .meta({
      title: "搭配線上課程",
      examples: [true, false]
    }),
  withBooks: z.boolean().default(false)
    .describe("搭配書籍教材一起使用")
    .meta({
      title: "搭配書籍",
      examples: [true, false]
    }),
  withOtherTools: z.boolean().default(false)
    .describe("搭配其他工具或資源使用")
    .meta({
      title: "搭配其他工具",
      examples: [true, false]
    }),
  withCommunity: z.boolean().default(false)
    .describe("搭配社群或學習群組使用")
    .meta({
      title: "搭配社群",
      examples: [true, false]
    }),
  onlyThisResource: z.boolean().default(false)
    .describe("僅使用此資源，未搭配其他")
    .meta({
      title: "僅用此資源",
      examples: [true, false]
    }),
  notApplicableResource: z.boolean().default(false)
    .describe("資源使用方式不適用或無關")
    .meta({
      title: "不適用",
      examples: [true, false]
    })
}).describe("資源搭配使用方式的評估").meta({
  title: "資源使用方式",
  examples: [{
    withOnlineCourses: true,
    withBooks: false,
    withOtherTools: true,
    withCommunity: true,
    onlyThisResource: false,
    notApplicableResource: false
  }]
});

// 心得評價基本驗證 Schema
export const resourceReviewBaseSchema = z.object({
  content: z.string().min(1, { message: "評論內容不能為空" })
    .describe("資源使用心得和評價內容")
    .meta({
      title: "評論內容",
      examples: [
        "這個資源非常實用，內容結構清晰，例子豐富。特別是在解釋複雜概念時，能夠分階段引導學習者理解。",
        "適合初學者的好教材，步驟清晰，但在進階部分可能需要搭配其他資源。",
        "很有挑戰性的內容，讓我重新思考了很多既有的觀念。不過難度較高，建議有一定基礎再閱讀。"
      ]
    }),
  overallImpact: scoreSchema
    .describe("整體影響評分，反映資源的總體價值")
    .meta({
      title: "整體影響評分",
      examples: [4.5, 3.0, 5.0]
    }),
  changeMindset: scoreSchema
    .describe("改變思維方式的程度評分")
    .meta({
      title: "改變思維評分",
      examples: [3.5, 4.0, 2.5]
    }),
  solveProblems: scoreSchema
    .describe("解決實際問題的能力提升評分")
    .meta({
      title: "解決問題評分",
      examples: [4.0, 3.0, 4.5]
    }),
  gainPerspectives: scoreSchema
    .describe("獲得新觀點和洞見的程度評分")
    .meta({
      title: "獲得新觀點評分",
      examples: [5.0, 3.5, 4.0]
    }),
  achieveGoals: scoreSchema
    .describe("達成學習目標的幫助程度評分")
    .meta({
      title: "達成目標評分",
      examples: [4.0, 3.5, 5.0]
    }),
  timeUsage: timeUsageSchema.optional().nullable()
    .describe("使用資源的時間安排方式")
    .meta({
      title: "時間使用方式",
      examples: ["1_2_hours_daily", "spare_moments", null]
    }),
  contentFeatures: contentFeaturesSchema.optional().default({
    wellStructured: false,
    practiceFocused: false,
    wellRoundedConcepts: false,
    thoughtProvoking: false,
    progressiveLearning: false,
    problemBased: false,
    realWorldExamples: false,
    interactive: false,
    visuallyRich: false
  })
    .describe("資源內容特色的詳細評估")
    .meta({
      title: "內容特色評估",
      examples: [{
        wellStructured: true,
        practiceFocused: true,
        thoughtProvoking: false
      }]
    }),
  resourceUsage: resourceUsageSchema.optional().default({
    withOnlineCourses: false,
    withBooks: false,
    withOtherTools: false,
    withCommunity: false,
    onlyThisResource: false,
    notApplicableResource: false
  })
    .describe("資源搭配使用情況的評估")
    .meta({
      title: "資源使用情況",
      examples: [{
        withOnlineCourses: true,
        withCommunity: true,
        onlyThisResource: false
      }]
    }),
  tags: z.array(z.string()).optional()
    .describe("與評論相關的標籤列表")
    .meta({
      title: "評論標籤",
      examples: [
        ["初學者友善", "實作導向", "清晰易懂"],
        ["進階內容", "有挑戰性", "需要基礎"]
      ]
    })
}).describe("資源使用心得評論的基本資料結構").meta({
  title: "資源評論基本資料",
  examples: [{
    content: "這個資源非常實用，內容結構清晰，例子豐富。",
    overallImpact: 4.5,
    changeMindset: 4.0,
    solveProblems: 4.5,
    gainPerspectives: 5.0,
    achieveGoals: 4.0,
    timeUsage: "1_2_hours_daily",
    contentFeatures: {
      wellStructured: true,
      practiceFocused: true,
      realWorldExamples: true
    },
    resourceUsage: {
      withOnlineCourses: true,
      withCommunity: false,
      onlyThisResource: false
    },
    tags: ["初學者友善", "實作導向"]
  }]
});

// 建立心得評價驗證 Schema
export const resourceReviewSchema = resourceReviewBaseSchema
  .describe("創建資源使用心得評論的完整資料")
  .meta({
    title: "創建資源評論",
    examples: [{
      content: "完整的評論範例，包含使用心得和具體建議。",
      overallImpact: 4.5,
      changeMindset: 4.0,
      solveProblems: 4.5,
      gainPerspectives: 5.0,
      achieveGoals: 4.0,
      timeUsage: "1_2_hours_daily",
      tags: ["初學者友善", "實作導向"]
    }]
  });

// 更新心得評價驗證 Schema
export const updateResourceReviewSchema = resourceReviewBaseSchema.partial().extend({
  status: reviewStatusSchema.optional()
    .describe("更新後的評論狀態")
    .meta({
      title: "評論狀態",
      examples: ["published", "draft", "archived"]
    })
})
  .describe("更新資源評論的部分資料結構")
  .meta({
    title: "更新資源評論",
    examples: [{
      content: "更新後的評論內容",
      overallImpact: 4.0,
      status: "published"
    }]
  });

// 狀態更新驗證 Schema
export const updateReviewStatusSchema = z.object({
  status: reviewStatusSchema
    .describe("要更新的評論狀態")
    .meta({
      title: "新狀態",
      examples: ["published", "archived", "reported"]
    })
}).describe("僅更新評論狀態的請求資料").meta({
  title: "更新評論狀態",
  examples: [{
    status: "published"
  }]
});

// 使用 zod 推導型別
export type ResourceReviewSchema = z.infer<typeof resourceReviewSchema>;
export type UpdateResourceReviewSchema = z.infer<typeof updateResourceReviewSchema>;
export type UpdateReviewStatusSchema = z.infer<typeof updateReviewStatusSchema>;
export type ContentFeaturesSchema = z.infer<typeof contentFeaturesSchema>;
export type ResourceUsageSchema = z.infer<typeof resourceUsageSchema>;

// 用戶基本資訊 schema
const reviewAuthorSchema = z.object({
  id: z.number().int().describe('用戶 ID'),
  nickname: z.string().describe('用戶暱稱'),
  photoUrl: z.string().url().nullable().describe('用戶頭像 URL')
}).describe('評論作者基本資訊');

// 標籤基本資訊 schema
const reviewTagSchema = z.object({
  id: z.number().int().describe('標籤 ID'),
  name: z.string().describe('標籤名稱')
}).describe('評論標籤基本資訊');

// 心得評價回應 schema
export const resourceReviewResponseSchema = z.object({
  id: z.number().int().describe('評論 ID'),
  resourceId: z.string().uuid().describe('資源外部 ID (UUID)'),
  content: z.string().describe('評論內容'),
  overallImpact: scoreSchema.describe('整體影響力評分'),
  changeMindset: scoreSchema.describe('改變思維評分'),
  solveProblems: scoreSchema.describe('解決問題評分'),
  gainPerspectives: scoreSchema.describe('獲得新觀點評分'),
  achieveGoals: scoreSchema.describe('達成目標評分'),
  timeUsage: timeUsageSchema.nullable().describe('時間使用方式'),
  contentFeatures: contentFeaturesSchema.describe('內容特色'),
  resourceUsage: resourceUsageSchema.describe('資源使用方式'),
  status: reviewStatusSchema.describe('評論狀態'),
  author: reviewAuthorSchema.describe('評論作者'),
  tags: z.array(reviewTagSchema).describe('評論標籤'),
  likeCount: z.number().int().min(0).describe('點讚數'),
  createdAt: z.string().datetime().describe('創建時間'),
  updatedAt: z.string().datetime().describe('更新時間')
}).describe('心得評價詳情回應').meta({
  title: '心得評價詳情',
  examples: [{
    id: 123,
    resourceId: '550e8400-e29b-41d4-a716-446655440000',
    content: '這個資源真的很棒，幫助我學到了很多實用的技能。',
    overallImpact: 4.5,
    changeMindset: 4.0,
    solveProblems: 4.5,
    gainPerspectives: 5.0,
    achieveGoals: 4.0,
    timeUsage: '1_2_hours_daily',
    contentFeatures: {
      wellStructured: true,
      practiceFocused: true,
      wellRoundedConcepts: false,
      thoughtProvoking: true,
      progressiveLearning: false,
      problemBased: false,
      realWorldExamples: true,
      interactive: false,
      visuallyRich: false
    },
    resourceUsage: {
      withOnlineCourses: false,
      withMentorship: false,
      withPeerGroup: true,
      asComplementaryMaterial: false
    },
    status: 'published',
    author: {
      id: 456,
      nickname: '學習者小王',
      photoUrl: 'https://example.com/avatar/wang.jpg'
    },
    tags: [
      { id: 1, name: '實用' },
      { id: 2, name: '初學者友善' }
    ],
    likeCount: 15,
    createdAt: '2024-01-15T10:30:00.000Z',
    updatedAt: '2024-01-15T11:00:00.000Z'
  }]
});

// 建立具體的回應 schemas
export const getReviewByIdResponseSchema = apiSuccessResponseSchema(resourceReviewResponseSchema)
  .describe('獲取單個心得評價的回應')
  .meta({
    title: '獲取心得評價詳情回應',
    examples: [{
      success: true,
      data: {
        id: 123,
        resourceId: '550e8400-e29b-41d4-a716-446655440000',
        content: '非常實用的學習資源',
        overallImpact: 4.5,
        changeMindset: 4.0,
        solveProblems: 4.5,
        gainPerspectives: 5.0,
        achieveGoals: 4.0,
        timeUsage: '1_2_hours_daily',
        status: 'published',
        author: { id: 456, nickname: '學習者小王', photoUrl: 'https://example.com/avatar.jpg' },
        tags: [{ id: 1, name: '實用' }],
        likeCount: 15,
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T11:00:00.000Z'
      },
      timestamp: '2024-01-15T10:30:00.000Z'
    }]
  });

export const getReviewsListResponseSchema = cursorPaginatedApiResponseSchema(resourceReviewResponseSchema)
  .describe('獲取心得評價列表的回應')
  .meta({
    title: '獲取心得評價列表回應',
    examples: [{
      success: true,
      data: [
        {
          id: 123,
          resourceId: '550e8400-e29b-41d4-a716-446655440000',
          content: '很棒的學習資源',
          overallImpact: 4.5,
          changeMindset: 4.0,
          solveProblems: 4.5,
          gainPerspectives: 5.0,
          achieveGoals: 4.0,
          timeUsage: '1_2_hours_daily',
          status: 'published',
          author: { id: 456, nickname: '學習者小王', photoUrl: 'https://example.com/avatar.jpg' },
          tags: [{ id: 1, name: '實用' }],
          likeCount: 15,
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T11:00:00.000Z'
        }
      ],
      pagination: {
        cursors: { start: 'cursor1', end: 'cursor2' },
        hasMore: true,
        count: 1,
        limit: 10,
        hasNext: true,
        hasPrev: false,
        nextCursor: 'cursor2',
        prevCursor: null,
        totalEstimate: 25,
        parentTotalEstimate: null
      },
      timestamp: '2024-01-15T10:30:00.000Z'
    }]
  });

export const createReviewResponseSchema = apiSuccessResponseSchema(resourceReviewResponseSchema)
  .describe('創建心得評價的回應')
  .meta({
    title: '創建心得評價回應',
    examples: [{
      success: true,
      data: {
        id: 124,
        resourceId: '550e8400-e29b-41d4-a716-446655440001',
        content: '剛創建的心得評價',
        overallImpact: 4.0,
        changeMindset: 3.5,
        solveProblems: 4.0,
        gainPerspectives: 4.5,
        achieveGoals: 3.5,
        timeUsage: 'spare_moments',
        status: 'published',
        author: { id: 789, nickname: '新用戶', photoUrl: null },
        tags: [{ id: 3, name: '新手適用' }],
        likeCount: 0,
        createdAt: '2024-01-16T12:00:00.000Z',
        updatedAt: '2024-01-16T12:00:00.000Z'
      },
      timestamp: '2024-01-16T12:00:00.000Z'
    }]
  });

export const updateReviewResponseSchema = apiSuccessResponseSchema(resourceReviewResponseSchema)
  .describe('更新心得評價的回應');

export const deleteReviewResponseSchema = apiSuccessResponseSchema(z.object({
  message: z.string().describe('刪除成功訊息')
})).describe('刪除心得評價的回應').meta({
  title: '刪除心得評價回應',
  examples: [{
    success: true,
    data: { message: '心得評價已成功刪除' },
    timestamp: '2024-01-15T10:30:00.000Z'
  }]
});

export const likeReviewResponseSchema = apiSuccessResponseSchema(z.object({
  likeCount: z.number().int().min(0).describe('更新後的點讚數'),
  isLiked: z.boolean().describe('當前用戶是否已點讚')
})).describe('點讚/取消點讚心得評價的回應').meta({
  title: '點讚心得評價回應',
  examples: [{
    success: true,
    data: { likeCount: 16, isLiked: true },
    timestamp: '2024-01-15T10:30:00.000Z'
  }]
});

export const getReviewTagsResponseSchema = apiSuccessResponseSchema(z.array(z.string()))
  .describe('獲取心得評價標籤的回應')
  .meta({
    title: '獲取心得評價標籤回應',
    examples: [{
      success: true,
      data: ['實用', '初學者友善', '內容豐富'],
      timestamp: '2024-01-15T10:30:00.000Z'
    }]
  });

// 匯出驗證中間件
export const validateCreateResourceReview = (data: unknown): ResourceReviewSchema => resourceReviewSchema.parse(data);
export const validateUpdateResourceReview = (data: unknown): UpdateResourceReviewSchema => updateResourceReviewSchema.parse(data);
export const validateUpdateReviewStatus = (data: unknown): UpdateReviewStatusSchema => updateReviewStatusSchema.parse(data);

// 導出回應驗證函數
export const validateGetReviewByIdResponse = (data: unknown) => getReviewByIdResponseSchema.parse(data);
export const validateGetReviewsListResponse = (data: unknown) => getReviewsListResponseSchema.parse(data);
export const validateCreateReviewResponse = (data: unknown) => createReviewResponseSchema.parse(data);
export const validateUpdateReviewResponse = (data: unknown) => updateReviewResponseSchema.parse(data);
export const validateDeleteReviewResponse = (data: unknown) => deleteReviewResponseSchema.parse(data);
export const validateLikeReviewResponse = (data: unknown) => likeReviewResponseSchema.parse(data);
export const validateGetReviewTagsResponse = (data: unknown) => getReviewTagsResponseSchema.parse(data);
