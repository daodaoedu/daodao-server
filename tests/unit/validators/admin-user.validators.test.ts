/**
 * admin 用戶列表／篩選契約 — #218 移除新手任務後，badge／來源／完成天數不再出現在 wire contract
 */
import { adminUserListQuerySchema, adminUserListResponseSchema } from '@/validators/admin-user.validator';

const baseItem = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  internalId: 1,
  customId: null,
  name: '王小明',
  email: 'a@b.c',
  photoURL: null,
  emailVerified: true,
  emailVerifiedAt: null,
  isActive: true,
  roles: [],
  permissions: [],
  createdAt: '2026-09-20T00:00:00.000Z',
  lastLoginAt: null,
  lastActiveAt: null,
  personaType: null,
  tags: [],
};

describe('admin user validators (#218 onboarding task fields removed)', () => {
  it('list response strips badgeGranted / userSource / registrationFlow / creationMethod / daysToComplete', () => {
    const parsed = adminUserListResponseSchema.parse({
      success: true,
      data: [{ ...baseItem, badgeGranted: true, userSource: 'S1', registrationFlow: 'quiz', creationMethod: 'copied', daysToComplete: 3 }],
      pagination: { currentPage: 1, totalPages: 1, totalItems: 1, itemsPerPage: 20, hasNext: false, hasPrev: false },
      timestamp: '2026-09-20T00:00:00.000Z',
    }) as { data: Array<Record<string, unknown>> };

    for (const key of ['badgeGranted', 'userSource', 'registrationFlow', 'creationMethod', 'daysToComplete']) {
      expect(parsed.data[0]).not.toHaveProperty(key);
    }
    expect(parsed.data[0]).toHaveProperty('personaType');
  });

  it('list query rejects removed sort values and ignores removed filters', () => {
    expect(adminUserListQuerySchema.safeParse({ sortBy: 'daysToComplete' }).success).toBe(false);
    expect(adminUserListQuerySchema.safeParse({ sortBy: 'registrationFlow' }).success).toBe(false);

    const parsed = adminUserListQuerySchema.parse({ badgeGranted: 'true', userSource: 'S1', sortBy: 'createdAt' });
    expect(parsed).not.toHaveProperty('badgeGranted');
    expect(parsed).not.toHaveProperty('userSource');
  });
});
