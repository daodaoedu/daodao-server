#!/bin/bash

# 部署重試腳本
# 用途：在資源優化後重新執行部署

set -e  # 遇到錯誤立即退出

echo "============================================"
echo "部署重試腳本"
echo "時間: $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================"
echo ""

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 環境變數（dev 或 prod）
APP_ENV=${1:-dev}
APP_DIR="/root/daodao-server"

echo "📝 配置："
echo "----------------------------------------"
echo "環境: $APP_ENV"
echo "目錄: $APP_DIR"
echo ""

# 檢查是否為 root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}❌ 錯誤：此腳本需要 root 權限${NC}"
  echo "請使用: sudo bash scripts/redeploy.sh [$APP_ENV]"
  exit 1
fi

# 1. 資源預檢
echo "🔍 步驟 1/6: 資源預檢"
echo "----------------------------------------"

# 檢查記憶體
MEM_AVAIL=$(free -m | grep Mem | awk '{print $7}')
SWAP_FREE=$(free -m | grep Swap | awk '{print $4}')
DISK_AVAIL=$(df -BG / | tail -1 | awk '{print $4}' | sed 's/G//')

echo "可用記憶體: ${MEM_AVAIL}MB"
echo "可用 Swap: ${SWAP_FREE}MB"
echo "可用磁碟: ${DISK_AVAIL}GB"

# 檢查最低要求
MIN_MEM=200
MIN_DISK=5

if [ "$MEM_AVAIL" -lt "$MIN_MEM" ] && [ "$SWAP_FREE" -lt 500 ]; then
  echo -e "${RED}❌ 錯誤：可用記憶體不足${NC}"
  echo "建議先增加 swap: bash scripts/increase-swap.sh"
  exit 1
fi

if [ "$DISK_AVAIL" -lt "$MIN_DISK" ]; then
  echo -e "${RED}❌ 錯誤：磁碟空間不足${NC}"
  echo "需要至少 ${MIN_DISK}GB 可用空間"
  exit 1
fi

echo -e "${GREEN}✅ 資源檢查通過${NC}"
echo ""

# 2. Docker 資源清理
echo "🧹 步驟 2/6: Docker 資源清理"
echo "----------------------------------------"

echo "清理 Docker build cache..."
docker builder prune -af --filter "until=24h" || true

echo "清理未使用的映像..."
docker image prune -af --filter "until=48h" || true

echo "清理停止的容器..."
docker container prune -f || true

echo "清理未使用的 volumes..."
docker volume prune -f || true

echo -e "${GREEN}✅ Docker 清理完成${NC}"
echo ""

# 3. 切換到項目目錄
echo "📂 步驟 3/6: 切換到項目目錄"
echo "----------------------------------------"

if [ ! -d "$APP_DIR" ]; then
  echo -e "${RED}❌ 錯誤：目錄不存在 $APP_DIR${NC}"
  exit 1
fi

cd $APP_DIR
echo "當前目錄: $(pwd)"
echo -e "${GREEN}✅ 目錄切換完成${NC}"
echo ""

# 4. 更新代碼
echo "📥 步驟 4/6: 更新代碼"
echo "----------------------------------------"

if [ -d .git ]; then
  git fetch origin $APP_ENV
  git reset --hard origin/$APP_ENV
  echo -e "${GREEN}✅ 代碼更新完成${NC}"
else
  echo -e "${YELLOW}⚠️  不是 git 倉庫，跳過更新${NC}"
fi
echo ""

# 5. 載入環境變數
echo "⚙️  步驟 5/6: 載入環境變數"
echo "----------------------------------------"

ENV_FILE=".env.$APP_ENV"
if [ -f "$ENV_FILE" ]; then
  set -a
  source "$ENV_FILE"
  set +a
  echo -e "${GREEN}✅ 環境變數已載入${NC}"
else
  echo -e "${YELLOW}⚠️  環境文件不存在: $ENV_FILE${NC}"
fi
echo ""

# 6. 執行部署
echo "🚀 步驟 6/6: 執行部署"
echo "----------------------------------------"

# 獲取當前 commit SHA
if [ -d .git ]; then
  COMMIT_SHA=$(git rev-parse HEAD)
  echo "Commit SHA: $COMMIT_SHA"
else
  COMMIT_SHA="latest"
  echo "使用 latest 標籤"
fi

# 設定映像標籤
IMAGE_TAG="${APP_ENV}-${COMMIT_SHA}"
IMAGE_NAME="${DOCKER_REGISTRY}/${DOCKER_IMAGE}:${IMAGE_TAG}"

echo "映像: $IMAGE_NAME"
echo ""

# 拉取新映像（分段顯示進度）
echo "正在拉取 Docker 映像..."
echo "這可能需要幾分鐘，請耐心等待..."
echo ""

if docker pull "$IMAGE_NAME"; then
  echo -e "${GREEN}✅ 映像拉取成功${NC}"
else
  echo -e "${RED}❌ 映像拉取失敗${NC}"
  echo "請檢查："
  echo "  1. 映像是否存在於 registry"
  echo "  2. Docker registry 登錄憑證是否有效"
  echo "  3. 網路連接是否正常"
  exit 1
fi
echo ""

# 停止舊容器
echo "停止舊容器..."
OLD_CONTAINER=$(docker ps -q -f name=${APP_ENV}_app)
if [ -n "$OLD_CONTAINER" ]; then
  docker stop $OLD_CONTAINER || true
  echo -e "${GREEN}✅ 舊容器已停止${NC}"
else
  echo "沒有找到運行中的舊容器"
fi
echo ""

# 啟動新容器
echo "啟動新容器..."
export IMAGE_TAG
export COMMIT_SHA

if docker-compose -f docker-compose.$APP_ENV.yml up -d; then
  echo -e "${GREEN}✅ 新容器已啟動${NC}"
else
  echo -e "${RED}❌ 容器啟動失敗${NC}"
  exit 1
fi
echo ""

# 等待容器健康檢查
echo "等待容器健康檢查..."
sleep 10

# 檢查容器狀態
CONTAINER_ID=$(docker ps -q -f name=${APP_ENV}_app)
if [ -n "$CONTAINER_ID" ]; then
  CONTAINER_STATUS=$(docker inspect -f '{{.State.Status}}' $CONTAINER_ID)
  if [ "$CONTAINER_STATUS" = "running" ]; then
    echo -e "${GREEN}✅ 容器運行正常${NC}"
  else
    echo -e "${RED}❌ 容器狀態異常: $CONTAINER_STATUS${NC}"
    echo "容器日誌："
    docker logs --tail 50 $CONTAINER_ID
    exit 1
  fi
else
  echo -e "${RED}❌ 未找到運行中的容器${NC}"
  exit 1
fi
echo ""

# 清理舊容器
if [ -n "$OLD_CONTAINER" ]; then
  echo "清理舊容器..."
  docker rm $OLD_CONTAINER || true
  echo -e "${GREEN}✅ 舊容器已清理${NC}"
fi
echo ""

# 7. 部署完成
echo "============================================"
echo -e "${GREEN}✅ 部署完成！${NC}"
echo "============================================"
echo ""
echo "📊 部署資訊："
echo "  - 環境: $APP_ENV"
echo "  - 映像: $IMAGE_NAME"
echo "  - 容器 ID: $CONTAINER_ID"
echo ""
echo "💡 後續操作："
echo "  - 查看日誌: docker logs -f ${APP_ENV}_app"
echo "  - 檢查狀態: docker ps"
echo "  - 檢查資源: bash scripts/check-server-resources.sh"
echo ""
