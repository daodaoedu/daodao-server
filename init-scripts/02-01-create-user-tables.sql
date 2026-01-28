-- Misc TABLE 
CREATE TABLE "area" (
    "id" serial NOT NULL UNIQUE,
    "city" "city_t",
    PRIMARY KEY("id")
);
CREATE INDEX "idx_area_city" ON "area" ("city");
CREATE TABLE "location" (
    "id" serial NOT NULL UNIQUE,
    "area_id" int,
    "isTaiwan" boolean,
    "region" VARCHAR(64),
    PRIMARY KEY("id"),
    FOREIGN KEY ("area_id") REFERENCES "area"("id")
);
CREATE TABLE "contacts" (
    "id" serial NOT NULL UNIQUE,
    "google_id" varchar(255),
    "photo_url" text,
    "is_subscribe_email" boolean,
    "email" varchar(255),
    "ig" varchar(255),
    "discord" varchar(255),
    "line" varchar(255),
    "fb" varchar(255),
    PRIMARY KEY("id")
);
CREATE TABLE "basic_info" (
    "id" serial NOT NULL UNIQUE,
    "self_introduction" text,
    "share_list" text,
    "want_to_do_list" want_to_do_list_t [],
    PRIMARY KEY("id")
);
COMMENT ON COLUMN basic_info.share_list IS 'split(、)';


-- main tables
-- 等待 找夥伴 與 個人名片 resume 規格明確 在作拆分。
CREATE TABLE "users" (
    "id" serial NOT NULL UNIQUE,
    "external_id" UUID DEFAULT gen_random_uuid(), -- 使用 UUID 作为主键
    "mongo_id" text NOT NULL UNIQUE,
    "gender" gender_t,
    "language" VARCHAR(255),
    "education_stage" education_stage_t DEFAULT 'other',
    "tag_list" text,
    "contact_id" int,
    "is_open_location" boolean,
    "location_id" int,
    "nickname" varchar(255),
    "role_id" INT NOT NULL,   -- 關聯角色ID
    "is_open_profile" boolean,
    "birth_date" date,
    "basic_info_id" int,
    "createdDate" TIMESTAMPTZ,
    "updatedDate" TIMESTAMPTZ,
    "created_by" varchar(255),
    "created_at" TIMESTAMPTZ,
    "updated_by" varchar(255),
    "updated_at" TIMESTAMPTZ,
    PRIMARY KEY("external_id"),
    FOREIGN KEY("location_id") REFERENCES "location"("id"),
    FOREIGN KEY("contact_id") REFERENCES "contacts"("id"),
    FOREIGN KEY("basic_info_id") REFERENCES "basic_info"("id"),
    FOREIGN KEY ("role_id") REFERENCES "roles" ("id") -- 關聯角色表
);

COMMENT ON TABLE "users" IS '可能需要維護 熱門標籤列表 到cache';
-- COMMENT ON COLUMN "users".identity_list IS '夥伴類型';
CREATE INDEX "idx_users_education_stage" ON "users" ("education_stage");
-- CREATE INDEX "idx_users_on_identity_list" ON "users" ("identity_list");
CREATE INDEX "idx_users_location_id" ON "users" ("location_id");

CREATE TABLE "role_permissions" (
    "role_id" INT NOT NULL,                  -- 關聯角色ID
    "permission_id" INT NOT NULL,            -- 關聯權限ID
    PRIMARY KEY("role_id", "permission_id"),
    FOREIGN KEY("role_id") REFERENCES "roles"("id"),
    FOREIGN KEY("permission_id") REFERENCES "permissions"("id")
);


-- 新增用戶和身份的聯接表
CREATE TABLE "user_positions" (
    "user_id" INT NOT NULL,
    "position_id" INT NOT NULL,
    PRIMARY KEY ("user_id", "position_id"),
    FOREIGN KEY ("user_id") REFERENCES "users"("id"),
    FOREIGN KEY ("position_id") REFERENCES "position"("id")
);

-- 用於管理 個別用戶 的 額外權限 或 限制權限，即覆蓋預設角色權限的功能。
CREATE TABLE "user_permissions" ( 
    "user_id" INT NOT NULL,                  -- 關聯用戶ID
    "permission_id" INT NOT NULL,            -- 關聯權限ID
    PRIMARY KEY("user_id", "permission_id"),
    FOREIGN KEY("user_id") REFERENCES "users"("id"),
    FOREIGN KEY("permission_id") REFERENCES "permissions"("id")
);


-- Guest
INSERT INTO "role_permissions" ("role_id", "permission_id") VALUES
(1, 1); -- Guest: 瀏覽頁面

-- User
INSERT INTO "role_permissions" ("role_id", "permission_id") VALUES
(2, 1), -- 瀏覽頁面
(2, 2), -- 聯繫功能
(2, 3), -- 發布揪團
(2, 4); -- 分享資源與心得

-- Participant
INSERT INTO "role_permissions" ("role_id", "permission_id") VALUES
(3, 1), -- 瀏覽頁面
(3, 2), -- 聯繫功能
(3, 3), -- 發布揪團
(3, 4), -- 分享資源與心得
(3, 5); -- 使用學習計畫功能

-- Mentor
INSERT INTO "role_permissions" ("role_id", "permission_id") VALUES
(4, 1), -- 瀏覽頁面
(4, 2), -- 聯繫功能
(4, 3), -- 發布揪團
(4, 4), -- 分享資源與心得
(4, 5), -- 使用學習計畫功能
(4, 6); -- 查詢所有馬拉松參與者資訊

-- Admin
INSERT INTO "role_permissions" ("role_id", "permission_id") VALUES
(5, 1), -- 瀏覽頁面
(5, 2), -- 聯繫功能
(5, 3), -- 發布揪團
(5, 4), -- 分享資源與心得
(5, 5), -- 使用學習計畫功能
(5, 6), -- 查詢所有馬拉松參與者資訊
(5, 7); -- 查看所有資料

-- SuperAdmin
INSERT INTO "role_permissions" ("role_id", "permission_id") VALUES
(6, 1), -- 瀏覽頁面
(6, 2), -- 聯繫功能
(6, 3), -- 發布揪團
(6, 4), -- 分享資源與心得
(6, 5), -- 使用學習計畫功能
(6, 6), -- 查詢所有馬拉松參與者資訊
(6, 7), -- 查看所有資料
(6, 8); -- 修改、刪除所有資料


INSERT INTO users (
    external_id,
    mongo_id,
    nickname,
    role_id
) VALUES (
    gen_random_uuid(),
    1,
    'SuperAdmin',
    6
);

-- 找夥伴功能
-- 雖然數組設計簡潔，但對於需要精細化查詢的情況可能會有性能問題
CREATE TABLE user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    nickname VARCHAR(100),
    bio TEXT,
    skills TEXT [],
    interests TEXT [],
    learning_needs TEXT [],
    contact_info JSONB,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "idx_user_profiles_is_public" ON user_profiles(is_public);



-- 使用者管理, 訂閱方案相關功能, 免費/標準/進階/專業。只會有四筆紀錄
CREATE TABLE subscription_plan (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    features JSONB,
    price DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'canceled');
-- 使用者管理，哪位使用者訂閱了甚麼方案，何時到期
CREATE TABLE user_subscription (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    plan_id INT REFERENCES subscription_plan(id) ON DELETE SET NULL,
    status subscription_status NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_user_subscription_user_status ON user_subscription (user_id, status);
