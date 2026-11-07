/**
 * Prisma 資料庫服務
 * 提供 Prisma Client 的初始化和管理
 */

import { PrismaClient, Prisma } from '../../../generated/prisma';
import { loggerService } from '../logging/logger.service';

export class PrismaService {
  private static instance: PrismaService;
  private prismaClient: PrismaClient & {
    $on(eventType: 'query', callback: (event: Prisma.QueryEvent) => void): void;
    $on(eventType: 'error', callback: (event: Prisma.LogEvent) => void): void;
    $on(eventType: 'warn', callback: (event: Prisma.LogEvent) => void): void;
    $on(eventType: 'info', callback: (event: Prisma.LogEvent) => void): void;
  };
  private isConnected = false;

  private constructor() {
    this.prismaClient = new PrismaClient({
      // 只在開發環境啟用內建日志，生產環境使用 Winston
      log: process.env.NODE_ENV === 'dev'
        ? ['query', 'error', 'warn', 'info']
        : [],
      errorFormat: 'pretty',
    }) as PrismaClient & {
      $on(eventType: 'query', callback: (event: Prisma.QueryEvent) => void): void;
      $on(eventType: 'error', callback: (event: Prisma.LogEvent) => void): void;
      $on(eventType: 'warn', callback: (event: Prisma.LogEvent) => void): void;
      $on(eventType: 'info', callback: (event: Prisma.LogEvent) => void): void;
    };

    // 整合 Prisma 日志到 Winston 系統
    this.setupCustomLogging();
  }

  /**
   * 設置自定義日志處理
   */
  private setupCustomLogging(): void {
    // 監聽 Prisma 查詢事件
    this.prismaClient.$on('query', (event) => {
      loggerService.logDatabaseOperation(
        'QUERY',
        'prisma',
        event.duration,
        true
      );
      
      // 開發環境顯示詳細查詢
      if (process.env.NODE_ENV === 'dev') {
        loggerService.debug('Prisma Query', {
          query: event.query,
          // Query parameters can contain private letter text and other secrets.
          params: '[REDACTED]',
          duration: `${event.duration}ms`,
        });
      }
    });

    // 監聽錯誤事件
    this.prismaClient.$on('error', (event) => {
      loggerService.error('Prisma Error', {
        target: event.target,
        message: event.message,
      });
    });

    // 監聽警告事件
    this.prismaClient.$on('warn', (event) => {
      loggerService.warn('Prisma Warning', {
        target: event.target,
        message: event.message,
      });
    });

    // 監聽信息事件
    this.prismaClient.$on('info', (event) => {
      loggerService.info('Prisma Info', {
        target: event.target,
        message: event.message,
      });
    });
  }

  /**
   * 取得 PrismaService 單例實例
   */
  public static getInstance(): PrismaService {
    if (!PrismaService.instance) {
      PrismaService.instance = new PrismaService();
    }
    return PrismaService.instance;
  }

  /**
   * 取得 Prisma Client 實例
   */
  public getClient(): PrismaClient {
    return this.prismaClient;
  }

  /**
   * 檢查是否已連接到資料庫
   */
  public isDbConnected(): boolean {
    return this.isConnected;
  }

  /**
   * 連接到資料庫
   */
  public async connect(): Promise<void> {
    try {
      await this.prismaClient.$connect();
      this.isConnected = true;
      console.log('✅ Prisma 資料庫連接成功');
    } catch (error) {
      console.error('❌ Prisma 資料庫連接失敗:', error);
      console.warn('⚠️  應用程式將在無資料庫模式下運行');
      this.isConnected = false;
      // 不拋出錯誤，讓應用程式繼續運行
    }
  }

  /**
   * 斷開資料庫連接
   */
  public async disconnect(): Promise<void> {
    try {
      await this.prismaClient.$disconnect();
      console.log('✅ Prisma 資料庫連接已斷開');
    } catch (error) {
      console.error('❌ Prisma 資料庫斷開連接失敗:', error);
    }
  }

  /**
   * 檢查資料庫連接狀態
   */
  public async healthCheck(): Promise<boolean> {
    try {
      await this.prismaClient.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('❌ Prisma 資料庫健康檢查失敗:', error);
      return false;
    }
  }

  /**
   * 執行資料庫事務
   */
  public async transaction<T>(
    operation: (prisma: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>
  ): Promise<T> {
    return this.prismaClient.$transaction(operation);
  }
}

// 建立並導出全域實例
export const prismaService = PrismaService.getInstance();
export const prisma = prismaService.getClient();

// 預設導出
export default prismaService;
