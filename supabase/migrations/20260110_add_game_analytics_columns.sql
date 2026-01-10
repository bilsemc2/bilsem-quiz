-- Migration: Create game_plays table for game analytics
-- Created: 2026-01-10

-- Create the game_plays table
CREATE TABLE IF NOT EXISTS game_plays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    game_id TEXT NOT NULL,
    score_achieved INTEGER DEFAULT 0,
    difficulty_played TEXT DEFAULT 'orta',
    duration_seconds INTEGER DEFAULT 0,
    lives_remaining INTEGER,
    metadata JSONB DEFAULT '{}',
    workshop_type TEXT, -- 'tablet' or 'bireysel'
    intelligence_type TEXT, -- Turkish intelligence type classification
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grant permissions
ALTER TABLE game_plays ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (security handled at application layer)
CREATE POLICY "Anyone can insert game plays"
ON game_plays FOR INSERT
WITH CHECK (true);

-- Allow anyone to view (for analytics dashboards)
CREATE POLICY "Anyone can view game plays"
ON game_plays FOR SELECT
USING (true);

-- Index for faster filtering by workshop type
CREATE INDEX IF NOT EXISTS idx_game_plays_workshop_type ON game_plays(workshop_type);

-- Index for intelligence type analytics
CREATE INDEX IF NOT EXISTS idx_game_plays_intelligence_type ON game_plays(intelligence_type);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_game_plays_user_id ON game_plays(user_id);

-- Index for game_id lookups
CREATE INDEX IF NOT EXISTS idx_game_plays_game_id ON game_plays(game_id);

-- Comment
COMMENT ON TABLE game_plays IS 'Stores game play data for talent workshops analytics';
COMMENT ON COLUMN game_plays.workshop_type IS 'Workshop category: tablet (1. Aşama) or bireysel (2. Aşama)';
COMMENT ON COLUMN game_plays.intelligence_type IS 'Turkish intelligence type classification for analytics';


