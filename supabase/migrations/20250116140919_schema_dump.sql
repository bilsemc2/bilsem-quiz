SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "pgsodium" WITH SCHEMA "pgsodium";
COMMENT ON SCHEMA "public" IS 'standard public schema';
CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

CREATE TYPE "public"."duel_result" AS ENUM (
    'draw',
    'challenger_won',
    'challenged_won'
);

CREATE TYPE "public"."user_role" AS ENUM (
    'student',
    'teacher'
);

-- Functions
CREATE OR REPLACE FUNCTION "public"."determine_challenge_winner"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
    if new.sender_answer is not null and new.receiver_answer is not null then
        if new.sender_answer = 'correct' and new.receiver_answer != 'correct' then
            new.winner_id := new.sender_id;
        elsif new.sender_answer != 'correct' and new.receiver_answer = 'correct' then
            new.winner_id := new.receiver_id;
        elsif new.sender_answer = 'correct' and new.receiver_answer = 'correct' then
            new.winner_id := case
                when new.sender_time < new.receiver_time then new.sender_id
                else new.receiver_id
            end;
        end if;
        new.status := 'completed';
    end if;
    return new;
end;
$$;

CREATE OR REPLACE FUNCTION "public"."generate_slug"("title" "text") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $_$
BEGIN
  RETURN LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          REGEXP_REPLACE(
            REGEXP_REPLACE(
              REGEXP_REPLACE(
                REGEXP_REPLACE(
                  REGEXP_REPLACE(
                    REGEXP_REPLACE(
                      REGEXP_REPLACE(
                        title,
                        '[^a-zA-Z0-9\s-]', '', 'g'
                      ),
                      'ı', 'i', 'g'
                    ),
                    'ğ', 'g', 'g'
                  ),
                  'ü', 'u', 'g'
                ),
                'ş', 's', 'g'
              ),
              'ö', 'o', 'g'
            ),
            'ç', 'c', 'g'
          ),
          '\s+', '-', 'g'
        ),
        '-+', '-', 'g'
      ),
      '^-|-$', '', 'g'
    )
  );
END;
$_$;

CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  insert into public.profiles (id, email, name, school, grade, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'school',
    new.raw_user_meta_data->>'grade',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=' || (new.raw_user_meta_data->>'name')
  );
  return new;
end;
$$;

CREATE OR REPLACE FUNCTION "public"."handle_referral"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE profiles
    SET 
        experience = experience + 50,
        referral_count = COALESCE(referral_count, 0) + 1
    WHERE referral_code = NEW.referred_by;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Tables
CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" uuid NOT NULL,
    "email" text NOT NULL,
    "name" text NOT NULL,
    "school" text NOT NULL,
    "grade" text,
    "avatar_url" text,
    "created_at" timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
    "updated_at" timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
    "points" integer DEFAULT 0,
    "experience" integer DEFAULT 0,
    "is_admin" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "full_name" text,
    "is_vip" boolean DEFAULT false,
    "referral_code" text,
    "referral_count" integer DEFAULT 0,
    "referred_by" text,
    "last_seen" timestamptz,
    "role" public.user_role DEFAULT 'student'::public.user_role NOT NULL,
    CONSTRAINT "check_teacher_grade" CHECK (
        ("role" = 'teacher'::public.user_role AND "grade" IS NULL) OR
        ("role" = 'student'::public.user_role AND "grade" IS NOT NULL)
    )
);

CREATE TABLE IF NOT EXISTS "public"."classes" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "name" text NOT NULL,
    "grade" integer NOT NULL,
    "created_by" uuid,
    "created_at" timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
    "updated_at" timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
    "icon" text DEFAULT 'school'::text NOT NULL,
    "teacher_id" uuid
);

CREATE TABLE IF NOT EXISTS "public"."class_students" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "created_at" timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
    "class_id" uuid NOT NULL,
    "student_id" uuid NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."assignments" (
    "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
    "title" text NOT NULL,
    "description" text,
    "questions" jsonb DEFAULT '[]'::jsonb NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_by" uuid,
    "created_at" timestamptz DEFAULT timezone('utc'::text, now()),
    "updated_at" timestamptz DEFAULT timezone('utc'::text, now()),
    "grade" smallint,
    "subject" text,
    "status" text DEFAULT 'pending'::text NOT NULL,
    CONSTRAINT "assignments_status_check" CHECK (status = ANY (ARRAY['pending'::text, 'completed'::text])),
    CONSTRAINT "quizzes_grade_check" CHECK (grade = ANY (ARRAY[1, 2, 3]))
);

CREATE TABLE IF NOT EXISTS "public"."assignment_results" (
    "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
    "assignment_id" uuid,
    "student_id" uuid,
    "score" integer NOT NULL,
    "total_questions" integer NOT NULL,
    "completed_at" timestamptz,
    "answers" jsonb NOT NULL,
    "status" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."questions" (
    "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
    "text" text,
    "image_url" text,
    "options" jsonb NOT NULL,
    "correct_option_id" text NOT NULL,
    "created_at" timestamptz DEFAULT now(),
    "created_by" uuid,
    "question_image_url" text,
    "solution_video" jsonb
);

-- Add other tables and their definitions here...

-- Enable Row Level Security
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."classes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."class_students" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."assignments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."assignment_results" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."questions" ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Profiles are viewable by everyone" ON "public"."profiles" 
FOR SELECT USING (true);

CREATE POLICY "Users can view their own class enrollments" ON "public"."class_students" 
FOR SELECT USING (
    auth.uid() = student_id OR 
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND is_admin = true
    )
);

CREATE POLICY "view_active_quizzes" ON "public"."assignments" 
FOR SELECT TO authenticated 
USING (is_active = true);

CREATE POLICY "Öğrenciler kendi sonuçlarını görebilir" ON "public"."assignment_results" 
FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Questions are viewable by all users" ON "public"."questions" 
FOR SELECT USING (true);

-- Add other policies here...
