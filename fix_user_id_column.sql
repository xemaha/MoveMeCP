-- Fix user_id column type in ratings table
-- This script changes the user_id column from UUID to TEXT to allow flexible user IDs

-- First, drop the foreign key constraint if it exists
ALTER TABLE ratings DROP CONSTRAINT IF EXISTS ratings_user_id_fkey;

-- Change the column type from UUID to TEXT
ALTER TABLE ratings ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

-- If you have a users table and want to keep the relationship:
-- ALTER TABLE users ALTER COLUMN id TYPE TEXT USING id::TEXT;
-- ALTER TABLE ratings ADD CONSTRAINT ratings_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);

-- Or if you want to keep UUID format, make sure all user IDs are proper UUIDs
-- This is the alternative approach - but would require changing all existing data
