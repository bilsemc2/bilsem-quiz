-- Ödev oluşturma transaction fonksiyonunu güncelle
CREATE OR REPLACE FUNCTION create_assignment_transaction(
  p_title TEXT,
  p_description TEXT,
  p_grade SMALLINT,
  p_subject TEXT,
  p_created_by UUID,
  p_is_active BOOLEAN,
  p_class_id UUID,
  p_question_ids UUID[]
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_assignment_id UUID;
  v_question_id UUID;
  v_index INTEGER;
  v_questions jsonb[];
  v_question_data jsonb;
  v_error TEXT;
  v_question_number INTEGER;
BEGIN
  -- Transaction başlat
  BEGIN
    -- Soru detaylarını topla
    v_questions := ARRAY[]::jsonb[];
    
    IF p_question_ids IS NULL OR array_length(p_question_ids, 1) = 0 THEN
      v_error := 'Soru listesi boş olamaz';
      RAISE EXCEPTION '%', v_error;
    END IF;

    -- Önce soruları numaralarına göre sırala
    CREATE TEMP TABLE temp_questions AS
    SELECT 
      q.id,
      q.correct_option_id,
      COALESCE(NULLIF(regexp_replace(q.image_url, '.*Soru-(\d+)\.webp.*', '\1'), q.image_url), '0')::integer as question_number
    FROM unnest(p_question_ids) question_id
    JOIN questions q ON q.id = question_id
    ORDER BY question_number;

    FOR v_question_data IN SELECT * FROM temp_questions
    LOOP
      v_questions := array_append(v_questions, jsonb_build_object(
        'id', v_question_data.id::text,
        'text', 'Soru ' || v_question_data.question_number::text,
        'type', 'multiple_choice',
        'number', v_question_data.question_number,
        'points', 10,
        'options', ARRAY['A', 'B', 'C', 'D', 'E'],
        'difficulty', 2,
        'correct_option', v_question_data.correct_option_id
      ));
    END LOOP;

    DROP TABLE temp_questions;

    -- 1. Ödev oluştur
    INSERT INTO assignments (
      title,
      description,
      grade,
      subject,
      created_by,
      is_active,
      questions
    ) VALUES (
      p_title,
      p_description,
      p_grade,
      p_subject,
      p_created_by,
      p_is_active,
      jsonb_build_array(VARIADIC v_questions)
    ) RETURNING id INTO v_assignment_id;

    -- 2. Sınıf ilişkisini kur
    INSERT INTO quiz_class_assignments (
      quiz_id,
      class_id,
      assigned_by
    ) VALUES (
      v_assignment_id,
      p_class_id,
      p_created_by
    );

    -- 3. Soruları ekle (sıralı olarak)
    v_index := 1;
    FOR v_question_id IN 
      SELECT q.id 
      FROM unnest(p_question_ids) question_id
      JOIN questions q ON q.id = question_id
      ORDER BY COALESCE(NULLIF(regexp_replace(q.image_url, '.*Soru-(\d+)\.webp.*', '\1'), q.image_url), '0')::integer
    LOOP
      INSERT INTO assignment_questions (
        assignment_id,
        question_id,
        order_number
      ) VALUES (
        v_assignment_id,
        v_question_id,
        v_index
      );
      v_index := v_index + 1;
    END LOOP;

    -- Başarılı sonuç dön
    RETURN jsonb_build_object(
      'success', true,
      'assignment_id', v_assignment_id
    );

  EXCEPTION WHEN OTHERS THEN
    -- Hata durumunda
    GET STACKED DIAGNOSTICS v_error = MESSAGE_TEXT;
    RETURN jsonb_build_object(
      'success', false,
      'error', v_error
    );
  END;
END;
$$;
