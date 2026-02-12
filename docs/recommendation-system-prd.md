# PRD: 主題實踐與使用者推薦系統

> **Product Requirements Document**
> **Version**: 1.1
> **Date**: 2026-02-12
> **Status**: Draft
> **Backend**: Python AI Service

---

## 1. 概述 (Overview)

### 1.1 產品背景

島島教育學習平台 (DaoDao) 的核心功能「主題實踐」讓使用者建立個人化的學習計畫並透過打卡追蹤進度。目前平台缺乏個人化推薦機制，使用者必須自行瀏覽或搜尋來發現感興趣的實踐、學習夥伴或模板，導致：

- **內容發現效率低**：大量優質的公開實踐難以被目標使用者看到
- **使用者參與度不足**：缺少主動引導使用者探索新實踐的機制
- **社群連結薄弱**：使用者之間缺乏基於興趣的自動配對
- **新用戶留存率低**：新使用者不知從何開始，容易流失

### 1.2 產品目標

建立一個 **Python AI 推薦後端服務**，為平台提供智慧化的推薦能力：

1. **提升內容發現效率**：使用者無需主動搜尋即可看到感興趣的實踐
2. **促進使用者參與**：透過個人化推薦提高實踐參與率與打卡率
3. **強化社群連結**：自動配對興趣相近的學習夥伴
4. **降低新用戶門檻**：冷啟動機制讓新使用者也能獲得有效推薦

### 1.3 成功指標 (Success Metrics)

| 指標 | 基準值 | Phase 1 目標 | Phase 2 目標 |
|------|--------|-------------|-------------|
| 推薦實踐點擊率 (CTR) | N/A (新功能) | ≥ 8% | ≥ 15% |
| 推薦後參與率 (Adoption Rate) | N/A | ≥ 3% | ≥ 8% |
| 推薦實踐打卡率 (Checkin Rate) | N/A | ≥ 20% | ≥ 35% |
| 有推薦的使用者覆蓋率 | N/A | ≥ 80% | ≥ 95% |
| 推薦 Tag 點擊率 | N/A | ≥ 10% | ≥ 20% |
| Tag 建議採用率 (建立實踐時) | N/A | ≥ 40% | ≥ 60% |
| 推薦 API 延遲 (P95) | N/A | < 500ms | < 200ms |

---

## 2. 使用者角色 (User Personas)

### 2.1 一般學習者 (Learner)
- **描述**：已完成註冊流程，有設定興趣分類的活躍使用者
- **需求**：發現與自己興趣相關的新實踐、找到志同道合的學習夥伴
- **行為**：已建立過 1+ 實踐、有打卡記錄

### 2.2 新使用者 (New User)
- **描述**：剛註冊、資料不完整的使用者
- **需求**：快速了解平台有什麼、找到起步方向
- **行為**：可能只設定了基本資料和興趣，尚無實踐歷史

### 2.3 探索型使用者 (Explorer)
- **描述**：喜歡瀏覽、嘗試不同領域實踐的使用者
- **需求**：持續發現新鮮、多樣化的實踐內容
- **行為**：跨類別建立實踐、瀏覽量大

### 2.4 實踐建立者 (Creator)
- **描述**：主動建立公開實踐的使用者
- **需求**：讓自己的實踐被更多人看到、找到一起練習的夥伴
- **行為**：建立公開實踐、持續打卡

---

## 3. 功能需求 (Functional Requirements)

### 3.1 Feature: 為使用者推薦主題實踐 (Practice Recommendations)

**優先級**：P0 (Phase 1)

#### 描述
根據使用者的興趣、偏好、歷史行為，推薦可能感興趣的公開主題實踐。

#### User Stories

**US-1.1** 登入使用者查看推薦實踐
> 作為一個登入使用者，我想在首頁或探索頁看到個人化推薦的實踐列表，以便快速發現感興趣的新實踐。

**US-1.2** 使用者理解推薦原因
> 作為一個使用者，我想知道為什麼某個實踐被推薦給我（例如「符合你對程式設計的興趣」），以便判斷是否值得參與。

**US-1.3** 新使用者獲得推薦
> 作為一個剛註冊的新使用者，即使我還沒有互動歷史，我也想看到有意義的推薦內容，而不是空白頁面。

#### 接受標準 (Acceptance Criteria)

| # | 條件 | 預期結果 |
|---|------|---------|
| AC-1.1 | 有興趣標籤的使用者請求推薦 | 回傳 ≤ 20 筆與興趣相關的實踐，按相關度排序 |
| AC-1.2 | 新使用者（無任何歷史）請求推薦 | 回傳熱門實踐列表（fallback 策略），不回傳空結果 |
| AC-1.3 | 每筆推薦結果 | 包含 `practice_id`、`score`（0-1）、`reasons`（至少 1 個推薦理由） |
| AC-1.4 | 推薦結果排除 | 不推薦使用者自己建立的實踐 |
| AC-1.5 | 推薦結果排除 | 不推薦已刪除、已封存的實踐（只推 active/not_started） |
| AC-1.6 | 回應時間 | P95 延遲 < 500ms（Phase 1） |
| AC-1.7 | 支援分頁 | 透過 `limit` + `offset` 或 cursor 支援分頁載入 |

#### API 規格

```
GET /api/v1/recommendations/practices

Query Parameters:
  - user_id: string (required) - User external UUID
  - limit: integer (optional, default=20, max=50)
  - offset: integer (optional, default=0)
  - exclude_ids: string[] (optional) - 排除的 practice IDs

Response 200:
{
  "success": true,
  "data": [
    {
      "practice_id": "uuid",
      "score": 0.87,
      "reasons": [
        {
          "type": "interest_match" | "similar_users" | "popular" | "trending" | "tag_match",
          "detail": "string (使用者可讀的推薦理由)"
        }
      ],
      "source": "content_based" | "collaborative" | "popularity"
    }
  ],
  "pagination": {
    "total": 100,
    "limit": 20,
    "offset": 0,
    "has_next": true
  },
  "meta": {
    "strategy": "hybrid",
    "model_version": "v1.0.0",
    "user_segment": "cold_start" | "normal" | "active"
  }
}
```

---

### 3.2 Feature: 推薦相似使用者 (Similar User Recommendations)

**優先級**：P1 (Phase 2)

#### 描述
基於興趣、偏好和實踐行為的相似度，為使用者推薦可能感興趣的學習夥伴。

#### User Stories

**US-2.1** 使用者尋找學習夥伴
> 作為一個使用者，我想在個人頁面或社群區域看到與我興趣相似的其他學習者，以便找到一起學習的夥伴。

**US-2.2** 使用者了解相似原因
> 作為一個使用者，我想知道為什麼某人被推薦為相似使用者（例如「你們都對教育學習感興趣」），以便判斷是否要互動。

#### 接受標準 (Acceptance Criteria)

| # | 條件 | 預期結果 |
|---|------|---------|
| AC-2.1 | 有互動歷史的使用者 | 回傳 ≤ 10 筆相似使用者，按相似度排序 |
| AC-2.2 | 每筆結果 | 包含 `user_id`、`similarity_score`（0-1）、`common_interests`、`common_practices_count` |
| AC-2.3 | 隱私保護 | 只推薦 `is_open_profile = true` 的使用者 |
| AC-2.4 | 排除自己 | 不在推薦結果中包含發起請求的使用者 |
| AC-2.5 | 排除非活躍使用者 | 不推薦 `is_active = false` 的使用者 |

#### API 規格

```
GET /api/v1/recommendations/users

Query Parameters:
  - user_id: string (required)
  - limit: integer (optional, default=10, max=20)

Response 200:
{
  "success": true,
  "data": [
    {
      "user_id": "uuid",
      "similarity_score": 0.82,
      "common_interests": ["education_learning", "arts_and_design"],
      "common_practices_count": 3,
      "match_reasons": [
        {
          "type": "interest_overlap" | "practice_similarity" | "preference_match",
          "detail": "string"
        }
      ]
    }
  ]
}
```

---

### 3.3 Feature: 推薦相似實踐 (Similar Practice Recommendations)

**優先級**：P0 (Phase 1)

#### 描述
在主題實踐詳情頁，推薦內容或模式相似的其他實踐。

#### User Stories

**US-3.1** 使用者瀏覽相似實踐
> 作為一個正在查看某個實踐詳情的使用者，我想在頁面下方看到「你可能也感興趣」的相似實踐列表，以便發現更多相關內容。

#### 接受標準 (Acceptance Criteria)

| # | 條件 | 預期結果 |
|---|------|---------|
| AC-3.1 | 給定一個 practice_id | 回傳 ≤ 10 筆相似實踐 |
| AC-3.2 | 相似依據 | 基於 tag overlap、模板類別、實踐模式（時長/頻率）的綜合相似度 |
| AC-3.3 | 排除自身 | 不在結果中包含查詢的實踐本身 |
| AC-3.4 | 狀態過濾 | 只推薦 active/not_started 的實踐 |
| AC-3.5 | 每筆結果 | 包含 `practice_id`、`similarity_score`、`reasons` |
| AC-3.6 | 可選個人化 | 若提供 `user_id`，結合使用者偏好調整排序 |

#### API 規格

```
GET /api/v1/recommendations/practices/{practice_id}/similar

Query Parameters:
  - limit: integer (optional, default=10, max=20)
  - user_id: string (optional) - 加入個人化排序

Response 200:
{
  "success": true,
  "data": [
    {
      "practice_id": "uuid",
      "similarity_score": 0.91,
      "reasons": [
        {
          "type": "tag_overlap" | "pattern_similar" | "same_template" | "same_category",
          "detail": "string"
        }
      ]
    }
  ]
}
```

---

### 3.4 Feature: 推薦實踐模板 (Template Recommendations)

**優先級**：P1 (Phase 2)

#### 描述
使用者新建實踐時，推薦適合的實踐模板。

#### User Stories

**US-4.1** 使用者新建實踐時獲得模板建議
> 作為一個要建立新實踐的使用者，我想看到根據我的興趣和偏好排序的模板推薦，以便快速開始一個適合我的實踐。

#### 接受標準 (Acceptance Criteria)

| # | 條件 | 預期結果 |
|---|------|---------|
| AC-4.1 | 有興趣的使用者 | 回傳 ≤ 5 筆推薦模板，按適合度排序 |
| AC-4.2 | 新使用者 | 回傳熱門模板列表 |
| AC-4.3 | 排除已使用模板 | 不推薦使用者已使用過的模板（可選） |
| AC-4.4 | 每筆結果 | 包含 `template_id`、`score`、`reasons` |

#### API 規格

```
GET /api/v1/recommendations/templates

Query Parameters:
  - user_id: string (required)
  - limit: integer (optional, default=5, max=10)
  - include_used: boolean (optional, default=false) - 是否包含已使用過的模板

Response 200:
{
  "success": true,
  "data": [
    {
      "template_id": "uuid",
      "score": 0.75,
      "reasons": [
        {
          "type": "interest_match" | "popular_in_category" | "similar_users_use",
          "detail": "string"
        }
      ]
    }
  ]
}
```

---

### 3.5 Feature: 推薦回饋 (Recommendation Feedback)

**優先級**：P2 (Phase 3)

#### 描述
使用者可對推薦結果提供回饋（不感興趣/已看過），用於優化推薦品質。

#### User Stories

**US-5.1** 使用者標記不感興趣
> 作為一個使用者，我想對不感興趣的推薦結果按「不感興趣」，讓系統不再推薦類似內容。

#### 接受標準 (Acceptance Criteria)

| # | 條件 | 預期結果 |
|---|------|---------|
| AC-5.1 | 使用者提交負向回饋 | 該實踐不再出現在推薦列表中 |
| AC-5.2 | 累積負向回饋 | 降低該類別/標籤的推薦權重 |
| AC-5.3 | 回饋類型 | 支援 `not_interested`、`already_seen`、`irrelevant` |

#### API 規格

```
POST /api/v1/recommendations/feedback

Request Body:
{
  "user_id": "uuid",
  "entity_type": "practice" | "user" | "template",
  "entity_id": "uuid",
  "feedback_type": "not_interested" | "already_seen" | "irrelevant",
  "context": "homepage" | "detail_page" | "create_page"
}

Response 200:
{
  "success": true,
  "data": {
    "acknowledged": true
  }
}
```

---

### 3.6 Feature: 探索頁推薦 Tag (Tag Discovery Recommendations)

**優先級**：P1 (Phase 2)

#### 描述
在首頁或探索頁為使用者推薦可能感興趣的 Tag，作為內容探索的入口。使用者點擊推薦的 Tag 後可瀏覽該 Tag 下的所有實踐。

#### User Stories

**US-6.1** 使用者透過推薦 Tag 探索內容
> 作為一個使用者，我想在探索頁看到「你可能感興趣的主題」標籤列表，點擊後能瀏覽該標籤下的實踐，讓我更容易發現新領域。

**US-6.2** 新使用者透過熱門 Tag 了解平台內容
> 作為一個新使用者，我想看到目前平台上熱門的 Tag，以便快速了解有哪些學習主題。

#### 接受標準 (Acceptance Criteria)

| # | 條件 | 預期結果 |
|---|------|---------|
| AC-6.1 | 有興趣/歷史的使用者 | 回傳 ≤ 15 筆推薦 Tag，按相關度排序 |
| AC-6.2 | 新使用者（無歷史） | 回傳熱門 Tag 列表（依使用次數 + 近期趨勢排序） |
| AC-6.3 | 每筆結果 | 包含 `tag_id`、`tag_name`、`score`、`reason`、`practice_count`（該 Tag 下的活躍實踐數） |
| AC-6.4 | 推薦依據 | 綜合使用者興趣匹配、歷史實踐標籤、相似用戶的標籤偏好 |
| AC-6.5 | 排除空 Tag | 不推薦 practice_count = 0 的 Tag |
| AC-6.6 | 多樣性 | 推薦結果應跨不同主題領域，避免過度集中 |

#### API 規格

```
GET /api/v1/recommendations/tags

Query Parameters:
  - user_id: string (optional) - 有則個人化，無則回傳熱門
  - limit: integer (optional, default=15, max=30)
  - context: string (optional) - "explore_page" | "homepage"

Response 200:
{
  "success": true,
  "data": [
    {
      "tag_id": 42,
      "tag_name": "閱讀",
      "score": 0.85,
      "practice_count": 23,
      "trending": true,
      "reason": {
        "type": "interest_match" | "history_based" | "similar_users" | "trending" | "popular",
        "detail": "符合你對『教育學習』的興趣"
      }
    }
  ],
  "meta": {
    "personalized": true,
    "model_version": "v1.0.0"
  }
}
```

---

### 3.7 Feature: 建立實踐時推薦 Tag (Practice Tag Auto-Suggestion)

**優先級**：P1 (Phase 2)

#### 描述
使用者新建或編輯實踐時，根據填寫的標題和描述，自動建議適合的 Tag。降低使用者手動選標籤的門檻，同時提升 Tag 的使用品質與一致性。

#### User Stories

**US-7.1** 使用者建立實踐時獲得 Tag 建議
> 作為一個正在建立實踐的使用者，我輸入標題「每天閱讀30分鐘」後，系統自動建議「閱讀」「自我成長」「習慣養成」等 Tag，我只需點選確認，不用自己想要打什麼標籤。

**US-7.2** 使用者編輯實踐時獲得 Tag 建議
> 作為一個正在編輯實踐的使用者，當我修改標題或描述後，系統能根據新內容更新 Tag 建議。

#### 接受標準 (Acceptance Criteria)

| # | 條件 | 預期結果 |
|---|------|---------|
| AC-7.1 | 使用者輸入標題（≥ 2 字） | 回傳 ≤ 10 筆建議 Tag，按相關度排序 |
| AC-7.2 | 同時提供標題 + practice_action | 結合兩者語意提升建議準確度 |
| AC-7.3 | 每筆結果 | 包含 `tag_id`、`tag_name`、`confidence`（0-1 信心度） |
| AC-7.4 | 優先推薦既有 Tag | 優先建議已存在的 Tag，減少重複/近似標籤 |
| AC-7.5 | 支援即時回應 | 延遲 < 300ms，適合打字時即時建議 |
| AC-7.6 | 語意理解 | 「每天跑步5公里」→ 建議「運動」「跑步」「健康」，而非純字面匹配 |
| AC-7.7 | 可提供使用者資訊 | 若提供 user_id，可參考使用者常用標籤微調排序 |

#### API 規格

```
GET /api/v1/recommendations/tags/suggest

Query Parameters:
  - title: string (required) - 實踐標題
  - practice_action: string (optional) - 實踐行動描述
  - user_id: string (optional) - 用於個人化排序
  - limit: integer (optional, default=10, max=15)

Response 200:
{
  "success": true,
  "data": [
    {
      "tag_id": 42,
      "tag_name": "閱讀",
      "confidence": 0.92,
      "source": "semantic" | "keyword" | "template_category" | "user_history"
    }
  ],
  "meta": {
    "input_analyzed": "每天閱讀30分鐘",
    "model_version": "v1.0.0"
  }
}
```

#### 演算法策略

```
建議 Tag 的多路來源：

1. 關鍵字匹配 (Keyword)
   - 標題/描述分詞 → 比對現有 tag name
   - 快速、高精確度，但召回率低

2. 語意匹配 (Semantic) — Phase 3
   - 標題 embedding vs 所有 tag embedding → cosine similarity
   - 理解「每天跑步」→「運動」的語意關聯

3. 模板類別關聯 (Template Category)
   - 若使用者選了模板，用模板的 content_categories 關聯 tag
   - 高精確度

4. 使用者歷史 (User History)
   - 使用者過去實踐常用的 tag，在信心度相近時優先推薦
   - 個人化加分

5. 共現統計 (Co-occurrence)
   - 統計哪些 tag 經常一起出現在同一個實踐
   - 當已選了 tag A，推薦常與 A 共現的 tag B
```

---

## 4. 非功能需求 (Non-Functional Requirements)

### 4.1 效能 (Performance)

| 需求 | Phase 1 | Phase 2 |
|------|---------|---------|
| API 延遲 (P50) | < 100ms | < 50ms |
| API 延遲 (P95) | < 500ms | < 200ms |
| API 延遲 (P99) | < 1s | < 500ms |
| 吞吐量 | 100 RPS | 500 RPS |
| 快取命中率 | > 70% | > 85% |

### 4.2 可用性 (Availability)

| 需求 | 規格 |
|------|------|
| Uptime SLA | 99.5% |
| Graceful Degradation | 推薦服務不可用時，回傳熱門排行兜底 |
| Health Check | `/health` endpoint，含 DB 與 Redis 連線檢查 |
| 啟動時間 | < 30 秒（含模型載入） |

### 4.3 可擴展性 (Scalability)

| 需求 | 規格 |
|------|------|
| 使用者量 | 支撐 50K 活躍使用者 |
| 實踐量 | 支撐 100K 筆實踐資料 |
| 水平擴展 | 支援多 instance 部署（stateless API） |
| 模型更新 | 支援 zero-downtime 模型替換 |

### 4.4 安全性 (Security)

| 需求 | 規格 |
|------|------|
| 資料庫存取 | Python backend 僅有 read-only 權限 |
| API 認證 | Internal API key 或 JWT token 驗證 |
| 資料隱私 | 不暴露使用者內部 ID，只使用 external_id (UUID) |
| 推薦過濾 | 不推薦非公開 profile 的使用者、不推薦被封鎖/停用的帳號 |

### 4.5 可觀測性 (Observability)

| 需求 | 規格 |
|------|------|
| 日誌 | 結構化日誌（JSON），含 request_id、user_id、latency |
| 指標 | Prometheus metrics - request count、latency histogram、cache hit rate |
| 推薦追蹤 | 記錄每次推薦的 strategy、model_version、user_segment |
| 告警 | 延遲 > 1s 或錯誤率 > 5% 時告警 |

---

## 5. 推薦策略規則 (Recommendation Business Rules)

### 5.1 推薦候選池過濾規則

以下實踐 **不進入** 推薦候選池：

| 規則 | 條件 |
|------|------|
| R-1 | `practices.deleted_at IS NOT NULL`（已刪除） |
| R-2 | `practices.status NOT IN ('active', 'not_started')`（非活躍） |
| R-3 | 請求者自己建立的實踐 |
| R-4 | 使用者已明確回饋「不感興趣」的實踐 (Phase 3) |

### 5.2 使用者候選池過濾規則

以下使用者 **不進入** 推薦候選池：

| 規則 | 條件 |
|------|------|
| R-5 | `users.is_active = false`（停用帳號） |
| R-6 | `users.is_open_profile = false`（非公開） |
| R-7 | 請求者自己 |

### 5.3 推薦排序規則

| 規則 | 說明 |
|------|------|
| R-8 | 使用者區段判定：checkin_count=0 且 practice_count=0 → `cold_start`；practice_count≥1 且 checkin_count<10 → `normal`；checkin_count≥10 → `active` |
| R-9 | `cold_start` 使用者：60% 熱門度 + 40% 內容匹配（若有 interests） |
| R-10 | `normal` 使用者：35% 內容匹配 + 30% 協同過濾 + 20% 熱門度 + 15% 多樣性 |
| R-11 | `active` 使用者：25% 內容匹配 + 45% 協同過濾 + 10% 熱門度 + 20% 多樣性 |
| R-12 | 多樣性約束：推薦結果中同一 category 不超過 40% |
| R-13 | 新鮮度加權：7 天內建立的實踐獲得 10% score bonus |

### 5.4 推薦理由生成規則

| 推薦來源 | 理由類型 | 範例文字 |
|---------|---------|---------|
| 興趣匹配 | `interest_match` | 「符合你對『{category_name}』的興趣」 |
| 標籤重疊 | `tag_match` | 「與你常看的『{tag_name}』相關」 |
| 相似用戶 | `similar_users` | 「與你相似的 {count} 位學習者也在進行」 |
| 熱門推薦 | `popular` | 「最近 {count} 位學習者正在進行」 |
| 趨勢推薦 | `trending` | 「近期熱度上升中」 |
| 模板類別 | `same_category` | 「與你進行的『{practice_title}』屬於同類型」 |
| 模式相似 | `pattern_similar` | 「相似的練習模式（{pattern_desc}）」 |

---

## 6. 資料依賴 (Data Dependencies)

### 6.1 必要資料表 (Required Tables - Read Only)

| 資料表 | 用途 | 存取頻率 |
|--------|------|---------|
| `users` | 使用者基本特徵 | 每次請求 |
| `user_interests` | 使用者興趣分類 | 每次請求 |
| `user_preferences` | 使用者偏好 | 每次請求 |
| `user_professional_fields` | 使用者專業領域 | 特徵計算 |
| `categories` | 分類名稱對照 | 啟動時載入 |
| `practices` | 實踐主體資料 | 候選池更新 |
| `practice_checkins` | 打卡行為 | 特徵計算 |
| `practice_templates` | 模板資料 | 模板推薦 |
| `practice_template_categories` | 模板分類 | 模板推薦 |
| `content_categories` | 內容分類 | 模板推薦 |
| `entity_tags` | 實體標籤 | 內容匹配 |
| `tags` | 標籤名稱 | 內容匹配 |
| `entity_stats` | 互動統計 | 熱門度計算 |
| `preference_types` | 偏好類型 | 啟動時載入 |
| `preference_options` | 偏好選項 | 啟動時載入 |

### 6.2 Python Backend 自有資料 (Write)

| 資料 | 儲存位置 | 說明 |
|------|---------|------|
| User feature vectors | Redis | 快取已計算的使用者特徵 |
| Practice feature vectors | Redis | 快取已計算的實踐特徵 |
| Text embeddings | Redis + 檔案 | 標題/描述的語意向量 |
| 推薦結果快取 | Redis | 短期快取推薦結果 |
| 推薦回饋 | PostgreSQL (新表) 或 Redis | 使用者回饋記錄 |
| ML 模型檔案 | 檔案系統 / Object Storage | 訓練好的模型 |

### 6.3 需要 Node.js 端配合的事項

| 項目 | 說明 | 優先級 |
|------|------|--------|
| Proxy routes | 在 Node.js API gateway 加推薦路由，轉發至 Python backend | P0 |
| Auth token 傳遞 | 將使用者認證資訊傳遞給 Python backend | P0 |
| Event notifications (可選) | 使用者更新 profile 時通知 Python backend invalidate cache | P2 |

---

## 7. 前端整合點 (Frontend Integration Points)

> 以下為前端需要配合的 UI 位置，供前端團隊參考。

### 7.1 首頁 / 探索頁
- **位置**：主動推薦區塊「為你推薦的實踐」
- **API**：`GET /api/v1/recommendations/practices?user_id={uuid}`
- **UI 需求**：
  - 卡片式列表，顯示實踐標題、標籤、推薦理由
  - 支援「換一批」重新載入
  - 載入中顯示 skeleton

### 7.2 實踐詳情頁
- **位置**：頁面底部「你可能也感興趣」
- **API**：`GET /api/v1/recommendations/practices/{id}/similar`
- **UI 需求**：
  - 橫向滑動卡片，顯示 5-10 筆
  - 顯示相似原因標籤

### 7.3 使用者個人頁 / 社群頁
- **位置**：「相似學習者」區塊
- **API**：`GET /api/v1/recommendations/users?user_id={uuid}`
- **UI 需求**：
  - 使用者頭像 + 暱稱 + 共同興趣標籤
  - 顯示共同實踐數量

### 7.4 首頁 / 探索頁 - 推薦 Tag
- **位置**：探索頁頂部「你可能感興趣的主題」
- **API**：`GET /api/v1/recommendations/tags?user_id={uuid}`
- **UI 需求**：
  - 橫向可滾動的 Tag 膠囊列表
  - 每個 Tag 顯示名稱 + 實踐數量（如「閱讀 · 23個實踐」）
  - 熱門/趨勢 Tag 標示 trending 標記
  - 點擊後導航至該 Tag 的實踐列表頁

### 7.5 建立/編輯實踐頁 - Tag 自動建議
- **位置**：標籤輸入欄位
- **API**：`GET /api/v1/recommendations/tags/suggest?title={text}`
- **UI 需求**：
  - 使用者輸入標題後（debounce 300ms），下拉顯示建議 Tag
  - 每個 Tag 顯示名稱 + 信心度指示（高/中）
  - 點擊即選取，支援多選
  - 已選取的 Tag 可觸發「共現推薦」（選了 A 後推薦常與 A 一起出現的 B）

### 7.6 建立實踐頁 - 模板推薦
- **位置**：模板選擇步驟
- **API**：`GET /api/v1/recommendations/templates?user_id={uuid}`
- **UI 需求**：
  - 在模板列表頂部顯示「推薦給你」區塊
  - 標示推薦理由

---

## 8. 分階段交付計畫 (Delivery Phases)

### Phase 1: MVP - 基礎推薦

**目標**：驗證推薦功能的產品價值

**交付範圍**：

| 功能 | 說明 |
|------|------|
| 推薦實踐給使用者 (3.1) | Content-based + Popularity fallback |
| 推薦相似實踐 (3.3) | Tag/Category overlap + 模式匹配 |
| 冷啟動處理 | 新使用者→熱門實踐、有興趣→興趣匹配 |
| 推薦理由 | 基本理由文字 |
| 快取機制 | Redis 快取推薦結果 |
| Health check | 服務健康檢查 endpoint |

**不包含**：
- 協同過濾
- 相似使用者推薦
- 模板推薦
- Tag 推薦
- 使用者回饋
- NLP text embedding

### Phase 2: V1 - 完整推薦

**目標**：完整的推薦場景覆蓋 + 混合排序

**增量交付**：

| 功能 | 說明 |
|------|------|
| 協同過濾 | User-based / Item-based CF |
| Hybrid Ranking | 多路召回 + 混合排序 |
| 相似使用者推薦 (3.2) | 基於 interest + behavior similarity |
| 模板推薦 (3.4) | 個人化模板排序 |
| 探索頁推薦 Tag (3.6) | 基於興趣 + 熱門度的個人化 Tag 推薦 |
| 建立實踐 Tag 建議 (3.7) | 基於標題關鍵字匹配 + 模板類別 + 使用者歷史 |
| 使用者區段 | cold_start / normal / active 動態權重 |
| 推薦多樣性 | 同類別不超過 40% |

### Phase 3: V2 - 進階智慧

**目標**：深度模型 + 即時回饋

**增量交付**：

| 功能 | 說明 |
|------|------|
| Text Embedding | sentence-transformers 語意匹配 |
| Tag 語意建議增強 (3.7) | 用 embedding 理解「跑步」→「運動」的語意關聯 |
| Tag 共現推薦 (3.7) | 選了 Tag A 後推薦常共現的 Tag B |
| 推薦回饋 (3.5) | 負向回饋收集與應用 |
| 即時特徵更新 | Event-driven cache invalidation |
| A/B Testing 框架 | 多策略對比測試 |
| 進階模型 | Matrix Factorization / Neural CF |

---

## 9. 風險與依賴 (Risks & Dependencies)

### 9.1 風險

| 風險 | 影響 | 緩解措施 |
|------|------|---------|
| 資料稀疏（初期用戶/實踐量少） | 協同過濾效果差 | Phase 1 先用 content-based + popularity；CF 留到資料量足夠時 |
| 冷啟動使用者推薦品質差 | 新用戶體驗不佳 | 引導使用者填寫興趣；熱門推薦兜底 |
| 推薦回音室效應 (Echo Chamber) | 推薦越來越窄 | 強制多樣性約束 (R-12)、新鮮度加權 (R-13) |
| Python 服務增加營運複雜度 | 部署與監控成本 | Docker 化、共用現有 infra (PostgreSQL, Redis) |
| 推薦延遲影響使用者體驗 | 頁面載入慢 | 多層快取、預計算、非同步載入 |

### 9.2 依賴

| 依賴項 | 負責方 | 說明 |
|--------|--------|------|
| PostgreSQL read-only 帳號 | Backend / DevOps | 建立 read-only DB user |
| Redis 共用 | Backend / DevOps | 確認 Redis 容量與 namespace 隔離 |
| Node.js proxy routes | Node.js Backend | 在 API gateway 加推薦路由 |
| 前端推薦 UI | Frontend | 各頁面推薦區塊 |
| Docker / K8s 部署 | DevOps | Python service 的部署 pipeline |

---

## 10. 開放問題 (Open Questions)

| # | 問題 | 影響 | 狀態 |
|---|------|------|------|
| Q-1 | 實踐是否有「公開/私人」欄位？目前 schema 未看到明確的 visibility 欄位 | 決定候選池過濾邏輯 | 待確認 |
| Q-2 | 是否需要支援未登入使用者的推薦？ | 影響 API 設計（user_id 是否必填） | 待確認 |
| Q-3 | 推薦服務是獨立部署還是與 Node.js 同機器？ | 影響通訊延遲與部署架構 | 待決策 |
| Q-4 | 現有 entity_stats 是否有記錄「誰」按讚/收藏的明細？或只有 count？ | 影響協同過濾是否能用 like/favorite 資料 | 待確認 |
| Q-5 | 推薦理由需要支援多語系嗎？ | 影響理由文字的儲存與生成方式 | 待確認 |
| Q-6 | Python AI backend 是否要與現有專案同 repo (monorepo) 還是獨立 repo？ | 影響 CI/CD 與程式碼管理 | 待決策 |

---

## Appendix A: 推薦理由類型定義

```
ReasonType = (
  "interest_match"      # 使用者興趣分類匹配
  "tag_match"           # 使用者歷史標籤匹配
  "similar_users"       # 相似使用者行為
  "popular"             # 整體熱門
  "trending"            # 近期趨勢上升
  "same_category"       # 同分類實踐
  "same_template"       # 同模板系列
  "pattern_similar"     # 實踐模式相似
  "preference_match"    # 學習偏好匹配
  "professional_match"  # 專業領域匹配
  "history_based"       # 基於使用者歷史行為 (Tag 推薦)
)

TagSuggestionSource = (
  "keyword"             # 標題/描述關鍵字直接匹配
  "semantic"            # 語意匹配 (embedding-based)
  "template_category"   # 模板分類關聯
  "user_history"        # 使用者常用標籤
  "co_occurrence"       # Tag 共現統計
)
```

## Appendix B: 使用者區段判定邏輯

```
def determine_user_segment(user_id):
    practice_count = count_user_practices(user_id)
    checkin_count = count_user_checkins(user_id)

    if practice_count == 0 and checkin_count == 0:
        return "cold_start"
    elif checkin_count < 10:
        return "normal"
    else:
        return "active"
```

## Appendix C: 相關技術文件

- [推薦系統技術規劃](./recommendation-system-plan.md) - 演算法與架構詳細設計
