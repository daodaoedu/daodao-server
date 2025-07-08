/**
 * @swagger
 * components:
 *   schemas:
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
 *         contactList:
 *           $ref: '#/components/schemas/ContactList'
 *         basicInfo:
 *           $ref: '#/components/schemas/BasicInfo'
 *         roleList:
 *           type: array
 *           items:
 *             type: string
 *           description: 角色列表
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
 */