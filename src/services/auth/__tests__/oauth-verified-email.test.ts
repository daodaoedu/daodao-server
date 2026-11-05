import type { Profile } from 'passport-google-oauth20';
import { prismaMock, setupTransactionMock } from '@tests/utils/prisma-mock';

type Verify = (access: string, refresh: string, profile: Profile, done: (error: unknown, user?: unknown) => void) => Promise<unknown>;
let googleVerify: Verify;
const findUserByGoogleIdentity = jest.fn();
const findOrCreateTempUser = jest.fn();
const mockSendWelcomeEmailInBackground = jest.fn();
jest.mock('../../email/welcome-email.service', () => ({ sendWelcomeEmailInBackground: (...args: unknown[]) => mockSendWelcomeEmailInBackground(...args) }));
jest.mock('../../database/prisma.service', () => ({ prisma: prismaMock }));
jest.mock('../auth.service', () => ({ authService: { findUserByGoogleIdentity, findOrCreateTempUser } }));
jest.mock('passport', () => ({ serializeUser: jest.fn(), deserializeUser: jest.fn(), use: jest.fn() }));
jest.mock('passport-google-oauth20', () => ({ Strategy: jest.fn((_options: unknown, verify: Verify) => { googleVerify = verify; }) }));
jest.mock('../oauth-redis-state-store.service', () => ({ redisOAuthStateStore: {} }));

describe('Google callback trusted Email persistence', () => {
  beforeEach(() => { setupTransactionMock(); prismaMock.users.updateMany.mockResolvedValue({ count: 0 }); });
  beforeAll(() => {
    process.env.GOOGLE_CLIENT_ID = 'local-test';
    process.env.GOOGLE_CLIENT_SECRET = 'local-test';
    process.env.GOOGLE_CALLBACK_URL = 'http://localhost/callback';
    require('../oauth.service');
  });
  const profile = (verified: boolean): Profile => ({
    provider: 'google', id: 'google-42', displayName: 'Owner', profileUrl: 'https://example.com/profile',
    emails: [{ value: ' Owner@Example.com ', verified }], photos: [], _raw: '', _json: { iss: 'https://accounts.google.com', aud: 'local-test', sub: 'google-42', iat: 0, exp: 9999999999 }
  });
  it('rejects an unverified provider email before account lookup or trusted persistence', async () => {
    const done = jest.fn();
    await googleVerify('', '', profile(false), done);
    expect(done).toHaveBeenCalledWith(expect.any(Error), false);
    expect(findUserByGoogleIdentity).not.toHaveBeenCalled();
    expect(prismaMock.users.update).not.toHaveBeenCalled();
    expect(prismaMock.temp_users.update).not.toHaveBeenCalled();
    expect(mockSendWelcomeEmailInBackground).not.toHaveBeenCalled();
  });
  it('persists the verified email for a returning formal account', async () => {
    findUserByGoogleIdentity.mockResolvedValue({ success: true, data: { user: { id: 42, roles: { name: 'User' } } } });
    const done = jest.fn();
    await googleVerify('', '', profile(true), done);
    expect(findUserByGoogleIdentity).toHaveBeenCalledWith('google-42', 'owner@example.com');
    expect(prismaMock.users.update).toHaveBeenCalledWith({ where: { id: 42 }, data: { verified_login_email: 'owner@example.com' } });
    expect(prismaMock.users.updateMany).toHaveBeenCalledWith({ where: { id: 42, OR: [{ verified: false }, { verified: null }] }, data: { verified: true, verified_at: expect.any(Date) } });
    expect(done).toHaveBeenCalledWith(null, expect.objectContaining({ id: 42, _isNewUser: false }));
  });
  it('persists the verified provider email on the temporary signup identity', async () => {
    findUserByGoogleIdentity.mockResolvedValue({ success: true, data: null });
    findOrCreateTempUser.mockResolvedValue({ success: true, data: { user: { id: 13 }, isNewUser: true } });
    const done = jest.fn();
    await googleVerify('', '', profile(true), done);
    expect(prismaMock.temp_users.update).toHaveBeenCalledWith({ where: { id: 13 }, data: { verified_login_email: 'owner@example.com' } });
    expect(done).toHaveBeenCalledWith(null, expect.objectContaining({ id: 13, _isNewUser: true }));
  });
  it('sends welcome only for the committed first verification transition, including repeated stale logins', async () => {
    findUserByGoogleIdentity.mockResolvedValue({ success: true, data: { user: { id: 42, verified: false, roles: { name: 'User' } } } });
    prismaMock.users.updateMany.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 });
    const done = jest.fn();
    await googleVerify('', '', profile(true), done);
    await googleVerify('', '', profile(true), done);
    expect(done).toHaveBeenCalledTimes(2);
    expect(mockSendWelcomeEmailInBackground).toHaveBeenCalledTimes(1);
    expect(mockSendWelcomeEmailInBackground).toHaveBeenCalledWith(42, 'google-oauth');
  });
  it('does not send welcome for an already verified account', async () => {
    findUserByGoogleIdentity.mockResolvedValue({ success: true, data: { user: { id: 42, verified: true, roles: { name: 'User' } } } });
    prismaMock.users.updateMany.mockResolvedValue({ count: 0 });
    await googleVerify('', '', profile(true), jest.fn());
    expect(mockSendWelcomeEmailInBackground).not.toHaveBeenCalled();
  });
  it('does not send welcome when the verified-login transaction rolls back', async () => {
    findUserByGoogleIdentity.mockResolvedValue({ success: true, data: { user: { id: 42, verified: false, roles: { name: 'User' } } } });
    prismaMock.users.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.$transaction.mockImplementationOnce(async (callback: unknown) => {
      if (typeof callback !== 'function') throw new Error('Expected transaction callback');
      await callback(prismaMock);
      expect(mockSendWelcomeEmailInBackground).not.toHaveBeenCalled();
      throw new Error('commit failed');
    });
    const done = jest.fn();
    await googleVerify('', '', profile(true), done);
    expect(done).toHaveBeenCalledWith(expect.any(Error), false);
    expect(mockSendWelcomeEmailInBackground).not.toHaveBeenCalled();
  });

});
