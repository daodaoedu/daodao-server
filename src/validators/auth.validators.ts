/**
 * 認證相關驗證器
 * 使用 Zod 進行輸入驗證
 */

import { z } from 'zod';
import { apiSuccessResponseSchema } from './api-response.validators';

/**
 * 登入請求驗證器
 */
export const loginValidator = z.object({
  email: z
    .string('電子郵件為必填欄位')
    .email('請輸入有效的電子郵件格式')
    .max(254, '電子郵件長度不能超過 254 個字符')
    .trim()
    .toLowerCase()
    .describe('登入用的電子郵件地址')
    .meta({
      title: '電子郵件',
      examples: ['user@example.com', 'john.doe@company.com', 'student@university.edu']
    }),
  password: z
    .string('密碼為必填欄位')
    .min(1, '密碼不能為空')
    .describe('登入密碼')
    .meta({
      title: '密碼',
      examples: ['MyPassword123', 'SecurePass456']
    }),
  rememberMe: z
    .boolean()
    .optional()
    .default(false)
    .describe('是否記住我')
    .meta({
      title: '記住我',
      examples: [true, false]
    })
}).describe('用戶登入請求資料').meta({
  title: '用戶登入',
  examples: [{
    email: 'user@example.com',
    password: 'MySecurePassword123',
    rememberMe: false
  }]
});

/**
 * 註冊請求驗證器
 */
export const registerValidator = z.object({
  username: z
    .string('用戶名為必填欄位')
    .min(3, '用戶名至少需要 3 個字符')
    .max(50, '用戶名不能超過 50 個字符')
    .regex(/^[a-zA-Z0-9_-]+$/, '用戶名只能包含字母、數字、底線和連字符')
    .trim()
    .describe('用戶名（唯一識別符）')
    .meta({
      title: '用戶名',
      examples: ['john_doe', 'alice123', 'user-name', 'developer2024']
    }),
  email: z
    .string('電子郵件為必填欄位')
    .email('請輸入有效的電子郵件格式')
    .max(254, '電子郵件長度不能超過 254 個字符')
    .trim()
    .toLowerCase()
    .describe('電子郵件地址')
    .meta({
      title: '電子郵件',
      examples: ['newuser@example.com', 'signup@company.com', 'register@university.edu']
    }),
  password: z
    .string('密碼為必填欄位')
    .min(8, '密碼至少需要 8 個字符')
    .max(128, '密碼不能超過 128 個字符')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, '密碼必須包含至少一個小寫字母、一個大寫字母和一個數字')
    .describe('註冊密碼（至少 8 位，包含大小寫字母和數字）')
    .meta({
      title: '密碼',
      examples: ['MyNewPassword123', 'SecurePass456', 'StrongPwd789']
    }),
  confirmPassword: z
    .string('確認密碼為必填欄位')
    .describe('確認密碼（必須與密碼相同）')
    .meta({
      title: '確認密碼',
      examples: ['MyNewPassword123', 'SecurePass456', 'StrongPwd789']
    }),
  name: z
    .string()
    .max(100, '顯示名稱不能超過 100 個字符')
    .trim()
    .optional()
    .describe('顯示名稱（可選）')
    .meta({
      title: '顯示名稱',
      examples: ['王小明', 'John Doe', 'Alice Chen', '李大華']
    })
}).describe('用戶註冊請求資料').meta({
  title: '用戶註冊',
  examples: [{
    username: 'john_doe',
    email: 'john@example.com',
    password: 'MySecurePassword123',
    confirmPassword: 'MySecurePassword123',
    name: 'John Doe'
  }]
}).refine((data) => data.password === data.confirmPassword, {
  message: '密碼確認不符',
  path: ['confirmPassword']
});

/**
 * 忘記密碼請求驗證器
 */
export const forgotPasswordValidator = z.object({
  email: z
    .string('電子郵件為必填欄位')
    .email('請輸入有效的電子郵件格式')
    .max(254, '電子郵件長度不能超過 254 個字符')
    .trim()
    .toLowerCase()
    .describe('忘記密碼的電子郵件地址')
    .meta({
      title: '電子郵件',
      examples: ['forgot@example.com', 'reset.password@company.com', 'user123@gmail.com']
    })
}).describe('忘記密碼請求資料').meta({
  title: '忘記密碼',
  examples: [{
    email: 'user@example.com'
  }]
});

/**
 * 重設密碼請求驗證器
 */
export const resetPasswordValidator = z.object({
  token: z
    .string('重設令牌為必填欄位')
    .min(1, '重設令牌不能為空')
    .describe('密碼重設令牌')
    .meta({
      title: '重設令牌',
      examples: ['eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', 'reset_token_123456789']
    }),
  newPassword: z
    .string('新密碼為必填欄位')
    .min(8, '密碼至少需要 8 個字符')
    .max(128, '密碼不能超過 128 個字符')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, '密碼必須包含至少一個小寫字母、一個大寫字母和一個數字')
    .describe('新的密碼（至少 8 位，包含大小寫字母和數字）')
    .meta({
      title: '新密碼',
      examples: ['NewSecurePassword123', 'MyStrongPwd456', 'ResetPass789']
    }),
  confirmPassword: z
    .string('確認密碼為必填欄位')
    .describe('確認新密碼（必須與新密碼相同）')
    .meta({
      title: '確認密碼',
      examples: ['NewSecurePassword123', 'MyStrongPwd456', 'ResetPass789']
    })
}).describe('重設密碼請求資料').meta({
  title: '重設密碼',
  examples: [{
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    newPassword: 'NewSecurePassword123',
    confirmPassword: 'NewSecurePassword123'
  }]
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: '密碼確認不符',
  path: ['confirmPassword']
});

/**
 * 郵件驗證請求驗證器
 */
export const verifyEmailValidator = z.object({
  token: z
    .string('驗證令牌為必填欄位')
    .min(1, '驗證令牌不能為空')
    .describe('電子郵件驗證令牌')
    .meta({
      title: '驗證令牌',
      examples: ['verify_token_123456789', 'email_verification_abc']
    }),
  email: z
    .string('電子郵件為必填欄位')
    .email('請輸入有效的電子郵件格式')
    .max(254, '電子郵件長度不能超過 254 個字符')
    .trim()
    .toLowerCase()
    .describe('要驗證的電子郵件地址')
    .meta({
      title: '電子郵件',
      examples: ['verify@example.com', 'user@company.com', 'newuser@gmail.com']
    })
}).describe('電子郵件驗證請求資料').meta({
  title: '電子郵件驗證',
  examples: [{
    token: 'verify_token_123456789',
    email: 'user@example.com'
  }]
});

/**
 * 更改密碼請求驗證器
 */
export const changePasswordValidator = z.object({
  currentPassword: z
    .string('當前密碼為必填欄位')
    .min(1, '當前密碼不能為空')
    .describe('當前的密碼')
    .meta({
      title: '當前密碼',
      examples: ['CurrentPassword123', 'OldPassword456']
    }),
  newPassword: z
    .string('新密碼為必填欄位')
    .min(8, '密碼至少需要 8 個字符')
    .max(128, '密碼不能超過 128 個字符')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, '密碼必須包含至少一個小寫字母、一個大寫字母和一個數字')
    .describe('新的密碼（必須與當前密碼不同）')
    .meta({
      title: '新密碼',
      examples: ['NewPassword123', 'UpdatedPwd456', 'ChangedPass789']
    }),
  confirmPassword: z
    .string('確認密碼為必填欄位')
    .describe('確認新密碼（必須與新密碼相同）')
    .meta({
      title: '確認密碼',
      examples: ['NewPassword123', 'UpdatedPwd456', 'ChangedPass789']
    })
}).describe('更改密碼請求資料').meta({
  title: '更改密碼',
  examples: [{
    currentPassword: 'CurrentPassword123',
    newPassword: 'NewPassword456',
    confirmPassword: 'NewPassword456'
  }]
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: '密碼確認不符',
  path: ['confirmPassword']
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: '新密碼必須與當前密碼不同',
  path: ['newPassword']
});

/**
 * 更新個人資料請求驗證器
 */
export const updateProfileValidator = z.object({
  name: z
    .string()
    .max(100, '顯示名稱不能超過 100 個字符')
    .trim()
    .optional()
    .describe('顯示名稱')
    .meta({
      title: '顯示名稱',
      examples: ['李小明', 'John Smith', 'Alice Chen', '王大華']
    }),
  username: z
    .string()
    .min(3, '用戶名至少需要 3 個字符')
    .max(50, '用戶名不能超過 50 個字符')
    .regex(/^[a-zA-Z0-9_-]+$/, '用戶名只能包含字母、數字、底線和連字符')
    .trim()
    .optional()
    .describe('用戶名')
    .meta({
      title: '用戶名',
      examples: ['new_username', 'updated-name', 'user2024']
    }),
  photoUrl: z
    .string()
    .url('請輸入有效的 URL 格式')
    .max(2048, 'URL 長度不能超過 2048 個字符')
    .optional()
    .nullable()
    .describe('個人大頭照 URL')
    .meta({
      title: '個人大頭照',
      examples: ['https://example.com/avatar/user.jpg', 'https://cdn.example.com/photos/profile.png']
    }),
  bio: z
    .string()
    .max(500, '個人簡介不能超過 500 個字符')
    .trim()
    .optional()
    .nullable()
    .describe('個人簡介')
    .meta({
      title: '個人簡介',
      examples: ['我是一名全端開發工程師，熱愛學習新技術', 'Passionate about creating great user experiences', '專業 UI/UX 設計師，專長於使用者研究']
    })
}).describe('更新個人資料請求資料').meta({
  title: '更新個人資料',
  examples: [{
    name: '李小明',
    username: 'xiaoming_li',
    photoUrl: 'https://example.com/avatar/xiaoming.jpg',
    bio: '我是一名全端開發工程師，專長於 React 和 Node.js'
  }]
});

/**
 * JWT Token 驗證器
 */
export const tokenValidator = z.object({
  token: z
    .string('Token 為必填欄位')
    .min(1, 'Token 不能為空')
    .regex(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/, '無效的 JWT Token 格式')
    .describe('JWT 認證令牌')
    .meta({
      title: 'JWT Token',
      examples: ['eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c']
    })
}).describe('JWT 令牌驗證請求資料').meta({
  title: 'JWT 令牌驗證',
  examples: [{
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
  }]
});

/**
 * 註銷所有設備請求驗證器
 */
export const revokeAllSessionsValidator = z.object({
  password: z
    .string('密碼為必填欄位')
    .min(1, '密碼不能為空')
    .describe('當前密碼用於確認身份')
    .meta({
      title: '密碼確認',
      examples: ['MyCurrentPassword123', 'SecurePassword456']
    })
}).describe('註銷所有設備登入請求資料').meta({
  title: '註銷所有設備',
  examples: [{
    password: 'MyCurrentPassword123'
  }]
});

/**
 * OAuth 狀態驗證器
 */
export const oauthStateValidator = z.object({
  state: z
    .string()
    .min(1, '狀態參數不能為空')
    .optional()
    .describe('OAuth 狀態參數')
    .meta({
      title: 'OAuth 狀態',
      examples: ['random_state_123456', 'oauth_state_abc']
    }),
  code: z
    .string()
    .min(1, '授權碼不能為空')
    .optional()
    .describe('OAuth 授權碼')
    .meta({
      title: '授權碼',
      examples: ['auth_code_123456789', 'oauth_authorization_code']
    }),
  error: z
    .string()
    .optional()
    .describe('OAuth 錯誤代碼')
    .meta({
      title: '錯誤代碼',
      examples: ['access_denied', 'invalid_request', 'server_error']
    }),
  error_description: z
    .string()
    .optional()
    .describe('OAuth 錯誤詳細描述')
    .meta({
      title: '錯誤描述',
      examples: ['User denied the request', 'Invalid client credentials', 'Internal server error']
    })
}).describe('OAuth 認證回調參數').meta({
  title: 'OAuth 認證回調',
  examples: [{
    state: 'random_state_123456',
    code: 'auth_code_123456789'
  }, {
    state: 'oauth_state_abc',
    error: 'access_denied',
    error_description: 'User denied the request'
  }]
});

// 導出所有驗證器的型別
export type LoginRequest = z.infer<typeof loginValidator>;
export type RegisterRequest = z.infer<typeof registerValidator>;
export type ForgotPasswordRequest = z.infer<typeof forgotPasswordValidator>;
export type ResetPasswordRequest = z.infer<typeof resetPasswordValidator>;
export type VerifyEmailRequest = z.infer<typeof verifyEmailValidator>;
export type ChangePasswordRequest = z.infer<typeof changePasswordValidator>;
export type UpdateProfileRequest = z.infer<typeof updateProfileValidator>;
export type TokenRequest = z.infer<typeof tokenValidator>;
export type RevokeAllSessionsRequest = z.infer<typeof revokeAllSessionsValidator>;
export type OAuthStateRequest = z.infer<typeof oauthStateValidator>;

// 認證相關的回應 schemas

// 用戶資料 schema（簡化版，對應認證時返回的用戶資訊）
const authUserSchema = z.object({
  id: z.number().int().describe("用戶數字 ID"),
  _id: z.string().describe("用戶 UUID"),
  name: z.string().describe("用戶姓名"),
  email: z.string().email().describe("電子郵件地址"),
  photoUrl: z.string().url().nullable().describe("個人大頭照 URL"),
  roleId: z.number().int().nullable().describe("角色 ID")
}).describe("認證用戶資料").meta({
  title: "認證用戶資訊",
  examples: [{
    id: 123,
    _id: "123e4567-e89b-12d3-a456-426614174000",
    name: "王小明",
    email: "wang.xiaoming@example.com",
    photoUrl: "https://example.com/avatar/wang.jpg",
    roleId: 1
  }]
});

// 登入成功回應 schema
export const loginSuccessResponseSchema = apiSuccessResponseSchema(
  z.object({
    user: authUserSchema,
    token: z.string().describe("JWT 認證 token"),
    refreshToken: z.string().optional().describe("刷新 token")
  })
).describe("登入成功回應").meta({
  title: "登入成功回應",
  examples: [{
    success: true,
    data: {
      user: {
        id: 123,
        _id: "123e4567-e89b-12d3-a456-426614174000",
        name: "王小明",
        email: "wang.xiaoming@example.com",
        photoUrl: "https://example.com/avatar/wang.jpg",
        roleId: 1
      },
      token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    },
    timestamp: "2024-01-15T10:30:00.000Z"
  }]
});

// 登出回應 schema
export const logoutResponseSchema = apiSuccessResponseSchema(
  z.object({
    message: z.string().describe("登出結果訊息")
  })
).describe("登出回應").meta({
  title: "登出回應",
  examples: [{
    success: true,
    data: {
      message: "已成功登出"
    },
    timestamp: "2024-01-15T10:30:00.000Z"
  }]
});

// 刷新 token 回應 schema
export const refreshTokenResponseSchema = apiSuccessResponseSchema(
  z.object({
    token: z.string().describe("新的 JWT 認證 token"),
    refreshToken: z.string().optional().describe("新的刷新 token")
  })
).describe("刷新 token 回應").meta({
  title: "刷新 Token 回應",
  examples: [{
    success: true,
    data: {
      token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    },
    timestamp: "2024-01-15T10:30:00.000Z"
  }]
});

// 統一導出
export const authValidators = {
  loginValidator,
  registerValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  verifyEmailValidator,
  changePasswordValidator,
  updateProfileValidator,
  tokenValidator,
  revokeAllSessionsValidator,
  oauthStateValidator
};

export default authValidators;