-- Önce mevcut class_students tablosunu güncelle
ALTER TABLE class_students
    DROP CONSTRAINT IF EXISTS class_students_student_id_fkey,  -- Varsa eski foreign key'i sil
    ADD CONSTRAINT class_students_student_id_fkey 
    FOREIGN KEY (student_id) 
    REFERENCES profiles(id)  -- auth.users yerine profiles tablosuna referans ver
    ON DELETE CASCADE;  -- Profil silindiğinde ilgili kayıtları da sil

-- RLS politikasını güncelle
DROP POLICY IF EXISTS "Herkes sınıf öğrencilerini görebilir" ON class_students;
CREATE POLICY "Herkes sınıf öğrencilerini görebilir" ON class_students
    FOR SELECT USING (true);
