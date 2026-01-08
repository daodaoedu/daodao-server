# Services, Types, and Validators Correspondence Audit

## Overview
此文件檢查 `src/` 底下所有服務與其對應的 types 和 validators，列出需要補充或修正的項目。

## 服務清單與對應狀態

### ✅ 完整對應 (Service + Type + Validator)
以下服務具有完整的三者對應關係：

1. **auth** - 認證服務
   - 服務: `src/services/auth/auth.service.ts`
   - 型別: `src/types/auth.types.ts`
   - 驗證器: `src/validators/auth.validators.ts`

2. **comment** - 留言服務
   - 服務: `src/services/comment.service.ts`
   - 型別: `src/types/comment.types.ts`
   - 驗證器: `src/validators/comment.validators.ts`

3. **email** - 電子郵件服務
   - 服務: `src/services/email/email.service.ts`
   - 型別: `src/types/email.types.ts`
   - 驗證器: `src/validators/email.validators.ts`

4. **idea** - 想法服務
   - 服務: `src/services/idea.service.ts`
   - 型別: `src/types/idea.types.ts`
   - 驗證器: `src/validators/idea.validators.ts`

5. **me** - 個人檔案服務
   - 服務: `src/services/me.service.ts`
   - 型別: `src/types/me.types.ts`
   - 驗證器: `src/validators/me.validators.ts`

6. **mentor** - 導師服務
   - 服務: `src/services/mentor.service.ts`
   - 型別: `src/types/mentor.types.ts`
   - 驗證器: `src/validators/mentor.validators.ts`

7. **note** - 筆記服務
   - 服務: `src/services/note.service.ts`
   - 型別: `src/types/note.types.ts`
   - 驗證器: `src/validators/note.validators.ts`

8. **outcome** - 成果服務
   - 服務: `src/services/outcome.service.ts`
   - 型別: `src/types/outcome.types.ts`
   - 驗證器: `src/validators/outcome.validators.ts`

9. **practice** - 練習服務
   - 服務: `src/services/practice.service.ts`
   - 型別: `src/types/practice.types.ts`
   - 驗證器: `src/validators/practice.validators.ts`

10. **project** - 專案服務
    - 服務: `src/services/project.service.ts`
    - 型別: `src/types/project.types.ts`
    - 驗證器: `src/validators/project.validators.ts`

11. **resource** - 資源服務
    - 服務: `src/services/resource.service.ts`
    - 型別: `src/types/resource.types.ts`
    - 驗證器: `src/validators/resource.validator.ts`

12. **resource-review** - 資源評論服務
    - 服務: `src/services/resource-review.service.ts`
    - 型別: `src/types/resource-review.types.ts`
    - 驗證器: `src/validators/resource-review.validator.ts`

13. **review** - 評論服務
    - 服務: `src/services/review.service.ts`
    - 型別: `src/types/review.types.ts`
    - 驗證器: `src/validators/review.validators.ts`

14. **user** - 使用者服務
    - 服務: `src/services/user.service.ts`
    - 型別: `src/types/user.types.ts`
    - 驗證器: `src/validators/user.validators.ts`

### ⚠️ 缺少 Types 和/或 Validators

15. **milestone** - 里程碑服務
    - ✅ 服務: `src/services/milestone.service.ts`
    - ✅ 型別: `src/types/milestone.types.ts`
    - ❌ 驗證器: **缺少** `src/validators/milestone.validators.ts`

16. **tag** - 標籤服務
    - ✅ 服務: `src/services/tag.service.ts`
    - ❌ 型別: **缺少** `src/types/tag.types.ts`
    - ❌ 驗證器: **缺少** `src/validators/tag.validators.ts`

### ❌ 僅有服務，缺少 Types 和 Validators

17. **id-converter** - ID 轉換服務
    - ✅ 服務: `src/services/id-converter.service.ts`
    - ❌ 型別: **缺少** `src/types/id-converter.types.ts`
    - ❌ 驗證器: **缺少** `src/validators/id-converter.validators.ts`

18. **jwt** - JWT 服務
    - ✅ 服務: `src/services/jwt.service.ts`
    - ❌ 型別: **缺少** `src/types/jwt.types.ts`
    - ❌ 驗證器: **缺少** `src/validators/jwt.validators.ts`

19. **r2** - R2 儲存服務
    - ✅ 服務: `src/services/r2.service.ts`
    - ❌ 型別: **缺少** `src/types/r2.types.ts`
    - ❌ 驗證器: **缺少** `src/validators/r2.validators.ts`

20. **transform** - 轉換服務
    - ✅ 服務: `src/services/transform.service.ts`
    - ✅ 型別: `src/types/transform.types.ts`
    - ❌ 驗證器: **缺少** `src/validators/transform.validators.ts`

### 🔧 Practice 子服務

21. **practice-checkin** - 練習簽到服務
    - ✅ 服務: `src/services/practice-checkin.service.ts`
    - ❌ 型別: **缺少** `src/types/practice-checkin.types.ts`
    - ❌ 驗證器: **缺少** `src/validators/practice-checkin.validators.ts`

22. **practice-event** - 練習事件服務
    - ✅ 服務: `src/services/practice-event.service.ts`
    - ❌ 型別: **缺少** `src/types/practice-event.types.ts`
    - ❌ 驗證器: **缺少** `src/validators/practice-event.validators.ts`

23. **practice-interaction** - 練習互動服務
    - ✅ 服務: `src/services/practice-interaction.service.ts`
    - ❌ 型別: **缺少** `src/types/practice-interaction.types.ts`
    - ❌ 驗證器: **缺少** `src/validators/practice-interaction.validators.ts`

### 🗂️ 系統/基礎設施服務 (通常不需要獨立 Types/Validators)

24. **auth/oauth** - OAuth 服務
    - ✅ 服務: `src/services/auth/oauth.service.ts`
    - ✅ 型別: 使用共享 `auth.types.ts`
    - ✅ 驗證器: 使用共享 `auth.validators.ts`

25. **auth/permission** - 權限服務
    - ✅ 服務: `src/services/auth/permission.service.ts`
    - ✅ 型別: 使用共享 `auth.types.ts`
    - ✅ 驗證器: 使用共享 `auth.validators.ts`

26. **database/mongo** - MongoDB 服務
    - ✅ 服務: `src/services/database/mongo.service.ts`
    - ✅ 型別: 使用 `common.types.ts`
    - ℹ️  驗證器: 基礎設施不需要獨立驗證器

27. **database/postgres** - PostgreSQL 服務
    - ✅ 服務: `src/services/database/postgres.service.ts`
    - ✅ 型別: 使用 `common.types.ts`
    - ℹ️  驗證器: 基礎設施不需要獨立驗證器

28. **database/prisma** - Prisma 服務
    - ✅ 服務: `src/services/database/prisma.service.ts`
    - ✅ 型別: 使用 Prisma 生成類型
    - ℹ️  驗證器: 基礎設施不需要獨立驗證器

29. **database/redis** - Redis 服務
    - ✅ 服務: `src/services/database/redis.service.ts`
    - ✅ 型別: 使用 `common.types.ts`
    - ℹ️  驗證器: 基礎設施不需要獨立驗證器

30. **logging/logger** - 日誌服務
    - ✅ 服務: `src/services/logging/logger.service.ts`
    - ✅ 型別: `src/types/logging.types.ts`
    - ℹ️  驗證器: 系統服務不需要獨立驗證器

### 📧 Email 子服務 (共享 email types)
31. **email/enhanced-email** - 增強電子郵件服務
32. **email/template** - 郵件模板服務
33. **auth/email** - 認證郵件服務

這些服務共享 `email.types.ts` 和 `email.validators.ts`

### 🔍 特殊 Validators (無對應 Service)

34. **api-response** - API 回應驗證器
    - ❌ 服務: 無獨立服務 (系統級別)
    - ✅ 型別: `src/types/api-response.types.ts`
    - ✅ 驗證器: `src/validators/api-response.validators.ts`

35. **image** - 圖像驗證器
    - ❌ 服務: 無獨立服務 (由 controller 直接處理)
    - ✅ 型別: `src/types/image.types.ts`
    - ✅ 驗證器: `src/validators/image.validators.ts`

36. **request-params** - 請求參數驗證器
    - ❌ 服務: 無獨立服務 (通用驗證器)
    - ❌ 型別: 使用泛型類型
    - ✅ 驗證器: `src/validators/request-params.validator.ts`

37. **user-custom-id** - 使用者自訂 ID 驗證器
    - ❌ 服務: 無獨立服務 (user service 的一部分)
    - ❌ 型別: 使用 `user.types.ts`
    - ✅ 驗證器: `src/validators/user-custom-id.validators.ts`

## 🎯 待辦任務清單

### 高優先級 - 核心業務邏輯缺失

1. **創建 milestone.validators.ts**
   - 為 milestone 服務創建驗證器
   - 優先級: **高** (有完整服務和類型)

2. **創建 tag.types.ts 和 tag.validators.ts**
   - 為 tag 服務創建完整的類型定義和驗證器
   - 優先級: **高** (核心功能)

3. **創建 transform.validators.ts**
   - 為 transform 服務創建驗證器
   - 優先級: **中** (已有類型定義)

### 中優先級 - Practice 子服務

4. **Practice 子服務類型和驗證器**
   - 創建 `practice-checkin.types.ts` 和 `practice-checkin.validators.ts`
   - 創建 `practice-event.types.ts` 和 `practice-event.validators.ts`
   - 創建 `practice-interaction.types.ts` 和 `practice-interaction.validators.ts`
   - 優先級: **中** (可能可以整合到主要 practice 類型中)

### 低優先級 - 基礎設施服務

5. **基礎服務類型定義**
   - 創建 `id-converter.types.ts` 和 `id-converter.validators.ts`
   - 創建 `jwt.types.ts` 和 `jwt.validators.ts`
   - 創建 `r2.types.ts` 和 `r2.validators.ts`
   - 優先級: **低** (基礎設施服務，可能不需要複雜驗證)

### 🔍 檢查項目

6. **驗證現有對應關係**
   - 檢查現有 types 和 validators 是否實際被對應的 services 使用
   - 檢查是否有未使用的類型定義或驗證器
   - 檢查類型定義是否與實際服務邏輯一致

7. **命名一致性檢查**
   - 注意 `resource.validator.ts` vs `resource-review.validator.ts` 命名不一致
   - 建議統一使用 `.validators.ts` 後綴

## 📊 統計摘要

- **總服務數**: 37 (包含子服務)
- **完整對應 (Service + Type + Validator)**: 14
- **部分缺失**: 8
- **僅有服務**: 4
- **Practice 子服務**: 3
- **基礎設施/系統服務**: 8 (通常不需要獨立驗證器)

## 建議執行順序

1. 先處理高優先級的 milestone 和 tag 服務
2. 再處理 transform 和 practice 子服務
3. 最後評估基礎設施服務是否真的需要獨立的類型和驗證器
4. 進行命名一致性統一
5. 進行使用情況審查，清理未使用的定義

---
*此文件由 Claude Code 自動生成於 2025-09-04*