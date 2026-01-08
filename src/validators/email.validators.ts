/**
 * 郵件相關的驗證器 - 使用 OpenAPI
 * 使用 @asteasolutions/zod-to-openapi 進行請求數據驗證和文檔生成
 *
 * 🔄 遷移指南：
 * 1. 將 .meta() 改為 .openapi()
 * 2. 使用 effectType 處理 .transform() 和 .refine()
 * 3. 使用 registry.register() 註冊 schemas
 */

import { z } from 'zod';
import { registry } from '../config/openapi-registry';

// ===================================
// 基本郵件地址驗證 schema
// ===================================

const emailSchema = z.string()
  .email('請提供有效的電子郵件地址')
  .min(1, '電子郵件為必填項')
  .openapi({
    description: '有效的電子郵件地址',
    example: 'user@example.com',
    examples: ['user@example.com', 'john.doe@company.com', 'student@university.edu'],
    format: 'email'
  });

// ===================================
// 郵件模板枚舉
// ===================================

const EMAIL_TEMPLATES = ['welcome', 'verification', 'password-reset', 'contact', 'marathon', 'custom'] as const;

const emailTemplateSchema = z.enum(EMAIL_TEMPLATES).openapi({
  description: '郵件模板類型',
  example: 'welcome'
});

// ===================================
// 聯絡郵件驗證器
// ===================================

export const contactEmailSchema = z.object({
  from: emailSchema.openapi({
    description: '寄件人的電子郵件地址',
    example: 'sender@company.com'
  }),
  to: emailSchema.openapi({
    description: '收件人的電子郵件地址',
    example: 'contact@company.com'
  }),
  subject: z.string()
    .min(1, '主旨為必填項')
    .max(200, '主旨不能超過200個字符')
    .openapi({
      description: '郵件的主旨或標題',
      example: '合作詢問',
      examples: ['合作詢問', '技術支援請求', '產品諮詢'],
      minLength: 1,
      maxLength: 200
    }),
  text: z.string()
    .min(1, '訊息內容為必填項')
    .max(5000, '訊息內容不能超過5000個字符')
    .openapi({
      description: '郵件的主要內容文字',
      example: '您好，我對貴公司的產品很感興趣，希望能了解更多詳情。',
      minLength: 1,
      maxLength: 5000
    }),
  name: z.string()
    .min(1, '姓名為必填項')
    .max(100, '姓名不能超過100個字符')
    .openapi({
      description: '寄件人的姓名',
      example: '王小明',
      examples: ['王小明', '李雅韻', 'John Smith'],
      minLength: 1,
      maxLength: 100
    }),
  title: z.string()
    .max(200, '標題不能超過200個字符')
    .optional()
    .openapi({
      description: '寄件人的職稱或頭銜',
      example: '總經理',
      examples: ['總經理', '技術總監', '專案經理'],
      maxLength: 200
    }),
  information: z.union([
    z.string()
      .max(500, '聯絡資訊不能超過500個字符')
      .openapi({
        description: '單一聯絡資訊字串',
        example: '電話：0912-345-678，公司：某某科技'
      }),
    z.array(z.string().max(100, '每項聯絡資訊不能超過100個字符'))
      .max(10, '聯絡資訊項目不能超過10個')
      .openapi({
        description: '聯絡資訊項目列表',
        example: ['電話：0912-345-678', '公司：某某科技', '职位：技術總監']
      })
  ]).optional().openapi({
    description: '寄件人的附加聯絡資訊',
    example: ['電話：0912-345-678', '公司：某某科技']
  }),
  activityTitle: z.string()
    .max(200, '活動標題不能超過200個字符')
    .optional()
    .openapi({
      description: '相關活動或事件的標題',
      example: '技術分享會',
      examples: ['技術分享會', '產品發布會', '線上研習會'],
      maxLength: 200
    })
}).openapi('ContactEmailRequest', {
  description: '寄送聯絡郵件的請求資料'
});

// 註冊到 registry
registry.register('ContactEmailRequest', contactEmailSchema);

// ===================================
// 驗證郵件驗證器
// ===================================

export const verificationEmailSchema = z.object({
  email: emailSchema.openapi({
    description: '需要驗證的電子郵件地址',
    example: 'user@example.com'
  }),
  verifyLink: z.string()
    .url('請提供有效的驗證連結')
    .min(1, '驗證連結為必填項')
    .openapi({
      description: '用戶點擊驗證的連結網址',
      example: 'https://example.com/verify?token=abc123',
      format: 'uri'
    }),
  name: z.string()
    .max(100, '姓名不能超過100個字符')
    .optional()
    .openapi({
      description: '用戶的顯示姓名',
      example: '王小明',
      examples: ['王小明', 'Alice Chen', '李雅韻'],
      maxLength: 100
    })
}).openapi('VerificationEmailRequest', {
  description: '寄送電子郵件驗證信的請求資料'
});

registry.register('VerificationEmailRequest', verificationEmailSchema);

// ===================================
// 歡迎郵件驗證器
// ===================================

export const welcomeEmailSchema = z.object({
  email: emailSchema.openapi({
    description: '新用戶的電子郵件地址',
    example: 'newuser@example.com'
  }),
  name: z.string()
    .min(1, '姓名為必填項')
    .max(100, '姓名不能超過100個字符')
    .openapi({
      description: '新用戶的姓名或稱呼',
      example: '王小明',
      examples: ['王小明', 'Alice', '新成員'],
      minLength: 1,
      maxLength: 100
    })
}).openapi('WelcomeEmailRequest', {
  description: '寄送歡迎信給新用戶的請求資料'
});

registry.register('WelcomeEmailRequest', welcomeEmailSchema);

// ===================================
// 密碼重設郵件驗證器
// ===================================

export const passwordResetEmailSchema = z.object({
  email: emailSchema.openapi({
    description: '需要重設密碼的用戶郵件',
    example: 'user@example.com'
  }),
  resetLink: z.string()
    .url('請提供有效的重設連結')
    .min(1, '重設連結為必填項')
    .openapi({
      description: '用戶點擊重設密碼的安全連結',
      example: 'https://example.com/reset-password?token=xyz789',
      format: 'uri'
    }),
  name: z.string()
    .max(100, '姓名不能超過100個字符')
    .optional()
    .openapi({
      description: '用戶的顯示姓名',
      example: '王小明',
      examples: ['王小明', 'John Doe', '李雅韻'],
      maxLength: 100
    })
}).openapi('PasswordResetEmailRequest', {
  description: '寄送密碼重設郵件的請求資料'
});

registry.register('PasswordResetEmailRequest', passwordResetEmailSchema);

// ===================================
// 馬拉松郵件驗證器
// ===================================

export const marathonEmailSchema = z.object({
  email: emailSchema.openapi({
    description: '參與馬拉松活動的用戶郵件',
    example: 'participant@example.com'
  }),
  name: z.string()
    .min(1, '姓名為必填項')
    .max(100, '姓名不能超過100個字符')
    .openapi({
      description: '參與者的姓名',
      example: '王小明',
      examples: ['王小明', 'Alice Chen', '李雅韻'],
      minLength: 1,
      maxLength: 100
    }),
  marathonTitle: z.string()
    .min(1, '馬拉松標題為必填項')
    .max(200, '馬拉松標題不能超過200個字符')
    .openapi({
      description: '馬拉松活動的名稱或標題',
      example: '2024春季學習馬拉松',
      examples: ['2024春季學習馬拉松', 'React技能提升挑戰', '100天程式設計馬拉松'],
      minLength: 1,
      maxLength: 200
    }),
  marathonDate: z.string()
    .max(100, '馬拉松日期不能超過100個字符')
    .optional()
    .openapi({
      description: '馬拉松的開始或舉辦日期',
      example: '2024年3月15日',
      examples: ['2024年3月15日', '2024-03-15', '三月中旬'],
      maxLength: 100
    }),
  marathonDescription: z.string()
    .max(1000, '馬拉松描述不能超過1000個字符')
    .optional()
    .openapi({
      description: '馬拉松活動的詳細說明',
      example: '這是一個為期100天的學習挑戦，幫助您提升程式設計技能。',
      maxLength: 1000
    })
}).openapi('MarathonEmailRequest', {
  description: '寄送馬拉松活動相關郵件的請求資料'
});

registry.register('MarathonEmailRequest', marathonEmailSchema);

// ===================================
// 自定義郵件驗證器
// ===================================

export const customEmailSchema = z.object({
  to: z.union([
    emailSchema.openapi({
      description: '單一收件人郵件地址',
      example: 'recipient@example.com'
    }),
    z.array(emailSchema)
      .min(1, '收件人列表不能為空')
      .max(50, '單次發送收件人不能超過50個')
      .openapi({
        description: '多個收件人郵件地址列表',
        example: ['user1@example.com', 'user2@company.com', 'user3@service.org']
      })
  ]).openapi({
    description: '收件人，可以是單一郵件或多個郵件地址',
    example: 'single@example.com'
  }),
  subject: z.string()
    .min(1, '主旨為必填項')
    .max(200, '主旨不能超過200個字符')
    .openapi({
      description: '郵件的主旨或標題',
      example: '系統通知',
      examples: ['系統通知', '活動邀請', '產品更新'],
      minLength: 1,
      maxLength: 200
    }),
  htmlContent: z.string()
    .min(1, 'HTML內容為必填項')
    .max(50000, 'HTML內容不能超過50000個字符')
    .optional()
    .openapi({
      description: '郵件的HTML內容格式',
      example: '<h1>歡迎使用我們的服務！</h1><p>感謝您的註冊。</p>',
      maxLength: 50000
    }),
  template: emailTemplateSchema.optional(),
  data: z.record(z.string(), z.any())
    .optional()
    .openapi({
      description: '模板渲染所需的動態數據',
      example: {
        userName: '王小明',
        verificationLink: 'https://example.com/verify?token=abc123',
        companyName: '某某科技公司'
      }
    })
}).refine((data) => data.htmlContent || (data.template && data.data), {
  message: '必須提供 htmlContent 或 (template + data)'
}).openapi('CustomEmailRequest', {
  description: '寄送自定義郵件的請求資料'
});

registry.register('CustomEmailRequest', customEmailSchema);

// ===================================
// 批量郵件驗證器
// ===================================

const recipientSchema = z.object({
  email: emailSchema.openapi({
    description: '收件人郵件地址',
    example: 'user1@example.com'
  }),
  data: z.record(z.string(), z.any()).openapi({
    description: '該收件人專屬的模板數據',
    example: {
      name: '王小明',
      verificationCode: 'ABC123'
    }
  })
}).openapi('EmailRecipient', {
  description: '單個收件人資訊'
});

registry.register('EmailRecipient', recipientSchema);

export const bulkEmailSchema = z.object({
  template: emailTemplateSchema.openapi({
    description: '批量發送使用的郵件模板'
  }),
  subject: z.string()
    .min(1, '主旨為必填項')
    .max(200, '主旨不能超過200個字符')
    .openapi({
      description: '批量郵件的統一主旨',
      example: '歡迎加入我們！',
      examples: ['歡迎加入我們！', '系統更新通知', '有新活動了！'],
      minLength: 1,
      maxLength: 200
    }),
  recipients: z.array(recipientSchema)
    .min(1, '收件人列表不能為空')
    .max(100, '單次批量發送不能超過100個收件人')
    .openapi({
      description: '批量發送的收件人列表'
    }),
  from: emailSchema
    .optional()
    .openapi({
      description: '指定寄件人郵件（可選）',
      example: 'noreply@company.com'
    }),
  scheduledAt: z.string()
    .datetime('排程時間格式不正確')
    .optional()
    .openapi({
      description: '排程發送的時間（ISO 8601格式）',
      example: '2024-03-15T10:30:00Z',
      format: 'date-time'
    })
}).openapi('BulkEmailRequest', {
  description: '批量發送郵件的請求資料'
});

registry.register('BulkEmailRequest', bulkEmailSchema);

// ===================================
// 郵件地址驗證器
// ===================================

export const validateEmailSchema = z.object({
  email: z.string()
    .min(1, '電子郵件為必填項')
    .openapi({
      description: '需要驗證格式的郵件地址',
      example: 'test@example.com',
      examples: ['test@example.com', 'user.name@company.org', 'check@domain.co.uk']
    })
}).openapi('ValidateEmailRequest', {
  description: '驗證郵件地址格式的請求資料'
});

registry.register('ValidateEmailRequest', validateEmailSchema);

// ===================================
// 郵件模板預覽驗證器
// ===================================

export const previewEmailSchema = z.object({
  template: emailTemplateSchema.openapi({
    description: '要預覽的郵件模板類型'
  }),
  data: z.record(z.string(), z.any())
    .refine((data) => {
      return Object.keys(data).length > 0;
    }, {
      message: '模板數據不能為空'
    })
    .openapi({
      description: '模板預覽所需的動態數據',
      example: {
        userName: '王小明',
        verificationLink: 'https://example.com/verify?token=preview123',
        companyName: '某某科技'
      }
    })
}).openapi('PreviewEmailRequest', {
  description: '預覽郵件模板的請求資料'
});

registry.register('PreviewEmailRequest', previewEmailSchema);

// ===================================
// 郵件統計查詢驗證器
// ===================================

export const emailStatsQuerySchema = z.object({
  startDate: z.string()
    .datetime('開始時間格式不正確')
    .optional()
    .openapi({
      description: '統計查詢的開始時間（ISO 8601格式）',
      example: '2024-01-01T00:00:00Z',
      format: 'date-time'
    }),
  endDate: z.string()
    .datetime('結束時間格式不正確')
    .optional()
    .openapi({
      description: '統計查詢的結束時間（ISO 8601格式）',
      example: '2024-12-31T23:59:59Z',
      format: 'date-time'
    })
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) <= new Date(data.endDate);
  }
  return true;
}, {
  message: '開始時間不能晚於結束時間'
}).openapi('EmailStatsQuery', {
  description: '查詢郵件發送統計的時間範圍參數'
});

registry.register('EmailStatsQuery', emailStatsQuerySchema);

// ===================================
// 響應 Schemas
// ===================================

// 郵件發送成功響應
export const emailSuccessResponseSchema = z.object({
  success: z.literal(true).openapi({
    description: '請求成功標誌',
    example: true
  }),
  data: z.object({
    messageId: z.string().openapi({
      description: '郵件訊息 ID',
      example: 'msg_abc123xyz789'
    }),
    status: z.string().openapi({
      description: '發送狀態',
      example: 'sent',
      examples: ['sent', 'queued', 'scheduled']
    })
  }).openapi({
    description: '郵件發送結果'
  }),
  timestamp: z.string().datetime().openapi({
    description: '回應時間戳',
    example: '2024-01-15T10:30:00.000Z',
    format: 'date-time'
  })
}).openapi('EmailSuccessResponse', {
  description: '郵件發送成功響應'
});

registry.register('EmailSuccessResponse', emailSuccessResponseSchema);

// 郵件驗證響應
export const emailValidationResponseSchema = z.object({
  success: z.literal(true).openapi({
    description: '請求成功標誌',
    example: true
  }),
  data: z.object({
    valid: z.boolean().openapi({
      description: '郵件地址是否有效',
      example: true
    }),
    email: z.string().openapi({
      description: '驗證的郵件地址',
      example: 'user@example.com'
    }),
    reason: z.string().optional().openapi({
      description: '無效的原因（如果無效）',
      example: '格式不正確'
    })
  }).openapi({
    description: '郵件驗證結果'
  }),
  timestamp: z.string().datetime().openapi({
    description: '回應時間戳',
    example: '2024-01-15T10:30:00.000Z',
    format: 'date-time'
  })
}).openapi('EmailValidationResponse', {
  description: '郵件驗證響應'
});

registry.register('EmailValidationResponse', emailValidationResponseSchema);

// 郵件預覽響應
export const emailPreviewResponseSchema = z.object({
  success: z.literal(true).openapi({
    description: '請求成功標誌',
    example: true
  }),
  data: z.object({
    htmlContent: z.string().openapi({
      description: '渲染後的 HTML 內容',
      example: '<html><body><h1>歡迎</h1></body></html>'
    }),
    textContent: z.string().optional().openapi({
      description: '純文本內容',
      example: '歡迎使用我們的服務'
    })
  }).openapi({
    description: '郵件預覽內容'
  }),
  timestamp: z.string().datetime().openapi({
    description: '回應時間戳',
    example: '2024-01-15T10:30:00.000Z',
    format: 'date-time'
  })
}).openapi('EmailPreviewResponse', {
  description: '郵件預覽響應'
});

registry.register('EmailPreviewResponse', emailPreviewResponseSchema);

// 郵件統計響應
export const emailStatsResponseSchema = z.object({
  success: z.literal(true).openapi({
    description: '請求成功標誌',
    example: true
  }),
  data: z.object({
    totalSent: z.number().openapi({
      description: '總發送數量',
      example: 1250
    }),
    totalFailed: z.number().openapi({
      description: '總失敗數量',
      example: 15
    }),
    successRate: z.number().openapi({
      description: '成功率（百分比）',
      example: 98.8
    }),
    byTemplate: z.record(z.string(), z.number()).openapi({
      description: '按模板分類的統計',
      example: {
        welcome: 500,
        verification: 400,
        'password-reset': 350
      }
    })
  }).openapi({
    description: '郵件統計數據'
  }),
  timestamp: z.string().datetime().openapi({
    description: '回應時間戳',
    example: '2024-01-15T10:30:00.000Z',
    format: 'date-time'
  })
}).openapi('EmailStatsResponse', {
  description: '郵件統計響應'
});

registry.register('EmailStatsResponse', emailStatsResponseSchema);

// 郵件健康狀態響應
export const emailHealthResponseSchema = z.object({
  success: z.literal(true).openapi({
    description: '請求成功標誌',
    example: true
  }),
  data: z.object({
    status: z.enum(['healthy', 'degraded', 'unhealthy']).openapi({
      description: '服務健康狀態',
      example: 'healthy'
    }),
    smtpConnection: z.boolean().openapi({
      description: 'SMTP 連線狀態',
      example: true
    }),
    queueSize: z.number().openapi({
      description: '待發送郵件佇列大小',
      example: 5
    }),
    lastError: z.string().optional().nullable().openapi({
      description: '最後錯誤訊息',
      example: null
    })
  }).openapi({
    description: '郵件服務健康狀態'
  }),
  timestamp: z.string().datetime().openapi({
    description: '回應時間戳',
    example: '2024-01-15T10:30:00.000Z',
    format: 'date-time'
  })
}).openapi('EmailHealthResponse', {
  description: '郵件健康狀態響應'
});

registry.register('EmailHealthResponse', emailHealthResponseSchema);

// 批量郵件發送響應
export const bulkEmailResponseSchema = z.object({
  success: z.literal(true).openapi({
    description: '請求成功標誌',
    example: true
  }),
  data: z.object({
    totalRecipients: z.number().openapi({
      description: '總收件人數量',
      example: 50
    }),
    successfulSends: z.number().openapi({
      description: '成功發送數量',
      example: 48
    }),
    failedSends: z.number().openapi({
      description: '失敗發送數量',
      example: 2
    }),
    failures: z.array(z.object({
      email: z.string().openapi({
        description: '失敗的郵件地址',
        example: 'invalid@example.com'
      }),
      reason: z.string().openapi({
        description: '失敗原因',
        example: '郵件地址無效'
      })
    })).optional().openapi({
      description: '失敗的郵件詳情'
    })
  }).openapi({
    description: '批量發送結果'
  }),
  timestamp: z.string().datetime().openapi({
    description: '回應時間戳',
    example: '2024-01-15T10:30:00.000Z',
    format: 'date-time'
  })
}).openapi('BulkEmailResponse', {
  description: '批量郵件發送響應'
});

registry.register('BulkEmailResponse', bulkEmailResponseSchema);

// ===================================
// 常用郵件類型的預設驗證器（向後兼容）
// ===================================

export const emailValidators = {
  contact: contactEmailSchema,
  verification: verificationEmailSchema,
  welcome: welcomeEmailSchema,
  passwordReset: passwordResetEmailSchema,
  marathon: marathonEmailSchema,
  custom: customEmailSchema,
  bulk: bulkEmailSchema,
  validate: validateEmailSchema,
  preview: previewEmailSchema,
  statsQuery: emailStatsQuerySchema
} as const;

export default emailValidators;
