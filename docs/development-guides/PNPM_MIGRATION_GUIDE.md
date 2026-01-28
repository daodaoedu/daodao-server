# PNPM 迁移指南

## 目錄
- [概述](#概述)
- [為什麼選擇 pnpm](#為什麼選擇-pnpm)
- [迁移前準備](#迁移前準備)
- [迁移步驟](#迁移步驟)
- [配置更新](#配置更新)
- [團隊協作配置](#團隊協作配置)
- [CI/CD 更新](#cicd-更新)
- [常見問題](#常見問題)
- [回滾計劃](#回滾計劃)

## 概述

本指南將協助 DaoDao Server 專案從 npm 迁移到 pnpm 包管理器。pnpm 提供更快的安裝速度、更有效的磁碟空間使用以及更嚴格的依賴管理。

### 當前專案狀況
- **包管理器**: npm with package-lock.json
- **Node.js 版本**: 支援 Node.js 16+
- **依賴數量**: 33 個生產依賴 + 35 個開發依賴
- **特殊需求**: Prisma, TypeScript, PM2 部署

## 為什麼選擇 pnpm

### 主要優勢

1. **速度提升**
   - 依賴安裝速度比 npm 快 2-3 倍
   - 利用硬連結和符號連結減少重複下載

2. **磁碟空間節省**
   - 全域儲存依賴，避免重複安裝
   - 節省 70-80% 的 node_modules 空間

3. **更嚴格的依賴管理**
   - 避免幽靈依賴 (phantom dependencies)
   - 只能訪問 package.json 中明確聲明的依賴

4. **Monorepo 友好**
   - 未來擴展為 monorepo 架構時更容易

### 性能對比

| 指標 | npm | pnpm | 提升 |
|------|-----|------|------|
| 安裝速度 | 100% | ~40% | 2.5x 更快 |
| 磁碟使用 | 100% | ~30% | 3.3x 節省 |
| 記憶體使用 | 100% | ~70% | 1.4x 節省 |

## 迁移前準備

### 1. 環境檢查

```bash
# 檢查 Node.js 版本 (需要 16.14+)
node --version

# 檢查當前 npm 版本
npm --version

# 檢查專案健康狀態
npm audit
npm run typecheck
npm run test
```

### 2. 備份當前狀態

```bash
# 備份 package-lock.json
cp package-lock.json package-lock.json.backup

# 創建 git 分支
git checkout -b migration/pnpm
git add .
git commit -m "backup: save current npm configuration before pnpm migration"
```

### 3. 安裝 pnpm

```bash
# 使用 npm 安裝 pnpm (推薦)
npm install -g pnpm

# 或使用 corepack (Node.js 16.13+)
corepack enable
corepack prepare pnpm@latest --activate

# 驗證安裝
pnpm --version
```

## 迁移步驟

### 步驟 1: 清理現有依賴

```bash
# 刪除 node_modules 和 package-lock.json
rm -rf node_modules
rm package-lock.json

# 清理 npm 快取 (可選)
npm cache clean --force
```

### 步驟 2: 導入依賴

```bash
# pnpm 會自動讀取 package.json 並創建 pnpm-lock.yaml
pnpm install

# 驗證安裝成功
ls node_modules
pnpm list
```

### 步驟 3: 測試專案功能

```bash
# 測試 TypeScript 編譯
pnpm run typecheck

# 測試 Prisma 生成
pnpm run prisma:generate

# 測試構建流程
pnpm run build

# 運行測試
pnpm run test

# 測試開發伺服器
pnpm run dev
```

### 步驟 4: 更新腳本命令

package.json 中的腳本需要相應更新：

```json
{
  "scripts": {
    "prebuild": "pnpm run clean",
    "types:generate": "pnpm run prisma:generate",
    "postbuild": "echo 'TypeScript compilation completed' && cp -r generated dist/"
  }
}
```

## 配置更新

### 1. 創建 .pnpmrc 配置文件

```bash
# .pnpmrc
# 設置依賴提升策略
hoist-pattern[]=*prisma*
hoist-pattern[]=*@types/*

# 設置 Node.js 版本檢查
engine-strict=true

# 設置註冊表
registry=https://registry.npmjs.org/

# 禁用對等依賴自動安裝
auto-install-peers=false

# 設置存儲目錄 (可選)
# store-dir=~/.pnpm-store
```

### 2. 更新 .gitignore

```gitignore
# 現有內容...

# pnpm
pnpm-lock.yaml
.pnpm-debug.log

# npm (移至註釋或刪除)
# package-lock.json
# npm-debug.log*
```

### 3. 更新 CLAUDE.md

```markdown
### 套件管理
- `pnpm install` - 安裝所有依賴
- `pnpm add <package>` - 添加生產依賴
- `pnpm add -D <package>` - 添加開發依賴
- `pnpm remove <package>` - 移除依賴
- `pnpm list` - 查看依賴樹
- `pnpm outdated` - 檢查過期依賴

### 核心命令更新
- `pnpm start` - 啟動生產伺服器
- `pnpm run dev` - 啟動開發伺服器
- `pnpm run build` - TypeScript 編譯
- `pnpm run test` - 執行測試
- `pnpm run typecheck` - TypeScript 類型檢查
- `pnpm run lint` - ESLint 檢查
```

## 團隊協作配置

### 1. package.json 引擎限制

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

### 2. 創建 .nvmrc (Node 版本管理)

```bash
# .nvmrc
18.17.0
```

### 3. 團隊指導文檔

創建 `docs/DEVELOPMENT_SETUP.md`:

```markdown
## 開發環境設置

### 必備工具
1. Node.js 18.17.0+ (推薦使用 nvm)
2. pnpm 8.0.0+

### 首次設置
1. 克隆專案: `git clone <repository>`
2. 安裝 pnpm: `npm install -g pnpm`
3. 安裝依賴: `pnpm install`
4. 運行開發伺服器: `pnpm run dev`
```

## CI/CD 更新

### GitHub Actions (如果使用)

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'pnpm'
      
      - name: Install pnpm
        run: corepack enable
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Run tests
        run: pnpm run test:ci
```

### Docker 更新

```dockerfile
# Dockerfile
FROM node:18-alpine

# 啟用 corepack 並安裝 pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# 複製 package.json 和 pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# 使用 pnpm 安裝依賴
RUN pnpm install --frozen-lockfile --prod

COPY . .

# 構建應用
RUN pnpm run build

EXPOSE 3000
CMD ["pnpm", "start"]
```

## 常見問題

### Q1: 依賴解析問題

**問題**: 某些包無法找到或導入失敗
**解決方案**: 
```bash
# 檢查依賴是否正確安裝
pnpm list <package-name>

# 添加到 .pnpmrc 的 hoist-pattern
hoist-pattern[]=*<problematic-package>*

# 重新安裝
pnpm install
```

### Q2: Prisma 生成問題

**問題**: Prisma 客戶端生成失敗
**解決方案**:
```bash
# 確保 prisma 包在正確位置
pnpm list prisma
pnpm list @prisma/client

# 手動生成
pnpm run prisma:generate

# 檢查 .pnpmrc 配置
echo "hoist-pattern[]=*prisma*" >> .pnpmrc
```

### Q3: TypeScript 路徑別名問題

**問題**: tsconfig.json 中的路徑別名無法解析
**解決方案**:
```bash
# 確保 tsconfig-paths 正確安裝
pnpm list tsconfig-paths

# 檢查 tsconfig.json baseUrl 和 paths 配置
# 可能需要添加到 hoist-pattern
```

### Q4: PM2 部署問題

**問題**: PM2 無法找到依賴
**解決方案**:
```bash
# 確保全域安裝 PM2 或使用 pnpm exec
pnpm add -g pm2
# 或
pnpm exec pm2 start dist/src/server.js
```

## 回滾計劃

如果迁移過程中遇到無法解決的問題，可以按以下步驟回滾：

### 快速回滾步驟

```bash
# 1. 停止當前開發伺服器
pkill -f "node\|pnpm"

# 2. 切換回原分支
git stash
git checkout main  # 或原始分支

# 3. 恢復 npm 環境
rm -rf node_modules
rm pnpm-lock.yaml
cp package-lock.json.backup package-lock.json
npm install

# 4. 驗證功能
npm run typecheck
npm run test
npm run dev
```

### 完整回滾檢查清單

- [ ] 刪除 pnpm-lock.yaml
- [ ] 恢復 package-lock.json
- [ ] 重新安裝 npm 依賴
- [ ] 測試所有核心功能
- [ ] 更新團隊文檔
- [ ] 通知團隊成員

## 迁移後維護

### 1. 定期清理

```bash
# 清理 pnpm 存儲
pnpm store prune

# 檢查過期依賴
pnpm outdated

# 更新依賴
pnpm update
```

### 2. 監控和優化

```bash
# 分析依賴大小
pnpm list --depth=0

# 檢查重複依賴
pnpm dedupe

# 驗證依賴完整性
pnpm install --frozen-lockfile
```

## 總結

迁移到 pnpm 將為 DaoDao Server 項目帶來：
- 更快的安裝和構建速度
- 更少的磁碟空間使用
- 更可靠的依賴管理
- 更好的團隊協作體驗

遵循本指南的步驟，可以確保平穩無痛的迁移過程。如有疑問，請參考 [pnpm 官方文檔](https://pnpm.io/) 或聯繫開發團隊。