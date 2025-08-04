
import { Router, Request, Response } from 'express';
import { prismaService } from '../services/database/prisma.service';
import { mongoClient } from '../services/database/mongo.service';

const router = Router();

interface DatabaseColumn {
  column_name: string;
  data_type: string;
}

interface PostgresTableInfo {
  columns: DatabaseColumn[];
}

interface MongoCollectionInfo {
  fields: string[];
}

interface DatabaseInfoResponse {
  mongo: Record<string, MongoCollectionInfo> | { error: string };
  postgres: Record<string, PostgresTableInfo> | { error: string };
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const response: DatabaseInfoResponse = {
      mongo: {},
      postgres: {}
    };

    // 取得 MongoDB 各 collection 的欄位資訊
    try {
      if (mongoClient && mongoClient.readyState === 1) {
        // 使用 mongoose.connection.db 存取底層 driver
        const collections = await mongoClient.db.listCollections().toArray();
        
        const mongoData: Record<string, MongoCollectionInfo> = {};
        for (const coll of collections) {
          // 以 sample document 的 key 當作欄位資訊
          const sampleDoc = await mongoClient.db.collection(coll.name).findOne();
          mongoData[coll.name] = {
            fields: sampleDoc ? Object.keys(sampleDoc) : []
          };
        }
        response.mongo = mongoData;
      } else {
        response.mongo = { error: 'MongoDB 連線不可用' };
      }
    } catch (mongoError) {
      console.error('MongoDB info error:', mongoError);
      response.mongo = { error: 'MongoDB 查詢失敗' };
    }

    // 取得 PostgreSQL 各 table 的欄位資訊
    try {
      const prisma = prismaService.getClient();
      
      // 取得所有表格名稱
      const tableResult = await prisma.$queryRaw<Array<{ tablename: string }>>`
        SELECT tablename 
        FROM pg_catalog.pg_tables 
        WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
      `;
      
      // 對每個表格取得欄位資訊
      const postgresData: Record<string, PostgresTableInfo> = {};
      for (const table of tableResult) {
        const columnResult = await prisma.$queryRaw<DatabaseColumn[]>`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = ${table.tablename}
          ORDER BY ordinal_position
        `;
        
        postgresData[table.tablename] = {
          columns: columnResult
        };
      }
      response.postgres = postgresData;
    } catch (postgresError) {
      console.error('PostgreSQL info error:', postgresError);
      response.postgres = { error: 'PostgreSQL 查詢失敗' };
    }

    res.json(response);
  } catch (error) {
    console.error('Database info error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : '未知錯誤' 
    });
  }
});

export default router;