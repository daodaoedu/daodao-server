#!/bin/bash
# Google OAuth 完整測試流程
# 使用方式：./scripts/test-oauth-flow.sh [BASE_URL]
#
# 範例:
#   ./scripts/test-oauth-flow.sh                           # 正式站 (server.daodao.so)
#   ./scripts/test-oauth-flow.sh https://server-dev.daodao.so  # 測試站
#   ./scripts/test-oauth-flow.sh http://localhost:4000     # 本地開發

BASE_URL="${1:-https://server.daodao.so}"

echo "=========================================="
echo "Google OAuth 登入測試"
echo "=========================================="
echo ""
echo "📌 步驟 1: 在瀏覽器開啟以下網址進行 Google 登入"
echo ""
echo "   $BASE_URL/api/v1/auth/google"
echo ""
echo "=========================================="
echo ""
echo "📌 步驟 2: 登入成功後，從瀏覽器取得 JWT Token"
echo ""
echo "   方法 A - 從 Cookie 取得:"
echo "   1. 開啟 DevTools (F12)"
echo "   2. 前往 Application → Cookies → $BASE_URL"
echo "   3. 找到 'auth_token' 的值"
echo ""
echo "   方法 B - 從重定向 URL 取得 (如果有):"
echo "   1. 查看網址列的 callback URL"
echo "   2. 找到 token 參數"
echo ""
echo "=========================================="
echo ""
echo "📌 步驟 3: 使用 Token 測試 API"
echo ""
echo "   ./scripts/test-cookie-auth.sh \"YOUR_TOKEN\" $BASE_URL"
echo ""
echo "=========================================="
echo ""
echo "📌 快速 cURL 測試指令（複製 token 後貼上）:"
echo ""
echo "   # 測試 Cookie 認證"
echo "   curl -v --cookie \"auth_token=YOUR_TOKEN\" $BASE_URL/api/v1/auth/me"
echo ""
echo "   # 測試 Header 認證"
echo "   curl -v -H \"Authorization: Bearer YOUR_TOKEN\" $BASE_URL/api/v1/auth/me"
echo ""
echo "=========================================="
