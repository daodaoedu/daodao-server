/**
 * 測驗結果驗證器 - OpenAPI 版本
 * 使用 @asteasolutions/zod-to-openapi
 *
 * 🔄 遷移指南：
 * 1. 將 .meta() 改為 .openapi()
 * 2. 使用 effectType 處理 .transform() 和 .refine()
 * 3. 使用 registry.register() 註冊 schemas
 */

import { z } from 'zod';
import { registry } from '@/config/openapi-registry';

/**
 * 測驗結果類型（單字母大寫）
 * 必須是 L, C, A, D, O 其中之一
 */
export const resultTypeSchema = z
  .string()
  .length(1)
  .regex(/^[LCADO]$/i, '結果類型必須是 L, C, A, D, O 其中之一')
  .transform(val => val.toUpperCase())
  .openapi({
    description: '測驗結果類型 (L=Leadership, C=Connection, A=Action, D=Discovery, O=Organization)',
    example: 'A',
    examples: ['L', 'C', 'A', 'D', 'O']
  });

/**
 * 分數對象
 * Key 為維度代碼，Value 為該維度的分數
 */
export const scoresSchema = z
  .record(z.string(), z.number())
  .openapi('QuizScores', {
    description: '各維度分數對象 (L=Leadership, C=Connection, A=Action, D=Discovery, O=Organization)',
    example: {
      'L': 10,
      'C': 8,
      'A': 12,
      'D': 6,
      'O': 9
    }
  });

/**
 * 答案對象（選用）
 * Key 為題號，Value 包含用戶選擇的答案
 */
export const answersSchema = z
  .record(
    z.string(),
    z.object({
      selectedAnswer: z.string().openapi({
        description: '用戶選擇的答案',
        example: 'A',
        examples: ['A', 'L', 'C', 'D', 'O']
      })
    })
  )
  .optional()
  .openapi('QuizAnswers', {
    description: '原始答題記錄',
    example: {
      '1': { selectedAnswer: 'A' },
      '2': { selectedAnswer: 'L' },
      '3': { selectedAnswer: 'C' }
    }
  });

/**
 * 保存測驗結果請求體
 */
export const saveQuizResultBodySchema = z.object({
  resultType: resultTypeSchema,
  scores: scoresSchema,
  answers: answersSchema
}).openapi('SaveQuizResultRequest', {
  description: '保存測驗結果請求資料',
  example: {
    resultType: 'A',
    scores: {
      'L': 10,
      'C': 8,
      'A': 12,
      'D': 6,
      'O': 9
    },
    answers: {
      '1': { selectedAnswer: 'A' },
      '2': { selectedAnswer: 'L' },
      '3': { selectedAnswer: 'C' }
    }
  }
});

export const saveQuizResultSchema = z.object({
  body: saveQuizResultBodySchema
});

/**
 * 測驗結果響應數據結構
 */
export const quizResultDataSchema = z.object({
  id: z.number()
    .int()
    .positive()
    .openapi({
      description: '結果 ID',
      example: 123
    }),
  resultType: z.string().openapi({
    description: '結果類型 (L, C, A, D, O)',
    example: 'A',
    examples: ['A', 'L', 'C', 'D', 'O']
  }),
  scores: scoresSchema,
  completedAt: z.string().datetime().openapi({
    description: '完成時間',
    example: '2026-01-07T14:30:00.000Z',
    format: 'date-time'
  })
}).openapi('QuizResultData', {
  description: '測驗結果數據',
  example: {
    id: 123,
    resultType: 'A',
    scores: {
      'L': 10,
      'C': 8,
      'A': 12,
      'D': 6,
      'O': 9
    },
    completedAt: '2026-01-07T14:30:00.000Z'
  }
});

/**
 * 保存測驗結果響應
 */
export const saveQuizResultResponseSchema = z.object({
  success: z.literal(true).openapi({
    description: '請求成功標誌',
    example: true
  }),
  data: quizResultDataSchema,
  timestamp: z.string().datetime().openapi({
    description: '回應時間戳',
    example: '2026-01-07T14:30:00.000Z',
    format: 'date-time'
  })
}).openapi('SaveQuizResultResponse', {
  description: '保存測驗結果成功響應'
});

/**
 * 取得測驗結果響應
 */
export const getQuizResultResponseSchema = z.object({
  success: z.literal(true).openapi({
    description: '請求成功標誌',
    example: true
  }),
  data: quizResultDataSchema,
  timestamp: z.string().datetime().openapi({
    description: '回應時間戳',
    example: '2026-01-07T14:30:00.000Z',
    format: 'date-time'
  })
}).openapi('GetQuizResultResponse', {
  description: '取得測驗結果成功響應'
});

// ===================================
// 🎯 註冊 schemas 到 OpenAPI registry
// ===================================

registry.register('QuizScores', scoresSchema);
registry.register('QuizAnswers', answersSchema);
registry.register('SaveQuizResultRequest', saveQuizResultBodySchema);
registry.register('QuizResultData', quizResultDataSchema);
registry.register('SaveQuizResultResponse', saveQuizResultResponseSchema);
registry.register('GetQuizResultResponse', getQuizResultResponseSchema);

// 導出類型
export type SaveQuizResultRequest = z.infer<typeof saveQuizResultBodySchema>;
export type QuizResultData = z.infer<typeof quizResultDataSchema>;
