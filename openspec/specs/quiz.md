# Quiz Module Specification

## 1. Overview

### 1.1 Purpose
測驗模組提供學習風格測驗功能，幫助用戶了解自己的學習類型（L/C/A/D/O），並根據測驗結果提供個人化的學習建議。

### 1.2 Scope
- 儲存用戶測驗結果
- 查詢最新測驗結果
- 結果類型分析（學習風格）
- 各維度分數記錄

---

## 2. Architecture

### 2.1 Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                       Quiz Module                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐    ┌──────────────────┐                   │
│  │   Quiz Routes    │───▶│  Quiz Controller │                   │
│  │   (2 endpoints)  │    │   (2 methods)    │                   │
│  └──────────────────┘    └────────┬─────────┘                   │
│                                   │                              │
│                                   ▼                              │
│                      ┌──────────────────────┐                   │
│                      │    Quiz Service      │                   │
│                      │  - saveResult        │                   │
│                      │  - getLatestResult   │                   │
│                      └──────────┬───────────┘                   │
│                                 │                                │
│                                 ▼                                │
│                      ┌──────────────────────┐                   │
│                      │    PostgreSQL        │                   │
│                      │   (quiz_results)     │                   │
│                      └──────────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Result Types

學習風格測驗結果分為五種類型：

| Type | Name | Description |
|------|------|-------------|
| L | Logical | 邏輯型學習者 - 偏好有系統、有邏輯的學習方式 |
| C | Creative | 創意型學習者 - 喜歡探索新想法和創新方法 |
| A | Active | 行動型學習者 - 透過實際操作來學習最有效 |
| D | Deep | 深思型學習者 - 喜歡深入研究和理解原理 |
| O | Organized | 組織型學習者 - 注重規劃和結構化學習 |

---

## 3. API Endpoints

### 3.1 Save Quiz Result

```yaml
POST /api/v1/quiz
Content-Type: application/json
Authorization: Bearer <accessToken>

Description:
  保存用戶完成測驗後的結果數據，包括結果類型、各維度分數和答題記錄。
  系統會自動記錄完成時間並關聯到當前登入用戶。

Request:
  resultType: string (required)
    # 測驗結果類型 (L/C/A/D/O)
    # enum: L, C, A, D, O
  scores: object (required)
    # 各維度分數
    L: number (0-100)
    C: number (0-100)
    A: number (0-100)
    D: number (0-100)
    O: number (0-100)
  answers: array (required)
    # 答題記錄
    - questionId: string
      selectedOption: string
      score: number

Response 201:
  success: true
  data:
    id: string (UUID)
    userId: string (UUID)
    resultType: string
    scores:
      L: number
      C: number
      A: number
      D: number
      O: number
    answers: array
    completedAt: string (ISO 8601)
    createdAt: string (ISO 8601)
  timestamp: string

Response 400:
  success: false
  data: null
  error:
    code: "VALIDATION_FAILED"
    message: "Invalid quiz result data"
    details: {...}
  timestamp: string
```

### 3.2 Get Latest Quiz Result

```yaml
GET /api/v1/quiz/latest
Authorization: Bearer <accessToken>

Description:
  獲取當前已登入用戶最新的測驗結果。
  若用戶尚未完成任何測驗，將返回 404 錯誤。

Response 200:
  success: true
  data:
    id: string (UUID)
    userId: string (UUID)
    resultType: string
    scores:
      L: number
      C: number
      A: number
      D: number
      O: number
    answers: array
    completedAt: string (ISO 8601)
    createdAt: string (ISO 8601)
  timestamp: string

Response 404:
  success: false
  data: null
  error:
    code: "NOT_FOUND"
    message: "尚無測驗結果"
  timestamp: string
```

---

## 4. Data Models

### 4.1 Quiz Results Entity (Prisma)

```prisma
model quiz_results {
  id          String    @id @default(uuid())
  user_id     Int
  result_type String    // L, C, A, D, O
  scores      Json      // { L: number, C: number, A: number, D: number, O: number }
  answers     Json      // [{ questionId, selectedOption, score }]
  completed_at DateTime @default(now())
  created_at  DateTime  @default(now())
  updated_at  DateTime  @updatedAt

  user        users     @relation(fields: [user_id], references: [id])

  @@index([user_id, completed_at(sort: Desc)])
}
```

### 4.2 Scores Structure

```typescript
interface QuizScores {
  L: number;  // Logical score (0-100)
  C: number;  // Creative score (0-100)
  A: number;  // Active score (0-100)
  D: number;  // Deep score (0-100)
  O: number;  // Organized score (0-100)
}
```

### 4.3 Answer Record Structure

```typescript
interface QuizAnswer {
  questionId: string;
  selectedOption: string;
  score: number;
}
```

---

## 5. Validation Schemas

### 5.1 Save Quiz Result Body Schema

```typescript
const saveQuizResultBodySchema = z.object({
  resultType: z.enum(['L', 'C', 'A', 'D', 'O'], {
    errorMap: () => ({ message: '結果類型必須是 L, C, A, D, O 其中之一' })
  }),
  scores: z.object({
    L: z.number().min(0).max(100),
    C: z.number().min(0).max(100),
    A: z.number().min(0).max(100),
    D: z.number().min(0).max(100),
    O: z.number().min(0).max(100),
  }),
  answers: z.array(z.object({
    questionId: z.string().min(1),
    selectedOption: z.string().min(1),
    score: z.number(),
  })).min(1, '至少需要一個答題記錄'),
});
```

### 5.2 Response Schemas

```typescript
const quizResultDataSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  resultType: z.enum(['L', 'C', 'A', 'D', 'O']),
  scores: z.object({
    L: z.number(),
    C: z.number(),
    A: z.number(),
    D: z.number(),
    O: z.number(),
  }),
  answers: z.array(z.object({
    questionId: z.string(),
    selectedOption: z.string(),
    score: z.number(),
  })),
  completedAt: z.string().datetime(),
  createdAt: z.string().datetime(),
});

const saveQuizResultResponseSchema = z.object({
  success: z.literal(true),
  data: quizResultDataSchema,
  timestamp: z.string().datetime(),
});

const getQuizResultResponseSchema = z.object({
  success: z.literal(true),
  data: quizResultDataSchema.nullable(),
  timestamp: z.string().datetime(),
});
```

---

## 6. Business Rules

### 6.1 Authentication
- 所有端點都需要 JWT 認證
- 用戶只能存取自己的測驗結果

### 6.2 Data Persistence
- 每次完成測驗都會建立新記錄（不覆蓋舊記錄）
- 支援追蹤用戶測驗歷史
- `getLatestResult` 返回最新一筆結果

### 6.3 Score Calculation
- 各維度分數範圍：0-100
- `resultType` 為分數最高的維度類型
- 前端負責計算分數，後端僅儲存結果

---

## 7. Error Handling

### 7.1 Error Codes

```typescript
const QUIZ_ERRORS = {
  QUIZ_INVALID_RESULT_TYPE: {
    code: 'QUIZ_INVALID_RESULT_TYPE',
    message: '無效的測驗結果類型',
    status: 400,
  },
  QUIZ_INVALID_SCORES: {
    code: 'QUIZ_INVALID_SCORES',
    message: '分數格式無效或超出範圍',
    status: 400,
  },
  QUIZ_NO_RESULT: {
    code: 'QUIZ_NO_RESULT',
    message: '尚無測驗結果',
    status: 404,
  },
  QUIZ_SAVE_FAILED: {
    code: 'QUIZ_SAVE_FAILED',
    message: '測驗結果儲存失敗',
    status: 500,
  },
} as const;
```

---

## 8. Implementation Files

### 8.1 Controllers
- `src/controllers/quiz.controller.ts`

### 8.2 Services
- `src/services/quiz.service.ts`

### 8.3 Routes
- `src/routes/quiz.routes.ts`

### 8.4 Validators
- `src/validators/quiz.validators.ts`

### 8.5 Types
- `src/types/quiz.types.ts`

---

## 9. Usage Examples

### 9.1 Save Quiz Result

```bash
curl -X POST http://localhost:3000/api/v1/quiz \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "resultType": "A",
    "scores": {
      "L": 65,
      "C": 72,
      "A": 88,
      "D": 55,
      "O": 70
    },
    "answers": [
      {"questionId": "q1", "selectedOption": "b", "score": 5},
      {"questionId": "q2", "selectedOption": "a", "score": 3},
      {"questionId": "q3", "selectedOption": "c", "score": 4}
    ]
  }'
```

### 9.2 Get Latest Result

```bash
curl -X GET http://localhost:3000/api/v1/quiz/latest \
  -H "Authorization: Bearer <token>"
```

---

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0.0 | 2026-02-06 | System | Initial specification |
