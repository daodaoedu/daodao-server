import type { Prisma } from '../../../generated/prisma';
import { prismaMock } from '@tests/utils/prisma-mock';
import { matches as matching } from 'jest-mock-extended';

jest.mock('@/services/database/prisma.service', () => ({ prisma: prismaMock }));

import { ForbiddenError, NotFoundError } from '@/middleware/error.middleware';
import { assertCohortTemplateResourceAccess } from '../cohort-template-resource-access.service';

type Row = Record<string, unknown>;

/** Interpret scalar and nested relation filters against fixture data, independently of authorization. */
const matches = (row: unknown, where: unknown): boolean => {
  if (where === null || typeof where !== 'object') return row === where;
  if (row === null || typeof row !== 'object') return false;
  const record = row as Row;
  return Object.entries(where).every(([key, expected]) => {
    if (key === 'in') return Array.isArray(expected) && expected.includes(row);
    const actual = record[key];
    if (expected !== null && typeof expected === 'object' && 'in' in expected) {
      const candidates = expected.in;
      return Array.isArray(candidates) && candidates.includes(actual);
    }
    return matches(actual, expected);
  });
};

/** Search the fixture as a database would; unfiltered queries can expose decoy rows. */
const find = (rows: Row[], where: unknown): Row | null => rows.find(row => matches(row, where)) ?? null;

/** Each fixture has independent organization, binding, lifecycle, membership and enrollment state. */
const makeFixture = (): {
  organization: Row;
  template: Row;
  program: Row;
  cohort: Row;
  binding: Row;
  memberships: Row[];
  enrollments: Row[];
} => {
  const organization = { id: 1, status: 'active' };
  const template = { id: 10, organization_id: 1, deleted_at: null };
  const program = { id: 20, organization_id: 1, kind: 'lighthouse', archived_at: null, deleted_at: null, organization };
  const cohort = { id: 30, deleted_at: null, status: 'active', program };
  const binding = { id: 40, cohort_id: 30, template_id: 10, unbound_at: null, cohort, practice_template: template };
  const memberships: Row[] = [
    { id: 1, organization_id: 1, user_id: 100, role: 'owner' },
    { id: 2, organization_id: 2, user_id: 200, role: 'owner' },
    { id: 3, organization_id: 1, user_id: 300, role: 'member' }
  ];
  const enrollments: Row[] = [
    { id: 1, cohort_id: 30, user_id: 200, status: 'joined', role: 'owner' },
    { id: 2, cohort_id: 30, user_id: 201, status: 'joined', role: 'assistant' },
    { id: 3, cohort_id: 31, user_id: 202, status: 'joined', role: 'owner' },
    { id: 4, cohort_id: 30, user_id: 203, status: 'joined', role: 'member' }
  ];
  prismaMock.cohort_templates.findFirst.calledWith(matching((args: Prisma.cohort_templatesFindFirstArgs) => find([binding], args?.where) !== null)).mockResolvedValue(binding as never);
  prismaMock.organization_members.findFirst.calledWith(matching((args: Prisma.organization_membersFindFirstArgs) => find(memberships, args?.where) !== null)).mockResolvedValue({ id: 1 } as never);
  prismaMock.cohort_enrollments.findFirst.calledWith(matching((args: Prisma.cohort_enrollmentsFindFirstArgs) => find(enrollments, args?.where) !== null)).mockResolvedValue({ id: 1 } as never);
  return { organization, template, program, cohort, binding, memberships, enrollments };
};

describe('cohort template resource access (#401)', () => {
  let fixture: ReturnType<typeof makeFixture>;
  beforeEach(() => { fixture = makeFixture(); });

  it.each([100, 200, 201])('allows organization owner or the joined cohort leader %s', async userId => {
    await expect(assertCohortTemplateResourceAccess(1, 10, 30, userId)).resolves.toBeUndefined();
  });

  it('allows a joined assistant who has no organization membership', async () => {
    fixture.memberships.length = 0;
    await expect(assertCohortTemplateResourceAccess(1, 10, 30, 201)).resolves.toBeUndefined();
  });

  it.each([202, 203, 300, 999])('rejects other-cohort leader, learner, non-owner or outsider %s', async userId => {
    await expect(assertCohortTemplateResourceAccess(1, 10, 30, userId)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it.each(['invited', 'removed', 'exited'])('rejects a leader with enrollment status %s', async status => {
    fixture.enrollments[0].status = status;
    await expect(assertCohortTemplateResourceAccess(1, 10, 30, 200)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('rejects an owner of another organization without a local leadership enrollment', async () => {
    fixture.enrollments.length = 0;
    await expect(assertCohortTemplateResourceAccess(1, 10, 30, 200)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it.each([[2, 10, 30], [1, 11, 30], [1, 10, 31]])('rejects a tampered organization/template/cohort path %s/%s/%s', async (org, template, cohort) => {
    await expect(assertCohortTemplateResourceAccess(org, template, cohort, 100)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('rejects a binding whose template belongs to another organization', async () => {
    fixture.template.organization_id = 2;
    await expect(assertCohortTemplateResourceAccess(1, 10, 30, 100)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('rejects a binding whose cohort program belongs to another organization', async () => {
    fixture.program.organization_id = 2;
    await expect(assertCohortTemplateResourceAccess(1, 10, 30, 100)).rejects.toBeInstanceOf(NotFoundError);
  });

  it.each(['challenge', 'other'])('rejects a non-Lighthouse program %s', async kind => {
    fixture.program.kind = kind;
    await expect(assertCohortTemplateResourceAccess(1, 10, 30, 100)).rejects.toBeInstanceOf(NotFoundError);
  });

  it.each(['owner', 'leader'])('rejects an inactive organization for %s', async role => {
    fixture.organization.status = 'suspended';
    await expect(assertCohortTemplateResourceAccess(1, 10, 30, role === 'owner' ? 100 : 200)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it.each(['template', 'cohort', 'program', 'binding', 'archived-program'])('rejects invalid lifecycle state: %s', async subject => {
    const timestamp = new Date('2026-11-04T00:00:00Z');
    if (subject === 'template') Object.assign(fixture.template, { deleted_at: timestamp });
    if (subject === 'cohort') Object.assign(fixture.cohort, { deleted_at: timestamp });
    if (subject === 'program') Object.assign(fixture.program, { deleted_at: timestamp });
    if (subject === 'binding') Object.assign(fixture.binding, { unbound_at: timestamp });
    if (subject === 'archived-program') Object.assign(fixture.program, { archived_at: timestamp });
    await expect(assertCohortTemplateResourceAccess(1, 10, 30, 100)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('does not invent a restriction on an archived cohort under an active program', async () => {
    fixture.cohort.status = 'archived';
    await expect(assertCohortTemplateResourceAccess(1, 10, 30, 201)).resolves.toBeUndefined();
  });
});
