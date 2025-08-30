# Docker Registry Cache 部署加速指南

## 概述

Docker Registry Cache 是一個本地快取代理服務，用於加速 Docker image 的拉取速度。它會在第一次拉取時將 image 快取到本地伺服器，後續的拉取操作將直接從本地快取獲取，大大提升部署速度。

## 工作原理

```
正常流程：
Linode Server → Docker Hub (每次都要從網路下載)
部署時間：5-15分鐘

使用 Registry Cache：
Linode Server → 本地快取 → Docker Hub (只在第一次從網路下載)
部署時間：第一次 5-15分鐘，後續 30秒-2分鐘
```

## 安裝與設定

### 1. 安裝 Registry Cache

SSH 連線到你的 Linode 伺服器，執行以下指令：

```bash
# 創建資料目錄
sudo mkdir -p /opt/docker-registry-cache
sudo chown $USER:$USER /opt/docker-registry-cache

# 啟動 Registry Cache 容器
docker run -d \
  --name registry-cache \
  --restart=unless-stopped \
  --memory="256m" \
  --cpus="0.5" \
  -p 5000:5000 \
  -v /opt/docker-registry-cache:/var/lib/registry \
  -e REGISTRY_PROXY_REMOTEURL=https://registry-1.docker.io \
  -e REGISTRY_STORAGE_DELETE_ENABLED=true \
  -e REGISTRY_LOG_LEVEL=warn \
  registry:2
```

### 2. 設定 Docker Daemon

修改 Docker 設定以使用本地快取：

```bash
# 備份原始設定
sudo cp /etc/docker/daemon.json /etc/docker/daemon.json.backup 2>/dev/null || true

# 創建或更新 daemon.json
sudo tee /etc/docker/daemon.json > /dev/null <<EOF
{
  "registry-mirrors": ["http://localhost:5000"],
  "max-concurrent-downloads": 10,
  "max-concurrent-uploads": 5,
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF

# 重啟 Docker 服務
sudo systemctl restart docker

# 驗證設定
docker info | grep -A 10 "Registry Mirrors"
```

### 3. 驗證安裝

```bash
# 檢查 Registry Cache 狀態
docker ps | grep registry-cache

# 測試快取功能
docker pull hello-world
docker pull hello-world  # 第二次應該很快

# 檢查快取日誌
docker logs registry-cache
```

## 資源使用分析

### 磁碟空間需求

| 項目 | 大小估算 | 說明 |
|------|----------|------|
| 你的 App Image (dev) | ~250MB | 包含 Node.js + 依賴 |
| 你的 App Image (prod) | ~250MB | 生產版本 |
| 歷史版本快取 | ~1.5GB | 保留 6 個舊版本 |
| 基礎 Images 快取 | ~1GB | node:20-alpine 等 |
| **總計** | **~3-4GB** | 可透過清理政策控制 |

### 記憶體與 CPU

- **記憶體使用**: 128-256MB (限制在容器設定中)
- **CPU 使用**: 
  - 待機時: 0-1% CPU
  - 拉取時: 5-15% CPU (短暫)
- **網路**: 只有第一次拉取使用外網，後續為內網傳輸

## 維護與監控

### 自動清理設定

設定定期清理舊版本以節省空間：

```bash
# 創建清理腳本
sudo tee /usr/local/bin/registry-cleanup.sh > /dev/null <<'EOF'
#!/bin/bash
echo "Starting registry cleanup..."
docker exec registry-cache registry garbage-collect /etc/docker/registry/config.yml --delete-untagged=true
echo "Registry cleanup completed"
EOF

sudo chmod +x /usr/local/bin/registry-cleanup.sh

# 設定每週日凌晨 2 點執行清理
echo "0 2 * * 0 /usr/local/bin/registry-cleanup.sh >> /var/log/registry-cleanup.log 2>&1" | sudo crontab -
```

### 監控指令

```bash
# 檢查快取使用情況
du -sh /opt/docker-registry-cache

# 檢查容器狀態
docker stats registry-cache --no-stream

# 查看最近的拉取日誌
docker logs registry-cache --tail 50

# 檢查快取命中率 (在部署時觀察)
docker logs registry-cache | grep -E "(GET|HEAD)" | tail -20
```

### 效能監控腳本

創建一個簡單的監控腳本：

```bash
# 創建監控腳本
sudo tee /usr/local/bin/registry-monitor.sh > /dev/null <<'EOF'
#!/bin/bash
echo "=== Docker Registry Cache Status ==="
echo "Date: $(date)"
echo

echo "Container Status:"
docker ps --filter name=registry-cache --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo

echo "Memory Usage:"
docker stats registry-cache --no-stream --format "table {{.Container}}\t{{.MemUsage}}\t{{.CPUPerc}}"
echo

echo "Disk Usage:"
du -sh /opt/docker-registry-cache
echo

echo "Recent Activity (Last 10 entries):"
docker logs registry-cache --tail 10
echo "=================================="
EOF

sudo chmod +x /usr/local/bin/registry-monitor.sh

# 執行監控
sudo /usr/local/bin/registry-monitor.sh
```

## 部署流程整合

### 修改現有部署腳本

你現有的 CI/CD 流程不需要大幅修改，Registry Cache 會自動生效：

```bash
# 在 .github/workflows/main.yml 中，這行會自動使用快取
docker-compose --env-file .env.${APP_ENV} -f $COMPOSE_FILE pull $APP_SERVICE
```

### 效能提升預期

| 場景 | 原本時間 | 使用快取後 | 提升幅度 |
|------|----------|------------|----------|
| 首次部署 | 5-15分鐘 | 5-15分鐘 | 無改善 |
| 後續部署 (相同版本) | 5-15分鐘 | 10-30秒 | **95%+ 提升** |
| 後續部署 (新版本) | 5-15分鐘 | 1-3分鐘 | **70-80% 提升** |

## 故障排除

### 常見問題

**1. Registry Cache 無法啟動**
```bash
# 檢查端口占用
sudo netstat -tlnup | grep :5000
# 檢查權限
ls -la /opt/docker-registry-cache
```

**2. 快取沒有生效**
```bash
# 檢查 Docker daemon 設定
docker info | grep -A 5 "Registry Mirrors"
# 測試連線
curl -I http://localhost:5000/v2/
```

**3. 磁碟空間不足**
```bash
# 手動清理
docker exec registry-cache registry garbage-collect /etc/docker/registry/config.yml --delete-untagged=true
# 或重新創建容器
docker rm -f registry-cache
```

### 恢復原始設定

如果需要移除 Registry Cache：

```bash
# 停止並移除容器
docker stop registry-cache
docker rm registry-cache

# 恢復 Docker daemon 設定
sudo mv /etc/docker/daemon.json.backup /etc/docker/daemon.json
sudo systemctl restart docker

# 清理快取檔案
sudo rm -rf /opt/docker-registry-cache
```

## 安全性考量

- Registry Cache 只在本地網路運行 (127.0.0.1:5000)
- 不暴露到外網，無額外安全風險
- 所有 image 仍來自官方 Docker Hub，只是本地快取
- 支援 HTTPS 上游連線，保持安全性

## 成本效益分析

### 資源成本
- **磁碟空間**: 3-4GB (一次性)
- **記憶體**: 128-256MB (持續)
- **CPU**: 幾乎無影響

### 效益回報
- **部署時間**: 減少 70-95%
- **網路流量**: 減少 80-90% 外網使用
- **開發效率**: 大幅提升迭代速度
- **伺服器負載**: 降低網路等待時間

## 結論

Docker Registry Cache 是一個低成本、高效益的解決方案，特別適合你目前頻繁部署的開發環境。雖然第一次設定需要一些時間，但長期來看會大大改善開發體驗和部署效率。

建議優先實施這個方案，因為它：
1. 資源消耗極低
2. 不影響現有架構
3. 效果立竿見影
4. 維護成本低

---

**注意**: 這個方案主要解決 Docker image 拉取速度問題。如果你的部署瓶頸在其他地方（如應用啟動時間、資料庫連線等），可能需要額外的優化措施。