import type { Job } from 'bullmq';
import type { EmailJobData } from '../email.queue';
import { prismaMock } from '../../../tests/utils/prisma-mock';

let mockProcessor: (job: Job<EmailJobData>) => Promise<void>;
const mockAdd = jest.fn();
const mockRetryFailedEmails = jest.fn();
const mockSendEmail = jest.fn();

jest.mock('bullmq', () => ({
  Worker: jest.fn().mockImplementation((_name, processor) => {
    mockProcessor = processor;
    return { on: jest.fn() };
  }),
}));
jest.mock('../connection', () => ({ getQueueConnection: jest.fn(() => ({})) }));
jest.mock('../../services/database/prisma.service', () => ({ prisma: prismaMock }));
jest.mock('../email.queue', () => ({
  EMAIL_QUEUE_NAME: 'email-send',
  retryFailedEmails: () => mockRetryFailedEmails(),
  getEmailQueue: () => ({ add: mockAdd }),
}));
jest.mock('../../services/email/email.service', () => ({
  emailService: { sendEmail: (...args: unknown[]) => mockSendEmail(...args) },
}));

import { createEmailWorker } from '../email.worker';

const externalId = '550e8400-e29b-41d4-a716-446655440000';
const retryScanJob = { name: 'retry-scan', data: {} } as Job<EmailJobData>;

beforeEach(() => {
  jest.clearAllMocks();
  process.env.FRONTEND_URL = 'https://app-dev.daodao.so';
  mockRetryFailedEmails.mockResolvedValue({ retried: 1, failed: 0 });
  mockAdd.mockResolvedValue({ id: 'future-letter-email-41' });
  mockSendEmail.mockResolvedValue({ success: true });
  prismaMock.email_logs.findMany.mockResolvedValue([{
    id: 41, user_id: 3, entity_id: 8, tracking_token: 'tracking-token',
    users: { nickname: '小島', contacts: { email: 'owner@example.com' } },
  }] as never);
  prismaMock.future_letters.findFirst.mockResolvedValue({ external_id: externalId } as never);
  createEmailWorker();
});

describe('scheduled Email retry scan future-letter outbox recovery', () => {
  it('queues a committed pending owner notification while preserving failed Email retries', async () => {
    await mockProcessor(retryScanJob);

    expect(mockRetryFailedEmails).toHaveBeenCalledTimes(1);
    expect(mockAdd).toHaveBeenCalledWith('send', expect.objectContaining({
      to: 'owner@example.com', userId: 3, emailLogId: 41, trackingToken: 'tracking-token',
      subject: '你寫給自己的信，今天寄到囉',
      html: expect.stringContaining(`https://app-dev.daodao.so/me/footprints?futureLetterId=${externalId}`),
    }), { jobId: 'future-letter-email-41' });
    expect(prismaMock.email_logs.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {
      email_type: 'notification', entity_type: 'future_letter', email_code: 'FL01', status: 'pending',
    } }));
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it('repairs a pending notification on the next scan after a Redis outage without process restart', async () => {
    mockAdd.mockRejectedValueOnce(new Error('Redis unavailable'));
    await mockProcessor(retryScanJob);
    expect(prismaMock.email_logs.update).not.toHaveBeenCalled();

    await mockProcessor(retryScanJob);
    expect(mockRetryFailedEmails).toHaveBeenCalledTimes(2);
    expect(mockAdd).toHaveBeenCalledTimes(2);
    expect(mockAdd.mock.calls.map(call => call[2].jobId)).toEqual(['future-letter-email-41', 'future-letter-email-41']);
    await expect(mockAdd.mock.results[1].value).resolves.toEqual({ id: 'future-letter-email-41' });
  });

  it('keeps normal Email jobs on their existing sending path without scanning the outbox', async () => {
    await mockProcessor({
      name: 'send', id: 'normal-email', attemptsMade: 0,
      data: { to: 'ordinary@example.com', subject: 'Ordinary Email', html: '<p>Hello</p>' },
    } as Job<EmailJobData>);

    expect(mockSendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: 'ordinary@example.com', subject: 'Ordinary Email' }));
    expect(mockRetryFailedEmails).not.toHaveBeenCalled();
    expect(prismaMock.email_logs.findMany).not.toHaveBeenCalled();
    expect(mockAdd).not.toHaveBeenCalled();
  });
});
