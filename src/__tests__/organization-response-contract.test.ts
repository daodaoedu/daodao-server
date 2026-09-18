/** HTTP response contracts for organization routes: schema compliance via controller unit test. */
import '../config/openapi-registry';
import {
  organizationResponseSchema,
  organizationListResponseSchema,
  organizationMemberListResponseSchema,
} from '../validators/organization.validators';

const mockOrg = {
  id: 1,
  name: '島島學習社群',
  bio: '陪伴學習者持續行動',
  externalLink: 'https://example.com',
  status: 'active' as const,
  approvedBy: null,
  approvedAt: null,
  createdAt: new Date('2024-01-01')
};

const mockMember = {
  id: 1,
  userId: 42,
  nickname: '管理員',
  role: 'owner' as const,
  createdAt: new Date('2024-01-01')
};

describe('organization response contracts (schema-level)', () => {
  it('validates mock organization against organizationResponseSchema', () => {
    const parsed = organizationResponseSchema.safeParse(mockOrg);
    expect(parsed.success).toBe(true);
  });

  it('validates organization list against organizationListResponseSchema', () => {
    const parsed = organizationListResponseSchema.safeParse([mockOrg]);
    expect(parsed.success).toBe(true);
  });

  it('validates member list against organizationMemberListResponseSchema', () => {
    const parsed = organizationMemberListResponseSchema.safeParse([mockMember]);
    expect(parsed.success).toBe(true);
  });

  it('strips extra fields via Zod parse (controller uses .parse())', () => {
    const orgWithExtra = { ...mockOrg, internalToken: 'secret', passwordHash: 'hash123' };
    const parsed = organizationResponseSchema.parse(orgWithExtra);
    expect(parsed).not.toHaveProperty('internalToken');
    expect(parsed).not.toHaveProperty('passwordHash');
  });

  it('member schema does not include email field', () => {
    const memberWithEmail = { ...mockMember, email: 'test@example.com' };
    const parsed = organizationMemberListResponseSchema.parse([memberWithEmail]);
    expect(parsed[0]).not.toHaveProperty('email');
  });

  it('rejects invalid status values', () => {
    const invalid = { ...mockOrg, status: 'deleted' };
    const parsed = organizationResponseSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });
});
