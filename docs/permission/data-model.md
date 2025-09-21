# 權限管理系統資料模型

## 核心實體

### User (使用者)
現有實體，需要增強權限相關欄位

**主要屬性:**
- `id`: 唯一識別碼
- `email`: 電子郵件
- `isTemp`: 是否為臨時使用者
- `roles`: 使用者角色列表
- `createdAt`: 建立時間
- `updatedAt`: 更新時間

**新增屬性:**
- `lastRoleChange`: 最後角色變更時間
- `permissionCacheVersion`: 權限快取版本

**關係:**
- 一對多：UserRole (使用者角色)
- 一對多：ResourceOwnership (資源擁有權)
- 一對多：PermissionGrant (權限授予)
- 一對多：AuditLog (審計記錄)

### Role (角色)
現有常數，需要實體化為資料表

**主要屬性:**
- `id`: 角色 ID
- `name`: 角色名稱 (guest, user, editor, moderator, admin, super_admin)
- `displayName`: 顯示名稱
- `level`: 角色層級 (0-5)
- `description`: 角色描述
- `isActive`: 是否啟用
- `createdAt`: 建立時間

**關係:**
- 一對多：UserRole (使用者角色)
- 一對多：RolePermission (角色權限)

### Permission (權限)
現有常數，需要實體化為資料表

**主要屬性:**
- `id`: 權限 ID
- `resource`: 資源類型 (user, project, resource, etc.)
- `action`: 動作類型 (create, read, update, delete, etc.)
- `code`: 權限代碼 (resource:action)
- `displayName`: 顯示名稱
- `description`: 權限描述
- `isActive`: 是否啟用

**關係:**
- 一對多：RolePermission (角色權限)
- 一對多：PermissionGrant (權限授予)

### UserRole (使用者角色)
新增實體，管理使用者角色關係

**主要屬性:**
- `id`: 唯一識別碼
- `userId`: 使用者 ID
- `roleId`: 角色 ID
- `assignedBy`: 指派者 ID
- `assignedAt`: 指派時間
- `expiresAt`: 過期時間 (可選)
- `isActive`: 是否啟用

**關係:**
- 多對一：User (使用者)
- 多對一：Role (角色)

### RolePermission (角色權限)
新增實體，管理角色權限關係

**主要屬性:**
- `id`: 唯一識別碼
- `roleId`: 角色 ID
- `permissionId`: 權限 ID
- `createdAt`: 建立時間

**關係:**
- 多對一：Role (角色)
- 多對一：Permission (權限)

### ResourceOwnership (資源擁有權)
新增實體，管理資源擁有權

**主要屬性:**
- `id`: 唯一識別碼
- `userId`: 擁有者 ID
- `resourceType`: 資源類型 (idea, project, review, note, etc.)
- `resourceId`: 資源 ID
- `ownershipType`: 擁有權類型 (owner, collaborator, viewer)
- `createdAt`: 建立時間
- `updatedAt`: 更新時間

**關係:**
- 多對一：User (使用者)

### PermissionGrant (權限授予)
新增實體，管理特定權限授予

**主要屬性:**
- `id`: 唯一識別碼
- `granterId`: 授予者 ID
- `granteeId`: 被授予者 ID
- `permissionId`: 權限 ID
- `resourceType`: 資源類型
- `resourceId`: 資源 ID (可選，null 表示全域權限)
- `expiresAt`: 過期時間 (可選)
- `isActive`: 是否啟用
- `createdAt`: 建立時間

**關係:**
- 多對一：User (授予者)
- 多對一：User (被授予者)
- 多對一：Permission (權限)

### AuditLog (審計記錄)
新增實體，記錄權限相關事件

**主要屬性:**
- `id`: 唯一識別碼
- `userId`: 使用者 ID (可選)
- `action`: 動作類型 (login, permission_check, role_change, etc.)
- `resourceType`: 資源類型 (可選)
- `resourceId`: 資源 ID (可選)
- `result`: 結果 (success, denied, error)
- `ipAddress`: IP 位址
- `userAgent`: 使用者代理
- `sessionId`: 會話 ID
- `details`: 詳細資訊 (JSON)
- `createdAt`: 建立時間

**關係:**
- 多對一：User (使用者)

## 資料驗證規則

### User 驗證
- `email`: 必填，格式驗證，唯一性
- `isTemp`: 布林值，預設 false
- `lastRoleChange`: 不可未來時間
- `permissionCacheVersion`: 非負整數

### Role 驗證
- `name`: 必填，唯一性，符合預定義角色
- `level`: 0-5 範圍，唯一性
- `displayName`: 必填，長度限制

### Permission 驗證
- `resource`: 必填，符合預定義資源類型
- `action`: 必填，符合預定義動作
- `code`: 必填，格式為 "resource:action"，唯一性

### UserRole 驗證
- `userId`: 必填，存在性檢查
- `roleId`: 必填，存在性檢查
- `expiresAt`: 不可過去時間
- 同一使用者不可有重複的角色

### ResourceOwnership 驗證
- `userId`: 必填，存在性檢查
- `resourceType`: 必填，符合預定義類型
- `resourceId`: 必填，正整數
- `ownershipType`: 必填，符合預定義類型
- 同一資源的主要擁有者唯一性

### PermissionGrant 驗證
- `granterId`: 必填，存在性檢查
- `granteeId`: 必填，存在性檢查，不可與 granterId 相同
- `permissionId`: 必填，存在性檢查
- `expiresAt`: 不可過去時間

### AuditLog 驗證
- `action`: 必填，符合預定義動作
- `result`: 必填，符合預定義結果
- `ipAddress`: IPv4/IPv6 格式驗證
- `details`: 有效 JSON 格式

## 狀態轉換

### UserRole 狀態轉換
1. **新增**: active = true, assignedAt = now
2. **過期**: active = false (自動)
3. **撤銷**: active = false (手動)

### PermissionGrant 狀態轉換
1. **授予**: active = true, createdAt = now
2. **過期**: active = false (自動)
3. **撤銷**: active = false (手動)

### ResourceOwnership 狀態轉換
1. **建立**: ownershipType = 'owner'
2. **轉移**: 舊記錄失效，新記錄建立
3. **共享**: 新增 collaborator/viewer 記錄

## 索引設計

### 效能索引
- `users`: (email), (isTemp), (lastRoleChange)
- `user_roles`: (userId, isActive), (roleId), (expiresAt)
- `resource_ownership`: (userId, resourceType), (resourceType, resourceId)
- `permission_grants`: (granteeId, isActive), (resourceType, resourceId)
- `audit_logs`: (userId, createdAt), (action, createdAt), (ipAddress)

### 複合索引
- `user_roles`: (userId, roleId, isActive)
- `resource_ownership`: (resourceType, resourceId, ownershipType)
- `permission_grants`: (granteeId, permissionId, isActive)

## 快取策略

### Redis 快取鍵設計
- 使用者角色: `user:roles:{userId}`
- 使用者權限: `user:permissions:{userId}`
- 資源擁有權: `resource:ownership:{resourceType}:{resourceId}`
- 權限檢查結果: `permission:check:{userId}:{resource}:{action}`

### 快取失效策略
- 角色變更時清除使用者相關快取
- 權限授予/撤銷時清除相關快取
- 資源擁有權變更時清除資源快取
- 設定合理的 TTL (Time To Live)