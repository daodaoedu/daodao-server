# User API 測試腳本說明

本目錄包含用於測試 **feat/update-user-create-flow** 分支新增用戶功能的測試腳本。

## 新增功能概覽

此分支主要新增了以下用戶欄位和功能:

### 1. 新增用戶欄位

| 欄位名稱 | 類型 | 說明 | 範例 |
|---------|------|------|------|
| `professionalField` | string (enum) | ESCO 專業領域分類 | `information_and_communication_technologies_icts` |
| `personalSlogan` | string (max 200) | 個人標語/座右銘 | "終身學習者,用科技改變教育" |
| `referralSource` | string | 資訊來源 (如何得知島島阿學) | `instagram`, `friend_referral` 等 |
| `customId` | string (3-50字) | 自訂用戶 ID | `my_awesome_id` |
| `interestList` | string[] (max 5) | 興趣清單 (category names) | `["education_learning", "tech"]` |

### 2. customId 功能

- ✅ 創建用戶時可設置 customId
- ✅ 檢查 customId 可用性: `GET /api/users/custom-id/:customId/availability`
- ✅ 設置 customId: `POST /api/me/custom-id`
- ✅ 通過 customId 查詢用戶: `GET /api/users/custom-id/:customId`
- ✅ 移除 customId: `DELETE /api/me/custom-id`

**格式要求:**
- 長度: 3-50 個字元
- 允許字元: 英文字母、數字、底線(`_`)、連字符(`-`)
- 不可以底線或連字符開頭/結尾
- 範例: `john_doe`, `user123`, `my-custom-id`

### 3. 專業領域選項 (professionalField)

根據 ESCO (European Skills, Competences, Qualifications and Occupations) 分類:

```javascript
[
  'information_and_communication_technologies_icts',  // 資訊與通訊技術
  'business_administration_and_law',                  // 商業、行政與法律
  'arts_and_humanities',                              // 藝術與人文
  'natural_sciences_mathematics_and_statistics',      // 自然科學、數學與統計
  'engineering_manufacturing_and_construction',       // 工程、製造與營造
  'health_and_welfare',                               // 健康與福祉
  'education',                                        // 教育
  'social_sciences_journalism_and_information',       // 社會科學、新聞與資訊
  'language_skills_and_knowledge',                    // 語言技能與知識
  'services',                                         // 服務
  'agriculture_forestry_fisheries_and_veterinary',    // 農業、林業、漁業與獸醫
  'others',                                           // 其他
]
```

### 4. 資訊來源選項 (referralSource)

```javascript
[
  'instagram',        // Instagram
  'facebook',         // Facebook
  'discord',          // Discord
  'linkedin',         // LinkedIn
  'friend_referral',  // 朋友介紹
  'others',           // 其他 (可自定義輸入)
]
```

### 5. 興趣管理 (interestList)

- 接受 category names 陣列
- 最多 5 個興趣
- 儲存在 `user_interests` 關聯表中
- 返回時也是 category names 陣列

---

## 測試腳本使用方式

### 方式 1: Bash 腳本 (推薦用於快速測試)

```bash
# 給予執行權限
chmod +x scripts/test-user-api.sh

# 執行測試
./scripts/test-user-api.sh

# 自訂 API URL
API_BASE_URL=https://api.daodao.com ./scripts/test-user-api.sh
```

**注意:** 需要安裝 `jq` 工具
```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq
```

### 方式 2: Node.js 腳本 (推薦用於完整測試)

```bash
# 安裝依賴
npm install axios

# 方式 A: 使用已有的 token (推薦)
AUTH_TOKEN=your_token_here node scripts/test-user-api-simple.js

# 方式 B: 測試創建新用戶流程 (需要先有臨時用戶)
node scripts/test-user-api-simple.js

# 自訂 API URL
API_BASE_URL=https://api.daodao.com AUTH_TOKEN=your_token node scripts/test-user-api-simple.js
```

---

## 測試案例說明

### 1. 獲取可用偏好選項
```bash
GET /api/users/preferences/available
```
返回系統中所有可用的偏好設定類型和選項。

### 2. 創建用戶 (包含新欄位)
```bash
POST /api/users
Authorization: Bearer <temp_user_token>

{
  "gender": "male",
  "birthDate": "1995-06-15",
  "educationStage": "university",
  "location": "台北市",
  "roleList": ["工程師", "學生"],
  "selfIntroduction": "我是一名軟體工程師...",

  // 新增欄位
  "professionalField": "information_and_communication_technologies_icts",
  "personalSlogan": "終身學習者,用科技改變教育",
  "referralSource": "instagram",
  "customId": "my_awesome_id",
  "interestList": ["information_and_computer_science", "education_learning"],

  "preferences": {
    "learningStyle": ["hands_on", "theoretical"],
    "contentType": ["video", "article"]
  },

  "contactList": {
    "instagram": "@test_user",
    "discord": "TestUser#1234"
  }
}
```

### 3. 獲取當前用戶
```bash
GET /api/me
Authorization: Bearer <token>
```
返回包含所有新欄位的用戶資料。

### 4. 更新用戶資料
```bash
PUT /api/me
Authorization: Bearer <token>

{
  "personalSlogan": "更新後的標語",
  "professionalField": "education",
  "interestList": ["education_learning", "arts_and_design"],
  "referralSource": "friend_referral"
}
```

### 5. CustomId 功能測試

#### 5.1 檢查可用性
```bash
GET /api/users/custom-id/my_awesome_id/availability

Response:
{
  "success": true,
  "data": {
    "available": true
  }
}
```

#### 5.2 設置 customId
```bash
POST /api/me/custom-id
Authorization: Bearer <token>

{
  "customId": "my_awesome_id"
}
```

#### 5.3 通過 customId 查詢用戶
```bash
GET /api/users/custom-id/my_awesome_id

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "用戶名",
    "customId": "my_awesome_id",
    "customIdVerified": true,
    ...
  }
}
```

#### 5.4 移除 customId
```bash
DELETE /api/me/custom-id
Authorization: Bearer <token>
```

### 6. 用戶列表與搜尋
```bash
# 基本列表
GET /api/users?page=1&pageSize=10

# 進階搜尋
GET /api/users?page=1&pageSize=10&educationStage=university&location=台北市&search=工程師
```

### 7. 通過 ID 獲取用戶
```bash
GET /api/users/:userId
```

### 8. 偏好設定管理

#### 8.1 獲取用戶偏好
```bash
GET /api/me/preferences
Authorization: Bearer <token>
```

#### 8.2 更新用戶偏好
```bash
PUT /api/me/preferences
Authorization: Bearer <token>

{
  "preferences": [
    {
      "preferenceTypeId": 1,
      "optionId": 1,
      "isSelected": true
    },
    {
      "preferenceTypeId": 1,
      "optionId": 2,
      "isSelected": true
    }
  ]
}
```

### 9. 欄位驗證測試

測試腳本會自動測試以下驗證規則:

- ❌ 無效的 professionalField 值
- ❌ 超過 200 字的 personalSlogan
- ❌ 超過 5 個的 interestList
- ❌ 無效格式的 customId (如 `___invalid___`)

---

## 資料庫結構變更

### 新增欄位 (users 表)

```sql
ALTER TABLE users
  ADD COLUMN professional_field VARCHAR(100),
  ADD COLUMN personal_slogan VARCHAR(200),
  ADD COLUMN referral_source VARCHAR(100),
  ADD COLUMN custom_id VARCHAR(50) UNIQUE,
  ADD COLUMN custom_id_verified BOOLEAN DEFAULT false,
  ADD COLUMN custom_id_created_at TIMESTAMPTZ;
```

### user_interests 關聯表

```sql
-- 儲存用戶興趣 (關聯到 categories 表)
CREATE TABLE user_interests (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  category_id INT REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category_id)
);
```

---

## 常見問題

### Q1: 如何獲取測試用的 token?

**方式 1: 通過前端登入**
1. 前端使用 Google OAuth 登入
2. 從 localStorage 或 cookies 中複製 token

**方式 2: 使用 Postman**
1. 呼叫 `POST /api/auth/google` 端點
2. 提供 Google OAuth token
3. 獲取臨時用戶 token

### Q2: customId 格式要求是什麼?

- 長度: 3-50 個字元
- 允許字元: `a-z`, `A-Z`, `0-9`, `_`, `-`
- 不可以 `_` 或 `-` 開頭/結尾
- 範例: ✅ `john_doe` ✅ `user123` ❌ `_invalid` ❌ `user@123`

### Q3: 創建用戶時 customId 是必填的嗎?

不是必填的。customId 是可選欄位,可以:
1. 創建用戶時設置
2. 創建後通過 `POST /api/me/custom-id` 設置
3. 完全不設置 (使用預設的 UUID)

### Q4: interestList 和 tagList 有什麼區別?

- **interestList**: 結構化的興趣分類,關聯到 `categories` 表,最多 5 個
- **tagList**: 自由標籤,可以是任意字串陣列

### Q5: 如何測試 professionalField 的所有選項?

參考本文件的「專業領域選項」章節,使用提供的 12 個標準值。

---

## 相關文件

- **Prisma Schema**: `prisma/schema.prisma`
- **User Service**: `src/services/user.service.ts`
- **User Types**: `src/types/user.types.ts`
- **User Validators**: `src/validators/user.validators.ts`

---

## 聯絡方式

如有問題,請聯繫開發團隊或在 GitHub 提 issue。
