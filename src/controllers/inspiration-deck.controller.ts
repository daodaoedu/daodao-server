import type { Request, Response } from 'express';
import { asyncHandler, BadRequestError, UnauthorizedError } from '../middleware/error.middleware';
import { inspirationDeckService } from '../services/inspiration-deck.service';
import { createSuccessResponse } from '../utils/response-helper';
import {
  assignResultResponseSchema,
  deckDetailResponseSchema,
  deckListResponseSchema,
  drawResultResponseSchema,
  importCardsResponseSchema,
  selectDrawResponseSchema,
  todayDrawsResponseSchema
} from '../validators/inspiration-deck.validator';

const requireUserId = (req: Request): number => {
  if (!req.user) throw new UnauthorizedError();
  return req.user.id;
};

// ── 參與者端 ─────────────────────────────────────────────

/** 今日抽卡現況 */
const todayDraws = asyncHandler(async (req: Request, res: Response) => {
  res.json(createSuccessResponse(todayDrawsResponseSchema.parse(
    await inspirationDeckService.getTodayDraws(Number(req.params.challengeId), requireUserId(req))
  )));
});

/** 抽一張卡 */
const draw = asyncHandler(async (req: Request, res: Response) => {
  res.status(201).json(createSuccessResponse(drawResultResponseSchema.parse(
    await inspirationDeckService.drawCard(Number(req.params.challengeId), requireUserId(req))
  )));
});

/** 選定今日卡片 */
const selectDraw = asyncHandler(async (req: Request, res: Response) => {
  res.json(createSuccessResponse(selectDrawResponseSchema.parse(
    await inspirationDeckService.selectDraw(Number(req.params.challengeId), requireUserId(req), Number(req.params.drawId))
  )));
});

// ── 管理端 ───────────────────────────────────────────────

const listDecks = asyncHandler(async (_req: Request, res: Response) => {
  res.json(createSuccessResponse(deckListResponseSchema.parse(await inspirationDeckService.listDecks())));
});

const getDeck = asyncHandler(async (req: Request, res: Response) => {
  res.json(createSuccessResponse(deckDetailResponseSchema.parse(await inspirationDeckService.getDeck(Number(req.params.deckId)))));
});

const createDeck = asyncHandler(async (req: Request, res: Response) => {
  res.status(201).json(createSuccessResponse(deckDetailResponseSchema.parse(
    await inspirationDeckService.createDeck(req.body.name, req.body.cards ?? [], requireUserId(req))
  )));
});

const updateDeck = asyncHandler(async (req: Request, res: Response) => {
  res.json(createSuccessResponse(deckDetailResponseSchema.parse(
    await inspirationDeckService.updateDeck(Number(req.params.deckId), req.body.name)
  )));
});

const deleteDeck = asyncHandler(async (req: Request, res: Response) => {
  await inspirationDeckService.deleteDeck(Number(req.params.deckId));
  res.json(createSuccessResponse({ deleted: true }));
});

const duplicateDeck = asyncHandler(async (req: Request, res: Response) => {
  res.status(201).json(createSuccessResponse(deckDetailResponseSchema.parse(
    await inspirationDeckService.duplicateDeck(Number(req.params.deckId), requireUserId(req))
  )));
});

const addCard = asyncHandler(async (req: Request, res: Response) => {
  res.status(201).json(createSuccessResponse(
    await inspirationDeckService.addCard(Number(req.params.deckId), req.body.content)
  ));
});

const updateCard = asyncHandler(async (req: Request, res: Response) => {
  res.json(createSuccessResponse(
    await inspirationDeckService.updateCard(Number(req.params.deckId), Number(req.params.cardId), req.body.content)
  ));
});

const deleteCard = asyncHandler(async (req: Request, res: Response) => {
  await inspirationDeckService.deleteCard(Number(req.params.deckId), Number(req.params.cardId));
  res.json(createSuccessResponse({ deleted: true }));
});

const importCards = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file?.buffer) throw new BadRequestError('請上傳 .xlsx 檔案（欄位 file）');
  res.json(createSuccessResponse(importCardsResponseSchema.parse(
    await inspirationDeckService.importCardsFromExcel(Number(req.params.deckId), req.file.buffer)
  )));
});

const assignDeck = asyncHandler(async (req: Request, res: Response) => {
  res.json(createSuccessResponse(assignResultResponseSchema.parse(
    await inspirationDeckService.assignDeck(Number(req.params.deckId), Number(req.body.cohortId))
  )));
});

const unassignDeck = asyncHandler(async (req: Request, res: Response) => {
  res.json(createSuccessResponse(assignResultResponseSchema.parse(
    await inspirationDeckService.unassignDeck(Number(req.params.deckId), Number(req.body.cohortId))
  )));
});

export const inspirationDeckController = {
  todayDraws,
  draw,
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
  importCards,
  assignDeck,
  unassignDeck
};
