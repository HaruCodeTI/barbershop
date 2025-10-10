-- Add missing columns to barbers table for ratings and specialties
ALTER TABLE barbers 
ADD COLUMN IF NOT EXISTS rating DECIMAL(2, 1) DEFAULT 4.5 CHECK (rating >= 0 AND rating <= 5),
ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS specialties TEXT[] DEFAULT '{}';

-- Add index for better performance on rating queries
CREATE INDEX IF NOT EXISTS idx_barbers_rating ON barbers(rating DESC);

-- Update existing barbers with default values if they don't have them
UPDATE barbers 
SET 
  rating = 4.5,
  total_reviews = 0,
  specialties = ARRAY['Cortes', 'Barba']
WHERE rating IS NULL OR total_reviews IS NULL OR specialties IS NULL;
