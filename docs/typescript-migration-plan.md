# DaoDao Server TypeScript 遷移計劃

## 📋 專案概述

本文件為 DaoDao Server 的 TypeScript 遷移計劃，採用**分階段漸進式遷移**策略，確保系統穩定性和開發效率。

## 🎯 遷移目標

- 提升代碼品質和型別安全性
- 改善開發體驗和 IDE 支援
- 建立可維護的模組化架構
- 保持 API 向後相容性
- **採用 Prisma 替代 Sequelize 以提升 ORM 體驗**
- **使用 openapi-typescript 自動生成前端型別定義**

## 🔧 新技術堆疊

### 資料庫 ORM 遷移：Sequelize → Prisma
- **Prisma Client**: 型別安全的資料庫查詢
- **Prisma Schema**: 從現有資料庫自動生成模型定義
- **Prisma Introspection**: 從現有資料庫結構生成 schema
- **Prisma Studio**: 資料庫視覺化工具

### 前端型別自動生成：openapi-typescript
- **自動型別生成**: 從 OpenAPI 規格自動生成 TypeScript 型別
- **前後端型別同步**: 確保 API 介面的型別一致性
- **開發體驗提升**: 前端開發時有完整的型別提示

## 🔄 現有混合架構（目前狀態）

```
daodao-server/
├── index.js                          # 主入口點（JavaScript）
├── controllers/                      # JavaScript 控制器
│   ├── circle.js                     # 圈子控制器
│   ├── commentController.js          # 評論控制器
│   ├── idea.js                       # 想法控制器
│   ├── image.js                      # 圖片控制器
│   ├── mentor.js                     # 導師控制器
│   ├── milestone.js                  # 里程碑控制器
│   ├── note.js                       # 筆記控制器
│   ├── outcome.js                    # 成果控制器
│   ├── project.js                    # 專案控制器
│   ├── review.js                     # 評審控制器
│   ├── sendEmail.js                  # 郵件發送控制器
│   ├── sendMarathonEmail.js          # 馬拉松郵件控制器
│   ├── sendVerifiedEmail.js          # 驗證郵件控制器
│   ├── sendWelcomeEmail.js           # 歡迎郵件控制器
│   ├── task.js                       # 任務控制器
│   ├── user.js                       # 使用者控制器
│   └── verifyEmail.js                # 郵件驗證控制器
├── models/                          # JavaScript 模型
│   ├── area.js                       # 地區模型
│   ├── basicInfo.js                  # 基本資訊模型
│   ├── circle.js                     # 圈子模型
│   ├── city.js                       # 城市模型
│   ├── comment.js                    # 評論模型
│   ├── contact.js                    # 聯絡人模型
│   ├── country.js                    # 國家模型
│   ├── eligibility.js                # 資格模型
│   ├── feePlan.js                    # 費用計劃模型
│   ├── index.js                      # 模型索引
│   ├── location.js                   # 位置模型
│   ├── marathon.js                   # 馬拉松模型
│   ├── mentorMarathon.js             # 導師馬拉松模型
│   ├── mentorParticipants.js         # 導師參與者模型
│   ├── milestone.js                  # 里程碑模型
│   ├── note.js                       # 筆記模型
│   ├── outcome.js                    # 成果模型
│   ├── permission.js                 # 權限模型
│   ├── position.js                   # 職位模型
│   ├── post.js                       # 發文模型
│   ├── project.js                    # 專案模型
│   ├── projectMarathon.js            # 專案馬拉松模型
│   ├── review.js                     # 評審模型
│   ├── role.js                       # 角色模型
│   ├── rolePermission.js             # 角色權限模型
│   ├── subscriptionPlan.js           # 訂閱計劃模型
│   ├── task.js                       # 任務模型
│   ├── tempUser.js                   # 臨時使用者模型
│   ├── user.js                       # 使用者模型
│   ├── userPosition.js               # 使用者職位模型
│   ├── userProfile.js                # 使用者個人資料模型
│   └── userProject.js                # 使用者專案模型
├── routes/                          # JavaScript 路由
│   ├── auth.js                       # 認證路由
│   ├── circle.js                     # 圈子路由
│   ├── comment.js                    # 評論路由
│   ├── dashboard.js                  # 儀表板路由
│   ├── dbInfo.js                     # 資料庫資訊路由
│   ├── email.js                      # 郵件路由
│   ├── image.js                      # 圖片路由
│   ├── mentor.js                     # 導師路由
│   ├── monitor.js                    # 監控路由
│   ├── project.js                    # 專案路由
│   ├── projectList.js                # 專案列表路由
│   └── user.js                       # 使用者路由
├── middlewares/                     # JavaScript 中間件
│   ├── isAuthenticated.js            # 認證中間件
│   └── multer.js                     # 檔案上傳中間件
├── services/                        # JavaScript 服務
│   ├── commentService.js             # 評論服務
│   ├── jwt.js                        # JWT 服務
│   ├── mongo.js                      # MongoDB 服務
│   ├── passport.js                   # Passport 服務
│   ├── postgres.js                   # PostgreSQL 服務
│   ├── r2Service.js                  # R2 存儲服務
│   └── redis.js                      # Redis 服務
├── utils/                           # JavaScript 工具
│   ├── auth.js                       # 認證工具
│   └── dbRestart.js                  # 資料庫重啟工具
├── config/                          # 專案設定檔案
│   ├── db.js                         # 資料庫配置
│   └── jest.config.js                # Jest 測試設定
│
├── src/                             # TypeScript 部分（已存在）
│   ├── app.ts                       # TS 路由設定和 Swagger 整合
│   ├── config/                      # TS 設定檔案
│   │   ├── database.ts              # 資料庫配置
│   │   └── swagger.config.ts        # Swagger 配置
│   ├── constants/                   # 常數定義
│   │   └── mappings.ts              # 映射常數
│   ├── controllers/                 # TS 控制器（resource, review, tag, idea）
│   │   ├── idea-controller.ts       # 想法控制器
│   │   ├── index.ts                 # 控制器索引
│   │   ├── resource-controller.ts   # 資源控制器
│   │   ├── resource-review-controller.ts  # 資源評審控制器
│   │   └── tag-controller.ts        # 標籤控制器
│   ├── models/                      # TS 模型
│   │   ├── category.ts              # 分類模型
│   │   ├── entity-resource.ts       # 實體資源模型
│   │   ├── entity-tag.ts            # 實體標籤模型
│   │   ├── idea.ts                  # 想法模型
│   │   ├── index.ts                 # 模型索引
│   │   ├── resource-review.ts       # 資源評審模型
│   │   ├── resource.ts              # 資源模型
│   │   └── tag.ts                   # 標籤模型
│   ├── routes/                      # TS 路由
│   │   ├── idea-routes.ts           # 想法路由
│   │   ├── index.ts                 # 路由索引
│   │   ├── me-routes.ts             # 個人路由
│   │   ├── resource-review-routes.ts  # 資源評審路由
│   │   ├── resource-routes.ts       # 資源路由
│   │   └── tag-routes.ts            # 標籤路由
│   ├── services/                    # TS 服務
│   │   ├── auth/                    # 認證服務目錄
│   │   ├── database/                # 資料庫服務目錄
│   │   ├── logging/                 # Winston 日誌服務目錄
│   │   ├── idea-service.ts          # 想法服務
│   │   ├── index.ts                 # 服務索引
│   │   ├── jwt-service.ts           # JWT 服務
│   │   ├── resource-review-service.ts  # 資源評審服務
│   │   ├── resource-service.ts      # 資源服務
│   │   ├── tag-service.ts           # 標籤服務
│   │   └── transform-service.ts     # 轉換服務
│   ├── types/                       # TS 型別定義
│   │   ├── declarations/            # 宣告檔案
│   │   │   └── express.d.ts         # Express 型別擴展
│   │   ├── common.types.ts          # 共通型別
│   │   ├── global.d.ts              # 全域型別
│   │   ├── idea.types.ts            # 想法型別
│   │   ├── resource-review.types.ts # 資源評審型別
│   │   ├── resource.types.ts        # 資源型別
│   │   └── transform.types.ts       # 轉換型別
│   ├── validators/                  # Zod 驗證器
│   │   ├── idea.validators.ts       # 想法驗證器
│   │   ├── index.ts                 # 驗證器索引
│   │   ├── request-params.validator.ts  # 請求參數驗證器
│   │   ├── resource-review.validator.ts  # 資源評審驗證器
│   │   ├── resource.validator.ts    # 資源驗證器
│   │   └── validation.middleware.ts # 驗證中間件
│   ├── middleware/                  # TS 中間件
│   │   ├── auth.ts                  # 認證中間件
│   │   └── validator.ts             # 驗證中間件
│   ├── utils/                       # TS 工具
│   │   ├── data-transform.ts        # 資料轉換工具
│   │   ├── error-handler.ts         # 錯誤處理工具
│   │   ├── model-bridge.ts          # JS/TS 模型橋接
│   │   └── transform-utils.ts       # 轉換工具
│   └── swagger/                     # API 文件
│       ├── paths/                   # API 路徑定義
│       │   ├── common.paths.ts      # 共通路徑
│       │   ├── resource-review.paths.ts  # 資源評審路徑
│       │   ├── resource.paths.ts    # 資源路徑
│       │   └── tag.paths.ts         # 標籤路徑
│       └── schemas/                 # Schema 定義
│           ├── common.schemas.ts    # 共通 Schema
│           ├── idea.schemas.ts      # 想法 Schema
│           ├── resource-review.schemas.ts  # 資源評審 Schema
│           ├── resource.schemas.ts  # 資源 Schema
│           └── tag.schemas.ts       # 標籤 Schema
│
├── dist/                            # 編譯後的 JS（npm run build 產生）
│   └── src/                         # 編譯後的 TypeScript 檔案
│       └── app.js                   # 編譯後的 app.ts
│
├── tests/                           # 測試檔案
│   ├── integration/                 # 整合測試
│   │   └── idea-api.test.ts         # 想法 API 測試
│   ├── unit/                        # 單元測試
│   │   ├── controllers/             # 控制器測試
│   │   │   ├── idea-controller.test.ts
│   │   │   ├── resource-controller.test.ts
│   │   │   └── resource-review-controller.test.ts
│   │   ├── services/                # 服務測試
│   │   │   ├── commentController.test.js
│   │   │   ├── commentService.test.js
│   │   │   ├── idea-service.test.ts
│   │   │   ├── resourceReviewService.test.ts
│   │   │   ├── resourceService.test.ts
│   │   │   └── transformService.test.ts
│   │   └── validators/              # 驗證器測試
│   │       ├── idea.validator.test.ts
│   │       ├── resource.validator.test.ts
│   │       ├── resourceReview.validator.test.ts
│   │       └── validation.middleware.test.ts
│   ├── setup.js                     # 測試設定
│   └── teardown.js                  # 測試清理
│
├── public/                          # 靜態檔案
│   ├── db-info.html
│   ├── index.html
│   ├── monitor.html
│   └── robots.txt
├── logs/                            # 日誌檔案
├── docs/                            # 文檔目錄
│   ├── typescript-migration-plan.md # TypeScript 遷移計劃
│   └── [其他文檔]
├── .github/workflows/               # CI/CD
│
# 根目錄設定檔（必須在此）
├── tsconfig.json                    # TypeScript 設定
├── tsconfig.dev.json                # 開發環境 TypeScript 設定
├── package.json                     # 專案依賴（含 build script）
├── .env.example                     # 環境變數範例
├── Dockerfile                       # Docker 配置
├── docker-compose.yaml              # Docker Compose 配置
└── README.md                        # 專案說明
```

### ✅ 優化後的目標檔案結構

```
daodao-server/
├── src/                              # 所有 TypeScript 原始碼
│   ├── index.ts                      # 主要入口點
│   ├── app.ts                        # Express 應用程式設定
│   │
│   ├── controllers/                  # 控制器層 (按模組分組)
│   │   ├── auth.controller.ts        # 認證控制器
│   │   ├── user.controller.ts        # 使用者控制器
│   │   ├── project.controller.ts     # 專案控制器
│   │   ├── circle.controller.ts      # 圈子控制器
│   │   ├── comment.controller.ts     # 評論控制器
│   │   ├── mentor.controller.ts      # 導師控制器
│   │   ├── email.controller.ts       # 郵件控制器
│   │   ├── image.controller.ts       # 圖片控制器
│   │   ├── monitor.controller.ts     # 監控控制器
│   │   ├── resource.controller.ts    # 資源控制器 (已完成)
│   │   ├── resource-review.controller.ts # 資源評審控制器 (已完成)
│   │   ├── tag.controller.ts         # 標籤控制器 (已完成)
│   │   ├── idea.controller.ts        # 想法控制器 (已完成)
│   │   └── index.ts                  # 控制器導出
│   │
│   ├── services/                     # 服務層 (按模組分組)
│   │   ├── auth.service.ts           # 認證服務
│   │   ├── user.service.ts           # 使用者服務
│   │   ├── project.service.ts        # 專案服務
│   │   ├── circle.service.ts         # 圈子服務
│   │   ├── comment.service.ts        # 評論服務
│   │   ├── mentor.service.ts         # 導師服務
│   │   ├── email.service.ts          # 郵件服務
│   │   ├── image.service.ts          # 圖片服務
│   │   ├── monitor.service.ts        # 監控服務
│   │   ├── database.service.ts       # 資料庫服務
│   │   ├── jwt.service.ts            # JWT 服務 (已完成)
│   │   ├── resource.service.ts       # 資源服務 (已完成)
│   │   ├── resource-review.service.ts # 資源評審服務 (已完成)
│   │   ├── tag.service.ts            # 標籤服務 (已完成)
│   │   ├── idea.service.ts           # 想法服務 (已完成)
│   │   ├── transform.service.ts      # 轉換服務 (已完成)
│   │   └── index.ts                  # 服務導出
│   │
│   ├── models/                       # 資料模型層 (Prisma)
│   │   ├── generated/                # Prisma 自動生成的型別
│   │   │   └── client.ts             # Prisma Client 型別
│   │   ├── user.model.ts             # 使用者模型擴展
│   │   ├── project.model.ts          # 專案模型擴展
│   │   ├── circle.model.ts           # 圈子模型擴展
│   │   ├── comment.model.ts          # 評論模型擴展
│   │   ├── resource.model.ts         # 資源模型擴展 (已完成)
│   │   ├── resource-review.model.ts  # 資源評審模型擴展 (已完成)
│   │   ├── tag.model.ts              # 標籤模型擴展 (已完成)
│   │   ├── idea.model.ts             # 想法模型擴展 (已完成)
│   │   ├── category.model.ts         # 分類模型擴展 (已完成)
│   │   ├── entity-tag.model.ts       # 實體標籤模型擴展 (已完成)
│   │   ├── entity-resource.model.ts  # 實體資源模型擴展 (已完成)
│   │   └── index.ts                  # 模型導出
│   │
│   ├── routes/                       # 路由層
│   │   ├── auth.routes.ts            # 認證路由
│   │   ├── user.routes.ts            # 使用者路由
│   │   ├── project.routes.ts         # 專案路由
│   │   ├── circle.routes.ts          # 圈子路由
│   │   ├── comment.routes.ts         # 評論路由
│   │   ├── mentor.routes.ts          # 導師路由
│   │   ├── email.routes.ts           # 郵件路由
│   │   ├── image.routes.ts           # 圖片路由
│   │   ├── monitor.routes.ts         # 監控路由
│   │   ├── resource.routes.ts        # 資源路由 (已完成)
│   │   ├── resource-review.routes.ts # 資源評審路由 (已完成)
│   │   ├── tag.routes.ts             # 標籤路由 (已完成)
│   │   ├── idea.routes.ts            # 想法路由 (已完成)
│   │   ├── me.routes.ts              # 個人路由 (已完成)
│   │   └── index.ts                  # 路由導出
│   │
│   ├── middleware/                   # 中間件
│   │   ├── auth.middleware.ts        # 認證中間件 (已完成)
│   │   ├── validation.middleware.ts  # 驗證中間件 (已完成)
│   │   ├── error.middleware.ts       # 錯誤處理中間件
│   │   ├── logging.middleware.ts     # 日誌記錄中間件
│   │   ├── rate-limit.middleware.ts  # 速率限制中間件
│   │   ├── multer.middleware.ts      # 檔案上傳中間件
│   │   └── index.ts                  # 中間件導出
│   │
│   ├── validators/                   # Zod 驗證器
│   │   ├── auth.validators.ts        # 認證驗證器
│   │   ├── user.validators.ts        # 使用者驗證器
│   │   ├── project.validators.ts     # 專案驗證器
│   │   ├── circle.validators.ts      # 圈子驗證器
│   │   ├── comment.validators.ts     # 評論驗證器
│   │   ├── mentor.validators.ts      # 導師驗證器
│   │   ├── email.validators.ts       # 郵件驗證器
│   │   ├── image.validators.ts       # 圖片驗證器
│   │   ├── resource.validators.ts    # 資源驗證器 (已完成)
│   │   ├── resource-review.validators.ts # 資源評審驗證器 (已完成)
│   │   ├── tag.validators.ts         # 標籤驗證器 (已完成)
│   │   ├── idea.validators.ts        # 想法驗證器 (已完成)
│   │   ├── common.validators.ts      # 共通驗證器
│   │   └── index.ts                  # 驗證器導出
│   │
│   ├── types/                        # TypeScript 型別定義
│   │   ├── auth.types.ts             # 認證型別
│   │   ├── user.types.ts             # 使用者型別
│   │   ├── project.types.ts          # 專案型別
│   │   ├── community.types.ts        # 社群型別
│   │   ├── resource.types.ts         # 資源型別 (已完成)
│   │   ├── resource-review.types.ts  # 資源評審型別 (已完成)
│   │   ├── idea.types.ts             # 想法型別 (已完成)
│   │   ├── transform.types.ts        # 轉換型別 (已完成)
│   │   ├── common.types.ts           # 共通型別 (已完成)
│   │   ├── express.d.ts              # Express 型別擴展 (已完成)
│   │   ├── global.d.ts               # 全域型別 (已完成)
│   │   └── index.ts                  # 型別導出
│   │
│   ├── utils/                        # 工具函數
│   │   ├── auth.utils.ts             # 認證工具
│   │   ├── database.utils.ts         # 資料庫工具
│   │   ├── validation.utils.ts       # 驗證工具
│   │   ├── format.utils.ts           # 格式化工具
│   │   ├── error-handler.ts          # 錯誤處理工具 (已完成)
│   │   ├── data-transform.ts         # 資料轉換工具 (已完成)
│   │   ├── transform-utils.ts        # 轉換工具 (已完成)
│   │   ├── model-bridge.ts           # 模型橋接工具 (已完成)
│   │   ├── logger.ts                 # 日誌工具
│   │   ├── constants.ts              # 常數定義
│   │   └── index.ts                  # 工具導出
│   │
│   ├── config/                       # 配置檔案
│   │   ├── database.ts               # 資料庫配置 (已完成)
│   │   ├── swagger.config.ts         # Swagger 配置 (已完成)
│   │   ├── app.config.ts             # 應用程式配置
│   │   ├── auth.config.ts            # 認證配置
│   │   ├── storage.config.ts         # 存儲配置
│   │   ├── prisma.config.ts          # Prisma 配置
│   │   └── index.ts                  # 配置導出
│   │
│   ├── constants/                    # 常數定義
│   │   ├── mappings.ts               # 映射常數 (已完成)
│   │   ├── errors.ts                 # 錯誤常數
│   │   ├── status-codes.ts           # 狀態碼常數
│   │   ├── api-versions.ts           # API 版本常數
│   │   └── index.ts                  # 常數導出
│   │
│   ├── swagger/                      # Swagger 文件
│   │   ├── schemas/                  # Schema 定義
│   │   │   ├── auth.schemas.ts       # 認證 Schema
│   │   │   ├── user.schemas.ts       # 使用者 Schema
│   │   │   ├── project.schemas.ts    # 專案 Schema
│   │   │   ├── community.schemas.ts  # 社群 Schema
│   │   │   ├── resource.schemas.ts   # 資源 Schema (已完成)
│   │   │   ├── resource-review.schemas.ts # 資源評審 Schema (已完成)
│   │   │   ├── tag.schemas.ts        # 標籤 Schema (已完成)
│   │   │   ├── idea.schemas.ts       # 想法 Schema (已完成)
│   │   │   ├── common.schemas.ts     # 共通 Schema (已完成)
│   │   │   └── index.ts              # Schema 導出
│   │   ├── paths/                    # 路徑定義
│   │   │   ├── auth.paths.ts         # 認證路徑
│   │   │   ├── user.paths.ts         # 使用者路徑
│   │   │   ├── project.paths.ts      # 專案路徑
│   │   │   ├── community.paths.ts    # 社群路徑
│   │   │   ├── resource.paths.ts     # 資源路徑 (已完成)
│   │   │   ├── resource-review.paths.ts # 資源評審路徑 (已完成)
│   │   │   ├── tag.paths.ts          # 標籤路徑 (已完成)
│   │   │   ├── idea.paths.ts         # 想法路徑 (已完成)
│   │   │   ├── common.paths.ts       # 共通路徑 (已完成)
│   │   │   └── index.ts              # 路徑導出
│   │   └── index.ts                  # Swagger 設定彙總
│   │
│   └── tests/                        # 測試檔案
│       ├── unit/                     # 單元測試
│       │   ├── controllers/          # 控制器測試
│       │   ├── services/             # 服務測試
│       │   ├── validators/           # 驗證器測試
│       │   └── utils/                # 工具測試
│       ├── integration/              # 整合測試
│       │   ├── auth/                 # 認證整合測試
│       │   ├── api/                  # API 整合測試
│       │   └── database/             # 資料庫整合測試
│       ├── e2e/                      # 端對端測試
│       ├── fixtures/                 # 測試資料
│       ├── mocks/                    # 模擬物件
│       ├── setup.ts                  # 測試設定
│       └── teardown.ts               # 測試清理
│
├── dist/                             # 編譯後的 JavaScript 檔案
├── public/                           # 靜態檔案
├── logs/                             # 日誌檔案
├── docs/                             # 文檔目錄
├── .github/workflows/                # CI/CD 工作流程
├── config/                           # 專案設定檔案 (根目錄)
├── node_modules/                     # 依賴套件
├── prisma/                           # Prisma 配置
│   ├── schema.prisma                 # Prisma 資料庫 schema (從現有DB生成)
│   └── seed.ts                       # 資料庫種子資料 (可選)
├── generated/                        # 自動生成的型別
│   ├── openapi-types.ts              # OpenAPI 自動生成的型別
│   └── prisma-client/                # Prisma Client 生成檔案
├── openapi.yaml                      # OpenAPI 規格文件
├── tsconfig.json                     # TypeScript 設定
├── package.json                      # 專案依賴
├── .env.example                      # 環境變數範例
├── .gitignore                        # Git 忽略檔案
├── README.md                         # 專案說明
├── CLAUDE.md                         # Claude 專案指南
└── [其他設定檔案]
```

### 結構優化重點

1. **扁平化設計**
   - 減少巢狀層級，提高可讀性
   - 按模組而非分層組織檔案
   - 統一的命名規範

2. **模組化架構**
   - 每個模組都有清晰的邊界
   - 便於並行開發和維護
   - 降低模組間耦合度

3. **標準化組織**
   - 統一的 index.ts 導出模式
   - 一致的檔案命名規範
   - 清晰的相依性管理

## 🔄 轉換前後對比

### 轉換前（JavaScript）
```
daodao-server/
├── index.js                  # 變成 → src/index.ts
├── controllers/              # 變成 → src/controllers/**/*.ts
│   ├── circle.js            # 變成 → src/controllers/community/circle.controller.ts
│   ├── commentController.js # 變成 → src/controllers/community/comment.controller.ts
│   ├── idea.js              # 已轉換 → src/controllers/idea-controller.ts
│   ├── image.js             # 變成 → src/controllers/system/image.controller.ts
│   ├── mentor.js            # 變成 → src/controllers/community/mentor.controller.ts
│   ├── milestone.js         # 變成 → src/controllers/projects/milestone.controller.ts
│   ├── note.js              # 變成 → src/controllers/projects/note.controller.ts
│   ├── outcome.js           # 變成 → src/controllers/projects/outcome.controller.ts
│   ├── project.js           # 變成 → src/controllers/projects/project.controller.ts
│   ├── review.js            # 變成 → src/controllers/projects/review.controller.ts
│   ├── sendEmail.js         # 變成 → src/controllers/system/email.controller.ts
│   ├── sendMarathonEmail.js # 變成 → src/controllers/system/marathon-email.controller.ts
│   ├── sendVerifiedEmail.js # 變成 → src/controllers/system/verified-email.controller.ts
│   ├── sendWelcomeEmail.js  # 變成 → src/controllers/system/welcome-email.controller.ts
│   ├── task.js              # 變成 → src/controllers/projects/task.controller.ts
│   ├── user.js              # 變成 → src/controllers/users/user.controller.ts
│   └── verifyEmail.js       # 變成 → src/controllers/auth/verify-email.controller.ts
├── models/                  # 變成 → src/models/**/*.ts
│   ├── [所有模型檔案]        # 變成 → src/models/sequelize/*.ts
├── routes/                  # 變成 → src/routes/**/*.ts
│   ├── auth.js              # 變成 → src/routes/v1/auth.routes.ts
│   ├── circle.js            # 變成 → src/routes/v1/circle.routes.ts
│   ├── comment.js           # 變成 → src/routes/v1/comment.routes.ts
│   ├── [其他路由]            # 變成 → src/routes/v1/*.routes.ts
├── middlewares/             # 變成 → src/middleware/*.ts
│   ├── isAuthenticated.js   # 變成 → src/middleware/auth.middleware.ts
│   └── multer.js            # 變成 → src/middleware/multer.middleware.ts
├── services/                # 變成 → src/services/**/*.ts
│   ├── commentService.js    # 變成 → src/services/community/comment.service.ts
│   ├── jwt.js               # 變成 → src/services/auth/jwt.service.ts
│   ├── mongo.js             # 變成 → src/services/database/mongo.service.ts
│   ├── passport.js          # 變成 → src/services/auth/oauth.service.ts
│   ├── postgres.js          # 變成 → src/services/database/postgres.service.ts
│   ├── r2Service.js         # 變成 → src/services/storage/cloudflare-r2.service.ts
│   └── redis.js             # 變成 → src/services/database/redis.service.ts
├── utils/                   # 變成 → src/utils/**/*.ts
│   ├── auth.js              # 變成 → src/utils/auth/*.ts
│   └── dbRestart.js         # 變成 → src/utils/database/restart.utils.ts
└── config/                  # 變成 → src/config/*.ts
    ├── db.js                # 變成 → src/config/database.ts
    └── jest.config.js       # 保持在根目錄
```

### 轉換後的優勢

1. **更好的組織結構**
   - 按功能領域分組（auth, users, projects, community）
   - 清晰的分層架構
   - 版本化的 API 路由

2. **型別安全**
   - 完整的型別定義
   - Zod 驗證器
   - TypeScript 嚴格模式

3. **模組化設計**
   - 每個模組都有獨立的 index.ts 導出
   - 清晰的依賴關係
   - 便於測試和維護

4. **開發體驗提升**
   - 更好的 IDE 支援
   - 自動完成和型別提示
   - 編譯時錯誤檢查

## 📦 編譯和部署

### package.json scripts
```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix",
    "prisma:generate": "prisma generate",
    "prisma:introspect": "prisma db pull",
    "prisma:studio": "prisma studio",
    "prisma:seed": "ts-node prisma/seed.ts",
    "openapi:generate": "openapi-typescript openapi.yaml -o generated/openapi-types.ts",
    "types:generate": "npm run prisma:generate && npm run openapi:generate",
    "db:introspect": "prisma db pull",
    "db:seed": "prisma db seed"
  }
}
```

### tsconfig.json 設定
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@controllers/*": ["src/controllers/*"],
      "@models/*": ["src/models/*"],
      "@services/*": ["src/services/*"],
      "@utils/*": ["src/utils/*"],
      "@types/*": ["src/types/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

## 🚀 遷移策略

### 核心原則
- **漸進式遷移**：按依賴性和風險程度分階段進行
- **測試驅動**：每個階段都有完整的測試覆蓋
- **向後相容**：保持 API 介面穩定
- **品質優先**：確保每個階段的代碼品質

### 重新設計的階段劃分

#### 階段 1: 基礎設施 (3-4 週)
**目標**: 建立穩固的 TypeScript 基礎和新技術堆疊

**包含模組**:
- ✅ 資料庫連接服務 (PostgreSQL, MongoDB, Redis)
- ✅ 核心中間件 (驗證、錯誤處理)
- ✅ 工具類和常數定義
- ✅ 基礎型別定義
- 🔄 **Prisma 設定和資料庫 introspection**
- 🔄 **OpenAPI 規格文件建立**
- 🔄 **openapi-typescript 自動生成設定**

**完成標準**:
- 所有基礎服務通過單元測試
- 資料庫連接穩定
- 中間件功能正常
- **Prisma Client 正常運作**
- **OpenAPI 型別自動生成流程建立**

#### 階段 2: 認證系統 (2-3 週)
**目標**: 確保安全性和使用者管理

**包含模組**:
- ✅ JWT 服務
- 🔄 OAuth 整合 (Google)
- 🔄 權限管理系統
- 🔄 郵件驗證服務

**完成標準**:
- 認證流程完整測試
- 權限控制正確運作
- 安全性檢查通過

#### 階段 3: 核心業務 (5-6 週)
**目標**: 遷移主要業務邏輯並完成 ORM 轉換

**包含模組**:
- ✅ 使用者管理系統
- ✅ 資源管理系統 (已完成)
- ✅ 資源評審系統 (已完成)
- ✅ 標籤系統 (已完成)
- ✅ 想法系統 (已完成)
- 🔄 專案管理系統 (Project, Milestone, Task, Note, Outcome)
- 🔄 評審系統
- 🔄 **Sequelize 模型轉換到 Prisma**
- 🔄 **業務邏輯從 Sequelize 遷移到 Prisma Client**

**完成標準**:
- 核心 API 功能完整
- 業務邏輯測試覆蓋率 ≥ 80%
- 效能基準測試通過
- **所有資料庫操作使用 Prisma**
- **從 Sequelize 到 Prisma 轉換完成**

#### 階段 4: 進階功能 (3-4 週)
**目標**: 完成進階功能和整合

**包含模組**:
- ⏳ 社群功能 (Circle, Comment, Mentor)
- ⏳ 郵件系統 (Email Services)
- ⏳ 檔案處理 (Image, Upload)
- ⏳ 監控系統 (Monitor)

**完成標準**:
- 所有功能模組完成
- 整合測試通過
- 效能優化完成

### 遷移執行原則

1. **依賴性優先**
   - 先遷移被依賴的模組
   - 確保依賴關係清晰
   - 避免循環依賴

2. **風險控制**
   - 每個階段都有回滾計劃
   - 關鍵功能優先測試
   - 生產環境影響最小化

3. **品質保證**
   - 代碼審查機制
   - 自動化測試
   - 持續整合檢查

4. **團隊協作**
   - 明確的責任分工
   - 定期進度檢查
   - 技術決策文檔化

## 🔄 Prisma 遷移實施指南

### 1. Prisma 初始化設定
```bash
# 安裝 Prisma
npm install prisma @prisma/client
npm install -D prisma

# 初始化 Prisma
npx prisma init

# 從現有資料庫生成 schema
npx prisma db pull

# 生成 Prisma Client
npx prisma generate
```

### 2. 從 Sequelize 到 Prisma 的轉換步驟

#### 步驟 1: 設定 Prisma 環境
1. 設定 `DATABASE_URL` 環境變數
2. 使用 `prisma db pull` 從現有資料庫生成 schema
3. 檢查生成的 `schema.prisma` 檔案

#### 步驟 2: 逐步替換 Sequelize 模型
1. 保留現有 Sequelize 模型作為備份
2. 逐一替換服務層的資料庫查詢
3. 測試每個替換的功能

#### 步驟 3: 更新業務邏輯
```typescript
// 舊的 Sequelize 查詢
const user = await User.findByPk(id);

// 新的 Prisma 查詢
const user = await prisma.user.findUnique({ where: { id } });
```

### 3. OpenAPI TypeScript 整合

#### 步驟 1: 設定 OpenAPI 規格
1. 建立 `openapi.yaml` 檔案
2. 定義所有 API 端點和資料結構
3. 確保與現有 Swagger 文件同步

#### 步驟 2: 自動生成前端型別
```bash
# 安裝 openapi-typescript
npm install -D openapi-typescript

# 生成型別檔案
npm run openapi:generate
```

#### 步驟 3: 在程式碼中使用生成的型別
```typescript
import type { paths } from '../generated/openapi-types';

type UserResponse = paths['/api/users/{id}']['get']['responses']['200']['content']['application/json'];
```

## 📋 具體實施指南

### 階段實施檢查清單

#### 階段 1: 基礎設施檢查清單
- [ ] 設置 TypeScript 編譯環境
- [ ] 配置 ESLint
- [ ] 遷移資料庫連接服務
- [ ] 實現錯誤處理中間件
- [ ] 設置測試環境
- [ ] 建立 CI/CD 管道

**時間估算**: 2-3 週  
**風險評估**: 低 (基礎設施相對獨立)  
**緩解策略**: 保持舊版本並行運行

#### 階段 2: 認證系統檢查清單
- [ ] 遷移 JWT 服務 (已完成)
- [ ] 實現 OAuth 整合
- [ ] 建立權限管理系統
- [ ] 遷移郵件驗證服務
- [ ] 實現認證中間件
- [ ] 安全性測試

**時間估算**: 2-3 週  
**風險評估**: 中 (涉及安全性)  
**緩解策略**: 額外的安全性測試和審查

#### 階段 3: 核心業務檢查清單
- [ ] 遷移使用者管理系統
- [ ] 遷移專案管理系統
- [ ] 遷移評審系統
- [ ] API 相容性測試
- [ ] 效能基準測試
- [ ] 資料遷移驗證

**時間估算**: 4-5 週  
**風險評估**: 高 (核心業務邏輯)  
**緩解策略**: 漸進式發布，詳細的回滾計劃

#### 階段 4: 進階功能檢查清單
- [ ] 遷移社群功能
- [ ] 遷移郵件系統
- [ ] 遷移檔案處理
- [ ] 遷移監控系統
- [ ] 整合測試
- [ ] 效能優化

**時間估算**: 3-4 週  
**風險評估**: 中 (進階功能)  
**緩解策略**: 功能開關控制

### 遷移操作步驟

#### 預備階段
1. **環境準備**
   ```bash
   # 安裝 TypeScript 相關依賴
   npm install -D typescript @types/node ts-node-dev
   
   # 設置 tsconfig.json
   npx tsc --init
   
   # 設置 ESLint
   npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
   ```

2. **測試環境設置**
   ```bash
   # 設置 Jest 和 TypeScript 測試
   npm install -D jest ts-jest @types/jest
   
   # 運行現有測試確保基準
   npm test
   ```

#### 每個階段的標準流程

1. **代碼遷移**
   - 建立新的 TypeScript 檔案
   - 逐步遷移現有功能
   - 確保型別安全

2. **測試驗證**
   - 編寫單元測試
   - 執行整合測試
   - 驗證 API 相容性

3. **代碼審查**
   - 型別定義審查
   - 代碼品質檢查
   - 效能影響評估

4. **部署驗證**
   - 測試環境部署
   - 功能驗證
   - 效能測試

### 回滾策略

1. **代碼層面**
   - 保留舊版本代碼直到穩定
   - 使用功能開關控制新舊版本
   - Git 分支管理策略

2. **資料層面**
   - 資料庫遷移腳本
   - 資料備份和恢復
   - 資料一致性檢查

3. **部署層面**
   - 藍綠部署策略
   - 快速回滾機制
   - 監控和告警系統

## 🧪 測試策略

### 測試覆蓋率要求
- **單元測試**: ≥ 80% 覆蓋率
- **整合測試**: 所有 API 端點
- **端對端測試**: 關鍵使用者流程
- **效能測試**: 基準測試和負載測試

### 測試分類

#### 1. 單元測試
**目標**: 測試個別函數和方法
```typescript
// 範例：服務層單元測試
describe('UserService', () => {
  it('should create user with valid data', async () => {
    // 測試邏輯
  })
})
```

**要求**:
- 每個服務類別都要有對應測試
- 覆蓋正常流程和異常情況
- 模擬外部依賴

#### 2. 整合測試
**目標**: 測試模組間的互動
```typescript
// 範例：API 整合測試
describe('User API', () => {
  it('should return user profile', async () => {
    // 測試 API 端點
  })
})
```

**要求**:
- 測試所有 API 端點
- 驗證資料庫互動
- 檢查認證和授權

#### 3. 端對端測試
**目標**: 測試完整的使用者流程
```typescript
// 範例：使用者註冊流程
describe('User Registration Flow', () => {
  it('should complete full registration process', async () => {
    // 完整流程測試
  })
})
```

**要求**:
- 涵蓋主要業務流程
- 模擬真實使用場景
- 驗證系統整體功能

#### 4. 效能測試
**目標**: 確保系統效能符合要求

**基準測試**:
- API 回應時間 < 500ms
- 資料庫查詢時間 < 200ms
- 記憶體使用量監控

**負載測試**:
- 並發用戶數: 1000
- 每秒請求數: 500
- 錯誤率 < 1%

### 測試自動化

#### CI/CD 整合
```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run Tests
        run: |
          npm install
          npm run test
          npm run test:integration
          npm run test:e2e
```

#### 測試報告
- 覆蓋率報告自動生成
- 測試結果視覺化
- 效能測試結果追蹤

### 測試資料管理

#### 測試資料庫
- 使用獨立的測試資料庫
- 每次測試前重置資料
- 測試資料工廠模式

#### 模擬資料
```typescript
// 範例：測試資料工廠
export const createTestUser = (overrides?: Partial<User>) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  ...overrides
})
```

## 🔧 實際操作工具

### 自動化遷移腳本

#### 1. 檔案遷移腳本
```bash
#!/bin/bash
# migrate-files.sh - 自動遷移檔案到 TypeScript

# 設定變數
SOURCE_DIR="."
TARGET_DIR="src"
BACKUP_DIR="backup"

# 建立備份
mkdir -p $BACKUP_DIR
cp -r controllers models routes services utils $BACKUP_DIR/

# 遷移檔案
echo "開始遷移檔案..."
for file in $(find controllers models routes services utils -name "*.js"); do
    # 轉換檔案路徑
    new_file=$(echo $file | sed 's/\.js$/.ts/')
    target_file="$TARGET_DIR/$new_file"
    
    # 建立目標目錄
    mkdir -p $(dirname $target_file)
    
    # 複製並重新命名
    cp $file $target_file
    echo "遷移: $file -> $target_file"
done
```

#### 2. 型別定義生成器
```typescript
// generate-types.ts - 自動生成型別定義
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const generateTypes = async () => {
  // 掃描現有的 JavaScript 檔案
  const jsFiles = execSync('find . -name "*.js" -not -path "./node_modules/*"').toString().split('\n')
  
  for (const file of jsFiles) {
    if (!file) continue
    
    const content = fs.readFileSync(file, 'utf8')
    const types = extractTypes(content)
    
    // 生成對應的 .d.ts 檔案
    const typeFile = file.replace('.js', '.d.ts')
    fs.writeFileSync(typeFile, types)
  }
}

const extractTypes = (content: string): string => {
  // 解析 JavaScript 代碼並提取型別資訊
  // 這裡可以使用 AST 分析器
  return `// 自動生成的型別定義\nexport interface GeneratedTypes {\n  // TODO: 完善型別定義\n}\n`
}
```

#### 3. 相依性分析工具
```typescript
// analyze-dependencies.ts - 分析模組相依性
import fs from 'fs'
import path from 'path'

interface DependencyGraph {
  [module: string]: string[]
}

const analyzeDependencies = (): DependencyGraph => {
  const graph: DependencyGraph = {}
  
  // 掃描所有 JavaScript 檔案
  const scanDirectory = (dir: string) => {
    const files = fs.readdirSync(dir)
    
    for (const file of files) {
      const filePath = path.join(dir, file)
      const stat = fs.statSync(filePath)
      
      if (stat.isDirectory()) {
        scanDirectory(filePath)
      } else if (file.endsWith('.js')) {
        const content = fs.readFileSync(filePath, 'utf8')
        const dependencies = extractDependencies(content)
        graph[filePath] = dependencies
      }
    }
  }
  
  scanDirectory('.')
  return graph
}

const extractDependencies = (content: string): string[] => {
  const requireRegex = /require\(['"](.+)['"]\)/g
  const dependencies: string[] = []
  let match
  
  while ((match = requireRegex.exec(content)) !== null) {
    dependencies.push(match[1])
  }
  
  return dependencies
}
```

### 程式碼品質檢查

#### ESLint 設定
```json
// .eslintrc.json
{
  "extends": ["@typescript-eslint/recommended"],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-non-null-assertion": "warn"
  }
}
```

## 📊 總結

本文件提供了完整的 TypeScript 遷移計劃，包括：

1. **重新設計的階段劃分**：基於依賴性和風險程度的合理安排
2. **具體實施指南**：詳細的檢查清單和操作步驟
3. **完整測試策略**：覆蓋率要求和自動化方案
4. **實用操作工具**：自動化腳本和品質檢查
5. **優化檔案結構**：扁平化和模組化設計

### 下一步行動

1. 審查並確認遷移計劃
2. 設置開發環境和工具
3. 開始第一階段的基礎設施遷移
4. 按階段漸進式完成遷移

這個計劃確保了遷移過程的**安全性**、**可控性**和**效率性**，同時提供了**完整的指導**和**實用的工具**支援。