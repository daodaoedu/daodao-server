/**
 * Wish Service Unit Tests
 *
 * - createWish：未填 contact_email 時取帳號 email
 * - linkToItem：other 分類未填 internal_module_tag → 400；建立 wish_link 並 +1；已投票者不重複計數
 */

import { prismaMock, setupTransactionMock } from '@tests/utils/prisma-mock';

jest.mock('@/services/database/prisma.service', () => ({ prisma: prismaMock }));
jest.mock('@/services/logging/logger.service', () => ({
  loggerService: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

const mockNotifyWishLinked = jest.fn().mockResolvedValue(undefined);
jest.mock('@/services/wishpool-notification.service', () => ({
  notifyWishLinked: (...args: unknown[]) => mockNotifyWishLinked(...args),
}));

import { createWish, linkToItem } from '@/services/wish.service';
import { BadRequestError } from '@/middleware/error.middleware';

describe('Wish Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupTransactionMock();
  });

  describe('createWish', () => {
    it('未填 contact_email 時取帳號 email', async () => {
      prismaMock.users.findUnique.mockResolvedValue({ contacts: { email: 'acct@daodao.so' } } as never);
      prismaMock.wishes.create.mockResolvedValue({ id: 100 } as never);

      const res = await createWish(
        { category: 'practice', situation: '情境描述至少十個字喔喔', desire: '期待' },
        42,
      );

      expect(prismaMock.wishes.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ submitter_user_id: 42, contact_email: 'acct@daodao.so' }),
        }),
      );
      expect(res.data).toEqual({ id: 100 });
    });
  });

  describe('linkToItem', () => {
    it('other 分類未填 internal_module_tag 時擋下 400', async () => {
      prismaMock.wishes.findUnique.mockResolvedValue({
        id: 1,
        category: 'other',
        submitter_user_id: 42,
        contact_email: null,
      } as never);

      await expect(linkToItem(1, { roadmap_item_id: 5 }, 99)).rejects.toBeInstanceOf(BadRequestError);
    });

    it('歸併：upsert wish_link support、以實際筆數寫回、wish→linked、發通知', async () => {
      prismaMock.wishes.findUnique.mockResolvedValue({
        id: 1,
        category: 'practice',
        submitter_user_id: 42,
        contact_email: 'w@daodao.so',
      } as never);
      prismaMock.roadmap_items.findUnique.mockResolvedValue({ id: 5, title: '深色模式' } as never);
      prismaMock.roadmap_item_supports.upsert.mockResolvedValue({ id: 1 } as never);
      prismaMock.roadmap_item_supports.count.mockResolvedValue(1 as never);
      prismaMock.roadmap_items.update.mockResolvedValue({ id: 5 } as never);
      prismaMock.wishes.update.mockResolvedValue({ id: 1 } as never);

      const res = await linkToItem(1, { roadmap_item_id: 5 }, 99);

      expect(prismaMock.roadmap_item_supports.upsert).toHaveBeenCalledWith({
        where: { roadmap_item_id_user_id: { roadmap_item_id: 5, user_id: 42 } },
        create: { roadmap_item_id: 5, user_id: 42, origin: 'wish_link' },
        update: {},
      });
      expect(prismaMock.roadmap_items.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: { support_count: 1 },
      });
      expect(prismaMock.wishes.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({ status: 'linked', linked_roadmap_item_id: 5 }),
        }),
      );
      expect(mockNotifyWishLinked).toHaveBeenCalled();
      expect(res.data).toEqual({ id: 1, linked_roadmap_item_id: 5 });
    });

    it('許願者已投票：upsert 無動作、票數以實際筆數為準（不重複計數）', async () => {
      prismaMock.wishes.findUnique.mockResolvedValue({
        id: 1,
        category: 'practice',
        submitter_user_id: 42,
        contact_email: null,
      } as never);
      prismaMock.roadmap_items.findUnique.mockResolvedValue({ id: 5, title: '深色模式' } as never);
      prismaMock.roadmap_item_supports.upsert.mockResolvedValue({ id: 7 } as never);
      prismaMock.roadmap_item_supports.count.mockResolvedValue(1 as never);
      prismaMock.roadmap_items.update.mockResolvedValue({ id: 5 } as never);
      prismaMock.wishes.update.mockResolvedValue({ id: 1 } as never);

      await linkToItem(1, { roadmap_item_id: 5 }, 99);

      expect(prismaMock.roadmap_item_supports.upsert).toHaveBeenCalled();
      expect(prismaMock.roadmap_items.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: { support_count: 1 },
      });
      expect(prismaMock.wishes.update).toHaveBeenCalled();
    });
  });
});
