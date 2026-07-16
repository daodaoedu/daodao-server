import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { createPaginatedResponse, createSuccessResponse } from '../utils/response-helper';
import {
  addCurationCollectionItem,
  createCurationCollection,
  deleteCurationCollection,
  getContentPerformance,
  getCurationCollection,
  listCheckins as listCheckinsService,
  listCurationCollections,
  removeCurationCollectionItem,
  reorderCurationCollectionItems,
  setContentFeatured,
  updateCurationCollection,
} from '../services/admin-content.service';

const getPerformance = asyncHandler(async (req: Request, res: Response) => {
  const days = req.query.days ? Number(req.query.days) : undefined;
  const data = await getContentPerformance(days);
  res.json(createSuccessResponse(data));
});

const updateFeatured = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { featured, featuredStartAt, featuredEndAt } = req.body as {
    featured: boolean;
    featuredStartAt?: string | null;
    featuredEndAt?: string | null;
  };
  const item = await setContentFeatured(id, featured, { featuredStartAt, featuredEndAt });
  res.json(createSuccessResponse(item));
});

const getCheckins = asyncHandler(async (req: Request, res: Response) => {
  const days = req.query.days ? Number(req.query.days) : undefined;
  const limit = Math.max(1, Math.min(Number(req.query.limit) || 20, 100));
  const offset = Math.max(0, Number(req.query.offset) || 0);
  const result = await listCheckinsService(days, limit, offset);
  res.json(createPaginatedResponse(result.items, {
    currentPage: result.pagination.currentPage,
    totalPages: result.pagination.totalPages,
    totalItems: result.pagination.totalCount,
    itemsPerPage: result.pagination.limit,
    hasNext: result.pagination.hasNext,
    hasPrev: result.pagination.hasPrev,
  }));
});

// ── Curation Collections（策展合輯）─────────────────────────────

const listCollections = asyncHandler(async (_req: Request, res: Response) => {
  const collections = await listCurationCollections();
  res.json(createSuccessResponse(collections));
});

const getCollection = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const collection = await getCurationCollection(id);
  res.json(createSuccessResponse(collection));
});

const createCollection = asyncHandler(async (req: Request, res: Response) => {
  const { name, description } = req.body as { name: string; description?: string | null };
  const collection = await createCurationCollection(name, description);
  res.status(201).json(createSuccessResponse(collection));
});

const updateCollection = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { name, description } = req.body as { name?: string; description?: string | null };
  const collection = await updateCurationCollection(id, { name, description });
  res.json(createSuccessResponse(collection));
});

const deleteCollection = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await deleteCurationCollection(id);
  res.json(createSuccessResponse({ deleted: true, id }));
});

const addCollectionItem = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { practiceId } = req.body as { practiceId: number };
  const collection = await addCurationCollectionItem(id, Number(practiceId));
  res.status(201).json(createSuccessResponse(collection));
});

const removeCollectionItem = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const itemId = Number(req.params.itemId);
  const collection = await removeCurationCollectionItem(id, itemId);
  res.json(createSuccessResponse(collection));
});

const reorderCollectionItems = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { itemIds } = req.body as { itemIds: number[] };
  const collection = await reorderCurationCollectionItems(id, (itemIds ?? []).map(Number));
  res.json(createSuccessResponse(collection));
});

export default {
  getPerformance,
  updateFeatured,
  getCheckins,
  listCollections,
  getCollection,
  createCollection,
  updateCollection,
  deleteCollection,
  addCollectionItem,
  removeCollectionItem,
  reorderCollectionItems,
};
