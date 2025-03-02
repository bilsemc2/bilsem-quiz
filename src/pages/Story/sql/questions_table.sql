-- Hikaye soruları tablosu
CREATE TABLE public.story_question (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  story_id uuid NOT NULL,
  question_text text NOT NULL,
  options jsonb NOT NULL, -- Seçenek dizisi için JSON tipi
  correct_answer_index integer NOT NULL,
  feedback jsonb, -- Geribildirim bilgisi
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT story_question_pkey PRIMARY KEY (id),
  CONSTRAINT story_question_story_id_fkey FOREIGN KEY (story_id)
    REFERENCES public.story (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Hikaye ID'sine göre endeks
CREATE INDEX IF NOT EXISTS idx_story_question_story_id ON public.story_question USING btree (story_id) TABLESPACE pg_default;
