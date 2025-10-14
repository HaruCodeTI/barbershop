-- Migration 018: Fix ALL Manager RLS Policies
-- Comprehensive fix for INSERT and UPDATE policies across all tables

-- ========================================
-- SERVICES TABLE
-- ========================================

-- Drop and recreate INSERT policy with store_id check
DROP POLICY IF EXISTS "services_insert_staff" ON services;

CREATE POLICY "services_insert_staff" ON services
  FOR INSERT
  WITH CHECK (
    -- User must be manager or attendant in the SAME store
    EXISTS (
      SELECT 1 FROM barbers
      WHERE barbers.id = auth.uid()
      AND barbers.role IN ('manager', 'attendant')
      AND barbers.store_id = services.store_id
    )
  );

-- Drop and recreate UPDATE policy with store_id check
DROP POLICY IF EXISTS "services_update_staff" ON services;

CREATE POLICY "services_update_staff" ON services
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM barbers
      WHERE barbers.id = auth.uid()
      AND barbers.role IN ('manager', 'attendant')
      AND barbers.store_id = services.store_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM barbers
      WHERE barbers.id = auth.uid()
      AND barbers.role IN ('manager', 'attendant')
      AND barbers.store_id = services.store_id
    )
  );

-- ========================================
-- BARBERS TABLE
-- ========================================

-- Drop and recreate INSERT policy with store_id check
DROP POLICY IF EXISTS "barbers_insert_manager" ON barbers;

CREATE POLICY "barbers_insert_manager" ON barbers
  FOR INSERT
  WITH CHECK (
    -- User must be manager in the SAME store as new barber
    EXISTS (
      SELECT 1 FROM barbers manager
      WHERE manager.id = auth.uid()
      AND manager.role = 'manager'
      AND manager.store_id = barbers.store_id
    )
  );

-- UPDATE policy already fixed in migration 017, but let's ensure it's correct
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

-- ========================================
-- COMMENTS
-- ========================================

COMMENT ON POLICY "services_insert_staff" ON services IS
'Managers and attendants can create services only in their own store';

COMMENT ON POLICY "services_update_staff" ON services IS
'Managers and attendants can update services only in their own store';

COMMENT ON POLICY "barbers_insert_manager" ON barbers IS
'Managers can add staff members only to their own store';

COMMENT ON POLICY "barbers_update_manager" ON barbers IS
'Managers can update staff in their store. Users can update themselves';
