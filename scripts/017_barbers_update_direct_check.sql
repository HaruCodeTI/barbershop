-- Migration 017: Barbers UPDATE with Direct Store Check
-- Uses direct join to verify manager in same store

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
    OR auth.uid() = barbers.id
  )
  WITH CHECK (
    -- After update, must still be in a store where current user is manager
    EXISTS (
      SELECT 1 FROM barbers manager
      WHERE manager.id = auth.uid()
      AND manager.role = 'manager'
      AND manager.store_id = barbers.store_id
    )
    OR auth.uid() = barbers.id
  );

COMMENT ON POLICY "barbers_update_manager" ON barbers IS
'Managers can update staff in their store. Users can update themselves.';
