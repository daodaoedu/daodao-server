#!/bin/bash

# 設置錯誤時退出
set -e

# 遠端機器資訊
REMOTE_HOST="daodao"  # SSH 目標，需在 ~/.ssh/config 配置過 Host 別名，否則使用 user@ip
REMOTE_LOG_DIR="/root/daodao-server/logs"
LOCAL_DEST_DIR="./logs"

# 取得當天的日期時間 (格式: YYYY-MM-DD_HH-MM-SS)
DOWNLOAD_TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
LOCAL_LOG_DIR="${LOCAL_DEST_DIR}/${DOWNLOAD_TIMESTAMP}"

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# 日誌函數
log() {
    local message="[$(date +'%Y-%m-%d %H:%M:%S')] $1"
    echo -e "${message}"
}

error() {
    log "${RED}錯誤: $1${NC}"
    exit 1
}

warning() {
    log "${YELLOW}警告: $1${NC}"
}

# 確保本地目錄存在
mkdir -p "${LOCAL_LOG_DIR}" || error "無法創建本地日誌目錄 ${LOCAL_LOG_DIR}"

# 檢查 SSH 連接
log "檢查遠端伺服器連接..."
if ! ssh -o ConnectTimeout=5 "$REMOTE_HOST" "echo 'Connection successful'" > /dev/null 2>&1; then
    error "無法連接到遠端伺服器 ${REMOTE_HOST}"
fi

# 檢查遠端日誌目錄是否存在
log "檢查遠端日誌目錄..."
if ! ssh "$REMOTE_HOST" "[ -d ${REMOTE_LOG_DIR} ]"; then
    error "遠端日誌目錄不存在: ${REMOTE_LOG_DIR}"
fi

# 獲取遠端日誌檔案列表
log "獲取遠端日誌檔案列表..."
REMOTE_FILES=$(ssh "$REMOTE_HOST" "find ${REMOTE_LOG_DIR} -type f \( -name '*.log' -o -name '*.txt' -o -name '*.out' -o -name '*.err' \) 2>/dev/null | wc -l" || echo "0")

if [ "$REMOTE_FILES" -eq "0" ]; then
    warning "遠端目錄中沒有找到日誌檔案"
    
    # 列出遠端目錄內容供參考
    log "遠端目錄內容："
    ssh "$REMOTE_HOST" "ls -la ${REMOTE_LOG_DIR}"
    
    read -p "是否仍要下載整個目錄？(y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
else
    log "找到 ${REMOTE_FILES} 個日誌檔案"
fi

# 下載日誌檔案
log "開始下載日誌檔案..."

# 使用 rsync 下載（保留檔案結構和時間戳）
if command -v rsync &> /dev/null; then
    log "使用 rsync 下載..."
    rsync -avz --progress \
        "${REMOTE_HOST}:${REMOTE_LOG_DIR}/" \
        "${LOCAL_LOG_DIR}/" \
        || error "rsync 下載失敗"
else
    # 備用方案：使用 scp
    log "使用 scp 下載..."
    scp -r "${REMOTE_HOST}:${REMOTE_LOG_DIR}/*" \
        "${LOCAL_LOG_DIR}/" \
        || error "scp 下載失敗"
fi

# 計算下載的檔案數量和大小
DOWNLOADED_FILES=$(find "${LOCAL_LOG_DIR}" -type f | wc -l)
TOTAL_SIZE=$(du -sh "${LOCAL_LOG_DIR}" | cut -f1)

# 自動解壓縮 gz 檔案
GZ_COUNT=$(find "${LOCAL_LOG_DIR}" -name "*.gz" | wc -l)
if [ "$GZ_COUNT" -gt 0 ]; then
    log "發現 ${GZ_COUNT} 個壓縮檔案，開始解壓縮..."
    
    # 解壓縮所有 gz 檔案（保留原始檔案）
    for gz_file in "${LOCAL_LOG_DIR}"/*.gz; do
        if [ -f "$gz_file" ]; then
            filename=$(basename "$gz_file")
            log "解壓縮 $filename..."
            gunzip -k "$gz_file" 2>/dev/null || warning "無法解壓縮 $filename"
        fi
    done
    
    log "${GREEN}解壓縮完成${NC}"
    
    # 重新計算檔案數量（包含解壓縮後的檔案）
    DOWNLOADED_FILES=$(find "${LOCAL_LOG_DIR}" -type f | wc -l)
    TOTAL_SIZE=$(du -sh "${LOCAL_LOG_DIR}" | cut -f1)
fi

# 創建下載摘要
log "創建下載摘要..."
cat > "${LOCAL_LOG_DIR}/download_summary.txt" << EOF
日誌下載摘要
========================================
下載時間: $(date +'%Y-%m-%d %H:%M:%S')
遠端伺服器: ${REMOTE_HOST}
遠端路徑: ${REMOTE_LOG_DIR}
本地路徑: ${LOCAL_LOG_DIR}
檔案數量: ${DOWNLOADED_FILES}
總大小: ${TOTAL_SIZE}
========================================

檔案列表:
$(ls -lah "${LOCAL_LOG_DIR}" | grep -v "^total" | grep -v "download_summary.txt")

最新的日誌檔案（按修改時間排序）:
$(find "${LOCAL_LOG_DIR}" -type f -name "*.log" -exec ls -lt {} + 2>/dev/null | head -10)
EOF

# 顯示最新的錯誤日誌（如果存在）
if ls "${LOCAL_LOG_DIR}"/*.err 2>/dev/null || ls "${LOCAL_LOG_DIR}"/error*.log 2>/dev/null; then
    log "${YELLOW}發現錯誤日誌檔案${NC}"
    echo "----------------------------------------"
    echo "最新錯誤日誌摘要（最後 20 行）："
    for error_file in "${LOCAL_LOG_DIR}"/*.err "${LOCAL_LOG_DIR}"/error*.log; do
        if [ -f "$error_file" ]; then
            echo "檔案: $(basename $error_file)"
            tail -20 "$error_file"
            echo "----------------------------------------"
        fi
    done
fi

# 可選：是否刪除 .gz 檔案（因為已經解壓縮）
read -p "是否刪除已解壓縮的 .gz 檔案以節省空間？(y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log "刪除 .gz 檔案..."
    find "${LOCAL_LOG_DIR}" -name "*.gz" -delete
    log "已刪除所有 .gz 檔案"
    
    # 重新計算大小
    TOTAL_SIZE=$(du -sh "${LOCAL_LOG_DIR}" | cut -f1)
fi

log "${GREEN}日誌下載完成！${NC}"
log "下載位置: ${LOCAL_LOG_DIR}"
log "檔案數量: ${DOWNLOADED_FILES}"
log "總大小: ${TOTAL_SIZE}"

# 提示可用的分析命令
echo ""
echo "可用的日誌分析命令："
echo "  查看所有錯誤: grep -r 'ERROR' ${LOCAL_LOG_DIR}"
echo "  查看最新日誌: tail -f ${LOCAL_LOG_DIR}/*.log"
echo "  統計錯誤數量: grep -r 'ERROR' ${LOCAL_LOG_DIR} | wc -l"