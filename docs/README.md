# DaoDao Server 文檔索引

本目錄包含 DaoDao 學習平台後端服務的完整技術文檔。文檔已按功能分類整理，方便快速查找。

## 📂 目錄結構

### 1. [API](./api/) - API 設計與實作
API 文檔、路由配置、響應格式標準化、Swagger 文檔相關。

**核心文檔:**
- `api-response-format.md` - API 響應格式標準
- `api-response-migration.md` - API 響應格式遷移
- `api-v1-response-migration.md` - API v1 響應格式遷移
- `SWAGGER_AUTO_GENERATION_GUIDE.md` - Swagger 自動生成指南
- `SWAGGER_ZERO_ANNOTATION_SOLUTION.md` - Swagger 零註解方案
- `SWAGGER_MAINTENANCE_GUIDE.md` - Swagger 維護指南
- `CURRENT_SWAGGER_ANALYSIS.md` - 當前 Swagger 分析
- `API_TYPE_MISMATCH_ROOT_CAUSE_ANALYSIS.md` - API 類型不匹配根因分析
- `dashboard-api-redesign.md` - Dashboard API 重構設計
- `dashboard-api-migration-plan.md` - Dashboard API 遷移計劃
- `CURSOR_PAGINATION_GUIDE.md` - 游標分頁指南
- `pagination-guide.md` - 分頁指南
- `FRONTEND_API_USAGE_CLARIFICATION.md` - 前端 API 使用說明
- `frontend-backend-api-collaboration.md` - 前後端 API 協作

**功能 API:**
- `practice-api-v1-implementation-tasks.md` - Practice API v1 實作任務

**響應格式:**
- `RESPONSE_FORMAT_REFACTORING_TASKS.md` - 響應格式重構任務
- `RESPONSE_FORMAT_STANDARDIZATION_TASKS.md` - 響應格式標準化任務

---

### 2. [Authentication](./authentication/) - 認證與授權
JWT、OAuth、PKCE、用戶認證流程、安全機制。

**核心文檔:**
- `auth-service-documentation.md` - 認證服務文檔
- `auth-security-implementation-guide.md` - 安全實作指南
- `auth-security-roadmap.md` - 安全路線圖
- `auth-security-gaps-analysis.md` - 安全缺口分析
- `auth-testing-improvements-summary.md` - 認證測試改進總結

---

### 3. [Database](./database/) - 資料庫設計與遷移
PostgreSQL (Prisma)、MongoDB、Sequelize 遷移、資料庫架構。

**核心文檔:**
- `multi-database-architecture-design.md` - 多資料庫架構設計
- `SEQUELIZE_TO_PRISMA_MIGRATION_SUMMARY.md` - Sequelize 到 Prisma 遷移
- `SQL_TABLES_ENHANCEMENT_PLAN.md` - SQL 表結構優化計劃
- `SQL_FILE_ORGANIZATION_GUIDE.md` - SQL 文件組織指南
- `資料庫遷移調整文件.md` - 資料庫遷移調整

**Entity ID 處理:**
- `ENTITY_ID_CONSISTENCY_ANALYSIS.md` - Entity ID 一致性分析
- `ENTITY_ID_DATA_ANALYSIS.md` - Entity ID 資料分析
- `ENTITY_ID_HANDLING_GUIDE.md` - Entity ID 處理指南
- `ENTITY_ID_USAGE_ANALYSIS.md` - Entity ID 使用分析
- `entity-tags-data-mismatch.md` - 實體標籤資料不匹配
- `internal-vs-external-id-best-practices.md` - 內部與外部 ID 最佳實踐

**系統轉換:**
- `COMMENT_ID_TRANSFORMATION.md` - 評論 ID 轉換
- `COMMENT_SYSTEM_ID_TRANSFORMATION.md` - 評論系統 ID 轉換

---

### 4. [Types & Validation](./types-validation/) - 類型系統與驗證
TypeScript 類型、Zod 驗證、OpenAPI 類型生成。

**核心文檔:**
- `ZOD_V4_ZERO_ANNOTATION_GUIDE.md` - Zod v4 零註解指南
- `ZOD_V4_IMPLEMENTATION_TASKS.md` - Zod v4 實作任務
- `ZOD_SCHEMA_WITH_EXAMPLES_GUIDE.md` - Zod Schema 範例指南
- `MIGRATE_TO_ZOD_V4_GUIDE.md` - 遷移到 Zod v4 指南
- `TYPE_ARCHITECTURE_IMPROVEMENT_GUIDE.md` - 類型架構改進指南
- `OPENAPI_GENERATION_IMPROVEMENT_PLAN.md` - OpenAPI 生成改進
- `DOCKER_OPENAPI_DEBUG_GUIDE.md` - Docker OpenAPI 除錯指南
- `VALIDATORS_UPDATE_CHECKLIST.md` - 驗證器更新檢查清單
- `SERVICES_TYPES_VALIDATORS_AUDIT.md` - 服務類型驗證器稽核
- `SERVICES_TYPES_VALIDATORS_TASK_LIST.md` - 服務類型驗證器任務清單

---

### 5. [CI/CD & Deployment](./cicd-deployment/) - 持續整合與部署
Docker、GitHub Actions、部署優化、VPS 設定。

**核心文檔:**
- `CICD_COMPLETE_OPTIMIZATION_GUIDE.md` - CI/CD 完整優化指南
- `CICD_IMPROVEMENT_GUIDE.md` - CI/CD 改進指南
- `CICD_OPTIMIZATION_COMPLETED.md` - CI/CD 優化已完成
- `CICD_LOG.md` - CI/CD 日誌
- `DOCKER_REGISTRY_CACHE_GUIDE.md` - Docker Registry 快取指南
- `DOCKER_OPENAPI_DEBUG_GUIDE.md` - Docker OpenAPI 除錯指南
- `部署優化分析報告.md` - 部署優化分析報告
- `prisma-migration-cicd-tasks.md` - Prisma 遷移 CI/CD 任務

**基礎設施:**
- `NGINX_MULTI_DOMAIN_GUIDE.md` - Nginx 多域名指南
- `N8N_VPS_DEPLOYMENT_GUIDE.md` - N8N VPS 部署指南
- `VPS_DOMAIN_TROUBLESHOOTING.md` - VPS 域名故障排除

---

### 6. [Features](./features/) - 業務功能模組
Ideas、Practice、Resource、Comment 等核心功能。

**核心文檔:**
- `ideas-feature-practice-optimization.md` - Ideas 功能與 Practice 優化
- `system-monitoring-service-integration-plan.md` - 系統監控服務整合計劃

---

### 7. [Testing](./testing/) - 測試策略與覆蓋率
測試指南、測試覆蓋率報告、測試重構任務。

**核心文檔:**
- `testing-guide.md` - 測試指南
- `testing-standards-review.md` - 測試標準審查
- `test-validation-report.md` - 測試驗證報告
- `test-coverage-improvement-plan.md` - 測試覆蓋率改進計劃
- `test-coverage-analysis.md` - 測試覆蓋率分析
- `test-coverage-report.md` - 測試覆蓋率報告
- `test-failures-comprehensive-fix.md` - 測試失敗綜合修復
- `TEST_FAILURE_ANALYSIS.md` - 測試失敗分析
- `TEST_REWRITE_TASKS.md` - 測試重寫任務
- `POST_TEST_DATA.md` - POST 測試資料

---

### 8. [Architecture](./architecture/) - 系統架構設計
服務架構、業務邏輯流程、代碼審查。

**核心文檔:**
- `business-logic-flows.md` - 業務邏輯流程
- `project-features-comparison.md` - 專案功能比較
- `multi-database-architecture-design.md` - 多資料庫架構設計
- `service-analysis.md` - 服務分析
- `SERVICE_IMPROVEMENT_TASKS.md` - 服務改進任務
- `SERVICE_RESPONSE_FORMATS.md` - 服務響應格式
- `SERVICES_TYPE_USAGE_ANALYSIS.md` - 服務類型使用分析
- `CODE_REVIEW_SERVICES.md` - 代碼審查服務

---

### 9. [User Management](./user-management/) - 用戶管理系統
用戶創建流程、Custom ID、用戶偏好設定、專業領域。

**核心文檔:**
- `USER_SERVICE_ARCHITECTURE.md` - 用戶服務架構
- `USER_AUTHENTICATION_ARCHITECTURE.md` - 用戶認證架構
- `USER_AUTH_DETAILED_GUIDE.md` - 用戶認證詳細指南
- `USER_AUTH_DATABASE_ADJUSTMENTS.md` - 用戶認證資料庫調整
- `USER_CUSTOM_ID_ARCHITECTURE.md` - 用戶 Custom ID 架構
- `USER_CUSTOM_ID_TASKS.md` - 用戶 Custom ID 任務
- `USER_CREATION_LOGIC_COMPARISON.md` - 用戶創建邏輯比較
- `custom-user-id-implementation.md` - Custom ID 實作
- `CUSTOM_ID_DUPLICATE_PREVENTION.md` - Custom ID 重複預防
- `temp-to-formal-user-flow.md` - 臨時到正式用戶流程
- `js-vs-ts-user-logic-comparison.md` - JS 與 TS 用戶邏輯比較
- `me-routes-documentation.md` - Me 路由文檔
- `isSendEmail-parameter-analysis.md` - isSendEmail 參數分析
- `USER_API_SCHEMA_VALIDATION_ERRORS.md` - 用戶 API Schema 驗證錯誤
- `USER_API_TYPE_INCONSISTENCY_ANALYSIS.md` - 用戶 API 類型不一致分析

---

### 10. [Migration & Refactoring](./migration-refactoring/) - 遷移與重構
TypeScript 遷移、代碼重構、階段性任務。

**核心文檔:**
- `typescript-migration-plan.md` - TypeScript 遷移計劃
- `migration-plan-internal-external-id-separation.md` - 內外部 ID 分離遷移計劃
- `SEQUELIZE_TO_PRISMA_MIGRATION_SUMMARY.md` - Sequelize 到 Prisma 遷移總結
- `資料庫遷移調整文件.md` - 資料庫遷移調整文件
- `phase1-completion-summary.md` - 第一階段完成總結
- `phase2-deviation-analysis.md` - 第二階段偏差分析
- `phase3-completion-progress-report.md` - 第三階段進度報告

---

### 11. [Development Guides](./development-guides/) - 開發指南
PNPM 使用、測試原則、除錯指南。

**核心文檔:**
- `PNPM_COMMANDS_REFERENCE.md` - PNPM 命令參考
- `PNPM_MIGRATION_GUIDE.md` - PNPM 遷移指南
- `PNPM_MIGRATION_TASKS.md` - PNPM 遷移任務
- `EXPRESS_TESTING_PRINCIPLES.md` - Express 測試原則
- `DEBUG_PATH_RESOLUTION.md` - 除錯路徑解析
- `logging-system-guide.md` - 日誌系統指南

---

### 12. [Monitoring & Analytics](./monitoring-analytics/) - 監控與分析
ClickHouse 分析、數據追蹤。

**核心文檔:**
- `CLICKHOUSE_ANALYTICS_GUIDE.md` - ClickHouse 分析指南

---

### 13. [Archived](./archived/) - 已過時/參考資料
歷史文檔、已完成的遷移紀錄、舊版說明。

---

## 📁 其他目錄

### [api_error_bug](./api_error_bug/)
API 錯誤與 Bug 追蹤

### [permission](./permission/)
權限系統相關文檔

**核心文檔:**
- `PERMISSION_CONFIGURATION_GUIDE.md` - 權限配置指南

### [qa](./qa/)
QA 測試相關文檔

### [spec-kit-template-claude-v0.0.20](./spec-kit-template-claude-v0.0.20/)
規格模板

---

## 🔍 快速查找指南

**我想了解...**

- **API 設計**: → [API](./api/)
- **身份驗證**: → [Authentication](./authentication/)
- **資料庫結構**: → [Database](./database/)
- **類型定義**: → [Types & Validation](./types-validation/)
- **部署流程**: → [CI/CD & Deployment](./cicd-deployment/)
- **功能實作**: → [Features](./features/)
- **測試方法**: → [Testing](./testing/)
- **系統架構**: → [Architecture](./architecture/)
- **用戶系統**: → [User Management](./user-management/)
- **遷移計劃**: → [Migration & Refactoring](./migration-refactoring/)
- **開發工具**: → [Development Guides](./development-guides/)
- **監控追蹤**: → [Monitoring & Analytics](./monitoring-analytics/)

---

## 📝 文檔維護

### 新增文檔時的分類原則:

1. **API 相關** - 涉及 API 設計、路由、響應格式
2. **認證授權** - 涉及登入、JWT、OAuth、安全性
3. **資料庫** - 涉及資料模型、遷移、SQL
4. **類型驗證** - 涉及 TypeScript、Zod、型別定義
5. **CI/CD** - 涉及部署、Docker、自動化
6. **功能模組** - 涉及特定業務功能
7. **測試** - 涉及測試策略、覆蓋率
8. **架構** - 涉及系統設計、服務架構
9. **用戶** - 涉及用戶創建、管理、流程
10. **遷移** - 涉及代碼遷移、重構
11. **開發** - 涉及開發工具、流程、指南
12. **監控** - 涉及分析、追蹤、日誌

### 文檔命名規範:

- 使用全大寫 + 底線: `API_GUIDE.md`
- 使用小寫 + 破折號: `api-response-format.md`
- 中文文檔可直接使用中文命名: `資料庫遷移調整文件.md`

---

**Last Updated:** 2025-12-18
