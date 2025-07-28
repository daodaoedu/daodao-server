module.exports = {
  apps: [{
    name: "node_app",
    script: "index.js",
    instances: "max",
    exec_mode: "cluster",
    
    // 禁用 PM2 日誌捕獲 - 輸出到 /dev/null
    out_file: "/dev/null",
    error_file: "/dev/null",
    log_file: "/dev/null",
    
    // 禁用日誌合併
    merge_logs: false,
    
    // 環境配置
    env: {
      NODE_ENV: "production"
    },
    env_development: {
      NODE_ENV: "development"
    }
  }]
};
  