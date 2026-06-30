/**
 * Admin 系統監控與儀表板相關型別定義
 */

/**
 * 系統監控回應
 */
export interface SystemMonitorResponse {
  cpu: { usage: number; cores: number }
  memory: { used: number; total: number; usagePercent: number }
  disk: { used: number; total: number; usagePercent: number }
  uptime: number
}

/**
 * 資料庫資訊回應
 */
export interface DbInfoResponse {
  activeConnections: number
  maxConnections: number
  idleConnections: number
  totalQueries: number
  avgLatencyMs: number
}

/**
 * Redis 資訊回應
 */
export interface RedisInfoResponse {
  memoryUsed: number
  memoryTotal: number
  connectedClients: number
  hitRate: number
}

/**
 * 儀表板總覽回應
 */
export interface DashboardOverviewResponse {
  totalUsers: number
  newUsersThisMonth: number
  activeUsers: number
  growthRate: number
  activeRate: number
}

/**
 * 儀表板活躍用戶回應
 */
export interface DashboardActiveUsersResponse {
  dau: number
  wau: number
  mau: number
  trend: {
    dauTrend: number
    wauTrend: number
    mauTrend: number
  }
}

/**
 * Email 統計回應
 */
export interface EmailStatsResponse {
  totalSent: number
  successRate: number
  bounceRate: number
  queueSize: number
}

/**
 * Email 健康狀態回應
 */
export interface EmailHealthResponse {
  status: 'healthy' | 'degraded' | 'down'
  smtpConnection: boolean
  queueSize: number
  lastError: string | null
}
