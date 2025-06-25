# Model-Schema 比較分析報告

## 概述

本文件分析了 DaoDao 專案中 SQL 資料庫 schema（`init-scripts/`）與現有 Sequelize 模型定義之間的差異。專案採用**混合式 JavaScript/TypeScript 架構**，正在從傳統 JavaScript 模型逐步遷移到現代 TypeScript 實作。

## 架構概況

### 資料庫架構
- **資料庫**: PostgreSQL (localhost:5423)
- **總表格數**: 62 張表格
- **自定義類型**: 15+ 個 ENUM 類型
- **關聯複雜度**: 高度相互關聯的多實體系統

### 模型架構
1. **傳統 JavaScript 模型** (`/models/`) - 26 個檔案
2. **現代 TypeScript 模型** (`/src/models/`) - 6 個檔案  
3. **模型橋接系統** (`/src/utils/model-bridge.ts`)

## 主要實體比較分析

### 用戶管理系統

| 項目 | SQL Schema | JavaScript Model | TypeScript Model | 狀態 |
|------|------------|------------------|------------------|------|
| users | ✅ 完整 | ✅ `user.js` | ❌ 缺失 | **不一致** |
| user_profiles | ✅ 完整 | ❌ 缺失 | ❌ 缺失 | **缺失模型** |
| contacts | ✅ 完整 | ✅ `contact.js` | ❌ 缺失 | **部分實作** |
| basic_info | ✅ 完整 | ✅ `basicInfo.js` | ❌ 缺失 | **部分實作** |
| temp_users | ✅ 完整 | ✅ `tempUser.js` | ❌ 缺失 | **部分實作** |

**關鍵問題:**
- **資料類型不匹配**: SQL 使用 `gender_t`, `education_stage_t` 自定義類型，JS 模型使用 `STRING`
- **欄位缺失**: SQL schema 的 `createdDate`/`updatedDate` 欄位在 Sequelize 模型中缺失
- **重要模型缺失**: `user_profiles` 表格沒有對應的 Sequelize 模型

### 專案管理系統

| 項目 | SQL Schema | JavaScript Model | TypeScript Model | 狀態 |
|------|------------|------------------|------------------|------|
| project | ✅ 完整 | ✅ `project.js` | ❌ 缺失 | **資料類型問題** |
| milestone | ✅ 完整 | ✅ `milestone.js` | ❌ 缺失 | **部分實作** |
| task | ✅ 完整 | ✅ `task.js` | ❌ 缺失 | **部分實作** |
| user_project | ✅ 完整 | ✅ `userProject.js` | ❌ 缺失 | **部分實作** |

**關鍵問題:**
- **複雜陣列類型**: SQL 使用 `motivation_t[]`, `strategy_t[]`, `outcome_t[]`，模型驗證不完整
- **索引定義缺失**: JavaScript 模型缺少 SQL schema 中定義的複合索引

### 群組與社群功能

| 項目 | SQL Schema | JavaScript Model | TypeScript Model | 狀態 |
|------|------------|------------------|------------------|------|
| groups | ✅ 完整 | ✅ `circle.js` | ❌ 缺失 | **命名不一致** |
| user_join_group | ✅ 完整 | ❌ 缺失 | ❌ 缺失 | **缺失模型** |

**關鍵問題:**
- **命名不一致**: JavaScript 模型名為 `Circle`，但對應 `groups` 表格
- **自定義類型**: SQL 使用 `group_category_t`, `group_type_t`，模型使用 `ARRAY(STRING)`

### 學習資源系統

| 項目 | SQL Schema | JavaScript Model | TypeScript Model | 狀態 |
|------|------------|------------------|------------------|------|
| resources | ✅ 完整 | ❌ 缺失 | ✅ `resource.ts` | **良好實作** |
| resource_review | ✅ 完整 | ❌ 缺失 | ✅ `resource-review.ts` | **良好實作** |
| categories | ✅ 完整 | ❌ 缺失 | ✅ `category.ts` | **良好實作** |
| tags | ✅ 完整 | ❌ 缺失 | ✅ `tag.ts` | **良好實作** |
| entity_tags | ✅ 完整 | ❌ 缺失 | ✅ `entity-tag.ts` | **良好實作** |

**狀態**: 資源系統是 TypeScript 遷移最完整的模組，驗證規則與 SQL 約束高度一致。

### 馬拉松活動系統

| 項目 | SQL Schema | JavaScript Model | TypeScript Model | 狀態 |
|------|------------|------------------|------------------|------|
| marathon | ✅ 完整 | ✅ `marathon.js` | ❌ 缺失 | **僅 JS 實作** |
| project_marathon | ✅ 完整 | ✅ `projectMarathon.js` | ❌ 缺失 | **僅 JS 實作** |
| mentor_participants | ✅ 完整 | ✅ `mentorParticipants.js` | ❌ 缺失 | **僅 JS 實作** |
| eligibility | ✅ 完整 | ✅ `eligibility.js` | ❌ 缺失 | **僅 JS 實作** |

## 互動與分析系統

### 缺失的重要模型

以下 SQL 表格完全沒有對應的 Sequelize 模型：

**社交互動表格:**
- `reaction` - 通用反應系統
- `favorite` - 收藏功能  
- `view` - 瀏覽追蹤
- `share` - 分享功能
- `click` - 點擊追蹤
- `like` - 點讚功能

**評分分析表格:**
- `rating` - 整體評分
- `rating_detail` - 詳細評分
- `ai_review_feedbacks` - AI 回饋

**偏好設定表格:**
- `preference_types` - 偏好類型
- `preference_options` - 偏好選項
- `user_preferences` - 用戶偏好

**訂閱與商店:**
- `user_subscription` - 用戶訂閱
- `subscription_plan` - 訂閱方案
- `store` - 應用商店

## 關鍵技術問題

### 1. 資料類型不匹配

**SQL Schema 自定義類型 vs Sequelize 基本類型:**

```sql
-- SQL Schema
CREATE TYPE "gender_t" AS ENUM ('male', 'female', 'other');
CREATE TYPE "education_stage_t" AS ENUM ('university', 'high', 'other');
```

```javascript
// JavaScript Model
gender: {
  type: DataTypes.STRING,  // ❌ 應該使用 ENUM
  allowNull: true
}
```

### 2. 陣列類型驗證問題

**SQL Schema:**
```sql
motivation motivation_t[] DEFAULT '{}',
strategy strategy_t[] DEFAULT '{}',
outcome outcome_t[] DEFAULT '{}'
```

**JavaScript Model:**
```javascript
motivation: {
  type: DataTypes.ARRAY(DataTypes.STRING),  // ❌ 缺少 ENUM 驗證
  defaultValue: []
}
```

### 3. 軟刪除實作不一致

**SQL Schema 問題:**
```sql
deleted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP  -- ❌ 錯誤預設值
```

**應該是:**
```sql
deleted_at TIMESTAMPTZ DEFAULT NULL
```

### 4. 索引定義缺失

大部分 JavaScript 模型缺少 SQL schema 中定義的索引：

```sql
-- SQL Schema
CREATE INDEX idx_users_external_id ON users(external_id);
CREATE INDEX idx_users_role_id ON users(role_id);
```

```javascript
// JavaScript Model - 缺少索引定義
// 應該在 model 中加入:
indexes: [
  { fields: ['external_id'] },
  { fields: ['role_id'] }
]
```

## 命名規範不一致

### 檔案命名
- **JavaScript**: camelCase (`userProject.js`)
- **TypeScript**: kebab-case (`resource-review.ts`)
- **建議**: 統一使用 kebab-case

### 模型與表格命名
- `Circle` 模型 → `groups` 表格
- `ideaResource` 模型 → 對應關係不明確

## 關聯關係分析

### 現有關聯定義

**JavaScript 模型關聯 (部分):**
```javascript
User.hasMany(Project, { foreignKey: 'user_id' });
Project.belongsTo(User, { foreignKey: 'user_id' });
User.belongsToMany(Role, { through: UserRole });
```

**SQL Foreign Key 約束:**
```sql
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL
```

**問題**: 
- CASCADE 行為在 Sequelize 關聯中未正確定義
- 部分 SQL 外鍵約束在模型中缺失

## 優先修復建議

### 高優先級 (立即修復)

1. **修復軟刪除預設值**
   ```sql
   -- 修復所有 deleted_at 欄位
   ALTER TABLE users ALTER COLUMN deleted_at SET DEFAULT NULL;
   ```

2. **統一資料類型定義**
   - 將 `gender_t`, `education_stage_t` 等自定義類型正確映射到 Sequelize ENUM
   - 修復陣列類型的 ENUM 驗證

3. **補充缺失的關鍵模型**
   - `user_profiles` - 用戶檔案系統
   - `user_subscription` - 訂閱系統
   - `reaction`, `favorite` - 核心互動功能

### 中優先級 (逐步改進)

1. **完善索引定義**
   - 在 JavaScript 模型中加入所有 SQL 索引
   - 確保查詢效能一致性

2. **標準化命名規範**
   - 統一檔案命名格式
   - 修正模型名稱與表格名稱的對應

3. **加強關聯關係**
   - 補充缺失的外鍵關聯
   - 正確設定 CASCADE 行為

### 低優先級 (長期規劃)

1. **完成 TypeScript 遷移**
   - 將核心業務模型 (User, Project, Group) 遷移到 TypeScript
   - 建立完整的類型安全

2. **模型橋接系統優化**
   - 改進 model-bridge.ts 以支援所有模型
   - 實現無縫的 JS/TS 模型互操作

## 遷移路徑建議

### Phase 1: 修復現有問題
- 修復 SQL schema 的預設值問題
- 補充缺失的核心模型 (user_profiles, 互動系統)
- 統一資料類型定義

### Phase 2: 完善功能
- 實作所有互動與分析模型
- 加強關聯關係和索引
- 標準化命名規範

### Phase 3: 現代化
- 將核心模型遷移到 TypeScript
- 建立完整的類型系統
- 優化模型橋接機制

## 結論

DaoDao 專案的資料庫 schema 設計相當完整和先進，但模型層的實作存在顯著的一致性問題。主要挑戰包括：

1. **雙系統並存**: JavaScript 和 TypeScript 模型需要更好的整合
2. **完整性差距**: 許多 SQL 表格缺少對應的 Sequelize 模型
3. **類型安全**: 自定義 ENUM 類型的映射需要改進
4. **效能考量**: 索引定義需要在模型層同步

建議優先修復資料一致性問題，然後逐步完善模型覆蓋範圍，最終實現完整的 TypeScript 遷移。這將大幅提升開發效率和系統穩定性。