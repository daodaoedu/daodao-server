/**
 * Readiness 檢查（daodao#362）
 *
 * `/api/v1/health` 只代表 Node 行程活著（liveness），DB／Redis 掛掉時仍回 ok，
 * 2026-10-22 主機重開機後 pg／redis 沒起來，外部監控與 CD 都看不出問題。
 * readiness 會實際連 DB 與 Redis，任一失敗就回 not ready，給 CD 部署後檢查與外部監控用。
 *
 * liveness 刻意維持不檢查依賴：compose healthcheck 與 depends_on 用它，
 * 依賴短暫中斷時不應讓 app 容器被判定為壞掉。
 */

export type DependencyCheck = () => Promise<unknown>;

export interface DependencyResult {
  status: 'ok' | 'error';
  latencyMs: number;
  error?: string;
}

export interface ReadinessResult {
  status: 'ok' | 'error';
  checks: Record<string, DependencyResult>;
  timestamp: string;
}

export const DEFAULT_READINESS_TIMEOUT_MS = 3000;

const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`timeout after ${timeoutMs}ms`)), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
};

const runCheck = async (check: DependencyCheck, timeoutMs: number): Promise<DependencyResult> => {
  const startedAt = Date.now();
  try {
    // 同步 throw 也要接住，所以包在 async 裡呼叫
    await withTimeout((async (): Promise<unknown> => check())(), timeoutMs);
    return { status: 'ok', latencyMs: Date.now() - startedAt };
  } catch (err) {
    return {
      status: 'error',
      latencyMs: Date.now() - startedAt,
      error: err instanceof Error ? err.message : String(err),
    };
  }
};

/**
 * 平行執行所有依賴檢查；每項有各自的逾時，任一失敗整體即為 error。
 */
export const checkReadiness = async (
  checks: Record<string, DependencyCheck>,
  timeoutMs: number = DEFAULT_READINESS_TIMEOUT_MS
): Promise<ReadinessResult> => {
  const names = Object.keys(checks);
  const results = await Promise.all(names.map((name) => runCheck(checks[name], timeoutMs)));
  const resultMap: Record<string, DependencyResult> = {};
  names.forEach((name, i) => {
    resultMap[name] = results[i];
  });

  return {
    status: results.every((r) => r.status === 'ok') ? 'ok' : 'error',
    checks: resultMap,
    timestamp: new Date().toISOString(),
  };
};

/**
 * 對外回應不帶錯誤細節（避免洩漏主機名稱等內部資訊），細節只寫 log。
 */
export interface PublicReadiness {
  status: ReadinessResult['status'];
  checks: Record<string, Omit<DependencyResult, 'error'>>;
  timestamp: string;
}

export const toPublicReadiness = (result: ReadinessResult): PublicReadiness => ({
  status: result.status,
  checks: Object.fromEntries(
    Object.entries(result.checks).map(([name, r]) => [name, { status: r.status, latencyMs: r.latencyMs }])
  ),
  timestamp: result.timestamp,
});
