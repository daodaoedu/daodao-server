module.exports = {
  apps: [{
    name: 'daodao-server',
    script: './index.js',
    instances: 1,
    max_memory_restart: '500M', // 記憶體超過 500MB 自動重啟
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};