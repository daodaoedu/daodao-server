import type { FeedbackItem, FaqCategory, FaqItem, CreateFaqInput, UpdateFaqInput } from '../types/admin-feedback.types'

const listFeedback = async (_filters: { status?: string; category?: string; limit: number; offset: number }): Promise<{ items: FeedbackItem[]; total: number }> => {
  return { items: [], total: 0 }
}

const updateFeedbackStatus = async (id: number, status: string, category?: string): Promise<{ updated: boolean }> => {
  return { updated: true }
}

const replyToFeedback = async (id: number, content: string): Promise<{ sent: boolean }> => {
  return { sent: true }
}

const listFaqCategories = async (): Promise<FaqCategory[]> => {
  return []
}

const createFaqCategory = async (name: string): Promise<FaqCategory> => {
  return { id: 1, name, sortOrder: 0 }
}

const listFaqItems = async (categoryId?: number): Promise<FaqItem[]> => {
  return []
}

const createFaqItem = async (input: CreateFaqInput): Promise<FaqItem> => {
  return { id: 1, categoryId: input.categoryId, question: input.question, answer: input.answer, isPublished: input.isPublished ?? false, sortOrder: 0, createdAt: new Date().toISOString() }
}

const updateFaqItem = async (id: number, input: UpdateFaqInput): Promise<FaqItem> => {
  return { id, categoryId: 1, question: input.question ?? '', answer: input.answer ?? '', isPublished: input.isPublished ?? false, sortOrder: 0, createdAt: new Date().toISOString() }
}

const deleteFaqItem = async (id: number): Promise<void> => {}

const reorderFaqItems = async (items: Array<{ id: number; sortOrder: number }>): Promise<{ updated: boolean }> => {
  return { updated: true }
}

const bulkPublishFaqItems = async (ids: number[], isPublished: boolean): Promise<{ updated: number }> => {
  return { updated: ids.length }
}

export default {
  listFeedback, updateFeedbackStatus, replyToFeedback,
  listFaqCategories, createFaqCategory, listFaqItems,
  createFaqItem, updateFaqItem, deleteFaqItem,
  reorderFaqItems, bulkPublishFaqItems,
}
