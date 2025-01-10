create type "public"."duel_result" as enum ('draw', 'challenger_won', 'challenged_won');

create table "public"."admin_messages" (
    "id" uuid not null default uuid_generate_v4(),
    "sender_id" uuid,
    "receiver_id" uuid,
    "message" text not null,
    "read" boolean default false,
    "created_at" timestamp with time zone default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone default timezone('utc'::text, now())
);


alter table "public"."admin_messages" enable row level security;

create table "public"."blog_posts" (
    "id" uuid not null default uuid_generate_v4(),
    "title" text not null,
    "content" text not null,
    "author_id" uuid not null,
    "published" boolean default false,
    "created_at" timestamp with time zone default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone default timezone('utc'::text, now()),
    "slug" text
);


alter table "public"."blog_posts" enable row level security;

create table "public"."class_students" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "class_id" uuid not null,
    "student_id" uuid not null
);


alter table "public"."class_students" enable row level security;

create table "public"."classes" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "grade" integer not null,
    "created_by" uuid,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "icon" text not null default 'school'::text,
    "teacher_id" uuid
);


alter table "public"."classes" enable row level security;

create table "public"."drawing_submissions" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "image_url" text not null,
    "words" text[] not null,
    "feedback" text,
    "created_at" timestamp with time zone not null default now(),
    "scores" jsonb
);


alter table "public"."drawing_submissions" enable row level security;

create table "public"."duels" (
    "id" uuid not null default uuid_generate_v4(),
    "challenger_id" uuid not null,
    "challenged_id" uuid not null,
    "challenger_answer" text,
    "challenged_answer" text,
    "status" text default 'pending'::text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "challenger_answered_at" timestamp with time zone,
    "challenged_answered_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "result" text,
    "question_data" jsonb,
    "question_text" text,
    "question_image_url" text,
    "question_options" jsonb,
    "correct_option_id" text,
    "solution_video" text
);


alter table "public"."duels" enable row level security;

create table "public"."image_analyses" (
    "id" uuid not null default uuid_generate_v4(),
    "image_url" text not null,
    "analysis_result" jsonb not null,
    "created_by" uuid,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now())
);


alter table "public"."image_analyses" enable row level security;

create table "public"."profiles" (
    "id" uuid not null,
    "email" text not null,
    "name" text not null,
    "school" text not null,
    "grade" text not null,
    "avatar_url" text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "points" integer default 0,
    "experience" integer default 0,
    "is_admin" boolean default false,
    "is_active" boolean default true,
    "full_name" text,
    "is_vip" boolean default false,
    "referral_code" text,
    "referral_count" integer default 0,
    "referred_by" text,
    "last_seen" timestamp with time zone
);


alter table "public"."profiles" enable row level security;

create table "public"."puzzle_ratings" (
    "id" uuid not null default uuid_generate_v4(),
    "puzzle_id" uuid,
    "user_id" uuid,
    "rating" integer,
    "comment" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."puzzle_ratings" enable row level security;

create table "public"."puzzles" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "title" text not null,
    "grid" jsonb not null,
    "created_by" uuid,
    "updated_at" timestamp with time zone default timezone('utc'::text, now()),
    "approved" boolean not null default false
);


alter table "public"."puzzles" enable row level security;

create table "public"."questions" (
    "id" uuid not null default uuid_generate_v4(),
    "text" text,
    "image_url" text,
    "options" jsonb not null,
    "correct_option_id" text not null,
    "created_at" timestamp with time zone default now(),
    "created_by" uuid,
    "question_image_url" text,
    "solution_video" jsonb
);


alter table "public"."questions" enable row level security;

create table "public"."quiz_results" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid,
    "score" integer not null,
    "questions_answered" integer not null,
    "correct_answers" integer not null,
    "completed_at" timestamp with time zone not null,
    "title" text,
    "subject" text,
    "grade" integer,
    "created_at" timestamp with time zone default timezone('utc'::text, now()),
    "quiz_id" text,
    "user_answers" jsonb
);


alter table "public"."quiz_results" enable row level security;

create table "public"."quizizz_codes" (
    "id" uuid not null default gen_random_uuid(),
    "code" text not null,
    "class_id" uuid,
    "scheduled_time" timestamp with time zone not null,
    "created_at" timestamp with time zone default now(),
    "created_by" uuid,
    "is_active" boolean default true
);


alter table "public"."quizizz_codes" enable row level security;

create table "public"."quizzes" (
    "id" uuid not null default uuid_generate_v4(),
    "title" text not null,
    "description" text,
    "questions" jsonb not null default '[]'::jsonb,
    "is_active" boolean default true,
    "created_by" uuid,
    "created_at" timestamp with time zone default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone default timezone('utc'::text, now()),
    "grade" smallint,
    "subject" text
);


alter table "public"."quizzes" enable row level security;

create table "public"."user_quizizz_codes" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid,
    "code_id" uuid,
    "seen_at" timestamp with time zone default timezone('utc'::text, now())
);


alter table "public"."user_quizizz_codes" enable row level security;

create table "public"."user_stats" (
    "user_id" uuid not null,
    "points" integer default 0,
    "experience" integer default 0,
    "level" integer default 1,
    "quizzes_completed" integer default 0
);


alter table "public"."user_stats" enable row level security;

create table "public"."xp_requirements" (
    "id" uuid not null default gen_random_uuid(),
    "page_path" text not null,
    "required_xp" integer not null,
    "description" text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);


alter table "public"."xp_requirements" enable row level security;

CREATE UNIQUE INDEX admin_messages_pkey ON public.admin_messages USING btree (id);

CREATE UNIQUE INDEX blog_posts_pkey ON public.blog_posts USING btree (id);

CREATE UNIQUE INDEX blog_posts_slug_idx ON public.blog_posts USING btree (slug);

CREATE UNIQUE INDEX class_students_class_id_student_id_key ON public.class_students USING btree (class_id, student_id);

CREATE UNIQUE INDEX class_students_pkey ON public.class_students USING btree (id);

CREATE INDEX classes_created_by_idx ON public.classes USING btree (created_by);

CREATE INDEX classes_grade_idx ON public.classes USING btree (grade);

CREATE UNIQUE INDEX classes_pkey ON public.classes USING btree (id);

CREATE UNIQUE INDEX drawing_submissions_pkey ON public.drawing_submissions USING btree (id);

CREATE UNIQUE INDEX duels_pkey ON public.duels USING btree (id);

CREATE INDEX idx_class_students_class_id ON public.class_students USING btree (class_id);

CREATE INDEX idx_class_students_student_id ON public.class_students USING btree (student_id);

CREATE UNIQUE INDEX image_analyses_pkey ON public.image_analyses USING btree (id);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE UNIQUE INDEX profiles_referral_code_key ON public.profiles USING btree (referral_code);

CREATE UNIQUE INDEX puzzle_ratings_pkey ON public.puzzle_ratings USING btree (id);

CREATE UNIQUE INDEX puzzle_ratings_puzzle_id_user_id_key ON public.puzzle_ratings USING btree (puzzle_id, user_id);

CREATE INDEX puzzles_created_at_idx ON public.puzzles USING btree (created_at DESC);

CREATE UNIQUE INDEX puzzles_pkey ON public.puzzles USING btree (id);

CREATE UNIQUE INDEX questions_pkey ON public.questions USING btree (id);

CREATE UNIQUE INDEX quiz_results_pkey ON public.quiz_results USING btree (id);

CREATE INDEX quiz_results_quiz_id_idx ON public.quiz_results USING btree (quiz_id);

CREATE INDEX quiz_results_user_id_idx ON public.quiz_results USING btree (user_id);

CREATE INDEX quizizz_codes_class_id_idx ON public.quizizz_codes USING btree (class_id);

CREATE UNIQUE INDEX quizizz_codes_pkey ON public.quizizz_codes USING btree (id);

CREATE INDEX quizizz_codes_scheduled_time_idx ON public.quizizz_codes USING btree (scheduled_time);

CREATE UNIQUE INDEX quizzes_pkey ON public.quizzes USING btree (id);

CREATE UNIQUE INDEX user_quizizz_codes_pkey ON public.user_quizizz_codes USING btree (id);

CREATE UNIQUE INDEX user_quizizz_codes_user_id_code_id_key ON public.user_quizizz_codes USING btree (user_id, code_id);

CREATE UNIQUE INDEX user_stats_pkey ON public.user_stats USING btree (user_id);

CREATE UNIQUE INDEX xp_requirements_pkey ON public.xp_requirements USING btree (id);

alter table "public"."admin_messages" add constraint "admin_messages_pkey" PRIMARY KEY using index "admin_messages_pkey";

alter table "public"."blog_posts" add constraint "blog_posts_pkey" PRIMARY KEY using index "blog_posts_pkey";

alter table "public"."class_students" add constraint "class_students_pkey" PRIMARY KEY using index "class_students_pkey";

alter table "public"."classes" add constraint "classes_pkey" PRIMARY KEY using index "classes_pkey";

alter table "public"."drawing_submissions" add constraint "drawing_submissions_pkey" PRIMARY KEY using index "drawing_submissions_pkey";

alter table "public"."duels" add constraint "duels_pkey" PRIMARY KEY using index "duels_pkey";

alter table "public"."image_analyses" add constraint "image_analyses_pkey" PRIMARY KEY using index "image_analyses_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."puzzle_ratings" add constraint "puzzle_ratings_pkey" PRIMARY KEY using index "puzzle_ratings_pkey";

alter table "public"."puzzles" add constraint "puzzles_pkey" PRIMARY KEY using index "puzzles_pkey";

alter table "public"."questions" add constraint "questions_pkey" PRIMARY KEY using index "questions_pkey";

alter table "public"."quiz_results" add constraint "quiz_results_pkey" PRIMARY KEY using index "quiz_results_pkey";

alter table "public"."quizizz_codes" add constraint "quizizz_codes_pkey" PRIMARY KEY using index "quizizz_codes_pkey";

alter table "public"."quizzes" add constraint "quizzes_pkey" PRIMARY KEY using index "quizzes_pkey";

alter table "public"."user_quizizz_codes" add constraint "user_quizizz_codes_pkey" PRIMARY KEY using index "user_quizizz_codes_pkey";

alter table "public"."user_stats" add constraint "user_stats_pkey" PRIMARY KEY using index "user_stats_pkey";

alter table "public"."xp_requirements" add constraint "xp_requirements_pkey" PRIMARY KEY using index "xp_requirements_pkey";

alter table "public"."admin_messages" add constraint "admin_messages_receiver_id_fkey" FOREIGN KEY (receiver_id) REFERENCES profiles(id) not valid;

alter table "public"."admin_messages" validate constraint "admin_messages_receiver_id_fkey";

alter table "public"."admin_messages" add constraint "admin_messages_sender_id_fkey" FOREIGN KEY (sender_id) REFERENCES profiles(id) not valid;

alter table "public"."admin_messages" validate constraint "admin_messages_sender_id_fkey";

alter table "public"."blog_posts" add constraint "blog_posts_author_id_fkey" FOREIGN KEY (author_id) REFERENCES profiles(id) not valid;

alter table "public"."blog_posts" validate constraint "blog_posts_author_id_fkey";

alter table "public"."class_students" add constraint "class_students_class_id_fkey" FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE not valid;

alter table "public"."class_students" validate constraint "class_students_class_id_fkey";

alter table "public"."class_students" add constraint "class_students_class_id_student_id_key" UNIQUE using index "class_students_class_id_student_id_key";

alter table "public"."class_students" add constraint "class_students_student_id_fkey" FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."class_students" validate constraint "class_students_student_id_fkey";

alter table "public"."classes" add constraint "classes_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid;

alter table "public"."classes" validate constraint "classes_created_by_fkey";

alter table "public"."classes" add constraint "classes_teacher_id_fkey" FOREIGN KEY (teacher_id) REFERENCES profiles(id) not valid;

alter table "public"."classes" validate constraint "classes_teacher_id_fkey";

alter table "public"."drawing_submissions" add constraint "drawing_submissions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."drawing_submissions" validate constraint "drawing_submissions_user_id_fkey";

alter table "public"."duels" add constraint "duels_challenged_id_fkey" FOREIGN KEY (challenged_id) REFERENCES profiles(id) not valid;

alter table "public"."duels" validate constraint "duels_challenged_id_fkey";

alter table "public"."duels" add constraint "duels_challenger_id_fkey" FOREIGN KEY (challenger_id) REFERENCES profiles(id) not valid;

alter table "public"."duels" validate constraint "duels_challenger_id_fkey";

alter table "public"."duels" add constraint "duels_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'completed'::text]))) not valid;

alter table "public"."duels" validate constraint "duels_status_check";

alter table "public"."image_analyses" add constraint "image_analyses_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid;

alter table "public"."image_analyses" validate constraint "image_analyses_created_by_fkey";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."profiles" add constraint "profiles_referral_code_key" UNIQUE using index "profiles_referral_code_key";

alter table "public"."profiles" add constraint "profiles_referred_by_fkey" FOREIGN KEY (referred_by) REFERENCES profiles(referral_code) ON UPDATE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_referred_by_fkey";

alter table "public"."puzzle_ratings" add constraint "puzzle_ratings_puzzle_id_fkey" FOREIGN KEY (puzzle_id) REFERENCES puzzles(id) ON DELETE CASCADE not valid;

alter table "public"."puzzle_ratings" validate constraint "puzzle_ratings_puzzle_id_fkey";

alter table "public"."puzzle_ratings" add constraint "puzzle_ratings_puzzle_id_user_id_key" UNIQUE using index "puzzle_ratings_puzzle_id_user_id_key";

alter table "public"."puzzle_ratings" add constraint "puzzle_ratings_rating_check" CHECK (((rating >= 1) AND (rating <= 5))) not valid;

alter table "public"."puzzle_ratings" validate constraint "puzzle_ratings_rating_check";

alter table "public"."puzzle_ratings" add constraint "puzzle_ratings_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) not valid;

alter table "public"."puzzle_ratings" validate constraint "puzzle_ratings_user_id_fkey";

alter table "public"."puzzles" add constraint "puzzles_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid;

alter table "public"."puzzles" validate constraint "puzzles_created_by_fkey";

alter table "public"."questions" add constraint "questions_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."questions" validate constraint "questions_created_by_fkey";

alter table "public"."quiz_results" add constraint "fk_quiz_results_profiles" FOREIGN KEY (user_id) REFERENCES profiles(id) not valid;

alter table "public"."quiz_results" validate constraint "fk_quiz_results_profiles";

alter table "public"."quiz_results" add constraint "quiz_results_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."quiz_results" validate constraint "quiz_results_user_id_fkey";

alter table "public"."quizizz_codes" add constraint "quizizz_codes_class_id_fkey" FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE not valid;

alter table "public"."quizizz_codes" validate constraint "quizizz_codes_class_id_fkey";

alter table "public"."quizizz_codes" add constraint "quizizz_codes_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."quizizz_codes" validate constraint "quizizz_codes_created_by_fkey";

alter table "public"."quizzes" add constraint "quizzes_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."quizzes" validate constraint "quizzes_created_by_fkey";

alter table "public"."quizzes" add constraint "quizzes_grade_check" CHECK ((grade = ANY (ARRAY[1, 2, 3]))) not valid;

alter table "public"."quizzes" validate constraint "quizzes_grade_check";

alter table "public"."user_quizizz_codes" add constraint "user_quizizz_codes_code_id_fkey" FOREIGN KEY (code_id) REFERENCES quizizz_codes(id) ON DELETE CASCADE not valid;

alter table "public"."user_quizizz_codes" validate constraint "user_quizizz_codes_code_id_fkey";

alter table "public"."user_quizizz_codes" add constraint "user_quizizz_codes_user_id_code_id_key" UNIQUE using index "user_quizizz_codes_user_id_code_id_key";

alter table "public"."user_quizizz_codes" add constraint "user_quizizz_codes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_quizizz_codes" validate constraint "user_quizizz_codes_user_id_fkey";

alter table "public"."user_stats" add constraint "user_stats_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_stats" validate constraint "user_stats_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.determine_challenge_winner()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.generate_slug(title text)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.handle_referral()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Davet eden kullanıcıya XP ver ve referral sayısını artır
    UPDATE profiles
    SET 
        experience = experience + 50,
        referral_count = COALESCE(referral_count, 0) + 1
    WHERE referral_code = NEW.referred_by;
    
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

create or replace view "public"."puzzle_stats" as  SELECT p.id,
    p.title,
    p.created_by,
    p.created_at,
    COALESCE(avg(pr.rating), (0)::numeric) AS average_rating,
    count(pr.id) AS total_ratings,
    prof.name AS creator_name
   FROM ((puzzles p
     LEFT JOIN puzzle_ratings pr ON ((p.id = pr.puzzle_id)))
     LEFT JOIN profiles prof ON ((p.created_by = prof.id)))
  GROUP BY p.id, p.title, p.created_by, p.created_at, prof.name;


CREATE OR REPLACE FUNCTION public.update_slug()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$
;

grant delete on table "public"."admin_messages" to "anon";

grant insert on table "public"."admin_messages" to "anon";

grant references on table "public"."admin_messages" to "anon";

grant select on table "public"."admin_messages" to "anon";

grant trigger on table "public"."admin_messages" to "anon";

grant truncate on table "public"."admin_messages" to "anon";

grant update on table "public"."admin_messages" to "anon";

grant delete on table "public"."admin_messages" to "authenticated";

grant insert on table "public"."admin_messages" to "authenticated";

grant references on table "public"."admin_messages" to "authenticated";

grant select on table "public"."admin_messages" to "authenticated";

grant trigger on table "public"."admin_messages" to "authenticated";

grant truncate on table "public"."admin_messages" to "authenticated";

grant update on table "public"."admin_messages" to "authenticated";

grant delete on table "public"."admin_messages" to "service_role";

grant insert on table "public"."admin_messages" to "service_role";

grant references on table "public"."admin_messages" to "service_role";

grant select on table "public"."admin_messages" to "service_role";

grant trigger on table "public"."admin_messages" to "service_role";

grant truncate on table "public"."admin_messages" to "service_role";

grant update on table "public"."admin_messages" to "service_role";

grant delete on table "public"."blog_posts" to "anon";

grant insert on table "public"."blog_posts" to "anon";

grant references on table "public"."blog_posts" to "anon";

grant select on table "public"."blog_posts" to "anon";

grant trigger on table "public"."blog_posts" to "anon";

grant truncate on table "public"."blog_posts" to "anon";

grant update on table "public"."blog_posts" to "anon";

grant delete on table "public"."blog_posts" to "authenticated";

grant insert on table "public"."blog_posts" to "authenticated";

grant references on table "public"."blog_posts" to "authenticated";

grant select on table "public"."blog_posts" to "authenticated";

grant trigger on table "public"."blog_posts" to "authenticated";

grant truncate on table "public"."blog_posts" to "authenticated";

grant update on table "public"."blog_posts" to "authenticated";

grant delete on table "public"."blog_posts" to "service_role";

grant insert on table "public"."blog_posts" to "service_role";

grant references on table "public"."blog_posts" to "service_role";

grant select on table "public"."blog_posts" to "service_role";

grant trigger on table "public"."blog_posts" to "service_role";

grant truncate on table "public"."blog_posts" to "service_role";

grant update on table "public"."blog_posts" to "service_role";

grant delete on table "public"."class_students" to "anon";

grant insert on table "public"."class_students" to "anon";

grant references on table "public"."class_students" to "anon";

grant select on table "public"."class_students" to "anon";

grant trigger on table "public"."class_students" to "anon";

grant truncate on table "public"."class_students" to "anon";

grant update on table "public"."class_students" to "anon";

grant delete on table "public"."class_students" to "authenticated";

grant insert on table "public"."class_students" to "authenticated";

grant references on table "public"."class_students" to "authenticated";

grant select on table "public"."class_students" to "authenticated";

grant trigger on table "public"."class_students" to "authenticated";

grant truncate on table "public"."class_students" to "authenticated";

grant update on table "public"."class_students" to "authenticated";

grant delete on table "public"."class_students" to "service_role";

grant insert on table "public"."class_students" to "service_role";

grant references on table "public"."class_students" to "service_role";

grant select on table "public"."class_students" to "service_role";

grant trigger on table "public"."class_students" to "service_role";

grant truncate on table "public"."class_students" to "service_role";

grant update on table "public"."class_students" to "service_role";

grant delete on table "public"."classes" to "anon";

grant insert on table "public"."classes" to "anon";

grant references on table "public"."classes" to "anon";

grant select on table "public"."classes" to "anon";

grant trigger on table "public"."classes" to "anon";

grant truncate on table "public"."classes" to "anon";

grant update on table "public"."classes" to "anon";

grant delete on table "public"."classes" to "authenticated";

grant insert on table "public"."classes" to "authenticated";

grant references on table "public"."classes" to "authenticated";

grant select on table "public"."classes" to "authenticated";

grant trigger on table "public"."classes" to "authenticated";

grant truncate on table "public"."classes" to "authenticated";

grant update on table "public"."classes" to "authenticated";

grant delete on table "public"."classes" to "service_role";

grant insert on table "public"."classes" to "service_role";

grant references on table "public"."classes" to "service_role";

grant select on table "public"."classes" to "service_role";

grant trigger on table "public"."classes" to "service_role";

grant truncate on table "public"."classes" to "service_role";

grant update on table "public"."classes" to "service_role";

grant delete on table "public"."drawing_submissions" to "anon";

grant insert on table "public"."drawing_submissions" to "anon";

grant references on table "public"."drawing_submissions" to "anon";

grant select on table "public"."drawing_submissions" to "anon";

grant trigger on table "public"."drawing_submissions" to "anon";

grant truncate on table "public"."drawing_submissions" to "anon";

grant update on table "public"."drawing_submissions" to "anon";

grant delete on table "public"."drawing_submissions" to "authenticated";

grant insert on table "public"."drawing_submissions" to "authenticated";

grant references on table "public"."drawing_submissions" to "authenticated";

grant select on table "public"."drawing_submissions" to "authenticated";

grant trigger on table "public"."drawing_submissions" to "authenticated";

grant truncate on table "public"."drawing_submissions" to "authenticated";

grant update on table "public"."drawing_submissions" to "authenticated";

grant delete on table "public"."drawing_submissions" to "service_role";

grant insert on table "public"."drawing_submissions" to "service_role";

grant references on table "public"."drawing_submissions" to "service_role";

grant select on table "public"."drawing_submissions" to "service_role";

grant trigger on table "public"."drawing_submissions" to "service_role";

grant truncate on table "public"."drawing_submissions" to "service_role";

grant update on table "public"."drawing_submissions" to "service_role";

grant delete on table "public"."duels" to "anon";

grant insert on table "public"."duels" to "anon";

grant references on table "public"."duels" to "anon";

grant select on table "public"."duels" to "anon";

grant trigger on table "public"."duels" to "anon";

grant truncate on table "public"."duels" to "anon";

grant update on table "public"."duels" to "anon";

grant delete on table "public"."duels" to "authenticated";

grant insert on table "public"."duels" to "authenticated";

grant references on table "public"."duels" to "authenticated";

grant select on table "public"."duels" to "authenticated";

grant trigger on table "public"."duels" to "authenticated";

grant truncate on table "public"."duels" to "authenticated";

grant update on table "public"."duels" to "authenticated";

grant delete on table "public"."duels" to "service_role";

grant insert on table "public"."duels" to "service_role";

grant references on table "public"."duels" to "service_role";

grant select on table "public"."duels" to "service_role";

grant trigger on table "public"."duels" to "service_role";

grant truncate on table "public"."duels" to "service_role";

grant update on table "public"."duels" to "service_role";

grant delete on table "public"."image_analyses" to "anon";

grant insert on table "public"."image_analyses" to "anon";

grant references on table "public"."image_analyses" to "anon";

grant select on table "public"."image_analyses" to "anon";

grant trigger on table "public"."image_analyses" to "anon";

grant truncate on table "public"."image_analyses" to "anon";

grant update on table "public"."image_analyses" to "anon";

grant delete on table "public"."image_analyses" to "authenticated";

grant insert on table "public"."image_analyses" to "authenticated";

grant references on table "public"."image_analyses" to "authenticated";

grant select on table "public"."image_analyses" to "authenticated";

grant trigger on table "public"."image_analyses" to "authenticated";

grant truncate on table "public"."image_analyses" to "authenticated";

grant update on table "public"."image_analyses" to "authenticated";

grant delete on table "public"."image_analyses" to "service_role";

grant insert on table "public"."image_analyses" to "service_role";

grant references on table "public"."image_analyses" to "service_role";

grant select on table "public"."image_analyses" to "service_role";

grant trigger on table "public"."image_analyses" to "service_role";

grant truncate on table "public"."image_analyses" to "service_role";

grant update on table "public"."image_analyses" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."puzzle_ratings" to "anon";

grant insert on table "public"."puzzle_ratings" to "anon";

grant references on table "public"."puzzle_ratings" to "anon";

grant select on table "public"."puzzle_ratings" to "anon";

grant trigger on table "public"."puzzle_ratings" to "anon";

grant truncate on table "public"."puzzle_ratings" to "anon";

grant update on table "public"."puzzle_ratings" to "anon";

grant delete on table "public"."puzzle_ratings" to "authenticated";

grant insert on table "public"."puzzle_ratings" to "authenticated";

grant references on table "public"."puzzle_ratings" to "authenticated";

grant select on table "public"."puzzle_ratings" to "authenticated";

grant trigger on table "public"."puzzle_ratings" to "authenticated";

grant truncate on table "public"."puzzle_ratings" to "authenticated";

grant update on table "public"."puzzle_ratings" to "authenticated";

grant delete on table "public"."puzzle_ratings" to "service_role";

grant insert on table "public"."puzzle_ratings" to "service_role";

grant references on table "public"."puzzle_ratings" to "service_role";

grant select on table "public"."puzzle_ratings" to "service_role";

grant trigger on table "public"."puzzle_ratings" to "service_role";

grant truncate on table "public"."puzzle_ratings" to "service_role";

grant update on table "public"."puzzle_ratings" to "service_role";

grant delete on table "public"."puzzles" to "anon";

grant insert on table "public"."puzzles" to "anon";

grant references on table "public"."puzzles" to "anon";

grant select on table "public"."puzzles" to "anon";

grant trigger on table "public"."puzzles" to "anon";

grant truncate on table "public"."puzzles" to "anon";

grant update on table "public"."puzzles" to "anon";

grant delete on table "public"."puzzles" to "authenticated";

grant insert on table "public"."puzzles" to "authenticated";

grant references on table "public"."puzzles" to "authenticated";

grant select on table "public"."puzzles" to "authenticated";

grant trigger on table "public"."puzzles" to "authenticated";

grant truncate on table "public"."puzzles" to "authenticated";

grant update on table "public"."puzzles" to "authenticated";

grant delete on table "public"."puzzles" to "service_role";

grant insert on table "public"."puzzles" to "service_role";

grant references on table "public"."puzzles" to "service_role";

grant select on table "public"."puzzles" to "service_role";

grant trigger on table "public"."puzzles" to "service_role";

grant truncate on table "public"."puzzles" to "service_role";

grant update on table "public"."puzzles" to "service_role";

grant delete on table "public"."questions" to "anon";

grant insert on table "public"."questions" to "anon";

grant references on table "public"."questions" to "anon";

grant select on table "public"."questions" to "anon";

grant trigger on table "public"."questions" to "anon";

grant truncate on table "public"."questions" to "anon";

grant update on table "public"."questions" to "anon";

grant delete on table "public"."questions" to "authenticated";

grant insert on table "public"."questions" to "authenticated";

grant references on table "public"."questions" to "authenticated";

grant select on table "public"."questions" to "authenticated";

grant trigger on table "public"."questions" to "authenticated";

grant truncate on table "public"."questions" to "authenticated";

grant update on table "public"."questions" to "authenticated";

grant delete on table "public"."questions" to "service_role";

grant insert on table "public"."questions" to "service_role";

grant references on table "public"."questions" to "service_role";

grant select on table "public"."questions" to "service_role";

grant trigger on table "public"."questions" to "service_role";

grant truncate on table "public"."questions" to "service_role";

grant update on table "public"."questions" to "service_role";

grant delete on table "public"."quiz_results" to "anon";

grant insert on table "public"."quiz_results" to "anon";

grant references on table "public"."quiz_results" to "anon";

grant select on table "public"."quiz_results" to "anon";

grant trigger on table "public"."quiz_results" to "anon";

grant truncate on table "public"."quiz_results" to "anon";

grant update on table "public"."quiz_results" to "anon";

grant delete on table "public"."quiz_results" to "authenticated";

grant insert on table "public"."quiz_results" to "authenticated";

grant references on table "public"."quiz_results" to "authenticated";

grant select on table "public"."quiz_results" to "authenticated";

grant trigger on table "public"."quiz_results" to "authenticated";

grant truncate on table "public"."quiz_results" to "authenticated";

grant update on table "public"."quiz_results" to "authenticated";

grant delete on table "public"."quiz_results" to "service_role";

grant insert on table "public"."quiz_results" to "service_role";

grant references on table "public"."quiz_results" to "service_role";

grant select on table "public"."quiz_results" to "service_role";

grant trigger on table "public"."quiz_results" to "service_role";

grant truncate on table "public"."quiz_results" to "service_role";

grant update on table "public"."quiz_results" to "service_role";

grant delete on table "public"."quizizz_codes" to "anon";

grant insert on table "public"."quizizz_codes" to "anon";

grant references on table "public"."quizizz_codes" to "anon";

grant select on table "public"."quizizz_codes" to "anon";

grant trigger on table "public"."quizizz_codes" to "anon";

grant truncate on table "public"."quizizz_codes" to "anon";

grant update on table "public"."quizizz_codes" to "anon";

grant delete on table "public"."quizizz_codes" to "authenticated";

grant insert on table "public"."quizizz_codes" to "authenticated";

grant references on table "public"."quizizz_codes" to "authenticated";

grant select on table "public"."quizizz_codes" to "authenticated";

grant trigger on table "public"."quizizz_codes" to "authenticated";

grant truncate on table "public"."quizizz_codes" to "authenticated";

grant update on table "public"."quizizz_codes" to "authenticated";

grant delete on table "public"."quizizz_codes" to "service_role";

grant insert on table "public"."quizizz_codes" to "service_role";

grant references on table "public"."quizizz_codes" to "service_role";

grant select on table "public"."quizizz_codes" to "service_role";

grant trigger on table "public"."quizizz_codes" to "service_role";

grant truncate on table "public"."quizizz_codes" to "service_role";

grant update on table "public"."quizizz_codes" to "service_role";

grant delete on table "public"."quizzes" to "anon";

grant insert on table "public"."quizzes" to "anon";

grant references on table "public"."quizzes" to "anon";

grant select on table "public"."quizzes" to "anon";

grant trigger on table "public"."quizzes" to "anon";

grant truncate on table "public"."quizzes" to "anon";

grant update on table "public"."quizzes" to "anon";

grant delete on table "public"."quizzes" to "authenticated";

grant insert on table "public"."quizzes" to "authenticated";

grant references on table "public"."quizzes" to "authenticated";

grant select on table "public"."quizzes" to "authenticated";

grant trigger on table "public"."quizzes" to "authenticated";

grant truncate on table "public"."quizzes" to "authenticated";

grant update on table "public"."quizzes" to "authenticated";

grant delete on table "public"."quizzes" to "service_role";

grant insert on table "public"."quizzes" to "service_role";

grant references on table "public"."quizzes" to "service_role";

grant select on table "public"."quizzes" to "service_role";

grant trigger on table "public"."quizzes" to "service_role";

grant truncate on table "public"."quizzes" to "service_role";

grant update on table "public"."quizzes" to "service_role";

grant delete on table "public"."user_quizizz_codes" to "anon";

grant insert on table "public"."user_quizizz_codes" to "anon";

grant references on table "public"."user_quizizz_codes" to "anon";

grant select on table "public"."user_quizizz_codes" to "anon";

grant trigger on table "public"."user_quizizz_codes" to "anon";

grant truncate on table "public"."user_quizizz_codes" to "anon";

grant update on table "public"."user_quizizz_codes" to "anon";

grant delete on table "public"."user_quizizz_codes" to "authenticated";

grant insert on table "public"."user_quizizz_codes" to "authenticated";

grant references on table "public"."user_quizizz_codes" to "authenticated";

grant select on table "public"."user_quizizz_codes" to "authenticated";

grant trigger on table "public"."user_quizizz_codes" to "authenticated";

grant truncate on table "public"."user_quizizz_codes" to "authenticated";

grant update on table "public"."user_quizizz_codes" to "authenticated";

grant delete on table "public"."user_quizizz_codes" to "service_role";

grant insert on table "public"."user_quizizz_codes" to "service_role";

grant references on table "public"."user_quizizz_codes" to "service_role";

grant select on table "public"."user_quizizz_codes" to "service_role";

grant trigger on table "public"."user_quizizz_codes" to "service_role";

grant truncate on table "public"."user_quizizz_codes" to "service_role";

grant update on table "public"."user_quizizz_codes" to "service_role";

grant delete on table "public"."user_stats" to "anon";

grant insert on table "public"."user_stats" to "anon";

grant references on table "public"."user_stats" to "anon";

grant select on table "public"."user_stats" to "anon";

grant trigger on table "public"."user_stats" to "anon";

grant truncate on table "public"."user_stats" to "anon";

grant update on table "public"."user_stats" to "anon";

grant delete on table "public"."user_stats" to "authenticated";

grant insert on table "public"."user_stats" to "authenticated";

grant references on table "public"."user_stats" to "authenticated";

grant select on table "public"."user_stats" to "authenticated";

grant trigger on table "public"."user_stats" to "authenticated";

grant truncate on table "public"."user_stats" to "authenticated";

grant update on table "public"."user_stats" to "authenticated";

grant delete on table "public"."user_stats" to "service_role";

grant insert on table "public"."user_stats" to "service_role";

grant references on table "public"."user_stats" to "service_role";

grant select on table "public"."user_stats" to "service_role";

grant trigger on table "public"."user_stats" to "service_role";

grant truncate on table "public"."user_stats" to "service_role";

grant update on table "public"."user_stats" to "service_role";

grant delete on table "public"."xp_requirements" to "anon";

grant insert on table "public"."xp_requirements" to "anon";

grant references on table "public"."xp_requirements" to "anon";

grant select on table "public"."xp_requirements" to "anon";

grant trigger on table "public"."xp_requirements" to "anon";

grant truncate on table "public"."xp_requirements" to "anon";

grant update on table "public"."xp_requirements" to "anon";

grant delete on table "public"."xp_requirements" to "authenticated";

grant insert on table "public"."xp_requirements" to "authenticated";

grant references on table "public"."xp_requirements" to "authenticated";

grant select on table "public"."xp_requirements" to "authenticated";

grant trigger on table "public"."xp_requirements" to "authenticated";

grant truncate on table "public"."xp_requirements" to "authenticated";

grant update on table "public"."xp_requirements" to "authenticated";

grant delete on table "public"."xp_requirements" to "service_role";

grant insert on table "public"."xp_requirements" to "service_role";

grant references on table "public"."xp_requirements" to "service_role";

grant select on table "public"."xp_requirements" to "service_role";

grant trigger on table "public"."xp_requirements" to "service_role";

grant truncate on table "public"."xp_requirements" to "service_role";

grant update on table "public"."xp_requirements" to "service_role";

create policy "Admins can read all messages"
on "public"."admin_messages"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))));


create policy "Admins can send messages"
on "public"."admin_messages"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))));


create policy "Users can delete their own messages"
on "public"."admin_messages"
as permissive
for delete
to public
using ((auth.uid() = receiver_id));


create policy "Users can mark their messages as read"
on "public"."admin_messages"
as permissive
for update
to public
using ((auth.uid() = receiver_id))
with check ((auth.uid() = receiver_id));


create policy "Users can read their own messages"
on "public"."admin_messages"
as permissive
for select
to public
using ((auth.uid() = receiver_id));


create policy "Admins can read all blog posts"
on "public"."blog_posts"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))));


create policy "Anyone can read published blog posts"
on "public"."blog_posts"
as permissive
for select
to public
using ((published = true));


create policy "Only admins can delete blog posts"
on "public"."blog_posts"
as permissive
for delete
to public
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))));


create policy "Only admins can insert blog posts"
on "public"."blog_posts"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))));


create policy "Only admins can update blog posts"
on "public"."blog_posts"
as permissive
for update
to public
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))));


create policy "Herkes sınıf öğrencilerini görebilir"
on "public"."class_students"
as permissive
for select
to public
using (true);


create policy "Only admins can delete class enrollments"
on "public"."class_students"
as permissive
for delete
to public
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))));


create policy "Only admins can insert class enrollments"
on "public"."class_students"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))));


create policy "Only admins can update class enrollments"
on "public"."class_students"
as permissive
for update
to public
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))));


create policy "Users can view their own class enrollments"
on "public"."class_students"
as permissive
for select
to public
using (((auth.uid() = student_id) OR (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true))))));


create policy "Allow delete access to admin users"
on "public"."classes"
as permissive
for delete
to public
using (((auth.jwt() ->> 'email'::text) = 'yaprakyesili@msn.com'::text));


create policy "Allow insert access to admin users"
on "public"."classes"
as permissive
for insert
to public
with check (((auth.jwt() ->> 'email'::text) = 'yaprakyesili@msn.com'::text));


create policy "Allow read access to all users"
on "public"."classes"
as permissive
for select
to public
using (true);


create policy "Allow update access to admin users"
on "public"."classes"
as permissive
for update
to public
using (((auth.jwt() ->> 'email'::text) = 'yaprakyesili@msn.com'::text));


create policy "Users can insert their own submissions"
on "public"."drawing_submissions"
as permissive
for insert
to authenticated
with check ((auth.uid() = user_id));


create policy "Users can view all submissions"
on "public"."drawing_submissions"
as permissive
for select
to authenticated
using (true);


create policy "Users can create duels"
on "public"."duels"
as permissive
for insert
to public
with check ((auth.uid() = challenger_id));


create policy "Users can update their own duels"
on "public"."duels"
as permissive
for update
to public
using (((auth.uid() = challenger_id) OR (auth.uid() = challenged_id)));


create policy "Users can view their own duels"
on "public"."duels"
as permissive
for select
to public
using (((auth.uid() = challenger_id) OR (auth.uid() = challenged_id)));


create policy "Users can create own analyses"
on "public"."image_analyses"
as permissive
for insert
to public
with check ((auth.uid() = created_by));


create policy "Users can delete own analyses"
on "public"."image_analyses"
as permissive
for delete
to public
using ((auth.uid() = created_by));


create policy "Users can view own analyses"
on "public"."image_analyses"
as permissive
for select
to public
using ((auth.uid() = created_by));


create policy "Allow public referral code queries"
on "public"."profiles"
as permissive
for select
to public
using (true);


create policy "Enable insert access for authenticated users only"
on "public"."profiles"
as permissive
for insert
to public
with check (((auth.role() = 'authenticated'::text) AND (auth.uid() = id)));


create policy "Enable insert for authenticated users only"
on "public"."profiles"
as permissive
for insert
to authenticated
with check ((auth.uid() = id));


create policy "Enable insert for authenticated users"
on "public"."profiles"
as permissive
for insert
to authenticated
with check ((auth.uid() = id));


create policy "Enable read access for all profiles"
on "public"."profiles"
as permissive
for select
to authenticated
using (true);


create policy "Enable read access for all users"
on "public"."profiles"
as permissive
for select
to public
using (true);


create policy "Enable read access for users"
on "public"."profiles"
as permissive
for select
to authenticated
using ((auth.uid() = id));


create policy "Profiles are viewable by everyone"
on "public"."profiles"
as permissive
for select
to public
using (true);


create policy "Profiles are viewable by users who created them."
on "public"."profiles"
as permissive
for select
to public
using ((auth.uid() = id));


create policy "admin_update_any_profile"
on "public"."profiles"
as permissive
for update
to authenticated
using ((EXISTS ( SELECT 1
   FROM profiles profiles_1
  WHERE ((profiles_1.id = auth.uid()) AND (profiles_1.is_admin = true)))));


create policy "users_update_own_profile"
on "public"."profiles"
as permissive
for update
to authenticated
using ((auth.uid() = id))
with check ((auth.uid() = id));


create policy "Users can insert own ratings"
on "public"."puzzle_ratings"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can update own ratings"
on "public"."puzzle_ratings"
as permissive
for update
to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));


create policy "Users can view own ratings"
on "public"."puzzle_ratings"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Admins can manage all puzzles"
on "public"."puzzles"
as permissive
for all
to public
using (((auth.jwt() ->> 'email'::text) = 'yaprakyesili@msn.com'::text));


create policy "Anyone can view approved puzzles"
on "public"."puzzles"
as permissive
for select
to public
using ((approved = true));


create policy "Users can delete their own puzzles"
on "public"."puzzles"
as permissive
for delete
to public
using ((auth.uid() = created_by));


create policy "Users can insert their own puzzles"
on "public"."puzzles"
as permissive
for insert
to public
with check ((auth.uid() = created_by));


create policy "Users can update their own puzzles"
on "public"."puzzles"
as permissive
for update
to public
using ((auth.uid() = created_by));


create policy "Users can view their own puzzles"
on "public"."puzzles"
as permissive
for select
to public
using ((auth.uid() = created_by));


create policy "Authenticated users can create questions"
on "public"."questions"
as permissive
for insert
to public
with check ((auth.role() = 'authenticated'::text));


create policy "Questions are viewable by all users"
on "public"."questions"
as permissive
for select
to public
using (true);


create policy "Admin users can view all quiz results"
on "public"."quiz_results"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))));


create policy "Users can insert their own quiz results"
on "public"."quiz_results"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can view their own quiz results"
on "public"."quiz_results"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Admins can manage quizizz codes"
on "public"."quizizz_codes"
as permissive
for all
to authenticated
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))));


create policy "Authenticated users can view quizizz codes"
on "public"."quizizz_codes"
as permissive
for select
to authenticated
using (true);


create policy "admin_all"
on "public"."quizzes"
as permissive
for all
to authenticated
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))));


create policy "view_active_quizzes"
on "public"."quizzes"
as permissive
for select
to authenticated
using ((is_active = true));


create policy "Users can insert their own stats."
on "public"."user_stats"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can update their own stats."
on "public"."user_stats"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view their own stats."
on "public"."user_stats"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Herkes xp gereksinimlerini okuyabilir"
on "public"."xp_requirements"
as permissive
for select
to authenticated
using (true);


create policy "Sadece adminler xp gereksinimlerini düzenleyebilir"
on "public"."xp_requirements"
as permissive
for all
to authenticated
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))));


create policy "XP gereksinimleri herkes tarafından görüntülenebilir"
on "public"."xp_requirements"
as permissive
for select
to authenticated
using (true);


create policy "XP gereksinimleri sadece adminler tarafından düzenlenebilir"
on "public"."xp_requirements"
as permissive
for insert
to authenticated
with check ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))));


create policy "XP gereksinimleri sadece adminler tarafından güncellenebilir"
on "public"."xp_requirements"
as permissive
for update
to authenticated
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))));


create policy "XP gereksinimleri sadece adminler tarafından silinebilir"
on "public"."xp_requirements"
as permissive
for delete
to authenticated
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))));


CREATE TRIGGER before_insert_update_blog_posts BEFORE INSERT OR UPDATE OF title ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION update_slug();

CREATE TRIGGER on_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER on_referral AFTER UPDATE OF referred_by ON public.profiles FOR EACH ROW WHEN (((new.referred_by IS NOT NULL) AND ((old.referred_by IS NULL) OR (old.referred_by IS DISTINCT FROM new.referred_by)))) EXECUTE FUNCTION handle_referral();

CREATE TRIGGER update_puzzles_updated_at BEFORE UPDATE ON public.puzzles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quizzes_updated_at BEFORE UPDATE ON public.quizzes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_xp_requirements_updated_at BEFORE UPDATE ON public.xp_requirements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


