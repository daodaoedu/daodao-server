### **3.4 資源管理模組（進行中）**

- **功能描述**：
    - 提供資源的新增、編輯、刪除與檢索功能。
- **API 設計**：
    - `GET /resources`
        - 功能：查詢資源列表。
        - 篩選參數：
        
        | 參數 | 類型 | 必填 | 描述 | 範例 |
        | --- | --- | --- | --- | --- |
        | cursor | string | 否 | 游標位置，用於分頁 | `eyJpZCI6MTU2LCJjcmVhdGVkX2F0IjoiMjAyNC0wMS0yNVQwOToxNTowMFoifQ==` |
        | limit | integer | 否 | 每頁筆數，預設 5，最大 20 | `5` |
        | type | string | 否 | 資源類型過濾 | `learning_platform_app`, `learning_tools`, `books_articles`, `video_content`, `podcast_content`, `workshops_courses`, `professional_certificates`, `community_organization`, `other` |
        | cost | string | 否 | 費用類型過濾 | `free`, `paid`, `partial_free` |
        | level | string | 否 | 適合過濾 | `beginner`, `intermediate`, `expert`, `all_levels` |
        | majorCategory | string | 否 | 主分類名稱 | `nature_environment` |
        | subCategory | string | 否 | 子分類名稱 | `earth_science` |
        | tags | string | 否 | 標籤過濾，多個用逗號分隔 | `react,javascript` |
        | sort | string | 否 | 排序欄位 | `id`, `name`, `created_at`, `updated_at` |
        | order | string | 否 | 排序方向 | `desc`, `asc` |
        | query | string | 否 | 關鍵字搜尋 | `React` |
        |  |  |  |  |  |
        - 回傳內容：
        
        ```jsx
        {
          "success": true,
          "data": {
            "resources": [
              {
                "id": "123e4567-e89b-12d3-a456-426614174000",  // UUID 格式
                "name": "React 官方教學",
                "url": "https://react.dev/tutorial",
                "imageUrl": "https://react.dev/images/tutorial/react-logo.png",
                "description": "React 官方提供的入門教學",
                "videoUrl": null,
                "type": "learning_platform_app",
                "level": "beginner",
                "cost": "free",
                "status": "active",
                "viewCount": 1250,
                "favoriteCount": 89,
                "shareCount": 23,
                "reviewCount": 15,
                "avgRating": 4.3,
                "likeCount": 156,
                "majorCategory": "nature_environment",   // 更新時使用分類唯一識別名稱
                "subCategory": "earth_science",        // 更新時使用分類唯一識別名稱
                "user": {
                  "id": 2,
                  "name": "小許",
                  "_id": "b4996c36-722d-409b-a5c6-853827ddc471",
                  "roleList": ["citizen", "experimental-educator"],
                  "photoURL": "https://lh3.googleusercontent.com/a/ACg8ocJ3YjTVznTRc8401zw3ta7c3QaZYb5lDy3497cbCmZYM79s3LoZ=s96-c"
                },
                "createdAt": "2024-01-25T09:15:00Z",
                "updatedAt": "2024-01-25T14:20:00Z",
                "tags": ["react", "javascript", "frontend"]
              },
              {
                "id": "234e5678-f89c-23e4-b567-537725285111",  // UUID 格式
                "name": "Vue.js 完整指南",
                "url": "https://vuejs.org/guide/",
                "imageUrl": "https://vuejs.org/images/logo.png",
                "description": "Vue.js 官方完整學習指南",
                "type": "learning_platform_app",
                "level": "beginner",
                "cost": "free",
                "status": "active",
                "viewCount": 890,
                "favoriteCount": 56,
                "shareCount": 12,
                "reviewCount": 8,
                "avgRating": 4.5,
                "likeCount": 89,
                "majorCategory": "nature_environment",   // 更新時使用分類唯一識別名稱
                "subCategory": "earth_science",        // 更新時使用分類唯一識別名稱
                "user": {
                  "id": 5,
                  "name": "阿明",
                  "_id": "f7832b44-933e-422a-b8d7-945338ffe982",
                  "roleList": ["citizen", "developer"],
                  "photoURL": "https://lh3.googleusercontent.com/a/default-user=s96-c"
                },
                "createdAt": "2024-01-24T16:30:00Z",
                "updatedAt": "2024-01-24T16:30:00Z",
                "tags": ["vue", "javascript", "spa"]
              }
              // ... 更多資源
            ],
            "pagination": {
              "limit": 5,
              "hasNext": true,
              "hasPrev": false,
              "nextCursor": "eyJpZCI6MTM1LCJjcmVhdGVkX2F0IjoiMjAyNC0wMS0yMFQxMDozMDowMFoifQ==",
              "prevCursor": null,
              "totalEstimate": 156
            }
          }
        }
        ```
        
    - `GET /resources/{id}`
        - 功能：獲得指定資源詳細內容。
        - 路徑參數：`{id}` - 資源的 UUID
        - **設計說明**：
            - 此端點只返回資源本身的資訊和統計數據
            - **不包含評論內容**，若需查看評論請使用 `GET /resources/{id}/reviews`
            - 包含評論的統計資訊（`reviewCount`、`avgRating`）但不包含具體評論內容
            - 回應中沒有 `reviews` 或 `recentReviews` 陣列
        - 回傳內容：
        
        ```jsx
        {
          "success": true,
          "data": {
            "id": "123e4567-e89b-12d3-a456-426614174000",  // UUID 格式
            "name": "React 官方教學",
            "url": "https://react.dev/tutorial",
            "imageUrl": "https://react.dev/images/tutorial/react-logo.png",
            "description": "React 官方提供的入門教學",
            "videoUrl": null,
            "type": "learning_platform_app",
            "level": "beginner",
            "cost": "free",
            "status": "active",
            "viewCount": 1250,
            "favoriteCount": 89,
            "shareCount": 23,
            "reviewCount": 15,
            "avgRating": 4.3,
            "likeCount": 156,
            "majorCategory": "nature_environment",   // 更新時使用分類唯一識別名稱
            "subCategory": "earth_science",        // 更新時使用分類唯一識別名稱
            "user": {
              "id": 42,
              "name": "小許",
              "_id": "b4996c36-722d-409b-a5c6-853827ddc471",
              "roleList": ["citizen", "experimental-educator"],
              "photoURL": "https://lh3.googleusercontent.com/a/ACg8ocJ3YjTVznTRc8401zw3ta7c3QaZYb5lDy3497cbCmZYM79s3LoZ=s96-c"
            },
            "createdAt": "2024-01-15T10:30:00Z",
            "updatedAt": "2024-01-20T14:20:00Z",
            "tags": ["react", "javascript", "frontend"]
          }
        }
        ```
        
    - `POST /resources`
        - 功能：新增學習資源。
        - **說明**：
            - `review` 欄位為可選，如果提供則同時建立心得評價
            - 資源和心得可以有各自獨立的標籤
            - 心得建立後會自動更新資源的評分統計
            - 如果不提供 `review` 欄位，則只建立資源
        - 請求內容：資源名稱、描述、分類、難度標籤、URL、關鍵字等。
        
        ```jsx
        {
          "name": "Vue.js 完整指南",
          "url": "https://vuejs.org/guide/",
          "imageUrl": "https://vuejs.org/images/logo.png",
          "description": "Vue.js 官方完整學習指南",
          "videoUrl": "https://youtube.com/watch?v=xxx",
          "type": "learning_platform_app",
          "level": "intermediate",
          "cost": "free",
          "majorCategory": "nature_environment",   // 創建時使用分類唯一識別名稱
          "subCategory": "earth_science",        // 創建時使用分類唯一識別名稱
          "tags": ["vue", "javascript", "frontend", "spa"],
          
          // 可選：同時建立心得評價
          "review": {
            "content": "Vue.js 官方文件寫得很清楚，範例豐富，適合有一些 JavaScript 基礎的開發者學習...",
            "overallImpact": 5,
            "changeMindset": 4,
            "solveProblems": 5,
            "gainPerspectives": 4,
            "achieveGoals": 5,
        		"timeUsage": "1_2_hours_daily",
            "contentFeatures": {
                "wellStructured": true,
                "practiceFocused": true,
                "wellRoundedConcepts": false,
                "thoughtProvoking": true,
                "progressiveLearning": false,
                "problemBased": false,
                "realWorldExamples": true,
                "interactive": false,
                "visuallyRich": true
              },
            "resourceUsage": {
                "withOnlineCourses": true,
                "withBooks": false,
                "withOtherTools": true,
                "withCommunity": false,
                "onlyThisResource": false,
                "notApplicableResource": false
              },
            "tags": ["comprehensive", "official-docs", "well-organized"]
          }
        }
        ```
        
        - 回傳內容：
        
        ```jsx
        {
          "success": true,
          "data": {
            "resource": {
              "id": "345e6789-g89d-34f5-c678-648836396222",  // UUID 格式
              "name": "Vue.js 完整指南",
              "url": "https://vuejs.org/guide/",
              "imageUrl": "https://vuejs.org/images/logo.png",
              "description": "Vue.js 官方完整學習指南",
              "videoUrl": "https://youtube.com/watch?v=xxx",
              "type": "learning_platform_app",
              "level": "intermediate",
              "cost": "free",
              "status": "active",
              "viewCount": 0,
              "favoriteCount": 0,
              "shareCount": 0,
              "reviewCount": 1,
              "avgRating": 4.6,
              "likeCount": 0,
              "majorCategory": "nature_environment",   // 更新時使用分類唯一識別名稱
              "subCategory": "earth_science",        // 更新時使用分類唯一識別名稱
              "user": {
                "id": 42,
                "name": "current_user",
                "_id": "d8902f77-944g-544c-d0f9-075449hhg704",
                "roleList": ["citizen", "developer"],
                "photoURL": "https://lh3.googleusercontent.com/a/current-user=s96-c"
              },
              "createdAt": "2024-01-25T09:15:00Z",
              "updatedAt": "2024-01-25T09:15:00Z",
              "tags": ["vue", "javascript", "frontend", "spa"]
            },
            "review": {
              "id": "89",
              "content": "Vue.js 官方文件寫得很清楚，範例豐富，適合有一些 JavaScript 基礎的開發者學習...",
              "overallImpact": 5,
              "changeMindset": 4,
              "solveProblems": 5,
              "gainPerspectives": 4,
              "achieveGoals": 5,
              "avgRating": 4.6,
              "timeUsage": "1_2_hours_daily",
        	    "contentFeatures": {
                "wellStructured": true,
                "practiceFocused": true,
                "wellRoundedConcepts": false,
                "thoughtProvoking": true,
                "progressiveLearning": false,
                "problemBased": false,
                "realWorldExamples": true,
                "interactive": false,
                "visuallyRich": true
              },
        	    "resourceUsage": {
                "withOnlineCourses": true,
                "withBooks": false,
                "withOtherTools": true,
                "withCommunity": false,
                "onlyThisResource": false,
                "notApplicableResource": false
              },
              "status": "published",
              "likeCount": 0,  
              "user": {
                "id": 42,
                "name": "current_user",
                "_id": "d8902f77-944g-544c-d0f9-075449hhg704",
                "roleList": ["citizen", "developer"],
                "photoURL": "https://lh3.googleusercontent.com/a/current-user=s96-c"
              },
              "resourceId": "345e6789-g89d-34f5-c678-648836396222",  // UUID 格式
              "createdAt": "2024-01-25T09:15:00Z",
              "updatedAt": "2024-01-25T09:15:00Z",
              "tags": ["comprehensive", "official-docs", "well-organized"]
            }
          }
        }
        ```
        
    - `PATCH /resources/{id}`
        - 功能：更新指定資源內容。
        - 路徑參數：`{id}` - 資源的 UUID
        - **說明**：
            - 更新時提供的 `tags` 會完全取代現有標籤
            - 如果不想改變標籤，請不要包含 `tags` 欄位
            - 如果提供 `review` 欄位且使用者已有心得，則更新心得；如果沒有心得則建立新心得
            - 如果不提供 `review` 欄位，則不影響心得評價
        - 請求內容：資源名稱、描述、分類、難度標籤、URL、關鍵字等。
        
        ```jsx
        {
          "name": "Vue.js 完整指南 - 更新版",
          "description": "更新後的描述...",
          "imageUrl": "https://vuejs.org/images/new-logo.png",
          "majorCategory": "nature_environment",   // 更新時使用分類唯一識別名稱
          "subCategory": "earth_science",        // 更新時使用分類唯一識別名稱
          "tags": ["vue", "javascript", "frontend", "composition-api"],
          
          // 可選：同時更新使用者的心得評價（如果存在）
          "review": {
        	  "id":"12131241324",
            "content": "經過一段時間的使用，我對這個資源有了更深的理解...",
            "overallImpact": 5,
            "changeMindset": 5,
            "solveProblems": 5,
            "gainPerspectives": 4,
            "achieveGoals": 5,
            "timeUsage": "1_2_hours_daily",
            "contentFeatures": {
                "wellStructured": true,
                "practiceFocused": true,
                "wellRoundedConcepts": false,
                "thoughtProvoking": true,
                "progressiveLearning": false,
                "problemBased": false,
                "realWorldExamples": true,
                "interactive": false,
                "visuallyRich": true
              },
            "resourceUsage": {
                "withOnlineCourses": true,
                "withBooks": false,
                "withOtherTools": true,
                "withCommunity": false,
                "onlyThisResource": false,
                "notApplicableResource": false
              },
            "tags": ["comprehensive", "updated-content", "production-ready"]
          }
        }
        ```
        
        - 回傳內容：
        
        ```jsx
        {
          "success": true,
          "data": {
            "resource": {
              "id": "345e6789-g89d-34f5-c678-648836396222",  // UUID 格式
              "name": "Vue.js 完整指南 - 更新版",
              "description": "更新後的描述...",
              "reviewCount": 1,
              "avgRating": 4.8,
              "updatedAt": "2024-01-26T10:30:00Z"
              // ... 其他欄位
            },
        	 "review": {
        	    "id": "89",
        	    "content": "經過一段時間的使用，我對這個資源有了更深的理解...",
        	    "overallImpact": 5,
        	    "changeMindset": 5,
        	    "solveProblems": 5,
        	    "gainPerspectives": 4,
        	    "achieveGoals": 5,
        	    "timeUsage": "1_2_hours_daily",
        	    "contentFeatures": {
                "wellStructured": true,
                "practiceFocused": true,
                "wellRoundedConcepts": false,
                "thoughtProvoking": true,
                "progressiveLearning": false,
                "problemBased": false,
                "realWorldExamples": true,
                "interactive": false,
                "visuallyRich": true
              },
        	    "resourceUsage": {
                "withOnlineCourses": true,
                "withBooks": false,
                "withOtherTools": true,
                "withCommunity": false,
                "onlyThisResource": false,
                "notApplicableResource": false
              },
        	    "tags": ["comprehensive", "updated-content", "production-ready"]
            }
          }
        }
        ```
        
    - `DELETE /resources/{id}`
        - 功能：刪除指定資源。
        - 路徑參數：`{id}` - 資源的 UUID

    - `GET /resources/{id}/tags`
        - 功能：獲取資源的標籤列表。
        - 路徑參數：`{id}` - 資源的 UUID
        - ⚠️ **新增 API**

    - `PATCH /resources/{id}/status`
        - 功能：更新資源狀態。
        - 路徑參數：`{id}` - 資源的 UUID
        - 請求內容：
        ```jsx
        {
          "status": "archived"  // draft, active, archived, reported
        }
        ```
        - ⚠️ **新增 API**

### **3.5 資源心得分享模組（進行中）**

- **功能描述**：
    - 用戶可以撰寫學習心得，並對資源進行評價與反饋。
- **功能細節**：
- **API 設計**：
    - `GET /resources/{resourceId}/reviews`
        - 功能：獲取指定資源的所有心得。
        - 路徑參數：`{resourceId}` - 資源的 UUID
        - **分頁設計**：
            - 預設每頁載入 2 筆評論，適合「查看更多」按鈕的 UI 模式
            - 用戶點擊「查看更多」時，前端用 `nextCursor` 載入下一批 2 筆
            - 最大每頁限制為 10 筆，避免單次請求過大
            - 使用游標分頁 (cursor-based pagination) 確保資料一致性
        - 篩選參數：
        
        | 參數 | 類型 | 必填 | 描述 | 範例 |
        | --- | --- | --- | --- | --- |
        | cursor | string | 否 | 游標位置，用於分頁 | `eyJpZCI6MTU2LCJjcmVhdGVkX2F0IjoiMjAyNC0wMS0yNVQwOToxNTowMFoifQ==` |
        | limit | integer | 否 | 每頁筆數，預設 2，最大 10 | `2` |
        | sort | string | 否 | 排序欄位 | `id`, `name`, `created_at`, `updated_at` |
        | order | string | 否 | 排序方向 | `desc`, `asc` |
        | status | string | 否 | 評論狀態篩選 | `draft`, `published`, `archived`, `reported` |
        | minScore | number | 否 | 最小整體評分篩選 | `1.0` - `5.0` |
        | maxScore | number | 否 | 最大整體評分篩選 | `1.0` - `5.0` |
        | tags | string | 否 | 標籤篩選，多個用逗號分隔 | `實用,清晰易懂` |
        - 回傳內容：
        
        ```jsx
        {
          "success": true,
          "data": {
            "reviews": [
              {
                "id": "25",
                "content": "這個教學寫得很清楚，步驟詳細...",
                "overallImpact": 5,
                "changeMindset": 4,
                "solveProblems": 5,
                "gainPerspectives": 4,
                "achieveGoals": 5,
                "avgRating": 4.6,
                "timeUsage": "few_intensive_days_week",
                "contentFeatures": {
                  "wellStructured": true,
                  "practiceFocused": true,
                  "wellRoundedConcepts": false,
                  "thoughtProvoking": false,
                  "progressiveLearning": true,
                  "problemBased": false,
                  "realWorldExamples": true,
                  "interactive": false,
                  "visuallyRich": false
                },
                "resourceUsage": {
                  "withOnlineCourses": false,
                  "withBooks": false,
                  "withOtherTools": false,
                  "withCommunity": false,
                  "onlyThisResource": true,
                  "notApplicableResource": false
                },
                "status": "published",
                "likeCount": 12,  
                "user": {
                  "id": "25",
                  "name": "Alice Chen",
                  "_id": "e6903g88-055h-655d-f1g0-186550iij815",
                  "roleList": ["citizen", "learner"],
                  "photoURL": "https://lh3.googleusercontent.com/a/alice-profile=s96-c"
                },
                "resourceId": "123e4567-e89b-12d3-a456-426614174000",  // UUID 格式
                "createdAt": "2024-01-18T16:45:00Z",
                "updatedAt": "2024-01-19T10:20:00Z",
                "tags": ["實用", "清晰易懂"]
              }
              // ... 更多心得
            ],
            "pagination": {
              "limit": 2,
              "hasNext": true,
              "hasPrev": false,
              "nextCursor": "eyJpZCI6MjAsImNyZWF0ZWRfYXQiOiIyMDI0LTAxLTE4VDE2OjQ1OjAwWiJ9",
              "prevCursor": null,
              "totalEstimate": 15
            }
          }
        }
        ```
        
    - `GET /resources/{resourceId}/reviews/{reviewId}`
        - 功能：獲取指定資源的單一心得詳細內容。
        - 路徑參數：
            - `{resourceId}` - 資源的 UUID
            - `{reviewId}` - 心得評價的 ID (字串格式，內容為數字)
        - 回傳內容：
        
        ```jsx
        {
          "success": true,
          "data": {
            "id": "25",
            "content": "這個教學寫得很清楚，步驟詳細，適合初學者入門...",
            "overallImpact": 5,
            "changeMindset": 4,
            "solveProblems": 5,
            "gainPerspectives": 4,
            "achieveGoals": 5,
            "avgRating": 4.6,
            "timeUsage": "1_2_hours_daily",
            "contentFeatures": {
              "wellStructured": true,
              "practiceFocused": true,
              "wellRoundedConcepts": false,
              "thoughtProvoking": true,
              "progressiveLearning": false,
              "problemBased": false,
              "realWorldExamples": true,
              "interactive": false,
              "visuallyRich": true
            },
            "resourceUsage": {
              "withOnlineCourses": true,
              "withBooks": false,
              "withOtherTools": true,
              "withCommunity": false,
              "onlyThisResource": false,
              "notApplicableResource": false
            },
            "status": "published",
            "likeCount": 12,  
            "user": {
              "id": "25",
              "name": "Alice Chen",
              "_id": "e6903g88-055h-655d-f1g0-186550iij815",
              "roleList": ["citizen", "learner"],
              "photoURL": "https://lh3.googleusercontent.com/a/alice-profile=s96-c"
            },
            "resourceId": "123e4567-e89b-12d3-a456-426614174000",  // UUID 格式
            "createdAt": "2024-01-18T16:45:00Z",
            "updatedAt": "2024-01-19T10:20:00Z",
            "tags": ["beginner-friendly", "step-by-step", "clear-explanation"]
          }
        }
        ```
        
    - `POST /resources/{resourceId}/reviews`
        - 功能：新增心得。
        - 路徑參數：`{resourceId}` - 資源的 UUID
        - **說明**：
            - 心得評價也可以包含標籤，描述學習體驗的特色
            - 標籤會自動分類為學習相關的類別（如 `learning_style`, `teaching_method`）
        - 請求內容：
        
        ```jsx
        {
          "content": "這個教學寫得很清楚，步驟詳細，適合初學者...",
          "overallImpact": 5,
          "changeMindset": 4,
          "solveProblems": 5,
          "gainPerspectives": 4,
          "achieveGoals": 5,
        	"timeUsage": "1_2_hours_daily",
        	"contentFeatures": {
                "wellStructured": true,
                "practiceFocused": true,
                "wellRoundedConcepts": false,
                "thoughtProvoking": true,
                "progressiveLearning": false,
                "problemBased": false,
                "realWorldExamples": true,
                "interactive": false,
                "visuallyRich": true
              },
        	"resourceUsage": {
                "withOnlineCourses": true,
                "withBooks": false,
                "withOtherTools": true,
                "withCommunity": false,
                "onlyThisResource": false,
                "notApplicableResource": false
              },
          "tags": ["beginner-friendly", "step-by-step", "clear-explanation"]
        }
        ```
        
        - 回傳內容：
        
        ```jsx
        {
          "success": true,
          "data": {
            "id": "25",
            "content": "這個教學寫得很清楚，步驟詳細，適合初學者...",
            "overallImpact": 5,
            "changeMindset": 4,
            "solveProblems": 5,
            "gainPerspectives": 4,
            "achieveGoals": 5,
            "avgRating": 4.6,
        		"timeUsage": "1_2_hours_daily",
        		"contentFeatures": {
                "wellStructured": true,
                "practiceFocused": true,
                "wellRoundedConcepts": false,
                "thoughtProvoking": true,
                "progressiveLearning": false,
                "problemBased": false,
                "realWorldExamples": true,
                "interactive": false,
                "visuallyRich": true
              },
        		"resourceUsage": {
                "withOnlineCourses": true,
                "withBooks": false,
                "withOtherTools": true,
                "withCommunity": false,
                "onlyThisResource": false,
                "notApplicableResource": false
              },
            "status": "published",
            "likeCount": 0,  
            "user": {
              "id": 42,
              "name": "current_user",
              "_id": "d8902f77-944g-544c-d0f9-075449hhg704",
              "roleList": ["citizen", "developer"],
              "photoURL": "https://lh3.googleusercontent.com/a/current-user=s96-c"
            },
            "resourceId": "123e4567-e89b-12d3-a456-426614174000",  // UUID 格式
            "createdAt": "2024-01-25T15:30:00Z",
            "updatedAt": "2024-01-25T15:30:00Z",
            "tags": ["beginner-friendly", "step-by-step", "clear-explanation"]
          }
        }
        ```
        
    - `PATCH /resources/{resourceId}/reviews/{reviewId}`
        - 功能：更新心得內容。
        - 路徑參數：
            - `{resourceId}` - 資源的 UUID
            - `{reviewId}` - 心得評價的 ID (字串格式，內容為數字)
        - **說明**：
            - 更新時提供的 `tags` 會完全取代現有標籤
            - 如果不想改變標籤，請不要包含 `tags` 欄位
        - 請求內容：
        
        ```jsx
        {
          "content": "經過一段時間的使用，我對這個資源有了更深的理解...",
          "overallImpact": 5,
          "changeMindset": 5,
          "solveProblems": 5,
          "gainPerspectives": 4,
          "achieveGoals": 5,
      		"timeUsage": "1_2_hours_daily",
      		"contentFeatures": {
              "wellStructured": true,
              "practiceFocused": true,
              "wellRoundedConcepts": false,
              "thoughtProvoking": true,
              "progressiveLearning": false,
              "problemBased": false,
              "realWorldExamples": true,
              "interactive": false,
              "visuallyRich": true
            },
      		"resourceUsage": {
              "withOnlineCourses": true,
              "withBooks": false,
              "withOtherTools": true,
              "withCommunity": false,
              "onlyThisResource": false,
              "notApplicableResource": false
            },
          "tags": ["comprehensive", "updated-content", "production-ready"]
        }
        ```
        
        - 回傳內容：
        
        ```jsx
        {
          "success": true,
          "data": {
       	    "id": "89",
       	    "content": "經過一段時間的使用，我對這個資源有了更深的理解...",
       	    "overallImpact": 5,
       	    "changeMindset": 5,
       	    "solveProblems": 5,
       	    "gainPerspectives": 4,
       	    "achieveGoals": 5,
       		"avgRating": 4.8,
       		"timeUsage": "1_2_hours_daily",
       		"contentFeatures": {
              "wellStructured": true,
              "practiceFocused": true,
              "wellRoundedConcepts": false,
              "thoughtProvoking": true,
              "progressiveLearning": false,
              "problemBased": false,
              "realWorldExamples": true,
              "interactive": false,
              "visuallyRich": true
            },
       		"resourceUsage": {
              "withOnlineCourses": true,
              "withBooks": false,
              "withOtherTools": true,
              "withCommunity": false,
              "onlyThisResource": false,
              "notApplicableResource": false
            },
            "status": "published",
            "likeCount": 12,  
            "user": {
              "id": 42,
              "name": "current_user",
              "_id": "d8902f77-944g-544c-d0f9-075449hhg704",
              "roleList": ["citizen", "developer"],
              "photoURL": "https://lh3.googleusercontent.com/a/current-user=s96-c"
            },
            "resourceId": "123e4567-e89b-12d3-a456-426614174000",  // UUID 格式
            "createdAt": "2024-01-25T15:30:00Z",
            "updatedAt": "2024-01-26T10:30:00Z",
       	    "tags": ["comprehensive", "updated-content", "production-ready"]
          }
        }
        ```
        
    - `DELETE /resources/{resourceId}/reviews/{reviewId}`
        - 功能：刪除心得。
        - 路徑參數：
            - `{resourceId}` - 資源的 UUID
            - `{reviewId}` - 心得評價的 ID (字串格式，內容為數字)

    - `PATCH /resources/{resourceId}/reviews/{reviewId}/status`
        - 功能：更新評論狀態。
        - 路徑參數：
            - `{resourceId}` - 資源的 UUID
            - `{reviewId}` - 心得評價的 ID (字串格式，內容為數字)
        - 請求內容：
        ```jsx
        {
          "status": "archived"  // draft, published, archived, reported
        }
        ```
        - ⚠️ **新增 API**

    - `POST /resources/{resourceId}/reviews/{reviewId}/like`
        - 功能：對資源評論點讚。
        - 路徑參數：
            - `{resourceId}` - 資源的 UUID
            - `{reviewId}` - 心得評價的 ID (字串格式，內容為數字)
        - ⚠️ **新增 API**

    - `DELETE /resources/{resourceId}/reviews/{reviewId}/like`
        - 功能：取消對資源評論的點讚。
        - 路徑參數：
            - `{resourceId}` - 資源的 UUID
            - `{reviewId}` - 心得評價的 ID (字串格式，內容為數字)
        - ⚠️ **新增 API**

---

### 📌 注意事項
- **分類欄位統一使用唯一識別名稱**：
  - 創建資源：使用 `majorCategory` 和 `subCategory` (string，如: 'nature_environment', 'earth_science')
  - 更新資源：使用 `majorCategory` 和 `subCategory` (string，如: 'nature_environment', 'earth_science')
  - 查詢和回應：使用 `majorCategory` 和 `subCategory` (string，如: 'nature_environment', 'earth_science')
  - 分類名稱為唯一的 key 值，採用 snake_case 格式
- **評論 ID 格式變更**：
  - API 回傳：字串格式 (`"25"`)
  - 路徑參數傳入：字串格式 (`/reviews/25`)
  - 後端處理：自動轉換為數字進行資料庫操作
- 所有時間使用 ISO 8601 格式

### 🎯 前端實現建議

**資源列表頁面 - 查看更多模式**：
1. 首次載入：`GET /resources?limit=5`
2. 點擊「查看更多」：`GET /resources?cursor={nextCursor}&limit=5`
3. 直到 `hasNext: false` 時隱藏「查看更多」按鈕

**資源詳情頁面**：
1. 資源資訊：`GET /resources/{id}` (只獲取資源基本資訊和統計)
2. 評論列表：`GET /resources/{id}/reviews?limit=2` (獨立載入評論)

**評論查看更多實現**：
1. 首次載入：`GET /resources/{id}/reviews?limit=2`
2. 點擊「查看更多」：`GET /resources/{id}/reviews?cursor={nextCursor}&limit=2`
3. 直到 `hasNext: false` 時隱藏「查看更多」按鈕