# 實作計畫：完整權限管理系統

**分支**: `permission-management-enhancement` | **日期**: 2024-09-21 | **規格**: [permission-system-spec.md](./permission-system-spec.md)
**輸入**: 功能規格來自 `docs/permission/permission-system-spec.md`

## 執行流程 (/plan 命令範圍)
```
1. 從輸入路徑載入功能規格
   → 規格已找到並載入
2. 填寫技術背景（掃描需要澄清之處）
   → 偵測到專案類型：TypeScript/Node.js 後端服務
   → 設定結構決策基於專案類型
3. 評估憲法檢查區段
   → 無違規：現有權限結構可增強而非重建
   → 更新進度追蹤：初始憲法檢查
4. 執行階段 0 → research.md
   → 無需澄清的項目：使用現有 Prisma, JWT, Express 結構
5. 執行階段 1 → contracts, data-model.md, quickstart.md, CLAUDE.md
6. 重新評估憲法檢查區段
   → 設計後：無新違規
   → 更新進度追蹤：設計後憲法檢查
7. 規劃階段 2 → 描述任務產生方法（不建立 tasks.md）
8. 停止 - 準備執行 /tasks 命令
```

## 摘要
增強現有權限系統，加入完整的資源擁有權驗證、細粒度權限控制、審計軌跡和安全性改進，建構在現有的 TypeScript/Prisma/Express 架構之上。

## 技術背景
**語言/版本**: TypeScript/Node.js (現有)
**主要依賴**: Express.js, Prisma ORM, JWT, Passport.js, Redis (現有)
**儲存**: PostgreSQL (主要), MongoDB (文件), Redis (快取) (現有)
**測試**: Jest 與 TypeScript 支援 (現有)
**目標平台**: Linux 伺服器 (現有)
**專案類型**: 單一專案 - TypeScript 後端服務
**效能目標**: 維持現有 API 回應時間 < 200ms
**限制**: 向後相容現有 API, 不中斷現有功能
**規模/範圍**: 增強現有系統，不重寫核心架構

## 憲法檢查
*門檻：階段 0 研究前必須通過。階段 1 設計後重新檢查。*

**簡潔性**:
- 專案：1 個 (主要後端服務)
- 直接使用框架？是（Express, Prisma 直接使用）
- 單一資料模型？是（Prisma schema 統一）
- 避免模式？是（直接使用現有服務層模式）

**架構**:
- 每個功能作為函式庫？是（現有服務模組化結構）
- 函式庫列表：auth, permission, database, validation
- 每個函式庫的 CLI：現有的 pnpm 腳本
- 函式庫文件：CLAUDE.md 格式已規劃

**測試（不可協商）**:
- RED-GREEN-重構循環強制執行？是
- Git 提交顯示實作前的測試？是
- 順序：Contract→Integration→E2E→Unit 嚴格遵循？是
- 使用真實依賴？是（實際資料庫，非 mock）
- 整合測試：新函式庫、合約變更、共享 schema？是
- 禁止：實作前測試、跳過 RED 階段

**可觀察性**:
- 包含結構化日誌記錄？是（現有日誌服務）
- 前端日誌 → 後端？是（統一串流）
- 錯誤背景充足？是

**版本控制**:
- 指派版本號？是（遵循現有版本策略）
- 每次變更時 BUILD 遞增？是
- 處理破壞性變更？是（並行測試，遷移計畫）

## 專案結構

### 文件（此功能）
```
docs/permission/
├── permission-implementation-plan.md    # 此檔案 (/plan 命令輸出)
├── research.md                         # 階段 0 輸出 (/plan 命令)
├── data-model.md                       # 階段 1 輸出 (/plan 命令)
├── quickstart.md                       # 階段 1 輸出 (/plan 命令)
├── contracts/                          # 階段 1 輸出 (/plan 命令)
└── tasks.md                           # 階段 2 輸出 (/tasks 命令 - 不由 /plan 建立)
```

### 原始碼（存儲庫根目錄）
```
src/
├── constants/
│   ├── permissions.ts                 # 已存在，需增強
│   └── roles.ts                      # 已存在，需增強
├── middleware/
│   ├── permission.middleware.ts       # 已存在，需增強
│   └── audit.middleware.ts           # 新增
├── services/
│   ├── auth/
│   │   ├── permission.service.ts     # 已存在，需增強
│   │   └── audit.service.ts          # 新增
│   └── security/
│       └── ownership.service.ts      # 新增
└── types/
    ├── auth.types.ts                 # 已存在，需增強
    └── audit.types.ts                # 新增

tests/
├── integration/
│   └── permission/                   # 新增權限整合測試
└── unit/
    └── services/permission/          # 新增權限單元測試
```

**結構決策**: 預設選項 1 - 增強現有 TypeScript 後端結構

## 階段 0: 大綱與研究
1. **從技術背景中提取未知項目**:
   - 現有權限檢查的效能影響 → 效能研究任務
   - 最佳審計日誌實作 → 安全研究任務
   - 資源擁有權驗證模式 → 模式研究任務

2. **產生並派發研究代理**:
   ```
   針對每個技術背景中的未知項目：
     任務："研究權限系統的{未知項目}用於{功能背景}"
   針對每個技術選擇：
     任務："在{領域}中找到{技術}的最佳實作"
   ```

3. **在 research.md 中整合發現**使用格式:
   - 決策：[選擇的內容]
   - 理由：[選擇的原因]
   - 考慮的替代方案：[還評估了什麼]

**輸出**: research.md 解決所有需要澄清的項目

## 階段 1: 設計與合約
*先決條件：research.md 完成*

1. **從功能規格中提取實體** → `data-model.md`:
   - 實體名稱、欄位、關係
   - 來自需求的驗證規則
   - 適用時的狀態轉換

2. **從功能需求產生 API 合約**:
   - 每個使用者動作 → 端點
   - 使用標準 REST 模式
   - 輸出 OpenAPI schema 到 `/contracts/`

3. **從合約產生合約測試**:
   - 每個端點一個測試檔案
   - 斷言請求/回應 schema
   - 測試必須失敗（尚無實作）

4. **從使用者故事中提取測試情境**:
   - 每個故事 → 整合測試情境
   - 快速開始測試 = 故事驗證步驟

5. **增量更新 CLAUDE.md**（O(1) 操作）:
   - 僅從目前計畫新增新技術
   - 保留標記之間的手動新增
   - 更新最近變更（保留最後 3 個）
   - 保持在 150 行以下以提高 token 效率

**輸出**: data-model.md, /contracts/*, 失敗的測試, quickstart.md, CLAUDE.md

## 階段 2: 任務規劃方法
*此區段描述 /tasks 命令將執行的內容 - 在 /plan 期間不執行*

**任務產生策略**:
- 載入 `/templates/tasks-template.md` 作為基礎
- 從階段 1 設計文件產生任務（合約、資料模型、快速開始）
- 每個合約 → 合約測試任務 [P]
- 每個實體 → 模型建立任務 [P]
- 每個使用者故事 → 整合測試任務
- 使測試通過的實作任務

**順序策略**:
- TDD 順序：實作前測試
- 依賴順序：模型在服務之前，服務在 UI 之前
- 標記 [P] 以並行執行（獨立檔案）

**預估輸出**: tasks.md 中 20-25 個編號、排序的任務

**重要**: 此階段由 /tasks 命令執行，不是由 /plan 執行

## 階段 3+: 未來實作
*這些階段超出 /plan 命令的範圍*

**階段 3**: 任務執行（/tasks 命令建立 tasks.md）
**階段 4**: 實作（執行 tasks.md 遵循憲法原則）
**階段 5**: 驗證（執行測試、執行 quickstart.md、效能驗證）

## 複雜度追蹤
*僅在憲法檢查有必須辯護的違規時填寫*

| 違規 | 為何需要 | 拒絕更簡單替代方案的原因 |
|------|----------|------------------------|
| 無違規 | N/A | N/A |

## 進度追蹤
*此檢查清單在執行流程中更新*

**階段狀態**:
- [ ] 階段 0: 研究完成（/plan 命令）
- [ ] 階段 1: 設計完成（/plan 命令）
- [ ] 階段 2: 任務規劃完成（/plan 命令 - 僅描述方法）
- [ ] 階段 3: 任務已產生（/tasks 命令）
- [ ] 階段 4: 實作完成
- [ ] 階段 5: 驗證通過

**門檻狀態**:
- [x] 初始憲法檢查：通過
- [ ] 設計後憲法檢查：通過
- [x] 所有需要澄清項目已解決
- [x] 複雜度偏差已記錄

---
*基於憲法 v2.1.1 - 參見 `/memory/constitution.md`*