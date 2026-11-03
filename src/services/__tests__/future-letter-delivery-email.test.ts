import { prismaMock, setupTransactionMock } from '../../../tests/utils/prisma-mock';

jest.mock('../database/prisma.service', () => ({ prisma: prismaMock }));
const add = jest.fn();
const getEmailQueue = jest.fn();
jest.mock('../../queues/email.queue', () => ({ getEmailQueue: () => getEmailQueue() }));
jest.mock('../../queues/future-letter.queue', () => ({ scheduleFutureLetterDelivery: jest.fn(), removeFutureLetterJob: jest.fn() }));

import { futureLetterService } from '../future-letter.service';
import { recoverPendingFutureLetterEmails } from '../email/future-letter-email.service';
import { generateFutureLetterEmail } from '../email/future-letter-template';

const letterId = '550e8400-e29b-41d4-a716-446655440000';
const owner = { nickname: '小島', contacts: { email: 'owner@example.com' } };
const pendingLog = { id: 41, user_id: 3, entity_id: 8, tracking_token: 'tracking', users: owner };

beforeEach(() => {
  jest.clearAllMocks();
  setupTransactionMock();
  process.env.FRONTEND_URL = 'https://app-dev.daodao.so/';
  getEmailQueue.mockReturnValue({ add });
  add.mockResolvedValue({ id: 'future-letter-email-41' });
  prismaMock.future_letters.updateMany.mockResolvedValue({ count: 1 });
  prismaMock.future_letters.findUnique.mockResolvedValue({ id: 8, user_id: 3, users: owner } as never);
  prismaMock.future_letters.findFirst.mockResolvedValue({ external_id: letterId } as never);
  prismaMock.email_logs.create.mockResolvedValue({ id: 41 } as never);
  prismaMock.email_logs.findMany.mockResolvedValue([pendingLog] as never);
});

describe('future letter delivery Email', () => {
  it('delivers due letters and atomically creates one owner notification before enqueue', async () => {
    await futureLetterService.deliver(8);
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(prismaMock.future_letters.updateMany).toHaveBeenCalledWith({
      where: { id: 8, status: 'scheduled', deliver_at: { lte: expect.any(Date) } },
      data: expect.objectContaining({ status: 'delivered' }),
    });
    expect(prismaMock.email_logs.create).toHaveBeenCalledWith({ data: expect.objectContaining({
      user_id: 3, email_type: 'notification', entity_type: 'future_letter', entity_id: 8, email_code: 'FL01', status: 'pending', sent_at: null,
    }) });
    expect(add).toHaveBeenCalledWith('send', expect.objectContaining({
      to: 'owner@example.com', userId: 3, emailLogId: 41, trackingToken: 'tracking',
      subject: '你寫給自己的信，今天寄到囉',
      html: expect.stringContaining(`https://app-dev.daodao.so/me/footprints?futureLetterId=${letterId}`),
    }), { jobId: 'future-letter-email-41' });
    expect(add.mock.calls[0][1].html).toContain('Hello 小島,');
    expect(prismaMock.future_letters.findFirst).toHaveBeenCalledWith({
      where: { id: 8, user_id: 3, status: 'delivered' }, select: { external_id: true },
    });
  });

  it.each(['draft', 'deleted', 'delivered', 'not yet due'])('does not create a new notification for %s', async () => {
    prismaMock.future_letters.updateMany.mockResolvedValue({ count: 0 });
    prismaMock.email_logs.findMany.mockResolvedValue([]);
    await futureLetterService.deliver(8);
    expect(prismaMock.email_logs.create).not.toHaveBeenCalled();
    expect(add).not.toHaveBeenCalled();
  });

  it('still delivers for an owner without email without creating unusable outbox data', async () => {
    prismaMock.future_letters.findUnique.mockResolvedValue({ id: 8, user_id: 3, users: { contacts: null } } as never);
    prismaMock.email_logs.findMany.mockResolvedValue([]);
    await futureLetterService.deliver(8);
    expect(prismaMock.future_letters.updateMany).toHaveBeenCalled();
    expect(prismaMock.email_logs.create).not.toHaveBeenCalled();
    expect(add).not.toHaveBeenCalled();
  });

  it('keeps the committed pending notification when enqueue fails and repairs it on delivery retry', async () => {
    add.mockRejectedValueOnce(new Error('Redis unavailable'));
    await expect(futureLetterService.deliver(8)).rejects.toThrow('Redis unavailable');
    prismaMock.future_letters.updateMany.mockResolvedValue({ count: 0 });
    await futureLetterService.deliver(8);
    expect(prismaMock.email_logs.create).toHaveBeenCalledTimes(1);
    expect(add).toHaveBeenCalledTimes(2);
    expect(add.mock.calls.map(call => call[2].jobId)).toEqual(['future-letter-email-41', 'future-letter-email-41']);
    expect(prismaMock.email_logs.delete).not.toHaveBeenCalled();
  });

  it('uses the same queue identity for competing delivery retries and creates only one outbox', async () => {
    prismaMock.future_letters.updateMany.mockResolvedValueOnce({ count: 1 }).mockResolvedValue({ count: 0 });
    const queueJobs = new Map();
    add.mockImplementation(async (_name, data, options) => {
      if (!queueJobs.has(options.jobId)) queueJobs.set(options.jobId, data);
      return { id: options.jobId };
    });
    await Promise.all([futureLetterService.deliver(8), futureLetterService.deliver(8)]);
    expect(prismaMock.email_logs.create).toHaveBeenCalledTimes(1);
    expect(queueJobs.size).toBe(1);
  });

  it('restores only pending future letter notifications at startup', async () => {
    await expect(recoverPendingFutureLetterEmails()).resolves.toBe(1);
    expect(prismaMock.email_logs.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {
      email_type: 'notification', entity_type: 'future_letter', email_code: 'FL01', status: 'pending',
    } }));
  });

  it('skips a pending notification when its owner deleted the letter', async () => {
    prismaMock.future_letters.findFirst.mockResolvedValue(null);
    await expect(recoverPendingFutureLetterEmails()).resolves.toBe(0);
    expect(add).not.toHaveBeenCalled();
  });

  it('reports queue absence as retryable instead of losing the pending email', async () => {
    getEmailQueue.mockReturnValue(null);
    await expect(futureLetterService.deliver(8)).rejects.toThrow('Email queue is not initialized');
    expect(prismaMock.email_logs.create).toHaveBeenCalledTimes(1);
  });

  it('does not enqueue if the atomic notification write fails', async () => {
    prismaMock.email_logs.create.mockRejectedValue(new Error('Database write failed'));
    await expect(futureLetterService.deliver(8)).rejects.toThrow('Database write failed');
    expect(add).not.toHaveBeenCalled();
  });

  it('continues startup recovery after one notification cannot be queued', async () => {
    prismaMock.email_logs.findMany.mockResolvedValue([pendingLog, { ...pendingLog, id: 42, entity_id: 9 }] as never);
    add.mockRejectedValueOnce(new Error('First enqueue failed'));
    await expect(recoverPendingFutureLetterEmails()).resolves.toBe(1);
    expect(add).toHaveBeenCalledTimes(2);
    expect(add.mock.calls[1][2]).toEqual({ jobId: 'future-letter-email-42' });
  });

  it.each([undefined, 'javascript:alert(1)'])('keeps notification pending rather than mailing an invalid application link %s', async frontendUrl => {
    if (frontendUrl === undefined) delete process.env.FRONTEND_URL;
    else process.env.FRONTEND_URL = frontendUrl;
    await expect(futureLetterService.deliver(8)).rejects.toThrow();
    expect(add).not.toHaveBeenCalled();
    expect(prismaMock.email_logs.update).not.toHaveBeenCalled();
  });

  it('preserves PM copy, escapes the name, and never requires letter contents', () => {
    const template = generateFutureLetterEmail({ recipientName: '<script>name</script>', letterUrl: 'https://app.daodao.so/me/footprints?futureLetterId=example' });
    expect(template.subject).toBe('你寫給自己的信，今天寄到囉');
    expect(template.html).toContain('還記得你在那一天寫信給自己嗎？不論你現在是在低潮、迷茫、躊躇，或是正處於高峰，當時寫下的信，都是你和自己的深度連結！');
    expect(template.html).toContain('&lt;script&gt;name&lt;/script&gt;');
    expect(template.html).not.toContain('<script>name</script>');
  });
});
