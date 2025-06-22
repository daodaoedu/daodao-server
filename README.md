# DaoDao Server

DaoDao Server 是一個基於 Node.js 和 Express 的後端服務，用於支持 DaoDao 平台的各種功能。該平台主要提供學習計畫、馬拉松活動、社群揪團等功能，幫助使用者規劃和追蹤學習進度。

## 目錄
- [技術架構](#技術架構)
- [主要功能](#主要功能)
- [專案結構](#專案結構)
- [安裝與運行](#安裝與運行)
  - [本地開發](#本地開發)
  - [使用 Docker](#使用-docker)
- [API 概覽](#api-概覽)
- [資料庫模型](#資料庫模型)
- [環境變數](#環境變數)
- [測試](#測試)
- [CI/CD 流程](#cicd-流程)
- [貢獻指南](#貢獻指南)
- [授權協議](#授權協議)

## 技術架構

- **運行環境**: Node.js
- **Web 框架**: Express.js
- **程式語言**: **混合架構 JavaScript/TypeScript**
- **資料庫**:
  - MongoDB (透過 Mongoose)
  - PostgreSQL (透過 Sequelize ORM)
  - Redis (使用 ioredis)
- **身份驗證**: JWT, Passport.js (支持 Google OAuth)
- **API 文檔**: Swagger/OpenAPI
- **部署**: Docker, PM2
- **測試**: Jest (支持 TypeScript)
- **CI/CD**: GitHub Actions
- **其他技術**: 
  - 檔案上傳: Multer
  - Cloudflare R2 儲存服務
  - 電子郵件發送: Nodemailer
  - 資料驗證: Zod
  - TypeScript 型別檢查: ESLint, TSC

## 主要功能

DaoDao Server 是一個全功能的學習平台後端服務，提供以下核心功能模組:

### 🔐 身份驗證與使用者管理
- **多重身份驗證**: JWT + Google OAuth 整合
- **使用者管理**: 完整的 CRUD 操作，個人資料管理
- **角色權限系統**: 基於角色的存取控制 (RBAC)
- **會話管理**: Redis 快取與會話持久化

### 📚 學習計畫管理系統
- **專案管理**: 建立、查詢、更新和刪除學習計畫
- **里程碑追蹤**: 設定和管理學習里程碑
- **任務管理**: 詳細的任務建立與進度追蹤
- **學習筆記**: 支援豐富的筆記記錄功能
- **學習成果**: 記錄和展示學習成就
- **評價系統**: 專案評價與回饋機制

### 🎯 學習資源系統 (TypeScript 現代化實作)
- **資源管理**: 進階過濾、分頁與搜尋功能
- **多媒體支援**: 支援各種學習資源類型
- **評論與評分**: 使用者評論、按讚系統
- **標籤分類**: 智慧標籤系統與分類管理
- **狀態管理**: 草稿、發佈、封存等狀態控制

### 🏃‍♂️ 學習馬拉松活動
- **活動創建**: 建立和管理學習馬拉松
- **參與管理**: 報名、進度追蹤、完成認證
- **導師系統**: 導師分配與輔導管理
- **活動統計**: 活動數據分析與報告

### 👥 社群與互動
- **學習圈子**: 建立和參與學習社群
- **想法分享**: 創意與想法交流平台
- **活動組織**: 線上線下學習活動
- **多層評論系統**: 支援巢狀回覆的評論架構

### 🏷️ 智慧標籤系統
- **動態標籤**: 自動生成與手動管理
- **標籤統計**: 熱門標籤與使用分析
- **實體關聯**: 跨模組標籤關聯管理
- **搜尋整合**: 基於標籤的智慧搜尋

### 📁 檔案與媒體管理
- **圖片上傳**: Cloudflare R2 整合的可擴展儲存
- **多檔案支援**: 批量上傳與管理
- **檔案最佳化**: 自動壓縮與格式轉換
- **安全控制**: 檔案類型驗證與存取控制

### 📧 通訊與通知系統
- **電子郵件服務**: 系統通知與提醒
- **專案通知**: 學習進度與成就通知
- **電子郵件驗證**: 帳戶安全驗證機制
- **客製化模板**: 多樣化的郵件模板

### 📊 系統監控與管理
- **即時監控**: 系統效能、記憶體、資料庫狀態
- **管理儀表板**: 全面的系統管理介面
- **資料分析**: 使用者行為與平台統計
- **健康檢查**: 自動化系統健康監測

### 🔒 安全與效能
- **速率限制**: 多層級 API 存取控制
- **CORS 配置**: 跨域安全管理
- **資料驗證**: Zod 架構的型別安全驗證
- **快取機制**: Redis 快取最佳化

## 專案結構

本專案採用 **混合 JavaScript/TypeScript 架構**，正在從 JavaScript 漸進式遷移到 TypeScript。

### 專案架構

```
daodao-server/
├── config/               # 配置文件
├── controllers/          # 傳統 JavaScript 控制器
├── models/               # 傳統 JavaScript 資料模型
├── routes/               # 傳統 JavaScript 路由
├── middlewares/          # 傳統 JavaScript 中間件
├── services/             # 傳統 JavaScript 通用服務
├── utils/                # 傳統 JavaScript 工具函數
├── src/                  # 🆕 TypeScript 現代化架構
│   ├── controllers/      # TypeScript 控制器
│   ├── models/           # TypeScript/Sequelize 模型
│   ├── routes/           # TypeScript 路由定義
│   ├── services/         # TypeScript 業務邏輯服務
│   ├── types/            # TypeScript 型別定義
│   ├── validators/       # Zod 驗證架構
│   ├── middleware/       # TypeScript 中間件
│   ├── utils/            # TypeScript 工具
│   ├── swagger/          # API 文檔架構
│   └── app.ts            # TypeScript 路由設置
├── public/               # 靜態文件
├── tests/                # 測試文件
├── init-scripts/         # 初始化腳本
├── .env.dev              # 開發環境變數
├── .env.prod             # 生產環境變數
├── Dockerfile            # Docker 配置
├── docker-compose.yaml   # Docker Compose 配置
├── nginx.conf            # Nginx 配置
├── index.js              # 主要應用入口點
├── tsconfig.json         # TypeScript 配置
└── package.json          # 項目依賴
```

### 架構整合要點
- `index.js` - 主要入口點，載入 JavaScript 和 TypeScript 路由
- `src/app.ts` - TypeScript 路由設置和 Swagger 整合
- `src/utils/modelBridge.ts` - 橋接 JavaScript 和 TypeScript 模型
- 路徑別名: `@/*` 對應 `src/*`, `@types/*` 對應 `src/types/*`

## 安裝與運行

### 本地開發

1. 安裝依賴:
   ```bash
   npm install
   ```

2. 建立 .env.dev 檔案並配置必要的環境變數

3. 啟動開發服務器:
   ```bash
   npm run dev        # 使用 nodemon 啟動開發伺服器
   npm start          # 啟動生產伺服器
   ```

### TypeScript 開發命令

```bash
# TypeScript 相關命令
npm run typecheck     # 執行 TypeScript 型別檢查
npm run lint          # 執行 ESLint 檢查程式碼品質
npm run lint:fix      # 自動修復 ESLint 問題
tsc --noEmit          # 直接執行型別檢查
ts-node src/index.ts  # 直接執行 TypeScript 檔案

# 測試命令
npm test              # 執行 Jest 測試
npm run test:paths    # 使用 NODE_PATH=src 執行測試
```

### 使用 Docker

1. 建立必要的環境變數檔案 (.env.dev, .env.prod)

2. 啟動 Docker 容器:
   ```bash
   # 開發環境
   docker-compose up dev_app
   
   # 生產環境
   docker-compose up prod_app
   ```

## API 概覽

DaoDao Server 提供以下主要 API 路由:

### 傳統 JavaScript API
- `/auth`: 身份驗證相關 API
- `/users`: 使用者管理
- `/projects`: 學習計畫管理
- `/marathons`: 馬拉松活動
- `/circles`: 社群揪團
- `/ideas`: 想法分享
- `/comments`: 評論系統
- `/mentors`: 導師系統
- `/tags`: 標籤管理
- `/emails`: 電子郵件通知
- `/images`: 圖片上傳
- `/monitor`: 系統監控

### 🆕 現代化 TypeScript API
- `/api/resources`: 資源管理 (TypeScript 實作)
- `/api/reviews`: 評價系統 (TypeScript 實作)
- `/api/tags`: 標籤管理 (TypeScript 實作)

### API 文檔
- **Swagger UI**: `/api-docs` 和 `/api/docs`
- **TypeScript 優先**: 完整的 Swagger 註解和型別安全
- **標準化回應格式**: 統一的成功/錯誤狀態格式

## 資料庫模型

專案使用多個資料庫，包括:

- **PostgreSQL**: 儲存結構化資料，如使用者、項目、馬拉松等
- **MongoDB**: 儲存較為靈活的資料
- **Redis**: 用於快取和會話管理

主要資料模型包括:
- User (使用者)
- Project (學習計畫)
- Milestone (里程碑)
- Task (任務)
- Marathon (馬拉松活動)
- Circle (社群揪團)
- Comment (評論)
- Tag (標籤)
- Note (筆記)
- Outcome (學習成果)
- Review (評價)

## 環境變數

專案需要以下主要環境變數:

- `PORT`: 服務器端口
- `MONGODB_URI`: MongoDB 連接字串
- `POSTGRES_*`: PostgreSQL 資料庫設定
- `REDIS_*`: Redis 設定
- `JWT_SECRET`: JWT 令牌密鑰
- `SESSION_SECRET`: 會話密鑰
- `FRONTEND_URL`: 前端應用 URL
- `CLOUDFLARE_R2_*`: Cloudflare R2 配置
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`: Google OAuth 設定
- `EMAIL_*`: 電子郵件設定

詳細的環境變數配置請參考 .env.dev_temp 和 .env.prod_temp 檔案。

## 測試

本專案使用 Jest 作為測試框架。測試文件位於 `tests` 目錄下。

### 執行測試

```bash
npm test              # 執行 Jest 測試
npm run test:paths    # 使用 NODE_PATH=src 執行測試 (路徑解析)
```

### 測試配置
- **Jest 配置**: `config/jest.config.js`
- **TypeScript 支援**: 透過 ts-jest
- **測試檔案格式**: `.test.ts` 或 `.test.js`

測試覆蓋以下方面：
- 單元測試
- API 端點測試
- 服務層測試
- 模型測試
- TypeScript 型別測試

撰寫測試時請遵循以下原則：
- 測試檔案命名格式：`[檔案名].test.ts` (TypeScript) 或 `[檔案名].test.js`
- 使用模擬（mock）來隔離外部依賴
- 對關鍵功能進行全面測試
- 適當模擬外部依賴

## CI/CD 流程

本專案使用 GitHub Actions 實現持續整合和持續部署，工作流程定義於 `.github/workflows/main.yml`。

### 主要階段

1. **測試階段**：運行所有測試，確保程式碼品質
2. **構建與部署階段**：
   - 根據分支（main 或 dev）決定部署環境
   - 使用 SSH 連接到 Linode 伺服器
   - 部署應用並重啟服務
3. **驗證階段**：
   - 檢查 Docker 容器狀態
   - 檢查系統資源使用情況
   - 檢查應用日誌
4. **通知階段**：
   - 使用 Discord Webhook 發送部署結果通知

### 部署環境

- **主分支 (main)**: 生產環境
- **開發分支 (dev)**: 開發環境

## 貢獻指南

歡迎為 DaoDao Server 專案做出貢獻。請遵循以下步驟:

1. Fork 該專案
2. 建立功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 運行測試確保所有測試通過 (`npm test`)
5. 推送到分支 (`git push origin feature/amazing-feature`)
6. 開啟一個 Pull Request