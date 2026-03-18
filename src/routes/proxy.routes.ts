import { Router } from 'express';
import { registry } from '../config/openapi-registry';
import { asyncHandler, BadRequestError } from '../middleware/error.middleware';
import { authenticate } from '../middleware/auth';
import https from 'https';
import http from 'http';
import { z } from 'zod';

const router = Router();

// SSRF 防護：只允許 Cloudflare R2 域名（明確的 pub- 前綴格式）
const ALLOWED_DOMAINS = [
  /^pub-[a-f0-9]+\.r2\.dev$/,
  /^[a-z0-9-]+\.[a-z0-9-]+\.r2\.cloudflarestorage\.com$/
];

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

function isAllowedUrl(urlStr: string): boolean {
  try {
    const url = new URL(urlStr);
    if (url.protocol !== 'https:') return false;
    return ALLOWED_DOMAINS.some(pattern => pattern.test(url.hostname));
  } catch {
    return false;
  }
}

const imageQuerySchema = z.object({
  url: z.string().url()
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/proxy/image',
  tags: ['Proxy'],
  summary: '圖片代理（R2 → Base64）',
  description: '將 Cloudflare R2 圖片 URL 轉換為 Base64 data URL，供 PDF 導出使用。僅允許 R2 域名。',
  request: { query: imageQuerySchema },
  responses: {
    200: {
      description: 'Base64 data URL',
      content: {
        'application/json': {
          schema: z.object({ dataUrl: z.string() })
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' }
  }
});

router.get('/image', authenticate, asyncHandler(async (req, res) => {
  const parsed = imageQuerySchema.safeParse(req.query);
  if (!parsed.success) throw new BadRequestError('url 參數無效');

  const { url } = parsed.data;
  if (!isAllowedUrl(url)) throw new BadRequestError('不允許的圖片來源網域');

  // Fetch image
  const imageData = await new Promise<{ buffer: Buffer; contentType: string }>((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new BadRequestError(`圖片取得失敗：HTTP ${response.statusCode}`));
        return;
      }

      const contentType = response.headers['content-type'] || 'image/jpeg';
      const chunks: Buffer[] = [];
      let totalSize = 0;

      response.on('data', (chunk: Buffer) => {
        totalSize += chunk.length;
        if (totalSize > MAX_SIZE_BYTES) {
          reject(new BadRequestError('圖片超過 5MB 上限'));
          response.destroy();
          return;
        }
        chunks.push(chunk);
      });

      response.on('end', () => {
        resolve({ buffer: Buffer.concat(chunks), contentType });
      });

      response.on('error', reject);
    }).on('error', reject);
  });

  const base64 = imageData.buffer.toString('base64');
  const dataUrl = `data:${imageData.contentType};base64,${base64}`;

  res.json({ dataUrl });
}));

export default router;
