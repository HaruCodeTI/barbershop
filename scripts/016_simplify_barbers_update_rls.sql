-- Migration 016: Simplify Barbers UPDATE RLS Policy
-- Removes is_active check from WITH CHECK to avoid circular dependency

DROP POLICY IF EXISTS "barbers_update_manager" ON barbers;

CREATE POLICY "barbers_update_manager" ON barbers
  FOR UPDATE
  USING (
    -- User can access the row if they are a manager OR updating themselves
    (
      auth.uid() IN (
        SELECT id FROM barbers
        WHERE role = 'manager'
        -- Don't check is_active here because we might be activating/deactivating
      )
    )
    OR (auth.uid() = id)
  )
  WITH CHECK (
    -- After update, verify user has permission
    -- Either they are a manager of the same store OR updating themselves
    (
      store_id IN (
        SELECT store_id FROM barbers
        WHERE id = auth.uid()
        AND role = 'manager'
        -- Don't check is_active to avoid circular dependency
      )
    )
    OR (auth.uid() = id)
  );

COMMENT ON POLICY "barbers_update_manager" ON barbers IS
'Managers can update any staff member in their store (including activation/deactivation). Users can update their own profile.';
