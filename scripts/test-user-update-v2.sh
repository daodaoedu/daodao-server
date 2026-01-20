#!/bin/bash

# 測試用戶更新功能 (使用有效的城市名稱)

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

API_BASE_URL="${API_BASE_URL:-http://localhost:4000}"
AUTH_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiX2lkIjoiNThiOTE1YWYtYzM2MS00OTAwLWE2YWYtNTNiMDgyYTdmNjJjIiwidXNlcm5hbWUiOiIiLCJpc1RlbXAiOmZhbHNlLCJyb2xlcyI6WyJNZW50b3IiLCJjaXRpemVuIiwiZXhwZXJpbWVudGFsLWVkdWNhdG9yIiwib3RoZXIiXSwicGVybWlzc2lvbnMiOltdLCJpYXQiOjE3NjEzMDg3NjUsImV4cCI6MTc2MTkxMzU2NX0.TO-ycsFiD5YYK16bRyjzXDaUETN1eRRp0tI_45a8U3g"

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo ""
log_info "=========================================="
log_info "  測試用戶更新功能 (完整測試)"
log_info "=========================================="
echo ""

# 測試 1: 空名稱驗證
log_info "=== 測試 1: 空名稱驗證 (應失敗) ==="
response=$(curl -s -X PUT \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": ""}' \
  "$API_BASE_URL/api/v1/users/me")

if echo "$response" | jq -e '.success == false and (.error.details[0].message | contains("名稱不可為空"))' > /dev/null; then
  log_success "✓ 正確拒絕空名稱"
else
  log_error "✗ 空名稱驗證失敗"
  echo "$response" | jq '.'
fi

sleep 1

# 測試 2: 更新姓名
log_info ""
log_info "=== 測試 2: 更新姓名 ==="
response=$(curl -s -X PUT \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "測試用戶(姓名已更新)"}' \
  "$API_BASE_URL/api/v1/users/me")

new_name=$(echo "$response" | jq -r '.data.name // empty')
if [ "$new_name" = "測試用戶(姓名已更新)" ]; then
  log_success "✓ 姓名更新成功: $new_name"
else
  log_error "✗ 姓名更新失敗"
  echo "$response" | jq '.'
fi

sleep 1

# 測試 3: 更新大頭貼
log_info ""
log_info "=== 測試 3: 更新大頭貼 ==="
response=$(curl -s -X PUT \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"photoURL": "https://example.com/test-avatar-new.jpg"}' \
  "$API_BASE_URL/api/v1/users/me")

new_photo=$(echo "$response" | jq -r '.data.photoURL // empty')
contact_photo=$(echo "$response" | jq -r '.data.contactList.photoURL // empty')

if [ "$new_photo" = "https://example.com/test-avatar-new.jpg" ]; then
  log_success "✓ 大頭貼更新成功"
  log_info "  data.photoURL: $new_photo"
  log_info "  contactList.photoURL: $contact_photo"
else
  log_error "✗ 大頭貼更新失敗"
  echo "$response" | jq '.'
fi

sleep 1

# 測試 4: 更新地區 (使用中文名稱)
log_info ""
log_info "=== 測試 4: 更新地區 (使用中文名稱) ==="
response=$(curl -s -X PUT \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"location": "台北市"}' \
  "$API_BASE_URL/api/v1/users/me")

if echo "$response" | jq -e '.success == true' > /dev/null; then
  new_location=$(echo "$response" | jq -r '.data.location // empty')
  log_success "✓ 地區更新成功: $new_location"
else
  log_error "✗ 地區更新失敗 (中文名稱)"
  echo "$response" | jq '.error'
fi

sleep 1

# 測試 5: 更新地區 (使用英文枚舉值)
log_info ""
log_info "=== 測試 5: 更新地區 (使用英文枚舉值) ==="
response=$(curl -s -X PUT \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"location": "taichung_city"}' \
  "$API_BASE_URL/api/v1/users/me")

if echo "$response" | jq -e '.success == true' > /dev/null; then
  new_location=$(echo "$response" | jq -r '.data.location // empty')
  log_success "✓ 地區更新成功: $new_location"
else
  log_error "✗ 地區更新失敗 (英文枚舉)"
  echo "$response" | jq '.error'
fi

sleep 1

# 測試 6: 同時更新多個欄位
log_info ""
log_info "=== 測試 6: 同時更新多個欄位 ==="
update_data='{
  "name": "綜合測試用戶",
  "photoURL": "https://example.com/final-avatar.jpg",
  "location": "高雄市",
  "selfIntroduction": "這是一個測試用戶的自我介紹"
}'

response=$(curl -s -X PUT \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$update_data" \
  "$API_BASE_URL/api/v1/users/me")

if echo "$response" | jq -e '.success == true' > /dev/null; then
  verify_name=$(echo "$response" | jq -r '.data.name')
  verify_photo=$(echo "$response" | jq -r '.data.photoURL')
  verify_location=$(echo "$response" | jq -r '.data.location')
  verify_intro=$(echo "$response" | jq -r '.data.selfIntroduction')
  
  log_success "✓ 多欄位同時更新成功"
  log_info "  姓名: $verify_name"
  log_info "  大頭貼: $verify_photo"
  log_info "  地區: $verify_location"
  log_info "  自我介紹: ${verify_intro:0:30}..."
else
  log_error "✗ 多欄位更新失敗"
  echo "$response" | jq '.'
fi

sleep 1

# 測試 7: 驗證資料持久化
log_info ""
log_info "=== 測試 7: 驗證資料持久化 ==="
response=$(curl -s -X GET \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  "$API_BASE_URL/api/v1/users/me")

final_name=$(echo "$response" | jq -r '.data.name')
final_photo=$(echo "$response" | jq -r '.data.photoURL')
final_location=$(echo "$response" | jq -r '.data.location')

if [ "$final_name" = "綜合測試用戶" ] && \
   [ "$final_photo" = "https://example.com/final-avatar.jpg" ]; then
  log_success "✓ 資料已正確持久化"
  log_info "  最終姓名: $final_name"
  log_info "  最終大頭貼: $final_photo"
  log_info "  最終地區: $final_location"
else
  log_error "✗ 資料持久化驗證失敗"
fi

echo ""
log_success "=========================================="
log_success "  所有測試完成！"
log_success "=========================================="
