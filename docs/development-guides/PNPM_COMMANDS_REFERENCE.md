# pnpm 指令參考（專案專用）

## 基本開發指令

### 啟動服務
```bash
pnpm run dev                    # 啟動開發服務器（熱重載）
pnpm run dev:watch             # 啟動開發服務器（監視模式）
pnpm start                     # 啟動生產服務器
```

### Swagger / OpenAPI
```bash
pnpm run openapi:export        # 從 Zod v4 schemas 生成 OpenAPI 文檔
```

### 構建相關
```bash
pnpm run clean                 # 清除 dist 目錄
pnpm run build                 # 完整構建（清除 + 編譯 + 生成 OpenAPI）
pnpm run typecheck             # TypeScript 類型檢查（不生成文件）
```

### 代碼品質
```bash
pnpm run lint                  # 執行 ESLint 檢查
pnpm run lint:fix              # 執行 ESLint 並自動修復
```

### 測試
```bash
pnpm run test                  # 執行所有測試
pnpm run test:unit             # 執行單元測試
pnpm run test:integration      # 執行整合測試
pnpm run test:e2e              # 執行端到端測試
pnpm run test:watch            # 監視模式執行測試
pnpm run test:coverage         # 執行測試並生成覆蓋率報告
pnpm run test:ci               # CI 環境測試（包含覆蓋率）
pnpm run test:debug            # 除錯模式測試
pnpm run test:clean            # 清除 Jest 快取
```

### Prisma 資料庫
```bash
pnpm run prisma:generate       # 生成 Prisma 客戶端
pnpm run prisma:introspect     # 從資料庫生成 schema
pnpm run prisma:studio         # 啟動 Prisma Studio
pnpm run prisma:seed           # 執行資料庫種子數據
pnpm run types:generate        # 生成 Prisma 類型（別名）
pnpm run db:introspect         # 從資料庫拉取 schema（別名）
pnpm run db:seed               # 執行種子數據（別名）
```

## 套件管理

### 安裝套件
```bash
pnpm install                   # 安裝所有依賴
pnpm add <package>             # 安裝生產依賴
pnpm add -D <package>          # 安裝開發依賴
pnpm add -g <package>          # 全域安裝
```

### 移除套件
```bash
pnpm remove <package>          # 移除套件
pnpm remove -D <package>       # 移除開發依賴
```

### 查看套件
```bash
pnpm list                      # 查看所有已安裝套件
pnpm list <package>            # 查看特定套件版本
pnpm outdated                  # 查看過期套件
```

### 更新套件
```bash
pnpm update                    # 更新所有套件
pnpm update <package>          # 更新特定套件
```

## 專案特定工作流

### 完整開發流程
```bash
# 1. 安裝依賴
pnpm install

# 2. 生成 Prisma 客戶端
pnpm run prisma:generate

# 3. 生成 OpenAPI 文檔
pnpm run openapi:export

# 4. 啟動開發服務器
pnpm run dev
```

### 部署前檢查
```bash
# 類型檢查
pnpm run typecheck

# 代碼品質檢查
pnpm run lint

# 執行測試
pnpm run test

# 構建專案
pnpm run build
```

### Zod v4 + OpenAPI 工作流
```bash
# 1. 修改 Zod schemas（加入 .describe() 和 .meta()）
# 2. 重新生成 OpenAPI 文檔
pnpm run openapi:export

# 3. 重啟開發服務器查看變更
pnpm run dev

# 4. 訪問 Swagger UI 測試
# http://localhost:4000/api-docs
```

## pnpm 優勢

### 速度
- 比 npm 快 2-3 倍
- 比 yarn 快 1.5-2 倍

### 節省空間
- 使用硬鏈接避免重複文件
- 全域儲存共享套件

### 嚴格依賴
- 防止幻影依賴（phantom dependencies）
- 只能引用明確宣告的依賴

## 常見問題

### 清除快取
```bash
pnpm store prune               # 清除未使用的套件
pnpm cache clean               # 清除快取
```

### 重新安裝
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### 檢查配置
```bash
pnpm config list               # 查看配置
pnpm root                      # 查看根目錄
```

## 與其他套件管理器對比

| 功能 | npm | yarn | pnpm |
|------|-----|------|------|
| 安裝速度 | 慢 | 中等 | 快 |
| 磁碟使用 | 高 | 中等 | 低 |
| 依賴嚴格性 | 寬鬆 | 寬鬆 | 嚴格 |
| Monorepo 支援 | 基本 | 好 | 優秀 |

專案已設定強制使用 pnpm：
```json
{
  "engines": {
    "npm": "please-use-pnpm",
    "yarn": "please-use-pnpm"
  }
}
```