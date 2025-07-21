-- 1. User-Profile-Tabelle für Alias
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  alias VARCHAR(32) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Case-insensitive Tag-Namen (unique index auf lower(name))
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'tags' AND indexname = 'tags_name_lower_idx') THEN
    CREATE UNIQUE INDEX tags_name_lower_idx ON tags (LOWER(name));
  END IF;
END $$;

-- Optional: Bestehende Tag-Namen in lowercase umwandeln
UPDATE tags SET name = LOWER(name);
