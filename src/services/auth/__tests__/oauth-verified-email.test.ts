import type { Profile } from 'passport-google-oauth20';
import { prismaMock } from '@tests/utils/prisma-mock';

type Verify = (access: string, refresh: string, profile: Profile, done: (error: unknown, user?: unknown) => void) => Promise<unknown>;
let googleVerify: Verify;
const findUserByGoogleIdentity = jest.fn();
const findOrCreateTempUser = jest.fn();
jest.mock('../../database/prisma.service', () => ({ prisma: prismaMock }));
jest.mock('../auth.service', () => ({ authService: { findUserByGoogleIdentity, findOrCreateTempUser } }));
jest.mock('passport', () => ({ serializeUser: jest.fn(), deserializeUser: jest.fn(), use: jest.fn() }));
jest.mock('passport-google-oauth20', () => ({ Strategy: jest.fn((_options: unknown, verify: Verify) => { googleVerify = verify; }) }));
jest.mock('../oauth-redis-state-store.service', () => ({ redisOAuthStateStore: {} }));

describe('Google callback trusted Email persistence', () => {
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
  });
  it('persists the verified email for a returning formal account', async () => {
    findUserByGoogleIdentity.mockResolvedValue({ success: true, data: { user: { id: 42, roles: { name: 'User' } } } });
    const done = jest.fn();
    await googleVerify('', '', profile(true), done);
    expect(findUserByGoogleIdentity).toHaveBeenCalledWith('google-42', 'owner@example.com');
    expect(prismaMock.users.update).toHaveBeenCalledWith({ where: { id: 42 }, data: { verified_login_email: 'owner@example.com', verified: true, verified_at: expect.any(Date) } });
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
});
