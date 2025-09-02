/**
 * @swagger
 * components:
 *   schemas:
 *     PreferenceOption:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: 偏好選項顯示名稱
 *           example: "視覺學習"
 *         value:
 *           type: string
 *           description: 偏好選項值
 *           example: "visual"
 * 
 *     UserPreferences:
 *       type: object
 *       additionalProperties:
 *         type: array
 *         items:
 *           $ref: '#/components/schemas/PreferenceOption'
 *       description: 用戶偏好設定，key 為偏好類型，value 為選項陣列
 *       example:
 *         learning_style:
 *           - name: "視覺學習"
 *             value: "visual"
 *           - name: "聽覺學習" 
 *             value: "audio"
 *         difficulty_level:
 *           - name: "初學者"
 *             value: "beginner"
 * 
 *     UserPreferencesRequest:
 *       type: object
 *       required:
 *         - preferences
 *       properties:
 *         preferences:
 *           type: object
 *           additionalProperties:
 *             type: array
 *             items:
 *               type: string
 *           description: 偏好設定，key 為偏好類型，value 為選項值陣列
 *           example:
 *             learning_style: ["visual", "audio"]
 *             difficulty_level: ["beginner"]
 * 
 *     AvailablePreferences:
 *       type: object
 *       additionalProperties:
 *         type: array
 *         items:
 *           $ref: '#/components/schemas/PreferenceOption'
 *       description: 所有可用的偏好選項
 *       example:
 *         learning_style:
 *           - name: "視覺學習"
 *             value: "visual"
 *           - name: "聽覺學習"
 *             value: "audio"
 *           - name: "動覺學習"
 *             value: "kinesthetic"
 *         difficulty_level:
 *           - name: "初學者"
 *             value: "beginner"
 *           - name: "中級"
 *             value: "intermediate"
 *           - name: "進階"
 *             value: "advanced"
 *     ContactList:
 *       type: object
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: 電子郵件
 *         photoUrl:
 *           type: string
 *           format: uri
 *           description: 大頭照 URL
 *         isSubscribeEmail:
 *           type: boolean
 *           description: 是否訂閱電子郵件
 *         instagram:
 *           type: string
 *           description: Instagram 帳號
 *         discord:
 *           type: string
 *           description: Discord 帳號
 *         line:
 *           type: string
 *           description: Line 帳號
 *         facebook:
 *           type: string
 *           description: Facebook 帳號
 * 
 *     BasicInfo:
 *       type: object
 *       properties:
 *         selfIntroduction:
 *           type: string
 *           description: 自我介紹
 *         shareList:
 *           oneOf:
 *             - type: string
 *             - type: array
 *               items:
 *                 type: string
 *           description: 分享列表
 *         wantToDoList:
 *           type: array
 *           items:
 *             type: string
 *           description: 想做的事情列表
 * 
 *     FormattedUser:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 用戶內部 ID
 *         _id:
 *           type: string
 *           format: uuid
 *           description: 用戶外部 ID (external_id)
 *         name:
 *           type: string
 *           description: 用戶名稱 (nickname)
 *         gender:
 *           type: string
 *           enum: [male, female, other]
 *           description: 性別
 *         email:
 *           type: string
 *           format: email
 *           description: 電子郵件
 *         photoURL:
 *           type: string
 *           format: uri
 *           description: 大頭照 URL
 *         birthDay:
 *           type: string
 *           format: date
 *           description: 生日
 *         isOpenLocation:
 *           type: boolean
 *           description: 是否公開位置
 *         isOpenProfile:
 *           type: boolean
 *           description: 是否公開個人資料
 *         role:
 *           type: integer
 *           description: 角色 ID
 *         location:
 *           type: string
 *           description: 位置
 *         tagList:
 *           type: array
 *           items:
 *             type: string
 *           description: 標籤列表
 *         wantToDoList:
 *           type: array
 *           items:
 *             type: string
 *           description: 想做的事情列表
 *         educationStage:
 *           type: string
 *           enum: [university, high, other]
 *           description: 教育階段
 *         selfIntroduction:
 *           type: string
 *           description: 自我介紹
 *         share:
 *           oneOf:
 *             - type: string
 *             - type: array
 *               items:
 *                 type: string
 *           description: 分享內容
 *         preferences:
 *           $ref: '#/components/schemas/UserPreferences'
 *         contactList:
 *           $ref: '#/components/schemas/ContactList'
 *         basicInfo:
 *           $ref: '#/components/schemas/BasicInfo'
 *         roleList:
 *           type: array
 *           items:
 *             type: string
 *           description: 角色列表
 *         customId:
 *           type: string
 *           description: 用戶自訂 ID
 *         customIdVerified:
 *           type: boolean
 *           description: 自訂 ID 是否已驗證
 *         customIdCreatedAt:
 *           type: string
 *           format: date-time
 *           description: 自訂 ID 創建時間
 *         createdDate:
 *           type: string
 *           format: date-time
 *           description: 創建時間
 *         updatedDate:
 *           type: string
 *           format: date-time
 *           description: 更新時間
 * 
 *     CreateUserRequest:
 *       type: object
 *       properties:
 *         gender:
 *           type: string
 *           enum: [male, female, other]
 *           description: 性別
 *         birthDate:
 *           oneOf:
 *             - type: string
 *               format: date
 *             - type: string
 *               format: date-time
 *           description: 生日
 *         contactList:
 *           type: object
 *           properties:
 *             instagram:
 *               type: string
 *               description: Instagram 帳號
 *             discord:
 *               type: string
 *               description: Discord 帳號
 *             line:
 *               type: string
 *               description: Line 帳號
 *             facebook:
 *               type: string
 *               description: Facebook 帳號
 *         educationStage:
 *           type: string
 *           enum: [university, high, other]
 *           description: 教育階段
 *         isOpenLocation:
 *           type: boolean
 *           description: 是否公開位置
 *         isOpenProfile:
 *           type: boolean
 *           description: 是否公開個人資料
 *         isSubscribeEmail:
 *           type: boolean
 *           description: 是否訂閱電子郵件
 *         location:
 *           type: string
 *           description: 地區代碼
 *         roleList:
 *           type: array
 *           items:
 *             type: string
 *           description: 角色列表
 *         selfIntroduction:
 *           type: string
 *           description: 自我介紹
 *         share:
 *           oneOf:
 *             - type: string
 *             - type: array
 *               items:
 *                 type: string
 *           description: 分享內容
 *         wantToDoList:
 *           type: array
 *           items:
 *             type: string
 *           description: 想做的事情列表
 *         tagList:
 *           type: array
 *           items:
 *             type: string
 *           description: 標籤列表
 *         interestList:
 *           type: array
 *           items:
 *             type: string
 *           description: 興趣列表
 *         preferences:
 *           type: object
 *           additionalProperties:
 *             type: array
 *             items:
 *               type: string
 *           description: 偏好設定
 *           example:
 *             learning_style: ["visual", "audio"]
 *             difficulty_level: ["beginner"]
 *         isSendEmail:
 *           type: boolean
 *           description: 是否發送電子郵件
 * 
 *     UpdateUserRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: 用戶名稱
 *         email:
 *           type: string
 *           format: email
 *           description: 電子郵件
 *         photoUrl:
 *           type: string
 *           format: uri
 *           description: 大頭照 URL
 *         gender:
 *           type: string
 *           enum: [male, female, other]
 *           description: 性別
 *         birthDate:
 *           oneOf:
 *             - type: string
 *               format: date
 *             - type: string
 *               format: date-time
 *           description: 生日
 *         contactList:
 *           type: object
 *           properties:
 *             instagram:
 *               type: string
 *               description: Instagram 帳號
 *             discord:
 *               type: string
 *               description: Discord 帳號
 *             line:
 *               type: string
 *               description: Line 帳號
 *             facebook:
 *               type: string
 *               description: Facebook 帳號
 *         educationStage:
 *           type: string
 *           enum: [university, high, other]
 *           description: 教育階段
 *         isOpenLocation:
 *           type: boolean
 *           description: 是否公開位置
 *         isOpenProfile:
 *           type: boolean
 *           description: 是否公開個人資料
 *         isSubscribeEmail:
 *           type: boolean
 *           description: 是否訂閱電子郵件
 *         selfIntroduction:
 *           type: string
 *           description: 自我介紹
 *         share:
 *           oneOf:
 *             - type: string
 *             - type: array
 *               items:
 *                 type: string
 *           description: 分享內容
 *         wantToDoList:
 *           type: array
 *           items:
 *             type: string
 *           description: 想做的事情列表
 *         tagList:
 *           type: array
 *           items:
 *             type: string
 *           description: 標籤列表
 *         roleList:
 *           type: array
 *           items:
 *             type: string
 *           description: 角色列表
 *         interestList:
 *           type: array
 *           items:
 *             type: string
 *           description: 興趣列表
 *         preferences:
 *           type: object
 *           additionalProperties:
 *             type: array
 *             items:
 *               type: string
 *           description: 偏好設定
 *           example:
 *             learning_style: ["visual", "audio"]
 *             difficulty_level: ["beginner"]
 * 
 *     CustomIdRequest:
 *       type: object
 *       required:
 *         - customId
 *       properties:
 *         customId:
 *           type: string
 *           pattern: '^[a-zA-Z0-9_-]{3,50}$'
 *           description: 自訂 ID，3-50個字符，只能包含英文字母、數字、底線和連字符
 *           example: "my_custom_id"
 * 
 *     CustomIdAvailabilityResponse:
 *       type: object
 *       properties:
 *         available:
 *           type: boolean
 *           description: 自訂 ID 是否可用
 *           example: true
 * 
 *     CustomIdSetResponse:
 *       type: object
 *       properties:
 *         customId:
 *           type: string
 *           description: 設置的自訂 ID
 *           example: "my_custom_id"
 */