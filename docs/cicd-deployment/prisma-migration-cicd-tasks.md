# Prisma 遷移 CI/CD 任務清單

## 概述
本文件列出改用 Prisma 後，CI/CD 和 Docker 配置需要的調整任務，確保部署流程順暢運行。

## ⚠️ 重要前提
**資料庫結構為 Single Source of Truth** - 實際資料庫的結構才是正確的，Prisma Schema 需要從資料庫同步。

**同步方向**: `實際資料庫` → `schema.prisma` → `Prisma Client` → `應用程序`

## 🔥 緊急任務 (立即執行)

### ✅ 已配置項目
- [x] Dockerfile 包含 `npx prisma generate`
- [x] CI/CD 包含 Prisma client 生成步驟
- [x] TypeScript 編譯流程 (`npm run build`)
- [x] 類型檢查和 linting

### 🚨 需要立即修復

#### 1. PM2 配置更新 (ecosystem.config.js)
**問題**: 入口點指向錯誤檔案
```javascript
// 現狀 (錯誤)
script: "index.js"

// 應修改為
script: "dist/src/server.js"  // 根據 package.json main 欄位
```

**影響**: 部署後應用程序無法啟動

#### 2. 資料庫 Schema 同步流程
**缺少**: 從資料庫同步到 Prisma Schema 的機制

**建議**: 在 CI/CD 測試和部署階段添加：
```yaml
# 在 .github/workflows/main.yml 的測試階段
- name: Sync schema from database
  run: |
    # 從實際資料庫同步 schema
    npx prisma db pull
    
    # 檢查是否有 schema 變更
    if ! git diff --exit-code prisma/schema.prisma; then
      echo "⚠️ Database schema has changed! Please review and commit schema.prisma"
      git diff prisma/schema.prisma
      # 在 CI 環境中可選擇自動提交或失敗
      exit 1
    fi

# 部署階段確保 schema 同步
- name: Ensure schema synchronization
  run: |
    ssh root@$LINODE_INSTANCE_IP "
      cd $APP_DIR
      docker-compose exec -T $APP_SERVICE npx prisma db pull
      docker-compose exec -T $APP_SERVICE npx prisma generate
    "
```

## 📋 中優先級任務

### 3. CI/CD Pipeline 增強

#### 3.1 測試階段添加 Schema 同步驗證
在 `.github/workflows/main.yml` 測試階段添加：
```yaml
- name: Validate schema synchronization
  env:
    DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
  run: |
    # 從測試資料庫同步 schema
    npx prisma db pull
    
    # 檢查 schema.prisma 是否與資料庫一致
    if ! git diff --exit-code prisma/schema.prisma; then
      echo "❌ Schema is out of sync with database!"
      echo "Please run 'npx prisma db pull' locally and commit the changes."
      git diff prisma/schema.prisma
      exit 1
    fi
    
- name: Validate Prisma client generation
  run: |
    npm run prisma:generate
    # 確保生成的檔案存在且正確
    ls -la generated/prisma/
    node -e "console.log('Prisma client loaded successfully:', !!require('./generated/prisma'))"
```

#### 3.2 部署前資料庫備份
```yaml
- name: Backup database before deployment
  run: |
    ssh root@$LINODE_INSTANCE_IP "
      echo 'Creating database backup...'
      docker-compose exec -T postgres-$APP_ENV pg_dump -U daodao daodao > backup_$(date +%Y%m%d_%H%M%S).sql
      echo 'Backup completed'
    "
```

### 4. Docker 配置優化

#### 4.1 多階段構建優化
考慮將 Dockerfile 改為多階段構建：
```dockerfile
# 建議的多階段構建結構
FROM node:20 AS builder
# 編譯階段

FROM node:20-alpine AS runtime  
# 運行階段
```

#### 4.2 健康檢查增強
在 docker-compose.yaml 中為應用服務添加健康檢查：
```yaml
prod_app:
  # ...
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
    interval: 30s
    timeout: 10s
    retries: 3
```

## 🔧 環境配置檢查

### 5. 環境變數驗證
確保以下環境變數在 `.env.prod` 和 `.env.dev` 中正確配置：

**必需變數**:
```env
# PostgreSQL
DATABASE_URL=postgresql://daodao:daodao@postgres-prod:5432/daodao

# Prisma
PRISMA_CLIENT_ENGINE_TYPE=library
PRISMA_CLIENT_ENGINE_DIR=generated/prisma
```

**建議添加**:
```env
# Schema 同步設置
PRISMA_DB_PULL_FORCE=false
PRISMA_GENERATE_SKIP_DOWNLOAD=true
PRISMA_CLI_BINARY_TARGETS=native
```

### 6. 監控和日志增強

#### 6.1 Schema 同步日志記錄
```yaml
- name: Log schema sync status
  run: |
    docker-compose exec -T $APP_SERVICE npx prisma db pull --print
    docker-compose exec -T $APP_SERVICE npx prisma generate --schema=prisma/schema.prisma
```

#### 6.2 Prisma 日志整合
已整合 Prisma 日志到現有 Winston 系統，避免重疊：
```typescript
// src/services/database/prisma.service.ts 已配置
// - 開發環境：啟用內建日志 + Winston 整合
// - 生產環境：僅使用 Winston 系統，避免 PM2/Docker 日志衝突
// - 統一日志格式和輸出管理
```

## 📊 測試和驗證

### 7. 部署後驗證腳本
創建驗證腳本檢查：
- [ ] Prisma client 是否正確連接資料庫
- [ ] Schema 是否與資料庫完全同步
- [ ] 生成的 Prisma Client 類型是否正確
- [ ] 基本 CRUD 操作是否正常
- [ ] 資料庫結構是否符合預期

### 8. 回滾策略
制定 Schema 同步失敗的回滾計劃：
- [ ] 資料庫備份恢復流程
- [ ] 舊版 schema.prisma 回退步驟
- [ ] Prisma Client 重新生成流程
- [ ] 應用程序版本回退步驟
- [ ] 服務依賴重啟順序

## ⚠️ 風險評估

### 高風險項目
1. **Schema 不一致**: 應用程序 schema 與實際資料庫結構不匹配
2. **服務中斷**: Schema 同步期間的服務不可用
3. **類型不匹配**: 生成的 Prisma Client 類型與實際資料庫不符
4. **手動變更遺失**: DBA 直接修改資料庫但未同步到代碼

### 緩解措施
1. **階段性部署**: 先在 dev 環境完整測試 schema 同步
2. **自動化檢查**: CI/CD 自動檢查 schema 一致性
3. **版本控制**: schema.prisma 變更必須經過 code review
4. **監控告警**: 設置 schema 不一致監控
5. **文檔化流程**: DBA 變更資料庫後的同步 SOP

## 📅 執行順序建議

### Phase 1: 立即修復 (今日)
1. 修復 ecosystem.config.js 入口點
2. 驗證環境變數配置

### Phase 2: CI/CD 增強 (本週)
1. 添加 schema 同步驗證步驟
2. 實施資料庫備份機制
3. 建立 schema 變更檢測機制
4. 增強健康檢查

### Phase 3: 監控優化 (下週)
1. 部署 schema 同步監控和日志
2. 建立完整的回滾流程
3. Schema 一致性壓力測試
4. DBA 工作流程文檔化

## 🎯 成功指標
- [ ] 部署成功率 100%
- [ ] Schema 同步時間 < 10 秒
- [ ] Schema 一致性檢查通過率 100%
- [ ] 零 schema 不匹配事件
- [ ] 服務中斷時間 < 1 分鐘

---
**最後更新**: 2025-07-28  
**負責人**: 後端開發團隊  
**優先級**: 高 🔴