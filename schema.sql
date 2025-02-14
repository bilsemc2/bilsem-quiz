

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


ALTER TYPE "public"."duel_result" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'student',
    'teacher'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."award_badge"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    completion_time interval;
    completed_assignments integer;
BEGIN
    -- İlk Ödev rozetini ver
    IF NOT EXISTS (
        SELECT 1 FROM public.user_badges 
        WHERE user_id = NEW.student_id 
        AND badge_id = (SELECT id FROM public.badges WHERE name = 'İlk Ödev')
    ) THEN
        INSERT INTO public.user_badges (user_id, badge_id)
        SELECT NEW.student_id, id
        FROM public.badges
        WHERE name = 'İlk Ödev';
    END IF;

    -- Mükemmel rozeti için kontrol
    IF NEW.score = NEW.total_questions THEN
        INSERT INTO public.user_badges (user_id, badge_id)
        SELECT NEW.student_id, id
        FROM public.badges
        WHERE name = 'Mükemmel'
        ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;

    -- Çalışkan Öğrenci rozeti için kontrol
    SELECT COUNT(*) INTO completed_assignments
    FROM public.assignment_results
    WHERE student_id = NEW.student_id
    AND status = 'completed';

    IF completed_assignments >= 10 THEN
        INSERT INTO public.user_badges (user_id, badge_id)
        SELECT NEW.student_id, id
        FROM public.badges
        WHERE name = 'Çalışkan Öğrenci'
        ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."award_badge"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."determine_challenge_winner"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
    -- Only proceed if both answers are submitted
    if new.sender_answer is not null and new.receiver_answer is not null then
        -- Set the winner based on correct answers and time
        if new.sender_answer = 'correct' and new.receiver_answer != 'correct' then
            new.winner_id := new.sender_id;
        elsif new.sender_answer != 'correct' and new.receiver_answer = 'correct' then
            new.winner_id := new.receiver_id;
        elsif new.sender_answer = 'correct' and new.receiver_answer = 'correct' then
            -- If both correct, fastest wins
            new.winner_id := case
                when new.sender_time < new.receiver_time then new.sender_id
                else new.receiver_id
            end;
        end if;
        
        -- Mark as completed
        new.status := 'completed';
    end if;
    
    return new;
end;
$$;


ALTER FUNCTION "public"."determine_challenge_winner"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_slug"("title" "text") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $_$
BEGIN
  -- Convert to lowercase and replace Turkish characters
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


ALTER FUNCTION "public"."generate_slug"("title" "text") OWNER TO "postgres";


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


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_referral"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Davet eden kullanıcıya XP ver ve referral sayısını artır
    UPDATE profiles
    SET 
        experience = experience + 50,
        referral_count = COALESCE(referral_count, 0) + 1
    WHERE referral_code = NEW.referred_by;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_referral"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."retroactively_award_badges"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    student record;
    completed_count integer;
    perfect_score boolean;
    fast_completion boolean;
BEGIN
    -- Tüm öğrenciler için kontrol yap
    FOR student IN 
        SELECT DISTINCT student_id 
        FROM public.assignment_results
    LOOP
        -- İlk Ödev rozeti
        IF EXISTS (SELECT 1 FROM public.assignment_results WHERE student_id = student.student_id) THEN
            INSERT INTO public.user_badges (user_id, badge_id, earned_at)
            SELECT 
                student.student_id, 
                b.id,
                (SELECT MIN(completed_at) FROM public.assignment_results WHERE student_id = student.student_id)
            FROM public.badges b
            WHERE b.name = 'İlk Ödev'
            ON CONFLICT (user_id, badge_id) DO NOTHING;
        END IF;

        -- Mükemmel rozeti
        IF EXISTS (
            SELECT 1 
            FROM public.assignment_results 
            WHERE student_id = student.student_id 
            AND score = total_questions
        ) THEN
            INSERT INTO public.user_badges (user_id, badge_id, earned_at)
            SELECT 
                student.student_id, 
                b.id,
                (SELECT MIN(completed_at) 
                 FROM public.assignment_results 
                 WHERE student_id = student.student_id 
                 AND score = total_questions)
            FROM public.badges b
            WHERE b.name = 'Mükemmel'
            ON CONFLICT (user_id, badge_id) DO NOTHING;
        END IF;

        -- Çalışkan Öğrenci rozeti
        SELECT COUNT(*) INTO completed_count
        FROM public.assignment_results
        WHERE student_id = student.student_id
        AND status = 'completed';

        IF completed_count >= 10 THEN
            INSERT INTO public.user_badges (user_id, badge_id, earned_at)
            SELECT 
                student.student_id, 
                b.id,
                (SELECT completed_at 
                 FROM public.assignment_results 
                 WHERE student_id = student.student_id 
                 ORDER BY completed_at 
                 OFFSET 9 LIMIT 1)
            FROM public.badges b
            WHERE b.name = 'Çalışkan Öğrenci'
            ON CONFLICT (user_id, badge_id) DO NOTHING;
        END IF;

    END LOOP;
END;
$$;


ALTER FUNCTION "public"."retroactively_award_badges"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_slug"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  base_slug TEXT;
  new_slug TEXT;
  counter INTEGER;
BEGIN
  -- Generate base slug from title
  base_slug := generate_slug(NEW.title);
  new_slug := base_slug;
  counter := 1;
  
  -- Check for duplicate slugs and append number if needed
  WHILE EXISTS (
    SELECT 1 FROM blog_posts 
    WHERE slug = new_slug 
    AND id != NEW.id
  ) LOOP
    counter := counter + 1;
    new_slug := base_slug || '-' || counter;
  END LOOP;
  
  NEW.slug := new_slug;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_slug"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."admin_messages" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "sender_id" "uuid",
    "receiver_id" "uuid",
    "message" "text" NOT NULL,
    "read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."admin_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."announcements" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "class_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "priority" "text" DEFAULT 'normal'::"text" NOT NULL,
    "expires_at" timestamp with time zone,
    CONSTRAINT "announcements_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'normal'::"text", 'high'::"text"])))
);


ALTER TABLE "public"."announcements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."assignment_results" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "assignment_id" "uuid",
    "student_id" "uuid",
    "score" integer NOT NULL,
    "total_questions" integer NOT NULL,
    "completed_at" timestamp with time zone,
    "answers" "jsonb" NOT NULL,
    "status" "text" NOT NULL,
    "duration_minutes" integer
);


ALTER TABLE "public"."assignment_results" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."assignments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "questions" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "grade" smallint,
    "subject" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    CONSTRAINT "assignments_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'completed'::"text"]))),
    CONSTRAINT "quizzes_grade_check" CHECK (("grade" = ANY (ARRAY[1, 2, 3])))
);


ALTER TABLE "public"."assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."badges" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text" NOT NULL,
    "icon" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "conditions" "jsonb" DEFAULT '{}'::"jsonb",
    "category" "text",
    "points" integer DEFAULT 0
);


ALTER TABLE "public"."badges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."blog_posts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "author_id" "uuid" NOT NULL,
    "published" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "slug" "text"
);


ALTER TABLE "public"."blog_posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."class_students" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "class_id" "uuid" NOT NULL,
    "student_id" "uuid" NOT NULL
);


ALTER TABLE "public"."class_students" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."classes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "grade" integer NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "icon" "text" DEFAULT 'school'::"text" NOT NULL,
    "teacher_id" "uuid",
    "description" "text"
);


ALTER TABLE "public"."classes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contact_messages" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "subject" "text" NOT NULL,
    "message" "text" NOT NULL,
    "status" "text" DEFAULT 'new'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."contact_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."deyimler" (
    "id" integer NOT NULL,
    "deyim" "text" NOT NULL,
    "aciklama" "text" NOT NULL,
    "ornek" "text"
);


ALTER TABLE "public"."deyimler" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."deyimler_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."deyimler_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."deyimler_id_seq" OWNED BY "public"."deyimler"."id";



CREATE TABLE IF NOT EXISTS "public"."drawing_submissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "image_url" "text" NOT NULL,
    "words" "text"[] NOT NULL,
    "feedback" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "scores" "jsonb"
);


ALTER TABLE "public"."drawing_submissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."duels" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "challenger_id" "uuid" NOT NULL,
    "challenged_id" "uuid" NOT NULL,
    "challenger_answer" "text",
    "challenged_answer" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "challenger_answered_at" timestamp with time zone,
    "challenged_answered_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "result" "text",
    "question_data" "jsonb",
    "question_text" "text",
    "question_image_url" "text",
    "question_options" "jsonb",
    "correct_option_id" "text",
    "solution_video" "text",
    CONSTRAINT "duels_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'in_progress'::"text", 'completed'::"text"])))
);


ALTER TABLE "public"."duels" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."image_analyses" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "image_url" "text" NOT NULL,
    "analysis_result" "jsonb" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."image_analyses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    CONSTRAINT "notifications_type_check" CHECK (("type" = ANY (ARRAY['users'::"text", 'classes'::"text", 'quizzes'::"text", 'settings'::"text"])))
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "name" "text" NOT NULL,
    "school" "text" NOT NULL,
    "grade" "text",
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "points" integer DEFAULT 0,
    "experience" integer DEFAULT 0,
    "is_admin" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "full_name" "text",
    "is_vip" boolean DEFAULT false,
    "referral_code" "text",
    "referral_count" integer DEFAULT 0,
    "referred_by" "text",
    "last_seen" timestamp with time zone,
    "role" "public"."user_role" DEFAULT 'student'::"public"."user_role" NOT NULL,
    CONSTRAINT "check_teacher_grade" CHECK (((("role" = 'teacher'::"public"."user_role") AND ("grade" IS NULL)) OR (("role" = 'student'::"public"."user_role") AND ("grade" IS NOT NULL))))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."puzzle_ratings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "puzzle_id" "uuid",
    "user_id" "uuid",
    "rating" integer,
    "comment" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "puzzle_ratings_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."puzzle_ratings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."puzzles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "title" "text" NOT NULL,
    "grid" "jsonb" NOT NULL,
    "created_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "approved" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."puzzles" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."puzzle_stats" WITH ("security_invoker"='on') AS
 SELECT "p"."id",
    "p"."title",
    "p"."created_by",
    "p"."created_at",
    COALESCE("avg"("pr"."rating"), (0)::numeric) AS "average_rating",
    "count"("pr"."id") AS "total_ratings",
    "prof"."name" AS "creator_name"
   FROM (("public"."puzzles" "p"
     LEFT JOIN "public"."puzzle_ratings" "pr" ON (("p"."id" = "pr"."puzzle_id")))
     LEFT JOIN "public"."profiles" "prof" ON (("p"."created_by" = "prof"."id")))
  GROUP BY "p"."id", "p"."title", "p"."created_by", "p"."created_at", "prof"."name";


ALTER TABLE "public"."puzzle_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."questions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "text" "text",
    "image_url" "text",
    "options" "jsonb" NOT NULL,
    "correct_option_id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "solution_video" "jsonb"
);


ALTER TABLE "public"."questions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quiz_class_assignments" (
    "quiz_id" "uuid" NOT NULL,
    "class_id" "uuid" NOT NULL,
    "assigned_at" timestamp with time zone DEFAULT "now"(),
    "assigned_by" "uuid",
    "due_date" timestamp with time zone
);


ALTER TABLE "public"."quiz_class_assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quiz_results" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "score" integer NOT NULL,
    "questions_answered" integer NOT NULL,
    "correct_answers" integer NOT NULL,
    "completed_at" timestamp with time zone NOT NULL,
    "title" "text",
    "subject" "text",
    "grade" integer,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "quiz_id" "text",
    "user_answers" "jsonb"
);


ALTER TABLE "public"."quiz_results" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quizizz_codes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "class_id" "uuid",
    "scheduled_time" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "is_active" boolean DEFAULT true
);


ALTER TABLE "public"."quizizz_codes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_badges" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "badge_id" "uuid" NOT NULL,
    "earned_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."user_badges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_quizizz_codes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "code_id" "uuid",
    "seen_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."user_quizizz_codes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_stats" (
    "user_id" "uuid" NOT NULL,
    "points" integer DEFAULT 0,
    "experience" integer DEFAULT 0,
    "level" integer DEFAULT 1,
    "quizzes_completed" integer DEFAULT 0
);


ALTER TABLE "public"."user_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."xp_requirements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "page_path" "text" NOT NULL,
    "required_xp" integer NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."xp_requirements" OWNER TO "postgres";


ALTER TABLE ONLY "public"."deyimler" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."deyimler_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."admin_messages"
    ADD CONSTRAINT "admin_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."announcements"
    ADD CONSTRAINT "announcements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."badges"
    ADD CONSTRAINT "badges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blog_posts"
    ADD CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."class_students"
    ADD CONSTRAINT "class_students_class_id_student_id_key" UNIQUE ("class_id", "student_id");



ALTER TABLE ONLY "public"."class_students"
    ADD CONSTRAINT "class_students_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."classes"
    ADD CONSTRAINT "classes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contact_messages"
    ADD CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deyimler"
    ADD CONSTRAINT "deyimler_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."drawing_submissions"
    ADD CONSTRAINT "drawing_submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."duels"
    ADD CONSTRAINT "duels_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."image_analyses"
    ADD CONSTRAINT "image_analyses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_referral_code_key" UNIQUE ("referral_code");



ALTER TABLE ONLY "public"."puzzle_ratings"
    ADD CONSTRAINT "puzzle_ratings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."puzzle_ratings"
    ADD CONSTRAINT "puzzle_ratings_puzzle_id_user_id_key" UNIQUE ("puzzle_id", "user_id");



ALTER TABLE ONLY "public"."puzzles"
    ADD CONSTRAINT "puzzles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."questions"
    ADD CONSTRAINT "questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quiz_class_assignments"
    ADD CONSTRAINT "quiz_class_assignments_pkey" PRIMARY KEY ("quiz_id", "class_id");



ALTER TABLE ONLY "public"."quiz_results"
    ADD CONSTRAINT "quiz_results_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quizizz_codes"
    ADD CONSTRAINT "quizizz_codes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assignments"
    ADD CONSTRAINT "quizzes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_badges"
    ADD CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_badges"
    ADD CONSTRAINT "user_badges_user_badge_unique" UNIQUE ("user_id", "badge_id");



ALTER TABLE ONLY "public"."user_quizizz_codes"
    ADD CONSTRAINT "user_quizizz_codes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_quizizz_codes"
    ADD CONSTRAINT "user_quizizz_codes_user_id_code_id_key" UNIQUE ("user_id", "code_id");



ALTER TABLE ONLY "public"."user_stats"
    ADD CONSTRAINT "user_stats_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."xp_requirements"
    ADD CONSTRAINT "xp_requirements_pkey" PRIMARY KEY ("id");



CREATE UNIQUE INDEX "blog_posts_slug_idx" ON "public"."blog_posts" USING "btree" ("slug");



CREATE INDEX "classes_created_by_idx" ON "public"."classes" USING "btree" ("created_by");



CREATE INDEX "classes_grade_idx" ON "public"."classes" USING "btree" ("grade");



CREATE INDEX "idx_class_students_class_id" ON "public"."class_students" USING "btree" ("class_id");



CREATE INDEX "idx_class_students_student_id" ON "public"."class_students" USING "btree" ("student_id");



CREATE INDEX "puzzles_created_at_idx" ON "public"."puzzles" USING "btree" ("created_at" DESC);



CREATE INDEX "quiz_results_quiz_id_idx" ON "public"."quiz_results" USING "btree" ("quiz_id");



CREATE INDEX "quiz_results_user_id_idx" ON "public"."quiz_results" USING "btree" ("user_id");



CREATE INDEX "quizizz_codes_class_id_idx" ON "public"."quizizz_codes" USING "btree" ("class_id");



CREATE INDEX "quizizz_codes_scheduled_time_idx" ON "public"."quizizz_codes" USING "btree" ("scheduled_time");



CREATE OR REPLACE TRIGGER "before_insert_update_blog_posts" BEFORE INSERT OR UPDATE OF "title" ON "public"."blog_posts" FOR EACH ROW EXECUTE FUNCTION "public"."update_slug"();



CREATE OR REPLACE TRIGGER "check_badges_after_assignment" AFTER INSERT ON "public"."assignment_results" FOR EACH ROW EXECUTE FUNCTION "public"."award_badge"();



CREATE OR REPLACE TRIGGER "handle_notifications_updated_at" BEFORE UPDATE ON "public"."notifications" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "on_profiles_updated" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "on_referral" AFTER UPDATE OF "referred_by" ON "public"."profiles" FOR EACH ROW WHEN ((("new"."referred_by" IS NOT NULL) AND (("old"."referred_by" IS NULL) OR ("old"."referred_by" IS DISTINCT FROM "new"."referred_by")))) EXECUTE FUNCTION "public"."handle_referral"();



CREATE OR REPLACE TRIGGER "update_puzzles_updated_at" BEFORE UPDATE ON "public"."puzzles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_quizzes_updated_at" BEFORE UPDATE ON "public"."assignments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_xp_requirements_updated_at" BEFORE UPDATE ON "public"."xp_requirements" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."admin_messages"
    ADD CONSTRAINT "admin_messages_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."admin_messages"
    ADD CONSTRAINT "admin_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."announcements"
    ADD CONSTRAINT "announcements_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id");



ALTER TABLE ONLY "public"."announcements"
    ADD CONSTRAINT "announcements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."assignment_results"
    ADD CONSTRAINT "assignment_results_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "public"."assignments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assignment_results"
    ADD CONSTRAINT "assignment_results_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."blog_posts"
    ADD CONSTRAINT "blog_posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."class_students"
    ADD CONSTRAINT "class_students_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."class_students"
    ADD CONSTRAINT "class_students_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."classes"
    ADD CONSTRAINT "classes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."classes"
    ADD CONSTRAINT "classes_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."drawing_submissions"
    ADD CONSTRAINT "drawing_submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."duels"
    ADD CONSTRAINT "duels_challenged_id_fkey" FOREIGN KEY ("challenged_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."duels"
    ADD CONSTRAINT "duels_challenger_id_fkey" FOREIGN KEY ("challenger_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."quiz_results"
    ADD CONSTRAINT "fk_quiz_results_profiles" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."image_analyses"
    ADD CONSTRAINT "image_analyses_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_referred_by_fkey" FOREIGN KEY ("referred_by") REFERENCES "public"."profiles"("referral_code") ON UPDATE CASCADE;



ALTER TABLE ONLY "public"."puzzle_ratings"
    ADD CONSTRAINT "puzzle_ratings_puzzle_id_fkey" FOREIGN KEY ("puzzle_id") REFERENCES "public"."puzzles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."puzzle_ratings"
    ADD CONSTRAINT "puzzle_ratings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."puzzles"
    ADD CONSTRAINT "puzzles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."questions"
    ADD CONSTRAINT "questions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."quiz_class_assignments"
    ADD CONSTRAINT "quiz_class_assignments_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."quiz_class_assignments"
    ADD CONSTRAINT "quiz_class_assignments_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quiz_class_assignments"
    ADD CONSTRAINT "quiz_class_assignments_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "public"."assignments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quiz_results"
    ADD CONSTRAINT "quiz_results_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."quizizz_codes"
    ADD CONSTRAINT "quizizz_codes_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quizizz_codes"
    ADD CONSTRAINT "quizizz_codes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assignments"
    ADD CONSTRAINT "quizzes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_badges"
    ADD CONSTRAINT "user_badges_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "public"."badges"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_badges"
    ADD CONSTRAINT "user_badges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_quizizz_codes"
    ADD CONSTRAINT "user_quizizz_codes_code_id_fkey" FOREIGN KEY ("code_id") REFERENCES "public"."quizizz_codes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_quizizz_codes"
    ADD CONSTRAINT "user_quizizz_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_stats"
    ADD CONSTRAINT "user_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admin users can view all quiz results" ON "public"."quiz_results" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



CREATE POLICY "Admins can create notifications" ON "public"."notifications" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



CREATE POLICY "Admins can manage all puzzles" ON "public"."puzzles" USING ((("auth"."jwt"() ->> 'email'::"text") = 'yaprakyesili@msn.com'::"text"));



CREATE POLICY "Admins can manage quizizz codes" ON "public"."quizizz_codes" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



CREATE POLICY "Admins can read all blog posts" ON "public"."blog_posts" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



CREATE POLICY "Admins can read all messages" ON "public"."admin_messages" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



CREATE POLICY "Admins can send messages" ON "public"."admin_messages" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



CREATE POLICY "Allow delete access to admin users" ON "public"."classes" FOR DELETE USING ((("auth"."jwt"() ->> 'email'::"text") = 'yaprakyesili@msn.com'::"text"));



CREATE POLICY "Allow insert access to admin users" ON "public"."classes" FOR INSERT WITH CHECK ((("auth"."jwt"() ->> 'email'::"text") = 'yaprakyesili@msn.com'::"text"));



CREATE POLICY "Allow public referral code queries" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Allow read access to all users" ON "public"."classes" FOR SELECT USING (true);



CREATE POLICY "Allow update access to admin users" ON "public"."classes" FOR UPDATE USING ((("auth"."jwt"() ->> 'email'::"text") = 'yaprakyesili@msn.com'::"text"));



CREATE POLICY "Allow user to insert own assignments" ON "public"."assignments" FOR INSERT TO "authenticated" WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "Allow user to read own assignments" ON "public"."assignments" FOR SELECT TO "authenticated" USING (("created_by" = "auth"."uid"()));



CREATE POLICY "Anyone can insert contact messages" ON "public"."contact_messages" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can read published blog posts" ON "public"."blog_posts" FOR SELECT USING (("published" = true));



CREATE POLICY "Anyone can view approved puzzles" ON "public"."puzzles" FOR SELECT USING (("approved" = true));



CREATE POLICY "Atamaları sadece öğretmenler silebilir" ON "public"."quiz_class_assignments" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."classes"
  WHERE (("classes"."id" = "quiz_class_assignments"."class_id") AND ("classes"."teacher_id" = "auth"."uid"())))));



CREATE POLICY "Atamaları sadece öğretmenler yapabilir" ON "public"."quiz_class_assignments" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."classes"
  WHERE (("classes"."id" = "quiz_class_assignments"."class_id") AND ("classes"."teacher_id" = "auth"."uid"())))));



CREATE POLICY "Authenticated users can create questions" ON "public"."questions" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can view quizizz codes" ON "public"."quizizz_codes" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Badges are viewable by everyone" ON "public"."badges" FOR SELECT USING (true);



CREATE POLICY "Deyimler admin politikası" ON "public"."deyimler" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



CREATE POLICY "Deyimler okuma politikası" ON "public"."deyimler" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."experience" >= 1000)))));



CREATE POLICY "Enable insert access for authenticated users only" ON "public"."profiles" FOR INSERT WITH CHECK ((("auth"."role"() = 'authenticated'::"text") AND ("auth"."uid"() = "id")));



CREATE POLICY "Enable insert for authenticated users" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Enable insert for authenticated users only" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Enable read access for all profiles" ON "public"."profiles" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Enable read access for users" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "id"));



CREATE POLICY "Herkes sınıf öğrencilerini görebilir" ON "public"."class_students" FOR SELECT USING (true);



CREATE POLICY "Herkes xp gereksinimlerini okuyabilir" ON "public"."xp_requirements" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Only admins can delete blog posts" ON "public"."blog_posts" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



CREATE POLICY "Only admins can delete class enrollments" ON "public"."class_students" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



CREATE POLICY "Only admins can insert badges" ON "public"."badges" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



CREATE POLICY "Only admins can insert blog posts" ON "public"."blog_posts" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



CREATE POLICY "Only admins can insert class enrollments" ON "public"."class_students" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



CREATE POLICY "Only admins can update badges" ON "public"."badges" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



CREATE POLICY "Only admins can update blog posts" ON "public"."blog_posts" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



CREATE POLICY "Only admins can update class enrollments" ON "public"."class_students" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



CREATE POLICY "Only admins can update contact messages" ON "public"."contact_messages" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



CREATE POLICY "Only admins can view contact messages" ON "public"."contact_messages" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



CREATE POLICY "Only system can insert user_badges" ON "public"."user_badges" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



CREATE POLICY "Profiles are viewable by everyone" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Profiles are viewable by users who created them." ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Questions are viewable by all users" ON "public"."questions" FOR SELECT USING (true);



CREATE POLICY "Sadece adminler xp gereksinimlerini düzenleyebilir" ON "public"."xp_requirements" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



CREATE POLICY "Users can create duels" ON "public"."duels" FOR INSERT WITH CHECK (("auth"."uid"() = "challenger_id"));



CREATE POLICY "Users can create own analyses" ON "public"."image_analyses" FOR INSERT WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can delete own analyses" ON "public"."image_analyses" FOR DELETE USING (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can delete their own messages" ON "public"."admin_messages" FOR DELETE USING (("auth"."uid"() = "receiver_id"));



CREATE POLICY "Users can delete their own puzzles" ON "public"."puzzles" FOR DELETE USING (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can insert own ratings" ON "public"."puzzle_ratings" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own puzzles" ON "public"."puzzles" FOR INSERT WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can insert their own quiz results" ON "public"."quiz_results" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own stats." ON "public"."user_stats" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own submissions" ON "public"."drawing_submissions" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can mark their messages as read" ON "public"."admin_messages" FOR UPDATE USING (("auth"."uid"() = "receiver_id")) WITH CHECK (("auth"."uid"() = "receiver_id"));



CREATE POLICY "Users can read their own messages" ON "public"."admin_messages" FOR SELECT USING (("auth"."uid"() = "receiver_id"));



CREATE POLICY "Users can read their own notifications" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own ratings" ON "public"."puzzle_ratings" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own duels" ON "public"."duels" FOR UPDATE USING ((("auth"."uid"() = "challenger_id") OR ("auth"."uid"() = "challenged_id")));



CREATE POLICY "Users can update their own notifications" ON "public"."notifications" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own puzzles" ON "public"."puzzles" FOR UPDATE USING (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can update their own stats." ON "public"."user_stats" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view all submissions" ON "public"."drawing_submissions" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Users can view own analyses" ON "public"."image_analyses" FOR SELECT USING (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can view own ratings" ON "public"."puzzle_ratings" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own badges" ON "public"."user_badges" FOR SELECT USING ((("auth"."uid"() = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true))))));



CREATE POLICY "Users can view their own class enrollments" ON "public"."class_students" FOR SELECT USING ((("auth"."uid"() = "student_id") OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true))))));



CREATE POLICY "Users can view their own duels" ON "public"."duels" FOR SELECT USING ((("auth"."uid"() = "challenger_id") OR ("auth"."uid"() = "challenged_id")));



CREATE POLICY "Users can view their own puzzles" ON "public"."puzzles" FOR SELECT USING (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can view their own quiz results" ON "public"."quiz_results" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own stats." ON "public"."user_stats" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "XP gereksinimleri herkes tarafından görüntülenebilir" ON "public"."xp_requirements" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "XP gereksinimleri sadece adminler tarafından düzenlenebilir" ON "public"."xp_requirements" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



CREATE POLICY "XP gereksinimleri sadece adminler tarafından güncellenebilir" ON "public"."xp_requirements" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



CREATE POLICY "XP gereksinimleri sadece adminler tarafından silinebilir" ON "public"."xp_requirements" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



CREATE POLICY "admin_all" ON "public"."assignments" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



ALTER TABLE "public"."admin_messages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "admin_update_any_profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "profiles_1"
  WHERE (("profiles_1"."id" = "auth"."uid"()) AND ("profiles_1"."is_admin" = true)))));



CREATE POLICY "admins_manage_all_notifications" ON "public"."notifications" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



ALTER TABLE "public"."announcements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."assignment_results" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."assignments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."badges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."blog_posts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "class_members_can_view_announcements" ON "public"."announcements" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."class_students"
  WHERE (("class_students"."class_id" = "announcements"."class_id") AND ("class_students"."student_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."classes"
  WHERE (("classes"."id" = "announcements"."class_id") AND ("classes"."teacher_id" = "auth"."uid"()))))));



ALTER TABLE "public"."class_students" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."classes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contact_messages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "delete_own_questions" ON "public"."questions" FOR DELETE USING (("created_by" = "auth"."uid"()));



ALTER TABLE "public"."deyimler" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."drawing_submissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."duels" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."image_analyses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."puzzle_ratings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."puzzles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."questions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quiz_class_assignments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "quiz_class_assignments_delete_policy" ON "public"."quiz_class_assignments" FOR DELETE USING (true);



CREATE POLICY "quiz_class_assignments_insert_policy" ON "public"."quiz_class_assignments" FOR INSERT WITH CHECK (true);



CREATE POLICY "quiz_class_assignments_select_policy" ON "public"."quiz_class_assignments" FOR SELECT USING (true);



ALTER TABLE "public"."quiz_results" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quizizz_codes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "teachers_assign_to_referred_students" ON "public"."quiz_class_assignments" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM (("public"."profiles" "teacher"
     JOIN "public"."profiles" "student" ON (("student"."referred_by" = "teacher"."referral_code")))
     JOIN "public"."class_students" "cs" ON (("cs"."student_id" = "student"."id")))
  WHERE (("teacher"."id" = "auth"."uid"()) AND ("teacher"."role" = 'teacher'::"public"."user_role") AND ("cs"."class_id" = "quiz_class_assignments"."class_id")))));



CREATE POLICY "teachers_can_create_announcements" ON "public"."announcements" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."classes"
  WHERE (("classes"."id" = "announcements"."class_id") AND ("classes"."teacher_id" = "auth"."uid"())))));



CREATE POLICY "teachers_can_update_own_announcements" ON "public"."announcements" FOR UPDATE TO "authenticated" USING (("created_by" = "auth"."uid"())) WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "teachers_create_class_notifications" ON "public"."notifications" FOR INSERT WITH CHECK ((("type" = 'classes'::"text") AND (EXISTS ( SELECT 1
   FROM ("public"."classes" "c"
     JOIN "public"."class_students" "cs" ON (("c"."id" = "cs"."class_id")))
  WHERE (("c"."teacher_id" = "auth"."uid"()) AND ("cs"."student_id" = "notifications"."user_id"))))));



CREATE POLICY "teachers_manage_assignments" ON "public"."assignments" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'teacher'::"public"."user_role")))));



CREATE POLICY "teachers_manage_classes" ON "public"."classes" USING (("auth"."uid"() = "teacher_id"));



CREATE POLICY "teachers_manage_own_profile" ON "public"."profiles" FOR UPDATE USING ((("auth"."uid"() = "id") AND ("role" = 'teacher'::"public"."user_role"))) WITH CHECK ((("auth"."uid"() = "id") AND ("role" = 'teacher'::"public"."user_role")));



CREATE POLICY "teachers_notify_referred_students" ON "public"."notifications" FOR INSERT WITH CHECK ((("type" = 'classes'::"text") AND (EXISTS ( SELECT 1
   FROM ("public"."profiles" "teacher"
     JOIN "public"."profiles" "student" ON (("student"."referred_by" = "teacher"."referral_code")))
  WHERE (("teacher"."id" = "auth"."uid"()) AND ("teacher"."role" = 'teacher'::"public"."user_role") AND ("student"."id" = "notifications"."user_id"))))));



CREATE POLICY "teachers_view_referred_student_results" ON "public"."assignment_results" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."profiles" "teacher"
     JOIN "public"."profiles" "student" ON (("student"."referred_by" = "teacher"."referral_code")))
  WHERE (("teacher"."id" = "auth"."uid"()) AND ("teacher"."role" = 'teacher'::"public"."user_role") AND ("student"."id" = "assignment_results"."student_id")))));



CREATE POLICY "teachers_view_results" ON "public"."assignment_results" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."classes" "c"
     JOIN "public"."class_students" "cs" ON (("c"."id" = "cs"."class_id")))
  WHERE (("c"."teacher_id" = "auth"."uid"()) AND ("cs"."student_id" = "assignment_results"."student_id")))));



CREATE POLICY "update_own_questions" ON "public"."questions" FOR UPDATE USING (("created_by" = "auth"."uid"()));



ALTER TABLE "public"."user_badges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_quizizz_codes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_stats" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_mark_notifications_as_read" ON "public"."notifications" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK ((("auth"."uid"() = "user_id") AND ("read" IS TRUE)));



CREATE POLICY "users_update_own_profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "users_view_own_notifications" ON "public"."notifications" FOR SELECT USING ((("auth"."uid"() = "user_id") OR ("user_id" IS NULL)));



CREATE POLICY "view_active_quizzes" ON "public"."assignments" FOR SELECT TO "authenticated" USING (("is_active" = true));



ALTER TABLE "public"."xp_requirements" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Öğrenciler kendi sonuçlarını ekleyebilir" ON "public"."assignment_results" FOR INSERT WITH CHECK ((("auth"."uid"() = "student_id") AND (EXISTS ( SELECT 1
   FROM "public"."class_students" "cs"
  WHERE ("cs"."student_id" = "auth"."uid"())))));



CREATE POLICY "Öğrenciler kendi sonuçlarını görebilir" ON "public"."assignment_results" FOR SELECT USING (("auth"."uid"() = "student_id"));



CREATE POLICY "Öğretmenler sınıflarındaki sonuçları görebilir" ON "public"."assignment_results" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."classes" "c"
     JOIN "public"."class_students" "cs" ON (("cs"."class_id" = "c"."id")))
  WHERE (("cs"."student_id" = "assignment_results"."student_id") AND ("c"."teacher_id" = "auth"."uid"())))));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


CREATE PUBLICATION "supabase_realtime_messages_publication" WITH (publish = 'insert, update, delete, truncate');


ALTER PUBLICATION "supabase_realtime_messages_publication" OWNER TO "supabase_admin";





GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";









































































































































































































GRANT ALL ON FUNCTION "public"."award_badge"() TO "anon";
GRANT ALL ON FUNCTION "public"."award_badge"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."award_badge"() TO "service_role";



GRANT ALL ON FUNCTION "public"."determine_challenge_winner"() TO "anon";
GRANT ALL ON FUNCTION "public"."determine_challenge_winner"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."determine_challenge_winner"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_slug"("title" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_slug"("title" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_slug"("title" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_referral"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_referral"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_referral"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."retroactively_award_badges"() TO "anon";
GRANT ALL ON FUNCTION "public"."retroactively_award_badges"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."retroactively_award_badges"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_slug"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_slug"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_slug"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";
























GRANT ALL ON TABLE "public"."admin_messages" TO "anon";
GRANT ALL ON TABLE "public"."admin_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_messages" TO "service_role";



GRANT ALL ON TABLE "public"."announcements" TO "anon";
GRANT ALL ON TABLE "public"."announcements" TO "authenticated";
GRANT ALL ON TABLE "public"."announcements" TO "service_role";



GRANT ALL ON TABLE "public"."assignment_results" TO "anon";
GRANT ALL ON TABLE "public"."assignment_results" TO "authenticated";
GRANT ALL ON TABLE "public"."assignment_results" TO "service_role";



GRANT ALL ON TABLE "public"."assignments" TO "anon";
GRANT ALL ON TABLE "public"."assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."assignments" TO "service_role";



GRANT ALL ON TABLE "public"."badges" TO "anon";
GRANT ALL ON TABLE "public"."badges" TO "authenticated";
GRANT ALL ON TABLE "public"."badges" TO "service_role";



GRANT ALL ON TABLE "public"."blog_posts" TO "anon";
GRANT ALL ON TABLE "public"."blog_posts" TO "authenticated";
GRANT ALL ON TABLE "public"."blog_posts" TO "service_role";



GRANT ALL ON TABLE "public"."class_students" TO "anon";
GRANT ALL ON TABLE "public"."class_students" TO "authenticated";
GRANT ALL ON TABLE "public"."class_students" TO "service_role";



GRANT ALL ON TABLE "public"."classes" TO "anon";
GRANT ALL ON TABLE "public"."classes" TO "authenticated";
GRANT ALL ON TABLE "public"."classes" TO "service_role";



GRANT ALL ON TABLE "public"."contact_messages" TO "anon";
GRANT ALL ON TABLE "public"."contact_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."contact_messages" TO "service_role";



GRANT ALL ON TABLE "public"."deyimler" TO "anon";
GRANT ALL ON TABLE "public"."deyimler" TO "authenticated";
GRANT ALL ON TABLE "public"."deyimler" TO "service_role";



GRANT ALL ON SEQUENCE "public"."deyimler_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."deyimler_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."deyimler_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."drawing_submissions" TO "anon";
GRANT ALL ON TABLE "public"."drawing_submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."drawing_submissions" TO "service_role";



GRANT ALL ON TABLE "public"."duels" TO "anon";
GRANT ALL ON TABLE "public"."duels" TO "authenticated";
GRANT ALL ON TABLE "public"."duels" TO "service_role";



GRANT ALL ON TABLE "public"."image_analyses" TO "anon";
GRANT ALL ON TABLE "public"."image_analyses" TO "authenticated";
GRANT ALL ON TABLE "public"."image_analyses" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."puzzle_ratings" TO "anon";
GRANT ALL ON TABLE "public"."puzzle_ratings" TO "authenticated";
GRANT ALL ON TABLE "public"."puzzle_ratings" TO "service_role";



GRANT ALL ON TABLE "public"."puzzles" TO "anon";
GRANT ALL ON TABLE "public"."puzzles" TO "authenticated";
GRANT ALL ON TABLE "public"."puzzles" TO "service_role";



GRANT ALL ON TABLE "public"."puzzle_stats" TO "anon";
GRANT ALL ON TABLE "public"."puzzle_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."puzzle_stats" TO "service_role";



GRANT ALL ON TABLE "public"."questions" TO "anon";
GRANT ALL ON TABLE "public"."questions" TO "authenticated";
GRANT ALL ON TABLE "public"."questions" TO "service_role";



GRANT ALL ON TABLE "public"."quiz_class_assignments" TO "anon";
GRANT ALL ON TABLE "public"."quiz_class_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."quiz_class_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."quiz_results" TO "anon";
GRANT ALL ON TABLE "public"."quiz_results" TO "authenticated";
GRANT ALL ON TABLE "public"."quiz_results" TO "service_role";



GRANT ALL ON TABLE "public"."quizizz_codes" TO "anon";
GRANT ALL ON TABLE "public"."quizizz_codes" TO "authenticated";
GRANT ALL ON TABLE "public"."quizizz_codes" TO "service_role";



GRANT ALL ON TABLE "public"."user_badges" TO "anon";
GRANT ALL ON TABLE "public"."user_badges" TO "authenticated";
GRANT ALL ON TABLE "public"."user_badges" TO "service_role";



GRANT ALL ON TABLE "public"."user_quizizz_codes" TO "anon";
GRANT ALL ON TABLE "public"."user_quizizz_codes" TO "authenticated";
GRANT ALL ON TABLE "public"."user_quizizz_codes" TO "service_role";



GRANT ALL ON TABLE "public"."user_stats" TO "anon";
GRANT ALL ON TABLE "public"."user_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."user_stats" TO "service_role";



GRANT ALL ON TABLE "public"."xp_requirements" TO "anon";
GRANT ALL ON TABLE "public"."xp_requirements" TO "authenticated";
GRANT ALL ON TABLE "public"."xp_requirements" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
