#!/bin/bash

# ==============================================
# DaoDao User API 測試腳本
# 測試分支: feat/update-user-create-flow
# ==============================================

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
API_BASE_URL="${API_BASE_URL:-http://localhost:4000}"
TEMP_USER_ID=""
AUTH_TOKEN="${AUTH_TOKEN:-}"
if [ -z "${AUTH_TOKEN//[[:space:]]/}" ]; then
    echo "請先以環境變數 AUTH_TOKEN 提供測試帳號的有效 token" >&2
    exit 1
fi

# Display only redacted copies; API_RESPONSE remains private to this process.
if ! command -v node > /dev/null; then
    echo "需要 Node.js 才能安全顯示測試回應" >&2
    exit 1
fi
INITIAL_AUTH_TOKEN="$AUTH_TOKEN"
TEST_OUTPUT_REDACTOR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib/test-output.cjs"
if [ ! -f "$TEST_OUTPUT_REDACTOR" ]; then
    TEST_OUTPUT_REDACTOR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/lib/test-output.cjs"
fi
redact_output() {
    REDACTION_CONTEXT="${response:-${API_RESPONSE:-}}" INITIAL_AUTH_TOKEN="$INITIAL_AUTH_TOKEN" AUTH_TOKEN="$AUTH_TOKEN" NEW_AUTH_TOKEN="${NEW_AUTH_TOKEN:-}" node "$TEST_OUTPUT_REDACTOR"
}
API_RESPONSE=""
CREATED_USER_ID=""

# 日誌函數
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | redact_output
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | redact_output
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | redact_output
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | redact_output
}

# API 測試函數
test_api() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    local headers=$5

    echo ""
    log_info "Testing: $description"
    log_info "Endpoint: $method $endpoint"

    if [ -n "$data" ]; then
        log_info "Request Body:"
        printf '%s\n' "$data" | redact_output
    fi

    local curl_cmd="curl -s -X $method"

    if [ -n "$headers" ]; then
        curl_cmd="$curl_cmd $headers"
    fi

    curl_cmd="$curl_cmd -H 'Content-Type: application/json'"

    if [ -n "$data" ]; then
        curl_cmd="$curl_cmd -d '$data'"
    fi

    curl_cmd="$curl_cmd '$API_BASE_URL$endpoint'"

    local response=$(eval $curl_cmd)
    API_RESPONSE="$response"
    local http_code=$(echo "$response" | jq -r '.success // "error"' 2>/dev/null)

    echo ""
    log_info "Response:"
    printf '%s\n' "$response" | redact_output

    if [ "$http_code" = "true" ]; then
        log_success "✓ Test passed"
        return 0
    else
        log_error "✗ Test failed"
        return 1
    fi
}

# ==============================================
# 測試 1: 創建臨時用戶 (Google OAuth Mock)
# ==============================================
test_create_temp_user() {
    log_info "=== 測試 1: 創建臨時用戶 ==="

    # 注意: 實際環境需要真實的 Google OAuth token
    # 這裡假設你已經有一個臨時用戶 token
    log_warning "請先通過 Google OAuth 創建臨時用戶並獲取 token"
    log_warning "可以通過前端登入流程或使用 Postman 測試 /api/auth/google 端點"

    # AUTH_TOKEN 已在啟動時從環境變數驗證，避免提示覆寫。
}

# ==============================================
# 測試 2: 獲取可用的偏好選項
# ==============================================
test_get_available_preferences() {
    log_info "=== 測試 2: 獲取可用的偏好選項 ==="

    test_api "GET" \
        "/api/users/preferences/available" \
        "" \
        "獲取系統所有可用的偏好選項"
}

# ==============================================
# 測試 3: 創建完整用戶 (包含新欄位)
# ==============================================
test_create_user() {
    log_info "=== 測試 3: 創建用戶 (包含新欄位) ==="

    local user_data=$(cat <<EOF
{
  "gender": "male",
  "birthDate": "1995-06-15",
  "educationStage": "university",
  "isOpenLocation": true,
  "isOpenProfile": true,
  "isSubscribeEmail": true,
  "location": "台北市",
  "roleList": ["工程師", "學生"],
  "selfIntroduction": "我是一名熱愛學習的軟體工程師，對教育科技充滿熱情。",
  "share": "我可以分享程式設計、系統架構設計的經驗",
  "wantToDoList": ["interaction", "do-project"],
  "tagList": ["JavaScript", "TypeScript", "Node.js", "教育科技"],
  "interestList": ["information_and_computer_science", "education_learning"],
  "preferences": {
    "learningStyle": ["hands_on", "theoretical"],
    "contentType": ["video", "article"]
  },
  "contactList": {
    "instagram": "@test_user",
    "discord": "TestUser#1234",
    "line": "test_line_id",
    "facebook": "test.user"
  },
  "professionalField": "information_and_communication_technologies_icts",
  "personalSlogan": "終身學習者，用科技改變教育",
  "referralSource": "instagram",
  "isSendEmail": true
}
EOF
)

    test_api "POST" \
        "/api/users" \
        "$user_data" \
        "創建完整用戶資料" \
        "-H 'Authorization: Bearer $AUTH_TOKEN'"
    local response="$API_RESPONSE"

    # 提取新創建的用戶 ID 和 token
    CREATED_USER_ID=$(echo "$response" | jq -r '.data.user.id // empty')
    AUTH_TOKEN=$(echo "$response" | jq -r '.data.token // empty')

    if [ -n "$CREATED_USER_ID" ]; then
        log_success "用戶創建成功! User ID: $CREATED_USER_ID"
    fi
}

# ==============================================
# 測試 4: 獲取當前用戶資料 (GET /me)
# ==============================================
test_get_me() {
    log_info "=== 測試 4: 獲取當前用戶資料 ==="

    test_api "GET" \
        "/api/me" \
        "" \
        "獲取當前登入用戶的完整資料" \
        "-H 'Authorization: Bearer $AUTH_TOKEN'"
}

# ==============================================
# 測試 5: 更新用戶資料 (包含新欄位)
# ==============================================
test_update_user() {
    log_info "=== 測試 5: 更新用戶資料 ==="

    local update_data=$(cat <<EOF
{
  "name": "測試用戶(已更新)",
  "selfIntroduction": "更新後的自我介紹：我是一名全端工程師，專注於教育科技領域的創新。",
  "tagList": ["JavaScript", "TypeScript", "React", "教育科技", "AI"],
  "interestList": ["information_and_computer_science", "education_learning", "arts_and_design"],
  "preferences": {
    "learningStyle": ["hands_on", "group_discussion"],
    "contentType": ["video", "hands_on_practice"],
    "difficulty": ["beginner_friendly"]
  },
  "professionalField": "education",
  "personalSlogan": "用教育改變世界，讓學習更有趣",
  "referralSource": "friend_referral",
  "contactList": {
    "instagram": "@updated_user",
    "discord": "UpdatedUser#5678"
  }
}
EOF
)

    test_api "PUT" \
        "/api/me" \
        "$update_data" \
        "更新用戶資料（包含新欄位）" \
        "-H 'Authorization: Bearer $AUTH_TOKEN'"
}

# ==============================================
# 測試 6: 獲取用戶列表 (測試新欄位是否正確返回)
# ==============================================
test_get_users_list() {
    log_info "=== 測試 6: 獲取用戶列表 ==="

    test_api "GET" \
        "/api/users?page=1&pageSize=10" \
        "" \
        "獲取公開的用戶列表（分頁）"
}

# ==============================================
# 測試 7: 搜尋用戶 (測試過濾功能)
# ==============================================
test_search_users() {
    log_info "=== 測試 7: 搜尋用戶 ==="

    test_api "GET" \
        "/api/users?page=1&pageSize=10&educationStage=university&location=台北市&search=工程師" \
        "" \
        "搜尋並過濾用戶"
}

# ==============================================
# 測試 8: 獲取指定用戶資料
# ==============================================
test_get_user_by_id() {
    log_info "=== 測試 8: 獲取指定用戶資料 ==="

    if [ -n "$CREATED_USER_ID" ]; then
        test_api "GET" \
            "/api/users/$CREATED_USER_ID" \
            "" \
            "獲取指定用戶的完整資料"
    else
        log_warning "未找到創建的用戶 ID，跳過此測試"
    fi
}

# ==============================================
# 測試 9: 自訂 ID 功能
# ==============================================
test_custom_id() {
    log_info "=== 測試 9: 自訂 ID 功能 ==="

    # 9.1 檢查 ID 可用性
    log_info "9.1 檢查自訂 ID 可用性"
    test_api "GET" \
        "/api/users/custom-id/my_awesome_id/availability" \
        "" \
        "檢查自訂 ID 是否可用"

    # 9.2 設置自訂 ID
    log_info "9.2 設置自訂 ID"
    local custom_id_data=$(cat <<EOF
{
  "customId": "test_user_$(date +%s)"
}
EOF
)

    test_api "POST" \
        "/api/me/custom-id" \
        "$custom_id_data" \
        "設置自訂 ID" \
        "-H 'Authorization: Bearer $AUTH_TOKEN'"
}

# ==============================================
# 測試 10: 用戶偏好設定管理
# ==============================================
test_user_preferences() {
    log_info "=== 測試 10: 用戶偏好設定管理 ==="

    # 10.1 獲取當前用戶偏好
    log_info "10.1 獲取當前用戶偏好"
    test_api "GET" \
        "/api/me/preferences" \
        "" \
        "獲取當前用戶的偏好設定" \
        "-H 'Authorization: Bearer $AUTH_TOKEN'"

    # 10.2 更新用戶偏好
    log_info "10.2 更新用戶偏好"
    local prefs_data=$(cat <<EOF
{
  "preferences": [
    {
      "preferenceTypeId": 1,
      "optionId": 1,
      "isSelected": true
    },
    {
      "preferenceTypeId": 1,
      "optionId": 2,
      "isSelected": true
    }
  ]
}
EOF
)

    test_api "PUT" \
        "/api/me/preferences" \
        "$prefs_data" \
        "更新用戶偏好設定" \
        "-H 'Authorization: Bearer $AUTH_TOKEN'"
}

# ==============================================
# 測試 11: 測試新增欄位的驗證
# ==============================================
test_field_validation() {
    log_info "=== 測試 11: 欄位驗證測試 ==="

    # 11.1 測試無效的專業領域
    log_info "11.1 測試無效的專業領域值"
    local invalid_field=$(cat <<EOF
{
  "professionalField": "invalid_field",
  "selfIntroduction": "測試"
}
EOF
)

    test_api "PUT" \
        "/api/me" \
        "$invalid_field" \
        "測試無效的專業領域（應該失敗）" \
        "-H 'Authorization: Bearer $AUTH_TOKEN'"

    # 11.2 測試個人標語長度限制
    log_info "11.2 測試個人標語長度限制"
    local long_slogan=$(cat <<EOF
{
  "personalSlogan": "$(printf 'A%.0s' {1..300})"
}
EOF
)

    test_api "PUT" \
        "/api/me" \
        "$long_slogan" \
        "測試過長的個人標語（應該失敗）" \
        "-H 'Authorization: Bearer $AUTH_TOKEN'"

    # 11.3 測試興趣清單上限
    log_info "11.3 測試興趣清單數量限制"
    local many_interests=$(cat <<EOF
{
  "interestList": [
    "information_and_computer_science",
    "education_learning",
    "arts_and_design",
    "nature_environment",
    "health_and_wellness",
    "business_and_entrepreneurship"
  ]
}
EOF
)

    test_api "PUT" \
        "/api/me" \
        "$many_interests" \
        "測試超過5個興趣（應該失敗）" \
        "-H 'Authorization: Bearer $AUTH_TOKEN'"
}

# ==============================================
# 測試 12: 測試興趣管理 (interestList)
# ==============================================
test_interest_management() {
    log_info "=== 測試 12: 興趣管理測試 ==="

    # 12.1 設置興趣
    log_info "12.1 設置用戶興趣"
    local interests_data=$(cat <<EOF
{
  "interestList": [
    "information_and_computer_science",
    "education_learning",
    "arts_and_design"
  ]
}
EOF
)

    test_api "PUT" \
        "/api/me" \
        "$interests_data" \
        "設置用戶興趣列表" \
        "-H 'Authorization: Bearer $AUTH_TOKEN'"

    # 12.2 驗證興趣已儲存
    log_info "12.2 驗證興趣已正確儲存"
    test_api "GET" \
        "/api/me" \
        "" \
        "檢查 interestList 欄位" \
        "-H 'Authorization: Bearer $AUTH_TOKEN'"
}

# ==============================================
# 主測試流程
# ==============================================
main() {
    echo ""
    log_info "========================================"
    log_info "  DaoDao User API 測試腳本"
    log_info "  API Base URL: $API_BASE_URL"
    log_info "========================================"
    echo ""

    # 檢查依賴
    if ! command -v jq &> /dev/null; then
        log_error "需要安裝 jq 工具: brew install jq"
        exit 1
    fi

    if ! command -v curl &> /dev/null; then
        log_error "需要安裝 curl 工具"
        exit 1
    fi

    # 執行測試
    test_create_temp_user
    echo ""

    if [ -z "$AUTH_TOKEN" ]; then
        log_error "未提供認證 token，無法繼續測試"
        exit 1
    fi

    test_get_available_preferences
    sleep 1

    test_create_user
    sleep 1

    test_get_me
    sleep 1

    test_update_user
    sleep 1

    test_get_users_list
    sleep 1

    test_search_users
    sleep 1

    test_get_user_by_id
    sleep 1

    test_custom_id
    sleep 1

    test_user_preferences
    sleep 1

    test_field_validation
    sleep 1

    test_interest_management

    echo ""
    log_success "========================================"
    log_success "  所有測試執行完畢！"
    log_success "========================================"
    echo ""
}

# 執行主函數
main "$@"
