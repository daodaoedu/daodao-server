/**
 * 靈感卡服務（openspec: challenge-inspiration-deck）
 *
 * 參與者端：每日抽卡（上限 3 次、排除本日已抽與曾選定的卡）、選定今日卡片。
 * 管理端：卡組 CRUD／複製、卡片管理、Excel 匯入、指派給共同挑戰。
 * 日界一律 Asia/Taipei。
 */

import { BadRequestError, ConflictError, ForbiddenError, NotFoundError, TooManyRequestsError } from '../middleware/error.middleware';
import { prisma } from './database/prisma.service';
import { isChallengeCohort, isChallengeParticipant } from './challenge-acl.service';

const DAILY_DRAW_LIMIT = 3;
const CARD_CONTENT_MAX = 50;
const TAIPEI_OFFSET_MS = 8 * 60 * 60 * 1000;

/** 今天的台北日曆日（存成 UTC 零點的 Date，對齊 @db.Date 欄位） */
const taipeiToday = (now = new Date()): Date => {
  const shifted = new Date(now.getTime() + TAIPEI_OFFSET_MS);
  return new Date(`${shifted.toISOString().slice(0, 10)}T00:00:00Z`);
};

/** 參與者資格檢查：僅挑戰參與者可抽卡 */
const assertParticipant = async (cohortId: number, userId: number): Promise<void> => {
  if (!(await isChallengeCohort(cohortId))) throw new NotFoundError('找不到共同挑戰');
  if (!(await isChallengeParticipant(cohortId, userId))) {
    throw new ForbiddenError('加入挑戰後才能抽靈感卡');
  }
};

/** 今日抽卡現況：已抽的卡、剩餘次數、已選定的卡 */
const getTodayDraws = async (cohortId: number, userId: number, now = new Date()) => {
  await assertParticipant(cohortId, userId);
  const draws = await prisma.inspiration_draws.findMany({
    where: { cohort_id: cohortId, user_id: userId, drawn_on: taipeiToday(now) },
    select: { id: true, is_selected: true, card: { select: { id: true, content: true } } },
    orderBy: { id: 'asc' }
  });
  return {
    drawsUsed: draws.length,
    remaining: Math.max(0, DAILY_DRAW_LIMIT - draws.length),
    draws: draws.map(draw => ({ drawId: draw.id, cardId: draw.card.id, content: draw.card.content, isSelected: draw.is_selected })),
    selectedDrawId: draws.find(draw => draw.is_selected)?.id ?? null
  };
};

/** 抽一張卡：每日上限 3 次；排除本日已抽與此挑戰曾選定過的卡（FR-LK-01/02） */
const drawCard = async (cohortId: number, userId: number, now = new Date()) => {
  await assertParticipant(cohortId, userId);
  const today = taipeiToday(now);

  return prisma.$transaction(async tx => {
    const todayDraws = await tx.inspiration_draws.findMany({
      where: { cohort_id: cohortId, user_id: userId, drawn_on: today },
      select: { card_id: true }
    });
    if (todayDraws.length >= DAILY_DRAW_LIMIT) {
      throw new TooManyRequestsError('今天的三次抽卡都用完了，明天再來吧');
    }
    const everSelected = await tx.inspiration_draws.findMany({
      where: { cohort_id: cohortId, user_id: userId, is_selected: true },
      select: { card_id: true }
    });
    const excluded = new Set([...todayDraws, ...everSelected].map(row => row.card_id));

    const candidates = await tx.inspiration_deck_cards.findMany({
      where: {
        deleted_at: null,
        deck: { deleted_at: null, assignments: { some: { cohort_id: cohortId, unassigned_at: null } } },
        id: { notIn: [...excluded] }
      },
      select: { id: true, content: true }
    });
    if (candidates.length === 0) {
      throw new ConflictError('目前沒有可抽的卡片了');
    }
    const picked = candidates[Math.floor(Math.random() * candidates.length)];
    const draw = await tx.inspiration_draws.create({
      data: { cohort_id: cohortId, user_id: userId, card_id: picked.id, drawn_on: today },
      select: { id: true }
    });
    return {
      drawId: draw.id,
      cardId: picked.id,
      content: picked.content,
      remaining: DAILY_DRAW_LIMIT - todayDraws.length - 1
    };
  });
};

/** 選定今日使用的卡片：同日僅一張，重選會取代前一張 */
const selectDraw = async (cohortId: number, userId: number, drawId: number, now = new Date()) => {
  await assertParticipant(cohortId, userId);
  const today = taipeiToday(now);
  const draw = await prisma.inspiration_draws.findFirst({
    where: { id: drawId, cohort_id: cohortId, user_id: userId, drawn_on: today },
    select: { id: true }
  });
  if (!draw) throw new NotFoundError('找不到今天的這次抽卡');

  await prisma.$transaction([
    prisma.inspiration_draws.updateMany({
      where: { cohort_id: cohortId, user_id: userId, drawn_on: today, is_selected: true },
      data: { is_selected: false }
    }),
    prisma.inspiration_draws.update({ where: { id: drawId }, data: { is_selected: true } })
  ]);
  return { drawId, isSelected: true };
};

// ============================================================================
// 管理端（admin）
// ============================================================================

const deckSummarySelect = {
  id: true,
  name: true,
  created_at: true,
  updated_at: true,
  _count: { select: { cards: { where: { deleted_at: null } } } },
  assignments: {
    where: { unassigned_at: null },
    select: { cohort_id: true, cohort: { select: { display_name: true } } }
  }
} as const;

type DeckRow = {
  id: number;
  name: string;
  created_at: Date;
  updated_at: Date | null;
  _count: { cards: number };
  assignments: Array<{ cohort_id: number; cohort: { display_name: string } }>;
};

const toDeckSummary = (deck: DeckRow) => ({
  id: deck.id,
  name: deck.name,
  cardCount: deck._count.cards,
  assignments: deck.assignments.map(assignment => ({ cohortId: assignment.cohort_id, cohortName: assignment.cohort.display_name })),
  createdAt: deck.created_at,
  updatedAt: deck.updated_at
});

/** 卡組列表（未刪除，含卡片數與指派狀況） */
const listDecks = async () => {
  const decks = await prisma.inspiration_decks.findMany({
    where: { deleted_at: null },
    select: deckSummarySelect,
    orderBy: { created_at: 'desc' }
  });
  return decks.map(toDeckSummary);
};

/** 卡組詳情（含卡片） */
const getDeck = async (deckId: number) => {
  const deck = await prisma.inspiration_decks.findFirst({
    where: { id: deckId, deleted_at: null },
    select: {
      ...deckSummarySelect,
      cards: { where: { deleted_at: null }, select: { id: true, content: true, sort_order: true }, orderBy: [{ sort_order: 'asc' }, { id: 'asc' }] }
    }
  });
  if (!deck) throw new NotFoundError('找不到卡組');
  return {
    ...toDeckSummary(deck),
    cards: deck.cards.map(card => ({ id: card.id, content: card.content, sortOrder: card.sort_order }))
  };
};

/** 建立卡組（可同時附初始卡片） */
const createDeck = async (name: string, cardContents: string[], createdBy: number) => {
  const deck = await prisma.inspiration_decks.create({
    data: {
      name,
      created_by: createdBy,
      cards: { create: cardContents.map((content, index) => ({ content, sort_order: index })) }
    },
    select: { id: true }
  });
  return getDeck(deck.id);
};

/** 更新卡組名稱 */
const updateDeck = async (deckId: number, name: string) => {
  await getDeck(deckId);
  await prisma.inspiration_decks.update({ where: { id: deckId }, data: { name, updated_at: new Date() } });
  return getDeck(deckId);
};

/** 軟刪除卡組（既有抽卡記錄保留） */
const deleteDeck = async (deckId: number): Promise<void> => {
  await getDeck(deckId);
  const now = new Date();
  // 軟刪同時解除仍生效的指派，避免探索頁顯示抽卡入口卻抽不到卡
  await prisma.$transaction([
    prisma.inspiration_deck_assignments.updateMany({ where: { deck_id: deckId, unassigned_at: null }, data: { unassigned_at: now } }),
    prisma.inspiration_decks.update({ where: { id: deckId }, data: { deleted_at: now } })
  ]);
};

/** 複製卡組（含卡片，不含指派） */
const duplicateDeck = async (deckId: number, createdBy: number) => {
  const source = await getDeck(deckId);
  return createDeck(`${source.name}（複製）`, source.cards.map(card => card.content), createdBy);
};

/** 新增單張卡片 */
const addCard = async (deckId: number, content: string) => {
  await getDeck(deckId);
  const maxSort = await prisma.inspiration_deck_cards.aggregate({
    where: { deck_id: deckId, deleted_at: null },
    _max: { sort_order: true }
  });
  const card = await prisma.inspiration_deck_cards.create({
    data: { deck_id: deckId, content, sort_order: (maxSort._max.sort_order ?? -1) + 1 },
    select: { id: true, content: true, sort_order: true }
  });
  return { id: card.id, content: card.content, sortOrder: card.sort_order };
};

/** 更新卡片內容 */
const updateCard = async (deckId: number, cardId: number, content: string) => {
  const card = await prisma.inspiration_deck_cards.findFirst({ where: { id: cardId, deck_id: deckId, deleted_at: null }, select: { id: true } });
  if (!card) throw new NotFoundError('找不到卡片');
  await prisma.inspiration_deck_cards.update({ where: { id: cardId }, data: { content, updated_at: new Date() } });
  return { id: cardId, content };
};

/** 軟刪除卡片 */
const deleteCard = async (deckId: number, cardId: number): Promise<void> => {
  const card = await prisma.inspiration_deck_cards.findFirst({ where: { id: cardId, deck_id: deckId, deleted_at: null }, select: { id: true } });
  if (!card) throw new NotFoundError('找不到卡片');
  await prisma.inspiration_deck_cards.update({ where: { id: cardId }, data: { deleted_at: new Date() } });
};

/**
 * Excel 匯入卡片（FR-LK-05）：取第一個工作表第一欄的文字為卡片內容。
 * 首列若為表頭（「內容」「卡片內容」）自動略過；超過 50 字的列回報錯誤不匯入。
 */
const importCardsFromExcel = async (deckId: number, fileBuffer: Buffer) => {
  await getDeck(deckId);
  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(fileBuffer as unknown as ArrayBuffer);
  } catch {
    throw new BadRequestError('無法讀取 Excel 檔案，請確認為 .xlsx 格式');
  }
  const worksheet = workbook.worksheets[0];
  if (!worksheet) throw new BadRequestError('Excel 檔案沒有工作表');

  const contents: string[] = [];
  const errors: Array<{ row: number; reason: string }> = [];
  worksheet.eachRow((row, rowNumber) => {
    const raw = row.getCell(1).text?.trim() ?? '';
    if (raw === '') return;
    if (rowNumber === 1 && ['內容', '卡片內容', 'content'].includes(raw.toLowerCase())) return;
    if (raw.length > CARD_CONTENT_MAX) {
      errors.push({ row: rowNumber, reason: `超過 ${CARD_CONTENT_MAX} 字（${raw.length} 字）` });
      return;
    }
    contents.push(raw);
  });
  if (contents.length === 0 && errors.length === 0) throw new BadRequestError('Excel 檔案沒有可匯入的卡片內容');

  const maxSort = await prisma.inspiration_deck_cards.aggregate({
    where: { deck_id: deckId, deleted_at: null },
    _max: { sort_order: true }
  });
  const base = (maxSort._max.sort_order ?? -1) + 1;
  await prisma.inspiration_deck_cards.createMany({
    data: contents.map((content, index) => ({ deck_id: deckId, content, sort_order: base + index }))
  });
  return { imported: contents.length, errors };
};

/** 指派卡組給共同挑戰（assign 後挑戰卡片顯示抽卡 icon）；重新指派會復用既有記錄 */
const assignDeck = async (deckId: number, cohortId: number) => {
  await getDeck(deckId);
  if (!(await isChallengeCohort(cohortId))) throw new BadRequestError('僅能指派給共同挑戰的期');
  await prisma.inspiration_deck_assignments.upsert({
    where: { deck_id_cohort_id: { deck_id: deckId, cohort_id: cohortId } },
    create: { deck_id: deckId, cohort_id: cohortId },
    update: { unassigned_at: null, assigned_at: new Date() }
  });
  return { deckId, cohortId, assigned: true };
};

/** 解除指派（以 unassigned_at 標記，保留歷程） */
const unassignDeck = async (deckId: number, cohortId: number) => {
  const assignment = await prisma.inspiration_deck_assignments.findUnique({
    where: { deck_id_cohort_id: { deck_id: deckId, cohort_id: cohortId } },
    select: { id: true, unassigned_at: true }
  });
  if (!assignment || assignment.unassigned_at !== null) throw new NotFoundError('找不到有效的指派');
  await prisma.inspiration_deck_assignments.update({ where: { id: assignment.id }, data: { unassigned_at: new Date() } });
  return { deckId, cohortId, assigned: false };
};

export const inspirationDeckService = {
  getTodayDraws,
  drawCard,
  selectDraw,
  listDecks,
  getDeck,
  createDeck,
  updateDeck,
  deleteDeck,
  duplicateDeck,
  addCard,
  updateCard,
  deleteCard,
  importCardsFromExcel,
  assignDeck,
  unassignDeck
};
