# Permission Configuration Issues and Solutions Guide

## 問題分析

根據 API 錯誤 `權限不足` 的分析，發現專案的權限系統存在配置不完整的問題。

### 錯誤場景
- **API 端點**: `POST /api/v1/projects/`
- **所需權限**: `project:create`
- **錯誤類型**: `ForbiddenError: 權限不足`
- **用戶角色**: `["Mentor", "citizen", "experimental-educator", "other"]`
- **用戶權限**: `[]` (空數組)

## 系統架構分析

### 權限系統設計
專案使用基於角色的訪問控制 (RBAC) 系統：

```
User -> Role -> Role_Permissions -> Permissions
```

### 資料庫結構
```sql
-- 核心權限表
permissions (id, name, description)
roles (id, name, description)
role_permissions (role_id, permission_id)
user_permissions (user_id, permission_id)
users (id, role_id, ...)
```

### 權限檢查邏輯
位於 `src/services/auth/permission.service.ts:51-53`：
```typescript
const hasRolePermission = user.roles?.role_permissions?.some(
  rp => rp.permissions && rp.permissions.name === `${resource}:${action}`
);
```

## 識別的問題

### 1. 資料庫權限數據缺失
- **問題**: 資料庫中沒有初始化權限數據
- **影響**: 所有需要權限驗證的 API 都會失敗
- **根本原因**: 缺少資料庫種子數據 (seed data)

### 2. 角色權限關聯缺失
- **問題**: `role_permissions` 表可能為空
- **影響**: 即使角色存在，也無法獲得對應權限
- **表現**: 用戶有角色但權限數組為空

### 3. 權限初始化流程缺失
- **問題**: 專案沒有自動權限初始化機制
- **影響**: 新部署環境無法正常運作
- **缺少**: SQL 種子腳本或初始化腳本

## 解決方案

### 方案 1: 資料庫種子腳本 (推薦)

創建權限初始化腳本：

```sql
-- 1. 插入基礎權限
INSERT INTO permissions (name, description) VALUES 
('project:create', '創建專案權限'),
('project:read', '讀取專案權限'),
('project:update', '更新專案權限'),
('project:delete', '刪除專案權限'),
('resource:create', '創建資源權限'),
('resource:read', '讀取資源權限'),
('resource:update', '更新資源權限'),
('resource:delete', '刪除資源權限'),
('user:create', '創建用戶權限'),
('user:read', '讀取用戶權限'),
('user:update', '更新用戶權限'),
('user:delete', '刪除用戶權限')
ON CONFLICT (name) DO NOTHING;

-- 2. 確保基礎角色存在
INSERT INTO roles (name, description) VALUES 
('super_admin', '超級管理員'),
('admin', '管理員'),
('mentor', '導師'),
('citizen', '公民'),
('user', '一般用戶')
ON CONFLICT (name) DO NOTHING;

-- 3. 配置角色權限關聯
-- 超級管理員擁有所有權限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'super_admin'
ON CONFLICT DO NOTHING;

-- 管理員擁有大部分權限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'admin' 
AND p.name NOT LIKE 'system:%'
ON CONFLICT DO NOTHING;

-- 導師權限配置
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'mentor' 
AND p.name IN (
    'project:create', 'project:read', 'project:update',
    'resource:create', 'resource:read', 'resource:update',
    'user:read'
)
ON CONFLICT DO NOTHING;

-- 公民權限配置
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'citizen' 
AND p.name IN (
    'project:create', 'project:read', 'project:update',
    'resource:read'
)
ON CONFLICT DO NOTHING;

-- 一般用戶權限配置
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'user' 
AND p.name IN (
    'project:create', 'project:read', 
    'resource:read'
)
ON CONFLICT DO NOTHING;
```

### 方案 2: Prisma 種子腳本

創建 `prisma/seed.ts`：

```typescript
import { PrismaClient } from '../generated/prisma';
import { PERMISSIONS } from '../src/constants';

const prisma = new PrismaClient();

async function main() {
  // 創建權限
  const permissions = await Promise.all(
    Object.values(PERMISSIONS).flatMap(category => 
      Object.values(category).map(permission =>
        prisma.permissions.upsert({
          where: { name: permission },
          update: {},
          create: {
            name: permission,
            description: `${permission} permission`
          }
        })
      )
    )
  );

  // 創建角色
  const roles = await Promise.all([
    prisma.roles.upsert({
      where: { name: 'super_admin' },
      update: {},
      create: { name: 'super_admin', description: '超級管理員' }
    }),
    prisma.roles.upsert({
      where: { name: 'mentor' },
      update: {},
      create: { name: 'mentor', description: '導師' }
    }),
    prisma.roles.upsert({
      where: { name: 'citizen' },
      update: {},
      create: { name: 'citizen', description: '公民' }
    }),
  ]);

  // 配置角色權限
  const mentorRole = roles.find(r => r.name === 'mentor');
  const citizenRole = roles.find(r => r.name === 'citizen');

  if (mentorRole) {
    const mentorPermissions = [
      'project:create', 'project:read', 'project:update',
      'resource:create', 'resource:read', 'resource:update'
    ];
    
    for (const permName of mentorPermissions) {
      const permission = permissions.find(p => p.name === permName);
      if (permission) {
        await prisma.role_permissions.upsert({
          where: {
            role_id_permission_id: {
              role_id: mentorRole.id,
              permission_id: permission.id
            }
          },
          update: {},
          create: {
            role_id: mentorRole.id,
            permission_id: permission.id
          }
        });
      }
    }
  }

  if (citizenRole) {
    const citizenPermissions = [
      'project:create', 'project:read', 'project:update',
      'resource:read'
    ];
    
    for (const permName of citizenPermissions) {
      const permission = permissions.find(p => p.name === permName);
      if (permission) {
        await prisma.role_permissions.upsert({
          where: {
            role_id_permission_id: {
              role_id: citizenRole.id,
              permission_id: permission.id
            }
          },
          update: {},
          create: {
            role_id: citizenRole.id,
            permission_id: permission.id
          }
        });
      }
    }
  }

  console.log('權限系統初始化完成');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### 方案 3: 服務層權限檢查增強

優化 `permission.service.ts` 的錯誤處理：

```typescript
async hasPermission(
  userId: number, 
  resource: string, 
  action: string, 
  options?: { allowTemp?: boolean }
): Promise<boolean> {
  try {
    console.log('檢查權限:', { userId, resource, action });
    
    // 檢查是否為超級管理員
    if (await this.isSuperAdmin(userId)) {
      console.log('用戶是超級管理員，允許訪問');
      return true;
    }

    // 查找用戶的角色和權限
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role_permissions: {
              include: {
                permissions: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      console.log('用戶不存在');
      return false;
    }

    if (!user.roles) {
      console.log('用戶沒有分配角色');
      return false;
    }

    // 檢查角色權限
    const rolePermissions = user.roles.role_permissions || [];
    console.log('用戶角色權限:', rolePermissions.map(rp => rp.permissions?.name));
    
    const hasRolePermission = rolePermissions.some(
      rp => rp.permissions && rp.permissions.name === `${resource}:${action}`
    );

    if (hasRolePermission) {
      console.log('通過角色權限驗證');
      return true;
    }

    // 檢查用戶直接權限
    const userPermissions = await prisma.user_permissions.findMany({
      where: { user_id: userId },
      include: { permissions: true }
    });

    console.log('用戶直接權限:', userPermissions.map(up => up.permissions.name));

    const hasDirectPermission = userPermissions.some(
      up => up.permissions.name === `${resource}:${action}`
    );

    if (hasDirectPermission) {
      console.log('通過直接權限驗證');
      return true;
    }

    console.log('權限驗證失敗');
    return false;
  } catch (error) {
    console.error('權限檢查錯誤:', error);
    return false;
  }
}
```

## 實施步驟

### 步驟 1: 檢查當前權限狀態
```sql
-- 檢查權限表
SELECT COUNT(*) as permission_count FROM permissions;

-- 檢查角色表  
SELECT COUNT(*) as role_count FROM roles;

-- 檢查角色權限關聯
SELECT COUNT(*) as role_permission_count FROM role_permissions;

-- 檢查特定用戶的權限
SELECT u.id, u.username, r.name as role_name, p.name as permission_name
FROM users u
LEFT JOIN roles r ON u.role_id = r.id  
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id
WHERE u.id = 2;  -- 替換為實際用戶 ID
```

### 步驟 2: 執行權限初始化
```bash
# 方案 1: 執行 SQL 腳本
psql -d your_database -f init_permissions.sql

# 方案 2: 運行 Prisma 種子
npx prisma db seed
```

### 步驟 3: 驗證權限配置
```bash
# 重新測試 API
curl -X POST \
  'https://server.daoedu.tw/api/v1/projects/' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{ "title": "測試專案" }'
```

### 步驟 4: 部署到生產環境
1. 在 staging 環境測試
2. 備份生產資料庫
3. 執行權限初始化腳本
4. 驗證功能正常運作

## 預防措施

### 1. 自動化初始化
在 Docker 啟動腳本中添加權限初始化：
```bash
# docker-entrypoint.sh
if [ "$RUN_MIGRATIONS" = "true" ]; then
  npx prisma migrate deploy
  npx prisma db seed
fi
```

### 2. 環境檢查
添加健康檢查端點：
```typescript
// src/routes/health.routes.ts
router.get('/permissions-check', async (req, res) => {
  const permissionCount = await prisma.permissions.count();
  const roleCount = await prisma.roles.count();
  const rolePermissionCount = await prisma.role_permissions.count();
  
  res.json({
    permissions: permissionCount,
    roles: roleCount,
    role_permissions: rolePermissionCount,
    status: permissionCount > 0 && rolePermissionCount > 0 ? 'OK' : 'ERROR'
  });
});
```

### 3. 測試覆蓋
添加權限系統測試：
```typescript
describe('Permission System', () => {
  test('should have basic permissions initialized', async () => {
    const permissions = await prisma.permissions.findMany();
    expect(permissions.length).toBeGreaterThan(0);
    expect(permissions.some(p => p.name === 'project:create')).toBe(true);
  });
  
  test('should have role-permission associations', async () => {
    const rolePermissions = await prisma.role_permissions.findMany();
    expect(rolePermissions.length).toBeGreaterThan(0);
  });
});
```

## 監控和維護

### 權限審計
定期檢查權限配置：
```sql
-- 找出沒有權限的角色
SELECT r.name 
FROM roles r 
LEFT JOIN role_permissions rp ON r.id = rp.role_id 
WHERE rp.role_id IS NULL;

-- 找出沒有角色的用戶
SELECT u.id, u.username 
FROM users u 
WHERE u.role_id IS NULL;
```

### 日誌監控
在權限檢查中添加適當的日誌記錄，便於問題排查和安全審計。

## 為什麼其他服務沒有遇到這個問題？

通過分析專案中的所有路由配置，發現其他服務之所以正常運作，主要有以下原因：

### 1. 權限檢查策略不一致

**只有少數服務使用嚴格的權限中間件：**

- **Project 服務**: 使用 `canCreateProject()`, `canUpdateProject()`, `canDeleteProject()`
- **User 服務**: 使用 `canCreateUser()`, `canUpdateUser()`  
- **Email 服務**: 部分端點使用 `requireAdmin`

**大多數服務只使用基本身份驗證：**

- **Resource 服務**: `POST /resources` 只使用 `authenticate`，無權限檢查
- **Idea 服務**: `POST /ideas` 只使用 `authenticate`，無權限檢查
- **Comment 服務**: `POST /comments` 只使用 `authenticate`，無權限檢查
- **Practice 服務**: 所有 POST 端點只使用 `authenticate`
- **Image 服務**: 檔案上傳只使用 `authenticate`
- **Auth 服務**: 登入註冊等不需要權限檢查

### 2. 中間件使用模式分析

```typescript
// 嚴格權限檢查 (會遇到權限問題)
router.post('/', authenticate, canCreateProject(), ...)  // ❌ 失敗

// 基本身份驗證 (正常運作)
router.post('/', authenticate, ...)  // ✅ 成功
```

### 3. 權限系統的不完整實施

專案的權限系統設計是完整的，但實際應用不一致：

**已實施權限檢查的功能：**
- ✅ 專案管理 (projects)
- ✅ 用戶管理 (users) 
- ✅ 郵件管理 (emails - 部分)

**未實施權限檢查的功能：**
- ⚠️ 資源管理 (resources)
- ⚠️ 想法管理 (ideas)
- ⚠️ 評論管理 (comments)
- ⚠️ 實踐管理 (practices)
- ⚠️ 圖片上傳 (images)
- ⚠️ 筆記管理 (notes)
- ⚠️ 成果管理 (outcomes)

### 4. 安全性風險

這種不一致的實施方式帶來安全風險：

```typescript
// 危險：任何已登入用戶都可以創建資源
POST /api/v1/resources/ // 只需要 authenticate

// 安全：需要特定權限才能創建專案
POST /api/v1/projects/   // 需要 authenticate + canCreateProject()
```

### 5. 建議的統一解決方案

**方案 A: 統一添加權限檢查**
```typescript
// 為所有創建操作添加權限檢查
router.post('/', authenticate, canCreateResource(), ...)  // resources
router.post('/', authenticate, canCreateIdea(), ...)      // ideas  
router.post('/', authenticate, canCreateComment(), ...)   // comments
```

**方案 B: 調整專案權限策略**
```typescript
// 將專案權限調整為與其他服務一致
router.post('/', authenticate, ...)  // 移除 canCreateProject()
```

**方案 C: 混合策略 (推薦)**
```typescript
// 核心資料需要權限檢查
router.post('/projects', authenticate, canCreateProject(), ...)
router.post('/users', authenticate, canCreateUser(), ...)

// 用戶生成內容只需身份驗證
router.post('/resources', authenticate, ...)
router.post('/ideas', authenticate, ...)
router.post('/comments', authenticate, ...)
```

## 總結

權限配置問題主要源於：
1. 資料庫缺少初始權限數據
2. 角色權限關聯未正確建立
3. 缺乏自動化初始化流程
4. **權限檢查實施不一致** - 只有部分服務使用嚴格的權限中間件

**其他服務正常運作是因為它們只使用基本的身份驗證 (`authenticate`)，而不是嚴格的權限檢查中間件。**

通過實施上述解決方案，可以確保權限系統正常運作，避免類似的權限不足錯誤。同時建議統一整個專案的權限檢查策略，提升系統安全性和一致性。