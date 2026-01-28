CREATE TABLE "store" (
    "id" serial PRIMARY KEY, -- 内部使用的自增 ID
    "external_id" UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(), -- 外部使用的 UUID
    "user_id" INT UNIQUE,
    "image_url" varchar(255),
    "author_list" text,
    "tags" varchar(255),
    "created_at" timestamp DEFAULT current_timestamp,
    "ai_summary" text,
    "description" text,
    "content" text,
    "name" varchar(255),
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
);