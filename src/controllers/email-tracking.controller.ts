/**
 * Email 開啟追蹤 Controller
 * 處理追蹤像素請求，記錄 email 開啟事件
 */

import { Request, Response } from 'express';
import { recordEmailOpen } from '../services/email/email-log.service';

/** 1x1 透明 GIF */
const TRANSPARENT_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

/**
 * 追蹤 email 開啟事件
 * GET /api/v1/email/track/open/:token
 */
const trackOpen = async (req: Request, res: Response): Promise<void> => {
  const { token } = req.params;

  // 非同步記錄，不阻塞回應
  if (token && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)) {
    recordEmailOpen(token).catch(() => {
      // 記錄失敗不影響回應
    });
  }

  res.set({
    'Content-Type': 'image/gif',
    'Content-Length': String(TRANSPARENT_GIF.length),
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  });
  res.end(TRANSPARENT_GIF);
};

export const emailTrackingController = {
  trackOpen,
};
