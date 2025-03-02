-- Ödev oluşturma transaction fonksiyonunu düzelt
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
BEGIN
  -- Transaction başlat
  BEGIN
    -- Soru detaylarını topla
    v_questions := ARRAY[]::jsonb[];
    
    IF p_question_ids IS NULL OR array_length(p_question_ids, 1) = 0 THEN
      v_error := 'Soru listesi boş olamaz';
      RAISE EXCEPTION '%', v_error;
    END IF;

    FOR v_index IN 1..array_length(p_question_ids, 1)
    LOOP
      v_question_id := p_question_ids[v_index];
      
      -- Soru var mı kontrol et
      IF NOT EXISTS (SELECT 1 FROM questions WHERE id = v_question_id) THEN
        v_error := 'Soru bulunamadı: ' || v_question_id::text;
        RAISE EXCEPTION '%', v_error;
      END IF;
      
      SELECT jsonb_build_object(
        'id', q.id::text,
        'text', 'Soru ' || q.id::text,
        'type', 'multiple_choice',
        'number', v_index,
        'points', 10,
        'options', ARRAY['A', 'B', 'C', 'D', 'E'],
        'difficulty', 2,
        'correct_option', q.correct_option_id
      )
      INTO v_question_data
      FROM questions q
      WHERE q.id = v_question_id;
      
      v_questions := array_append(v_questions, v_question_data);
    END LOOP;

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

    -- 3. Soruları ekle
    v_index := 1;
    FOREACH v_question_id IN ARRAY p_question_ids
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
