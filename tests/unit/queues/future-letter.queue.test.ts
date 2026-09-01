import { removeFutureLetterJob, scheduleFutureLetterDelivery, setFutureLetterQueue } from '@/queues/future-letter.queue';

describe('future letter queue', () => {
  it('uses a deterministic job id and non-negative delay', async () => {
    const add = jest.fn().mockResolvedValue({ id: 'future-letter-12' });
    const remove = jest.fn().mockResolvedValue(1);
    const getJob = jest.fn().mockResolvedValue(undefined);
    setFutureLetterQueue({ add, remove, getJob } as never);
    await scheduleFutureLetterDelivery(12, -5);
    expect(add).toHaveBeenCalledWith('deliver', { letterId: 12 }, { jobId: 'future-letter-12', delay: 0 });
  });

  it('removes a pending job by its deterministic id', async () => {
    const add = jest.fn();
    const remove = jest.fn().mockResolvedValue(1);
    const getJob = jest.fn();
    setFutureLetterQueue({ add, remove, getJob } as never);
    await removeFutureLetterJob(12);
    expect(remove).toHaveBeenCalledWith('future-letter-12');
  });

  it.each(['failed', 'completed'])('removes a retained %s job before re-enqueueing it', async state => {
    const getState = jest.fn().mockResolvedValue(state);
    const add = jest.fn().mockResolvedValue({ id: 'future-letter-12' });
    const remove = jest.fn().mockResolvedValue(1);
    const getJob = jest.fn().mockResolvedValue({ getState });
    setFutureLetterQueue({ add, getJob, remove } as never);

    await scheduleFutureLetterDelivery(12, 5000);

    expect(remove).toHaveBeenCalledWith('future-letter-12');
    expect(add).toHaveBeenCalledWith('deliver', { letterId: 12 }, { jobId: 'future-letter-12', delay: 5000 });
  });

  it('re-enqueues when concurrent recovery makes the retained failed job unavailable', async () => {
    const add = jest.fn().mockResolvedValue({ id: 'future-letter-12' });
    const remove = jest.fn().mockResolvedValue(0);
    const getJob = jest.fn().mockResolvedValue({
      getState: jest.fn().mockResolvedValue('failed'),
    });
    setFutureLetterQueue({ add, getJob, remove } as never);

    await expect(scheduleFutureLetterDelivery(12, 5000)).resolves.toBeUndefined();

    expect(remove).toHaveBeenCalledWith('future-letter-12');
    expect(add).toHaveBeenCalledWith('deliver', { letterId: 12 }, { jobId: 'future-letter-12', delay: 5000 });
  });

  it('re-enqueues when the job disappears before its state is read', async () => {
    const add = jest.fn().mockResolvedValue({ id: 'future-letter-12' });
    const remove = jest.fn();
    const getJob = jest.fn().mockResolvedValue({
      getState: jest.fn().mockResolvedValue('unknown'),
    });
    setFutureLetterQueue({ add, getJob, remove } as never);

    await scheduleFutureLetterDelivery(12, 5000);

    expect(remove).not.toHaveBeenCalled();
    expect(add).toHaveBeenCalledWith('deliver', { letterId: 12 }, { jobId: 'future-letter-12', delay: 5000 });
  });

  it('keeps an existing delayed job instead of creating a duplicate', async () => {
    const add = jest.fn();
    const getJob = jest.fn().mockResolvedValue({
      getState: jest.fn().mockResolvedValue('delayed'),
      remove: jest.fn(),
    });
    setFutureLetterQueue({ add, getJob } as never);

    await scheduleFutureLetterDelivery(12, 5000);

    expect(add).not.toHaveBeenCalled();
  });
});
