-- Migration 020: Simplify Barbers Policies
-- Removes complex joins that may cause id evaluation issues

-- ========================================
-- BARBERS UPDATE POLICY - Simplified
-- ========================================

DROP POLICY IF EXISTS "barbers_update_manager" ON barbers;

CREATE POLICY "barbers_update_manager" ON barbers
  FOR UPDATE
  USING (
    -- User must be manager in same store OR updating themselves
    store_id IN (
      SELECT store_id FROM barbers
      WHERE id = auth.uid()
      AND role = 'manager'
    )
    OR id = auth.uid()
  )
  WITH CHECK (
    -- After update, verify same conditions
    store_id IN (
      SELECT store_id FROM barbers
      WHERE id = auth.uid()
      AND role = 'manager'
    )
    OR id = auth.uid()
  );

-- ========================================
-- BARBERS INSERT POLICY - Simplified
-- ========================================

DROP POLICY IF EXISTS "barbers_insert_manager" ON barbers;

CREATE POLICY "barbers_insert_manager" ON barbers
  FOR INSERT
  WITH CHECK (
    -- New barber must be in same store as current manager
    store_id IN (
      SELECT store_id FROM barbers
      WHERE id = auth.uid()
      AND role = 'manager'
    )
  );

-- Add comments
COMMENT ON POLICY "barbers_update_manager" ON barbers IS
'Managers can update staff in their store. Users can update themselves.';

COMMENT ON POLICY "barbers_insert_manager" ON barbers IS
'Managers can add staff members only to their own store.';
