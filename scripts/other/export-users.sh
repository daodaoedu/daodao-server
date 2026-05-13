#!/bin/bash
# 匯出所有註冊用戶資料
# 使用方式: ./scripts/export-users.sh [csv|json]

set -e

# 顏色輸出
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔗 正在連接 PostgreSQL...${NC}"

# 從環境變數或 .env 讀取資料庫連線資訊
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# 資料庫連線資訊
DB_HOST="${POSTGRES_HOST:-postgres-prod}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_NAME="${POSTGRES_DB:-daodao}"
DB_USER="${POSTGRES_USER:-daodao}"
DB_PASS="${POSTGRES_PASSWORD:-daodao}"

# 輸出格式（預設 csv）
FORMAT="${1:-csv}"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
OUTPUT_FILE="users-export-${TIMESTAMP}.${FORMAT}"

echo -e "${GREEN}✅ 開始匯出用戶資料...${NC}"
echo ""

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
if [ "$FORMAT" = "json" ]; then
    # 匯出 JSON 格式
    PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -A -F"," -c "
    SELECT json_agg(row_to_json(t))
    FROM (
        $SQL_QUERY
    ) t;" > "$OUTPUT_FILE"

    echo -e "${GREEN}✅ 匯出完成！${NC}"
    echo -e "📄 檔案: ${BLUE}$OUTPUT_FILE${NC}"

elif [ "$FORMAT" = "csv" ]; then
    # 匯出 CSV 格式（加入 BOM 讓 Excel 正確顯示中文）
    printf '\xEF\xBB\xBF' > "$OUTPUT_FILE"
    PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "COPY (
        $SQL_QUERY
    ) TO STDOUT WITH CSV HEADER ENCODING 'UTF8';" >> "$OUTPUT_FILE"

    echo -e "${GREEN}✅ 匯出完成！${NC}"
    echo -e "📄 檔案: ${BLUE}$OUTPUT_FILE${NC}"

else
    echo -e "${RED}❌ 不支援的格式: $FORMAT${NC}"
    echo "使用方式: $0 [csv|json]"
    exit 1
fi

# 顯示統計資訊
echo ""
echo -e "${BLUE}📊 統計資訊:${NC}"

TOTAL_USERS=$(PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM users;")
echo "   總用戶數: $TOTAL_USERS"

WITH_EMAIL=$(PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM users u JOIN contacts c ON u.contact_id = c.id WHERE c.email IS NOT NULL AND c.email != '';")
echo "   有 Email: $WITH_EMAIL"

WITH_GENDER=$(PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM users WHERE gender IS NOT NULL AND gender != '';")
echo "   有性別: $WITH_GENDER"

WITH_LOCATION=$(PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM users WHERE location_id IS NOT NULL;")
echo "   有位置: $WITH_LOCATION"

SUBSCRIBED=$(PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM users u JOIN contacts c ON u.contact_id = c.id WHERE c.is_subscribe_email = true;")
echo "   訂閱電子報: $SUBSCRIBED"

echo ""
echo -e "${GREEN}✅ 完成！${NC}"
