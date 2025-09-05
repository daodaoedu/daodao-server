/**
 * 郵件相關的驗證器
 * 使用 Zod 進行請求數據驗證
 */

import { z } from 'zod';

/**
 * 基本郵件地址驗證
 */
const emailSchema = z.string()
  .email('請提供有效的電子郵件地址')
  .min(1, '電子郵件為必填項')
  .describe("有效的電子郵件地址")
  .meta({
    title: "電子郵件",
    examples: ["user@example.com", "john.doe@company.com", "student@university.edu"]
  });

/**
 * 聯絡郵件驗證器
 */
export const contactEmailSchema = z.object({
  from: emailSchema
    .describe("寄件人的電子郵件地址")
    .meta({
      title: "寄件人郵件",
      examples: ["sender@company.com", "user@example.org"]
    }),
  to: emailSchema
    .describe("收件人的電子郵件地址")
    .meta({
      title: "收件人郵件",
      examples: ["contact@company.com", "support@service.com"]
    }),
  subject: z.string().min(1, '主旨為必填項').max(200, '主旨不能超過200個字符')
    .describe("郵件的主旨或標題")
    .meta({
      title: "郵件主旨",
      examples: ["合作詢問", "技術支援請求", "產品諮詢"]
    }),
  text: z.string().min(1, '訊息內容為必填項').max(5000, '訊息內容不能超過5000個字符')
    .describe("郵件的主要內容文字")
    .meta({
      title: "郵件內容",
      examples: [
        "您好，我對貴公司的產品很感興趣，希望能了解更多詳情。",
        "我遇到了技術問題，需要協助解決。"
      ]
    }),
  name: z.string().min(1, '姓名為必填項').max(100, '姓名不能超過100個字符')
    .describe("寄件人的姓名")
    .meta({
      title: "寄件人姓名",
      examples: ["王小明", "李雅韻", "John Smith"]
    }),
  title: z.string().max(200, '標題不能超過200個字符').optional()
    .describe("寄件人的職稱或頭銜")
    .meta({
      title: "職稱或頭銜",
      examples: ["總經理", "技術總監", "專案經理"]
    }),
  information: z.union([
    z.string().max(500, '聯絡資訊不能超過500個字符')
      .describe("單一聯絡資訊字串")
      .meta({
        title: "聯絡資訊字串",
        examples: ["電話：0912-345-678，公司：某某科技"]
      }),
    z.array(z.string().max(100, '每項聯絡資訊不能超過100個字符')
      .describe("單項聯絡資訊")
      .meta({
        title: "聯絡資訊項目",
        examples: ["電話：0912-345-678", "公司：某某科技"]
      })
    ).max(10, '聯絡資訊項目不能超過10個')
      .describe("聯絡資訊項目列表")
      .meta({
        title: "聯絡資訊列表",
        examples: [[
          "電話：0912-345-678",
          "公司：某某科技",
          "职位：技術總監"
        ]]
      })
  ]).optional()
    .describe("寄件人的附加聯絡資訊")
    .meta({
      title: "附加聯絡資訊",
      examples: ["電話：0912-345-678", ["電話：0912-345-678", "公司：某某科技"]]
    }),
  activityTitle: z.string().max(200, '活動標題不能超過200個字符').optional()
    .describe("相關活動或事件的標題")
    .meta({
      title: "活動標題",
      examples: ["技術分享會", "產品發布會", "線上研習會"]
    })
}).describe("寄送聯絡郵件的請求資料").meta({
  title: "聯絡郵件發送",
  examples: [{
    from: "user@example.com",
    to: "contact@company.com",
    subject: "合作詢問",
    text: "您好，我對貴公司的產品很感興趣，希望能了解更多詳情。",
    name: "王小明",
    title: "總經理",
    information: ["電話：0912-345-678", "公司：某某科技"],
    activityTitle: "技術分享會"
  }]
});

/**
 * 驗證郵件驗證器
 */
export const verificationEmailSchema = z.object({
  email: emailSchema
    .describe("需要驗證的電子郵件地址")
    .meta({
      title: "驗證郵件",
      examples: ["user@example.com", "newuser@company.com"]
    }),
  verifyLink: z.string().url('請提供有效的驗證連結').min(1, '驗證連結為必填項')
    .describe("用戶點擊驗證的連結網址")
    .meta({
      title: "驗證連結",
      examples: [
        "https://example.com/verify?token=abc123",
        "https://app.company.com/email-verify/xyz789"
      ]
    }),
  name: z.string().max(100, '姓名不能超過100個字符').optional()
    .describe("用戶的顯示姓名")
    .meta({
      title: "用戶姓名",
      examples: ["王小明", "Alice Chen", "李雅韻"]
    })
}).describe("寄送電子郵件驗證信的請求資料").meta({
  title: "電子郵件驗證",
  examples: [{
    email: "user@example.com",
    verifyLink: "https://example.com/verify?token=abc123",
    name: "王小明"
  }]
});

/**
 * 歡迎郵件驗證器
 */
export const welcomeEmailSchema = z.object({
  email: emailSchema
    .describe("新用戶的電子郵件地址")
    .meta({
      title: "新用戶郵件",
      examples: ["newuser@example.com", "welcome@company.com"]
    }),
  name: z.string().min(1, '姓名為必填項').max(100, '姓名不能超過100個字符')
    .describe("新用戶的姓名或稱呼")
    .meta({
      title: "新用戶姓名",
      examples: ["王小明", "Alice", "新成員"]
    })
}).describe("寄送歡迎信給新用戶的請求資料").meta({
  title: "歡迎郵件發送",
  examples: [{
    email: "newuser@example.com",
    name: "王小明"
  }]
});

/**
 * 密碼重設郵件驗證器
 */
export const passwordResetEmailSchema = z.object({
  email: emailSchema
    .describe("需要重設密碼的用戶郵件")
    .meta({
      title: "用戶郵件",
      examples: ["user@example.com", "forgot@company.com"]
    }),
  resetLink: z.string().url('請提供有效的重設連結').min(1, '重設連結為必填項')
    .describe("用戶點擊重設密碼的安全連結")
    .meta({
      title: "密碼重設連結",
      examples: [
        "https://example.com/reset-password?token=xyz789",
        "https://app.company.com/password-reset/abc123"
      ]
    }),
  name: z.string().max(100, '姓名不能超過100個字符').optional()
    .describe("用戶的顯示姓名")
    .meta({
      title: "用戶姓名",
      examples: ["王小明", "John Doe", "李雅韻"]
    })
}).describe("寄送密碼重設郵件的請求資料").meta({
  title: "密碼重設郵件",
  examples: [{
    email: "user@example.com",
    resetLink: "https://example.com/reset-password?token=xyz789",
    name: "王小明"
  }]
});

/**
 * 馬拉松郵件驗證器
 */
export const marathonEmailSchema = z.object({
  email: emailSchema
    .describe("參與馬拉松活動的用戶郵件")
    .meta({
      title: "參與者郵件",
      examples: ["participant@example.com", "runner@company.com"]
    }),
  name: z.string().min(1, '姓名為必填項').max(100, '姓名不能超過100個字符')
    .describe("參與者的姓名")
    .meta({
      title: "參與者姓名",
      examples: ["王小明", "Alice Chen", "李雅韻"]
    }),
  marathonTitle: z.string().min(1, '馬拉松標題為必填項').max(200, '馬拉松標題不能超過200個字符')
    .describe("馬拉松活動的名稱或標題")
    .meta({
      title: "馬拉松標題",
      examples: ["2024春季學習馬拉松", "React技能提升挑戰", "100天程式設計馬拉松"]
    }),
  marathonDate: z.string().max(100, '馬拉松日期不能超過100個字符').optional()
    .describe("馬拉松的開始或舉辦日期")
    .meta({
      title: "馬拉松日期",
      examples: ["2024年3月15日", "2024-03-15", "三月中旬"]
    }),
  marathonDescription: z.string().max(1000, '馬拉松描述不能超過1000個字符').optional()
    .describe("馬拉松活動的詳細說明")
    .meta({
      title: "馬拉松說明",
      examples: [
        "這是一個為期100天的學習挑戦，幫助您提升程式設計技能。",
        "加入我們的React學習馬拉松，與其他開發者一起成長。"
      ]
    })
}).describe("寄送馬拉松活動相關郵件的請求資料").meta({
  title: "馬拉松活動郵件",
  examples: [{
    email: "participant@example.com",
    name: "王小明",
    marathonTitle: "2024春季學習馬拉松",
    marathonDate: "2024年3月15日",
    marathonDescription: "這是一個為期100天的學習挑戦，幫助您提升程式設計技能。"
  }]
});

/**
 * 自定義郵件驗證器
 */
export const customEmailSchema = z.object({
  to: z.union([
    emailSchema
      .describe("單一收件人郵件地址")
      .meta({
        title: "單一收件人",
        examples: ["recipient@example.com"]
      }),
    z.array(emailSchema
      .describe("收件人郵件地址")
      .meta({
        title: "收件人郵件",
        examples: ["user1@example.com", "user2@company.com"]
      })
    ).min(1, '收件人列表不能為空').max(50, '單次發送收件人不能超過50個')
      .describe("多個收件人郵件地址列表")
      .meta({
        title: "收件人列表",
        examples: [[
          "user1@example.com",
          "user2@company.com",
          "user3@service.org"
        ]]
      })
  ])
    .describe("收件人，可以是單一郵件或多個郵件地址")
    .meta({
      title: "郵件收件人",
      examples: ["single@example.com", ["user1@example.com", "user2@company.com"]]
    }),
  subject: z.string().min(1, '主旨為必填項').max(200, '主旨不能超過200個字符')
    .describe("郵件的主旨或標題")
    .meta({
      title: "郵件主旨",
      examples: ["系統通知", "活動邀請", "產品更新"]
    }),
  htmlContent: z.string().min(1, 'HTML內容為必填項').max(50000, 'HTML內容不能超過50000個字符').optional()
    .describe("郵件的HTML內容格式")
    .meta({
      title: "HTML郵件內容",
      examples: [
        "<h1>歡迎使用我們的服務！</h1><p>感謝您的註冊。</p>",
        "<div>您的訂單已經確認。</div>"
      ]
    }),
  template: z.enum(['welcome', 'verification', 'password-reset', 'contact', 'marathon', 'custom']).optional()
    .describe("使用的郵件模板類型")
    .meta({
      title: "郵件模板",
      examples: ['welcome', 'verification', 'password-reset', 'contact', 'marathon', 'custom'],
      enumDescriptions: {
        "welcome": "歡迎郵件模板",
        "verification": "驗證郵件模板",
        "password-reset": "密碼重設模板",
        "contact": "聯絡郵件模板",
        "marathon": "馬拉松模板",
        "custom": "自定義模板"
      }
    }),
  data: z.record(z.string(), z.any()).optional()
    .describe("模板渲染所需的動態數據")
    .meta({
      title: "模板數據",
      examples: [{
        userName: "王小明",
        verificationLink: "https://example.com/verify?token=abc123",
        companyName: "某某科技公司"
      }]
    })
}).refine((data) => data.htmlContent || (data.template && data.data), {
  message: '必須提供 htmlContent 或 (template + data)'
}).describe("寄送自定義郵件的請求資料").meta({
  title: "自定義郵件發送",
  examples: [{
    to: "user@example.com",
    subject: "歡迎加入我們！",
    template: "welcome",
    data: {
      userName: "王小明",
      companyName: "某某科技公司"
    }
  }]
});

/**
 * 批量郵件驗證器
 */
export const bulkEmailSchema = z.object({
  template: z.enum(['welcome', 'verification', 'password-reset', 'contact', 'marathon', 'custom'])
    .describe("批量發送使用的郵件模板")
    .meta({
      title: "郵件模板",
      examples: ['welcome', 'verification', 'password-reset'],
      enumDescriptions: {
        "welcome": "歡迎郵件模板",
        "verification": "驗證郵件模板",
        "password-reset": "密碼重設模板",
        "contact": "聯絡郵件模板",
        "marathon": "馬拉松模板",
        "custom": "自定義模板"
      }
    }),
  subject: z.string().min(1, '主旨為必填項').max(200, '主旨不能超過200個字符')
    .describe("批量郵件的統一主旨")
    .meta({
      title: "郵件主旨",
      examples: ["歡迎加入我們！", "系統更新通知", "有新活動了！"]
    }),
  recipients: z.array(z.object({
    email: emailSchema
      .describe("收件人郵件地址")
      .meta({
        title: "收件人郵件",
        examples: ["user1@example.com", "user2@company.com"]
      }),
    data: z.record(z.string(), z.any())
      .describe("該收件人專屬的模板數據")
      .meta({
        title: "個人化數據",
        examples: [{
          name: "王小明",
          verificationCode: "ABC123"
        }]
      })
  }).describe("單個收件人資訊").meta({
    title: "收件人資訊",
    examples: [{
      email: "user@example.com",
      data: { name: "王小明", code: "ABC123" }
    }]
  })).min(1, '收件人列表不能為空').max(100, '單次批量發送不能超過100個收件人')
    .describe("批量發送的收件人列表")
    .meta({
      title: "收件人列表",
      examples: [[
        {
          email: "user1@example.com",
          data: { name: "王小明", code: "ABC123" }
        },
        {
          email: "user2@company.com",
          data: { name: "李雅韻", code: "XYZ789" }
        }
      ]]
    }),
  from: emailSchema.optional()
    .describe("指定寄件人郵件（可選）")
    .meta({
      title: "寄件人郵件",
      examples: ["noreply@company.com", "system@service.org"]
    }),
  scheduledAt: z.string().datetime('排程時間格式不正確').optional()
    .describe("排程發送的時間（ISO 8601格式）")
    .meta({
      title: "排程發送時間",
      examples: ["2024-03-15T10:30:00Z", "2024-12-01T14:00:00+08:00"]
    })
}).describe("批量發送郵件的請求資料").meta({
  title: "批量郵件發送",
  examples: [{
    template: "welcome",
    subject: "歡迎加入我們！",
    recipients: [
      {
        email: "user1@example.com",
        data: { name: "王小明" }
      },
      {
        email: "user2@company.com",
        data: { name: "李雅韻" }
      }
    ],
    from: "noreply@company.com"
  }]
});

/**
 * 郵件地址驗證器
 */
export const validateEmailSchema = z.object({
  email: z.string().min(1, '電子郵件為必填項')
    .describe("需要驗證格式的郵件地址")
    .meta({
      title: "郵件地址",
      examples: ["test@example.com", "user.name@company.org", "check@domain.co.uk"]
    })
}).describe("驗證郵件地址格式的請求資料").meta({
  title: "郵件地址驗證",
  examples: [{
    email: "test@example.com"
  }]
});

/**
 * 郵件模板預覽驗證器
 */
export const previewEmailSchema = z.object({
  template: z.enum(['welcome', 'verification', 'password-reset', 'contact', 'marathon', 'custom'])
    .describe("要預覽的郵件模板類型")
    .meta({
      title: "郵件模板",
      examples: ['welcome', 'verification', 'password-reset'],
      enumDescriptions: {
        "welcome": "歡迎郵件模板",
        "verification": "驗證郵件模板",
        "password-reset": "密碼重設模板",
        "contact": "聯絡郵件模板",
        "marathon": "馬拉松模板",
        "custom": "自定義模板"
      }
    }),
  data: z.record(z.string(), z.any()).refine((data) => {
    return Object.keys(data).length > 0;
  }, {
    message: '模板數據不能為空'
  })
    .describe("模板預覽所需的動態數據")
    .meta({
      title: "模板預覽數據",
      examples: [{
        userName: "王小明",
        verificationLink: "https://example.com/verify?token=preview123",
        companyName: "某某科技"
      }]
    })
}).describe("預覽郵件模板的請求資料").meta({
  title: "郵件模板預覽",
  examples: [{
    template: "welcome",
    data: {
      userName: "王小明",
      companyName: "某某科技"
    }
  }]
});

/**
 * 郵件統計查詢驗證器
 */
export const emailStatsQuerySchema = z.object({
  startDate: z.string().datetime('開始時間格式不正確').optional()
    .describe("統計查詢的開始時間（ISO 8601格式）")
    .meta({
      title: "開始時間",
      examples: ["2024-01-01T00:00:00Z", "2024-03-15T09:00:00+08:00"]
    }),
  endDate: z.string().datetime('結束時間格式不正確').optional()
    .describe("統計查詢的結束時間（ISO 8601格式）")
    .meta({
      title: "結束時間",
      examples: ["2024-12-31T23:59:59Z", "2024-06-30T18:00:00+08:00"]
    })
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) <= new Date(data.endDate);
  }
  return true;
}, {
  message: '開始時間不能晚於結束時間'
}).describe("查詢郵件發送統計的時間範圍參數").meta({
  title: "郵件統計查詢",
  examples: [{
    startDate: "2024-01-01T00:00:00Z",
    endDate: "2024-01-31T23:59:59Z"
  }]
});

/**
 * 常用郵件類型的預設驗證器
 */
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