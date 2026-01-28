# n8n VPS 部署指南（精簡版）

## 概述
在已有 daodao-server 的 VPS 上快速部署 n8n，共用現有的 Nginx 和資料庫環境。

## 步驟一：快速部署 n8n

### 1.1 創建工作目錄
```bash
mkdir ~/n8n
cd ~/n8n
```

### 1.2 創建 docker-compose.yml
```yaml
version: '3.8'

services:
  n8n:
    image: n8nio/n8n:latest
    container_name: n8n
    restart: always
    # 不暴露對外端口，只通過 Nginx 訪問
    expose:
      - "5678"
    environment:
      # 基本配置
      - N8N_HOST=${N8N_HOST}
      - N8N_PORT=5678
      - N8N_PROTOCOL=https
      - WEBHOOK_URL=https://${N8N_HOST}
      - GENERIC_TIMEZONE=Asia/Taipei
      
      # 認證
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=${N8N_USER}
      - N8N_BASIC_AUTH_PASSWORD=${N8N_PASSWORD}
      
      # 加密密鑰
      - N8N_ENCRYPTION_KEY=${ENCRYPTION_KEY}
      
      # 使用共用的 PostgreSQL（參考專案配置）
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=${POSTGRES_HOST}  # 例如: pg-prod 或 pg-dev.daodao-storage.orb.local
      - DB_POSTGRESDB_PORT=5432
      - DB_POSTGRESDB_USER=${POSTGRES_USER}
      - DB_POSTGRESDB_PASSWORD=${POSTGRES_PASSWORD}
      - DB_POSTGRESDB_DATABASE=n8n  # n8n 專用資料庫
      
      # 執行日誌設置
      - EXECUTIONS_DATA_PRUNE=true
      - EXECUTIONS_DATA_MAX_AGE=168
    volumes:
      - ./data:/home/node/.n8n
    networks:
      - prod-daodao-network  # 使用專案的網路來連接 PostgreSQL
```

### 1.3 創建 .env 文件
```bash
vim .env
```

```env
# n8n 域名
N8N_HOST=n8n.daoedu.tw

# 登入憑證
N8N_USER=admin
N8N_PASSWORD=your-secure-password

# 加密密鑰（使用 openssl rand -base64 32 生成）
ENCRYPTION_KEY=your-generated-encryption-key

# PostgreSQL 連線資訊（參考專案的 .env.prod 或 .env.dev）
POSTGRES_HOST=pg-prod  # 或 pg-dev.daodao-storage.orb.local
POSTGRES_USER=daodao
POSTGRES_PASSWORD=daodao

# 或者直接使用 DATABASE_URL 格式
# DATABASE_URL=postgresql://daodao:daodao@pg-prod:5432/n8n
```

### 1.4 在 PostgreSQL 創建 n8n 資料庫
```bash
# 使用專案的 PostgreSQL 連線資訊
psql -h pg-prod -U daodao -d daodao

# 創建 n8n 專用資料庫（需要有創建資料庫的權限）
CREATE DATABASE n8n;

# 或者使用現有的 daodao 資料庫，n8n 會自動創建自己的表格
# 如果使用現有資料庫，修改 .env 中的 DB_POSTGRESDB_DATABASE=daodao
```

### 1.5 確保網路存在並啟動 n8n
```bash
# 創建外部網路（如果還沒有）
docker network create prod-daodao-network

# 啟動 n8n
docker compose up -d

# 查看日誌確認是否正常運行
docker compose logs -f
```

## 步驟二：配置 Nginx 反向代理（添加到現有專案配置）

### 2.1 修改專案的 nginx.conf

在你的專案根目錄下的 `nginx.conf` 文件中，在 `http` 區塊的最後（第 123 行後）添加以下配置：

```nginx
    # n8n workflow automation
    server {
        listen 80;
        server_name n8n.daoedu.tw;  # 使用你想要的子域名

        location / {
            proxy_pass http://n8n:5678;  # 使用容器名稱，因為在同一網路
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # WebSocket 支援（n8n 需要）
            proxy_read_timeout 86400;
            
            # 檔案上傳大小限制
            client_max_body_size 50M;
            
            proxy_connect_timeout 300s;
            proxy_send_timeout 300s;
        }
    }
```

### 2.2 重新載入 Nginx 配置

如果你的 Nginx 是在 Docker 容器中運行：

```bash
# 查看 nginx 容器名稱
docker ps | grep nginx

# 重新載入配置（替換 your-nginx-container 為實際容器名）
docker exec your-nginx-container nginx -s reload
```

## 步驟三：Cloudflare DNS 配置

### 3.1 添加 DNS 記錄
1. 登入 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 選擇域名
3. 進入 **DNS** → **Records**
4. 添加 A 記錄：
   - **Type**: A
   - **Name**: n8n
   - **IPv4 address**: VPS IP
   - **Proxy status**: 開啟（橙色雲朵）

### 3.2 SSL/TLS 設置
1. 進入 **SSL/TLS** → **Overview**
2. 選擇 **Flexible** 模式
3. 進入 **SSL/TLS** → **Edge Certificates**
4. 開啟 **Always Use HTTPS**

## 步驟四：測試

### 4.1 本地測試
```bash
# 測試 n8n 是否運行（通過容器內部網路）
docker exec n8n curl http://localhost:5678

# 查看容器狀態
docker ps | grep n8n

# 或通過 Nginx 測試
curl -H "Host: n8n.daoedu.tw" http://localhost
```

### 4.2 域名測試
等待 DNS 生效後，訪問 `https://n8n.daoedu.tw`

## 常用管理命令

### 查看日誌
```bash
docker compose logs -f n8n
```

### 重啟服務
```bash
docker compose restart n8n
```

### 更新 n8n
```bash
docker compose pull
docker compose up -d
```

### 備份工作流程
```bash
# 備份資料夾
tar -czf n8n-backup-$(date +%Y%m%d).tar.gz ~/n8n/data

# 備份資料庫
pg_dump -U your_db_user -d n8n > n8n-db-backup-$(date +%Y%m%d).sql
```

## 故障排除

### 無法連接資料庫
```bash
# 檢查 Docker 網路
docker network ls

# 測試資料庫連接
docker exec -it n8n ping host.docker.internal
```

### Webhook 無法訪問
確保 docker-compose.yml 中的 WEBHOOK_URL 設置正確：
```yaml
- WEBHOOK_URL=https://n8n.yourdomain.com
```

### 記憶體不足
```bash
# 查看容器資源使用
docker stats n8n

# 限制記憶體使用（在 docker-compose.yml 中添加）
deploy:
  resources:
    limits:
      memory: 2G
```

## 安全建議

1. **定期更新**：`docker compose pull && docker compose up -d`
2. **使用強密碼**：確保 N8N_PASSWORD 足夠複雜
3. **限制訪問**：可透過 Cloudflare Access 設置訪問控制
4. **定期備份**：設置自動備份腳本

## 安全架構說明

這個配置確保了：
1. **n8n 不直接暴露端口**：只能通過 Nginx 反向代理訪問
2. **網路隔離**：n8n 在 Docker 網路內部運行
3. **共用基礎設施**：使用現有的 Nginx、PostgreSQL 和網路配置
4. **SSL 加密**：通過 Cloudflare 提供 HTTPS 訪問

## 完成！
現在你可以通過 `https://n8n.daoedu.tw` 訪問 n8n，開始創建自動化工作流程。