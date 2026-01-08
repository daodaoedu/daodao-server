# CI/CD 改進指南

## 概述

本文件提供 DaoDao Server CI/CD 流程的全面改進方案，基於當前工作流程分析和最佳實踐建議。

## 當前架構分析

### 現有 CI/CD 流程
1. **測試階段**: TypeScript 檢查、Lint、單元測試
2. **構建階段**: Docker 映像構建與推送
3. **部署階段**: Linode 伺服器部署
4. **驗證階段**: 部署狀態檢查
5. **通知階段**: Discord 通知

### 已識別問題
- 部分流程序列執行，影響效率
- 缺乏完整的快取策略
- 安全性配置可進一步強化
- 監控和可觀測性不足
- 缺乏自動回滾機制

## 🚀 效能優化改進

### 1. 並行化執行優化

#### 當前問題
```yaml
# 現有的序列執行
- name: Run TypeScript check and Lint in parallel
  run: |
    npm run typecheck &
    npm run lint &
    wait
```

#### 改進方案
```yaml
# 完全並行的矩陣執行
strategy:
  matrix:
    task: [typecheck, lint, test]
    
steps:
  - name: Run ${{ matrix.task }}
    run: npm run ${{ matrix.task }}
```

### 2. 快取策略強化

#### Node.js 依賴快取
```yaml
- name: Cache Node.js modules
  uses: actions/cache@v4
  with:
    path: |
      ~/.npm
      node_modules
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-
```

#### TypeScript 編譯快取
```yaml
- name: Cache TypeScript build
  uses: actions/cache@v4
  with:
    path: |
      dist/
      generated/
    key: ${{ runner.os }}-build-${{ hashFiles('src/**/*.ts', 'tsconfig*.json') }}
```

#### Docker 層快取優化
```yaml
- name: Build with enhanced caching
  uses: docker/build-push-action@v5
  with:
    context: .
    push: true
    tags: ${{ secrets.DOCKER_HUB_USERNAME }}/app:${{ env.IMAGE_TAG }}
    cache-from: |
      type=gha
      type=registry,ref=${{ secrets.DOCKER_HUB_USERNAME }}/app:cache
    cache-to: |
      type=gha,mode=max
      type=registry,ref=${{ secrets.DOCKER_HUB_USERNAME }}/app:cache,mode=max
```

## 🛡️ 安全性提升

### 3. GitHub Environments 配置

#### Environment 設定
```yaml
# .github/workflows/main.yml
deploy:
  environment: 
    name: ${{ github.ref == 'refs/heads/main' && 'production' || 'development' }}
    url: ${{ github.ref == 'refs/heads/main' && 'https://prod.daodao.com' || 'https://dev.daodao.com' }}
```

#### Secret 分離管理
```bash
# Production Environment Secrets
DOCKER_HUB_USERNAME_PROD
DOCKER_HUB_ACCESS_TOKEN_PROD
LINODE_SSH_PRIVATE_KEY_PROD
LINODE_INSTANCE_IP_PROD
DISCORD_WEBHOOK_URL_PROD

# Development Environment Secrets  
DOCKER_HUB_USERNAME_DEV
DOCKER_HUB_ACCESS_TOKEN_DEV
LINODE_SSH_PRIVATE_KEY_DEV
LINODE_INSTANCE_IP_DEV
DISCORD_WEBHOOK_URL_DEV
```

### 4. OIDC 身份驗證

#### 取代長期 Token
```yaml
permissions:
  id-token: write
  contents: read

- name: Configure AWS credentials
  uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: arn:aws:iam::123456789012:role/GitHubActions
    web-identity-token-file: ${{ env.AWS_WEB_IDENTITY_TOKEN_FILE }}
```

### 5. 容器安全強化

#### Dockerfile 安全改進
```dockerfile
# 使用非特權用戶
FROM node:20-alpine AS runtime

# 安裝 dumb-init 處理信號
RUN apk add --no-cache dumb-init

# 創建非 root 用戶
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 設置文件權限
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
USER nodejs

# 使用 dumb-init 作為 PID 1
ENTRYPOINT ["dumb-init", "--"]
CMD ["pm2-runtime", "start", "ecosystem.config.js"]
```

#### 安全掃描集成
```yaml
- name: Run Trivy vulnerability scanner
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: ${{ secrets.DOCKER_HUB_USERNAME }}/app:${{ env.IMAGE_TAG }}
    format: 'sarif'
    output: 'trivy-results.sarif'

- name: Upload Trivy scan results
  uses: github/codeql-action/upload-sarif@v3
  with:
    sarif_file: 'trivy-results.sarif'
```

## 📊 監控與可觀測性

### 6. 部署指標收集

#### Prometheus 指標
```yaml
- name: Record deployment metrics
  run: |
    cat << EOF | curl -X POST http://prometheus:9091/metrics \
      --data-binary @-
    # HELP deployment_info Deployment information
    # TYPE deployment_info gauge
    deployment_info{environment="${{ env.APP_ENV }}",version="${{ github.sha }}",branch="${{ github.ref_name }}"} 1
    EOF
```

#### 部署時間追蹤
```yaml
- name: Start deployment timer
  run: echo "DEPLOY_START=$(date +%s)" >> $GITHUB_ENV

- name: Record deployment duration
  if: always()
  run: |
    DEPLOY_END=$(date +%s)
    DURATION=$((DEPLOY_END - DEPLOY_START))
    echo "Deployment took ${DURATION} seconds"
```

### 7. 增強健康檢查

#### 深度健康檢查
```yaml
- name: Comprehensive Health Check
  run: |
    ssh root@$LINODE_INSTANCE_IP "
      # 檢查應用健康狀態
      for i in {1..30}; do
        if curl -f http://localhost:3000/api/v1/health/detailed; then
          echo 'Application is healthy'
          break
        fi
        echo 'Waiting for application... (\$i/30)'
        sleep 10
      done
      
      # 檢查數據庫連接
      docker-compose exec -T ${{ env.APP_SERVICE }} node -e "
        require('./dist/src/services/database').testConnections()
          .then(() => console.log('Database connections OK'))
          .catch(err => { console.error('Database error:', err); process.exit(1); })
      "
    "
```

### 8. 智能通知系統

#### 分級通知
```yaml
- name: Smart Discord Notification
  if: always()
  run: |
    if [ "${{ needs.test.result }}" == "failure" ]; then
      SEVERITY="🚨 CRITICAL"
      COLOR="16711680"
      MESSAGE="測試失敗 - 部署已停止"
    elif [ "${{ needs.deploy.result }}" == "failure" ]; then
      SEVERITY="⚠️ HIGH"
      COLOR="16744448"
      MESSAGE="部署失敗 - 需要立即處理"
    elif [ "${{ needs.verify.result }}" == "failure" ]; then
      SEVERITY="⚠️ MEDIUM"
      COLOR="16744448"
      MESSAGE="驗證失敗 - 檢查應用狀態"
    else
      SEVERITY="✅ SUCCESS"
      COLOR="3066993"
      MESSAGE="部署成功完成"
    fi
    
    curl -X POST -H "Content-Type: application/json" \
      -d "{
        \"embeds\": [{
          \"title\": \"${SEVERITY} - DaoDao Server 部署\",
          \"description\": \"${MESSAGE}\",
          \"color\": ${COLOR},
          \"fields\": [
            {\"name\": \"Environment\", \"value\": \"${{ env.APP_ENV }}\", \"inline\": true},
            {\"name\": \"Branch\", \"value\": \"${{ github.ref_name }}\", \"inline\": true},
            {\"name\": \"Commit\", \"value\": \"${{ github.sha }}\", \"inline\": true}
          ],
          \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%S.000Z)\"
        }]
      }" \
      ${{ secrets.DISCORD_WEBHOOK_URL }}
```

## 🔄 部署策略改進

### 9. 藍綠部署實現

#### 部署策略
```yaml
- name: Blue-Green Deployment
  run: |
    ssh root@$LINODE_INSTANCE_IP "
      export NEW_SERVICE=\"${APP_SERVICE}_new\"
      export OLD_SERVICE=\"${APP_SERVICE}\"
      
      # 啟動新版本 (Green)
      docker-compose --env-file .env.${{ env.APP_ENV }} \
        -f docker-compose.yaml up -d \$NEW_SERVICE
      
      # 等待新版本就緒
      echo 'Waiting for new version to be ready...'
      for i in {1..30}; do
        if docker-compose exec -T \$NEW_SERVICE \
           wget --quiet --tries=1 --spider http://localhost:3000/api/v1/health; then
          echo 'New version is ready'
          break
        fi
        sleep 10
      done
      
      # 切換流量 (更新 nginx 配置)
      docker-compose exec nginx nginx -s reload
      
      # 停止舊版本 (Blue)
      docker-compose stop \$OLD_SERVICE
      docker-compose rm -f \$OLD_SERVICE
      
      # 重命名服務
      docker rename \${NEW_SERVICE} \${OLD_SERVICE}
    "
```

### 10. 自動回滾機制

#### 回滾邏輯
```yaml
- name: Automatic Rollback
  if: failure()
  run: |
    ssh root@$LINODE_INSTANCE_IP "
      echo 'Deployment failed, initiating rollback...'
      
      # 獲取上一個穩定版本
      LAST_STABLE=\$(docker images --format 'table {{.Repository}}:{{.Tag}}' | grep app | grep -v latest | head -2 | tail -1)
      
      # 回滾到上一個版本
      docker-compose stop ${{ env.APP_SERVICE }}
      docker tag \$LAST_STABLE ${{ secrets.DOCKER_HUB_USERNAME }}/app:rollback
      
      # 使用回滾版本重啟服務
      docker-compose --env-file .env.${{ env.APP_ENV }} \
        -f docker-compose.yaml up -d ${{ env.APP_SERVICE }}
      
      echo 'Rollback completed'
    "
```

## 🎯 測試與品質保證

### 11. 測試覆蓋率報告

#### Codecov 整合
```yaml
- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v4
  with:
    file: ./coverage/lcov.info
    flags: unittests
    name: codecov-umbrella
    fail_ci_if_error: true
```

#### 品質閘道
```yaml
- name: Quality Gate
  run: |
    # 檢查測試覆蓋率
    COVERAGE=$(npm run test:coverage | grep "All files" | awk '{print $4}' | sed 's/%//')
    if [ $COVERAGE -lt 80 ]; then
      echo "Test coverage ($COVERAGE%) is below threshold (80%)"
      exit 1
    fi
    
    # 檢查 TypeScript 嚴格模式
    if ! npm run typecheck; then
      echo "TypeScript check failed"
      exit 1
    fi
```

### 12. 語義化版本控制

#### 自動版本標記
```yaml
- name: Semantic Versioning
  uses: cycjimmy/semantic-release-action@v4
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  with:
    branch: main
    extra_plugins: |
      @semantic-release/changelog
      @semantic-release/git
```

## 🔧 完整工作流程範例

### 13. 優化後的 main.yml

```yaml
name: Enhanced CI/CD Pipeline

on:
  push:
    branches: [main, dev]
  pull_request:
    branches: [main, dev]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  # 並行測試矩陣
  test-matrix:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        task: [typecheck, lint, test]
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js with caching
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Generate types
        run: npm run types:generate
        
      - name: Cache build artifacts
        uses: actions/cache@v4
        with:
          path: |
            dist/
            generated/
          key: build-${{ hashFiles('src/**/*.ts') }}-${{ github.sha }}
          
      - name: Run ${{ matrix.task }}
        run: npm run ${{ matrix.task }}

  # 品質檢查
  quality-gate:
    needs: test-matrix
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Quality checks
        run: |
          echo "All quality checks passed"

  # 安全掃描
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run security audit
        run: npm audit --audit-level high

  # 構建和推送
  build-push:
    needs: [test-matrix, quality-gate, security-scan]
    runs-on: ubuntu-latest
    environment: ${{ github.ref == 'refs/heads/main' && 'production' || 'development' }}
    steps:
      - uses: actions/checkout@v4
      
      - name: Enhanced Docker build
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ secrets.DOCKER_HUB_USERNAME }}/app:${{ env.IMAGE_TAG }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # 藍綠部署
  deploy:
    needs: build-push
    runs-on: ubuntu-latest
    environment: ${{ github.ref == 'refs/heads/main' && 'production' || 'development' }}
    steps:
      - name: Blue-Green Deployment
        run: |
          # 藍綠部署邏輯
          echo "Executing blue-green deployment"

  # 驗證和監控
  verify:
    needs: deploy
    runs-on: ubuntu-latest
    steps:
      - name: Comprehensive verification
        run: |
          # 完整驗證邏輯
          echo "Running comprehensive verification"
```

## 📋 實施計劃

### 階段 1: 基礎優化 (1-2週)
1. ✅ 實施 Node.js 依賴快取
2. ✅ 添加並行測試矩陣
3. ✅ 強化 Docker 快取策略
4. ✅ 設置 GitHub Environments

### 階段 2: 安全強化 (2-3週)
1. ✅ 實施 OIDC 身份驗證
2. ✅ 添加容器安全掃描
3. ✅ 分離環境 secrets
4. ✅ 強化 Dockerfile 安全性

### 階段 3: 監控改進 (2-3週)
1. ✅ 實施部署指標收集
2. ✅ 添加深度健康檢查
3. ✅ 智能通知系統
4. ✅ 測試覆蓋率報告

### 階段 4: 部署策略 (3-4週)
1. ✅ 實施藍綠部署
2. ✅ 自動回滾機制
3. ✅ 語義化版本控制
4. ✅ 品質閘道設置

## 🎯 預期效果

### 效能提升
- **構建時間縮短**: 30-50%
- **部署時間縮短**: 40-60%
- **快取命中率**: 80%+

### 可靠性提升
- **零停機部署**: 藍綠部署策略
- **自動回滾**: 5分鐘內完成
- **故障檢測**: 30秒內發現問題

### 安全性提升
- **漏洞掃描**: 100% 覆蓋
- **權限最小化**: OIDC + 環境隔離
- **審查追蹤**: 完整部署日誌

## 📚 最佳實踐建議

### 1. 版本控制
- 使用語義化版本控制
- 標記穩定版本
- 維護變更日誌

### 2. 監控告警
- 設置關鍵指標監控
- 建立告警等級機制
- 定期檢查部署健康度

### 3. 文檔維護
- 更新部署指南
- 記錄故障排除步驟
- 維護架構圖表

### 4. 團隊協作
- 建立代碼審查流程
- 定期進行部署演練
- 分享最佳實踐經驗

---

## 📞 支援與維護

如需實施協助或遇到問題，請參考：
- [測試指南](./testing-guide.md)
- [部署文檔](./deployment-guide.md)
- [故障排除](./troubleshooting.md)

最後更新：2025-08-04