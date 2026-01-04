-- Add tmdb-related columns to movies table
ALTER TABLE movies
  ADD COLUMN IF NOT EXISTS tmdb_id BIGINT,
  ADD COLUMN IF NOT EXISTS poster_url TEXT,
  ADD COLUMN IF NOT EXISTS media_type TEXT,
  ADD COLUMN IF NOT EXISTS director TEXT,
  ADD COLUMN IF NOT EXISTS actor TEXT;

-- Unique index on tmdb_id (ignore nulls)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE tablename = 'movies' AND indexname = 'movies_tmdb_id_uniq'
  ) THEN
    CREATE UNIQUE INDEX movies_tmdb_id_uniq ON movies (tmdb_id) WHERE tmdb_id IS NOT NULL;
  END IF;
END$$;
