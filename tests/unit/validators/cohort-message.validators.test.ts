import { cohortParticipantCheckinsResponseSchema } from '../../../src/validators/cohort-message.validators';

const response = (externalId: string | null) => ({
  participant: { userId: 77, nickname: '小島', avatar: null },
  practice: { id: 31, externalId, title: '每天寫下一件小事', startDate: null, endDate: null },
  total: 0,
  items: []
});

describe('cohortParticipantCheckinsResponseSchema', () => {
  // daodao#524：controller 會用這個 schema parse 回應；舊資料的 external_id 若版本位元不符 RFC，不能讓整個打卡抽屜 500
  it('accepts a legacy external id whose UUID version bits are not RFC-compliant', () => {
    const legacy = 'e758984c-0de4-0212-0a10-162c1bae5875';
    expect(cohortParticipantCheckinsResponseSchema.parse(response(legacy)).practice.externalId).toBe(legacy);
  });

  it('keeps a missing external id as null so the client hides the check-in page link', () => {
    expect(cohortParticipantCheckinsResponseSchema.parse(response(null)).practice.externalId).toBeNull();
  });
});
