import { prismaMock, setupTransactionMock } from '@tests/utils/prisma-mock';

jest.mock('@/services/database/prisma.service', () => ({ prisma: prismaMock }));

import { inspirationDeckService } from '@/services/inspiration-deck.service';

/** 通過參與者資格檢查：cohort 是 challenge、使用者已加入 */
const setupParticipant = () => {
  prismaMock.cohorts.findUnique.mockResolvedValue({ program: { kind: 'challenge' } } as never);
  prismaMock.cohort_enrollments.findFirst.mockResolvedValue({ id: 26 } as never);
};

beforeEach(() => {
  setupTransactionMock();
});

describe('drawCard', () => {
  it('非參與者 403', async () => {
    prismaMock.cohorts.findUnique.mockResolvedValue({ program: { kind: 'challenge' } } as never);
    prismaMock.cohort_enrollments.findFirst.mockResolvedValue(null);
    await expect(inspirationDeckService.drawCard(6, 99)).rejects.toThrow('加入挑戰後才能抽靈感卡');
  });

  it('今日已抽 3 次 → 429 明天再來', async () => {
    setupParticipant();
    prismaMock.inspiration_draws.findMany.mockResolvedValueOnce([
      { card_id: 1 }, { card_id: 2 }, { card_id: 3 }
    ] as never);
    await expect(inspirationDeckService.drawCard(6, 325)).rejects.toThrow('明天再來');
  });

  it('抽卡排除本日已抽與曾選定的卡，並寫入抽卡記錄', async () => {
    setupParticipant();
    prismaMock.inspiration_draws.findMany
      .mockResolvedValueOnce([{ card_id: 1 }] as never)   // 今日已抽 card 1
      .mockResolvedValueOnce([{ card_id: 2 }] as never);  // 曾選定 card 2
    prismaMock.inspiration_deck_cards.findMany.mockResolvedValue([{ id: 3, content: '第三張卡' }] as never);
    prismaMock.inspiration_draws.create.mockResolvedValue({ id: 77 } as never);

    const result = await inspirationDeckService.drawCard(6, 325);
    expect(result).toMatchObject({ drawId: 77, cardId: 3, content: '第三張卡', remaining: 1 });

    const cardQuery = prismaMock.inspiration_deck_cards.findMany.mock.calls[0][0] as { where: { id: { notIn: number[] } } };
    expect(cardQuery.where.id.notIn.sort()).toEqual([1, 2]);
  });

  it('沒有可抽的卡 → 409', async () => {
    setupParticipant();
    prismaMock.inspiration_draws.findMany.mockResolvedValueOnce([] as never).mockResolvedValueOnce([] as never);
    prismaMock.inspiration_deck_cards.findMany.mockResolvedValue([]);
    await expect(inspirationDeckService.drawCard(6, 325)).rejects.toThrow('沒有可抽的卡片');
  });
});

describe('selectDraw', () => {
  it('選定時會先取消同日其他已選卡（同日僅一張）', async () => {
    setupParticipant();
    prismaMock.inspiration_draws.findFirst.mockResolvedValue({ id: 77 } as never);
    prismaMock.$transaction.mockResolvedValue([{}, {}] as never);

    const result = await inspirationDeckService.selectDraw(6, 325, 77);
    expect(result).toEqual({ drawId: 77, isSelected: true });
    expect(prismaMock.inspiration_draws.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ is_selected: true }),
      data: { is_selected: false }
    }));
    expect(prismaMock.inspiration_draws.update).toHaveBeenCalledWith({ where: { id: 77 }, data: { is_selected: true } });
  });

  it('選別人的或非今日的抽卡 → 404', async () => {
    setupParticipant();
    prismaMock.inspiration_draws.findFirst.mockResolvedValue(null);
    await expect(inspirationDeckService.selectDraw(6, 325, 999)).rejects.toThrow('找不到今天的這次抽卡');
  });
});
