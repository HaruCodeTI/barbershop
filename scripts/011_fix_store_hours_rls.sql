-- Migration 011: Fix Store Hours RLS Policies
-- Fixes column reference issue in RLS policies for store_hours table

-- Drop existing policies
DROP POLICY IF EXISTS "store_hours_insert_manager" ON store_hours;
DROP POLICY IF EXISTS "store_hours_update_manager" ON store_hours;
DROP POLICY IF EXISTS "store_hours_delete_manager" ON store_hours;

-- Recreate INSERT policy with correct column reference
CREATE POLICY "store_hours_insert_manager" ON store_hours
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM barbers
      WHERE barbers.id = auth.uid()
      AND barbers.store_id = store_id  -- Reference column directly without table prefix
      AND barbers.role = 'manager'
    )
  );

-- Recreate UPDATE policy with correct column reference
CREATE POLICY "store_hours_update_manager" ON store_hours
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM barbers
      WHERE barbers.id = auth.uid()
      AND barbers.store_id = store_id  -- Reference column directly without table prefix
      AND barbers.role = 'manager'
    )
  );

-- Recreate DELETE policy with correct column reference
CREATE POLICY "store_hours_delete_manager" ON store_hours
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM barbers
      WHERE barbers.id = auth.uid()
      AND barbers.store_id = store_id  -- Reference column directly without table prefix
      AND barbers.role = 'manager'
    )
  );

-- Add comments
COMMENT ON POLICY "store_hours_insert_manager" ON store_hours IS
'Only managers can insert store hours for their store';
COMMENT ON POLICY "store_hours_update_manager" ON store_hours IS
'Only managers can update store hours for their store';
COMMENT ON POLICY "store_hours_delete_manager" ON store_hours IS
'Only managers can delete store hours for their store';
