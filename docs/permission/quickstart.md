# 權限管理系統快速開始指南

## 概述
本指南將協助開發者快速理解和使用道道平台的權限管理系統。

## 系統架構概覽

```
用戶請求 → 驗證中介軟體 → 權限檢查中介軟體 → 業務邏輯 → 審計記錄
           ↓                ↓                    ↓           ↓
        JWT 驗證         權限快取檢查          服務層執行    日誌記錄
```

## 核心概念

### 1. 角色階層
```
Guest (0) < User (1) < Editor (2) < Moderator (3) < Admin (4) < Super Admin (5)
```

### 2. 權限格式
權限採用 `resource:action` 格式，例如：
- `project:create` - 建立專案
- `resource:approve` - 審核資源
- `user:manage` - 管理使用者

### 3. 擁有權概念
使用者對自己建立的資源具有特殊權限，可以進行 CRUD 操作。

## 快速開始驗證

### 步驟 1: 環境設定
確認您的開發環境已設定：
```bash
# 檢查 Node.js 版本
node --version  # 應該是 v18+

# 安裝依賴
pnpm install

# 檢查資料庫連線
pnpm run typecheck
```

### 步驟 2: 建立測試使用者
```javascript
// 在測試環境中建立使用者
const testUser = {
  email: 'test@example.com',
  isTemp: false,
  roles: ['user']
};
```

### 步驟 3: 驗證基本權限檢查
```javascript
import { requirePermission } from '../src/middleware/permission.middleware';
import { PERMISSIONS } from '../src/constants/permissions';

// 測試資源建立權限
const createResourcePermission = requirePermission(
  { resource: 'resource', action: 'create' },
  { allowTemp: true }
);
```

### 步驟 4: 測試資源擁有權
```javascript
import { requireOwnership } from '../src/middleware/permission.middleware';

// 測試專案擁有權檢查
const projectOwnershipCheck = requireOwnership('project', 'id');
```

## 常見使用場景

### 場景 1: 保護 API 端點
```javascript
// routes/project.routes.ts
import { canCreateProject, canUpdateProject } from '../middleware/permission.middleware';

router.post('/projects', canCreateProject(), createProjectHandler);
router.put('/projects/:id', canUpdateProject(), updateProjectHandler);
```

### 場景 2: 服務層權限檢查
```javascript
// services/project.service.ts
import { permissionService } from './auth/permission.service';

export async function updateProject(userId: number, projectId: number, data: any) {
  // 檢查是否為專案擁有者或有更新權限
  const canUpdate = await permissionService.canUpdateResource(
    userId,
    'project',
    projectId
  );

  if (!canUpdate) {
    throw new ForbiddenError('無權限更新此專案');
  }

  // 執行更新邏輯
}
```

### 場景 3: 角色檢查
```javascript
// controllers/admin.controller.ts
import { requireAdminRole } from '../middleware/permission.middleware';

router.get('/admin/dashboard', requireAdminRole, getDashboardHandler);
```

## 測試驗證腳本

### 基本權限測試
```javascript
// tests/integration/permission/basic-permission.test.ts
describe('基本權限檢查', () => {
  test('一般使用者可以建立專案', async () => {
    const user = await createTestUser('user');
    const response = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${user.token}`)
      .send(projectData)
      .expect(201);
  });

  test('訪客無法建立專案', async () => {
    const response = await request(app)
      .post('/api/projects')
      .send(projectData)
      .expect(401);
  });
});
```

### 擁有權測試
```javascript
describe('資源擁有權檢查', () => {
  test('使用者可以更新自己的專案', async () => {
    const user = await createTestUser('user');
    const project = await createTestProject(user.id);

    const response = await request(app)
      .put(`/api/projects/${project.id}`)
      .set('Authorization', `Bearer ${user.token}`)
      .send(updateData)
      .expect(200);
  });

  test('使用者無法更新他人的專案', async () => {
    const user1 = await createTestUser('user');
    const user2 = await createTestUser('user');
    const project = await createTestProject(user1.id);

    const response = await request(app)
      .put(`/api/projects/${project.id}`)
      .set('Authorization', `Bearer ${user2.token}`)
      .send(updateData)
      .expect(403);
  });
});
```

### 角色階層測試
```javascript
describe('角色階層檢查', () => {
  test('管理員可以存取使用者管理', async () => {
    const admin = await createTestUser('admin');

    const response = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${admin.token}`)
      .expect(200);
  });

  test('一般使用者無法存取使用者管理', async () => {
    const user = await createTestUser('user');

    const response = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${user.token}`)
      .expect(403);
  });
});
```

## 驗證檢查清單

執行以下檢查以確認權限系統正常運作：

### ✅ 基本功能檢查
- [ ] JWT 驗證正常運作
- [ ] 角色指派和檢查功能正常
- [ ] 權限檢查中介軟體正常運作
- [ ] 資源擁有權驗證正常

### ✅ 安全性檢查
- [ ] 未授權存取被正確拒絕
- [ ] 權限升級攻擊被防護
- [ ] 會話失效機制正常運作
- [ ] 審計日誌正確記錄

### ✅ 效能檢查
- [ ] 權限檢查回應時間 < 50ms
- [ ] Redis 快取正常運作
- [ ] 資料庫查詢已優化
- [ ] 無記憶體洩漏

### ✅ 整合檢查
- [ ] 所有現有 API 端點正常運作
- [ ] 新權限檢查不影響現有功能
- [ ] 錯誤處理和回應格式一致
- [ ] 日誌記錄完整且有用

## 常見問題排解

### Q1: 權限檢查失敗但應該通過
**檢查項目:**
1. 使用者是否已正確驗證
2. 角色是否正確指派
3. 權限快取是否需要清除
4. 資源擁有權是否正確設定

### Q2: 效能問題
**檢查項目:**
1. Redis 快取是否正常運作
2. 資料庫索引是否已建立
3. 權限檢查邏輯是否過於複雜
4. 是否有不必要的重複查詢

### Q3: 審計日誌遺失
**檢查項目:**
1. 審計中介軟體是否正確配置
2. 資料庫連線是否正常
3. 日誌等級設定是否正確
4. 錯誤處理是否會阻止日誌記錄

## 後續步驟

完成快速開始驗證後，請參考：

1. **[權限系統規格](./permission-system-spec.md)** - 了解完整的系統需求
2. **[資料模型文件](./data-model.md)** - 了解資料結構設計
3. **[實作計畫](./permission-implementation-plan.md)** - 了解實作策略
4. **[API 合約](./contracts/)** - 了解 API 設計規範

## 支援

如果在驗證過程中遇到問題，請：
1. 檢查日誌檔案中的錯誤訊息
2. 運行 `pnpm run typecheck` 檢查型別錯誤
3. 運行 `pnpm test` 執行測試套件
4. 查看現有的測試範例作為參考