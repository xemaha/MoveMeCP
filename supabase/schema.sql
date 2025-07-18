-- Create movies table
CREATE TABLE IF NOT EXISTS movies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content_type VARCHAR(50) DEFAULT 'film' CHECK (content_type IN ('film', 'buch', 'serie')),
  created_by VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ratings table
CREATE TABLE IF NOT EXISTS ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  user_id VARCHAR(255),
  user_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  color VARCHAR(7) DEFAULT '#3B82F6', -- Default blue color
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create movie_tags junction table (many-to-many)
CREATE TABLE IF NOT EXISTS movie_tags (
  movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (movie_id, tag_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ratings_movie_id ON ratings(movie_id);
CREATE INDEX IF NOT EXISTS idx_movie_tags_movie_id ON movie_tags(movie_id);
CREATE INDEX IF NOT EXISTS idx_movie_tags_tag_id ON movie_tags(tag_id);

-- Enable Row Level Security (RLS)
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE movie_tags ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since we don't have authentication yet)
CREATE POLICY "Anyone can view movies" ON movies FOR SELECT USING (true);
CREATE POLICY "Anyone can insert movies" ON movies FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update movies" ON movies FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete movies" ON movies FOR DELETE USING (true);

CREATE POLICY "Anyone can view ratings" ON ratings FOR SELECT USING (true);
CREATE POLICY "Anyone can insert ratings" ON ratings FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update ratings" ON ratings FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete ratings" ON ratings FOR DELETE USING (true);

CREATE POLICY "Anyone can view tags" ON tags FOR SELECT USING (true);
CREATE POLICY "Anyone can insert tags" ON tags FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update tags" ON tags FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete tags" ON tags FOR DELETE USING (true);

CREATE POLICY "Anyone can view movie_tags" ON movie_tags FOR SELECT USING (true);
CREATE POLICY "Anyone can insert movie_tags" ON movie_tags FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update movie_tags" ON movie_tags FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete movie_tags" ON movie_tags FOR DELETE USING (true);

-- Insert some sample tags
INSERT INTO tags (name, color) VALUES 
  ('Action', '#EF4444'),
  ('Comedy', '#F59E0B'),
  ('Drama', '#8B5CF6'),
  ('Horror', '#1F2937'),
  ('Romance', '#EC4899'),
  ('Sci-Fi', '#06B6D4'),
  ('Thriller', '#DC2626'),
  ('Animation', '#10B981'),
  ('Documentary', '#6B7280'),
  ('Fantasy', '#7C3AED')
ON CONFLICT (name) DO NOTHING;
