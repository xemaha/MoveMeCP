-- Create watchlist table if it doesn't exist
CREATE TABLE IF NOT EXISTS watchlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_user_movie_watchlist UNIQUE (user_id, movie_id)
);

-- Add RLS policies
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY watchlist_select_policy ON watchlist
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY watchlist_insert_policy ON watchlist
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY watchlist_delete_policy ON watchlist
  FOR DELETE USING (auth.uid() = user_id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS watchlist_user_movie_idx ON watchlist(user_id, movie_id);
