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
- **資料庫**:
  - MongoDB (透過 Mongoose)
  - PostgreSQL (透過 Sequelize ORM)
  - Redis (使用 ioredis)
- **身份驗證**: JWT, Passport.js (支持 Google OAuth)
- **部署**: Docker, PM2
- **測試**: Jest
- **CI/CD**: GitHub Actions
- **其他技術**: 
  - 檔案上傳: Multer
  - Cloudflare R2 儲存服務
  - 電子郵件發送: Nodemailer
  - 資料驗證: Zod

## 主要功能

DaoDao Server 提供以下主要功能:

1. **使用者管理**: 註冊、登入、個人資料管理、Google OAuth 登入
2. **學習計畫**: 建立、查詢、更新和刪除學習計畫，設定里程碑和任務
3. **馬拉松活動**: 建立和管理學習馬拉松活動
4. **社群揪團**: 建立和參與學習社群
5. **筆記與學習成果**: 記錄學習筆記和成果
6. **評論系統**: 對計畫和內容進行評論
7. **標籤系統**: 管理內容標籤
8. **圖片上傳**: 支持圖片上傳功能
9. **電子郵件通知**: 發送系統通知和提醒
10. **監控與統計**: 系統性能和資料統計

## 專案結構

```
daodao-server/
├── config/               # 配置文件
├── controllers/          # 控制器層，處理業務邏輯
├── models/               # 資料模型定義
├── routes/               # 路由定義
├── middlewares/          # 中間件
├── services/             # 通用服務
├── utils/                # 工具函數
├── public/               # 靜態文件
├── tests/                # 測試文件
├── init-scripts/         # 初始化腳本
├── .env.dev              # 開發環境變數
├── .env.prod             # 生產環境變數
├── Dockerfile            # Docker 配置
├── docker-compose.yaml   # Docker Compose 配置
├── nginx.conf            # Nginx 配置
├── index.js              # 應用入口點
└── package.json          # 項目依賴
```

## 安裝與運行

### 本地開發

1. 安裝依賴:
   ```bash
   npm install
   ```

2. 建立 .env.dev 檔案並配置必要的環境變數

3. 啟動開發服務器:
   ```bash
   npm run dev
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
npm test
```

測試覆蓋以下方面：
- 單元測試
- API 端點測試
- 服務層測試
- 模型測試

撰寫測試時請遵循以下原則：
- 測試檔案命名格式：`[檔案名].test.js`
- 使用模擬（mock）來隔離外部依賴
- 對關鍵功能進行全面測試

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