-- Supabase schema for Michelin restaurants
-- This creates the restaurants table and related indexes for efficient searching

-- Create restaurants table
CREATE TABLE IF NOT EXISTS restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  location VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  country VARCHAR(100) NOT NULL,
  stars INTEGER NOT NULL CHECK (stars IN (1, 2, 3)),
  cuisine VARCHAR(255) NOT NULL,
  price_level INTEGER NOT NULL CHECK (price_level IN (1, 2, 3, 4)),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  phone VARCHAR(50),
  website TEXT,
  michelin_url TEXT,
  green_star BOOLEAN NOT NULL DEFAULT false,
  facilities TEXT[], -- Array of facility strings
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient searching and filtering
CREATE INDEX IF NOT EXISTS idx_restaurants_stars ON restaurants (stars);
CREATE INDEX IF NOT EXISTS idx_restaurants_city ON restaurants (city);
CREATE INDEX IF NOT EXISTS idx_restaurants_country ON restaurants (country);
CREATE INDEX IF NOT EXISTS idx_restaurants_cuisine ON restaurants (cuisine);
CREATE INDEX IF NOT EXISTS idx_restaurants_price_level ON restaurants (price_level);
CREATE INDEX IF NOT EXISTS idx_restaurants_green_star ON restaurants (green_star);
CREATE INDEX IF NOT EXISTS idx_restaurants_location ON restaurants USING GIST (ST_Point(longitude, latitude));

-- Enable full-text search on name, cuisine, and description
CREATE INDEX IF NOT EXISTS idx_restaurants_search ON restaurants USING GIN (
  to_tsvector('english', name || ' ' || cuisine || ' ' || description)
);

-- Create a view for easy querying with geographic calculations
CREATE OR REPLACE VIEW restaurants_with_distance AS
SELECT *,
  CASE 
    WHEN stars = 1 THEN 'One Star'
    WHEN stars = 2 THEN 'Two Stars' 
    WHEN stars = 3 THEN 'Three Stars'
  END as award_display,
  CASE
    WHEN price_level = 1 THEN '$'
    WHEN price_level = 2 THEN '$$'
    WHEN price_level = 3 THEN '$$$'
    WHEN price_level = 4 THEN '$$$$'
  END as price_display
FROM restaurants;

-- Enable Row Level Security (optional - uncomment if needed)
-- ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow read access to all users (uncomment if RLS is enabled)
-- CREATE POLICY "Allow read access to all users" ON restaurants FOR SELECT USING (true);