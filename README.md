# DaoDao Server

DaoDao Server 是一個基於 Node.js、Express 和 TypeScript 的現代化後端服務。作為 DaoDao 學習平台的核心後端，提供完整的學習管理、社群互動、資源分享等功能，幫助使用者規劃和追蹤學習進度。

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
- **程式語言**: TypeScript
- **資料庫**:
  - PostgreSQL (透過 Prisma ORM)
  - MongoDB (透過 Mongoose)
  - Redis (使用 ioredis)
- **身份驗證**: JWT, Passport.js (支持 Google OAuth)
- **API 文檔**: Swagger/OpenAPI
- **部署**: Docker, PM2
- **測試**: Jest (支持 TypeScript)
- **CI/CD**: GitHub Actions
- **包管理器**: pnpm
- **其他技術**:
  - 檔案上傳: Multer
  - Cloudflare R2 儲存服務
  - 電子郵件發送: Nodemailer
  - 任務隊列: BullMQ (Redis-based)
  - 資料驗證: Zod
  - 型別檢查: TypeScript, ESLint
  - 型別生成: Prisma Client, OpenAPI TypeScript
  - 日誌記錄: Winston
  - 安全防護: Helmet
  - 系統監控: Systeminformation
  - 時間處理: Moment Timezone

## 主要功能

DaoDao Server 是一個全功能的學習平台後端服務，提供以下核心功能模組:

### 身份驗證與使用者管理

- **多重身份驗證**: JWT + Google OAuth 整合
- **使用者管理**: 完整的 CRUD 操作，個人資料管理
- **角色權限系統**: 基於角色的存取控制 (RBAC)
- **會話管理**: Redis 快取與會話持久化

### 學習計畫管理系統

- **專案管理**: 建立、查詢、更新和刪除學習計畫
- **里程碑追蹤**: 設定和管理學習里程碑
- **任務管理**: 詳細的任務建立與進度追蹤
- **學習筆記**: 支援豐富的筆記記錄功能
- **學習成果**: 記錄和展示學習成就
- **評價系統**: 專案評價與回饋機制

### 學習資源系統

- **資源管理**: 進階過濾、分頁與搜尋功能
- **多媒體支援**: 支援各種學習資源類型
- **評論與評分**: 使用者評論、按讚系統
- **標籤分類**: 智慧標籤系統與分類管理
- **狀態管理**: 草稿、發佈、封存等狀態控制

### 學習馬拉松活動

- **活動創建**: 建立和管理學習馬拉松
- **參與管理**: 報名、進度追蹤、完成認證
- **導師系統**: 導師分配與輔導管理
- **活動統計**: 活動數據分析與報告

### 社群與互動

- **學習圈子**: 建立和參與學習社群
- **想法分享**: 創意與想法交流平台
- **活動組織**: 線上線下學習活動
- **多層評論系統**: 支援巢狀回覆的評論架構

### 學習實踐系統

- **實踐管理**: 建立和追蹤個人學習實踐計畫
- **打卡記錄**: 每日學習打卡與習慣養成，支援多種時段（通勤、早晨、中午等）
- **實踐事件**: 管理實踐過程中的重要事件和里程碑
- **互動功能**: 實踐社群互動、激勵與分享
- **統計分析**: 實踐數據統計與進度視覺化
- **目標設定**: 支援多種目標類型（每日、每週、累計）
- **封存功能**: 支援實踐的封存與取消封存管理
- **模板系統**: 實踐模板建立與套用

### 測驗系統

- **測驗管理**: 建立和管理學習測驗
- **題庫系統**: 支援多種題型和題庫管理

### 管理員功能

- **後台管理**: 完整的管理員控制面板
- **用戶統計**: 平台使用數據分析與報告
- **數據匯出**: 支援 CSV/Excel 格式匯出

### 智慧標籤系統

- **動態標籤**: 自動生成與手動管理
- **標籤統計**: 熱門標籤與使用分析
- **實體關聯**: 跨模組標籤關聯管理
- **搜尋整合**: 基於標籤的智慧搜尋

### 檔案與媒體管理

- **圖片上傳**: Cloudflare R2 整合的可擴展儲存
- **多檔案支援**: 批量上傳與管理
- **檔案最佳化**: 自動壓縮與格式轉換
- **安全控制**: 檔案類型驗證與存取控制

### 通訊與通知系統

- **電子郵件服務**: 系統通知與提醒
- **專案通知**: 學習進度與成就通知
- **電子郵件驗證**: 帳戶安全驗證機制
- **客製化模板**: 多樣化的郵件模板

### 系統監控與管理

- **即時監控**: 系統效能、記憶體、資料庫狀態
- **管理儀表板**: 全面的系統管理介面
- **資料分析**: 使用者行為與平台統計
- **健康檢查**: 自動化系統健康監測

### 安全與效能

- **速率限制**: 多層級 API 存取控制
- **CORS 配置**: 跨域安全管理
- **資料驗證**: Zod 架構的型別安全驗證
- **快取機制**: Redis 快取最佳化

## 專案結構

本專案採用 **現代化 TypeScript 架構**，提供完整的型別安全和企業級開發體驗。

### 完整專案架構

```
daodao-server/
├── src/                           # TypeScript 原始碼目錄
│   ├── config/                    # 配置管理
│   │   ├── database.ts            # 資料庫配置
│   │   ├── email.config.ts        # 郵件服務配置
│   │   └── swagger.config.ts      # API 文檔配置
│   ├── constants/                 # 常數定義
│   │   ├── http-status.ts         # HTTP 狀態碼
│   │   ├── permissions.ts         # 權限常數
│   │   ├── roles.ts               # 角色定義
│   │   └── mappings.ts            # 資料對應
│   ├── controllers/               # TypeScript 控制器層
│   │   ├── auth.controller.ts     # 身份驗證控制器
│   │   ├── user.controller.ts     # 使用者管理控制器
│   │   ├── resource.controller.ts # 資源管理控制器
│   │   ├── project.controller.ts  # 專案管理控制器
│   │   ├── comment.controller.ts  # 評論系統控制器
│   │   ├── idea.controller.ts     # 想法分享控制器
│   │   ├── tag.controller.ts      # 標籤管理控制器
│   │   ├── email.controller.ts    # 郵件服務控制器
│   │   ├── resource-review.controller.ts # 資源評價控制器
│   │   ├── practice.controller.ts # 學習實踐控制器
│   │   ├── quiz.controller.ts     # 測驗控制器
│   │   ├── admin.controller.ts    # 管理員控制器
│   │   ├── user-stats.controller.ts # 用戶統計控制器
│   │   └── task.controller.ts     # 任務管理控制器
│   ├── middleware/                # 中間件層
│   │   ├── auth.ts                # JWT 身份驗證中間件
│   │   ├── permission.middleware.ts # 角色權限檢查
│   │   ├── rate-limit.middleware.ts # 速率限制
│   │   ├── logging.middleware.ts  # 請求日誌記錄
│   │   ├── error.middleware.ts    # 全域錯誤處理
│   │   └── validator.ts           # 請求驗證中間件
│   ├── routes/                    # API 路由定義
│   │   ├── auth.routes.ts         # 身份驗證路由
│   │   ├── user.routes.ts         # 使用者管理路由
│   │   ├── resource.routes.ts     # 資源管理路由
│   │   ├── project.routes.ts      # 專案管理路由
│   │   ├── comment.routes.ts      # 評論系統路由
│   │   ├── idea.routes.ts         # 想法分享路由
│   │   ├── tag.routes.ts          # 標籤管理路由
│   │   ├── email.routes.ts        # 郵件服務路由
│   │   ├── me.routes.ts           # 個人資料路由
│   │   ├── monitor.routes.ts      # 系統監控路由
│   │   ├── db-info.routes.ts      # 資料庫資訊路由
│   │   ├── resource-review.routes.ts # 資源評價路由
│   │   ├── practice.routes.ts     # 學習實踐路由
│   │   ├── quiz.routes.ts         # 測驗路由
│   │   ├── admin.routes.ts        # 管理員路由
│   │   ├── user-stats.routes.ts   # 用戶統計路由
│   │   └── user.routes.ts         # 用戶管理路由
│   ├── services/                  # 業務邏輯服務層
│   │   ├── auth/                  # 身份驗證服務
│   │   │   ├── auth.service.ts    # 核心驗證邏輯
│   │   │   ├── oauth.service.ts   # OAuth 整合
│   │   │   ├── email.service.ts   # 驗證郵件服務
│   │   │   ├── permission.service.ts # 權限管理
│   │   │   └── index.ts           # 驗證服務匯出
│   │   ├── database/              # 資料庫服務
│   │   │   ├── prisma.service.ts  # Prisma ORM 服務
│   │   │   ├── mongo.service.ts   # MongoDB 連接服務
│   │   │   ├── postgres.service.ts # PostgreSQL 服務
│   │   │   ├── redis.service.ts   # Redis 快取服務
│   │   │   └── index.ts           # 資料庫服務匯出
│   │   ├── email/                 # 郵件系統服務
│   │   │   ├── email.service.ts   # 郵件發送服務
│   │   │   ├── enhanced-email.service.ts # 增強郵件功能
│   │   │   ├── template.service.ts # 郵件模板管理
│   │   │   ├── base-template.ts   # 基礎模板
│   │   │   ├── welcome-template.ts # 歡迎郵件模板
│   │   │   ├── verification-template.ts # 驗證郵件模板
│   │   │   ├── password-reset-template.ts # 密碼重置模板
│   │   │   ├── contact-template.ts # 聯絡表單模板
│   │   │   ├── marathon-template.ts # 馬拉松活動模板
│   │   │   └── types.ts           # 郵件型別定義
│   │   ├── logging/               # 日誌服務
│   │   │   ├── logger.service.ts  # Winston 日誌管理
│   │   │   └── index.ts           # 日誌服務匯出
│   │   ├── user.service.ts        # 使用者業務邏輯
│   │   ├── resource.service.ts    # 資源管理業務邏輯
│   │   ├── project.service.ts     # 專案管理業務邏輯
│   │   ├── comment.service.ts     # 評論系統業務邏輯
│   │   ├── idea.service.ts        # 想法分享業務邏輯
│   │   ├── tag.service.ts         # 標籤管理業務邏輯
│   │   ├── resource-review.service.ts # 資源評價業務邏輯
│   │   ├── practice.service.ts    # 學習實踐核心服務
│   │   ├── practice-checkin.service.ts # 實踐打卡記錄服務
│   │   ├── practice-event.service.ts # 實踐事件服務
│   │   ├── practice-interaction.service.ts # 實踐互動服務
│   │   ├── practice-template.service.ts # 實踐模板服務
│   │   ├── encouragement.service.ts # 鼓勵訊息服務
│   │   ├── mentor.service.ts      # 導師管理服務
│   │   ├── milestone.service.ts   # 里程碑管理服務
│   │   ├── note.service.ts        # 筆記管理服務
│   │   ├── outcome.service.ts     # 學習成果管理服務
│   │   ├── review.service.ts      # 評價管理服務
│   │   ├── me.service.ts          # 個人資料管理服務
│   │   ├── quiz.service.ts        # 測驗服務
│   │   ├── tag-prompt.service.ts  # 標籤提示服務
│   │   ├── task.service.ts        # 任務管理服務
│   │   ├── user-stats.service.ts  # 用戶統計服務
│   │   ├── admin/                 # 管理員服務
│   │   │   └── ...                # 管理員相關服務
│   │   └── index.ts               # 服務層匯出
│   ├── queues/                    # 任務隊列 (BullMQ)
│   │   ├── connection.ts          # Redis 連接配置
│   │   ├── practice-email.queue.ts # 實踐郵件隊列
│   │   └── practice-email.worker.ts # 實踐郵件處理器
│   ├── types/                     # TypeScript 型別定義
│   │   ├── api-response.types.ts  # API 回應格式型別
│   │   ├── auth.types.ts          # 身份驗證型別
│   │   ├── user.types.ts          # 使用者型別
│   │   ├── resource.types.ts      # 資源型別
│   │   ├── project.types.ts       # 專案型別
│   │   ├── comment.types.ts       # 評論型別
│   │   ├── idea.types.ts          # 想法型別
│   │   ├── practice.types.ts      # 實踐系統型別
│   │   ├── me.types.ts            # 個人資料型別
│   │   ├── mentor.types.ts        # 導師系統型別
│   │   ├── milestone.types.ts     # 里程碑型別
│   │   ├── note.types.ts          # 筆記型別
│   │   ├── outcome.types.ts       # 學習成果型別
│   │   ├── review.types.ts        # 評價型別
│   │   ├── email.types.ts         # 郵件型別
│   │   ├── common.types.ts        # 通用型別
│   │   ├── resource-review.types.ts # 資源評價型別
│   │   ├── global.d.ts            # 全域型別聲明
│   │   └── express.d.ts           # Express 請求擴展
│   ├── validators/                # Zod 驗證架構
│   │   ├── api-response.validators.ts # API 回應驗證器
│   │   ├── auth.validators.ts     # 身份驗證驗證器
│   │   ├── user.validators.ts     # 使用者驗證器
│   │   ├── user-custom-id.validators.ts # 使用者自訂ID驗證器
│   │   ├── resource.validator.ts  # 資源驗證器
│   │   ├── project.validators.ts  # 專案驗證器
│   │   ├── practice.validators.ts # 實踐系統驗證器
│   │   ├── comment.validators.ts  # 評論驗證器
│   │   ├── idea.validators.ts     # 想法驗證器
│   │   ├── mentor.validators.ts   # 導師系統驗證器
│   │   ├── milestone.validators.ts # 里程碑驗證器
│   │   ├── note.validators.ts     # 筆記驗證器
│   │   ├── outcome.validators.ts  # 學習成果驗證器
│   │   ├── review.validators.ts   # 評價驗證器
│   │   ├── me.validators.ts       # 個人資料驗證器
│   │   ├── email.validators.ts    # 郵件驗證器
│   │   ├── image.validators.ts    # 圖片上傳驗證器
│   │   ├── tag.validators.ts      # 標籤驗證器
│   │   ├── resource-review.validator.ts # 資源評價驗證器
│   │   └── request-params.validator.ts # 請求參數驗證器
│   ├── utils/                     # 工具函數
│   │   ├── response-helper.ts     # API 回應輔助工具
│   │   ├── error-factory.ts       # 錯誤工廠函數
│   │   ├── async-wrapper.ts       # 異步處理包裝器
│   │   └── model-bridge.ts        # JavaScript/TypeScript 模型橋接
│   ├── swagger/                   # API 文檔定義
│   │   └── schemas/               # Swagger 模式定義
│   │       ├── auth.schemas.ts    # 身份驗證模式
│   │       ├── user.schemas.ts    # 使用者模式
│   │       ├── resource.schemas.ts # 資源模式
│   │       ├── project.schemas.ts # 專案模式
│   │       ├── practice.schemas.ts # 實踐系統模式
│   │       ├── comment.schemas.ts # 評論模式
│   │       ├── idea.schemas.ts    # 想法模式
│   │       ├── mentor.schemas.ts  # 導師系統模式
│   │       ├── milestone.schemas.ts # 里程碑模式
│   │       ├── note.schemas.ts    # 筆記模式
│   │       ├── outcome.schemas.ts # 學習成果模式
│   │       ├── review.schemas.ts  # 評價模式
│   │       ├── me.schemas.ts      # 個人資料模式
│   │       ├── email.schemas.ts   # 郵件模式
│   │       ├── image.schemas.ts   # 圖片模式
│   │       ├── tag.schemas.ts     # 標籤模式
│   │       ├── monitor.schemas.ts # 監控模式
│   │       ├── db-info.schemas.ts # 資料庫資訊模式
│   │       ├── resource-review.schemas.ts # 資源評價模式
│   │       └── common.schemas.ts  # 通用模式
│   ├── tests/                     # 完整測試套件
│   │   ├── integration/           # 整合測試
│   │   │   ├── api-endpoints.test.ts # API 端點測試
│   │   │   ├── auth-flow.test.ts  # 身份驗證流程測試
│   │   │   ├── auth-security.test.ts # 安全性測試
│   │   │   ├── user-api.test.ts   # 使用者 API 測試
│   │   │   ├── resource-api.test.ts # 資源 API 測試
│   │   │   ├── project-api.test.ts # 專案 API 測試
│   │   │   ├── comment-api.test.ts # 評論 API 測試
│   │   │   ├── idea-api.test.ts   # 想法 API 測試
│   │   │   ├── resource-review-api.test.ts # 資源評價 API 測試
│   │   │   ├── database-reliability.test.ts # 資料庫可靠性測試
│   │   │   ├── health-api.test.ts # 健康檢查測試
│   │   │   ├── health-info-api.test.ts # 系統資訊測試
│   │   │   └── oauth-edge-cases.test.ts # OAuth 邊界測試
│   │   ├── unit/                  # 單元測試
│   │   │   ├── controllers/       # 控制器測試
│   │   │   ├── services/          # 服務測試
│   │   │   ├── middleware/        # 中間件測試
│   │   │   ├── validators/        # 驗證器測試
│   │   │   └── config/            # 配置測試
│   │   ├── utils/                 # 測試工具
│   │   │   ├── test-helpers.ts    # 測試輔助函數
│   │   │   ├── test-data-factory.ts # 測試資料工廠
│   │   │   ├── prisma-mock.ts     # Prisma 模擬
│   │   │   ├── test-cleanup.ts    # 測試清理
│   │   │   └── enhanced-test-utilities.ts # 增強測試工具
│   │   ├── globalSetup.js         # 全域測試設置
│   │   ├── globalTeardown.js      # 全域測試清理
│   │   └── setup.js               # 測試環境設置
│   ├── app.ts                     # Express 應用程式設置與路由集成
│   └── server.ts                  # TypeScript 伺服器入口點
├── generated/                     # 自動生成的型別檔案
│   ├── prisma/                    # Prisma Client 型別
│   └── openapi-types.ts           # OpenAPI 型別定義
├── prisma/                        # Prisma ORM 設定
│   └── schema.prisma              # 資料庫架構定義
├── config/                        # 配置檔案
│   ├── jest.config.js             # Jest 測試配置
│   └── ecosystem.config.js        # PM2 部署配置
├── dist/                          # TypeScript 編譯輸出目錄
├── public/                        # 靜態檔案服務
├── .env.dev                       # 開發環境變數
├── .env.prod                      # 生產環境變數
├── Dockerfile                     # Docker 容器配置
├── docker-compose.yaml            # Docker Compose 服務編排
├── tsconfig.json                  # TypeScript 編譯配置
├── package.json                   # 專案依賴與腳本
└── CLAUDE.md                      # AI 輔助開發指南
```

### 核心架構特點

#### 分層架構設計

- **控制器層 (Controllers)**: 處理 HTTP 請求和回應，負責參數驗證和錯誤處理
- **服務層 (Services)**: 實現核心業務邏輯，包含資料庫操作和第三方服務整合
- **中間件層 (Middleware)**: 提供身份驗證、權限檢查、請求日誌、錯誤處理等橫切關注點
- **路由層 (Routes)**: 定義 API 端點和路由規則，整合 Swagger 文檔

#### 現代化工具整合

- **Prisma ORM**: 型別安全的資料庫操作，自動生成 TypeScript 型別
- **Zod 驗證**: 強型別的請求驗證和資料解析
- **Winston 日誌**: 結構化日誌記錄和多種輸出格式
- **Swagger/OpenAPI**: 完整的 API 文檔生成和互動式測試介面
- **BullMQ 任務隊列**: 基於 Redis 的分散式任務處理，用於郵件發送等異步操作

#### 型別安全保證

- **完整型別覆蓋**: 從資料庫到 API 回應的端到端型別安全
- **路徑別名**: `@/*` 對應 `src/*`，簡化模組導入
- **自動型別生成**: Prisma 和 OpenAPI 型別自動生成和同步

#### 測試架構

- **分層測試**: 單元測試、整合測試、API 端點測試
- **測試工具**: 完整的測試輔助函數和資料工廠
- **模擬框架**: Prisma 模擬和外部服務模擬

## 安裝與運行

### 本地開發

1. 安裝依賴:

   ```bash
   pnpm install
   ```

2. 建立 .env.dev 檔案並配置必要的環境變數

3. 生成 Prisma 客戶端:

   ```bash
   pnpm run prisma:generate
   ```

4. 啟動開發服務器:

   ```bash
   pnpm run dev        # 使用 ts-node-dev 啟動開發伺服器
   pnpm start          # 啟動生產伺服器 (執行編譯後的 dist/src/server.js)
   ```

### 開發命令

```bash
# 開發與建置
pnpm run dev           # 使用 ts-node-dev 啟動開發伺服器 (自動重載)
pnpm run dev:watch     # 使用 ts-node-dev 啟動開發伺服器 (監視 src 目錄)
pnpm run build         # 編譯 TypeScript 到 dist 目錄
pnpm run clean         # 清理 dist 目錄

# 型別檢查與程式碼品質
pnpm run typecheck     # 執行 TypeScript 型別檢查
pnpm run lint          # 執行 ESLint 檢查程式碼品質
pnpm run lint:fix      # 自動修復 ESLint 問題

# 資料庫與型別生成
pnpm run prisma:generate    # 生成 Prisma Client
pnpm run prisma:studio      # 開啟 Prisma Studio GUI
pnpm run prisma:introspect  # 從現有資料庫拉取 schema
pnpm run types:generate     # 生成 Prisma 型別

# 測試
pnpm test                   # 執行所有測試
pnpm run test:unit          # 執行單元測試
pnpm run test:integration   # 執行整合測試
pnpm run test:e2e           # 執行端對端測試
pnpm run test:watch         # 監視模式執行測試
pnpm run test:coverage      # 生成測試覆蓋率報告
pnpm run test:ci            # CI 環境執行測試 (含覆蓋率)
pnpm run test:debug         # 除錯模式執行測試
pnpm run test:clean         # 清除 Jest 快取
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

DaoDao Server 提供完整的 RESTful API，採用版本化設計和標準化回應格式。

### API 路由架構

#### 核心業務 API (v1)

- **`/api/v1/auth`** - 身份驗證與授權管理
  - JWT 令牌驗證、Google OAuth 整合
  - 使用者註冊、登入、登出、密碼重置
- **`/api/v1/users`** - 使用者管理系統
  - 使用者 CRUD 操作、個人資料管理
  - 角色權限管理、使用者狀態控制
- **`/api/v1/projects`** - 學習計畫管理
  - 專案建立、更新、查詢、刪除
  - 里程碑追蹤、任務管理、進度報告
- **`/api/v1/resources`** - 學習資源管理
  - 資源 CRUD 操作、進階篩選和搜尋
  - 多媒體支援、標籤分類、狀態管理
- **`/api/v1/resources/:resourceId/reviews`** - 資源評價系統
  - 評價建立、查詢、更新、刪除
  - 評分統計、評論管理、回饋機制
- **`/api/v1/ideas`** - 想法分享平台
  - 創意發佈、瀏覽、搜尋、分類
  - 社群互動、標籤系統、熱門想法
- **`/api/v1/comments`** - 多層評論系統
  - 巢狀評論結構、回覆管理
  - 評論審核、舉報機制、權限控制
- **`/api/v1/tags`** - 智慧標籤管理
  - 動態標籤生成、標籤統計分析
  - 跨模組標籤關聯、搜尋整合
- **`/api/v1/me`** - 個人資料管理中心
  - 身份認證資訊 (`GET /auth`)
  - 用戶完整資料 (`GET /users`)
  - 實踐記錄管理 (`GET /practices`, `GET /practice-stats`)
  - 資源草稿管理 (`GET /resources`)
  - 偏好設定管理 (`GET /preferences`, `PUT /preferences`)
  - 想法創意管理 (`GET /ideas`)
- **`/api/v1/email`** - 電子郵件服務
  - 系統通知、驗證郵件發送
  - 郵件模板管理、發送狀態追蹤
- **`/api/v1/practices`** - 學習實踐系統
  - 實踐計畫建立、進度追蹤、統計分析
  - 打卡記錄、習慣養成、社群互動
  - 實踐事件管理、互動功能（按讚、收藏、分享）
  - 封存/取消封存實踐管理
  - 支援多種打卡時段（通勤、早晨、中午、下午、晚上）
- **`/api/v1/quiz`** - 測驗系統
  - 測驗建立與管理
  - 題目與答案驗證
- **`/api/v1/mentor`** - 導師系統
  - 導師-學員配對管理
  - 馬拉松活動導師分配
  - 學員參與管理和評估
- **`/api/v1/notes`** - 便利貼系統
  - 專案筆記建立和管理
  - 筆記可見性控制、分享功能
- **`/api/v1/outcomes`** - 成果管理
  - 學習成果記錄和展示
  - 專案成果管理
- **`/api/v1/reviews`** - 覆盤系統
  - 學習過程回顧和反思
  - 專案覆盤記錄管理
- **`/api/v1/images`** - 圖片管理
  - 圖片上傳和儲存服務
  - 多檔案批量上傳、圖片處理

#### 系統管理 API (v1)

- **`/api/v1/admin`** - 管理員後台
  - 平台統計資訊、用戶管理
  - 數據匯出功能 (CSV/Excel)
  - 系統配置管理
- **`/api/v1/user-stats`** - 用戶統計
  - 用戶活動數據分析
  - 學習進度統計報告
- **`/api/v1/monitor`** - 系統監控儀表板
  - 即時效能監控、資源使用統計
  - 系統健康檢查、警報管理
- **`/api/v1/db-info`** - 資料庫資訊管理
  - 資料庫連線狀態、查詢效能統計
  - 資料表資訊、索引使用情況

#### 健康檢查與工具 API

- **`/api/v1/health`** - 系統健康檢查
  - 服務運行狀態、系統運行時間
  - 即時狀態回報、依賴服務檢查
- **`/api/ts-test`** - TypeScript 路由測試
  - 開發環境路由功能驗證

### API 文檔與測試

#### 互動式文檔

- **主要文檔**: `/api-docs` - 完整的 Swagger UI 介面
- **備用文檔**: `/api/docs` - 相同功能的備用路徑
- **文檔特色**:
  - 客製化界面設計，隱藏 Swagger 預設頂欄
  - 即時 API 測試功能，支援所有端點測試
  - 完整的請求/回應範例和型別定義
  - 整合身份驗證測試，支援 JWT 令牌驗證

#### API 設計特點

- **版本化設計**: 採用 `/api/v1/` 前綴，支援未來版本升級
- **TypeScript 優先**: 完整的型別安全和 Swagger 註解
- **標準化回應**: 統一的成功/錯誤狀態格式和錯誤碼
- **RESTful 設計**: 遵循 REST 架構原則，語義化 URL 設計
- **安全機制**: JWT 身份驗證、角色權限控制、速率限制

## 資料庫模型

專案使用多個資料庫系統：

- **PostgreSQL**: 主要資料庫，透過 Prisma ORM 管理
  - 使用者、專案、資源、評論等結構化資料
  - 支援關聯查詢和事務處理
- **MongoDB**: 文件型資料庫，用於彈性資料結構
  - 活動日誌、使用者行為追蹤
- **Redis**: 快取層、會話管理和任務隊列
  - API 回應快取
  - 使用者會話儲存
  - 速率限制計數器
  - BullMQ 任務隊列後端

主要資料模型包括:

- **users** (使用者) - 用戶基本資訊和認證
- **projects** (學習計畫) - 用戶學習專案管理
- **milestones** (里程碑) - 專案進度里程碑
- **tasks** (任務) - 具體學習任務
- **marathons** (馬拉松活動) - 學習馬拉松活動
- **groups** (社群揪團) - 學習社群和揪團
- **comments** (評論) - 多層次評論系統
- **tags** (標籤) - 標籤分類系統
- **resources** (資源) - 學習資源管理
- **resource_review** (資源評價) - 資源評分和評論
- **practices** (實踐) - 學習實踐記錄
- **practice_checkins** (實踐打卡) - 實踐進度記錄
- **ideas** (想法) - 創意想法分享
- **categories** (分類) - 階層式分類系統
- **user_preferences** (用戶偏好) - 個人偏好設定
- **note** (筆記) - 學習筆記記錄
- **outcome** (學習成果) - 學習成果展示
- **review** (評價) - 學習過程評價和反思

## 環境變數

專案需要以下主要環境變數:

- `PORT`: 服務器端口
- `NODE_ENV`: 環境模式 (development/production)
- `DATABASE_URL`: PostgreSQL 連接字串
- `MONGO_URL`: MongoDB 連接字串
- `REDIS_HOST`: Redis 主機地址
- `JWT_SECURITY`: JWT 令牌密鑰
- `JWT_EXPIRATION`: JWT 過期時間
- `SESSION_SECRET`: 會話密鑰
- `FRONTEND_URL`: 前端應用 URL
- `R2_*`: Cloudflare R2 儲存配置
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`: Google OAuth 設定
- `EMAIL_ADDRESS`, `EMAIL_PASSWORD`: 電子郵件設定
- `LOG_LEVEL`: 日誌等級 (debug/info/warn/error)

詳細的環境變數配置請參考 .env.dev_temp 和 .env.prod_temp 檔案。

## 測試

本專案採用 **企業級測試架構**，使用 Jest 作為核心測試框架，提供完整的單元測試、整合測試和 API 端點測試覆蓋。

### 測試框架架構

#### 測試層級結構

```
tests/
├── integration/                    # 整合測試 - 測試 API 端點和業務流程
│   ├── api-endpoints.test.ts       # 全面 API 端點測試
│   ├── auth-flow.test.ts           # 身份驗證流程測試
│   ├── auth-security.test.ts       # 安全性和權限測試
│   ├── user-api.test.ts            # 使用者管理 API 測試
│   ├── resource-api.test.ts        # 資源管理 API 測試
│   ├── project-api.test.ts         # 專案管理 API 測試
│   ├── comment-api.test.ts         # 評論系統 API 測試
│   ├── idea-api.test.ts            # 想法分享 API 測試
│   ├── resource-review-api.test.ts # 資源評價 API 測試
│   ├── database-reliability.test.ts # 資料庫可靠性測試
│   ├── health-api.test.ts          # 系統健康檢查測試
│   ├── health-info-api.test.ts     # 系統資訊 API 測試
│   └── oauth-edge-cases.test.ts    # OAuth 邊界情況測試
├── unit/                           # 單元測試 - 測試獨立功能模組
│   ├── controllers/                # 控制器層測試
│   │   ├── auth.controller.test.ts
│   │   ├── user.controller.test.ts
│   │   ├── resource.controller.test.ts
│   │   ├── project.controller.test.ts
│   │   ├── comment.controller.test.ts
│   │   ├── email.controller.test.ts
│   │   ├── idea-controller.test.ts
│   │   └── resource-review-controller.test.ts
│   ├── services/                   # 服務層測試
│   │   ├── auth.service.test.ts
│   │   ├── oauth.service.test.ts
│   │   ├── permission.service.test.ts
│   │   ├── permission.service.comprehensive.test.ts
│   │   ├── user.service.test.ts
│   │   ├── resource.service.test.ts
│   │   ├── project.service.test.ts
│   │   ├── comment.service.test.ts
│   │   ├── idea.service.test.ts
│   │   ├── resource-review.service.test.ts
│   │   ├── email.service.test.ts
│   │   ├── email-template.service.test.ts
│   │   ├── jwt.service.test.ts
│   │   ├── logger.service.test.ts
│   │   ├── database.service.test.ts
│   │   └── transform.service.test.ts
│   ├── middleware/                 # 中間件測試
│   │   ├── auth.middleware.test.ts
│   │   ├── auth.middleware.refactored.test.ts
│   │   ├── permission.middleware.test.ts
│   │   └── error.middleware.test.ts
│   ├── validators/                 # 驗證器測試
│   │   ├── resource.validator.test.ts
│   │   ├── resource-review.validator.test.ts
│   │   ├── comment.validators.test.ts
│   │   ├── idea.validator.test.ts
│   │   └── validation.middleware.test.ts
│   └── config/                     # 配置測試
│       └── environment.test.ts
└── utils/                          # 測試工具和輔助函數
    ├── test-helpers.ts             # 通用測試輔助函數
    ├── test-data-factory.ts        # 測試資料工廠模式
    ├── prisma-mock.ts              # Prisma 資料庫模擬
    ├── test-cleanup.ts             # 測試環境清理
    ├── enhanced-test-utilities.ts  # 增強測試工具
    └── test-utilities-example.test.ts # 測試工具使用範例
```

### 執行測試

#### 基本測試命令

```bash
# 執行所有測試
pnpm test

# 執行單元測試
pnpm run test:unit

# 執行整合測試
pnpm run test:integration

# 執行端對端測試
pnpm run test:e2e

# 監視模式執行測試 (開發時使用)
pnpm run test:watch

# 生成測試覆蓋率報告
pnpm run test:coverage

# CI 環境執行測試
pnpm run test:ci

# 除錯模式執行測試
pnpm run test:debug

# 清除 Jest 快取
pnpm run test:clean

# 執行特定測試檔案
pnpm test -- auth.controller.test.ts
```

#### 進階測試選項

```bash
# 執行特定模式的測試
pnpm test -- --testNamePattern="Auth"

# 並行執行測試
pnpm test -- --maxWorkers=4

# 詳細輸出
pnpm test -- --verbose

# 只執行失敗的測試
pnpm test -- --onlyFailures
```

### 測試架構特點

#### 企業級測試配置

- **Jest 配置**: `config/jest.config.js` - 完整的企業級測試配置
- **TypeScript 支援**: 透過 `ts-jest` 提供完整的 TypeScript 測試支援
- **路徑別名**: 支援 `@/*` 路徑別名，與主專案保持一致
- **全域設置**: `globalSetup.js` 和 `globalTeardown.js` 管理測試環境

#### 測試工具生態系統

- **資料工廠模式**: `test-data-factory.ts` 提供一致的測試資料生成
- **Prisma 模擬**: `prisma-mock.ts` 提供資料庫操作模擬
- **增強測試工具**: `enhanced-test-utilities.ts` 提供進階測試功能
- **自動清理**: `test-cleanup.ts` 確保測試環境隔離

#### 測試覆蓋範圍

- **API 端點測試**: 完整覆蓋所有 REST API 端點
- **身份驗證測試**: JWT、OAuth、權限系統全面測試
- **業務邏輯測試**: 核心服務層邏輯驗證
- **資料庫測試**: Prisma 操作和資料一致性測試
- **中間件測試**: 請求處理管線完整驗證
- **錯誤處理測試**: 異常情況和邊界條件測試
- **安全性測試**: CORS、速率限制、資料驗證測試

### 測試開發指南

#### 測試檔案命名規範

- **單元測試**: `[模組名].test.ts` (如：`auth.service.test.ts`)
- **整合測試**: `[功能名]-api.test.ts` (如：`user-api.test.ts`)
- **測試工具**: `[工具名].ts` (如：`test-helpers.ts`)

#### 測試撰寫最佳實踐

1. **隔離性**: 每個測試獨立運行，不依賴其他測試結果
2. **模擬策略**: 使用適當的 mock 來隔離外部依賴
3. **資料一致性**: 使用測試資料工廠確保測試資料一致性
4. **完整性**: 測試正常流程、錯誤情況和邊界條件
5. **可讀性**: 清晰的測試描述和結構化的測試組織

## CI/CD 流程

本專案採用 **現代化 CI/CD 管道**，使用 GitHub Actions 實現智慧化的持續整合和持續部署，確保程式碼品質和部署穩定性。

### 工作流程架構

#### 持續整合 (CI) - `continuous-integration.yml`
- **觸發條件**: PR 提交到 main/dev 分支，手動觸發，或被 CD 工作流程調用
- **核心功能**: 
  - 依賴管理和快取優化
  - Prisma 和 OpenAPI 類型自動生成
  - 並行執行 TypeScript 類型檢查、ESLint 和 Jest 測試
  - 生成文件上傳為 artifact 供 CD 使用
- **通知機制**: 成功/失敗狀態自動通知團隊 Discord 頻道

#### 持續部署 (CD) - `continuous-delivery.yml`
- **觸發條件**: 推送到 main/dev 分支，支援手動觸發和強制部署選項
- **智慧構建策略**: 
  - 自動檢測 TypeScript 類型文件變更
  - 類型變更時禁用 Docker 快取，確保正確重建
  - 多層快取策略：Registry、GitHub Actions、BuildKit
- **Docker 優化**: 
  - 分層構建策略，類型文件獨立層確保變更觸發
  - 構建驗證：容器運行測試、健康檢查、映像大小監控
- **部署環境**: 
  - main 分支 → 生產環境 (需要審核)
  - dev 分支 → 開發環境

#### 緊急修復 (Emergency Rebuild) - `emergency-rebuild.yml`
- **觸發條件**: 手動觸發，用於解決快取相關的構建問題
- **特殊功能**:
  - 完全清除所有快取 (pnpm、Docker system、builder)
  - 強制重新構建，確保無快取干擾
  - 支援跳過測試的緊急部署選項
  - 詳細的構建驗證和狀態通知

### Docker 構建優化

#### 智慧分層策略 (Dockerfile)
```dockerfile
# 第一步：TypeScript 配置和類型文件 (類型變更觸發重建)
COPY tsconfig*.json ./
COPY src/types/ ./src/types/

# 第二步：其餘源碼文件 (源碼變更觸發重建)  
COPY src/ ./src/
# ... 其他文件

# 第三步：TypeScript 類型檢查 (確保類型正確)
RUN pnpm run typecheck

# 第四步：構建編譯
RUN pnpm run build
```

#### 快取最佳化策略
- **依賴層快取**: package.json 變更才重新安裝依賴
- **Prisma 快取**: schema.prisma 變更才重新生成客戶端
- **類型感知快取**: 類型文件變更時自動重建相關層
- **多源快取**: Registry、GitHub Actions、BuildKit 三重快取

### API 一致性保證

#### External ID 統一架構
為確保前端 API 一致性，所有對外 API 均使用 UUID 格式的 `external_id`：

- **Idea API**: 創建/查詢想法時返回 UUID 格式的 `id`
- **Practice API**: 學習實踐記錄使用 UUID 識別
- **Project API**: 專案管理採用 UUID 路由
- **Resource API**: 資源管理統一 UUID 格式
- **安全優勢**: 防止 ID 猜測攻擊，提升 API 安全性

#### 類型安全更新流程
1. **自動檢測**: CI/CD 自動識別 TypeScript 類型變更
2. **快取控制**: 類型變更時禁用 Docker 快取確保正確重建
3. **類型驗證**: 構建前執行完整 TypeScript 類型檢查
4. **API 測試**: 構建後驗證 API 回應格式正確性

### 監控和告警

#### 構建監控
- **快取效率**: 自動記錄快取命中率和構建時間
- **映像大小**: 監控 Docker 映像大小，超過 1GB 發出警告  
- **構建狀態**: 即時通知構建成功/失敗狀態
- **性能追蹤**: 追蹤不同階段的構建時間

#### Discord 整合通知
- **CI 狀態**: 測試通過/失敗即時通知
- **部署狀態**: 部署成功/失敗詳細報告
- **緊急重建**: 緊急修復操作狀態追蹤
- **系統警告**: 映像大小、構建時間異常警告

### 部署環境管理

#### 環境分離策略
- **Production (main 分支)**:
  - 需要手動審核通過才能部署
  - 完整的構建驗證和測試
  - 藍綠部署確保零停機時間
- **Development (dev 分支)**:
  - 自動部署，快速疊代
  - 相同的構建流程確保環境一致性

#### 部署驗證機制
- **容器健康檢查**: 驗證應用正常啟動
- **API 端點測試**: 驗證關鍵 API 功能
- **資料庫連接**: 確認資料庫服務正常
- **系統資源**: 監控記憶體、CPU 使用情況

這個現代化的 CI/CD 系統確保了：
- **品質保證**: 完整的測試覆蓋和類型檢查
- **部署穩定**: 智慧快取和構建優化  
- **問題解決**: 緊急修復機制和詳細監控
- **團隊協作**: 即時通知和狀態追蹤

## 貢獻指南

歡迎為 DaoDao Server 專案做出貢獻。請遵循以下步驟:

1. Fork 該專案
2. 建立功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 運行測試確保所有測試通過 (`pnpm test`)
5. 推送到分支 (`git push origin feature/amazing-feature`)
6. 開啟一個 Pull Request
