# POST 測試資料

  <http://localhost:4000/\>
  token\
"PRIVATE_RUNTIME_AUTH_TOKEN_REQUIRED"

本文件包含 User、Idea、Practice、Project、Resource、Resource Review 相關的 POST 請求測試資料，符合專案 API 回應格式規範。

## User 服務測試資料

### 創建用戶 (POST /api/users)

#### 請求資料

```json
{
  "gender": "male",
  "birthDay": "1995-06-15",
  "contactList": {
    "instagram": "@john_doe_dev",
    "discord": "JohnDoe#1234",
    "line": "john_doe_line",
    "facebook": "john.doe.developer"
  },
  "educationStage": "university",
  "isOpenLocation": true,
  "isOpenProfile": true,
  "isSubscribeEmail": true,
  "location": "taipei",
  "roleList": ["工程師", "學生"],
  "selfIntroduction": "我是一名前端工程師，熱愛學習新技術，專注於 React 和 TypeScript 開發",
  "share": ["開發心得", "技術文章", "學習筆記"],
  "wantToDoList": ["學習 React", "開發個人網站", "參與開源專案"],
  "tagList": ["JavaScript", "React", "前端開發", "TypeScript"],
  "interestList": ["程式設計", "人工智慧", "網頁開發"],
  "preferences": {
    "learningStyle": ["實作導向", "理論學習"],
    "contentType": ["影片", "文章", "實際操作"],
    "timeManagement": ["彈性時間", "短時間高效"]
  },
  "isSendEmail": true
}
```

#### 期望回應格式

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 125,
      "_id": "789e0123-e89b-12d3-a456-426614174002",
      "name": "新用戶",
      "email": "new.user@example.com",
      "photoUrl": "https://example.com/avatar/new_user.jpg",
      "gender": "male",
      "birthDay": "1995-06-15",
      "educationStage": "university",
      "isOpenLocation": true,
      "isOpenProfile": true,
      "isSubscribeEmail": true,
      "location": "taipei",
      "roleList": ["工程師", "學生"],
      "selfIntroduction": "我是一名前端工程師，熱愛學習新技術，專注於 React 和 TypeScript 開發",
      "tagList": ["JavaScript", "React", "前端開發", "TypeScript"],
      "interestList": ["程式設計", "人工智慧", "網頁開發"],
      "preferences": {
        "learningStyle": [
          { "name": "實作導向", "value": "hands_on" },
          { "name": "理論學習", "value": "theoretical" }
        ],
        "contentType": [
          { "name": "影片", "value": "video" },
          { "name": "文章", "value": "article" },
          { "name": "實際操作", "value": "hands_on_practice" }
        ],
        "timeManagement": [
          { "name": "彈性時間", "value": "flexible_time" },
          { "name": "短時間高效", "value": "short_efficient" }
        ]
      },
      "contactList": {
        "email": "new.user@example.com",
        "photoUrl": "https://example.com/avatar/new_user.jpg",
        "isSubscribeEmail": true,
        "instagram": "@john_doe_dev",
        "discord": "JohnDoe#1234",
        "line": "john_doe_line",
        "facebook": "john.doe.developer"
      },
      "customId": null,
      "customIdVerified": null,
      "customIdCreatedAt": null,
      "createdDate": "2024-01-15T10:30:00.000Z",
      "updatedDate": "2024-01-15T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 更新用戶偏好設定 (PUT /api/v1/me/preferences)

<!-- 
偏好設定類型 (preferenceTypeId):
1: 學習目標 (learning_goals) - 最多3個選項
2: 學習方式 (learning_methods) - 最多3個選項  
3: 指導方式 (guidance_style) - 最多3個選項
4: 時間投入 (time_investment) - 最多3個選項
5: 社交互動 (social_interaction) - 最多3個選項
6: 反饋偏好 (feedback_preference) - 最多3個選項

選項範例 (optionId):
- 學習目標: 1-5 (職涯發展、個人興趣、專案準備、深化專業、升學準備)
- 學習方式: 6-10 (閱讀、觀看、聆聽、實作、討論)
- 指導方式: 11-15 (步驟指引、自由探索、專案導向、結構彈性、應用導向)
- 時間投入: 16-19 (每日短時間、每週中等時間、每週長時間、彈性時間)
- 社交互動: 20-24 (獨自學習、同儕支持、導師指導、尋求反饋、知識分享)
- 反饋偏好: 25-29 (詳細解釋、鼓勵話語、深度提問、解決範例、實用指引)
-->

#### 請求資料
  
```json
{
  "preferences": [
    {
      "preferenceTypeId": 1,
      "optionId": 1,
      "isSelected": true
    },
    {
      "preferenceTypeId": 1,
      "optionId": 4,
      "isSelected": true
    },
    {
      "preferenceTypeId": 2,
      "optionId": 9,
      "isSelected": true
    },
    {
      "preferenceTypeId": 2,
      "optionId": 6,
      "isSelected": false
    },
    {
      "preferenceTypeId": 3,
      "optionId": 13,
      "isSelected": true
    },
    {
      "preferenceTypeId": 5,
      "optionId": 22,
      "isSelected": true
    }
  ]
}
```

#### 期望回應格式

```json
{
  "success": true,
  "data": {
    "message": "偏好設定已成功更新",
    "updatedPreferences": [
      {
        "preferenceTypeId": 1,
        "optionId": 1,
        "isSelected": true
      },
      {
        "preferenceTypeId": 1,
        "optionId": 4,
        "isSelected": true
      },
      {
        "preferenceTypeId": 2,
        "optionId": 9,
        "isSelected": true
      },
      {
        "preferenceTypeId": 3,
        "optionId": 13,
        "isSelected": true
      },
      {
        "preferenceTypeId": 5,
        "optionId": 22,
        "isSelected": true
      }
    ]
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## Idea 服務測試資料

### 創建想法 (POST /api/ideas)

#### 請求資料

```json
{
  "content": "我想要開發一個幫助學習者追蹤進度的應用程式，結合 AI 技術來個性化學習路徑，並提供社群互動功能讓學習者可以互相激勵和分享經驗。",
  "tags": ["前端開發", "React", "AI", "學習追蹤", "社群功能"],
  "resources": [
    {
      "name": "React 官方文檔",
      "url": "https://reactjs.org/docs",
      "description": "React 官方文檔，包含完整的 API 參考和最佳實踐"
    },
    {
      "name": "TensorFlow.js 教學",
      "url": "https://www.tensorflow.org/js",
      "description": "在瀏覽器中使用機器學習的完整指南"
    },
    {
      "name": "Firebase 文檔",
      "url": "https://firebase.google.com/docs",
      "description": "即時資料庫和用戶認證解決方案"
    }
  ]
}
```

#### 期望回應格式

```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "content": "我想要開發一個幫助學習者追蹤進度的應用程式，結合 AI 技術來個性化學習路徑，並提供社群互動功能讓學習者可以互相激勵和分享經驗。",
    "tags": ["前端開發", "React", "AI", "學習追蹤", "社群功能"],
    "resources": [
      {
        "id": "res-001",
        "name": "React 官方文檔",
        "url": "https://reactjs.org/docs",
        "description": "React 官方文檔，包含完整的 API 參考和最佳實踐"
      },
      {
        "id": "res-002", 
        "name": "TensorFlow.js 教學",
        "url": "https://www.tensorflow.org/js",
        "description": "在瀏覽器中使用機器學習的完整指南"
      },
      {
        "id": "res-003",
        "name": "Firebase 文檔", 
        "url": "https://firebase.google.com/docs",
        "description": "即時資料庫和用戶認證解決方案"
      }
    ],
    "status": "active",
    "userId": "user-123",
    "likeCount": 0,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 創建想法事件 (POST /api/ideas/:id/events)

#### 查看事件請求資料

```json
{
  "entityType": "idea",
  "entityId": "123e4567-e89b-12d3-a456-426614174000",
  "duration": 120
}
```

#### 分享事件請求資料

```json
{
  "entityType": "idea",
  "entityId": "123e4567-e89b-12d3-a456-426614174000",
  "shareChannel": "twitter"
}
```

#### 期望回應格式

```json
{
  "success": true,
  "data": {
    "message": "事件記錄成功",
    "eventId": "event-456"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## Practice 服務測試資料

### 創建實踐活動 (POST /api/practices)

#### 請求資料

```json
{
  "title": "學習 React Hooks 完整指南",
  "contentType": "course",
  "totalAmount": 25,
  "startDate": "2024-01-15",
  "dailyGoal": {
    "type": "time",
    "timeMinutes": 90
  },
  "practiceAction": "每天學習 1.5 小時的 React Hooks 課程，包含理論學習、實作練習和筆記整理",
  "tags": ["React", "Hooks", "前端開發"],
  "resources": [
    {
      "name": "React Hooks 官方文檔",
      "url": "https://react.dev/reference/react"
    },
    {
      "name": "Kent C. Dodds React Hooks 課程",
      "url": "https://epicreact.dev/hooks"
    },
    {
      "name": "React Hooks 實戰教學",
      "url": "https://www.udemy.com/course/react-hooks"
    }
  ]
}
```

#### 期望回應格式

```json
{
  "success": true,
  "data": {
    "id": "practice-789",
    "title": "學習 React Hooks 完整指南",
    "contentType": "course",
    "customContentType": null,
    "totalAmount": 25,
    "currentProgress": 0,
    "status": "active",
    "startDate": "2024-01-15",
    "dailyGoal": {
      "type": "time",
      "timeMinutes": 90,
      "amount": null,
      "unit": null
    },
    "practiceAction": "每天學習 1.5 小時的 React Hooks 課程，包含理論學習、實作練習和筆記整理",
    "tags": ["React", "Hooks", "前端開發"],
    "resources": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "name": "React Hooks 官方文檔",
        "url": "https://react.dev/reference/react"
      },
      {
        "id": "456e7890-e89b-12d3-a456-426614174001",
        "name": "Kent C. Dodds React Hooks 課程",
        "url": "https://epicreact.dev/hooks"
      },
      {
        "id": "789e0123-e89b-12d3-a456-426614174002",
        "name": "React Hooks 實戰教學",
        "url": "https://www.udemy.com/course/react-hooks"
      }
    ],
    "userId": "user-123",
    "likeCount": 0,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 創建簽到記錄 (POST /api/practices/:id/checkin)

#### 請求資料

```json
{
  "progress": 3,
  "note": "今天學習了 useState、useEffect 和 useContext，完成了三個練習項目，對 Hooks 的概念有了更清楚的理解",
  "mood": "happy",
  "reflectionText": "React Hooks 讓組件邏輯更清晰，特別是 useEffect 的依賴陣列概念很重要。明天將繼續學習 useReducer 和自定義 Hooks。",
  "relatedResourceId": "123e4567-e89b-12d3-a456-426614174000",
  "isPublic": true,
  "tags": ["React", "Hooks", "學習進展", "useState", "useEffect"]
}
```

#### 期望回應格式

```json
{
  "success": true,
  "data": {
    "id": "checkin-456",
    "practiceId": "practice-789",
    "progress": 3,
    "note": "今天學習了 useState、useEffect 和 useContext，完成了三個練習項目，對 Hooks 的概念有了更清楚的理解",
    "mood": "happy",
    "reflectionText": "React Hooks 讓組件邏輯更清晰，特別是 useEffect 的依賴陣列概念很重要。明天將繼續學習 useReducer 和自定義 Hooks。",
    "relatedResourceId": "123e4567-e89b-12d3-a456-426614174000",
    "isPublic": true,
    "tags": ["React", "Hooks", "學習進展", "useState", "useEffect"],
    "userId": "user-123",
    "createdAt": "2024-01-15T18:30:00.000Z",
    "updatedAt": "2024-01-15T18:30:00.000Z"
  },
  "timestamp": "2024-01-15T18:30:00.000Z"
}
```

### 創建實踐事件 (POST /api/practices/:id/events)

#### 查看事件請求資料

```json
{
  "entityType": "practice",
  "entityId": "practice-789",
  "duration": 300
}
```

#### 收藏事件請求資料

```json
{
  "entityType": "practice",
  "entityId": "practice-789"
}
```

#### 期望回應格式

```json
{
  "success": true,
  "data": {
    "message": "事件記錄成功",
    "eventId": "event-789"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## Project 服務測試資料

### 創建專案 (POST /api/projects)

#### 請求資料

```json
{
  "title": "全端電商網站開發專案",
  "description": "建立一個現代化的電商網站，包含用戶管理、商品展示、購物車、訂單處理和支付系統。使用 React + Node.js + PostgreSQL 技術棧，並部署到雲端平台。",
  "motivationDescription": "希望透過這個專案提升全端開發技能，學習電商系統的完整開發流程，為未來的職業發展做準備。同時也想建立一個完整的作品集項目。",
  "goal": "在 6 個月內完成一個功能完整的電商網站，包含前端用戶介面、後端 API、資料庫設計和雲端部署",
  "content": "專案分為四個主要階段：\n1. 需求分析和系統設計（1個月）\n2. 後端 API 開發和資料庫建置（2個月）\n3. 前端介面開發和整合（2個月）\n4. 測試、優化和部署（1個月）",
  "strategyDescription": "採用敏捷開發方法，每兩週進行一次迭代。優先開發核心功能，再逐步增加進階功能。使用 Git 版本控制，並建立完整的文檔。",
  "resource": "技術資源：React 官方文檔、Node.js 教學、PostgreSQL 文檔、AWS 部署指南\n學習資源：線上課程、技術書籍、開發者社群\n硬體資源：開發電腦、雲端伺服器、網域名稱",
  "outcomeDescription": "預期完成一個具有用戶註冊登入、商品瀏覽搜尋、購物車管理、訂單處理、支付整合等功能的電商網站，並獲得全端開發的實戰經驗",
  "isPublic": true,
  "status": "Not Started",
  "startDate": "2024-02-01T09:00:00.000Z",
  "endDate": "2024-08-01T18:00:00.000Z",
  "interval": 7,
  "imgUrl": "https://example.com/project-covers/ecommerce-project.jpg"
}
```

#### 期望回應格式

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "全端電商網站開發專案",
    "description": "建立一個現代化的電商網站，包含用戶管理、商品展示、購物車、訂單處理和支付系統。使用 React + Node.js + PostgreSQL 技術棧，並部署到雲端平台。",
    "motivation": null,
    "motivationDescription": "希望透過這個專案提升全端開發技能，學習電商系統的完整開發流程，為未來的職業發展做準備。同時也想建立一個完整的作品集項目。",
    "goal": "在 6 個月內完成一個功能完整的電商網站，包含前端用戶介面、後端 API、資料庫設計和雲端部署",
    "content": "專案分為四個主要階段：\n1. 需求分析和系統設計（1個月）\n2. 後端 API 開發和資料庫建置（2個月）\n3. 前端介面開發和整合（2個月）\n4. 測試、優化和部署（1個月）",
    "strategy": null,
    "strategyDescription": "採用敏捷開發方法，每兩週進行一次迭代。優先開發核心功能，再逐步增加進階功能。使用 Git 版本控制，並建立完整的文檔。",
    "resource": "技術資源：React 官方文檔、Node.js 教學、PostgreSQL 文檔、AWS 部署指南\n學習資源：線上課程、技術書籍、開發者社群\n硬體資源：開發電腦、雲端伺服器、網域名稱",
    "outcome": null,
    "outcomeDescription": "預期完成一個具有用戶註冊登入、商品瀏覽搜尋、購物車管理、訂單處理、支付整合等功能的電商網站，並獲得全端開發的實戰經驗",
    "isPublic": true,
    "status": "Not Started",
    "startDate": "2024-02-01T09:00:00.000Z",
    "endDate": "2024-08-01T18:00:00.000Z",
    "interval": 7,
    "imgUrl": "https://example.com/project-covers/ecommerce-project.jpg",
    "userId": "user-123",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 複製專案 (POST /api/projects/:id/duplicate)

#### 請求資料

```json
{
  "title": "全端電商網站開發專案 v2"
}
```

#### 期望回應格式

```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "title": "全端電商網站開發專案 v2",
    "description": "建立一個現代化的電商網站，包含用戶管理、商品展示、購物車、訂單處理和支付系統。使用 React + Node.js + PostgreSQL 技術棧，並部署到雲端平台。",
    "status": "Not Started",
    "isPublic": true,
    "userId": "user-123",
    "createdAt": "2024-01-15T11:00:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  },
  "timestamp": "2024-01-15T11:00:00.000Z"
}
```

---

## Resource 服務測試資料

### 創建資源 (POST /api/resources)

#### 請求資料 (基本版本 - 推薦使用)

```json
{
  "name": "React Hooks 完整教學指南",
  "description": "這是一個全面的 React Hooks 教學指南，涵蓋了所有常用的 Hooks 以及自定義 Hooks 的開發方法。適合有基本 React 知識的開發者進階學習。",
  "url": "https://react.dev/reference/react/hooks",
  "imageUrl": "https://example.com/images/react-hooks-guide.jpg",
  "type": "books_articles",
  "cost": "free",
  "level": "intermediate",
  "tags": ["React", "Hooks", "JavaScript", "前端開發", "教學"],
  "status": "active"
}
```

#### 請求資料 (含分類版本 - 需確保分類存在)

```json
{
  "name": "React Hooks 完整教學指南",
  "description": "這是一個全面的 React Hooks 教學指南，涵蓋了所有常用的 Hooks 以及自定義 Hooks 的開發方法。適合有基本 React 知識的開發者進階學習。",
  "url": "https://react.dev/reference/react/hooks",
  "imageUrl": "https://example.com/images/react-hooks-guide.jpg",
  "type": "books_articles",
  "cost": "free",
  "level": "intermediate",
  "majorCategory": "前端開發",
  "subCategory": "React", 
  "tags": ["React", "Hooks", "JavaScript", "前端開發", "教學"],
  "status": "active"
}
```

**注意**：使用含分類的版本前，請確保資料庫 `categories` 表中存在對應的分類名稱，否則會回傳 "主分類不存在" 或 "子分類不存在" 錯誤。

#### 期望回應格式

```json
{
  "success": true,
  "data": {
    "id": 123,
    "name": "React Hooks 完整教學指南",
    "description": "這是一個全面的 React Hooks 教學指南，涵蓋了所有常用的 Hooks 以及自定義 Hooks 的開發方法。適合有基本 React 知識的開發者進階學習。",
    "url": "https://react.dev/reference/react/hooks",
    "imageUrl": "https://example.com/images/react-hooks-guide.jpg",
    "videoUrl": null,
    "type": "books_articles",
    "cost": "free",
    "level": "intermediate",
    "majorCategory": "前端開發",
    "subCategory": "React",
    "tags": ["React", "Hooks", "JavaScript", "前端開發", "教學"],
    "status": "active",
    "created_by": 2,
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z",
    "stats": {
      "view_count": 0,
      "favorite_count": 0,
      "share_count": 0,
      "review_count": 1
    },
    "avgRating": 4.67,
    "author": {
      "id": 2,
      "name": "使用者名稱",
      "photoUrl": "https://example.com/avatar.jpg"
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 創建資源事件 (POST /api/resources/:id/events)

#### 查看事件請求資料

```json
{
  "entityType": "resource",
  "entityId": "res-123e4567-e89b-12d3-a456-426614174000",
  "duration": 45
}
```

#### 收藏事件請求資料

```json
{
  "entityType": "resource",
  "entityId": "res-123e4567-e89b-12d3-a456-426614174000"
}
```

#### 期望回應格式

```json
{
  "success": true,
  "data": {
    "message": "事件記錄成功",
    "eventId": "event-res-456"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## Resource Review 服務測試資料

### 創建資源評論 (POST /api/resources/:id/reviews)

#### 請求資料

```json
{
  "content": "這個教學指南寫得非常詳細，從基本概念到進階應用都有涵蓋。特別喜歡裡面的實際範例，讓我對 useEffect 的依賴陣列有了更深入的理解。作者的解釋很清楚，代碼範例也很實用。推薦給所有想要深入學習 React Hooks 的開發者！",
  "overallImpact": 4.5,
  "changeMindset": 4.0,
  "solveProblems": 4.5,
  "gainPerspectives": 5.0,
  "achieveGoals": 4.0,
  "timeUsage": "1_2_hours_daily",
  "contentFeatures": {
    "wellStructured": true,
    "practiceFocused": true,
    "wellRoundedConcepts": true,
    "thoughtProvoking": false,
    "progressiveLearning": true,
    "problemBased": false,
    "realWorldExamples": true,
    "interactive": false,
    "visuallyRich": false
  },
  "resourceUsage": {
    "withOnlineCourses": false,
    "withBooks": true,
    "withOtherTools": true,
    "withCommunity": false,
    "onlyThisResource": false,
    "notApplicableResource": false
  },
  "tags": ["初學者友善", "實作導向", "清晰易懂", "範例豐富"]
}
```

#### 期望回應格式

```json
{
  "success": true,
  "data": {
    "id": 123,
    "resource_id": 456,
    "content": "這個教學指南寫得非常詳細，從基本概念到進階應用都有涵蓋。特別喜歡裡面的實際範例，讓我對 useEffect 的依賴陣列有了更深入的理解。作者的解釋很清楚，代碼範例也很實用。推薦給所有想要深入學習 React Hooks 的開發者！",
    "overall_impact": 4.5,
    "change_mindset": 4.0,
    "solve_problems": 4.5,
    "gain_perspectives": 5.0,
    "achieve_goals": 4.0,
    "time_usage": "1_2_hours_daily",
    "well_structured": true,
    "practice_focused": true,
    "well_rounded_concepts": true,
    "thought_provoking": false,
    "progressive_learning": true,
    "problem_based": false,
    "real_world_examples": true,
    "interactive": false,
    "visually_rich": false,
    "with_online_courses": false,
    "with_books": true,
    "with_other_tools": true,
    "with_community": false,
    "only_this_resource": false,
    "not_applicable_resource": false,
    "tags": ["初學者友善", "實作導向", "清晰易懂", "範例豐富"],
    "status": "published",
    "created_by": 2,
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z",
    "author": {
      "id": 2,
      "name": "張小明",
      "photoUrl": "https://example.com/avatars/user-123.jpg"
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## 錯誤回應範例

### 驗證錯誤

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "請求資料驗證失敗",
    "details": {
      "title": "專案標題不能為空",
      "email": "電子郵件格式不正確"
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 資源不存在錯誤

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "找不到指定的資源",
    "details": {
      "resourceType": "practice",
      "resourceId": "practice-999"
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 權限錯誤

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "沒有權限執行此操作"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## 測試注意事項

1. **請求標頭**：所有需要認證的 API 都應包含 `Authorization: Bearer <token>`
2. **內容類型**：POST 請求需設定 `Content-Type: application/json`
3. **時間格式**：所有日期時間都使用 ISO 8601 格式
4. **UUID 格式**：資源 ID 使用標準 UUID 格式
5. **資料驗證**：請求資料必須符合對應的 Zod schema 驗證規則
6. **回應格式**：所有回應都遵循統一的 API 回應格式
7. **錯誤處理**：錯誤回應包含明確的錯誤代碼和訊息

這些測試資料可用於 Postman、Insomnia 或任何 API 測試工具進行測試。

---

# GET 測試資料

## User 服務 GET 測試資料

### 獲取用戶列表 (GET /api/v1/users)

#### 基本查詢
```
GET /api/v1/users
```

#### 帶查詢參數
```
GET /api/v1/users?page=1&pageSize=10&search=開發者
GET /api/v1/users?educationStage=university,graduate
GET /api/v1/users?roleList=工程師,設計師
GET /api/v1/users?location=taipei&isOpenProfile=true
```

#### 期望回應格式
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "_id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "張小明",
      "photoUrl": "https://example.com/avatar.jpg",
      "gender": "male",
      "educationStage": "university",
      "location": "taipei",
      "roleList": ["工程師", "學生"],
      "tagList": ["JavaScript", "React", "前端開發"],
      "isOpenProfile": true,
      "completenessPercentage": 85,
      "createdDate": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "itemsPerPage": 10,
    "hasNext": true,
    "hasPrev": false
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 獲取當前用戶資訊 (GET /api/v1/users/me)

#### 請求標頭
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 期望回應格式
```json
{
  "success": true,
  "data": {
    "id": 123,
    "_id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "張小明",
    "email": "user@example.com",
    "photoUrl": "https://example.com/avatar.jpg",
    "gender": "male",
    "birthDay": "1995-06-15",
    "educationStage": "university",
    "location": "taipei",
    "isOpenLocation": true,
    "isOpenProfile": true,
    "isSubscribeEmail": true,
    "roleList": ["工程師", "學生"],
    "selfIntroduction": "我是一名前端工程師...",
    "wantToDoList": ["學習 React", "開發個人網站"],
    "tagList": ["JavaScript", "React", "前端開發"],
    "contactList": {
      "email": "user@example.com",
      "instagram": "@john_doe_dev",
      "discord": "JohnDoe#1234",
      "line": "john_doe_line",
      "facebook": "john.doe.developer"
    },
    "customId": "john_developer",
    "completenessPercentage": 90,
    "createdDate": "2024-01-15T10:30:00.000Z",
    "updatedDate": "2024-01-15T10:30:00.000Z"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 獲取指定用戶資訊 (GET /api/v1/users/:id)

#### 請求範例
```
GET /api/v1/users/550e8400-e29b-41d4-a716-446655440000
```

#### 期望回應格式
```json
{
  "success": true,
  "data": {
    "id": 123,
    "_id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "張小明",
    "photoUrl": "https://example.com/avatar.jpg",
    "gender": "male",
    "educationStage": "university",
    "location": "taipei",
    "roleList": ["工程師", "學生"],
    "selfIntroduction": "我是一名前端工程師...",
    "tagList": ["JavaScript", "React", "前端開發"],
    "socialLinks": {
      "instagram": "@john_doe_dev",
      "discord": "JohnDoe#1234"
    },
    "isOpenProfile": true,
    "completenessPercentage": 85,
    "createdDate": "2024-01-15T10:30:00.000Z"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 獲取用戶偏好設定 (GET /api/v1/users/me/preferences)

#### 請求標頭
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 帶查詢參數
```
GET /api/v1/users/me/preferences?category=learning_goals
GET /api/v1/users/me/preferences?includeSystem=true
```

#### 期望回應格式
```json
{
  "success": true,
  "data": {
    "preferences": [
      {
        "id": 1,
        "preferenceTypeId": 1,
        "preferenceTypeName": "學習目標",
        "optionId": 1,
        "optionName": "職涯發展",
        "isSelected": true,
        "weight": 1.0,
        "updatedAt": "2024-01-15T10:30:00.000Z"
      },
      {
        "id": 2,
        "preferenceTypeId": 2,
        "preferenceTypeName": "學習方式",
        "optionId": 9,
        "optionName": "實作練習",
        "isSelected": true,
        "weight": 0.8,
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "availableTypes": [
      {
        "id": 1,
        "name": "學習目標",
        "maxSelections": 3
      },
      {
        "id": 2,
        "name": "學習方式",
        "maxSelections": 3
      }
    ]
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Resource 服務 GET 測試資料

### 獲取資源列表 (GET /api/v1/resources)

#### 基本查詢
```
GET /api/v1/resources
```

#### 帶分頁和篩選參數
```
GET /api/v1/resources?cursor=eyJpZCI6MTAuLi4&limit=10
GET /api/v1/resources?type=books_articles&cost=free&level=beginner
GET /api/v1/resources?majorCategory=前端開發&subCategory=React
GET /api/v1/resources?tags=JavaScript,React&query=教學
GET /api/v1/resources?sort=created_at&order=desc
```

#### 期望回應格式
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "React Hooks 完整教學指南",
      "description": "全面的 React Hooks 教學指南...",
      "url": "https://react.dev/reference/react/hooks",
      "imageUrl": "https://example.com/images/react-hooks.jpg",
      "videoUrl": null,
      "type": "books_articles",
      "cost": "free",
      "level": "intermediate",
      "majorCategory": "前端開發",
      "subCategory": "React",
      "tags": ["React", "Hooks", "JavaScript"],
      "status": "active",
      "author": {
        "id": 123,
        "name": "張老師",
        "photoUrl": "https://example.com/avatar.jpg"
      },
      "reviewStats": {
        "totalReviews": 25,
        "averageScores": {
          "impact": 4.5,
          "mindset": 4.2,
          "problems": 4.3,
          "perspectives": 4.4,
          "goals": 4.1
        }
      },
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "cursors": {
      "start": "eyJpZCI6MSwidGltZXN0YW1wIjoiMjAyNC0wMS0xNSJ9",
      "end": "eyJpZCI6MTAsInRpbWVzdGFtcCI6IjIwMjQtMDEtMTAifQ=="
    },
    "hasMore": true,
    "count": 10
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 獲取資源詳情 (GET /api/v1/resources/:resourceId)

#### 請求範例
```
GET /api/v1/resources/550e8400-e29b-41d4-a716-446655440000
```

#### 期望回應格式
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "React Hooks 完整教學指南",
    "description": "全面的 React Hooks 教學指南，涵蓋所有常用的 Hooks...",
    "url": "https://react.dev/reference/react/hooks",
    "imageUrl": "https://example.com/images/react-hooks.jpg",
    "videoUrl": null,
    "type": "books_articles",
    "cost": "free",
    "level": "intermediate",
    "majorCategory": "前端開發",
    "subCategory": "React",
    "tags": ["React", "Hooks", "JavaScript", "前端開發"],
    "status": "active",
    "author": {
      "id": 123,
      "name": "張老師",
      "photoUrl": "https://example.com/avatar.jpg"
    },
    "reviewStats": {
      "totalReviews": 25,
      "averageScores": {
        "impact": 4.5,
        "mindset": 4.2,
        "problems": 4.3,
        "perspectives": 4.4,
        "goals": 4.1
      }
    },
    "relatedResources": [
      {
        "id": "456e7890-e89b-12d3-a456-426614174001",
        "name": "React 進階概念",
        "type": "books_articles",
        "level": "advanced"
      }
    ],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 獲取資源統計 (GET /api/v1/resources/stats)

#### 請求標頭（可選）
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 期望回應格式
```json
{
  "success": true,
  "data": {
    "totalCount": 150,
    "activeCount": 142,
    "typeStats": {
      "books_articles": 80,
      "video_content": 45,
      "workshops_courses": 17,
      "tools_platforms": 8
    },
    "levelStats": {
      "beginner": 65,
      "intermediate": 55,
      "advanced": 22
    },
    "costStats": {
      "free": 120,
      "paid": 22
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

# PUT 測試資料

## User 服務 PUT 測試資料

### 更新用戶資訊 (PUT /api/v1/users/:id)

#### 請求標頭
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

#### 請求資料
```json
{
  "name": "張小明更新",
  "bio": "更新的個人簡介：我是一名全端工程師，專精於 React 和 Node.js 開發",
  "phone": "+886987654321",
  "location": "taichung",
  "educationStage": "graduate",
  "isOpenLocation": false,
  "isOpenProfile": true,
  "isSubscribeEmail": false,
  "roleList": ["全端工程師", "技術顧問"],
  "selfIntroduction": "更新後的自我介紹：擁有 5 年開發經驗...",
  "wantToDoList": ["學習 Next.js", "開發 SaaS 產品", "技術寫作"],
  "tagList": ["JavaScript", "TypeScript", "React", "Node.js", "全端開發"],
  "interestList": ["軟體架構", "系統設計", "開發者工具"],
  "socialLinks": {
    "github": "https://github.com/updated-username",
    "linkedin": "https://linkedin.com/in/updated-profile",
    "instagram": "@updated_handle",
    "discord": "UpdatedUser#5678"
  }
}
```

#### 期望回應格式
```json
{
  "success": true,
  "data": {
    "id": 123,
    "_id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "張小明更新",
    "email": "user@example.com",
    "photoUrl": "https://example.com/avatar.jpg",
    "bio": "更新的個人簡介：我是一名全端工程師，專精於 React 和 Node.js 開發",
    "phone": "+886987654321",
    "location": "taichung",
    "educationStage": "graduate",
    "isOpenLocation": false,
    "isOpenProfile": true,
    "isSubscribeEmail": false,
    "roleList": ["全端工程師", "技術顧問"],
    "selfIntroduction": "更新後的自我介紹：擁有 5 年開發經驗...",
    "wantToDoList": ["學習 Next.js", "開發 SaaS 產品", "技術寫作"],
    "tagList": ["JavaScript", "TypeScript", "React", "Node.js", "全端開發"],
    "socialLinks": {
      "github": "https://github.com/updated-username",
      "linkedin": "https://linkedin.com/in/updated-profile",
      "instagram": "@updated_handle",
      "discord": "UpdatedUser#5678"
    },
    "completenessPercentage": 95,
    "updatedDate": "2024-01-15T10:30:00.000Z"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

# PATCH 測試資料

## Resource 服務 PATCH 測試資料

### 部分更新資源 (PATCH /api/v1/resources/:resourceId)

#### 請求標頭
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

#### 請求資料（部分更新）
```json
{
  "name": "React Hooks 完整教學指南 (2024 更新版)",
  "description": "更新版本的 React Hooks 教學指南，加入了最新的 Hooks API 和最佳實踐",
  "imageUrl": "https://example.com/images/react-hooks-2024.jpg",
  "level": "intermediate",
  "tags": ["React", "Hooks", "JavaScript", "前端開發", "2024", "最新版"]
}
```

#### 期望回應格式
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "React Hooks 完整教學指南 (2024 更新版)",
    "description": "更新版本的 React Hooks 教學指南，加入了最新的 Hooks API 和最佳實踐",
    "url": "https://react.dev/reference/react/hooks",
    "imageUrl": "https://example.com/images/react-hooks-2024.jpg",
    "videoUrl": null,
    "type": "books_articles",
    "cost": "free",
    "level": "intermediate",
    "majorCategory": "前端開發",
    "subCategory": "React",
    "tags": ["React", "Hooks", "JavaScript", "前端開發", "2024", "最新版"],
    "status": "active",
    "author": {
      "id": 123,
      "name": "張老師",
      "photoUrl": "https://example.com/avatar.jpg"
    },
    "updatedAt": "2024-01-15T11:00:00.000Z"
  },
  "timestamp": "2024-01-15T11:00:00.000Z"
}
```

### 更新資源狀態 (PATCH /api/v1/resources/:resourceId/status)

#### 請求標頭
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

#### 請求資料
```json
{
  "status": "inactive",
  "reason": "內容需要更新"
}
```

#### 期望回應格式
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "inactive",
    "statusUpdatedAt": "2024-01-15T11:00:00.000Z",
    "statusUpdatedBy": {
      "id": 2,
      "name": "管理員",
      "role": "admin"
    },
    "message": "資源狀態已成功更新"
  },
  "timestamp": "2024-01-15T11:00:00.000Z"
}
```

## Project 服務 PATCH 測試資料

### 部分更新專案 (PATCH /api/v1/projects/:id)

#### 請求標頭
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

#### 請求資料
```json
{
  "title": "全端電商網站開發專案 v2.0",
  "status": "In Progress",
  "goal": "在 4 個月內完成 MVP 版本的電商網站，包含基本的購物功能",
  "content": "專案調整為 MVP 優先方案：\n1. 基本用戶系統（1個月）\n2. 商品展示和購物車（1.5個月）\n3. 簡化的訂單系統（1個月）\n4. 測試和部署（0.5個月）",
  "endDate": "2024-06-01T18:00:00.000Z"
}
```

#### 期望回應格式
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "全端電商網站開發專案 v2.0",
    "description": "建立一個現代化的電商網站...",
    "goal": "在 4 個月內完成 MVP 版本的電商網站，包含基本的購物功能",
    "content": "專案調整為 MVP 優先方案：\n1. 基本用戶系統（1個月）\n2. 商品展示和購物車（1.5個月）\n3. 簡化的訂單系統（1個月）\n4. 測試和部署（0.5個月）",
    "status": "In Progress",
    "startDate": "2024-02-01T09:00:00.000Z",
    "endDate": "2024-06-01T18:00:00.000Z",
    "userId": "user-123",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  },
  "timestamp": "2024-01-15T11:00:00.000Z"
}
```

## Practice 服務 PATCH 測試資料

### 部分更新實踐活動 (PATCH /api/v1/practices/:id)

#### 請求標頭
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

#### 請求資料
```json
{
  "dailyGoal": {
    "type": "time",
    "timeMinutes": 120
  },
  "practiceAction": "每天學習 2 小時的 React Hooks 課程，加強實作練習和筆記整理",
  "status": "active"
}
```

#### 期望回應格式
```json
{
  "success": true,
  "data": {
    "id": "practice-789",
    "title": "學習 React Hooks 完整指南",
    "dailyGoal": {
      "type": "time",
      "timeMinutes": 120,
      "amount": null,
      "unit": null
    },
    "practiceAction": "每天學習 2 小時的 React Hooks 課程，加強實作練習和筆記整理",
    "status": "active",
    "totalAmount": 25,
    "currentProgress": 5,
    "updatedAt": "2024-01-15T11:00:00.000Z"
  },
  "timestamp": "2024-01-15T11:00:00.000Z"
}
```

---

## 測試注意事項（更新版）

1. **GET 請求**：
   - 不需要 Content-Type 標頭
   - 查詢參數應正確編碼（URL encoding）
   - 分頁參數要符合 API 規範

2. **PUT 請求**：
   - 需要完整的資源更新
   - 必須包含所有必填欄位
   - 會完全替換現有資源

3. **PATCH 請求**：
   - 僅更新提供的欄位
   - 其他欄位保持不變
   - 適合部分更新操作

4. **認證要求**：
   - GET 請求：部分需要認證，部分為公開 API
   - PUT/PATCH 請求：都需要有效的 JWT token
   - 權限檢查：修改操作需要適當權限

5. **錯誤處理**：
   - 404: 資源不存在
   - 403: 權限不足
   - 400: 請求資料驗證失敗
   - 401: 未認證或 token 無效

這些測試資料涵蓋了主要的 GET、PUT、PATCH 操作，可用於 API 測試和開發驗證。
