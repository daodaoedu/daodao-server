--
-- PostgreSQL database dump
--

-- Dumped from database version 17.2 (Debian 17.2-1.pgdg120+1)
-- Dumped by pg_dump version 17.2 (Debian 17.2-1.pgdg120+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: age_t; Type: TYPE; Schema: public; Owner: daodao
--

CREATE TYPE public.age_t AS ENUM (
    'preschool',
    'Elementary',
    'high',
    'University'
);


ALTER TYPE public.age_t OWNER TO daodao;

--
-- Name: city_t; Type: TYPE; Schema: public; Owner: daodao
--

CREATE TYPE public.city_t AS ENUM (
    'Taipei City',
    'Keelung City',
    'New Taipei City',
    'Lianjiang County',
    'Taoyuan City',
    'Hsinchu City',
    'Hsinchu County',
    'Miaoli County',
    'Taichung City',
    'Changhua County',
    'Yunlin County',
    'Chiayi County',
    'Chiayi City',
    'Tainan City',
    'nantou county',
    'kaohsiung city',
    'Pingtung County',
    'Hainan Island',
    'Penghu County',
    'Kinmen County',
    'Yilan County',
    'Hualien County',
    'Taitung County',
    'Other'
);


ALTER TYPE public.city_t OWNER TO daodao;

--
-- Name: cost_t; Type: TYPE; Schema: public; Owner: daodao
--

CREATE TYPE public.cost_t AS ENUM (
    'free',
    'part',
    'payment'
);


ALTER TYPE public.cost_t OWNER TO daodao;

--
-- Name: day_enum; Type: TYPE; Schema: public; Owner: daodao
--

CREATE TYPE public.day_enum AS ENUM (
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday'
);


ALTER TYPE public.day_enum OWNER TO daodao;

--
-- Name: education_stage_t; Type: TYPE; Schema: public; Owner: daodao
--

CREATE TYPE public.education_stage_t AS ENUM (
    'university',
    'high',
    'other'
);


ALTER TYPE public.education_stage_t OWNER TO daodao;

--
-- Name: freqency_t; Type: TYPE; Schema: public; Owner: daodao
--

CREATE TYPE public.freqency_t AS ENUM (
    'two',
    'one',
    'three',
    'month'
);


ALTER TYPE public.freqency_t OWNER TO daodao;

--
-- Name: gender_t; Type: TYPE; Schema: public; Owner: daodao
--

CREATE TYPE public.gender_t AS ENUM (
    'male',
    'female',
    'other'
);


ALTER TYPE public.gender_t OWNER TO daodao;

--
-- Name: group_participation_role_t; Type: TYPE; Schema: public; Owner: daodao
--

CREATE TYPE public.group_participation_role_t AS ENUM (
    'Initiator',
    'Participant'
);


ALTER TYPE public.group_participation_role_t OWNER TO daodao;

--
-- Name: group_type_t; Type: TYPE; Schema: public; Owner: daodao
--

CREATE TYPE public.group_type_t AS ENUM (
    'reading club',
    'workshop',
    'project',
    'competition',
    'Activity',
    'Societies',
    'course',
    'practice',
    'other'
);


ALTER TYPE public.group_type_t OWNER TO daodao;

--
-- Name: mood_enum; Type: TYPE; Schema: public; Owner: daodao
--

CREATE TYPE public.mood_enum AS ENUM (
    'happy',
    'calm',
    'anxious',
    'tired',
    'frustrated'
);


ALTER TYPE public.mood_enum OWNER TO daodao;

--
-- Name: motivation_t; Type: TYPE; Schema: public; Owner: daodao
--

CREATE TYPE public.motivation_t AS ENUM (
    'driven_by_curiosity',
    'interest_and_passion',
    'self_challenge',
    'personal_growth',
    'career_development',
    'pursuing_education_or_qualifications',
    'social_recognition',
    'exploring_possibilities',
    'preparing_for_the_future',
    'innovation_and_development',
    'practical_needs',
    'inspired_by_events',
    'interpersonal_connections',
    'life_changes',
    'impact_on_society',
    'influenced_by_a_group',
    'others'
);


ALTER TYPE public.motivation_t OWNER TO daodao;

--
-- Name: outcome_t; Type: TYPE; Schema: public; Owner: daodao
--

CREATE TYPE public.outcome_t AS ENUM (
    'building_websites',
    'managing_social_media',
    'writing_research_reports',
    'artistic_creation',
    'initiating_projects_or_organizations',
    'making_videos',
    'organizing_events',
    'teaching_courses',
    'participating_in_competitions',
    'others'
);


ALTER TYPE public.outcome_t OWNER TO daodao;

--
-- Name: partner_education_step_t; Type: TYPE; Schema: public; Owner: daodao
--

CREATE TYPE public.partner_education_step_t AS ENUM (
    'high school',
    'other',
    'University'
);


ALTER TYPE public.partner_education_step_t OWNER TO daodao;

--
-- Name: qualifications_t; Type: TYPE; Schema: public; Owner: daodao
--

CREATE TYPE public.qualifications_t AS ENUM (
    'low_income',
    'discount',
    'personal',
    'double',
    'three',
    'four'
);


ALTER TYPE public.qualifications_t OWNER TO daodao;

--
-- Name: strategy_t; Type: TYPE; Schema: public; Owner: daodao
--

CREATE TYPE public.strategy_t AS ENUM (
    'data_collection_research_analysis',
    'book_reading',
    'watching_videos',
    'listening_to_podcasts',
    'examinations',
    'participating_in_competitions',
    'finding_study_partners',
    'joining_communities',
    'consulting_experts_and_scholars',
    'doing_projects',
    'initiating_actions',
    'field_internship',
    'organizing_events_or_courses',
    'attending_events_or_courses',
    'field_research',
    'conducting_interviews',
    'conducting_surveys',
    'others'
);


ALTER TYPE public.strategy_t OWNER TO daodao;

--
-- Name: subscription_status; Type: TYPE; Schema: public; Owner: daodao
--

CREATE TYPE public.subscription_status AS ENUM (
    'active',
    'inactive',
    'canceled'
);


ALTER TYPE public.subscription_status OWNER TO daodao;

--
-- Name: want_to_do_list_t; Type: TYPE; Schema: public; Owner: daodao
--

CREATE TYPE public.want_to_do_list_t AS ENUM (
    'interaction',
    'do-project',
    'make-group-class',
    'find-student',
    'find-teacher',
    'find-group'
);


ALTER TYPE public.want_to_do_list_t OWNER TO daodao;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: area; Type: TABLE; Schema: public; Owner: daodao
--

CREATE TABLE public.area (
    id integer NOT NULL,
    city public.city_t
);


ALTER TABLE public.area OWNER TO daodao;

--
-- Name: area_id_seq; Type: SEQUENCE; Schema: public; Owner: daodao
--

CREATE SEQUENCE public.area_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.area_id_seq OWNER TO daodao;

--
-- Name: area_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: daodao
--

ALTER SEQUENCE public.area_id_seq OWNED BY public.area.id;


--
-- Name: basic_info; Type: TABLE; Schema: public; Owner: daodao
--

CREATE TABLE public.basic_info (
    id integer NOT NULL,
    self_introduction text,
    share_list text,
    want_to_do_list public.want_to_do_list_t[]
);


ALTER TABLE public.basic_info OWNER TO daodao;

--
-- Name: COLUMN basic_info.share_list; Type: COMMENT; Schema: public; Owner: daodao
--

COMMENT ON COLUMN public.basic_info.share_list IS 'split(、)';


--
-- Name: basic_info_id_seq; Type: SEQUENCE; Schema: public; Owner: daodao
--

CREATE SEQUENCE public.basic_info_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.basic_info_id_seq OWNER TO daodao;

--
-- Name: basic_info_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: daodao
--

ALTER SEQUENCE public.basic_info_id_seq OWNED BY public.basic_info.id;


--
-- Name: contacts; Type: TABLE; Schema: public; Owner: daodao
--

CREATE TABLE public.contacts (
    id integer NOT NULL,
    google_id character varying(255),
    photo_url text,
    is_subscribe_email boolean,
    email character varying(255),
    ig character varying(255),
    discord character varying(255),
    line character varying(255),
    fb character varying(255)
);


ALTER TABLE public.contacts OWNER TO daodao;

--
-- Name: contacts_id_seq; Type: SEQUENCE; Schema: public; Owner: daodao
--

CREATE SEQUENCE public.contacts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.contacts_id_seq OWNER TO daodao;

--
-- Name: contacts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: daodao
--

ALTER SEQUENCE public.contacts_id_seq OWNED BY public.contacts.id;


--
-- Name: eligibility; Type: TABLE; Schema: public; Owner: daodao
--

CREATE TABLE public.eligibility (
    id integer NOT NULL,
    reference_file_path text,
    partner_emails text[],
    fee_plans_id integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.eligibility OWNER TO daodao;

--
-- Name: eligibility_id_seq; Type: SEQUENCE; Schema: public; Owner: daodao
--

CREATE SEQUENCE public.eligibility_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.eligibility_id_seq OWNER TO daodao;

--
-- Name: eligibility_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: daodao
--

ALTER SEQUENCE public.eligibility_id_seq OWNED BY public.eligibility.id;


--
-- Name: fee_plans; Type: TABLE; Schema: public; Owner: daodao
--

CREATE TABLE public.fee_plans (
    id integer NOT NULL,
    fee_plan_type public.qualifications_t,
    name character varying(255),
    discount numeric(8,2),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.fee_plans OWNER TO daodao;

--
-- Name: fee_plans_id_seq; Type: SEQUENCE; Schema: public; Owner: daodao
--

CREATE SEQUENCE public.fee_plans_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.fee_plans_id_seq OWNER TO daodao;

--
-- Name: fee_plans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: daodao
--

ALTER SEQUENCE public.fee_plans_id_seq OWNED BY public.fee_plans.id;


--
-- Name: groups; Type: TABLE; Schema: public; Owner: daodao
--

CREATE TABLE public.groups (
    id integer NOT NULL,
    external_id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text,
    photo_url character varying(255),
    photo_alt character varying(255),
    category text,
    group_type public.group_type_t[],
    partner_education_step public.partner_education_step_t[],
    description character varying(255),
    area_id integer[],
    is_grouping boolean,
    created_date timestamp with time zone,
    updated_date timestamp with time zone,
    "time" text,
    partner_style text,
    created_at timestamp with time zone,
    created_by integer,
    updated_at timestamp with time zone,
    updated_by character varying(255),
    motivation text,
    contents text,
    expectation_result text,
    notice text,
    tag_list text,
    group_deadline timestamp with time zone,
    hold_time time without time zone,
    is_online boolean,
    "TBD" boolean
);


ALTER TABLE public.groups OWNER TO daodao;

--
-- Name: TABLE groups; Type: COMMENT; Schema: public; Owner: daodao
--

COMMENT ON TABLE public.groups IS 'need to normalize 需要維護 熱門學習領域 ';


--
-- Name: COLUMN groups.category; Type: COMMENT; Schema: public; Owner: daodao
--

COMMENT ON COLUMN public.groups.category IS '學習領域 split(,)';


--
-- Name: COLUMN groups.area_id; Type: COMMENT; Schema: public; Owner: daodao
--

COMMENT ON COLUMN public.groups.area_id IS 'split(,)';


--
-- Name: groups_id_seq; Type: SEQUENCE; Schema: public; Owner: daodao
--

CREATE SEQUENCE public.groups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.groups_id_seq OWNER TO daodao;

--
-- Name: groups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: daodao
--

ALTER SEQUENCE public.groups_id_seq OWNED BY public.groups.id;


--
-- Name: location; Type: TABLE; Schema: public; Owner: daodao
--

CREATE TABLE public.location (
    id integer NOT NULL,
    area_id integer,
    "isTaiwan" boolean,
    region character varying(64)
);


ALTER TABLE public.location OWNER TO daodao;

--
-- Name: location_id_seq; Type: SEQUENCE; Schema: public; Owner: daodao
--

CREATE SEQUENCE public.location_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.location_id_seq OWNER TO daodao;

--
-- Name: location_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: daodao
--

ALTER SEQUENCE public.location_id_seq OWNED BY public.location.id;


--
-- Name: marathon; Type: TABLE; Schema: public; Owner: daodao
--

CREATE TABLE public.marathon (
    id integer NOT NULL,
    external_id uuid DEFAULT gen_random_uuid(),
    event_id character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    start_date date NOT NULL,
    end_date date NOT NULL,
    registration_status character varying(50),
    people_number integer,
    registration_start_date date,
    registration_end_date date,
    is_public boolean DEFAULT false,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT marathon_registration_status_check CHECK (((registration_status)::text = ANY ((ARRAY['Open'::character varying, 'Closed'::character varying, 'Pending'::character varying, 'Full'::character varying])::text[])))
);


ALTER TABLE public.marathon OWNER TO daodao;

--
-- Name: marathon_id_seq; Type: SEQUENCE; Schema: public; Owner: daodao
--

CREATE SEQUENCE public.marathon_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.marathon_id_seq OWNER TO daodao;

--
-- Name: marathon_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: daodao
--

ALTER SEQUENCE public.marathon_id_seq OWNED BY public.marathon.id;


--
-- Name: milestone; Type: TABLE; Schema: public; Owner: daodao
--

CREATE TABLE public.milestone (
    id integer NOT NULL,
    project_id integer,
    week integer,
    name character varying(255),
    description text,
    start_date date,
    end_date date,
    is_completed boolean DEFAULT false,
    is_deleted boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.milestone OWNER TO daodao;

--
-- Name: milestone_id_seq; Type: SEQUENCE; Schema: public; Owner: daodao
--

CREATE SEQUENCE public.milestone_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.milestone_id_seq OWNER TO daodao;

--
-- Name: milestone_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: daodao
--

ALTER SEQUENCE public.milestone_id_seq OWNED BY public.milestone.id;


--
-- Name: note; Type: TABLE; Schema: public; Owner: daodao
--

CREATE TABLE public.note (
    id integer NOT NULL,
    project_id integer,
    week integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    date date NOT NULL,
    img_url character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.note OWNER TO daodao;

--
-- Name: note_id_seq; Type: SEQUENCE; Schema: public; Owner: daodao
--

CREATE SEQUENCE public.note_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.note_id_seq OWNER TO daodao;

--
-- Name: note_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: daodao
--

ALTER SEQUENCE public.note_id_seq OWNED BY public.note.id;


--
-- Name: old_activities; Type: TABLE; Schema: public; Owner: daodao
--

CREATE TABLE public.old_activities (
    mongo_id text,
    "userId" text,
    title text,
    "photoURL" text,
    "photoAlt" text,
    category text,
    area text,
    "time" text,
    "partnerStyle" text,
    "partnerEducationStep" text,
    description text,
    "tagList" text,
    "isGrouping" boolean,
    "createdDate" text,
    "updatedDate" text,
    __v bigint,
    "activityCategory" text,
    content text,
    deadline text,
    "isNeedDeadline" boolean,
    motivation text,
    notice text,
    outcome text,
    participator text,
    views double precision,
    created_at timestamp without time zone,
    created_by text,
    updated_at timestamp without time zone,
    updated_by text
);


ALTER TABLE public.old_activities OWNER TO daodao;

--
-- Name: old_marathons; Type: TABLE; Schema: public; Owner: daodao
--

CREATE TABLE public.old_marathons (
    mongo_id text,
    title text,
    "eventId" text,
    "userId" text,
    description text,
    motivation text,
    content text,
    goals text,
    strategies text,
    milestones text,
    outcomes text,
    status text,
    "registrationStatus" text,
    "registrationDate" text,
    pricing text,
    "isPublic" boolean,
    "isSendEmail" boolean,
    "createdDate" text,
    "updatedDate" text,
    __v bigint,
    resources text,
    created_at timestamp without time zone,
    created_by text,
    updated_at timestamp without time zone,
    updated_by text
);


ALTER TABLE public.old_marathons OWNER TO daodao;

--
-- Name: old_resource; Type: TABLE; Schema: public; Owner: daodao
--

CREATE TABLE public.old_resource (
    "資源類型" text,
    "創建者" text,
    "縮圖" text,
    "領域名稱" text,
    "補充資源" text,
    "連結" text,
    "費用" text,
    "影片" text,
    "介紹" text,
    "標籤" text,
    "地區" text,
    "年齡層" text,
    "資源名稱" text
);


ALTER TABLE public.old_resource OWNER TO daodao;

--
-- Name: old_store; Type: TABLE; Schema: public; Owner: daodao
--

CREATE TABLE public.old_store (
    "AI 摘要" text,
    "Description" text,
    "作者" text,
    "Social Image" text,
    "Tags" text,
    "Created" text,
    "Name" text
);


ALTER TABLE public.old_store OWNER TO daodao;

--
-- Name: old_user; Type: TABLE; Schema: public; Owner: daodao
--

CREATE TABLE public.old_user (
    mongo_id text,
    "birthDay" text,
    "educationStage" text,
    email text,
    gender text,
    "googleID" text,
    name text,
    "photoURL" text,
    "interestList" text,
    "isOpenLocation" boolean,
    "isOpenProfile" boolean,
    location text,
    "roleList" text,
    "selfIntroduction" text,
    share text,
    "tagList" text,
    "wantToDoList" text,
    "createdDate" text,
    "updatedDate" text,
    __v bigint,
    "contactList" text,
    "isSubscribeEmail" boolean,
    created_at timestamp without time zone,
    created_by text,
    updated_at timestamp without time zone,
    updated_by text
);


ALTER TABLE public.old_user OWNER TO daodao;

--
-- Name: outcome; Type: TABLE; Schema: public; Owner: daodao
--

CREATE TABLE public.outcome (
    id integer NOT NULL,
    project_id integer,
    week integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    date date NOT NULL,
    img_url character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.outcome OWNER TO daodao;

--
-- Name: outcome_id_seq; Type: SEQUENCE; Schema: public; Owner: daodao
--

CREATE SEQUENCE public.outcome_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.outcome_id_seq OWNER TO daodao;

--
-- Name: outcome_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: daodao
--

ALTER SEQUENCE public.outcome_id_seq OWNED BY public.outcome.id;


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: daodao
--

CREATE TABLE public.permissions (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text
);


ALTER TABLE public.permissions OWNER TO daodao;

--
-- Name: permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: daodao
--

CREATE SEQUENCE public.permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.permissions_id_seq OWNER TO daodao;

--
-- Name: permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: daodao
--

ALTER SEQUENCE public.permissions_id_seq OWNED BY public.permissions.id;


--
-- Name: position; Type: TABLE; Schema: public; Owner: daodao
--

CREATE TABLE public."position" (
    id integer NOT NULL,
    name character varying(100) NOT NULL
);


ALTER TABLE public."position" OWNER TO daodao;

--
-- Name: position_id_seq; Type: SEQUENCE; Schema: public; Owner: daodao
--

CREATE SEQUENCE public.position_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.position_id_seq OWNER TO daodao;

--
-- Name: position_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: daodao
--

ALTER SEQUENCE public.position_id_seq OWNED BY public."position".id;


--
-- Name: project; Type: TABLE; Schema: public; Owner: daodao
--

CREATE TABLE public.project (
    id integer NOT NULL,
    external_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id integer NOT NULL,
    img_url character varying(255),
    topic character varying(255),
    description text,
    motivation public.motivation_t[],
    motivation_description text,
    goal character varying(255),
    content text,
    strategy public.strategy_t[],
    strategy_description text,
    resource_name text[],
    resource_url text[],
    outcome public.outcome_t[],
    outcome_description text,
    is_public boolean DEFAULT false,
    status character varying(50) DEFAULT 'Not Started'::character varying,
    start_date date,
    end_date date,
    "interval" integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by integer,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_by integer,
    version integer,
    CONSTRAINT project_check CHECK ((start_date < end_date)),
    CONSTRAINT project_interval_check CHECK (("interval" > 0)),
    CONSTRAINT project_status_check CHECK (((status)::text = ANY ((ARRAY['Ongoing'::character varying, 'Completed'::character varying, 'Not Started'::character varying, 'Canceled'::character varying])::text[])))
);


ALTER TABLE public.project OWNER TO daodao;

--
-- Name: project_id_seq; Type: SEQUENCE; Schema: public; Owner: daodao
--

CREATE SEQUENCE public.project_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.project_id_seq OWNER TO daodao;

--
-- Name: project_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: daodao
--

ALTER SEQUENCE public.project_id_seq OWNED BY public.project.id;


--
-- Name: project_marathon; Type: TABLE; Schema: public; Owner: daodao
--

CREATE TABLE public.project_marathon (
    id integer NOT NULL,
    project_id integer,
    marathon_id integer,
    eligibility_id integer,
    project_registration_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(50),
    feedback text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT project_marathon_status_check CHECK (((status)::text = ANY ((ARRAY['Pending'::character varying, 'Approved'::character varying, 'Rejected'::character varying])::text[])))
);


ALTER TABLE public.project_marathon OWNER TO daodao;

--
-- Name: project_marathon_id_seq; Type: SEQUENCE; Schema: public; Owner: daodao
--

CREATE SEQUENCE public.project_marathon_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.project_marathon_id_seq OWNER TO daodao;

--
-- Name: project_marathon_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: daodao
--

ALTER SEQUENCE public.project_marathon_id_seq OWNED BY public.project_marathon.id;


--
-- Name: review; Type: TABLE; Schema: public; Owner: daodao
--

CREATE TABLE public.review (
    id integer NOT NULL,
    project_id integer,
    week integer NOT NULL,
    title character varying(255) NOT NULL,
    mood public.mood_enum NOT NULL,
    mood_description text,
    stress_level integer,
    learning_review integer,
    learning_feedback text,
    adjustment_plan text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT review_learning_review_check CHECK (((learning_review >= 1) AND (learning_review <= 10))),
    CONSTRAINT review_stress_level_check CHECK (((stress_level >= 1) AND (stress_level <= 10)))
);


ALTER TABLE public.review OWNER TO daodao;

--
-- Name: review_id_seq; Type: SEQUENCE; Schema: public; Owner: daodao
--

CREATE SEQUENCE public.review_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.review_id_seq OWNER TO daodao;

--
-- Name: review_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: daodao
--

ALTER SEQUENCE public.review_id_seq OWNED BY public.review.id;


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: daodao
--

CREATE TABLE public.role_permissions (
    role_id integer NOT NULL,
    permission_id integer NOT NULL
);


ALTER TABLE public.role_permissions OWNER TO daodao;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: daodao
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text
);


ALTER TABLE public.roles OWNER TO daodao;

--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: daodao
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_seq OWNER TO daodao;

--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: daodao
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: store; Type: TABLE; Schema: public; Owner: daodao
--

CREATE TABLE public.store (
    id integer NOT NULL,
    external_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id integer,
    image_url character varying(255),
    author_list text,
    tags character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    ai_summary text,
    description text,
    content text,
    name character varying(255)
);


ALTER TABLE public.store OWNER TO daodao;

--
-- Name: store_id_seq; Type: SEQUENCE; Schema: public; Owner: daodao
--

CREATE SEQUENCE public.store_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.store_id_seq OWNER TO daodao;

--
-- Name: store_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: daodao
--

ALTER SEQUENCE public.store_id_seq OWNED BY public.store.id;


--
-- Name: subscription_plan; Type: TABLE; Schema: public; Owner: daodao
--

CREATE TABLE public.subscription_plan (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    features jsonb,
    price numeric(10,2),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.subscription_plan OWNER TO daodao;

--
-- Name: subscription_plan_id_seq; Type: SEQUENCE; Schema: public; Owner: daodao
--

CREATE SEQUENCE public.subscription_plan_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.subscription_plan_id_seq OWNER TO daodao;

--
-- Name: subscription_plan_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: daodao
--

ALTER SEQUENCE public.subscription_plan_id_seq OWNED BY public.subscription_plan.id;


--
-- Name: task; Type: TABLE; Schema: public; Owner: daodao
--

CREATE TABLE public.task (
    id integer NOT NULL,
    milestone_id integer NOT NULL,
    name character varying(255),
    description text,
    days_of_week public.day_enum[],
    is_completed boolean DEFAULT false,
    is_deleted boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.task OWNER TO daodao;

--
-- Name: task_id_seq; Type: SEQUENCE; Schema: public; Owner: daodao
--

CREATE SEQUENCE public.task_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.task_id_seq OWNER TO daodao;

--
-- Name: task_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: daodao
--

ALTER SEQUENCE public.task_id_seq OWNED BY public.task.id;


--
-- Name: user_join_group; Type: TABLE; Schema: public; Owner: daodao
--

CREATE TABLE public.user_join_group (
    id integer NOT NULL,
    user_id integer,
    group_id integer,
    group_participation_role_t public.group_participation_role_t DEFAULT 'Initiator'::public.group_participation_role_t,
    participated_at timestamp with time zone
);


ALTER TABLE public.user_join_group OWNER TO daodao;

--
-- Name: user_join_group_id_seq; Type: SEQUENCE; Schema: public; Owner: daodao
--

CREATE SEQUENCE public.user_join_group_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_join_group_id_seq OWNER TO daodao;

--
-- Name: user_join_group_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: daodao
--

ALTER SEQUENCE public.user_join_group_id_seq OWNED BY public.user_join_group.id;


--
-- Name: user_permissions; Type: TABLE; Schema: public; Owner: daodao
--

CREATE TABLE public.user_permissions (
    user_id integer NOT NULL,
    permission_id integer NOT NULL
);


ALTER TABLE public.user_permissions OWNER TO daodao;

--
-- Name: user_positions; Type: TABLE; Schema: public; Owner: daodao
--

CREATE TABLE public.user_positions (
    user_id integer NOT NULL,
    position_id integer NOT NULL
);


ALTER TABLE public.user_positions OWNER TO daodao;

--
-- Name: user_profiles; Type: TABLE; Schema: public; Owner: daodao
--

CREATE TABLE public.user_profiles (
    id integer NOT NULL,
    user_id integer,
    nickname character varying(100),
    bio text,
    skills text[],
    interests text[],
    learning_needs text[],
    contact_info jsonb,
    is_public boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_profiles OWNER TO daodao;

--
-- Name: user_profiles_id_seq; Type: SEQUENCE; Schema: public; Owner: daodao
--

CREATE SEQUENCE public.user_profiles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_profiles_id_seq OWNER TO daodao;

--
-- Name: user_profiles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: daodao
--

ALTER SEQUENCE public.user_profiles_id_seq OWNED BY public.user_profiles.id;


--
-- Name: user_project; Type: TABLE; Schema: public; Owner: daodao
--

CREATE TABLE public.user_project (
    id integer NOT NULL,
    user_external_id uuid,
    project_id integer
);


ALTER TABLE public.user_project OWNER TO daodao;

--
-- Name: user_project_id_seq; Type: SEQUENCE; Schema: public; Owner: daodao
--

CREATE SEQUENCE public.user_project_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_project_id_seq OWNER TO daodao;

--
-- Name: user_project_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: daodao
--

ALTER SEQUENCE public.user_project_id_seq OWNED BY public.user_project.id;


--
-- Name: user_subscription; Type: TABLE; Schema: public; Owner: daodao
--

CREATE TABLE public.user_subscription (
    id integer NOT NULL,
    user_id integer,
    plan_id integer,
    status public.subscription_status NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_subscription OWNER TO daodao;

--
-- Name: user_subscription_id_seq; Type: SEQUENCE; Schema: public; Owner: daodao
--

CREATE SEQUENCE public.user_subscription_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_subscription_id_seq OWNER TO daodao;

--
-- Name: user_subscription_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: daodao
--

ALTER SEQUENCE public.user_subscription_id_seq OWNED BY public.user_subscription.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: daodao
--

CREATE TABLE public.users (
    id integer NOT NULL,
    external_id uuid DEFAULT gen_random_uuid() NOT NULL,
    mongo_id text NOT NULL,
    gender public.gender_t,
    language character varying(255),
    education_stage public.education_stage_t DEFAULT 'other'::public.education_stage_t,
    tag_list text,
    contact_id integer,
    is_open_location boolean,
    location_id integer,
    nickname character varying(255),
    role_id integer NOT NULL,
    is_open_profile boolean,
    birth_date date,
    basic_info_id integer,
    "createdDate" timestamp with time zone,
    "updatedDate" timestamp with time zone,
    created_by character varying(255),
    created_at timestamp with time zone,
    updated_by character varying(255),
    updated_at timestamp with time zone
);


ALTER TABLE public.users OWNER TO daodao;

--
-- Name: TABLE users; Type: COMMENT; Schema: public; Owner: daodao
--

COMMENT ON TABLE public.users IS '可能需要維護 熱門標籤列表 到cache';


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: daodao
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO daodao;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: daodao
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: area id; Type: DEFAULT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.area ALTER COLUMN id SET DEFAULT nextval('public.area_id_seq'::regclass);


--
-- Name: basic_info id; Type: DEFAULT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.basic_info ALTER COLUMN id SET DEFAULT nextval('public.basic_info_id_seq'::regclass);


--
-- Name: contacts id; Type: DEFAULT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.contacts ALTER COLUMN id SET DEFAULT nextval('public.contacts_id_seq'::regclass);


--
-- Name: eligibility id; Type: DEFAULT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.eligibility ALTER COLUMN id SET DEFAULT nextval('public.eligibility_id_seq'::regclass);


--
-- Name: fee_plans id; Type: DEFAULT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.fee_plans ALTER COLUMN id SET DEFAULT nextval('public.fee_plans_id_seq'::regclass);


--
-- Name: groups id; Type: DEFAULT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.groups ALTER COLUMN id SET DEFAULT nextval('public.groups_id_seq'::regclass);


--
-- Name: location id; Type: DEFAULT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.location ALTER COLUMN id SET DEFAULT nextval('public.location_id_seq'::regclass);


--
-- Name: marathon id; Type: DEFAULT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.marathon ALTER COLUMN id SET DEFAULT nextval('public.marathon_id_seq'::regclass);


--
-- Name: milestone id; Type: DEFAULT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.milestone ALTER COLUMN id SET DEFAULT nextval('public.milestone_id_seq'::regclass);


--
-- Name: note id; Type: DEFAULT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.note ALTER COLUMN id SET DEFAULT nextval('public.note_id_seq'::regclass);


--
-- Name: outcome id; Type: DEFAULT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.outcome ALTER COLUMN id SET DEFAULT nextval('public.outcome_id_seq'::regclass);


--
-- Name: permissions id; Type: DEFAULT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.permissions ALTER COLUMN id SET DEFAULT nextval('public.permissions_id_seq'::regclass);


--
-- Name: position id; Type: DEFAULT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public."position" ALTER COLUMN id SET DEFAULT nextval('public.position_id_seq'::regclass);


--
-- Name: project id; Type: DEFAULT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.project ALTER COLUMN id SET DEFAULT nextval('public.project_id_seq'::regclass);


--
-- Name: project_marathon id; Type: DEFAULT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.project_marathon ALTER COLUMN id SET DEFAULT nextval('public.project_marathon_id_seq'::regclass);


--
-- Name: review id; Type: DEFAULT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.review ALTER COLUMN id SET DEFAULT nextval('public.review_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: store id; Type: DEFAULT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.store ALTER COLUMN id SET DEFAULT nextval('public.store_id_seq'::regclass);


--
-- Name: subscription_plan id; Type: DEFAULT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.subscription_plan ALTER COLUMN id SET DEFAULT nextval('public.subscription_plan_id_seq'::regclass);


--
-- Name: task id; Type: DEFAULT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.task ALTER COLUMN id SET DEFAULT nextval('public.task_id_seq'::regclass);


--
-- Name: user_join_group id; Type: DEFAULT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.user_join_group ALTER COLUMN id SET DEFAULT nextval('public.user_join_group_id_seq'::regclass);


--
-- Name: user_profiles id; Type: DEFAULT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.user_profiles ALTER COLUMN id SET DEFAULT nextval('public.user_profiles_id_seq'::regclass);


--
-- Name: user_project id; Type: DEFAULT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.user_project ALTER COLUMN id SET DEFAULT nextval('public.user_project_id_seq'::regclass);


--
-- Name: user_subscription id; Type: DEFAULT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.user_subscription ALTER COLUMN id SET DEFAULT nextval('public.user_subscription_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: area; Type: TABLE DATA; Schema: public; Owner: daodao
--

COPY public.area (id, city) FROM stdin;
1	Taipei City
2	New Taipei City
3	Yilan County
4	Other
5	Hualien County
6	Chiayi City
7	kaohsiung city
8	Taoyuan City
9	Changhua County
10	Hsinchu County
11	Yunlin County
12	Pingtung County
13	Miaoli County
14	Lianjiang County
15	Keelung City
16	Hsinchu City
\.


--
-- Data for Name: basic_info; Type: TABLE DATA; Schema: public; Owner: daodao
--

COPY public.basic_info (id, self_introduction, share_list, want_to_do_list) FROM stdin;
1	樂愛學習新事物、勇於挑戰\n\n最近在研究產品開發、商業模型、行銷策略	自主學習,網頁開發,攀岩,衝浪	{interaction,do-project}
2	以設計的身份在教育產業浮沈多年，現在正在念研究所專心當學生。	設計師職能,研究所生活	{interaction}
3	想做的事		{make-group-class,interaction,find-group}
4			{make-group-class,interaction}
5	在教育和學習產業擁有超過 10 年以上經驗，曾擔任教育顧問和成功大學國際處專案經理。熱衷於分享和推廣各種引導和學習體驗設計資源和概念。致力於創造對學習者有意義的學習體驗。喜歡了解和學習相關的知識和技能，包括心理學、行為科學和腦科學。\n\n目前是遠距工作者，在線上教學機構擔任 learning facilitator，同時也接案進行各類企業工作坊引導者。\n\nSign up bi-weekly newsletter [https://studiounfolding.kit.com/signup](https://studiounfolding.kit.com/signup)	各種學習體驗和引導的實踐方式; 烹飪	{interaction,do-project,make-group-class}
6	居住於新北市的高中生，看似興趣多元到喊出類組時像在倒數三二一，實際上是個偶爾裝成文組寫寫詩的理工阿宅。熱愛跨界連結，用科技解決社會議題，從人情看見科技需求。	資料科學,神經科學,醫學影像	{interaction}
7	擔任多年醫療公關、人文國中小及展賦行動學苑教師後，深感對民主教育之興趣，因而就讀美國民主教育大學 Goddard College 社會創新與永續研究所，並以創立島島阿學學習社群為題，以行動研究民主教育。現為 g0v 零時小學校專案經理，盼將數位公民教育素養向下扎根，同時也持續發起各項教育改革行動，目前同時為臺灣實驗教育勞動合作社及島島阿學學習社群共同發起人等。	資源連結,專案發想與執行,民主教育,數位公民教育	{interaction}
8	 	網頁前端,烹飪烘焙,徒手運動	{interaction}
9	最近在準備研究所！我們可以互相打氣（？	要不要一起考試！	{do-project}
10			{}
11			{}
12			{}
13			{}
14			{}
15	喜歡沖煮咖啡的工程師之一，最近開始投入鉤針，雖然很常鉤到眼睛和手指都很痠，但是個很適合me time放空又有成就感的活動✨ 歡迎揪團鉤針編織\n\n本職 frontend web developer 近期研究單元測試和設計模式，有興趣者可來揪讀書會分享🕺	鉤針編織,抱石初心者,前端工程	{interaction,make-group-class}
16			{interaction}
17			{}
18		日文,攝影,心理學學習交流	{interaction}
19	保持神秘		{interaction}
20			{}
21	大家好，我叫鉛筆\n目前是擔任網頁設計師，主要負責網頁視覺及切版\n希望能在這邊遇到一起組團side project的夥伴\n或是一起學習、分享經驗～\n目前正在學習JS及日文\n	網頁設計,平面設計,UIUX,自我學習	{interaction,make-group-class,do-project}
22	主要想找尋可以一起研究讓自我身心完整、社會共好方法的夥伴	台灣茶,藝術,青色組織	{interaction}
23	個人興趣最近是台灣茶、藝術欣賞以及如何更好地成為自己(自我成長)。長期有興趣的有動漫與遊戲、收藏古物與手工藝品。\n	台灣茶, FB廣告行銷(音樂領域)	{interaction}
24	哈囉！我是冠彰，大家都叫我袋鼠。\n\n「從跨出學校體制後，看見教育與生涯的多樣性與選擇性，因此展開社會設計與社會創新的旅程。」\n\n個人Blog：https://kangarooblog.addpotion.com/	教育創新,社會創新,NGO,諮商心理,社會工作	{interaction,do-project,find-group}
25	希望可以找到一起學英文或出國的好夥伴(明年寒假或暑假想去澳洲、紐西蘭)\n我平常在台北讀書，也可以一起出門攝影拍照\n現在有自己的地方創生團隊，也希望可以認識更多新的夥伴\n\n*想尋找台師大的學生一起揪團參加學校自主學習的課		{interaction,find-teacher,do-project}
26	Linkedin: https://www.linkedin.com/in/yun-tseng-3766601b0/	You'll get a great tool for personal notion plan, increase your productivity today!!	{interaction,do-project,find-teacher,make-group-class}
27			{}
28	大家好，我是豪君，很開心能夠和大家分享這幾年來我的探索與成長。我開始思考自己的想法是在建築系中。我很認同自己是一名建築人——一個透過空間思考來探討生活、連結多元領域的人。雖然我開始探索才短短三年左右，但這段時間讓我不斷嘗試突破自己，並且做出了一些關鍵的選擇。\n\n在建築學習的過程中，我並非只關注於建築本身，而是思考如何讓空間更貼近使用者的需求。雖然我曾參與過無障礙設計的專案，但我的目標並不是成為一名建築師，而是去思考如何透過空間創造出更具影響力的體驗與連結，因此最近我參與了於公東高中舉辦的實構築工作。\n\n最近，因為對於建築教育的方式(特別是常態熬夜)有些疑問以及個人健康狀態，我毅然轉系並將重心放在程式設計的學習上。我認為未來的建築不僅僅是實體空間的設計，而是應該結合數位工具，讓設計能夠更加智能化、更能貼近人的需求。雖然目前我還處於程式學習的起步階段，但我相信這將成為我未來實現理想的重要基石之一。\n\n同時，教育也是我一直非常關注的領域。我在過去，參與了遠距教育志工服務以及從事個別指導的工作，這讓我深刻體會到教育的力量。特別是在當前這個數位時代，如何讓知識傳遞變得更加靈活、更加個性化，這是我一直在思考並希望能夠投入更多心力去探索的方向。\n\n我所追求的生活，其實是一個自由而多元的狀態。我希望能夠在工作與生活之間找到平衡，並且透過設計與教育來實現這種理想生活。不論是在學習新的技能，還是與不同文化背景的人交流，這些經驗都豐富了我的視野，也讓我更清楚地知道自己想要什麼樣的未來。\n	建築賞析,參數化建築,一點點教育,圖示思考及表達	{interaction,do-project,find-student}
29		建築	{interaction,do-project,find-student}
30	從國小三年級開始個人自學，高中自學時沒有與學校合作，目前已18歲並完成學業。對自學和自學團體有一定的了解，曾參與過的團體包括：高雄小草旅人共學團、台中紅泥巴自學團、新竹粘巴達假日學校，以及台南可能非學校自學團。對新型教育懷有濃厚的興趣。	匹克球,自學,體制外教育團體,靈擺	{interaction}
31			{}
32			{}
33	非常喜歡產品的產品人，熱愛手動作 project，連結知識和實務。\n有任何想學習、累積實務經驗的歡迎聯繫我～\n更多關於我請見：https://portaly.cc/landy	軟體開發,產品規劃,職涯,Side Project 諮詢,企劃	{interaction,do-project,find-group}
34	學習	coding	{interaction,do-project,find-group,find-teacher}
35			{}
36			{}
37			{}
38	- 我是誰？  Dex的塵世哲學\n\nPython作品集引導，引領踏入大數據和AI\n歷經半導體、資料科學、軟體開發，建立程式職涯交流，提供理工職涯洞見\n\n- 我在做什麼：成為程式入門者的引路人 ; 轉職者的職涯諮詢師, 精進者的學習顧問。\n\n- 我如何協助：程式入門、轉職、作品集引導；職涯諮詢和履歷健檢諮詢 ; 學習資源分享和技術心得見解。\n\n主要文章和諮詢預約網站(努力寫文中)：\nhttps://daydreamdex.com\n\n長文FB：\nhttps://www.facebook.com/profile.php?id=61560603174482\n\nIG/Threads： @daydreamdex\n\n更多學習資源和工作經驗分享\n可訂閱 我與經驗值 <I And EXP> 電子報\nhttps://iandexp.ck.page/283146f2d3\n訂閱即可獲得NVIDIA AI 學習資源	程式教學 職涯探索 職涯諮詢 學習體驗 學習精進	{interaction,find-student,make-group-class,do-project,find-group,find-teacher}
39			{}
40	你好，我是Chao，我的工作專注在設計，研究及物件上，使用物件跟設計來研究使用者的行為及洞察。\n之前是一名PM及UX設計師，目前全心投入做設計研究及使用者研究。\n\n	設計研究＆研究	{interaction,find-student}
41			{}
42			{}
43	孩子正要申請自學		{interaction,find-student,find-teacher,make-group-class,do-project}
44			{}
45			{}
46			{}
47	111111	網頁設計，使用者介面設計	{interaction,do-project}
48			{interaction}
49			{interaction,do-project}
50	白天在教育平台擔任課程體驗設計師，與夥伴共創個人化學習的內容與環境。\n下班後經營學習玩家教育創作室，寫寫教育專欄，\n我的教育理想型：讓孩子主導學習、探索未知與尋找喜樂\n熱愛學習體驗設計、塗鴉筆記與教育AI應用，\n偶爾探險、演講、帶工作坊，廣結善緣😆，\n沒事就喝杯咖啡，享受一個人的圖文創作\n玩，就是最好的學習體驗	自主學習策略,塗鴉筆記與視覺引導,差異化教學設計,生成式 AI 教學應用,AI 知識圖文創作,AI 與視覺圖像簡報術,AI 繪本創作,AI 輔助自主學習	{interaction,find-student,make-group-class}
51		課後共學團,自我對話,引導,手作（刺繡,火漆章,貼紙）,閱讀	{interaction,make-group-class,find-student}
52			{find-teacher,find-student,make-group-class,interaction}
53			{}
54			{}
55			{}
56			{}
57			{}
58		自主學習,學習輔導,音樂	{interaction,find-student}
59	嗨大家好! 很高興知道這個地方，希望能找到夥伴一起學習!	閱讀；自主學習	{do-project,interaction,find-group}
60	陳映竹同時擁有臺師大國際漢學研究所文學碩士，以及臺北市立大學運動健康科學系理學碩士。目前為臺師大體育與運動科學博士候選人。並且擁有美國運動醫學會臨床運動生理師以及私人教練認證！希冀透過平台持續推廣運動與健康科學相關知識，以及肌力與體能相關訓練理論及實務，並提供個人跨領域與教練自我成長歷程，讓有志從事教練產業以及斜槓工作者有所依循。\n\n🟨 自媒體經營：以「我是運科竹」為關鍵字搜尋！\n▌Youtube: https://www.youtube.com/@yesimsportscientist8642/about\n▌Instagram : https://www.instagram.com/coachsteveperformance/\n▌Facebook : https://www.facebook.com/SteveLovesWorkout/\nPodcast 頻道 : Sound on, Apple Podcast, 以及 Google Podcast，均為「我是運科竹」。	體育與運動科學：健康科學,重量訓練	{interaction,do-project,make-group-class}
61	大學犯罪防治學系四年級生，目前正準備研究所甄試\n喜歡閱讀、二次元相關事務！\n正努力自學日文和程式語言		{interaction,find-teacher,find-group,do-project}
62			{}
63			{}
64			{}
65	原是在社工界漂浮的一抹靈魂，現在想掙扎跟昇華去其他世界看看，也希望能讓這抹靈魂發展不同的樣貌。	社會工作,青少年陪伴,心理輔導,教育遊戲設計,世代差異的觀察	{interaction,find-group,make-group-class,do-project}
66	我想尋找一起努力、學習的夥伴，也可以彼此監督、交流，認識各個領域和各種經歷～\n線上的夥伴也很歡迎～		{interaction,do-project,find-student,find-teacher}
67			{}
68			{interaction,do-project,make-group-class,find-group}
69		網路工程,學英語	{}
70	fffffffff	gghhj	{interaction,make-group-class}
71	我的MBTI是EEEE，我很外相	畫畫,吉他	{interaction}
72	大家好！		{make-group-class,find-student,find-teacher}
73	我		{interaction}
74			{find-student}
75			{}
76			{}
77			{interaction}
78			{interaction,find-group}
79			{interaction}
80		學習語言	{interaction,find-teacher,find-group}
81	測試\n	111	{interaction,do-project}
82	我是潔伃（Joann），一位致力於教育創新的研究者、實踐者與催化者，專注於建構民主且包容的學習生態系統。我深信教育應該成為促進社會公平與變革的力量。\n\n過去我曾是自學生，透過特殊選才進入不分系後肄業，後以同等學力申請並完成多元文化教育碩士學位。十多年來，我在國際非營利組織、學術機構及社會企業中積累了豐富的實務經驗，也擔任多個縣市的實驗教育審議委員。\n\n我創辦了「魚水教育催化劑」並共同創立了「鯨落教育聯盟」，希望打造一個兼具在地特色與國際視野的教育智庫和行動平台。目前，我專注於國際教育研究與內容策展，期望推動更具影響力的教育實踐。	教育創新,民主教育,國際教育趨勢	{interaction}
83	想認識一起戶外運動的朋友。	網球,單車,爬山,潛水	{interaction,find-group}
84	來自新竹的自學生，喜歡acgn相關的東西。	算是蠻擅長繪畫的？	{interaction}
85	自學生. 	應該還算擅長思考	{interaction}
86	16歲高中自學生	料理	{interaction,find-group,find-student}
87	自學生，偶爾寫寫腳本\n物理和航太工程愛好者		{interaction}
88	あ	1	{interaction}
89	17歲高中生	料理	{interaction}
90	遊戲宅\n遊戲最近常玩MH		{interaction}
91	華德福高中生，休學中	藝術,閱讀	{interaction,do-project,find-group,find-teacher}
92	哈囉~\n我是個17歲台南高三自學生，是暖暖蛇青少年共學團高中部成員，也是台南市第七屆兒少代表\n加入這個社群是想認識更多夥伴與學習資源，歡迎認識～	音樂 藝術 社會參與 自主學習	{interaction,find-group,find-teacher,find-student}
94	目前是學生		{interaction,find-group}
95	\N		{}
97	大家好\n我是Judy\n希望找到能練習英文口說的夥伴		{interaction}
98	\N		{}
99	一個平平無奇的高中自學生	理工我都愛	{interaction,do-project,make-group-class}
100	暖暖蛇青少年共學團的高一生，超喜歡跳舞，對舞蹈有興趣的可以交流交流	Kpop舞蹈,HipHop舞蹈,韓文,自主學習	{interaction,make-group-class}
101	嗨，我是 鳥巢，一位自學成長的教育工作者，兼具思想家的視角、民主教育的實踐者以及社會改革的推動者。此外，我還是一名半自造者（Maker），熱衷於動手實踐與創造。\n\n* 教學經驗：\n  * 有開過的課程：數學、桌遊、民主、生活課（**情緒課、政治課、談判課）**、程式設計（Scratch、python）、科學、可編程電路板（樹莓派、Arduino、micro:bit）、兒童陪伴、小旅行、歷史課、學科課程。\n  * 曾協助厭惡數學的學生轉變為熱愛學習者，擅長激發學生的學習動機與自主學習能力。\n* 專業背景：\n  * 第一屆 實驗教育工作者培力計畫 實習於全人中學，參與民主教育工作坊。\n  * 擔任 實驗教育勞動合作社理事，致力於體制外教育的推動。\n  * 深入理解數學教育與科學教育的本質，將理性與創造力融入教學。\n* 樂於實作與創造：\n  * 自學 Python 與 Arduino，涉足 Maker 領域，樂於解決問題並動手製作。\n  * 善於將解決問題的過程延伸至實際操作，享受修理與創造的樂趣。\n* 熱愛心理學與哲學：\n  * 喜愛哲學，生活目標是「愛智」。\n  * 擁有一定的心理輔導與諮商經驗，善於傾聽與分析問題。\n\n教學理念\n\n* 人本教育： 相信每個人都應被「好好對待」，教育應以人為核心，尊重其主體性。\n* 民主教育： 推動學習者與教育者共同協作，創造自由探索的學習環境。\n* 遊戲化學習： 通過桌遊、數學遊戲等方式，讓學習變得有趣且富有探索性。\n* 問題導向學習： 善於從學習者的困惑與問題出發，引導深度學習與批判性思考。\n\n教學地點與未來計劃\n\n* 於 2023 年 6 月回到台中定居，目前積極籌備與推動一所「好好對待人」的學校。\n* 希望結合數理科學與民主教育的理念，營造更多元的學習模式，幫助學生從中探索世界與自我。\n* 正在執行的計畫：[**<u>教育合作合作家庭計劃 </u>**](https://docs.google.com/document/d/1cf_GdFTtxWT7XpJYzem8196x32z9uPPE8awFCpZjMZ8/edit)\n\n更多資訊歡迎參考 <u>粉絲專頁：</u>[<u>鳥巢老師的無權威教室</u>](https://www.facebook.com/profile.php?id=100063695272307)	民主教育,議事規則,開會效率,數理科學,程式,遊戲	{interaction,do-project,make-group-class,find-group,find-teacher,find-student}
102	\N		{}
103	\N		{}
104	\N		{}
105	07'｜TW｜UK\nchin&eng		{interaction,make-group-class,do-project,find-group}
106	嗨，我是季兒，是位剛從體制內切換到體制外的17歲高中生。\n原本日常興趣主要是關注社會議題，並探究其議題裡的內容，\n我是個對於事情的表面或現象會好奇，並想更加深瞭解"如何形成"的人。\n(通常學習動機也是來自這原因)\n這讓我知道的東西還算豐富，但就是不太精。\n\n近期因為政治和太關注外界(新聞、社會議題)心太動盪，\n所以我最近比較常在音樂創作、藝術、攝影這部分領域努力，\n也是因為剛自學，才有這樣的時間可以用在這些領域上。\n\n最近也打算多讀點書，有足夠的知識在議題上努力，才會有用。	我擅長思考,論述，可以分享…興趣以內的事情我可以分享資源！	{interaction,find-teacher,make-group-class,find-group,do-project}
107	\N		{}
108	\N		{}
109	\N		{}
110	劇場、覺察幫我開了天眼&#x20;\n靜靜的、細細的、清晰的&#x20;\n發現無數美好&#x20;\n並用身體相信\n\n* **信仰**　：劇場、非暴力溝通、接觸即興、黑人音樂、教育\n* **正在學**：劇場、接觸即興\n* **有興趣**：社會學、性別、文學、創作、職涯、社群、生產力工具、設計	街舞,劇場遊戲,接觸即興,黑人音樂	{interaction,find-group}
111	我是Henry，現在於美國西北大學就讀學習科學系(Learning Sciences)大三。\n\n我從高中開始投入校內外營隊辦理、團隊培訓、學生權利發聲、家教、升學輔導，覺得和學生一起共創學習體驗是我的成就感來源。\n\n目前持續摸索，如何將學術產出的理論，融合進以學生為本的學習體驗之中，設計出符合學習需求的產品。\n\n最近想要:\n學習... 量化數據分析技巧、學習體驗設計(Learning experience design)\n探索... 我對於哪個教育主題較有興趣，正在涉略的有: 團隊合作及溝通的訓練、遊戲化和動機培養\n\n我喜歡交流討論學習是如何發生的，喜歡教育新創的環境，也正在探索學術研究，以決定未來是否攻讀博士。	心理學,學習科學,營隊設計,美國留學,UX	{interaction,do-project,find-group}
113	\N		{}
114	\N		{}
115	想一起拍微電影		{interaction,do-project,make-group-class,find-group,find-teacher}
116	待補		{interaction}
117	\N		{}
118	一位喜愛思考的人，觀注各種議題，透過自學重新學習如何學習，並重新認識自己。	自己對「如何學習」的看法	{interaction,find-teacher}
119	哈嘍！我是目前大三的學生		{do-project,find-group,find-student,make-group-class,interaction}
120	 		{interaction}
121	  		{interaction,do-project,make-group-class,find-student,find-teacher}
122	\N		{}
123	\N		{}
124	我是自學生，大家可以來和我交流，在學習程式		{interaction,do-project,find-teacher}
125	哈囉！我是喜歡吃卡拉雞腿堡的卡拉！\n平常很害羞，喜歡躲在床上冬眠跟潛伏在劇場和串流平台觀賞戲劇作品。\n希望可以透過這個平台探索平常沒有勇氣（或純粹懶惰）去做但有興趣投入嘗試的學習活動。		{interaction,make-group-class,find-group}
127	\N		{}
128	\N		{}
129	我是來自臺北市數位實驗高中的Joey，我平常關注社會議題，喜歡透過科技工具解決問題！		{interaction}
131	想學習產品設計相關知識		{interaction,make-group-class,find-group,find-teacher,do-project}
132	\N		{}
133	是一個喜歡嘗試、享受突破自己的高二生～	擅長編輯和排版（最愛canva)	{interaction,do-project,make-group-class}
134	喜歡畫畫的一名人類	電繪,二次元	{interaction,make-group-class,find-group}
135	\N		{}
136	哈囉，大家好，我是智謙，可以跟我一起交流程式設計，是展賦教育的學生，在展賦當程式設計社的社長	程式設計	{interaction,make-group-class,find-student,find-teacher,do-project,find-group}
137	嗨，我是耘嘉，暱稱是水果乾。是高三自學生，還因為去年特選沒上可能會延長高中生保鮮期限（？）\n\n生活的被動技能是觀察周遭的環境和人際互動，喜歡跟人聊天交流，歡迎拍打	這幾年累積的自學故事,自我覺察。還有......平常散步亂晃觀察到的街道細節	{interaction,do-project}
138	哈囉你好！我是來自TH159星球的冒險家，不小心降落在地球上，不知道我們會有什麼故事呢？！	我想分享我的寫作並找到夥伴	{interaction,make-group-class}
139	希望可以與大家一同交流，不管在教學上、生活上，一起共學。	歷史,課程設計,策展,數位教學	{interaction,find-student,make-group-class}
140	我是個愛旅遊,喜歡背著相機到處攝影的馬祖青年，長期在教育上深耕，喜歡服務、最大願望是能在孩子身邊當一個保有初衷的大人！	攝影,兒童正音教學,補教經驗,	{do-project,find-student,interaction}
141	目前正在一間智慧醫療新創公司擔任海外業務，深知自己的各種不足，因此在同事的推薦下跑來島島學習！希望能堅持下去 (ง๑ •̀_•́)ง		{interaction}
142	目前就讀中央大學財金系二年級\n\n平常喜歡看書、電影、籃球和聽音樂\n\n正在進行寫作的自主學習計畫\n\n有興趣參加商業競賽活動，有缺人可以找我～	閱讀,投資,寫作,電影,音樂,運動健身	{interaction,find-group,do-project}
143	大家好，我是小熊，來自台中。\n我是前端工程師，擅長製作網站與app。\n我喜歡打鼓、毛線編織、跑步、打羽球、閱讀、聽音樂。\n很開心來到這裡認識大家，一起交流學習。	程式學習,心理學	{interaction,do-project,find-group,find-teacher}
144	我是綮萱！我是一個蠻慢熟的人，一開始可能看我比較不敢出聲或是內向不講話覺得不好意思，但是熟悉之後，會漸漸開放和活潑起來！\n\n想來這希望可以和大家互相學習交流分享，因為自己的視野還不夠大，對於自己想發展的還不夠全面的了解，所以想要從馬拉松計畫獲得相關資源，以及學習交流互動，讓自己看到或得到更多事物。	打擊樂 聊天 傾聽 cosplay 觀察細節	{interaction}
145	黃若寧，Bonnie，也可以叫我酪梨、酪梨喵\n\n目前是高中生的循環經濟公關組長、文案組員，台灣財經素養教育推廣協會第二屆的校園大使，e-Peer第四屆校園大使，雛翼服務團的公關。\n\n喜歡唱歌、與他人交流，更喜歡往大自然跑，登山、潛水都是愛好之一。	我擅長資源整合，與他人分享優質事務	{do-project,make-group-class,interaction,find-group,find-teacher}
146	對生物學有興趣的高中生，希望透過此網站來精進自己對於此學科方面的知識		{interaction,do-project}
147	遙遠的高中牲	擅長交流社交,言語表達,抗壓性強,較為細心	{interaction,find-teacher}
148	我是一心書苑蒙特梭利實驗教育團體的主持人，我想尋找願意陪伴孩子成長的夥伴。		{find-teacher}
149	民安國小老師\n教過\n生活科技\n台語\n現在在教\n社會科學	圍棋 國小社會科課程 古文	{interaction}
150	hi		{do-project,interaction,find-group}
151	顧婕，\n2000年出生，現居新北。\n熱衷教育、社會創新、藝術文化、導覽、語言學習。\n具有豐富導覽經驗，2022、2023、2024均獲選為【台灣當代實驗場】年度大展之導覽員。\n熱愛外語學習，英語多益測驗910分、德語歌德檢定B1通過。	德文	{interaction,find-group,do-project}
152	\N		{}
154	\N		{}
155	哈嘍大家好我是Emily,對生活有點敏感卻又有時神經很大條，我喜歡文字、藝術等等美的事物，碰到企劃事情時也會覺得雀躍	我擅長企劃,文字表達	{interaction,do-project,find-student,find-teacher}
156	各位大家好，我是吳宥芝，也可以叫我無名小子，我目前就讀於屏東大學社會發展學系大三\n\n個性上來說，雖然比較內向慢熟，不過一旦混熟以後就會發現我私下搞怪的一面，因為我很喜歡跟朋友們分享我腦海中天馬行空又很無里頭的想法，對我來說，分享這些與眾不同的想法讓我體會到許多樂趣\n\n喜歡的興趣是打球、健身、閱讀、看電影、聽饒舌樂、講幹話\n\n平時有空會多關注時事議題，但希望除了關注之外能有機會付出行動做點改變，歡迎任何對社會科學領域有興趣的朋友來跟我互相交流想法	社會科學,閱讀,自主學習,時間與目標管理,運動	{interaction,do-project}
\.


--
-- Data for Name: contacts; Type: TABLE DATA; Schema: public; Owner: daodao
--

COPY public.contacts (id, google_id, photo_url, is_subscribe_email, email, ig, discord, line, fb) FROM stdin;
1	116460800145010043027	https://lh3.googleusercontent.com/a/ACg8ocJ3YjTVznTRc8401zw3ta7c3QaZYb5lDy3497cbCmZYM79s3LoZ=s96-c	t	innocent0705@gmail.com	1111111			
2	110593879788627172728	https://lh3.googleusercontent.com/a/ACg8ocJGaoxoDZS6TbInSy4EpMX7uEgPll82wz1ChP89yFwAXceB-Gb3kw=s96-c	f	viesty2004@gmail.com	enntang	enntang		
3	115613797333849607870	https://lh3.googleusercontent.com/a/ACg8ocJhGZDZrJByhb-bE1QOyr4Ukhf4V6JDo6vz9JFbUqD2kLoz9P4=s96-c	f	sarki5566@gmail.com	404	Discord	Line	Facebook
4	106045246498366364972	https://lh3.googleusercontent.com/a/ACg8ocKm7qI50FmXT0AmQvsvFHJfoJG62bZFg7rGHH3VWkwb-A7-J526Hw=s96-c	f	shps30625@gmail.com				
5	117414229572967353388	https://lh3.googleusercontent.com/a/ACg8ocKtvjI71v62TnV5ncc3VCW0OZecCZvpRXQVg9a9utW6q_u7-N99xA=s96-c	t	peichun1213@gmail.com	unfoldingwithpeg	peggyhsieh		
6	102939242972082494682	https://lh3.googleusercontent.com/a/ACg8ocJepWvlGccWxGgiGMyC-8UrBjUQJQRLWut6o26mmI6h1P8qCCbD=s96-c	f	ted.lu.tw@gmail.com	ted.lu.tw	ted_lu		ted.lu.tw
7	103741605214429843321	https://lh3.googleusercontent.com/a/ACg8ocKjxB31uVIR2VE0cZM_g9bQD1ji0m_zmJzizP6ZhJV6bVTsId8h=s96-c	t	ohtiffanylin@gmail.com		_tifflin		tiff.lin.1
8	107585885265309132064	https://lh3.googleusercontent.com/a/ACg8ocIavZAE9vsHOxqr06YWL8x5ezrETlWAYjk24R-n9IHUymocRw5Z=s96-c	t	tutelary.maomao@gmail.com	maomao.owo			
9	103166003214580784729	https://lh3.googleusercontent.com/a/ACg8ocJPmckt3APK1rh8v4agmZN4hawoND3aX5pvNowXt0Wmw3u7MPU=s96-c	f	whalekiller03@gmail.com	hsu1fang			
10	117302500270287555438	https://lh3.googleusercontent.com/a/ACg8ocIoM43lkaURInnyqvWsm-tIbamN8_mxRDn7O8sC35B8QqZsHw=s96-c	f	evonne.hsu@kenkone.com				
11	104108174819028372098	https://lh3.googleusercontent.com/a/ACg8ocIXsqFgybdGN7WXvNHq16MoA8xGHyotzzs3J3jYxJtW06UsJQ=s96-c	f	hsuifang080318@gmail.com				
12	106865714772182843479	https://lh3.googleusercontent.com/a/ACg8ocL7lgS5TyOjXTWV2kLewq3ME0JPKIYpNLwQ7dJ3V6bN7nLSVQ=s96-c	f	109209006@g.nccu.edu.tw				
13	111580305171273404226	https://lh3.googleusercontent.com/a/ACg8ocJIC6B8Jp8CFpK1_iDXXC-Ccm-knHYK2JxPNfTFqyhILD74XE7n1A=s96-c	f	yanjoyliao@gmail.com				
14	105828993510017407586	https://lh3.googleusercontent.com/a/ACg8ocKa05EE5R1lsA9BsB8Io3oeFx_B9GYMZxvgF_GQ8YdYW-a-I63s=s96-c	f	treeyaya0830@gmail.com				
15	113416515446223593160	https://lh3.googleusercontent.com/a/ACg8ocLJztq3PmyXgwliOsxKKuHPK3yj2qHzj23Z6NN0YfgaQrO_Ide7uA=s96-c	f	venus841113@gmail.com				
16	115945645998035796372	https://lh3.googleusercontent.com/a/ACg8ocIkn8q2fo10hbRENL2QT3RwjSs1BEgu_EeipxNkOiRFpBEKXw=s96-c	f	jamichanging@gmail.com				
17	117761585937487254196	https://lh3.googleusercontent.com/a/ACg8ocI2RaV0OQjmC-AEShnBmCwye6ASLqoWubWTPDL2MnDGO7-q6w=s96-c	f	coachsunshinelee@gmail.com				
18	105022760545625194022	https://lh3.googleusercontent.com/a/ACg8ocKc5HGY5_Jm9i_KVcsKl2oLMDnDr5aYCNqohRgTxh-xLoGynTuS=s96-c	t	tingyulin505@gmail.com	cucyapl			
19	112947162240305215757	https://lh3.googleusercontent.com/a/ACg8ocK7NnqvhdhcGrdn2NOlYusE3yAs2NVXNx1s5EgU79t7xN_Cyw=s96-c	t	a920604a@gmail.com	unknown			
20	101950914980029840240	https://lh3.googleusercontent.com/a/ACg8ocJ0p58ayr2JLKQxMZ1qpeLm_rb--GQy8Gy4paS7L_052OYfIsp1=s96-c	t	enn.enya@gmail.com				
21	102781042525814613075	https://lh3.googleusercontent.com/a/ACg8ocLB446TKmLWROJVaBJFqGhxseDT0RXY-T6gV4rFRRoO7SzISOkvTQ=s96-c	t	yuyu.hunter@gmail.com	yuyuhunter	yuyuhunter_0509		
22	106230940249702575151	https://lh3.googleusercontent.com/a/ACg8ocKjcXWe38UN6Ldv44QN8aGTWP9vtXkoWV8ZVyYb-lVeQ2e-uUg=s96-c	f	clbct7969@gmail.com		clbct		
23	105191538976493847415	https://lh3.googleusercontent.com/a/ACg8ocLMp6akIvPMLihYCjkM46vpKmo7pIANxnx-jQm_NbAxZ5Acmg=s96-c	t	shiuanmi@gmail.com	shiuan_mi			shiuanmii
24	104138156771887484589	https://lh3.googleusercontent.com/a/ACg8ocJrssx7X8lgyHpvI6Vin4YHa9Ja6UELj6Z-7YpMWciFrd1UeCc9=s96-c	t	lovekangaroo0126@gmail.com	kangaroo_265		710121478	
25	102484545249871983674	https://lh3.googleusercontent.com/a/ACg8ocLt6Lnv1qD6irJoAguVVNY6jP52uLbs16Q3Pl-Wn6JTgSB1O2Y=s96-c	t	gsensei1211@gmail.com	jerry___0702			
26	108174741255318871105	https://lh3.googleusercontent.com/a/ACg8ocLD6rOTPYmfPwDBk_Wl9M4LXmH7yGqKeDAfgZTA6H5hgLl-yKvA=s96-c	f	iamsherry000@gmail.com		sherry0307		
27	108110530501714327901	https://lh3.googleusercontent.com/a/ACg8ocJzXD4VHYnLv3LOvd7honrjkwgfCVJUcBQa8EoQyP1AFl5zD2oa=s96-c	f	yizhenchen06@gmail.com				
28	107655172857409189862	https://lh3.googleusercontent.com/a/ACg8ocIN3V5wS1roQcgUQlIWZmC6g1A9Ra8ewRycqf0ccE1yKA-9OPE=s96-c	t	jamesaubin0106@gmail.com	aubin_archicode	itsme.aubin		
29	110505292797643337244	https://lh3.googleusercontent.com/a/ACg8ocL1Q6pWnSSF0EOlUtijCg5FrZ6adTYYTFo82QvIOksjQ3GQY4M=s96-c	t	jamesaubinnews@gmail.com	aubin_archicode			
30	105250845518810169654	https://lh3.googleusercontent.com/a/ACg8ocIR3TEidMFGVrwvJvcxAP7wei9mNyTOKpAULdBvtX5x6godtw=s96-c	t	turf941013@gmail.com		turf111	turf941013	TurfLiang 
31	107542774546665414322	https://lh3.googleusercontent.com/a/ACg8ocIaJZW2bJNg4rJkUtd_v9U4gS_WvSX4GO04BVXQE97SzO64bMbJ=s96-c	f	polarbearjudy@gmail.com				
32	116172708079108393135	https://lh3.googleusercontent.com/a/ACg8ocJHQwRGwVV4JrfprDc2hj5UuluuJAV6lNZKePSxXDapffXdTKs=s96-c	f	polarbearjudy@gmail.com				
33	115852624990501181450	https://lh3.googleusercontent.com/a/ACg8ocJJHzZTADZBpzQ0pXqL89AhWVukFz3bsmTng-AEnG0ndZIT9dEwXw=s96-c	t	fish04123@gmail.com	nienting.landy	landy5		
34	109177383468075295482	https://lh3.googleusercontent.com/a/ACg8ocIbCF6mxmKXeIIGS-MCIv6umwTNbtMKSJCvWh4lvIgIDCyOCuwL=s96-c	t	ruby10127130@gmail.com	ruby			
35	113088033111308075917	https://lh3.googleusercontent.com/a/ACg8ocI7_zPn0FladQguixwu5_7fOslpmchFrJqcCw_ioMssIT3ZZw=s96-c	f	codingnien@gmail.com				
36	105821837388193887762	https://lh3.googleusercontent.com/a/ACg8ocLNfW4eTpBxCThXM4RlFTIyu7uicgv7xBMC1iX-pHs8Kb4mBwtl=s96-c	t	qwesdf3691@gmail.com				
37	117592731265422673015	https://lh3.googleusercontent.com/a/ACg8ocK31oDBtvOS8IOHm88P37lAXsZa8WdAFSWGdDdPpwOKapr4EF7v=s96-c	t	jamescj20022@gmail.com				
38	111954851686336157884	https://lh3.googleusercontent.com/a/ACg8ocJHJeopJ9fInAVR7PP37tVLbNjEc4Z2QXDWRBg66W0OCqwvJDmV=s96-c	t	lu791019@gmail.com	daydreamdex	k77251	k77251	61560603174482
39	106524654721881441047	https://lh3.googleusercontent.com/a/ACg8ocIe-Rm-8OQMylxVWj32Ypw9d-PzHpiPJkQuyGdl3-r26DiUeNk0=s96-c	f	horsekit1982@gmail.com				
40	104363604777194370053	https://lh3.googleusercontent.com/a/ACg8ocJ-mT6xXL0yb1MwF_6zcV6ngtSZsTzX1gK47ctRooTWrGQq_A=s96-c	f	chao.ling.chyou@gmail.com		judychyou		
41	108389257070764907031	https://lh3.googleusercontent.com/a/ACg8ocI3ZNuahp9BgVX4uiLSwJ-Saf2zLsc8eE76jEQVe5Epqy2H-Xat=s96-c	t	starizumi@gmail.com				
42	100032917059318669397	https://lh3.googleusercontent.com/a/ACg8ocId9Rl5Iv7Ji_bJVILgV7EzQini4J2DdY48A3GfQIBHpN6Xag=s96-c	t	peggy.hsieh@goodera.com				
43	102192668245197858202	https://lh3.googleusercontent.com/a/ACg8ocIjIH-lLlNqMOxcjuSQaHFJ-5YPjA7w-l-v2cxApD5aQTP8p6SpYg=s96-c	t	leader3029@gmail.com			chiu3029	
44	110014884748935962242	https://lh3.googleusercontent.com/a/ACg8ocKILzGnr7yx-isPwWxSoR1IY3eKjp7uw7tFUMHYXXgB91tqtQrm3g=s96-c	t	sheep920724@gmail.com	sheep920724	sheep920724		
45	108926107515629804849	https://lh3.googleusercontent.com/a/ACg8ocIVoQwkW-SysWEvt5V9IxpmdRnMDCnlLXb5uykqpCbUnZk2f-x9=s96-c	f	9640333@gmail.com				
46	115921550452673510012	https://lh3.googleusercontent.com/a/ACg8ocKlOgr9O6T-1EYqxy_HhzDRGGI7eeYUiUINSycdH2mS94S32kCB=s96-c	f	a0920968678@gmail.com				
47	111392336911936076041	https://lh3.googleusercontent.com/a/ACg8ocLwhSRE_lb_kq1SgIHXC4FL-oNtnvrdMeow56SYI27bU38xJc8=s96-c	t	tseng4w@gmail.com			1111111	
48	106283758313070745529	https://lh3.googleusercontent.com/a/ACg8ocL1PHeYLaxFQ5UQMUhv7EyfKajbX9jjWu31XBB9oXz8NbLizAY7=s96-c	t	lionheng728@gmail.com				
49	104676009777933471206	https://lh3.googleusercontent.com/a/ACg8ocKuatjl8lFeY2JxxcFmY2arFYDfiZH9MgVWxsFZcD8gSSncskt7=s96-c	t	xx0932399@gmail.com	dada._.878	dada878		
50	118151930797791178355	https://lh3.googleusercontent.com/a/ACg8ocJ9gWhekPYRn-6UvpMeptPqE1YwibWeC0oR207ByTsZg2K5z5LGMA=s96-c	t	cpeter1010@gmail.com	learn4c		smallchuang	learn4c
51	111385062902422694956	https://lh3.googleusercontent.com/a/ACg8ocL5o3RnSrUSCTZ4Mtebk7vNpNdwSeYaJ0NAxRwZm3LjMDc6_KAZPA=s96-c	t	amigosun2@gmail.com		amigo8073		amigo723
52	103783597993084735659	https://lh3.googleusercontent.com/a/ACg8ocIsGN0GHrcP03mfELNpF3as0n9KkCRQmLzwebGjq7SdOMo-sHwi=s96-c	t	kenle0423@gmail.com				
53	106436218113071854742	https://lh3.googleusercontent.com/a/ACg8ocKmAXneUqqf2Z63qturhupVcprlkrsCmuPCkHQggAbf-GCaaA=s96-c	t	cora790712@gmail.com				
54	113089661204090375561	https://lh3.googleusercontent.com/a/ACg8ocLV5HNAYNUZxgd6xhhXrxYF8dNh0Q30_ImqDjkT-rdPYpcJfq4=s96-c	t	gexiucheng3@gmail.com				
55	114040539634850553567	https://lh3.googleusercontent.com/a/ACg8ocJImLduXYmaSCX8umspV9gbCV9YQVhEd34hBBp3iEazFVH0vg=s96-c	t	gexiucheng01@gmail.com				
56	100528472356293522972	https://lh3.googleusercontent.com/a/ACg8ocIM_bfIiZ_Eri-QzlAoQy7DSvK7oj4iIEvJIrJLWj38P4yRsg=s96-c	f	triot059@gmail.com				
57	105790663201294586725	https://lh3.googleusercontent.com/a/ACg8ocK9tfhiLJzaXjdG6leF45HfOroaXbaw0b1G-JHlXDN_PltqcU8=s96-c	t	eira@ewebs.com.tw				
58	107183222292244435352	https://lh3.googleusercontent.com/a/ACg8ocLDQFJqlUwlIjnjUhG9gMlq84FYCWcIf7dBfgpBvS-UEAOSYQ=s96-c	t	tingyun1121@gmail.com				
59	114002781195670371385	https://lh3.googleusercontent.com/a/ACg8ocJ41rhAZxx6M21HmsM-8KbKLH5mqJfwc9bB6MWg5ZDHPyem_wvquQ=s96-c	t	hsiflow@gmail.com	_______	langyc	hsiflow	_______
60	107103569652618927179	https://lh3.googleusercontent.com/a/ACg8ocIcjL3mL9L2QcyXH3NxtnqnVU6u4dgESCkwhhlRMdbMIsBtMllR=s96-c	f	isame4@gmail.com	stevelovesworkout			SteveLovesWorkout
61	104483925457363444429	https://lh3.googleusercontent.com/a/ACg8ocJm0Jut6HcbGQVVzGb46tRIEtg6jYj5JZP_40bQpZZB3OY3qPBr6A=s96-c	t	skyfeng2002@gmail.com		mapleleafowo	kuwu1115	
62	100041685022967845774	https://lh3.googleusercontent.com/a-/ALV-UjUCPpI5_6prQ9ToC9ZL04z7NQmPTdA4HjlPAQUsO3ehKWVSPEadolzXbyFPw6pLjWPGQzD03w4hUTVVj1VvNwuLBmmVZ_kS1VRipHdeOSupe2WFQA77gYWPwZUiCFdWxAWhLmVjEQR0dfTFQw9fKzTL8jMRY-fvW17pYYyskgHjpbLVEFLNbTpITE8XYSFXfoVJyHkcUJsGFz3abqelDwZS0MMQVACsQiS9AmR1BrBc1pDEfR-jRWa5DOuDZg2RzBVsWeF0ZP2QBP6Nmeb78LzuB3R6KTW_cqJrmnZ5ohfIg9jdbiFvMHlezwXKz723VpiwybdgcRMIXln3_2h6Iqtav343q39iuYPwbHhREwyiMKPh_dzEKokTZoiPCMP8nAekWJ5o_u7WBD1xVh-n6i0fnYJ2o_5sX8_4v0QaddVcH10_xhcTbtHd5RKTOg6H11WI_3VQplxhCzmhsfIqBMx1R8TYeUTqPz8d3KAxXalWhBToLnTdvBPV2BJ830q_FxZm-fU1dSjqsq_v7zGEaZ2GsZgW_XCeO2DGXrhtgj22z0ZZfG9KPE0csKqgk2N9ZAt__qOwLzQFIq4pmiVH_4CeXs4Fd1TBYpqmwd1RCGHDqruz6aoLJzHaiQYxhkNQvbasc4Qev088UGICNwlRx3giFbxGpjCkaGhPN-A-XrsrsdMKeVwdscSC6sPdz4GVJiK2VnSepMaummwCR27ewIKNVlT8D2SIoiolmmHODkiHGPB0e2C8B4Nmfa8ABNbYq8WGnMStxC6wdJuunzvuNFg76qOkByk1nl7lzUbcCRqwTKVoZZgdaGiaiIaalMQZqAwwVgVdquhyrBYtWqf9-_grUN5uI347_d1rTgBJ_nRxVUjBr2X6Ltl249as2Heb4ygZ8SmMr5Sv8SHSoPLLxOBqI2MIkpvqXhH6xFzAbBb3TkkX-McZjzrarcYfekwwJSzIYdpnP5oO4gDuznFBs7IuKyA=s96-c	t	aapril0413@gmail.com				
63	108168073990486589111	https://lh3.googleusercontent.com/a/ACg8ocL2cbJrbQrc7ClAt891OqEd-52fJSbmr8z9p6Ev3pCN6nx5LUS75A=s96-c	t	lucasliu0910@gmail.com				
64	111281282630544311843	https://lh3.googleusercontent.com/a/ACg8ocKM1g3JwcM_lmgPM30RlOVKOolKHL6nPcOSnRUwGOv4i6rAQpA3=s96-c	f	k84101311@gmail.com				
65	109199846667562769192	https://lh3.googleusercontent.com/a/ACg8ocKfQDwHARN0Ru3aai0blLd9RfirtPeYNg8kjPdoMkSTcUdMjiA=s96-c	f	dnangeltina@gmail.com				mei.er.183279
66	111580049182585121320	https://lh3.googleusercontent.com/a/ACg8ocLMRfkBtIEiAyA8lxn9Nz7p_Umb2dJPUp3wKWDn3yFgM4OSBA=s96-c	t	hseihcy13@gmail.com	cy._.103			
67	113176977085020831643	https://lh3.googleusercontent.com/a/ACg8ocKIdKaIRDqZE_4sCiGt0Q17WzD6OiD-XEbhlJMDBegskUo57wLr=s96-c	f	vbnm123c@gmail.com				
68	111999729233457520551	https://lh3.googleusercontent.com/a/ACg8ocKhyjyYxjiSSCX2qFQtWYu-dt7nnRCrn5u2MaON3zwT7WDPIkxs=s96-c	t	p8188324@gmail.com				
69	113684346617835134939	https://lh3.googleusercontent.com/a/ACg8ocKpHlfILFBc6QM4WR2OVECK3N9GtWYbCfGkwgj_JOoKNAwrvA=s96-c	t	s111202@nocsh.ntpc.edu.tw		yourneighborchueh		
70	105581461278476469552	https://lh3.googleusercontent.com/a/ACg8ocILCXffXp_rmTBPcXd-Z3DgXKFwLD4pKhaBxYo4QK4nl5UMEzw=s96-c	t	11335303@tschool.tp.edu.tw			0965185512	
71	113742195718235534557	https://lh3.googleusercontent.com/a/ACg8ocLXrdTE-Xq0B5yftHSy0FWCNZx9nKJhgEJw1UTCUx3IOjv2IQ=s96-c	t	leeeeeyu0123@gmail.com				
72	111839709657022618987	https://lh3.googleusercontent.com/a/ACg8ocKbKn8sr2nOhsKcicV0uHHFBhhBeWqFWsTuI_45b68ks2fjPA=s96-c	t	ts.js.anita@gmail.com		dent19238	dent19238	dent19238
73	102642891361387248582	https://lh3.googleusercontent.com/a/ACg8ocI-QRVS0TBCqwfHi8YKz1tWejNVN6skHIeQLEVAMJ-TWbv_IA=s96-c	t	vincent.xu.work@gmail.com		Discord		
74	104940902254485708400	https://lh3.googleusercontent.com/a/ACg8ocLorzlTF1bhtOweHWl5GVXlPRuJkTspsfVjd6gIUGk4g1TX=s96-c	t	hsuhsuhsu7777@gmail.com				
75	105692538415182893328	https://lh3.googleusercontent.com/a/ACg8ocK448BUsdFf5sFYFaYrhC5lEqCi0KNbJAtYkMnOr0I_pz9w7Q=s96-c	f	len107008@gmail.com				
76	100443610395969523757	https://lh3.googleusercontent.com/a/ACg8ocJXJJVOB7S6xawI0MEEIJyJR3oX6ujxcIq0YMG1F52U_CwCJQ=s96-c	t	zoe065090@gmail.com				
77	117085492336948033915	https://lh3.googleusercontent.com/a/ACg8ocJ2L4l2a4nV5ne_dQrr683mqYu02HIew1HA3jfeLzTA5SRzFg=s96-c	t	yies26210191@gmail.com				
78	108965150123534573571	https://lh3.googleusercontent.com/a/ACg8ocIdkzwhrlKnZH0a0YO76WdwNZxfM0sa8mfTM5wWsP0mRzy8sg=s96-c	t	muling0619@gmail.com		esencia.		
79	100928620432937957829	https://lh3.googleusercontent.com/a/ACg8ocI3gAt5F2zaye5zqY_VfMM8dQt8qWUi9xoG5-3eqmHp3CRPNg=s96-c	t	zt.zerotest01@gmail.com	123			
80	110653164849298503958	https://lh3.googleusercontent.com/a/ACg8ocIARxdzGS4oGY1PPFrydsSMIE5t49lltHJJOntKQmWRQPDfN5cp=s96-c	t	a1000671@apps.ntpc.edu.tw				
81	102323716395009930104	https://lh3.googleusercontent.com/a/ACg8ocKCMWxz7ggnwz8neJwPEtZm7Pq6jJxhyxOXqfvhNU81b7XFqHE=s96-c	t	chihyun900131@gmail.com	111			
82	118439372332585035938	https://lh3.googleusercontent.com/a/ACg8ocLq1XYrPrE3GuYWy4cq4y6hlFnygoqRjLUPzGGObpiWK0EeoeB_5g=s96-c	f	joann.shen@thesouledu.org	joannshen			joannshen0
83	102448538466361002662	https://lh3.googleusercontent.com/a/ACg8ocIaXk00UXz5s8s3jySDUanRwvVVAkaPLzgIXKQxNOHemfwBro0a=s96-c	f	tungs13@gmail.com			easthank	
84	113402655832830981438	https://lh3.googleusercontent.com/a/ACg8ocIEMF7Eh7Vr5nL07LJu_1rFQ7fcqRYf1uy-QblzwrNOPNGduLk28Q=s96-c	f	mblin20080714@gmail.com	ayakonkoyo.122_	ayakonkoyo		
85	103032153380276127015	https://lh3.googleusercontent.com/a/ACg8ocI0wvgyE-8Z4eH6jmyJYE0R8XA-bFSqU8pbuxjuKs-bfx8zg3s3=s96-c	f	babykuo2008@gmail.com		babykuo4		
86	108980377151800081369	https://lh3.googleusercontent.com/a/ACg8ocKdgZNSp9ahhWEV3yq6xJLYcycx8Lyci98cMhYW5U7c_REhmUkz=s96-c	f	poshuin@gmail.com	meidosandayo0303	aww20080303		
87	103727447655085789589	https://lh3.googleusercontent.com/a/ACg8ocJM8AoKVQwJNBpFG6WnP7doaT0xxzVk4jdujKxKxs62NkT71jr2=s96-c	f	everett138858@gmail.com	everett0131	everett0131		
88	116779012477512824363	https://lh3.googleusercontent.com/a/ACg8ocKehjNZ0dmFFxpkq1L1h-F7ji3yBW_BhmNmz4nYisVymyP5PyoM=s96-c	f	emily.pingu@gmail.com		moyomi._22		
89	117481081556119616274	https://lh3.googleusercontent.com/a/ACg8ocK2E-H5quvTwV4Z3hm8x0IkfvzFoTKKuo0xe3JlYOxkpn6vev33=s96-c	f	bc0928.5@gmail.com	12	_debussy	123456	12345
90	100037073962042333365	https://lh3.googleusercontent.com/a/ACg8ocLXBe5YzXdjaLjFpde6p1vzf2gh43_z7QgHDZAuKs5VGSRwBQNa=s96-c	f	johnny970103@gmail.com	johnny1025852	617052817970036736		
91	115652487158444391711	https://lh3.googleusercontent.com/a/ACg8ocK6FlWMP7Rpp8ewrLiXA4FTkiaz81Sgzd351vrKDYFHDO_G8ks2=s96-c	f	chingyung3131@gmail.com	chingyung_origami			
92	109021244891626734156	https://lh3.googleusercontent.com/a/ACg8ocJ9JTvscJcXR4Xj6RIySlf-gf23G20VUzDJt0-02ZiyT1Tewwk=s96-c	f	juku112812345@gmail.com	juku_1128			
94	105925790542734537952	https://lh3.googleusercontent.com/a/ACg8ocIVoAR8A1NLZwbWAfvpysfIFMfie2Hel3FlZW5fM6KgfMrdmA=s96-c	f	0119eugene0119@gmail.com	0119teal435			
95	111911643256231907161	https://lh3.googleusercontent.com/a/ACg8ocLKJKsMeXj-ocIPjB-2KDryTo71c78E8xbNHJ3ArVIhD_hQdQ=s96-c	t	selina900131@gmail.com				
97	118088572207392190145	https://lh3.googleusercontent.com/a/ACg8ocIctCxXs7hG7zwGx0SY7ATGShHDQDuvctiFgL34DCdod7ExmgtZYA=s96-c	t	hsuchuting@gmail.com			kyochikutei	
98	118298144323757694533	https://lh3.googleusercontent.com/a/ACg8ocIpaEGPrwx8ctYiYOgoZXiNvOqxFHF8XGInXBXz9jOi2AGM_k0=s96-c	f	wala030hi@gmail.com				
99	100804759405685552024	https://lh3.googleusercontent.com/a/ACg8ocLksokP1hKKuSITvZtWAS4aGuXGOM8gdJH2SdFAbjsAqq5ftw=s96-c	t	cpu299428@gmail.com	ya_chen_0923			
100	111451988706131893790	https://lh3.googleusercontent.com/a/ACg8ocLySpNGpoX6Egoq4hvXHJTSpapapdln0TMcG-ClTfBT4MN66KEZ=s96-c	t	peichun971203@gmail.com		chun1203		
101	117776078720494929491	https://lh3.googleusercontent.com/a/ACg8ocI-ye6OQqVreY5XfKop2C1nsJZRjwfbWt4g2h-ZF-RslbsZGBU=s96-c	t	seanlin1003@gmail.com	seanlin1003			
102	101050137213455213587	https://lh3.googleusercontent.com/a/ACg8ocIiKKE7hsvtWg7KXQTj2WjcWwA6DwTwWWZ4Y8mk0JtQpse1jQ=s96-c	t	ivange@stockfeel.com.tw				
103	107684431380435791703	https://lh3.googleusercontent.com/a/ACg8ocL5tvk4ipsBs3i7TX0U5j1T6iZ6k7eyNMkvUm8kj8xJ-Bl0gPwH=s96-c	f	chingling412@gmail.com				
104	109076149384438491661	https://lh3.googleusercontent.com/a/ACg8ocI29bJFvJhDTqrJ3MpJ4y_w__9X1xLmBhVLx_nwClshCjmwjw=s96-c	t	jeanlin0127@gmail.com				
105	109321322196345014786	https://lh3.googleusercontent.com/a/ACg8ocIGWX-fLNMGtP1HzhQHj6CcTGqT86jylD0ZWZ523PyiXR1U-U347Q=s96-c	t	allywen7@gmail.com	a.l.l.y_615			
106	100979786785072389973	https://lh3.googleusercontent.com/a/ACg8ocLz_2bS_bLUp02BAEpTRpomyNjIX7hChNUMsp2zMWglANq_Ye0=s96-c	t	llee.chier@gmail.com	__sqiv		ziyan961017	
107	116609051273486403376	https://lh3.googleusercontent.com/a/ACg8ocIILsVanQicVhZSN1rREbP-sjVkTY4jJ1fAA8cKKN1YqDqBsOA1=s96-c	t	94saraguo@gmail.com				
108	113872632697567855313	https://lh3.googleusercontent.com/a/ACg8ocJaMW3LtsZ2cHSgwAvaBCvqvjLZIkD17qtsoDMtMoWppAGefg=s96-c	t	shana781227@gmail.com				
109	103747068580566558621	https://lh3.googleusercontent.com/a/ACg8ocKTlyDn-XR63eLmiu0CUtOa3CHSxq7MYDkYXJB6cZ4nE0O1Fw=s96-c	t	geo89466@gmail.com				
110	113256542431929443180	https://lh3.googleusercontent.com/a/ACg8ocJ93JVdfqdhbtVNp3wUXl3KzJxd8z0_TjeS28mEuhziFc1GBkjF=s96-c	t	inorganicom@gmail.com	inorganicomm			
111	110063217477104137877	https://lh3.googleusercontent.com/a/ACg8ocKQfzM-O0XcKjnADtXs-EUyPMb6Ed8T9W95xCaezsDKs1Sfv1um=s96-c	t	henrylee10042004@gmail.com	leehaohan20		0920403960	
113	116101706541784983321	https://lh3.googleusercontent.com/a/ACg8ocKHwiRdaw96EPEIsmFuP_V7vLAr_7rp37M7-KPnWVoZJFl8k5E=s96-c	t	ss880309@gmail.com				
114	110704154291169790166	https://lh3.googleusercontent.com/a/ACg8ocLAbdZ5OK7bmU2eW5qwAVPtVc2lQ0mzKwNoQ069O_evAEwhthA=s96-c	t	jolin.kuo66@gmail.com				
115	108980782635501132868	https://lh3.googleusercontent.com/a/ACg8ocKKNLZagpqpo9RZCOJqjgzDYL39UzQhN7bTEMTN7KnXKCs1EuVwsQ=s96-c	t	lcy0901ww@gmail.com	ze.lofilcy_meow	lofilcy	lcyww1022ouo	
116	103355390847818537564	https://lh3.googleusercontent.com/a/ACg8ocJ7E6DmEtp7W87e2CVadFEIHUebRLCMVqs0_WX70aN_Ra8BGA=s96-c	t	jiayounikehuzhe@gmail.com	simon880715		0912400541	
117	116638439830406734412	https://lh3.googleusercontent.com/a/ACg8ocKiH1WK-27hH6s839O3eWzK7D0c6k4aX92DaMXklRSrIgHkh2Q=s96-c	f	d22495521@gmail.com				
118	105837742014235946602	https://lh3.googleusercontent.com/a/ACg8ocJFiBD7M64emxQMwnVHkdmtCPnImKzH21xTPs9HGakWDhTkhha9=s96-c	t	ting.v.chen@gmail.com			None	
119	106064893729697555406	https://lh3.googleusercontent.com/a/ACg8ocJ3EySdkzwXR6L_Y-72xPUK7USjsHySHvDWkWda-4KunLx35eea=s96-c	t	pekohsiao21@gmail.com	hey4ol			
120	100619003070105487192	https://lh3.googleusercontent.com/a/ACg8ocJPi-KuyrNeXLyU8yWbrWSNSE1upl9QmLzi0uWXpJ1PQ_IH9Uqx=s96-c	t	ctc.chang0514@gmail.com	z.junce			
121	108997867341560075781	https://lh3.googleusercontent.com/a/ACg8ocL-QTtPw07P-vBAOayqhB57M9v7QKoWoHPEpDdJRlTXkSSGqfkp=s96-c	t	a0912358866@gmail.com			leoleo60707	
122	101042250396063705292	https://lh3.googleusercontent.com/a/ACg8ocKpu_7SrRIW_GfC0-tx9PzmqodoQoHgbXdlDU6T_DmqNZkbQLMi=s96-c	t	linyancheng89@gmail.com				
123	117117540953571876315	https://lh3.googleusercontent.com/a/ACg8ocLCTQGwwl7ZAWRfTwo9eRSwiYo53glbO9Fcvr0Zamob9EIj1SLspw=s96-c	t	terry.f.wang@gmail.com				
124	118164228640863446501	https://lh3.googleusercontent.com/a/ACg8ocIo6548hBRXRNCY1BBL4TLgACK6qjOCzc1lW4nmfpHlyxpBrNo=s96-c	t	eddie8873192@gmail.com	eddie41729616		41729616	LaiYiPai
125	111338826674960151059	https://lh3.googleusercontent.com/a/ACg8ocJM1ZgYKUKPEXBjrKRFhosBBQ0oIsOZ_PB-_fv755vyTE09ujjb=s96-c	t	the.oc1122@gmail.com	excellent_tingting			
127	113411249004210739480	https://lh3.googleusercontent.com/a/ACg8ocJZrjT5kpDGQhjawpgMBPTu9Qz1KG99FvCmCtYOyUMocD46yluniA=s96-c	t	pennyw0918@gmail.com				
128	113076058937048686080	https://lh3.googleusercontent.com/a/ACg8ocJ8egp2fJobtSyD2JzGiUQMLA0-Or3r4wIlBe4ASOEftUyRnw=s96-c	t	hackertw@st.tc.edu.tw				
129	104462551034278254851	https://lh3.googleusercontent.com/a/ACg8ocKwpQR2kV-1IOChX3ZFKmTBUZOmCbxYv1G8ylEnkHpo-PsslkiS=s96-c	t	yufish0117@gmail.com	yufish0117			
131	110380971192669587752	https://lh3.googleusercontent.com/a/ACg8ocJgLZd3nCcewxu5aS8U2tYmig-9pC8R5aO90gv7Dycih_3lwMg=s96-c	t	yogajuni1210@gmail.com		juni02118		
132	103081807378756843030	https://lh3.googleusercontent.com/a/ACg8ocKHywP4GA0j8lldIrmj0iWCCNJF4FlR30hVb15aUDUoMn-lRg=s96-c	f	210584@email.wlsh.tyc.edu.tw				
133	109048680885361637431	https://lh3.googleusercontent.com/a/ACg8ocISTWYfd6GCDlZ7kOG2Ql7Hce3vaRnQI9NFn78gLSQNLB48beo=s96-c	t	dd20071211@gmail.com			doreen103150	
134	100931458948665660159	https://lh3.googleusercontent.com/a/ACg8ocKYcmhQaHP-RDwSgqzgPWSphsbmPz6BYJIs0KQuHBRer1brol01=s96-c	t	peggy100215@gmail.com	Winter._.0215	Niko._.15		
135	114815293567718250703	https://lh3.googleusercontent.com/a/ACg8ocJwKe7LnPa21aCPHbf8YEf3NSNuvlkwGrQKX-uvQ11ZqTxUZjIw=s96-c	t	paytonphhuang@gmail.com				
136	105616215692909069161	https://lh3.googleusercontent.com/a/ACg8ocJWnvOy5ANCFyzCE-a84cOISZ548sQncRDqUtIooHQItwUN-g=s96-c	t	xuezhiqian759@gmail.com		_xuezhiqian		
137	115597118492251172504	https://lh3.googleusercontent.com/a/ACg8ocJYMtFggaxZgjxqqL8g6ZtmUIWls2VlwCVZ-6l0H4ys9BTsPn0=s96-c	t	ilikedriedfruit@gmail.com	yun.chia.555			Yun_Chia
138	106868408436098642601	https://lh3.googleusercontent.com/a/ACg8ocL2hMjA7C_y8giQzWD5_3XTW8UWXTUBZX0ZCtdbH_-ZVSyJkRjc=s96-c	t	y.znpcixform@gmail.com	yun_ni_08		st103006	
139	109248608002659288925	https://lh3.googleusercontent.com/a/ACg8ocJkfMDUdO6ludixcloOb2h3kZENec3WwPiCt42s8Rc1WEzVqw=s96-c	t	phyllis@cchs.kh.edu.tw	Hellominimei			
140	107121023464067985207	https://lh3.googleusercontent.com/a/ACg8ocJQJ17H8Vrkl0OSNz-O7fCvJSNQQzUht-9NsELHOCfEZhk501E=s96-c	t	ruth86262010@gmail.com			nancy800610	
141	101104003871847860679	https://lh3.googleusercontent.com/a/ACg8ocJnLbzoLbxTJ4dr820BgP-9k8qU7DqbCsK0co0qYJApwvTWft13oQ=s96-c	t	hellokitty880711@gmail.com	cuzimgod		cuzimgod	
142	106818692285165923092	https://lh3.googleusercontent.com/a/ACg8ocLwQdE6T4MQJQJHDN-yN0vC64b9O6u5X3kh2WSgYze826Lxvu4iyg=s96-c	t	justin387130618@gmail.com	chiang_0618		justin387130618	
143	112987266964080061579	https://lh3.googleusercontent.com/a/ACg8ocJ3K1wFW2IHiu-CZ3cQn5iO-j3vhggu-O8044nwFjqNjxQUQQ=s96-c	t	taiwansmile@gmail.com		606645145466830854		
144	114634836069543355161	https://lh3.googleusercontent.com/a/ACg8ocI8kC2Fkp0IoMnhGTVJV0gSBXd7em8huaL1S9UusSN9nHetNgnB=s96-c	t	christy98191@gmail.com			christy98191	
145	112744249489049791019	https://lh3.googleusercontent.com/a/ACg8ocKKmcAoy-7iKJp0crjdak67DN3mBQXVVj4Zm-fE4PM_nHHJRGsA=s96-c	t	choumei.bonnie@gmail.com	choumei._	choumei._	0911939865	noooo
146	107446590800353033486	https://lh3.googleusercontent.com/a/ACg8ocKMy-lYRuW7ZHYJkTtB5eT_eZCmmQ3A-nRCsCD3s4xP256428wh=s96-c	t	wc91744@gmail.com	weiyu0516			
147	107448755024685836610	https://lh3.googleusercontent.com/a/ACg8ocK-CTYmG5ixCiWdq6qrj00k94NauEH3ug-oxdMxIDiRcgf81UAW=s96-c	t	zhouyuting08620@gmail.com	hoshimiyaichigo315		m337122766	
148	103841059393215239511	https://lh3.googleusercontent.com/a/ACg8ocLvUxRRRb9jjSx3u08plOL4MHDB82oe07pGsN-q22Z91yqDppGNew=s96-c	t	joeyliaw.tw@gmail.com				joeyliaw.tw
149	112948830508547681175	https://lh3.googleusercontent.com/a/ACg8ocILkxGZ-swuc8CFgUPRBUUZ3oNJozkD_qiKA8gvvhE9ddolNA=s96-c	t	a0968881979@gmail.com			b0968881979	
150	106243566981943329539	https://lh3.googleusercontent.com/a/ACg8ocLxCyF45MBT_--_KVVUXtczuAqq7QDyix2SvL8ea2H8d-ATrWg=s96-c	t	sophie.920908@gmail.com			0908sophie	
151	109050612350610219801	https://lh3.googleusercontent.com/a/ACg8ocLfCIdO4rM90bMIHa8kL3RGyKIlg96eLFyJgKQoJA80GpJj91GP=s96-c	t	0516jessica@gmail.com	wa6n1d5er			
152	116846425394299373686	https://lh3.googleusercontent.com/a/ACg8ocLd7lBHF1qJV_0nfFbPWHVeLiZEYHw2FVHnH_gF53580D_fmQ=s96-c	f	laurentsai.1992@gmail.com				
154	110076939983681933162	https://lh3.googleusercontent.com/a-/ALV-UjXxkdAYexSrY1p65X9GWMH60aOHcAQioR1x41wPVm_xWq_z1alQbQ9YPqVybPlHoBFFC_1LafCKERBatEZu-6tG82sMbN8bPJkZiSr82rMmrMYQhGpv3EuUqSZkHEQspQHgv8a_Uxb3juSxTSENaHbhmuzL8r3TTa4fQm1iUvT8aBO5R2o-52x2MZ14BnEidQ291GCXCDForKJUtqJCai91IOh2NW7TfXJq_LbVZzR-U8ZbnFitXJf08iCLJHw6OqkyoxVauvkizm_ikQiySIpYtdscapAK1N2OJd3nQwui4x94tDvZ9Gq1jyMFoZLgftUrUI98RjXhLydJ3m_V5ra9olq5WA9c8Vqg-R67fJA_EreqZn99lEkwhF5ptfeIoRyEtyZHTTav0BdpqSodFDTAJW0V-j2t5YLPIrEOa4_J5WwwWI6S4TwKfAjmHaa7ASdFAaC1YmTRuwCNR9fRR-R5nU9lX_UnU4jYgESDhijretsDSotHXtPb5-ctzM2_OmNSs5_gP77tXGmg-YsfYaOC50SVtszCPLXTEuKxWxcqmj3Bc9_40VuL-_yDymgXCBSO65wv21M7A27bRHwsWuNbXFJrm7w-8X5ex3OLiBttnRcjRs1piwCxulxOuwcYpZM8NW-52lq1RGhb7NZ_xtlgc3jvE5U7e_2rxiLDF8eqNzy3Ab9kM5ZxS-ftNKb_BzBRM9NrEzzJka4RLvqeMYpm0Ohr__AqJiK0kR9Ws93byVkeYEhGsnIR4DJuOb8TcPvACKGWk5AWRQktuzMExBJVi5wFC63okND5pI11IGwB3222HX92xD4gF-gxOG4TMuLPRypftyEHImmSXCW-JcZsTvGGDQtK7c7PIZMIXQe5-13yIyyIhf_Fe2G4wgAjH3Be4PvSSouKRJjTksSvBfX0wUlMX0z7Jn2DRvfYa2r03Sw6zNKIMrxI5VgNub4BmR1ECiMc_N27HCEK0WsvQtKV_9c=s96-c	t	qmoon815@gmail.com				
155	104188905237435614743	https://lh3.googleusercontent.com/a/ACg8ocKTYHCwa2yrRFmmIkLYvFKVNvExgzxauVnyaXL8CpNjqWDU9g=s96-c	t	emily.hungml@gmail.com	slow951210			
156	102661244051005820159	https://lh3.googleusercontent.com/a/ACg8ocKsQsrwYJtH0PxjBGLZ0uH9Gt6hbTnxJh9mWjTmE2BHB6jm5A=s96-c	t	yeozhiwu@gmail.com	yeozhiwu		71007410646623	
\.


--
-- Data for Name: eligibility; Type: TABLE DATA; Schema: public; Owner: daodao
--

COPY public.eligibility (id, reference_file_path, partner_emails, fee_plans_id, created_at, updated_at) FROM stdin;
1	\N	{christy98191@gmail.com,taiwansmile@gmail.com,zhouyuting08620@gmail.com}	6	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
2	\N	{yufish0117@gmail.com,jiayounikehuzhe@gmail.com,choumei.bonnie@gmail.com}	6	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
3	\N	{llee.chier@gmail.com,ctc.chang0514@gmail.com,a0912358866@gmail.com}	6	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
4	\N	{" llee.chier@gmail.com",a0912358866@gmail.com,the.oc1122@gmail.com}	6	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
5	\N	{llee.chier@gmail.com,ctc.chang0514@gmail.com,the.oc1122@gmail.com}	6	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
6	\N	{Ilikedriedfruit@gmail.com,justin387130618@gmail.com,xuezhiqian759@gmail.com}	6	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
7	\N	{Cc,Cc,Cc}	6	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
8	\N	{}	1	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
9	\N	{}	2	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
10	\N	{yufish0117@gmail.com,eddie8873192@gmail.com,choumei.bonnie@gmail.com}	6	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
11	\N	{dd20071211@gmail.com,Ilikedriedfruit@gmail.com,xuezhiqian759@gmail.com}	6	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
12	\N	{christy98191@gmail.com,zhouyuting08620@gmail.com,linyancheng89@gmail.com}	6	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
13	\N	{christy98191@gmail.com,taiwansmile@gmail.com,linyancheng89@gmail.com}	6	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
14	\N	{}	2	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
15	\N	{eddie8873192@gmail.com,jiayounikehuzhe@gmail.com,choumei.bonnie@gmail.com}	6	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
16	\N	{1/23有填寫【想找人團報】,希望能報名此項目,等主辦的消息，感謝💕}	6	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
17	\N	{dd20071211@gmail.com,xuezhiqian759@gmail.com,justin387130618@gmail.com}	6	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
18	\N	{linyancheng89@gmail.com,taiwansmile@gmail.com,zhouyuting08620@gmail.com}	6	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
19	\N	{ctc.chang0514@gmail.com,a0912358866@gmail.com,the.oc1122@gmail.com}	6	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
20	\N	{}	2	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
21	\N	{yufish0117@gmail.com,eddie8873192@gmail.com,jiayounikehuzhe@gmail.com}	6	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
22	\N	{}	2	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
\.


--
-- Data for Name: fee_plans; Type: TABLE DATA; Schema: public; Owner: daodao
--

COPY public.fee_plans (id, fee_plan_type, name, discount, created_at, updated_at) FROM stdin;
1	low_income	Student Discount	0.00	2025-01-30 17:07:26.615472	2025-01-30 17:07:26.615472
2	discount	Personal Early Plan	6000.00	2025-01-30 17:07:26.615472	2025-01-30 17:07:26.615472
3	personal	Standard Plan	8000.00	2025-01-30 17:07:26.615472	2025-01-30 17:07:26.615472
4	double	Couple Discount	10000.00	2025-01-30 17:07:26.615472	2025-01-30 17:07:26.615472
5	three	Three Plan	12000.00	2025-01-30 17:07:26.615472	2025-01-30 17:07:26.615472
6	four	Family Plan	12000.00	2025-01-30 17:07:26.615472	2025-01-30 17:07:26.615472
\.


--
-- Data for Name: groups; Type: TABLE DATA; Schema: public; Owner: daodao
--

COPY public.groups (id, external_id, title, photo_url, photo_alt, category, group_type, partner_education_step, description, area_id, is_grouping, created_date, updated_date, "time", partner_style, created_at, created_by, updated_at, updated_by, motivation, contents, expectation_result, notice, tag_list, group_deadline, hold_time, is_online, "TBD") FROM stdin;
1	e20e1d9f-142c-409e-9af7-80101b40c6c3	遊戲化產品開發—Journey	https://image.daoedu.tw/5716ba50-fee3-4407-8d12-2351877888b7		{綜合型學習資源,商業與社會創新}	{project,other}	{other}	- 適合喜歡從 0-1 的人\n- 有人帶領軟體開發，沒有經驗也沒關係，但要有毅力和克服困難的勇氣\n- 歡迎對人生有想法和喜歡創造做產品的人\n- 來信請附上作品集和為什麼想要參與，或約時間聊聊\n- 網址：https://cactus.pse.is/6f2ufl	{}	t	2024-09-11 11:38:03+00	2024-11-17 04:12:53+00	Every Sunday 17:00-18:00	UXUI 設計師、遊戲美術、動畫師	2025-01-30 17:08:59.173264+00	34	2025-01-30 17:08:59.173267+00	airflow	幫助人類社會更好，讓每個人都能探索人生的可能性	* 請填寫表單： [https://forms.gle/mAiKaZCeHqB7UUZp9](https://forms.gle/mAiKaZCeHqB7UUZp9)\n* 來信請附上作品集和為什麼想要參與，或約時間聊聊\n* 適合喜歡從 0-1 的人\n* 有人帶領軟體開發，沒有經驗也沒關係，但要有毅力和克服困難的勇氣\n* 歡迎對人生有想法和喜歡創造做產品的人\n* 網址： [https://cactus.pse.is/6f2ufl](https://cactus.pse.is/6f2ufl)	上架 APP	* 每週一次開會，可請假\n* 有任何想法和問題請務必提出\n* 加入後，請找時間完成《個人使用說明書》	{產品開發}	2024-11-22 03:56:33+00	\N	f	f
2	9933788a-e1ce-4867-8e2b-81c4a829e4fd	學習型 Youtube 頻道	https://image.daoedu.tw/428c307a-2a9d-479a-b226-a642f89a8be0		{藝術,綜合型學習資源,學習/教學工具,商業與社會創新,生活}	{Activity,project}	{other}	頻道：https://www.youtube.com/@CactusFlower_STU\n- 適合喜歡從 0-1 的人\n- 影音企劃、繪圖人才歡迎\n- 工具、教材已有\n- 影音將會出現在 Youtube 上\n- 請附上作品集和個人經驗，或約時間聊聊\n- 網址：https://cactus.pse.is/6f2ufl	{}	t	2024-09-11 11:56:10+00	2024-12-06 13:14:24+00		Vtuber 設計師、企劃人才、剪輯師	2025-01-30 17:08:59.176241+00	34	2025-01-30 17:08:59.176244+00	airflow	幫助人類社會更好，讓每個人都能探索人生	頻道： [https://www.youtube.com/@CactusFlower\\_STU](https://www.youtube.com/@CactusFlower_STU)\n\n* 請填寫表單： [https://forms.gle/mAiKaZCeHqB7UUZp9](https://forms.gle/mAiKaZCeHqB7UUZp9)\n* 適合喜歡從 0-1 的人\n* 影音企劃、繪圖人才歡迎\n* 工具、教材已有\n* 影音將會出現在 Youtube 上，目前可先不以 V 形式\n* 請附上作品	跟市場間接，一起持續錄製影片	* 每週一次開會，可請假\n* 有任何想法和問題請務必提出\n* 加入後，請找時間完成《個人使用說明書》	{影音,Vtuber}	2024-11-22 03:56:33+00	\N	f	f
3	3b4e0cb7-9f73-4cdb-9d8d-8d30f15f45f7	[台北訪談] 街頭美食和國家認同的關係 by 以色列人類學研究生	https://image.daoedu.tw/710372c1-280f-4d1e-a1b4-7daf8b938d52		{人文社會,語言與文學}	{}	{}	#台灣街頭美食與國家認同的關係 #英文訪談\n「我覺得台灣讓我有家的感覺」，這是我親愛的以色列好友 Adi Rosenstock第二次來台灣時和我說的話，她熱愛台灣人，熱愛台灣美食（圖片即為第二次來台我們帶她到鹿港老街永和豆漿捏她最愛的小籠包）。於是Adi 把她的人類所碩士論文題目訂為「街頭美食和國家認同的關係」，並以在台北的青年人為主。\n而 Adi 這次三訪台灣，她想要找 #在台北 #青年人 聊聊喜歡的街頭美食以及自己對國家認同的看法，你可以約在你喜歡的美食店，費用會由 Adi 出，訪談過程會以英文輕鬆聊	{}	t	2024-09-11 15:01:22+00	2024-09-11 15:01:22+00	2024/9/8-2024/10/12 	18-35歲在台北的青年	2025-01-30 17:08:59.178092+00	8	2025-01-30 17:08:59.178096+00	airflow	\N	\N	\N	\N	{國家認同,訪談,街頭美食}	\N	\N	f	f
4	054dacbc-870e-4954-9152-7f160ba81211	《重塑組織》讀書會－研究如何經營「自主管理」、「身心完整」及「使命驅動」的組織	https://image.daoedu.tw/c520fdf7-70dd-4d24-9553-d56a366d4909		{商業與社會創新}	{}	{}	如果有參加2024IDEC in Taiwan是執行團隊的人，或是聽過貍想教育創辦人演講那場，\n應該有略略聽過「青色組織」這個詞。\n\n我自己則是在貍想教育創新學院體驗過青色組織後，\n才知道這種「自主管理」、「身心完整」及「使命驅動」的組織概念是出自於《重塑組織》這本書。\n\n我認為這種重視身心完整，信任夥伴的價值觀與民主教育的概念非常契合；\n對於已出社會但仍舊受體制所苦，找不到自我價值的社會人士們，這本書也能提供一個全新的觀點，讓你知道除了內省去適應社會外，其實可以透由改變環境（打造青色組織）來創造不用內耗	{}	f	2024-09-13 08:32:01+00	2024-09-16 02:30:09+00	預計10月起，實際活動時間與頻率由夥伴共同決議	對如何創造身心完整並彼此共好的社群有興趣的人	2025-01-30 17:08:59.179345+00	23	2025-01-30 17:08:59.179347+00	airflow	\N	\N	\N	\N	{}	\N	\N	f	f
5	cd3e2c64-59f0-4385-b1c1-afe15e5840f8	Marketing Project Sharing 社群行銷小聚	https://image.daoedu.tw/5ca238ae-dfc2-4c43-9766-da2aa8a524a2		{商業與社會創新,綜合型學習資源,人文社會}	{}	{}	Hi 我是一個不專業前行銷人，即使脫離行銷產業，還是很沈迷於社群網路，想揪一群人一起聊聊近期社群趨勢或感興趣的行銷點子，最終目的是活絡島島阿學的自媒體，期望透過群體討論激發出火花，用島島的媒體社群做個社會實驗！\n\n以下是讀書會的小規則！期望可常態性舉辦！\n\n🤙 Rule\n- 參加者輪流主持\n- 兩週舉辦一次，兩週時間可根據題目準備內容\n- 感受是主觀的，勿批評謾罵，但歡迎提出想法\n- 不懂就問！你不會是孤單ㄉ那一個\n\n🤙 Week #1\n- 1 件你覺得不錯的行銷專案，包含但不限於社群流行趨勢、影片題材、	{}	t	2024-09-15 14:40:34+00	2024-09-15 14:42:50+00	10月中開始 兩週一次	對社群行銷有興趣、時常潛水的活網仔	2025-01-30 17:08:59.180306+00	16	2025-01-30 17:08:59.180307+00	airflow	\N	\N	\N	\N	{行銷,讀書會,社群媒體,不專業分析}	\N	\N	f	f
6	1ef0a987-accf-4330-85c9-aad2b2c5a302	島島咖啡社 咖啡亂聊交流大會	https://image.daoedu.tw/10677533-557b-4cdf-ae15-f05933819f49		{生活}	{}	{}	咖啡亂聊，從烘豆、單品豆推薦、沖煮技巧、器材只要你覺得和咖啡有關都可以來湊咖聊\n歡迎加入島島 discord #咖啡社	{}	t	2024-09-17 15:47:21+00	2024-09-17 15:48:38+00	隨時 只要在島島 discord #咖啡社 	咖啡愛好者、有興趣嘗試手沖咖啡的人	2025-01-30 17:08:59.181218+00	16	2025-01-30 17:08:59.18122+00	airflow	\N	\N	\N	\N	{咖啡,手沖,盤}	\N	\N	f	f
7	57991105-a6f5-41ec-9898-35a66ce9ccd6	找對資安安全意識程度及設計工作坊有興趣的國中跟高中生			{資訊與工程}	{}	{}	我過去在英國唸大學部的使用者經驗設計，之前大學有個研究工作坊的專案想要完成，大學的時候只有做一半，但是我想要延續我的資安及設計的設計研究，把我之前的資安桌遊完成，希望可以之後完成，邀請大家試玩且繼續進行研究。\n\n如果有興趣者，請填寫表單。\n\n連結如下：https://forms.gle/MycewT6ho4ZUnXFz8\n\n有任何問題，請聯絡 Email: chao.ling.chyou@gmail.com。\n\n\n感謝。\n\n\n	{}	t	2024-09-18 13:05:14+00	2024-09-20 16:53:48+00	2024/10/1~ 2024/11/31	對資訊安全有興趣的國高中生	2025-01-30 17:08:59.182103+00	41	2025-01-30 17:08:59.182104+00	airflow	\N	\N	\N	\N	{}	\N	\N	f	f
8	b8c4cde9-aa1c-4937-81c3-74bf3d0bf66f	英語口說 study group	https://image.daoedu.tw/23d00557-44f5-4202-aaf7-ec8ffcbe2103		{語言與文學}	{}	{University}	隔週30分鐘累積英語表達自信及口說技巧。\n\n方式與特色：\n- 小組練習：每組 5 人，討論明確的學習目標，每月2~3次的30分鐘練習。\n- 表達訓練：提供英語母語人士的句型結構，訓練簡潔有力的口說。\n- 成就養成：利用社群培養固定練習英文的習慣，透過他人回饋增加信心。\n\n加入 discord 連結或 email 信箱\n提供您的英文名字和學習目標～\nhttps://discord.gg/8eum9v4S\n	{}	t	2024-10-22 08:21:28+00	2024-10-22 08:21:28+00	隔週三晚上 9:30-10:00	-想練習英文口說的夥伴	2025-01-30 17:08:59.183011+00	46	2025-01-30 17:08:59.183013+00	airflow	\N	\N	\N	\N	{英文口說,學習小組}	\N	\N	f	f
9	4e7d0253-992d-43bc-af92-b0d3eb7a37d3	[學習日誌馬拉松] 一起連續14天寫學習日誌！	https://image.daoedu.tw/e0e9c6f3-4906-40c0-8a39-01953d65f668		{教育,學習/教學工具}	{other}	{other}	\N	{}	t	2024-11-12 03:57:14+00	2024-11-12 03:57:14+00	不限時間	想要養成每天紀錄學習日誌習慣的人、想要有人相互監督勉勵寫日誌的人	2025-01-30 17:08:59.183877+00	8	2025-01-30 17:08:59.183879+00	airflow	希望能找到更多夥伴一起參加學習馬拉松，讓寫學習日誌變得更有趣，增加寫的動機，也希望可以獲得更多回饋	你是否和我一樣，一直很想寫日誌，但是就是無法維持？\n或在學習的過程，即使學習目標不同，也想找人一起互相互監督與勉勵？\n想邀請你一起參加島島阿學 Discord 頻道的「學習日誌馬拉松」，你可以選擇挑戰連續 7 天、14 天寫學習日誌，又或者直接挑戰 30 天！\n寫學習日誌很簡單，只要簡單設定好預計學習任務和目標，就可以開始，只要每天睡前記得上去寫一下今天學習狀態與心得，一句話也可以，一個表情也可以，有開始就是好的開始。\n\n歡迎加入島島阿學 Discord，並找到「島島挑戰區」即可開始！\nhttps://d	透過每天寫學習日誌，回顧並反思自身學習狀態，並不斷彈性調整，同時也有助於讓腦袋更清晰身心更安定。	1.以善意出發給予他人日誌回饋。\n2.Discord學習日誌皆為全公開，請自行斟酌撰寫內容。	{日誌,學習歷程檔案,學習紀錄,學習反思}	2024-11-19 03:54:43+00	\N	f	f
10	60b709c8-6468-4961-8af3-33b36c0d01d9	一起吃清大、交大學餐！	https://image.daoedu.tw/800d911d-a346-445f-8b0d-84d03f7fa98e		{生活}	{other}	{"high school",University,other}	\N	{}	t	2024-11-12 06:58:28+00	2024-11-12 06:58:28+00	1230~1400	高中生、大學生、實驗教育學生、清大在校生、交大在校生	2025-01-30 17:08:59.185065+00	87	2025-01-30 17:08:59.185067+00	airflow	請看揪團內容與運作方式！	一群高中自學團的朋友11/29要一起去參觀清大和交大+或許會旁聽課程，想說能順便找年紀差不多的人一起吃飯聊聊天、逛校園。\n單純是有點好奇揪團是否真的會成功，以及想找看看當天有清大或交大在校生能認識一下，一起逛逛校園之類的。\n（目前還不確定會不會去旁聽課程，以及課程時間，意思就是確切的時間要再慢慢討論）	在清大或交大吃到貢丸	吃咖哩飯不能伴，火鍋不要加芋頭	{#吃飯局}	2024-11-29 06:06:00+00	\N	f	f
11	6b5b2475-0bc7-4ffc-94fa-36ea2133b242	甜點製作工作坊：一起動手做出美味甜點	https://image.daoedu.tw/29300bdf-bf25-4990-b0bf-10ce4de21f6a		{生活}	{workshop}	{other}	頻道：https://www.youtube.com/@CactusFlower_STU\n- 適合喜歡從 0-1 的人\n- 影音企劃、繪圖人才歡迎\n- 工具、教材已有\n- 影音將會出現在 Youtube 上\n- 請附上作品集和個人經驗，或約時間聊聊\n- 網址：https://cactus.pse.is/6f2ufl	{}	f	2024-11-12 15:07:42+00	2024-11-17 01:41:37+00	每週六下午 2:00 - 5:00，為期 4 週	喜歡甜點、願意動手實作的朋友們，不論有無經驗皆可參加。	2025-01-30 17:08:59.186906+00	9	2025-01-30 17:08:59.186908+00	airflow	想要聚集一群對甜點製作感興趣的朋友，一起學習並交流技術。	每週我們將共同製作不同的甜點，從基礎的**餅乾**、**布朗尼**到稍微進階的**提拉米蘇**。\n由我負責準備材料和工具，並提前提供製作配方。\n每次聚會我們將一起動手製作，並在過程中交流技巧和心得。\n工作坊最後一週，我們會舉行一個小小的甜點分享會，讓每位成員展示自己的成果。	享受動手製作的成就感，並與夥伴建立良好的友誼。	1. 為確保場地和食材準備充足，請提前報名。\n2. 請自備保鮮盒或袋子，以便將成品帶回家。\n3. 若對某些食材過敏，請提前告知以便做出相應安排。	{甜點製作,手作甜點,團體活動,烘焙,學習交流}	2024-11-18 15:46:00+00	\N	f	f
12	7339ccb9-6dba-443e-860d-18ab4ad56609	完成人生夢想	https://image.daoedu.tw/4f7ee153-1905-41f0-8d1f-8369934dae03		{綜合型學習資源}	{other}	{other}	\N	{}	f	2024-11-12 15:12:44+00	2024-11-20 17:28:05+00		不限	2025-01-30 17:08:59.188091+00	34	2025-01-30 17:08:59.188093+00	airflow	每個人人生都有夢想，一起完成彼此的夢想吧	* 請填寫表單：https://forms.gle/mAiKaZCeHqB7UUZp9\n* 適合喜歡從 0-1 的人\n* 網址：https://cactus.pse.is/6f2ufl	築夢踏實	* 每週一次開會，可請假\n* 有任何想法和問題請務必提出\n* 加入後，請找時間完成《個人使用說明書》	{產品開發}	2024-11-19 15:04:11+00	\N	f	f
13	36e9493c-b241-436f-b59b-28d54c0eae68	發起揪團	https://image.daoedu.tw/0cc8d96b-c3bc-41e5-8526-8c8a66e7d793		{藝術}	{other}	{other,University,"high school"}	\N	{}	f	2024-11-17 04:43:35+00	2024-11-17 04:53:45+00		夥伴	2025-01-30 17:08:59.189183+00	4	2025-01-30 17:08:59.189184+00	airflow	揪團動機	**# Test**\n\n\\`\\`\\`html\n\\<h1>123\\</h1>\n\\`\\`\\`	期待成果	注意	{}	2024-11-13 16:00:00+00	\N	f	f
\.


--
-- Data for Name: location; Type: TABLE DATA; Schema: public; Owner: daodao
--

COPY public.location (id, area_id, "isTaiwan", region) FROM stdin;
1	1	t	內湖區
2	2	t	新莊區
3	3	t	釣魚臺
4	4	t	
5	4	t	Unknown
6	2	t	中和區
7	4	t	
8	5	t	永和區
9	1	t	新莊區
10	\N	f	\N
11	\N	f	\N
12	\N	f	\N
13	\N	f	\N
14	4	t	
15	1	t	
16	4	t	
17	\N	f	\N
18	6	t	東區
19	2	t	新莊區
20	\N	f	\N
21	7	t	三民區
22	4	t	
23	2	t	
24	7	t	三民區
25	4	t	
26	1	t	內湖區
27	\N	f	\N
28	4	t	太平區
29	4	t	太平區
30	7	t	鳳山區
31	\N	f	\N
32	4	t	
33	4	t	南區
34	8	t	桃園區
35	4	t	
36	\N	f	\N
37	\N	f	\N
38	7	t	苓雅區
39	\N	f	\N
40	2	t	
41	\N	f	\N
42	\N	f	\N
43	8	t	蘆竹區
44	9	t	鹿港鎮
45	4	t	
46	\N	f	\N
47	2	t	
48	4	t	
49	4	t	
50	8	t	
51	2	t	
52	4	t	
53	\N	f	\N
54	\N	f	\N
55	\N	f	\N
56	\N	f	\N
57	\N	f	\N
58	4	t	
59	1	t	文山區
60	2	t	五股區
61	8	t	桃園區
62	\N	f	\N
63	\N	f	\N
64	\N	f	\N
65	4	t	
66	4	t	
67	\N	f	\N
68	1	t	大安區
69	1	t	大同區
70	2	t	三峽區
71	2	t	板橋區
72	4	t	
73	4	t	
74	4	t	
75	\N	f	\N
76	\N	f	\N
77	2	t	淡水區
78	1	t	中正區
79	4	t	
80	1	t	
81	4	t	Unknown
82	1	t	中正區
83	4	t	
84	10	t	寶山鄉
85	2	t	板橋區
86	2	t	板橋區
87	8	t	中壢區
88	7	t	楠梓區
89	4	t	安南區
90	4	t	
91	11	t	土庫鎮
92	4	t	永康區
94	4	t	
95	\N	f	\N
97	12	t	屏東市
98	\N	f	\N
99	10	t	竹北市
100	7	t	
101	4	t	南區
102	\N	f	\N
103	\N	f	\N
104	\N	f	\N
105	13	t	竹南鎮
106	1	t	大安區
107	\N	f	\N
108	\N	f	\N
109	\N	f	\N
110	1	t	
111	4	t	Unknown
113	\N	f	\N
114	\N	f	\N
115	2	t	永和區
116	4	t	
117	\N	f	\N
118	9	t	彰化市
119	8	t	中壢區
120	4	t	
121	4	t	北屯區
122	\N	f	\N
123	\N	f	\N
124	1	t	南港區
125	7	t	
127	\N	f	\N
128	\N	f	\N
129	4	t	
131	4	t	
132	\N	f	\N
133	8	t	蘆竹區
134	4	t	
135	\N	f	\N
136	1	t	內湖區
137	8	t	
138	4	t	大甲區
139	4	t	
140	14	t	南竿鄉
141	4	t	
142	2	t	中和區
143	4	t	南區
144	2	t	新店區
145	4	t	
146	15	t	信義區
147	4	t	Unknown
148	4	t	
149	2	t	新莊區
150	4	t	
151	2	t	新店區
152	\N	f	\N
154	\N	f	\N
155	16	t	北區
156	7	t	
\.


--
-- Data for Name: marathon; Type: TABLE DATA; Schema: public; Owner: daodao
--

COPY public.marathon (id, external_id, event_id, title, description, start_date, end_date, registration_status, people_number, registration_start_date, registration_end_date, is_public, created_by, created_at, updated_at) FROM stdin;
1	47b7c60f-6f43-4537-a420-31966dab3a14	2025S1	Daodao Marathon	Helps you create a personalized learning plan.	2025-02-10	2025-07-12	Open	20	2024-12-15	2025-01-19	t	1	2025-01-30 17:07:26.616493	2025-01-30 17:07:26.616493
\.


--
-- Data for Name: milestone; Type: TABLE DATA; Schema: public; Owner: daodao
--

COPY public.milestone (id, project_id, week, name, description, start_date, end_date, is_completed, is_deleted, created_at, updated_at) FROM stdin;
1	1	\N	讀台灣民主運動史(日治到戰後)，創設部落格	\N	2025-02-09	2025-02-22	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
2	1	\N	讀台灣史/東亞史/分析中共的書，聽演講	\N	2025-02-23	2025-03-08	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
3	1	\N	撰寫一篇文章	\N	2025-03-09	2025-03-22	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
4	1	\N	讀開放社會與其敵人還有其他論述政治經濟專制對人類社會危害的書	\N	2025-03-23	2025-04-05	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
5	1	\N	讀世界史	\N	2025-04-06	2025-04-19	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
6	1	\N	撰寫一篇文章	\N	2025-04-20	2025-05-03	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
7	1	\N	讀中共對台灣的影響(如談論中資滲透的書/台海軍演等等)	\N	2025-05-04	2025-05-17	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
8	1	\N	讀談論中共在中國施行迫害的書，聽演講	\N	2025-05-18	2025-05-31	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
9	1	\N	撰寫一篇文章	\N	2025-06-01	2025-06-14	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
10	1	\N	讀中國歷史上的人權捍衛者寫的著作	\N	2025-06-15	2025-06-28	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
11	1	\N	撰寫兩篇文章	\N	2025-06-29	2025-07-12	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
12	2	\N	環境建立與學習規劃	\N	2025-02-09	2025-02-15	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
13	2	\N	環境建立與學習規劃	\N	2025-02-16	2025-02-22	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
14	2	\N	基礎能力培養	\N	2025-02-23	2025-03-01	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
15	2	\N	基礎能力培養	\N	2025-03-02	2025-03-08	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
16	2	\N	學習方法優化	\N	2025-03-09	2025-03-15	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
17	2	\N	學習方法優化	\N	2025-03-16	2025-03-22	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
18	2	\N	學習方法優化	\N	2025-03-23	2025-03-29	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
19	2	\N	學習方法優化	\N	2025-03-30	2025-04-05	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
20	2	\N	學習方法優化	\N	2025-04-06	2025-04-12	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
21	2	\N	學習方法優化	\N	2025-04-13	2025-04-19	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
22	2	\N	學習方法優化	\N	2025-04-20	2025-04-26	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
23	2	\N	學習方法優化	\N	2025-04-27	2025-05-03	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
24	2	\N	學習方法優化	\N	2025-05-04	2025-05-10	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
25	2	\N	學習方法優化	\N	2025-05-11	2025-05-17	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
26	2	\N	學習方法優化	\N	2025-05-18	2025-05-24	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
27	2	\N	16	\N	2025-05-25	2025-05-31	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
28	2	\N	學習方法優化	\N	2025-06-01	2025-06-07	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
29	2	\N	18	\N	2025-06-08	2025-06-14	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
30	2	\N	學習方法優化	\N	2025-06-15	2025-06-21	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
31	2	\N	20	\N	2025-06-22	2025-06-28	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
32	2	\N	學習方法優化	\N	2025-06-29	2025-07-05	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
33	2	\N	22	\N	2025-07-06	2025-07-12	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
34	3	\N	執頭偶初探	\N	2025-02-09	2025-02-15	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
35	3	\N	杖頭偶初探	\N	2025-02-16	2025-02-22	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
36	3	\N	手套偶初探	\N	2025-02-23	2025-03-01	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
37	3	\N	遊行大偶工作坊 第一週	\N	2025-03-02	2025-03-08	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
38	3	\N	遊行大偶工作坊 第二週	\N	2025-03-09	2025-03-15	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
39	3	\N	遊行大偶工作坊 第三週	\N	2025-03-16	2025-03-22	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
40	3	\N	遊行大偶工作坊 第四週	\N	2025-03-23	2025-03-29	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
41	3	\N	遊行大偶工作坊 第五週	\N	2025-03-30	2025-04-05	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
42	3	\N	遊行大偶工作坊 第六週	\N	2025-04-06	2025-04-12	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
43	3	\N	遊行大偶工作坊 第七週	\N	2025-04-13	2025-04-19	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
44	3	\N	懸絲偶初探	\N	2025-04-20	2025-04-26	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
45	3	\N	懸絲偶初探	\N	2025-04-27	2025-05-03	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
46	3	\N	戲偶創作 主題：〈人〉	\N	2025-05-04	2025-05-10	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
47	3	\N	戲偶創作 主題：〈人〉	\N	2025-05-11	2025-05-17	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
48	3	\N	戲偶創作 主題：〈人〉	\N	2025-05-18	2025-05-24	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
49	3	\N	戲偶創作 主題：〈植物〉	\N	2025-05-25	2025-05-31	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
50	3	\N	戲偶創作 主題：〈植物〉	\N	2025-06-01	2025-06-07	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
51	3	\N	戲偶創作 主題：〈植物〉	\N	2025-06-08	2025-06-14	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
52	3	\N	戲偶創作 主題：〈動物〉	\N	2025-06-15	2025-06-21	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
53	3	\N	戲偶創作 主題：〈動物〉	\N	2025-06-22	2025-06-28	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
54	3	\N	戲偶創作 主題：〈動物〉	\N	2025-06-29	2025-07-05	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
55	3	\N	戲偶創作 主題：〈動物〉	\N	2025-07-06	2025-07-12	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
56	4	\N	- 閱讀《教育心理學：理論與實踐》、《拒絕上學的孩子》。 - 學習系統思考工具（如因果循環圖和系統動態建模）的基本概念。 - 紀錄拒學議題中的主要影響因素，初步構建因果循環圖。	\N	2025-02-09	2025-02-22	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
57	4	\N	- 閱讀《第五項修練》，理解系統思考在教育問題中的應用。 - 繪製更詳細的因果循環圖，加入心理、家庭、學校及社會層面的影響因素。 - 撰寫對拒學問題的系統性觀察筆記。	\N	2025-02-23	2025-03-08	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
58	4	\N	- 設計針對學生、家長和教育工作者的問卷，涵蓋心理、家庭、學校及社會層面。 - 撰寫訪談提綱，包括針對拒學經驗、成因及應對策略的問題。 - 向專家或導師徵求問卷及提綱的修改建議。	\N	2025-03-09	2025-03-22	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
59	4	\N	- 發放問卷，蒐集至少50份有效回應。 - 將問卷數據整理為表格，準備進一步分析。	\N	2025-03-23	2025-04-05	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
60	4	\N	- 與3-5位教育工作者、心理諮商師或曾經拒學的學生進行深度訪談。 - 將訪談內容整理為文字紀錄，識別關鍵觀點和模式。	\N	2025-04-06	2025-04-19	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
61	4	\N	- 使用SPSS或Excel進行數據分析，識別關鍵模式和趨勢。 - 根據調查結果更新因果循環圖，加入新的影響因素和反饋機制。 - 使用Kumu等工具構建系統動態模型，測試不同干預策略的效果。	\N	2025-04-20	2025-05-03	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
62	4	\N	brainstorming解決方案概念。選擇最可行的方案，設計MVP（最小可行產品）的詳細規格	\N	2025-05-04	2025-05-17	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
63	4	\N	開發MVP原型	\N	2025-05-18	2025-05-31	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
64	4	\N	測試MVP原型，邀請至少10位拒學學生或相關人士參與使用測試，收集反饋	\N	2025-06-01	2025-06-14	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
65	4	\N	- 整理調查結果、分析結論及測試反饋，形成完整研究框架。 - 撰寫研究報告初稿，包括背景、方法、結果及建議部分。	\N	2025-06-15	2025-06-28	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
137	10	\N	學習面：XChangeBD 實戰談「資源協作攻略」	\N	2025-05-25	2025-05-31	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
66	4	\N	製作簡報或影片，總結研究歷程、數據分析結果及解決方案。 撰寫部落格文章或Medium文章，公開分享研究經驗及資源。 舉辦線上分享會，展示研究成果並回答觀眾提問。 收集參加者對解決方案和研究內容的回饋意見，根據回饋修訂最終報告和解決方案。	\N	2025-06-29	2025-07-12	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
67	5	\N	閱讀拒學相關文獻與書籍，研究拒學的心理學基礎	\N	2025-02-09	2025-02-22	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
68	5	\N	分析拒學的社會層面影響，整理成一份系統圖	\N	2025-02-23	2025-03-08	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
69	5	\N	整理第一階段所有資料，撰寫一份初步背景報告，涵蓋拒學成因及影響。	\N	2025-03-09	2025-03-22	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
70	5	\N	根據收集的資料與分析相關議題組織方案結果，確立可能的解決方案框架，並設定具體目標。	\N	2025-03-23	2025-04-05	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
71	5	\N	學習設計思維與以用戶為中心的解決方案設計方法，並對目標受眾進行更深入的需求分析。	\N	2025-04-06	2025-04-19	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
72	5	\N	根據用戶需求與設計思維，設計一個小規模試驗計畫來測試解決方案的可行性。	\N	2025-04-20	2025-05-03	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
73	5	\N	實施小規模的試驗計畫，並收集反饋與資料。	\N	2025-05-04	2025-05-17	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
74	5	\N	分析試驗過程中的資料，總結實施效果並提出改進建議。	\N	2025-05-18	2025-05-31	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
75	5	\N	根據分析結果對解決方案進行優化，並準備改進版的方案。	\N	2025-06-01	2025-06-14	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
76	5	\N	整理整體計畫，撰寫學習過程與結果的總結報告。	\N	2025-06-15	2025-06-28	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
77	5	\N	在學習結束後，準備一場簡報，向其他學員、導師或相關人員分享學習成果，並總結學習經驗。	\N	2025-06-29	2025-07-12	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
78	6	\N	腦科學入門與大腦功能	\N	2025-02-09	2025-02-22	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
79	6	\N	製作筆記、網頁，拍短影片分享	\N	2025-02-23	2025-03-08	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
80	6	\N	飲食對腦健康的影響機制	\N	2025-03-09	2025-03-22	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
81	6	\N	製作筆記、網頁，拍短影片分享	\N	2025-03-23	2025-04-05	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
82	6	\N	腸道菌群與情緒的關聯	\N	2025-04-06	2025-04-19	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
83	6	\N	製作筆記、網頁，拍短影片分享	\N	2025-04-20	2025-05-03	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
84	6	\N	飲食與記憶力	\N	2025-05-04	2025-05-17	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
85	6	\N	製作筆記、網頁，拍短影片分享	\N	2025-05-18	2025-05-31	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
86	6	\N	情緒管理與壓力調節中的飲食角色	\N	2025-06-01	2025-06-14	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
87	6	\N	製作筆記、網頁，拍短影片分享	\N	2025-06-15	2025-06-28	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
88	6	\N	總結心得，可能的話辦一個小型分享會（或者以此為標準製作心得）	\N	2025-06-29	2025-07-12	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
89	7	\N	Cc	\N	2025-02-09	2025-02-22	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
90	7	\N	Cc	\N	2025-02-23	2025-03-08	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
91	7	\N	Cc	\N	2025-03-09	2025-03-22	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
92	7	\N	Cc	\N	2025-03-23	2025-04-05	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
93	7	\N	Cc	\N	2025-04-06	2025-04-19	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
94	7	\N	Cc	\N	2025-04-20	2025-05-03	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
95	7	\N	Cc	\N	2025-05-04	2025-05-17	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
96	7	\N	Cc	\N	2025-05-18	2025-05-31	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
97	7	\N	Cc	\N	2025-06-01	2025-06-14	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
98	7	\N	Cccc	\N	2025-06-15	2025-06-28	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
99	7	\N	Cc	\N	2025-06-29	2025-07-12	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
100	8	\N	探索：你的主題要寫什麼呢？	\N	2025-02-09	2025-02-22	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
101	8	\N	開始書寫	\N	2025-02-23	2025-03-08	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
102	8	\N	書寫	\N	2025-03-09	2025-03-22	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
103	8	\N	書寫	\N	2025-03-23	2025-04-05	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
104	8	\N	書寫	\N	2025-04-06	2025-04-19	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
105	8	\N	書寫	\N	2025-04-20	2025-05-03	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
106	8	\N	書寫	\N	2025-05-04	2025-05-17	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
107	8	\N	書寫	\N	2025-05-18	2025-05-31	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
108	8	\N	書寫	\N	2025-06-01	2025-06-14	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
109	8	\N	書寫	\N	2025-06-15	2025-06-28	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
110	8	\N	書寫	\N	2025-06-29	2025-07-12	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
111	9	\N	cc	\N	2025-02-09	2025-02-22	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
112	9	\N	cc	\N	2025-02-23	2025-03-08	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
113	9	\N	cc	\N	2025-03-09	2025-03-22	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
114	9	\N	cc	\N	2025-03-23	2025-04-05	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
115	9	\N	cc	\N	2025-04-06	2025-04-19	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
116	9	\N	cc	\N	2025-04-20	2025-05-03	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
117	9	\N	cc	\N	2025-05-04	2025-05-17	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
118	9	\N	cc	\N	2025-05-18	2025-05-31	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
119	9	\N	cc	\N	2025-06-01	2025-06-14	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
120	9	\N	cc	\N	2025-06-15	2025-06-28	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
121	9	\N	cc	\N	2025-06-29	2025-07-12	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
122	10	\N	工作面：設計課程行銷企劃書	\N	2025-02-09	2025-02-15	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
123	10	\N	學習面：參加公司內部訓練輕鬆學Canva 簡報視覺設計	\N	2025-02-16	2025-02-22	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
124	10	\N	學習面：訓練規劃暨執行管理師認證班	\N	2025-02-23	2025-03-01	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
125	10	\N	學習面：訓練規劃暨執行管理師認證班	\N	2025-03-02	2025-03-08	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
126	10	\N	學習面：訓練規劃暨執行管理師認證班	\N	2025-03-09	2025-03-15	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
127	10	\N	學習面：XChangeBD 實戰談「LinkedIn 拓展」	\N	2025-03-16	2025-03-22	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
128	10	\N	工作面：設計發想課程行銷電子報	\N	2025-03-23	2025-03-29	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
129	10	\N	工作面：與主管對焦課程行銷電子報	\N	2025-03-30	2025-04-05	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
130	10	\N	學習面：XChangeBD 實戰談「客戶關係深耕」	\N	2025-04-06	2025-04-12	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
131	10	\N	學習面：XChangeBD 實戰談「解構商業模式」	\N	2025-04-13	2025-04-19	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
132	10	\N	學習面：強化個人溝通力，提升工作效能	\N	2025-04-20	2025-04-26	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
133	10	\N	學習面：新媒體AI社群行銷-善用智慧AI，讓社群文案脫穎而出	\N	2025-04-27	2025-05-03	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
134	10	\N	學習面：XChangeBD 思維升級「顧問方法」	\N	2025-05-04	2025-05-10	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
135	10	\N	工作面：試想預計開設課程主題、對象	\N	2025-05-11	2025-05-17	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
136	10	\N	工作面：與主管約面談討論可行度	\N	2025-05-18	2025-05-24	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
138	10	\N	工作面：市場調查課程主題	\N	2025-06-01	2025-06-07	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
139	10	\N	工作面：陌生開發尋覓適合講師	\N	2025-06-08	2025-06-14	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
140	10	\N	工作面：設計課程社群交流	\N	2025-06-15	2025-06-21	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
141	10	\N	工作面：上架課程規劃	\N	2025-06-22	2025-06-28	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
142	10	\N	工作面：發想粉絲專頁文案	\N	2025-06-29	2025-07-05	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
143	10	\N	學習面：分享這半年左右的各方面收穫	\N	2025-07-06	2025-07-12	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
144	11	\N	制定詳細的計畫＆開始閱讀／寫作	\N	2025-02-09	2025-02-22	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
145	11	\N	選擇平台建立個人部落格＆上傳文章	\N	2025-02-23	2025-03-08	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
146	11	\N	讀完《精準寫作》並完成讀書筆記（可寫成文章上傳）	\N	2025-03-09	2025-03-22	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
147	11	\N	學習SEO相關知識並應用於部落格經營	\N	2025-03-23	2025-04-05	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
148	11	\N	練習影評寫作	\N	2025-04-06	2025-04-19	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
149	11	\N	練習社會觀點寫作	\N	2025-04-20	2025-05-03	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
150	11	\N	練習經濟市場分析寫作	\N	2025-05-04	2025-05-17	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
151	11	\N	繼續寫作	\N	2025-05-18	2025-05-31	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
152	11	\N	繼續寫作	\N	2025-06-01	2025-06-14	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
153	11	\N	繼續寫作	\N	2025-06-15	2025-06-28	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
154	11	\N	總結、反思	\N	2025-06-29	2025-07-12	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
155	12	\N	確認需求	\N	2025-02-09	2025-02-15	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
156	12	\N	確認 wordpress 主題	\N	2025-02-16	2025-02-22	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
157	12	\N	建立網站架構	\N	2025-02-23	2025-03-01	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
158	12	\N	蒐集需要的資料	\N	2025-03-02	2025-03-08	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
159	12	\N	蒐集需要的資料	\N	2025-03-09	2025-03-15	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
160	12	\N	在本機開發	\N	2025-03-16	2025-03-22	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
161	12	\N	在本機開發	\N	2025-03-23	2025-03-29	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
162	12	\N	在本機開發	\N	2025-03-30	2025-04-05	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
163	12	\N	在本機開發	\N	2025-04-06	2025-04-12	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
164	12	\N	在本機開發	\N	2025-04-13	2025-04-19	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
165	12	\N	在本機開發	\N	2025-04-20	2025-04-26	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
166	12	\N	在本機開發	\N	2025-04-27	2025-05-03	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
167	12	\N	在本機開發	\N	2025-05-04	2025-05-10	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
168	12	\N	在本機開發	\N	2025-05-11	2025-05-17	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
169	12	\N	在本機開發	\N	2025-05-18	2025-05-24	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
170	12	\N	在本機開發	\N	2025-05-25	2025-05-31	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
171	12	\N	在本機開發	\N	2025-06-01	2025-06-07	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
172	12	\N	在本機開發	\N	2025-06-08	2025-06-14	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
173	12	\N	在本機開發	\N	2025-06-15	2025-06-21	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
174	12	\N	找適合的主機	\N	2025-06-22	2025-06-28	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
175	12	\N	部署與上架	\N	2025-06-29	2025-07-05	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
176	12	\N	網站後台教學使用	\N	2025-07-06	2025-07-12	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
177	13	\N	瞭解手機性能，認識攝影基礎概念	\N	2025-02-09	2025-02-22	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
178	13	\N	基礎構圖技巧 學習色彩氛圍搭配	\N	2025-02-23	2025-03-08	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
179	13	\N	穩定拍攝防止振動並且熟悉手機相機	\N	2025-03-09	2025-03-22	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
180	13	\N	對焦與主題物突出拍攝	\N	2025-03-23	2025-04-05	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
181	13	\N	人像照片的學習	\N	2025-04-06	2025-04-19	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
182	13	\N	動態與小物件的拍攝	\N	2025-04-20	2025-05-03	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
183	13	\N	學習夜景拍攝可以定主題進行主題拍攝	\N	2025-05-04	2025-05-17	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
184	13	\N	創意構圖與倒影	\N	2025-05-18	2025-05-31	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
185	13	\N	照片基礎後期	\N	2025-06-01	2025-06-14	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
186	13	\N	主題系列創作	\N	2025-06-15	2025-06-28	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
187	13	\N	回顧與總結提升	\N	2025-06-29	2025-07-12	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
188	14	\N	找尋AI的相關資訊	\N	2025-02-09	2025-02-22	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
189	14	\N	開始閱讀和參與討論	\N	2025-02-23	2025-03-08	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
190	14	\N	實際操作和觀摩	\N	2025-03-09	2025-03-22	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
191	14	\N	利用特定議題處理教案1	\N	2025-03-23	2025-04-05	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
192	14	\N	利用特定議題處理教案2	\N	2025-04-06	2025-04-19	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
193	14	\N	利用特定議題處理教案3	\N	2025-04-20	2025-05-03	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
194	14	\N	利用特定議題處理教案4	\N	2025-05-04	2025-05-17	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
195	14	\N	利用特定議題處理教案5	\N	2025-05-18	2025-05-31	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
196	14	\N	和專家學者討論分享處理的過程1	\N	2025-06-01	2025-06-14	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
197	14	\N	和專家學者討論分享處理的過程2	\N	2025-06-15	2025-06-28	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
198	14	\N	和專家學者討論學習後是否可以再更上一層樓的方向	\N	2025-06-29	2025-07-12	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
199	15	\N	熟悉編輯器、 HTML 基礎	\N	2025-02-09	2025-02-22	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
200	15	\N	CSS 基礎	\N	2025-02-23	2025-03-08	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
201	15	\N	使用 CSS 變更 HTML 標籤特性（一）	\N	2025-03-09	2025-03-22	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
202	15	\N	使用 CSS 變更 HTML 標籤特性（二）	\N	2025-03-23	2025-04-05	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
203	15	\N	Flex 網頁排版技巧（一）	\N	2025-04-06	2025-04-19	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
204	15	\N	Flex 網頁排版技巧（二）、Flex 精神時光屋（一）	\N	2025-04-20	2025-05-03	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
205	15	\N	Flex 精神時光屋（二）	\N	2025-05-04	2025-05-17	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
206	15	\N	網頁排版技巧 Part 2、切圖技巧（一）	\N	2025-05-18	2025-05-31	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
207	15	\N	切圖技巧（二）、表格與表單設計技巧（一）	\N	2025-06-01	2025-06-14	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
208	15	\N	表格與表單設計技巧（二）、CSS3 技巧	\N	2025-06-15	2025-06-28	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
209	15	\N	進階技巧、實戰講解	\N	2025-06-29	2025-07-12	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
210	16	\N	基礎練習＋發布社群平台	\N	2025-02-09	2025-02-22	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
211	16	\N	基礎練習＋發佈，嘗試接案 or 投履歷	\N	2025-02-23	2025-03-08	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
212	16	\N	基礎練習＋發佈，嘗試接案 or 投履歷	\N	2025-03-09	2025-03-22	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
213	16	\N	基礎練習＋發佈，嘗試接案 or 投履歷	\N	2025-03-23	2025-04-05	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
214	16	\N	進階練習＋發佈，嘗試接案 or 投履歷，建立清楚的工作流程	\N	2025-04-06	2025-04-19	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
215	16	\N	進階練習＋發佈，嘗試接案 or 投履歷，建立清楚的工作流程	\N	2025-04-20	2025-05-03	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
216	16	\N	進階練習＋發佈，嘗試接案 or 投履歷，釐清自己的市場定位	\N	2025-05-04	2025-05-17	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
217	16	\N	進階練習＋發佈，嘗試接案 or 投履歷，釐清自己的市場定位	\N	2025-05-18	2025-05-31	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
218	16	\N	進階練習＋發佈，嘗試接案 or 投履歷，釐清未來增能方向	\N	2025-06-01	2025-06-14	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
219	16	\N	進階練習＋發佈，嘗試接案 or 投履歷，釐清未來增能方向	\N	2025-06-15	2025-06-28	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
220	16	\N	進階練習＋發佈，嘗試接案 or 投履歷，釐清未來增能方向	\N	2025-06-29	2025-07-12	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
221	17	\N	重新建立習慣	\N	2025-02-09	2025-02-22	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
222	17	\N	釐清目標	\N	2025-02-23	2025-03-08	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
223	17	\N	有固定頻率的在品味茶與咖啡，並製作心得	\N	2025-03-09	2025-03-22	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
224	17	\N	頻繁接觸相關的活動，認識人也讓別人認識自己	\N	2025-03-23	2025-04-05	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
225	17	\N	準備實地探索與田野調查	\N	2025-04-06	2025-04-19	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
226	17	\N	和已經認識的人聯絡，計劃如何到他們的工作環境觀察	\N	2025-04-20	2025-05-03	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
227	17	\N	留在田野當中訪問，與人互動	\N	2025-05-04	2025-05-17	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
228	17	\N	整理收集到的資料	\N	2025-05-18	2025-05-31	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
229	17	\N	準備成果的展示	\N	2025-06-01	2025-06-14	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
230	17	\N	成果分享	\N	2025-06-15	2025-06-28	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
231	17	\N	紀錄整份馬拉松的學習過程與反思	\N	2025-06-29	2025-07-12	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
232	18	\N	了解心理學、諮商輔導這條路會遇到的事情、困境困難，與優勢劣勢，從事這份工作的人的心得感想。並記錄下來。	\N	2025-02-09	2025-02-22	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
233	18	\N	1.心理學相關影片收集及了解觀看，並記錄存取有興趣或是想分享的諮商輔導相關知識。2.了解相關大學管道。	\N	2025-02-23	2025-03-08	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
234	18	\N	空大心理學教科書閱讀。(初步了解大)(對閱讀不擅長，需長時間適應)	\N	2025-03-09	2025-03-22	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
235	18	\N	心理學、諮商輔導相關書籍閱讀並抓起重點和實用的技巧。(不是教科書，是for日常生活化、漫畫	\N	2025-03-23	2025-04-05	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
236	18	\N	空大心理學相關書籍延伸學習(剛好空大考試週，運用筆記、心智圖讓自己更清晰並且知道如何運用	\N	2025-04-06	2025-04-19	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
237	18	\N	尋找相關講座，與夥伴交流實際操作。(可能會變	\N	2025-04-20	2025-05-03	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
238	18	\N	閱讀心靈雞湯、各種生活議題等生活化書籍，並寫出心得。	\N	2025-05-04	2025-05-17	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
239	18	\N	從podcast中尋找喜歡的內容，並且找到有練習輔導諮商對話，說話的藝術等等內容並記錄或開口練習。	\N	2025-05-18	2025-05-31	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
240	18	\N	如果可以的話，希望有機會可以進行相關實習。(不一定這週	\N	2025-06-01	2025-06-14	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
241	18	\N	在展賦上班或一對一輔導時，適時與學生對話聊天並觀察其中的行為與言語，並瞭解他們在想什麼，從中得到一點點的經驗。(不一定是這週，可能每週時不時都會發生	\N	2025-06-15	2025-06-28	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
242	18	\N	準備成果發表，利用簡報或是實際練習體驗呈現分享。	\N	2025-06-29	2025-07-12	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
243	19	\N	準備期 - 基礎強化與翻唱規劃	\N	2025-02-09	2025-02-22	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
244	19	\N	吉他精進與人聲錄製實驗	\N	2025-02-23	2025-03-08	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
245	19	\N	深入混音技巧與歌曲細化:強化混音技巧、完成翻唱初版	\N	2025-03-09	2025-03-22	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
246	19	\N	和弦進階與編曲結構	\N	2025-03-23	2025-04-05	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
247	19	\N	加入音色與背景細節	\N	2025-04-06	2025-04-19	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
248	19	\N	影片製作準備與初步剪輯	\N	2025-04-20	2025-05-03	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
249	19	\N	風格挑戰與多層次編曲:翻唱竇靖童的一首歌，挑戰新風格編曲。	\N	2025-05-04	2025-05-17	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
250	19	\N	隨後期計畫調整。	\N	2025-05-18	2025-05-31	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
251	19	\N	隨後期計畫調整。	\N	2025-06-01	2025-06-14	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
252	19	\N	隨後期計畫調整。	\N	2025-06-15	2025-06-28	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
253	19	\N	隨後期計畫調整。	\N	2025-06-29	2025-07-12	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
254	20	\N	提升導覽能力PART1-分析落選原因	\N	2025-02-09	2025-02-22	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
255	20	\N	提升導覽能力PART2-文獻閱讀	\N	2025-02-23	2025-03-08	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
256	20	\N	提升導覽能力PART3-針對現狀改善	\N	2025-03-09	2025-03-22	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
257	20	\N	提升導覽能力PART4-綜合回顧	\N	2025-03-23	2025-04-05	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
258	20	\N	英語口說能力提升PART1-長篇幅口說練習	\N	2025-04-06	2025-04-19	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
259	20	\N	英語口說能力提升PART2-自家介紹練習	\N	2025-04-20	2025-05-03	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
260	20	\N	導覽旅程設計PART1-擇定主題	\N	2025-05-04	2025-05-17	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
261	20	\N	導覽旅程設計PART2-建立導覽敘事	\N	2025-05-18	2025-05-31	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
262	20	\N	導覽旅程設計PART3-路線設計	\N	2025-06-01	2025-06-14	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
263	20	\N	導覽旅程設計PART4-上線前試驗	\N	2025-06-15	2025-06-28	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
264	20	\N	導覽旅程設計PART5-帶領一場自己規劃的導覽旅程	\N	2025-06-29	2025-07-12	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
265	21	\N	作詞	\N	2025-02-09	2025-02-22	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
266	21	\N	看第一部編曲影片	\N	2025-02-23	2025-03-08	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
267	21	\N	完成第一首曲子	\N	2025-03-09	2025-03-22	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
268	21	\N	蒐集第二首歌的素材，並完成歌詞	\N	2025-03-23	2025-04-05	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
269	21	\N	製作第二首的曲子	\N	2025-04-06	2025-04-19	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
270	21	\N	完善第二首歌，並發佈在個人社交平台	\N	2025-04-20	2025-05-03	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
271	21	\N	蒐集第三首歌的素材，並完成作詞	\N	2025-05-04	2025-05-17	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
272	21	\N	製作第三首歌的編曲	\N	2025-05-18	2025-05-31	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
273	21	\N	完成第三首歌，並發佈到個人社交平台	\N	2025-06-01	2025-06-14	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
274	21	\N	彙整心得與反思	\N	2025-06-15	2025-06-28	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
275	21	\N	製作成完整的學習報告	\N	2025-06-29	2025-07-12	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
276	22	\N	了解各地基金會	\N	2025-02-09	2025-02-22	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
277	22	\N	了解打工換宿實際情況	\N	2025-02-23	2025-03-08	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
278	22	\N	規劃路線	\N	2025-03-09	2025-03-22	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
279	22	\N	購買必須物、看診準備常用藥	\N	2025-03-23	2025-04-05	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
280	22	\N	開始計劃志工期間的事物	\N	2025-04-06	2025-04-19	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
281	22	\N	開始行動（台北出發一路往南）	\N	2025-04-20	2025-05-03	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
282	22	\N	各地基金會	\N	2025-05-04	2025-05-17	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
283	22	\N	各地基金會	\N	2025-05-18	2025-05-31	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
284	22	\N	各地基金會	\N	2025-06-01	2025-06-14	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
285	22	\N	各地學校、機構	\N	2025-06-15	2025-06-28	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
286	22	\N	可進入更深層的交流、幫助	\N	2025-06-29	2025-07-12	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
\.


--
-- Data for Name: note; Type: TABLE DATA; Schema: public; Owner: daodao
--

COPY public.note (id, project_id, week, title, description, date, img_url, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: old_activities; Type: TABLE DATA; Schema: public; Owner: daodao
--

COPY public.old_activities (mongo_id, "userId", title, "photoURL", "photoAlt", category, area, "time", "partnerStyle", "partnerEducationStep", description, "tagList", "isGrouping", "createdDate", "updatedDate", __v, "activityCategory", content, deadline, "isNeedDeadline", motivation, notice, outcome, participator, views, created_at, created_by, updated_at, updated_by) FROM stdin;
66e1811bf8d58801f0e11fee	66cc9ef2f8d58801f0e11bf7	遊戲化產品開發—Journey	https://image.daoedu.tw/5716ba50-fee3-4407-8d12-2351877888b7		{綜合型學習資源,商業與社會創新}	{線上}	Every Sunday 17:00-18:00	UXUI 設計師、遊戲美術、動畫師	{不設限}	- 適合喜歡從 0-1 的人\n- 有人帶領軟體開發，沒有經驗也沒關係，但要有毅力和克服困難的勇氣\n- 歡迎對人生有想法和喜歡創造做產品的人\n- 來信請附上作品集和為什麼想要參與，或約時間聊聊\n- 網址：https://cactus.pse.is/6f2ufl	{產品開發}	t	2024-09-11 11:38:03	2024-11-17 04:12:53	5	{專案,其他}	* 請填寫表單： [https://forms.gle/mAiKaZCeHqB7UUZp9](https://forms.gle/mAiKaZCeHqB7UUZp9)\n* 來信請附上作品集和為什麼想要參與，或約時間聊聊\n* 適合喜歡從 0-1 的人\n* 有人帶領軟體開發，沒有經驗也沒關係，但要有毅力和克服困難的勇氣\n* 歡迎對人生有想法和喜歡創造做產品的人\n* 網址： [https://cactus.pse.is/6f2ufl](https://cactus.pse.is/6f2ufl)	2024-11-22 03:56:33	f	幫助人類社會更好，讓每個人都能探索人生的可能性	* 每週一次開會，可請假\n* 有任何想法和問題請務必提出\n* 加入後，請找時間完成《個人使用說明書》	上架 APP	6	0	2025-01-30 17:08:40.868723	airflow	2025-01-30 17:08:40.869083	airflow
66e1855af8d58801f0e1212f	66cc9ef2f8d58801f0e11bf7	學習型 Youtube 頻道	https://image.daoedu.tw/428c307a-2a9d-479a-b226-a642f89a8be0		{藝術,綜合型學習資源,學習/教學工具,商業與社會創新,生活}	{線上,台北市}		Vtuber 設計師、企劃人才、剪輯師	{不設限}	頻道：https://www.youtube.com/@CactusFlower_STU\n- 適合喜歡從 0-1 的人\n- 影音企劃、繪圖人才歡迎\n- 工具、教材已有\n- 影音將會出現在 Youtube 上\n- 請附上作品集和個人經驗，或約時間聊聊\n- 網址：https://cactus.pse.is/6f2ufl	{影音,Vtuber}	t	2024-09-11 11:56:10	2024-12-06 13:14:24	5	{活動,專案}	頻道： [https://www.youtube.com/@CactusFlower\\_STU](https://www.youtube.com/@CactusFlower_STU)\n\n* 請填寫表單： [https://forms.gle/mAiKaZCeHqB7UUZp9](https://forms.gle/mAiKaZCeHqB7UUZp9)\n* 適合喜歡從 0-1 的人\n* 影音企劃、繪圖人才歡迎\n* 工具、教材已有\n* 影音將會出現在 Youtube 上，目前可先不以 V 形式\n* 請附上作品集和個人經驗，或約時間聊聊\n* 網址： [https://cactus.pse.is/6f2ufl](https://cactus.pse.is/6f2ufl)	2024-11-22 03:56:33	f	幫助人類社會更好，讓每個人都能探索人生	* 每週一次開會，可請假\n* 有任何想法和問題請務必提出\n* 加入後，請找時間完成《個人使用說明書》	跟市場間接，一起持續錄製影片	3	0	2025-01-30 17:08:40.868723	airflow	2025-01-30 17:08:40.869083	airflow
66e1b0c2f8d58801f0e12236	669e0d96256188da6f9c4ec9	[台北訪談] 街頭美食和國家認同的關係 by 以色列人類學研究生	https://image.daoedu.tw/710372c1-280f-4d1e-a1b4-7daf8b938d52		{人文社會,語言與文學}	{台北市}	2024/9/8-2024/10/12 	18-35歲在台北的青年	{}	#台灣街頭美食與國家認同的關係 #英文訪談\n「我覺得台灣讓我有家的感覺」，這是我親愛的以色列好友 Adi Rosenstock第二次來台灣時和我說的話，她熱愛台灣人，熱愛台灣美食（圖片即為第二次來台我們帶她到鹿港老街永和豆漿捏她最愛的小籠包）。於是Adi 把她的人類所碩士論文題目訂為「街頭美食和國家認同的關係」，並以在台北的青年人為主。\n而 Adi 這次三訪台灣，她想要找 #在台北 #青年人 聊聊喜歡的街頭美食以及自己對國家認同的看法，你可以約在你喜歡的美食店，費用會由 Adi 出，訪談過程會以英文輕鬆聊天的方式進行。光想到以人類學、不同國家與文化的視角談街頭美食與國家認同，就覺得令人興奮，也很期待研究成果！\n\n有興趣的夥伴歡迎填寫表單：https://forms.gle/zFM7RBFkoUPDaGvz5\n\n-- 以下為 Adi 原文：\nHey everyone! 大家好！\nI’m so happy to share that I’m in Taipei to make a dream come true! I’m Adi, and I’m in Taiwan working on my anthropological thesis.\nMy research explores how street food connects with national identity among young adults in Taipei, Taiwan.\nI’m looking to chat with Taiwanese young adults (ages 18-32) about street food, life in Taipei, and how these experiences shape national identity. We’d have a 45-90 minute conversation, and of course, snacks and drinks are on me! The interview will be in English, as my Chinese isn’t so good.\nIf you’re interested, please sign up here: https://forms.gle/zFM7RBFkoUPDaGvz5 .\nI promise it’ll be a fun and insightful experience!\nIf you have any questions, you are more then welcome to connect with me here on Facebook, email me at rosenstockadi@gmail.com, or reach out via LINE: adiro23.\nPlease feel free to share this with any friends who may be interested. Thank you very much, and I look forward to meeting you soon!\n\n哈囉你好！我叫Adi，是來自以色列本古里安大學的27歲人類學研究員。\n五年前我第一次來到台灣，就深深愛上了台灣的人們和食物！\n因此我將我的人類學碩士論文題目訂為街頭美食和國家認同的關係，並以台北年輕人為主進行研究。\n而這一次是我第三次來台灣，我很期待能學習更多，並進行訪談。\n此份資料是用來安排訪談時間的。\n訪談地點將在台北，而確切時間與地點將在你填寫完資料後以Email討論。\n飲料和小吃的費用將由我來付 🙂\n訪談將以英語進行，預計訪談45～90分鐘，訪談將會錄音，僅用於研究目的，所有資訊將會保密。\n\n非常感謝你的參與，這對於我完成論文有很大的幫助。\n期待與你見面	{國家認同,訪談,街頭美食}	t	2024-09-11 15:01:22	2024-09-11 15:01:22	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-01-30 17:08:40.868723	airflow	2025-01-30 17:08:40.869083	airflow
66e3f881f8d58801f0e12684	66a8aef6d120a90509710fd2	《重塑組織》讀書會－研究如何經營「自主管理」、「身心完整」及「使命驅動」的組織	https://image.daoedu.tw/c520fdf7-70dd-4d24-9553-d56a366d4909		{商業與社會創新}	{線上}	預計10月起，實際活動時間與頻率由夥伴共同決議	對如何創造身心完整並彼此共好的社群有興趣的人	{}	如果有參加2024IDEC in Taiwan是執行團隊的人，或是聽過貍想教育創辦人演講那場，\n應該有略略聽過「青色組織」這個詞。\n\n我自己則是在貍想教育創新學院體驗過青色組織後，\n才知道這種「自主管理」、「身心完整」及「使命驅動」的組織概念是出自於《重塑組織》這本書。\n\n我認為這種重視身心完整，信任夥伴的價值觀與民主教育的概念非常契合；\n對於已出社會但仍舊受體制所苦，找不到自我價值的社會人士們，這本書也能提供一個全新的觀點，讓你知道除了內省去適應社會外，其實可以透由改變環境（打造青色組織）來創造不用內耗，扁平化透明化的組織模式。\n\n我相信如果這種團隊模式可以擴展到學校、公司甚至是社會，所有人都能身心完整、彼此共榮共好。\n為了能完成這樣的心願，就要從概念最源頭的書開始讀起！\n\n｜讀書會模式｜\n閱讀的同時直接實作，本讀書會將以青色組織執行，親自體驗「自主管理」、「身心完整」及「使命驅動」。\n第一期會先線上彼此認識，並一起決定＂大家想要的讀書會是什麼樣子＂。\n在決定執行方式後，後續讀書會便以討論出來的形式進行。\n\n｜需求人數｜目前已有2位，希望再招2位	{}	f	2024-09-13 08:32:01	2024-09-16 02:30:09	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-01-30 17:08:40.868723	airflow	2025-01-30 17:08:40.869083	airflow
66e6f1e2f8d58801f0e12b96	66a203d2d120a9050971096a	Marketing Project Sharing 社群行銷小聚	https://image.daoedu.tw/5ca238ae-dfc2-4c43-9766-da2aa8a524a2		{商業與社會創新,綜合型學習資源,人文社會}	{線上}	10月中開始 兩週一次	對社群行銷有興趣、時常潛水的活網仔	{}	Hi 我是一個不專業前行銷人，即使脫離行銷產業，還是很沈迷於社群網路，想揪一群人一起聊聊近期社群趨勢或感興趣的行銷點子，最終目的是活絡島島阿學的自媒體，期望透過群體討論激發出火花，用島島的媒體社群做個社會實驗！\n\n以下是讀書會的小規則！期望可常態性舉辦！\n\n🤙 Rule\n- 參加者輪流主持\n- 兩週舉辦一次，兩週時間可根據題目準備內容\n- 感受是主觀的，勿批評謾罵，但歡迎提出想法\n- 不懂就問！你不會是孤單ㄉ那一個\n\n🤙 Week #1\n- 1 件你覺得不錯的行銷專案，包含但不限於社群流行趨勢、影片題材、聳動文案、會抓住注意力的行銷點子都行\n- 2 個關於 sharing 的 Pros & Cons\n- 1 個小小 workshop 例如討論如果是島島可切入的點 / 準備問題問大家\n- 15 分鐘你可以暢所欲言\n\n有興趣者可到島島阿學 Discord #社群媒體討論	{行銷,讀書會,社群媒體,不專業分析}	t	2024-09-15 14:40:34	2024-09-15 14:42:50	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-01-30 17:08:40.868723	airflow	2025-01-30 17:08:40.869083	airflow
66e9a489f8d58801f0e12eb9	66a203d2d120a9050971096a	島島咖啡社 咖啡亂聊交流大會	https://image.daoedu.tw/10677533-557b-4cdf-ae15-f05933819f49		{生活}	{線上}	隨時 只要在島島 discord #咖啡社 	咖啡愛好者、有興趣嘗試手沖咖啡的人	{}	咖啡亂聊，從烘豆、單品豆推薦、沖煮技巧、器材只要你覺得和咖啡有關都可以來湊咖聊\n歡迎加入島島 discord #咖啡社	{咖啡,手沖,盤}	t	2024-09-17 15:47:21	2024-09-17 15:48:38	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-01-30 17:08:40.868723	airflow	2025-01-30 17:08:40.869083	airflow
66ead00af8d58801f0e12f08	66e928a0f8d58801f0e12da9	找對資安安全意識程度及設計工作坊有興趣的國中跟高中生			{資訊與工程}	{線上,待討論,台北市}	2024/10/1~ 2024/11/31	對資訊安全有興趣的國高中生	{}	我過去在英國唸大學部的使用者經驗設計，之前大學有個研究工作坊的專案想要完成，大學的時候只有做一半，但是我想要延續我的資安及設計的設計研究，把我之前的資安桌遊完成，希望可以之後完成，邀請大家試玩且繼續進行研究。\n\n如果有興趣者，請填寫表單。\n\n連結如下：https://forms.gle/MycewT6ho4ZUnXFz8\n\n有任何問題，請聯絡 Email: chao.ling.chyou@gmail.com。\n\n\n感謝。\n\n\n	{}	t	2024-09-18 13:05:14	2024-09-20 16:53:48	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-01-30 17:08:40.868723	airflow	2025-01-30 17:08:40.869083	airflow
67176088a27d6db598ef5892	66f38459f8d58801f0e13451	英語口說 study group	https://image.daoedu.tw/23d00557-44f5-4202-aaf7-ec8ffcbe2103		{語言與文學}	{線上}	隔週三晚上 9:30-10:00	-想練習英文口說的夥伴	{大學以上}	隔週30分鐘累積英語表達自信及口說技巧。\n\n方式與特色：\n- 小組練習：每組 5 人，討論明確的學習目標，每月2~3次的30分鐘練習。\n- 表達訓練：提供英語母語人士的句型結構，訓練簡潔有力的口說。\n- 成就養成：利用社群培養固定練習英文的習慣，透過他人回饋增加信心。\n\n加入 discord 連結或 email 信箱\n提供您的英文名字和學習目標～\nhttps://discord.gg/8eum9v4S\n	{英文口說,學習小組}	t	2024-10-22 08:21:28	2024-10-22 08:21:28	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-01-30 17:08:40.868723	airflow	2025-01-30 17:08:40.869083	airflow
6732d21a231270609bef88d4	669e0d96256188da6f9c4ec9	[學習日誌馬拉松] 一起連續14天寫學習日誌！	https://image.daoedu.tw/e0e9c6f3-4906-40c0-8a39-01953d65f668		{教育,學習/教學工具}	{線上}	不限時間	想要養成每天紀錄學習日誌習慣的人、想要有人相互監督勉勵寫日誌的人	{不設限}	\N	{日誌,學習歷程檔案,學習紀錄,學習反思}	t	2024-11-12 03:57:14	2024-11-12 03:57:14	0	{其他}	你是否和我一樣，一直很想寫日誌，但是就是無法維持？\n或在學習的過程，即使學習目標不同，也想找人一起互相互監督與勉勵？\n想邀請你一起參加島島阿學 Discord 頻道的「學習日誌馬拉松」，你可以選擇挑戰連續 7 天、14 天寫學習日誌，又或者直接挑戰 30 天！\n寫學習日誌很簡單，只要簡單設定好預計學習任務和目標，就可以開始，只要每天睡前記得上去寫一下今天學習狀態與心得，一句話也可以，一個表情也可以，有開始就是好的開始。\n\n歡迎加入島島阿學 Discord，並找到「島島挑戰區」即可開始！\nhttps://discord.gg/2NbQ7cu6jH	2024-11-19 03:54:43	f	希望能找到更多夥伴一起參加學習馬拉松，讓寫學習日誌變得更有趣，增加寫的動機，也希望可以獲得更多回饋	1.以善意出發給予他人日誌回饋。\n2.Discord學習日誌皆為全公開，請自行斟酌撰寫內容。	透過每天寫學習日誌，回顧並反思自身學習狀態，並不斷彈性調整，同時也有助於讓腦袋更清晰身心更安定。	100	0	2025-01-30 17:08:40.868723	airflow	2025-01-30 17:08:40.869083	airflow
6732fc94231270609bef897e	6731eab1231270609bef808f	一起吃清大、交大學餐！	https://image.daoedu.tw/800d911d-a346-445f-8b0d-84d03f7fa98e		{生活}	{新竹市}	1230~1400	高中生、大學生、實驗教育學生、清大在校生、交大在校生	{高中,大學以上,不設限}	\N	{#吃飯局}	t	2024-11-12 06:58:28	2024-11-12 06:58:28	0	{其他}	一群高中自學團的朋友11/29要一起去參觀清大和交大+或許會旁聽課程，想說能順便找年紀差不多的人一起吃飯聊聊天、逛校園。\n單純是有點好奇揪團是否真的會成功，以及想找看看當天有清大或交大在校生能認識一下，一起逛逛校園之類的。\n（目前還不確定會不會去旁聽課程，以及課程時間，意思就是確切的時間要再慢慢討論）	2024-11-29 06:06:00	t	請看揪團內容與運作方式！	吃咖哩飯不能伴，火鍋不要加芋頭	在清大或交大吃到貢丸	1	0	2025-01-30 17:08:40.868723	airflow	2025-01-30 17:08:40.869083	airflow
67336f3e927c5a37b47270d1	669e6aa71c00fab9a9f88a00	甜點製作工作坊：一起動手做出美味甜點	https://image.daoedu.tw/29300bdf-bf25-4990-b0bf-10ce4de21f6a		{生活}	{新北市}	每週六下午 2:00 - 5:00，為期 4 週	喜歡甜點、願意動手實作的朋友們，不論有無經驗皆可參加。	{不設限}	頻道：https://www.youtube.com/@CactusFlower_STU\n- 適合喜歡從 0-1 的人\n- 影音企劃、繪圖人才歡迎\n- 工具、教材已有\n- 影音將會出現在 Youtube 上\n- 請附上作品集和個人經驗，或約時間聊聊\n- 網址：https://cactus.pse.is/6f2ufl	{甜點製作,手作甜點,團體活動,烘焙,學習交流}	f	2024-11-12 15:07:42	2024-11-17 01:41:37	7	{工作坊}	每週我們將共同製作不同的甜點，從基礎的**餅乾**、**布朗尼**到稍微進階的**提拉米蘇**。\n由我負責準備材料和工具，並提前提供製作配方。\n每次聚會我們將一起動手製作，並在過程中交流技巧和心得。\n工作坊最後一週，我們會舉行一個小小的甜點分享會，讓每位成員展示自己的成果。	2024-11-18 15:46:00	t	想要聚集一群對甜點製作感興趣的朋友，一起學習並交流技術。	1. 為確保場地和食材準備充足，請提前報名。\n2. 請自備保鮮盒或袋子，以便將成品帶回家。\n3. 若對某些食材過敏，請提前告知以便做出相應安排。	享受動手製作的成就感，並與夥伴建立良好的友誼。	5	0	2025-01-30 17:08:40.868723	airflow	2025-01-30 17:08:40.869083	airflow
6733706c927c5a37b472712f	66cc9ef2f8d58801f0e11bf7	完成人生夢想	https://image.daoedu.tw/4f7ee153-1905-41f0-8d1f-8369934dae03		{綜合型學習資源}	{線上}		不限	{不設限}	\N	{產品開發}	f	2024-11-12 15:12:44	2024-11-20 17:28:05	5	{其他}	* 請填寫表單：https://forms.gle/mAiKaZCeHqB7UUZp9\n* 適合喜歡從 0-1 的人\n* 網址：https://cactus.pse.is/6f2ufl	2024-11-19 15:04:11	t	每個人人生都有夢想，一起完成彼此的夢想吧	* 每週一次開會，可請假\n* 有任何想法和問題請務必提出\n* 加入後，請找時間完成《個人使用說明書》	築夢踏實	6	0	2025-01-30 17:08:40.868723	airflow	2025-01-30 17:08:40.869083	airflow
673974779daeb56dac510956	669dc382850bab2ba053a538	發起揪團	https://image.daoedu.tw/0cc8d96b-c3bc-41e5-8526-8c8a66e7d793		{藝術}	{線上}		夥伴	{不設限,大學以上,高中}	\N	{}	f	2024-11-17 04:43:35	2024-11-17 04:53:45	0	{其他}	**# Test**\n\n\\`\\`\\`html\n\\<h1>123\\</h1>\n\\`\\`\\`	2024-11-13 16:00:00	t	揪團動機	注意	期待成果	0	0	2025-01-30 17:08:40.868723	airflow	2025-01-30 17:08:40.869083	airflow
66e1811bf8d58801f0e11fee	66cc9ef2f8d58801f0e11bf7	遊戲化產品開發—Journey	https://image.daoedu.tw/5716ba50-fee3-4407-8d12-2351877888b7		{綜合型學習資源,商業與社會創新}	{線上}	Every Sunday 17:00-18:00	UXUI 設計師、遊戲美術、動畫師	{不設限}	- 適合喜歡從 0-1 的人\n- 有人帶領軟體開發，沒有經驗也沒關係，但要有毅力和克服困難的勇氣\n- 歡迎對人生有想法和喜歡創造做產品的人\n- 來信請附上作品集和為什麼想要參與，或約時間聊聊\n- 網址：https://cactus.pse.is/6f2ufl	{產品開發}	t	2024-09-11 11:38:03	2024-11-17 04:12:53	5	{專案,其他}	* 請填寫表單： [https://forms.gle/mAiKaZCeHqB7UUZp9](https://forms.gle/mAiKaZCeHqB7UUZp9)\n* 來信請附上作品集和為什麼想要參與，或約時間聊聊\n* 適合喜歡從 0-1 的人\n* 有人帶領軟體開發，沒有經驗也沒關係，但要有毅力和克服困難的勇氣\n* 歡迎對人生有想法和喜歡創造做產品的人\n* 網址： [https://cactus.pse.is/6f2ufl](https://cactus.pse.is/6f2ufl)	2024-11-22 03:56:33	f	幫助人類社會更好，讓每個人都能探索人生的可能性	* 每週一次開會，可請假\n* 有任何想法和問題請務必提出\n* 加入後，請找時間完成《個人使用說明書》	上架 APP	6	0	2025-01-31 00:00:03.305065	airflow	2025-01-31 00:00:03.305406	airflow
66e1855af8d58801f0e1212f	66cc9ef2f8d58801f0e11bf7	學習型 Youtube 頻道	https://image.daoedu.tw/428c307a-2a9d-479a-b226-a642f89a8be0		{藝術,綜合型學習資源,學習/教學工具,商業與社會創新,生活}	{線上,台北市}		Vtuber 設計師、企劃人才、剪輯師	{不設限}	頻道：https://www.youtube.com/@CactusFlower_STU\n- 適合喜歡從 0-1 的人\n- 影音企劃、繪圖人才歡迎\n- 工具、教材已有\n- 影音將會出現在 Youtube 上\n- 請附上作品集和個人經驗，或約時間聊聊\n- 網址：https://cactus.pse.is/6f2ufl	{影音,Vtuber}	t	2024-09-11 11:56:10	2024-12-06 13:14:24	5	{活動,專案}	頻道： [https://www.youtube.com/@CactusFlower\\_STU](https://www.youtube.com/@CactusFlower_STU)\n\n* 請填寫表單： [https://forms.gle/mAiKaZCeHqB7UUZp9](https://forms.gle/mAiKaZCeHqB7UUZp9)\n* 適合喜歡從 0-1 的人\n* 影音企劃、繪圖人才歡迎\n* 工具、教材已有\n* 影音將會出現在 Youtube 上，目前可先不以 V 形式\n* 請附上作品集和個人經驗，或約時間聊聊\n* 網址： [https://cactus.pse.is/6f2ufl](https://cactus.pse.is/6f2ufl)	2024-11-22 03:56:33	f	幫助人類社會更好，讓每個人都能探索人生	* 每週一次開會，可請假\n* 有任何想法和問題請務必提出\n* 加入後，請找時間完成《個人使用說明書》	跟市場間接，一起持續錄製影片	3	0	2025-01-31 00:00:03.305065	airflow	2025-01-31 00:00:03.305406	airflow
66e1b0c2f8d58801f0e12236	669e0d96256188da6f9c4ec9	[台北訪談] 街頭美食和國家認同的關係 by 以色列人類學研究生	https://image.daoedu.tw/710372c1-280f-4d1e-a1b4-7daf8b938d52		{人文社會,語言與文學}	{台北市}	2024/9/8-2024/10/12 	18-35歲在台北的青年	{}	#台灣街頭美食與國家認同的關係 #英文訪談\n「我覺得台灣讓我有家的感覺」，這是我親愛的以色列好友 Adi Rosenstock第二次來台灣時和我說的話，她熱愛台灣人，熱愛台灣美食（圖片即為第二次來台我們帶她到鹿港老街永和豆漿捏她最愛的小籠包）。於是Adi 把她的人類所碩士論文題目訂為「街頭美食和國家認同的關係」，並以在台北的青年人為主。\n而 Adi 這次三訪台灣，她想要找 #在台北 #青年人 聊聊喜歡的街頭美食以及自己對國家認同的看法，你可以約在你喜歡的美食店，費用會由 Adi 出，訪談過程會以英文輕鬆聊天的方式進行。光想到以人類學、不同國家與文化的視角談街頭美食與國家認同，就覺得令人興奮，也很期待研究成果！\n\n有興趣的夥伴歡迎填寫表單：https://forms.gle/zFM7RBFkoUPDaGvz5\n\n-- 以下為 Adi 原文：\nHey everyone! 大家好！\nI’m so happy to share that I’m in Taipei to make a dream come true! I’m Adi, and I’m in Taiwan working on my anthropological thesis.\nMy research explores how street food connects with national identity among young adults in Taipei, Taiwan.\nI’m looking to chat with Taiwanese young adults (ages 18-32) about street food, life in Taipei, and how these experiences shape national identity. We’d have a 45-90 minute conversation, and of course, snacks and drinks are on me! The interview will be in English, as my Chinese isn’t so good.\nIf you’re interested, please sign up here: https://forms.gle/zFM7RBFkoUPDaGvz5 .\nI promise it’ll be a fun and insightful experience!\nIf you have any questions, you are more then welcome to connect with me here on Facebook, email me at rosenstockadi@gmail.com, or reach out via LINE: adiro23.\nPlease feel free to share this with any friends who may be interested. Thank you very much, and I look forward to meeting you soon!\n\n哈囉你好！我叫Adi，是來自以色列本古里安大學的27歲人類學研究員。\n五年前我第一次來到台灣，就深深愛上了台灣的人們和食物！\n因此我將我的人類學碩士論文題目訂為街頭美食和國家認同的關係，並以台北年輕人為主進行研究。\n而這一次是我第三次來台灣，我很期待能學習更多，並進行訪談。\n此份資料是用來安排訪談時間的。\n訪談地點將在台北，而確切時間與地點將在你填寫完資料後以Email討論。\n飲料和小吃的費用將由我來付 🙂\n訪談將以英語進行，預計訪談45～90分鐘，訪談將會錄音，僅用於研究目的，所有資訊將會保密。\n\n非常感謝你的參與，這對於我完成論文有很大的幫助。\n期待與你見面	{國家認同,訪談,街頭美食}	t	2024-09-11 15:01:22	2024-09-11 15:01:22	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-01-31 00:00:03.305065	airflow	2025-01-31 00:00:03.305406	airflow
66e3f881f8d58801f0e12684	66a8aef6d120a90509710fd2	《重塑組織》讀書會－研究如何經營「自主管理」、「身心完整」及「使命驅動」的組織	https://image.daoedu.tw/c520fdf7-70dd-4d24-9553-d56a366d4909		{商業與社會創新}	{線上}	預計10月起，實際活動時間與頻率由夥伴共同決議	對如何創造身心完整並彼此共好的社群有興趣的人	{}	如果有參加2024IDEC in Taiwan是執行團隊的人，或是聽過貍想教育創辦人演講那場，\n應該有略略聽過「青色組織」這個詞。\n\n我自己則是在貍想教育創新學院體驗過青色組織後，\n才知道這種「自主管理」、「身心完整」及「使命驅動」的組織概念是出自於《重塑組織》這本書。\n\n我認為這種重視身心完整，信任夥伴的價值觀與民主教育的概念非常契合；\n對於已出社會但仍舊受體制所苦，找不到自我價值的社會人士們，這本書也能提供一個全新的觀點，讓你知道除了內省去適應社會外，其實可以透由改變環境（打造青色組織）來創造不用內耗，扁平化透明化的組織模式。\n\n我相信如果這種團隊模式可以擴展到學校、公司甚至是社會，所有人都能身心完整、彼此共榮共好。\n為了能完成這樣的心願，就要從概念最源頭的書開始讀起！\n\n｜讀書會模式｜\n閱讀的同時直接實作，本讀書會將以青色組織執行，親自體驗「自主管理」、「身心完整」及「使命驅動」。\n第一期會先線上彼此認識，並一起決定＂大家想要的讀書會是什麼樣子＂。\n在決定執行方式後，後續讀書會便以討論出來的形式進行。\n\n｜需求人數｜目前已有2位，希望再招2位	{}	f	2024-09-13 08:32:01	2024-09-16 02:30:09	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-01-31 00:00:03.305065	airflow	2025-01-31 00:00:03.305406	airflow
66e6f1e2f8d58801f0e12b96	66a203d2d120a9050971096a	Marketing Project Sharing 社群行銷小聚	https://image.daoedu.tw/5ca238ae-dfc2-4c43-9766-da2aa8a524a2		{商業與社會創新,綜合型學習資源,人文社會}	{線上}	10月中開始 兩週一次	對社群行銷有興趣、時常潛水的活網仔	{}	Hi 我是一個不專業前行銷人，即使脫離行銷產業，還是很沈迷於社群網路，想揪一群人一起聊聊近期社群趨勢或感興趣的行銷點子，最終目的是活絡島島阿學的自媒體，期望透過群體討論激發出火花，用島島的媒體社群做個社會實驗！\n\n以下是讀書會的小規則！期望可常態性舉辦！\n\n🤙 Rule\n- 參加者輪流主持\n- 兩週舉辦一次，兩週時間可根據題目準備內容\n- 感受是主觀的，勿批評謾罵，但歡迎提出想法\n- 不懂就問！你不會是孤單ㄉ那一個\n\n🤙 Week #1\n- 1 件你覺得不錯的行銷專案，包含但不限於社群流行趨勢、影片題材、聳動文案、會抓住注意力的行銷點子都行\n- 2 個關於 sharing 的 Pros & Cons\n- 1 個小小 workshop 例如討論如果是島島可切入的點 / 準備問題問大家\n- 15 分鐘你可以暢所欲言\n\n有興趣者可到島島阿學 Discord #社群媒體討論	{行銷,讀書會,社群媒體,不專業分析}	t	2024-09-15 14:40:34	2024-09-15 14:42:50	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-01-31 00:00:03.305065	airflow	2025-01-31 00:00:03.305406	airflow
66e9a489f8d58801f0e12eb9	66a203d2d120a9050971096a	島島咖啡社 咖啡亂聊交流大會	https://image.daoedu.tw/10677533-557b-4cdf-ae15-f05933819f49		{生活}	{線上}	隨時 只要在島島 discord #咖啡社 	咖啡愛好者、有興趣嘗試手沖咖啡的人	{}	咖啡亂聊，從烘豆、單品豆推薦、沖煮技巧、器材只要你覺得和咖啡有關都可以來湊咖聊\n歡迎加入島島 discord #咖啡社	{咖啡,手沖,盤}	t	2024-09-17 15:47:21	2024-09-17 15:48:38	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-01-31 00:00:03.305065	airflow	2025-01-31 00:00:03.305406	airflow
66ead00af8d58801f0e12f08	66e928a0f8d58801f0e12da9	找對資安安全意識程度及設計工作坊有興趣的國中跟高中生			{資訊與工程}	{線上,待討論,台北市}	2024/10/1~ 2024/11/31	對資訊安全有興趣的國高中生	{}	我過去在英國唸大學部的使用者經驗設計，之前大學有個研究工作坊的專案想要完成，大學的時候只有做一半，但是我想要延續我的資安及設計的設計研究，把我之前的資安桌遊完成，希望可以之後完成，邀請大家試玩且繼續進行研究。\n\n如果有興趣者，請填寫表單。\n\n連結如下：https://forms.gle/MycewT6ho4ZUnXFz8\n\n有任何問題，請聯絡 Email: chao.ling.chyou@gmail.com。\n\n\n感謝。\n\n\n	{}	t	2024-09-18 13:05:14	2024-09-20 16:53:48	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-01-31 00:00:03.305065	airflow	2025-01-31 00:00:03.305406	airflow
67176088a27d6db598ef5892	66f38459f8d58801f0e13451	英語口說 study group	https://image.daoedu.tw/23d00557-44f5-4202-aaf7-ec8ffcbe2103		{語言與文學}	{線上}	隔週三晚上 9:30-10:00	-想練習英文口說的夥伴	{大學以上}	隔週30分鐘累積英語表達自信及口說技巧。\n\n方式與特色：\n- 小組練習：每組 5 人，討論明確的學習目標，每月2~3次的30分鐘練習。\n- 表達訓練：提供英語母語人士的句型結構，訓練簡潔有力的口說。\n- 成就養成：利用社群培養固定練習英文的習慣，透過他人回饋增加信心。\n\n加入 discord 連結或 email 信箱\n提供您的英文名字和學習目標～\nhttps://discord.gg/8eum9v4S\n	{英文口說,學習小組}	t	2024-10-22 08:21:28	2024-10-22 08:21:28	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-01-31 00:00:03.305065	airflow	2025-01-31 00:00:03.305406	airflow
6732d21a231270609bef88d4	669e0d96256188da6f9c4ec9	[學習日誌馬拉松] 一起連續14天寫學習日誌！	https://image.daoedu.tw/e0e9c6f3-4906-40c0-8a39-01953d65f668		{教育,學習/教學工具}	{線上}	不限時間	想要養成每天紀錄學習日誌習慣的人、想要有人相互監督勉勵寫日誌的人	{不設限}	\N	{日誌,學習歷程檔案,學習紀錄,學習反思}	t	2024-11-12 03:57:14	2024-11-12 03:57:14	0	{其他}	你是否和我一樣，一直很想寫日誌，但是就是無法維持？\n或在學習的過程，即使學習目標不同，也想找人一起互相互監督與勉勵？\n想邀請你一起參加島島阿學 Discord 頻道的「學習日誌馬拉松」，你可以選擇挑戰連續 7 天、14 天寫學習日誌，又或者直接挑戰 30 天！\n寫學習日誌很簡單，只要簡單設定好預計學習任務和目標，就可以開始，只要每天睡前記得上去寫一下今天學習狀態與心得，一句話也可以，一個表情也可以，有開始就是好的開始。\n\n歡迎加入島島阿學 Discord，並找到「島島挑戰區」即可開始！\nhttps://discord.gg/2NbQ7cu6jH	2024-11-19 03:54:43	f	希望能找到更多夥伴一起參加學習馬拉松，讓寫學習日誌變得更有趣，增加寫的動機，也希望可以獲得更多回饋	1.以善意出發給予他人日誌回饋。\n2.Discord學習日誌皆為全公開，請自行斟酌撰寫內容。	透過每天寫學習日誌，回顧並反思自身學習狀態，並不斷彈性調整，同時也有助於讓腦袋更清晰身心更安定。	100	0	2025-01-31 00:00:03.305065	airflow	2025-01-31 00:00:03.305406	airflow
6732fc94231270609bef897e	6731eab1231270609bef808f	一起吃清大、交大學餐！	https://image.daoedu.tw/800d911d-a346-445f-8b0d-84d03f7fa98e		{生活}	{新竹市}	1230~1400	高中生、大學生、實驗教育學生、清大在校生、交大在校生	{高中,大學以上,不設限}	\N	{#吃飯局}	t	2024-11-12 06:58:28	2024-11-12 06:58:28	0	{其他}	一群高中自學團的朋友11/29要一起去參觀清大和交大+或許會旁聽課程，想說能順便找年紀差不多的人一起吃飯聊聊天、逛校園。\n單純是有點好奇揪團是否真的會成功，以及想找看看當天有清大或交大在校生能認識一下，一起逛逛校園之類的。\n（目前還不確定會不會去旁聽課程，以及課程時間，意思就是確切的時間要再慢慢討論）	2024-11-29 06:06:00	t	請看揪團內容與運作方式！	吃咖哩飯不能伴，火鍋不要加芋頭	在清大或交大吃到貢丸	1	0	2025-01-31 00:00:03.305065	airflow	2025-01-31 00:00:03.305406	airflow
67336f3e927c5a37b47270d1	669e6aa71c00fab9a9f88a00	甜點製作工作坊：一起動手做出美味甜點	https://image.daoedu.tw/29300bdf-bf25-4990-b0bf-10ce4de21f6a		{生活}	{新北市}	每週六下午 2:00 - 5:00，為期 4 週	喜歡甜點、願意動手實作的朋友們，不論有無經驗皆可參加。	{不設限}	頻道：https://www.youtube.com/@CactusFlower_STU\n- 適合喜歡從 0-1 的人\n- 影音企劃、繪圖人才歡迎\n- 工具、教材已有\n- 影音將會出現在 Youtube 上\n- 請附上作品集和個人經驗，或約時間聊聊\n- 網址：https://cactus.pse.is/6f2ufl	{甜點製作,手作甜點,團體活動,烘焙,學習交流}	f	2024-11-12 15:07:42	2024-11-17 01:41:37	7	{工作坊}	每週我們將共同製作不同的甜點，從基礎的**餅乾**、**布朗尼**到稍微進階的**提拉米蘇**。\n由我負責準備材料和工具，並提前提供製作配方。\n每次聚會我們將一起動手製作，並在過程中交流技巧和心得。\n工作坊最後一週，我們會舉行一個小小的甜點分享會，讓每位成員展示自己的成果。	2024-11-18 15:46:00	t	想要聚集一群對甜點製作感興趣的朋友，一起學習並交流技術。	1. 為確保場地和食材準備充足，請提前報名。\n2. 請自備保鮮盒或袋子，以便將成品帶回家。\n3. 若對某些食材過敏，請提前告知以便做出相應安排。	享受動手製作的成就感，並與夥伴建立良好的友誼。	5	0	2025-01-31 00:00:03.305065	airflow	2025-01-31 00:00:03.305406	airflow
6733706c927c5a37b472712f	66cc9ef2f8d58801f0e11bf7	完成人生夢想	https://image.daoedu.tw/4f7ee153-1905-41f0-8d1f-8369934dae03		{綜合型學習資源}	{線上}		不限	{不設限}	\N	{產品開發}	f	2024-11-12 15:12:44	2024-11-20 17:28:05	5	{其他}	* 請填寫表單：https://forms.gle/mAiKaZCeHqB7UUZp9\n* 適合喜歡從 0-1 的人\n* 網址：https://cactus.pse.is/6f2ufl	2024-11-19 15:04:11	t	每個人人生都有夢想，一起完成彼此的夢想吧	* 每週一次開會，可請假\n* 有任何想法和問題請務必提出\n* 加入後，請找時間完成《個人使用說明書》	築夢踏實	6	0	2025-01-31 00:00:03.305065	airflow	2025-01-31 00:00:03.305406	airflow
673974779daeb56dac510956	669dc382850bab2ba053a538	發起揪團	https://image.daoedu.tw/0cc8d96b-c3bc-41e5-8526-8c8a66e7d793		{藝術}	{線上}		夥伴	{不設限,大學以上,高中}	\N	{}	f	2024-11-17 04:43:35	2024-11-17 04:53:45	0	{其他}	**# Test**\n\n\\`\\`\\`html\n\\<h1>123\\</h1>\n\\`\\`\\`	2024-11-13 16:00:00	t	揪團動機	注意	期待成果	0	0	2025-01-31 00:00:03.305065	airflow	2025-01-31 00:00:03.305406	airflow
\.


--
-- Data for Name: old_marathons; Type: TABLE DATA; Schema: public; Owner: daodao
--

COPY public.old_marathons (mongo_id, title, "eventId", "userId", description, motivation, content, goals, strategies, milestones, outcomes, status, "registrationStatus", "registrationDate", pricing, "isPublic", "isSendEmail", "createdDate", "updatedDate", __v, resources, created_at, created_by, updated_at, updated_by) FROM stdin;
676e5c0818e6b11da605924f	探索普世價值在人類歷史的發展與未來的展望	2025S1	676e534618e6b11da6059198	因為人生目標是希望成為追求真理的知識份子，所以希望從學生階段就開始讀各種人文社科書籍、關注人權發展、參與公共議題、寫自己的思考文章	{"tags": ["興趣熱情", "影響社會", "自我挑戰", "職涯發展", "個人成長", "探索可能性", "應對未來", "受事件啟發"], "description": "以下分享前陣子寫的文章\\n\\n我想，既然都走到這裡了，也該好好整理一下這段歷程了，我從一個懵懂無知的國高中生，到人生的低谷，又到了熱愛追求知識、熱愛自由，渴望成為一個幫助他人的知識份子的自學生。\\n\\n一開始，國小國中的我只會讀教科書，國小遇到家庭紛擾的劇變，國中經歷同儕的霸凌，高中的我因極度不信任家庭選擇住校，高中可能是我人生轉變的開始，同時遇到課業的難題和人生價值與追求的轉折。\\n\\n首先，因為就讀明星高中，考試變得繁多，學校也重視數理，而數理又是我的弱勢科目，我在課業方面出現了失落感和逐漸增加的數理方面的問題，這一層層加上心理因素，變成我對體制的不信任和對填鴨式教育的質疑，加上高中又同時是我找到熱愛領域的時機，在校因為英文老師推廣的國際特赦組織的寫信馬拉松活動，還有在校開始閱讀書籍的緣故，這段期間我發現了對社科人文知識的熱情和對人權的啟蒙，以及前面對體制的拒斥，於是我選擇了自學，隨著閱讀書目的增加我越發察覺社會不平等和種種議題與問題，於是很當然地，我接觸了社會主義與馬克思主義，可是對歷史的研究，蘇聯和中共和其他宣傳社會主義國家(包括納粹)的殘暴，使得同時我對這派學說保持質疑(後面會再詳細討論這個議題)。\\n\\n開始自學時一段時間，我開始接觸了一連串社會議題，從法律/政治/人權/環境擴展到更細緻的 : 台灣迫遷議題/世界極權政治與地緣政治問題/歷史等等，但自學也遇到嚴重的家庭關係問題，引發了我的重鬱症，但隨著社工們的協助和家人們與我的轉變和各方朋友的支持與協助，重鬱症也逐漸好轉，當然一部份家庭問題和個人議題仍然存在，但相較於以往是好很多了，也在此感謝友人的關心。\\n\\n先回到前面的問題，我在開始深入歷史和自由主義思潮的接觸後逐漸察覺共產主義與民主人權的矛盾和經濟自由與政治自由的相關性，這啟發了我很多。也隨著閱讀書目的增加，我的興趣擴展到世界史與東亞史/比較歷史、自由主義與民主、極權主義、教育、環境、人權、精神疾病、個體心理學、藝術繪畫、社會學，從對知識的渴望到想成為一位知識分子，在這期間我遇到了眾多資源和人的協助，以下再詳細列舉，在這段期間，我還接觸了基督教信仰，這給了我逐漸增添的信心和醫治，也加深我對人權的信念。\\n\\n透過一次次閱讀和寫文章的過程，我才漸漸明白現在所讀到的習慣科學(原子習慣和刻意練習)所告訴我的，用心且適當增加壓力和困難的練習的重要性，透過在這個土生土長的台灣遇到各種人事物給我的力量，我也明白受苦的倒影所言機遇的重要性，透過這一連串的體悟，我也逐漸了解經濟學家海耶克所言自由體制的重要和這個經濟自由和政治自由的台灣社會(但還是有很多待進步之處)對我的重要性，如果沒有這些不會有現在的我。在這個漸趨複雜的社會，民主倒退的世界，極權的擴張，氣候的變遷，知識的追求更加顯得重要，所以我得更加努力認真，現代文明社會是各個前輩們的努力，在此我向他們獻上感謝，我也對養育我的社會和種種機遇致上謝意，我得更加努力，我才可以回報這個社會，如同鄭南榕前輩說的，接下來是我們的事了 !\\n\\n在此我列舉眾多資源和人的協助\\n謝謝象仔書屋與東亞歷史協會的讀書會和各式各樣的書和討論\\n謝謝南方書店的朋友\\n謝謝孩堤咖啡的朋友\\n謝謝鹿鹿鬆餅屋的朋友和提供的協助\\n謝謝遠在新店老屋的朋友\\n謝謝鹿港浸信會和向陽教會\\n謝謝各路朋友的支持\\n謝謝我還沒提到的朋友\\n\\n再說一次，如果不是有你們和這個台灣社會，不會有現在的進步。"}	-人權的發展\n-世界史、東亞史、台灣史\n-歷史上出現過的文明倒退現象（如共產政權的迫害和極權的產生）\n-中共體制的分析\n-民主在台灣的起源與未來的展望	了解普世價值在世界歷史的發展和如何成為人類社會的基礎/對政治歷史有更深入的認識	{"tags": ["書籍閱讀", "資料蒐集/研究/分析", "發起行動", "參與活動或課程"], "description": "我會藉著閱讀書籍、聽演講、寫文章、不斷思考以及分享我的收獲來加強學習"}	[{"name": "讀台灣民主運動史(日治到戰後)，創設部落格", "startDate": "2025-02-09T00:00:00", "endDate": "2025-02-22T00:00:00", "subMilestones": [], "_id": "676e5c0818e6b11da6059250"}, {"name": "讀台灣史/東亞史/分析中共的書，聽演講", "startDate": "2025-02-23T00:00:00", "endDate": "2025-03-08T00:00:00", "subMilestones": [], "_id": "676e5c0818e6b11da6059251"}, {"name": "撰寫一篇文章", "startDate": "2025-03-09T00:00:00", "endDate": "2025-03-22T00:00:00", "subMilestones": [], "_id": "676e5c0818e6b11da6059252"}, {"name": "讀開放社會與其敵人還有其他論述政治經濟專制對人類社會危害的書", "startDate": "2025-03-23T00:00:00", "endDate": "2025-04-05T00:00:00", "subMilestones": [], "_id": "676e5c0818e6b11da6059253"}, {"name": "讀世界史", "startDate": "2025-04-06T00:00:00", "endDate": "2025-04-19T00:00:00", "subMilestones": [], "_id": "676e5c0818e6b11da6059254"}, {"name": "撰寫一篇文章", "startDate": "2025-04-20T00:00:00", "endDate": "2025-05-03T00:00:00", "subMilestones": [], "_id": "676e5c0818e6b11da6059255"}, {"name": "讀中共對台灣的影響(如談論中資滲透的書/台海軍演等等)", "startDate": "2025-05-04T00:00:00", "endDate": "2025-05-17T00:00:00", "subMilestones": [], "_id": "676e5c0818e6b11da6059256"}, {"name": "讀談論中共在中國施行迫害的書，聽演講", "startDate": "2025-05-18T00:00:00", "endDate": "2025-05-31T00:00:00", "subMilestones": [], "_id": "676e5c0818e6b11da6059257"}, {"name": "撰寫一篇文章", "startDate": "2025-06-01T00:00:00", "endDate": "2025-06-14T00:00:00", "subMilestones": [], "_id": "676e5c0818e6b11da6059258"}, {"name": "讀中國歷史上的人權捍衛者寫的著作", "startDate": "2025-06-15T00:00:00", "endDate": "2025-06-28T00:00:00", "subMilestones": [], "_id": "676e5c0818e6b11da6059259"}, {"name": "撰寫兩篇文章", "startDate": "2025-06-29T00:00:00", "endDate": "2025-07-12T00:00:00", "subMilestones": [], "_id": "676e5c0818e6b11da605925a"}]	{"tags": ["架設網站", "經營社群媒體", "撰寫研究報告", "藝術創作"], "description": "除了撰寫文章傳遞到社群外，同時也有在畫畫"}	Complete	Open		{"option": "4人團報價：12000元（一人3000元）", "price": 0, "email": ["christy98191@gmail.com", "taiwansmile@gmail.com", "zhouyuting08620@gmail.com"], "_id": "676e5c0818e6b11da605925b"}	t	t	2024-12-27 07:49:28	2025-01-23 14:33:29	0	\N	2025-01-30 17:08:39.727888	airflow	2025-01-30 17:08:39.728246	airflow
677111ab4b6a24b8351d5b3f	提升英文能力	2025S1	677111784b6a24b8351d5b36	想做此計畫的目標\n\n    我對於量子電腦與腦科學比較新興的領域感興趣， 但由於這些科系都是在國外發展比較蓬勃，因此會需要有一定的英文能力才能夠進行探索。 因此現階段我想要以提升英文能力為首要目標，可跟國外的學者進行交流。\n\n\n我希望累積英文能力，可以找到自己有興趣的科系，以及提升英文能力，也累積我的學習技巧。所以我預計會學習的內容包含：英文撰寫。最終我會把些學習過程整理成一個報告書，作為成果發表，來作為我五個月的學習成果發表。	{"tags": ["好奇心驅動", "其他：請於下方撰寫", "探索可能性", "升學或資格獲取"], "description": "技能\\n我所感興趣的腦科學、量子電腦等領域， 相關領域的最新知識多以英文撰寫而成，想吸收新知會需要一定程度英文能力。另一方面，我曾經參與不同的學術研討會，在與外語人士交流時更感受到英文能力的重要性。 我認為英文能夠讓我達到這樣的目標，所以我想增進自己的英文能力。\\n\\n另外，更我希望透過這次自學的機會，找回學習的自信心。\\n\\n家庭環境沒有足夠的學習資源、以及會有讓我需要分神處理的隨機家暴事件發生，讓我在學習時感到很不安。這讓我難以跟上學校的學習進度。\\n\\n過去，我總是順從他人為我安排的學習計畫，未曾有機會調整自己的步伐來學習。考試和學校的體制常讓我感到極度不適，甚至失去自我。繁忙的課業與頻繁的小考壓得我喘不過氣，因為我根本沒有足夠的時間來讀書、準備或接受輔導。\\n\\n校園在某些方面對我來說是片刻的喘息之地，但卻讓我倍感壓力。過去的學習經驗充滿壓力與妥協，幾乎沒有任何空間讓我自我探索，這也讓我逐漸失去了對學習的熱忱。而這次的計劃，我能夠重新為自己安排進度，達成期待的目標，是我試圖重新掌握學習主控權的重要一步。\\n\\n我明白，我們無法改變過去，但現在能做的一切，才是通往未來的軌跡。小時候，我曾經夢想環遊世界，如今雖然還不清楚如何實現，但我正嘗試探索更多的可能性。\\n\\n我希望透過探索，找回那份小時候對世界充滿好奇、熱愛自由學習的初心，將過去的困難化為動力，藉由持續的努力找到真正適合自己的道路，並學會接納過去，擁抱未來，活得坦率而自由。"}	 1. 英文能力：\n   - 以英語進行日常對話\n   - 撰寫正式書信（申請信、交流信）。  \n   - 提升詞彙與語法能力（使用 AI 工具與教師輔助）。  \n\n\n2. 學習技巧：\n   - 學術寫作與文獻筆記。  \n   - 不同領域的學習策略與思維方法。  \n   - 資料整理與研究方法。 	一：提升英文能力，在國際交流活動中順暢的與國際人士交流。\n二：在過程中可以真誠的面對自己的內心，並重拾學習熱情。	{"tags": ["其他：請於下方撰寫", "參與活動或課程", "場域實習", "找專家學者", "資料蒐集/研究/分析"], "description": "  提升聽：我會先觀看影片或者聽podcast，藉由跟讀的方式，提升聽說的能力。\\n\\n找學伴共學安排時間一同進入英語的學習環境，參與社群沈浸在英文的環境中 、找專家學者指點我學習的迷津。玩遊戲、ai互動。\\n\\n  提升說：參與社群進行口說練習、找學伴共學一同進入英語的學習環境、唸故事書給小朋友聽、錄製故事音檔、唱英文歌、玩遊戲、ai互動。\\n\\n  提升讀：書籍閱讀、觀看影片 、玩遊戲、ai互動。\\n\\n  提升文本表達：撰寫日記、閱讀我感興趣的資料撰寫文章與社群的分享、我觀看後的心得、ai互動。"}	[{"name": "環境建立與學習規劃", "startDate": "2025-02-09T00:00:00", "endDate": "2025-02-15T00:00:00", "subMilestones": [{"name": "英文學習系統建立", "dates": [{"$date": "2024-01-01T00:00:00"}], "description": "", "_id": "678e514a3b18d82b6896ffa7"}, {"name": " Obsidian筆記系統建置   - 設定每日英文日記模板   - 建立單字卡片系統   - 設計閱讀筆記架構   - 建立AI工具使用記錄模板", "dates": [], "description": "", "_id": "678e514a3b18d82b6896ffa8"}, {"name": "英文課本第一冊（前4課）   - 每課閱讀與寫字（20頁/課）：每天5頁   - 每課聆聽與口說（1頁/課）：每天練習15分鐘   - 製作單字卡片：每課30個重點單字   - 完成每課習作和測驗", "dates": [], "description": "", "_id": "678e514a3b18d82b6896ffa9"}, {"name": "Barry Loser第一本（I am not a loser）   - 第1-50頁：閱讀與筆記   - 製作生字表：每10頁整理一次   - 錄製朗讀音檔：每章一段", "dates": [], "description": "", "_id": "678e514a3b18d82b6896ffaa"}], "_id": "6787d3056662cd04f96874c5"}, {"name": "環境建立與學習規劃", "startDate": "2025-02-16T00:00:00", "endDate": "2025-02-22T00:00:00", "subMilestones": [{"name": "在兩個禮拜一次的探索有想保留繼續下一週的探索是沒問題的，甚至是兩週。", "dates": [], "description": "", "_id": "6788d4146662cd04f9687d87"}], "_id": "6787d3056662cd04f96874c6"}, {"name": "基礎能力培養", "startDate": "2025-02-23T00:00:00", "endDate": "2025-03-01T00:00:00", "subMilestones": [{"name": "英文學習深化", "dates": [], "description": "", "_id": "678e514a3b18d82b6896ffb1"}, {"name": "英文課本第一冊（5-8課）   - 每天完成一課閱讀（20頁）   - 錄製口說練習（每課2次）   - 與學伴（阿菊）練習對話   - 完成每課習作", "dates": [], "description": "", "_id": "678e514a3b18d82b6896ffb2"}, {"name": "Barry Loser第一本（續）   - 第51-100頁閱讀與筆記   - 使用CloudAI練習對話   - 寫下每章重點摘要   - 錄製朗讀音檔", "dates": [], "description": "", "_id": "678e514a3b18d82b6896ffb3"}], "_id": "6787d3056662cd04f96874c7"}, {"name": "基礎能力培養", "startDate": "2025-03-02T00:00:00", "endDate": "2025-03-08T00:00:00", "subMilestones": [], "_id": "6787d3056662cd04f96874c8"}, {"name": "學習方法優化", "startDate": "2025-03-09T00:00:00", "endDate": "2025-03-15T00:00:00", "subMilestones": [{"name": "英文能力提升", "dates": [], "description": "", "_id": "678e514a3b18d82b6896ffb9"}, {"name": "英文課本第一冊（9-12課）   - 完成剩餘課程   - 進行總複習   - 製作重點整理   - 錄製口說練習", "dates": [], "description": "", "_id": "678e514a3b18d82b6896ffba"}, {"name": "Barry Loser第一本（完結）與第二本開始   - 完成第一本（101-200頁）   - 開始第二本（1-50頁）   - 寫下完整讀書心得   - 準備與學伴分享", "dates": [], "description": "", "_id": "678e514a3b18d82b6896ffbb"}], "_id": "6787d3056662cd04f96874c9"}, {"name": "學習方法優化", "startDate": "2025-03-16T00:00:00", "endDate": "2025-03-22T00:00:00", "subMilestones": [], "_id": "6787d3056662cd04f96874ca"}, {"name": "學習方法優化", "startDate": "2025-03-23T00:00:00", "endDate": "2025-03-29T00:00:00", "subMilestones": [{"name": " 英文學習    日常練習（每天）   - 寫英文日記（200字）   - 背誦單字（30個）   - 聽力練習（30分鐘）   - 口說練習（20分鐘）    週末整理（每週）   - 複習本週單字   - 整理學習筆記   - 記錄遇到的困難   - 規劃下週重點  科系探索   資料收集（每天）   - 閱讀相關文章   - 觀看影片資料   - 記錄重要資訊   - 提出疑問清單    週末整理（每週）   - 整理本週發現   - 更新探索方向   - 調整學習計畫   - 設定下週目標", "dates": [], "description": "", "_id": "678e514a3b18d82b6896ffc0"}], "_id": "6787d3056662cd04f96874cb"}, {"name": "學習方法優化", "startDate": "2025-03-30T00:00:00", "endDate": "2025-04-05T00:00:00", "subMilestones": [{"name": "1. 學習進度檢視    - 英文學習目標達成率    - 科系探索進展    - 遭遇困難分析    - 解決方案提出  2. 學習方法調整    - 效果評估    - 方法優化    - 資源使用檢討    - 時間分配調整", "dates": [], "description": "", "_id": "678e514a3b18d82b6896ffc2"}, {"name": " 英文學習    日常練習（每天）   - 寫英文日記（200字）   - 背誦單字（30個）   - 聽力練習（30分鐘）   - 口說練習（20分鐘）    週末整理（每週）   - 複習本週單字   - 整理學習筆記   - 記錄遇到的困難   - 規劃下週重點  科系探索   資料收集（每天）   - 閱讀相關文章   - 觀看影片資料   - 記錄重要資訊   - 提出疑問清單    週末整理（每週）   - 整理本週發現   - 更新探索方向   - 調整學習計畫   - 設定下週目標", "dates": [], "description": "", "_id": "678e514a3b18d82b6896ffc3"}], "_id": "6787d3056662cd04f96874cc"}, {"name": "學習方法優化", "startDate": "2025-04-06T00:00:00", "endDate": "2025-04-12T00:00:00", "subMilestones": [{"name": " 英文學習    日常練習（每天）   - 寫英文日記（200字）   - 背誦單字（30個）   - 聽力練習（30分鐘）   - 口說練習（20分鐘）    週末整理（每週）   - 複習本週單字   - 整理學習筆記   - 記錄遇到的困難   - 規劃下週重點  科系探索   資料收集（每天）   - 閱讀相關文章   - 觀看影片資料   - 記錄重要資訊   - 提出疑問清單    週末整理（每週）   - 整理本週發現   - 更新探索方向   - 調整學習計畫   - 設定下週目標", "dates": [], "description": "", "_id": "678e514a3b18d82b6896ffc5"}], "_id": "6787d3056662cd04f96874cd"}, {"name": "學習方法優化", "startDate": "2025-04-13T00:00:00", "endDate": "2025-04-19T00:00:00", "subMilestones": [{"name": "1. 學習進度檢視 - 英文學習目標達成率 - 科系探索進展 - 遭遇困難分析 - 解決方案提出 2. 學習方法調整 - 效果評估 - 方法優化 - 資源使用檢討 - 時間分配調整", "dates": [], "description": "", "_id": "678e514a3b18d82b6896ffc7"}, {"name": " 英文學習    日常練習（每天）   - 寫英文日記（200字）   - 背誦單字（30個）   - 聽力練習（30分鐘）   - 口說練習（20分鐘）    週末整理（每週）   - 複習本週單字   - 整理學習筆記   - 記錄遇到的困難   - 規劃下週重點  科系探索   資料收集（每天）   - 閱讀相關文章   - 觀看影片資料   - 記錄重要資訊   - 提出疑問清單    週末整理（每週）   - 整理本週發現   - 更新探索方向   - 調整學習計畫   - 設定下週目標", "dates": [], "description": "", "_id": "678e514a3b18d82b6896ffc8"}], "_id": "6787d3056662cd04f96874ce"}, {"name": "學習方法優化", "startDate": "2025-04-20T00:00:00", "endDate": "2025-04-26T00:00:00", "subMilestones": [{"name": " 英文學習    日常練習（每天）   - 寫英文日記（200字）   - 背誦單字（30個）   - 聽力練習（30分鐘）   - 口說練習（20分鐘）    週末整理（每週）   - 複習本週單字   - 整理學習筆記   - 記錄遇到的困難   - 規劃下週重點  科系探索   資料收集（每天）   - 閱讀相關文章   - 觀看影片資料   - 記錄重要資訊   - 提出疑問清單    週末整理（每週）   - 整理本週發現   - 更新探索方向   - 調整學習計畫   - 設定下週目標", "dates": [], "description": "", "_id": "678e514a3b18d82b6896ffca"}], "_id": "6787d3056662cd04f96874cf"}, {"name": "學習方法優化", "startDate": "2025-04-27T00:00:00", "endDate": "2025-05-03T00:00:00", "subMilestones": [{"name": "1. 學習進度檢視 - 英文學習目標達成率 - 科系探索進展 - 遭遇困難分析 - 解決方案提出 2. 學習方法調整 - 效果評估 - 方法優化 - 資源使用檢討 - 時間分配調整", "dates": [], "description": "", "_id": "678e514a3b18d82b6896ffcc"}, {"name": " 英文學習    日常練習（每天）   - 寫英文日記（200字）   - 背誦單字（30個）   - 聽力練習（30分鐘）   - 口說練習（20分鐘）    週末整理（每週）   - 複習本週單字   - 整理學習筆記   - 記錄遇到的困難   - 規劃下週重點  科系探索   資料收集（每天）   - 閱讀相關文章   - 觀看影片資料   - 記錄重要資訊   - 提出疑問清單    週末整理（每週）   - 整理本週發現   - 更新探索方向   - 調整學習計畫   - 設定下週目標", "dates": [], "description": "", "_id": "678e514a3b18d82b6896ffcd"}], "_id": "6787d3056662cd04f96874d0"}, {"name": "學習方法優化", "startDate": "2025-05-04T00:00:00", "endDate": "2025-05-10T00:00:00", "subMilestones": [{"name": " 英文學習    日常練習（每天）   - 寫英文日記（200字）   - 背誦單字（30個）   - 聽力練習（30分鐘）   - 口說練習（20分鐘）    週末整理（每週）   - 複習本週單字   - 整理學習筆記   - 記錄遇到的困難   - 規劃下週重點  科系探索   資料收集（每天）   - 閱讀相關文章   - 觀看影片資料   - 記錄重要資訊   - 提出疑問清單    週末整理（每週）   - 整理本週發現   - 更新探索方向   - 調整學習計畫   - 設定下週目標", "dates": [], "description": "", "_id": "678e514a3b18d82b6896ffcf"}], "_id": "6787d3056662cd04f96874d1"}, {"name": "學習方法優化", "startDate": "2025-05-11T00:00:00", "endDate": "2025-05-17T00:00:00", "subMilestones": [{"name": "1. 學習進度檢視 - 英文學習目標達成率 - 科系探索進展 - 遭遇困難分析 - 解決方案提出 2. 學習方法調整 - 效果評估 - 方法優化 - 資源使用檢討 - 時間分配調整", "dates": [], "description": "", "_id": "678e514a3b18d82b6896ffd1"}, {"name": " 英文學習    日常練習（每天）   - 寫英文日記（200字）   - 背誦單字（30個）   - 聽力練習（30分鐘）   - 口說練習（20分鐘）    週末整理（每週）   - 複習本週單字   - 整理學習筆記   - 記錄遇到的困難   - 規劃下週重點  科系探索   資料收集（每天）   - 閱讀相關文章   - 觀看影片資料   - 記錄重要資訊   - 提出疑問清單    週末整理（每週）   - 整理本週發現   - 更新探索方向   - 調整學習計畫   - 設定下週目標", "dates": [], "description": "", "_id": "678e514a3b18d82b6896ffd2"}], "_id": "6787d3056662cd04f96874d2"}, {"name": "學習方法優化", "startDate": "2025-05-18T00:00:00", "endDate": "2025-05-24T00:00:00", "subMilestones": [{"name": " 英文學習    日常練習（每天）   - 寫英文日記（200字）   - 背誦單字（30個）   - 聽力練習（30分鐘）   - 口說練習（20分鐘）    週末整理（每週）   - 複習本週單字   - 整理學習筆記   - 記錄遇到的困難   - 規劃下週重點  科系探索   資料收集（每天）   - 閱讀相關文章   - 觀看影片資料   - 記錄重要資訊   - 提出疑問清單    週末整理（每週）   - 整理本週發現   - 更新探索方向   - 調整學習計畫   - 設定下週目標", "dates": [], "description": "", "_id": "678e514a3b18d82b6896ffd4"}], "_id": "6787d3056662cd04f96874d3"}, {"name": "16", "startDate": "2025-05-25T00:00:00", "endDate": "2025-05-31T00:00:00", "subMilestones": [{"name": "1. 學習進度檢視 - 英文學習目標達成率 - 科系探索進展 - 遭遇困難分析 - 解決方案提出 2. 學習方法調整 - 效果評估 - 方法優化 - 資源使用檢討 - 時間分配調整", "dates": [], "description": "", "_id": "678e514a3b18d82b6896ffd6"}, {"name": " 英文學習    日常練習（每天）   - 寫英文日記（200字）   - 背誦單字（30個）   - 聽力練習（30分鐘）   - 口說練習（20分鐘）    週末整理（每週）   - 複習本週單字   - 整理學習筆記   - 記錄遇到的困難   - 規劃下週重點  科系探索   資料收集（每天）   - 閱讀相關文章   - 觀看影片資料   - 記錄重要資訊   - 提出疑問清單    週末整理（每週）   - 整理本週發現   - 更新探索方向   - 調整學習計畫   - 設定下週目標", "dates": [], "description": "", "_id": "678e514a3b18d82b6896ffd7"}], "_id": "6787d3056662cd04f96874d4"}, {"name": "學習方法優化", "startDate": "2025-06-01T00:00:00", "endDate": "2025-06-07T00:00:00", "subMilestones": [{"name": " 英文學習    日常練習（每天）   - 寫英文日記（200字）   - 背誦單字（30個）   - 聽力練習（30分鐘）   - 口說練習（20分鐘）    週末整理（每週）   - 複習本週單字   - 整理學習筆記   - 記錄遇到的困難   - 規劃下週重點  科系探索   資料收集（每天）   - 閱讀相關文章   - 觀看影片資料   - 記錄重要資訊   - 提出疑問清單    週末整理（每週）   - 整理本週發現   - 更新探索方向   - 調整學習計畫   - 設定下週目標", "dates": [], "description": "", "_id": "678e514a3b18d82b6896ffd9"}], "_id": "6787d3056662cd04f96874d5"}, {"name": "18", "startDate": "2025-06-08T00:00:00", "endDate": "2025-06-14T00:00:00", "subMilestones": [{"name": "1. 學習進度檢視 - 英文學習目標達成率 - 科系探索進展 - 遭遇困難分析 - 解決方案提出 2. 學習方法調整 - 效果評估 - 方法優化 - 資源使用檢討 - 時間分配調整", "dates": [], "description": "", "_id": "678e514a3b18d82b6896ffdb"}, {"name": " 英文學習    日常練習（每天）   - 寫英文日記（200字）   - 背誦單字（30個）   - 聽力練習（30分鐘）   - 口說練習（20分鐘）    週末整理（每週）   - 複習本週單字   - 整理學習筆記   - 記錄遇到的困難   - 規劃下週重點  科系探索   資料收集（每天）   - 閱讀相關文章   - 觀看影片資料   - 記錄重要資訊   - 提出疑問清單    週末整理（每週）   - 整理本週發現   - 更新探索方向   - 調整學習計畫   - 設定下週目標", "dates": [], "description": "", "_id": "678e514a3b18d82b6896ffdc"}], "_id": "6787d3056662cd04f96874d6"}, {"name": "學習方法優化", "startDate": "2025-06-15T00:00:00", "endDate": "2025-06-21T00:00:00", "subMilestones": [{"name": " 英文學習    日常練習（每天）   - 寫英文日記（200字）   - 背誦單字（30個）   - 聽力練習（30分鐘）   - 口說練習（20分鐘）    週末整理（每週）   - 複習本週單字   - 整理學習筆記   - 記錄遇到的困難   - 規劃下週重點  科系探索   資料收集（每天）   - 閱讀相關文章   - 觀看影片資料   - 記錄重要資訊   - 提出疑問清單    週末整理（每週）   - 整理本週發現   - 更新探索方向   - 調整學習計畫   - 設定下週目標", "dates": [], "description": "", "_id": "678e514a3b18d82b6896ffde"}], "_id": "6787d3056662cd04f96874d7"}, {"name": "20", "startDate": "2025-06-22T00:00:00", "endDate": "2025-06-28T00:00:00", "subMilestones": [{"name": "1. 學習進度檢視 - 英文學習目標達成率 - 科系探索進展 - 遭遇困難分析 - 解決方案提出 2. 學習方法調整 - 效果評估 - 方法優化 - 資源使用檢討 - 時間分配調整", "dates": [], "description": "", "_id": "678e514a3b18d82b6896ffe0"}, {"name": " 英文學習    日常練習（每天）   - 寫英文日記（200字）   - 背誦單字（30個）   - 聽力練習（30分鐘）   - 口說練習（20分鐘）    週末整理（每週）   - 複習本週單字   - 整理學習筆記   - 記錄遇到的困難   - 規劃下週重點  科系探索   資料收集（每天）   - 閱讀相關文章   - 觀看影片資料   - 記錄重要資訊   - 提出疑問清單    週末整理（每週）   - 整理本週發現   - 更新探索方向   - 調整學習計畫   - 設定下週目標", "dates": [], "description": "", "_id": "678e514a3b18d82b6896ffe1"}], "_id": "6787d3056662cd04f96874d8"}, {"name": "學習方法優化", "startDate": "2025-06-29T00:00:00", "endDate": "2025-07-05T00:00:00", "subMilestones": [{"name": " 英文學習    日常練習（每天）   - 寫英文日記（200字）   - 背誦單字（30個）   - 聽力練習（30分鐘）   - 口說練習（20分鐘）    週末整理（每週）   - 複習本週單字   - 整理學習筆記   - 記錄遇到的困難   - 規劃下週重點  科系探索   資料收集（每天）   - 閱讀相關文章   - 觀看影片資料   - 記錄重要資訊   - 提出疑問清單    週末整理（每週）   - 整理本週發現   - 更新探索方向   - 調整學習計畫   - 設定下週目標", "dates": [], "description": "", "_id": "678e514a3b18d82b6896ffe3"}], "_id": "6787d3056662cd04f96874d9"}, {"name": "22", "startDate": "2025-07-06T00:00:00", "endDate": "2025-07-12T00:00:00", "subMilestones": [{"name": "1. 學習進度檢視 - 英文學習目標達成率 - 科系探索進展 - 遭遇困難分析 - 解決方案提出 2. 學習方法調整 - 效果評估 - 方法優化 - 資源使用檢討 - 時間分配調整", "dates": [], "description": "", "_id": "678e514a3b18d82b6896ffe5"}, {"name": " 英文學習    日常練習（每天）   - 寫英文日記（200字）   - 背誦單字（30個）   - 聽力練習（30分鐘）   - 口說練習（20分鐘）    週末整理（每週）   - 複習本週單字   - 整理學習筆記   - 記錄遇到的困難   - 規劃下週重點  科系探索   資料收集（每天）   - 閱讀相關文章   - 觀看影片資料   - 記錄重要資訊   - 提出疑問清單    週末整理（每週）   - 整理本週發現   - 更新探索方向   - 調整學習計畫   - 設定下週目標", "dates": [], "description": "", "_id": "678e514a3b18d82b6896ffe6"}], "_id": "6787d3056662cd04f96874da"}]	{"tags": ["其他：請在下方補上其他原因，並詳細說明動機", "藝術創作"], "description": "報告書：\\n英文學習報告書：\\n以完整的文字形式呈現，展現我在22週當中的英文學習計劃中每日所練習的文字表達力，包括學習歷程、挑戰、解決方法以及反思。\\n科系領域的調查報告書：\\n作為在探索查科系時，用搜索時得知的資料做歸納，將調查到的新發現，還有感覺，作為報告的目標。\\n影片：嘗試以英語作為科系探索訪談時使用的語言。用英語來教學水車玩具的製作、介紹我自己在參與這次22週的學習計劃後，當中的歷程、感受與成長，讓觀眾視覺化地感受到努力與收穫。"}	Complete	Open		{"option": "4人團報價：12000元（一人3000元）", "price": 0, "email": ["yufish0117@gmail.com", "jiayounikehuzhe@gmail.com", "choumei.bonnie@gmail.com"], "_id": "677111ab4b6a24b8351d5b4b"}	t	t	2024-12-29 09:08:59	2025-01-25 22:22:04	0	\N	2025-01-30 17:08:39.727888	airflow	2025-01-30 17:08:39.728246	airflow
6773f2ce4b6a24b8351d7336	「偶」的學習之旅	2025S1	6771676f4b6a24b8351d62b4	先前接觸過融合戲偶元素的劇場作品因而感到興趣，希望藉此計畫學習戲偶製作與操作、練習紀錄學習歷程並分享到網路社群。預期最終會以社群貼文形式，產出三部操作自製戲偶的影片，並且附上製作歷程敘述與創作理念。	{"tags": ["受事件啟發", "興趣熱情", "自我挑戰", "個人成長", "生活發生變化"], "description": "去年在衛武營觀賞了曉劇場的《魚·貓》，演出中表演者使用了人偶、腳踏車骨架與輪胎，呈現出或平緩或顛簸的騎行景況，那樣的畫面另我極為驚奇，原來物件與偶的結合，可以創造與自己平時習慣的，以表演者為主體的劇場表演更加魔幻自由的氛圍。之後偶然在台南當地劇團斜槓青年創作體的四戲連演的其中一作裡，也欣賞了結合戲偶的演出，由於演出本身是形式、運用素材都以相對單純的solo呈現，所以也讓我產生「或許我也可以嘗試看看操偶跟製偶」的想法。\\n另外，我跟朋友今年打算再次參與花樣戲劇節（一個陪伴高中生創作並呈現戲劇作品的活動）的徵件，在前陣子討論創作方向的會議中，恰好其他團員同樣有將偶戲元素加入作品的念頭。在自身興趣與週遭聲音方向一致的情況下，關於偶的探究學習活動似乎愈加有執行的必要。不過關於偶戲領域的學習，台灣沒有太多具系統的學習路徑，所以透過自主學習的方式，開闢出一個可執行的學習脈絡，我認為是現階段最為可行的辦法。因此希望可以透過學習馬拉松實踐這個構想，在計畫執行過程中，也希望藉由社群的分享，為其他對偶戲感興趣的人，提供一條可依循的探索路徑！"}	操偶（發展各種動作的可能性、揣摩戲偶的各種情緒）/ 製偶（理解基礎執頭偶/杖頭偶/手套偶/懸絲偶的結構與製作、創作自己設計的戲偶）/ 有條理的學習紀錄方法	學習操偶製偶的技巧/ 運用瑣碎時間執行計畫/ 練習有脈絡地分享自己的學習歷程	{"tags": ["觀看影片", "參與社群", "參與活動或課程", "其他：請於下方撰寫"], "description": "預計以網路資源（如影片、文章）補足戲偶相關知識後，實際練習操作操製偶，並將歷程與成果透過紀錄及網路社群分享，作為審視與敦促學習的方式。在計劃前中期，會參與偶劇團的工作坊及演出，藉此與偶戲工作者交流學習，也可請教它們對於偶戲學習的建議。"}	[{"name": "執頭偶初探", "startDate": "2025-02-09T00:00:00", "endDate": "2025-02-15T00:00:00", "subMilestones": [{"name": "參考影片或圖片，製作出一隻後方置有棍棒或操縱環的偶", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb18"}, {"name": "練習揣摩無獨有偶劇團〈戲偶動作練習表〉上的動作。每次練習花一個小時的時間，選擇五個動作。共練習三次。", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb19"}, {"name": "檢討練習時錄製的影像，思考：戲偶有沒有確實表現出動作或情緒？為什麼？", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb1a"}, {"name": "週末反思當週目標有無確實執行？下週安排需不需作調整？", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb1b"}, {"name": "於社群發布執頭偶的學習歷程貼文", "dates": [], "description": "", "_id": "67938ca99ddf9a5f9c3d2f28"}], "_id": "679333f79ddf9a5f9c3ceb17"}, {"name": "杖頭偶初探", "startDate": "2025-02-16T00:00:00", "endDate": "2025-02-22T00:00:00", "subMilestones": [{"name": "製作出一隻以棍棒穿過頭與身體的偶", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb1d"}, {"name": "其餘練習與反思，同第一週2、3、4點", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb1e"}, {"name": " 於社群發布杖頭偶的學習歷程貼文", "dates": [], "description": "", "_id": "67938ca99ddf9a5f9c3d2f2c"}], "_id": "679333f79ddf9a5f9c3ceb1c"}, {"name": "手套偶初探", "startDate": "2025-02-23T00:00:00", "endDate": "2025-03-01T00:00:00", "subMilestones": [{"name": "製作一支可套入手的偶", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb20"}, {"name": " 其餘練習與反思，同第一週2、3、4點", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb21"}, {"name": "於社群發布手套偶的學習歷程貼文", "dates": [], "description": "", "_id": "67938ca99ddf9a5f9c3d2f30"}], "_id": "679333f79ddf9a5f9c3ceb1f"}, {"name": "遊行大偶工作坊 第一週", "startDate": "2025-03-02T00:00:00", "endDate": "2025-03-08T00:00:00", "subMilestones": [{"name": "參與遊行大偶課程（3/8）", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb23"}, {"name": "在週間複習三次戲偶的動作練習（每次30分鐘，需要錄影檢討）", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb24"}, {"name": "週末產出課程後與操偶練習的學習紀錄與反思", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb25"}, {"name": "週末反思當週目標有無確實執行？下週安排需不需作調整？", "dates": [], "description": "", "_id": "67938ca99ddf9a5f9c3d2f35"}], "_id": "679333f79ddf9a5f9c3ceb22"}, {"name": "遊行大偶工作坊 第二週", "startDate": "2025-03-09T00:00:00", "endDate": "2025-03-15T00:00:00", "subMilestones": [{"name": "參與遊行大偶課程（3/9、3/15）", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb27"}, {"name": "其餘練習與反思，同第四週2、3、4點", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb28"}], "_id": "679333f79ddf9a5f9c3ceb26"}, {"name": "遊行大偶工作坊 第三週", "startDate": "2025-03-16T00:00:00", "endDate": "2025-03-22T00:00:00", "subMilestones": [{"name": " 參與遊行大偶課程（3/16、3/22）", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb2a"}, {"name": "其餘練習與反思，同第四週2、3、4點", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb2b"}], "_id": "679333f79ddf9a5f9c3ceb29"}, {"name": "遊行大偶工作坊 第四週", "startDate": "2025-03-23T00:00:00", "endDate": "2025-03-29T00:00:00", "subMilestones": [{"name": "參與遊行大偶課程（3/23、3/29）", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb2d"}, {"name": "其餘練習與反思，同第四週2、3、4點", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb2e"}], "_id": "679333f79ddf9a5f9c3ceb2c"}, {"name": "遊行大偶工作坊 第五週", "startDate": "2025-03-30T00:00:00", "endDate": "2025-04-05T00:00:00", "subMilestones": [{"name": "參與遊行大偶課程（3/30）", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb30"}, {"name": "其餘練習與反思，同第四週2、3、4點", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb31"}], "_id": "679333f79ddf9a5f9c3ceb2f"}, {"name": "遊行大偶工作坊 第六週", "startDate": "2025-04-06T00:00:00", "endDate": "2025-04-12T00:00:00", "subMilestones": [{"name": "參與遊行大偶彩排（4/6、4/11）", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb33"}, {"name": "遊行大偶演出（4/12）", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb34"}, {"name": "彩排後頻繁複習筆記與注意事項", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb35"}], "_id": "679333f79ddf9a5f9c3ceb32"}, {"name": "遊行大偶工作坊 第七週", "startDate": "2025-04-13T00:00:00", "endDate": "2025-04-19T00:00:00", "subMilestones": [{"name": "遊行大偶演出（4/13）", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb37"}, {"name": "將工作坊綜整心得反思記錄下來，並於社群分享心得", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb38"}, {"name": "觀看〈當代戲偶與製作美學〉講座，並記錄心得反思", "dates": [], "description": "", "_id": "67938ca99ddf9a5f9c3d2f49"}], "_id": "679333f79ddf9a5f9c3ceb36"}, {"name": "懸絲偶初探", "startDate": "2025-04-20T00:00:00", "endDate": "2025-04-26T00:00:00", "subMilestones": [{"name": "製作一隻以線操作的戲偶", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb3a"}, {"name": "其餘練習與反思，同第一週2、3、4點", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb3b"}], "_id": "679333f79ddf9a5f9c3ceb39"}, {"name": "懸絲偶初探", "startDate": "2025-04-27T00:00:00", "endDate": "2025-05-03T00:00:00", "subMilestones": [{"name": "以操作練習為主，執行方式與反思同第一週2、3、4點", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb3d"}, {"name": "發布懸絲偶學習歷程貼文", "dates": [], "description": "", "_id": "67938ca99ddf9a5f9c3d2f4f"}], "_id": "679333f79ddf9a5f9c3ceb3c"}, {"name": "戲偶創作 主題：〈人〉", "startDate": "2025-05-04T00:00:00", "endDate": "2025-05-10T00:00:00", "subMilestones": [{"name": "範本搜索、戲偶設計", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb3f"}, {"name": "戲偶製作", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb40"}, {"name": "週末反思當週目標有無確實執行？下週安排需不需作調整？", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb41"}], "_id": "679333f79ddf9a5f9c3ceb3e"}, {"name": "戲偶創作 主題：〈人〉", "startDate": "2025-05-11T00:00:00", "endDate": "2025-05-17T00:00:00", "subMilestones": [{"name": "戲偶製作與修正", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb43"}, {"name": "週末反思當週目標有無確實執行？下週安排需不需作調整？", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb44"}], "_id": "679333f79ddf9a5f9c3ceb42"}, {"name": "戲偶創作 主題：〈人〉", "startDate": "2025-05-18T00:00:00", "endDate": "2025-05-24T00:00:00", "subMilestones": [{"name": "於社群平台發布戲偶的操作影片與介紹文字內容", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb46"}, {"name": "戲偶動作發展，並錄製影片", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb47"}, {"name": "週末反思當週目標有無確實執行？下週安排需不需作調整？", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb48"}], "_id": "679333f79ddf9a5f9c3ceb45"}, {"name": "戲偶創作 主題：〈植物〉", "startDate": "2025-05-25T00:00:00", "endDate": "2025-05-31T00:00:00", "subMilestones": [{"name": "範本搜索、戲偶設計", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb4a"}, {"name": "週末反思當週目標有無確實執行？下週安排需不需作調整？", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb4b"}], "_id": "679333f79ddf9a5f9c3ceb49"}, {"name": "戲偶創作 主題：〈植物〉", "startDate": "2025-06-01T00:00:00", "endDate": "2025-06-07T00:00:00", "subMilestones": [{"name": "戲偶製作與修正", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb4d"}, {"name": "週末反思當週目標有無確實執行？下週安排需不需作調整？", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb4e"}], "_id": "679333f79ddf9a5f9c3ceb4c"}, {"name": "戲偶創作 主題：〈植物〉", "startDate": "2025-06-08T00:00:00", "endDate": "2025-06-14T00:00:00", "subMilestones": [{"name": " 於社群平台發布戲偶的操作影片與介紹文字內容", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb50"}, {"name": " 戲偶動作發展，並錄製影片", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb51"}, {"name": "週末反思當週目標有無確實執行？下週安排需不需作調整？", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb52"}], "_id": "679333f79ddf9a5f9c3ceb4f"}, {"name": "戲偶創作 主題：〈動物〉", "startDate": "2025-06-15T00:00:00", "endDate": "2025-06-21T00:00:00", "subMilestones": [{"name": "範本搜索、戲偶設計", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb54"}, {"name": "週末反思當週目標有無確實執行？下週安排需不需作調整？", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb55"}], "_id": "679333f79ddf9a5f9c3ceb53"}, {"name": "戲偶創作 主題：〈動物〉", "startDate": "2025-06-22T00:00:00", "endDate": "2025-06-28T00:00:00", "subMilestones": [{"name": "戲偶製作與修正", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb57"}, {"name": "週末反思當週目標有無確實執行？下週安排需不需作調整？", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb58"}], "_id": "679333f79ddf9a5f9c3ceb56"}, {"name": "戲偶創作 主題：〈動物〉", "startDate": "2025-06-29T00:00:00", "endDate": "2025-07-05T00:00:00", "subMilestones": [{"name": "戲偶製作與修正", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb5a"}, {"name": "週末反思當週目標有無確實執行？下週安排需不需作調整？", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb5b"}], "_id": "679333f79ddf9a5f9c3ceb59"}, {"name": "戲偶創作 主題：〈動物〉", "startDate": "2025-07-06T00:00:00", "endDate": "2025-07-12T00:00:00", "subMilestones": [{"name": " 於社群平台發布戲偶的操作影片與介紹文字內容", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb5d"}, {"name": " 戲偶動作發展，並錄製影片", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb5e"}], "_id": "679333f79ddf9a5f9c3ceb5c"}]	{"tags": ["藝術創作", "經營社群媒體"], "description": "計畫前中期產出執頭偶、杖頭偶、手套偶、遊行大偶工作坊、懸絲偶的學習歷程記錄，後期錄製製作的三個戲偶的動作片段，並附上創作理念與心得，完成後都需要在社群平台上分享。"}	Complete	Open		{"option": "4人團報價：12000元（一人3000元）", "price": 0, "email": ["llee.chier@gmail.com", "ctc.chang0514@gmail.com", "a0912358866@gmail.com"], "_id": "6773f2ce4b6a24b8351d7342"}	t	t	2024-12-31 13:34:06	2025-01-24 12:50:49	0	\N	2025-01-30 17:08:39.727888	airflow	2025-01-30 17:08:39.728246	airflow
677eb1370bfe245fc8382eda	探索拒學的根源與解決方案	2025S1	676c3d9a18e6b11da60582c2	深入研究拒學現象的背景、成因及其對個人與社會的影響，並設計創新的解決方案來幫助遭遇困境的學生重拾學習動力。通過文獻分析、問卷調查與專家訪談，計劃將結合心理學理論與數位科技，製作一款針對拒學學生的數位支持工具原型（MVP）。最終成果將以研究報告、產品原型及公開分享會的形式呈現，期望為教育體制提供洞見，並為學生及家長帶來實際幫助。	{"tags": ["好奇心驅動", "個人成長", "受群體影響", "探索可能性", "受事件啟發", "影響社會", "自我挑戰", "興趣熱情"], "description": "從小到大，我對學校的感受總是充滿矛盾。一方面，學校是我最初探索知識和人際互動的地方；另一方面，它也讓我感受到壓力和不適應。隨著年齡的增長，這種不適感逐漸累積和加深，直到高一時，我終於無法再忽視內心的抗拒感。那時的我，對課堂環境及學習方式都感到窒息，彷彿身處於一個無法調和的矛盾之中，所以我決定要轉個人自學。這不僅是離開傳統體制，而是一種對自我需求的回應，也是一場重新定義學習意義的旅程。\\n\\n這樣的經歷讓我對拒學議題產生了深刻的共鳴。我發現，拒學不僅僅是個人的問題，它還牽涉到家庭結構、教育體制以及社會文化等多重因素。我開始思考：是否有更好的方式來幫助那些像我一樣陷入困境的人？是否可以通過創新的方法來減少他們的痛苦？這些問題成為我探索拒學議題的動力來源，希望能夠深入研究與實踐，找出拒學背後的成因，並設計出真正能夠幫助學生的方法。\\n\\n現在做這件事，會為我帶來什麼？也想要藉此給自己一段時間，去感受、體驗一下到底對這件事有多少熱情，在我心中有多重要"}	1. **拒學的背景與成因分析**\n    - 學習心理學理論（如認知行為療法、阿德勒心理學）以理解拒學行為的心理機制。\n    - 探討拒學的多重成因，包括個人、家庭、學校及社會層面的影響。\n    - 研究拒學行為的功能模式（如逃避嫌惡刺激、尋求他人關注等）。\n    - **系統思考**：\n        - 學習系統思考的基本概念，如因果循環圖（Causal Loop Diagram）和系統動態模型（System Dynamics Model）。\n        - 將拒學視為一個複雜系統，分析其多層次影響，包括個人層面（心理健康）、家庭層面（親子關係）、學校層面（教學方式、同儕互動）及社會層面（政策、文化期待）。\n        - 建立因果循環圖，識別拒學問題中的正反饋機制，例如課業壓力如何加劇學生焦慮，進而導致拒學。\n        - 探索潛在的槓桿點（Leverage Points），如改善師生關係或提供心理支持，來打破負面循環。\n2. **調查與數據分析技能**\n    - 學習問卷設計與訪談技巧，用於蒐集拒學學生及其家庭的經驗資料。\n    - 掌握基礎數據分析工具（如Excel或SPSS），進行統計分析以識別趨勢與模式。\n3. **創新解決方案的設計**\n    - 探索如何利用科技（如生成式 AI）來提供個性化的心理支持或教育資源。\n    - 設計以學生需求為核心的解決方案，並規劃MVP（最小可行產品）進行測試。	1. 學習運用調查方法與分析工具，研究拒學的背景、成因及影響，並整理成具有洞見的結論。\n2. 利用前面的研究分析，設計結合科技與數位工具的創新解決方案，並規劃 MVP 驗證其效果。	{"tags": ["資料蒐集/研究/分析", "書籍閱讀", "找專家學者", "做專案", "訪談", "問卷調查"], "description": "1. **資料蒐集與文獻研究**\\n    - 閱讀相關書籍與研究報告，如《打破孩子拒學的沉默》和《從校園輔導工作初探拒學議題之生態指標》。\\n    - 分析國內外案例，了解不同文化背景下拒學問題的差異。\\n2. **系統思考應用**\\n    - 閲讀系統思考相關書籍（如第五項修煉），學習因果循環圖和系統描繪。\\n    - 在調查過程中繪製因果循環圖，識別拒學現象中的關鍵影響因素與反饋機制。\\n    - 使用系統動態模擬工具（如 Kumu）來測試不同干預策略的效果。\\n3. **訪談與問卷調查**\\n    - 訪談教育工作者、心理諮商師及曾經拒學的學生，了解真實經驗，並將訪談結果納入系統模型分析。\\n    - 設計問卷，針對學生及家長進行調查，蒐集第一手數據，用於驗證因果假設。\\n4. **實作與反思**\\n    - 透過設計MVP解決方案進行實驗性測試，並根據反饋進行改進。\\n    - 定期撰寫反思日誌，記錄自己的思考過程和收穫，以提升自我效能。"}	[{"name": "- 閱讀《教育心理學：理論與實踐》、《拒絕上學的孩子》。 - 學習系統思考工具（如因果循環圖和系統動態建模）的基本概念。 - 紀錄拒學議題中的主要影響因素，初步構建因果循環圖。", "startDate": "2025-02-09T00:00:00", "endDate": "2025-02-22T00:00:00", "subMilestones": [], "_id": "678a88f96662cd04f9689007"}, {"name": "- 閱讀《第五項修練》，理解系統思考在教育問題中的應用。 - 繪製更詳細的因果循環圖，加入心理、家庭、學校及社會層面的影響因素。 - 撰寫對拒學問題的系統性觀察筆記。", "startDate": "2025-02-23T00:00:00", "endDate": "2025-03-08T00:00:00", "subMilestones": [], "_id": "678a88f96662cd04f9689008"}, {"name": "- 設計針對學生、家長和教育工作者的問卷，涵蓋心理、家庭、學校及社會層面。 - 撰寫訪談提綱，包括針對拒學經驗、成因及應對策略的問題。 - 向專家或導師徵求問卷及提綱的修改建議。", "startDate": "2025-03-09T00:00:00", "endDate": "2025-03-22T00:00:00", "subMilestones": [], "_id": "678a88f96662cd04f9689009"}, {"name": "- 發放問卷，蒐集至少50份有效回應。 - 將問卷數據整理為表格，準備進一步分析。", "startDate": "2025-03-23T00:00:00", "endDate": "2025-04-05T00:00:00", "subMilestones": [], "_id": "678a88f96662cd04f968900a"}, {"name": "- 與3-5位教育工作者、心理諮商師或曾經拒學的學生進行深度訪談。 - 將訪談內容整理為文字紀錄，識別關鍵觀點和模式。", "startDate": "2025-04-06T00:00:00", "endDate": "2025-04-19T00:00:00", "subMilestones": [], "_id": "678a88f96662cd04f968900b"}, {"name": "- 使用SPSS或Excel進行數據分析，識別關鍵模式和趨勢。 - 根據調查結果更新因果循環圖，加入新的影響因素和反饋機制。 - 使用Kumu等工具構建系統動態模型，測試不同干預策略的效果。", "startDate": "2025-04-20T00:00:00", "endDate": "2025-05-03T00:00:00", "subMilestones": [], "_id": "678a88f96662cd04f968900c"}, {"name": "brainstorming解決方案概念。選擇最可行的方案，設計MVP（最小可行產品）的詳細規格", "startDate": "2025-05-04T00:00:00", "endDate": "2025-05-17T00:00:00", "subMilestones": [], "_id": "678a88f96662cd04f968900d"}, {"name": "開發MVP原型", "startDate": "2025-05-18T00:00:00", "endDate": "2025-05-31T00:00:00", "subMilestones": [], "_id": "678a88f96662cd04f968900e"}, {"name": "測試MVP原型，邀請至少10位拒學學生或相關人士參與使用測試，收集反饋", "startDate": "2025-06-01T00:00:00", "endDate": "2025-06-14T00:00:00", "subMilestones": [], "_id": "678a88f96662cd04f968900f"}, {"name": "- 整理調查結果、分析結論及測試反饋，形成完整研究框架。 - 撰寫研究報告初稿，包括背景、方法、結果及建議部分。", "startDate": "2025-06-15T00:00:00", "endDate": "2025-06-28T00:00:00", "subMilestones": [], "_id": "678a88f96662cd04f9689010"}, {"name": "製作簡報或影片，總結研究歷程、數據分析結果及解決方案。 撰寫部落格文章或Medium文章，公開分享研究經驗及資源。 舉辦線上分享會，展示研究成果並回答觀眾提問。 收集參加者對解決方案和研究內容的回饋意見，根據回饋修訂最終報告和解決方案。", "startDate": "2025-06-29T00:00:00", "endDate": "2025-07-12T00:00:00", "subMilestones": [], "_id": "678a88f96662cd04f9689011"}]	{"tags": ["發起專案或組織", "舉辦活動", "撰寫研究報告", "其他：請於下方撰寫"], "description": "1. **研究報告**\\n    \\n    撰寫一份完整的研究報告，包含拒學問題的背景、成因分析、調查結果及解決方案建議，供教育機構參考。\\n    \\n2. **數位平台原型**\\n    \\n    製作一款針對拒學學生的數位工具原型，如一個提供心理支持和教育資源的 GPTs，並記錄測試過程和結果。\\n    \\n3. **公開分享會**\\n    \\n    舉辦線上分享會，向社群展示研究成果，並邀請專家和同儕給予回饋，以促進跨領域合作。\\n    \\n4. **個人反思紀錄**\\n    \\n    建立一個部落格或Medium帳號，用於記錄整個研究歷程，包括挑戰、突破點和未來展望，希望能啟發更多人關注拒學議題。"}	Complete	Open		{"option": "4人團報價：12000元（一人3000元）", "price": 0, "email": [" llee.chier@gmail.com", "a0912358866@gmail.com", "the.oc1122@gmail.com"], "_id": "677eb1370bfe245fc8382ef1"}	f	t	2025-01-08 17:09:11	2025-01-24 13:45:09	0	\N	2025-01-30 17:08:39.727888	airflow	2025-01-30 17:08:39.728246	airflow
677eb1b00bfe245fc8382ef5	拒學議題的互動方案設計	2025S1	676c3fdb18e6b11da605832d	這次的學習計畫來自於我的親身經歷與觀察。高二時，因為人際關係、生涯迷茫與家庭問題，我曾深刻感受到拒學的無助與孤立，那段經歷讓我對這個議題有了特別的關注。我也目睹妹妹因心理疾病與校園壓力而陷入拒學，她的不安與掙扎讓我意識到，教育體系中對於拒學學生的理解與支持仍然不足。我希望透過這次計畫，深入探討拒學現象的心理、家庭與社會層面，設計出創新的互動方案，讓學校與社會能夠更友善地回應這些需求。\n\n這不僅是一場學習的旅程，更是一種對問題的探索與實踐。我期盼能藉由分析與行動設計，找出具體且可行的解方，幫助拒學議題的討論與解決走向更全面與溫暖的方向。每一步的努力，不只是對個人經歷的反思，也是希望能以更積極的方式，為這個複雜的問題帶來一些新的可能性與改變的契機。	{"tags": ["影響社會", "探索可能性", "興趣熱情", "自我挑戰", "個人成長", "受事件啟發"], "description": "我對拒學議題的關注源自於自身的經歷與觀察。高二時，因為人際關係、生涯迷惘以及家庭等複雜因素，我開始感受到難以踏入學校的困難，甚至出現拒絕上學的情況。經過一段時間的整理與反思，我決定在高三開始過上自學的生活。除此之外，我的妹妹比我更早經歷拒學的過程，她因為心理疾病的影響，面對學業無法跟上、人際關係問題以及學校老師的排擠，這讓我深刻感受到學校對拒學學生的環境非常不友善，且缺乏足夠的支持系統。因此，我希望可以透過這個議題的研究與發想解方，這不僅能讓我透過議題自我敘述來探索自我，還能將個人經驗影響社會，我相信，我在其中最大的學習就是將自己過去覺得不好的經驗轉為對於社會具有影響力的行動。\\n\\n另外，家長對拒學問題的理解也非常有限。大多數家長對於孩子拒學的情況感到困惑，並且不知該如何幫助孩子，這使得孩子往往處於被社會邊緣化的狀態，甚至開始遠離社會。我認為，這是當前亟需解決的重大問題。因此，我希望透過這次的學習馬拉松，學習如何將我的理想付諸實踐，並更深入了解拒學議題的不同面向。透過業師和其他資源的支持，我相信能夠讓我在實現這一理想的過程中，更加自信並具備具體的行動方案。"}	1.拒學的背景與成因：深入了解拒學現象的生態系統觀，包括心理健康、家庭環境、社會因素等，掌握影響學生拒學的各種因素\n2.專案設計與執行能力：學習如何設計小規模試驗計畫（MVP），包括確定目標、方法、預期結果等，並能夠在實際執行中靈活應對各種挑戰\n3.批判性思維：在研究過程中培養批判性思維，能夠對所收集的資料進行深入剖析，並提出具有洞見的結論\n4.培養以用戶為中心的設計思維：強調從使用者的需求出發來構建解決方案	1.能夠運用調查方法與分析工具，深入研究拒學的背景、成因及其影響，並整理出具有洞見的結論。\n2.能夠設計出創新且可行的解方，並規劃小規模試驗計畫（MVP）以驗證方案的效果。\n3.學習活動企劃與產品設計技巧，從流程設計到實際執行都能掌握核心重點。\n4.確認自己對於拒學議題是否有真正的使命感與熱情。	{"tags": ["問卷調查", "參與活動或課程", "舉辦活動或課程", "發起行動", "做專案", "找專家學者", "找學伴共學", "參與競賽", "資料蒐集/研究/分析", "其他：請於下方撰寫"], "description": "在這次學習計畫中，我將綜合運用多種學習方法，透過自我敘述、資料蒐集、訪談與專案實作等方式，深入探討拒學議題並設計互動解決方案。首先，我會以資料蒐集與研究作為基礎，閱讀相關文獻與報導，了解拒學議題的背景與成因，並運用分析工具整理數據，找出主要的影響因素。\\n\\n接著，我計劃 訪談專家學者與家長、學生，以更貼近現實的視角補充文獻中可能未提及的洞見，讓研究結論更加全面。  在研究基礎之上，我將設計一個小規模試驗計畫（MVP），結合學校場域與家庭層面的雙重需求，並且以專案實作的形式驗證解方的可行性。在過程中，我會尋找志同道合的學伴共學，一同進行方案設計與回饋討論，確保方案能被不同角色接受並有效執行。同時，我也計劃參與相關的社會創新競賽，測試方案的創新性與社會影響力，並獲得專業評審的指導。  \\n\\n除了研究與實驗，我還會主動發起行動，如舉辦「小型工作坊」，模擬解方案的真實執行場景，並記錄學習者的回應與改善建議。最後，我將總結學習所得，製作一份包含調查報告、方案設計與執行紀錄的學習歷程檔案。\\n"}	[{"name": "閱讀拒學相關文獻與書籍，研究拒學的心理學基礎", "startDate": "2025-02-09T00:00:00", "endDate": "2025-02-22T00:00:00", "subMilestones": [], "_id": "677eb1b00bfe245fc8382ef6"}, {"name": "分析拒學的社會層面影響，整理成一份系統圖", "startDate": "2025-02-23T00:00:00", "endDate": "2025-03-08T00:00:00", "subMilestones": [], "_id": "677eb1b00bfe245fc8382ef7"}, {"name": "整理第一階段所有資料，撰寫一份初步背景報告，涵蓋拒學成因及影響。", "startDate": "2025-03-09T00:00:00", "endDate": "2025-03-22T00:00:00", "subMilestones": [], "_id": "677eb1b00bfe245fc8382ef8"}, {"name": "根據收集的資料與分析相關議題組織方案結果，確立可能的解決方案框架，並設定具體目標。", "startDate": "2025-03-23T00:00:00", "endDate": "2025-04-05T00:00:00", "subMilestones": [], "_id": "677eb1b00bfe245fc8382ef9"}, {"name": "學習設計思維與以用戶為中心的解決方案設計方法，並對目標受眾進行更深入的需求分析。", "startDate": "2025-04-06T00:00:00", "endDate": "2025-04-19T00:00:00", "subMilestones": [], "_id": "677eb1b00bfe245fc8382efa"}, {"name": "根據用戶需求與設計思維，設計一個小規模試驗計畫來測試解決方案的可行性。", "startDate": "2025-04-20T00:00:00", "endDate": "2025-05-03T00:00:00", "subMilestones": [], "_id": "677eb1b00bfe245fc8382efb"}, {"name": "實施小規模的試驗計畫，並收集反饋與資料。", "startDate": "2025-05-04T00:00:00", "endDate": "2025-05-17T00:00:00", "subMilestones": [], "_id": "677eb1b00bfe245fc8382efc"}, {"name": "分析試驗過程中的資料，總結實施效果並提出改進建議。", "startDate": "2025-05-18T00:00:00", "endDate": "2025-05-31T00:00:00", "subMilestones": [], "_id": "677eb1b00bfe245fc8382efd"}, {"name": "根據分析結果對解決方案進行優化，並準備改進版的方案。", "startDate": "2025-06-01T00:00:00", "endDate": "2025-06-14T00:00:00", "subMilestones": [], "_id": "677eb1b00bfe245fc8382efe"}, {"name": "整理整體計畫，撰寫學習過程與結果的總結報告。", "startDate": "2025-06-15T00:00:00", "endDate": "2025-06-28T00:00:00", "subMilestones": [], "_id": "677eb1b00bfe245fc8382eff"}, {"name": "在學習結束後，準備一場簡報，向其他學員、導師或相關人員分享學習成果，並總結學習經驗。", "startDate": "2025-06-29T00:00:00", "endDate": "2025-07-12T00:00:00", "subMilestones": [], "_id": "677eb1b00bfe245fc8382f00"}]	{"tags": ["發起專案或組織", "參與競賽", "舉辦活動", "撰寫研究報告"], "description": "1.拒學議題研究報告：經過對拒學現象的深度研究，我將撰寫一份相關的研究報告，旨在提升對拒學學生的理解與支持。\\n2.專案的MVP（最小可行產品）：我將設計並實施一個針對拒學議題的解決方案，並在此過程中開發出MVP。這個MVP將包含一個初步的互動方案，旨在引導學生與家長找到更合適的學習方式。我將進行測試與反饋迭代，以確保其可行性與實用性。\\n3.競賽參與與成果呈現：我將參與與社會創新相關的競賽，並以研究報告與MVP為核心，展示我在拒學議題上的學習成果與創新方案。在此過程中，我不僅希望能夠獲得評審的肯定，也期望透過這些競賽機會獲得更多反饋、資金，進一步提升方案的完善度。"}	Complete	Open		{"option": "4人團報價：12000元（一人3000元）", "price": 0, "email": ["llee.chier@gmail.com", "ctc.chang0514@gmail.com", "the.oc1122@gmail.com"], "_id": "677eb1b00bfe245fc8382f01"}	f	t	2025-01-08 17:11:12	2025-01-19 13:53:22	0	\N	2025-01-30 17:08:39.727888	airflow	2025-01-30 17:08:39.728246	airflow
67836dce6662cd04f9683384	用A I輔助，製作大腦與飲食介紹的網站	2025S1	67814b250bfe245fc8384532	之前營隊有獲得相關的講義，在學習上也學習到不少使用的AI工具可以收集資料以及製作成果。\n將這些資料整合並且分享給需要的人，然後在過程中學習自己有興趣的大腦知識以及營養學。	{"tags": ["個人成長", "好奇心驅動", "興趣熱情", "自我挑戰", "職涯發展", "探索可能性", "應對未來", "創新發展", "實用需求", "受事件啟發", "影響社會"], "description": "因為想要探索大腦相關的領域，也因為減肥而在過程中對於營養學有興趣。\\n因此在計劃時把大腦、飲食、荷爾蒙、內分泌等知識分享給需要的人，並且針對學生做出建議與對策，也幫助自己更了解相關領域的發展！"}	-網站架設(ai工具)\n-版面設計與內容編制\n-內分泌與營養學\n-怎麼樣真正「享瘦」生活	學習更多AI工具的運用，以及把大腦和營養學的知識融會貫通	{"tags": ["資料蒐集/研究/分析", "書籍閱讀", "觀看影片", "參與社群", "參與活動或課程"], "description": "用Hocoos製作網頁\\nbrain bee的免費講義學習大腦知識\\n《飢餓訊號》等書籍學習飲食知識\\ngoogle notebookLM 整理資料，製作英文podcast 學習更進階的英文\\n閱讀書籍了解營養學"}	[{"name": "腦科學入門與大腦功能", "startDate": "2025-02-09T00:00:00", "endDate": "2025-02-22T00:00:00", "subMilestones": [], "_id": "6797922b9ddf9a5f9c3f4a60"}, {"name": "製作筆記、網頁，拍短影片分享", "startDate": "2025-02-23T00:00:00", "endDate": "2025-03-08T00:00:00", "subMilestones": [], "_id": "6797922b9ddf9a5f9c3f4a61"}, {"name": "飲食對腦健康的影響機制", "startDate": "2025-03-09T00:00:00", "endDate": "2025-03-22T00:00:00", "subMilestones": [], "_id": "6797922b9ddf9a5f9c3f4a62"}, {"name": "製作筆記、網頁，拍短影片分享", "startDate": "2025-03-23T00:00:00", "endDate": "2025-04-05T00:00:00", "subMilestones": [], "_id": "6797922b9ddf9a5f9c3f4a63"}, {"name": "腸道菌群與情緒的關聯", "startDate": "2025-04-06T00:00:00", "endDate": "2025-04-19T00:00:00", "subMilestones": [], "_id": "6797922b9ddf9a5f9c3f4a64"}, {"name": "製作筆記、網頁，拍短影片分享", "startDate": "2025-04-20T00:00:00", "endDate": "2025-05-03T00:00:00", "subMilestones": [], "_id": "6797922b9ddf9a5f9c3f4a65"}, {"name": "飲食與記憶力", "startDate": "2025-05-04T00:00:00", "endDate": "2025-05-17T00:00:00", "subMilestones": [], "_id": "6797922b9ddf9a5f9c3f4a66"}, {"name": "製作筆記、網頁，拍短影片分享", "startDate": "2025-05-18T00:00:00", "endDate": "2025-05-31T00:00:00", "subMilestones": [], "_id": "6797922b9ddf9a5f9c3f4a67"}, {"name": "情緒管理與壓力調節中的飲食角色", "startDate": "2025-06-01T00:00:00", "endDate": "2025-06-14T00:00:00", "subMilestones": [], "_id": "6797922b9ddf9a5f9c3f4a68"}, {"name": "製作筆記、網頁，拍短影片分享", "startDate": "2025-06-15T00:00:00", "endDate": "2025-06-28T00:00:00", "subMilestones": [], "_id": "6797922b9ddf9a5f9c3f4a69"}, {"name": "總結心得，可能的話辦一個小型分享會（或者以此為標準製作心得）", "startDate": "2025-06-29T00:00:00", "endDate": "2025-07-12T00:00:00", "subMilestones": [], "_id": "6797922b9ddf9a5f9c3f4a6a"}]	{"tags": ["架設網站", "經營社群媒體", "撰寫研究報告"], "description": "架設資訊統整網站，以社群媒體輔助分享知識"}	Complete	Open		{"option": "4人團報價：12000元（一人3000元）", "price": 0, "email": ["Ilikedriedfruit@gmail.com", "justin387130618@gmail.com", "xuezhiqian759@gmail.com"], "_id": "67836dce6662cd04f9683390"}	t	t	2025-01-12 07:22:54	2025-01-27 14:03:23	0	\N	2025-01-30 17:08:39.727888	airflow	2025-01-30 17:08:39.728246	airflow
6784d05e6662cd04f96850f3	繼續學習程式設計	2025S1	6784cbab6662cd04f96850de	因為想繼續精進，希望能一直進步，平常寫LeetCode和zero judge和codingbar	{"tags": ["職涯發展", "興趣熱情", "自我挑戰", "個人成長", "升學或資格獲取"], "description": "一剛開始是因為國小scratch社團，覺得程式設計有趣，後來學習python"}	Python語法\n演算法\n資料結構	更能夠把想法（自然語言），轉換成code，學習更多演算法資料結構	{"tags": ["書籍閱讀", "觀看影片", "考試", "參與競賽", "做專案"], "description": "挑選適合自己程度的題目，大量刷題，每做完一題都去了解最好的解法"}	[{"name": "Cc", "startDate": "2025-02-09T00:00:00", "endDate": "2025-02-22T00:00:00", "subMilestones": [], "_id": "6784d05e6662cd04f96850f4"}, {"name": "Cc", "startDate": "2025-02-23T00:00:00", "endDate": "2025-03-08T00:00:00", "subMilestones": [], "_id": "6784d05e6662cd04f96850f5"}, {"name": "Cc", "startDate": "2025-03-09T00:00:00", "endDate": "2025-03-22T00:00:00", "subMilestones": [], "_id": "6784d05e6662cd04f96850f6"}, {"name": "Cc", "startDate": "2025-03-23T00:00:00", "endDate": "2025-04-05T00:00:00", "subMilestones": [], "_id": "6784d05e6662cd04f96850f7"}, {"name": "Cc", "startDate": "2025-04-06T00:00:00", "endDate": "2025-04-19T00:00:00", "subMilestones": [], "_id": "6784d05e6662cd04f96850f8"}, {"name": "Cc", "startDate": "2025-04-20T00:00:00", "endDate": "2025-05-03T00:00:00", "subMilestones": [], "_id": "6784d05e6662cd04f96850f9"}, {"name": "Cc", "startDate": "2025-05-04T00:00:00", "endDate": "2025-05-17T00:00:00", "subMilestones": [], "_id": "6784d05e6662cd04f96850fa"}, {"name": "Cc", "startDate": "2025-05-18T00:00:00", "endDate": "2025-05-31T00:00:00", "subMilestones": [], "_id": "6784d05e6662cd04f96850fb"}, {"name": "Cc", "startDate": "2025-06-01T00:00:00", "endDate": "2025-06-14T00:00:00", "subMilestones": [], "_id": "6784d05e6662cd04f96850fc"}, {"name": "Cccc", "startDate": "2025-06-15T00:00:00", "endDate": "2025-06-28T00:00:00", "subMilestones": [], "_id": "6784d05e6662cd04f96850fd"}, {"name": "Cc", "startDate": "2025-06-29T00:00:00", "endDate": "2025-07-12T00:00:00", "subMilestones": [], "_id": "6784d05e6662cd04f96850fe"}]	{"tags": ["其他：請於下方撰寫"], "description": "呈現刷了哪些題庫"}	Complete	Open		{"option": "4人團報價：12000元（一人3000元）", "price": 0, "email": ["Cc", "Cc", "Cc"], "_id": "6784d05e6662cd04f96850ff"}	t	t	2025-01-13 08:35:42	2025-01-13 08:35:42	0	\N	2025-01-30 17:08:39.727888	airflow	2025-01-30 17:08:39.728246	airflow
67850cb36662cd04f9685a42	我想出一本書	2025S1	67850b3d6662cd04f9685a39	我本身有在寫作，想用自己的力量出一本書（自印也可以）	{"tags": ["興趣熱情", "自我挑戰", "個人成長"], "description": "我喜歡寫作！我想讓我的故事被看見"}	內容規劃抓200頁 但也有想過要不要再少一點啦！	我希望我出一本書，然後好好的紀錄	{"tags": ["參與活動或課程", "舉辦活動或課程", "找學伴共學"], "description": "我是一個感覺派選手所以打算參加各種不一樣的活動寫下冒險日誌"}	[{"name": "探索：你的主題要寫什麼呢？", "startDate": "2025-02-09T00:00:00", "endDate": "2025-02-22T00:00:00", "subMilestones": [], "_id": "67850cb36662cd04f9685a43"}, {"name": "開始書寫", "startDate": "2025-02-23T00:00:00", "endDate": "2025-03-08T00:00:00", "subMilestones": [], "_id": "67850cb36662cd04f9685a44"}, {"name": "書寫", "startDate": "2025-03-09T00:00:00", "endDate": "2025-03-22T00:00:00", "subMilestones": [], "_id": "67850cb36662cd04f9685a45"}, {"name": "書寫", "startDate": "2025-03-23T00:00:00", "endDate": "2025-04-05T00:00:00", "subMilestones": [], "_id": "67850cb36662cd04f9685a46"}, {"name": "書寫", "startDate": "2025-04-06T00:00:00", "endDate": "2025-04-19T00:00:00", "subMilestones": [], "_id": "67850cb36662cd04f9685a47"}, {"name": "書寫", "startDate": "2025-04-20T00:00:00", "endDate": "2025-05-03T00:00:00", "subMilestones": [], "_id": "67850cb36662cd04f9685a48"}, {"name": "書寫", "startDate": "2025-05-04T00:00:00", "endDate": "2025-05-17T00:00:00", "subMilestones": [], "_id": "67850cb36662cd04f9685a49"}, {"name": "書寫", "startDate": "2025-05-18T00:00:00", "endDate": "2025-05-31T00:00:00", "subMilestones": [], "_id": "67850cb36662cd04f9685a4a"}, {"name": "書寫", "startDate": "2025-06-01T00:00:00", "endDate": "2025-06-14T00:00:00", "subMilestones": [], "_id": "67850cb36662cd04f9685a4b"}, {"name": "書寫", "startDate": "2025-06-15T00:00:00", "endDate": "2025-06-28T00:00:00", "subMilestones": [], "_id": "67850cb36662cd04f9685a4c"}, {"name": "書寫", "startDate": "2025-06-29T00:00:00", "endDate": "2025-07-12T00:00:00", "subMilestones": [], "_id": "67850cb36662cd04f9685a4d"}]	{"tags": ["藝術創作", "其他：請於下方撰寫"], "description": "我會出書並且售賣"}	Complete	Open		{"option": "中低收入戶：將提供三位免費參與資格", "price": 0, "email": [], "_id": "67850cb36662cd04f9685a4e"}	t	t	2025-01-13 12:53:07	2025-01-13 12:53:07	0	\N	2025-01-30 17:08:39.727888	airflow	2025-01-30 17:08:39.728246	airflow
6788dd316662cd04f968801e	cc	2025S1	669e0d96256188da6f9c4ec9	cc	{"tags": ["好奇心驅動"], "description": "cc"}	cc	cc	{"tags": ["觀看影片"], "description": "cc"}	[{"name": "cc", "startDate": "2025-02-09T00:00:00", "endDate": "2025-02-22T00:00:00", "subMilestones": [], "_id": "6788dd316662cd04f968801f"}, {"name": "cc", "startDate": "2025-02-23T00:00:00", "endDate": "2025-03-08T00:00:00", "subMilestones": [], "_id": "6788dd316662cd04f9688020"}, {"name": "cc", "startDate": "2025-03-09T00:00:00", "endDate": "2025-03-22T00:00:00", "subMilestones": [], "_id": "6788dd316662cd04f9688021"}, {"name": "cc", "startDate": "2025-03-23T00:00:00", "endDate": "2025-04-05T00:00:00", "subMilestones": [], "_id": "6788dd316662cd04f9688022"}, {"name": "cc", "startDate": "2025-04-06T00:00:00", "endDate": "2025-04-19T00:00:00", "subMilestones": [], "_id": "6788dd316662cd04f9688023"}, {"name": "cc", "startDate": "2025-04-20T00:00:00", "endDate": "2025-05-03T00:00:00", "subMilestones": [], "_id": "6788dd316662cd04f9688024"}, {"name": "cc", "startDate": "2025-05-04T00:00:00", "endDate": "2025-05-17T00:00:00", "subMilestones": [], "_id": "6788dd316662cd04f9688025"}, {"name": "cc", "startDate": "2025-05-18T00:00:00", "endDate": "2025-05-31T00:00:00", "subMilestones": [], "_id": "6788dd316662cd04f9688026"}, {"name": "cc", "startDate": "2025-06-01T00:00:00", "endDate": "2025-06-14T00:00:00", "subMilestones": [], "_id": "6788dd316662cd04f9688027"}, {"name": "cc", "startDate": "2025-06-15T00:00:00", "endDate": "2025-06-28T00:00:00", "subMilestones": [], "_id": "6788dd316662cd04f9688028"}, {"name": "cc", "startDate": "2025-06-29T00:00:00", "endDate": "2025-07-12T00:00:00", "subMilestones": [], "_id": "6788dd316662cd04f9688029"}]	{"tags": ["藝術創作"], "description": "cc"}	Complete	Open		{"option": "優惠價：8000 元", "price": 0, "email": [], "_id": "6788dd316662cd04f968802a"}	t	t	2025-01-16 10:19:29	2025-01-16 10:19:29	0	\N	2025-01-30 17:08:39.727888	airflow	2025-01-30 17:08:39.728246	airflow
678c4f7f3b18d82b6896c15c	往課程企劃的路上邁進	2025S1	676a0f3718e6b11da60577ed	因為想要在工作上獲得職涯成長，我預計會分為個人學習面、工作職場面去規劃我自己這一年的夢想藍圖，希望能藉此往課程企劃的角色邁進	{"tags": ["職涯發展"], "description": "因為本身是負責課程行政的角色，看著身邊同事透過實際規劃的課程，真的能夠幫助上課的學員，能夠因為受訓完，而真的能夠應用在工作上而進步，所以想要在職涯上成長，獲得更好的進步！"}	-訓練規劃暨執行管理師認證班\n-強化個人溝通力，提升工作效能\n-新媒體AI社群行銷-善用智慧AI，讓社群文案脫穎而出\n-輕鬆學Canva 簡報視覺設計\n	-能更有系統的學習：輸入至輸出\n-工作上能與主管保持良好溝通	{"tags": [], "description": "我預計從上述的方向邁進，並且固定每個月與主管約面談，以確保自己的方向都有跟上，並滾動式修正自己的缺失"}	[{"name": "工作面：設計課程行銷企劃書", "startDate": "2025-02-09T00:00:00", "endDate": "2025-02-15T00:00:00", "subMilestones": [], "_id": "678c4f7f3b18d82b6896c15d"}, {"name": "學習面：參加公司內部訓練輕鬆學Canva 簡報視覺設計", "startDate": "2025-02-16T00:00:00", "endDate": "2025-02-22T00:00:00", "subMilestones": [], "_id": "678c4f7f3b18d82b6896c15e"}, {"name": "學習面：訓練規劃暨執行管理師認證班", "startDate": "2025-02-23T00:00:00", "endDate": "2025-03-01T00:00:00", "subMilestones": [{"name": "分享學習心得、資源在threads", "dates": [{"$date": "2024-01-02T00:00:00"}], "description": "", "_id": "678c4f7f3b18d82b6896c160"}], "_id": "678c4f7f3b18d82b6896c15f"}, {"name": "學習面：訓練規劃暨執行管理師認證班", "startDate": "2025-03-02T00:00:00", "endDate": "2025-03-08T00:00:00", "subMilestones": [{"name": "分享學習心得、資源在threds", "dates": [{"$date": "2024-01-02T00:00:00"}], "description": "", "_id": "678c4f7f3b18d82b6896c162"}], "_id": "678c4f7f3b18d82b6896c161"}, {"name": "學習面：訓練規劃暨執行管理師認證班", "startDate": "2025-03-09T00:00:00", "endDate": "2025-03-15T00:00:00", "subMilestones": [{"name": "分享學習心得、資源在threds", "dates": [], "description": "", "_id": "678c4f7f3b18d82b6896c164"}, {"name": "個人課程筆記整理", "dates": [], "description": "", "_id": "678c4f7f3b18d82b6896c165"}], "_id": "678c4f7f3b18d82b6896c163"}, {"name": "學習面：XChangeBD 實戰談「LinkedIn 拓展」", "startDate": "2025-03-16T00:00:00", "endDate": "2025-03-22T00:00:00", "subMilestones": [{"name": "發想LinkedIn內容", "dates": [{"$date": "2024-01-06T00:00:00"}], "description": "", "_id": "678c4f7f3b18d82b6896c167"}], "_id": "678c4f7f3b18d82b6896c166"}, {"name": "工作面：設計發想課程行銷電子報", "startDate": "2025-03-23T00:00:00", "endDate": "2025-03-29T00:00:00", "subMilestones": [], "_id": "678c4f7f3b18d82b6896c168"}, {"name": "工作面：與主管對焦課程行銷電子報", "startDate": "2025-03-30T00:00:00", "endDate": "2025-04-05T00:00:00", "subMilestones": [], "_id": "678c4f7f3b18d82b6896c169"}, {"name": "學習面：XChangeBD 實戰談「客戶關係深耕」", "startDate": "2025-04-06T00:00:00", "endDate": "2025-04-12T00:00:00", "subMilestones": [], "_id": "678c4f7f3b18d82b6896c16a"}, {"name": "學習面：XChangeBD 實戰談「解構商業模式」", "startDate": "2025-04-13T00:00:00", "endDate": "2025-04-19T00:00:00", "subMilestones": [], "_id": "678c4f7f3b18d82b6896c16b"}, {"name": "學習面：強化個人溝通力，提升工作效能", "startDate": "2025-04-20T00:00:00", "endDate": "2025-04-26T00:00:00", "subMilestones": [], "_id": "678c4f7f3b18d82b6896c16c"}, {"name": "學習面：新媒體AI社群行銷-善用智慧AI，讓社群文案脫穎而出", "startDate": "2025-04-27T00:00:00", "endDate": "2025-05-03T00:00:00", "subMilestones": [], "_id": "678c4f7f3b18d82b6896c16d"}, {"name": "學習面：XChangeBD 思維升級「顧問方法」", "startDate": "2025-05-04T00:00:00", "endDate": "2025-05-10T00:00:00", "subMilestones": [], "_id": "678c4f7f3b18d82b6896c16e"}, {"name": "工作面：試想預計開設課程主題、對象", "startDate": "2025-05-11T00:00:00", "endDate": "2025-05-17T00:00:00", "subMilestones": [], "_id": "678c4f7f3b18d82b6896c16f"}, {"name": "工作面：與主管約面談討論可行度", "startDate": "2025-05-18T00:00:00", "endDate": "2025-05-24T00:00:00", "subMilestones": [], "_id": "678c4f7f3b18d82b6896c170"}, {"name": "學習面：XChangeBD 實戰談「資源協作攻略」", "startDate": "2025-05-25T00:00:00", "endDate": "2025-05-31T00:00:00", "subMilestones": [], "_id": "678c4f7f3b18d82b6896c171"}, {"name": "工作面：市場調查課程主題", "startDate": "2025-06-01T00:00:00", "endDate": "2025-06-07T00:00:00", "subMilestones": [], "_id": "678c4f7f3b18d82b6896c172"}, {"name": "工作面：陌生開發尋覓適合講師", "startDate": "2025-06-08T00:00:00", "endDate": "2025-06-14T00:00:00", "subMilestones": [], "_id": "678c4f7f3b18d82b6896c173"}, {"name": "工作面：設計課程社群交流", "startDate": "2025-06-15T00:00:00", "endDate": "2025-06-21T00:00:00", "subMilestones": [], "_id": "678c4f7f3b18d82b6896c174"}, {"name": "工作面：上架課程規劃", "startDate": "2025-06-22T00:00:00", "endDate": "2025-06-28T00:00:00", "subMilestones": [], "_id": "678c4f7f3b18d82b6896c175"}, {"name": "工作面：發想粉絲專頁文案", "startDate": "2025-06-29T00:00:00", "endDate": "2025-07-05T00:00:00", "subMilestones": [], "_id": "678c4f7f3b18d82b6896c176"}, {"name": "學習面：分享這半年左右的各方面收穫", "startDate": "2025-07-06T00:00:00", "endDate": "2025-07-12T00:00:00", "subMilestones": [], "_id": "678c4f7f3b18d82b6896c177"}]	{"tags": [], "description": "我預計在個人threads頁面開設學習分享帳號並用portaly串接個人頁面"}	Complete	Open		{"option": "4人團報價：12000元（一人3000元）", "price": 0, "email": ["yufish0117@gmail.com", "eddie8873192@gmail.com", "choumei.bonnie@gmail.com"], "_id": "678c4f7f3b18d82b6896c178"}	t	t	2025-01-19 01:03:59	2025-01-19 01:03:59	0	\N	2025-01-30 17:08:39.727888	airflow	2025-01-30 17:08:39.728246	airflow
678dc82b3b18d82b6896e04d	學習寫作與經營個人部落格	2025S1	678b01773b18d82b6896b25c	平常有閱讀的習慣，因此希望藉由經營部落格來分享自己的想法，養成寫作習慣、同時增進自己的寫作、思考能力，並期望在過程中認識到不同領域的朋友一起互相學習、成長！\n我的目標是在21週內產出至少18篇文章，並學會經營部落格的相關事務，包括SEO、推廣等等。為了達到這個目標，我會閱讀《寫作是最好的自我投資》、《精準寫作》兩本書，並每天練習寫作，然後利用網路資源學習SEO相關知識。	{"tags": ["興趣熱情", "自我挑戰", "個人成長", "探索可能性", "人際連結", "影響社會"], "description": "首先我很喜歡閱讀，之前讀到學習不能只是輸入也必須輸出，另外寫作也可以結合自身專長、興趣，所以我這是個很好的輸出方式，可以同時加強對學習內容、專長、興趣的認知。第二，寫作也能帶來很多好處，包括增加邏輯思考能力、表達能力、觀察力等。\\n第三，人的成就與意義感很大程度來自「創造」了什麼，因此我想養成一個創作類型的興趣，而寫作是個門檻較低且效益很多的方式。第四，寫作能力在許多領域都能派上用場，對於目前沒有明確職涯方向的我來說是很適合培養的技能。最後，若部落格經營有成，寫作也能成為副業。另外因為文章的特性(邊際成本趨近零)，所以變現後能成為被動收入的來源。公開發表文章或加入社群也有機會認識到其他不同領域的創作者，能夠拓展人脈並互相學習。"}	廣泛閱讀／定期寫作／寫作能力／邏輯思考／自律／SEO搜尋引擎最佳化／自媒體經營	養成固定寫作的習慣、學會有深度且多方面的思考、學會經營個人媒體	{"tags": ["書籍閱讀", "資料蒐集/研究/分析", "觀看影片", "其他：請於下方撰寫"], "description": "閱讀《寫作是最好的自我投資》、《精準寫作》／規律、持續的練習寫作／經營部落格並發表文章／使用網路資源學習SEO相關知識\\n"}	[{"name": "制定詳細的計畫＆開始閱讀／寫作", "startDate": "2025-02-09T00:00:00", "endDate": "2025-02-22T00:00:00", "subMilestones": [{"name": "每天什麼時候練習寫作、寫多久、練習方式？", "dates": [], "description": "", "_id": "678dc82b3b18d82b6896e04f"}, {"name": "閱讀計畫：預計多久內讀完", "dates": [], "description": "", "_id": "678dc82b3b18d82b6896e050"}, {"name": "開始閱讀＆持續練習", "dates": [], "description": "", "_id": "678dc82b3b18d82b6896e051"}], "_id": "678dc82b3b18d82b6896e04e"}, {"name": "選擇平台建立個人部落格＆上傳文章", "startDate": "2025-02-23T00:00:00", "endDate": "2025-03-08T00:00:00", "subMilestones": [{"name": "建立個人部落格(預計使用Vocus、Medium)", "dates": [], "description": "", "_id": "678dc82b3b18d82b6896e053"}, {"name": "讀完《寫作是最好的自我投資》並完成讀書筆記（可寫成文章上傳）", "dates": [], "description": "", "_id": "678dc82b3b18d82b6896e054"}], "_id": "678dc82b3b18d82b6896e052"}, {"name": "讀完《精準寫作》並完成讀書筆記（可寫成文章上傳）", "startDate": "2025-03-09T00:00:00", "endDate": "2025-03-22T00:00:00", "subMilestones": [], "_id": "678dc82b3b18d82b6896e055"}, {"name": "學習SEO相關知識並應用於部落格經營", "startDate": "2025-03-23T00:00:00", "endDate": "2025-04-05T00:00:00", "subMilestones": [{"name": "關鍵字研究與應用", "dates": [], "description": "", "_id": "678dc82b3b18d82b6896e057"}, {"name": "吸引點擊的Meta描述與標題", "dates": [], "description": "", "_id": "678dc82b3b18d82b6896e058"}, {"name": "結構化內容", "dates": [], "description": "", "_id": "678dc82b3b18d82b6896e059"}, {"name": "高品質內容", "dates": [], "description": "", "_id": "678dc82b3b18d82b6896e05a"}], "_id": "678dc82b3b18d82b6896e056"}, {"name": "練習影評寫作", "startDate": "2025-04-06T00:00:00", "endDate": "2025-04-19T00:00:00", "subMilestones": [{"name": "至少寫出兩篇影評文章並上傳", "dates": [], "description": "", "_id": "678dc82b3b18d82b6896e05c"}], "_id": "678dc82b3b18d82b6896e05b"}, {"name": "練習社會觀點寫作", "startDate": "2025-04-20T00:00:00", "endDate": "2025-05-03T00:00:00", "subMilestones": [{"name": "至少寫出兩篇社會觀點文章並上傳", "dates": [], "description": "", "_id": "678dc82b3b18d82b6896e05e"}], "_id": "678dc82b3b18d82b6896e05d"}, {"name": "練習經濟市場分析寫作", "startDate": "2025-05-04T00:00:00", "endDate": "2025-05-17T00:00:00", "subMilestones": [{"name": "至少寫出兩篇經濟市場分析文章並上傳", "dates": [], "description": "", "_id": "678dc82b3b18d82b6896e060"}], "_id": "678dc82b3b18d82b6896e05f"}, {"name": "繼續寫作", "startDate": "2025-05-18T00:00:00", "endDate": "2025-05-31T00:00:00", "subMilestones": [{"name": "至少完成兩篇文章&上傳", "dates": [], "description": "", "_id": "678dc82b3b18d82b6896e062"}], "_id": "678dc82b3b18d82b6896e061"}, {"name": "繼續寫作", "startDate": "2025-06-01T00:00:00", "endDate": "2025-06-14T00:00:00", "subMilestones": [{"name": "至少完成兩篇文章&上傳", "dates": [], "description": "", "_id": "678dc82b3b18d82b6896e064"}], "_id": "678dc82b3b18d82b6896e063"}, {"name": "繼續寫作", "startDate": "2025-06-15T00:00:00", "endDate": "2025-06-28T00:00:00", "subMilestones": [{"name": "至少完成兩篇文章&上傳", "dates": [], "description": "", "_id": "678dc82b3b18d82b6896e066"}], "_id": "678dc82b3b18d82b6896e065"}, {"name": "總結、反思", "startDate": "2025-06-29T00:00:00", "endDate": "2025-07-12T00:00:00", "subMilestones": [{"name": "整理自主學習計畫遇到的挑戰、困難、解決辦法、收穫等", "dates": [], "description": "", "_id": "678dc82b3b18d82b6896e068"}, {"name": "寫一篇總結這次自主學習計畫的文章", "dates": [], "description": "", "_id": "678dc82b3b18d82b6896e069"}], "_id": "678dc82b3b18d82b6896e067"}]	{"tags": ["經營社群媒體", "其他：請於下方撰寫"], "description": "至少產出18篇文章／部落格經營狀況／寫一篇關於自主學習計畫的心得、反思文章\\n"}	Complete	Open		{"option": "4人團報價：12000元（一人3000元）", "price": 0, "email": ["dd20071211@gmail.com", "Ilikedriedfruit@gmail.com", "xuezhiqian759@gmail.com"], "_id": "678dc82b3b18d82b6896e06a"}	f	t	2025-01-20 03:51:07	2025-01-24 04:03:52	0	\N	2025-01-30 17:08:39.727888	airflow	2025-01-30 17:08:39.728246	airflow
678efb1f9ddf9a5f9c3c014f	架設一個電商與形象網站	2025S1	678c9ffe3b18d82b6896c8a9	因為與音樂教室的老闆聊過，發現他們想要有個平台可以買賣樂器與周邊商品，加上教室有辦過很多活動，因此想要為音樂教室做一個電商與形象網站。可以讓店家上架商品與展示活動成果。	{"tags": ["人際連結", "興趣熱情", "自我挑戰", "個人成長", "實用需求"], "description": "發現需求，想要為音樂教室做網站。"}	-學習 UI/UX\n-學習如何使用 wordpress 架設網站\n-學習網站部署等相關知識	學習如何從零開始，架設一個完整的電商網站。	{"tags": ["資料蒐集/研究/分析", "觀看影片", "參與社群", "發起行動", "訪談"], "description": "我預計上網搜尋相關範例，利用 Notion 做筆記。"}	[{"name": "確認需求", "startDate": "2025-02-09T00:00:00", "endDate": "2025-02-15T00:00:00", "subMilestones": [], "_id": "678efb1f9ddf9a5f9c3c0150"}, {"name": "確認 wordpress 主題", "startDate": "2025-02-16T00:00:00", "endDate": "2025-02-22T00:00:00", "subMilestones": [], "_id": "678efb1f9ddf9a5f9c3c0151"}, {"name": "建立網站架構", "startDate": "2025-02-23T00:00:00", "endDate": "2025-03-01T00:00:00", "subMilestones": [], "_id": "678efb1f9ddf9a5f9c3c0152"}, {"name": "蒐集需要的資料", "startDate": "2025-03-02T00:00:00", "endDate": "2025-03-08T00:00:00", "subMilestones": [], "_id": "678efb1f9ddf9a5f9c3c0153"}, {"name": "蒐集需要的資料", "startDate": "2025-03-09T00:00:00", "endDate": "2025-03-15T00:00:00", "subMilestones": [], "_id": "678efb1f9ddf9a5f9c3c0154"}, {"name": "在本機開發", "startDate": "2025-03-16T00:00:00", "endDate": "2025-03-22T00:00:00", "subMilestones": [], "_id": "678efb1f9ddf9a5f9c3c0155"}, {"name": "在本機開發", "startDate": "2025-03-23T00:00:00", "endDate": "2025-03-29T00:00:00", "subMilestones": [], "_id": "678efb1f9ddf9a5f9c3c0156"}, {"name": "在本機開發", "startDate": "2025-03-30T00:00:00", "endDate": "2025-04-05T00:00:00", "subMilestones": [], "_id": "678efb1f9ddf9a5f9c3c0157"}, {"name": "在本機開發", "startDate": "2025-04-06T00:00:00", "endDate": "2025-04-12T00:00:00", "subMilestones": [], "_id": "678efb1f9ddf9a5f9c3c0158"}, {"name": "在本機開發", "startDate": "2025-04-13T00:00:00", "endDate": "2025-04-19T00:00:00", "subMilestones": [], "_id": "678efb1f9ddf9a5f9c3c0159"}, {"name": "在本機開發", "startDate": "2025-04-20T00:00:00", "endDate": "2025-04-26T00:00:00", "subMilestones": [], "_id": "678efb1f9ddf9a5f9c3c015a"}, {"name": "在本機開發", "startDate": "2025-04-27T00:00:00", "endDate": "2025-05-03T00:00:00", "subMilestones": [], "_id": "678efb1f9ddf9a5f9c3c015b"}, {"name": "在本機開發", "startDate": "2025-05-04T00:00:00", "endDate": "2025-05-10T00:00:00", "subMilestones": [], "_id": "678efb1f9ddf9a5f9c3c015c"}, {"name": "在本機開發", "startDate": "2025-05-11T00:00:00", "endDate": "2025-05-17T00:00:00", "subMilestones": [], "_id": "678efb1f9ddf9a5f9c3c015d"}, {"name": "在本機開發", "startDate": "2025-05-18T00:00:00", "endDate": "2025-05-24T00:00:00", "subMilestones": [], "_id": "678efb1f9ddf9a5f9c3c015e"}, {"name": "在本機開發", "startDate": "2025-05-25T00:00:00", "endDate": "2025-05-31T00:00:00", "subMilestones": [], "_id": "678efb1f9ddf9a5f9c3c015f"}, {"name": "在本機開發", "startDate": "2025-06-01T00:00:00", "endDate": "2025-06-07T00:00:00", "subMilestones": [], "_id": "678efb1f9ddf9a5f9c3c0160"}, {"name": "在本機開發", "startDate": "2025-06-08T00:00:00", "endDate": "2025-06-14T00:00:00", "subMilestones": [], "_id": "678efb1f9ddf9a5f9c3c0161"}, {"name": "在本機開發", "startDate": "2025-06-15T00:00:00", "endDate": "2025-06-21T00:00:00", "subMilestones": [], "_id": "678efb1f9ddf9a5f9c3c0162"}, {"name": "找適合的主機", "startDate": "2025-06-22T00:00:00", "endDate": "2025-06-28T00:00:00", "subMilestones": [], "_id": "678efb1f9ddf9a5f9c3c0163"}, {"name": "部署與上架", "startDate": "2025-06-29T00:00:00", "endDate": "2025-07-05T00:00:00", "subMilestones": [], "_id": "678efb1f9ddf9a5f9c3c0164"}, {"name": "網站後台教學使用", "startDate": "2025-07-06T00:00:00", "endDate": "2025-07-12T00:00:00", "subMilestones": [], "_id": "678efb1f9ddf9a5f9c3c0165"}]	{"tags": ["架設網站"], "description": "我預計會架設網站"}	Complete	Open		{"option": "4人團報價：12000元（一人3000元）", "price": 0, "email": ["christy98191@gmail.com", "zhouyuting08620@gmail.com", "linyancheng89@gmail.com"], "_id": "678efb1f9ddf9a5f9c3c0166"}	f	t	2025-01-21 01:40:47	2025-01-23 16:01:26	0	\N	2025-01-30 17:08:39.727888	airflow	2025-01-30 17:08:39.728246	airflow
679231579ddf9a5f9c3cab08	成為精通攝影的人	2025S1	679132119ddf9a5f9c3c7818	想要把人美好的瞬間定格記錄下來。\n目標：希望能夠精進攝影技術有朝一日成為專業攝影\n預計如何達成：先從簡單的手機攝影學起再精通後期後期再進一步學習單反	{"tags": ["興趣熱情"], "description": "因為曾經常去漫展看到攝影拍攝他人身邊也有專業攝影拍照，把人最美的一瞬記錄下來的這個動作讓我感到渴望並且看到他人被拍攝看到圖片欣喜的表情讓我感到滿足，希望有機會這項熱情能成為我未來的職業"}	1.拍攝技巧\n2.後期p圖技巧\n3.社交能力	1.定格美好的一瞬\n2.被拍者看到照片能露出開心的笑容	{"tags": ["資料蒐集/研究/分析", "觀看影片"], "description": "我預計會觀看網上教學視頻先從簡單的手機拍攝學起再去進階，並且一起學習後期技巧，後期完一張照片可以發給身邊人詢問意見和改進的地方，試試給身邊人拍攝並且詢問當事人意見以此去改進自己的不足"}	[{"name": "瞭解手機性能，認識攝影基礎概念", "startDate": "2025-02-09T00:00:00", "endDate": "2025-02-22T00:00:00", "subMilestones": [{"name": "瞭解手機攝影劣勢並找方法彌補", "dates": [], "description": "", "_id": "679231579ddf9a5f9c3cab0a"}, {"name": "一人拍攝劣勢尋找方法彌補", "dates": [], "description": "", "_id": "679231579ddf9a5f9c3cab0b"}], "_id": "679231579ddf9a5f9c3cab09"}, {"name": "基礎構圖技巧 學習色彩氛圍搭配", "startDate": "2025-02-23T00:00:00", "endDate": "2025-03-08T00:00:00", "subMilestones": [{"name": "拍攝不同構圖的照片", "dates": [], "description": "", "_id": "679231579ddf9a5f9c3cab0d"}, {"name": "瞭解不同構圖適合什麼類型照片", "dates": [], "description": "", "_id": "679231579ddf9a5f9c3cab0e"}], "_id": "679231579ddf9a5f9c3cab0c"}, {"name": "穩定拍攝防止振動並且熟悉手機相機", "startDate": "2025-03-09T00:00:00", "endDate": "2025-03-22T00:00:00", "subMilestones": [{"name": "拍攝靜物", "dates": [], "description": "", "_id": "679231579ddf9a5f9c3cab10"}], "_id": "679231579ddf9a5f9c3cab0f"}, {"name": "對焦與主題物突出拍攝", "startDate": "2025-03-23T00:00:00", "endDate": "2025-04-05T00:00:00", "subMilestones": [{"name": "拍攝背景模糊的照片", "dates": [], "description": "", "_id": "679231579ddf9a5f9c3cab12"}, {"name": "拍攝有主次之分的照片", "dates": [], "description": "", "_id": "679232e09ddf9a5f9c3cae01"}], "_id": "679231579ddf9a5f9c3cab11"}, {"name": "人像照片的學習", "startDate": "2025-04-06T00:00:00", "endDate": "2025-04-19T00:00:00", "subMilestones": [{"name": "拍攝自然光下的戶外人像", "dates": [], "description": "", "_id": "679231579ddf9a5f9c3cab14"}], "_id": "679231579ddf9a5f9c3cab13"}, {"name": "動態與小物件的拍攝", "startDate": "2025-04-20T00:00:00", "endDate": "2025-05-03T00:00:00", "subMilestones": [{"name": "拍攝小花朵這類", "dates": [], "description": "", "_id": "679231579ddf9a5f9c3cab16"}, {"name": "拍攝行人或車輛的運動軌跡", "dates": [], "description": "", "_id": "679231579ddf9a5f9c3cab17"}], "_id": "679231579ddf9a5f9c3cab15"}, {"name": "學習夜景拍攝可以定主題進行主題拍攝", "startDate": "2025-05-04T00:00:00", "endDate": "2025-05-17T00:00:00", "subMilestones": [{"name": "拍攝晚上街景或者天空", "dates": [], "description": "", "_id": "679231579ddf9a5f9c3cab19"}], "_id": "679231579ddf9a5f9c3cab18"}, {"name": "創意構圖與倒影", "startDate": "2025-05-18T00:00:00", "endDate": "2025-05-31T00:00:00", "subMilestones": [{"name": "探索獨特的拍攝角度（高角度、低角度等）", "dates": [], "description": "", "_id": "679231579ddf9a5f9c3cab1b"}], "_id": "679231579ddf9a5f9c3cab1a"}, {"name": "照片基礎後期", "startDate": "2025-06-01T00:00:00", "endDate": "2025-06-14T00:00:00", "subMilestones": [], "_id": "679231579ddf9a5f9c3cab1c"}, {"name": "主題系列創作", "startDate": "2025-06-15T00:00:00", "endDate": "2025-06-28T00:00:00", "subMilestones": [{"name": "以五張照片為一主題進行創作", "dates": [], "description": "", "_id": "679231579ddf9a5f9c3cab1e"}], "_id": "679231579ddf9a5f9c3cab1d"}, {"name": "回顧與總結提升", "startDate": "2025-06-29T00:00:00", "endDate": "2025-07-12T00:00:00", "subMilestones": [], "_id": "679231579ddf9a5f9c3cab1f"}]	{"tags": ["藝術創作", "撰寫研究報告"], "description": "我預計設計一個合集裏面放著我的作品，並且做出報告寫出我的心路歷程"}	Complete	Open		{"option": "4人團報價：12000元（一人3000元）", "price": 0, "email": ["christy98191@gmail.com", "taiwansmile@gmail.com", "linyancheng89@gmail.com"], "_id": "679231579ddf9a5f9c3cab20"}	f	t	2025-01-23 12:08:55	2025-01-23 12:15:28	0	\N	2025-01-30 17:08:39.727888	airflow	2025-01-30 17:08:39.728246	airflow
67931b9c9ddf9a5f9c3ce0e5	成為一個可以靈活使用AI的人	2025S1	679316c69ddf9a5f9c3cdd7d	未來在教學上\nAI的使用非常寬廣重要\n所以一定要把它了解清楚	{"tags": ["職涯發展"], "description": "資訊教學時代已經來臨\\n沒有事先了解AI的功能\\n以後很難和學生互動"}	想要先了解AI目前能夠幫忙多少教學科目和內容還有技術	可以活用AI的功能\n應用在教學上	{"tags": ["找學伴共學", "找專家學者", "參與活動或課程"], "description": "想要有人指導帶領我\\n如何進入AI的世界\\n如何操控AI技術\\n達到工作方便效率提高"}	[{"name": "找尋AI的相關資訊", "startDate": "2025-02-09T00:00:00", "endDate": "2025-02-22T00:00:00", "subMilestones": [], "_id": "67931b9c9ddf9a5f9c3ce0e6"}, {"name": "開始閱讀和參與討論", "startDate": "2025-02-23T00:00:00", "endDate": "2025-03-08T00:00:00", "subMilestones": [], "_id": "67931b9c9ddf9a5f9c3ce0e7"}, {"name": "實際操作和觀摩", "startDate": "2025-03-09T00:00:00", "endDate": "2025-03-22T00:00:00", "subMilestones": [], "_id": "67931b9c9ddf9a5f9c3ce0e8"}, {"name": "利用特定議題處理教案1", "startDate": "2025-03-23T00:00:00", "endDate": "2025-04-05T00:00:00", "subMilestones": [], "_id": "67931b9c9ddf9a5f9c3ce0e9"}, {"name": "利用特定議題處理教案2", "startDate": "2025-04-06T00:00:00", "endDate": "2025-04-19T00:00:00", "subMilestones": [], "_id": "67931b9c9ddf9a5f9c3ce0ea"}, {"name": "利用特定議題處理教案3", "startDate": "2025-04-20T00:00:00", "endDate": "2025-05-03T00:00:00", "subMilestones": [], "_id": "67931b9c9ddf9a5f9c3ce0eb"}, {"name": "利用特定議題處理教案4", "startDate": "2025-05-04T00:00:00", "endDate": "2025-05-17T00:00:00", "subMilestones": [], "_id": "67931b9c9ddf9a5f9c3ce0ec"}, {"name": "利用特定議題處理教案5", "startDate": "2025-05-18T00:00:00", "endDate": "2025-05-31T00:00:00", "subMilestones": [], "_id": "67931b9c9ddf9a5f9c3ce0ed"}, {"name": "和專家學者討論分享處理的過程1", "startDate": "2025-06-01T00:00:00", "endDate": "2025-06-14T00:00:00", "subMilestones": [], "_id": "67931b9c9ddf9a5f9c3ce0ee"}, {"name": "和專家學者討論分享處理的過程2", "startDate": "2025-06-15T00:00:00", "endDate": "2025-06-28T00:00:00", "subMilestones": [], "_id": "67931b9c9ddf9a5f9c3ce0ef"}, {"name": "和專家學者討論學習後是否可以再更上一層樓的方向", "startDate": "2025-06-29T00:00:00", "endDate": "2025-07-12T00:00:00", "subMilestones": [], "_id": "67931b9c9ddf9a5f9c3ce0f0"}]	{"tags": ["發起專案或組織"], "description": "學好以後\\n我會免費開一個群組組織\\n來教導學生如何利用AI技術"}	Complete	Open		{"option": "優惠價：8000 元", "price": 0, "email": [], "_id": "67931b9c9ddf9a5f9c3ce0f1"}	t	t	2025-01-24 04:48:28	2025-01-24 04:48:28	0	\N	2025-01-30 17:08:39.727888	airflow	2025-01-30 17:08:39.728246	airflow
6793355a9ddf9a5f9c3ced4d	學習基礎的網頁程式設計技能	2025S1	678a5c596662cd04f9688e5c	我希望學習網頁程式設計，因為我相信程式設計是一種強大的工具，可以用來解決生活中的各種問題。我對於能夠獨立開發一個網站充滿興趣，這不僅能夠提升我的技術能力，還能夠實現我心中的創意和想法。雖然我已經具備了 HTML 和 CSS 的基礎知識，但缺乏實作經驗，因此我希望通過這次學習計畫來鞏固和提升我的技能。\n\n在學習過程中，我希望能夠邊學習技能邊完成課程當中的小專案，這樣可以讓我在實踐中鞏固所學知識，並逐步建立自信。我相信通過這樣的學習方式，能夠更好地理解和應用所學的技術，並最終獨立完成一個完整的專案。\n\n我的學習動機是希望通過學習網頁程式設計，掌握解決實際問題的能力，並能夠獨立完成創意專案，而不僅僅依賴於 AI 生成。我相信這次學習計畫將會是我成長的重要一步，幫助我實現用程式設計改變生活的目標。	{"tags": ["好奇心驅動", "興趣熱情", "自我挑戰", "個人成長"], "description": "想要有可以獨立開發網頁工具，解決問題或實現好玩點子的能力！"}	- HTML 基礎\n- CSS 常用語法\n- 使用 CSS 變更 HTML 標籤特性\n- Flex 網頁排版技巧\n- 相對/絕對定位\n- 切圖技巧\n- 表格與表單設計技巧\n- CSS3 技巧	- 能實作出可以呈現資訊的靜態網頁\n- 如何優化網站效能與外觀	{"tags": ["資料蒐集/研究/分析", "觀看影片"], "description": "我會跟隨線上課程的腳步進行實作，而聽不懂的地方輔以閱讀相關的網路文章解決，並將我的學習歷程寫成 Blog 更新在 Medium （或方格子）上。"}	[{"name": "熟悉編輯器、 HTML 基礎", "startDate": "2025-02-09T00:00:00", "endDate": "2025-02-22T00:00:00", "subMilestones": [], "_id": "6793355a9ddf9a5f9c3ced4e"}, {"name": "CSS 基礎", "startDate": "2025-02-23T00:00:00", "endDate": "2025-03-08T00:00:00", "subMilestones": [], "_id": "6793355a9ddf9a5f9c3ced4f"}, {"name": "使用 CSS 變更 HTML 標籤特性（一）", "startDate": "2025-03-09T00:00:00", "endDate": "2025-03-22T00:00:00", "subMilestones": [], "_id": "6793355a9ddf9a5f9c3ced50"}, {"name": "使用 CSS 變更 HTML 標籤特性（二）", "startDate": "2025-03-23T00:00:00", "endDate": "2025-04-05T00:00:00", "subMilestones": [], "_id": "6793355a9ddf9a5f9c3ced51"}, {"name": "Flex 網頁排版技巧（一）", "startDate": "2025-04-06T00:00:00", "endDate": "2025-04-19T00:00:00", "subMilestones": [], "_id": "6793355a9ddf9a5f9c3ced52"}, {"name": "Flex 網頁排版技巧（二）、Flex 精神時光屋（一）", "startDate": "2025-04-20T00:00:00", "endDate": "2025-05-03T00:00:00", "subMilestones": [], "_id": "6793355a9ddf9a5f9c3ced53"}, {"name": "Flex 精神時光屋（二）", "startDate": "2025-05-04T00:00:00", "endDate": "2025-05-17T00:00:00", "subMilestones": [], "_id": "6793355a9ddf9a5f9c3ced54"}, {"name": "網頁排版技巧 Part 2、切圖技巧（一）", "startDate": "2025-05-18T00:00:00", "endDate": "2025-05-31T00:00:00", "subMilestones": [], "_id": "6793355a9ddf9a5f9c3ced55"}, {"name": "切圖技巧（二）、表格與表單設計技巧（一）", "startDate": "2025-06-01T00:00:00", "endDate": "2025-06-14T00:00:00", "subMilestones": [], "_id": "6793355a9ddf9a5f9c3ced56"}, {"name": "表格與表單設計技巧（二）、CSS3 技巧", "startDate": "2025-06-15T00:00:00", "endDate": "2025-06-28T00:00:00", "subMilestones": [], "_id": "6793355a9ddf9a5f9c3ced57"}, {"name": "進階技巧、實戰講解", "startDate": "2025-06-29T00:00:00", "endDate": "2025-07-12T00:00:00", "subMilestones": [], "_id": "6793355a9ddf9a5f9c3ced58"}]	{"tags": ["架設網站"], "description": "撰寫 Blog 紀錄歷程"}	Complete	Open		{"option": "4人團報價：12000元（一人3000元）", "price": 0, "email": ["eddie8873192@gmail.com", "jiayounikehuzhe@gmail.com", "choumei.bonnie@gmail.com"], "_id": "6793355a9ddf9a5f9c3ced59"}	f	t	2025-01-24 06:38:18	2025-01-24 06:38:18	0	\N	2025-01-30 17:08:39.727888	airflow	2025-01-30 17:08:39.728246	airflow
67935be39ddf9a5f9c3d0727	成為一位影片剪輯師	2025S1	6762bfcce9e593a8f3ef0b62	喜歡表達、有很多靈感\n希望成為全職剪輯師\n業餘時間以影片為媒材：發聲、協助他人發聲、協助他人探索自我認同、用影片帶給閱聽眾體感體驗\n	{"tags": ["興趣熱情", "職涯發展", "社會認可"], "description": "- 擅長且熱衷於發想創意點子，希望剪輯能力可以促進自己具體實踐\\n- 我有滿強的表達慾望，也有源源不絕的想法，雖然沒那麼多自信\\n- 有一些事情想表達，也想協助他人表達\\n　- 想促進社會議題發聲\\n　- 想透過影片協助自己／他人探索自我認同\\n- 想接案維生\\n"}	- 影片剪輯\n- 基礎攝影概念\n- 短影音腳本模組\n- 短影音開頭\n- 讓人有感覺、放鬆的影片\n- 自我認同相關影片\n- 訪談影片	【基本】\n- 成為全職剪輯師\n- 熟悉使用剪映（電腦版）剪輯影片\n- 建立清楚的工作流程\n- 釐清自己的市場定位\n- 釐清未來增能方向\n- 養成實踐的習慣\n- 穩定創作\n\n\n\n【進階】\n- 熟悉使用 Davinci 剪輯影片\n- 熟悉使用 Capcut（手機） 剪輯影片\n- 熟悉使用 Adobe Premiere 剪輯影片	{"tags": ["觀看影片", "資料蒐集/研究/分析"], "description": "目前已蒐集一些教學影片、拍攝一些影片素材，並整理在Airtable上\\n剛開始練習使用剪映剪輯影片\\n已熟悉剪映的介面\\n已在社群媒體上，建立剪輯練習的帳號，未來定期po文，督促自己練習同時測試群眾反應\\n參考喜歡的創作者並學習\\n隨機研究他人的影片，記錄自己的分析觀點，並提出優化建議\\n優化建議加入剪輯練習中"}	[{"name": "基礎練習＋發布社群平台", "startDate": "2025-02-09T00:00:00", "endDate": "2025-02-22T00:00:00", "subMilestones": [{"name": "熟悉手邊的影片素材", "dates": [], "description": "", "_id": "67935be39ddf9a5f9c3d0729"}, {"name": "上字幕", "dates": [], "description": "", "_id": "67935be39ddf9a5f9c3d072a"}, {"name": "上字卡", "dates": [], "description": "", "_id": "67935be39ddf9a5f9c3d072b"}, {"name": "調色調光", "dates": [], "description": "", "_id": "67935be39ddf9a5f9c3d072c"}, {"name": "上特效", "dates": [], "description": "", "_id": "67935be39ddf9a5f9c3d072d"}, {"name": "剪輯成短影音", "dates": [], "description": "", "_id": "67935be39ddf9a5f9c3d072e"}, {"name": "發布社群平台", "dates": [], "description": "", "_id": "67935be39ddf9a5f9c3d072f"}], "_id": "67935be39ddf9a5f9c3d0728"}, {"name": "基礎練習＋發佈，嘗試接案 or 投履歷", "startDate": "2025-02-23T00:00:00", "endDate": "2025-03-08T00:00:00", "subMilestones": [], "_id": "67935be39ddf9a5f9c3d0730"}, {"name": "基礎練習＋發佈，嘗試接案 or 投履歷", "startDate": "2025-03-09T00:00:00", "endDate": "2025-03-22T00:00:00", "subMilestones": [], "_id": "67935be39ddf9a5f9c3d0731"}, {"name": "基礎練習＋發佈，嘗試接案 or 投履歷", "startDate": "2025-03-23T00:00:00", "endDate": "2025-04-05T00:00:00", "subMilestones": [], "_id": "67935be39ddf9a5f9c3d0732"}, {"name": "進階練習＋發佈，嘗試接案 or 投履歷，建立清楚的工作流程", "startDate": "2025-04-06T00:00:00", "endDate": "2025-04-19T00:00:00", "subMilestones": [], "_id": "67935be39ddf9a5f9c3d0733"}, {"name": "進階練習＋發佈，嘗試接案 or 投履歷，建立清楚的工作流程", "startDate": "2025-04-20T00:00:00", "endDate": "2025-05-03T00:00:00", "subMilestones": [], "_id": "67935be39ddf9a5f9c3d0734"}, {"name": "進階練習＋發佈，嘗試接案 or 投履歷，釐清自己的市場定位", "startDate": "2025-05-04T00:00:00", "endDate": "2025-05-17T00:00:00", "subMilestones": [], "_id": "67935be39ddf9a5f9c3d0735"}, {"name": "進階練習＋發佈，嘗試接案 or 投履歷，釐清自己的市場定位", "startDate": "2025-05-18T00:00:00", "endDate": "2025-05-31T00:00:00", "subMilestones": [], "_id": "67935be39ddf9a5f9c3d0736"}, {"name": "進階練習＋發佈，嘗試接案 or 投履歷，釐清未來增能方向", "startDate": "2025-06-01T00:00:00", "endDate": "2025-06-14T00:00:00", "subMilestones": [], "_id": "67935be39ddf9a5f9c3d0737"}, {"name": "進階練習＋發佈，嘗試接案 or 投履歷，釐清未來增能方向", "startDate": "2025-06-15T00:00:00", "endDate": "2025-06-28T00:00:00", "subMilestones": [], "_id": "67935be39ddf9a5f9c3d0738"}, {"name": "進階練習＋發佈，嘗試接案 or 投履歷，釐清未來增能方向", "startDate": "2025-06-29T00:00:00", "endDate": "2025-07-12T00:00:00", "subMilestones": [], "_id": "67935be39ddf9a5f9c3d0739"}]	{"tags": ["經營社群媒體"], "description": "Youtube頻道、Instagram、Threads"}	Complete	Open		{"option": "4人團報價：12000元（一人3000元）", "price": 0, "email": ["1/23有填寫【想找人團報】", "希望能報名此項目", "等主辦的消息，感謝💕"], "_id": "67935be39ddf9a5f9c3d073a"}	f	t	2025-01-24 09:22:43	2025-01-24 09:22:43	0	\N	2025-01-30 17:08:39.727888	airflow	2025-01-30 17:08:39.728246	airflow
67939ec39ddf9a5f9c3d4fe4	從喝茶興趣到尋找本土認同；連結歷史文化	2025S1	6784ea3c6662cd04f9685160	為什麼想做：\n我在生活中主動去體驗茶與咖啡，依靠的是很純粹的內在動力，常常自己沖泡茶葉，但除了自己體驗本身，還想要與更多人交流，分享這份文化，而且我注意到參與這個圈子的人有越來越少的趨勢......茶雖然以手搖飲等形式進入青年市場，但背後的歷史與文化卻逐漸被淡化。我想要去深入理解茶文化的變遷與現況，並思考如何吸引更多同齡人參與，將這項文化重新融入現代生活。\n\n想要做到什麼：\n1.知識面\n- 了解台灣茶文化的歷史與發展脈絡，例如民初家家戶戶飲茶的習俗如何消退。\n- 認識茶葉產業的現況，包括茶農的工作模式與消費市場的轉變。\n- 探討圈外人對茶文化的印象與看法。\n先理解現況，再來才去找有沒有什麼我能幫上忙的。\n\n2.感官體驗－飲用更多茶和咖啡，豐富感官的敏銳度......也要記得興趣的初衷是體會到有趣的感官經驗\n\n3. 穩定的輸出\n- 建立文字或視覺紀錄，用於分享學習過程與成果。\n	{"tags": ["個人成長", "探索可能性", "自我挑戰", "影響社會"], "description": "幾年前因為家中有喝茶的長輩，而開啟學喝茶的契機，默默自學了幾年。但只有自己一個人的時候，學習的頻率就會很隨性，如果能有一群人交流，應該能獲得很多刺激，也能滿足分享給他人，獲得回饋的願望。\\n\\n能持續在品茶與咖啡中獲得動力，是因為我享受嚐到不同滋味的過程，喜歡運用感官的觀察，而且最近發現越來越能命中味道，比如說聞出三峽碧螺春當中的綠豆味；聞出咖啡豆還有一些別人沒發現的莓果甜香，交出答案後，得到別人（茶商/咖啡師）肯定的回覆說「你講的沒錯，正是這個味道😌」，我就知道又是一輪新的探索動力\\n\\n另外就是，我希望自己可以做到穩定的輸出，或是主動創造一個必須輸出的機會。輸出通常能讓我練習更好的將想法傳遞出去，也可以說是為了更好的鍛鍊學習，所以啟動學習計劃。\\n\\n"}	台灣茶文化與歷史：\n閱讀相關書籍，市面上有許多製茶或發展的歷史書或漫畫\n查閱學術文章或網絡資源，或者訪問一些老前輩、茶莊，了解茶文化在不同時期的變遷與社會習俗\n\n感官辨識與品茶技巧：\n練習聞香、品味，學習記錄茶葉與咖啡的風味特徵。多去認識不同的材料，從茶跨到咖啡與香水的領域，多方面的認識氣味\n\n紀錄、推廣與社群交流：\n要學會紀錄的，調整自己輸出內容的節奏，也許會先寫出自己看的版本，才去設想要如何讓別人看得懂	希望能將茶的文化分享給其他人\n\n- 增進感官體驗的資料庫，多看多喝多聞。並記錄味覺的感受\n- 想要進到茶園去訪問工作者、觀察他們的工作模式\n- 整理出方便閱讀的圖文格式，能將這些檔案分享給有興趣的人	{"tags": ["資料蒐集/研究/分析", "參與社群", "參與活動或課程", "田野調查", "訪談"], "description": "資料蒐集：先吸收網路上能找到的內容，包括已經追蹤的茶飲自媒體，相關的產業工作者，或是較為正式的論文資料和文章，都是吸收知識的好材料\\n\\n參與社群/活動或課程：已經準備參加一些手沖咖啡聚會，可以多認識人，和在短時間接觸許多不同風味的咖啡\\n\\n田野調查：主要是想走入茶園的部分，透過直接接觸的方法，觀看他們工作的模式，還有問產業當中的人，在現代遇到的情況"}	[{"name": "重新建立習慣", "startDate": "2025-02-09T00:00:00", "endDate": "2025-02-22T00:00:00", "subMilestones": [{"name": "紀錄已經有的茶葉和咖啡豆，用Notion做收藏庫", "dates": [], "description": "", "_id": "6793b8eb9ddf9a5f9c3d964f"}], "_id": "67939ec39ddf9a5f9c3d4fe5"}, {"name": "釐清目標", "startDate": "2025-02-23T00:00:00", "endDate": "2025-03-08T00:00:00", "subMilestones": [{"name": "明白我到底想改變什麼現況", "dates": [], "description": "", "_id": "6793b8eb9ddf9a5f9c3d9651"}], "_id": "67939ec39ddf9a5f9c3d4fe6"}, {"name": "有固定頻率的在品味茶與咖啡，並製作心得", "startDate": "2025-03-09T00:00:00", "endDate": "2025-03-22T00:00:00", "subMilestones": [], "_id": "67939ec39ddf9a5f9c3d4fe7"}, {"name": "頻繁接觸相關的活動，認識人也讓別人認識自己", "startDate": "2025-03-23T00:00:00", "endDate": "2025-04-05T00:00:00", "subMilestones": [], "_id": "67939ec39ddf9a5f9c3d4fe8"}, {"name": "準備實地探索與田野調查", "startDate": "2025-04-06T00:00:00", "endDate": "2025-04-19T00:00:00", "subMilestones": [], "_id": "67939ec39ddf9a5f9c3d4fe9"}, {"name": "和已經認識的人聯絡，計劃如何到他們的工作環境觀察", "startDate": "2025-04-20T00:00:00", "endDate": "2025-05-03T00:00:00", "subMilestones": [], "_id": "67939ec39ddf9a5f9c3d4fea"}, {"name": "留在田野當中訪問，與人互動", "startDate": "2025-05-04T00:00:00", "endDate": "2025-05-17T00:00:00", "subMilestones": [], "_id": "67939ec39ddf9a5f9c3d4feb"}, {"name": "整理收集到的資料", "startDate": "2025-05-18T00:00:00", "endDate": "2025-05-31T00:00:00", "subMilestones": [], "_id": "67939ec39ddf9a5f9c3d4fec"}, {"name": "準備成果的展示", "startDate": "2025-06-01T00:00:00", "endDate": "2025-06-14T00:00:00", "subMilestones": [], "_id": "67939ec39ddf9a5f9c3d4fed"}, {"name": "成果分享", "startDate": "2025-06-15T00:00:00", "endDate": "2025-06-28T00:00:00", "subMilestones": [], "_id": "67939ec39ddf9a5f9c3d4fee"}, {"name": "紀錄整份馬拉松的學習過程與反思", "startDate": "2025-06-29T00:00:00", "endDate": "2025-07-12T00:00:00", "subMilestones": [], "_id": "67939ec39ddf9a5f9c3d4fef"}]	{"tags": ["舉辦活動", "藝術創作"], "description": "首先我一定會有幾份中途留下來的品嚐心得，可以寫出不同主題的文章。再來也可以舉辦一些茶會，大家帶喜歡的茶葉一同聚在一起分享\\n\\n藝術創作我有點猶豫能力方面的條件，但如果我能把產業工作者，工作時的樣貌，用鉛筆速寫記錄下來，似乎也有點有趣......"}	Complete	Open		{"option": "4人團報價：12000元（一人3000元）", "price": 0, "email": ["dd20071211@gmail.com", "xuezhiqian759@gmail.com", "justin387130618@gmail.com"], "_id": "67939ec39ddf9a5f9c3d4ff0"}	f	t	2025-01-24 14:08:03	2025-01-24 15:59:39	0	\N	2025-01-30 17:08:39.727888	airflow	2025-01-30 17:08:39.728246	airflow
6793ae129ddf9a5f9c3d6ccb	發展並多了解輔導諮商相關工作(輔導員 實驗教育輔導老師 協助人員等)	2025S1	678d3b563b18d82b6896d9d4	對於輔導諮商有興趣想了解及發展。\n想藉由夥伴交流、書籍、講座等等更了解輔導工作更詳細知識，看到更多的發展道路。\n在最後成果時可以用簡報分析、實際體驗、QA問答方式進行呈現分享。\n	{"tags": ["好奇心驅動", "興趣熱情", "自我挑戰", "個人成長", "職涯發展", "探索可能性", "應對未來", "創新發展"], "description": "過往我常常擔任學姊或姐姐的角色，會不自覺想要照顧學弟妹或是年齡小的人，也因此發現在進行這些過程中，我發現我對於傾訴聆聽，關心當事人並同理他們，以及想要幫助他們的心情都會讓我很開心和幸福！雖然過程很累很辛苦，但是是願意為了對方而承受的累，以及學習更多！"}	1.在與夥伴或引導師交流時，多提出好奇的問題。\n2.鑽研心理學、諮商的書籍，了解更多面向。\n3.練習諮商輔導技巧，或是從講座中得到收穫。	1.有更多諮商輔導的資源、人脈。\n2.對於這塊有更廣闊的視野，因為現在對於諮商輔導工作還維持在一定的理解範圍，還有太多我不懂的事物。\n3.實際練習。(但是可能有點緊張	{"tags": ["資料蒐集/研究/分析", "書籍閱讀", "觀看影片", "參與活動或課程", "場域實習", "聽Podcast"], "description": "1.資料收集：從影片、文章、實際案例等統整分析結論\\n2.書籍閱讀：從心理學、諮商等西相關書籍獲得知識和實用技巧。(不一定要單純文字的那種書籍，可以是日常生活化或漫畫等呈現方式的書去做閱讀)\\n3.觀看影片：看youtube相關影片，聽聽其他人的想法與經歷，從中吸收到不同知識，有參考的方向。\\n4.參與活動或課程：往外探索看有沒有合適的活動可以進行參與。或是可以和島島阿學的夥伴進行討論分享，實際體驗諮商技巧。\\n5.場域實習：如果有機會及緣分，願意並且想到相關地方進行實習與踏查。\\n6.podcast：尋找並聆聽喜歡或是好奇的內容，訓練抓重點外，也可以尋找有沒有諮商對話的練習過程。\\n\\n可以用樹狀圖、心智圖、限動、ppt等方式做學習紀錄。"}	[{"name": "了解心理學、諮商輔導這條路會遇到的事情、困境困難，與優勢劣勢，從事這份工作的人的心得感想。並記錄下來。", "startDate": "2025-02-09T00:00:00", "endDate": "2025-02-22T00:00:00", "subMilestones": [], "_id": "6793ae129ddf9a5f9c3d6ccc"}, {"name": "1.心理學相關影片收集及了解觀看，並記錄存取有興趣或是想分享的諮商輔導相關知識。2.了解相關大學管道。", "startDate": "2025-02-23T00:00:00", "endDate": "2025-03-08T00:00:00", "subMilestones": [], "_id": "6793ae129ddf9a5f9c3d6ccd"}, {"name": "空大心理學教科書閱讀。(初步了解大)(對閱讀不擅長，需長時間適應)", "startDate": "2025-03-09T00:00:00", "endDate": "2025-03-22T00:00:00", "subMilestones": [], "_id": "6793ae129ddf9a5f9c3d6cce"}, {"name": "心理學、諮商輔導相關書籍閱讀並抓起重點和實用的技巧。(不是教科書，是for日常生活化、漫畫", "startDate": "2025-03-23T00:00:00", "endDate": "2025-04-05T00:00:00", "subMilestones": [], "_id": "6793ae129ddf9a5f9c3d6ccf"}, {"name": "空大心理學相關書籍延伸學習(剛好空大考試週，運用筆記、心智圖讓自己更清晰並且知道如何運用", "startDate": "2025-04-06T00:00:00", "endDate": "2025-04-19T00:00:00", "subMilestones": [], "_id": "6793ae129ddf9a5f9c3d6cd0"}, {"name": "尋找相關講座，與夥伴交流實際操作。(可能會變", "startDate": "2025-04-20T00:00:00", "endDate": "2025-05-03T00:00:00", "subMilestones": [], "_id": "6793ae129ddf9a5f9c3d6cd1"}, {"name": "閱讀心靈雞湯、各種生活議題等生活化書籍，並寫出心得。", "startDate": "2025-05-04T00:00:00", "endDate": "2025-05-17T00:00:00", "subMilestones": [], "_id": "6793ae129ddf9a5f9c3d6cd2"}, {"name": "從podcast中尋找喜歡的內容，並且找到有練習輔導諮商對話，說話的藝術等等內容並記錄或開口練習。", "startDate": "2025-05-18T00:00:00", "endDate": "2025-05-31T00:00:00", "subMilestones": [], "_id": "6793ae129ddf9a5f9c3d6cd3"}, {"name": "如果可以的話，希望有機會可以進行相關實習。(不一定這週", "startDate": "2025-06-01T00:00:00", "endDate": "2025-06-14T00:00:00", "subMilestones": [], "_id": "6793ae129ddf9a5f9c3d6cd4"}, {"name": "在展賦上班或一對一輔導時，適時與學生對話聊天並觀察其中的行為與言語，並瞭解他們在想什麼，從中得到一點點的經驗。(不一定是這週，可能每週時不時都會發生", "startDate": "2025-06-15T00:00:00", "endDate": "2025-06-28T00:00:00", "subMilestones": [], "_id": "6793ae129ddf9a5f9c3d6cd5"}, {"name": "準備成果發表，利用簡報或是實際練習體驗呈現分享。", "startDate": "2025-06-29T00:00:00", "endDate": "2025-07-12T00:00:00", "subMilestones": [], "_id": "6793ae129ddf9a5f9c3d6cd6"}]	{"tags": ["撰寫研究報告"], "description": "統整每週學習的內容並寫心得，QA回答分享。"}	Complete	Open		{"option": "4人團報價：12000元（一人3000元）", "price": 0, "email": ["linyancheng89@gmail.com", "taiwansmile@gmail.com", "zhouyuting08620@gmail.com"], "_id": "6793ae129ddf9a5f9c3d6cd7"}	f	t	2025-01-24 15:13:22	2025-01-24 15:58:45	0	\N	2025-01-30 17:08:39.727888	airflow	2025-01-30 17:08:39.728246	airflow
6793b5c69ddf9a5f9c3d7e58	成為一名音樂創作者&歌手	2025S1	6760492ac58563e57e7e7fd7	我的夢想是能夠創作出音樂和獨特的聲音，讓大家聽見並喜歡，能夠讓我的音樂陪伴在大家的日常生活中。未來希望能夠往這方面發展。\n我的目標是發1首完整的歌和1首翻唱，預計先從學習編曲、開始嘗試製作音樂做起，還有精進自己的吉他能力以協助編曲。	{"tags": ["自我挑戰", "興趣熱情", "好奇心驅動", "個人成長", "職涯發展", "探索可能性", "受事件啟發"], "description": "從國二開始我嘗試唱歌，某一天錄翻唱給同學聽的時候她大為驚艷，她告訴我我的歌聲很好聽，那是我第一次被人有那麼深的鼓勵和相信，漸漸地，我愛上了唱歌，我每一天放學後都在練習唱歌。\\n那時候我很喜歡9m88，深受她的風格和她喜歡的音樂影響，是我的音樂和美學啟蒙，更讓我認識到台灣獨立音樂的世界，徹底打開我對台灣音樂的視野和想像。\\n國三因為我對生活迷茫又備考壓力大，開始找尋心靈上的意義，因此我喜歡上了安溥、鄭宜農這類型的創作歌手，是他們讓我認識文學是如何體現在歌詞中，如何在歌詞中表達想法。我時常把我的想法寄託在那些文字裡。\\n我開始喜歡很多不同音樂的曲風，爵士、實驗、HIP HOP、R&B、數字搖滾......\\n"}	樂理基礎：學習和弦進行（如常見的流行和弦走向）、音階（如大調、小調），理解它們如何影響音樂氛圍。\n編曲技巧：學會如何安排主歌、副歌與過門的結構，讓音樂聽起來更完整。\nBandLab 操作：熟悉基本功能，如鍵盤模擬、節奏製作、音效混音等。\n音樂實驗：嘗試設計自己喜歡的音色或混合不同的風格，提升創意表現力。	1.學會使用 BandLab 進行音樂創作，完成自己的第一首完整音樂作品和翻唱作品。\n2.理解基礎樂理，能應用在創作和編曲中。\n3.建立定期創作的習慣，培養對音樂製作的耐心與專注力。\n4.精進自己的吉他彈奏能力。	{"tags": ["書籍閱讀", "找學伴共學", "找專家學者", "參與活動或課程"], "description": "每兩週完成一小段音樂作品（30 秒至 1 分鐘），並記錄創作過程。\\n嘗試用 BandLab 的鍵盤功能編曲，並將樂理應用到實作中。\\n\\n\\n參加音樂課程（如吉他課或樂理課）補充知識。\\n利用 YouTube 和線上教學影片學習 BandLab 的進階操作與編曲技巧。\\n\\n用筆記或部落格記錄學習心得與作品完成過程。\\n定期聽其他創作者的作品，分析他們的結構與特色，並寫下心得。\\n\\n將完成的作品分享給朋友或同好，蒐集意見並改善下一次的創作。"}	[{"name": "準備期 - 基礎強化與翻唱規劃", "startDate": "2025-02-09T00:00:00", "endDate": "2025-02-22T00:00:00", "subMilestones": [{"name": "初步學習混音概念，了解如何讓音軌層次分明。", "dates": [], "description": "", "_id": "6793b5c69ddf9a5f9c3d7e5a"}, {"name": "掌握翻唱《月亮惹的禍》所需的基本技能，熟悉和弦與節奏。", "dates": [], "description": "", "_id": "6793b5c69ddf9a5f9c3d7e5b"}, {"name": "找到《月亮惹的禍》的和弦與節奏結構，用吉他練習基礎伴奏。", "dates": [{"$date": "2024-01-01T00:00:00"}, {"$date": "2024-01-02T00:00:00"}], "description": "", "_id": "6793b5c69ddf9a5f9c3d7e5c"}, {"name": "使用 BandLab 錄下吉他伴奏，並嘗試錄製人聲。", "dates": [{"$date": "2024-01-02T00:00:00"}, {"$date": "2024-01-03T00:00:00"}], "description": "", "_id": "6793b5c69ddf9a5f9c3d7e5d"}, {"name": "觀看 EQ 和聲音分離的基礎教學，學會調整吉他和人聲的頻率避免衝突。", "dates": [{"$date": "2024-01-03T00:00:00"}, {"$date": "2024-01-04T00:00:00"}], "description": "", "_id": "6793b5c69ddf9a5f9c3d7e5e"}, {"name": "確定歌曲中的分段安排（主歌、副歌、和聲）及要模仿的效果。", "dates": [], "description": "", "_id": "6793b5c69ddf9a5f9c3d7e5f"}], "_id": "6793b5c69ddf9a5f9c3d7e59"}, {"name": "吉他精進與人聲錄製實驗", "startDate": "2025-02-23T00:00:00", "endDate": "2025-03-08T00:00:00", "subMilestones": [{"name": "使用 BandLab 完成吉他的分段錄製，並嘗試使用點擊音（Click Track）保持穩定節奏。", "dates": [], "description": "", "_id": "6793b5c69ddf9a5f9c3d7e61"}, {"name": "嘗試錄製主旋律，初步感受音準和情感表達。", "dates": [], "description": "", "_id": "6793b5c69ddf9a5f9c3d7e62"}, {"name": "分析歌曲中的和聲設計，用 BandLab 嘗試錄下多聲部。", "dates": [], "description": "", "_id": "6793b5c69ddf9a5f9c3d7e63"}], "_id": "6793b5c69ddf9a5f9c3d7e60"}, {"name": "深入混音技巧與歌曲細化:強化混音技巧、完成翻唱初版", "startDate": "2025-03-09T00:00:00", "endDate": "2025-03-22T00:00:00", "subMilestones": [{"name": "調整吉他的 EQ，減少低頻雜音，突出中頻清晰度。 為人聲加入適量混響（Reverb）與壓縮器（Compressor），提升聽感。", "dates": [], "description": "", "_id": "6793b5c69ddf9a5f9c3d7e65"}, {"name": "加強和聲的混音處理，讓它與主旋律和諧融合。", "dates": [], "description": "", "_id": "6793b5c69ddf9a5f9c3d7e66"}, {"name": "進一步調整歌曲結構與段落，完成歌曲的整體混音。", "dates": [], "description": "", "_id": "6793b5c69ddf9a5f9c3d7e67"}], "_id": "6793b5c69ddf9a5f9c3d7e64"}, {"name": "和弦進階與編曲結構", "startDate": "2025-03-23T00:00:00", "endDate": "2025-04-05T00:00:00", "subMilestones": [{"name": "學習進階和弦： 研究 7 和弦與 9 和弦的理論", "dates": [], "description": "", "_id": "6793b5c69ddf9a5f9c3d7e69"}, {"name": "用吉他實驗不同和弦進行，將其應用到 BandLab", "dates": [], "description": "", "_id": "6793b5c69ddf9a5f9c3d7e6a"}, {"name": "將創作分為主歌（Verse）、副歌（Chorus）、過門（Bridge）。", "dates": [], "description": "", "_id": "6793b5c69ddf9a5f9c3d7e6b"}, {"name": "每段設計不同和弦進行，並保持旋律統一性。", "dates": [], "description": "", "_id": "6793b5c69ddf9a5f9c3d7e6c"}, {"name": "完成短作品： 將旋律、和弦與節奏結合，創作一首 1 分鐘長的作品", "dates": [], "description": "", "_id": "6793b5c69ddf9a5f9c3d7e6d"}], "_id": "6793b5c69ddf9a5f9c3d7e68"}, {"name": "加入音色與背景細節", "startDate": "2025-04-06T00:00:00", "endDate": "2025-04-19T00:00:00", "subMilestones": [{"name": "學習基本混響（Reverb）與延遲（Delay）的使用。", "dates": [], "description": "", "_id": "6793b5c69ddf9a5f9c3d7e6f"}, {"name": "用 BandLab 合成器插件創建空靈或特殊音效。", "dates": [], "description": "", "_id": "6793b5c69ddf9a5f9c3d7e70"}, {"name": "嘗試加入背景細節（如環境聲、Pad）。", "dates": [], "description": "", "_id": "6793b5c69ddf9a5f9c3d7e71"}, {"name": "完成短編曲： 編寫一段氛圍感突出的音樂，加入細節音色與效果器。", "dates": [], "description": "", "_id": "6793b5c69ddf9a5f9c3d7e72"}], "_id": "6793b5c69ddf9a5f9c3d7e6e"}, {"name": "影片製作準備與初步剪輯", "startDate": "2025-04-20T00:00:00", "endDate": "2025-05-03T00:00:00", "subMilestones": [{"name": "用手機拍攝MV畫面，準備影像素材。", "dates": [], "description": "", "_id": "6793b5c69ddf9a5f9c3d7e74"}, {"name": "準備拍攝畫面草稿", "dates": [], "description": "", "_id": "6793b5c69ddf9a5f9c3d7e75"}, {"name": "拍攝MV。", "dates": [], "description": "", "_id": "6793b5c69ddf9a5f9c3d7e76"}], "_id": "6793b5c69ddf9a5f9c3d7e73"}, {"name": "風格挑戰與多層次編曲:翻唱竇靖童的一首歌，挑戰新風格編曲。", "startDate": "2025-05-04T00:00:00", "endDate": "2025-05-17T00:00:00", "subMilestones": [{"name": "分析原曲的和弦進行與背景設計。", "dates": [], "description": "", "_id": "6793b5c69ddf9a5f9c3d7e78"}, {"name": "用合成器製作出類似的氛圍感。", "dates": [], "description": "", "_id": "6793b5c69ddf9a5f9c3d7e79"}, {"name": "設計旋律與和弦，嘗試創作一首風格化作品。", "dates": [], "description": "", "_id": "6793b5c69ddf9a5f9c3d7e7a"}], "_id": "6793b5c69ddf9a5f9c3d7e77"}, {"name": "隨後期計畫調整。", "startDate": "2025-05-18T00:00:00", "endDate": "2025-05-31T00:00:00", "subMilestones": [], "_id": "6793b5c69ddf9a5f9c3d7e7b"}, {"name": "隨後期計畫調整。", "startDate": "2025-06-01T00:00:00", "endDate": "2025-06-14T00:00:00", "subMilestones": [], "_id": "6793b5c69ddf9a5f9c3d7e7c"}, {"name": "隨後期計畫調整。", "startDate": "2025-06-15T00:00:00", "endDate": "2025-06-28T00:00:00", "subMilestones": [], "_id": "6793b5c69ddf9a5f9c3d7e7d"}, {"name": "隨後期計畫調整。", "startDate": "2025-06-29T00:00:00", "endDate": "2025-07-12T00:00:00", "subMilestones": [], "_id": "6793b5c69ddf9a5f9c3d7e7e"}]	{"tags": ["藝術創作", "經營社群媒體", "拍影片"], "description": "我會在BANDLAB和STREET VOICE發佈翻唱作品和編曲的成果，還有用MV影像呈現自己的翻唱。"}	Complete	Open		{"option": "4人團報價：12000元（一人3000元）", "price": 0, "email": ["ctc.chang0514@gmail.com", "a0912358866@gmail.com", "the.oc1122@gmail.com"], "_id": "6793b5c69ddf9a5f9c3d7e7f"}	t	t	2025-01-24 15:46:14	2025-01-24 15:46:14	0	\N	2025-01-30 17:08:39.727888	airflow	2025-01-30 17:08:39.728246	airflow
679688ee9ddf9a5f9c3e4a06	成為具備外語導覽能力的專業導覽者。	2025S1	6793ae729ddf9a5f9c3d6ce4	熱衷於導覽，喜歡聽別人導覽，也熱愛帶導覽。希望藉由此計畫，使自己成為多語言、多領域的專業導覽者。預計訪談前輩，學習導覽技巧，並透過此計畫，建立一場自己設計的導覽行程，並至少有實際執行一次的經驗。	{"tags": ["個人成長", "興趣熱情"], "description": "我的導覽領域，目前集中於藝文領域，曾參加地方文史導覽甄選卻落選，因此希望藉由學習計畫，提升個人不同領域導覽能力，並運用自己外語專長，培養外語導覽能力。"}	1. 分析自己落選地方文史導覽的原因。\n2. 練習英語口說。\n3. 擇定主題，規劃一場導覽旅程。	1. 找出自己在導覽上，能夠更進步之處。\n2. 建立外語導覽能力。\n3. 培養獨立規劃導覽旅程能力。	{"tags": ["資料蒐集/研究/分析", "書籍閱讀", "發起行動", "找專家學者", "田野調查", "訪談", "觀看影片", "參與社群", "找學伴共學"], "description": "1. 訪談當初甄選時之競爭者，分析自己當初落選原因。\\n2. 訪談導覽前輩，提升導覽技巧。\\n3. 透過AI工具、線上工具，練習英語口說。\\n4. 了解我國英語導遊資格考試，並閱讀有關準備書籍。\\n4. 選定一地進行文史研究，並建立導覽主題。"}	[{"name": "提升導覽能力PART1-分析落選原因", "startDate": "2025-02-09T00:00:00", "endDate": "2025-02-22T00:00:00", "subMilestones": [{"name": "自行回顧甄選歷程", "dates": [{"$date": "2024-01-01T00:00:00"}], "description": "", "_id": "679688ee9ddf9a5f9c3e4a08"}, {"name": "訪談當初甄選時之競爭者", "dates": [{"$date": "2024-01-03T00:00:00"}], "description": "", "_id": "679688ee9ddf9a5f9c3e4a09"}], "_id": "679688ee9ddf9a5f9c3e4a07"}, {"name": "提升導覽能力PART2-文獻閱讀", "startDate": "2025-02-23T00:00:00", "endDate": "2025-03-08T00:00:00", "subMilestones": [{"name": "Alison Grinder & E. Sue Macoy著，閻蕙群譯（2006）《如何培養優秀的導覽員》五觀出版社。", "dates": [{"$date": "2024-01-01T00:00:00"}], "description": "", "_id": "679688ee9ddf9a5f9c3e4a0b"}, {"name": "閻鈺臻（2015.3）〈雖然我不認識你但是我謝謝你—談博物館導覽工作〉，《檔案半年刊》14卷1期。", "dates": [{"$date": "2024-01-05T00:00:00"}], "description": "", "_id": "679688ee9ddf9a5f9c3e4a0c"}], "_id": "679688ee9ddf9a5f9c3e4a0a"}, {"name": "提升導覽能力PART3-針對現狀改善", "startDate": "2025-03-09T00:00:00", "endDate": "2025-03-22T00:00:00", "subMilestones": [{"name": "訪談自己擔任導覽員的單位前輩", "dates": [{"$date": "2024-01-01T00:00:00"}], "description": "", "_id": "679688ee9ddf9a5f9c3e4a0e"}, {"name": "訪談自己擔任導覽員時的聽眾", "dates": [], "description": "", "_id": "679688ee9ddf9a5f9c3e4a0f"}], "_id": "679688ee9ddf9a5f9c3e4a0d"}, {"name": "提升導覽能力PART4-綜合回顧", "startDate": "2025-03-23T00:00:00", "endDate": "2025-04-05T00:00:00", "subMilestones": [{"name": "整理前三階段資料", "dates": [{"$date": "2024-01-01T00:00:00"}], "description": "", "_id": "679688ee9ddf9a5f9c3e4a11"}, {"name": "認識交通部觀光署114年導遊人員及領隊人員評量", "dates": [], "description": "", "_id": "679688ee9ddf9a5f9c3e4a12"}], "_id": "679688ee9ddf9a5f9c3e4a10"}, {"name": "英語口說能力提升PART1-長篇幅口說練習", "startDate": "2025-04-06T00:00:00", "endDate": "2025-04-19T00:00:00", "subMilestones": [{"name": "觀看台灣英語導覽、導遊影片，並自行口述練習", "dates": [{"$date": "2024-01-01T00:00:00"}], "description": "", "_id": "679688ee9ddf9a5f9c3e4a14"}, {"name": "針對生活子題，例如地點、個人故事，每子題進行10-15分鐘之英語介紹", "dates": [], "description": "", "_id": "679688ee9ddf9a5f9c3e4a15"}], "_id": "679688ee9ddf9a5f9c3e4a13"}, {"name": "英語口說能力提升PART2-自家介紹練習", "startDate": "2025-04-20T00:00:00", "endDate": "2025-05-03T00:00:00", "subMilestones": [{"name": "觀看台灣英語導覽、導遊影片，並自行口述練習。", "dates": [{"$date": "2024-01-01T00:00:00"}], "description": "", "_id": "679688ee9ddf9a5f9c3e4a17"}, {"name": "針對自家附近，進行40-60分鐘之英語介紹。", "dates": [], "description": "", "_id": "679688ee9ddf9a5f9c3e4a18"}], "_id": "679688ee9ddf9a5f9c3e4a16"}, {"name": "導覽旅程設計PART1-擇定主題", "startDate": "2025-05-04T00:00:00", "endDate": "2025-05-17T00:00:00", "subMilestones": [{"name": "訪談島內散步公司，了解如何設計導覽旅程。", "dates": [{"$date": "2024-01-01T00:00:00"}], "description": "", "_id": "679688ee9ddf9a5f9c3e4a1a"}, {"name": "主題設定以地方文史為中心，地區限定於北北基。", "dates": [], "description": "", "_id": "679688ee9ddf9a5f9c3e4a1b"}], "_id": "679688ee9ddf9a5f9c3e4a19"}, {"name": "導覽旅程設計PART2-建立導覽敘事", "startDate": "2025-05-18T00:00:00", "endDate": "2025-05-31T00:00:00", "subMilestones": [{"name": "文獻閱讀，建立導覽主題及敘事。", "dates": [{"$date": "2024-01-01T00:00:00"}], "description": "", "_id": "679688ee9ddf9a5f9c3e4a1d"}, {"name": "如有必要，訪談當地耆老及文史工作者。", "dates": [], "description": "", "_id": "679688ee9ddf9a5f9c3e4a1e"}], "_id": "679688ee9ddf9a5f9c3e4a1c"}, {"name": "導覽旅程設計PART3-路線設計", "startDate": "2025-06-01T00:00:00", "endDate": "2025-06-14T00:00:00", "subMilestones": [{"name": "透過Google Map，初步進行路線規劃及設計。", "dates": [{"$date": "2024-01-01T00:00:00"}], "description": "", "_id": "679688ee9ddf9a5f9c3e4a20"}, {"name": "實地踏查、尋找雨備。", "dates": [{"$date": "2024-01-03T00:00:00"}], "description": "", "_id": "679688ee9ddf9a5f9c3e4a21"}, {"name": "如會影響店家營業、民居，事先聯繫。", "dates": [], "description": "", "_id": "679688ee9ddf9a5f9c3e4a22"}], "_id": "679688ee9ddf9a5f9c3e4a1f"}, {"name": "導覽旅程設計PART4-上線前試驗", "startDate": "2025-06-15T00:00:00", "endDate": "2025-06-28T00:00:00", "subMilestones": [{"name": "準備好中英語導覽稿", "dates": [{"$date": "2024-01-01T00:00:00"}], "description": "", "_id": "679688ee9ddf9a5f9c3e4a24"}, {"name": "招募受試者，並取得反饋。", "dates": [{"$date": "2024-01-03T00:00:00"}], "description": "", "_id": "679688ee9ddf9a5f9c3e4a25"}, {"name": "檢討，並更新導覽旅程。", "dates": [{"$date": "2024-01-05T00:00:00"}], "description": "", "_id": "679688ee9ddf9a5f9c3e4a26"}], "_id": "679688ee9ddf9a5f9c3e4a23"}, {"name": "導覽旅程設計PART5-帶領一場自己規劃的導覽旅程", "startDate": "2025-06-29T00:00:00", "endDate": "2025-07-12T00:00:00", "subMilestones": [{"name": "安排導覽工具(手舉牌、音響等)", "dates": [{"$date": "2024-01-05T00:00:00"}], "description": "", "_id": "679688ee9ddf9a5f9c3e4a28"}, {"name": "實際執行導覽", "dates": [{"$date": "2024-01-03T00:00:00"}], "description": "", "_id": "679688ee9ddf9a5f9c3e4a29"}, {"name": "導覽後檢討", "dates": [], "description": "", "_id": "679688ee9ddf9a5f9c3e4a2a"}], "_id": "679688ee9ddf9a5f9c3e4a27"}]	{"tags": ["舉辦活動"], "description": "獨立規劃一場導覽旅程，並包含中英文內容。"}	Complete	Open		{"option": "優惠價：8000 元", "price": 0, "email": [], "_id": "679688ee9ddf9a5f9c3e4a2b"}	f	t	2025-01-26 19:11:42	2025-01-26 19:11:42	0	\N	2025-01-30 17:08:39.727888	airflow	2025-01-30 17:08:39.728246	airflow
679751719ddf9a5f9c3eabb1	創作個人的饒舌歌曲	2025S1	678e2e463b18d82b6896fb7a	1.是學校嘻哈研究社的地下社員，參加了十校聯合嘻研社迎新，看了很多厲害的表演，自己因此也想成為那樣帥氣的人，還有，上高中後，開始喜歡聽饒舌歌，就是一切因緣際會，讓我想要開始創作屬於自己的歌曲。\n2.做出至少三首饒舌歌，並發布在街聲，還有自己的IG跟YouTube ，並積極爭取社團表演的機會。\n3.積極蒐集生活素材，把生活中的靈感寫成歌詞，並且看YouTube 跟 Google 學習編曲的技巧，還有詢問身邊有在創作歌曲的人，最後變成真正的成品。	{"tags": ["興趣熱情", "自我挑戰", "個人成長"], "description": "覺得女rapper 真的很帥，自己也練習了一些饒舌歌，覺得是件蠻有挑戰性的事情，雖然要練習超級多次，才可以練好一首曲子，但一旦練好，會讓自己非常有成就感，而且在練習過程中，不會感到厭煩，會覺得很享受那個過程，後來在經歷過嘻研社迎新後，很多人都說會作詞，一開始我有點錯愕，但後來回家後，就慢慢在生活中蒐集靈感，就發現自己也許也可以真正創作饒舌歌，因此想開啟這個創作計畫。"}	-不同的饒舌曲風編曲\n-作詞如何更精緻\n-如何用曲子寫詞\n-如何用現有的詞創作曲子	-可以自在創作饒舌歌\n-可以用饒舌音樂結交更多朋友\n-可以用創作抒發生活感受	{"tags": ["觀看影片", "資料蒐集/研究/分析"], "description": "我會先觀看那些YouTube影片，一邊跟著實作，最後產出作品，再發表到IG跟YouTube!"}	[{"name": "作詞", "startDate": "2025-02-09T00:00:00", "endDate": "2025-02-22T00:00:00", "subMilestones": [{"name": "將生活素材做成第一首詞", "dates": [], "description": "", "_id": "679751719ddf9a5f9c3eabb3"}], "_id": "679751719ddf9a5f9c3eabb2"}, {"name": "看第一部編曲影片", "startDate": "2025-02-23T00:00:00", "endDate": "2025-03-08T00:00:00", "subMilestones": [], "_id": "679751719ddf9a5f9c3eabb4"}, {"name": "完成第一首曲子", "startDate": "2025-03-09T00:00:00", "endDate": "2025-03-22T00:00:00", "subMilestones": [], "_id": "679751719ddf9a5f9c3eabb5"}, {"name": "蒐集第二首歌的素材，並完成歌詞", "startDate": "2025-03-23T00:00:00", "endDate": "2025-04-05T00:00:00", "subMilestones": [], "_id": "679751719ddf9a5f9c3eabb6"}, {"name": "製作第二首的曲子", "startDate": "2025-04-06T00:00:00", "endDate": "2025-04-19T00:00:00", "subMilestones": [], "_id": "679751719ddf9a5f9c3eabb7"}, {"name": "完善第二首歌，並發佈在個人社交平台", "startDate": "2025-04-20T00:00:00", "endDate": "2025-05-03T00:00:00", "subMilestones": [], "_id": "679751719ddf9a5f9c3eabb8"}, {"name": "蒐集第三首歌的素材，並完成作詞", "startDate": "2025-05-04T00:00:00", "endDate": "2025-05-17T00:00:00", "subMilestones": [], "_id": "679751719ddf9a5f9c3eabb9"}, {"name": "製作第三首歌的編曲", "startDate": "2025-05-18T00:00:00", "endDate": "2025-05-31T00:00:00", "subMilestones": [], "_id": "679751719ddf9a5f9c3eabba"}, {"name": "完成第三首歌，並發佈到個人社交平台", "startDate": "2025-06-01T00:00:00", "endDate": "2025-06-14T00:00:00", "subMilestones": [], "_id": "679751719ddf9a5f9c3eabbb"}, {"name": "彙整心得與反思", "startDate": "2025-06-15T00:00:00", "endDate": "2025-06-28T00:00:00", "subMilestones": [], "_id": "679751719ddf9a5f9c3eabbc"}, {"name": "製作成完整的學習報告", "startDate": "2025-06-29T00:00:00", "endDate": "2025-07-12T00:00:00", "subMilestones": [], "_id": "679751719ddf9a5f9c3eabbd"}]	{"tags": ["經營社群媒體", "藝術創作"], "description": "我會運用現有的IG帳號，發佈作品\\n還會用YouTube 個人頻道發佈個人作品"}	Complete	Open		{"option": "4人團報價：12000元（一人3000元）", "price": 0, "email": ["yufish0117@gmail.com", "eddie8873192@gmail.com", "jiayounikehuzhe@gmail.com"], "_id": "679751719ddf9a5f9c3eabbe"}	t	t	2025-01-27 09:27:13	2025-01-27 09:27:13	0	\N	2025-01-30 17:08:39.727888	airflow	2025-01-30 17:08:39.728246	airflow
679757809ddf9a5f9c3ed866	在計劃期間，透過自己的方式環島做志工。自己的方式ex打工、打工換宿、寫作收入	2025S1	67965de19ddf9a5f9c3e3daf	因為目前應該是我人生少數較多空白的時間，經過了一個月無所事事我覺得很空虛，也因此決定做些什麼來給自己一份上大學前的禮物，並且一個告訴自己已經準備好往下一個階段前進的準備。\n\n目標：預計在7月前用自己的力量環台一圈，並且在過程中要在每個城市至少做一次的志工服務\n\n預計已打工換宿、打工、寫作來增加收入\n\n與各地基金會聯絡了解管道\n	{"tags": ["自我挑戰"], "description": "在十八年的成長路上，我所遇到的幫助太多太多，但是所遇到身邊所傷害我的、向我洩氣的、往後拉的力量也太多，深深體會到「養育一個孩子要一個村莊的力量」的理念，我希望在大學前我可以好好認識、至少親眼看過我生長18年的土地，並且在走訪台灣的同時，將我的能量付出給孩子、老人、動物等需要幫助的人"}	內容、路線規劃\n\n教育、活動企劃發想\n\n預算控制\n\n自我及他人共同成長	我希望學校以後我可以知道1我真實在世界的定位是什麼、自己真正熱愛的是什麼，而能夠跳脫世俗的框架\n2更能珍惜身邊的一切\n3更能夠與人建立連結	{"tags": ["田野調查"], "description": "我預計先了解目前台灣各地的基金會、他們需要哪些幫助、我能透過什麼方式幫助\\n\\n在了解目前我真的能夠打工的實際情況"}	[{"name": "了解各地基金會", "startDate": "2025-02-09T00:00:00", "endDate": "2025-02-22T00:00:00", "subMilestones": [], "_id": "679757809ddf9a5f9c3ed867"}, {"name": "了解打工換宿實際情況", "startDate": "2025-02-23T00:00:00", "endDate": "2025-03-08T00:00:00", "subMilestones": [], "_id": "679757809ddf9a5f9c3ed868"}, {"name": "規劃路線", "startDate": "2025-03-09T00:00:00", "endDate": "2025-03-22T00:00:00", "subMilestones": [], "_id": "679757809ddf9a5f9c3ed869"}, {"name": "購買必須物、看診準備常用藥", "startDate": "2025-03-23T00:00:00", "endDate": "2025-04-05T00:00:00", "subMilestones": [], "_id": "679757809ddf9a5f9c3ed86a"}, {"name": "開始計劃志工期間的事物", "startDate": "2025-04-06T00:00:00", "endDate": "2025-04-19T00:00:00", "subMilestones": [], "_id": "679757809ddf9a5f9c3ed86b"}, {"name": "開始行動（台北出發一路往南）", "startDate": "2025-04-20T00:00:00", "endDate": "2025-05-03T00:00:00", "subMilestones": [], "_id": "679757809ddf9a5f9c3ed86c"}, {"name": "各地基金會", "startDate": "2025-05-04T00:00:00", "endDate": "2025-05-17T00:00:00", "subMilestones": [], "_id": "679757809ddf9a5f9c3ed86d"}, {"name": "各地基金會", "startDate": "2025-05-18T00:00:00", "endDate": "2025-05-31T00:00:00", "subMilestones": [], "_id": "679757809ddf9a5f9c3ed86e"}, {"name": "各地基金會", "startDate": "2025-06-01T00:00:00", "endDate": "2025-06-14T00:00:00", "subMilestones": [], "_id": "679757809ddf9a5f9c3ed86f"}, {"name": "各地學校、機構", "startDate": "2025-06-15T00:00:00", "endDate": "2025-06-28T00:00:00", "subMilestones": [], "_id": "679757809ddf9a5f9c3ed870"}, {"name": "可進入更深層的交流、幫助", "startDate": "2025-06-29T00:00:00", "endDate": "2025-07-12T00:00:00", "subMilestones": [], "_id": "679757809ddf9a5f9c3ed871"}]	{"tags": ["發起專案或組織"], "description": "我預計發起一個專案，透過了解了全台各地的弱勢族群，我更能知道他們真正需要的是什麼，在專案中為他們發聲、並號召更多志工"}	Complete	Open		{"option": "優惠價：8000 元", "price": 0, "email": [], "_id": "679757809ddf9a5f9c3ed872"}	t	t	2025-01-27 09:53:04	2025-01-27 09:53:04	0	\N	2025-01-30 17:08:39.727888	airflow	2025-01-30 17:08:39.728246	airflow
676e5c0818e6b11da605924f	探索普世價值在人類歷史的發展與未來的展望	2025S1	676e534618e6b11da6059198	因為人生目標是希望成為追求真理的知識份子，所以希望從學生階段就開始讀各種人文社科書籍、關注人權發展、參與公共議題、寫自己的思考文章	{"tags": ["興趣熱情", "影響社會", "自我挑戰", "職涯發展", "個人成長", "探索可能性", "應對未來", "受事件啟發"], "description": "以下分享前陣子寫的文章\\n\\n我想，既然都走到這裡了，也該好好整理一下這段歷程了，我從一個懵懂無知的國高中生，到人生的低谷，又到了熱愛追求知識、熱愛自由，渴望成為一個幫助他人的知識份子的自學生。\\n\\n一開始，國小國中的我只會讀教科書，國小遇到家庭紛擾的劇變，國中經歷同儕的霸凌，高中的我因極度不信任家庭選擇住校，高中可能是我人生轉變的開始，同時遇到課業的難題和人生價值與追求的轉折。\\n\\n首先，因為就讀明星高中，考試變得繁多，學校也重視數理，而數理又是我的弱勢科目，我在課業方面出現了失落感和逐漸增加的數理方面的問題，這一層層加上心理因素，變成我對體制的不信任和對填鴨式教育的質疑，加上高中又同時是我找到熱愛領域的時機，在校因為英文老師推廣的國際特赦組織的寫信馬拉松活動，還有在校開始閱讀書籍的緣故，這段期間我發現了對社科人文知識的熱情和對人權的啟蒙，以及前面對體制的拒斥，於是我選擇了自學，隨著閱讀書目的增加我越發察覺社會不平等和種種議題與問題，於是很當然地，我接觸了社會主義與馬克思主義，可是對歷史的研究，蘇聯和中共和其他宣傳社會主義國家(包括納粹)的殘暴，使得同時我對這派學說保持質疑(後面會再詳細討論這個議題)。\\n\\n開始自學時一段時間，我開始接觸了一連串社會議題，從法律/政治/人權/環境擴展到更細緻的 : 台灣迫遷議題/世界極權政治與地緣政治問題/歷史等等，但自學也遇到嚴重的家庭關係問題，引發了我的重鬱症，但隨著社工們的協助和家人們與我的轉變和各方朋友的支持與協助，重鬱症也逐漸好轉，當然一部份家庭問題和個人議題仍然存在，但相較於以往是好很多了，也在此感謝友人的關心。\\n\\n先回到前面的問題，我在開始深入歷史和自由主義思潮的接觸後逐漸察覺共產主義與民主人權的矛盾和經濟自由與政治自由的相關性，這啟發了我很多。也隨著閱讀書目的增加，我的興趣擴展到世界史與東亞史/比較歷史、自由主義與民主、極權主義、教育、環境、人權、精神疾病、個體心理學、藝術繪畫、社會學，從對知識的渴望到想成為一位知識分子，在這期間我遇到了眾多資源和人的協助，以下再詳細列舉，在這段期間，我還接觸了基督教信仰，這給了我逐漸增添的信心和醫治，也加深我對人權的信念。\\n\\n透過一次次閱讀和寫文章的過程，我才漸漸明白現在所讀到的習慣科學(原子習慣和刻意練習)所告訴我的，用心且適當增加壓力和困難的練習的重要性，透過在這個土生土長的台灣遇到各種人事物給我的力量，我也明白受苦的倒影所言機遇的重要性，透過這一連串的體悟，我也逐漸了解經濟學家海耶克所言自由體制的重要和這個經濟自由和政治自由的台灣社會(但還是有很多待進步之處)對我的重要性，如果沒有這些不會有現在的我。在這個漸趨複雜的社會，民主倒退的世界，極權的擴張，氣候的變遷，知識的追求更加顯得重要，所以我得更加努力認真，現代文明社會是各個前輩們的努力，在此我向他們獻上感謝，我也對養育我的社會和種種機遇致上謝意，我得更加努力，我才可以回報這個社會，如同鄭南榕前輩說的，接下來是我們的事了 !\\n\\n在此我列舉眾多資源和人的協助\\n謝謝象仔書屋與東亞歷史協會的讀書會和各式各樣的書和討論\\n謝謝南方書店的朋友\\n謝謝孩堤咖啡的朋友\\n謝謝鹿鹿鬆餅屋的朋友和提供的協助\\n謝謝遠在新店老屋的朋友\\n謝謝鹿港浸信會和向陽教會\\n謝謝各路朋友的支持\\n謝謝我還沒提到的朋友\\n\\n再說一次，如果不是有你們和這個台灣社會，不會有現在的進步。"}	-人權的發展\n-世界史、東亞史、台灣史\n-歷史上出現過的文明倒退現象（如共產政權的迫害和極權的產生）\n-中共體制的分析\n-民主在台灣的起源與未來的展望	了解普世價值在世界歷史的發展和如何成為人類社會的基礎/對政治歷史有更深入的認識	{"tags": ["書籍閱讀", "資料蒐集/研究/分析", "發起行動", "參與活動或課程"], "description": "我會藉著閱讀書籍、聽演講、寫文章、不斷思考以及分享我的收獲來加強學習"}	[{"name": "讀台灣民主運動史(日治到戰後)，創設部落格", "startDate": "2025-02-09T00:00:00", "endDate": "2025-02-22T00:00:00", "subMilestones": [], "_id": "676e5c0818e6b11da6059250"}, {"name": "讀台灣史/東亞史/分析中共的書，聽演講", "startDate": "2025-02-23T00:00:00", "endDate": "2025-03-08T00:00:00", "subMilestones": [], "_id": "676e5c0818e6b11da6059251"}, {"name": "撰寫一篇文章", "startDate": "2025-03-09T00:00:00", "endDate": "2025-03-22T00:00:00", "subMilestones": [], "_id": "676e5c0818e6b11da6059252"}, {"name": "讀開放社會與其敵人還有其他論述政治經濟專制對人類社會危害的書", "startDate": "2025-03-23T00:00:00", "endDate": "2025-04-05T00:00:00", "subMilestones": [], "_id": "676e5c0818e6b11da6059253"}, {"name": "讀世界史", "startDate": "2025-04-06T00:00:00", "endDate": "2025-04-19T00:00:00", "subMilestones": [], "_id": "676e5c0818e6b11da6059254"}, {"name": "撰寫一篇文章", "startDate": "2025-04-20T00:00:00", "endDate": "2025-05-03T00:00:00", "subMilestones": [], "_id": "676e5c0818e6b11da6059255"}, {"name": "讀中共對台灣的影響(如談論中資滲透的書/台海軍演等等)", "startDate": "2025-05-04T00:00:00", "endDate": "2025-05-17T00:00:00", "subMilestones": [], "_id": "676e5c0818e6b11da6059256"}, {"name": "讀談論中共在中國施行迫害的書，聽演講", "startDate": "2025-05-18T00:00:00", "endDate": "2025-05-31T00:00:00", "subMilestones": [], "_id": "676e5c0818e6b11da6059257"}, {"name": "撰寫一篇文章", "startDate": "2025-06-01T00:00:00", "endDate": "2025-06-14T00:00:00", "subMilestones": [], "_id": "676e5c0818e6b11da6059258"}, {"name": "讀中國歷史上的人權捍衛者寫的著作", "startDate": "2025-06-15T00:00:00", "endDate": "2025-06-28T00:00:00", "subMilestones": [], "_id": "676e5c0818e6b11da6059259"}, {"name": "撰寫兩篇文章", "startDate": "2025-06-29T00:00:00", "endDate": "2025-07-12T00:00:00", "subMilestones": [], "_id": "676e5c0818e6b11da605925a"}]	{"tags": ["架設網站", "經營社群媒體", "撰寫研究報告", "藝術創作"], "description": "除了撰寫文章傳遞到社群外，同時也有在畫畫"}	Complete	Open		{"option": "4人團報價：12000元（一人3000元）", "price": 0, "email": ["christy98191@gmail.com", "taiwansmile@gmail.com", "zhouyuting08620@gmail.com"], "_id": "676e5c0818e6b11da605925b"}	t	t	2024-12-27 07:49:28	2025-01-23 14:33:29	0	\N	2025-01-31 00:00:03.303988	airflow	2025-01-31 00:00:03.304499	airflow
677111ab4b6a24b8351d5b3f	提升英文能力	2025S1	677111784b6a24b8351d5b36	想做此計畫的目標\n\n    我對於量子電腦與腦科學比較新興的領域感興趣， 但由於這些科系都是在國外發展比較蓬勃，因此會需要有一定的英文能力才能夠進行探索。 因此現階段我想要以提升英文能力為首要目標，可跟國外的學者進行交流。\n\n\n我希望累積英文能力，可以找到自己有興趣的科系，以及提升英文能力，也累積我的學習技巧。所以我預計會學習的內容包含：英文撰寫。最終我會把些學習過程整理成一個報告書，作為成果發表，來作為我五個月的學習成果發表。	{"tags": ["好奇心驅動", "其他：請於下方撰寫", "探索可能性", "升學或資格獲取"], "description": "技能\\n我所感興趣的腦科學、量子電腦等領域， 相關領域的最新知識多以英文撰寫而成，想吸收新知會需要一定程度英文能力。另一方面，我曾經參與不同的學術研討會，在與外語人士交流時更感受到英文能力的重要性。 我認為英文能夠讓我達到這樣的目標，所以我想增進自己的英文能力。\\n\\n另外，更我希望透過這次自學的機會，找回學習的自信心。\\n\\n家庭環境沒有足夠的學習資源、以及會有讓我需要分神處理的隨機家暴事件發生，讓我在學習時感到很不安。這讓我難以跟上學校的學習進度。\\n\\n過去，我總是順從他人為我安排的學習計畫，未曾有機會調整自己的步伐來學習。考試和學校的體制常讓我感到極度不適，甚至失去自我。繁忙的課業與頻繁的小考壓得我喘不過氣，因為我根本沒有足夠的時間來讀書、準備或接受輔導。\\n\\n校園在某些方面對我來說是片刻的喘息之地，但卻讓我倍感壓力。過去的學習經驗充滿壓力與妥協，幾乎沒有任何空間讓我自我探索，這也讓我逐漸失去了對學習的熱忱。而這次的計劃，我能夠重新為自己安排進度，達成期待的目標，是我試圖重新掌握學習主控權的重要一步。\\n\\n我明白，我們無法改變過去，但現在能做的一切，才是通往未來的軌跡。小時候，我曾經夢想環遊世界，如今雖然還不清楚如何實現，但我正嘗試探索更多的可能性。\\n\\n我希望透過探索，找回那份小時候對世界充滿好奇、熱愛自由學習的初心，將過去的困難化為動力，藉由持續的努力找到真正適合自己的道路，並學會接納過去，擁抱未來，活得坦率而自由。"}	 1. 英文能力：\n   - 以英語進行日常對話\n   - 撰寫正式書信（申請信、交流信）。  \n   - 提升詞彙與語法能力（使用 AI 工具與教師輔助）。  \n\n\n2. 學習技巧：\n   - 學術寫作與文獻筆記。  \n   - 不同領域的學習策略與思維方法。  \n   - 資料整理與研究方法。 	一：提升英文能力，在國際交流活動中順暢的與國際人士交流。\n二：在過程中可以真誠的面對自己的內心，並重拾學習熱情。	{"tags": ["其他：請於下方撰寫", "參與活動或課程", "場域實習", "找專家學者", "資料蒐集/研究/分析"], "description": "  提升聽：我會先觀看影片或者聽podcast，藉由跟讀的方式，提升聽說的能力。\\n\\n找學伴共學安排時間一同進入英語的學習環境，參與社群沈浸在英文的環境中 、找專家學者指點我學習的迷津。玩遊戲、ai互動。\\n\\n  提升說：參與社群進行口說練習、找學伴共學一同進入英語的學習環境、唸故事書給小朋友聽、錄製故事音檔、唱英文歌、玩遊戲、ai互動。\\n\\n  提升讀：書籍閱讀、觀看影片 、玩遊戲、ai互動。\\n\\n  提升文本表達：撰寫日記、閱讀我感興趣的資料撰寫文章與社群的分享、我觀看後的心得、ai互動。"}	[{"name": "環境建立與學習規劃", "startDate": "2025-02-09T00:00:00", "endDate": "2025-02-15T00:00:00", "subMilestones": [{"name": "英文學習系統建立", "dates": [{"$date": "2024-01-01T00:00:00"}], "description": "", "_id": "678e514a3b18d82b6896ffa7"}, {"name": " Obsidian筆記系統建置   - 設定每日英文日記模板   - 建立單字卡片系統   - 設計閱讀筆記架構   - 建立AI工具使用記錄模板", "dates": [], "description": "", "_id": "678e514a3b18d82b6896ffa8"}, {"name": "英文課本第一冊（前4課）   - 每課閱讀與寫字（20頁/課）：每天5頁   - 每課聆聽與口說（1頁/課）：每天練習15分鐘   - 製作單字卡片：每課30個重點單字   - 完成每課習作和測驗", "dates": [], "description": "", "_id": "678e514a3b18d82b6896ffa9"}, {"name": "Barry Loser第一本（I am not a loser）   - 第1-50頁：閱讀與筆記   - 製作生字表：每10頁整理一次   - 錄製朗讀音檔：每章一段", "dates": [], "description": "", "_id": "678e514a3b18d82b6896ffaa"}], "_id": "6787d3056662cd04f96874c5"}, {"name": "環境建立與學習規劃", "startDate": "2025-02-16T00:00:00", "endDate": "2025-02-22T00:00:00", "subMilestones": [{"name": "在兩個禮拜一次的探索有想保留繼續下一週的探索是沒問題的，甚至是兩週。", "dates": [], "description": "", "_id": "6788d4146662cd04f9687d87"}], "_id": "6787d3056662cd04f96874c6"}, {"name": "基礎能力培養", "startDate": "2025-02-23T00:00:00", "endDate": "2025-03-01T00:00:00", "subMilestones": [{"name": "英文學習深化", "dates": [], "description": "", "_id": "678e514a3b18d82b6896ffb1"}, {"name": "英文課本第一冊（5-8課）   - 每天完成一課閱讀（20頁）   - 錄製口說練習（每課2次）   - 與學伴（阿菊）練習對話   - 完成每課習作", "dates": [], "description": "", "_id": "678e514a3b18d82b6896ffb2"}, {"name": "Barry Loser第一本（續）   - 第51-100頁閱讀與筆記   - 使用CloudAI練習對話   - 寫下每章重點摘要   - 錄製朗讀音檔", "dates": [], "description": "", "_id": "678e514a3b18d82b6896ffb3"}], "_id": "6787d3056662cd04f96874c7"}, {"name": "基礎能力培養", "startDate": "2025-03-02T00:00:00", "endDate": "2025-03-08T00:00:00", "subMilestones": [], "_id": "6787d3056662cd04f96874c8"}, {"name": "學習方法優化", "startDate": "2025-03-09T00:00:00", "endDate": "2025-03-15T00:00:00", "subMilestones": [{"name": "英文能力提升", "dates": [], "description": "", "_id": "678e514a3b18d82b6896ffb9"}, {"name": "英文課本第一冊（9-12課）   - 完成剩餘課程   - 進行總複習   - 製作重點整理   - 錄製口說練習", "dates": [], "description": "", "_id": "678e514a3b18d82b6896ffba"}, {"name": "Barry Loser第一本（完結）與第二本開始   - 完成第一本（101-200頁）   - 開始第二本（1-50頁）   - 寫下完整讀書心得   - 準備與學伴分享", "dates": [], "description": "", "_id": "678e514a3b18d82b6896ffbb"}], "_id": "6787d3056662cd04f96874c9"}, {"name": "學習方法優化", "startDate": "2025-03-16T00:00:00", "endDate": "2025-03-22T00:00:00", "subMilestones": [], "_id": "6787d3056662cd04f96874ca"}, {"name": "學習方法優化", "startDate": "2025-03-23T00:00:00", "endDate": "2025-03-29T00:00:00", "subMilestones": [{"name": " 英文學習    日常練習（每天）   - 寫英文日記（200字）   - 背誦單字（30個）   - 聽力練習（30分鐘）   - 口說練習（20分鐘）    週末整理（每週）   - 複習本週單字   - 整理學習筆記   - 記錄遇到的困難   - 規劃下週重點  科系探索   資料收集（每天）   - 閱讀相關文章   - 觀看影片資料   - 記錄重要資訊   - 提出疑問清單    週末整理（每週）   - 整理本週發現   - 更新探索方向   - 調整學習計畫   - 設定下週目標", "dates": [], "description": "", "_id": "678e514a3b18d82b6896ffc0"}], "_id": "6787d3056662cd04f96874cb"}, {"name": "學習方法優化", "startDate": "2025-03-30T00:00:00", "endDate": "2025-04-05T00:00:00", "subMilestones": [{"name": "1. 學習進度檢視    - 英文學習目標達成率    - 科系探索進展    - 遭遇困難分析    - 解決方案提出  2. 學習方法調整    - 效果評估    - 方法優化    - 資源使用檢討    - 時間分配調整", "dates": [], "description": "", "_id": "678e514a3b18d82b6896ffc2"}, {"name": " 英文學習    日常練習（每天）   - 寫英文日記（200字）   - 背誦單字（30個）   - 聽力練習（30分鐘）   - 口說練習（20分鐘）    週末整理（每週）   - 複習本週單字   - 整理學習筆記   - 記錄遇到的困難   - 規劃下週重點  科系探索   資料收集（每天）   - 閱讀相關文章   - 觀看影片資料   - 記錄重要資訊   - 提出疑問清單    週末整理（每週）   - 整理本週發現   - 更新探索方向   - 調整學習計畫   - 設定下週目標", "dates": [], "description": "", "_id": "678e514a3b18d82b6896ffc3"}], "_id": "6787d3056662cd04f96874cc"}, {"name": "學習方法優化", "startDate": "2025-04-06T00:00:00", "endDate": "2025-04-12T00:00:00", "subMilestones": [{"name": " 英文學習    日常練習（每天）   - 寫英文日記（200字）   - 背誦單字（30個）   - 聽力練習（30分鐘）   - 口說練習（20分鐘）    週末整理（每週）   - 複習本週單字   - 整理學習筆記   - 記錄遇到的困難   - 規劃下週重點  科系探索   資料收集（每天）   - 閱讀相關文章   - 觀看影片資料   - 記錄重要資訊   - 提出疑問清單    週末整理（每週）   - 整理本週發現   - 更新探索方向   - 調整學習計畫   - 設定下週目標", "dates": [], "description": "", "_id": "678e514a3b18d82b6896ffc5"}], "_id": "6787d3056662cd04f96874cd"}, {"name": "學習方法優化", "startDate": "2025-04-13T00:00:00", "endDate": "2025-04-19T00:00:00", "subMilestones": [{"name": "1. 學習進度檢視 - 英文學習目標達成率 - 科系探索進展 - 遭遇困難分析 - 解決方案提出 2. 學習方法調整 - 效果評估 - 方法優化 - 資源使用檢討 - 時間分配調整", "dates": [], "description": "", "_id": "678e514a3b18d82b6896ffc7"}, {"name": " 英文學習    日常練習（每天）   - 寫英文日記（200字）   - 背誦單字（30個）   - 聽力練習（30分鐘）   - 口說練習（20分鐘）    週末整理（每週）   - 複習本週單字   - 整理學習筆記   - 記錄遇到的困難   - 規劃下週重點  科系探索   資料收集（每天）   - 閱讀相關文章   - 觀看影片資料   - 記錄重要資訊   - 提出疑問清單    週末整理（每週）   - 整理本週發現   - 更新探索方向   - 調整學習計畫   - 設定下週目標", "dates": [], "description": "", "_id": "678e514a3b18d82b6896ffc8"}], "_id": "6787d3056662cd04f96874ce"}, {"name": "學習方法優化", "startDate": "2025-04-20T00:00:00", "endDate": "2025-04-26T00:00:00", "subMilestones": [{"name": " 英文學習    日常練習（每天）   - 寫英文日記（200字）   - 背誦單字（30個）   - 聽力練習（30分鐘）   - 口說練習（20分鐘）    週末整理（每週）   - 複習本週單字   - 整理學習筆記   - 記錄遇到的困難   - 規劃下週重點  科系探索   資料收集（每天）   - 閱讀相關文章   - 觀看影片資料   - 記錄重要資訊   - 提出疑問清單    週末整理（每週）   - 整理本週發現   - 更新探索方向   - 調整學習計畫   - 設定下週目標", "dates": [], "description": "", "_id": "678e514a3b18d82b6896ffca"}], "_id": "6787d3056662cd04f96874cf"}, {"name": "學習方法優化", "startDate": "2025-04-27T00:00:00", "endDate": "2025-05-03T00:00:00", "subMilestones": [{"name": "1. 學習進度檢視 - 英文學習目標達成率 - 科系探索進展 - 遭遇困難分析 - 解決方案提出 2. 學習方法調整 - 效果評估 - 方法優化 - 資源使用檢討 - 時間分配調整", "dates": [], "description": "", "_id": "678e514a3b18d82b6896ffcc"}, {"name": " 英文學習    日常練習（每天）   - 寫英文日記（200字）   - 背誦單字（30個）   - 聽力練習（30分鐘）   - 口說練習（20分鐘）    週末整理（每週）   - 複習本週單字   - 整理學習筆記   - 記錄遇到的困難   - 規劃下週重點  科系探索   資料收集（每天）   - 閱讀相關文章   - 觀看影片資料   - 記錄重要資訊   - 提出疑問清單    週末整理（每週）   - 整理本週發現   - 更新探索方向   - 調整學習計畫   - 設定下週目標", "dates": [], "description": "", "_id": "678e514a3b18d82b6896ffcd"}], "_id": "6787d3056662cd04f96874d0"}, {"name": "學習方法優化", "startDate": "2025-05-04T00:00:00", "endDate": "2025-05-10T00:00:00", "subMilestones": [{"name": " 英文學習    日常練習（每天）   - 寫英文日記（200字）   - 背誦單字（30個）   - 聽力練習（30分鐘）   - 口說練習（20分鐘）    週末整理（每週）   - 複習本週單字   - 整理學習筆記   - 記錄遇到的困難   - 規劃下週重點  科系探索   資料收集（每天）   - 閱讀相關文章   - 觀看影片資料   - 記錄重要資訊   - 提出疑問清單    週末整理（每週）   - 整理本週發現   - 更新探索方向   - 調整學習計畫   - 設定下週目標", "dates": [], "description": "", "_id": "678e514a3b18d82b6896ffcf"}], "_id": "6787d3056662cd04f96874d1"}, {"name": "學習方法優化", "startDate": "2025-05-11T00:00:00", "endDate": "2025-05-17T00:00:00", "subMilestones": [{"name": "1. 學習進度檢視 - 英文學習目標達成率 - 科系探索進展 - 遭遇困難分析 - 解決方案提出 2. 學習方法調整 - 效果評估 - 方法優化 - 資源使用檢討 - 時間分配調整", "dates": [], "description": "", "_id": "678e514a3b18d82b6896ffd1"}, {"name": " 英文學習    日常練習（每天）   - 寫英文日記（200字）   - 背誦單字（30個）   - 聽力練習（30分鐘）   - 口說練習（20分鐘）    週末整理（每週）   - 複習本週單字   - 整理學習筆記   - 記錄遇到的困難   - 規劃下週重點  科系探索   資料收集（每天）   - 閱讀相關文章   - 觀看影片資料   - 記錄重要資訊   - 提出疑問清單    週末整理（每週）   - 整理本週發現   - 更新探索方向   - 調整學習計畫   - 設定下週目標", "dates": [], "description": "", "_id": "678e514a3b18d82b6896ffd2"}], "_id": "6787d3056662cd04f96874d2"}, {"name": "學習方法優化", "startDate": "2025-05-18T00:00:00", "endDate": "2025-05-24T00:00:00", "subMilestones": [{"name": " 英文學習    日常練習（每天）   - 寫英文日記（200字）   - 背誦單字（30個）   - 聽力練習（30分鐘）   - 口說練習（20分鐘）    週末整理（每週）   - 複習本週單字   - 整理學習筆記   - 記錄遇到的困難   - 規劃下週重點  科系探索   資料收集（每天）   - 閱讀相關文章   - 觀看影片資料   - 記錄重要資訊   - 提出疑問清單    週末整理（每週）   - 整理本週發現   - 更新探索方向   - 調整學習計畫   - 設定下週目標", "dates": [], "description": "", "_id": "678e514a3b18d82b6896ffd4"}], "_id": "6787d3056662cd04f96874d3"}, {"name": "16", "startDate": "2025-05-25T00:00:00", "endDate": "2025-05-31T00:00:00", "subMilestones": [{"name": "1. 學習進度檢視 - 英文學習目標達成率 - 科系探索進展 - 遭遇困難分析 - 解決方案提出 2. 學習方法調整 - 效果評估 - 方法優化 - 資源使用檢討 - 時間分配調整", "dates": [], "description": "", "_id": "678e514a3b18d82b6896ffd6"}, {"name": " 英文學習    日常練習（每天）   - 寫英文日記（200字）   - 背誦單字（30個）   - 聽力練習（30分鐘）   - 口說練習（20分鐘）    週末整理（每週）   - 複習本週單字   - 整理學習筆記   - 記錄遇到的困難   - 規劃下週重點  科系探索   資料收集（每天）   - 閱讀相關文章   - 觀看影片資料   - 記錄重要資訊   - 提出疑問清單    週末整理（每週）   - 整理本週發現   - 更新探索方向   - 調整學習計畫   - 設定下週目標", "dates": [], "description": "", "_id": "678e514a3b18d82b6896ffd7"}], "_id": "6787d3056662cd04f96874d4"}, {"name": "學習方法優化", "startDate": "2025-06-01T00:00:00", "endDate": "2025-06-07T00:00:00", "subMilestones": [{"name": " 英文學習    日常練習（每天）   - 寫英文日記（200字）   - 背誦單字（30個）   - 聽力練習（30分鐘）   - 口說練習（20分鐘）    週末整理（每週）   - 複習本週單字   - 整理學習筆記   - 記錄遇到的困難   - 規劃下週重點  科系探索   資料收集（每天）   - 閱讀相關文章   - 觀看影片資料   - 記錄重要資訊   - 提出疑問清單    週末整理（每週）   - 整理本週發現   - 更新探索方向   - 調整學習計畫   - 設定下週目標", "dates": [], "description": "", "_id": "678e514a3b18d82b6896ffd9"}], "_id": "6787d3056662cd04f96874d5"}, {"name": "18", "startDate": "2025-06-08T00:00:00", "endDate": "2025-06-14T00:00:00", "subMilestones": [{"name": "1. 學習進度檢視 - 英文學習目標達成率 - 科系探索進展 - 遭遇困難分析 - 解決方案提出 2. 學習方法調整 - 效果評估 - 方法優化 - 資源使用檢討 - 時間分配調整", "dates": [], "description": "", "_id": "678e514a3b18d82b6896ffdb"}, {"name": " 英文學習    日常練習（每天）   - 寫英文日記（200字）   - 背誦單字（30個）   - 聽力練習（30分鐘）   - 口說練習（20分鐘）    週末整理（每週）   - 複習本週單字   - 整理學習筆記   - 記錄遇到的困難   - 規劃下週重點  科系探索   資料收集（每天）   - 閱讀相關文章   - 觀看影片資料   - 記錄重要資訊   - 提出疑問清單    週末整理（每週）   - 整理本週發現   - 更新探索方向   - 調整學習計畫   - 設定下週目標", "dates": [], "description": "", "_id": "678e514a3b18d82b6896ffdc"}], "_id": "6787d3056662cd04f96874d6"}, {"name": "學習方法優化", "startDate": "2025-06-15T00:00:00", "endDate": "2025-06-21T00:00:00", "subMilestones": [{"name": " 英文學習    日常練習（每天）   - 寫英文日記（200字）   - 背誦單字（30個）   - 聽力練習（30分鐘）   - 口說練習（20分鐘）    週末整理（每週）   - 複習本週單字   - 整理學習筆記   - 記錄遇到的困難   - 規劃下週重點  科系探索   資料收集（每天）   - 閱讀相關文章   - 觀看影片資料   - 記錄重要資訊   - 提出疑問清單    週末整理（每週）   - 整理本週發現   - 更新探索方向   - 調整學習計畫   - 設定下週目標", "dates": [], "description": "", "_id": "678e514a3b18d82b6896ffde"}], "_id": "6787d3056662cd04f96874d7"}, {"name": "20", "startDate": "2025-06-22T00:00:00", "endDate": "2025-06-28T00:00:00", "subMilestones": [{"name": "1. 學習進度檢視 - 英文學習目標達成率 - 科系探索進展 - 遭遇困難分析 - 解決方案提出 2. 學習方法調整 - 效果評估 - 方法優化 - 資源使用檢討 - 時間分配調整", "dates": [], "description": "", "_id": "678e514a3b18d82b6896ffe0"}, {"name": " 英文學習    日常練習（每天）   - 寫英文日記（200字）   - 背誦單字（30個）   - 聽力練習（30分鐘）   - 口說練習（20分鐘）    週末整理（每週）   - 複習本週單字   - 整理學習筆記   - 記錄遇到的困難   - 規劃下週重點  科系探索   資料收集（每天）   - 閱讀相關文章   - 觀看影片資料   - 記錄重要資訊   - 提出疑問清單    週末整理（每週）   - 整理本週發現   - 更新探索方向   - 調整學習計畫   - 設定下週目標", "dates": [], "description": "", "_id": "678e514a3b18d82b6896ffe1"}], "_id": "6787d3056662cd04f96874d8"}, {"name": "學習方法優化", "startDate": "2025-06-29T00:00:00", "endDate": "2025-07-05T00:00:00", "subMilestones": [{"name": " 英文學習    日常練習（每天）   - 寫英文日記（200字）   - 背誦單字（30個）   - 聽力練習（30分鐘）   - 口說練習（20分鐘）    週末整理（每週）   - 複習本週單字   - 整理學習筆記   - 記錄遇到的困難   - 規劃下週重點  科系探索   資料收集（每天）   - 閱讀相關文章   - 觀看影片資料   - 記錄重要資訊   - 提出疑問清單    週末整理（每週）   - 整理本週發現   - 更新探索方向   - 調整學習計畫   - 設定下週目標", "dates": [], "description": "", "_id": "678e514a3b18d82b6896ffe3"}], "_id": "6787d3056662cd04f96874d9"}, {"name": "22", "startDate": "2025-07-06T00:00:00", "endDate": "2025-07-12T00:00:00", "subMilestones": [{"name": "1. 學習進度檢視 - 英文學習目標達成率 - 科系探索進展 - 遭遇困難分析 - 解決方案提出 2. 學習方法調整 - 效果評估 - 方法優化 - 資源使用檢討 - 時間分配調整", "dates": [], "description": "", "_id": "678e514a3b18d82b6896ffe5"}, {"name": " 英文學習    日常練習（每天）   - 寫英文日記（200字）   - 背誦單字（30個）   - 聽力練習（30分鐘）   - 口說練習（20分鐘）    週末整理（每週）   - 複習本週單字   - 整理學習筆記   - 記錄遇到的困難   - 規劃下週重點  科系探索   資料收集（每天）   - 閱讀相關文章   - 觀看影片資料   - 記錄重要資訊   - 提出疑問清單    週末整理（每週）   - 整理本週發現   - 更新探索方向   - 調整學習計畫   - 設定下週目標", "dates": [], "description": "", "_id": "678e514a3b18d82b6896ffe6"}], "_id": "6787d3056662cd04f96874da"}]	{"tags": ["其他：請在下方補上其他原因，並詳細說明動機", "藝術創作"], "description": "報告書：\\n英文學習報告書：\\n以完整的文字形式呈現，展現我在22週當中的英文學習計劃中每日所練習的文字表達力，包括學習歷程、挑戰、解決方法以及反思。\\n科系領域的調查報告書：\\n作為在探索查科系時，用搜索時得知的資料做歸納，將調查到的新發現，還有感覺，作為報告的目標。\\n影片：嘗試以英語作為科系探索訪談時使用的語言。用英語來教學水車玩具的製作、介紹我自己在參與這次22週的學習計劃後，當中的歷程、感受與成長，讓觀眾視覺化地感受到努力與收穫。"}	Complete	Open		{"option": "4人團報價：12000元（一人3000元）", "price": 0, "email": ["yufish0117@gmail.com", "jiayounikehuzhe@gmail.com", "choumei.bonnie@gmail.com"], "_id": "677111ab4b6a24b8351d5b4b"}	t	t	2024-12-29 09:08:59	2025-01-25 22:22:04	0	\N	2025-01-31 00:00:03.303988	airflow	2025-01-31 00:00:03.304499	airflow
6773f2ce4b6a24b8351d7336	「偶」的學習之旅	2025S1	6771676f4b6a24b8351d62b4	先前接觸過融合戲偶元素的劇場作品因而感到興趣，希望藉此計畫學習戲偶製作與操作、練習紀錄學習歷程並分享到網路社群。預期最終會以社群貼文形式，產出三部操作自製戲偶的影片，並且附上製作歷程敘述與創作理念。	{"tags": ["受事件啟發", "興趣熱情", "自我挑戰", "個人成長", "生活發生變化"], "description": "去年在衛武營觀賞了曉劇場的《魚·貓》，演出中表演者使用了人偶、腳踏車骨架與輪胎，呈現出或平緩或顛簸的騎行景況，那樣的畫面另我極為驚奇，原來物件與偶的結合，可以創造與自己平時習慣的，以表演者為主體的劇場表演更加魔幻自由的氛圍。之後偶然在台南當地劇團斜槓青年創作體的四戲連演的其中一作裡，也欣賞了結合戲偶的演出，由於演出本身是形式、運用素材都以相對單純的solo呈現，所以也讓我產生「或許我也可以嘗試看看操偶跟製偶」的想法。\\n另外，我跟朋友今年打算再次參與花樣戲劇節（一個陪伴高中生創作並呈現戲劇作品的活動）的徵件，在前陣子討論創作方向的會議中，恰好其他團員同樣有將偶戲元素加入作品的念頭。在自身興趣與週遭聲音方向一致的情況下，關於偶的探究學習活動似乎愈加有執行的必要。不過關於偶戲領域的學習，台灣沒有太多具系統的學習路徑，所以透過自主學習的方式，開闢出一個可執行的學習脈絡，我認為是現階段最為可行的辦法。因此希望可以透過學習馬拉松實踐這個構想，在計畫執行過程中，也希望藉由社群的分享，為其他對偶戲感興趣的人，提供一條可依循的探索路徑！"}	操偶（發展各種動作的可能性、揣摩戲偶的各種情緒）/ 製偶（理解基礎執頭偶/杖頭偶/手套偶/懸絲偶的結構與製作、創作自己設計的戲偶）/ 有條理的學習紀錄方法	學習操偶製偶的技巧/ 運用瑣碎時間執行計畫/ 練習有脈絡地分享自己的學習歷程	{"tags": ["觀看影片", "參與社群", "參與活動或課程", "其他：請於下方撰寫"], "description": "預計以網路資源（如影片、文章）補足戲偶相關知識後，實際練習操作操製偶，並將歷程與成果透過紀錄及網路社群分享，作為審視與敦促學習的方式。在計劃前中期，會參與偶劇團的工作坊及演出，藉此與偶戲工作者交流學習，也可請教它們對於偶戲學習的建議。"}	[{"name": "執頭偶初探", "startDate": "2025-02-09T00:00:00", "endDate": "2025-02-15T00:00:00", "subMilestones": [{"name": "參考影片或圖片，製作出一隻後方置有棍棒或操縱環的偶", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb18"}, {"name": "練習揣摩無獨有偶劇團〈戲偶動作練習表〉上的動作。每次練習花一個小時的時間，選擇五個動作。共練習三次。", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb19"}, {"name": "檢討練習時錄製的影像，思考：戲偶有沒有確實表現出動作或情緒？為什麼？", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb1a"}, {"name": "週末反思當週目標有無確實執行？下週安排需不需作調整？", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb1b"}, {"name": "於社群發布執頭偶的學習歷程貼文", "dates": [], "description": "", "_id": "67938ca99ddf9a5f9c3d2f28"}], "_id": "679333f79ddf9a5f9c3ceb17"}, {"name": "杖頭偶初探", "startDate": "2025-02-16T00:00:00", "endDate": "2025-02-22T00:00:00", "subMilestones": [{"name": "製作出一隻以棍棒穿過頭與身體的偶", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb1d"}, {"name": "其餘練習與反思，同第一週2、3、4點", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb1e"}, {"name": " 於社群發布杖頭偶的學習歷程貼文", "dates": [], "description": "", "_id": "67938ca99ddf9a5f9c3d2f2c"}], "_id": "679333f79ddf9a5f9c3ceb1c"}, {"name": "手套偶初探", "startDate": "2025-02-23T00:00:00", "endDate": "2025-03-01T00:00:00", "subMilestones": [{"name": "製作一支可套入手的偶", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb20"}, {"name": " 其餘練習與反思，同第一週2、3、4點", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb21"}, {"name": "於社群發布手套偶的學習歷程貼文", "dates": [], "description": "", "_id": "67938ca99ddf9a5f9c3d2f30"}], "_id": "679333f79ddf9a5f9c3ceb1f"}, {"name": "遊行大偶工作坊 第一週", "startDate": "2025-03-02T00:00:00", "endDate": "2025-03-08T00:00:00", "subMilestones": [{"name": "參與遊行大偶課程（3/8）", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb23"}, {"name": "在週間複習三次戲偶的動作練習（每次30分鐘，需要錄影檢討）", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb24"}, {"name": "週末產出課程後與操偶練習的學習紀錄與反思", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb25"}, {"name": "週末反思當週目標有無確實執行？下週安排需不需作調整？", "dates": [], "description": "", "_id": "67938ca99ddf9a5f9c3d2f35"}], "_id": "679333f79ddf9a5f9c3ceb22"}, {"name": "遊行大偶工作坊 第二週", "startDate": "2025-03-09T00:00:00", "endDate": "2025-03-15T00:00:00", "subMilestones": [{"name": "參與遊行大偶課程（3/9、3/15）", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb27"}, {"name": "其餘練習與反思，同第四週2、3、4點", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb28"}], "_id": "679333f79ddf9a5f9c3ceb26"}, {"name": "遊行大偶工作坊 第三週", "startDate": "2025-03-16T00:00:00", "endDate": "2025-03-22T00:00:00", "subMilestones": [{"name": " 參與遊行大偶課程（3/16、3/22）", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb2a"}, {"name": "其餘練習與反思，同第四週2、3、4點", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb2b"}], "_id": "679333f79ddf9a5f9c3ceb29"}, {"name": "遊行大偶工作坊 第四週", "startDate": "2025-03-23T00:00:00", "endDate": "2025-03-29T00:00:00", "subMilestones": [{"name": "參與遊行大偶課程（3/23、3/29）", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb2d"}, {"name": "其餘練習與反思，同第四週2、3、4點", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb2e"}], "_id": "679333f79ddf9a5f9c3ceb2c"}, {"name": "遊行大偶工作坊 第五週", "startDate": "2025-03-30T00:00:00", "endDate": "2025-04-05T00:00:00", "subMilestones": [{"name": "參與遊行大偶課程（3/30）", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb30"}, {"name": "其餘練習與反思，同第四週2、3、4點", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb31"}], "_id": "679333f79ddf9a5f9c3ceb2f"}, {"name": "遊行大偶工作坊 第六週", "startDate": "2025-04-06T00:00:00", "endDate": "2025-04-12T00:00:00", "subMilestones": [{"name": "參與遊行大偶彩排（4/6、4/11）", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb33"}, {"name": "遊行大偶演出（4/12）", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb34"}, {"name": "彩排後頻繁複習筆記與注意事項", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb35"}], "_id": "679333f79ddf9a5f9c3ceb32"}, {"name": "遊行大偶工作坊 第七週", "startDate": "2025-04-13T00:00:00", "endDate": "2025-04-19T00:00:00", "subMilestones": [{"name": "遊行大偶演出（4/13）", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb37"}, {"name": "將工作坊綜整心得反思記錄下來，並於社群分享心得", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb38"}, {"name": "觀看〈當代戲偶與製作美學〉講座，並記錄心得反思", "dates": [], "description": "", "_id": "67938ca99ddf9a5f9c3d2f49"}], "_id": "679333f79ddf9a5f9c3ceb36"}, {"name": "懸絲偶初探", "startDate": "2025-04-20T00:00:00", "endDate": "2025-04-26T00:00:00", "subMilestones": [{"name": "製作一隻以線操作的戲偶", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb3a"}, {"name": "其餘練習與反思，同第一週2、3、4點", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb3b"}], "_id": "679333f79ddf9a5f9c3ceb39"}, {"name": "懸絲偶初探", "startDate": "2025-04-27T00:00:00", "endDate": "2025-05-03T00:00:00", "subMilestones": [{"name": "以操作練習為主，執行方式與反思同第一週2、3、4點", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb3d"}, {"name": "發布懸絲偶學習歷程貼文", "dates": [], "description": "", "_id": "67938ca99ddf9a5f9c3d2f4f"}], "_id": "679333f79ddf9a5f9c3ceb3c"}, {"name": "戲偶創作 主題：〈人〉", "startDate": "2025-05-04T00:00:00", "endDate": "2025-05-10T00:00:00", "subMilestones": [{"name": "範本搜索、戲偶設計", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb3f"}, {"name": "戲偶製作", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb40"}, {"name": "週末反思當週目標有無確實執行？下週安排需不需作調整？", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb41"}], "_id": "679333f79ddf9a5f9c3ceb3e"}, {"name": "戲偶創作 主題：〈人〉", "startDate": "2025-05-11T00:00:00", "endDate": "2025-05-17T00:00:00", "subMilestones": [{"name": "戲偶製作與修正", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb43"}, {"name": "週末反思當週目標有無確實執行？下週安排需不需作調整？", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb44"}], "_id": "679333f79ddf9a5f9c3ceb42"}, {"name": "戲偶創作 主題：〈人〉", "startDate": "2025-05-18T00:00:00", "endDate": "2025-05-24T00:00:00", "subMilestones": [{"name": "於社群平台發布戲偶的操作影片與介紹文字內容", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb46"}, {"name": "戲偶動作發展，並錄製影片", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb47"}, {"name": "週末反思當週目標有無確實執行？下週安排需不需作調整？", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb48"}], "_id": "679333f79ddf9a5f9c3ceb45"}, {"name": "戲偶創作 主題：〈植物〉", "startDate": "2025-05-25T00:00:00", "endDate": "2025-05-31T00:00:00", "subMilestones": [{"name": "範本搜索、戲偶設計", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb4a"}, {"name": "週末反思當週目標有無確實執行？下週安排需不需作調整？", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb4b"}], "_id": "679333f79ddf9a5f9c3ceb49"}, {"name": "戲偶創作 主題：〈植物〉", "startDate": "2025-06-01T00:00:00", "endDate": "2025-06-07T00:00:00", "subMilestones": [{"name": "戲偶製作與修正", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb4d"}, {"name": "週末反思當週目標有無確實執行？下週安排需不需作調整？", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb4e"}], "_id": "679333f79ddf9a5f9c3ceb4c"}, {"name": "戲偶創作 主題：〈植物〉", "startDate": "2025-06-08T00:00:00", "endDate": "2025-06-14T00:00:00", "subMilestones": [{"name": " 於社群平台發布戲偶的操作影片與介紹文字內容", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb50"}, {"name": " 戲偶動作發展，並錄製影片", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb51"}, {"name": "週末反思當週目標有無確實執行？下週安排需不需作調整？", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb52"}], "_id": "679333f79ddf9a5f9c3ceb4f"}, {"name": "戲偶創作 主題：〈動物〉", "startDate": "2025-06-15T00:00:00", "endDate": "2025-06-21T00:00:00", "subMilestones": [{"name": "範本搜索、戲偶設計", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb54"}, {"name": "週末反思當週目標有無確實執行？下週安排需不需作調整？", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb55"}], "_id": "679333f79ddf9a5f9c3ceb53"}, {"name": "戲偶創作 主題：〈動物〉", "startDate": "2025-06-22T00:00:00", "endDate": "2025-06-28T00:00:00", "subMilestones": [{"name": "戲偶製作與修正", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb57"}, {"name": "週末反思當週目標有無確實執行？下週安排需不需作調整？", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb58"}], "_id": "679333f79ddf9a5f9c3ceb56"}, {"name": "戲偶創作 主題：〈動物〉", "startDate": "2025-06-29T00:00:00", "endDate": "2025-07-05T00:00:00", "subMilestones": [{"name": "戲偶製作與修正", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb5a"}, {"name": "週末反思當週目標有無確實執行？下週安排需不需作調整？", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb5b"}], "_id": "679333f79ddf9a5f9c3ceb59"}, {"name": "戲偶創作 主題：〈動物〉", "startDate": "2025-07-06T00:00:00", "endDate": "2025-07-12T00:00:00", "subMilestones": [{"name": " 於社群平台發布戲偶的操作影片與介紹文字內容", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb5d"}, {"name": " 戲偶動作發展，並錄製影片", "dates": [], "description": "", "_id": "679333f79ddf9a5f9c3ceb5e"}], "_id": "679333f79ddf9a5f9c3ceb5c"}]	{"tags": ["藝術創作", "經營社群媒體"], "description": "計畫前中期產出執頭偶、杖頭偶、手套偶、遊行大偶工作坊、懸絲偶的學習歷程記錄，後期錄製製作的三個戲偶的動作片段，並附上創作理念與心得，完成後都需要在社群平台上分享。"}	Complete	Open		{"option": "4人團報價：12000元（一人3000元）", "price": 0, "email": ["llee.chier@gmail.com", "ctc.chang0514@gmail.com", "a0912358866@gmail.com"], "_id": "6773f2ce4b6a24b8351d7342"}	t	t	2024-12-31 13:34:06	2025-01-24 12:50:49	0	\N	2025-01-31 00:00:03.303988	airflow	2025-01-31 00:00:03.304499	airflow
677eb1370bfe245fc8382eda	探索拒學的根源與解決方案	2025S1	676c3d9a18e6b11da60582c2	深入研究拒學現象的背景、成因及其對個人與社會的影響，並設計創新的解決方案來幫助遭遇困境的學生重拾學習動力。通過文獻分析、問卷調查與專家訪談，計劃將結合心理學理論與數位科技，製作一款針對拒學學生的數位支持工具原型（MVP）。最終成果將以研究報告、產品原型及公開分享會的形式呈現，期望為教育體制提供洞見，並為學生及家長帶來實際幫助。	{"tags": ["好奇心驅動", "個人成長", "受群體影響", "探索可能性", "受事件啟發", "影響社會", "自我挑戰", "興趣熱情"], "description": "從小到大，我對學校的感受總是充滿矛盾。一方面，學校是我最初探索知識和人際互動的地方；另一方面，它也讓我感受到壓力和不適應。隨著年齡的增長，這種不適感逐漸累積和加深，直到高一時，我終於無法再忽視內心的抗拒感。那時的我，對課堂環境及學習方式都感到窒息，彷彿身處於一個無法調和的矛盾之中，所以我決定要轉個人自學。這不僅是離開傳統體制，而是一種對自我需求的回應，也是一場重新定義學習意義的旅程。\\n\\n這樣的經歷讓我對拒學議題產生了深刻的共鳴。我發現，拒學不僅僅是個人的問題，它還牽涉到家庭結構、教育體制以及社會文化等多重因素。我開始思考：是否有更好的方式來幫助那些像我一樣陷入困境的人？是否可以通過創新的方法來減少他們的痛苦？這些問題成為我探索拒學議題的動力來源，希望能夠深入研究與實踐，找出拒學背後的成因，並設計出真正能夠幫助學生的方法。\\n\\n現在做這件事，會為我帶來什麼？也想要藉此給自己一段時間，去感受、體驗一下到底對這件事有多少熱情，在我心中有多重要"}	1. **拒學的背景與成因分析**\n    - 學習心理學理論（如認知行為療法、阿德勒心理學）以理解拒學行為的心理機制。\n    - 探討拒學的多重成因，包括個人、家庭、學校及社會層面的影響。\n    - 研究拒學行為的功能模式（如逃避嫌惡刺激、尋求他人關注等）。\n    - **系統思考**：\n        - 學習系統思考的基本概念，如因果循環圖（Causal Loop Diagram）和系統動態模型（System Dynamics Model）。\n        - 將拒學視為一個複雜系統，分析其多層次影響，包括個人層面（心理健康）、家庭層面（親子關係）、學校層面（教學方式、同儕互動）及社會層面（政策、文化期待）。\n        - 建立因果循環圖，識別拒學問題中的正反饋機制，例如課業壓力如何加劇學生焦慮，進而導致拒學。\n        - 探索潛在的槓桿點（Leverage Points），如改善師生關係或提供心理支持，來打破負面循環。\n2. **調查與數據分析技能**\n    - 學習問卷設計與訪談技巧，用於蒐集拒學學生及其家庭的經驗資料。\n    - 掌握基礎數據分析工具（如Excel或SPSS），進行統計分析以識別趨勢與模式。\n3. **創新解決方案的設計**\n    - 探索如何利用科技（如生成式 AI）來提供個性化的心理支持或教育資源。\n    - 設計以學生需求為核心的解決方案，並規劃MVP（最小可行產品）進行測試。	1. 學習運用調查方法與分析工具，研究拒學的背景、成因及影響，並整理成具有洞見的結論。\n2. 利用前面的研究分析，設計結合科技與數位工具的創新解決方案，並規劃 MVP 驗證其效果。	{"tags": ["資料蒐集/研究/分析", "書籍閱讀", "找專家學者", "做專案", "訪談", "問卷調查"], "description": "1. **資料蒐集與文獻研究**\\n    - 閱讀相關書籍與研究報告，如《打破孩子拒學的沉默》和《從校園輔導工作初探拒學議題之生態指標》。\\n    - 分析國內外案例，了解不同文化背景下拒學問題的差異。\\n2. **系統思考應用**\\n    - 閲讀系統思考相關書籍（如第五項修煉），學習因果循環圖和系統描繪。\\n    - 在調查過程中繪製因果循環圖，識別拒學現象中的關鍵影響因素與反饋機制。\\n    - 使用系統動態模擬工具（如 Kumu）來測試不同干預策略的效果。\\n3. **訪談與問卷調查**\\n    - 訪談教育工作者、心理諮商師及曾經拒學的學生，了解真實經驗，並將訪談結果納入系統模型分析。\\n    - 設計問卷，針對學生及家長進行調查，蒐集第一手數據，用於驗證因果假設。\\n4. **實作與反思**\\n    - 透過設計MVP解決方案進行實驗性測試，並根據反饋進行改進。\\n    - 定期撰寫反思日誌，記錄自己的思考過程和收穫，以提升自我效能。"}	[{"name": "- 閱讀《教育心理學：理論與實踐》、《拒絕上學的孩子》。 - 學習系統思考工具（如因果循環圖和系統動態建模）的基本概念。 - 紀錄拒學議題中的主要影響因素，初步構建因果循環圖。", "startDate": "2025-02-09T00:00:00", "endDate": "2025-02-22T00:00:00", "subMilestones": [], "_id": "678a88f96662cd04f9689007"}, {"name": "- 閱讀《第五項修練》，理解系統思考在教育問題中的應用。 - 繪製更詳細的因果循環圖，加入心理、家庭、學校及社會層面的影響因素。 - 撰寫對拒學問題的系統性觀察筆記。", "startDate": "2025-02-23T00:00:00", "endDate": "2025-03-08T00:00:00", "subMilestones": [], "_id": "678a88f96662cd04f9689008"}, {"name": "- 設計針對學生、家長和教育工作者的問卷，涵蓋心理、家庭、學校及社會層面。 - 撰寫訪談提綱，包括針對拒學經驗、成因及應對策略的問題。 - 向專家或導師徵求問卷及提綱的修改建議。", "startDate": "2025-03-09T00:00:00", "endDate": "2025-03-22T00:00:00", "subMilestones": [], "_id": "678a88f96662cd04f9689009"}, {"name": "- 發放問卷，蒐集至少50份有效回應。 - 將問卷數據整理為表格，準備進一步分析。", "startDate": "2025-03-23T00:00:00", "endDate": "2025-04-05T00:00:00", "subMilestones": [], "_id": "678a88f96662cd04f968900a"}, {"name": "- 與3-5位教育工作者、心理諮商師或曾經拒學的學生進行深度訪談。 - 將訪談內容整理為文字紀錄，識別關鍵觀點和模式。", "startDate": "2025-04-06T00:00:00", "endDate": "2025-04-19T00:00:00", "subMilestones": [], "_id": "678a88f96662cd04f968900b"}, {"name": "- 使用SPSS或Excel進行數據分析，識別關鍵模式和趨勢。 - 根據調查結果更新因果循環圖，加入新的影響因素和反饋機制。 - 使用Kumu等工具構建系統動態模型，測試不同干預策略的效果。", "startDate": "2025-04-20T00:00:00", "endDate": "2025-05-03T00:00:00", "subMilestones": [], "_id": "678a88f96662cd04f968900c"}, {"name": "brainstorming解決方案概念。選擇最可行的方案，設計MVP（最小可行產品）的詳細規格", "startDate": "2025-05-04T00:00:00", "endDate": "2025-05-17T00:00:00", "subMilestones": [], "_id": "678a88f96662cd04f968900d"}, {"name": "開發MVP原型", "startDate": "2025-05-18T00:00:00", "endDate": "2025-05-31T00:00:00", "subMilestones": [], "_id": "678a88f96662cd04f968900e"}, {"name": "測試MVP原型，邀請至少10位拒學學生或相關人士參與使用測試，收集反饋", "startDate": "2025-06-01T00:00:00", "endDate": "2025-06-14T00:00:00", "subMilestones": [], "_id": "678a88f96662cd04f968900f"}, {"name": "- 整理調查結果、分析結論及測試反饋，形成完整研究框架。 - 撰寫研究報告初稿，包括背景、方法、結果及建議部分。", "startDate": "2025-06-15T00:00:00", "endDate": "2025-06-28T00:00:00", "subMilestones": [], "_id": "678a88f96662cd04f9689010"}, {"name": "製作簡報或影片，總結研究歷程、數據分析結果及解決方案。 撰寫部落格文章或Medium文章，公開分享研究經驗及資源。 舉辦線上分享會，展示研究成果並回答觀眾提問。 收集參加者對解決方案和研究內容的回饋意見，根據回饋修訂最終報告和解決方案。", "startDate": "2025-06-29T00:00:00", "endDate": "2025-07-12T00:00:00", "subMilestones": [], "_id": "678a88f96662cd04f9689011"}]	{"tags": ["發起專案或組織", "舉辦活動", "撰寫研究報告", "其他：請於下方撰寫"], "description": "1. **研究報告**\\n    \\n    撰寫一份完整的研究報告，包含拒學問題的背景、成因分析、調查結果及解決方案建議，供教育機構參考。\\n    \\n2. **數位平台原型**\\n    \\n    製作一款針對拒學學生的數位工具原型，如一個提供心理支持和教育資源的 GPTs，並記錄測試過程和結果。\\n    \\n3. **公開分享會**\\n    \\n    舉辦線上分享會，向社群展示研究成果，並邀請專家和同儕給予回饋，以促進跨領域合作。\\n    \\n4. **個人反思紀錄**\\n    \\n    建立一個部落格或Medium帳號，用於記錄整個研究歷程，包括挑戰、突破點和未來展望，希望能啟發更多人關注拒學議題。"}	Complete	Open		{"option": "4人團報價：12000元（一人3000元）", "price": 0, "email": [" llee.chier@gmail.com", "a0912358866@gmail.com", "the.oc1122@gmail.com"], "_id": "677eb1370bfe245fc8382ef1"}	f	t	2025-01-08 17:09:11	2025-01-24 13:45:09	0	\N	2025-01-31 00:00:03.303988	airflow	2025-01-31 00:00:03.304499	airflow
677eb1b00bfe245fc8382ef5	拒學議題的互動方案設計	2025S1	676c3fdb18e6b11da605832d	這次的學習計畫來自於我的親身經歷與觀察。高二時，因為人際關係、生涯迷茫與家庭問題，我曾深刻感受到拒學的無助與孤立，那段經歷讓我對這個議題有了特別的關注。我也目睹妹妹因心理疾病與校園壓力而陷入拒學，她的不安與掙扎讓我意識到，教育體系中對於拒學學生的理解與支持仍然不足。我希望透過這次計畫，深入探討拒學現象的心理、家庭與社會層面，設計出創新的互動方案，讓學校與社會能夠更友善地回應這些需求。\n\n這不僅是一場學習的旅程，更是一種對問題的探索與實踐。我期盼能藉由分析與行動設計，找出具體且可行的解方，幫助拒學議題的討論與解決走向更全面與溫暖的方向。每一步的努力，不只是對個人經歷的反思，也是希望能以更積極的方式，為這個複雜的問題帶來一些新的可能性與改變的契機。	{"tags": ["影響社會", "探索可能性", "興趣熱情", "自我挑戰", "個人成長", "受事件啟發"], "description": "我對拒學議題的關注源自於自身的經歷與觀察。高二時，因為人際關係、生涯迷惘以及家庭等複雜因素，我開始感受到難以踏入學校的困難，甚至出現拒絕上學的情況。經過一段時間的整理與反思，我決定在高三開始過上自學的生活。除此之外，我的妹妹比我更早經歷拒學的過程，她因為心理疾病的影響，面對學業無法跟上、人際關係問題以及學校老師的排擠，這讓我深刻感受到學校對拒學學生的環境非常不友善，且缺乏足夠的支持系統。因此，我希望可以透過這個議題的研究與發想解方，這不僅能讓我透過議題自我敘述來探索自我，還能將個人經驗影響社會，我相信，我在其中最大的學習就是將自己過去覺得不好的經驗轉為對於社會具有影響力的行動。\\n\\n另外，家長對拒學問題的理解也非常有限。大多數家長對於孩子拒學的情況感到困惑，並且不知該如何幫助孩子，這使得孩子往往處於被社會邊緣化的狀態，甚至開始遠離社會。我認為，這是當前亟需解決的重大問題。因此，我希望透過這次的學習馬拉松，學習如何將我的理想付諸實踐，並更深入了解拒學議題的不同面向。透過業師和其他資源的支持，我相信能夠讓我在實現這一理想的過程中，更加自信並具備具體的行動方案。"}	1.拒學的背景與成因：深入了解拒學現象的生態系統觀，包括心理健康、家庭環境、社會因素等，掌握影響學生拒學的各種因素\n2.專案設計與執行能力：學習如何設計小規模試驗計畫（MVP），包括確定目標、方法、預期結果等，並能夠在實際執行中靈活應對各種挑戰\n3.批判性思維：在研究過程中培養批判性思維，能夠對所收集的資料進行深入剖析，並提出具有洞見的結論\n4.培養以用戶為中心的設計思維：強調從使用者的需求出發來構建解決方案	1.能夠運用調查方法與分析工具，深入研究拒學的背景、成因及其影響，並整理出具有洞見的結論。\n2.能夠設計出創新且可行的解方，並規劃小規模試驗計畫（MVP）以驗證方案的效果。\n3.學習活動企劃與產品設計技巧，從流程設計到實際執行都能掌握核心重點。\n4.確認自己對於拒學議題是否有真正的使命感與熱情。	{"tags": ["問卷調查", "參與活動或課程", "舉辦活動或課程", "發起行動", "做專案", "找專家學者", "找學伴共學", "參與競賽", "資料蒐集/研究/分析", "其他：請於下方撰寫"], "description": "在這次學習計畫中，我將綜合運用多種學習方法，透過自我敘述、資料蒐集、訪談與專案實作等方式，深入探討拒學議題並設計互動解決方案。首先，我會以資料蒐集與研究作為基礎，閱讀相關文獻與報導，了解拒學議題的背景與成因，並運用分析工具整理數據，找出主要的影響因素。\\n\\n接著，我計劃 訪談專家學者與家長、學生，以更貼近現實的視角補充文獻中可能未提及的洞見，讓研究結論更加全面。  在研究基礎之上，我將設計一個小規模試驗計畫（MVP），結合學校場域與家庭層面的雙重需求，並且以專案實作的形式驗證解方的可行性。在過程中，我會尋找志同道合的學伴共學，一同進行方案設計與回饋討論，確保方案能被不同角色接受並有效執行。同時，我也計劃參與相關的社會創新競賽，測試方案的創新性與社會影響力，並獲得專業評審的指導。  \\n\\n除了研究與實驗，我還會主動發起行動，如舉辦「小型工作坊」，模擬解方案的真實執行場景，並記錄學習者的回應與改善建議。最後，我將總結學習所得，製作一份包含調查報告、方案設計與執行紀錄的學習歷程檔案。\\n"}	[{"name": "閱讀拒學相關文獻與書籍，研究拒學的心理學基礎", "startDate": "2025-02-09T00:00:00", "endDate": "2025-02-22T00:00:00", "subMilestones": [], "_id": "677eb1b00bfe245fc8382ef6"}, {"name": "分析拒學的社會層面影響，整理成一份系統圖", "startDate": "2025-02-23T00:00:00", "endDate": "2025-03-08T00:00:00", "subMilestones": [], "_id": "677eb1b00bfe245fc8382ef7"}, {"name": "整理第一階段所有資料，撰寫一份初步背景報告，涵蓋拒學成因及影響。", "startDate": "2025-03-09T00:00:00", "endDate": "2025-03-22T00:00:00", "subMilestones": [], "_id": "677eb1b00bfe245fc8382ef8"}, {"name": "根據收集的資料與分析相關議題組織方案結果，確立可能的解決方案框架，並設定具體目標。", "startDate": "2025-03-23T00:00:00", "endDate": "2025-04-05T00:00:00", "subMilestones": [], "_id": "677eb1b00bfe245fc8382ef9"}, {"name": "學習設計思維與以用戶為中心的解決方案設計方法，並對目標受眾進行更深入的需求分析。", "startDate": "2025-04-06T00:00:00", "endDate": "2025-04-19T00:00:00", "subMilestones": [], "_id": "677eb1b00bfe245fc8382efa"}, {"name": "根據用戶需求與設計思維，設計一個小規模試驗計畫來測試解決方案的可行性。", "startDate": "2025-04-20T00:00:00", "endDate": "2025-05-03T00:00:00", "subMilestones": [], "_id": "677eb1b00bfe245fc8382efb"}, {"name": "實施小規模的試驗計畫，並收集反饋與資料。", "startDate": "2025-05-04T00:00:00", "endDate": "2025-05-17T00:00:00", "subMilestones": [], "_id": "677eb1b00bfe245fc8382efc"}, {"name": "分析試驗過程中的資料，總結實施效果並提出改進建議。", "startDate": "2025-05-18T00:00:00", "endDate": "2025-05-31T00:00:00", "subMilestones": [], "_id": "677eb1b00bfe245fc8382efd"}, {"name": "根據分析結果對解決方案進行優化，並準備改進版的方案。", "startDate": "2025-06-01T00:00:00", "endDate": "2025-06-14T00:00:00", "subMilestones": [], "_id": "677eb1b00bfe245fc8382efe"}, {"name": "整理整體計畫，撰寫學習過程與結果的總結報告。", "startDate": "2025-06-15T00:00:00", "endDate": "2025-06-28T00:00:00", "subMilestones": [], "_id": "677eb1b00bfe245fc8382eff"}, {"name": "在學習結束後，準備一場簡報，向其他學員、導師或相關人員分享學習成果，並總結學習經驗。", "startDate": "2025-06-29T00:00:00", "endDate": "2025-07-12T00:00:00", "subMilestones": [], "_id": "677eb1b00bfe245fc8382f00"}]	{"tags": ["發起專案或組織", "參與競賽", "舉辦活動", "撰寫研究報告"], "description": "1.拒學議題研究報告：經過對拒學現象的深度研究，我將撰寫一份相關的研究報告，旨在提升對拒學學生的理解與支持。\\n2.專案的MVP（最小可行產品）：我將設計並實施一個針對拒學議題的解決方案，並在此過程中開發出MVP。這個MVP將包含一個初步的互動方案，旨在引導學生與家長找到更合適的學習方式。我將進行測試與反饋迭代，以確保其可行性與實用性。\\n3.競賽參與與成果呈現：我將參與與社會創新相關的競賽，並以研究報告與MVP為核心，展示我在拒學議題上的學習成果與創新方案。在此過程中，我不僅希望能夠獲得評審的肯定，也期望透過這些競賽機會獲得更多反饋、資金，進一步提升方案的完善度。"}	Complete	Open		{"option": "4人團報價：12000元（一人3000元）", "price": 0, "email": ["llee.chier@gmail.com", "ctc.chang0514@gmail.com", "the.oc1122@gmail.com"], "_id": "677eb1b00bfe245fc8382f01"}	f	t	2025-01-08 17:11:12	2025-01-19 13:53:22	0	\N	2025-01-31 00:00:03.303988	airflow	2025-01-31 00:00:03.304499	airflow
67836dce6662cd04f9683384	用A I輔助，製作大腦與飲食介紹的網站	2025S1	67814b250bfe245fc8384532	之前營隊有獲得相關的講義，在學習上也學習到不少使用的AI工具可以收集資料以及製作成果。\n將這些資料整合並且分享給需要的人，然後在過程中學習自己有興趣的大腦知識以及營養學。	{"tags": ["個人成長", "好奇心驅動", "興趣熱情", "自我挑戰", "職涯發展", "探索可能性", "應對未來", "創新發展", "實用需求", "受事件啟發", "影響社會"], "description": "因為想要探索大腦相關的領域，也因為減肥而在過程中對於營養學有興趣。\\n因此在計劃時把大腦、飲食、荷爾蒙、內分泌等知識分享給需要的人，並且針對學生做出建議與對策，也幫助自己更了解相關領域的發展！"}	-網站架設(ai工具)\n-版面設計與內容編制\n-內分泌與營養學\n-怎麼樣真正「享瘦」生活	學習更多AI工具的運用，以及把大腦和營養學的知識融會貫通	{"tags": ["資料蒐集/研究/分析", "書籍閱讀", "觀看影片", "參與社群", "參與活動或課程"], "description": "用Hocoos製作網頁\\nbrain bee的免費講義學習大腦知識\\n《飢餓訊號》等書籍學習飲食知識\\ngoogle notebookLM 整理資料，製作英文podcast 學習更進階的英文\\n閱讀書籍了解營養學"}	[{"name": "腦科學入門與大腦功能", "startDate": "2025-02-09T00:00:00", "endDate": "2025-02-22T00:00:00", "subMilestones": [], "_id": "6797922b9ddf9a5f9c3f4a60"}, {"name": "製作筆記、網頁，拍短影片分享", "startDate": "2025-02-23T00:00:00", "endDate": "2025-03-08T00:00:00", "subMilestones": [], "_id": "6797922b9ddf9a5f9c3f4a61"}, {"name": "飲食對腦健康的影響機制", "startDate": "2025-03-09T00:00:00", "endDate": "2025-03-22T00:00:00", "subMilestones": [], "_id": "6797922b9ddf9a5f9c3f4a62"}, {"name": "製作筆記、網頁，拍短影片分享", "startDate": "2025-03-23T00:00:00", "endDate": "2025-04-05T00:00:00", "subMilestones": [], "_id": "6797922b9ddf9a5f9c3f4a63"}, {"name": "腸道菌群與情緒的關聯", "startDate": "2025-04-06T00:00:00", "endDate": "2025-04-19T00:00:00", "subMilestones": [], "_id": "6797922b9ddf9a5f9c3f4a64"}, {"name": "製作筆記、網頁，拍短影片分享", "startDate": "2025-04-20T00:00:00", "endDate": "2025-05-03T00:00:00", "subMilestones": [], "_id": "6797922b9ddf9a5f9c3f4a65"}, {"name": "飲食與記憶力", "startDate": "2025-05-04T00:00:00", "endDate": "2025-05-17T00:00:00", "subMilestones": [], "_id": "6797922b9ddf9a5f9c3f4a66"}, {"name": "製作筆記、網頁，拍短影片分享", "startDate": "2025-05-18T00:00:00", "endDate": "2025-05-31T00:00:00", "subMilestones": [], "_id": "6797922b9ddf9a5f9c3f4a67"}, {"name": "情緒管理與壓力調節中的飲食角色", "startDate": "2025-06-01T00:00:00", "endDate": "2025-06-14T00:00:00", "subMilestones": [], "_id": "6797922b9ddf9a5f9c3f4a68"}, {"name": "製作筆記、網頁，拍短影片分享", "startDate": "2025-06-15T00:00:00", "endDate": "2025-06-28T00:00:00", "subMilestones": [], "_id": "6797922b9ddf9a5f9c3f4a69"}, {"name": "總結心得，可能的話辦一個小型分享會（或者以此為標準製作心得）", "startDate": "2025-06-29T00:00:00", "endDate": "2025-07-12T00:00:00", "subMilestones": [], "_id": "6797922b9ddf9a5f9c3f4a6a"}]	{"tags": ["架設網站", "經營社群媒體", "撰寫研究報告"], "description": "架設資訊統整網站，以社群媒體輔助分享知識"}	Complete	Open		{"option": "4人團報價：12000元（一人3000元）", "price": 0, "email": ["Ilikedriedfruit@gmail.com", "justin387130618@gmail.com", "xuezhiqian759@gmail.com"], "_id": "67836dce6662cd04f9683390"}	t	t	2025-01-12 07:22:54	2025-01-27 14:03:23	0	\N	2025-01-31 00:00:03.303988	airflow	2025-01-31 00:00:03.304499	airflow
6784d05e6662cd04f96850f3	繼續學習程式設計	2025S1	6784cbab6662cd04f96850de	因為想繼續精進，希望能一直進步，平常寫LeetCode和zero judge和codingbar	{"tags": ["職涯發展", "興趣熱情", "自我挑戰", "個人成長", "升學或資格獲取"], "description": "一剛開始是因為國小scratch社團，覺得程式設計有趣，後來學習python"}	Python語法\n演算法\n資料結構	更能夠把想法（自然語言），轉換成code，學習更多演算法資料結構	{"tags": ["書籍閱讀", "觀看影片", "考試", "參與競賽", "做專案"], "description": "挑選適合自己程度的題目，大量刷題，每做完一題都去了解最好的解法"}	[{"name": "Cc", "startDate": "2025-02-09T00:00:00", "endDate": "2025-02-22T00:00:00", "subMilestones": [], "_id": "6784d05e6662cd04f96850f4"}, {"name": "Cc", "startDate": "2025-02-23T00:00:00", "endDate": "2025-03-08T00:00:00", "subMilestones": [], "_id": "6784d05e6662cd04f96850f5"}, {"name": "Cc", "startDate": "2025-03-09T00:00:00", "endDate": "2025-03-22T00:00:00", "subMilestones": [], "_id": "6784d05e6662cd04f96850f6"}, {"name": "Cc", "startDate": "2025-03-23T00:00:00", "endDate": "2025-04-05T00:00:00", "subMilestones": [], "_id": "6784d05e6662cd04f96850f7"}, {"name": "Cc", "startDate": "2025-04-06T00:00:00", "endDate": "2025-04-19T00:00:00", "subMilestones": [], "_id": "6784d05e6662cd04f96850f8"}, {"name": "Cc", "startDate": "2025-04-20T00:00:00", "endDate": "2025-05-03T00:00:00", "subMilestones": [], "_id": "6784d05e6662cd04f96850f9"}, {"name": "Cc", "startDate": "2025-05-04T00:00:00", "endDate": "2025-05-17T00:00:00", "subMilestones": [], "_id": "6784d05e6662cd04f96850fa"}, {"name": "Cc", "startDate": "2025-05-18T00:00:00", "endDate": "2025-05-31T00:00:00", "subMilestones": [], "_id": "6784d05e6662cd04f96850fb"}, {"name": "Cc", "startDate": "2025-06-01T00:00:00", "endDate": "2025-06-14T00:00:00", "subMilestones": [], "_id": "6784d05e6662cd04f96850fc"}, {"name": "Cccc", "startDate": "2025-06-15T00:00:00", "endDate": "2025-06-28T00:00:00", "subMilestones": [], "_id": "6784d05e6662cd04f96850fd"}, {"name": "Cc", "startDate": "2025-06-29T00:00:00", "endDate": "2025-07-12T00:00:00", "subMilestones": [], "_id": "6784d05e6662cd04f96850fe"}]	{"tags": ["其他：請於下方撰寫"], "description": "呈現刷了哪些題庫"}	Complete	Open		{"option": "4人團報價：12000元（一人3000元）", "price": 0, "email": ["Cc", "Cc", "Cc"], "_id": "6784d05e6662cd04f96850ff"}	t	t	2025-01-13 08:35:42	2025-01-13 08:35:42	0	\N	2025-01-31 00:00:03.303988	airflow	2025-01-31 00:00:03.304499	airflow
67850cb36662cd04f9685a42	我想出一本書	2025S1	67850b3d6662cd04f9685a39	我本身有在寫作，想用自己的力量出一本書（自印也可以）	{"tags": ["興趣熱情", "自我挑戰", "個人成長"], "description": "我喜歡寫作！我想讓我的故事被看見"}	內容規劃抓200頁 但也有想過要不要再少一點啦！	我希望我出一本書，然後好好的紀錄	{"tags": ["參與活動或課程", "舉辦活動或課程", "找學伴共學"], "description": "我是一個感覺派選手所以打算參加各種不一樣的活動寫下冒險日誌"}	[{"name": "探索：你的主題要寫什麼呢？", "startDate": "2025-02-09T00:00:00", "endDate": "2025-02-22T00:00:00", "subMilestones": [], "_id": "67850cb36662cd04f9685a43"}, {"name": "開始書寫", "startDate": "2025-02-23T00:00:00", "endDate": "2025-03-08T00:00:00", "subMilestones": [], "_id": "67850cb36662cd04f9685a44"}, {"name": "書寫", "startDate": "2025-03-09T00:00:00", "endDate": "2025-03-22T00:00:00", "subMilestones": [], "_id": "67850cb36662cd04f9685a45"}, {"name": "書寫", "startDate": "2025-03-23T00:00:00", "endDate": "2025-04-05T00:00:00", "subMilestones": [], "_id": "67850cb36662cd04f9685a46"}, {"name": "書寫", "startDate": "2025-04-06T00:00:00", "endDate": "2025-04-19T00:00:00", "subMilestones": [], "_id": "67850cb36662cd04f9685a47"}, {"name": "書寫", "startDate": "2025-04-20T00:00:00", "endDate": "2025-05-03T00:00:00", "subMilestones": [], "_id": "67850cb36662cd04f9685a48"}, {"name": "書寫", "startDate": "2025-05-04T00:00:00", "endDate": "2025-05-17T00:00:00", "subMilestones": [], "_id": "67850cb36662cd04f9685a49"}, {"name": "書寫", "startDate": "2025-05-18T00:00:00", "endDate": "2025-05-31T00:00:00", "subMilestones": [], "_id": "67850cb36662cd04f9685a4a"}, {"name": "書寫", "startDate": "2025-06-01T00:00:00", "endDate": "2025-06-14T00:00:00", "subMilestones": [], "_id": "67850cb36662cd04f9685a4b"}, {"name": "書寫", "startDate": "2025-06-15T00:00:00", "endDate": "2025-06-28T00:00:00", "subMilestones": [], "_id": "67850cb36662cd04f9685a4c"}, {"name": "書寫", "startDate": "2025-06-29T00:00:00", "endDate": "2025-07-12T00:00:00", "subMilestones": [], "_id": "67850cb36662cd04f9685a4d"}]	{"tags": ["藝術創作", "其他：請於下方撰寫"], "description": "我會出書並且售賣"}	Complete	Open		{"option": "中低收入戶：將提供三位免費參與資格", "price": 0, "email": [], "_id": "67850cb36662cd04f9685a4e"}	t	t	2025-01-13 12:53:07	2025-01-13 12:53:07	0	\N	2025-01-31 00:00:03.303988	airflow	2025-01-31 00:00:03.304499	airflow
6788dd316662cd04f968801e	cc	2025S1	669e0d96256188da6f9c4ec9	cc	{"tags": ["好奇心驅動"], "description": "cc"}	cc	cc	{"tags": ["觀看影片"], "description": "cc"}	[{"name": "cc", "startDate": "2025-02-09T00:00:00", "endDate": "2025-02-22T00:00:00", "subMilestones": [], "_id": "6788dd316662cd04f968801f"}, {"name": "cc", "startDate": "2025-02-23T00:00:00", "endDate": "2025-03-08T00:00:00", "subMilestones": [], "_id": "6788dd316662cd04f9688020"}, {"name": "cc", "startDate": "2025-03-09T00:00:00", "endDate": "2025-03-22T00:00:00", "subMilestones": [], "_id": "6788dd316662cd04f9688021"}, {"name": "cc", "startDate": "2025-03-23T00:00:00", "endDate": "2025-04-05T00:00:00", "subMilestones": [], "_id": "6788dd316662cd04f9688022"}, {"name": "cc", "startDate": "2025-04-06T00:00:00", "endDate": "2025-04-19T00:00:00", "subMilestones": [], "_id": "6788dd316662cd04f9688023"}, {"name": "cc", "startDate": "2025-04-20T00:00:00", "endDate": "2025-05-03T00:00:00", "subMilestones": [], "_id": "6788dd316662cd04f9688024"}, {"name": "cc", "startDate": "2025-05-04T00:00:00", "endDate": "2025-05-17T00:00:00", "subMilestones": [], "_id": "6788dd316662cd04f9688025"}, {"name": "cc", "startDate": "2025-05-18T00:00:00", "endDate": "2025-05-31T00:00:00", "subMilestones": [], "_id": "6788dd316662cd04f9688026"}, {"name": "cc", "startDate": "2025-06-01T00:00:00", "endDate": "2025-06-14T00:00:00", "subMilestones": [], "_id": "6788dd316662cd04f9688027"}, {"name": "cc", "startDate": "2025-06-15T00:00:00", "endDate": "2025-06-28T00:00:00", "subMilestones": [], "_id": "6788dd316662cd04f9688028"}, {"name": "cc", "startDate": "2025-06-29T00:00:00", "endDate": "2025-07-12T00:00:00", "subMilestones": [], "_id": "6788dd316662cd04f9688029"}]	{"tags": ["藝術創作"], "description": "cc"}	Complete	Open		{"option": "優惠價：8000 元", "price": 0, "email": [], "_id": "6788dd316662cd04f968802a"}	t	t	2025-01-16 10:19:29	2025-01-16 10:19:29	0	\N	2025-01-31 00:00:03.303988	airflow	2025-01-31 00:00:03.304499	airflow
678c4f7f3b18d82b6896c15c	往課程企劃的路上邁進	2025S1	676a0f3718e6b11da60577ed	因為想要在工作上獲得職涯成長，我預計會分為個人學習面、工作職場面去規劃我自己這一年的夢想藍圖，希望能藉此往課程企劃的角色邁進	{"tags": ["職涯發展"], "description": "因為本身是負責課程行政的角色，看著身邊同事透過實際規劃的課程，真的能夠幫助上課的學員，能夠因為受訓完，而真的能夠應用在工作上而進步，所以想要在職涯上成長，獲得更好的進步！"}	-訓練規劃暨執行管理師認證班\n-強化個人溝通力，提升工作效能\n-新媒體AI社群行銷-善用智慧AI，讓社群文案脫穎而出\n-輕鬆學Canva 簡報視覺設計\n	-能更有系統的學習：輸入至輸出\n-工作上能與主管保持良好溝通	{"tags": [], "description": "我預計從上述的方向邁進，並且固定每個月與主管約面談，以確保自己的方向都有跟上，並滾動式修正自己的缺失"}	[{"name": "工作面：設計課程行銷企劃書", "startDate": "2025-02-09T00:00:00", "endDate": "2025-02-15T00:00:00", "subMilestones": [], "_id": "678c4f7f3b18d82b6896c15d"}, {"name": "學習面：參加公司內部訓練輕鬆學Canva 簡報視覺設計", "startDate": "2025-02-16T00:00:00", "endDate": "2025-02-22T00:00:00", "subMilestones": [], "_id": "678c4f7f3b18d82b6896c15e"}, {"name": "學習面：訓練規劃暨執行管理師認證班", "startDate": "2025-02-23T00:00:00", "endDate": "2025-03-01T00:00:00", "subMilestones": [{"name": "分享學習心得、資源在threads", "dates": [{"$date": "2024-01-02T00:00:00"}], "description": "", "_id": "678c4f7f3b18d82b6896c160"}], "_id": "678c4f7f3b18d82b6896c15f"}, {"name": "學習面：訓練規劃暨執行管理師認證班", "startDate": "2025-03-02T00:00:00", "endDate": "2025-03-08T00:00:00", "subMilestones": [{"name": "分享學習心得、資源在threds", "dates": [{"$date": "2024-01-02T00:00:00"}], "description": "", "_id": "678c4f7f3b18d82b6896c162"}], "_id": "678c4f7f3b18d82b6896c161"}, {"name": "學習面：訓練規劃暨執行管理師認證班", "startDate": "2025-03-09T00:00:00", "endDate": "2025-03-15T00:00:00", "subMilestones": [{"name": "分享學習心得、資源在threds", "dates": [], "description": "", "_id": "678c4f7f3b18d82b6896c164"}, {"name": "個人課程筆記整理", "dates": [], "description": "", "_id": "678c4f7f3b18d82b6896c165"}], "_id": "678c4f7f3b18d82b6896c163"}, {"name": "學習面：XChangeBD 實戰談「LinkedIn 拓展」", "startDate": "2025-03-16T00:00:00", "endDate": "2025-03-22T00:00:00", "subMilestones": [{"name": "發想LinkedIn內容", "dates": [{"$date": "2024-01-06T00:00:00"}], "description": "", "_id": "678c4f7f3b18d82b6896c167"}], "_id": "678c4f7f3b18d82b6896c166"}, {"name": "工作面：設計發想課程行銷電子報", "startDate": "2025-03-23T00:00:00", "endDate": "2025-03-29T00:00:00", "subMilestones": [], "_id": "678c4f7f3b18d82b6896c168"}, {"name": "工作面：與主管對焦課程行銷電子報", "startDate": "2025-03-30T00:00:00", "endDate": "2025-04-05T00:00:00", "subMilestones": [], "_id": "678c4f7f3b18d82b6896c169"}, {"name": "學習面：XChangeBD 實戰談「客戶關係深耕」", "startDate": "2025-04-06T00:00:00", "endDate": "2025-04-12T00:00:00", "subMilestones": [], "_id": "678c4f7f3b18d82b6896c16a"}, {"name": "學習面：XChangeBD 實戰談「解構商業模式」", "startDate": "2025-04-13T00:00:00", "endDate": "2025-04-19T00:00:00", "subMilestones": [], "_id": "678c4f7f3b18d82b6896c16b"}, {"name": "學習面：強化個人溝通力，提升工作效能", "startDate": "2025-04-20T00:00:00", "endDate": "2025-04-26T00:00:00", "subMilestones": [], "_id": "678c4f7f3b18d82b6896c16c"}, {"name": "學習面：新媒體AI社群行銷-善用智慧AI，讓社群文案脫穎而出", "startDate": "2025-04-27T00:00:00", "endDate": "2025-05-03T00:00:00", "subMilestones": [], "_id": "678c4f7f3b18d82b6896c16d"}, {"name": "學習面：XChangeBD 思維升級「顧問方法」", "startDate": "2025-05-04T00:00:00", "endDate": "2025-05-10T00:00:00", "subMilestones": [], "_id": "678c4f7f3b18d82b6896c16e"}, {"name": "工作面：試想預計開設課程主題、對象", "startDate": "2025-05-11T00:00:00", "endDate": "2025-05-17T00:00:00", "subMilestones": [], "_id": "678c4f7f3b18d82b6896c16f"}, {"name": "工作面：與主管約面談討論可行度", "startDate": "2025-05-18T00:00:00", "endDate": "2025-05-24T00:00:00", "subMilestones": [], "_id": "678c4f7f3b18d82b6896c170"}, {"name": "學習面：XChangeBD 實戰談「資源協作攻略」", "startDate": "2025-05-25T00:00:00", "endDate": "2025-05-31T00:00:00", "subMilestones": [], "_id": "678c4f7f3b18d82b6896c171"}, {"name": "工作面：市場調查課程主題", "startDate": "2025-06-01T00:00:00", "endDate": "2025-06-07T00:00:00", "subMilestones": [], "_id": "678c4f7f3b18d82b6896c172"}, {"name": "工作面：陌生開發尋覓適合講師", "startDate": "2025-06-08T00:00:00", "endDate": "2025-06-14T00:00:00", "subMilestones": [], "_id": "678c4f7f3b18d82b6896c173"}, {"name": "工作面：設計課程社群交流", "startDate": "2025-06-15T00:00:00", "endDate": "2025-06-21T00:00:00", "subMilestones": [], "_id": "678c4f7f3b18d82b6896c174"}, {"name": "工作面：上架課程規劃", "startDate": "2025-06-22T00:00:00", "endDate": "2025-06-28T00:00:00", "subMilestones": [], "_id": "678c4f7f3b18d82b6896c175"}, {"name": "工作面：發想粉絲專頁文案", "startDate": "2025-06-29T00:00:00", "endDate": "2025-07-05T00:00:00", "subMilestones": [], "_id": "678c4f7f3b18d82b6896c176"}, {"name": "學習面：分享這半年左右的各方面收穫", "startDate": "2025-07-06T00:00:00", "endDate": "2025-07-12T00:00:00", "subMilestones": [], "_id": "678c4f7f3b18d82b6896c177"}]	{"tags": [], "description": "我預計在個人threads頁面開設學習分享帳號並用portaly串接個人頁面"}	Complete	Open		{"option": "4人團報價：12000元（一人3000元）", "price": 0, "email": ["yufish0117@gmail.com", "eddie8873192@gmail.com", "choumei.bonnie@gmail.com"], "_id": "678c4f7f3b18d82b6896c178"}	t	t	2025-01-19 01:03:59	2025-01-19 01:03:59	0	\N	2025-01-31 00:00:03.303988	airflow	2025-01-31 00:00:03.304499	airflow
678dc82b3b18d82b6896e04d	學習寫作與經營個人部落格	2025S1	678b01773b18d82b6896b25c	平常有閱讀的習慣，因此希望藉由經營部落格來分享自己的想法，養成寫作習慣、同時增進自己的寫作、思考能力，並期望在過程中認識到不同領域的朋友一起互相學習、成長！\n我的目標是在21週內產出至少18篇文章，並學會經營部落格的相關事務，包括SEO、推廣等等。為了達到這個目標，我會閱讀《寫作是最好的自我投資》、《精準寫作》兩本書，並每天練習寫作，然後利用網路資源學習SEO相關知識。	{"tags": ["興趣熱情", "自我挑戰", "個人成長", "探索可能性", "人際連結", "影響社會"], "description": "首先我很喜歡閱讀，之前讀到學習不能只是輸入也必須輸出，另外寫作也可以結合自身專長、興趣，所以我這是個很好的輸出方式，可以同時加強對學習內容、專長、興趣的認知。第二，寫作也能帶來很多好處，包括增加邏輯思考能力、表達能力、觀察力等。\\n第三，人的成就與意義感很大程度來自「創造」了什麼，因此我想養成一個創作類型的興趣，而寫作是個門檻較低且效益很多的方式。第四，寫作能力在許多領域都能派上用場，對於目前沒有明確職涯方向的我來說是很適合培養的技能。最後，若部落格經營有成，寫作也能成為副業。另外因為文章的特性(邊際成本趨近零)，所以變現後能成為被動收入的來源。公開發表文章或加入社群也有機會認識到其他不同領域的創作者，能夠拓展人脈並互相學習。"}	廣泛閱讀／定期寫作／寫作能力／邏輯思考／自律／SEO搜尋引擎最佳化／自媒體經營	養成固定寫作的習慣、學會有深度且多方面的思考、學會經營個人媒體	{"tags": ["書籍閱讀", "資料蒐集/研究/分析", "觀看影片", "其他：請於下方撰寫"], "description": "閱讀《寫作是最好的自我投資》、《精準寫作》／規律、持續的練習寫作／經營部落格並發表文章／使用網路資源學習SEO相關知識\\n"}	[{"name": "制定詳細的計畫＆開始閱讀／寫作", "startDate": "2025-02-09T00:00:00", "endDate": "2025-02-22T00:00:00", "subMilestones": [{"name": "每天什麼時候練習寫作、寫多久、練習方式？", "dates": [], "description": "", "_id": "678dc82b3b18d82b6896e04f"}, {"name": "閱讀計畫：預計多久內讀完", "dates": [], "description": "", "_id": "678dc82b3b18d82b6896e050"}, {"name": "開始閱讀＆持續練習", "dates": [], "description": "", "_id": "678dc82b3b18d82b6896e051"}], "_id": "678dc82b3b18d82b6896e04e"}, {"name": "選擇平台建立個人部落格＆上傳文章", "startDate": "2025-02-23T00:00:00", "endDate": "2025-03-08T00:00:00", "subMilestones": [{"name": "建立個人部落格(預計使用Vocus、Medium)", "dates": [], "description": "", "_id": "678dc82b3b18d82b6896e053"}, {"name": "讀完《寫作是最好的自我投資》並完成讀書筆記（可寫成文章上傳）", "dates": [], "description": "", "_id": "678dc82b3b18d82b6896e054"}], "_id": "678dc82b3b18d82b6896e052"}, {"name": "讀完《精準寫作》並完成讀書筆記（可寫成文章上傳）", "startDate": "2025-03-09T00:00:00", "endDate": "2025-03-22T00:00:00", "subMilestones": [], "_id": "678dc82b3b18d82b6896e055"}, {"name": "學習SEO相關知識並應用於部落格經營", "startDate": "2025-03-23T00:00:00", "endDate": "2025-04-05T00:00:00", "subMilestones": [{"name": "關鍵字研究與應用", "dates": [], "description": "", "_id": "678dc82b3b18d82b6896e057"}, {"name": "吸引點擊的Meta描述與標題", "dates": [], "description": "", "_id": "678dc82b3b18d82b6896e058"}, {"name": "結構化內容", "dates": [], "description": "", "_id": "678dc82b3b18d82b6896e059"}, {"name": "高品質內容", "dates": [], "description": "", "_id": "678dc82b3b18d82b6896e05a"}], "_id": "678dc82b3b18d82b6896e056"}, {"name": "練習影評寫作", "startDate": "2025-04-06T00:00:00", "endDate": "2025-04-19T00:00:00", "subMilestones": [{"name": "至少寫出兩篇影評文章並上傳", "dates": [], "description": "", "_id": "678dc82b3b18d82b6896e05c"}], "_id": "678dc82b3b18d82b6896e05b"}, {"name": "練習社會觀點寫作", "startDate": "2025-04-20T00:00:00", "endDate": "2025-05-03T00:00:00", "subMilestones": [{"name": "至少寫出兩篇社會觀點文章並上傳", "dates": [], "description": "", "_id": "678dc82b3b18d82b6896e05e"}], "_id": "678dc82b3b18d82b6896e05d"}, {"name": "練習經濟市場分析寫作", "startDate": "2025-05-04T00:00:00", "endDate": "2025-05-17T00:00:00", "subMilestones": [{"name": "至少寫出兩篇經濟市場分析文章並上傳", "dates": [], "description": "", "_id": "678dc82b3b18d82b6896e060"}], "_id": "678dc82b3b18d82b6896e05f"}, {"name": "繼續寫作", "startDate": "2025-05-18T00:00:00", "endDate": "2025-05-31T00:00:00", "subMilestones": [{"name": "至少完成兩篇文章&上傳", "dates": [], "description": "", "_id": "678dc82b3b18d82b6896e062"}], "_id": "678dc82b3b18d82b6896e061"}, {"name": "繼續寫作", "startDate": "2025-06-01T00:00:00", "endDate": "2025-06-14T00:00:00", "subMilestones": [{"name": "至少完成兩篇文章&上傳", "dates": [], "description": "", "_id": "678dc82b3b18d82b6896e064"}], "_id": "678dc82b3b18d82b6896e063"}, {"name": "繼續寫作", "startDate": "2025-06-15T00:00:00", "endDate": "2025-06-28T00:00:00", "subMilestones": [{"name": "至少完成兩篇文章&上傳", "dates": [], "description": "", "_id": "678dc82b3b18d82b6896e066"}], "_id": "678dc82b3b18d82b6896e065"}, {"name": "總結、反思", "startDate": "2025-06-29T00:00:00", "endDate": "2025-07-12T00:00:00", "subMilestones": [{"name": "整理自主學習計畫遇到的挑戰、困難、解決辦法、收穫等", "dates": [], "description": "", "_id": "678dc82b3b18d82b6896e068"}, {"name": "寫一篇總結這次自主學習計畫的文章", "dates": [], "description": "", "_id": "678dc82b3b18d82b6896e069"}], "_id": "678dc82b3b18d82b6896e067"}]	{"tags": ["經營社群媒體", "其他：請於下方撰寫"], "description": "至少產出18篇文章／部落格經營狀況／寫一篇關於自主學習計畫的心得、反思文章\\n"}	Complete	Open		{"option": "4人團報價：12000元（一人3000元）", "price": 0, "email": ["dd20071211@gmail.com", "Ilikedriedfruit@gmail.com", "xuezhiqian759@gmail.com"], "_id": "678dc82b3b18d82b6896e06a"}	f	t	2025-01-20 03:51:07	2025-01-24 04:03:52	0	\N	2025-01-31 00:00:03.303988	airflow	2025-01-31 00:00:03.304499	airflow
678efb1f9ddf9a5f9c3c014f	架設一個電商與形象網站	2025S1	678c9ffe3b18d82b6896c8a9	因為與音樂教室的老闆聊過，發現他們想要有個平台可以買賣樂器與周邊商品，加上教室有辦過很多活動，因此想要為音樂教室做一個電商與形象網站。可以讓店家上架商品與展示活動成果。	{"tags": ["人際連結", "興趣熱情", "自我挑戰", "個人成長", "實用需求"], "description": "發現需求，想要為音樂教室做網站。"}	-學習 UI/UX\n-學習如何使用 wordpress 架設網站\n-學習網站部署等相關知識	學習如何從零開始，架設一個完整的電商網站。	{"tags": ["資料蒐集/研究/分析", "觀看影片", "參與社群", "發起行動", "訪談"], "description": "我預計上網搜尋相關範例，利用 Notion 做筆記。"}	[{"name": "確認需求", "startDate": "2025-02-09T00:00:00", "endDate": "2025-02-15T00:00:00", "subMilestones": [], "_id": "678efb1f9ddf9a5f9c3c0150"}, {"name": "確認 wordpress 主題", "startDate": "2025-02-16T00:00:00", "endDate": "2025-02-22T00:00:00", "subMilestones": [], "_id": "678efb1f9ddf9a5f9c3c0151"}, {"name": "建立網站架構", "startDate": "2025-02-23T00:00:00", "endDate": "2025-03-01T00:00:00", "subMilestones": [], "_id": "678efb1f9ddf9a5f9c3c0152"}, {"name": "蒐集需要的資料", "startDate": "2025-03-02T00:00:00", "endDate": "2025-03-08T00:00:00", "subMilestones": [], "_id": "678efb1f9ddf9a5f9c3c0153"}, {"name": "蒐集需要的資料", "startDate": "2025-03-09T00:00:00", "endDate": "2025-03-15T00:00:00", "subMilestones": [], "_id": "678efb1f9ddf9a5f9c3c0154"}, {"name": "在本機開發", "startDate": "2025-03-16T00:00:00", "endDate": "2025-03-22T00:00:00", "subMilestones": [], "_id": "678efb1f9ddf9a5f9c3c0155"}, {"name": "在本機開發", "startDate": "2025-03-23T00:00:00", "endDate": "2025-03-29T00:00:00", "subMilestones": [], "_id": "678efb1f9ddf9a5f9c3c0156"}, {"name": "在本機開發", "startDate": "2025-03-30T00:00:00", "endDate": "2025-04-05T00:00:00", "subMilestones": [], "_id": "678efb1f9ddf9a5f9c3c0157"}, {"name": "在本機開發", "startDate": "2025-04-06T00:00:00", "endDate": "2025-04-12T00:00:00", "subMilestones": [], "_id": "678efb1f9ddf9a5f9c3c0158"}, {"name": "在本機開發", "startDate": "2025-04-13T00:00:00", "endDate": "2025-04-19T00:00:00", "subMilestones": [], "_id": "678efb1f9ddf9a5f9c3c0159"}, {"name": "在本機開發", "startDate": "2025-04-20T00:00:00", "endDate": "2025-04-26T00:00:00", "subMilestones": [], "_id": "678efb1f9ddf9a5f9c3c015a"}, {"name": "在本機開發", "startDate": "2025-04-27T00:00:00", "endDate": "2025-05-03T00:00:00", "subMilestones": [], "_id": "678efb1f9ddf9a5f9c3c015b"}, {"name": "在本機開發", "startDate": "2025-05-04T00:00:00", "endDate": "2025-05-10T00:00:00", "subMilestones": [], "_id": "678efb1f9ddf9a5f9c3c015c"}, {"name": "在本機開發", "startDate": "2025-05-11T00:00:00", "endDate": "2025-05-17T00:00:00", "subMilestones": [], "_id": "678efb1f9ddf9a5f9c3c015d"}, {"name": "在本機開發", "startDate": "2025-05-18T00:00:00", "endDate": "2025-05-24T00:00:00", "subMilestones": [], "_id": "678efb1f9ddf9a5f9c3c015e"}, {"name": "在本機開發", "startDate": "2025-05-25T00:00:00", "endDate": "2025-05-31T00:00:00", "subMilestones": [], "_id": "678efb1f9ddf9a5f9c3c015f"}, {"name": "在本機開發", "startDate": "2025-06-01T00:00:00", "endDate": "2025-06-07T00:00:00", "subMilestones": [], "_id": "678efb1f9ddf9a5f9c3c0160"}, {"name": "在本機開發", "startDate": "2025-06-08T00:00:00", "endDate": "2025-06-14T00:00:00", "subMilestones": [], "_id": "678efb1f9ddf9a5f9c3c0161"}, {"name": "在本機開發", "startDate": "2025-06-15T00:00:00", "endDate": "2025-06-21T00:00:00", "subMilestones": [], "_id": "678efb1f9ddf9a5f9c3c0162"}, {"name": "找適合的主機", "startDate": "2025-06-22T00:00:00", "endDate": "2025-06-28T00:00:00", "subMilestones": [], "_id": "678efb1f9ddf9a5f9c3c0163"}, {"name": "部署與上架", "startDate": "2025-06-29T00:00:00", "endDate": "2025-07-05T00:00:00", "subMilestones": [], "_id": "678efb1f9ddf9a5f9c3c0164"}, {"name": "網站後台教學使用", "startDate": "2025-07-06T00:00:00", "endDate": "2025-07-12T00:00:00", "subMilestones": [], "_id": "678efb1f9ddf9a5f9c3c0165"}]	{"tags": ["架設網站"], "description": "我預計會架設網站"}	Complete	Open		{"option": "4人團報價：12000元（一人3000元）", "price": 0, "email": ["christy98191@gmail.com", "zhouyuting08620@gmail.com", "linyancheng89@gmail.com"], "_id": "678efb1f9ddf9a5f9c3c0166"}	f	t	2025-01-21 01:40:47	2025-01-23 16:01:26	0	\N	2025-01-31 00:00:03.303988	airflow	2025-01-31 00:00:03.304499	airflow
679231579ddf9a5f9c3cab08	成為精通攝影的人	2025S1	679132119ddf9a5f9c3c7818	想要把人美好的瞬間定格記錄下來。\n目標：希望能夠精進攝影技術有朝一日成為專業攝影\n預計如何達成：先從簡單的手機攝影學起再精通後期後期再進一步學習單反	{"tags": ["興趣熱情"], "description": "因為曾經常去漫展看到攝影拍攝他人身邊也有專業攝影拍照，把人最美的一瞬記錄下來的這個動作讓我感到渴望並且看到他人被拍攝看到圖片欣喜的表情讓我感到滿足，希望有機會這項熱情能成為我未來的職業"}	1.拍攝技巧\n2.後期p圖技巧\n3.社交能力	1.定格美好的一瞬\n2.被拍者看到照片能露出開心的笑容	{"tags": ["資料蒐集/研究/分析", "觀看影片"], "description": "我預計會觀看網上教學視頻先從簡單的手機拍攝學起再去進階，並且一起學習後期技巧，後期完一張照片可以發給身邊人詢問意見和改進的地方，試試給身邊人拍攝並且詢問當事人意見以此去改進自己的不足"}	[{"name": "瞭解手機性能，認識攝影基礎概念", "startDate": "2025-02-09T00:00:00", "endDate": "2025-02-22T00:00:00", "subMilestones": [{"name": "瞭解手機攝影劣勢並找方法彌補", "dates": [], "description": "", "_id": "679231579ddf9a5f9c3cab0a"}, {"name": "一人拍攝劣勢尋找方法彌補", "dates": [], "description": "", "_id": "679231579ddf9a5f9c3cab0b"}], "_id": "679231579ddf9a5f9c3cab09"}, {"name": "基礎構圖技巧 學習色彩氛圍搭配", "startDate": "2025-02-23T00:00:00", "endDate": "2025-03-08T00:00:00", "subMilestones": [{"name": "拍攝不同構圖的照片", "dates": [], "description": "", "_id": "679231579ddf9a5f9c3cab0d"}, {"name": "瞭解不同構圖適合什麼類型照片", "dates": [], "description": "", "_id": "679231579ddf9a5f9c3cab0e"}], "_id": "679231579ddf9a5f9c3cab0c"}, {"name": "穩定拍攝防止振動並且熟悉手機相機", "startDate": "2025-03-09T00:00:00", "endDate": "2025-03-22T00:00:00", "subMilestones": [{"name": "拍攝靜物", "dates": [], "description": "", "_id": "679231579ddf9a5f9c3cab10"}], "_id": "679231579ddf9a5f9c3cab0f"}, {"name": "對焦與主題物突出拍攝", "startDate": "2025-03-23T00:00:00", "endDate": "2025-04-05T00:00:00", "subMilestones": [{"name": "拍攝背景模糊的照片", "dates": [], "description": "", "_id": "679231579ddf9a5f9c3cab12"}, {"name": "拍攝有主次之分的照片", "dates": [], "description": "", "_id": "679232e09ddf9a5f9c3cae01"}], "_id": "679231579ddf9a5f9c3cab11"}, {"name": "人像照片的學習", "startDate": "2025-04-06T00:00:00", "endDate": "2025-04-19T00:00:00", "subMilestones": [{"name": "拍攝自然光下的戶外人像", "dates": [], "description": "", "_id": "679231579ddf9a5f9c3cab14"}], "_id": "679231579ddf9a5f9c3cab13"}, {"name": "動態與小物件的拍攝", "startDate": "2025-04-20T00:00:00", "endDate": "2025-05-03T00:00:00", "subMilestones": [{"name": "拍攝小花朵這類", "dates": [], "description": "", "_id": "679231579ddf9a5f9c3cab16"}, {"name": "拍攝行人或車輛的運動軌跡", "dates": [], "description": "", "_id": "679231579ddf9a5f9c3cab17"}], "_id": "679231579ddf9a5f9c3cab15"}, {"name": "學習夜景拍攝可以定主題進行主題拍攝", "startDate": "2025-05-04T00:00:00", "endDate": "2025-05-17T00:00:00", "subMilestones": [{"name": "拍攝晚上街景或者天空", "dates": [], "description": "", "_id": "679231579ddf9a5f9c3cab19"}], "_id": "679231579ddf9a5f9c3cab18"}, {"name": "創意構圖與倒影", "startDate": "2025-05-18T00:00:00", "endDate": "2025-05-31T00:00:00", "subMilestones": [{"name": "探索獨特的拍攝角度（高角度、低角度等）", "dates": [], "description": "", "_id": "679231579ddf9a5f9c3cab1b"}], "_id": "679231579ddf9a5f9c3cab1a"}, {"name": "照片基礎後期", "startDate": "2025-06-01T00:00:00", "endDate": "2025-06-14T00:00:00", "subMilestones": [], "_id": "679231579ddf9a5f9c3cab1c"}, {"name": "主題系列創作", "startDate": "2025-06-15T00:00:00", "endDate": "2025-06-28T00:00:00", "subMilestones": [{"name": "以五張照片為一主題進行創作", "dates": [], "description": "", "_id": "679231579ddf9a5f9c3cab1e"}], "_id": "679231579ddf9a5f9c3cab1d"}, {"name": "回顧與總結提升", "startDate": "2025-06-29T00:00:00", "endDate": "2025-07-12T00:00:00", "subMilestones": [], "_id": "679231579ddf9a5f9c3cab1f"}]	{"tags": ["藝術創作", "撰寫研究報告"], "description": "我預計設計一個合集裏面放著我的作品，並且做出報告寫出我的心路歷程"}	Complete	Open		{"option": "4人團報價：12000元（一人3000元）", "price": 0, "email": ["christy98191@gmail.com", "taiwansmile@gmail.com", "linyancheng89@gmail.com"], "_id": "679231579ddf9a5f9c3cab20"}	f	t	2025-01-23 12:08:55	2025-01-23 12:15:28	0	\N	2025-01-31 00:00:03.303988	airflow	2025-01-31 00:00:03.304499	airflow
67931b9c9ddf9a5f9c3ce0e5	成為一個可以靈活使用AI的人	2025S1	679316c69ddf9a5f9c3cdd7d	未來在教學上\nAI的使用非常寬廣重要\n所以一定要把它了解清楚	{"tags": ["職涯發展"], "description": "資訊教學時代已經來臨\\n沒有事先了解AI的功能\\n以後很難和學生互動"}	想要先了解AI目前能夠幫忙多少教學科目和內容還有技術	可以活用AI的功能\n應用在教學上	{"tags": ["找學伴共學", "找專家學者", "參與活動或課程"], "description": "想要有人指導帶領我\\n如何進入AI的世界\\n如何操控AI技術\\n達到工作方便效率提高"}	[{"name": "找尋AI的相關資訊", "startDate": "2025-02-09T00:00:00", "endDate": "2025-02-22T00:00:00", "subMilestones": [], "_id": "67931b9c9ddf9a5f9c3ce0e6"}, {"name": "開始閱讀和參與討論", "startDate": "2025-02-23T00:00:00", "endDate": "2025-03-08T00:00:00", "subMilestones": [], "_id": "67931b9c9ddf9a5f9c3ce0e7"}, {"name": "實際操作和觀摩", "startDate": "2025-03-09T00:00:00", "endDate": "2025-03-22T00:00:00", "subMilestones": [], "_id": "67931b9c9ddf9a5f9c3ce0e8"}, {"name": "利用特定議題處理教案1", "startDate": "2025-03-23T00:00:00", "endDate": "2025-04-05T00:00:00", "subMilestones": [], "_id": "67931b9c9ddf9a5f9c3ce0e9"}, {"name": "利用特定議題處理教案2", "startDate": "2025-04-06T00:00:00", "endDate": "2025-04-19T00:00:00", "subMilestones": [], "_id": "67931b9c9ddf9a5f9c3ce0ea"}, {"name": "利用特定議題處理教案3", "startDate": "2025-04-20T00:00:00", "endDate": "2025-05-03T00:00:00", "subMilestones": [], "_id": "67931b9c9ddf9a5f9c3ce0eb"}, {"name": "利用特定議題處理教案4", "startDate": "2025-05-04T00:00:00", "endDate": "2025-05-17T00:00:00", "subMilestones": [], "_id": "67931b9c9ddf9a5f9c3ce0ec"}, {"name": "利用特定議題處理教案5", "startDate": "2025-05-18T00:00:00", "endDate": "2025-05-31T00:00:00", "subMilestones": [], "_id": "67931b9c9ddf9a5f9c3ce0ed"}, {"name": "和專家學者討論分享處理的過程1", "startDate": "2025-06-01T00:00:00", "endDate": "2025-06-14T00:00:00", "subMilestones": [], "_id": "67931b9c9ddf9a5f9c3ce0ee"}, {"name": "和專家學者討論分享處理的過程2", "startDate": "2025-06-15T00:00:00", "endDate": "2025-06-28T00:00:00", "subMilestones": [], "_id": "67931b9c9ddf9a5f9c3ce0ef"}, {"name": "和專家學者討論學習後是否可以再更上一層樓的方向", "startDate": "2025-06-29T00:00:00", "endDate": "2025-07-12T00:00:00", "subMilestones": [], "_id": "67931b9c9ddf9a5f9c3ce0f0"}]	{"tags": ["發起專案或組織"], "description": "學好以後\\n我會免費開一個群組組織\\n來教導學生如何利用AI技術"}	Complete	Open		{"option": "優惠價：8000 元", "price": 0, "email": [], "_id": "67931b9c9ddf9a5f9c3ce0f1"}	t	t	2025-01-24 04:48:28	2025-01-24 04:48:28	0	\N	2025-01-31 00:00:03.303988	airflow	2025-01-31 00:00:03.304499	airflow
6793355a9ddf9a5f9c3ced4d	學習基礎的網頁程式設計技能	2025S1	678a5c596662cd04f9688e5c	我希望學習網頁程式設計，因為我相信程式設計是一種強大的工具，可以用來解決生活中的各種問題。我對於能夠獨立開發一個網站充滿興趣，這不僅能夠提升我的技術能力，還能夠實現我心中的創意和想法。雖然我已經具備了 HTML 和 CSS 的基礎知識，但缺乏實作經驗，因此我希望通過這次學習計畫來鞏固和提升我的技能。\n\n在學習過程中，我希望能夠邊學習技能邊完成課程當中的小專案，這樣可以讓我在實踐中鞏固所學知識，並逐步建立自信。我相信通過這樣的學習方式，能夠更好地理解和應用所學的技術，並最終獨立完成一個完整的專案。\n\n我的學習動機是希望通過學習網頁程式設計，掌握解決實際問題的能力，並能夠獨立完成創意專案，而不僅僅依賴於 AI 生成。我相信這次學習計畫將會是我成長的重要一步，幫助我實現用程式設計改變生活的目標。	{"tags": ["好奇心驅動", "興趣熱情", "自我挑戰", "個人成長"], "description": "想要有可以獨立開發網頁工具，解決問題或實現好玩點子的能力！"}	- HTML 基礎\n- CSS 常用語法\n- 使用 CSS 變更 HTML 標籤特性\n- Flex 網頁排版技巧\n- 相對/絕對定位\n- 切圖技巧\n- 表格與表單設計技巧\n- CSS3 技巧	- 能實作出可以呈現資訊的靜態網頁\n- 如何優化網站效能與外觀	{"tags": ["資料蒐集/研究/分析", "觀看影片"], "description": "我會跟隨線上課程的腳步進行實作，而聽不懂的地方輔以閱讀相關的網路文章解決，並將我的學習歷程寫成 Blog 更新在 Medium （或方格子）上。"}	[{"name": "熟悉編輯器、 HTML 基礎", "startDate": "2025-02-09T00:00:00", "endDate": "2025-02-22T00:00:00", "subMilestones": [], "_id": "6793355a9ddf9a5f9c3ced4e"}, {"name": "CSS 基礎", "startDate": "2025-02-23T00:00:00", "endDate": "2025-03-08T00:00:00", "subMilestones": [], "_id": "6793355a9ddf9a5f9c3ced4f"}, {"name": "使用 CSS 變更 HTML 標籤特性（一）", "startDate": "2025-03-09T00:00:00", "endDate": "2025-03-22T00:00:00", "subMilestones": [], "_id": "6793355a9ddf9a5f9c3ced50"}, {"name": "使用 CSS 變更 HTML 標籤特性（二）", "startDate": "2025-03-23T00:00:00", "endDate": "2025-04-05T00:00:00", "subMilestones": [], "_id": "6793355a9ddf9a5f9c3ced51"}, {"name": "Flex 網頁排版技巧（一）", "startDate": "2025-04-06T00:00:00", "endDate": "2025-04-19T00:00:00", "subMilestones": [], "_id": "6793355a9ddf9a5f9c3ced52"}, {"name": "Flex 網頁排版技巧（二）、Flex 精神時光屋（一）", "startDate": "2025-04-20T00:00:00", "endDate": "2025-05-03T00:00:00", "subMilestones": [], "_id": "6793355a9ddf9a5f9c3ced53"}, {"name": "Flex 精神時光屋（二）", "startDate": "2025-05-04T00:00:00", "endDate": "2025-05-17T00:00:00", "subMilestones": [], "_id": "6793355a9ddf9a5f9c3ced54"}, {"name": "網頁排版技巧 Part 2、切圖技巧（一）", "startDate": "2025-05-18T00:00:00", "endDate": "2025-05-31T00:00:00", "subMilestones": [], "_id": "6793355a9ddf9a5f9c3ced55"}, {"name": "切圖技巧（二）、表格與表單設計技巧（一）", "startDate": "2025-06-01T00:00:00", "endDate": "2025-06-14T00:00:00", "subMilestones": [], "_id": "6793355a9ddf9a5f9c3ced56"}, {"name": "表格與表單設計技巧（二）、CSS3 技巧", "startDate": "2025-06-15T00:00:00", "endDate": "2025-06-28T00:00:00", "subMilestones": [], "_id": "6793355a9ddf9a5f9c3ced57"}, {"name": "進階技巧、實戰講解", "startDate": "2025-06-29T00:00:00", "endDate": "2025-07-12T00:00:00", "subMilestones": [], "_id": "6793355a9ddf9a5f9c3ced58"}]	{"tags": ["架設網站"], "description": "撰寫 Blog 紀錄歷程"}	Complete	Open		{"option": "4人團報價：12000元（一人3000元）", "price": 0, "email": ["eddie8873192@gmail.com", "jiayounikehuzhe@gmail.com", "choumei.bonnie@gmail.com"], "_id": "6793355a9ddf9a5f9c3ced59"}	f	t	2025-01-24 06:38:18	2025-01-24 06:38:18	0	\N	2025-01-31 00:00:03.303988	airflow	2025-01-31 00:00:03.304499	airflow
67935be39ddf9a5f9c3d0727	成為一位影片剪輯師	2025S1	6762bfcce9e593a8f3ef0b62	喜歡表達、有很多靈感\n希望成為全職剪輯師\n業餘時間以影片為媒材：發聲、協助他人發聲、協助他人探索自我認同、用影片帶給閱聽眾體感體驗\n	{"tags": ["興趣熱情", "職涯發展", "社會認可"], "description": "- 擅長且熱衷於發想創意點子，希望剪輯能力可以促進自己具體實踐\\n- 我有滿強的表達慾望，也有源源不絕的想法，雖然沒那麼多自信\\n- 有一些事情想表達，也想協助他人表達\\n　- 想促進社會議題發聲\\n　- 想透過影片協助自己／他人探索自我認同\\n- 想接案維生\\n"}	- 影片剪輯\n- 基礎攝影概念\n- 短影音腳本模組\n- 短影音開頭\n- 讓人有感覺、放鬆的影片\n- 自我認同相關影片\n- 訪談影片	【基本】\n- 成為全職剪輯師\n- 熟悉使用剪映（電腦版）剪輯影片\n- 建立清楚的工作流程\n- 釐清自己的市場定位\n- 釐清未來增能方向\n- 養成實踐的習慣\n- 穩定創作\n\n\n\n【進階】\n- 熟悉使用 Davinci 剪輯影片\n- 熟悉使用 Capcut（手機） 剪輯影片\n- 熟悉使用 Adobe Premiere 剪輯影片	{"tags": ["觀看影片", "資料蒐集/研究/分析"], "description": "目前已蒐集一些教學影片、拍攝一些影片素材，並整理在Airtable上\\n剛開始練習使用剪映剪輯影片\\n已熟悉剪映的介面\\n已在社群媒體上，建立剪輯練習的帳號，未來定期po文，督促自己練習同時測試群眾反應\\n參考喜歡的創作者並學習\\n隨機研究他人的影片，記錄自己的分析觀點，並提出優化建議\\n優化建議加入剪輯練習中"}	[{"name": "基礎練習＋發布社群平台", "startDate": "2025-02-09T00:00:00", "endDate": "2025-02-22T00:00:00", "subMilestones": [{"name": "熟悉手邊的影片素材", "dates": [], "description": "", "_id": "67935be39ddf9a5f9c3d0729"}, {"name": "上字幕", "dates": [], "description": "", "_id": "67935be39ddf9a5f9c3d072a"}, {"name": "上字卡", "dates": [], "description": "", "_id": "67935be39ddf9a5f9c3d072b"}, {"name": "調色調光", "dates": [], "description": "", "_id": "67935be39ddf9a5f9c3d072c"}, {"name": "上特效", "dates": [], "description": "", "_id": "67935be39ddf9a5f9c3d072d"}, {"name": "剪輯成短影音", "dates": [], "description": "", "_id": "67935be39ddf9a5f9c3d072e"}, {"name": "發布社群平台", "dates": [], "description": "", "_id": "67935be39ddf9a5f9c3d072f"}], "_id": "67935be39ddf9a5f9c3d0728"}, {"name": "基礎練習＋發佈，嘗試接案 or 投履歷", "startDate": "2025-02-23T00:00:00", "endDate": "2025-03-08T00:00:00", "subMilestones": [], "_id": "67935be39ddf9a5f9c3d0730"}, {"name": "基礎練習＋發佈，嘗試接案 or 投履歷", "startDate": "2025-03-09T00:00:00", "endDate": "2025-03-22T00:00:00", "subMilestones": [], "_id": "67935be39ddf9a5f9c3d0731"}, {"name": "基礎練習＋發佈，嘗試接案 or 投履歷", "startDate": "2025-03-23T00:00:00", "endDate": "2025-04-05T00:00:00", "subMilestones": [], "_id": "67935be39ddf9a5f9c3d0732"}, {"name": "進階練習＋發佈，嘗試接案 or 投履歷，建立清楚的工作流程", "startDate": "2025-04-06T00:00:00", "endDate": "2025-04-19T00:00:00", "subMilestones": [], "_id": "67935be39ddf9a5f9c3d0733"}, {"name": "進階練習＋發佈，嘗試接案 or 投履歷，建立清楚的工作流程", "startDate": "2025-04-20T00:00:00", "endDate": "2025-05-03T00:00:00", "subMilestones": [], "_id": "67935be39ddf9a5f9c3d0734"}, {"name": "進階練習＋發佈，嘗試接案 or 投履歷，釐清自己的市場定位", "startDate": "2025-05-04T00:00:00", "endDate": "2025-05-17T00:00:00", "subMilestones": [], "_id": "67935be39ddf9a5f9c3d0735"}, {"name": "進階練習＋發佈，嘗試接案 or 投履歷，釐清自己的市場定位", "startDate": "2025-05-18T00:00:00", "endDate": "2025-05-31T00:00:00", "subMilestones": [], "_id": "67935be39ddf9a5f9c3d0736"}, {"name": "進階練習＋發佈，嘗試接案 or 投履歷，釐清未來增能方向", "startDate": "2025-06-01T00:00:00", "endDate": "2025-06-14T00:00:00", "subMilestones": [], "_id": "67935be39ddf9a5f9c3d0737"}, {"name": "進階練習＋發佈，嘗試接案 or 投履歷，釐清未來增能方向", "startDate": "2025-06-15T00:00:00", "endDate": "2025-06-28T00:00:00", "subMilestones": [], "_id": "67935be39ddf9a5f9c3d0738"}, {"name": "進階練習＋發佈，嘗試接案 or 投履歷，釐清未來增能方向", "startDate": "2025-06-29T00:00:00", "endDate": "2025-07-12T00:00:00", "subMilestones": [], "_id": "67935be39ddf9a5f9c3d0739"}]	{"tags": ["經營社群媒體"], "description": "Youtube頻道、Instagram、Threads"}	Complete	Open		{"option": "4人團報價：12000元（一人3000元）", "price": 0, "email": ["1/23有填寫【想找人團報】", "希望能報名此項目", "等主辦的消息，感謝💕"], "_id": "67935be39ddf9a5f9c3d073a"}	f	t	2025-01-24 09:22:43	2025-01-24 09:22:43	0	\N	2025-01-31 00:00:03.303988	airflow	2025-01-31 00:00:03.304499	airflow
67939ec39ddf9a5f9c3d4fe4	從喝茶興趣到尋找本土認同；連結歷史文化	2025S1	6784ea3c6662cd04f9685160	為什麼想做：\n我在生活中主動去體驗茶與咖啡，依靠的是很純粹的內在動力，常常自己沖泡茶葉，但除了自己體驗本身，還想要與更多人交流，分享這份文化，而且我注意到參與這個圈子的人有越來越少的趨勢......茶雖然以手搖飲等形式進入青年市場，但背後的歷史與文化卻逐漸被淡化。我想要去深入理解茶文化的變遷與現況，並思考如何吸引更多同齡人參與，將這項文化重新融入現代生活。\n\n想要做到什麼：\n1.知識面\n- 了解台灣茶文化的歷史與發展脈絡，例如民初家家戶戶飲茶的習俗如何消退。\n- 認識茶葉產業的現況，包括茶農的工作模式與消費市場的轉變。\n- 探討圈外人對茶文化的印象與看法。\n先理解現況，再來才去找有沒有什麼我能幫上忙的。\n\n2.感官體驗－飲用更多茶和咖啡，豐富感官的敏銳度......也要記得興趣的初衷是體會到有趣的感官經驗\n\n3. 穩定的輸出\n- 建立文字或視覺紀錄，用於分享學習過程與成果。\n	{"tags": ["個人成長", "探索可能性", "自我挑戰", "影響社會"], "description": "幾年前因為家中有喝茶的長輩，而開啟學喝茶的契機，默默自學了幾年。但只有自己一個人的時候，學習的頻率就會很隨性，如果能有一群人交流，應該能獲得很多刺激，也能滿足分享給他人，獲得回饋的願望。\\n\\n能持續在品茶與咖啡中獲得動力，是因為我享受嚐到不同滋味的過程，喜歡運用感官的觀察，而且最近發現越來越能命中味道，比如說聞出三峽碧螺春當中的綠豆味；聞出咖啡豆還有一些別人沒發現的莓果甜香，交出答案後，得到別人（茶商/咖啡師）肯定的回覆說「你講的沒錯，正是這個味道😌」，我就知道又是一輪新的探索動力\\n\\n另外就是，我希望自己可以做到穩定的輸出，或是主動創造一個必須輸出的機會。輸出通常能讓我練習更好的將想法傳遞出去，也可以說是為了更好的鍛鍊學習，所以啟動學習計劃。\\n\\n"}	台灣茶文化與歷史：\n閱讀相關書籍，市面上有許多製茶或發展的歷史書或漫畫\n查閱學術文章或網絡資源，或者訪問一些老前輩、茶莊，了解茶文化在不同時期的變遷與社會習俗\n\n感官辨識與品茶技巧：\n練習聞香、品味，學習記錄茶葉與咖啡的風味特徵。多去認識不同的材料，從茶跨到咖啡與香水的領域，多方面的認識氣味\n\n紀錄、推廣與社群交流：\n要學會紀錄的，調整自己輸出內容的節奏，也許會先寫出自己看的版本，才去設想要如何讓別人看得懂	希望能將茶的文化分享給其他人\n\n- 增進感官體驗的資料庫，多看多喝多聞。並記錄味覺的感受\n- 想要進到茶園去訪問工作者、觀察他們的工作模式\n- 整理出方便閱讀的圖文格式，能將這些檔案分享給有興趣的人	{"tags": ["資料蒐集/研究/分析", "參與社群", "參與活動或課程", "田野調查", "訪談"], "description": "資料蒐集：先吸收網路上能找到的內容，包括已經追蹤的茶飲自媒體，相關的產業工作者，或是較為正式的論文資料和文章，都是吸收知識的好材料\\n\\n參與社群/活動或課程：已經準備參加一些手沖咖啡聚會，可以多認識人，和在短時間接觸許多不同風味的咖啡\\n\\n田野調查：主要是想走入茶園的部分，透過直接接觸的方法，觀看他們工作的模式，還有問產業當中的人，在現代遇到的情況"}	[{"name": "重新建立習慣", "startDate": "2025-02-09T00:00:00", "endDate": "2025-02-22T00:00:00", "subMilestones": [{"name": "紀錄已經有的茶葉和咖啡豆，用Notion做收藏庫", "dates": [], "description": "", "_id": "6793b8eb9ddf9a5f9c3d964f"}], "_id": "67939ec39ddf9a5f9c3d4fe5"}, {"name": "釐清目標", "startDate": "2025-02-23T00:00:00", "endDate": "2025-03-08T00:00:00", "subMilestones": [{"name": "明白我到底想改變什麼現況", "dates": [], "description": "", "_id": "6793b8eb9ddf9a5f9c3d9651"}], "_id": "67939ec39ddf9a5f9c3d4fe6"}, {"name": "有固定頻率的在品味茶與咖啡，並製作心得", "startDate": "2025-03-09T00:00:00", "endDate": "2025-03-22T00:00:00", "subMilestones": [], "_id": "67939ec39ddf9a5f9c3d4fe7"}, {"name": "頻繁接觸相關的活動，認識人也讓別人認識自己", "startDate": "2025-03-23T00:00:00", "endDate": "2025-04-05T00:00:00", "subMilestones": [], "_id": "67939ec39ddf9a5f9c3d4fe8"}, {"name": "準備實地探索與田野調查", "startDate": "2025-04-06T00:00:00", "endDate": "2025-04-19T00:00:00", "subMilestones": [], "_id": "67939ec39ddf9a5f9c3d4fe9"}, {"name": "和已經認識的人聯絡，計劃如何到他們的工作環境觀察", "startDate": "2025-04-20T00:00:00", "endDate": "2025-05-03T00:00:00", "subMilestones": [], "_id": "67939ec39ddf9a5f9c3d4fea"}, {"name": "留在田野當中訪問，與人互動", "startDate": "2025-05-04T00:00:00", "endDate": "2025-05-17T00:00:00", "subMilestones": [], "_id": "67939ec39ddf9a5f9c3d4feb"}, {"name": "整理收集到的資料", "startDate": "2025-05-18T00:00:00", "endDate": "2025-05-31T00:00:00", "subMilestones": [], "_id": "67939ec39ddf9a5f9c3d4fec"}, {"name": "準備成果的展示", "startDate": "2025-06-01T00:00:00", "endDate": "2025-06-14T00:00:00", "subMilestones": [], "_id": "67939ec39ddf9a5f9c3d4fed"}, {"name": "成果分享", "startDate": "2025-06-15T00:00:00", "endDate": "2025-06-28T00:00:00", "subMilestones": [], "_id": "67939ec39ddf9a5f9c3d4fee"}, {"name": "紀錄整份馬拉松的學習過程與反思", "startDate": "2025-06-29T00:00:00", "endDate": "2025-07-12T00:00:00", "subMilestones": [], "_id": "67939ec39ddf9a5f9c3d4fef"}]	{"tags": ["舉辦活動", "藝術創作"], "description": "首先我一定會有幾份中途留下來的品嚐心得，可以寫出不同主題的文章。再來也可以舉辦一些茶會，大家帶喜歡的茶葉一同聚在一起分享\\n\\n藝術創作我有點猶豫能力方面的條件，但如果我能把產業工作者，工作時的樣貌，用鉛筆速寫記錄下來，似乎也有點有趣......"}	Complete	Open		{"option": "4人團報價：12000元（一人3000元）", "price": 0, "email": ["dd20071211@gmail.com", "xuezhiqian759@gmail.com", "justin387130618@gmail.com"], "_id": "67939ec39ddf9a5f9c3d4ff0"}	f	t	2025-01-24 14:08:03	2025-01-24 15:59:39	0	\N	2025-01-31 00:00:03.303988	airflow	2025-01-31 00:00:03.304499	airflow
6793ae129ddf9a5f9c3d6ccb	發展並多了解輔導諮商相關工作(輔導員 實驗教育輔導老師 協助人員等)	2025S1	678d3b563b18d82b6896d9d4	對於輔導諮商有興趣想了解及發展。\n想藉由夥伴交流、書籍、講座等等更了解輔導工作更詳細知識，看到更多的發展道路。\n在最後成果時可以用簡報分析、實際體驗、QA問答方式進行呈現分享。\n	{"tags": ["好奇心驅動", "興趣熱情", "自我挑戰", "個人成長", "職涯發展", "探索可能性", "應對未來", "創新發展"], "description": "過往我常常擔任學姊或姐姐的角色，會不自覺想要照顧學弟妹或是年齡小的人，也因此發現在進行這些過程中，我發現我對於傾訴聆聽，關心當事人並同理他們，以及想要幫助他們的心情都會讓我很開心和幸福！雖然過程很累很辛苦，但是是願意為了對方而承受的累，以及學習更多！"}	1.在與夥伴或引導師交流時，多提出好奇的問題。\n2.鑽研心理學、諮商的書籍，了解更多面向。\n3.練習諮商輔導技巧，或是從講座中得到收穫。	1.有更多諮商輔導的資源、人脈。\n2.對於這塊有更廣闊的視野，因為現在對於諮商輔導工作還維持在一定的理解範圍，還有太多我不懂的事物。\n3.實際練習。(但是可能有點緊張	{"tags": ["資料蒐集/研究/分析", "書籍閱讀", "觀看影片", "參與活動或課程", "場域實習", "聽Podcast"], "description": "1.資料收集：從影片、文章、實際案例等統整分析結論\\n2.書籍閱讀：從心理學、諮商等西相關書籍獲得知識和實用技巧。(不一定要單純文字的那種書籍，可以是日常生活化或漫畫等呈現方式的書去做閱讀)\\n3.觀看影片：看youtube相關影片，聽聽其他人的想法與經歷，從中吸收到不同知識，有參考的方向。\\n4.參與活動或課程：往外探索看有沒有合適的活動可以進行參與。或是可以和島島阿學的夥伴進行討論分享，實際體驗諮商技巧。\\n5.場域實習：如果有機會及緣分，願意並且想到相關地方進行實習與踏查。\\n6.podcast：尋找並聆聽喜歡或是好奇的內容，訓練抓重點外，也可以尋找有沒有諮商對話的練習過程。\\n\\n可以用樹狀圖、心智圖、限動、ppt等方式做學習紀錄。"}	[{"name": "了解心理學、諮商輔導這條路會遇到的事情、困境困難，與優勢劣勢，從事這份工作的人的心得感想。並記錄下來。", "startDate": "2025-02-09T00:00:00", "endDate": "2025-02-22T00:00:00", "subMilestones": [], "_id": "6793ae129ddf9a5f9c3d6ccc"}, {"name": "1.心理學相關影片收集及了解觀看，並記錄存取有興趣或是想分享的諮商輔導相關知識。2.了解相關大學管道。", "startDate": "2025-02-23T00:00:00", "endDate": "2025-03-08T00:00:00", "subMilestones": [], "_id": "6793ae129ddf9a5f9c3d6ccd"}, {"name": "空大心理學教科書閱讀。(初步了解大)(對閱讀不擅長，需長時間適應)", "startDate": "2025-03-09T00:00:00", "endDate": "2025-03-22T00:00:00", "subMilestones": [], "_id": "6793ae129ddf9a5f9c3d6cce"}, {"name": "心理學、諮商輔導相關書籍閱讀並抓起重點和實用的技巧。(不是教科書，是for日常生活化、漫畫", "startDate": "2025-03-23T00:00:00", "endDate": "2025-04-05T00:00:00", "subMilestones": [], "_id": "6793ae129ddf9a5f9c3d6ccf"}, {"name": "空大心理學相關書籍延伸學習(剛好空大考試週，運用筆記、心智圖讓自己更清晰並且知道如何運用", "startDate": "2025-04-06T00:00:00", "endDate": "2025-04-19T00:00:00", "subMilestones": [], "_id": "6793ae129ddf9a5f9c3d6cd0"}, {"name": "尋找相關講座，與夥伴交流實際操作。(可能會變", "startDate": "2025-04-20T00:00:00", "endDate": "2025-05-03T00:00:00", "subMilestones": [], "_id": "6793ae129ddf9a5f9c3d6cd1"}, {"name": "閱讀心靈雞湯、各種生活議題等生活化書籍，並寫出心得。", "startDate": "2025-05-04T00:00:00", "endDate": "2025-05-17T00:00:00", "subMilestones": [], "_id": "6793ae129ddf9a5f9c3d6cd2"}, {"name": "從podcast中尋找喜歡的內容，並且找到有練習輔導諮商對話，說話的藝術等等內容並記錄或開口練習。", "startDate": "2025-05-18T00:00:00", "endDate": "2025-05-31T00:00:00", "subMilestones": [], "_id": "6793ae129ddf9a5f9c3d6cd3"}, {"name": "如果可以的話，希望有機會可以進行相關實習。(不一定這週", "startDate": "2025-06-01T00:00:00", "endDate": "2025-06-14T00:00:00", "subMilestones": [], "_id": "6793ae129ddf9a5f9c3d6cd4"}, {"name": "在展賦上班或一對一輔導時，適時與學生對話聊天並觀察其中的行為與言語，並瞭解他們在想什麼，從中得到一點點的經驗。(不一定是這週，可能每週時不時都會發生", "startDate": "2025-06-15T00:00:00", "endDate": "2025-06-28T00:00:00", "subMilestones": [], "_id": "6793ae129ddf9a5f9c3d6cd5"}, {"name": "準備成果發表，利用簡報或是實際練習體驗呈現分享。", "startDate": "2025-06-29T00:00:00", "endDate": "2025-07-12T00:00:00", "subMilestones": [], "_id": "6793ae129ddf9a5f9c3d6cd6"}]	{"tags": ["撰寫研究報告"], "description": "統整每週學習的內容並寫心得，QA回答分享。"}	Complete	Open		{"option": "4人團報價：12000元（一人3000元）", "price": 0, "email": ["linyancheng89@gmail.com", "taiwansmile@gmail.com", "zhouyuting08620@gmail.com"], "_id": "6793ae129ddf9a5f9c3d6cd7"}	f	t	2025-01-24 15:13:22	2025-01-24 15:58:45	0	\N	2025-01-31 00:00:03.303988	airflow	2025-01-31 00:00:03.304499	airflow
6793b5c69ddf9a5f9c3d7e58	成為一名音樂創作者&歌手	2025S1	6760492ac58563e57e7e7fd7	我的夢想是能夠創作出音樂和獨特的聲音，讓大家聽見並喜歡，能夠讓我的音樂陪伴在大家的日常生活中。未來希望能夠往這方面發展。\n我的目標是發1首完整的歌和1首翻唱，預計先從學習編曲、開始嘗試製作音樂做起，還有精進自己的吉他能力以協助編曲。	{"tags": ["自我挑戰", "興趣熱情", "好奇心驅動", "個人成長", "職涯發展", "探索可能性", "受事件啟發"], "description": "從國二開始我嘗試唱歌，某一天錄翻唱給同學聽的時候她大為驚艷，她告訴我我的歌聲很好聽，那是我第一次被人有那麼深的鼓勵和相信，漸漸地，我愛上了唱歌，我每一天放學後都在練習唱歌。\\n那時候我很喜歡9m88，深受她的風格和她喜歡的音樂影響，是我的音樂和美學啟蒙，更讓我認識到台灣獨立音樂的世界，徹底打開我對台灣音樂的視野和想像。\\n國三因為我對生活迷茫又備考壓力大，開始找尋心靈上的意義，因此我喜歡上了安溥、鄭宜農這類型的創作歌手，是他們讓我認識文學是如何體現在歌詞中，如何在歌詞中表達想法。我時常把我的想法寄託在那些文字裡。\\n我開始喜歡很多不同音樂的曲風，爵士、實驗、HIP HOP、R&B、數字搖滾......\\n"}	樂理基礎：學習和弦進行（如常見的流行和弦走向）、音階（如大調、小調），理解它們如何影響音樂氛圍。\n編曲技巧：學會如何安排主歌、副歌與過門的結構，讓音樂聽起來更完整。\nBandLab 操作：熟悉基本功能，如鍵盤模擬、節奏製作、音效混音等。\n音樂實驗：嘗試設計自己喜歡的音色或混合不同的風格，提升創意表現力。	1.學會使用 BandLab 進行音樂創作，完成自己的第一首完整音樂作品和翻唱作品。\n2.理解基礎樂理，能應用在創作和編曲中。\n3.建立定期創作的習慣，培養對音樂製作的耐心與專注力。\n4.精進自己的吉他彈奏能力。	{"tags": ["書籍閱讀", "找學伴共學", "找專家學者", "參與活動或課程"], "description": "每兩週完成一小段音樂作品（30 秒至 1 分鐘），並記錄創作過程。\\n嘗試用 BandLab 的鍵盤功能編曲，並將樂理應用到實作中。\\n\\n\\n參加音樂課程（如吉他課或樂理課）補充知識。\\n利用 YouTube 和線上教學影片學習 BandLab 的進階操作與編曲技巧。\\n\\n用筆記或部落格記錄學習心得與作品完成過程。\\n定期聽其他創作者的作品，分析他們的結構與特色，並寫下心得。\\n\\n將完成的作品分享給朋友或同好，蒐集意見並改善下一次的創作。"}	[{"name": "準備期 - 基礎強化與翻唱規劃", "startDate": "2025-02-09T00:00:00", "endDate": "2025-02-22T00:00:00", "subMilestones": [{"name": "初步學習混音概念，了解如何讓音軌層次分明。", "dates": [], "description": "", "_id": "6793b5c69ddf9a5f9c3d7e5a"}, {"name": "掌握翻唱《月亮惹的禍》所需的基本技能，熟悉和弦與節奏。", "dates": [], "description": "", "_id": "6793b5c69ddf9a5f9c3d7e5b"}, {"name": "找到《月亮惹的禍》的和弦與節奏結構，用吉他練習基礎伴奏。", "dates": [{"$date": "2024-01-01T00:00:00"}, {"$date": "2024-01-02T00:00:00"}], "description": "", "_id": "6793b5c69ddf9a5f9c3d7e5c"}, {"name": "使用 BandLab 錄下吉他伴奏，並嘗試錄製人聲。", "dates": [{"$date": "2024-01-02T00:00:00"}, {"$date": "2024-01-03T00:00:00"}], "description": "", "_id": "6793b5c69ddf9a5f9c3d7e5d"}, {"name": "觀看 EQ 和聲音分離的基礎教學，學會調整吉他和人聲的頻率避免衝突。", "dates": [{"$date": "2024-01-03T00:00:00"}, {"$date": "2024-01-04T00:00:00"}], "description": "", "_id": "6793b5c69ddf9a5f9c3d7e5e"}, {"name": "確定歌曲中的分段安排（主歌、副歌、和聲）及要模仿的效果。", "dates": [], "description": "", "_id": "6793b5c69ddf9a5f9c3d7e5f"}], "_id": "6793b5c69ddf9a5f9c3d7e59"}, {"name": "吉他精進與人聲錄製實驗", "startDate": "2025-02-23T00:00:00", "endDate": "2025-03-08T00:00:00", "subMilestones": [{"name": "使用 BandLab 完成吉他的分段錄製，並嘗試使用點擊音（Click Track）保持穩定節奏。", "dates": [], "description": "", "_id": "6793b5c69ddf9a5f9c3d7e61"}, {"name": "嘗試錄製主旋律，初步感受音準和情感表達。", "dates": [], "description": "", "_id": "6793b5c69ddf9a5f9c3d7e62"}, {"name": "分析歌曲中的和聲設計，用 BandLab 嘗試錄下多聲部。", "dates": [], "description": "", "_id": "6793b5c69ddf9a5f9c3d7e63"}], "_id": "6793b5c69ddf9a5f9c3d7e60"}, {"name": "深入混音技巧與歌曲細化:強化混音技巧、完成翻唱初版", "startDate": "2025-03-09T00:00:00", "endDate": "2025-03-22T00:00:00", "subMilestones": [{"name": "調整吉他的 EQ，減少低頻雜音，突出中頻清晰度。 為人聲加入適量混響（Reverb）與壓縮器（Compressor），提升聽感。", "dates": [], "description": "", "_id": "6793b5c69ddf9a5f9c3d7e65"}, {"name": "加強和聲的混音處理，讓它與主旋律和諧融合。", "dates": [], "description": "", "_id": "6793b5c69ddf9a5f9c3d7e66"}, {"name": "進一步調整歌曲結構與段落，完成歌曲的整體混音。", "dates": [], "description": "", "_id": "6793b5c69ddf9a5f9c3d7e67"}], "_id": "6793b5c69ddf9a5f9c3d7e64"}, {"name": "和弦進階與編曲結構", "startDate": "2025-03-23T00:00:00", "endDate": "2025-04-05T00:00:00", "subMilestones": [{"name": "學習進階和弦： 研究 7 和弦與 9 和弦的理論", "dates": [], "description": "", "_id": "6793b5c69ddf9a5f9c3d7e69"}, {"name": "用吉他實驗不同和弦進行，將其應用到 BandLab", "dates": [], "description": "", "_id": "6793b5c69ddf9a5f9c3d7e6a"}, {"name": "將創作分為主歌（Verse）、副歌（Chorus）、過門（Bridge）。", "dates": [], "description": "", "_id": "6793b5c69ddf9a5f9c3d7e6b"}, {"name": "每段設計不同和弦進行，並保持旋律統一性。", "dates": [], "description": "", "_id": "6793b5c69ddf9a5f9c3d7e6c"}, {"name": "完成短作品： 將旋律、和弦與節奏結合，創作一首 1 分鐘長的作品", "dates": [], "description": "", "_id": "6793b5c69ddf9a5f9c3d7e6d"}], "_id": "6793b5c69ddf9a5f9c3d7e68"}, {"name": "加入音色與背景細節", "startDate": "2025-04-06T00:00:00", "endDate": "2025-04-19T00:00:00", "subMilestones": [{"name": "學習基本混響（Reverb）與延遲（Delay）的使用。", "dates": [], "description": "", "_id": "6793b5c69ddf9a5f9c3d7e6f"}, {"name": "用 BandLab 合成器插件創建空靈或特殊音效。", "dates": [], "description": "", "_id": "6793b5c69ddf9a5f9c3d7e70"}, {"name": "嘗試加入背景細節（如環境聲、Pad）。", "dates": [], "description": "", "_id": "6793b5c69ddf9a5f9c3d7e71"}, {"name": "完成短編曲： 編寫一段氛圍感突出的音樂，加入細節音色與效果器。", "dates": [], "description": "", "_id": "6793b5c69ddf9a5f9c3d7e72"}], "_id": "6793b5c69ddf9a5f9c3d7e6e"}, {"name": "影片製作準備與初步剪輯", "startDate": "2025-04-20T00:00:00", "endDate": "2025-05-03T00:00:00", "subMilestones": [{"name": "用手機拍攝MV畫面，準備影像素材。", "dates": [], "description": "", "_id": "6793b5c69ddf9a5f9c3d7e74"}, {"name": "準備拍攝畫面草稿", "dates": [], "description": "", "_id": "6793b5c69ddf9a5f9c3d7e75"}, {"name": "拍攝MV。", "dates": [], "description": "", "_id": "6793b5c69ddf9a5f9c3d7e76"}], "_id": "6793b5c69ddf9a5f9c3d7e73"}, {"name": "風格挑戰與多層次編曲:翻唱竇靖童的一首歌，挑戰新風格編曲。", "startDate": "2025-05-04T00:00:00", "endDate": "2025-05-17T00:00:00", "subMilestones": [{"name": "分析原曲的和弦進行與背景設計。", "dates": [], "description": "", "_id": "6793b5c69ddf9a5f9c3d7e78"}, {"name": "用合成器製作出類似的氛圍感。", "dates": [], "description": "", "_id": "6793b5c69ddf9a5f9c3d7e79"}, {"name": "設計旋律與和弦，嘗試創作一首風格化作品。", "dates": [], "description": "", "_id": "6793b5c69ddf9a5f9c3d7e7a"}], "_id": "6793b5c69ddf9a5f9c3d7e77"}, {"name": "隨後期計畫調整。", "startDate": "2025-05-18T00:00:00", "endDate": "2025-05-31T00:00:00", "subMilestones": [], "_id": "6793b5c69ddf9a5f9c3d7e7b"}, {"name": "隨後期計畫調整。", "startDate": "2025-06-01T00:00:00", "endDate": "2025-06-14T00:00:00", "subMilestones": [], "_id": "6793b5c69ddf9a5f9c3d7e7c"}, {"name": "隨後期計畫調整。", "startDate": "2025-06-15T00:00:00", "endDate": "2025-06-28T00:00:00", "subMilestones": [], "_id": "6793b5c69ddf9a5f9c3d7e7d"}, {"name": "隨後期計畫調整。", "startDate": "2025-06-29T00:00:00", "endDate": "2025-07-12T00:00:00", "subMilestones": [], "_id": "6793b5c69ddf9a5f9c3d7e7e"}]	{"tags": ["藝術創作", "經營社群媒體", "拍影片"], "description": "我會在BANDLAB和STREET VOICE發佈翻唱作品和編曲的成果，還有用MV影像呈現自己的翻唱。"}	Complete	Open		{"option": "4人團報價：12000元（一人3000元）", "price": 0, "email": ["ctc.chang0514@gmail.com", "a0912358866@gmail.com", "the.oc1122@gmail.com"], "_id": "6793b5c69ddf9a5f9c3d7e7f"}	t	t	2025-01-24 15:46:14	2025-01-24 15:46:14	0	\N	2025-01-31 00:00:03.303988	airflow	2025-01-31 00:00:03.304499	airflow
679688ee9ddf9a5f9c3e4a06	成為具備外語導覽能力的專業導覽者。	2025S1	6793ae729ddf9a5f9c3d6ce4	熱衷於導覽，喜歡聽別人導覽，也熱愛帶導覽。希望藉由此計畫，使自己成為多語言、多領域的專業導覽者。預計訪談前輩，學習導覽技巧，並透過此計畫，建立一場自己設計的導覽行程，並至少有實際執行一次的經驗。	{"tags": ["個人成長", "興趣熱情"], "description": "我的導覽領域，目前集中於藝文領域，曾參加地方文史導覽甄選卻落選，因此希望藉由學習計畫，提升個人不同領域導覽能力，並運用自己外語專長，培養外語導覽能力。"}	1. 分析自己落選地方文史導覽的原因。\n2. 練習英語口說。\n3. 擇定主題，規劃一場導覽旅程。	1. 找出自己在導覽上，能夠更進步之處。\n2. 建立外語導覽能力。\n3. 培養獨立規劃導覽旅程能力。	{"tags": ["資料蒐集/研究/分析", "書籍閱讀", "發起行動", "找專家學者", "田野調查", "訪談", "觀看影片", "參與社群", "找學伴共學"], "description": "1. 訪談當初甄選時之競爭者，分析自己當初落選原因。\\n2. 訪談導覽前輩，提升導覽技巧。\\n3. 透過AI工具、線上工具，練習英語口說。\\n4. 了解我國英語導遊資格考試，並閱讀有關準備書籍。\\n4. 選定一地進行文史研究，並建立導覽主題。"}	[{"name": "提升導覽能力PART1-分析落選原因", "startDate": "2025-02-09T00:00:00", "endDate": "2025-02-22T00:00:00", "subMilestones": [{"name": "自行回顧甄選歷程", "dates": [{"$date": "2024-01-01T00:00:00"}], "description": "", "_id": "679688ee9ddf9a5f9c3e4a08"}, {"name": "訪談當初甄選時之競爭者", "dates": [{"$date": "2024-01-03T00:00:00"}], "description": "", "_id": "679688ee9ddf9a5f9c3e4a09"}], "_id": "679688ee9ddf9a5f9c3e4a07"}, {"name": "提升導覽能力PART2-文獻閱讀", "startDate": "2025-02-23T00:00:00", "endDate": "2025-03-08T00:00:00", "subMilestones": [{"name": "Alison Grinder & E. Sue Macoy著，閻蕙群譯（2006）《如何培養優秀的導覽員》五觀出版社。", "dates": [{"$date": "2024-01-01T00:00:00"}], "description": "", "_id": "679688ee9ddf9a5f9c3e4a0b"}, {"name": "閻鈺臻（2015.3）〈雖然我不認識你但是我謝謝你—談博物館導覽工作〉，《檔案半年刊》14卷1期。", "dates": [{"$date": "2024-01-05T00:00:00"}], "description": "", "_id": "679688ee9ddf9a5f9c3e4a0c"}], "_id": "679688ee9ddf9a5f9c3e4a0a"}, {"name": "提升導覽能力PART3-針對現狀改善", "startDate": "2025-03-09T00:00:00", "endDate": "2025-03-22T00:00:00", "subMilestones": [{"name": "訪談自己擔任導覽員的單位前輩", "dates": [{"$date": "2024-01-01T00:00:00"}], "description": "", "_id": "679688ee9ddf9a5f9c3e4a0e"}, {"name": "訪談自己擔任導覽員時的聽眾", "dates": [], "description": "", "_id": "679688ee9ddf9a5f9c3e4a0f"}], "_id": "679688ee9ddf9a5f9c3e4a0d"}, {"name": "提升導覽能力PART4-綜合回顧", "startDate": "2025-03-23T00:00:00", "endDate": "2025-04-05T00:00:00", "subMilestones": [{"name": "整理前三階段資料", "dates": [{"$date": "2024-01-01T00:00:00"}], "description": "", "_id": "679688ee9ddf9a5f9c3e4a11"}, {"name": "認識交通部觀光署114年導遊人員及領隊人員評量", "dates": [], "description": "", "_id": "679688ee9ddf9a5f9c3e4a12"}], "_id": "679688ee9ddf9a5f9c3e4a10"}, {"name": "英語口說能力提升PART1-長篇幅口說練習", "startDate": "2025-04-06T00:00:00", "endDate": "2025-04-19T00:00:00", "subMilestones": [{"name": "觀看台灣英語導覽、導遊影片，並自行口述練習", "dates": [{"$date": "2024-01-01T00:00:00"}], "description": "", "_id": "679688ee9ddf9a5f9c3e4a14"}, {"name": "針對生活子題，例如地點、個人故事，每子題進行10-15分鐘之英語介紹", "dates": [], "description": "", "_id": "679688ee9ddf9a5f9c3e4a15"}], "_id": "679688ee9ddf9a5f9c3e4a13"}, {"name": "英語口說能力提升PART2-自家介紹練習", "startDate": "2025-04-20T00:00:00", "endDate": "2025-05-03T00:00:00", "subMilestones": [{"name": "觀看台灣英語導覽、導遊影片，並自行口述練習。", "dates": [{"$date": "2024-01-01T00:00:00"}], "description": "", "_id": "679688ee9ddf9a5f9c3e4a17"}, {"name": "針對自家附近，進行40-60分鐘之英語介紹。", "dates": [], "description": "", "_id": "679688ee9ddf9a5f9c3e4a18"}], "_id": "679688ee9ddf9a5f9c3e4a16"}, {"name": "導覽旅程設計PART1-擇定主題", "startDate": "2025-05-04T00:00:00", "endDate": "2025-05-17T00:00:00", "subMilestones": [{"name": "訪談島內散步公司，了解如何設計導覽旅程。", "dates": [{"$date": "2024-01-01T00:00:00"}], "description": "", "_id": "679688ee9ddf9a5f9c3e4a1a"}, {"name": "主題設定以地方文史為中心，地區限定於北北基。", "dates": [], "description": "", "_id": "679688ee9ddf9a5f9c3e4a1b"}], "_id": "679688ee9ddf9a5f9c3e4a19"}, {"name": "導覽旅程設計PART2-建立導覽敘事", "startDate": "2025-05-18T00:00:00", "endDate": "2025-05-31T00:00:00", "subMilestones": [{"name": "文獻閱讀，建立導覽主題及敘事。", "dates": [{"$date": "2024-01-01T00:00:00"}], "description": "", "_id": "679688ee9ddf9a5f9c3e4a1d"}, {"name": "如有必要，訪談當地耆老及文史工作者。", "dates": [], "description": "", "_id": "679688ee9ddf9a5f9c3e4a1e"}], "_id": "679688ee9ddf9a5f9c3e4a1c"}, {"name": "導覽旅程設計PART3-路線設計", "startDate": "2025-06-01T00:00:00", "endDate": "2025-06-14T00:00:00", "subMilestones": [{"name": "透過Google Map，初步進行路線規劃及設計。", "dates": [{"$date": "2024-01-01T00:00:00"}], "description": "", "_id": "679688ee9ddf9a5f9c3e4a20"}, {"name": "實地踏查、尋找雨備。", "dates": [{"$date": "2024-01-03T00:00:00"}], "description": "", "_id": "679688ee9ddf9a5f9c3e4a21"}, {"name": "如會影響店家營業、民居，事先聯繫。", "dates": [], "description": "", "_id": "679688ee9ddf9a5f9c3e4a22"}], "_id": "679688ee9ddf9a5f9c3e4a1f"}, {"name": "導覽旅程設計PART4-上線前試驗", "startDate": "2025-06-15T00:00:00", "endDate": "2025-06-28T00:00:00", "subMilestones": [{"name": "準備好中英語導覽稿", "dates": [{"$date": "2024-01-01T00:00:00"}], "description": "", "_id": "679688ee9ddf9a5f9c3e4a24"}, {"name": "招募受試者，並取得反饋。", "dates": [{"$date": "2024-01-03T00:00:00"}], "description": "", "_id": "679688ee9ddf9a5f9c3e4a25"}, {"name": "檢討，並更新導覽旅程。", "dates": [{"$date": "2024-01-05T00:00:00"}], "description": "", "_id": "679688ee9ddf9a5f9c3e4a26"}], "_id": "679688ee9ddf9a5f9c3e4a23"}, {"name": "導覽旅程設計PART5-帶領一場自己規劃的導覽旅程", "startDate": "2025-06-29T00:00:00", "endDate": "2025-07-12T00:00:00", "subMilestones": [{"name": "安排導覽工具(手舉牌、音響等)", "dates": [{"$date": "2024-01-05T00:00:00"}], "description": "", "_id": "679688ee9ddf9a5f9c3e4a28"}, {"name": "實際執行導覽", "dates": [{"$date": "2024-01-03T00:00:00"}], "description": "", "_id": "679688ee9ddf9a5f9c3e4a29"}, {"name": "導覽後檢討", "dates": [], "description": "", "_id": "679688ee9ddf9a5f9c3e4a2a"}], "_id": "679688ee9ddf9a5f9c3e4a27"}]	{"tags": ["舉辦活動"], "description": "獨立規劃一場導覽旅程，並包含中英文內容。"}	Complete	Open		{"option": "優惠價：8000 元", "price": 0, "email": [], "_id": "679688ee9ddf9a5f9c3e4a2b"}	f	t	2025-01-26 19:11:42	2025-01-26 19:11:42	0	\N	2025-01-31 00:00:03.303988	airflow	2025-01-31 00:00:03.304499	airflow
679751719ddf9a5f9c3eabb1	創作個人的饒舌歌曲	2025S1	678e2e463b18d82b6896fb7a	1.是學校嘻哈研究社的地下社員，參加了十校聯合嘻研社迎新，看了很多厲害的表演，自己因此也想成為那樣帥氣的人，還有，上高中後，開始喜歡聽饒舌歌，就是一切因緣際會，讓我想要開始創作屬於自己的歌曲。\n2.做出至少三首饒舌歌，並發布在街聲，還有自己的IG跟YouTube ，並積極爭取社團表演的機會。\n3.積極蒐集生活素材，把生活中的靈感寫成歌詞，並且看YouTube 跟 Google 學習編曲的技巧，還有詢問身邊有在創作歌曲的人，最後變成真正的成品。	{"tags": ["興趣熱情", "自我挑戰", "個人成長"], "description": "覺得女rapper 真的很帥，自己也練習了一些饒舌歌，覺得是件蠻有挑戰性的事情，雖然要練習超級多次，才可以練好一首曲子，但一旦練好，會讓自己非常有成就感，而且在練習過程中，不會感到厭煩，會覺得很享受那個過程，後來在經歷過嘻研社迎新後，很多人都說會作詞，一開始我有點錯愕，但後來回家後，就慢慢在生活中蒐集靈感，就發現自己也許也可以真正創作饒舌歌，因此想開啟這個創作計畫。"}	-不同的饒舌曲風編曲\n-作詞如何更精緻\n-如何用曲子寫詞\n-如何用現有的詞創作曲子	-可以自在創作饒舌歌\n-可以用饒舌音樂結交更多朋友\n-可以用創作抒發生活感受	{"tags": ["觀看影片", "資料蒐集/研究/分析"], "description": "我會先觀看那些YouTube影片，一邊跟著實作，最後產出作品，再發表到IG跟YouTube!"}	[{"name": "作詞", "startDate": "2025-02-09T00:00:00", "endDate": "2025-02-22T00:00:00", "subMilestones": [{"name": "將生活素材做成第一首詞", "dates": [], "description": "", "_id": "679751719ddf9a5f9c3eabb3"}], "_id": "679751719ddf9a5f9c3eabb2"}, {"name": "看第一部編曲影片", "startDate": "2025-02-23T00:00:00", "endDate": "2025-03-08T00:00:00", "subMilestones": [], "_id": "679751719ddf9a5f9c3eabb4"}, {"name": "完成第一首曲子", "startDate": "2025-03-09T00:00:00", "endDate": "2025-03-22T00:00:00", "subMilestones": [], "_id": "679751719ddf9a5f9c3eabb5"}, {"name": "蒐集第二首歌的素材，並完成歌詞", "startDate": "2025-03-23T00:00:00", "endDate": "2025-04-05T00:00:00", "subMilestones": [], "_id": "679751719ddf9a5f9c3eabb6"}, {"name": "製作第二首的曲子", "startDate": "2025-04-06T00:00:00", "endDate": "2025-04-19T00:00:00", "subMilestones": [], "_id": "679751719ddf9a5f9c3eabb7"}, {"name": "完善第二首歌，並發佈在個人社交平台", "startDate": "2025-04-20T00:00:00", "endDate": "2025-05-03T00:00:00", "subMilestones": [], "_id": "679751719ddf9a5f9c3eabb8"}, {"name": "蒐集第三首歌的素材，並完成作詞", "startDate": "2025-05-04T00:00:00", "endDate": "2025-05-17T00:00:00", "subMilestones": [], "_id": "679751719ddf9a5f9c3eabb9"}, {"name": "製作第三首歌的編曲", "startDate": "2025-05-18T00:00:00", "endDate": "2025-05-31T00:00:00", "subMilestones": [], "_id": "679751719ddf9a5f9c3eabba"}, {"name": "完成第三首歌，並發佈到個人社交平台", "startDate": "2025-06-01T00:00:00", "endDate": "2025-06-14T00:00:00", "subMilestones": [], "_id": "679751719ddf9a5f9c3eabbb"}, {"name": "彙整心得與反思", "startDate": "2025-06-15T00:00:00", "endDate": "2025-06-28T00:00:00", "subMilestones": [], "_id": "679751719ddf9a5f9c3eabbc"}, {"name": "製作成完整的學習報告", "startDate": "2025-06-29T00:00:00", "endDate": "2025-07-12T00:00:00", "subMilestones": [], "_id": "679751719ddf9a5f9c3eabbd"}]	{"tags": ["經營社群媒體", "藝術創作"], "description": "我會運用現有的IG帳號，發佈作品\\n還會用YouTube 個人頻道發佈個人作品"}	Complete	Open		{"option": "4人團報價：12000元（一人3000元）", "price": 0, "email": ["yufish0117@gmail.com", "eddie8873192@gmail.com", "jiayounikehuzhe@gmail.com"], "_id": "679751719ddf9a5f9c3eabbe"}	t	t	2025-01-27 09:27:13	2025-01-27 09:27:13	0	\N	2025-01-31 00:00:03.303988	airflow	2025-01-31 00:00:03.304499	airflow
679757809ddf9a5f9c3ed866	在計劃期間，透過自己的方式環島做志工。自己的方式ex打工、打工換宿、寫作收入	2025S1	67965de19ddf9a5f9c3e3daf	因為目前應該是我人生少數較多空白的時間，經過了一個月無所事事我覺得很空虛，也因此決定做些什麼來給自己一份上大學前的禮物，並且一個告訴自己已經準備好往下一個階段前進的準備。\n\n目標：預計在7月前用自己的力量環台一圈，並且在過程中要在每個城市至少做一次的志工服務\n\n預計已打工換宿、打工、寫作來增加收入\n\n與各地基金會聯絡了解管道\n	{"tags": ["自我挑戰"], "description": "在十八年的成長路上，我所遇到的幫助太多太多，但是所遇到身邊所傷害我的、向我洩氣的、往後拉的力量也太多，深深體會到「養育一個孩子要一個村莊的力量」的理念，我希望在大學前我可以好好認識、至少親眼看過我生長18年的土地，並且在走訪台灣的同時，將我的能量付出給孩子、老人、動物等需要幫助的人"}	內容、路線規劃\n\n教育、活動企劃發想\n\n預算控制\n\n自我及他人共同成長	我希望學校以後我可以知道1我真實在世界的定位是什麼、自己真正熱愛的是什麼，而能夠跳脫世俗的框架\n2更能珍惜身邊的一切\n3更能夠與人建立連結	{"tags": ["田野調查"], "description": "我預計先了解目前台灣各地的基金會、他們需要哪些幫助、我能透過什麼方式幫助\\n\\n在了解目前我真的能夠打工的實際情況"}	[{"name": "了解各地基金會", "startDate": "2025-02-09T00:00:00", "endDate": "2025-02-22T00:00:00", "subMilestones": [], "_id": "679757809ddf9a5f9c3ed867"}, {"name": "了解打工換宿實際情況", "startDate": "2025-02-23T00:00:00", "endDate": "2025-03-08T00:00:00", "subMilestones": [], "_id": "679757809ddf9a5f9c3ed868"}, {"name": "規劃路線", "startDate": "2025-03-09T00:00:00", "endDate": "2025-03-22T00:00:00", "subMilestones": [], "_id": "679757809ddf9a5f9c3ed869"}, {"name": "購買必須物、看診準備常用藥", "startDate": "2025-03-23T00:00:00", "endDate": "2025-04-05T00:00:00", "subMilestones": [], "_id": "679757809ddf9a5f9c3ed86a"}, {"name": "開始計劃志工期間的事物", "startDate": "2025-04-06T00:00:00", "endDate": "2025-04-19T00:00:00", "subMilestones": [], "_id": "679757809ddf9a5f9c3ed86b"}, {"name": "開始行動（台北出發一路往南）", "startDate": "2025-04-20T00:00:00", "endDate": "2025-05-03T00:00:00", "subMilestones": [], "_id": "679757809ddf9a5f9c3ed86c"}, {"name": "各地基金會", "startDate": "2025-05-04T00:00:00", "endDate": "2025-05-17T00:00:00", "subMilestones": [], "_id": "679757809ddf9a5f9c3ed86d"}, {"name": "各地基金會", "startDate": "2025-05-18T00:00:00", "endDate": "2025-05-31T00:00:00", "subMilestones": [], "_id": "679757809ddf9a5f9c3ed86e"}, {"name": "各地基金會", "startDate": "2025-06-01T00:00:00", "endDate": "2025-06-14T00:00:00", "subMilestones": [], "_id": "679757809ddf9a5f9c3ed86f"}, {"name": "各地學校、機構", "startDate": "2025-06-15T00:00:00", "endDate": "2025-06-28T00:00:00", "subMilestones": [], "_id": "679757809ddf9a5f9c3ed870"}, {"name": "可進入更深層的交流、幫助", "startDate": "2025-06-29T00:00:00", "endDate": "2025-07-12T00:00:00", "subMilestones": [], "_id": "679757809ddf9a5f9c3ed871"}]	{"tags": ["發起專案或組織"], "description": "我預計發起一個專案，透過了解了全台各地的弱勢族群，我更能知道他們真正需要的是什麼，在專案中為他們發聲、並號召更多志工"}	Complete	Open		{"option": "優惠價：8000 元", "price": 0, "email": [], "_id": "679757809ddf9a5f9c3ed872"}	t	t	2025-01-27 09:53:04	2025-01-27 09:53:04	0	\N	2025-01-31 00:00:03.303988	airflow	2025-01-31 00:00:03.304499	airflow
\.


--
-- Data for Name: old_resource; Type: TABLE DATA; Schema: public; Owner: daodao
--

COPY public.old_resource ("資源類型", "創建者", "縮圖", "領域名稱", "補充資源", "連結", "費用", "影片", "介紹", "標籤", "地區", "年齡層", "資源名稱") FROM stdin;
組織/社群, 工具/操作	\N	https://i.imgur.com/WBEqjq6.png	人文社會, 綜合型學習資源, 商業與社會創新	\N	https://www.ilink-hss.org/Toolkits	免費	\N	本計畫預計提供100個Toolkits之資源給大家，包括服務設計、設計思考、商業模式、人工智慧以及軟體應用等，形式包括影音、PDF、PPT、Podcast等，透過既有資源，鏈結各團隊執行計畫所需資源，並相互合作及切磋。	社會創新, 社會設計, 設計思考, 服務設計, UIUX	\N	國高中, 大學以上	社會創新相關工具（教育部資科司iLink計畫）
工具/操作	Tim	https://i.imgur.com/F1fPYDq.png	數學與邏輯	\N	https://lin.ee/G57Ujpg	免費	https://youtu.be/qPeLcZRv-jI	「好數多」是致力於提供中學學生數學相關學習資源，幫助學生提升自主學習的戰鬥力，是教師備課與學生自主學習的好工具 !\n要使用此工具只要加入「好數多」LINE官方帳號即可立即使用，你只要輸入不懂的數學概念名稱，它就會自動推薦講解影片，非常方便。此服務完全免費，是可以多加善用的自主學習工具！	數學	\N	國高中	好數多
課程/活動, 組織/社群	Tim	https://i.imgur.com/H5JZQC7.png	教育, 綜合型學習資源	\N	https://friendlycampus.k12ea.gov.tw/Portal	免費	\N	提供各類有益於國中生、高中職學生之生涯輔導相關資源連結及生涯輔導Q&A，協助學生探索自我、了解興趣、發展潛能。	生涯探索, 社會議題, 生命教育, 諮商, 性別平等	\N	國高中, 大學以上	友善校園學生事務與輔導工作資訊網
文章/書, 課程/活動	Tim	https://i.imgur.com/F0yfYmn.png	語言與文學	\N	https://www.dkefe.com/en	需付費	\N	Learn how to improve your English with this great English speaking course from DK. Includes English practice books and online audio.\n此爲DK出版的英文自學教材，結構完整內容豐富且循序漸進，適合想學英文的人們。你可以從淘寶購買中文版《人人學英語》，省下一些錢。	聽力, 英語, 閱讀, 口說, 寫作, 單字	\N	學齡前, 國小, 國高中, 大學以上	DK English For Everyone: Learn English with DK
\N	Tim	https://i.imgur.com/A0W1IJM.png	綜合型學習資源, 學習/教學工具	\N	https://ref.ncl.edu.tw/	免費	\N	學術知識服務網 此爲國家圖書館的網頁，上面提供了許多參考資料供一般大衆使用。值得一提的是————它還有線上的「參考諮詢」服務，只要你有想要找的書籍或資料，你就可以在上面提問，服務人員會幫忙代找，這是不會找資料的人的一大福音，這可以幫你省下時間，並且也可以過濾資訊，找到有價值的資訊。這跟圖書資訊管理學系相關，這種圖書館的技術可以更快找到你想要的資料，而受過訓練的服務人員可以有效地檢索資料，找到讀者需要的資料，而這個網站就提供這樣的服務。	資訊素養	\N	國高中, 大學以上	學術知識服務網
組織/社群, 課程/活動	\N	https://i.imgur.com/Fnnrq1Q.png	運動/心理/醫學	\N	https://changeformula.org/	免費	https://www.youtube.com/watch?v=WF28TcZ_P9w	蛻變方成事核心目標是支持逆境兒少及其陪伴者。「好好長大需要運氣，照顧孩子好好長大需要被支持」是貫穿組織的核心概念，強調專業照顧者在逆境兒少成長過程中的重要性。	兒少議題, 社會議題, 助人工作, 社會工作	\N	國高中, 大學以上	蛻變方成事
影片	\N	https://i.imgur.com/OUUFeOz.png	資訊與工程	\N	https://github.com/IKMLab/NTHU_Natural_Language_Processing	免費	\N	本課程旨在介紹自然語言處理（NLP）和大型語言模（LLM）的基礎知識和前瞻技術，適合對自然語言技術感興趣的學生。隨著生成式人工智慧技術的快速發展，NLP在各個領域中的應用日益廣泛。\n本課程將提供學生NLP理論基礎，並結合實際應用，幫助學生掌握最新的NLP與LLM技術。課程內容主要分為以下幾個部分：\n1. 文字處理基礎：介紹NLP的基本概念和常用技術。教學基本的文字處理技術，如分詞、詞性標註、命名實體識別等。\n2. 機器學習模型：機器學習基本概念和算法，如線性回歸、決策樹、隨機森林等。介紹如何將機器學習應用於NLP，包括文本分類、情感分析等。\n3. 語言模型：語言模型的基本概念與原理，如N-gram模型、Word2Vec等。深度學習在語言模型中的應用，如RNN、LSTM、Transformer等架構。詳細講解BERT、GPT等先進語言模型，並探討其在不同NLP任務中的應用。\n4. 前瞻大語言模型技術：介紹大型語言模型的發展歷程與最新研究進展，如GPT-3等。探討這些模型的訓練方法、大規模資料集的使用，以及在不同領域中的能力。介紹輕量化微調技術（PEFT），如LoRA，並說明其在提高訓練效率和效果方面的優勢。	自然語言處理, NLP, 機器學習, 人工智慧AI, Python, 大語言模型	\N	大學以上	自然語言處理 Natural Language Processing｜清大高宏宇老師
影片	\N	https://i.imgur.com/JnYdM9s.png	資訊與工程	\N	https://www.youtube.com/playlist?list=PLSwYd_vsn-Yuu7Ce8FZypH1dR6aN_U7kO	免費	\N	本課程介紹人工智慧的基本原理、問題解決方法和學習範式。涵蓋的主題包括智能代理、無資訊與有資訊的搜尋、對抗搜尋與遊戲、統計學習、神經網路以及人工智慧的應用。	人工智慧AI, 機器學習	\N	國高中, 大學以上	人工智慧導論2024｜成大 朱威達老師
工具/操作	Bestian	https://i.imgur.com/wpKSb3r.png	資訊與工程	\N	https://www.cursor.com/	需付費	\N	非常實用的AI Code Editor，和VS Code的操作幾乎一樣，再加上AI輔助設計的功能	AI工具, 程式設計, code	\N	國高中, 大學以上	Cursor AI編輯器
組織/社群, 課程/活動	Tiff	https://i.imgur.com/TP9NTj0.png	教育, 人文社會, 生活	\N	https://www.instagram.com/huobanjuyi/	免費	https://www.youtube.com/watch?v=V1509JBDHJY	《 夥伴注意 Huobanjuyi 》是一群具備新媒體專長也熱愛社會服務的年輕人。以「星星之火，光芒無限」的精神，希望透過新媒體的媒介，攜手公益夥伴及青年力量，讓每個微小的議題都能被看見。我們擅長以專案形式推廣服務，並結合影音採訪深入了解服務對象實際需求以結合媒體培力課程及後續服務推展。自2021成立，過往關注過偏鄉、長者、身心障礙等議題。	志工, 社會議題, 社會參與	\N	國高中, 大學以上	夥伴注意 Huobanjuyi
APP	Peggy	https://i.imgur.com/kZEsY7h.png	教育, 語言與文學	\N	https://portaly.cc/taro.dict	免費	\N	「芋圓台語字典 Taro Taiwanese Dictionary」是一個全方位的台語學習 App，不僅提供了最權威的台語辭典，還擁有了許多獨特的學習功能，讓你可以輕鬆地學習台語的發音、拼寫、用法。你可以隨時隨地查詢任何你想知道的台語詞彙，並且聽到真人的發音和看到豐富的例句。你也可以記錄你的學習進度，並且利用詞單和詞卡的方式，加強你的記憶和複習。更重要的是，你可以學習台語的文字，包括漢字和羅馬字，並且通過台語羅馬字教學功能，一步一步地學會台語的拼音規則，讓你可以自信地掌握台語的聽說讀寫。	台語	\N	學齡前, 國小, 國高中, 大學以上	芋圓台語字典
影片	Tiff	https://i.imgur.com/KUfH0wZ.jpg	商業與社會創新	\N	https://www.youtube.com/channel/UCx-3uIsNp5XcdtLWHzj3xYQ	免費	\N	財經影片自媒體。	投資理財	\N	國高中, 大學以上	DannyData小丹尼
課程/活動	Tiff	https://i.imgur.com/X2MSQHW.png	教育, 綜合型學習資源, 自然科學, 人文社會, 資訊與工程	\N	https://www.facebook.com/p/%E8%A6%AA%E5%AD%90%E6%95%B8%E4%BD%8D%E7%9F%A5%E8%83%BD%E6%8E%A8%E5%BB%A3%E8%A8%88%E7%95%AB-Family-Digital-Guide-100083089069149/	免費	\N	北科大中小學家長數位知能指引推廣團隊承辦教育部「親子數位知能推廣計畫 Family Digital Guide 」，辦理全臺因材網家長增能工作坊、家長講師培訓計畫。	數位學習, 人工智慧AI, 科技, 自主學習	\N	國高中, 大學以上	親子數位知能推廣計畫 Family Digital Guide 
影片	\N	https://i.imgur.com/6iAn46h.png	綜合型學習資源, 教育, 人文社會, 商業與社會創新	\N	https://www.youtube.com/playlist?list=PLYEpjr9MgEU5N4xODBV-jWk1NULZbEHj5	免費	\N	《5分鐘商學院·基礎》是由著名商業顧問劉潤開設的線上商業課程，旨在幫助學員掌握商業世界的基本知識和技能。課程涵蓋260個知識點、50個實用工具和55位企業家線上講座，內容涵蓋心理學、經濟學、金融、法律、產品、營銷、管理等多個方面，幫助學員提升商業思維和管理能力。	法律, 經濟, 心理學, 管理, 個人思維	\N	大學以上, 國高中	劉潤《5分鐘商學院・基礎》
組織/社群	\N	https://i.imgur.com/PFhhoVG.png	自然科學, 人文社會	\N	https://dsone.taipower.com.tw/	免費	\N	 電幻1號所致力於推廣綠能教育，並透過展覽、工作坊等活動，讓民眾認識能源轉型與永續發展的重要性。館內也定期舉辦特展，例如「淨零視界|電幻同行」展覽，邀請設計科系學生參與創作，展現他們對綠能議題的見解。	跨域整合, 青年, 氣候, CSR, ESG, 淨零	\N	國高中, 大學以上	電幻一號所館長
組織/社群	\N	https://i.imgur.com/7vXoYp1.png	綜合型學習資源, 自然科學	\N	https://www.twycc.org.tw/	免費	\N	台灣青年氣候聯盟（TWYCC）正式立案於 2012 年，是台灣第一個「青年自主成立的環境非營利組織」，由一群來自台灣各地對環境保護、氣候變遷議題充滿熱情的青年所組成。	氣候, 青年, 國際參與	\N	國高中, 大學以上	臺灣青年氣候聯盟
課程/活動, 組織/社群, 影片	\N	https://i.imgur.com/RMPobuz.png	教育, 藝術, 綜合型學習資源, 商業與社會創新	\N	https://school.taicca.tw/	免費	\N	文化內容策進院成立「文策學院 TAICCA School 」，針對產業發展之人才需求，增進人才職能。現階段文策學院以產業通識型課程以及實戰市場案例分析的方法，強化公司智財法務、市場募資、財務經營專業能力。網站內容除了有線上課程（內容開發製作類、創業經營類、提案培訓類 ）之外，也有一些文化藝術相關的培訓計畫，	創業, 經營	\N	國高中, 大學以上	文策學院
Podcast	\N	https://i.imgur.com/RNFaICm.png	資訊與工程, 生活	\N	https://podcasts.apple.com/us/podcast/%E7%A7%91%E6%8A%80%E6%B5%AA-tech-wav/id1702409419	免費	https://www.youtube.com/watch?v=yhIfl7eAgHw	用白話但不失深度的方式跟你聊科技並著重在AI。\n每周一中午更新！	人工智慧AI, ChatGPT, 資訊科技, 科技資訊, Google	\N	國小, 國高中, 大學以上	科技浪 Tech.wav
組織/社群	袋鼠	https://i.imgur.com/F27t6qX.png	教育, 綜合型學習資源	\N	https://www.instagram.com/homeschooling._.107?igsh=bDhyN3lnY2pyamZn	免費	\N	政府為了鼓勵教育創新、保障人民教育選擇權、促進教育多元，於113年實施實驗教育三法，如今已經邁入第十年。根據教育部最新公布的統計數字，全臺參與實驗教育的人數已由103學年4009人逐年增長至112學年25595人，成長逾6倍。我們發現不過即使如此，現階段給予實驗教育的資源雖然越來越多元且豐富，但似乎還是太過分散缺乏系統性的整合因此促成了此教育品牌「讀自學系的人」的誕生同為實驗教育學生的兩位創辦人希望透過辦理「讀自學系的人」，整合並分享與實驗教育相關的「學習資源」、「自學經驗」和「升學方式」等資訊成為全臺實驗教育學生在學習過程中最好的夥伴，讓自學的你不再孤單！	教育, 自主學習, 自學生, 實驗教育, 教育創新, 民主教育, 終身學習	\N	國小, 國高中, 大學以上	讀自學系的人
課程/活動, 組織/社群	\N	https://i.imgur.com/iNfwawF.png	商業與社會創新, 人文社會, 教育, 綜合型學習資源	\N	https://www.instagram.com/le_bistrot_social/	部分免費	\N	#創新 #開放 #共創 #行動 #社創共學社群\n「歡迎光臨社創吧，今晚想喝點什麼呢？」\n🍸愉快共創、孵化社創的酒吧\n🔥踏進社創吧、一起社創吧！\n——\n🍻調製專屬獨特飲品 #現有服務項目\n知識面：社創輕鬆聊、社創果醬黑客松\n永續面：校園碳盤查、精實創業工作坊	社會創新, 社會參與, 社會設計, 設計思考, 永續發展, SDGS, 碳盤查, 黑客松	\N	國高中, 大學以上	社創行動實驗吧㍿
組織/社群, 課程/活動	\N	https://i.imgur.com/LvbOpdR.png	教育, 人文社會, 生活	\N	https://dreamaker.tw/	部分免費	\N	用「設計思考」觀察社區議題、用 Ikigai 找出生命意義、用 KSAA 法找出跨域自學方向，讓孩子在短期間有認識自己和周遭社區的初體驗。	社區營造, 地方創生, 教育創新, 體驗教育, 生涯探索, 自主學習, 領導, 跨域整合	屏東	學齡前, 國小, 國高中, 大學以上	創夢客 DREAMAKER
組織/社群, 提案/競賽, 課程/活動	\N	https://i.imgur.com/kK8CuaB.png	教育, 綜合型學習資源, 自然科學, 人文社會, 生活, 商業與社會創新	\N	https://changemaker.yda.gov.tw/	免費	\N	培養青年對家鄉及生長土地的認同感，將青年的觀點、專長、創意與熱情轉化為實際參與，透過行動，協助社區活化及發展，\n青年有機會深入在地，將建立青年在地行動網絡，以「Changemaker」號召有志協助在地發展之青年，運用創意、活力及本署相關資源，\n付諸行動，投入在地發展，為社區帶來新的改變。	社會創新, 社區營造, 文化, 歷史, 地理, 青年, 跨領域, 社會參與, 服務學習, 社會設計, 永續發展, 教育創新	\N	國小, 國高中, 大學以上	青年社區參與行動 2.0 | 教育部青年發展署
影片	\N	https://i.imgur.com/jnueBCg.png	人文社會, 生活, 教育	\N	https://www.udemy.com/course/apca-course/	免費	\N	民主是個怎樣的制度？民主適合我所處的社會嗎？給行動家的民主入門，與想要理解民主優勢與劣勢的你一起思辨。	民主教育, 社會議題, 社會學	\N	國小, 國高中, 大學以上	 給行動家的民主入門課（上） |
課程/活動	羊羊	https://www.nytimes.com/games-assets/v2/assets/wordle/wordle_og_1200x630.png	語言與文學	\N	https://www.nytimes.com/games/wordle/index.html	免費	\N	學習英文單字的網站	英語, 單字	\N	國小, 國高中, 大學以上	nytimes.wordle
課程/活動	羊羊	https://images.forbes.com/fraseAssets/frasePrimarySocialShare.png	語言與文學	\N	https://www.forbes.com/frase/	免費	\N	學習英文單字的網站	英語, 單字	\N	國小, 國高中, 大學以上	forbes.wordle
課程/活動	羊羊	https://res.cloudinary.com/de1xt85xc/image/upload/v1670451527/SEO/og-image-default_if2m77.png	語言與文學	\N	https://bunpro.jp/	部分免費	\N	用英語式的方式學習日語	日文	\N	國小, 國高中, 大學以上	bunpro
課程/活動	羊羊	https://assets.wanikani.com/assets/social-media-image-0688aab8cf50ec8b08d3c8214cda6f3241216d552fc9730297a42979fbd9fcd4.jpg	語言與文學	\N	https://www.wanikani.com/	免費	\N	學習日語漢字的網站	日文	\N	國小, 國高中, 大學以上	wanikani
組織/社群	\N	https://i.imgur.com/m0ZcHdl.png	教育, 綜合型學習資源, 自然科學, 人文社會, 生活, 商業與社會創新	\N	https://csrone.com/	免費	\N	台灣第一家 CSR 永續溝通與知識平台。多年深耕台灣永續領域，協助台灣社會接軌國際，包含永續專業知識、議合非營利組織、策略顧問服務、協助企業擘劃 CSR 全面性策略規劃、媒體議題策畫、CSR 報告書撰寫與溝通、課程訓練規劃與 CSR 專案活動等業務。	永續發展, SDGS, CSR, 氣候, ESG	\N	國小, 國高中, 大學以上	 CSRone 永續智庫
組織/社群	\N	https://i.imgur.com/yd1YeZw.png	綜合型學習資源, 藝術, 教育, 自然科學, 人文社會, 商業與社會創新	\N	https://futurecity.cw.com.tw/	免費	\N	「未來城市＠天下」是《天下雜誌》2018年推出的未來科技與城市治理品牌。我們報導國內外趨勢與經驗、邀集專家觀點，期望透過線上與線下社群，為公民、企業和政府開啟對話，共創理想宜居生活的交流平台。	社會議題, 社會創新, 永續發展, SDGS, 經濟, 教育, 城市, 人工智慧AI	\N	國小, 國高中, 大學以上	未來城市＠天下 
組織/社群, 課程/活動	Tiff	https://i.imgur.com/m5IfM7p.png	人文社會, 自然科學, 教育	\N	https://www.tailwagging.org.tw	免費	\N	社團法人台灣搖尾巴友善動物協會致力為老病殘犬招募陪伴家庭，並與獸醫師及正向訓練師合作，協助狗兒與陪伴家庭適應彼此生活。同時推廣挪威資深訓練師Turid Rugaas（吐蕊阿嬤）溫和、友善且尊重動物的理念，促進人與狗兒之間相互理解，在有限的相伴中共創無限的愛與和諧。	社會議題, 社會參與, 寵物	\N	學齡前, 國小, 國高中, 大學以上	社團法人台灣搖尾巴友善動物協會(TTCA)
組織/社群	袋鼠	https://i.imgur.com/Wj24OfW.png	教育, 綜合型學習資源, 人文社會, 商業與社會創新	\N	https://www.tysda.earth/	免費	\N	自2015年起，聯合國提出「永續發展目標」，台灣青年積極響應，各大專院校青年領袖成立青年永續團隊，推動SDGs。2017年起，他們共同舉辦「綠社交流」，分享思維、經驗及資源，強調合作夥伴關係。這項倡議讓永續發展成為台灣青年共同使命，並成立台灣青年永續發展協會，以持續推動永續發展，擴展價值，並提供平台，強化世代影響力，共同追求台灣的永續發展。	永續發展, SDGS, 社會創新, 社會參與	\N	國小, 國高中, 大學以上	台灣青年永續發展協會
課程/活動, 組織/社群	袋鼠	https://i.imgur.com/XnP30h2.png	教育, 綜合型學習資源	\N	https://www.instagram.com/buklavu50/	免費	https://www.youtube.com/watch?v=UAJfGdKAL6s	Ibu協會致力解決原鄉青少年生涯發展困境，攜手部落推動在地生涯試探，讓原鄉青少在生長的土地上學習跨領域技能，畫出自己的未來藍圖。	生涯探索, 服務學習, 志工, 原住民	\N	國高中, 大學以上	Ibu原鄉兒少生涯教育協會
組織/社群, 文章/書	袋鼠	https://i.imgur.com/hMsJfNZ.png	教育, 藝術, 綜合型學習資源, 人文社會, 自然科學, 語言與文學, 數學與邏輯, 資訊與工程, 生活, 運動/心理/醫學	\N	https://www.simpleinfo.cc/	免費	\N	挑戰不可能，創造最好的形式！\n我們期許每一個簡訊創造出來的專案，不只挑戰自己的極限，也是探索後的最好表達形式，不僅要能開拓社會的眼界，也能將正面的力量帶給社會。\n集眾人之力，提供社群力爆發的設計！\n我們將社群分享的核心精神植入專案，打造讓大眾易於參與反饋的互動機制，集團隊眾人之力，將想要傳達的理念透過專案推廣出去。\n與時代並進，證明行銷設計的價值！\n每一個專案，我們皆謹慎研究、用心探索表現的可能性，並與時代共同前進，用實力證明設計的力量，用專業贏得客戶的信賴。	社會議題, 國際時事, 懶人包, 國際議題	\N	國小, 國高中, 大學以上	簡訊設計｜官方部落格
工具/操作	袋鼠	https://i.imgur.com/92ZKAma.png	教育, 綜合型學習資源, 資訊與工程, 生活, 學習/教學工具, 商業與社會創新	\N	https://docs.google.com/spreadsheets/d/1uXmEgxftlmOZ6Xj9cx_-mABuNYGBhw1bQWRvEBkV6DY/edit?usp=sharing	免費	\N	由高中老師們自行整理的AI教育工具清單表格，包含主要的功能類型、產出教材的功能，以及相關介紹都整理成表格，供大家使用！	AI工具, 教育, 數位工具, 人工智慧AI	\N	學齡前, 國小, 國高中, 大學以上	AI教育工具清單(for高中職)
組織/社群	\N	https://i.imgur.com/l741HSN.png	教育, 綜合型學習資源, 人文社會, 商業與社會創新	\N	https://www.scinarrative.com/	免費	\N	未來敘事工場提供兩大類服務，一是面向大眾的科幻故事之影視小說劇本服務，二是前瞻未來學研究及顧問教練服務。\n【企業前瞻】\n建立未來預警系統、永續策略與風險管理、未來策略佈局與願景設計\n【未來研究】\n未來情境分析、趨勢分析與研究\n	設計思考, 未來學, 社會創新, 社會參與	\N	國高中, 大學以上	未來敘事工廠
課程/活動	Ying	https://i.imgur.com/48T7caA.png	藝術	\N	https://taplink.cc/artefacto_school	部分免費	\N	國外素描＆水彩線上課程（付費課程為主，有時會舉辦免費課程/體驗班），也有 YouTube 頻道教學影片。\n課程有區分適合的等級，從簡單的初階課程到高階培訓班都有。\n除免費課程外，課程價格從 10€ ~ 500+€ 不等。	藝術, 繪畫, 素描, 水彩	\N	國高中, 大學以上	Artefacto Learning Platform
課程/活動, 組織/社群	袋鼠	https://i.imgur.com/3OYq2Gf.png	商業與社會創新	\N	https://dmtltw.com/	部分免費	https://www.youtube.com/watch?v=Nc3ehs4X7bc	行銷地圖－行銷實驗室，陪你聊數位轉型路上的大小事。我們是【精立數位】自創的教育訓練品牌，致力於數位行銷知識的推廣與傳遞！	公關行銷, 廣告分析, Google ADs, WordPress, GA	\N	國高中, 大學以上	行銷地圖DMAP
課程/活動	袋鼠	https://i.imgur.com/9PZK3oG.png	運動/心理/醫學, 藝術	\N	http://jinjin.mepopedia.com/~jinjin/ui/index.html	免費	\N	如果你對於使用APP和逛網站很有心得，覺得很多APP很難用，很多網站找不到想找的資訊。設計不便利，視覺不美觀，對於開發或改善新的APP很有想法，歡迎你來到使用者介面設計的世界！\n此網站放置大學課程相關之UI課程，也包含上課內容、補充影片與練習作業。	用戶體驗設計, UIUX, 使用者介面設計, Figma, Design, 設計	\N	國高中, 大學以上	使用者介面設計教學網站
影片	Tiff	https://i.imgur.com/0YCZ2OM.png	資訊與工程	\N	https://www.youtube.com/@ikura_AI/videos	免費	\N	矽谷 AI 打工仔們，佛系上傳 AI 繪圖的技術科普。	人工智慧AI, 影片	\N	國小, 國高中, 大學以上	AI 甘安捏
課程/活動	Paul	https://i.imgur.com/sGjpeNk.png	生活, 綜合型學習資源	\N	http://ocw.aca.ntu.edu.tw/ntu-ocw/ocw/cou/110S204?fbclid=IwAR3OKMVJp7CJ_rLMtKrWgndFtYVdtT38T11pWIVR0TPy0-eP8AgKc2hvNKw	免費	https://www.youtube.com/watch?v=aA4w2YnYR8k	「台大財金系開給高中生的金融素養課程，有15堂課，現在都免費公開在網路上了，除了高中生可以了解財金系在學哪些東西，對於認真的投資人也很適合拿來學習，當然對專業的人來說這些都很基礎，對菜鳥來說這些可能又有點艱澀」from《商益》總編輯李柏鋒	財金	\N	國高中, 大學以上	基礎財金素養 - 台大財金系開放式課程
組織/社群, 課程/活動	袋鼠	https://i.imgur.com/w1yPtcq.png	教育, 人文社會, 綜合型學習資源, 商業與社會創新	\N	https://doyouaflavor.tw/	免費	https://www.youtube.com/watch?v=uHuU05U7sWo	深感每個人都是弱勢，卻因互不認識而不自知。\n於是，希望透過各種簡單有趣的計畫，藉由群眾參與拉近人與人之間的距離。\n我們相信，弱勢不是被切割出來的特殊族群，而是流動的、可被改變的狀態。\n因此人生百味的行動也分成兩個面向：\n從個人而言，我們發展「重建連結」的行動，像是重修舊好、人生萬事屋的工作隊與寫寫字工作坊的生命書寫；\n而面對整體社會，我們發展「深入理解的社會教育行動」，像是石頭湯、溫石計畫的到街頭吃一頓晚餐，以及與許多組織一起合作的「貧窮人的台北」，由貧窮經驗者用自己的口說自己的話。\n透過陪伴、紀錄以及倡議、群眾行動等行動方法，將一線服務的經驗轉化輸出，並不斷嘗試各種有趣的新型態行動與模式，讓大眾能選擇用各自舒適的方法來認識議題。	貧窮, 社會議題, 社會創新, 社會設計, 社會參與, 社會工作, 服務學習	台灣	國小, 國高中, 大學以上	人生百味
課程/活動, 工具/操作	\N	https://i.imgur.com/sitWImb.png	資訊與工程, 語言與文學	\N	https://wordvice.ai/tw	部分免費	\N	Wordvice AI 線上英文寫作助手，致力於幫助用戶提升英文寫作的品質和效率。這個 AI 工具具有多項強大功能，包括文法和拼寫檢查、句子結構優化、同義詞替換等。它不僅可以幫助用戶改善寫作技巧，還能節省時間，提高寫作效率。	人工智慧AI, 英文, 文法	\N	國高中, 大學以上	Wordvice AI 線上英文寫作助手
文章/書	Ying	https://i.imgur.com/zharCqr.png	藝術	\N	http://vr.theatre.ntu.edu.tw/fineart/index.html	免費	\N	《視覺素養學習網》之內容包括藝術理論、藝術創作和藝術史三個部份，為讀者提供視覺素養以及國內外藝術作品之相關知識。本網站可以做為國中小學美術教育的輔助教材，也可以做為全民終身學習的參考資料。	藝術教育, 歷史, 視覺文化, 自主學習	\N	國高中, 大學以上	視覺素養學習網
組織/社群	袋鼠	https://i.imgur.com/AJttutv.png	教育, 綜合型學習資源, 人文社會, 生活, 商業與社會創新	\N	https://www.tw-ren.com/	免費	\N	地方創生的三大元素是「地方、產業和人」；而「產業創生」的三大關鍵則是「企業、知識和人」，其中更以「人」為改變的核心。 為此，「台灣產業創生平台」提供了開放的知識交流場域，從企業掌舵者思維的轉變做起，廣邀台灣大中小企業領袖共同參與。\n我們透過與企業決策者的訪談，汲取經營智慧與實戰秘訣，讓正在轉型路上努力前行的企業以彼此為借鏡；同時，我們提供企業外部創新機制、新創投資趨勢以及全球政經、產業動態分析；並以跨國線上論壇鏈結全球創新重鎮，和企業一同培育新世代的產業人才，協助台灣產業前瞻發展新坦途。\n歡迎加入我們，讓「未來」走到你跟前。	地方創生, 社會創新, 社會企業, 社會參與, 教育創新, 商業價值	\N	國高中, 大學以上	臺灣產業創生平台
組織/社群	袋鼠	https://i.imgur.com/m2EIEXw.png	教育, 藝術, 綜合型學習資源, 人文社會, 商業與社會創新	\N	https://formosa.gvm.com.tw/	免費	\N	大創生時代是由遠見雜誌所建立的地方創生網站，裡面有許多不同的地方創生故事，每一個故事起點，或許不盡相同、難以複製，心法卻可仿效。藉由八個共生學，探索出自己與地方連結的可能，讓「地方創生」成為台灣發光的新產業。	地方創生, 文化, 社會創新, 社會參與	台灣	國小, 國高中, 大學以上	大創生時代
組織/社群	袋鼠	https://i.imgur.com/WGJ0vaN.png	綜合型學習資源, 教育	\N	https://raymondhouch.com/	免費	\N	雷蒙三十，幫助忙碌的現代人快樂工作，品質生活幫助你獲得可立即實踐的策略，優化自己的生活和事業！ 除了雷蒙＆柚子兩位主持人，和你分享經營一人公司、個人事業路上遇到的真實挑戰和啟發，也和「非典型」而立人物聊聊，聽聽他的30 歲，他在哪裡？	Notion, 工作與生活, 終身學習	\N	國高中, 大學以上	雷蒙三十
課程/活動, 組織/社群	袋鼠	https://i.imgur.com/wU1q9GF.png	人文社會, 教育, 藝術, 綜合型學習資源, 自然科學, 商業與社會創新	\N	https://walkin.tw/	部分免費	\N	「旅行，和土地的約定」\n使命｜讓每個人守護台灣這片土地的美好\n願景｜成為最有影響力的永續旅行品牌，以堅實經營能力及行銷企劃支援系統，\n建立地方觀點的多品牌及產品服務，為夥伴及客戶創造價值。	永續發展, 地方創生, 社會創新	台灣	國小, 國高中, 大學以上	島內散步
組織/社群, 工具/操作, 文章/書	袋鼠	https://i.imgur.com/FnjwsBY.png	運動/心理/醫學, 綜合型學習資源, 人文社會	\N	https://socialworkerdaily.com/	免費	\N	為社工設計的網站，提供社工師筆記、資源地圖等資源，共同為社工專業盡一份心力。（簡介摘自官網）	心理學, 社會工作, 筆記, 投資理財, 社會政策, 人類行為	\N	大學以上	社工日常
文章/書, 課程/活動, 工具/操作	Tiff	https://i.imgur.com/rf2NajE.png	資訊與工程	\N	https://www.explainthis.io/zh-hant	部分免費	\N	ExplainThis 專注在生成式 AI 創新應用、軟體全端開發，以及科技業職涯發展的內容產出。希望透過我們的內容，協助每個人培養出 AI 時代必備的關鍵維力與能力 ，讓人有能力在瞬息萬變的 AI 時代中，持續走在最前沿。\nExplainThis 網站中的多數內容為免費開放，然而為了讓 ExplainThis 的經營更加永續，我們有部分付費內容與書籍，也有提供在文章與電子報的付費廣告版位；同時我們有提供軟體開發、客製化 AI 聊天機器人等服務。如果你有興趣與我們合作，可以到服務項目頁面中了解更多。	人工智慧AI, 程式設計, 職涯	不限	國高中, 大學以上	ExplainThis
課程/活動, 文章/書	袋鼠	https://i.imgur.com/t0yUFZ9.png	綜合型學習資源	\N	https://worldviews.academy/	部分免費	https://www.youtube.com/watch?v=ZsP1cMtZy6Y&list=PLUBjAOpijtLl6hr2mKJ8yk_KhUlVTpX9o	世界觀學院創辦人李佳達透過在密涅瓦大學所學的思考習慣經驗，帶回來臺灣並設計出一套決策思考力的方法，此套應對未知的思考訓練融合了密涅瓦的思考習慣訓練法及大歷史的跨領域思維模型，成為一套有效應對未知的思考訓練方法。 	問題解決力, 決策思考力	\N	國高中, 大學以上	世界觀學院
文章/書, 組織/社群	袋鼠	https://i.imgur.com/dnaTwNO.png	綜合型學習資源, 人文社會	\N	https://global.udn.com/global_vision/index	免費	\N	《轉角國際》成立於2015年，為臺灣知名的國際新聞媒體。在沒有駐外記者、沒有充足人力的情況下，《轉角國際》四位編輯每日選擇重要或自己拿手的題目，蒐集國際各大通訊社、媒體的新聞，或追蹤國際新聞記者的Twitter，深入剖析國際事件，也透過Podcast讓臺灣公民更貼近國際新聞。(簡介摘錄自此https://reurl.cc/a4M2VX)	新聞, 國際, 國際時事, 國際議題, 閱讀, 素養教育	\N	國小, 大學以上, 國高中	轉角國際
組織/社群	袋鼠	https://i.imgur.com/xmnxOiT.png	綜合型學習資源	\N	https://keepfail.com/	免費	\N	KeepFail團隊從服務安置機構青少年起家，協助他們提升社會適應與自立能力。但在服務過程中我們發現，孩子總會受到許多過去的挫折經驗所影響，卻很難有機會說出來。\n每個人生命中都會遭遇各式失敗、挫折、搞砸、失落，這些經驗默默地影響著我們，卻很難有機會說出口，更不容易去發掘對它自我的影響。因此我們希望透過各式各樣素材與媒介的傳遞，使大眾用不同角度看待失敗、學習分享，並從中尋找自我，創造一個「願意分享與接納失敗的環境」（簡介摘自網站）	自我探索, 自我成長, 生涯探索, 教育	\N	國高中, 大學以上	KeepFail
提案/競賽	袋鼠	https://i.imgur.com/BJGFUYQ.png	綜合型學習資源, 商業與社會創新	\N	https://ssp.moe.gov.tw/	免費	\N	教育部自 101 年起實施「大專校院創新創業扎根計畫」(自109年更名為「大專校院推動創新創業教育計畫」)，引導大專校院提升創新創業課程品質，培育具創業家精神之人才。\n為進一步強化創新創業課程效益，遂於105年起推動「創業實戰模擬學習平臺」，鼓勵大專校院創新創業課程衍生的學生團隊投以構想提案，透過平臺「教練團」與學校輔導單位的引導，體驗虛擬的群眾募資歷程，深化創新創業教育的意義與價值。	創業, 提案, 社會創新, 教育創新	\N	大學以上	大專校院創業實戰模擬學習平臺
課程/活動	Tiff	https://i.imgur.com/tP3B5SW.jpg	人文社會, 藝術	\N	https://www.opentaipei.org/	部分免費	\N	Open House於1992年創始於英國倫敦，經歷30年持續不斷的演進，每年有超過200萬人次參觀全球各地的Open House活動。「打開台北」取得英國倫敦官方授權，於2020年首次舉辦，2022年將於11月12日至11月13日的48小時中，以「全民參與」的精神，「免費開放」隱藏於大台北都市中的上百個精彩空間，讓大家深入淺出的認識台北，了解建構台北日常生活的秘密。期望由點狀出發，串連成帶狀、擴及至網狀的影響力，由下而上串接專業者與大眾，讓你我成為參與形塑台北建成環境的夥伴之一。\n打開台北 | Open House Taipei 是一個介紹都市紋理、獨特空間的平台，今年的主題「社交台北」，邀請空間以及民眾來造訪、觀察、分享、玩耍，啟動關於空間再生、場域營造、設計與人的對話，在打開的路途上，感受空間如何連結人們，人們又如何形塑空間。	城市, 空間設計, 文化	\N	學齡前, 國小, 國高中, 大學以上	打開台北 Open Taipei
組織/社群	張廷安	https://i.imgur.com/1teM3vb.png	教育, 學習/教學工具	\N	https://www.instagram.com/distractionlovesme/	免費	\N	《 吳俊育教授研究團隊 》( 國立陽明交通大學教育研究所 )\n以人為中心的數位科技環繞個人學習環境(PLE)為場景。利用學習分析(Learning Analytics) 整合社交媒體於混成式教與學現場，檢視學習成效正負向因子、互動歷程、動力變化 (interaction progress and dynamics change)\n\n【數位分心介紹】\n學習者進行網路資訊搜尋與學習時，容易在學習任務中產生多工的現象(Wu, 020)。部分學習者還可能因社群媒體的干擾而導致注意力分散，中斷了正在進行中的學習任務，上述情形即為「數位分心」(Digital Distraction)(Wu, 2015, 2017)。 國立陽明交通大學教育所吳俊育老師所開發的線上學習注意力奮起與調節策略量表 (Online Learning Motivated Attention and Regulation Strategies, OL-MARS) ，量表目的為檢測學習者依據自己線上學習的經驗，反思自我的數位分心狀態。包含五個構念：自覺注意力中斷 (PAD)、社交媒體通知(SMN)、社交懸念 (LT)、行為策略(BS)、結果評鑑 (OA) 。 	數位分心, 專注力, 自覺注意力, 科技, 資訊科技, 科技資訊	\N	國小, 國高中, 大學以上	【防止數位分心】小狐狸實驗室 instagram
組織/社群, 課程/活動	袋鼠	https://i.imgur.com/R8g1mv9.png	綜合型學習資源	\N	https://tw.yohowto.com/	免費	\N	Yohowto 是一個為學習者和教育工作者而生的跨領域閱讀和自主學習個人知識管理和知識共學社群。我們透過科技、遊戲化和社群協作的力量，幫助使用者共享學習資源，輸出學習筆記，打造個人知識庫，進而成為一個終身學習者！	終身學習, 自我探索, 自我成長, 自主學習	\N	國小, 國高中, 大學以上	Yohowto 
課程/活動, 文章/書, 組織/社群	袋鼠	https://i.imgur.com/5UydSHf.jpg	教育, 綜合型學習資源, 學習/教學工具, 資訊與工程	\N	https://www.facebook.com/ChatGPTaiwan/	免費	https://www.youtube.com/watch?v=OdLuGtKYGbk	查特普拉斯，誕生於 2023 年 2 月 19 日，致力於讓台灣大眾的生活因 ChatGPT 而美好。\n查特普拉斯，是 Chat+ 的音譯。查特代表 ChatGPT 中的 Chat，因為 ChatGPT 最大的特色，就是能用聊天的方式跟 AI 對話。普拉斯則是 Plus（加），我們相信 ChatGPT 加上「生活」和「工作」的情境會更有意義，加上「行動」則有無限潛力。\n查特普拉斯由三位夥伴組成，我們因為對教育的熱忱而相識。我們沒有AI的技術背景，只是對查特感到無比好奇。（節錄自查特普拉斯團隊之願景）	ChatGPT, 數位工具, 終身學習, 人工智慧AI	\N	國小, 國高中, 大學以上	查特普拉斯
工具/操作	袋鼠	https://i.imgur.com/APQp74V.png	教育, 學習/教學工具, 綜合型學習資源	\N	https://www.explainthis.io/zh-hant	免費	\N	ExplainThis 是由三個好朋友共同發起的網站。我們是從分享免費的技術面試文章開始，秉持著回饋社群的心，將我們進入一線軟體大廠前準備的面試問題與詳解，分享給正在準備軟體前後端面試的人。除此之外，隨著 ChatGPT 等 AI 工具普及，我們陸續分享各類 AI 工具的使用教學，以及開源了各類 AI 應用的串接教學，讓沒有技術背景的人，也能把 AI 串接到各種工具上，這系列的教學在GitHub上累積數百星星。在過程中，我們也製作了一些好用的工具，讓不懂技術的人也能輕鬆上手 AI 工具。（簡介摘自網站）	人工智慧AI, ChatGPT, 數位工具, 程式設計, 面試	\N	學齡前, 國小, 國高中, 大學以上	ExplainAI工具箱
APP	羊羊	https://7n.bczcdn.com/static/static/illu-1.dae721b6.svg	語言與文學	\N	https://www.baicizhan.com/index.html	免費	\N	一億人都在用的英語學習大殺器！致力於為你解決背單詞難題，獨創圖背單詞學習法，趣味學英語；內涵海量詞庫，覆蓋全年齡段詞彙需求；配備單詞全解，發音例句輔助學習。（轉自官方描述）	英語, 單字	\N	國高中, 大學以上, 國小	百詞斬
提案/競賽, 課程/活動, 組織/社群	袋鼠	https://i.imgur.com/2bJQpsL.png	綜合型學習資源	\N	https://youthvolunteer.yda.gov.tw/	免費	\N	教育部青年發展署歷年致力於推展青年志願服務，成功累積並見證臺灣青年投入志願服務之經驗及風氣，然而面對臺灣快速的人口結構改變與社會變遷，新的社會議題與挑戰亦不斷產生。在過去推動志願服務的基礎上，除了持續整合縣市政府、民間團體及學校等資源共同推動青年志願服務外，也逐年藉由培力、參與、對話及合作的機制，並鏈結國內青年社會創新服務團隊，以青年持續的熱情及詮釋世界的方式，投入社會願景的創造、維繫及探討，塑造青年自主式社會行動的再生。（簡介摘自官網）	服務學習, SDGS, 永續發展	\N	國小, 國高中, 大學以上	教育部青年發展署青年志工中心
文章/書	袋鼠	https://i.imgur.com/uIdllh9.png	人文社會, 語言與文學	\N	https://www.sciencejournalforkids.org/	免費	\N	從生物，化學到科技，文章類型豐富，由美國青少年撰寫，再由科學家審稿，文章排版精美，賞心悅目，還貼心提供相關影片，不但能長知識，還能提升英文閱讀與聽力還有字彙量，一舉數得	英語, 閱讀, 寫作, 單字, 物理, 化學, 生物, 地科, 科學史, 生物化學, 心理學	\N	國小, 國高中, 大學以上	science journal for kids/teens
文章/書	袋鼠	https://i.imgur.com/fghPk8Z.png	語言與文學	\N	https://breakingnewsenglish.com/	免費	\N	Breaking News Eng;lish 是以新聞文章當作英文學習教材，目前已超過 2000 個課程，並按程度分成 7 個等級，不斷新增英文新聞文章，並提供文稿( Transcripts )、MP3 及相關測驗題下載，想要增進英文聽力與加強閱讀能力，絕對不要錯過 Breaking News English 網站的免費學習資源。（介紹摘自https://reurl.cc/p6Q5RQ）	英語, 聽力, 閱讀, 口說, 寫作, 單字	\N	國小, 大學以上, 國高中	Breaking English News
文章/書	袋鼠	https://i.imgur.com/H4lMnjw.jpg	資訊與工程	\N	https://blog.notimenocode.com/	免費	\N	在 2021 年首次接觸 NoCode 自動化工具時，像是發現新大陸般地震撼 — 因為即便不會寫程式，也能做出工程師開發的程式。我們抱持著對數位工具的好奇與熱情，持續挖掘不同 NoCode 工具的功能、研究串連多種應用程式打造順暢的自動化工作流程，並且已經實際應用到真實的企業 / 個人工作場景中。因為相信 NoCode 自動化工具可以為像我們一樣在時間及開發人力資源有限的你，快速且有效地提升工作效率、實現作業目標。我們將在 NoTime NoCode 持續和大家分享 NoCode 自動化工具，以及如何善用它來解決繁瑣任務、成為省時達人！（簡介摘自官網）	no code, 數位工具	\N	國高中, 大學以上	NoTime NoCode｜簡化工作流程
工具/操作	兔子姐姐	https://i.imgur.com/6j2CRiV.png	語言與文學, 教育, 人文社會	\N	https://xiaoxue.iis.sinica.edu.tw/	免費	\N	「小學堂文字學資料庫」(Xiaoxuetang Wenzixue Database,簡稱Xiaoxuetang)是一個形、音、義綜合的文字學資料庫，可提供使用者根據文字的形、音等屬性先檢索出字頭，再透過字頭連接到個別的形、音、義資料庫或字書索引。	中文字研究, 字音, 字形, 字義	\N	國高中, 大學以上	小學堂
課程/活動, 影片	袋鼠	https://i.imgur.com/QFER4VV.jpg	綜合型學習資源	\N	https://moocs.moe.edu.tw/moocs/#/home	免費	\N	「教育部磨課師平臺」除了收錄專項科技教育計畫所發展的磨課師課程，也盤整教育部不同計畫發展的數位學習課程（含磨課師），目前計有包含宗教哲學、自然科學、資訊工程、應用科學、醫學、食品家政、商學管理、社會科學、史地遊憩與人文藝術等十大類別、共643門課程。(簡介摘自https://reurl.cc/QXxO1M)	SDGS, 物理, 化學, 生物, 地科, 科技資訊, 醫學, 社會科學, 歷史, 地理, 人文, 藝術	\N	國高中, 大學以上	edu磨課師
組織/社群	袋鼠	https://i.imgur.com/dD2ZJP6.png	商業與社會創新	\N	https://visionuniontp.wixsite.com/socialdesign20	免費	\N	本活動奠基於昌吉街社區規劃工作室自2015年展開的駐點工作，在2018年駐點工作暫告段落之後，期望過去累積的社會關係、資源與議題觀察得以持續滾動。於是利用私人空間「貳拾號公民會所」作為基地，期望邀請更多夥伴、創造更多能量來實踐這場社會行動。(介紹摘自官網)	社會學, 社會參與, 社會設計, 永續發展, 設計思考, 社會議題, 社會創新	\N	國高中, 大學以上	社會設計實驗室
組織/社群	袋鼠	https://i.imgur.com/9KDEQkV.png	商業與社會創新	\N	https://www.ji-co-design.com/	免費	\N	一塊社計以研究及回應社會議題的專案執行為主要耕耘方向，藉由社會設計的工具提供地方組織（NPO/NGO）、政府部門、新創團隊、企業，為複雜的議題找尋以社群為本的改善施力點、創造共好且正義的設計新方向。(摘自官網介紹)	社會設計, 設計思考, 社會科學, 社會學, 社會議題, 社會創新	\N	國高中, 大學以上	一塊設計
文章/書	袋鼠	https://i.imgur.com/U5Eyv8I.png	商業與社會創新	\N	https://www.yesharris.com/learning-seo-menu/	免費	\N	此網站為【Harris先生顧問團隊】所創立，專門撰寫數位行銷、SEO搜尋引擎優化等文章	SEO, 搜尋引擎優化, 關鍵字, 演算法, 公關行銷	\N	國高中, 大學以上	SEO搜尋引擎優化：入門學習指南
組織/社群, 影片, 提案/競賽, 課程/活動	Tiff	https://i.imgur.com/gkgKwiL.png	教育, 資訊與工程	\N	https://sch001.g0v.tw/	免費	\N	零時小學校（Sch001）是g0v社群（零時政府）發起之數位公民教育專案，g0v社群十年來以「開源模式」、「行動主義」、「公民精神」，聚集超過12,000位跨域跨齡貢獻者，自發性提出超過880件開源協作專案，2019年發起聚焦於教育的零時小學校專案，盼以橋樑角色，將 g0v 社群與教育利害關係人連結，將代表數位原生世代的0與1放入代表教育的「學校（School）」，從零重新思考學校的意涵，同時也代表教育與數位社群的連結與協作。\n零時小學校將社群的豐富經驗轉化為「向社群學習，與社群共學」、專案導向的學習模式及資源，透過開設數位公民課程、舉辦營隊／黑客松、與學校合作課程及師培、舉辦專案孵化競賽日等方式，鼓勵更多人一起從零思考教育，讓「自主 Ｘ 協作 Ｘ 跨界 Ｘ 行動」專案在教學現場發生，跳脫學校框架，讓人人都可以在社群中自發性協作，用行動改變社會。	人工智慧AI, 資訊科技, 數位學習, 數位工具	不限	國高中, 大學以上	g0v 零時小學校 sch001
組織/社群, 課程/活動	Tiff	https://i.imgur.com/hcrGfH4.png	資訊與工程	\N	https://ai4kids.ai/online_courses/	部分免費	\N	AI4kids 是針對 K-1 到 K-12 學生所規劃的 AI 學習資源與課程平台，邀請專家學者開設知識與實作的課程，透過專業教學的帶領，啟發孩子對 AI 的好奇與想像力，並持續培育其 AI 創造的能力。	人工智慧AI	不限	國小, 國高中	AI 4 kids
組織/社群	Tiff	https://i.imgur.com/EYP5XKf.png	資訊與工程	\N	https://discord.gg/c5SVvNqg	免費	\N	在此國際 AI 學習社群中，你可以分享你的專案、有趣的研究論文、好的課程、提出問題，任何與人工智能、機器學習和深度學習領域相關的資訊都歡迎分享。（Discord 連結時常失效，若失效，請直接到 Discord 找 Learn AI Together 伺服器並加入）	人工智慧AI, 資訊科技	不限	國高中, 大學以上	Learn AI Together（Discord 社群）
課程/活動, 組織/社群	Tiff	https://i.imgur.com/lW7vYOn.jpg	教育, 資訊與工程	\N	https://aiacademy.tw/	部分免費	\N	台灣人工智慧學校將以最好的師資及與產學界的密切合作，進行人工智慧技術人才的密集培訓。讓不同專業領域的學員都能如虎添翼，以人工智慧加上原本的領域知識，具備協助各企業解決問題，以及帶領人工智慧團隊的能力。他們將擔任技術種子角色，深入台灣產業的各個層面，以其本身專業及人工智慧技術協助企業解決在邁向智慧化的過程中所面臨的難題。	人工智慧AI, 資訊科技	不限	國高中, 大學以上	台灣人工智慧學校
組織/社群	Tiff	https://i.imgur.com/DWKjKJo.png	資訊與工程	\N	https://www.facebook.com/groups/aigcstation	免費	\N	此社群為 Generative AI 年會 的相關社團，歡迎社團成員分享生城式 AI 相關新聞、應用、案例等資訊。	人工智慧AI, 資訊科技, 科技資訊	不限	國小, 國高中, 大學以上	AI 詠唱者交流（AIGC 人工智慧產製內容）FB社團
工具/操作	潔伃	https://i.imgur.com/qghUw1k.png	綜合型學習資源, 資訊與工程	\N	https://www.naviai.cn	免費	\N	此網站整理 AI 於各領域應用之工具，包含聊天與助手、寫作與文本、圖像與設計、商業管理、教育與學習、音頻與視頻、開發與編程、遊戲與娛樂、醫療與健康等面向。	人工智慧AI, 數位工具, 寫作, 設計, 商業, 教育, 程式開發, 英語, 健康, 遊戲	不限	學齡前, 國小, 國高中, 大學以上	Navi AI 導航（AI 於各領域應用之工具列表）
影片	Leo	https://i.imgur.com/nenEOAx.png	資訊與工程	\N	https://www.youtube.com/@lexfridman	免費	\N	AI/Tech 各領域專家訪談系列	人工智慧AI, 資訊科技	不限	大學以上, 國高中	Lex Fridman on YouTube（AI/Tech 各領域專家訪談系列）
影片	Tiff	https://i.imgur.com/Aa93X1c.png	資訊與工程, 教育	\N	https://www.youtube.com/watch?v=it0N6XnW7ZY	免費	\N	Philippa Hardman博士是劍橋大學的學者，也是教育技術領域的思想領袖。她花了20多年的時間研究人類學習的科學，並在此基礎上開發了一種以證據為基礎的學習體驗設計方法，被稱為DOMS™️。	人工智慧AI, 資訊科技, 科技資訊	不限	大學以上, 國高中	The AI Education Revolution is Coming – or is it? | Dr. Philippa Hardman | TEDxSantaBarbaraSalon
影片	Leo	https://i.imgur.com/YESPo4k.png	資訊與工程	\N	https://www.youtube.com/@AndrejKarpathy	免費	\N	OpenAI 工程師線上教學	人工智慧AI, 資訊科技	不限	大學以上, 國高中	Andrej Karpathy on YouTube（OpenAI 工程師線上教學）
影片	Leo	https://i.imgur.com/4KNzMsg.png	資訊與工程	\N	https://www.youtube.com/@ai-explained-	免費	\N	AI新聞＋技術分析	人工智慧AI, 資訊科技	不限	大學以上, 國高中	AI Explaine on YouTube
影片	Leo	https://i.imgur.com/EkeJgWJ.png	資訊與工程	\N	https://www.youtube.com/watch?v=vw-KWfKwvTQ	免費	\N	哈佛演講：GPT-4 - How does it work, and how do I build apps with it? - CS50 Tech Talk	人工智慧AI, 資訊科技	不限	大學以上, 國高中	CS50 @Harvard 
課程/活動	Leo	https://i.imgur.com/PRjWMcW.png	資訊與工程	\N	https://unity.com/products/machine-learning-agents	免費	\N	做 AI 遊戲	人工智慧AI, 資訊科技, 遊戲	不限	大學以上, 國高中	Unity ML-Agents（做 AI 遊戲）
影片	Leo	https://i.imgur.com/5UUkyle.png	資訊與工程	\N	https://www.youtube.com/@b2stud	免費	\N	AI 強化學習訓練動畫	人工智慧AI, 資訊科技	不限	大學以上, 國高中	b2studios – YouTube（AI 強化學習訓練動畫）
影片	Leo	https://i.imgur.com/cvj5A5j.png	資訊與工程	\N	https://www.youtube.com/@aiwarehouse	免費	\N	AI 強化學習訓練動畫	人工智慧AI, 資訊科技	不限	大學以上, 國高中	AI Warehouse – YouTube（AI 強化學習訓練動畫）
影片	Leo	https://i.imgur.com/NMn0s45.png	資訊與工程	\N	https://www.youtube.com/@RobertMilesAI	免費	\N	AI 安全研究員 YouTuber	人工智慧AI, 資訊科技	不限	大學以上, 國高中	Robert Miles AI Safety – YouTube（AI 安全研究員 YouTuber）
課程/活動	Leo	https://i.imgur.com/cphZrMm.png	資訊與工程	\N	https://spinningup.openai.com/en/latest/	免費	\N	《深度強化學習快速入門》是OpenAI提供的教育資源，讓您更容易學習深度強化學習（深度RL）。\n對於不熟悉的人來說，強化學習（RL）是一種通過試錯方法教導智能體如何解決任務的機器學習方法。深度RL則是將RL與深度學習結合在一起。\n本課程包含各種有用的資源，包括：\n1.強化學習術語、算法類型和基礎理論的簡短介紹；2.一篇關於如何成為強化學習研究角色的文章；3.按主題整理的重要論文的精選清單；4.一個有著清晰文檔的程式庫，其中包含關鍵算法的短小、獨立實現；5.以及一些作為熱身的練習題目。	人工智慧AI, 資訊科技	不限	大學以上, 國高中	OpenAI “Spinning Up”
課程/活動	Leo	https://i.imgur.com/93fSEqI.png	資訊與工程	\N	https://web.stanford.edu/class/cs224n/	免費	\N	Stanford 的自自然語言處理（NLP）課程。NLP是人工智能（AI）的重要組成部分，模擬人們分享訊息的方式。近年來，深度學習方法在許多 NLP 任務上取得了非常高的性能。在這門課程中，學生將深入了解用於 NLP 的尖端神經網絡。	人工智慧AI, 資訊科技, NLP	不限	大學以上, 國高中	Stanford cs224n – NLP
影片, 課程/活動	Leo	https://i.imgur.com/aZsBnDu.png	資訊與工程	\N	https://fourthbrain.ai	部分免費	\N	ML/AI 專業訓練，有提供一些免費Webinars	人工智慧AI, 資訊科技, 口說	不限	大學以上, 國高中	FourthBrain（ML/AI 專業訓練）
文章/書, 課程/活動	Leo	https://i.imgur.com/xdRurki.png	資訊與工程	\N	https://www.promptingguide.ai	免費	\N	prompt engineer 線上攻略	人工智慧AI, 資訊科技	不限	大學以上, 國高中	Prompt Engineering Guide
課程/活動, 影片	Leo	https://i.imgur.com/9TjkiaZ.png	資訊與工程	\N	https://huggingface.co/learn	免費	\N	最大 AI Open-source 平台創的 2 個課程	人工智慧AI, 資訊科技	不限	大學以上, 國高中	Hugging Face – Learn
課程/活動, 影片	Leo	https://i.imgur.com/pC6g6b4.png	資訊與工程	\N	https://www.coursera.org/collections/best-machine-learning-ai	免費	\N	Coursera AI 精選課程	人工智慧AI, 資訊科技	不限	大學以上, 國高中	Coursera Best of ML/AI
文章/書, 工具/操作	Tiff	https://i.imgur.com/O6D1SMj.png	資訊與工程, 教育	\N	https://gamma.app/docs/AI-phh7i67cg4hx4qu?fbclid=IwAR1x3bBoKxqU1IDRDj-ocPzKNiy9ZvqEO5BLjxNBnVW-7bXHLovuisR1oyU&mibextid=Zxz2cZ	免費	\N	宜蘭中山國小林穎俊老師提出，內容包含：認識師生可用的Prompt、如何問出更好的問題、AI對教學現場的影響、如何應用AI幫助孩子學得更好？，除給予架構，老師也提供實際使用的案例。	人工智慧AI, 資訊科技, 教案, 教育	不限	國小, 國高中, 大學以上	如何問出更好的問題？AI世代師生都必須面對的挑戰-by林穎俊老師
影片	Tiff	https://i.imgur.com/bPTmt7q.png	資訊與工程	\N	https://www.edx.org/course/cs50s-introduction-to-artificial-intelligence-with-python	免費	\N	哈佛大學課程「使用Python介紹人工智能」探索了現代人工智能基礎的概念和算法，深入研究了產生遊戲引擎、手寫識別和機器翻譯等技術的思想。通過實作，學生們將接觸到圖搜索算法、分類、優化、強化學習等人工智能和機器學習領域的理論，並將其應用於自己的Python程序中。課程結束時，學生們將獲得機器學習庫的使用經驗，並具備設計自己智能系統的人工智能原理知識。	人工智慧AI, 資訊科技	不限	大學以上, 國高中	CS50's Introduction to Artificial Intelligence with Python
影片	Tiff	https://i.imgur.com/oVPhXQH.png	資訊與工程	\N	https://www.youtube.com/playlist?list=PLWuYED1WVJIPHJLk84wWQbzeZcWLt5rwU	免費	\N	此動畫系列是根據聯合國教科文組織的出版品《為知識社會指導人工智能和先進的訊息通信技術--權利、開放、獲取和多方利益相關者的視角》製作，每一集都包含該出版品中的重點。	人工智慧AI, 資訊科技	不限	學齡前, 國小, 國高中, 大學以上	聯合國教科文組織《7 minutes to understand AI》影片
文章/書, 影片	Tiff	https://i.imgur.com/0M6Wnx3.png	資訊與工程	\N	https://www.unesco.org/en/artificial-intelligence	免費	\N	提供 AI 在各不同領域包含教育的應用以及案例故事，適合一探各國與各領域在 AI 發展情況的您。（文字摘自教育部中小學數位教學指引1.0版）	人工智慧AI, 資訊科技	不限	學齡前, 國小, 國高中, 大學以上	聯合國教科文組織《AI 智能》
工具/操作	Tiff	https://i.imgur.com/UTaPqI9.jpg	資訊與工程	\N	https://panmarket.asia/product/%E6%B5%B7%E9%9C%B8-codingocean-%E6%93%B4%E5%85%85%E7%89%88/	需付費	\N	《Coding Ocean：海霸》將 C++ / Javascript / Python / iOS Siri...等程式角色帶入，讓孩子學會程式背後的『運算邏輯』，用四大程式邏輯結合遊戲規則與故事，以「對戰、闖關」等好玩易學的模式，打造全新的程式世界，透過藏寶圖關卡，培養運算思維，協助孩子能有更完整的邏輯訓練。	資訊科技, 程式設計, 人工智慧AI	不限	國小, 學齡前	桌遊《Coding Ocean : 海霸》
文章/書	Tiff	https://i.imgur.com/TCKTxcY.png	資訊與工程, 教育	\N	https://g0v.hackmd.io/kayNDqm2RemwG2mfWDGxEQ?view	免費	\N	紀錄台灣不同大專院校因應 chatGPT 的相關政策與框架指引。	人工智慧AI, 資訊科技	不限	學齡前, 國小, 國高中, 大學以上	各大學因應生成式 AI / ChatGPT 政策彙整
文章/書	Tiff	https://i.imgur.com/TbuufgR.png	資訊與工程	\N	https://market.cloud.edu.tw/list/ai.jsp	免費	\N	由全台各地教師針對 AI 協同而成的教案與教材，從國小至高中之教案皆有，皆以初探人工智慧，讓學生對人工智慧有基本理解，引發學生學習動機為目標設計。多數內容包含人工智慧簡介、背景知識、監督式學習及非監督式學習等核心概念。	人工智慧AI, 資訊科技, 教案, 教材	不限	國小, 國高中	和AI做朋友：人工智慧中小學教學示範例（教育雲）
文章/書	Tiff	https://i.imgur.com/n1UUwT0.png	資訊與工程	\N	https://www.khanacademy.org/college-careers-more/ai-for-education	免費	\N	可汗學院希望能以文章形式的課程，與學習者一同探討「人工智能對教育的未來意味著什麼？」。此堂迷你課程仍在發展中，課程將集中於兩個主軸進行探討：\n1）與ChatGPT 相似的大型語言模型（LLMs）改變全球教育實踐和學習成果方面的潛力\n2）在 "人工智能時代”，如同可汗學院般的教育技術如何被用來支持教師和學習者。\n課程由可汗學院提出提問與建議，學員可於下方進行討論。\n目前已有第一單元，內容包含：「歡迎來到教育的未來：用於教育的人工智能」、「新時代的新工具：用於教育的人工智能」、「課堂上的人工智能」。	人工智慧AI, 資訊科技, 教育	不限	國高中, 大學以上	AI for education-Khan Academy
影片	Tiff	https://i.imgur.com/aCojqSo.png	資訊與工程	\N	https://www.youtube.com/@HungyiLeeNTU/featured	免費	\N	台大電機系副教授李宏毅YouTube頻道中包含許多機器學習相關課程，內容深入淺出，包含概論與技術教學。	人工智慧AI, 資訊科技, ChatGPT	不限	國高中, 大學以上	台大李宏毅老師 Youtube 頻道
課程/活動	Peggy	https://i.imgur.com/HZKyttL.png	資訊與工程	\N	https://www.elementsofai.com/	免費	\N	The Elements of AI 是由 MinnaLearn 和赫爾辛基大學建立的一系列免費線上課程。鼓勵大家了解 AI 是什麼、AI 可以（和不能）做什麼，以及如何建立 AI 的方法，課程將理論與練習結合，可以按照自己的進度完成。	人工智慧AI, 資訊科技, 口說	不限	國高中, 大學以上	Elements of AI
課程/活動	Peggy	https://i.imgur.com/zYMd7Gs.png	資訊與工程	\N	https://www.deeplearning.ai	部分免費	\N	DeepLearning.AI 是一家教育科技公司，主要提供 AI 課程，協助學習者進入 AI 工作領域。	人工智慧AI, 資訊科技, 口說	不限	國高中, 大學以上	DeepLearning.ai 
文章/書	Tiff	https://i.imgur.com/hkl5swS.png	資訊與工程	\N	https://hackmd.io/@ejc/2023gaiconf	免費	\N	Generative AI 年會匯集來自各個領域的專業人士、開發者、企業家，共同交流、互相學習、一同探索最新的 Generative AI 的趨勢應用。此份共筆記錄各講者演講重點以及簡報。若想知道更多資訊可以加入「AI 詠唱者交流」FB 社團。	人工智慧AI, 資訊科技	不限	國高中, 大學以上	AIGC 詠唱者年會共筆
組織/社群	袋鼠	https://i.imgur.com/qc4ovLM.png	教育, 綜合型學習資源	\N	https://www.carry-your-career.com/	免費	\N	我們是「職」凱瑞你，是一個由高中生發起的教育專案。主要針對國小和國中的學生，統整職業相關影片跟科系及生涯資源。	生涯探索, 職涯	\N	國高中, 大學以上, 國小	「職」凱瑞你
Podcast	袋鼠	https://i.imgur.com/pe6QDJH.jpg	教育, 人文社會	\N	https://open.firstory.me/user/fm977edu	免費	\N	「教育不一樣」把節目視為一個人的學習過程，透過高中、學習、大學、生涯四大面向來解析教育如何不一樣。期待透過主持人-藍偉瑩與來賓多元面向的分享，讓家長、學生在面對選擇時，可以更有把握！	教育, 生涯探索, 自主學習	\N	國小, 國高中, 大學以上	教育不一樣
文章/書, 組織/社群	袋鼠	https://i.imgur.com/caLtykF.png	綜合型學習資源	\N	https://happyfish0109.wixsite.com/yuaran	免費	\N	你是否渴望累積一定閱讀量，但總是沒有時間靜下來好好讀一本書或電影？\n你是否希望能保持關注時事新知的習慣，但不知應該了解多少、從何開始？\n你是否在生活中有一些無解難題，想要獲得意見或是解答可能性？\n這個網站是專門設計給高中生的綜合資訊彙整平台，使生活忙碌的你/妳，\n有一個了解世界的方式，雙向對話的窗口，\n若有任何話不知在生活中從何講起，也歡迎點擊投稿箱與我們聊聊天～（簡介摘自官網）	閱讀	\N	國高中, 大學以上	閱然
組織/社群	袋鼠	https://i.imgur.com/WWJNn2h.jpg	教育	\N	https://teachersblog.edu.tw/	免費	\N	科技日新月異，世界瞬息萬變，教育的觀念也不斷更新，教師的每一天都在以身為一個「教育家」而努力。除了職業所需的教育愛專業力與道德敏感力之外，還必須擁有思考力、實踐力、學習力、未來力，才能因應未來的社會變遷與學校教育發展。這是一條充滿信念和愛的路程，極具挑戰卻無私無悔，而「教育家」網站則是這條路上的最佳後盾，匯聚了教育典範、新知、心得與技巧，讓所有奉獻教育熱情的「教育家」彼此凝聚與培力，共同邁向一個又一個的創新里程碑。（簡介來源自官網）	教學方法, 教育, 教育政策, 教育故事, 班級經營	\N	國高中, 大學以上	教育家
影片	袋鼠	https://i.imgur.com/nGZY1V7.png	人文社會	\N	https://sites.google.com/ntu.edu.tw/losersociology/%E9%A6%96%E9%A0%81?authuser=0	免費	\N	失敗者社會學是李明璁老師在 2017 年（時任台大社會學系助理教授）開設的無學分自主免費課程，由學生自主整理、公開提供講綱及課程錄影；這門課開宗明義是「討論失敗者」(of losers) 也「獻給失敗者」(for losers) 的社會學課程，從第一講即強調社會學是一門讓大家理解「生活有各式各種不同樣貌」的學問。這裡所謂「失敗者」泛指各種排除在傳統價值系統成功者之外的人，聽障者（及各種身心障礙者）符合這個定義，提供聽障者照護服務（而賺不了大錢、沒有崇高社會地位的）聽力師也符合這個定義。(簡介摘自https://reurl.cc/EozO41)	社會學, 社會議題, 哲學, 政治, 經濟, 文化, 歷史	\N	國高中, 大學以上	失敗者社會學
課程/活動	\N	https://i.imgur.com/4KFiEwE.png	資訊與工程	\N	https://pwn.college/	免費	\N	Binary Exploitation 全面教學，包含 Buffer Overflow, ROP, Linux Kernel, Windows Binary 等，個課程具有循序漸進的 Lab 可供練習。	Linux, 程式設計	\N	國高中, 大學以上	pwn.college
組織/社群	袋鼠	https://i.imgur.com/VXtlXaP.png	綜合型學習資源	\N	https://line.me/ti/g2/D_dXFUJg_EzpEOk6v8HmL4aQJT1sSUncGHzhng?utm_source=invitation&utm_medium=link_copy&utm_campaign=default	免費	\N	「世界上活動資源很多，就看你會不會找！」米拉轟炸庫是由一位自學生所創立的，希望能幫助大家利用資源去自主學習，開闊視野，並且能主動追蹤相關社群，主動尋找自己像要的活動。	各式活動, 跨領域, 自主學習, 終生學習, 素養教育	\N	國高中, 大學以上	米拉轟炸庫
影片, 組織/社群	袋鼠	https://i.imgur.com/NkgMeok.png	教育, 人文社會, 資訊與工程, 學習/教學工具, 商業與社會創新, 綜合型學習資源	\N	https://www.ilink-hss.org/	免費	\N	「把真實產業實務與社會待解決問題納入課程架構中」\n透過跨領域專題實作、導入業師指導，讓學生提出解決問題的初步構想，並進一步規劃專案，引入資源實作或是參加競賽，以開拓學生眼界及格局。（簡介摘自網站）	永續發展, 數位工具, 自主學習, 跨領域, 教師培力, 人工智慧AI	\N	國高中, 大學以上	iLink人文社會與產業實務創新鏈結計畫
文章/書	羊羊	https://www.languageguide.org/images/main/6884132132_6e2d05e036_o.jpg	語言與文學	\N	https://www.languageguide.org/	免費	\N	學習語言沒有什麼方向嗎？這裡可以搜尋全球的語言，讓你知道你可以加強哪些部分	英語, 聽力, 閱讀, 口說, 寫作, 日文	\N	國高中, 大學以上, 國小	languageguide
影片	羊羊	https://crackieltswithrob.com/uploads/images/logvnew.jpg?ezimgfmt=rs:400x76/rscb1/ngcb1/notWebP	語言與文學	\N	https://www.youtube.com/@CrackIELTSwithRob	免費	\N	提供很多免費的雅思練習題目	雅思, 英語, 聽力, 閱讀, 口說, 寫作, IELTS	\N	國高中, 大學以上	Crack IELTS with Rob
課程/活動, 工具/操作	Emily Liao 廖之謙	https://i.imgur.com/g0XzAjO.png	綜合型學習資源, 人文社會	\N	https://ttpsince2000.org/	免費	\N	我們的理念\n➤內心世界-帶著熱情去改變\n台灣一直以來不斷地在鼓勵全民與國際接軌，在認識自己土地國家的同時，希望我們能具備基本的國際觀素養，放眼未來並且和世界接軌，除了關心我們所處的台灣外，了解地球的另一端正在發生什麼，更是身為地球村一份子的我們需要關懷的事。\n➤Generation Alpha-翻轉未來觀點\n我們希望藉由 The Turning Point翻轉點，將國際知識向下紮根，帶領孩子們從新聞時事、國際關係、世界議題中，增加國際知識涵養，了解世界脈動；進而累積歸納論述及獨立思考的能力，演繹激發出更多創新觀點，讓「Generation Alpha 阿法世代」出生在21世紀世代的孩子，為世界帶來更多知識的累積，文化包容和人文素養，以及對世界的關懷。\n➤思者傳道-有思想就可以是老師\n韓愈說：「師者，所以傳道授業解惑也」，我說：「思」者就可以傳道。打開 The Turning Point 翻轉點我們都是老師！翻轉點從孩子的思考邏輯出發，將錯綜複雜艱深難懂的國際事件，轉化為孩子能理解的文字，利用生動活潑的多元操作，帶領孩子們認識國際議題，並於課後一起進行深入的探討和思考，為他們埋下關心世界的種子。	國際時事, 國際議題, 科技資訊, 流行文化, 自主學習, PBL, 軍事戰爭, 地緣政治, 國際素養	\N	國小, 國高中	The Turning Point 翻轉點
工具/操作	羊羊	https://zeroday.hitcon.org/images/favicon/fb-image.png	資訊與工程	\N	https://zeroday.hitcon.org/	免費	\N	ZeroDay 是一個銜接資安專家與組織間的良性溝通橋樑的漏洞提報平台，專門協助接獲漏洞通報並提報予組織和修正漏洞等服務。	資訊安全	\N	國高中, 大學以上	zeroday
組織/社群	袋鼠	https://i.imgur.com/X6WKi7s.png	綜合型學習資源, 運動/心理/醫學	\N	https://www.detourdyl.com/?fbclid=IwAR2EFUgeLfkNmD82jgNJKVV7ooUyTGNDmrwRhu9azTtiFSUGaylbTn7pNFU	免費	\N	Detour 原意為「繞道」。我們常因不確定目標而做許多嘗試，卻總覺得繞了遠路。面對生命的不確定性，我們提醒自己，繞路僅是常態，並不可怕。Detour希望透過設計人生觀點，成為大家在人生探索路上的陪伴。（簡介摘自粉專）	生涯探索, 人生設計, 設計思考	\N	國小, 國高中, 大學以上	Detour人生設計團隊
組織/社群	\N	https://i.imgur.com/CT5iCov.png	數學與邏輯	\N	https://www.worldpuzzle.org/	免費	\N	世界盃解謎聯盟的主網站	謎題	\N	國小, 國高中, 大學以上	World puzzle federation
組織/社群	袋鼠	https://i.imgur.com/7LP9fpq.png	綜合型學習資源, 教育	\N	https://www.children.org.tw/	免費	\N	兒福聯盟在台灣尚無兒童保護法令的年代成立，從「給孩子一個更好的世界」到「與孩子共創更好的世界」的願景轉變，三十年來，我們秉持初衷，始終是服務與倡議雙軌並進的兒少組織，敏銳地發現新的兒童需求，也深知台灣兒童已有潛能改造世界。與時俱進，是兒福聯盟不變的組織基因和工作態度。過去我們重視物質補給、家庭功能和情感支持，面對科技網路時代，終身學習是人類的基本能力，兒盟將加強重視培育照顧者成為育兒家，與社會共同打造創傷知情的環境，讓所有的兒童達到認識自己，愛己愛人，為社會公益付出的境界。（簡介摘自兒福聯盟官網）	社會議題, 社會創新, 兒童福利, 社會參與, 傳播產業	\N	學齡前, 國小, 國高中, 大學以上	兒福聯盟
Podcast	袋鼠	https://i.imgur.com/JzRw13B.png	運動/心理/醫學	\N	https://whatafterpsychology.my.canva.site/#page-0	免費	\N	你想念心理學，但是擔心找不到工作嗎？來聽聽這些心理人的故事，讓你更有信心投向心理學的懷抱	心理學, 生涯探索	\N	國高中, 大學以上	念了心理學，然後呢？
Podcast	袋鼠	https://i.imgur.com/l8b9SqL.png	綜合型學習資源, 教育, 自然科學	\N	https://podcasts.apple.com/tw/podcast/%E9%AB%98%E6%A0%A1%E5%8C%96%E5%AD%B8%E4%BA%8B/id1610255177	免費	\N	是一個能帶給你高中校園新鮮事、教育時事\n以及化學課程新觀點與科普小知識的播客頻道\n📻目前每週三會有固定的更新內容！\n📻不定期會有來賓訪談的節目播出喔！\n喜歡我的節目的朋友，記得一定要訂閱喔！\n才不會錯過每次精彩的節目內容👍（簡介摘自高校化學事的podcast）	教育, 化學, 高中校園, 生涯探索, 科系探索	\N	國高中, 大學以上	高校化學事
組織/社群	袋鼠	https://i.imgur.com/2iQ2jUe.png	綜合型學習資源	\N	https://www.ementor.com.tw/	部分免費	\N	Mentor門拓一站式學習平台，是由兩位高中教師創辦的，因為看到學生系統性探索的缺乏，因此辭去教職創立門拓，希望提供108課綱的高中生，學群探索、自主學習、一般課程加深加廣的智慧整合學習服務平台。（簡介摘自：https://reurl.cc/OVVr6D）	生涯探索, 學群探索, mentor, 高中課程	\N	國高中, 大學以上	Mentor門拓一站式學習平台
組織/社群, 影片	袋鼠	https://i.imgur.com/zOPzlgo.png	人文社會, 運動/心理/醫學	\N	https://consumer.concepts.tw/%E9%A6%96%E9%A0%81	免費	\N	此網站為台北大學資管所的汪志堅老師，網站內提供關於消費者心理學的相關影片、個案研討、習題以及相關思考問題，想了解消費者心理學的你，絕對不要錯過囉~	消費者心理, 行為研究	\N	國小, 國高中, 大學以上	消費者行為
組織/社群	nobody	https://i.imgur.com/ZS1IQQz.png	資訊與工程	\N	https://www.facebook.com/dscareer	免費	\N	📊 分享 #資料科學 領域趨勢\n👨‍💻 交流 #網頁開發 技術發展\n💡 探索 #科技職涯 斜槓人生\n💥 持續 #技術培訓 社群經營	資料科學, 大數據, Python, 人工智慧AI, 程式設計	\N	國高中, 大學以上	資料科學家的工作日常
課程/活動	袋鼠	https://i.imgur.com/NedtjRo.jpg	資訊與工程	\N	https://www.facebook.com/coscup	免費	\N	無論您是開放原始碼的開發者、推廣者、使用者、還是想了解軟體的新手，都歡迎您來參加為開放原始碼開發者、使用者和推廣者舉辦的「開源人年會」。	開放原始碼, 資料庫, 資訊科技	\N	大學以上, 國高中	COSCUP
課程/活動	袋鼠	https://i.imgur.com/FDKZ20M.jpg	資訊與工程	\N	https://www.facebook.com/SITCONtw	免費	https://www.youtube.com/@SITCONtw/featured	學生計算機年會（Students’ Information Technology Conference）自 2013 年發起，以學生為本、由學生自發舉辦，長期投身學生資訊教育與推廣開源精神，希望引領更多學子踏入資訊的殿堂，更冀望所有對資訊有興趣的學生，能夠在年會裏齊聚一堂，彼此激盪、傳承、啟發，達到「學以致用、教學相長」的實際展現。\n在 SITCON 的第 X 週年，期望我們秉持初衷——讓學生們分享與交流知識，把各地學生串連起來的 X 字路口——也期望每人皆能在與大家的聊天與討論之中，找到自己的方向、熱情。（簡介摘自官網）	邏輯, Python, Java, 程式設計, C/C++, HTML/CSS, 資料庫, 網頁設計, 科技, 大數據, 物聯網, 資訊科技	\N	國高中, 大學以上	SITCON 學生計算機年會
組織/社群, 文章/書	\N	https://i.imgur.com/SJFzQg9.jpg	人文社會	\N	https://kamatiam.org/	免費	\N	「歷史學柑仔店」是一個自發的寫作社群，也是一扇窗口，讓歷史學者與社會大眾分享各自的研究成果。沒有聚會、沒有宣言與旗幟、也沒有機構或學會支持，組織十分鬆散。就連臉書粉絲頁的介紹也只有一句：「我們是一群嘗試從臺灣思考歷史的書寫的史學界夥伴，我們成立了一個「歷史學柑仔店」（kám-á-tiàm）部落格。」\n似乎太簡單，但接著要寫些什麼，就令人煞費心思了。後現代史學之後，歷史研究進入百家爭鳴且難以定義的境地，唯一沒有爭議的是「嘗試從臺灣思考歷史的書寫」，就先這樣吧！(簡介摘自博客來)	歷史, 政治, 經濟, 社會議題, 法律, 文化, 公民參與	\N	國小, 國高中, 大學以上	歷史學柑仔店
組織/社群	袋鼠	https://i.imgur.com/a31n18h.png	語言與文學	\N	https://tln.nmtl.gov.tw/ch/index.aspx	免費	\N	本網站為台灣文學館所建置。內容以文學史年表為主要架構，呈現台灣文學各發展時期重要之人、事、物。使用者可再以年表內容，串接「台灣2007作家作品目錄系統」、「台灣現當代作家研究資料庫」、「台灣文學研究人力論著目錄資料庫」，及辭條釋義，延伸查詢相關資料。總計包含約2500多位作家個人資料、作品出版資料，310位作家相關評論、學術論文，152位台灣文學研究者的個人資料、研究論著。網站並提供館內影音屋、展覽場訊息，及電子e書房、網路、資料庫等數位學習資源訊息，是認識台灣文學發展之最佳指引。(簡介來源自官網)	文學, 地景, 文學歷史, 歷史	\N	國小, 國高中, 大學以上, 學齡前	台灣文學網
組織/社群	袋鼠	https://i.imgur.com/dHXnOgS.png	人文社會	\N	https://www.facebook.com/withredtw	免費	\N	2019年底成立，小紅帽是臺灣第一個專注於推動月經平權的非營利組織，致力於透過社福、教育、研究、倡議消弭月經貧窮與汙名，也在全臺灣推動從小學到大學，更全面、完整、不分性別的月經教育，及營造月經友善環境。	月經平權與教育, NPO, 社會議題, 公民參與	\N	國小, 國高中, 大學以上	小紅帽 With Red
工具/操作	袋鼠	https://i.imgur.com/WasQE1b.png	語言與文學	\N	https://skell.sketchengine.eu/#home?lang=en	免費	\N	Sketch Engine是一個比字典還強大的功能，他除了會有例句之外，還會告訴你英文單字的搭配用語、相似詞等等。	單字, 英語	\N	國小, 國高中, 大學以上	Sketch Engine
組織/社群	袋鼠	https://i.imgur.com/o60GGGr.jpg	教育, 人文社會, 自然科學, 綜合型學習資源	\N	https://ubrand.udn.com/ubrand/index	免費	\N	本網站是由聯合新聞網旗下的一個網站，裡面有許多社會創新、永續、教育與許多議題等相關文章資訊，對於關注社會上種種議題的人來說，是一個很棒的網站。	永續發展, 教育, 社會議題, 終身學習, 經濟, 法律, 文化, 歷史, 地理, 物理, 化學, 生物, 地科	\N	國小, 國高中, 大學以上	倡議+
組織/社群	袋鼠	https://i.imgur.com/sW7xqQv.png	運動/心理/醫學	\N	https://www.facebook.com/profile.php?id=100063625855579	免費	\N	「小鱷魚的諮商小教室」會分享許多諮商相關的概念，包含諮商的學派、倫理以及心理相關的故事	諮商, 心理學, 心理治療	\N	國小, 國高中, 大學以上	小鱷魚的諮商小教室
組織/社群	袋鼠	https://i.imgur.com/sjJPEjS.png	綜合型學習資源	\N	https://mutahead.com/	部分免費	https://www.youtube.com/watch?v=nVYHj1ptXA4	「這個社會，太多教育家了。但人人都可以成為學習家！致力於打造新世代的學習場域」學習家小羊看見台灣教育的問題，因而開始舉辦許多場線上講座、問題解決課程與中學生的挑戰賽，幫助學生自我成長、學會解決未來面臨的問題。	自我探索, 自我成長, 自媒體, 教育, 民主教育, 教育創新, 素養教育	\N	國高中, 大學以上	學習家小羊
工具/操作	Pei	https://i.imgur.com/aEuyFwP.jpg	藝術, 商業與社會創新, 學習/教學工具	\N	https://vivipic.com/	部分免費	\N	Vivipic-台灣行銷人的免費線上平面設計工具。\n針對「台灣行銷人」設計的平面設計工具－Vivipic，不僅免下載、可直接在網頁上進行編輯製作，還有在地化的模板讓你一鍵套用。\n版型操作相似於 canva ，但差別canva本身是英文版起家，許多版型都是源自於英文版面設計，若改成中文，空間平衡上會需要多加調整。但vivipic優點在於針對中文字元寬度與英文不同，版面設計上更貼近於中文圈，同時也支援較多中文字型，推薦給需要做中文版行的行銷人、快速簡報設計、海報製作等。	公關行銷, 設計, 藝術, 數位工具	\N	國小, 國高中, 大學以上, 學齡前	Vivipic
組織/社群	\N	https://i.imgur.com/3f04PvZ.png	資訊與工程, 商業與社會創新, 綜合型學習資源	\N	https://bap2.cm.nsysu.edu.tw/https://bap2.cm.nsysu.edu.tw/	免費	\N	本網站包含所有商業管理、大數據、行銷與資料科學等課程。而裡面也有許多學習地圖、資源與應用。更還有開放資料等你益起來研究。	大數據, 公關行銷, 資料科學, 金融, 財務, 會計, 數據分析	\N	國高中, 大學以上	商業大數據平台
組織/社群	袋鼠	https://i.imgur.com/Ml9pj4b.png	藝術, 運動/心理/醫學	\N	https://www.uxpin.com/studio/ebooks/	免費	\N	是一個有豐富UX內容（研討會/電子書/原型工具/課程）的平台，也有許多實用的UX ebook可以免費下載，對於手機或網頁設計、專案管理以及設計流程的討論很多。(簡介節錄自https://reurl.cc/GX89rA)	UIUX, 使用者研究設計, 設計, 設計思考	\N	國高中, 大學以上	UX pin
組織/社群	\N	https://i.imgur.com/vf9rNQo.png	藝術, 運動/心理/醫學	\N	https://hackdesign.org/	免費	\N	Hack Design 是一個收錄一些關於 UI、UX 與設計相關的教學的網站，你可以依順序看完每個內容的介紹，也可以依據自己需求找分類的文章來看。（簡介摘自https://tools.wingzero.tw/article/sn/1344）	UIUX, 設計, 藝術	\N	國高中, 大學以上	Hack design
組織/社群	袋鼠	https://i.imgur.com/btiCeWK.png	綜合型學習資源	\N	https://becomingaces.com/	免費	\N	我們尋找35歲以下正在改變社會的年輕人，呈現他們的故事，發揚他們的精神，把成功的定義還給每一個人。\n《未來大人物》是最早期關鍵評論網發展時萌生對世界的理想。我們每次都會在報章雜誌上看到許多成功的故事，但這些故事似乎都對成功有類似的定義。而同時我們看到台灣有許多年輕夥伴，面對這個不完美的世界但不抱怨，而是捲起袖子做著各種改變。\n我們深深受這些夥伴的鼓舞，在主流媒體的心中，他們或許不是典型的成功故事，但對我們來說，成功是由這些夥伴定義的，我們想要和所有不滿於現狀，想要改變現狀的夥伴說：讓我們一起動手不抱怨，讓我們一起參與，因為我們真的能一起讓世界變得更好！（簡介來源自https://www.tnlmedia.com/media/aces）	生命故事, 新聞, 國際	\N	國高中, 大學以上	未來大人物
課程/活動	羊羊	https://uploads-ssl.webflow.com/61cc7ec29b0bf84b1bdc4bf7/61d171b3b7e95637eb3ef528_thumb.jpg	資訊與工程	\N	https://www.trywilco.com/	免費	\N	讓你體驗工程師的一天，上班寫 code 會碰到什麼狀況	程式開發	\N	國高中, 大學以上	trywilco
工具/操作	羊羊	https://addons.mozilla.org/user-media/previews/full/268/268961.png?modified=1651100687	學習/教學工具	\N	https://kagi.com/	部分免費	\N	讓使用者的搜尋更具有隱私性且擁有更好的搜尋體驗，每個月提供免費50次的搜尋額度，只需繳費10美金即可享受無線搜尋次數	數位工具	\N	國小, 國高中, 大學以上	kagi
影片	袋鼠	https://i.imgur.com/cGaJQ31.jpg	綜合型學習資源, 教育, 人文社會	\N	https://www.youtube.com/@user-iv8bd6bk4f	免費	\N	由隆中向上教育基金會支持、是個三年、18支短片的拍攝計畫．由楊力州監製Ｘ新世代導演執導；橫跨動保、同婚、女性、教育等不同面向的反思和倡議…（簡介摘自https://reurl.cc/pZX9De）	生命教育, 生涯探索, 社會議題, 教育, 環境	\N	國高中, 大學以上	怪咖系列
影片	\N	https://i.imgur.com/W4JvNiZ.jpg	綜合型學習資源, 教育, 自然科學, 人文社會, 數學與邏輯, 運動/心理/醫學	\N	https://www.youtube.com/@superycinema/featured	免費	\N	本頻道有許多大量社科領域知識、哲學思想介紹／思辨，還有一些社會議題的探討。	哲學, 政治, 經濟, 社會議題, 法律, 文化, 歷史, 地理, 心理學, 資訊科技, 金融, 電影	\N	國高中, 大學以上	超級歪 SuperY
Podcast	袋鼠	https://i.imgur.com/dJEWzOz.jpg	教育	\N	https://open.firstory.me/user/edwhypodcast	免費	\N	【探討教育、學習、校園風氣以及課程設計】\n鳥仔透過 ❝ 閒聊教育理論、比較國內外教育體制 ❞\n讓我們一起，重新思考台灣教育的過去、現況與未來吧！	教育, 課程設計, 自主學習	\N	國高中, 大學以上	上學之WHY
文章/書, 組織/社群	\N	https://i.imgur.com/f6N2Qpi.png	人文社會	\N	https://kids.twreporter.org/	免費	\N	《少年報導者》是由非營利媒體《報導者》孕生出的「孩子」，對10～15歲的同學提供深度的新聞報導，每一篇文章都是記者獨立採訪、專家審核把關下完成。兒童和少年將是改變世界的起點。	國際情勢, 社會議題, 政治, 經濟, 文化, 社會參與	\N	國小, 國高中	少年報導者
工具/操作	\N	https://i.imgur.com/l7vahAp.png	藝術	\N	https://streetvoice.com/	免費	\N	街聲網站於2006 年在台北成立，致力提供獨立音樂創作人交流發表，積累能量，實現夢想的土壤。	音樂	\N	國小, 國高中, 大學以上	StreetVoice 街聲
Podcast	袋鼠	https://i.imgur.com/K1P5gLT.png	人文社會, 綜合型學習資源, 運動/心理/醫學	\N	https://podcasts.apple.com/tw/podcast/%E7%9F%A5%E8%AD%98%E5%A5%BD%E5%A5%BD%E7%8E%A9/id1479361968	免費	\N	知識是什麼？知識是永無止盡的好奇心，是在假設與驗證間的來回探索，人們為何會傷心？大腦藏著甚麼秘密？說著不同話語為何代表相同的事？《知識好好玩》帶您與哲學、心理學、大腦、物理、性別、語言學等各領域專家，一起挖掘現象背後的原理，用最有趣的方式，把複雜困難的知識說給您聽。\n《知識好好玩》已企劃推出以下節目 #動物好好玩 #戒不了的癮 #哲學好好玩 #性別好好玩 #大腦好好玩 #物理好好玩 #語言好好玩 #犯罪心理學大解析 #科學月台 。\n跟著烏賊達人清大生科系焦傳金教授一起了解動物的感官有哪些「異於常人」之處？讓紀金慶教授以簡明生動的方式解析深奧的哲學經典，帶著大家跟著哲學家班雅明，思索與拆解現代性的核心概念，除此之外還有更多豐富精彩的知識等你來聽！	哲學, 政治, 經濟, 社會議題, 法律, 文化, 歷史, 地理, 公民參與, 心理學, 社會科學	\N	國高中, 大學以上	知識好好玩
組織/社群, 影片	袋鼠	https://i.imgur.com/kMGTGXX.jpg	語言與文學	\N	https://storycorps.org/	免費	\N	故事經歷分享／初級OK!／多元觀點\n每集二至四分鐘不等，以採訪各式各樣的美國人為核心，適合初次接觸全英文podcast的你❤️‍🔥	英語, 聽力, 影片	\N	國小, 國高中, 大學以上	Story Corps
\N	袋鼠	https://i.imgur.com/pVLvoNO.png	語言與文學	\N	https://tofluency.com/	免費	\N	專攻聽力／外師教學／英美式發音一次擁有🇬🇧🇺🇸\n由一對擁有專業外語教學背景的英美雙國籍夫婦經營，主題有趣又貼近生活，絕對是無壓學習的最佳管道！	英語, 聽力, 影片	\N	國高中, 大學以上	To Fluency
組織/社群, 課程/活動	袋鼠	https://i.imgur.com/pyqJZ0l.png	教育, 人文社會, 語言與文學	\N	https://one-forty.org/	免費	https://www.youtube.com/@one-forty9268/featured	我們是 One-Forty，一個關注東南亞移工教育的非營利組織。從 2015 年開始，One-Forty 專注於培力東南亞移工，讓移工在台灣的跨國旅程持續學習實用的知識技能，除了適應異鄉生活，回國後更有能力經濟獨立、打破貧窮的惡性循環，為自己、家人、家鄉，乃至下一代創造更好的生活。One-Forty 也定期籌劃各種文化交流活動，持續創造台灣人與東南亞移工的互動與同理，更看見彼此身上的故事和價值。最終，我們希望讓台灣成為一個更多元包容且實質友善的社會。	社會議題, 文化, 歷史, 移工, 服務學習, 志工, 行動學習, 教學方法	\N	國高中, 大學以上	One-Forty
課程/活動, 文章/書	羊羊	https://d1fdloi71mui9q.cloudfront.net/l8xvuR2ZRhCHve6HJiwx_cgPppxJj83ZouXsX	語言與文學	\N	https://linktr.ee/NoteFull	部分免費	\N	外國人學習TOEFL推薦的YouTube影片，會教學生解題技巧與十常犯錯的問題。	TOEFL, 英文, 口說, 閱讀, 聽力, 寫作	\N	國高中, 大學以上	NoteFull－TOEFL
組織/社群, 課程/活動	袋鼠	https://i.imgur.com/WMG7VD8.png	綜合型學習資源	\N	https://youthvolunteer.yda.gov.tw/index.php	免費	\N	教育部青年發展署(以下簡稱本署)歷年致力於推展青年志願服務，成功累積並見證臺灣青年投入志願服務之經驗及風氣，然而面對臺灣快速的人口結構改變與社會變遷，新的社會議題與挑戰亦不斷產生。在過去推動志願服務的基礎上，除了持續整合縣市政府、民間團體及學校等資源共同推動青年志願服務外，也逐年藉由培力、參與、對話及合作的機制，並鏈結國內青年社會創新服務團隊，以青年持續的熱情及詮釋世界的方式，投入社會願景的創造、維繫及探討，塑造青年自主式社會行動的再生。	志工, 服務學習, 自主學習	台灣	國高中, 大學以上	青年志工站
組織/社群	\N	https://i.imgur.com/FwvlvL5.png	人文社會	\N	https://guavanthropology.tw/	免費	\N	非常知名的國內人類學科普網站，內容包含田野調查、民族誌、社會運動...等	文化, 人類學	\N	國高中, 大學以上	芭樂人類學
組織/社群	Tiff	https://i.imgur.com/YyK60ev.png	綜合型學習資源	\N	https://toedu.g0v.tw/	免費	\N	CourseAPI 開放式課程資訊匯流學院，將整合近一萬筆開放式課程線上資源，建立入口查詢平台，提供個人學習者、自主學習推動單位與教育新創，取用資料並深化學習，就像是在書本上安置插座，讓知識如同電流一樣自由、廣闊。	自主學習, 開放課程, MOOCS	\N	國小, 國高中, 大學以上	台灣開放教育推動團隊 TOEDU
影片	\N	https://i.imgur.com/j7ZCtg1.png	運動/心理/醫學	\N	https://www.youtube.com/playlist?list=PLtWhUGYRH7MpOde9of54BqeeOxSLPz8UG	免費	\N	你對心理學有好奇嗎？\n但心理學派這麼多，到底有什麼差別啊？！真想有人用簡單的話講給我聽！\n來！就讓諮商心理師嘉玲和主持人媗甯，用有系統的架構拆解諮商重要的12大學派，帶領你一同悠遊心理世界，理解不同大師們是怎麼看待人生和人性。	心理學	\N	國高中, 大學以上	啟點文化 — 心理小學堂
影片, 組織/社群	Yien	https://i.imgur.com/rPr6f9h.png	運動/心理/醫學, 藝術	\N	https://www.nngroup.com/	免費	\N	Nielsen Norman Group（簡稱 NN/g）是由 UX 界兩位先驅大佬 Jakob Nielsen 與 Don Norman 於 1988 年所創立的使用者經驗研究與顧問公司。\nNN/g 的宗旨在於以研究為本、散播 UX 知識，他們的使用者研究包羅萬象，同時也都有深入的研究基礎。如果在進行專案時，沒有資源做真正的使用者研究，可以將他們的研究當作參考指標。	UIUX, 使用者研究設計	\N	國高中, 大學以上	NNgroup
組織/社群, Podcast	Pei	https://i.imgur.com/55AmzkP.jpg	生活, 人文社會, 數學與邏輯	\N	https://www.facebook.com/NSQShow/	免費	\N	Stephen Dubner (co-author of the Freakonomics book series) and research psychologist Angela Duckworth (author of Grit) really like to ask people questions, and came to believe there’s no such thing as a stupid one. So they made a podcast where they can ask each other as many “stupid questions” as they want. New episodes each week. No Stupid Questions is a production of the Freakonomics Radio Network.	心理學, 哲學, 英文	\N	大學以上	No Stupid Questions
APP	羊羊	https://excalidraw.com/og-fb-v1.png	資訊與工程, 學習/教學工具	\N	https://excalidraw.com/	免費	\N	可以離線使用與本地儲存的簡約開發協作製圖工具，也可共同線上編輯製作，甚至還支援darkmode, 多國語言使用	設計, 程式開發	\N	國小, 國高中, 大學以上	excalidraw
APP	\N	https://i.imgur.com/URK7hNK.png	學習/教學工具, 語言與文學	\N	https://play.google.com/store/apps/details?id=com.hello.german	免費	\N	這個app,會以CEFR的分級方式，將德文分成a1~c1五個等級（沒有c2）可以依照自己的程度來做選擇來練習德文，內容包括時事、學術等等的文章，可以順便增進自己的德文閱讀能力喔	德文, 閱讀	\N	國小, 國高中, 大學以上	Readle German：每日德文閱讀＋即時德語助手字典
課程/活動	袋鼠	https://i.imgur.com/O6ojVbH.png	綜合型學習資源	\N	https://corelab.iiiedu.org.tw/	免費	\N	「CoreLab」是一個 ICT 技能成長學習平台，本平台有4大特色，包含能力本位精確教學、線上實作增進實力、直播共學或自學與適性學習提升效率。	邏輯, 程式設計, 數位工具, 大數據, 物聯網, 人工智慧AI, 資訊科技	\N	國高中, 大學以上	CoreLab－技能學習平台
課程/活動	袋鼠	https://i.imgur.com/EIwc93o.png	綜合型學習資源	\N	https://elearn.ydahub.tw/mooc/index.php	免費	\N	此平台為教育部青年發展署所創立的線上數位學習平台，平台內有許多議題、設計思考、社會設計與服務學習…等議題可供您學習。	SDGS, 國際情勢, 設計思考, 性別, 社會設計, 服務學習	\N	國高中, 大學以上	超牆青年ｅ學院
組織/社群	袋鼠	https://i.imgur.com/t2Rh7rd.png	藝術, 教育, 綜合型學習資源, 人文社會	\N	https://jibaoviewer.com/explore	免費	\N	「JIBAO 優質教材共享平台－滿足跨領域、線上教學及特殊課程」\n整理教材對老師來說是件工程浩大但重要的事，吉寶是第一個專門幫助老師備課及授課的線上工具。其內容包含四特色：收藏、複製免去重複備課、簡報製作快速、焦點搜尋各式資源社群分享與關注。	藝術, 音樂, 文化, 歷史, 地理, 生命教育, 家政	\N	大學以上	JIBAO教材共享平台
組織/社群	\N	https://i.imgur.com/hVu4CC2.jpg	語言與文學	\N	https://test-english.com/	免費	\N	我們是一群英語教師和電子學習愛好者，他們在過去幾年中一直在創建在線材料來幫助我們的學生準備他們的英語考試。我們的目標始終是打造一個適合每個學生的節奏、目標、智力、能力、時間和動機的英語學習平台。\n我們很清楚，每天都有越來越多的人出於職業原因或作為教育要求的一部分需要對他們的英語進行認證。不幸的是，他們經常無法在繁忙的日程中適應英語學習。通過 test-english.com，您可以在家中舒適地以自己的節奏輕鬆提高英語技能。	英語, 聽力, 閱讀, 寫作, 單字	\N	國高中, 大學以上	Test-English
組織/社群, 課程/活動	\N	https://i.imgur.com/j015lAY.png	教育, 人文社會	\N	https://www.gapminder.org/	免費	\N	Gapminder 是一個瑞典的基金會、是非營利組織 ，網站使用可靠的數據開發易於理解的教材，以消除人們對世界的誤解。	地理, 世界, 國際情勢, 社會議題, 人口, 永續發展	\N	國高中, 大學以上	Gapminder
影片	\N	https://i.imgur.com/HE92xBN.png	語言與文學	\N	https://www.youtube.com/channel/UCrqx0LRwcN4gH7oFVghhaow	免費	\N	「Parker English」這個頻道希望能以影片的方式來解決你在英文學習上所遇到的困難。\n未來預計會在每週一、週三定期更新影片，歡迎一起在英文路上大步前進吧！	英語, 多益	\N	國高中, 大學以上	Parker English怕渴英文
課程/活動, 文章/書	\N	https://i.imgur.com/kfMdTBE.png	人文社會	\N	https://linevoom.line.me/user/_dad8f8Ns9GY7Fyjt968tVMQLSR7Q9wpdL2Z9DjQ?utm_medium=osx&utm_source=desktop&utm_campaign=OA_Profile	免費	\N	以歷史脈絡書寫當代議題，和讀者一起從生活發現歷史、從臺灣看見世界、從過去想像未來。\n\n故事 StoryStudio 致力於人文知識的轉譯與傳播，創造屬於當代的，專注歷史與文化的新媒體，在這個破碎當道的時代，提供讀者理解世界的脈絡；在這個扁平至上的時代，探索文化議題的深度；在這個虛實不分的時代， 呈現真實而可靠的資訊。\n\n以上資料取自故事 StoryStudio Line 社群介紹	社會議題	\N	國高中, 大學以上	故事 StoryStudio LINE社群
影片	\N	https://i.imgur.com/RT6M4op.png	語言與文學	\N	https://www.youtube.com/c/deguchijapanese	部分免費	\N	日文教學，可學習、平假名、片假名和文法等。\n亦有書籍「大家的日本語」講解課程。	單字, 日文, 聽力, 閱讀	\N	國高中, 大學以上	出口日語
組織/社群, 文章/書	\N	https://i.imgur.com/FmgH1iO.jpg	人文社會	\N	https://www.cw.com.tw/author/57	免費	\N	《經濟學人》（The Economist）是一份英國的英文新聞週報，是一本涉及全球政治、經濟、文化、科技等多方面事務的綜合性新聞評論刊物，著重於對這些議題提供深入的分析和評論。	經濟, 社會議題, 國際情勢, 政治, 文化, 歷史, 地理, 公民參與	\N	國高中, 大學以上	經濟學人
課程/活動	nobody	https://i.imgur.com/ncYWvQI.png	資訊與工程, 教育	\N	https://1know.net/course/5d39ac65d7e5?v=list	免費	\N	蒐集相關機器學習與 AI 的教學素材，並已經分類，方便老師可以選擇自己需要的素材來進行課程研發，或者是學生自學也很合適	人工智慧AI, 機器學習, 科技	\N	國小, 國高中	玩一玩機器學習與人工智慧
Podcast	\N	https://i.imgur.com/UkBivrt.png	藝術	\N	https://open.firstory.me/user/themusicoftaiwan	免費	\N	這個podcast涵蓋台灣音樂史、代表性人物介紹、曲風解說等多面向，透過每個獨立的單元向民眾介紹音樂，頻道的風格多元呈現，也因為沒有過高的樂理先備知識門檻限制，可以很好入門，所以推薦它。	音樂, 演講, 樂派	\N	國小, 國高中, 大學以上	欸？誰的音樂課本掉了？
文章/書	pennyw0918	https://i.imgur.com/ikso0GB.png	語言與文學	\N	https://hackmd.io/@aog2P9O2S_mSogq5U5U-LQ/rk9GRegaq	免費	\N	裡面是一些我近期在閱讀的文學小說，有科幻、歷史等類型，我認為這些作者的文筆對寫作很有幫助，書中的內容也很發人深省，讓人能思考很多問題。	文學	\N	國高中, 大學以上	文學小說推薦
影片	\N	https://i.imgur.com/FLnoQ1m.png	商業與社會創新	\N	http://startupclass.samaltman.com/	免費	\N	藉由網站影片可以逐步瞭解創業需思考的面向\n網站簡介：Everything we know about how to start a startup, for free, from some of the world experts.	創業, 社會創新, 商業	\N	國高中, 大學以上	How to Start a Startup
APP	\N	https://i.imgur.com/rMsSWQz.png	生活	\N	https://play.google.com/store/apps/details?id=com.superelement.pomodoro&hl=zh_TW	部分免費	\N	可以讓您透過番茄鐘計時法保持專注(專心25分鐘休息5分鐘)對於容易因手機分心的你非常受用，操作簡單頁面乾淨還有嚴格模式跟小組，工作學習再也不怕分心及一個人奮鬥的寂寞感，計時的畫面讓你在想放棄時能有再堅持下去的想法 (像是 再撐個十分鐘就可以休息了不如再堅持一下)，勞役雙修，學習不再是苦差事。	時間管理	\N	國小, 國高中, 大學以上	番茄鐘app
課程/活動	袋鼠	https://i.imgur.com/fVmi12M.jpg	綜合型學習資源	\N	https://www.futurelearn.com/	部分免費	\N	FutureLearn 與其他 MOOCS 課程最大的不同之處來自於 FutureLearn 對學習者的認知及線上學習的教育理念。長期從事遠距教學（Distant Learning） 的英國空中大學，充分理解到不在實體環境（如教室）學習可能面臨的問題。 FutureLearn 清楚界定學習者是一群認同：＂Learning is for Life＂（終身學習）、＂Get joy from learning＂（為快樂學習）、＂Never be too old to learn＂（活到老，學到老）。(簡介摘自https://reurl.cc/q5yLVg)	自主學習, 終身學習	\N	國高中, 大學以上	FutureLearners英國開放式課程
課程/活動, 影片	Peiching	https://i.imgur.com/qRhFy1D.png	語言與文學, 數學與邏輯, 資訊與工程, 人文社會, 自然科學, 運動/心理/醫學, 商業與社會創新, 綜合型學習資源	\N	https://www.straighterline.com/	需付費	\N	Straighterline 是為了解決美國大學學費過貴而出現的學習資源網站。他開設了超過六十門被美國超過2000間大學承認，可以轉成大學學分的課程，收取相對來說一般人比較能負擔的費用。若是高中生想要跳級學習數理，Straighterline也是一個比美國大學開設的暑期學校更划算的選擇。	自主學習, 商業, 數學, 科技, 終身學習, 文化, 歷史, 物理, 化學, 生物, 地科, 科學史, 英文, 社會創新, 健康, 心理學, 哲學	\N	國高中, 大學以上	Straighterline
課程/活動, 影片, 組織/社群	\N	https://i.imgur.com/vBOGeEx.png	人文社會, 教育, 生活, 運動/心理/醫學, 商業與社會創新, 綜合型學習資源	\N	https://www.youtube.com/channel/UCE4D_tWFo2HOGeyWmzSc9Xg/about	免費	\N	開心負債創業的社會新鮮人。從街友環島起步，以熱血、冒險、瘋狂作為精神，用影片傳遞小小的「善」。開著夢想巴士行遍台灣各地，鼓勵每個追夢中的人。Keep it cool！先做再說，回歸現實之前，我們想看看自己能跑多遠。\n\n「人生好難但很好玩 瓶蓋牆」位於台中沙鹿夢想街，是我們之前的工作室位置。\n「SALU傻子公寓」位於台中一中街附近，是我們現在的工作室位置。\n\n如果喜歡我們！想支持我們繼續創作！\n一起加入SALU夥伴大船團！ \n一起大鬧世界吧！夥伴們！\nhttps://www.zeczec.com/projects/salu	教育創新, 創造力, 攝影, 自媒體	\N	學齡前, 國小, 國高中, 大學以上	SALU
課程/活動	\N	https://i.imgur.com/WjChqD5.jpeg	語言與文學	\N	https://studyspanish.com/	免費	\N	Learn Spanish for free with our grammar lessons, verb drills, cultural Spanish notes, vocabulary lists, podcasts, word of the day and more.	西班牙文, 聽力, 閱讀, 口說, 寫作	\N	大學以上, 國高中	Study Spanish.com
課程/活動	\N	https://i.imgur.com/7naA4Vt.jpg	藝術	\N	https://musicbank.moe.gov.tw/	免費	\N	樂器謀合維修交換系統資料庫，讓樂器重新獲得生命，讓自己對音樂的情感延續。	音樂, 樂器, 互助	\N	學齡前, 國小, 國高中, 大學以上	教育部樂器銀行
課程/活動, 工具/操作, 影片	YC	https://i.imgur.com/1U2O1Ln.png	人文社會, 自然科學, 藝術, 教育, 生活, 學習/教學工具	\N	https://www.ptskids.tw/	免費	\N	將公視的兒少節目以主題之方式分類，並提供教師和家長搭配影片的教案應用。	教案, 影片, 戲劇, 教育	\N	學齡前, 國小, 國高中	公視兒少資源網
課程/活動, 影片, 組織/社群	Karen	https://i.imgur.com/ASjZsm7.jpeg	語言與文學	\N	https://www.youtube.com/c/yesjap568/featured	部分免費	\N	離開了大學教室的何必博士，將自身所學在此頻道分享，在這個頻道你可以學到標準的日語發音，易懂的文法以及日本流行事物，內容包羅萬象，不只是日文學習訊息，還包括了用日文去享受日本人的享受，而且在歌曲翻譯上何必博士也下了很多功夫，希望你能夠真的享受到日本流行歌曲以及日本演歌的真正含意。\n希望你在何必博士的頻道可以找到你要的日文或者日本的資訊喔！(來自「何必日語」YouTube頻道簡介)	日文, 日本文化, 文化, 聽力, 閱讀, 口說, 寫作, 影片	\N	學齡前, 國小, 國高中, 大學以上	何必日語
工具/操作	王憶萍	https://i.imgur.com/elTGm42.png	資訊與工程, 教育	\N	https://dancingwithai.media.mit.edu/	免費	\N	麻省理工媒體室針對中學生發展的專案導向學習，課程內容為製作互動、會運作的 AI 系統。	人工智慧AI, 科技, 資訊科技, 教材	\N	國小, 國高中	Dancing with AI
課程/活動	袋鼠	https://i.imgur.com/xjDXX3e.png	綜合型學習資源	\N	https://skillsbuild.org/zh-TW/students	免費	\N	在IBM，我們相信入門級技術（新的入門級技術工作）需要技能，而不僅僅是學位。 IBM SkillsBuild 提供免費的學習，支持和資源，以促進從中學教育（13-18歲的學生）到入門級就業的STEM和新的領技能。	人工智慧AI, 資訊科技, 大數據, 區塊練	\N	國高中, 大學以上	IBM 數位教育平台
文章/書	\N	https://i.imgur.com/hrthLiO.png	藝術	\N	https://arthistorystrolls.com/	免費	\N	漫遊藝術史，2016年9月誕生，是由中央大學藝術學研究所創立的共筆部落格。我們希望以平易近人的方式，為一般大眾介紹逸趣橫生的藝術人文知識。網站內容涵蓋：藝術史是什麼？藝術史研究方法、美學與藝術理論、亞洲和西方藝術史、視覺文化與電影研究、展覽評論和藝文生態、好書推介、數位學習資源、收藏與展示等。作者群來自臺灣與海外的大學及中學教師、碩博士生、雜誌編輯、自由撰稿者，以及美術館、博物館、藝文基金會、畫廊工作者。\n本站屬文化教育性質的交流平台，文章轉載或節錄不得為商業目的之使用，引用或分享時請務必標示網址與作者。	藝術教育, 自主學習, 歷史, 視覺文化	\N	國高中, 大學以上	漫遊藝術史
課程/活動	鳥巢老師	https://i.imgur.com/xjrzQj1.jpg	自然科學, 數學與邏輯, 教育	\N	https://www.facebook.com/%E9%B3%A5%E5%B7%A2%E8%80%81%E5%B8%AB%E7%9A%84%E7%84%A1%E5%A8%81%E6%AC%8A%E6%95%99%E5%AE%A4-1655491844521523/	需付費	\N	我是鳥巢老師，民主派的老師，小孩很愛上我的課，讓許多討厭數學甚至已經放棄數學的自學生重啟對數學的興趣與好奇。\n有鳥巢自己研發國高中的數學課綱，歡迎大家到粉專上了解。\n陪伴學齡前的小孩練習表達與情緒、練習合作解決問題、也在這個過程中讓他們體驗民主的機制。	公民參與, 數學, 科學, 微積分, 陪伴	\N	大學以上, 國高中	鳥巢老師
影片	袋鼠	https://i.imgur.com/gSRkxkT.png	學習/教學工具, 藝術, 資訊與工程	\N	https://www.youtube.com/channel/UChJb4QfaVnGyhgN8zpHEV3w/featured	免費	\N	哈囉，歡迎來到 “謝感覺教學”\n我是 Feeling，擁有超過16年以上的業界接案、7年以上的教學經驗。\n【創造口訣，取代冗長步驟】\n頻道主要教學photoshop、Illustrator、動畫、網頁、文書...偶爾興起也會教些不同的電腦技能。\n我創造很多獨門秘技與口訣，讓學生能快速並且零負擔學習，不僅學軟體工具，還要學會運用工具、創造設計。\n教學中也會分享業界經驗、接案經驗，讓學生能更接軌業界與職場，開創自己的斜槓事業。\n跟著感覺走，學就對了!! 希望您們喜歡我的教學~\n學習有問題或有想錄製的主題可以影片下方留言，我會統一回覆。\n假如您喜歡教學影片，請分享給您的朋友，\n並且訂閱我的頻道，記得加上小鈴鐺喔。謝謝您!(簡介摘自yt網站)	photoshop, Illustrator, Adobe, word, 數位工具, Flash, Indesign	\N	國高中, 大學以上	謝感覺教學
組織/社群, 工具/操作	袋鼠	https://i.imgur.com/ldKybxQ.png	資訊與工程	\N	https://www.lanrenexcel.com/	免費	\N	包括Excel 函数公式、操作技巧、數據分析、圖表模板、VBA…等技巧文章	數位工具, excel	\N	國高中, 大學以上	懶人Excel
APP	羊羊	https://quillbot.com/images/og_quillbot.png	語言與文學	\N	https://quillbot.com/	免費	\N	一款基於AI的英文作文或論文的批改平台。paraphrasing tool, smart thesaurus, article rewriter, thesaurus, smart, sentences, rewrite, smart thesaurus for sentences, Reword Essays, rewrite essays, plagiarism, paraphrasing, paraphraser, short response changer, essay changer, smart thesaurus, thesaurus, thesaurus for sentences, paper changer, reworder, artificial intelligence, natural language processing, NLP, reword responses, rephrase, paraphrasing, reword, rewordify, article spinner, reword paraphraph, paraphrasing tool online free, rewrite sentences, rewrite sentences generator, rephrase sentences, reword this, free paraphrasing（From official）	英語, TOEFL, GRE, GMAT	\N	國小, 國高中, 大學以上	quillbot
工具/操作	羊羊	https://www.idiomconnection.com/1schoolboy7-med.jpg	語言與文學	\N	https://www.idiomconnection.com/	免費	\N	依照主題分類，找尋適合英文寫作的相關idiom。Idiom Connection - 11,000 English idioms and phrasal verbs in different categories. 100 most common English idioms. Over 200 idiom quizzes! (From official)	寫作, 閱讀, TOEFL, GRE	\N	國小, 國高中, 大學以上	idiom connection
工具/操作	羊羊	http://www.just-the-word.com/img/logo.png	語言與文學	\N	http://www.just-the-word.com/	免費	\N	幫助你在英文寫作上可以找到適合的搭配詞	英語, TOEFL, GRE, GMAT, 寫作	\N	國小, 國高中, 大學以上	just the word collocations
APP	羊羊	https://www.datocms-assets.com/38511/1649245983-rapid-product-research-universal-meta-image.png?auto=format	資訊與工程, 藝術	\N	https://maze.co/	部分免費	\N	一個提供Usability測試的平台。Build a product your users love. Test ideas, content, and designs with Maze and gather actionable user insights in hours, not days.	APP設計, UIUX, 網頁設計	\N	大學以上, 國高中	maze
APP	羊羊	https://d1nzhz3mk5ckry.cloudfront.net/wp-content/uploads/2021/07/MBA-Crystal-Ball-Logo.svg	語言與文學	\N	https://www.mbacrystalball.com/gre/gre-essay-grader/	免費	\N	網站提供免費的GRE寫作評分，可以模擬官方評分系統的真實分數，主要評分是依據作文的組織性, 可讀性與連貫性。	英語, GRE, GMAT	\N	大學以上, 國高中	GRE免費線上AWA寫作評分
工具/操作	羊羊	https://www.thesaurus.com/hp-assets/_next/static/images/thesaurus_social_logo-0bb8f9375748a874b7dbe7fcee29f592.png	語言與文學	\N	https://www.thesaurus.com/	免費	\N	找英文同義字的網站，適合準備英文寫作的同學拓展單字量與修飾句子。	英語, TOEFL, GRE	\N	國小, 國高中, 大學以上	thesaurus
APP	羊羊	https://www.tunnelbear.com/static/images/social-meta/pricing.png	學習/教學工具	\N	https://www.tunnelbear.com/	部分免費	\N	VPN提供500MB的免費使用流量供大家使用，適合有臨時少量需求的人使用	工具	\N	大學以上	tunnel bear
APP	羊羊	https://i.imgur.com/Zg3LZ9G.png	語言與文學, 數學與邏輯	\N	https://magoosh.com/	部分免費	\N	Magoosh offers online test prep, live classes, and free resources so you can score your best on the GRE, GMAT, LSAT, MCAT, ACT, or SAT.	英語, GRE, GMAT, TOEFL, IELTS	\N	大學以上, 國高中	magoosh
APP	羊羊	https://cdn2.manhattanprep.com/wp-content/uploads/2021/03/screen-shot-2021-03-19-at-8.54.45-am.png	語言與文學, 數學與邏輯	\N	https://www.manhattanprep.com/	部分免費	\N	Manhattan Prep provides industry-leading test prep. Learn more about our online and in-person courses, free resources, and tutoring options.	英語, GRE, GMAT	\N	大學以上	manhattan prep
文章/書	羊羊	https://github.com/30-seconds/30-seconds-of-code/raw/master/logo.png	資訊與工程	\N	https://www.30secondsofcode.org/	免費	\N	Short JavaScript code snippets for all your development needs	JS, 程式設計, Python, HTML/CSS	\N	國小, 國高中, 大學以上	30秒code系列
文章/書	羊羊	https://i.imgur.com/o3sCeib.png	資訊與工程	\N	https://github.com/h5bp/Front-end-Developer-Interview-Questions	免費	\N	This repository contains a number of front-end interview questions that can be used when vetting potential candidates. It is by no means recommended to use every single question here on the same candidate (that would take hours). Choosing a few items from this list should help you vet the intended skills you require.\nNote: Keep in mind that many of these questions are open-ended and could lead to interesting discussions that tell you more about the person's capabilities than a straight answer would.	JS, 面試	\N	大學以上	h5bp的前端面試問題整理
文章/書	羊羊	https://i.imgur.com/GxFn3HH.jpg	資訊與工程	\N	https://github.com/wesbos/JavaScript30	免費	\N	Starter Files + Completed solutions for the JavaScript 30 Day Challenge.\nGrab the course at https://JavaScript30.com\n（From README）	JS, 程式設計, 面試	\N	國高中, 大學以上	javascript30
APP	羊羊	https://i.imgur.com/Id9ayY1.png	資訊與工程	\N	https://github.com/haozi/xss-demo	免費	\N	👮🏻‍♂️ XSS攻防靶場，issues 有答案	面試, 資訊安全	\N	國高中, 大學以上	XSS demo
文章/書	羊羊	https://i.imgur.com/cHPiGqv.png	資訊與工程	\N	https://github.com/bater/reverse-interview-zh_tw	免費	\N	列表裡的問題對於參加技術面試的人來說可能有些用。 列表裡的問題並不一定適用於某個特定的職位或者工作類型，也沒有排序。 最開始的時候這只是我自己的問題列表，但是慢慢地添加了一些我覺得可能讓我對這家公司亮紅燈的問題。 我也注意到被我面試的人提問我的問題太少了，感覺他們挺浪費機會的。（轉自README）	面試, 程式設計	\N	大學以上	技術反向面試
組織/社群	袋鼠	https://i.imgur.com/QfKijmi.png	綜合型學習資源	\N	https://kyvisuallab.com/	免費	\N	我是KEVIN，一個非常喜歡學習且興趣廣泛的人，我是一個跨領域的斜槓設計師和影像創作者，我涉略影片創作(拍攝剪輯)、教學、平面與3D設計、網站架設。\n用影像創作與教學一直是我所熱愛且擅長的。幾年前，我從0開始自學影片剪輯到擁有接案能力，並開始經營個人品牌-影創實驗室，透過部落格、線上家教與諮詢、媒合接案的方式協助對影像創作有興趣的人，踏上自學影像創作之路。\n在這裡，你可以結識更多和我一樣對影像創作、自學、設計、創業等有興趣的人，共同用分享與散播影響力，創造一個交流分享的互助平台。(簡介摘自https://reurl.cc/55zyAn)	影片剪輯, 影像創意	\N	國小, 國高中, 大學以上	影創實驗室
組織/社群	袋鼠	https://i.imgur.com/L9dkEbT.jpg	綜合型學習資源	\N	https://www.facebook.com/groups/jobsandinternship	免費	\N	工作與實習 Jobs and Internships會分享許多實習的單位	實習, 公民參與	\N	大學以上	工作與實習 Jobs and Internships
組織/社群	袋鼠	https://i.imgur.com/wc3vinH.jpg	綜合型學習資源	\N	https://www.facebook.com/groups/4979521218778624	免費	\N	「蛋糕找實習 🍰」希望提供透明的實習交流資訊，我們會定期更新和整理優質的實習職缺，也歡迎大家在這裡分享實習職缺、求職心得以及各式提問交流！（摘自社團簡介）	實習, 公民參與	\N	大學以上	蛋糕找實習
組織/社群	\N	https://i.imgur.com/Rjoa0Xu.jpg	教育, 語言與文學	\N	https://sites.google.com/ehuayu.org/chuchuchinese/%E9%A6%96%E9%A0%81?authuser=0	免費	\N	中文教學百寶箱是華語文教學相關的補充資訊社團，網站內包含詞彙語法的誤點與如何教學，並配合數位媒材製作華語教材。	中文, 單字, 文法, 華語文	\N	國高中, 大學以上	中文教學百寶箱
工具/操作	羊羊	https://lh3.googleusercontent.com/dPdyfSl7seUOpHe4rDj-oxo7oQ9P60809H2MY4NynmV9CDsY9p-p8Ovb_QmsYdGM7jgjCYG6s7MGYnMOMOjtpbdGLJ4=w128-h128-e365-rj-sc0x00ffffff	資訊與工程	\N	https://chrome.google.com/webstore/detail/whatfont/jabopobgcpjmedljpbcaablpmlmfcogm?hl=en	免費	\N	可以輕易地透過套件檢查網頁上的字型是否符合預期。\nThe easiest way to identify fonts on web pages. What is the easiest way to find out the fonts used in a webpage? Firebug and Webkit Inspector are easy enough to use for developers. However, for others, this should not be necessary. With this extension, you could inspect web fonts by just hovering on them. It is that simple and elegant. It also detects the services used for serving the web fonts. Supports Typekit and Google Font API. Recommended by Wired WebMonkey, Lifehacker, and SwissMiss. (From official)	UIUX, 網頁設計	\N	國高中, 大學以上	whatfont
影片, 課程/活動	Tiff	https://i.imgur.com/pIeTzCH.jpg	教育, 藝術, 人文社會, 語言與文學	\N	https://ipalace.npm.edu.tw/	免費	\N	故宮線上學校提供國小到高中的學生線上免費課程，讓學生能學習文物背後的歷史、文化等知識。此外也提供師培課程以及教學資源。	文化, 歷史, 遊戲, STEAM	\N	學齡前, 國小, 國高中, 大學以上	故宮線上學校
組織/社群	袋鼠	https://i.imgur.com/XGe2ArW.jpg	教育	\N	https://www.homeschool.tw/	免費	\N	保障教育選擇權是關於如何撰寫自學生的學習計畫，以及實驗教育相關的資訊	實驗教育, 民主教育	\N	國小, 國高中, 大學以上	保障教育選擇權
組織/社群	袋鼠	https://i.imgur.com/V2jc3DV.jpg	綜合型學習資源	\N	https://www.facebook.com/groups/internlens	免費	\N	哈囉大家！\n這裡是實習透視鏡-最透明的實習經驗分享平台的討論區，相較於匿名分享的網站，具名的即時討論交流仍有其必要性。\n這是個開放的討論社團，除了一樣歡迎分享經驗或是吐苦水之外（fb是實名制的請大家注意用字遣詞與曝光風險），大家對於某某職缺或是任何關於實習的問題也都可以儘管問，可能會有學長姐或大神現身回答你喔～\n我們也會隨時更新網站平台的進度，歡迎大家對我們各種批評指教！\n希望大家都有快樂、充實的實習生活喔。（取自官方網站）	公民參與, 實習	\N	大學以上	實習透視鏡
組織/社群	袋鼠	https://i.imgur.com/Yu6ztQF.jpg	綜合型學習資源	\N	https://www.facebook.com/groups/502807310087054	免費	\N	👍請踴躍分享活動，讓更多好活動被看見\n👍歡迎邀請活動咖朋友一起進來社團和我們瘋狂\n👍各類型活動：實習、獎助計畫、培育計畫、國際交流、講座、工作坊、論壇、社會企業、SDG、創業創新等活動＆學習資源都歡迎（取自官方網站）	社會議題, 公民參與	\N	大學以上	青年活動吧
組織/社群	袋鼠	https://i.imgur.com/DsPmIb5.jpg	資訊與工程	\N	https://www.facebook.com/groups/663787064118057	免費	\N	歡迎加入 TechTech 官方臉書社團 🎉\nTechTech 是一個科技愛好者探索知識和分享知識的地方。 你可以在這裡探索其他人如何使用科技產品實現他們的目標，你也可以在這裡和其他人分享如何使用科技產品實現你的目標。（取自官方網站）	程式設計, 數位工具, 網頁設計, 人工智慧AI, 資訊科技	\N	國高中, 大學以上	科技產品與牠們愛好者的產地
組織/社群	袋鼠	https://i.imgur.com/KwDcYv0.jpg	綜合型學習資源	\N	https://www.facebook.com/groups/smartCopywriting	免費	\N	本社團為文案人的社團，歡迎大家討論、分享文案相關內容，需答完整問題即可加入。（取自官方網站）	寫作, 文案	\N	國高中, 大學以上	文案人聊文案事
組織/社群	袋鼠	https://i.imgur.com/ZqFStbX.png	語言與文學	\N	https://talktomeinkorean.com/	部分免費	\N	適合的韓文程度：零基礎也能學\n學習目標：韓文日常對話。韓文句型、文法。從基礎開始到會話都能在這學習\nTALK TO ME IN KOREA （TTMIK）是外國人學韓文最常選擇的管道之一，同時，課程是以英文為講解語言，課程所用的講義也是英韓夾雜。\n課程分成免費與付費兩種。免費的課程提供 Level 1 至 Level 9，課程大綱以對話為主，難度逐漸加深。(簡介摘自https://reurl.cc/YvYA64)	單字, 聽力, 韓文	\N	國高中, 大學以上	Talk to me in korean
工具/操作	羊羊	https://i.imgur.com/0EhedX4.png	資訊與工程	\N	https://www.similarweb.com/zh-tw/	部分免費	\N	Similarweb是一家免費提供網站排名以及網站競爭度數據分析的平台，在行銷上是個相當好用的利器，累積全球數以百萬計的網站訊息及用戶瀏覽數據，透過這個簡易上手的工具，讓您可以更了解自己與產業競爭對手網站流量與市佔率概況，以擬定更好的行銷企劃與解決方案。(簡介摘自：https://reurl.cc/Wr0M2L）	網站分析	\N	國小, 國高中, 大學以上	similarweb
組織/社群, 課程/活動, 文章/書	Tiff	https://i.imgur.com/k4e3g6n.jpg	藝術, 語言與文學, 人文社會, 運動/心理/醫學	\N	https://www.facebook.com/soullab2020	部分免費	\N	目標成為臺灣第一個女性利他影響力的公益人才培育中心，透過 #閱讀 與 #藝術療癒，培育女性在各種團體，包括家庭、職場與社會中，成為具有 #利他 思維與實質影響力的領導者。(簡介摘自網站)	療育, 公益, 女性	\N	國高中, 大學以上	SOUL LAB 靈魂實驗所
組織/社群	芯瑜	https://i.imgur.com/dVMPVuO.png	藝術	\N	https://creatorhome.tw/	免費	\N	大家好，我是凱文，創作邦是我一人建立，因為我一直希望有一個替中文創作者整理的資源網站，但是一直沒有找到適合的，所以就決定自己架設，在內容上我以我身為創作者需要或喜歡的方式來整理，希望也能把這些內容分享出來提供給大家，讓大家使用這些方便與完整的創作資源。(簡介摘自https://reurl.cc/OAYL5g)	設計	\N	國高中, 大學以上, 國小	創作邦
組織/社群, 課程/活動	崧崧	https://i.imgur.com/ukmFd4A.png	資訊與工程	\N	https://codelabs.developers.google.com/	免費	\N	Google Developers Codelabs 提供了一個指導、教學性、動手做的程式撰寫體驗。\n大多數程式碼實驗室將引導你完成建立一個小型應用程式，或向現有的應用程式新增一個新功能。\n這些資源涵蓋了廣泛的主題，例如 Android Wear、Google Compute Engine、Project Tango、Flutter、AI、機器學習、AR、VR、遊戲、設計、開源、大數據、GoogleAPI 等主題。	資訊科技, 程式開發, Android, Flutter, Google	\N	國高中, 大學以上	Google Developers Codelabs
工具/操作	羊羊	https://www.merriam-webster.com/apple-touch-icon.png	語言與文學	\N	https://www.merriam-webster.com/	免費	\N	Merriam-Webster 的詞典是美國最值得信賴的英語單詞定義、含義和發音在線詞典。 #wordsmatter（取自官方網站）	英語, 閱讀, 單字	\N	國小, 國高中, 大學以上	Merriam-Webster
組織/社群	小許 	https://i.imgur.com/I5bAomV.png	藝術	\N	https://www.91pu.com.tw/index.html	部分免費	\N	為了保存華語地區自民歌時代以來的音樂精粹，海馬團隊一直致力於營造良好的使用者體驗，提供使用者最適合彈唱的樂譜。91譜尚有許多不足，許多未完善的功能，仍需要大家起努力改進。我們會繼續努力，提供給大家更好的樂譜體驗。也請大家到我們粉專給予我們支持與鼓勵，也可以加入深海社區參與我們的研發計畫，與我們共同成長(簡介摘自：https://reurl.cc/M03GnW）	音樂, 吉他	\N	國小, 國高中, 大學以上	91吉他譜
組織/社群, 工具/操作	袋鼠	https://i.imgur.com/O6rW9pW.png	資訊與工程	\N	https://www.netlify.com/	免費	\N	Netlify 是一個熱門的靜態網站 Host 服務，其免費額度非常適合一般使用者\n可以自定義 subdomain 也可以使用自己的網域名，同時也提供了免費的 SSL\n而且只要將網站上傳到 GitHub Repository，Netlify 就會自動部署，非常方便(簡介摘自https://reurl.cc/DyqZRE)	程式設計, 網頁設計, 資訊科技	\N	國小, 國高中, 大學以上	Netlify
Podcast	袋鼠	https://i.imgur.com/I6Ef8x4.jpg	綜合型學習資源	\N	https://www.entertowin.vip/	免費	\N	Hi！我是 Vance，現任為職涯與留學顧問\n我喜好閱讀、旅遊、各國文化與籃球。我曾在國內外取得資訊與行銷雙碩士，並在資訊科技業與電子製造業累積十年以上的資歷，曾任品牌行銷、產品行銷、產品經理、專案經理、系統分析與設計及研發工程師等職務。在我職涯過程中，經歷的四次的求職階段，我收到過許多公司的面試邀請，每次我都會從中挑選有興趣的十幾間公司進行面試，因此讓我累積非常豐富的面試經驗。而現在身為留學教育業的雇主，也面試過非常多的年輕人；同時，我目前也擔任履歷診療的顧問，因此發現許多人在求職中存在許多問題，希望能與你們分享職涯規劃、求職技巧、留學進修的經驗和資源，並幫助大家完成職涯與留學的規劃和目標。(簡介摘自https://reurl.cc/Yv4G0o)	生涯探索	\N	國小, 國高中, 大學以上	進擊的職人Enter To WIN
組織/社群, 課程/活動	袋鼠	https://i.imgur.com/HNYNE3f.jpg	綜合型學習資源	\N	https://edc.com.tw/	需付費	\N	「EDC專長探索中心」是目前台灣市場上少見的綜合性知識型營隊，鎖定國高中學子，透過體驗式教學，讓孩子們融入課程，自主思考。 全程參與課程結束後，也將頒發中國文化大學推廣教育部或銘傳大學產學推廣處結業證書，豐富孩子每個階段的學習歷程。(簡介摘自https://reurl.cc/q5noLD)	行動學習, 生涯探索	\N	國小, 國高中, 大學以上	EDC專長探索中心
課程/活動	羊羊	https://vjudge.net/static/images/favicon.ico	資訊與工程	\N	https://vjudge.net/	免費	\N	可以解題與出題程式設計相關題目的網站	競賽程式, 程式設計	\N	國高中, 大學以上	virtual judge
提案/競賽	羊羊	https://www.topcoder.com/wp-content/uploads/2021/09/og-image.jpg	資訊與工程	\N	https://www.topcoder.com/community/practice	免費	\N	提供練習程式的地方	程式設計, 競賽程式	\N	國高中, 大學以上	topcoder
提案/競賽	羊羊	https://codeforces.org/s/0/images/codeforces-telegram-square.png	資訊與工程	\N	https://codeforces.com/	免費	\N	Codeforces. Programming competitions and contests, programming community	程式設計, 競賽程式	\N	國高中, 大學以上	codeforces
課程/活動	羊羊	https://firebasestorage.googleapis.com/v0/b/hexschool-api.appspot.com/o/blog%2F2019%2F06%2FF2E-2nd-1200x628.png?alt=media&token=3e297d87-8c3a-492a-8759-89af4ecd4c90	資訊與工程	\N	https://challenge.thef2e.com/	免費	\N	六角學習地圖. 課程購買後不知從哪邊開始上嗎？ 我們這邊提供一張學習地圖給同學做參考。 對於前端還有不了解的地方，可以參考前端開發者技能樹！	程式設計, 網頁設計, HTML/CSS	\N	國高中, 大學以上	前端修練精神時光屋
課程/活動	羊羊	https://www.codewars.com/packs/assets/logo-square-paper-bg.c3d2b1eb.jpg	資訊與工程	\N	https://www.codewars.com/	免費	\N	codewars, code kata, kata, code gym, coding, code practice, ruby, javascript, coffeescript, web development, software development, dojo	程式設計, 競賽程式	\N	國高中, 大學以上	codewars
課程/活動	羊羊	https://cafetalk.com/_global_resource/image/og-image/fb-image.jpg	語言與文學	\N	https://cafetalk.com/	部分免費	https://www.youtube.com/watch?v=A9j-GeLt8ag	咖啡滔客是通過Skype進行線上語言學習的服務網站。無論是線上英語會話、商務英語、韓語、義大利語、還是音樂、瑜伽等您所感興趣的項目，您都能輕鬆找到屬於您自己的有趣課程。	英語, 聽力, 閱讀, 口說, 單字, 日文	\N	國小, 國高中, 大學以上	咖啡滔客 cafetalk
組織/社群, 課程/活動	羊羊	https://schoolaplus.com/images/logo.jpg	語言與文學	\N	https://schoolaplus.com/	需付費	\N	最真實的海外遊學心得│最實惠的語言學校費用比較推薦，School A+ 不只比較價格，同時查看最真實的學生評論，評分你的學校，選擇最推薦、適合的遊學精彩生活。熱門遊學代辦國家：菲律賓、澳洲、日本、澳洲、韓國、英國、美國。（轉自官方網站）	英語, 旅遊	\N	大學以上	School A+ 海外遊學評價網
組織/社群	\N	https://i.imgur.com/NxccNEO.jpg	教育	\N	https://www.108epo.com/	免費	\N	111學年度開始，大學申請入學（學測）審查將採計學習歷程檔案，而學習歷程檔案中的「課程學習成果」是新制中一項重要變革。為瞭解高中現場實行情況，並凝聚高中端和大學端對於「課程學習成果」該如何呈現、如何審查的共識，台大社會系「作伙學團隊」已於109年舉辦五十場審議會議，蒐集大學教授、高中教師、家長和學生的意見。超過九成的與會者認為大學在審查「課程學習成果」時，應該秉持「過程比結果更重要，或一樣重要」，以及「核心素養能力比學科知識更重要，或一樣重要」兩大原則。招聯會也將此意見納入大學審查學習歷程檔案將採「三重二不」的建議原則。（取自https://reurl.cc/zZ6M4y）	108課綱, 自主學習, 教育政策, 生涯探索	\N	國高中, 大學以上	作伙學
組織/社群	袋鼠	https://i.imgur.com/NJpTpQK.jpg	教育, 語言與文學	\N	https://www.facebook.com/groups/ehuayu/	免費	\N	只要和國際華語數位教學相關之大小事、工具、服務、工作機會，通通歡迎在此社團交換。（取自官方社團）	華語文, 數位工具, 教學方法, 線上教學, 教材, 教案	\N	國小, 國高中, 大學以上	全球話e視野－國際華語數位教學交流
課程/活動	羊羊	https://vincekotchian.com/media/3312/vk_logo.png	語言與文學	\N	https://vincekotchian.com/	部分免費	https://www.youtube.com/watch?v=Jw6ebPfEuv4	提供大量免費的GRE學習資源，包含單字, 閱讀, 數學教學等…。Our tutors average 10 years of experience delivering expert GRE, SAT, and ACT test prep to raise your scores. Free do-it-yourself resources inside. We've got rave reviews from 190+ clients!(From website)	英語, 閱讀, 寫作, 單字, GRE	\N	國高中, 大學以上	vince kotchian
工具/操作	袋鼠	https://i.imgur.com/XHVtJIp.png	語言與文學	\N	https://dict.naver.com/	免費	\N	NAVER 是韓國最大的網際網路公司，也是大部分韓國人日常使用的搜尋引擎。NAVER 旗下的字典不僅容易上手，資訊量也相當豐富，非常適合韓文初學者使用(簡介摘自https://reurl.cc/QLbg3o)	韓文, 單字	\N	學齡前, 國小, 國高中, 大學以上	NAVER韓文字典
影片	袋鼠	https://i.imgur.com/3XTDxbp.jpg	語言與文學	\N	https://www.youtube.com/channel/UCBK2mLn88yrH_wsKcKWrQlw/featured	免費	\N	韓國老師能幫你們簡單快速的學習韓文。從學韓文字母開始到你們能講一口流利的韓文，我們一天十分鐘一起學習韓文吧。(簡介摘自https://reurl.cc/QLbg3o)	聽力, 閱讀, 韓文, 發音, 文法	\N	學齡前, 國小, 國高中, 大學以上	天天韓文 Everyday Korean
工具/操作	羊羊	https://appscyborg.com/static/img/robot.svg	學習/教學工具	\N	https://appscyborg.com/	免費	\N	app scyborg 提供轉檔服務與影音網頁下載服務，讓使用者能夠更容易地取得特定網站上的內容。 All The Best Web Applications In One Place. Fast, easy to use,no ads, no tracking 100% respectful of your privacy 60 web apps and growing. (From website)	影片, 數位工具	\N	國高中, 大學以上	app scyborg
課程/活動	羊羊	https://s3-eu-west-1.amazonaws.com/englishninjasstatic/000/logo-og-200-2020.png	語言與文學	\N	https://englishninjas.com/	需付費	\N	English Ninjas is the best platform to improve your English speaking skills. Hundreds of native tutors are online to teach English with affordable prices starting at 6.84$/month. You can learn more vocabulary, grammar and get fluent by speaking with your teachers. We are the best course for IELTS & TOEFL. Visit us now!(From website)	英語, 聽力, 閱讀, 口說, 寫作, 單字	\N	國小, 國高中, 大學以上, 學齡前	english ninjas
課程/活動	羊羊	https://upload.wikimedia.org/wikipedia/en/7/74/Italki_logo_2017_3200x2025.png	語言與文學	\N	https://www.italki.com/i/ref/HEC0cc?hl=en&utm_medium=user_referral&utm_source=copylink_share	需付費	\N	italki is an online language learning platform which connects language learners and teachers through video chat. The site allows students to find online teachers for 1-on-1 tutoring, and teachers to earn money as freelance tutors. One can choose online language lessons taught by a professional teacher, who provides structured learning plans, or a community tutor. Students may also use it as a platform for mutual language exchange. (From wiki)	英語, 聽力, 口說, 閱讀, 單字	\N	國小, 國高中, 大學以上	italki
課程/活動	羊羊	https://livexp.com/images/og-default.png	語言與文學	\N	https://livexp.com/referral/ss3577m401320	需付費	\N	LiveXP is all about providing the shortest & most efficient way to speak like a native. 🚀 Start now with 1-on-1 private lessons, courses & free live sessions! (From website)	英語, 聽力, 口說, 外國文化, 閱讀, 單字	\N	學齡前, 國小, 國高中, 大學以上	livexp
組織/社群	\N	https://i.imgur.com/9l0dN2v.png	語言與文學	\N	https://www.voscreen.com/	免費	\N	Voscreen 是一種高度創新的方法，可幫助學習者自行提高英語語言技能，而無需明確需要外部指導。此外，它還可以為教師提供所需的工具，以一種引人入勝、互動和具有挑戰性的方式培養學生的語言技能。\nVoscreen 是基於自己的學習方法和途徑，通過對母語學習過程和環境語言習得的細緻研究而發展起來的。\n由於在成長過程中可以接觸到各種語言，蹣跚學步的孩子能夠獨立獲得用自己的母語進行交流的基本語言技能。Voscreen 用戶可以體驗到類似的語言習得，因為他們系統地接觸到英語。每個短片都以易於理解、具有具體意義的現實生活背景為基礎，用英語圍繞著學習者。為了達到精通英語的目標，學習者所要做的就是每天花 20 到 40 分鐘使用 Voscreen 來確保持續接觸。（取自並翻譯自官方網站)	英語, 聽力	\N	學齡前, 國小, 國高中, 大學以上	Voscreen
組織/社群, 工具/操作	\N	https://i.imgur.com/5t4sXec.png	綜合型學習資源, 語言與文學	\N	https://www.jpmarumaru.com/tw/index.asp	免費	\N	marumaru從基礎的五十音、常用單詞與日語、線上練習、甚至是唱歌學日語的功能都有，而且不僅完全免費，現在還無廣告，讓你能專心閱讀學習。(簡介摘自https://reurl.cc/e3OOEQ)	聽力, 閱讀, 口說, 單字, 日文	\N	學齡前, 國小, 國高中, 大學以上	marumaru日文學習
工具/操作	\N	https://i.imgur.com/gY1uEl9.png	藝術	\N	https://www.motionelements.com/zh-hant/	免費	\N	MotionElements上有許多短影音素材，品質、畫質也都有一定品質，可作為教學影片的剪輯素材使用，網站上的免費影音多數都不會超過一分鐘，在點擊想要下載的影片後，會看到詳細的細節說明像是影音長度，長寬比、授權說明等資訊，都可以在影片下方找到。(簡介摘自https://reurl.cc/yrrKb2)	影片, 素材	\N	國小, 國高中, 大學以上	MotionElements影片素材
組織/社群	\N	https://i.imgur.com/1wh4r0o.png	語言與文學	\N	http://chinese-linguipedia.org/index.html	免費	\N	中華語文知識庫（台灣版）提供的詞庫查詢服務，項目包括兩岸合編《中華語文大辭典》、兩岸差異用詞、《漢字源流彙編》、學術名詞。\n本知識庫搜尋欄位有字詞、部首、注音、漢拼等查詢選項，並預設以模糊查詢以求更完整結果。結果頁面除呈現基本文字解釋，更隨著本知識庫內容越見豐富，也漸漸整合進更多內容資源便於使用者參照學習。\n除了詞庫查詢之外，本會特別規劃「漢字說故事」影片、「兩岸每日一詞」影片（中華文化總會與中華電視合作製播）、「詩詞吟唱教學」影片（中華文化總會與輔仁大學中文系合作製播）。(簡介摘自https://reurl.cc/j11m8M)	中文, 文學, 漢字	\N	學齡前, 國小, 國高中, 大學以上	中國語文知識庫
組織/社群	\N	https://i.imgur.com/hmmFMPJ.jpg	教育	\N	https://cy-l.com/	免費	\N	我們是一群由中山大學、陽明交通大學、中國醫藥大學、長庚大學所組成的新創教育團隊，期待透過課程及開放資源平台，幫助學生準備學習歷程檔案及探索大學科系。 透過學長姐的經驗分享，找出自己有興趣的多元學習經驗	自主學習, 教育創新, 教育	\N	國小, 國高中, 大學以上	匯星教育
組織/社群, 工具/操作	\N	https://i.imgur.com/GFlDHEn.jpg	資訊與工程	\N	https://www.fooish.com/	免費	\N	大家好，我是站長 Mike，為什麼會有這個網站呢？因為自己最初在開始學習網頁開發技術的時候，發現網路上的中文技術教材不多，品質也參差不齊。在對相關技術熟悉後，希望能貢獻一點時間和實務經驗，撰寫分享各類主題的學習內容，幫助對相關技術有興趣的朋友更容易入門 😁\n站名 Fooish 的唸法是 Foo-ish，是 "有點 Foo" 的意思，每個人從開始學程式技術，都一定有看過不少 "Foo 範例" 吧？！所以說，沒有點 Foo 你怎麼變大神呢....(簡介摘自https://reurl.cc/8oo657)	程式設計, 數位工具, HTML/CSS, JS, 網頁設計, SQL	\N	國小, 國高中, 大學以上	Fooish程式技術
工具/操作	\N	https://i.imgur.com/3iCtp7D.png	藝術	\N	https://colorhunt.co/	免費	\N	Color Hunt 是由Gal Shir創建的美麗調色板的開放集合。Color Hunt 最初是一個個人小項目，旨在在一群設計師朋友之間分享流行的色彩組合。該系列擴大了規模，現在每天被全世界成千上萬的人用作方便的資源。Color Hunt 的創建旨在慶祝色彩之美，並作為色彩靈感的首選資源。(簡介摘自https://reurl.cc/8o2dVR)	藝術, 設計	\N	國小, 國高中, 大學以上	Color hunt
組織/社群, 課程/活動	袋鼠	https://i.imgur.com/OzFOJGp.jpg	綜合型學習資源	\N	https://www.facebook.com/TaoyuanYouthVolunteer	免費	\N	這裡是桃園市政府青年事務局的青年公共參與交流平台，包含青年志工、永續發展、地方創生、USR、學生自治組織、桃友會、青諮會、原青等相關訊息，歡迎桃園青年來此參一咖！	公民參與, 社會創新, 行動學習, 志工, 地方創生	\N	國小, 國高中, 大學以上	桃青參一咖
文章/書	羊羊	http://atomicdesign.bradfrost.com/images/social-card.jpg	綜合型學習資源	\N	https://atomicdesign.bradfrost.com/	免費	\N	Learn how to create and maintain digital design systems, allowing your team to roll out higher quality, more consistent UIs faster than ever before.	設計, 人際關係, 自我探索	\N	國高中, 大學以上	atomic design by brad frost
工具/操作	羊羊	https://blush.design/og-image.png	藝術, 資訊與工程	\N	https://blush.design/	部分免費	\N	Blush makes it easy to add free illustrations to your designs. Play with fully customizable graphics made by artists across the globe.（From website）	UIUX, 網頁設計, APP設計	\N	國小, 國高中, 大學以上	blush design
工具/操作	羊羊	https://www.wolframalpha.com/_next/static/images/share_3eSzXbxb.png	數學與邏輯	\N	https://www.wolframalpha.com/	免費	\N	Wolfram Alpha是由 Wolfram Research 公司推出的一款在線自動問答系統。其特色是可以直接向用戶返回答案，而不是像傳統搜索引擎一樣提供一系列可能含有用戶所需答案的相關網頁。它是基於 Wolfram 早期旗艦產品 Mathematica，一款囊括了計算機代數、符號和數值計算、可視化和統計功能的計算平台和工具包開發的。其數據來源包括學術網站和出版物、商業網站和公司、科學機構等等，例如中央情報局出版物《世界概況》、康奈爾大學圖書館出版物《All About Birds》、《Chambers Biographical Dictionary》、道瓊斯公司、Catalogue of Life （頁面存檔備份，存於互聯網檔案館）、 CrunchBase、百思買 、美國聯邦航空管理局、美國地質調查局等。（轉自維基百科）	數學, 邏輯	\N	國小, 國高中, 大學以上	wolframalpha
APP	羊羊	https://avl-images.s3.ap-south-1.amazonaws.com/perfectscore-landing/psl-slide7.png	語言與文學	\N	https://www.earnaha.com?ref=6EBBPzDFvVZotjWFyXx2Y2	部分免費	\N	Aha 是一家來自矽谷和紐約的新創軟體公司，由來自Stanford 史丹佛和 MIT 麻省理工學院的校友共同創立。我們的創辦人、投資者與顧問團隊擁有科技業、金融和管理諮詢的豐富經歷，致力創造非凡的軟體解決全球用戶的問題！我們正在打造 defi 產業的第一個 learn-to-earn 教育銀行，為 Z 世代的學生們推出 NFT-Crypto 錢包服務。在Aha線上英文平台，學生們不只可運用人工智慧、數據分析及客製化功能有效準備英文檢定及歐美升學考試（如 SAT, GMAT, TOEIC, IELTS, TOEFL...等），還能在過程中賺取學習代幣。（截自104）	英語, 閱讀, 單字	\N	國小, 國高中, 大學以上	aha
工具/操作	羊羊	https://www.parrottalks.com/image/share.png	學習/教學工具, 語言與文學	\N	https://www.parrottalks.com/i/sJQxkre4	部分免費	\N	面對全民英檢、TOEIC及TOEFL等測驗，ParrotTalks 利用大腦的記憶原理，為您量身打造學習時程，幫助您用最有效率的方式，牢記最多的單字。依照您預計的完成日期，我們為您規劃每天的課程。每天的課程分為知新以及溫故兩階段：在知新階段，您將學習ㄧ些新單字。在溫故階段，系統呈現給您當日最需要複習的單字。（轉自官方網站）	英語, 閱讀, 寫作, 單字	\N	國小, 國高中, 大學以上	parrottalks抄筆記
組織/社群, 課程/活動	袋鼠	https://i.imgur.com/vujQaHw.png	教育	\N	https://www.facebook.com/WorldinClass	免費	\N	讓小孩上課就像在旅行，\n打開課本就看到了世界！\n用創新的課程設計翻轉教育現場教材，\n打開孩子對世界探索的渴望、\n做師培生的共備學習社群、\n也做現場老師的備課靠山。(簡介摘自粉絲專頁https://reurl.cc/55oDlV)	教學方法, 教師培力, 自主學習, 教育創新, 民主教育, 教案, 素養教育	\N	國高中, 大學以上	小課旅-創新素養教育
組織/社群, 課程/活動	芯瑜	https://i.imgur.com/Dty6Jlo.png	教育, 藝術, 人文社會	\N	https://m.facebook.com/NationalComicMuseum/	部分免費	\N	什麼？籌備小隊秘密基地被你發現了？那編編在此宣布，從現在起，你也是漫博館籌備小隊的小隊員啦！\n……\n……\n等等，別走哇，我們一點也不可疑啦。\n你喜歡漫畫，對吧？\n跟你一樣，我們是一群熱愛漫畫的人，正在努力籌備一座新型態博物館！\n我們希望透過漫畫的力量，與大眾產生碰撞與合作，一同探究漫畫的可能性。我們蒐集漫畫寶藏，進行保存、研究與展示，並將知識轉譯，使大眾容易瞭解與運用。希望漫畫能進入每個人的生活，發揮無限的影響力。\n新來的小隊員，你也被我們的使命感動到熱淚盈眶了嗎？\n那以後我們背靠背，你罩我、我罩你。說好了喔。\n我～愛～漫～畫！(簡介引用自官方臉書)	歷史, 藝術教育, 教育	台中	國小, 國高中, 大學以上, 學齡前	國家漫畫博物館籌備小隊
工具/操作	\N	https://i.imgur.com/RQecNap.png	語言與文學, 學習/教學工具	\N	https://info.flipgrid.com/	免費	\N	Flipgrid 是一個讓教師透過建立數位社群、以短影片為工具，讓學生進行社交學習的應用軟體。每一位老師都可以在 Flipgrid 建立自己的教室，並在教室裡發布討論主題，學生可以透過製作短影片來分享自己的觀點，影片內容可以被教室裡的所有用戶看到，老師可以選擇開放影片的按讚、評論功能，這樣會帶來一定的競爭性，進而激發學生的積極性；而且每個教室都有密碼確保安全性，老師可以將密碼或者連結分享給自己的學生。(簡介摘自https://reurl.cc/e35GRW)	英語, 聽力, 閱讀, 中文, 口說, 影片, 華語文	\N	學齡前, 國小, 國高中, 大學以上	Flipgrid
組織/社群, 工具/操作	袋鼠	https://i.imgur.com/OQqh6fy.jpg	運動/心理/醫學	\N	https://sites.google.com/view/ympsychopynotes/home	免費	\N	我是輔大心理系的老師黃揚名，過去都是用E-Prime來寫心理學實驗的程式，雖然很方便，不過限制實在有點多。決定要來學習Psychopy，歡迎大家多交流。	心理學, 心理實驗, 心理測驗	\N	國小, 國高中, 大學以上	我的Psychopy 學習筆記
工具/操作	Tiff	https://i.imgur.com/SlRlsVU.png	資訊與工程	\N	http://www.codeschool.com/	部分免費	\N	比較基礎，有點寓教於樂（玩中學），能激起剛接觸程式的新手興趣。(參考臨安初霽)	程式設計, Python, Java, C/C++, JS, HTML/CSS, 資料庫, 網頁設計	\N	國高中, 大學以上	Code School
影片	羊羊	https://i.pinimg.com/280x280_RS/e9/bf/ce/e9bfceb364f37a152c90582578e9247a.jpg	運動/心理/醫學, 生活	\N	https://www.youtube.com/channel/UCcU6CC2Gkc18aBUfEtdjaAA	免費	\N	HI, 我是阿維。\n我主要會分享關於生活的一些小知識及心理學。\n另外還有邏輯謎語遊戲，讓大家動動腦哦！\n盡量每星期會有至少一支影片。\n因為從上到下、裡到外都是一人包辦。\n所以更新速度就要大家包容包容了。\n另外，所有影片內容都是通過大量閱讀和整理，最終結合個人觀點製作出來的。\n不能表明內容一定是百分之百正確。\n（轉自YouTube）	影片, 情緒, 輔導, 自我探索, 心理學	\N	國小, 國高中, 大學以上	維思維WeisWay
組織/社群, 工具/操作	袋鼠	https://i.imgur.com/wX8JqCQ.jpg	綜合型學習資源, 資訊與工程, 藝術	\N	https://tutorial.jumpdesign.tw/index.html#menu-1	免費	\N	「田甜甜教案實驗室」是一個以設計為教學的網站，包括UI設計、網頁設計、部落格製作與相關平面設計，此外也有豐富的設計資源等你來挖掘。	UIUX, Python, Java, C/C++, JS, HTML/CSS, 程式設計, 排版素材, 圖片素材, 設計	\N	國小, 國高中, 大學以上	田甜甜教案實驗室
組織/社群, 課程/活動	\N	https://i.imgur.com/dcti45N.png	綜合型學習資源	\N	https://www.open.edu/openlearn/	免費	\N	我們的願景是通過免費教育資源每年覆蓋數百萬學習者，從而打破教育障礙。\n免費學習資源是我們社會使命的核心。我們認為，開始教育的主要障礙是機會、缺乏信心和成本。這就是開放大學努力消除這些障礙的原因：\n• 我們建立在離線和在線可用的格式和平台上。這提高了我們的可發現性和 訪問性。 \n• 我們通過健全和可持續的商業模式計劃提供免費學習，從而消除 成本 。\n•  我們通過幫助他們獲得徽章和參與聲明來提高學習者的自尊和 信心。\n開放大學有一種激進和開創性的訪問方法。與拒絕在我們自己的學生面前設置資格障礙相匹配，我們還承諾為他人發布和推廣免費學習內容，以造福更廣泛的社區。OpenLearn 是大規模和廣度免費提供高質量開放教育資源 (OER) 的開拓者，所有人均可免費使用。(簡介摘自https://reurl.cc/dXdlr2)	自主學習, 線上教學, 終生學習	\N	國小, 國高中, 大學以上	OpenLearn
組織/社群, 課程/活動	\N	https://i.imgur.com/m0ezwmc.png	綜合型學習資源	\N	https://www.sharecourse.net/sharecourse/	部分免費	\N	為了透過網路科技推廣知識，國立清華大學與捷鎏科技進行產學合作， 於2012年成立了學聯網。 學聯網是目前台灣最大的中文「磨課師」平台(MOOCs, Massive Open Online Courses, 大規模線上開放課程)， 透過網路科技提供600門以上的免費與付費課程，讓知識能分享到每個需要的地方。(簡介摘自：https://reurl.cc/jkXpXL)	自主學習, 線上教學, 終生學習	\N	國小, 國高中, 大學以上	學聯網ShareCourse
組織/社群	袋鼠	https://i.imgur.com/KLU3yb4.png	教育, 綜合型學習資源, 人文社會, 商業與社會創新	\N	https://www.vistareading.com/?m=1	免費	\N	vita讀書作者介紹：「工程師／媒體主編／企業顧問／電商專家」這幾個職稱聽起來都有些距離，不但專業所需的科系背景不同，工作內容也差了十萬八千里，但這些卻是同一個人的經歷──他是臺灣知名的文案寫作專家、暢銷作家鄭緯筌。	數位工具, 社會議題, 投資理財, 自我成長, 自我探索, 自主學習	\N	國小, 國高中, 大學以上	Vista讀書
組織/社群, 文章/書	\N	https://i.imgur.com/nJ7WxH5.png	運動/心理/醫學, 資訊與工程, 綜合型學習資源	\N	https://ayugioh2003.gitbook.io/psychobook/	免費	\N	這是一個心理學知識與相關領域的相關網站，包括心理學的實驗、統計、諮商、使用者經驗以及一些相關的應用心理學。	輔導, 助人工作, 心理實驗, 心理測驗, 心理學, UIUX	\N	國小, 國高中, 大學以上	PsychoBook
影片	\N	https://i.imgur.com/EV4F8ue.png	語言與文學	\N	https://www.youtube.com/channel/UCENj85Wf2_3Tqc321zTUTyA/featured	免費	\N	在實體課程及線上直播課程中，很多中（高）齡上班族學員，詢問我該如何讓「多益」（TOEIC）證照考試，達到「金色」最高境界（860-990分，藍色證照是730-855分，綠色證照是470-725分，台灣考生平均成績是綠色證照的範圍）？我「多益」（TOEIC）證照考試，不論是裸考或考前刻意準備，每次都是輕鬆考到九百多分的金色證照們。並且，我在西元2021年五十三歲時，拿到第三張「多益」滿分證照。希望我能藉由YouTube頻道，和英文證照考生分享，如何藉由日常生活小習慣，累積考英文證照的驚人實力。（簡介摘自：shorturl.at/kyHL5）	英語, 單字	\N	國小, 國高中, 大學以上	Jennifer托福雅思多益字彙教練
組織/社群	袋鼠	https://i.imgur.com/hMyB2cF.jpg	綜合型學習資源, 運動/心理/醫學, 教育	\N	https://www.facebook.com/dreamheart017.official/	免費	\N	羊羊老師是一位國小特教老師。她相信無論老師或學生，每個人身上都藏著魔法、都有別人所沒有的能力。讓我們透過教學相長，引導出彼此的潛在力量，一起閃閃發光吧。	特殊教育, 教育創新, 教育	\N	國小, 國高中, 大學以上	羊羊老師の魔法教室
影片	羊羊	https://d31ezp3r8jwmks.cloudfront.net/piffdz02lkrxqw5rprcz50jkblk5	資訊與工程	\N	https://www.youtube.com/c/WebDevSimplified	免費	\N	My name is Kyle and I have been a full stack web developer since 2015. I have a Computer Engineering degree, but am mostly self-taught when it comes to web development. Because of this I am able to leverage both my formal education as well as my experience as a self-taught developer to create the most comprehensive and easy to understand courses available. I also run the YouTube channel Web Dev Simplified with over 750,000 subscribers. (From official description)	影片, 程式設計, 網頁設計, HTML/CSS, JS	\N	國高中, 大學以上	Web Dev Simplified
組織/社群	\N	https://i.imgur.com/TOgMlIM.jpg	人文社會	\N	https://www.facebook.com/CitiLens/	免費	\N	見域，看見地方。\n打開一扇看新竹的窗，和我們一起在新竹舊城區裡，向城市學習、向社區學習。\n在地刊物／走讀旅行／講座／社會創新	社會議題, 公民參與, 文化, 社會創新	\N	學齡前, 國小, 國高中, 大學以上	見域
工具/操作	袋鼠	https://i.imgur.com/Q9Vy21J.jpg	資訊與工程	\N	https://learn.shayhowe.com/html-css/	免費	\N	Learn to Code HTML & CSS 是一本簡單而全面的指南，致力於幫助初學者學習 HTML 和 CSS。本指南概述了基礎知識，涵蓋了前端設計和開發的所有常見元素。(取自官方網站)	程式設計, HTML/CSS, 網頁設計, 數位工具, 資訊科技	\N	國小, 國高中, 大學以上	Learn to Code HTML & CSS
組織/社群	袋鼠	https://i.imgur.com/0fSecZM.png	綜合型學習資源, 教育	\N	https://mynotes.org/istudy/	免費	\N	我的自主學習筆記為清水高中的老師所創立的網站，在此網站中可以收尋到學生、老師與學校如何進行自主學習，以及老師也有推薦很不錯的書籍與網站，等你來發掘。	自我探索, 自我成長, 自主學習, 終生學習	\N	國小, 國高中, 大學以上	我的自主學習筆記
組織/社群, 工具/操作	袋鼠	https://i.imgur.com/QaWZo6A.png	人文社會	\N	https://www.taiwanstat.com/realtime/	免費	\N	我們都是一群很幸運很幸運的人，在這塊被受保護的土地下長大。\n我們致力於將各種複雜的數據轉化成各種容易解讀的視覺圖表、文字報導，讓所有人可以輕易了解、討論，展開行動， 以公民科技的力量，創造更多開放資料、開放政府的價值。\n我們相信現在的這塊土地，是需要被新血重新改變的時代， 今天我們站出來，也相信在未來會有無數與我們一樣的團隊與人物，一同為了所熱愛的這塊土地發聲，為了守護所熱愛的這個環境行動，為了讓後代們也能一起在這個快樂的環境下生活而站出來。(簡介摘自：https://reurl.cc/6E1bqM)	社會議題, 公民參與, 文化	\N	學齡前, 國小, 國高中, 大學以上	用數據看台灣
組織/社群, 文章/書	袋鼠	https://i.imgur.com/QxYhOdf.png	語言與文學, 綜合型學習資源	\N	https://www.mirrorfiction.com/	免費	\N	鏡文學成立於2017年4月，屬於「鏡傳媒」旗下，是一個以台灣為基地、放眼國際的小說與劇本平台，我們將計畫性地扶植有志從事文學創作的人才，規劃完善的作家經紀制度，以作家全版權開發為目標，讓更多創作者的作品得以正式出版、授權與改編成影視作品、電玩遊戲、漫畫、衍伸周邊商品等。\n除了挖掘優秀的虛構小說與劇本故事，母公司「鏡傳媒」所出版的真實事件與人物報導，也是我們開發成影視改編題材的來源之一，以此因應新一波「根據真實事件改編」的世界潮流。\n我們歡迎小說與劇本創作者在此日日耕耘連載、與讀者討論互動；歡迎讀者來這裡閱讀您喜愛的作品、尋訪您欣賞的作家，甚至將您所從事的行業或特殊人生經歷寫成小說，讓自己也成為作家；也歡迎影視製作公司、漫畫、電玩遊戲開發商來這裡尋找適合改編的作品與素材。\n我們期許自己能開發出多元的「智慧財產」（Intellectual Property，簡稱IP），成為華文世界最具特色的影視版權交易平台，也為台灣的出版業、影視業、遊戲電玩業等注入新的活水。(簡介摘自：https://reurl.cc/Y92k4X)	閱讀, 文學, 歷史, 行動學習	\N	學齡前, 國小, 國高中, 大學以上	鏡文學
組織/社群, 文章/書	\N	https://i.imgur.com/bgMWFGX.jpg	綜合型學習資源, 教育, 語言與文學	\N	https://ireader.books.com.tw/	免費	\N	1995年，博客來以台灣第一家網路書店起家，20年來在日漸成熟、競爭激烈的電子商務市場中，打造一處各世代各地區的消費者都能享有快速、便利且充滿溫度、質感的線上市集。我們開啟了與消費者不間斷的溝通。從商品的多樣性、服務的再進化，到公民議題、個別社群的介入，便是企圖打破溝通的媒介，以「內容」「專業」真正地走入大眾生活。\n回歸到原點「閱讀」，我們想要鎖定具有潛力、容易對話的新世代們：融入3C生活、熟悉網路世界；對流行事物感興趣、同儕意識強烈；處於獨立思考的開啟階段，但同時也還受制規範(學校、家長)。16~18歲的高中生，就是我們所取得的最大公約數。2009年，博客來成立專職小組負責高中生閱讀推廣業務，從單向的贈送過刊雜誌、發行閱讀報刊，到與主管機關雙向的合作互通，包括國教署中學生網站的營運規劃、北市教育局「高職人文閱讀活動」；並設置高中生書店，建立青少年專屬的書籍分類，在龐大的書籍選擇中給予明確、適時適用的閱讀參考指南。(簡介摘自：https://reurl.cc/7egb71)	行動學習, 終生學習, 自主學習	\N	學齡前, 國小, 國高中, 大學以上	青春博客來
工具/操作	袋鼠	https://i.imgur.com/azMTbg0.jpg	語言與文學	\N	http://a1.marugotoweb.jp/	免費	\N	這個網站是入門程度的學習網站，從學習平假名、片假名的筆順開始，還有日常打招呼等應用對話。網站也有提供一些情境小短片，對初學者而言可以習慣日語腔調。文法、句型的部分也介紹得很清楚。每個主題還有相對應的日本文化，介紹一般課本內容以外的變化，例如「さん」和「さま」的差別，相當實用。(網站摘自：https://reurl.cc/e6RexK)	閱讀, 口說, 單字, 日文	\N	國小, 國高中, 大學以上	まるごと入門
組織/社群	\N	https://i.imgur.com/IdTHlr2.png	資訊與工程	\N	https://slat.org/	免費	\N	軟體自由協會創立於 2001 年 4 月 8 日，目標在服務自由軟體與開放源碼的社群，以追求社群的成長和推廣自由軟體與開放源碼的應用。自由軟體社群（free software community）泛指支持軟體自由理念、對自由軟體有興趣或有花心血的人，如自由軟體的維護者、創作者、測試者、倡導者．．．等等皆是。	數位工具, 科技, 資訊科技	\N	國小, 國高中, 大學以上	中華民國自由軟體協會
組織/社群	羊羊	https://cofacts.tw/_next/static/images/ogimage-1f800d6cb0f86163f60c5e5711f62396.png	綜合型學習資源, 人文社會	\N	https://cofacts.tw/	免費	\N	一起來幫網路上的可疑訊息寫查核回應、共同教導聊天機器人回話，將多元的闢謠資訊傳遞給在 LINE 上收到謠言的人。（取自官方網站）	資料庫, 社會議題, 法律, 公民參與	\N	國小, 國高中, 大學以上	Cofacts 真的假的
影片	羊羊	https://i.ytimg.com/vi/4mDDqJ6TflY/maxresdefault.jpg	商業與社會創新	\N	https://www.youtube.com/watch?v=4mDDqJ6TflY&list=PLXvc61CweJAdVcibihT04RVJH7nE_-qlW	免費	\N	YouTuber「好棒BUMP」拍攝一系列名為「詐騙解碼」踢爆詐騙集團\n的反詐騙影片，請大家不要因為貪心而成為詐騙集團下手的目標，天下沒有白吃的午餐，投資請慎選管道，勿聽信來路不明的名牌及資訊。（取自高雄市政府警察局公告專區介紹）	價值主張, 商業, 投資理財, 社會議題	\N	國高中, 大學以上	好棒Bump詐騙解碼系列
影片	羊羊	https://i.imgur.com/glI5aZ8.png	商業與社會創新	\N	https://www.youtube.com/c/SHINLI/featured	免費	\N	SHINLI/李勛的頻道，分享信用卡、投資、省錢存錢以及各種小資理財的訊息，在這個低薪的時代，年輕人省錢不是罪。（取自YouTube介紹）	投資理財	\N	國高中, 大學以上	SHINLI理財大小事
影片	羊羊	https://i.imgur.com/K9ENTRa.jpg	運動/心理/醫學	\N	https://www.youtube.com/c/%E9%A4%A8%E9%95%B7%E6%88%90%E5%90%89%E6%80%9D%E6%B1%97/playlists	免費	\N	館長在他的YouTube播放清單放了很多關於健身教學的影片，有滋事的校正與飲食的觀念分享。	健身, 體育, 健康, 減肥, 增肌, 減脂	\N	大學以上	館長成吉思汗健身教學
工具/操作	羊羊	https://g.udimg.com/assets/apple-touch-startup-image-320x460-169b3a9d64225a83f49878fffc0c5498cec781ac08db76b61b4bf377969978e7.png	語言與文學	\N	https://www.urbandictionary.com/	免費	\N	可以搜尋出大家認同與否定的流行單字。A celebrity free pass is an agreement between you and your significant other that if you meet said celebrity and there is an opportunity to sleep with them, your partner cannot get mad at you for doing so because you had agreed before hand that this person was your celebrity free pass. It is ideal if both of you in the relationship choose a celebrity free pass so that the playing field is even.（From official）	英語, 閱讀, 單字	\N	國高中, 國小, 大學以上	Urban Dictionary
影片	羊羊	https://y.yarn.co/site/favicon-96x96.png	語言與文學, 學習/教學工具	\N	https://getyarn.io/	免費	\N	透過搜尋短片來尋找學習英文單字的影片素材以加深記憶單字的印象，其中也包含著名的電影或是被大家拿來炒作過的迷因系列。	英語, 聽力, 影片, 單字	\N	國小, 國高中, 大學以上	YARN_短片搜尋
文章/書	羊羊	\N	語言與文學	\N	https://github.com/F4bwDP6a6W/FLY_US	免費	\N	FLY_US 是作者收集的一些備考北美研究生的資料。包括美國大學信息:高性價比大學及費用，GRE還有托福資料。最新特別加入《再要你命3000系列》，包括原始的PDF版本。還有親自製作的，supermemo導入版本，和有道單詞表（取自作者README）	英語, 閱讀, 單字, 數學, GRE	\N	國高中, 大學以上	FLY_US北美研究生留學
工具/操作	羊羊	http://data.typeracer.com/public/images/tr_logo_200.cache.png	學習/教學工具	\N	https://play.typeracer.com/	免費	\N	今天測試你的打字技巧！ 與來自世界各地的真人對戰。 TypeRacer 是最好的免費大型多人在線競技打字遊戲。 與現場對手比賽，同時學習提高打字速度並獲得樂趣！ 輸入流行音樂、歌曲、動漫、漫畫書等的名言。（取自官方網站）	英語	\N	國小, 國高中, 大學以上, 學齡前	TypeRacer
文章/書	羊羊	https://pomb.us/static/b4694e6041953e3cb16f6a889f0cbc59/25036/card.png	資訊與工程	\N	https://pomb.us/build-your-own-react/	免費	\N	用原生JS打造自己的React，透過原生JS語法來打造可以更了解React背後的運作原理，此外這也是部分新創公司的面試題目，主要測試面試者是否對技術背後的運作原理是否具有熱誠或是求知慾。	JS, 網頁設計	\N	國高中, 大學以上	打造自己的React
文章/書	羊羊	https://gitbook.tw/assets/images/tw/etc/gitbook.png	資訊與工程	\N	https://gitbook.tw/	免費	\N	Git 是什麼? Git 是一種版本控制系統，Git 可以回到指定的時間點，救回不小心刪除檔案。搭配 Git 教學教您常用 Git 指令並使用 GitHub 一起工作（取自官方網站）	程式設計	\N	國高中, 大學以上	為你自己學Git
文章/書	羊羊	http://uxdesignweekly.com/wp-content/uploads/2014/10/52-weeks-of-ux.jpg	藝術, 資訊與工程	\N	https://52weeksofux.com/	免費	\N	透過每一週的閱讀UX，慢慢培養對UX的興趣與靈感。	網頁設計, UIUX	\N	國高中, 大學以上	52 Weeks of UX
工具/操作	羊羊	https://static.accupass.com/eventintro/2003271030431396450109.jpg	語言與文學	\N	http://openlanguage.com/p/index/	部分免費	\N	開言英語,開言,開言英語官網,open language,美式英語,美語,生活英語,職場英語, 英語學習app,實用英語,地道英語,外教,北美主播,成人英語,零基礎自學,課程定制,私人訂製,美國文化,英語口語,真實場景對話,潘吉jenny,在線英語,口語培訓,Open Language（取自官方網站）	英語, 聽力, 閱讀, 口說, 寫作, 影片, 單字	\N	國小, 國高中, 大學以上	開言英語
文章/書	羊羊	https://lf3-cdn-tos.bytescm.com/obj/static/xitu_juejin_web//static/favicons/apple-touch-icon.png	資訊與工程	\N	https://juejin.cn/	免費	\N	掘金是一個幫助開發者成長的社區,是給開發者用的 Hacker News,給設計師用的 Designer News,和給產品經理用的 Medium。掘金的技術文章由稀土上聚集的技術大牛和極客共同編輯為你篩選出最優質的干貨,其中包括：Android、iOS、前端、後端等方面的內容。用戶每天都可以在這裡找到技術世界的頭條內容。與此同時,掘金內還有沸點、掘金翻譯計劃、線下活動、專欄文章等內容。即使你是 GitHub、StackOverflow、開源中國的用戶,我們相信你也可以在這裡有所收穫。（取自官方網站）	Python, Java, 程式設計, C/C++, JS, HTML/CSS, 資料庫, 網頁設計, APP設計	\N	國高中, 大學以上	掘金
工具/操作	羊羊	https://assets.quizlet.com/a/j/dist/app/i/global/apple-touch-icon.154747d93c18858.png	語言與文學	\N	https://quizlet.com/	免費	\N	透過簡單的介面來學習單字，使用者也可以查看別人搜集的單字卡有哪些。	英語, 閱讀, 單字	\N	學齡前, 國小, 國高中, 大學以上	quizlet
影片	羊羊	https://scontent.ftpe7-2.fna.fbcdn.net/v/t39.30808-6/277487805_541262980697011_301648587710740616_n.jpg?_nc_cat=111&ccb=1-5&_nc_sid=730e14&_nc_ohc=H3dpeKASwe8AX_spw7m&_nc_ht=scontent.ftpe7-2.fna&oh=00_AT-G3LjSjAuaqgqe-gbtdala53lSILsQvHJ_knaKZnkJUQ&oe=62494AEC	自然科學	\N	https://www.youtube.com/channel/UC9YOQFPfEUXbulKDtxeqqBA	免費	\N	胡搞的胡，小子的子，顧名思義就是生活中的各種胡思亂搞，我們從小就被各種規則和期待所束縛，偶爾無傷大雅的胡搞一番，其實是非常愉快噠！（摘自YouTube）	影片, 物理, 創造力, 創客手作, 創客(maker), 化學, 手工藝	\N	國小, 國高中, 大學以上	胡子Huzi
影片	羊羊	https://scontent.ftpe7-1.fna.fbcdn.net/v/t1.18169-9/27459317_165827727391240_5823835991388829724_n.jpg?_nc_cat=100&ccb=1-5&_nc_sid=09cbfe&_nc_ohc=rYKcqZsN0ZIAX98IoRA&_nc_ht=scontent.ftpe7-1.fna&oh=00_AT9arfXMQsrRekFGzJc88AFKumZG0ygp4Zw-JMncpz10qQ&oe=6268AE91	資訊與工程	\N	https://www.youtube.com/channel/UCEL8871qFEakpqYpwBSjHNA	免費	\N	頻道主要記錄與直播平常生活的事，包含打電動，寫網站，聊天打屁，分享面試技巧，職場生活等。網頁教學主要以Vue的開發為主。直播時間表定為：每週三晚上十點	程式設計, JS, HTML/CSS, 網頁設計	\N	國高中, 大學以上	Alex宅幹嘛
影片	小許 	https://i.imgur.com/8s9Pq8G.png	運動/心理/醫學	\N	https://www.youtube.com/watch?v=t1XaSbFS1lI	免費	\N	很多新手岩友都是從岩館抱石的，一段時間後，可能會產生去户外爬真的石頭的想法，但不知道戶外抱石需要做什麼樣的準備。影片跟大家分享第一次户外抱石所需的装备和注意事項。\n\n最近在很多地区新冠都变严重了，请大家尽量减少出行，野外抱石时一定注意保持和其他人的社交距离！\n\nFirst time bouldering outdoors can be intimidating! In this video we talked about the gear you need to have, how to place crash pads, how to down climb and spot someone, and the best practices when bouldering outdoors. :)\n\nThis video was shot a few months back... Please be cautious climbing outdoors now as COVID situations worsened in many places. Reduce travels and climb your local crags, and practice social distancing when you see other groups at the crag!\n	運動, 攀岩, 抱石	\N	國高中, 大學以上	第一次戶外抱石怎麼做
文章/書	羊羊	https://weekly.starbugs.dev/img/logo.jpg	資訊與工程	\N	https://weekly.starbugs.dev/	免費	\N	StarBugs Weekly 由一群在星空般的 Bug 中求生存的開發者所創立的週刊。每週二我們會撰寫一篇原創文章與蒐集一系列國內外的好文與大家分享。內容包含 Web 前端、後端、DevOps、產品開發、專案管理 ... 等等，一切跟產品開發有關的知識。	網頁設計, JS, 程式設計	\N	國高中, 大學以上	StarBugs Weekly 星巴哥技術週刊
文章/書	\N	https://blog.yyisyou.tw/img/favicon.png	資訊與工程	\N	https://blog.yyisyou.tw/	免費	\N	分享網頁前端技術	程式設計, Java, JS, C/C++, HTML/CSS, 資料庫	\N	國高中, 大學以上	Yang space｜前端技術
組織/社群	袋鼠	https://i.imgur.com/MgM5iXp.jpg	人文社會	\N	https://www.facebook.com/SoutheastAsianMigrantInspired/	免費	\N	「望見書間」(SEAMi, SouthEast Asian Migrant Inspired)是一間藝文書店，目標在打造一間開放式的全民空間，讓每位來店的東南亞新住民、移工和台灣民眾都能悠閒自在地參與經營和利用。\nSEAMi 以「分享」、「相互理解」與「多元美學」等三個理念，來打造一個品牌。在這個品牌概念下打造出一個友善移民工的藝文空間，提供「分享式書店服務」、「社群媒體近用服務」和「個人出版服務」等。\n「分享式書店服務」不僅建立東南亞圖書書單資源，也提供新住民和移工免費的母語圖書交換服務。同時也以「帶書人」(Books Carrier) 行動，鼓勵新住民、移工和各方熱心民眾在往返東南亞國時，帶入各種不同類型的圖書與全民分享。\n「社群媒體近用服務」希望每位跨國移動者將自身故事用有趣的方式流傳下來，書店內設立電子設備，錄影或採訪跨國移動者的心聲，每日將影音、文字刊載至官網或社群網站。也許謀求生活不容易，但來喝杯咖啡、唱個歌曲更能證明「人的存在」，維護「發聲」的基本人權。\n「個人出版服務」是以小型創作市集為目標，讓愛繪畫的朋友、會雕刻的朋友、願意編織的朋友，利用工作閒暇時間所生產的文藝創作，不會因為沒有窗口而默默流失，再加上台灣的行銷包裝能力，本品牌力使東南亞風味的小商品得以精緻化生產，讓每個東南亞「素人」都能解放想像力，創造土地發展式的台灣-東南亞藝品。(簡介摘自https://reurl.cc/veZ0za)	社會議題, 公民參與, 文化, 歷史, 行動學習	\N	學齡前, 國小, 國高中, 大學以上	SEAMi 望見書間
組織/社群	\N	https://i.imgur.com/pwap4rh.png	教育, 綜合型學習資源	\N	http://www.gloatw.org/	免費	\N	Glocal Action 全球在地行動公益協會\n 持續深耕泰緬邊境，培力當地社群自助發展。相信「唯有從當地長出來的力量，才能在當地深根茁壯」，我們與社區協力創辦學校，培育邊境青年成為服務工作者，幫助緬甸移工及山區部落孩童就學，支持當地服務網絡，讓人們有尊嚴、有能力，創造更美好的未來。	人際互動, 體驗教育, 生涯探索, 自主學習, 自我探索, 自我成長, 社會創新, 公益	\N	國小, 國高中, 大學以上	Glocal Action全球在地行動公益協會
工具/操作, 組織/社群	\N	https://i.imgur.com/nrO6VQZ.jpg	資訊與工程	\N	https://judge.tcirc.tw/	免費	\N	適合所有中學生及初學者的 Online Judge 系統                                                                            在此網站中，有許多關於程式設計的題目(包含C、CPP、JAVA、PATHON)，也可以在答題中和其他人競賽。	程式設計, Java, Python, 邏輯, 數位工具, C/C++, 競賽程式, 資訊科技	\N	國高中, 大學以上	一中電腦資訊研究社程式設計網站
文章/書	羊羊	https://sensible.com/divi/wp-content/uploads/2020/09/DMMT-cover-262x300.png	資訊與工程, 藝術	\N	https://sensible.com/dont-make-me-think/	需付費	\N	Don't Make Me Think 是 Steve Krug 的一本關於人機互動和網路可用性的書。 本書的前提是一個好的軟體程序或網站應該讓用戶盡可能輕鬆直接地完成他們的預期任務。 Krug 指出，人們善於滿足，或採取第一個可用的解決方案來解決他們的問題，因此設計應該利用這一點。 	英語, 網頁設計, UIUX	\N	大學以上, 國高中, 國小	Dont Make Me Think
組織/社群	袋鼠	https://i.imgur.com/nLMwrZd.jpg	資訊與工程	\N	https://developer.mozilla.org/en-US/	免費	\N	MDN Web Docs 是一個開源的協作項目，記錄了 Web 平台技術，包括CSS、HTML、JavaScript和Web API。我們還為初級開發人員和學生提供了一套廣泛的學習資源。MDN 的使命是為更好的互聯網提供藍圖，並授權新一代開發人員和內容創建者來構建它。\n我們一直在努力將開發人員與他們所需的工具和信息更無縫地連接起來，以便在開放的 Web上輕鬆構建項目。自 2005 年成立以來，Mozilla 和社區已經積累了大約 45,000 頁的免費開源內容。(簡介摘自https://reurl.cc/mGKakj )	科技, 資訊科技, 自主學習, Java, 程式設計, 數位工具, C/C++, JS, HTML/CSS, 網頁設計, SQL	\N	國高中, 大學以上	MDN Web Docs
Podcast	袋鼠	https://i.imgur.com/xWIiuvV.jpg	人文社會	\N	https://open.spotify.com/show/4lIXdcodluoXf7oVEi6U40?si=45c2c0fdebce4395&fbclid=IwAR2BbIuHdCj1nWm7J9Lx4uWeUl8clORbpu-tvm84CytoICcZxYuL5_BEq68&nd=1	免費	\N	「不要問為什麼沒有人錄這個？你就是「沒有人」！」\ng0v 是一個公民社群，致力於加深公民對社會的貢獻以及彼此間的連結。透過 g0v 社群，你可以在這裡尋找志同道合的夥伴，實踐你的理念，並將成果以開放授權模式釋出，讓更多的人可以站在你的成果上接力賽跑。\n「g0v Underground Podcast」 是 g0v 成立十週年後，再次從原本「g0v Underground 零時電台」重啟展開的社群專案。接下來我們將會在這個 podcast 節目中跟聽眾分享 g0v專案、g0v貢獻者，以及很多關於 g0v 公民科技社群的專案幕後故事。	公民參與, 自媒體	\N	國小, 國高中, 大學以上	G0V underground零時電台
文章/書	Tiff	https://storage.googleapis.com/www-cw-com-tw/article/201904/article-5cc0273fb6642.jpg	數學與邏輯, 自然科學, 人文社會, 運動/心理/醫學, 綜合型學習資源, 語言與文學	\N	https://research.sinica.edu.tw/	免費	\N	「研之有物」，中央研究院 2017 年成立的科普媒體，取音自「言之有物」，出處為《周易. 家人》:「君子以言有物而行有恆」。編輯部穿梭走訪中研院各個研究所、實驗室，採訪頂尖研究團隊，揭開研究前線的神秘面紗。目前主要提供採訪文章。	生命科學, 社會科學, 數學, 自然, 中研院, 研究	\N	國高中, 大學以上	研之有物
組織/社群	袋鼠	https://i.imgur.com/f4ZUq7p.png	教育, 運動/心理/醫學, 綜合型學習資源	\N	https://mycareer.yda.gov.tw/	免費	\N	本署建構大專校院職涯輔導工作支持網絡，從以下4個面向推動，以促進整體職涯輔導效能，協助學生職涯發展：\n●策略聯盟-成立大專校院職涯輔導分區召集學校\n●補助激勵-辦理大專校院推動職涯輔導補助計畫、辦理全國大專校院職涯輔導工作成果分享、獎勵暨表揚\n●平臺擴散-建立青年職涯輔導資訊平臺、召開全國大專校院職涯輔導主管會議\n●專業養成-編訂大專校院職涯發展教材及職涯輔導工作手冊、辦理大專校院職涯輔導種子教師培訓\n在平臺擴散的層面，建置本平臺，以蒐集全國各大專校院職涯輔導工作之辦理情形及成效作為政策規劃參據；另本署大專校院職涯輔導相關業務也陸續透過平臺資訊化，服務職涯輔導人員及系所教師可於本平臺申請或報名參與本署推動之相關計畫，參考平臺刊登的資訊並觀摩各校多樣化的職涯輔導推動方式，達到校際交流分享，擴散職涯輔導效益。\n本署為擴散大專校院職涯輔導效益，以策略聯盟之在地化合作方式，推動校際間交流工作經驗與分享，建立全面性、普遍性及實務性職涯輔導工作網絡，特設置大專校院職涯輔導北、中、南區召集學校，期能整合凝聚夥伴學校資源、發展區域特色，並辦理本署各項職涯輔導工作，發揮職涯輔導綜效，提供多元化職涯發展模式，協助學生作好職涯規劃。3區召集學校以及辦理本署各專案相關資訊，亦刊載於本平臺，以利各校瀏覽。                                                                                                                                                                (簡介摘自https://www.youtube.com/c/職涯實驗室CareerDesignLab/about)	自我探索, 生涯探索	\N	大學以上, 國高中	青年職涯輔導資訊平台
工具/操作	\N	https://i.imgur.com/aH8MQWZ.png	學習/教學工具, 資訊與工程	\N	https://www.freeimageconverter.com/	免費	\N	透過 Free Image Convert 除了轉檔之外，還能夠無損壓縮圖片檔案大小，最高可以壓縮四分之一，支援 JPG、PNG、 BMP、GIF、TGA、PDF 轉檔，也能夠替圖檔批次重新命名等，若你有圖片處理需求的話，非常推薦把這款下載起來喔。(簡介摘自https://ez3c.tw/10171?fbclid=IwAR1fC4WfvEk_W6fPru0HEdURDkqvHQ6et1AN0eqjgtVOFVOeT9cVJkm0Iv0)	數位學習	\N	國小, 國高中, 大學以上	Free Image Convert
組織/社群	\N	https://i.imgur.com/Egu9OiB.jpg	數學與邏輯, 綜合型學習資源	\N	https://www.facebook.com/%E6%B2%88%E8%80%81%E5%B8%AB%E7%B3%BB%E5%88%97%E7%94%9F%E6%B4%BB%E6%95%B8%E5%AD%B8%E5%9C%96%E9%91%91-%E5%BE%9E%E7%94%9F%E6%B4%BB%E4%B8%AD%E5%AD%B8%E6%95%B8%E5%AD%B8-168331867170490/	免費	\N	生活中到處都有數學的蹤跡，小從身邊的人事物，大則宇宙，希望藉由這些讓你了解數學的重要性。	數學, 邏輯, 教材	\N	國高中, 大學以上	沈老師系列：生活數學圖鑑-從生活中學數學
影片	袋鼠	https://i.imgur.com/wgyr1Fi.jpg	藝術	\N	https://www.youtube.com/c/DigitalArtCreation/videos	免費	\N	Digital Art Creation是製作一些好的平面設計作品的影片，延時攝影 | Adobe Illustrator、Adobe Photoshop、電影編輯、Premiere Pro、Adobe After Effects、Adobe XD 等中的快速藝術影片、設計應用技巧、產品評論和教程。	藝術, 設計, 創造力	\N	國小, 國高中, 大學以上	Digital Art Creation
影片	袋鼠	https://i.imgur.com/QI5nvES.jpg	藝術	\N	https://www.youtube.com/c/TheSimpleDesigners/featured	免費	\N	歡迎來到 The Simple Designers，這是一個專門提供平面設計教程的 YouTube 頻道。我們的使命是分享設計影片，吸引、啟發並最終將設計師聯繫在一起。我們通過分享 Adobe Illustrator 設計和插圖教程、設計過程影片、創意挑戰和展示其他有才華的創作者來做到這一點。(簡介摘自https://www.youtube.com/c/TheSimpleDesigners/about)	藝術, 設計, 創造力	\N	國小, 國高中, 大學以上	The Simple Designers
工具/操作	袋鼠	https://i.imgur.com/m8BN3mv.png	學習/教學工具, 藝術	\N	https://www.fotor.com/tw/	免費	\N	Fotor 的照片編輯器就像線上版的Photoshop。 你可以輕輕鬆鬆的調整照片顏色、大小、亮度… 等等細節。 此外，若你將帳號升級至Pro 付費版本，Fotor 還提供進階的編輯功能，能提供HDR 的效果。(簡介摘自https://techmoon.xyz/fotor/)	數位學習	\N	國高中, 大學以上	Fotor免費線上照片編輯軟體
組織/社群, 課程/活動	\N	https://i.imgur.com/3b0YQ2l.png	資訊與工程, 綜合型學習資源	\N	https://www.instagram.com/_itseed/	免費	\N	資訊種子培訓計畫的對象為台灣各地大專院校的學生及研究生，報名本計畫並無科系限制，對 IT 產業有興趣即可參與。隨著時代演進，IT 已融入於各產業中 ，資訊種子也逐漸演變為「資訊素養、跨領域人才」的養成計劃。                                                  推動善意的累積與循環，創造樂於分享的世界。\n35 位多元背景的學員，連結跨界業師及校友社群，\n整合理論與實務，營造樂於學習、分享、回饋的環境。	科技, 大數據, 資訊科技, 自主學習, 組課共學, 行動學習	\N	國高中, 大學以上	資訊種子 || ITSEED
影片	\N	https://i.imgur.com/W4yrkmW.jpg	資訊與工程	\N	https://www.youtube.com/c/%E5%BD%AD%E5%BD%AD%E7%9A%84%E8%AA%B2%E7%A8%8B/featured	免費	\N	彭彭的 HTML、CSS、JavaScript 網頁前端工程教學、Python 程式教學、Golang 程式教學、Node.js 後端伺服器程式教學，以及 Java 程式教學影片。   (簡介摘自https://codingbar.ai/about/index.html)	JS, HTML/CSS, 資料庫, 網頁設計, 程式設計	\N	國小, 國高中, 大學以上	彭彭的課程
影片	\N	https://i.imgur.com/9nQ34QM.jpg	資訊與工程	\N	https://www.youtube.com/c/TechWithTim/featured	免費	\N	從這個頻道學習編程、軟件工程、機器學習和所有技術。我的頻道特別強調 python 和 javascript，旨在為您提供免費資源，以便您學習編碼並深入軟件工程和編程行業。我的目標是在互聯網上提供最高質量的編程和技術視頻！  (簡介摘自https://codingbar.ai/about/index.html)	JS, 網頁設計, 程式設計, Python	\N	國高中, 大學以上	Tech With Tim
文章/書	袋鼠	https://i.imgur.com/MeM5zgg.png	藝術, 運動/心理/醫學	\N	https://medium.com/as-a-product-designer/ux-%E6%96%87%E7%AB%A0%E5%88%97%E8%A1%A8-%E5%AD%B8%E7%BF%92%E8%B3%87%E6%BA%90%E5%B0%8E%E8%A6%BD-274b4a09834e	免費	\N	此網站收入一些學習UX設計可以用的文章與資源，包含基礎的了解UX產業、人物誌、用戶訪談技巧、用性測試以及工作中的UX設計師是如何運作的。	設計, 創造力, 商業價值, 價值主張, UIUX	\N	國高中, 大學以上	UX設計文章列表與學習資源導覽
Podcast	袋鼠	https://i.imgur.com/0FrFeRt.png	綜合型學習資源, 人文社會	\N	https://open.spotify.com/show/4M7jxo3djQlikGYRfgPG1g	免費	\N	您收到過假訊息嗎？\n資訊爆炸的年代，各種真真假假的訊息，\n我們怎麼樣才能夠聰明不受騙？\n【新聞真．假掰｜假訊息ByeBye！】\n這是由台灣事實查核教育基金會製作的Podcast節目，\n在這裡我們將邀請各行各業的朋友暢談媒體議題，\n為聽眾提升媒體素養、增強對假訊息的抵抗力，\n達成「群體免疫」，和假訊息說掰掰！	媒體識讀, 傳播產業, 自媒體, 公民參與, 社會議題	\N	國小, 國高中, 大學以上	新聞真．假掰｜假訊息ByeBye！
工具/操作, 組織/社群	袋鼠	https://i.imgur.com/zhRRrnk.jpg	藝術	\N	https://hao.shejidaren.com/index.html	免費	\N	設計導航是一個強大的設計入口網站，包含常用圖片資源、配色教學、設計工具、尺寸、前端開發介面以及建築室內設計與書籍設計。	藝術, 設計, 創造力	\N	國小, 國高中, 大學以上	設計導航
工具/操作	袋鼠	https://i.imgur.com/v0efTPY.jpg	藝術	\N	https://www.colourlovers.com/	免費	\N	COLOURLovers 是一個國外的大型創意社群網站，網站上提供了許多的色彩搭配、調色盤、圖案…等等，除了可以了解到國外色彩設計的最新趨勢外，還可以讓不了解色彩設計的使用者以簡單的方式來嘗試不同的色彩搭配方案。同時 COLOURLovers 還提供許多網頁設計時可能會用到的素材和圖形，幾乎都可以免費來使用。	藝術, 設計, 創造力	\N	國小, 國高中, 大學以上	COLOURLovers
組織/社群, 文章/書	\N	https://i.imgur.com/7BT2HBd.png	商業與社會創新	\N	https://meet.bnext.com.tw/	免費	\N	由《數位時代》自2011年起開始推動，透過跨平台的專業媒體以及交流月會、企業或投資媒合、國際參訪、創業競賽 Neo Star Demo Show、新創展會 Meet Taipei創新創業嘉年華等活動所打造的創新創業社群網絡，也是一個最具傳播影響力與商業價值，國際級的新創機會交流平台，致力於促成資訊、資金、資源、人才、以及國際連結能夠廣泛交流與精準媒合。	社會創新, 商業價值, 人力資源	\N	國高中, 大學以上	Meet創業小聚
APP	羊羊	https://www.geocaching.com/play/Content/images/preview-lg.jpg	綜合型學習資源, 自然科學	\N	https://www.geocaching.com/	免費	\N	地理藏寶是一種戶外活動，玩家會使用GPS接受器或其他導航技術在世界上的任何地方來藏匿及找尋地理藏寶盒。一般的地理藏寶盒是一個小型防水容器，裡面放置日誌。較大的容器也可以存放交易的物品，通常是價值不高的玩具或小玩意。地理藏寶經常被描述為一個「高科技遊戲的捉迷藏」。目前地理藏寶盒存在於超過100多個國家，遍及南極洲在內的七大洲。至2010年4月10日，世界上有超過1,031,429個使用中的地理藏寶盒。	創造力, 設計, 創客手作, 遊戲教育, 親子教養, 人際互動, 互動軟體, 社交軟體, 設計思考	\N	國小, 國高中, 大學以上	地理藏寶-GEOCACHING
組織/社群	\N	https://i.imgur.com/k0CsISu.png	語言與文學	\N	https://www.sigure.tw/	免費	\N	熱愛的事情有很多，但始終陪伴我的是日文，對日語研究的熱忱從來沒有銳減，喜愛教學的我為了讓自學者有入門的管道，於是誕生了第一篇日語五十音教學，從此再也停不下來，就這樣一直寫到現在了。\n開始撰寫教學之後就想到如果有人是完全自學的話，就需要一個有系統、有規劃的教學，因此決定從入門五十音、初級文法、單字開始寫，讓自學的人也能像上課一樣能按部就班地學習，雖然目前才寫到N3，但我會持續更新下去，總有一天會把N1全部寫完的！\n作者：時雨（時雨の町）\n出處：https://www.sigure.tw/learn-japanese/notice/about-site.php	日文	\N	國小, 國高中, 大學以上	時雨の町
組織/社群	袋鼠	https://i.imgur.com/wHC1w0w.png	人文社會	\N	https://www.instagram.com/insight_issues/	免費	\N	👣立足台灣•放眼全球•拓展國際視野\n🌏每日上傳國際新聞或專題                                                                                                                         “Change your thoughts, and you’ll change the world.”	社會議題, 公民參與	\N	國高中, 大學以上	國際內世鏡Insight Into Issues
影片	袋鼠	https://i.imgur.com/H3h9JzG.png	人文社會	\N	https://www.youtube.com/channel/UCmMnzrvnsSnv-0u9M1Rxiqw/featured	免費	\N	《TODAY 看世界》是 LINE TODAY 獨家製作的國際新聞懶人包。\n天天精選一件 🌍 國際話題，帶你快速了解世界大事！                                                         💡 TODAY 看世界 // 每周一至六更新\n由資深駐美特派記者范琪斐主持。\n用深入淺出方式剖析報導，帶大家看懂、看深再讓你好好思考。\n💡 人物放大鏡 // 每周日更新\n由百靈果 News 凱莉主持。\n可能是一個耳熟能詳的超級大咖，也有可能是名不經傳的小人物故事。\n都是生活裡真實發生的人生哲理，帶大家迎來更深一層的省思和啟發。\n💡 網友收發室 // 不定期更新\n從節目中精選「網友留言」特別做回應。\n補充說明「網友對影片內容的疑問或看法」。                                                                                    (簡介摘自https://www.youtube.com/channel/UCmMnzrvnsSnv-0u9M1Rxiqw/about)	社會議題, 公民參與	\N	國小, 國高中, 大學以上	TODAY 看世界
組織/社群, 文章/書	\N	https://i.imgur.com/Gb5kVbJ.png	商業與社會創新	\N	https://www.strategyzer.com/	部分免費	\N	「價值主張」╳「商業模式」\n商業模式不是靜態的企劃書，尤其需要先找到瞄準目標顧客的價值主張，兩者反覆交互驗證。 在百萬暢銷書《獲利世代》之後，作者奧斯瓦爾德Alex Osterwalder發現，許多企業組織用「商業模式圖」找顧客價值主張，經常碰壁，因為那不是挖掘價值主張的正確工具。因而發展出「價值主張圖」的思考架構，一個化繁為簡的圖像式策略工具，解答每個成功商業模式都必須先回答的關鍵問題：我到底如何為顧客創造價值？	社會創新, 商業價值, 價值主張	\N	國高中, 大學以上	strategyzer
工具/操作	\N	https://i.imgur.com/Tl4e8pK.jpg	語言與文學	\N	https://www.typing.com	免費	\N	遊戲化的英打練習網站，螢幕會顯示手指應對應於鍵盤的位置，有助於校正出舒服的打字習慣。練好英打可說是開始熟悉電腦的基本功之一。	英語	\N	國高中, 大學以上	Typing．com
課程/活動	\N	https://i.imgur.com/8eWOUpm.png	語言與文學	\N	https://www.theteenmagazine.com	免費	\N	內有大量與學生相關的英文閱讀文章，從時尚、文化、人際關係...。適合國高中的課外閱讀選擇。	英語, 閱讀	\N	國高中, 大學以上	The teen magazine
影片	\N	https://i.imgur.com/gXa5xiR.png	語言與文學	\N	https://tw.voicetube.com	免費	\N	上萬部 YouTube 影片，搭配中英文翻譯字幕與英漢字典，方便掌 握日常對話、瞭解單字的發音與用法。	英語	\N	國小, 國高中, 大學以上, 學齡前	VoiceTube
工具/操作	\N	https://i.imgur.com/Iv0KpiT.png	藝術	\N	https://photo-ac.com/tw/	部分免費	\N	日系圖庫，可商用、支援中文，超過18萬張圖片	圖片素材, 設計	\N	國小, 國高中, 大學以上	PhotoAC
工具/操作	\N	https://i.imgur.com/IrIpLeO.png	藝術	\N	https://pixabay.com/	免費	\N	Pixabay是一個來自德國的免費素材網站。有照片、插圖、向量檔、影片、音樂這幾種類型的資源可供所有人下載。最棒的是這些素材都可商業使用，對於網路工作者來說真的方便很多。	圖片素材, 設計	\N	國小, 國高中, 大學以上	Pixabay
工具/操作	Tiff	https://i.imgur.com/fKiqXGD.png	藝術	\N	https://cc0.wfublog.com/	免費	\N	整合多個主流圖庫的搜尋引擎	圖片素材, 設計	\N	國小, 國高中, 大學以上	CC0 免費圖庫搜尋引擎
工具/操作	\N	https://i.imgur.com/Blekhsf.png	藝術	\N	http://pictogram2.com/?lang=en	免費	\N	日本人形圖示素材庫，需要發揮創意、有趣的圖示，絕不能錯過	圖片素材, 設計	\N	國小, 國高中, 大學以上	human pictogram2．0
影片, 組織/社群, 課程/活動	\N	https://i.imgur.com/aVcfh42.jpg	綜合型學習資源	\N	https://www.education.com/	免費	\N	Education.com為K-7年級學生提供的最全面的學習活動圖書館，資源包含30,000多個工作表、遊戲、教案。	教材, 教案	\N	國小, 國高中, 大學以上	education．com
APP, 工具/操作	\N	https://i.imgur.com/0pBh1rS.png	藝術	\N	https://www.istockphoto.com/	部分免費	\N	知名設計素材資源網站，企業網站與簡報購圖首選	圖片素材, 設計	\N	國小, 國高中, 大學以上	iStockphoto
組織/社群	\N	https://i.imgur.com/YjwrH2t.jpg	藝術	【FB】: https://www.facebook.com/PPT.note/ 	https://www.instagram.com/ppt.note/	免費	\N	仙貝取自日文「先輩せんぱい」🍘 前輩的意思                                                            此網站分為兩大類: 紅色 P 編講PPT 。  藍色 K編主要聊 Keynote	排版素材, 資訊圖表製作, 圖片素材, 設計, PPT	\N	國小, 國高中, 大學以上	簡報仙貝 PTT．note
工具/操作	\N	https://i.imgur.com/GF4Esqw.png	綜合型學習資源	\N	http://www.alphateam.tw/coachsguide/?fbclid=IwAR3RkL_e0Rpcj63szbwNyJ-sdnz6Q77ZOFiYeLNZ0i7mWnJDIWxjzHAsbek	免費	\N	Alpha Team，重新定義問題、人才、團隊與學習。\nAlpha 是軍用術語，暗示一個軍團中最精銳的單位，在兩軍正式交戰前率先派出的前鋒部隊。\n臺大創新設計學院的 Alpha Team 則是因應創新教育、專案式大型計畫、公部門創新人才培力和企業創新轉型等各項挑戰時，能夠快速消化模糊的訊息，並產出初步方案的快打部隊。	設計思考	\N	國高中, 大學以上	設計思考教練手冊
組織/社群, 課程/活動	\N	https://i.imgur.com/QzaRPQK.png	教育	\N	https://www.facebook.com/groups/2120844924893607/?hoisted_section_header_type=recently_seen&multi_permalinks=2928298234148268	免費	\N	是讓學生有機會與一線網路業工作者交流的平台，在這裡，你可以找業內人士回答你 Google 不到的問題。另外，你也可以從這裡獲取XChange 活動資訊，更有不定期的小型近距離分享活動，以及企業實習資訊等，歡迎大家自由分享交流！	實習, 終生學習, 生涯探索, 自主學習, 社會企業	\N	國高中, 大學以上	XChange 互聯網大學
組織/社群, 課程/活動	\N	https://i.imgur.com/n6GG0vF.png	資訊與工程	\N	https://www.codingbar.ai/	需付費	\N	我們相信，未來程式語言將是每個人的基本能力，就像現在的英語一樣！透過寫程式的過程，可以培養 AI 所無法取代的：「思考、創意、溝通與協同合作」4C 能力（Critical thinking, Creativity, Communication , Collaboration），這也是 108 課綱所強調的核心素養，更是孩子未來重要的競爭力！\nCodingBar 創辦人 Jerry 曾為上市公司洋華光電 (3622) 副總，在與世界各國人才交流的過程，深感台灣教育需要改變，才能培養出符合新世代需要的人才，因此創辦瑞比智慧科技 airabbi，就是希望透過科技翻轉教育，培養出具有國際競爭力的下一代！                      (簡介摘自https://codingbar.ai/about/index.html)	JS, HTML/CSS, 資料庫, 網頁設計, APP設計, 程式設計	\N	國小, 國高中, 大學以上	Coding Bar 程式設計領航學校
工具/操作	袋鼠	https://i.imgur.com/QVo59ot.png	藝術	\N	https://quickdraw.withgoogle.com/	免費	\N	是 Google 人工智慧實驗的一部份，主要是由 Web 開發人員 Jonas Jonjegan、機器學習研究員 Henry Rowley， 以及 Google 創意實驗室和數據藝術團隊所建立的一個 AI 繪圖遊戲。Quick, Draw!在遊戲本質上類似於 Pictionary，但使用的是依靠機器學習來猜測你在畫什麼。(介紹取自https://medium.com/@simplelearn365/quick-draw-不僅是一個-ai-遊戲-更是世界上最大的塗鴉數據集-2b807be9f489)	藝術, 設計, 創造力, 繪畫	\N	學齡前, 國小, 國高中, 大學以上	Quick Draw
文章/書	羊羊	https://thepracticaldev.s3.amazonaws.com/i/6hqmcjaxbgbon8ydw93z.png	資訊與工程	\N	https://dev.to	免費	\N	開發者論壇提供開發者在上面的技術交流，大家可以透過tag來檢視相關的議題討論，甚至有很多技術文章在上面分享。	JS, HTML/CSS, 資料庫, 網頁設計, APP設計, UIUX	\N	國小, 國高中, 大學以上	DEV Community
影片, 課程/活動, 工具/操作	羊羊	https://cdn.freecodecamp.org/platform/universal/fcc_meta_1920X1080-indigo.png	資訊與工程	\N	https://freecodecamp.org	免費	\N	提供程式開發各領域的免費學習資源，不管是剛入門的開發者還是已經學習一段時間的老手，都很適合在上面打基本功。	程式設計, HTML/CSS, JS, 網頁設計, APP設計, 科技, 人工智慧AI, 資訊科技, 演算法	\N	國小, 國高中, 大學以上	freeCodeCamp
影片, 組織/社群, 課程/活動	羊羊	https://i.imgur.com/mAzWb5S.png	資訊與工程	\N	https://www.hexschool.com	部分免費	\N	給你滿滿的前端學習力，老師助教作業批改幫助你精益求精，六角專屬交流社群不怕沒人回答問題！ 不曉得從何踏入前端領域？由淺入深就算是麻瓜新手也能學會，六角學院給你最完整的前端地圖. 線上帶你學會程式開發. 帶您學會一技之長	程式設計, JS, HTML/CSS, 網頁設計, UIUX	\N	國小, 國高中, 大學以上	六角學院
影片, 工具/操作, 組織/社群	羊羊	https://scrimba.com/static/art/scrimba-og-image.png	資訊與工程	\N	https://scrimba.com	部分免費	\N	Scrimba提供很多免費的前端開發課程，讓前端新手可以更輕鬆的上手與開發，不定期會在Youtube直播基礎課程與大家互動。	英語, JS, HTML/CSS, 網頁設計, UIUX	\N	國小, 大學以上, 國高中	Scrimba
提案/競賽	羊羊	https://developers.google.com/open-source/gsoc/resources/downloads/GSoC-Vertical.png	資訊與工程	\N	https://summerofcode.withgoogle.com/	免費	\N	Google夏日程式碼大賽是由Google主辦的年度開源程式設計Program。比賽的主要目的是鼓勵學生參與開放原始碼的程式設計活動。每個成功完成項目的學生都會獲得来自Google公司的贊助，可能包含額外的學習資源或是美金贊助。學生可以申請參加活動，組織也可以申請提案給學生參與。	程式設計, 數位工具, 終身學習, Scratch, C/C++, JS, HTML/CSS, 資料庫, 創客(maker), 網頁設計, 競賽程式, APP設計, SQL, 科技, 資訊科技	\N	大學以上	Google Summer of Code
組織/社群, 影片	\N	https://i.imgur.com/61m4Zwk.png	資訊與工程, 運動/心理/醫學	\N	https://linchin.ndmctsgh.edu.tw/index.html#link7	免費	\N	本研究室專注於利用資料科學技術於醫學場域之應用。現代人工智慧主要是基於資料的算法，因此若想做出好的醫療人工智慧必須熟悉醫學資料的限制，並設計適當的演算法以應用這些資料。我們會將這些演算法應用於自然語言處理、圖像識別、生理訊號分析上，並將其落地於實際應用場域以提升健康照護品質。	數位學習, 自主學習, 資訊科技, 演算法, 生命科學	\N	大學以上, 國高中	國防醫學中心資料科學研究室
組織/社群	\N	https://i.imgur.com/YISTrvU.png	數學與邏輯	\N	https://www.facebook.com/amathing.world/	免費	\N	玩數學遊戲、說數學故事、聊數學新聞、傳數學之美!                                                                  《課堂上的數學遊戲》http://blog.magiclass.net/主要是在分享可在班級上進行的團體數學遊戲，希望能在維持數學學習成效的前提下，提升數學課程的趣味性。最終目標是能夠讓國中數學的每個主題都有對應的課堂遊戲。《天橋下說數的》http://no-math.magiclass.net/談數學教學，談數學教育，談數學書籍，談數學生活。	數學, 邏輯, 教材	\N	國高中, 大學以上	環遊數界
組織/社群, 文章/書, 提案/競賽	\N	https://i.imgur.com/y81LVVZ.jpg	商業與社會創新	\N	https://young999.tw/	免費	\N	懷世代身為一個平台，我們提供機會和舞台給大專院校學生，讓學生能夠在上面盡情表現，爭取資金去實踐公益行動計畫。無論是針對特定族群、社區、動物、生態，亦或是某個現象等，只要符合公益性質，能讓社會變得更好，通通歡迎你們參與我們的計畫。在網站內不只有公益行動計畫，還包括人物專訪與各項公益活動等你一起參與。	社會創新	\N	國高中, 大學以上	懷世代青年公益行動計畫
組織/社群, 課程/活動	\N	https://i.imgur.com/O0QMdAh.jpg	教育	\N	https://www.facebook.com/yessocialdesign	部分免費	\N	我們關注、發展、創造的五個面向：個體與群體，家庭與學校，引導式學習與自我學習，身體、心理與靈魂，過去、現在與未來	教育創新, 自主學習, 自我探索, 自我成長, 民主教育, 素養教育, 實驗教育	\N	大學以上, 國高中	也思社會設計自學團
組織/社群	\N	https://i.imgur.com/mknBKQv.jpg	教育	\N	https://www.sharestart.org/	免費	\N	「學思達教學法」讓學生在人性化的教學場域裡，透過自「學」、閱讀、「思」考、討論、分析、歸納、表「達」等能力的培養，成為具備21世紀核心素養的未來人才。創辦人張輝誠老師自 2013 年開始推廣學思達，發願用十年的時光改變台灣填鴨教育，五年裡累積全世界 6,500 位老師前來觀課。                                                       2016年起，公益平台文化基金會與誠致教育基金會成為學思達的行政團隊，一同搭建教師翻轉教學的支持系統；張老師又號召一群來自不同地域，分別任教於不同年級與科目的老師一同投入教育推廣，將具備實效的教學案例彙整成實務經驗，以實體培訓引領更多在職教師改變單向式講述教學，並透過「隨時開放教室」開啟教師之間的專業對話。2020年學思達獨立，成立學思達教育基金會。                                              學思達目前的發展已從幼兒園、小學、國中、高中，一直貫通到大學及研究所，並橫跨不同學科（文、理、工、藝術、醫學）。經由海外教師主動學習及網際網路線上串連，學思達教學法又被推廣到美國、香港、澳門、新加坡、馬來西亞、中國大陸、汶萊、印尼、緬甸、泰國、越南等地，當地分別又出現積極推廣學思達的教師、學校、線上社群等，於在地持續而穩定地推廣學思達。(簡介摘自https://www.sharestart.org/)	教育創新, 素養教育, 教學方法, 教材	\N	大學以上, 國高中	學思達教育基金會
組織/社群	\N	https://i.imgur.com/R59ypau.jpg	人文社會	\N	https://www.mediawatch.org.tw/	免費	\N	媒觀成立於1999年6月，由一群結合學術界、新聞實務界等人士發起組成。成立之初便以「維護新聞自由、落實媒體正義、促進媒體自律、保障公民傳播權利」作為宗旨，以此宗旨出發，在成立十餘年的日子裡，我們不但持續針對優質兒少節目進行評選與推薦外，同時也陸續與社區大學、教育部推動媒體識讀教育，並結合公民團體推動成立「公民參與媒體改造聯盟」，促進建立電子媒體建立集體自律機制，與協助蘋果日報建立自律委員會。(簡介摘自https://www.mediawatch.org.tw/about)	社會議題, 傳播產業, 公民參與, 自媒體	\N	國高中, 大學以上	台灣媒體觀察教育基金會
組織/社群	\N	https://i.imgur.com/CvmK4Gk.jpg	語言與文學, 教育	\N	https://www.facebook.com/%E7%BE%8A%E5%92%A9%E8%80%81%E5%B8%AB%E7%9A%84%E8%BF%BD%E5%8A%87%E5%9C%8B%E6%96%87%E8%AA%B2-464795323929785/	免費	\N	羊咩老師，本名楊明，畢業於中山大學中文所，現在是一名愛追劇、愛電影、愛動漫的高中國文老師。擅長將艱澀的古文搭配電影、戲劇，用淺顯易懂的比喻，找到和年輕學生連線的方法。在她的國文課上，師生一起為課文中的情感流淚，是常見的風景。她期許自己成為「文學的推銷員」，推銷文學療癒生命的力量，為所有閱讀者準備一堂人生的國文課。現有臉書粉絲團「羊咩老師的追劇國文課」，深受學生、家長與各校教師的歡迎。並有多篇文章發表於《商周》、《方格子》、《龍騰知識+》等各網路平台。	中文, 文學, 自我成長, 自主學習	\N	國小, 國高中, 大學以上	羊咩老師的追劇國文課
組織/社群	\N	https://i.imgur.com/s68jQ2V.jpg	運動/心理/醫學	\N	https://www.simplypsychology.org/	免費	\N	Simply Psychology是一個外國心理學的網站，裡面包含心理學各學派的介紹、心理學研究以及心理學統計的方法。	輔導, 助人工作, 自我探索, 自我成長, 心理學	\N	國高中, 大學以上	Simply Psychology
組織/社群	\N	https://i.imgur.com/XBR9FLc.png	運動/心理/醫學	\N	https://www.facebook.com/%E5%BF%83%E6%9B%B8%E7%99%BC%E8%A1%A8%E6%9C%83-111333934786565/	免費	\N	這是一個分享心理學書籍、知識的粉專。\n固定在每周一更新一篇書籍介紹，其他時候會有一些閒聊，有推薦的書籍歡迎分享，如果有任何建議也請不吝賜教～	輔導, 助人工作, 人際關係, 生命教育, 自我探索, 自我成長, 心理學, 藝術治療, 諮商	\N	國高中, 大學以上	心書發表會
文章/書	\N	https://i.imgur.com/3uxqYyL.jpg	運動/心理/醫學	\N	https://www.kingstone.com.tw/basic/2011780073243/	免費	\N	根據統計，臺灣患有心理疾病的人已超過兩百萬，但是想找到合適且能信任的諮商師，平均竟然要花上五年？\n在「保密義務」的前提下，諮商過程幾乎都是祕而不宣的，沒有知道尋求諮商的人到底跟心理諮商師在診療室裡談了什麼，也不知道諮商師到底透過什麼方式幫助人們痊癒。另一方面，心理諮商師並不只是跟來談者聊聊天、給點建議就好了。要成為真正獨當一面的諮商師，平均要花25年。\n諮商師究竟是如何養成的？他們如何背負起他人的傷痛？又如何拿捏距離，既保有自我，又能幫助個案？\n透過河合隼雄的「箱庭療法」和中井久夫的「風景構成法」這兩扇窗口，作者輕輕拉開布簾，爬梳心理諮商界的發展與演進，讓我們得以一窺診療室中，那些發生在心理諮商師與來談者之間的故事。	輔導, 助人工作, 人際關係, 生命教育, 自我探索, 自我成長, 心理學, 藝術治療, 諮商	\N	國高中, 大學以上	心理諮商師: 拉開診療室的布簾, 窺見心的療癒面貌
組織/社群	\N	https://i.imgur.com/Xjicxbs.png	運動/心理/醫學	\N	https://wellbeing.mohw.gov.tw/pro/main	免費	\N	本網站係衛生福利部委託國立成功大學建置，由郭乃文教授及侯廷偉教授負責，並請多位國內心理健康專業工作者共同指導，網站提供具科學實徵性之心理健康知識與策略、e-learning網路學習、全國各地區心理健康服務據點資料等，為民眾建立一個具有即時性、友善性、可靠性、正確性的心理健康平台。(簡介摘自https://wellbeing.mohw.gov.tw/pro/info/intro )	輔導, 助人工作, 人際關係, 生命教育, 自我探索, 自我成長, 心理學	\N	國高中, 大學以上	「心快活」心理健康學習平台
工具/操作	\N	https://i.imgur.com/MTK7aE6.png	學習/教學工具	\N	https://www.notion.so/zh-tw	免費	\N	Notion誕生於2016年，廣義來說，Notion是時下最熱門的筆記軟體之一，但Notion的功能卻不僅僅是「數位筆記」，Notion整合了線上筆記本、文件管理、專案管理、知識資料庫等功能，為一款整合多功能的實用工具，主打「All-in-one」，實現一個人從工作到生活、從資料庫建置到精美報告產出的所有需求。(介紹擷取自https://glints.com/tw/blog/learn-how-to-use-notion/)	筆記, 數位學習	\N	國小, 國高中, 大學以上	notion
組織/社群	袋鼠	https://i.imgur.com/EcjNRd2.png	運動/心理/醫學	\N	https://depressytrouble.tw/	免費	\N	大家好！我們是白琳與妤恒，「小鬱亂入」其實是我們在2015年台科大設計系的畢業製作。憂鬱症議題在台灣一直都是默默存在的，但由於當時許多藝人自殺與隨機殺人事件的出現，使得憂鬱症這個議題又重新浮現。當時的我們覺得雖然議題浮現了，但是大眾還是很難去討論這個疾病。我們相信憂鬱症這個議題是需要被社會理解而且討論的。我們因此決定建置一個憂鬱症的網站，希望透過互動式的線上憂鬱症量表與塑造憂鬱症角色的呈現資訊方式，讓社會可以同時透過較幽默的方式認識憂鬱症，也希望可以在某些人需要幫助時可以獲得資訊上的幫助。	輔導, 助人工作, 人際關係, 生命教育, 諮商, 自我探索, 自我成長, 心理學	\N	國高中, 大學以上	小鬱亂入
影片	\N	https://i.imgur.com/uekyGbl.jpg	資訊與工程	\N	https://www.youtube.com/c/papayaclass	免費	\N	PAPAYA 電腦教室主要在介紹電腦軟體程式word,excel,powerpoint,mac,indesign,Premiere Pro,adobe,google.....各式各樣的網路資源跟軟體的教學	數位工具, 數位學習, 自主學習, 資訊科技, Office	\N	大學以上, 國高中	PAPAYA 電腦教室
組織/社群, 文章/書	Tiff	https://i.imgur.com/MnIOqON.png	生活	\N	https://www.yilan.com.tw/	免費	\N	葉怡蘭。飲食旅遊作家。《Yilan美食生活玩家》(http://www.yilan.com.tw) ＆《PEKOE食品雜貨鋪》 (https://www.PEKOE.com.tw) 主人。 怡然生活創意出版 (http://www.simplylife.tw) 總編輯 聯絡方式：https://goo.gl/igbseG	旅遊, 烘培烹飪, 烹飪, 擺設, 居家整理	\N	國小, 國高中, 大學以上	葉怡蘭 Yilan
組織/社群, 文章/書	\N	https://i.imgur.com/nnKs4BT.png	商業與社會創新	\N	https://aitmr1234567890.medium.com/	免費	\N	Marketing data science. 台灣第一個行銷資料科學(MDS)知識部落，本粉絲專頁在探討行銷資料科學之基礎概念、趨勢、新工具和實作，讓粉絲們瞭解資料科學的行銷運用，並開啟厚植數據分析能力之契機。	社會創新, 公關行銷, 資訊科技	\N	國高中, 大學以上	行銷資料科學
組織/社群, 文章/書	\N	https://i.imgur.com/OJG0OfZ.png	商業與社會創新	\N	https://imarketing.iwant-in.net/	免費	\N	銀河iMarketing數位行銷領航員銀河數位行銷戰術研究中心是由眾多研究員所組成的專業團隊，團隊自1998年起成立，在數位行銷領域擁有近20年卓越服務經驗，專精商業客戶／中小企業網路品牌及產品的擴散推廣、社群代管經營、網路疆域保全服務。	社會創新, 公關行銷	\N	國高中, 大學以上	iMarketing銀河數位行銷學
文章/書	\N	https://i.imgur.com/JLIuJPj.jpg	藝術, 運動/心理/醫學	\N	https://start.uxdesign.cc/	免費	\N	此本手冊介紹關於ux設計師相關的領域知識，並結合反思與練習的部分，帶你一步一步認識ux designer	藝術, 設計, UIUX, 心理學	\N	國高中, 大學以上	The Guide to Design
組織/社群	\N	https://i.imgur.com/wPSRvTK.png	人文社會	\N	https://csr.cw.com.tw/	免費	\N	《天下雜誌》自1994年起，率先倡導「企業公民」理念，在每年一次的「標竿企業」評比中，加入企業社會責任（corporate social responsibility，CSR）評分項目；2007年更擴大規模，將CSR指標獨立成為「天下企業公民獎」，成為國內最具指標性的CSR評鑑，從公司治理、企業承諾、社會參與、環境保護等四大面向，來檢視企業對股東、員工、合作夥伴、社會、與環境應負起的責任。\n過去二十年多來，CSR觀念逐漸受到各界重視。社會對企業的期待，早已不僅止於獲利，更希望企業發揮影響力，形成改變社會的力量。CSR的實踐做法，也從單純做慈善事業，進階到與企業核心能力結合，成為推動企業成長的第二曲線。                                    (摘自https://csr.cw.com.tw/about)	社會議題, 文化, 經濟, 社會創新, 地方創生	\N	國高中, 大學以上	CSR@天下
工具/操作	袋鼠	https://i.imgur.com/A8fa5e2.png	資訊與工程, 學習/教學工具	\N	https://twinery.org/	免費	\N	譯自英文-Twine是由Chris Klimas創建的免費開源工具，用於以網頁形式製作交互式小說。它在Mac OS X，Windows和Linux上可用。	數位工具, 程式設計, 數位學習, 自主學習	\N	大學以上, 國高中	Twine互動小說軟體
組織/社群	\N	https://i.imgur.com/sW44TXk.jpg	資訊與工程, 教育, 綜合型學習資源	\N	https://www.accomdemy.org/	免費	\N	伴伴學 Accomdemy 是由一群來自科技圈、新創圈、教育圈的夥伴們自發性組成的自學組織。我們相信教育和科技可以使人突破自我限制，讓這個世界變得更美好；而我們相信最好的學習方法來自於有動力的自主學習，所以我們號召有同樣信仰的夥伴們一起付出自己所長，讓想要學習卻不得其門而入的人能夠享受學習的趣味，透過陪伴式學習的線上分享會，即時獲得有經驗的導師 (Mentor) 指導解惑，讓學習的路上有趣又不孤單。	數位工具, 程式設計, 資料庫, 數位學習, 自主學習	\N	大學以上, 國高中	伴伴學Accomdemy
影片	\N	https://i.imgur.com/mc7U3QP.jpg	運動/心理/醫學	【IG】: https://www.instagram.com/meetype.tw/                                                                                           【FB】: https://www.facebook.com/meetype.tw/                                                                               【心理測驗】: https://meetype.com/	https://www.youtube.com/channel/UCzIvOAf7g1cOytStDf7PE-Q/featured	免費	\N	Hi，我是Melody！這裡有我精選的實用心理學知識 ，希望能幫您用有效率的方式，獲得高價值的訊息!	輔導, 助人工作, 人際關係, 生命教育, 諮商, 自我探索, 自我成長, 心理學, 心理治療	\N	國高中, 大學以上	Melody的心理學
組織/社群	\N	https://i.imgur.com/D9LGQBm.jpg	教育, 人文社會, 商業與社會創新	\N	https://www.waker.org.tw/Default.aspx	免費	\N	讓社區脫離貧困的主要因素是透過教育，而兒童教育是微客長久以來努力的目標。不論是單親、隔代教養、新移民二代、無國籍二代、孤兒、留守貧童、童工、愛滋病兒等，這些弱勢兒童因為缺乏陪伴，而長期處於不良的發展環境，於是微客首要的服務便是以是兒童陪伴及教育為重點，幫助貧困地區的孩子獲得見識的機會及資源的支持。 \n微客以永續服務的概念，從事在地化的社區服務工作，而多年在社區服務的同時也有機會深入造訪，間接地啟發了需要幫助的弱勢族群社區，讓他們成為社區自覺（社區自決）的關鍵。微客是一群微小力量的夥伴，或許我們沒辦法在這世界上做什麼偉大的事情，但我們可以帶著偉大的愛做一些小事，期盼能喚醒自己和角落的人們看見存在的價值，成為彼此生命中無法取代的過客。(簡介摘自https://www.waker.org.tw/OnePage.aspx?tid=20)	自我探索, 自我成長, 公民參與, 國際參與	\N	大學以上, 國高中	微客國際服務
工具/操作	\N	https://i.imgur.com/97kdThF.png	學習/教學工具	\N	https://evernote.com/intl/zh-tw	免費	\N	Evernote是由Stepan Pachikov所創建的筆記軟體，於2008年6月24日正式上線，是一個功能非常單純的數位筆記應用工具，可以結合文字輸入、照相、錄音等方式，把自己想要的資料保存起來，而其最大的優點在於它的雲端管理機制，因為它可以支援多種平台，所以用戶在不同的地方，可以用不同的設備上去存取自己的筆記。(簡介擷取自https://glints.com/tw/blog/evernote-tutorial/)	數位學習, 筆記	\N	國高中, 大學以上	Evernote
工具/操作	\N	https://i.imgur.com/8y9cP3E.png	學習/教學工具	\N	https://whimsical.com/	免費	\N	Whimsical是一個線上自製流程圖的工具	數位學習, 流程圖	\N	學齡前, 國小, 國高中, 大學以上	Whimsical
組織/社群	\N	https://i.imgur.com/jfBkgPa.jpg	藝術, 運動/心理/醫學	\N	https://www.facebook.com/uiuxretriever/	免費	\N	協助想轉職與非本科生之教育培訓，建立Designer共學社群，舉辦線上與線下活動課程相互交流，核心理念為「經驗創造價值」，提升職場競爭軟硬實力。	藝術, 設計, UIUX, 心理學	\N	國高中, 大學以上	收收 UI UX 設計顧問
組織/社群	\N	https://i.imgur.com/ODMrt7U.jpg	綜合型學習資源	\N	https://www.facebook.com/104intern/	免費	https://www.youtube.com/watch?v=Mv_uPvf_pGQ	104實習小編每天給你最新企業實習機會：電商實習、財務金融實習、行銷實習、軟體工程師實習、餐飲業實習...，各科系學生都可以透過實習認識工作內容和職場，提早摸索就業方向跟興趣！	實習, 生涯探索	\N	國高中, 大學以上	大學生找實習
組織/社群, 文章/書	袋鼠	https://i.imgur.com/y0lFoEo.png	運動/心理/醫學	\N	https://headshrinkerspocket.blogspot.com/	免費	\N	您好，我是臨床心理師蘇益賢。這個部落格會分享一些心理學書籍的簡評、相關資訊，歡迎您分享給有需要的夥伴。	輔導, 助人工作, 人際關係, 生命教育, 諮商, 自我探索, 自我成長, 心理學, 心理治療	\N	國高中, 大學以上	心理師的口袋
組織/社群, 文章/書	\N	https://i.imgur.com/fsLOoiY.jpg	人文社會	\N	https://news.readmoo.com/	免費	\N	Readmoo是「買書x 看書x 分享書」的閱讀基地；是一個可以購買電子書，同時又提供一個讓讀者進行評論、畫線、註記，與串連、分享的社群閱讀園地。 我們認為，閱讀本質，是一個有溫度、有感動的知識交流旅程；同時，我們也相信，閱讀經驗可以透過電子書而更圓滿	社會議題, 文化, 公民參與, 經濟, 法律	\N	國高中, 大學以上	閱讀最前線
組織/社群, 課程/活動	\N	https://i.imgur.com/FAUmg3Y.jpg	教育	【FB】:https://www.facebook.com/LeadForTaiwan/	https://www.leadfortaiwan.org/?fbclid=IwAR03iTmhnXyvbXJDsK7G71jnhHUJVzjjJznZUgXDAe0PAA7syLe_EW3PeBA	免費	\N	LFT致力於提供臺灣青年軟實力培訓課程—藉由舉辦思辨相關活動、高中微課程、講師培訓、每月免費主題講座等，期許厚植臺灣學生溝通、領導、論述及獨立思考之能力。	教育創新, 素養教育, 自我探索, 自我成長	\N	大學以上, 國高中	Lead For Taiwan 領導臺灣
組織/社群	\N	https://i.imgur.com/6vvGM3x.jpg	數學與邏輯, 教育	\N	http://www.nhmath.com/NH-MATH/	免費	\N	秉持「重行樸實數學路，發現數學新世界」的信念，和一群充滿熱忱的老師透過討論、備課，剖析及釐清數學核心概念，並親自應用於國中小、高中教學現場中。	數學, 邏輯, 教學方法, 教師培力, 教育創新, 教材, 教案	\N	國高中, 大學以上	數學新世界深根計畫
組織/社群	\N	https://i.imgur.com/cU7WMlI.png	人文社會	\N	https://www.facebook.com/anthropologistsforthefuture/	免費	\N	在各行各業裡、社會的各個角落裡，都有一群人，做著跟人類學家一樣的事，或是用人類學家的方法來工作，他們不在學術圈裡，卻讓人類學更加貼近社會大眾。\n「百工裡的人類學家」，就是要邀請這些人，分享他們的人類學經驗，以及他們如何將自己的工作結合人類學，找到新的可能，也看到不一樣的社會真實。\n我們固定每天分享跟人類學有關的兩篇文章，也舉辦各式各樣的活動，希望能拉近大家和人類學之間的距離。	社會議題, 文化, 公民參與	\N	國高中, 大學以上	百工裡的人類學家
組織/社群, 課程/活動	\N	https://i.imgur.com/Evag7wl.png	教育	【FB】:https://www.facebook.com/teach4taiwan/                                                                                【Podcast】:https://open.spotify.com/show/3ncPry2zmnDu1V3O0Q3XMA                                     【IG】 :https://www.instagram.com/teachfortaiwan/	https://www.teach4taiwan.org/	免費	\N	Teach For Taiwan 為台灣而教（簡稱TFT）是一群致力於改善台灣「教育不平等」問題的行動者。短期而言，TFT招募具教育使命感與領導潛力的人才，為有需求的偏鄉小學注入師資，展開兩年全職教學工作。計畫期間，TFT提供專業的培訓與支持，致力提升教學品質，同時累積現場的看見，長期而言培養各領域的領導人才，帶出系統化的改變，為孩子創造平等優質的教育環境。讓一個孩子的出身不再限制他的未來。	社會創新, 教育創新, 素養教育	\N	大學以上, 國高中	為台灣而教 Teach For Taiwan
組織/社群	\N	https://i.imgur.com/2Cnzm4v.png	教育	【FB】: https://www.facebook.com/因為我們年輕-We-Are-Young-103618441032921/   【方格子】: https://vocus.cc/user/617aab6efd897800011776eb	https://www.instagram.com/we_are_young_zine/	免費	\N	《因為我們年輕》是一本由自學生於 2019/03 發起的獨立刊物，第二季團隊於 2021/07 成立，我們相信年輕是一種選擇，自學是一種態度。期盼我們能成為一本引領年輕學子的質感小誌，從行動與態度出發，成為影響世代的獨立刊物。	實驗教育, 自主學習, 教育創新, 民主教育, 書籍	\N	大學以上, 國高中, 國小	《因為我們年輕》WAY小誌
組織/社群	\N	https://i.imgur.com/IeJNqmM.jpg	運動/心理/醫學	\N	https://www.facebook.com/sn094545/	免費	\N	心理師社會觀察的諮商故事、信念及語錄。另外，喜歡寫小說。                                    現為諮商心理師，工作迄今20年，曾任部隊心輔官、監獄治療師、諮商機構心理師，目前服務社區駐點諮商、社福機構、各級學校學生暨特教生，接觸年齡從幼稚園到70多歲都有。心理學碩士畢業，主修社會心理學，論文寫男性的尋愛過程。兩個孩子的爸，興趣是閱讀、烹飪、作家事、旅行、繪圖、攝影、社會觀察與寫小說。	輔導, 助人工作, 人際關係, 生命教育, 諮商, 自我探索, 自我成長, 心理學	\N	國高中, 大學以上	社會心理，從他們到我們-林仁廷 諮商心理師
課程/活動, 影片	Tiff	https://i.imgur.com/WE37V6S.jpg	綜合型學習資源	\N	http://ocw.aca.ntu.edu.tw/ntu-ocw/	免費	\N	臺大開放式課程教學網，錄製臺大教授上課內容的系列影片，部分課程會提供課程講義。無須註冊，影片科目廣泛，文科、理工科、法學經濟醫學心理相關課程都有，按照學年度跟課程名稱分類。(參考臨安初霽)	學科類型, 終身學習	\N	國小, 國高中, 大學以上	臺大開放式課程教學網
工具/操作	\N	https://i.imgur.com/UQ93BR8.png	語言與文學	\N	https://www.mdnkids.com/MdnRead-Covid19/?fbclid=IwAR0db6FyCVokko08uhvgkyqHrqy-Ywxv8d1YtSTedm6KTT1pbhBHYvLzNf0	免費	\N	為了讓校園訂戶在家自學時，也有報紙可讀，國語日報社在全國防疫停課期間，於官網提供近期《國語日報》、《國語日報週刊》、《中學生報》全文，讓同學在家也能享受最優質的讀報時光。	中文, 電子書, 閱讀	\N	國小, 國高中, 大學以上	國語日報「防疫自學 公益閱讀」近期報刊閱讀專區
組織/社群, 課程/活動	\N	https://i.imgur.com/rFdgP0X.png	運動/心理/醫學	\N	https://www.wulink.com.tw	需付費	\N	集結各門各派的精華，融合經典文藝、運動機能、品格教育、時尚\n 元素，推出武術文創教育服務，以實現功夫夢為宗旨。	體育, 健身, 體能	\N	學齡前, 國小	武林文創
組織/社群, 文章/書	\N	https://i.imgur.com/uTmkGUn.jpg	人文社會	\N	https://www.facebook.com/wizard.geo	免費	\N	來自台灣的高中地理老師，\n犇向自由民主多元進步。\n分享地理教育、公民議題；\n關心國際關係、世界局勢；\n體悟氣候變遷、環境教育；\n時間與空間的經緯縱橫\n世界看見台灣，台灣看見世界。	地理, 文化, 社會議題, 國際情勢	\N	國高中, 大學以上	巫師地理
文章/書	Tiff	https://i.imgur.com/1a8dGyn.jpg	人文社會	\N	http://s23017blog.blogspot.tw/?m=0	免費	\N	洪世明(shsm)的高中歷史教學部落格，主要的目的是增加學習歷史的感覺…(2012.3啟用) 使用本Blog的資料，務必注意版權，請勿侵權。	歷史	\N	國高中, 大學以上	高中歷史教學部落格
文章/書	Tiff	https://i.imgur.com/wnklxUV.png	教育	\N	https://en.wikipedia.org/wiki/List_of_alternative_universities	免費	\N	維基百科針對另類教育大學的整理。	實驗教育	\N	學齡前, 國小, 國高中, 大學以上	國外另類教育大學清單
工具/操作	\N	https://i.imgur.com/YT9Zeq0.jpg	學習/教學工具	\N	https://myviewboard.com/	免費	\N	myViewBoard Whiteboard for Windows ，是實體教室的數位教學程式，透過結合視訊軟體應用如Teams 或Meet 用於遠距和複合式教學環境，搭配myViewBoard 互動小幫手 可達到遠距互動教學，且參與人數無上限。	數位學習, 線上教學	\N	學齡前, 國小, 國高中, 大學以上	myViewBord
Podcast	袋鼠	https://i.imgur.com/gHM0tm2.jpg	運動/心理/醫學	IG:https://www.instagram.com/b5152001/ 	https://open.spotify.com/show/7Hh8JXXzsPWpeAwFgPvP5H	免費	\N	生涯規劃有用嗎？職涯專家自己過得真的好嗎？我是不知道拉！這頻道是因應你的生涯導航李庚羲建立的，讓我們一起用不同的角度看待職涯規劃吧！	輔導, 助人工作, 人際關係, 生命教育, 諮商, 自我探索, 自我成長, 心理學	\N	國高中, 大學以上	你的生涯導航不是李庚羲
Podcast	\N	https://i.imgur.com/C9OAh7r.jpg	運動/心理/醫學	IG：https://www.instagram.com/psy.cheers/	https://open.spotify.com/show/3Btx1fbKqQHQEgQiYwhhgD	免費	\N	我們是一群心理人，不想把心理學包裝專業華麗外衣，也不崇尚提供雞湯或看似完美卻完全無法做到的簡單解答。人生有許多難解或無解，困頓時，也許來和我們聊聊天，喝杯酒，讓我們陪你一段。心理師，乾杯。	助人工作, 情緒, 輔導, 生命教育, 自我探索, 自我成長, 心理學	\N	國小, 國高中, 大學以上	心理師乾杯
Podcast	\N	https://i.imgur.com/xbqdoOk.jpg	運動/心理/醫學	【FB粉專】\nhttps://reurl.cc/dxxLpq\n【IG】\nhttps://www.instagram.com/straight_psychology/	https://open.spotify.com/show/3gfalOBKnsVskkJrHWYSmq	免費	\N	由心理學博士顏志龍，和美女助教小白，用最直白的方式，與你暢談日常生活中的心理學。聽了之後你會發現，這裡的心理學超直白。	助人工作, 輔導, 心理學	\N	國小, 國高中, 大學以上	超直白心理學
組織/社群, 課程/活動	\N	https://i.imgur.com/JrL4a3U.png	綜合型學習資源	\N	https://www.facebook.com/groups/lowerlowsalary/about	免費	\N	青年交流社團主要分享高中生以上適合參與的青年講座、活動與工作坊	自主學習, 終生學習	\N	國高中, 大學以上	青年交流社團
組織/社群	\N	https://i.imgur.com/9H8bI6S.jpg	商業與社會創新	\N	https://www.facebook.com/CSR.cw/	免費	\N	天下在2017年成立《CSR@天下》，搭建起企業、社會、環境與個人永續的交流平台，期盼企業提高辨識經營風險能力、發揮永續價值，打造美好台灣努力。	社會創新	\N	國高中, 大學以上	CSR在天下
文章/書	袋鼠	https://i.imgur.com/OCLfsqv.jpg	運動/心理/醫學	\N	https://spiketren.gitbooks.io/psy101/content/ch1/intro.html	免費	\N	這是一本在2016與2017年春天與由675位修習「普通心理學」的臺灣大學同學，秉持著「既專業詳盡，又貼近本土生活」的原則，所協同創作的普通心理學教科書。\n本書介紹古典與當代心理學的發展和概念，並從生物、心智與文化的角度來探討心理學如何與日常生活以及其他學科息息相關。\n我們希望大專院校各科系的同學們能藉由此書，學習從科學的角度來更了解自己並認識他人，邁向正向心理學所追求的幸福快樂人生。        (簡介摘自:https://spiketren.gitbooks.io/psy101/content/)	心理學, 情緒, 諮商, 自我成長	\N	國小, 國高中, 大學以上	超普通心理學
組織/社群, 課程/活動	\N	https://i.imgur.com/w7ShDZ7.jpg	運動/心理/醫學, 教育	\N	https://pawforgood.tw/	免費	\N	台灣心輔犬培育團隊以訓練流浪犬重生成為專業心輔犬、研發教育課程結合流浪犬、專業教練與專業人員如醫生、復健師、特教老師等，以教育理念出發，設計課程與講座帶領服務個案了解如何與狗友善互動、發現狗兒療育力量，拓展服務至學校、身障機構、關懷據點、康復之家等。希望藉由與心輔犬互動增強個案學習動機，幫助情緒、肢體及學習障礙等個案學習、復健與引導情緒和社交練習。	特殊教育	\N	學齡前, 國高中, 大學以上	台灣心輔犬培育團隊
組織/社群	Tiff	https://i.imgur.com/4JLgfqi.jpg	商業與社會創新	\N	https://www.instagram.com/goodgood.tw/?hl=zh-tw	免費	\N	財經時事 | 理財工具 | 知識懶人包 #好好理財 #理性選擇感性生活	投資理財	\N	國高中, 大學以上	好好理財
工具/操作	\N	https://i.imgur.com/kszNxP1.png	藝術, 學習/教學工具	\N	https://color.adobe.com/zh/create/color-contrast-analyzer	免費	\N	Adobe Color 是Adobe 旗下的免費線上色輪、調色盤產生器 在搜尋欄位輸入顏色、情境或任何關鍵字就能找到相關配色組合 下載為ASE、JPEG 格式或複製為LESS、CSS、SASS 或XML 程式碼                                   簡介摘自:https://free.com.tw/adobe-color/ 	藝術, 設計, 繪畫, 排版素材, 數位學習	\N	國小, 國高中, 大學以上	Adobe color
課程/活動	\N	https://i.imgur.com/snjuPhO.png	綜合型學習資源	\N	https://degreed.com/	免費	\N	Degreed是一家將企業員工和技能學習資源聯繫在一起的在線學習平台。	終生學習	\N	國小, 國高中, 大學以上	Degreed
影片	\N	https://i.imgur.com/bUGRfTm.jpg	語言與文學, 學習/教學工具, 資訊與工程	\N	https://www.youtube.com/c/YujenLien	免費	\N	這個頻道和老師們分享、介紹與說明教育科技相關工具與服務。連老師是國文老師，也是華語老師，所以連老師都會的數位教學資源絕對適用各級學校老師，歡迎有意運用資訊科技融入教學的教師與準教師們訂閱參考。(介紹摘自https://www.youtube.com/c/YujenLien/about)	中文, 華語文, 數位工具, 資訊科技, 數位學習	\N	國小, 國高中, 大學以上	連老師都會
組織/社群, 工具/操作	\N	https://i.imgur.com/M5vPXEx.jpg	語言與文學	\N	https://nihongo-e-na.com/eng/site	免費	\N	網站內有大量的日文學習方法、文章與網站，包括日語的假名、漢字、詞彙、閱讀寫作、聽力、工具與日本的文化社會。	聽力, 閱讀, 口說, 寫作, 單字, 日文	\N	國高中, 大學以上	NIHONGO 日語學習網
工具/操作, APP	\N	https://i.imgur.com/rBADD2H.png	學習/教學工具	\N	https://www.geogebra.org/	免費	\N	GeoGebra是一個免費的數學教學工具，可用於課堂活動、繪圖運算、幾何作圖、白板協作....等。	數位學習	\N	國小, 國高中, 大學以上	GeoGebra
APP, 工具/操作	\N	https://i.imgur.com/g43BQsn.jpg	學習/教學工具	\N	https://www.kumospace.com	部分免費	\N	Kumospace一個視訊軟體，你可以設置一個虛擬的社交空間，很像線上交誼廳，然後在這個空間裡面自由移動找你想聊天的人聊天，你靠近你想聊天的人才會聽到他的聲音，所以可以同時有很多不同的對話在進行。而他辦帳號很簡單，同一時間使用人數也無上限（有組織嘗試過1000人以上）。此視訊軟體可以增加社交自由度與互動性。	社交軟體, 視訊軟體	\N	國高中, 大學以上	Kumospace
工具/操作, APP	\N	https://i.imgur.com/HqGpbyj.png	學習/教學工具	\N	https://accounts.sli.do/login?redirect=aHR0cHM6Ly9hZG1pbi5zbGkuZG8vZXZlbnRz	免費	\N	線上問答&票選系統，可立即和觀眾互動。	數位學習, 互動軟體, 投票	\N	國小, 國高中, 大學以上	Slido
APP, 工具/操作	\N	https://i.imgur.com/rWlHgKS.png	學習/教學工具	\N	https://miro.com/app/dashboard/	免費	\N	miro是一個線上會議的大白板，為了在線上會議時可以將大家的想法表達得更清楚，此網站提供了將各種資訊思考視覺化，把各種計畫圖解化，	提案軟體, 數位學習	\N	國小, 國高中, 大學以上	miro
工具/操作, APP	\N	https://i.imgur.com/TeueEDu.jpg	學習/教學工具	\N	https://www.zotero.org/	免費	\N	Zotero是書目管理軟體，可以將妳找過的資訊分別放入同一個地方	書目管理, 數位學習	\N	大學以上, 國高中	zotero
APP, 工具/操作	\N	https://i.imgur.com/9eJiN0t.jpg	學習/教學工具	\N	https://butter.us/	免費	\N	Butter是一個線上會議的白板，提供提案者可以更視覺化的呈現自己的計劃。	提案軟體, 數位學習	\N	國高中, 大學以上	Butter
APP, 工具/操作	\N	https://i.imgur.com/mB6T9bU.png	學習/教學工具	\N	https://gather.town/	免費	\N	gather town是一個2D模式的線上會議室，網站內有很多類型可供你選擇妳想要的虛擬會議室型態。	視訊軟體	\N	國小, 國高中, 大學以上	Gather Town
工具/操作, APP	\N	https://i.imgur.com/n5d3KHG.png	學習/教學工具	\N	https://www.microsoft.com/zh-tw/microsoft-teams/group-chat-software	免費	\N	Microsoft Teams是微軟公司開發的線上視訊、會議軟體	線上教學, 視訊軟體	\N	學齡前, 國小, 國高中, 大學以上	Microsoft Teams
文章/書, 課程/活動	\N	https://i.imgur.com/4pCxcP0.png	學習/教學工具	\N	https://sutok.com.tw/digital_learning_book/	部分免費	\N	《給老師的數位教學攻略》是一本電子工具書，裡面收錄了許多 75 個適合運用在教學情境中的數位資源介紹給老師們，並收錄了 5 篇數位學習主題文章、5 個應用範例，希望能夠幫助臺灣的老師們更輕鬆地提升數位能力，為自己的教學增添更多元素。	數位學習, 教學工具書	\N	國高中, 大學以上	給老師的數位教學攻略
課程/活動, 影片	Tiff	https://i.imgur.com/FbQrfDm.png	綜合型學習資源	\N	https://www.udemy.com/	需付費	\N	Udemy 是來自美國舊金山的線上學習平台，在全球有超過65,000 門課程、2,000 萬名學生以及30,000 名講師。 課程包括程式設計、市場行銷、設計、個人成長等等。 Udemy 和傳統的大學課程/ MOOC 課程不同，Udemy 為不同類型的專家、講師提供了一個平台，以免費或收費形式提供課程給大眾。	終身學習	\N	國高中, 大學以上	Udemy
影片	\N	https://i.imgur.com/OWTLJis.jpg	綜合型學習資源	\N	https://www.youtube.com/user/crashcourse	免費	\N	Youtube 教育頻道，涵蓋各領域的速成短片，一集平均10分鐘，包 含:世界歷史、生物學、化學、心理學、經濟學、哲學、社會學、 人文地理......等。\n中文翻譯網址:https://www.bilibili.com/tag/242828	學科類型, 終身學習	\N	國小, 國高中, 大學以上	Crash  course
課程/活動, 組織/社群	\N	https://i.imgur.com/5pmhiRl.jpg	綜合型學習資源	\N	https://www.junyiacademy.org/	免費	\N	均一教育平台是一個致力於發展個人化學習的線上教育平台，目前\n提供中小學、高中的線上教育資源，包含教學影片與練習題。課程\n範疇包括國小到高中數學、自然，互動式英文學習，目前有超過 1\n萬 2000 部教學影片，超過 4 萬 4000 題習題。	學科類型	\N	學齡前, 國小, 國高中, 大學以上	均一教育平台
課程/活動, 影片	\N	https://i.imgur.com/hfiTPad.png	綜合型學習資源	\N	https://www.khanacademy.org/	免費	\N	可汗學院(Khan Academy)，是由孟加拉裔美國人薩爾曼·可汗創立的一家教育性非營利組織，主旨在於利用網絡影片進行免費授課，現有關於數學、歷史、金融、物理、化學、生物、天文學等科目的內容，教學影片超過2000段，機構的使命是加快各年齡學生的學習速度。	學科類型	\N	國小, 國高中, 大學以上	Khan Academy
組織/社群, 影片	\N	https://i.imgur.com/X7FJE8Z.png	綜合型學習資源	\N	https://www.bilibili.com/documentary/	免費	\N	提供翻譯字幕紀錄片，包含人文、歷史、科學、自然......等。	終身學習	\N	國小, 國高中, 大學以上	bilibili 放映廳 紀錄片
影片	\N	https://i.imgur.com/iQlbn3w.jpg	綜合型學習資源	\N	https://www.youtube.com/user/crashcourse	免費	\N	英文資源，等級大概是高中大學，內容多樣，包含大部分高中學科，內容有搭配動畫，讓學生想看下去\nAt Crash Course, we believe that high quality educational videos should be available to everyone for free! \nSubscribe for weekly videos from our current courses! Right now, we're producing Organic Chemistry and European History. We also recently teamed up with Arizona State University to bring you two more courses: Study Hall Composition, and Study Hall Algebra. \n\nThe Crash Course team has produced more than 32 courses on a wide variety of subjects, including organic chemistry, literature, world history, biology, philosophy, theater, ecology, and many more! \n\nHelp support Crash Course at Patreon.com/CrashCourse.	終身學習	\N	國小, 國高中, 大學以上	Crash Course
課程/活動, 影片	\N	https://i.imgur.com/ypYw4Cq.png	綜合型學習資源	\N	https://www.udacity.com/	免費	\N	由史丹佛前教授創辦的教育平台，目標是實現民主教育，「讓教育擴展到更多人身上」，提供許多人工智慧、數據分析、程式語言相關的免費課程，同樣是需要註冊的英文網站。跟其他平台的差異點是Udacity跟企業的密切合作（付費微學位Nanodegree能夠提供職場需求的專業技能教育），這篇文章針對Udacity優勢介紹得很清楚，有興趣可以看看～(參考臨安初霽)	終身學習	\N	國小, 國高中, 大學以上	Udacity
課程/活動, 組織/社群	\N	https://i.imgur.com/zO75PIx.png	綜合型學習資源	\N	https://yangcongxueyuan.com/#/studentPage	免費	\N	洋蔥學院原名洋蔥數學是一個全學科的K12線上教育品牌，課程全面覆蓋小學、初中和高中。與常規的網課不同，洋蔥學院自創立之初就摒棄用真人教師授課，依據國家課程標準和教材，截止到2019年已經自主研發了超過2500個富有創意的動畫影片課程。每節課平均5-8分鐘精講一個知識點或思維點，幫助學生深度理解。在課中、課後還配有豐富的互動練習，以達到知識鞏固。(參考鳥哥筆記)	學科類型	\N	學齡前, 國小, 國高中, 大學以上	洋蔥學院
組織/社群, 課程/活動	\N	https://i.imgur.com/QpMVwqe.png	綜合型學習資源	\N	https://zashare.org	免費	\N	一個由民間自主發起由下而上的社會創新策展，建立1-99歲的\n 「一站式教育資源平台」，聚集所有學校沒教/ 適合每一個你的不同學習路徑。	終身學習, 民主教育, 教育創新, 自主學習	台灣	國小, 國高中, 大學以上	雜學校
組織/社群, 課程/活動, 文章/書	\N	https://i.imgur.com/TCYwLim.png	綜合型學習資源	\N	https://medium.com/learn4power-tw	免費	\N	學次方提供三大類型的教育服務，分別為主題式課程、工作坊、桌遊。在三峽經營現下教室，設計不同主題的跨領域課程，以遊戲、體驗的方式規劃教案、希望培養小孩「自我學習、解決問題」的能力。	學科類型	台北	國小, 國高中, 大學以上	學次方
組織/社群, 課程/活動	\N	https://i.imgur.com/GNT2tn2.png	綜合型學習資源	\N	https://www.guildeducation.com/	免費	\N	此終身學習平台為在職人士提供課程、項目和學位。	終身學習	\N	國高中, 大學以上	Guild Education
課程/活動, 影片	\N	https://i.imgur.com/SinzdPp.png	綜合型學習資源	\N	https://byjus.com/	需付費	\N	BYJU'S-The Learning App主要為1至12年級（小學至高中階段教育）的在校學生提供教育內容，該公司為印度的考試培訓學生，如IIT-JEE、NEET、CAT、IAS，以及GRE和GMAT等國際考試。主要集中在數學和科學領域，使用12-20分鐘的數字動畫視頻來解釋概念。BYJU'S報告說總體上有4000萬用戶，300萬年度付費用戶，年留存率約為85%.，該應用聲稱會根據學生個人的學習節奏和風格來定制提供的內容，學生平均每天使用BYJU'S的時間為53分鐘.	學科類型	\N	國小, 國高中, 大學以上	BYJU’S
組織/社群, 課程/活動, 影片	\N	https://i.imgur.com/lOmz7RH.png	綜合型學習資源	\N	https://www.igetget.com	免費	\N	主打知識服務的應用程序，通過訂閱專欄，付費音頻，電子書等方式為網友每天提供有價值感的知識內容。	終身學習, 電子書	\N	國小, 國高中, 大學以上, 學齡前	得到
組織/社群	\N	https://i.imgur.com/09qw9ls.png	綜合型學習資源	\N	https://app.thoth.tw/t/%E9%8B%BC%E7%90%B4	免費	\N	此平台可以免費上去分享學習需求，以及可以提供的資源，進行技能交換。而學習類別多元，包含音樂、程式設計、各式語言等。	終身學習	\N	國小, 國高中, 大學以上	托特 thoth
組織/社群	\N	https://i.imgur.com/CPnsfmw.png	綜合型學習資源	\N	https://www.ck12.org/student/	免費	\N	CK12是一個美國的數位教科書資源網，內容以數學和科學為主，現在也增加了其他科目例如健康、歷史、英文、天文、科技、工程、sat測驗預備等，課文中除了圖文解說，有時也加入影片幫助學生加強理解。\n\n網站有中文翻譯功能，不過是機器翻譯，所以效果有限。\n\n資料來源：關鍵評論網\n	線上教學	\N	國小, 國高中, 大學以上	CK-12美國線上學習平台
課程/活動	Tiff	https://i.imgur.com/P9uBN6R.png	綜合型學習資源	\N	https://www.openlearning.com/	部分免費	\N	OpenLearning為線上的終身學習平台，使教育工作者能夠向學習者提供有效、有趣和充滿變革性的線上課程。OpenLearning在165個國家/地區擁有超過165萬名學習者和8900門課程，被認為是澳洲創新和技術成功的典範。\n\n資料來源：https://www.163.com/dy/article/F6OVDU980530N4P3.html	學科類型	\N	國高中, 大學以上	Openlearning
組織/社群	\N	https://i.imgur.com/yowZF53.png	綜合型學習資源	\N	https://www.facebook.com/LifeEducationStudio/?hc_location=ufi	免費	\N	時習教育致力於重新定位「學科」在「生活」中的意義與連結。對 「國小階段」做親子共學課程活動，對「中學階段」則以團體/學 校為單位，提供知識遊戲化的營隊或工作坊。	學科類型	\N	國小, 國高中, 大學以上	時習教育工作室
組織/社群	\N	https://i.imgur.com/ueFxZ1Z.jpg	綜合型學習資源	\N	http://2plus.com.tw	需付費	\N	2PLUS 不斷嘗試各種可能，透過遊戲呈現出這片土地上的千姿百態。其作品包含:走過，台灣、化學事、On the Go 台灣走透透......等。	桌遊, 公民參與, 社會議題, 文化	\N	學齡前, 國小, 國高中, 大學以上	2PLUS 桌上 遊戲設計工 作室
組織/社群, 影片	\N	https://i.imgur.com/akaLqbj.png	綜合型學習資源	\N	https://www.ncl.app.visionmedia.com.tw/video	免費	\N	國家圖書館為多面向強化館藏資源，提供多元化視聽影音服務內容，提升民眾終身學習之視聽服務品質，特推出「公共圖書館區域資源中心電影院」，提供公共圖書館區域資源中心及共同服務之各館讀者連線使用。\n本電影院為視界影視文化公司(飛行國際視聽公司之子公司)專為圖書館提供優質影視內容與串流影音平台(OTT)，平台內有百部以上普遍級與保護級寓教於樂的電影，讓您不用出門在任何地方只要擁有圖書館帳號及網路，就能享受隨選隨看的影音樂趣。每月皆有新片上線，是圖書館開展更多新媒體平台應用服務之一。實現開放、自主、便利的社會教育目標，縮短城鄉使用數位工具的差距。	終身學習, 影片	\N	學齡前, 國小, 國高中, 大學以上	公共圖書館區域資源中心電影院
課程/活動, 組織/社群	\N	https://i.imgur.com/7NiS73j.jpg	綜合型學習資源	\N	https://www.linkedin.com/hp/?trk=learning_login_linkedin	免費	\N	為LinkedIn的學習服務，可以充實商業、創意與技術知識，達成個人和專業目標！	社會創新, 線上教學	\N	國高中, 大學以上	LinkedIn Learning
組織/社群, 課程/活動	\N	https://i.imgur.com/0P0L7ym.png	綜合型學習資源	\N	https://kktix.com	免費	\N	全功能售票購票平台，找活動、辦免費活動、辦售票活動、研討\n 會、演唱會、郊遊踏青......皆可。	終身學習	台灣	學齡前, 國小, 國高中, 大學以上	KKTIX
課程/活動, 影片	\N	https://i.imgur.com/tMXrGel.png	綜合型學習資源	\N	https://classbox.tv/ClassBoxWeb/Front/Home	部分免費	\N	ClassBox課吧成立於2018年，團隊開發了亞洲第一個附有LIVE直播教學功能的線上教學平台，增進學員和講師的互動，課內問答變得更簡單，和講師更零距離。同時也有APP可以讓學員在行動裝置上能夠觀看學習。\n我們一直以來都在關注學習的形式以及成效，我們認為學習資源應該是要更簡單、更容易取得，所以我們立志推廣線上教學，讓學習無弗屆；改變書面教學，讓學習透過影片更易懂而且有趣。這裡將會有各式種類的教學影片，學員可以依照自己需求選擇學習種類以及講師，APP的開發也讓學員能夠不無時無刻都在線上觀看教學影片。我們也設有「作筆記」的功能，在影片中設有觀看記憶點，讓觀看影片的學員能夠紀錄下每一個不能錯過的重點內容。\nClassBox課吧是一個學員也能成為講師的平台，我們看重知識的有效流動。為了能夠為學員蒐集到更多教育知識，只要您把您的知識或專長錄製成教學	終身學習	\N	國高中, 大學以上	Class Box課吧
課程/活動, 影片	\N	https://i.imgur.com/VlDppf7.png	綜合型學習資源	\N	http://get.aca.ntu.edu.tw/getcdb/	免費	\N	為提供各大學更為充分的通識教育資源，並催化通識教育氛圍以提高學校、教師、學生及社會大眾對通識教育認識、瞭解與關注，教育部高教司於97年4月起，開始積極推動與建置一整合國內、外通識教育資源之資訊服務平臺─「臺灣通識網」，以提供相關使用者充分且即時的通識教育訊息與完整的服務，滿足使用者專業性與多樣性之需求。「臺灣通識網」每門課程內容包含課程大綱、講義、影音課程、延伸閱讀、教師簡介等，亦可下載課程教材包使用，對自學者、教師教學、偏遠地區教學資源不足者具實質助益，皆是免費的資源。\n\n      隨著臺灣通識網內容日益豐富、軟硬體架構的穩固，本計畫 99、100 年度工作以行銷推廣為主。透過不同形式的行銷策略與社群鞏固，有效推廣本土性通識教育之理念與文化。101 年度起，本計畫除延續既有行銷推廣策略外，另以經驗傳承與技術轉移為工作重心。藉由推廣與傳承等工作，發揚本計畫近年來於課程製作、社群組織、資料蒐羅與匯集、系統建置…等工作成果，並使臺灣通識網得以永續發展。為了使計畫可更高度集中管理，教育部於101年9月正式通知國立台灣大學自102年度起接辦前述計畫並成立「臺灣通識網推廣中心」，肩負「臺灣通識網」的營運與推廣任務，為開放式課程理念的落實共同努力。	終身學習	\N	國小, 國高中, 大學以上	台灣通識網
課程/活動, 影片	\N	https://i.imgur.com/tvZEtrG.png	綜合型學習資源	\N	https://www.learnmode.net	免費	\N	學習吧是由信望愛文教基金會所創辦。\n我們提供簡單易上手的工具，幫助老師輕鬆開始翻轉課堂。\n\n多元的影片與課程，讓學生能在家自主學習。家長也能簡單搜尋到各種教學資源，協助孩子解決課業問題。\n\n該平台整合內容與學習工具的開放式教學平台，將知識系統性的組織起來，提供學習素材與學習評量資源，讓學生自主學習。	學科類型	\N	學齡前, 國小, 國高中, 大學以上	LearnMode 學習吧
課程/活動, 影片	\N	https://i.imgur.com/cQegTUd.png	綜合型學習資源	\N	https://open.163.com/	免費	\N	網易視頻公開課頻道推出國內外名校公開課，涉及廣泛的學科，名校老師認真講解深度剖析，網易視頻公開課頻道搭建起強有力的網絡視頻教學平台。	學科類型, 終身學習	\N	國高中, 大學以上	網易公開課
組織/社群	\N	https://i.imgur.com/l9oqoXa.png	綜合型學習資源	\N	https://www.facebook.com/flying.crazyer/?__xts__%5B0%5D=68.ARB0efYYyUS6JoZpE2odx0wtEKWvK2eDMxlymJc8Pqg_7RfoSarua-53uw9oHZYqa47dF2smcVUKCsXrxFltURsmvqEtv4Q9iPtprmMTJbonCYFdV2yA84ML_aPlvwxLop9YwouursyWg_MAqtdNXIYRiY8tWKIpwbVJteijaY2SVhJPdaKC-bY_MTa86siPgCpZlZqGWn3F8Vf6bavcpcLGplx8pMfcpjVxTepvdBu_btv4InV_dpwwngrbJCHGIjsbyTZHVpCgrGTr_1vT3zS3nKvsJ5u9F28bsx-tRbhHdUj0SMKuR_lX0aUaAZDWDkvkN4v15rwGyy5WBGkH9ReWvjvoAVG4RiP3L2cTaDGwpfpbqQYROD5qDA	免費	\N	讓狂人飛是一個致力於提升線上學習成效的工作團隊，自然累積 6,000,000 自然觸及數據，利用AI提高10倍的線上學習成效，打造針對18~30歲的全領域教育內容	終身學習	\N	國小, 國高中, 大學以上	讓狂人飛
組織/社群, 課程/活動	\N	https://i.imgur.com/kupocMn.jpg	綜合型學習資源	\N	https://www.oncourselearning.com/	免費	\N	40多年來，OnCourse Learning為金融機構和190,000多名抵押貸款專業人士提供了許可前、繼續教育、專業發展和合規培訓。我們的主要品牌--BankersEdge、ProSchools、TrainingPro--已經合併為OnCourse Learning，形成了一家致力於提供優質教育的金融服務教育公司。	終身學習	\N	國高中, 大學以上	OnCourse Learning
課程/活動, 組織/社群	\N	https://i.imgur.com/hApmbtC.jpg	綜合型學習資源	\N	http://edc.extension1.mcu.edu.tw/	部分免費	\N	疫情不明朗下，你害怕沒有實體營隊可參加嗎？\n免驚！\n專長探索中心將舉辦「全台唯一知識型直播營隊」！\n邀請專業師資、透過線上直播互動，\n讓你在家拯救世界、學習知識，還可以獲頒大學證書～\n不用出門就能參加的營隊，讓你在家就能累積學習歷程！\n是最適合防疫期間的學習方案！	線上教學, 學科類型	\N	國小, 國高中, 大學以上	專長探索中心
影片, 組織/社群	\N	https://i.imgur.com/J8ZpTZ1.png	綜合型學習資源	\N	https://tfgcoocs.fg.tp.edu.tw	免費	\N	北一女中開放式課程計畫 (TAIPEI FIRST GIRLS CREATIVE ONLINE OPEN COURSEWARES，TFG COOCS)構想來自於史丹佛大學主導的COURSERA教育平臺與麻省理工學院的MIT OPEN COURSEWAREOPENS IN A NEW WINDOW，其宗旨在普及全世界最好的教育，向所有人提供免費的線上課程。(摘自:https://tfgcoocs.fg.tp.edu.tw/)	學科類型	\N	國高中, 大學以上	北一女開放式課程
組織/社群, 文章/書	\N	https://i.imgur.com/wxSrBoM.jpg	綜合型學習資源	\N	https://newsveg.tw/	免費	\N	不做專家，只做你博學的好友。\n不求流量，只為你增加時間的質量。\n不談闊論，只給你連結時事的實用知識。\n\n當你面對新聞時事，想深入研究，卻不知從何入門。\n當你面對海量資訊，想去蕪存菁，卻不知如何思考。\n\n歡迎光臨生鮮時書\n\n我們為您提煉書中知識，解讀國內外生鮮時勢，每週每月，送上時事背後的延伸閱讀。	終身學習	\N	國小, 國高中, 大學以上	生鮮時書
課程/活動	\N	https://i.imgur.com/KqaGqr7.png	綜合型學習資源	\N	https://www.accupass.com/	免費	\N	集結論壇、展覽、講座、免費體驗及各式有趣活動資訊。	終身學習	台灣	學齡前, 國小, 國高中, 大學以上	Accupass
組織/社群, 課程/活動	\N	https://i.imgur.com/NbYKO8l.jpg	綜合型學習資源	\N	https://www.masterclass.com/	需付費	\N	Masterclass為付費線上課程平台，擁有有45種課程，請到國際一流大師教導你如何寫作、品酒、攝影、拍片、打籃球、爵士樂、下廚等。	終身學習	\N	國高中, 大學以上	MasterClass
組織/社群, 課程/活動, 文章/書	\N	https://i.imgur.com/PYI7SR3.jpg	綜合型學習資源	\N	https://www.theschooloflife.com/taipei/	部分免費	\N	以哲學、心理學、藝術、文學等人文學科為基礎，探討工作、愛情、自我、家庭、文化、社群等人生課題。\nThe School of Life 由英國作家 艾倫狄波頓 (Alain de Botton) 創立，總部位於倫敦，據點遍布世界12個城市。2016 台北成立，是華人地區唯一據點！ 在The School of Life，你不會受困於教條式的解答，而能從知識和文化當中，為人生課題找尋意想不到的應證與新觀點。	終身學習	台北	大學以上, 學齡前, 國小, 國高中	The School of Life Taipei
課程/活動, 影片	\N	https://i.imgur.com/0kdDlV1.png	綜合型學習資源	\N	https://zh.khanacademy.org/	免費	\N	開放數位線上平台可汗學院，創辦目標是「免費提供給所有人，隨時隨地的世界級教育」​。課程內容包羅萬象，教程科目範圍主要落在中小學，由幼兒數學到國高中物理、化學、數學、天文歷史經濟生物醫學都有，少量電腦科學、網頁設計程式教學（JS跟HTML），也有GMAT、MCAT、SAT等等考試準備相關課程。特色是教學者本人不出現在影片中，用的是電子黑板來呈現。目前有「可汗學院正體中文翻譯計畫」，開放志工自願性幫助翻譯影片，申請方式可以見這篇文章。(參考臨安初霽)	學科類型, 終身學習	\N	國高中, 大學以上	可汗學院
課程/活動, 影片	Tiff	https://i.imgur.com/Go2QKLU.png	綜合型學習資源	\N	https://taiwanlife.org/	免費	\N	國人已進入數位學習及終身學習的時代，TaiwanLIFE自上線服務以來，已開設超過三百課次，註冊者超過五萬人次，為台灣打造出全民終身學習的優質環境。	終身學習	\N	學齡前, 國小, 國高中, 大學以上	台灣全民學習平台
課程/活動	Tiff	https://i.imgur.com/Y50dTMk.jpg	綜合型學習資源	\N	http://ocw.mit.edu/index.htm	免費	\N	麻省理工學院將上課使用的影片及教材提供在網路上（MITOCW）。側重理工科目，提供課堂講義資料，不須註冊。課程內容比較進階，專業科目為主。目前也有開放式翻譯計畫在運作當中，詳情可以看這裡。(參考臨安初霽)	學科類型	\N	國高中, 大學以上	MIT Open Courseware
組織/社群, 影片	\N	https://i.imgur.com/ewCyydh.png	綜合型學習資源	\N	https://high.deltamoocx.net	免費	\N	此網站主要透過建立一個公益的公共網路學習平臺，分別針對高中/高工及大學的學生，設計網路課程、製作教材、提供線上諮詢，並建立學習評量機制，以提昇學生學習動機與學習成效。(節錄自https://high.deltamoocx.net/about)	學科類型, 線上教學	\N	大學以上, 國小, 國高中	DELTAMOOCx愛學網
課程/活動, 影片	Tiff	https://i.imgur.com/1qyim8D.png	綜合型學習資源	\N	https://www.ewant.org/my/	免費	\N	由國立交通大學於2013年建立的ewant育網開放教育平臺是臺灣第一個磨課師(massive open online courses, MOOCs)平臺，採用開放源碼的moodle線上教學系統作為平臺的核心，旨在為所有願意投入MOOCs運動的學校及單位提供一個展示及經營課程的平臺，也為所有想要免費利用線上課程的學習者提供方便的學習機會。	學科類型, 終身學習	\N	學齡前, 國小, 國高中, 大學以上	ewant育網開放教育平台
組織/社群	\N	https://i.imgur.com/jo5ulNK.jpg	綜合型學習資源	\N	https://www.facebook.com/mizoriot/	免費	\N	迷走工作坊專注桌上遊戲的開發推廣，也是台灣最具桌遊集資經驗的顧問團隊。 其作品包含:台北大空襲、高雄大空襲。	桌遊, 社會創新, 文化	\N	國小, 國高中, 大學以上	迷走工作室
課程/活動, 影片	\N	https://i.imgur.com/rOTDb7y.png	綜合型學習資源	\N	https://hahow.in/	需付費	\N	Hahow 提供最多元有趣的線上課程，並透過獨特的課程募資機制，讓熱愛自學與交換技能的你，在家就可以完成高效率的線上學習與成就，學那些學校不會教的事！	終身學習	\N	學齡前, 國小, 國高中, 大學以上	Hahow
課程/活動, 影片	\N	https://i.imgur.com/Ri1g7lM.png	綜合型學習資源	\N	http://www.yottau.com.tw/	需付費	\N	YOTTA 以募資方式提供專業線上課程，包含設計、商業、科技、語言、文化等；學習門檻低，可隨時隨地上課，有效提升你的專業技能，讓你紮實了解每種知識。	終身學習	\N	學齡前, 國小, 國高中, 大學以上	YOTTA 
影片, 課程/活動	\N	https://i.imgur.com/IFWlpq4.jpg	綜合型學習資源	\N	https://adl.edu.tw/withoutlogin.html	免費	\N	因材網的目前涵蓋領域為數學、自然與國語文，適用對象為一到九年級學童，而內容主要分成四個部分，登入後即會看到四個區塊，包含知識結構學習、智慧適性診斷、互動式學習與PISA合作問題解決能力。	學科類型	\N	國小, 國高中, 大學以上	教育部因材網
組織/社群, 課程/活動	\N	https://i.imgur.com/pKjmcZh.jpg	綜合型學習資源	\N	https://www.hundun.cn/	需付費	\N	一所沒有圍牆的網路創新大學，匯集行業頂尖創新老師，傳授創新思維，致力於為這個時代培養跨學科的創新人才。	終身學習	國外	國高中, 大學以上	混沌大學
影片	\N	https://i.imgur.com/RGYR4xf.png	綜合型學習資源	\N	https://www.netflix.com/tw/	需付費	\N	線上影音串流平台，提供經典電影、兒童影片、各類紀錄片等內容。	終身學習, 影片	\N	學齡前, 國小, 國高中, 大學以上	Netflix
課程/活動	\N	https://i.imgur.com/bGWQ7SQ.png	綜合型學習資源	\N	https://www.napcu.org.tw/index.html	部分免費	\N	社區大學以學術性課程、公共參與的社團活動課程為特點。不限學歷，提供人文素養、生活知能、培育社會健全公民之終身學習課程。若為18歲以下之學生，可以與各單位另外溝通是否能夠開另有彈性參與。	公民參與	\N	大學以上, 國高中	各縣市社區大學
課程/活動, APP	Tiff	https://i.imgur.com/FDgjjFE.png	綜合型學習資源	\N	https://www.edx.org/course/justice-2	免費	\N	由麻省理工學院（MIT）和哈佛大學創建的大規模開放線上課堂平台。現有52所教育機構參與，包含柏克萊加州大學、波士頓大學等等。內容側重大學科目，英文網站，需要註冊。(參考臨安初霽)	學科類型, 終身學習	\N	國高中, 大學以上	edX
課程/活動	\N	https://i.imgur.com/wu14br0.png	綜合型學習資源	\N	https://www.chegg.com/	需付費	\N	一家以學生為主要連接的學習平台，提供教科書和數位產品。數位產品主要包括Student Hub，公司連接的學習平台、以網路為基礎、多平台的電子書閱讀器、大約有120家出版商的電子書和補充教材、線上輔導、Chegg學習服務、高校招生、獎學金和實習服務。公司在美國的印刷教材、電子書和補充教材的出版商，包括Pearson、Cengage Learning、McGraw Hill、Wiley和MacMillan.；此外，也提供大學招生的行銷服務。公司還與品牌公司合作，如Adobe、Dell、Microsoft、PayPal、P&G、 Red Bull和Shutterfly，為學生提供折扣，促銷和基於學生回饋的其他產品。	學科類型, 終身學習	\N	國小, 國高中, 大學以上	Chegg
課程/活動, 組織/社群	\N	https://i.imgur.com/6UVCDTK.jpg	綜合型學習資源	\N	https://www.knewton.com/	需付費	\N	Alta是Knewton完整集成的自適應教材軟體。Alta包含了你在課程中獲取成功所需要的一切，包括基於文本和視頻的教學，互動學習內容，作業和復習材料，所有這些都只需39.95美元的低價格。而且由於alta是建立在Knewton的自適應學習平台上，所以alta可以在你完成作業的同時，快速識別並動態提升知識漏洞，讓你達到你想要的目標。	學科類型	\N	國高中, 大學以上	Knewton
組織/社群	\N	https://i.imgur.com/9ogKgkK.jpg	綜合型學習資源	\N	https://www.ximalaya.com	免費	\N	專業的音頻分享平台，匯集了有聲小說、有聲讀物、有聲書、兒童睡前故事等數億條音頻，超過4.5億用戶選擇的網絡電台。	終身學習	\N	學齡前, 國小, 國高中, 大學以上	喜馬拉雅 FM
影片, 課程/活動, 組織/社群	\N	https://i.imgur.com/Hil9oLj.png	綜合型學習資源	\N	http://www2.tn.edu.tw/hlearning/Course0520B.html	免費	\N	此網站中包含國小國中教師針對不同年級以及不同出版社的教學影片，點選資源後會看到Youtube影片。資源內容包含了國語(文)、數學、英語文、社會、自然、科技、藝術、健體、議題與生活。	學科類型	\N	學齡前, 國小, 國高中, 大學以上	台南市政府教育局線上自主學習網
組織/社群, 文章/書, 課程/活動	\N	https://i.imgur.com/AiRCeoG.png	綜合型學習資源	\N	https://blog.exlearn.tw/	免費	\N	旨在提供課本外的知識學習機會，網羅精選具有理念與堅持的教育業者，透過桌遊、繪本、生活教材等創意學習方法，鼓勵孩子做中學、錯中學、玩中學。	實驗教育, 教育創新, 民主教育, 終生學習	\N	學齡前, 國小, 國高中, 大學以上	課外報報
課程/活動, 影片	蕭至威	https://i.imgur.com/8iyLPQW.png	綜合型學習資源	\N	http://www.n2.org.tw/enter/main	需付費	\N	計畫主要辦理「全國性暑期通識課程」，供全國大學校院學生修習，除了相互認抵學分，更藉由精選、整合與分享各校特色課程，促進大學師生跨校、跨領域的交流，以實踐通識教育精神，達到資源共享的理念。	影片, 線上教學, 社會議題, 社會創新	\N	大學以上	全國夏季學院
影片	\N	https://i.imgur.com/CtTbAY1.jpg	綜合型學習資源	\N	https://www.youtube.com/channel/UCtmb2nQhbT2rxxpmbdRjvVg	免費	\N	以不斷創新、寓教於樂的精神，製作符合國家地理學會探險、保育與教育宗旨的節目，時常釋出免費紀錄片。	終身學習	\N	學齡前, 國小, 國高中, 大學以上	Youtube National Geographic 國家 地理
課程/活動	\N	https://i.imgur.com/qrqNOoP.png	綜合型學習資源	\N	https://www.zybooks.com/	免費	\N	zyBooks是一家位於美國舊金山、成立於2012年的公司。 2016年2月，它完成了400萬美元的融資，主要投資者是Bialla Venture Partners。 該公司主要為計算機科學、工程等專業的學生打造交互式數字學習資源。 Bialla的一位管理人員David Uri將加入zyBooks董事會。	學科類型	\N	國小, 國高中, 大學以上	zyBooks
APP, 組織/社群, 工具/操作	\N	https://i.imgur.com/VQ8Pu73.png	綜合型學習資源	\N	https://www.pagamo.org	部分免費	\N	PaGamO 提供國小三年級至高中三年級的學生，多元領域的知識題目，進入PaGamO遊戲，即可透過戰略遊戲學習多元知識，遊戲涵蓋學科知識、跨領域知識和閱讀素養三大領域。PaGamO量身定做的學生「防疫期間」課表，每日提供 5 – 7 個主題小任務，幫助孩子定時定量，培養學習好習慣。	學科類型	\N	學齡前, 國小, 國高中	PaGamO 
組織/社群, 文章/書	\N	https://i.imgur.com/WvzykTJ.png	綜合型學習資源	\N	https://free.com.tw	免費	\N	以免費為主題的部落格，內容包含科技新知、 免費軟體、線上工具、圖庫素材、WordPress 架站及應用程式介紹教學。	終身學習	\N	國小, 國高中, 大學以上	免費資源網路社群
課程/活動, 影片	\N	https://i.imgur.com/u7iUVSh.png	綜合型學習資源	\N	https://www.coursera.org/	部分免費	\N	由史丹佛大學、密西根大學、普林斯頓等等大學開啟的線上免費課堂平台，現有28個不同國家和地區的145所不同的大學提供的課程。科目專業種類繁多，很多熱門科目都有開課。英文網站，需要註冊。(參考臨安初霽)	學科類型, 終身學習	\N	國小, 國高中, 大學以上	coursera
APP, 組織/社群	\N	https://i.imgur.com/9hVWs3V.jpg	綜合型學習資源	\N	https://www.pro360.com.tw/	免費	\N	解決工作生活的麻煩事？您有專才，我們有方法！\n從日常生活到創業開店，從教育學習到運動健身，PRO360為台灣的工作媒合市場提供一個全新的開放平台，連結在地生活的百業服務，讓各領域的專家及顧客，都能免費使用平台的案件媒合服務。\n我們簡化了過去四處資料蒐集、到店比價等繁雜過程，在PRO360您可以3分鐘提出需求、10分鐘開始接案。簡單步驟、容易使用，不僅縮短了「需求」與「專業服務」距離，也創造了工作與生活更多的可能性！\n在PRO360每個人都是顧客，也是專家！\n想要擁有適合自己的工作生活方式，但需要有能支持現實的薪資報酬！？每天都有許多人來到PRO360，提出超過近萬筆以上的工作需求，根據目前數據統計一種專長在PRO360平均每月會收到55筆配對案件，從中挑選感興趣的案件進行報價，您想要的個人事業從PRO360開始	人力資源	\N	國高中, 大學以上	PRO360達人網
組織/社群, 工具/操作	蕭至威	https://i.imgur.com/wkRj16e.jpg	商業與社會創新	\N	https://elite.taiwanjobs.gov.tw/	免費	\N	為協助青年掌握國家產業發展契機，引領取得5+2產業及具發展前景之製造產業之關鍵技術能力。	公關行銷, 人力資源	台北	國高中, 大學以上	產業新尖兵計畫
影片	\N	https://i.imgur.com/NohOPrh.jpg	商業與社會創新	\N	https://www.youtube.com/channel/UCXjk9RSGtUWbll5iN_Fgmqw	免費	\N	5分鐘瞭解一個品牌，你的生活會因此有所不同。	投資理財	\N	國高中, 大學以上	十萬個品牌故事
影片	Tiff	https://i.imgur.com/aHkBXxE.png	商業與社會創新	\N	https://www.youtube.com/channel/UCIBeH-s9UqWnWMUyqBGNqdA/featured	免費	\N	財經影片自媒體。	投資理財	\N	國高中, 大學以上	財報狗 威宇 & 阿堯
組織/社群	\N	https://i.imgur.com/xzK0VX6.jpg	運動/心理/醫學	\N	https://www.facebook.com/Vaccinevillage/	免費	\N	疫苗村廣播：從今天開始呢，會由李大夫診所院長李大夫及村長阿民哥為村民們定期提供最新疾病疫情及預防方式，注重身體健康的村民們千萬不要錯過了！	病毒, 疫苗, 健康, 醫學	\N	國高中, 大學以上	疫苗村 Vaccine village
組織/社群	Tiff	https://i.imgur.com/oMk8VVO.png	運動/心理/醫學	\N	https://www.facebook.com/Dr.TN.Huang/	免費	\N	黃瑽寧醫師：著有《從現在開始，帶孩子遠離過敏》（親子天下）、《輕鬆當爸媽，孩子更健康》（時報出版）（iPad/iPhone電子書版），《身教》（寶瓶出版），《從現在開始，帶孩子遠離過敏》《發燒免驚！搞懂流感腸病毒，小兒生病不心慌》（親子天下）	親子關係, 健康, 保健, 醫學	\N	國高中, 大學以上	黃瑽寧醫師健康講堂
組織/社群	Tiff	https://i.imgur.com/y2vnMto.jpg	商業與社會創新	\N	https://www.facebook.com/zrbros/	免費	\N	斜槓型YouTuber－柴鼠兄弟。除了影片創作者外，同時也是作者、插畫家、貓奴、具財產保險/人身保險業務員資格等，持續增加中。頻道內容斜槓：投資理財/說書介紹/料理廚藝/試吃/開箱⋯等。	投資理財	\N	國高中, 大學以上	柴鼠兄弟
組織/社群	Tiff	https://i.imgur.com/yakdGHb.png	運動/心理/醫學	\N	https://www.facebook.com/KnKpsy/	免費	\N	我們是丁郁芙、蘇益賢臨床心理師。致力於推廣易懂、實用且有科學基礎的心理學知識。期盼大家的生活，可以因此更美好。各類合作、講座邀約，歡迎傳訊或來信。	療癒, 輔導, 情緒, 助人工作, 人際關係, 生命教育, 諮商, 自我探索, 自我成長, 心理學	\N	國高中, 大學以上	心理師想跟你說
組織/社群	Tiff	https://i.imgur.com/syPUrEL.png	運動/心理/醫學	\N	https://www.facebook.com/cradlelife	免費	\N	Change the world, one home at a time." 「改變世界，從一家一戶開始」 ．搖籃生活提案所． 無論在婚姻經營、懷孕、生產、育兒、青少年教養等， 期能和中部的朋友們一起找到支持的力量。	健康, 懷孕, 溫柔生產	\N	國高中, 大學以上	搖籃生活提案所
組織/社群, 課程/活動	Tiff	https://i.imgur.com/62ZtexK.jpg	運動/心理/醫學	\N	http://www.heartcards.com.tw/index.html	部分免費	\N	台灣原創牌卡設計者周詠詩老師在牌卡助人工作領域深耕多年，陸續成立好心晴工坊。2018年則集結眾多愛好牌卡的夥伴成立「台灣文創牌卡教育推廣協會」。透過周詠詩老師設計的原創牌卡學習如何照顧當自己的小護士，同時也可以幫助身邊的親朋好友！	輔導, 療癒, 助人工作, 工具, 牌卡, 諮商, 自我探索, 心理學	\N	國小, 國高中, 大學以上	牌卡教育推廣協會
課程/活動, 組織/社群	\N	https://i.imgur.com/vEvim6b.jpg	運動/心理/醫學	\N	https://www.noyukiacademy.com	需付費	\N	野雪塾是由台灣、香港與美裔華人在日本主導的華語滑雪學校。以\n 「Share the stoke - 分享滑雪之夢」為宗旨。	體育, 體能, 滑雪	國外	學齡前, 國小, 國高中, 大學以上	野雪塾
組織/社群	Tiff	https://i.imgur.com/lYNEFNc.jpg	運動/心理/醫學	\N	https://www.facebook.com/Psychologist.Hung/	免費	\N	協助自我探索與覺察、情緒教育、親職教養諮商、人際與家庭溝通、壓力管理、自閉類群障礙症、早期發展療育評估...等。\n\n洪仲清臨床心理師相關文章與訪問 http://redbeanice0131.pixnet.net/blog/post/114513320	療癒, 輔導, 情緒, 助人工作, 人際關係, 諮商, 自我探索, 自我成長, 心理學	\N	國高中, 大學以上	洪仲清臨床心理師
組織/社群	\N	https://i.imgur.com/OhfKJQX.jpg	運動/心理/醫學	\N	https://www.facebook.com/richearth99	免費	\N	沃土是一個心理工作室，提供薩提爾成長模式的心理教育。	輔導, 薩提爾, 自我探索, 自我成長, 心理學	\N	大學以上, 國高中	沃土心理工作室
影片	\N	https://i.imgur.com/bQ1Hr45.jpg	商業與社會創新, 綜合型學習資源	\N	https://www.youtube.com/user/WxSkyxW/featured	免費	\N	YouTube頻道「賭徒的傻空日誌」，創辦人傻空本身是一名家教老師，疫情期間跨領域自學區塊鏈知識，投入挖礦及加密貨幣交易事業。\n頻道初衷是希望創造最適合新手的區塊鏈社群，經常透過Discord及YouTube直播，分享GameFi、DeFi投資項目的個人心得。並透過螢幕分享，一步一步帶大家從最基礎的創辦虛擬交易所帳號、去中心化錢包開始，為諸多新手開啟區塊鏈大門。除了線上，亦籌辦實體課程，希望讓更多人了解這看似遙不可及的虛擬金流世界。\n同時經營Discord付費會員群，集結更多志同道合的夥伴，共享福利與資源。	商業, 區塊練, 投資理財, 教育	\N	國高中, 大學以上	賭徒的傻空日誌
課程/活動, 組織/社群	\N	https://i.imgur.com/usbFQSy.jpg	運動/心理/醫學	\N	cgds.com.tw/about	部分免費	\N	尊重每個孩子的特質，在感知、反應、勇敢、合作、專注的練習中認識自己，了解自己的能與不能。	療癒, 芳療, 體育, 健身, 體能	台灣	學齡前, 國小	雲門舞集舞蹈教室
組織/社群	Tiff	https://i.imgur.com/ZcHqK9s.png	運動/心理/醫學	\N	https://www.facebook.com/clinicpsy.tw/	免費	\N	這是由臨床心理師編輯的刊物，2016年5月，刊名由[蝴蝶飛訊]改為[心理誌PsychoLife]，向大眾介紹更多元的心理知識及臨床心理師的服務樣貌。 ●臨床心理師全國聯合會發行©	心理學, 臨床	\N	國高中, 大學以上	心理誌 PsychoLife
組織/社群, 文章/書	Tiff	https://i.imgur.com/0XdPPLz.jpg	運動/心理/醫學	\N	https://onyourpsy.com/?fbclid=IwAR3onR1m2B_Y8bv-01HwFfNfMTjIC7zZ5l-BoBh3kaCtUKI-6hZjHd2NbyI	免費	\N	讓心理學走出象牙塔，讓一般大眾都能夠感受到有趣、有用之處。 創立於2015年，由台灣應用心理學會所支持。2020年7月起，改由動靜心身健康管理工作室所經營。\n\n舉凡一天中會遇到的各種生活情境，從如何與他人相處到生老病死，都有心理學的知識蘊含在其中。我們希望能讓大家看見生活中藏著哪些心理學相關的有趣細節，也期待能有更多的交流與分享。心理學不該只是在學校或醫院間被應用的知識，而是要帶到生活中讓更多人了解，使之融入我們生活的每一刻。	心理學, 療癒, 輔導, 情緒, 助人工作, 愛情, 失戀, 分手, 人際關係, 諮商, 自我探索, 自我成長	\N	國高中, 大學以上	哇賽心理學
組織/社群	\N	https://i.imgur.com/UDZNBR3.png	運動/心理/醫學	\N	https://www.facebook.com/inbound.tw/	免費	\N	用心理學解決現代人在情感面的不知所措、陪大家度過貫穿人一生中的大小失落時刻。平台將原本鎖在象牙塔的心理學知識，以平易近人的語言，滋養灌溉所有網站內容和各式線上線下活動。	療癒, 輔導, 愛情, 失戀, 分手, 自我成長	\N	大學以上, 國高中	失落戀花園
影片	\N	https://i.imgur.com/QZg8WVn.jpg	運動/心理/醫學	\N	https://www.youtube.com/user/SamCamsCreations/featured	免費	\N	由美國舞蹈家Miss Sam所經營的YouTube頻道，教學內容非常活潑有趣，妞姐最愛迪士尼公主系列的舞蹈教學，從2歲以上的幼兒就可以開始學習，還有Hip Hop、Tap等其他種類的舞蹈可以選擇。\n\n資料來源：胖胖麻	體育, 健身, 減肥, 增肌, 減脂	\N	學齡前, 國小, 國高中, 大學以上	SamCam舞蹈教室 (SamCam)
影片	\N	https://i.imgur.com/NkGYRfD.jpg	運動/心理/醫學	\N	https://www.youtube.com/user/CosmicKidsYoga	免費	\N	此Youtube頻道主要提供給孩子們的瑜伽、正念與放鬆。影片搭配不同的動畫場景，例如，森林、海底世界、太空等等。	療癒, 健身, 體能	\N	學齡前, 國小, 國高中, 大學以上	Cosmic Kids Yoga
組織/社群	Tiff	https://i.imgur.com/UK2kEhs.jpg	教育	\N	https://www.facebook.com/togethercolearning/	免費	\N	我們是一群關心台灣自學生態的夥伴，創造一個開放、舒適的共學環境，提供自學生作專案、共組學習交流社團活動及場地租借，以及自學諮詢與資源的服務。歡迎一起來做事!	實驗教育, 自主學習, 組課共學	台北	國小, 國高中, 大學以上	一起共作室
組織/社群	Tiff	https://i.imgur.com/IGhC6IS.jpg	商業與社會創新	\N	https://www.facebook.com/mouselab2015/	免費	\N	第1個被你想出來的創意，95%的人都想過。\n\n貌似實驗室是屬於內容職人的創意平台。以知識轉譯、內容洞察與社群行銷為核心，為新媒體的多樣嘗試找出觀點。我們期望透過短評、人物報導與對談活動，磨出一把拆解內容製作的刀，銳利、精準的指出新視角，成為更多人能夠得心應手的思考工具。\n\n\n關於我們｜為什麼要叫貌似？\nhttp://www.mouse-lab.com/about/	公關行銷	\N	國高中, 大學以上	貌似實驗室 Mouse Lab
影片	\N	https://i.imgur.com/P2Hrp0S.jpg	運動/心理/醫學	\N	https://www.youtube.com/channel/UCTIwFB4ciFi5ZCIu-VlwaOg	免費	\N	提供運動與伸展的影片教學	健康, 體能, 健身, 體育	\N	國小, 學齡前, 國高中, 大學以上	Little Sport
影片, 課程/活動	\N	https://i.imgur.com/1BvrmrK.png	運動/心理/醫學	\N	https://sites.google.com/gapp.fju.edu.tw/psylifephdclass/%E9%A6%96%E9%A0%81?authuser=0	免費	\N	這門課是輔大心理系黃揚名老師開設的公益課程，希望讓更多對心理學有興趣的人，了解心理學家是怎麼做研究的，進而更認識心理學。(簡介摘自https://sites.google.com/gapp.fju.edu.tw/psylifephdclass/首頁?authuser=0)	心理實驗, 心理測驗, 心理學	\N	大學以上, 國高中	心理學家是怎麼做研究的？
影片	\N	https://i.imgur.com/miJqDfW.jpg	商業與社會創新	\N	https://www.youtube.com/c/%E6%9D%8E%E8%87%AA%E7%84%B6/about	免費	\N	有趣的靈魂，聊科技人文。\n歡迎關注「李自然說」，與你分享關於商業、創業、人文的經歷與見解。\n歡迎大家給我留言或評論區交流。	投資理財	\N	國高中, 大學以上	李自然說
組織/社群	Tiff	https://www.ecwife.com/web/image/419/IMG_6899%20copy.png	商業與社會創新	\N	https://www.ecwife.com/	免費	\N	Instagram 的專家	公關行銷	\N	國高中, 大學以上	電商人妻
組織/社群	\N	https://i.imgur.com/H63NZLl.jpg	運動/心理/醫學	\N	https://www.facebook.com/midwifeoncall	免費	\N	助產師的核心想法~幫助婦女相信自己能幫助嬰兒順利誕生！助產師希望提供您一個安全和輕鬆的懷孕與生產過程，能幫助您瞭解您的期望是什麼和提供您適當的資訊協助您做選擇，讓您擁有期望的生產經驗！	懷孕, 溫柔生產, 健康, 醫學	\N	大學以上, 國高中	呼叫助產師
APP	\N	https://i.imgur.com/d3klqoa.png	運動/心理/醫學	\N	https://play.google.com/store/apps/details?id=com.plaifit.plaifit&hl=en&gl=US&fbclid=IwAR3VQ4mRoy_oixJFz5b6RDOuo6HP_lGKM8yYkmbh4_iOD-YCCvo8khDGqSU	免費	\N	從遊戲中健身	體育, 健身	\N	國小, 國高中, 大學以上	Plaicise（Android 系統限定）
組織/社群, 文章/書, 課程/活動	\N	https://i.imgur.com/ualkllh.jpg	運動/心理/醫學	\N	http://www.iiispace.com	免費	\N	舉辦線上線下知識性講座，也舉辦深度工作坊與沙龍，致力於將心 理成長的觀念推動到全世界華人國家。	輔導, 情緒, 助人工作, 愛情, 失戀, 分手, 人際關係, 親子關係, 家族治療, 藝術治療, 生命教育, 芳療, 諮商, 自我探索, 自我成長, 心理學	台灣	大學以上, 國小, 國高中	愛心理
組織/社群	Tiff	https://i.imgur.com/GXXAMqP.jpg	商業與社會創新	\N	https://www.facebook.com/groups/IB.fanpage.club/	免費	\N	歡迎來到社群丼，不管是Facebook、Line、微信、Instagram...不管是想討論社群廣告、內容、策略...，針對任何的社群行銷、社群內容、社群平台或工具，都歡迎大家一起來討論，互相切磋！	公關行銷	\N	國高中, 大學以上	社群丼
組織/社群, 文章/書	\N	https://i.imgur.com/i4eIVMk.png	商業與社會創新	\N	https://csrone.com/	免費	\N	華文地區最大永續人才共創媒合平台\n「人才」是組織深化永續發展的關鍵因素。隨著聯合國SDGs項目的誕生，以及國際社會與消費者永續意識的升溫，企業能否透過永續策略規劃、創造商業價值，已然成為獲利與環境、社會友善多贏的重要關鍵。而擁有CSR知識的全方位綠領人才，更能運用系統思維與永續高度協助企業適當地分配資源，追求永續作為效率極大化的成果。\n\nCSRone耕耘永續領域10餘年，引進國際CSR最新趨勢、擦亮台灣永續品牌的同時，亦逐年擴大培育綠領菁英，並打造永續人才共創生態圈。在這裡，我們熱烈邀請樂於分享個人CSR經驗、知識，並有志於成為世界永續尖兵的學生或企業人士，更歡迎跨領域的斜槓人才共享職涯經歷、大展身手，一同加速永續影響力。讓我們一同將CSR人才深入至各行各業各部門中吧！	人力資源, 社會創新	\N	大學以上, 國高中	CSRone
組織/社群, 課程/活動	\N	https://i.imgur.com/UHOapQ1.png	商業與社會創新	\N	https://www.tridkingdom.com	免費	\N	結合國內外兒童創業學習資源，課程與活動內容橫跨生活四大領域:自我探索、藝術美學、財務觀念與社會關懷。透過PBL(任務導向學習課程)當中培養發現問題、團隊溝通與主動執行的創業家精神。	兒童創業, 自我探索	台北	學齡前, 國小, 國高中, 大學以上	奇德王國
APP	\N	https://i.imgur.com/I8lur9P.png	商業與社會創新	\N	https://timelinker.net/	免費	\N	時間就是我們的貨幣 賺取並花費“時間幣”\n你是否也有過這麼一個念頭：\n 明明我已經每天拚死拚活的工作，但為什麼到頭來還是被錢追著跑，\n甚至連抓住夢想的力氣都沒有？\n 如果說有一個地方可以讓你的價值被看見，你是否願意嘗試呢？ \n TimeLinker 推出了全新的共享機制\n 1.不用花錢\n 2.讓你有價值\n 3.快速解決問題\n 4.免費換取物資\n一個工具，滿足你所有需求 ！！就這麼簡單！！	人力資源, 社會創新	\N	國小, 國高中, 大學以上	Timelinker
組織/社群	\N	https://i.imgur.com/cJOUIit.jpg	商業與社會創新	\N	http://www.workface.tw/blog/	免費	\N	兩岸創變者社群，藉由連結與共創，為台灣新創產業建立共享豐盛的商業生態系統。	社會創新	\N	大學以上, 國高中	WorkFace Taipei
組織/社群	Tiff	https://i.imgur.com/NKur2t2.png	商業與社會創新	\N	https://www.facebook.com/ContentMarketingTW/	免費	\N	《內容行銷力》是行銷人的交流平台，由金蛋數位行銷 GEMarketing經營，希望能將多年實務經歷轉化為開放的知識，不定期分享內容行銷相關故事與實務經驗。	公關行銷	\N	國高中, 大學以上	內容行銷力
提案/競賽, 課程/活動, 組織/社群	東翰	https://i.imgur.com/sJXcAAN.png	商業與社會創新	\N	https://www.seinsights.asia/	免費	\N	社企流是華文界最具影響力的社會企業主題平台，致力透過推廣、連結、支持社會創新創業的精神與行動，促進永續發展，打造美好世界。	社會創新, 社會企業	\N	國高中, 大學以上	社企流
課程/活動	Tiff	https://i.imgur.com/GdH1TC6.png	教育	\N	https://sites.google.com/mail2.nccu.tw/teeclearningplatform/%E9%97%9C%E6%96%BC%E6%88%91%E5%80%91?authuser=0	免費	\N	由政大台灣實驗教育推動中心發起，串聯實驗教育資源，為常規教師、師培生或其他領域之工作者，提供一條進入實驗教育專業工作的學習途徑。	實驗教育, 教師培力	臺灣	大學以上, 國高中	實驗教育工作者培育計畫
提案/競賽	\N	https://i.imgur.com/5yjCOYl.png	商業與社會創新	\N	http://www.mad.asia	免費	\N	MaD 的長遠目標是建立創意公民社會。相信創意能為社會做更多。MaD 透過策劃年中不斷的活動，實踐創意的社會潛能、並賦予亞洲的年青人更多想法和力量，為當代社會挑戰尋找創新出路、帶來正面社會改變。另可申請亞洲學習者計劃，補助交通與住宿。 \n	社會創新, 創意	\N	大學以上, 國高中	MaD Asia 亞洲創不同年會
組織/社群, 課程/活動, 工具/操作	Tiff	https://i.imgur.com/TieonSo.png	運動/心理/醫學	\N	https://tw.meandmine.com/?fbclid=IwAR2d39fjhu4B623xlg05Sxs_mXe6a3uzRTXSiZrV3LNVuAuNAvnUROu4Bns	部分免費	\N	來自全球創新之都－矽谷，獲獎無數的 MEandMine，由醫師、心理學家、教育家、科學家、玩具設計師組成，和哈佛兒童發展中心合作研發全球首創『SEL x STEAM 社會情商 x 科學創客』系統，透過獨特『Read–Build–Play』三步驟， 把抽象的身體、心智與社會情緒學習遊戲化！	情緒	\N	學齡前, 國小	矽谷MEandMine Sel x Steam好好玩
組織/社群, 文章/書	Tiff	https://i.imgur.com/FdHUuDJ.jpg	生活	\N	https://www.agriharvest.tw	免費	\N	農傳媒是由財團法人豐年社所成立的專業新聞網站，是一個「與農共聲、與食俱進、與環境共享」的獨立媒體。站在以農為本的角度，走入生活，觸及土地、食物、教育、文化等與農業相關的各項 議題。 \n	食農	\N	國小, 國高中, 大學以上	農傳媒
組織/社群, 文章/書	\N	https://i.imgur.com/A7C2SJe.png	生活, 藝術	\N	https://www.fotobeginner.com/	免費	\N	此網站介紹了許多攝影新手入門必須要學習的觀念與技巧手法，讓攝影新手可以怪速了解攝影的奧妙	攝影	\N	國小, 國高中, 大學以上	攝影新手學習平台
組織/社群, 文章/書	Tiff	https://i.imgur.com/lJXIssN.png	生活	\N	https://www.newsmarket.com.tw	免費	\N	上下游 News&Market(新聞市集)創辦於2011年，是一個關心農業，以及友善土地議題的社會企業，提供新聞報導、市集、生活文學副刊。\n	食農, 旅遊, 媒體	\N	國小, 國高中, 大學以上	上下游
組織/社群	\N	https://academy.coa.gov.tw/files/banner/banner_1490865705/banner_2.jpg	生活	\N	https://academy.coa.gov.tw	免費	\N	農委會為全面提升農業人力素質，於2011年設立農民學院，運用農委會各試驗改良場所之在地及專業優勢，建立完整的農業訓練制度，並透過一系列的訓練，讓一般民眾、新進農民及在職專業農民，生根發芽變成農業經營的菁英，也為台灣本土農業注入新活水。\n	食農	\N	大學以上, 國高中, 國小	農民學院
組織/社群, 課程/活動	\N	https://i.imgur.com/vEmbdpz.png	生活	\N	http://wwoof.net	免費	\N	WWOOF 是一個國際性的 NGO，起源於英國，旨在推廣有機農場永續經營的自然生活方式。現在全世界超過五十個國家有 WWOOF 組織，包含台灣。工作者一天為有機農場工作4~6小時，一星期工作\n 36~42小時。農家則會提供免費的食宿，以及有機農業的相關知識。	食農	國外	大學以上, 國小, 國高中	WWOOF
組織/社群, 文章/書	\N	https://i.imgur.com/lJMHq81.jpg	生活	\N	http://www.foodnext.net	免費	\N	《食力 foodNEXT》是一家以「食」為報導主軸的媒體，站在食產業第一線，帶讀者瞭解國內外最新食品產業動態，以科學剖析、採訪調查、專家論述，提供讀者完整全面的產業報導，讓讀者開啟食域新觀點。 	食農, 烹飪, 烘培烹飪	\N	國高中, 國小, 大學以上	食力foodnext
組織/社群	Tiff	https://i.imgur.com/VK8TrX1.png	生活	\N	https://www.facebook.com/groups/wu611003/	免費	\N	台灣生態廚師自2018年發起，至2020.08.26將畢業151位生態廚師，包含漢人、原住民、外籍廚師，凡是在這塊土地的都是台灣人。	食農, 烘培烹飪, 家政	\N	國高中, 大學以上	台灣生態廚師學程
組織/社群, 課程/活動	\N	https://i.imgur.com/9cTd0Aa.jpg	運動/心理/醫學	\N	https://www.facebook.com/heartcards/	部分免費	\N	療心卡為國內專業輔導工作者周詠詩老師精心設計的牌卡助人工具，也還包刮Fun心卡、Fun心福卡、聊心話大冒險..等。此粉專包含療心卡培訓課程，也包含一些心理相關知識。	助人工作, 輔導, 諮商, 自我探索, 自我成長, 牌卡, 工具	\N	國高中, 大學以上	療心卡
組織/社群	Tiff	https://i.imgur.com/ip6k5FJ.png	生活	\N	https://nomadlist.com/	免費	\N	如果你正在尋覓世界上最適宜遠距離工作的城市，你不必將目光放得太遠，僅需關注 Nomad List 即可。 Nomad List 剛開始只是一個眾包電子數據表，後來逐漸發展成為一個網站。現在 Nomad List 已經收集了超過 50,000 個數據點，在全球的覆蓋範圍超過 500 個城市。\n\n你可以在 Nomad List 上搜索各個城市的生活成本和天氣狀況，你甚至還可以找到某個城市的網絡質量。你還可以通過有趣程度、整潔程度、安全程度、友善程度以及多樣化程度等參數在 Nomad List 上對城市進行篩選。在每一個城市的主頁上，你都可以找到生活在這個城市\n\n的遠距離或自由工作者。你還可以看到當地最適合居住和工作的地點，並向人們了解在當地工作的感受。\n\nNomad List 最酷的地方是什麼呢？隨著當地天氣、濕度、網路速度和外匯匯率等因素的變化，Nomad List 對特定城市的評分也會實時跟著改變，因此 Nomad List 還可以作為在旅遊使用的指導工具。想要成為正式會員，用戶需要繳納一定的費用，但如果你想要更頻繁地更換自己的生活城市，Nomad List 的社區一定不會讓你失望！	旅遊	\N	國高中, 大學以上	nomadlist
影片	\N	https://i.imgur.com/ov1cq7t.png	生活, 藝術	\N	https://www.youtube.com/channel/UCrIm7p9KuGG8MExJcUokDBQ	免費	\N	這是一個分享攝影及旅遊的頻道，目標走完台灣368個鄉鎮，尋覓美麗的風景及拍照的角落，作個旅行探險家!    (簡介摘自https://www.youtube.com/channel/UCrIm7p9KuGG8MExJcUokDBQ/about)	攝影	\N	國小, 國高中, 大學以上	拍照去哪裡
組織/社群, 文章/書	\N	https://i.imgur.com/lGeSUxf.png	生活	\N	https://www.nlpi.edu.tw/	免費	\N	徵集、組織、典藏各種實體圖書資料、數位資源提供民眾閱讀與終身學習外，結合實體與虛擬服務空間，提供分齡分眾服務，以嶄新的閱讀模式、獨特的探索途徑、多元的休閒機能及舒適的終身學習環境，提供具有圖書閱覽、資訊檢索、數位服務、展覽及演講、訓練等場域，並購置全國公共圖書館共用數位資源，期成為具REAL(Reading、Exploring、recreAtion、Learning)內涵的圖書館、全國公共圖書館數位資源雲端中心，及兼具實體與虛擬服務，虛實合一之數位公共圖書館。（摘自國資圖簡介）	展覽, 博物館, 書籍	\N	國小, 國高中, 大學以上, 學齡前	國立公共資訊圖書館
組織/社群, 文章/書	葦	https://i.imgur.com/OFSCvDm.jpg	教育, 運動/心理/醫學	\N	https://ordinarybird.com/	免費	\N	醫學電神的部落格，裡面有各種升學及醫學資訊。	升學資訊, 臨床	\N	大學以上, 國高中	凡鳥手札
課程/活動, 組織/社群	Tiff	https://i.imgur.com/SqFtJ4r.jpg	教育	\N	https://www.projects-abroad.com.tw	部分免費	\N	Projects Abroad 是全球其中一個最大型的國際志工組織。國際志工或實習生可以在亞洲、非洲、拉丁美洲、歐洲及南太平洋地區參加項目。我們的國際志工項目類型廣泛，包括教學、關愛、環保、醫療及\n保健、新聞、法律及人權、國際發展、商業、建設、考古學等等不同 類型的項目。	國際參與	國外	大學以上, 國高中	Projects Abroad 
Podcast, 組織/社群	\N	https://i.imgur.com/0qQUPtf.png	教育	\N	https://podcasts.apple.com/tw/podcast/%E8%B6%8A%E8%82%B2-%E7%8E%A9%E8%BD%89%E5%AF%A6%E9%A9%97%E6%95%99%E8%82%B2/id1546547567?fbclid=IwAR0geq_vGy1LQuhsWrBcLdBSjZkUNBSVT7WRsOrndYPCSt7hbBQSwPhVlzA	免費	\N	最自由的實驗教育 PODCAST 電台，這裡沒有教育專家，任何擁有教育理念的人都能來節目暢談你的想法。\n我們以台灣實驗教育為核心，發想出各式主題，從幼兒教育、青少年教育、成人教育，以終生學習為目標製作節目內容。\n我們邀請老師、領隊、家長甚至學生一起來到節目中，一起打造一個自由的教育頻道。	自主學習, 實驗教育, 終生學習, 教學方法, 親子教養, 教育政策, 生涯探索	新北	國高中, 大學以上	越育
課程/活動, 組織/社群	Tiff	https://i.imgur.com/mlqISuY.jpg	教育	\N	https://hef.org.tw/teenagerbase/?fbclid=IwAR2i07cSAB-f4pD-fyUfMnDae52FODK22HXvIN6aim7qD0JQwqUveYeZDLc	免費	\N	在三重的貴陽街上，有一幢四層樓的房子，看似平凡的住家建築，卻透露著一點光彩。\n\n2001年7月，居住三重的林先生與林太太，希望人本為三重的青少年「做點事情」，無償提供這幢建築物給人本教育基金會規畫。\n\n從此，這個空間就成為青少年的「基地」。\n\n2001年12月29日，青少年基地開幕了。多年以來，有超過1,000位孩子在這裡裝備工具、裝備能力、裝備夢想與自信——基地，是孩子們重新出發的地方，也是回來沈澱的歸屬；一個行走串門的空間，一個希望的所在。	課後輔導	新北	國高中, 大學以上	三重青少年基地
課程/活動, 組織/社群	Tiff	https://i.imgur.com/wVPCrhC.jpg	教育	\N	https://iyouth.youthhub.tw/main.php	部分免費	\N	教育部青年發展署成立了「iYouth 青年國際圓夢平臺」這個網站給青年。這個網站由政府各相關部會共同建置，彙集了政府部門、大專院校、NGO 相關國際交流資訊，期望讓青年能快速且完整的取得相關資訊，進一步參與國際事務，並建立國際交流的線上社群。	國際參與	臺灣, 國外	大學以上, 國高中	iYouth 青年國際圓夢平台
組織/社群, 課程/活動	Tiff	https://i.imgur.com/a1hXMD7.png	教育	\N	http://jendo.org/jendo/	免費	\N	「振鐸」是振興教育的意思。\n解嚴前，許多人就覺得台灣的教育過度扭曲，需要加以改變，以還給學生一個正常的學習空間。1984年部分師大的校友和在校生即在戒嚴時期禁止教育結社的情況下籌組教育社運團體，並於次年(1985年)6月定名為「振鐸學會」，自行辦理進修活動維持教師自身的進步性。解嚴後，政府開放人民自由結社，於是振鐸由地下走向地上，循人團法於1989.6.11召開成立大會，並向內政部登記成立「中華民國振鐸學會」。\n\n　　學會宗旨為研究改良教育理論與實務，並推廣介紹之(章程第二條)，並以促進教師進修、研究教育問題、改善教育環境為主要任務(章程第五條)。	實驗教育, 自主學習	\N	國小, 國高中, 大學以上	振鐸學會
課程/活動, 組織/社群, 文章/書	\N	https://i.imgur.com/KNsVuYc.png	教育	\N	https://www.facebook.com/VocationalWorkshop	部分免費	\N	直覺職掘是由一群對「生涯探索教育」懷抱熱忱的青年組成的職涯探索團隊，希望可以改變「國中生對於未來缺乏想像」，而不了解該如何為未來做選擇的情形。\n從 2017 年暑假開始，直覺職掘持續為「國中生」舉辦以「職業體驗」為主軸的寒暑假營隊與工作坊。直覺職掘到過雙北、台中、嘉義、台南、新竹、馬祖，目前已辦理20場以上的營隊、50場以上的工作坊，接觸超過1300名國中生，並與60位以上的職人講師共同設計課程、維持合作關係。\n我們相信，藉由體驗各行各業的核心工作內容，能夠使孩子對自我和未來的認識更深刻，同時得到新鮮和成就感，翻轉教室內的學科階級，點亮每個孩子的天賦與學習熱忱！	自主學習, 生涯探索, 體驗教育, 教育創新	台北, 新北, 新竹, 桃園, 台中, 嘉義, 台南, 高雄	國高中, 大學以上	直覺職掘
組織/社群, 文章/書	Tiff	https://i.imgur.com/3VgqeJB.jpg	教育	\N	https://feature.parenting.com.tw/alternativeedu2019	免費	\N	提供實驗教育申請、趨勢、經驗等報導，及全台實驗學校一覽表。\n	民主教育, 終生學習, 實驗教育, 自主學習, 鄉村教育, 教育創新	\N	學齡前, 國小, 國高中, 大學以上	親子天下
組織/社群, 文章/書	Tiff	https://i.imgur.com/aQ1NPVC.png	教育	\N	https://swellplan.github.io/index.html	免費	\N	長浪計畫是一個為了特殊選才建立的網站，可以讓你看到學長姐的分享。	升學資訊	\N	國高中, 大學以上	長浪計畫
組織/社群	Tiff	https://i.imgur.com/BAsq9yN.png	教育	\N	https://www.aupairworld.com/	免費	\N	Au Pair 源自法語，中文為互惠生(或稱安親天使)，參與 Au Pair 計畫的人與寄宿家庭的關係，建立在互惠互利的基礎上一同生活;寄宿 家庭提供生活所需，Au Pair 幫忙照顧小朋友以及簡單家務。	國際參與	\N	國高中, 國小, 大學以上	Au Pair World
課程/活動, 組織/社群	Tiff	https://i.imgur.com/fZohgAj.png	教育	\N	https://www.twdec.org/	免費	\N	我們試圖嘗試新媒體的方式傳播「民主教育」立足台灣放眼世界\n當今科技日新又新，人們彼此間的連結，缺乏深度的哲學思辨與對話。\n台灣民主教育社群，企盼扮演橋樑，搭起每一位對民主社會有想像的村民與村民之間的橋樑。	民主教育, 實驗教育	\N	國小, 國高中, 大學以上	臺灣民主教育社群
組織/社群	小許 	https://i.imgur.com/M9hAWgh.jpg	教育	\N	https://www.facebook.com/SHOKUZiNE/	免費	\N	一個重拾專業、尊重專業的時代\n一本翻轉臺灣技職教育的原創社會企業刊物\n\n透過書寫職人故事、記錄教育及業界現場，《職人》SHOKUZiNE自許成為傳遞夢想的媒體，替孩子點亮未來的閃閃火光。\n目前不定時舉辦生涯探索講座。	生涯探索	\N	國高中, 大學以上	《職人》SHOKUZiNE
課程/活動, 組織/社群	Tiff	https://i.imgur.com/4njQwr7.jpg	教育	\N	https://www.dfctaiwan.org	免費	\N	引導中小學孩童透過自主學習發想，尋找身邊的或是社會上的問 題，並思考改善方法、解決問題的最佳情境，進而實際行動解決問題的挑戰活動。	教學方法, 教師培力	臺灣	大學以上, 國高中, 國小	DFC 全球孩童創意行動挑戰
工具/操作	小許 	https://i.imgur.com/afyf0sc.jpg	教育	\N	https://collego.edu.tw/	免費	\N	大學選才與高中育才輔助系統。自主驅動、適性揚才，找到適合你的學群學類與學系	升學資訊	\N	國高中, 大學以上	collego
課程/活動, 組織/社群	Tiff	https://i.imgur.com/50xTvTJ.jpg	教育	\N	http://www.talab3.tw/	免費	\N	學籍在桃園的自學生都可以參加，有大學的媒合課程等等。\n在網路數位的時代，設立「桃園市自主學習3.0實驗室」，旨在為更落實保障學生學習權及教育選擇權，提供一個無限寬廣之學習場域，讓具有優勢能力的學生，在自主學習的動機驅使下，能夠為自己的學習成長訂定方向，學生的學習從被動的師長「要我學」到主動「我要學」的轉變，享受學習樂趣及成就。計畫主要目的如下：\n\n1.為落實政府制定實驗教育三法之教育實驗與課程創新精神，結合資訊科技建構一個多元專業與自主學習的場域---「桃園市自主學習3.0實驗室」，保障學生學習權及家長教育選擇權。\n2.發展「經典專題講座系列課程」、「開放選修探究性課程」、「媒合至他校旁聽或選修課程服務」與「個人或單位申請使用實驗室設施服務」等，激發學生的潛能，培養學生善用科技、學習系統化、個別化有效的學習方法進而能終身學習，成就其專才或發展偏才的優質學習成效。\n3.提供非學校型態個人與團體實驗者最佳的教育資源，成為「實驗教育課程、教學研究及師資交流點」，提升實驗教育品質。\n4.建立實驗教育的「計畫執行歷程檔案」，適時辦理相關實驗教育研討會，協助各校推展多元實驗教育，增進「桃園市自主學習3.0實驗室」的附加價值。	實驗教育, 自主學習	桃園	國小, 國高中, 大學以上	自主學習3.0實驗室
組織/社群	Tiff	https://i.imgur.com/I3ZPP5G.png	教育	\N	https://www.facebook.com/trini.poly/	免費	\N	解構，與再建構，創造適合自己的教育方式及愛情生活，這是拆框之所以叫拆框的由來，拆框工作坊關注實驗教育相關與開放式關係社群，於2016年8月誕生。	生涯探索	\N	國高中, 大學以上	拆框工作坊
組織/社群	Tiff	https://i.imgur.com/Rhv6ZMU.jpg	教育	\N	https://www.facebook.com/109430360458591	免費	\N	一群對學生、教育、以及許多青年議題有想法與熱情的學生，\n希望推動一個以學生的主體性為本的學習及教育思潮，\n透過辦活動與經營自媒體來分享多元的學習與教育型態，\n並創造橫跨不同教育體制學生間的交流、共學與共創。\n除此之外，\n我們也希望藉由推廣學生參與教育及青年議題的討論，\n帶動一個反思自身所受教育的思辨行動。\n我們相信一個社會體制要變得更好，\n唯有在這個體制中的人（也就是這個體制中的主體）有所自覺與行動才會發生\n一個國家社會的主體是人民，\n而一個國家的教育體制，\n它的主體是學生。	實驗教育, 自主學習	\N	國高中, 大學以上	學習者向前走 Let's Fly high
組織/社群	Tiff	https://i.imgur.com/tUyCrRM.png	教育	\N	https://www.ceec.edu.tw/	免費	\N	可以下載到歷屆學測及指考的歷屆試題和解答。	升學資訊	\N	國高中, 大學以上	大考中心
組織/社群	\N	https://i.imgur.com/dewh22h.png	教育	\N	https://www.facebook.com/TaoXiGongZuoFang/?ref=page_internal	免費	\N	啟發潛能，不放棄每個孩子。\n\n課餘時間幫孩子趕上學習進度，舊課程與新課程的銜接，幫助孩子全方位的學習！針對孩子不同的特性擬定個別教學計畫，讓孩子適性學習。擁有合格特殊教育與普通國小師資證照，豐富的個案教學經驗，陪著孩子找到適合自己的學習方法，讓學習過程不再只有挫折。	實驗教育	台北, 新北	國高中, 大學以上	陶璽特殊教育工作室
課程/活動, 組織/社群	Tiff	https://i.imgur.com/s1RSKuP.png	教育	\N	https://zhanfu.org/index.php	部分免費	\N	展賦教育以人類發展為核心，著重於性格調育、天賦開展，提供每個年齡層不同的教育任務建議。為實踐展賦教育理念，目前有國小至高中自學團、展賦劇團，並提供教育理念合作及講座等服務。	實驗教育	宜蘭, 台北	國高中, 大學以上	財團法人人文展賦教育基金會
組織/社群	Tiff	https://i.imgur.com/TChQHjM.png	教育	\N	https://medium.com/%E9%AD%9A%E6%B0%B4%E6%95%99%E8%82%B2%E5%82%AC%E5%8C%96%E5%8A%91-to-be-educational-catalyst	免費	\N	願景：讓每個人都有能力和權利、成為自己想成為的模樣，共創永續共好的公民社會。\n使命：成為集體智慧和教育創新的智庫與行動庫，為組織和創變者 （Change maker）提供解決問題與學習成長的支持生態系統，以推動社會系統性的進化與變革。	民主教育, 實驗教育, 教育創新	\N	國小, 國高中, 大學以上	魚水教育催化劑
組織/社群, 課程/活動	Tiff	https://i.imgur.com/DZzQGQY.png	教育	\N	https://cooc.tp.edu.tw/	免費	\N	「臺北酷課雲」整合了雲端學習資源及教學工具，透過單一簽入串聯各項數位服務，提供跨平臺整合查詢服務，便利教師及學生檢索及使用各項雲端教育學習資源。此一構想承襲了開放式課程（OpenCourseWare, OCW）精神，本中心《選才電子報》對此也曾有過相關介紹：【線上課程】。「臺北酷課雲」以學生為學習中心，融入數位學習方式培養學生自主學習與推動教學翻轉，除了可供學生在課堂以外的地方學習，對於教師的服務也面面俱到，「酷課學堂」一站式教學整合服務，提供教師在教學備課、課中教學、延伸補救學習情境之各項資源整合，打造教學資源共享的專業社群。	教學方法, 教師培力	\N	學齡前, 國小, 國高中	臺北酷課雲
課程/活動, 組織/社群	Tiff	https://i.imgur.com/NGADuwl.png	教育, 綜合型學習資源	\N	https://www.junyiacademy.org/event/2021-learning-during-covid?fbclid=IwAR2pIS-OFmys9_uYwd9b5J2ZWvrz8HucC5fON_4shaGNMLL618-1ACjwwXs	免費	\N	面對疫情、全台停課，如何讓孩子停課期間學習不受影響？均一聯手學習吧，建立了「一站式的線上學習專區」，密集準備各類師生線上學習資源、線上教學配套。讓孩子防疫期間停課仍能不停學，老師家長也能輕鬆掌握所有線上學習資源。！\n\n以下是我們整理的課程包，同時我們也彙整 PaGamO 等相關平台資源。包含各年級各科課程、主題素養動畫、教師直播研習營與均一新手操作影片。\n\n我們會持續更新頁面裡的資源，提供大家最及時、最完整的學習內容，希望在疫情嚴峻的時刻，成為師生、家長們的堅強後盾！	線上教學, 教材, 教案, 學科類型	\N	國小, 國高中, 大學以上	均一 x 學習吧 ft.PaGamO：線上教學整合平台
組織/社群	Tiff	https://i.imgur.com/UKle55l.jpg	教育	\N	https://www.facebook.com/education.one/	免費	\N	我們是教育部的資訊平台－教育丸子，我們主要將複雜難懂的教育政策及有用重要的教育資訊，透過易懂的圖文、有趣的內容，傳送到你的生活中。\n我們要挑戰你對「教育」無聊又難懂的印象，即使在離開校園後，教育也與生活息息相關，讓我們一起重新建立連結，按讚加入我們👍	教育政策	\N	國小, 國高中, 大學以上	教育丸子
組織/社群, 文章/書	\N	https://i.imgur.com/RibIVIm.jpg	藝術	\N	https://www.mydesy.com/	免費	\N	每天提供兩篇文章，風格多元，適合尋找靈感、提升藝術鑑賞力	排版素材, 設計, 攝影, 建築, 創造力, 藝文資訊, 線上作品集, 繪畫	\N	國小, 國高中, 大學以上	Mydesy
課程/活動, 組織/社群	Tiff	https://i.imgur.com/4O05wQD.jpg	教育	\N	https://www.facebook.com/togetherbang/	免費	\N	我們有著共同的期待，那便是擁有不同背景的我們期望建立並提供「空間、平台、機會、交流」給予不同背景的你們。 \n聚集一切事物，聚集各方的人們。 創造交集，建立交流。  \n人們參與某項事物勢必擁有其含義。 一場簡單的聚會必能使人有所獲得。 \n一些故事、一些想法、一些機會，碰撞後產生的火花，代表著彼此連結的記號。  \n深信世界之大，而人與人之間的能量必定有所留下。  	實驗教育, 自主學習	台北	國高中, 大學以上	聚起來！
課程/活動, 組織/社群	Tiff	https://i.imgur.com/YtYt0O6.png	教育	\N	https://skyline.tw	免費	\N	國際交流及人才發展的資訊整合平台，Skyline 致力消除各項國際活動訊息不流通的問題，利用免費且多元的平台讓青年即時獲取資訊。	國際參與	臺灣, 國外	國高中, 大學以上	Skyline國際圓夢平台
課程/活動, 組織/社群	小許 	https://www.aade.org.tw/website/wp-content/themes/twentyseventeen/img/logo.svg?v=1	教育	\N	https://www.aade.org.tw/	免費	\N	由教育部105年至108年美感與設計課程創新計畫總計畫團隊設計，目前已開始第二期計畫(108年至110年)。致力於美感教育的推動、教師增能培力、教案內容分享。新計劃將在過往累積的資源上，再加上跨領域。	自主學習, 教學方法, 教育創新	臺灣	國高中, 大學以上	美感教育
組織/社群, 課程/活動	智輝 	https://i.imgur.com/JLmN347.png	教育	\N	http://map.alearn.org.tw/#/	免費	\N	自主學習促進會唐宗浩老師創立，除了針對自學相關問題的QA外，也透過學習者及教育工作者自主申請的方式，彙整各地區學習資源的資料庫。	自主學習, 教育創新, 升學資訊, 實驗教育, 組課共學	\N	國小, 國高中, 大學以上	自學地圖
組織/社群, 文章/書	Tiff	https://i.imgur.com/Xy29V0U.png	教育	\N	http://ateei-org.blogspot.com/	免費	\N	以凝聚參與臺灣實驗教育者之共識、加強實驗教育成員之間的合作、維護實驗教育參與者之權益、改善實驗教育外在環境與促進整體教育之多元、民主及自由為宗旨。	實驗教育	\N	學齡前, 國小, 國高中, 大學以上	臺灣實驗教育聯盟
課程/活動, 組織/社群	玠堯 	https://i.imgur.com/Wyxo63f.jpg	教育	\N	https://www.goddard.edu/?gclid=CjwKCAjwx9_4BRAHEiwApAt0zq5lvbWBzev_MVAHSIcOLy0h5u6pyyJTo7NFHIMqSltI69iPJBlTjxoCcowQAvD_BwE	需付費	\N	美國Goddard College 唯一所進步主義/民主教育大學，提供學士與碩士學位（包含個人化學位），以及不同學程。此學校以建構民主的社會為目標，將學校塑造成一個民主的生活空間與社群，並以學習者為中心，透過跨學科、整合學科、全人和個人化的教學法，引導學生以「豐富知識（Knowing）、形塑自我（Being）、社會實踐（Doing）」為學習基本原則，以興趣導向、問題導向等方式設計自身的學習計畫，並在學習過程中結合學術研究、實踐經驗、關注個人身心狀態發展、對話與反思，做出為自身與世界帶來改變的行動。	民主教育, 實驗教育, 國外求學	國外	大學以上	Goddard College
組織/社群	Tiff	https://i.imgur.com/cNShWAy.png	教育	\N	https://www.educationrevolution.org/store/	免費	\N	早在蘇聯瓦解前，AERO就曾深入鐵幕，從事地下活動成立民主學校；\n\n在沒有政府支持下，協助北美原住民族成立自有文化傳統的另類學校；\n\n在加勒比海維京群島透過另類教育師培輔導風雨飄搖的公立學校轉型；\n\n在金融危機時集資拯救烏克蘭、匈牙利、紐約、俄羅斯多所民主學校度過難關；\n\n出版《另類教育手冊（Alternative Education Handbook，1996）》，記載了另類教育發展的重要資訊，更促使另類教育行動邁向整合與團結；\n\n持續培育學習者中心辦學與教育工作者，協助成立的學校超過一百所；\n\n二十餘年持續發行《教育革命》雜誌與電子報，提供資訊封閉、資源稀少的地方卻盼望不同教育的人們更多可能......\n\n這個神秘組織叫做「Alternative Education Resources Organization（國際另類教育資源組織，簡稱AERO）」是世界現存歷史最悠久、影響力最廣泛的學習者中心教育與民主教育平台之一，致力於另類教育資訊／資源整合、倡議、教育工作者培力與辦學輔導等任務。\n\nAERO每年都會舉辦一場高手雲集的教育論壇，讓從事另類教育的研究者、工作者、家長、學生切磋「武藝」、互相增能。	民主教育, 自主學習, 實驗教育, 教師培力, 教育創新, 國際參與	\N	國小, 國高中, 大學以上	AERO
組織/社群	小許 	https://i.imgur.com/oZqO7N1.jpg	教育	\N	https://www.facebook.com/citywanderer/	免費	\N	流浪挑戰賽由國際城市浪人育成協會主辦，透過獨家的教育體驗式設計，影響超過10,000名年輕人「跨出舒適圈、探索自我、追求社會使命感」。\n1.鼓勵人們翹掉不滿意的生活，把城市當成教室，找到想花一輩子追尋的熱情，成為讓別人快樂的存在。\n2.流浪挑戰賽，用最有趣的方式探索自我、參與社會。\n3.提供工作坊、演講、課程、營隊設計	生涯探索	\N	大學以上, 國高中	城市浪人
組織/社群, 文章/書	Tiff	https://i.imgur.com/GmNrDDw.png	教育	\N	https://hundred.org/en	免費	\N	芬蘭教育創新組織。HundrED.Org是一個非營利組織，尋求並分享K12教育中鼓舞人心的創新。\n教育的目的是幫助每個孩子茁壯成長，無論生活中發生什麼。\n世界的變化比學校更快，但世界各地的教育仍在發生著美好的事情。我們稱它們為教育創新：在K-12教育中具有可擴展性和影響力的實踐、項目或組織。世界上有很多這樣的事情，它們正在幫助孩子們茁壯成長，但要讓它們傳播開來卻很困難。\n我們憧憬著這樣一個未來：每個孩子都能獲得盡可能好的教育創新，為所有人提供優質教育。	教育創新	\N	國高中, 大學以上	HundrED
課程/活動, 組織/社群	Tiff	https://i.imgur.com/Yl9sw77.jpg	教育	\N	https://progressiveeducationnetwork.org/	免費	\N	願景：\nPEN認為教育的目的超越了為大學或職業做準備。學校在日益多樣化的民主中培育公民。在教育理論，實踐，政策和政治的複雜性中，我們提倡21世紀的進步主義教育願景：\n\n1.讓學生積極參與他們的學習和社會活動\n2.支持教師作為有經驗的從業者的聲音和作為終身學習者的成長\n3.在公共和私營部門的先進教育者之間建立團結\n4.推進關於學校在民主社會中的作用的批判性對話\n5.從進步的教育角度回應當代問題\n6.歡迎家庭和社區成為兒童學習的伙伴\n7.在我們的學校和社會中促進多樣性，公平和正義\n8.鼓勵進步的教育工作者在指導我們社會的教育視野中發揮積極作用。	民主教育, 實驗教育	國外	大學以上	Progressive Education Network
課程/活動, 組織/社群, 文章/書	Tiff	https://i.imgur.com/7ecOAvH.png	教育	\N	http://www.twinoaks-edu.com	免費	\N	為學生打開一扇「雙向」的窗，設計國際交流學習的體驗，創造「動手做」的學習經驗，經過「體驗」、「衝擊」、「反思」、「內化」，讓學生心中的橡果發芽。	國際參與	臺灣, 國外	國高中, 大學以上	雙橡海外教育
組織/社群	Tiff	https://i.imgur.com/4U9a5gZ.png	教育	\N	https://www.facebook.com/groups/542712252536869/	免費	\N	 這個社群主要是為了中學自學生而設立，加入的條件為參與過活動的人，但不 限定自學生。以及非家長。這個社團的創立是希望能把「發現同伴」的那份感 動繼續延續下去。透過持續舉辦交流會，期待讓青少年的社群連結更加穩固、\n 壯大。	自主學習, 教學方法, 組課共學, 實驗教育	\N	國高中, 大學以上, 國小	國高中自學生社群
組織/社群	Tiff	https://i.imgur.com/MW9CEpp.jpg	教育	\N	https://teec.nccu.edu.tw/resources2_detail/50.htm	免費	\N	由台灣實驗教育推動中心彙整而成	自主學習, 實驗教育	\N	學齡前, 國小, 國高中, 大學以上	自學常用學習資源
組織/社群	Tiff	https://i.imgur.com/tsLy0ae.png	教育	\N	https://www.facebook.com/draft.lifestory/	免費	\N	Draft 是致力於透過設計人生方法論，協助人們發展熱情、個人獨特故事與領導力的非營利組織。	生涯探索	\N	國高中, 大學以上	Draft 下一張
組織/社群	Tiff	https://i.imgur.com/6gGs6Rk.png	教育	\N	https://www.facebook.com/groups/2518969895021433	免費	\N	這個社團的成立是為了應對世界每日都在經歷的COVID-19疫情。這個社團有兩個目標：\n1. 支持所有民主學校開始在網路上辦學。\n2. 為來自世界各地的民主學校學生創造一個交流平台。\n\nThis group was formed as a response to the corona epidemic that the world is going through these daysThis group has two goals:\n1. Support all Democratic schools to start running online\n2. Create a platform for meetings between students attending democratic schools from all over the world.\n	民主教育, 實驗教育	\N	大學以上, 國高中	OnLine Democratic Schools Network
組織/社群	小許 	https://i.imgur.com/WbcsFGd.jpg	教育	\N	https://www.facebook.com/idream99/	免費	\N	成立於2010年的非營利組織，以社工、心理專業，透過體驗教育、心理輔導、生涯規劃為核心來服務青年，並首創30天出走海外團體課程，以無法使用金錢的方式走過歐亞等國，鼓舞青年走出生命的框框，看見世界的美好。	行動學習, 生涯探索	\N	國小, 國高中, 大學以上	夢想騎士
組織/社群	智輝 	https://i.imgur.com/nUJsh5U.png	教育	\N	 https://www.facebook.com/groups/learn.at.home/	免費	\N	這個社團是給那些「在家教小孩」(或是有興趣這樣做)的人;而且你某種程 度上與台灣有些連結，例如來自台灣，或是居住在台灣。無論你來自哪裡或你 住在台灣多久，只要你是「在家自學」，或是對「在家自學」有興趣─這裡就 是適合你的地方，讓你分享你經驗、讓你開心的事情、以及困擾的問題。如果 你是「在家自學」學生，請加入其他「在家自學」小孩/青年的社團。這個社 團是給家長跟老師的。	自主學習, 組課共學, 實驗教育	\N	國小, 國高中, 大學以上	Learn@Home in Taiwan
組織/社群, 課程/活動	Tiff	https://i.imgur.com/gZ3MR1X.png	教育	\N	https://sites.google.com/view/autoalearn	部分免費	\N	從自主學習的理念與實踐推廣、台灣最大自學互助社群（在家自學社群）與網路平台（自學地圖、自學2.0、自由數學），實驗教育的制度與落實等，自主學習促進會從2001年成立至今，一路與台灣體制外教育、實驗教育脈動共振。\n與他律到自主的過程，一般會經過解放散漫、自我中心、眼高手低和自主成熟這四個階段。(詳見學習自律四階段)\n在解放散漫期需要安全感和健康的生活節奏、自我中心期需要明確界限、眼高手低期需要踏實的累積與創作。\n這些需要成人有意識的提點和支持。\n因此，本會致力於促進自主學習與教育的土壤。	自主學習, 實驗教育	\N	國小, 國高中, 大學以上	自主學習促進會
組織/社群	\N	https://i.imgur.com/5c1bsw6.jpg	教育	\N	https://www.shokuzine.com	免費	\N	《職人》要用真實的需求來改變學校與教育\n\n臺灣擁有過多的大學生卻大量缺乏技職專業人才，擁有許多珍貴技術卻無人接手。當社會對人生的選擇是依據考試能力來進行區分，孩子的興趣很容易被擱置在分數排名之後。文憑掛帥的社會現象則使技職教育開始走向升學主義，技術的深耕更直接受影響，環環相扣的結構性問題難以改善！\n\n《職人》從最基本的認識開始書寫，用一個個真實的故事反映臺灣的勞動力需求與教育現場，希望解開更多人心中的刻板印象，用尊重與多元的態度，認識是什麼樣的人用他們的工作及專業，撐起我們所生活的社會。這是對於全臺灣人都重要的一本刊物！	生涯探索	\N	國高中, 大學以上	職人 Shoukuzine 生涯成長故事平台
課程/活動, 組織/社群	Tiff	https://i.imgur.com/DeNGNaX.jpg	教育	\N	https://nccu.huaray.com.tw/tw/	免費	\N	實驗教育推動中心是國立政治大學教育學系受教育部委託而成立的研究中心，成立宗旨在於，依據「實驗教育三法」（學校型態實驗教育實施條例、非學校型態實驗教育實施條例、公立國民小學及國民中學委託私人辦理條例），推動實驗教育的發展，以促進臺灣的教育改革與創新。\n\n政大實驗教育推動中心（簡稱：中心）成立至今，開展多項工作與計畫。2015年開始以偏鄉學校型態實驗教育計畫的方式，舉辦偏鄉實驗教育學校師資培訓課程、實驗教育論壇、實驗教育審議委員共識營。2016年開始進行實驗教育培力課程，提供在職教師實驗教育與混齡教學的課程與教學方法之進修學習，同時持續組織學者專家的訪視來輔導與陪伴混齡實驗教育試點學校。另外，中心也舉辦地方實驗教育行政人員或承辦人員共識營，為相關人員提供實驗教育的教育培訓。另一方面，中心開始與國外混齡教育相關學者與單位進行交流與參訪，包括前往日本、奧地利等地。2017年開始，中心開始編製實驗教育相關手冊，提供實驗教育承辦人員、審議委員、自學生、家長與學校教師關於實驗教育計畫與審議的參考。同時，中心也開始建立實驗教育人才資料庫，邀請國外學者來台交流經驗，並通過舉辦國際研討會來促進臺灣經驗與國際間的學術交流。	民主教育, 實驗教育, 自主學習, 教師培力	臺灣	國高中, 大學以上	臺灣實驗教育推動中心
組織/社群, 文章/書, 課程/活動	Tiff	https://i.imgur.com/X42AoGw.jpg	教育	\N	https://groupbe.com.tw/	免費	\N	可能製造所以「Objective fulfillment 目標導向策略」創造跨領域體驗，透過主題課程、師資培訓、創造力培訓等等，幫助使用者透過體驗探索更多的可能性。	自主學習	\N	國小, 國高中, 大學以上	可能製造所
課程/活動	Tiff	https://i.imgur.com/pC9JyCd.jpg	教育	\N	https://seemoreeducation.weebly.com/	免費	\N	透過不同的職人、達人分享與互動，引導孩子們 SEE MORE，看見更多可能，對未來有更多的想像空間。	生涯探索	臺灣	國小, 國高中, 大學以上	See more 教育
組織/社群	Tiff	https://i.imgur.com/rE6dat0.png	教育	\N	https://www.facebook.com/refunstudio/	免費	\N	培養孩子創新思維及解決問題的能力來面對未來所有挑戰，回歸到本質去看最真實的自己，並保有不斷嘗試的心去探索自己的樂趣。	創客教育	\N	大學以上, 國高中	RE-FUN 玩轉教育
組織/社群, 文章/書	小許 	https://i.imgur.com/Hkc6bUv.png	教育	\N	https://ioh.tw/	免費	\N	IOH 邀請在世界各地的同學，當台灣同學的耳與目，以錄製演講的方式，分享他們的求學與工作經驗。求學經驗的講座，各地同學可以分享他們就讀學校、科系、課程的特色、就讀的經驗、申請的過程、獎學金資源以及回答同學的問題。讓台灣有興趣海外留學、沒有概念想要多了解、或是只是想知道海外教學方式的同學，有一個直接的管道，可以去接觸海外台灣同學第一手的所見所得。一方面可以直接幫助要申請準備出國的同學，一方面也可以讓還沒有準備、或是低年級的同學了解，在他們心中種下一個種子，給予他們時間發芽茁壯。IOH 也讓國內教授與教學單位有機會，可以廣泛地瞭解國外相同課程教授方式，並從中獲得課程規劃或教學上的靈感與依據。IOH 也使國內家長可以藉由了解世界各地的教學系統與資源以及各科系未來展望，讓他們對小孩的未來有更多元的想像。	升學資訊	\N	國高中, 大學以上	IOH 開放個人經驗平台
組織/社群, 課程/活動	Tiff	https://i.imgur.com/rgPZcJW.jpg	教育	\N	https://www.beaversophy.com/	部分免費	\N	「翻滾海貍」由致力於教育轉型的國文老師組成，以「遊戲教育」為形式、「啟發教育」為內涵、「價值觀」的涵養為教育本質，以「playful x useful x perceivable」為核心設計相關教學資源，望能成為教育工作者溫柔的後盾。\n\n重視價值啟發、設計遊戲課程、製作協作課堂桌遊、舉辦增能工作坊、籌備線上跨校共備讀書會、線上遊戲平台系統規劃⋯⋯舉凡教學現場所需，均全力協助教育夥伴，不單在教室外引領學習，更想在體制中帶動改變，期許能共同實踐理想的課堂風景。\n\n學習不限年紀，課堂不拘師生，邀請您一起加入海貍老師的翻滾教室！	民主教育, 教學方法, 教師培力, 教育創新	\N	大學以上, 國高中	翻滾海貍工作室
課程/活動, 組織/社群	Tiff	https://i.imgur.com/YavDwAk.png	教育	\N	https://www.idenetwork.org/	免費	\N	IDEN 是 「 國際民主教育網路 」 , 由全世界的學校 , 組織和個人組成 , 他們支持以下信念 :\n* 尊重並信任兒童\n* 孩童和成人同等重要\n* 責任分擔\n* 能夠自由選擇活動\n* 孩童和在學校服務者都擁有民主的管理權 , 無須涉及任何形式的假設性崇高指示或是體系\nIDEN 的成員都是自願參加的 。 他們的姓名和住址極少出現在網站資料 , 每年收到兩到三封信 , 信的內容主要是報導最近和未來有關 「 國際民主教育論壇(IDEC) 」 的資訊。\n\n我們可以從幾個不同的觀點來看 IDEC 成立的目的 : 有些人認為可以藉這個機會在一個互相支援的氣氛下討論共同的問題 ; 有些人希望藉此邀請可能改變觀念的人或是吸引公眾的注意來推廣民主教育的理念 。 每次會議的目的是由主辦組織來決定 。	民主教育, 實驗教育, 國際參與	國外	大學以上, 國小, 國高中	International Democratic Education Network
課程/活動, 組織/社群	小許 	https://i.imgur.com/aGVcJsd.jpg	教育	\N	https://www.rockleadership.org/	部分免費	\N	磐石的服務學習強調學習與服務兩者並重。培養華人青年成為具有國際觀、跨文化服務態度、公民意識，及關心世代議題、擁有理想、具備實踐力的世界公民，預備華人青年承接影響這個世代的重要角色。磐石的服務學習課程以體驗教育為核心、海外社區需求作為學習平台，透過服務的實際行動、有目的的學習和引導反思的運用，促成參與者的改變。\n\n協會成立以來從不前往一次性的服務點或進行一次性的工作。長期或短期的志工都是參與在長期社區轉化長河中的一點，匯聚成為一幅有長遠在地果效的美麗圖畫，為之喝采計劃。針對個別海外貧困社區，發展出專屬的社區轉化計畫模組，透過物質、靈性、心理及社會方面，改善當地經濟、教育、衛生或公共衛生等社區狀況。磐石於服務據點啟動社會及教育項目的同時，同步注資啟動經濟項目，一方面創造當地本土就業，讓青壯年可以留家發展社區，另一方面帶來收入，長遠成為社會及教育項目的經濟來源，使他們能夠自給自足，以當地樣貌獨立發展。	自主學習, 教學方法, 教師培力	臺灣	國小, 國高中, 大學以上	華人磐石領袖協會
課程/活動, 組織/社群	Tiff	https://i.imgur.com/ekzqSts.png	教育	\N	https://www.facebook.com/RethinkTaiwan2027	免費	\N	迴響計畫是一個以問題為起點，以行動為燃料，以更好的社會為目標的「行動孵化計畫」！計畫透過四個月的階段性行動框架與多方資源整合，協助臺灣青年從發現問題開始，採取最簡單可行的行動，並強調不斷從中反思和學習，做為後續行動的基礎，用最腳踏實地的方式為臺灣社會帶來影響。	教育創新, 生涯探索	臺灣	國高中, 大學以上	青年迴響計畫
組織/社群	Tiff	https://i.imgur.com/dGLzUCW.png	教育	\N	https://www.instagram.com/learnwithemily/?igshid=19jdii1bxrvhq	免費	\N	Instagram帳號。\nEmily⠀🇩🇪🇺🇲⠀熱愛學習的19歲女孩，在這裡分享我的學習經驗，以及德國美國留學的故事~	國外求學, 自主學習	\N	國高中, 大學以上	learnwithemily
組織/社群, 課程/活動	Tiff	https://i.imgur.com/G3VDf9I.jpg	教育	\N	http://www.shepherdkit.com.tw	部分免費	\N	教育玩具與遊戲品牌，以臺灣原創、臺灣製造的高品質產品，提供孩子全新的遊戲與學習體驗。提供創作型學習素材組，讓孩子藉由「動手做」進行學習。	桌遊, 遊戲教學	\N	學齡前, 國小, 國高中, 大學以上	綿羊犬百寶箱
組織/社群, 文章/書, 課程/活動	Tiff	https://i.imgur.com/pZBzd70.png	教育	\N	https://www.sociocracyforall.org/enkindle-casestudy/?fbclid=IwAR0L693-VER8ZauvR7fEjQLZYK77ZowPS-Th4XgKNW_Ve4OC9sZcbakVJIU	免費	\N	Enkindle鄉村學校是澳大利亞北昆士蘭州的第一所獨立民主學校。學校本質上是平等主義者，建立在民主原則的基礎上，堅信受決定影響的每個人都應在該決定中有發言權。學生的決策是學校生活的中心，為學生的發展提供了真正的選擇。\n\n以遊戲為基礎的學習，動手實踐以及靈活的日程安排和大量的戶外活動，為學生提供了發展彼此之間以及與成年人之間相互尊重的關係的機會。學生學會承擔起基於同意的決策的責任，熟練地解決衝突，並作為一個參與並聯繫在一起的學習社區的正式成員參加。	民主教育, 實驗教育, 鄉村教育	\N	國高中, 大學以上	Enkindle Village School
課程/活動, 組織/社群	Tiff	https://i.imgur.com/QrlA88O.jpg	教育	\N	https://www.asiaaee.org/	需付費	\N	亞洲體驗教育學會致力於體驗教育產學長期交流與發展，並成為亞洲體驗教育知識、經驗及人才的輸出平台。\n以體驗教育理念為核心，舉辦培訓課程並建立專業制度；辦理國內外研討會以促進交流；進行學術研究探討與出版刊物；鼓勵教育創新，與產業連結；參加國際會議論壇與世界接軌。	教學方法, 體驗教育	臺灣	大學以上, 國高中	亞洲體驗教育學會
課程/活動, 組織/社群	Tiff	https://i.imgur.com/CUZc4vg.jpg	教育	\N	https://hef.org.tw/	部分免費	\N	教育不是如那句俗語所說的：讓貓學會補鼠，讓狗學會看門﹔相反的，教育使人跳脫命運的掌控，成為一個獨立自主的人，也就是他真實的自己！\n\n因為這樣，教育必須：\n\n把學生當成一個人來看待，重視他的思想和感受， 而不能只在意外在\n的表現﹔所以不宜依賴「以改變行為為目的」的獎懲。\n順著學生既有的感受和思路走，協助學生內省、澄清、批判與思辯，\n以建立新的觀點，形成新的內在﹔所以以記憶或服從為目的的「單向\n灌輸」，無論在知識上或在人格養成上，都是不宜的。\n講求「教的方法」，以啟發取代訓練，以對話取代講授﹔所以只要求\n學生成績，不重視教師教法的作風，是不對的。\n出自「真誠的心」，以學生的發展與成長為唯一的考量，並全心培養\n學生「愛」的能力﹔所以功利主義在教育中是不應允許的。\n給予充分的時間，無論課程安排，或學習成就之檢測，都應該給學生\n留下「餘地」，並信任人的內在力量﹔所以強制手段在教育中是不合\n理的。\n有了這樣的教育，就培養出有思想、有能力、並能愛的人﹔\n這樣的人，就可以聯合起來，改變我們的存在，以及我們所在的台灣。\n\n所以，教育要使人成為他自己﹔而改變，必須先從改變教育開始！\n\n從1989年正式成立至今，人本教育基金會致力於結合家庭、學校、社會的\n力量，協助教育當局革除教育積弊，共同推動以人為本的教育。	實驗教育, 親子教養, 教師培力, 課後輔導	台北	國小, 國高中, 大學以上	財團法人人本教育文教基金會
組織/社群	芳綾 	https://i.imgur.com/q0yQOdo.jpg	教育	\N	https://www.dale.nthu.edu.tw/	免費	\N	專門為特殊教育孩童設計的網站，裡面有許多特殊教育的介紹與班級經營之文章	教育理論	\N	國高中, 大學以上	有愛無礙
組織/社群	智輝 	https://i.imgur.com/dsiuj0g.png	教育	\N	https://www.facebook.com/groups/homeschooltw/	免費	\N	該社團發文採審核制。自學相關的理念、團體、課程、申請、困擾、活動、教 材、教法、政策、心得、感想、團購......等學習上會出現的議題都可以分享。	自主學習, 教學方法, 組課共學, 實驗教育	\N	學齡前, 國小, 國高中, 大學以上	在家自學社群
組織/社群, 課程/活動	Tiff	https://i.imgur.com/vFJMDFl.png	教育	\N	https://www.facebook.com/FAPA2015/	免費	\N	本會致力於全球性另類教育理論與實際之學術研究與推展，\n裨益我國教育任務之變異與創化，進而促進教育文化之革新與演化。\n\n我們的任務如下：\n一、推展全球性另類教育之學術研究。\n二、關懷發展本土另類教育之實踐。\n三、舉辦另類教育相關學術研討活動。\n四、推動有益另類教育發展相關法制工作。\n五、參與國際性另類教育相關學術活動。\n六、發行另類教育相關學術刊物。	實驗教育, 教育政策	\N	國小, 國高中, 大學以上	台灣另類暨實驗教育學會
組織/社群	Tiff	https://i.imgur.com/hOS91aV.jpg	教育	\N	https://www.facebook.com/yaacovhechtauthor/	免費	\N	Yaacov Hecht，世界教育創新聯盟主席、以色列六任教育部首席教育創新顧問，被譽為世界教育創新之父、民主教育之父。為國際民主教育論壇（IDEC）發起人之一，《民主教育（Democratic Education: A Beginning of a Story）》一書的作者。	民主教育, 實驗教育	\N	國高中, 大學以上	Yaacov Hecht
課程/活動, 組織/社群	Tiff	https://i.imgur.com/3xbCObt.png	教育	\N	https://magic-bean-school.webnode.tw/	免費	\N	魔豆學院，位在南機場樂活園地，隸屬於社團法人臺北市臻佶祥社會服務協會，是由忠勤里里長方荷生所設立的「國中課後班」，目的在支持社區裡一些符合社會福利條件的家庭（低收入戶、單親、新住民之子等...）陪伴這些家庭裡的青少年共同成長。\n學員主要來自鄰近社區的古亭國中（大理國中、萬華國中也在附近），學院免學費，學生下課後來到樂活園地共食、共學，經費都來自於里長募款，才得以營運下去。（募款請參考）\n\n有別於以提升「學業成就」為目標的補習班，以及協助學生「完成課業」的安親班，我們南機場魔豆學院，是以「人的發展」為核心的課後學習班。在這裡，我們嘗試去尊重並欣賞每一個學生的獨特性，陪著學生認識自己、了解他人，成為有自信、能自立，有能力替自己人生負責的「成人」。	實驗教育, 課後輔導	台北	國小, 國高中, 大學以上	魔豆學院
提案/競賽, 組織/社群	Tiff	https://i.imgur.com/ZngjzQ3.jpg	教育	\N	http://ruro.tw/	免費	\N	媒合偏鄉學校與社會大眾的協力募集平台。\n「鹿樂」取自音譯rural，原意為偏鄉。\n近年來，偏鄉教育議題浮上檯面，常見小校與老師滿腹理想、兼具創意與行動力，卻得孤軍奮戰、默默耕耘； 也發現許多民眾與企業懷著熱情和資源，卻找不到對象付出、不知如何行動。\n我們不禁想問，雙方搭橋溝通的可能性在哪裡？於是2015年，政治大學創新與創造力研究中心在教育部的支援下， 成立鹿樂平台。\n鹿樂透過實地走訪，將記錄下來的故事作為一封封邀請函；再藉由網路傳播，協助偏鄉小校募集到所需的人事物， 想出力的人也能實踐對教育的熱忱。 而偏鄉也不意味著匱乏，當地以豐富的自然生態和人文資產，款待到來的人們。於是， 我們共創一個又一個美好的故事。\n我們期許，繼續透過鹿樂，讓偏鄉不遠。	鄉村教育, 教育創新	臺灣	大學以上, 國小, 國高中	鹿樂
組織/社群	Tiff	https://i.imgur.com/6tX1eDe.png	教育	\N	https://www.facebook.com/GoodDayFTheSchool/	免費	\N	由中部自學生創立，旨在讓中部實驗教育更蓬勃。辦教育講座、讓資源串聯、提供自學諮詢;上學好日子主張「出家自學」，並倡議「自學不是特權，是基本人權」。	生涯探索	\N	國高中, 大學以上	上學好日子
組織/社群	Tiff	https://i.imgur.com/zVZEdXL.jpg	教育	\N	https://www.facebook.com/TDUtokyo/	免費	\N	日本民主教育大學雫穿大学由一群於 Shure University 畢業的師生所創立。以學生為中心，提供學生不同的教育選擇權。透過大量的人際刺激，多元豐富的顧問群，共創安心的共學關係，引導學生更深入探問「我是誰」，並以自我理解為核心，設計及主導自己的學習，達到「我的人生我開創」的目標。而在營運的各方面，雫穿大学強調對自己與他人的尊重，故學生皆可參與每個月兩次的營運會議，共同走向「我的教育我開創」的民主教育藍圖。而目前為了將民主教育思潮帶入日本職場，畢業生自行創業「株式会社創造集団 440Hz」，該公司為社會企業，以電影製作、視覺設計為主要服務，願景為改變社會，讓每個人能可以用自己的方式與他人共存。	民主教育, 實驗教育	\N	國高中, 大學以上	TDU - 雫穿大学
組織/社群	\N	https://i.imgur.com/BnqVcYl.png	教育	\N	https://www.newhere.tw/	免費	\N	網站提供許多大學學長姊的經驗分享以及大學生如何學習管理與生活。	生涯探索, 大學生活, 人際互動, 自主學習	\N	國高中, 大學以上	大學新生資訊站
組織/社群	小許 	https://i.imgur.com/S9opDUl.png	教育	\N	https://www.facebook.com/ShiningEyesProject/	免費	\N	我們想打亂很多人的人生規劃。\n如果一個人對未來有不少設定卻不期不待，那這樣的計畫是可以打亂的吧？\n「自我探索可以是很漫長的路。」 — 我們想讓過程變得有效又滿滿驚喜。「讓生活卡住的，是那些我們想做但一直沒做的事」— 我們協助人實際動手執行自己想做的project。\n\n我們是微亮計畫，協助畢業十年內的上班族生活再設計，生涯再探索，建立一個認真又可以很鬧的社群。長遠來說，我們希望協助一大堆很棒的個人計畫誕生，未來當你回頭看，發現自己有很多精彩的故事。\n大部分的我們都曾經面臨不知道自己接下來想做什麼、能做什麼的困境。於是微亮計畫從2014年開始運用教練技巧，陪伴許多人開啟新的嘗試。在2017年發展出「微亮計畫工作坊」，一次協助一小組人在兩天內想到未來的新可能，而且攤開具體的步驟。\n目前提供的服務有：\n> 一對一教練\n> 微亮計畫工作坊 \n> 各種一個晚上主題式活動 \n搭配上每週的project night / co-working nights，有效克服拖延症，讓在乎的事每週都有些進展。	生涯探索	\N	大學以上, 國高中	微亮計畫
課程/活動	Tiff	https://i.imgur.com/qFVX9nQ.png	教育	\N	http://urclass.net/AL/	需付費	\N	為振鐸學會創立，提供學習者發起組課，邀請其他學習者共學。	實驗教育, 自主學習, 組課共學	國外	國小, 國高中	自主學習共享平台
組織/社群	小許 	https://i.imgur.com/AjlVavu.png	教育	\N	http://pdc3.ntct.edu.tw/bin/home.php	免費	\N	教育部在98年度推出的「振興經濟擴大公共建設投資-資訊服務業擴大公共建設」方案中，研擬了「建置中小學優質化均等數位教育環境計畫」，計畫中揭櫫「多功能e化專科教室」、「多功能e化數位教室」、「新一代台灣學術網路環境NGN」的補助方案，並明定全國各級國民小學應達成的建置目標。經過各縣市政府的積極規劃、採購，目前全國各國中小的資訊教育環境堪稱健全，但在硬體建設齊備的狀況下，教師如何發揮設備的功能讓政府的投資發揮最大的效益變成了當務之要。\n \n這個方案的實施，在全台的國中小學建置「e化數位教室」與「e化專科教室」，期望在大量電子教學器材、媒體進入校園狀況下，健全各國中小學的資訊教育環境，更能刺激教師吸收新知，改變教學模式，提昇教學品質。在過去的兩三年來，究竟教育部這項投資發揮多少效益不得而知，但在網際網路發達的地球村，利用資訊科技發展學習的模式已是一種趨勢，身為一個現代的教師不可忽略這個未來性。\n \n「教育噗浪客」這個自發性的學習社群組織在這樣的情況下於焉誕生，一群對資訊(融入)教學抱有相當熱忱的教師們透過「噗浪(Plurk)」這個新興社群平台討論交流、分享心得，並在教育部及南投縣政府的經費協助下辦了第一屆的「教育噗浪客年會」；透過年會許多優秀的教師們藉由這個平台發表他們在資訊(融入)教學方面的研究，獲得與會教師熱烈的迴響，並期望能持續辦理類似的研習。\n「教育噗浪客」透過WEB 2.0 特性發起的網路社群，從虛擬而實體，已連續辦理兩屆的「教育噗浪客年會」。年會跳脫一般教師研習的模式，內容多樣，議題實用，期望能在一成不變得課程結構下求新求變，發展以學生為中心的教學模式，以培育德、智、體、群、美五育均衡的數位公民。年會亦尋求各種社會資源，提供教師吸取第一線新知的管道，讓教師能善用資訊科技提昇教學品質，學生能應用資訊科技提昇學習與生活能力，以打造優質e化校園，全面提升教育競爭力。	自主學習, 教學方法, 教師培力, 教育創新	臺灣	大學以上, 國高中	教育噗浪客
組織/社群	Tiff	https://i.imgur.com/G6hLXZj.png	教育	\N	https://www.facebook.com/groups/481216725282972/	免費	\N	歡迎台南高雄屏東的家庭加入這個豔陽下的南台灣自學團!不論是自學前輩， 或是自學新手，甚至是還在觀望思考猶豫中的探路人，都歡迎您來這個社團和 大家一起交流討論，交換自學心得和資訊。	自主學習, 組課共學, 實驗教育	\N	學齡前, 國小, 國高中, 大學以上	homeschool under the sun 南台灣自學團
組織/社群	\N	https://i.imgur.com/s9aL7SC.jpg	教育	\N	https://museum-start.jp	免費	\N	以教師與研究人員合作共創的博物館自導式課程的東京都教育平台\n雖然是以日本東京場館為主，但固定有學生參與自導課程作品，以及日本的教育與博物館合作案例，值得學習。	自主學習, 終生學習, 國際參與	\N	國小, 國高中, 大學以上	museum-start
課程/活動, 組織/社群, 文章/書	小許 	https://i.imgur.com/Hx2MX4d.png	教育	\N	https://eball.tw/	免費	\N	超越基金會在做什麼？\n\n我們關注教育議題，初期以「超越達人」公益計畫與家外安置機構和育幼院合作，邀請達人們分享白手起家、刻苦奮鬥的生命史，同時安排職場體驗，讓孩子們了解各行各業的甘苦與專業技能基礎，藉此激勵奮發的勇氣並拓展視野。執行一年後，我們從第一線教育現場發掘到最現實的問題：「職涯資訊不足是台灣目前大部分年輕一代普遍面臨的困境」。我們深切感受到教育紮根的急迫性，但是僅針對特定機構的規模太小、能夠影響的人數受限，所以我們調整腳步，擴大與全國各級中學合作，舉辦全校性的講座活動。推動至今，超越基金會跑遍全台，前進超過百所國、高中、高職，所觸及的學生人數已經超過140,000人次。	生涯探索	臺灣	國高中, 大學以上	超越基金會
組織/社群	Tiff	https://i.imgur.com/hyBBsMt.png	教育	\N	https://www.facebook.com/WebIDEC2020	免費	\N	國際民主教育年會（英語：International Democratic Education Conference 縮寫：IDEC）由世界各地實踐民主教育的學生、家長、教育工作者、倡議者、學者、組織團體，及任何關心民主教育的個人、組織單位，共同促成的大型國際會議。每一年一次於全球五大洲輪替舉辦，是目前全球另類教育、在家教育界最具影響力與指標性的年度盛會。透過討論、激盪、分享，並努力推廣「民主教育」到世界各地。	民主教育, 實驗教育	\N	國高中, 大學以上	IDEC - International Democratic Education Conference
組織/社群, 課程/活動	Tiff	https://i.imgur.com/aZQmIOa.png	教育	\N	https://www.facebook.com/YoungClubhouse/	免費	\N	由「震旦集團-傳善講」和「勵友中心」聯合打造的「好YOUNG少年創意基地」，是針對數位原生少年所規劃的社區發展資源。這是一個以「正向發展模式」概念所建構出來的，為能滿足青少年發展需求的在地性場館。 因著服務的可近性，使家庭資源有限、學業低成就、未升學未就業的少年，都能在當中透過創作、文化、服務等活動，讓少年經歷自我探索、培養自信、對社區產生認同與歸屬，進而成為有能力的貢獻者，做為他人的模範，再服務其他的年輕人。 希望這個針對新世代少年發展的服務模式，在未來可以帶動台灣各地對少年社區工作的新視野，進而挹注更多資源，造福更多的少年人。\n\n 1.數位遊園地：規劃數位設備和課程供少年學習和創作。\n 2.C2C方案：舉辦一日學生和一日職場體驗，提早建立少年生涯發展意識。\n 3.認真玩社團：組織球隊、舞團、樂團，由興趣培養到能力晉升。\n 4.訓練中心：帶領少年服務學習和領導訓練，成為社區的貢獻者。\n 5.社工服務：透過社工專業陪伴、輔導個別需求，提供諮詢和資源，解決少年各式困境。	課後輔導	\N	國高中, 大學以上	好young少年創意基地
組織/社群, 課程/活動	\N	https://i.imgur.com/Oq9hu4b.png	教育	\N	http://urclass.net/AL/courseListWallR.php	需付費	\N	融通以下學習資源，以支援我國學校教育與終身學習進展：\n實驗教育：含實驗教育學校、機構、團體、個人自學生。\n終身學習機構：含社區大學、社教機構。\n地方政府及其附屬單位。\n體制學校：非實驗教育之大學、高中、國中、國小、幼兒園。\n非政府組織(NGO)：如 python 社群、科學教育基金會、科普雜誌出版社、…等。\n獨立教育工作者。\n催生平台化的運作機制，以每年少許「補助」，達成平台、社群對抗折舊之目標。\n透過分享精神及共享機制，減低教育資源的高低落差。\n打造台灣成為一所沒有屋頂的大學校。	自主學習, 實驗教育, 終生學習, 組課共學, 教育政策	\N	國高中, 大學以上	跨校選修聯盟
組織/社群	Tiff	https://i.imgur.com/OfMynQC.jpg	教育	\N	https://wow.104.com.tw	免費	https://www.youtube.com/watch?v=touFTQaPUtw	透過工作職業關鍵字搜尋、職業地圖等方式，及大數據分析所得出的職業資訊，可瞭解工作所需條件、如何選擇專業。	生涯探索	\N	國高中, 大學以上	104工作世界
課程/活動, 組織/社群	Tiff	https://i.imgur.com/liSEDzF.jpg	教育	\N	https://batonproject.com	免費	\N	致力於將社會各界的專業善意，轉換成為學生們探索職業與了解自己天賦與熱情的價值。	生涯探索	臺灣	國高中, 大學以上	接棒啟蒙計畫
組織/社群	Tiff	https://i.imgur.com/hbGVGs8.png	教育, 學習/教學工具	\N	https://www.facebook.com/groups/1011192722620224/	免費	\N	作為老師，面對疫情，我們該如何準備？線上教學怎麼做？線上班級經營怎麼做？課程設計怎麼做？\n別擔心，我們一起來面對。這裡有很多有經驗的夥伴，有台灣的老師，也有香港優秀的老師們。我們大家一起來做好準備。有任何問題，歡迎在「台灣線上同步教學社群」一起來討論、一起來交流！\n\n此為FB社團。\n	線上教學	\N	國高中, 大學以上	台灣線上同步教學社群
組織/社群	Tiff	https://i.imgur.com/yg9GvR3.png	教育	\N	https://www.facebook.com/groups/homehigh/	免費	\N	該團以學生為主(不限定自學生)，老師、家長為輔。	自主學習, 實驗教育	\N	學齡前, 國小, 國高中, 大學以上	全國自學生社群(ﾟ∀ﾟ)
課程/活動, 組織/社群	Tiff	https://i.imgur.com/q2ikPpH.jpg	教育	\N	https://www.ipowernpo.org/	免費	\N	IPOWER概念由我們的創辦人楊筱薇與在紐約的高風險青少年們共同成立，在紐約的時期，每一位紐約青少年在筱薇老師的引導下，成為了每一個IPOWER，從I出發由每一位青少年擔任領導人，開啟了針對每一位青少年客製化的學程，有戲劇藝術的I Do Theater，有療癒學習的I Care，有烹飪烘焙的I Cook，有學習公民權利義務的I Am...，每一個紐約IPOWER各別擔任了自己的學習嚮導，並帶領整個團隊裡面的成員交互學習彼此的學程。	鄉村教育, 課後輔導	臺灣	國小, 國高中, 大學以上	IPower培力學社
組織/社群, 課程/活動	\N	https://i.imgur.com/ve02ctv.jpg	藝術	\N	http://www.oneday.com.tw/	部分免費	\N	一本共享臺灣美好生活況味的隨身雜誌，記錄臺灣土地上的小人物及生活小細節	設計, 創造力	\N	國小, 國高中, 大學以上	小日子
影片	yuchen Chang	https://i.imgur.com/7m58nbn.jpg	藝術	\N	https://www.youtube.com/channel/UCdEo82iK2lzwMqCxBuQmmrQ/featured	免費	\N	YouTube頻道《凱希.史蒂芬 Cassie Stephens》，提供許多適合兒童嘗試的藝術主題。	繪畫, 創造力	\N	學齡前, 國小	Cassie Stephens 兒童藝術課程頻道
工具/操作	yuchen Chang	https://i.imgur.com/hK23tpG.png	藝術	\N	http://otto2.com.tw	免費	\N	Otto2的教學理念，也是創辦人堅持以孩子的觀點看世界，以美學教育為基礎透過遊戲、體驗、探索、創作，讓孩子感受主動學習的快樂，培養孩子創意自信的能量。	手工藝, 藝術教育	\N	學齡前, 國小	Otto2藝術美學官方頻道
組織/社群	\N	https://i.imgur.com/FYtEcSQ.jpg	藝術	\N	https://www.foodiesfeed.com/?fbclid=IwAR3rfKv0wDoC1Okl-53lJMPHfAcEs1HofYKN4kc5W8qK3b81NKtSw24Kul8	免費	\N	「FoodiesFeed」是一款以收錄各類美食為主的免費圖庫，網站提供的相片類型包括：咖啡飲料、蔬菜水果、早餐和甜點、烹飪與烘焙、肉和魚、配料、義大利麵及披薩、異國料理等等，主題都圍繞在美食上，FoodiesFeed 相片素材大多數都是網站站長和他女友共同努力的成果。\n\nFoodiesFeed 照片主要是由單眼相機拍攝，經過修圖調整後釋出，從 2015 年開始也陸續有一些以智慧型手機拍攝的素材，這些相片都能免費下載並使用在個人或商業用途，無須標示作者或原出處，不過禁止販售或轉售網站上的任何相片。（參考免費資源網路社群）	攝影	\N	國小, 國高中, 大學以上, 學齡前	Foodiesfeed
工具/操作	\N	https://i.imgur.com/HW10Jl9.png	藝術	\N	https://imslp.org/wiki/Main_Page	免費	\N	成立於2006 年，一開始的目標是保存公有領域的樂譜掃描檔案，並且提供線上圖書館，讓需要的人可以用PDF 下載樂譜。 後來在2010 年開始，網站也開始收藏獲得公共領域授權的音樂錄音檔案，並提供MP3 等格式錄音檔下載。	音樂	\N	國高中, 大學以上	Imslp 國際樂譜庫
工具/操作, 組織/社群	\N	https://i.imgur.com/PeRWzFB.jpg	藝術	\N	https://www.behance.net/	部分免費	\N	展示與挖掘創意作品的領導平台，Behance 則比較像是設計師的部落格，在 Behance 中分類比較細、內容也比較廣，從 App、網頁設計、插畫等都有。Behance 則沒有任何限制，任何人都能註冊、發布作品。	線上作品集, 設計, 繪畫, 雕塑, 手工藝, 建築, 攝影, 音樂, 創造力	\N	國小, 國高中, 大學以上	Behance
APP, 工具/操作	\N	https://i.imgur.com/dpzf2AY.jpg	藝術	\N	https://www.pinterest.com/	免費	\N	Pinterest，是一個網路與手機的應用程式，可以讓使用者利用其平台作為個人創意及專案工作所需的視覺探索工具，同時也有人把它視為一個圖片分享類的社群網站，用戶可以按主題分類添加和管理自己的圖片收藏，並與好友分享。	圖片素材, 設計, 排版素材, 繪畫, 手工藝, 攝影, 創造力, 線上作品集, 藝術教育, 建築	\N	國小, 國高中, 大學以上	Pinterest
工具/操作	\N	https://i.imgur.com/eCzMp2V.jpg	藝術	\N	https://freesound.org/browse/tags/music/	免費	\N	這個音樂資料庫裡收錄許多聲音效果，如環境噪音、和成音效或透過樂器所製作的音樂。\n\n你可以從 Freesound 瀏覽、下載和分享音樂；在註冊免費帳戶後，你也可以上傳自己製作的音訊至他們的資料庫。	音樂	\N	國高中, 大學以上	Freesound
工具/操作	\N	https://i.imgur.com/7vtSZRl.png	藝術	\N	https://soundcloud.com/	免費	\N	SoundCloud是一個線上音樂分享平臺，音樂人們可以在此網站合作、交流和分享原創音樂錄音。	音樂	\N	國小, 國高中, 大學以上	SoundCloud
工具/操作	\N	https://i.imgur.com/IIMjWmt.png	藝術	\N	https://www.pakutaso.com/	免費	\N	日系圖庫，以日系人物與特殊場景為主	圖片素材, 設計	\N	國小, 國高中, 大學以上	PAKUTASO 
工具/操作	\N	https://i.imgur.com/QHE1MqM.png	藝術	\N	https://www.naxosmusiclibrary.com/login	免費	\N	超過160,950張隨選音樂(Music on Demand)鐳射唱片，包括「拿索斯」、「馬可勃羅」、及「Da Capo」、Warner、Sony…等1,000個以上品牌，40,000多位作曲家及演奏者之作品，2,511,190首以上的樂曲，每月將陸續增加1,150張以上新專集(約12,000首)。適合愛好古典音樂的你！	音樂	\N	國高中, 大學以上	Naxos Music Library
工具/操作	袋鼠	https://i.imgur.com/L5lmrql.png	藝術	\N	https://www.islide.cc/	免費	\N	iSlide是一款基於PPT的插件工具\n包含38個設計輔助功能，8大在線資源庫超30萬專業PPT模板/素材(介紹摘自https://www.islide.cc/)	排版素材, 設計, 圖片素材	\N	國高中, 大學以上	islide
工具/操作	Tiff	https://i.imgur.com/h6uH5xZ.jpg	藝術	\N	http://www.51pptmoban.com/	免費	\N	可依主題、風格、節日、產業、設計者來選擇	排版素材, 設計	\N	國小, 國高中, 大學以上	51 PPT模板網
工具/操作	Tiff	https://i.imgur.com/xagzZI1.jpg	藝術	\N	https://www.slidescarnival.com/	免費	\N	提供免費設計範本和豐富視覺創意PPT圖庫的網站	排版素材, 設計	\N	國小, 國高中, 大學以上	slidescarnival
組織/社群	\N	https://i.imgur.com/zdpEHBO.jpg	藝術	\N	https://www.facebook.com/GiveMeetFive/	免費	\N	以製作人制為核心，提供專業的「專業表演藝術製作統籌」、「劇團營運行銷顧問」、「表演藝術社群行銷策展」、「職人經紀與IP發展」與「表演藝術教育」等服務。	戲劇, 舞蹈, 藝文資訊	台北	國高中, 大學以上	五口創意工作室
工具/操作	yuchen Chang	https://i.imgur.com/ni57OgB.png	藝術	\N	https://www.nationalgallery.sg/gallerykids/?fbclid=IwAR1JtHBO-4HJile_BWGBG-4sAtvQqQ22gXqaLuczo606RQaoW17jjoHraU4	免費	\N	由新加坡國家藝廊規劃的線上課程影片，每段影片約3分鐘，提供藝術家介紹自己的創作理念與創作、創作歷程。影片後可以利用館方設計的學習單，依據影片主題，進行藝術作品觀察、嘗試創作。	繪畫, 創造力	\N	學齡前, 國小	Gallery Kids!
工具/操作	\N	https://i.imgur.com/GK1rdqg.png	藝術	\N	https://undraw.co/illustrations	免費	\N	MIT 授權的 164 個免費網頁設計圖示檔	圖片素材, 設計	\N	國小, 國高中, 大學以上	undraw illustrations
影片	\N	https://i.imgur.com/i14wmYc.png	藝術	\N	https://www.youtube.com/playlist?list=PL14hRqd0PELGbKihHuTqx_pbvCLqGbOkF	免費	\N	此為Youtube影片，由The Kennedy Center提供知名童書Piggy and Elephant 作者錄製的免費插畫課。	繪畫	\N	大學以上, 國高中	LUNCH DOODLES with Mo Willems!
組織/社群, 課程/活動	\N	https://i.imgur.com/32uy8Qc.png	教育	【FB】https://www.facebook.com/weteacheducation	https://www.instagram.com/weteach_edu/	免費	\N	「We + Each」，「我們」串連「每一位」教育者與學習者，成為互聯的生態圈\n✨學涯、職涯、生涯探索\n✨職業體驗工作坊\n✨跨領域教育者培力，共創更優質的教育環境！	自我探索, 自我成長, 自主學習, 教育創新, 生涯探索, 素養教育	\N	國高中, 大學以上	WeTeach尋找教育的另一種可能
工具/操作	\N	https://i.imgur.com/1mc7aSa.png	藝術	\N	https://www.cubeecraft.com	免費	\N	有許多立體3D模型可供下載	繪畫, 線上作品集, 藝術教育, 設計, 手工藝, 雕塑	\N	國高中, 大學以上	Cubeecraft 立體人偶摺紙下載
工具/操作	\N	https://i.imgur.com/Pzx5XNh.png	藝術	\N	https://www.flaticon.com/	部分免費	\N	同時也提供 Photoshop、Illustrator 的外掛套件，可依照圖標的輪廓如：彩色、實心、線條進行搜尋，讓你直接在影像工具中就可使用這些圖示	圖片素材, 設計	\N	國小, 國高中, 大學以上	FlatIcon
APP, 工具/操作	faling	https://i.imgur.com/HjDfGww.png	藝術, 學習/教學工具	\N	https://www.canva.com/	部分免費	\N	Canva為大眾提供不須設計經驗，就能完成出色成品的平台，\n讓所有人都能用自己的創意打造亮眼的作品。\n\n功能介紹:\n1.現有成品-canva提供多樣化的範本供使用者套用，讓使用者一上手便能得心應手。\n2.團隊設置-除了打造自己的完美成果外，也能創建團隊，讓更多人一起協作(能跨區/跨國)。\n3.公開分享-藉由上傳/分享的動作，能讓所有人看見你的成品，進而激發靈感。(也能選擇不分享~)\n4.多功能列表-canva不僅體現在文書創作上，在影視上也能有絕佳的視覺效果，所以能依使用者的需求進行功能選擇。\n5.個人管理-canva能夠將個人作品作好整理，令使用者能安心操作。	設計, 圖片素材, 排版素材	\N	國小, 國高中, 大學以上	Canva
工具/操作	\N	https://i.imgur.com/QoINd7V.png	藝術	\N	http://www.lowpolygonart.com/	免費	\N	一款只收集多邊形背景的圖庫	圖片素材, 設計	\N	國小, 國高中, 大學以上	Low Polygon Art
組織/社群	yuchen Chang	https://i.imgur.com/kScKV4g.png	藝術	\N	https://ed.arte.gov.tw/ch/index.aspx	免費	\N	台灣藝術教育網根據訪客身份，包含一般民眾、教師、研究人員、學生、兒童，提供豐富教材教案、研究資源、影音媒體等，以及藝教資訊。	藝文資訊, 藝術教育	台北	國小, 國高中, 大學以上	臺灣藝術教育網
工具/操作	\N	https://i.imgur.com/gF3qyCE.png	藝術	\N	https://ibeat.org/	免費	\N	如果你是一名 DJ，或是要尋找一些免費的節拍、循環音樂，iBeat 擁有龐大的音樂資料庫，採用 Creative Commons 授權方式。這些節拍可以用於各種風格的音樂，例如搖滾節奏、嘻哈、甚至是一般聲樂或電子節拍。無須註冊。	音樂	\N	國高中, 大學以上	IBeat
課程/活動	yuchen Chang	https://i.imgur.com/IZM8isX.jpg	藝術	\N	http://ocw.lib.ntnu.edu.tw/course/category.php?id=16	免費	\N	國立臺灣師範大學藝術學院開放式課程	藝術理論, 繪畫, 雕塑	\N	國高中, 大學以上	臺師大藝術學院開放式課程
工具/操作	\N	https://i.imgur.com/qfHuWnX.png	藝術	\N	https://icons8.com/	部分免費	\N	提供單色與全彩的圖示	圖片素材, 設計	\N	國小, 國高中, 大學以上	Icons8
工具/操作	\N	https://i.imgur.com/5pNXCyH.png	藝術	\N	http://www.supercoloring.com/zh-hant	免費	\N	是世界上最大填色畫冊資料庫之一，包含了將近五萬張的著色圖、連連看、繪畫教學等等範本，主要以著色畫為最大宗。你可以在這裡找到各種動物、各個節慶、各樣交通工具、各式故事人物的兒童專用著色本。                                                                                   (介紹摘自:https://www.playpcesor.com/2019/09/supercoloring.html)	繪畫, 線上作品集, 藝術教育, 設計	\N	學齡前, 國小	SUPER COLORING 線上著色本
工具/操作	\N	https://i.imgur.com/semZYsL.png	藝術	\N	https://thenounproject.com/	免費	\N	高質感圖示庫，免費下載但需註明來源，付費可使用色彩編輯功能	圖片素材, 設計	\N	國小, 國高中, 大學以上	Noun Project 
組織/社群, 文章/書	\N	https://i.imgur.com/cA1vyQt.png	藝術	\N	https://www.facebook.com/pg/30dBdesign/photos/?tab=album&album_id=520368968142932	免費	\N	分享UI / UX / 前端 / 平面設計相關設計技巧	排版素材, 設計, 藝術理論	\N	國高中, 大學以上	30 分貝的喧嘩：如何將訊息視覺化
組織/社群, 課程/活動	yuchen Chang	https://i.imgur.com/cnT7UDY.png	藝術	\N	https://www.aade.org.tw	免費	\N	從民國103年由教育部開始推動的美感教育計畫，提供大量課程範例、論壇以及相關資源，並以推廣「全民美力」作為計畫核心。\n	戲劇, 舞蹈, 繪畫, 音樂, 線上作品集	台北	國小, 國高中, 大學以上	教育部美感教育計畫
組織/社群	\N	https://i.imgur.com/guq9B79.png	藝術	\N	https://www.doooor.com/?fbclid=IwAR0ScX-usxQbsf86ZFDz-rTmDuPS-XsncwKgsC-zvEUOyiwsr-bn0uzlHyI	免費	\N	此網站包含各國設計欣賞、淘寶設計、各式素材下載、設計教學等服務。該網站為中國網站，旨在吸收各國優秀思想，培養中國國內設計界多風格高端人才，弘揚中國未來創意產業文化。	設計	\N	國小, 國高中, 大學以上	DOOOOR國外設計欣賞網站
課程/活動	yuchen Chang	https://i.imgur.com/83vsP4y.jpg	藝術	\N	https://aaa.tnua.edu.tw/index	免費	\N	國立臺北藝術大學藝術資源，依照不同領域提供校內外課程、展覽資訊	戲劇, 繪畫, 音樂, 藝文資訊	台北	大學以上, 國高中	國立臺北藝術大學藝術資源暨推廣教育中心
工具/操作	\N	https://i.imgur.com/UpLDQcf.jpg	藝術	\N	https://icooon-mono.com/	部分免費	\N	單色簡約日系風，可線上調色	圖片素材, 設計	\N	國小, 國高中, 大學以上	Icooon mono
工具/操作	\N	https://i.imgur.com/R0helAb.png	藝術	\N	https://www.jigsawplanet.com	免費	\N	這是一個不用安裝的線上拼圖遊戲	手工藝, 拼圖	\N	學齡前, 國小	Jigsaw Planet 線上拼圖
影片	\N	https://i.imgur.com/Dm9MUN3.png	藝術	\N	https://www.youtube.com/channel/UC5XMF3Inoi8R9nSI8ChOsdQ	免費	\N	此Youtube頻道提供學習繪畫以及其他有趣的兒童藝術課程，為Rob和他的家人一起創立，適合孩子單獨學習，也適合親子共學。	繪畫, 線上作品集, 設計, 英文	\N	大學以上, 國高中	Art for Kids Hub
工具/操作	\N	https://i.imgur.com/eybCRrP.png	藝術	\N	https://www.jamendo.com/start	免費	\N	網站內提供多樣的音樂資源，包含可免費下載使用的音樂、免費聽多國獨立樂團的音樂作品、音樂電台等。	音樂	\N	國高中, 大學以上	Jamendo
組織/社群	yuchen Chang	https://i.imgur.com/CjPUlMc.jpg	藝術	\N	https://www.insea.org	免費	\N	國際藝術教育協會（The International Society for Education Through Art，簡稱InSEA）是一個非政府組織，成立於二戰之後並隸屬於聯合國教科文組織。	藝術理論, 藝文資訊, 藝術教育	\N	大學以上, 國高中	Insea國際藝術教育協會
組織/社群	\N	https://i.imgur.com/INj1CvV.png	藝術	\N	https://www.facebook.com/whatsyoung/	部分免費	\N	青藝盟(全名青少年表演藝術聯盟)，是台灣唯一專職專業深耕青少年族群的劇團。我們和其他劇團最大的不同是，我們不只創作舞台劇，我們更帶領青少年製作戲劇演出。因為台灣的青少年在現今的教育環境下，普遍缺乏逐夢的機會，所以我們以這樣的方式，試圖在制式的教育體制之外，引導青少年探索自我天賦，為青春開闢第二條路。	戲劇, 藝術教育	台北, 新北	國高中, 大學以上	青藝盟
文章/書, 工具/操作	\N	https://i.imgur.com/8zLuQSD.png	藝術	\N	http://julia00.blogspot.tw/2016/02/blog-post.html	免費	\N	介紹六大資訊圖表數位工具	資訊圖表製作, 設計	\N	國小, 國高中, 大學以上	視覺圖像萬歲! 私房愛用六大資訊圖表數位工具總整理
工具/操作	\N	https://i.imgur.com/GrDnzjL.png	藝術	\N	https://adioma.com/	部分免費	\N	輔助你說故事的扁平化圖示，可用於商業簡報	圖片素材, 設計	\N	國小, 國高中, 大學以上	Adioma
組織/社群	袋鼠	https://i.imgur.com/pR9mkoe.jpg	藝術	\N	https://www.facebook.com/easylife.tw	免費	\N	哇哇3c日誌裡面有許多3c資訊，也還有許多電腦上實用的軟體介紹	設計, 資訊圖表製作	\N	國高中, 大學以上	哇哇3c日誌 - 綠色工廠2.0
工具/操作	\N	https://i.imgur.com/kMwCW7Q.png	藝術	\N	https://free.com.tw/kids-nurie/	免費	\N	是一個日本網站，提供很多適合小孩著色上色的圖案，依照不同主題分類，例如交通工具、工作人員、動物、昆蟲、食物、花草、季節或是男生女生會喜歡的圖案（恐龍、寶藏或是玩偶），總數大約有六百張，可以預覽將圖案列印出來著色。(介紹摘自:https://free.com.tw/kids-nurie/)	繪畫	\N	學齡前, 國小	Kids Nurie 著色圖庫
工具/操作	\N	https://i.imgur.com/DycHXo5.png	藝術	\N	https://www.iconfinder.com/	部分免費	\N	擁有超過十五萬個圖示，特別是圖示通常是一整個系列的，當你尋找一個圖示時，可以找到同一系列相關的	圖片素材, 設計	\N	國小, 國高中, 大學以上	Iconfinder 
工具/操作	\N	https://i.imgur.com/2wOeJai.png	藝術	\N	http://pngimg.com/	免費	\N	全球最大去背圖庫，非商用、無註冊	圖片素材, 設計	\N	國小, 國高中, 大學以上, 學齡前	PngImg 
組織/社群	yuchen Chang	https://i.imgur.com/eU0LTWd.jpg	藝術	\N	https://www.ncafroc.org.tw	免費	\N	國藝會官網，包含展演活動、補助資訊、藝術時事等資訊	藝文資訊	\N	學齡前, 國小, 國高中, 大學以上	國家文化藝術基金會
工具/操作	\N	https://i.imgur.com/WteZLAk.jpg	藝術	\N	https://librestock.com/	部分免費	\N	整合47個線上免費圖庫資源，超過六萬張圖片	圖片素材, 設計	\N	國小, 國高中, 大學以上	LibreStock 
組織/社群, 工具/操作	\N	https://i.imgur.com/pwh8xg4.jpg	藝術	\N	https://issuu.com/	部分免費	\N	開放式的電子書平台，提供免費製作電子書的服務。適合製作個人的作品集。	排版素材, 設計, 線上作品集	\N	國小, 國高中, 大學以上	issuu
組織/社群, 課程/活動	yuchen Chang	https://i.imgur.com/0MX8X2C.jpg	藝術	\N	https://www.quanta-edu.org/zh-tw/about.php	免費	\N	《游於藝》計畫、廣達游藝獎主要籌辦單位，宗旨：「教育為根」、「藝術為本」、「科技為用」、「創意為法」，提供多項教育思潮、藝術競賽資訊。	藝文資訊	\N	學齡前, 國小, 國高中, 大學以上	廣達文教基金會
組織/社群	yuchen Chang	https://i.imgur.com/4nMFw2L.png	藝術	\N	https://cirn.moe.edu.tw/WebContent/index.aspx?sid=1124&mid=7522	免費	\N	教育部為推動九年一貫新課程，於92年在中央成立了以「專家學者」為主的七大學習領域「課程與教學輔導群」，本官網提供藝教活動專業推廣、學會論壇、教學示例等資訊	藝術理論, 藝文資訊	\N	大學以上, 國高中	藝術領域中央輔導團
工具/操作	\N	https://i.imgur.com/yp6zPjc.jpg	藝術	\N	https://unsplash.com/	免費	\N	目前全世界最大的高畫質免費圖庫	圖片素材, 設計, 攝影	\N	國小, 國高中, 大學以上	Unsplash 
組織/社群	\N	https://i.imgur.com/SJmd4UV.jpg	藝術	\N	https://npac-ntch.org/zh	免費	\N	兩廳院是臺灣最成熟的國際級藝術中心，網站內包含音樂、舞蹈、戲劇的相關演出資訊、藝文資料、教育推廣文獻等。	音樂, 戲劇, 舞蹈, 藝文資訊, 藝術教育	台北	學齡前, 國小, 國高中, 大學以上	國家兩廳院
組織/社群	\N	https://i.imgur.com/wm35BaU.png	藝術	\N	https://www.facebook.com/thedream.nevergiveup/	免費	\N	逆風劇團在2015年創立， 「年少無知，叛逆輕狂」這八個字大概可以形容他們的過去，一群生命都不完美的年輕人，曾被這個社會貼上難以抹去的標籤，沒有人抱著期待也沒有人賦予過希望，因為一個構想「希望用戲劇的方式帶著中輟、高關懷少年們站上舞台演出自己的故事。」三個曾經也有過相同生命經驗的年輕人，瑋盛、韋志、奕醇、決定創立逆風劇團，開始走訪雙北市的青少年中心、機構、學園舉辦生命經驗分享的講座並招募團員，希望可以帶著這些高關懷少年組成劇團，在這段過程中從零開始的接觸藝術及戲劇，從中獲得成長蛻變的可能。 「就算曾被放棄，也能在逆風中找到青春的價值！」 未來我們也將繼續前進，希望能用戲劇的方式繼續陪伴著逆風中的青少年們。 一路以來 戲劇這條路沒有遺憾也不曾後悔 渴望未來能繼續透過戲劇的力量 漸漸的將理念付諸實踐，給予這個社會、生活在土地上的人們更多正向的影響和改變。	戲劇, 藝術教育	台北, 新北	國高中, 大學以上	逆風劇團
組織/社群	袋鼠	https://i.imgur.com/VUSmmS1.jpg	藝術	\N	https://www.facebook.com/slideartist	免費	\N	此網站會分享許多簡報設計的知識以及實用教學	圖片素材, 設計, 排版素材	\N	國高中, 大學以上	簡報初學者
工具/操作	Tiff	https://i.imgur.com/pOYvwvS.jpg	藝術	\N	http://www.ypppt.com/	免費	\N	可依熱門標籤、色彩、類型來選擇	排版素材, 設計	\N	國小, 國高中, 大學以上	優品PPT
組織/社群, 課程/活動	\N	https://i.imgur.com/Gq2p3f5.jpg	藝術	\N	http://www.gutsimprov.com	部分免費	\N	致力於實踐一個簡單的初衷「讓即興劇在台灣發生」，透過即興 劇演出及工作坊，促成更多更好的個人及團體創造力，解放更多\n 人與生俱來的勇氣與創意。	戲劇	台北	國小, 國高中, 大學以上	勇氣即興劇場
工具/操作	\N	https://i.imgur.com/MBazRjp.jpg	藝術	\N	https://freemusicarchive.org/	免費	\N	FMA擁有各類型不同的音樂供免費下載，包含搖滾、R&B、鄉村等。	音樂	\N	國高中, 大學以上	FMA
組織/社群	yuchen Chang	https://i.imgur.com/OeIIKrN.png	綜合型學習資源, 藝術	\N	https://bit.ly/2RmKJy1	免費	\N	教育部推動「教育雲端應用及平臺服務計畫」之藝術領域網站，整合國家教育研究院、全國直轄市、縣(市)政府、本部部屬機構、部屬機關及⺠間單位等各項教育影音資源，建立整合平臺並提供服務。	繪畫, 藝術理論, 戲劇, 舞蹈, 設計	\N	國高中, 大學以上	教育雲-疫起線上看
組織/社群, 工具/操作	\N	https://i.imgur.com/xfeY4BN.png	藝術	\N	https://dribbble.com/	部分免費	\N	Dribbble 是一個世界級的設計師分享平台，你可以把他想成是設計界的臉書這樣，來自世界各地的設計師們都會在上面發表作品，平面、動畫、UI、Web、插畫各式各樣的作品種類都有。	線上作品集, 設計, 創造力	\N	國小, 國高中, 大學以上	Dribbble
組織/社群	yuchen Chang	https://i.imgur.com/bxJMpa2.png	藝術	\N	https://www.ntmofa.gov.tw/links_1207.html	免費	\N	國美館推出24小時不打烊的「線上藝術資源服務」，把藝術透過線上管道提供給社會大眾，也提供學校教師線上教學的輔助資源。線上藝術資源服務中，台灣藝術家紀錄片、叢書系列，透過影音及文字尋訪與爬梳，讓大眾了解藝術家的生命流動及藝術成就。\n\n	繪畫, 藝文資訊, 藝術教育	\N	學齡前, 國小, 國高中, 大學以上	國立台灣美術館線上資源
組織/社群, 課程/活動	\N	https://i.imgur.com/l7smWp5.png	藝術	\N	https://www.facebook.com/ZhanFuTheatre/	免費	\N	主要由國高中生組成的戲劇團隊，經由專業訓練、同儕間的影響力，透過教育劇場把我們的感動與生命力傳達給社會。	戲劇, 藝術教育	宜蘭	國高中, 大學以上	人文展賦劇團
課程/活動	\N	https://i.imgur.com/TtxMDu1.jpg	藝術	\N	https://sites.google.com/view/line007/%E8%AA%B2%E7%A8%8B	需付費	\N	我是林麗卿，是演員是老師也是導演，多年來一直致力於國、高中、大學的戲劇教學及創作的工作，2017年在國家劇院開設「演員工作坊」，讓我接觸到一群可愛的樂齡朋友，我發現樂齡朋友的活力及表演能量是不該侷限的，他們卸下工作的光環後，都開始正視他們期待的下一段人生。我深深地感受到每個人生命中的智慧與經驗是那麼的獨特，希望藉由戲劇的專業能力能讓接觸到的每位學員都可以覺得「戲劇好好玩」，然後「好好玩戲劇」！	戲劇	台北	國高中, 大學以上	麗卿老師的樂齡學堂
組織/社群	yuchen Chang	https://i.imgur.com/PIGNpW5.jpg	藝術	\N	http://www.gumbyworld.com	免費	\N	甘比（Gumby）和波奇（Pokey）是由黏土動畫大師Art Clokey 在一九五五年所創造的卡通人物，分別是一個綠色小人和一隻橘色小馬。在這個屬於他們的官方網站裡，有許多有趣的遊戲和小故事，可提供藝術教育者在介紹黏土動畫時的參考。	手工藝, 雕塑, 創造力	\N	學齡前, 國小	甘比人黏土動畫網站
工具/操作	Tiff	https://i.imgur.com/CHNzIoH.png	藝術	\N	http://www.officeplus.cn/List.shtml?cat=PPT	免費	\N	微軟官網，樣式偏簡約	排版素材, 設計	\N	國小, 國高中, 大學以上	OfficePLUS
工具/操作	\N	https://i.imgur.com/USIgQDO.png	藝術	\N	https://www.deviantart.com/	部分免費	\N	DeviantArt（2001年至2014年間稱為deviantArt，簡稱：DA），是一個為藝術家展示各自作品、並交流討論而設計的社交網路服務網站。它以分類系統為基礎，輔以個人紀錄檔、新聞、社區論壇、每日作品、人氣榜、最愛、收藏和可巢狀的評論與回覆系統構建起具有自身特色的社交網路。至2010年8月DA已有1450萬用戶註冊並收到超過1億個各種作品的投稿。DA的用戶每天共能發表約14萬個新作品，添加約140萬次「最愛」和發表約150萬條評論。	線上作品集, 設計, 創造力	\N	國小, 國高中, 大學以上	DeviantArt
工具/操作	\N	https://i.imgur.com/EHwu7tD.jpg	藝術	\N	https://alexanderstreet.com/products/music-online-listening	免費	\N	Alexander Street Music Online共包含15種音楽資料庫，提供線上欣賞、聆聽。主題涵蓋：古典音樂、爵士音樂、美國歌謠、世界歌謠、樂譜等。	音樂	\N	國高中, 大學以上	Alexander Music Online
工具/操作	Tiff	https://i.imgur.com/XJEjGS0.png	藝術	\N	https://sites.google.com/students.fortscott.edu/free-design-source-material/%E6%8E%92%E7%89%88%E8%A3%BD%E4%BD%9C/%E5%B9%B3%E9%9D%A2%E8%A8%AD%E8%A8%88?authuser=0	免費	\N	由林昱辰彙整而成，需要圖片設計、排版、簡報設計、音樂製作等素材都可以在上面找到。	圖片素材, 排版素材, 資訊圖表製作	\N	國小, 國高中, 大學以上	設計免費素材整合
課程/活動	\N	https://i.imgur.com/WjCAB0m.jpg	藝術	\N	https://littleboxart.weebly.com	需付費	\N	透過精心編製的教材、故事與遊戲，加上老師用心引導能夠充分激發創意的關鍵問題，讓孩子在美好的環境中滋養美感，習於深入思考，且勇於嘗試並表達創作。	繪畫, 手工藝, 設計, 雕塑, 藝文資訊, 藝術教育	台北, 新北	學齡前, 國小	小盒子藝術教育
課程/活動	Tiff	https://i.imgur.com/SOISBZd.png	自然科學, 教育	\N	http://plus-magic.com/	部分免費	\N	加點魔法成立於2017年，由國際魔術冠軍周代祥領軍，是全球首創魔術結合科學的STEAM教育品牌。提供垂直整合科學素養課程解決方案，包含課程導入、師資培訓、教材教具。魔法科學課改變了傳統科學教育的學習方式，讓孩子更容易吸收知識，提高學習成效。	生物, 物理, 化學, 地科, 科學史, 遊戲, 生物化學, STEAM	\N	國高中, 國小	加點魔法
組織/社群, 課程/活動	\N	https://i.imgur.com/9VLTTTG.png	自然科學	\N	https://www.facebook.com/DrYOUscience/	需付費	\N	致力於使用最符合未來需求的方式教育孩子的科學精神，培養 科學素養、點燃他們對科學的熱情。希望讓所有人為了科學而 快樂地學習，讓每個人都成為樂於研究的博士，整個城市都變 成你的實驗室。	物理, 化學, 生物, 地科, 科學史	新竹	學齡前, 國小, 國高中	樂研數理實作教室
工具/操作	\N	https://sciencebob.com/wp-content/uploads/2020/03/Home_Experiments_.jpg	自然科學	\N	https://sciencebob.com/	免費	\N	Science BOB 網站也是實驗型的科普網站，提供詳細的實驗器材與步驟。對比 Lawrence Hall of Science Kids 提供的實驗，Science BOB 的實驗可能比較適合中高年級以上的孩子，進行實驗也需要有大人陪同一起作業（以防家裡可能不小心就爆炸了）。在實驗步驟的結尾，Science BOB 也提出了一些問題，讓孩子針對實驗結果進行觀察，並思考實驗裡不同的變項，分別會讓實驗結果產生什麼差異。\n（資料來源：泛科學）	物理, 化學, 生物, 地科, 科學史	\N	國小, 國高中, 大學以上	Science BOB 美國趣味科學實驗網站
文章/書	\N	https://i.imgur.com/xYCPak9.png	自然科學	\N	https://kids.frontiersin.org/	免費	\N	Frontiers for Young Minds 這個網站不只是單純提供孩子科學知識，還讓孩子們能夠一同參與科學傳播的過程。雖然要讀懂這些文章，看起來需要很多基礎知識，但其實網站透過與當地 8-15 歲之間的孩子們直接合作，藉由孩子們的回饋，提供作者寫出適合同年齡層閱讀的文章，同時還能培養孩子對課外知識的好奇心。\n（資料來源：泛科學）	物理, 化學, 生物, 地科, 科學史, 英文	\N	國小, 國高中, 大學以上	Frontiers for Young Minds
組織/社群	\N	https://i.imgur.com/caoJEIY.png	自然科學	\N	https://pweb.cwb.gov.tw/PopularScience/	免費	\N	中央氣象局數位科普網的科普互動島以及兒童科普島，藉由遊戲互動、漫畫、影片以及圖文方式，傳遞氣象、地震、天文、海象的相關科普小知識，而兒童島文章中的文字附有注音，內容淺顯易懂，適合用來教導中低年級的孩子。\n（資料來源：泛科學）	地科, 遊戲, 動畫, 影片	\N	學齡前, 國小, 國高中, 大學以上	中央氣象局數位科普網
工具/操作	\N	https://i0.wp.com/host.easylife.tw/pics/201909/Plants.png	自然科學	\N	https://www.c82.net/twining/plants/	免費	\N	19 世紀插畫家 Elizabeth Twining 的植物圖鑑，現在已免費開放在 Internet Archive 閱覽。此外，還有設計師 Nicholas Rougeux 推出的數位修復版！	生物	\N	學齡前, 國小, 國高中, 大學以上	Illustrations of the Natural Orders of Plants(19 世紀植物圖鑑)
文章/書, 工具/操作	\N	https://i.imgur.com/ttOYnki.png	自然科學	\N	https://www.tbn.org.tw/	免費	\N	行政院農業委員會特有生物研究保育中心依循「生物多樣性公約」的精神，建立全國性生物多樣性資料流通平台，網站內有許多生物資料的介紹!	生物	\N	國小, 國高中, 大學以上	台灣生物多樣性網絡
工具/操作	\N	https://spider.tbn.org.tw/sites/dpspider/files/thesite/logo-square.png	自然科學	\N	https://spider.tbn.org.tw/	免費	\N	蒐集臺灣蛛形動物之物種多樣性、空間分布及相關資訊所成立的觀察記錄網站，以標準化、系統性的方式，累積公眾的記錄資料。	生物	\N	國小, 國高中, 大學以上	臺灣蛛式會社
組織/社群	\N	https://i.imgur.com/aCA2Km3.jpg	自然科學	\N	https://www.facebook.com/groups/173127322721863/about/	免費	\N	因為自學生分佈北中南東各地，藉由網路的方便性，不限時間與地點，對於自 然科學有興趣的都可以一起加入。你可以提出自己觀察到的自然現象、疑惑， 或是與大家共同討論老師(或是某位成員)提出的問題。你也可以對於正在研讀的書籍中，有很棒的發現，或是有疑問的地方，在這裡提出來。	物理, 化學, 生物, 地科	\N	國高中, 大學以上	自學生的遠距共學團(自然科學)
工具/操作	Tiff	https://www.c82.net/images/covers/mineralogy.jpg	自然科學	\N	https://www.c82.net/mineralogy/#	免費	\N	由設計師 Nicholas Rougeux 重新整理 19 世紀早期的博物學家、插畫家、礦物學家詹姆斯·索爾比（James Sowerby）的彩色插畫圖鑑，在數位修復後打造出線上的網路互動版。	地科	\N	學齡前, 國小, 國高中, 大學以上	British & Exotic Mineralogy(19世紀礦物地圖)
組織/社群	\N	https://i.imgur.com/JMRSv7o.png	自然科學	\N	https://www.vanaqua.org/live-cams	免費	\N	網站裏頭有許多用真實鏡頭所拍攝的生物畫面，適合喜愛生物的夥伴們一同來欣賞世界上很棒的資源吧!	生物, 英文	\N	國小, 國高中, 大學以上	溫哥華水族館
文章/書	\N	https://i.imgur.com/QcaaxRs.png	自然科學	\N	https://climatekids.nasa.gov/	免費	\N	NASA Climate Kids 網站，透過圖文、影片與遊戲，讓孩子能夠更了解全球暖化與氣候變遷的相關的科學知識。\n（資料來源：泛科學）	地科, 遊戲, 英文	\N	學齡前, 國小	美國太空總署－兒童氣候網站 NASA Climate Kids
工具/操作	\N	https://cnews.com.tw/wp-content/uploads/20170712a07.jpg	自然科學	\N	https://www.google.com.tw/intl/zh-TW/earth/	免費	\N	Google 地球可以帶領你遨遊天涯海角，觀看衛星圖像、地圖、地形 圖、3D 建築物，從外太空的星系到海洋的峽谷，一切盡收眼底。	地科	\N	學齡前, 國小, 國高中, 大學以上	Google Earth
影片	\N	https://i.imgur.com/s4wSpto.jpg	自然科學	\N	https://www.youtube.com/c/%E4%BD%91%E4%BE%86%E4%BA%86/featured	免費	\N	『生活中尋找科學，科學中發現樂趣』\n此Youtube頻道主要分享生活中的科學現象，並進而分享其理論。	物理, 化學, 科學史	\N	學齡前, 國小, 國高中	佑來了
影片	\N	https://i.imgur.com/R5CwS79.jpg	自然科學	\N	https://www.youtube.com/channel/UCxaOKiWaV0E-v30Uhv63VCQ	免費	\N	剛起步的自然史內容提供者，現在有介紹19世紀生物學界的人物，之後會繼續新增其他跟自然史相關的內容和影片，走向還沒有很明確，但是歡迎一起找作者討論	生物, 科學史	\N	大學以上, 國高中	自然歷史理念工作坊
組織/社群	Tiff	https://i.imgur.com/TieonSo.png	自然科學	\N	https://tw.meandmine.com/?fbclid=IwAR2d39fjhu4B623xlg05Sxs_mXe6a3uzRTXSiZrV3LNVuAuNAvnUROu4Bns	部分免費	\N	來自全球創新之都－矽谷，獲獎無數的 MEandMine，由醫師、心理學家、教育家、科學家、玩具設計師組成，和哈佛兒童發展中心合作研發全球首創『SEL x STEAM 社會情商 x 科學創客』系統，透過獨特『Read–Build–Play』三步驟， 把抽象的身體、心智與社會情緒學習遊戲化！	遊戲教育, STEAM, 創客手作	\N	國高中, 大學以上, 國小	矽谷MEandMine Sel x Steam好好玩
組織/社群, 課程/活動	Tiff	https://i.imgur.com/BgvRluJ.jpg	自然科學	\N	https://lis.org.tw/	免費	\N	LIS ( Learning in Science )情境科學教材，致力於為國中小自然教師及學生，設計有別於填鴨教育的科學教材，如有趣的科學影片，協助教師進行STEAM和科學素養導向的教學，讓教師更簡單地進行教學創新，幫助更多孩子找回對科學的學習動機，並培養解決問題的能力。	物理, 化學, 生物, 地科, 科學史	\N	國小, 國高中, 大學以上	LIS情境科學教材
工具/操作	\N	https://i.imgur.com/TOHftK5.png	自然科學	\N	https://bit.ly/3ysphYW	免費	\N	「動物星球頻道」推出的線上學習平台\n內容優質、互動性高，完全免費，隨選隨玩！非常適合親子同樂的課外學習教材。題目來自動物星球頻道的熱門節目，解答影片就像會說話的動物百科全書，以輕鬆有趣的遊戲帶你一起認識大自然，任何時間、地點即可答題挑戰。	生物	\N	國高中, 大學以上	《動物檢定》線上學習平台
組織/社群	\N	https://i.imgur.com/bkJD1Uy.jpg	自然科學	\N	http://www.facebook.com/KTxYJ	免費	\N	這世界上有許多動物，在不知不覺中慢慢消失了，這些改變好像離我們很遙遠，其實與我們息息相關。只要多一點的了解和關心，我們都可以發揮影響力，讓美麗的地球更加繽紛燦爛！\nKTxYJ希望能藉由輕鬆有趣的分享，讓大家更了解平常常聽到的動物們究竟有什麼不為人知的小秘密，讓喜愛動物的人越來越多，一起創造共榮共存的世界。	生物	\N	國高中, 大學以上	KTxYJ
組織/社群, 文章/書	Tiff	https://2.bp.blogspot.com/-Qgkuvlq7IaM/Vi4ymRcj1cI/AAAAAAAA74Y/IFnuRaQT4y4/s1600/pansci_cover.jpg	自然科學	\N	https://pansci.asia/	免費	\N	PanSci 泛科學是台灣最大的科學網站及社群，於2011年成立，起初為台灣數位文化協會育成的計畫，2014年已獨立成立泛科知識股份有限公司。PanSci 泛科學邀請台灣科學研究者、教育者、愛好者、以及所有受科學影響的人們，共同暢談科學、將高深龐雜的科學發展重新放置回台灣公共論壇中，並且用理性思考社會議題中的科學面向，致力於提供科學討論的最佳場合，包括線上與線下。\n\n我們認為科學應該面向大眾，要能解決大眾的問題，也要讓解決問題本身變成一種樂趣。我們也認為「科學太重要了，不能只交給科學家」，同時「科學家太重要了，不能只留給科學」，因此我們熱切鼓勵更多人來參與科學傳播，包括第一線的科學家。\n\n泛科學的內容主要來自各內容合作夥伴（出版社、學術研究組織、科學推廣單位等）、專欄作者與投稿者、以及泛科學自己，你可以在每篇文章看見作者的資訊與引用的資料出處。我們非常重視內容的正確性以及傳播力道，同時我們也仰賴社群給我們的批判，讓我們做得更好、更起勁。我們持續精進，但仍有不足。若您發現任何錯誤或資料不正確，都歡迎透過各種管道與我們聯繫，我們保證會立即回應，用最公開透明的方式處理。\n\n泛科學的商業模式包括廣告專案、活動合作、電子商務、內容出版等。我們歡迎有興趣的合作單位與我們聯繫，共同提升科學在各種面向的能見度。	物理, 化學, 生物, 地科	\N	國小, 國高中, 大學以上	泛科學
組織/社群, 文章/書	\N	https://i.imgur.com/4pFz6YI.png	自然科學	\N	http://tw.spaceschool.org	免費	\N	HASSE 太空學校（Houston Association for Space and Science Education）為學員塑造一個積極正面的環境，鼓勵學員獨立思考及團體合作，培養學員用更高的視野看世界、用更廣的心胸去面對未來及關懷社會。 HASSE太空學校是全球極少數能帶領學員親身瞭解美國國家太空總署面貌，並參與頂尖太空項目的頂級教育研習，其教學內容依照美國科學教育標準 (National Science Education Standards) 制訂。 以NASA 詹森太空中心與休士頓市的資源和環境為基礎，邀請各方專業講師，激發學生對太空科學與管理的興趣與潛能，增進團隊合作，培養計畫執行與組織運作的能力。藉由多樣化的課程，點燃學員們對夢想的熱情、擴展國際觀並打開人生的視野。	地科	\N	國高中, 大學以上	HASSE 太空學校
影片	\N	https://i.imgur.com/nuwyupD.jpg	自然科學	\N	https://www.youtube.com/channel/UC-3SbfTPJsL8fJAPKiVqBLg	免費	\N	DEEP LOOK 是一個科學視頻系列，從 KQED 和 PBS Digital Studios 的非常非常小的角度探索大科學。我們以出色的 4K 分辨率使用微距攝影和顯微鏡來近距離觀察科學……真的，非常接近。(節錄自https://www.youtube.com/c/KQEDDeepLook/about)	生物	\N	國小, 國高中, 大學以上	Deep Look
組織/社群, 課程/活動	\N	https://i.imgur.com/4qdDMxR.png	自然科學	\N	http://247science.org/	免費	\N	Lawrence Hall of Science Kids 網站提供孩子多種實驗的詳細步驟，使用常見的物品作為器材，讓孩子可以學習利用科學方法認識世界。此外，網站上還有許多趣味小遊戲，提供孩子不一樣的學習方式。\n（資料來源：泛科學）	物理, 化學, 生物, 地科, 科學史	國外	國小, 國高中, 大學以上	加州大學勞倫斯科學中心－兒童館 Lawrence Hall of Science Kids
影片	\N	https://i.imgur.com/RKHFPRd.jpg	自然科學	\N	http://ocw.aca.ntu.edu.tw/ntu-ocw/ocw/cou/109S202	免費	\N	本課程以生動、有趣的動畫展現生化實驗技術的原理，並以絕佳的視角拍攝操作示範，提供學習者快速入門之道。	生物化學, 動畫	\N	大學以上, 國高中	生化實驗技術:原理 (動畫) 與操作示範
組織/社群, 文章/書	蕭至威	https://elearn.epa.gov.tw/rwd/images/LOGO.png	自然科學	\N	https://elearn.epa.gov.tw/	免費	\N	以「數位學習」的方式進行，有眾多環境教育課程可供挑選。	生物, 地科, 生物化學	\N	國小, 國高中, 大學以上	環境教育終身學習網
文章/書	\N	https://i.imgur.com/B8xSM5j.png	自然科學	\N	https://www.wonderopolis.org/	免費	\N	孩子們可能總是會有十萬個為什麼，Wonderopolis 這個網站中，透過文章教導孩子有趣的科學知識，若是孩子有其他的問題，也可以在網站中提出。此外還值得一提的是，文章除了回答相關的問題，每篇文章下方還會有幾個點子，提供孩子們自己動手試試看，家長不妨也能和孩子一起體驗科學的趣味吧！\n（資料來源：泛科學）	物理, 化學, 生物, 地科, 科學史, 英文	\N	國小, 國高中	美國國立家庭學習中心 Wonderopolis
文章/書	\N	https://i.imgur.com/heigsMw.png	自然科學	\N	https://www.natgeomedia.com/scienceclub/	免費	\N	國家地理－少年科學俱樂部 網站中的趣味問答、科普影片，加深孩子對科學知識的印象，增強學習效果。此外，除了閱讀科普文章、觀看影片與思考問題，網站還推廣自己動手做實驗，讓我們的生活中，處處都能接觸科學。（資料來源：泛科學）	物理, 化學, 生物, 地科, 科學史	\N	國小, 國高中, 大學以上	國家地理－少年科學俱樂部
組織/社群	\N	https://i.imgur.com/XHqWbtD.png	自然科學	\N	http://pscloud.nmns.edu.tw/#/	免費	\N	科普與人文教育入口網 以類似圖庫的方式排版，呈現欲傳遞的知識與資源。網站內容不僅限於自然科學，也包括社會科學的部分，雖然不是單純圖文形式的傳播知識，但對於蒐集相關資料，這個網站也是很有其功能性的。\n（資料來源：泛科學）	物理, 化學, 生物, 地科, 科學史, 遊戲	\N	國小, 國高中, 大學以上	科普與人文教育入口網
組織/社群, 文章/書	\N	https://i.imgur.com/cj8xKlY.png	自然科學	\N	https://etrans.tw/	免費	\N	科普一傳十 以高品質電視製作及新媒體技術，製作貼近時代議題相關科學知識影片，提供不同的方式傳遞科學知識。影片類型多元，不只是紀錄研究，還包含了許多動手做實驗與演講 Q&A 的內容，值得大家一同觀看思考。\n（資料來源：泛科學）	物理, 化學, 生物, 地科, 科學史, 影片	\N	學齡前, 國小, 國高中	科普一傳十
影片	\N	https://i.imgur.com/YFxi0nJ.jpg	自然科學	\N	https://www.youtube.com/channel/UCsXVk37bltHxD1rDPwtNM8Q	免費	\N	此為德國的團隊所建立的Youtube頻道，宗旨在製作美麗、高品質的影片讓科學更親民。\n中文翻譯網址:https://www.bilibili.com/tag/2523582	物理, 化學, 生物, 地科, 科學史, 英文	\N	大學以上, 國高中	Kurzgesagt
組織/社群	\N	https://iubmb.org/wp-content/uploads/2020/09/logoiubmb.png	自然科學	\N	https://iubmb.org/resources/biochemistry-education-movies/	免費	\N	Since 2015, Professor Andrew. H.-J. Wang has been working with a team from the National Taiwan University (Professors, students, assistants, and volunteers) to develop a suit of biochemistry education animation movies, supported by the Biochemical Technology Education Foundation (Founder). Prof. Wang has dedicated these movies to IUBMB.	生物化學, 動畫, 英文	\N	大學以上, 國高中	Biochemistry Education movies
文章/書	\N	https://i.imgur.com/V1jvlXb.png	人文社會	\N	https://corrupttheyouth.net/	免費	\N	好青年荼毒室，顧名思義，是一個專門荼毒青年的地方。二千多年前，曾經有個叫蘇格拉底的人，因為荼毒青年而被判死，最終他把毒藥一飲而盡。今天，一群中毒已深的人，建立起這個荼毒室，好等大家都能一起走進哲學的世界。這是個會荼毒人的地方，因為你會開始發現身邊的一切，並非如此理所當然；你會開始反省，追問生命、世界、語言、科學、倫理、知識、政治等每事每物的本質。從此，你可能不再是循規蹈矩的好青年。　日後，我們會定期發表哲普文章，又深又淺又淺又深地介紹古今中外的哲學。這裡會有離地的形上學，也有在地的政治哲學；會有老掉牙的儒家哲學，也有很潮很文青的存在主義；會有艱澀的邏輯，也有輕鬆的哲學電影漫畫介紹。或許，有一天大家都會在這個荼毒室流連忘返。	哲學	\N	國高中, 大學以上	好青年荼毒室-哲學部
組織/社群	Tiff	https://i.imgur.com/Uh1lMpU.jpg	人文社會	\N	https://www.facebook.com/intleconobserve/	免費	\N	主要分享國際經濟觀察和產業與重要政經趨勢等分析，希望能夠聚集同好一同討論，切磋心得想法。	國際情勢, 政治, 經濟, 社會議題	\N	國高中, 大學以上	IEObserve 國際經濟觀察
組織/社群, 文章/書	Tiff	https://i.imgur.com/rVeYFII.jpg	人文社會	\N	https://www.businessweekly.com.tw/	免費	\N	《商業周刊》（英語：Business Weekly），簡稱《商周》，是臺灣一本以財經相關報導為主要內容的週刊，在1987年發行，每週四出刊。	國際情勢, 社會議題, 經濟	\N	國小, 國高中, 大學以上	商業週刊
組織/社群	\N	https://i.imgur.com/rfLhsTF.jpg	人文社會	\N	https://www.facebook.com/VNsFrontLine/?__tn__=K-R&eid=ARAOYHLE-jHBiOoY1tfeHQusb0ydrlRBHGVxETcmodwN-CuprgaFsfHUPVQuNA7jAizSeNycJK63Ey8N&fref=mentions&__xts__%5B0%5D=68.ARATGzq5zonLWYJcKC0p5TPlwe5fhfb6HGFVr16hr9eiWVNDGv9tIxN3Ad7SSO-ylNGc5ObL1dwAXXPxFJcljCCAmCySDR_zJuqT9qFEW6Gq3ZqU6cTDAhOBioPPjldOx8UR4T74NuZCjcYW_-FcsL315YbETayNm_4itKaVNb4wl9VnOiIVcdHkmyVAuIvYV8KAjQ8CDvm5AVaJd8ZDuE6wF4z9Tq2wVFoMrnz2nTGojfdcmakjRz3gDZmFO6zAWMCLrvo4oogyaqzl-rzMkKI-qr_AK_shyyHBVe7SYDauX4oXuBRzOivJWWMfuy0w6tBYN7P7P1XXobNBIsk	免費	\N	了解越南，深入越南，掌握越南最新資訊。	國際情勢	\N	國高中, 大學以上	越南最前線
組織/社群, 文章/書	\N	https://i.imgur.com/aihGik7.png	人文社會	\N	https://zht.globalvoices.org/	免費	\N	全球之聲是一個國際性的網站，開放給各國部落客和公民記者追蹤及報導。它的內容概括了世界上各個角落的博客。\n它是一個非營利的全球公民媒體計劃，創建者為伊丹·查克曼和麗貝卡·麥康瑞，在哈佛大學法學院貝克曼網路與社會中心（Berkman Center for Internet & Society）贊助下成立，在2004年十二月正式成為各國部落客的集結處。2008年時，在荷蘭阿姆斯特丹成為一個獨立非營利組織。不一定要有專家的專業性，而是用平凡人的觀點看到周遭的世界，以此建立的平台，是與其他翻譯介紹國際資訊的網站最大不同之處。	國際情勢, 社會議題, 法律, 政治, 文化	\N	國小, 國高中, 大學以上	全球之聲
文章/書	\N	https://i.imgur.com/36CgTvL.jpg	人文社會	\N	https://phiphicake.blogspot.com/	免費	\N	本網站由朱家安先生所創的部落格，裡面有滿滿的與哲學相關的書籍與文章。	哲學	\N	國高中, 大學以上	哲學哲學雞蛋糕
影片	\N	https://i.imgur.com/HluuvuN.jpg	人文社會	\N	https://www.youtube.com/c/cheapaoe/featured	免費	\N	一個好的歷史故事不外乎幾點，就是【有趣】和【真實】\n但這兩者往往背道而馳，而我的任務就是做出【有趣】又【真實】的歷史\nCheap專注於各種歷史，世界史、中國史與台灣史，我都不放過\n也喜歡講國際現勢與文化差異 (介紹摘自https://www.youtube.com/c/cheapaoe/about)	文化, 歷史	\N	國高中, 大學以上, 國小	cheap
文章/書	\N	https://i.imgur.com/VsD7co3.jpg	人文社會	\N	https://www.hk01.com/channel/61/%E5%93%B2%E5%AD%B8	免費	\N	香港01媒體哲學專欄放置了許多關於哲學的時事或是文章	哲學	\N	國高中, 大學以上	香港01媒體哲學專欄
影片	\N	https://i.imgur.com/t6f885z.jpg	人文社會	\N	https://www.youtube.com/watch?v=PavF_sLhcqQ&list=PLQYYLdlJ-teH27W_nxBV34BGb644a4Dkh	免費	\N	現象學系列，是PHEDO－台灣高中哲學教育推廣學會在六月推出的免費哲學課程，我們在每周六下午兩點會為各位更新影片。我們目前的規畫是十二週的教學，依序以胡塞爾、海德格、梅洛龐蒂為主線講述現象學的基本精神。	哲學, 歐陸哲學	\N	大學以上, 國高中	PHEDO遛哲學-現象學系列
組織/社群, 文章/書	Tiff	https://i.imgur.com/W048NMy.jpeg	人文社會	\N	https://www.cw.com.tw/	免費	\N	《天下雜誌》是台灣第一份以財經為導向的專業新聞雜誌。創立於1981年6月1日，正逢美國和中華民國斷交之時，當時擔任《華爾街日報》駐台灣記者的殷允芃，認為台灣需以經濟發展走出困境，因而與高希均、王力行共同創辦該雜誌。在它創刊第五年，《天下》三位創辦人分家，殷允芃繼續領導《天下雜誌》、高希均和王力行專注《遠見雜誌》與《天下文化》；當時主要是路線之別，殷允芃強調走新聞媒體專業並以台灣為優先，高希均希望更專注企業經營甚至擴展至大陸。	國際情勢, 社會議題, 政治, 經濟, 文化	\N	國小, 國高中, 大學以上	天下雜誌
組織/社群	\N	https://i.imgur.com/tIFQRwF.jpg	人文社會	\N	https://www.facebook.com/putsc	免費	\N	本中心以結合本校「臺灣學」相關專兼任教師，包括文學、生態、法律、民俗、 傳播等面向研究人力，必要時連結校外或民間研究資源，成立臺灣學學術研究服 務團隊，提升本校臺灣學研究風氣、回饋社會，促進國際學術交流，進而成為中 部地區臺灣學研究之重鎮為宗旨。	文化	\N	國高中, 大學以上	靜宜大學臺灣研究中心
工具/操作	袋鼠	https://i.imgur.com/yvsycrL.png	人文社會	\N	http://gissrv4.sinica.edu.tw/gis/twhgis/	免費	\N	網站由地理資訊科學研究專題中心設立，目的是要讓大家可以瞭解臺灣古地圖歷史疊圖	文化, 地理, 歷史	\N	國高中, 大學以上	台灣百年歷史地圖
組織/社群, 文章/書	Tiff	https://i.imgur.com/bvR5ILF.jpg	人文社會	\N	https://www.gvm.com.tw/	免費	\N	遠見雜誌（英語：Global Views Monthly）是中華民國一本新聞雜誌，由天下文化出版。遠見雜誌於1986年7月創刊。創辦人高希均指出，創辦《遠見》的宗旨有二：\n第一，是傳播國際知識，包括不同的領域、主題及人物，使中國人瞭解國際社會中的世界觀。\n第二，則是要提倡遠見，期盼透過媒體的報導，能夠讓讀者揚棄個人的偏見與一己的短見，代之以爭千秋的遠見。\n內容方面，以國際及兩岸間重大的趨勢、重要人物、重大事件為主要取材方向。2010年此雜誌首度舉辦「第一屆遠見雜誌環境英雄獎」。每年舉辦「服務業大調查」與「遠見五星服務獎」。	國際情勢, 社會議題, 政治, 經濟, 文化	\N	國小, 國高中, 大學以上	遠見雜誌
組織/社群, 文章/書	\N	https://i.imgur.com/2yc6u3j.png	人文社會	\N	https://www.thenewslens.com/	免費	\N	The News Lens 設立於2013年8月。我們是一群對於現今媒體不滿又想要做出一些改變的人。有一直在媒體產業的編輯，有多年在海外各地工作的專業經理人，還有對於網路技術有熱情的開發者，以及一群對於我們這個夢想有興趣，願意一起幫忙的實習生、朋友以及許多外稿作者。\n我們夢想中的媒體是除了陳述事實之外，還能夠提供多元、不同方向的觀點，並為智慧手機、平板、電腦等不同平台提供各自適合閱讀內容。也讓社交網路世代的使用者，能夠更輕鬆的分享、討論和參與他們有興趣的議題。	國際情勢, 社會議題, 傳播產業	\N	國高中, 大學以上, 國小	關鍵評論網
組織/社群	\N	https://i.imgur.com/F9kVblE.jpg	人文社會	\N	https://memory.culture.tw/	免費	\N	此網站由文化部設立，目的讓我們可以更認識台灣的文化與保存，並且邀請社會大眾共同參與台灣社會文化運動	文化, 社會議題, 公民參與	\N	國高中, 國小, 大學以上	國家文化記憶庫
組織/社群	\N	https://i.imgur.com/nzBGP2x.jpg	人文社會	\N	https://www.facebook.com/peggyetseb/?__tn__=K-R&eid=ARC7P-YRRqmxVYsy9aj_vq-OKbUDvqsFrv5cvI8l4RFhnursiXjDIAnG_unk-V7me0bAlAK7BU_-mG0y&fref=mentions&__xts__%5B0%5D=68.ARATGzq5zonLWYJcKC0p5TPlwe5fhfb6HGFVr16hr9eiWVNDGv9tIxN3Ad7SSO-ylNGc5ObL1dwAXXPxFJcljCCAmCySDR_zJuqT9qFEW6Gq3ZqU6cTDAhOBioPPjldOx8UR4T74NuZCjcYW_-FcsL315YbETayNm_4itKaVNb4wl9VnOiIVcdHkmyVAuIvYV8KAjQ8CDvm5AVaJd8ZDuE6wF4z9Tq2wVFoMrnz2nTGojfdcmakjRz3gDZmFO6zAWMCLrvo4oogyaqzl-rzMkKI-qr_AK_shyyHBVe7SYDauX4oXuBRzOivJWWMfuy0w6tBYN7P7P1XXobNBIsk	免費	\N	只是個生命旅人的日常八卦, 而且絕對主觀.迷航，同義詞為[不務正業]。\n政治系碩士，法文系講師，社會學博班，資深貪吃鬼，業餘酒國客，素人煮飯婆，隨興觀光客	國際情勢, 文化, 自媒體	\N	國高中, 大學以上	以身嗜法。法國迷航的瞬間
組織/社群	Tiff	https://i.imgur.com/dBl7emq.png	人文社會	\N	https://www.instagram.com/digidiplolab/?fbclid=IwAR2IsW048-1Z88EgmS4xmoEVfFkZd1jit2DqOSXgDYa5ct0B8Z1W6PneU14	免費	\N	台灣數位外交協會致力於推動參與式的公眾外交思維。秉持「參與，比給予更重要」的精神，以實質參與、社群在地化的方式，執行提升台灣國際社群行動的多國專案。	國際情勢, 政治	\N	國高中, 大學以上	數位外交行動計畫 Digital Diplomacy
組織/社群, 文章/書	\N	https://i.imgur.com/OPXUhIg.jpg	人文社會	\N	https://www.twreporter.org/	免費	\N	報導者，是由「財團法人報導者文化基金會」於2015年成立的非營利網路媒體，致力於公共議題的深度調查報導，其內部成員大多是資深媒體工作者，創辦人為臺灣知名媒體人何榮幸。\n報導者因以非營利基金會的模式經營，平日靠募款和讀者捐款維持運作，其網站內容採用創用CC授權條款。	國際情勢, 社會議題, 政治, 經濟, 文化, 公民參與	\N	國小, 國高中, 大學以上	報導者
組織/社群	\N	https://i.imgur.com/wr3cHOE.png	人文社會	\N	https://www.facebook.com/AseanPlusJournal/?__tn__=K-R&eid=ARBQxj4DBYqs5Sl6Cmt1qu6rQajrkzong6fZ_YNYPohV8h4oi8FHfFbXFK8NRUyr9IrZXE5C16v_wokX&fref=mentions&__xts__%5B0%5D=68.ARATGzq5zonLWYJcKC0p5TPlwe5fhfb6HGFVr16hr9eiWVNDGv9tIxN3Ad7SSO-ylNGc5ObL1dwAXXPxFJcljCCAmCySDR_zJuqT9qFEW6Gq3ZqU6cTDAhOBioPPjldOx8UR4T74NuZCjcYW_-FcsL315YbETayNm_4itKaVNb4wl9VnOiIVcdHkmyVAuIvYV8KAjQ8CDvm5AVaJd8ZDuE6wF4z9Tq2wVFoMrnz2nTGojfdcmakjRz3gDZmFO6zAWMCLrvo4oogyaqzl-rzMkKI-qr_AK_shyyHBVe7SYDauX4oXuBRzOivJWWMfuy0w6tBYN7P7P1XXobNBIsk	免費	\N	ASEAN PLUS 南洋誌是一個聚焦於東南亞國協的公益網站，我們希望透過這個資訊平台，全面提升台灣以及全球華人對於東協十國的認知程度。	國際情勢, 社會議題	\N	國高中, 大學以上	ASEAN PLUS 南洋誌
組織/社群	\N	https://i.imgur.com/AbsaD0P.png	人文社會	\N	http://www.phedotw.org/	免費	\N	台灣高中哲學教育推廣學會，英文名稱為Phedo（Philosophical Education Development Organization），致力於推廣促進高中哲學教育、高中哲學教育師資培力，並以高中哲學教育為基礎，普及哲學教育。除舉辦相關講座與論壇外，在2014年開始，每年舉行專為高中生所設計的哲學營，提昇高中生對於哲學的興趣與認知，亦接受委託、代辦各種哲學教育推廣諮詢等服務。未來計畫發行哲學教育性刊物、哲學教育叢書及資訊，營造高中哲學教育環境。	哲學	\N	國高中	PHEDO臺灣高中哲學教育推廣學會
課程/活動	\N	https://i.imgur.com/3Xp7W3x.png	人文社會	\N	https://www.viewfinder-g.tw/ec99/rwd1430/product.asp?prodid=POSM000&category_id=13	需付費	\N	後現代思潮，是因應網路時代與多元資訊社會的文化思潮。可以說，是我們當今社會脈動息息相關的重要思潮。\n在後現代思潮的系列影片中，紀金慶教授一方面將為你解析後現代思潮發生的情境背景，以及後現代思潮對於西方現代性所帶來的衝擊與革命。另一方面，並將為你介紹影響後現代思想的核心人物，從作為後現代思想開端的尼采（Nietzsche）與海德格（Heidegger），一路到自世紀70年代開始活躍至今的哲學思想，如傅柯（Foucault）、德希達（Derrida）、德勒茲（Deleuze）、布希亞（Baudrillard）、瓦蒂莫（Vattimo）與李歐塔（Lyotard）的哲學思想。\n最後，很重要的，紀金慶教授也將為你分析後現代思想的開放性與條件性，邀請你一起思考作為一個後現代情境下的現代人，我們應該如何活用後現代思想來面對眼前世界的問題。	哲學, 歐陸哲學, 後現代主義	\N	大學以上, 國高中	紀金慶｜後現代思潮(全套5集)
文章/書	\N	https://i.imgur.com/RAt7OUv.png	人文社會	\N	https://unstats.un.org/wiki/display/SDGeHandbook/Home	免費	\N	此手冊結合世界各種數據來介紹SDGS在生活中的應用	社會議題, 公民參與, SDGS, 英文介面	\N	國高中, 大學以上	SDGS指標手冊
組織/社群, 文章/書	\N	https://i.imgur.com/erIAH26.jpg	人文社會	\N	https://www.bbc.com/zhongwen/trad	免費	\N	BBC中文網是面向全球華人並每日更新的新聞資訊網站，提供客觀及時和凖確的內容以及對新聞故事的深入分析和評論。我們也提供繁體版臉書。	國際情勢, 社會議題	\N	國高中, 大學以上	BBC News中文網
組織/社群, 文章/書	\N	https://i.imgur.com/6s0TitM.jpg	人文社會	\N	https://watchout.tw	免費	\N	沃草有限公司(Watchout co.)是一個獨立媒體，希望做一個農夫，致力於提供公民更好的參與時政的空間、工具與平台。 相關產品有:總統，給問嗎?、立委出任務、國會無雙、公民學院等。	政治, 法律, 經濟, 社會議題, 公民參與	\N	國高中, 大學以上	沃草
組織/社群	Tiff	https://i.imgur.com/ZbV7mi8.jpg	人文社會	\N	https://www.facebook.com/SisyWorldNews/	免費	\N	《文茜的世界周報》最早於2005年9月3日起開播，是臺灣少數獨立製播國際新聞的新聞節目之一，由知名新聞工作者陳文茜主持。與其他同類型國際新聞節目不同，《文茜的世界周報》每週製播不同主題的專題（例如長期關注的「氣候變遷」等專題）2010年與2011年，《文茜的世界周報》與《文茜的世界財經周報》也分別獲得綜合節目獎，也先後入圍過綜合節目主持人獎。另外，2010年，陳文茜曾與工作團隊推出紀錄片《±2℃》，共同關注全球暖化議題。\n\n早期是以全球新聞觀點為主的新聞節目，2010年起重新改版，並增加對中國大陸相關新聞的製播比例，每週固定製作至少一則、至多整集的中國大陸專題。節目中多半以「中國」、「中國大陸」稱呼中國大陸。不過在國際議題則以「中國」稱之。政治立場方面，《文茜的世界周報》在國際議題上較偏向保守主義（在美國議題上則較偏向民主黨），也因此在觀點與立場方面曾受到不少批評。例如，東吳政治系教授劉必榮認為，《文茜世界周報》是做得很用心，但是過於突顯個人色彩，個人的主觀意見太多，已經失去新聞原來的邏輯。	國際情勢, 社會議題	\N	國小, 國高中, 大學以上	文茜世界周報
組織/社群, 文章/書	\N	https://i.imgur.com/ziQvHDh.png	人文社會	\N	https://plainlaw.me/	免費	\N	坊間常說，法律是保護懂法律的人。這句話聽起來諷刺，卻也是姑不而將的現實。\n\n大多數的人不懂法律，但是從小就被教導要遵守法律，許多人因為無法理解法律，所以對法律產生許多誤會，最後讓我們失去了了解彼此的機會。\n\n法律白話文運動是由期待台灣擁有法律專業媒體的法律人所組成的。我們在不同的職位上各司其職，來自不同地方、擁有不同專長，但都抱有個心願——透過白話文的方式傳播法律知識，改變台灣的法律文化。\n\n法律白話文運動的使命，就是希望能肩負起法律人與社會大眾溝通的承擔，不只告訴大家如何思考法律議題，更希望能讓社會大眾感受到自己的聲音與主張被聽見，也被法律尊重。\n\n我們相信，當每個人都感受到自己的信念被法律認真對待後，就會願意花時間傾聽、理解、思考，甚至行動。然後就會有更多人願意用法律思考問題，形成屬於台灣的民主法治文化。	法律, 國際情勢, 社會議題	\N	國高中, 大學以上	法律白話文運動
課程/活動	\N	https://i.imgur.com/UICf69n.jpg	人文社會	\N	https://www.viewfinder-g.tw/	需付費	\N	創作x思潮的專業知識平台，提供哲學、社會科學、影像、藝術等知識服務與專業育成。\n視角將學院知識轉換成大眾知識，讓知識培力更有效地在台灣社會萌芽。	哲學, 文化, 藝術	台灣	大學以上, 國高中	視角viewfinder
組織/社群	\N	https://i.imgur.com/q26cuUh.jpg	人文社會	\N	https://www.facebook.com/HappyLifeGermany/?__tn__=K-R&eid=ARCdZcizY_EepAmfE0axjca7f9PAEKJif3_4eE5LmBKaRZG9r5ATaRIvZxApjPQqiPM_p0T5O556Qnmh&fref=mentions&__xts__%5B0%5D=68.ARATGzq5zonLWYJcKC0p5TPlwe5fhfb6HGFVr16hr9eiWVNDGv9tIxN3Ad7SSO-ylNGc5ObL1dwAXXPxFJcljCCAmCySDR_zJuqT9qFEW6Gq3ZqU6cTDAhOBioPPjldOx8UR4T74NuZCjcYW_-FcsL315YbETayNm_4itKaVNb4wl9VnOiIVcdHkmyVAuIvYV8KAjQ8CDvm5AVaJd8ZDuE6wF4z9Tq2wVFoMrnz2nTGojfdcmakjRz3gDZmFO6zAWMCLrvo4oogyaqzl-rzMkKI-qr_AK_shyyHBVe7SYDauX4oXuBRzOivJWWMfuy0w6tBYN7P7P1XXobNBIsk	免費	\N	幸福德國人的台灣牽手, 朝九晚五的踏實德國上班族。在美麗的巴伐利亞, 以張張照片記錄點滴平凡的德國生活、趴趴走過的歐洲角落與各種異國美食饗宴	國際情勢, 文化, 自媒體	\N	國高中, 大學以上	德國牽手+異國記趣 Happy Life in Germany
文章/書	\N	https://i.imgur.com/aZ0kyJi.jpg	人文社會	\N	https://www.books.com.tw/products/0010887566?loc=P_0004_135	免費	\N	本書是一代政治思想家漢娜‧鄂蘭最重要的思想拼圖，試圖帶領讀者重返政治哲學的原初條件：政治是關乎眾人之事，每個人都可以帶著思考去行動、啟動新的事物，儘管彼此交互作用的結果是偶然而不可測的。amor mundi（愛這個世界）則是鄂蘭設定的原始書名，指出了閱讀切點，以及她對於基督教神學源頭奧古斯丁思想的長期思索，關乎我們如何去愛這個塵世。\n對於鄂蘭來說，人類是在啟動事物和一連串事件的意義下行動的生物，縱使能量微弱且不斷面臨各種困境，但我們永遠都可以採取進一步行動，改變或轉化那些看似無法避免的歷程。透過寬恕與承諾，我們永遠有機會解決過往之不義並興起未來之不朽，也永遠面對著黑暗與不可測知的災難；而對於這樣的開放性結局選擇奮戰不懈，正是我們以政治行動愛世界的方式。	哲學, 政治	\N	大學以上, 國高中	《人的條件》漢納鄂蘭
組織/社群	\N	https://i.imgur.com/7HnO9XL.png	人文社會	\N	https://www.facebook.com/%E5%BF%97%E7%A5%BA%E4%B8%83%E4%B8%83-231881397571066/	免費	\N	Hiho 大家好，我是志祺。\n你現在收看的是志祺七七，\n365 天不斷更的時事議題評論型頻道！\n在這裡，你會看到⋯⋯\n💡// 即時議題・堅持每日發片的時事分析//\n遇到各種議題的時候，社會上總是充滿對立。\n常常不同立場之間，只剩下謾罵，無法互相溝通、討論。\n志祺七七，剖析不同立場觀點，\n能讓關心社會上重要議題、擔心立場極化的你，\n了解不同立場的不同想法。\n藉由理解、討論，凝聚推動社會進步的信念。\n每週７天 x 每天７點 x 每次７分鐘，\n我們堅持日更，快速傳遞重要的資訊。\n💡// 多元議題・蔡英文韓國瑜都說讚 👍//\n人權、同婚、兩岸關係、中美貿易戰、能源議題、政治評論⋯⋯\n志祺七七不畏懼各種敏感議題，全盤呈現多樣化主題與觀點。\n同時，也獲得不同政治立場的一致好評！\n成為台灣唯一訪問過蔡英文、郭台銘、韓國瑜、朱立倫等一線政治人物的\n新世代時事評論員 ✨	國際情勢, 社會議題, 自媒體	\N	國小, 國高中, 大學以上	志祺七七
工具/操作	袋鼠	https://i.imgur.com/hroLWIM.jpg	人文社會	\N	http://gn.geog.ntu.edu.tw/GeoNames/GNMap/map_Admin/map/MapMain.aspx#	免費	\N	可以找到台灣地名背後的歷史小故事	文化, 地理, 歷史	\N	國高中, 大學以上	地名資訊服務網
文章/書	袋鼠	https://i.imgur.com/FKznuS7.jpg	人文社會	\N	https://taiwanstory.naer.edu.tw/index.html	免費	\N	101則臺灣的小故事，讓你認識臺灣島國意象、族群歷史、本土藝文等。	文化, 地理, 歷史	\N	國小, 國高中, 大學以上	台灣小故事101
組織/社群	\N	https://i.imgur.com/PBH9JUj.jpg	人文社會	\N	https://www.facebook.com/visionthai/?__tn__=K-R&eid=ARBHW_E-nptiS9ytnA0Pe4YqBrpR6EujEGNK7NfMrpkqspvLrTghUw_87vRgYVxsHjTOOwT6qsS2XAm3&fref=mentions&__xts__%5B0%5D=68.ARATGzq5zonLWYJcKC0p5TPlwe5fhfb6HGFVr16hr9eiWVNDGv9tIxN3Ad7SSO-ylNGc5ObL1dwAXXPxFJcljCCAmCySDR_zJuqT9qFEW6Gq3ZqU6cTDAhOBioPPjldOx8UR4T74NuZCjcYW_-FcsL315YbETayNm_4itKaVNb4wl9VnOiIVcdHkmyVAuIvYV8KAjQ8CDvm5AVaJd8ZDuE6wF4z9Tq2wVFoMrnz2nTGojfdcmakjRz3gDZmFO6zAWMCLrvo4oogyaqzl-rzMkKI-qr_AK_shyyHBVe7SYDauX4oXuBRzOivJWWMfuy0w6tBYN7P7P1XXobNBIsk	免費	\N	關於我們\n2014年創立，隸屬VT Group其中一個主要媒體品牌，為專注泰國內容的網路媒體，題材涵蓋時事、商情、旅遊、美食、文化、人物專訪...等，以影音、文字呈現優質內容，透過網站、社群媒體、影音平台傳遞。旨在打造看見泰國的新視野與可能性，閱眾包含在泰國經商、外派人士，以及中、港、台、馬...等對泰國有興趣的華文使用者。	國際情勢, 文化	\N	國高中, 大學以上	看見泰國 VisionThai．net
組織/社群, 課程/活動	\N	https://i.imgur.com/dinhsPk.jpg	人文社會	\N	http://www.wasupstudio.com	部分免費	\N	阿普蛙藉由各式議題遊戲，透過「體驗式學習」，讓學員理解民主社會的組成， 並培養公共意識、公民素養，對於社會議題產生自己的想法，提升學員的獨立思 考能力及表達能力，並實際應用在生活當中。	桌遊, 社會議題, 公民參與	\N	國小, 國高中, 大學以上	阿普蛙工作室
組織/社群	\N	https://i.imgur.com/tT9Et6r.jpeg	人文社會	\N	https://news.pts.org.tw/	免費	\N	公視新聞（PTS NEWS）是公共電視文化事業基金會（公視）新聞部製播的電視新聞節目總稱。雖然公視開播時就已設置新聞部，但受限於中華民國《公共電視法》三讀通過時立法院附帶的決議，直到2002年7月1日才開始製作每日即時新聞。與大多數的電視台一樣，公視正式新聞節目集中於每日晚上。整體而言，公視新聞因為新聞內容淨化，幾乎看不到其他台灣新聞台的腥羶色場面，且素材多元，針對民生消費、台灣政經社會、人文環境等議題報導都極為深入；相較於台灣其他商業電視台，政治新聞立場也盡量客觀，並時常邀請國內專家學者討論時事新聞；再加上主播群平穩播報風格，使得公視新聞在台灣備受推崇、得到了各方很好的評價。\n\n公視新聞主要時段分別是午間閩南語新聞節目《公視中晝新聞》、晚間閩南語新聞節目《公視暗時新聞》及晚間漢語新聞節目《公視晚間新聞》。與其他電視台多數的閩南語新聞不同，公視以直接使用台閩漢字用詞「中晝」、「暗時」來稱呼其新聞節目，展現台灣閩南語的主體性。並開設了公視台語台。	國際情勢, 社會議題, 法律, 政治, 文化	\N	國小, 國高中, 大學以上	公視新聞網
文章/書	\N	https://i.imgur.com/GDbfAF5.jpg	人文社會	\N	https://opinion.cw.com.tw/blog/profile/400	免費	\N	國際NGO工作者，專業訓練來自埃及AUC大學唸新聞，及哈佛大學甘迺迪學院。曾在緬甸北部撣邦主持農業轉作計畫近十年。2012年後轉任美國華盛頓特區國際金融組織的專門監察機構BIC（銀行信息中心）緬甸聯絡人，訓練緬甸的公民組織監督世界銀行及其他外國政府對緬甸的貸款及發展計畫。 另除協助多方停戰協商，設計戰後重建之外，也意識到真正的改變必須來自教育，從「學會問對的問題」開始，讓下一代開始接受多元社會，改變衝突的本質，因此從2015年開始，赴法國「哲學諮商學院（IPP）」師事奧斯卡．伯尼菲，學習哲學諮商，並且參與緬甸內戰衝突地區克欽邦少數民族自治區IDP難民營的哲學思考教育，終極目標是鼓勵武裝部隊想清楚「為什麼我們要打仗？」這個問題，以推動哲學思考為目標的草根哲學機構。	哲學	\N	國高中, 大學以上	天下獨立評論-褚士瑩哲學諮商室專欄
組織/社群	\N	https://i.imgur.com/yonoHqY.jpg	人文社會	\N	https://www.facebook.com/zooofdepression/	免費	\N	知名插畫家《厭世動物園》結合台灣一線桌遊團隊，推出一款「求生不得，求死不難」的桌上遊戲。透過遊戲的過程，希望反映台灣動物因為人類開發走向滅絕的無力感。	桌游, 社會議題	\N	國小, 國高中, 大學以上	動物大逃殺
文章/書	\N	https://i.imgur.com/oboEvyl.jpg	人文社會	\N	https://www.books.com.tw/products/0010669192	免費	\N	什麼是自由？ 現代人如何理解/誤解所謂「自由」？　人為什麼逃避自由？ 我們真的知道自己在追求什麼嗎？　1941年初版的《逃避自由》是佛洛姆一舉成名的著作，不但可作為兩次大戰之後社會政治現狀的詮釋，也以心理哲學角度對當代社會作了系統而強烈的批判，自發行以來風行歐美聲勢不墜，被譽為精神分析運用在社會學的傑作。　佛洛姆從心理分析出發，關照政治、文化、經濟面向，闡釋人類性格特質與社會環境互為形塑的觀點，針對現代人的意識型態和性格結構在資本社會與民主潮流下所形成的困境，作出精闢的剖析。他診斷社會病態的歷史根源，也明確開出克服困境的處方，指出人類應如何理性生活，創造幸福、建立良好的社會結構。　「傳統社會安全而不自由，現代社會自由而不安全；正是這種不安全的自由使人產生種種逃避傾向。」現代社會在資本主義和民主潮流發展下，雖以「自由」和「個體化」解放了種種束縛，卻在人性底層和集體心理引發孤獨的不安與恐懼，讓人覺得自己微不足道、無能為力，更形成與自然、社會和人際之間的疏離。因此，現代人無時無刻要逃避自由，潛意識希望回歸中世紀穩定的經濟地位和權利關係，以尋求安全和歸屬感。正是這種心理上的不健康傾向（施虐-受虐/破壞-迎合）形成法西斯主義的社會基礎，這種孤立和恐懼同時精準反映在現代人嚮往權威、跟隨流行、迎合社會標準等各種拋棄自我的行為。　現代人在自以為是的獨立品味和自主選擇背後，面臨了被資本社會和倫理斷裂制約的危機，本書讓我們對「人心為何被俘虜」有更清楚的體認，從而有勇氣思考自己真正想要什麼，發揮創造力，在自我實踐的道路上重獲「積極的自由」。\n本書特色　當我們嚮往獨立與自由時，絕大多數的時刻，我們並不懂如何享受這份權利。不管是捷運上殺時間的低頭族、追求名牌的街頭流行客，鎮日工作而失去生趣的苦悶上班族，還是重度資訊上癮的青少年……。盲從潮流與閒不下來成為現代人的基本特色，空虛與忙亂的背後反映了深沈的孤寂感，以及個體迫切與社會建立連結的安全渴望。　追求獨立自主或安全歸屬的拉踞，發展自我或社群連結的平衡，一直是現代人幸福與否的關鍵。《逃避自由》這本1940年代面世的著作出版至今已超過半世紀，但所揭櫫的課題從未過時，完全吻合你我現今的處境，讓人不得不驚嘆他的先驅視野。　本書可謂一份從精神分析和人性心理角度的切入「社會觀察報告書」。很少有心理學家像佛洛姆這樣熱烈地談論自由的價值、社會的形塑、民主政治的真義，以及個體發自內心的愛。他努力教導人如何自由而不致孤獨、自愛而不自私、理智判斷而不找合理化藉口、擁有信仰而不迷信於神學。他的著作是從社會政治到日常文化等生活各種場域的徹底檢視與反省，每個人不論你我，都能從中得到深刻的啟發和助益。	哲學, 政治, 經濟, 文化, 歷史, 人權, 存在主義, 心理學	\N	大學以上, 國高中	逃避自由-佛洛姆
組織/社群	\N	https://i.imgur.com/6MGx9bv.jpg	人文社會	\N	https://www.facebook.com/sawintaiwan/?__tn__=K-R&eid=ARAfZyHVoMDAs8TysQMD2CplOlwdEAE-JGVkRYVklGvOvVQExzakgqad0xmr74dRvMl1wZhnKI1X2dYJ&fref=mentions&__xts__%5B0%5D=68.ARATGzq5zonLWYJcKC0p5TPlwe5fhfb6HGFVr16hr9eiWVNDGv9tIxN3Ad7SSO-ylNGc5ObL1dwAXXPxFJcljCCAmCySDR_zJuqT9qFEW6Gq3ZqU6cTDAhOBioPPjldOx8UR4T74NuZCjcYW_-FcsL315YbETayNm_4itKaVNb4wl9VnOiIVcdHkmyVAuIvYV8KAjQ8CDvm5AVaJd8ZDuE6wF4z9Tq2wVFoMrnz2nTGojfdcmakjRz3gDZmFO6zAWMCLrvo4oogyaqzl-rzMkKI-qr_AK_shyyHBVe7SYDauX4oXuBRzOivJWWMfuy0w6tBYN7P7P1XXobNBIsk	免費	\N	《南亞觀察》是紮根台灣、放眼南界的南亞研究資訊平台，以不同形式的報導和多元化的題材，建立具備台灣觀點與南亞觀點的南亞知識資料庫。	國際情勢, 社會議題, 文化	\N	國高中, 大學以上	南亞觀察South Asia Watch
組織/社群	\N	https://i.imgur.com/ok85iDo.jpg	人文社會	\N	https://www.facebook.com/portugaldiary/?__tn__=K-R&eid=ARBWau9OW6u1ZhBgLNaANGRtpi0oJ-Ms8X43Ne0_MocmEZhN3FtUq9wkWbvVFR8ddeY3cwVTQ1fs4tYr&fref=mentions&__xts__%5B0%5D=68.ARATGzq5zonLWYJcKC0p5TPlwe5fhfb6HGFVr16hr9eiWVNDGv9tIxN3Ad7SSO-ylNGc5ObL1dwAXXPxFJcljCCAmCySDR_zJuqT9qFEW6Gq3ZqU6cTDAhOBioPPjldOx8UR4T74NuZCjcYW_-FcsL315YbETayNm_4itKaVNb4wl9VnOiIVcdHkmyVAuIvYV8KAjQ8CDvm5AVaJd8ZDuE6wF4z9Tq2wVFoMrnz2nTGojfdcmakjRz3gDZmFO6zAWMCLrvo4oogyaqzl-rzMkKI-qr_AK_shyyHBVe7SYDauX4oXuBRzOivJWWMfuy0w6tBYN7P7P1XXobNBIsk	免費	\N	用一點不羈的天真，帶些許現實，與你分享在葡萄牙經歷的好事與鳥事，每個印象被顛倒的時刻。\n每段境遇我都覺得自己是幸運的，極其幸運，一連串的因果機緣下到了葡萄牙這個美麗卻陌生的歐洲國家工作、生活，假日有機會也會到其他國家走跳走跳。\n也許哪天這裡會雜草叢生，但此刻我願全心全意與你分享，它如何用美與驚奇折服了我的懶惰\n而你如果來到葡萄牙，特別是Porto，我們可以一起吃頓飯或喝不習慣的下午茶，天馬行空聊，聊我們這一路上\n我不是旅行專家，但願意給你最中肯的建議，也願意幫你問當地朋友，希望你也有一趟美好的旅行，但旅程中的鳥事我不幫忙扛哈哈	文化, 自媒體	\N	國高中, 大學以上	葡萄牙顛倒日記 Diário de Portugal
組織/社群, 課程/活動	\N	https://i.imgur.com/RXZZV9b.png	人文社會	\N	https://www.facebook.com/phisocdemo/	免費	\N	工作室致力於人文社會活動的企劃與執行，主要為營隊、讀書會、分享會等等。歡迎各NGO、倡議組織、等想對青年推廣行銷理念，且願意推廣哲學思辨、公民參與、環境生態等團體合作洽談。	哲學, 政治, 社會議題, 人權	\N	國高中, 大學以上	哲學與社會民主工作室
組織/社群	\N	https://i.imgur.com/AKX7Gt8.png	人文社會	\N	https://citizenedu.tw/	免費	\N	烙哲學是由沃草公民學院所經營的一個哲學社群，致力透過哲學普及來進行公民教育。	哲學	\N	國小, 國高中, 大學以上	烙哲學交誼廳
組織/社群	\N	https://i.imgur.com/ztiaAJZ.jpg	人文社會	\N	https://www.facebook.com/Espanaprofundo/?__tn__=K-R&eid=ARB1vnYEGC4IOEx74FMly5K1iBVXWlt8MMeAj080GrnivmMmpJ6PmHuOoM75XSyvm11O7DqdpIPGKksM&fref=mentions&__xts__%5B0%5D=68.ARATGzq5zonLWYJcKC0p5TPlwe5fhfb6HGFVr16hr9eiWVNDGv9tIxN3Ad7SSO-ylNGc5ObL1dwAXXPxFJcljCCAmCySDR_zJuqT9qFEW6Gq3ZqU6cTDAhOBioPPjldOx8UR4T74NuZCjcYW_-FcsL315YbETayNm_4itKaVNb4wl9VnOiIVcdHkmyVAuIvYV8KAjQ8CDvm5AVaJd8ZDuE6wF4z9Tq2wVFoMrnz2nTGojfdcmakjRz3gDZmFO6zAWMCLrvo4oogyaqzl-rzMkKI-qr_AK_shyyHBVe7SYDauX4oXuBRzOivJWWMfuy0w6tBYN7P7P1XXobNBIsk	免費	\N	平生最大毛病為愛說實話, 視分享西班牙各種不為人知的資訊話題為維持精神健康的日課。\n\n西國大嬸傳\n\n大嬸不知何許人也，亦不用其姓字，宅於腦洞國中，引而為學焉。\n聒噪多言，不愛正經，好啃書，必求爛梗，每有梗出，必專頁分享。性嗜幽默，業務忙碌，不能常出，網友知其毛病，或鼓勵而崩壞之。爛笑話講不停，旨在生活發洩，爽過即走，從不空奢成大咖也。言詞粗陋，廢文屢空話，處處開文章空票也。亦著文章還癮，頗顛視聽。忘懷業配，以此自豪。\n茲若西國大嬸乎？酣觴寫臉書專頁以樂其志。無懷氏之民歟！葛天氏之民歟！	國際情勢, 文化, 自媒體	\N	國高中, 大學以上	深度西班牙
組織/社群	\N	https://i.imgur.com/E41QHfV.png	人文社會	\N	https://www.facebook.com/OranjeExpress.org/?__tn__=K-R&eid=ARD0esZ-LoYuf6q73fcm9vyad5cly2IRPEBb4_ZbfMwR4AxLeur-7KarjpNr4uyMf1-jeC_T3ETF82CR&fref=mentions&__xts__%5B0%5D=68.ARATGzq5zonLWYJcKC0p5TPlwe5fhfb6HGFVr16hr9eiWVNDGv9tIxN3Ad7SSO-ylNGc5ObL1dwAXXPxFJcljCCAmCySDR_zJuqT9qFEW6Gq3ZqU6cTDAhOBioPPjldOx8UR4T74NuZCjcYW_-FcsL315YbETayNm_4itKaVNb4wl9VnOiIVcdHkmyVAuIvYV8KAjQ8CDvm5AVaJd8ZDuE6wF4z9Tq2wVFoMrnz2nTGojfdcmakjRz3gDZmFO6zAWMCLrvo4oogyaqzl-rzMkKI-qr_AK_shyyHBVe7SYDauX4oXuBRzOivJWWMfuy0w6tBYN7P7P1XXobNBIsk	免費	\N	創立於2011年的荷蘭夏天，【荷事生非】是ㄧ個介紹跟討論「荷蘭」這個歐洲小國、世界大國的網路媒體平台。平台的背後，是穿梭于「旁觀者」與「在地人」兩者身份間，超過一百位深根荷蘭的報導人、專欄作家、諮詢人士，一同搭建出一個完整並且持續茁壯的資訊與知識社群【荷事研究社】。\n\n作為獨立非營利組織，【荷事生非】認為每個社會都有它的陰晴圓缺，宏遠的國際觀更需來自在地的觀察與參與。\n\n【荷事生非】專注在「人文」、「設計」、「環境」、「空間」四大面向，透過文字、影片、講座、諮詢、親身體驗各種方式，把荷蘭社會的寫實多元面向，化作資訊，提供給台灣與國際華語群眾。\n\n【荷事服務】\n我們熱愛多方合作，善於各類型的專案企劃執行。提供服務包含: 多媒體報導內容、專題研究諮詢、參訪規畫、活動講座籌辦。\n\n專案製作、服務需求、投稿或授權，請洽 info@oranjeexpress.com 。\n\n#關鍵字\n歷史、藝術、設計、資訊、循環經濟、能源、建築、城市、社區、吃喝玩樂、留學	歷史, 文化, 社會議題	\N	國高中, 大學以上	Oranje Express 荷事生非
工具/操作	\N	https://i.imgur.com/3Q6kQG7.png	人文社會	\N	http://county.ntl.edu.tw/co_page/index.php	免費	\N	此網站提供台灣的歷史記載，舉凡從土壤、地形、開拓、建設....，都可以快速了解台灣這塊寶島的點點滴滴!	文化, 歷史, 地理	\N	國高中, 大學以上	台灣方志
組織/社群, 文章/書	\N	https://i.imgur.com/nd3LYDK.jpg	人文社會	\N	https://internationalnewsstation.tw/	免費	\N	一眼看天下 – 中華民國外交部國際新聞讀報站，提供關心國際時事的民眾、國內媒體及學者專家，可一指觸達綜覽國際重要大事的全新網站。	國際情勢, 社會議題	\N	國小, 國高中, 大學以上	一眼看天下– 中華民國外交部國際新聞讀報站
組織/社群, 文章/書	\N	https://i.imgur.com/urOH2lN.jpg	人文社會	\N	https://dq.yam.com/	免費	\N	Welcome aboard！\n每天打開新聞，唉，不同的主角，雷同的故事：情色暴力，八卦毒舌，民眾不滿，政客白目，然後幾乎沒有國際新聞。\n小隊長深深相信，我們台灣人並不是不關心地球上的左鄰右舍，而是這麼小的一塊土地上，擠著好多的新聞媒體。惡劣的競爭，讓新聞用放大鏡在報導一些瑣事。其實再這樣下去，我們成見變深了，眼光變淺了，幸福變得不幸福，快樂變得不快樂。\n我們希望能打造一個讓台灣人能輕鬆上手的國際要聞網站，與其一堆文字，不如就用圖片說故事吧。這裡沒有審判，不帶情緒，也沒有艱澀的字彙。是悲，是喜，該怒，該憂，結論由自己主導。孔夫子說過，不患人之不己知，患不知人也。別老擔心別人不知道台灣多厲害，只怕我們無視別人多厲害！所以，就別再去細分你我，大家同樣身為地球人，那就一起關心地球事吧。\nWelcome aboard. It's good to see you here.\n小隊長 親啟 : 	國際情勢, 社會議題, 地理	\N	國小, 國高中, 大學以上	地球圖輯隊
文章/書	\N	https://i.imgur.com/mBZryKd.jpg	人文社會	\N	http://nccur.lib.nccu.edu.tw/retrieve/82178/700501.pdf	免費	\N	兒童哲學在台灣-毛毛蟲兒童哲學基金會發展史	哲學, 論文	\N	大學以上, 國高中	兒童哲學在台灣-毛毛蟲兒童哲學基金會發展史
文章/書	\N	https://i.imgur.com/MDzmE0l.jpg	人文社會	\N	https://www.books.com.tw/products/0010834161	免費	\N	在《偽理性》中，他以深厚的哲學功力為底，交織史學、社會學、經濟學、藝術等知識，點出造成現代人自我迷失的根源，就在於把「計算性思維」視為理性的唯一內涵，而且這種變質的理性還經常偽裝成能解決我們生命困惑的唯一解藥，使我們忘了人還有追求意義的深層需求。透過哲學反思，我們應當重新探索理性的多重樣貌，找回更有人味、也更豐盈的人生。　▌全書分三大部分──　第一章以過去一世紀以來的哲學、社會學理論，解析現代社會的本質是什麼？為何現代社會會將「生命」問題簡化成「生存」問題？是什麼原因造成現代人越來越孤獨和迷惘？　第二章則指出，現代的科學理性、技術理性與經濟理性在主流觀點下可能的盲點為何，試圖說明當現代理性為社會帶來豐碩成果的同時，其實也給人類文明帶來前所未見的惡果。　第三章透過胡塞爾、海德格、梅洛龐蒂這三位影響當代思潮甚鉅的哲學家之眼，仔細審視現代社會的結構，並希望讓現代人在遭遇生命困頓、對生活迷茫時，能有另一種關於人生的思考方向，聆聽生命的弦外之音。	哲學, 歐陸哲學, 文化, 經濟, 存在主義	\N	大學以上, 國高中	《偽理性》紀金慶
組織/社群	\N	https://i.imgur.com/oET6FiA.jpg	人文社會	\N	https://www.facebook.com/circulareconomyjr/	免費	\N	我們是群對循環經濟抱有熱忱的高中生，成員來自臺灣各地，想藉文字的力量告訴大家，循環經濟，就在你我身旁。\n一個人作夢是夢想，一群人作夢是現實，你願意跟我們一起來嗎?	經濟	\N	國高中, 大學以上	高中生的循環經濟 Circular Economy Jr.
組織/社群, 文章/書	\N	https://i.imgur.com/bgP7vvK.png	人文社會	\N	https://crossing.cw.com.tw/	免費	\N	《換日線》集結了來自全球各地超過 110 個城市的 200 名新世代作者（持續增加中），沒有長篇大論、沒有高深學問，他們就是你我身在異鄉的朋友，無私而自然地分享他們的故事、他們的見聞、他們的觀點，與他們從台灣出發，在地球不同角落留下的足跡。\n換日線 Crossing 臉書官方粉絲頁	國際情勢, 社會議題, 文化, 公民參與	\N	國小, 國高中, 大學以上	換日線
文章/書	\N	https://i.imgur.com/L7CYJR8.jpg	人文社會	\N	https://www.books.com.tw/products/0010633249	免費	\N	卡繆常被認為是提倡荒謬思想的大師，但這種簡化的描述只搆得到卡繆的創作初期。這位成長於兩次世界大戰間的文學大師，面對世界劇烈變動的景況，無可避免地去探究為何文明的發展卻帶來了巨大的破壞。他的作品《異鄉人》及《薛西弗斯的神話》思索個人面對生命的處境，因理想和現實的落差造成了荒謬感，以及個人如何面對這種荒謬。對人世充滿熱情的卡繆並不滿足於此階段的答案，他接著更進一步去討論，從個人進到與他人的關係、人類群體社會時，該又如何面對群體生命的挑戰，是更入世、更社會性的思考。　《反抗者》是卡繆處理個人與社會群體關係的重要著作，思考著種種人類社會巨大的難題：　人要脫離被奴役的身分，便必須反抗，被逼迫到一條界線時，要站出來說「不」。　如果為了反抗不義，是不是可以用盡任何手段？　若為了遠大的目標，是不是就該犧牲一切，即使是必須殺人？　反抗與革命之後，如果建立起來的社會又形成另一種壓迫專橫，該如何解決這難題？　這是卡繆處理對二十世紀巨大的法西斯政權和共產主義專政的思索，特別是後者一度被認為是人類未來社會的希望，在卡繆的時代許多思想家都熱烈擁護，但現實卻證明其墮落，如同卡繆所說的陷入虛無主義的毀滅。而從二十世紀後半的冷戰到今日，人類社會的挑戰還是籠罩在卡繆的這個思辨裡，只是當下盤據人類社會上空的權力幽靈，從政治權力轉為力量更加綿密無孔不入的經濟政治綜合體，帝國的勢力無時無刻地影響我們的生活。從專制體制紓解出來不久的人們，脫離了政治力的箝制，卻又面對了更嚴峻的考驗。　為此，思索反抗對當代的我們更形重要，如何反抗但卻不致於形成全面毀滅的虛無，或者避免反抗之後卻建立起另一座牢籠。　卡繆的推敲是我們不可或缺的永恆提醒。	哲學, 歐陸哲學, 存在主義, 政治, 文化	\N	大學以上, 國高中	《反抗者》卡繆
組織/社群	\N	https://i.imgur.com/AnUQow2.jpeg	人文社會	\N	https://www.facebook.com/RockAfricaGroup/?__tn__=K-R&eid=ARAfPC_r1FQTeSFJKWZYDs_qmJpLPmxR6M3Yh5aAcuCjqQ542upVA_o_VjVZyVUYSIB-YzDkFh0c2-fQ&fref=mentions&__xts__%5B0%5D=68.ARATGzq5zonLWYJcKC0p5TPlwe5fhfb6HGFVr16hr9eiWVNDGv9tIxN3Ad7SSO-ylNGc5ObL1dwAXXPxFJcljCCAmCySDR_zJuqT9qFEW6Gq3ZqU6cTDAhOBioPPjldOx8UR4T74NuZCjcYW_-FcsL315YbETayNm_4itKaVNb4wl9VnOiIVcdHkmyVAuIvYV8KAjQ8CDvm5AVaJd8ZDuE6wF4z9Tq2wVFoMrnz2nTGojfdcmakjRz3gDZmFO6zAWMCLrvo4oogyaqzl-rzMkKI-qr_AK_shyyHBVe7SYDauX4oXuBRzOivJWWMfuy0w6tBYN7P7P1XXobNBIsk	免費	\N	【搖滾非洲】由台飛國際志工交流協會所經營，每年協助清大教育志工及輔大醫療志工團至東非的坦尚尼亞與肯亞進行為期4~6週的服務，並持續監督與推動長期服務計畫。\n除當地志工服務外，希望透過搖滾非洲平台與分享會，和大家分享非洲相關的議題與有趣的資訊，像是非洲新創、醫療、趣聞、一手的志工觀察報導、當地NPO進行的計畫，打破單一故事的印象。\n邀請大家一同加入，成為搖滾非洲的歌手，Let's Rock Africa！	國際情勢, 文化	\N	國高中, 大學以上	搖滾非洲 Let's Rock Africa
文章/書	\N	https://i.imgur.com/BGkYGlL.jpg	人文社會	\N	https://www.books.com.tw/products/0010892961	免費	\N	【諾貝爾文學獎得主，永垂不朽的人性詰問。】　這是一份歷史的見證、眾生相的預言，　報導式的平實文字，更顯事實赤裸無情，　以及人性的真實、平庸與偉大。　●「很快，城牆裡就只剩瘋子了。」　奧蘭城的赫爾醫生，在某天如常外出巡診，　卻看見死狀悽慘的老鼠屍體，彷彿預示此城不祥的未來。　一隻接一隻的染疫老鼠傾巢而出，政府與人民依舊無所作為，　疫病很快便找上了新的宿主——人類。　●「欲證明苦難的珍貴之前，得先治好苦難。」　前所未見的瘟疫風暴席捲而來，奧蘭城民的死亡人數逐日攀升，　街頭巷尾的歡聲笑語消散無蹤，被迴還往復的救護車與靈車所取代，　瘟神就此駐留奧蘭城上空，黎明的腳步看似再也不會來到……　●「倘若來日，您所愛之人得下葬，又該如何不去面對？」　此刻原是象徵豐饒的夏秋之交，一座海港城市卻困在瘟疫腳下，　火化廠夜以繼日地運轉，悼念花束不再是偶一為之，　人人做起遲來的抗疫準備，學習與苦痛共存共生，　翹首望向季節裡的藍天豔陽，卻發現連渴盼未來的希望皆已冷卻。　●「終結了戰爭，卻讓平靜本身帶著未癒之傷。」　瘟疫如若撤手遠去，消逝的靈魂也無力重返人間，　在這場戰爭裡倖存的人們，回首才驚覺自始至終孑然一身，　如何對影自處、如何定義生命，就此成為風暴消散後的永恆命題。　從這一刻起，每個人可說與瘟疫都脫不了關係，而瘟疫帶給人們的第一件事則是放逐。沒錯，內心揮之不去的空虛、真切的情緒波動、妄想時間倒流或反之能快轉、如萬箭灼心的回憶，這些的確就是放逐的感覺。有時，我們會陷入幻想，歡喜等待親人返家的門鈴響起或樓梯間熟悉的腳步聲，當下，我們自顧自地忘記火車停駛，刻意選在以往夜快車載送旅客進城的時間留在家裡等候。	哲學, 文學, 存在主義	\N	大學以上, 國高中	《瘟疫》卡繆
組織/社群	\N	https://i.imgur.com/A0Kl5wk.png	人文社會	\N	https://www.facebook.com/CANADATPE/?__tn__=K-R&eid=ARBHo0-Z657PPbFvXQZeG_nXtd7aV-UTp35YFAJEnnvHLqWbDeWJNvRzsmR-tW9yIePj88ErXHYxqBrs&fref=mentions&__xts__%5B0%5D=68.ARATGzq5zonLWYJcKC0p5TPlwe5fhfb6HGFVr16hr9eiWVNDGv9tIxN3Ad7SSO-ylNGc5ObL1dwAXXPxFJcljCCAmCySDR_zJuqT9qFEW6Gq3ZqU6cTDAhOBioPPjldOx8UR4T74NuZCjcYW_-FcsL315YbETayNm_4itKaVNb4wl9VnOiIVcdHkmyVAuIvYV8KAjQ8CDvm5AVaJd8ZDuE6wF4z9Tq2wVFoMrnz2nTGojfdcmakjRz3gDZmFO6zAWMCLrvo4oogyaqzl-rzMkKI-qr_AK_shyyHBVe7SYDauX4oXuBRzOivJWWMfuy0w6tBYN7P7P1XXobNBIsk	免費	\N	歡迎您來到加拿大駐台北貿易辦事處的臉書。我們辦事處成立在1986年，代表加拿大對台灣的利益。過去的30餘年來，加台雙邊關係迅速成長，而現在台灣也成為加拿大在亞太地區最重要的夥伴之一。我們希望這個臉書能為大家提供更即時、更有互動性的加拿大資訊和我們的相關活動。由於這裡採雙向對話，使用的內容和語言也將取決於我們的使用者。我們將非常樂見您的回應，讓我們得以建立加拿大和台灣之間更有效也更正面的對談。	國際情勢	\N	國高中	Canadian Trade Office in Taipei | 加拿大駐台北貿易辦事處 (CTOT)
工具/操作	\N	https://i.imgur.com/XF6xTtA.png	人文社會	\N	http://mephilosophy.ccu.edu.tw/	免費	\N	『華文哲學百科計畫』由科技部經費補助，國立中正大學負責執行，將建置『華文哲學百科』為權威性、全面性、即時性、公益性的線上哲學百科全書，詞條內容涵蓋哲學議題及特定哲學家，以當代華文語彙書寫，其功能設定為延伸哲學研究者學術研究成果、提供哲學教育參考資料、進一步豐富公共文化及公民社會的溝通及思辯內涵。『華文哲學百科』之建置將以世界知名的『史丹福哲學百科』 (StanfordEncyclopedia of Philosophy) 為參考範例，由編輯委員會規劃涵蓋領域與次領域，基本詞條及硬體系統建置，建立條目寫作規範，審查詞條寫作成果，同時與哲學教育人員合作，促進哲學在華文世界之發展。在網路媒介快速興起，網路媒介參與者巨幅增加的大潮流下，『華文哲學百科』的未來願景之一是成為學院哲學家影響學術、思潮、文化觀念的一種嶄新而有效的管道。	哲學	\N	大學以上, 國高中	華文哲學百科
組織/社群, 課程/活動	\N	https://i.imgur.com/IHqdGxE.jpg	人文社會	\N	https://philomedium.com/	免費	\N	哲學新媒體 Philosophy Medium 是由一群哲學人組成的新創團隊，目標是結合哲學專業與網路新媒體，用富有創意的方式在社會上傳播哲學內容和推廣哲學教育。我們提供哲學課程、服務與產品，​以期​點燃人們對智識和思辨的熱情，滿足大眾對哲學的需求與想望。	哲學	\N	國小, 國高中, 大學以上	哲學新媒體
文章/書	\N	https://i.imgur.com/GT3k5yM.png	人文社會	\N	https://opinion.udn.com/opinion/tag/%E6%B2%83%E8%8D%89%E7%83%99%E5%93%B2%E5%AD%B8	免費	\N	我們希望，結構化的公共論域需要重新被審視，諸多流離公共論域以外的議題需要重新被有效定位。公共書寫的具體價值除實踐了書寫者的公共關懷，更多期待的是，讀者能獲致議題事件的背景知識，並據此作為行動參與的社會實踐；個人作為最小的公共主體，如何拉開公共對話的向度，落實民主的深度，就必須觀看公共論域的成熟度。	哲學, 社會議題, 政治, 文化	\N	國小, 國高中, 大學以上	沃草烙哲學
組織/社群	\N	https://i.imgur.com/mRnAuaW.jpg	人文社會	\N	https://g0v.tw	免費	https://www.youtube.com/watch?v=Zvxjo4RvnhU	g0v.tw 是一個推動資訊透明化的社群。以開放原始碼的精神為基底，關心言論自由、資訊開放。認為資訊的透明化能幫助公民更確實了解政府運作，不被媒體壟斷，並有效監督政府，化為參與行動最終深化民主體質。	公民參與	\N	國高中, 大學以上	G0V 零時政府
影片	\N	https://i.imgur.com/AIyp1Yz.jpg	人文社會	\N	https://taiwanbar.cc	免費	\N	臺灣吧成立於2014年底，致力於推出兼具資訊與娛樂性的數位內容，引發網路世代觀眾對於不同知識與議題的興趣。首部作品「動畫臺灣史」甫推出立即成風潮，除創造數百萬人次觀看外，亦催生如「黑啤與啤下組織」等角色IP，並轉化成令粉絲瘋狂的周邊商品。\n\n直至今日，臺灣吧所產出內容面向已經包含歷史、哲學、法律、教育議題、地方文化、經濟學等等。累積數千萬觀看次數、超過億分鐘觀影時間與數十萬人的YouTube與Facebook網路社群。2017年開始，「黑啤與啤下組織」正式開放商標授權，未來觀眾即將更多商品、活動與代言中看到臺灣吧角色的身影。	歷史, 哲學, 法律	\N	國小, 大學以上, 國高中	台灣吧
組織/社群, 課程/活動	\N	https://i.imgur.com/677mHl3.jpg	人文社會	\N	http://www.caterpillar.org.tw/	免費	\N	故事一開始是楊茂秀在鵝湖月刊發表了台灣一篇有關兒童哲學的故事，\n篇名就叫「哲學教室」。那是July 1975。\n白珍看到了「美國有人正在發展你想做的事。」\n她送楊茂秀一張紐約的報導蒙特克萊學院兒童促進中心（IAPC）的剪報。\n「你就不必發明輪子了，何不和李普曼博士聯絡？」白珍說，而且，她幫忙寫了信。\nIAPC立刻寄來Harry Stottlemeiers’s Discovery及正在構作的教師手冊。\n一九七六年，楊茂秀的翻譯便開始在鵝湖月刊連載。\n一九七六年的夏天，楊茂秀參加IAPC在哈佛大學舉辦的兒童哲學美國東部實驗的評議會及工作坊，為期兩星期。\n而楊茂秀是與會人士中，唯一的博士研究生。\n這一次工作坊的經驗決定了楊茂秀的兒童哲學生涯。\n一九七八年楊茂秀博士學位完成，開始在輔仁大學哲學研究所和哲學系任教，\n並開始在台北縣、台北市及基隆市的國小與國中作兒童哲學的實驗。\n一九八三年，應邀到IAPC任教。\n一九八四年，返台專心推展兒童哲學的研究與教學，\n並同時進成長兒童成長學園及孩子國幼兒園做幼教兒童哲學的實驗與師培。\n並創立了兒童哲學工作室，工作室同仁努力共同研究、翻譯IAPC的教材，\n重要著作於一九八八年大致完成，並逐年印製出版。\n一九九〇年，財團法人毛毛蟲兒童哲學基金會正式成立。\n這是個專門為支持兒童哲學台灣中心的設施。\n同一年，毛蟲兒童哲學基金會協助兒童哲學台灣中心與輔仁大學共同主辦第三屆國際兒童哲學ICPIC年會，\n出席的人士來自三十多個國家，李普曼博士、夏普…..都來了。\n有了毛毛蟲兒童哲學基金會二十多年來的主導與支持，兒童哲學台灣中心做了許多事。\n其中包括：與公私學校合作做兒童哲學師資培訓，\n接受國科會的委託與台灣大學、中正大學、清華大學、輔仁大學、主婦聯盟、板橋教師研習會合作，\n完成生態與教育的研究並完成了台灣的第一個自然生態教育的步道─芝山岩自然生態步道；\n接受文建會的支持，開啟書香滿寶島的閱讀與故事媽媽培訓；\n我們與教育部、紅十字會、廣達文教基金會等機構做災區及偏遠地區教育及心靈的重建與陪伴。\n而我們不管做什麼，都以了解兒童，了解大自然，了解哲學在人與人，\n人與大自然，人與其他生物之關係中所扮演的功能與任務做為指導原則。\n總不忘記「不要阻礙了探索的道路。」以探索社群(Community of Inquiry)做為世界公民教育的合作思考的基本素養之培育。\n兒童哲學台灣中心，目前有兩個空間：台北總部及台東中心圖畫作家，\n我們做師培、辦展覽、推展家庭關係及學校談話性閱讀，發展兒童哲學劇等等；\n我們出版IAPIC的教材、台灣本土發展有關兒童哲學的研究成果，\n我們也培訓思考故事及繪本創作的編輯與作家，我們也創辦學校 ─ 毛毛蟲學院。\n我們將努力從各種可能的方式，將哲學教育在台灣發展成為主流教育必要的元素，不只是一個教育的願景，\n正如李普曼在一次談話中表示，這是一個生活方式的建立，教育發展上的一個巨大的變革。\n→Table of Content	哲學	\N	國小	毛毛蟲兒童基金會
課程/活動	\N	https://i.imgur.com/IGiHAPM.jpg	人文社會	\N	https://himontheair.wordpress.com/	需付費	\N	生活從不只是活著，也不該只是活著——哲學家們如是說。\n只不過，他們以更精確地語言來說這件事：\n人的存在不該只是存活，而必須替自己創造出價值、採取行動來抵抗甚至開創新的歷史，否則只是存而不在！\n「生命與哲學」將介紹這三位哲人關於人類根本處境的看法，包括人性、生命本質、現代文明，以及各自提出的生命策略。\n尼采批判啟蒙運動，認為想從科學、理性來建立客觀知識，不過是基督教的思想遺緒，在人類處死上帝之後根本不可能成立。卡繆指向了這種追求的荒謬性，提出了抵抗這種荒謬才是人類真正存在的唯一方式。漢娜鄂蘭則說，一個人在態度上或行動上的抵抗不夠，必須改變歷史才是人之所為人的最高境界。	哲學, 政治, 文化	\N	大學以上, 國高中	雲端哲人
組織/社群	\N	https://i.imgur.com/88Jd5P1.png	人文社會	\N	https://www.facebook.com/taqun.taipei/	免費	\N	致力於將各種議題轉化成遊戲，期望參與者在遊戲中的互動能獲得刺激，並討論 議題，進而獲得新的見解。其作品包含:烏托邦賽局、夢想之道。	桌遊, 社會議題	\N	國高中, 大學以上	他群工作室
影片	\N	https://i.imgur.com/thb8pAx.jpg	人文社會	\N	https://www.youtube.com/watch?v=qaUUQd70Xd0&list=PLfS0WrMWEu_7Tl1dzP6D8m-RujAqLnQ8c	免費	\N	本系列的影片可以讓您更深入了解到哲學得意義與內容。	哲學	\N	大學以上, 國高中	西洋哲學史
組織/社群	\N	https://i.imgur.com/7SjkuVJ.jpg	人文社會	\N	https://www.facebook.com/DaphneAtSA/?__tn__=K-R&eid=ARADQscPblwTLWw6TYJlpkz50_FfaUC1hLp2xaKiGcsMOw_l9_2NRU9gJ_XrxV_NtqfNJRK3KnLHC3Fn&fref=mentions&__xts__%5B0%5D=68.ARATGzq5zonLWYJcKC0p5TPlwe5fhfb6HGFVr16hr9eiWVNDGv9tIxN3Ad7SSO-ylNGc5ObL1dwAXXPxFJcljCCAmCySDR_zJuqT9qFEW6Gq3ZqU6cTDAhOBioPPjldOx8UR4T74NuZCjcYW_-FcsL315YbETayNm_4itKaVNb4wl9VnOiIVcdHkmyVAuIvYV8KAjQ8CDvm5AVaJd8ZDuE6wF4z9Tq2wVFoMrnz2nTGojfdcmakjRz3gDZmFO6zAWMCLrvo4oogyaqzl-rzMkKI-qr_AK_shyyHBVe7SYDauX4oXuBRzOivJWWMfuy0w6tBYN7P7P1XXobNBIsk	免費	\N	我在南非的生活\n這個Page裡談論的無關是非對錯,我是以一個在台灣長大,,婚後在南非生活,將所遭遇到的人事物提出我的感想	國際情勢, 文化, 自媒體	\N	國高中, 大學以上	在南非的外國人
組織/社群	\N	https://i.imgur.com/4jcbYxx.png	人文社會	\N	https://www.facebook.com/shaninordic/?__tn__=K-R&eid=ARBrHMnALFTmuV8kJktD5cjfFRqF7F8dLtJ1vV3rnF3eakqr2VxZktks7ky2giv2XSjzwL7XlLIrXCQ1&fref=mentions&__xts__%5B0%5D=68.ARATGzq5zonLWYJcKC0p5TPlwe5fhfb6HGFVr16hr9eiWVNDGv9tIxN3Ad7SSO-ylNGc5ObL1dwAXXPxFJcljCCAmCySDR_zJuqT9qFEW6Gq3ZqU6cTDAhOBioPPjldOx8UR4T74NuZCjcYW_-FcsL315YbETayNm_4itKaVNb4wl9VnOiIVcdHkmyVAuIvYV8KAjQ8CDvm5AVaJd8ZDuE6wF4z9Tq2wVFoMrnz2nTGojfdcmakjRz3gDZmFO6zAWMCLrvo4oogyaqzl-rzMkKI-qr_AK_shyyHBVe7SYDauX4oXuBRzOivJWWMfuy0w6tBYN7P7P1XXobNBIsk	免費	\N	sui-Shan Tu. 凃翠珊，筆名北歐四季。也歡迎Follow我的個人帳號: https://www.facebook.com/TsuiShanTu! 北歐四季透明筆記部落格: http://life.newscandinaviandesign.com/	文化, 自媒體	\N	國高中, 大學以上	北歐四季
組織/社群	\N	https://i.imgur.com/fKb6LcN.png	人文社會	\N	https://www.facebook.com/newsfortwpage	免費	\N	由於對台灣媒體全面綜藝化的厭惡，興起了做這樣一個網站的念頭，希望可以幫助想要得到更有價值的內容的人群。這個站不論內容或是功能都還有很多需要改進的，也還有很多問題需要克服，但希望這個網站能起個頭，不管是通過這個站或是別的方式，能讓台灣群眾有更多，更好，更有價值的內容。\n\n本站主要內容都是由別的媒體而來，所有圖片與文字版權歸原作者所有，本站只是起一個收集，分享的作用。如果作者對我的使用有疑慮，歡迎與我聯繫。	國際情勢, 社會議題, 法律, 政治, 文化	\N	國高中, 大學以上	給台灣人的國際新聞
組織/社群	\N	https://i.imgur.com/n3C1Uyo.jpg	人文社會	\N	https://www.facebook.com/wowafrica.tw/?__tn__=K-R&eid=ARD4LQvK7uq7ZaXJMLGvOwBumhKdLgjAuAC8Z_F_EqlAedkMOpIU4ve1DvCMUwJHDz5eiRj-WkoL6Fj8&fref=mentions&__xts__%5B0%5D=68.ARATGzq5zonLWYJcKC0p5TPlwe5fhfb6HGFVr16hr9eiWVNDGv9tIxN3Ad7SSO-ylNGc5ObL1dwAXXPxFJcljCCAmCySDR_zJuqT9qFEW6Gq3ZqU6cTDAhOBioPPjldOx8UR4T74NuZCjcYW_-FcsL315YbETayNm_4itKaVNb4wl9VnOiIVcdHkmyVAuIvYV8KAjQ8CDvm5AVaJd8ZDuE6wF4z9Tq2wVFoMrnz2nTGojfdcmakjRz3gDZmFO6zAWMCLrvo4oogyaqzl-rzMkKI-qr_AK_shyyHBVe7SYDauX4oXuBRzOivJWWMfuy0w6tBYN7P7P1XXobNBIsk	免費	\N	打造華人圈最完整、最豐富的非洲資訊平台，期許wowAfrica阿非卡 成為資訊、人才及產業的全方位資料庫，提供認識非洲及前進非洲的最佳管道。\n「以你喜歡的方式，重新認識非洲」\nwowAfrica阿非卡是全方位的華文非洲資訊媒體，2014年於臺灣由一群年輕人成立。我們的願景是建立連結、促進兩端交流。\n非洲需要的不是憐憫，而是被重新認識的機會。\nwowAfrica阿非卡藉由網路傳播資訊，如深度報導、非洲諺語和非洲音樂系列單元，逐步協助大家擺脫戰爭、貧窮、饑荒的萬年非洲印象；同時也藉由舉辦各種主題的實體活動，如講座、展覽、主題工作坊，讓非洲朋友們在這個舞台說出他們的故事和觀點。我們希望以多元、有趣的方式讓大家放下刻板印象，在wowAfrica阿非卡這裡找到你喜歡的方式來重新認識非洲。\n以非洲為起點，看見世界脈動。	國際情勢, 文化	\N	國高中, 大學以上	WowAfrica阿非卡
組織/社群, 課程/活動	\N	https://i.imgur.com/b7JntgC.jpg	人文社會	\N	http://www.ystaiwan.org/	免費	\N	以永續台灣、扎根台灣等價值課程為主。目標在於強化青年價值思辨能力，和公民參與的行動力。 \n	地理, 法律, 政治, 經濟, 國際情勢, 社會議題, 文化, 哲學	\N	國高中, 大學以上	青平台 慕哲政經塾
組織/社群	\N	https://i.imgur.com/677mHl3.jpg	人文社會	\N	http://www.caterpillar.url.tw/en/	部分免費	\N	說故事是一種對話、是一種陪伴、是閱讀的起點、是共享也是一種送禮的行為。\n每一個故事都是一顆種子，每一位說故事的人，\n都是把種子撒進孩子的心田；\n有的會發芽，有的不會，\n有的你以為不會萌芽，卻在某天給你驚喜……\n想來毛毛蟲擔任種子故事志工嗎?\n想學習說故事的技巧回家和孩子共讀嗎?\n毛毛蟲邀請你來參加「繪本哲學閱讀推廣故事人培育」毛毛蟲故事人培育將從說故事的概念、技巧、實作，到各類型繪本賞析、選讀，圖像閱讀、語言敘事以及思考提問的智慧。帶你進入說故事的領域。\n一起送禮到孩子心理吧!	哲學	台灣	國小	毛毛蟲故事人培育
組織/社群	\N	https://i.imgur.com/dxrw0BO.jpg	人文社會	\N	https://www.facebook.com/%E7%A7%BB%E5%B7%A5%E5%9C%A8%E5%8F%B0%E7%81%A3-110999150612962/	免費	\N	\n我們是桃園市群眾服務協會，我們想從工作者第一線的視角出發，記錄庇護所的救援日常。 那些故事有時令人無奈、氣憤，有時也令人感動與熱血沸騰。	社會議題	\N	國高中, 大學以上	移工在台灣
組織/社群	\N	https://i.imgur.com/hFvUCo5.png	人文社會	\N	https://www.facebook.com/yoyoindia2013/?__tn__=K-R&eid=ARAM9R3XLgSIck5gVKloIgts2pS4HilQ9ApnP3Ny56meeuQotpPRXNsV2KvCgFXjQg6zLs0ErXCZk_EN&fref=mentions&__xts__%5B0%5D=68.ARATGzq5zonLWYJcKC0p5TPlwe5fhfb6HGFVr16hr9eiWVNDGv9tIxN3Ad7SSO-ylNGc5ObL1dwAXXPxFJcljCCAmCySDR_zJuqT9qFEW6Gq3ZqU6cTDAhOBioPPjldOx8UR4T74NuZCjcYW_-FcsL315YbETayNm_4itKaVNb4wl9VnOiIVcdHkmyVAuIvYV8KAjQ8CDvm5AVaJd8ZDuE6wF4z9Tq2wVFoMrnz2nTGojfdcmakjRz3gDZmFO6zAWMCLrvo4oogyaqzl-rzMkKI-qr_AK_shyyHBVe7SYDauX4oXuBRzOivJWWMfuy0w6tBYN7P7P1XXobNBIsk	免費	\N	台灣桃園人，現居印度新德里，頂著一個香菇頭努力享受著瘋狂的青春，盡情吃盡情玩盡情冒險，追求盡情與不同。\n常被說是怪咖，自己也覺得自己滿怪的一個人。只差一小步就跨進了果凍族世代的草莓族，最喜歡吃草莓，鼻子上的黑頭也和草莓一樣，但她不軟爛。\n 經營粉絲專頁「印度神尤遊印度」，著有「去印度打拚，走進另一個世界的中心」一書。在關鍵評論網、聯合報繽紛版、SOS平台、英語島雜誌、世界公民島雜誌、聯合報鳴人堂等多家媒體發表定期與不定期專欄文章，現職中文媒體駐印度特約記者。	國際情勢, 社會議題, 文化	\N	國小, 國高中, 大學以上	印度神尤遊印度
組織/社群, 課程/活動	\N	https://i.imgur.com/srCKZB3.png	人文社會	\N	https://yudian.org/	部分免費	\N	在這裡我們只談最純粹的學問，不只是學習，而是深刻的思想激盪。\n讓一切發生於生活，我們所關心的、曾經愛過的，都將成為可能。	哲學, 文學, 歷史, 文化	\N	大學以上, 國高中	與點堂
課程/活動	\N	https://i.imgur.com/RQUKKh6.jpg	人文社會	\N	https://www.viewfinder-g.tw/ec99/rwd1430/product.asp?prodid=CHI0206&category_id=13	需付費	\N	齊澤克（Slavoj Žižek，1949-），斯諾維尼亞哲學家，當今享譽盛名的左翼精神分析理論家。\n齊澤克的功底來自海德格與黑格爾的閱讀，揉合佛洛伊德與拉岡的精神分析理論而自成獨樹一格的思辯體系。\n不同於一般學院派的哲學家，齊澤克從不迴避甚至是可以說是有意激起各方輿論，他的每一部作品都有意識的挑起社會大眾的敏感神經。因此，齊澤克的精神分析理論在今日廣泛的滲透在政治與文化分析，也在左翼陣營裡激起不少迴響，最後也最為人熟知的，就是他對於主流文化例如網路與電影的極度關注，使得今天各式文化領域都少不了他的思想身影。	哲學, 心理學	\N	大學以上, 國高中	紀金慶｜齊澤克的精神分析哲學(全套5集)
影片	\N	https://i.imgur.com/JsCPbQE.jpg	人文社會	\N	https://www.youtube.com/watch?v=frEQBAJcygs&list=PLe8vfIFNtjRdOWgs9RSazmiQJ2BEV8SHi	免費	\N	哲學是西方人文教育的基礎，強調邏輯思辯、概念分析，思考人文價值背後的基礎。「哲學談淺淺地」由吳豐維、葉浩共同策劃。相較於各地的深入哲學研究者，我們亦不敢言深，希望由淺入深。過去哲學在黨國教育污名化之下，讓哲學教育無法在台灣深化。藉由民視台灣學堂的哲學推廣，拋磚引玉，為台灣的哲學教育，盡一份屬於這個時代的義務。	哲學	\N	國高中, 大學以上	哲學談，淺淺地
文章/書	\N	https://i.imgur.com/b1M27sU.jpg	人文社會	\N	https://www.books.com.tw/products/0010855637	免費	\N	他對別人與世界沒有意見，也不說空話，　然而他的誠實，卻變成邪惡靈魂的罪證。　莫梭是住在法屬阿爾及利亞的法國年輕人，他意外槍殺了一個阿拉伯人，被逮捕候審。這原本是一樁相對單純的案件，卻因為夏季沒什麼大新聞，就被炒成報紙上眾所矚目的大事。　莫梭平常與人保持距離、不空口說話的個性被挖出來當作反社會人格的證據；把母親送到養老院、母親過世時沒有哭泣，變成毫無良心的鐵證；在守靈夜喝咖啡抽菸，更讓人合理推斷他是個禽獸不如的傢伙。檢察官表示，被告在精神上殺死了母親，是社會敗壞的根源，請求法官判處極刑。然而，始終沒人談論那個被殺害的阿拉伯人⋯⋯　《異鄉人》展現了卡繆對世界的敏感認知。世界的荒謬性來自個人想法與現實的落差，但現實卻是奇妙的人心所構成，是眾人構成世界的荒謬。這本小說簡短卻異常有力地表現出人類社會的特性，直到今日都還切中人心。　卡繆的初試啼聲之作便受到矚目，《異鄉人》出版於一九四二年法國被占領時期，是他規劃自己第一個創作階段的起始。卡繆規劃的第一階段為「荒謬」系列，作品包括小說《異鄉人》、散文《薛西弗斯的神話》、戲劇《卡里古拉》和《誤會》。《異鄉人》是最受歡迎的作品，據統計截至二〇一一年為止，光是在法國的累計銷售量就超過了一千萬冊，是改變戰後法國文學歷史的重要作品。	哲學, 文學, 存在主義, 文化	\N	大學以上, 國高中	《異鄉人》卡繆
文章/書	\N	https://i.imgur.com/AlRylTH.jpg	人文社會	https://www.youtube.com/c/GushiTw/videos	http://storystudio.tw/	免費	https://www.youtube.com/watch?v=4mO10qt5mlk	「故事StoryStudio」於2014年成立，致力於知識傳播、公眾教育與文化體驗， 結合創意與數位技術，讓歷史與文化走進每個人的生活，和讀者一起「從生活發現歷史、 從臺灣看見世界，從過去想像未來」。\n\n\n我們期待在這個時代，創造一個屬於當代的，一份專注文化、 知識與歷史的新媒體。在一個破碎當道的時代，我們期待它能提供讀者理解世界的脈絡； 在一個扁平至上的時代，我們期待它能呈現出文化議題的深度；在一個虛實不分的時代， 我們期待它能提供真實而可靠的資訊；在一個不斷加速的年代，我們追求 slower, smarter。\n\n\n在這裏，我們希望提倡一種有根的世界主義（rooted cosmopolitanism）， 一種既能在地又能超越在地的意識；我們希望立足臺灣，同時關懷跨越國際的文化與政經議題； 我們希望召喚一群關心文化、喜愛學習新知，並對世界充滿好奇的讀者；我們希望在這個數位時代，打造一個新的知識共和國。	歷史, 文化	\N	國小, 國高中, 大學以上	故事| 寫給所有人的歷史
組織/社群, 文章/書	\N	https://i.imgur.com/gODdZrf.jpg	人文社會	\N	https://www.storm.mg/	免費	\N	「風傳媒集團」是一間從媒體、優質內容出發的網路科技公司。秉持「忠於真實，看見未來」的理念，由一群來自各個領域，對社會進步發展有熱情的人所組成。期望藉由先進的網路技術、社群的凝聚及擴散，讓多元的意見被包容接納，並開啟更多理性思辨與對話的空間，進而為社會帶來正面的影響。\n\n《風傳媒》以宏觀的視野，掌握台灣、國際、兩岸、地方的政經脈動及生活態度，用真實與進步的價值觀，持續耕耘原生新聞、深度報導及多元觀點，為全球華人提供最優質的內容，帶來對生活的美好實踐。	國際情勢, 社會議題	\N	國高中, 大學以上	譯者風傳媒
組織/社群	\N	https://i.imgur.com/H8Ug85F.jpg	人文社會	\N	https://www.facebook.com/gwenasuisse/?__tn__=K-R&eid=ARBg70bi1u7OlwrX-8ecdE5p9U01kfIDRkpoIker6alwqzZOuthIb75_F1Sa9YDGKxXuC8b1javbEAbt&fref=mentions&__xts__%5B0%5D=68.ARATGzq5zonLWYJcKC0p5TPlwe5fhfb6HGFVr16hr9eiWVNDGv9tIxN3Ad7SSO-ylNGc5ObL1dwAXXPxFJcljCCAmCySDR_zJuqT9qFEW6Gq3ZqU6cTDAhOBioPPjldOx8UR4T74NuZCjcYW_-FcsL315YbETayNm_4itKaVNb4wl9VnOiIVcdHkmyVAuIvYV8KAjQ8CDvm5AVaJd8ZDuE6wF4z9Tq2wVFoMrnz2nTGojfdcmakjRz3gDZmFO6zAWMCLrvo4oogyaqzl-rzMkKI-qr_AK_shyyHBVe7SYDauX4oXuBRzOivJWWMfuy0w6tBYN7P7P1XXobNBIsk	免費	\N	瑰娜來自台灣，定居蘇黎世，熱衷文化研究和社會觀察，著有《瑞士不簡單》、《瑞士不一樣》和《社畜，也可以很優雅》 。\n在輔大主修法文、輔系義大利文，又在蘇黎世修習德文。淡江歐洲研究所時代，寫過很正經的政經論文，現在則把「瑞士」當作研究的對象。\n旅遊世界30餘國，跑遍瑞士26邦。目前人生中最不可思議的事是和雙胞胎妹妹（緹琪）一起變成瑞士人妻。因為身兼蘇黎世州居民和弗里堡州媳婦，所以遊走於瑞士德法語區之間。思考模式就像家中的電視頻道，德語和法語台之間切來切去，但最溜的還是國台語。\n在這裡與大家分享深入瑞士生活丶社會及文化的點點滴滴。\nInstagram:  https://www.instagram.com/gwenasuisse	文化, 自媒體	\N	國高中, 大學以上	瑞士。瑰娜 All About Switzerland
組織/社群, 文章/書	\N	https://i.imgur.com/jI7odRH.jpg	人文社會	\N	https://twstreetcorner.org/	免費	\N	巷仔口部落格，主要是推廣社會學知識給大眾，特別是大一新生、非社會系學生、高中公民老師以及社會上的公民，以淺顯易懂的文字來介紹社會學的某個概念或研究。巷仔口社會學的作者群，主要是社會科學學者，針對特定的社會議題提出自己的看法，讓社會可以聽到更多元不同的聲音。	法律, 政治, 經濟, 國際情勢, 社會議題, 文化	\N	大學以上, 國高中	巷仔口社會學
影片	\N	https://i.imgur.com/glorkgn.jpg	人文社會	\N	https://www.youtube.com/playlist?list=PLe8vfIFNtjRerIiTChAcek1_1ol5MfdCc	免費	\N	民視台灣學堂帶妳探索哲學中的世界。	哲學	\N	大學以上, 國高中	【民視台灣學堂】哲學現場
組織/社群	\N	https://i.imgur.com/JkiRmh5.jpg	人文社會	\N	http://taiwancmca.blogspot.com/	免費	\N	一群關心台灣媒體環境的朋友，\n\n為了促進優質媒體文化、維護言論自由及表達自由，\n\n在2013年初成立了「台灣公民媒體文化協會」。\n\n不論做什麼，重點是集結公民力量，主動企畫、\n或協助其他倡議團體在重大議題上製作優質的媒體內容，\n以彌補主流媒體在觀點、視野及表達形式上之侷限。 \n我們的傳播平台，是數位匯流時代的網路世界。\n	傳播產業	\N	大學以上, 國高中	 台灣公民媒體文化協會
文章/書	\N	https://i.imgur.com/NdAkf7Z.jpg	人文社會	\N	https://philomedium.com/biblio/79466	免費	\N	對卡繆而言，生在這荒謬世界的人，唯一真正的角色是生存，\n對生活、反抗與自由有所覺醒。――美國文學巨擘William Faulkner\n「生命的意義在於過程。」\n諾貝爾文學獎得主卡繆一句話改變後人對於存在的思考。\n卡繆分析現代知性的趨向，以「荒謬」解讀人的存在與這個世界，\n透過哲學論述、文學批評及藝術來詮釋荒謬的概念。\n在他筆下，神話中悲慘命運的受難者，成了反抗命運及覺醒的人類精神的象徵。\n希臘神話中薛西弗斯因得罪眾神，受懲罰必須將巨石推到山頂，但到達山頂後巨石又自動滾落山腳。\n薛西弗斯得一再重複這個徒勞的過程。\n這則神話在存在主義盛行的時代，由哲學家卡繆提出了新解，對五、六○年代的思潮影響甚鉅。\n卡繆認為，不斷推動巨石上山，正象徵著人類的「生命過程」——出生、生存的掙扎與奮鬥，最後死亡，世世代代都經歷這個過程，沒有終結。這樣的生命究竟有什麼意義？\n在本書中，卡繆以洗鍊文筆探討存在的荒謬感，同時展現出與籠罩著生命的黑暗戰鬥，以及向現實挑戰的決心。\n而神話中悲慘命運的受難者，在卡繆筆下成為與命運抗爭及覺醒的人類精神象徵。	哲學, 文學, 歐陸哲學, 文化, 存在主義	\N	大學以上, 國高中	《薛西弗斯的神話》卡繆
組織/社群	\N	https://i.imgur.com/yGvNZHM.jpg	人文社會	\N	http://www.pleyschool.org	免費	\N	玩轉學校是台灣創新教育團隊，也是台灣教育領域唯一獲得B 型企業最高榮譽「對世界最好的企業」。\n從研發獨創的議題式遊戲，推出啟動孩子自主學習引擎的各項青少年課程活動，到教師研習與免費課程執行教材套，一切都是為了讓台灣的教育有更多的可能性！\n​我們相信愛玩是人類的天性，好奇是學習的起源，跟著玩轉一同探討教育的本質以及培養青少年的核心素養的方法吧！	社會議題, 公民參與	台北	國小, 國高中, 大學以上	玩轉學校
影片	\N	https://i.imgur.com/cfZN18x.jpg	人文社會	\N	https://www.youtube.com/playlist?list=PLfS0WrMWEu_6Iy2fHVrb7qPbTVlKtEJEZ	免費	\N	本課程上課的主要內容，以培養學生對於哲學思想的活用為主。並且定下十五個主題，依照講解內容、應用學習與討論議題三個步驟。文字摘自:http://get.aca.ntu.edu.tw/getcdb/handle/getcdb/395308?un=1	哲學	\N	大學以上, 國高中	活用哲學
文章/書	\N	https://i.imgur.com/3n8ANgF.png	人文社會	\N	http://eatplaylovesf.com/	免費	\N	『舊金山﹒輕生活』開始於2012年的夏天，當我離開台灣熟悉的一切，嫁給加拿大老公，且意外地定居美國舊金山。透過網路，我將與你分享舊金山當地的人文與社會觀察、趨勢與生活風尚。著有《舊金山自助超簡單》、《西洋節慶好好玩：輕鬆上手的派對指南》，並為天下雜誌《換日線 Crossing》撰寫專欄文章。	國際情勢, 自媒體	\N	國高中, 大學以上	舊金山﹒輕生活｜Eat.Play.Love in SF
文章/書	\N	https://i.imgur.com/C7i9ChU.jpg	資訊與工程	\N	https://blog.codingapeschool.com/	免費	\N	Coding APE 程式設計學校專注於為5歲到18歲兒童提供程式設計教育，並藉由程式設計教育，培養孩子邏輯分析、問題解決、創意、專注和競爭力。	程式設計, Python	\N	國高中, 大學以上	猿創力程式設計
組織/社群	\N	https://i.imgur.com/AnCa4h3.jpg	人文社會	\N	https://www.facebook.com/turkkizlaritw/?__tn__=K-R&eid=ARD6l_hLz2rYB_dZZshGFABuLH_K907F0uPU6jrA0ux4csJJsq3bFxsfaxuIhYMNhwxpZOxJ88I9Z4qa&fref=mentions&__xts__%5B0%5D=68.ARATGzq5zonLWYJcKC0p5TPlwe5fhfb6HGFVr16hr9eiWVNDGv9tIxN3Ad7SSO-ylNGc5ObL1dwAXXPxFJcljCCAmCySDR_zJuqT9qFEW6Gq3ZqU6cTDAhOBioPPjldOx8UR4T74NuZCjcYW_-FcsL315YbETayNm_4itKaVNb4wl9VnOiIVcdHkmyVAuIvYV8KAjQ8CDvm5AVaJd8ZDuE6wF4z9Tq2wVFoMrnz2nTGojfdcmakjRz3gDZmFO6zAWMCLrvo4oogyaqzl-rzMkKI-qr_AK_shyyHBVe7SYDauX4oXuBRzOivJWWMfuy0w6tBYN7P7P1XXobNBIsk	免費	\N	土耳其人文風景充滿魅力，可惜台灣人對她很陌生，學土耳其文也似乎矮其他外語一截，決心扭轉土耳其科系印象與為這美麗國家打抱不平的使命感，成為我們展開冒險的契機。冷門科系不代表沒前途！讓土女時代顛覆你的想法！	國際情勢, 文化	\N	國高中, 大學以上	土女時代｜華人全方位的土耳其網站
組織/社群, 工具/操作	\N	https://i.imgur.com/M5P8OHW.png	人文社會, 商業與社會創新	\N	https://tesas.nat.gov.tw/lflt/index.html	免費	\N	面對人口總數減少、高齡少子化，以及城鄉發展落差不均等問題， 行政院積極推動「地方創生政策」，強調相關工作推動時需配合經濟產業發展思維， 以及結合地方 DNA 與科技導入，透過適當的資料分析與統計方法， 促進跨領域協同合作，創造出嶄新價值與服務，並帶動人口的成長、青年返鄉及發展地方特色產業，形塑幸福城鄉的均衡發展面貌。(簡介摘自:https://tesas.nat.gov.tw/lflt/innovation.html)	地方創生, 社會創新, 地理, 社會議題, 文化, 公民參與	\N	國高中, 大學以上	地方創生資料庫
工具/操作	\N	https://i.imgur.com/0Ks2IjW.png	資訊與工程	\N	https://github.com/	免費	\N	GitHub為各種開源軟體(專案)的聚集地，只要專案作者公開這個專案，任何人都能存取、使用、甚至對專案的內容做出修改 (簡介摘自https://medium.com/@makerincollege2018/工程師必懂的版本控制技術-什麼是github-376421fd871d)	數位工具, 網頁設計	\N	大學以上, 國高中	GitHub
工具/操作	\N	https://i.imgur.com/4NuAKyX.png	資訊與工程	\N	https://codecombat.com/	免費	\N	Code Combat是一個給年紀大一點的孩子體驗程式教育的免費程式教育網站，有繁體中文的介面。這網站使用大量的互動式遊戲模擬程式學習，深受喜愛。\n\n資料來源：猿創力程式教育	Python, Java, C/C++, 程式設計	\N	國小, 國高中, 大學以上	CodeCombat
工具/操作	\N	https://i.imgur.com/0lRDTVw.png	資訊與工程	\N	https://zerojudge.tw 	免費	\N	此為高中生程式解題平台，但任何人都可以註冊。題庫豐富，適合具備基礎程式設計能力並想練習解題的人。可自行選擇想用來解題的程式語言。	Python, Java, 程式設計, C/C++	\N	國高中	高中生程式解題系統 zerojudge
組織/社群, 課程/活動	\N	https://i.imgur.com/FphdmWw.jpg	資訊與工程	\N	http://www.papacode.com.tw	免費	\N	利用<海霸>桌遊希望用遊戲讓孩子進入程式的世界，透過有趣的方法學程式，讓任何人都能體驗程式基本運用，​創造更好的程式教育環境！	程式設計	\N	國高中, 大學以上	程式老爹
組織/社群	\N	https://i.imgur.com/rE6dat0.png	資訊與工程	\N	https://www.facebook.com/refunstudio/	部分免費	\N	培養孩子創新思維及解決問題的能力來面對未來所有挑戰，回歸到本質去看最真實的自己，並保有不斷嘗試的心去探索自己的樂趣。	創客(maker)	\N	國小, 國高中	RE-FUN 玩轉教育
文章/書, 工具/操作	蔡孟庭	https://i.imgur.com/HNyvR36.png	資訊與工程	\N	https://blog.techbridge.cc	免費	\N	TechBridge Weekly 技術週刊團隊是一群對用技術改變世界懷抱熱情的團隊。本技術共筆部落格初期專注於Web前後端、行動網路、機器人/物聯網、數據分析與產品設計等正體中文技術原創文章或國外好文翻譯分享。	大數據, 科技, 物聯網, 人工智慧AI, 程式設計	\N	大學以上, 國高中	TechBridge 技術共筆部落格
課程/活動, 工具/操作	\N	https://i.imgur.com/ifaGx5Z.png	資訊與工程	\N	https://www.codemoji.com/	免費	\N	Codemoji主要是針對兒童設計的免費程式教育網站之一，以有趣而輕鬆的方式讓孩子學習Web開發和程式的基礎知識，利用直觀且易於使用的代碼學習方法，像是小朋友喜歡且熟悉的表情符號等，免去小朋友懼怕且討厭的語法和記憶困擾，它們可以充當包括HTML，CSS和Javascript的功能性程式標籤，讓小朋友可以自己建立網站、動畫等等，相當受歡迎。\n\n資料來源：猿創力程式教育	Python, Java, 程式設計, C/C++, JS, HTML/CSS, SQL	\N	國小, 國高中	Codemoji．com
課程/活動	\N	https://i.imgur.com/MIDDDvZ.png	資訊與工程	\N	https://orangeapple.co	需付費	\N	使用與矽谷同步的教材，提供注重思考、實做的兒童及少年程式設計教育。不只在課程中傳授程式設計的知識及技巧，更針對每一個課程精心設計活動及有趣的專題。	程式設計	台灣	國小, 國高中	橘子蘋果兒童程式學苑
工具/操作	\N	https://i.imgur.com/RV80Ulx.png	資訊與工程	\N	https://code.org/	免費	\N	適合中小學或完全初學的朋友練習，使用圖形化 Scratch 式拖拉程式設計方式。透過簡單的方式體驗程式設計的背後邏輯運作原理。\n\n資料來源：HappyCoder	程式設計	\N	國小, 國高中, 大學以上	Code.org
工具/操作	\N	https://i.imgur.com/e4nNMOi.png	資訊與工程	\N	https://scratch.mit.edu	免費	\N	「麻省理工媒體實驗室終身幼稚園組」開發的一套電腦程式開發平 台，旨在讓程式設計語言初學者不需先學習語言語法便能設計產品。	Scratch, 程式設計	\N	國小, 國高中	Scratch
組織/社群, 文章/書	\N	https://i.imgur.com/WQXWUdM.png	資訊與工程	\N	https://www.playpcesor.com	免費	\N	分享各種行動工作技巧、雲端生活應用，善用數位工具改變工作效率與生活品質。	數位工具, 終身學習, 資訊科技	\N	國高中, 大學以上	電腦玩物
工具/操作	\N	https://i.imgur.com/QEIEkMr.png	資訊與工程	\N	https://www.itread01.com/	免費	\N	從安裝到基本語法都有很完整的介紹，很適合初學者熟悉keyword的使用。 HTML CSS JAVASCRIPT JQUERY PYTHON3 PYTHON2 JAVA C C++ GO SQL都有，可以一步一步照裡面的東西學，讓學習不會變成無頭蒼蠅。\n	Python, Java, 程式設計, C/C++, JS, HTML/CSS, 資料庫, 網頁設計, SQL	\N	國高中, 大學以上	itread01
課程/活動	\N	https://i.imgur.com/qBghV0Y.png	資訊與工程	\N	https://lidemy.com/	部分免費	\N	由工程師胡立架設的 Lidemy 鋰學院，是個為初學者而生的線上程式課程平臺，初衷是讓初學者知道程式設計不難且非常有趣！作者也經常在自己的部落格分享技術教學與學習的心得：https://aszx87410.github.io/blog/medium	Python, Java, 程式設計, C/C++, JS, HTML/CSS, 資料庫, 網頁設計	\N	國小, 國高中, 大學以上	鋰學院
組織/社群	\N	https://i.imgur.com/eqosDp2.jpg	資訊與工程	\N	 https://www.facebook.com/FablabTaipei/	免費	\N	Fablab Taipei是個推廣使用數位製造工具的開放空間， 鼓勵實作與知識共享的實體社群，讓大家都可以成為一個"自造者"。	程式設計, 數位工具, 終身學習	\N	大學以上, 國高中	Fablab Taipei
工具/操作	\N	https://codesignal.com/wp-content/uploads/2020/11/CodeSignal-Logo_Circle_Blue.svg	資訊與工程	\N	https://codesignal.com/	免費	\N	CodeFights 可以讓你和世界各地的程式設計師對戰，讓寫程式變成像圍棋一樣一場場對奕，十分有趣。\n\n\n資料來源：HappyCoder	Python, Java, 程式設計, C/C++, JS, HTML/CSS, 資料庫, 網頁設計, SQL	\N	國高中, 大學以上	CodeFights
課程/活動	\N	https://i.imgur.com/Iic7CsW.png	資訊與工程	\N	https://www.ccclub.io	部分免費	\N	Coding & Co-working Club（ccClub）是由一群國立臺灣大學學生及校友組成的教學團隊。他們認為程式設計不再只是特定領域的工具，而是應該成為任何領域的人都能運用的第二專長。\n每學期開有線下課程，也有線上課程資源「跟著商管女孩一起學 Python」https://www.udemy.com/course/ccclub-python-for-beginners/	Python, 程式設計	\N	國高中, 大學以上	ccClub
文章/書	\N	https://i.imgur.com/NOsHiQM.jpg	資訊與工程	\N	https://www.happycoder.org/	免費	\N	HappyCoder 自學程式設計學院是一個自學程式設計（Programming）、電腦科學（Computer Science）交流學習社群。團隊成員擁有台大等一流學府資訊相關科系及知名上市科技與知名網路軟體新創公司業界資深工程師背景。我們致力於推廣學習程式設計運算思維和解決問題的能力。希望透過自學程式設計培養學員學習跨領域知識的自學能力！目前除了提供課程，也透過Youtube及網站提供免費的學習資源。	Python, Java, 程式設計, C/C++, JS, HTML/CSS	\N	國高中, 大學以上	HappyCoder 自學程式設計學院
課程/活動, 工具/操作	Tiff	https://i.imgur.com/nRhQq9Q.png	資訊與工程	\N	https://www.w3schools.com/	免費	\N	網頁開發設計的教學，以HTML、XML、JavaScript、PHP為主。教學頁面可以選擇語言切成繁體中文。​(參考臨安初霽)	Python, Java, 程式設計, C/C++, JS, HTML/CSS, 資料庫, 網頁設計, SQL	\N	國高中, 大學以上	W3Schools
課程/活動	蔡孟庭	https://i.imgur.com/B4jFN3K.png	資訊與工程	\N	https://feis.studio/#/c	免費	\N	臺灣大學資訊系統訓練班李根逸老師的Ｃ語言教學網站。架構清楚、內容詳盡，所有影片皆可在 YouTube 觀看。	程式設計, C/C++	\N	國高中, 大學以上	FeisStu C語言入門
課程/活動	\N	https://i.imgur.com/XDy1cIo.png	資訊與工程	\N	https://snakify.org/en/	免費	\N	Python 入門自學網站，觀念講解和題目練習並進。有「建立班級」的功能，教師於課堂中使用可以注意學生進度並從旁協助。	Python, 程式設計	\N	國高中, 大學以上	Snakify
工具/操作	\N	https://i.imgur.com/WzoS9nP.png	資訊與工程	\N	https://www.codecademy.com/	部分免費	\N	教寫程式的線上交互式平台，提供Java、Python等等基礎語言教學，也有編寫網頁CSS的課程，很適合程式自學入門。部分資源為免費。\n\n資料來源：臨安初霽	Java, Python, HTML/CSS, 程式設計	\N	國高中, 大學以上	Codecademy
工具/操作	\N	https://i.imgur.com/AzXurmn.png	數學與邏輯	\N	https://www.starfall.com/h	部分免費	\N	Starfall.com服務對象包括學前班、幼兒園、一年級、二年級和三年級的孩子，提供語言藝術和數學的內容。低成本會員計劃擴大了免費的內容，包括動畫歌曲、數學和跨越K-3的閱讀活動。會員資格還支持新書、歌曲、教育遊戲和電影的製作。該計劃強調探索、遊戲和積極的強化，鼓勵兒童變得自信和有內在動力。Starfall是兒童其他娛樂選擇的教育替代方案，對特殊教育、家庭教育和英語語言發展（ELD、ELL、ESL）特別有效。它被廣泛用於為有特殊需要和學習困難的兒童服務的學校。	英語, 數學, 邏輯	\N	學齡前, 國小	Sarfall
組織/社群	\N	https://i.imgur.com/WMSu9M4.jpeg	數學與邏輯	\N	https://www.facebook.com/groups/156709241062806/about	免費	\N	任何數學，數學學習、數學教學相關的問題都歡迎~在這裡，希望透過多元的 「微教學」，交流不同工作者的教材教法和舉例、佈題、解惑與啟發的方式。 歡迎學習者、家長，提出遇到的任何學習疑惑~也歡迎教育工作者，在此版當志工回答問題，積極協助有困惑提上來的朋友們。\n 	數學, 邏輯	\N	國高中, 大學以上	自學數學團
組織/社群, 課程/活動	\N	https://i.imgur.com/ieTJ7lG.png	數學與邏輯	\N	https://hef.org.tw/math-thinking	部分免費	\N	所有的學習都應該是「啟發」的，如果任何學習都可以在「好好玩」中進行，那學習就是件快樂的事了。\n台大數學系副教授  史英、人本想想研發中心  共同策畫編製。李遠哲、洪蘭、詹宏志  聯合推薦！	數學, 邏輯	\N	國小, 國高中, 大學以上	數學想想
組織/社群	袋鼠	https://i.imgur.com/MGzaYXK.png	數學與邏輯	\N	http://www-math.nsysu.edu.tw/~problem	免費	\N	為了激發台灣學生學習數學的風氣，中山大學數學系建置了雙週一題網路數學問題徵答，針對國高中生，甚至到大學，或是社會人士，對數學解題有興趣的。每兩周會公布一道題目，自行解出後傳至中山大學應用數學系的電子郵件信箱nsysu.problem.2019@gmail.com，期末會選出最優的學生，頒發獎狀，以資鼓勵\n	數學, 邏輯	\N	大學以上, 國高中	雙週一題網路數學問題徵答
組織/社群	\N	https://i.imgur.com/hOvaDuJ.jpg	數學與邏輯	\N	https://www.facebook.com/groups/906755429360775/about	免費	\N	 這個社團主要是要建立高中數學免費線上教學網，歡迎高中學生加入。這裡可 以免費使用教學影片，有問題可以提出來可以協助免費解答!也歡迎老師加入 解題老師義工行列，一起幫助學生解答疑惑。	數學, 邏輯	\N	國高中, 大學以上	高中數學問題討論區(含免費教學影片)
組織/社群	\N	https://i.imgur.com/JLnRzwl.png	數學與邏輯	\N	http://4rdp.blogspot.com/search/label/%E6%95%B8%E5%AD%B8%E8%80%83%E9%A1%8C?m=0	免費	\N	研發養成所版主 Bridan 是業餘數學愛好者，興趣廣泛，部落格內有各類數學考題，皆是紀錄自己親子數學教育過程中有趣的問題，許多問題具有原創性但不一定有解答，不論你是想自我挑戰還是缺少頓悟啟發，這裡應該可以找到許多寶藏。	數學, 邏輯	\N	國高中, 大學以上	研發養成所-數學考題
影片	\N	https://i.imgur.com/iL3tdqD.jpg	數學與邏輯, 教育	\N	https://www.youtube.com/channel/UC_vW48pRsAdM72Px8lr5w0Q	部分免費	\N	數感實驗室目標是讓每個人在生活中「看見數學」。我們一天一則數感動態，還開設給國小三至六年級的數學實驗課：手做、團體活動，讓同學親手感覺數學。數感教育有別於傳統學習，強調啟發與應用，每一位同學都會有自己的學習成果。我們堅持低師生比(1:4)，讓每一位學生都能與老師、助教互動，獲得即時的學習反饋。數感實驗室的Facebook粉絲專頁以及Youtube頻道都有許多免費的生活數學介紹唷！	數學, 邏輯	\N	國高中, 大學以上	數感實驗室
課程/活動	\N	https://i.imgur.com/wy3Al7G.png	數學與邏輯	\N	http://math.alearn.org.tw	免費	\N	自主學習促進會的開放數學教材。提供的服務包含國小到國中的數學學習地圖、形成性教材、小工具、臉書自學數學團。	數學, 邏輯	\N	國小, 國高中, 大學以上	自由數學
課程/活動	蔡孟庭	https://i.imgur.com/mDULvZu.png	數學與邏輯, 資訊與工程	\N	http://web.ntnu.edu.tw/~algo	免費	\N	網站內容有數學領域，包含：圖論、數論、幾何、分析、等，也有多媒體領域，包含：自然語言處理、聲音處理、影像處理、計算機圖學等。演算法教學內容詳盡易懂，常作為資訊科系學生的學習資料。	數學, 邏輯	\N	大學以上, 國高中	演算法筆記
組織/社群	\N	https://i.imgur.com/5rakzrZ.jpg	語言與文學	\N	http://www.owltale.org.tw/ap/cust_view.aspx?bid=101	免費	\N	「打開一本書，你就打開了一個世界」；書本開啟孩子的想像力，閱讀提升孩子的思考力。本協會以洞悉黑夜事物的「貓頭鷹」命名，意指處於暗處的弱勢兒童為主要的關懷對象；而讓兒童愛上閱讀，更是提供弱勢兒童獲得脫貧脫困的工具。\n \n為了幫助孩子跨越文字閱讀之鴻溝，我們採用「為孩子朗讀」的方式，讓孩子輕輕鬆鬆，與文字產生連結，進而幫助孩子理解文字的意涵；為孩子朗讀，可以讓孩子感受到文字所堆疊出來的能量；進而善用文字，擴充知識領域，提升生命深度。	中文, 台語, 英語, 閱讀, 寫作, 中文介面	\N	國小, 國高中, 大學以上	社團法人貓頭鷹親子教育協會
影片	袋鼠	https://i.imgur.com/reAM9fa.png	語言與文學	\N	https://www.youtube.com/channel/UCEwOE5MPclB1LgVfEOPTB1g	免費	\N	字源工坊教你拆解英文單字的字根、字首與自尾，讓正在學習如何背單字的大家，有更佳的學習系統!	英語, 單字, 中文介面	\N	國高中, 大學以上	字源工坊
影片	\N	https://i.imgur.com/g13aecX.png	語言與文學	\N	http://youtube.com/rayduenglish	免費	\N	透過各種有趣的主題分享英文。希望能夠讓你重新點燃對英文學習的興趣！	英語, 中文介面	\N	國小, 國高中, 大學以上	阿滴英文
課程/活動	\N	https://i.imgur.com/DuZXwSC.jpg	語言與文學	\N	http://urclass.net/AL/courseListWallR.php	免費	\N	融通以下學習資源，以支援我國學校教育與終身學習進展：\n實驗教育：含實驗教育學校、機構、團體、個人自學生。\n終身學習機構：含社區大學、社教機構。\n地方政府及其附屬單位。\n體制學校：非實驗教育之大學、高中、國中、國小、幼兒園。\n非政府組織(NGO)：如 python 社群、科學教育基金會、科普雜誌出版社……等。\n獨立教育工作者。\n催生平台化的運作機制，以每年少許「補助」，達成平台、社群對抗折舊之目標。\n透過分享精神及共享機制，減低教育資源的高低落差。\n打造台灣成為一所沒有屋頂的大學校。	中文, 多語言型學習資源, 中文介面	\N	國高中, 大學以上	跨校選修聯盟
Podcast	葦	https://i.imgur.com/BZCBl8v.png	語言與文學	\N	https://www.rusc.com	免費	\N	號稱英語廣播劇的維基百科全書。這是一個下載英語廣播劇的網站，超過 35,000部英語廣播劇可以在線聆聽或者下載。\n\n資料來源：http://www.how01.com/post_eNo0Qe2O4R51Q.html	英語, 聽力	\N	國高中, 大學以上	RUSC
課程/活動	Tiff	https://i.imgur.com/OufctO8.jpg	語言與文學	\N	https://tw.amazingtalker.com	需付費	\N	AmazingTalker 致力建立一個全面的線上學習平台，讓任何人都可以找到合適的家教，在線上學習任何語言和知識。目前主要提供語言家教的服務。\n1.堅持 1 對 1 教學：我們相信與母語家教1對1學習，有更多口說練習機會，讓學英語、日語，韓語變簡單。\n\n2.滿足各樣需求：你可以決定需要的上課時數，甚至只買一堂解決急迫的問題，如面試、簡報等。\n\n3.外語環境建構：和母語老師一起建立正確語言邏輯，遠離死背自在分享交流，讓學習變有趣。\n\n4.上課時間和價格很有彈性，此外，網站經常不定時推出優惠活動、努力了解使用者想法並作	中文, 英語, 聽力, 閱讀, 口說, 寫作, 多語言型學習資源	\N	國小, 國高中, 大學以上	Amazing Talker
APP	\N	https://i.imgur.com/LLCabvS.png	語言與文學	\N	https://play.google.com/store/apps/details?id=com.wordup.androidapp&hl=en_US&gl=US	免費	\N	免費下載app就可以使用字卡功能。\n自建自卡免費，而且和康橋字典連結，輸入單字即可選擇多個例句、意思。\n另外也可買斷商城裡的電子書，有閱讀題本，單字題本或是聽力，目前還有在持續增加教材。	英語, 單字, 中文介面	\N	國小, 國高中, 大學以上	WORD UP
文章/書	葦	https://i.imgur.com/QhI4Koe.png	語言與文學	\N	https://www.audiobooksync.com	免費	\N	AudioFile幫助你找到優質的有聲讀物。我們是有聲書的狂熱聽眾和倡導者，我們不出售有聲讀物。\n\n你可以從我們每年出版6次的印刷版中瞭解更多資訊，透過電子郵件閱讀電子報，或瀏覽我們的網站。我們的評論和獎項是獨立的、沒有偏見的。我們的出版物是由廣告和訂閱支持的。\n\n你可以在網站中獲得：1.各種主題的暢銷書、經典作品、小說、神秘事件的評論。2.專注於音頻表現。3.對作者和敘述者的採訪和幕後花絮。4.最佳有聲讀物推薦	英語, 有聲書, 聽力	\N	國高中	Audiobook Sync - AudioFile Magazine
文章/書	葦	https://i.imgur.com/gvef3NZ.jpg	語言與文學	\N	https://www.raz-kids.com	免費	\N	可以提供很長時間的系統學習。利用朗讀和文字同步的卡拉OK方式，朗讀的文字部分會自動高亮顯示。網站採用獎勵和進階制度激勵初學者聽力和閱讀。從A-Z難度逐漸提高，到了高級階段，實際上書的難度已經不低。完全可以供少兒和成人學習。其app還有錄音功能，將自己的朗讀和原聲朗讀進行對比，可以迅速提高口語。\n\n資料來源：http://www.how01.com/post_eNo0Qe2O4R51Q.html	英語, 口說	\N	國小, 學齡前	Raz-Kids
文章/書	\N	https://i.imgur.com/KVSIwbd.jpg	語言與文學	\N	https://www.unitas.me	免費	\N	聯合文學裡面有許多不同主題的文章閱讀以及關於文學相關的活動	中文, 文學	\N	國高中, 大學以上	聯合文學
工具/操作	\N	https://i.imgur.com/dOL2fNq.png	語言與文學	\N	https://www.mdnkids.com/BoPoMo	免費	\N	為國語日報所設計的注音符號發音練習，孩子點選注音符號後，會聽到該注音符號的發音。	中文, 注音符號	\N	國小, 學齡前	注音符號發音練習
文章/書	葦	https://i.imgur.com/FzWRX2E.jpeg	語言與文學	\N	https://www.storynory.com	免費	\N	這個網站是演員朗讀傳說、童話和原創故事。都可免費下載。直接點播放按鈕就可以在線聆聽，下方的Download一點就可以下載。每篇有聲書都有在線英文文本配套。\n\n資料來源：http://www.how01.com/post_eNo0Qe2O4R51Q.html	英語, 有聲書	\N	國高中, 國小	Storynory
文章/書	葦	https://i.imgur.com/CTCDzRn.png	語言與文學	\N	http://www.loyalbooks.com	免費	\N	有7000本以上的免費有聲書和電子書。關於文史哲的有聲書很多。用來進行讀書筆記的製作時對照文本閱讀，對於搞定生詞來說，比起一個個去查字典找發音要方便得多。每本書籍都有內容簡介，有聲書在線聆聽和下載各種格式的功能。有epub、kindle和text等各種格式的免費電子書的下載。\n\n資料來源：http://www.how01.com/post_eNo0Qe2O4R51Q.html	英語, 閱讀, 有聲書	\N	國高中, 國小, 大學以上	Loyalbooks
工具/操作	Tiff	https://i.imgur.com/vD7UVH4.png	語言與文學	\N	https://www.duolingo.com	免費	\N	Duolingo強調用生活化的方式學習世界上的各種語言，擁有兩大特色：第一是遊戲化的學習課程設計，激發用戶興趣與成就動力；第二是這個學習過程完全免費。	中文介面, 英語, 多語言型學習資源	\N	國小, 國高中, 大學以上, 學齡前	Duolingo
APP, 課程/活動	\N	https://i.imgur.com/e6S2AzA.png	語言與文學	\N	https://www.dw.com/de/deutsch-lernen/deutschkurse/s-2068	免費	\N	這個資源是由德國之聲（Deutsche Welle）建立，它的理念是要提供一個免費以及線上的環境的環境來讓全世界的人都可以學習德文，這個網站依照等級，提供相當多的課程及資源，而且都是免費的，我推薦的原因是——內容常與時事新聞及德國生活結合，不讓內容過於死板，而且透過練習以及單字，讓我的德文能力變更加進步。	德文, 英語, 外國文化	\N	國高中, 大學以上	DW Deutsch lernen
影片	\N	https://i.imgur.com/1U93ACZ.png	語言與文學	\N	https://www.youtube.com/channel/UCJ-HY0M0fHPAan8VfRel6cA/featured	免費	\N	為youtube頻道，頻道主是一位講台語國語腔很重，但很愛台語、日語跟廣東話的　鍵盤　語言學家！常在影片中分享他對台語的研究及看法。	台語	\N	國高中, 大學以上	鍵盤語言學家
課程/活動	\N	https://i.imgur.com/Bl9uK8k.jpg	語言與文學	\N	https://www.memrise.com/zh-hant	免費	\N	語言學習平台，提供25種語言、超過150個課程的服務。透過科學化的學習方法、有趣地學習過程以及社群化的力量和互動幫助學習。 	中文, 英語, 多語言型學習資源	\N	國小, 國高中, 大學以上	Memrise
課程/活動	\N	https://i.imgur.com/X7eZPVT.png	語言與文學	\N	https://lernu.net	免費	\N	透過各種課程學習世界語，包括文法綜覽、寫作練習、語文遊戲、閱讀、聽故事，以及各種詞典，並可與其他對世界語有興趣的人交換信息、參加虛擬課堂、聽世界語音樂，甚至觀看世界語短片。	多語言型學習資源	\N	國小, 國高中, 大學以上	Lernu
課程/活動	\N	https://i.imgur.com/9Vy9EmX.png	語言與文學	\N	https://www.thenational.academy/?fbclid=IwAR3bJ6H_PixlVbVWr23nXzR6jB_Z2xG1WhIvrlJ77bI8zhGI9T_YSEgAN-M	免費	\N	英國教師因為疫情而建置的免費線上學習平台，有超過10,000的免費課程影片與資源（如學習單等），影片可下載改編，但是不能用於商業用途。適合已經要到國外念書的小孩，可以學習學術英文，或是當初階雅思練習教材	英語, 閱讀, 聽力, 口說, 寫作	\N	國小, 國高中, 大學以上	OAK National Academy
組織/社群	\N	https://i.imgur.com/9sAD6Y1.jpeg	語言與文學	\N	https://www.facebook.com/digdeeply.mo	免費	\N	國文教育改革聯盟，深耕文學與語文教育議題，編新版國文課本。	中文	\N	國小, 國高中	深崛萌
文章/書, 工具/操作	\N	https://i.imgur.com/rQwlZLs.jpg	語言與文學	\N	http://www.mightybook.com	部分免費	\N	MightyBook.com由創始合伙人 George Fogelman 和 Betty Eaves於1999年創立，他們曾是擁有20多年課堂教學經驗的教育工作者。MightyBook.com的使命是提供娛樂性內容，幫助孩子和成人發現閱讀的樂趣和力量。\n\nMightyBook.com是一家在線出版商，主要專注於2至10歲的互動式兒童書籍和故事及歌曲的演唱。我們的故事有原創的音軌，通常有音樂和有趣的聲音效果，最初是用Macromedia/Adobe Flash製作的。故事中的文字在講故事的人說出來的時候會突出顯示。這是真正的娛樂，幫助孩子們閱讀。\n\nMightyBook.com故事的插圖具有國際色彩，來自世界各地的藝術家，包括澳大利亞、加拿大、中國、伊朗、英國、法國、巴基斯坦、南非和美國，提供了多種風格的藝術作品。所有MightyBook.com的書籍和故事歌曲都是為了在娛樂孩子的同時提高他們的閱讀能力。\n\n而且它是特殊教育和英語作為第二語言的優秀教學資源。	英語, 閱讀, 聽力	\N	學齡前, 國小	mightybook
Podcast	葦	https://i.imgur.com/sTnf2NE.png	語言與文學	\N	https://etc.usf.edu/lit2go	免費	\N	英語有聲故事和詩歌的免費下載網站。有MP3以及相應文本PDF下載。有書籍概要、播放時間和字數統計。很多書籍甚至還有學習策略介紹。用來作為課堂教學的是素材珍品，自學也是利器。\n\n資料來源：http://www.how01.com/post_eNo0Qe2O4R51Q.html	英語, 聽力, 有聲書	\N	國小, 國高中	Lit2go
組織/社群	\N	https://i.imgur.com/eitlshl.png	語言與文學	\N	https://www.facebook.com/shepherd.neihu	免費	\N	課程使用翻滾海貍工作室的教材。翻滾海貍由致力於國文轉型的教師組成，以遊戲為形式、啟發為內涵。	中文	台北	國小, 國高中	慕陽人一對一指導
文章/書	\N	https://i.imgur.com/OmaHrgV.jpg	語言與文學	\N	https://www.ebookservice.tw	免費	\N	此書庫可以讓大家線上借書並下載到電腦看，一人一年可以免費借60本，一本可以14天。此書庫由遠流出版公司與高雄政府合作，費用由政府付費，進而提倡公共借閱權。	中文, 電子書, 閱讀, 多語言型學習資源	\N	國小, 國高中, 大學以上	台灣雲端書庫
文章/書, 影片	葦	https://i.imgur.com/aoBPcm3.png	語言與文學	\N	http://www.lil-fingers.com	免費	\N	這個網站免費的有聲故事專門設計成大按鈕，小孩子可以輕鬆點擊自學。有用flash來演示關鍵英語單詞。\n\n資料來源：http://www.how01.com/post_eNo0Qe2O4R51Q.html	英語, 單字	\N	國小	lil-fingers
文章/書	\N	https://i.imgur.com/AWbIrgM.jpg	語言與文學	\N	https://tphcc.ebook.hyread.com.tw/searchList.jsp?scope=2&search_field=BSU&search_input=all&&filter=1	免費	\N	可完整借閱整本電子書，還書期限到會自動還書，但須擁有新北市圖書館借閱證才能進行線上借閱	中文, 閱讀, 寫作, 中文介面, 電子書	\N	學齡前, 國小, 國高中, 大學以上	新北市立圖書館
影片	\N	https://i.imgur.com/K2umlKr.jpg	語言與文學	\N	https://www.youtube.com/channel/UC_CvYId7QehtpTe7i4FJMlw	免費	\N	此yt頻道為淡江大學廖兆陽老師所開設的日文學習課程影片，裡面包含日文50音、動詞變化與文法教學	日文	\N	國高中, 大學以上	日文寺子屋
工具/操作	\N	https://i.imgur.com/Hni4dwv.png	語言與文學	\N	https://quizizz.com/admin/quiz/5bd884108a9dd1001a2e999f/%E6%B3%A8%E9%9F%B3%E5%BE%A9%E7%BF%92	免費	\N	為沈四白在Quiz平台所設計的注音符號練習，有各種題型，包含看圖片回答注音、句子連接等。\n	中文, 注音符號	\N	國小, 學齡前	注音符號練習-QUIZZES
工具/操作	\N	https://i.imgur.com/QyQSbRY.png	語言與文學	\N	https://www.deepl.com/translator	免費	\N	DeepL翻譯是於2017年8月由DeepL GmbH推出的翻譯服務，支援簡體中文、英語、德語、法語、日語、西班牙語、義大利語、荷蘭語及波蘭語之間的翻譯。	中文, 英語, 多語言型學習資源	\N	國小, 國高中, 大學以上	DeepL翻譯
課程/活動	\N	https://i.imgur.com/UcvIrRX.jpg	語言與文學	\N	https://www.coolenglish.edu.tw	免費	\N	Cool English網站是教育部專門為全國的國中小學生所建置的英語線上學習平臺，網站分為「學習區」與「遊戲區」，根據聽力、口說、閱讀、文法、字彙等學習方面來設計相關教材，提供多元豐富的學習資源與友善完整的學習介面，不但能削減學生對學習英語的排斥、提升學生學習效能，同時教師也能以搭配網站來建立一套更完善的教學系統。	英語, 中文介面, 聽力, 閱讀, 口說, 寫作	\N	國小, 國高中	COOL ENGLISH
文章/書	\N	https://i.imgur.com/QeLHBJO.jpg	語言與文學	\N	https://taichunggov.ebook.hyread.com.tw/searchList.jsp?scope=2&search_field=BSU&search_input=all&&filter=1	免費	\N	電子繪本、橋樑書、小說可整本完整免費借閱，借閱時間到會自動還書，不怕逾期	中文, 閱讀, 寫作, 中文介面, 電子書	\N	學齡前, 國小, 國高中, 大學以上	臺中市立圖書館
APP	\N	https://i.imgur.com/YcPnfiy.png	語言與文學	\N	https://hinative.com/zh-TW	部分免費	\N	可以讓擅長特定語言者來訂正自己的外語寫作，也可以幫忙訂正其他學習自己母語者的寫作	多語言型學習資源, 寫作, 中文介面	\N	國高中, 大學以上, 國小	HiNative
文章/書	葦	https://i.imgur.com/Yl5S1Ix.jpg	語言與文學	\N	https://lightupyourbrain.com/stories	免費	\N	這個網站的所有有聲故事都是可以免費下載的。都是由Chuck Brown叔叔朗讀的。是美式發音。\n該網站提供了23個門類的關鍵生詞的塗色卡。既可以打印出來塗色，又可以在線用電腦塗色。可以在輕鬆的娛樂中熟悉單詞的拼寫。課堂和家中均可使用。\n\n資料來源：http://www.how01.com/post_eNo0Qe2O4R51Q.html	英語, 有聲書, 聽力, 單字, 閱讀	\N	學齡前, 國小	Light Up Your Brain
影片	\N	https://i.imgur.com/WEGk48j.jpg	語言與文學	\N	https://www.youtube.com/c/GoforTCSL/featured	免費	\N	「華語教師加油站」是由國立空中大學數位華語文中心建置的YouTube頻道。\n我們的目標是解決華語教學（以華語為第二語言/外語）的疑難雜症，或是把容易誤解的迷思、理論用淺顯易懂（甚至搞笑有趣）的方式提供給各地的華語老師、教學夥伴和所有觀眾們。(介紹摘自:https://www.youtube.com/c/GoforTCSL/about)	中文, 華語文	\N	國高中, 大學以上	華語教師加油站 Go for TCSL!
組織/社群	\N	https://i.imgur.com/91nteXc.jpeg	語言與文學	\N	https://www.facebook.com/kiwifruitstudio	免費	\N	我們是做連結的文創。希望能建立這裡的文化與世界的橋樑。目前嘗試的領域有出版、奇異果版高中國文課本、底加線上平台、奇異果攝影棚與教室、底加講堂。歡迎各種合作提案。\n\n希望能做出易於閱讀的小說和社會生活類書籍。一方面讓讀者盡情享受閱讀的樂趣、滿足各式各樣幻想和慾望；另一方面則用顯淺易懂的方式回應當前的社會文化議題，並找到可能的解決方式。因此，出版方向分為兩大書系：\n【說故事】：出版奇幻、科幻、愛情、情慾、BL等類型小說。用比目前市面上大眾小說還要好的文筆來書寫順暢的大眾小說，一方面將華文創作從嚴肅文學中解放出來，另一方面則更貼近大眾、符合大眾閱讀需求。\n【好生活】：此一系列包含了寵物、旅遊、樂活、飲食、養生保健、親子、成長、心靈勵志等等，希望成為有用的心靈慰藉以及工具書。\n【緣社會】：不僅是一人一故事，社會裡更有大大小小的議題等待被敘述，尤其以特定議題為發酵的討論。 我們也有個溫柔的空間可供租借，備有音響、投影機、麥克風，適合舞蹈、瑜伽、寫作班、各類課程講座等等。	中文, 閱讀	\N	國高中	奇異果文創
影片, 文章/書	\N	https://i.imgur.com/H2R35Ni.jpg	語言與文學	\N	https://storylineonline.net	免費	\N	Storyline Online是由 SAG-AFTRA 基金會主持的一個非營利計畫，每天24小時為世界各地的兒童、家長、護理人員和教育工作者提供童書朗讀影片，此外每本書都有小學教育工作者開發的補充課程，旨在加強英語語言學習者的理解能力和口頭及書面技能。此外，此計畫會邀請演員、名人朗讀一本精彩的童書，也提供精準的故事涵義講評，甚至另外提供故事講解方法的 PDF，同時也會把童書裡的插圖，變成精彩的動畫，讓影片像是部微電影。	英語, 電子書, 聽力, 閱讀, 影片	\N	學齡前, 國小	Storyline Online 英文故事影片
課程/活動	Tiff	https://i.imgur.com/DcetqWn.png	語言與文學	\N	https://www.vipkid.com/teach	免費	\N	VIPKID是一家線上少兒英語教育公司，專注於4-12歲線上少兒英語教育，透過1對1線上視頻的方式，幫助小朋友有效學習和掌握英文。創立於2013年底，由長江商學院孵化，北極光、經緯中國、創新工場和紅杉資本和真格基金聯合投資，致力於整合全世界最優秀的北美外教，為中國小朋友提供極致、高效的英語學習體驗。通過1對1實時線上視頻學習平臺，把中國小朋友和北美外教進行連接。在VIPKID，除了語言我們同樣注重培養孩子的創造力，表達力，以及獨立思考的能力。	英語, 聽力, 閱讀, 口說, 寫作	\N	國小, 國高中, 大學以上	VIPKids
Podcast, 課程/活動, 文章/書	葦	https://i.imgur.com/lpSz1oe.jpg	語言與文學	\N	https://rachelsenglish.com	免費	\N	超過400個免費的影片，可以教美式英語的發音節奏，語調，鏈接和壓力。\n\n資料來源：http://www.how01.com/post_eNo0Qe2O4R51Q.html	英語, 口說, 單字	\N	國小, 國高中, 大學以上	Rachel's English
工具/操作	葦	https://i.imgur.com/FTbPIeY.png	語言與文學	\N	https://www.highlightskids.com	免費	\N	Highlights Kids是美國Highlights公司提供給孩子們的免費資源，包含勞作及烹飪活動教案、笑話、線上遊戲、自然探索、有聲書等免費資源。	英語, 有聲書, 聽力, 單字	\N	學齡前, 國小	Highlights Kids
影片	\N	https://i.imgur.com/3q6aFDq.jpg	語言與文學	\N	https://docs.google.com/document/d/1LGKOLchD6hAzakktHghv46e9LHrDRLHIzd6a0JnKZiM/edit?usp=sharing	免費	\N	【雲上課程讓你看見語文新風貌】\n\n🔸全人思維線上讀寫課程\n🔸家長孩子老師盡皆適宜\n🔸由經典到動畫多元文本\n🔸實作探索文本核心價值\n🔸夥伴協作共學共創成品\n🔸自己與他人思考的形狀	中文	\N	國高中	翻滾海貍線上國文課程
組織/社群	\N	https://futureparenting.cwgv.com.tw/public/assets/img/logo.png	語言與文學	\N	https://futureparenting.cwgv.com.tw	免費	\N	創刊於2014年，《未來兒童》是專為7至10歲兒童製作的綜合性雜誌，以活潑精采的圖文，和豐富廣博的內容，深入淺出，寓教於樂，吸引小讀者享受閱讀的樂趣。每期將語文、科學、數學、歷史、文化、生態、藝術等領域知識，以具有創意的形式編製專題，並邀請多位名家執筆寫作專欄；重視世界觀，每期都有全球新聞及國家報導；並以典範人物、創作故事及傳統民間故事陶冶兒童品格；透過手做、遊戲、漫畫等趣味方式，增進孩子學習的興趣，打下通識的基礎能力。\n\n防疫期間，孩子學習不打烊！《未來兒童》、《未來少年》100期精選雜誌免費線上閱讀！每周更新，停課不停學！	中文, 閱讀, 電子書	\N	國小, 國高中, 大學以上, 學齡前	未來兒童 未來少年
文章/書	\N	https://i.imgur.com/iQAYTyC.png	語言與文學	\N	https://ebook.hyread.com.tw/?gclid=CjwKCAjwzMeFBhBwEiwAzwS8zHovGv5i0rd4LtlphQh7QwE67q5wZGccSQlf7bOhMGMZvQt7rTniXxoC9GQQAvD_BwE	部分免費	\N	HyRead ebook為凌網科技於2010年創立的電子書品牌，除了是電子書供應商，也是國內第一個整合圖書館館藏、計次服務及個人購書的雲端圖書館。HyRead可以「免費租借」台灣各大圖書館中的「電子書」資源，目前與845間公共圖書館、大專院校、高中、國中小與專門圖書館皆有合作，只要下載HyRead的APP，並以圖書館的的閱覽證登入頁面後即可使用。除了免費租借各大圖書館的電子書資源，HyRead也可以使用「愛讀付費看」，以少額費用，租借電子書，又或者直接購買電子書，永久閱讀。	中文, 電子書, 閱讀, 多語言型學習資源	\N	國小, 國高中, 大學以上	HyRead
課程/活動	\N	https://i.imgur.com/P5CqeCX.jpg	語言與文學	\N	https://drive.google.com/drive/folders/1Vvaa90ayyjC2pM4lDOuthmDYqgT1kHaK?usp=sharing	免費	\N	「築壩式閱讀」是一種調度自身思考能力的閱讀方法；「築壩閱讀學習單」是課堂上環環相扣的線性提問教材。為翻滾海貍工作室口碑出版品，篇篇皆為線性提問以及融合素養情境的混合題型，跟著題目梳理文本，同步構築閱讀理解的系統性思考，讓閱讀不再是國文課的終點而能成為起點，用以導向寫作與思辨，實踐教育範式的改變！\n	中文	\N	國高中	國文築壩閱讀學習單
組織/社群	\N	https://i.imgur.com/OQ4BIlA.gif	語言與文學	\N	http://en.childrenslibrary.org	免費	\N	它是一個世界兒童圖書館，裡面介紹了許多國家不同的書籍	多語言型學習資源	\N	國高中, 大學以上	國際兒童數位圖書館
組織/社群, 課程/活動	\N	https://i.imgur.com/ZE9J2vu.png	語言與文學	\N	https://shininglife99.weebly.com	需付費	\N	語文來自於生活，也該回歸生活。 亮語有一群很愛孩子的好老師，以「五力」為核心（觀察、感思、聯想、創造、表達）， 要給孩子帶得走的語文能力、一顆柔軟的心和，學會付出的勇氣。\n\n課本作業、考試分數、獎勵榜單⋯⋯這些亮語都沒有。 亮語在乎「人」，在乎每個孩子，也重視老師的素質。 亮語擅長引導孩子自共學，讓孩子真正體會學習的快樂、學會跟夥伴溝通合作。\n\n亮語為孩子量身打造適合的課程，透過「生活觀察、營隊體驗、書刊發行、文創設計、藝術展覽、產學合作」等方式打造孩子的學習舞台。	中文	\N	國小, 國高中, 大學以上	亮語文創教育有限公司
組織/社群	\N	https://i.imgur.com/RBmwNAV.png	語言與文學	\N	https://www.instagram.com/note_japanese	免費	\N	▪️ 分享學習日文的筆記\n▪️「每日IG限動測驗」快來挑戰✨	口說, 聽力, 閱讀, 寫作, 單字, 日文	\N	國高中, 大學以上	note_japanese-マナコ日文研究室
文章/書	\N	https://i.imgur.com/5gBObvG.jpg	語言與文學	\N	https://children.moc.gov.tw/index	免費	\N	「兒童文化館」網站自1999年建置，本網站以提升兒童閱讀興趣為目標，專屬兒童線上閱讀的園地，經由長期的線上繪本閱讀素材的累積，以及更具體地將文化主題相關的閱讀內容，製作成活潑又有互動性的動畫播放與遊戲，讓兒童能以輕鬆、活潑的方式來進行閱讀，進而培養閱讀習慣。因此，特別著重在創意與互動之表現上，經由創意與互動性的設計，讓兒童親近閱讀、喜愛閱讀、擁有對閱讀的熱情！	中文, 電子書, 閱讀, 多語言型學習資源, 遊戲, 動畫, 音樂	\N	學齡前, 國小	文化部兒童文化館
文章/書, 工具/操作	葦	https://i.imgur.com/3053qDa.jpg	語言與文學	\N	http://www.kizclub.com	免費	\N	有大量免費有聲資源，它的素材是可以列印的，其有聲故事的特點是配置了極具指示性的插圖，讓學習者如同置身真實環境中。同步的朗讀發音清晰。\n\n資料來源：http://www.how01.com/post_eNo0Qe2O4R51Q.html	英語, 有聲書, 聽力, 閱讀	\N	學齡前, 國小	Kizclub
組織/社群	\N	https://i.imgur.com/wFsHNLz.png	語言與文學	\N	https://www.facebook.com/megachineseclass	免費	\N	一位教育工作者嘗試分享各種教學方式、建構式的教材，以及使用效果和相關衍生的問題，希望能找到一些突破現有教育體制的契機。	中文	\N	國高中	地表最強國文課沒有之一
文章/書	葦	https://i.imgur.com/Wftaiza.png	語言與文學	\N	https://librivox.org	免費	\N	全世界最大的自製有聲書社群，都是志願者錄製的公共版權的英語有聲書。優點是基本上出名的書都有有聲書版本，包括少有的有聲版本的文史哲書籍。學生如果要學習本學科專業著作，可以下載對應名著。\n\n資料來源：http://www.how01.com/post_eNo0Qe2O4R51Q.html	英語, 聽力, 有聲書	\N	國高中	Librivox
Podcast	葦	https://i.imgur.com/J0JQK2q.png	語言與文學	\N	https://www.audible.com	部分免費	\N	屬於amazon亞馬遜的子網站。該站從0歲到100歲以年齡級別對海量有聲書進行分類，所以可以找到適合任何年齡水平的有趣素材。這個網站是可以對全部有聲書進行幾分鐘試聽，且有聽眾的評分和聽後分析，所以非常適合用來選書。註冊試用可以一個月免費。\n\n資料來源：http://www.how01.com/post_eNo0Qe2O4R51Q.html	英語	\N	國小, 國高中, 大學以上	Audible
工具/操作	\N	https://i.imgur.com/AzXurmn.png	語言與文學	\N	https://www.starfall.com/h	免費	\N	Starfall.com服務對象包括學前班、幼兒園、一年級、二年級和三年級的孩子，提供語言藝術和數學的內容。低成本會員計劃擴大了免費的內容，包括動畫歌曲、數學和跨越K-3的閱讀活動。會員資格還支持新書、歌曲、教育遊戲和電影的製作。該計劃強調探索、遊戲和積極的強化，鼓勵兒童變得自信和有內在動力。Starfall是兒童其他娛樂選擇的教育替代方案，對特殊教育、家庭教育和英語語言發展（ELD、ELL、ESL）特別有效。它被廣泛用於為有特殊需要和學習困難的兒童服務的學校。	英語, 聽力, 閱讀	\N	國小, 學齡前	Sarfall
\.


--
-- Data for Name: old_store; Type: TABLE DATA; Schema: public; Owner: daodao
--

COPY public.old_store ("AI 摘要", "Description", "作者", "Social Image", "Tags", "Created", "Name") FROM stdin;
\N	\N	Tiff	\N	島內大小事	2024-12-13T09:16:00.000Z	讓自主學習成為一種生活方式——島島阿學品牌重塑
\N	本次探討學習的意義與內在動力，強調學習是人類的天性，並提出重新連結學習本能的重要性。內在動力來自於滿足身心需求、建立安全感、獨立探索及改善人際關係。學習不必痛苦，應該是一段愉快的旅程，並且每個人都有適合自己的學習方式。教育者應轉變為支持者，創造適合的學習環境，並鼓勵學習者主動探索個人化學習路徑。	\N	\N	自學經驗分享, 島友投稿	2024-11-19T12:29:00.000Z	你是真的不想學習嗎？
\N	本文探討台灣教育體系中存在的結構性問題，指出過度課程內容導致學生學習疲勞和心理健康問題。根據調查，許多學生因課業壓力而出現自我傷害或自殺念頭，反映出教育政策缺乏共識。作者呼籲應從「加法思維」轉向「減法思維」，重新評估課綱內容，強調教育應以學生為中心，促進自主學習，並適應當前社會需求，避免將學生的學習視為負擔。	袋鼠	\N	島友投稿	2024-11-17T02:17:00.000Z	如果什麼都要，就會什麼都抓不好！好好省思教育和學習的本質
「主題式學習」是一種以特定主題為核心的教學方式，能夠整合不同學科的內容，並鼓勵學生從生活中學習。芬蘭的經驗顯示，跨學科合作和現象為本的學習理念能有效提升學生的問題解決能力，這對台灣的教育改革具有啟示意義。教師間的合作與鼓勵學生探索生活中的學習，將有助於形成教育的正向循環。	\N	石田	\N	島友投稿	2024-10-18T08:02:00.000Z	「主題式學習」是什麼？從芬蘭經驗看台灣
\N	在現代的教育環境中，越來越多的學生出現厭學、拒學的狀態。9 月 29 日，鯨落教育聯盟舉辦了「不想上學怎麼辦？」線上講座，由楊子漠／大貍（貍想教育創辦人）、林怡廷／Tiff（島島阿學共同發起人）、沈潔伃／Joann（魚水教育催化劑創辦人）以教育工作者、親身走過厭學與自學的身份，探討學生內心的掙扎、家長與教育者的焦慮，試圖釐清厭學背後的原因，並一起尋找可能的解決之道。	楊子漠／大貍（貍想教育創辦人）、林怡廷／Tiff（島島阿學共同發起人）、沈潔伃／Joann（魚水教育催化劑創辦人）	無法獲取 URL	自學經驗分享, 島友投稿	2024-10-12T12:42:00.000Z	你是真的不想上學嗎？
\N	文章探討了「文理分組」的爭論，指出這一分類源於工業時代的專業需求，但在當今快速變化的AI時代已不再適用。文組和理組的學生各自缺乏對方領域的知識，限制了他們的學習和創新能力。作者呼籲重新思考教育的本質，促進跨學科的學習，以幫助學生開創自己的學習路徑。	石田	https://i.imgur.com/ysd9zKx.jpeg	島友投稿	2024-08-20T06:54:00.000Z	「文理之爭」還要繼續？工業時代的專業分工，給我們留下了哪些後遺症？
\N	持續更新 2023 年最新教育職缺，將以實驗教育、教育創新、各單位教育推廣、鄉村教育、特殊需求教育等職缺為主，也歡迎島友在下方留言相關職缺唷！	Tiff	https://i.imgur.com/EvD79CB.png	教育職缺	2024-02-01T02:02:00.000Z	【教育職缺彙整】2024 
\N	透過國內全人實驗中學的民主教育，來了解全人中學如何具體實現民主教育	袋鼠	https://i.imgur.com/yshx66p.jpg	民主教育	2024-01-02T10:58:00.000Z	民主教育 系列5_經典案例：全人實驗中學的民主生活
\N	透過國內全人實驗中學的民主教育，來了解全人教育之內涵	袋鼠	https://i.imgur.com/oKxSBHX.jpg	民主教育	2023-12-09T00:30:00.000Z	#民主教育 系列4_經典案例：從苗栗卓蘭看見「全人實驗中學」的啟蒙之路
\N	透過國外的民主教育的案例，來了解其意義與內涵	袋鼠	https://i.imgur.com/4GA08M2.jpg	民主教育	2023-11-10T12:19:00.000Z	#民主教育 系列3_經典案例：世界第一所民主教育學校－夏山學校
\N	了解民主教育的演變歷程	袋鼠	https://i.imgur.com/LDBzXXN.jpg	民主教育	2023-10-14T14:40:00.000Z	解密民主教育 EP2_解鎖教育的民主之源：啟發學習的演進歷程
\N	此篇彙整民主教育多元定義，以及分享島島阿學如何落實民主教育	袋鼠、Tiff	https://i.imgur.com/2lnh2Qd.png	民主教育	2023-09-16T03:14:00.000Z	解密民主教育 EP1_你知道民主教育嗎？
\N	持續更新 2023 年最新教育職缺，將以實驗教育、教育創新、各單位教育推廣、鄉村教育、特殊需求教育等職缺為主，也歡迎島友在下方留言相關職缺唷！	Tiff	https://i.imgur.com/EvD79CB.png	教育職缺	2023-07-25T09:45:00.000Z	【教育職缺彙整】2023  
\N	\N	鄧威葳	\N	島友投稿	2023-03-23T14:16:00.000Z	關於自我的實踐(覆盤我的生活模式)
\N	\N	鄧威葳	https://i.imgur.com/fEJdODH.png	島友投稿	2023-03-08T08:12:00.000Z	校園大使經驗分享
\N	\N	鄧威葳	https://i.imgur.com/lTJb2vF.png	島友投稿	2023-03-08T07:18:00.000Z	以微弱的力量帶給世界溫暖—泰北國際志工
\N	\N	芯瑜	\N	島友投稿	2023-02-01T00:52:00.000Z	什麼是目的論？學校中存在何種陷阱？
\N	\N	芯瑜	\N	島友投稿	2023-02-01T00:48:00.000Z	復盤我這學期的大學生活
\N	\N	鄧威葳	https://i.imgur.com/fGM71y1.png	島友投稿	2023-01-31T12:47:00.000Z	成為護理系的學生
\N	\N	林怡廷 / Tiff	https://i.imgur.com/eJEJE2h.jpg	自學經驗分享	2023-01-18T08:47:00.000Z	美國 Goddard College 為什麼被譽為全世界最接近民主教育的大學？(下)
\N	\N	袋鼠、Tiff(編輯)	\N	島內大小事	2023-01-16T09:29:00.000Z	【島內大小事】2023島島阿學之自學人們的小尾牙活動紀錄
\N	想要有一個自由的討論社群、活動，類似讀書會，但是不只是讀書？鹿港高中自學生邀請大家分享讀書會辦理經驗，一起來看看有什麼不同的經驗分享吧！	Yien、Tiff（編輯）	無法獲取 URL	島內大小事	2022-11-22T02:12:00.000Z	【島島阿學兩週年分享紀錄】如何籌組讀書交流人與人之間的知識？By 晏丞
\N	\N	林怡廷 / Tiff	https://i.imgur.com/TIyniEN.png	自學經驗分享	2022-10-26T14:30:00.000Z	美國 Goddard College 為什麼被譽為全世界最接近民主教育的大學？(上)
\N	\N	佳軒	\N	自學經驗分享	2022-10-20T13:21:00.000Z	【自學經驗分享】繪畫創作 by Sven
\N	自學一件熱愛的事情，常常被認為要源源不絕熱情與堅持，但如果熱情突然消退怎麼辦？\n在自學生雅雅的眼裡，熱情可以是轟轟烈烈的大火，也可以是裊裊炊煙，本來就會隨著時間與狀態改變，但讓煙飄一會兒也沒關係，終將走到心之所向。	佳軒、Tiff	\N	自學經驗分享	2022-10-20T13:15:00.000Z	【自學經驗分享】繪畫創作 by 雅雅
\N	\N	佳軒	\N	自學經驗分享	2022-10-20T12:51:00.000Z	【自學經驗分享】音樂創作Ｘ繪畫Ｘ拍攝剪輯 by 獨腳兔星人
\N	\N	Tiff	\N	島內大小事	2022-07-06T15:32:00.000Z	【島島隨筆】謝謝大家，我們入選2021親子天下教育創新100了
\N	\N	\N	\N	自學經驗分享	2022-07-06T15:24:00.000Z	【自學經驗分享】by袋鼠
\N	\N	佳軒	\N	自學經驗分享	2022-07-06T15:20:00.000Z	【自學經驗分享】多媒材藝術創作 by Joy
\N	\N	佳軒	\N	自學經驗分享	2022-07-06T15:14:00.000Z	【自學經驗分享】繪畫創作 by 亞庭
\N	\N	\N	\N	自學經驗分享	2022-07-06T14:33:00.000Z	【自學經驗分享】日文 by 芯瑜
\N	\N	\N	\N	島內大小事	2022-07-06T14:31:00.000Z	【學習方法】好好提問題
\N	\N	Tiff	\N	島內大小事	2024-12-13T09:16:00.000Z	讓自主學習成為一種生活方式——島島阿學品牌重塑
\N	本次探討學習的意義與內在動力，強調學習是人類的天性，並提出重新連結學習本能的重要性。內在動力來自於滿足身心需求、建立安全感、獨立探索及改善人際關係。學習不必痛苦，應該是一段愉快的旅程，並且每個人都有適合自己的學習方式。教育者應轉變為支持者，創造適合的學習環境，並鼓勵學習者主動探索個人化學習路徑。	\N	\N	自學經驗分享, 島友投稿	2024-11-19T12:29:00.000Z	你是真的不想學習嗎？
\N	本文探討台灣教育體系中存在的結構性問題，指出過度課程內容導致學生學習疲勞和心理健康問題。根據調查，許多學生因課業壓力而出現自我傷害或自殺念頭，反映出教育政策缺乏共識。作者呼籲應從「加法思維」轉向「減法思維」，重新評估課綱內容，強調教育應以學生為中心，促進自主學習，並適應當前社會需求，避免將學生的學習視為負擔。	袋鼠	\N	島友投稿	2024-11-17T02:17:00.000Z	如果什麼都要，就會什麼都抓不好！好好省思教育和學習的本質
「主題式學習」是一種以特定主題為核心的教學方式，能夠整合不同學科的內容，並鼓勵學生從生活中學習。芬蘭的經驗顯示，跨學科合作和現象為本的學習理念能有效提升學生的問題解決能力，這對台灣的教育改革具有啟示意義。教師間的合作與鼓勵學生探索生活中的學習，將有助於形成教育的正向循環。	\N	石田	\N	島友投稿	2024-10-18T08:02:00.000Z	「主題式學習」是什麼？從芬蘭經驗看台灣
\N	在現代的教育環境中，越來越多的學生出現厭學、拒學的狀態。9 月 29 日，鯨落教育聯盟舉辦了「不想上學怎麼辦？」線上講座，由楊子漠／大貍（貍想教育創辦人）、林怡廷／Tiff（島島阿學共同發起人）、沈潔伃／Joann（魚水教育催化劑創辦人）以教育工作者、親身走過厭學與自學的身份，探討學生內心的掙扎、家長與教育者的焦慮，試圖釐清厭學背後的原因，並一起尋找可能的解決之道。	楊子漠／大貍（貍想教育創辦人）、林怡廷／Tiff（島島阿學共同發起人）、沈潔伃／Joann（魚水教育催化劑創辦人）	無法獲取 URL	自學經驗分享, 島友投稿	2024-10-12T12:42:00.000Z	你是真的不想上學嗎？
\N	文章探討了「文理分組」的爭論，指出這一分類源於工業時代的專業需求，但在當今快速變化的AI時代已不再適用。文組和理組的學生各自缺乏對方領域的知識，限制了他們的學習和創新能力。作者呼籲重新思考教育的本質，促進跨學科的學習，以幫助學生開創自己的學習路徑。	石田	https://i.imgur.com/ysd9zKx.jpeg	島友投稿	2024-08-20T06:54:00.000Z	「文理之爭」還要繼續？工業時代的專業分工，給我們留下了哪些後遺症？
\N	持續更新 2023 年最新教育職缺，將以實驗教育、教育創新、各單位教育推廣、鄉村教育、特殊需求教育等職缺為主，也歡迎島友在下方留言相關職缺唷！	Tiff	https://i.imgur.com/EvD79CB.png	教育職缺	2024-02-01T02:02:00.000Z	【教育職缺彙整】2024 
\N	透過國內全人實驗中學的民主教育，來了解全人中學如何具體實現民主教育	袋鼠	https://i.imgur.com/yshx66p.jpg	民主教育	2024-01-02T10:58:00.000Z	民主教育 系列5_經典案例：全人實驗中學的民主生活
\N	透過國內全人實驗中學的民主教育，來了解全人教育之內涵	袋鼠	https://i.imgur.com/oKxSBHX.jpg	民主教育	2023-12-09T00:30:00.000Z	#民主教育 系列4_經典案例：從苗栗卓蘭看見「全人實驗中學」的啟蒙之路
\N	透過國外的民主教育的案例，來了解其意義與內涵	袋鼠	https://i.imgur.com/4GA08M2.jpg	民主教育	2023-11-10T12:19:00.000Z	#民主教育 系列3_經典案例：世界第一所民主教育學校－夏山學校
\N	了解民主教育的演變歷程	袋鼠	https://i.imgur.com/LDBzXXN.jpg	民主教育	2023-10-14T14:40:00.000Z	解密民主教育 EP2_解鎖教育的民主之源：啟發學習的演進歷程
\N	此篇彙整民主教育多元定義，以及分享島島阿學如何落實民主教育	袋鼠、Tiff	https://i.imgur.com/2lnh2Qd.png	民主教育	2023-09-16T03:14:00.000Z	解密民主教育 EP1_你知道民主教育嗎？
\N	持續更新 2023 年最新教育職缺，將以實驗教育、教育創新、各單位教育推廣、鄉村教育、特殊需求教育等職缺為主，也歡迎島友在下方留言相關職缺唷！	Tiff	https://i.imgur.com/EvD79CB.png	教育職缺	2023-07-25T09:45:00.000Z	【教育職缺彙整】2023  
\N	\N	鄧威葳	\N	島友投稿	2023-03-23T14:16:00.000Z	關於自我的實踐(覆盤我的生活模式)
\N	\N	鄧威葳	https://i.imgur.com/fEJdODH.png	島友投稿	2023-03-08T08:12:00.000Z	校園大使經驗分享
\N	\N	鄧威葳	https://i.imgur.com/lTJb2vF.png	島友投稿	2023-03-08T07:18:00.000Z	以微弱的力量帶給世界溫暖—泰北國際志工
\N	\N	芯瑜	\N	島友投稿	2023-02-01T00:52:00.000Z	什麼是目的論？學校中存在何種陷阱？
\N	\N	芯瑜	\N	島友投稿	2023-02-01T00:48:00.000Z	復盤我這學期的大學生活
\N	\N	鄧威葳	https://i.imgur.com/fGM71y1.png	島友投稿	2023-01-31T12:47:00.000Z	成為護理系的學生
\N	\N	林怡廷 / Tiff	https://i.imgur.com/eJEJE2h.jpg	自學經驗分享	2023-01-18T08:47:00.000Z	美國 Goddard College 為什麼被譽為全世界最接近民主教育的大學？(下)
\N	\N	袋鼠、Tiff(編輯)	\N	島內大小事	2023-01-16T09:29:00.000Z	【島內大小事】2023島島阿學之自學人們的小尾牙活動紀錄
\N	想要有一個自由的討論社群、活動，類似讀書會，但是不只是讀書？鹿港高中自學生邀請大家分享讀書會辦理經驗，一起來看看有什麼不同的經驗分享吧！	Yien、Tiff（編輯）	無法獲取 URL	島內大小事	2022-11-22T02:12:00.000Z	【島島阿學兩週年分享紀錄】如何籌組讀書交流人與人之間的知識？By 晏丞
\N	\N	林怡廷 / Tiff	https://i.imgur.com/TIyniEN.png	自學經驗分享	2022-10-26T14:30:00.000Z	美國 Goddard College 為什麼被譽為全世界最接近民主教育的大學？(上)
\N	\N	佳軒	\N	自學經驗分享	2022-10-20T13:21:00.000Z	【自學經驗分享】繪畫創作 by Sven
\N	自學一件熱愛的事情，常常被認為要源源不絕熱情與堅持，但如果熱情突然消退怎麼辦？\n在自學生雅雅的眼裡，熱情可以是轟轟烈烈的大火，也可以是裊裊炊煙，本來就會隨著時間與狀態改變，但讓煙飄一會兒也沒關係，終將走到心之所向。	佳軒、Tiff	\N	自學經驗分享	2022-10-20T13:15:00.000Z	【自學經驗分享】繪畫創作 by 雅雅
\N	\N	佳軒	\N	自學經驗分享	2022-10-20T12:51:00.000Z	【自學經驗分享】音樂創作Ｘ繪畫Ｘ拍攝剪輯 by 獨腳兔星人
\N	\N	Tiff	\N	島內大小事	2022-07-06T15:32:00.000Z	【島島隨筆】謝謝大家，我們入選2021親子天下教育創新100了
\N	\N	\N	\N	自學經驗分享	2022-07-06T15:24:00.000Z	【自學經驗分享】by袋鼠
\N	\N	佳軒	\N	自學經驗分享	2022-07-06T15:20:00.000Z	【自學經驗分享】多媒材藝術創作 by Joy
\N	\N	佳軒	\N	自學經驗分享	2022-07-06T15:14:00.000Z	【自學經驗分享】繪畫創作 by 亞庭
\N	\N	\N	\N	自學經驗分享	2022-07-06T14:33:00.000Z	【自學經驗分享】日文 by 芯瑜
\N	\N	\N	\N	島內大小事	2022-07-06T14:31:00.000Z	【學習方法】好好提問題
\.


--
-- Data for Name: old_user; Type: TABLE DATA; Schema: public; Owner: daodao
--

COPY public.old_user (mongo_id, "birthDay", "educationStage", email, gender, "googleID", name, "photoURL", "interestList", "isOpenLocation", "isOpenProfile", location, "roleList", "selfIntroduction", share, "tagList", "wantToDoList", "createdDate", "updatedDate", __v, "contactList", "isSubscribeEmail", created_at, created_by, updated_at, updated_by) FROM stdin;
669d9f36850bab2ba053a3ec	2006/10/31	university	innocent0705@gmail.com	other	116460800145010043027	小許	https://lh3.googleusercontent.com/a/ACg8ocJ3YjTVznTRc8401zw3ta7c3QaZYb5lDy3497cbCmZYM79s3LoZ=s96-c	[]	t	t	台灣@臺北市@內湖區	["citizen", "experimental-educator", "other"]	樂愛學習新事物、勇於挑戰\n\n最近在研究產品開發、商業模型、行銷策略	自主學習、網頁開發、攀岩、衝浪	{自主學習,網頁開發,攀岩,衝浪}	["interaction", "do-project"]	2024-07-21 23:52:22	2025-01-24 14:39:43	2	{"instagram": "1111111", "facebook": "", "discord": "", "line": ""}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
669dc308850bab2ba053a527	1992-02-19T16:00:00.000Z	other	viesty2004@gmail.com	female	110593879788627172728	Enn Tang	https://lh3.googleusercontent.com/a/ACg8ocJGaoxoDZS6TbInSy4EpMX7uEgPll82wz1ChP89yFwAXceB-Gb3kw=s96-c	[]	t	t	台灣@新北市@新莊區	["citizen", "normal-student"]	以設計的身份在教育產業浮沈多年，現在正在念研究所專心當學生。	設計師職能、研究所生活	{}	["interaction"]	2024-07-22 02:25:12	2024-07-24 12:14:12	1	{"instagram": "enntang", "facebook": "", "discord": "enntang", "line": ""}	f	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
669dc382850bab2ba053a538	1900/01/01	other	sarki5566@gmail.com	other	115613797333849607870	Ali Baba	https://lh3.googleusercontent.com/a/ACg8ocJhGZDZrJByhb-bE1QOyr4Ukhf4V6JDo6vz9JFbUqD2kLoz9P4=s96-c	[]	t	t	台灣@宜蘭縣@釣魚臺	["other"]	想做的事		{音樂創作}	["make-group-class", "interaction", "find-group"]	2024-07-22 02:27:14	2024-11-17 05:16:18	9	{"instagram": "404", "facebook": "Facebook", "discord": "Discord", "line": "Line"}	f	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
669dc681850bab2ba053a595	1992-12-31T16:00:00.000Z		shps30625@gmail.com	female	106045246498366364972	YIEN	https://lh3.googleusercontent.com/a/ACg8ocKm7qI50FmXT0AmQvsvFHJfoJG62bZFg7rGHH3VWkwb-A7-J526Hw=s96-c	[]	f	f	@@	["citizen"]			{}	["make-group-class", "interaction"]	2024-07-22 02:40:01	2024-07-22 02:56:52	2	{"instagram": "", "facebook": "", "discord": "", "line": ""}	f	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
669de648256188da6f9c4e30	2006/10/02	high	peichun1213@gmail.com	female	117414229572967353388	Peggy Hsieh	https://lh3.googleusercontent.com/a/ACg8ocKtvjI71v62TnV5ncc3VCW0OZecCZvpRXQVg9a9utW6q_u7-N99xA=s96-c	[]	f	t	國外	["citizen"]	在教育和學習產業擁有超過 10 年以上經驗，曾擔任教育顧問和成功大學國際處專案經理。熱衷於分享和推廣各種引導和學習體驗設計資源和概念。致力於創造對學習者有意義的學習體驗。喜歡了解和學習相關的知識和技能，包括心理學、行為科學和腦科學。\n\n目前是遠距工作者，在線上教學機構擔任 learning facilitator，同時也接案進行各類企業工作坊引導者。\n\nSign up bi-weekly newsletter [https://studiounfolding.kit.com/signup](https://studiounfolding.kit.com/signup)	各種學習體驗和引導的實踐方式; 烹飪	{學習體驗設計,引導}	["interaction", "do-project", "make-group-class"]	2024-07-22 04:55:36	2024-12-27 06:38:43	6	{"instagram": "unfoldingwithpeg", "facebook": "", "discord": "peggyhsieh", "line": ""}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
669e01a1256188da6f9c4e9c	2008-01-10T16:00:00.000Z	high	ted.lu.tw@gmail.com	male	102939242972082494682	呂顥天Hao-Tian Lu	https://lh3.googleusercontent.com/a/ACg8ocJepWvlGccWxGgiGMyC-8UrBjUQJQRLWut6o26mmI6h1P8qCCbD=s96-c	[]	t	t	台灣@新北市@中和區	["experimental-education-student"]	居住於新北市的高中生，看似興趣多元到喊出類組時像在倒數三二一，實際上是個偶爾裝成文組寫寫詩的理工阿宅。熱愛跨界連結，用科技解決社會議題，從人情看見科技需求。	資料科學、神經科學、醫學影像	{}	["interaction"]	2024-07-22 06:52:17	2024-07-24 16:04:04	1	{"instagram": "ted.lu.tw", "facebook": "ted.lu.tw", "discord": "ted_lu", "line": ""}	f	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
669e0d96256188da6f9c4ec9	1992/07/26	university	ohtiffanylin@gmail.com	female	103741605214429843321	林怡廷	https://lh3.googleusercontent.com/a/ACg8ocKjxB31uVIR2VE0cZM_g9bQD1ji0m_zmJzizP6ZhJV6bVTsId8h=s96-c	[]	t	t	台灣@臺中市@	["experimental-educator", "citizen"]	擔任多年醫療公關、人文國中小及展賦行動學苑教師後，深感對民主教育之興趣，因而就讀美國民主教育大學 Goddard College 社會創新與永續研究所，並以創立島島阿學學習社群為題，以行動研究民主教育。現為 g0v 零時小學校專案經理，盼將數位公民教育素養向下扎根，同時也持續發起各項教育改革行動，目前同時為臺灣實驗教育勞動合作社及島島阿學學習社群共同發起人等。	資源連結、專案發想與執行、民主教育、數位公民教育	{自主學習,數位公民教育,民主教育}	["interaction"]	2024-07-22 07:43:18	2025-01-17 03:02:53	2	{"instagram": "", "facebook": "tiff.lin.1", "discord": "_tifflin", "line": ""}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
669e6aa71c00fab9a9f88a00	1994/12/26	other	tutelary.maomao@gmail.com	male	107585885265309132064	阿毛	https://lh3.googleusercontent.com/a/ACg8ocIavZAE9vsHOxqr06YWL8x5ezrETlWAYjk24R-n9IHUymocRw5Z=s96-c	[]	f	t	台灣@花蓮縣@永和區	["citizen", "other"]	 	網頁前端、烹飪烘焙、徒手運動	{網頁前端,烹飪烘焙,徒手運動}	["interaction"]	2024-07-22 14:20:23	2025-01-18 15:01:35	2	{"instagram": "maomao.owo", "facebook": "", "discord": "", "line": ""}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
669e741631ef0f8d6e6c64d6	2006/10/26	university	whalekiller03@gmail.com	female	103166003214580784729	IFang Hsu	https://lh3.googleusercontent.com/a/ACg8ocJPmckt3APK1rh8v4agmZN4hawoND3aX5pvNowXt0Wmw3u7MPU=s96-c	[]	f	f	台灣@臺北市@新莊區	["normal-student", "experimental-education-parent"]	最近在準備研究所！我們可以互相打氣（？	要不要一起考試！	{程式語言,棒球,游泳}	["do-project"]	2024-07-22 15:00:38	2024-11-08 08:14:03	18	{"instagram": "hsu1fang", "facebook": "", "discord": "", "line": ""}	f	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
669e871331ef0f8d6e6c65cc			evonne.hsu@kenkone.com		117302500270287555438	Evonne Hsu	https://lh3.googleusercontent.com/a/ACg8ocIoM43lkaURInnyqvWsm-tIbamN8_mxRDn7O8sC35B8QqZsHw=s96-c	[]	f	f		[]			{}	[]	2024-07-22 16:21:39	2024-07-25 11:11:12	0	\N	f	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
669e8d2231ef0f8d6e6c65d9			hsuifang080318@gmail.com		104108174819028372098	I-Fang Hsu	https://lh3.googleusercontent.com/a/ACg8ocIXsqFgybdGN7WXvNHq16MoA8xGHyotzzs3J3jYxJtW06UsJQ=s96-c	[]	f	f		[]			{}	[]	2024-07-22 16:47:30	2024-07-22 16:47:30	0	\N	f	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
66a0ec34d120a90509710769			109209006@g.nccu.edu.tw		106865714772182843479	林蔚然	https://lh3.googleusercontent.com/a/ACg8ocL7lgS5TyOjXTWV2kLewq3ME0JPKIYpNLwQ7dJ3V6bN7nLSVQ=s96-c	[]	f	f		[]			{}	[]	2024-07-24 11:57:40	2024-07-24 11:57:40	0	\N	f	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
66a10875d120a905097107b6			yanjoyliao@gmail.com		111580305171273404226	yanjoy liao	https://lh3.googleusercontent.com/a/ACg8ocJIC6B8Jp8CFpK1_iDXXC-Ccm-knHYK2JxPNfTFqyhILD74XE7n1A=s96-c	[]	f	f		[]			{}	[]	2024-07-24 13:58:13	2024-07-24 13:58:13	0	\N	f	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
66a19743d120a905097108d9			treeyaya0830@gmail.com		105828993510017407586	Ya	https://lh3.googleusercontent.com/a/ACg8ocKa05EE5R1lsA9BsB8Io3oeFx_B9GYMZxvgF_GQ8YdYW-a-I63s=s96-c	[]	f	f	@@	[]			{}	[]	2024-07-25 00:07:31	2024-07-25 00:09:04	0	{"instagram": "", "facebook": "", "discord": "", "line": ""}	f	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
66a203d2d120a9050971096a	1995-11-12T16:00:00.000Z	university	venus841113@gmail.com	female	113416515446223593160	Pei	https://lh3.googleusercontent.com/a/ACg8ocLJztq3PmyXgwliOsxKKuHPK3yj2qHzj23Z6NN0YfgaQrO_Ide7uA=s96-c	[]	t	t	台灣@臺北市@	["citizen"]	喜歡沖煮咖啡的工程師之一，最近開始投入鉤針，雖然很常鉤到眼睛和手指都很痠，但是個很適合me time放空又有成就感的活動✨ 歡迎揪團鉤針編織\n\n本職 frontend web developer 近期研究單元測試和設計模式，有興趣者可來揪讀書會分享🕺	鉤針編織、抱石初心者、前端工程	{前端,程式語言,編織,社會議題,咖啡}	["interaction", "make-group-class"]	2024-07-25 07:50:42	2024-07-25 08:03:28	1	{"instagram": "", "facebook": "", "discord": "", "line": ""}	f	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
66a21223d120a905097109b5			jamichanging@gmail.com	female	115945645998035796372	Jami	https://lh3.googleusercontent.com/a/ACg8ocIkn8q2fo10hbRENL2QT3RwjSs1BEgu_EeipxNkOiRFpBEKXw=s96-c	[]	f	f	@@	["citizen"]			{}	["interaction"]	2024-07-25 08:51:47	2024-07-25 09:18:34	1	{"instagram": "", "facebook": "", "discord": "", "line": ""}	f	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
66a22c64d120a90509710a05			coachsunshinelee@gmail.com		117761585937487254196	sunshine Lee	https://lh3.googleusercontent.com/a/ACg8ocI2RaV0OQjmC-AEShnBmCwye6ASLqoWubWTPDL2MnDGO7-q6w=s96-c	[]	f	f		[]			{}	[]	2024-07-25 10:43:48	2024-07-25 10:43:48	0	\N	f	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
66a50691d120a90509710ae9	2007-04-20T16:00:00.000Z	high	tingyulin505@gmail.com	female	105022760545625194022	Ravin Lin	https://lh3.googleusercontent.com/a/ACg8ocKc5HGY5_Jm9i_KVcsKl2oLMDnDr5aYCNqohRgTxh-xLoGynTuS=s96-c	[]	f	t	台灣@嘉義市@東區	["experimental-education-student"]		日文、攝影、心理學學習交流	{}	["interaction"]	2024-07-27 14:39:13	2024-07-27 14:42:57	1	{"instagram": "cucyapl", "facebook": "", "discord": "", "line": ""}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
66a5904bd120a90509710c4d	1999/07/23	other	a920604a@gmail.com	other	112947162240305215757	小安	https://lh3.googleusercontent.com/a/ACg8ocK7NnqvhdhcGrdn2NOlYusE3yAs2NVXNx1s5EgU79t7xN_Cyw=s96-c	[]	t	t	台灣@新北市@新莊區	["citizen"]	保持神秘		{保持低調}	["interaction"]	2024-07-28 00:26:51	2024-12-23 00:36:42	6	{"instagram": "unknown", "facebook": "", "discord": "", "line": ""}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
66a735ced120a90509710ea8			enn.enya@gmail.com		101950914980029840240	Enya Yang	https://lh3.googleusercontent.com/a/ACg8ocJ0p58ayr2JLKQxMZ1qpeLm_rb--GQy8Gy4paS7L_052OYfIsp1=s96-c	[]	f	f		[]			{}	[]	2024-07-29 06:25:18	2024-07-29 06:25:18	0	\N	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
66a7d170d120a90509710f02	1983-11-09T16:00:00.000Z	university	yuyu.hunter@gmail.com	female	102781042525814613075	鉛筆	https://lh3.googleusercontent.com/a/ACg8ocLB446TKmLWROJVaBJFqGhxseDT0RXY-T6gV4rFRRoO7SzISOkvTQ=s96-c	[]	f	t	台灣@高雄市@三民區	["citizen"]	大家好，我叫鉛筆\n目前是擔任網頁設計師，主要負責網頁視覺及切版\n希望能在這邊遇到一起組團side project的夥伴\n或是一起學習、分享經驗～\n目前正在學習JS及日文\n	網頁設計、平面設計、UIUX、自我學習	{}	["interaction", "make-group-class", "do-project"]	2024-07-29 17:29:20	2024-07-29 18:01:30	1	{"instagram": "yuyuhunter", "facebook": "", "discord": "yuyuhunter_0509", "line": ""}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
66a8aef6d120a90509710fd2	1990-06-09T08:05:12.000Z	other	clbct7969@gmail.com	female	106230940249702575151	松鼠尾巴的兔子 Ada	https://lh3.googleusercontent.com/a/ACg8ocKjcXWe38UN6Ldv44QN8aGTWP9vtXkoWV8ZVyYb-lVeQ2e-uUg=s96-c	["language", "humanity", "nature-science", "art", "education", "life", "health", "business", "diversity", "learningtools"]	f	t	台灣@@	["citizen"]	主要想找尋可以一起研究讓自我身心完整、社會共好方法的夥伴	台灣茶,藝術,青色組織	{}	["interaction"]	2024-07-30 09:14:30	2024-09-13 08:28:17	3	{"instagram": "", "facebook": "", "discord": "clbct", "line": ""}	f	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
66a9a96bd120a905097110a1	1990-03-14T16:00:00.000Z	other	shiuanmi@gmail.com	female	105191538976493847415	玄羋	https://lh3.googleusercontent.com/a/ACg8ocLMp6akIvPMLihYCjkM46vpKmo7pIANxnx-jQm_NbAxZ5Acmg=s96-c	[]	t	t	台灣@新北市@	["citizen"]	個人興趣最近是台灣茶、藝術欣賞以及如何更好地成為自己(自我成長)。長期有興趣的有動漫與遊戲、收藏古物與手工藝品。\n	台灣茶, FB廣告行銷(音樂領域)	{茶,自我成長,終身學習}	["interaction"]	2024-07-31 03:03:07	2024-07-31 03:06:33	1	{"instagram": "shiuan_mi", "facebook": "shiuanmii", "discord": "", "line": ""}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
66aa2582d120a90509711176	2003/01/26	university	lovekangaroo0126@gmail.com	male	104138156771887484589	蘇冠彰／袋鼠	https://lh3.googleusercontent.com/a/ACg8ocJrssx7X8lgyHpvI6Vin4YHa9Ja6UELj6Z-7YpMWciFrd1UeCc9=s96-c	[]	t	t	台灣@高雄市@三民區	["normal-student"]	哈囉！我是冠彰，大家都叫我袋鼠。\n\n「從跨出學校體制後，看見教育與生涯的多樣性與選擇性，因此展開社會設計與社會創新的旅程。」\n\n個人Blog：https://kangarooblog.addpotion.com/	教育創新、社會創新、NGO、諮商心理、社會工作	{社會議題,助人工作,心理學,社會創新,教育}	["interaction", "do-project", "find-group"]	2024-07-31 11:52:34	2025-01-08 13:47:05	4	{"instagram": "kangaroo_265", "facebook": "", "discord": "", "line": "710121478"}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
66b040cad120a905097115a9	2005-07-01T16:00:00.000Z	university	gsensei1211@gmail.com	female	102484545249871983674	漢堡hamburger	https://lh3.googleusercontent.com/a/ACg8ocLt6Lnv1qD6irJoAguVVNY6jP52uLbs16Q3Pl-Wn6JTgSB1O2Y=s96-c	[]	f	t	@@	["normal-student"]	希望可以找到一起學英文或出國的好夥伴(明年寒假或暑假想去澳洲、紐西蘭)\n我平常在台北讀書，也可以一起出門攝影拍照\n現在有自己的地方創生團隊，也希望可以認識更多新的夥伴\n\n*想尋找台師大的學生一起揪團參加學校自主學習的課		{}	["interaction", "find-teacher", "do-project"]	2024-08-05 03:02:34	2024-08-05 03:09:59	1	{"instagram": "jerry___0702", "facebook": "", "discord": "", "line": ""}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
66b4c9784842eee50798665a	2000-03-06T16:00:00.000Z	university	iamsherry000@gmail.com	female	108174741255318871105	Yun Tseng	https://lh3.googleusercontent.com/a/ACg8ocLD6rOTPYmfPwDBk_Wl9M4LXmH7yGqKeDAfgZTA6H5hgLl-yKvA=s96-c	["language", "math", "computer-science", "nature-science", "education", "learningtools", "life"]	t	t	台灣@臺北市@內湖區	["citizen"]	Linkedin: https://www.linkedin.com/in/yun-tseng-3766601b0/	You'll get a great tool for personal notion plan, increase your productivity today!!	{}	["interaction", "do-project", "find-teacher", "make-group-class"]	2024-08-08 13:34:48	2024-08-08 13:45:25	3	{"instagram": "", "facebook": "", "discord": "sherry0307", "line": ""}	f	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
66ba06e44842eee50798678b	2000-03-09T16:00:00.000Z		yizhenchen06@gmail.com	female	108110530501714327901	陳怡臻	https://lh3.googleusercontent.com/a/ACg8ocJzXD4VHYnLv3LOvd7honrjkwgfCVJUcBQa8EoQyP1AFl5zD2oa=s96-c	["art", "life"]	t	t		["citizen"]			{}	[]	2024-08-12 12:58:12	2024-08-12 12:58:50	2	\N	f	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
66bc7e444842eee507986831	2001-01-05T16:00:00.000Z	university	jamesaubin0106@gmail.com	male	107655172857409189862	張豪君	https://lh3.googleusercontent.com/a/ACg8ocIN3V5wS1roQcgUQlIWZmC6g1A9Ra8ewRycqf0ccE1yKA-9OPE=s96-c	["computer-science", "education", "art", "math", "language", "learningtools", "diversity", "business"]	t	t	台灣@臺中市@太平區	["normal-student", "experimental-educator"]	大家好，我是豪君，很開心能夠和大家分享這幾年來我的探索與成長。我開始思考自己的想法是在建築系中。我很認同自己是一名建築人——一個透過空間思考來探討生活、連結多元領域的人。雖然我開始探索才短短三年左右，但這段時間讓我不斷嘗試突破自己，並且做出了一些關鍵的選擇。\n\n在建築學習的過程中，我並非只關注於建築本身，而是思考如何讓空間更貼近使用者的需求。雖然我曾參與過無障礙設計的專案，但我的目標並不是成為一名建築師，而是去思考如何透過空間創造出更具影響力的體驗與連結，因此最近我參與了於公東高中舉辦的實構築工作。\n\n最近，因為對於建築教育的方式(特別是常態熬夜)有些疑問以及個人健康狀態，我毅然轉系並將重心放在程式設計的學習上。我認為未來的建築不僅僅是實體空間的設計，而是應該結合數位工具，讓設計能夠更加智能化、更能貼近人的需求。雖然目前我還處於程式學習的起步階段，但我相信這將成為我未來實現理想的重要基石之一。\n\n同時，教育也是我一直非常關注的領域。我在過去，參與了遠距教育志工服務以及從事個別指導的工作，這讓我深刻體會到教育的力量。特別是在當前這個數位時代，如何讓知識傳遞變得更加靈活、更加個性化，這是我一直在思考並希望能夠投入更多心力去探索的方向。\n\n我所追求的生活，其實是一個自由而多元的狀態。我希望能夠在工作與生活之間找到平衡，並且透過設計與教育來實現這種理想生活。不論是在學習新的技能，還是與不同文化背景的人交流，這些經驗都豐富了我的視野，也讓我更清楚地知道自己想要什麼樣的未來。\n	建築賞析、參數化建築、一點點教育、圖示思考及表達	{}	["interaction", "do-project", "find-student"]	2024-08-14 09:52:04	2024-09-14 03:16:16	3	{"instagram": "aubin_archicode", "facebook": "", "discord": "itsme.aubin", "line": ""}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
66bc7e624842eee507986836	2001-01-05T16:00:00.000Z	university	jamesaubinnews@gmail.com	male	110505292797643337244	張豪君	https://lh3.googleusercontent.com/a/ACg8ocL1Q6pWnSSF0EOlUtijCg5FrZ6adTYYTFo82QvIOksjQ3GQY4M=s96-c	["computer-science", "education", "business", "diversity", "art", "life"]	t	t	台灣@臺中市@太平區	["normal-student"]		建築	{}	["interaction", "do-project", "find-student"]	2024-08-14 09:52:34	2024-08-14 10:03:25	3	{"instagram": "aubin_archicode", "facebook": "", "discord": "", "line": ""}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
66bdd3ec4842eee507986882	2007-10-13T10:09:50.000Z	high	turf941013@gmail.com	other	105250845518810169654	貓草皮	https://lh3.googleusercontent.com/a/ACg8ocIR3TEidMFGVrwvJvcxAP7wei9mNyTOKpAULdBvtX5x6godtw=s96-c	["education", "life", "diversity", "learningtools"]	t	t	台灣@高雄市@鳳山區	["other"]	從國小三年級開始個人自學，高中自學時沒有與學校合作，目前已18歲並完成學業。對自學和自學團體有一定的了解，曾參與過的團體包括：高雄小草旅人共學團、台中紅泥巴自學團、新竹粘巴達假日學校，以及台南可能非學校自學團。對新型教育懷有濃厚的興趣。	匹克球、自學、體制外教育團體、靈擺	{}	["interaction"]	2024-08-15 10:09:48	2024-08-15 10:22:35	3	{"instagram": "", "facebook": "TurfLiang ", "discord": "turf111", "line": "turf941013"}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
66cc35edf8d58801f0e11b9a	1995-07-18T16:00:00.000Z		polarbearjudy@gmail.com	female	107542774546665414322	Chao-Ling Chyou	https://lh3.googleusercontent.com/a/ACg8ocIaJZW2bJNg4rJkUtd_v9U4gS_WvSX4GO04BVXQE97SzO64bMbJ=s96-c	["learningtools", "life", "art"]	t	t		["citizen"]			{}	[]	2024-08-26 07:59:41	2024-08-26 08:00:46	2	\N	f	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
66cc3e28f8d58801f0e11bab	1995-07-18T16:00:00.000Z		polarbearjudy@gmail.com	female	116172708079108393135	Chao-Ling Chyou	https://lh3.googleusercontent.com/a/ACg8ocJHQwRGwVV4JrfprDc2hj5UuluuJAV6lNZKePSxXDapffXdTKs=s96-c	["diversity"]	t	t	@@	["citizen"]			{}	[]	2024-08-26 08:34:48	2024-08-26 08:37:01	2	{"instagram": "", "facebook": "", "discord": "", "line": ""}	f	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
66cc9ef2f8d58801f0e11bf7	1991/04/12	other	fish04123@gmail.com	female	115852624990501181450	Landy	https://lh3.googleusercontent.com/a/ACg8ocJJHzZTADZBpzQ0pXqL89AhWVukFz3bsmTng-AEnG0ndZIT9dEwXw=s96-c	["language", "math", "humanity", "life", "education", "art", "nature-science", "health", "business", "diversity", "learningtools", "computer-science"]	t	t	台灣@臺中市@南區	["citizen", "experimental-educator", "other"]	非常喜歡產品的產品人，熱愛手動作 project，連結知識和實務。\n有任何想學習、累積實務經驗的歡迎聯繫我～\n更多關於我請見：https://portaly.cc/landy	軟體開發、產品規劃、職涯、Side Project 諮詢、企劃	{產品開發,產品知識}	["interaction", "do-project", "find-group"]	2024-08-26 15:27:46	2024-11-20 10:06:32	6	{"instagram": "nienting.landy", "facebook": "", "discord": "landy5", "line": ""}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
66d93d1cf8d58801f0e11e6f	1995/11/30	other	ruby10127130@gmail.com	female	109177383468075295482	喬宇	https://lh3.googleusercontent.com/a/ACg8ocIbCF6mxmKXeIIGS-MCIv6umwTNbtMKSJCvWh4lvIgIDCyOCuwL=s96-c	[]	f	f	台灣@桃園市@桃園區	["citizen"]	學習	coding	{程式語言}	["interaction", "do-project", "find-group", "find-teacher"]	2024-09-05 05:09:48	2025-01-02 06:04:48	4	{"instagram": "ruby", "facebook": "", "discord": "", "line": ""}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
66e1868df8d58801f0e1214d	1991-04-11T16:00:00.000Z		codingnien@gmail.com	female	113088033111308075917	Nien	https://lh3.googleusercontent.com/a/ACg8ocI7_zPn0FladQguixwu5_7fOslpmchFrJqcCw_ioMssIT3ZZw=s96-c	["business"]	f	f	@@	["other"]			{}	[]	2024-09-11 12:01:17	2024-09-14 15:18:53	2	{"instagram": "", "facebook": "", "discord": "", "line": ""}	f	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
66e29b08f8d58801f0e12510	1997-02-08T07:40:58.000Z		qwesdf3691@gmail.com	female	105821837388193887762	Yi-shan Wu	https://lh3.googleusercontent.com/a/ACg8ocLNfW4eTpBxCThXM4RlFTIyu7uicgv7xBMC1iX-pHs8Kb4mBwtl=s96-c	["language", "humanity", "computer-science", "art", "nature-science", "life", "business", "health", "diversity", "learningtools", "education"]	t	t		["normal-student"]			{}	[]	2024-09-12 07:40:56	2024-09-12 07:42:00	2	\N	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
66e4f383f8d58801f0e127a5			jamescj20022@gmail.com		117592731265422673015	張豪君	https://lh3.googleusercontent.com/a/ACg8ocK31oDBtvOS8IOHm88P37lAXsZa8WdAFSWGdDdPpwOKapr4EF7v=s96-c	[]	t	t		[]			{}	[]	2024-09-14 02:22:59	2024-09-14 02:22:59	0	\N	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
66e5b416f8d58801f0e12972	1990/10/19	university	lu791019@gmail.com	male	111954851686336157884	Dex Lu	https://lh3.googleusercontent.com/a/ACg8ocJHJeopJ9fInAVR7PP37tVLbNjEc4Z2QXDWRBg66W0OCqwvJDmV=s96-c	["computer-science", "humanity", "learningtools", "diversity", "business", "language", "health", "art", "education"]	t	t	台灣@高雄市@苓雅區	["citizen"]	- 我是誰？  Dex的塵世哲學\n\nPython作品集引導，引領踏入大數據和AI\n歷經半導體、資料科學、軟體開發，建立程式職涯交流，提供理工職涯洞見\n\n- 我在做什麼：成為程式入門者的引路人 ; 轉職者的職涯諮詢師, 精進者的學習顧問。\n\n- 我如何協助：程式入門、轉職、作品集引導；職涯諮詢和履歷健檢諮詢 ; 學習資源分享和技術心得見解。\n\n主要文章和諮詢預約網站(努力寫文中)：\nhttps://daydreamdex.com\n\n長文FB：\nhttps://www.facebook.com/profile.php?id=61560603174482\n\nIG/Threads： @daydreamdex\n\n更多學習資源和工作經驗分享\n可訂閱 我與經驗值 <I And EXP> 電子報\nhttps://iandexp.ck.page/283146f2d3\n訂閱即可獲得NVIDIA AI 學習資源	程式教學 職涯探索 職涯諮詢 學習體驗 學習精進	{職涯發展,學習歷程,自主學習,實驗教育,學習議題探討,程式語言,資料科學,大數據和AI}	["interaction", "find-student", "make-group-class", "do-project", "find-group", "find-teacher"]	2024-09-14 16:04:38	2024-11-20 12:26:49	4	{"instagram": "daydreamdex", "facebook": "61560603174482", "discord": "k77251", "line": "k77251"}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
66e6dbbaf8d58801f0e12b07	1982-07-09T16:00:00.000Z		horsekit1982@gmail.com	male	106524654721881441047	林暐秦（Tomas）	https://lh3.googleusercontent.com/a/ACg8ocIe-Rm-8OQMylxVWj32Ypw9d-PzHpiPJkQuyGdl3-r26DiUeNk0=s96-c	["computer-science", "learningtools"]	t	t		["citizen"]			{}	[]	2024-09-15 13:06:02	2024-09-15 13:06:42	2	\N	f	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
66e928a0f8d58801f0e12da9	1917/09/17	university	chao.ling.chyou@gmail.com	female	104363604777194370053	Chao-Ling Chyou	https://lh3.googleusercontent.com/a/ACg8ocJ-mT6xXL0yb1MwF_6zcV6ngtSZsTzX1gK47ctRooTWrGQq_A=s96-c	["learningtools", "humanity"]	f	t	台灣@新北市@	["other"]	你好，我是Chao，我的工作專注在設計，研究及物件上，使用物件跟設計來研究使用者的行為及洞察。\n之前是一名PM及UX設計師，目前全心投入做設計研究及使用者研究。\n\n	設計研究＆研究	{生物}	["interaction", "find-student"]	2024-09-17 06:58:40	2024-11-23 03:31:43	4	{"instagram": "", "facebook": "", "discord": "judychyou", "line": ""}	f	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
66e99f02f8d58801f0e12e8d	1992-05-01T15:23:49.000Z		starizumi@gmail.com	female	108389257070764907031	Xuan Huang	https://lh3.googleusercontent.com/a/ACg8ocI3ZNuahp9BgVX4uiLSwJ-Saf2zLsc8eE76jEQVe5Epqy2H-Xat=s96-c	["language", "humanity", "art", "education", "health", "business", "learningtools", "diversity", "math", "computer-science", "life"]	t	t		["citizen"]			{}	[]	2024-09-17 15:23:46	2024-09-17 15:24:46	2	\N	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
66ec0c59f8d58801f0e12f5e			peggy.hsieh@goodera.com		100032917059318669397	Peggy Hsieh	https://lh3.googleusercontent.com/a/ACg8ocId9Rl5Iv7Ji_bJVILgV7EzQini4J2DdY48A3GfQIBHpN6Xag=s96-c	[]	t	t		[]			{}	[]	2024-09-19 11:34:49	2024-09-19 11:34:49	0	\N	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
66ef71c6f8d58801f0e1307f	1972-09-08T01:24:23.000Z	high	leader3029@gmail.com	female	102192668245197858202	邱淑君	https://lh3.googleusercontent.com/a/ACg8ocIjIH-lLlNqMOxcjuSQaHFJ-5YPjA7w-l-v2cxApD5aQTP8p6SpYg=s96-c	["language", "art", "diversity", "learningtools", "education", "life", "health", "business"]	t	t	台灣@桃園市@蘆竹區	["experimental-education-parent"]	孩子正要申請自學		{}	["interaction", "find-student", "find-teacher", "make-group-class", "do-project"]	2024-09-22 01:24:22	2024-09-22 01:27:55	3	{"instagram": "", "facebook": "", "discord": "", "line": "chiu3029"}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
66f157a0f8d58801f0e13234	2003-07-24T11:57:21.000Z	university	sheep920724@gmail.com	female	110014884748935962242	許芃芃	https://lh3.googleusercontent.com/a/ACg8ocKILzGnr7yx-isPwWxSoR1IY3eKjp7uw7tFUMHYXXgB91tqtQrm3g=s96-c	[]	f	f	台灣@彰化縣@鹿港鎮	["normal-student"]			{}	[]	2024-09-23 11:57:20	2024-09-23 11:58:29	1	{"instagram": "sheep920724", "facebook": "", "discord": "sheep920724", "line": ""}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
66f38459f8d58801f0e13451	1998-07-20T03:32:43.000Z		9640333@gmail.com	female	108926107515629804849	Pearl Yang	https://lh3.googleusercontent.com/a/ACg8ocIVoQwkW-SysWEvt5V9IxpmdRnMDCnlLXb5uykqpCbUnZk2f-x9=s96-c	["humanity", "learningtools", "language", "art", "business"]	t	t	@@	["citizen"]			{}	[]	2024-09-25 03:32:41	2024-09-25 03:49:33	2	{"instagram": "", "facebook": "", "discord": "", "line": ""}	f	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
66f41859f8d58801f0e1353e	2024-09-25T14:04:10.328Z		a0920968678@gmail.com	male	115921550452673510012	葛修承	https://lh3.googleusercontent.com/a/ACg8ocKlOgr9O6T-1EYqxy_HhzDRGGI7eeYUiUINSycdH2mS94S32kCB=s96-c	["language", "computer-science", "diversity", "business", "learningtools"]	t	t		["citizen"]			{}	[]	2024-09-25 14:04:09	2024-09-29 12:00:07	2	\N	f	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
66f42407f8d58801f0e13581	1997/10/23	university	tseng4w@gmail.com	female	111392336911936076041	Eira Tseng	https://lh3.googleusercontent.com/a/ACg8ocLwhSRE_lb_kq1SgIHXC4FL-oNtnvrdMeow56SYI27bU38xJc8=s96-c	[]	f	t	台灣@新北市@	["citizen"]	111111	網頁設計，使用者介面設計	{網頁設計,使用者體驗設計,使用者介面設計}	["interaction", "do-project"]	2024-09-25 14:53:59	2024-12-29 14:51:30	4	{"instagram": "", "facebook": "", "discord": "", "line": "1111111"}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
66f68c37a27d6db598ef3dcd	2009-07-28T10:43:05.000Z	high	lionheng728@gmail.com	female	106283758313070745529	HSUAN HENG	https://lh3.googleusercontent.com/a/ACg8ocL1PHeYLaxFQ5UQMUhv7EyfKajbX9jjWu31XBB9oXz8NbLizAY7=s96-c	["language", "humanity", "art", "diversity"]	t	t	台灣@臺中市@	["experimental-education-student"]			{}	["interaction"]	2024-09-27 10:43:03	2024-09-27 10:46:06	3	{"instagram": "", "facebook": "", "discord": "", "line": ""}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
66f9481da27d6db598ef42b7	2007-01-22T12:29:20.000Z	high	xx0932399@gmail.com	male	104676009777933471206	陳威達（冰川）	https://lh3.googleusercontent.com/a/ACg8ocKuatjl8lFeY2JxxcFmY2arFYDfiZH9MgVWxsFZcD8gSSncskt7=s96-c	["computer-science", "diversity", "education", "learningtools"]	f	t	台灣@@	["experimental-education-student"]			{}	["interaction", "do-project"]	2024-09-29 12:29:17	2024-09-29 12:30:57	3	{"instagram": "dada._.878", "facebook": "", "discord": "dada878", "line": ""}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
66f948e4a27d6db598ef42dd	1987-10-10T12:32:37.000Z	other	cpeter1010@gmail.com	male	118151930797791178355	莊哲銘（樂尼）	https://lh3.googleusercontent.com/a/ACg8ocJ9gWhekPYRn-6UvpMeptPqE1YwibWeC0oR207ByTsZg2K5z5LGMA=s96-c	["education", "learningtools", "diversity", "business", "life"]	f	t	台灣@桃園市@	["experimental-educator"]	白天在教育平台擔任課程體驗設計師，與夥伴共創個人化學習的內容與環境。\n下班後經營學習玩家教育創作室，寫寫教育專欄，\n我的教育理想型：讓孩子主導學習、探索未知與尋找喜樂\n熱愛學習體驗設計、塗鴉筆記與教育AI應用，\n偶爾探險、演講、帶工作坊，廣結善緣😆，\n沒事就喝杯咖啡，享受一個人的圖文創作\n玩，就是最好的學習體驗	自主學習策略、塗鴉筆記與視覺引導、差異化教學設計、生成式 AI 教學應用、AI 知識圖文創作、AI 與視覺圖像簡報術、AI 繪本創作、AI 輔助自主學習	{教育AI應用,塗鴉筆記,學習體驗設計,AI圖文創作,自主學習,教育創新,差異化教學,個人化學習,教學方法,教師培力}	["interaction", "find-student", "make-group-class"]	2024-09-29 12:32:36	2024-10-02 09:29:27	5	{"instagram": "learn4c", "facebook": "learn4c", "discord": "", "line": "smallchuang"}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
66f94a11a27d6db598ef42f7	1999-07-22T16:00:00.000Z	other	amigosun2@gmail.com	female	111385062902422694956	周子晴（晴天）	https://lh3.googleusercontent.com/a/ACg8ocL5o3RnSrUSCTZ4Mtebk7vNpNdwSeYaJ0NAxRwZm3LjMDc6_KAZPA=s96-c	["life", "learningtools", "health", "education", "math", "diversity"]	f	t	台灣@新北市@	["experimental-educator"]		課後共學團、自我對話、引導、手作（刺繡、火漆章、貼紙）、閱讀	{自我對話,課後共學,刺繡,火漆章,手作}	["interaction", "make-group-class", "find-student"]	2024-09-29 12:37:37	2024-09-29 13:38:27	4	{"instagram": "", "facebook": "amigo723", "discord": "amigo8073", "line": ""}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
66f94b5fa27d6db598ef4310	1981-09-29T12:43:12.605Z	other	kenle0423@gmail.com	male	103783597993084735659	Ken Li	https://lh3.googleusercontent.com/a/ACg8ocIsGN0GHrcP03mfELNpF3as0n9KkCRQmLzwebGjq7SdOMo-sHwi=s96-c	["language", "math", "computer-science", "humanity", "life", "education", "art", "nature-science", "health", "business", "diversity", "learningtools"]	t	t	台灣@@	["experimental-educator", "experimental-education-parent"]			{}	["find-teacher", "find-student", "make-group-class", "interaction"]	2024-09-29 12:43:11	2024-09-29 12:44:18	3	{"instagram": "", "facebook": "", "discord": "", "line": ""}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
66fbaf90a27d6db598ef456f	2024-10-01T08:15:02.041Z		cora790712@gmail.com	female	106436218113071854742	林怡萱	https://lh3.googleusercontent.com/a/ACg8ocKmAXneUqqf2Z63qturhupVcprlkrsCmuPCkHQggAbf-GCaaA=s96-c	["computer-science"]	t	t		["citizen"]			{}	[]	2024-10-01 08:15:12	2024-10-01 08:15:26	2	\N	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
6704be4ea27d6db598ef4d41			gexiucheng3@gmail.com		113089661204090375561	Cheen UNZZI	https://lh3.googleusercontent.com/a/ACg8ocLV5HNAYNUZxgd6xhhXrxYF8dNh0Q30_ImqDjkT-rdPYpcJfq4=s96-c	[]	t	t		[]			{}	[]	2024-10-08 05:08:30	2024-10-08 05:08:30	0	\N	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
67070f1ba27d6db598ef4ea9	2024-10-09T23:17:48.528Z		gexiucheng01@gmail.com	male	114040539634850553567	葛修承 Ivan	https://lh3.googleusercontent.com/a/ACg8ocJImLduXYmaSCX8umspV9gbCV9YQVhEd34hBBp3iEazFVH0vg=s96-c	[]	t	t		["experimental-education-student"]			{}	[]	2024-10-09 23:17:47	2024-10-09 23:17:58	1	\N	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
67077bf0a27d6db598ef4ec2	1991-10-10T07:02:09.720Z		triot059@gmail.com	other	100528472356293522972	t riot	https://lh3.googleusercontent.com/a/ACg8ocIM_bfIiZ_Eri-QzlAoQy7DSvK7oj4iIEvJIrJLWj38P4yRsg=s96-c	["learningtools"]	t	t		["experimental-educator"]			{}	[]	2024-10-10 07:02:08	2024-10-10 07:02:46	2	\N	f	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
67077c60a27d6db598ef4ecb			eira@ewebs.com.tw		105790663201294586725	曾宇彤	https://lh3.googleusercontent.com/a/ACg8ocK9tfhiLJzaXjdG6leF45HfOroaXbaw0b1G-JHlXDN_PltqcU8=s96-c	[]	t	t		[]			{}	[]	2024-10-10 07:04:00	2024-10-10 07:04:00	0	\N	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
670b7b42a27d6db598ef5144	1993/11/21	university	tingyun1121@gmail.com	other	107183222292244435352	庭昀	https://lh3.googleusercontent.com/a/ACg8ocLDQFJqlUwlIjnjUhG9gMlq84FYCWcIf7dBfgpBvS-UEAOSYQ=s96-c	["education", "art", "business", "diversity", "learningtools", "life"]	f	t	台灣@@	["experimental-educator"]		自主學習、學習輔導、音樂	{}	["interaction", "find-student"]	2024-10-13 07:48:18	2024-10-22 06:06:55	3	{"instagram": "", "facebook": "", "discord": "", "line": ""}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
670f825aa27d6db598ef5280	1986/01/06	other	hsiflow@gmail.com	female	114002781195670371385	Lang	https://lh3.googleusercontent.com/a/ACg8ocJ41rhAZxx6M21HmsM-8KbKLH5mqJfwc9bB6MWg5ZDHPyem_wvquQ=s96-c	["computer-science", "humanity", "education", "art", "nature-science", "life", "diversity", "learningtools", "business", "health"]	t	t	台灣@臺北市@文山區	["citizen", "other"]	嗨大家好! 很高興知道這個地方，希望能找到夥伴一起學習!	閱讀；自主學習	{前端開發,日文口說,台語口說,閱讀,自主學習,LGBT+}	["do-project", "interaction", "find-group"]	2024-10-16 09:07:38	2024-10-16 09:15:27	3	{"instagram": "_______", "facebook": "_______", "discord": "langyc", "line": "hsiflow"}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
671210d4a27d6db598ef5332	1985/08/21	other	isame4@gmail.com	male	107103569652618927179	Ying-Chu Chen	https://lh3.googleusercontent.com/a/ACg8ocIcjL3mL9L2QcyXH3NxtnqnVU6u4dgESCkwhhlRMdbMIsBtMllR=s96-c	["language", "humanity", "education", "business", "health", "learningtools", "diversity", "life"]	t	t	台灣@新北市@五股區	["normal-student"]	陳映竹同時擁有臺師大國際漢學研究所文學碩士，以及臺北市立大學運動健康科學系理學碩士。目前為臺師大體育與運動科學博士候選人。並且擁有美國運動醫學會臨床運動生理師以及私人教練認證！希冀透過平台持續推廣運動與健康科學相關知識，以及肌力與體能相關訓練理論及實務，並提供個人跨領域與教練自我成長歷程，讓有志從事教練產業以及斜槓工作者有所依循。\n\n🟨 自媒體經營：以「我是運科竹」為關鍵字搜尋！\n▌Youtube: https://www.youtube.com/@yesimsportscientist8642/about\n▌Instagram : https://www.instagram.com/coachsteveperformance/\n▌Facebook : https://www.facebook.com/SteveLovesWorkout/\nPodcast 頻道 : Sound on, Apple Podcast, 以及 Google Podcast，均為「我是運科竹」。	體育與運動科學：健康科學、重量訓練	{重量訓練,運動科學,健康科學,運動,健身,教練}	["interaction", "do-project", "make-group-class"]	2024-10-18 07:40:04	2024-10-18 07:45:48	3	{"instagram": "stevelovesworkout", "facebook": "SteveLovesWorkout", "discord": "", "line": ""}	f	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
6714253aa27d6db598ef54c4	2002/11/15	university	skyfeng2002@gmail.com	male	104483925457363444429	楓葉	https://lh3.googleusercontent.com/a/ACg8ocJm0Jut6HcbGQVVzGb46tRIEtg6jYj5JZP_40bQpZZB3OY3qPBr6A=s96-c	["diversity", "learningtools", "language", "humanity", "computer-science"]	t	t	台灣@桃園市@桃園區	["normal-student"]	大學犯罪防治學系四年級生，目前正準備研究所甄試\n喜歡閱讀、二次元相關事務！\n正努力自學日文和程式語言		{}	["interaction", "find-teacher", "find-group", "do-project"]	2024-10-19 21:31:38	2024-10-19 21:37:39	3	{"instagram": "", "facebook": "", "discord": "mapleleafowo", "line": "kuwu1115"}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
6714ed39a27d6db598ef5599	2010-04-13T11:45:01.000Z		aapril0413@gmail.com	female	100041685022967845774	李歆淳	https://lh3.googleusercontent.com/a-/ALV-UjUCPpI5_6prQ9ToC9ZL04z7NQmPTdA4HjlPAQUsO3ehKWVSPEadolzXbyFPw6pLjWPGQzD03w4hUTVVj1VvNwuLBmmVZ_kS1VRipHdeOSupe2WFQA77gYWPwZUiCFdWxAWhLmVjEQR0dfTFQw9fKzTL8jMRY-fvW17pYYyskgHjpbLVEFLNbTpITE8XYSFXfoVJyHkcUJsGFz3abqelDwZS0MMQVACsQiS9AmR1BrBc1pDEfR-jRWa5DOuDZg2RzBVsWeF0ZP2QBP6Nmeb78LzuB3R6KTW_cqJrmnZ5ohfIg9jdbiFvMHlezwXKz723VpiwybdgcRMIXln3_2h6Iqtav343q39iuYPwbHhREwyiMKPh_dzEKokTZoiPCMP8nAekWJ5o_u7WBD1xVh-n6i0fnYJ2o_5sX8_4v0QaddVcH10_xhcTbtHd5RKTOg6H11WI_3VQplxhCzmhsfIqBMx1R8TYeUTqPz8d3KAxXalWhBToLnTdvBPV2BJ830q_FxZm-fU1dSjqsq_v7zGEaZ2GsZgW_XCeO2DGXrhtgj22z0ZZfG9KPE0csKqgk2N9ZAt__qOwLzQFIq4pmiVH_4CeXs4Fd1TBYpqmwd1RCGHDqruz6aoLJzHaiQYxhkNQvbasc4Qev088UGICNwlRx3giFbxGpjCkaGhPN-A-XrsrsdMKeVwdscSC6sPdz4GVJiK2VnSepMaummwCR27ewIKNVlT8D2SIoiolmmHODkiHGPB0e2C8B4Nmfa8ABNbYq8WGnMStxC6wdJuunzvuNFg76qOkByk1nl7lzUbcCRqwTKVoZZgdaGiaiIaalMQZqAwwVgVdquhyrBYtWqf9-_grUN5uI347_d1rTgBJ_nRxVUjBr2X6Ltl249as2Heb4ygZ8SmMr5Sv8SHSoPLLxOBqI2MIkpvqXhH6xFzAbBb3TkkX-McZjzrarcYfekwwJSzIYdpnP5oO4gDuznFBs7IuKyA=s96-c	["language", "humanity", "education", "health", "learningtools", "diversity"]	t	t		["normal-student"]			{}	[]	2024-10-20 11:44:57	2024-10-20 11:45:47	2	\N	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
671526c4a27d6db598ef5603	2024-10-20T15:50:42.085Z		lucasliu0910@gmail.com		108168073990486589111	Lucas劉恩佑	https://lh3.googleusercontent.com/a/ACg8ocL2cbJrbQrc7ClAt891OqEd-52fJSbmr8z9p6Ev3pCN6nx5LUS75A=s96-c	["computer-science", "math", "humanity", "nature-science"]	t	t		["experimental-education-student"]			{}	[]	2024-10-20 15:50:28	2024-10-20 15:50:55	2	\N	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
6715e509a27d6db598ef5673	1995-10-13T05:22:42.000Z		k84101311@gmail.com	male	111281282630544311843	Kermit Sung	https://lh3.googleusercontent.com/a/ACg8ocKM1g3JwcM_lmgPM30RlOVKOolKHL6nPcOSnRUwGOv4i6rAQpA3=s96-c	["health", "humanity", "computer-science"]	t	t		["experimental-educator"]			{}	[]	2024-10-21 05:22:17	2024-10-21 05:23:27	2	\N	f	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
67175a71a27d6db598ef5827	1997/12/07	other	dnangeltina@gmail.com	female	109199846667562769192	梅爾	https://lh3.googleusercontent.com/a/ACg8ocKfQDwHARN0Ru3aai0blLd9RfirtPeYNg8kjPdoMkSTcUdMjiA=s96-c	["computer-science", "humanity", "education", "life", "business", "diversity", "learningtools"]	t	t	台灣@@	["citizen"]	原是在社工界漂浮的一抹靈魂，現在想掙扎跟昇華去其他世界看看，也希望能讓這抹靈魂發展不同的樣貌。	社會工作、青少年陪伴、心理輔導、教育遊戲設計、世代差異的觀察	{}	["interaction", "find-group", "make-group-class", "do-project"]	2024-10-22 07:55:29	2024-10-22 08:01:24	3	{"instagram": "", "facebook": "mei.er.183279", "discord": "", "line": ""}	f	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
67188447a27d6db598ef5994	2005/01/10	university	hseihcy13@gmail.com	female	111580049182585121320	謝cy	https://lh3.googleusercontent.com/a/ACg8ocLMRfkBtIEiAyA8lxn9Nz7p_Umb2dJPUp3wKWDn3yFgM4OSBA=s96-c	["learningtools", "diversity", "health"]	t	t	台灣@臺中市@	["normal-student"]	我想尋找一起努力、學習的夥伴，也可以彼此監督、交流，認識各個領域和各種經歷～\n線上的夥伴也很歡迎～		{}	["interaction", "do-project", "find-student", "find-teacher"]	2024-10-23 05:06:15	2024-10-23 05:12:58	3	{"instagram": "cy._.103", "facebook": "", "discord": "", "line": ""}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
671b9e9aa27d6db598ef5c05	1993-02-15T13:36:28.000Z		vbnm123c@gmail.com	other	113176977085020831643	Chun-Hao Lien	https://lh3.googleusercontent.com/a/ACg8ocKIdKaIRDqZE_4sCiGt0Q17WzD6OiD-XEbhlJMDBegskUo57wLr=s96-c	["computer-science", "language"]	t	t		["citizen"]			{}	[]	2024-10-25 13:35:22	2024-10-25 13:37:03	2	\N	f	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
671daad6a27d6db598ef5d67	2006/11/10	high	p8188324@gmail.com	male	111999729233457520551	popoca4	https://lh3.googleusercontent.com/a/ACg8ocKhyjyYxjiSSCX2qFQtWYu-dt7nnRCrn5u2MaON3zwT7WDPIkxs=s96-c	["humanity", "education", "diversity", "learningtools", "business", "nature-science", "language", "computer-science", "math", "art", "life"]	t	t	台灣@臺北市@大安區	["experimental-education-student", "other"]			{}	["interaction", "do-project", "make-group-class", "find-group"]	2024-10-27 02:52:06	2024-10-27 02:57:41	3	{"instagram": "", "facebook": "", "discord": "", "line": ""}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
671dd24ea27d6db598ef5e5c	2007/04/21	high	s111202@nocsh.ntpc.edu.tw	male	113684346617835134939	闕鈺昆33	https://lh3.googleusercontent.com/a/ACg8ocKpHlfILFBc6QM4WR2OVECK3N9GtWYbCfGkwgj_JOoKNAwrvA=s96-c	["computer-science", "humanity", "education", "art", "business", "diversity"]	f	t	台灣@臺北市@大同區	["normal-student"]		網路工程、學英語	{}	[]	2024-10-27 05:40:30	2024-10-27 05:55:39	2	{"instagram": "", "facebook": "", "discord": "yourneighborchueh", "line": ""}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
671dfa06a27d6db598ef5ef7	2005/10/27	high	11335303@tschool.tp.edu.tw	female	105581461278476469552	林以晴	https://lh3.googleusercontent.com/a/ACg8ocILCXffXp_rmTBPcXd-Z3DgXKFwLD4pKhaBxYo4QK4nl5UMEzw=s96-c	["health", "humanity"]	f	t	台灣@新北市@三峽區	["normal-student"]	fffffffff	gghhj	{}	["interaction", "make-group-class"]	2024-10-27 08:29:58	2024-10-27 08:34:23	3	{"instagram": "", "facebook": "", "discord": "", "line": "0965185512"}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
671e1a5ea27d6db598ef5fc0	2006/10/27	university	leeeeeyu0123@gmail.com	female	113742195718235534557	李魚	https://lh3.googleusercontent.com/a/ACg8ocLXrdTE-Xq0B5yftHSy0FWCNZx9nKJhgEJw1UTCUx3IOjv2IQ=s96-c	["math", "education", "health", "nature-science"]	f	t	台灣@新北市@板橋區	["normal-student"]	我的MBTI是EEEE，我很外相	畫畫、吉他	{畫畫,吉他}	["interaction"]	2024-10-27 10:47:58	2024-10-27 11:05:03	3	{"instagram": "", "facebook": "", "discord": "", "line": ""}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
671f54eea27d6db598ef60b9	1900/10/28		ts.js.anita@gmail.com	other	111839709657022618987	anita	https://lh3.googleusercontent.com/a/ACg8ocKbKn8sr2nOhsKcicV0uHHFBhhBeWqFWsTuI_45b68ks2fjPA=s96-c	[]	t	t	@@	["experimental-education-student", "normal-student"]	大家好！		{音樂創作,程式語言,電繪,社會議題}	["make-group-class", "find-student", "find-teacher"]	2024-10-28 09:10:06	2024-12-28 14:03:23	1	{"instagram": "", "facebook": "dent19238", "discord": "dent19238", "line": "dent19238"}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
671f7a11a27d6db598ef60d5	1901/10/28		vincent.xu.work@gmail.com	other	102642891361387248582	vincent xu	https://lh3.googleusercontent.com/a/ACg8ocI-QRVS0TBCqwfHi8YKz1tWejNVN6skHIeQLEVAMJ-TWbv_IA=s96-c	[]	t	t	@@	["experimental-educator", "citizen"]	我		{我想知}	["interaction"]	2024-10-28 11:48:33	2024-11-11 16:06:44	2	{"instagram": "", "facebook": "", "discord": "Discord", "line": ""}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
671f9757a27d6db598ef61b1	1995-10-26T16:00:00.000Z	university	hsuhsuhsu7777@gmail.com	male	104940902254485708400	test test	https://lh3.googleusercontent.com/a/ACg8ocLorzlTF1bhtOweHWl5GVXlPRuJkTspsfVjd6gIUGk4g1TX=s96-c	["art", "education", "computer-science"]	t	f	@@	["experimental-education-student", "citizen", "other"]			{}	["find-student"]	2024-10-28 13:53:27	2024-10-28 14:56:45	5	{"instagram": "", "facebook": "", "discord": "", "line": ""}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
672317f8a27d6db598ef632b	2024-10-31T05:39:05.987Z		len107008@gmail.com	female	105692538415182893328	Chao Len	https://lh3.googleusercontent.com/a/ACg8ocK448BUsdFf5sFYFaYrhC5lEqCi0KNbJAtYkMnOr0I_pz9w7Q=s96-c	["computer-science"]	t	t		[]			{}	[]	2024-10-31 05:39:04	2024-10-31 05:39:31	1	\N	f	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
6724aac3a27d6db598ef6372	2024-11-01T10:17:40.053Z		zoe065090@gmail.com		100443610395969523757	Zoe	https://lh3.googleusercontent.com/a/ACg8ocJXJJVOB7S6xawI0MEEIJyJR3oX6ujxcIq0YMG1F52U_CwCJQ=s96-c	[]	t	t		[]			{}	[]	2024-11-01 10:17:39	2024-11-01 10:17:48	0	\N	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
6726fad2a27d6db598ef643b	2006/07/10	university	yies26210191@gmail.com	female	117085492336948033915	徐若軒	https://lh3.googleusercontent.com/a/ACg8ocJ2L4l2a4nV5ne_dQrr683mqYu02HIew1HA3jfeLzTA5SRzFg=s96-c	["life", "language", "health", "learningtools"]	t	t	台灣@新北市@淡水區	["normal-student"]			{}	["interaction"]	2024-11-03 04:23:46	2024-11-03 04:28:46	3	{"instagram": "", "facebook": "", "discord": "", "line": ""}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
67271349a27d6db598ef64c8	2004/02/01	university	muling0619@gmail.com	female	108965150123534573571	Esencia	https://lh3.googleusercontent.com/a/ACg8ocIdkzwhrlKnZH0a0YO76WdwNZxfM0sa8mfTM5wWsP0mRzy8sg=s96-c	["computer-science", "math", "language", "health"]	t	t	台灣@臺北市@中正區	["normal-student"]			{}	["interaction", "find-group"]	2024-11-03 06:08:09	2024-11-03 16:16:34	3	{"instagram": "", "facebook": "", "discord": "esencia.", "line": ""}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
672739a8a27d6db598ef6578	2000/11/03	university	zt.zerotest01@gmail.com	female	100928620432937957829	test zero	https://lh3.googleusercontent.com/a/ACg8ocI3gAt5F2zaye5zqY_VfMM8dQt8qWUi9xoG5-3eqmHp3CRPNg=s96-c	["language", "humanity", "life", "education"]	f	t	台灣@@	["normal-student"]			{}	["interaction"]	2024-11-03 08:51:52	2024-11-03 09:17:57	3	{"instagram": "123", "facebook": "", "discord": "", "line": ""}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
6727555fa27d6db598ef65ba	2001/10/16	university	a1000671@apps.ntpc.edu.tw	female	110653164849298503958	R	https://lh3.googleusercontent.com/a/ACg8ocIARxdzGS4oGY1PPFrydsSMIE5t49lltHJJOntKQmWRQPDfN5cp=s96-c	["language", "humanity", "education", "health"]	t	t	台灣@臺北市@	["normal-student"]		學習語言	{法文學習}	["interaction", "find-teacher", "find-group"]	2024-11-03 10:50:07	2024-11-03 10:58:47	3	{"instagram": "", "facebook": "", "discord": "", "line": ""}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
672b7ea1231270609bef792b	2001/01/31	university	chihyun900131@gmail.com	female	102323716395009930104	Selina Cheng	https://lh3.googleusercontent.com/a/ACg8ocKCMWxz7ggnwz8neJwPEtZm7Pq6jJxhyxOXqfvhNU81b7XFqHE=s96-c	[]	t	t	國外	["other"]	測試\n	111	{測試}	["interaction", "do-project"]	2024-11-06 14:35:13	2024-12-21 05:12:56	2	{"instagram": "111", "facebook": "", "discord": "", "line": ""}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
6731b77e231270609bef7e61	1996/08/22	university	joann.shen@thesouledu.org	female	118439372332585035938	沈潔伃 Joann Shen	https://lh3.googleusercontent.com/a/ACg8ocLq1XYrPrE3GuYWy4cq4y6hlFnygoqRjLUPzGGObpiWK0EeoeB_5g=s96-c	["humanity", "education", "business", "diversity"]	f	t	台灣@臺北市@中正區	["experimental-educator"]	我是潔伃（Joann），一位致力於教育創新的研究者、實踐者與催化者，專注於建構民主且包容的學習生態系統。我深信教育應該成為促進社會公平與變革的力量。\n\n過去我曾是自學生，透過特殊選才進入不分系後肄業，後以同等學力申請並完成多元文化教育碩士學位。十多年來，我在國際非營利組織、學術機構及社會企業中積累了豐富的實務經驗，也擔任多個縣市的實驗教育審議委員。\n\n我創辦了「魚水教育催化劑」並共同創立了「鯨落教育聯盟」，希望打造一個兼具在地特色與國際視野的教育智庫和行動平台。目前，我專注於國際教育研究與內容策展，期望推動更具影響力的教育實踐。	教育創新、民主教育、國際教育趨勢	{教育創新,民主教育,社會創新}	["interaction"]	2024-11-11 07:51:26	2025-01-22 13:50:36	3	{"instagram": "joannshen", "facebook": "joannshen0", "discord": "", "line": ""}	f	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
6731d643231270609bef7f21	1987/09/13	university	tungs13@gmail.com	male	102448538466361002662	林東翰	https://lh3.googleusercontent.com/a/ACg8ocIaXk00UXz5s8s3jySDUanRwvVVAkaPLzgIXKQxNOHemfwBro0a=s96-c	["humanity", "art", "health", "education"]	f	t	台灣@@	["other"]	想認識一起戶外運動的朋友。	網球、單車、爬山、潛水	{網球,單車,爬山,潛水}	["interaction", "find-group"]	2024-11-11 10:02:43	2024-11-11 10:03:49	2	{"instagram": "", "facebook": "", "discord": "", "line": "easthank"}	f	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
6731e865231270609bef7ff8	2008/07/14	high	mblin20080714@gmail.com	female	113402655832830981438	林米寶	https://lh3.googleusercontent.com/a/ACg8ocIEMF7Eh7Vr5nL07LJu_1rFQ7fcqRYf1uy-QblzwrNOPNGduLk28Q=s96-c	["art"]	f	f	台灣@新竹縣@寶山鄉	["experimental-education-student"]	來自新竹的自學生，喜歡acgn相關的東西。	算是蠻擅長繪畫的？	{繪畫}	["interaction"]	2024-11-11 11:20:05	2024-11-12 06:59:13	3	{"instagram": "ayakonkoyo.122_", "facebook": "", "discord": "ayakonkoyo", "line": ""}	f	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
6731e953231270609bef802b	2008/01/25	high	babykuo2008@gmail.com	male	103032153380276127015	郭家豐	https://lh3.googleusercontent.com/a/ACg8ocI0wvgyE-8Z4eH6jmyJYE0R8XA-bFSqU8pbuxjuKs-bfx8zg3s3=s96-c	["language", "math", "computer-science", "art", "education", "life", "humanity", "health", "diversity", "learningtools"]	t	t	台灣@新北市@板橋區	["experimental-education-student"]	自學生. 	應該還算擅長思考	{體驗遊戲,喜歡思考}	["interaction"]	2024-11-11 11:24:03	2024-11-11 12:16:31	2	{"instagram": "", "facebook": "", "discord": "babykuo4", "line": ""}	f	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
6731eab1231270609bef808f	2008/03/03	high	poshuin@gmail.com	male	108980377151800081369	璿糧	https://lh3.googleusercontent.com/a/ACg8ocKdgZNSp9ahhWEV3yq6xJLYcycx8Lyci98cMhYW5U7c_REhmUkz=s96-c	["diversity", "health", "education", "learningtools", "art", "life", "humanity"]	t	t	台灣@新北市@板橋區	["experimental-education-student"]	16歲高中自學生	料理	{料理,自主學習,音樂,電繪,社會參與}	["interaction", "find-group", "find-student"]	2024-11-11 11:29:53	2024-11-11 12:08:04	3	{"instagram": "meidosandayo0303", "facebook": "", "discord": "aww20080303", "line": ""}	f	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
6731ecdb231270609bef81b9	2007/01/31	high	everett138858@gmail.com	male	103727447655085789589	宏駿	https://lh3.googleusercontent.com/a/ACg8ocJM8AoKVQwJNBpFG6WnP7doaT0xxzVk4jdujKxKxs62NkT71jr2=s96-c	["nature-science", "math", "computer-science"]	f	f	台灣@桃園市@中壢區	["experimental-education-student"]	自學生，偶爾寫寫腳本\n物理和航太工程愛好者		{航太工程,天文,物理}	["interaction"]	2024-11-11 11:39:07	2024-11-11 12:05:03	5	{"instagram": "everett0131", "facebook": "", "discord": "everett0131", "line": ""}	f	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
6731ed3b231270609bef81e8	2008/07/10	high	emily.pingu@gmail.com	other	116779012477512824363	黎杏	https://lh3.googleusercontent.com/a/ACg8ocKehjNZ0dmFFxpkq1L1h-F7ji3yBW_BhmNmz4nYisVymyP5PyoM=s96-c	["art", "humanity"]	f	f	台灣@高雄市@楠梓區	["experimental-education-student"]	あ	1	{電繪}	["interaction"]	2024-11-11 11:40:43	2024-11-11 12:29:21	2	{"instagram": "", "facebook": "", "discord": "moyomi._22", "line": ""}	f	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
6731ef12231270609bef8353	2007/09/25	high	bc0928.5@gmail.com	male	117481081556119616274	吳秉謙	https://lh3.googleusercontent.com/a/ACg8ocK2E-H5quvTwV4Z3hm8x0IkfvzFoTKKuo0xe3JlYOxkpn6vev33=s96-c	["life", "art"]	f	f	台灣@臺南市@安南區	["experimental-education-student"]	17歲高中生	料理	{料理}	["interaction"]	2024-11-11 11:48:34	2024-11-11 12:16:56	2	{"instagram": "12", "facebook": "12345", "discord": "_debussy", "line": "123456"}	f	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
6731ef2f231270609bef8368	2008/11/01	high	johnny970103@gmail.com	male	100037073962042333365	Nigellus	https://lh3.googleusercontent.com/a/ACg8ocLXBe5YzXdjaLjFpde6p1vzf2gh43_z7QgHDZAuKs5VGSRwBQNa=s96-c	["art", "math"]	f	f	台灣@@	["experimental-education-student"]	遊戲宅\n遊戲最近常玩MH		{遊戲}	["interaction"]	2024-11-11 11:49:03	2024-11-11 12:00:43	2	{"instagram": "johnny1025852", "facebook": "", "discord": "617052817970036736", "line": ""}	f	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
6731ef46231270609bef8372	2007/11/11	high	chingyung3131@gmail.com	male	115652487158444391711	林靖詠	https://lh3.googleusercontent.com/a/ACg8ocK6FlWMP7Rpp8ewrLiXA4FTkiaz81Sgzd351vrKDYFHDO_G8ks2=s96-c	["language", "humanity", "art", "life", "health", "education", "business"]	f	f	台灣@雲林縣@土庫鎮	["experimental-education-student"]	華德福高中生，休學中	藝術、閱讀	{當代藝術,摺紙}	["interaction", "do-project", "find-group", "find-teacher"]	2024-11-11 11:49:26	2024-11-11 11:51:32	2	{"instagram": "chingyung_origami", "facebook": "", "discord": "", "line": ""}	f	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
6731efa5231270609bef83a6	2006/11/28	high	juku112812345@gmail.com	female	109021244891626734156	喬高	https://lh3.googleusercontent.com/a/ACg8ocJ9JTvscJcXR4Xj6RIySlf-gf23G20VUzDJt0-02ZiyT1Tewwk=s96-c	["humanity", "language", "nature-science", "art", "education", "life", "health", "learningtools", "diversity", "business"]	f	t	台灣@臺南市@永康區	["experimental-education-student", "other"]	哈囉~\n我是個17歲台南高三自學生，是暖暖蛇青少年共學團高中部成員，也是台南市第七屆兒少代表\n加入這個社群是想認識更多夥伴與學習資源，歡迎認識～	音樂 藝術 社會參與 自主學習	{藝術,音樂,社會參與,自主學習}	["interaction", "find-group", "find-teacher", "find-student"]	2024-11-11 11:51:01	2024-11-11 12:03:20	2	{"instagram": "juku_1128", "facebook": "", "discord": "", "line": ""}	f	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
67320443231270609bef870b	1991/11/11	-1	77vincentxu@gmail.com	other	109440074892741977911	Vincent Xu	https://lh3.googleusercontent.com/a/ACg8ocJY7zItiXCAkgIx4SO2yJashfzaQYAMhdKd3Ccczk08QaMRSg=s96-c	[]	t	t	@@	["citizen"]	測試中	測試	{城市}	["interaction"]	2024-11-11 13:18:59	2025-01-08 15:12:13	1	{"instagram": "", "facebook": "", "discord": "Discord", "line": ""}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
67332581231270609bef8a82	2004/01/19	university	0119eugene0119@gmail.com	male	105925790542734537952	蘇雨青	https://lh3.googleusercontent.com/a/ACg8ocIVoAR8A1NLZwbWAfvpysfIFMfie2Hel3FlZW5fM6KgfMrdmA=s96-c	["humanity", "education", "life", "diversity", "learningtools"]	t	t	台灣@@	["experimental-education-student", "normal-student"]	目前是學生		{社會議題}	["interaction", "find-group"]	2024-11-12 09:53:05	2024-11-12 11:31:49	2	{"instagram": "0119teal435", "facebook": "", "discord": "", "line": ""}	f	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
673475ab927c5a37b4727344	2001-11-13T09:45:35.442Z	\N	selina900131@gmail.com	female	111911643256231907161	鄭知	https://lh3.googleusercontent.com/a/ACg8ocLKJKsMeXj-ocIPjB-2KDryTo71c78E8xbNHJ3ArVIhD_hQdQ=s96-c	[]	t	t	\N	["normal-student", "citizen"]	\N	\N	{}	[]	2024-11-13 09:47:23	2024-11-13 09:47:23	0	\N	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
673595f69daeb56dac5101be	1997/11/14	-1	cheali@gapp.nthu.edu.tw	other	105073604906112167750	Min	https://lh3.googleusercontent.com/a-/ALV-UjW0k2JPXNs3FpV8r9iWIP9V0ZCz54KwMA8dDMvHofiInunAdz5qqY3xaxYTX7AorR1YgDHjA20dcsEmNoeJC6bhCiES_4EDPBVDU_Gd2NrbQcs5xMXMI1ptwzIly0BuETadqhI4068GqAbYbwqR-4CCSoEcFzCJW9eQRrgCKb9iGnVYbj9-qd5nIagbxMBFzEcmSQlYc7ckemOOqcjjFjbdPVPKpwLiNkzcR5AyRMBes3mdoIy_QPHMQQyZFRCu3n2xZfSreT8eCCFAkvIGQv5HPWBKzrAWWXCZYZrqjvJZTdHTeNTtcXwNkvmFP6Tg4Uy0fzeyOSwzqtLzVXJKw0pbxoKNnFDcWMZwpOa7-JxwowvqaKKkzLiHBgY4zIQcF-CkRJCR70tQTKsUnvMU1QH-x8XDUmnu8lYMWZhbzJRr0kMHU5GXXwrF_lSNv0LvDzbZYIk9JwMsySN20fSIRP9DUVwUrnlKOUtQrSaDeGuc-1pi2cf_EdbQ0g26P3l5jXj3blBxYgBdAMTRl1qc245hwVZUjVefESjZsH4OZsZPuJSxARWr-ohzkP4ZoyvOcZDHjB2Hl22mdwIDIQ_4OEiJAIamfy4oS-gP57raaglrUtAajBX9hv7U9pwkriMVn1AQdFQ6d9Y2xj2T4t5VewVZQxpV9BxTrK7JlYacAt3D-g_xPYzgK3U6xNFsN5yTRijji_3prydBI3jdlImNlhVhTUVeKoJ5tBhxJTl24NiPu7IKYVil2lVo3s14S6N8nYa7s8Frg3aOLBOd3okNPAUGM--mNx51CNJID5prtSlHAO1OfcYSwYBUGEZ92VqkVoMy0izuUThkDvkkPaXKvc_gBhpRU1U5yskDcdfa5nUtP047D2ptyLKxz9cAV35tpIedSvvWXXpCLSJ7IYMqqaqlMjM9s2RyfE9MAV2MG_wrGfpTMyWY9Pm3hM0VHbr4-pCWWPK3U9-yWkUgVv3o-MF8z4k=s96-c	["language", "humanity", "education", "art", "business", "diversity", "learningtools"]	f	f	@@	["other", "experimental-educator"]	N/A		{教育}	["interaction"]	2024-11-14 06:17:26	2024-11-14 06:20:07	2	{"instagram": "123abc", "facebook": "123abc", "discord": "123abc", "line": "123abc"}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
6735d2809daeb56dac510223	1992/05/18	other	hsuchuting@gmail.com	female	118088572207392190145	許筑亭	https://lh3.googleusercontent.com/a/ACg8ocIctCxXs7hG7zwGx0SY7ATGShHDQDuvctiFgL34DCdod7ExmgtZYA=s96-c	["language", "life", "humanity", "education", "learningtools"]	t	t	台灣@屏東縣@屏東市	["citizen"]	大家好\n我是Judy\n希望找到能練習英文口說的夥伴		{語言學習}	["interaction"]	2024-11-14 10:35:44	2024-11-14 10:42:30	2	{"instagram": "", "facebook": "", "discord": "", "line": "kyochikutei"}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
6747bea09daeb56dac511858	1906-11-28T00:50:50.727Z	\N	wala030hi@gmail.com	female	118298144323757694533	wala	https://lh3.googleusercontent.com/a/ACg8ocIpaEGPrwx8ctYiYOgoZXiNvOqxFHF8XGInXBXz9jOi2AGM_k0=s96-c	["language", "humanity"]	t	t	\N	["normal-student"]	\N	\N	{}	[]	2024-11-28 00:51:44	2024-11-28 00:51:50	1	\N	f	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
674e6b239daeb56dac511a2a	2007/09/23	high	cpu299428@gmail.com	female	100804759405685552024	Chen Pu	https://lh3.googleusercontent.com/a/ACg8ocLksokP1hKKuSITvZtWAS4aGuXGOM8gdJH2SdFAbjsAqq5ftw=s96-c	["math", "computer-science", "life", "business", "diversity", "learningtools", "nature-science"]	t	t	台灣@新竹縣@竹北市	["experimental-education-student"]	一個平平無奇的高中自學生	理工我都愛	{程式}	["interaction", "do-project", "make-group-class"]	2024-12-03 02:21:23	2024-12-03 02:25:12	2	{"instagram": "ya_chen_0923", "facebook": "", "discord": "", "line": ""}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
674e81a29daeb56dac511a44	2008/12/03	high	peichun971203@gmail.com	female	111451988706131893790	沛淳	https://lh3.googleusercontent.com/a/ACg8ocLySpNGpoX6Egoq4hvXHJTSpapapdln0TMcG-ClTfBT4MN66KEZ=s96-c	["humanity", "art", "language", "health", "learningtools", "life", "diversity"]	t	t	台灣@高雄市@	["experimental-education-student"]	暖暖蛇青少年共學團的高一生，超喜歡跳舞，對舞蹈有興趣的可以交流交流	Kpop舞蹈、HipHop舞蹈、韓文、自主學習	{韓文,舞蹈,自主學習,Kpop,HipHop}	["interaction", "make-group-class"]	2024-12-03 03:57:22	2024-12-03 04:03:23	2	{"instagram": "", "facebook": "", "discord": "chun1203", "line": ""}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
67529f6f9daeb56dac511e17	1994/10/03	university	seanlin1003@gmail.com	male	117776078720494929491	林宇祥 鳥巢老師	https://lh3.googleusercontent.com/a/ACg8ocI-ye6OQqVreY5XfKop2C1nsJZRjwfbWt4g2h-ZF-RslbsZGBU=s96-c	["math", "computer-science", "nature-science", "humanity", "education", "learningtools", "business", "life", "health", "diversity", "language", "art"]	t	t	台灣@臺中市@南區	["experimental-educator"]	嗨，我是 鳥巢，一位自學成長的教育工作者，兼具思想家的視角、民主教育的實踐者以及社會改革的推動者。此外，我還是一名半自造者（Maker），熱衷於動手實踐與創造。\n\n* 教學經驗：\n  * 有開過的課程：數學、桌遊、民主、生活課（**情緒課、政治課、談判課）**、程式設計（Scratch、python）、科學、可編程電路板（樹莓派、Arduino、micro:bit）、兒童陪伴、小旅行、歷史課、學科課程。\n  * 曾協助厭惡數學的學生轉變為熱愛學習者，擅長激發學生的學習動機與自主學習能力。\n* 專業背景：\n  * 第一屆 實驗教育工作者培力計畫 實習於全人中學，參與民主教育工作坊。\n  * 擔任 實驗教育勞動合作社理事，致力於體制外教育的推動。\n  * 深入理解數學教育與科學教育的本質，將理性與創造力融入教學。\n* 樂於實作與創造：\n  * 自學 Python 與 Arduino，涉足 Maker 領域，樂於解決問題並動手製作。\n  * 善於將解決問題的過程延伸至實際操作，享受修理與創造的樂趣。\n* 熱愛心理學與哲學：\n  * 喜愛哲學，生活目標是「愛智」。\n  * 擁有一定的心理輔導與諮商經驗，善於傾聽與分析問題。\n\n教學理念\n\n* 人本教育： 相信每個人都應被「好好對待」，教育應以人為核心，尊重其主體性。\n* 民主教育： 推動學習者與教育者共同協作，創造自由探索的學習環境。\n* 遊戲化學習： 通過桌遊、數學遊戲等方式，讓學習變得有趣且富有探索性。\n* 問題導向學習： 善於從學習者的困惑與問題出發，引導深度學習與批判性思考。\n\n教學地點與未來計劃\n\n* 於 2023 年 6 月回到台中定居，目前積極籌備與推動一所「好好對待人」的學校。\n* 希望結合數理科學與民主教育的理念，營造更多元的學習模式，幫助學生從中探索世界與自我。\n* 正在執行的計畫：[**<u>教育合作合作家庭計劃 </u>**](https://docs.google.com/document/d/1cf_GdFTtxWT7XpJYzem8196x32z9uPPE8awFCpZjMZ8/edit)\n\n更多資訊歡迎參考 <u>粉絲專頁：</u>[<u>鳥巢老師的無權威教室</u>](https://www.facebook.com/profile.php?id=100063695272307)	民主教育、議事規則、開會效率、數理科學、程式、遊戲	{民主教育,議事規則,數理科學,程式,遊戲}	["interaction", "do-project", "make-group-class", "find-group", "find-teacher", "find-student"]	2024-12-06 06:53:35	2024-12-06 07:16:05	2	{"instagram": "seanlin1003", "facebook": "", "discord": "", "line": ""}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
6752bab39daeb56dac511e4d	2000-12-13T08:49:23.000Z	\N	ivange@stockfeel.com.tw	male	101050137213455213587	葛修承	https://lh3.googleusercontent.com/a/ACg8ocIiKKE7hsvtWg7KXQTj2WjcWwA6DwTwWWZ4Y8mk0JtQpse1jQ=s96-c	["art"]	t	t	\N	["experimental-education-student"]	\N	\N	{}	[]	2024-12-06 08:49:55	2024-12-06 08:50:10	1	\N	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
675395339daeb56dac512278	1988-04-12T00:21:20.000Z	\N	chingling412@gmail.com	female	107684431380435791703	椪柑	https://lh3.googleusercontent.com/a/ACg8ocL5tvk4ipsBs3i7TX0U5j1T6iZ6k7eyNMkvUm8kj8xJ-Bl0gPwH=s96-c	["art", "education", "life", "health"]	t	t	\N	["experimental-education-parent"]	\N	\N	{}	[]	2024-12-07 00:22:11	2024-12-07 00:23:03	1	\N	f	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
67551ee49daeb56dac51250d	2000-01-27T04:21:19.000Z	\N	jeanlin0127@gmail.com	female	109076149384438491661	林祉均	https://lh3.googleusercontent.com/a/ACg8ocI29bJFvJhDTqrJ3MpJ4y_w__9X1xLmBhVLx_nwClshCjmwjw=s96-c	["language", "education", "health", "learningtools", "life"]	t	t	\N	["experimental-educator"]	\N	\N	{}	[]	2024-12-08 04:21:56	2024-12-08 04:22:13	1	\N	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
67604156c58563e57e7e7fb5	2007/06/15	high	allywen7@gmail.com	female	109321322196345014786	Wen Ally	https://lh3.googleusercontent.com/a/ACg8ocIGWX-fLNMGtP1HzhQHj6CcTGqT86jylD0ZWZ523PyiXR1U-U347Q=s96-c	[]	t	t	台灣@苗栗縣@竹南鎮	["experimental-education-student"]	07'｜TW｜UK\nchin&eng		{社會議題}	["interaction", "make-group-class", "do-project", "find-group"]	2024-12-16 15:03:50	2024-12-16 15:03:50	0	{"instagram": "a.l.l.y_615", "facebook": "", "discord": "", "line": ""}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
6760492ac58563e57e7e7fd7	2007/10/17	high	llee.chier@gmail.com	female	100979786785072389973	賴季兒	https://lh3.googleusercontent.com/a/ACg8ocLz_2bS_bLUp02BAEpTRpomyNjIX7hChNUMsp2zMWglANq_Ye0=s96-c	[]	t	t	台灣@臺北市@大安區	["normal-student", "experimental-education-student"]	嗨，我是季兒，是位剛從體制內切換到體制外的17歲高中生。\n原本日常興趣主要是關注社會議題，並探究其議題裡的內容，\n我是個對於事情的表面或現象會好奇，並想更加深瞭解"如何形成"的人。\n(通常學習動機也是來自這原因)\n這讓我知道的東西還算豐富，但就是不太精。\n\n近期因為政治和太關注外界(新聞、社會議題)心太動盪，\n所以我最近比較常在音樂創作、藝術、攝影這部分領域努力，\n也是因為剛自學，才有這樣的時間可以用在這些領域上。\n\n最近也打算多讀點書，有足夠的知識在議題上努力，才會有用。	我擅長思考、論述，可以分享…興趣以內的事情我可以分享資源！	{音樂創作,彈吉他,社會議題,政治,人權,藝術,穿搭,看電影,自我成長,唱歌,追歌手,聽音樂,打電動,攝影}	["interaction", "find-teacher", "make-group-class", "find-group", "do-project"]	2024-12-16 15:37:14	2025-01-24 12:26:23	1	{"instagram": "__sqiv", "facebook": "", "discord": "", "line": "ziyan961017"}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
676059b7e9e593a8f3ef07e7	2005-11-02T16:47:13.000Z	\N	94saraguo@gmail.com	female	116609051273486403376	郭亮真	https://lh3.googleusercontent.com/a/ACg8ocIILsVanQicVhZSN1rREbP-sjVkTY4jJ1fAA8cKKN1YqDqBsOA1=s96-c	["math", "computer-science", "nature-science", "humanity", "life", "business", "learningtools", "diversity"]	t	t	\N	["normal-student"]	\N	\N	{}	[]	2024-12-16 16:47:51	2024-12-16 16:47:51	0	\N	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
67616f73e9e593a8f3ef093d	1989-12-27T12:32:11.000Z	\N	shana781227@gmail.com	female	113872632697567855313	李珊	https://lh3.googleusercontent.com/a/ACg8ocJaMW3LtsZ2cHSgwAvaBCvqvjLZIkD17qtsoDMtMoWppAGefg=s96-c	["learningtools", "health", "math", "life", "art", "nature-science"]	t	t	\N	["experimental-educator", "experimental-education-parent"]	\N	\N	{}	[]	2024-12-17 12:32:51	2024-12-17 12:32:51	0	\N	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
676293c5e9e593a8f3ef0b1b	1900-12-18T09:19:24.319Z	\N	geo89466@gmail.com	male	103747068580566558621	geo	https://lh3.googleusercontent.com/a/ACg8ocKTlyDn-XR63eLmiu0CUtOa3CHSxq7MYDkYXJB6cZ4nE0O1Fw=s96-c	["language", "nature-science", "health", "business", "art", "math", "computer-science", "education", "diversity", "learningtools", "life", "humanity"]	t	t	\N	["experimental-education-student"]	\N	\N	{}	[]	2024-12-18 09:20:05	2024-12-18 09:20:05	0	\N	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
6762bfcce9e593a8f3ef0b62	1996/03/01	university	inorganicom@gmail.com	other	113256542431929443180	青	https://lh3.googleusercontent.com/a/ACg8ocJ93JVdfqdhbtVNp3wUXl3KzJxd8z0_TjeS28mEuhziFc1GBkjF=s96-c	[]	t	t	台灣@臺北市@	["other"]	劇場、覺察幫我開了天眼&#x20;\n靜靜的、細細的、清晰的&#x20;\n發現無數美好&#x20;\n並用身體相信\n\n* **信仰**　：劇場、非暴力溝通、接觸即興、黑人音樂、教育\n* **正在學**：劇場、接觸即興\n* **有興趣**：社會學、性別、文學、創作、職涯、社群、生產力工具、設計	街舞、劇場遊戲、接觸即興、黑人音樂	{劇場,舞蹈,創作,自媒體,職涯,生產力工具,設計,街舞,接觸即興,黑人音樂,教育,社群,社會議題,饒舌,影音剪輯}	["interaction", "find-group"]	2024-12-18 12:27:56	2025-01-24 09:20:59	3	{"instagram": "inorganicomm", "facebook": "", "discord": "", "line": ""}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
67645cc4e9e593a8f3ef0da3	2004/10/04	university	henrylee10042004@gmail.com	male	110063217477104137877	Henry Lee李昊翰	https://lh3.googleusercontent.com/a/ACg8ocKQfzM-O0XcKjnADtXs-EUyPMb6Ed8T9W95xCaezsDKs1Sfv1um=s96-c	[]	t	t	國外	["normal-student"]	我是Henry，現在於美國西北大學就讀學習科學系(Learning Sciences)大三。\n\n我從高中開始投入校內外營隊辦理、團隊培訓、學生權利發聲、家教、升學輔導，覺得和學生一起共創學習體驗是我的成就感來源。\n\n目前持續摸索，如何將學術產出的理論，融合進以學生為本的學習體驗之中，設計出符合學習需求的產品。\n\n最近想要:\n學習... 量化數據分析技巧、學習體驗設計(Learning experience design)\n探索... 我對於哪個教育主題較有興趣，正在涉略的有: 團隊合作及溝通的訓練、遊戲化和動機培養\n\n我喜歡交流討論學習是如何發生的，喜歡教育新創的環境，也正在探索學術研究，以決定未來是否攻讀博士。	心理學、學習科學、營隊設計、美國留學、UX	{以人為本設計,教育科技,遊戲化,UX,產品,使用者研究}	["interaction", "do-project", "find-group"]	2024-12-19 17:49:56	2024-12-19 17:49:56	0	{"instagram": "leehaohan20", "facebook": "", "discord": "", "line": "0920403960"}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
67651475e9e593a8f3ef0e86	2006/12/02	-1	woodychen1202@gmail.com	male	111467758725390114236	陳國興	https://lh3.googleusercontent.com/a/ACg8ocJc1QPbulDj2xWzxly1EJ3I2TgLRRb9rmEWnWLC_Jzw-a_Byj4=s96-c	["learningtools", "business", "computer-science", "humanity", "education", "life", "diversity"]	f	t	@@	["normal-student"]	Hi\\~目前我是一位高中生，目前透過特殊選才上了財金系，想要透過這段空閒時間精進自己，並且突破自己的舒適圈。	財金、投資理財、社群經營	{財金,投資,社群經營}	["make-group-class", "do-project", "find-group", "find-teacher", "interaction"]	2024-12-20 06:53:41	2024-12-20 07:03:15	1	{"instagram": "", "facebook": "", "discord": "ww2ed", "line": ""}	f	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
6766a81be9e593a8f3ef10d1	1993-01-29T11:35:09.000Z	\N	ss880309@gmail.com	male	116101706541784983321	Yang Lin	https://lh3.googleusercontent.com/a/ACg8ocKHwiRdaw96EPEIsmFuP_V7vLAr_7rp37M7-KPnWVoZJFl8k5E=s96-c	["computer-science", "education", "health", "language"]	t	t	\N	["other"]	\N	\N	{}	[]	2024-12-21 11:35:55	2024-12-21 11:35:55	0	\N	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
6766ccbbe9e593a8f3ef1121	2004-11-12T14:11:19.000Z	\N	jolin.kuo66@gmail.com	female	110704154291169790166	郭映岑	https://lh3.googleusercontent.com/a/ACg8ocLAbdZ5OK7bmU2eW5qwAVPtVc2lQ0mzKwNoQ069O_evAEwhthA=s96-c	["humanity", "art", "education", "business", "learningtools", "life"]	t	t	\N	["normal-student"]	\N	\N	{}	[]	2024-12-21 14:12:11	2024-12-21 14:12:11	0	\N	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
67672dede9e593a8f3ef11d2	2006/10/22	high	lcy0901ww@gmail.com	other	108980782635501132868	cy L	https://lh3.googleusercontent.com/a/ACg8ocKKNLZagpqpo9RZCOJqjgzDYL39UzQhN7bTEMTN7KnXKCs1EuVwsQ=s96-c	[]	t	t	台灣@新北市@永和區	["normal-student"]	想一起拍微電影		{攝影,藝術,文學,穿搭,展覽,吉他,音樂,樂團,資管,電影,吉伊卡哇,卡皮巴拉}	["interaction", "do-project", "make-group-class", "find-group", "find-teacher"]	2024-12-21 21:06:53	2024-12-21 21:06:53	0	{"instagram": "ze.lofilcy_meow", "facebook": "", "discord": "lofilcy", "line": "lcyww1022ouo"}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
676a0f3718e6b11da60577ed	1999/07/15	university	jiayounikehuzhe@gmail.com	male	103355390847818537564	雨瑄 Simon	https://lh3.googleusercontent.com/a/ACg8ocJ7E6DmEtp7W87e2CVadFEIHUebRLCMVqs0_WX70aN_Ra8BGA=s96-c	[]	t	t	台灣@@	["citizen"]	待補		{攝影、閱讀}	["interaction"]	2024-12-24 01:32:39	2025-01-19 11:36:32	1	{"instagram": "simon880715", "facebook": "", "discord": "", "line": "0912400541"}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
676ae06618e6b11da6057954	1996-12-08T16:24:46.000Z	\N	d22495521@gmail.com	male	116638439830406734412	大頭	https://lh3.googleusercontent.com/a/ACg8ocKiH1WK-27hH6s839O3eWzK7D0c6k4aX92DaMXklRSrIgHkh2Q=s96-c	["language", "computer-science", "life", "health"]	t	t	\N	["citizen"]	\N	\N	{}	[]	2024-12-24 16:25:10	2024-12-24 16:25:10	0	\N	f	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
676c0cd418e6b11da605822e	2006/12/26	high	ting.v.chen@gmail.com	male	105837742014235946602	陳彥廷	https://lh3.googleusercontent.com/a/ACg8ocJFiBD7M64emxQMwnVHkdmtCPnImKzH21xTPs9HGakWDhTkhha9=s96-c	[]	f	t	台灣@彰化縣@彰化市	["experimental-education-student"]	一位喜愛思考的人，觀注各種議題，透過自學重新學習如何學習，並重新認識自己。	自己對「如何學習」的看法	{教育議題,社會議題,環境保護,程式語言,學習科學,社會學}	["interaction", "find-teacher"]	2024-12-25 13:47:00	2025-01-13 04:36:22	2	{"instagram": "", "facebook": "", "discord": "", "line": "None"}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
676c2f2818e6b11da60582b0	2003/07/21	university	pekohsiao21@gmail.com	female	106064893729697555406	Yi-Chih Hsiao	https://lh3.googleusercontent.com/a/ACg8ocJ3EySdkzwXR6L_Y-72xPUK7USjsHySHvDWkWda-4KunLx35eea=s96-c	[]	t	t	台灣@桃園市@中壢區	["normal-student"]	哈嘍！我是目前大三的學生		{日文,程式語言,文學,英文}	["do-project", "find-group", "find-student", "make-group-class", "interaction"]	2024-12-25 16:13:28	2024-12-25 16:13:28	0	{"instagram": "hey4ol", "facebook": "", "discord": "", "line": ""}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
676c3d9a18e6b11da60582c2	2007/05/14	high	ctc.chang0514@gmail.com	male	100619003070105487192	Oliver	https://lh3.googleusercontent.com/a/ACg8ocJPi-KuyrNeXLyU8yWbrWSNSE1upl9QmLzi0uWXpJ1PQ_IH9Uqx=s96-c	[]	t	t	台灣@@	["experimental-education-student"]	 		{INFJ}	["interaction"]	2024-12-25 17:15:06	2025-01-11 08:41:20	0	{"instagram": "z.junce", "facebook": "", "discord": "", "line": ""}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
676c3fdb18e6b11da605832d	2006/01/24	high	a0912358866@gmail.com	male	108997867341560075781	洪綱霆	https://lh3.googleusercontent.com/a/ACg8ocL-QTtPw07P-vBAOayqhB57M9v7QKoWoHPEpDdJRlTXkSSGqfkp=s96-c	[]	f	f	台灣@臺中市@北屯區	["experimental-education-student"]	  	 	{infp,學習,教育}	["interaction", "do-project", "make-group-class", "find-student", "find-teacher"]	2024-12-25 17:24:43	2025-01-19 02:29:52	0	{"instagram": "", "facebook": "", "discord": "", "line": "leoleo60707"}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
676e534618e6b11da6059198	2005-10-30T07:11:25.000Z	\N	linyancheng89@gmail.com	male	101042250396063705292	林晏丞	https://lh3.googleusercontent.com/a/ACg8ocKpu_7SrRIW_GfC0-tx9PzmqodoQoHgbXdlDU6T_DmqNZkbQLMi=s96-c	["language", "humanity", "art", "education", "health", "learningtools"]	t	t	\N	["experimental-education-student"]	\N	\N	{}	[]	2024-12-27 07:12:06	2024-12-27 07:12:06	0	\N	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
6770f7024b6a24b8351d5900	2004-01-19T07:14:36.000Z	\N	terry.f.wang@gmail.com	male	117117540953571876315	Tofus Wang	https://lh3.googleusercontent.com/a/ACg8ocLCTQGwwl7ZAWRfTwo9eRSwiYo53glbO9Fcvr0Zamob9EIj1SLspw=s96-c	["humanity", "computer-science", "art", "language", "life", "business"]	t	t	\N	["normal-student"]	\N	\N	{}	[]	2024-12-29 07:15:14	2024-12-29 07:15:14	0	\N	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
677111784b6a24b8351d5b36	2002/11/14	university	eddie8873192@gmail.com	other	118164228640863446501	米露露	https://lh3.googleusercontent.com/a/ACg8ocIo6548hBRXRNCY1BBL4TLgACK6qjOCzc1lW4nmfpHlyxpBrNo=s96-c	[]	t	t	台灣@臺北市@南港區	["other", "normal-student", "experimental-education-student"]	我是自學生，大家可以來和我交流，在學習程式		{程式語言,插畫,社會議題}	["interaction", "do-project", "find-teacher"]	2024-12-29 09:08:08	2025-01-24 15:30:06	0	{"instagram": "eddie41729616", "facebook": "LaiYiPai", "discord": "", "line": "41729616"}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
6771676f4b6a24b8351d62b4	2005/11/22	high	the.oc1122@gmail.com	other	111338826674960151059	莊庭祐	https://lh3.googleusercontent.com/a/ACg8ocJM1ZgYKUKPEXBjrKRFhosBBQ0oIsOZ_PB-_fv755vyTE09ujjb=s96-c	[]	f	f	台灣@高雄市@	["normal-student"]	哈囉！我是喜歡吃卡拉雞腿堡的卡拉！\n平常很害羞，喜歡躲在床上冬眠跟潛伏在劇場和串流平台觀賞戲劇作品。\n希望可以透過這個平台探索平常沒有勇氣（或純粹懶惰）去做但有興趣投入嘗試的學習活動。		{劇場,戲劇,電影}	["interaction", "make-group-class", "find-group"]	2024-12-29 15:14:55	2024-12-31 11:35:42	0	{"instagram": "excellent_tingting", "facebook": "", "discord": "", "line": ""}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
67719cc64b6a24b8351d64de	1955/12/30	-1	pinchen0221@gmail.com	female	106953113257414718651	pinchen	https://lh3.googleusercontent.com/a/ACg8ocL51fxQbplVorK0fBmOb2vmAx7pXTm_GGk3xWaTW96DOSDZ1Q0=s96-c	[]	t	t	@@	["normal-student", "citizen"]	叔叔		{vhh}	["interaction"]	2024-12-29 19:02:30	2024-12-29 19:02:30	0	{"instagram": "mhfh", "facebook": "vhnncfdg", "discord": "vchh", "line": "ghvgjjk"}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
677292a44b6a24b8351d6b22	2005-12-15T12:30:37.000Z	\N	pennyw0918@gmail.com	female	113411249004210739480	新W易平	https://lh3.googleusercontent.com/a/ACg8ocJZrjT5kpDGQhjawpgMBPTu9Qz1KG99FvCmCtYOyUMocD46yluniA=s96-c	["language", "computer-science", "art", "learningtools", "diversity", "health"]	t	t	\N	["other"]	\N	\N	{}	[]	2024-12-30 12:31:32	2024-12-30 12:31:32	0	\N	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
677824d54b6a24b8351d8f44	1978-01-03T17:56:02.580Z	\N	hackertw@st.tc.edu.tw	male	113076058937048686080	許志傑	https://lh3.googleusercontent.com/a/ACg8ocJ8egp2fJobtSyD2JzGiUQMLA0-Or3r4wIlBe4ASOEftUyRnw=s96-c	["education"]	t	t	\N	["experimental-educator"]	\N	\N	{}	[]	2025-01-03 17:56:37	2025-01-03 17:56:37	0	\N	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
678a5c596662cd04f9688e5c	2009/01/17	high	yufish0117@gmail.com	other	104462551034278254851	ChauYi Yu	https://lh3.googleusercontent.com/a/ACg8ocKwpQR2kV-1IOChX3ZFKmTBUZOmCbxYv1G8ylEnkHpo-PsslkiS=s96-c	[]	f	t	台灣@@	["experimental-education-student"]	我是來自臺北市數位實驗高中的Joey，我平常關注社會議題，喜歡透過科技工具解決問題！		{社會議題,科技工具,科技教育,攝影,心理,實驗教育}	["interaction"]	2025-01-17 13:34:17	2025-01-24 06:38:13	0	{"instagram": "yufish0117", "facebook": "", "discord": "", "line": ""}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
677b6a024b6a24b8351d9f56	2007/09/09	-1	govantelsa289@gmail.com	female	108785011757001831100	Elsa	https://lh3.googleusercontent.com/a/ACg8ocKNBMrHZDB6V0LdfWAzuGCAk4gMBOK1SWeqC7N3bnuymIQIC4oM=s96-c	["language", "humanity", "art", "education", "life", "health", "business", "diversity", "learningtools"]	t	t	@@	["normal-student", "experimental-education-student"]	目前就讀ib體制的高中生		{音樂創作,藝術,社會議題,教育,心理學}	["interaction", "find-teacher", "find-student", "make-group-class", "find-group", "do-project"]	2025-01-06 05:28:34	2025-01-06 08:56:39	1	{"instagram": "elsssss.09_", "facebook": "", "discord": "", "line": "willpower_5"}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
677e1d1f0bfe245fc83826e7	1995/12/10	university	yogajuni1210@gmail.com	female	110380971192669587752	Juni Huang	https://lh3.googleusercontent.com/a/ACg8ocJgLZd3nCcewxu5aS8U2tYmig-9pC8R5aO90gv7Dycih_3lwMg=s96-c	[]	f	t	@@	["citizen"]	想學習產品設計相關知識		{產品設計,UI,UX,Figma}	["interaction", "make-group-class", "find-group", "find-teacher", "do-project"]	2025-01-08 06:37:19	2025-01-08 06:37:19	0	{"instagram": "", "facebook": "", "discord": "juni02118", "line": ""}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
677e32fb0bfe245fc8382841	2007-12-10T16:00:00.000Z	\N	210584@email.wlsh.tyc.edu.tw	female	103081807378756843030	蔡東羽	https://lh3.googleusercontent.com/a/ACg8ocKHywP4GA0j8lldIrmj0iWCCNJF4FlR30hVb15aUDUoMn-lRg=s96-c	["language", "math", "computer-science", "life", "education", "health", "learningtools", "business"]	t	t	\N	["normal-student"]	\N	\N	{}	[]	2025-01-08 08:10:35	2025-01-08 08:10:35	0	\N	f	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
67814b250bfe245fc8384532	2007/12/11	high	dd20071211@gmail.com	female	109048680885361637431	蔡東羽	https://lh3.googleusercontent.com/a/ACg8ocISTWYfd6GCDlZ7kOG2Ql7Hce3vaRnQI9NFn78gLSQNLB48beo=s96-c	[]	t	t	台灣@桃園市@蘆竹區	["normal-student"]	是一個喜歡嘗試、享受突破自己的高二生～	擅長編輯和排版（最愛canva)	{分析資料,創意發想,資源搜集,營養學,影片製作,飲食,自媒體,文字編輯,排版美編}	["interaction", "do-project", "make-group-class"]	2025-01-10 16:30:29	2025-01-27 13:27:42	3	{"instagram": "", "facebook": "", "discord": "", "line": "doreen103150"}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
6784b8436662cd04f9684a7f	2008/02/15	other	peggy100215@gmail.com	other	100931458948665660159	陳姵彤	https://lh3.googleusercontent.com/a/ACg8ocKYcmhQaHP-RDwSgqzgPWSphsbmPz6BYJIs0KQuHBRer1brol01=s96-c	["language", "art", "computer-science"]	f	t	台灣@@	["experimental-education-student"]	喜歡畫畫的一名人類	電繪、二次元	{電繪,二次元}	["interaction", "make-group-class", "find-group"]	2025-01-13 06:52:51	2025-01-13 06:57:58	1	{"instagram": "Winter._.0215", "facebook": "", "discord": "Niko._.15", "line": ""}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
6784baeb6662cd04f9684d69	2000-02-09T16:00:00.000Z	\N	paytonphhuang@gmail.com	male	114815293567718250703	bacon	https://lh3.googleusercontent.com/a/ACg8ocJwKe7LnPa21aCPHbf8YEf3NSNuvlkwGrQKX-uvQ11ZqTxUZjIw=s96-c	["business", "life", "humanity"]	t	t	\N	["experimental-education-student"]	\N	\N	{}	[]	2025-01-13 07:04:11	2025-01-13 07:04:11	0	\N	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
6784cbab6662cd04f96850de	2008/07/31	high	xuezhiqian759@gmail.com	male	105616215692909069161	薛智謙	https://lh3.googleusercontent.com/a/ACg8ocJWnvOy5ANCFyzCE-a84cOISZ548sQncRDqUtIooHQItwUN-g=s96-c	[]	t	t	台灣@臺北市@內湖區	["experimental-education-student"]	哈囉，大家好，我是智謙，可以跟我一起交流程式設計，是展賦教育的學生，在展賦當程式設計社的社長	程式設計	{程式語言}	["interaction", "make-group-class", "find-student", "find-teacher", "do-project", "find-group"]	2025-01-13 08:15:39	2025-01-13 08:15:39	0	{"instagram": "", "facebook": "", "discord": "_xuezhiqian", "line": ""}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
6784ea3c6662cd04f9685160	2006/05/15	high	ilikedriedfruit@gmail.com	other	115597118492251172504	水果乾	https://lh3.googleusercontent.com/a/ACg8ocJYMtFggaxZgjxqqL8g6ZtmUIWls2VlwCVZ-6l0H4ys9BTsPn0=s96-c	[]	f	f	台灣@桃園市@	["experimental-education-student"]	嗨，我是耘嘉，暱稱是水果乾。是高三自學生，還因為去年特選沒上可能會延長高中生保鮮期限（？）\n\n生活的被動技能是觀察周遭的環境和人際互動，喜歡跟人聊天交流，歡迎拍打	這幾年累積的自學故事、自我覺察。還有......平常散步亂晃觀察到的街道細節	{茶,咖啡,畫圖,性別議題}	["interaction", "do-project"]	2025-01-13 10:26:04	2025-01-24 15:48:59	4	{"instagram": "yun.chia.555", "facebook": "Yun_Chia", "discord": "", "line": ""}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
67850b3d6662cd04f9685a39	2008/02/14	high	y.znpcixform@gmail.com	female	106868408436098642601	201 31蔡雨彤	https://lh3.googleusercontent.com/a/ACg8ocL2hMjA7C_y8giQzWD5_3XTW8UWXTUBZX0ZCtdbH_-ZVSyJkRjc=s96-c	[]	f	t	台灣@臺中市@大甲區	["normal-student"]	哈囉你好！我是來自TH159星球的冒險家，不小心降落在地球上，不知道我們會有什麼故事呢？！	我想分享我的寫作並找到夥伴	{寫作,歌詞,攝影}	["interaction", "make-group-class"]	2025-01-13 12:46:53	2025-01-13 12:46:53	0	{"instagram": "yun_ni_08", "facebook": "", "discord": "", "line": "st103006"}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
67851fd56662cd04f9685af9	1982/07/03	university	phyllis@cchs.kh.edu.tw	female	109248608002659288925	王清美	https://lh3.googleusercontent.com/a/ACg8ocJkfMDUdO6ludixcloOb2h3kZENec3WwPiCt42s8Rc1WEzVqw=s96-c	[]	t	t	台灣@@	["experimental-educator"]	希望可以與大家一同交流，不管在教學上、生活上，一起共學。	歷史、課程設計、策展、數位教學	{轉型正義}	["interaction", "find-student", "make-group-class"]	2025-01-13 14:14:45	2025-01-13 14:14:45	0	{"instagram": "Hellominimei", "facebook": "", "discord": "", "line": ""}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
6785dac26662cd04f96860d4	1991/06/10	university	ruth86262010@gmail.com	female	107121023464067985207	曹睿華	https://lh3.googleusercontent.com/a/ACg8ocJQJ17H8Vrkl0OSNz-O7fCvJSNQQzUht-9NsELHOCfEZhk501E=s96-c	[]	t	t	台灣@連江縣@南竿鄉	["experimental-educator"]	我是個愛旅遊,喜歡背著相機到處攝影的馬祖青年，長期在教育上深耕，喜歡服務、最大願望是能在孩子身邊當一個保有初衷的大人！	攝影、兒童正音教學、補教經驗、	{攝影,教案設計}	["do-project", "find-student", "interaction"]	2025-01-14 03:32:18	2025-01-14 03:32:18	0	{"instagram": "", "facebook": "", "discord": "", "line": "nancy800610"}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
6788dbe06662cd04f9688000	1999/07/11	university	hellokitty880711@gmail.com	female	101104003871847860679	Wei Chen	https://lh3.googleusercontent.com/a/ACg8ocJnLbzoLbxTJ4dr820BgP-9k8qU7DqbCsK0co0qYJApwvTWft13oQ=s96-c	[]	f	t	台灣@@	["citizen"]	目前正在一間智慧醫療新創公司擔任海外業務，深知自己的各種不足，因此在同事的推薦下跑來島島學習！希望能堅持下去 (ง๑ •̀_•́)ง		{英文,程式語言,電繪,社會議題}	["interaction"]	2025-01-16 10:13:52	2025-01-16 10:13:52	0	{"instagram": "cuzimgod", "facebook": "", "discord": "", "line": "cuzimgod"}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
678b01773b18d82b6896b25c	2005/06/18	university	justin387130618@gmail.com	male	106818692285165923092	朝強	https://lh3.googleusercontent.com/a/ACg8ocLwQdE6T4MQJQJHDN-yN0vC64b9O6u5X3kh2WSgYze826Lxvu4iyg=s96-c	[]	t	t	台灣@新北市@中和區	["normal-student"]	目前就讀中央大學財金系二年級\n\n平常喜歡看書、電影、籃球和聽音樂\n\n正在進行寫作的自主學習計畫\n\n有興趣參加商業競賽活動，有缺人可以找我～	閱讀、投資、寫作、電影、音樂、運動健身	{閱讀,投資,寫作,電影,商管}	["interaction", "find-group", "do-project"]	2025-01-18 01:18:47	2025-01-24 04:03:06	2	{"instagram": "chiang_0618", "facebook": "", "discord": "", "line": "justin387130618"}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
678c9ffe3b18d82b6896c8a9	1993/07/04	university	taiwansmile@gmail.com	female	112987266964080061579	小熊	https://lh3.googleusercontent.com/a/ACg8ocJ3K1wFW2IHiu-CZ3cQn5iO-j3vhggu-O8044nwFjqNjxQUQQ=s96-c	[]	t	t	台灣@臺中市@南區	["citizen"]	大家好，我是小熊，來自台中。\n我是前端工程師，擅長製作網站與app。\n我喜歡打鼓、毛線編織、跑步、打羽球、閱讀、聽音樂。\n很開心來到這裡認識大家，一起交流學習。	程式學習、心理學	{程式語言,毛線編織,心理學}	["interaction", "do-project", "find-group", "find-teacher"]	2025-01-19 06:47:26	2025-01-23 01:17:03	2	{"instagram": "", "facebook": "", "discord": "606645145466830854", "line": ""}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
678d3b563b18d82b6896d9d4	2003/01/14	university	christy98191@gmail.com	female	114634836069543355161	蕭綮萱	https://lh3.googleusercontent.com/a/ACg8ocI8kC2Fkp0IoMnhGTVJV0gSBXd7em8huaL1S9UusSN9nHetNgnB=s96-c	[]	t	t	台灣@新北市@新店區	["citizen", "normal-student", "other"]	我是綮萱！我是一個蠻慢熟的人，一開始可能看我比較不敢出聲或是內向不講話覺得不好意思，但是熟悉之後，會漸漸開放和活潑起來！\n\n想來這希望可以和大家互相學習交流分享，因為自己的視野還不夠大，對於自己想發展的還不夠全面的了解，所以想要從馬拉松計畫獲得相關資源，以及學習交流互動，讓自己看到或得到更多事物。	打擊樂 聊天 傾聽 cosplay 觀察細節	{@音樂,@心理學,@角色扮演,@動畫,@籃球,@喜歡聊天,@也喜歡獨處,@輔導}	["interaction"]	2025-01-19 17:50:14	2025-01-24 15:58:29	3	{"instagram": "", "facebook": "", "discord": "", "line": "christy98191"}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
678e2e463b18d82b6896fb7a	2009/01/06	high	choumei.bonnie@gmail.com	female	112744249489049791019	若寧	https://lh3.googleusercontent.com/a/ACg8ocKKmcAoy-7iKJp0crjdak67DN3mBQXVVj4Zm-fE4PM_nHHJRGsA=s96-c	[]	t	t	台灣@@	["normal-student"]	黃若寧，Bonnie，也可以叫我酪梨、酪梨喵\n\n目前是高中生的循環經濟公關組長、文案組員，台灣財經素養教育推廣協會第二屆的校園大使，e-Peer第四屆校園大使，雛翼服務團的公關。\n\n喜歡唱歌、與他人交流，更喜歡往大自然跑，登山、潛水都是愛好之一。	我擅長資源整合，與他人分享優質事務	{唱歌,社會議題,創新,法文,社群經營,校園大使,循環經濟,饒舌音樂,流行音樂,經濟學,物理,環境永續,自我挑戰,潛水,登山,跨領域}	["do-project", "make-group-class", "interaction", "find-group", "find-teacher"]	2025-01-20 11:06:46	2025-01-27 17:20:51	2	{"instagram": "choumei._", "facebook": "noooo", "discord": "choumei._", "line": "0911939865"}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
678fa4a89ddf9a5f9c3c2d2d	2009/01/21	high	wc91744@gmail.com	female	107446590800353033486	陳薇羽	https://lh3.googleusercontent.com/a/ACg8ocKMy-lYRuW7ZHYJkTtB5eT_eZCmmQ3A-nRCsCD3s4xP256428wh=s96-c	[]	t	t	台灣@基隆市@信義區	["normal-student"]	對生物學有興趣的高中生，希望透過此網站來精進自己對於此學科方面的知識		{生物學}	["interaction", "do-project"]	2025-01-21 13:44:08	2025-01-21 13:44:08	0	{"instagram": "weiyu0516", "facebook": "", "discord": "", "line": ""}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
679132119ddf9a5f9c3c7818	2008/06/20	high	zhouyuting08620@gmail.com	female	107448755024685836610	周鈺庭	https://lh3.googleusercontent.com/a/ACg8ocK-CTYmG5ixCiWdq6qrj00k94NauEH3ug-oxdMxIDiRcgf81UAW=s96-c	[]	f	f	國外	["normal-student"]	遙遠的高中牲	擅長交流社交、言語表達、抗壓性強、較為細心	{寫作,二次元}	["interaction", "find-teacher"]	2025-01-22 17:59:45	2025-01-23 12:13:34	1	{"instagram": "hoshimiyaichigo315", "facebook": "", "discord": "", "line": "m337122766"}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
6791f9669ddf9a5f9c3c9592	1968/12/30	other	joeyliaw.tw@gmail.com	male	103841059393215239511	廖修毅Joey	https://lh3.googleusercontent.com/a/ACg8ocLvUxRRRb9jjSx3u08plOL4MHDB82oe07pGsN-q22Z91yqDppGNew=s96-c	["math", "computer-science", "education", "nature-science", "learningtools", "diversity"]	t	t	@@	["experimental-educator"]	我是一心書苑蒙特梭利實驗教育團體的主持人，我想尋找願意陪伴孩子成長的夥伴。		{蒙特梭利,實驗教育,獨立自主}	["find-teacher"]	2025-01-23 08:10:14	2025-01-23 08:13:03	1	{"instagram": "", "facebook": "joeyliaw.tw", "discord": "", "line": ""}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
679316c69ddf9a5f9c3cdd7d	1962/10/26	university	a0968881979@gmail.com	male	112948830508547681175	李清山	https://lh3.googleusercontent.com/a/ACg8ocILkxGZ-swuc8CFgUPRBUUZ3oNJozkD_qiKA8gvvhE9ddolNA=s96-c	[]	t	t	台灣@新北市@新莊區	["experimental-educator"]	民安國小老師\n教過\n生活科技\n台語\n現在在教\n社會科學	圍棋 國小社會科課程 古文	{圍棋古文詩歌社科}	["interaction"]	2025-01-24 04:27:50	2025-01-24 04:45:12	0	{"instagram": "", "facebook": "", "discord": "", "line": "b0968881979"}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
6793a1969ddf9a5f9c3d501b	2003/09/08	university	sophie.920908@gmail.com	female	106243566981943329539	彭菲	https://lh3.googleusercontent.com/a/ACg8ocLxCyF45MBT_--_KVVUXtczuAqq7QDyix2SvL8ea2H8d-ATrWg=s96-c	[]	f	f	@@	["normal-student"]	hi		{社會議題}	["do-project", "interaction", "find-group"]	2025-01-24 14:20:06	2025-01-24 14:20:50	1	{"instagram": "", "facebook": "", "discord": "", "line": "0908sophie"}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
6793ae729ddf9a5f9c3d6ce4	2000/05/16	university	0516jessica@gmail.com	female	109050612350610219801	顧婕	https://lh3.googleusercontent.com/a/ACg8ocLfCIdO4rM90bMIHa8kL3RGyKIlg96eLFyJgKQoJA80GpJj91GP=s96-c	[]	t	t	台灣@新北市@新店區	["citizen"]	顧婕，\n2000年出生，現居新北。\n熱衷教育、社會創新、藝術文化、導覽、語言學習。\n具有豐富導覽經驗，2022、2023、2024均獲選為【台灣當代實驗場】年度大展之導覽員。\n熱愛外語學習，英語多益測驗910分、德語歌德檢定B1通過。	德文	{德文,社會創新,教育,導覽,非營利組織,藝術文化}	["interaction", "find-group", "do-project"]	2025-01-24 15:14:58	2025-01-26 17:14:38	3	{"instagram": "wa6n1d5er", "facebook": "", "discord": "", "line": ""}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
67952d999ddf9a5f9c3df2d0	1992-12-05T16:00:00.000Z	\N	laurentsai.1992@gmail.com	female	116846425394299373686	Lauren Tsai	https://lh3.googleusercontent.com/a/ACg8ocLd7lBHF1qJV_0nfFbPWHVeLiZEYHw2FVHnH_gF53580D_fmQ=s96-c	["life", "business", "health", "diversity", "learningtools", "math"]	t	t	\N	["citizen"]	\N	\N	{}	[]	2025-01-25 18:29:45	2025-01-25 18:31:59	0	\N	f	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
6795a4ce9ddf9a5f9c3e01c0	2009/01/24	-1	cindy980711@gmail.com	female	101407547113061782294	許馨尹	https://lh3.googleusercontent.com/a/ACg8ocKkTxrxpvXFE_D4ykAEINRTbwzPDSmIgSqTfGDEI0mVd_suIFw=s96-c	[]	f	t	@@	["normal-student"]	我是一個喜歡物理和天文的人	物理	{物理}	["interaction", "do-project"]	2025-01-26 02:58:22	2025-01-26 02:58:22	0	{"instagram": "", "facebook": "NoFacebook", "discord": "", "line": "xinyinhsu980711"}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
6795b2bd9ddf9a5f9c3e072e	1976-10-08T03:55:58.000Z	\N	qmoon815@gmail.com	other	110076939983681933162	Q Moon	https://lh3.googleusercontent.com/a-/ALV-UjXxkdAYexSrY1p65X9GWMH60aOHcAQioR1x41wPVm_xWq_z1alQbQ9YPqVybPlHoBFFC_1LafCKERBatEZu-6tG82sMbN8bPJkZiSr82rMmrMYQhGpv3EuUqSZkHEQspQHgv8a_Uxb3juSxTSENaHbhmuzL8r3TTa4fQm1iUvT8aBO5R2o-52x2MZ14BnEidQ291GCXCDForKJUtqJCai91IOh2NW7TfXJq_LbVZzR-U8ZbnFitXJf08iCLJHw6OqkyoxVauvkizm_ikQiySIpYtdscapAK1N2OJd3nQwui4x94tDvZ9Gq1jyMFoZLgftUrUI98RjXhLydJ3m_V5ra9olq5WA9c8Vqg-R67fJA_EreqZn99lEkwhF5ptfeIoRyEtyZHTTav0BdpqSodFDTAJW0V-j2t5YLPIrEOa4_J5WwwWI6S4TwKfAjmHaa7ASdFAaC1YmTRuwCNR9fRR-R5nU9lX_UnU4jYgESDhijretsDSotHXtPb5-ctzM2_OmNSs5_gP77tXGmg-YsfYaOC50SVtszCPLXTEuKxWxcqmj3Bc9_40VuL-_yDymgXCBSO65wv21M7A27bRHwsWuNbXFJrm7w-8X5ex3OLiBttnRcjRs1piwCxulxOuwcYpZM8NW-52lq1RGhb7NZ_xtlgc3jvE5U7e_2rxiLDF8eqNzy3Ab9kM5ZxS-ftNKb_BzBRM9NrEzzJka4RLvqeMYpm0Ohr__AqJiK0kR9Ws93byVkeYEhGsnIR4DJuOb8TcPvACKGWk5AWRQktuzMExBJVi5wFC63okND5pI11IGwB3222HX92xD4gF-gxOG4TMuLPRypftyEHImmSXCW-JcZsTvGGDQtK7c7PIZMIXQe5-13yIyyIhf_Fe2G4wgAjH3Be4PvSSouKRJjTksSvBfX0wUlMX0z7Jn2DRvfYa2r03Sw6zNKIMrxI5VgNub4BmR1ECiMc_N27HCEK0WsvQtKV_9c=s96-c	["education", "humanity", "nature-science", "art", "life", "learningtools", "diversity", "language", "math", "computer-science", "health", "business"]	t	t	\N	["experimental-education-parent"]	\N	\N	{}	[]	2025-01-26 03:57:49	2025-01-26 03:57:49	0	\N	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
67965de19ddf9a5f9c3e3daf	2006/12/10	high	emily.hungml@gmail.com	female	104188905237435614743	Emily	https://lh3.googleusercontent.com/a/ACg8ocKTYHCwa2yrRFmmIkLYvFKVNvExgzxauVnyaXL8CpNjqWDU9g=s96-c	[]	t	t	台灣@新竹市@北區	["normal-student"]	哈嘍大家好我是Emily,對生活有點敏感卻又有時神經很大條，我喜歡文字、藝術等等美的事物，碰到企劃事情時也會覺得雀躍	我擅長企劃、文字表達	{國際經營,文字寫作,企劃,藝術,想學吉他}	["interaction", "do-project", "find-student", "find-teacher"]	2025-01-26 16:08:01	2025-01-27 09:37:08	1	{"instagram": "slow951210", "facebook": "", "discord": "", "line": ""}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
6799ee2b9ddf9a5f9c3fa32b	2003/04/28	university	yeozhiwu@gmail.com	male	102661244051005820159	吳宥芝	https://lh3.googleusercontent.com/a/ACg8ocKsQsrwYJtH0PxjBGLZ0uH9Gt6hbTnxJh9mWjTmE2BHB6jm5A=s96-c	["humanity", "education", "diversity", "learningtools", "business", "health"]	t	t	台灣@高雄市@	["normal-student"]	各位大家好，我是吳宥芝，也可以叫我無名小子，我目前就讀於屏東大學社會發展學系大三\n\n個性上來說，雖然比較內向慢熟，不過一旦混熟以後就會發現我私下搞怪的一面，因為我很喜歡跟朋友們分享我腦海中天馬行空又很無里頭的想法，對我來說，分享這些與眾不同的想法讓我體會到許多樂趣\n\n喜歡的興趣是打球、健身、閱讀、看電影、聽饒舌樂、講幹話\n\n平時有空會多關注時事議題，但希望除了關注之外能有機會付出行動做點改變，歡迎任何對社會科學領域有興趣的朋友來跟我互相交流想法	社會科學、閱讀、自主學習、時間與目標管理、運動	{社會議題,民主教育,籃球}	["interaction", "do-project"]	2025-01-29 09:00:27	2025-01-29 11:14:40	2	{"instagram": "yeozhiwu", "facebook": "", "discord": "", "line": "71007410646623"}	t	2025-01-30 17:08:38.064466	airflow	2025-01-30 17:08:38.064805	airflow
\.


--
-- Data for Name: outcome; Type: TABLE DATA; Schema: public; Owner: daodao
--

COPY public.outcome (id, project_id, week, title, description, date, img_url, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: daodao
--

COPY public.permissions (id, name, description) FROM stdin;
1	view_pages	瀏覽頁面
2	contact	聯繫功能
3	create_group	發布揪團
4	share_resources	分享資源與心得
5	use_study_plan	使用學習計畫功能
6	query_marathon_participants	查詢所有馬拉松參與者資訊
7	view_all_data	查看所有資料
8	modify_delete_all_data	修改、刪除所有資料
\.


--
-- Data for Name: position; Type: TABLE DATA; Schema: public; Owner: daodao
--

COPY public."position" (id, name) FROM stdin;
1	normal-student
2	citizen
3	experimental-educator
4	other
5	parents
6	experimental-education-student
\.


--
-- Data for Name: project; Type: TABLE DATA; Schema: public; Owner: daodao
--

COPY public.project (id, external_id, user_id, img_url, topic, description, motivation, motivation_description, goal, content, strategy, strategy_description, resource_name, resource_url, outcome, outcome_description, is_public, status, start_date, end_date, "interval", created_at, created_by, updated_at, updated_by, version) FROM stdin;
1	358dfbd0-7746-4eb1-948b-ec19c7af3513	120	\N	探索普世價值在人類歷史的發展與未來的展望	因為人生目標是希望成為追求真理的知識份子，所以希望從學生階段就開始讀各種人文社科書籍、關注人權發展、參與公共議題、寫自己的思考文章	{interest_and_passion,impact_on_society,self_challenge,career_development,personal_growth,exploring_possibilities,preparing_for_the_future,inspired_by_events}	以下分享前陣子寫的文章\n\n我想，既然都走到這裡了，也該好好整理一下這段歷程了，我從一個懵懂無知的國高中生，到人生的低谷，又到了熱愛追求知識、熱愛自由，渴望成為一個幫助他人的知識份子的自學生。\n\n一開始，國小國中的我只會讀教科書，國小遇到家庭紛擾的劇變，國中經歷同儕的霸凌，高中的我因極度不信任家庭選擇住校，高中可能是我人生轉變的開始，同時遇到課業的難題和人生價值與追求的轉折。\n\n首先，因為就讀明星高中，考試變得繁多，學校也重視數理，而數理又是我的弱勢科目，我在課業方面出現了失落感和逐漸增加的數理方面的問題，這一層層加上心理因素，變成我對體制的不信任和對填鴨式教育的質疑，加上高中又同時是我找到熱愛領域的時機，在校因為英文老師推廣的國際特赦組織的寫信馬拉松活動，還有在校開始閱讀書籍的緣故，這段期間我發現了對社科人文知識的熱情和對人權的啟蒙，以及前面對體制的拒斥，於是我選擇了自學，隨著閱讀書目的增加我越發察覺社會不平等和種種議題與問題，於是很當然地，我接觸了社會主義與馬克思主義，可是對歷史的研究，蘇聯和中共和其他宣傳社會主義國家(包括納粹)的殘暴，使得同時我對這派學說保持質疑(後面會再詳細討論這個議題)。\n\n開始自學時一段時間，我開始接觸了一連串社會議題，從法律/政治/人權/環境擴展到更細緻的 : 台灣迫遷議題/世界極權政治與地緣政治問題/歷史等等，但自學也遇到嚴重的家庭關係問題，引發了我的重鬱症，但隨著社工們的協助和家人們與我的轉變和各方朋友的支持與協助，重鬱症也逐漸好轉，當然一部份家庭問題和個人議題仍然存在，但相較於以往是好很多了，也在此感謝友人的關心。\n\n先回到前面的問題，我在開始深入歷史和自由主義思潮的接觸後逐漸察覺共產主義與民主人權的矛盾和經濟自由與政治自由的相關性，這啟發了我很多。也隨著閱讀書目的增加，我的興趣擴展到世界史與東亞史/比較歷史、自由主義與民主、極權主義、教育、環境、人權、精神疾病、個體心理學、藝術繪畫、社會學，從對知識的渴望到想成為一位知識分子，在這期間我遇到了眾多資源和人的協助，以下再詳細列舉，在這段期間，我還接觸了基督教信仰，這給了我逐漸增添的信心和醫治，也加深我對人權的信念。\n\n透過一次次閱讀和寫文章的過程，我才漸漸明白現在所讀到的習慣科學(原子習慣和刻意練習)所告訴我的，用心且適當增加壓力和困難的練習的重要性，透過在這個土生土長的台灣遇到各種人事物給我的力量，我也明白受苦的倒影所言機遇的重要性，透過這一連串的體悟，我也逐漸了解經濟學家海耶克所言自由體制的重要和這個經濟自由和政治自由的台灣社會(但還是有很多待進步之處)對我的重要性，如果沒有這些不會有現在的我。在這個漸趨複雜的社會，民主倒退的世界，極權的擴張，氣候的變遷，知識的追求更加顯得重要，所以我得更加努力認真，現代文明社會是各個前輩們的努力，在此我向他們獻上感謝，我也對養育我的社會和種種機遇致上謝意，我得更加努力，我才可以回報這個社會，如同鄭南榕前輩說的，接下來是我們的事了 !\n\n在此我列舉眾多資源和人的協助\n謝謝象仔書屋與東亞歷史協會的讀書會和各式各樣的書和討論\n謝謝南方書店的朋友\n謝謝孩堤咖啡的朋友\n謝謝鹿鹿鬆餅屋的朋友和提供的協助\n謝謝遠在新店老屋的朋友\n謝謝鹿港浸信會和向陽教會\n謝謝各路朋友的支持\n謝謝我還沒提到的朋友\n\n再說一次，如果不是有你們和這個台灣社會，不會有現在的進步。		-人權的發展\n-世界史、東亞史、台灣史\n-歷史上出現過的文明倒退現象（如共產政權的迫害和極權的產生）\n-中共體制的分析\n-民主在台灣的起源與未來的展望	{book_reading,data_collection_research_analysis,initiating_actions,attending_events_or_courses}	我會藉著閱讀書籍、聽演講、寫文章、不斷思考以及分享我的收獲來加強學習	{}	{}	{building_websites,managing_social_media,writing_research_reports,artistic_creation}	除了撰寫文章傳遞到社群外，同時也有在畫畫	t	Not Started	\N	\N	\N	2025-01-30 17:08:58.16357	\N	2025-01-30 17:08:58.16357	\N	1
2	c23149d9-0aa9-4c29-979e-a7e580057296	122	\N	提升英文能力	想做此計畫的目標\n\n    我對於量子電腦與腦科學比較新興的領域感興趣， 但由於這些科系都是在國外發展比較蓬勃，因此會需要有一定的英文能力才能夠進行探索。 因此現階段我想要以提升英文能力為首要目標，可跟國外的學者進行交流。\n\n\n我希望累積英文能力，可以找到自己有興趣的科系，以及提升英文能力，也累積我的學習技巧。所以我預計會學習的內容包含：英文撰寫。最終我會把些學習過程整理成一個報告書，作為成果發表，來作為我五個月的學習成果發表。	{driven_by_curiosity,others,exploring_possibilities,pursuing_education_or_qualifications}	技能\n我所感興趣的腦科學、量子電腦等領域， 相關領域的最新知識多以英文撰寫而成，想吸收新知會需要一定程度英文能力。另一方面，我曾經參與不同的學術研討會，在與外語人士交流時更感受到英文能力的重要性。 我認為英文能夠讓我達到這樣的目標，所以我想增進自己的英文能力。\n\n另外，更我希望透過這次自學的機會，找回學習的自信心。\n\n家庭環境沒有足夠的學習資源、以及會有讓我需要分神處理的隨機家暴事件發生，讓我在學習時感到很不安。這讓我難以跟上學校的學習進度。\n\n過去，我總是順從他人為我安排的學習計畫，未曾有機會調整自己的步伐來學習。考試和學校的體制常讓我感到極度不適，甚至失去自我。繁忙的課業與頻繁的小考壓得我喘不過氣，因為我根本沒有足夠的時間來讀書、準備或接受輔導。\n\n校園在某些方面對我來說是片刻的喘息之地，但卻讓我倍感壓力。過去的學習經驗充滿壓力與妥協，幾乎沒有任何空間讓我自我探索，這也讓我逐漸失去了對學習的熱忱。而這次的計劃，我能夠重新為自己安排進度，達成期待的目標，是我試圖重新掌握學習主控權的重要一步。\n\n我明白，我們無法改變過去，但現在能做的一切，才是通往未來的軌跡。小時候，我曾經夢想環遊世界，如今雖然還不清楚如何實現，但我正嘗試探索更多的可能性。\n\n我希望透過探索，找回那份小時候對世界充滿好奇、熱愛自由學習的初心，將過去的困難化為動力，藉由持續的努力找到真正適合自己的道路，並學會接納過去，擁抱未來，活得坦率而自由。		 1. 英文能力：\n   - 以英語進行日常對話\n   - 撰寫正式書信（申請信、交流信）。  \n   - 提升詞彙與語法能力（使用 AI 工具與教師輔助）。  \n\n\n2. 學習技巧：\n   - 學術寫作與文獻筆記。  \n   - 不同領域的學習策略與思維方法。  \n   - 資料整理與研究方法。 	{others,attending_events_or_courses,field_internship,consulting_experts_and_scholars,data_collection_research_analysis}	  提升聽：我會先觀看影片或者聽podcast，藉由跟讀的方式，提升聽說的能力。\n\n找學伴共學安排時間一同進入英語的學習環境，參與社群沈浸在英文的環境中 、找專家學者指點我學習的迷津。玩遊戲、ai互動。\n\n  提升說：參與社群進行口說練習、找學伴共學一同進入英語的學習環境、唸故事書給小朋友聽、錄製故事音檔、唱英文歌、玩遊戲、ai互動。\n\n  提升讀：書籍閱讀、觀看影片 、玩遊戲、ai互動。\n\n  提升文本表達：撰寫日記、閱讀我感興趣的資料撰寫文章與社群的分享、我觀看後的心得、ai互動。	{}	{}	{others,artistic_creation}	報告書：\n英文學習報告書：\n以完整的文字形式呈現，展現我在22週當中的英文學習計劃中每日所練習的文字表達力，包括學習歷程、挑戰、解決方法以及反思。\n科系領域的調查報告書：\n作為在探索查科系時，用搜索時得知的資料做歸納，將調查到的新發現，還有感覺，作為報告的目標。\n影片：嘗試以英語作為科系探索訪談時使用的語言。用英語來教學水車玩具的製作、介紹我自己在參與這次22週的學習計劃後，當中的歷程、感受與成長，讓觀眾視覺化地感受到努力與收穫。	t	Not Started	\N	\N	\N	2025-01-30 17:08:58.16357	\N	2025-01-30 17:08:58.16357	\N	1
3	99c60859-b59a-443c-b9ca-3fb3080e6f3a	123	\N	「偶」的學習之旅	先前接觸過融合戲偶元素的劇場作品因而感到興趣，希望藉此計畫學習戲偶製作與操作、練習紀錄學習歷程並分享到網路社群。預期最終會以社群貼文形式，產出三部操作自製戲偶的影片，並且附上製作歷程敘述與創作理念。	{inspired_by_events,interest_and_passion,self_challenge,personal_growth,life_changes}	去年在衛武營觀賞了曉劇場的《魚·貓》，演出中表演者使用了人偶、腳踏車骨架與輪胎，呈現出或平緩或顛簸的騎行景況，那樣的畫面另我極為驚奇，原來物件與偶的結合，可以創造與自己平時習慣的，以表演者為主體的劇場表演更加魔幻自由的氛圍。之後偶然在台南當地劇團斜槓青年創作體的四戲連演的其中一作裡，也欣賞了結合戲偶的演出，由於演出本身是形式、運用素材都以相對單純的solo呈現，所以也讓我產生「或許我也可以嘗試看看操偶跟製偶」的想法。\n另外，我跟朋友今年打算再次參與花樣戲劇節（一個陪伴高中生創作並呈現戲劇作品的活動）的徵件，在前陣子討論創作方向的會議中，恰好其他團員同樣有將偶戲元素加入作品的念頭。在自身興趣與週遭聲音方向一致的情況下，關於偶的探究學習活動似乎愈加有執行的必要。不過關於偶戲領域的學習，台灣沒有太多具系統的學習路徑，所以透過自主學習的方式，開闢出一個可執行的學習脈絡，我認為是現階段最為可行的辦法。因此希望可以透過學習馬拉松實踐這個構想，在計畫執行過程中，也希望藉由社群的分享，為其他對偶戲感興趣的人，提供一條可依循的探索路徑！		操偶（發展各種動作的可能性、揣摩戲偶的各種情緒）/ 製偶（理解基礎執頭偶/杖頭偶/手套偶/懸絲偶的結構與製作、創作自己設計的戲偶）/ 有條理的學習紀錄方法	{watching_videos,joining_communities,attending_events_or_courses,others}	預計以網路資源（如影片、文章）補足戲偶相關知識後，實際練習操作操製偶，並將歷程與成果透過紀錄及網路社群分享，作為審視與敦促學習的方式。在計劃前中期，會參與偶劇團的工作坊及演出，藉此與偶戲工作者交流學習，也可請教它們對於偶戲學習的建議。	{}	{}	{artistic_creation,managing_social_media}	計畫前中期產出執頭偶、杖頭偶、手套偶、遊行大偶工作坊、懸絲偶的學習歷程記錄，後期錄製製作的三個戲偶的動作片段，並附上創作理念與心得，完成後都需要在社群平台上分享。	t	Not Started	\N	\N	\N	2025-01-30 17:08:58.16357	\N	2025-01-30 17:08:58.16357	\N	1
4	ce327766-aa52-4c6b-a52c-e1a62e6971a8	118	\N	探索拒學的根源與解決方案	深入研究拒學現象的背景、成因及其對個人與社會的影響，並設計創新的解決方案來幫助遭遇困境的學生重拾學習動力。通過文獻分析、問卷調查與專家訪談，計劃將結合心理學理論與數位科技，製作一款針對拒學學生的數位支持工具原型（MVP）。最終成果將以研究報告、產品原型及公開分享會的形式呈現，期望為教育體制提供洞見，並為學生及家長帶來實際幫助。	{driven_by_curiosity,personal_growth,influenced_by_a_group,exploring_possibilities,inspired_by_events,impact_on_society,self_challenge,interest_and_passion}	從小到大，我對學校的感受總是充滿矛盾。一方面，學校是我最初探索知識和人際互動的地方；另一方面，它也讓我感受到壓力和不適應。隨著年齡的增長，這種不適感逐漸累積和加深，直到高一時，我終於無法再忽視內心的抗拒感。那時的我，對課堂環境及學習方式都感到窒息，彷彿身處於一個無法調和的矛盾之中，所以我決定要轉個人自學。這不僅是離開傳統體制，而是一種對自我需求的回應，也是一場重新定義學習意義的旅程。\n\n這樣的經歷讓我對拒學議題產生了深刻的共鳴。我發現，拒學不僅僅是個人的問題，它還牽涉到家庭結構、教育體制以及社會文化等多重因素。我開始思考：是否有更好的方式來幫助那些像我一樣陷入困境的人？是否可以通過創新的方法來減少他們的痛苦？這些問題成為我探索拒學議題的動力來源，希望能夠深入研究與實踐，找出拒學背後的成因，並設計出真正能夠幫助學生的方法。\n\n現在做這件事，會為我帶來什麼？也想要藉此給自己一段時間，去感受、體驗一下到底對這件事有多少熱情，在我心中有多重要		1. **拒學的背景與成因分析**\n    - 學習心理學理論（如認知行為療法、阿德勒心理學）以理解拒學行為的心理機制。\n    - 探討拒學的多重成因，包括個人、家庭、學校及社會層面的影響。\n    - 研究拒學行為的功能模式（如逃避嫌惡刺激、尋求他人關注等）。\n    - **系統思考**：\n        - 學習系統思考的基本概念，如因果循環圖（Causal Loop Diagram）和系統動態模型（System Dynamics Model）。\n        - 將拒學視為一個複雜系統，分析其多層次影響，包括個人層面（心理健康）、家庭層面（親子關係）、學校層面（教學方式、同儕互動）及社會層面（政策、文化期待）。\n        - 建立因果循環圖，識別拒學問題中的正反饋機制，例如課業壓力如何加劇學生焦慮，進而導致拒學。\n        - 探索潛在的槓桿點（Leverage Points），如改善師生關係或提供心理支持，來打破負面循環。\n2. **調查與數據分析技能**\n    - 學習問卷設計與訪談技巧，用於蒐集拒學學生及其家庭的經驗資料。\n    - 掌握基礎數據分析工具（如Excel或SPSS），進行統計分析以識別趨勢與模式。\n3. **創新解決方案的設計**\n    - 探索如何利用科技（如生成式 AI）來提供個性化的心理支持或教育資源。\n    - 設計以學生需求為核心的解決方案，並規劃MVP（最小可行產品）進行測試。	{data_collection_research_analysis,book_reading,consulting_experts_and_scholars,doing_projects,conducting_interviews,conducting_surveys}	1. **資料蒐集與文獻研究**\n    - 閱讀相關書籍與研究報告，如《打破孩子拒學的沉默》和《從校園輔導工作初探拒學議題之生態指標》。\n    - 分析國內外案例，了解不同文化背景下拒學問題的差異。\n2. **系統思考應用**\n    - 閲讀系統思考相關書籍（如第五項修煉），學習因果循環圖和系統描繪。\n    - 在調查過程中繪製因果循環圖，識別拒學現象中的關鍵影響因素與反饋機制。\n    - 使用系統動態模擬工具（如 Kumu）來測試不同干預策略的效果。\n3. **訪談與問卷調查**\n    - 訪談教育工作者、心理諮商師及曾經拒學的學生，了解真實經驗，並將訪談結果納入系統模型分析。\n    - 設計問卷，針對學生及家長進行調查，蒐集第一手數據，用於驗證因果假設。\n4. **實作與反思**\n    - 透過設計MVP解決方案進行實驗性測試，並根據反饋進行改進。\n    - 定期撰寫反思日誌，記錄自己的思考過程和收穫，以提升自我效能。	{}	{}	{initiating_projects_or_organizations,organizing_events,writing_research_reports,others}	1. **研究報告**\n    \n    撰寫一份完整的研究報告，包含拒學問題的背景、成因分析、調查結果及解決方案建議，供教育機構參考。\n    \n2. **數位平台原型**\n    \n    製作一款針對拒學學生的數位工具原型，如一個提供心理支持和教育資源的 GPTs，並記錄測試過程和結果。\n    \n3. **公開分享會**\n    \n    舉辦線上分享會，向社群展示研究成果，並邀請專家和同儕給予回饋，以促進跨領域合作。\n    \n4. **個人反思紀錄**\n    \n    建立一個部落格或Medium帳號，用於記錄整個研究歷程，包括挑戰、突破點和未來展望，希望能啟發更多人關注拒學議題。	f	Not Started	\N	\N	\N	2025-01-30 17:08:58.16357	\N	2025-01-30 17:08:58.16357	\N	1
5	65febfed-ec68-4e27-acfa-5add0bdf453e	119	\N	拒學議題的互動方案設計	這次的學習計畫來自於我的親身經歷與觀察。高二時，因為人際關係、生涯迷茫與家庭問題，我曾深刻感受到拒學的無助與孤立，那段經歷讓我對這個議題有了特別的關注。我也目睹妹妹因心理疾病與校園壓力而陷入拒學，她的不安與掙扎讓我意識到，教育體系中對於拒學學生的理解與支持仍然不足。我希望透過這次計畫，深入探討拒學現象的心理、家庭與社會層面，設計出創新的互動方案，讓學校與社會能夠更友善地回應這些需求。\n\n這不僅是一場學習的旅程，更是一種對問題的探索與實踐。我期盼能藉由分析與行動設計，找出具體且可行的解方，幫助拒學議題的討論與解決走向更全面與溫暖的方向。每一步的努力，不只是對個人經歷的反思，也是希望能以更積極的方式，為這個複雜的問題帶來一些新的可能性與改變的契機。	{impact_on_society,exploring_possibilities,interest_and_passion,self_challenge,personal_growth,inspired_by_events}	我對拒學議題的關注源自於自身的經歷與觀察。高二時，因為人際關係、生涯迷惘以及家庭等複雜因素，我開始感受到難以踏入學校的困難，甚至出現拒絕上學的情況。經過一段時間的整理與反思，我決定在高三開始過上自學的生活。除此之外，我的妹妹比我更早經歷拒學的過程，她因為心理疾病的影響，面對學業無法跟上、人際關係問題以及學校老師的排擠，這讓我深刻感受到學校對拒學學生的環境非常不友善，且缺乏足夠的支持系統。因此，我希望可以透過這個議題的研究與發想解方，這不僅能讓我透過議題自我敘述來探索自我，還能將個人經驗影響社會，我相信，我在其中最大的學習就是將自己過去覺得不好的經驗轉為對於社會具有影響力的行動。\n\n另外，家長對拒學問題的理解也非常有限。大多數家長對於孩子拒學的情況感到困惑，並且不知該如何幫助孩子，這使得孩子往往處於被社會邊緣化的狀態，甚至開始遠離社會。我認為，這是當前亟需解決的重大問題。因此，我希望透過這次的學習馬拉松，學習如何將我的理想付諸實踐，並更深入了解拒學議題的不同面向。透過業師和其他資源的支持，我相信能夠讓我在實現這一理想的過程中，更加自信並具備具體的行動方案。		1.拒學的背景與成因：深入了解拒學現象的生態系統觀，包括心理健康、家庭環境、社會因素等，掌握影響學生拒學的各種因素\n2.專案設計與執行能力：學習如何設計小規模試驗計畫（MVP），包括確定目標、方法、預期結果等，並能夠在實際執行中靈活應對各種挑戰\n3.批判性思維：在研究過程中培養批判性思維，能夠對所收集的資料進行深入剖析，並提出具有洞見的結論\n4.培養以用戶為中心的設計思維：強調從使用者的需求出發來構建解決方案	{conducting_surveys,attending_events_or_courses,organizing_events_or_courses,initiating_actions,doing_projects,consulting_experts_and_scholars,finding_study_partners,participating_in_competitions,data_collection_research_analysis,others}	在這次學習計畫中，我將綜合運用多種學習方法，透過自我敘述、資料蒐集、訪談與專案實作等方式，深入探討拒學議題並設計互動解決方案。首先，我會以資料蒐集與研究作為基礎，閱讀相關文獻與報導，了解拒學議題的背景與成因，並運用分析工具整理數據，找出主要的影響因素。\n\n接著，我計劃 訪談專家學者與家長、學生，以更貼近現實的視角補充文獻中可能未提及的洞見，讓研究結論更加全面。  在研究基礎之上，我將設計一個小規模試驗計畫（MVP），結合學校場域與家庭層面的雙重需求，並且以專案實作的形式驗證解方的可行性。在過程中，我會尋找志同道合的學伴共學，一同進行方案設計與回饋討論，確保方案能被不同角色接受並有效執行。同時，我也計劃參與相關的社會創新競賽，測試方案的創新性與社會影響力，並獲得專業評審的指導。  \n\n除了研究與實驗，我還會主動發起行動，如舉辦「小型工作坊」，模擬解方案的真實執行場景，並記錄學習者的回應與改善建議。最後，我將總結學習所得，製作一份包含調查報告、方案設計與執行紀錄的學習歷程檔案。\n	{}	{}	{initiating_projects_or_organizations,participating_in_competitions,organizing_events,writing_research_reports}	1.拒學議題研究報告：經過對拒學現象的深度研究，我將撰寫一份相關的研究報告，旨在提升對拒學學生的理解與支持。\n2.專案的MVP（最小可行產品）：我將設計並實施一個針對拒學議題的解決方案，並在此過程中開發出MVP。這個MVP將包含一個初步的互動方案，旨在引導學生與家長找到更合適的學習方式。我將進行測試與反饋迭代，以確保其可行性與實用性。\n3.競賽參與與成果呈現：我將參與與社會創新相關的競賽，並以研究報告與MVP為核心，展示我在拒學議題上的學習成果與創新方案。在此過程中，我不僅希望能夠獲得評審的肯定，也期望透過這些競賽機會獲得更多反饋、資金，進一步提升方案的完善度。	f	Not Started	\N	\N	\N	2025-01-30 17:08:58.16357	\N	2025-01-30 17:08:58.16357	\N	1
6	1a1b05df-2bd7-4923-b8be-1e23349cad88	129	\N	用A I輔助，製作大腦與飲食介紹的網站	之前營隊有獲得相關的講義，在學習上也學習到不少使用的AI工具可以收集資料以及製作成果。\n將這些資料整合並且分享給需要的人，然後在過程中學習自己有興趣的大腦知識以及營養學。	{personal_growth,driven_by_curiosity,interest_and_passion,self_challenge,career_development,exploring_possibilities,preparing_for_the_future,innovation_and_development,practical_needs,inspired_by_events,impact_on_society}	因為想要探索大腦相關的領域，也因為減肥而在過程中對於營養學有興趣。\n因此在計劃時把大腦、飲食、荷爾蒙、內分泌等知識分享給需要的人，並且針對學生做出建議與對策，也幫助自己更了解相關領域的發展！		-網站架設(ai工具)\n-版面設計與內容編制\n-內分泌與營養學\n-怎麼樣真正「享瘦」生活	{data_collection_research_analysis,book_reading,watching_videos,joining_communities,attending_events_or_courses}	用Hocoos製作網頁\nbrain bee的免費講義學習大腦知識\n《飢餓訊號》等書籍學習飲食知識\ngoogle notebookLM 整理資料，製作英文podcast 學習更進階的英文\n閱讀書籍了解營養學	{}	{}	{building_websites,managing_social_media,writing_research_reports}	架設資訊統整網站，以社群媒體輔助分享知識	t	Not Started	\N	\N	\N	2025-01-30 17:08:58.16357	\N	2025-01-30 17:08:58.16357	\N	1
7	1450f000-2447-4c28-8279-3028236d8f0f	132	\N	繼續學習程式設計	因為想繼續精進，希望能一直進步，平常寫LeetCode和zero judge和codingbar	{career_development,interest_and_passion,self_challenge,personal_growth,pursuing_education_or_qualifications}	一剛開始是因為國小scratch社團，覺得程式設計有趣，後來學習python		Python語法\n演算法\n資料結構	{book_reading,watching_videos,examinations,participating_in_competitions,doing_projects}	挑選適合自己程度的題目，大量刷題，每做完一題都去了解最好的解法	{}	{}	{others}	呈現刷了哪些題庫	t	Not Started	\N	\N	\N	2025-01-30 17:08:58.16357	\N	2025-01-30 17:08:58.16357	\N	1
8	1ffbcab4-66ce-49e9-a1bb-e70b4b173db8	134	\N	我想出一本書	我本身有在寫作，想用自己的力量出一本書（自印也可以）	{interest_and_passion,self_challenge,personal_growth}	我喜歡寫作！我想讓我的故事被看見		內容規劃抓200頁 但也有想過要不要再少一點啦！	{attending_events_or_courses,organizing_events_or_courses,finding_study_partners}	我是一個感覺派選手所以打算參加各種不一樣的活動寫下冒險日誌	{}	{}	{artistic_creation,others}	我會出書並且售賣	t	Not Started	\N	\N	\N	2025-01-30 17:08:58.16357	\N	2025-01-30 17:08:58.16357	\N	1
9	d4160074-efcd-4e02-899e-1ed651a35b3b	8	\N	cc	cc	{driven_by_curiosity}	cc		cc	{watching_videos}	cc	{}	{}	{artistic_creation}	cc	t	Not Started	\N	\N	\N	2025-01-30 17:08:58.16357	\N	2025-01-30 17:08:58.16357	\N	1
10	3ca59fa0-a2b8-4931-ad0a-6b860901378a	114	\N	往課程企劃的路上邁進	因為想要在工作上獲得職涯成長，我預計會分為個人學習面、工作職場面去規劃我自己這一年的夢想藍圖，希望能藉此往課程企劃的角色邁進	{career_development}	因為本身是負責課程行政的角色，看著身邊同事透過實際規劃的課程，真的能夠幫助上課的學員，能夠因為受訓完，而真的能夠應用在工作上而進步，所以想要在職涯上成長，獲得更好的進步！		-訓練規劃暨執行管理師認證班\n-強化個人溝通力，提升工作效能\n-新媒體AI社群行銷-善用智慧AI，讓社群文案脫穎而出\n-輕鬆學Canva 簡報視覺設計\n	{}	我預計從上述的方向邁進，並且固定每個月與主管約面談，以確保自己的方向都有跟上，並滾動式修正自己的缺失	{}	{}	{}	我預計在個人threads頁面開設學習分享帳號並用portaly串接個人頁面	t	Not Started	\N	\N	\N	2025-01-30 17:08:58.16357	\N	2025-01-30 17:08:58.16357	\N	1
11	e86bb239-b105-4747-8147-89ab2532ffe7	138	\N	學習寫作與經營個人部落格	平常有閱讀的習慣，因此希望藉由經營部落格來分享自己的想法，養成寫作習慣、同時增進自己的寫作、思考能力，並期望在過程中認識到不同領域的朋友一起互相學習、成長！\n我的目標是在21週內產出至少18篇文章，並學會經營部落格的相關事務，包括SEO、推廣等等。為了達到這個目標，我會閱讀《寫作是最好的自我投資》、《精準寫作》兩本書，並每天練習寫作，然後利用網路資源學習SEO相關知識。	{interest_and_passion,self_challenge,personal_growth,exploring_possibilities,interpersonal_connections,impact_on_society}	首先我很喜歡閱讀，之前讀到學習不能只是輸入也必須輸出，另外寫作也可以結合自身專長、興趣，所以我這是個很好的輸出方式，可以同時加強對學習內容、專長、興趣的認知。第二，寫作也能帶來很多好處，包括增加邏輯思考能力、表達能力、觀察力等。\n第三，人的成就與意義感很大程度來自「創造」了什麼，因此我想養成一個創作類型的興趣，而寫作是個門檻較低且效益很多的方式。第四，寫作能力在許多領域都能派上用場，對於目前沒有明確職涯方向的我來說是很適合培養的技能。最後，若部落格經營有成，寫作也能成為副業。另外因為文章的特性(邊際成本趨近零)，所以變現後能成為被動收入的來源。公開發表文章或加入社群也有機會認識到其他不同領域的創作者，能夠拓展人脈並互相學習。		廣泛閱讀／定期寫作／寫作能力／邏輯思考／自律／SEO搜尋引擎最佳化／自媒體經營	{book_reading,data_collection_research_analysis,watching_videos,others}	閱讀《寫作是最好的自我投資》、《精準寫作》／規律、持續的練習寫作／經營部落格並發表文章／使用網路資源學習SEO相關知識\n	{}	{}	{managing_social_media,others}	至少產出18篇文章／部落格經營狀況／寫一篇關於自主學習計畫的心得、反思文章\n	f	Not Started	\N	\N	\N	2025-01-30 17:08:58.16357	\N	2025-01-30 17:08:58.16357	\N	1
12	14a6ffed-50f4-4fca-948b-0f55e9d3e3d9	139	\N	架設一個電商與形象網站	因為與音樂教室的老闆聊過，發現他們想要有個平台可以買賣樂器與周邊商品，加上教室有辦過很多活動，因此想要為音樂教室做一個電商與形象網站。可以讓店家上架商品與展示活動成果。	{interpersonal_connections,interest_and_passion,self_challenge,personal_growth,practical_needs}	發現需求，想要為音樂教室做網站。		-學習 UI/UX\n-學習如何使用 wordpress 架設網站\n-學習網站部署等相關知識	{data_collection_research_analysis,watching_videos,joining_communities,initiating_actions,conducting_interviews}	我預計上網搜尋相關範例，利用 Notion 做筆記。	{}	{}	{building_websites}	我預計會架設網站	f	Not Started	\N	\N	\N	2025-01-30 17:08:58.16357	\N	2025-01-30 17:08:58.16357	\N	1
13	af28f620-b01c-402b-b2d6-8e8086858a94	143	\N	成為精通攝影的人	想要把人美好的瞬間定格記錄下來。\n目標：希望能夠精進攝影技術有朝一日成為專業攝影\n預計如何達成：先從簡單的手機攝影學起再精通後期後期再進一步學習單反	{interest_and_passion}	因為曾經常去漫展看到攝影拍攝他人身邊也有專業攝影拍照，把人最美的一瞬記錄下來的這個動作讓我感到渴望並且看到他人被拍攝看到圖片欣喜的表情讓我感到滿足，希望有機會這項熱情能成為我未來的職業		1.拍攝技巧\n2.後期p圖技巧\n3.社交能力	{data_collection_research_analysis,watching_videos}	我預計會觀看網上教學視頻先從簡單的手機拍攝學起再去進階，並且一起學習後期技巧，後期完一張照片可以發給身邊人詢問意見和改進的地方，試試給身邊人拍攝並且詢問當事人意見以此去改進自己的不足	{}	{}	{artistic_creation,writing_research_reports}	我預計設計一個合集裏面放著我的作品，並且做出報告寫出我的心路歷程	f	Not Started	\N	\N	\N	2025-01-30 17:08:58.16357	\N	2025-01-30 17:08:58.16357	\N	1
14	b733405c-7420-4ca2-b042-103231e0accd	145	\N	成為一個可以靈活使用AI的人	未來在教學上\nAI的使用非常寬廣重要\n所以一定要把它了解清楚	{career_development}	資訊教學時代已經來臨\n沒有事先了解AI的功能\n以後很難和學生互動		想要先了解AI目前能夠幫忙多少教學科目和內容還有技術	{finding_study_partners,consulting_experts_and_scholars,attending_events_or_courses}	想要有人指導帶領我\n如何進入AI的世界\n如何操控AI技術\n達到工作方便效率提高	{}	{}	{initiating_projects_or_organizations}	學好以後\n我會免費開一個群組組織\n來教導學生如何利用AI技術	t	Not Started	\N	\N	\N	2025-01-30 17:08:58.16357	\N	2025-01-30 17:08:58.16357	\N	1
15	559f8d29-5903-4724-9952-96d1fbe89e4f	126	\N	學習基礎的網頁程式設計技能	我希望學習網頁程式設計，因為我相信程式設計是一種強大的工具，可以用來解決生活中的各種問題。我對於能夠獨立開發一個網站充滿興趣，這不僅能夠提升我的技術能力，還能夠實現我心中的創意和想法。雖然我已經具備了 HTML 和 CSS 的基礎知識，但缺乏實作經驗，因此我希望通過這次學習計畫來鞏固和提升我的技能。\n\n在學習過程中，我希望能夠邊學習技能邊完成課程當中的小專案，這樣可以讓我在實踐中鞏固所學知識，並逐步建立自信。我相信通過這樣的學習方式，能夠更好地理解和應用所學的技術，並最終獨立完成一個完整的專案。\n\n我的學習動機是希望通過學習網頁程式設計，掌握解決實際問題的能力，並能夠獨立完成創意專案，而不僅僅依賴於 AI 生成。我相信這次學習計畫將會是我成長的重要一步，幫助我實現用程式設計改變生活的目標。	{driven_by_curiosity,interest_and_passion,self_challenge,personal_growth}	想要有可以獨立開發網頁工具，解決問題或實現好玩點子的能力！		- HTML 基礎\n- CSS 常用語法\n- 使用 CSS 變更 HTML 標籤特性\n- Flex 網頁排版技巧\n- 相對/絕對定位\n- 切圖技巧\n- 表格與表單設計技巧\n- CSS3 技巧	{data_collection_research_analysis,watching_videos}	我會跟隨線上課程的腳步進行實作，而聽不懂的地方輔以閱讀相關的網路文章解決，並將我的學習歷程寫成 Blog 更新在 Medium （或方格子）上。	{}	{}	{building_websites}	撰寫 Blog 紀錄歷程	f	Not Started	\N	\N	\N	2025-01-30 17:08:58.16357	\N	2025-01-30 17:08:58.16357	\N	1
16	dfd0c0c0-58fb-47f0-a3f2-52c1e17f543b	109	\N	成為一位影片剪輯師	喜歡表達、有很多靈感\n希望成為全職剪輯師\n業餘時間以影片為媒材：發聲、協助他人發聲、協助他人探索自我認同、用影片帶給閱聽眾體感體驗\n	{interest_and_passion,career_development,social_recognition}	- 擅長且熱衷於發想創意點子，希望剪輯能力可以促進自己具體實踐\n- 我有滿強的表達慾望，也有源源不絕的想法，雖然沒那麼多自信\n- 有一些事情想表達，也想協助他人表達\n　- 想促進社會議題發聲\n　- 想透過影片協助自己／他人探索自我認同\n- 想接案維生\n		- 影片剪輯\n- 基礎攝影概念\n- 短影音腳本模組\n- 短影音開頭\n- 讓人有感覺、放鬆的影片\n- 自我認同相關影片\n- 訪談影片	{watching_videos,data_collection_research_analysis}	目前已蒐集一些教學影片、拍攝一些影片素材，並整理在Airtable上\n剛開始練習使用剪映剪輯影片\n已熟悉剪映的介面\n已在社群媒體上，建立剪輯練習的帳號，未來定期po文，督促自己練習同時測試群眾反應\n參考喜歡的創作者並學習\n隨機研究他人的影片，記錄自己的分析觀點，並提出優化建議\n優化建議加入剪輯練習中	{}	{}	{managing_social_media}	Youtube頻道、Instagram、Threads	f	Not Started	\N	\N	\N	2025-01-30 17:08:58.16357	\N	2025-01-30 17:08:58.16357	\N	1
17	de925784-20cb-4168-a00f-2e4a225b0d07	133	\N	從喝茶興趣到尋找本土認同；連結歷史文化	為什麼想做：\n我在生活中主動去體驗茶與咖啡，依靠的是很純粹的內在動力，常常自己沖泡茶葉，但除了自己體驗本身，還想要與更多人交流，分享這份文化，而且我注意到參與這個圈子的人有越來越少的趨勢......茶雖然以手搖飲等形式進入青年市場，但背後的歷史與文化卻逐漸被淡化。我想要去深入理解茶文化的變遷與現況，並思考如何吸引更多同齡人參與，將這項文化重新融入現代生活。\n\n想要做到什麼：\n1.知識面\n- 了解台灣茶文化的歷史與發展脈絡，例如民初家家戶戶飲茶的習俗如何消退。\n- 認識茶葉產業的現況，包括茶農的工作模式與消費市場的轉變。\n- 探討圈外人對茶文化的印象與看法。\n先理解現況，再來才去找有沒有什麼我能幫上忙的。\n\n2.感官體驗－飲用更多茶和咖啡，豐富感官的敏銳度......也要記得興趣的初衷是體會到有趣的感官經驗\n\n3. 穩定的輸出\n- 建立文字或視覺紀錄，用於分享學習過程與成果。\n	{personal_growth,exploring_possibilities,self_challenge,impact_on_society}	幾年前因為家中有喝茶的長輩，而開啟學喝茶的契機，默默自學了幾年。但只有自己一個人的時候，學習的頻率就會很隨性，如果能有一群人交流，應該能獲得很多刺激，也能滿足分享給他人，獲得回饋的願望。\n\n能持續在品茶與咖啡中獲得動力，是因為我享受嚐到不同滋味的過程，喜歡運用感官的觀察，而且最近發現越來越能命中味道，比如說聞出三峽碧螺春當中的綠豆味；聞出咖啡豆還有一些別人沒發現的莓果甜香，交出答案後，得到別人（茶商/咖啡師）肯定的回覆說「你講的沒錯，正是這個味道😌」，我就知道又是一輪新的探索動力\n\n另外就是，我希望自己可以做到穩定的輸出，或是主動創造一個必須輸出的機會。輸出通常能讓我練習更好的將想法傳遞出去，也可以說是為了更好的鍛鍊學習，所以啟動學習計劃。\n\n		台灣茶文化與歷史：\n閱讀相關書籍，市面上有許多製茶或發展的歷史書或漫畫\n查閱學術文章或網絡資源，或者訪問一些老前輩、茶莊，了解茶文化在不同時期的變遷與社會習俗\n\n感官辨識與品茶技巧：\n練習聞香、品味，學習記錄茶葉與咖啡的風味特徵。多去認識不同的材料，從茶跨到咖啡與香水的領域，多方面的認識氣味\n\n紀錄、推廣與社群交流：\n要學會紀錄的，調整自己輸出內容的節奏，也許會先寫出自己看的版本，才去設想要如何讓別人看得懂	{data_collection_research_analysis,joining_communities,attending_events_or_courses,field_research,conducting_interviews}	資料蒐集：先吸收網路上能找到的內容，包括已經追蹤的茶飲自媒體，相關的產業工作者，或是較為正式的論文資料和文章，都是吸收知識的好材料\n\n參與社群/活動或課程：已經準備參加一些手沖咖啡聚會，可以多認識人，和在短時間接觸許多不同風味的咖啡\n\n田野調查：主要是想走入茶園的部分，透過直接接觸的方法，觀看他們工作的模式，還有問產業當中的人，在現代遇到的情況	{}	{}	{organizing_events,artistic_creation}	首先我一定會有幾份中途留下來的品嚐心得，可以寫出不同主題的文章。再來也可以舉辦一些茶會，大家帶喜歡的茶葉一同聚在一起分享\n\n藝術創作我有點猶豫能力方面的條件，但如果我能把產業工作者，工作時的樣貌，用鉛筆速寫記錄下來，似乎也有點有趣......	f	Not Started	\N	\N	\N	2025-01-30 17:08:58.16357	\N	2025-01-30 17:08:58.16357	\N	1
18	012ea0d0-eca8-470b-9b40-cf5c8ee31ea4	140	\N	發展並多了解輔導諮商相關工作(輔導員 實驗教育輔導老師 協助人員等)	對於輔導諮商有興趣想了解及發展。\n想藉由夥伴交流、書籍、講座等等更了解輔導工作更詳細知識，看到更多的發展道路。\n在最後成果時可以用簡報分析、實際體驗、QA問答方式進行呈現分享。\n	{driven_by_curiosity,interest_and_passion,self_challenge,personal_growth,career_development,exploring_possibilities,preparing_for_the_future,innovation_and_development}	過往我常常擔任學姊或姐姐的角色，會不自覺想要照顧學弟妹或是年齡小的人，也因此發現在進行這些過程中，我發現我對於傾訴聆聽，關心當事人並同理他們，以及想要幫助他們的心情都會讓我很開心和幸福！雖然過程很累很辛苦，但是是願意為了對方而承受的累，以及學習更多！		1.在與夥伴或引導師交流時，多提出好奇的問題。\n2.鑽研心理學、諮商的書籍，了解更多面向。\n3.練習諮商輔導技巧，或是從講座中得到收穫。	{data_collection_research_analysis,book_reading,watching_videos,attending_events_or_courses,field_internship,listening_to_podcasts}	1.資料收集：從影片、文章、實際案例等統整分析結論\n2.書籍閱讀：從心理學、諮商等西相關書籍獲得知識和實用技巧。(不一定要單純文字的那種書籍，可以是日常生活化或漫畫等呈現方式的書去做閱讀)\n3.觀看影片：看youtube相關影片，聽聽其他人的想法與經歷，從中吸收到不同知識，有參考的方向。\n4.參與活動或課程：往外探索看有沒有合適的活動可以進行參與。或是可以和島島阿學的夥伴進行討論分享，實際體驗諮商技巧。\n5.場域實習：如果有機會及緣分，願意並且想到相關地方進行實習與踏查。\n6.podcast：尋找並聆聽喜歡或是好奇的內容，訓練抓重點外，也可以尋找有沒有諮商對話的練習過程。\n\n可以用樹狀圖、心智圖、限動、ppt等方式做學習紀錄。	{}	{}	{writing_research_reports}	統整每週學習的內容並寫心得，QA回答分享。	f	Not Started	\N	\N	\N	2025-01-30 17:08:58.16357	\N	2025-01-30 17:08:58.16357	\N	1
19	ed290b24-23c1-437a-9fbb-32208bd54062	105	\N	成為一名音樂創作者&歌手	我的夢想是能夠創作出音樂和獨特的聲音，讓大家聽見並喜歡，能夠讓我的音樂陪伴在大家的日常生活中。未來希望能夠往這方面發展。\n我的目標是發1首完整的歌和1首翻唱，預計先從學習編曲、開始嘗試製作音樂做起，還有精進自己的吉他能力以協助編曲。	{self_challenge,interest_and_passion,driven_by_curiosity,personal_growth,career_development,exploring_possibilities,inspired_by_events}	從國二開始我嘗試唱歌，某一天錄翻唱給同學聽的時候她大為驚艷，她告訴我我的歌聲很好聽，那是我第一次被人有那麼深的鼓勵和相信，漸漸地，我愛上了唱歌，我每一天放學後都在練習唱歌。\n那時候我很喜歡9m88，深受她的風格和她喜歡的音樂影響，是我的音樂和美學啟蒙，更讓我認識到台灣獨立音樂的世界，徹底打開我對台灣音樂的視野和想像。\n國三因為我對生活迷茫又備考壓力大，開始找尋心靈上的意義，因此我喜歡上了安溥、鄭宜農這類型的創作歌手，是他們讓我認識文學是如何體現在歌詞中，如何在歌詞中表達想法。我時常把我的想法寄託在那些文字裡。\n我開始喜歡很多不同音樂的曲風，爵士、實驗、HIP HOP、R&B、數字搖滾......\n		樂理基礎：學習和弦進行（如常見的流行和弦走向）、音階（如大調、小調），理解它們如何影響音樂氛圍。\n編曲技巧：學會如何安排主歌、副歌與過門的結構，讓音樂聽起來更完整。\nBandLab 操作：熟悉基本功能，如鍵盤模擬、節奏製作、音效混音等。\n音樂實驗：嘗試設計自己喜歡的音色或混合不同的風格，提升創意表現力。	{book_reading,finding_study_partners,consulting_experts_and_scholars,attending_events_or_courses}	每兩週完成一小段音樂作品（30 秒至 1 分鐘），並記錄創作過程。\n嘗試用 BandLab 的鍵盤功能編曲，並將樂理應用到實作中。\n\n\n參加音樂課程（如吉他課或樂理課）補充知識。\n利用 YouTube 和線上教學影片學習 BandLab 的進階操作與編曲技巧。\n\n用筆記或部落格記錄學習心得與作品完成過程。\n定期聽其他創作者的作品，分析他們的結構與特色，並寫下心得。\n\n將完成的作品分享給朋友或同好，蒐集意見並改善下一次的創作。	{}	{}	{artistic_creation,managing_social_media,making_videos}	我會在BANDLAB和STREET VOICE發佈翻唱作品和編曲的成果，還有用MV影像呈現自己的翻唱。	t	Not Started	\N	\N	\N	2025-01-30 17:08:58.16357	\N	2025-01-30 17:08:58.16357	\N	1
20	fe59bcf8-d8f7-40df-8f62-e8c9dd761a85	147	\N	成為具備外語導覽能力的專業導覽者。	熱衷於導覽，喜歡聽別人導覽，也熱愛帶導覽。希望藉由此計畫，使自己成為多語言、多領域的專業導覽者。預計訪談前輩，學習導覽技巧，並透過此計畫，建立一場自己設計的導覽行程，並至少有實際執行一次的經驗。	{personal_growth,interest_and_passion}	我的導覽領域，目前集中於藝文領域，曾參加地方文史導覽甄選卻落選，因此希望藉由學習計畫，提升個人不同領域導覽能力，並運用自己外語專長，培養外語導覽能力。		1. 分析自己落選地方文史導覽的原因。\n2. 練習英語口說。\n3. 擇定主題，規劃一場導覽旅程。	{data_collection_research_analysis,book_reading,initiating_actions,consulting_experts_and_scholars,field_research,conducting_interviews,watching_videos,joining_communities,finding_study_partners}	1. 訪談當初甄選時之競爭者，分析自己當初落選原因。\n2. 訪談導覽前輩，提升導覽技巧。\n3. 透過AI工具、線上工具，練習英語口說。\n4. 了解我國英語導遊資格考試，並閱讀有關準備書籍。\n4. 選定一地進行文史研究，並建立導覽主題。	{}	{}	{organizing_events}	獨立規劃一場導覽旅程，並包含中英文內容。	f	Not Started	\N	\N	\N	2025-01-30 17:08:58.16357	\N	2025-01-30 17:08:58.16357	\N	1
21	4c4feaa7-5058-47ab-b2b5-2507b733e3d6	141	\N	創作個人的饒舌歌曲	1.是學校嘻哈研究社的地下社員，參加了十校聯合嘻研社迎新，看了很多厲害的表演，自己因此也想成為那樣帥氣的人，還有，上高中後，開始喜歡聽饒舌歌，就是一切因緣際會，讓我想要開始創作屬於自己的歌曲。\n2.做出至少三首饒舌歌，並發布在街聲，還有自己的IG跟YouTube ，並積極爭取社團表演的機會。\n3.積極蒐集生活素材，把生活中的靈感寫成歌詞，並且看YouTube 跟 Google 學習編曲的技巧，還有詢問身邊有在創作歌曲的人，最後變成真正的成品。	{interest_and_passion,self_challenge,personal_growth}	覺得女rapper 真的很帥，自己也練習了一些饒舌歌，覺得是件蠻有挑戰性的事情，雖然要練習超級多次，才可以練好一首曲子，但一旦練好，會讓自己非常有成就感，而且在練習過程中，不會感到厭煩，會覺得很享受那個過程，後來在經歷過嘻研社迎新後，很多人都說會作詞，一開始我有點錯愕，但後來回家後，就慢慢在生活中蒐集靈感，就發現自己也許也可以真正創作饒舌歌，因此想開啟這個創作計畫。		-不同的饒舌曲風編曲\n-作詞如何更精緻\n-如何用曲子寫詞\n-如何用現有的詞創作曲子	{watching_videos,data_collection_research_analysis}	我會先觀看那些YouTube影片，一邊跟著實作，最後產出作品，再發表到IG跟YouTube!	{}	{}	{managing_social_media,artistic_creation}	我會運用現有的IG帳號，發佈作品\n還會用YouTube 個人頻道發佈個人作品	t	Not Started	\N	\N	\N	2025-01-30 17:08:58.16357	\N	2025-01-30 17:08:58.16357	\N	1
22	5db8a711-9bce-45e3-8b80-3de17af5966f	150	\N	在計劃期間，透過自己的方式環島做志工。自己的方式ex打工、打工換宿、寫作收入	因為目前應該是我人生少數較多空白的時間，經過了一個月無所事事我覺得很空虛，也因此決定做些什麼來給自己一份上大學前的禮物，並且一個告訴自己已經準備好往下一個階段前進的準備。\n\n目標：預計在7月前用自己的力量環台一圈，並且在過程中要在每個城市至少做一次的志工服務\n\n預計已打工換宿、打工、寫作來增加收入\n\n與各地基金會聯絡了解管道\n	{self_challenge}	在十八年的成長路上，我所遇到的幫助太多太多，但是所遇到身邊所傷害我的、向我洩氣的、往後拉的力量也太多，深深體會到「養育一個孩子要一個村莊的力量」的理念，我希望在大學前我可以好好認識、至少親眼看過我生長18年的土地，並且在走訪台灣的同時，將我的能量付出給孩子、老人、動物等需要幫助的人		內容、路線規劃\n\n教育、活動企劃發想\n\n預算控制\n\n自我及他人共同成長	{field_research}	我預計先了解目前台灣各地的基金會、他們需要哪些幫助、我能透過什麼方式幫助\n\n在了解目前我真的能夠打工的實際情況	{}	{}	{initiating_projects_or_organizations}	我預計發起一個專案，透過了解了全台各地的弱勢族群，我更能知道他們真正需要的是什麼，在專案中為他們發聲、並號召更多志工	t	Not Started	\N	\N	\N	2025-01-30 17:08:58.16357	\N	2025-01-30 17:08:58.16357	\N	1
\.


--
-- Data for Name: project_marathon; Type: TABLE DATA; Schema: public; Owner: daodao
--

COPY public.project_marathon (id, project_id, marathon_id, eligibility_id, project_registration_date, status, feedback, created_at, updated_at) FROM stdin;
1	1	1	\N	2025-01-30 17:08:58.16357	\N	\N	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
2	2	1	\N	2025-01-30 17:08:58.16357	\N	\N	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
3	3	1	\N	2025-01-30 17:08:58.16357	\N	\N	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
4	4	1	\N	2025-01-30 17:08:58.16357	\N	\N	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
5	5	1	\N	2025-01-30 17:08:58.16357	\N	\N	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
6	6	1	\N	2025-01-30 17:08:58.16357	\N	\N	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
7	7	1	\N	2025-01-30 17:08:58.16357	\N	\N	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
8	8	1	\N	2025-01-30 17:08:58.16357	\N	\N	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
9	9	1	\N	2025-01-30 17:08:58.16357	\N	\N	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
10	10	1	\N	2025-01-30 17:08:58.16357	\N	\N	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
11	11	1	\N	2025-01-30 17:08:58.16357	\N	\N	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
12	12	1	\N	2025-01-30 17:08:58.16357	\N	\N	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
13	13	1	\N	2025-01-30 17:08:58.16357	\N	\N	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
14	14	1	\N	2025-01-30 17:08:58.16357	\N	\N	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
15	15	1	\N	2025-01-30 17:08:58.16357	\N	\N	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
16	16	1	\N	2025-01-30 17:08:58.16357	\N	\N	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
17	17	1	\N	2025-01-30 17:08:58.16357	\N	\N	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
18	18	1	\N	2025-01-30 17:08:58.16357	\N	\N	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
19	19	1	\N	2025-01-30 17:08:58.16357	\N	\N	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
20	20	1	\N	2025-01-30 17:08:58.16357	\N	\N	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
21	21	1	\N	2025-01-30 17:08:58.16357	\N	\N	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
22	22	1	\N	2025-01-30 17:08:58.16357	\N	\N	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
\.


--
-- Data for Name: review; Type: TABLE DATA; Schema: public; Owner: daodao
--

COPY public.review (id, project_id, week, title, mood, mood_description, stress_level, learning_review, learning_feedback, adjustment_plan, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: daodao
--

COPY public.role_permissions (role_id, permission_id) FROM stdin;
1	1
2	1
2	2
2	3
2	4
3	1
3	2
3	3
3	4
3	5
4	1
4	2
4	3
4	4
4	5
4	6
5	1
5	2
5	3
5	4
5	5
5	6
5	7
6	1
6	2
6	3
6	4
6	5
6	6
6	7
6	8
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: daodao
--

COPY public.roles (id, name, description) FROM stdin;
1	Guest	未登入使用者
2	User	一般使用者，擁有基本功能
3	Participant	參與活動的用戶，具備活動相關權限
4	Mentor	活動導師，負責活動管理與指導
5	Admin	系統管理者，負責活動與用戶管理
6	SuperAdmin	系統最高權限者，擁有所有權限
\.


--
-- Data for Name: store; Type: TABLE DATA; Schema: public; Owner: daodao
--

COPY public.store (id, external_id, user_id, image_url, author_list, tags, created_at, ai_summary, description, content, name) FROM stdin;
\.


--
-- Data for Name: subscription_plan; Type: TABLE DATA; Schema: public; Owner: daodao
--

COPY public.subscription_plan (id, name, description, features, price, created_at) FROM stdin;
\.


--
-- Data for Name: task; Type: TABLE DATA; Schema: public; Owner: daodao
--

COPY public.task (id, milestone_id, name, description, days_of_week, is_completed, is_deleted, created_at, updated_at) FROM stdin;
1	12	英文學習系統建立		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
2	12	 Obsidian筆記系統建置   - 設定每日英文日記模板   - 建立單字卡片系統   - 設計閱讀筆記架構   - 建立AI工具使用記錄模板		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
3	12	英文課本第一冊（前4課）   - 每課閱讀與寫字（20頁/課）：每天5頁   - 每課聆聽與口說（1頁/課）：每天練習15分鐘   - 製作單字卡片：每課30個重點單字   - 完成每課習作和測驗		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
4	12	Barry Loser第一本（I am not a loser）   - 第1-50頁：閱讀與筆記   - 製作生字表：每10頁整理一次   - 錄製朗讀音檔：每章一段		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
5	13	在兩個禮拜一次的探索有想保留繼續下一週的探索是沒問題的，甚至是兩週。		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
6	14	英文學習深化		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
7	14	英文課本第一冊（5-8課）   - 每天完成一課閱讀（20頁）   - 錄製口說練習（每課2次）   - 與學伴（阿菊）練習對話   - 完成每課習作		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
8	14	Barry Loser第一本（續）   - 第51-100頁閱讀與筆記   - 使用CloudAI練習對話   - 寫下每章重點摘要   - 錄製朗讀音檔		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
9	16	英文能力提升		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
10	16	英文課本第一冊（9-12課）   - 完成剩餘課程   - 進行總複習   - 製作重點整理   - 錄製口說練習		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
11	16	Barry Loser第一本（完結）與第二本開始   - 完成第一本（101-200頁）   - 開始第二本（1-50頁）   - 寫下完整讀書心得   - 準備與學伴分享		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
12	18	 英文學習    日常練習（每天）   - 寫英文日記（200字）   - 背誦單字（30個）   - 聽力練習（30分鐘）   - 口說練習（20分鐘）    週末整理（每週）   - 複習本週單字   - 整理學習筆記   - 記錄遇到的困難   - 規劃下週重點  科系探索   資料收集（每天）   - 閱讀相關文章   - 觀看影片資料   - 記錄重要資訊   - 提出疑問清單    週末整理（每週）   - 整理本週發現   - 更新探索方向   - 調整學習計畫   - 設定下週目標		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
13	19	1. 學習進度檢視    - 英文學習目標達成率    - 科系探索進展    - 遭遇困難分析    - 解決方案提出  2. 學習方法調整    - 效果評估    - 方法優化    - 資源使用檢討    - 時間分配調整		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
14	19	 英文學習    日常練習（每天）   - 寫英文日記（200字）   - 背誦單字（30個）   - 聽力練習（30分鐘）   - 口說練習（20分鐘）    週末整理（每週）   - 複習本週單字   - 整理學習筆記   - 記錄遇到的困難   - 規劃下週重點  科系探索   資料收集（每天）   - 閱讀相關文章   - 觀看影片資料   - 記錄重要資訊   - 提出疑問清單    週末整理（每週）   - 整理本週發現   - 更新探索方向   - 調整學習計畫   - 設定下週目標		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
15	20	 英文學習    日常練習（每天）   - 寫英文日記（200字）   - 背誦單字（30個）   - 聽力練習（30分鐘）   - 口說練習（20分鐘）    週末整理（每週）   - 複習本週單字   - 整理學習筆記   - 記錄遇到的困難   - 規劃下週重點  科系探索   資料收集（每天）   - 閱讀相關文章   - 觀看影片資料   - 記錄重要資訊   - 提出疑問清單    週末整理（每週）   - 整理本週發現   - 更新探索方向   - 調整學習計畫   - 設定下週目標		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
16	21	1. 學習進度檢視 - 英文學習目標達成率 - 科系探索進展 - 遭遇困難分析 - 解決方案提出 2. 學習方法調整 - 效果評估 - 方法優化 - 資源使用檢討 - 時間分配調整		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
17	21	 英文學習    日常練習（每天）   - 寫英文日記（200字）   - 背誦單字（30個）   - 聽力練習（30分鐘）   - 口說練習（20分鐘）    週末整理（每週）   - 複習本週單字   - 整理學習筆記   - 記錄遇到的困難   - 規劃下週重點  科系探索   資料收集（每天）   - 閱讀相關文章   - 觀看影片資料   - 記錄重要資訊   - 提出疑問清單    週末整理（每週）   - 整理本週發現   - 更新探索方向   - 調整學習計畫   - 設定下週目標		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
18	22	 英文學習    日常練習（每天）   - 寫英文日記（200字）   - 背誦單字（30個）   - 聽力練習（30分鐘）   - 口說練習（20分鐘）    週末整理（每週）   - 複習本週單字   - 整理學習筆記   - 記錄遇到的困難   - 規劃下週重點  科系探索   資料收集（每天）   - 閱讀相關文章   - 觀看影片資料   - 記錄重要資訊   - 提出疑問清單    週末整理（每週）   - 整理本週發現   - 更新探索方向   - 調整學習計畫   - 設定下週目標		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
19	23	1. 學習進度檢視 - 英文學習目標達成率 - 科系探索進展 - 遭遇困難分析 - 解決方案提出 2. 學習方法調整 - 效果評估 - 方法優化 - 資源使用檢討 - 時間分配調整		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
20	23	 英文學習    日常練習（每天）   - 寫英文日記（200字）   - 背誦單字（30個）   - 聽力練習（30分鐘）   - 口說練習（20分鐘）    週末整理（每週）   - 複習本週單字   - 整理學習筆記   - 記錄遇到的困難   - 規劃下週重點  科系探索   資料收集（每天）   - 閱讀相關文章   - 觀看影片資料   - 記錄重要資訊   - 提出疑問清單    週末整理（每週）   - 整理本週發現   - 更新探索方向   - 調整學習計畫   - 設定下週目標		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
21	24	 英文學習    日常練習（每天）   - 寫英文日記（200字）   - 背誦單字（30個）   - 聽力練習（30分鐘）   - 口說練習（20分鐘）    週末整理（每週）   - 複習本週單字   - 整理學習筆記   - 記錄遇到的困難   - 規劃下週重點  科系探索   資料收集（每天）   - 閱讀相關文章   - 觀看影片資料   - 記錄重要資訊   - 提出疑問清單    週末整理（每週）   - 整理本週發現   - 更新探索方向   - 調整學習計畫   - 設定下週目標		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
22	25	1. 學習進度檢視 - 英文學習目標達成率 - 科系探索進展 - 遭遇困難分析 - 解決方案提出 2. 學習方法調整 - 效果評估 - 方法優化 - 資源使用檢討 - 時間分配調整		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
23	25	 英文學習    日常練習（每天）   - 寫英文日記（200字）   - 背誦單字（30個）   - 聽力練習（30分鐘）   - 口說練習（20分鐘）    週末整理（每週）   - 複習本週單字   - 整理學習筆記   - 記錄遇到的困難   - 規劃下週重點  科系探索   資料收集（每天）   - 閱讀相關文章   - 觀看影片資料   - 記錄重要資訊   - 提出疑問清單    週末整理（每週）   - 整理本週發現   - 更新探索方向   - 調整學習計畫   - 設定下週目標		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
24	26	 英文學習    日常練習（每天）   - 寫英文日記（200字）   - 背誦單字（30個）   - 聽力練習（30分鐘）   - 口說練習（20分鐘）    週末整理（每週）   - 複習本週單字   - 整理學習筆記   - 記錄遇到的困難   - 規劃下週重點  科系探索   資料收集（每天）   - 閱讀相關文章   - 觀看影片資料   - 記錄重要資訊   - 提出疑問清單    週末整理（每週）   - 整理本週發現   - 更新探索方向   - 調整學習計畫   - 設定下週目標		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
25	27	1. 學習進度檢視 - 英文學習目標達成率 - 科系探索進展 - 遭遇困難分析 - 解決方案提出 2. 學習方法調整 - 效果評估 - 方法優化 - 資源使用檢討 - 時間分配調整		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
26	27	 英文學習    日常練習（每天）   - 寫英文日記（200字）   - 背誦單字（30個）   - 聽力練習（30分鐘）   - 口說練習（20分鐘）    週末整理（每週）   - 複習本週單字   - 整理學習筆記   - 記錄遇到的困難   - 規劃下週重點  科系探索   資料收集（每天）   - 閱讀相關文章   - 觀看影片資料   - 記錄重要資訊   - 提出疑問清單    週末整理（每週）   - 整理本週發現   - 更新探索方向   - 調整學習計畫   - 設定下週目標		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
27	28	 英文學習    日常練習（每天）   - 寫英文日記（200字）   - 背誦單字（30個）   - 聽力練習（30分鐘）   - 口說練習（20分鐘）    週末整理（每週）   - 複習本週單字   - 整理學習筆記   - 記錄遇到的困難   - 規劃下週重點  科系探索   資料收集（每天）   - 閱讀相關文章   - 觀看影片資料   - 記錄重要資訊   - 提出疑問清單    週末整理（每週）   - 整理本週發現   - 更新探索方向   - 調整學習計畫   - 設定下週目標		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
28	29	1. 學習進度檢視 - 英文學習目標達成率 - 科系探索進展 - 遭遇困難分析 - 解決方案提出 2. 學習方法調整 - 效果評估 - 方法優化 - 資源使用檢討 - 時間分配調整		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
29	29	 英文學習    日常練習（每天）   - 寫英文日記（200字）   - 背誦單字（30個）   - 聽力練習（30分鐘）   - 口說練習（20分鐘）    週末整理（每週）   - 複習本週單字   - 整理學習筆記   - 記錄遇到的困難   - 規劃下週重點  科系探索   資料收集（每天）   - 閱讀相關文章   - 觀看影片資料   - 記錄重要資訊   - 提出疑問清單    週末整理（每週）   - 整理本週發現   - 更新探索方向   - 調整學習計畫   - 設定下週目標		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
30	30	 英文學習    日常練習（每天）   - 寫英文日記（200字）   - 背誦單字（30個）   - 聽力練習（30分鐘）   - 口說練習（20分鐘）    週末整理（每週）   - 複習本週單字   - 整理學習筆記   - 記錄遇到的困難   - 規劃下週重點  科系探索   資料收集（每天）   - 閱讀相關文章   - 觀看影片資料   - 記錄重要資訊   - 提出疑問清單    週末整理（每週）   - 整理本週發現   - 更新探索方向   - 調整學習計畫   - 設定下週目標		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
31	31	1. 學習進度檢視 - 英文學習目標達成率 - 科系探索進展 - 遭遇困難分析 - 解決方案提出 2. 學習方法調整 - 效果評估 - 方法優化 - 資源使用檢討 - 時間分配調整		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
32	31	 英文學習    日常練習（每天）   - 寫英文日記（200字）   - 背誦單字（30個）   - 聽力練習（30分鐘）   - 口說練習（20分鐘）    週末整理（每週）   - 複習本週單字   - 整理學習筆記   - 記錄遇到的困難   - 規劃下週重點  科系探索   資料收集（每天）   - 閱讀相關文章   - 觀看影片資料   - 記錄重要資訊   - 提出疑問清單    週末整理（每週）   - 整理本週發現   - 更新探索方向   - 調整學習計畫   - 設定下週目標		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
33	32	 英文學習    日常練習（每天）   - 寫英文日記（200字）   - 背誦單字（30個）   - 聽力練習（30分鐘）   - 口說練習（20分鐘）    週末整理（每週）   - 複習本週單字   - 整理學習筆記   - 記錄遇到的困難   - 規劃下週重點  科系探索   資料收集（每天）   - 閱讀相關文章   - 觀看影片資料   - 記錄重要資訊   - 提出疑問清單    週末整理（每週）   - 整理本週發現   - 更新探索方向   - 調整學習計畫   - 設定下週目標		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
34	33	1. 學習進度檢視 - 英文學習目標達成率 - 科系探索進展 - 遭遇困難分析 - 解決方案提出 2. 學習方法調整 - 效果評估 - 方法優化 - 資源使用檢討 - 時間分配調整		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
35	33	 英文學習    日常練習（每天）   - 寫英文日記（200字）   - 背誦單字（30個）   - 聽力練習（30分鐘）   - 口說練習（20分鐘）    週末整理（每週）   - 複習本週單字   - 整理學習筆記   - 記錄遇到的困難   - 規劃下週重點  科系探索   資料收集（每天）   - 閱讀相關文章   - 觀看影片資料   - 記錄重要資訊   - 提出疑問清單    週末整理（每週）   - 整理本週發現   - 更新探索方向   - 調整學習計畫   - 設定下週目標		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
36	34	參考影片或圖片，製作出一隻後方置有棍棒或操縱環的偶		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
37	34	練習揣摩無獨有偶劇團〈戲偶動作練習表〉上的動作。每次練習花一個小時的時間，選擇五個動作。共練習三次。		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
38	34	檢討練習時錄製的影像，思考：戲偶有沒有確實表現出動作或情緒？為什麼？		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
39	34	週末反思當週目標有無確實執行？下週安排需不需作調整？		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
40	34	於社群發布執頭偶的學習歷程貼文		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
41	35	製作出一隻以棍棒穿過頭與身體的偶		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
42	35	其餘練習與反思，同第一週2、3、4點		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
43	35	 於社群發布杖頭偶的學習歷程貼文		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
44	36	製作一支可套入手的偶		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
45	36	 其餘練習與反思，同第一週2、3、4點		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
46	36	於社群發布手套偶的學習歷程貼文		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
47	37	參與遊行大偶課程（3/8）		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
48	37	在週間複習三次戲偶的動作練習（每次30分鐘，需要錄影檢討）		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
49	37	週末產出課程後與操偶練習的學習紀錄與反思		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
50	37	週末反思當週目標有無確實執行？下週安排需不需作調整？		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
51	38	參與遊行大偶課程（3/9、3/15）		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
52	38	其餘練習與反思，同第四週2、3、4點		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
53	39	 參與遊行大偶課程（3/16、3/22）		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
54	39	其餘練習與反思，同第四週2、3、4點		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
55	40	參與遊行大偶課程（3/23、3/29）		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
56	40	其餘練習與反思，同第四週2、3、4點		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
57	41	參與遊行大偶課程（3/30）		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
58	41	其餘練習與反思，同第四週2、3、4點		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
59	42	參與遊行大偶彩排（4/6、4/11）		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
60	42	遊行大偶演出（4/12）		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
61	42	彩排後頻繁複習筆記與注意事項		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
62	43	遊行大偶演出（4/13）		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
63	43	將工作坊綜整心得反思記錄下來，並於社群分享心得		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
64	43	觀看〈當代戲偶與製作美學〉講座，並記錄心得反思		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
65	44	製作一隻以線操作的戲偶		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
66	44	其餘練習與反思，同第一週2、3、4點		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
67	45	以操作練習為主，執行方式與反思同第一週2、3、4點		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
68	45	發布懸絲偶學習歷程貼文		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
69	46	範本搜索、戲偶設計		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
70	46	戲偶製作		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
71	46	週末反思當週目標有無確實執行？下週安排需不需作調整？		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
72	47	戲偶製作與修正		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
73	47	週末反思當週目標有無確實執行？下週安排需不需作調整？		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
74	48	於社群平台發布戲偶的操作影片與介紹文字內容		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
75	48	戲偶動作發展，並錄製影片		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
76	48	週末反思當週目標有無確實執行？下週安排需不需作調整？		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
77	49	範本搜索、戲偶設計		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
78	49	週末反思當週目標有無確實執行？下週安排需不需作調整？		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
79	50	戲偶製作與修正		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
80	50	週末反思當週目標有無確實執行？下週安排需不需作調整？		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
81	51	 於社群平台發布戲偶的操作影片與介紹文字內容		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
82	51	 戲偶動作發展，並錄製影片		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
83	51	週末反思當週目標有無確實執行？下週安排需不需作調整？		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
84	52	範本搜索、戲偶設計		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
85	52	週末反思當週目標有無確實執行？下週安排需不需作調整？		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
86	53	戲偶製作與修正		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
87	53	週末反思當週目標有無確實執行？下週安排需不需作調整？		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
88	54	戲偶製作與修正		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
89	54	週末反思當週目標有無確實執行？下週安排需不需作調整？		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
90	55	 於社群平台發布戲偶的操作影片與介紹文字內容		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
91	55	 戲偶動作發展，並錄製影片		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
92	124	分享學習心得、資源在threads		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
93	125	分享學習心得、資源在threds		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
94	126	分享學習心得、資源在threds		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
95	126	個人課程筆記整理		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
96	127	發想LinkedIn內容		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
97	144	每天什麼時候練習寫作、寫多久、練習方式？		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
98	144	閱讀計畫：預計多久內讀完		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
99	144	開始閱讀＆持續練習		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
100	145	建立個人部落格(預計使用Vocus、Medium)		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
101	145	讀完《寫作是最好的自我投資》並完成讀書筆記（可寫成文章上傳）		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
102	147	關鍵字研究與應用		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
103	147	吸引點擊的Meta描述與標題		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
104	147	結構化內容		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
105	147	高品質內容		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
106	148	至少寫出兩篇影評文章並上傳		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
107	149	至少寫出兩篇社會觀點文章並上傳		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
108	150	至少寫出兩篇經濟市場分析文章並上傳		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
109	151	至少完成兩篇文章&上傳		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
110	152	至少完成兩篇文章&上傳		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
111	153	至少完成兩篇文章&上傳		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
112	154	整理自主學習計畫遇到的挑戰、困難、解決辦法、收穫等		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
113	154	寫一篇總結這次自主學習計畫的文章		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
114	177	瞭解手機攝影劣勢並找方法彌補		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
115	177	一人拍攝劣勢尋找方法彌補		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
116	178	拍攝不同構圖的照片		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
117	178	瞭解不同構圖適合什麼類型照片		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
118	179	拍攝靜物		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
119	180	拍攝背景模糊的照片		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
120	180	拍攝有主次之分的照片		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
121	181	拍攝自然光下的戶外人像		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
122	182	拍攝小花朵這類		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
123	182	拍攝行人或車輛的運動軌跡		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
124	183	拍攝晚上街景或者天空		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
125	184	探索獨特的拍攝角度（高角度、低角度等）		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
126	186	以五張照片為一主題進行創作		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
127	210	熟悉手邊的影片素材		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
128	210	上字幕		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
129	210	上字卡		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
130	210	調色調光		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
131	210	上特效		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
132	210	剪輯成短影音		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
133	210	發布社群平台		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
134	221	紀錄已經有的茶葉和咖啡豆，用Notion做收藏庫		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
135	222	明白我到底想改變什麼現況		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
136	243	初步學習混音概念，了解如何讓音軌層次分明。		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
137	243	掌握翻唱《月亮惹的禍》所需的基本技能，熟悉和弦與節奏。		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
138	243	找到《月亮惹的禍》的和弦與節奏結構，用吉他練習基礎伴奏。		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
139	243	使用 BandLab 錄下吉他伴奏，並嘗試錄製人聲。		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
140	243	觀看 EQ 和聲音分離的基礎教學，學會調整吉他和人聲的頻率避免衝突。		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
141	243	確定歌曲中的分段安排（主歌、副歌、和聲）及要模仿的效果。		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
142	244	使用 BandLab 完成吉他的分段錄製，並嘗試使用點擊音（Click Track）保持穩定節奏。		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
143	244	嘗試錄製主旋律，初步感受音準和情感表達。		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
144	244	分析歌曲中的和聲設計，用 BandLab 嘗試錄下多聲部。		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
145	245	調整吉他的 EQ，減少低頻雜音，突出中頻清晰度。 為人聲加入適量混響（Reverb）與壓縮器（Compressor），提升聽感。		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
146	245	加強和聲的混音處理，讓它與主旋律和諧融合。		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
147	245	進一步調整歌曲結構與段落，完成歌曲的整體混音。		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
148	246	學習進階和弦： 研究 7 和弦與 9 和弦的理論		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
149	246	用吉他實驗不同和弦進行，將其應用到 BandLab		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
150	246	將創作分為主歌（Verse）、副歌（Chorus）、過門（Bridge）。		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
151	246	每段設計不同和弦進行，並保持旋律統一性。		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
152	246	完成短作品： 將旋律、和弦與節奏結合，創作一首 1 分鐘長的作品		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
153	247	學習基本混響（Reverb）與延遲（Delay）的使用。		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
154	247	用 BandLab 合成器插件創建空靈或特殊音效。		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
155	247	嘗試加入背景細節（如環境聲、Pad）。		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
156	247	完成短編曲： 編寫一段氛圍感突出的音樂，加入細節音色與效果器。		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
157	248	用手機拍攝MV畫面，準備影像素材。		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
158	248	準備拍攝畫面草稿		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
159	248	拍攝MV。		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
160	249	分析原曲的和弦進行與背景設計。		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
161	249	用合成器製作出類似的氛圍感。		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
162	249	設計旋律與和弦，嘗試創作一首風格化作品。		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
163	254	自行回顧甄選歷程		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
164	254	訪談當初甄選時之競爭者		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
165	255	Alison Grinder & E. Sue Macoy著，閻蕙群譯（2006）《如何培養優秀的導覽員》五觀出版社。		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
166	255	閻鈺臻（2015.3）〈雖然我不認識你但是我謝謝你—談博物館導覽工作〉，《檔案半年刊》14卷1期。		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
167	256	訪談自己擔任導覽員的單位前輩		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
168	256	訪談自己擔任導覽員時的聽眾		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
169	257	整理前三階段資料		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
170	257	認識交通部觀光署114年導遊人員及領隊人員評量		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
171	258	觀看台灣英語導覽、導遊影片，並自行口述練習		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
172	258	針對生活子題，例如地點、個人故事，每子題進行10-15分鐘之英語介紹		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
173	259	觀看台灣英語導覽、導遊影片，並自行口述練習。		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
174	259	針對自家附近，進行40-60分鐘之英語介紹。		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
175	260	訪談島內散步公司，了解如何設計導覽旅程。		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
176	260	主題設定以地方文史為中心，地區限定於北北基。		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
177	261	文獻閱讀，建立導覽主題及敘事。		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
178	261	如有必要，訪談當地耆老及文史工作者。		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
179	262	透過Google Map，初步進行路線規劃及設計。		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
180	262	實地踏查、尋找雨備。		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
181	262	如會影響店家營業、民居，事先聯繫。		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
182	263	準備好中英語導覽稿		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
183	263	招募受試者，並取得反饋。		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
184	263	檢討，並更新導覽旅程。		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
185	264	安排導覽工具(手舉牌、音響等)		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
186	264	實際執行導覽		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
187	264	導覽後檢討		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
188	265	將生活素材做成第一首詞		\N	f	f	2025-01-30 17:08:58.16357	2025-01-30 17:08:58.16357
\.


--
-- Data for Name: user_join_group; Type: TABLE DATA; Schema: public; Owner: daodao
--

COPY public.user_join_group (id, user_id, group_id, group_participation_role_t, participated_at) FROM stdin;
1	34	\N	Initiator	2025-01-30 17:08:40.868723+00
2	34	\N	Initiator	2025-01-30 17:08:40.868723+00
3	8	\N	Initiator	2025-01-30 17:08:40.868723+00
4	23	\N	Initiator	2025-01-30 17:08:40.868723+00
5	16	\N	Initiator	2025-01-30 17:08:40.868723+00
6	16	\N	Initiator	2025-01-30 17:08:40.868723+00
7	41	\N	Initiator	2025-01-30 17:08:40.868723+00
8	46	\N	Initiator	2025-01-30 17:08:40.868723+00
9	8	\N	Initiator	2025-01-30 17:08:40.868723+00
10	87	\N	Initiator	2025-01-30 17:08:40.868723+00
11	9	\N	Initiator	2025-01-30 17:08:40.868723+00
12	34	\N	Initiator	2025-01-30 17:08:40.868723+00
13	4	\N	Initiator	2025-01-30 17:08:40.868723+00
\.


--
-- Data for Name: user_permissions; Type: TABLE DATA; Schema: public; Owner: daodao
--

COPY public.user_permissions (user_id, permission_id) FROM stdin;
\.


--
-- Data for Name: user_positions; Type: TABLE DATA; Schema: public; Owner: daodao
--

COPY public.user_positions (user_id, position_id) FROM stdin;
2	2
2	3
2	4
3	2
3	1
4	4
5	2
6	2
7	6
8	3
8	2
9	2
9	4
10	1
16	2
17	2
19	6
20	2
22	2
23	2
24	2
25	1
26	1
27	2
28	2
29	1
29	3
30	1
31	4
32	2
33	2
34	2
34	3
34	4
35	2
36	4
37	1
39	2
40	2
41	4
42	2
45	1
46	2
47	2
48	2
49	6
50	6
51	3
52	3
53	3
54	2
56	6
57	3
59	3
60	2
60	4
61	1
62	1
63	1
64	6
65	3
66	2
67	1
68	2
69	6
69	4
70	1
71	1
72	1
73	6
73	1
74	3
74	2
75	6
75	2
75	4
78	1
79	1
80	1
81	1
82	4
83	3
84	4
85	6
86	6
87	6
88	6
89	6
90	6
91	6
92	6
93	6
93	4
94	6
94	1
95	1
95	2
96	2
97	1
98	6
99	6
100	3
101	6
103	3
104	6
105	1
105	6
106	1
107	3
108	6
109	4
110	1
111	4
112	1
113	1
114	2
115	2
116	6
117	1
118	6
119	6
120	6
121	1
122	4
122	1
122	6
123	1
124	4
125	3
126	6
127	2
128	1
129	1
130	6
131	6
132	6
133	6
134	1
135	3
136	3
137	2
138	1
139	2
140	2
140	1
140	4
141	1
142	1
143	1
144	3
145	3
146	1
147	2
148	2
150	1
151	1
\.


--
-- Data for Name: user_profiles; Type: TABLE DATA; Schema: public; Owner: daodao
--

COPY public.user_profiles (id, user_id, nickname, bio, skills, interests, learning_needs, contact_info, is_public, created_at, updated_at) FROM stdin;
1	2	\N	樂愛學習新事物、勇於挑戰\n\n最近在研究產品開發、商業模型、行銷策略	{}	{}	{}	{}	t	2025-01-30 17:08:48.040749	2025-01-30 17:08:48.040749
2	3	\N	以設計的身份在教育產業浮沈多年，現在正在念研究所專心當學生。	{}	{}	{}	{}	t	2025-01-30 17:08:48.092962	2025-01-30 17:08:48.092962
3	4	\N	想做的事	{}	{}	{}	{}	t	2025-01-30 17:08:48.097418	2025-01-30 17:08:48.097418
4	5	\N		{}	{}	{}	{}	t	2025-01-30 17:08:48.193731	2025-01-30 17:08:48.193731
5	6	\N	在教育和學習產業擁有超過 10 年以上經驗，曾擔任教育顧問和成功大學國際處專案經理。熱衷於分享和推廣各種引導和學習體驗設計資源和概念。致力於創造對學習者有意義的學習體驗。喜歡了解和學習相關的知識和技能，包括心理學、行為科學和腦科學。\n\n目前是遠距工作者，在線上教學機構擔任 learning facilitator，同時也接案進行各類企業工作坊引導者。\n\nSign up bi-weekly newsletter [https://studiounfolding.kit.com/signup](https://studiounfolding.kit.com/signup)	{}	{}	{}	{}	t	2025-01-30 17:08:48.197355	2025-01-30 17:08:48.197355
6	7	\N	居住於新北市的高中生，看似興趣多元到喊出類組時像在倒數三二一，實際上是個偶爾裝成文組寫寫詩的理工阿宅。熱愛跨界連結，用科技解決社會議題，從人情看見科技需求。	{}	{}	{}	{}	t	2025-01-30 17:08:48.201631	2025-01-30 17:08:48.201631
7	8	\N	擔任多年醫療公關、人文國中小及展賦行動學苑教師後，深感對民主教育之興趣，因而就讀美國民主教育大學 Goddard College 社會創新與永續研究所，並以創立島島阿學學習社群為題，以行動研究民主教育。現為 g0v 零時小學校專案經理，盼將數位公民教育素養向下扎根，同時也持續發起各項教育改革行動，目前同時為臺灣實驗教育勞動合作社及島島阿學學習社群共同發起人等。	{}	{}	{}	{}	t	2025-01-30 17:08:48.204407	2025-01-30 17:08:48.204407
8	9	\N	 	{}	{}	{}	{}	t	2025-01-30 17:08:48.207264	2025-01-30 17:08:48.207264
9	10	\N	最近在準備研究所！我們可以互相打氣（？	{}	{}	{}	{}	t	2025-01-30 17:08:48.210367	2025-01-30 17:08:48.210367
10	11	\N		{}	{}	{}	{}	t	2025-01-30 17:08:48.212901	2025-01-30 17:08:48.212901
11	12	\N		{}	{}	{}	{}	t	2025-01-30 17:08:48.21502	2025-01-30 17:08:48.21502
12	13	\N		{}	{}	{}	{}	t	2025-01-30 17:08:48.217646	2025-01-30 17:08:48.217646
13	14	\N		{}	{}	{}	{}	t	2025-01-30 17:08:48.219627	2025-01-30 17:08:48.219627
14	15	\N		{}	{}	{}	{}	t	2025-01-30 17:08:48.221542	2025-01-30 17:08:48.221542
15	16	\N	喜歡沖煮咖啡的工程師之一，最近開始投入鉤針，雖然很常鉤到眼睛和手指都很痠，但是個很適合me time放空又有成就感的活動✨ 歡迎揪團鉤針編織\n\n本職 frontend web developer 近期研究單元測試和設計模式，有興趣者可來揪讀書會分享🕺	{}	{}	{}	{}	t	2025-01-30 17:08:48.223821	2025-01-30 17:08:48.223821
16	17	\N		{}	{}	{}	{}	t	2025-01-30 17:08:48.226593	2025-01-30 17:08:48.226593
17	18	\N		{}	{}	{}	{}	t	2025-01-30 17:08:48.229145	2025-01-30 17:08:48.229145
18	19	\N		{}	{}	{}	{}	t	2025-01-30 17:08:48.231082	2025-01-30 17:08:48.231082
19	20	\N	保持神秘	{}	{}	{}	{}	t	2025-01-30 17:08:48.236259	2025-01-30 17:08:48.236259
20	21	\N		{}	{}	{}	{}	t	2025-01-30 17:08:48.250407	2025-01-30 17:08:48.250407
21	22	\N	大家好，我叫鉛筆\n目前是擔任網頁設計師，主要負責網頁視覺及切版\n希望能在這邊遇到一起組團side project的夥伴\n或是一起學習、分享經驗～\n目前正在學習JS及日文\n	{}	{}	{}	{}	t	2025-01-30 17:08:48.256342	2025-01-30 17:08:48.256342
22	23	\N	主要想找尋可以一起研究讓自我身心完整、社會共好方法的夥伴	{}	{}	{}	{}	t	2025-01-30 17:08:48.266793	2025-01-30 17:08:48.266793
23	24	\N	個人興趣最近是台灣茶、藝術欣賞以及如何更好地成為自己(自我成長)。長期有興趣的有動漫與遊戲、收藏古物與手工藝品。\n	{}	{}	{}	{}	t	2025-01-30 17:08:48.275893	2025-01-30 17:08:48.275893
24	25	\N	哈囉！我是冠彰，大家都叫我袋鼠。\n\n「從跨出學校體制後，看見教育與生涯的多樣性與選擇性，因此展開社會設計與社會創新的旅程。」\n\n個人Blog：https://kangarooblog.addpotion.com/	{}	{}	{}	{}	t	2025-01-30 17:08:48.285727	2025-01-30 17:08:48.285727
25	26	\N	希望可以找到一起學英文或出國的好夥伴(明年寒假或暑假想去澳洲、紐西蘭)\n我平常在台北讀書，也可以一起出門攝影拍照\n現在有自己的地方創生團隊，也希望可以認識更多新的夥伴\n\n*想尋找台師大的學生一起揪團參加學校自主學習的課	{}	{}	{}	{}	t	2025-01-30 17:08:48.293618	2025-01-30 17:08:48.293618
26	27	\N	Linkedin: https://www.linkedin.com/in/yun-tseng-3766601b0/	{}	{}	{}	{}	t	2025-01-30 17:08:48.299318	2025-01-30 17:08:48.299318
27	28	\N		{}	{}	{}	{}	t	2025-01-30 17:08:48.305685	2025-01-30 17:08:48.305685
28	29	\N	大家好，我是豪君，很開心能夠和大家分享這幾年來我的探索與成長。我開始思考自己的想法是在建築系中。我很認同自己是一名建築人——一個透過空間思考來探討生活、連結多元領域的人。雖然我開始探索才短短三年左右，但這段時間讓我不斷嘗試突破自己，並且做出了一些關鍵的選擇。\n\n在建築學習的過程中，我並非只關注於建築本身，而是思考如何讓空間更貼近使用者的需求。雖然我曾參與過無障礙設計的專案，但我的目標並不是成為一名建築師，而是去思考如何透過空間創造出更具影響力的體驗與連結，因此最近我參與了於公東高中舉辦的實構築工作。\n\n最近，因為對於建築教育的方式(特別是常態熬夜)有些疑問以及個人健康狀態，我毅然轉系並將重心放在程式設計的學習上。我認為未來的建築不僅僅是實體空間的設計，而是應該結合數位工具，讓設計能夠更加智能化、更能貼近人的需求。雖然目前我還處於程式學習的起步階段，但我相信這將成為我未來實現理想的重要基石之一。\n\n同時，教育也是我一直非常關注的領域。我在過去，參與了遠距教育志工服務以及從事個別指導的工作，這讓我深刻體會到教育的力量。特別是在當前這個數位時代，如何讓知識傳遞變得更加靈活、更加個性化，這是我一直在思考並希望能夠投入更多心力去探索的方向。\n\n我所追求的生活，其實是一個自由而多元的狀態。我希望能夠在工作與生活之間找到平衡，並且透過設計與教育來實現這種理想生活。不論是在學習新的技能，還是與不同文化背景的人交流，這些經驗都豐富了我的視野，也讓我更清楚地知道自己想要什麼樣的未來。\n	{}	{}	{}	{}	t	2025-01-30 17:08:48.313185	2025-01-30 17:08:48.313185
29	30	\N		{}	{}	{}	{}	t	2025-01-30 17:08:48.319763	2025-01-30 17:08:48.319763
30	31	\N	從國小三年級開始個人自學，高中自學時沒有與學校合作，目前已18歲並完成學業。對自學和自學團體有一定的了解，曾參與過的團體包括：高雄小草旅人共學團、台中紅泥巴自學團、新竹粘巴達假日學校，以及台南可能非學校自學團。對新型教育懷有濃厚的興趣。	{}	{}	{}	{}	t	2025-01-30 17:08:48.324024	2025-01-30 17:08:48.324024
31	32	\N		{}	{}	{}	{}	t	2025-01-30 17:08:48.329116	2025-01-30 17:08:48.329116
32	33	\N		{}	{}	{}	{}	t	2025-01-30 17:08:48.33289	2025-01-30 17:08:48.33289
33	34	\N	非常喜歡產品的產品人，熱愛手動作 project，連結知識和實務。\n有任何想學習、累積實務經驗的歡迎聯繫我～\n更多關於我請見：https://portaly.cc/landy	{}	{}	{}	{}	t	2025-01-30 17:08:48.337195	2025-01-30 17:08:48.337195
34	35	\N	學習	{}	{}	{}	{}	t	2025-01-30 17:08:48.343091	2025-01-30 17:08:48.343091
35	36	\N		{}	{}	{}	{}	t	2025-01-30 17:08:48.348417	2025-01-30 17:08:48.348417
36	37	\N		{}	{}	{}	{}	t	2025-01-30 17:08:48.352506	2025-01-30 17:08:48.352506
37	38	\N		{}	{}	{}	{}	t	2025-01-30 17:08:48.356076	2025-01-30 17:08:48.356076
38	39	\N	- 我是誰？  Dex的塵世哲學\n\nPython作品集引導，引領踏入大數據和AI\n歷經半導體、資料科學、軟體開發，建立程式職涯交流，提供理工職涯洞見\n\n- 我在做什麼：成為程式入門者的引路人 ; 轉職者的職涯諮詢師, 精進者的學習顧問。\n\n- 我如何協助：程式入門、轉職、作品集引導；職涯諮詢和履歷健檢諮詢 ; 學習資源分享和技術心得見解。\n\n主要文章和諮詢預約網站(努力寫文中)：\nhttps://daydreamdex.com\n\n長文FB：\nhttps://www.facebook.com/profile.php?id=61560603174482\n\nIG/Threads： @daydreamdex\n\n更多學習資源和工作經驗分享\n可訂閱 我與經驗值 <I And EXP> 電子報\nhttps://iandexp.ck.page/283146f2d3\n訂閱即可獲得NVIDIA AI 學習資源	{}	{}	{}	{}	t	2025-01-30 17:08:48.358692	2025-01-30 17:08:48.358692
39	40	\N		{}	{}	{}	{}	t	2025-01-30 17:08:48.362335	2025-01-30 17:08:48.362335
40	41	\N	你好，我是Chao，我的工作專注在設計，研究及物件上，使用物件跟設計來研究使用者的行為及洞察。\n之前是一名PM及UX設計師，目前全心投入做設計研究及使用者研究。\n\n	{}	{}	{}	{}	t	2025-01-30 17:08:48.366075	2025-01-30 17:08:48.366075
41	42	\N		{}	{}	{}	{}	t	2025-01-30 17:08:48.369878	2025-01-30 17:08:48.369878
42	43	\N		{}	{}	{}	{}	t	2025-01-30 17:08:48.373026	2025-01-30 17:08:48.373026
43	44	\N	孩子正要申請自學	{}	{}	{}	{}	t	2025-01-30 17:08:48.376733	2025-01-30 17:08:48.376733
44	45	\N		{}	{}	{}	{}	t	2025-01-30 17:08:48.380769	2025-01-30 17:08:48.380769
45	46	\N		{}	{}	{}	{}	t	2025-01-30 17:08:48.385524	2025-01-30 17:08:48.385524
46	47	\N		{}	{}	{}	{}	t	2025-01-30 17:08:48.388819	2025-01-30 17:08:48.388819
47	48	\N	111111	{}	{}	{}	{}	t	2025-01-30 17:08:48.391841	2025-01-30 17:08:48.391841
48	49	\N		{}	{}	{}	{}	t	2025-01-30 17:08:48.395667	2025-01-30 17:08:48.395667
49	50	\N		{}	{}	{}	{}	t	2025-01-30 17:08:48.399159	2025-01-30 17:08:48.399159
50	51	\N	白天在教育平台擔任課程體驗設計師，與夥伴共創個人化學習的內容與環境。\n下班後經營學習玩家教育創作室，寫寫教育專欄，\n我的教育理想型：讓孩子主導學習、探索未知與尋找喜樂\n熱愛學習體驗設計、塗鴉筆記與教育AI應用，\n偶爾探險、演講、帶工作坊，廣結善緣😆，\n沒事就喝杯咖啡，享受一個人的圖文創作\n玩，就是最好的學習體驗	{}	{}	{}	{}	t	2025-01-30 17:08:48.402762	2025-01-30 17:08:48.402762
51	52	\N		{}	{}	{}	{}	t	2025-01-30 17:08:48.406104	2025-01-30 17:08:48.406104
52	53	\N		{}	{}	{}	{}	t	2025-01-30 17:08:48.409563	2025-01-30 17:08:48.409563
53	54	\N		{}	{}	{}	{}	t	2025-01-30 17:08:48.413712	2025-01-30 17:08:48.413712
54	55	\N		{}	{}	{}	{}	t	2025-01-30 17:08:48.416948	2025-01-30 17:08:48.416948
55	56	\N		{}	{}	{}	{}	t	2025-01-30 17:08:48.419634	2025-01-30 17:08:48.419634
56	57	\N		{}	{}	{}	{}	t	2025-01-30 17:08:48.423678	2025-01-30 17:08:48.423678
57	58	\N		{}	{}	{}	{}	t	2025-01-30 17:08:48.426941	2025-01-30 17:08:48.426941
58	59	\N		{}	{}	{}	{}	t	2025-01-30 17:08:48.429322	2025-01-30 17:08:48.429322
59	60	\N	嗨大家好! 很高興知道這個地方，希望能找到夥伴一起學習!	{}	{}	{}	{}	t	2025-01-30 17:08:48.432417	2025-01-30 17:08:48.432417
60	61	\N	陳映竹同時擁有臺師大國際漢學研究所文學碩士，以及臺北市立大學運動健康科學系理學碩士。目前為臺師大體育與運動科學博士候選人。並且擁有美國運動醫學會臨床運動生理師以及私人教練認證！希冀透過平台持續推廣運動與健康科學相關知識，以及肌力與體能相關訓練理論及實務，並提供個人跨領域與教練自我成長歷程，讓有志從事教練產業以及斜槓工作者有所依循。\n\n🟨 自媒體經營：以「我是運科竹」為關鍵字搜尋！\n▌Youtube: https://www.youtube.com/@yesimsportscientist8642/about\n▌Instagram : https://www.instagram.com/coachsteveperformance/\n▌Facebook : https://www.facebook.com/SteveLovesWorkout/\nPodcast 頻道 : Sound on, Apple Podcast, 以及 Google Podcast，均為「我是運科竹」。	{}	{}	{}	{}	t	2025-01-30 17:08:48.436568	2025-01-30 17:08:48.436568
61	62	\N	大學犯罪防治學系四年級生，目前正準備研究所甄試\n喜歡閱讀、二次元相關事務！\n正努力自學日文和程式語言	{}	{}	{}	{}	t	2025-01-30 17:08:48.439429	2025-01-30 17:08:48.439429
62	63	\N		{}	{}	{}	{}	t	2025-01-30 17:08:48.442607	2025-01-30 17:08:48.442607
63	64	\N		{}	{}	{}	{}	t	2025-01-30 17:08:48.446679	2025-01-30 17:08:48.446679
64	65	\N		{}	{}	{}	{}	t	2025-01-30 17:08:48.449642	2025-01-30 17:08:48.449642
65	66	\N	原是在社工界漂浮的一抹靈魂，現在想掙扎跟昇華去其他世界看看，也希望能讓這抹靈魂發展不同的樣貌。	{}	{}	{}	{}	t	2025-01-30 17:08:48.453161	2025-01-30 17:08:48.453161
66	67	\N	我想尋找一起努力、學習的夥伴，也可以彼此監督、交流，認識各個領域和各種經歷～\n線上的夥伴也很歡迎～	{}	{}	{}	{}	t	2025-01-30 17:08:48.456866	2025-01-30 17:08:48.456866
67	68	\N		{}	{}	{}	{}	t	2025-01-30 17:08:48.460145	2025-01-30 17:08:48.460145
68	69	\N		{}	{}	{}	{}	t	2025-01-30 17:08:48.462806	2025-01-30 17:08:48.462806
69	70	\N		{}	{}	{}	{}	t	2025-01-30 17:08:48.466062	2025-01-30 17:08:48.466062
70	71	\N	fffffffff	{}	{}	{}	{}	t	2025-01-30 17:08:48.46943	2025-01-30 17:08:48.46943
71	72	\N	我的MBTI是EEEE，我很外相	{}	{}	{}	{}	t	2025-01-30 17:08:48.472714	2025-01-30 17:08:48.472714
72	73	\N	大家好！	{}	{}	{}	{}	t	2025-01-30 17:08:48.475916	2025-01-30 17:08:48.475916
73	74	\N	我	{}	{}	{}	{}	t	2025-01-30 17:08:48.479369	2025-01-30 17:08:48.479369
74	75	\N		{}	{}	{}	{}	t	2025-01-30 17:08:48.484573	2025-01-30 17:08:48.484573
75	76	\N		{}	{}	{}	{}	t	2025-01-30 17:08:48.488534	2025-01-30 17:08:48.488534
76	77	\N		{}	{}	{}	{}	t	2025-01-30 17:08:48.490997	2025-01-30 17:08:48.490997
77	78	\N		{}	{}	{}	{}	t	2025-01-30 17:08:48.493834	2025-01-30 17:08:48.493834
78	79	\N		{}	{}	{}	{}	t	2025-01-30 17:08:48.498121	2025-01-30 17:08:48.498121
79	80	\N		{}	{}	{}	{}	t	2025-01-30 17:08:48.503256	2025-01-30 17:08:48.503256
80	81	\N		{}	{}	{}	{}	t	2025-01-30 17:08:48.507266	2025-01-30 17:08:48.507266
81	82	\N	測試\n	{}	{}	{}	{}	t	2025-01-30 17:08:48.511112	2025-01-30 17:08:48.511112
82	83	\N	我是潔伃（Joann），一位致力於教育創新的研究者、實踐者與催化者，專注於建構民主且包容的學習生態系統。我深信教育應該成為促進社會公平與變革的力量。\n\n過去我曾是自學生，透過特殊選才進入不分系後肄業，後以同等學力申請並完成多元文化教育碩士學位。十多年來，我在國際非營利組織、學術機構及社會企業中積累了豐富的實務經驗，也擔任多個縣市的實驗教育審議委員。\n\n我創辦了「魚水教育催化劑」並共同創立了「鯨落教育聯盟」，希望打造一個兼具在地特色與國際視野的教育智庫和行動平台。目前，我專注於國際教育研究與內容策展，期望推動更具影響力的教育實踐。	{}	{}	{}	{}	t	2025-01-30 17:08:48.514848	2025-01-30 17:08:48.514848
83	84	\N	想認識一起戶外運動的朋友。	{}	{}	{}	{}	t	2025-01-30 17:08:48.517862	2025-01-30 17:08:48.517862
84	85	\N	來自新竹的自學生，喜歡acgn相關的東西。	{}	{}	{}	{}	t	2025-01-30 17:08:48.521093	2025-01-30 17:08:48.521093
85	86	\N	自學生. 	{}	{}	{}	{}	t	2025-01-30 17:08:48.524272	2025-01-30 17:08:48.524272
86	87	\N	16歲高中自學生	{}	{}	{}	{}	t	2025-01-30 17:08:48.527446	2025-01-30 17:08:48.527446
87	88	\N	自學生，偶爾寫寫腳本\n物理和航太工程愛好者	{}	{}	{}	{}	t	2025-01-30 17:08:48.530429	2025-01-30 17:08:48.530429
88	89	\N	あ	{}	{}	{}	{}	t	2025-01-30 17:08:48.534873	2025-01-30 17:08:48.534873
89	90	\N	17歲高中生	{}	{}	{}	{}	t	2025-01-30 17:08:48.538399	2025-01-30 17:08:48.538399
90	91	\N	遊戲宅\n遊戲最近常玩MH	{}	{}	{}	{}	t	2025-01-30 17:08:48.542591	2025-01-30 17:08:48.542591
91	92	\N	華德福高中生，休學中	{}	{}	{}	{}	t	2025-01-30 17:08:48.547226	2025-01-30 17:08:48.547226
92	93	\N	哈囉~\n我是個17歲台南高三自學生，是暖暖蛇青少年共學團高中部成員，也是台南市第七屆兒少代表\n加入這個社群是想認識更多夥伴與學習資源，歡迎認識～	{}	{}	{}	{}	t	2025-01-30 17:08:48.5521	2025-01-30 17:08:48.5521
93	94	\N	目前是學生	{}	{}	{}	{}	t	2025-01-30 17:08:48.564626	2025-01-30 17:08:48.564626
94	95	\N	\N	{}	{}	{}	{}	t	2025-01-30 17:08:48.571642	2025-01-30 17:08:48.571642
95	96	\N	大家好\n我是Judy\n希望找到能練習英文口說的夥伴	{}	{}	{}	{}	t	2025-01-30 17:08:48.582885	2025-01-30 17:08:48.582885
96	97	\N	\N	{}	{}	{}	{}	t	2025-01-30 17:08:48.587252	2025-01-30 17:08:48.587252
97	98	\N	一個平平無奇的高中自學生	{}	{}	{}	{}	t	2025-01-30 17:08:48.590854	2025-01-30 17:08:48.590854
98	99	\N	暖暖蛇青少年共學團的高一生，超喜歡跳舞，對舞蹈有興趣的可以交流交流	{}	{}	{}	{}	t	2025-01-30 17:08:48.595041	2025-01-30 17:08:48.595041
99	100	\N	嗨，我是 鳥巢，一位自學成長的教育工作者，兼具思想家的視角、民主教育的實踐者以及社會改革的推動者。此外，我還是一名半自造者（Maker），熱衷於動手實踐與創造。\n\n* 教學經驗：\n  * 有開過的課程：數學、桌遊、民主、生活課（**情緒課、政治課、談判課）**、程式設計（Scratch、python）、科學、可編程電路板（樹莓派、Arduino、micro:bit）、兒童陪伴、小旅行、歷史課、學科課程。\n  * 曾協助厭惡數學的學生轉變為熱愛學習者，擅長激發學生的學習動機與自主學習能力。\n* 專業背景：\n  * 第一屆 實驗教育工作者培力計畫 實習於全人中學，參與民主教育工作坊。\n  * 擔任 實驗教育勞動合作社理事，致力於體制外教育的推動。\n  * 深入理解數學教育與科學教育的本質，將理性與創造力融入教學。\n* 樂於實作與創造：\n  * 自學 Python 與 Arduino，涉足 Maker 領域，樂於解決問題並動手製作。\n  * 善於將解決問題的過程延伸至實際操作，享受修理與創造的樂趣。\n* 熱愛心理學與哲學：\n  * 喜愛哲學，生活目標是「愛智」。\n  * 擁有一定的心理輔導與諮商經驗，善於傾聽與分析問題。\n\n教學理念\n\n* 人本教育： 相信每個人都應被「好好對待」，教育應以人為核心，尊重其主體性。\n* 民主教育： 推動學習者與教育者共同協作，創造自由探索的學習環境。\n* 遊戲化學習： 通過桌遊、數學遊戲等方式，讓學習變得有趣且富有探索性。\n* 問題導向學習： 善於從學習者的困惑與問題出發，引導深度學習與批判性思考。\n\n教學地點與未來計劃\n\n* 於 2023 年 6 月回到台中定居，目前積極籌備與推動一所「好好對待人」的學校。\n* 希望結合數理科學與民主教育的理念，營造更多元的學習模式，幫助學生從中探索世界與自我。\n* 正在執行的計畫：[**<u>教育合作合作家庭計劃 </u>**](https://docs.google.com/document/d/1cf_GdFTtxWT7XpJYzem8196x32z9uPPE8awFCpZjMZ8/edit)\n\n更多資訊歡迎參考 <u>粉絲專頁：</u>[<u>鳥巢老師的無權威教室</u>](https://www.facebook.com/profile.php?id=100063695272307)	{}	{}	{}	{}	t	2025-01-30 17:08:48.597889	2025-01-30 17:08:48.597889
100	101	\N	\N	{}	{}	{}	{}	t	2025-01-30 17:08:48.606649	2025-01-30 17:08:48.606649
101	102	\N	\N	{}	{}	{}	{}	t	2025-01-30 17:08:48.610294	2025-01-30 17:08:48.610294
102	103	\N	\N	{}	{}	{}	{}	t	2025-01-30 17:08:48.6128	2025-01-30 17:08:48.6128
103	104	\N	07'｜TW｜UK\nchin&eng	{}	{}	{}	{}	t	2025-01-30 17:08:48.615461	2025-01-30 17:08:48.615461
104	105	\N	嗨，我是季兒，是位剛從體制內切換到體制外的17歲高中生。\n原本日常興趣主要是關注社會議題，並探究其議題裡的內容，\n我是個對於事情的表面或現象會好奇，並想更加深瞭解"如何形成"的人。\n(通常學習動機也是來自這原因)\n這讓我知道的東西還算豐富，但就是不太精。\n\n近期因為政治和太關注外界(新聞、社會議題)心太動盪，\n所以我最近比較常在音樂創作、藝術、攝影這部分領域努力，\n也是因為剛自學，才有這樣的時間可以用在這些領域上。\n\n最近也打算多讀點書，有足夠的知識在議題上努力，才會有用。	{}	{}	{}	{}	t	2025-01-30 17:08:48.618848	2025-01-30 17:08:48.618848
105	106	\N	\N	{}	{}	{}	{}	t	2025-01-30 17:08:48.623472	2025-01-30 17:08:48.623472
106	107	\N	\N	{}	{}	{}	{}	t	2025-01-30 17:08:48.627004	2025-01-30 17:08:48.627004
107	108	\N	\N	{}	{}	{}	{}	t	2025-01-30 17:08:48.630527	2025-01-30 17:08:48.630527
108	109	\N	劇場、覺察幫我開了天眼&#x20;\n靜靜的、細細的、清晰的&#x20;\n發現無數美好&#x20;\n並用身體相信\n\n* **信仰**　：劇場、非暴力溝通、接觸即興、黑人音樂、教育\n* **正在學**：劇場、接觸即興\n* **有興趣**：社會學、性別、文學、創作、職涯、社群、生產力工具、設計	{}	{}	{}	{}	t	2025-01-30 17:08:48.634022	2025-01-30 17:08:48.634022
109	110	\N	我是Henry，現在於美國西北大學就讀學習科學系(Learning Sciences)大三。\n\n我從高中開始投入校內外營隊辦理、團隊培訓、學生權利發聲、家教、升學輔導，覺得和學生一起共創學習體驗是我的成就感來源。\n\n目前持續摸索，如何將學術產出的理論，融合進以學生為本的學習體驗之中，設計出符合學習需求的產品。\n\n最近想要:\n學習... 量化數據分析技巧、學習體驗設計(Learning experience design)\n探索... 我對於哪個教育主題較有興趣，正在涉略的有: 團隊合作及溝通的訓練、遊戲化和動機培養\n\n我喜歡交流討論學習是如何發生的，喜歡教育新創的環境，也正在探索學術研究，以決定未來是否攻讀博士。	{}	{}	{}	{}	t	2025-01-30 17:08:48.637993	2025-01-30 17:08:48.637993
110	111	\N	\N	{}	{}	{}	{}	t	2025-01-30 17:08:48.643492	2025-01-30 17:08:48.643492
111	112	\N	\N	{}	{}	{}	{}	t	2025-01-30 17:08:48.64749	2025-01-30 17:08:48.64749
112	113	\N	想一起拍微電影	{}	{}	{}	{}	t	2025-01-30 17:08:48.650723	2025-01-30 17:08:48.650723
113	114	\N	待補	{}	{}	{}	{}	t	2025-01-30 17:08:48.654337	2025-01-30 17:08:48.654337
114	115	\N	\N	{}	{}	{}	{}	t	2025-01-30 17:08:48.657494	2025-01-30 17:08:48.657494
115	116	\N	一位喜愛思考的人，觀注各種議題，透過自學重新學習如何學習，並重新認識自己。	{}	{}	{}	{}	t	2025-01-30 17:08:48.660567	2025-01-30 17:08:48.660567
116	117	\N	哈嘍！我是目前大三的學生	{}	{}	{}	{}	t	2025-01-30 17:08:48.666628	2025-01-30 17:08:48.666628
117	118	\N	 	{}	{}	{}	{}	t	2025-01-30 17:08:48.672346	2025-01-30 17:08:48.672346
118	119	\N	  	{}	{}	{}	{}	t	2025-01-30 17:08:48.67677	2025-01-30 17:08:48.67677
119	120	\N	\N	{}	{}	{}	{}	t	2025-01-30 17:08:48.681952	2025-01-30 17:08:48.681952
120	121	\N	\N	{}	{}	{}	{}	t	2025-01-30 17:08:48.6867	2025-01-30 17:08:48.6867
121	122	\N	我是自學生，大家可以來和我交流，在學習程式	{}	{}	{}	{}	t	2025-01-30 17:08:48.690064	2025-01-30 17:08:48.690064
122	123	\N	哈囉！我是喜歡吃卡拉雞腿堡的卡拉！\n平常很害羞，喜歡躲在床上冬眠跟潛伏在劇場和串流平台觀賞戲劇作品。\n希望可以透過這個平台探索平常沒有勇氣（或純粹懶惰）去做但有興趣投入嘗試的學習活動。	{}	{}	{}	{}	t	2025-01-30 17:08:48.699076	2025-01-30 17:08:48.699076
123	124	\N	\N	{}	{}	{}	{}	t	2025-01-30 17:08:48.713427	2025-01-30 17:08:48.713427
124	125	\N	\N	{}	{}	{}	{}	t	2025-01-30 17:08:48.718561	2025-01-30 17:08:48.718561
125	126	\N	我是來自臺北市數位實驗高中的Joey，我平常關注社會議題，喜歡透過科技工具解決問題！	{}	{}	{}	{}	t	2025-01-30 17:08:48.723988	2025-01-30 17:08:48.723988
126	127	\N	想學習產品設計相關知識	{}	{}	{}	{}	t	2025-01-30 17:08:48.746921	2025-01-30 17:08:48.746921
127	128	\N	\N	{}	{}	{}	{}	t	2025-01-30 17:08:48.752056	2025-01-30 17:08:48.752056
128	129	\N	是一個喜歡嘗試、享受突破自己的高二生～	{}	{}	{}	{}	t	2025-01-30 17:08:48.757253	2025-01-30 17:08:48.757253
129	130	\N	喜歡畫畫的一名人類	{}	{}	{}	{}	t	2025-01-30 17:08:48.763997	2025-01-30 17:08:48.763997
130	131	\N	\N	{}	{}	{}	{}	t	2025-01-30 17:08:48.769243	2025-01-30 17:08:48.769243
131	132	\N	哈囉，大家好，我是智謙，可以跟我一起交流程式設計，是展賦教育的學生，在展賦當程式設計社的社長	{}	{}	{}	{}	t	2025-01-30 17:08:48.773111	2025-01-30 17:08:48.773111
132	133	\N	嗨，我是耘嘉，暱稱是水果乾。是高三自學生，還因為去年特選沒上可能會延長高中生保鮮期限（？）\n\n生活的被動技能是觀察周遭的環境和人際互動，喜歡跟人聊天交流，歡迎拍打	{}	{}	{}	{}	t	2025-01-30 17:08:48.778485	2025-01-30 17:08:48.778485
133	134	\N	哈囉你好！我是來自TH159星球的冒險家，不小心降落在地球上，不知道我們會有什麼故事呢？！	{}	{}	{}	{}	t	2025-01-30 17:08:48.782788	2025-01-30 17:08:48.782788
134	135	\N	希望可以與大家一同交流，不管在教學上、生活上，一起共學。	{}	{}	{}	{}	t	2025-01-30 17:08:48.788371	2025-01-30 17:08:48.788371
135	136	\N	我是個愛旅遊,喜歡背著相機到處攝影的馬祖青年，長期在教育上深耕，喜歡服務、最大願望是能在孩子身邊當一個保有初衷的大人！	{}	{}	{}	{}	t	2025-01-30 17:08:48.792793	2025-01-30 17:08:48.792793
136	137	\N	目前正在一間智慧醫療新創公司擔任海外業務，深知自己的各種不足，因此在同事的推薦下跑來島島學習！希望能堅持下去 (ง๑ •̀_•́)ง	{}	{}	{}	{}	t	2025-01-30 17:08:48.79719	2025-01-30 17:08:48.79719
137	138	\N	目前就讀中央大學財金系二年級\n\n平常喜歡看書、電影、籃球和聽音樂\n\n正在進行寫作的自主學習計畫\n\n有興趣參加商業競賽活動，有缺人可以找我～	{}	{}	{}	{}	t	2025-01-30 17:08:48.801761	2025-01-30 17:08:48.801761
138	139	\N	大家好，我是小熊，來自台中。\n我是前端工程師，擅長製作網站與app。\n我喜歡打鼓、毛線編織、跑步、打羽球、閱讀、聽音樂。\n很開心來到這裡認識大家，一起交流學習。	{}	{}	{}	{}	t	2025-01-30 17:08:48.806328	2025-01-30 17:08:48.806328
139	140	\N	我是綮萱！我是一個蠻慢熟的人，一開始可能看我比較不敢出聲或是內向不講話覺得不好意思，但是熟悉之後，會漸漸開放和活潑起來！\n\n想來這希望可以和大家互相學習交流分享，因為自己的視野還不夠大，對於自己想發展的還不夠全面的了解，所以想要從馬拉松計畫獲得相關資源，以及學習交流互動，讓自己看到或得到更多事物。	{}	{}	{}	{}	t	2025-01-30 17:08:48.810729	2025-01-30 17:08:48.810729
140	141	\N	黃若寧，Bonnie，也可以叫我酪梨、酪梨喵\n\n目前是高中生的循環經濟公關組長、文案組員，台灣財經素養教育推廣協會第二屆的校園大使，e-Peer第四屆校園大使，雛翼服務團的公關。\n\n喜歡唱歌、與他人交流，更喜歡往大自然跑，登山、潛水都是愛好之一。	{}	{}	{}	{}	t	2025-01-30 17:08:48.816128	2025-01-30 17:08:48.816128
141	142	\N	對生物學有興趣的高中生，希望透過此網站來精進自己對於此學科方面的知識	{}	{}	{}	{}	t	2025-01-30 17:08:48.820708	2025-01-30 17:08:48.820708
142	143	\N	遙遠的高中牲	{}	{}	{}	{}	t	2025-01-30 17:08:48.825224	2025-01-30 17:08:48.825224
143	144	\N	我是一心書苑蒙特梭利實驗教育團體的主持人，我想尋找願意陪伴孩子成長的夥伴。	{}	{}	{}	{}	t	2025-01-30 17:08:48.828741	2025-01-30 17:08:48.828741
144	145	\N	民安國小老師\n教過\n生活科技\n台語\n現在在教\n社會科學	{}	{}	{}	{}	t	2025-01-30 17:08:48.832485	2025-01-30 17:08:48.832485
145	146	\N	hi	{}	{}	{}	{}	t	2025-01-30 17:08:48.836421	2025-01-30 17:08:48.836421
146	147	\N	顧婕，\n2000年出生，現居新北。\n熱衷教育、社會創新、藝術文化、導覽、語言學習。\n具有豐富導覽經驗，2022、2023、2024均獲選為【台灣當代實驗場】年度大展之導覽員。\n熱愛外語學習，英語多益測驗910分、德語歌德檢定B1通過。	{}	{}	{}	{}	t	2025-01-30 17:08:48.84031	2025-01-30 17:08:48.84031
147	148	\N	\N	{}	{}	{}	{}	t	2025-01-30 17:08:48.844748	2025-01-30 17:08:48.844748
148	149	\N	\N	{}	{}	{}	{}	t	2025-01-30 17:08:48.850902	2025-01-30 17:08:48.850902
149	150	\N	哈嘍大家好我是Emily,對生活有點敏感卻又有時神經很大條，我喜歡文字、藝術等等美的事物，碰到企劃事情時也會覺得雀躍	{}	{}	{}	{}	t	2025-01-30 17:08:48.8538	2025-01-30 17:08:48.8538
150	151	\N	各位大家好，我是吳宥芝，也可以叫我無名小子，我目前就讀於屏東大學社會發展學系大三\n\n個性上來說，雖然比較內向慢熟，不過一旦混熟以後就會發現我私下搞怪的一面，因為我很喜歡跟朋友們分享我腦海中天馬行空又很無里頭的想法，對我來說，分享這些與眾不同的想法讓我體會到許多樂趣\n\n喜歡的興趣是打球、健身、閱讀、看電影、聽饒舌樂、講幹話\n\n平時有空會多關注時事議題，但希望除了關注之外能有機會付出行動做點改變，歡迎任何對社會科學領域有興趣的朋友來跟我互相交流想法	{}	{}	{}	{}	t	2025-01-30 17:08:48.857683	2025-01-30 17:08:48.857683
\.


--
-- Data for Name: user_project; Type: TABLE DATA; Schema: public; Owner: daodao
--

COPY public.user_project (id, user_external_id, project_id) FROM stdin;
1	b7068451-d750-4e3c-ab50-fa0d3e623be4	1
2	37bccfd5-c8f4-46c3-b846-9f780317dbe3	2
3	320cc0b3-d003-4865-b02a-c6c33b2ae277	3
4	73ff25f8-e094-4a4a-aced-fc378c02a9ef	4
5	4a23b23b-dccc-4604-bf48-e295098c8cc4	5
6	7aed85a8-a8bf-446a-935e-0f3a548ddee2	6
7	f54dd8c0-6297-45d9-9c59-05544161d09d	7
8	6392c8b4-71ce-424a-b990-059c3d8d2a94	8
9	9bbc6ef8-331b-4428-9904-b5b1921f9c7b	9
10	e34f953f-392e-4033-ab47-02a26860e47f	10
11	745fada8-0d50-4338-902e-711e878523ef	11
12	06441b15-e8db-407b-8928-dfc3251bfe37	12
13	acad640e-b3d7-48fc-9f01-f6fd9463184c	13
14	1046aa68-daf9-45c9-ba27-66e703e59d29	14
15	0c043b64-da22-44ab-bf0f-0f059d3209a8	15
16	bac7e596-6973-4d9f-9469-a9fff3a93987	16
17	75b1e566-e04d-4d3c-87bc-80a0a25af4a2	17
18	c1dbd7d0-2856-49c1-890b-42efbb25f0a3	18
19	85360ec1-6f90-41fd-8a2a-786e671dbab3	19
20	17dd0dc7-c29f-4535-ac3a-fcdc5bbae77f	20
21	1ba1b347-f8b4-476f-9ba5-d7a71f3a89dd	21
22	95af8b8c-a78e-4adf-99a8-bc7485df5539	22
\.


--
-- Data for Name: user_subscription; Type: TABLE DATA; Schema: public; Owner: daodao
--

COPY public.user_subscription (id, user_id, plan_id, status, start_date, end_date, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: daodao
--

COPY public.users (id, external_id, mongo_id, gender, language, education_stage, tag_list, contact_id, is_open_location, location_id, nickname, role_id, is_open_profile, birth_date, basic_info_id, "createdDate", "updatedDate", created_by, created_at, updated_by, updated_at) FROM stdin;
1	5564cc59-78a6-483a-973e-f0ec3f26c3c5	1	\N	\N	other	\N	\N	\N	\N	SuperAdmin	6	\N	\N	\N	\N	\N	\N	\N	\N	\N
2	ef7a58e5-b39f-4cc1-980b-d77eb0e02648	669d9f36850bab2ba053a3ec	other	\N	university	{自主學習,網頁開發,攀岩,衝浪}	1	t	1	小許	2	t	2006-10-31	1	2024-07-21 23:52:22+00	2025-01-24 14:39:43+00	airflow	2025-01-30 17:08:48.084594+00	airflow	2025-01-30 17:08:48.084599+00
3	fca6ce3b-eebe-4b34-81e8-59bb3f60758e	669dc308850bab2ba053a527	female	\N	other	{}	2	t	2	Enn Tang	2	t	1992-02-19	2	2024-07-22 02:25:12+00	2024-07-24 12:14:12+00	airflow	2025-01-30 17:08:48.095368+00	airflow	2025-01-30 17:08:48.095373+00
4	ac1c372a-89c8-4121-9742-aae357079995	669dc382850bab2ba053a538	other	\N	other	{音樂創作}	3	t	3	Ali Baba	2	t	1900-01-01	3	2024-07-22 02:27:14+00	2024-11-17 05:16:18+00	airflow	2025-01-30 17:08:48.098719+00	airflow	2025-01-30 17:08:48.098721+00
5	582df178-0742-4ce4-997c-02fefd7144cb	669dc681850bab2ba053a595	female	\N	other	{}	4	f	4	YIEN	2	f	1992-12-31	4	2024-07-22 02:40:01+00	2024-07-22 02:56:52+00	airflow	2025-01-30 17:08:48.195146+00	airflow	2025-01-30 17:08:48.19515+00
6	40edb0be-13f1-4fde-8215-e0ffdda2f01e	669de648256188da6f9c4e30	female	\N	high	{學習體驗設計,引導}	5	f	5	Peggy Hsieh	2	t	2006-10-02	5	2024-07-22 04:55:36+00	2024-12-27 06:38:43+00	airflow	2025-01-30 17:08:48.199366+00	airflow	2025-01-30 17:08:48.19937+00
7	995da55f-b4c3-47d7-9baf-a392ce4f1766	669e01a1256188da6f9c4e9c	male	\N	high	{}	6	t	6	呂顥天Hao-Tian Lu	2	t	2008-01-10	6	2024-07-22 06:52:17+00	2024-07-24 16:04:04+00	airflow	2025-01-30 17:08:48.202688+00	airflow	2025-01-30 17:08:48.20269+00
8	9bbc6ef8-331b-4428-9904-b5b1921f9c7b	669e0d96256188da6f9c4ec9	female	\N	university	{自主學習,數位公民教育,民主教育}	7	t	7	林怡廷	2	t	1992-07-26	7	2024-07-22 07:43:18+00	2025-01-17 03:02:53+00	airflow	2025-01-30 17:08:48.205521+00	airflow	2025-01-30 17:08:48.205522+00
9	69309c6c-4c2b-4bc8-b167-b8fe71dafb98	669e6aa71c00fab9a9f88a00	male	\N	other	{網頁前端,烹飪烘焙,徒手運動}	8	f	8	阿毛	2	t	1994-12-26	8	2024-07-22 14:20:23+00	2025-01-18 15:01:35+00	airflow	2025-01-30 17:08:48.208729+00	airflow	2025-01-30 17:08:48.208731+00
10	4d2cd1ff-945a-4d59-942b-7492e19c7f66	669e741631ef0f8d6e6c64d6	female	\N	university	{程式語言,棒球,游泳}	9	f	9	IFang Hsu	2	f	2006-10-26	9	2024-07-22 15:00:38+00	2024-11-08 08:14:03+00	airflow	2025-01-30 17:08:48.211326+00	airflow	2025-01-30 17:08:48.211328+00
11	80dbe2ff-6bcc-490b-b77b-993f9cf47fe6	669e871331ef0f8d6e6c65cc	other	\N	other	{}	10	f	10	Evonne Hsu	2	f	\N	10	2024-07-22 16:21:39+00	2024-07-25 11:11:12+00	airflow	2025-01-30 17:08:48.213645+00	airflow	2025-01-30 17:08:48.213647+00
12	ee681e50-dc0c-48fc-9eda-4ee9c8725d6a	669e8d2231ef0f8d6e6c65d9	other	\N	other	{}	11	f	11	I-Fang Hsu	2	f	\N	11	2024-07-22 16:47:30+00	2024-07-22 16:47:30+00	airflow	2025-01-30 17:08:48.215733+00	airflow	2025-01-30 17:08:48.215735+00
13	e5d2f8db-7803-4b94-9306-6904eeab363b	66a0ec34d120a90509710769	other	\N	other	{}	12	f	12	林蔚然	2	f	\N	12	2024-07-24 11:57:40+00	2024-07-24 11:57:40+00	airflow	2025-01-30 17:08:48.218249+00	airflow	2025-01-30 17:08:48.21825+00
14	09948f69-1fb0-4e17-ba1f-0e638f8b9111	66a10875d120a905097107b6	other	\N	other	{}	13	f	13	yanjoy liao	2	f	\N	13	2024-07-24 13:58:13+00	2024-07-24 13:58:13+00	airflow	2025-01-30 17:08:48.22022+00	airflow	2025-01-30 17:08:48.220222+00
15	557b6d02-1a86-4397-9775-bcd9e39de3c1	66a19743d120a905097108d9	other	\N	other	{}	14	f	14	Ya	2	f	\N	14	2024-07-25 00:07:31+00	2024-07-25 00:09:04+00	airflow	2025-01-30 17:08:48.222402+00	airflow	2025-01-30 17:08:48.222403+00
16	4290550a-d29f-481d-8bee-50d7ba7ed4b1	66a203d2d120a9050971096a	female	\N	university	{前端,程式語言,編織,社會議題,咖啡}	15	t	15	Pei	2	t	1995-11-12	15	2024-07-25 07:50:42+00	2024-07-25 08:03:28+00	airflow	2025-01-30 17:08:48.22489+00	airflow	2025-01-30 17:08:48.224892+00
17	a9ea0217-1b66-4e03-9151-1a51281e575f	66a21223d120a905097109b5	female	\N	other	{}	16	f	16	Jami	2	f	\N	16	2024-07-25 08:51:47+00	2024-07-25 09:18:34+00	airflow	2025-01-30 17:08:48.227551+00	airflow	2025-01-30 17:08:48.227552+00
18	925b564c-cce8-4eae-ae29-7f6778a63688	66a22c64d120a90509710a05	other	\N	other	{}	17	f	17	sunshine Lee	2	f	\N	17	2024-07-25 10:43:48+00	2024-07-25 10:43:48+00	airflow	2025-01-30 17:08:48.229727+00	airflow	2025-01-30 17:08:48.229728+00
19	763a0187-ce49-4b77-9e00-a51e8ed51430	66a50691d120a90509710ae9	female	\N	high	{}	18	f	18	Ravin Lin	2	t	2007-04-20	18	2024-07-27 14:39:13+00	2024-07-27 14:42:57+00	airflow	2025-01-30 17:08:48.232771+00	airflow	2025-01-30 17:08:48.232774+00
20	1bd9ae7a-7378-4869-9f74-7b29575cb799	66a5904bd120a90509710c4d	other	\N	other	{保持低調}	19	t	19	小安	2	t	1999-07-23	19	2024-07-28 00:26:51+00	2024-12-23 00:36:42+00	airflow	2025-01-30 17:08:48.24604+00	airflow	2025-01-30 17:08:48.246047+00
21	196847e4-6296-47e3-ad4b-465cd7901f28	66a735ced120a90509710ea8	other	\N	other	{}	20	f	20	Enya Yang	2	f	\N	20	2024-07-29 06:25:18+00	2024-07-29 06:25:18+00	airflow	2025-01-30 17:08:48.251938+00	airflow	2025-01-30 17:08:48.251942+00
22	75facaf1-42e3-414e-8563-5f4ec65b31de	66a7d170d120a90509710f02	female	\N	university	{}	21	f	21	鉛筆	2	t	1983-11-09	21	2024-07-29 17:29:20+00	2024-07-29 18:01:30+00	airflow	2025-01-30 17:08:48.262613+00	airflow	2025-01-30 17:08:48.262619+00
23	8ff26266-2d83-4a0b-8fc4-cacf56989687	66a8aef6d120a90509710fd2	female	\N	other	{}	22	f	22	松鼠尾巴的兔子 Ada	2	t	1990-06-09	22	2024-07-30 09:14:30+00	2024-09-13 08:28:17+00	airflow	2025-01-30 17:08:48.271179+00	airflow	2025-01-30 17:08:48.271186+00
24	263b7e26-884b-4062-856f-032a4cd40ff6	66a9a96bd120a905097110a1	female	\N	other	{茶,自我成長,終身學習}	23	t	23	玄羋	2	t	1990-03-14	23	2024-07-31 03:03:07+00	2024-07-31 03:06:33+00	airflow	2025-01-30 17:08:48.280369+00	airflow	2025-01-30 17:08:48.280377+00
25	5e2b315e-182e-40bd-a285-56d98d84bbde	66aa2582d120a90509711176	male	\N	university	{社會議題,助人工作,心理學,社會創新,教育}	24	t	24	蘇冠彰／袋鼠	2	t	2003-01-26	24	2024-07-31 11:52:34+00	2025-01-08 13:47:05+00	airflow	2025-01-30 17:08:48.288685+00	airflow	2025-01-30 17:08:48.28869+00
26	d5db7990-3b1e-43ec-bc7f-24446676c11b	66b040cad120a905097115a9	female	\N	university	{}	25	f	25	漢堡hamburger	2	t	2005-07-01	25	2024-08-05 03:02:34+00	2024-08-05 03:09:59+00	airflow	2025-01-30 17:08:48.295779+00	airflow	2025-01-30 17:08:48.295785+00
27	65536d50-d2ae-4429-a39e-f88ed9df79fc	66b4c9784842eee50798665a	female	\N	university	{}	26	t	26	Yun Tseng	2	t	2000-03-06	26	2024-08-08 13:34:48+00	2024-08-08 13:45:25+00	airflow	2025-01-30 17:08:48.302769+00	airflow	2025-01-30 17:08:48.302776+00
28	f3f3dd99-4776-48ad-a8a7-2cf680ef2015	66ba06e44842eee50798678b	female	\N	other	{}	27	t	27	陳怡臻	2	t	2000-03-09	27	2024-08-12 12:58:12+00	2024-08-12 12:58:50+00	airflow	2025-01-30 17:08:48.307062+00	airflow	2025-01-30 17:08:48.307066+00
29	d5fea0a0-15f1-4f18-b5a9-493def1e4745	66bc7e444842eee507986831	male	\N	university	{}	28	t	28	張豪君	2	t	2001-01-05	28	2024-08-14 09:52:04+00	2024-09-14 03:16:16+00	airflow	2025-01-30 17:08:48.316491+00	airflow	2025-01-30 17:08:48.316496+00
30	a8ea4b5b-d607-4809-b41f-2e8f5f493d10	66bc7e624842eee507986836	male	\N	university	{}	29	t	29	張豪君	2	t	2001-01-05	29	2024-08-14 09:52:34+00	2024-08-14 10:03:25+00	airflow	2025-01-30 17:08:48.321573+00	airflow	2025-01-30 17:08:48.321578+00
31	912554c8-18db-4e0d-93c4-1e41fad1c5eb	66bdd3ec4842eee507986882	other	\N	high	{}	30	t	30	貓草皮	2	t	2007-10-13	30	2024-08-15 10:09:48+00	2024-08-15 10:22:35+00	airflow	2025-01-30 17:08:48.325697+00	airflow	2025-01-30 17:08:48.325702+00
32	65f82a6d-3bc7-4301-8b31-8928a9ac09ab	66cc35edf8d58801f0e11b9a	female	\N	other	{}	31	t	31	Chao-Ling Chyou	2	t	1995-07-18	31	2024-08-26 07:59:41+00	2024-08-26 08:00:46+00	airflow	2025-01-30 17:08:48.330322+00	airflow	2025-01-30 17:08:48.330326+00
33	ceff2f73-6719-4885-80e1-98695a2eeab5	66cc3e28f8d58801f0e11bab	female	\N	other	{}	32	t	32	Chao-Ling Chyou	2	t	1995-07-18	32	2024-08-26 08:34:48+00	2024-08-26 08:37:01+00	airflow	2025-01-30 17:08:48.334499+00	airflow	2025-01-30 17:08:48.334503+00
34	1b7e88b0-564a-4ec0-b818-653f38c6eb50	66cc9ef2f8d58801f0e11bf7	female	\N	other	{產品開發,產品知識}	33	t	33	Landy	2	t	1991-04-12	33	2024-08-26 15:27:46+00	2024-11-20 10:06:32+00	airflow	2025-01-30 17:08:48.339342+00	airflow	2025-01-30 17:08:48.339348+00
35	f732caa5-8eb1-4e06-8d99-29301faba6b7	66d93d1cf8d58801f0e11e6f	female	\N	other	{程式語言}	34	f	34	喬宇	2	f	1995-11-30	34	2024-09-05 05:09:48+00	2025-01-02 06:04:48+00	airflow	2025-01-30 17:08:48.345444+00	airflow	2025-01-30 17:08:48.34545+00
36	3ee5b88e-786e-45d4-a81f-a5966525e4d5	66e1868df8d58801f0e1214d	female	\N	other	{}	35	f	35	Nien	2	f	1991-04-11	35	2024-09-11 12:01:17+00	2024-09-14 15:18:53+00	airflow	2025-01-30 17:08:48.350214+00	airflow	2025-01-30 17:08:48.350219+00
37	8798da9c-ca1d-4f24-a0a5-bdade20094b0	66e29b08f8d58801f0e12510	female	\N	other	{}	36	t	36	Yi-shan Wu	2	t	1997-02-08	36	2024-09-12 07:40:56+00	2024-09-12 07:42:00+00	airflow	2025-01-30 17:08:48.35372+00	airflow	2025-01-30 17:08:48.353724+00
38	0b13ed3e-41e8-4636-a4f7-84c6b1038bed	66e4f383f8d58801f0e127a5	other	\N	other	{}	37	t	37	張豪君	2	t	\N	37	2024-09-14 02:22:59+00	2024-09-14 02:22:59+00	airflow	2025-01-30 17:08:48.356839+00	airflow	2025-01-30 17:08:48.356842+00
39	24cda898-caaa-40ee-bdb2-d40d7dd03d7c	66e5b416f8d58801f0e12972	male	\N	university	{職涯發展,學習歷程,自主學習,實驗教育,學習議題探討,程式語言,資料科學,大數據和AI}	38	t	38	Dex Lu	2	t	1990-10-19	38	2024-09-14 16:04:38+00	2024-11-20 12:26:49+00	airflow	2025-01-30 17:08:48.36019+00	airflow	2025-01-30 17:08:48.360194+00
40	7380faa5-787e-4378-9c0e-6e06c0bb9aa1	66e6dbbaf8d58801f0e12b07	male	\N	other	{}	39	t	39	林暐秦（Tomas）	2	t	1982-07-09	39	2024-09-15 13:06:02+00	2024-09-15 13:06:42+00	airflow	2025-01-30 17:08:48.36358+00	airflow	2025-01-30 17:08:48.363583+00
41	5e63033e-61a6-4f8b-bc99-b436896d5f31	66e928a0f8d58801f0e12da9	female	\N	university	{生物}	40	f	40	Chao-Ling Chyou	2	t	1917-09-17	40	2024-09-17 06:58:40+00	2024-11-23 03:31:43+00	airflow	2025-01-30 17:08:48.367635+00	airflow	2025-01-30 17:08:48.367639+00
42	05a163c0-b058-4677-a74f-67aee0c49dbf	66e99f02f8d58801f0e12e8d	female	\N	other	{}	41	t	41	Xuan Huang	2	t	1992-05-01	41	2024-09-17 15:23:46+00	2024-09-17 15:24:46+00	airflow	2025-01-30 17:08:48.371025+00	airflow	2025-01-30 17:08:48.371029+00
43	7e07f254-d1a3-47cb-9782-f4fbd82be499	66ec0c59f8d58801f0e12f5e	other	\N	other	{}	42	t	42	Peggy Hsieh	2	t	\N	42	2024-09-19 11:34:49+00	2024-09-19 11:34:49+00	airflow	2025-01-30 17:08:48.373888+00	airflow	2025-01-30 17:08:48.373891+00
44	e58ce675-ef47-4bbe-8810-787d44a92e7c	66ef71c6f8d58801f0e1307f	female	\N	high	{}	43	t	43	邱淑君	2	t	1972-09-08	43	2024-09-22 01:24:22+00	2024-09-22 01:27:55+00	airflow	2025-01-30 17:08:48.378398+00	airflow	2025-01-30 17:08:48.378404+00
45	95255daf-6366-44cc-9b3e-fe2d52dae97d	66f157a0f8d58801f0e13234	female	\N	university	{}	44	f	44	許芃芃	2	f	2003-07-24	44	2024-09-23 11:57:20+00	2024-09-23 11:58:29+00	airflow	2025-01-30 17:08:48.38282+00	airflow	2025-01-30 17:08:48.382824+00
46	4e72bb61-1c8a-4c3c-a354-8d687a3c1965	66f38459f8d58801f0e13451	female	\N	other	{}	45	t	45	Pearl Yang	2	t	1998-07-20	45	2024-09-25 03:32:41+00	2024-09-25 03:49:33+00	airflow	2025-01-30 17:08:48.386981+00	airflow	2025-01-30 17:08:48.386986+00
47	6ac2b4c2-36c4-44ae-9984-e4a6213d738b	66f41859f8d58801f0e1353e	male	\N	other	{}	46	t	46	葛修承	2	t	2024-09-25	46	2024-09-25 14:04:09+00	2024-09-29 12:00:07+00	airflow	2025-01-30 17:08:48.389798+00	airflow	2025-01-30 17:08:48.389802+00
48	7199697e-b39b-4fb0-b14b-48f58a06fb31	66f42407f8d58801f0e13581	female	\N	university	{網頁設計,使用者體驗設計,使用者介面設計}	47	f	47	Eira Tseng	2	t	1997-10-23	47	2024-09-25 14:53:59+00	2024-12-29 14:51:30+00	airflow	2025-01-30 17:08:48.393191+00	airflow	2025-01-30 17:08:48.393195+00
49	c6e0932f-1e60-40ac-b059-4c7e40179701	66f68c37a27d6db598ef3dcd	female	\N	high	{}	48	t	48	HSUAN HENG	2	t	2009-07-28	48	2024-09-27 10:43:03+00	2024-09-27 10:46:06+00	airflow	2025-01-30 17:08:48.396833+00	airflow	2025-01-30 17:08:48.396835+00
50	d2e7b710-082d-4f89-9377-090d528682be	66f9481da27d6db598ef42b7	male	\N	high	{}	49	f	49	陳威達（冰川）	2	t	2007-01-22	49	2024-09-29 12:29:17+00	2024-09-29 12:30:57+00	airflow	2025-01-30 17:08:48.400647+00	airflow	2025-01-30 17:08:48.400652+00
51	79670f1a-740a-4524-a6a6-55c6af864f1e	66f948e4a27d6db598ef42dd	male	\N	other	{教育AI應用,塗鴉筆記,學習體驗設計,AI圖文創作,自主學習,教育創新,差異化教學,個人化學習,教學方法,教師培力}	50	f	50	莊哲銘（樂尼）	2	t	1987-10-10	50	2024-09-29 12:32:36+00	2024-10-02 09:29:27+00	airflow	2025-01-30 17:08:48.4042+00	airflow	2025-01-30 17:08:48.404204+00
52	a6e26406-57cb-435b-838a-6df169c269e7	66f94a11a27d6db598ef42f7	female	\N	other	{自我對話,課後共學,刺繡,火漆章,手作}	51	f	51	周子晴（晴天）	2	t	1999-07-22	51	2024-09-29 12:37:37+00	2024-09-29 13:38:27+00	airflow	2025-01-30 17:08:48.407416+00	airflow	2025-01-30 17:08:48.407419+00
53	fc2fbfbb-83f8-451e-b3ed-79baacdb2d99	66f94b5fa27d6db598ef4310	male	\N	other	{}	52	t	52	Ken Li	2	t	1981-09-29	52	2024-09-29 12:43:11+00	2024-09-29 12:44:18+00	airflow	2025-01-30 17:08:48.411357+00	airflow	2025-01-30 17:08:48.411361+00
54	260c7f1a-5e00-435c-bbcb-65815ea399e1	66fbaf90a27d6db598ef456f	female	\N	other	{}	53	t	53	林怡萱	2	t	2024-10-01	53	2024-10-01 08:15:12+00	2024-10-01 08:15:26+00	airflow	2025-01-30 17:08:48.414799+00	airflow	2025-01-30 17:08:48.414803+00
55	01dcbce2-4a64-46e9-bfec-66191d9e4989	6704be4ea27d6db598ef4d41	other	\N	other	{}	54	t	54	Cheen UNZZI	2	t	\N	54	2024-10-08 05:08:30+00	2024-10-08 05:08:30+00	airflow	2025-01-30 17:08:48.417823+00	airflow	2025-01-30 17:08:48.417826+00
56	baa8e292-6ae3-4e56-9e13-d205a019cd1e	67070f1ba27d6db598ef4ea9	male	\N	other	{}	55	t	55	葛修承 Ivan	2	t	2024-10-09	55	2024-10-09 23:17:47+00	2024-10-09 23:17:58+00	airflow	2025-01-30 17:08:48.420866+00	airflow	2025-01-30 17:08:48.42087+00
57	80c1a339-bf02-45b8-a25c-b7358a9a5183	67077bf0a27d6db598ef4ec2	other	\N	other	{}	56	t	56	t riot	2	t	1991-10-10	56	2024-10-10 07:02:08+00	2024-10-10 07:02:46+00	airflow	2025-01-30 17:08:48.424894+00	airflow	2025-01-30 17:08:48.424898+00
58	bd46a51d-9b5a-4b5b-8dde-f3666794c1a6	67077c60a27d6db598ef4ecb	other	\N	other	{}	57	t	57	曾宇彤	2	t	\N	57	2024-10-10 07:04:00+00	2024-10-10 07:04:00+00	airflow	2025-01-30 17:08:48.427756+00	airflow	2025-01-30 17:08:48.427759+00
59	c828426e-e8c8-4d8c-931e-803401d4735d	670b7b42a27d6db598ef5144	other	\N	university	{}	58	f	58	庭昀	2	t	1993-11-21	58	2024-10-13 07:48:18+00	2024-10-22 06:06:55+00	airflow	2025-01-30 17:08:48.430486+00	airflow	2025-01-30 17:08:48.430488+00
60	b142c015-6000-45ec-967a-1ec4f57e672c	670f825aa27d6db598ef5280	female	\N	other	{前端開發,日文口說,台語口說,閱讀,自主學習,LGBT+}	59	t	59	Lang	2	t	1986-01-06	59	2024-10-16 09:07:38+00	2024-10-16 09:15:27+00	airflow	2025-01-30 17:08:48.434106+00	airflow	2025-01-30 17:08:48.43411+00
61	adb0041c-4363-4404-b55e-2144a7bf0a2a	671210d4a27d6db598ef5332	male	\N	other	{重量訓練,運動科學,健康科學,運動,健身,教練}	60	t	60	Ying-Chu Chen	2	t	1985-08-21	60	2024-10-18 07:40:04+00	2024-10-18 07:45:48+00	airflow	2025-01-30 17:08:48.437895+00	airflow	2025-01-30 17:08:48.437898+00
62	d2ab473a-1a13-4494-af02-a486ab0e02f7	6714253aa27d6db598ef54c4	male	\N	university	{}	61	t	61	楓葉	2	t	2002-11-15	61	2024-10-19 21:31:38+00	2024-10-19 21:37:39+00	airflow	2025-01-30 17:08:48.440557+00	airflow	2025-01-30 17:08:48.440559+00
63	e3384513-4a1e-474f-8d2f-5de77a609b80	6714ed39a27d6db598ef5599	female	\N	other	{}	62	t	62	李歆淳	2	t	2010-04-13	62	2024-10-20 11:44:57+00	2024-10-20 11:45:47+00	airflow	2025-01-30 17:08:48.443631+00	airflow	2025-01-30 17:08:48.443634+00
64	d90c8bc0-9e97-4a9d-a30b-9c1d381bb1d3	671526c4a27d6db598ef5603	other	\N	other	{}	63	t	63	Lucas劉恩佑	2	t	2024-10-20	63	2024-10-20 15:50:28+00	2024-10-20 15:50:55+00	airflow	2025-01-30 17:08:48.447673+00	airflow	2025-01-30 17:08:48.447676+00
65	485d1747-4658-42da-9106-a2bd48cbb82c	6715e509a27d6db598ef5673	male	\N	other	{}	64	t	64	Kermit Sung	2	t	1995-10-13	64	2024-10-21 05:22:17+00	2024-10-21 05:23:27+00	airflow	2025-01-30 17:08:48.450816+00	airflow	2025-01-30 17:08:48.450819+00
66	92db0ba0-d3e7-433b-9765-3f53206c7293	67175a71a27d6db598ef5827	female	\N	other	{}	65	t	65	梅爾	2	t	1997-12-07	65	2024-10-22 07:55:29+00	2024-10-22 08:01:24+00	airflow	2025-01-30 17:08:48.454482+00	airflow	2025-01-30 17:08:48.454487+00
67	0313073f-b77d-4346-93ab-a1cf1d575247	67188447a27d6db598ef5994	female	\N	university	{}	66	t	66	謝cy	2	t	2005-01-10	66	2024-10-23 05:06:15+00	2024-10-23 05:12:58+00	airflow	2025-01-30 17:08:48.458246+00	airflow	2025-01-30 17:08:48.45825+00
68	e709a7a5-6082-44e5-8730-50778acd8ab2	671b9e9aa27d6db598ef5c05	other	\N	other	{}	67	t	67	Chun-Hao Lien	2	t	1993-02-15	67	2024-10-25 13:35:22+00	2024-10-25 13:37:03+00	airflow	2025-01-30 17:08:48.461171+00	airflow	2025-01-30 17:08:48.461175+00
69	5f9525b3-7a54-414f-a182-5456b5c501dd	671daad6a27d6db598ef5d67	male	\N	high	{}	68	t	68	popoca4	2	t	2006-11-10	68	2024-10-27 02:52:06+00	2024-10-27 02:57:41+00	airflow	2025-01-30 17:08:48.464027+00	airflow	2025-01-30 17:08:48.46403+00
70	2245e5f6-ab13-4b8f-95de-d0cfa4425d2b	671dd24ea27d6db598ef5e5c	male	\N	high	{}	69	f	69	闕鈺昆33	2	t	2007-04-21	69	2024-10-27 05:40:30+00	2024-10-27 05:55:39+00	airflow	2025-01-30 17:08:48.467454+00	airflow	2025-01-30 17:08:48.467459+00
71	d47a5630-8614-4aff-a8fb-01e8129d8265	671dfa06a27d6db598ef5ef7	female	\N	high	{}	70	f	70	林以晴	2	t	2005-10-27	70	2024-10-27 08:29:58+00	2024-10-27 08:34:23+00	airflow	2025-01-30 17:08:48.47063+00	airflow	2025-01-30 17:08:48.470634+00
72	073bc60f-fbb0-4f35-971c-db9bce08528c	671e1a5ea27d6db598ef5fc0	female	\N	university	{畫畫,吉他}	71	f	71	李魚	2	t	2006-10-27	71	2024-10-27 10:47:58+00	2024-10-27 11:05:03+00	airflow	2025-01-30 17:08:48.473993+00	airflow	2025-01-30 17:08:48.473996+00
73	9d104f42-3686-4ea0-bdd1-9546a917b47b	671f54eea27d6db598ef60b9	other	\N	other	{音樂創作,程式語言,電繪,社會議題}	72	t	72	anita	2	t	1900-10-28	72	2024-10-28 09:10:06+00	2024-12-28 14:03:23+00	airflow	2025-01-30 17:08:48.477442+00	airflow	2025-01-30 17:08:48.477446+00
74	46afce9a-33c7-4b24-b7ea-c59d136c1617	671f7a11a27d6db598ef60d5	other	\N	other	{我想知}	73	t	73	vincent xu	2	t	1901-10-28	73	2024-10-28 11:48:33+00	2024-11-11 16:06:44+00	airflow	2025-01-30 17:08:48.480735+00	airflow	2025-01-30 17:08:48.480738+00
75	af4dd4bb-2985-44e7-ab1b-70b3cd90b38b	671f9757a27d6db598ef61b1	male	\N	university	{}	74	t	74	test test	2	f	1995-10-26	74	2024-10-28 13:53:27+00	2024-10-28 14:56:45+00	airflow	2025-01-30 17:08:48.486482+00	airflow	2025-01-30 17:08:48.486487+00
76	f459774d-76dc-4be7-ae0e-d2939534652e	672317f8a27d6db598ef632b	female	\N	other	{}	75	t	75	Chao Len	2	t	2024-10-31	75	2024-10-31 05:39:04+00	2024-10-31 05:39:31+00	airflow	2025-01-30 17:08:48.48929+00	airflow	2025-01-30 17:08:48.489294+00
77	d70a3ee0-dd40-4e4f-8669-ed0894dbb16c	6724aac3a27d6db598ef6372	other	\N	other	{}	76	t	76	Zoe	2	t	2024-11-01	76	2024-11-01 10:17:39+00	2024-11-01 10:17:48+00	airflow	2025-01-30 17:08:48.491954+00	airflow	2025-01-30 17:08:48.49196+00
78	aa57bd13-dced-43d6-92f2-8d3d97f83a27	6726fad2a27d6db598ef643b	female	\N	university	{}	77	t	77	徐若軒	2	t	2006-07-10	77	2024-11-03 04:23:46+00	2024-11-03 04:28:46+00	airflow	2025-01-30 17:08:48.495373+00	airflow	2025-01-30 17:08:48.495378+00
79	f1355414-1282-4bd4-b421-c7e6a6f9bbac	67271349a27d6db598ef64c8	female	\N	university	{}	78	t	78	Esencia	2	t	2004-02-01	78	2024-11-03 06:08:09+00	2024-11-03 16:16:34+00	airflow	2025-01-30 17:08:48.499768+00	airflow	2025-01-30 17:08:48.499773+00
80	814daefe-1ac1-40a0-8328-3e08d5249564	672739a8a27d6db598ef6578	female	\N	university	{}	79	f	79	test zero	2	t	2000-11-03	79	2024-11-03 08:51:52+00	2024-11-03 09:17:57+00	airflow	2025-01-30 17:08:48.504887+00	airflow	2025-01-30 17:08:48.504892+00
81	fc93771e-3039-43a9-89fa-c2f9a5a1435e	6727555fa27d6db598ef65ba	female	\N	university	{法文學習}	80	t	80	R	2	t	2001-10-16	80	2024-11-03 10:50:07+00	2024-11-03 10:58:47+00	airflow	2025-01-30 17:08:48.509016+00	airflow	2025-01-30 17:08:48.509019+00
82	8a18b6e1-0e26-4271-9a70-c2ade3e818af	672b7ea1231270609bef792b	female	\N	university	{測試}	81	t	81	Selina Cheng	2	t	2001-01-31	81	2024-11-06 14:35:13+00	2024-12-21 05:12:56+00	airflow	2025-01-30 17:08:48.512596+00	airflow	2025-01-30 17:08:48.5126+00
83	1d78c439-fcf3-4ef0-921e-40737e2a76b0	6731b77e231270609bef7e61	female	\N	university	{教育創新,民主教育,社會創新}	82	f	82	沈潔伃 Joann Shen	2	t	1996-08-22	82	2024-11-11 07:51:26+00	2025-01-22 13:50:36+00	airflow	2025-01-30 17:08:48.516109+00	airflow	2025-01-30 17:08:48.516113+00
84	8276146a-bc92-4a32-99ff-7040d4894072	6731d643231270609bef7f21	male	\N	university	{網球,單車,爬山,潛水}	83	f	83	林東翰	2	t	1987-09-13	83	2024-11-11 10:02:43+00	2024-11-11 10:03:49+00	airflow	2025-01-30 17:08:48.519038+00	airflow	2025-01-30 17:08:48.51904+00
85	f2dadc37-d118-445d-b023-77e86964ef8d	6731e865231270609bef7ff8	female	\N	high	{繪畫}	84	f	84	林米寶	2	f	2008-07-14	84	2024-11-11 11:20:05+00	2024-11-12 06:59:13+00	airflow	2025-01-30 17:08:48.522378+00	airflow	2025-01-30 17:08:48.522381+00
86	f6792d2d-11ae-402f-ba9f-280a7cbf5499	6731e953231270609bef802b	male	\N	high	{體驗遊戲,喜歡思考}	85	t	85	郭家豐	2	t	2008-01-25	85	2024-11-11 11:24:03+00	2024-11-11 12:16:31+00	airflow	2025-01-30 17:08:48.525469+00	airflow	2025-01-30 17:08:48.525472+00
87	1aa14e22-d94a-4be5-ab58-54e8054cce93	6731eab1231270609bef808f	male	\N	high	{料理,自主學習,音樂,電繪,社會參與}	86	t	86	璿糧	2	t	2008-03-03	86	2024-11-11 11:29:53+00	2024-11-11 12:08:04+00	airflow	2025-01-30 17:08:48.528592+00	airflow	2025-01-30 17:08:48.528594+00
88	e7958c58-6d4f-468a-921e-24afbe0e028e	6731ecdb231270609bef81b9	male	\N	high	{航太工程,天文,物理}	87	f	87	宏駿	2	f	2007-01-31	87	2024-11-11 11:39:07+00	2024-11-11 12:05:03+00	airflow	2025-01-30 17:08:48.532049+00	airflow	2025-01-30 17:08:48.532054+00
89	4afe2808-5e02-42ce-8cd8-9cb22ceb6e86	6731ed3b231270609bef81e8	other	\N	high	{電繪}	88	f	88	黎杏	2	f	2008-07-10	88	2024-11-11 11:40:43+00	2024-11-11 12:29:21+00	airflow	2025-01-30 17:08:48.536246+00	airflow	2025-01-30 17:08:48.53625+00
90	efbf0b20-e46d-47ed-8636-8b19a78569f5	6731ef12231270609bef8353	male	\N	high	{料理}	89	f	89	吳秉謙	2	f	2007-09-25	89	2024-11-11 11:48:34+00	2024-11-11 12:16:56+00	airflow	2025-01-30 17:08:48.539902+00	airflow	2025-01-30 17:08:48.539908+00
91	be652589-5c88-4fb2-9d28-a70603c8811d	6731ef2f231270609bef8368	male	\N	high	{遊戲}	90	f	90	Nigellus	2	f	2008-11-01	90	2024-11-11 11:49:03+00	2024-11-11 12:00:43+00	airflow	2025-01-30 17:08:48.544375+00	airflow	2025-01-30 17:08:48.54438+00
92	f09f29c9-e39d-4de6-b804-41c8dfae28bf	6731ef46231270609bef8372	male	\N	high	{當代藝術,摺紙}	91	f	91	林靖詠	2	f	2007-11-11	91	2024-11-11 11:49:26+00	2024-11-11 11:51:32+00	airflow	2025-01-30 17:08:48.549742+00	airflow	2025-01-30 17:08:48.549751+00
93	da5b1b92-608c-41ad-8105-7cc9f232f941	6731efa5231270609bef83a6	female	\N	high	{藝術,音樂,社會參與,自主學習}	92	f	92	喬高	2	t	2006-11-28	92	2024-11-11 11:51:01+00	2024-11-11 12:03:20+00	airflow	2025-01-30 17:08:48.554052+00	airflow	2025-01-30 17:08:48.554057+00
94	6a7a6fc6-8312-4df2-a19f-c3b27d49821a	67332581231270609bef8a82	male	\N	university	{社會議題}	94	t	94	蘇雨青	2	t	2004-01-19	94	2024-11-12 09:53:05+00	2024-11-12 11:31:49+00	airflow	2025-01-30 17:08:48.567421+00	airflow	2025-01-30 17:08:48.567429+00
95	9d0550de-8737-4693-9bc5-5401afd7e425	673475ab927c5a37b4727344	female	\N	other	{}	95	t	95	鄭知	2	t	2001-11-13	95	2024-11-13 09:47:23+00	2024-11-13 09:47:23+00	airflow	2025-01-30 17:08:48.574903+00	airflow	2025-01-30 17:08:48.574911+00
96	39f591e7-1a90-464a-9680-3c2994b4849f	6735d2809daeb56dac510223	female	\N	other	{語言學習}	97	t	97	許筑亭	2	t	1992-05-18	97	2024-11-14 10:35:44+00	2024-11-14 10:42:30+00	airflow	2025-01-30 17:08:48.584434+00	airflow	2025-01-30 17:08:48.584438+00
97	e0f7ac9b-60f4-49a3-8686-e0086b4ef25d	6747bea09daeb56dac511858	female	\N	other	{}	98	t	98	wala	2	t	1906-11-28	98	2024-11-28 00:51:44+00	2024-11-28 00:51:50+00	airflow	2025-01-30 17:08:48.588532+00	airflow	2025-01-30 17:08:48.588536+00
98	e03f45e1-a269-4064-a090-397ba3955ae7	674e6b239daeb56dac511a2a	female	\N	high	{程式}	99	t	99	Chen Pu	2	t	2007-09-23	99	2024-12-03 02:21:23+00	2024-12-03 02:25:12+00	airflow	2025-01-30 17:08:48.592246+00	airflow	2025-01-30 17:08:48.592251+00
99	62ccb20d-54d4-4f60-8248-289ba23dee90	674e81a29daeb56dac511a44	female	\N	high	{韓文,舞蹈,自主學習,Kpop,HipHop}	100	t	100	沛淳	2	t	2008-12-03	100	2024-12-03 03:57:22+00	2024-12-03 04:03:23+00	airflow	2025-01-30 17:08:48.596327+00	airflow	2025-01-30 17:08:48.596331+00
100	da26fe72-4512-4fb3-b61a-e08237c97f48	67529f6f9daeb56dac511e17	male	\N	university	{民主教育,議事規則,數理科學,程式,遊戲}	101	t	101	林宇祥 鳥巢老師	2	t	1994-10-03	101	2024-12-06 06:53:35+00	2024-12-06 07:16:05+00	airflow	2025-01-30 17:08:48.599085+00	airflow	2025-01-30 17:08:48.599087+00
101	86776250-fa28-4904-9627-64df4f98b451	6752bab39daeb56dac511e4d	male	\N	other	{}	102	t	102	葛修承	2	t	2000-12-13	102	2024-12-06 08:49:55+00	2024-12-06 08:50:10+00	airflow	2025-01-30 17:08:48.607961+00	airflow	2025-01-30 17:08:48.607966+00
102	ec5f1444-f8f8-4c56-9f65-984c0e906354	675395339daeb56dac512278	female	\N	other	{}	103	t	103	椪柑	2	t	1988-04-12	103	2024-12-07 00:22:11+00	2024-12-07 00:23:03+00	airflow	2025-01-30 17:08:48.611161+00	airflow	2025-01-30 17:08:48.611164+00
103	0b9e61f5-f22a-4872-ba22-d0c4baa5a041	67551ee49daeb56dac51250d	female	\N	other	{}	104	t	104	林祉均	2	t	2000-01-27	104	2024-12-08 04:21:56+00	2024-12-08 04:22:13+00	airflow	2025-01-30 17:08:48.613767+00	airflow	2025-01-30 17:08:48.61377+00
104	2062dbea-7876-4661-933b-07b5f6407571	67604156c58563e57e7e7fb5	female	\N	high	{社會議題}	105	t	105	Wen Ally	2	t	2007-06-15	105	2024-12-16 15:03:50+00	2024-12-16 15:03:50+00	airflow	2025-01-30 17:08:48.616957+00	airflow	2025-01-30 17:08:48.61696+00
105	85360ec1-6f90-41fd-8a2a-786e671dbab3	6760492ac58563e57e7e7fd7	female	\N	high	{音樂創作,彈吉他,社會議題,政治,人權,藝術,穿搭,看電影,自我成長,唱歌,追歌手,聽音樂,打電動,攝影}	106	t	106	賴季兒	2	t	2007-10-17	106	2024-12-16 15:37:14+00	2025-01-24 12:26:23+00	airflow	2025-01-30 17:08:48.620395+00	airflow	2025-01-30 17:08:48.620399+00
106	8c249387-2f59-414a-918c-90f00e50373b	676059b7e9e593a8f3ef07e7	female	\N	other	{}	107	t	107	郭亮真	2	t	2005-11-02	107	2024-12-16 16:47:51+00	2024-12-16 16:47:51+00	airflow	2025-01-30 17:08:48.624583+00	airflow	2025-01-30 17:08:48.624586+00
107	76ae9265-5b95-44d0-b6d8-b25fc9df755d	67616f73e9e593a8f3ef093d	female	\N	other	{}	108	t	108	李珊	2	t	1989-12-27	108	2024-12-17 12:32:51+00	2024-12-17 12:32:51+00	airflow	2025-01-30 17:08:48.62832+00	airflow	2025-01-30 17:08:48.628325+00
108	b34050cf-2150-4c26-be19-b7a4710fa4a0	676293c5e9e593a8f3ef0b1b	male	\N	other	{}	109	t	109	geo	2	t	1900-12-18	109	2024-12-18 09:20:05+00	2024-12-18 09:20:05+00	airflow	2025-01-30 17:08:48.63164+00	airflow	2025-01-30 17:08:48.631643+00
109	bac7e596-6973-4d9f-9469-a9fff3a93987	6762bfcce9e593a8f3ef0b62	other	\N	university	{劇場,舞蹈,創作,自媒體,職涯,生產力工具,設計,街舞,接觸即興,黑人音樂,教育,社群,社會議題,饒舌,影音剪輯}	110	t	110	青	2	t	1996-03-01	110	2024-12-18 12:27:56+00	2025-01-24 09:20:59+00	airflow	2025-01-30 17:08:48.635554+00	airflow	2025-01-30 17:08:48.635558+00
110	3e585e8f-e676-43c5-9eef-f1c14efcaf94	67645cc4e9e593a8f3ef0da3	male	\N	university	{以人為本設計,教育科技,遊戲化,UX,產品,使用者研究}	111	t	111	Henry Lee李昊翰	2	t	2004-10-04	111	2024-12-19 17:49:56+00	2024-12-19 17:49:56+00	airflow	2025-01-30 17:08:48.639102+00	airflow	2025-01-30 17:08:48.639105+00
111	6ca710ad-01ba-4928-bd80-d6d21715b926	6766a81be9e593a8f3ef10d1	male	\N	other	{}	113	t	113	Yang Lin	2	t	1993-01-29	113	2024-12-21 11:35:55+00	2024-12-21 11:35:55+00	airflow	2025-01-30 17:08:48.644625+00	airflow	2025-01-30 17:08:48.644632+00
112	ce495faf-8bdd-4597-a1a1-24d7dcd93a3e	6766ccbbe9e593a8f3ef1121	female	\N	other	{}	114	t	114	郭映岑	2	t	2004-11-12	114	2024-12-21 14:12:11+00	2024-12-21 14:12:11+00	airflow	2025-01-30 17:08:48.648558+00	airflow	2025-01-30 17:08:48.648561+00
113	153c4143-e1da-4fc5-9785-b8020b8aecf3	67672dede9e593a8f3ef11d2	other	\N	high	{攝影,藝術,文學,穿搭,展覽,吉他,音樂,樂團,資管,電影,吉伊卡哇,卡皮巴拉}	115	t	115	cy L	2	t	2006-10-22	115	2024-12-21 21:06:53+00	2024-12-21 21:06:53+00	airflow	2025-01-30 17:08:48.652091+00	airflow	2025-01-30 17:08:48.652095+00
114	e34f953f-392e-4033-ab47-02a26860e47f	676a0f3718e6b11da60577ed	male	\N	university	{攝影、閱讀}	116	t	116	雨瑄 Simon	2	t	1999-07-15	116	2024-12-24 01:32:39+00	2025-01-19 11:36:32+00	airflow	2025-01-30 17:08:48.655537+00	airflow	2025-01-30 17:08:48.655541+00
115	cc4f1bf4-457b-4c9a-8453-410e31ba376f	676ae06618e6b11da6057954	male	\N	other	{}	117	t	117	大頭	2	t	1996-12-08	117	2024-12-24 16:25:10+00	2024-12-24 16:25:10+00	airflow	2025-01-30 17:08:48.658559+00	airflow	2025-01-30 17:08:48.658561+00
116	38f9c2c9-44a6-4680-95fb-e09a7f31b31e	676c0cd418e6b11da605822e	male	\N	high	{教育議題,社會議題,環境保護,程式語言,學習科學,社會學}	118	f	118	陳彥廷	2	t	2006-12-26	118	2024-12-25 13:47:00+00	2025-01-13 04:36:22+00	airflow	2025-01-30 17:08:48.662143+00	airflow	2025-01-30 17:08:48.66215+00
117	c96b54bd-d15b-4f0d-aae1-b7af706d885e	676c2f2818e6b11da60582b0	female	\N	university	{日文,程式語言,文學,英文}	119	t	119	Yi-Chih Hsiao	2	t	2003-07-21	119	2024-12-25 16:13:28+00	2024-12-25 16:13:28+00	airflow	2025-01-30 17:08:48.669123+00	airflow	2025-01-30 17:08:48.669129+00
118	73ff25f8-e094-4a4a-aced-fc378c02a9ef	676c3d9a18e6b11da60582c2	male	\N	high	{INFJ}	120	t	120	Oliver	2	t	2007-05-14	120	2024-12-25 17:15:06+00	2025-01-11 08:41:20+00	airflow	2025-01-30 17:08:48.674052+00	airflow	2025-01-30 17:08:48.674056+00
119	4a23b23b-dccc-4604-bf48-e295098c8cc4	676c3fdb18e6b11da605832d	male	\N	high	{infp,學習,教育}	121	f	121	洪綱霆	2	f	2006-01-24	121	2024-12-25 17:24:43+00	2025-01-19 02:29:52+00	airflow	2025-01-30 17:08:48.678645+00	airflow	2025-01-30 17:08:48.67865+00
120	b7068451-d750-4e3c-ab50-fa0d3e623be4	676e534618e6b11da6059198	male	\N	other	{}	122	t	122	林晏丞	2	t	2005-10-30	122	2024-12-27 07:12:06+00	2024-12-27 07:12:06+00	airflow	2025-01-30 17:08:48.683414+00	airflow	2025-01-30 17:08:48.683418+00
121	998a935b-5772-4c26-8d70-5c464687a2bd	6770f7024b6a24b8351d5900	male	\N	other	{}	123	t	123	Tofus Wang	2	t	2004-01-19	123	2024-12-29 07:15:14+00	2024-12-29 07:15:14+00	airflow	2025-01-30 17:08:48.687939+00	airflow	2025-01-30 17:08:48.687943+00
122	37bccfd5-c8f4-46c3-b846-9f780317dbe3	677111784b6a24b8351d5b36	other	\N	university	{程式語言,插畫,社會議題}	124	t	124	米露露	2	t	2002-11-14	124	2024-12-29 09:08:08+00	2025-01-24 15:30:06+00	airflow	2025-01-30 17:08:48.695357+00	airflow	2025-01-30 17:08:48.695364+00
123	320cc0b3-d003-4865-b02a-c6c33b2ae277	6771676f4b6a24b8351d62b4	other	\N	high	{劇場,戲劇,電影}	125	f	125	莊庭祐	2	f	2005-11-22	125	2024-12-29 15:14:55+00	2024-12-31 11:35:42+00	airflow	2025-01-30 17:08:48.702739+00	airflow	2025-01-30 17:08:48.702746+00
124	0aac5f5d-7df6-4523-af84-3210f8ca427d	677292a44b6a24b8351d6b22	female	\N	other	{}	127	t	127	新W易平	2	t	2005-12-15	127	2024-12-30 12:31:32+00	2024-12-30 12:31:32+00	airflow	2025-01-30 17:08:48.715206+00	airflow	2025-01-30 17:08:48.715211+00
125	bc617162-bd43-4595-8c0f-80b1a64d160f	677824d54b6a24b8351d8f44	male	\N	other	{}	128	t	128	許志傑	2	t	1978-01-03	128	2025-01-03 17:56:37+00	2025-01-03 17:56:37+00	airflow	2025-01-30 17:08:48.720756+00	airflow	2025-01-30 17:08:48.720763+00
126	0c043b64-da22-44ab-bf0f-0f059d3209a8	678a5c596662cd04f9688e5c	other	\N	high	{社會議題,科技工具,科技教育,攝影,心理,實驗教育}	129	f	129	ChauYi Yu	2	t	2009-01-17	129	2025-01-17 13:34:17+00	2025-01-24 06:38:13+00	airflow	2025-01-30 17:08:48.729311+00	airflow	2025-01-30 17:08:48.729324+00
127	cee054f7-7efa-4262-8feb-25e6d3d6a88c	677e1d1f0bfe245fc83826e7	female	\N	university	{產品設計,UI,UX,Figma}	131	f	131	Juni Huang	2	t	1995-12-10	131	2025-01-08 06:37:19+00	2025-01-08 06:37:19+00	airflow	2025-01-30 17:08:48.748793+00	airflow	2025-01-30 17:08:48.748798+00
128	d58ffffd-1fd1-4c73-8a59-c85c9174062a	677e32fb0bfe245fc8382841	female	\N	other	{}	132	t	132	蔡東羽	2	t	2007-12-10	132	2025-01-08 08:10:35+00	2025-01-08 08:10:35+00	airflow	2025-01-30 17:08:48.754158+00	airflow	2025-01-30 17:08:48.754164+00
129	7aed85a8-a8bf-446a-935e-0f3a548ddee2	67814b250bfe245fc8384532	female	\N	high	{分析資料,創意發想,資源搜集,營養學,影片製作,飲食,自媒體,文字編輯,排版美編}	133	t	133	蔡東羽	2	t	2007-12-11	133	2025-01-10 16:30:29+00	2025-01-27 13:27:42+00	airflow	2025-01-30 17:08:48.759574+00	airflow	2025-01-30 17:08:48.759579+00
130	fb2b598a-b30a-4ef4-9131-078be14fee8b	6784b8436662cd04f9684a7f	other	\N	other	{電繪,二次元}	134	f	134	陳姵彤	2	t	2008-02-15	134	2025-01-13 06:52:51+00	2025-01-13 06:57:58+00	airflow	2025-01-30 17:08:48.766024+00	airflow	2025-01-30 17:08:48.76603+00
131	9eb4f72b-d7e5-4406-969e-b9277780e089	6784baeb6662cd04f9684d69	male	\N	other	{}	135	t	135	bacon	2	t	2000-02-09	135	2025-01-13 07:04:11+00	2025-01-13 07:04:11+00	airflow	2025-01-30 17:08:48.77066+00	airflow	2025-01-30 17:08:48.770666+00
132	f54dd8c0-6297-45d9-9c59-05544161d09d	6784cbab6662cd04f96850de	male	\N	high	{程式語言}	136	t	136	薛智謙	2	t	2008-07-31	136	2025-01-13 08:15:39+00	2025-01-13 08:15:39+00	airflow	2025-01-30 17:08:48.775246+00	airflow	2025-01-30 17:08:48.775252+00
133	75b1e566-e04d-4d3c-87bc-80a0a25af4a2	6784ea3c6662cd04f9685160	other	\N	high	{茶,咖啡,畫圖,性別議題}	137	f	137	水果乾	2	f	2006-05-15	137	2025-01-13 10:26:04+00	2025-01-24 15:48:59+00	airflow	2025-01-30 17:08:48.780128+00	airflow	2025-01-30 17:08:48.780134+00
134	6392c8b4-71ce-424a-b990-059c3d8d2a94	67850b3d6662cd04f9685a39	female	\N	high	{寫作,歌詞,攝影}	138	f	138	201 31蔡雨彤	2	t	2008-02-14	138	2025-01-13 12:46:53+00	2025-01-13 12:46:53+00	airflow	2025-01-30 17:08:48.784805+00	airflow	2025-01-30 17:08:48.784818+00
135	52a7636d-88a5-4987-a5e8-901b4a378275	67851fd56662cd04f9685af9	female	\N	university	{轉型正義}	139	t	139	王清美	2	t	1982-07-03	139	2025-01-13 14:14:45+00	2025-01-13 14:14:45+00	airflow	2025-01-30 17:08:48.790102+00	airflow	2025-01-30 17:08:48.790108+00
136	3388b4c8-db56-4fad-b4c9-6dcebe0b4fb3	6785dac26662cd04f96860d4	female	\N	university	{攝影,教案設計}	140	t	140	曹睿華	2	t	1991-06-10	140	2025-01-14 03:32:18+00	2025-01-14 03:32:18+00	airflow	2025-01-30 17:08:48.794951+00	airflow	2025-01-30 17:08:48.794956+00
137	39af76b7-0a25-4afa-8c92-4be39145f8f4	6788dbe06662cd04f9688000	female	\N	university	{英文,程式語言,電繪,社會議題}	141	f	141	Wei Chen	2	t	1999-07-11	141	2025-01-16 10:13:52+00	2025-01-16 10:13:52+00	airflow	2025-01-30 17:08:48.798743+00	airflow	2025-01-30 17:08:48.798748+00
138	745fada8-0d50-4338-902e-711e878523ef	678b01773b18d82b6896b25c	male	\N	university	{閱讀,投資,寫作,電影,商管}	142	t	142	朝強	2	t	2005-06-18	142	2025-01-18 01:18:47+00	2025-01-24 04:03:06+00	airflow	2025-01-30 17:08:48.803439+00	airflow	2025-01-30 17:08:48.803444+00
139	06441b15-e8db-407b-8928-dfc3251bfe37	678c9ffe3b18d82b6896c8a9	female	\N	university	{程式語言,毛線編織,心理學}	143	t	143	小熊	2	t	1993-07-04	143	2025-01-19 06:47:26+00	2025-01-23 01:17:03+00	airflow	2025-01-30 17:08:48.808043+00	airflow	2025-01-30 17:08:48.808048+00
140	c1dbd7d0-2856-49c1-890b-42efbb25f0a3	678d3b563b18d82b6896d9d4	female	\N	university	{@音樂,@心理學,@角色扮演,@動畫,@籃球,@喜歡聊天,@也喜歡獨處,@輔導}	144	t	144	蕭綮萱	2	t	2003-01-14	144	2025-01-19 17:50:14+00	2025-01-24 15:58:29+00	airflow	2025-01-30 17:08:48.812894+00	airflow	2025-01-30 17:08:48.8129+00
141	1ba1b347-f8b4-476f-9ba5-d7a71f3a89dd	678e2e463b18d82b6896fb7a	female	\N	high	{唱歌,社會議題,創新,法文,社群經營,校園大使,循環經濟,饒舌音樂,流行音樂,經濟學,物理,環境永續,自我挑戰,潛水,登山,跨領域}	145	t	145	若寧	2	t	2009-01-06	145	2025-01-20 11:06:46+00	2025-01-27 17:20:51+00	airflow	2025-01-30 17:08:48.817889+00	airflow	2025-01-30 17:08:48.817894+00
142	a2491e0f-1ac3-4cb9-93fe-7002759eb685	678fa4a89ddf9a5f9c3c2d2d	female	\N	high	{生物學}	146	t	146	陳薇羽	2	t	2009-01-21	146	2025-01-21 13:44:08+00	2025-01-21 13:44:08+00	airflow	2025-01-30 17:08:48.822381+00	airflow	2025-01-30 17:08:48.822386+00
143	acad640e-b3d7-48fc-9f01-f6fd9463184c	679132119ddf9a5f9c3c7818	female	\N	high	{寫作,二次元}	147	f	147	周鈺庭	2	f	2008-06-20	147	2025-01-22 17:59:45+00	2025-01-23 12:13:34+00	airflow	2025-01-30 17:08:48.826712+00	airflow	2025-01-30 17:08:48.826718+00
144	a2f5e8be-eb44-4b5c-84fe-c20a109457b9	6791f9669ddf9a5f9c3c9592	male	\N	other	{蒙特梭利,實驗教育,獨立自主}	148	t	148	廖修毅Joey	2	t	1968-12-30	148	2025-01-23 08:10:14+00	2025-01-23 08:13:03+00	airflow	2025-01-30 17:08:48.829994+00	airflow	2025-01-30 17:08:48.829998+00
145	1046aa68-daf9-45c9-ba27-66e703e59d29	679316c69ddf9a5f9c3cdd7d	male	\N	university	{圍棋古文詩歌社科}	149	t	149	李清山	2	t	1962-10-26	149	2025-01-24 04:27:50+00	2025-01-24 04:45:12+00	airflow	2025-01-30 17:08:48.834121+00	airflow	2025-01-30 17:08:48.834126+00
146	8c6f0d57-1f1f-45db-83df-61a1e6dab329	6793a1969ddf9a5f9c3d501b	female	\N	university	{社會議題}	150	f	150	彭菲	2	f	2003-09-08	150	2025-01-24 14:20:06+00	2025-01-24 14:20:50+00	airflow	2025-01-30 17:08:48.837855+00	airflow	2025-01-30 17:08:48.837859+00
147	17dd0dc7-c29f-4535-ac3a-fcdc5bbae77f	6793ae729ddf9a5f9c3d6ce4	female	\N	university	{德文,社會創新,教育,導覽,非營利組織,藝術文化}	151	t	151	顧婕	2	t	2000-05-16	151	2025-01-24 15:14:58+00	2025-01-26 17:14:38+00	airflow	2025-01-30 17:08:48.841807+00	airflow	2025-01-30 17:08:48.841818+00
148	a4459cdc-2154-4700-8ea9-b63952d5c1bd	67952d999ddf9a5f9c3df2d0	female	\N	other	{}	152	t	152	Lauren Tsai	2	t	1992-12-05	152	2025-01-25 18:29:45+00	2025-01-25 18:31:59+00	airflow	2025-01-30 17:08:48.846007+00	airflow	2025-01-30 17:08:48.846011+00
149	1f9670b1-4a24-41b8-97b1-cabdf8a24728	6795b2bd9ddf9a5f9c3e072e	other	\N	other	{}	154	t	154	Q Moon	2	t	1976-10-08	154	2025-01-26 03:57:49+00	2025-01-26 03:57:49+00	airflow	2025-01-30 17:08:48.85177+00	airflow	2025-01-30 17:08:48.851773+00
150	95af8b8c-a78e-4adf-99a8-bc7485df5539	67965de19ddf9a5f9c3e3daf	female	\N	high	{國際經營,文字寫作,企劃,藝術,想學吉他}	155	t	155	Emily	2	t	2006-12-10	155	2025-01-26 16:08:01+00	2025-01-27 09:37:08+00	airflow	2025-01-30 17:08:48.85535+00	airflow	2025-01-30 17:08:48.855355+00
151	9a9cce16-0e08-428f-9857-2c2740eea6a7	6799ee2b9ddf9a5f9c3fa32b	male	\N	university	{社會議題,民主教育,籃球}	156	t	156	吳宥芝	2	t	2003-04-28	156	2025-01-29 09:00:27+00	2025-01-29 11:14:40+00	airflow	2025-01-30 17:08:48.85922+00	airflow	2025-01-30 17:08:48.859225+00
\.


--
-- Name: area_id_seq; Type: SEQUENCE SET; Schema: public; Owner: daodao
--

SELECT pg_catalog.setval('public.area_id_seq', 16, true);


--
-- Name: basic_info_id_seq; Type: SEQUENCE SET; Schema: public; Owner: daodao
--

SELECT pg_catalog.setval('public.basic_info_id_seq', 156, true);


--
-- Name: contacts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: daodao
--

SELECT pg_catalog.setval('public.contacts_id_seq', 156, true);


--
-- Name: eligibility_id_seq; Type: SEQUENCE SET; Schema: public; Owner: daodao
--

SELECT pg_catalog.setval('public.eligibility_id_seq', 22, true);


--
-- Name: fee_plans_id_seq; Type: SEQUENCE SET; Schema: public; Owner: daodao
--

SELECT pg_catalog.setval('public.fee_plans_id_seq', 6, true);


--
-- Name: groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: daodao
--

SELECT pg_catalog.setval('public.groups_id_seq', 13, true);


--
-- Name: location_id_seq; Type: SEQUENCE SET; Schema: public; Owner: daodao
--

SELECT pg_catalog.setval('public.location_id_seq', 156, true);


--
-- Name: marathon_id_seq; Type: SEQUENCE SET; Schema: public; Owner: daodao
--

SELECT pg_catalog.setval('public.marathon_id_seq', 1, true);


--
-- Name: milestone_id_seq; Type: SEQUENCE SET; Schema: public; Owner: daodao
--

SELECT pg_catalog.setval('public.milestone_id_seq', 286, true);


--
-- Name: note_id_seq; Type: SEQUENCE SET; Schema: public; Owner: daodao
--

SELECT pg_catalog.setval('public.note_id_seq', 1, false);


--
-- Name: outcome_id_seq; Type: SEQUENCE SET; Schema: public; Owner: daodao
--

SELECT pg_catalog.setval('public.outcome_id_seq', 1, false);


--
-- Name: permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: daodao
--

SELECT pg_catalog.setval('public.permissions_id_seq', 1, false);


--
-- Name: position_id_seq; Type: SEQUENCE SET; Schema: public; Owner: daodao
--

SELECT pg_catalog.setval('public.position_id_seq', 6, true);


--
-- Name: project_id_seq; Type: SEQUENCE SET; Schema: public; Owner: daodao
--

SELECT pg_catalog.setval('public.project_id_seq', 22, true);


--
-- Name: project_marathon_id_seq; Type: SEQUENCE SET; Schema: public; Owner: daodao
--

SELECT pg_catalog.setval('public.project_marathon_id_seq', 22, true);


--
-- Name: review_id_seq; Type: SEQUENCE SET; Schema: public; Owner: daodao
--

SELECT pg_catalog.setval('public.review_id_seq', 1, false);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: daodao
--

SELECT pg_catalog.setval('public.roles_id_seq', 1, false);


--
-- Name: store_id_seq; Type: SEQUENCE SET; Schema: public; Owner: daodao
--

SELECT pg_catalog.setval('public.store_id_seq', 1, false);


--
-- Name: subscription_plan_id_seq; Type: SEQUENCE SET; Schema: public; Owner: daodao
--

SELECT pg_catalog.setval('public.subscription_plan_id_seq', 1, false);


--
-- Name: task_id_seq; Type: SEQUENCE SET; Schema: public; Owner: daodao
--

SELECT pg_catalog.setval('public.task_id_seq', 188, true);


--
-- Name: user_join_group_id_seq; Type: SEQUENCE SET; Schema: public; Owner: daodao
--

SELECT pg_catalog.setval('public.user_join_group_id_seq', 13, true);


--
-- Name: user_profiles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: daodao
--

SELECT pg_catalog.setval('public.user_profiles_id_seq', 150, true);


--
-- Name: user_project_id_seq; Type: SEQUENCE SET; Schema: public; Owner: daodao
--

SELECT pg_catalog.setval('public.user_project_id_seq', 22, true);


--
-- Name: user_subscription_id_seq; Type: SEQUENCE SET; Schema: public; Owner: daodao
--

SELECT pg_catalog.setval('public.user_subscription_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: daodao
--

SELECT pg_catalog.setval('public.users_id_seq', 151, true);


--
-- Name: area area_pkey; Type: CONSTRAINT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.area
    ADD CONSTRAINT area_pkey PRIMARY KEY (id);


--
-- Name: basic_info basic_info_pkey; Type: CONSTRAINT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.basic_info
    ADD CONSTRAINT basic_info_pkey PRIMARY KEY (id);


--
-- Name: contacts contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_pkey PRIMARY KEY (id);


--
-- Name: eligibility eligibility_pkey; Type: CONSTRAINT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.eligibility
    ADD CONSTRAINT eligibility_pkey PRIMARY KEY (id);


--
-- Name: fee_plans fee_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.fee_plans
    ADD CONSTRAINT fee_plans_pkey PRIMARY KEY (id);


--
-- Name: groups groups_id_key; Type: CONSTRAINT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_id_key UNIQUE (id);


--
-- Name: groups groups_pkey; Type: CONSTRAINT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_pkey PRIMARY KEY (external_id);


--
-- Name: location location_pkey; Type: CONSTRAINT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.location
    ADD CONSTRAINT location_pkey PRIMARY KEY (id);


--
-- Name: marathon marathon_event_id_key; Type: CONSTRAINT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.marathon
    ADD CONSTRAINT marathon_event_id_key UNIQUE (event_id);


--
-- Name: marathon marathon_pkey; Type: CONSTRAINT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.marathon
    ADD CONSTRAINT marathon_pkey PRIMARY KEY (id);


--
-- Name: milestone milestone_pkey; Type: CONSTRAINT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.milestone
    ADD CONSTRAINT milestone_pkey PRIMARY KEY (id);


--
-- Name: note note_pkey; Type: CONSTRAINT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.note
    ADD CONSTRAINT note_pkey PRIMARY KEY (id);


--
-- Name: outcome outcome_pkey; Type: CONSTRAINT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.outcome
    ADD CONSTRAINT outcome_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_name_key; Type: CONSTRAINT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_key UNIQUE (name);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: position position_name_key; Type: CONSTRAINT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public."position"
    ADD CONSTRAINT position_name_key UNIQUE (name);


--
-- Name: position position_pkey; Type: CONSTRAINT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public."position"
    ADD CONSTRAINT position_pkey PRIMARY KEY (id);


--
-- Name: project project_id_key; Type: CONSTRAINT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.project
    ADD CONSTRAINT project_id_key UNIQUE (id);


--
-- Name: project_marathon project_marathon_pkey; Type: CONSTRAINT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.project_marathon
    ADD CONSTRAINT project_marathon_pkey PRIMARY KEY (id);


--
-- Name: project_marathon project_marathon_project_id_marathon_id_key; Type: CONSTRAINT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.project_marathon
    ADD CONSTRAINT project_marathon_project_id_marathon_id_key UNIQUE (project_id, marathon_id);


--
-- Name: project project_pkey; Type: CONSTRAINT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.project
    ADD CONSTRAINT project_pkey PRIMARY KEY (external_id);


--
-- Name: review review_pkey; Type: CONSTRAINT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.review
    ADD CONSTRAINT review_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id);


--
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: store store_external_id_key; Type: CONSTRAINT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.store
    ADD CONSTRAINT store_external_id_key UNIQUE (external_id);


--
-- Name: store store_pkey; Type: CONSTRAINT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.store
    ADD CONSTRAINT store_pkey PRIMARY KEY (id);


--
-- Name: store store_user_id_key; Type: CONSTRAINT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.store
    ADD CONSTRAINT store_user_id_key UNIQUE (user_id);


--
-- Name: subscription_plan subscription_plan_pkey; Type: CONSTRAINT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.subscription_plan
    ADD CONSTRAINT subscription_plan_pkey PRIMARY KEY (id);


--
-- Name: task task_pkey; Type: CONSTRAINT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.task
    ADD CONSTRAINT task_pkey PRIMARY KEY (id);


--
-- Name: user_join_group user_join_group_pkey; Type: CONSTRAINT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.user_join_group
    ADD CONSTRAINT user_join_group_pkey PRIMARY KEY (id);


--
-- Name: user_permissions user_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_pkey PRIMARY KEY (user_id, permission_id);


--
-- Name: user_positions user_positions_pkey; Type: CONSTRAINT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.user_positions
    ADD CONSTRAINT user_positions_pkey PRIMARY KEY (user_id, position_id);


--
-- Name: user_profiles user_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (id);


--
-- Name: user_project user_project_pkey; Type: CONSTRAINT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.user_project
    ADD CONSTRAINT user_project_pkey PRIMARY KEY (id);


--
-- Name: user_subscription user_subscription_pkey; Type: CONSTRAINT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.user_subscription
    ADD CONSTRAINT user_subscription_pkey PRIMARY KEY (id);


--
-- Name: users users_id_key; Type: CONSTRAINT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_id_key UNIQUE (id);


--
-- Name: users users_mongo_id_key; Type: CONSTRAINT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_mongo_id_key UNIQUE (mongo_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (external_id);


--
-- Name: idx_area_city; Type: INDEX; Schema: public; Owner: daodao
--

CREATE INDEX idx_area_city ON public.area USING btree (city);


--
-- Name: idx_group_TBD; Type: INDEX; Schema: public; Owner: daodao
--

CREATE INDEX "idx_group_TBD" ON public.groups USING btree ("TBD");


--
-- Name: idx_group_area_id; Type: INDEX; Schema: public; Owner: daodao
--

CREATE INDEX idx_group_area_id ON public.groups USING btree (area_id);


--
-- Name: idx_group_group_type; Type: INDEX; Schema: public; Owner: daodao
--

CREATE INDEX idx_group_group_type ON public.groups USING btree (group_type);


--
-- Name: idx_group_is_grouping; Type: INDEX; Schema: public; Owner: daodao
--

CREATE INDEX idx_group_is_grouping ON public.groups USING btree (is_grouping);


--
-- Name: idx_group_is_online; Type: INDEX; Schema: public; Owner: daodao
--

CREATE INDEX idx_group_is_online ON public.groups USING btree (is_online);


--
-- Name: idx_group_partner_education_step; Type: INDEX; Schema: public; Owner: daodao
--

CREATE INDEX idx_group_partner_education_step ON public.groups USING btree (partner_education_step);


--
-- Name: idx_marathon_start_date; Type: INDEX; Schema: public; Owner: daodao
--

CREATE INDEX idx_marathon_start_date ON public.marathon USING btree (start_date);


--
-- Name: idx_milestone_project_id; Type: INDEX; Schema: public; Owner: daodao
--

CREATE INDEX idx_milestone_project_id ON public.milestone USING btree (project_id);


--
-- Name: idx_project_marathon_status; Type: INDEX; Schema: public; Owner: daodao
--

CREATE INDEX idx_project_marathon_status ON public.project_marathon USING btree (status);


--
-- Name: idx_task_milestone_id; Type: INDEX; Schema: public; Owner: daodao
--

CREATE INDEX idx_task_milestone_id ON public.task USING btree (milestone_id);


--
-- Name: idx_user_group; Type: INDEX; Schema: public; Owner: daodao
--

CREATE INDEX idx_user_group ON public.user_join_group USING btree (user_id, group_id);


--
-- Name: idx_user_profiles_is_public; Type: INDEX; Schema: public; Owner: daodao
--

CREATE INDEX idx_user_profiles_is_public ON public.user_profiles USING btree (is_public);


--
-- Name: idx_user_subscription_user_status; Type: INDEX; Schema: public; Owner: daodao
--

CREATE INDEX idx_user_subscription_user_status ON public.user_subscription USING btree (user_id, status);


--
-- Name: idx_users_education_stage; Type: INDEX; Schema: public; Owner: daodao
--

CREATE INDEX idx_users_education_stage ON public.users USING btree (education_stage);


--
-- Name: idx_users_location_id; Type: INDEX; Schema: public; Owner: daodao
--

CREATE INDEX idx_users_location_id ON public.users USING btree (location_id);


--
-- Name: eligibility eligibility_fee_plans_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.eligibility
    ADD CONSTRAINT eligibility_fee_plans_id_fkey FOREIGN KEY (fee_plans_id) REFERENCES public.fee_plans(id);


--
-- Name: groups groups_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: location location_area_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.location
    ADD CONSTRAINT location_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.area(id);


--
-- Name: marathon marathon_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.marathon
    ADD CONSTRAINT marathon_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: milestone milestone_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.milestone
    ADD CONSTRAINT milestone_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.project(id) ON DELETE CASCADE;


--
-- Name: note note_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.note
    ADD CONSTRAINT note_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.project(id) ON DELETE CASCADE;


--
-- Name: outcome outcome_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.outcome
    ADD CONSTRAINT outcome_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.project(id) ON DELETE CASCADE;


--
-- Name: project_marathon project_marathon_eligibility_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.project_marathon
    ADD CONSTRAINT project_marathon_eligibility_id_fkey FOREIGN KEY (eligibility_id) REFERENCES public.eligibility(id);


--
-- Name: project_marathon project_marathon_marathon_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.project_marathon
    ADD CONSTRAINT project_marathon_marathon_id_fkey FOREIGN KEY (marathon_id) REFERENCES public.marathon(id) ON DELETE CASCADE;


--
-- Name: project_marathon project_marathon_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.project_marathon
    ADD CONSTRAINT project_marathon_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.project(id) ON DELETE CASCADE;


--
-- Name: project project_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.project
    ADD CONSTRAINT project_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: review review_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.review
    ADD CONSTRAINT review_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.project(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id);


--
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- Name: store store_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.store
    ADD CONSTRAINT store_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: task task_milestone_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.task
    ADD CONSTRAINT task_milestone_id_fkey FOREIGN KEY (milestone_id) REFERENCES public.milestone(id) ON DELETE CASCADE;


--
-- Name: user_join_group user_join_group_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.user_join_group
    ADD CONSTRAINT user_join_group_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id);


--
-- Name: user_join_group user_join_group_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.user_join_group
    ADD CONSTRAINT user_join_group_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_permissions user_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id);


--
-- Name: user_permissions user_permissions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_positions user_positions_position_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.user_positions
    ADD CONSTRAINT user_positions_position_id_fkey FOREIGN KEY (position_id) REFERENCES public."position"(id);


--
-- Name: user_positions user_positions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.user_positions
    ADD CONSTRAINT user_positions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_profiles user_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_project user_project_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.user_project
    ADD CONSTRAINT user_project_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.project(id) ON DELETE CASCADE;


--
-- Name: user_project user_project_user_external_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.user_project
    ADD CONSTRAINT user_project_user_external_id_fkey FOREIGN KEY (user_external_id) REFERENCES public.users(external_id) ON DELETE CASCADE;


--
-- Name: user_subscription user_subscription_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.user_subscription
    ADD CONSTRAINT user_subscription_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.subscription_plan(id) ON DELETE SET NULL;


--
-- Name: user_subscription user_subscription_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.user_subscription
    ADD CONSTRAINT user_subscription_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users users_basic_info_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_basic_info_id_fkey FOREIGN KEY (basic_info_id) REFERENCES public.basic_info(id);


--
-- Name: users users_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id);


--
-- Name: users users_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.location(id);


--
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: daodao
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- PostgreSQL database dump complete
--

