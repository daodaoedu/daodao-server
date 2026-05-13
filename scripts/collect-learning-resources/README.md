# Learning Resources Collector

從多個平台自動收集學習資源的 CLI 工具，支援去重、品質評分，並輸出為 CSV 格式。

## 功能特點

- **多平台支援**：YouTube、GitHub、Threads、Reddit、Hacker News
- **智慧去重**：URL 正規化 + 歷史記錄追蹤 + 跨平台計數
- **品質評分**：0-100 分的多維度評分系統
- **時間過濾**：只收集指定天數內的新資源
- **推薦關鍵字**：自動搜尋社群推薦類型的內容

## 快速開始

```bash
# 基本使用（收集所有平台）
npx tsx scripts/collect-learning-resources/index.ts

# 指定平台
npx tsx scripts/collect-learning-resources/index.ts --platform youtube,github

# 自訂關鍵字
npx tsx scripts/collect-learning-resources/index.ts --keywords "React,TypeScript,學習"

# 設定品質門檻
npx tsx scripts/collect-learning-resources/index.ts --min-score 50

# 查看說明
npx tsx scripts/collect-learning-resources/index.ts --help
```

## 環境變數

| 變數名稱 | 必要性 | 說明 |
|---------|--------|------|
| `YOUTUBE_API_KEY` | YouTube 必要 | YouTube Data API v3 金鑰 |
| `GITHUB_TOKEN` | 選用 | GitHub Personal Access Token（提高 API 速率限制） |
| `THREADS_ACCESS_TOKEN` | Threads 必要 | Meta Threads API 長效存取權杖 |

> Reddit 和 Hacker News 使用公開 API，不需要金鑰。

### 設定方式

在專案根目錄的 `.env` 檔案中加入：

```bash
# Learning Resources Collector
YOUTUBE_API_KEY=你的_YouTube_API_金鑰
GITHUB_TOKEN=你的_GitHub_Personal_Access_Token
THREADS_ACCESS_TOKEN=你的_Threads_存取權杖
```

### 取得金鑰

| 環境變數 | 取得位置 |
|---------|---------|
| `YOUTUBE_API_KEY` | [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials |
| `GITHUB_TOKEN` | [GitHub Settings](https://github.com/settings/tokens) → Personal Access Tokens |
| `THREADS_ACCESS_TOKEN` | [Meta for Developers](https://developers.facebook.com/) → 建立 Threads App |

### 執行時載入

```bash
# 方法 1：使用 dotenv-cli
npx dotenv -- npx tsx scripts/collect-learning-resources/index.ts

# 方法 2：直接 export（臨時使用）
export YOUTUBE_API_KEY="你的金鑰"
npx tsx scripts/collect-learning-resources/index.ts
```

## CLI 參數

| 參數 | 簡寫 | 預設值 | 說明 |
|------|------|--------|------|
| `--platform` | `-p` | 全部 | 指定平台：`youtube,github,threads,reddit,hackernews` |
| `--keywords` | `-k` | 內建清單 | 逗號分隔的搜尋關鍵字 |
| `--output` | `-o` | `output/resources-{timestamp}.csv` | 輸出 CSV 路徑 |
| `--max-results` | `-m` | 10 | 每個關鍵字每個平台的最大結果數 |
| `--min-score` | `-s` | 40 | 最低品質分數門檻 (0-100) |
| `--recent-days` | `-r` | 90 | 只收集最近 N 天的資源（0 = 不限制） |
| `--no-recommendations` | - | false | 排除推薦類型關鍵字 |

## 處理流程

```
收集 (Collect) → 去重 (Deduplicate) → 評分 (Score) → 過濾 (Filter) → 輸出 (CSV)
```

### 1. 收集 (Collect)

從各平台 API 擷取資源：

| 平台 | API | 收集內容 |
|------|-----|---------|
| YouTube | Data API v3 | 教學影片、頻道資訊 |
| GitHub | Search API | 學習相關 Repository |
| Threads | Graph API | 學習分享貼文 |
| Reddit | Public JSON API | 程式學習相關討論串 |
| Hacker News | Algolia API | 熱門學習資源連結 |

### 2. 去重 (Deduplicate)

三層去重機制：

1. **歷史記錄**：比對 `data/collected-history.json`，跳過已收集的 URL
2. **URL 正規化**：處理各種 URL 變體
   - `youtu.be/X` ↔ `youtube.com/watch?v=X`
   - `www.` 前綴、`http/https`、追蹤參數等
3. **跨平台計數**：同一資源在多個平台出現時，記錄出現次數並加分

### 3. 品質評分 (Quality Scoring)

五個評分維度，總分 0-100：

| 維度 | 分數 | 說明 |
|------|------|------|
| **Engagement** | 0-30 | 互動指標（觀看數、星星數、點讚數等） |
| **Content** | 0-30 | 內容品質（描述長度、教育關鍵字、結構化內容） |
| **Authority** | 0-20 | 來源權威性（訂閱數、專案完整度、社群認同度） |
| **Freshness** | 0-20 | 新鮮度（發布/更新時間） |
| **Cross-platform** | 0-10 | 跨平台加分（多平台出現 = 更有價值） |

#### 各平台評分邏輯

**YouTube**
- Engagement：觀看數 + 按讚率
- Authority：頻道訂閱數

**GitHub**
- Engagement：Stars + Forks
- Authority：有 Wiki、Pages、License、活躍 Issues

**Reddit**
- Engagement：Upvotes + 留言數
- Authority：Upvote ratio + 討論熱度

**Hacker News**
- Engagement：Points + 留言數
- Authority：HN 社群本身選擇性高，高分即為權威

### 4. 過濾 (Filter)

- 低於 `--min-score` 門檻的資源會被過濾
- 輸出結果依品質分數降序排列

## 輸出格式

CSV 欄位對應 `resources` 資料表結構：

| 欄位 | 說明 |
|------|------|
| `name` | 資源標題 |
| `url` | 資源連結 |
| `image_url` | 縮圖/預覽圖 URL |
| `description` | 資源描述 |
| `video_url` | 影片 URL（主要用於 YouTube） |
| `type` | 資源類型（video_content, books_articles 等） |
| `cost` | 付費類型（free, paid, partial_free） |
| `level` | 難度等級（beginner, intermediate, expert, all_levels） |
| `tags` | 逗號分隔的標籤 |
| `source_platform` | 來源平台 |
| `source_id` | 平台原始 ID |
| `published_at` | 發布時間 |
| `quality_score` | 品質分數 (0-100) |

## 目錄結構

```
collect-learning-resources/
├── index.ts              # CLI 入口點
├── config.ts             # 設定與預設關鍵字
├── types.ts              # TypeScript 型別定義
├── collectors/           # 各平台收集器
│   ├── youtube.collector.ts
│   ├── github.collector.ts
│   ├── threads.collector.ts
│   ├── reddit.collector.ts
│   └── hackernews.collector.ts
├── utils/
│   ├── dedup.ts          # 去重邏輯
│   ├── quality-scorer.ts # 品質評分
│   └── csv-writer.ts     # CSV 輸出
├── data/                 # 本地資料
│   └── collected-history.json  # 去重歷史記錄（自動產生）
└── output/               # CSV 輸出目錄
```

## 預設關鍵字

### 教學類
- 程式設計 教學、programming tutorial、線上課程 推薦
- learn coding、學習資源、web development
- data science tutorial、自學 程式

### 推薦類（社群驗證）
- 最推薦 課程、學完 心得、後悔沒早學
- best resources for learning、must read programming
- underrated programming resources、wish I knew earlier

## 使用範例

```bash
# 只收集 YouTube 和 GitHub 的 React 相關資源
npx tsx scripts/collect-learning-resources/index.ts \
  --platform youtube,github \
  --keywords "React 教學,React hooks tutorial" \
  --min-score 60

# 收集最近一個月的高品質資源
npx tsx scripts/collect-learning-resources/index.ts \
  --recent-days 30 \
  --min-score 70

# 不使用推薦類關鍵字
npx tsx scripts/collect-learning-resources/index.ts \
  --no-recommendations
```

## 注意事項

- **API 配額**：YouTube API 有每日配額限制，請注意使用量
- **速率限制**：GitHub 未認證時每小時 60 次，認證後 5000 次
- **重複執行**：去重機制會自動跳過已收集的資源
- **歷史記錄**：`data/collected-history.json` 會持續累積，可手動清除重新收集
