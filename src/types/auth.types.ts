/**
 * 認證相關型別定義
 */

import { Request } from 'express';
import { users, temp_users } from '../../generated/prisma';
import type { WelcomeEmailData } from './email';

// JWT Payload 介面
export interface JwtPayload {
  id: number;
  username?: string;
  email?: string;
  isTemp?: boolean;
  roles?: string[];
  permissions?: string[];
  [key: string]: unknown;
}

// JWT 驗證結果介面
export interface JwtVerifyResult {
  error?: string;
  id?: number;
  username?: string;
  email?: string;
  isTemp?: boolean;
  roles?: string[];
  permissions?: string[];
  [key: string]: unknown;
}

// 用戶介面（正式用戶） - Using Prisma generated types
export type User = users;

// 臨時用戶介面 - Using Prisma generated types
export type TempUser = temp_users;

// Union type for any user
export type AnyUser = User | TempUser;

// 聯絡資訊介面
export interface Contact {
  id: number;
  user_id: number;
  email: string;
  phone?: string;
  address?: string;
  created_at: Date;
  updated_at: Date;
  user?: User;
}

// 角色介面
export interface Role {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// 權限介面
export interface Permission {
  id: number;
  name: string;
  resource: string;
  action: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

// 角色權限關聯介面
export interface RolePermission {
  id: number;
  role_id: number;
  permission_id: number;
  created_at: Date;
  updated_at: Date;
}

// 用戶角色關聯介面（如果需要）
export interface UserRole {
  id: number;
  user_id: number;
  role_id: number;
  created_at: Date;
  updated_at: Date;
}

// JWT Payload 用戶介面 - 與 User 接口兼容
export interface UserJwtPayload extends Partial<User> {
  id: number;
  _id?: string;
  username?: string;
  email?: string;
  isTemp?: boolean;
  roles?: string[];
  permissions?: string[];
  email_verified?: boolean | null;
  email_verified_at?: Date | null;
  is_active?: boolean | null;
  [key: string]: unknown;
}

// 認證請求介面 - 統一使用 UserJwtPayload
export interface AuthRequest extends Omit<Request, 'user'> {
  user?: UserJwtPayload;
  isTemporary?: boolean;
}

// AuthenticatedRequest 現在使用 Express/Passport 的標準類型定義

// 登入請求資料介面
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// 註冊請求資料介面
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  name?: string;
}

// 密碼重設請求介面
export interface PasswordResetRequest {
  email: string;
}

// 密碼重設確認介面
export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

// 郵件驗證介面
export interface EmailVerification {
  token: string;
  email: string;
}

// OAuth 使用者資料介面
export interface OAuthProfile {
  id: string;
  email: string;
  name: string;
  photoUrl?: string;
  provider: 'google' | 'facebook' | 'github';
}

// 認證回應介面
export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: Partial<User | TempUser> & {
    roles?: string[];
    permissions?: string[];
    email_verified?: boolean | null;
    email_verified_at?: Date | null;
    is_active?: boolean | null;
  };
  isTemporary?: boolean;
  redirectUrl?: string;
}

// 權限檢查選項介面
export interface PermissionOptions {
  resource: string;
  action: string;
  allowTemp?: boolean; // 是否允許臨時用戶
}

// Session 資料介面
export interface SessionData {
  id: string;
  type: 'user' | 'temp';
}

// 認證中間件選項介面
export interface AuthMiddlewareOptions {
  required?: boolean; // 是否必須認證
  allowTemp?: boolean; // 是否允許臨時用戶
  permissions?: PermissionOptions[]; // 需要的權限
  roles?: string[]; // 需要的角色
}

// Google OAuth 設定介面
export interface GoogleOAuthConfig {
  clientID: string;
  clientSecret: string;
  callbackURL: string;
}

// 認證服務介面
export interface AuthService {
  generateToken(payload: JwtPayload): string;
  verifyToken(token: string): JwtVerifyResult;
  refreshToken(token: string): string | null;
  hashPassword(password: string): Promise<string>;
  comparePassword(password: string, hash: string): Promise<boolean>;
}

// 郵件服務介面
export interface EmailService {
  sendVerificationEmail(email: string, token: string): Promise<boolean>;
  sendPasswordResetEmail(email: string, token: string): Promise<boolean>;
  sendWelcomeEmail(email: string, data: WelcomeEmailData): Promise<boolean>;
}

// 所有型別都已作為具名導出，不需要預設導出