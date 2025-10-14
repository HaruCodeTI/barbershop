-- Migration 013: Fix Store Hours RLS Policies (Final Fix)
-- Uses subquery approach to correctly reference store_hours columns

-- Drop all existing policies
DROP POLICY IF EXISTS "store_hours_select_all" ON store_hours;
DROP POLICY IF EXISTS "store_hours_insert_manager" ON store_hours;
DROP POLICY IF EXISTS "store_hours_update_manager" ON store_hours;
DROP POLICY IF EXISTS "store_hours_delete_manager" ON store_hours;

-- Recreate SELECT policy (public read)
CREATE POLICY "store_hours_select_all" ON store_hours
  FOR SELECT
  USING (true);

-- Recreate INSERT policy with correct column reference using NEW record
-- In INSERT policies with WITH CHECK, we need to use the NEW record columns directly
CREATE POLICY "store_hours_insert_manager" ON store_hours
  FOR INSERT
  WITH CHECK (
    -- Check if current user is a manager for this store
    store_id IN (
      SELECT barbers.store_id
      FROM barbers
      WHERE barbers.id = auth.uid()
      AND barbers.role = 'manager'
      AND barbers.is_active = true
    )
  );

-- Recreate UPDATE policy
CREATE POLICY "store_hours_update_manager" ON store_hours
  FOR UPDATE
  USING (
    -- Check if current user is a manager for this store
    store_id IN (
      SELECT barbers.store_id
      FROM barbers
      WHERE barbers.id = auth.uid()
      AND barbers.role = 'manager'
      AND barbers.is_active = true
    )
  );

-- Recreate DELETE policy
CREATE POLICY "store_hours_delete_manager" ON store_hours
  FOR DELETE
  USING (
    -- Check if current user is a manager for this store
    store_id IN (
      SELECT barbers.store_id
      FROM barbers
      WHERE barbers.id = auth.uid()
      AND barbers.role = 'manager'
      AND barbers.is_active = true
    )
  );

-- Add helpful comments
COMMENT ON POLICY "store_hours_select_all" ON store_hours IS
'Anyone can view store hours (public information)';
COMMENT ON POLICY "store_hours_insert_manager" ON store_hours IS
'Only active managers can insert store hours for their store';
COMMENT ON POLICY "store_hours_update_manager" ON store_hours IS
'Only active managers can update store hours for their store';
COMMENT ON POLICY "store_hours_delete_manager" ON store_hours IS
'Only active managers can delete store hours for their store';
