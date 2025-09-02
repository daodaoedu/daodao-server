/**
 * 用戶驗證器
 * 使用 Zod 實現用戶相關驗證
 */

import { z } from 'zod';

// 聯絡資訊 schema
const contactListSchema = z.object({
  instagram: z.string()
    .optional()
    .describe("Instagram 帳號")
    .meta({
      title: "Instagram",
      examples: ["@john_doe", "@user123", "john.doe"]
    }),
  discord: z.string()
    .optional()
    .describe("Discord 帳號")
    .meta({
      title: "Discord",
      examples: ["JohnDoe#1234", "User123#5678", "alice.smith#9999"]
    }),
  line: z.string()
    .optional()
    .describe("LINE ID")
    .meta({
      title: "LINE ID",
      examples: ["john_doe_line", "user123line", "alice.smith"]
    }),
  facebook: z.string()
    .optional()
    .describe("Facebook 帳號")
    .meta({
      title: "Facebook",
      examples: ["john.doe.fb", "user123facebook", "alice.smith.tw"]
    })
}).optional().describe("聯絡方式資訊").meta({
  title: "聯絡資訊",
  examples: [{
    instagram: "@john_doe",
    discord: "JohnDoe#1234",
    line: "john_doe_line",
    facebook: "john.doe.fb"
  }]
});

// 創建用戶 schema
export const createUserSchema = z.object({
  gender: z.enum(['male', 'female', 'other'], "無效的性別")
    .optional()
    .describe("性別")
    .meta({
      title: "性別",
      examples: ['male', 'female', 'other'],
      enumDescriptions: {
        "male": "男性",
        "female": "女性",
        "other": "其他"
      }
    }),
  birthDate: z.string().or(z.date())
    .optional()
    .describe("出生日期")
    .meta({
      title: "出生日期",
      examples: ["1995-06-15", "2000-12-25", "1988-03-08"]
    }),
  contactList: contactListSchema,
  educationStage: z.enum(['university', 'high', 'other'], "無效的教育階段")
    .optional()
    .describe("教育階段")
    .meta({
      title: "教育階段",
      examples: ['university', 'high', 'other'],
      enumDescriptions: {
        "university": "大學",
        "high": "高中",
        "other": "其他"
      }
    }),
  isOpenLocation: z.boolean()
    .optional()
    .describe("是否公開位置資訊")
    .meta({
      title: "公開位置",
      examples: [true, false]
    }),
  isOpenProfile: z.boolean()
    .optional()
    .describe("是否公開個人資料")
    .meta({
      title: "公開個人資料",
      examples: [true, false]
    }),
  isSubscribeEmail: z.boolean()
    .optional()
    .describe("是否訂閱電子郵件")
    .meta({
      title: "訂閱電子郵件",
      examples: [true, false]
    }),
  location: z.string()
    .optional()
    .describe("地區代碼")
    .meta({
      title: "地區",
      examples: ["taipei", "taichung", "kaohsiung", "tainan"]
    }),
  roleList: z.array(z.string())
    .optional()
    .describe("角色清單")
    .meta({
      title: "角色清單",
      examples: [["學生", "工程師"], ["設計師"], ["產品經理", "創業家"]]
    }),
  selfIntroduction: z.string()
    .optional()
    .describe("自我介紹")
    .meta({
      title: "自我介紹",
      examples: ["我是一名前端工程師，熱愛學習新技術", "對產品設計有濃厚興趣，希望能與大家交流"]
    }),
  share: z.string().or(z.array(z.string()))
    .optional()
    .describe("分享內容")
    .meta({
      title: "分享內容",
      examples: ["我的學習筆記", ["開發心得", "技術文章"]]
    }),
  wantToDoList: z.array(z.string())
    .optional()
    .describe("想做的事情清單")
    .meta({
      title: "想做清單",
      examples: [["學習 React", "開發 APP"], ["學習設計", "參加比賽"]]
    }),
  tagList: z.array(z.string())
    .optional()
    .describe("標籤清單")
    .meta({
      title: "標籤",
      examples: [["JavaScript", "React", "前端"], ["設計", "UI/UX", "產品"]]
    }),
  interestList: z.array(z.string())
    .optional()
    .describe("興趣清單")
    .meta({
      title: "興趣領域",
      examples: [["程式設計", "人工智慧"], ["產品設計", "用戶體驗"]]
    }),
  preferences: z.record(z.string(), z.array(z.string()))
    .optional()
    .describe("個人偏好設定")
    .meta({
      title: "個人偏好",
      examples: [{
        "learningStyle": ["實作導向", "理論學習"],
        "contentType": ["影片", "文章"]
      }]
    }),
  isSendEmail: z.boolean()
    .optional()
    .describe("是否接收電子郵件")
    .meta({
      title: "接收郵件",
      examples: [true, false]
    })
}).describe("創建用戶的請求資料").meta({
  title: "創建用戶",
  examples: [{
    gender: "male",
    birthDate: "1995-06-15",
    educationStage: "university",
    isOpenLocation: true,
    isOpenProfile: true,
    isSubscribeEmail: true,
    location: "taipei",
    roleList: ["工程師", "學生"],
    selfIntroduction: "我是一名前端工程師，對新技術充滿熱忠",
    wantToDoList: ["學習 React", "開發個人網站"],
    tagList: ["JavaScript", "React", "前端開發"],
    interestList: ["程式設計", "人工智慧"]
  }]
});

// 更新用戶 schema
export const updateUserSchema = z.object({
  name: z.string()
    .optional()
    .describe("使用者姓名")
    .meta({
      title: "姓名",
      examples: ["王小明", "李大華", "John Doe"]
    }),
  email: z.string()
    .email("無效的電子郵件格式")
    .optional()
    .describe("電子郵件地址")
    .meta({
      title: "電子郵件",
      examples: ["john@example.com", "alice.smith@company.com", "user123@gmail.com"]
    }),
  photoUrl: z.string()
    .url("無效的 URL 格式")
    .optional()
    .describe("個人大頭照 URL")
    .meta({
      title: "個人大頭照",
      examples: ["https://example.com/avatar/john.jpg", "https://example.com/photos/user123.png"]
    }),
  gender: z.enum(['male', 'female', 'other'], "無效的性別")
    .optional()
    .describe("性別")
    .meta({
      title: "性別",
      examples: ['male', 'female', 'other'],
      enumDescriptions: {
        "male": "男性",
        "female": "女性",
        "other": "其他"
      }
    }),
  birthDate: z.string().or(z.date())
    .optional()
    .describe("出生日期")
    .meta({
      title: "出生日期",
      examples: ["1995-06-15", "2000-12-25", "1988-03-08"]
    }),
  contactList: contactListSchema,
  educationStage: z.enum(['university', 'high', 'other'], "無效的教育階段")
    .optional()
    .describe("教育階段")
    .meta({
      title: "教育階段",
      examples: ['university', 'high', 'other'],
      enumDescriptions: {
        "university": "大學",
        "high": "高中",
        "other": "其他"
      }
    }),
  isOpenLocation: z.boolean()
    .optional()
    .describe("是否公開位置資訊")
    .meta({
      title: "公開位置",
      examples: [true, false]
    }),
  isOpenProfile: z.boolean()
    .optional()
    .describe("是否公開個人資料")
    .meta({
      title: "公開個人資料",
      examples: [true, false]
    }),
  isSubscribeEmail: z.boolean()
    .optional()
    .describe("是否訂閱電子郵件")
    .meta({
      title: "訂閱電子郵件",
      examples: [true, false]
    }),
  selfIntroduction: z.string()
    .optional()
    .describe("自我介紹")
    .meta({
      title: "自我介紹",
      examples: ["我是一名前端工程師，熱愛學習新技術", "對產品設計有濃厚興趣，希望能與大家交流"]
    }),
  share: z.string().or(z.array(z.string()))
    .optional()
    .describe("分享內容")
    .meta({
      title: "分享內容",
      examples: ["我的學習筆記", ["開發心得", "技術文章"]]
    }),
  wantToDoList: z.array(z.string())
    .optional()
    .describe("想做的事情清單")
    .meta({
      title: "想做清單",
      examples: [["學習 React", "開發 APP"], ["學習設計", "參加比賽"]]
    }),
  tagList: z.array(z.string())
    .optional()
    .describe("標籤清單")
    .meta({
      title: "標籤",
      examples: [["JavaScript", "React", "前端"], ["設計", "UI/UX", "產品"]]
    }),
  roleList: z.array(z.string())
    .optional()
    .describe("角色清單")
    .meta({
      title: "角色清單",
      examples: [["學生", "工程師"], ["設計師"], ["產品經理", "創業家"]]
    }),
  interestList: z.array(z.string())
    .optional()
    .describe("興趣清單")
    .meta({
      title: "興趣領域",
      examples: [["程式設計", "人工智慧"], ["產品設計", "用戶體驗"]]
    }),
  preferences: z.record(z.string(), z.array(z.string()))
    .optional()
    .describe("個人偏好設定")
    .meta({
      title: "個人偏好",
      examples: [{
        "learningStyle": ["實作導向", "理論學習"],
        "contentType": ["影片", "文章"]
      }]
    })
}).describe("更新用戶的請求資料").meta({
  title: "更新用戶資料",
  examples: [{
    name: "王小明",
    email: "wang.xiaoming@example.com",
    photoUrl: "https://example.com/avatar/wang.jpg",
    selfIntroduction: "更新後的自我介紹，我是一名全端工程師",
    tagList: ["JavaScript", "Python", "全窯開發"]
  }]
});

// 獲取用戶參數 schema
export const getUserParamsSchema = z.object({
  id: z.string()
    .uuid({ message: "無效的用戶 ID 格式" })
    .describe("用戶唯一識別碼 (UUID)")
    .meta({
      title: "用戶 ID",
      examples: ["123e4567-e89b-12d3-a456-426614174000", "550e8400-e29b-41d4-a716-446655440000"]
    })
}).describe("獲取用戶的路徑參數").meta({
  title: "獲取用戶參數",
  examples: [{
    id: "123e4567-e89b-12d3-a456-426614174000"
  }]
});

// 獲取用戶查詢參數 schema
export const getUserQuerySchema = z.object({
  page: z.string()
    .regex(/^\d+$/, "頁數必須為正整數")
    .transform(Number)
    .optional()
    .describe("頁數")
    .meta({
      title: "頁數",
      examples: ["1", "2", "10"]
    }),
  pageSize: z.string()
    .regex(/^\d+$/, "每頁數量必須為正整數")
    .transform(Number)
    .optional()
    .describe("每頁項目數")
    .meta({
      title: "每頁數量",
      examples: ["10", "20", "50"]
    }),
  educationStage: z.string()
    .optional()
    .describe("過濾教育階段")
    .meta({
      title: "教育階段過濾",
      examples: ["university", "high", "other"]
    }),
  roleList: z.string()
    .optional()
    .describe("過濾角色清單（以逗號分隔）")
    .meta({
      title: "角色過濾",
      examples: ["工程師,設計師", "學生", "產品經理"]
    }),
  location: z.string()
    .optional()
    .describe("過濾位置")
    .meta({
      title: "地區過濾",
      examples: ["taipei", "taichung", "kaohsiung"]
    }),
  search: z.string()
    .optional()
    .describe("搜尋關鍵字")
    .meta({
      title: "搜尋關鍵字",
      examples: ["小明", "john", "工程師"]
    })
}).describe("獲取用戶列表的查詢參數").meta({
  title: "用戶列表查詢參數",
  examples: [{
    page: "1",
    pageSize: "20",
    educationStage: "university",
    location: "taipei",
    search: "工程師"
  }]
});

// 偏好設定 schema
export const userPreferencesSchema = z.object({
  preferences: z.record(z.string(), z.array(z.string()))
    .refine(
      (data) => Object.keys(data).length > 0, 
      { message: "至少需要一個偏好設定" }
    )
    .describe("用戶個人偏好設定")
    .meta({
      title: "個人偏好",
      examples: [{
        "learningStyle": ["實作導向", "理論學習", "小組討論"],
        "contentType": ["影片教學", "文章閱讀", "實際操作"],
        "difficulty": ["初學者友善", "按部就班"],
        "schedule": ["彈性時間", "自主安排"]
      }]
    })
}).describe("用戶偏好設定的請求資料").meta({
  title: "用戶偏好設定",
  examples: [{
    preferences: {
      "learningStyle": ["實作導向", "小組學習"],
      "contentType": ["影片教學", "文章閱讀"],
      "timeManagement": ["彈性時間", "短時間高效"]
    }
  }]
});

// 導出型別
export type CreateUserDto = z.infer<typeof createUserSchema>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
export type GetUserParamsDto = z.infer<typeof getUserParamsSchema>;
export type GetUserQueryDto = z.infer<typeof getUserQuerySchema>;
export type UserPreferencesDto = z.infer<typeof userPreferencesSchema>;