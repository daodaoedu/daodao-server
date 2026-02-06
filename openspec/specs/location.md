# Location Module Specification

## 1. Overview

### 1.1 Purpose
地區模組提供城市和國家資料的查詢功能，支援多語系顯示、關鍵字搜尋、國家篩選等功能，用於用戶資料填寫、地區選擇等場景。

### 1.2 Scope
- 城市列表查詢（支援篩選、搜尋）
- 國家列表查詢
- 城市代碼驗證
- 多語系支援（zh-TW、en）

---

## 2. Architecture

### 2.1 Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Location Module                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐    ┌──────────────────┐                   │
│  │   City Routes    │───▶│  City Controller │                   │
│  │   (3 endpoints)  │    │   (3 methods)    │                   │
│  └──────────────────┘    └────────┬─────────┘                   │
│                                   │                              │
│                                   ▼                              │
│                      ┌──────────────────────┐                   │
│                      │    City Service      │                   │
│                      │  - getAllCities      │                   │
│                      │  - searchCities      │                   │
│                      │  - getCitiesByCountry│                   │
│                      │  - getAllCountries   │                   │
│                      │  - validateCityCode  │                   │
│                      └──────────┬───────────┘                   │
│                                 │                                │
│                                 ▼                                │
│                      ┌──────────────────────┐                   │
│                      │    PostgreSQL        │                   │
│                      │  ┌───────┐ ┌───────┐ │                   │
│                      │  │ city  │ │country│ │                   │
│                      │  └───────┘ └───────┘ │                   │
│                      └──────────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Locale Support

| Locale | Display Language | Example |
|--------|------------------|---------|
| `zh-TW` | 繁體中文 | 台北、東京 |
| `en` | English | Taipei, Tokyo |
| `default` | 預設（中文優先） | 台北、Tokyo |

---

## 3. API Endpoints

### 3.1 Get Cities

```yaml
GET /api/v1/cities
Content-Type: application/json
# No authentication required

Description:
  取得可用的城市列表。支援按國家篩選、關鍵字搜尋、指定語系。

Query Parameters:
  country: string (optional)
    # 國家代碼篩選 (ISO 3166-1 alpha-2)
    # 例如: TW, JP, US
  search: string (optional)
    # 搜尋關鍵字
    # 支援城市代碼、中文名、英文名
  locale: string (optional, default: "default")
    # 語系設定
    # enum: zh-TW, en, default
  limit: number (optional, default: 50, max: 200)
    # 回傳數量限制

Response 200:
  success: true
  data:
    - id: number
      code: string         # 城市代碼
      name: string         # 根據 locale 顯示的城市名稱
      country:
        id: number
        alpha2: string     # ISO 3166-1 alpha-2 (e.g., "TW")
        alpha3: string     # ISO 3166-1 alpha-3 (e.g., "TWN")
        name: string       # 國家名稱
  timestamp: string

Example Requests:
  # 取得台灣所有城市
  GET /api/v1/cities?country=TW

  # 搜尋東京
  GET /api/v1/cities?search=tokyo
  GET /api/v1/cities?search=東京

  # 英文顯示
  GET /api/v1/cities?locale=en

  # 組合查詢
  GET /api/v1/cities?country=JP&locale=en&limit=10
```

### 3.2 Get Countries

```yaml
GET /api/v1/cities/countries
Content-Type: application/json
# No authentication required

Description:
  取得所有可用的國家列表，用於國家選擇下拉選單。

Response 200:
  success: true
  data:
    - id: number
      alpha2: string       # ISO 3166-1 alpha-2
      alpha3: string       # ISO 3166-1 alpha-3
      name: string         # 國家名稱
      nameEn: string       # 英文國家名稱
  timestamp: string
```

### 3.3 Validate City Code

```yaml
GET /api/v1/cities/validate/:code
Content-Type: application/json
# No authentication required

Path Parameters:
  code: string (required)
    # 要驗證的城市代碼

Description:
  驗證城市代碼是否存在且有效。

Response 200:
  success: true
  data:
    code: string           # 查詢的城市代碼
    isValid: boolean       # 是否有效
    city: object | null    # 城市資料（若有效）
      id: number
      code: string
      name: string
      country:
        id: number
        alpha2: string
        alpha3: string
        name: string
  timestamp: string

Example:
  GET /api/v1/cities/validate/TPE

  Response:
  {
    "success": true,
    "data": {
      "code": "TPE",
      "isValid": true,
      "city": {
        "id": 1,
        "code": "TPE",
        "name": "台北",
        "country": {
          "id": 158,
          "alpha2": "TW",
          "alpha3": "TWN",
          "name": "台灣"
        }
      }
    }
  }
```

---

## 4. Data Models

### 4.1 City Entity (Prisma)

```prisma
model city {
  id          Int       @id @default(autoincrement())
  code        String    @unique
  name        String    // 中文名稱
  name_en     String?   // 英文名稱
  country_id  Int
  is_active   Boolean   @default(true)
  created_at  DateTime  @default(now())
  updated_at  DateTime  @updatedAt

  country     country   @relation(fields: [country_id], references: [id])
  locations   location[]

  @@index([country_id])
  @@index([code])
}
```

### 4.2 Country Entity (Prisma)

```prisma
model country {
  id          Int       @id @default(autoincrement())
  alpha2      String    @unique  // ISO 3166-1 alpha-2 (e.g., TW)
  alpha3      String    @unique  // ISO 3166-1 alpha-3 (e.g., TWN)
  name        String             // 中文名稱
  name_en     String?            // 英文名稱
  is_active   Boolean   @default(true)
  created_at  DateTime  @default(now())
  updated_at  DateTime  @updatedAt

  cities      city[]
  locations   location[]
}
```

### 4.3 Location Entity (Prisma)

```prisma
model location {
  id          Int       @id @default(autoincrement())
  city_id     Int?
  country_id  Int
  is_taiwan   Boolean   @default(false)
  created_at  DateTime  @default(now())

  city        city?     @relation(fields: [city_id], references: [id])
  country     country   @relation(fields: [country_id], references: [id])
  users       users[]

  @@unique([city_id, country_id])
}
```

---

## 5. Validation Schemas

### 5.1 Get Cities Query Schema

```typescript
const getCitiesQuerySchema = z.object({
  country: z
    .string()
    .length(2, 'Country code must be ISO 3166-1 alpha-2 format')
    .toUpperCase()
    .optional(),
  search: z
    .string()
    .min(1, 'Search keyword must be at least 1 character')
    .max(50, 'Search keyword must be at most 50 characters')
    .optional(),
  locale: z
    .enum(['zh-TW', 'en', 'default'])
    .optional()
    .default('default'),
  limit: z
    .coerce
    .number()
    .min(1)
    .max(200)
    .optional()
    .default(50),
});
```

### 5.2 Response Schemas

```typescript
const cityDataSchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
  country: z.object({
    id: z.number(),
    alpha2: z.string(),
    alpha3: z.string(),
    name: z.string(),
  }),
});

const countryDataSchema = z.object({
  id: z.number(),
  alpha2: z.string(),
  alpha3: z.string(),
  name: z.string(),
  nameEn: z.string().optional(),
});

const getCitiesApiResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(cityDataSchema),
  timestamp: z.string().datetime(),
});

const getCountriesApiResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(countryDataSchema),
  timestamp: z.string().datetime(),
});
```

---

## 6. Business Rules

### 6.1 Authentication
- 所有端點**不需要**認證
- 公開 API，供註冊流程、個人資料編輯使用

### 6.2 Search Behavior
- 搜尋支援城市代碼、中文名、英文名
- 搜尋不區分大小寫
- 模糊匹配（前綴匹配）

### 6.3 Locale Handling
- `zh-TW`: 優先返回中文名稱
- `en`: 優先返回英文名稱
- `default`: 中文優先，若無中文則返回英文

### 6.4 Data Filtering
- 只返回 `is_active = true` 的城市和國家
- 國家篩選使用 ISO 3166-1 alpha-2 代碼

---

## 7. Error Handling

### 7.1 Error Codes

```typescript
const LOCATION_ERRORS = {
  LOCATION_INVALID_COUNTRY_CODE: {
    code: 'LOCATION_INVALID_COUNTRY_CODE',
    message: '無效的國家代碼格式',
    status: 400,
  },
  LOCATION_CITY_NOT_FOUND: {
    code: 'LOCATION_CITY_NOT_FOUND',
    message: '城市不存在',
    status: 404,
  },
  LOCATION_INVALID_LOCALE: {
    code: 'LOCATION_INVALID_LOCALE',
    message: '不支援的語系',
    status: 400,
  },
} as const;
```

---

## 8. Implementation Files

### 8.1 Controllers
- `src/controllers/city.controller.ts`

### 8.2 Services
- `src/services/city.service.ts`

### 8.3 Routes
- `src/routes/city.routes.ts`

### 8.4 Validators
- `src/validators/city.validators.ts`

---

## 9. Common Cities Data

### 9.1 Taiwan Cities

| Code | Name (zh-TW) | Name (en) |
|------|--------------|-----------|
| TPE | 台北 | Taipei |
| NTC | 新北 | New Taipei |
| TYC | 桃園 | Taoyuan |
| TXG | 台中 | Taichung |
| TNN | 台南 | Tainan |
| KHH | 高雄 | Kaohsiung |

### 9.2 Major International Cities

| Code | Country | Name (zh-TW) | Name (en) |
|------|---------|--------------|-----------|
| TYO | JP | 東京 | Tokyo |
| OSA | JP | 大阪 | Osaka |
| NYC | US | 紐約 | New York |
| LAX | US | 洛杉磯 | Los Angeles |
| LON | GB | 倫敦 | London |
| PAR | FR | 巴黎 | Paris |

---

## 10. Usage Examples

### 10.1 Get Taiwan Cities

```bash
curl -X GET "http://localhost:3000/api/v1/cities?country=TW"
```

### 10.2 Search Cities

```bash
# Search by Chinese name
curl -X GET "http://localhost:3000/api/v1/cities?search=台北"

# Search by English name
curl -X GET "http://localhost:3000/api/v1/cities?search=taipei"

# Search with English locale
curl -X GET "http://localhost:3000/api/v1/cities?search=tokyo&locale=en"
```

### 10.3 Validate City Code

```bash
curl -X GET "http://localhost:3000/api/v1/cities/validate/TPE"
```

---

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0.0 | 2026-02-06 | System | Initial specification |
