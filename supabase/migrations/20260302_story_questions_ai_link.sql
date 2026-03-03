-- Link story questions to ai_generated_questions pool

ALTER TABLE IF EXISTS story_questions
ADD COLUMN IF NOT EXISTS ai_generated_question_id UUID
REFERENCES ai_generated_questions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_story_questions_ai_generated_question_id
    ON story_questions (ai_generated_question_id);
