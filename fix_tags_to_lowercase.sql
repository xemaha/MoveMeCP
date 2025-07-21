-- Update all tags to lowercase in the 'tags' table
UPDATE tags
SET name = LOWER(name)
WHERE name <> LOWER(name);

-- Optionally, update movie_tags to ensure tag_id references are still valid (if you ever use tag names as keys elsewhere)
-- But with proper foreign keys, this should not be needed.

-- (Optional) Add a unique index to prevent future case-duplicates
-- CREATE UNIQUE INDEX IF NOT EXISTS unique_tag_name ON tags (LOWER(name));
