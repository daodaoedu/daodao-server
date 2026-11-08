#!/bin/bash

###############################################################################
# 設定日誌備份的 cron job
# 用途：將 download-logs.sh 加入 crontab 定時執行
###############################################################################

set -e

# 顏色定義
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../log-consumer-scope.sh"
log_consumer_scope "$@"
DOWNLOAD_SCRIPT="$SCRIPT_DIR/download-logs.sh"
CRON_LOG_FILE="$SCRIPT_DIR/../../logs/cron-backup.log"

echo -e "${YELLOW}=== 設定日誌備份 Cron Job ===${NC}"
echo ""

# 檢查腳本是否存在
if [ ! -f "$DOWNLOAD_SCRIPT" ]; then
    echo "錯誤：找不到 download-logs.sh"
    exit 1
fi

# 確保腳本有執行權限
# Downloader is invoked through bash; source permissions are unchanged.


echo "請選擇備份頻率："
echo "1) 每天凌晨 2:00 備份（推薦）"
echo "2) 每週日凌晨 2:00 備份"
echo "3) 每 6 小時備份一次"
echo "4) 自訂 cron 表達式"
echo "5) 僅顯示當前 cron 設定（不修改）"
echo ""
read -p "請選擇 [1-5]: " choice

case $choice in
    1)
        CRON_SCHEDULE="0 2 * * *"
        DESCRIPTION="每天凌晨 2:00"
        ;;
    2)
        CRON_SCHEDULE="0 2 * * 0"
        DESCRIPTION="每週日凌晨 2:00"
        ;;
    3)
        CRON_SCHEDULE="0 */6 * * *"
        DESCRIPTION="每 6 小時"
        ;;
    4)
        read -p "請輸入 cron 表達式（例如: 0 3 * * *）: " CRON_SCHEDULE
        DESCRIPTION="自訂時間"
        ;;
    5)
        echo ""
        echo -e "${GREEN}=== 當前 cron 設定 ===${NC}"
        crontab -l 2>/dev/null | grep -E "download-logs\.sh|日誌備份" || echo "未找到相關的 cron job"
        exit 0
        ;;
    *)
        echo "無效的選擇"
        exit 1
        ;;
esac

# Read and obtain approval before writing any wrapper or cron state.
WRAPPER_SCRIPT="$SCRIPT_DIR/download-logs-$LOG_ENV-cron-wrapper.sh"
if CURRENT_CRON=$(LC_ALL=C crontab -l 2>&1); then
    :
else
    CRON_READ_STATUS=$?
    NO_CRONTAB_PATTERN='^(crontab: )?no crontab for [a-zA-Z0-9_.-]+$'
    if [ "$CRON_READ_STATUS" -eq 1 ] && [[ "$CURRENT_CRON" =~ $NO_CRONTAB_PATTERN ]]; then
        CURRENT_CRON=''
    else
        echo 'Cannot read existing crontab; no backup settings were changed' >&2
        exit 1
    fi
fi
if [ -e "$WRAPPER_SCRIPT" ] || printf '%s\n' "$CURRENT_CRON" | grep -Fq "$WRAPPER_SCRIPT"; then
    echo -e "${YELLOW}偵測到已存在的日誌備份設定${NC}"
    read -p "是否覆蓋？(y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "已取消"
        exit 0
    fi
fi

# Stage locally and restore the exact prior wrapper if crontab rejects install.
STAGE_DIR=$(mktemp -d "$SCRIPT_DIR/.log-backup.XXXXXX")
WRAPPER_CANDIDATE="$STAGE_DIR/wrapper"
WRAPPER_INSTALLED=no
COMMITTED=no
HAD_WRAPPER=no
if [ -e "$WRAPPER_SCRIPT" ]; then
    cp -p "$WRAPPER_SCRIPT" "$STAGE_DIR/previous-wrapper"
    HAD_WRAPPER=yes
fi
cleanup() {
    if [ "$WRAPPER_INSTALLED" = yes ] && [ "$COMMITTED" != yes ]; then
        if [ "$HAD_WRAPPER" = yes ]; then
            mv -f "$STAGE_DIR/previous-wrapper" "$WRAPPER_SCRIPT"
        else
            rm -f "$WRAPPER_SCRIPT"
        fi
    fi
    rm -rf "$STAGE_DIR"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

printf '#!/bin/bash\nexport DAODAO_LOG_ROOT=%q\nLOG_ENV=%q\n' "${DAODAO_LOG_ROOT:-/var/log/daodao-server}" "$LOG_ENV" > "$WRAPPER_CANDIDATE"
cat >> "$WRAPPER_CANDIDATE" << 'EOF'
#!/bin/bash
# Cron wrapper for download-logs.sh (非互動式執行)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOWNLOAD_SCRIPT="$SCRIPT_DIR/download-logs.sh"
LOG_FILE="$SCRIPT_DIR/../../logs/cron-backup.log"

# 建立日誌目錄
mkdir -p "$(dirname "$LOG_FILE")"

# 記錄開始時間
echo "========================================" >> "$LOG_FILE"
echo "[$(date +'%Y-%m-%d %H:%M:%S')] 開始自動備份" >> "$LOG_FILE"

# Downloader is noninteractive and retains compressed local copies.
EXIT_CODE=0
bash "$DOWNLOAD_SCRIPT" --env "$LOG_ENV" >> "$LOG_FILE" 2>&1 || EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ✓ 備份成功" >> "$LOG_FILE"
else
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ✗ 備份失敗 (exit code: $EXIT_CODE)" >> "$LOG_FILE"
fi

echo "========================================" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

exit $EXIT_CODE
EOF

chmod +x "$WRAPPER_CANDIDATE"
CRON_JOB="$CRON_SCHEDULE $WRAPPER_SCRIPT"
CRON_COMMENT="# DaoDao 日誌自動備份 - $DESCRIPTION"
# Build one replacement table; never remove the active job in a separate write.
{
    printf '%s\n' "$CURRENT_CRON" | grep -Fv "$WRAPPER_SCRIPT" || true
    printf '\n%s\n%s\n' "$CRON_COMMENT" "$CRON_JOB"
} > "$STAGE_DIR/crontab"
mv -f "$WRAPPER_CANDIDATE" "$WRAPPER_SCRIPT"
WRAPPER_INSTALLED=yes
if ! crontab - < "$STAGE_DIR/crontab"; then
    echo 'Cron install failed; restoring previous wrapper' >&2
    exit 1
fi
COMMITTED=yes

echo ""
echo -e "${GREEN}✓ Cron job 設定成功！${NC}"
echo ""
echo "排程: $DESCRIPTION ($CRON_SCHEDULE)"
echo "腳本: $WRAPPER_SCRIPT"
echo "日誌: $CRON_LOG_FILE"
echo ""
echo "=== 當前的 crontab 設定 ==="
crontab -l | tail -5
echo ""
echo "提示："
echo "  - 查看備份日誌: tail -f $CRON_LOG_FILE"
echo "  - 手動執行測試: bash $DOWNLOAD_SCRIPT --env $LOG_ENV"
echo "  - 移除 cron job: crontab -e（然後刪除相關行）"
echo "  - 查看所有 cron: crontab -l"
