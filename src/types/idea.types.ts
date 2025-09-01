export interface IdeaEntity {
  id: string; // external_id UUID 格式
  content: string;
  user: UserBasicInfo;
  tags: string[];
  likeCount: number;
  commentCount: number;
  viewCount: number;
  shareCount: number;
  hasResources: boolean;
  resourceCount: number;
  isLiked?: boolean;
  isFavorited?: boolean;
  status: IdeaStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface UserBasicInfo {
  id: string; // user external_id UUID 格式
  name: string;
  photoUrl?: string;
  role?: string;
}

export type IdeaStatus = 'active' | 'draft' | 'archived';

export interface IdeaResource {
  id: string; // resource external_id UUID 格式
  name: string;
  url: string;
  description?: string;
  type?: string;
  cost?: string;
  level?: string;
  status: ResourceStatus;
  majorCategory?: string;
  subCategory?: string;
  relationshipType?: string;
  createdFromType?: 'idea';
  createdFromId?: string;
  createdAt: string;
  publishedAt?: string;
}

export type ResourceStatus = 'draft' | 'active' | 'archived';

// 從統一響應類型文件導入
import type { 
  ApiSuccessResponse, 
  ApiErrorResponse, 
  ApiResponse,
  PaginationInfo
} from './api-response.types';

// 事件相關型別
export interface EventResponse {
  success: boolean;
  message: string;
  data?: unknown;
}

// 點讚回應型別
export interface LikeResponse {
  isLiked: boolean;
  likeCount: number;
}

export interface FavoriteResponse {
  isFavorited: boolean;
}

// 評論相關型別（基於現有 Comments 服務）
export interface CommentEntity {
  id: number;
  content: string;
  visibility: 'public' | 'private';
  parentId: number | null;
  user: UserBasicInfo;
  createdAt: string;
  updatedAt: string;
  replies: CommentEntity[];
}

export interface CreateCommentRequest {
  targetType: 'idea';
  targetId: string; // idea external_id
  content: string;
  visibility: 'public' | 'private';
  parentId?: number | null;
}

export interface UpdateCommentRequest {
  id: number;
  content: string;
  visibility: 'public' | 'private';
}

// 創建想法回應型別
export interface CreateIdeaResponse {
  idea: IdeaEntity;
  resources?: IdeaResource[];
}

// 查詢過濾器型別
export interface IdeaFilters {
  query?: string;
  search?: string;
  tags?: string[];
  userId?: string;
  authorId?: string;
  status?: IdeaStatus | 'all';
  sort: 'createdAt' | 'updatedAt' | 'likeCount';
  order: 'asc' | 'desc';
}

// 資料庫查詢結果型別
export interface IdeaQueryResult {
  ideas: IdeaEntity[];
  pagination: PaginationInfo;
}

// 統計數據型別
export interface IdeaStats {
  likeCount: number;
  commentCount: number;
  viewCount: number;
  shareCount: number;
  resourceCount: number;
  hasResources: boolean;
}

// 互動狀態型別
export interface InteractionStatus {
  isLiked: boolean;
  isFavorited: boolean;
}