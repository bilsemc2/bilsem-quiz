-- RLS politikaları
DROP POLICY IF EXISTS "Öğretmenler kendi ödevlerinin sorularını görebilir" ON assignment_questions;
DROP POLICY IF EXISTS "Öğretmenler ödevlerine soru ekleyebilir" ON assignment_questions;
DROP POLICY IF EXISTS "Öğretmenler ödevlerindeki soruları düzenleyebilir" ON assignment_questions;
DROP POLICY IF EXISTS "Öğretmenler ödevlerindeki soruları silebilir" ON assignment_questions;
DROP POLICY IF EXISTS "Öğrenciler kendilerine atanan ödevlerdeki soruları görebilir" ON assignment_questions;

ALTER TABLE assignment_questions ENABLE ROW LEVEL SECURITY;

-- Questions tablosu için politikalar
-- Not: Bu politikaları eklemiyoruz çünkü zaten mevcut

-- Assignment Questions için politikalar
CREATE POLICY "Öğretmenler kendi ödevlerinin sorularını görebilir"
ON assignment_questions FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM assignments a
        WHERE a.id = assignment_id
        AND a.created_by = auth.uid()
    )
);

CREATE POLICY "Öğretmenler ödevlerine soru ekleyebilir"
ON assignment_questions FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM assignments a
        WHERE a.id = assignment_id
        AND a.created_by = auth.uid()
    )
);

CREATE POLICY "Öğretmenler ödevlerindeki soruları düzenleyebilir"
ON assignment_questions FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM assignments a
        WHERE a.id = assignment_id
        AND a.created_by = auth.uid()
    )
);

CREATE POLICY "Öğretmenler ödevlerindeki soruları silebilir"
ON assignment_questions FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM assignments a
        WHERE a.id = assignment_id
        AND a.created_by = auth.uid()
    )
);

CREATE POLICY "Öğrenciler kendilerine atanan ödevlerdeki soruları görebilir"
ON assignment_questions FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles p
        JOIN class_students cs ON cs.student_id = p.id
        JOIN quiz_class_assignments qca ON qca.class_id = cs.class_id
        WHERE p.id = auth.uid()
        AND p.role = 'student'
        AND qca.quiz_id = assignment_id
    )
);
