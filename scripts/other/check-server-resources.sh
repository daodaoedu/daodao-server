#!/bin/bash

# 系統資源檢查腳本
# 用途：診斷服務器資源使用情況，識別部署問題

echo "============================================"
echo "服務器資源診斷報告"
echo "時間: $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================"
echo ""

# 1. 磁碟空間檢查
echo "📊 磁碟使用情況："
echo "----------------------------------------"
df -h / | tail -1 | awk '{
  usage=$5;
  avail=$4;
  gsub(/%/, "", usage);
  print "使用率: " usage "%";
  print "可用空間: " avail;
  if (usage+0 > 80) print "⚠️  警告：磁碟使用率超過 80%";
  else if (usage+0 > 90) print "❌ 危險：磁碟使用率超過 90%";
  else print "✅ 磁碟空間充足";
}'
echo ""

# 2. 記憶體使用檢查
echo "💾 記憶體使用情況："
echo "----------------------------------------"
free -h | grep -E "Mem:|Swap:" | awk '
  NR==1 {
    total=$2; used=$3; free=$4;
    usage_percent=($3/$2)*100;
    printf "總記憶體: %s\n使用中: %s\n可用: %s\n使用率: %.1f%%\n", total, used, free, usage_percent;
    if (usage_percent > 85) print "⚠️  警告：記憶體使用率超過 85%";
    else print "✅ 記憶體使用正常";
  }
  NR==2 {
    total=$2; used=$3;
    if (total == "0B") {
      print "\n❌ 危險：未設定 Swap 空間";
    } else {
      usage_percent=($3/$2)*100;
      printf "\nSwap 總量: %s\nSwap 使用: %s\nSwap 使用率: %.1f%%\n", total, used, usage_percent;
      if (usage_percent > 90) print "❌ 危險：Swap 使用率超過 90%";
      else if (usage_percent > 70) print "⚠️  警告：Swap 使用率超過 70%";
      else print "✅ Swap 使用正常";
    }
  }
'
echo ""

# 3. Docker 資源使用
echo "🐳 Docker 資源使用："
echo "----------------------------------------"
if command -v docker &> /dev/null; then
  docker system df 2>/dev/null || echo "無法獲取 Docker 資源訊息"
else
  echo "Docker 未安裝"
fi
echo ""

# 4. 運行中的容器
echo "📦 運行中的容器："
echo "----------------------------------------"
if command -v docker &> /dev/null; then
  docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Size}}" 2>/dev/null || echo "無法獲取容器訊息"
else
  echo "Docker 未安裝"
fi
echo ""

# 5. 系統負載
echo "⚡ 系統負載："
echo "----------------------------------------"
uptime
echo ""

# 6. Top 5 耗費記憶體的進程
echo "🔝 前 5 名耗費記憶體的進程："
echo "----------------------------------------"
ps aux --sort=-%mem | head -6 | awk 'NR==1 {print $0} NR>1 {printf "%s\t%s%%\t%s%%\t%s\n", $11, $3, $4, $2}'
echo ""

# 7. 建議
echo "============================================"
echo "💡 建議措施："
echo "============================================"

# 檢查是否需要增加 swap
SWAP_TOTAL=$(free -m | grep Swap | awk '{print $2}')
MEM_USAGE=$(free | grep Mem | awk '{printf "%.0f", ($3/$2)*100}')
SWAP_USAGE=$(free | grep Swap | awk '{if ($2>0) printf "%.0f", ($3/$2)*100; else print "100"}')

if [ "$SWAP_TOTAL" -lt 2048 ] || [ "$SWAP_USAGE" -gt 80 ]; then
  echo "1. ⚠️  建議增加 Swap 空間："
  echo "   執行: bash scripts/increase-swap.sh"
  echo ""
fi

if [ "$MEM_USAGE" -gt 85 ]; then
  echo "2. ⚠️  記憶體使用率過高，建議："
  echo "   - 清理 Docker 資源: docker system prune -af"
  echo "   - 重啟部分服務以釋放記憶體"
  echo ""
fi

# 檢查磁碟空間
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
  echo "3. ⚠️  磁碟空間不足，建議："
  echo "   - 清理 Docker build cache: docker builder prune -af"
  echo "   - 清理舊映像: docker image prune -af"
  echo ""
fi

echo "============================================"
echo "檢查完成"
echo "============================================"
