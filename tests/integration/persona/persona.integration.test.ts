/**
 * Persona API Integration Tests
 *
 * 涵蓋範圍：
 * - POST /answers upsert (新增 201 / 更新 200)
 * - POST /answers 空字串 → 400
 * - POST /reactions persona_answer 共鳴與重複冪等 → 200
 * - POST /carousel-dismiss 後 GET /carousel-state 回 shouldShow = false
 * - GET /profile/:userId 訪客 isLocked 回傳正確 answersNeeded
 * - POST /questions/:questionId/view 記錄觀看（401 / 404 / 200）
 */

import { prismaMock } from '@tests/utils/prisma-mock';
import { createAuthToken } from '@tests/utils/api-helpers';
import { getTestApp } from '@tests/utils/test-app';
import request from 'supertest';
import type { Application } from 'express';

jest.mock('@/services/database/prisma.service', () => ({
  prisma: prismaMock,
}));

jest.mock('@/services/logging/logger.service', () => ({
  loggerService: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

// Mock redis — view tracking 用它做 24h 去重（factory 不可引用外部變數，hoisting）
jest.mock('@/services/database/redis.service', () => {
  const redisMock = { set: jest.fn() };
  return { __esModule: true, default: redisMock, redis: redisMock };
});

let app: Application;
let token: string;
const userId = 42;
const API = '/api/v1/persona';

beforeAll(async () => {
  app = await getTestApp();
});

beforeEach(() => {
  jest.clearAllMocks();
  token = createAuthToken({ id: userId, email: 'user@test.com' });
});

const auth = (req: request.Test) => req.set('Authorization', `Bearer ${token}`);

// eslint-disable-next-line @typescript-eslint/no-require-imports
const redisMock = jest.requireMock('@/services/database/redis.service').default as { set: jest.Mock };

// ─── POST /answers ─────────────────────────────────────────────────────────

describe('POST /answers', () => {
  const answerRow = {
    id: 1,
    user_id: userId,
    question_id: 1,
    selected_value: '看影片教學',
    text_answer: null,
    resonance_count: 0,
    created_at: new Date('2025-01-01T00:00:00Z'),
    updated_at: null,
  };

  it('新增答案 → 201', async () => {
    // No existing answer
    prismaMock.$queryRaw.mockResolvedValueOnce([]);
    // Insert result
    prismaMock.$queryRaw.mockResolvedValueOnce([answerRow]);

    const res = await auth(
      request(app).post(`${API}/answers`).send({ questionId: 1, selectedValue: '看影片教學' })
    );

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.selectedValue).toBe('看影片教學');
  });

  it('更新答案 → 200', async () => {
    // Existing answer found
    prismaMock.$queryRaw.mockResolvedValueOnce([answerRow]);
    // Upsert result (updated)
    prismaMock.$queryRaw.mockResolvedValueOnce([{ ...answerRow, selected_value: 'PDF 閱讀', updated_at: new Date() }]);

    const res = await auth(
      request(app).post(`${API}/answers`).send({ questionId: 1, selectedValue: 'PDF 閱讀' })
    );

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('selectedValue 和 textAnswer 均未提供 → 400', async () => {
    const res = await auth(
      request(app).post(`${API}/answers`).send({ questionId: 1 })
    );

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('未授權 → 401', async () => {
    const res = await request(app).post(`${API}/answers`).send({ questionId: 1, selectedValue: 'A' });
    expect(res.status).toBe(401);
  });
});

// Persona reactions use the shared reaction endpoint and its idempotent upsert.
describe('POST /reactions — persona_answer', () => {
  it.each([false, true])('共鳴（existing=%s）→ 200 且只有一筆共鳴', async (existing) => {
    const reaction = { id: 5, reaction_type: 'touched', users: { nickname: '小島' } };
    prismaMock.reactions.findUnique
      .mockResolvedValueOnce(existing ? reaction as never : null)
      .mockResolvedValueOnce(reaction as never);
    prismaMock.reactions.findMany.mockResolvedValue([reaction] as never);
    prismaMock.reactions.upsert.mockResolvedValue(reaction as never);
    // Use the answer owner to keep notification dispatch outside this contract.
    prismaMock.persona_answers.findUnique.mockResolvedValue({ user_id: userId, question_id: 1 } as never);

    const res = await auth(
      request(app).post('/api/v1/reactions').send({
        targetType: 'persona_answer', targetId: '10', reactionType: 'touched',
      })
    );

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.currentUserReaction).toBe('touched');
    expect(res.body.data.reactions).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'touched', count: 1 }),
    ]));
    expect(prismaMock.reactions.upsert).toHaveBeenCalledWith({
      where: { target_type_target_id_user_id: { target_type: 'persona_answer', target_id: 10, user_id: userId } },
      create: { target_type: 'persona_answer', target_id: 10, user_id: userId, reaction_type: 'touched' },
      update: { reaction_type: 'touched' },
    });
    expect(prismaMock.reactions.upsert).toHaveBeenCalledTimes(1);
  });
});

// ─── Carousel dismiss then shouldShow = false ──────────────────────────────

describe('POST /carousel-dismiss then GET /carousel-state', () => {
  it('dismiss 後同日 carousel-state 回 shouldShow = false', async () => {
    // Dismiss
    prismaMock.$executeRaw.mockResolvedValue(1);
    const dismissRes = await auth(request(app).post(`${API}/carousel-dismiss`));
    expect(dismissRes.status).toBe(200);
    expect(dismissRes.body.data.dismissed).toBe(true);

    // Carousel state — dismissed today
    prismaMock.$queryRaw
      .mockResolvedValueOnce([{ dismissed_today: true }]);

    const stateRes = await auth(
      request(app).get(`${API}/carousel-state`)
    );

    expect(stateRes.status).toBe(200);
    expect(stateRes.body.data.shouldShow).toBe(false);
  });
});

// ─── GET /profile/:userId — isLocked ──────────────────────────────────────

describe('GET /profile/:userId', () => {
  it('requesterId < 5 answers → viewerIsLocked = true, answersNeeded 正確', async () => {
    const targetUserId = '550e8400-e29b-41d4-a716-446655440099';
    prismaMock.users.findFirst.mockResolvedValue({ id: 99 } as never);
    // answered questions for target user
    prismaMock.$queryRaw.mockResolvedValueOnce([
      {
        id: 1,
        prompt: '你最喜歡哪種學習方式？',
        question_type: 'choice',
        options: ['A', 'B'],
        is_new_user_priority: true,
        answer_id: 10,
        selected_value: '看影片',
        text_answer: null,
        resonance_count: 2,
        answer_created_at: new Date('2025-01-01'),
        answer_updated_at: null,
      },
    ]);
    // requester answered count = 3 (locked)
    prismaMock.$queryRaw.mockResolvedValueOnce([{ count: 3 }]);

    const res = await auth(
      request(app).get(`${API}/profile/${targetUserId}`)
    );

    expect(res.status).toBe(200);
    expect(res.body.data.viewerIsLocked).toBe(true);
    expect(res.body.data.answersNeeded).toBe(2); // 5 - 3
  });

  it('訪客（未登入）→ 無 viewerIsLocked 欄位', async () => {
    const targetUserId = '550e8400-e29b-41d4-a716-446655440099';
    prismaMock.users.findFirst.mockResolvedValue({ id: 99 } as never);
    prismaMock.$queryRaw.mockResolvedValueOnce([
      {
        id: 1,
        prompt: '問題',
        question_type: 'choice',
        options: [],
        is_new_user_priority: false,
        answer_id: 10,
        selected_value: '答案',
        text_answer: null,
        resonance_count: 0,
        answer_created_at: new Date(),
        answer_updated_at: null,
      },
    ]);

    const res = await request(app).get(`${API}/profile/${targetUserId}`);

    expect(res.status).toBe(200);
    expect(res.body.data.viewerIsLocked).toBeUndefined();
    expect(res.body.data.answersNeeded).toBeUndefined();
  });
});

// ─── POST /questions/:questionId/view ─────────────────────────────────────────

describe('POST /questions/:questionId/view', () => {
  it('未授權 → 401', async () => {
    const res = await request(app).post(`${API}/questions/1/view`);

    expect(res.status).toBe(401);
  });

  it('題目不存在 → 404', async () => {
    prismaMock.persona_questions.findUnique.mockResolvedValueOnce(null);

    const res = await auth(request(app).post(`${API}/questions/999/view`));

    expect(res.status).toBe(404);
  });

  it('首次觀看 → 200 並回傳累計觀看數', async () => {
    prismaMock.persona_questions.findUnique.mockResolvedValueOnce({ id: 1 } as never);
    redisMock.set.mockResolvedValueOnce('OK');
    prismaMock.entity_stats.upsert.mockResolvedValueOnce({ view_count: 5 } as never);
    prismaMock.interaction_events.create.mockResolvedValueOnce({ id: 1 } as never);

    const res = await auth(request(app).post(`${API}/questions/1/view`));

    expect(res.status).toBe(200);
    expect(res.body.data.viewCount).toBe(5);
    expect(prismaMock.interaction_events.create).toHaveBeenCalledWith({
      data: { entity_type: 'persona_question', entity_id: 1, user_id: userId, event_type: 'view' },
    });
  });

  it('24h 內重複觀看 → 不重複計數，回傳現有觀看數', async () => {
    prismaMock.persona_questions.findUnique.mockResolvedValueOnce({ id: 1 } as never);
    redisMock.set.mockResolvedValueOnce(null); // SETNX 失敗＝已存在
    prismaMock.entity_stats.findUnique.mockResolvedValueOnce({ view_count: 5 } as never);

    const res = await auth(request(app).post(`${API}/questions/1/view`));

    expect(res.status).toBe(200);
    expect(res.body.data.viewCount).toBe(5);
    expect(prismaMock.entity_stats.upsert).not.toHaveBeenCalled();
    expect(prismaMock.interaction_events.create).not.toHaveBeenCalled();
  });
});
