# 通知系統實作任務清單

**專案**: DaoDao 通知系統開發
**開始日期**: TBD
**預計完成**: TBD

---

## 📋 任務總覽

```
總進度: [ ▰▰▰▰▰▰▱▱▱▱ ] 0/40 (0%)

階段一: 基礎架構   [ ▱▱▱▱▱▱▱▱▱▱ ] 0/12 (0%)
階段二: 通知發送   [ ▱▱▱▱▱▱▱▱▱▱ ] 0/11 (0%)
階段三: 即時通知   [ ▱▱▱▱▱▱▱▱▱▱ ] 0/9  (0%)
階段四: 進階功能   [ ▱▱▱▱▱▱▱▱▱▱ ] 0/8  (0%)
```

---

## 🏗️ 階段一: 基礎架構 (預計 2 週)

### 1.1 資料庫設計與遷移

- [ ] **創建通知系統 Prisma Schema**
  - 檔案: `prisma/schema.prisma`
  - 添加 4 個新資料表:
    - `notifications` (通知主表)
    - `notification_channels` (通知渠道記錄)
    - `notification_preferences` (通知偏好設定)
    - `notification_templates` (通知模板)
  - 估計: 2 小時

- [ ] **生成並執行資料庫遷移**
  ```bash
  pnpm run prisma:generate
  npx prisma migrate dev --name add_notification_system
  ```
  - 估計: 0.5 小時

- [ ] **創建預設通知模板**
  - 檔案: `prisma/seeds/notification-templates.seed.ts`
  - 創建基礎模板 (評論、按讚、里程碑等)
  - 估計: 3 小時

- [ ] **為現有用戶創建預設通知偏好**
  - 檔案: `prisma/seeds/notification-preferences.seed.ts`
  - 使用 Prisma 批次創建
  - 估計: 2 小時

### 1.2 TypeScript 型別定義

- [ ] **創建通知型別定義**
  - 檔案: `src/types/notification.types.ts`
  - 內容:
    - NotificationType 枚舉
    - NotificationPriority 枚舉
    - NotificationChannel 枚舉
    - NotificationStatus 枚舉
    - 相關介面定義
  - 估計: 2 小時

- [ ] **創建 Zod 驗證器**
  - 檔案: `src/validators/notification.validators.ts`
  - 內容:
    - CreateNotificationSchema
    - UpdateNotificationPreferenceSchema
    - NotificationQuerySchema
  - 估計: 2 小時

### 1.3 核心服務實現

- [ ] **實現 NotificationService**
  - 檔案: `src/services/notification/notification.service.ts`
  - 功能:
    - `createNotification()` - 創建通知
    - `getNotificationsByUserId()` - 查詢用戶通知
    - `markAsRead()` - 標記已讀
    - `markAllAsRead()` - 全部標記已讀
    - `deleteNotification()` - 刪除(歸檔)通知
    - `getUnreadCount()` - 未讀數量
  - 估計: 6 小時

- [ ] **實現 NotificationPreferenceService**
  - 檔案: `src/services/notification/notification-preference.service.ts`
  - 功能:
    - `getPreferences()` - 獲取用戶偏好
    - `updatePreferences()` - 更新用戶偏好
    - `checkIfEnabled()` - 檢查通知是否開啟
  - 估計: 3 小時

- [ ] **實現 NotificationTemplateService**
  - 檔案: `src/services/notification/notification-template.service.ts`
  - 功能:
    - `getTemplate()` - 獲取模板
    - `renderTemplate()` - 渲染模板(變數替換)
    - 使用 Handlebars 模板引擎
  - 估計: 4 小時

### 1.4 API 端點實現

- [ ] **創建通知路由**
  - 檔案: `src/routes/notification.routes.ts`
  - 端點:
    ```
    GET    /api/v1/notifications
    GET    /api/v1/notifications/unread-count
    GET    /api/v1/notifications/:id
    PATCH  /api/v1/notifications/:id/read
    PATCH  /api/v1/notifications/mark-all-read
    DELETE /api/v1/notifications/:id
    GET    /api/v1/notifications/preferences
    PUT    /api/v1/notifications/preferences
    ```
  - 估計: 4 小時

- [ ] **創建通知控制器**
  - 檔案: `src/controllers/notification.controller.ts`
  - 實現所有路由對應的控制器方法
  - 添加完整的 Swagger 註解
  - 估計: 5 小時

- [ ] **添加 Swagger 文檔定義**
  - 檔案: `src/swagger/schemas/notification.schemas.ts`
  - 定義所有 API 的請求/回應格式
  - 估計: 2 小時

---

## 🚀 階段二: 通知發送機制 (預計 2 週)

### 2.1 消息隊列設置

- [ ] **安裝並配置 Bull 隊列**
  ```bash
  pnpm add bull @types/bull
  ```
  - 估計: 0.5 小時

- [ ] **創建隊列服務**
  - 檔案: `src/services/notification/notification-queue.service.ts`
  - 創建三個優先級隊列:
    - `notifications-high` (高優先級)
    - `notifications-medium` (中優先級)
    - `notifications-low` (低優先級)
  - 估計: 3 小時

- [ ] **實現隊列處理器**
  - 檔案: `src/services/notification/queue-processor.service.ts`
  - 功能:
    - 從隊列取出任務
    - 根據通知類型調用對應的發送服務
    - 記錄發送狀態
    - 失敗重試機制
  - 估計: 5 小時

### 2.2 事件觸發系統

- [ ] **創建事件處理器**
  - 檔案: `src/services/notification/notification-event-handler.service.ts`
  - 功能:
    - `onCommentReceived()` - 收到評論事件
    - `onCommentReply()` - 評論回覆事件
    - `onContentLiked()` - 內容按讚事件
    - `onMilestoneDueSoon()` - 里程碑到期事件
    - ... (其他事件)
  - 估計: 6 小時

- [ ] **整合到評論服務**
  - 檔案: `src/services/comment.service.ts`
  - 在創建評論、回覆評論時觸發通知
  - 估計: 2 小時

- [ ] **整合到資源服務**
  - 檔案: `src/services/resource.service.ts`
  - 在按讚、收藏時觸發通知
  - 估計: 2 小時

- [ ] **整合到專案服務**
  - 檔案: `src/services/project.service.ts`
  - 在里程碑到期前觸發提醒
  - 估計: 2 小時

- [ ] **整合到實踐服務**
  - 檔案: `src/services/practice.service.ts`
  - 在打卡提醒、成就達成時觸發通知
  - 估計: 2 小時

### 2.3 郵件通知整合

- [ ] **擴展郵件服務**
  - 檔案: `src/services/email/enhanced-email.service.ts`
  - 添加通知郵件發送方法
  - 估計: 2 小時

- [ ] **創建通知郵件模板**
  - 目錄: `src/services/email/templates/notification/`
  - 模板:
    - `comment-notification.ts`
    - `milestone-reminder.ts`
    - `practice-reminder.ts`
    - `daily-digest.ts`
  - 估計: 4 小時

- [ ] **實現郵件發送隊列處理器**
  - 檔案: `src/services/notification/email-notification-processor.service.ts`
  - 從隊列取出郵件通知任務並發送
  - 估計: 3 小時

---

## ⚡ 階段三: 即時通知 (預計 2 週)

### 3.1 WebSocket 基礎設置

- [ ] **安裝 Socket.IO**
  ```bash
  pnpm add socket.io @types/socket.io
  ```
  - 估計: 0.5 小時

- [ ] **創建 WebSocket 服務**
  - 檔案: `src/services/notification/websocket.service.ts`
  - 功能:
    - WebSocket 伺服器初始化
    - 用戶連接管理
    - Socket 認證 (JWT 驗證)
  - 估計: 5 小時

- [ ] **實現用戶連接映射**
  - 維護 `userId -> socketId[]` 映射表
  - 處理多設備登入情境
  - 估計: 2 小時

- [ ] **整合到 Express 應用**
  - 檔案: `src/server.ts`
  - 將 Socket.IO 附加到 HTTP 伺服器
  - 估計: 1 小時

### 3.2 即時推送實現

- [ ] **實現即時推送方法**
  - 檔案: `src/services/notification/websocket.service.ts`
  - 功能:
    - `sendToUser()` - 發送給單個用戶
    - `sendToUsers()` - 發送給多個用戶
    - `broadcast()` - 廣播通知
  - 估計: 3 小時

- [ ] **整合到隊列處理器**
  - 高優先級通知通過 WebSocket 即時推送
  - 估計: 2 小時

### 3.3 前端整合支援

- [ ] **創建 WebSocket 連接文檔**
  - 檔案: `docs/noti_feature/WEBSOCKET_INTEGRATION.md`
  - 內容:
    - 連接方式
    - 認證方式
    - 事件監聽
    - 範例代碼
  - 估計: 2 小時

- [ ] **創建測試頁面**
  - 檔案: `public/notification-test.html`
  - 簡單的 HTML 頁面測試 WebSocket 連接和通知接收
  - 估計: 2 小時

- [ ] **編寫單元測試**
  - 檔案: `src/tests/unit/services/websocket.service.test.ts`
  - 測試連接、認證、推送功能
  - 估計: 3 小時

---

## 🌟 階段四: 進階功能 (預計 2 週)

### 4.1 通知聚合與摘要

- [ ] **實現通知聚合邏輯**
  - 檔案: `src/services/notification/notification-aggregation.service.ts`
  - 功能:
    - 相似通知合併 ("小明和其他 5 人按讚了...")
    - 聚合規則定義
  - 估計: 4 小時

- [ ] **實現每日摘要功能**
  - 檔案: `src/services/notification/daily-digest.service.ts`
  - 功能:
    - 收集當日通知
    - 生成摘要郵件
    - 定時發送
  - 估計: 4 小時

- [ ] **配置定時任務**
  - 安裝 node-cron: `pnpm add node-cron @types/node-cron`
  - 檔案: `src/services/notification/notification-scheduler.service.ts`
  - 任務:
    - 每日摘要發送 (每天早上 9:00)
    - 里程碑到期檢查 (每天凌晨 1:00)
    - 通知自動歸檔 (每週日凌晨 3:00)
  - 估計: 3 小時

### 4.2 通知管理功能

- [ ] **實現通知自動歸檔**
  - 30 天以上的已讀通知自動歸檔
  - 估計: 2 小時

- [ ] **創建管理員統計面板 API**
  - 端點:
    ```
    GET /api/v1/admin/notifications/stats
    GET /api/v1/admin/notifications/failed
    POST /api/v1/admin/notifications/retry/:id
    ```
  - 估計: 4 小時

- [ ] **實現失敗通知重試**
  - 檔案: `src/services/notification/notification-retry.service.ts`
  - 指數退避重試策略
  - 估計: 3 小時

### 4.3 性能優化

- [ ] **添加 Redis 快取**
  - 快取未讀通知數量
  - 快取用戶通知偏好
  - 快取通知模板
  - 估計: 3 小時

- [ ] **優化資料庫查詢**
  - 檢查並添加必要的索引
  - 優化分頁查詢
  - 估計: 2 小時

- [ ] **編寫整合測試**
  - 檔案: `src/tests/integration/notification-api.test.ts`
  - 測試完整的通知發送流程
  - 估計: 4 小時

---

## 🧪 測試與部署

### 測試清單

- [ ] **單元測試**
  - [ ] NotificationService 測試
  - [ ] NotificationPreferenceService 測試
  - [ ] NotificationTemplateService 測試
  - [ ] WebSocket 服務測試
  - [ ] 隊列處理器測試

- [ ] **整合測試**
  - [ ] API 端點測試
  - [ ] 通知發送流程測試
  - [ ] WebSocket 連接測試
  - [ ] 郵件發送測試

- [ ] **性能測試**
  - [ ] 並發通知發送測試 (目標: 1000 通知/分鐘)
  - [ ] WebSocket 連接壓力測試
  - [ ] 資料庫查詢性能測試

### 文檔清單

- [ ] **API 文檔**
  - [ ] Swagger 文檔完整性檢查
  - [ ] 添加範例請求/回應

- [ ] **開發者文檔**
  - [x] 通知系統設計指南 (已完成)
  - [ ] WebSocket 整合指南
  - [ ] 通知模板開發指南

- [ ] **運維文檔**
  - [ ] 部署指南
  - [ ] 監控與告警設置
  - [ ] 故障排除手冊

### 部署準備

- [ ] **環境變數配置**
  - 添加到 `.env.dev` 和 `.env.prod`:
    ```
    # 通知系統配置
    NOTIFICATION_QUEUE_REDIS_URL=...
    NOTIFICATION_WEBSOCKET_PORT=...
    NOTIFICATION_DAILY_DIGEST_TIME=09:00
    NOTIFICATION_RETENTION_DAYS=30
    ```

- [ ] **資料庫遷移**
  - [ ] 在開發環境執行遷移
  - [ ] 在測試環境執行遷移
  - [ ] 準備生產環境遷移腳本

- [ ] **監控設置**
  - [ ] 通知發送成功率監控
  - [ ] 隊列處理延遲監控
  - [ ] WebSocket 連接數監控
  - [ ] 郵件發送失敗告警

---

## 📊 進度追蹤

### 本週目標 (Week X)

- [ ] 任務 1
- [ ] 任務 2
- [ ] 任務 3

### 已完成

- [x] 2025-12-16: 創建通知系統設計文檔

### 遇到的問題

*記錄開發過程中遇到的問題和解決方案*

---

### 下次會議討論事項

1.
2.
3.

---

**最後更新**: 2025-12-16
**負責人**: TBD
