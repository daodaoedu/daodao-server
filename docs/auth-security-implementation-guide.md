# DaoDao 認證服務安全改進實作指南

## 🎯 概述

本指南提供了實作 DaoDao 認證服務安全改進的詳細步驟、程式碼範例和最佳實踐。按照優先級順序組織，確保團隊能夠有效地實施安全增強措施。

## 🚀 第一階段：緊急安全修復 (1-2 週)

### 1. JWT Token 黑名單機制

#### 1.1 建立 Token 黑名單服務

建立檔案 `src/services/auth/token-blacklist.service.ts`：

```typescript
import { redis } from '../database/redis.service';
import jwt from 'jsonwebtoken';

export interface BlacklistEntry {
  token: string;
  userId: number;
  reason: string;
  expiresAt: Date;
  addedAt: Date;
}

export class TokenBlacklistService {
  private readonly BLACKLIST_PREFIX = 'auth:blacklist:token:';
  private readonly USER_TOKEN_PREFIX = 'auth:tokens:user:';

  /**
   * 將 token 加入黑名單
   */
  async addToBlacklist(
    token: string, 
    userId: number, 
    reason: string = 'manual_revoke'
  ): Promise<void> {
    try {
      // 解析 token 獲取過期時間
      const decoded = jwt.decode(token) as any;
      const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      
      const entry: BlacklistEntry = {
        token,
        userId,
        reason,
        expiresAt,
        addedAt: new Date()
      };

      const key = `${this.BLACKLIST_PREFIX}${this.hashToken(token)}`;
      const ttl = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
      
      if (ttl > 0) {
        await redis.setex(key, ttl, JSON.stringify(entry));
        
        // 同時維護用戶的 token 列表
        await this.addToUserTokens(userId, token);
      }
    } catch (error) {
      console.error('Failed to add token to blacklist:', error);
      throw new Error('無法將 token 加入黑名單');
    }
  }

  /**
   * 檢查 token 是否在黑名單中
   */
  async isBlacklisted(token: string): Promise<boolean> {
    try {
      const key = `${this.BLACKLIST_PREFIX}${this.hashToken(token)}`;
      const result = await redis.get(key);
      return result !== null;
    } catch (error) {
      console.error('Failed to check token blacklist:', error);
      // 發生錯誤時，為了安全起見，假設 token 有效
      return false;
    }
  }

  /**
   * 撤銷用戶的所有 token
   */
  async revokeAllUserTokens(userId: number, reason: string = 'security_incident'): Promise<number> {
    try {
      const userTokensKey = `${this.USER_TOKEN_PREFIX}${userId}`;
      const tokens = await redis.smembers(userTokensKey);
      
      let revokedCount = 0;
      for (const token of tokens) {
        await this.addToBlacklist(token, userId, reason);
        revokedCount++;
      }
      
      // 清空用戶的 token 列表
      await redis.del(userTokensKey);
      
      return revokedCount;
    } catch (error) {
      console.error('Failed to revoke all user tokens:', error);
      throw new Error('無法撤銷用戶 tokens');
    }
  }

  /**
   * 獲取黑名單統計資訊
   */
  async getBlacklistStats(): Promise<{
    totalBlacklisted: number;
    recentlyAdded: number;
  }> {
    try {
      const pattern = `${this.BLACKLIST_PREFIX}*`;
      const keys = await redis.keys(pattern);
      const totalBlacklisted = keys.length;
      
      // 計算最近 24 小時加入的數量
      let recentlyAdded = 0;
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      for (const key of keys) {
        const data = await redis.get(key);
        if (data) {
          const entry: BlacklistEntry = JSON.parse(data);
          if (new Date(entry.addedAt) > oneDayAgo) {
            recentlyAdded++;
          }
        }
      }
      
      return { totalBlacklisted, recentlyAdded };
    } catch (error) {
      console.error('Failed to get blacklist stats:', error);
      return { totalBlacklisted: 0, recentlyAdded: 0 };
    }
  }

  private hashToken(token: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(token).digest('hex').substring(0, 16);
  }

  private async addToUserTokens(userId: number, token: string): Promise<void> {
    const key = `${this.USER_TOKEN_PREFIX}${userId}`;
    await redis.sadd(key, token);
    // 設定過期時間為 7 天
    await redis.expire(key, 7 * 24 * 60 * 60);
  }
}

export const tokenBlacklistService = new TokenBlacklistService();
```

#### 1.2 更新認證中間件

修改 `src/middleware/auth.ts`，加入黑名單檢查：

```typescript
import { tokenBlacklistService } from '../services/auth/token-blacklist.service';

export const authenticateJWT = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return next(new UnauthorizedError('缺少認證令牌'));
  }
  
  try {
    // 檢查 token 是否在黑名單中
    const isBlacklisted = await tokenBlacklistService.isBlacklisted(token);
    if (isBlacklisted) {
      return next(new UnauthorizedError('認證令牌已被撤銷'));
    }
    
    // 驗證 token
    const secret = process.env.JWT_SECRET || process.env.JWT_SECURITY;
    if (!secret) {
      throw new Error('JWT secret not configured');
    }
    
    const decoded = jwt.verify(token, secret);
    
    if (typeof decoded === 'object' && decoded !== null) {
      req.user = decoded as UserJwtPayload;
      req.isTemporary = decoded.isTemp || false;
    } else {
      throw new Error('Invalid token payload');
    }
    
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(new UnauthorizedError('認證令牌已過期'));
    } else if (error instanceof jwt.JsonWebTokenError) {
      return next(new UnauthorizedError('無效的認證令牌'));
    } else {
      return next(new UnauthorizedError('認證失敗'));
    }
  }
};
```

#### 1.3 更新登出功能

修改 `src/controllers/auth.controller.ts` 的登出功能：

```typescript
export const logout = asyncWrapper(async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token && req.user) {
    // 將 token 加入黑名單
    await tokenBlacklistService.addToBlacklist(
      token, 
      req.user.id, 
      'user_logout'
    );
  }
  
  const response: AuthResponse = {
    success: true,
    message: '登出成功'
  };

  res.json(response);
});

// 新增強制登出所有設備的端點
export const logoutAllDevices = asyncWrapper(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new UnauthorizedError('未經授權的訪問');
  }
  
  const revokedCount = await tokenBlacklistService.revokeAllUserTokens(
    req.user.id,
    'user_requested_logout_all'
  );
  
  const response: AuthResponse = {
    success: true,
    message: `已登出 ${revokedCount} 個設備`
  };

  res.json(response);
});
```

### 2. 結構化安全日誌系統

#### 2.1 建立安全日誌服務

建立檔案 `src/services/logging/security-logger.service.ts`：

```typescript
import winston from 'winston';
import 'winston-daily-rotate-file';

export interface SecurityEvent {
  event: string;
  userId?: number;
  sessionId?: string;
  ip: string;
  userAgent: string;
  success: boolean;
  details?: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
}

export class SecurityLogger {
  private logger: winston.Logger;
  private alertLogger: winston.Logger;

  constructor() {
    // 一般安全日誌
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports: [
        new winston.transports.DailyRotateFile({
          filename: 'logs/security-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '30d',
          level: 'info'
        }),
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
          level: process.env.NODE_ENV === 'production' ? 'warn' : 'info'
        })
      ]
    });

    // 高優先級安全告警日誌
    this.alertLogger = winston.createLogger({
      level: 'warn',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.DailyRotateFile({
          filename: 'logs/security-alerts-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '90d',
          level: 'warn'
        })
      ]
    });
  }

  logSecurityEvent(event: SecurityEvent): void {
    const logData = {
      ...event,
      environment: process.env.NODE_ENV,
      service: 'auth-service',
      version: process.env.APP_VERSION || '1.0.0'
    };

    this.logger.info('SECURITY_EVENT', logData);

    // 高嚴重性事件同時記錄到告警日誌
    if (event.severity === 'high' || event.severity === 'critical') {
      this.alertLogger.warn('SECURITY_ALERT', logData);
    }
  }

  logLoginAttempt(
    userId: number | undefined, 
    ip: string, 
    userAgent: string, 
    success: boolean,
    details?: Record<string, any>
  ): void {
    this.logSecurityEvent({
      event: 'LOGIN_ATTEMPT',
      userId,
      ip,
      userAgent,
      success,
      details,
      severity: success ? 'low' : 'medium',
      timestamp: new Date().toISOString()
    });
  }

  logTokenUsage(
    token: string, 
    userId: number, 
    endpoint: string, 
    ip: string,
    userAgent: string
  ): void {
    this.logSecurityEvent({
      event: 'TOKEN_USAGE',
      userId,
      ip,
      userAgent,
      success: true,
      details: { 
        endpoint, 
        tokenHash: this.hashToken(token),
        method: 'JWT'
      },
      severity: 'low',
      timestamp: new Date().toISOString()
    });
  }

  logPermissionCheck(
    userId: number,
    resource: string,
    action: string,
    success: boolean,
    ip: string
  ): void {
    this.logSecurityEvent({
      event: 'PERMISSION_CHECK',
      userId,
      ip,
      userAgent: '',
      success,
      details: { resource, action },
      severity: success ? 'low' : 'medium',
      timestamp: new Date().toISOString()
    });
  }

  logSuspiciousActivity(
    userId: number | undefined,
    activityType: string,
    ip: string,
    userAgent: string,
    details: Record<string, any>
  ): void {
    this.logSecurityEvent({
      event: 'SUSPICIOUS_ACTIVITY',
      userId,
      ip,
      userAgent,
      success: false,
      details: { activityType, ...details },
      severity: 'high',
      timestamp: new Date().toISOString()
    });
  }

  logSecurityIncident(
    incidentType: string,
    userId: number | undefined,
    ip: string,
    details: Record<string, any>
  ): void {
    this.logSecurityEvent({
      event: 'SECURITY_INCIDENT',
      userId,
      ip,
      userAgent: '',
      success: false,
      details: { incidentType, ...details },
      severity: 'critical',
      timestamp: new Date().toISOString()
    });
  }

  private hashToken(token: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(token).digest('hex').substring(0, 8);
  }
}

export const securityLogger = new SecurityLogger();
```

#### 2.2 整合日誌到現有系統

修改 `src/controllers/auth.controller.ts`，加入安全日誌：

```typescript
import { securityLogger } from '../services/logging/security-logger.service';

export const login = asyncWrapper(async (req: Request, res: Response) => {
  const { email } = req.body as LoginRequest;
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.get('User-Agent') || 'unknown';

  try {
    const userResult = await authService.findUserByEmail(email);
    
    if (!userResult) {
      // 記錄失敗的登入嘗試
      securityLogger.logLoginAttempt(
        undefined, 
        ip, 
        userAgent, 
        false,
        { email: email.replace(/(.{3}).*(@.*)/, '$1***$2'), reason: 'user_not_found' }
      );
      throw new UnauthorizedError('用戶不存在');
    }

    // 成功登入日誌
    securityLogger.logLoginAttempt(
      userResult.user.id,
      ip,
      userAgent,
      true,
      { loginMethod: 'oauth' }
    );

    // ... 其餘登入邏輯
  } catch (error) {
    // 記錄登入錯誤
    securityLogger.logLoginAttempt(
      undefined,
      ip,
      userAgent,
      false,
      { error: error.message }
    );
    throw error;
  }
});
```

### 3. Session 安全配置

#### 3.1 建立 Session 配置

建立檔案 `src/config/session.config.ts`：

```typescript
import session from 'express-session';
import RedisStore from 'connect-redis';
import { redis } from '../services/database/redis.service';
import crypto from 'crypto';

// 生成安全的 session secret
const generateSessionSecret = (): string => {
  return process.env.SESSION_SECRET || crypto.randomBytes(64).toString('hex');
};

export const sessionConfig = session({
  name: 'daodao.sid', // 自定義 session 名稱，避免預設的 connect.sid
  secret: generateSessionSecret(),
  resave: false,
  saveUninitialized: false,
  rolling: true, // 每次請求都重置過期時間
  cookie: {
    secure: process.env.NODE_ENV === 'production', // 生產環境強制 HTTPS
    httpOnly: true, // 防止 XSS 攻擊
    maxAge: 24 * 60 * 60 * 1000, // 24 小時
    sameSite: 'strict' // CSRF 保護
  },
  store: new RedisStore({
    client: redis,
    prefix: 'sess:',
    ttl: 24 * 60 * 60, // 24 小時（秒）
    disableTouch: false // 允許 touch 操作來重置 TTL
  }),
  genid: (req) => {
    // 生成更安全的 session ID
    return crypto.randomBytes(32).toString('hex');
  }
});

export default sessionConfig;
```

#### 3.2 建立 Session 管理服務

建立檔案 `src/services/auth/session.service.ts`：

```typescript
import { redis } from '../database/redis.service';
import { securityLogger } from '../services/logging/security-logger.service';

export interface SessionInfo {
  sessionId: string;
  userId: number;
  ip: string;
  userAgent: string;
  createdAt: Date;
  lastActiveAt: Date;
  isActive: boolean;
}

export class SessionService {
  private readonly SESSION_PREFIX = 'sess:';
  private readonly USER_SESSIONS_PREFIX = 'user:sessions:';

  /**
   * 創建新的 session 記錄
   */
  async createSession(
    sessionId: string,
    userId: number,
    ip: string,
    userAgent: string
  ): Promise<void> {
    const sessionInfo: SessionInfo = {
      sessionId,
      userId,
      ip,
      userAgent,
      createdAt: new Date(),
      lastActiveAt: new Date(),
      isActive: true
    };

    // 儲存 session 資訊
    const sessionKey = `${this.SESSION_PREFIX}info:${sessionId}`;
    await redis.setex(sessionKey, 24 * 60 * 60, JSON.stringify(sessionInfo));

    // 將 session 加入用戶的 session 列表
    const userSessionsKey = `${this.USER_SESSIONS_PREFIX}${userId}`;
    await redis.sadd(userSessionsKey, sessionId);
    await redis.expire(userSessionsKey, 30 * 24 * 60 * 60); // 30 天

    securityLogger.logSecurityEvent({
      event: 'SESSION_CREATED',
      userId,
      sessionId,
      ip,
      userAgent,
      success: true,
      severity: 'low',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 更新 session 最後活動時間
   */
  async updateSessionActivity(sessionId: string): Promise<void> {
    const sessionKey = `${this.SESSION_PREFIX}info:${sessionId}`;
    const sessionData = await redis.get(sessionKey);
    
    if (sessionData) {
      const sessionInfo: SessionInfo = JSON.parse(sessionData);
      sessionInfo.lastActiveAt = new Date();
      
      await redis.setex(sessionKey, 24 * 60 * 60, JSON.stringify(sessionInfo));
    }
  }

  /**
   * 獲取用戶的所有活躍 session
   */
  async getUserSessions(userId: number): Promise<SessionInfo[]> {
    const userSessionsKey = `${this.USER_SESSIONS_PREFIX}${userId}`;
    const sessionIds = await redis.smembers(userSessionsKey);
    
    const sessions: SessionInfo[] = [];
    for (const sessionId of sessionIds) {
      const sessionKey = `${this.SESSION_PREFIX}info:${sessionId}`;
      const sessionData = await redis.get(sessionKey);
      
      if (sessionData) {
        const sessionInfo: SessionInfo = JSON.parse(sessionData);
        sessions.push(sessionInfo);
      } else {
        // 清理無效的 session ID
        await redis.srem(userSessionsKey, sessionId);
      }
    }
    
    return sessions;
  }

  /**
   * 撤銷用戶的所有 session
   */
  async revokeAllUserSessions(userId: number): Promise<number> {
    const userSessionsKey = `${this.USER_SESSIONS_PREFIX}${userId}`;
    const sessionIds = await redis.smembers(userSessionsKey);
    
    let revokedCount = 0;
    for (const sessionId of sessionIds) {
      await this.revokeSession(sessionId);
      revokedCount++;
    }
    
    // 清空用戶的 session 列表
    await redis.del(userSessionsKey);
    
    securityLogger.logSecurityEvent({
      event: 'ALL_SESSIONS_REVOKED',
      userId,
      ip: 'system',
      userAgent: 'system',
      success: true,
      details: { revokedCount },
      severity: 'medium',
      timestamp: new Date().toISOString()
    });
    
    return revokedCount;
  }

  /**
   * 撤銷特定 session
   */
  async revokeSession(sessionId: string): Promise<void> {
    // 刪除 Express session
    const expressSessionKey = `${this.SESSION_PREFIX}${sessionId}`;
    await redis.del(expressSessionKey);
    
    // 刪除 session 資訊
    const sessionInfoKey = `${this.SESSION_PREFIX}info:${sessionId}`;
    await redis.del(sessionInfoKey);
  }

  /**
   * 檢測異常 session 活動
   */
  async detectAnomalousActivity(userId: number): Promise<boolean> {
    const sessions = await this.getUserSessions(userId);
    
    // 檢查是否有來自不同地理位置的同時活動
    const recentSessions = sessions.filter(session => {
      const lastActive = new Date(session.lastActiveAt);
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      return lastActive > fiveMinutesAgo;
    });
    
    if (recentSessions.length > 1) {
      const uniqueIPs = new Set(recentSessions.map(s => s.ip));
      if (uniqueIPs.size > 1) {
        securityLogger.logSuspiciousActivity(
          userId,
          'CONCURRENT_SESSIONS_DIFFERENT_IPS',
          'multiple',
          'multiple',
          { sessionCount: recentSessions.length, uniqueIPs: Array.from(uniqueIPs) }
        );
        return true;
      }
    }
    
    return false;
  }

  /**
   * 清理過期的 session 記錄
   */
  async cleanupExpiredSessions(): Promise<number> {
    let cleanedCount = 0;
    const pattern = `${this.SESSION_PREFIX}info:*`;
    const keys = await redis.keys(pattern);
    
    for (const key of keys) {
      const sessionData = await redis.get(key);
      if (sessionData) {
        const sessionInfo: SessionInfo = JSON.parse(sessionData);
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        if (new Date(sessionInfo.lastActiveAt) < oneDayAgo) {
          await redis.del(key);
          cleanedCount++;
        }
      }
    }
    
    return cleanedCount;
  }
}

export const sessionService = new SessionService();
```

### 4. IP 控制和暴力破解防護

#### 4.1 建立 IP 控制服務

建立檔案 `src/services/security/ip-control.service.ts`：

```typescript
import { redis } from '../database/redis.service';
import { securityLogger } from '../services/logging/security-logger.service';

export interface IPControlEntry {
  ip: string;
  reason: string;
  addedAt: Date;
  expiresAt?: Date;
  attempts?: number;
}

export class IPControlService {
  private readonly IP_BLACKLIST_KEY = 'security:blacklist:ip';
  private readonly IP_WHITELIST_KEY = 'security:whitelist:ip';
  private readonly LOGIN_ATTEMPTS_KEY = 'security:attempts:login';
  private readonly RATE_LIMIT_KEY = 'security:rate_limit';

  /**
   * 將 IP 加入黑名單
   */
  async addToBlacklist(
    ip: string, 
    reason: string, 
    duration?: number
  ): Promise<void> {
    const key = `${this.IP_BLACKLIST_KEY}:${ip}`;
    const entry: IPControlEntry = {
      ip,
      reason,
      addedAt: new Date(),
      expiresAt: duration ? new Date(Date.now() + duration * 1000) : undefined
    };
    
    const data = JSON.stringify(entry);
    
    if (duration) {
      await redis.setex(key, duration, data);
    } else {
      await redis.set(key, data);
    }
    
    securityLogger.logSecurityIncident(
      'IP_BLACKLISTED',
      undefined,
      ip,
      { reason, duration }
    );
  }

  /**
   * 檢查 IP 是否被封鎖
   */
  async isBlacklisted(ip: string): Promise<boolean> {
    const key = `${this.IP_BLACKLIST_KEY}:${ip}`;
    const result = await redis.get(key);
    return result !== null;
  }

  /**
   * 將 IP 加入白名單
   */
  async addToWhitelist(ip: string, reason: string): Promise<void> {
    const key = `${this.IP_WHITELIST_KEY}:${ip}`;
    const entry: IPControlEntry = {
      ip,
      reason,
      addedAt: new Date()
    };
    
    await redis.set(key, JSON.stringify(entry));
  }

  /**
   * 檢查 IP 是否在白名單中
   */
  async isWhitelisted(ip: string): Promise<boolean> {
    const key = `${this.IP_WHITELIST_KEY}:${ip}`;
    const result = await redis.get(key);
    return result !== null;
  }

  /**
   * 記錄登入失敗嘗試
   */
  async recordLoginFailure(ip: string): Promise<number> {
    const key = `${this.LOGIN_ATTEMPTS_KEY}:${ip}`;
    const attempts = await redis.incr(key);
    
    if (attempts === 1) {
      // 設定 15 分鐘的窗口期
      await redis.expire(key, 15 * 60);
    }
    
    return attempts;
  }

  /**
   * 檢測暴力破解攻擊
   */
  async detectBruteForce(ip: string): Promise<boolean> {
    // 如果 IP 在白名單中，跳過檢測
    if (await this.isWhitelisted(ip)) {
      return false;
    }
    
    const attempts = await this.recordLoginFailure(ip);
    
    // 超過 5 次失敗嘗試，臨時封鎖 15 分鐘
    if (attempts >= 5 && attempts < 10) {
      await this.addToBlacklist(ip, 'Brute force attack detected (5+ attempts)', 15 * 60);
      return true;
    }
    
    // 超過 10 次失敗嘗試，封鎖 1 小時
    if (attempts >= 10 && attempts < 20) {
      await this.addToBlacklist(ip, 'Severe brute force attack (10+ attempts)', 60 * 60);
      return true;
    }
    
    // 超過 20 次失敗嘗試，封鎖 24 小時
    if (attempts >= 20) {
      await this.addToBlacklist(ip, 'Critical brute force attack (20+ attempts)', 24 * 60 * 60);
      return true;
    }
    
    return false;
  }

  /**
   * 清除登入失敗記錄（成功登入後調用）
   */
  async clearLoginFailures(ip: string): Promise<void> {
    const key = `${this.LOGIN_ATTEMPTS_KEY}:${ip}`;
    await redis.del(key);
  }

  /**
   * 檢查請求頻率限制
   */
  async checkRateLimit(
    ip: string, 
    endpoint: string, 
    limit: number, 
    windowInSeconds: number
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const key = `${this.RATE_LIMIT_KEY}:${ip}:${endpoint}`;
    const current = await redis.incr(key);
    
    if (current === 1) {
      await redis.expire(key, windowInSeconds);
    }
    
    const ttl = await redis.ttl(key);
    const resetTime = Date.now() + (ttl * 1000);
    
    if (current > limit) {
      securityLogger.logSuspiciousActivity(
        undefined,
        'RATE_LIMIT_EXCEEDED',
        ip,
        '',
        { endpoint, attempts: current, limit }
      );
      
      return {
        allowed: false,
        remaining: 0,
        resetTime
      };
    }
    
    return {
      allowed: true,
      remaining: Math.max(0, limit - current),
      resetTime
    };
  }

  /**
   * 獲取 IP 控制統計
   */
  async getIPControlStats(): Promise<{
    blacklistedIPs: number;
    whitelistedIPs: number;
    recentAttacks: number;
  }> {
    const [blacklistKeys, whitelistKeys] = await Promise.all([
      redis.keys(`${this.IP_BLACKLIST_KEY}:*`),
      redis.keys(`${this.IP_WHITELIST_KEY}:*`)
    ]);
    
    // 計算最近 24 小時的攻擊數量
    let recentAttacks = 0;
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    for (const key of blacklistKeys) {
      const data = await redis.get(key);
      if (data) {
        const entry: IPControlEntry = JSON.parse(data);
        if (new Date(entry.addedAt) > oneDayAgo) {
          recentAttacks++;
        }
      }
    }
    
    return {
      blacklistedIPs: blacklistKeys.length,
      whitelistedIPs: whitelistKeys.length,
      recentAttacks
    };
  }

  /**
   * 移除 IP 黑名單
   */
  async removeFromBlacklist(ip: string): Promise<void> {
    const key = `${this.IP_BLACKLIST_KEY}:${ip}`;
    await redis.del(key);
  }

  /**
   * 移除 IP 白名單
   */
  async removeFromWhitelist(ip: string): Promise<void> {
    const key = `${this.IP_WHITELIST_KEY}:${ip}`;
    await redis.del(key);
  }
}

export const ipControlService = new IPControlService();
```

#### 4.2 建立 IP 控制中間件

建立檔案 `src/middleware/ip-control.middleware.ts`：

```typescript
import { Request, Response, NextFunction } from 'express';
import { ipControlService } from '../services/security/ip-control.service';
import { ForbiddenError } from '../utils/error-handler';

export const ipControlMiddleware = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  
  try {
    // 檢查 IP 是否被封鎖
    const isBlacklisted = await ipControlService.isBlacklisted(ip);
    if (isBlacklisted) {
      throw new ForbiddenError('您的 IP 地址已被封鎖');
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

export const bruteForceProtection = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  
  try {
    // 檢測暴力破解攻擊
    const isBruteForce = await ipControlService.detectBruteForce(ip);
    if (isBruteForce) {
      throw new ForbiddenError('檢測到暴力破解攻擊，IP 已被暫時封鎖');
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

export const createRateLimitMiddleware = (
  endpoint: string, 
  limit: number, 
  windowInSeconds: number
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    
    try {
      const result = await ipControlService.checkRateLimit(ip, endpoint, limit, windowInSeconds);
      
      // 設定 rate limit headers
      res.set({
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': new Date(result.resetTime).toISOString()
      });
      
      if (!result.allowed) {
        return res.status(429).json({
          success: false,
          message: '請求過於頻繁，請稍後再試',
          error: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
        });
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};
```

## 🔧 第二階段：安全增強 (2-4 週)

### 5. 多因素認證 (TOTP)

#### 5.1 安裝必要套件

```bash
npm install speakeasy qrcode
npm install --save-dev @types/speakeasy @types/qrcode
```

#### 5.2 建立 MFA 服務

建立檔案 `src/services/auth/mfa.service.ts`：

```typescript
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import { prisma } from '../database/prisma.service';
import { securityLogger } from '../services/logging/security-logger.service';
import crypto from 'crypto';

export interface MFASetupResult {
  secret: string;
  qrCodeUrl: string;
  qrCodeDataUrl: string;
  backupCodes: string[];
}

export interface MFAVerificationResult {
  success: boolean;
  backupCodeUsed?: boolean;
  remainingBackupCodes?: number;
}

export class MFAService {
  /**
   * 為用戶生成 MFA 密鑰和 QR 碼
   */
  async generateMFASecret(userId: number, email: string): Promise<MFASetupResult> {
    const secret = speakeasy.generateSecret({
      name: `DaoDao (${email})`,
      issuer: 'DaoDao Learning Platform',
      length: 32
    });
    
    // 生成備用代碼
    const backupCodes = this.generateBackupCodes();
    
    // 生成 QR 碼
    const qrCodeDataUrl = await qrcode.toDataURL(secret.otpauth_url!);
    
    return {
      secret: secret.base32!,
      qrCodeUrl: secret.otpauth_url!,
      qrCodeDataUrl,
      backupCodes
    };
  }

  /**
   * 驗證 TOTP 代碼
   */
  async verifyTOTP(secret: string, token: string): Promise<boolean> {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2 // 允許前後 2 個時間窗口的容錯
    });
  }

  /**
   * 為用戶啟用 MFA
   */
  async enableMFA(
    userId: number, 
    secret: string, 
    token: string,
    backupCodes: string[]
  ): Promise<boolean> {
    try {
      // 驗證提供的 TOTP 代碼
      if (!this.verifyTOTP(secret, token)) {
        return false;
      }
      
      // 加密存儲 secret 和備用代碼
      const encryptedSecret = this.encryptData(secret);
      const encryptedBackupCodes = backupCodes.map(code => this.encryptData(code));
      
      // 更新資料庫
      await prisma.user_security.upsert({
        where: { user_id: userId },
        create: {
          user_id: userId,
          mfa_secret: encryptedSecret,
          mfa_enabled: true,
          backup_codes: JSON.stringify(encryptedBackupCodes),
          mfa_enabled_at: new Date()
        },
        update: {
          mfa_secret: encryptedSecret,
          mfa_enabled: true,
          backup_codes: JSON.stringify(encryptedBackupCodes),
          mfa_enabled_at: new Date()
        }
      });
      
      securityLogger.logSecurityEvent({
        event: 'MFA_ENABLED',
        userId,
        ip: 'system',
        userAgent: 'system',
        success: true,
        severity: 'medium',
        timestamp: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      console.error('Failed to enable MFA:', error);
      return false;
    }
  }

  /**
   * 驗證用戶的 MFA 代碼（TOTP 或備用代碼）
   */
  async verifyMFA(
    userId: number, 
    code: string, 
    ip: string
  ): Promise<MFAVerificationResult> {
    try {
      const userSecurity = await prisma.user_security.findUnique({
        where: { user_id: userId }
      });
      
      if (!userSecurity || !userSecurity.mfa_enabled || !userSecurity.mfa_secret) {
        return { success: false };
      }
      
      // 解密 secret
      const secret = this.decryptData(userSecurity.mfa_secret);
      
      // 先嘗試 TOTP 驗證
      if (this.verifyTOTP(secret, code)) {
        securityLogger.logSecurityEvent({
          event: 'MFA_VERIFICATION_SUCCESS',
          userId,
          ip,
          userAgent: '',
          success: true,
          details: { method: 'TOTP' },
          severity: 'low',
          timestamp: new Date().toISOString()
        });
        
        return { success: true };
      }
      
      // 如果 TOTP 失敗，嘗試備用代碼
      if (userSecurity.backup_codes) {
        const backupCodes: string[] = JSON.parse(userSecurity.backup_codes)
          .map((encrypted: string) => this.decryptData(encrypted));
        
        const codeIndex = backupCodes.indexOf(code);
        if (codeIndex !== -1) {
          // 移除已使用的備用代碼
          backupCodes.splice(codeIndex, 1);
          const updatedEncryptedCodes = backupCodes.map(code => this.encryptData(code));
          
          await prisma.user_security.update({
            where: { user_id: userId },
            data: {
              backup_codes: JSON.stringify(updatedEncryptedCodes)
            }
          });
          
          securityLogger.logSecurityEvent({
            event: 'MFA_VERIFICATION_SUCCESS',
            userId,
            ip,
            userAgent: '',
            success: true,
            details: { method: 'BACKUP_CODE', remainingCodes: backupCodes.length },
            severity: 'medium',
            timestamp: new Date().toISOString()
          });
          
          return { 
            success: true, 
            backupCodeUsed: true, 
            remainingBackupCodes: backupCodes.length 
          };
        }
      }
      
      // 記錄失敗的 MFA 驗證
      securityLogger.logSecurityEvent({
        event: 'MFA_VERIFICATION_FAILED',
        userId,
        ip,
        userAgent: '',
        success: false,
        severity: 'high',
        timestamp: new Date().toISOString()
      });
      
      return { success: false };
    } catch (error) {
      console.error('Failed to verify MFA:', error);
      return { success: false };
    }
  }

  /**
   * 禁用用戶的 MFA
   */
  async disableMFA(userId: number, verificationCode: string): Promise<boolean> {
    try {
      // 首先驗證提供的代碼
      const verification = await this.verifyMFA(userId, verificationCode, 'system');
      if (!verification.success) {
        return false;
      }
      
      await prisma.user_security.update({
        where: { user_id: userId },
        data: {
          mfa_enabled: false,
          mfa_secret: null,
          backup_codes: null,
          mfa_disabled_at: new Date()
        }
      });
      
      securityLogger.logSecurityEvent({
        event: 'MFA_DISABLED',
        userId,
        ip: 'system',
        userAgent: 'system',
        success: true,
        severity: 'medium',
        timestamp: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      console.error('Failed to disable MFA:', error);
      return false;
    }
  }

  /**
   * 檢查用戶是否啟用了 MFA
   */
  async isMFAEnabled(userId: number): Promise<boolean> {
    try {
      const userSecurity = await prisma.user_security.findUnique({
        where: { user_id: userId }
      });
      
      return userSecurity?.mfa_enabled === true;
    } catch (error) {
      console.error('Failed to check MFA status:', error);
      return false;
    }
  }

  /**
   * 生成新的備用代碼
   */
  async generateNewBackupCodes(userId: number): Promise<string[]> {
    const newBackupCodes = this.generateBackupCodes();
    const encryptedCodes = newBackupCodes.map(code => this.encryptData(code));
    
    await prisma.user_security.update({
      where: { user_id: userId },
      data: {
        backup_codes: JSON.stringify(encryptedCodes)
      }
    });
    
    securityLogger.logSecurityEvent({
      event: 'BACKUP_CODES_REGENERATED',
      userId,
      ip: 'system',
      userAgent: 'system',
      success: true,
      severity: 'medium',
      timestamp: new Date().toISOString()
    });
    
    return newBackupCodes;
  }

  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      // 生成 8 位數字備用代碼
      const code = Math.random().toString().substr(2, 8);
      codes.push(code);
    }
    return codes;
  }

  private encryptData(data: string): string {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(process.env.MFA_ENCRYPTION_KEY || 'default-key', 'salt', 32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher(algorithm, key);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }

  private decryptData(encryptedData: string): string {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(process.env.MFA_ENCRYPTION_KEY || 'default-key', 'salt', 32);
    
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    const decipher = crypto.createDecipher(algorithm, key);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

export const mfaService = new MFAService();
```

#### 5.3 更新認證控制器支援 MFA

修改 `src/controllers/auth.controller.ts`，添加 MFA 相關端點：

```typescript
import { mfaService } from '../services/auth/mfa.service';

/**
 * 設定 MFA
 * POST /api/auth/mfa/setup
 */
export const setupMFA = asyncWrapper(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new UnauthorizedError('未經授權的訪問');
  }
  
  const user = await authService.findUserByExternalId(req.user._id || '');
  if (!user || !user.contacts) {
    throw new NotFoundError('用戶不存在');
  }
  
  const mfaSetup = await mfaService.generateMFASecret(
    user.id, 
    user.contacts.email
  );
  
  res.json({
    success: true,
    message: 'MFA 設定資訊已生成',
    data: {
      qrCode: mfaSetup.qrCodeDataUrl,
      secret: mfaSetup.secret,
      backupCodes: mfaSetup.backupCodes
    }
  });
});

/**
 * 啟用 MFA
 * POST /api/auth/mfa/enable
 */
export const enableMFA = asyncWrapper(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new UnauthorizedError('未經授權的訪問');
  }
  
  const { secret, token, backupCodes } = req.body;
  
  if (!secret || !token || !backupCodes) {
    throw new BadRequestError('缺少必要參數');
  }
  
  const success = await mfaService.enableMFA(
    req.user.id, 
    secret, 
    token, 
    backupCodes
  );
  
  if (!success) {
    throw new BadRequestError('無效的驗證代碼');
  }
  
  res.json({
    success: true,
    message: 'MFA 已成功啟用'
  });
});

/**
 * 驗證 MFA
 * POST /api/auth/mfa/verify
 */
export const verifyMFA = asyncWrapper(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new UnauthorizedError('未經授權的訪問');
  }
  
  const { code } = req.body;
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  
  if (!code) {
    throw new BadRequestError('缺少驗證代碼');
  }
  
  const result = await mfaService.verifyMFA(req.user.id, code, ip);
  
  if (!result.success) {
    throw new UnauthorizedError('無效的驗證代碼');
  }
  
  res.json({
    success: true,
    message: '驗證成功',
    data: {
      backupCodeUsed: result.backupCodeUsed,
      remainingBackupCodes: result.remainingBackupCodes
    }
  });
});

/**
 * 禁用 MFA
 * POST /api/auth/mfa/disable
 */
export const disableMFA = asyncWrapper(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new UnauthorizedError('未經授權的訪問');
  }
  
  const { code } = req.body;
  
  if (!code) {
    throw new BadRequestError('缺少驗證代碼');
  }
  
  const success = await mfaService.disableMFA(req.user.id, code);
  
  if (!success) {
    throw new UnauthorizedError('無效的驗證代碼');
  }
  
  res.json({
    success: true,
    message: 'MFA 已禁用'
  });
});

/**
 * 重新生成備用代碼
 * POST /api/auth/mfa/backup-codes/regenerate
 */
export const regenerateBackupCodes = asyncWrapper(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new UnauthorizedError('未經授權的訪問');
  }
  
  const { code } = req.body;
  
  if (!code) {
    throw new BadRequestError('缺少驗證代碼');
  }
  
  // 先驗證當前的 MFA 代碼
  const verification = await mfaService.verifyMFA(
    req.user.id, 
    code, 
    req.ip || 'unknown'
  );
  
  if (!verification.success) {
    throw new UnauthorizedError('無效的驗證代碼');
  }
  
  const newBackupCodes = await mfaService.generateNewBackupCodes(req.user.id);
  
  res.json({
    success: true,
    message: '備用代碼已重新生成',
    data: {
      backupCodes: newBackupCodes
    }
  });
});
```

## 📋 實作檢查清單

### ✅ 第一階段檢查項目 (1-2 週)
- [ ] JWT Token 黑名單服務實作完成
- [ ] 黑名單檢查整合到認證中間件
- [ ] 登出功能更新為撤銷 token
- [ ] 結構化安全日誌系統部署
- [ ] 安全事件記錄整合到現有功能
- [ ] Session 安全配置實作
- [ ] Redis session 存儲配置
- [ ] IP 控制服務部署
- [ ] 暴力破解防護啟用
- [ ] Rate limiting 中間件配置

### ✅ 第二階段檢查項目 (2-4 週)  
- [ ] MFA 服務實作完成
- [ ] TOTP 生成和驗證功能
- [ ] 備用代碼系統
- [ ] MFA API 端點
- [ ] 設備管理服務
- [ ] 異常登入檢測
- [ ] 權限快取機制
- [ ] 安全監控儀表板
- [ ] 告警系統配置

### ✅ 資料庫 Schema 更新
- [ ] `user_security` 表建立 (MFA 相關欄位)
- [ ] `user_devices` 表建立 (設備管理)
- [ ] `security_logs` 表建立 (結構化日誌)
- [ ] 現有表格索引優化

### ✅ 測試和驗證
- [ ] 單元測試覆蓋 80% 以上
- [ ] 整合測試完成
- [ ] 安全滲透測試
- [ ] 效能測試
- [ ] 負載測試

### ✅ 文件和培訓
- [ ] API 文件更新
- [ ] 安全操作手冊
- [ ] 事件響應流程
- [ ] 團隊安全培訓

這份實作指南提供了詳細的程式碼範例和步驟，團隊可以按照優先級逐步實施這些安全改進措施。每個階段都有明確的檢查項目，確保實作的完整性和品質。