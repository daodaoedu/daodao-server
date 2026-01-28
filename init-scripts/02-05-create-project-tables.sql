CREATE TABLE "project" (
    "id" serial NOT NULL UNIQUE,
    "external_id" UUID DEFAULT gen_random_uuid(), -- 使用 UUID 作为主键
    "user_id" int NOT NULL,
    "img_url" varchar(255),
    "topic" varchar(255),
    "description" text,
    "motivation" motivation_t[],
    "motivation_description" text,
    "goal" varchar(255),
    "content" text,
    "strategy" strategy_t[],
    "strategy_description" text,
    "resource_name" text[],
    "resource_url" text[],
    "outcome" outcome_t[],
    "outcome_description" text,
    "is_public" boolean DEFAULT false,  -- 是否公開
    "status" varchar(50) DEFAULT 'Not Started' CHECK ("status" IN ('Ongoing', 'Completed', 'Not Started', 'Canceled')),
    "start_date" date, -- 開始日期
    "end_date" date CHECK ("start_date" < "end_date"), -- 結束日期
    "interval" int CHECK ("interval" > 0), -- 週期間隔（單位：週，必須大於 0）
    "created_at" timestamp DEFAULT current_timestamp,
    "created_by" int,
    "updated_at" timestamp DEFAULT current_timestamp,
    "updated_by" int,
    "version" int,
    PRIMARY KEY("external_id"),
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
);

CREATE TABLE "user_project" (
    "id" serial NOT NULL UNIQUE,
    "user_external_id" UUID, -- 改为 UUID
    "project_id" int, -- 改为 UUID
    PRIMARY KEY("id"),
    FOREIGN KEY ("user_external_id") REFERENCES "users"("external_id") ON DELETE CASCADE,
    FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE
);


-- 創建 milestone 表
CREATE TABLE "milestone" (
    "id" serial PRIMARY KEY,
    "project_id" int, -- 對應的專案 ID
    "week" int , -- 第幾週
    "name" varchar(255), -- 里程碑名稱
    "description" text, -- 里程碑描述
    "start_date" date, -- 開始日期
    "end_date" date, -- 結束日期
    "is_completed" boolean DEFAULT false, -- 是否完成
    "is_deleted" boolean DEFAULT false, -- 是否已刪除
    "created_at" timestamp DEFAULT current_timestamp,
    "updated_at" timestamp DEFAULT current_timestamp,
    FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE
);

CREATE INDEX idx_milestone_project_id ON "milestone"("project_id");

-- 創建 task 表
CREATE TYPE "day_enum" AS ENUM ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday');

CREATE TABLE "task" (
    "id" serial PRIMARY KEY,
    "milestone_id" int NOT NULL, -- 對應的里程碑 ID
    "name" varchar(255), -- 任務名稱
    "description" text, -- 任務描述
    "days_of_week" day_enum[], -- 限定只能存 ENUM 類型值的陣列
    "is_completed" boolean DEFAULT false, -- 是否完成
    "is_deleted" boolean DEFAULT false, -- 是否已刪除
    "created_at" timestamp DEFAULT current_timestamp,
    "updated_at" timestamp DEFAULT current_timestamp,
    FOREIGN KEY ("milestone_id") REFERENCES "milestone"("id") ON DELETE CASCADE
);

CREATE INDEX idx_task_milestone_id ON "task"("milestone_id");


-- 創建學習成果(outcome)表
CREATE TABLE "outcome" (
    "id" serial PRIMARY KEY,
    "project_id" int, -- 關聯的學習計畫 ID
    "week" int NOT NULL, -- 第幾週
    "title" varchar(255) NOT NULL, -- 學習計畫標題
    "description" text, -- 描述
    "date" date NOT NULL, -- 日期
    "img_url" varchar(255), -- 圖片網址
    "created_at" timestamp DEFAULT current_timestamp,
    "updated_at" timestamp DEFAULT current_timestamp,
    FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE
);

-- 創建便利貼(note)表
CREATE TABLE "note" (
    "id" serial PRIMARY KEY,
    "project_id" int, -- 關聯的學習計畫 ID
    "week" int NOT NULL, -- 第幾週
    "title" varchar(255) NOT NULL, -- 學習計畫標題
    "description" text, -- 描述
    "date" date NOT NULL, -- 日期
    "img_url" varchar(255), -- 圖片網址
    "created_at" timestamp DEFAULT current_timestamp,
    "updated_at" timestamp DEFAULT current_timestamp,
    FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE
);

-- 創建覆盤(review)表
-- 創建 ENUM 類型來存儲心情選項（使用英文）
CREATE TYPE mood_enum AS ENUM ('happy', 'calm', 'anxious', 'tired', 'frustrated');
CREATE TABLE "review" (
    "id" serial PRIMARY KEY,
    "project_id" int, -- 關聯的學習計畫 ID
    "week" int NOT NULL, -- 第幾週
    "title" varchar(255) NOT NULL, -- 學習計畫標題
    "mood" mood_enum NOT NULL, -- 心情（英文存儲）
    "mood_description" text, -- 針對心情的補充
    "stress_level" int CHECK ("stress_level" BETWEEN 1 AND 10), -- 壓力程度（1-10）
    "learning_review" int CHECK ("learning_review" BETWEEN 1 AND 10), -- 學習回顧（1-10）
    "learning_feedback" text, -- 針對學習回饋補充
    "adjustment_plan" text, -- 調整與規劃
    "created_at" timestamp DEFAULT current_timestamp,
    "updated_at" timestamp DEFAULT current_timestamp,
    FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE
);
