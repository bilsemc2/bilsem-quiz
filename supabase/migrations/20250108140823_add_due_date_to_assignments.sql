-- quiz_class_assignments tablosuna due_date kolonu ekle
ALTER TABLE public.quiz_class_assignments
ADD COLUMN due_date TIMESTAMPTZ;
