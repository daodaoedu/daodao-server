/**
 * 認證控制器
 * 處理用戶認證相關的請求
 */

import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { jwtService } from '../services/jwt-service';
import { emailService } from '../services/auth/email.service';
import { permissionService } from '../services/auth/permission.service';
import { User, Contact, TempUser } from '../models/index';
import { Op } from 'sequelize';
import { 
  LoginRequest,
  RegisterRequest,
  PasswordResetRequest,
  PasswordResetConfirm,
  EmailVerification,
  AuthResponse
} from '../types/auth.types';
import { 
  BadRequestError, 
  UnauthorizedError, 
  NotFoundError,
  ConflictError 
} from '../utils/error-handler';
import { asyncWrapper } from '../utils/error-handler';

/**
 * 用戶登入
 * POST /api/auth/login
 */
export const login = asyncWrapper(async (req: Request, res: Response) => {
  const { email, password } = req.body as LoginRequest;

  // 查找用戶
  const contact = await Contact.findOne({
    where: { email },
    include: [{
      model: User,
      required: true
    }]
  });

  if (!contact) {
    throw new UnauthorizedError('電子郵件或密碼錯誤');
  }

  // 使用類型斷言來訪問關聯的用戶
  const user = (contact as Contact & { User: User }).User;
  if (!user) {
    throw new UnauthorizedError('電子郵件或密碼錯誤');
  }

  // 驗證密碼
  const isPasswordValid = await bcrypt.compare(password, user.password_hash || '');
  if (!isPasswordValid) {
    throw new UnauthorizedError('電子郵件或密碼錯誤');
  }

  // 檢查帳號是否啟用
  if (!user.is_active) {
    throw new UnauthorizedError('帳號已被停用');
  }

  // 獲取用戶角色和權限
  const userRoles = await permissionService.getUserRoles(user.id);
  const userPermissions = await permissionService.getUserPermissions(user.id);

  // 生成 JWT token
  const tokenPayload = {
    id: user.id,
    email: contact.email,
    username: user.username,
    isTemp: false,
    roles: userRoles.map(role => role.name),
    permissions: userPermissions.map(permission => `${permission.resource}:${permission.action}`)
  };

  const token = jwtService.generateToken(tokenPayload);

  // 更新最後登入時間
  await user.update({ last_login_at: new Date() });

  const response: AuthResponse = {
    success: true,
    message: '登入成功',
    token,
    user: {
      id: user.id,
      username: user.username,
      email: contact.email,
      name: user.name,
      photo_url: user.photo_url,
      is_active: user.is_active
    },
    isTemporary: false
  };

  res.json(response);
});

/**
 * 用戶註冊
 * POST /api/auth/register
 */
export const register = asyncWrapper(async (req: Request, res: Response) => {
  const { username, email, password, confirmPassword, name } = req.body as RegisterRequest;

  // 確認密碼
  if (password !== confirmPassword) {
    throw new BadRequestError('密碼確認不符');
  }

  // 檢查電子郵件是否已存在
  const existingContact = await Contact.findOne({ where: { email } });
  if (existingContact) {
    throw new ConflictError('此電子郵件已被註冊');
  }

  // 檢查用戶名是否已存在
  const existingUser = await User.findOne({ where: { username } });
  if (existingUser) {
    throw new ConflictError('此用戶名已被使用');
  }

  // 密碼加密
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // 生成外部 ID
  const externalId = uuidv4();

  // 開始資料庫交易
  const transaction = await User.sequelize?.transaction();
  
  try {
    // 建立用戶
    const user = await User.create({
      external_id: externalId,
      username,
      password_hash: hashedPassword,
      name: name || username,
      is_active: true,
      email_verified: false,
      created_at: new Date(),
      updated_at: new Date()
    }, { transaction });

    // 建立聯絡資訊
    await Contact.create({
      user_id: user.id,
      email,
      created_at: new Date(),
      updated_at: new Date()
    }, { transaction });

    await transaction?.commit();

    // 生成驗證令牌並發送驗證郵件
    const verificationToken = jwtService.generateToken({
      id: user.id,
      email,
      type: 'email_verification'
    });

    // 發送驗證郵件
    await emailService.sendVerificationEmail(email, verificationToken);

    const response: AuthResponse = {
      success: true,
      message: '註冊成功，請檢查您的電子郵件進行驗證',
      user: {
        id: user.id,
        username: user.username,
        email,
        name: user.name,
        is_active: user.is_active
      },
      isTemporary: false
    };

    res.status(201).json(response);
  } catch (error) {
    await transaction?.rollback();
    throw error;
  }
});

/**
 * Google OAuth 成功回調
 * GET /api/auth/google/callback
 */
export const googleCallback = asyncWrapper(async (req: Request, res: Response) => {
  const user = req.user;
  
  if (!user) {
    throw new UnauthorizedError('Google 認證失敗');
  }

  // 判斷是正式用戶還是臨時用戶
  // 檢查是否有 dataValues 屬性 (Sequelize 模型才有)
  const isTemporary = !(user as { dataValues?: unknown }).dataValues;
  
  let tokenPayload;
  let redirectUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  if (isTemporary) {
    // 臨時用戶
    const tempUser = user as { id: number; email: string; name: string };
    tokenPayload = {
      id: tempUser.id,
      email: tempUser.email,
      name: tempUser.name,
      isTemp: true,
      roles: [],
      permissions: []
    };
    redirectUrl += '/onboarding'; // 導向到註冊完成頁面
  } else {
    // 正式用戶
    const formalUser = user as { id: number; email?: string; username?: string };
    const contact = await Contact.findOne({ where: { user_id: formalUser.id } });
    tokenPayload = {
      id: formalUser.id,
      email: contact?.email || formalUser.email,
      username: formalUser.username,
      isTemp: false,
      roles: [], // TODO: 從資料庫獲取角色
      permissions: [] // TODO: 從資料庫獲取權限
    };
    redirectUrl += '/dashboard';
  }

  const token = jwtService.generateToken(tokenPayload);

  // 重定向到前端，並帶上 token
  res.redirect(`${redirectUrl}?token=${token}&temporary=${isTemporary}`);
});

/**
 * 登出
 * POST /api/auth/logout
 */
export const logout = asyncWrapper(async (req: Request, res: Response) => {
  // JWT 是無狀態的，客戶端只需要刪除本地 token
  // 如果需要服務端登出，可以實現 token 黑名單機制
  
  const response: AuthResponse = {
    success: true,
    message: '登出成功'
  };

  res.json(response);
});

/**
 * 刷新 token
 * POST /api/auth/refresh
 */
export const refreshToken = asyncWrapper(async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const currentToken = authHeader && authHeader.split(' ')[1];

  if (!currentToken) {
    throw new UnauthorizedError('缺少認證令牌');
  }

  const newToken = jwtService.refreshToken(currentToken);
  
  if (!newToken) {
    throw new UnauthorizedError('令牌刷新失敗');
  }

  const response: AuthResponse = {
    success: true,
    message: '令牌刷新成功',
    token: newToken
  };

  res.json(response);
});

/**
 * 獲取當前用戶資訊
 * GET /api/auth/me
 */
export const getCurrentUser = asyncWrapper(async (req: Request, res: Response) => {
  // 從 JWT 中獲取用戶信息
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    throw new UnauthorizedError('缺少認證令牌');
  }
  
  const decoded = jwtService.verifyToken(token);
  if (decoded.error) {
    throw new UnauthorizedError('無效的認證令牌');
  }
  
  const userId = decoded.id;
  const isTemporary = decoded.isTemp || false;
  
  if (!userId) {
    throw new UnauthorizedError('未找到用戶資訊');
  }

  let user;
  let contact;

  if (isTemporary) {
    // 臨時用戶
    user = await TempUser.findByPk(userId);
    if (!user) {
      throw new NotFoundError('臨時用戶不存在');
    }
  } else {
    // 正式用戶
    user = await User.findByPk(userId);
    contact = await Contact.findOne({ where: { user_id: userId } });
    
    if (!user) {
      throw new NotFoundError('用戶不存在');
    }
  }

  const response: AuthResponse = {
    success: true,
    message: '獲取用戶資訊成功',
    user: {
      id: user.id,
      username: isTemporary ? undefined : (user as User).username,
      email: contact?.email || user.email,
      name: user.name,
      photo_url: user.photo_url,
      is_active: isTemporary ? true : (user as User).is_active
    },
    isTemporary
  };

  res.json(response);
});

/**
 * 請求密碼重設
 * POST /api/auth/forgot-password
 */
export const forgotPassword = asyncWrapper(async (req: Request, res: Response) => {
  const { email } = req.body as PasswordResetRequest;

  const contact = await Contact.findOne({
    where: { email },
    include: [{ model: User, as: 'user', required: true }]
  });

  if (!contact || !contact.user) {
    // 為了安全性，即使用戶不存在也返回成功訊息
    const response: AuthResponse = {
      success: true,
      message: '如果該電子郵件已註冊，您將收到密碼重設連結'
    };
    res.json(response);
    return;
  }

  // 生成重設令牌
  const resetToken = uuidv4();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1小時後過期

  // 儲存重設令牌
  await (contact.user as { update: (data: { password_reset_token: string; password_reset_expires: Date }) => Promise<unknown> }).update({
    password_reset_token: resetToken,
    password_reset_expires: expiresAt
  });

  // 發送密碼重設郵件
  await emailService.sendPasswordResetEmail(contact.email, resetToken);

  const response: AuthResponse = {
    success: true,
    message: '密碼重設連結已發送到您的電子郵箱'
  };

  res.json(response);
});

/**
 * 確認密碼重設
 * POST /api/auth/reset-password
 */
export const resetPassword = asyncWrapper(async (req: Request, res: Response) => {
  const { token, newPassword, confirmPassword } = req.body as PasswordResetConfirm;

  if (newPassword !== confirmPassword) {
    throw new BadRequestError('密碼確認不符');
  }

  const user = await User.findOne({
    where: {
      password_reset_token: token,
      password_reset_expires: {
        [Op.gt]: new Date()
      }
    }
  });

  if (!user) {
    throw new BadRequestError('無效或已過期的重設令牌');
  }

  // 加密新密碼
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

  // 更新密碼並清除重設令牌
  await user.update({
    password_hash: hashedPassword,
    password_reset_token: undefined,
    password_reset_expires: undefined,
    updated_at: new Date()
  });

  const response: AuthResponse = {
    success: true,
    message: '密碼重設成功'
  };

  res.json(response);
});

/**
 * 驗證電子郵件
 * POST /api/auth/verify-email
 */
export const verifyEmail = asyncWrapper(async (req: Request, res: Response) => {
  const { token, email } = req.body as EmailVerification;

  if (!token) {
    throw new BadRequestError('驗證令牌為必填項');
  }

  // 驗證令牌
  const decoded = jwtService.verifyToken(token);
  
  if (decoded.error) {
    throw new BadRequestError('無效或已過期的驗證令牌');
  }

  // 檢查令牌類型
  if (decoded.type !== 'email_verification') {
    throw new BadRequestError('無效的驗證令牌類型');
  }

  // 查找用戶
  const contact = await Contact.findOne({
    where: { email: email || decoded.email },
    include: [{ model: User, as: 'user', required: true }]
  });

  if (!contact || !contact.user) {
    throw new NotFoundError('找不到對應的用戶');
  }

  // 檢查用戶ID是否匹配
  if ((contact.user as { id: number }).id !== decoded.id) {
    throw new UnauthorizedError('驗證令牌與用戶不匹配');
  }

  // 檢查是否已經驗證過
  if ((contact.user as { email_verified: boolean }).email_verified) {
    throw new BadRequestError('電子郵件已經驗證過了');
  }

  // 更新用戶驗證狀態
  await (contact.user as { update: (data: { email_verified: boolean; email_verified_at: Date }) => Promise<unknown> }).update({
    email_verified: true,
    email_verified_at: new Date()
  });

  // 發送歡迎郵件
  await emailService.sendWelcomeEmail(contact.email, (contact.user as { name?: string }).name || 'User');

  const response: AuthResponse = {
    success: true,
    message: '電子郵件驗證成功，歡迎加入島島阿學！'
  };

  res.json(response);
});

export const authController = {
  login,
  register,
  googleCallback,
  logout,
  refreshToken,
  getCurrentUser,
  forgotPassword,
  resetPassword,
  verifyEmail
};

export default authController;