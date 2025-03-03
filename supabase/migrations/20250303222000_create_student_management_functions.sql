-- Öğrenci yönetimi için gerekli SQL prosedürleri
-- 1. Sınıftaki öğrencilerin özet bilgilerini getiren fonksiyon
CREATE OR REPLACE FUNCTION public.get_class_students_overview(class_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  email TEXT,
  avatar_url TEXT,
  completed_assignments INT,
  avg_score NUMERIC,
  total_time NUMERIC
) 
SECURITY DEFINER 
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.email,
    p.avatar_url,
    COUNT(DISTINCT ar.assignment_id)::INT AS completed_assignments,
    COALESCE(AVG(ar.score::NUMERIC), 0)::NUMERIC AS avg_score,
    COALESCE(SUM(ar.duration_minutes), 0)::NUMERIC AS total_time
  FROM 
    profiles p
  JOIN 
    class_students cs ON cs.student_id = p.id
  LEFT JOIN 
    quiz_class_assignments qca ON qca.class_id = cs.class_id
  LEFT JOIN 
    assignments a ON a.id = qca.quiz_id
  LEFT JOIN 
    assignment_results ar ON ar.student_id = p.id AND ar.assignment_id = a.id
  WHERE 
    cs.class_id = get_class_students_overview.class_id
  GROUP BY 
    p.id
  ORDER BY 
    p.name;
END;
$$;

-- 2. Belirli bir öğrencinin tamamladığı ödevleri getiren fonksiyon
-- Önce mevcut fonksiyonu siliyoruz
DROP FUNCTION IF EXISTS public.get_student_assignments(UUID, UUID);

-- Yeni güncellenmiş fonksiyonu oluşturuyoruz
CREATE FUNCTION public.get_student_assignments(student_id UUID, class_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  completed_at TIMESTAMPTZ,
  score NUMERIC,
  duration_minutes INT,
  question_count INT,
  correct_count INT,
  incorrect_count INT
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.title,
    ar.completed_at,
    ar.score::NUMERIC,
    ar.duration_minutes,
    JSONB_ARRAY_LENGTH(a.questions)::INT AS question_count,
    FLOOR((ar.score::NUMERIC/100) * JSONB_ARRAY_LENGTH(a.questions)::INT)::INT AS correct_count,
    (JSONB_ARRAY_LENGTH(a.questions)::INT - FLOOR((ar.score::NUMERIC/100) * JSONB_ARRAY_LENGTH(a.questions)::INT)::INT)::INT AS incorrect_count
  FROM 
    assignments a
  JOIN 
    quiz_class_assignments qca ON qca.quiz_id = a.id
  JOIN 
    assignment_results ar ON ar.assignment_id = a.id
  WHERE 
    qca.class_id = get_student_assignments.class_id AND
    ar.student_id = get_student_assignments.student_id
  ORDER BY 
    ar.completed_at DESC;
END;
$$;

-- 3. Öğrencinin zaman içindeki performansını getiren fonksiyon
CREATE OR REPLACE FUNCTION public.get_student_performance_over_time(student_id UUID, class_id UUID)
RETURNS TABLE (
  completed_at TEXT,
  title TEXT,
  score NUMERIC,
  completion_rate NUMERIC
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TO_CHAR(ar.completed_at, 'YYYY-MM-DD') AS completed_at,
    a.title,
    ar.score::NUMERIC,
    -- Eğer score değeri 0-100 arasında bir yüzde ise doğrudan kullanılabilir
    -- Aksi halde doğru soruların oranını hesaplamak için başka bir yol kullanılmalı
    ar.score::NUMERIC AS completion_rate
  FROM 
    assignments a
  JOIN 
    quiz_class_assignments qca ON qca.quiz_id = a.id
  JOIN 
    assignment_results ar ON ar.assignment_id = a.id
  WHERE 
    qca.class_id = get_student_performance_over_time.class_id AND
    ar.student_id = get_student_performance_over_time.student_id
  ORDER BY 
    ar.completed_at;
END;
$$;
