-- Sınıflar tablosunu oluştur
CREATE TABLE IF NOT EXISTS classes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    grade INTEGER NOT NULL,
    icon VARCHAR(50) NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Öğrenci-Sınıf ilişki tablosunu oluştur
CREATE TABLE IF NOT EXISTS class_students (
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    PRIMARY KEY (class_id, student_id)
);

-- RLS (Row Level Security) politikaları
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_students ENABLE ROW LEVEL SECURITY;

-- classes tablosu için politikalar
CREATE POLICY "classes_select_policy" 
ON classes FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "classes_insert_policy" 
ON classes FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "classes_update_policy" 
ON classes FOR UPDATE 
TO authenticated 
USING (auth.uid() = created_by OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND is_admin = true
));

CREATE POLICY "classes_delete_policy" 
ON classes FOR DELETE 
TO authenticated 
USING (auth.uid() = created_by OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND is_admin = true
));

-- class_students tablosu için politikalar
CREATE POLICY "class_students_select_policy" 
ON class_students FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "class_students_insert_policy" 
ON class_students FOR INSERT 
TO authenticated 
WITH CHECK (EXISTS (
    SELECT 1 FROM classes 
    WHERE id = class_id 
    AND (created_by = auth.uid() OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND is_admin = true
    ))
));

CREATE POLICY "class_students_delete_policy" 
ON class_students FOR DELETE 
TO authenticated 
USING (EXISTS (
    SELECT 1 FROM classes 
    WHERE id = class_id 
    AND (created_by = auth.uid() OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND is_admin = true
    ))
));
