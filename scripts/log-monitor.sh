#!/bin/bash

# 日誌監控腳本
LOG_DIR="./logs"

# 檢查日誌目錄
if [ ! -d "$LOG_DIR" ]; then
    mkdir -p "$LOG_DIR"
    echo "Created logs directory"
fi

# 檢查日誌文件大小
echo "=== Log File Sizes ==="
du -h $LOG_DIR/*.log 2>/dev/null || echo "No log files found"

# 檢查錯誤日誌最新條目
echo -e "\n=== Recent Errors ==="
if [ -f "$LOG_DIR/error.log" ]; then
    tail -n 5 "$LOG_DIR/error.log"
else
    echo "No error log found"
fi

# 檢查日誌輪轉狀態
echo -e "\n=== Log Rotation Status ==="
ls -lah $LOG_DIR/ 2>/dev/null || echo "Logs directory empty"