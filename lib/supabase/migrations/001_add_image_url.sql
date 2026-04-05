-- Add image_url column to restaurants table
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS image_url TEXT;
