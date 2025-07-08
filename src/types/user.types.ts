/**
 * 用戶管理相關型別定義
 */

import type { users } from '../../generated/prisma';

// 分頁查詢參數介面
export interface UserQueryParams {
  page?: string | number;
  pageSize?: string | number;
  educationStage?: string;
  roleList?: string;
  location?: string;
  search?: string;
}

// 用戶創建請求介面
export interface CreateUserRequest {
  gender?: string;
  birthDate?: Date | string;
  contactList?: {
    instagram?: string;
    discord?: string;
    line?: string;
    facebook?: string;
  };
  educationStage?: string;
  isOpenLocation?: boolean;
  isOpenProfile?: boolean;
  isSubscribeEmail?: boolean;
  location?: string; // area code
  roleList?: string[];
  selfIntroduction?: string;
  share?: string | string[];
  wantToDoList?: string[];
  tagList?: string[];
  interestList?: string[];
  isSendEmail?: boolean;
}

// 用戶更新請求介面
export interface UpdateUserRequest {
  name?: string;
  email?: string;
  photoUrl?: string;
  gender?: string;
  birthDate?: Date | string;
  contactList?: {
    instagram?: string;
    discord?: string;
    line?: string;
    facebook?: string;
  };
  educationStage?: string;
  isOpenLocation?: boolean;
  isOpenProfile?: boolean;
  isSubscribeEmail?: boolean;
  selfIntroduction?: string;
  share?: string | string[];
  wantToDoList?: string[];
  tagList?: string[];
  roleList?: string[];
  interestList?: string[];
}

// 格式化後的用戶回應介面
export interface FormattedUserResponse {
  id: number;
  _id: string; // external_id
  name?: string; // nickname
  gender?: string;
  email?: string;
  photoURL?: string;
  birthDay?: Date | string;
  isOpenLocation?: boolean;
  isOpenProfile?: boolean;
  role?: number;
  location?: string;
  tagList?: string[];
  wantToDoList?: string[];
  educationStage?: string;
  selfIntroduction?: string;
  share?: string | string[];
  contactList?: {
    email?: string;
    photoUrl?: string;
    isSubscribeEmail?: boolean;
    instagram?: string;
    discord?: string;
    line?: string;
    facebook?: string;
  };
  basicInfo?: {
    selfIntroduction?: string;
    shareList?: string | string[];
    wantToDoList?: string[];
  };
  roleList?: string[];
  createdDate?: string;
  updatedDate?: string;
}

// 用戶完整度計算配置介面
export interface CompletenessWeights {
  self_introduction: { base: number; levels: number[] };
  share_list: { base: number; levels: number[] };
  tag_list: { tagWeight: number; maxScore: number };
  contact: number;
  location: number;
  positions: number;
}

// 用戶完整度計算結果
export interface UserWithCompleteness {
  user: users;
  completenessScore: number;
}

// 分頁回應介面
export interface PaginatedUsersResponse {
  data: FormattedUserResponse[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

// API 回應介面
export interface UserResponse {
  data: FormattedUserResponse | FormattedUserResponse[] | null;
  message?: string;
  error?: boolean;
  details?: string;
}

// 用戶服務介面
export interface UserService {
  getAllUsers(params: UserQueryParams): Promise<PaginatedUsersResponse>;
  getMe(userId: string): Promise<FormattedUserResponse | null>;
  getOneUser(externalId: string): Promise<FormattedUserResponse | null>;
  createUser(userData: CreateUserRequest, tempUserId: string): Promise<{ user: FormattedUserResponse; token: string }>;
  updateUser(externalId: string, userData: UpdateUserRequest): Promise<FormattedUserResponse>;
  deleteMe(externalId: string): Promise<void>;
  deleteUser(userId: number): Promise<void>;
}

// 關聯模型型別 (基於現有的 JavaScript 模型結構)
export interface UserWithAssociations extends users {
  Role?: {
    id: number;
    name: string;
  };
  Location?: {
    City?: {
      name: string;
    };
    Country?: {
      name: string;
    };
  };
  Contact?: {
    id: number;
    email?: string;
    photo_url?: string;
    is_subscribe_email?: boolean;
    ig?: string;
    discord?: string;
    line?: string;
    fb?: string;
  };
  BasicInfo?: {
    id: number;
    self_introduction?: string;
    share_list?: string | string[];
    want_to_do_list?: string[];
  };
  Positions?: Array<{
    id: number;
    name: string;
  }>;
}

// 錯誤型別
export interface UserError {
  error: boolean;
  message: string;
  details?: string;
}

// 型別匯出不需要 default export 物件