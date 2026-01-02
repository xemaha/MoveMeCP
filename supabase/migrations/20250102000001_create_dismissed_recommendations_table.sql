-- Create table for dismissed recommendations (cross-device persistence)
CREATE TABLE IF NOT EXISTS dismissed_recommendations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  movie_id TEXT NOT NULL,
  dismissed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, movie_id)
);

-- Add index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_dismissed_recommendations_user_id 
  ON dismissed_recommendations(user_id);

CREATE INDEX IF NOT EXISTS idx_dismissed_recommendations_movie_id 
  ON dismissed_recommendations(movie_id);

-- Enable RLS
ALTER TABLE dismissed_recommendations ENABLE ROW LEVEL SECURITY;

-- Allow users to manage their own dismissed recommendations
CREATE POLICY "Users can view their own dismissed recommendations"
  ON dismissed_recommendations
  FOR SELECT
  USING (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can insert their own dismissed recommendations"
  ON dismissed_recommendations
  FOR INSERT
  WITH CHECK (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can delete their own dismissed recommendations"
  ON dismissed_recommendations
  FOR DELETE
  USING (user_id = current_setting('app.current_user_id', true));
