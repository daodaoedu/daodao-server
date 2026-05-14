#!/bin/bash

# Swap 空間擴展腳本
# 用途：增加服務器 swap 空間以解決記憶體不足問題

set -e  # 遇到錯誤立即退出

echo "============================================"
echo "Swap 空間擴展腳本"
echo "時間: $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================"
echo ""

# 檢查是否為 root
if [ "$EUID" -ne 0 ]; then
  echo "❌ 錯誤：此腳本需要 root 權限"
  echo "請使用: sudo bash scripts/increase-swap.sh"
  exit 1
fi

# 1. 顯示當前狀態
echo "📊 當前 Swap 狀態："
echo "----------------------------------------"
free -h | grep Swap
echo ""

# 2. 設定 swap 大小（預設 4GB）
SWAP_SIZE=${1:-4G}
SWAP_FILE="/swapfile_additional"

echo "📝 配置："
echo "----------------------------------------"
echo "Swap 大小: $SWAP_SIZE"
echo "Swap 文件: $SWAP_FILE"
echo ""

# 3. 檢查是否已存在
if [ -f "$SWAP_FILE" ]; then
  echo "⚠️  警告：$SWAP_FILE 已存在"
  read -p "是否刪除並重新創建？ (y/N): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "停用舊的 swap 文件..."
    swapoff "$SWAP_FILE" 2>/dev/null || true
    rm -f "$SWAP_FILE"
  else
    echo "取消操作"
    exit 0
  fi
fi

# 4. 檢查磁碟空間
echo "🔍 檢查磁碟空間..."
REQUIRED_SPACE_GB=$(echo $SWAP_SIZE | sed 's/G//')
AVAILABLE_SPACE_GB=$(df -BG / | tail -1 | awk '{print $4}' | sed 's/G//')

if [ "$AVAILABLE_SPACE_GB" -lt "$REQUIRED_SPACE_GB" ]; then
  echo "❌ 錯誤：磁碟空間不足"
  echo "需要: ${REQUIRED_SPACE_GB}GB"
  echo "可用: ${AVAILABLE_SPACE_GB}GB"
  echo ""
  echo "建議先清理 Docker 資源："
  echo "  docker system prune -af"
  echo "  docker builder prune -af"
  exit 1
fi

echo "✅ 磁碟空間充足 (可用: ${AVAILABLE_SPACE_GB}GB)"
echo ""

# 5. 創建 swap 文件
echo "🔨 創建 swap 文件 (大小: $SWAP_SIZE)..."
echo "這可能需要幾分鐘，請耐心等待..."

# 使用 fallocate（快速）或 dd（兼容性好）
if command -v fallocate &> /dev/null; then
  fallocate -l $SWAP_SIZE $SWAP_FILE
  echo "✅ Swap 文件創建完成 (使用 fallocate)"
else
  # 計算 dd 的 count（假設 1G = 1024M）
  SIZE_MB=$((REQUIRED_SPACE_GB * 1024))
  dd if=/dev/zero of=$SWAP_FILE bs=1M count=$SIZE_MB status=progress
  echo "✅ Swap 文件創建完成 (使用 dd)"
fi

# 6. 設定權限
echo "🔒 設定文件權限..."
chmod 600 $SWAP_FILE
echo "✅ 權限設定完成"

# 7. 格式化為 swap
echo "💾 格式化為 swap..."
mkswap $SWAP_FILE

# 8. 啟用 swap
echo "⚡ 啟用 swap..."
swapon $SWAP_FILE
echo "✅ Swap 已啟用"
echo ""

# 9. 驗證
echo "📊 新的 Swap 狀態："
echo "----------------------------------------"
free -h | grep Swap
swapon --show
echo ""

# 10. 設定開機自動掛載
echo "🔧 配置開機自動掛載..."
if ! grep -q "$SWAP_FILE" /etc/fstab; then
  echo "$SWAP_FILE none swap sw 0 0" >> /etc/fstab
  echo "✅ 已添加到 /etc/fstab"
else
  echo "⚠️  /etc/fstab 中已存在配置"
fi
echo ""

# 11. 優化 swap 使用策略（降低 swappiness）
echo "⚙️  優化 swap 使用策略..."
CURRENT_SWAPPINESS=$(cat /proc/sys/vm/swappiness)
echo "當前 swappiness: $CURRENT_SWAPPINESS"

# 設定 swappiness 為 10（較低值 = 盡量使用實體記憶體）
sysctl vm.swappiness=10
if ! grep -q "vm.swappiness" /etc/sysctl.conf; then
  echo "vm.swappiness=10" >> /etc/sysctl.conf
  echo "✅ 已設定 swappiness=10 並寫入 /etc/sysctl.conf"
else
  sed -i 's/vm.swappiness=.*/vm.swappiness=10/' /etc/sysctl.conf
  echo "✅ 已更新 swappiness=10"
fi
echo ""

# 12. 完成
echo "============================================"
echo "✅ Swap 空間擴展完成！"
echo "============================================"
echo ""
echo "📊 總結："
echo "  - 新增 swap: $SWAP_SIZE"
echo "  - Swap 文件: $SWAP_FILE"
echo "  - 已配置開機自動掛載"
echo "  - Swappiness 已優化為 10"
echo ""
echo "💡 建議："
echo "  - 重新檢查系統資源: bash scripts/check-server-resources.sh"
echo "  - 重新執行部署: bash scripts/redeploy.sh"
echo ""
