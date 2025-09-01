/**
 * @swagger
 * components:
 *   schemas:
 *     MentorMarathonAssignRequest:
 *       type: object
 *       required:
 *         - mentorId
 *         - eventId
 *       properties:
 *         mentorId:
 *           type: integer
 *           description: 導師 ID
 *           example: 1
 *         eventId:
 *           type: string
 *           description: 活動 ID
 *           example: "marathon_2024_spring"
 *     
 *     MentorMarathonUpdateRequest:
 *       type: object
 *       properties:
 *         marathonId:
 *           type: string
 *           description: 馬拉松 ID
 *           example: "marathon_001"
 *     
 *     MentorMarathonAssignmentResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 指派記錄 ID
 *           example: 1
 *         mentorId:
 *           type: integer
 *           description: 導師 ID
 *           example: 1
 *         marathonId:
 *           type: integer
 *           description: 馬拉松 ID
 *           example: 1
 *         eventId:
 *           type: string
 *           description: 活動 ID
 *           example: "marathon_2024_spring"
 *         assignedAt:
 *           type: string
 *           format: date-time
 *           description: 指派時間
 *           example: "2024-01-15T10:30:00Z"
 *     
 *     MentorParticipantAssignRequest:
 *       type: object
 *       required:
 *         - participantId
 *       properties:
 *         participantId:
 *           type: integer
 *           description: 參與者 ID
 *           example: 2
 *     
 *     MentorParticipantResponse:
 *       type: object
 *       properties:
 *         mentorId:
 *           type: integer
 *           description: 導師 ID
 *           example: 1
 *         participantId:
 *           type: integer
 *           description: 參與者 ID
 *           example: 2
 *         assignedAt:
 *           type: string
 *           format: date-time
 *           description: 指派時間
 *           example: "2024-01-15T10:30:00Z"
 *     
 *     MentorMarathonResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 馬拉松 ID
 *           example: 1
 *         eventId:
 *           type: string
 *           description: 活動 ID
 *           example: "marathon_2024_spring"
 *         title:
 *           type: string
 *           description: 馬拉松標題
 *           example: "2024 春季學習馬拉松"
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: 開始日期
 *           example: "2024-03-01T00:00:00Z"
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: 結束日期
 *           example: "2024-05-31T23:59:59Z"
 *         participantCount:
 *           type: integer
 *           description: 參與者數量
 *           example: 25
 *     
 *     ParticipantDetailResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 使用者 ID
 *           example: 2
 *         username:
 *           type: string
 *           description: 使用者名稱
 *           example: "john_doe"
 *         name:
 *           type: string
 *           description: 真實姓名
 *           example: "John Doe"
 *         email:
 *           type: string
 *           format: email
 *           description: 電子郵件
 *           example: "john@example.com"
 *         location:
 *           type: string
 *           description: 位置
 *           example: "台北市"
 *         wantToDoList:
 *           type: array
 *           items:
 *             type: string
 *           description: 想做的事情清單
 *           example: ["學習 React", "完成專案"]
 *         share:
 *           oneOf:
 *             - type: string
 *             - type: array
 *               items:
 *                 type: string
 *           description: 分享內容
 *           example: "分享學習心得"
 *         updatedDate:
 *           type: string
 *           format: date-time
 *           description: 更新日期
 *           example: "2024-01-15T10:30:00Z"
 *         projectId:
 *           type: string
 *           description: 專案 ID
 *           example: "project_001"
 *         projectTitle:
 *           type: string
 *           description: 專案標題
 *           example: "前端開發學習計畫"
 *     
 *     MentorMarathonParticipantsResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 馬拉松 ID
 *           example: 1
 *         eventId:
 *           type: string
 *           description: 活動 ID
 *           example: "marathon_2024_spring"
 *         title:
 *           type: string
 *           description: 馬拉松標題
 *           example: "2024 春季學習馬拉松"
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: 開始日期
 *           example: "2024-03-01T00:00:00Z"
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: 結束日期
 *           example: "2024-05-31T23:59:59Z"
 *         participants:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ParticipantDetailResponse'
 *           description: 參與者列表
 *     
 *     MentorParticipantReviewsResponse:
 *       type: object
 *       properties:
 *         marathon:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *               description: 馬拉松 ID
 *               example: 1
 *             eventId:
 *               type: string
 *               description: 活動 ID
 *               example: "marathon_2024_spring"
 *             title:
 *               type: string
 *               description: 馬拉松標題
 *               example: "2024 春季學習馬拉松"
 *             startDate:
 *               type: string
 *               format: date-time
 *               description: 開始日期
 *               example: "2024-03-01T00:00:00Z"
 *             endDate:
 *               type: string
 *               format: date-time
 *               description: 結束日期
 *               example: "2024-05-31T23:59:59Z"
 *         reviews:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ReviewResponse'
 *           description: 覆盤列表
 *     
 *     MentorStats:
 *       type: object
 *       properties:
 *         totalMarathons:
 *           type: integer
 *           description: 總馬拉松數量
 *           example: 5
 *         totalParticipants:
 *           type: integer
 *           description: 總參與者數量
 *           example: 120
 *         activeMarathons:
 *           type: integer
 *           description: 活躍馬拉松數量
 *           example: 2
 *         completedMarathons:
 *           type: integer
 *           description: 已完成馬拉松數量
 *           example: 3
 *         averageParticipantsPerMarathon:
 *           type: number
 *           format: float
 *           description: 每個馬拉松平均參與者數量
 *           example: 24.0
 */

export {};