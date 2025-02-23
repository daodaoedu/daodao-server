CREATE TABLE "fee_plans" (
    "id" SERIAL PRIMARY KEY,
    "fee_plan_type" qualifications_t, -- 收費計劃名稱
    "name" VARCHAR(255),                   -- 收費計劃名稱
    "discount" NUMERIC(8,2),               -- 折扣
    "created_at" TIMESTAMP DEFAULT NOW(),  -- 創建時間
    "updated_at" TIMESTAMP DEFAULT NOW()   -- 更新時間
);

CREATE TABLE "eligibility" (
    "id" SERIAL PRIMARY KEY,
    "reference_file_path" TEXT,
    "partner_emails" text[],
    "fee_plans_id" INT REFERENCES fee_plans(id),
    "created_at" TIMESTAMP DEFAULT NOW(),  -- 創建時間
    "updated_at" TIMESTAMP DEFAULT NOW()   -- 更新時間

);

CREATE TABLE "marathon" (
    "id" SERIAL PRIMARY KEY,
    "external_id" UUID DEFAULT gen_random_uuid(), -- 使用 UUID 作为主键
    "event_id" varchar(50) NOT NULL UNIQUE, -- 活動代碼，例如 "2024S1"
    "title" varchar(255) NOT NULL, -- 活動標題
    "description" text, -- 活動描述
    "start_date" date NOT NULL, -- 馬拉松的報名開始日期。
    "end_date" date NOT NULL, -- 活動結束日期
    "registration_status" varchar(50) CHECK ("registration_status" IN ('Open', 'Closed', 'Pending', 'Full')), -- 活動的整體報名狀態。
    "people_number" INT, -- 報名人數上限 
    "registration_start_date" date, -- 報名開放日期
    "registration_end_date" date, -- 報名開放日期
    "is_public" boolean DEFAULT false, -- 是否公開
    "created_by" int, -- 主辦者 (可選)
    "created_at" timestamp DEFAULT current_timestamp,
    "updated_at" timestamp DEFAULT current_timestamp,
    FOREIGN KEY ("created_by") REFERENCES "users"("id") -- 若需要記錄主辦者
);
CREATE INDEX idx_marathon_start_date ON "marathon"("start_date");



CREATE TABLE "project_marathon" (
    "id" SERIAL PRIMARY KEY,
    "project_id" int,
    "marathon_id" int, 
    "eligibility_id" int, -- 收費計劃
    "project_registration_date" timestamp DEFAULT current_timestamp, -- 某個專案報名此馬拉松的日期。
    "status" varchar(50) CHECK ("status" IN ('Pending', 'Approved', 'Rejected')), -- 專案報名的審核狀態
    "feedback" text, -- 評審意見或備註
    "created_at" timestamp DEFAULT current_timestamp,
    "updated_at" timestamp DEFAULT current_timestamp,
    FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE,
    FOREIGN KEY ("marathon_id") REFERENCES "marathon"("id") ON DELETE CASCADE,
    FOREIGN KEY ("eligibility_id") REFERENCES "eligibility"("id"),

    UNIQUE ("project_id", "marathon_id") -- 保證同一專案不能重複報名同一馬拉松
);

CREATE INDEX idx_project_marathon_status ON "project_marathon"("status");


INSERT INTO "fee_plans" (fee_plan_type, name, discount)
VALUES
    ('low_income'::qualifications_t, 'Student Discount', 0.00),
    ('discount'::qualifications_t, 'Personal Early Plan', 6000.00),
    ('personal'::qualifications_t,  'Standard Plan', 8000.00),
    ('double'::qualifications_t, 'Couple Discount', 10000.00),
    ('three'::qualifications_t, 'Three Plan', 12000.00),
    ('four'::qualifications_t, 'Family Plan', 12000.00);

-- 插入 marathon 表
INSERT INTO "marathon" (
    "event_id", 
    "title", 
    "description", 
    "start_date", 
    "end_date", 
    "registration_status", 
    "people_number", 
    "registration_start_date", 
    "registration_end_date", 
    "is_public", 
    "created_by"
) VALUES (
    '2025S1', 
    'Daodao Marathon', 
    'Helps you create a personalized learning plan.', 
    '2025-02-10', 
    '2025-07-12', 
    'Open', 
    20, 
    '2024-12-15',
    '2025-01-19',  
    true, 
    1
);