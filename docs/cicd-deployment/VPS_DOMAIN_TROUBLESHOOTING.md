# VPS Domain 無法讀取 API 文檔故障排除指南

## 問題現象
容器內測試正常（`localhost:3000` 可訪問），但外部 domain 無法讀取 API 文檔。

## 可能的原因和解決方案

### 1. 端口映射問題

**檢查 Docker 端口映射：**
```bash
# 檢查容器端口映射
docker ps --filter "name=daodao-server-dev_app"

# 應該看到類似：0.0.0.0:3000->3000/tcp 或 0.0.0.0:4000->3000/tcp
```

**常見問題：**
- 容器內監聽 3000 端口，但外部映射可能是其他端口
- 檢查 docker-compose.yml 或 docker run 命令中的端口配置

### 2. 反向代理配置問題

**檢查 Nginx 配置：**
```bash
# 檢查 Nginx 配置
sudo nginx -t
sudo systemctl status nginx

# 查看 API 文檔路由配置
sudo cat /etc/nginx/sites-available/your-domain | grep -A 10 -B 10 "api-docs"
```

**常見 Nginx 配置問題：**
```nginx
# 錯誤配置 - 可能缺少 api-docs 路由
location /api/ {
    proxy_pass http://localhost:3000;
}

# 正確配置 - 應該包含 api-docs
location /api-docs {
    proxy_pass http://localhost:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}

location /api/ {
    proxy_pass http://localhost:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

### 3. 防火牆設定

**檢查防火牆設定：**
```bash
# 檢查 ufw 狀態
sudo ufw status

# 檢查 iptables
sudo iptables -L

# 確保端口開放（假設是 3000 或 4000）
sudo ufw allow 3000
sudo ufw allow 4000
```

### 4. SSL/HTTPS 問題

**Mixed Content 問題：**
如果網站使用 HTTPS，但內部請求是 HTTP，可能會被阻擋。

**檢查方法：**
```bash
# 測試 HTTPS 訪問
curl -I https://your-domain.com/api-docs

# 檢查 SSL 證書
curl -I --insecure https://your-domain.com/api-docs
```

### 5. 環境變數差異

**檢查生產環境變數：**
```bash
# 在容器內檢查環境變數
docker exec -it $(docker ps --filter "name=daodao-server-dev_app" -q) env | grep -E "(NODE_ENV|PORT|HOST)"

# 檢查 docker-compose.yml 中的環境變數配置
```

**可能需要設定：**
```yaml
environment:
  - NODE_ENV=production
  - HOST=0.0.0.0
  - PORT=3000
```

### 6. 容器網路問題

**檢查容器網路：**
```bash
# 檢查容器網路配置
docker network ls
docker inspect $(docker ps --filter "name=daodao-server-dev_app" -q) | jq '.[0].NetworkSettings'
```

### 7. 日誌檢查

**檢查相關日誌：**
```bash
# Nginx 訪問日誌
sudo tail -f /var/log/nginx/access.log

# Nginx 錯誤日誌
sudo tail -f /var/log/nginx/error.log

# 容器應用日誌
docker logs -f $(docker ps --filter "name=daodao-server-dev_app" -q)

# 系統日誌
sudo journalctl -u nginx -f
```

## 具體診斷步驟

### 步驟 1：確認端口和服務
```bash
# 從 VPS 主機測試本地連接
curl -I localhost:3000/api-docs
curl -I localhost:4000/api-docs  # 如果映射到 4000

# 檢查端口監聽
sudo netstat -tlnp | grep -E ":(3000|4000|80|443)"
```

### 步驟 2：測試外部連接
```bash
# 從另一台機器測試
curl -I http://your-vps-ip:3000/api-docs
curl -I https://your-domain.com/api-docs
```

### 步驟 3：檢查代理配置
```bash
# 測試是否通過代理
curl -I https://your-domain.com/api-docs -H "Host: your-domain.com"

# 檢查代理頭部
curl -v https://your-domain.com/api-docs
```

## 常見解決方案

### 解決方案 1：修正 Nginx 配置
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # API 文檔路由
    location /api-docs {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # API 路由
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 解決方案 2：修正 Docker 配置
```yaml
# docker-compose.yml
services:
  app:
    ports:
      - "3000:3000"  # 確保端口映射正確
    environment:
      - NODE_ENV=production
      - HOST=0.0.0.0
```

### 解決方案 3：應用配置檢查
確保應用監聽所有介面：
```javascript
// 在 server.js 或 app.js 中
const HOST = process.env.HOST || '0.0.0.0';
const PORT = process.env.PORT || 3000;
app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
```

## 緊急診斷命令

請依序執行這些命令並回報結果：

```bash
# 1. 檢查 Docker 容器狀態
docker ps --filter "name=daodao-server-dev_app"

# 2. 檢查端口映射和監聽
sudo netstat -tlnp | grep -E ":(3000|4000|80|443)"

# 3. 測試本地連接
curl -I localhost:3000/api-docs 2>&1

# 4. 檢查 Nginx 狀態
sudo systemctl status nginx

# 5. 檢查 Nginx 配置語法
sudo nginx -t

# 6. 查看最近的 Nginx 錯誤日誌
sudo tail -20 /var/log/nginx/error.log
```