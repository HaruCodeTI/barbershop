-- Migration 021: Make Barbers ID FK Flexible
-- Allows creating barbers before auth users exist

-- Drop the FK constraint
ALTER TABLE barbers
  DROP CONSTRAINT IF EXISTS barbers_id_fkey;

-- Recreate it with ON DELETE SET NULL to allow orphaned records
-- This allows us to create barbers with generated UUIDs
-- When user registers, we can update the barber.id to match auth.users.id

-- Actually, better approach: make it DEFERRABLE so we can insert first
-- But even better: just remove the FK entirely and handle it in application logic

-- For now, keep it simple: no FK constraint
-- We'll manage the relationship in application code

COMMENT ON COLUMN barbers.id IS
'UUID that can reference auth.users(id) when user registers. Can be a generated UUID for staff created before auth registration.';
