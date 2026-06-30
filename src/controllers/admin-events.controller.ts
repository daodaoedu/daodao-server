/**
 * Admin 活動控制器
 * 處理活動 CRUD、報名管理、範本、錄影、提醒相關的 HTTP 請求
 */

import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { createSuccessResponse } from '../utils/response-helper';
import adminEventsService from '../services/admin-events.service';
import {
  createEventSchema,
  updateEventSchema,
  createTemplateSchema,
  uploadRecordingSchema,
  eventIdParamSchema,
  templateIdParamSchema,
  recordingIdParamSchema,
  eventFilterQuerySchema,
} from '../validators/admin-events.validator';

// ============================================================================
// Events CRUD
// ============================================================================

/**
 * 列出活動
 * GET /admin/events
 */
const listEvents = asyncHandler(async (req: Request, res: Response) => {
  const filter = eventFilterQuerySchema.parse(req.query);
  const events = await adminEventsService.listEvents(filter);
  res.json(createSuccessResponse(events));
});

/**
 * 建立活動
 * POST /admin/events
 */
const createEvent = asyncHandler(async (req: Request, res: Response) => {
  const input = createEventSchema.parse(req.body);
  const event = await adminEventsService.createEvent(input);
  res.status(201).json(createSuccessResponse(event));
});

/**
 * 更新活動
 * PUT /admin/events/:eventId
 */
const updateEvent = asyncHandler(async (req: Request, res: Response) => {
  const { eventId } = eventIdParamSchema.parse(req.params);
  const input = updateEventSchema.parse(req.body);
  const event = await adminEventsService.updateEvent(eventId, input);
  res.json(createSuccessResponse(event));
});

/**
 * 刪除活動
 * DELETE /admin/events/:eventId
 */
const deleteEvent = asyncHandler(async (req: Request, res: Response) => {
  const { eventId } = eventIdParamSchema.parse(req.params);
  await adminEventsService.deleteEvent(eventId);
  res.json(createSuccessResponse({ deleted: true, eventId }));
});

// ============================================================================
// RSVP & Check-in
// ============================================================================

/**
 * 取得活動報名列表
 * GET /admin/events/:eventId/rsvps
 */
const getRsvps = asyncHandler(async (req: Request, res: Response) => {
  const { eventId } = eventIdParamSchema.parse(req.params);
  const rsvps = await adminEventsService.getRsvps(eventId);
  res.json(createSuccessResponse(rsvps));
});

/**
 * 簽到用戶
 * POST /admin/events/:eventId/checkin
 */
const checkinUser = asyncHandler(async (req: Request, res: Response) => {
  const { eventId } = eventIdParamSchema.parse(req.params);
  const { userId } = req.body;
  const result = await adminEventsService.checkinUser(eventId, userId);
  res.json(createSuccessResponse(result));
});

// ============================================================================
// Analytics
// ============================================================================

/**
 * 取得活動分析數據
 * GET /admin/events/:eventId/analytics
 */
const getEventAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const { eventId } = eventIdParamSchema.parse(req.params);
  const analytics = await adminEventsService.getEventAnalytics(eventId);
  res.json(createSuccessResponse(analytics));
});

// ============================================================================
// Templates
// ============================================================================

/**
 * 列出活動範本
 * GET /admin/events/templates
 */
const listTemplates = asyncHandler(async (_req: Request, res: Response) => {
  const templates = await adminEventsService.listTemplates();
  res.json(createSuccessResponse(templates));
});

/**
 * 建立活動範本
 * POST /admin/events/templates
 */
const createTemplate = asyncHandler(async (req: Request, res: Response) => {
  const input = createTemplateSchema.parse(req.body);
  const template = await adminEventsService.createTemplate(input);
  res.status(201).json(createSuccessResponse(template));
});

/**
 * 從範本產生活動
 * POST /admin/events/templates/:templateId/generate
 */
const generateFromTemplate = asyncHandler(async (req: Request, res: Response) => {
  const { templateId } = templateIdParamSchema.parse(req.params);
  const event = await adminEventsService.generateFromTemplate(templateId);
  res.status(201).json(createSuccessResponse(event));
});

// ============================================================================
// Recordings
// ============================================================================

/**
 * 列出活動錄影
 * GET /admin/events/:eventId/recordings
 */
const listRecordings = asyncHandler(async (req: Request, res: Response) => {
  const { eventId } = eventIdParamSchema.parse(req.params);
  const recordings = await adminEventsService.listRecordings(eventId);
  res.json(createSuccessResponse(recordings));
});

/**
 * 上傳活動錄影
 * POST /admin/events/:eventId/recordings
 */
const uploadRecording = asyncHandler(async (req: Request, res: Response) => {
  const { eventId } = eventIdParamSchema.parse(req.params);
  const input = uploadRecordingSchema.parse(req.body);
  const recording = await adminEventsService.uploadRecording(eventId, input);
  res.status(201).json(createSuccessResponse(recording));
});

/**
 * 刪除活動錄影
 * DELETE /admin/events/recordings/:recordingId
 */
const deleteRecording = asyncHandler(async (req: Request, res: Response) => {
  const { recordingId } = recordingIdParamSchema.parse(req.params);
  await adminEventsService.deleteRecording(recordingId);
  res.json(createSuccessResponse({ deleted: true, recordingId }));
});

// ============================================================================
// Reminders
// ============================================================================

/**
 * 發送活動提醒
 * POST /admin/events/:eventId/remind
 */
const sendReminder = asyncHandler(async (req: Request, res: Response) => {
  const { eventId } = eventIdParamSchema.parse(req.params);
  const result = await adminEventsService.sendReminder(eventId);
  res.json(createSuccessResponse(result));
});

export default {
  listEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getRsvps,
  checkinUser,
  getEventAnalytics,
  listTemplates,
  createTemplate,
  generateFromTemplate,
  listRecordings,
  uploadRecording,
  deleteRecording,
  sendReminder,
};
