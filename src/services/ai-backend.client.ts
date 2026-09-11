/**
 * server → daodao-ai-backend 的呼叫入口。
 * - ai-backend 的 get_current_user 沒 token 會回 401，所以一律轉發使用者的 JWT；
 *   另帶 X-Service-Token（AI_BACKEND_SERVICE_TOKEN）給服務間認證用
 * - 所有失敗都收斂成 AiBackendError，呼叫端決定要 fallback 還是回 502
 */
export type AiBackendErrorCode = 'not_configured' | 'unauthorized' | 'rate_limited' | 'timeout' | 'unavailable' | 'failed';

export class AiBackendError extends Error {
  constructor(public readonly code: AiBackendErrorCode, message: string, public readonly status: number | null = null) {
    super(message);
    this.name = 'AiBackendError';
  }
}

const DEFAULT_TIMEOUT_MS = 60_000;

const baseUrl = (): string => (process.env.AI_BACKEND_URL || '').replace(/\/+$/, '');
const isConfigured = (): boolean => baseUrl().length > 0;

interface PostOptions {
  /** 使用者的 JWT（不含 Bearer 前綴）；ai-backend 用它做身份驗證 */
  userToken?: string | null;
  timeoutMs?: number;
}

const post = async <T>(path: string, body: unknown, options: PostOptions = {}): Promise<T> => {
  if (!isConfigured()) throw new AiBackendError('not_configured', 'AI 服務尚未設定（AI_BACKEND_URL）');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options.userToken) headers.Authorization = `Bearer ${options.userToken}`;
  const serviceToken = process.env.AI_BACKEND_SERVICE_TOKEN;
  if (serviceToken) headers['X-Service-Token'] = serviceToken;

  let res: Response;
  try {
    res = await fetch(`${baseUrl()}${path}`, { method: 'POST', headers, body: JSON.stringify(body), signal: AbortSignal.timeout(options.timeoutMs ?? DEFAULT_TIMEOUT_MS) });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/abort|timeout/i.test(message)) throw new AiBackendError('timeout', 'AI 服務回應逾時，請稍後再試');
    throw new AiBackendError('unavailable', 'AI 服務暫時無法連線，請稍後再試');
  }
  if (res.status === 401 || res.status === 403) throw new AiBackendError('unauthorized', 'AI 服務拒絕了這次請求（認證失敗）', res.status);
  if (res.status === 429) throw new AiBackendError('rate_limited', 'AI 服務請求過於頻繁，請稍後再試', res.status);
  if (!res.ok) {
    let detail = '';
    try { detail = ((await res.json()) as { detail?: string; message?: string }).detail ?? ''; } catch { /* ignore */ }
    throw new AiBackendError('failed', detail ? `AI 服務回應錯誤：${detail}` : `AI 服務回應錯誤（HTTP ${res.status}）`, res.status);
  }
  return (await res.json()) as T;
};

export const aiBackendClient = { post, isConfigured };
