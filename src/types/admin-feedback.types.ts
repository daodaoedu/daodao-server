export interface FeedbackItem {
  id: number
  userId: number
  userName: string | null
  content: string
  category: 'bug' | 'feature' | 'question' | 'other'
  status: 'pending' | 'replied' | 'closed'
  createdAt: string
  repliedAt: string | null
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
