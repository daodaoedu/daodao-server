/**
 * 郵件控制器
 * 處理郵件發送相關的 API 請求
 */

import { Request, Response } from 'express';
import { emailService } from '../services/auth/email.service';
import { jwtService } from '../services/jwt-service';
import { User } from '../models/user.model';
import { Contact } from '../models/contact.model';
import { asyncWrapper } from '../utils/error-handler';
import { BadRequestError, NotFoundError } from '../utils/error-handler';
import type { 
  ContactEmailOptions 
} from '../types/email.types';

/**
 * 發送聯絡郵件
 * POST /api/email/contact
 */
export const sendContactEmail = asyncWrapper(async (req: Request, res: Response) => {
  const { 
    from, 
    to, 
    subject, 
    text, 
    information, 
    name, 
    title, 
    activityTitle 
  } = req.body;

  // 驗證必填欄位
  if (!from || !to || !subject || !text || !name) {
    throw new BadRequestError('缺少必要的郵件資訊');
  }

  // 構建聯絡郵件選項
  const contactOptions: ContactEmailOptions = {
    from,
    to,
    subject: title || subject,
    name,
    message: text,
    userInfo: information,
    activityTitle,
    data: {
      name,
      message: text,
      userInfo: information,
      activityTitle
    }
  };

  // 發送郵件
  const result = await emailService.sendContactEmail(contactOptions);

  if (result) {
    res.json({
      success: true,
      message: '郵件發送成功'
    });
  } else {
    res.status(500).json({
      success: false,
      message: '郵件發送失敗'
    });
  }
});

/**
 * 發送驗證郵件
 * POST /api/email/verification
 */
export const sendVerificationEmail = asyncWrapper(async (req: Request, res: Response) => {
  const { email, userId } = req.body;

  if (!email) {
    throw new BadRequestError('電子郵件為必填項');
  }

  // 查找用戶
  const user = await User.findByPk(userId);
  if (!user) {
    throw new NotFoundError('找不到用戶');
  }

  // 生成驗證令牌
  const verificationToken = jwtService.generateToken({
    id: user.id,
    email,
    type: 'email_verification'
  });

  // 發送驗證郵件
  const result = await emailService.sendVerificationEmail(email, verificationToken);

  if (result) {
    res.json({
      success: true,
      message: '驗證郵件發送成功'
    });
  } else {
    res.status(500).json({
      success: false,
      message: '驗證郵件發送失敗'
    });
  }
});

/**
 * 發送歡迎郵件
 * POST /api/email/welcome
 */
export const sendWelcomeEmail = asyncWrapper(async (req: Request, res: Response) => {
  const { email, name } = req.body;

  if (!email || !name) {
    throw new BadRequestError('電子郵件和姓名為必填項');
  }

  // 發送歡迎郵件
  const result = await emailService.sendWelcomeEmail(email, name);

  if (result) {
    res.json({
      success: true,
      message: '歡迎郵件發送成功'
    });
  } else {
    res.status(500).json({
      success: false,
      message: '歡迎郵件發送失敗'
    });
  }
});

/**
 * 發送密碼重設郵件
 * POST /api/email/password-reset
 */
export const sendPasswordResetEmail = asyncWrapper(async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    throw new BadRequestError('電子郵件為必填項');
  }

  // 查找用戶
  const contact = await Contact.findOne({
    where: { email },
    include: [{
      model: User,
      as: 'user',
      required: true
    }]
  });

  if (!contact?.user) {
    // 為安全起見，即使用戶不存在也返回成功訊息
    res.json({
      success: true,
      message: '如果該電子郵件已註冊，您將收到密碼重設郵件'
    });
    return;
  }

  // 生成重設令牌
  const resetToken = jwtService.generateToken({
    id: (contact.user as { id: number }).id,
    email,
    type: 'password_reset'
  });

  // 發送密碼重設郵件
  const result = await emailService.sendPasswordResetEmail(email, resetToken);

  if (result) {
    res.json({
      success: true,
      message: '密碼重設郵件發送成功'
    });
  } else {
    res.status(500).json({
      success: false,
      message: '密碼重設郵件發送失敗'
    });
  }
});

/**
 * 發送自定義郵件
 * POST /api/email/custom
 */
export const sendCustomEmail = asyncWrapper(async (req: Request, res: Response) => {
  const { to, subject, htmlContent } = req.body;

  if (!to || !subject || !htmlContent) {
    throw new BadRequestError('收件人、主旨和內容為必填項');
  }

  // 發送自定義郵件
  const result = await emailService.sendCustomEmail(to, subject, htmlContent);

  if (result) {
    res.json({
      success: true,
      message: '自定義郵件發送成功'
    });
  } else {
    res.status(500).json({
      success: false,
      message: '自定義郵件發送失敗'
    });
  }
});

/**
 * 驗證電子郵件 (兼容原始邏輯)
 * GET /api/email/verify (從URL參數獲取token)
 */
export const verifyEmail = asyncWrapper(async (req: Request, res: Response) => {
  // 支持從URL參數或請求體獲取token (兼容原始邏輯)
  const decodedQuery = decodeURIComponent(req.url);
  const tokenMatch = decodedQuery.match(/token=([^&]*)/);
  const urlToken = tokenMatch ? tokenMatch[1] : null;
  
  const token = urlToken || req.body.token;

  if (!token) {
    throw new BadRequestError('驗證令牌為必填項');
  }

  // 清理token (移除Bearer前綴，兼容原始邏輯)
  const cleanedToken = token.replace('Bearer', '').trim();
  
  // 驗證令牌
  const decoded = jwtService.verifyToken(cleanedToken);
  
  if (decoded.error) {
    throw new BadRequestError('無效或已過期的驗證令牌');
  }

  // 查找並更新用戶 (兼容原始_id邏輯)
  const userId = decoded._id || decoded.id;
  const user = await User.findOne({ where: { id: userId } });

  if (!user) {
    throw new NotFoundError('找不到對應的用戶');
  }

  // 更新用戶驗證狀態
  await user.update({
    email_verified: true,
    email_verified_at: new Date()
  });

  // 發送歡迎郵件
  if ((user as any).name) {
    const contact = await Contact.findOne({ where: { user_id: user.id } });
    if (contact) {
      await emailService.sendWelcomeEmail(contact.email, (user as any).name);
    }
  }

  // 重定向到前端 (兼容原始邏輯)
  const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?token=${token}&isVerified=true`;
  res.redirect(redirectUrl);
});

/**
 * 測試郵件發送
 * POST /api/email/test
 */
export const testEmail = asyncWrapper(async (req: Request, res: Response) => {
  const { to } = req.body;

  if (!to) {
    throw new BadRequestError('收件人為必填項');
  }

  const testHtml = `
    <h1>測試郵件</h1>
    <p>這是一封測試郵件，用來驗證郵件服務是否正常運作。</p>
    <p>發送時間：${new Date().toLocaleString('zh-TW')}</p>
  `;

  const result = await emailService.sendCustomEmail(
    to,
    '【島島阿學】郵件服務測試',
    testHtml
  );

  if (result) {
    res.json({
      success: true,
      message: '測試郵件發送成功'
    });
  } else {
    res.status(500).json({
      success: false,
      message: '測試郵件發送失敗'
    });
  }
});

// 導出所有控制器方法
export const emailController = {
  sendContactEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendCustomEmail,
  verifyEmail,
  testEmail
};

export default emailController;