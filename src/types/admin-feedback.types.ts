export interface FeedbackItem {
  id: number
  /** 使用者被刪除時 feedback.user_id 為 null（ON DELETE SET NULL） */
  userId: number | null
  /** users.nickname；未設暱稱或使用者已刪除時為 null */
  userName: string | null
  content: string
  category: 'bug' | 'feature' | 'question' | 'other'
  status: 'pending' | 'replied' | 'closed'
  createdAt: string
  /** 最後一則 feedback_replies 的時間；尚未回覆為 null */
  repliedAt: string | null
  /** 錯誤回報附的截圖（feedback.meta.screenshots 中的 http(s) 網址）；沒有截圖為空陣列 */
  screenshots: string[]
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
