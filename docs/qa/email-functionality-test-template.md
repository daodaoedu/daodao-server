# 郵件功能完整測試範本

## 概述

此測試範本用於驗證 DaoDao 平台的完整郵件功能，包括聯絡郵件、驗證郵件、歡迎郵件、密碼重設、馬拉松通知等各種郵件發送功能。郵件功能使用路由結構：`/api/v1/email`。

## 前置準備

### 認證 Token
獲取有效的 JWT token：
```bash
# 使用有效的認證 token（一般使用者）
TOKEN="PRIVATE_RUNTIME_AUTH_TOKEN_REQUIRED"

# 管理員權限 token（用於需要管理員權限的端點）
ADMIN_TOKEN="your-admin-token-here"
```

### 測試郵件地址準備
```bash
# 測試用郵件地址
TEST_EMAIL="test.email@example.com"
CONTACT_EMAIL="contact@company.com"
VERIFICATION_EMAIL="verification@test.com"
BULK_EMAIL_1="bulk1@example.com"
BULK_EMAIL_2="bulk2@example.com"
```

### 環境檢查
- ✅ 服務器運行在 `http://localhost:4000`
- ✅ 郵件服務配置正常（SMTP 連接）
- ✅ 認證服務可用
- ✅ 模板服務正常運作

## 測試流程

### 1. HEALTH CHECK - 郵件服務健康檢查

#### 測試指令
```bash
curl -X GET http://localhost:4000/api/v1/email/health \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

#### 預期回應
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "lastCheck": "2025-09-21T10:30:00.000Z",
    "transporterConnected": true,
    "error": null
  },
  "timestamp": "2025-09-21T10:30:00.000Z",
  "meta": {
    "message": "郵件服務健康狀態正常"
  }
}
```

#### 驗證要點
- ✅ `success: true`
- ✅ `status: "healthy"`
- ✅ `transporterConnected: true`
- ✅ HTTP 狀態碼 200
- ✅ 需要管理員權限

### 2. EMAIL VALIDATION - 郵件地址驗證

#### 2.1 有效郵件驗證
```bash
curl -X POST http://localhost:4000/api/v1/email/validate \
  -H "Content-Type: application/json" \
  -d '{
    "email": "valid.email@example.com"
  }'
```

#### 2.2 無效郵件驗證
```bash
curl -X POST http://localhost:4000/api/v1/email/validate \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email-format"
  }'
```

#### 預期回應（有效郵件）
```json
{
  "success": true,
  "data": {
    "email": "valid.email@example.com",
    "isValid": true
  },
  "timestamp": "2025-09-21T10:30:00.000Z",
  "meta": {
    "message": "郵件地址有效"
  }
}
```

#### 驗證要點
- ✅ 有效郵件：`isValid: true`
- ✅ 無效郵件：`isValid: false`
- ✅ 支援可選身份驗證（不需要 token）

### 3. CONTACT EMAIL - 聯絡郵件發送

#### 測試指令
```bash
curl -X POST http://localhost:4000/api/v1/email/contact \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "from": "sender@example.com",
    "to": "contact@company.com",
    "subject": "測試聯絡郵件 - 自動化測試",
    "text": "這是一封測試用的聯絡郵件內容。我們正在測試郵件功能是否正常運作，包括模板渲染和郵件發送機制。",
    "name": "測試用戶",
    "title": "測試工程師",
    "information": [
      "電話：0912-345-678",
      "公司：測試科技有限公司",
      "部門：技術測試部"
    ],
    "activityTitle": "郵件功能測試活動"
  }'
```

#### 預期回應
```json
{
  "success": true,
  "data": {
    "messageId": "contact_email_message_id_123"
  },
  "timestamp": "2025-09-21T10:30:00.000Z",
  "meta": {
    "message": "聯絡郵件發送成功",
    "aggregateData": {
      "emailInfo": {
        "recipient": "contact@company.com",
        "template": "contact",
        "sentAt": "2025-09-21T10:30:00.000Z"
      }
    }
  }
}
```

#### 驗證要點
- ✅ `success: true`
- ✅ 回傳 `messageId`
- ✅ 包含郵件發送資訊
- ✅ 需要身份驗證

### 4. VERIFICATION EMAIL - 驗證郵件發送

#### 測試指令
```bash
curl -X POST http://localhost:4000/api/v1/email/verification \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "email": "verification@test.com",
    "verifyLink": "https://test.example.com/verify?token=abc123xyz789",
    "name": "測試用戶"
  }'
```

#### 預期回應
```json
{
  "success": true,
  "data": {
    "messageId": "verification_email_message_id_456",
    "recipient": "verification@test.com",
    "template": "verification"
  },
  "timestamp": "2025-09-21T10:30:00.000Z",
  "meta": {
    "message": "驗證郵件發送成功"
  }
}
```

#### 驗證要點
- ✅ `success: true`
- ✅ 驗證連結為有效 URL 格式
- ✅ 回傳郵件發送詳情
- ✅ 需要身份驗證

### 5. WELCOME EMAIL - 歡迎郵件發送（需管理員權限）

#### 測試指令
```bash
curl -X POST http://localhost:4000/api/v1/email/welcome \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "email": "newuser@example.com",
    "name": "新用戶測試"
  }'
```

#### 預期回應
```json
{
  "success": true,
  "data": {
    "messageId": "welcome_email_message_id_789",
    "recipient": "newuser@example.com",
    "template": "welcome"
  },
  "timestamp": "2025-09-21T10:30:00.000Z",
  "meta": {
    "message": "歡迎郵件發送成功"
  }
}
```

#### 驗證要點
- ✅ `success: true`
- ✅ 需要管理員權限
- ✅ 一般用戶應該返回權限錯誤

### 6. PASSWORD RESET EMAIL - 密碼重設郵件

#### 測試指令
```bash
curl -X POST http://localhost:4000/api/v1/email/password-reset \
  -H "Content-Type: application/json" \
  -d '{
    "email": "reset@example.com",
    "resetLink": "https://test.example.com/reset-password?token=reset123xyz",
    "name": "重設密碼用戶"
  }'
```

#### 預期回應
```json
{
  "success": true,
  "data": {
    "messageId": "password_reset_message_id_101"
  },
  "timestamp": "2025-09-21T10:30:00.000Z",
  "meta": {
    "message": "密碼重設郵件發送成功"
  }
}
```

#### 驗證要點
- ✅ `success: true`
- ✅ 支援可選身份驗證（未登入用戶可使用）
- ✅ 重設連結為有效 URL 格式

### 7. MARATHON EMAIL - 馬拉松郵件發送（需管理員權限）

#### 測試指令
```bash
curl -X POST http://localhost:4000/api/v1/email/marathon \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "email": "participant@example.com",
    "name": "馬拉松參與者",
    "marathonTitle": "2024 春季學習馬拉松測試",
    "marathonDate": "2024年4月1日",
    "marathonDescription": "這是一個為期30天的測試學習馬拉松，專門用於驗證郵件功能。參與者將體驗完整的學習流程。"
  }'
```

#### 預期回應
```json
{
  "success": true,
  "data": {
    "messageId": "marathon_email_message_id_202"
  },
  "timestamp": "2025-09-21T10:30:00.000Z",
  "meta": {
    "message": "馬拉松郵件發送成功"
  }
}
```

#### 驗證要點
- ✅ `success: true`
- ✅ 需要管理員權限
- ✅ 馬拉松資訊完整傳遞

### 8. CUSTOM EMAIL - 自定義郵件發送（需管理員權限）

#### 8.1 使用模板發送
```bash
curl -X POST http://localhost:4000/api/v1/email/custom \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "to": "custom@example.com",
    "subject": "自定義模板郵件測試",
    "template": "welcome",
    "data": {
      "userName": "自定義用戶",
      "companyName": "測試科技公司"
    }
  }'
```

#### 8.2 使用 HTML 內容發送
```bash
curl -X POST http://localhost:4000/api/v1/email/custom \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "to": ["custom1@example.com", "custom2@example.com"],
    "subject": "自定義 HTML 郵件測試",
    "htmlContent": "<h1>測試郵件</h1><p>這是一封使用自定義 HTML 內容的測試郵件。</p><p>發送時間：<strong>2024-03-21</strong></p>"
  }'
```

#### 預期回應
```json
{
  "success": true,
  "data": {
    "messageId": "custom_email_message_id_303"
  },
  "timestamp": "2025-09-21T10:30:00.000Z",
  "meta": {
    "message": "自定義郵件發送成功"
  }
}
```

#### 驗證要點
- ✅ 支援模板和 HTML 內容兩種方式
- ✅ 支援單一或多個收件人
- ✅ 需要管理員權限

### 9. BULK EMAIL - 批量郵件發送（需管理員權限）

#### 測試指令
```bash
curl -X POST http://localhost:4000/api/v1/email/bulk \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "template": "welcome",
    "subject": "批量歡迎郵件測試",
    "recipients": [
      {
        "email": "bulk1@example.com",
        "data": {
          "name": "批量用戶一",
          "code": "BULK001"
        }
      },
      {
        "email": "bulk2@example.com",
        "data": {
          "name": "批量用戶二",
          "code": "BULK002"
        }
      },
      {
        "email": "bulk3@example.com",
        "data": {
          "name": "批量用戶三",
          "code": "BULK003"
        }
      }
    ],
    "from": "noreply@test.com"
  }'
```

#### 預期回應
```json
{
  "success": true,
  "data": {
    "total": 3,
    "success": 3,
    "failed": 0,
    "results": [
      {
        "email": "bulk1@example.com",
        "success": true,
        "messageId": "bulk_message_1"
      },
      {
        "email": "bulk2@example.com",
        "success": true,
        "messageId": "bulk_message_2"
      },
      {
        "email": "bulk3@example.com",
        "success": true,
        "messageId": "bulk_message_3"
      }
    ]
  },
  "timestamp": "2025-09-21T10:30:00.000Z",
  "meta": {
    "message": "批量郵件發送完成：成功 3 件，失敗 0 件",
    "aggregateData": {
      "batchEmail": {
        "totalRecipients": 3,
        "successCount": 3,
        "failureCount": 0,
        "processedAt": "2025-09-21T10:30:00.000Z"
      }
    }
  }
}
```

#### 驗證要點
- ✅ 批量發送統計正確
- ✅ 每個收件人的結果詳情
- ✅ 支援個人化數據
- ✅ 限制：單次不超過 100 個收件人

### 10. EMAIL PREVIEW - 郵件模板預覽

#### 測試指令
```bash
curl -X POST http://localhost:4000/api/v1/email/preview \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "template": "welcome",
    "data": {
      "userName": "預覽用戶",
      "companyName": "預覽科技公司"
    }
  }'
```

#### 預期回應
```json
{
  "success": true,
  "data": {
    "subject": "歡迎加入 預覽科技公司！",
    "html": "<html><body><h1>歡迎 預覽用戶！</h1><p>感謝您加入我們...</p></body></html>",
    "text": "歡迎 預覽用戶！感謝您加入我們..."
  },
  "timestamp": "2025-09-21T10:30:00.000Z",
  "meta": {
    "message": "模板預覽生成成功"
  }
}
```

#### 驗證要點
- ✅ 回傳完整的郵件內容
- ✅ 包含 subject, html, text
- ✅ 模板變數正確替換

### 11. EMAIL STATS - 郵件統計（需管理員權限）

#### 測試指令
```bash
# 不帶時間範圍
curl -X GET "http://localhost:4000/api/v1/email/stats" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 帶時間範圍
curl -X GET "http://localhost:4000/api/v1/email/stats?startDate=2024-01-01T00:00:00Z&endDate=2024-12-31T23:59:59Z" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

#### 預期回應
```json
{
  "success": true,
  "data": {
    "totalSent": 245,
    "totalFailed": 12,
    "successRate": 95.1,
    "byTemplate": {
      "welcome": 89,
      "verification": 76,
      "contact": 45,
      "marathon": 23,
      "password-reset": 12
    },
    "byDay": {
      "2025-09-20": 45,
      "2025-09-21": 32
    },
    "lastUpdated": "2025-09-21T10:30:00.000Z"
  },
  "timestamp": "2025-09-21T10:30:00.000Z",
  "meta": {
    "message": "郵件統計獲取成功"
  }
}
```

#### 驗證要點
- ✅ 包含總發送數和失敗數
- ✅ 成功率計算正確
- ✅ 按模板類型分類統計
- ✅ 時間範圍篩選有效

## 進階測試案例

### 12. 權限和驗證測試

#### 12.1 未登入用戶測試
```bash
# 嘗試發送聯絡郵件（需要身份驗證）
curl -X POST http://localhost:4000/api/v1/email/contact \
  -H "Content-Type: application/json" \
  -d '{
    "from": "test@example.com",
    "to": "contact@example.com",
    "subject": "未授權測試",
    "text": "測試內容",
    "name": "測試用戶"
  }'
```

**預期結果：** 401 Unauthorized

#### 12.2 一般用戶嘗試管理員功能
```bash
# 一般用戶嘗試發送歡迎郵件
curl -X POST http://localhost:4000/api/v1/email/welcome \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "email": "test@example.com",
    "name": "測試用戶"
  }'
```

**預期結果：** 403 Forbidden

#### 12.3 無效郵件格式測試
```bash
# 測試無效郵件格式
curl -X POST http://localhost:4000/api/v1/email/verification \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "email": "invalid-email-format",
    "verifyLink": "https://example.com/verify?token=abc123"
  }'
```

**預期結果：** 400 Bad Request - 郵件格式驗證錯誤

#### 12.4 批量郵件限制測試
```bash
# 測試超過 100 個收件人限制
LARGE_RECIPIENTS=$(printf '{"email":"user%d@example.com","data":{"name":"用戶%d"}},' {1..101})
LARGE_RECIPIENTS="[${LARGE_RECIPIENTS%,}]"

curl -X POST http://localhost:4000/api/v1/email/bulk \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{
    \"template\": \"welcome\",
    \"subject\": \"批量限制測試\",
    \"recipients\": $LARGE_RECIPIENTS
  }"
```

**預期結果：** 400 Bad Request - 超過收件人限制

### 13. 錯誤處理測試

#### 13.1 缺少必填欄位
```bash
# 缺少 subject
curl -X POST http://localhost:4000/api/v1/email/contact \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "from": "test@example.com",
    "to": "contact@example.com",
    "text": "測試內容",
    "name": "測試用戶"
  }'
```

**預期結果：** 400 Bad Request - 缺少必要欄位

#### 13.2 無效 URL 測試
```bash
# 無效的驗證連結
curl -X POST http://localhost:4000/api/v1/email/verification \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "email": "test@example.com",
    "verifyLink": "not-a-valid-url"
  }'
```

**預期結果：** 400 Bad Request - URL 格式錯誤

#### 13.3 不支援的模板類型
```bash
# 使用不存在的模板
curl -X POST http://localhost:4000/api/v1/email/preview \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "template": "non-existent-template",
    "data": {
      "test": "data"
    }
  }'
```

**預期結果：** 400 Bad Request - 不支援的模板類型

### 14. 郵件服務故障模擬

#### 14.1 檢查服務異常狀態
```bash
# 在郵件服務停用或配置錯誤時測試
curl -X GET http://localhost:4000/api/v1/email/health \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**預期結果（服務異常時）：**
```json
{
  "success": true,
  "data": {
    "status": "unhealthy",
    "lastCheck": "2025-09-21T10:30:00.000Z",
    "transporterConnected": false,
    "error": "SMTP connection failed"
  },
  "timestamp": "2025-09-21T10:30:00.000Z",
  "meta": {
    "message": "郵件服務健康狀態異常"
  }
}
```

HTTP 狀態碼：503 Service Unavailable

## 測試執行腳本

### 完整自動化測試
```bash
#!/bin/bash

# 設定變數
BASE_URL="http://localhost:4000/api/v1"
TOKEN="your-jwt-token-here"
ADMIN_TOKEN="your-admin-token-here"

echo "🚀 開始郵件功能完整測試..."

# 1. 健康檢查
echo "🏥 1. 檢查郵件服務健康狀態..."
HEALTH_RESPONSE=$(curl -s -X GET "$BASE_URL/email/health" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
echo $HEALTH_RESPONSE | jq '.success'

# 2. 郵件驗證
echo "✉️ 2. 測試郵件地址驗證..."
curl -s -X POST "$BASE_URL/email/validate" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}' | jq '.success'

# 3. 聯絡郵件
echo "📞 3. 發送聯絡郵件..."
curl -s -X POST "$BASE_URL/email/contact" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "from": "test@example.com",
    "to": "contact@company.com",
    "subject": "自動化測試聯絡郵件",
    "text": "這是自動化測試的聯絡郵件內容",
    "name": "自動化測試用戶"
  }' | jq '.success'

# 4. 驗證郵件
echo "🔐 4. 發送驗證郵件..."
curl -s -X POST "$BASE_URL/email/verification" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "email": "verify@example.com",
    "verifyLink": "https://test.example.com/verify?token=auto123",
    "name": "驗證測試用戶"
  }' | jq '.success'

# 5. 歡迎郵件（管理員）
echo "👋 5. 發送歡迎郵件..."
curl -s -X POST "$BASE_URL/email/welcome" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "email": "welcome@example.com",
    "name": "歡迎測試用戶"
  }' | jq '.success'

# 6. 密碼重設郵件
echo "🔑 6. 發送密碼重設郵件..."
curl -s -X POST "$BASE_URL/email/password-reset" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "reset@example.com",
    "resetLink": "https://test.example.com/reset?token=reset123",
    "name": "重設測試用戶"
  }' | jq '.success'

# 7. 馬拉松郵件（管理員）
echo "🏃 7. 發送馬拉松郵件..."
curl -s -X POST "$BASE_URL/email/marathon" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "email": "marathon@example.com",
    "name": "馬拉松測試用戶",
    "marathonTitle": "自動化測試馬拉松",
    "marathonDate": "2024年4月1日"
  }' | jq '.success'

# 8. 自定義郵件（管理員）
echo "⚙️ 8. 發送自定義郵件..."
curl -s -X POST "$BASE_URL/email/custom" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "to": "custom@example.com",
    "subject": "自動化測試自定義郵件",
    "htmlContent": "<h1>測試郵件</h1><p>這是自動化測試的自定義郵件。</p>"
  }' | jq '.success'

# 9. 批量郵件（管理員）
echo "📬 9. 發送批量郵件..."
curl -s -X POST "$BASE_URL/email/bulk" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "template": "welcome",
    "subject": "自動化批量測試",
    "recipients": [
      {"email": "bulk1@example.com", "data": {"name": "批量用戶1"}},
      {"email": "bulk2@example.com", "data": {"name": "批量用戶2"}}
    ]
  }' | jq '.success'

# 10. 模板預覽
echo "👀 10. 測試模板預覽..."
curl -s -X POST "$BASE_URL/email/preview" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "template": "welcome",
    "data": {"userName": "預覽用戶", "companyName": "測試公司"}
  }' | jq '.success'

# 11. 郵件統計（管理員）
echo "📊 11. 獲取郵件統計..."
curl -s -X GET "$BASE_URL/email/stats" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.success'

echo "🎉 郵件功能測試完成！"
```

## 常見問題排除

### 1. 郵件發送失敗
**症狀：** 郵件發送請求成功但實際未收到郵件
**可能原因：**
- SMTP 配置錯誤
- 收件人郵件地址問題
- 郵件被垃圾郵件過濾器攔截
**解決方案：**
- 檢查 `email/health` 端點狀態
- 驗證 SMTP 服務器設定
- 檢查郵件服務日誌

### 2. 模板渲染錯誤
**症狀：** 模板預覽或發送時出現渲染錯誤
**可能原因：**
- 模板數據格式不正確
- 缺少必要的模板變數
- 模板檔案損壞
**解決方案：**
- 使用 `email/preview` 端點測試模板
- 檢查模板數據結構
- 確認模板檔案完整性

### 3. 權限驗證問題
**症狀：** 具有正確 token 但仍然返回權限錯誤
**可能原因：**
- Token 過期
- 用戶角色不足
- 權限中間件配置問題
**解決方案：**
- 檢查 token 有效性
- 確認用戶具有所需權限
- 驗證權限中間件邏輯

### 4. 批量郵件部分失敗
**症狀：** 批量發送中部分郵件失敗
**可能原因：**
- 個別收件人郵件地址無效
- 郵件服務器限制
- 網路暫時性問題
**解決方案：**
- 檢查失敗郵件的具體錯誤
- 驗證收件人郵件地址
- 實施重試機制

### 5. 服務健康檢查異常
**症狀：** `email/health` 返回 unhealthy 狀態
**可能原因：**
- SMTP 連接問題
- 郵件服務配置錯誤
- 網路連接問題
**解決方案：**
- 檢查 SMTP 服務器狀態
- 驗證網路連接
- 重啟郵件服務

## 預期行為總結

| 操作 | HTTP 方法 | 端點 | 認證需求 | 預期狀態碼 | 主要驗證點 |
|------|----------|------|----------|------------|-----------|
| 健康檢查 | GET | `/email/health` | 管理員 | 200/503 | 服務狀態 |
| 郵件驗證 | POST | `/email/validate` | 可選 | 200 | 驗證結果 |
| 聯絡郵件 | POST | `/email/contact` | 用戶 | 200 | 發送成功 |
| 驗證郵件 | POST | `/email/verification` | 用戶 | 200 | 發送成功 |
| 歡迎郵件 | POST | `/email/welcome` | 管理員 | 200 | 發送成功 |
| 密碼重設 | POST | `/email/password-reset` | 可選 | 200 | 發送成功 |
| 馬拉松郵件 | POST | `/email/marathon` | 管理員 | 200 | 發送成功 |
| 自定義郵件 | POST | `/email/custom` | 管理員 | 200 | 發送成功 |
| 批量郵件 | POST | `/email/bulk` | 管理員 | 200 | 批量統計 |
| 模板預覽 | POST | `/email/preview` | 用戶 | 200 | 模板內容 |
| 郵件統計 | GET | `/email/stats` | 管理員 | 200 | 統計數據 |

## 測試成功標準

- ✅ 所有郵件類型都能正常發送
- ✅ 模板系統正常運作，變數替換正確
- ✅ 權限控制適當（用戶、管理員、可選認證）
- ✅ 批量發送功能正常，統計準確
- ✅ 郵件地址驗證功能正常
- ✅ 健康檢查能正確反映服務狀態
- ✅ 錯誤處理和驗證機制完善
- ✅ 所有回應格式符合 API 規範
- ✅ 郵件服務統計功能正常
- ✅ 模板預覽功能完整
- ✅ 服務限制（如批量郵件 100 個收件人）正確執行