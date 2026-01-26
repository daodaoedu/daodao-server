/**
 * 用戶驗證器
 * 使用 Zod 實現用戶相關驗證
 * 使用 @asteasolutions/zod-to-openapi 進行 OpenAPI 整合
 */

import { z } from 'zod';
import { registry } from '../config/openapi-registry';
import {
  apiSuccessResponseSchema,
  paginatedApiResponseSchema
} from './api-response.validators';
import { PROFESSIONAL_FIELDS, REFERRAL_SOURCES } from '../types/user.types';
import {
  customIdAvailabilityDataSchema,
  setCustomIdDataSchema,
  removeCustomIdDataSchema
} from './user-custom-id.validators';

// 專業領域驗證 schema (支援多選)
const professionalFieldSchema = z
  .array(z.enum(PROFESSIONAL_FIELDS))
  .max(3, '最多選擇 3 個專業領域')
  .optional()
  .openapi({
    description: 'ESCO 專業領域分類 (可複選，最多 3 個)',
    example: ['information_and_communication_technologies_icts'],
    examples: [
      ['information_and_communication_technologies_icts'],
      ['education', 'business_administration_and_law'],
      ['arts_and_humanities', 'social_sciences_journalism_and_information', 'language_skills_and_knowledge']
    ]
  });

// 興趣清單驗證 schema (接受 category name 陣列)
const interestListSchema = z
  .array(z.string())
  .max(5, '最多選擇 5 個興趣')
  .optional()
  .openapi({
    description: '興趣分類清單 (category names)',
    example: ['information_and_computer_science', 'education_learning'],
    examples: [
      ['information_and_computer_science', 'education_learning'],
      ['nature_environment', 'arts_and_design']
    ]
  });

// 個人標語驗證 schema
const personalSloganSchema = z
  .string()
  .min(1, '標語不可為空')
  .max(200, '標語長度不可超過 200 字')
  .optional()
  .openapi({
    description: '個人標語 (一句話介紹自己)',
    example: '終身學習者,熱愛程式設計與教育',
    examples: [
      '終身學習者,熱愛程式設計與教育',
      '用教育改變世界',
      '探索未知,分享知識'
    ]
  });

// 資訊來源驗證 schema
const referralSourceSchema = z
  .union([
    z.enum(REFERRAL_SOURCES),
    z.string().min(1).max(100) // 允許自定義輸入
  ])
  .optional()
  .openapi({
    description: '資訊來源 (如何得知島島阿學)',
    example: 'instagram',
    examples: ['instagram', 'facebook', 'friend_referral', 'others']
  });

// 聯絡資訊 schema
const contactListSchema = z.object({
  instagram: z.string()
    .optional()
    .openapi({
      description: 'Instagram 帳號',
      example: '@john_doe'
    }),
  discord: z.string()
    .optional()
    .openapi({
      description: 'Discord 帳號',
      example: 'JohnDoe#1234'
    }),
  line: z.string()
    .optional()
    .openapi({
      description: 'LINE ID',
      example: 'john_doe_line'
    }),
  facebook: z.string()
    .optional()
    .openapi({
      description: 'Facebook 帳號',
      example: 'john.doe.fb'
    }),
  threads: z.string()
    .optional()
    .openapi({
      description: 'Threads 帳號',
      example: '@john_doe'
    }),
  linkedin: z.string()
    .optional()
    .openapi({
      description: 'LinkedIn 個人檔案網址或用戶名',
      example: 'john-doe-123456'
    })
}).optional().openapi('ContactList', {
  description: '用戶聯絡資訊'
});

// 註冊 ContactList 為可重用組件
registry.register('ContactList', contactListSchema);

// 創建用戶 schema
export const createUserSchema = z.object({
  gender: z.enum(['male', 'female', 'other'], "無效的性別")
    .optional()
    .openapi({
      description: '性別',
      example: 'male',
      examples: ['male', 'female', 'other']
    }),
  birthDay: z.string().or(z.date())
    .optional()
    .openapi({
      description: '出生日期',
      example: '1995-06-15',
      examples: ['1995-06-15', '2000-12-25', '1988-03-08']
    }),
  contactList: contactListSchema,
  educationStage: z.enum(['university', 'high', 'other'], "無效的教育階段")
    .optional()
    .openapi({
      description: '教育階段',
      example: 'university',
      examples: ['university', 'high', 'other']
    }),
  isOpenLocation: z.boolean()
    .optional()
    .openapi({
      description: '是否公開位置資訊',
      example: true
    }),
  isOpenProfile: z.boolean()
    .optional()
    .openapi({
      description: '是否公開個人資料',
      example: true
    }),
  isSubscribeEmail: z.boolean()
    .optional()
    .openapi({
      description: '是否訂閱電子郵件',
      example: true
    }),
  location: z.string()
    .optional()
    .openapi({
      description: '地區代碼',
      example: 'taipei',
      examples: ['taipei', 'taichung', 'kaohsiung', 'tainan']
    }),
  roleList: z.array(z.string())
    .optional()
    .openapi({
      description: '角色清單',
      example: ['學生', '工程師'],
      examples: [['學生', '工程師'], ['設計師'], ['產品經理', '創業家']]
    }),
  selfIntroduction: z.string()
    .optional()
    .openapi({
      description: '自我介紹',
      example: '我是一名前端工程師，熱愛學習新技術'
    }),
  share: z.string().or(z.array(z.string()))
    .optional()
    .openapi({
      description: '分享內容',
      example: '我的學習筆記'
    }),
  wantToDoList: z.array(z.string())
    .optional()
    .openapi({
      description: '想做的事情清單',
      example: ['學習 React', '開發 APP'],
      examples: [['學習 React', '開發 APP'], ['學習設計', '參加比賽']]
    }),
  tagList: z.array(z.string())
    .optional()
    .openapi({
      description: '標籤清單',
      example: ['JavaScript', 'React', '前端'],
      examples: [['JavaScript', 'React', '前端'], ['設計', 'UI/UX', '產品']]
    }),
  interestList: interestListSchema,
  preferences: z.record(z.string(), z.array(z.string()))
    .optional()
    .openapi({
      description: '個人偏好設定',
      example: {
        'learningStyle': ['實作導向', '理論學習'],
        'contentType': ['影片', '文章']
      }
    }),
  isSendEmail: z.boolean()
    .optional()
    .openapi({
      description: '是否接收電子郵件',
      example: true
    }),

  // 新增欄位
  professionalField: professionalFieldSchema,
  personalSlogan: personalSloganSchema,
  referralSource: referralSourceSchema,
  customId: z.string()
    .min(3, 'Custom ID 至少 3 個字元')
    .max(50, 'Custom ID 不可超過 50 個字元')
    .regex(/^[a-zA-Z0-9](?:[a-zA-Z0-9_-]*[a-zA-Z0-9])?$/, 'Custom ID 只能包含英數字、底線和連字符,且不能以底線或連字符開頭/結尾')
    .optional()
    .openapi({
      description: '自訂 ID (可選)',
      example: 'my_custom_id',
      examples: ['my_custom_id', 'user123', 'john_doe']
    })
}).openapi('CreateUserRequest', {
  description: '創建用戶請求'
});

// 註冊 CreateUserRequest
registry.register('CreateUserRequest', createUserSchema);

// 更新用戶 schema
export const updateUserSchema = z.object({
  name: z.string()
    .min(1, '名稱不可為空')
    .max(100, '名稱長度不可超過 100 字')
    .optional()
    .openapi({
      description: '使用者姓名',
      example: '王小明',
      examples: ['王小明', '李大華', 'John Doe']
    }),
  photoURL: z.string()
    .url("無效的 URL 格式")
    .optional()
    .openapi({
      description: '個人大頭照 URL',
      example: 'https://example.com/avatar/john.jpg',
      format: 'uri'
    }),
  location: z.string()
    .optional()
    .openapi({
      description: '地區代碼',
      example: 'taipei_city',
      examples: ['taipei_city', 'taichung_city', 'kaohsiung_city', 'tainan_city']
    }),
  gender: z.enum(['male', 'female', 'other'], "無效的性別")
    .optional()
    .openapi({
      description: '性別',
      example: 'male',
      examples: ['male', 'female', 'other']
    }),
  birthDay: z.string().or(z.date())
    .optional()
    .openapi({
      description: '出生日期',
      example: '1995-06-15',
      examples: ['1995-06-15', '2000-12-25', '1988-03-08']
    }),
  contactList: contactListSchema,
  educationStage: z.enum(['university', 'high', 'other'], "無效的教育階段")
    .optional()
    .openapi({
      description: '教育階段',
      example: 'university',
      examples: ['university', 'high', 'other']
    }),
  isOpenLocation: z.boolean()
    .optional()
    .openapi({
      description: '是否公開位置資訊',
      example: true
    }),
  isOpenProfile: z.boolean()
    .optional()
    .openapi({
      description: '是否公開個人資料',
      example: true
    }),
  isSubscribeEmail: z.boolean()
    .optional()
    .openapi({
      description: '是否訂閱電子郵件',
      example: true
    }),
  selfIntroduction: z.string()
    .optional()
    .openapi({
      description: '自我介紹',
      example: '我是一名前端工程師，熱愛學習新技術'
    }),
  share: z.string().or(z.array(z.string()))
    .optional()
    .openapi({
      description: '分享內容',
      example: '我的學習筆記'
    }),
  wantToDoList: z.array(z.string())
    .optional()
    .openapi({
      description: '想做的事情清單',
      example: ['學習 React', '開發 APP'],
      examples: [['學習 React', '開發 APP'], ['學習設計', '參加比賽']]
    }),
  tagList: z.array(z.string())
    .optional()
    .openapi({
      description: '標籤清單',
      example: ['JavaScript', 'React', '前端'],
      examples: [['JavaScript', 'React', '前端'], ['設計', 'UI/UX', '產品']]
    }),
  roleList: z.array(z.string())
    .optional()
    .openapi({
      description: '角色清單',
      example: ['學生', '工程師'],
      examples: [['學生', '工程師'], ['設計師'], ['產品經理', '創業家']]
    }),
  interestList: interestListSchema,
  preferences: z.record(z.string(), z.array(z.string()))
    .optional()
    .openapi({
      description: '個人偏好設定',
      example: {
        'learningStyle': ['實作導向', '理論學習'],
        'contentType': ['影片', '文章']
      }
    }),

  // 新增欄位
  professionalField: professionalFieldSchema,
  personalSlogan: personalSloganSchema,
  referralSource: referralSourceSchema
}).openapi('UpdateUserRequest', {
  description: '更新用戶請求'
});

// 註冊 UpdateUserRequest
registry.register('UpdateUserRequest', updateUserSchema);

// 獲取用戶參數 schema
export const getUserParamsSchema = z.object({
  id: z.string()
    .uuid({ message: "無效的用戶 ID 格式" })
    .openapi({
      description: '用戶唯一識別碼 (UUID)',
      example: '123e4567-e89b-12d3-a456-426614174000',
      format: 'uuid'
    })
}).openapi({
  description: '獲取用戶的路徑參數'
});

// 獲取用戶查詢參數 schema
export const getUserQuerySchema = z.object({
  page: z.string()
    .regex(/^\d+$/, "頁數必須為正整數")
    .transform(Number)
    .optional()
    .openapi({
      description: '頁數',
      example: '1',
      examples: ['1', '2', '10']
    }),
  pageSize: z.string()
    .regex(/^\d+$/, "每頁數量必須為正整數")
    .transform(Number)
    .optional()
    .openapi({
      description: '每頁項目數',
      example: '10',
      examples: ['10', '20', '50']
    }),
  educationStage: z.string()
    .optional()
    .openapi({
      description: '過濾教育階段',
      example: 'university',
      examples: ['university', 'high', 'other']
    }),
  roleList: z.string()
    .optional()
    .openapi({
      description: '過濾角色清單（以逗號分隔）',
      example: '工程師,設計師'
    }),
  location: z.string()
    .optional()
    .openapi({
      description: '過濾位置',
      example: 'taipei',
      examples: ['taipei', 'taichung', 'kaohsiung']
    }),
  search: z.string()
    .optional()
    .openapi({
      description: '搜尋關鍵字',
      example: '小明',
      examples: ['小明', 'john', '工程師']
    })
}).openapi({
  description: '獲取用戶列表的查詢參數'
});

// 偏好設定 schema
export const userPreferencesSchema = z.object({
  preferences: z.record(z.string(), z.array(z.string()))
    .refine(
      (data) => Object.keys(data).length > 0,
      { message: "至少需要一個偏好設定" }
    )
    .openapi({
      description: '用戶個人偏好設定',
      example: {
        'learningStyle': ['實作導向', '理論學習', '小組討論'],
        'contentType': ['影片教學', '文章閱讀', '實際操作']
      }
    })
}).openapi({
  description: '用戶偏好設定的請求資料'
});

// 用戶回應資料 schema（對應 FormattedUserResponse type）
const formattedUserResponseSchema = z.object({
  id: z.string().openapi({
    description: '用戶 UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid'
  }),
  name: z.string().nullable().openapi({
    description: '用戶姓名',
    example: '王小明'
  }),
  email: z.string().nullable().openapi({
    description: '電子郵件地址',
    example: 'wang.xiaoming@example.com',
    format: 'email'
  }),
  photoURL: z.string().nullable().openapi({
    description: '個人大頭照 URL',
    example: 'https://example.com/avatar/wang.jpg',
    format: 'uri'
  }),
  gender: z.enum(['male', 'female', 'other']).nullable().openapi({
    description: '性別',
    example: 'male'
  }),
  birthDay: z.string().nullable().openapi({
    description: '出生日期',
    example: '1995-06-15'
  }),
  educationStage: z.enum(['university', 'high', 'other']).nullable().openapi({
    description: '教育階段',
    example: 'university'
  }),
  isOpenLocation: z.boolean().openapi({
    description: '是否公開位置資訊',
    example: true
  }),
  isOpenProfile: z.boolean().openapi({
    description: '是否公開個人資料',
    example: true
  }),
  isSubscribeEmail: z.boolean().openapi({
    description: '是否訂閱電子郵件',
    example: true
  }),
  location: z.string().nullable().openapi({
    description: '地區代碼',
    example: 'taipei'
  }),
  selfIntroduction: z.string().nullable().openapi({
    description: '自我介紹',
    example: '我是一名前端工程師，熱愛學習新技術'
  }),
  share: z.union([z.string(), z.array(z.string())]).nullable().openapi({
    description: '分享內容',
    example: '我的學習筆記'
  }),
  wantToDoList: z.array(z.string()).nullable().openapi({
    description: '想做的事情清單',
    example: ['學習 React', '開發個人網站']
  }),
  tagList: z.array(z.string()).nullable().openapi({
    description: '標籤清單',
    example: ['JavaScript', 'React', '前端開發']
  }),
  interestList: z.array(z.string()).nullable().openapi({
    description: '興趣清單',
    example: ['程式設計', '人工智慧']
  }),
  preferences: z.record(z.string(), z.array(
    z.object({
      name: z.string().openapi({ description: '選項名稱' }),
      value: z.string().openapi({ description: '選項值' })
    })
  )).nullable().openapi({
    description: '個人偏好設定',
    example: {
      'learningStyle': [
        { 'name': '實作導向', 'value': 'hands_on' },
        { 'name': '理論學習', 'value': 'theoretical' }
      ],
      'contentType': [
        { 'name': '影片教學', 'value': 'video' }
      ]
    }
  }),
  role: z.number().int().nullable().openapi({
    description: '角色 ID',
    example: 2
  }),
  roleList: z.array(z.string()).nullable().openapi({
    description: '角色清單',
    example: ['工程師', '學生'],
    examples: [['工程師', '學生'], ['設計師'], ['產品經理', '創業家']]
  }),
  basicInfo: z.object({
    selfIntroduction: z.string().nullable().openapi({
      description: '自我介紹',
      example: '我是一名前端工程師，熱愛學習新技術'
    }),
    shareList: z.union([z.string(), z.array(z.string())]).nullable().openapi({
      description: '分享內容',
      example: '我的學習筆記'
    }),
    wantToDoList: z.array(z.string()).nullable().openapi({
      description: '想做的事情清單',
      example: ['學習 React', '開發個人網站']
    })
  }).nullable().openapi({
    description: '基本資訊物件'
  }),
  contactList: z.object({
    email: z.string().nullable().openapi({
      description: '聯絡用電子郵件',
      example: 'contact@example.com',
      format: 'email'
    }),
    photoURL: z.string().nullable().openapi({
      description: '頭像 URL',
      format: 'uri'
    }),
    isSubscribeEmail: z.boolean().nullable().openapi({
      description: '是否訂閱電子郵件'
    }),
    instagram: z.string().nullable().openapi({
      description: 'Instagram 帳號'
    }),
    discord: z.string().nullable().openapi({
      description: 'Discord 帳號'
    }),
    line: z.string().nullable().openapi({
      description: 'LINE ID'
    }),
    facebook: z.string().nullable().openapi({
      description: 'Facebook 帳號'
    }),
    threads: z.string().nullable().openapi({
      description: 'Threads 帳號'
    }),
    linkedin: z.string().nullable().openapi({
      description: 'LinkedIn 個人檔案網址或用戶名'
    })
  }).nullable().openapi({
    description: '聯絡方式資訊'
  }),
  customId: z.string()
    .nullable()
    .openapi({
      description: '用戶自訂 ID',
      example: 'my_custom_id',
      examples: ['my_custom_id', 'user123', 'john_doe']
    }),
  customIdVerified: z.boolean()
    .nullable()
    .openapi({
      description: '自訂 ID 是否已驗證',
      example: true
    }),
  customIdCreatedAt: z.string()
    .nullable()
    .openapi({
      description: '自訂 ID 建立時間',
      example: '2024-01-15T10:30:00.000Z',
      format: 'date-time'
    }),

  // 新增欄位
  professionalField: z.array(z.enum(PROFESSIONAL_FIELDS))
    .nullable()
    .openapi({
      description: 'ESCO 專業領域分類 (陣列)',
      example: ['information_and_communication_technologies_icts']
    }),
  personalSlogan: z.string()
    .nullable()
    .openapi({
      description: '個人標語',
      example: '終身學習者,熱愛程式設計與教育'
    }),
  referralSource: z.union([z.enum(REFERRAL_SOURCES), z.string()])
    .nullable()
    .openapi({
      description: '資訊來源',
      example: 'instagram',
      examples: ['instagram', 'friend_referral']
    }),

  // 活躍狀態統計
  lastLoginAt: z.string()
    .nullable()
    .openapi({
      description: '最後登入時間',
      example: '2024-01-20T08:30:00.000Z',
      format: 'date-time'
    }),
  lastActiveAt: z.string()
    .nullable()
    .openapi({
      description: '最後活動時間（任何操作）',
      example: '2024-01-20T14:25:00.000Z',
      format: 'date-time'
    }),
  loginCount: z.number()
    .int()
    .openapi({
      description: '總登入次數',
      example: 42
    }),
  profileViews: z.number()
    .int()
    .openapi({
      description: '個人檔案被查看次數',
      example: 128
    }),

  // 最新測驗結果
  latestQuizResult: z.object({
    id: z.number().int().openapi({
      description: '測驗結果 ID',
      example: 1
    }),
    resultType: z.string().openapi({
      description: '測驗結果類型 (L/C/A/D/O)',
      example: 'A'
    }),
    scores: z.record(z.string(), z.number()).openapi({
      description: '五個維度的分數',
      example: { L: 10, C: 8, A: 12, D: 6, O: 9 }
    }),
    completedAt: z.string().openapi({
      description: '測驗完成時間',
      example: '2024-01-20T14:30:00.000Z',
      format: 'date-time'
    })
  }).nullable().openapi({
    description: '最新測驗結果（如果有的話）'
  }),

  createdDate: z.string().openapi({
    description: '建立時間',
    example: '2024-01-15T10:30:00.000Z',
    format: 'date-time'
  }),
  updatedDate: z.string().openapi({
    description: '最後更新時間',
    example: '2024-01-20T14:25:00.000Z',
    format: 'date-time'
  })
}).openapi('FormattedUserResponse', {
  description: '格式化的用戶資料'
});

// 註冊 FormattedUserResponse
registry.register('FormattedUserResponse', formattedUserResponseSchema);

// 單個用戶成功回應 schema
export const userSuccessResponseSchema = apiSuccessResponseSchema(formattedUserResponseSchema);

// 用戶列表分頁回應 schema
export const usersListResponseSchema = paginatedApiResponseSchema(formattedUserResponseSchema);

// 創建用戶成功回應 schema
export const createUserResponseSchema = apiSuccessResponseSchema(
  z.object({
    user: formattedUserResponseSchema,
    token: z.string().openapi({
      description: 'JWT 認證 token',
      example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    })
  })
);

// 更新用戶成功回應 schema
export const updateUserResponseSchema = apiSuccessResponseSchema(formattedUserResponseSchema);

// 刪除用戶成功回應 schema
export const deleteUserResponseSchema = apiSuccessResponseSchema(
  z.object({
    message: z.string().openapi({
      description: '成功訊息',
      example: '用戶已成功刪除'
    })
  })
);

// 偏好設定選項 schema
const preferenceOptionSchema = z.object({
  name: z.string().openapi({ description: '選項名稱' }),
  value: z.string().openapi({ description: '選項值' })
}).openapi({
  description: '偏好選項'
});

// 完整的偏好選項 schema（包含 ID）
const preferenceOptionWithIdSchema = z.object({
  id: z.number().openapi({
    description: '選項 ID',
    example: 101
  }),
  name: z.string().openapi({
    description: '選項名稱',
    example: '實作導向'
  }),
  value: z.string().openapi({
    description: '選項值',
    example: 'hands_on'
  }),
  description: z.string().nullable().openapi({
    description: '選項描述',
    example: '透過實際操作學習'
  })
}).openapi({
  description: '完整偏好選項'
});

// 偏好類型 schema（包含選項列表）
const preferenceTypeWithOptionsSchema = z.object({
  id: z.number().openapi({
    description: '偏好類型 ID',
    example: 1
  }),
  name: z.string().openapi({
    description: '偏好類型名稱',
    example: '學習風格'
  }),
  value: z.string().openapi({
    description: '偏好類型值',
    example: 'learningStyle'
  }),
  maxSelections: z.number().nullable().openapi({
    description: '最大選擇數量',
    example: 3
  }),
  description: z.string().nullable().openapi({
    description: '偏好類型描述',
    example: '選擇你偏好的學習方式'
  }),
  options: z.array(preferenceOptionWithIdSchema).openapi({
    description: '可用選項列表'
  })
}).openapi({
  description: '偏好類型'
});

// 用戶偏好設定回應 schema
export const userPreferencesResponseSchema = apiSuccessResponseSchema(
  z.record(z.string(), z.array(preferenceOptionSchema))
);

// 更新偏好設定回應 schema
export const updateUserPreferencesResponseSchema = apiSuccessResponseSchema(
  z.object({
    message: z.string().openapi({
      description: '成功訊息',
      example: '偏好設定已成功更新'
    }),
    preferences: z.record(z.string(), z.array(preferenceOptionSchema)).openapi({
      description: '更新後的偏好設定'
    })
  })
);

// 可用偏好選項回應 schema
export const availablePreferencesResponseSchema = apiSuccessResponseSchema(
  z.array(preferenceTypeWithOptionsSchema)
);

// 自訂 ID 相關回應 schema
// 使用 user-custom-id.validators.ts 中定義的更完整的 data schemas
export const customIdAvailabilityResponseSchema = apiSuccessResponseSchema(
  customIdAvailabilityDataSchema
).openapi('CustomIdAvailabilityResponse', {
  description: '自訂 ID 可用性檢查回應'
});

export const setCustomIdResponseSchema = apiSuccessResponseSchema(
  setCustomIdDataSchema
).openapi('SetCustomIdResponse', {
  description: '設置自訂 ID 成功回應'
});

export const removeCustomIdResponseSchema = apiSuccessResponseSchema(
  removeCustomIdDataSchema
).openapi('RemoveCustomIdResponse', {
  description: '移除自訂 ID 成功回應'
});

// 登入歷史記錄 schema
const loginHistoryRecordSchema = z.object({
  id: z.number().int().openapi({
    description: '登入記錄 ID',
    example: 1
  }),
  deviceType: z.string().nullable().openapi({
    description: '裝置類型',
    example: 'desktop',
    examples: ['desktop', 'mobile', 'tablet']
  }),
  os: z.string().nullable().openapi({
    description: '作業系統',
    example: 'macOS 14.0'
  }),
  browser: z.string().nullable().openapi({
    description: '瀏覽器',
    example: 'Chrome 120'
  }),
  userAgent: z.string().nullable().openapi({
    description: '完整 User-Agent 字串',
    example: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  }),
  ipAddress: z.string().nullable().openapi({
    description: 'IP 地址',
    example: '192.168.1.1'
  }),
  loginAt: z.string().nullable().openapi({
    description: '登入時間',
    example: '2024-01-20T08:30:00.000Z',
    format: 'date-time'
  })
}).openapi('LoginHistoryRecord', {
  description: '登入歷史記錄'
});

// 用戶活躍統計 schema
const userActivityStatsSchema = z.object({
  lastLoginAt: z.string().nullable().openapi({
    description: '最後登入時間',
    example: '2024-01-20T08:30:00.000Z',
    format: 'date-time'
  }),
  lastActiveAt: z.string().nullable().openapi({
    description: '最後活動時間',
    example: '2024-01-20T14:25:00.000Z',
    format: 'date-time'
  }),
  loginCount: z.number().int().openapi({
    description: '總登入次數',
    example: 42
  }),
  profileViews: z.number().int().openapi({
    description: '個人檔案被查看次數',
    example: 128
  }),
  recentLoginCount: z.number().int().openapi({
    description: '最近 30 天登入次數',
    example: 15
  })
}).openapi('UserActivityStats', {
  description: '用戶活躍統計'
});

// 登入歷史回應 schema
export const loginHistoryResponseSchema = apiSuccessResponseSchema(
  z.array(loginHistoryRecordSchema)
).openapi('LoginHistoryResponse', {
  description: '登入歷史回應'
});

// 用戶活躍統計回應 schema
export const userActivityStatsResponseSchema = apiSuccessResponseSchema(
  userActivityStatsSchema
).openapi('UserActivityStatsResponse', {
  description: '用戶活躍統計回應'
});

// 登入歷史查詢參數 schema
export const loginHistoryQuerySchema = z.object({
  limit: z.string()
    .regex(/^\d+$/, "數量必須為正整數")
    .transform(Number)
    .optional()
    .openapi({
      description: '限制返回數量',
      example: '10',
      examples: ['5', '10', '20']
    })
}).openapi({
  description: '登入歷史查詢參數'
});

// 導出型別
export type CreateUserDto = z.infer<typeof createUserSchema>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
export type GetUserParamsDto = z.infer<typeof getUserParamsSchema>;
export type GetUserQueryDto = z.infer<typeof getUserQuerySchema>;
export type UserPreferencesDto = z.infer<typeof userPreferencesSchema>;
export type LoginHistoryQueryDto = z.infer<typeof loginHistoryQuerySchema>;