// routes/monitor.js
const express = require('express');
const os = require('os');
const si = require('systeminformation'); // 引入 systeminformation
const router = express.Router();

const { mongoClient } = require('../services/mongo');
const { postgresClient, QueryTypes } = require('../services/postgres');

router.get('/', async (req, res) => {
    try {
        // 取得系統基本資訊
        const systemInfo = {
            hostname: os.hostname(),
            platform: os.platform(),
            arch: os.arch(),
            uptime: os.uptime(),
            loadAverage: os.loadavg(),
            totalMemory: os.totalmem(),
            freeMemory: os.freemem(),
            release: os.release(),
            type: os.type(),
            userInfo: os.userInfo(),
            cpus: os.cpus(),
            networkInterfaces: os.networkInterfaces(),
            processMemory: process.memoryUsage(),
            processId: process.pid,
            processTitle: process.title,
            processArgs: process.argv,
        };

        // 取得 MongoDB 伺服器資訊
        let mongoInfo = {};
        try {
            if (mongoClient.readyState === 1) {
                const db = mongoClient.db;
                mongoInfo = {
                    status: 'MongoDB 已連線',
                    database: db.databaseName,
                    collections: await db.listCollections().toArray() // 可選
                };
            } else {
                mongoInfo = { error: 'MongoDB 連線不可用', details: `readyState: ${mongoClient.readyState}` };
            }
        } catch (err) {
            mongoInfo = { error: 'MongoDB 連線不可用', details: err.message };
        }

        // 取得 PostgreSQL 版本資訊
        let postgresInfo = {};
        try {
            // 1. 伺服器版本
            const [versionResult] = await postgresClient.query('SELECT version()', { type: QueryTypes.SELECT });
            console.log('PostgreSQL version result:', versionResult);

            // 2. 連線數與最大連線數
            const [connectionResult] = await postgresClient.query(
                'SELECT numbackends AS current_connections, max_connections FROM pg_stat_database, (SELECT setting::int AS max_connections FROM pg_settings WHERE name = \'max_connections\') AS max_conn WHERE datname = current_database()',
                { type: QueryTypes.SELECT }
            );

            // 3. 資料庫大小
            const [sizeResult] = await postgresClient.query(
                'SELECT pg_size_pretty(pg_database_size(current_database())) AS size',
                { type: QueryTypes.SELECT }
            );

            // 4. 伺服器啟動時間
            const [uptimeResult] = await postgresClient.query(
                'SELECT pg_postmaster_start_time() AS start_time',
                { type: QueryTypes.SELECT }
            );

            // 5. 配置參數
            const [configResult] = await postgresClient.query(
                'SELECT name, setting FROM pg_settings WHERE name IN (\'work_mem\', \'shared_buffers\')',
                { type: QueryTypes.SELECT }
            );

            // 6. 表資訊
            const tableResults = await postgresClient.query(`
              SELECT 
                t.tablename AS table_name,
                pg_size_pretty(pg_total_relation_size('"' || t.tablename || '"')) AS size,
                (SELECT reltuples::bigint AS row_count FROM pg_class WHERE relname = t.tablename) AS row_count
              FROM pg_tables t
              WHERE t.schemaname = 'public'
            `, { type: QueryTypes.SELECT });

            // 組合結果
            if (versionResult && versionResult.version) {
                postgresInfo.version = versionResult.version;
            } else {
                postgresInfo.version = '未知版本';
            }

            if (connectionResult) {
                postgresInfo.current_connections = connectionResult.current_connections || 0;
                postgresInfo.max_connections = connectionResult.max_connections || 0;
            }

            if (sizeResult && sizeResult.size) {
                postgresInfo.database_size = sizeResult.size;
            }

            if (uptimeResult && uptimeResult.start_time) {
                postgresInfo.start_time = uptimeResult.start_time;
            }

            if (configResult && Array.isArray(configResult)) {
                postgresInfo.config = {};
                configResult.forEach(conf => {
                    postgresInfo.config[conf.name] = conf.setting;
                });
            }

            if (tableResults && Array.isArray(tableResults)) {
                postgresInfo.tables = tableResults.map(table => ({
                    table_name: table.table_name,
                    size: table.size,
                    row_count: table.row_count || 0,
                }));
            } else {
                postgresInfo.tables = [];
            }

            if (!postgresInfo.version) {
                postgresInfo = { version: '未知版本', details: '查詢結果為空' };
            }
        } catch (err) {
            postgresInfo = { error: 'PostgreSQL 連線不可用', details: err.message };
        }
        // 取得磁碟資訊，使用 systeminformation 模組
        const disks = await si.fsSize();
        const diskInfo = disks.map(disk => ({
            filesystem: disk.fs,
            type: disk.type,
            size: disk.size, // 總容量（位元組）
            used: disk.used, // 已使用容量
            available: disk.size - disk.used, // 可用容量
            use: disk.use, // 使用率（百分比）
            mount: disk.mount, // 掛載點
        }));

        // 回傳所有監控資訊
        res.json({
            system: systemInfo,
            mongo: mongoInfo,
            postgres: postgresInfo,
            disk: diskInfo,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
