/**
 * Practice Social Proof Service Unit Tests
 * Tests social proof toggle and status query logic in isolation
 *
 * Focus:
 *   - 同一使用者重複標記同一 type → action: 'removed'（取消）
 *   - 不同 type 各自獨立（insightful 不影響 referenced）
 * Mocks: All external dependencies (database)
 */

import { prismaMock } from '@tests/utils/prisma-mock';

// Mock external dependencies
jest.mock('@/services/database/prisma.service', () => ({
  prisma: prismaMock
}));

jest.mock('@/services/id-converter.service', () => ({
  externalToInternalId: jest.fn()
}));

import {
  toggleSocialProof,
  getSocialProofStatus,
  getSocialProofCounts
} from '@/services/practice-social-proof.service';

describe('Practice Social Proof Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test data factories
  const createMockSocialProof = (overrides = {}) => ({
    id: 1,
    practice_id: 10,
    actor_id: 20,
    type: 'insightful' as const,
    created_at: new Date('2024-01-01'),
    ...overrides
  });

  // ============================================================================
  // toggleSocialProof
  // ============================================================================

  describe('toggleSocialProof', () => {
    describe('新增標記', () => {
      it('當記錄不存在時，應新增並回傳 action: added', async () => {
        prismaMock.practice_social_proofs.findUnique.mockResolvedValue(null);
        prismaMock.practice_social_proofs.create.mockResolvedValue(
          createMockSocialProof()
        );

        const result = await toggleSocialProof(10, 20, 'insightful');

        expect(result).toEqual({ action: 'added' });
        expect(prismaMock.practice_social_proofs.create).toHaveBeenCalledWith({
          data: { practice_id: 10, actor_id: 20, type: 'insightful' }
        });
      });
    });

    describe('取消標記', () => {
      it('當記錄已存在時，應刪除並回傳 action: removed', async () => {
        const existing = createMockSocialProof({ id: 5 });
        prismaMock.practice_social_proofs.findUnique.mockResolvedValue(existing);
        prismaMock.practice_social_proofs.delete.mockResolvedValue(existing);

        const result = await toggleSocialProof(10, 20, 'insightful');

        expect(result).toEqual({ action: 'removed' });
        expect(prismaMock.practice_social_proofs.delete).toHaveBeenCalledWith({
          where: { id: 5 }
        });
        expect(prismaMock.practice_social_proofs.create).not.toHaveBeenCalled();
      });
    });

    describe('不同 type 各自獨立', () => {
      it('insightful 存在時，不影響 referenced 的新增', async () => {
        // insightful 已存在
        prismaMock.practice_social_proofs.findUnique.mockResolvedValueOnce(
          createMockSocialProof({ type: 'insightful' })
        );
        // referenced 不存在
        prismaMock.practice_social_proofs.findUnique.mockResolvedValueOnce(null);
        prismaMock.practice_social_proofs.delete.mockResolvedValue(createMockSocialProof());
        prismaMock.practice_social_proofs.create.mockResolvedValue(
          createMockSocialProof({ type: 'referenced' })
        );

        // toggle insightful → should remove
        const insightfulResult = await toggleSocialProof(10, 20, 'insightful');
        expect(insightfulResult).toEqual({ action: 'removed' });

        // toggle referenced → should add
        const referencedResult = await toggleSocialProof(10, 20, 'referenced');
        expect(referencedResult).toEqual({ action: 'added' });

        expect(prismaMock.practice_social_proofs.findUnique).toHaveBeenCalledWith({
          where: {
            practice_id_actor_id_type: {
              practice_id: 10,
              actor_id: 20,
              type: 'insightful'
            }
          }
        });
        expect(prismaMock.practice_social_proofs.findUnique).toHaveBeenCalledWith({
          where: {
            practice_id_actor_id_type: {
              practice_id: 10,
              actor_id: 20,
              type: 'referenced'
            }
          }
        });
      });

      it('三種 type 的查詢 key 各自不同', async () => {
        prismaMock.practice_social_proofs.findUnique.mockResolvedValue(null);
        prismaMock.practice_social_proofs.create.mockResolvedValue(createMockSocialProof());

        await toggleSocialProof(10, 20, 'insightful');
        await toggleSocialProof(10, 20, 'referenced');
        await toggleSocialProof(10, 20, 'witnessed');

        const calls = prismaMock.practice_social_proofs.findUnique.mock.calls;
        const types = calls.map(call => (call[0] as any).where.practice_id_actor_id_type.type);
        expect(types).toEqual(['insightful', 'referenced', 'witnessed']);
      });
    });
  });

  // ============================================================================
  // getSocialProofStatus
  // ============================================================================

  describe('getSocialProofStatus', () => {
    it('無任何標記時，三項皆為 false', async () => {
      prismaMock.practice_social_proofs.findMany.mockResolvedValue([]);

      const status = await getSocialProofStatus(10, 20);

      expect(status).toEqual({
        insightful: false,
        referenced: false,
        witnessed: false
      });
    });

    it('只有 insightful 時，只有 insightful 為 true', async () => {
      prismaMock.practice_social_proofs.findMany.mockResolvedValue([
        createMockSocialProof({ type: 'insightful' })
      ]);

      const status = await getSocialProofStatus(10, 20);

      expect(status).toEqual({
        insightful: true,
        referenced: false,
        witnessed: false
      });
    });

    it('三項都有標記時，三項皆為 true', async () => {
      prismaMock.practice_social_proofs.findMany.mockResolvedValue([
        createMockSocialProof({ type: 'insightful' }),
        createMockSocialProof({ type: 'referenced', id: 2 }),
        createMockSocialProof({ type: 'witnessed', id: 3 })
      ]);

      const status = await getSocialProofStatus(10, 20);

      expect(status).toEqual({
        insightful: true,
        referenced: true,
        witnessed: true
      });
    });
  });

  // ============================================================================
  // getSocialProofCounts
  // ============================================================================

  describe('getSocialProofCounts', () => {
    it('無任何標記時，三種計數皆為 0', async () => {
      prismaMock.practice_social_proofs.groupBy.mockResolvedValue([]);

      const counts = await getSocialProofCounts(10);

      expect(counts).toEqual({
        insightfulCount: 0,
        referencedCount: 0,
        witnessedCount: 0
      });
    });

    it('有部分標記時，正確回傳各類型計數', async () => {
      prismaMock.practice_social_proofs.groupBy.mockResolvedValue([
        { type: 'insightful', _count: { type: 5 } },
        { type: 'witnessed', _count: { type: 2 } }
      ] as any);

      const counts = await getSocialProofCounts(10);

      expect(counts).toEqual({
        insightfulCount: 5,
        referencedCount: 0,
        witnessedCount: 2
      });
    });
  });
});
