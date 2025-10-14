-- Migration 012: Add Store Hours Time Validation
-- Ensures that close_time is always after open_time for open days

-- Add CHECK constraint to validate opening and closing times
ALTER TABLE store_hours
ADD CONSTRAINT check_valid_hours
CHECK (
  -- If the store is closed, no validation needed
  (is_open = false) OR
  -- If the store is open, close_time must be after open_time
  (is_open = true AND close_time > open_time)
);

-- Add comment
COMMENT ON CONSTRAINT check_valid_hours ON store_hours IS
'Ensures that closing time is always after opening time for days when the store is open';
