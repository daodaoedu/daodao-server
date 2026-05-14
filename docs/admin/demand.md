缺少的 API 一覽
根據 Admin 介面規劃，對照 packages/api/src/types.ts 中實際存在的後端 API，以下是需要後端新增的 API：

1. Admin 使用者列表與管理
缺少的 API	需求頁面	說明
GET /api/v1/admin/users	使用者詳情頁的入口	沒有 admin 專用的使用者列表 API。現有的 GET /api/v1/users 是公開 API，缺少 admin 需要的欄位（email_verified、is_active、roles、permissions）。admin 需要能搜尋、篩選角色、篩選 email 驗證狀態的完整使用者列表
GET /api/v1/admin/users/{userId}	/admin/users/[userId]	沒有 admin 專用的使用者詳情 API。現有的 GET /api/v1/users/{id} 回傳 FormattedUserResponse，缺少 email_verified、email_verified_at、is_active、roles[]、permissions[] 等管理必要欄位。這些欄位只出現在 GET /api/v1/me/auth 回傳中（僅限當前用戶自己）
PUT /api/v1/admin/users/{userId}/status	使用者管理	無法停用/啟用使用者。is_active 欄位存在於 auth 資料中，但沒有 API 可以修改它
2. Admin 實踐統計
缺少的 API	需求頁面	說明
GET /api/v1/admin/practices/stats	/admin/practices	沒有全站級別的實踐統計 API。現有的 GET /api/v1/practices/stats 和 GET /api/v1/me/practice-stats 都是個別使用者的統計，回傳的是 PracticeUserStats（某用戶的 totalPractices、activePractices 等）。Admin 需要的是全站統計：全站總實踐數、全站活躍實踐數、全站總簽到次數等
GET /api/v1/admin/practices/overview	/admin 總覽	儀表板上需要顯示實踐相關的 KPI，但沒有 API 提供
3. DAU/WAU/MAU 時間序列
缺少的 API	需求頁面	說明
GET /api/v1/admin/user-stats/active-users/trend	/admin 總覽	現有的 active-users API 只回傳當前快照（dau=156, wau=534, mau=892）加上趨勢百分比，不是時間序列資料。如果要畫折線圖需要歷史數據（例如過去 30 天每天的 DAU）
4. 郵件發送歷史記錄
缺少的 API	需求頁面	說明
GET /api/v1/email/history 或 GET /api/v1/email/logs	/admin/email	現有的 GET /api/v1/email/stats 只有聚合統計（totalSent、totalFailed、successRate、byTemplate）。Admin 需要發送歷史記錄列表：每封郵件的收件人、模板類型、發送時間、成功/失敗狀態，才能做問題排查
5. 使用者登入歷史（Admin 視角）
缺少的 API	需求頁面	說明
GET /api/v1/admin/users/{userId}/login-history	/admin/users/[userId]	現有的 GET /api/v1/users/me/login-history 只能查自己的登入歷史。Admin 需要能查看任意使用者的登入記錄（時間、IP、裝置）
GET /api/v1/admin/users/{userId}/activity-stats	/admin/users/[userId]	同上，GET /api/v1/users/me/activity-stats 只限當前用戶
6. Auth 系統缺少 role 資訊
缺少的部分	影響範圍	說明
GET /api/v1/me/auth 的 roles/permissions 未被前端使用	整個 Admin 權限保護	後端的 /api/v1/me/auth 已回傳 roles[] 和 permissions[]，但前端 AuthProvider 完全沒有解析這些欄位。StoredUser 只存了 id, customId, email, name, photoUrl。這不是後端缺 API，而是前端沒串接
總結
缺少 API（需後端新增）        5 個
├── GET  /api/v1/admin/users                    使用者列表（含 email_verified、roles）
├── GET  /api/v1/admin/users/{userId}           使用者詳情（含完整管理欄位）
├── GET  /api/v1/admin/practices/stats          全站實踐統計
├── GET  /api/v1/admin/user-stats/active-users/trend   DAU/WAU/MAU 歷史趨勢
└── GET  /api/v1/email/history                  郵件發送歷史記錄

可以後續再加（Nice to have）     3 個
├── PUT  /api/v1/admin/users/{userId}/status    停用/啟用使用者
├── GET  /api/v1/admin/users/{userId}/login-history    查看用戶登入記錄
└── GET  /api/v1/admin/users/{userId}/activity-stats   查看用戶活躍統計

前端需串接（後端已有，前端未用）   1 個
└── /api/v1/me/auth 的 roles[] / permissions[]  → 需更新 StoredUser + AuthProvider

最關鍵的是前 2 個：沒有 admin user list/detail API，使用者管理頁面完全無法運作。建議優先請後端新增。