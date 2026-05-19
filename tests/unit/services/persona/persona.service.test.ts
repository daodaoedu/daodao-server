/**
 * Persona Service Unit Tests
 *
 * 涵蓋範圍：
 * - 閘門邏輯（answeredCount < 5 / >= 5）
 * - carousel shouldShow 計算（新手期 / 一般用戶 session count / dismiss）
 * - skip suppressed 邏輯（第 3 次設 suppressed）
 */

import { prismaMock } from '@tests/utils/prisma-mock';

jest.mock('@/services/database/prisma.service', () => ({
  prisma: prismaMock,
}));

import { personaService } from '@/services/persona.service';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const NOW = new Date('2025-06-01T10:00:00Z');

beforeAll(() => {
  jest.useFakeTimers({ now: NOW });
});

afterAll(() => {
  jest.useRealTimers();
});

// ─── getPassportState ─────────────────────────────────────────────────────────

describe('personaService.getPassportState', () => {
  it('answeredCount < 5 → isLocked = true', async () => {
    prismaMock.$queryRaw.mockResolvedValueOnce([{ count: 3 }]);
    const result = await personaService.getPassportState(1);
    expect(result.isLocked).toBe(true);
    expect(result.answeredCount).toBe(3);
    expect(result.answersNeeded).toBe(2);
  });

  it('answeredCount === 5 → isLocked = false', async () => {
    prismaMock.$queryRaw.mockResolvedValueOnce([{ count: 5 }]);
    const result = await personaService.getPassportState(1);
    expect(result.isLocked).toBe(false);
    expect(result.answeredCount).toBe(5);
    expect(result.answersNeeded).toBe(0);
  });

  it('answeredCount > 5 → isLocked = false, answersNeeded = 0', async () => {
    prismaMock.$queryRaw.mockResolvedValueOnce([{ count: 8 }]);
    const result = await personaService.getPassportState(1);
    expect(result.isLocked).toBe(false);
    expect(result.answersNeeded).toBe(0);
  });
});

// ─── submitSkip (suppressed logic) ───────────────────────────────────────────

describe('personaService.submitSkip', () => {
  it('第 1 次 skip → suppressed = false', async () => {
    prismaMock.$queryRaw.mockResolvedValueOnce([{ skip_count: 1, suppressed: false }]);
    const result = await personaService.submitSkip(1, 1);
    expect(result.data.skipCount).toBe(1);
    expect(result.data.suppressed).toBe(false);
  });

  it('第 2 次 skip → suppressed = false', async () => {
    prismaMock.$queryRaw.mockResolvedValueOnce([{ skip_count: 2, suppressed: false }]);
    const result = await personaService.submitSkip(1, 1);
    expect(result.data.skipCount).toBe(2);
    expect(result.data.suppressed).toBe(false);
  });

  it('第 3 次 skip → suppressed = true', async () => {
    prismaMock.$queryRaw.mockResolvedValueOnce([{ skip_count: 3, suppressed: true }]);
    const result = await personaService.submitSkip(1, 1);
    expect(result.data.skipCount).toBe(3);
    expect(result.data.suppressed).toBe(true);
  });
});

// ─── getCarouselState ─────────────────────────────────────────────────────────

const makeQuestionRow = (id: number) => ({
  id,
  prompt: `問題 ${id}`,
  question_type: 'choice' as const,
  options: ['A', 'B'],
  is_new_user_priority: true,
  answered: false,
  skip_count: 0,
  suppressed: false,
});

describe('personaService.getCarouselState', () => {
  function setupCarousel({
    isNewUser,
    sessionCount,
    dismissedToday,
    unanswered,
    questions = [makeQuestionRow(1), makeQuestionRow(2)],
  }: {
    isNewUser: boolean;
    sessionCount: number;
    dismissedToday: boolean;
    unanswered: number;
    questions?: object[];
  }) {
    // users query (is_new_user)
    prismaMock.$queryRaw.mockResolvedValueOnce([{ is_new_user: isNewUser }]);
    // persona_user_state
    const lastDismissed = dismissedToday
      ? new Date(NOW.toISOString().split('T')[0] + 'T00:00:00Z')
      : new Date('2020-01-01T00:00:00Z');
    prismaMock.$queryRaw.mockResolvedValueOnce([
      { session_count_since_last_prompt: sessionCount, last_dismissed_at: lastDismissed },
    ]);
    // unanswered count
    prismaMock.$queryRaw.mockResolvedValueOnce([{ unanswered }]);
    // questions (only called when shouldShow = true)
    if (unanswered > 0) {
      prismaMock.$queryRaw.mockResolvedValueOnce(questions);
    }
    // upsert persona_user_state (only called when shouldShow = true)
    prismaMock.$executeRaw.mockResolvedValue(1);
  }

  describe('新手期用戶（created_at + 5 days > now）', () => {
    it('未 dismiss → shouldShow = true', async () => {
      setupCarousel({ isNewUser: true, sessionCount: 0, dismissedToday: false, unanswered: 3 });
      const result = await personaService.getCarouselState(1);
      expect(result.data.shouldShow).toBe(true);
      expect(result.data.questions.length).toBeGreaterThan(0);
    });

    it('今天已 dismiss → shouldShow = false', async () => {
      setupCarousel({ isNewUser: true, sessionCount: 0, dismissedToday: true, unanswered: 3 });
      const result = await personaService.getCarouselState(1);
      expect(result.data.shouldShow).toBe(false);
    });

    it('全部已答 (allAnswered) → shouldShow = false, allAnswered = true', async () => {
      setupCarousel({ isNewUser: true, sessionCount: 0, dismissedToday: false, unanswered: 0 });
      const result = await personaService.getCarouselState(1);
      expect(result.data.shouldShow).toBe(false);
      expect(result.data.allAnswered).toBe(true);
    });
  });

  describe('一般用戶', () => {
    it('sessionCount < 2 → shouldShow = false', async () => {
      setupCarousel({ isNewUser: false, sessionCount: 1, dismissedToday: false, unanswered: 3 });
      const result = await personaService.getCarouselState(1);
      expect(result.data.shouldShow).toBe(false);
    });

    it('sessionCount >= 2 → shouldShow = true', async () => {
      setupCarousel({ isNewUser: false, sessionCount: 2, dismissedToday: false, unanswered: 3 });
      const result = await personaService.getCarouselState(1);
      expect(result.data.shouldShow).toBe(true);
    });

    it('sessionCount >= 2 但今天已 dismiss → shouldShow = false', async () => {
      setupCarousel({ isNewUser: false, sessionCount: 5, dismissedToday: true, unanswered: 3 });
      const result = await personaService.getCarouselState(1);
      expect(result.data.shouldShow).toBe(false);
    });
  });

  it('shouldShow = true 時回傳至多 5 題', async () => {
    const manyQuestions = Array.from({ length: 5 }, (_, i) => makeQuestionRow(i + 1));
    setupCarousel({
      isNewUser: true,
      sessionCount: 0,
      dismissedToday: false,
      unanswered: 5,
      questions: manyQuestions,
    });
    const result = await personaService.getCarouselState(1);
    expect(result.data.questions.length).toBeLessThanOrEqual(5);
  });
});
