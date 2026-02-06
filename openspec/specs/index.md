# DaoDao Server Specifications Index

## Overview

此目錄包含 DaoDao 學習平台後端的技術規格文件。每個規格文件詳細描述了對應模組的 API 設計、資料模型、業務規則和實作細節。

---

## Specification Documents

### Core Specifications

| Document | Description | Status |
|----------|-------------|--------|
| [system-overview.md](./system-overview.md) | 系統架構概覽、技術棧、開發標準 | ✅ Complete |
| [auth.md](./auth.md) | 認證授權系統（JWT、OAuth、RBAC） | ✅ Complete |
| [users.md](./users.md) | 用戶管理與個人資料 | ✅ Complete |

### Learning Features

| Document | Description | Status |
|----------|-------------|--------|
| [projects.md](./projects.md) | 學習專案管理（里程碑、任務、筆記、成果） | ✅ Complete |
| [resources.md](./resources.md) | 學習資源管理與 Faceted Search | ✅ Complete |
| [practices.md](./practices.md) | 每日實踐與打卡系統 | ✅ Complete |

### Social & Community

| Document | Description | Status |
|----------|-------------|--------|
| [community.md](./community.md) | 想法分享、評論系統、學習圈子 | ✅ Complete |
| [tags.md](./tags.md) | 標籤管理系統 | ✅ Complete |
| [mentor.md](./mentor.md) | 導師系統與馬拉松活動 | ✅ Complete |

### Administration

| Document | Description | Status |
|----------|-------------|--------|
| [admin.md](./admin.md) | 管理員後台、角色權限管理 | ✅ Complete |
| [statistics.md](./statistics.md) | 用戶統計分析、DAU/WAU/MAU、留存率 | ✅ Complete |

### Infrastructure & Utilities

| Document | Description | Status |
|----------|-------------|--------|
| [email.md](./email.md) | 郵件系統（模板、批量發送、佇列） | ✅ Complete |
| [quiz.md](./quiz.md) | 學習風格測驗系統 | ✅ Complete |
| [location.md](./location.md) | 城市與國家資料管理 | ✅ Complete |

---

## Quick Navigation

### By Feature Category

#### 用戶與認證
- 註冊、登入、OAuth → [auth.md](./auth.md)
- 個人資料、偏好設定 → [users.md](./users.md)
- 角色與權限 → [admin.md](./admin.md)

#### 學習管理
- 學習專案 CRUD → [projects.md](./projects.md)
- 里程碑與任務 → [projects.md](./projects.md#35-milestone-management)
- 學習筆記與成果 → [projects.md](./projects.md#38-notes-management)
- 學習資源 → [resources.md](./resources.md)
- 資源評價 → [resources.md](./resources.md#35-resource-reviews)

#### 每日實踐
- 實踐計畫 → [practices.md](./practices.md)
- 打卡系統 → [practices.md](./practices.md#33-check-in-system)
- 連續打卡計算 → [practices.md](./practices.md#41-streak-calculation)
- 實踐模板 → [practices.md](./practices.md#36-practice-templates)

#### 社群互動
- 想法分享 → [community.md](./community.md#31-ideas)
- 評論系統 → [community.md](./community.md#33-comments)
- 學習圈子 → [community.md](./community.md#34-groups)
- 按讚收藏 → [community.md](./community.md#32-idea-interactions)

#### 標籤系統
- 標籤管理 → [tags.md](./tags.md)
- 實體標籤關聯 → [tags.md](./tags.md#32-entity-tag-operations)

#### 導師系統
- 馬拉松活動 → [mentor.md](./mentor.md#31-marathon-management)
- 導師-學員配對 → [mentor.md](./mentor.md#34-mentor-assignment)
- 導師評價 → [mentor.md](./mentor.md#35-feedback-system)

#### 管理功能
- 角色管理 → [admin.md](./admin.md#31-role-management)
- 權限管理 → [admin.md](./admin.md#32-permission-management)
- 內容審核 → [admin.md](./admin.md#35-content-moderation)
- 系統監控 → [admin.md](./admin.md#36-system-dashboard--statistics)

#### 用戶統計分析
- 總覽儀表板 → [statistics.md](./statistics.md#31-get-overview-dashboard)
- 註冊統計 → [statistics.md](./statistics.md#32-get-registration-statistics)
- DAU/WAU/MAU → [statistics.md](./statistics.md#34-get-dauwaumau-statistics)
- 裝置分析 → [statistics.md](./statistics.md#35-get-device-analytics)
- 用戶留存率 → [statistics.md](./statistics.md#36-get-retention-statistics)
- 用戶分類 → [statistics.md](./statistics.md#38-get-user-activity-segmentation)
- 數據匯出 → [statistics.md](./statistics.md#39-export-statistics)

#### 郵件系統
- 發送郵件 → [email.md](./email.md#3-api-endpoints)
- 郵件模板 → [email.md](./email.md#22-email-templates)
- 批量發送 → [email.md](./email.md#37-send-bulk-email)
- 郵件統計 → [email.md](./email.md#310-get-email-statistics)
- 服務健康 → [email.md](./email.md#311-check-email-service-health)

#### 測驗系統
- 保存結果 → [quiz.md](./quiz.md#31-save-quiz-result)
- 查詢結果 → [quiz.md](./quiz.md#32-get-latest-quiz-result)
- 結果類型 → [quiz.md](./quiz.md#22-result-types)

#### 地區資料
- 城市查詢 → [location.md](./location.md#31-get-cities)
- 國家列表 → [location.md](./location.md#32-get-countries)
- 城市驗證 → [location.md](./location.md#33-validate-city-code)

---

## API Base URL

```
/api/v1/
```

## Response Format

所有 API 回應遵循標準化格式：

```typescript
// Success
{
  "success": true,
  "data": T,
  "timestamp": "2026-02-05T12:00:00.000Z",
  "meta": { ... }
}

// Error
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": { ... }
  },
  "timestamp": "2026-02-05T12:00:00.000Z"
}

// Paginated
{
  "success": true,
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "totalItems": 100,
    "hasNext": true,
    "hasPrev": false
  },
  "timestamp": "2026-02-05T12:00:00.000Z"
}
```

---

## Development Guidelines

### Adding New Specifications

1. 創建新的 `.md` 文件於 `openspec/specs/` 目錄
2. 遵循現有規格文件的結構模板
3. 更新此索引文件
4. 確保包含以下章節：
   - Overview (概述)
   - Data Models (資料模型)
   - API Endpoints (API 端點)
   - Business Rules (業務規則)
   - Validation Schemas (驗證 Schema)
   - Implementation Files (實作文件)
   - Error Handling (錯誤處理)

### Updating Specifications

1. 更新相應的規格文件
2. 更新 Revision History 章節
3. 如有 API 變更，確保同步更新 OpenAPI 文件
4. 通知相關開發人員

---

## Related Documents

- [CLAUDE.md](../../CLAUDE.md) - 開發指南
- [project.md](../project.md) - 專案概覽
- [config.yaml](../config.yaml) - OpenSpec 配置

---

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.1.0 | 2026-02-06 | System | Added email, statistics, quiz, location specifications |
| 1.0.0 | 2026-02-05 | System | Initial specification index |
