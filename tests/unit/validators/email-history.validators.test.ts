import { emailHistoryQuerySchema } from '@/validators/email-history.validator';
import { EMAIL_STATUS } from '@/types/email';

describe('emailHistoryQuerySchema status（daodao#292 AC-02）', () => {
  it('接受 email_logs 會寫入的每一種狀態，含後台停用時的 skipped', () => {
    for (const status of Object.values(EMAIL_STATUS)) {
      const parsed = emailHistoryQuerySchema.safeParse({ status });
      expect(parsed.success).toBe(true);
      expect(parsed.success && parsed.data.status).toBe(status);
    }
  });

  it('仍拒絕未知狀態', () => {
    expect(emailHistoryQuerySchema.safeParse({ status: 'bogus' }).success).toBe(false);
  });
});
