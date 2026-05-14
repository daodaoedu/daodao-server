#!/bin/bash
# 透過 Docker 容器匯出用戶資料
# 使用方式: ./scripts/export-users-docker.sh [csv|json]

set -e

# 顏色輸出
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔗 準備從 Docker 容器匯出資料...${NC}"

# 容器名稱
CONTAINER_NAME="prod_app"

# 輸出格式（預設 csv）
FORMAT="${1:-csv}"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
OUTPUT_FILE="users-export-${TIMESTAMP}.${FORMAT}"

echo -e "${GREEN}✅ 開始匯出用戶資料...${NC}"
echo ""

# 檢查容器是否運行
if ! docker ps | grep -q "$CONTAINER_NAME"; then
    echo -e "${RED}❌ 錯誤: 容器 $CONTAINER_NAME 未運行${NC}"
    exit 1
fi

# SQL 查詢
SQL_QUERY="
SELECT
    u.id,
    u.external_id,
    u.nickname,
    u.birth_date,
    u.gender,
    u.education_stage,
    u.language,
    u.is_open_profile,
    u.is_open_location,

    -- 聯絡資訊
    c.email,
    c.google_id,
    c.photo_url,
    c.is_subscribe_email,
    c.ig as instagram,
    c.discord,
    c.line,
    c.fb as facebook,

    -- 個人簡介
    bi.self_introduction,
    bi.share_list,
    array_to_string(bi.want_to_do_list, '; ') as want_to_do_list,

    -- 位置資訊
    city.name as location_city,
    country.name as location_country,
    l.isTaiwan as location_is_taiwan,

    -- 其他
    array_to_string(u.tag_list, '; ') as tag_list,
    u.role_id,
    u.mongo_id,
    u.created_at,
    u.updated_at

FROM users u
LEFT JOIN contacts c ON u.contact_id = c.id
LEFT JOIN basic_info bi ON u.basic_info_id = bi.id
LEFT JOIN location l ON u.location_id = l.id
LEFT JOIN city ON l.city_id = city.id
LEFT JOIN country ON l.country_id = country.id
ORDER BY u.created_at DESC;
"

# 根據格式匯出
if [ "$FORMAT" = "csv" ]; then
    echo -e "${BLUE}📊 匯出 CSV 格式...${NC}"

    # 在容器內執行 psql 並匯出 CSV
    docker exec $CONTAINER_NAME sh -c "
        PGPASSWORD=daodao psql -h postgres-prod -U daodao -d daodao -c \"
        COPY (
            $SQL_QUERY
        ) TO STDOUT WITH CSV HEADER ENCODING 'UTF8';
        \"
    " > "$OUTPUT_FILE"

    # 加入 BOM 讓 Excel 正確顯示中文
    if [ -f "$OUTPUT_FILE" ]; then
        printf '\xEF\xBB\xBF' | cat - "$OUTPUT_FILE" > temp && mv temp "$OUTPUT_FILE"
    fi

elif [ "$FORMAT" = "json" ]; then
    echo -e "${BLUE}📊 匯出 JSON 格式...${NC}"

    # 在容器內執行 psql 並匯出 JSON
    docker exec $CONTAINER_NAME sh -c "
        PGPASSWORD=daodao psql -h postgres-prod -U daodao -d daodao -t -A -c \"
        SELECT json_agg(row_to_json(t))
        FROM (
            $SQL_QUERY
        ) t;
        \"
    " > "$OUTPUT_FILE"

else
    echo -e "${RED}❌ 不支援的格式: $FORMAT${NC}"
    echo "使用方式: $0 [csv|json]"
    exit 1
fi

if [ -f "$OUTPUT_FILE" ]; then
    echo -e "${GREEN}✅ 匯出完成！${NC}"
    echo -e "📄 檔案: ${BLUE}$OUTPUT_FILE${NC}"
    echo -e "📦 大小: $(ls -lh "$OUTPUT_FILE" | awk '{print $5}')"
else
    echo -e "${RED}❌ 匯出失敗${NC}"
    exit 1
fi

# 顯示統計資訊
echo ""
echo -e "${BLUE}📊 統計資訊:${NC}"

TOTAL_USERS=$(docker exec $CONTAINER_NAME sh -c "
    PGPASSWORD=daodao psql -h postgres-prod -U daodao -d daodao -t -c 'SELECT COUNT(*) FROM users;'
")
echo "   總用戶數: $(echo $TOTAL_USERS | xargs)"

WITH_EMAIL=$(docker exec $CONTAINER_NAME sh -c "
    PGPASSWORD=daodao psql -h postgres-prod -U daodao -d daodao -t -c 'SELECT COUNT(*) FROM users u JOIN contacts c ON u.contact_id = c.id WHERE c.email IS NOT NULL AND c.email != '';'
")
echo "   有 Email: $(echo $WITH_EMAIL | xargs)"

WITH_GENDER=$(docker exec $CONTAINER_NAME sh -c "
    PGPASSWORD=daodao psql -h postgres-prod -U daodao -d daodao -t -c 'SELECT COUNT(*) FROM users WHERE gender IS NOT NULL AND gender != '';'
")
echo "   有性別: $(echo $WITH_GENDER | xargs)"

echo ""
echo -e "${GREEN}✅ 完成！${NC}"
