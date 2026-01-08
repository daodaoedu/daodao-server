# SQL 文件組織管理指南

## 目前狀況
您的專案現在有完整的資料庫初始化腳本：
```
init-scripts/
├── 000_create_extension_pgcrypto.sql           # PostgreSQL 擴展
├── 010_create_types.sql                        # 資料類型定義
├── 020-490_create_table_*.sql                  # 主要業務表格 (56個檔案)
├── 500-560_create_table_*preferences*.sql      # 偏好設定相關表格
├── 900_create_function_*.sql                   # 自定義函數
├── 997-999_insert_*_data.sql                   # 初始資料
└── (總計 62個 SQL 檔案)
```

### 表格組織分類：
- **000-090**: 基礎設定 (擴展、類型、角色、權限、位置資訊)
- **100-170**: 用戶管理 (聯絡資訊、基本資料、用戶檔案、訂閱)
- **180-200**: 群組與商店
- **210-290**: 專案管理 (專案、里程碑、任務、貼文、成果、筆記、評論)
- **300-330**: 馬拉松活動 (資格、馬拉松、專案關聯、導師參與)
- **340-430**: 互動功能 (反應、收藏、瀏覽、分享、點擊、評分、AI回饋、點讚)
- **490-560**: 分類與偏好設定 (分類、偏好類型、選項、用戶偏好、資源、標籤)
- **900+**: 函數與資料 (自定義函數、初始資料)

## 建議的文件組織結構

### 方案一：擴展現有結構（簡單易懂）
```
database/
├── schema/                    # 資料庫結構定義
│   ├── 01-types-enums.sql    # 類型和枚舉定義
│   ├── 02-core-tables.sql    # 核心表格 (users, roles, permissions)
│   ├── 03-business-tables.sql # 業務表格 (projects, marathons)
│   ├── 04-relation-tables.sql # 關聯表格
│   └── 05-indexes-constraints.sql # 索引和約束
├── data/                     # 初始數據
│   ├── master-data.sql       # 主數據 (roles, permissions, positions)
│   ├── test-data.sql         # 測試數據
│   └── demo-data.sql         # 演示數據
├── updates/                  # 資料庫更新腳本
│   ├── 2024/
│   │   ├── 2024-01-15-add-resource-tables.sql
│   │   ├── 2024-02-01-update-user-constraints.sql
│   │   └── 2024-02-15-add-new-indexes.sql
│   └── archive/              # 已應用的更新
└── procedures/               # 存儲過程和函數
    ├── functions/
    └── triggers/
```

### 方案二：按環境分離
```
database/
├── environments/
│   ├── development/
│   │   ├── schema/
│   │   ├── data/
│   │   └── config/
│   ├── staging/
│   │   ├── schema/
│   │   ├── data/
│   │   └── config/
│   └── production/
│       ├── schema/
│       ├── data/
│       └── config/
├── shared/                   # 共用腳本
│   ├── functions/
│   ├── types/
│   └── base-schema/
└── migrations/               # 版本控制更新
```

### 方案三：模組化組織（推薦給大型專案）
```
database/
├── modules/                  # 按功能模組分組
│   ├── auth/                # 認證授權相關
│   │   ├── schema.sql
│   │   ├── data.sql
│   │   └── procedures.sql
│   ├── user-management/     # 用戶管理
│   │   ├── schema.sql
│   │   ├── data.sql
│   │   └── indexes.sql
│   ├── projects/            # 專案相關
│   │   ├── schema.sql
│   │   ├── data.sql
│   │   └── views.sql
│   └── marathons/           # 馬拉松活動
│       ├── schema.sql
│       ├── data.sql
│       └── triggers.sql
├── core/                    # 核心系統腳本
│   ├── types-enums.sql
│   ├── base-functions.sql
│   └── system-config.sql
└── deployment/              # 部署相關
    ├── install.sql          # 完整安裝腳本
    ├── upgrade.sql          # 升級腳本
    └── rollback.sql         # 回滾腳本
```

## 業界常見做法

### 1. Migration-based（主流做法）
大多數現代框架採用的方式：
- **Laravel**: `database/migrations/`
- **Rails**: `db/migrate/`
- **Django**: `app/migrations/`
- **Sequelize**: `migrations/`

特點：
- 每個變更都有版本號
- 可以向前和向後遷移
- 適合團隊協作

### 2. Schema-first（傳統做法）
- **優點**: 結構清晰，易於理解
- **缺點**: 版本控制較困難
- **適用**: 小型專案或個人開發

### 3. Hybrid approach（混合做法）
結合兩種方式的優點：
- 用 schema 文件維護完整結構
- 用 migration 文件記錄變更歷史

## 針對您專案的具體建議

### 推薦：保持現有數字編號系統（最適合您的專案）
您的現有結構已經非常好，建議維持並優化：

```
init-scripts/                # 保持現有結構
├── 000-099/               # 基礎設定模組
│   ├── 000_create_extension_pgcrypto.sql
│   ├── 010_create_types.sql
│   ├── 020_create_table_roles.sql
│   └── ...
├── 100-199/               # 用戶管理模組  
│   ├── 100_create_table_contacts.sql
│   ├── 110_create_table_basic_info.sql
│   └── ...
├── 200-299/               # 專案管理模組
│   ├── 200_create_table_store.sql
│   ├── 210_create_table_project.sql
│   └── ...
├── 300-399/               # 馬拉松活動模組
│   ├── 300_create_table_eligibility.sql
│   ├── 310_create_table_marathon.sql
│   └── ...
├── 400-499/               # 互動功能模組
│   ├── 400_create_table_rating_detail.sql
│   ├── 410_create_table_ai_review_feedbacks.sql
│   └── ...
├── 500-599/               # 偏好與分類模組
│   ├── 490_create_table_categories.sql
│   ├── 500_create_table_preference_types.sql
│   └── ...
├── 900-999/               # 函數與資料
│   ├── 900_create_function_get_project_milestone_dates.sql
│   ├── 997_insert_preferences_data.sql
│   ├── 998_insert_categories_data.sql
│   └── 999_insert_data.sql
└── updates/               # 未來更新
    └── 2024/
        └── (future updates)
```

### 優化步驟（可選）
1. **保持現有結構**：您的數字編號系統已經很完善
2. **新增模組化資料夾**：可以按功能分組檔案（但不強制）
3. **新增 updates/ 資料夾**：用於未來的資料庫更新
4. **改進命名**：確保所有檔案都遵循 `XXX_create_table_name.sql` 格式

### 檔案編號規則（基於現有結構）
- **000-099**: 基礎設定與類型
- **100-199**: 用戶相關表格
- **200-299**: 專案與商店
- **300-399**: 馬拉松活動
- **400-489**: 互動功能
- **490-599**: 分類與偏好
- **600-899**: 預留給未來功能
- **900-996**: 函數與觸發器
- **997-999**: 初始資料

### 命名規範（基於現有模式）
- **表格檔案**：`XXX_create_table_name.sql` (如: `120_create_table_users.sql`)
- **函數檔案**：`XXX_create_function_name.sql` (如: `900_create_function_get_project_milestone_dates.sql`)
- **資料檔案**：`XXX_insert_description_data.sql` (如: `999_insert_data.sql`)
- **更新檔案**：`YYYY-MM-DD-description.sql` (如: `2024-06-22-add-column.sql`)
- **數字編號**：三位數字，確保排序正確 (000, 010, 020...)

## 同步更新最佳實踐

### 1. 版本控制
- 每次資料庫變更都要建立新的 SQL 文件
- 不要修改已經套用的舊文件
- 使用 Git 追蹤所有 SQL 文件變更

### 2. 環境管理
- 開發環境：可以直接修改和測試
- 測試環境：先應用並驗證
- 生產環境：確認無誤後才應用

### 3. 備份策略
- 每次更新前先備份資料庫
- 保留回滾腳本
- 記錄每次更新的影響範圍

### 4. 文件組織原則
- **按功能分組**：相關的表格放在同一個文件
- **按順序命名**：確保載入順序正確
- **清楚註解**：每個文件都要有用途說明
- **測試腳本**：提供驗證腳本確認更新成功

這樣的組織方式既保持了您現有的工作習慣，也符合業界標準，方便未來擴展和團隊協作。

---

# 詳細使用教學

## 第一步：了解現狀
您目前的檔案結構已經非常完整：
```
您的專案/
└── init-scripts/
    ├── 000_create_extension_pgcrypto.sql      # PostgreSQL 加密擴展
    ├── 010_create_types.sql                   # 資料類型定義
    ├── 020-490_create_table_*.sql             # 主要業務表格 (56個)
    ├── 500-560_create_table_*preferences*.sql # 偏好設定表格
    ├── 900_create_function_*.sql               # 自定義函數
    └── 997-999_insert_*_data.sql              # 初始資料
```

## 第二步：建議的優化措施（可選）

### 選項A：保持現有結構（推薦）
您的現有結構已經很好，只需要：
```bash
mkdir -p init-scripts/updates/2024
```

### 選項B：新增模組化資料夾
如果想要更好的組織，可以建立：
```bash
mkdir -p init-scripts/modules/auth        # 認證相關
mkdir -p init-scripts/modules/user        # 用戶管理
mkdir -p init-scripts/modules/project     # 專案管理
mkdir -p init-scripts/modules/marathon    # 馬拉松活動
mkdir -p init-scripts/modules/interaction # 互動功能
mkdir -p init-scripts/modules/preferences # 偏好設定
mkdir -p init-scripts/updates/2024        # 未來更新
```

## 第三步：了解現有檔案分類

### 3.1 您的檔案已經按功能模組組織好了：

**基礎設定模組 (000-090)**
- `000_create_extension_pgcrypto.sql` - PostgreSQL 加密擴展
- `010_create_types.sql` - 資料類型定義
- `020-090_*` - 角色、權限、位置、國家、城市等基礎資料

**用戶管理模組 (100-170)**
- `100-110_*` - 聯絡資訊、基本資料
- `120-170_*` - 用戶、職位、權限、檔案、訂閱

**業務功能模組 (180-290)**
- `180-200_*` - 群組、商店
- `210-290_*` - 專案、里程碑、任務、貼文、成果、筆記、評論

**馬拉松活動模組 (300-330)**
- `300-330_*` - 資格、馬拉松、專案關聯、導師參與

**互動功能模組 (340-430)**
- `340-430_*` - 反應、收藏、瀏覽、分享、點擊、評分、AI回饋、點讚

**分類與偏好模組 (490-560)**
- `490-560_*` - 分類、偏好類型、選項、用戶偏好、資源、標籤

**函數與資料模組 (900-999)**
- `900_*` - 自定義函數
- `997-999_*` - 初始資料

### 3.2 您的結構已經很完善
不需要大幅重組，只需要：
1. 繼續使用現有的數字編號系統
2. 新功能按照編號規則加入對應區間
3. 資料庫更新放在 `updates/` 資料夾

## 第四步：新增功能的實際操作

### 情境：要新增通知系統功能

**按照現有編號系統：**

1. **確定編號區間**
通知系統屬於新功能，可以使用 `600-699` 區間：
- `600_create_table_notifications.sql` - 通知主表
- `610_create_table_notification_types.sql` - 通知類型
- `620_create_table_user_notification_settings.sql` - 用戶通知設定

2. **建立新表格檔案**
```sql
-- init-scripts/600_create_table_notifications.sql

CREATE TABLE "notifications" (
    "id" SERIAL PRIMARY KEY,
    "user_id" INTEGER NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT,
    "is_read" BOOLEAN DEFAULT FALSE,
    "created_at" TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE INDEX idx_notifications_user_id ON "notifications"("user_id");
CREATE INDEX idx_notifications_is_read ON "notifications"("is_read");
```

3. **如果是現有功能的修改**
```sql
-- init-scripts/updates/2024/2024-06-22-add-notification-read-time.sql

-- 為通知表格新增讀取時間欄位
ALTER TABLE "notifications" 
ADD COLUMN "read_at" TIMESTAMP;

-- 新增索引
CREATE INDEX idx_notifications_read_at ON "notifications"("read_at");
```

## 第五步：日常使用流程

### 當您需要修改資料庫時：

**1. 小修改（加欄位、加索引）**
```bash
# 建立新的更新檔案
touch database/updates/2024/2024-06-22-add-user-phone-column.sql
```

在檔案中寫入：
```sql
-- database/updates/2024/2024-06-22-add-user-phone-column.sql
-- 為用戶表格新增電話欄位

ALTER TABLE "users" 
ADD COLUMN "phone" VARCHAR(20);

-- 新增索引（如果需要）
CREATE INDEX idx_users_phone ON "users"("phone");
```

**2. 大修改（新功能模組）**
```bash
# 如果是全新功能，可以考慮建立專門資料夾
mkdir database/modules/notifications
```

**3. 資料更新**
```bash
# 純資料更新（不改結構）
touch database/updates/2024/2024-06-22-update-role-descriptions.sql
```

**4. 應用更新**
```bash
# 連接到資料庫執行
psql -h localhost -U daodao -d daodao -f database/updates/2024/2024-06-22-add-user-phone-column.sql
```

## 第六步：團隊協作建議

### 6.1 檔案命名規則
```
日期-簡短描述.sql
範例：
2024-06-22-add-user-phone.sql          ✅ 好
2024-06-22-update-database.sql         ❌ 太模糊
user-phone.sql                         ❌ 沒日期
20240622-add-user-phone-column.sql     ✅ 也可以
```

### 6.2 每次更新都要做的事
1. **建立新檔案**（不要改舊檔案）
2. **寫清楚註解**（這個更新做什麼）
3. **測試檔案**（確保語法正確）
4. **備份資料庫**（萬一出錯可以還原）
5. **記錄影響**（哪些表格被影響）

### 6.3 錯誤處理
如果更新失敗：
```sql
-- 準備回滾腳本
-- database/updates/2024/2024-06-22-rollback-user-phone.sql
ALTER TABLE "users" DROP COLUMN "phone";
DROP INDEX IF EXISTS idx_users_phone;
```

## 第七步：實際範例演示

### 完整範例：新增文章收藏功能

**1. 分析需求**
- 用戶可以收藏文章
- 需要記錄收藏時間
- 一個用戶不能重複收藏同一篇文章

**2. 建立更新檔案**
```sql
-- database/updates/2024/2024-06-22-add-article-favorites.sql

-- 建立文章收藏表格
CREATE TABLE "article_favorites" (
    "id" SERIAL PRIMARY KEY,
    "user_id" INTEGER NOT NULL,
    "article_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP DEFAULT NOW(),
    
    -- 外鍵約束
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
    FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE,
    
    -- 唯一約束（避免重複收藏）
    UNIQUE("user_id", "article_id")
);

-- 建立索引（提升查詢效能）
CREATE INDEX idx_article_favorites_user_id ON "article_favorites"("user_id");
CREATE INDEX idx_article_favorites_article_id ON "article_favorites"("article_id");
CREATE INDEX idx_article_favorites_created_at ON "article_favorites"("created_at");

-- 建立查詢視圖（方便後續使用）
CREATE VIEW "user_favorite_articles" AS
SELECT 
    af.user_id,
    af.article_id,
    af.created_at as favorited_at,
    a.title as article_title,
    a.author_id
FROM "article_favorites" af
JOIN "articles" a ON af.article_id = a.id;
```

**3. 建立測試資料**
```sql
-- database/updates/2024/2024-06-22-test-article-favorites.sql

-- 測試資料（僅用於開發環境）
INSERT INTO "article_favorites" ("user_id", "article_id") VALUES
(1, 1),  -- 用戶1收藏文章1
(1, 2),  -- 用戶1收藏文章2  
(2, 1);  -- 用戶2收藏文章1

-- 測試查詢
SELECT * FROM "user_favorite_articles" WHERE user_id = 1;
```

**4. 建立回滾腳本**
```sql
-- database/updates/2024/2024-06-22-rollback-article-favorites.sql

-- 刪除視圖
DROP VIEW IF EXISTS "user_favorite_articles";

-- 刪除表格
DROP TABLE IF EXISTS "article_favorites";
```

**5. 更新記錄**
```markdown
-- database/updates/2024/CHANGELOG.md

## 2024-06-22 新增文章收藏功能

### 新增檔案
- `2024-06-22-add-article-favorites.sql` - 主要更新
- `2024-06-22-test-article-favorites.sql` - 測試資料  
- `2024-06-22-rollback-article-favorites.sql` - 回滾腳本

### 變更內容
- 新增 `article_favorites` 表格
- 新增 `user_favorite_articles` 視圖
- 新增相關索引和約束

### 執行順序
1. 先執行主要更新檔案
2. （開發環境）執行測試資料檔案
3. 如有問題，執行回滾腳本

### 注意事項
- 需要確保 `users` 和 `articles` 表格存在
- 此功能會增加資料庫儲存空間需求
```

這樣您就有了一套完整、易懂、好維護的 SQL 檔案管理系統！