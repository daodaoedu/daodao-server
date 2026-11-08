import { Prisma, temp_users } from '../../../../generated/prisma';
import { prismaMock } from '@tests/utils/prisma-mock';
import { ConflictError } from '../../../middleware/error.middleware';

jest.mock('../../database/prisma.service', () => ({ prisma: prismaMock }));
jest.mock('../../user.service', () => ({ userService: {} }));
jest.mock('../../jwt.service', () => ({ jwtService: {} }));
jest.mock('../../logging/logger.service', () => ({ loggerService: {} }));
jest.mock('../../email/welcome-email.service', () => ({ sendWelcomeEmailInBackground: jest.fn() }));

import { findOrCreateTempUser } from '../auth.service';

const profile = { googleId: 'google-owner', email: 'owner@example.test', name: 'Original Name', photoUrl: 'https://example.test/original.png' };
const existing: temp_users = {
  id: 41, google_id: profile.googleId, email: profile.email, name: profile.name,
  photo_url: profile.photoUrl, apple_id: null, verified_login_email: null,
  created_date: new Date('2026-01-01'), updated_date: new Date('2026-01-01')
};
const collision = (meta: Record<string, unknown> = { target: ['google_id'] }): Prisma.PrismaClientKnownRequestError => new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
  code: 'P2002', clientVersion: '6.16.2', meta
});

describe('Google temporary identity collision recovery', () => {
  it('returns the original identity without overwriting a changed profile', async () => {
    prismaMock.temp_users.findFirst.mockResolvedValueOnce(existing);
    const response = await findOrCreateTempUser({ ...profile, email: 'changed@example.test', name: 'Changed Name' });
    expect(response.data).toEqual({ user: existing, isNewUser: false });
    expect(prismaMock.temp_users.create).not.toHaveBeenCalled();
    expect(prismaMock.temp_users.update).not.toHaveBeenCalled();
  });

  it('returns the same identity when another login wins before the email check', async () => {
    prismaMock.temp_users.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(existing);
    const response = await findOrCreateTempUser(profile);
    expect(response.data).toEqual({ user: existing, isNewUser: false });
    expect(prismaMock.temp_users.create).not.toHaveBeenCalled();
  });

  it('returns the same identity after a concurrent insert wins the unique constraint', async () => {
    prismaMock.temp_users.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(null).mockResolvedValueOnce(existing);
    prismaMock.temp_users.create.mockRejectedValueOnce(collision());
    const response = await findOrCreateTempUser({ ...profile, email: 'changed@example.test', name: 'Changed Name' });
    expect(response.data).toEqual({ user: existing, isNewUser: false });
    expect(prismaMock.temp_users.update).not.toHaveBeenCalled();
  });


  it('recovers a same-subject winner when the racing insert reports the email unique key', async () => {
    prismaMock.temp_users.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(null).mockResolvedValueOnce(existing);
    prismaMock.temp_users.create.mockRejectedValueOnce(collision({ target: ['email'] }));
    const response = await findOrCreateTempUser(profile);
    expect(response.data).toEqual({ user: existing, isNewUser: false });
  });

  it.each([
    { target: ['id'] },
    { target: ['google_id', 'email'] },
    { target: ['future_unique_column'] },
    { target: [] },
    { target: 'temp_users_google_id_key' },
    {}
  ])('does not suppress an unrelated or unrecognized unique constraint (%p)', async (meta) => {
    // A visible same-subject row must not hide an unrelated database failure.
    prismaMock.temp_users.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(null).mockResolvedValueOnce(existing);
    const failure = collision(meta);
    prismaMock.temp_users.create.mockRejectedValueOnce(failure);
    await expect(findOrCreateTempUser(profile)).rejects.toBe(failure);
  });

  it('marks only a successfully created identity as new', async () => {
    prismaMock.temp_users.findFirst.mockResolvedValue(null);
    prismaMock.temp_users.create.mockResolvedValueOnce(existing);
    const response = await findOrCreateTempUser(profile);
    expect(response.data).toEqual({ user: existing, isNewUser: true });
  });

  it.each(['other-google-owner', null])('does not authenticate an email owned by Google identity %s', async (googleId) => {
    prismaMock.temp_users.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({ ...existing, google_id: googleId });
    await expect(findOrCreateTempUser(profile)).rejects.toBeInstanceOf(ConflictError);
    expect(prismaMock.temp_users.create).not.toHaveBeenCalled();
  });

  it('maps a competing different identity with the same email to a domain conflict', async () => {
    prismaMock.temp_users.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(null).mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ ...existing, google_id: 'other-owner' });
    prismaMock.temp_users.create.mockRejectedValueOnce(collision());
    await expect(findOrCreateTempUser(profile)).rejects.toBeInstanceOf(ConflictError);
    expect(prismaMock.temp_users.update).not.toHaveBeenCalled();
  });

  it('preserves an unexplained unique failure instead of reporting an email conflict', async () => {
    prismaMock.temp_users.findFirst.mockResolvedValue(null);
    const failure = collision();
    prismaMock.temp_users.create.mockRejectedValueOnce(failure);
    await expect(findOrCreateTempUser(profile)).rejects.toBe(failure);
  });

  it.each([
    new Error('connection unavailable'),
    new Prisma.PrismaClientKnownRequestError('Foreign key failed', { code: 'P2003', clientVersion: '6.16.2' }),
    { code: 'P2002', message: 'not a Prisma database error' }
  ])('propagates failures that are not a Prisma unique collision (%p)', async (failure) => {
    prismaMock.temp_users.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    prismaMock.temp_users.create.mockRejectedValueOnce(failure);
    await expect(findOrCreateTempUser(profile)).rejects.toBe(failure);
  });
});
