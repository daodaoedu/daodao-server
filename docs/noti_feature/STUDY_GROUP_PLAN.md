# 通知系統設計 - 讀書會規劃文件

## 導讀大綱

本次讀書會結合《系統設計面試指南》第 10 章與 DaoDao 學習平台的實際案例，深入探討通知系統的設計與實作。

> **參考原文**：[CHAPTER 10：DESIGN A NOTIFICATION SYSTEM](https://github.com/Admol/SystemDesign/blob/main/CHAPTER%2010%EF%BC%9ADESIGN%20A%20NOTIFICATION%20SYSTEM.md)

**範圍限定**：本次導讀聚焦於三個核心場景：

1. **主題實踐功能** - 實踐建立通知、打卡通知、每週回顧、完成總結
2. **社群互動** - 評論、按讚
3. **註冊登入相關** - 郵箱驗證、密碼重置、安全警告

---

## 書中四步驟框架

《系統設計面試指南》採用標準的四步驟面試流程：

| 步驟 | 名稱 | 內容 | 本次對應 |
| ---- | ---- | ---- | -------- |
| Step 1 | 了解問題並確定設計範圍 | 釐清通知類型、實時性、設備、觸發方式 | 需求確認 |
| Step 2 | 提出高層次設計方案 | 核心組件、資料流程、架構圖 | 高層設計 |
| Step 3 | 深入設計 | 可靠性、模板、設定、速率限制、重試 | 深入設計 |
| Step 4 | 總結 | 強調設計亮點、回顧關鍵決策 | 面試總結 |

---

## 讀書會資訊

| 項目 | 內容 |
| ---- | ---- |
| 主題 | 通知系統設計 - 從面試到實戰 |
| 時長 | 預計 90-120 分鐘 |
| 形式 | 導讀 + 案例分析 + 實作討論 |

### 議程規劃

| 時間 | 內容 | 形式 |
| ---- | ---- | ---- |
| 15 min | 需求確認 (Step 1) | 導讀 + 討論 |
| 20 min | 高層設計 (Step 2) | 架構圖解說 |
| 30 min | 深入設計 (Step 3) | 案例分析 |
| 15 min | DaoDao 實作方案 | 實戰規劃 |
| 10 min | 休息 | - |
| 15 min | 面試常見問題 (Step 4) | Q&A 演練 |
| 10 min | 討論與總結 | 開放討論 |

---

## 第一部分：需求確認 (Step 1)

### 經典面試問題

在設計通知系統前，需要釐清以下問題：

| 問題 | 標準答案 | DaoDao 需求 |
| ---- | -------- | ----------- |
| 支援哪些通知類型？ | Push、SMS、Email | 站內通知 + Email |
| 是實時系統嗎？ | 軟實時（允許輕微延遲） | 軟實時 |
| 支援哪些設備？ | iOS、Android、Desktop | Web 瀏覽器（優先） |
| 什麼觸發通知？ | 客戶端應用或伺服器排程 | 用戶互動事件 + 排程任務 |
| 用戶能退訂嗎？ | 是 | 必須有（通知偏好設定） |
| 每日通知量？ | 1000萬+ | 初期小規模（數千~萬） |

---

### DaoDao 限定範圍通知類型

#### 1. 主題實踐功能通知

DaoDao 的「主題實踐」是一個 7/14/21/30 天的學習計畫功能，包含以下通知：

| 代碼 | 名稱 | 觸發時機 | 優先級 |
| ---- | ---- | -------- | ------ |
| PE01 | 建立成功 | 建立實踐後即時發送 | 🔴 高 |
| PE02 | 第一次打卡 | 首次打卡後即時發送 | 🔴 高 |
| PE03 | 每週回顧（有打卡文字） | 每第 7 天發送 | 🟡 中 |
| PE04 | 每週回顧（無打卡文字） | 每第 7 天發送 | 🟡 中 |
| PE05 | 每週回顧（從未打卡） | 每第 7 天發送 | 🟡 中 |
| PE06 | 每週回顧（當週無打卡） | 每第 7 天發送 | 🟡 中 |
| PE07 | 完成總結（有打卡） | 結束後 24 小時內 | 🟡 中 |
| PE08 | 完成總結（無打卡） | 結束後 24 小時內 | 🟡 中 |

#### 2. 社群互動通知

| 類型 | 說明 | 優先級 |
| ---- | ---- | ------ |
| `comment_received` | 收到評論 | 🟡 中 |
| `comment_reply` | 評論被回覆 | 🟡 中 |
| `content_liked` | 內容被按讚 | 🟢 低 |

#### 3. 註冊登入相關通知

| 類型 | 說明 | 優先級 |
| ---- | ---- | ------ |
| `email_verification` | 郵箱驗證 | 🔴 高 |
| `password_reset` | 密碼重置 | 🔴 高 |
| `security_alert` | 安全警告（異常登入） | 🔴 高 |
| `welcome` | 歡迎通知 | 🟡 中 |

---

### 通知優先級分類

```text
┌─────────────────────────────────────────────────────────────┐
│                      通知優先級金字塔                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│     🔴 高優先級 - 立即發送                                    │
│     ├── 郵箱驗證 (email_verification)                        │
│     ├── 密碼重置 (password_reset)                            │
│     ├── 安全警告 (security_alert)                            │
│     ├── 實踐建立成功 (PE01)                                   │
│     └── 首次打卡 (PE02)                                       │
│                                                             │
│     🟡 中優先級 - 排程發送                                     │
│     ├── 收到評論 (comment_received)                          │
│     ├── 評論被回覆 (comment_reply)                           │
│     ├── 每週回顧 (PE03-PE06)                                  │
│     └── 完成總結 (PE07-PE08)                                  │
│                                                             │
│     🟢 低優先級 - 每日彙總                                     │
│     └── 內容被按讚 (content_liked)                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 第二部分：高層設計 (Step 2)

> **書中要點**：初始設計有三個問題：(1) 單點故障 (2) 難以擴展 (3) 性能瓶頸。
> 改進後的設計：將數據庫和緩存獨立部署、水平擴展通知服務器、引入消息隊列實現解耦。

### 經典架構（書中改進後範例）

```text
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Service    │───▶│ Notification │───▶│    Queue     │
│  (Trigger)   │    │   Service    │    │  (Kafka等)   │
└──────────────┘    └──────────────┘    └──────────────┘
                                               │
                    ┌──────────────────────────┼──────────────────────────┐
                    ▼                          ▼                          ▼
            ┌──────────────┐          ┌──────────────┐          ┌──────────────┐
            │  iOS Worker  │          │Android Worker│          │ Email Worker │
            │    (APNS)    │          │    (FCM)     │          │  (Sendgrid)  │
            └──────────────┘          └──────────────┘          └──────────────┘
```

**書中各組件說明**：

| 組件 | 功能 |
| ---- | ---- |
| **服務 1 到 N** | 微服務、cron job 或分布式系統，觸發通知發送事件 |
| **通知服務器** | 提供 API、進行基本驗證、查詢數據、將通知放入隊列 |
| **緩存** | 用戶信息、設備信息、通知模板 |
| **數據庫** | 存儲用戶、通知、設置等數據 |
| **消息隊列** | 消除組件依賴、作為緩衝區、每種類型獨立隊列 |
| **Workers** | 從隊列拉取事件並發送到第三方服務 |

### DaoDao 設計架構

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                           觸發事件層                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  主題實踐    │  │  社群互動   │  │  認證事件    │  │  排程任務   │     │
│  │ 建立/打卡   │  │ 評論/按讚  │  │ 註冊/登入   │  │ Cron Jobs  │     │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘     │
└─────────┼────────────────┼────────────────┼────────────────┼────────────┘
          │                │                │                │
          └────────────────┴────────────────┴────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      NotificationEventHandler                            │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  1. 檢查用戶通知偏好設定（是否開啟此類通知）                        │    │
│  │  2. 去重檢查（相同通知是否已存在）                                  │    │
│  │  3. 判斷優先級                                                     │    │
│  │  4. 決定發送渠道（站內/Email）                                     │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     Notification Queue (Bull + Redis)                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐          │
│  │ 🔴 High Queue   │  │ 🟡 Medium Queue │  │ 🟢 Low Queue    │          │
│  │ 即時處理        │  │ 排程批次        │  │ 每日彙總        │          │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘          │
└───────────┼────────────────────┼────────────────────┼────────────────────┘
            │                    │                    │
            └────────────────────┴────────────────────┘
                                 │
            ┌────────────────────┴────────────────────┐
            ▼                                         ▼
┌─────────────────────────┐            ┌─────────────────────────┐
│    站內通知發送器         │            │    郵件通知發送器        │
│    (WebSocket/SSE)       │            │    (Nodemailer)         │
└─────────────────────────┘            └─────────────────────────┘
            │                                         │
            ▼                                         ▼
┌─────────────────────────┐            ┌─────────────────────────┐
│    PostgreSQL            │            │    Email Inbox          │
│    notifications 表      │            │    用戶信箱             │
└─────────────────────────┘            └─────────────────────────┘
```

### 關鍵差異分析

| 層面 | 大型系統 | DaoDao |
| ---- | -------- | ------ |
| 訊息佇列 | Kafka/RabbitMQ | Bull + Redis |
| 推送方式 | APNS/FCM/Email | WebSocket + Email |
| 擴展性 | 水平擴展 Worker | 單一服務（初期） |
| 資料庫 | 分散式 DB | PostgreSQL + Redis |
| 規模 | 日發送量 1000萬+ | 初期數千~萬 |

---

## 第三部分：深入設計 (Step 3)

書中提到深入設計需要考慮以下關鍵組件：

| 組件 | 說明 | DaoDao 對應 |
| ---- | ---- | ----------- |
| **可靠性 (Reliability)** | 防止資料丟失、去重機制 | DB 持久化 + Redis 去重 |
| **通知模板 (Template)** | 預格式化通知、變數替換 | Email 模板 (PE01-PE08) |
| **通知設定 (Settings)** | 用戶 opt-in/opt-out | notification_preferences |
| **速率限制 (Rate Limit)** | 防止通知轟炸 | 沉默邏輯 + 新手緩衝 |
| **重試機制 (Retry)** | 失敗重試、指數退避 | Bull Queue + 3 次重試 |
| **安全性 (Security)** | API 認證、appKey/appSecret | JWT 認證 |
| **監控追蹤 (Monitoring)** | 隊列深度、打開率、點擊率 | email_logs + 分析 |

---

### 3.1 可靠性機制

> **書中要點**：「通知系統最重要的要求之一是它不能丟失數據。通知通常可以延遲或重新排序，但絕不會丟失。」

#### 經典做法：防止資料丟失

```text
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Service   │────▶│  Database   │────▶│   Queue     │
│             │     │ (持久化)    │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
                          │
                          ▼
                    ┌─────────────┐
                    │ Retry Logic │
                    │ (指數退避)  │
                    └─────────────┘
```

#### DaoDao 實作方案

```typescript
// src/services/notification/notification.service.ts

export async function createNotification(
  data: CreateNotificationRequest
): Promise<NotificationData> {
  // Step 1: 先持久化到資料庫（確保不丟失）
  const notification = await prisma.notifications.create({
    data: {
      user_id: data.user_id,
      type: data.type,
      title: data.title,
      content: data.content,
      priority: data.priority || 'medium',
      status: 'pending',
      data: data.data,
    },
  });

  // Step 2: 加入對應優先級的隊列
  await enqueueNotification(notification);

  return notification;
}

async function enqueueNotification(notification: NotificationData) {
  const queue = getQueueByPriority(notification.priority);

  await queue.add('send-notification', {
    notificationId: notification.id,
  }, {
    attempts: 3,  // 最多重試 3 次
    backoff: {
      type: 'exponential',
      delay: 2000,  // 2秒、4秒、8秒
    },
  });
}
```

---

### 3.2 去重策略

> **書中要點**：「儘管大多數時候通知只發送一次，但分布式特性可能會導致重複通知。為了減少重複的發生，我們引入了重複數據刪除機制。當一個通知事件第一次到達時，我們通過檢查事件的 ID 來檢查它是否在之前出現過。」

#### 經典做法

```text
if (cache.exists(notification_key)) {
    return; // 已發送，跳過
}
send(notification);
cache.set(notification_key, TTL=24h);
```

#### DaoDao 實作方案

```typescript
// 去重 Key 生成策略
function generateDedupKey(data: CreateNotificationRequest): string {
  // 對於互動類通知：actor + target + type
  if (['comment_received', 'comment_reply', 'content_liked'].includes(data.type)) {
    return `dedup:${data.user_id}:${data.type}:${data.data?.targetId}:${data.data?.actorId}`;
  }

  // 對於 Email 類通知：practice + type + 日期
  if (data.type.startsWith('PE')) {
    const dateKey = new Date().toISOString().split('T')[0];
    return `dedup:${data.data?.practiceId}:${data.type}:${dateKey}`;
  }

  return `dedup:${data.user_id}:${data.type}:${Date.now()}`;
}
```

---

### 3.3 場景一：主題實踐功能

#### 主題實踐簡介

DaoDao 的「主題實踐」是一個讓使用者將模糊興趣轉化為具體行動計劃的功能：

- **週期**：7/14/21/30 天
- **頻率**：每週 1-7 天執行
- **打卡**：一日僅可打卡一次，可上傳最多 3 張圖片
- **進度計算**：建立 20% → 首次打卡 50% → 剩餘平均分配

> **書中關於通知模板的說明**：
> 「一個大型的通知系統每天會發出數百萬條通知，其中許多通知都遵循類似的格式。通知模板的引入是為了避免從頭開始建立每一個通知。通知模板是一個預先格式化的通知，通過自定義參數、樣式、跟蹤連結等來創建你獨特的通知。」
>
> **好處**：維持一致格式、減少錯誤邊際、節省時間

#### 進度計算邏輯

```typescript
/**
 * 進度計算規則：
 * - 建立後：20%
 * - 首次打卡：+30%（達到 50%）
 * - 剩餘打卡：平均分配剩餘 50%
 * - 達成最低目標：強制 100%
 * - 超額打卡：可超過 100%
 *
 * @example
 * 14 天，每週 4-7 天執行
 * 最低目標：2 週 × 4 天 = 8 次
 * 第 1 次打卡：50%
 * 第 2-8 次打卡：每次 +7.14%（50% / 7 次）
 * 第 8 次打卡：強制 100%
 * 第 9+ 次打卡：107.14%, 114.28%...
 */
export const calculateProgress = (
  config: { durationDays: number; frequencyMinDays: number },
  checkInCount: number
): number => {
  const weeks = config.durationDays / 7;
  const minTarget = Math.ceil(weeks * config.frequencyMinDays);

  let percentage = 20; // 建立後 20%

  if (checkInCount > 0) {
    percentage += 30; // 首次打卡 +30%

    const remainingCheckIns = checkInCount - 1;
    const remainingTargetCheckIns = minTarget - 1;

    if (remainingTargetCheckIns > 0) {
      const progressPerCheckIn = 50 / remainingTargetCheckIns;
      percentage += remainingCheckIns * progressPerCheckIn;
    }
  }

  // 達成最低目標時強制為 100%
  if (checkInCount >= minTarget && percentage < 100) {
    percentage = 100;
  }

  return Math.round(percentage * 100) / 100;
};
```

#### Email 觸發矩陣

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                    主題實踐 Email 觸發矩陣                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  週期    │ PE01 │ PE02 │  W1  │  W2  │  W3  │  W4  │ 總結              │
│ ─────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────             │
│  7 天    │  V   │  V   │  #   │  X   │  X   │  X   │  #                │
│  14 天   │  V   │  V   │  #   │  #   │  X   │  X   │  #                │
│  21 天   │  V   │  V   │  #   │  #   │  #   │  X   │  #                │
│  30 天   │  V   │  V   │  #   │  #   │  #   │  #   │  #                │
│                                                                         │
│  V: 一定會寄出                                                           │
│  #: 可能會寄出（取決於打卡狀態）                                          │
│  X: 絕對不會寄出                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 週回顧判斷邏輯

```typescript
// 每第 7 天發送前 6 天回顧
async function determineWeeklySummaryType(
  practiceId: number,
  weekNumber: number
): Promise<'PE03' | 'PE04' | 'PE05' | 'PE06'> {
  const stats = await getCheckInStats(practiceId);

  if (stats.totalCount === 0) {
    return 'PE05'; // 從未打卡
  }

  if (stats.weeklyCount === 0) {
    return 'PE06'; // 當週無打卡，但累積有打卡
  }

  if (stats.weeklyBestNote && stats.weeklyBestNote.length > 0) {
    return 'PE03'; // 當週有打卡且有文字
  }

  return 'PE04'; // 當週有打卡但無文字
}
```

#### 新手緩衝保護

```typescript
/**
 * 避免對剛加入的使用者進行過度回顧
 * 規則：建立日若與開始日同一週（7天內），且開始日離當週回顧少於 48 小時，
 *       則跳過當週回顧發送
 */
const shouldSkipFirstWeekReview = (
  createdAt: Date,
  startDate: Date,
  reviewDate: Date
): boolean => {
  const daysBetweenCreateAndStart = differenceInDays(startDate, createdAt);
  const hoursBetweenStartAndReview = differenceInHours(reviewDate, startDate);

  return daysBetweenCreateAndStart <= 7 && hoursBetweenStartAndReview < 48;
};
```

#### 沉默邏輯

```typescript
/**
 * 連續 3 週以上未動作的使用者，自第 3 週起自動停發 Weekly Summary
 */
const shouldSilence = (
  lastActivityDate: Date | null,
  currentWeek: number
): boolean => {
  if (!lastActivityDate) return currentWeek >= 3;

  const weeksSinceActivity = differenceInWeeks(new Date(), lastActivityDate);
  return weeksSinceActivity >= 3;
};
```

---

### 3.4 場景二：社群互動

#### 通知聚合策略

```text
┌──────────────────────────────────────────────────────────────┐
│                    按讚通知聚合策略                            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ❌ 不好的做法（通知轟炸）:                                    │
│  ├── "小明對你的資源按讚"                                     │
│  ├── "小華對你的資源按讚"                                     │
│  ├── "小李對你的資源按讚"                                     │
│  └── ...                                                     │
│                                                              │
│  ✅ 好的做法（聚合通知）:                                      │
│  └── "小明、小華 和其他 3 人對你的資源按讚"                    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

#### 按讚通知聚合實作

```typescript
export async function createLikeNotificationWithAggregation(
  data: {
    userId: number;
    actorId: number;
    actorName: string;
    targetId: string;
    targetType: 'resource' | 'idea' | 'comment';
  }
): Promise<void> {
  // 檢查 1 小時內是否已有同一目標的按讚通知
  const existing = await prisma.notifications.findFirst({
    where: {
      user_id: data.userId,
      type: 'content_liked',
      data: { path: ['targetId'], equals: data.targetId },
      created_at: { gte: new Date(Date.now() - 3600000) },
    },
    orderBy: { created_at: 'desc' },
  });

  if (existing) {
    // 聚合：更新現有通知
    const likers = (existing.data as any).likers || [];
    if (!likers.includes(data.actorId)) {
      likers.push(data.actorId);
    }

    const message = likers.length > 2
      ? `${data.actorName} 和其他 ${likers.length - 1} 人對你的內容按讚`
      : `${data.actorName} 對你的內容按讚`;

    await prisma.notifications.update({
      where: { id: existing.id },
      data: {
        content: message,
        data: { ...existing.data as object, likers },
        updated_at: new Date(),
      },
    });
  } else {
    // 創建新通知
    await createNotification({
      user_id: data.userId,
      type: 'content_liked',
      title: '收到新的按讚',
      content: `${data.actorName} 對你的內容按讚`,
      priority: 'low',
      data: {
        targetId: data.targetId,
        targetType: data.targetType,
        likers: [data.actorId],
      },
    });
  }
}
```

---

### 3.5 場景三：註冊登入相關

#### 郵箱驗證流程

```text
┌──────────────────────────────────────────────────────────────┐
│                    郵箱驗證通知流程                            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  [用戶註冊]                                                   │
│       │                                                      │
│       ▼                                                      │
│  ┌─────────────────────────────────────┐                     │
│  │ 1. 生成驗證 Token (有效期 24h)       │                     │
│  │ 2. 存入 Redis: verify:{token} = userId                    │
│  └──────────────────────┬──────────────┘                     │
│                         │                                    │
│                         ▼                                    │
│  ┌─────────────────────────────────────┐                     │
│  │ 創建高優先級通知                      │                     │
│  │ type: 'email_verification'          │                     │
│  │ priority: 'high'                    │                     │
│  │ channels: ['email']                 │                     │
│  └──────────────────────┬──────────────┘                     │
│                         │                                    │
│                         ▼                                    │
│  ┌─────────────────────────────────────┐                     │
│  │ Nodemailer 發送郵件                  │                     │
│  │ - 歡迎訊息                           │                     │
│  │ - 驗證連結 (帶 Token)                │                     │
│  │ - 有效期提示                         │                     │
│  └─────────────────────────────────────┘                     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

#### 安全警告通知

```typescript
// 異常登入偵測
export async function onLoginAttempt(
  userId: number,
  loginInfo: {
    ip: string;
    userAgent: string;
    location?: string;
    timestamp: Date;
  }
): Promise<void> {
  // 檢查是否為新設備/位置
  const isNewDevice = await checkIfNewDevice(userId, loginInfo);

  if (isNewDevice) {
    // 高優先級安全通知
    await createNotification({
      user_id: userId,
      type: 'security_alert',
      title: '新設備登入通知',
      content: `偵測到新設備登入：${loginInfo.location || '未知位置'}`,
      priority: 'high',
      data: {
        ip: loginInfo.ip,
        userAgent: loginInfo.userAgent,
        location: loginInfo.location,
        timestamp: loginInfo.timestamp.toISOString(),
      },
    });

    // 同時發送 Email 通知
    await sendSecurityAlertEmail(userId, loginInfo);
  }
}
```

---

### 3.6 用戶偏好設定

> **書中關於通知設定的說明**：
> 「用戶一般每天都會收到太多的通知，他們很容易感到不堪重負。因此，許多網站和應用程序讓用戶對通知設置進行細化控制。」
>
> 書中建議的資料結構：
> ```text
> user_id   bigInt
> channel   varchar    # push notification, email or SMS
> opt_in    boolean    # opt-in to receive notification
> ```
>
> **重要原則**：在向用戶發送任何通知之前，我們首先檢查用戶是否選擇接收這種類型的通知。

#### 資料結構設計

```prisma
model notification_preferences {
  id                    Int       @id @default(autoincrement())
  user_id               Int       @unique

  // ===== 站內通知偏好 =====
  in_app_enabled        Boolean   @default(true)
  in_app_comment        Boolean   @default(true)
  in_app_like           Boolean   @default(true)
  in_app_practice       Boolean   @default(true)

  // ===== 郵件通知偏好 =====
  email_enabled         Boolean   @default(true)
  email_comment         Boolean   @default(true)
  email_like            Boolean   @default(false)  // 按讚預設關閉
  email_practice        Boolean   @default(true)   // 主題實踐
  email_security        Boolean   @default(true)   // 安全通知（強制開啟）
  email_digest          Boolean   @default(true)
  email_digest_time     String    @default("09:00")

  // ===== 靜音設定 =====
  mute_until            DateTime?

  created_at            DateTime  @default(now())
  updated_at            DateTime  @updatedAt

  user                  users     @relation(fields: [user_id], references: [id])
}
```

---

## 第四部分：DaoDao 實作方案

### 資料庫 Schema

```prisma
model notifications {
  id              Int       @id @default(autoincrement())
  external_id     String    @unique @default(uuid()) @db.Uuid
  user_id         Int
  type            String    @db.VarChar(50)
  title           String    @db.VarChar(255)
  content         String
  data            Json?
  priority        String    @default("medium")
  status          String    @default("pending")
  is_read         Boolean   @default(false)
  read_at         DateTime?
  created_at      DateTime  @default(now())
  updated_at      DateTime  @updatedAt

  user            users     @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@index([user_id, is_read])
  @@index([user_id, created_at])
  @@index([type])
}

model email_logs {
  id              Int       @id @default(autoincrement())
  practice_id     Int?
  user_id         Int
  email_type      String    @db.VarChar(10)  // PE01, PE02, etc.
  sent_at         DateTime  @default(now())
  status          String    @default("sent")
  message_id      String?
  error_message   String?
  metadata        Json?

  @@unique([practice_id, email_type, sent_at])
  @@index([practice_id])
  @@index([user_id])
}
```

### API 端點設計

```text
===== 通知查詢 =====
GET    /api/v1/notifications                // 獲取通知列表（分頁）
GET    /api/v1/notifications/unread-count   // 獲取未讀數量
GET    /api/v1/notifications/:id            // 獲取單一通知

===== 通知操作 =====
PATCH  /api/v1/notifications/:id/read       // 標記已讀
PATCH  /api/v1/notifications/mark-all-read  // 全部標記已讀
DELETE /api/v1/notifications/:id            // 刪除（歸檔）

===== 偏好設定 =====
GET    /api/v1/notifications/preferences    // 獲取偏好設定
PUT    /api/v1/notifications/preferences    // 更新偏好設定
```

### 排程任務設計

```typescript
import cron from 'node-cron';

export const initNotificationScheduler = () => {
  // 每日 09:00 發送主題實踐週回顧 (PE03-PE06)
  cron.schedule('0 9 * * *', async () => {
    await practiceEmailService.sendPendingWeeklySummaries();
  }, { timezone: 'Asia/Taipei' });

  // 每日 10:00 發送主題實踐完成總結 (PE07-PE08)
  cron.schedule('0 10 * * *', async () => {
    await practiceEmailService.sendPendingFinalSummaries();
  }, { timezone: 'Asia/Taipei' });

  // 每日檢查並更新實踐狀態為 completed
  cron.schedule('0 0 * * *', async () => {
    await updateCompletedPractices();
  }, { timezone: 'Asia/Taipei' });
};
```

### 實作優先級

| 優先級 | 功能 | 說明 |
| ------ | ---- | ---- |
| P0 | 郵箱驗證、密碼重置通知 | 註冊登入必要功能 |
| P0 | 基礎通知 CRUD API | 通知系統基礎 |
| P0 | PE01 建立成功、PE02 首次打卡 | 主題實踐即時通知 |
| P1 | PE03-PE08 週回顧與總結 | 主題實踐排程通知 |
| P1 | 評論/回覆通知 | 社群互動核心 |
| P2 | 按讚聚合通知 | 社群互動進階 |
| P2 | 用戶偏好設定 | 個人化設定 |
| P3 | WebSocket 即時推送 | 提升體驗 |

---

## 第五部分：面試常見問題 (Step 4 總結)

> **書中總結的設計亮點**：
> - **可靠性**：強大的重試機制，以儘量減少失敗率
> - **安全性**：AppKey/appSecret 對用於確保只有經過驗證的客戶才能發送通知
> - **跟踪和監測**：在通知流程的任何階段實施，以捕捉重要的統計資料
> - **尊重用戶設置**：用戶可以選擇不接收通知，系統在發送通知之前首先檢查用戶設置
> - **速率限制**：用戶會喜歡對他們收到的通知數量設置頻率上限

### Q1: 如何保證通知不丟失？

**答**（對應書中「可靠性」）：

1. **先持久化再發送**：通知先寫入資料庫，再加入隊列發送
2. **持久化隊列**：使用 Bull + Redis 的持久化特性
3. **重試機制**：指數退避重試（2秒、4秒、8秒）
4. **狀態追蹤**：記錄每個渠道的發送狀態

### Q2: 如何處理「通知轟炸」？

**答**（對應書中「速率限制」）：

1. **通知聚合**：100 人按讚 → 1 則聚合通知
2. **沉默邏輯**：連續 3 週無動作的使用者停發週回顧
3. **新手緩衝**：剛建立的實踐跳過首週回顧
4. **低優先級彙總**：按讚等歸入每日摘要

### Q3: 如何設計通知優先級？

**答**（對應書中「消息隊列」設計）：

```text
高優先級（立即發送）：安全警告、驗證郵件、密碼重置、PE01/PE02
中優先級（排程發送）：評論回覆、週回顧、完成總結
低優先級（每日彙總）：按讚

實作：使用多個 Bull 隊列 + 不同處理策略
```

> 書中提到：「每種通知類型都被分配了一個不同的消息隊列，所以一個第三方服務的中斷不會影響其他通知類型。」

### Q4: 接收者只會收到一次通知嗎？

**答**（對應書中「去重機制」）：

> 書中原話：「最簡潔的答案是不。儘管大多數時候通知只發送一次，但分布式特性可能會導致重複通知。」

解決方案：
1. **事件 ID 檢查**：通知事件到達時檢查 ID 是否出現過
2. **冪等性設計**：即使重複執行也不會產生副作用
3. **Redis 快取**：使用 TTL 快取已發送的通知 Key

### Q5: WebSocket vs 輪詢，如何選擇？

**答**：

| 比較項目 | WebSocket | 輪詢 (Polling) |
| -------- | --------- | -------------- |
| 即時性 | 即時（毫秒級） | 延遲（輪詢間隔） |
| 資源消耗 | 維護長連接 | 頻繁 HTTP 請求 |
| 實現複雜度 | 較高 | 較低 |
| 適用場景 | 高即時性需求 | 低頻更新 |

**DaoDao 建議**：

- 第一階段：輪詢（實現簡單，快速上線）
- 第二階段：WebSocket（提升體驗）

### Q6: 初始設計有什麼問題？

**答**（書中明確指出的三個問題）：

1. **單點故障 (SPOF)**：單一通知服務器意味著 SPOF
2. **難以擴展**：在一台服務器上處理所有事情，要獨立擴展各組件很有挑戰性
3. **性能瓶頸**：處理和發送通知可能是資源密集型的

**改進方案**：
- 將數據庫和緩存從通知服務器中移出
- 添加更多的通知服務器，並設置自動水平縮放功能
- 引入消息隊列，使系統組件解耦

---

## 討論問題

### 技術選型討論

1. **WebSocket 方案選擇**
   - Socket.IO vs WS：Socket.IO 提供自動重連、房間功能
   - 是否需要使用 Redis Adapter 支援多實例？

2. **郵件發送策略**
   - 直接發送 vs 隊列發送：建議使用隊列
   - 郵件模板管理：Handlebars vs React Email

3. **即時性需求**
   - 評論通知需要多即時？5 秒內可接受嗎？

### 業務邏輯討論

1. **主題實踐相關**
   - 週回顧發送時間是否需要根據使用者時區調整？
   - 沉默邏輯是否需要通知使用者即將停發？

2. **通知保留期限**
   - 建議 30 天後自動歸檔
   - 是否需要通知導出功能？

3. **靜音功能**
   - 支援靜音時段？（例如：22:00-08:00）
   - 安全類通知是否忽略靜音？

---

## 參考資料

### 書籍

- 《系統設計面試指南》第 10 章 - 設計一個通知系統

### 技術文檔

- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [Bull Queue Documentation](https://github.com/OptimalBits/bull)
- [Prisma Documentation](https://www.prisma.io/docs)

### 專案內部文檔

- [主題實踐 建立與打卡 FRD](../practice-mvp/主題實踐_%20建立與打卡%20-%20FRD.md)
- [主題實踐 Email FRD](../practice-mvp/主題實踐%20Email%20-%20FRD.md)
- [主題實踐郵件功能規格](../practice-mvp/practice-email-spec.md)
- [後端實作規劃](../practice-mvp/backend-implementation-plan.md)

---

**文件維護者**：DaoDao 開發團隊
**最後更新**：2025-01-25
**版本**：1.1.0
