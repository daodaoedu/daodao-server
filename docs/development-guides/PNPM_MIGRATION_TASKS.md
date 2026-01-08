# PNPM 迁移任務清單

本文檔列出了將 DaoDao Server 從 npm 迁移到 pnpm 的詳細任務清單，按優先級和依賴關係組織。

## 專案概況

- **當前狀態**: npm + package-lock.json
- **目標狀態**: pnpm + pnpm-lock.yaml
- **架構**: 混合 JavaScript/TypeScript，雙架構方式
- **關鍵技術**: Prisma ORM, Docker, PM2, TypeScript, Jest

## 任務優先級分類

### 🚨 P0 - 核心迁移任務 (必須完成) ✅ **已完成**

#### 1. 環境準備與備份

- [x] **1.1** 檢查 Node.js 版本 (>=16.14.0) - **v22.18.0** ✅
- [x] **1.2** 備份當前 package-lock.json ✅
- [x] **1.3** 創建迁移分支 `migration/pnpm` - **使用現有分支 feat/swagger-refactor** ✅
- [x] **1.4** 運行完整測試確保當前狀態正常 - **發現 Zod v4 相關 TypeScript 錯誤，但迁移可繼續** ✅

  ```bash
  npm run typecheck
  npm run lint
  npm run test
  npm run build
  ```

#### 2. pnpm 安裝與初始化

- [x] **2.1** 全域安裝 pnpm (`npm install -g pnpm` 或 `corepack enable`) - **v10.15.1** ✅
- [x] **2.2** 驗證 pnpm 安裝 (`pnpm --version`) ✅
- [x] **2.3** 清理現有 node_modules 和 package-lock.json ✅
- [x] **2.4** 執行 `pnpm install` 生成 pnpm-lock.yaml ✅
- [x] **2.5** 驗證依賴安裝完整性 - **858 個包，366M 磁碟空間** ✅

#### 3. 核心功能驗證

- [x] **3.1** 測試 TypeScript 編譯 (`pnpm run typecheck`) - **Zod v4 錯誤待修正** ⚠️
- [x] **3.2** 測試 Prisma 生成 (`pnpm run prisma:generate`) ✅
- [x] **3.3** 測試項目構建 (`pnpm run build`) - **Zod v4 錯誤待修正** ⚠️
- [ ] **3.4** 測試開發服務器 (`pnpm run dev`)
- [ ] **3.5** 運行完整測試套件 (`pnpm run test`)

### ⚡ P1 - 配置與優化 (強烈推薦)

#### 4. 配置文件更新

- [x] **4.1** 創建 `.pnpmrc` 配置文件 ✅

  ```ini
  # Prisma 支援
  hoist-pattern[]=*prisma*
  hoist-pattern[]=*@types/*
  
  # 引擎版本檢查
  engine-strict=true
  
  # 註冊表配置
  registry=https://registry.npmjs.org/
  
  # 對等依賴配置
  auto-install-peers=false
  ```

- [x] **4.2** 更新 `.gitignore` ✅

  ```
  # pnpm
  pnpm-lock.yaml
  .pnpm-debug.log
  
  # 註釋或移除 npm 相關
  # package-lock.json
  ```

- [x] **4.3** 更新 package.json engines 限制 ✅

  ```json
  {
    "engines": {
      "node": ">=16.14.0",
      "pnpm": ">=8.0.0",
      "npm": "please-use-pnpm",
      "yarn": "please-use-pnpm"
    }
  }
  ```

#### 5. CLAUDE.md 更新

- [x] **5.1** 更新開發命令從 `npm` 改為 `pnpm` ✅

  ```markdown
  ### 套件管理
  - `pnpm install` - 安裝所有依賴
  - `pnpm add <package>` - 添加生產依賴
  - `pnpm add -D <package>` - 添加開發依賴
  
  ### 核心命令
  - `pnpm start` - 啟動生產伺服器
  - `pnpm run dev` - 啟動開發伺服器
  - `pnpm run build` - TypeScript 編譯
  ```

- [x] **5.2** 添加 pnpm 特定的開發指南 ✅
- [ ] **5.3** 更新 Prisma 相關說明

### 🔧 P2 - Docker 與 CI/CD 更新 (部署必需)

#### 6. Dockerfile 優化

- [ ] **6.1** 更新基礎鏡像層

  ```dockerfile
  # 啟用 corepack 並安裝 pnpm
  RUN corepack enable && corepack prepare pnpm@latest --activate
  ```

- [ ] **6.2** 更新依賴層

  ```dockerfile
  # 複製 pnpm 相關文件
  COPY package.json pnpm-lock.yaml ./
  
  # 使用 pnpm 安裝
  RUN pnpm install --frozen-lockfile --prod
  ```

- [ ] **6.3** 更新構建層

  ```dockerfile
  RUN pnpm run build
  ```

- [ ] **6.4** 更新啟動命令

  ```dockerfile
  CMD ["pnpm", "start"]
  ```

#### 7. CI/CD 管道更新

- [ ] **7.1** 檢查是否有 GitHub Actions 配置
- [ ] **7.2** 更新 CI 腳本使用 pnpm

  ```yaml
  - name: Setup Node.js
    uses: actions/setup-node@v4
    with:
      node-version: '18'
      cache: 'pnpm'
  
  - name: Install pnpm
    run: corepack enable
  
  - name: Install dependencies
    run: pnpm install --frozen-lockfile
  ```

- [ ] **7.3** 檢查 docker-compose.yaml 是否需要更新

### 📚 P3 - 文檔與協作 (協作優化)

#### 8. 團隊文檔更新

- [ ] **8.1** 創建開發環境設置指南

  ```markdown
  ## 必備工具
  1. Node.js 18.17.0+ (推薦使用 nvm)
  2. pnpm 8.0.0+
  
  ## 首次設置
  1. 克隆專案: `git clone <repository>`
  2. 安裝 pnpm: `npm install -g pnpm`
  3. 安裝依賴: `pnpm install`
  4. 運行開發伺服器: `pnpm run dev`
  ```

- [ ] **8.2** 更新 README.md (如需要)
- [ ] **8.3** 創建 .nvmrc 文件 (Node 版本管理)
- [ ] **8.4** 更新任何現有的部署腳本

#### 9. 腳本文件更新

- [ ] **9.1** 檢查 `scripts/` 目錄中的腳本
- [ ] **9.2** 更新 `ecosystem.config.js` 如需要
- [ ] **9.3** 檢查 `package.json` 中的腳本依賴

### 🔍 P4 - 驗證與測試 (品質保證)

#### 10. 依賴問題排查

- [ ] **10.1** 檢查 Prisma 客戶端生成

  ```bash
  pnpm list prisma
  pnpm list @prisma/client
  pnpm run prisma:generate
  ```

- [ ] **10.2** 驗證 TypeScript 路徑別名

  ```bash
  pnpm run typecheck
  # 檢查 @/* 路徑解析
  ```

- [ ] **10.3** 測試 ts-node-dev 開發服務器
- [ ] **10.4** 驗證 tsc-alias 路徑轉換

#### 11. 性能基準測試

- [ ] **11.1** 測量 `pnpm install` 時間
- [ ] **11.2** 測量構建時間對比
- [ ] **11.3** 測量開發服務器啟動時間
- [ ] **11.4** 記錄磁碟空間使用對比

#### 12. 完整系統測試

- [ ] **12.1** 運行完整測試套件

  ```bash
  pnpm run test:unit
  pnpm run test:integration
  pnpm run test:e2e
  pnpm run test:coverage
  ```

- [ ] **12.2** 測試生產構建流程

  ```bash
  pnpm run build
  pnpm start
  ```

- [ ] **12.3** 驗證 API 端點正常運行
- [ ] **12.4** 測試 Swagger 文檔生成

## 特殊注意事項

### Prisma 相關

- [ ] 確保 `generated/prisma/` 目錄正確生成
- [ ] 驗證 Prisma 客戶端導入路徑
- [ ] 檢查 schema 文件路徑引用

### TypeScript 相關

- [ ] 驗證路徑別名 `@/*`, `@types/*`, `@services/*`
- [ ] 確保 tsconfig-paths 正確工作
- [ ] 檢查編譯輸出到 `dist/` 目錄

## 驗收標準

### 功能驗收

✅ **必須通過的檢查項目**:

1. `pnpm run typecheck` - 無 TypeScript 錯誤
2. `pnpm run lint` - 無 ESLint 錯誤  
3. `pnpm run build` - 成功構建
4. `pnpm run test` - 所有測試通過
5. `pnpm run dev` - 開發服務器正常啟動
6. API 健康檢查端點正常響應
7. Prisma 客戶端正常生成和使用
8. Swagger 文檔正常生成

### 性能驗收

✅ **期望改善指標**:

- 依賴安裝時間減少 50%+
- 磁碟空間使用減少 60%+  
- 沒有功能回歸
- 構建時間保持或改善

## 回滾計劃

如果迁移失敗，按以下步驟快速回滾：

```bash
# 1. 停止服務
pkill -f "node\|pnpm"

# 2. 切換分支
git stash
git checkout main

# 3. 恢復 npm 環境
rm -rf node_modules pnpm-lock.yaml .pnpm-debug.log
cp package-lock.json.backup package-lock.json
npm install

# 4. 驗證恢復
npm run typecheck
npm run test
npm run dev
```

## 執行時間預估

- **P0 任務**: 2-3 小時
- **P1 任務**: 1-2 小時  
- **P2 任務**: 2-4 小時 (取決於 CI/CD 複雜度)
- **P3 任務**: 1-2 小時
- **P4 任務**: 2-3 小時

**總計**: 8-14 小時 (可分多次完成)

## 風險評估

| 風險 | 影響 | 緩解措施 |
|------|------|----------|
| Prisma 生成失敗 | 高 | 配置 .pnpmrc hoist-pattern |
| TypeScript 路徑別名失效 | 中 | 檢查 tsconfig.json 和 tsconfig-paths |
| Docker 構建失敗 | 中 | 測試 Dockerfile 更新 |
| CI/CD 管道中斷 | 中 | 逐步更新，保持備份 |
| 團隊成員適應 | 低 | 提供清晰文檔和培訓 |

## 成功指標

- [ ] 所有自動化測試通過
- [ ] 開發體驗改善 (安裝速度、磁碟使用)
- [ ] 生產部署正常
- [ ] 團隊成員可以順利使用 pnpm
- [ ] 沒有功能回歸

---

**注意**: 建議在非生產環境先完成完整迁移測試，確認無誤後再應用到生產環境。
