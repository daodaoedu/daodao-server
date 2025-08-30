# Nginx 多域名配置指南

## 現有服務多域名配置

如果你有多個域名要指向同一個現有服務，可以在 `server_name` 中列出所有域名。

### 方案一：多個域名指向同一服務

修改現有的 nginx.conf：

```nginx
server {
    listen 80;
    # 列出所有要指向這個服務的域名
    server_name dao-server.daoedu.tw server.daoedu.tw api.example.com app.example.org;

    location / {
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 根據不同域名轉發到不同端口（如果需要）
        if ($host = dao-server.daoedu.tw) {
            proxy_pass http://127.0.0.1:8080;
        }
        if ($host = server.daoedu.tw) {
            proxy_pass http://127.0.0.1:8081;
        }
        # 新域名都指向同一個服務
        if ($host = api.example.com) {
            proxy_pass http://127.0.0.1:8080;  # 指向生產環境
        }
        if ($host = app.example.org) {
            proxy_pass http://127.0.0.1:8080;  # 也指向生產環境
        }
    }
}
```

### 方案二：使用正則表達式匹配域名

如果域名有規律，可以使用正則表達式：

```nginx
server {
    listen 80;
    # 使用正則匹配多個域名
    server_name ~^(www\.)?daoedu\.tw$ ~^.*\.daoedu\.tw$;
    
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 方案三：通配符域名

支援子域名通配：

```nginx
server {
    listen 80;
    # *.daoedu.tw 會匹配所有子域名
    server_name *.daoedu.tw daoedu.tw;
    
    location / {
        # 所有子域名都轉發到同一個後端
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 方案四：預設服務器（catch-all）

設置一個預設服務器處理所有未明確配置的域名：

```nginx
# 預設服務器，處理所有未匹配的請求
server {
    listen 80 default_server;
    server_name _;  # 匹配所有域名
    
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# 特定域名的配置
server {
    listen 80;
    server_name n8n.daoedu.tw;
    
    location / {
        proxy_pass http://host.docker.internal:5678;
        # n8n 專用配置...
    }
}
```

## 完整範例：整合現有服務和 n8n

以下是一個完整的 nginx.conf 範例，支援多個域名指向現有服務，同時配置 n8n：

```nginx
http {
    # ... 其他配置 ...

    # 主服務 - 支援多個域名
    server {
        listen 80;
        server_name dao-server.daoedu.tw 
                    server.daoedu.tw 
                    api.daoedu.tw 
                    app.daoedu.tw
                    legacy.example.com;  # 可以加入其他域名

        location / {
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # 根據域名決定轉發目標
            if ($host ~* ^(dao-server|api|app)\.daoedu\.tw$) {
                proxy_pass http://127.0.0.1:8080;  # 生產環境
            }
            if ($host = server.daoedu.tw) {
                proxy_pass http://127.0.0.1:8081;  # 開發環境
            }
            if ($host = legacy.example.com) {
                proxy_pass http://127.0.0.1:8080;  # 也指向生產
            }
        }
    }

    # 生產環境內部服務
    server {
        listen 8080;
        server_name dao-server.daoedu.tw api.daoedu.tw app.daoedu.tw;

        location / {
            proxy_pass http://prod_app:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            proxy_connect_timeout 300s;
            proxy_send_timeout 300s;
            proxy_read_timeout 300s;
        }
    }

    # 開發環境內部服務
    server {
        listen 8081;
        server_name server.daoedu.tw;

        location / {
            proxy_pass http://dev_app:3000;
            # ... 其他配置 ...
        }
    }

    # n8n 服務
    server {
        listen 80;
        server_name n8n.daoedu.tw workflow.daoedu.tw;  # n8n 也可以有多個域名

        location / {
            proxy_pass http://host.docker.internal:5678;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_read_timeout 86400;
            client_max_body_size 50M;
        }
    }
}
```

## Cloudflare DNS 配置

在 Cloudflare 中為每個域名添加 A 記錄：

1. **主域名和子域名**
   - `dao-server.daoedu.tw` → VPS IP
   - `server.daoedu.tw` → VPS IP
   - `api.daoedu.tw` → VPS IP
   - `app.daoedu.tw` → VPS IP
   - `n8n.daoedu.tw` → VPS IP

2. **其他域名**（如果有）
   - `legacy.example.com` → VPS IP
   - `workflow.daoedu.tw` → VPS IP

所有記錄都應該：
- Type: A
- Proxy status: 開啟（橙色雲朵）
- TTL: Auto

## 測試配置

```bash
# 測試 Nginx 配置語法
docker exec nginx-container nginx -t

# 重載配置
docker exec nginx-container nginx -s reload

# 測試各個域名
curl -H "Host: dao-server.daoedu.tw" http://localhost
curl -H "Host: api.daoedu.tw" http://localhost
curl -H "Host: n8n.daoedu.tw" http://localhost
```

## 注意事項

1. **域名優先級**：Nginx 會按照以下順序匹配域名：
   - 精確匹配
   - 通配符開頭（*.example.com）
   - 通配符結尾（mail.*）
   - 正則表達式
   - default_server

2. **性能考慮**：避免在 location 中使用過多 if 語句，可以考慮為不同服務創建獨立的 server 區塊

3. **SSL 配置**：使用 Cloudflare 的 Flexible 模式時，所有域名都會自動獲得 HTTPS 支援

4. **調試技巧**：
   ```bash
   # 查看 Nginx 錯誤日誌
   docker logs nginx-container
   
   # 測試特定域名解析
   nslookup dao-server.daoedu.tw
   nslookup api.daoedu.tw
   ```