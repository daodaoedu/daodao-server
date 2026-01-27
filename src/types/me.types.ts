/**
 * Type definitions for /api/v1/me endpoints
 * Based on the existing codebase patterns and database schema
 */

// Practice response types (extending from existing practice.types.ts)
// 基於 Prisma schema practices 表
export interface MyPracticeItem {
  id: string;
  title: string;
  practiceAction?: string;
  startDate?: string; // YYYY-MM-DD format
  endDate?: string; // YYYY-MM-DD format
  durationDays?: number;
  frequencyMinDays?: number;
  frequencyMaxDays?: number;
  frequencyDescription?: string;
  sessionDurationMinutes?: number;
  practiceTimePeriods: string[];
  otherContext?: string;
  status: 'draft' | 'not_started' | 'active' | 'completed' | 'archived';
  hasResources: boolean;
  progressPercentage?: number;
  firstCheckinAt?: string;
  createdAt: string;
  updatedAt?: string;
  tags: string[];
}

export interface MyPracticesResponse {
  success: true;
  data: MyPracticeItem[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Practice stats response types
export interface PracticeStatsData {
  totalPractices: number;
  activePractices: number;
  completedPractices: number;
  archivedPractices: number;
  totalCheckIns: number;
  currentStreak: number;
  maxStreak: number;
  averageProgress: number;
  timeSpentToday: number; // in minutes
  timeSpentThisWeek: number;
  timeSpentThisMonth: number;
  practicesByCategory: Array<{
    category: string;
    count: number;
    avgProgress: number;
  }>;
  recentActivity: Array<{
    date: string; // YYYY-MM-DD
    checkInCount: number;
    timeSpent: number;
  }>;
  achievements: Array<{
    type: 'streak' | 'completion' | 'consistency';
    milestone: number;
    achievedAt: string;
    description: string;
  }>;
}

export interface MyPracticeStatsResponse {
  success: true;
  data: PracticeStatsData;
}

// Resource response types (for personal drafts)
export interface MyResourceItem {
  id: string; // Use external_id as string
  name: string;
  description?: string;
  url?: string;
  type: 'link' | 'file' | 'note' | 'draft';
  category?: string;
  status: 'draft' | 'published' | 'archived';
  tags: string[];
  createdAt: string;
  updatedAt?: string;
  fileSize?: number; // in bytes, for file types
  visibility: 'private' | 'public';
  metadata?: Record<string, unknown>; // flexible metadata storage
}

export interface MyResourcesResponse {
  success: true;
  data: MyResourceItem[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  stats: {
    totalResources: number;
    draftCount: number;
    publishedCount: number;
    byCategory: Record<string, number>;
  };
}

// Preferences response types
export interface PreferenceOption {
  id: number;
  value: string;
  name: string;
  description?: string;
}

export interface PreferenceType {
  id: number;
  name: string;
  value: string; // unique identifier
  description?: string;
  maxSelections?: number;
  options: PreferenceOption[];
}

export interface UserPreference {
  id: number;
  preferenceTypeId: number;
  optionId: number;
  isSelected: boolean;
  preferenceType: PreferenceType;
  option: PreferenceOption;
}

export interface MyPreferencesResponse {
  success: true;
  data: {
    preferences: UserPreference[];
    categories: Array<{
      type: PreferenceType;
      userSelections: Array<{
        optionId: number;
        isSelected: boolean;
      }>;
    }>;
  };
  stats: {
    totalPreferences: number;
    activeSelections: number;
    lastUpdated?: string;
  };
}

// Update preferences request/response
export interface UpdatePreferencesResponse {
  success: true;
  data: {
    updated: number;
    created: number;
    deleted: number;
  };
  message: string;
}

// Common error response
export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    details?: string;
  };
}

// API Response wrapper type
export type ApiResponse<T> = T | ErrorResponse;