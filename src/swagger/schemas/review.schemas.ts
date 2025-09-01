/**
 * @swagger
 * components:
 *   schemas:
 *     MoodType:
 *       type: string
 *       enum: [excellent, good, neutral, poor, terrible]
 *       description: 心情類型
 *       example: good
 *     
 *     StressLevel:
 *       type: integer
 *       minimum: 1
 *       maximum: 10
 *       description: 壓力等級 (1-10)
 *       example: 5
 *     
 *     LearningReviewLevel:
 *       type: integer
 *       minimum: 1
 *       maximum: 10
 *       description: 學習回顧等級 (1-10)
 *       example: 8
 *     
 *     ReviewCreateRequest:
 *       type: object
 *       required:
 *         - week
 *         - mood
 *         - stressLevel
 *         - learningReview
 *       properties:
 *         week:
 *           type: integer
 *           description: 週數
 *           example: 1
 *         title:
 *           type: string
 *           description: 覆盤標題
 *           example: "第一週學習覆盤"
 *         mood:
 *           $ref: '#/components/schemas/MoodType'
 *         stressLevel:
 *           $ref: '#/components/schemas/StressLevel'
 *         moodDescription:
 *           type: string
 *           description: 心情描述
 *           example: "本週學習進度良好，心情愉快"
 *         learningReview:
 *           $ref: '#/components/schemas/LearningReviewLevel'
 *         learningFeedback:
 *           type: string
 *           description: 學習回饋
 *           example: "React 基礎概念已掌握，需要更多實作練習"
 *         adjustmentPlan:
 *           type: string
 *           description: 調整計劃
 *           example: "下週增加實作練習時間"
 *         visibility:
 *           $ref: '#/components/schemas/Visibility'
 *     
 *     ReviewUpdateRequest:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           description: 覆盤標題
 *           example: "第一週學習覆盤（更新）"
 *         mood:
 *           $ref: '#/components/schemas/MoodType'
 *         stressLevel:
 *           $ref: '#/components/schemas/StressLevel'
 *         moodDescription:
 *           type: string
 *           description: 心情描述
 *           example: "經過調整後心情更好了"
 *         learningReview:
 *           $ref: '#/components/schemas/LearningReviewLevel'
 *         learningFeedback:
 *           type: string
 *           description: 學習回饋
 *           example: "實作練習後理解更深入了"
 *         adjustmentPlan:
 *           type: string
 *           description: 調整計劃
 *           example: "持續增加實作練習，加入更多專案"
 *         visibility:
 *           $ref: '#/components/schemas/Visibility'
 *     
 *     ReviewResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 覆盤 ID
 *           example: 1
 *         week:
 *           type: integer
 *           description: 週數
 *           example: 1
 *         title:
 *           type: string
 *           description: 覆盤標題
 *           example: "第一週學習覆盤"
 *         mood:
 *           $ref: '#/components/schemas/MoodType'
 *         stressLevel:
 *           $ref: '#/components/schemas/StressLevel'
 *         moodDescription:
 *           type: string
 *           description: 心情描述
 *           example: "本週學習進度良好，心情愉快"
 *         learningReview:
 *           type: string
 *           description: 學習回顧
 *           example: "8"
 *         learningFeedback:
 *           type: string
 *           description: 學習回饋
 *           example: "React 基礎概念已掌握，需要更多實作練習"
 *         adjustmentPlan:
 *           type: string
 *           description: 調整計劃
 *           example: "下週增加實作練習時間"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 建立時間
 *           example: "2024-01-15T10:30:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: 更新時間
 *           example: "2024-01-16T14:20:00Z"
 *     
 *     ReviewStats:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *           description: 總覆盤數量
 *           example: 12
 *         averageStressLevel:
 *           type: number
 *           format: float
 *           description: 平均壓力等級
 *           example: 5.2
 *         averageLearningReview:
 *           type: number
 *           format: float
 *           description: 平均學習回顧等級
 *           example: 7.8
 *         moodDistribution:
 *           type: object
 *           additionalProperties:
 *             type: integer
 *           description: 心情分布統計
 *           example:
 *             excellent: 2
 *             good: 6
 *             neutral: 3
 *             poor: 1
 *             terrible: 0
 *         weeklyProgress:
 *           type: object
 *           additionalProperties:
 *             $ref: '#/components/schemas/ReviewResponse'
 *           description: 按週統計的覆盤進度
 */

export {};