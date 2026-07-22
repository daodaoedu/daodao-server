import type { NextFunction, Request, Response } from 'express';
import { prismaMock } from '@tests/utils/prisma-mock';

jest.mock('@/services/database/prisma.service', () => ({
  prisma: prismaMock
}));

import { requireOrganizationMember } from '@/middleware/organization-member.middleware';
import { ForbiddenError, UnauthorizedError } from '@/middleware/error.middleware';

describe('requireOrganizationMember', () => {
  const response = {} as Response;

  it('allows a user who belongs to an organization', async () => {
    const request = { user: { id: 42 } } as Request;
    const next = jest.fn() as NextFunction;
    prismaMock.organization_members.findFirst.mockResolvedValue({
      id: 7,
      organization_id: 3,
      user_id: 42,
      role: 'owner',
      created_at: new Date('2026-07-21T00:00:00Z')
    });

    await requireOrganizationMember(request, response, next);

    expect(prismaMock.organization_members.findFirst).toHaveBeenCalledWith({
      where: { user_id: 42 },
      select: { id: true }
    });
    expect(next).toHaveBeenCalledWith();
  });

  it('rejects a user who does not belong to any organization', async () => {
    const request = { user: { id: 42 } } as Request;
    const next = jest.fn() as NextFunction;
    prismaMock.organization_members.findFirst.mockResolvedValue(null);

    await requireOrganizationMember(request, response, next);

    expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
  });

  it('rejects a request without an authenticated user', async () => {
    const request = {} as Request;
    const next = jest.fn() as NextFunction;

    await requireOrganizationMember(request, response, next);

    expect(prismaMock.organization_members.findFirst).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });
});
