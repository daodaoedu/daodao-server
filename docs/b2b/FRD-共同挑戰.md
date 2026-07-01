# FRD｜DaoDao 共同挑戰功能規格

## 架構概覽

```
daodao-f2e（前台）
├── /challenges                  挑戰主題列表
├── /challenges/:id              挑戰主題頁（含歷史期數）
├── /challenges/:id/seasons/:sid 本期詳情 + 打卡牆 + 排名
└── /me/challenges               我的挑戰進度

daodao-server（後端）
└── /api/v1/challenges/*         新增 challenges API

daodao-admin-ui（內部後台）
└── ChallengesPage               官方挑戰管理
```

---

## 核心概念

```
Challenge（主題，永久存在）
  「英檢 N3 備考衝刺」
  │
  ├── Season 1（2025 Q1）2025/01 → 2025/03  已結束
  ├── Season 2（2025 Q2）2025/04 → 2025/07  進行中 ← 加入這期
  └── Season 3（2025 Q4）2025/10 → 2025/12  即將開始（可預先報名）
```

- **Challenge** = 主題容器，累積社群口碑與歷史數據
- **Season** = 每一期，有明確開始/結束日，加入的是某一期
- 新人從最新一期加入，不影響歷史排名
- 老成員可以重複參加不同期

---

## 資料模型

### `challenges`（主題）

```sql
id                  Int       PK
external_id         UUID      unique
title               String    主題名稱（e.g., 英檢 N3 備考衝刺）
description         String?   說明
cover_url           String?   封面圖
category            String    exam | book | sport | certification | other
is_recurring        Boolean   是否週期性重複
recur_pattern       String?   yearly | quarterly | monthly | custom
checkin_prompt      String?   每日打卡提示語
has_ranking         Boolean   是否開啟排名
visibility          String    public | private
created_by          Int       FK → users
created_at          DateTime
updated_at          DateTime
```

### `challenge_seasons`（每一期）

```sql
id                  Int       PK
external_id         UUID      unique
challenge_id        Int       FK → challenges
season_number       Int       第幾期（1, 2, 3...）
title               String?   本期特定標題（可選，e.g., 「2025 七月場」）
target_description  String    本期共同目標（e.g., 通過 JLPT N3）
start_date          Date      開始日
end_date            Date      截止日
status              String    upcoming | active | ended
max_members         Int?      人數上限（null = 無限制）
created_at          DateTime
updated_at          DateTime
```

### `challenge_members`（加入某一期）

```sql
id                  Int       PK
season_id           Int       FK → challenge_seasons
user_id             Int       FK → users
personal_goal       String?   學員自訂目標（可選）
joined_at           DateTime
status              String    active | left
```

### `practices`（沿用，新增一個欄位）

```sql
-- 新增欄位
source_season_id    Int?      FK → challenge_seasons
-- 加入共同挑戰時自動建立對應的 practice
```

### `practice_checkins`（完全沿用，不動）

---

## API 規格

### 挑戰主題列表

```
GET /api/v1/challenges
Query: category, status(active|upcoming|ended), page, limit
Response: {
  data: {
    id, externalId, title, category, coverUrl,
    isRecurring,
    activeSeason: { id, seasonNumber, startDate, endDate, memberCount, totalCheckins }
    upcomingSeason: { id, seasonNumber, startDate } | null
    allTimeParticipants: number  // 歷史總參加人數
  }[]
  pagination: { ... }
}
```

### 挑戰主題詳情

```
GET /api/v1/challenges/:id
Response: {
  data: {
    ...challenge,
    seasons: {
      active: Season | null
      upcoming: Season | null
      past: Season[]
    }
    myHistory: {
      seasonId, seasonNumber, checkinCount, streak
    }[] | null
  }
}
```

### 本期詳情

```
GET /api/v1/challenges/:id/seasons/:seasonId
Response: {
  data: {
    ...season,
    memberCount: number,
    totalCheckins: number,
    todayCheckins: number,
    myStatus: 'joined' | 'not_joined'
    myCheckinCount: number | null
    myStreak: number | null
    daysLeft: number
    progressPercent: number
  }
}
```

### 加入某一期

```
POST /api/v1/challenges/:id/seasons/:seasonId/join
Body: { personalGoal?: string }
Action:
  1. 建立 challenge_members（season_id）
  2. 自動建立 practice（source_season_id 指向此 season）
Response: { data: { memberId, practiceId } }
```

### 預先報名（upcoming season）

```
POST /api/v1/challenges/:id/seasons/:seasonId/register
Action: 建立 challenge_members（status: 'registered'）
        season 開始時自動轉為 active + 建立 practice
Response: { data: { memberId } }
```

### 打卡牆

```
GET /api/v1/challenges/:id/seasons/:seasonId/checkins
Query: page, limit, date
Response: {
  data: {
    userId, displayName, avatarUrl,
    content, mediaUrl,
    checkinDate, createdAt
  }[]
}
```

### 排名

```
GET /api/v1/challenges/:id/seasons/:seasonId/ranking
Response: {
  data: {
    rank, userId, displayName, avatarUrl,
    totalCheckins, currentStreak, longestStreak
  }[]
  myRank: number | null
}
```

### 我的挑戰

```
GET /api/v1/me/challenges
Response: {
  data: {
    challenge: { id, title, coverUrl, category }
    season: { id, seasonNumber, endDate, status }
    myCheckinCount: number
    myStreak: number
    daysLeft: number
    progressPercent: number
    todayCheckedIn: boolean
  }[]
}
```

### Admin：建立主題

```
POST /api/v1/admin/challenges
Body: {
  title, description, coverUrl, category,
  isRecurring, recurPattern,
  checkinPrompt, hasRanking, visibility
}
```

### Admin：建立期數

```
POST /api/v1/admin/challenges/:id/seasons
Body: {
  seasonNumber, title, targetDescription,
  startDate, endDate, maxMembers
}
```

### Admin：查看期數數據

```
GET /api/v1/admin/challenges/:id/seasons/:seasonId/stats
Response: {
  memberCount, totalCheckins, todayCheckins,
  checkinRate, retention: { d7, d14, d30 },
  topMembers: { userId, displayName, checkinCount, streak }[]
}
```

---

## 前台頁面規格

### `/challenges`｜主題列表

```
┌─────────────────────────────────────────────────────┐
│  共同挑戰                                            │
│  [全部] [備考] [讀書] [運動] [認證]                  │
├─────────────────────────────────────────────────────┤
│  ┌────────────────┐  ┌────────────────┐             │
│  │  英檢 N3 備考  │  │ 神經可塑性讀書 │             │
│  │                │  │                │             │
│  │  👥 128 人加入 │  │  👥 64 人加入  │             │
│  │  ⏰ 剩 23 天   │  │  ⏰ 剩 7 天    │             │
│  │  📚 第 2 期    │  │  📚 第 1 期    │             │
│  │  [加入本期]    │  │  [加入本期]    │             │
│  └────────────────┘  └────────────────┘             │
│                                                     │
│  ┌────────────────┐                                 │
│  │  JLPT N5 備考  │                                 │
│  │  🔜 第 3 期    │                                 │
│  │  2025/10/01 開始                                 │
│  │  [預先報名]    │                                 │
│  └────────────────┘                                 │
└─────────────────────────────────────────────────────┘
```

---

### `/challenges/:id`｜主題頁

```
┌─────────────────────────────────────────────────────┐
│  英檢 N3 備考衝刺                                    │
│  已有 500 人參加過 • 第 2 期進行中                   │
├─────────────────────────────────────────────────────┤
│  本期（Season 2）                                    │
│  目標：通過 2025 年 7 月 JLPT N3                    │
│  2025/04/01 → 2025/07/20  剩 23 天                  │
│  👥 128 人   ✏️ 2,341 次打卡                         │
│  [加入本期]                                          │
├─────────────────────────────────────────────────────┤
│  下期（Season 3）預告                                │
│  2025/10/01 開始  [預先報名，開始時通知我]           │
├─────────────────────────────────────────────────────┤
│  歷史紀錄                                            │
│  Season 1  2025/01 → 2025/03  94 人完成             │
│  你的紀錄：打卡 28 天 🏅                            │
└─────────────────────────────────────────────────────┘
```

---

### `/challenges/:id/seasons/:sid`｜本期打卡頁

```
┌─────────────────────────────────────────────────────┐
│  英檢 N3 備考衝刺｜第 2 期                           │
│  剩 23 天  👥 128 人  ✏️ 2,341 次打卡               │
├─────────────────────────────────────────────────────┤
│  今日打卡提示：「今天練了幾題？有哪題卡住？」        │
│  [✏️ 今日打卡]                                      │
│  我的進度：🔥 連續 12 天  共 18 次  排名 #5          │
├──────────────────────┬──────────────────────────────┤
│  打卡牆              │  排名                        │
│                      │  1. 王小明  🔥 21 天         │
│  🧑 王小明           │  2. 李大華  🔥 18 天         │
│  今天練完聽力第3回   │  3. 陳美玲  🔥 15 天         │
│  錯了 8 題要加油     │  ...                         │
│                      │  5. 我      🔥 12 天 ← 我   │
│  🧑 李大華           │                              │
│  單字背到第 500 題   │                              │
└──────────────────────┴──────────────────────────────┘
```

---

### `/me/challenges`｜我的挑戰

```
┌─────────────────────────────────────────────────────┐
│  我的挑戰                                            │
├─────────────────────────────────────────────────────┤
│  英檢 N3 備考衝刺  第 2 期                           │
│  進度 ████████░░ 18/41 天  剩 23 天                 │
│  🔥 連續 12 天   排名 #5                            │
│  ✅ 今日已打卡                                       │
│  [查看詳情]                                          │
├─────────────────────────────────────────────────────┤
│  神經可塑性讀書會  第 1 期                           │
│  進度 ████░░░░░░ 8/30 天  剩 7 天                   │
│  🔥 連續 3 天                                        │
│  [今日打卡]  [查看詳情]                              │
└─────────────────────────────────────────────────────┘
```

---

## Admin 後台規格

### 挑戰管理頁面

**列表視圖**
- 所有主題，含本期狀態（active / upcoming / ended）
- 快速數據：本期人數、今日打卡率

**建立主題表單**
- 標題、分類、說明、封面圖
- 是否週期性、循環規律
- 打卡提示語、是否開啟排名

**建立/編輯期數表單**
- 期數編號、本期標題（選填）
- 目標描述、開始日、截止日、人數上限

**本期數據面板**
```
本期數據
  加入人數    128 人
  今日打卡    73 人（57%）
  整體打卡率  73%  ↑5%
  留存率      D7: 82%  D14: 71%  D30: 64%

成員列表（可搜尋）
  王小明  連續 21 天  共 38 次  [查看]
  李大華  連續 18 天  共 35 次  [查看]
  ...

停滯預警
  陳小明  5 天未打卡  [發通知]
```

---

## 實作順序

### Week 1：後端基礎
- `challenges` + `challenge_seasons` + `challenge_members` migration
- `practices` 新增 `source_season_id`
- Challenge CRUD API
- Season CRUD API

### Week 2：加入與打卡
- `POST /join` + `POST /register`（預先報名）
- 打卡牆 API
- 排名 API
- 我的挑戰 API

### Week 3：前台
- `/challenges` 列表頁
- `/challenges/:id` 主題頁（含 seasons）
- `/challenges/:id/seasons/:sid` 打卡頁
- `/me/challenges` 我的挑戰

### Week 4：Admin + 上線
- admin-ui ChallengesPage（主題管理 + 期數建立 + 數據面板）
- 建立首批官方挑戰資料
- E2E 測試

---

## 未來擴充（不在此次範圍）

- 付費競技型：報名費 → 排名獎金池
- 開放任何人建立挑戰（發起人後台 dashboard）
- 封閉挑戰邀請機制
- Push 通知（打卡提醒、快結束提醒）
- 學習計畫（project）整合
- 跨挑戰的學員成長地圖
