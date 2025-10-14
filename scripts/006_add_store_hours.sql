-- Migration: Add store_hours table for operating hours management
-- Created: 2025-01-13

-- Create store_hours table
CREATE TABLE IF NOT EXISTS store_hours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
  is_open BOOLEAN DEFAULT true,
  open_time TIME NOT NULL,
  close_time TIME NOT NULL,
  break_start TIME,
  break_end TIME,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, day_of_week)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_store_hours_store_id ON store_hours(store_id);
CREATE INDEX IF NOT EXISTS idx_store_hours_day_of_week ON store_hours(day_of_week);

-- Add RLS policies
ALTER TABLE store_hours ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view store hours (public information)
CREATE POLICY "store_hours_select_all" ON store_hours
  FOR SELECT
  USING (true);

-- Policy: Only managers can insert store hours
CREATE POLICY "store_hours_insert_manager" ON store_hours
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM barbers
      WHERE barbers.id = auth.uid()
      AND barbers.store_id = store_hours.store_id
      AND barbers.role = 'manager'
    )
  );

-- Policy: Only managers can update store hours
CREATE POLICY "store_hours_update_manager" ON store_hours
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM barbers
      WHERE barbers.id = auth.uid()
      AND barbers.store_id = store_hours.store_id
      AND barbers.role = 'manager'
    )
  );

-- Policy: Only managers can delete store hours
CREATE POLICY "store_hours_delete_manager" ON store_hours
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM barbers
      WHERE barbers.id = auth.uid()
      AND barbers.store_id = store_hours.store_id
      AND barbers.role = 'manager'
    )
  );

-- Add comment to table
COMMENT ON TABLE store_hours IS 'Store operating hours by day of week';
COMMENT ON COLUMN store_hours.day_of_week IS '0=Sunday, 1=Monday, ..., 6=Saturday';
COMMENT ON COLUMN store_hours.is_open IS 'Whether the store is open on this day';
COMMENT ON COLUMN store_hours.break_start IS 'Optional break period start time';
COMMENT ON COLUMN store_hours.break_end IS 'Optional break period end time';
