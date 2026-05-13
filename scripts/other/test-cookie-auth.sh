#!/bin/bash
# Cookie 認證 API 測試腳本
# 使用方式：./scripts/test-cookie-auth.sh <JWT_TOKEN> [BASE_URL]
#
# 範例:
#   ./scripts/test-cookie-auth.sh "eyJ..."                              # 正式站
#   ./scripts/test-cookie-auth.sh "eyJ..." https://server-dev.daodao.so # 測試站
#   ./scripts/test-cookie-auth.sh "eyJ..." http://localhost:4000        # 本地開發

TOKEN="$1"
BASE_URL="${2:-https://server.daodao.so}"

if [ -z "$TOKEN" ]; then
  echo "使用方式: $0 <JWT_TOKEN> [BASE_URL]"
  echo ""
  echo "範例:"
  echo "  $0 eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  echo "  $0 eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... http://localhost:4000"
  exit 1
fi

echo "=========================================="
echo "Cookie 認證 API 測試"
echo "=========================================="
echo "Base URL: $BASE_URL"
echo ""

# 測試 1: 使用 Cookie
echo "📌 測試 1: 使用 Cookie 認證"
echo "GET $BASE_URL/api/v1/auth/me"
echo "------------------------------------------"
curl -s -w "\n\nHTTP Status: %{http_code}\n" \
  --cookie "auth_token=$TOKEN" \
  "$BASE_URL/api/v1/auth/me" | head -50
echo ""

# 測試 2: 使用 Authorization Header
echo "📌 測試 2: 使用 Authorization Header"
echo "GET $BASE_URL/api/v1/auth/me"
echo "------------------------------------------"
curl -s -w "\n\nHTTP Status: %{http_code}\n" \
  -H "Authorization: Bearer $TOKEN" \
  "$BASE_URL/api/v1/auth/me" | head -50
echo ""

# 測試 3: 不帶認證（應該返回 401）
echo "📌 測試 3: 不帶認證（預期 401）"
echo "GET $BASE_URL/api/v1/auth/me"
echo "------------------------------------------"
curl -s -w "\n\nHTTP Status: %{http_code}\n" \
  "$BASE_URL/api/v1/auth/me" | head -50
echo ""

echo "=========================================="
echo "測試完成"
echo "=========================================="
