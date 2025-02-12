-- Create badges table
-- Önce badges tablosunu oluştur
DROP TABLE IF EXISTS "public"."badges" CASCADE;
DROP TABLE IF EXISTS "public"."user_badges" CASCADE;

CREATE TABLE "public"."badges" (
    "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
    "name" text NOT NULL,
    "description" text NOT NULL,
    "icon" text NOT NULL,
    "created_at" timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
    "updated_at" timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
    "conditions" jsonb DEFAULT '{}'::jsonb,
    "category" text,
    "points" integer DEFAULT 0,
    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

-- Create user_badges table for tracking earned badges
CREATE TABLE "public"."user_badges" (
    "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
    "user_id" uuid NOT NULL,
    "badge_id" uuid NOT NULL,
    "earned_at" timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
    "created_at" timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "user_badges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
    CONSTRAINT "user_badges_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "public"."badges"("id") ON DELETE CASCADE,
    CONSTRAINT "user_badges_user_badge_unique" UNIQUE ("user_id", "badge_id")
);

-- Enable Row Level Security
ALTER TABLE "public"."badges" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."user_badges" ENABLE ROW LEVEL SECURITY;

-- Create policies for badges
CREATE POLICY "Badges are viewable by everyone" 
    ON "public"."badges" FOR SELECT 
    USING (true);

CREATE POLICY "Only admins can insert badges" 
    ON "public"."badges" FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY "Only admins can update badges" 
    ON "public"."badges" FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Create policies for user_badges
CREATE POLICY "Users can view their own badges" 
    ON "public"."user_badges" FOR SELECT 
    USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY "Only system can insert user_badges" 
    ON "public"."user_badges" FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Varsayılan rozetleri ekle
DO $$ 
BEGIN
    INSERT INTO public.badges (name, description, icon, category, points, conditions) 
    VALUES 
        ('İlk Ödev', 'İlk ödevini tamamladın!', '🎥', 'achievement', 50, '{"type": "first_assignment"}'::jsonb),
        ('Mükemmel', 'Bir ödevden tam puan aldın!', '⭐', 'achievement', 100, '{"type": "perfect_score"}'::jsonb),
            ('Çalışkan Öğrenci', '10 ödevi başarıyla tamamladın!', '📚', 'milestone', 150, '{"type": "completion_count", "count": 10}'::jsonb);
EXCEPTION WHEN OTHERS THEN
    NULL; -- Hata olursa sessizce devam et
END $$;

-- Create function to award badges automatically
CREATE OR REPLACE FUNCTION award_badge() RETURNS trigger AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Geriye dönük rozet verme fonksiyonu
CREATE OR REPLACE FUNCTION retroactively_award_badges() RETURNS void AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Geriye dönük rozetleri ver
SELECT retroactively_award_badges();

-- Trigger'i sil ve yeniden oluştur
DROP TRIGGER IF EXISTS check_badges_after_assignment ON public.assignment_results;

-- Yeni ödevler için trigger oluştur
CREATE TRIGGER check_badges_after_assignment
    AFTER INSERT ON public.assignment_results
    FOR EACH ROW
    EXECUTE FUNCTION award_badge();
