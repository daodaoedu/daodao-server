/**
 * Note Type Definitions
 * 便利貼相關型別定義
 */

// 直接使用 Prisma 生成的類型
export type { 
  note,
  post,
  users
} from '../../generated/prisma';

import type { UserBasicInfo } from './common.types';

// 便利貼 API 相關類型
export interface NoteCreateRequest {
  week: number;
  title: string;
  date: string;
  content: string;
  imgUrls?: string[];
  videoUrls?: string[];
  visibility?: 'private' | 'public';
}

export interface NoteUpdateRequest extends Partial<NoteCreateRequest> {}

export interface NoteResponse {
  id: number;
  week: number;
  title: string;
  content: string;
  date: string;
  imgUrls?: string[];
  videoUrls?: string[];
  visibility: string;
  user?: UserBasicInfo | null;
}

export interface NoteQueryParams {
  projectId: string;
  page?: number;
  pageSize?: number;
  visibility?: 'private' | 'public';
  week?: number;
}

export interface NoteServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 分頁便利貼回應 - 直接符合原本 JS 結構
export interface PaginatedNotesResponse {
  data: NoteResponse[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

// 分頁便利貼服務回應 - 扁平化結構，符合原本 JS 的返回格式
export interface PaginatedNotesServiceResult {
  success: boolean;
  data: NoteResponse[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  error?: string;
  message?: string;
}

// 便利貼驗證相關類型
export interface NoteValidationError {
  field: string;
  message: string;
}

// 便利貼統計類型
export interface NoteStats {
  total: number;
  public: number;
  private: number;
  withImages: number;
  withVideos: number;
}