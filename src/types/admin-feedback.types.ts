export interface FeedbackItem {
  id: number
  /** 使用者被刪除時 feedback.user_id 為 null（ON DELETE SET NULL） */
  userId: number | null
  /** users.nickname；未設暱稱或使用者已刪除時為 null */
  userName: string | null
  /** 回報者帳號 email（contacts.email）；沒有或使用者已刪除時為 null（daodao#451） */
  userEmail: string | null
  content: string
  category: 'bug' | 'feature' | 'question' | 'other'
  status: 'pending' | 'replied' | 'closed'
  createdAt: string
  /** 最後一則 feedback_replies 的時間；尚未回覆為 null */
  repliedAt: string | null
  /** 錯誤回報附的截圖（feedback.meta.screenshots 中的 http(s) 網址）；沒有截圖為空陣列 */
  screenshots: string[]
  /** 錯誤回報表單附的處理資訊（feedback.meta）；不是錯誤回報表單來的回饋為 null（daodao#451 AC-03） */
  bugReport: {
    area: string | null
    link: string | null
    /** 送出回報時所在頁面 */
    referrer: string | null
    userAgent: string | null
  } | null
  /** 後台送出的回覆（feedback_replies），依時間由舊到新；沒有回覆為空陣列 */
  replies: FeedbackReply[]
}

export interface FeedbackReply {
  id: number
  content: string
  createdAt: string
  /** 回覆信寄送結果（email_logs）；本功能上線前的回覆沒有紀錄為 null（daodao#451 AC-02） */
  emailStatus: FeedbackReplyEmailStatus | null
}

export type FeedbackReplyEmailStatus = 'pending' | 'sent' | 'failed' | 'skipped'

/** POST /admin/feedback/:id/reply 的回應（daodao#451） */
export interface FeedbackReplyResult {
  replyId: number
  /**
   * sent＝已寄出；failed＝寄送失敗；no_recipient＝回報者已刪除或沒有聯絡信箱；
   * not_applicable＝不是錯誤回報表單來的回饋，回覆只記在後台、不寄信也不通知
   */
  emailStatus: 'sent' | 'failed' | 'no_recipient' | 'not_applicable'
}

export interface FeedbackListResult {
  items: FeedbackItem[]
  /** 符合篩選條件的筆數 */
  total: number
  /** 全部回饋的統計（不受篩選影響） */
  stats: {
    total: number
    pending: number
    /** 本月（台灣時間）新增 */
    thisMonth: number
  }
}

export interface FeedbackReplyInput {
  content: string
}

export interface FaqCategory {
  id: number
  name: string
  sortOrder: number
}

export interface FaqItem {
  id: number
  categoryId: number
  question: string
  answer: string
  isPublished: boolean
  sortOrder: number
  createdAt: string
}

export interface CreateFaqInput {
  categoryId: number
  question: string
  answer: string
  isPublished?: boolean
}

export interface UpdateFaqInput {
  question?: string
  answer?: string
  isPublished?: boolean
}
