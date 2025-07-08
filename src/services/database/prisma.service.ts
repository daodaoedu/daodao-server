/**
 * Prisma 資料庫服務
 * 提供 Prisma Client 的初始化和管理
 */

import { PrismaClient } from '../../../generated/prisma';

export class PrismaService {
  private static instance: PrismaService;
  private prismaClient: PrismaClient;

  private constructor() {
    this.prismaClient = new PrismaClient({
      log: ['query', 'error', 'warn', 'info'],
      errorFormat: 'pretty',
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
   * 連接到資料庫
   */
  public async connect(): Promise<void> {
    try {
      await this.prismaClient.$connect();
      console.log('✅ Prisma 資料庫連接成功');
    } catch (error) {
      console.error('❌ Prisma 資料庫連接失敗:', error);
      throw new Error('Prisma 資料庫連接失敗');
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

  /**
   * 執行原始 SQL 查詢
   */
  public async queryRaw<T = unknown>(query: string, ...values: unknown[]): Promise<T> {
    return this.prismaClient.$queryRawUnsafe(query, ...values) as Promise<T>;
  }

  /**
   * 執行原始 SQL 命令
   */
  public async executeRaw(query: string, ...values: unknown[]): Promise<number> {
    return this.prismaClient.$executeRawUnsafe(query, ...values);
  }
}

// 建立並導出全域實例
export const prismaService = PrismaService.getInstance();
export const prisma = prismaService.getClient();

// 預設導出
export default prismaService;