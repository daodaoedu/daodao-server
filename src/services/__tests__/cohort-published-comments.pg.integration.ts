import { randomUUID } from 'node:crypto';
import { prisma } from '../database/prisma.service';
import { cohortOutcomeService } from '../cohort-outcome.service';
import { cohortMessageService } from '../cohort-message.service';

/**
 * daodao#524：成果「發佈留言」與打卡抽屜 externalId 的真實 SQL 行為。
 * 定義：參與者在同場次其他成員打卡下發佈的留言數，不含回覆自己打卡、不含已刪除實踐，以人計。
 */
describe('場次成果：發佈留言數與打卡頁識別碼', () => {
  const key = randomUUID();
  let programId: number;
  let cohortId: number;
  let coachId: number;
  let alice: number;
  let bob: number;
  let alicePractices: number[] = [];
  let alicePracticeExternalId: string | null = null;

  beforeAll(async () => {
    const url = new URL(process.env.DATABASE_URL ?? '');
    if (url.hostname !== '127.0.0.1' || url.port !== '5624' || url.pathname !== '/daodao_524') throw new Error('Only the task-owned #524 DB is allowed');

    const role = await prisma.roles.findFirst() ?? await prisma.roles.create({ data: { name: `role-${key}` } });
    const user = (nickname: string) => prisma.users.create({ data: { mongo_id: `${key}-${nickname}`, nickname, role_id: role.id, tag_list: [] } });
    const [coach, a, b, carol, dan] = await Promise.all(['講師', 'Alice', 'Bob', 'Carol', 'Dan'].map(user));
    coachId = coach.id; alice = a.id; bob = b.id;

    const organization = await prisma.organization.create({ data: { name: key, status: 'active', organization_members: { create: [{ user_id: coachId, role: 'owner' }] } } });
    const program = await prisma.programs.create({ data: { organization_id: organization.id, name: key, kind: 'lighthouse' } });
    programId = program.id;
    const cohort = (slug: string) => prisma.cohorts.create({ data: { program_id: program.id, slug, display_name: slug, start_date: new Date('2026-07-01'), end_date: new Date('2026-08-31') } });
    const [cohortA, cohortB] = await Promise.all([cohort(`${key}-a`), cohort(`${key}-b`)]);
    cohortId = cohortA.id;
    await prisma.cohort_enrollments.createMany({
      data: [alice, bob, carol.id].map(id => ({ cohort_id: cohortA.id, user_id: id, email: `${key}-${id}@example.invalid`, status: 'joined', role: 'member' }))
        .concat([{ cohort_id: cohortB.id, user_id: dan.id, email: `${key}-dan@example.invalid`, status: 'joined', role: 'member' }])
    });

    const practice = (userId: number, cohort: number, title: string, deleted = false) =>
      prisma.practices.create({ data: { user_id: userId, cohort_id: cohort, title, deleted_at: deleted ? new Date() : null } });
    const checkin = (p: { id: number; user_id: number }) =>
      prisma.practice_checkins.create({ data: { practice_id: p.id, user_id: p.user_id, checkin_date: new Date('2026-07-10'), image_urls: [] } });
    const comment = (userId: number, targetId: number, targetType = 'checkin', parentId: number | null = null) =>
      prisma.comments.create({ data: { user_id: userId, target_id: targetId, target_type: targetType, content: key, parent_id: parentId } });

    const alice1 = await practice(alice, cohortA.id, '晨間書寫');
    const alice2 = await practice(alice, cohortA.id, '閱讀 30 分鐘');
    const bobPractice = await practice(bob, cohortA.id, '跑步');
    const carolDeleted = await practice(carol.id, cohortA.id, '已刪除的實踐', true);
    const danOtherCohort = await practice(dan.id, cohortB.id, '別的場次');
    alicePractices = [alice1.id, alice2.id];
    alicePracticeExternalId = alice1.external_id;

    const [aliceCheckin, bobCheckin, carolCheckin, danCheckin] = await Promise.all([alice1, bobPractice, carolDeleted, danOtherCohort].map(checkin));

    // Alice：留在 Bob 打卡下 1 則＋回覆 1 則 → 應計 2
    const first = await comment(alice, bobCheckin.id);
    await comment(alice, bobCheckin.id, 'checkin', first.id);
    // 以下都不應計入 Alice
    await comment(alice, aliceCheckin.id);          // 回覆自己的打卡
    await comment(alice, carolCheckin.id);          // 已刪除實踐的打卡
    await comment(alice, danCheckin.id);            // 別的場次
    await comment(alice, bobCheckin.id, 'post');    // 同 id 但不是打卡留言
    // Bob：留在 Alice 打卡下 1 則 → 應計 1
    await comment(bob, aliceCheckin.id);
  });

  afterAll(() => prisma.$disconnect());

  it('只算同場次其他成員打卡下的留言，以人計並在同一人的每個實踐列相同', async () => {
    const outcome = await cohortOutcomeService.get(programId, cohortId, coachId);
    const rows = outcome.participantProgress;
    const aliceRows = rows.filter(row => row.userId === alice);

    expect(aliceRows.map(row => row.practiceId).sort()).toEqual([...alicePractices].sort());
    expect(aliceRows.map(row => row.publishedCommentCount)).toEqual([2, 2]);
    expect(rows.find(row => row.userId === bob)?.publishedCommentCount).toBe(1);
  });

  it('打卡紀錄抽屜回傳該實踐的公開識別碼', async () => {
    const result = await cohortMessageService.listCheckins(programId, cohortId, coachId, alice, alicePractices[0]);
    expect(alicePracticeExternalId).toEqual(expect.any(String));
    expect(result.practice.externalId).toBe(alicePracticeExternalId);
  });
});
