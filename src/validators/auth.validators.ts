/**
 * 認證相關驗證器
 * 使用 Zod 進行輸入驗證
 *
 * 🔄 遷移指南：
 * 1. 將 .meta() 改為 .openapi()
 * 2. 使用 effectType 處理 .transform() 和 .refine()
 * 3. 使用 registry.register() 註冊 schemas
 */

import { z } from 'zod';
import { registry } from '../config/openapi-registry';
import { apiSuccessResponseSchema } from './api-response.validators';

/**
 * 登入請求驗證器
 */
export const loginValidator = z.object({
  email: z
    .string()
    .min(1, '電子郵件為必填欄位')
    .email('請輸入有效的電子郵件格式')
    .max(254, '電子郵件長度不能超過 254 個字符')
    .trim()
    .toLowerCase()
    .openapi({
      description: '登入用的電子郵件地址',
      example: 'user@example.com',
      examples: ['user@example.com', 'john.doe@company.com', 'student@university.edu'],
      format: 'email'
    }),
  password: z
    .string()
    .min(1, '密碼為必填欄位')
    .min(1, '密碼不能為空')
    .openapi({
      description: '登入密碼',
      example: 'MyPassword123',
      examples: ['MyPassword123', 'SecurePass456']
    }),
  rememberMe: z
    .boolean()
    .optional()
    .default(false)
    .openapi({
      description: '是否記住我',
      example: false,
      examples: [true, false]
    })
}).openapi('LoginRequest', {
  description: '用戶登入請求資料',
  example: {
    email: 'user@example.com',
    password: 'MySecurePassword123',
    rememberMe: false
  }
});

/**
 * 註冊請求驗證器
 */
export const registerValidator = z.object({
  username: z
    .string()
    .min(1, '用戶名為必填欄位')
    .min(3, '用戶名至少需要 3 個字符')
    .max(50, '用戶名不能超過 50 個字符')
    .regex(/^[a-zA-Z0-9_-]+$/, '用戶名只能包含字母、數字、底線和連字符')
    .trim()
    .openapi({
      description: '用戶名（唯一識別符）',
      example: 'john_doe',
      examples: ['john_doe', 'alice123', 'user-name', 'developer2024'],
      minLength: 3,
      maxLength: 50,
      pattern: '^[a-zA-Z0-9_-]+$'
    }),
  email: z
    .string()
    .min(1, '電子郵件為必填欄位')
    .email('請輸入有效的電子郵件格式')
    .max(254, '電子郵件長度不能超過 254 個字符')
    .trim()
    .toLowerCase()
    .openapi({
      description: '電子郵件地址',
      example: 'newuser@example.com',
      examples: ['newuser@example.com', 'signup@company.com', 'register@university.edu'],
      format: 'email',
      maxLength: 254
    }),
  password: z
    .string()
    .min(1, '密碼為必填欄位')
    .min(8, '密碼至少需要 8 個字符')
    .max(128, '密碼不能超過 128 個字符')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, '密碼必須包含至少一個小寫字母、一個大寫字母和一個數字')
    .openapi({
      description: '註冊密碼（至少 8 位，包含大小寫字母和數字）',
      example: 'MyNewPassword123',
      examples: ['MyNewPassword123', 'SecurePass456', 'StrongPwd789'],
      minLength: 8,
      maxLength: 128
    }),
  confirmPassword: z
    .string()
    .min(1, '確認密碼為必填欄位')
    .openapi({
      description: '確認密碼（必須與密碼相同）',
      example: 'MyNewPassword123',
      examples: ['MyNewPassword123', 'SecurePass456', 'StrongPwd789']
    }),
  name: z
    .string()
    .max(100, '顯示名稱不能超過 100 個字符')
    .trim()
    .optional()
    .openapi({
      description: '顯示名稱（可選）',
      example: '王小明',
      examples: ['王小明', 'John Doe', 'Alice Chen', '李大華'],
      maxLength: 100
    })
})
  .refine((data) => data.password === data.confirmPassword, {
    message: '密碼確認不符',
    path: ['confirmPassword']
  })
  .openapi('RegisterRequest', {
    description: '用戶註冊請求資料',
    example: {
      username: 'john_doe',
      email: 'john@example.com',
      password: 'MySecurePassword123',
      confirmPassword: 'MySecurePassword123',
      name: 'John Doe'
    }
  });

/**
 * 忘記密碼請求驗證器
 */
export const forgotPasswordValidator = z.object({
  email: z
    .string()
    .min(1, '電子郵件為必填欄位')
    .email('請輸入有效的電子郵件格式')
    .max(254, '電子郵件長度不能超過 254 個字符')
    .trim()
    .toLowerCase()
    .openapi({
      description: '忘記密碼的電子郵件地址',
      example: 'forgot@example.com',
      examples: ['forgot@example.com', 'reset.password@company.com', 'user123@gmail.com'],
      format: 'email',
      maxLength: 254
    })
}).openapi('ForgotPasswordRequest', {
  description: '忘記密碼請求資料',
  example: {
    email: 'user@example.com'
  }
});

/**
 * 重設密碼請求驗證器
 */
export const resetPasswordValidator = z.object({
  token: z
    .string()
    .min(1, '重設令牌為必填欄位')
    .min(1, '重設令牌不能為空')
    .openapi({
      description: '密碼重設令牌',
      example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      examples: ['eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', 'reset_token_123456789']
    }),
  newPassword: z
    .string()
    .min(1, '新密碼為必填欄位')
    .min(8, '密碼至少需要 8 個字符')
    .max(128, '密碼不能超過 128 個字符')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, '密碼必須包含至少一個小寫字母、一個大寫字母和一個數字')
    .openapi({
      description: '新的密碼（至少 8 位，包含大小寫字母和數字）',
      example: 'NewSecurePassword123',
      examples: ['NewSecurePassword123', 'MyStrongPwd456', 'ResetPass789'],
      minLength: 8,
      maxLength: 128
    }),
  confirmPassword: z
    .string()
    .min(1, '確認密碼為必填欄位')
    .openapi({
      description: '確認新密碼（必須與新密碼相同）',
      example: 'NewSecurePassword123',
      examples: ['NewSecurePassword123', 'MyStrongPwd456', 'ResetPass789']
    })
})
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: '密碼確認不符',
    path: ['confirmPassword']
  })
  .openapi('ResetPasswordRequest', {
    description: '重設密碼請求資料',
    example: {
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      newPassword: 'NewSecurePassword123',
      confirmPassword: 'NewSecurePassword123'
    }
  });

/**
 * 郵件驗證請求驗證器
 */
export const verifyEmailValidator = z.object({
  token: z
    .string()
    .min(1, '驗證令牌為必填欄位')
    .min(1, '驗證令牌不能為空')
    .openapi({
      description: '電子郵件驗證令牌',
      example: 'verify_token_123456789',
      examples: ['verify_token_123456789', 'email_verification_abc']
    }),
  email: z
    .string()
    .min(1, '電子郵件為必填欄位')
    .email('請輸入有效的電子郵件格式')
    .max(254, '電子郵件長度不能超過 254 個字符')
    .trim()
    .toLowerCase()
    .openapi({
      description: '要驗證的電子郵件地址',
      example: 'verify@example.com',
      examples: ['verify@example.com', 'user@company.com', 'newuser@gmail.com'],
      format: 'email',
      maxLength: 254
    })
}).openapi('VerifyEmailRequest', {
  description: '電子郵件驗證請求資料',
  example: {
    token: 'verify_token_123456789',
    email: 'user@example.com'
  }
});

/**
 * 更改密碼請求驗證器
 */
export const changePasswordValidator = z.object({
  currentPassword: z
    .string()
    .min(1, '當前密碼為必填欄位')
    .min(1, '當前密碼不能為空')
    .openapi({
      description: '當前的密碼',
      example: 'CurrentPassword123',
      examples: ['CurrentPassword123', 'OldPassword456']
    }),
  newPassword: z
    .string()
    .min(1, '新密碼為必填欄位')
    .min(8, '密碼至少需要 8 個字符')
    .max(128, '密碼不能超過 128 個字符')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, '密碼必須包含至少一個小寫字母、一個大寫字母和一個數字')
    .openapi({
      description: '新的密碼（必須與當前密碼不同）',
      example: 'NewPassword123',
      examples: ['NewPassword123', 'UpdatedPwd456', 'ChangedPass789'],
      minLength: 8,
      maxLength: 128
    }),
  confirmPassword: z
    .string()
    .min(1, '確認密碼為必填欄位')
    .openapi({
      description: '確認新密碼（必須與新密碼相同）',
      example: 'NewPassword123',
      examples: ['NewPassword123', 'UpdatedPwd456', 'ChangedPass789']
    })
})
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: '密碼確認不符',
    path: ['confirmPassword']
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: '新密碼必須與當前密碼不同',
    path: ['newPassword']
  })
  .openapi('ChangePasswordRequest', {
    description: '更改密碼請求資料',
    example: {
      currentPassword: 'CurrentPassword123',
      newPassword: 'NewPassword456',
      confirmPassword: 'NewPassword456'
    }
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
    .openapi({
      description: '顯示名稱',
      example: '李小明',
      examples: ['李小明', 'John Smith', 'Alice Chen', '王大華'],
      maxLength: 100
    }),
  username: z
    .string()
    .min(3, '用戶名至少需要 3 個字符')
    .max(50, '用戶名不能超過 50 個字符')
    .regex(/^[a-zA-Z0-9_-]+$/, '用戶名只能包含字母、數字、底線和連字符')
    .trim()
    .optional()
    .openapi({
      description: '用戶名',
      example: 'new_username',
      examples: ['new_username', 'updated-name', 'user2024'],
      minLength: 3,
      maxLength: 50,
      pattern: '^[a-zA-Z0-9_-]+$'
    }),
  photoUrl: z
    .string()
    .url('請輸入有效的 URL 格式')
    .max(2048, 'URL 長度不能超過 2048 個字符')
    .optional()
    .nullable()
    .openapi({
      description: '個人大頭照 URL',
      example: 'https://example.com/avatar/user.jpg',
      examples: ['https://example.com/avatar/user.jpg', 'https://cdn.example.com/photos/profile.png'],
      format: 'uri',
      maxLength: 2048
    }),
  bio: z
    .string()
    .max(500, '個人簡介不能超過 500 個字符')
    .trim()
    .optional()
    .nullable()
    .openapi({
      description: '個人簡介',
      example: '我是一名全端開發工程師，熱愛學習新技術',
      examples: ['我是一名全端開發工程師，熱愛學習新技術', 'Passionate about creating great user experiences', '專業 UI/UX 設計師，專長於使用者研究'],
      maxLength: 500
    })
}).openapi('UpdateProfileRequest', {
  description: '更新個人資料請求資料',
  example: {
    name: '李小明',
    username: 'xiaoming_li',
    photoUrl: 'https://example.com/avatar/xiaoming.jpg',
    bio: '我是一名全端開發工程師，專長於 React 和 Node.js'
  }
});

/**
 * JWT Token 驗證器
 */
export const tokenValidator = z.object({
  token: z
    .string()
    .min(1, 'Token 為必填欄位')
    .min(1, 'Token 不能為空')
    .regex(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/, '無效的 JWT Token 格式')
    .openapi({
      description: 'JWT 認證令牌',
      example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
      pattern: '^[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]*$'
    })
}).openapi('TokenRequest', {
  description: 'JWT 令牌驗證請求資料',
  example: {
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
  }
});

/**
 * 註銷所有設備請求驗證器
 */
export const revokeAllSessionsValidator = z.object({
  password: z
    .string()
    .min(1, '密碼為必填欄位')
    .min(1, '密碼不能為空')
    .openapi({
      description: '當前密碼用於確認身份',
      example: 'MyCurrentPassword123',
      examples: ['MyCurrentPassword123', 'SecurePassword456']
    })
}).openapi('RevokeAllSessionsRequest', {
  description: '註銷所有設備登入請求資料',
  example: {
    password: 'MyCurrentPassword123'
  }
});

/**
 * Apple Sign In 請求驗證器
 */
export const appleSignInValidator = z.object({
  idToken: z
    .string()
    .min(1, 'Apple ID Token 為必填欄位')
    .openapi({
      description: 'Apple Sign In 返回的 ID Token',
      example: 'eyJraWQiOiJ...'
    }),
  user: z
    .object({
      name: z
        .string()
        .max(100, '名稱不能超過 100 個字符')
        .optional()
        .openapi({
          description: '用戶名稱（僅首次登入時由 Apple 提供）',
          example: 'John Doe'
        }),
      email: z
        .string()
        .email('請輸入有效的電子郵件格式')
        .optional()
        .openapi({
          description: '用戶電子郵件（可能為 private relay email）',
          example: 'user@privaterelay.appleid.com'
        })
    })
    .optional()
    .openapi({
      description: '用戶資訊（僅首次授權時由 iOS App 提供）'
    }),
  nonce: z
    .string()
    .optional()
    .openapi({
      description: '用於防止重放攻擊的 nonce 值',
      example: 'random_nonce_string'
    })
}).openapi('AppleSignInRequest', {
  description: 'Apple Sign In 登入請求資料',
  example: {
    idToken: 'eyJraWQiOiJ...',
    user: {
      name: 'John Doe',
      email: 'john@example.com'
    }
  }
});

/**
 * Apple Sign In 回應 schema
 */
export const appleSignInResponseSchema = apiSuccessResponseSchema(
  z.object({
    token: z.string().openapi({
      description: 'JWT 認證 token',
      example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    }),
    user: z.object({
      id: z.number().int().openapi({
        description: '用戶數字 ID',
        example: 123
      }),
      _id: z.string().openapi({
        description: '用戶 UUID',
        example: '123e4567-e89b-12d3-a456-426614174000'
      }),
      name: z.string().openapi({
        description: '用戶名稱',
        example: 'John Doe'
      }),
      email: z.string().email().optional().openapi({
        description: '電子郵件地址',
        example: 'john@example.com'
      }),
      photoUrl: z.string().url().optional().openapi({
        description: '個人大頭照 URL',
        example: 'https://example.com/avatar.jpg'
      }),
      roleId: z.number().int().optional().openapi({
        description: '角色 ID',
        example: 2
      })
    }).openapi({
      description: '用戶資訊'
    }),
    isTemp: z.boolean().openapi({
      description: '是否為臨時用戶',
      example: false
    }),
    isNewUser: z.boolean().openapi({
      description: '是否為新建立的用戶',
      example: true
    })
  })
).openapi('AppleSignInResponse', {
  description: 'Apple Sign In 登入成功回應',
  example: {
    success: true,
    data: {
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      user: {
        id: 123,
        _id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Doe',
        email: 'john@example.com',
        roleId: 2
      },
      isTemp: false,
      isNewUser: true
    },
    timestamp: '2024-01-15T10:30:00.000Z'
  }
});

/**
 * OAuth 狀態驗證器
 */
export const oauthStateValidator = z.object({
  state: z
    .string()
    .min(1, '狀態參數不能為空')
    .optional()
    .openapi({
      description: 'OAuth 狀態參數',
      example: 'random_state_123456',
      examples: ['random_state_123456', 'oauth_state_abc']
    }),
  code: z
    .string()
    .min(1, '授權碼不能為空')
    .optional()
    .openapi({
      description: 'OAuth 授權碼',
      example: 'auth_code_123456789',
      examples: ['auth_code_123456789', 'oauth_authorization_code']
    }),
  error: z
    .string()
    .optional()
    .openapi({
      description: 'OAuth 錯誤代碼',
      example: 'access_denied',
      examples: ['access_denied', 'invalid_request', 'server_error']
    }),
  error_description: z
    .string()
    .optional()
    .openapi({
      description: 'OAuth 錯誤詳細描述',
      example: 'User denied the request',
      examples: ['User denied the request', 'Invalid client credentials', 'Internal server error']
    })
}).openapi('OAuthStateRequest', {
  description: 'OAuth 認證回調參數',
  examples: [
    {
      state: 'random_state_123456',
      code: 'auth_code_123456789'
    },
    {
      state: 'oauth_state_abc',
      error: 'access_denied',
      error_description: 'User denied the request'
    }
  ]
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
export type AppleSignInRequest = z.infer<typeof appleSignInValidator>;

// 認證相關的回應 schemas

// 用戶資料 schema（簡化版，對應認證時返回的用戶資訊）
const authUserSchema = z.object({
  id: z.number().int().openapi({
    description: "用戶數字 ID",
    example: 123
  }),
  _id: z.string().openapi({
    description: "用戶 UUID",
    example: "123e4567-e89b-12d3-a456-426614174000",
    format: "uuid"
  }),
  name: z.string().openapi({
    description: "用戶姓名",
    example: "王小明"
  }),
  email: z.string().email().openapi({
    description: "電子郵件地址",
    example: "wang.xiaoming@example.com",
    format: "email"
  }),
  photoUrl: z.string().url().nullable().openapi({
    description: "個人大頭照 URL",
    example: "https://example.com/avatar/wang.jpg",
    format: "uri"
  }),
  roleId: z.number().int().nullable().openapi({
    description: "角色 ID",
    example: 1
  })
}).openapi('AuthUserData', {
  description: "認證用戶資料",
  example: {
    id: 123,
    _id: "123e4567-e89b-12d3-a456-426614174000",
    name: "王小明",
    email: "wang.xiaoming@example.com",
    photoUrl: "https://example.com/avatar/wang.jpg",
    roleId: 1
  }
});

// 登入成功回應 schema
export const loginSuccessResponseSchema = apiSuccessResponseSchema(
  z.object({
    user: authUserSchema,
    token: z.string().openapi({
      description: "JWT 認證 token",
      example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }),
    refreshToken: z.string().optional().openapi({
      description: "刷新 token",
      example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    })
  })
).openapi('LoginSuccessResponse', {
  description: "登入成功回應",
  example: {
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
  }
});

// 登出回應 schema
export const logoutResponseSchema = apiSuccessResponseSchema(
  z.object({
    message: z.string().openapi({
      description: "登出結果訊息",
      example: "已成功登出"
    })
  })
).openapi('LogoutResponse', {
  description: "登出回應",
  example: {
    success: true,
    data: {
      message: "已成功登出"
    },
    timestamp: "2024-01-15T10:30:00.000Z"
  }
});

// 刷新 token 回應 schema
export const refreshTokenResponseSchema = apiSuccessResponseSchema(
  z.object({
    token: z.string().openapi({
      description: "新的 JWT 認證 token",
      example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }),
    refreshToken: z.string().optional().openapi({
      description: "新的刷新 token",
      example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    })
  })
).openapi('RefreshTokenResponse', {
  description: "刷新 token 回應",
  example: {
    success: true,
    data: {
      token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    },
    timestamp: "2024-01-15T10:30:00.000Z"
  }
});

// 獲取當前用戶資訊回應 schema
export const getCurrentUserResponseSchema = apiSuccessResponseSchema(
  z.object({
    user: z.object({
      id: z.string().openapi({
        description: "用戶外部 ID",
        example: "123e4567-e89b-12d3-a456-426614174000",
        format: "uuid"
      }),
      nickname: z.string().optional().openapi({
        description: "用戶暱稱",
        example: "王小明"
      }),
      email: z.string().email().nullable().openapi({
        description: "電子郵件地址",
        example: "wang.xiaoming@example.com",
        format: "email"
      }),
      name: z.string().nullable().openapi({
        description: "用戶姓名",
        example: "王小明"
      }),
      photo_url: z.string().nullable().openapi({
        description: "個人大頭照 URL",
        example: "https://example.com/avatar/wang.jpg"
      }),
      is_active: z.boolean().openapi({
        description: "是否啟用",
        example: true
      }),
      email_verified: z.boolean().openapi({
        description: "電子郵件是否已驗證",
        example: true
      }),
      email_verified_at: z.string().datetime().nullable().openapi({
        description: "電子郵件驗證時間",
        example: "2024-01-15T10:30:00.000Z",
        format: "date-time"
      }),
      roles: z.array(z.string()).openapi({
        description: "用戶角色列表",
        example: ["user", "mentor"]
      }),
      permissions: z.array(z.string()).openapi({
        description: "用戶權限列表",
        example: ["read_resources", "create_comments"]
      })
    }).openapi({
      description: "完整的用戶資訊"
    }),
    isTemporary: z.boolean().openapi({
      description: "是否為臨時用戶",
      example: false
    })
  })
).openapi('GetCurrentUserResponse', {
  description: "獲取當前用戶資訊回應",
  example: {
    success: true,
    data: {
      user: {
        id: "123e4567-e89b-12d3-a456-426614174000",
        nickname: "王小明",
        email: "wang.xiaoming@example.com",
        name: "王小明",
        photo_url: "https://example.com/avatar/wang.jpg",
        is_active: true,
        email_verified: true,
        email_verified_at: "2024-01-15T10:30:00.000Z",
        roles: ["user", "mentor"],
        permissions: ["read_resources", "create_comments"]
      },
      isTemporary: false
    },
    timestamp: "2024-01-15T10:30:00.000Z"
  }
});

// 電子郵件驗證回應 schema
export const verifyEmailResponseSchema = apiSuccessResponseSchema(
  z.object({
    message: z.string().openapi({
      description: "驗證結果訊息",
      example: "郵件驗證成功"
    })
  })
).openapi('VerifyEmailResponse', {
  description: "電子郵件驗證回應",
  example: {
    success: true,
    data: {
      message: "郵件驗證成功"
    },
    timestamp: "2024-01-15T10:30:00.000Z"
  }
});

// ===================================
// 🎯 註冊 schemas 到 OpenAPI registry
// ===================================

// 註冊請求 schemas
registry.register('LoginRequest', loginValidator);
registry.register('RegisterRequest', registerValidator);
registry.register('ForgotPasswordRequest', forgotPasswordValidator);
registry.register('ResetPasswordRequest', resetPasswordValidator);
registry.register('VerifyEmailRequest', verifyEmailValidator);
registry.register('ChangePasswordRequest', changePasswordValidator);
registry.register('UpdateProfileRequest', updateProfileValidator);
registry.register('TokenRequest', tokenValidator);
registry.register('RevokeAllSessionsRequest', revokeAllSessionsValidator);
registry.register('OAuthStateRequest', oauthStateValidator);
registry.register('AppleSignInRequest', appleSignInValidator);

// 註冊回應 schemas
registry.register('AuthUserData', authUserSchema);
registry.register('LoginSuccessResponse', loginSuccessResponseSchema);
registry.register('LogoutResponse', logoutResponseSchema);
registry.register('RefreshTokenResponse', refreshTokenResponseSchema);
registry.register('GetCurrentUserResponse', getCurrentUserResponseSchema);
registry.register('VerifyEmailResponse', verifyEmailResponseSchema);
registry.register('AppleSignInResponse', appleSignInResponseSchema);

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
  oauthStateValidator,
  appleSignInValidator
};

export default authValidators;