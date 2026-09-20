/**
 * verify-email（POST／GET）handler 層：驗證成功才寄歡迎信，且只寄一次
 * Regression for #218：歡迎信改為驗證後直接寄，不再經 onboarding-email queue
 */
import type { Request, Response, NextFunction } from 'express';

const mockSendWelcomeEmailInBackground = jest.fn();
const mockVerifyToken = jest.fn();
const mockFindUserByExternalId = jest.fn();
const mockVerifyUserEmail = jest.fn();

jest.mock('@/services/email/welcome-email.service', () => ({
  sendWelcomeEmailInBackground: (...args: unknown[]) => mockSendWelcomeEmailInBackground(...args),
  sendWelcomeEmailToUser: jest.fn(),
}));
jest.mock('@/services/jwt.service', () => ({
  jwtService: { verifyToken: (...args: unknown[]) => mockVerifyToken(...args) },
}));
jest.mock('@/services/auth/auth.service', () => ({
  authService: {
    findUserByExternalId: (...args: unknown[]) => mockFindUserByExternalId(...args),
    verifyUserEmail: (...args: unknown[]) => mockVerifyUserEmail(...args),
  },
}));
jest.mock('@/services/email/email.service', () => ({ emailService: {} }));
jest.mock('@/services/persona.service', () => ({ personaService: {} }));
jest.mock('@/services/quiz.service', () => ({ quizService: {} }));
jest.mock('@/services/auth/apple-auth.service', () => ({ appleAuthService: {} }));
jest.mock('@/services/auth/oauth-nonce.service', () => ({ oauthNonceService: {} }));
jest.mock('@/services/auth/auth-code.service', () => ({ authCodeService: {} }));
jest.mock('@/services/database/prisma.service', () => ({ prisma: {} }));
jest.mock('@/services/logging/logger.service', () => ({
  loggerService: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import { verifyEmail, verifyEmailGet } from '@/controllers/auth.controller';

const run = async (handler: unknown, req: Partial<Request>) => {
  const res = {
    json: jest.fn(),
    redirect: jest.fn(),
    status: jest.fn().mockReturnThis(),
  } as unknown as Response;
  const next: NextFunction = jest.fn();
  // asyncHandler 回傳 void、錯誤走 Promise.catch(next)，要等 event loop 跑完才能斷言
  (handler as (r: Request, s: Response, n: NextFunction) => void)(req as Request, res, next);
  await new Promise((resolve) => setImmediate(resolve));
  return { res, next };
};

describe('verify-email handlers → welcome email', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVerifyToken.mockReturnValue({ _id: 'ext-1' });
    mockFindUserByExternalId.mockResolvedValue({
      success: true,
      data: { id: 42, verified: false, referral_source: 'facebook' },
    });
  });

  describe('POST /auth/verify-email', () => {
    it('驗證成功 → 直接呼叫 sendWelcomeEmailInBackground（不再 enqueue onboarding L0）', async () => {
      mockVerifyUserEmail.mockResolvedValue({ success: true, data: { success: true } });

      const { res, next } = await run(verifyEmail, { body: { token: 'tok', email: 'a@b.c' } });

      expect(mockVerifyUserEmail).toHaveBeenCalledWith(42);
      expect(mockSendWelcomeEmailInBackground).toHaveBeenCalledWith(42, 'verify-email');
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: { message: '郵件驗證成功' } })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('併發已先驗證（updateMany count=0）→ 400 且不寄歡迎信', async () => {
      mockVerifyUserEmail.mockResolvedValue({ success: true, data: { success: false } });

      const { next } = await run(verifyEmail, { body: { token: 'tok', email: 'a@b.c' } });

      expect(mockSendWelcomeEmailInBackground).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: '郵件已驗證' }));
    });

    it('使用者已驗證 → 400 不寄', async () => {
      mockFindUserByExternalId.mockResolvedValue({ success: true, data: { id: 42, verified: true } });

      const { next } = await run(verifyEmail, { body: { token: 'tok', email: 'a@b.c' } });

      expect(mockVerifyUserEmail).not.toHaveBeenCalled();
      expect(mockSendWelcomeEmailInBackground).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: '郵件已驗證' }));
    });
  });

  describe('GET /auth/verify-email', () => {
    it('驗證成功 → 寄歡迎信並導向 status=success&message=verified', async () => {
      mockVerifyUserEmail.mockResolvedValue({ success: true, data: { success: true } });

      const { res } = await run(verifyEmailGet, { query: { token: 'tok' } });

      expect(mockSendWelcomeEmailInBackground).toHaveBeenCalledWith(42, 'verify-email GET');
      expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('status=success&message=verified'));
    });

    it('併發已先驗證 → 導向 already_verified 且不寄', async () => {
      mockVerifyUserEmail.mockResolvedValue({ success: true, data: { success: false } });

      const { res } = await run(verifyEmailGet, { query: { token: 'tok' } });

      expect(mockSendWelcomeEmailInBackground).not.toHaveBeenCalled();
      expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('message=already_verified'));
    });
  });
});
