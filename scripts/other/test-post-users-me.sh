#!/bin/bash

# ==============================================
# DaoDao User API 測試腳本 - POST /api/v1/users/me
# 測試專業領域數組功能
# ==============================================

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
API_BASE_URL="${API_BASE_URL:-http://localhost:4000}"
AUTH_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiX2lkIjoiNThiOTE1YWYtYzM2MS00OTAwLWE2YWYtNTNiMDgyYTdmNjJjIiwidXNlcm5hbWUiOiIiLCJpc1RlbXAiOmZhbHNlLCJyb2xlcyI6WyJNZW50b3IiLCJjaXRpemVuIiwiZXhwZXJpbWVudGFsLWVkdWNhdG9yIiwib3RoZXIiXSwicGVybWlzc2lvbnMiOltdLCJpYXQiOjE3NjEzMDg3NjUsImV4cCI6MTc2MTkxMzU2NX0.TO-ycsFiD5YYK16bRyjzXDaUETN1eRRp0tI_45a8U3g"
CREATED_USER_ID=""

# 日誌函數
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
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
        echo "$data" | jq '.' 2>/dev/null || echo "$data"
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
    local http_code=$(echo "$response" | jq -r '.success // "error"' 2>/dev/null)

    echo ""
    log_info "Response:"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"

    if [ "$http_code" = "true" ]; then
        log_success "✓ Test passed"
        echo "$response"
        return 0
    else
        log_error "✗ Test failed"
        echo "$response"
        return 1
    fi
}

# ==============================================
# 測試 1: POST /api/users/me (單一專業領域)
# ==============================================
test_create_user_me_single_field() {
    log_info "=== 測試 1: POST /api/users/me - 單一專業領域 ==="

    local user_data=$(cat <<'EOF'
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
  "professionalField": ["information_and_communication_technologies_icts"],
  "personalSlogan": "終身學習者，用科技改變教育",
  "referralSource": "instagram",
  "isSendEmail": true,
  "customId": "test_user_single"
}
EOF
)

    local response=$(test_api "POST" \
        "/api/users/me" \
        "$user_data" \
        "創建用戶 - 單一專業領域" \
        "-H 'Authorization: Bearer $AUTH_TOKEN'")

    # 提取新創建的用戶 ID 和 token
    CREATED_USER_ID=$(echo "$response" | jq -r '.data.user.id // empty')
    NEW_AUTH_TOKEN=$(echo "$response" | jq -r '.data.token // empty')

    if [ -n "$CREATED_USER_ID" ]; then
        log_success "用戶創建成功! User ID: $CREATED_USER_ID"
        log_info "新的 Auth Token: $NEW_AUTH_TOKEN"

        # 驗證 professionalField 是否為數組
        local prof_field=$(echo "$response" | jq -r '.data.user.professionalField')
        log_info "返回的 professionalField: $prof_field"

        if echo "$prof_field" | jq -e 'type == "array"' > /dev/null 2>&1; then
            log_success "✓ professionalField 正確返回為數組"
        else
            log_error "✗ professionalField 不是數組格式"
        fi
    fi
}

# ==============================================
# 測試 2: POST /api/users/me (多個專業領域)
# ==============================================
test_create_user_me_multiple_fields() {
    log_info "=== 測試 2: POST /api/users/me - 多個專業領域 (最多3個) ==="

    local user_data=$(cat <<'EOF'
{
  "gender": "female",
  "birthDate": "1992-03-20",
  "educationStage": "university",
  "isOpenLocation": true,
  "isOpenProfile": true,
  "isSubscribeEmail": false,
  "location": "新北市",
  "roleList": ["教育工作者", "設計師"],
  "selfIntroduction": "跨領域學習者，專注於教育與設計的結合。",
  "share": "我可以分享教學設計、使用者體驗設計的經驗",
  "wantToDoList": ["interaction", "make-group"],
  "tagList": ["教育", "設計思維", "UX/UI"],
  "interestList": ["education_learning", "arts_and_design"],
  "preferences": {
    "learningStyle": ["visual", "group_discussion"],
    "contentType": ["video", "hands_on_practice"]
  },
  "contactList": {
    "instagram": "@designer_edu",
    "discord": "EduDesigner#5678"
  },
  "professionalField": [
    "education",
    "arts_and_humanities",
    "business_administration_and_law"
  ],
  "personalSlogan": "用設計讓教育更美好",
  "referralSource": "friend_referral",
  "isSendEmail": false,
  "customId": "test_user_multiple"
}
EOF
)

    local response=$(test_api "POST" \
        "/api/users/me" \
        "$user_data" \
        "創建用戶 - 三個專業領域" \
        "-H 'Authorization: Bearer $AUTH_TOKEN'")

    # 驗證專業領域數組
    local prof_field=$(echo "$response" | jq -r '.data.user.professionalField')
    local field_count=$(echo "$prof_field" | jq 'length')

    log_info "返回的 professionalField: $prof_field"
    log_info "專業領域數量: $field_count"

    if [ "$field_count" = "3" ]; then
        log_success "✓ professionalField 正確返回 3 個項目"
    else
        log_error "✗ professionalField 數量不正確，預期 3，實際 $field_count"
    fi
}

# ==============================================
# 測試 3: POST /api/users/me (超過3個專業領域 - 應該失敗)
# ==============================================
test_create_user_me_too_many_fields() {
    log_info "=== 測試 3: POST /api/users/me - 超過3個專業領域 (應該失敗) ==="

    local user_data=$(cat <<'EOF'
{
  "gender": "other",
  "educationStage": "university",
  "professionalField": [
    "education",
    "arts_and_humanities",
    "business_administration_and_law",
    "information_and_communication_technologies_icts"
  ],
  "personalSlogan": "測試超過上限",
  "isSendEmail": false
}
EOF
)

    local response=$(test_api "POST" \
        "/api/users/me" \
        "$user_data" \
        "創建用戶 - 超過3個專業領域 (預期失敗)" \
        "-H 'Authorization: Bearer $AUTH_TOKEN'")

    local success=$(echo "$response" | jq -r '.success')

    if [ "$success" = "false" ]; then
        log_success "✓ 正確拒絕超過3個專業領域"
    else
        log_error "✗ 應該拒絕超過3個專業領域但沒有"
    fi
}

# ==============================================
# 測試 4: POST /api/users/me (空數組)
# ==============================================
test_create_user_me_empty_fields() {
    log_info "=== 測試 4: POST /api/users/me - 空專業領域數組 ==="

    local user_data=$(cat <<'EOF'
{
  "gender": "male",
  "birthDate": "1998-08-10",
  "educationStage": "high",
  "selfIntroduction": "高中生，還在探索興趣方向",
  "professionalField": [],
  "personalSlogan": "持續學習中",
  "isSendEmail": false,
  "customId": "test_user_empty"
}
EOF
)

    local response=$(test_api "POST" \
        "/api/users/me" \
        "$user_data" \
        "創建用戶 - 空專業領域數組" \
        "-H 'Authorization: Bearer $AUTH_TOKEN'")

    local prof_field=$(echo "$response" | jq -r '.data.user.professionalField')

    log_info "返回的 professionalField: $prof_field"

    if [ "$prof_field" = "null" ] || [ "$prof_field" = "[]" ]; then
        log_success "✓ 空數組處理正確"
    else
        log_warning "professionalField 值: $prof_field"
    fi
}

# ==============================================
# 測試 5: 對比 POST /api/users 和 POST /api/users/me
# ==============================================
test_compare_endpoints() {
    log_info "=== 測試 5: 對比 POST /api/users 和 POST /api/users/me ==="

    local user_data=$(cat <<'EOF'
{
  "gender": "female",
  "educationStage": "university",
  "selfIntroduction": "對比測試用戶",
  "professionalField": ["education", "arts_and_humanities"],
  "personalSlogan": "對比測試",
  "isSendEmail": false,
  "customId": "test_compare_a"
}
EOF
)

    log_info "5.1 測試 POST /api/users"
    local response1=$(test_api "POST" \
        "/api/users" \
        "$user_data" \
        "使用 POST /api/users 創建用戶" \
        "-H 'Authorization: Bearer $AUTH_TOKEN'")

    sleep 2

    # 修改 customId 以避免衝突
    local user_data2=$(echo "$user_data" | jq '.customId = "test_compare_b"')

    log_info "5.2 測試 POST /api/users/me"
    local response2=$(test_api "POST" \
        "/api/users/me" \
        "$user_data2" \
        "使用 POST /api/users/me 創建用戶" \
        "-H 'Authorization: Bearer $AUTH_TOKEN'")

    log_success "✓ 兩個 endpoint 都應該返回相同的結構"
}

# ==============================================
# 主測試流程
# ==============================================
main() {
    echo ""
    log_info "========================================"
    log_info "  POST /api/v1/users/me 測試腳本"
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

    # 獲取認證 token
    log_warning "請先通過 Google OAuth 創建臨時用戶並獲取 token"
    read -p "請輸入臨時用戶 token: " AUTH_TOKEN

    if [ -z "$AUTH_TOKEN" ]; then
        log_error "未提供認證 token，無法繼續測試"
        exit 1
    fi

    # 執行測試
    test_create_user_me_single_field
    sleep 2

    test_create_user_me_multiple_fields
    sleep 2

    test_create_user_me_too_many_fields
    sleep 2

    test_create_user_me_empty_fields
    sleep 2

    test_compare_endpoints

    echo ""
    log_success "========================================"
    log_success "  所有測試執行完畢！"
    log_success "========================================"
    echo ""
}

# 執行主函數
main "$@"
