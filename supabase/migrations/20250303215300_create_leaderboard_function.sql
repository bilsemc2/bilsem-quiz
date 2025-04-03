-- Sınıf liderlik tablosu için RPC fonksiyonu ekleniyor
CREATE OR REPLACE FUNCTION public.get_class_leaderboard(class_id uuid)
RETURNS TABLE (
  student_id uuid,
  student_name text,
  avatar_url text,
  total_score bigint,
  correct_answers bigint,
  total_questions bigint,
  completion_rate integer
) 
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- RLS politikalarını aşmak için fonksiyon 'SECURITY DEFINER' olarak tanımlandı

  RETURN QUERY
  SELECT 
    profiles.id as student_id,
    profiles.name as student_name,
    profiles.avatar_url,
    COALESCE(MAX(ar.score), 0)::bigint as total_score, -- En yüksek skoru al
    COALESCE(SUM(ar.score), 0)::bigint as correct_answers,
    COALESCE(SUM(ar.total_questions), 0)::bigint as total_questions,
    CASE
      WHEN COALESCE(SUM(ar.total_questions), 0) > 0 
      THEN (COALESCE(SUM(ar.score), 0) * 100 / COALESCE(SUM(ar.total_questions), 1))::integer
      ELSE 0
    END as completion_rate
  FROM 
    profiles
  JOIN 
    class_students ON profiles.id = class_students.student_id
  LEFT JOIN 
    quiz_class_assignments qca ON qca.class_id = class_students.class_id
  LEFT JOIN 
    assignments quiz ON quiz.id = qca.quiz_id
  LEFT JOIN 
    assignment_results ar ON ar.student_id = profiles.id AND ar.assignment_id = quiz.id
  WHERE 
    class_students.class_id = get_class_leaderboard.class_id
  GROUP BY 
    profiles.id, profiles.name, profiles.avatar_url
  ORDER BY 
    total_score DESC;
END;
$$;

-- Bu fonksiyonu kullanma yetkisini herkese verin
GRANT EXECUTE ON FUNCTION public.get_class_leaderboard(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_class_leaderboard(uuid) TO service_role;

-- Fonksiyon açıklaması ekleniyor
COMMENT ON FUNCTION public.get_class_leaderboard(uuid) IS 'Belirtilen sınıftaki öğrencilerin başarı sıralamasını getirir. Puanlar, doğru cevaplar ve tamamlama oranları hesaplanır.';
