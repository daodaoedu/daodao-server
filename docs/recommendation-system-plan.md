# 主題實踐與使用者推薦系統 - Python AI Backend 規劃

## 1. 系統架構總覽

```
┌──────────────────┐     ┌──────────────────────────┐     ┌─────────────────┐
│  Node.js Server  │────>│   Python AI Backend      │<────│   PostgreSQL    │
│  (daodao-server) │<────│   (FastAPI)              │     │   (read-only)   │
│                  │     │                          │     └─────────────────┘
│  GET /api/v1/    │     │  - Recommendation Engine │     ┌─────────────────┐
│  recommendations │     │  - Feature Engineering   │     │   Redis         │
│                  │     │  - Model Serving         │     │   (cache)       │
└──────────────────┘     └──────────────────────────┘     └─────────────────┘
```

### 通訊模式

Node.js server 透過 internal HTTP 呼叫 Python AI backend，或者 Python backend 直接提供 API 給前端：

- **Option A (建議)**: Node.js 作為 API gateway，轉發推薦請求至 Python backend
- **Option B**: Python backend 獨立提供推薦 API，前端直接呼叫

---

## 2. 可用資料來源分析

### 2.1 使用者特徵 (User Features)

| 資料來源 | 資料表 | 關鍵欄位 | 用途 |
|---------|--------|---------|------|
| 基本資料 | `users` | `education_stage`, `gender`, `tag_list`, `professional_field` | 人口統計特徵 |
| 興趣分類 | `user_interests` → `categories` | `category_id` (最多 5 個) | 明確興趣偏好 |
| 偏好設定 | `user_preferences` → `preference_options` | `preference_option_id`, `preference_weight`, `access_count` | 學習風格偏好 |
| 專業領域 | `user_professional_fields` | 多選專業領域 | 職業相關推薦 |
| 活動統計 | `user_activity_stats` | 整體活動量 | 活躍度指標 |

### 2.2 主題實踐特徵 (Practice Features)

| 資料來源 | 資料表 | 關鍵欄位 | 用途 |
|---------|--------|---------|------|
| 實踐主體 | `practices` | `title`, `practice_action`, `status`, `duration_days`, `session_duration_minutes`, `frequency_*_days`, `practice_time_periods` | 實踐內容與模式 |
| 實踐標籤 | `entity_tags` (entity_type='practice') | `tag_id` → `tags.name` | 內容分類標籤 |
| 實踐模板 | `practice_templates` → `practice_template_categories` → `content_categories` | `category_id` | 模板類型分類 |
| 互動統計 | `entity_stats` (entity_type='practice') | `like_count`, `view_count`, `favorite_count`, `share_count`, `comment_count` | 熱門度指標 |
| 打卡記錄 | `practice_checkins` | `mood`, `checkin_date`, `note` | 用戶完成度與情感 |

### 2.3 隱式行為資料 (Implicit Behavioral Data)

| 行為 | 來源 | 信號強度 |
|------|------|---------|
| 建立實踐 | `practices.user_id` | 強 (主動建立) |
| 打卡完成 | `practice_checkins` | 強 (持續投入) |
| 打卡心情 | `practice_checkins.mood` | 中 (滿意度) |
| 按讚/收藏 | `entity_stats` | 中 (興趣信號) |
| 瀏覽次數 | `entity_stats.view_count` | 弱 (曝光度) |
| 使用模板 | `practices.template_id` | 中 (模板偏好) |

---

## 3. 推薦策略設計

### 3.1 推薦場景 (Use Cases)

#### 場景 A：為使用者推薦主題實踐 (Practice Recommendations for User)
- **目標**：推薦使用者可能感興趣的公開主題實踐
- **輸入**：`user_id`
- **輸出**：排序後的 practice 列表 + 推薦理由

#### 場景 B：為使用者推薦相似使用者 (Similar User Recommendations)
- **目標**：找到興趣相似的學習夥伴
- **輸入**：`user_id`
- **輸出**：排序後的 user 列表 + 相似度分數

#### 場景 C：為主題實踐推薦相似實踐 (Similar Practice Recommendations)
- **目標**：在實踐詳情頁推薦類似實踐
- **輸入**：`practice_id`
- **輸出**：排序後的 practice 列表

#### 場景 D：為使用者推薦實踐模板 (Template Recommendations)
- **目標**：新建實踐時推薦適合的模板
- **輸入**：`user_id`
- **輸出**：排序後的 practice_template 列表

### 3.2 推薦演算法分層

```
Layer 3: 混合排序 (Hybrid Ranking)
  ├── 加權融合多路召回結果
  └── 個人化 re-ranking

Layer 2: 多路召回 (Multi-channel Recall)
  ├── 基於內容 (Content-Based)
  ├── 協同過濾 (Collaborative Filtering)
  └── 熱門度 (Popularity-Based)

Layer 1: 特徵工程 (Feature Engineering)
  ├── User Embedding
  ├── Practice Embedding
  └── Interaction Features
```

---

## 4. 演算法詳細設計

### 4.1 Content-Based Filtering (基於內容的過濾)

**核心思路**：根據使用者興趣與實踐內容的匹配度推薦

```python
# User Profile Vector 組成
user_vector = {
    "interests": [...],           # 來自 user_interests (category_id list)
    "preferences": {...},         # 來自 user_preferences
    "professional_fields": [...], # 來自 user_professional_fields
    "education_stage": "...",     # 來自 users
    "practice_history_tags": [...], # 從已參與實踐的 tags 聚合
    "preferred_duration": ...,    # 從過去實踐的 duration_days 統計
    "preferred_time_periods": [...], # 從過去實踐的 time_periods 統計
    "preferred_frequency": ...,   # 從過去實踐的 frequency 統計
}

# Practice Feature Vector 組成
practice_vector = {
    "tags": [...],                # 來自 entity_tags
    "template_categories": [...], # 來自 practice_template_categories
    "duration_days": ...,
    "session_duration_minutes": ...,
    "frequency_range": (...),
    "time_periods": [...],
    "title_embedding": [...],     # NLP embedding of title + practice_action
}
```

**匹配計算**：
1. **分類匹配分數**：user interests ∩ practice tags/categories → Jaccard similarity
2. **文字語意匹配**：title/practice_action embedding vs user interest embedding → cosine similarity
3. **模式匹配**：duration/frequency/time_period 偏好吻合度
4. **加權融合**：`score = w1 * category_match + w2 * semantic_match + w3 * pattern_match`

### 4.2 Collaborative Filtering (協同過濾)

**核心思路**：興趣相似的使用者會喜歡相似的實踐

```python
# User-Practice Interaction Matrix
# Rows: users, Columns: practices
# Values: interaction strength (0-1)
#   - 建立實踐: 1.0
#   - 打卡 (happy/good mood): 0.8
#   - 打卡 (neutral): 0.5
#   - 打卡 (frustrated/bored): 0.3
#   - 收藏: 0.7
#   - 按讚: 0.5
#   - 瀏覽: 0.1
```

**方法選擇**（根據資料規模漸進）：

| 階段 | 方法 | 適用規模 | 說明 |
|------|------|---------|------|
| MVP | User-based KNN | < 10K users | 基於 interest/preference 的 user similarity |
| V1 | Item-based CF | < 50K interactions | 基於共同用戶的 practice similarity |
| V2 | Matrix Factorization (ALS/SVD) | > 50K interactions | 隱語意模型 |
| V3 | Neural CF / Two-Tower | 大規模 | Deep learning embeddings |

### 4.3 Popularity-Based (熱門度推薦)

**用於冷啟動與兜底**：

```python
popularity_score = (
    w1 * normalized(like_count) +
    w2 * normalized(favorite_count) +
    w3 * normalized(share_count) +
    w4 * normalized(comment_count) +
    w5 * time_decay(created_at) +          # 時間衰減，近期權重高
    w6 * normalized(active_checkin_users) + # 目前有人在打卡的
    w7 * completion_rate                   # 完成率高的實踐
)
```

### 4.4 Hybrid Ranking (混合排序)

```python
final_score = (
    alpha * content_based_score +
    beta  * collaborative_score +
    gamma * popularity_score +
    delta * diversity_bonus +     # 多樣性加分，避免過度集中
    epsilon * freshness_bonus    # 新內容加分
)

# 權重依使用者歷史調整：
# - 新用戶 (冷啟動): alpha=0.4, beta=0.0, gamma=0.5, delta=0.05, epsilon=0.05
# - 一般用戶:        alpha=0.35, beta=0.3, gamma=0.2, delta=0.1, epsilon=0.05
# - 活躍用戶:        alpha=0.25, beta=0.45, gamma=0.1, delta=0.15, epsilon=0.05
```

---

## 5. Python AI Backend 技術架構

### 5.1 技術選型

| 組件 | 技術 | 原因 |
|------|------|------|
| Web Framework | FastAPI | 高效能、自動 OpenAPI 文件、async 支援 |
| ORM | SQLAlchemy (read-only) | 直接讀取 PostgreSQL |
| Cache | Redis (aioredis) | 與現有 Node.js 共用 Redis |
| ML Framework | scikit-learn → PyTorch | 初期用 sklearn，後期可升級 |
| NLP | sentence-transformers | 多語言文字 embedding (中文支援) |
| Task Queue | Celery / APScheduler | 定時更新模型與特徵 |
| Monitoring | Prometheus + structlog | 效能監控與結構化日誌 |

### 5.2 專案結構

```
python-ai-backend/
├── app/
│   ├── main.py                    # FastAPI app entry
│   ├── config.py                  # Settings / env vars
│   ├── api/
│   │   ├── v1/
│   │   │   ├── recommendations.py # 推薦 API endpoints
│   │   │   ├── health.py          # Health check
│   │   │   └── admin.py           # 管理 API (重訓模型等)
│   │   └── deps.py                # Dependencies (DB, auth)
│   ├── core/
│   │   ├── engine.py              # RecommendationEngine 主入口
│   │   ├── feature_store.py       # 特徵工程與快取
│   │   ├── ranker.py              # 混合排序邏輯
│   │   └── explainer.py           # 推薦理由生成
│   ├── models/                    # ML 模型
│   │   ├── content_based.py       # Content-based filtering
│   │   ├── collaborative.py       # Collaborative filtering
│   │   ├── popularity.py          # Popularity ranking
│   │   └── embeddings.py          # Text embedding 管理
│   ├── data/
│   │   ├── db.py                  # Database connection (read-only)
│   │   ├── schemas.py             # SQLAlchemy models (mirror Prisma)
│   │   ├── cache.py               # Redis cache layer
│   │   └── queries.py             # 常用查詢
│   ├── tasks/
│   │   ├── scheduler.py           # 定時任務排程
│   │   ├── update_features.py     # 更新特徵向量
│   │   ├── retrain_model.py       # 重新訓練模型
│   │   └── warm_cache.py          # 預熱快取
│   └── utils/
│       ├── metrics.py             # Prometheus metrics
│       └── logging.py             # Structured logging
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── scripts/
│   ├── seed_embeddings.py         # 初始化 text embeddings
│   └── backfill_features.py       # 歷史資料回填
├── Dockerfile
├── pyproject.toml
├── requirements.txt
└── README.md
```

### 5.3 API 設計

#### 推薦主題實踐給使用者

```
GET /api/v1/recommendations/practices?user_id={uuid}&limit=20&strategy=hybrid

Response:
{
  "success": true,
  "data": [
    {
      "practice_id": "uuid-xxx",
      "score": 0.87,
      "reasons": [
        {"type": "interest_match", "detail": "符合你對「程式設計」的興趣"},
        {"type": "similar_users", "detail": "與你相似的學習者也在進行此實踐"}
      ],
      "source": "content_based"   // 來自哪個召回通道
    },
    ...
  ],
  "meta": {
    "strategy": "hybrid",
    "model_version": "v1.2.0",
    "user_segment": "active"      // cold_start | normal | active
  }
}
```

#### 推薦相似使用者

```
GET /api/v1/recommendations/users?user_id={uuid}&limit=10

Response:
{
  "success": true,
  "data": [
    {
      "user_id": "uuid-xxx",
      "similarity_score": 0.82,
      "common_interests": ["education_learning", "arts_and_design"],
      "common_practices_count": 3
    },
    ...
  ]
}
```

#### 推薦相似實踐

```
GET /api/v1/recommendations/practices/{practice_id}/similar?limit=10

Response:
{
  "success": true,
  "data": [
    {
      "practice_id": "uuid-xxx",
      "similarity_score": 0.91,
      "reasons": [
        {"type": "tag_overlap", "detail": "共同標籤：閱讀、自我成長"},
        {"type": "pattern_similar", "detail": "相似的練習模式（每日30分鐘）"}
      ]
    },
    ...
  ]
}
```

#### 推薦實踐模板

```
GET /api/v1/recommendations/templates?user_id={uuid}&limit=5

Response:
{
  "success": true,
  "data": [
    {
      "template_id": "uuid-xxx",
      "score": 0.75,
      "reasons": [
        {"type": "interest_match", "detail": "符合你的學習偏好"}
      ]
    },
    ...
  ]
}
```

---

## 6. 特徵工程詳細

### 6.1 User Feature Vector

```python
@dataclass
class UserFeatures:
    user_id: int

    # 靜態特徵 (profile-based)
    education_stage: str                    # one-hot encoded
    gender: str                             # one-hot encoded
    interest_category_ids: list[int]        # multi-hot encoded
    preference_options: dict[int, float]    # {option_id: weight}
    professional_fields: list[str]          # multi-hot encoded
    tag_ids: list[int]                      # from user tags

    # 行為特徵 (behavior-based)
    total_practices_created: int
    active_practices_count: int
    completed_practices_count: int
    total_checkins: int
    avg_checkin_mood: float                 # mood 轉為數值 0-5
    checkin_consistency: float              # 打卡規律性 0-1
    preferred_duration_days: float          # 偏好的實踐天數中位數
    preferred_session_minutes: float        # 偏好的每次時長中位數
    preferred_time_periods: list[str]       # 偏好的時段分佈
    preferred_frequency_days: float         # 偏好的打卡頻率

    # 互動特徵 (engagement-based)
    like_given_count: int
    favorite_given_count: int

    # 模板偏好
    used_template_category_ids: list[int]   # 使用過的模板類別

    # 計算屬性
    user_segment: str                       # cold_start | normal | active
    days_since_registration: int
    last_active_days_ago: int
```

### 6.2 Practice Feature Vector

```python
@dataclass
class PracticeFeatures:
    practice_id: int
    creator_user_id: int

    # 內容特徵
    title_embedding: list[float]            # sentence-transformer embedding
    action_embedding: list[float]           # practice_action embedding
    tag_ids: list[int]                      # entity_tags
    template_category_ids: list[int]        # from template

    # 結構特徵
    duration_days: int
    session_duration_minutes: int
    frequency_min_days: int
    frequency_max_days: int
    time_periods: list[str]
    has_resources: bool

    # 熱門度特徵
    like_count: int
    view_count: int
    favorite_count: int
    share_count: int
    comment_count: int

    # 品質特徵
    total_participants: int                  # 多少人用這個模板/類似實踐
    avg_completion_rate: float              # 平均完成率
    avg_mood_score: float                   # 平均心情分數
    active_checkin_users: int              # 目前活躍打卡人數

    # 時間特徵
    created_at: datetime
    days_since_created: int
```

### 6.3 Feature 更新策略

| 特徵類型 | 更新頻率 | 方式 |
|---------|---------|------|
| User 靜態特徵 | 即時 (webhook/event) | Node.js 通知 Python backend |
| User 行為特徵 | 每小時 | 定時 batch 計算 |
| Practice 內容特徵 | 建立/更新時 | Event-driven |
| Practice 熱門度特徵 | 每 30 分鐘 | 定時 batch 計算 |
| Text Embeddings | 建立/更新時 | 即時計算 + 快取 |
| ML Model | 每日 | 離線訓練 |

---

## 7. 冷啟動處理

### 7.1 新使用者冷啟動

```
Step 1: 有 user_interests? → 用 interest categories 做 content-based
Step 2: 有 user_preferences? → 加入 preference 維度
Step 3: 都沒有? → Popularity-based + education_stage 過濾
Step 4: 使用者開始互動後 → 逐步加入 collaborative signals
```

### 7.2 新實踐冷啟動

```
Step 1: 有 tags? → 基於 tag overlap 找相似實踐
Step 2: 有 template_id? → 基於模板類別推薦給相關用戶
Step 3: 都沒有? → 用 title embedding 找語意相似實踐
Step 4: 累積互動資料後 → 加入 collaborative signals
```

---

## 8. 效能與快取策略

### 8.1 快取架構

```
Redis Cache Layout:
├── rec:user:{user_id}:practices     # 使用者推薦結果 (TTL: 30min)
├── rec:user:{user_id}:users         # 相似使用者 (TTL: 1h)
├── rec:practice:{id}:similar        # 相似實踐 (TTL: 1h)
├── feat:user:{user_id}              # User feature vector (TTL: 1h)
├── feat:practice:{id}               # Practice feature vector (TTL: 30min)
├── embed:practice:{id}              # Practice text embedding (TTL: 24h)
├── pop:practices:global             # 全域熱門排行 (TTL: 15min)
└── pop:practices:category:{cat_id}  # 分類熱門排行 (TTL: 15min)
```

### 8.2 效能目標

| 指標 | 目標 | 說明 |
|------|------|------|
| API 延遲 (P95) | < 200ms | 包含快取命中 |
| API 延遲 (P95, cache miss) | < 1s | 即時計算 |
| 特徵計算 | < 500ms | 單使用者 |
| 模型推論 | < 100ms | 單次推薦 |
| Cache hit rate | > 80% | 推薦結果快取 |

---

## 9. 與 Node.js Server 的整合方式

### 9.1 Node.js 端新增

```
Node.js (daodao-server) 需要新增：

1. 推薦 API proxy route:
   GET /api/v1/recommendations/practices
   GET /api/v1/recommendations/users
   GET /api/v1/recommendations/practices/:id/similar
   GET /api/v1/recommendations/templates

2. Event notification (optional, 用於即時特徵更新):
   - 使用者更新 interests/preferences → 通知 Python backend
   - 新實踐建立/更新 → 通知 Python backend
   - 新打卡記錄 → 通知 Python backend

3. 整合方式選項：
   A. HTTP proxy (簡單): Node.js 轉發請求到 Python backend
   B. Message queue (進階): 用 Redis pub/sub 或 Bull queue
   C. gRPC (高效能): 適合高流量場景
```

### 9.2 資料同步

```
Python backend 直接讀取 PostgreSQL (read-only connection)
不需要資料複製，減少一致性問題

連線配置：
- 使用與 Node.js 相同的 PostgreSQL
- 設定 read-only 角色，限制只能 SELECT
- Connection pooling 獨立管理
```

---

## 10. 分階段實施計畫

### Phase 1: MVP (基礎推薦)

**目標**：上線最基本的推薦功能

**範圍**：
- Content-based filtering (interest/tag matching)
- Popularity-based ranking (fallback)
- 推薦主題實踐給使用者 (場景 A)
- 推薦相似實踐 (場景 C)
- Redis 快取

**產出**：
- FastAPI 專案骨架
- 基本特徵工程 pipeline
- 2 個推薦 API endpoints
- 基本快取機制

### Phase 2: V1 (協同過濾 + 更多場景)

**目標**：加入協同過濾，提升推薦品質

**範圍**：
- User-based / Item-based Collaborative Filtering
- Hybrid ranking (content + CF + popularity)
- 推薦相似使用者 (場景 B)
- 推薦實踐模板 (場景 D)
- 推薦理由生成
- A/B testing 框架

**產出**：
- 完整 4 個推薦場景
- 混合排序策略
- 推薦理由文字

### Phase 3: V2 (進階優化)

**目標**：深度學習模型 + 即時更新

**範圍**：
- Sentence-transformer embeddings (中文語意)
- Matrix Factorization / Neural CF
- 即時特徵更新 (event-driven)
- 推薦多樣性優化
- 使用者回饋迴路 (feedback loop)
- 效能優化

**產出**：
- 語意理解推薦
- 即時個人化
- 完整監控面板

---

## 11. 評估指標

### 離線指標

| 指標 | 說明 | 目標 |
|------|------|------|
| Precision@K | 推薦 K 個中有幾個相關 | > 0.3 |
| Recall@K | 相關項目中推薦了幾個 | > 0.2 |
| NDCG@K | 排序品質 | > 0.4 |
| Coverage | 能推薦的 practice 比例 | > 70% |
| Diversity | 推薦結果的多樣性 | > 0.5 |

### 線上指標

| 指標 | 說明 |
|------|------|
| CTR | 推薦實踐的點擊率 |
| Adoption Rate | 推薦後建立/參與實踐的比例 |
| Checkin Rate | 推薦實踐的打卡率 |
| User Retention | 使用推薦功能的用戶留存率 |

---

## 12. 資料庫 Read-Only 查詢範例

以下是 Python backend 需要的主要查詢：

```sql
-- 取得使用者完整特徵
SELECT u.id, u.external_id, u.education_stage, u.gender, u.tag_list,
       u.professional_field
FROM users u
WHERE u.external_id = :user_uuid AND u.is_active = true;

-- 取得使用者興趣
SELECT c.id, c.name
FROM user_interests ui
JOIN categories c ON c.id = ui.category_id
WHERE ui.user_id = :user_id;

-- 取得使用者偏好
SELECT up.preference_option_id, up.preference_weight, up.access_count,
       po.value, po.name, pt.value as type_value
FROM user_preferences up
JOIN preference_options po ON po.id = up.preference_option_id
JOIN preference_types pt ON pt.id = po.preference_type_id
WHERE up.user_id = :user_id AND up.is_selected = true;

-- 取得使用者的實踐歷史（行為特徵）
SELECT p.id, p.title, p.template_id, p.status, p.duration_days,
       p.session_duration_minutes, p.frequency_min_days, p.frequency_max_days,
       p.practice_time_periods, p.progress_percentage
FROM practices p
WHERE p.user_id = :user_id AND p.deleted_at IS NULL;

-- 取得實踐的打卡統計
SELECT pc.practice_id, COUNT(*) as checkin_count,
       AVG(CASE mood
           WHEN 'happy' THEN 5
           WHEN 'good' THEN 4
           WHEN 'neutral' THEN 3
           WHEN 'bored' THEN 2
           WHEN 'frustrated' THEN 1
           WHEN 'give_up' THEN 0
       END) as avg_mood
FROM practice_checkins pc
WHERE pc.user_id = :user_id
GROUP BY pc.practice_id;

-- 取得公開的活躍實踐（候選池）
SELECT p.id, p.external_id, p.title, p.practice_action,
       p.duration_days, p.session_duration_minutes,
       p.frequency_min_days, p.frequency_max_days,
       p.practice_time_periods, p.template_id, p.user_id,
       p.created_at
FROM practices p
WHERE p.status IN ('active', 'not_started')
  AND p.deleted_at IS NULL;

-- 取得實踐的 tags
SELECT et.entity_id as practice_id, t.id as tag_id, t.name as tag_name
FROM entity_tags et
JOIN tags t ON t.id = et.tag_id
WHERE et.entity_type = 'practice'
  AND et.entity_id = ANY(:practice_ids);

-- 取得實踐的互動統計
SELECT es.entity_id as practice_id,
       es.like_count, es.view_count, es.favorite_count,
       es.share_count, es.comment_count
FROM entity_stats es
WHERE es.entity_type = 'practice'
  AND es.entity_id = ANY(:practice_ids);
```
