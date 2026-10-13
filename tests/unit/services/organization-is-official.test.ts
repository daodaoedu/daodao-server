/**
 * daodao#179：organization.is_official 決定共同挑戰所屬組織，只能由 storage migration 093 設定。
 * 燈塔組織的建立／更新 API（含後台）都不可設定或改動 is_official。
 */
import { prismaMock, setupTransactionMock } from '@tests/utils/prisma-mock';

jest.mock('@/services/database/prisma.service', () => ({ prisma: prismaMock }));

// organization.validators 依賴 zod 的 .openapi() 擴充，先載入 registry
import '@/config/openapi-registry';
import { organizationService } from '@/services/organization.service';
import {
  adminUpdateOrganizationSchema,
  createOrganizationSchema,
  updateOrganizationSchema
} from '@/validators/organization.validators';

const now = new Date('2026-10-13T00:00:00.000Z');
const organizationRow = {
  id: 3, name: '其他組織', bio: null, external_link: null, status: 'active',
  approved_by: 1, approved_at: now, created_at: now, updated_at: null
};
const smuggled = { is_official: true, isOfficial: true };

const dataOf = (mock: jest.Mock): Record<string, unknown> => (mock.mock.calls[0][0] as { data: Record<string, unknown> }).data;

describe('organization is_official 不可經 API 設定', () => {
  beforeEach(() => {
    setupTransactionMock();
    prismaMock.organization.findUnique.mockResolvedValue(organizationRow as never);
    prismaMock.organization.update.mockResolvedValue(organizationRow as never);
  });

  it('validator 會略過夾帶的 is_official／isOfficial', () => {
    const create = createOrganizationSchema.parse({ name: '其他組織', ownerUserId: 42, ...smuggled });
    const update = updateOrganizationSchema.parse({ name: '其他組織', ...smuggled });
    const adminUpdate = adminUpdateOrganizationSchema.parse({ name: '其他組織', ...smuggled });
    for (const parsed of [create, update, adminUpdate]) {
      expect(parsed).not.toHaveProperty('is_official');
      expect(parsed).not.toHaveProperty('isOfficial');
    }
  });

  it('申請／建立組織寫入的欄位不含 is_official', async () => {
    prismaMock.users.findUnique.mockResolvedValue({ id: 42 } as never);
    prismaMock.organization.create.mockResolvedValue(organizationRow as never);
    await organizationService.create({ name: '其他組織', ownerUserId: 42, ...smuggled } as never, 1);
    expect(dataOf(prismaMock.organization.create as unknown as jest.Mock)).not.toHaveProperty('is_official');
  });

  it('組織成員更新組織資訊不會改到 is_official', async () => {
    prismaMock.organization_members.findUnique.mockResolvedValue({ organization: { status: 'active' } } as never);
    await organizationService.update(3, 42, { name: '其他組織', ...smuggled } as never);
    expect(dataOf(prismaMock.organization.update as unknown as jest.Mock)).not.toHaveProperty('is_official');
  });

  it('後台更新組織（含停權）不會改到 is_official', async () => {
    await organizationService.adminUpdate(3, 1, { status: 'suspended', ...smuggled } as never);
    expect(dataOf(prismaMock.organization.update as unknown as jest.Mock)).not.toHaveProperty('is_official');
  });
});
