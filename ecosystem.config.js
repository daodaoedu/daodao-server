module.exports = {
  apps: [{
    name: "node_app",
    script: "dist/src/server.js",
    instances: "max",
    exec_mode: "cluster",

    // 禁用 PM2 日誌捕獲 - 輸出到 /dev/null
    out_file: "/dev/null",
    error_file: "/dev/null",
    log_file: "/dev/null",

    // 禁用日誌合併
    merge_logs: false,

    // 進程穩定性配置
    max_memory_restart: "1G",
    max_restarts: 3,
    min_uptime: "10s",
    restart_delay: 4000,

    // 環境配置 - 使用環境變數，如果沒有則預設為 prod
    env: {
      NODE_ENV: process.env.NODE_ENV || "prod"
    }
  }]
};
  