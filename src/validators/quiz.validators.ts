/**
 * 測驗結果驗證器
 * 使用 Zod 進行請求數據和響應格式驗證
 */

import { z } from 'zod';
import { apiSuccessResponseSchema } from './api-response.validators';

/**
 * 測驗結果類型（單字母大寫）
 * 必須是 L, C, A, D, O 其中之一
 */
export const resultTypeSchema = z
  .string()
  .length(1)
  .regex(/^[LCADO]$/i, '結果類型必須是 L, C, A, D, O 其中之一')
  .transform(val => val.toUpperCase())
  .describe('測驗結果類型')
  .meta({
    title: '測驗結果類型',
    examples: ['L', 'C', 'A', 'D', 'O'],
    enumDescriptions: {
      'L': 'Leadership (跨域領導)',
      'C': 'Connection (連結網絡)',
      'A': 'Action (行動實踐)',
      'D': 'Discovery (探究思考)',
      'O': 'Organization (結構組織)'
    }
  });

/**
 * 分數對象
 * Key 為維度代碼，Value 為該維度的分數
 */
export const scoresSchema = z
  .record(z.string(), z.number())
  .describe('各類型分數對象')
  .meta({
    title: '各維度分數',
    examples: [
      {
        'L': 10,
        'C': 8,
        'A': 12,
        'D': 6,
        'O': 9
      }
    ]
  });

/**
 * 答案對象（選用）
 * Key 為題號，Value 包含用戶選擇的答案
 */
export const answersSchema = z
  .record(
    z.string(),
    z.object({
      selectedAnswer: z.string().describe('用戶選擇的答案')
        .meta({
          title: '選擇的答案',
          examples: ['A', 'L', 'C', 'D', 'O']
        })
    })
  )
  .optional()
  .describe('原始答案記錄')
  .meta({
    title: '答題記錄',
    examples: [
      {
        '1': { selectedAnswer: 'A' },
        '2': { selectedAnswer: 'L' },
        '3': { selectedAnswer: 'C' }
      }
    ]
  });

/**
 * 保存測驗結果請求體
 */
export const saveQuizResultSchema = z.object({
  body: z.object({
    resultType: resultTypeSchema,
    scores: scoresSchema,
    answers: answersSchema
  }).describe('保存測驗結果請求資料')
    .meta({
      title: '保存測驗結果',
      examples: [
        {
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
      ]
    })
});

/**
 * 測驗結果響應數據結構
 */
export const quizResultDataSchema = z.object({
  id: z.number().describe('結果 ID')
    .meta({
      title: '結果 ID',
      examples: [123, 456, 789]
    }),
  resultType: z.string().describe('結果類型')
    .meta({
      title: '結果類型',
      examples: ['A', 'L', 'C', 'D', 'O']
    }),
  scores: scoresSchema,
  completedAt: z.date().or(z.string()).describe('完成時間')
    .meta({
      title: '完成時間',
      examples: ['2026-01-07T14:30:00.000Z', '2026-01-07T10:15:30.000Z']
    })
}).describe('測驗結果數據')
  .meta({
    title: '測驗結果',
    examples: [
      {
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
    ]
  });

/**
 * 保存測驗結果響應
 */
export const saveQuizResultResponseSchema = apiSuccessResponseSchema(
  quizResultDataSchema
).describe('保存測驗結果成功響應');

/**
 * 取得測驗結果響應
 */
export const getQuizResultResponseSchema = apiSuccessResponseSchema(
  quizResultDataSchema
).describe('取得測驗結果成功響應');

// 導出類型
export type SaveQuizResultRequest = z.infer<typeof saveQuizResultSchema.shape.body>;
export type QuizResultData = z.infer<typeof quizResultDataSchema>;
