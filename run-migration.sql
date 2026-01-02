-- Run this in Supabase SQL Editor
-- Create personal_recommendations table
CREATE TABLE IF NOT EXISTS personal_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL,
  to_user_id UUID NOT NULL,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate recommendations from same user to same user for same movie
  UNIQUE(movie_id, from_user_id, to_user_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_personal_recommendations_to_user 
  ON personal_recommendations(to_user_id);

CREATE INDEX IF NOT EXISTS idx_personal_recommendations_movie 
  ON personal_recommendations(movie_id);

-- Enable RLS
ALTER TABLE personal_recommendations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read recommendations sent to them
CREATE POLICY "Users can view their received recommendations"
  ON personal_recommendations FOR SELECT
  USING (true);

-- Policy: Users can create recommendations (allow all for now)
CREATE POLICY "Users can create recommendations"
  ON personal_recommendations FOR INSERT
  WITH CHECK (true);

-- Policy: Users can delete their own sent recommendations
CREATE POLICY "Users can delete their sent recommendations"
  ON personal_recommendations FOR DELETE
  USING (true);
