/**
 * @swagger
 * /api/v1/mentor/marathon:
 *   post:
 *     summary: 指定導師參與馬拉松
 *     description: 將導師指派到特定的馬拉松活動
 *     tags: [Mentor]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MentorMarathonAssignRequest'
 *     responses:
 *       201:
 *         description: 導師成功指派到馬拉松
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccessResponse'
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/MentorMarathonAssignmentResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       409:
 *         $ref: '#/components/responses/ConflictError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /api/v1/mentor/marathon/{assignmentId}:
 *   put:
 *     summary: 更新導師馬拉松關聯
 *     description: 修改導師與馬拉松的關聯設定
 *     tags: [Mentor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 指派記錄 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MentorMarathonUpdateRequest'
 *     responses:
 *       200:
 *         description: 導師馬拉松關聯更新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccessResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   delete:
 *     summary: 刪除導師馬拉松關聯
 *     description: 移除導師與馬拉松的關聯
 *     tags: [Mentor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 指派記錄 ID
 *     responses:
 *       200:
 *         description: 導師馬拉松關聯刪除成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccessResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /api/v1/mentor/marathons:
 *   get:
 *     summary: 獲取導師參與的馬拉松列表
 *     description: 取得當前導師參與或負責的所有馬拉松活動
 *     tags: [Mentor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/pageSizeParam'
 *     responses:
 *       200:
 *         description: 導師馬拉松列表獲取成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccessResponse'
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MentorMarathonResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /api/v1/mentor/participant:
 *   post:
 *     summary: 指定參與者給導師
 *     description: 將參與者分配給導師進行指導
 *     tags: [Mentor]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MentorParticipantAssignRequest'
 *     responses:
 *       201:
 *         description: 參與者成功指派給導師
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccessResponse'
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/MentorParticipantResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       409:
 *         $ref: '#/components/responses/ConflictError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /api/v1/mentor/participant/{participantId}:
 *   put:
 *     summary: 更新導師參與者關聯
 *     description: 修改導師與參與者的關聯設定
 *     tags: [Mentor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: participantId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 參與者 ID
 *     responses:
 *       200:
 *         description: 導師參與者關聯更新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccessResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       501:
 *         description: 功能尚未實作
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   delete:
 *     summary: 移除導師參與者關聯
 *     description: 取消導師與參與者的指導關係
 *     tags: [Mentor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: participantId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 參與者 ID
 *     responses:
 *       200:
 *         description: 導師參與者關聯移除成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccessResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /api/v1/mentor/marathon/{eventId}/participants:
 *   get:
 *     summary: 獲取導師在某個馬拉松的參與者列表
 *     description: 取得導師在指定馬拉松活動中負責的所有參與者
 *     tags: [Mentor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: 活動 ID
 *         example: "marathon_2024_spring"
 *     responses:
 *       200:
 *         description: 參與者列表獲取成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccessResponse'
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/MentorMarathonParticipantsResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /api/v1/mentor/marathon/{eventId}/reviews:
 *   get:
 *     summary: 獲取導師參與者在某個馬拉松的覆盤資料
 *     description: 取得導師負責的參與者在指定馬拉松中的學習覆盤記錄
 *     tags: [Mentor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: 活動 ID
 *         example: "marathon_2024_spring"
 *     responses:
 *       200:
 *         description: 覆盤資料獲取成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccessResponse'
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/MentorParticipantReviewsResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

export {};