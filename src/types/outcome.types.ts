/**
 * Outcome Type Definitions
 * 成果相關型別定義
 */

// 直接使用 Prisma 生成的類型
export type { 
  outcome,
  post
} from '../../generated/prisma';

// 成果 API 相關類型
export interface OutcomeCreateRequest {
  week: number;
  title: string;
  date: string;
  content: string;
  imgUrls?: string[];
  videoUrls?: string[];
  visibility?: 'private' | 'public';
}

export interface OutcomeUpdateRequest extends Partial<OutcomeCreateRequest> {}

export interface OutcomeResponse {
  id: number;
  week: number;
  title: string;
  content: string;
  date: string;
  imgUrls?: string[];
  videoUrls?: string[];
  visibility: string;
}

export interface OutcomeQueryParams {
  projectId: string;
  page?: number;
  pageSize?: number;
  visibility?: 'private' | 'public';
  week?: number;
}

export interface OutcomeServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 分頁成果回應
export interface PaginatedOutcomesResponse {
  data: OutcomeResponse[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

// 分頁成果服務回應 - 扁平化結構
export interface PaginatedOutcomesServiceResult {
  success: boolean;
  data: OutcomeResponse[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  error?: string;
  message?: string;
}

// 成果驗證相關類型
export interface OutcomeValidationError {
  field: string;
  message: string;
}

// 成果統計類型
export interface OutcomeStats {
  total: number;
  public: number;
  private: number;
  withImages: number;
  withVideos: number;
  byWeek: Record<number, number>;
}