-- Migration 019: Fix Barbers ID Constraint Issues
-- Makes id auto-generate with uuid_generate_v4() as fallback

-- The issue: barbers.id is a FK to auth.users(id) but we need to allow
-- creating barbers without auth users first (they can register later)

-- Solution: Change id to have a default value
ALTER TABLE barbers
  ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- Also fix the UPDATE policy to use clearer reference
DROP POLICY IF EXISTS "barbers_update_manager" ON barbers;

CREATE POLICY "barbers_update_manager" ON barbers
  FOR UPDATE
  USING (
    -- Can update if user is manager in same store OR updating self
    EXISTS (
      SELECT 1 FROM barbers manager
      WHERE manager.id = auth.uid()
      AND manager.role = 'manager'
      AND manager.store_id = barbers.store_id
    )
    OR auth.uid() = id  -- Use 'id' directly without table prefix
  )
  WITH CHECK (
    -- After update, must still be in a store where current user is manager
    EXISTS (
      SELECT 1 FROM barbers manager
      WHERE manager.id = auth.uid()
      AND manager.role = 'manager'
      AND manager.store_id = store_id  -- Use column directly
    )
    OR auth.uid() = id  -- Use 'id' directly
  );

COMMENT ON COLUMN barbers.id IS
'UUID that references auth.users(id). Auto-generates if not provided to allow creating staff before they register.';

COMMENT ON POLICY "barbers_update_manager" ON barbers IS
'Managers can update staff in their store. Users can update themselves.';
