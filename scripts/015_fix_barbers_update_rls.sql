-- Migration 015: Fix Barbers UPDATE RLS Policy
-- Adds WITH CHECK clause to allow managers to update staff members

-- Drop and recreate the UPDATE policy with proper WITH CHECK
DROP POLICY IF EXISTS "barbers_update_manager" ON barbers;

CREATE POLICY "barbers_update_manager" ON barbers
  FOR UPDATE
  USING (
    -- User can update if they are a manager OR updating themselves
    (
      auth.uid() IN (
        SELECT id FROM barbers
        WHERE role = 'manager'
        AND is_active = true
      )
    )
    OR (auth.uid() = id)
  )
  WITH CHECK (
    -- After update, the record must belong to a store where user is manager
    -- OR the user is updating themselves
    (
      store_id IN (
        SELECT store_id FROM barbers
        WHERE id = auth.uid()
        AND role = 'manager'
        AND is_active = true
      )
    )
    OR (auth.uid() = id)
  );

-- Add helpful comment
COMMENT ON POLICY "barbers_update_manager" ON barbers IS
'Managers can update any staff member in their store. Users can update their own profile.';
