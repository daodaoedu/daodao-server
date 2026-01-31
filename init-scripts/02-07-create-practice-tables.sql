-- Practice (實踐) 相關表格
-- 用於追蹤用戶的學習實踐計畫和打卡記錄

-- Practice 內容類型枚舉
CREATE TYPE "practice_content_type_t" AS ENUM (
    'book',
    'video',
    'articles',
    'podcast',
    'course',
    'custom'
);

-- Practice 狀態枚舉
CREATE TYPE "practice_status_t" AS ENUM (
    'active',
    'paused',
    'completed',
    'archived'
);

-- Practice 每日目標類型枚舉
CREATE TYPE "practice_daily_goal_type_t" AS ENUM (
    'time',
    'completion'
);

-- 打卡心情枚舉
CREATE TYPE "checkin_mood_t" AS ENUM (
    'awesome',
    'happy',
    'neutral',
    'tired',
    'frustrated'
);

-- practices 表（實踐主表）
CREATE TABLE "practices" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "user_id" UUID NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "content_type" practice_content_type_t NOT NULL,
    "custom_content_type" VARCHAR(50),
    "total_amount" INT NOT NULL CHECK ("total_amount" > 0),
    "current_progress" DECIMAL(10,2) DEFAULT 0,
    "start_date" DATE,
    "daily_goal_type" practice_daily_goal_type_t NOT NULL,
    "daily_goal_time_minutes" INT CHECK ("daily_goal_time_minutes" BETWEEN 5 AND 240),
    "daily_goal_amount" INT CHECK ("daily_goal_amount" BETWEEN 1 AND 100),
    "daily_goal_unit" VARCHAR(10),
    "practice_action" TEXT,
    "status" practice_status_t DEFAULT 'active',
    "like_count" INT DEFAULT 0,
    "comment_count" INT DEFAULT 0,
    "view_count" INT DEFAULT 0,
    "share_count" INT DEFAULT 0,
    "has_resources" BOOLEAN DEFAULT FALSE,
    "resource_count" INT DEFAULT 0,
    "streak" INT DEFAULT 0,
    "max_streak" INT DEFAULT 0,
    "last_checkin_date" DATE,
    "total_checkins" INT DEFAULT 0,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ DEFAULT NULL,
    "deleted_at" TIMESTAMPTZ DEFAULT NULL,
    "version" INT DEFAULT 1,
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

-- practices 表索引
CREATE INDEX "idx_practices_user_id" ON "practices"("user_id");
CREATE INDEX "idx_practices_status" ON "practices"("status");
CREATE INDEX "idx_practices_content_type" ON "practices"("content_type");
CREATE INDEX "idx_practices_created_at" ON "practices"("created_at");
CREATE INDEX "idx_practices_like_count" ON "practices"("like_count");
CREATE INDEX "idx_practices_deleted_at" ON "practices"("deleted_at") WHERE "deleted_at" IS NULL;

-- practice_checkins 表（打卡/簽到記錄）
CREATE TABLE "practice_checkins" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "practice_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "checkin_date" DATE NOT NULL,
    "progress_amount" DECIMAL(10,2) NOT NULL CHECK ("progress_amount" > 0),
    "note" TEXT,
    "mood" checkin_mood_t,
    "reflection_text" TEXT,
    "related_resource_id" UUID,
    "streak_day" INT DEFAULT 1,
    "cumulative_progress" DECIMAL(10,2) NOT NULL,
    "is_public" BOOLEAN DEFAULT TRUE,
    "og_image" VARCHAR(1000), -- Open Graph 圖片 URL，用於社交分享
    "like_count" INT DEFAULT 0,
    "comment_count" INT DEFAULT 0,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ DEFAULT NULL,
    FOREIGN KEY ("practice_id") REFERENCES "practices"("id") ON DELETE CASCADE,
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
    UNIQUE ("practice_id", "checkin_date")
);

-- practice_checkins 表索引
CREATE INDEX "idx_practice_checkins_practice_id" ON "practice_checkins"("practice_id");
CREATE INDEX "idx_practice_checkins_user_id" ON "practice_checkins"("user_id");
CREATE INDEX "idx_practice_checkins_date" ON "practice_checkins"("checkin_date");
CREATE INDEX "idx_practice_checkins_mood" ON "practice_checkins"("mood");
CREATE INDEX "idx_practice_checkins_is_public" ON "practice_checkins"("is_public") WHERE "is_public" = TRUE;

-- practice_checkin_tags 表（打卡標籤關聯表）
CREATE TABLE "practice_checkin_tags" (
    "id" SERIAL PRIMARY KEY,
    "checkin_id" UUID NOT NULL,
    "tag_id" INT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("checkin_id") REFERENCES "practice_checkins"("id") ON DELETE CASCADE,
    FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE,
    UNIQUE ("checkin_id", "tag_id")
);

-- practice_checkin_tags 表索引
CREATE INDEX "idx_practice_checkin_tags_checkin_id" ON "practice_checkin_tags"("checkin_id");
CREATE INDEX "idx_practice_checkin_tags_tag_id" ON "practice_checkin_tags"("tag_id");

-- practice_resources 表（實踐資源）
CREATE TABLE "practice_resources" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "practice_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "url" VARCHAR(1000),
    "order_index" INT DEFAULT 0,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ DEFAULT NULL,
    FOREIGN KEY ("practice_id") REFERENCES "practices"("id") ON DELETE CASCADE
);

-- practice_resources 表索引
CREATE INDEX "idx_practice_resources_practice_id" ON "practice_resources"("practice_id");
