import { prismaMock } from '@tests/utils/prisma-mock';

jest.mock('@/services/database/prisma.service', () => ({ prisma: prismaMock }));

import {
  challengeOrganizationService,
  parseChallengeOrganizationId,
  pickChallengeOrganization
} from '@/services/challenge-organization.service';

describe('parseChallengeOrganizationId', () => {
  it.each([['7', 7], [' 12 ', 12]])('正整數字串 %p → %p', (raw, expected) => {
    expect(parseChallengeOrganizationId(raw)).toBe(expected);
  });

  it.each([undefined, '', '0', '-1', '1.5', 'abc', '3x'])('未設定或格式錯誤 %p → null', raw => {
    expect(parseChallengeOrganizationId(raw)).toBeNull();
  });
});

describe('pickChallengeOrganization', () => {
  it('設定的組織存在且 active → 回傳它', () => {
    expect(pickChallengeOrganization(7, { id: 7, status: 'active' }, { requireActive: true })).toBe(7);
  });

  it('未設定 → 409，不退回任意組織', () => {
    expect(() => pickChallengeOrganization(null, null, { requireActive: false })).toThrow(expect.objectContaining({ statusCode: 409 }));
  });

  it('設定的組織不存在 → 409', () => {
    expect(() => pickChallengeOrganization(7, null, { requireActive: false })).toThrow(expect.objectContaining({ statusCode: 409 }));
  });

  it('建立時島島阿學組織被停權 → 409', () => {
    expect(() => pickChallengeOrganization(7, { id: 7, status: 'suspended' }, { requireActive: true }))
      .toThrow(expect.objectContaining({ statusCode: 409, message: expect.stringContaining('停權') }));
  });

  it('只讀取時島島阿學組織被停權仍回傳（列表與封存不受影響）', () => {
    expect(pickChallengeOrganization(7, { id: 7, status: 'suspended' }, { requireActive: false })).toBe(7);
  });
});

describe('challengeOrganizationService', () => {
  const original = process.env.CHALLENGE_ORGANIZATION_ID;
  afterEach(() => {
    if (original === undefined) delete process.env.CHALLENGE_ORGANIZATION_ID;
    else process.env.CHALLENGE_ORGANIZATION_ID = original;
  });

  it('只查 env 指定的組織，不看其他組織的停權狀態', async () => {
    process.env.CHALLENGE_ORGANIZATION_ID = '7';
    prismaMock.organization.findUnique.mockResolvedValue({ id: 7, status: 'active' } as never);
    await expect(challengeOrganizationService.getActiveOrganizationId()).resolves.toBe(7);
    expect(prismaMock.organization.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 7 } }));
  });

  it('env 未設定時不查 DB、直接 409', async () => {
    delete process.env.CHALLENGE_ORGANIZATION_ID;
    await expect(challengeOrganizationService.getOrganizationId()).rejects.toMatchObject({ statusCode: 409 });
    expect(prismaMock.organization.findUnique).not.toHaveBeenCalled();
  });
});
