/**
 * Admin 報表與告警控制器
 * 處理排程報表、自訂報表、告警規則相關的 HTTP 請求
 */

import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { createSuccessResponse } from '../utils/response-helper';
import adminReportsService from '../services/admin-reports.service';
import {
  createScheduledReportSchema,
  updateScheduledReportSchema,
  queryCustomReportSchema,
  saveReportSchema,
  createAlertRuleSchema,
  updateAlertRuleSchema,
  reportIdParamSchema,
  alertRuleIdParamSchema,
} from '../validators/admin-reports.validator';

// ============================================================================
// Scheduled Reports
// ============================================================================

/**
 * 列出所有排程報表
 * GET /admin/reports/scheduled
 */
const listScheduledReports = asyncHandler(async (_req: Request, res: Response) => {
  const reports = await adminReportsService.listScheduledReports();
  res.json(createSuccessResponse(reports));
});

/**
 * 建立排程報表
 * POST /admin/reports/scheduled
 */
const createScheduledReport = asyncHandler(async (req: Request, res: Response) => {
  const input = createScheduledReportSchema.parse(req.body);
  const report = await adminReportsService.createScheduledReport(input);
  res.status(201).json(createSuccessResponse(report));
});

/**
 * 更新排程報表
 * PUT /admin/reports/scheduled/:id
 */
const updateScheduledReport = asyncHandler(async (req: Request, res: Response) => {
  const { id } = reportIdParamSchema.parse(req.params);
  const input = updateScheduledReportSchema.parse(req.body);
  const report = await adminReportsService.updateScheduledReport(id, input);
  res.json(createSuccessResponse(report));
});

/**
 * 刪除排程報表
 * DELETE /admin/reports/scheduled/:id
 */
const deleteScheduledReport = asyncHandler(async (req: Request, res: Response) => {
  const { id } = reportIdParamSchema.parse(req.params);
  await adminReportsService.deleteScheduledReport(id);
  res.json(createSuccessResponse({ deleted: true, id }));
});

/**
 * 取得報表寄送歷史
 * GET /admin/reports/scheduled/:id/history
 */
const getReportHistory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = reportIdParamSchema.parse(req.params);
  const history = await adminReportsService.getReportHistory(id);
  res.json(createSuccessResponse(history));
});

// ============================================================================
// Custom Reports
// ============================================================================

/**
 * 取得可用的報表欄位
 * GET /admin/reports/fields
 */
const getAvailableFields = asyncHandler(async (_req: Request, res: Response) => {
  const fields = await adminReportsService.getAvailableFields();
  res.json(createSuccessResponse(fields));
});

/**
 * 查詢自訂報表
 * POST /admin/reports/query
 */
const queryCustomReport = asyncHandler(async (req: Request, res: Response) => {
  const { fields } = queryCustomReportSchema.parse(req.body);
  const result = await adminReportsService.queryCustomReport(fields);
  res.json(createSuccessResponse(result));
});

/**
 * 列出已儲存的自訂報表
 * GET /admin/reports/saved
 */
const listSavedReports = asyncHandler(async (_req: Request, res: Response) => {
  const reports = await adminReportsService.listSavedReports();
  res.json(createSuccessResponse(reports));
});

/**
 * 儲存自訂報表設定
 * POST /admin/reports/saved
 */
const saveReport = asyncHandler(async (req: Request, res: Response) => {
  const input = saveReportSchema.parse(req.body);
  const report = await adminReportsService.saveReport(input);
  res.status(201).json(createSuccessResponse(report));
});

/**
 * 刪除已儲存的自訂報表
 * DELETE /admin/reports/saved/:id
 */
const deleteSavedReport = asyncHandler(async (req: Request, res: Response) => {
  const { id } = reportIdParamSchema.parse(req.params);
  await adminReportsService.deleteSavedReport(id);
  res.json(createSuccessResponse({ deleted: true, id }));
});

// ============================================================================
// Alert Rules
// ============================================================================

/**
 * 列出所有告警規則
 * GET /admin/alerts
 */
const listAlertRules = asyncHandler(async (_req: Request, res: Response) => {
  const rules = await adminReportsService.listAlertRules();
  res.json(createSuccessResponse(rules));
});

/**
 * 建立告警規則
 * POST /admin/alerts
 */
const createAlertRule = asyncHandler(async (req: Request, res: Response) => {
  const input = createAlertRuleSchema.parse(req.body);
  const rule = await adminReportsService.createAlertRule(input);
  res.status(201).json(createSuccessResponse(rule));
});

/**
 * 更新告警規則
 * PUT /admin/alerts/:id
 */
const updateAlertRule = asyncHandler(async (req: Request, res: Response) => {
  const { id } = alertRuleIdParamSchema.parse(req.params);
  const input = updateAlertRuleSchema.parse(req.body);
  const rule = await adminReportsService.updateAlertRule(id, input);
  res.json(createSuccessResponse(rule));
});

/**
 * 刪除告警規則
 * DELETE /admin/alerts/:id
 */
const deleteAlertRule = asyncHandler(async (req: Request, res: Response) => {
  const { id } = alertRuleIdParamSchema.parse(req.params);
  await adminReportsService.deleteAlertRule(id);
  res.json(createSuccessResponse({ deleted: true, id }));
});

/**
 * 取得告警歷史
 * GET /admin/alerts/history
 */
const getAlertHistory = asyncHandler(async (req: Request, res: Response) => {
  const ruleId = req.query.ruleId ? Number(req.query.ruleId) : undefined;
  const history = await adminReportsService.getAlertHistory(ruleId);
  res.json(createSuccessResponse(history));
});

export default {
  listScheduledReports,
  createScheduledReport,
  updateScheduledReport,
  deleteScheduledReport,
  getReportHistory,
  getAvailableFields,
  queryCustomReport,
  listSavedReports,
  saveReport,
  deleteSavedReport,
  listAlertRules,
  createAlertRule,
  updateAlertRule,
  deleteAlertRule,
  getAlertHistory,
};
