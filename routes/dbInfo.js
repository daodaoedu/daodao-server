// routes/dbInfo.js
const express = require('express');
const router = express.Router();

const { mongoClient } = require('../services/mongo');
const { postgresClient, QueryTypes } = require('../services/postgres');

router.get('/', async (req, res) => {
  try {
    // 取得 MongoDB 各 collection 的欄位資訊
    let mongoInfo = {};
    if (mongoClient && mongoClient.readyState === 1) { // readyState 1 表示已連線
      // 使用 mongoose.connection.db 存取底層 driver
      const collections = await mongoClient.db.listCollections().toArray();
      for (let coll of collections) {
        // 以 sample document 的 key 當作欄位資訊
        const sampleDoc = await mongoClient.db.collection(coll.name).findOne();
        mongoInfo[coll.name] = {
          fields: sampleDoc ? Object.keys(sampleDoc) : []
        };
      }
    } else {
      mongoInfo = { error: 'MongoDB 連線不可用' };
    }

    // 取得 PostgreSQL 各 table 的欄位資訊
    let postgresInfo = {};
    const tableResult = await postgresClient.query(
      "SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname NOT IN ('pg_catalog', 'information_schema')",
      { type: QueryTypes.SELECT }
    );
    const tableNames = tableResult.map(row => row.tablename);
    for (let tableName of tableNames) {
      const colResult = await postgresClient.query(
        "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = ? ORDER BY ordinal_position",
        { replacements: [tableName], type: QueryTypes.SELECT }
      );
      postgresInfo[tableName] = {
        columns: colResult
      };
    }

    res.json({
      mongo: mongoInfo,
      postgres: postgresInfo,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
