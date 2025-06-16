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
        | limit | integer | 否 | 每頁筆數，預設 20，最大 100 | `20` |
        | type | string | 否 | 資源類型過濾 | `learning_platform_app`, `learning_tools`, `books_articles`, `video_content`, `podcast_content`, `workshops_courses`, `professional_certificates`, `community_organization`, `other` |
        | cost | string | 否 | 費用類型過濾 | `free` |
        | level | string | 否 | 適合過濾 | `beginner` |
        | majorCategory | string | 否 | 主分類key | `nature_environment` |
        | subCategory | string | 否 | 子分類key | `earth_science` |
        | tags | string | 否 | 標籤過濾，多個用逗號分隔 | `react,javascript` |
        | sort | string | 否 | 排序方式 | `createdAt`, `updatedAt`, `rating`, `viewCount` |
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
                "id": 156,
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
                "majorCategoryId": 1,
                "subCategoryId": 5,
                "user": {
                  "id": 2,
                  "name": "小許",
                  "_id": "b4996c36-722d-409b-a5c6-853827ddc471",
                  "roleList": ["citizen", "experimental-educator", "other"],
                  "photoURL": "https://lh3.googleusercontent.com/a/ACg8ocJ3YjTVznTRc8401zw3ta7c3QaZYb5lDy3497cbCmZYM79s3LoZ=s96-c"
                },
                "createdAt": "2024-01-25T09:15:00Z",
                "updatedAt": "2024-01-25T14:20:00Z",
                "tags": ["react", "javascript", "frontend"]
              },
              {
                "id": 155,
                "name": "Vue.js 完整指南",
                "url": "https://vuejs.org/guide/",
                "imageUrl": "https://vuejs.org/images/logo.png",
                "description": "Vue.js 官方完整學習指南",
                "type": "learning_platform_app",
                "level": "beginner",
                "cost": "free",
                "majorCategoryId": 1,
                "subCategoryId": 5,
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
                // ... 其他欄位
              }
              // ... 更多資源
            ],
            "pagination": {
              "limit": 20,
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
        - 回傳內容：
        
        ```jsx
        {
          "success": true,
          "data": {
            "id": 1,
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
            "majorCategory": "frontend_development",
            "subCategory": "javascript_frameworks",
            "user": {
              "name": "小許",
              "id": 42,
              "_id": "b4996c36-722d-409b-a5c6-853827ddc471",
              "roleList": ["citizen", "experimental-educator", "other"],
              "photoURL": "https://lh3.googleusercontent.com/a/ACg8ocJ3YjTVznTRc8401zw3ta7c3QaZYb5lDy3497cbCmZYM79s3LoZ=s96-c"
            },
            "createdAt": "2024-01-15T10:30:00Z",
            "updatedAt": "2024-01-20T14:20:00Z",
            "tags": ["react", "javascript", "frontend"],
            "recentReviews": [
              {
                "id": 1,
                "content": "很棒的入門教學",
                "avgRating": 4.5,
                "likesCount": 12,
                "status": "published",
                "createdAt": "2024-01-18T16:45:00Z",
                "updatedAt": "2024-01-20T14:20:00Z",
                "tags": ["react", "javascript", "frontend"],
                "user": {
                  "id": 42,
                  "name": "Alice Chen",
                  "_id": "c5897d55-833f-433b-c9e8-964449ggf593",
                  "roleList": ["citizen"],
                  "photoURL": "https://lh3.googleusercontent.com/a/profile-photo=s96-c"
                }
              }
            ]
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
          "majorCategoryId": 1,
          "subCategoryId": 5,
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
              "id": 157,
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
              "majorCategory": "frontend_development",
              "subCategory": "javascript_frameworks",
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
              "id": 89,
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
              "likesCount": 0,
              "user": {
                "id": 42,
                "name": "current_user",
                "_id": "d8902f77-944g-544c-d0f9-075449hhg704",
                "roleList": ["citizen", "developer"],
                "photoURL": "https://lh3.googleusercontent.com/a/current-user=s96-c"
              },
              "resourceId": 157,
              "createdAt": "2024-01-25T09:15:00Z",
              "updatedAt": "2024-01-25T09:15:00Z",
              "tags": ["comprehensive", "official-docs", "well-organized"]
            }
          }
        }
        ```
        
    - `PATCH /resources/{id}`
        - 功能：更新指定資源內容。
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
              "id": 157,
              "name": "Vue.js 完整指南 - 更新版",
              "description": "更新後的描述...",
              "reviewCount": 1,
              "avgRating": 4.8,
              "updatedAt": "2024-01-26T10:30:00Z"
              // ... 其他欄位
            },
        	 "review": {
        	    "id": 89,
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

### **3.5 資源心得分享模組（進行中）**

- **功能描述**：
    - 用戶可以撰寫學習心得，並對資源進行評價與反饋。
- **功能細節**：
- **API 設計**：
    - `GET /resources/{id}/reviews`
        - 功能：獲取指定資源的所有心得。
        - 篩選參數：
        
        | 參數 | 類型 | 必填 | 描述 | 範例 |
        | --- | --- | --- | --- | --- |
        | cursor | string | 否 | 游標位置，用於分頁 | `eyJpZCI6MTU2LCJjcmVhdGVkX2F0IjoiMjAyNC0wMS0yNVQwOToxNTowMFoifQ==` |
        | limit | integer | 否 | 每頁筆數，預設 6，最大 100 | `6` |
        | sort| string | 否 | 排序方式 | `createdAt`, `updatedAt`, `rating`, `viewCount` |
        | order | string | 否 | 排序方向 | `desc`, `asc` |
        - 回傳內容：
        
        ```jsx
        {
          "success": true,
          "data": {
            "reviews": [
              {
                "id": 25,
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
                "likesCount": 12,
                "helpfulCount": 8,
                "userId": 25,
                "user": {
                  "id": 25,
                  "name": "Alice Chen",
                  "_id": "e6903g88-055h-655d-f1g0-186550iij815",
                  "roleList": ["citizen", "learner"],
                  "photoURL": "https://lh3.googleusercontent.com/a/alice-profile=s96-c"
                },
                "createdAt": "2024-01-18T16:45:00Z",
                "updatedAt": "2024-01-19T10:20:00Z"
              }
              // ... 更多心得
            ],
            "pagination": {
              "limit": 20,
              "hasNext": true,
              "hasPrev": false,
              "nextCursor": "eyJpZCI6MjAsImNyZWF0ZWRfYXQiOiIyMDI0LTAxLTE4VDE2OjQ1OjAwWiJ9",
              "prevCursor": null,
              "totalEstimate": 15
            }
          }
        }
        ```
        
    - `GET /resources/{id}/reviews/{reviewId}`
        - 功能：獲取指定資源的單一心得詳細內容。
        - 回傳內容：
        
        ```jsx
        {
          "success": true,
          "data": {
            "id": 25,
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
            "likesCount": 12,
            "helpfulCount": 8,
            "user": {
              "id": 25,
              "name": "Alice Chen",
              "_id": "e6903g88-055h-655d-f1g0-186550iij815",
              "roleList": ["citizen", "learner"],
              "photoURL": "https://lh3.googleusercontent.com/a/alice-profile=s96-c"
            },
            "resourceId": 1,
            "createdAt": "2024-01-18T16:45:00Z",
            "updatedAt": "2024-01-19T10:20:00Z",
            "tags": ["beginner-friendly", "step-by-step", "clear-explanation"]
          }
        }
        ```
        
    - `POST /resources/{id}/reviews`
        - 功能：新增心得。
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
            "id": 25,
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
            "likesCount": 0,
            "helpfulCount": 0,
            "user": {
              "name": "current_user",
              "_id": "d8902f77-944g-544c-d0f9-075449hhg704",
              "roleList": ["citizen", "developer"],
              "photoURL": "https://lh3.googleusercontent.com/a/current-user=s96-c"
            },
            "resourceId": 1,
            "createdAt": "2024-01-25T15:30:00Z",
            "updatedAt": "2024-01-25T15:30:00Z",
            "tags": ["beginner-friendly", "step-by-step", "clear-explanation"]
          }
        }
        ```
        
    - `PATCH /resources/{id}/reviews/{id}`
        - 功能：更新心得內容。
        - **說明**：
            - 更新時提供的 `tags` 會完全取代現有標籤
            - 如果不想改變標籤，請不要包含 `tags` 欄位
        - 請求內容：
        
        ```jsx
        {
          "review": {
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
        	 "review": {
        	    "id": 89,
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
        
    - `DELETE /resources/{id}/reviews/{id}`
        - 功能：刪除心得。