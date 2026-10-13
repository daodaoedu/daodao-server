import { prismaMock } from '@tests/utils/prisma-mock';

jest.mock('@/services/database/prisma.service', () => ({ prisma: prismaMock }));

import { challengeOrganizationService, pickChallengeOrganization } from '@/services/challenge-organization.service';

describe('pickChallengeOrganization', () => {
  it('唯一一筆官方組織 → 回傳它', () => {
    expect(pickChallengeOrganization([{ id: 7, status: 'active' }], { requireActive: true })).toEqual({ id: 7, status: 'active' });
  });

  it('沒有官方組織 → 409，不退回任意組織', () => {
    expect(() => pickChallengeOrganization([], { requireActive: false })).toThrow(expect.objectContaining({ statusCode: 409 }));
  });

  it('有多筆官方組織（資料錯誤）→ 409，不猜哪一筆', () => {
    expect(() => pickChallengeOrganization([{ id: 7, status: 'active' }, { id: 8, status: 'active' }], { requireActive: false }))
      .toThrow(expect.objectContaining({ statusCode: 409 }));
  });

  it('建立時官方組織被停權 → 409', () => {
    expect(() => pickChallengeOrganization([{ id: 7, status: 'suspended' }], { requireActive: true }))
      .toThrow(expect.objectContaining({ statusCode: 409, message: expect.stringContaining('停權') }));
  });

  it('只讀取時官方組織被停權仍回傳（列表與封存不受影響）', () => {
    expect(pickChallengeOrganization([{ id: 7, status: 'suspended' }], { requireActive: false })).toEqual({ id: 7, status: 'suspended' });
  });
});

describe('challengeOrganizationService', () => {
  it('只以 is_official 標記查官方組織，不看名稱或其他組織狀態', async () => {
    prismaMock.organization.findMany.mockResolvedValue([{ id: 7, status: 'active' }] as never);
    await expect(challengeOrganizationService.getActiveOrganizationId()).resolves.toBe(7);
    expect(prismaMock.organization.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { is_official: true } }));
  });

  it('DB 沒有官方組織時 409', async () => {
    prismaMock.organization.findMany.mockResolvedValue([] as never);
    await expect(challengeOrganizationService.getOrganizationId()).rejects.toMatchObject({ statusCode: 409 });
  });
});
