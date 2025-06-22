/**
 * 資料轉換相關的類型定義
 */

// 使用者資料結構
export interface UserData {
  id?: number | string;
  _id?: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  roleList?: string[];
  [key: string]: unknown;
}

// 分類資料結構
export interface CategoryData {
  id?: number | string;
  name?: string;
  [key: string]: unknown;
}

// 統計資料結構
export interface StatsData {
  view_count?: number;
  favorite_count?: number;
  share_count?: number;
  review_count?: number;
  like_count?: number;
  likes_count?: number;
  [key: string]: unknown;
}

// 標籤資料結構
export interface TagData {
  name: string;
  [key: string]: unknown;
}

// 類型守衛函數
export function isUserData(obj: unknown): obj is UserData {
  return obj !== null && typeof obj === 'object' && 'id' in obj;
}

export function isCategoryData(obj: unknown): obj is CategoryData {
  return obj !== null && typeof obj === 'object' && 'name' in obj;
}

export function isStatsData(obj: unknown): obj is StatsData {
  return obj !== null && typeof obj === 'object';
}

export function isTagData(obj: unknown): obj is TagData {
  return obj !== null && typeof obj === 'object' && 'name' in obj;
}