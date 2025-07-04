# DaoDao 三環境完整變數配置

> 📋 **基於無認證 MongoDB 的完整環境變數設置**

## 🏗️ 環境架構說明

- **PROD 環境**: `NODE_ENV=prod` - Linode 生產伺服器
- **DEV 環境**: `NODE_ENV=dev` - Linode 開發伺服器  
- **LOCAL 環境**: `NODE_ENV=local` - 開發者本機環境

## 📁 **1. 生產環境變數 (.env.prod)**

```bash
# ===== 基本環境配置 =====
NODE_ENV=prod
PORT=3000

# ===== 資料庫配置 =====
# PostgreSQL
POSTGRES_HOST=postgres-prod
POSTGRES_PORT=5432
POSTGRES_DB=daodao_prod
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_prod_password

# MongoDB (無認證模式)
MONGODB_URI=mongodb://mongo-prod:27017/daodao_prod
MONGO_DB_NAME=daodao_prod

# Redis
REDIS_HOST=redis-prod
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# ===== 安全配置 =====
JWT_SECRET=your_very_long_and_secure_jwt_secret_for_production_at_least_64_characters
SESSION_SECRET=your_very_long_session_secret_for_production_environment

# ===== 應用配置 =====
FRONTEND_URL=https://www.daoedu.tw
API_BASE_URL=https://dao-server.daoedu.tw

# ===== 第三方服務 =====
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_for_production
GOOGLE_CLIENT_SECRET=your_google_client_secret_for_production
GOOGLE_CALLBACK_URL=https://dao-server.daoedu.tw/auth/google/callback

# Cloudflare R2
CLOUDFLARE_R2_ACCOUNT_ID=your_cloudflare_account_id
CLOUDFLARE_R2_ACCESS_KEY_ID=your_cloudflare_access_key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_cloudflare_secret_key
CLOUDFLARE_R2_BUCKET_NAME=daodao-prod-storage
CLOUDFLARE_R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com

# Email 配置
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=noreply@daoedu.tw
EMAIL_PASSWORD=your_email_app_password
EMAIL_FROM=DaoDao <noreply@daoedu.tw>

# ===== 日誌與監控 =====
LOG_LEVEL=info
LOG_FILE_PATH=./logs/prod.log

# ===== 效能配置 =====
# PM2 相關
PM2_INSTANCES=2
PM2_MAX_MEMORY=200M

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
STRICT_RATE_LIMIT_MAX_REQUESTS=60

# ===== Docker Registry =====
DOCKER_IMAGE=ghcr.io/daodaoedu/daodao-server/daodao-app:latest
```

## 📁 **2. 開發環境變數 (.env.dev)**

```bash
# ===== 基本環境配置 =====
NODE_ENV=dev
PORT=3000

# ===== 資料庫配置 =====
# PostgreSQL
POSTGRES_HOST=postgres-dev
POSTGRES_PORT=5432
POSTGRES_DB=daodao_dev
POSTGRES_USER=postgres
POSTGRES_PASSWORD=dev_password_123

# MongoDB (無認證模式)
MONGODB_URI=mongodb://mongo-dev:27017/daodao_dev
MONGO_DB_NAME=daodao_dev

# Redis
REDIS_HOST=redis-dev
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# ===== 安全配置 =====
JWT_SECRET=dev_jwt_secret_for_development_environment_should_be_different_from_prod
SESSION_SECRET=dev_session_secret_for_development_environment

# ===== 應用配置 =====
FRONTEND_URL=https://dev.daoedu.tw
API_BASE_URL=https://server.daoedu.tw

# ===== 第三方服務 =====
# Google OAuth (開發環境)
GOOGLE_CLIENT_ID=your_google_client_id_for_development
GOOGLE_CLIENT_SECRET=your_google_client_secret_for_development
GOOGLE_CALLBACK_URL=https://server.daoedu.tw/auth/google/callback

# Cloudflare R2 (開發環境)
CLOUDFLARE_R2_ACCOUNT_ID=your_cloudflare_account_id
CLOUDFLARE_R2_ACCESS_KEY_ID=your_dev_cloudflare_access_key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_dev_cloudflare_secret_key
CLOUDFLARE_R2_BUCKET_NAME=daodao-dev-storage
CLOUDFLARE_R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com

# Email 配置 (開發環境)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=dev@daoedu.tw
EMAIL_PASSWORD=your_dev_email_password
EMAIL_FROM=DaoDao Dev <dev@daoedu.tw>

# ===== 日誌與監控 =====
LOG_LEVEL=debug
LOG_FILE_PATH=./logs/dev.log

# ===== 效能配置 =====
# PM2 相關
PM2_INSTANCES=2
PM2_MAX_MEMORY=200M

# Rate Limiting (開發環境較寬鬆)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=2000
STRICT_RATE_LIMIT_MAX_REQUESTS=120

# ===== Docker Registry =====
DOCKER_IMAGE=ghcr.io/daodaoedu/daodao-server/daodao-app:dev-latest
```

## 📁 **3. 本機環境變數 (.env.local)**

```bash
# ===== 基本環境配置 =====
NODE_ENV=local
PORT=3000

# ===== 資料庫配置 =====
# PostgreSQL (本機)
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=daodao_local
POSTGRES_USER=postgres
POSTGRES_PASSWORD=local_password

# MongoDB (本機無認證)
MONGODB_URI=mongodb://localhost:27017/daodao_local
MONGO_DB_NAME=daodao_local

# Redis (本機)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# ===== 安全配置 =====
JWT_SECRET=local_jwt_secret_for_development_only_not_for_production
SESSION_SECRET=local_session_secret_for_development

# ===== 應用配置 =====
FRONTEND_URL=http://localhost:4000
API_BASE_URL=http://localhost:3000

# ===== 第三方服務 =====
# Google OAuth (本機開發)
GOOGLE_CLIENT_ID=your_local_google_client_id
GOOGLE_CLIENT_SECRET=your_local_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# Cloudflare R2 (本機開發 - 可選擇性使用)
CLOUDFLARE_R2_ACCOUNT_ID=your_cloudflare_account_id
CLOUDFLARE_R2_ACCESS_KEY_ID=your_local_cloudflare_access_key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_local_cloudflare_secret_key
CLOUDFLARE_R2_BUCKET_NAME=daodao-local-storage
CLOUDFLARE_R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com

# Email 配置 (本機開發 - 可使用測試服務)
EMAIL_HOST=localhost
EMAIL_PORT=1025
EMAIL_USER=test@localhost
EMAIL_PASSWORD=
EMAIL_FROM=DaoDao Local <test@localhost>

# ===== 日誌與監控 =====
LOG_LEVEL=debug
LOG_FILE_PATH=./logs/local.log

# ===== 效能配置 =====
# PM2 相關 (本機較輕量)
PM2_INSTANCES=1
PM2_MAX_MEMORY=150M

# Rate Limiting (本機開發無限制)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=10000
STRICT_RATE_LIMIT_MAX_REQUESTS=1000

# ===== 開發工具 =====
# 熱重載
NODEMON_WATCH=true
TYPESCRIPT_WATCH=true

# 調試模式
DEBUG=true
VERBOSE_LOGGING=true
```

## 🐳 **4. 更新 docker-compose.yml (基於無認證 MongoDB)**

```yaml
version: '3.8'

services:
  # ===== 應用程式服務 =====
  prod_app:
    image: ghcr.io/daodaoedu/daodao-server/daodao-app:latest
    container_name: daodao_prod
    env_file:
      - .env.prod
    expose:
      - "3000"
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped
    depends_on:
      - postgres-prod
      - mongo-prod
      - redis-prod
    networks:
      - daodao-network
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '1.0'
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  dev_app:
    image: ghcr.io/daodaoedu/daodao-server/daodao-app:dev-latest
    container_name: daodao_dev
    env_file:
      - .env.dev
    expose:
      - "3000"
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped
    depends_on:
      - postgres-dev
      - mongo-dev
      - redis-dev
    networks:
      - daodao-network
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '1.0'
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # ===== PostgreSQL 資料庫 =====
  postgres-prod:
    image: postgres:14
    container_name: postgres_prod
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-daodao_prod}
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_prod_data:/var/lib/postgresql/data
    networks:
      - daodao-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-postgres}"]
      interval: 30s
      timeout: 10s
      retries: 5

  postgres-dev:
    image: postgres:14
    container_name: postgres_dev
    environment:
      POSTGRES_DB: ${POSTGRES_DB_DEV:-daodao_dev}
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_dev_data:/var/lib/postgresql/data
    networks:
      - daodao-network
    restart: unless-stopped

  # ===== MongoDB 資料庫 (無認證模式) =====
  mongo-prod:
    image: mongo:4.4
    container_name: mongo_prod
    # 無認證模式 - 不設置 environment
    volumes:
      - mongo_prod_data:/data/db
    networks:
      - daodao-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "mongo", "--eval", "db.adminCommand('ping')"]
      interval: 30s
      timeout: 10s
      retries: 5

  mongo-dev:
    image: mongo:4.4
    container_name: mongo_dev
    # 無認證模式 - 不設置 environment
    volumes:
      - mongo_dev_data:/data/db
    networks:
      - daodao-network
    restart: unless-stopped

  # ===== Redis 快取 =====
  redis-prod:
    image: redis:6
    container_name: redis_prod
    command: redis-server --appendonly yes
    volumes:
      - redis_prod_data:/data
    networks:
      - daodao-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 5

  redis-dev:
    image: redis:6
    container_name: redis_dev
    command: redis-server --appendonly yes
    volumes:
      - redis_dev_data:/data
    networks:
      - daodao-network
    restart: unless-stopped

  # ===== Nginx 反向代理 =====
  nginx:
    image: nginx:latest
    container_name: nginx_proxy
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl  # SSL 憑證
    depends_on:
      - prod_app
      - dev_app
    networks:
      - daodao-network
    restart: unless-stopped

networks:
  daodao-network:
    driver: bridge

volumes:
  postgres_prod_data:
  postgres_dev_data:
  mongo_prod_data:
  mongo_dev_data:
  redis_prod_data:
  redis_dev_data:
```

## 🔧 **5. 本機開發 docker-compose.local.yml**

```yaml
# 本機開發專用的 docker-compose 檔案
version: '3.8'

services:
  # ===== 本機開發資料庫 =====
  postgres-local:
    image: postgres:14
    container_name: postgres_local
    environment:
      POSTGRES_DB: daodao_local
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: local_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_local_data:/var/lib/postgresql/data
    restart: unless-stopped

  mongo-local:
    image: mongo:4.4
    container_name: mongo_local
    # 無認證模式
    ports:
      - "27017:27017"
    volumes:
      - mongo_local_data:/data/db
    restart: unless-stopped

  redis-local:
    image: redis:6
    container_name: redis_local
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_local_data:/data
    restart: unless-stopped

  # ===== 開發工具 =====
  mailhog:
    image: mailhog/mailhog
    container_name: mailhog_local
    ports:
      - "1025:1025"  # SMTP
      - "8025:8025"  # Web UI
    restart: unless-stopped

volumes:
  postgres_local_data:
  mongo_local_data:
  redis_local_data:
```

## 📋 **6. 環境變數檢查腳本**

```bash
#!/bin/bash
# check-env.sh - 檢查環境變數設置

ENV_TYPE=${1:-prod}
ENV_FILE=".env.${ENV_TYPE}"

echo "🔍 檢查 ${ENV_TYPE} 環境變數..."

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ 找不到 $ENV_FILE 檔案"
    exit 1
fi

# 必要變數檢查
REQUIRED_VARS=(
    "NODE_ENV"
    "PORT"
    "POSTGRES_HOST"
    "POSTGRES_DB"
    "MONGODB_URI"
    "JWT_SECRET"
    "SESSION_SECRET"
)

missing_vars=()

for var in "${REQUIRED_VARS[@]}"; do
    if ! grep -q "^${var}=" "$ENV_FILE"; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -eq 0 ]; then
    echo "✅ 所有必要變數都已設置"
else
    echo "❌ 缺少以下變數:"
    printf '%s\n' "${missing_vars[@]}"
    exit 1
fi

# 檢查密鑰長度
jwt_secret=$(grep "^JWT_SECRET=" "$ENV_FILE" | cut -d'=' -f2)
if [ ${#jwt_secret} -lt 32 ]; then
    echo "⚠️ JWT_SECRET 太短，建議至少 32 個字符"
fi

echo "🎉 環境變數檢查完成"
```

## 🚀 **7. 使用方式**

### **設置環境變數**:
```bash
# 1. 複製對應的環境變數檔案
cp .env.example .env.prod
cp .env.example .env.dev
cp .env.example .env.local

# 2. 編輯並填入實際值
vim .env.prod
vim .env.dev
vim .env.local

# 3. 檢查設置
./check-env.sh prod
./check-env.sh dev
./check-env.sh local
```

### **啟動對應環境**:
```bash
# 生產環境
docker-compose --env-file .env.prod up -d prod_app

# 開發環境
docker-compose --env-file .env.dev up -d dev_app

# 本機開發環境
docker-compose -f docker-compose.local.yml up -d
npm run dev:local
```

### **驗證環境**:
```bash
# 檢查各環境健康狀態
curl https://dao-server.daoedu.tw/health    # 生產
curl https://server.daoedu.tw/health         # 開發
curl http://localhost:3000/health            # 本機
```

---

**總結**: 這個完整的環境變數配置考慮了無認證 MongoDB 的實際情況，並為三個環境提供了詳細、實用的設置。每個環境都有其特定的配置和用途，確保開發、測試和生產的順利運行。