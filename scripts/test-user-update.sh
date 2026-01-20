#!/bin/bash

# 測試用戶更新功能
# 專注測試: name、photoURL、location 欄位

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

API_BASE_URL="${API_BASE_URL:-http://localhost:4000}"
AUTH_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiX2lkIjoiNThiOTE1YWYtYzM2MS00OTAwLWE2YWYtNTNiMDgyYTdmNjJjIiwidXNlcm5hbWUiOiIiLCJpc1RlbXAiOmZhbHNlLCJyb2xlcyI6WyJNZW50b3IiLCJjaXRpemVuIiwiZXhwZXJpbWVudGFsLWVkdWNhdG9yIiwib3RoZXIiXSwicGVybWlzc2lvbnMiOltdLCJpYXQiOjE3NjEzMDg3NjUsImV4cCI6MTc2MTkxMzU2NX0.TO-ycsFiD5YYK16bRyjzXDaUETN1eRRp0tI_45a8U3g"

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo ""
log_info "=========================================="
log_info "  測試用戶更新功能"
log_info "  API: $API_BASE_URL"
log_info "=========================================="
echo ""

# 測試 1: 獲取當前用戶資料
log_info "=== 測試 1: 獲取當前用戶資料 ==="
response=$(curl -s -X GET \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  "$API_BASE_URL/api/v1/users/me")

echo "$response" | jq '.'
user_id=$(echo "$response" | jq -r '.data.id // empty')
current_name=$(echo "$response" | jq -r '.data.name // empty')
current_photo=$(echo "$response" | jq -r '.data.photoURL // empty')
current_location=$(echo "$response" | jq -r '.data.location // empty')

log_info "當前用戶 ID: $user_id"
log_info "當前姓名: $current_name"
log_info "當前大頭貼: $current_photo"
log_info "當前地區: $current_location"

sleep 2

# 測試 2: 測試空名稱驗證 (應該失敗)
log_info ""
log_info "=== 測試 2: 測試空名稱驗證 (應該失敗) ==="
update_data='{
  "name": ""
}'

response=$(curl -s -X PUT \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$update_data" \
  "$API_BASE_URL/api/v1/users/me")

echo "$response" | jq '.'

if echo "$response" | jq -e '.success == false' > /dev/null; then
  log_success "✓ 正確拒絕空名稱"
else
  log_error "✗ 應該拒絕空名稱但沒有"
fi

sleep 2

# 測試 3: 更新姓名、大頭貼和地區
log_info ""
log_info "=== 測試 3: 更新姓名、大頭貼和地區 ==="
update_data='{
  "name": "測試用戶(更新後)",
  "photoURL": "https://example.com/new-avatar.jpg",
  "location": "taipei_city"
}'

log_info "更新資料:"
echo "$update_data" | jq '.'

response=$(curl -s -X PUT \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$update_data" \
  "$API_BASE_URL/api/v1/users/me")

echo "$response" | jq '.'

if echo "$response" | jq -e '.success == true' > /dev/null; then
  new_name=$(echo "$response" | jq -r '.data.name // empty')
  new_photo=$(echo "$response" | jq -r '.data.photoURL // empty')
  new_location=$(echo "$response" | jq -r '.data.location // empty')
  
  log_success "✓ 更新成功"
  log_info "新姓名: $new_name"
  log_info "新大頭貼: $new_photo"
  log_info "新地區: $new_location"
  
  # 驗證欄位是否正確更新
  if [ "$new_name" = "測試用戶(更新後)" ]; then
    log_success "✓ 姓名更新正確"
  else
    log_error "✗ 姓名更新失敗: 期望 '測試用戶(更新後)', 得到 '$new_name'"
  fi
  
  if [ "$new_photo" = "https://example.com/new-avatar.jpg" ]; then
    log_success "✓ 大頭貼更新正確"
  else
    log_error "✗ 大頭貼更新失敗: 期望 'https://example.com/new-avatar.jpg', 得到 '$new_photo'"
  fi
  
  if [ "$new_location" = "taipei_city" ]; then
    log_success "✓ 地區更新正確"
  else
    log_error "✗ 地區更新失敗: 期望 'taipei_city', 得到 '$new_location'"
  fi
else
  log_error "✗ 更新失敗"
fi

sleep 2

# 測試 4: 再次獲取用戶資料確認更新
log_info ""
log_info "=== 測試 4: 確認資料已持久化 ==="
response=$(curl -s -X GET \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  "$API_BASE_URL/api/v1/users/me")

echo "$response" | jq '.'

verify_name=$(echo "$response" | jq -r '.data.name // empty')
verify_photo=$(echo "$response" | jq -r '.data.photoURL // empty')
verify_location=$(echo "$response" | jq -r '.data.location // empty')

if [ "$verify_name" = "測試用戶(更新後)" ] && \
   [ "$verify_photo" = "https://example.com/new-avatar.jpg" ] && \
   [ "$verify_location" = "taipei_city" ]; then
  log_success "✓ 所有欄位已正確持久化"
else
  log_error "✗ 資料持久化失敗"
  log_error "  姓名: $verify_name"
  log_error "  大頭貼: $verify_photo"
  log_error "  地區: $verify_location"
fi

echo ""
log_success "=========================================="
log_success "  測試完成！"
log_success "=========================================="
echo ""
