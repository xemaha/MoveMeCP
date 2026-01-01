-- Create user_provider_profiles table to store user's personal streaming service configuration
CREATE TABLE IF NOT EXISTS user_provider_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL UNIQUE,
  flatrate_providers INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  rent_providers INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  buy_providers INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_provider_profiles ENABLE ROW LEVEL SECURITY;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_provider_profiles_user_id ON user_provider_profiles(user_id);
